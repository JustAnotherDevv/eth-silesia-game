import { Hono } from 'hono'
import { supabase } from '../supabase.js'
import { requireAdmin } from '../middleware/auth.js'
import { validateUUID, sanitizeSearch, LIMITS } from '../middleware/validate.js'
import { sanitizeError } from '../middleware/errorHandler.js'

export const admin = new Hono()

// A01: All admin routes require JWT + DB-verified admin status
admin.use('*', requireAdmin)

// ── Feature flags ────────────────────────────────────────────────

admin.get('/flags', async (c) => {
  const { data, error } = await supabase
    .from('feature_flags').select('*').order('category').order('key')
  if (error) return c.json({ error: sanitizeError(error) }, 500)
  return c.json(data ?? [])
})

admin.patch('/flags/:key', async (c) => {
  const userId = c.get('userId')
  const key = c.req.param('key')

  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ error: 'invalid JSON' }, 400) }

  const { enabled } = body as Record<string, unknown>
  if (typeof enabled !== 'boolean') return c.json({ error: 'enabled must be boolean' }, 400)

  // A05: key comes from URL path, not user-controlled body — but still restrict chars
  if (!/^[a-z0-9_]+$/.test(key)) return c.json({ error: 'invalid flag key' }, 400)

  const { data, error } = await supabase
    .from('feature_flags')
    .update({ enabled, updated_at: new Date().toISOString(), updated_by: userId })
    .eq('key', key)
    .select()
    .single()

  if (error) return c.json({ error: sanitizeError(error) }, 500)
  if (!data) return c.json({ error: 'flag not found' }, 404)
  return c.json(data)
})

// ── Platform stats ───────────────────────────────────────────────

admin.get('/stats', async (c) => {
  try {
    const today = new Date().toISOString().slice(0, 10)
    const [users, activeToday, games, xpTotal, badgesRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('last_active', today),
      supabase.from('game_results').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('xp'),
      supabase.from('user_badges').select('id', { count: 'exact', head: true }),
    ])
    const totalXp = (xpTotal.data ?? []).reduce((s: number, u: { xp: number }) => s + (u.xp ?? 0), 0)
    return c.json({
      totalUsers:  users.count ?? 0,
      activeToday: activeToday.count ?? 0,
      totalGames:  games.count ?? 0,
      totalXp,
      totalBadges: badgesRes.count ?? 0,
    })
  } catch {
    return c.json({ error: 'failed to fetch stats' }, 500)
  }
})

// ── Members management ───────────────────────────────────────────

admin.get('/members', async (c) => {
  // A05: sanitize search before interpolating into query
  const rawSearch = c.req.query('search') ?? ''
  const search    = sanitizeSearch(rawSearch)
  const limit     = Math.min(Math.max(1, Number(c.req.query('limit') ?? 50)), 100)
  const offset    = Math.max(0, Number(c.req.query('offset') ?? 0))

  let query = supabase
    .from('users')
    .select('id, username, display_name, avatar, xp, streak, last_active, is_platform_admin, created_at')
    .order('xp', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    // A05: use parameterized filter — Supabase handles escaping internally
    query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) return c.json({ error: sanitizeError(error) }, 500)
  return c.json(data ?? [])
})

admin.patch('/members/:id', validateUUID('id'), async (c) => {
  const id = c.req.param('id')
  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ error: 'invalid JSON' }, 400) }

  const obj = body as Record<string, unknown>
  const updates: Record<string, unknown> = {}

  if (typeof obj.is_platform_admin === 'boolean') updates.is_platform_admin = obj.is_platform_admin

  if (Object.keys(updates).length === 0) return c.json({ error: 'nothing to update' }, 400)

  const { data, error } = await supabase
    .from('users').update(updates).eq('id', id).select().single()

  if (error) return c.json({ error: sanitizeError(error) }, 500)
  return c.json(data)
})

admin.delete('/members/:id', validateUUID('id'), async (c) => {
  const callerId = c.get('userId')
  const id = c.req.param('id')

  if (id === callerId) return c.json({ error: 'cannot remove yourself' }, 400)

  const { error } = await supabase.from('org_members').delete().eq('user_id', id)
  if (error) return c.json({ error: sanitizeError(error) }, 500)
  return c.json({ success: true })
})

// ── Invite codes ─────────────────────────────────────────────────

admin.get('/invite-codes', async (c) => {
  const { data, error } = await supabase
    .from('invite_codes')
    .select('id, code, uses, max_uses, active, created_at, orgs(id, name, emoji)')
    .order('created_at', { ascending: false })
  if (error) return c.json({ error: sanitizeError(error) }, 500)
  return c.json(data ?? [])
})

admin.post('/invite-codes', async (c) => {
  const userId = c.get('userId')
  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ error: 'invalid JSON' }, 400) }

  const { orgId, maxUses } = body as Record<string, unknown>

  // A05: validate orgId is UUID if provided
  if (orgId !== undefined && (typeof orgId !== 'string' || !/^[0-9a-f-]{36}$/i.test(orgId as string))) {
    return c.json({ error: 'invalid orgId' }, 400)
  }

  // A04: use crypto-strong random for invite codes
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const randBytes = new Uint8Array(6)
  crypto.getRandomValues(randBytes)
  const code = Array.from(randBytes, b => chars[b % chars.length]).join('')

  const payload: Record<string, unknown> = { code, active: true, uses: 0, created_by: userId }
  if (orgId) payload.org_id = orgId
  if (maxUses !== undefined && maxUses !== null) {
    const n = Number(maxUses)
    if (!Number.isInteger(n) || n < 1 || n > 100_000) {
      return c.json({ error: 'maxUses must be a positive integer ≤ 100000' }, 400)
    }
    payload.max_uses = n
  }

  if (!orgId) {
    const { data: firstOrg } = await supabase.from('orgs').select('id').limit(1).maybeSingle()
    if (!firstOrg) return c.json({ error: 'no orgs exist' }, 400)
    payload.org_id = firstOrg.id
  }

  const { data, error } = await supabase.from('invite_codes').insert(payload).select().single()
  if (error) return c.json({ error: sanitizeError(error) }, 500)
  return c.json(data, 201)
})

admin.patch('/invite-codes/:id', validateUUID('id'), async (c) => {
  const id = c.req.param('id')
  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ error: 'invalid JSON' }, 400) }

  const obj = body as Record<string, unknown>
  const updates: Record<string, unknown> = {}
  if (typeof obj.active === 'boolean') updates.active = obj.active

  if (Object.keys(updates).length === 0) return c.json({ error: 'nothing to update' }, 400)

  const { data, error } = await supabase
    .from('invite_codes').update(updates).eq('id', id).select().single()
  if (error) return c.json({ error: sanitizeError(error) }, 500)
  return c.json(data)
})

// ── News management ──────────────────────────────────────────────

admin.get('/news', async (c) => {
  const { data, error } = await supabase
    .from('news_items').select('*').order('created_at', { ascending: false })
  if (error) return c.json({ error: sanitizeError(error) }, 500)
  return c.json(data ?? [])
})

admin.post('/news', async (c) => {
  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ error: 'invalid JSON' }, 400) }

  const { headline, source, category } = body as Record<string, unknown>

  // A05: validate and bound inputs
  if (!headline || typeof headline !== 'string') return c.json({ error: 'headline is required' }, 400)
  if (headline.length > LIMITS.HEADLINE_MAX) return c.json({ error: `headline exceeds ${LIMITS.HEADLINE_MAX} chars` }, 400)
  if (source !== undefined && (typeof source !== 'string' || source.length > 100)) return c.json({ error: 'invalid source' }, 400)

  const VALID_CATEGORIES = ['news', 'tip', 'alert', 'feature']
  const safeCategory = VALID_CATEGORIES.includes(String(category)) ? String(category) : 'news'

  const { data, error } = await supabase
    .from('news_items')
    .insert({ headline: headline.trim(), source: source ?? 'Knowly', category: safeCategory, active: true })
    .select()
    .single()

  if (error) return c.json({ error: sanitizeError(error) }, 500)
  return c.json(data, 201)
})

admin.patch('/news/:id', validateUUID('id'), async (c) => {
  const id = c.req.param('id')
  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ error: 'invalid JSON' }, 400) }

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return c.json({ error: 'request body must be a JSON object' }, 400)
  }
  const obj = body as Record<string, unknown>
  const updates: Record<string, unknown> = {}
  if (typeof obj.active   === 'boolean') updates.active   = obj.active
  if (typeof obj.headline === 'string') {
    const trimmed = obj.headline.trim()
    if (!trimmed) return c.json({ error: 'headline cannot be empty' }, 400)
    if (trimmed.length > LIMITS.HEADLINE_MAX) return c.json({ error: `headline exceeds ${LIMITS.HEADLINE_MAX} chars` }, 400)
    updates.headline = trimmed
  }

  if (Object.keys(updates).length === 0) return c.json({ error: 'nothing to update' }, 400)

  const { data, error } = await supabase
    .from('news_items').update(updates).eq('id', id).select().single()
  if (error) return c.json({ error: sanitizeError(error) }, 500)
  return c.json(data)
})

admin.delete('/news/:id', validateUUID('id'), async (c) => {
  const { error } = await supabase.from('news_items').delete().eq('id', c.req.param('id'))
  if (error) return c.json({ error: sanitizeError(error) }, 500)
  return c.json({ success: true })
})

// ── Promote user to admin ────────────────────────────────────────

admin.post('/promote/:id', validateUUID('id'), async (c) => {
  const { data, error } = await supabase
    .from('users')
    .update({ is_platform_admin: true })
    .eq('id', c.req.param('id'))
    .select('id, username, is_platform_admin')
    .single()
  if (error) return c.json({ error: sanitizeError(error) }, 500)
  return c.json(data)
})

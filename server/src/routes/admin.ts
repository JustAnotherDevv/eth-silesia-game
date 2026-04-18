import { Hono } from 'hono'
import { supabase } from '../supabase.js'

export const admin = new Hono()

// Middleware: verify caller is a platform admin
admin.use('*', async (c, next) => {
  const userId = c.req.header('X-User-Id')
  if (!userId) return c.json({ error: 'unauthorized' }, 401)

  const { data } = await supabase
    .from('users')
    .select('is_platform_admin')
    .eq('id', userId)
    .maybeSingle()

  if (!data?.is_platform_admin) return c.json({ error: 'forbidden' }, 403)
  await next()
})

// ── Feature flags ────────────────────────────────────────────────

admin.get('/flags', async (c) => {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('*')
    .order('category')
    .order('key')
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})

admin.patch('/flags/:key', async (c) => {
  const userId = c.req.header('X-User-Id')!
  const key = c.req.param('key')
  const body = await c.req.json()
  const { enabled } = body

  if (typeof enabled !== 'boolean') return c.json({ error: 'enabled must be boolean' }, 400)

  const { data, error } = await supabase
    .from('feature_flags')
    .update({ enabled, updated_at: new Date().toISOString(), updated_by: userId })
    .eq('key', key)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  if (!data) return c.json({ error: 'flag not found' }, 404)
  return c.json(data)
})

// ── Platform stats ───────────────────────────────────────────────

admin.get('/stats', async (c) => {
  const today = new Date().toISOString().slice(0, 10)

  const [users, activeToday, games, xpTotal] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('last_active', today),
    supabase.from('game_results').select('id', { count: 'exact', head: true }),
    supabase.from('users').select('xp'),
  ])

  const totalXp = (xpTotal.data ?? []).reduce((s: number, u: { xp: number }) => s + (u.xp ?? 0), 0)

  const badgesRes = await supabase.from('user_badges').select('id', { count: 'exact', head: true })

  return c.json({
    totalUsers:  users.count ?? 0,
    activeToday: activeToday.count ?? 0,
    totalGames:  games.count ?? 0,
    totalXp,
    totalBadges: badgesRes.count ?? 0,
  })
})

// ── Members management ───────────────────────────────────────────

admin.get('/members', async (c) => {
  const search = c.req.query('search') ?? ''
  const limit  = Math.min(Number(c.req.query('limit') ?? 50), 100)
  const offset = Number(c.req.query('offset') ?? 0)

  let query = supabase
    .from('users')
    .select('id, username, display_name, avatar, xp, streak, last_active, is_platform_admin, created_at')
    .order('xp', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`)
  }

  const { data, error } = await query
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})

admin.patch('/members/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const updates: Record<string, unknown> = {}

  if (typeof body.is_platform_admin === 'boolean') updates.is_platform_admin = body.is_platform_admin

  if (Object.keys(updates).length === 0) return c.json({ error: 'nothing to update' }, 400)

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

admin.delete('/members/:id', async (c) => {
  const callerId = c.req.header('X-User-Id')!
  const id = c.req.param('id')
  if (id === callerId) return c.json({ error: 'cannot remove yourself' }, 400)

  // Only remove from orgs, not delete the user
  const { error } = await supabase.from('org_members').delete().eq('user_id', id)
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// ── Invite codes ─────────────────────────────────────────────────

admin.get('/invite-codes', async (c) => {
  const { data, error } = await supabase
    .from('invite_codes')
    .select('id, code, uses, max_uses, active, created_at, orgs(id, name, emoji)')
    .order('created_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})

admin.post('/invite-codes', async (c) => {
  const userId = c.req.header('X-User-Id')!
  const body = await c.req.json()
  const { orgId, maxUses } = body

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')

  const payload: Record<string, unknown> = { code, active: true, uses: 0, created_by: userId }
  if (orgId) payload.org_id = orgId
  if (maxUses) payload.max_uses = maxUses

  // Need an org_id — use first org if not specified
  if (!orgId) {
    const { data: firstOrg } = await supabase.from('orgs').select('id').limit(1).maybeSingle()
    if (!firstOrg) return c.json({ error: 'no orgs exist' }, 400)
    payload.org_id = firstOrg.id
  }

  const { data, error } = await supabase
    .from('invite_codes')
    .insert(payload)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

admin.patch('/invite-codes/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const updates: Record<string, unknown> = {}
  if (typeof body.active === 'boolean') updates.active = body.active

  const { data, error } = await supabase
    .from('invite_codes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// ── News management ──────────────────────────────────────────────

admin.get('/news', async (c) => {
  const { data, error } = await supabase
    .from('news_items')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})

admin.post('/news', async (c) => {
  const body = await c.req.json()
  const { headline, source, category } = body
  if (!headline) return c.json({ error: 'headline is required' }, 400)

  const { data, error } = await supabase
    .from('news_items')
    .insert({ headline, source: source ?? 'XP Gazette', category: category ?? 'news', active: true })
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

admin.patch('/news/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const updates: Record<string, unknown> = {}
  if (typeof body.active   === 'boolean') updates.active   = body.active
  if (typeof body.headline === 'string')  updates.headline = body.headline

  const { data, error } = await supabase
    .from('news_items').update(updates).eq('id', id).select().single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

admin.delete('/news/:id', async (c) => {
  const { error } = await supabase.from('news_items').delete().eq('id', c.req.param('id'))
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

// ── Make user admin (bootstrap) ─────────────────────────────────

admin.post('/promote/:id', async (c) => {
  const { data, error } = await supabase
    .from('users')
    .update({ is_platform_admin: true })
    .eq('id', c.req.param('id'))
    .select('id, username, is_platform_admin')
    .single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

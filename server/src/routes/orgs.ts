import { Hono } from 'hono'
import { supabase } from '../supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { joinCodeLimiter } from '../middleware/rateLimit.js'
import { sanitizeError } from '../middleware/errorHandler.js'

export const orgs = new Hono()

orgs.get('/', async (c) => {
  const { data, error } = await supabase
    .from('orgs')
    .select('id, name, emoji, color, is_public, description, org_members(count)')
    .eq('is_public', true)
    .order('name')

  if (error) return c.json({ error: sanitizeError(error) }, 500)

  return c.json(
    (data ?? []).map(o => ({
      id: o.id,
      name: o.name,
      emoji: o.emoji,
      color: o.color,
      is_public: o.is_public,
      description: o.description,
      member_count: (o.org_members as unknown as { count: number }[])?.[0]?.count ?? 0,
    }))
  )
})

orgs.get('/:id', async (c) => {
  const { data, error } = await supabase
    .from('orgs')
    .select('*, org_members(count)')
    .eq('id', c.req.param('id'))
    .maybeSingle()

  if (error) return c.json({ error: sanitizeError(error) }, 500)
  if (!data) return c.json({ error: 'not found' }, 404)

  const { org_members, ...rest } = data as Record<string, unknown> & { org_members: { count: number }[] }
  return c.json({ ...rest, member_count: org_members?.[0]?.count ?? 0 })
})

// A01: require auth for join — userId comes from verified JWT
orgs.post('/:id/join', requireAuth, async (c) => {
  const userId = c.get('userId')

  const { data: org } = await supabase.from('orgs').select('id').eq('id', c.req.param('id')).maybeSingle()
  if (!org) return c.json({ error: 'org not found' }, 404)

  const { error } = await supabase
    .from('org_members')
    .upsert({ user_id: userId, org_id: c.req.param('id') }, { onConflict: 'user_id,org_id', ignoreDuplicates: true })

  if (error) return c.json({ error: sanitizeError(error) }, 500)
  return c.json({ success: true })
})

// A01 + A07: require auth + rate-limit invite code attempts
orgs.post('/join-by-code', requireAuth, joinCodeLimiter, async (c) => {
  const userId = c.get('userId')

  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ error: 'invalid JSON' }, 400) }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return c.json({ error: 'request body must be a JSON object' }, 400)
  }

  const { code } = body as Record<string, unknown>
  if (!code || typeof code !== 'string') return c.json({ error: 'code required' }, 400)

  // Constrain code length to prevent DoS via oversized string
  if (code.length > 20) return c.json({ error: 'invalid code' }, 400)

  const upperCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '')

  const { data: invite } = await supabase
    .from('invite_codes')
    .select('org_id, uses, max_uses, active')
    .eq('code', upperCode)
    .eq('active', true)
    .maybeSingle()

  let orgId: string
  if (invite) {
    if (invite.max_uses !== null && invite.uses >= invite.max_uses) {
      return c.json({ error: 'invite code has reached its usage limit' }, 400)
    }
    orgId = invite.org_id
    await supabase.from('invite_codes').update({ uses: invite.uses + 1 }).eq('code', upperCode)
  } else {
    const { data: org } = await supabase
      .from('orgs')
      .select('id')
      .ilike('invite_code', upperCode)
      .maybeSingle()

    if (!org) return c.json({ error: 'invalid invite code' }, 404)
    orgId = org.id
  }

  await supabase
    .from('org_members')
    .upsert({ user_id: userId, org_id: orgId }, { onConflict: 'user_id,org_id', ignoreDuplicates: true })

  const { data: joinedOrg } = await supabase.from('orgs').select('*').eq('id', orgId).maybeSingle()
  return c.json(joinedOrg)
})

orgs.get('/:id/members', async (c) => {
  const { data, error } = await supabase
    .from('org_members')
    .select('joined_at, users(id, username, display_name, avatar, xp, streak)')
    .eq('org_id', c.req.param('id'))
    .order('users(xp)', { ascending: false })

  if (error) return c.json({ error: sanitizeError(error) }, 500)
  return c.json(
    (data ?? []).map(row => ({ ...(row.users as object), joined_at: row.joined_at }))
  )
})

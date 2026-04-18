import { Hono } from 'hono'
import { supabase } from '../supabase.js'

export const orgs = new Hono()

orgs.get('/', async (c) => {
  const { data, error } = await supabase
    .from('orgs')
    .select('id, name, emoji, color, is_public, description, org_members(count)')
    .eq('is_public', true)
    .order('name')

  if (error) return c.json({ error: error.message }, 500)

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

  if (error) return c.json({ error: error.message }, 500)
  if (!data) return c.json({ error: 'not found' }, 404)

  const { org_members, ...rest } = data as Record<string, unknown> & { org_members: { count: number }[] }
  return c.json({ ...rest, member_count: org_members?.[0]?.count ?? 0 })
})

orgs.post('/:id/join', async (c) => {
  const { userId } = await c.req.json()
  if (!userId) return c.json({ error: 'userId required' }, 400)

  const { data: org } = await supabase.from('orgs').select('id').eq('id', c.req.param('id')).maybeSingle()
  if (!org) return c.json({ error: 'org not found' }, 404)

  const { error } = await supabase
    .from('org_members')
    .upsert({ user_id: userId, org_id: c.req.param('id') }, { onConflict: 'user_id,org_id', ignoreDuplicates: true })

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ success: true })
})

orgs.post('/join-by-code', async (c) => {
  const { userId, code } = await c.req.json()
  if (!userId || !code) return c.json({ error: 'userId and code required' }, 400)

  const upperCode = code.toUpperCase()

  // Check invite_codes table first (admin-managed codes)
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
    // Fall back to org.invite_code
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

  if (error) return c.json({ error: error.message }, 500)
  return c.json(
    (data ?? []).map(row => ({ ...(row.users as object), joined_at: row.joined_at }))
  )
})

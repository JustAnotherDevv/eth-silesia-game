import { Hono } from 'hono'
import { supabase } from '../supabase.js'

export const users = new Hono()

users.post('/', async (c) => {
  const body = await c.req.json()
  const { id, username, displayName, avatar, orgId, goals } = body

  if (!username || !displayName) {
    return c.json({ error: 'username and displayName are required' }, 400)
  }

  const slug = username.toLowerCase().replace(/[^a-z0-9_]/g, '')
  if (!slug) return c.json({ error: 'invalid username' }, 400)

  const { data: existing } = await supabase
    .from('users')
    .select('*')
    .eq('username', slug)
    .maybeSingle()

  if (existing) return c.json(existing)

  const insertPayload: Record<string, unknown> = {
    username: slug,
    display_name: displayName,
    avatar: avatar ?? '🎩',
    goals: goals ?? [],
  }
  if (id) insertPayload.id = id

  const { data: user, error } = await supabase
    .from('users')
    .insert(insertPayload)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)

  if (orgId) {
    const { data: org } = await supabase.from('orgs').select('id').eq('id', orgId).maybeSingle()
    if (org) {
      await supabase.from('org_members').upsert({ user_id: user.id, org_id: orgId }, { onConflict: 'user_id,org_id', ignoreDuplicates: true })
    }
  }

  return c.json(user, 201)
})

users.get('/:id', async (c) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', c.req.param('id')).maybeSingle()
  if (error) return c.json({ error: error.message }, 500)
  if (!data) return c.json({ error: 'not found' }, 404)
  return c.json(data)
})

users.patch('/:id', async (c) => {
  const body = await c.req.json()
  const updates: Record<string, unknown> = {}

  if (body.displayName !== undefined) updates.display_name = body.displayName
  if (body.avatar      !== undefined) updates.avatar       = body.avatar
  if (body.goals       !== undefined) updates.goals        = body.goals

  if (Object.keys(updates).length === 0) return c.json({ error: 'nothing to update' }, 400)

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', c.req.param('id'))
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  if (!data) return c.json({ error: 'not found' }, 404)
  return c.json(data)
})

users.get('/:id/orgs', async (c) => {
  const { data, error } = await supabase
    .from('org_members')
    .select('orgs(*)')
    .eq('user_id', c.req.param('id'))

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data?.map(row => row.orgs).filter(Boolean) ?? [])
})

users.get('/:id/badges', async (c) => {
  const { data, error } = await supabase
    .from('user_badges')
    .select('badge_id, earned_at, badges(emoji, name, description)')
    .eq('user_id', c.req.param('id'))
    .order('earned_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})

users.get('/:id/path-progress', async (c) => {
  const { data, error } = await supabase
    .from('path_progress')
    .select('node_id, completed_at')
    .eq('user_id', c.req.param('id'))
    .order('completed_at', { ascending: true })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})

import { Hono } from 'hono'
import { supabase } from '../supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { validateUUID, LIMITS } from '../middleware/validate.js'
import { sanitizeError } from '../middleware/errorHandler.js'

export const users = new Hono()

users.post('/', async (c) => {
  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ error: 'invalid JSON' }, 400) }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return c.json({ error: 'request body must be a JSON object' }, 400)
  }

  const { id, username, displayName, avatar, orgId, goals } = body as Record<string, unknown>

  if (!username || typeof username !== 'string' || !displayName || typeof displayName !== 'string') {
    return c.json({ error: 'username and displayName are required' }, 400)
  }

  const slug = username.toLowerCase().replace(/[^a-z0-9_]/g, '')
  if (!slug || slug.length < LIMITS.USERNAME_MIN || slug.length > LIMITS.USERNAME_MAX) {
    return c.json({ error: `username must be ${LIMITS.USERNAME_MIN}–${LIMITS.USERNAME_MAX} characters` }, 400)
  }

  if (displayName.length > LIMITS.DISPLAY_NAME_MAX) {
    return c.json({ error: `displayName exceeds ${LIMITS.DISPLAY_NAME_MAX} chars` }, 400)
  }

  if (avatar !== undefined && (typeof avatar !== 'string' || avatar.length > LIMITS.AVATAR_MAX)) {
    return c.json({ error: 'invalid avatar' }, 400)
  }

  const { data: existing } = await supabase
    .from('users').select('*').eq('username', slug).maybeSingle()

  if (existing) return c.json(existing)

  const insertPayload: Record<string, unknown> = {
    username: slug,
    display_name: String(displayName).slice(0, LIMITS.DISPLAY_NAME_MAX),
    avatar: avatar ?? '🎩',
    goals: Array.isArray(goals) ? goals : [],
  }
  if (id && typeof id === 'string') insertPayload.id = id

  const { data: user, error } = await supabase
    .from('users').insert(insertPayload).select().single()

  if (error) return c.json({ error: sanitizeError(error) }, 500)

  if (orgId && typeof orgId === 'string') {
    const { data: org } = await supabase.from('orgs').select('id').eq('id', orgId).maybeSingle()
    if (org) {
      await supabase.from('org_members').upsert(
        { user_id: user.id, org_id: orgId },
        { onConflict: 'user_id,org_id', ignoreDuplicates: true }
      )
    }
  }

  return c.json(user, 201)
})

// Public fields only — never expose is_platform_admin or auth-internal fields
const PUBLIC_USER_FIELDS = 'id, username, display_name, avatar, xp, streak, last_active, goals, created_at, specialty, location, bio'

users.get('/:id', validateUUID('id'), async (c) => {
  const { data, error } = await supabase.from('users').select(PUBLIC_USER_FIELDS).eq('id', c.req.param('id')).maybeSingle()
  if (error) return c.json({ error: sanitizeError(error) }, 500)
  if (!data) return c.json({ error: 'not found' }, 404)
  // Explicit pick — belt-and-suspenders; prevents new columns from leaking if select() is bypassed
  const { id, username, display_name, avatar, xp, streak, last_active, goals, created_at, specialty, location, bio } = data as Record<string, unknown>
  return c.json({ id, username, display_name, avatar, xp, streak, last_active, goals, created_at, specialty, location, bio })
})

// A01: require auth, enforce ownership — users can only update themselves
users.patch('/:id', requireAuth, validateUUID('id'), async (c) => {
  const callerId = c.get('userId')
  const targetId = c.req.param('id')

  if (callerId !== targetId) return c.json({ error: 'forbidden' }, 403)

  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ error: 'invalid JSON' }, 400) }

  const obj = body as Record<string, unknown>
  const updates: Record<string, unknown> = {}

  if (obj.displayName !== undefined) {
    if (typeof obj.displayName !== 'string' || obj.displayName.length > LIMITS.DISPLAY_NAME_MAX) {
      return c.json({ error: `displayName must be a string ≤ ${LIMITS.DISPLAY_NAME_MAX} chars` }, 400)
    }
    updates.display_name = obj.displayName.trim()
  }

  if (obj.avatar !== undefined) {
    if (typeof obj.avatar !== 'string' || obj.avatar.length > LIMITS.AVATAR_MAX) {
      return c.json({ error: `avatar must be a string ≤ ${LIMITS.AVATAR_MAX} chars` }, 400)
    }
    updates.avatar = obj.avatar
  }

  if (obj.goals !== undefined) {
    if (!Array.isArray(obj.goals)) return c.json({ error: 'goals must be an array' }, 400)
    // Validate each element is a string; discard non-strings silently
    updates.goals = obj.goals.slice(0, 20).filter((g): g is string => typeof g === 'string')
  }

  if (Object.keys(updates).length === 0) return c.json({ error: 'nothing to update' }, 400)

  const { data, error } = await supabase
    .from('users').update(updates).eq('id', targetId).select().single()

  if (error) return c.json({ error: sanitizeError(error) }, 500)
  if (!data) return c.json({ error: 'not found' }, 404)
  return c.json(data)
})

users.get('/:id/orgs', validateUUID('id'), async (c) => {
  const { data, error } = await supabase
    .from('org_members')
    .select('orgs(*)')
    .eq('user_id', c.req.param('id'))

  if (error) return c.json({ error: sanitizeError(error) }, 500)
  return c.json(data?.map(row => row.orgs).filter(Boolean) ?? [])
})

users.get('/:id/badges', validateUUID('id'), async (c) => {
  const { data, error } = await supabase
    .from('user_badges')
    .select('badge_id, earned_at, badges(emoji, name, description)')
    .eq('user_id', c.req.param('id'))
    .order('earned_at', { ascending: false })

  if (error) return c.json({ error: sanitizeError(error) }, 500)
  return c.json(data ?? [])
})

users.get('/:id/path-progress', validateUUID('id'), async (c) => {
  const { data, error } = await supabase
    .from('path_progress')
    .select('node_id, completed_at')
    .eq('user_id', c.req.param('id'))
    .order('completed_at', { ascending: true })

  if (error) return c.json({ error: sanitizeError(error) }, 500)
  return c.json(data ?? [])
})

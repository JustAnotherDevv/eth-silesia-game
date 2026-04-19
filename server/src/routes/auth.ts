import { Hono } from 'hono'
import { supabase } from '../supabase.js'
import { registrationLimiter } from '../middleware/rateLimit.js'
import { LIMITS } from '../middleware/validate.js'
import { sanitizeError } from '../middleware/errorHandler.js'

export const auth = new Hono()

const ORG_KEY_TO_NAME: Record<string, string> = {
  ETH_SIL:   'ETH Silesia',
  PKO_BANK:  'PKO Bank',
  ETH_LEGAL: 'ETHLegal',
  WAW_UNI:   'Warsaw University',
  FINTECH:   'FinTech Hub',
}

// A07: rate-limit registration to prevent credential stuffing / spam
auth.post('/register', registrationLimiter, async (c) => {
  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ error: 'invalid JSON' }, 400) }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return c.json({ error: 'request body must be a JSON object' }, 400)
  }

  const { email, password, username, displayName, avatar, orgId, goals } = body as Record<string, unknown>

  if (!email || typeof email !== 'string' || !password || typeof password !== 'string' ||
      !username || typeof username !== 'string' || !displayName || typeof displayName !== 'string') {
    return c.json({ error: 'email, password, username and displayName are required' }, 400)
  }

  // A04: enforce minimum password length
  if (password.length < LIMITS.PASSWORD_MIN) {
    return c.json({ error: `password must be at least ${LIMITS.PASSWORD_MIN} characters` }, 400)
  }
  if (password.length > LIMITS.PASSWORD_MAX) {
    return c.json({ error: `password must be at most ${LIMITS.PASSWORD_MAX} characters` }, 400)
  }

  if (email.length > LIMITS.EMAIL_MAX) {
    return c.json({ error: 'email too long' }, 400)
  }

  const slug = username.toLowerCase().replace(/[^a-z0-9_]/g, '')
  if (!slug || slug.length < LIMITS.USERNAME_MIN || slug.length > LIMITS.USERNAME_MAX) {
    return c.json({ error: `username must be ${LIMITS.USERNAME_MIN}–${LIMITS.USERNAME_MAX} alphanumeric characters` }, 400)
  }

  if (displayName.length > LIMITS.DISPLAY_NAME_MAX) {
    return c.json({ error: `displayName exceeds ${LIMITS.DISPLAY_NAME_MAX} chars` }, 400)
  }

  if (avatar !== undefined && (typeof avatar !== 'string' || avatar.length > LIMITS.AVATAR_MAX)) {
    return c.json({ error: 'invalid avatar' }, 400)
  }

  const { data: existing } = await supabase
    .from('users').select('id').eq('username', slug).maybeSingle()
  if (existing) return c.json({ error: 'Username already taken' }, 409)

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  // A09: don't expose raw Supabase auth error details
  if (authError) return c.json({ error: sanitizeError(authError) }, 400)

  const authId = authData.user.id

  const { data: user, error: dbError } = await supabase
    .from('users')
    .insert({
      id: authId,
      username: slug,
      display_name: String(displayName).slice(0, LIMITS.DISPLAY_NAME_MAX),
      avatar: (typeof avatar === 'string' ? avatar : '🎩'),
      goals: Array.isArray(goals) ? goals : [],
    })
    .select()
    .single()

  if (dbError) {
    await supabase.auth.admin.deleteUser(authId)
    return c.json({ error: sanitizeError(dbError) }, 500)
  }

  if (typeof orgId === 'string' && orgId) {
    // Try direct ID lookup first; if that misses, fall back to name match
    const orgName = ORG_KEY_TO_NAME[orgId]
    let foundOrg: { id: string } | null = null

    const byId = await supabase.from('orgs').select('id').eq('id', orgId).maybeSingle()
    if (byId.data) {
      foundOrg = byId.data
    } else if (orgName) {
      const byName = await supabase.from('orgs').select('id').ilike('name', orgName).maybeSingle()
      if (byName.data) foundOrg = byName.data
    }

    if (foundOrg) {
      await supabase.from('org_members').upsert(
        { user_id: user.id, org_id: foundOrg.id },
        { onConflict: 'user_id,org_id', ignoreDuplicates: true }
      )
    } else {
      // No matching org found — auto-join the first public org as fallback
      const { data: firstOrg } = await supabase.from('orgs').select('id').eq('is_public', true).limit(1).maybeSingle()
      if (firstOrg) {
        await supabase.from('org_members').upsert(
          { user_id: user.id, org_id: firstOrg.id },
          { onConflict: 'user_id,org_id', ignoreDuplicates: true }
        )
      }
    }
  }

  return c.json(user, 201)
})

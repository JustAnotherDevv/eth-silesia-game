import { Hono } from 'hono'
import { supabase } from '../supabase.js'

export const auth = new Hono()

const ORG_DB_IDS: Record<string, string> = {
  ETH_SIL:  'eth-silesia',
  PKO_BANK: 'pko-bank',
  WAW_UNI:  'warsaw-uni',
  FINTECH:  'fintech-hub',
}

auth.post('/register', async (c) => {
  const { email, password, username, displayName, avatar, orgId, goals } = await c.req.json()

  if (!email || !password || !username || !displayName) {
    return c.json({ error: 'email, password, username and displayName are required' }, 400)
  }

  const slug = username.toLowerCase().replace(/[^a-z0-9_]/g, '')
  if (!slug) return c.json({ error: 'invalid username' }, 400)

  // Check username taken before creating auth user
  const { data: existing } = await supabase
    .from('users').select('id').eq('username', slug).maybeSingle()
  if (existing) return c.json({ error: 'Username already taken' }, 409)

  // Create Supabase auth user server-side (admin API bypasses email confirmation & triggers)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) return c.json({ error: authError.message }, 400)

  const authId = authData.user.id

  // Create DB user with the same UUID as the auth user
  const { data: user, error: dbError } = await supabase
    .from('users')
    .insert({
      id: authId,
      username: slug,
      display_name: displayName,
      avatar: avatar ?? '🎩',
      goals: goals ?? [],
    })
    .select()
    .single()

  if (dbError) {
    // Roll back auth user if DB insert fails
    await supabase.auth.admin.deleteUser(authId)
    return c.json({ error: dbError.message }, 500)
  }

  // Join org if provided
  const dbOrgId = ORG_DB_IDS[orgId] ?? orgId
  if (dbOrgId) {
    const { data: org } = await supabase.from('orgs').select('id').eq('id', dbOrgId).maybeSingle()
    if (org) {
      await supabase.from('org_members').upsert(
        { user_id: user.id, org_id: dbOrgId },
        { onConflict: 'user_id,org_id', ignoreDuplicates: true }
      )
    }
  }

  return c.json(user, 201)
})

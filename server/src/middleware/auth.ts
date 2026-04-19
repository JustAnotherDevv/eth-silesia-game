import { createMiddleware } from 'hono/factory'
import { supabase } from '../supabase.js'

// A01:2025 + A07:2025 - Broken Access Control + Authentication Failures
// Validate Supabase JWT Bearer tokens; never trust client-supplied user IDs

declare module 'hono' {
  interface ContextVariableMap {
    userId: string
    isAdmin: boolean
  }
}

function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7).trim()
  return token.length > 0 ? token : null
}

// Require a valid Supabase JWT. Extracts userId from the verified token.
export const requireAuth = createMiddleware(async (c, next) => {
  const token = extractToken(c.req.header('Authorization'))
  if (!token) {
    securityLog('AUTH_MISSING', c.req.method, c.req.url)
    return c.json({ error: 'unauthorized' }, 401)
  }

  let user: { id: string } | null = null
  try {
    const { data, error } = await supabase.auth.getUser(token)
    if (!error) user = data.user
  } catch {
    // treat network/unexpected errors as auth failure (fail closed)
  }
  if (!user) {
    securityLog('AUTH_INVALID', c.req.method, c.req.url)
    return c.json({ error: 'unauthorized' }, 401)
  }

  c.set('userId', user.id)
  await next()
})

// Require a valid JWT AND the user must be a platform admin (DB-verified).
export const requireAdmin = createMiddleware(async (c, next) => {
  const token = extractToken(c.req.header('Authorization'))
  if (!token) {
    securityLog('ADMIN_AUTH_MISSING', c.req.method, c.req.url)
    return c.json({ error: 'unauthorized' }, 401)
  }

  let user: { id: string } | null = null
  try {
    const { data, error } = await supabase.auth.getUser(token)
    if (!error) user = data.user
  } catch {
    // treat network/unexpected errors as auth failure (fail closed)
  }
  if (!user) {
    securityLog('ADMIN_AUTH_INVALID', c.req.method, c.req.url)
    return c.json({ error: 'unauthorized' }, 401)
  }

  // Check admin status from DB — never from client-supplied header or JWT claim
  const { data } = await supabase
    .from('users')
    .select('is_platform_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (!data?.is_platform_admin) {
    securityLog('ADMIN_FORBIDDEN', c.req.method, c.req.url, user.id)
    return c.json({ error: 'forbidden' }, 403)
  }

  c.set('userId', user.id)
  c.set('isAdmin', true)
  await next()
})

// A09:2025 - Security Logging: log auth failures for monitoring
function securityLog(event: string, method: string, url: string, userId?: string) {
  const ts = new Date().toISOString()
  const uid = userId ? ` user=${userId}` : ''
  console.warn(`[SECURITY] ${ts} ${event} ${method} ${url}${uid}`)
}

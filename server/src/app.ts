import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { users } from './routes/users.js'
import { games } from './routes/games.js'
import { leaderboard } from './routes/leaderboard.js'
import { orgs } from './routes/orgs.js'
import { members } from './routes/members.js'
import { news } from './routes/news.js'
import { auth } from './routes/auth.js'
import { admin } from './routes/admin.js'
import { supabase } from './supabase.js'
import { securityHeaders } from './middleware/securityHeaders.js'
import { globalErrorHandler } from './middleware/errorHandler.js'

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
]

export function createApp() {
  const app = new Hono()

  // A02: Security headers on every response
  app.use('*', securityHeaders())

  // A02: Strict CORS allowlist
  app.use('*', cors({
    origin: (origin) => (ALLOWED_ORIGINS.includes(origin ?? '') ? origin : null),
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge: 600,
    credentials: true,
  }))

  app.use('*', logger())

  // A10: Global error handler — fail closed, sanitize errors
  app.onError(globalErrorHandler)

  app.get('/api/health', c => c.json({ ok: true }))

  // Feature flags — public, but returns only non-sensitive fields
  app.get('/api/feature-flags', async (c) => {
    try {
      const { data } = await supabase
        .from('feature_flags')
        .select('key, enabled, label, description, category')
        .order('category')
        .order('key')
      return c.json((data ?? []).map(({ key, enabled, label, description, category }) =>
        ({ key, enabled, label, description, category }))
      )
    } catch {
      return c.json({ error: 'failed to fetch flags' }, 500)
    }
  })

  app.route('/api/users', users)
  app.route('/api/games', games)
  app.route('/api/leaderboard', leaderboard)
  app.route('/api/orgs', orgs)
  app.route('/api/members', members)
  app.route('/api/news', news)
  app.route('/api/auth', auth)
  app.route('/api/admin', admin)

  // A10: Explicit 404 for unknown routes
  app.notFound(c => c.json({ error: 'not found' }, 404))

  return app
}

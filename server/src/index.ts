import { serve } from '@hono/node-server'
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

const app = new Hono()

app.use('*', cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }))
app.use('*', logger())

app.get('/api/health', c => c.json({ ok: true }))

// Public feature flags endpoint
app.get('/api/feature-flags', async (c) => {
  const { data } = await supabase
    .from('feature_flags')
    .select('key, enabled, label, description, category')
    .order('category')
    .order('key')
  return c.json(data ?? [])
})
app.route('/api/users', users)
app.route('/api/games', games)
app.route('/api/leaderboard', leaderboard)
app.route('/api/orgs', orgs)
app.route('/api/members', members)
app.route('/api/news', news)
app.route('/api/auth', auth)
app.route('/api/admin', admin)

serve({ fetch: app.fetch, port: 3001 }, () => {
  console.log('Server running on http://localhost:3001')
})

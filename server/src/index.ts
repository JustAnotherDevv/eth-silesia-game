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

const app = new Hono()

app.use('*', cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }))
app.use('*', logger())

app.get('/api/health', c => c.json({ ok: true }))
app.route('/api/users', users)
app.route('/api/games', games)
app.route('/api/leaderboard', leaderboard)
app.route('/api/orgs', orgs)
app.route('/api/members', members)
app.route('/api/news', news)

serve({ fetch: app.fetch, port: 3001 }, () => {
  console.log('Server running on http://localhost:3001')
})

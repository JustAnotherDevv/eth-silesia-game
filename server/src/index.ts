import { serve } from '@hono/node-server'
import { createApp } from './app.js'

const app = createApp()

serve({ fetch: app.fetch, port: 3001 }, () => {
  console.log('Server running on http://localhost:3001')
})

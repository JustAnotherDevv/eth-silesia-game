import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { authRoutes } from './routes/auth'
import { communityRoutes } from './routes/community'
import { adminRoutes } from './routes/admin'

const PORT       = Number(process.env.PORT ?? 3001)
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-please-change-in-production'

const app = Fastify({ logger: { level: 'warn' } })

async function start() {
  await app.register(cors, {
    origin: [
      'http://localhost:5173',
      'http://localhost:5199',
      'http://localhost:3000',
    ],
    credentials: true,
  })

  await app.register(jwt, {
    secret: JWT_SECRET,
    sign: { expiresIn: '7d' },
  })

  await app.register(authRoutes,      { prefix: '/api/auth' })
  await app.register(communityRoutes, { prefix: '/api/community' })
  await app.register(adminRoutes,     { prefix: '/api/admin' })

  app.get('/api/health', async () => ({ ok: true, ts: new Date().toISOString() }))

  await app.listen({ port: PORT, host: '0.0.0.0' })
  console.log(`\n🚀  API server → http://localhost:${PORT}/api/health\n`)
}

start().catch(err => {
  console.error(err)
  process.exit(1)
})

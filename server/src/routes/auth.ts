import { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcryptjs'
import { db } from '../db'
import type { SignupBody, LoginBody } from '../types'

function safeUser(user: {
  id: string; email: string; username: string; name: string
  avatarEmoji: string; xp: number; level: string; streak: number
  badges: number; specialty: string; bio: string; location: string; goals: string
  createdAt: Date
}, community: { id: string; name: string; emoji: string; inviteCodes: { code: string }[] } | null, isAdmin: boolean) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    avatarEmoji: user.avatarEmoji,
    xp: user.xp,
    level: user.level,
    streak: user.streak,
    badges: user.badges,
    specialty: user.specialty,
    bio: user.bio,
    location: user.location,
    goals: JSON.parse(user.goals || '[]'),
    isAdmin,
    communityId:    community?.id    ?? null,
    communityName:  community?.name  ?? null,
    communityEmoji: community?.emoji ?? null,
    communityCode:  community?.inviteCodes?.[0]?.code ?? null,
    joinedAt: user.createdAt,
  }
}

export const authRoutes: FastifyPluginAsync = async (app) => {

  // POST /api/auth/signup
  app.post<{ Body: SignupBody }>('/signup', async (req, reply) => {
    const { name, username, email, password, avatarEmoji = '🎩', goals = [], orgId, newCommunity } = req.body

    if (!name?.trim() || !username?.trim() || !email?.trim() || !password) {
      return reply.code(400).send({ error: 'name, username, email and password are required' })
    }
    if (password.length < 6) {
      return reply.code(400).send({ error: 'Password must be at least 6 characters' })
    }

    const existing = await db.user.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] },
    })
    if (existing) {
      return reply.code(409).send({
        error: existing.email === email.toLowerCase() ? 'Email already in use' : 'Username already taken',
      })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await db.user.create({
      data: {
        name: name.trim(),
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        avatarEmoji,
        goals: JSON.stringify(goals),
      },
    })

    let community = null
    let isAdmin = false

    if (newCommunity) {
      community = await db.community.create({
        data: {
          name: newCommunity.name,
          emoji: newCommunity.emoji,
          type: newCommunity.type,
          isPublic: newCommunity.isPublic,
          adminId: user.id,
          memberships: { create: { userId: user.id } },
          inviteCodes: { create: { code: newCommunity.code, maxUses: 50 } },
        },
        include: { inviteCodes: { take: 1 } },
      })
      isAdmin = true
    } else if (orgId) {
      // Join via invite code — look up community
      const invite = await db.inviteCode.findFirst({
        where: { code: orgId, active: true },
        include: { community: { include: { inviteCodes: { where: { active: true }, take: 1 } } } },
      })
      if (invite && invite.uses < invite.maxUses) {
        await db.membership.create({ data: { userId: user.id, communityId: invite.communityId } })
        await db.inviteCode.update({ where: { id: invite.id }, data: { uses: { increment: 1 } } })
        community = invite.community
      }
    }

    const token = await reply.jwtSign({ userId: user.id, email: user.email })
    return { token, user: safeUser(user, community, isAdmin) }
  })

  // POST /api/auth/login
  app.post<{ Body: LoginBody }>('/login', async (req, reply) => {
    const { email, password } = req.body
    if (!email || !password) return reply.code(400).send({ error: 'email and password required' })

    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) return reply.code(401).send({ error: 'Invalid email or password' })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return reply.code(401).send({ error: 'Invalid email or password' })

    const adminCommunity = await db.community.findFirst({
      where: { adminId: user.id },
      include: { inviteCodes: { where: { active: true }, take: 1 } },
    })
    const memberCommunity = adminCommunity ?? await db.community.findFirst({
      where: { memberships: { some: { userId: user.id } } },
      include: { inviteCodes: { where: { active: true }, take: 1 } },
    })

    const token = await reply.jwtSign({ userId: user.id, email: user.email })
    return { token, user: safeUser(user, memberCommunity, !!adminCommunity) }
  })

  // GET /api/auth/me
  app.get('/me', async (req, reply) => {
    try { await req.jwtVerify() } catch { return reply.code(401).send({ error: 'Unauthorized' }) }

    const { userId } = req.user
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return reply.code(404).send({ error: 'User not found' })

    const adminCommunity = await db.community.findFirst({
      where: { adminId: userId },
      include: { inviteCodes: { where: { active: true }, take: 1 } },
    })
    const memberCommunity = adminCommunity ?? await db.community.findFirst({
      where: { memberships: { some: { userId } } },
      include: { inviteCodes: { where: { active: true }, take: 1 } },
    })

    return { user: safeUser(user, memberCommunity, !!adminCommunity) }
  })
}

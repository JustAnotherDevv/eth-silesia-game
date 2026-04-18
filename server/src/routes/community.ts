import { FastifyPluginAsync } from 'fastify'
import { db } from '../db'

export const communityRoutes: FastifyPluginAsync = async (app) => {

  // GET /api/community — list public communities
  app.get('/', async () => {
    const communities = await db.community.findMany({
      where: { isPublic: true },
      include: { _count: { select: { memberships: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return communities.map(c => ({
      id: c.id, name: c.name, emoji: c.emoji, type: c.type,
      members: c._count.memberships,
    }))
  })

  // POST /api/community/join — join via invite code
  app.post<{ Body: { code: string } }>('/join', async (req, reply) => {
    try { await req.jwtVerify() } catch { return reply.code(401).send({ error: 'Unauthorized' }) }

    const { code } = req.body
    if (!code) return reply.code(400).send({ error: 'code is required' })

    const invite = await db.inviteCode.findFirst({
      where: { code: code.toUpperCase(), active: true },
    })
    if (!invite) return reply.code(404).send({ error: 'Invite code not found or expired' })
    if (invite.uses >= invite.maxUses) return reply.code(400).send({ error: 'Invite code has reached max uses' })

    const { userId } = req.user
    const existing = await db.membership.findUnique({
      where: { userId_communityId: { userId, communityId: invite.communityId } },
    })
    if (existing) return reply.code(409).send({ error: 'Already a member' })

    await db.membership.create({ data: { userId, communityId: invite.communityId } })
    await db.inviteCode.update({ where: { id: invite.id }, data: { uses: { increment: 1 } } })

    const community = await db.community.findUnique({
      where: { id: invite.communityId },
      include: { _count: { select: { memberships: true } } },
    })
    return { ok: true, community }
  })
}

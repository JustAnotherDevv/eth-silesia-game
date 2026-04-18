import { FastifyPluginAsync } from 'fastify'
import { db } from '../db'

async function requireAdmin(req: Parameters<FastifyPluginAsync>[0]['addHook'] extends (event: string, fn: (req: infer R, ...a: unknown[]) => unknown) => unknown ? R : never, reply: { code: (n: number) => { send: (b: unknown) => unknown } }, userId: string) {
  const community = await db.community.findFirst({ where: { adminId: userId } })
  if (!community) { reply.code(403).send({ error: 'Forbidden — not an admin' }); return null }
  return community
}

export const adminRoutes: FastifyPluginAsync = async (app) => {

  // Auth preHandler for all admin routes
  app.addHook('preHandler', async (req, reply) => {
    try { await req.jwtVerify() } catch { return reply.code(401).send({ error: 'Unauthorized' }) }
  })

  // GET /api/admin/community — full community stats
  app.get('/community', async (req, reply) => {
    const { userId } = req.user
    const community = await db.community.findFirst({
      where: { adminId: userId },
      include: {
        _count: { select: { memberships: true } },
        inviteCodes: { where: { active: true }, take: 1 },
      },
    })
    if (!community) return reply.code(404).send({ error: 'No community found' })

    const totalXp = await db.user.aggregate({
      _sum: { xp: true },
      where: { memberships: { some: { communityId: community.id } } },
    })
    const totalBadges = await db.user.aggregate({
      _sum: { badges: true },
      where: { memberships: { some: { communityId: community.id } } },
    })

    return {
      id: community.id,
      name: community.name,
      emoji: community.emoji,
      type: community.type,
      isPublic: community.isPublic,
      members: community._count.memberships,
      primaryCode: community.inviteCodes[0]?.code ?? null,
      totalXp: totalXp._sum.xp ?? 0,
      totalBadges: totalBadges._sum.badges ?? 0,
    }
  })

  // ── Invite Codes ──────────────────────────────────────────────

  app.get('/invite-codes', async (req, reply) => {
    const { userId } = req.user
    const community = await db.community.findFirst({ where: { adminId: userId } })
    if (!community) return reply.code(404).send({ error: 'No community' })

    return db.inviteCode.findMany({
      where: { communityId: community.id },
      orderBy: { createdAt: 'desc' },
    })
  })

  app.post<{ Body: { maxUses?: number } }>('/invite-codes', async (req, reply) => {
    const { userId } = req.user
    const community = await db.community.findFirst({ where: { adminId: userId } })
    if (!community) return reply.code(404).send({ error: 'No community' })

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')

    return db.inviteCode.create({
      data: { code, communityId: community.id, maxUses: req.body?.maxUses ?? 25 },
    })
  })

  app.delete<{ Params: { id: string } }>('/invite-codes/:id', async (req, reply) => {
    const { userId } = req.user
    const code = await db.inviteCode.findUnique({ where: { id: req.params.id }, include: { community: true } })
    if (!code || code.community.adminId !== userId) return reply.code(403).send({ error: 'Forbidden' })
    return db.inviteCode.update({ where: { id: req.params.id }, data: { active: false } })
  })

  // ── Members ───────────────────────────────────────────────────

  app.get('/members', async (req, reply) => {
    const { userId } = req.user
    const community = await db.community.findFirst({ where: { adminId: userId } })
    if (!community) return reply.code(404).send({ error: 'No community' })

    const memberships = await db.membership.findMany({
      where: { communityId: community.id },
      include: {
        user: {
          select: {
            id: true, name: true, username: true, email: true,
            avatarEmoji: true, xp: true, level: true, streak: true,
            badges: true, specialty: true, joinedAt: false, createdAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    })

    return memberships.map(m => ({
      ...m.user,
      joinedAt: m.joinedAt,
      isAdmin: m.user.id === community.adminId,
    }))
  })

  app.delete<{ Params: { userId: string } }>('/members/:userId', async (req, reply) => {
    const { userId: adminId } = req.user
    const community = await db.community.findFirst({ where: { adminId } })
    if (!community) return reply.code(404).send({ error: 'No community' })
    if (req.params.userId === adminId) return reply.code(400).send({ error: 'Cannot remove yourself' })

    await db.membership.deleteMany({
      where: { userId: req.params.userId, communityId: community.id },
    })
    return { ok: true }
  })

  // ── Settings ──────────────────────────────────────────────────

  app.patch<{ Body: { name?: string; emoji?: string; type?: string; isPublic?: boolean } }>('/settings', async (req, reply) => {
    const { userId } = req.user
    const community = await db.community.findFirst({ where: { adminId: userId } })
    if (!community) return reply.code(404).send({ error: 'No community' })

    const { name, emoji, type, isPublic } = req.body
    return db.community.update({
      where: { id: community.id },
      data: {
        ...(name     !== undefined && { name }),
        ...(emoji    !== undefined && { emoji }),
        ...(type     !== undefined && { type }),
        ...(isPublic !== undefined && { isPublic }),
      },
    })
  })

  // ── Modules ───────────────────────────────────────────────────

  app.get('/modules', async (req, reply) => {
    const { userId } = req.user
    const community = await db.community.findFirst({ where: { adminId: userId } })
    if (!community) return reply.code(404).send({ error: 'No community' })

    return db.module.findMany({
      where: { communityId: community.id },
      orderBy: { createdAt: 'asc' },
    })
  })

  app.post<{ Body: { emoji?: string; title: string; description?: string } }>('/modules', async (req, reply) => {
    const { userId } = req.user
    const community = await db.community.findFirst({ where: { adminId: userId } })
    if (!community) return reply.code(404).send({ error: 'No community' })
    if (!req.body?.title) return reply.code(400).send({ error: 'title is required' })

    return db.module.create({
      data: {
        communityId: community.id,
        emoji: req.body.emoji ?? '📚',
        title: req.body.title,
        description: req.body.description ?? '',
      },
    })
  })

  app.patch<{ Params: { id: string }; Body: { emoji?: string; title?: string; description?: string; published?: boolean } }>('/modules/:id', async (req, reply) => {
    const { userId } = req.user
    const mod = await db.module.findUnique({ where: { id: req.params.id }, include: { community: true } })
    if (!mod || mod.community.adminId !== userId) return reply.code(403).send({ error: 'Forbidden' })

    const { emoji, title, description, published } = req.body
    return db.module.update({
      where: { id: req.params.id },
      data: {
        ...(emoji       !== undefined && { emoji }),
        ...(title       !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(published   !== undefined && { published }),
      },
    })
  })

  app.delete<{ Params: { id: string } }>('/modules/:id', async (req, reply) => {
    const { userId } = req.user
    const mod = await db.module.findUnique({ where: { id: req.params.id }, include: { community: true } })
    if (!mod || mod.community.adminId !== userId) return reply.code(403).send({ error: 'Forbidden' })
    await db.module.delete({ where: { id: req.params.id } })
    return { ok: true }
  })
}

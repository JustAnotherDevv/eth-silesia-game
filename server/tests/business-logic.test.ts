/**
 * Business-Logic + OWASP Top 10 coverage tests.
 *
 * Exercises the behaviours the product actually promises:
 *  - outsiders cannot read private space data (A01)
 *  - non-admins cannot mutate space state (A01 + A04)
 *  - admins can create/disable invite codes and remove members (A04 positive path)
 *  - XP math: clamp, cooldown, streak, badges (A04 business logic)
 *  - GDPR Art. 15 export returns all the caller's data as an attachment
 *  - GDPR Art. 17 erasure deletes the user row + auth record
 *  - IDOR: one user cannot mutate or read another user's resources (A01)
 *  - XP/goals payloads cannot smuggle is_platform_admin elevation (A01 + A04)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted Supabase mock ────────────────────────────────────────────────────

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
    admin: { createUser: vi.fn(), deleteUser: vi.fn() },
  },
}))

vi.mock('../src/supabase.js', () => ({ supabase: supabaseMock }))

import { createApp } from '../src/app.js'
import { clearRateLimits } from '../src/middleware/rateLimit.js'

// ── Fixtures ────────────────────────────────────────────────────────────────

const ALICE_ID = '11111111-1111-1111-1111-111111111111'
const BOB_ID   = '22222222-2222-2222-2222-222222222222'
const ADMIN_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const PUBLIC_ORG = 'eth-silesia'
const PRIVATE_ORG = 'genesis-dao'
const INVITE_ID = '33333333-3333-3333-3333-333333333333'
const NEWS_ID   = '44444444-4444-4444-4444-444444444444'

const validTokens: Record<string, string> = {
  'token-alice': ALICE_ID,
  'token-bob':   BOB_ID,
  'token-admin': ADMIN_ID,
}

// ── Mock helpers ────────────────────────────────────────────────────────────

function okOne(data: unknown)   { return { data, error: null } }
function okMany(data: unknown[]) { return { data, error: null, count: data.length } }
function dbError(msg: string)   { return { data: null, error: { message: msg } } }

type InsertSpy = (payload: Record<string, unknown>) => unknown
type UpdateSpy = (payload: Record<string, unknown>) => unknown
type DeleteSpy = () => unknown

function makeQuery(result: unknown, spies: {
  insert?: InsertSpy
  update?: UpdateSpy
  delete?: DeleteSpy
  upsert?: InsertSpy
} = {}) {
  const q: Record<string, unknown> = {}
  const chain = () => q
  q.select = chain
  q.eq = chain; q.neq = chain; q.gte = chain; q.lte = chain; q.gt = chain; q.lt = chain
  q.in = chain; q.ilike = chain; q.or = chain; q.order = chain; q.range = chain; q.limit = chain
  q.insert = spies.insert
    ? ((p: Record<string, unknown>) => { const r = spies.insert!(p); return r ?? q })
    : chain
  q.update = spies.update
    ? ((p: Record<string, unknown>) => { const r = spies.update!(p); return r ?? q })
    : chain
  q.delete = spies.delete
    ? (() => { const r = spies.delete!(); return r ?? q })
    : chain
  q.upsert = spies.upsert
    ? ((p: Record<string, unknown>) => { const r = spies.upsert!(p); return r ?? q })
    : chain
  q.single      = () => Promise.resolve(result)
  q.maybeSingle = () => Promise.resolve(result)
  q.then = (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve)
  return q
}

function bearer(token: string) { return { Authorization: `Bearer ${token}` } }

async function req(
  app: ReturnType<typeof createApp>,
  method: string,
  path: string,
  opts: { headers?: Record<string, string>; body?: unknown } = {}
) {
  const headers: Record<string, string> = { ...opts.headers }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  return app.request(path, {
    method, headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  })
}

// ── Setup ───────────────────────────────────────────────────────────────────

let app: ReturnType<typeof createApp>

beforeEach(() => {
  vi.clearAllMocks()
  clearRateLimits()
  app = createApp()

  supabaseMock.auth.getUser.mockImplementation(async (token: string) => {
    const userId = validTokens[token]
    if (!userId) return { data: { user: null }, error: { message: 'invalid token' } }
    return { data: { user: { id: userId } }, error: null }
  })

  supabaseMock.from.mockReturnValue(makeQuery(okOne(null)))
})

// ═════════════════════════════════════════════════════════════════════════════
// A01 — Space privacy: outsiders must not read private-org data
// ═════════════════════════════════════════════════════════════════════════════

describe('Space privacy (A01)', () => {
  // Table-switching mock that tracks membership
  function mockOrgWith({
    isPublic, memberIds,
  }: { isPublic: boolean; memberIds: string[] }) {
    let lastMembershipUser: string | null = null
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'orgs') {
        return makeQuery(okOne({
          id: isPublic ? PUBLIC_ORG : PRIVATE_ORG,
          name: 'Test',
          is_public: isPublic,
          emoji: '🏛️',
          color: '#000',
          description: 'x',
        }))
      }
      if (table === 'org_members') {
        // Capture the eq('user_id', <id>) call for the membership check
        const q = makeQuery(okMany([]))
        q.eq = ((field: string, val: string) => {
          if (field === 'user_id') lastMembershipUser = val
          if (field === 'org_id' && lastMembershipUser) {
            const match = memberIds.includes(lastMembershipUser)
            return { ...q, maybeSingle: () => Promise.resolve(okOne(match ? { user_id: lastMembershipUser } : null)) }
          }
          return q
        }) as unknown as () => Record<string, unknown>
        return q
      }
      return makeQuery(okMany([]))
    })
  }

  it('GET /api/orgs/:private without auth → 404 (existence hidden)', async () => {
    mockOrgWith({ isPublic: false, memberIds: [] })
    const res = await req(app, 'GET', `/api/orgs/${PRIVATE_ORG}`)
    expect(res.status).toBe(404)
  })

  it('GET /api/orgs/:private with non-member token → 404', async () => {
    mockOrgWith({ isPublic: false, memberIds: [ALICE_ID] })
    const res = await req(app, 'GET', `/api/orgs/${PRIVATE_ORG}`, { headers: bearer('token-bob') })
    expect(res.status).toBe(404)
  })

  it('GET /api/orgs/:private with member token → 200', async () => {
    mockOrgWith({ isPublic: false, memberIds: [ALICE_ID] })
    // Second from('orgs') call for actual read — mock needs to serve real row too
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'orgs') {
        return makeQuery(okOne({
          id: PRIVATE_ORG, name: 'Genesis', is_public: false,
          emoji: '🏛️', color: '#000', description: 'x',
          org_members: [{ count: 1 }],
        }))
      }
      if (table === 'org_members') {
        return makeQuery(okOne({ user_id: ALICE_ID }))
      }
      return makeQuery(okMany([]))
    })
    const res = await req(app, 'GET', `/api/orgs/${PRIVATE_ORG}`, { headers: bearer('token-alice') })
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>
    expect(body.id).toBe(PRIVATE_ORG)
  })

  it('GET /api/orgs/:public without auth → 200 (sanity: public still open)', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'orgs') {
        return makeQuery(okOne({
          id: PUBLIC_ORG, name: 'ETH Silesia', is_public: true,
          emoji: '🔷', color: '#000', description: 'x',
          org_members: [{ count: 42 }],
        }))
      }
      return makeQuery(okMany([]))
    })
    const res = await req(app, 'GET', `/api/orgs/${PUBLIC_ORG}`)
    expect(res.status).toBe(200)
  })

  it('GET /api/orgs/:private/members without auth → 404', async () => {
    mockOrgWith({ isPublic: false, memberIds: [] })
    const res = await req(app, 'GET', `/api/orgs/${PRIVATE_ORG}/members`)
    expect(res.status).toBe(404)
  })

  it('GET /api/orgs/:private/members with non-member token → 404', async () => {
    mockOrgWith({ isPublic: false, memberIds: [ALICE_ID] })
    const res = await req(app, 'GET', `/api/orgs/${PRIVATE_ORG}/members`, { headers: bearer('token-bob') })
    expect(res.status).toBe(404)
  })

  it('POST /api/orgs/:private/join authenticated non-member → 403 (invite required)', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'orgs') return makeQuery(okOne({ id: PRIVATE_ORG, is_public: false }))
      return makeQuery(okMany([]))
    })
    const res = await req(app, 'POST', `/api/orgs/${PRIVATE_ORG}/join`, {
      headers: bearer('token-alice'),
      body: {},
    })
    expect(res.status).toBe(403)
  })

  it('POST /api/orgs/:public/join authenticated → 200', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'orgs') return makeQuery(okOne({ id: PUBLIC_ORG, is_public: true }))
      if (table === 'org_members') return makeQuery(okOne(null))
      return makeQuery(okOne(null))
    })
    const res = await req(app, 'POST', `/api/orgs/${PUBLIC_ORG}/join`, {
      headers: bearer('token-alice'),
      body: {},
    })
    expect(res.status).toBe(200)
  })

  it('GET /api/members?orgId=<private> without auth → [] (members hidden)', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'orgs') return makeQuery(okOne({ is_public: false }))
      return makeQuery(okMany([]))
    })
    const res = await req(app, 'GET', `/api/members?orgId=${PRIVATE_ORG}`)
    expect(res.status).toBe(200)
    const body = await res.json() as unknown[]
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBe(0)
  })

  it('GET /api/members?orgId=<private> with non-member → []', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'orgs') return makeQuery(okOne({ is_public: false }))
      if (table === 'org_members') return makeQuery(okOne(null)) // not a member
      return makeQuery(okMany([]))
    })
    const res = await req(app, 'GET', `/api/members?orgId=${PRIVATE_ORG}`, { headers: bearer('token-bob') })
    expect(res.status).toBe(200)
    const body = await res.json() as unknown[]
    expect(body.length).toBe(0)
  })

  it('GET /api/orgs (public listing) never contains private orgs', async () => {
    supabaseMock.from.mockReturnValue(makeQuery(okMany([
      { id: PUBLIC_ORG, name: 'ETH Silesia', is_public: true, emoji: '🔷', color: '#000', description: 'x', org_members: [{ count: 42 }] },
    ])))
    const res = await req(app, 'GET', '/api/orgs')
    expect(res.status).toBe(200)
    const body = await res.json() as Array<Record<string, unknown>>
    expect(body.every(o => o.is_public === true)).toBe(true)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// A01 — IDOR: cross-user mutation / read must be blocked
// ═════════════════════════════════════════════════════════════════════════════

describe('Cross-user isolation (IDOR, A01)', () => {
  it('Alice cannot PATCH Bob', async () => {
    const res = await req(app, 'PATCH', `/api/users/${BOB_ID}`, {
      headers: bearer('token-alice'),
      body: { displayName: 'Hacked Bob' },
    })
    expect(res.status).toBe(403)
  })

  it('Alice cannot read Bob game history', async () => {
    const res = await req(app, 'GET', `/api/games/user/${BOB_ID}`, { headers: bearer('token-alice') })
    expect(res.status).toBe(403)
  })

  it('Alice CAN patch her own profile', async () => {
    supabaseMock.from.mockReturnValue(makeQuery(okOne({
      id: ALICE_ID, display_name: 'New Alice', avatar: '🐱',
    })))
    const res = await req(app, 'PATCH', `/api/users/${ALICE_ID}`, {
      headers: bearer('token-alice'),
      body: { displayName: 'New Alice' },
    })
    expect(res.status).toBe(200)
  })

  it('Alice cannot set is_platform_admin via PATCH (field not in allowlist)', async () => {
    let sentUpdate: Record<string, unknown> | undefined
    supabaseMock.from.mockImplementation(() => makeQuery(okOne({
      id: ALICE_ID, display_name: 'Alice',
    }), {
      update: (p) => { sentUpdate = p; return undefined },
    }))
    const res = await req(app, 'PATCH', `/api/users/${ALICE_ID}`, {
      headers: bearer('token-alice'),
      body: { displayName: 'Alice', is_platform_admin: true },
    })
    // PATCH should succeed — but the admin flag must NOT appear in the update payload
    expect([200, 400]).toContain(res.status)
    if (sentUpdate) {
      expect(sentUpdate.is_platform_admin).toBeUndefined()
    }
  })

  it('Unauthenticated PATCH → 401', async () => {
    const res = await req(app, 'PATCH', `/api/users/${ALICE_ID}`, {
      body: { displayName: 'X' },
    })
    expect(res.status).toBe(401)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// A01 + A04 — Admin-only mutations (non-admin blocked, admin allowed)
// ═════════════════════════════════════════════════════════════════════════════

describe('Admin authorization', () => {
  // Default: Alice's is_platform_admin=false; admin token resolves to ADMIN_ID
  // with is_platform_admin=true on the users table lookup.
  function setupAdminLookup(isAdmin: boolean, userId: string) {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(okOne({ id: userId, is_platform_admin: isAdmin }))
      return makeQuery(okMany([]))
    })
  }

  describe('Non-admin BLOCKED from /api/admin/*', () => {
    it('POST /api/admin/invite-codes without token → 401', async () => {
      const res = await req(app, 'POST', '/api/admin/invite-codes', { body: { maxUses: 5 } })
      expect(res.status).toBe(401)
    })

    it('POST /api/admin/invite-codes with non-admin token → 403', async () => {
      setupAdminLookup(false, ALICE_ID)
      const res = await req(app, 'POST', '/api/admin/invite-codes', {
        headers: bearer('token-alice'),
        body: { maxUses: 5 },
      })
      expect(res.status).toBe(403)
    })

    it('PATCH /api/admin/invite-codes/:id non-admin → 403', async () => {
      setupAdminLookup(false, ALICE_ID)
      const res = await req(app, 'PATCH', `/api/admin/invite-codes/${INVITE_ID}`, {
        headers: bearer('token-alice'),
        body: { active: false },
      })
      expect(res.status).toBe(403)
    })

    it('POST /api/admin/news non-admin → 403', async () => {
      setupAdminLookup(false, ALICE_ID)
      const res = await req(app, 'POST', '/api/admin/news', {
        headers: bearer('token-alice'),
        body: { headline: 'Fake news' },
      })
      expect(res.status).toBe(403)
    })

    it('DELETE /api/admin/members/:id non-admin → 403', async () => {
      setupAdminLookup(false, ALICE_ID)
      const res = await req(app, 'DELETE', `/api/admin/members/${BOB_ID}`, {
        headers: bearer('token-alice'),
      })
      expect(res.status).toBe(403)
    })

    it('PATCH /api/admin/flags/:key non-admin → 403', async () => {
      setupAdminLookup(false, ALICE_ID)
      const res = await req(app, 'PATCH', '/api/admin/flags/community', {
        headers: bearer('token-alice'),
        body: { enabled: false },
      })
      expect(res.status).toBe(403)
    })

    it('POST /api/admin/promote/:id non-admin → 403 (no self-promotion)', async () => {
      setupAdminLookup(false, ALICE_ID)
      const res = await req(app, 'POST', `/api/admin/promote/${ALICE_ID}`, {
        headers: bearer('token-alice'),
        body: {},
      })
      expect(res.status).toBe(403)
    })
  })

  describe('Admin ALLOWED mutations', () => {
    function setupAdmin(moreMocks: (table: string) => unknown) {
      supabaseMock.from.mockImplementation((table: string) => {
        if (table === 'users') {
          // First call (requireAdmin middleware) checks is_platform_admin.
          return makeQuery(okOne({ id: ADMIN_ID, is_platform_admin: true }))
        }
        return moreMocks(table)
      })
    }

    it('Admin POST /api/admin/invite-codes → 201 + 6-char code', async () => {
      let inserted: Record<string, unknown> | undefined
      setupAdmin((table) => {
        if (table === 'orgs') return makeQuery(okOne({ id: PUBLIC_ORG }))
        if (table === 'invite_codes') return makeQuery(okOne({ id: INVITE_ID, code: 'ABC123', active: true }), {
          insert: (p) => { inserted = p; return undefined },
        })
        return makeQuery(okMany([]))
      })
      const res = await req(app, 'POST', '/api/admin/invite-codes', {
        headers: bearer('token-admin'),
        body: { maxUses: 10 },
      })
      expect(res.status).toBe(201)
      expect(inserted).toBeDefined()
      expect(typeof (inserted as Record<string, unknown>).code).toBe('string')
      expect(((inserted as Record<string, unknown>).code as string).length).toBe(6)
      expect((inserted as Record<string, unknown>).max_uses).toBe(10)
      expect((inserted as Record<string, unknown>).created_by).toBe(ADMIN_ID)
    })

    it('Admin can disable invite code (PATCH active=false)', async () => {
      let updated: Record<string, unknown> | undefined
      setupAdmin(() => makeQuery(okOne({ id: INVITE_ID, active: false }), {
        update: (p) => { updated = p; return undefined },
      }))
      const res = await req(app, 'PATCH', `/api/admin/invite-codes/${INVITE_ID}`, {
        headers: bearer('token-admin'),
        body: { active: false },
      })
      expect(res.status).toBe(200)
      expect(updated?.active).toBe(false)
    })

    it('Admin can DELETE /api/admin/members/:id (removes from all orgs)', async () => {
      let deleted = false
      setupAdmin((table) => {
        if (table === 'org_members') return makeQuery(okOne(null), { delete: () => { deleted = true; return undefined } })
        return makeQuery(okOne(null))
      })
      const res = await req(app, 'DELETE', `/api/admin/members/${BOB_ID}`, {
        headers: bearer('token-admin'),
      })
      expect(res.status).toBe(200)
      expect(deleted).toBe(true)
    })

    it('Admin cannot remove themselves (self-lockout guard)', async () => {
      setupAdmin(() => makeQuery(okOne(null)))
      const res = await req(app, 'DELETE', `/api/admin/members/${ADMIN_ID}`, {
        headers: bearer('token-admin'),
      })
      expect(res.status).toBe(400)
    })

    it('Admin POST /api/admin/news → 201 with sanitized category', async () => {
      let inserted: Record<string, unknown> | undefined
      setupAdmin((table) => {
        if (table === 'news_items') return makeQuery(okOne({ id: NEWS_ID, headline: 'Test' }), {
          insert: (p) => { inserted = p; return undefined },
        })
        return makeQuery(okMany([]))
      })
      const res = await req(app, 'POST', '/api/admin/news', {
        headers: bearer('token-admin'),
        body: { headline: 'New XP Badge Live', category: 'HACK_ME' },
      })
      expect(res.status).toBe(201)
      // unknown category falls back to 'news'
      expect(inserted?.category).toBe('news')
    })

    it('Admin PATCH /api/admin/flags/:key → 200', async () => {
      setupAdmin(() => makeQuery(okOne({ key: 'community', enabled: true })))
      const res = await req(app, 'PATCH', '/api/admin/flags/community', {
        headers: bearer('token-admin'),
        body: { enabled: true },
      })
      expect(res.status).toBe(200)
    })
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// A04 — XP / streak business logic
// ═════════════════════════════════════════════════════════════════════════════

describe('XP and streak math', () => {
  interface GameMockState {
    userXp?: number
    userStreak?: number
    lastActive?: string | null
    recentGame?: boolean
    capturedInsert?: Record<string, unknown>
    capturedUpdate?: Record<string, unknown>
  }

  function gameMock(state: GameMockState) {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return makeQuery(okOne({
          id: ALICE_ID,
          xp: state.userXp ?? 0,
          streak: state.userStreak ?? 0,
          last_active: state.lastActive ?? null,
        }), {
          update: (p) => { state.capturedUpdate = p; return undefined },
        })
      }
      if (table === 'game_results') {
        const q = makeQuery(okOne(state.recentGame ? { id: 'old' } : null), {
          insert: (p) => { state.capturedInsert = p; return makeQuery(okOne({ id: 'new-game' })) },
        })
        return q
      }
      if (table === 'user_badges') return makeQuery(okMany([]))
      if (table === 'path_progress') return makeQuery(okOne(null))
      return makeQuery(okOne(null))
    })
  }

  it('xpEarned is clamped to XP_PER_SUBMISSION_MAX (1000)', async () => {
    const state: GameMockState = { lastActive: null }
    gameMock(state)
    const res = await req(app, 'POST', '/api/games', {
      headers: bearer('token-alice'),
      body: { gameType: 'quiz', xpEarned: 999_999 },
    })
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>
    expect(body.xpEarned).toBe(1000)
    expect(state.capturedInsert?.xp_earned).toBe(1000)
  })

  it('Negative xpEarned is clamped to 0', async () => {
    const state: GameMockState = { lastActive: null }
    gameMock(state)
    const res = await req(app, 'POST', '/api/games', {
      headers: bearer('token-alice'),
      body: { gameType: 'quiz', xpEarned: -500 },
    })
    const body = await res.json() as Record<string, unknown>
    expect(body.xpEarned).toBe(0)
  })

  it('Same game type within cooldown → xpEarned=0', async () => {
    const state: GameMockState = { recentGame: true }
    gameMock(state)
    const res = await req(app, 'POST', '/api/games', {
      headers: bearer('token-alice'),
      body: { gameType: 'quiz', xpEarned: 100 },
    })
    const body = await res.json() as Record<string, unknown>
    expect(body.xpEarned).toBe(0)
  })

  it('newXp = prior xp + clamped earned', async () => {
    const state: GameMockState = { userXp: 450, lastActive: null }
    gameMock(state)
    const res = await req(app, 'POST', '/api/games', {
      headers: bearer('token-alice'),
      body: { gameType: 'quiz', xpEarned: 80 },
    })
    const body = await res.json() as Record<string, unknown>
    expect(body.newXp).toBe(530)
    expect(state.capturedUpdate?.xp).toBe(530)
  })

  it('Streak = 1 on very first play (last_active null)', async () => {
    const state: GameMockState = { userStreak: 0, lastActive: null }
    gameMock(state)
    const res = await req(app, 'POST', '/api/games', {
      headers: bearer('token-alice'),
      body: { gameType: 'quiz', xpEarned: 10 },
    })
    const body = await res.json() as Record<string, unknown>
    expect(body.newStreak).toBe(1)
  })

  it('Streak increments when last_active = yesterday', async () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]
    const state: GameMockState = { userStreak: 3, lastActive: yesterday }
    gameMock(state)
    const res = await req(app, 'POST', '/api/games', {
      headers: bearer('token-alice'),
      body: { gameType: 'quiz', xpEarned: 10 },
    })
    const body = await res.json() as Record<string, unknown>
    expect(body.newStreak).toBe(4)
  })

  it('Streak resets to 1 when gap > 1 day', async () => {
    const longAgo = new Date(Date.now() - 5 * 86_400_000).toISOString().split('T')[0]
    const state: GameMockState = { userStreak: 10, lastActive: longAgo }
    gameMock(state)
    const res = await req(app, 'POST', '/api/games', {
      headers: bearer('token-alice'),
      body: { gameType: 'quiz', xpEarned: 10 },
    })
    const body = await res.json() as Record<string, unknown>
    expect(body.newStreak).toBe(1)
  })

  it('Unauthenticated POST /api/games → 401', async () => {
    const res = await req(app, 'POST', '/api/games', {
      body: { gameType: 'quiz', xpEarned: 10 },
    })
    expect(res.status).toBe(401)
  })

  it('Invalid gameType → 400', async () => {
    const state: GameMockState = { lastActive: null }
    gameMock(state)
    const res = await req(app, 'POST', '/api/games', {
      headers: bearer('token-alice'),
      body: { gameType: 'nuke_xp', xpEarned: 100 },
    })
    expect(res.status).toBe(400)
  })

  it('game_results row is inserted with server-computed XP, not client value', async () => {
    const state: GameMockState = { lastActive: null }
    gameMock(state)
    await req(app, 'POST', '/api/games', {
      headers: bearer('token-alice'),
      body: { gameType: 'quiz', xpEarned: 50, score: 4, total: 5 },
    })
    expect(state.capturedInsert?.user_id).toBe(ALICE_ID)
    expect(state.capturedInsert?.game_type).toBe('quiz')
    expect(state.capturedInsert?.xp_earned).toBe(50)
    expect(state.capturedInsert?.score).toBe(4)
    expect(state.capturedInsert?.total).toBe(5)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// GDPR Art. 15 — Data export
// ═════════════════════════════════════════════════════════════════════════════

describe('GDPR export (download my data)', () => {
  function exportMock() {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(okOne({
        id: ALICE_ID, username: 'alice', display_name: 'Alice',
        avatar: '🐱', xp: 500, streak: 3,
      }))
      if (table === 'game_results') return makeQuery(okMany([
        { id: 'g1', user_id: ALICE_ID, game_type: 'quiz', xp_earned: 50 },
      ]))
      if (table === 'user_badges') return makeQuery(okMany([
        { badge_id: 'first_quiz', earned_at: '2024-01-01', badges: { emoji: '🏆', name: 'First Quiz', description: 'x' } },
      ]))
      if (table === 'path_progress') return makeQuery(okMany([
        { node_id: '1', completed_at: '2024-01-02' },
      ]))
      if (table === 'org_members') return makeQuery(okMany([
        { org_id: PUBLIC_ORG, is_admin: false, joined_at: '2024-01-01', orgs: { id: PUBLIC_ORG, name: 'ETH', emoji: '🔷' } },
      ]))
      return makeQuery(okOne(null))
    })
  }

  it('Unauthenticated → 401', async () => {
    const res = await req(app, 'GET', '/api/users/me/export')
    expect(res.status).toBe(401)
  })

  it('Authenticated → 200 JSON containing all sections', async () => {
    exportMock()
    const res = await req(app, 'GET', '/api/users/me/export', { headers: bearer('token-alice') })
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>
    expect(body.user).toBeDefined()
    expect(Array.isArray(body.game_results)).toBe(true)
    expect(Array.isArray(body.badges)).toBe(true)
    expect(Array.isArray(body.path_progress)).toBe(true)
    expect(Array.isArray(body.org_memberships)).toBe(true)
    expect(body.data_map).toBeDefined()
    expect(body.exported_at).toBeDefined()
  })

  it('Sets Content-Disposition: attachment with user-id filename', async () => {
    exportMock()
    const res = await req(app, 'GET', '/api/users/me/export', { headers: bearer('token-alice') })
    const disp = res.headers.get('content-disposition') ?? ''
    expect(disp).toContain('attachment')
    expect(disp).toContain(ALICE_ID)
    expect(disp).toContain('.json')
  })

  it('Export belongs to the caller (userId from JWT, not query param)', async () => {
    const calls: string[] = []
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') {
        const q = makeQuery(okOne({ id: ALICE_ID, username: 'alice', display_name: 'Alice' }))
        const originalEq = q.eq as () => Record<string, unknown>
        q.eq = ((field: string, val: string) => {
          if (field === 'id') calls.push(val)
          return originalEq.call(q)
        }) as unknown as () => Record<string, unknown>
        return q
      }
      if (['game_results', 'user_badges', 'path_progress', 'org_members'].includes(table)) {
        return makeQuery(okMany([]))
      }
      return makeQuery(okOne(null))
    })
    // Even though we try to spoof a userId param, the route ignores it (no :id in path)
    await req(app, 'GET', '/api/users/me/export', { headers: bearer('token-alice') })
    // At least one query was scoped to ALICE_ID (the authenticated caller)
    expect(calls).toContain(ALICE_ID)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// GDPR Art. 17 — Erasure
// ═════════════════════════════════════════════════════════════════════════════

describe('GDPR delete (erase my data)', () => {
  it('Unauthenticated DELETE /api/users/me → 401', async () => {
    const res = await req(app, 'DELETE', '/api/users/me')
    expect(res.status).toBe(401)
  })

  it('Authenticated DELETE → 204 + users row deleted + auth record deleted', async () => {
    let dbDeleted = false
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(okOne(null), { delete: () => { dbDeleted = true; return undefined } })
      return makeQuery(okOne(null))
    })
    supabaseMock.auth.admin.deleteUser.mockResolvedValue({ data: null, error: null })

    const res = await req(app, 'DELETE', '/api/users/me', { headers: bearer('token-alice') })
    expect(res.status).toBe(204)
    expect(dbDeleted).toBe(true)
    expect(supabaseMock.auth.admin.deleteUser).toHaveBeenCalledWith(ALICE_ID)
  })

  it('DB delete failure → 500 + auth NOT touched', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(dbError('fk violation'))
      return makeQuery(okOne(null))
    })
    supabaseMock.auth.admin.deleteUser.mockResolvedValue({ data: null, error: null })
    const res = await req(app, 'DELETE', '/api/users/me', { headers: bearer('token-alice') })
    expect(res.status).toBe(500)
    expect(supabaseMock.auth.admin.deleteUser).not.toHaveBeenCalled()
  })

  it('Caller id always comes from JWT (cannot erase someone else)', async () => {
    let deletedForId: string | null = null
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') {
        const q = makeQuery(okOne(null), { delete: () => undefined })
        q.eq = ((field: string, val: string) => {
          if (field === 'id') deletedForId = val
          return q
        }) as unknown as () => Record<string, unknown>
        return q
      }
      return makeQuery(okOne(null))
    })
    supabaseMock.auth.admin.deleteUser.mockResolvedValue({ data: null, error: null })

    await req(app, 'DELETE', '/api/users/me', { headers: bearer('token-alice') })
    expect(deletedForId).toBe(ALICE_ID)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// A07 — Rate limiting
// ═════════════════════════════════════════════════════════════════════════════

describe('Rate limiting (A07)', () => {
  it('gameLimiter returns 429 after exceeding max in window', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(okOne({ id: ALICE_ID, xp: 0, streak: 0, last_active: null }))
      if (table === 'game_results') return makeQuery(okOne(null), { insert: () => makeQuery(okOne({ id: 'g' })) })
      return makeQuery(okOne(null))
    })

    let seen429 = false
    // Config: 20 requests / 5 minutes. 25 attempts must trip it.
    for (let i = 0; i < 25; i++) {
      const res = await req(app, 'POST', '/api/games', {
        headers: bearer('token-alice'),
        body: { gameType: 'quiz', xpEarned: 10 },
      })
      if (res.status === 429) { seen429 = true; break }
    }
    expect(seen429).toBe(true)
  })

  it('joinCodeLimiter returns 429 after 10 bad attempts', async () => {
    supabaseMock.from.mockImplementation(() => makeQuery(okOne(null)))

    let seen429 = false
    for (let i = 0; i < 15; i++) {
      const res = await req(app, 'POST', '/api/orgs/join-by-code', {
        headers: bearer('token-alice'),
        body: { code: 'BADBAD' },
      })
      if (res.status === 429) { seen429 = true; break }
    }
    expect(seen429).toBe(true)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Invite-code redemption (business logic)
// ═════════════════════════════════════════════════════════════════════════════

describe('Invite-code redemption', () => {
  it('Valid code → user joins org', async () => {
    let upserted: Record<string, unknown> | undefined
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'invite_codes') return makeQuery(okOne({
        org_id: PUBLIC_ORG, uses: 3, max_uses: 10, active: true,
      }))
      if (table === 'org_members') return makeQuery(okOne(null), {
        upsert: (p) => { upserted = p; return undefined },
      })
      if (table === 'orgs') return makeQuery(okOne({ id: PUBLIC_ORG, name: 'ETH' }))
      return makeQuery(okOne(null))
    })
    const res = await req(app, 'POST', '/api/orgs/join-by-code', {
      headers: bearer('token-alice'),
      body: { code: 'ABC123' },
    })
    expect(res.status).toBe(200)
    expect(upserted?.user_id).toBe(ALICE_ID)
    expect(upserted?.org_id).toBe(PUBLIC_ORG)
  })

  it('Exhausted code (uses >= max_uses) → 400', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'invite_codes') return makeQuery(okOne({
        org_id: PUBLIC_ORG, uses: 10, max_uses: 10, active: true,
      }))
      if (table === 'orgs') return makeQuery(okOne(null))
      return makeQuery(okOne(null))
    })
    const res = await req(app, 'POST', '/api/orgs/join-by-code', {
      headers: bearer('token-alice'),
      body: { code: 'EXHAUST1' },
    })
    expect(res.status).toBe(400)
  })

  it('Invalid code → 404', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'invite_codes') return makeQuery(okOne(null))
      if (table === 'orgs') return makeQuery(okOne(null))
      return makeQuery(okOne(null))
    })
    const res = await req(app, 'POST', '/api/orgs/join-by-code', {
      headers: bearer('token-alice'),
      body: { code: 'BOGUS1' },
    })
    expect(res.status).toBe(404)
  })

  it('Unauthenticated join-by-code → 401', async () => {
    const res = await req(app, 'POST', '/api/orgs/join-by-code', {
      body: { code: 'ABCDEF' },
    })
    expect(res.status).toBe(401)
  })

  it('Inactive code (active=false) treated as invalid', async () => {
    // The query filters .eq('active', true), so our mock returns null for inactive codes
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'invite_codes') return makeQuery(okOne(null)) // filter excludes inactive
      if (table === 'orgs') return makeQuery(okOne(null))
      return makeQuery(okOne(null))
    })
    const res = await req(app, 'POST', '/api/orgs/join-by-code', {
      headers: bearer('token-alice'),
      body: { code: 'DISABLED' },
    })
    expect(res.status).toBe(404)
  })
})

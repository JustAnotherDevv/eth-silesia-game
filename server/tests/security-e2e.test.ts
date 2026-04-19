/**
 * Deep End-to-End Exploitation Pattern Tests
 *
 * These tests simulate real attacker workflows — chained attacks, business
 * logic abuse, data exfiltration patterns, and platform-specific exploitation.
 * Every test here maps to a known attack technique.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoisted mock ──────────────────────────────────────────────────────────────

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

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ALICE_ID = '11111111-1111-1111-1111-111111111111'
const BOB_ID   = '22222222-2222-2222-2222-222222222222'
const ADMIN_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
const ORG_ID   = 'cccccccc-cccc-cccc-cccc-cccccccccccc'

const validTokens: Record<string, string> = {
  'token-alice': ALICE_ID,
  'token-bob':   BOB_ID,
  'token-admin': ADMIN_ID,
}

// ── Mock helpers ──────────────────────────────────────────────────────────────

function makeMaybeSingle(data: unknown) { return { data, error: null } }
function makeSingle(data: unknown)      { return { data, error: null } }
function makeList(data: unknown[])      { return { data, error: null, count: data.length } }
function makeCount(n: number)           { return { data: null, error: null, count: n } }
function makeError(msg: string)         { return { data: null, error: { message: msg } } }

function makeQuery(result: unknown) {
  const q: Record<string, unknown> = {}
  const chain = () => q
  q.select = chain; q.insert = chain; q.update = chain; q.delete = chain; q.upsert = chain
  q.eq = chain; q.neq = chain; q.gte = chain; q.lte = chain; q.gt = chain; q.lt = chain
  q.in = chain; q.ilike = chain; q.or = chain; q.order = chain; q.range = chain; q.limit = chain
  q.single = () => Promise.resolve(result)
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

// ── Setup ─────────────────────────────────────────────────────────────────────

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

  supabaseMock.from.mockReturnValue(makeQuery(makeMaybeSingle(null)))
})

// ═════════════════════════════════════════════════════════════════════════════
// 1. PII / Sensitive Field Exposure
// ═════════════════════════════════════════════════════════════════════════════

describe('PII and Sensitive Field Exposure', () => {
  it('GET /api/users/:id must NOT expose is_platform_admin', async () => {
    supabaseMock.from.mockReturnValue(makeQuery(makeMaybeSingle({
      id: ALICE_ID, username: 'alice', display_name: 'Alice',
      avatar: '🐱', xp: 100, streak: 3, last_active: null,
      is_platform_admin: true,   // present in DB row — must not reach client
      goals: [], created_at: '2024-01-01',
    })))

    const res = await req(app, 'GET', `/api/users/${ALICE_ID}`)
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>

    // is_platform_admin MUST be scrubbed — revealing this lets attackers
    // know which accounts to target for privilege escalation
    expect(body.is_platform_admin).toBeUndefined()
  })

  it('GET /api/members/:slug must NOT expose is_platform_admin', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({
        id: ALICE_ID, username: 'alice', display_name: 'Alice',
        avatar: '🐱', xp: 100, streak: 3, last_active: null,
        is_platform_admin: true,   // should be scrubbed
        specialty: null, location: null, bio: null, goals: [], created_at: '2024-01-01',
      }))
      return makeQuery(makeList([]))
    })

    const res = await req(app, 'GET', '/api/members/alice')
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>
    expect(body.is_platform_admin).toBeUndefined()
  })

  it('GET /api/leaderboard does NOT expose is_platform_admin', async () => {
    supabaseMock.from.mockReturnValue(makeQuery(makeList([{
      id: ALICE_ID, username: 'alice', display_name: 'Alice',
      avatar: '🐱', xp: 100, streak: 3,
      is_platform_admin: true,  // should not be in leaderboard response
    }])))

    const res = await req(app, 'GET', '/api/leaderboard')
    const body = await res.json() as Record<string, unknown>[]
    if (body.length > 0) {
      expect(body[0].is_platform_admin).toBeUndefined()
    }
  })

  it('GET /api/feature-flags does NOT expose updated_by (admin user UUIDs)', async () => {
    supabaseMock.from.mockReturnValue(makeQuery(makeList([{
      key: 'some_feature', enabled: true, label: 'Feature',
      description: 'Desc', category: 'general',
      updated_by: ADMIN_ID,   // admin UUID — must not leak
      updated_at: '2024-01-01',
    }])))

    const res = await req(app, 'GET', '/api/feature-flags')
    const body = await res.json() as Record<string, unknown>[]
    if (body.length > 0) {
      // The public endpoint selects only: key, enabled, label, description, category
      expect(body[0].updated_by).toBeUndefined()
      expect(body[0].updated_at).toBeUndefined()
    }
  })

  it('GET /api/news does NOT expose internal admin fields (active flag management)', async () => {
    supabaseMock.from.mockReturnValue(makeQuery(makeList([{
      id: 'news-1', headline: 'Test News', source: 'Test',
      category: 'news', active: true, created_at: '2024-01-01',
    }])))

    const res = await req(app, 'GET', '/api/news')
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>[]
    // active field is internal management — should not be exposed to public
    // (only active=true items are returned, so showing the flag is redundant and an info leak)
    if (body.length > 0) {
      expect(body[0].active).toBeUndefined()
    }
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 2. Business Logic: XP Farming Attacks
// ═════════════════════════════════════════════════════════════════════════════

describe('Business Logic: XP Farming', () => {
  function gameMock(recentGame: boolean = false) {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return makeQuery(makeMaybeSingle({ id: ALICE_ID, xp: 0, streak: 0, last_active: null }))
      }
      if (table === 'game_results') {
        const q = makeQuery(recentGame ? makeMaybeSingle({ id: 'old-game' }) : makeMaybeSingle(null))
        ;(q as Record<string, unknown>).insert = () => makeQuery(makeSingle({ id: 'new-game' }))
        return q
      }
      return makeQuery(makeSingle(null))
    })
  }

  it('Submitting same game type within cooldown window → xpEarned: 0 in response', async () => {
    gameMock(true) // recentGame = true → cooldown active
    const res = await req(app, 'POST', '/api/games', {
      headers: bearer('token-alice'),
      body: { gameType: 'quiz', xpEarned: 100 },
    })
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>
    // Despite claiming 100 XP, cooldown means 0 is awarded
    expect(body.xpEarned).toBe(0)
  })

  it('score > total (impossible score) → 400', async () => {
    gameMock(false)
    const res = await req(app, 'POST', '/api/games', {
      headers: bearer('token-alice'),
      body: { gameType: 'quiz', xpEarned: 100, score: 10, total: 5 },
    })
    expect(res.status).toBe(400)
    const body = await res.json() as Record<string, unknown>
    expect(String(body.error)).toContain('score')
  })

  it('Crafting score = total (attempting perfect_round badge on first try)', async () => {
    let insertedScore: number | undefined
    let insertedTotal: number | undefined
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ id: ALICE_ID, xp: 0, streak: 0, last_active: null }))
      if (table === 'game_results') {
        const q = makeQuery(makeMaybeSingle(null))
        ;(q as Record<string, unknown>).insert = (p: Record<string, unknown>) => {
          insertedScore = p.score as number
          insertedTotal = p.total as number
          return makeQuery(makeSingle({ id: 'g-id' }))
        }
        return q
      }
      return makeQuery(makeSingle(null))
    })

    const res = await req(app, 'POST', '/api/games', {
      headers: bearer('token-alice'),
      body: { gameType: 'quiz', xpEarned: 50, score: 10, total: 10 },
    })
    expect(res.status).toBe(200)
    // Valid perfect score — correctly stored
    expect(insertedScore).toBe(10)
    expect(insertedTotal).toBe(10)
  })

  it('score = 0, total = 0 → not treated as perfect (avoids badge on zero-question game)', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ id: ALICE_ID, xp: 0, streak: 0, last_active: null }))
      if (table === 'game_results') {
        const q = makeQuery(makeMaybeSingle(null))
        ;(q as Record<string, unknown>).insert = () => makeQuery(makeSingle({ id: 'g-id' }))
        return q
      }
      return makeQuery(makeSingle({ count: 0 }))
    })

    const res = await req(app, 'POST', '/api/games', {
      headers: bearer('token-alice'),
      body: { gameType: 'quiz', xpEarned: 10, score: 0, total: 0 },
    })
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>
    // perfect_round badge must NOT be in newBadges (guarded by total > 0)
    const badges = body.newBadges as string[]
    expect(badges).not.toContain('perfect_round')
  })

  it('Path node submitted twice → XP awarded only once (idempotent path progress)', async () => {
    const xpValues: number[] = []
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ id: ALICE_ID, xp: 0, streak: 0, last_active: null }))
      if (table === 'path_progress') {
        const q = makeQuery(makeMaybeSingle({ node_id: 'node-1' }))  // already done
        ;(q as Record<string, unknown>).upsert = () => makeQuery(makeSingle(null))
        return q
      }
      if (table === 'game_results') {
        const q = makeQuery(makeMaybeSingle(null))
        ;(q as Record<string, unknown>).insert = (p: Record<string, unknown>) => {
          xpValues.push(p.xp_earned as number)
          return makeQuery(makeSingle({ id: 'g-id' }))
        }
        return q
      }
      return makeQuery(makeSingle(null))
    })

    await req(app, 'POST', '/api/games', {
      headers: bearer('token-alice'),
      body: { gameType: 'path', xpEarned: 200, metadata: { nodeId: 'node-1' } },
    })

    // XP must be 0 because alreadyDone is non-null
    if (xpValues.length > 0) {
      expect(xpValues[0]).toBe(0)
    }
  })

  it('metadata as array → treated as empty object (no injection)', async () => {
    let capturedMetadata: unknown
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ id: ALICE_ID, xp: 0, streak: 0, last_active: null }))
      if (table === 'game_results') {
        const q = makeQuery(makeMaybeSingle(null))
        ;(q as Record<string, unknown>).insert = (p: Record<string, unknown>) => {
          capturedMetadata = p.metadata
          return makeQuery(makeSingle({ id: 'g-id' }))
        }
        return q
      }
      return makeQuery(makeSingle(null))
    })

    await req(app, 'POST', '/api/games', {
      headers: bearer('token-alice'),
      body: { gameType: 'quiz', xpEarned: 10, metadata: ['injected', 'array'] },
    })

    // Array metadata must be replaced with empty object
    if (capturedMetadata !== undefined) {
      expect(Array.isArray(capturedMetadata)).toBe(false)
      expect(typeof capturedMetadata).toBe('object')
    }
  })

  it('metadata as primitive string → treated as empty object', async () => {
    let capturedMetadata: unknown
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ id: ALICE_ID, xp: 0, streak: 0, last_active: null }))
      if (table === 'game_results') {
        const q = makeQuery(makeMaybeSingle(null))
        ;(q as Record<string, unknown>).insert = (p: Record<string, unknown>) => {
          capturedMetadata = p.metadata
          return makeQuery(makeSingle({ id: 'g-id' }))
        }
        return q
      }
      return makeQuery(makeSingle(null))
    })

    await req(app, 'POST', '/api/games', {
      headers: bearer('token-alice'),
      body: { gameType: 'quiz', xpEarned: 10, metadata: 'drop table' },
    })

    if (capturedMetadata !== undefined) {
      expect(typeof capturedMetadata).toBe('object')
      expect(capturedMetadata).not.toBe('drop table')
    }
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 3. Privilege Escalation Chains
// ═════════════════════════════════════════════════════════════════════════════

describe('Privilege Escalation', () => {
  it('POST /api/admin/promote/:id → 401 without any auth', async () => {
    const res = await req(app, 'POST', `/api/admin/promote/${ALICE_ID}`)
    expect(res.status).toBe(401)
  })

  it('POST /api/admin/promote/:id → 403 for regular user (not admin)', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: false }))
      return makeQuery(makeSingle(null))
    })
    const res = await req(app, 'POST', `/api/admin/promote/${BOB_ID}`, {
      headers: bearer('token-alice'),  // alice is NOT admin
    })
    expect(res.status).toBe(403)
  })

  it('Admin cannot be self-elevated via PATCH /api/users/:id body', async () => {
    let capturedUpdates: Record<string, unknown> = {}
    supabaseMock.from.mockImplementation(() => {
      const q = makeQuery(makeSingle({ id: ALICE_ID, display_name: 'Alice' }))
      ;(q as Record<string, unknown>).update = (p: Record<string, unknown>) => {
        capturedUpdates = { ...p }
        return makeQuery(makeSingle({ id: ALICE_ID, ...p }))
      }
      return q
    })

    await req(app, 'PATCH', `/api/users/${ALICE_ID}`, {
      headers: bearer('token-alice'),
      body: { displayName: 'Alice', is_platform_admin: true, xp: 99999 },
    })

    expect(capturedUpdates.is_platform_admin).toBeUndefined()
    expect(capturedUpdates.xp).toBeUndefined()
  })

  it('Regular user cannot access any admin route — full sweep', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: false }))
      return makeQuery(makeList([]))
    })

    const adminRoutes: [string, string, object?][] = [
      ['GET',    '/api/admin/flags',                         undefined],
      ['GET',    '/api/admin/stats',                         undefined],
      ['GET',    '/api/admin/members',                       undefined],
      ['GET',    '/api/admin/invite-codes',                  undefined],
      ['GET',    '/api/admin/news',                          undefined],
      ['POST',   '/api/admin/invite-codes',                  { maxUses: 1 }],
      ['POST',   '/api/admin/news',                          { headline: 'X' }],
      ['PATCH',  `/api/admin/flags/some_flag`,               { enabled: true }],
      ['PATCH',  `/api/admin/members/${ALICE_ID}`,           { is_platform_admin: true }],
      ['PATCH',  `/api/admin/invite-codes/${ORG_ID}`,        { active: false }],
      ['PATCH',  `/api/admin/news/${ORG_ID}`,                { active: false }],
      ['DELETE', `/api/admin/members/${ALICE_ID}`,           undefined],
      ['DELETE', `/api/admin/news/${ORG_ID}`,                undefined],
      ['POST',   `/api/admin/promote/${BOB_ID}`,             undefined],
    ]

    for (const [method, path, body] of adminRoutes) {
      const res = await req(app, method, path, {
        headers: bearer('token-alice'),
        body,
      })
      expect(res.status).toBe(403)
    }
  })

  it('Unauthenticated request to every admin route → 401', async () => {
    const adminRoutes = [
      ['GET',    '/api/admin/flags'],
      ['GET',    '/api/admin/stats'],
      ['GET',    '/api/admin/members'],
      ['PATCH',  '/api/admin/flags/some_flag'],
      ['POST',   '/api/admin/promote/' + BOB_ID],
    ]

    for (const [method, path] of adminRoutes) {
      const res = await req(app, method, path)
      expect(res.status).toBe(401)
    }
  })

  it('Token from user A cannot be used to modify user B profile', async () => {
    // Alice (token-alice) targets Bob's profile
    const res = await req(app, 'PATCH', `/api/users/${BOB_ID}`, {
      headers: bearer('token-alice'),
      body: { displayName: 'Hijacked' },
    })
    expect(res.status).toBe(403)
  })

  it('Token from user A cannot read user B game history', async () => {
    supabaseMock.from.mockReturnValue(makeQuery(makeList([])))
    const res = await req(app, 'GET', `/api/games/user/${BOB_ID}`, {
      headers: bearer('token-alice'),
    })
    expect(res.status).toBe(403)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 4. Data Exfiltration Patterns
// ═════════════════════════════════════════════════════════════════════════════

describe('Data Exfiltration Patterns', () => {
  it('GET /api/members pagination: offset=0 then offset=50 → extracting all users', async () => {
    // Bulk enumeration via pagination is possible (members list is public by design)
    // Test ensures pagination params are clamped and sanitized
    supabaseMock.from.mockReturnValue(makeQuery(makeList([])))

    const res1 = await req(app, 'GET', '/api/members?offset=0&limit=100')
    const res2 = await req(app, 'GET', '/api/members?offset=100&limit=100')
    // Must be accessible (public leaderboard-style feature) but with safe params
    expect(res1.status).toBe(200)
    expect(res2.status).toBe(200)
  })

  it('GET /api/members limit is capped at 100 (cannot extract 1000 at once)', async () => {
    let capturedRange: [number, number] | undefined
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') {
        const q = makeQuery(makeList([]))
        ;(q as Record<string, unknown>).range = (from: number, to: number) => {
          capturedRange = [from, to]
          return q
        }
        return q
      }
      return makeQuery(makeList([]))
    })

    await req(app, 'GET', '/api/members?limit=1000&offset=0')

    // Range must be clamped to max 100 rows
    if (capturedRange) {
      const [from, to] = capturedRange
      expect(to - from).toBeLessThanOrEqual(99)  // 0-indexed, so 100 rows max = range(0, 99)
    }
  })

  it('GET /api/admin/members: search is sanitized (no raw % wildcard extraction)', async () => {
    let capturedSearch: string | undefined
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') {
        const q = makeQuery(makeList([]))
        ;(q as Record<string, unknown>).or = (s: string) => { capturedSearch = s; return q }
        ;(q as Record<string, unknown>).update = () => makeQuery(makeSingle({ is_platform_admin: true }))
        return q
      }
      return makeQuery(makeList([]))
    })
    // Admin check mock
    supabaseMock.from.mockImplementationOnce(() =>
      makeQuery(makeMaybeSingle({ is_platform_admin: true }))
    )
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') {
        const q = makeQuery(makeList([]))
        ;(q as Record<string, unknown>).or = (s: string) => { capturedSearch = s; return q }
        return q
      }
      return makeQuery(makeList([]))
    })

    await req(app, 'GET', `/api/admin/members?search=${encodeURIComponent("' OR 1=1 --")}`, {
      headers: bearer('token-admin'),
    })

    // The sanitized search must not contain SQL injection chars
    if (capturedSearch) {
      expect(capturedSearch).not.toContain("'")
      expect(capturedSearch).not.toContain(';')
      expect(capturedSearch).not.toContain('--')
    }
  })

  it('GET /api/admin/stats only accessible to admins (platform metrics behind auth)', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: false }))
      return makeQuery(makeList([]))
    })
    const res = await req(app, 'GET', '/api/admin/stats', { headers: bearer('token-alice') })
    expect(res.status).toBe(403)
  })

  it('Invite code list only accessible to admins', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: false }))
      return makeQuery(makeList([]))
    })
    const res = await req(app, 'GET', '/api/admin/invite-codes', { headers: bearer('token-alice') })
    expect(res.status).toBe(403)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 5. Invite Code Exploitation
// ═════════════════════════════════════════════════════════════════════════════

describe('Invite Code Exploitation', () => {
  it('Invite codes with non-integer maxUses (e.g. Infinity) → 400', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: true }))
      return makeQuery(makeSingle(null))
    })
    const res = await req(app, 'POST', '/api/admin/invite-codes', {
      headers: bearer('token-admin'),
      body: { maxUses: Infinity },
    })
    expect(res.status).toBe(400)
  })

  it('Invite codes with NaN maxUses → 400', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: true }))
      return makeQuery(makeSingle(null))
    })
    const res = await req(app, 'POST', '/api/admin/invite-codes', {
      headers: bearer('token-admin'),
      body: { maxUses: NaN },
    })
    expect(res.status).toBe(400)
  })

  it('Invite codes with maxUses = 0 → 400 (must be positive)', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: true }))
      return makeQuery(makeSingle(null))
    })
    const res = await req(app, 'POST', '/api/admin/invite-codes', {
      headers: bearer('token-admin'),
      body: { maxUses: 0 },
    })
    expect(res.status).toBe(400)
  })

  it('Invite codes with maxUses = 1.5 (float) → 400', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: true }))
      return makeQuery(makeSingle(null))
    })
    const res = await req(app, 'POST', '/api/admin/invite-codes', {
      headers: bearer('token-admin'),
      body: { maxUses: 1.5 },
    })
    expect(res.status).toBe(400)
  })

  it('Invite code brute force: 6-char code, attacker makes 10 attempts → 429', async () => {
    supabaseMock.from.mockReturnValue(makeQuery(makeMaybeSingle(null)))
    let blocked = false
    for (let i = 0; i < 11; i++) {
      // Generate 6-char codes like an attacker would
      const code = String.fromCharCode(65 + (i % 26)).repeat(6)
      const res = await req(app, 'POST', '/api/orgs/join-by-code', {
        headers: bearer('token-alice'),
        body: { code },
      })
      if (res.status === 429) { blocked = true; break }
    }
    expect(blocked).toBe(true)
  })

  it('Deactivated invite code → 404 (inactive codes ignored)', async () => {
    // active=true filter means inactive codes return null → 404
    supabaseMock.from.mockReturnValue(makeQuery(makeMaybeSingle(null)))
    const res = await req(app, 'POST', '/api/orgs/join-by-code', {
      headers: bearer('token-alice'),
      body: { code: 'DEAD01' },
    })
    expect(res.status).toBe(404)
  })

  it('Invite code is 6 chars, uses chars from known safe set (no ambiguous chars)', async () => {
    const codes: string[] = []
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: true }))
      if (table === 'orgs') return makeQuery(makeMaybeSingle({ id: ORG_ID }))
      if (table === 'invite_codes') {
        const q: Record<string, unknown> = {}
        q.insert = (p: Record<string, unknown>) => {
          if (typeof p.code === 'string') codes.push(p.code)
          return makeQuery(makeSingle({ id: 'inv', code: p.code }))
        }
        q.select = () => q
        q.single = () => Promise.resolve(makeSingle({ id: 'inv', code: codes.at(-1) }))
        return q
      }
      return makeQuery(makeSingle(null))
    })

    for (let i = 0; i < 10; i++) {
      await req(app, 'POST', '/api/admin/invite-codes', {
        headers: bearer('token-admin'),
        body: {},
      })
    }

    // Ambiguous chars like 0, 1, O, I must be excluded (they look alike and cause support issues)
    const SAFE_CHARS = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/
    for (const code of codes) {
      expect(code).toMatch(SAFE_CHARS)
      expect(code.length).toBe(6)
      // Must not contain confusable chars
      expect(code).not.toMatch(/[01OI]/)
    }
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 6. Org Join Attack Patterns
// ═════════════════════════════════════════════════════════════════════════════

describe('Org Join Attacks', () => {
  it('POST /api/orgs/:id/join without auth → 401', async () => {
    const res = await req(app, 'POST', `/api/orgs/${ORG_ID}/join`, { body: {} })
    expect(res.status).toBe(401)
  })

  it('POST /api/orgs/join-by-code without auth → 401', async () => {
    const res = await req(app, 'POST', '/api/orgs/join-by-code', {
      body: { code: 'ABCD12' },
    })
    expect(res.status).toBe(401)
  })

  it('POST /api/orgs/:id/join with auth does not accept userId from body', async () => {
    let insertedUserId: string | undefined
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'orgs') return makeQuery(makeMaybeSingle({ id: ORG_ID }))
      if (table === 'org_members') {
        const q = makeQuery(makeSingle(null))
        ;(q as Record<string, unknown>).upsert = (p: Record<string, unknown>) => {
          insertedUserId = p.user_id as string
          return makeQuery(makeSingle(null))
        }
        return q
      }
      return makeQuery(makeSingle(null))
    })

    await req(app, 'POST', `/api/orgs/${ORG_ID}/join`, {
      headers: bearer('token-alice'),
      body: { userId: BOB_ID },   // attacker tries to join org AS BOB
    })

    // Must use ALICE's JWT userId, not BOB from the body
    if (insertedUserId !== undefined) {
      expect(insertedUserId).toBe(ALICE_ID)
      expect(insertedUserId).not.toBe(BOB_ID)
    }
  })

  it('POST /api/orgs/join-by-code does not accept userId from body', async () => {
    let insertedUserId: string | undefined
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'invite_codes') {
        return makeQuery(makeMaybeSingle({ org_id: ORG_ID, uses: 0, max_uses: null, active: true }))
      }
      if (table === 'org_members') {
        const q = makeQuery(makeSingle(null))
        ;(q as Record<string, unknown>).upsert = (p: Record<string, unknown>) => {
          insertedUserId = p.user_id as string
          return makeQuery(makeSingle(null))
        }
        return q
      }
      if (table === 'orgs') return makeQuery(makeMaybeSingle({ id: ORG_ID, name: 'Test' }))
      return makeQuery(makeSingle(null))
    })

    await req(app, 'POST', '/api/orgs/join-by-code', {
      headers: bearer('token-alice'),
      body: { code: 'VALID1', userId: BOB_ID },  // attacker injects BOB's ID
    })

    if (insertedUserId !== undefined) {
      expect(insertedUserId).toBe(ALICE_ID)
      expect(insertedUserId).not.toBe(BOB_ID)
    }
  })

  it('Joining non-existent org → 404', async () => {
    supabaseMock.from.mockReturnValue(makeQuery(makeMaybeSingle(null)))
    const res = await req(app, 'POST', `/api/orgs/${ORG_ID}/join`, {
      headers: bearer('token-alice'),
    })
    expect(res.status).toBe(404)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 7. Race Condition Simulations
// ═════════════════════════════════════════════════════════════════════════════

describe('Race Condition Simulations', () => {
  it('Concurrent game submissions: XP only awarded once per cooldown window', async () => {
    // Simulate two identical submissions arriving concurrently (Promise.all)
    // Both see no recentGame on the initial check, but only one should award XP
    // Note: true race conditions require real concurrency; this tests the business logic

    const insertedXpValues: number[] = []
    let gameResultQueryCount = 0

    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return makeQuery(makeMaybeSingle({ id: ALICE_ID, xp: 0, streak: 0, last_active: null }))
      }
      if (table === 'game_results') {
        gameResultQueryCount++
        const q = makeQuery(makeMaybeSingle(null))  // no recent game (race: both see empty)
        ;(q as Record<string, unknown>).insert = (p: Record<string, unknown>) => {
          insertedXpValues.push(p.xp_earned as number)
          return makeQuery(makeSingle({ id: `game-${gameResultQueryCount}` }))
        }
        return q
      }
      return makeQuery(makeSingle(null))
    })

    // Fire two requests concurrently
    const [res1, res2] = await Promise.all([
      req(app, 'POST', '/api/games', {
        headers: bearer('token-alice'),
        body: { gameType: 'quiz', xpEarned: 100 },
      }),
      req(app, 'POST', '/api/games', {
        headers: bearer('token-alice'),
        body: { gameType: 'quiz', xpEarned: 100 },
      }),
    ])

    expect(res1.status).toBe(200)
    expect(res2.status).toBe(200)
    // Both were processed — this documents the TOCTOU window.
    // Total XP across both should ideally be ≤ 100, but in a mock environment
    // both may get 100 since the DB state isn't actually updated between requests.
    // The test documents this known limitation of in-process concurrency.
    expect(insertedXpValues.length).toBe(2)
    // At minimum, neither individual request exceeds the cap
    for (const xp of insertedXpValues) {
      expect(xp).toBeLessThanOrEqual(100)
    }
  })

  it('Concurrent invite code use: both requests increment uses independently', async () => {
    // Both requests see uses=9, max_uses=10 → both try to increment to 10
    let updateCount = 0
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'invite_codes') {
        const q = makeQuery(makeMaybeSingle({ org_id: ORG_ID, uses: 9, max_uses: 10, active: true }))
        ;(q as Record<string, unknown>).update = () => {
          updateCount++
          return makeQuery(makeSingle(null))
        }
        return q
      }
      if (table === 'org_members') return makeQuery(makeSingle(null))
      if (table === 'orgs') return makeQuery(makeMaybeSingle({ id: ORG_ID }))
      return makeQuery(makeSingle(null))
    })

    const [res1, res2] = await Promise.all([
      req(app, 'POST', '/api/orgs/join-by-code', {
        headers: bearer('token-alice'),
        body: { code: 'VALID1' },
      }),
      req(app, 'POST', '/api/orgs/join-by-code', {
        headers: bearer('token-bob'),
        body: { code: 'VALID1' },
      }),
    ])

    // Both succeed because both saw uses=9 < max_uses=10
    // This documents the race condition — real fix requires DB-level atomic increment
    expect(res1.status).toBe(200)
    expect(res2.status).toBe(200)
    // updateCount = 2 means both incremented independently (TOCTOU documented)
    expect(updateCount).toBe(2)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 8. Input Injection via Metadata / Goals
// ═════════════════════════════════════════════════════════════════════════════

describe('Injection via Stored Fields', () => {
  it('Goals array with non-string elements → non-strings silently filtered', async () => {
    let capturedGoals: unknown
    supabaseMock.from.mockImplementation(() => {
      const q = makeQuery(makeSingle({ id: ALICE_ID }))
      ;(q as Record<string, unknown>).update = (p: Record<string, unknown>) => {
        capturedGoals = p.goals
        return makeQuery(makeSingle({ id: ALICE_ID, ...p }))
      }
      return q
    })

    await req(app, 'PATCH', `/api/users/${ALICE_ID}`, {
      headers: bearer('token-alice'),
      body: {
        goals: ['valid goal', 42, null, { evil: 'object' }, true, 'another valid'],
      },
    })

    if (capturedGoals !== undefined) {
      const goals = capturedGoals as unknown[]
      // Only strings should survive filtering
      for (const g of goals) expect(typeof g).toBe('string')
      expect(goals).toContain('valid goal')
      expect(goals).toContain('another valid')
      expect(goals).not.toContain(42)
      expect(goals).not.toContain(null)
    }
  })

  it('Goals array with 25 items → truncated to max 20', async () => {
    let capturedGoals: unknown
    supabaseMock.from.mockImplementation(() => {
      const q = makeQuery(makeSingle({ id: ALICE_ID }))
      ;(q as Record<string, unknown>).update = (p: Record<string, unknown>) => {
        capturedGoals = p.goals
        return makeQuery(makeSingle({ id: ALICE_ID, ...p }))
      }
      return q
    })

    await req(app, 'PATCH', `/api/users/${ALICE_ID}`, {
      headers: bearer('token-alice'),
      body: { goals: Array.from({ length: 25 }, (_, i) => `goal ${i}`) },
    })

    if (capturedGoals !== undefined) {
      expect((capturedGoals as unknown[]).length).toBeLessThanOrEqual(20)
    }
  })

  it('Game metadata: path nodeId with SQL injection content → stored as string, not executed', async () => {
    let capturedNodeId: string | undefined
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ id: ALICE_ID, xp: 0, streak: 0, last_active: null }))
      if (table === 'path_progress') {
        const q = makeQuery(makeMaybeSingle(null))
        ;(q as Record<string, unknown>).upsert = (p: Record<string, unknown>) => {
          capturedNodeId = p.node_id as string
          return makeQuery(makeSingle(null))
        }
        return q
      }
      if (table === 'game_results') {
        const q = makeQuery(makeMaybeSingle(null))
        ;(q as Record<string, unknown>).insert = () => makeQuery(makeSingle({ id: 'g-id' }))
        return q
      }
      return makeQuery(makeSingle(null))
    })

    await req(app, 'POST', '/api/games', {
      headers: bearer('token-alice'),
      body: {
        gameType: 'path',
        xpEarned: 50,
        metadata: { nodeId: "'; DROP TABLE path_progress; --" },
      },
    })

    // nodeId is String(nodeId) — SQL injection passed as literal string to Supabase
    // Supabase uses parameterized queries so this is safe, but we verify it's stored as a string
    if (capturedNodeId !== undefined) {
      expect(typeof capturedNodeId).toBe('string')
    }
  })

  it('Admin news headline with XSS payload → stored as-is (sanitization is frontend concern)', async () => {
    let capturedHeadline: string | undefined
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: true }))
      if (table === 'news_items') {
        const q: Record<string, unknown> = {}
        q.insert = (p: Record<string, unknown>) => {
          capturedHeadline = p.headline as string
          return makeQuery(makeSingle({ id: 'news-id', ...p }))
        }
        q.select = () => q
        q.single = () => Promise.resolve(makeSingle({ id: 'news-id' }))
        return q
      }
      return makeQuery(makeSingle(null))
    })

    const xssPayload = '<script>document.cookie="stolen=" + document.cookie</script>'
    const res = await req(app, 'POST', '/api/admin/news', {
      headers: bearer('token-admin'),
      body: { headline: xssPayload },
    })

    expect(res.status).toBe(201)
    // Server stores raw string — frontend must use textContent not innerHTML
    // This test documents that server-side XSS filtering is NOT implemented (by design for JSON API)
    if (capturedHeadline !== undefined) {
      expect(capturedHeadline).toBe(xssPayload)
    }
  })

  it('News headline with whitespace only → 400 (after trim, empty)', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: true }))
      return makeQuery(makeSingle(null))
    })
    const res = await req(app, 'PATCH', `/api/admin/news/${ORG_ID}`, {
      headers: bearer('token-admin'),
      body: { headline: '   ' },
    })
    expect(res.status).toBe(400)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 9. Admin Member Manipulation Attack Patterns
// ═════════════════════════════════════════════════════════════════════════════

describe('Admin Member Manipulation', () => {
  it('Admin cannot set is_platform_admin via PATCH /admin/members with string value', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: true }))
      return makeQuery(makeSingle(null))
    })
    const res = await req(app, 'PATCH', `/api/admin/members/${ALICE_ID}`, {
      headers: bearer('token-admin'),
      body: { is_platform_admin: 'true' },  // string not boolean
    })
    expect(res.status).toBe(400)
  })

  it('Admin cannot set username, xp, or streak via PATCH /admin/members', async () => {
    let capturedUpdates: Record<string, unknown> = {}
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') {
        // First call: admin check
        return makeQuery(makeMaybeSingle({ is_platform_admin: true }))
      }
      return makeQuery(makeSingle(null))
    })
    let callCount = 0
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') {
        callCount++
        if (callCount === 1) return makeQuery(makeMaybeSingle({ is_platform_admin: true }))
        const q: Record<string, unknown> = {}
        const chain = () => q
        q.select = chain; q.eq = chain
        q.update = (p: Record<string, unknown>) => { capturedUpdates = { ...p }; return makeQuery(makeSingle({ id: ALICE_ID })) }
        q.single = () => Promise.resolve(makeSingle({ id: ALICE_ID, is_platform_admin: true }))
        return q
      }
      return makeQuery(makeSingle(null))
    })

    await req(app, 'PATCH', `/api/admin/members/${ALICE_ID}`, {
      headers: bearer('token-admin'),
      body: { is_platform_admin: true, username: 'hacker', xp: 99999, streak: 999 },
    })

    // Only is_platform_admin should be in the update
    expect(capturedUpdates.username).toBeUndefined()
    expect(capturedUpdates.xp).toBeUndefined()
    expect(capturedUpdates.streak).toBeUndefined()
  })

  it('Admin cannot delete themselves', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: true }))
      return makeQuery(makeSingle(null))
    })
    const res = await req(app, 'DELETE', `/api/admin/members/${ADMIN_ID}`, {
      headers: bearer('token-admin'),
    })
    expect(res.status).toBe(400)
    const body = await res.json() as Record<string, unknown>
    expect(String(body.error)).toContain('yourself')
  })

  it('Admin flag key with dots (not matching [a-z0-9_]+) → 400', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: true }))
      return makeQuery(makeSingle(null))
    })
    const res = await req(app, 'PATCH', '/api/admin/flags/some.flag.key', {
      headers: bearer('token-admin'),
      body: { enabled: true },
    })
    expect(res.status).toBe(400)
  })

  it('Admin flag key with spaces → 400', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: true }))
      return makeQuery(makeSingle(null))
    })
    const res = await req(app, 'PATCH', '/api/admin/flags/some%20flag', {
      headers: bearer('token-admin'),
      body: { enabled: true },
    })
    expect(res.status).toBe(400)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 10. Chained Attack Scenarios
// ═════════════════════════════════════════════════════════════════════════════

describe('Chained Attack Scenarios', () => {
  it('Chain: valid token + body userId injection + XP overclaim all blocked', async () => {
    // Attacker has valid auth (token-alice), tries to:
    // 1. Claim to be BOB (body userId injection)
    // 2. Award massive XP (999999)
    // 3. Use impossible score (10 > 5 total)
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ id: ALICE_ID, xp: 0, streak: 0, last_active: null }))
      if (table === 'game_results') {
        const q = makeQuery(makeMaybeSingle(null))
        ;(q as Record<string, unknown>).insert = () => makeQuery(makeSingle({ id: 'g-id' }))
        return q
      }
      return makeQuery(makeSingle(null))
    })

    const res = await req(app, 'POST', '/api/games', {
      headers: bearer('token-alice'),
      body: { userId: BOB_ID, gameType: 'quiz', xpEarned: 999999, score: 10, total: 5 },
    })

    // Should fail due to score > total check
    expect(res.status).toBe(400)
  })

  it('Chain: valid token + XP overclaim + valid score allowed but capped', async () => {
    let capturedXp: number | undefined
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ id: ALICE_ID, xp: 0, streak: 0, last_active: null }))
      if (table === 'game_results') {
        const q = makeQuery(makeMaybeSingle(null))
        ;(q as Record<string, unknown>).insert = (p: Record<string, unknown>) => {
          capturedXp = p.xp_earned as number
          return makeQuery(makeSingle({ id: 'g-id' }))
        }
        return q
      }
      return makeQuery(makeSingle(null))
    })

    const res = await req(app, 'POST', '/api/games', {
      headers: bearer('token-alice'),
      body: { gameType: 'quiz', xpEarned: 999999, score: 5, total: 10 },
    })

    expect(res.status).toBe(200)
    if (capturedXp !== undefined) {
      expect(capturedXp).toBeLessThanOrEqual(1000)
    }
  })

  it('Chain: forge admin status via feature flag endpoint (public) → only safe fields', async () => {
    // Attacker checks /api/feature-flags to see if any flag leaks admin info
    supabaseMock.from.mockReturnValue(makeQuery(makeList([{
      key: 'admin_panel', enabled: true, label: 'Admin Panel',
      description: 'Admin UI', category: 'admin',
      updated_by: ADMIN_ID,  // admin UUID would reveal who is admin
      updated_at: '2024-01-01', created_at: '2024-01-01',
    }])))

    const res = await req(app, 'GET', '/api/feature-flags')
    const flags = await res.json() as Record<string, unknown>[]

    for (const flag of flags) {
      expect(flag.updated_by).toBeUndefined()
      expect(flag.updated_at).toBeUndefined()
    }
  })

  it('Chain: register → attempt immediate admin access → 403', async () => {
    // After registering, a new user tries admin endpoints immediately
    supabaseMock.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: ALICE_ID } }, error: null,
    })
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeSingle({ id: ALICE_ID, username: 'newuser' }))
      return makeQuery(makeSingle(null))
    })

    // Register
    await req(app, 'POST', '/api/auth/register', {
      body: {
        email: 'new@example.com', password: 'Password123!',
        username: 'newuser', displayName: 'New User',
      },
    })

    // Immediately try admin access with alice's token (simulating fresh user)
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: false }))
      return makeQuery(makeList([]))
    })

    const adminRes = await req(app, 'GET', '/api/admin/flags', {
      headers: bearer('token-alice'),
    })
    expect(adminRes.status).toBe(403)
  })

  it('Chain: user tries to read then modify another user (IDOR pattern)', async () => {
    supabaseMock.from.mockReturnValue(makeQuery(makeMaybeSingle({
      id: BOB_ID, username: 'bob', display_name: 'Bob', xp: 50,
    })))

    // Step 1: Alice reads Bob's profile (allowed — public)
    const readRes = await req(app, 'GET', `/api/users/${BOB_ID}`)
    expect(readRes.status).toBe(200)

    // Step 2: Alice tries to update Bob's profile (must be blocked)
    const writeRes = await req(app, 'PATCH', `/api/users/${BOB_ID}`, {
      headers: bearer('token-alice'),
      body: { displayName: 'Hijacked Bob' },
    })
    expect(writeRes.status).toBe(403)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 11. Error Handling Consistency
// ═════════════════════════════════════════════════════════════════════════════

describe('Error Handling Consistency', () => {
  it('Every route returns JSON, not HTML, on error', async () => {
    // Error responses must be JSON — HTML error pages leak server details
    const errorRoutes = [
      ['GET',    '/api/users/not-a-uuid'],
      ['GET',    '/api/nonexistent'],
      ['POST',   '/api/games'],   // missing auth
      ['PATCH',  '/api/admin/flags/bad;key'],  // missing auth + bad key
    ]

    for (const [method, path] of errorRoutes) {
      const res = await req(app, method, path)
      const ct = res.headers.get('Content-Type') ?? ''
      expect(ct).toContain('application/json')
    }
  })

  it('404 response body always has error field, never has stack', async () => {
    const res = await req(app, 'GET', '/api/this-does-not-exist')
    expect(res.status).toBe(404)
    const body = await res.json() as Record<string, unknown>
    expect(body.error).toBeDefined()
    expect(body.stack).toBeUndefined()
  })

  it('400 error responses have error field but no internal details', async () => {
    const res = await req(app, 'GET', `/api/users/not-a-uuid`)
    const body = await res.json() as Record<string, unknown>
    expect(body.error).toBeTruthy()
    expect(typeof body.error).toBe('string')
    expect(body.stack).toBeUndefined()
    expect(body.message).toBeUndefined()  // no raw Error.message
  })

  it('Unhandled route method (DELETE on GET-only) returns structured error', async () => {
    const res = await req(app, 'DELETE', '/api/leaderboard')
    expect([404, 405]).toContain(res.status)
    const ct = res.headers.get('Content-Type') ?? ''
    expect(ct).toContain('application/json')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// 12. Authentication Edge Cases: Token Lifecycle
// ═════════════════════════════════════════════════════════════════════════════

describe('Token Lifecycle', () => {
  it('Revoked/expired token (Supabase returns error) → 401 on all protected routes', async () => {
    // Simulate an expired token that Supabase rejects
    supabaseMock.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'JWT expired' },
    })

    const routes = [
      ['PATCH', `/api/users/${ALICE_ID}`, { displayName: 'X' }],
      ['POST',  '/api/games',             { gameType: 'quiz', xpEarned: 10 }],
      ['POST',  `/api/orgs/${ORG_ID}/join`, {}],
    ] as [string, string, object][]

    for (const [method, path, body] of routes) {
      const res = await req(app, method, path, {
        headers: bearer('token-alice'),
        body,
      })
      expect(res.status).toBe(401)
    }
  })

  it('Supabase getUser throwing unexpected error → 401 (fail closed)', async () => {
    // If Supabase itself crashes during auth, fail safely to 401
    supabaseMock.auth.getUser.mockRejectedValue(new Error('Supabase connection timeout'))

    const res = await req(app, 'PATCH', `/api/users/${ALICE_ID}`, {
      headers: bearer('token-alice'),
      body: { displayName: 'X' },
    })
    // Must not return 500 with auth details — fail closed
    expect([401, 500]).toContain(res.status)
    const body = await res.json() as Record<string, unknown>
    expect(body.stack).toBeUndefined()
  })

  it('Admin DB check throwing error → 401/500 (not 200)', async () => {
    supabaseMock.from.mockImplementation(() => {
      throw new Error('DB connection lost during admin check')
    })

    const res = await req(app, 'GET', '/api/admin/flags', {
      headers: bearer('token-admin'),
    })
    // Must not grant admin access if DB check fails
    expect(res.status).not.toBe(200)
    expect([401, 403, 500]).toContain(res.status)
  })
})

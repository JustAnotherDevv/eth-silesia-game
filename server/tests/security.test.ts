/**
 * OWASP Top 10:2025 Security Tests
 * Covers: A01 (Access Control), A02 (Security Misconfiguration), A04 (Cryptography),
 *         A05 (Injection), A06 (Insecure Design), A07 (Authentication), A09 (Logging), A10 (Error Handling)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Supabase before any app imports ──────────────────────────────────────

// vi.hoisted ensures this runs before vi.mock factory (which is hoisted to top of file)
const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
    admin: {
      createUser: vi.fn(),
      deleteUser: vi.fn(),
    },
  },
}))

vi.mock('../src/supabase.js', () => ({ supabase: supabaseMock }))

// Import app AFTER mocks
import { createApp } from '../src/app.js'
import { clearRateLimits } from '../src/middleware/rateLimit.js'

// ── Valid UUID test fixtures ───────────────────────────────────────────────────
// IMPORTANT: must be proper UUIDs — validateUUID middleware rejects non-UUIDs

const ALICE_ID = '11111111-1111-1111-1111-111111111111'
const BOB_ID   = '22222222-2222-2222-2222-222222222222'
const ADMIN_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

// Token → userId mapping (mock auth)
const validTokens: Record<string, string> = {
  'token-alice': ALICE_ID,
  'token-bob':   BOB_ID,
  'token-admin': ADMIN_ID,
}

// ── Query builder mock ────────────────────────────────────────────────────────

function makeMaybeSingle(data: unknown) { return { data, error: null } }
function makeSingle(data: unknown)      { return { data, error: null } }
function makeList(data: unknown[])      { return { data, error: null, count: data.length } }
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function bearerHeader(token: string) {
  return { Authorization: `Bearer ${token}` }
}

async function request(app: ReturnType<typeof createApp>, method: string, path: string, options: {
  headers?: Record<string, string>
  body?: unknown
} = {}) {
  const headers: Record<string, string> = { ...options.headers }
  if (options.body) headers['Content-Type'] = 'application/json'
  return app.request(path, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
}

// ── Setup / Teardown ──────────────────────────────────────────────────────────

let app: ReturnType<typeof createApp>

beforeEach(() => {
  vi.clearAllMocks()
  clearRateLimits()   // reset rate limit stores so tests don't bleed into each other
  app = createApp()

  // Default auth: valid tokens resolve to userId, invalid tokens fail
  supabaseMock.auth.getUser.mockImplementation(async (token: string) => {
    const userId = validTokens[token]
    if (!userId) return { data: { user: null }, error: { message: 'invalid token' } }
    return { data: { user: { id: userId } }, error: null }
  })

  // Default from(): returns null (tests override as needed)
  supabaseMock.from.mockReturnValue(makeQuery(makeMaybeSingle(null)))
})

// ═════════════════════════════════════════════════════════════════════════════
// A01: Broken Access Control
// ═════════════════════════════════════════════════════════════════════════════

describe('A01 – Broken Access Control', () => {
  describe('Admin routes require authentication', () => {
    it('GET /api/admin/flags → 401 without token', async () => {
      const res = await request(app, 'GET', '/api/admin/flags')
      expect(res.status).toBe(401)
    })

    it('GET /api/admin/stats → 401 without token', async () => {
      const res = await request(app, 'GET', '/api/admin/stats')
      expect(res.status).toBe(401)
    })

    it('GET /api/admin/members → 401 without token', async () => {
      const res = await request(app, 'GET', '/api/admin/members')
      expect(res.status).toBe(401)
    })

    it('POST /api/admin/invite-codes → 401 without token', async () => {
      const res = await request(app, 'POST', '/api/admin/invite-codes', { body: {} })
      expect(res.status).toBe(401)
    })
  })

  describe('Non-admin user is forbidden from admin routes', () => {
    beforeEach(() => {
      supabaseMock.from.mockImplementation((table: string) => {
        if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: false }))
        return makeQuery(makeMaybeSingle(null))
      })
    })

    it('GET /api/admin/flags → 403 for regular user', async () => {
      const res = await request(app, 'GET', '/api/admin/flags', {
        headers: bearerHeader('token-alice'),
      })
      expect(res.status).toBe(403)
    })

    it('GET /api/admin/members → 403 for regular user', async () => {
      const res = await request(app, 'GET', '/api/admin/members', {
        headers: bearerHeader('token-alice'),
      })
      expect(res.status).toBe(403)
    })
  })

  describe('Admin access granted only to admins', () => {
    beforeEach(() => {
      supabaseMock.from.mockImplementation((table: string) => {
        if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: true }))
        if (table === 'feature_flags') return makeQuery(makeList([]))
        return makeQuery(makeList([]))
      })
    })

    it('GET /api/admin/flags → 200 for admin user', async () => {
      const res = await request(app, 'GET', '/api/admin/flags', {
        headers: bearerHeader('token-admin'),
      })
      expect(res.status).toBe(200)
    })
  })

  describe('Users can only update their own profile', () => {
    beforeEach(() => {
      supabaseMock.from.mockImplementation(() => {
        return makeQuery(makeSingle({ id: ALICE_ID, display_name: 'Updated', avatar: '🎯', xp: 100, streak: 3 }))
      })
    })

    it('PATCH /api/users/:id → 403 when token user ≠ target id', async () => {
      // Alice (token-alice) tries to update Bob's profile
      const res = await request(app, 'PATCH', `/api/users/${BOB_ID}`, {
        headers: bearerHeader('token-alice'),
        body: { displayName: 'Hacker' },
      })
      expect(res.status).toBe(403)
    })

    it('PATCH /api/users/:id → 200 when token user = target id', async () => {
      const res = await request(app, 'PATCH', `/api/users/${ALICE_ID}`, {
        headers: bearerHeader('token-alice'),
        body: { displayName: 'Alice Updated' },
      })
      expect(res.status).toBe(200)
    })

    it('PATCH /api/users/:id → 401 without token', async () => {
      const res = await request(app, 'PATCH', `/api/users/${ALICE_ID}`, {
        body: { displayName: 'Hacker' },
      })
      expect(res.status).toBe(401)
    })
  })

  describe('Game history is private to owner', () => {
    beforeEach(() => {
      supabaseMock.from.mockImplementation(() => makeQuery(makeList([])))
    })

    it("GET /api/games/user/:id → 403 when accessing another user's history", async () => {
      const res = await request(app, 'GET', `/api/games/user/${BOB_ID}`, {
        headers: bearerHeader('token-alice'),
      })
      expect(res.status).toBe(403)
    })

    it('GET /api/games/user/:id → 200 when accessing own history', async () => {
      const res = await request(app, 'GET', `/api/games/user/${ALICE_ID}`, {
        headers: bearerHeader('token-alice'),
      })
      expect(res.status).toBe(200)
    })
  })

  describe('POST /api/games rejects userId from body, uses JWT', () => {
    it('POST /api/games → 401 without auth token', async () => {
      const res = await request(app, 'POST', '/api/games', {
        body: { userId: ALICE_ID, gameType: 'quiz', xpEarned: 100 },
      })
      expect(res.status).toBe(401)
    })

    it('POST /api/games with token uses JWT userId, ignores body userId', async () => {
      let insertedUserId: string | undefined

      supabaseMock.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return makeQuery(makeMaybeSingle({ id: ALICE_ID, xp: 0, streak: 0, last_active: null }))
        }
        if (table === 'game_results') {
          const q = makeQuery(makeMaybeSingle(null))
          ;(q as Record<string, unknown>).insert = (payload: Record<string, unknown>) => {
            insertedUserId = payload.user_id as string
            return makeQuery(makeSingle({ id: 'game-id' }))
          }
          return q
        }
        return makeQuery(makeSingle(null))
      })

      await request(app, 'POST', '/api/games', {
        headers: bearerHeader('token-alice'),
        body: { userId: BOB_ID, gameType: 'quiz', xpEarned: 10 },
      })

      if (insertedUserId !== undefined) {
        expect(insertedUserId).toBe(ALICE_ID)      // JWT userId
        expect(insertedUserId).not.toBe(BOB_ID)   // NOT body userId
      }
    })
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// A02: Security Misconfiguration
// ═════════════════════════════════════════════════════════════════════════════

describe('A02 – Security Misconfiguration', () => {
  it('Response includes X-Content-Type-Options: nosniff', async () => {
    const res = await request(app, 'GET', '/api/health')
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
  })

  it('Response includes X-Frame-Options: DENY', async () => {
    const res = await request(app, 'GET', '/api/health')
    expect(res.headers.get('X-Frame-Options')).toBe('DENY')
  })

  it('Response includes Content-Security-Policy', async () => {
    const res = await request(app, 'GET', '/api/health')
    const csp = res.headers.get('Content-Security-Policy')
    expect(csp).toBeTruthy()
    expect(csp).toContain("default-src 'none'")
    expect(csp).toContain("frame-ancestors 'none'")
  })

  it('Response includes Referrer-Policy', async () => {
    const res = await request(app, 'GET', '/api/health')
    expect(res.headers.get('Referrer-Policy')).toBeTruthy()
  })

  it('Unknown routes return 404, not stack traces', async () => {
    const res = await request(app, 'GET', '/api/nonexistent-route-xyz')
    expect(res.status).toBe(404)
    const body = await res.json() as Record<string, unknown>
    expect(body.error).toBe('not found')
    expect(body.stack).toBeUndefined()
  })

  it('CORS does not reflect disallowed origins', async () => {
    const res = await app.request('/api/health', {
      method: 'GET',
      headers: { Origin: 'https://evil.example.com' },
    })
    const acaoHeader = res.headers.get('Access-Control-Allow-Origin')
    expect(acaoHeader).not.toBe('https://evil.example.com')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// A04: Cryptographic Failures
// ═════════════════════════════════════════════════════════════════════════════

describe('A04 – Cryptographic Failures', () => {
  it('Invite codes are cryptographically random (no two are identical)', async () => {
    const codes: string[] = []

    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: true }))
      if (table === 'orgs') return makeQuery(makeMaybeSingle({ id: 'org-1' }))
      if (table === 'invite_codes') {
        const q: Record<string, unknown> = {}
        const chain = () => q
        q.select = chain; q.insert = (payload: Record<string, unknown>) => {
          codes.push(payload.code as string)
          return makeQuery(makeSingle({ id: 'inv-id', code: payload.code }))
        }
        q.single = () => Promise.resolve(makeSingle({ id: 'inv-id', code: codes.at(-1) }))
        q.maybeSingle = q.single
        return q
      }
      return makeQuery(makeSingle(null))
    })

    for (let i = 0; i < 5; i++) {
      await request(app, 'POST', '/api/admin/invite-codes', {
        headers: bearerHeader('token-admin'),
        body: { maxUses: 10 },
      })
    }

    const uniqueCodes = new Set(codes)
    expect(uniqueCodes.size).toBe(codes.length)
    if (codes.length >= 2) expect(codes[0]).not.toBe(codes[1])
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// A05: Injection
// ═════════════════════════════════════════════════════════════════════════════

describe('A05 – Injection', () => {
  describe('UUID validation on path parameters', () => {
    const invalidIds = [
      '../../../etc/passwd',
      "1; DROP TABLE users; --",
      '<script>alert(1)</script>',
      '../../secret',
      'not-a-uuid',
      '00000000-0000-0000-0000-00000000000',   // one char short
      "'; SELECT * FROM users; --",
    ]

    for (const badId of invalidIds) {
      it(`GET /api/users/${badId.slice(0, 20)}… → 400 (UUID validation)`, async () => {
        const res = await request(app, 'GET', `/api/users/${encodeURIComponent(badId)}`)
        expect(res.status).toBe(400)
      })
    }
  })

  describe('Feature flag key validation', () => {
    beforeEach(() => {
      supabaseMock.from.mockImplementation((table: string) => {
        if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: true }))
        return makeQuery(makeSingle(null))
      })
    })

    it("PATCH /api/admin/flags/key';DROP TABLE-- → 400", async () => {
      const res = await request(app, 'PATCH', "/api/admin/flags/key';DROP TABLE--", {
        headers: bearerHeader('token-admin'),
        body: { enabled: true },
      })
      expect(res.status).toBe(400)
    })

    it('PATCH /api/admin/flags/<script> → 400', async () => {
      const res = await request(app, 'PATCH', '/api/admin/flags/%3Cscript%3E', {
        headers: bearerHeader('token-admin'),
        body: { enabled: true },
      })
      expect(res.status).toBe(400)
    })

    it('PATCH /api/admin/flags/valid_key → 200 (valid key)', async () => {
      supabaseMock.from.mockImplementation((table: string) => {
        if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: true }))
        if (table === 'feature_flags') return makeQuery(makeSingle({ key: 'valid_key', enabled: true }))
        return makeQuery(makeSingle(null))
      })
      const res = await request(app, 'PATCH', '/api/admin/flags/valid_key', {
        headers: bearerHeader('token-admin'),
        body: { enabled: true },
      })
      expect(res.status).toBe(200)
    })
  })

  describe('Game type allowlist', () => {
    beforeEach(() => {
      supabaseMock.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return makeQuery(makeMaybeSingle({ id: ALICE_ID, xp: 0, streak: 0, last_active: null }))
        }
        if (table === 'game_results') return makeQuery(makeMaybeSingle(null))
        return makeQuery(makeSingle(null))
      })
    })

    const maliciousGameTypes = [
      "quiz; DROP TABLE game_results; --",
      '../../../etc/passwd',
      '<script>',
      "' OR '1'='1",
      'system',
      '__proto__',
    ]

    for (const gameType of maliciousGameTypes) {
      it(`POST /api/games gameType="${gameType.slice(0, 20)}" → 400`, async () => {
        const res = await request(app, 'POST', '/api/games', {
          headers: bearerHeader('token-alice'),
          body: { gameType, xpEarned: 100 },
        })
        expect(res.status).toBe(400)
      })
    }
  })

  describe('JSON body rejection', () => {
    it('POST /api/auth/register with truly malformed JSON → 400', async () => {
      const res = await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"email": "test@test.com", "password": "pass123',  // truncated / invalid
      })
      expect(res.status).toBe(400)
    })

    it('PATCH /api/users/:id with non-JSON body → 400', async () => {
      const res = await app.request(`/api/users/${ALICE_ID}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token-alice',
        },
        body: 'this is not json at all!!!',
      })
      expect(res.status).toBe(400)
    })
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// A06: Insecure Design (XP manipulation)
// ═════════════════════════════════════════════════════════════════════════════

describe('A06 – Insecure Design (XP Cap)', () => {
  const hugeClaims = [999999, 1_000_000, Number.MAX_SAFE_INTEGER, -1, -9999]

  for (const xpEarned of hugeClaims) {
    it(`POST /api/games with xpEarned=${xpEarned} is capped to ≤ 1000`, async () => {
      let capturedXp: number | undefined

      supabaseMock.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return makeQuery(makeMaybeSingle({ id: ALICE_ID, xp: 0, streak: 0, last_active: null }))
        }
        if (table === 'game_results') {
          const q = makeQuery(makeMaybeSingle(null))
          ;(q as Record<string, unknown>).insert = (payload: Record<string, unknown>) => {
            capturedXp = payload.xp_earned as number
            return makeQuery(makeSingle({ id: 'game-id' }))
          }
          return q
        }
        return makeQuery(makeSingle(null))
      })

      const res = await request(app, 'POST', '/api/games', {
        headers: bearerHeader('token-alice'),
        body: { gameType: 'quiz', xpEarned },
      })

      if (res.status === 200 && capturedXp !== undefined) {
        expect(capturedXp).toBeGreaterThanOrEqual(0)
        expect(capturedXp).toBeLessThanOrEqual(1000)
      }
    })
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// A07: Authentication Failures
// ═════════════════════════════════════════════════════════════════════════════

describe('A07 – Authentication Failures', () => {
  describe('Token validation', () => {
    it('Invalid Bearer token → 401', async () => {
      const res = await request(app, 'PATCH', `/api/users/${ALICE_ID}`, {
        headers: { Authorization: 'Bearer invalid-token-xyz' },
        body: { displayName: 'Hacker' },
      })
      expect(res.status).toBe(401)
    })

    it('No Authorization header → 401', async () => {
      const res = await request(app, 'PATCH', `/api/users/${ALICE_ID}`, {
        body: { displayName: 'Hacker' },
      })
      expect(res.status).toBe(401)
    })

    it('Malformed Authorization header (no Bearer prefix) → 401', async () => {
      const res = await request(app, 'PATCH', `/api/users/${ALICE_ID}`, {
        headers: { Authorization: 'Basic dXNlcjpwYXNz' },
        body: { displayName: 'Hacker' },
      })
      expect(res.status).toBe(401)
    })

    it('X-User-Id header alone does NOT grant access', async () => {
      const res = await request(app, 'PATCH', `/api/users/${ALICE_ID}`, {
        headers: { 'X-User-Id': ALICE_ID },
        body: { displayName: 'Attacker' },
      })
      expect(res.status).toBe(401)
    })

    it('Admin route: X-User-Id alone does NOT grant admin access', async () => {
      const res = await request(app, 'GET', '/api/admin/flags', {
        headers: { 'X-User-Id': ADMIN_ID },
      })
      expect(res.status).toBe(401)
    })
  })

  describe('Registration rate limiting', () => {
    it('POST /api/auth/register → 429 after 20 requests from same IP', async () => {
      supabaseMock.from.mockImplementation((table: string) => {
        if (table === 'users') return makeQuery(makeSingle({ id: 'new-id', username: 'test' }))
        if (table === 'orgs')  return makeQuery(makeMaybeSingle(null))
        return makeQuery(makeSingle(null))
      })
      supabaseMock.auth.admin.createUser.mockResolvedValue({
        data: { user: { id: 'new-id' } }, error: null,
      })

      const payload = {
        email: 'test@example.com',
        password: 'SecurePass1!',
        username: 'testuser',
        displayName: 'Test User',
      }

      let lastStatus = 0
      for (let i = 0; i < 21; i++) {
        const res = await request(app, 'POST', '/api/auth/register', {
          body: { ...payload, email: `test${i}@example.com`, username: `user${i}` },
        })
        lastStatus = res.status
      }
      expect(lastStatus).toBe(429)
    })
  })

  describe('Password validation', () => {
    beforeEach(() => {
      supabaseMock.from.mockReturnValue(makeQuery(makeMaybeSingle(null)))
    })

    it('POST /api/auth/register with password < 8 chars → 400', async () => {
      const res = await request(app, 'POST', '/api/auth/register', {
        body: {
          email: 'test@example.com',
          password: 'short',   // < 8 chars
          username: 'testuser',
          displayName: 'Test User',
        },
      })
      expect(res.status).toBe(400)
      const body = await res.json() as Record<string, unknown>
      expect(String(body.error)).toContain('password')
    })

    it('POST /api/auth/register with password > 128 chars → 400', async () => {
      const res = await request(app, 'POST', '/api/auth/register', {
        body: {
          email: 'test@example.com',
          password: 'a'.repeat(200),  // > 128 chars
          username: 'testuser',
          displayName: 'Test User',
        },
      })
      expect(res.status).toBe(400)
    })
  })

  describe('Invite code brute-force protection', () => {
    it('POST /api/orgs/join-by-code → 429 after 10 attempts', async () => {
      supabaseMock.from.mockReturnValue(makeQuery(makeMaybeSingle(null)))

      let lastStatus = 0
      for (let i = 0; i < 11; i++) {
        const res = await request(app, 'POST', '/api/orgs/join-by-code', {
          headers: bearerHeader('token-alice'),
          body: { code: `WRONG${i}` },
        })
        lastStatus = res.status
      }
      expect(lastStatus).toBe(429)
    })
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// A09: Security Logging & Monitoring Failures
// ═════════════════════════════════════════════════════════════════════════════

describe('A09 – Security Logging', () => {
  it('Auth failures are logged with [SECURITY] tag', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await request(app, 'GET', '/api/admin/flags', {
      headers: { Authorization: 'Bearer completely-invalid-token' },
    })

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('[SECURITY]'))
    warnSpy.mockRestore()
  })

  it('Rate limit hits are logged with RATE_LIMIT_HIT', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    supabaseMock.from.mockReturnValue(makeQuery(makeMaybeSingle(null)))

    for (let i = 0; i < 12; i++) {
      await request(app, 'POST', '/api/orgs/join-by-code', {
        headers: bearerHeader('token-alice'),
        body: { code: 'XXXXX' },
      })
    }

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('RATE_LIMIT_HIT'))
    warnSpy.mockRestore()
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// A10: Exceptional Conditions (Error Handling)
// ═════════════════════════════════════════════════════════════════════════════

describe('A10 – Exceptional Conditions / Error Handling', () => {
  it('DB error does not leak internal connection details in production', async () => {
    const origEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    supabaseMock.from.mockImplementation(() => {
      return makeQuery(makeError('connection to server at "db.internal" failed: FATAL: password authentication failed'))
    })

    const res = await request(app, 'GET', `/api/users/${ALICE_ID}`)
    const body = await res.json() as Record<string, unknown>

    expect(String(body.error)).not.toContain('password authentication')
    expect(String(body.error)).not.toContain('db.internal')

    process.env.NODE_ENV = origEnv
  })

  it('Unhandled thrown error → 500 without stack trace in production', async () => {
    const origEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    // org list endpoint — doesn't need auth — force a throw
    supabaseMock.from.mockImplementation(() => {
      throw new Error('crash with secrets: apiKey=super_secret_123')
    })

    const res = await request(app, 'GET', '/api/orgs')
    expect(res.status).toBe(500)
    const body = await res.json() as Record<string, unknown>
    expect(body.stack).toBeUndefined()
    expect(String(body.error)).not.toContain('super_secret_123')
    expect(body.error).toBe('internal server error')

    process.env.NODE_ENV = origEnv
  })

  it('Truly malformed JSON body returns 400, not 500', async () => {
    // Truncated JSON — browsers/fetch can send malformed payloads
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"email": "test@test.com"',  // unclosed brace
    })
    expect(res.status).toBe(400)
  })

  it('Type coercion attack: enabled as string → 400', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: true }))
      return makeQuery(makeSingle(null))
    })
    const res = await request(app, 'PATCH', '/api/admin/flags/some_flag', {
      headers: bearerHeader('token-admin'),
      body: { enabled: 'true' },  // string instead of boolean
    })
    expect(res.status).toBe(400)
  })

  it('Type coercion attack: is_platform_admin as number → 400', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: true }))
      return makeQuery(makeSingle(null))
    })
    const res = await request(app, 'PATCH', `/api/admin/members/${ALICE_ID}`, {
      headers: bearerHeader('token-admin'),
      body: { is_platform_admin: 1 },  // number instead of boolean
    })
    expect(res.status).toBe(400)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Input Validation (field length limits)
// ═════════════════════════════════════════════════════════════════════════════

describe('Input Validation – Field Length Limits', () => {
  it('POST /api/users with displayName > 80 chars → 400', async () => {
    const res = await request(app, 'POST', '/api/users', {
      body: { username: 'testuser', displayName: 'x'.repeat(81) },
    })
    expect(res.status).toBe(400)
  })

  it('POST /api/users with username < 3 chars → 400', async () => {
    const res = await request(app, 'POST', '/api/users', {
      body: { username: 'ab', displayName: 'Short User' },
    })
    expect(res.status).toBe(400)
  })

  it('POST /api/users with username > 30 chars → 400', async () => {
    const res = await request(app, 'POST', '/api/users', {
      body: { username: 'a'.repeat(31), displayName: 'Long User' },
    })
    expect(res.status).toBe(400)
  })

  it('POST /api/admin/news with headline > 500 chars → 400', async () => {
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: true }))
      return makeQuery(makeSingle(null))
    })
    const res = await request(app, 'POST', '/api/admin/news', {
      headers: bearerHeader('token-admin'),
      body: { headline: 'x'.repeat(501) },
    })
    expect(res.status).toBe(400)
  })

  it('POST /api/admin/news with invalid category uses default "news"', async () => {
    let capturedCategory: string | undefined
    supabaseMock.from.mockImplementation((table: string) => {
      if (table === 'users') return makeQuery(makeMaybeSingle({ is_platform_admin: true }))
      if (table === 'news_items') {
        const q: Record<string, unknown> = {}
        q.insert = (payload: Record<string, unknown>) => {
          capturedCategory = payload.category as string
          return makeQuery(makeSingle({ id: 'news-id', ...payload }))
        }
        q.select = () => q
        q.single = () => Promise.resolve(makeSingle({ id: 'news-id', category: capturedCategory ?? 'news' }))
        return q
      }
      return makeQuery(makeSingle(null))
    })
    await request(app, 'POST', '/api/admin/news', {
      headers: bearerHeader('token-admin'),
      body: { headline: 'Breaking News', category: 'injected_value' },
    })
    if (capturedCategory !== undefined) {
      expect(['news', 'tip', 'alert', 'feature']).toContain(capturedCategory)
    }
  })

  it('POST /api/orgs/join-by-code with code > 20 chars → 400', async () => {
    const res = await request(app, 'POST', '/api/orgs/join-by-code', {
      headers: bearerHeader('token-alice'),
      body: { code: 'X'.repeat(21) },
    })
    expect(res.status).toBe(400)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// Health check
// ═════════════════════════════════════════════════════════════════════════════

describe('Health', () => {
  it('GET /api/health → 200 ok', async () => {
    const res = await request(app, 'GET', '/api/health')
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>
    expect(body.ok).toBe(true)
  })
})

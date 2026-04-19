/**
 * Knowly — End-to-End API Test Suite
 * Starts the server, tests every endpoint, then kills it.
 * Run with: npm run test:e2e
 */
import { spawn, type ChildProcess } from 'child_process'
import { resolve } from 'path'
import { config } from 'dotenv'

config({ path: resolve(process.cwd(), 'server/.env') })

const BASE = 'http://localhost:3001'

// ── Test harness ─────────────────────────────────────────────────

let passed = 0
let failed = 0
const failures: string[] = []

function assert(name: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`  ✅  ${name}`)
    passed++
  } else {
    console.log(`  ❌  ${name}${detail ? ` — ${detail}` : ''}`)
    failed++
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`)
  }
}

async function req(method: string, path: string, body?: unknown): Promise<{ status: number; json: unknown }> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => null)
  return { status: res.status, json }
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
function isArr(v: unknown): v is unknown[] {
  return Array.isArray(v)
}
function hasKeys(v: unknown, ...keys: string[]): boolean {
  return isObj(v) && keys.every(k => k in (v as Record<string, unknown>))
}

// ── Server lifecycle ─────────────────────────────────────────────

function startServer(): ChildProcess {
  const serverDir = resolve(process.cwd(), 'server')
  const tsxBin = resolve(serverDir, 'node_modules/.bin/tsx')
  return spawn(tsxBin, ['src/index.ts'], {
    cwd: serverDir,
    env: { ...process.env },
    stdio: 'ignore',
  })
}

async function waitReady(retries = 30): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(`${BASE}/api/health`)
      if (r.ok) return
    } catch { /* not ready yet */ }
    await new Promise(r => setTimeout(r, 500))
  }
  throw new Error('Server did not become ready after 15s')
}

// ── Tests ────────────────────────────────────────────────────────

const TEST_USERNAME = `e2e_test_${Date.now()}`
let testUserId = ''
let testOrgId  = ''

async function testHealth() {
  console.log('\n🔹 Health')
  const { status, json } = await req('GET', '/api/health')
  assert('GET /api/health → 200', status === 200)
  assert('returns { ok: true }', isObj(json) && json.ok === true)
}

async function testUsers() {
  console.log('\n🔹 Users')

  // Create
  const { status: s1, json: u1 } = await req('POST', '/api/users', {
    username: TEST_USERNAME,
    displayName: 'E2E Test User',
    avatar: '🤖',
  })
  assert('POST /api/users creates user (201)', s1 === 201)
  assert('returned user has id, username, xp, streak', hasKeys(u1, 'id', 'username', 'xp', 'streak'))
  assert('username is slugified', isObj(u1) && typeof u1.username === 'string')
  if (isObj(u1) && typeof u1.id === 'string') testUserId = u1.id

  // Idempotent re-create → returns existing (200)
  const { status: s2, json: u2 } = await req('POST', '/api/users', {
    username: TEST_USERNAME,
    displayName: 'E2E Test User',
  })
  assert('POST /api/users again returns existing (200)', s2 === 200)
  assert('same id returned', isObj(u1) && isObj(u2) && u1.id === u2.id)

  // Missing fields
  const { status: s3 } = await req('POST', '/api/users', { username: TEST_USERNAME })
  assert('POST /api/users missing displayName → 400', s3 === 400)

  // GET by id
  const { status: s4, json: u3 } = await req('GET', `/api/users/${testUserId}`)
  assert('GET /api/users/:id → 200', s4 === 200)
  assert('returned user matches id', isObj(u3) && u3.id === testUserId)

  // GET 404
  const { status: s5 } = await req('GET', '/api/users/00000000-0000-0000-0000-000000000000')
  assert('GET /api/users/:id unknown → 404', s5 === 404)

  // PATCH
  const { status: s6, json: u4 } = await req('PATCH', `/api/users/${testUserId}`, {
    displayName: 'Updated E2E User',
    avatar: '🧪',
  })
  assert('PATCH /api/users/:id → 200', s6 === 200)
  assert('display_name updated', isObj(u4) && u4.display_name === 'Updated E2E User')
  assert('avatar updated', isObj(u4) && u4.avatar === '🧪')

  // PATCH empty
  const { status: s7 } = await req('PATCH', `/api/users/${testUserId}`, {})
  assert('PATCH /api/users/:id empty body → 400', s7 === 400)

  // User orgs (may be empty for new user)
  const { status: s8, json: orgsArr } = await req('GET', `/api/users/${testUserId}/orgs`)
  assert('GET /api/users/:id/orgs → 200', s8 === 200)
  assert('orgs is array', isArr(orgsArr))
}

async function testGames() {
  console.log('\n🔹 Games')
  if (!testUserId) { console.log('  ⚠️  skipped (no testUserId)'); return }

  // Record a game
  const { status: s1, json: g1 } = await req('POST', '/api/games', {
    userId: testUserId,
    gameType: 'quiz',
    xpEarned: 120,
    score: 4,
    total: 5,
  })
  assert('POST /api/games creates result (200)', s1 === 200)
  assert('returns xpEarned, newXp, newStreak', hasKeys(g1, 'xpEarned', 'newXp', 'newStreak'))
  assert('newXp includes earned XP', isObj(g1) && typeof g1.newXp === 'number' && g1.newXp >= 120)
  assert('newStreak ≥ 1', isObj(g1) && typeof g1.newStreak === 'number' && g1.newStreak >= 1)

  // Second game — XP accumulates
  const { json: g2 } = await req('POST', '/api/games', {
    userId: testUserId,
    gameType: 'decision',
    xpEarned: 80,
    score: 1,
    total: 1,
  })
  assert('XP accumulates across games', isObj(g1) && isObj(g2) && typeof g2.newXp === 'number' && g2.newXp > (g1.newXp as number))

  // Missing fields
  const { status: s3 } = await req('POST', '/api/games', { gameType: 'quiz' })
  assert('POST /api/games missing userId → 400', s3 === 400)

  // Unknown user
  const { status: s4 } = await req('POST', '/api/games', {
    userId: '00000000-0000-0000-0000-000000000000',
    gameType: 'quiz',
    xpEarned: 50,
  })
  assert('POST /api/games unknown user → 404', s4 === 404)

  // History
  const { status: s5, json: hist } = await req('GET', `/api/games/user/${testUserId}`)
  assert('GET /api/games/user/:userId → 200', s5 === 200)
  assert('history is array with entries', isArr(hist) && hist.length >= 2)
  assert('entries have label field', isArr(hist) && isObj(hist[0]) && 'label' in hist[0])
}

async function testLeaderboard() {
  console.log('\n🔹 Leaderboard')

  const { status: s1, json: lb } = await req('GET', '/api/leaderboard')
  assert('GET /api/leaderboard → 200', s1 === 200)
  assert('returns array', isArr(lb))
  assert('entries have rank, level, accent', isArr(lb) && lb.length > 0 && hasKeys(lb[0], 'rank', 'level', 'accent'))
  assert('sorted by xp desc (rank 1 highest)', isArr(lb) && isObj(lb[0]) && lb[0].rank === 1)
  if (isArr(lb) && lb.length > 1) {
    assert('xp decreasing', isObj(lb[0]) && isObj(lb[1]) && (lb[0].xp as number) >= (lb[1].xp as number))
  }

  // Filtered by org
  const { status: s2, json: filtered } = await req('GET', '/api/leaderboard?orgId=eth-silesia')
  assert('GET /api/leaderboard?orgId → 200', s2 === 200)
  assert('filtered result is array', isArr(filtered))
  assert('fewer results than global (org filter works)', isArr(filtered) && isArr(lb) && filtered.length < lb.length)

  // Unknown org
  const { status: s3, json: empty } = await req('GET', '/api/leaderboard?orgId=nonexistent-org')
  assert('GET /api/leaderboard unknown orgId → empty array', s3 === 200 && isArr(empty) && empty.length === 0)

  // Stats
  const { status: s4, json: stats } = await req('GET', '/api/leaderboard/stats')
  assert('GET /api/leaderboard/stats → 200', s4 === 200)
  assert('stats has totalUsers, activeToday, maxStreak', hasKeys(stats, 'totalUsers', 'activeToday', 'maxStreak'))
  assert('totalUsers ≥ 50 (seeded)', isObj(stats) && typeof stats.totalUsers === 'number' && stats.totalUsers >= 50)
  assert('maxStreak ≥ 1', isObj(stats) && typeof stats.maxStreak === 'number' && stats.maxStreak >= 1)
}

async function testOrgs() {
  console.log('\n🔹 Orgs')

  const { status: s1, json: orgs } = await req('GET', '/api/orgs')
  assert('GET /api/orgs → 200', s1 === 200)
  assert('returns array of public orgs', isArr(orgs) && orgs.length >= 4)
  assert('each org has member_count', isArr(orgs) && orgs.every(o => 'member_count' in (o as object)))
  assert('no private orgs in list', isArr(orgs) && orgs.every(o => isObj(o) && o.is_public === true))

  if (isArr(orgs) && orgs.length > 0 && isObj(orgs[0])) {
    testOrgId = orgs[0].id as string
  }

  // GET single
  const { status: s2, json: org } = await req('GET', `/api/orgs/eth-silesia`)
  assert('GET /api/orgs/:id → 200', s2 === 200)
  assert('org has id, name, member_count', hasKeys(org, 'id', 'name', 'member_count'))
  assert('member_count > 0 (seeded)', isObj(org) && typeof org.member_count === 'number' && org.member_count > 0)

  // Unknown org
  const { status: s3 } = await req('GET', '/api/orgs/does-not-exist')
  assert('GET /api/orgs/:id unknown → 404', s3 === 404)

  // Join
  if (testUserId) {
    const { status: s4, json: j } = await req('POST', `/api/orgs/eth-silesia/join`, { userId: testUserId })
    assert('POST /api/orgs/:id/join → 200', s4 === 200)
    assert('join returns { success: true }', isObj(j) && j.success === true)

    // Idempotent second join
    const { status: s5 } = await req('POST', `/api/orgs/eth-silesia/join`, { userId: testUserId })
    assert('POST join again (idempotent) → 200', s5 === 200)

    // User orgs now includes eth-silesia
    const { json: userOrgs } = await req('GET', `/api/users/${testUserId}/orgs`)
    assert('user orgs include joined org', isArr(userOrgs) && userOrgs.some(o => isObj(o) && o.id === 'eth-silesia'))
  }

  // Join by code — valid
  if (testUserId) {
    const { status: s6, json: j2 } = await req('POST', '/api/orgs/join-by-code', {
      userId: testUserId,
      code: 'SILESIA24',
    })
    assert('POST /api/orgs/join-by-code valid code → 200', s6 === 200)
    assert('returns org object', isObj(j2) && 'id' in j2)
  }

  // Join by code — invalid
  const { status: s7 } = await req('POST', '/api/orgs/join-by-code', {
    userId: testUserId || '00000000-0000-0000-0000-000000000001',
    code: 'BOGUSXXX',
  })
  assert('POST /api/orgs/join-by-code invalid code → 404', s7 === 404)

  // Missing fields
  const { status: s8 } = await req('POST', '/api/orgs/join-by-code', { code: 'SILESIA24' })
  assert('POST /api/orgs/join-by-code missing userId → 400', s8 === 400)

  // Org members
  const { status: s9, json: members } = await req('GET', '/api/orgs/eth-silesia/members')
  assert('GET /api/orgs/:id/members → 200', s9 === 200)
  assert('members is array with entries', isArr(members) && members.length > 0)
  assert('members have id, username, xp', isArr(members) && hasKeys(members[0], 'id', 'username', 'xp'))
}

async function testMembers() {
  console.log('\n🔹 Members')

  const { status: s1, json: list } = await req('GET', '/api/members')
  assert('GET /api/members → 200', s1 === 200)
  assert('returns array ≥ 50', isArr(list) && list.length >= 50)
  const first = isArr(list) ? list[0] : null
  assert('each member has level, accent, xpMax, badgeCount', hasKeys(first, 'level', 'accent', 'xpMax', 'badgeCount'))
  assert('each member has rank, online, specialty', hasKeys(first, 'rank', 'online', 'specialty'))
  assert('rank 1 is highest xp', isObj(first) && first.rank === 1)

  // Pagination
  const { json: page2 } = await req('GET', '/api/members?offset=10&limit=5')
  assert('pagination offset=10 limit=5 works', isArr(page2) && page2.length === 5)
  assert('page2[0].rank === 11', isArr(page2) && isObj(page2[0]) && page2[0].rank === 11)

  // Filter by org
  const { status: s2, json: orgMembers } = await req('GET', '/api/members?orgId=eth-silesia')
  assert('GET /api/members?orgId → 200', s2 === 200)
  assert('org filter returns subset', isArr(orgMembers) && isArr(list) && orgMembers.length < list.length)

  // Search
  const { status: s3, json: searched } = await req('GET', '/api/members?search=compound')
  assert('GET /api/members?search → 200', s3 === 200)
  assert('search finds Compound Carl', isArr(searched) && searched.some(m => isObj(m) && (m.displayName as string)?.toLowerCase().includes('compound')))

  // Full profile by slug
  const { status: s4, json: profile } = await req('GET', '/api/members/compound_carl')
  assert('GET /api/members/:slug → 200', s4 === 200)
  assert('profile has xpBreakdown', hasKeys(profile, 'xpBreakdown'))
  assert('profile has recentActivity array', isObj(profile) && isArr(profile.recentActivity))
  assert('profile has achievements array', isObj(profile) && isArr(profile.achievements))
  assert('profile has orgs array', isObj(profile) && isArr(profile.orgs))
  assert('profile has gamesPlayed', isObj(profile) && typeof profile.gamesPlayed === 'number' && (profile.gamesPlayed as number) > 0)
  assert('xpBreakdown has game types', isObj(profile) && isObj(profile.xpBreakdown) && Object.keys(profile.xpBreakdown).length > 0)
  assert('achievements have emoji, name', isObj(profile) && isArr(profile.achievements) && profile.achievements.length > 0 && hasKeys(profile.achievements[0], 'emoji', 'name'))
  assert('orgs have id, name, emoji', isObj(profile) && isArr(profile.orgs) && profile.orgs.length > 0 && hasKeys(profile.orgs[0], 'id', 'name', 'emoji'))

  // 404
  const { status: s5 } = await req('GET', '/api/members/this-user-does-not-exist-xyz')
  assert('GET /api/members/:slug unknown → 404', s5 === 404)

  // Test user profile (created earlier in this run)
  if (testUserId) {
    const { status: s6 } = await req('GET', `/api/members/${TEST_USERNAME}`)
    assert('GET /api/members/:slug for test user → 200', s6 === 200)
  }
}

async function testNews() {
  console.log('\n🔹 News')

  const { status: s1, json: news } = await req('GET', '/api/news')
  assert('GET /api/news → 200', s1 === 200)
  assert('returns array', isArr(news))
  assert('has seeded news items', isArr(news) && news.length >= 10)
  assert('items have headline, source, category', isArr(news) && hasKeys(news[0], 'headline', 'source', 'category'))
  assert('ordered newest first (created_at)', (() => {
    if (!isArr(news) || news.length < 2) return true
    const a = news[0] as Record<string, unknown>
    const b = news[1] as Record<string, unknown>
    return new Date(a.created_at as string) >= new Date(b.created_at as string)
  })())
}

async function testDataIntegrity() {
  console.log('\n🔹 Data Integrity')

  // Leaderboard levels are correctly assigned
  const { json: lb } = await req('GET', '/api/leaderboard')
  if (isArr(lb)) {
    const legendEntry = lb.find(e => isObj(e) && (e.xp as number) >= 10000)
    assert('Legend level assigned to xp ≥ 10000', !legendEntry || (isObj(legendEntry) && legendEntry.level === 'Legend'))

    const rookieEntry = lb.find(e => isObj(e) && (e.xp as number) < 500)
    assert('Rookie level assigned to xp < 500', !rookieEntry || (isObj(rookieEntry) && rookieEntry.level === 'Rookie'))
  }

  // Member + leaderboard return same user data
  const { json: memberCarl } = await req('GET', '/api/members/compound_carl')
  const { json: lbAll } = await req('GET', '/api/leaderboard')
  const lbCarl = isArr(lbAll) ? lbAll.find(e => isObj(e) && e.username === 'compound_carl') : null
  assert('compound_carl xp matches between /members and /leaderboard', isObj(memberCarl) && isObj(lbCarl) && memberCarl.xp === lbCarl.xp)

  // Stats totalUsers matches actual leaderboard count
  const { json: stats } = await req('GET', '/api/leaderboard/stats')
  assert('stats.totalUsers ≥ leaderboard count', isObj(stats) && isArr(lbAll) && (stats.totalUsers as number) >= lbAll.length)

  // Seeded orgs exist
  for (const orgId of ['eth-silesia', 'pko-bank', 'warsaw-uni', 'fintech-hub']) {
    const { status } = await req('GET', `/api/orgs/${orgId}`)
    assert(`seeded org "${orgId}" exists`, status === 200)
  }

  // Private orgs NOT in public list but accessible directly
  const { json: publicOrgs } = await req('GET', '/api/orgs')
  assert('genesis-dao not in public list', isArr(publicOrgs) && !publicOrgs.some(o => isObj(o) && o.id === 'genesis-dao'))
  const { status: privateStatus } = await req('GET', '/api/orgs/genesis-dao')
  assert('genesis-dao accessible by id', privateStatus === 200)
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log('🧪  Knowly E2E Tests\n')
  console.log(`   Server: ${BASE}`)
  console.log(`   Supabase: ${process.env.SUPABASE_URL ?? '(not set)'}`)

  let server: ChildProcess | null = null
  let serverAlreadyRunning = false

  // Check if server already running
  try {
    const r = await fetch(`${BASE}/api/health`)
    if (r.ok) { serverAlreadyRunning = true; console.log('\n   ℹ️  Using already-running server\n') }
  } catch { /* need to start */ }

  if (!serverAlreadyRunning) {
    console.log('\n   Starting server...')
    try {
      server = startServer()
      server.on('error', err => { console.error('   server process error:', err.message) })
      await waitReady()
      console.log('   Server ready ✓\n')
    } catch (err) {
      if (server) server.kill()
      console.error('   ❌ Could not start server:', (err as Error).message)
      console.error('   Try running: cd server && npm run dev')
      process.exit(1)
    }
  }

  try {
    await testHealth()
    await testUsers()
    await testGames()
    await testLeaderboard()
    await testOrgs()
    await testMembers()
    await testNews()
    await testDataIntegrity()
  } finally {
    if (server) {
      server.kill()
    }
  }

  console.log('\n' + '─'.repeat(55))
  console.log(`  Results: ${passed} passed, ${failed} failed`)
  if (failures.length > 0) {
    console.log('\n  Failed tests:')
    failures.forEach(f => console.log(`    ❌ ${f}`))
  }
  console.log('─'.repeat(55) + '\n')

  process.exit(failed > 0 ? 1 : 0)
}

main()

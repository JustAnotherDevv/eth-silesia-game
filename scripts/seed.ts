/**
 * Knowly — Full Seed Script
 * Applies schema migration then seeds 50 users, ~300 game results, badges, etc.
 *
 * Usage:
 *   Set in server/.env:
 *     SUPABASE_URL, SUPABASE_SERVICE_KEY
 *     SUPABASE_ACCESS_TOKEN  ← get from supabase.com/dashboard/account/tokens
 *   npm run seed
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { readFileSync } from 'fs'
import pg from 'pg'

config({ path: resolve(process.cwd(), 'server/.env') })

const SUPABASE_URL           = process.env.SUPABASE_URL!
const SUPABASE_SERVICE_KEY   = process.env.SUPABASE_SERVICE_KEY!
const DATABASE_URL           = process.env.DATABASE_URL
const SUPABASE_ACCESS_TOKEN  = process.env.SUPABASE_ACCESS_TOKEN

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Set SUPABASE_URL and SUPABASE_SERVICE_KEY in server/.env')
  process.exit(1)
}

const PROJECT_REF = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? ''

// ── Migration via Supabase Management API (needs SUPABASE_ACCESS_TOKEN) ──
async function migrateViaManagementApi(token: string): Promise<void> {
  const sqlFile = readFileSync(resolve(process.cwd(), 'supabase/migrations/001_schema.sql'), 'utf8')
  // Split on semicolons, skip blank lines and comment-only lines
  const stmts = sqlFile
    .replace(/--[^\n]*/g, '')
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  console.log(`   ℹ️  Applying ${stmts.length} statements via Management API...`)
  for (const stmt of stmts) {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: stmt }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({ message: res.statusText })) as { message?: string }
      if (body.message?.match(/already exists/i)) continue
      throw new Error(`Statement failed: ${body.message}\n   SQL: ${stmt.slice(0, 120)}`)
    }
  }
  console.log('✅  Schema migration applied via Management API')
}

// ── Migration via direct postgres (pooler or direct connection) ───────────
async function migrateViaPg(): Promise<void> {
  if (!DATABASE_URL) throw new Error('DATABASE_URL not set')

  const directMatch = DATABASE_URL.match(/postgresql:\/\/postgres:([^@]+)@db\.([^.]+)\.supabase\.co:\d+\/postgres/)
  let connStr = DATABASE_URL

  if (directMatch) {
    const [, password, ref] = directMatch
    const regions = ['eu-central-1','us-east-1','eu-west-2','us-west-1','ap-southeast-1','ap-northeast-1','ca-central-1','ap-south-1']
    for (const region of regions) {
      for (const port of [5432, 6543] as const) {
        const url = `postgresql://postgres.${ref}:${password}@aws-0-${region}.pooler.supabase.com:${port}/postgres`
        const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 3000 })
        try { await c.connect(); await c.end(); connStr = url; break } catch { /* next */ }
      }
      if (connStr !== DATABASE_URL) break
    }
    if (connStr === DATABASE_URL) throw new Error('All pooler regions failed')
  }

  const client = new pg.Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } })
  await client.connect()
  const sql = readFileSync(resolve(process.cwd(), 'supabase/migrations/001_schema.sql'), 'utf8')
  await client.query(sql)
  await client.end()
  console.log('✅  Schema migration applied via pg')
}

function printMigrationInstructions() {
  const sqlPath = resolve(process.cwd(), 'supabase/migrations/001_schema.sql')
  console.error('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.error('⚡ Auto-migration failed. Two options:\n')
  console.error('  OPTION A — add token to server/.env, then re-run:')
  console.error('    SUPABASE_ACCESS_TOKEN=sbp_xxxx  ← from supabase.com/dashboard/account/tokens\n')
  console.error('  OPTION B — paste SQL manually (30 seconds):')
  console.error(`    1. Open:  https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`)
  console.error(`    2. Paste: ${sqlPath}`)
  console.error('    3. Click "Run" → then run: npm run seed')
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

async function applyMigration() {
  // Skip if tables already exist
  const { error: checkErr } = await sb.from('orgs').select('id').limit(1)
  if (!checkErr) {
    console.log('✅  Schema already present — skipping migration')
    return
  }

  // Try Management API first (most reliable for new Supabase projects)
  if (SUPABASE_ACCESS_TOKEN) {
    try {
      await migrateViaManagementApi(SUPABASE_ACCESS_TOKEN)
      return
    } catch (err) {
      console.error('⚠️   Management API migration failed:', (err as Error).message)
    }
  }

  // Try direct pg/pooler connection
  try {
    await migrateViaPg()
    return
  } catch (err) {
    console.error('⚠️   pg migration failed:', (err as Error).message)
  }

  printMigrationInstructions()
  process.exit(1)
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// ── Helpers ───────────────────────────────────────────────────────

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function today() {
  return new Date().toISOString().split('T')[0]
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ── Orgs ─────────────────────────────────────────────────────────

const ORGS = [
  { id: 'eth-silesia',  name: 'ETH Silesia',       emoji: '⛓️', color: '#7B2D8B', is_public: true,  invite_code: null,      description: 'Blockchain & crypto enthusiasts from Silesia.' },
  { id: 'pko-bank',     name: 'PKO Bank',           emoji: '🏦', color: '#1565C0', is_public: true,  invite_code: null,      description: 'PKO Bank innovation & fintech team.' },
  { id: 'warsaw-uni',   name: 'Warsaw University',  emoji: '🎓', color: '#2D9A4E', is_public: true,  invite_code: null,      description: 'University of Warsaw finance students.' },
  { id: 'fintech-hub',  name: 'FinTech Hub',        emoji: '⚡', color: '#FF7B25', is_public: true,  invite_code: null,      description: 'Warsaw FinTech startup community.' },
  { id: 'genesis-dao',  name: 'Genesis DAO',        emoji: '🌐', color: '#E63946', is_public: false, invite_code: 'GENESIS', description: 'Private DAO — invite only.' },
  { id: 'alpha-club',   name: 'Alpha Club',         emoji: '🔑', color: '#FFCD00', is_public: false, invite_code: 'ALPHA23', description: 'Private alpha testing group.' },
]

// ── Badge catalog ─────────────────────────────────────────────────

const BADGES = [
  { id: 'first_quiz',     emoji: '🏆', name: 'First Quiz',       description: 'Completed your first quiz round' },
  { id: 'speed_reader',   emoji: '⚡', name: 'Speed Reader',      description: 'Answered a question in under 5 seconds' },
  { id: 'finance_101',    emoji: '🎓', name: 'Finance 101',       description: 'Completed the basics module' },
  { id: 'xp_500',         emoji: '💰', name: '500 XP Club',       description: 'Earned 500 total XP' },
  { id: 'streak_7',       emoji: '🔥', name: '7-Day Streak',      description: 'Logged in 7 consecutive days' },
  { id: 'perfect_round',  emoji: '🌟', name: 'Perfect Round',     description: 'Scored 5/5 on any quiz' },
  { id: 'sharpshooter',   emoji: '🎯', name: 'Sharpshooter',      description: 'Maintained 90%+ accuracy overall' },
  { id: 'bull_market',    emoji: '📈', name: 'Bull Market',       description: 'Won 10 games in a row' },
  { id: 'fraud_fighter',  emoji: '🕵️', name: 'Fraud Fighter',     description: 'Identified 5 scams correctly' },
  { id: 'wise_swiper',    emoji: '🃏', name: 'Wise Swiper',       description: 'Correct on all 10 card swipe choices' },
  { id: 'decision_maker', emoji: '🎲', name: 'Decision Maker',    description: 'Chose the brilliant option in Decision Room' },
  { id: 'streak_30',      emoji: '💫', name: '30-Day Streak',     description: 'Maintained a 30-day login streak' },
  { id: 'xp_1000',        emoji: '🥇', name: '1000 XP Club',      description: 'Earned 1000 total XP' },
  { id: 'xp_5000',        emoji: '💎', name: '5000 XP Club',      description: 'Earned 5000 total XP' },
  { id: 'xp_10000',       emoji: '👑', name: 'Legend Status',     description: 'Reached 10000 XP — true financial legend' },
  { id: 'community_100',  emoji: '🤝', name: 'Community Builder', description: 'Joined 3+ organizations' },
  { id: 'night_owl',      emoji: '🦉', name: 'Night Owl',         description: 'Played 5 games after midnight' },
  { id: 'early_bird',     emoji: '🐦', name: 'Early Bird',        description: 'Completed a challenge before 8am' },
  { id: 'quiz_master',    emoji: '🧠', name: 'Quiz Master',       description: 'Completed 20 quiz rounds' },
  { id: 'path_starter',   emoji: '🗺️', name: 'Path Starter',      description: 'Completed first learning path node' },
  { id: 'path_halfway',   emoji: '🏃', name: 'Halfway There',     description: 'Completed 7 learning path nodes' },
  { id: 'path_complete',  emoji: '🏅', name: 'Path Complete',     description: 'Finished the full learning path' },
  { id: 'top_10',         emoji: '🔟', name: 'Top 10',            description: 'Ranked in the global top 10' },
  { id: 'top_100',        emoji: '💯', name: 'Top 100',           description: 'Ranked in the global top 100' },
  { id: 'invite_3',       emoji: '📨', name: 'Recruiter',         description: 'Invited 3 friends to join' },
  { id: 'comeback',       emoji: '🔄', name: 'Comeback Kid',      description: 'Returned after a 7-day absence' },
]

// ── User definitions ──────────────────────────────────────────────

interface UserDef {
  id: string; username: string; display_name: string; avatar: string
  xp: number; streak: number; last_active: string
  specialty: string; location: string; bio: string
  orgs: string[]
  badgeCount: number
}

const USERS: UserDef[] = [
  // Legends
  { id:'00000000-0000-0000-0000-000000000001', username:'compound_carl',   display_name:'Compound Carl',     avatar:'🎩', xp:9840,  streak:42, last_active:today(), specialty:'Quantitative Finance',  location:'Warsaw',  bio:'I let math do the talking. Compound interest changed my life at 23.',          orgs:['eth-silesia','genesis-dao','alpha-club'], badgeCount:13 },
  { id:'00000000-0000-0000-0000-000000000002', username:'budget_barbara',  display_name:'Budget Barbara',    avatar:'👑', xp:8720,  streak:31, last_active:today(), specialty:'Budgeting',             location:'Kraków',  bio:'50/30/20 fanatic. Paid off 40k PLN debt in 18 months.',               orgs:['pko-bank','alpha-club'],                  badgeCount:11 },
  { id:'00000000-0000-0000-0000-000000000003', username:'value_victor',    display_name:'Value Victor',      avatar:'💎', xp:11200, streak:55, last_active:today(), specialty:'Value Investing',        location:'Gdańsk',  bio:'Buying great companies at fair prices since 2018. Buffett disciple.',  orgs:['warsaw-uni','genesis-dao'],              badgeCount:14 },
  { id:'00000000-0000-0000-0000-000000000004', username:'savings_queen',   display_name:'Savings Queen',     avatar:'🌟', xp:10800, streak:44, last_active:today(), specialty:'Savings Strategy',       location:'Wrocław', bio:'FIRE by 40 is the goal. Currently at 68% savings rate.',              orgs:['warsaw-uni','alpha-club'],                badgeCount:13 },
  { id:'00000000-0000-0000-0000-000000000005', username:'crypto_king_pl',  display_name:'Crypto King',       avatar:'🔮', xp:9500,  streak:38, last_active:today(), specialty:'DeFi & Crypto',          location:'Silesia', bio:'ETH maxi. Building on-chain since 2020. Not financial advice.',        orgs:['eth-silesia','genesis-dao'],              badgeCount:12 },
  // Experts
  { id:'00000000-0000-0000-0000-000000000006', username:'options_oscar',   display_name:'Options Oscar',     avatar:'🎯', xp:9100,  streak:25, last_active:today(), specialty:'Options Trading',        location:'Warsaw',  bio:'Theta gang. Selling covered calls since the pandemic dip.',            orgs:['fintech-hub','alpha-club'],               badgeCount:10 },
  { id:'00000000-0000-0000-0000-000000000007', username:'risk_rowan',      display_name:'Risk Rowan',        avatar:'⚖️', xp:8200,  streak:30, last_active:today(), specialty:'Risk Management',        location:'Warsaw',  bio:'Ex-bank quant. Now teaching others to manage their downside.',         orgs:['pko-bank','alpha-club'],                  badgeCount:10 },
  { id:'00000000-0000-0000-0000-000000000008', username:'interest_igor',   display_name:'Interest Igor',     avatar:'🏦', xp:7655,  streak:28, last_active:today(), specialty:'Fixed Income',           location:'Silesia', bio:'Bonds are boring until they save your portfolio.',                     orgs:['eth-silesia','pko-bank'],                 badgeCount:9  },
  { id:'00000000-0000-0000-0000-000000000009', username:'crypto_carla',    display_name:'Crypto Carla',      avatar:'🦋', xp:7200,  streak:18, last_active:today(), specialty:'Blockchain',             location:'Poznań',  bio:'Smart contract dev by day, DeFi yield farmer by night.',              orgs:['eth-silesia','genesis-dao'],              badgeCount:9  },
  { id:'00000000-0000-0000-0000-000000000010', username:'macro_magnus',    display_name:'Macro Magnus',      avatar:'📊', xp:6800,  streak:22, last_active:today(), specialty:'Macro Economics',        location:'Łódź',    bio:'Reading central bank tea leaves since 2015.',                          orgs:['fintech-hub'],                            badgeCount:8  },
  { id:'00000000-0000-0000-0000-000000000011', username:'fintech_fiona',   display_name:'FinTech Fiona',     avatar:'🚀', xp:6100,  streak:19, last_active:today(), specialty:'FinTech',                location:'Kraków',  bio:'Building the future of payments one API at a time.',                   orgs:['fintech-hub','eth-silesia'],              badgeCount:8  },
  { id:'00000000-0000-0000-0000-000000000012', username:'dividend_dana',   display_name:'Dividend Dana',     avatar:'💰', xp:5910,  streak:15, last_active:today(), specialty:'Dividend Investing',     location:'Wrocław', bio:'Cash flow > capital gains. DRIP investor for 6 years.',               orgs:['pko-bank'],                               badgeCount:7  },
  { id:'00000000-0000-0000-0000-000000000013', username:'etf_eddie',       display_name:'ETF Eddie',         avatar:'📈', xp:5240,  streak:12, last_active:daysAgo(1), specialty:'Index Investing',    location:'Warsaw',  bio:'You cannot beat the market. Just join it. VTI & chill.',              orgs:['fintech-hub'],                            badgeCount:7  },
  // Pro
  { id:'00000000-0000-0000-0000-000000000014', username:'index_ivan',      display_name:'Index Ivan',        avatar:'🔑', xp:4680,  streak:10, last_active:daysAgo(1), specialty:'Passive Investing',  location:'Gdańsk',  bio:'Three-fund portfolio. No stock picking, no stress.',                   orgs:['fintech-hub'],                            badgeCount:6  },
  { id:'00000000-0000-0000-0000-000000000015', username:'tech_tina',       display_name:'Tech Tina',         avatar:'💻', xp:3900,  streak:8,  last_active:today(), specialty:'Tech Stocks',           location:'Warsaw',  bio:'Software engineer who finally learned what her stock options mean.',   orgs:['warsaw-uni'],                             badgeCount:5  },
  { id:'00000000-0000-0000-0000-000000000016', username:'bond_betty',      display_name:'Bond Betty',        avatar:'📜', xp:4100,  streak:11, last_active:daysAgo(2), specialty:'Bonds & Fixed Income',location:'Poznań', bio:'Duration risk is real. Ask me how I know.',                           orgs:['pko-bank'],                               badgeCount:6  },
  { id:'00000000-0000-0000-0000-000000000017', username:'piotr_k',         display_name:'Piotr Kowalski',    avatar:'🇵🇱', xp:3200,  streak:7,  last_active:today(),  specialty:'Personal Finance',     location:'Warsaw',  bio:'Just a regular guy trying to understand his pension.',                 orgs:['pko-bank'],                               badgeCount:4  },
  { id:'00000000-0000-0000-0000-000000000018', username:'anna_w',          display_name:'Anna Wiśniewska',   avatar:'🌿', xp:2800,  streak:9,  last_active:daysAgo(1), specialty:'ESG Investing',      location:'Kraków',  bio:'Sustainable investing is not just a trend — it is the future.',       orgs:['warsaw-uni'],                             badgeCount:4  },
  { id:'00000000-0000-0000-0000-000000000019', username:'marek_n',         display_name:'Marek Nowak',       avatar:'🏗️', xp:4500,  streak:13, last_active:today(),  specialty:'Real Estate',           location:'Silesia', bio:'Two rental properties and counting. Leverage works.',                  orgs:['pko-bank'],                               badgeCount:5  },
  { id:'00000000-0000-0000-0000-000000000020', username:'julia_d',         display_name:'Julia Dąbrowska',   avatar:'🎭', xp:2100,  streak:6,  last_active:daysAgo(3), specialty:'Behavioral Finance', location:'Warsaw',  bio:'Why do smart people make dumb money decisions? I study that.',         orgs:['warsaw-uni'],                             badgeCount:3  },
  { id:'00000000-0000-0000-0000-000000000021', username:'tomasz_j',        display_name:'Tomasz Jankowski',  avatar:'🔭', xp:3700,  streak:10, last_active:daysAgo(1), specialty:'Macro Analysis',     location:'Wrocław', bio:'Watching macro trends before they hit the mainstream.',                orgs:['fintech-hub'],                            badgeCount:5  },
  { id:'00000000-0000-0000-0000-000000000022', username:'katarzyna_n',     display_name:'Katarzyna Nowak',   avatar:'🌸', xp:2600,  streak:8,  last_active:today(),  specialty:'Retirement Planning',   location:'Poznań',  bio:'IKE + IKZE maxed every year since I started working.',                 orgs:['pko-bank'],                               badgeCount:4  },
  { id:'00000000-0000-0000-0000-000000000023', username:'lukasz_w',        display_name:'Łukasz Wójcik',     avatar:'🏋️', xp:4200,  streak:12, last_active:daysAgo(1), specialty:'Portfolio Management',location:'Gdańsk', bio:'Asset allocation is everything. I rebalance quarterly.',              orgs:['pko-bank'],                               badgeCount:5  },
  { id:'00000000-0000-0000-0000-000000000024', username:'marta_k',         display_name:'Marta Kowalczyk',   avatar:'🌊', xp:2900,  streak:7,  last_active:daysAgo(2), specialty:'Risk Hedging',       location:'Kraków',  bio:'Options not for speculation — for protection.',                        orgs:['fintech-hub'],                            badgeCount:4  },
  { id:'00000000-0000-0000-0000-000000000025', username:'adam_l',          display_name:'Adam Lewandowski',  avatar:'⚡', xp:3500,  streak:9,  last_active:today(),  specialty:'Crypto & DeFi',         location:'Warsaw',  bio:'DeFi yield strategies that still work in a bear market.',              orgs:['eth-silesia','genesis-dao'],              badgeCount:5  },
  // Rising
  { id:'00000000-0000-0000-0000-000000000026', username:'zofia_k',         display_name:'Zofia Kamińska',    avatar:'🌺', xp:1850,  streak:5,  last_active:today(),  specialty:'Stock Basics',          location:'Warsaw',  bio:'First year investor. Learning fast, making fewer mistakes.',           orgs:['warsaw-uni'],                             badgeCount:3  },
  { id:'00000000-0000-0000-0000-000000000027', username:'michal_b',        display_name:'Michał Błaszczyk',  avatar:'🎸', xp:1640,  streak:4,  last_active:daysAgo(1), specialty:'ETFs',               location:'Kraków',  bio:'Music producer by day, index fund investor by night.',                orgs:['warsaw-uni'],                             badgeCount:2  },
  { id:'00000000-0000-0000-0000-000000000028', username:'ewa_s',           display_name:'Ewa Szymańska',     avatar:'🦋', xp:1920,  streak:6,  last_active:today(),  specialty:'Budgeting',             location:'Warsaw',  bio:'Finally got my finances sorted after reading one good book.',          orgs:['pko-bank'],                               badgeCount:3  },
  { id:'00000000-0000-0000-0000-000000000029', username:'bartosz_w',       display_name:'Bartosz Wiśniak',   avatar:'🛡️', xp:1200,  streak:3,  last_active:daysAgo(2), specialty:'Insurance & Safety', location:'Gdańsk',  bio:'Emergency fund first. Always.',                                        orgs:['pko-bank'],                               badgeCount:2  },
  { id:'00000000-0000-0000-0000-000000000030', username:'agnieszka_m',     display_name:'Agnieszka Malik',   avatar:'🌙', xp:980,   streak:4,  last_active:daysAgo(1), specialty:'Crypto',             location:'Silesia', bio:'Bought ETH at the top, learned the lesson, now DCA every month.',      orgs:['eth-silesia'],                            badgeCount:2  },
  { id:'00000000-0000-0000-0000-000000000031', username:'konrad_p',        display_name:'Konrad Pawlak',     avatar:'🎯', xp:1550,  streak:5,  last_active:today(),  specialty:'Dividend Stocks',       location:'Warsaw',  bio:'Building a dividend snowball, one share at a time.',                   orgs:['pko-bank'],                               badgeCount:2  },
  { id:'00000000-0000-0000-0000-000000000032', username:'natalia_z',       display_name:'Natalia Zając',     avatar:'💡', xp:760,   streak:3,  last_active:daysAgo(3), specialty:'Personal Finance',   location:'Wrocław', bio:'Just started my investment journey. Loving every lesson.',             orgs:['warsaw-uni'],                             badgeCount:2  },
  { id:'00000000-0000-0000-0000-000000000033', username:'rafal_c',         display_name:'Rafał Czarnecki',   avatar:'🦅', xp:1380,  streak:4,  last_active:daysAgo(1), specialty:'Technical Analysis', location:'Warsaw',  bio:'Charts tell stories. Learning to read them properly.',                 orgs:['fintech-hub'],                            badgeCount:2  },
  { id:'00000000-0000-0000-0000-000000000034', username:'monika_h',        display_name:'Monika Hernik',     avatar:'🌼', xp:890,   streak:2,  last_active:daysAgo(4), specialty:'Real Estate',        location:'Kraków',  bio:'Saving for first apartment while learning about the market.',          orgs:['warsaw-uni'],                             badgeCount:1  },
  { id:'00000000-0000-0000-0000-000000000035', username:'sebastian_r',     display_name:'Sebastian Rybak',   avatar:'🎲', xp:1710,  streak:5,  last_active:today(),  specialty:'Options',               location:'Warsaw',  bio:'Cautious options trader. Learned from expensive mistakes.',            orgs:['fintech-hub'],                            badgeCount:3  },
  { id:'00000000-0000-0000-0000-000000000036', username:'paulina_d',       display_name:'Paulina Duda',      avatar:'🌈', xp:640,   streak:2,  last_active:daysAgo(2), specialty:'Sustainable Finance',location:'Gdańsk',  bio:'Voting with my portfolio for a better world.',                         orgs:['warsaw-uni'],                             badgeCount:1  },
  { id:'00000000-0000-0000-0000-000000000037', username:'pawel_s',         display_name:'Paweł Sikorski',    avatar:'🏔️', xp:1450,  streak:4,  last_active:daysAgo(1), specialty:'Growth Investing',   location:'Poznań',  bio:'Looking for 10-baggers. Most become 0.5-baggers. Learning.',           orgs:['fintech-hub'],                            badgeCount:2  },
  { id:'00000000-0000-0000-0000-000000000038', username:'dominika_k',      display_name:'Dominika Krawczyk', avatar:'🦁', xp:1100,  streak:3,  last_active:today(),  specialty:'Financial Planning',    location:'Warsaw',  bio:'Certified financial planner helping young professionals.',             orgs:['pko-bank'],                               badgeCount:2  },
  { id:'00000000-0000-0000-0000-000000000039', username:'jakub_m',         display_name:'Jakub Mazur',       avatar:'⚙️', xp:820,   streak:3,  last_active:daysAgo(2), specialty:'Algorithmic Trading',location:'Łódź',    bio:'Engineer building my first trading bot. Results pending.',             orgs:['fintech-hub'],                            badgeCount:1  },
  { id:'00000000-0000-0000-0000-000000000040', username:'aleksandra_w',    display_name:'Aleksandra Wróbel', avatar:'🦚', xp:1270,  streak:4,  last_active:daysAgo(1), specialty:'Wealth Management',  location:'Kraków',  bio:'Working at a family office and studying evenings.',                    orgs:['warsaw-uni'],                             badgeCount:2  },
  // Rookies
  { id:'00000000-0000-0000-0000-000000000041', username:'filip_n',         display_name:'Filip Nowicki',     avatar:'🐣', xp:480,   streak:2,  last_active:today(),  specialty:'Basics',                location:'Warsaw',  bio:'Total beginner. Just got my first job and want to invest.',            orgs:['pko-bank'],                               badgeCount:1  },
  { id:'00000000-0000-0000-0000-000000000042', username:'oliwia_j',        display_name:'Oliwia Janowska',   avatar:'🌱', xp:320,   streak:1,  last_active:daysAgo(1), specialty:'Basics',             location:'Kraków',  bio:'University student learning about money for the first time.',          orgs:['warsaw-uni'],                             badgeCount:1  },
  { id:'00000000-0000-0000-0000-000000000043', username:'kamil_b',         display_name:'Kamil Baran',       avatar:'🐥', xp:150,   streak:1,  last_active:daysAgo(3), specialty:'Crypto',             location:'Warsaw',  bio:'Got wrecked on shitcoins. Starting fresh with fundamentals.',          orgs:['eth-silesia'],                            badgeCount:1  },
  { id:'00000000-0000-0000-0000-000000000044', username:'weronika_k',      display_name:'Weronika Kubiak',   avatar:'🌻', xp:270,   streak:2,  last_active:daysAgo(2), specialty:'Savings',            location:'Wrocław', bio:'Finally have savings beyond my checking account.',                     orgs:['pko-bank'],                               badgeCount:1  },
  { id:'00000000-0000-0000-0000-000000000045', username:'damian_o',        display_name:'Damian Olszewski',  avatar:'🔰', xp:90,    streak:1,  last_active:daysAgo(5), specialty:'Basics',             location:'Gdańsk',  bio:'Day one. Let the education begin.',                                    orgs:['warsaw-uni'],                             badgeCount:0  },
  { id:'00000000-0000-0000-0000-000000000046', username:'sylwia_p',        display_name:'Sylwia Pietrzykowska',avatar:'🌷',xp:410,  streak:2,  last_active:daysAgo(1), specialty:'Personal Finance',   location:'Warsaw',  bio:'Nurse learning to make my money work harder.',                         orgs:['pko-bank'],                               badgeCount:1  },
  { id:'00000000-0000-0000-0000-000000000047', username:'grzegorz_k',      display_name:'Grzegorz Kaczmarek',avatar:'🎮', xp:220,   streak:1,  last_active:daysAgo(4), specialty:'Gaming & Finance',  location:'Poznań',  bio:'Gamer realising that XP in real life matters too.',                    orgs:['warsaw-uni'],                             badgeCount:1  },
  { id:'00000000-0000-0000-0000-000000000048', username:'klaudia_w',       display_name:'Klaudia Witkowska', avatar:'🦋', xp:340,   streak:1,  last_active:daysAgo(2), specialty:'Basics',             location:'Silesia', bio:'High school teacher. Time to practice what I preach.',                 orgs:['warsaw-uni'],                             badgeCount:1  },
  { id:'00000000-0000-0000-0000-000000000049', username:'rookie_investor', display_name:'Rookie Investor',   avatar:'🎩', xp:340,   streak:3,  last_active:today(),  specialty:'Learning',              location:'Warsaw',  bio:'Starting my financial journey. Every XP counts.',                     orgs:['eth-silesia','pko-bank'],                 badgeCount:2  },
  { id:'00000000-0000-0000-0000-000000000050', username:'penny_prudence',  display_name:'Penny Prudence',    avatar:'🪙', xp:820,   streak:4,  last_active:daysAgo(1), specialty:'Frugality',          location:'Kraków',  bio:'Small amounts invested consistently beat big amounts invested occasionally.', orgs:['warsaw-uni'], badgeCount:2 },
]

// ── Game result generation ────────────────────────────────────────

function gameResultsForUser(userId: string, xp: number) {
  const count  = xp >= 5000 ? rnd(15,25) : xp >= 2000 ? rnd(10,18) : xp >= 500 ? rnd(5,12) : rnd(1,5)
  const types  = ['quiz','decision','swipe','fraud'] as const
  const xpMap  = { quiz:[80,150], decision:[100,320], swipe:[60,200], fraud:[50,180] }
  const results = []
  for (let i = 0; i < count; i++) {
    const type   = pick(types)
    const [lo,hi] = xpMap[type]
    const earned = rnd(lo, hi)
    const score  = rnd(2, 5)
    const total  = type === 'decision' ? 1 : 5
    results.push({
      user_id:   userId,
      game_type: type,
      xp_earned: earned,
      score,
      total,
      metadata:  {},
      created_at: daysAgo(rnd(0, 30)),
    })
  }
  return results
}

// ── Badge assignment ──────────────────────────────────────────────

const BADGE_IDS = BADGES.map(b => b.id)
const PROGRESSION_BADGES = ['first_quiz','finance_101','xp_500','streak_7','xp_1000','xp_5000','xp_10000','streak_30','top_100','top_10']

function badgesForUser(userId: string, xp: number, count: number) {
  const pool = xp >= 10000 ? BADGE_IDS
             : xp >= 5000  ? BADGE_IDS.filter(b => b !== 'xp_10000')
             : xp >= 2000  ? BADGE_IDS.filter(b => !['xp_5000','xp_10000','streak_30','top_10'].includes(b))
             : xp >= 500   ? BADGE_IDS.filter(b => !['xp_1000','xp_5000','xp_10000','streak_30','top_10','top_100'].includes(b))
             : BADGE_IDS.filter(b => !PROGRESSION_BADGES.slice(2).includes(b))

  const selected = new Set<string>()
  // Always give first_quiz to everyone with any xp
  if (count > 0) selected.add('first_quiz')
  while (selected.size < count && selected.size < pool.length) {
    selected.add(pick(pool))
  }
  return Array.from(selected).map(badge_id => ({
    user_id: userId,
    badge_id,
    earned_at: daysAgo(rnd(1, 90)),
  }))
}

// ── News items ────────────────────────────────────────────────────

const NEWS = [
  { headline: '★ COMPOUND INTEREST: The secret banks hope you never discover',           source: 'Knowly', category: 'education' },
  { headline: '★ BUDGETING SPECIAL: The 50/30/20 rule explained in one cartoon',         source: 'Knowly', category: 'education' },
  { headline: '★ DAILY CHALLENGE UNLOCKED: Today\'s financial puzzle is now live',       source: 'Knowly', category: 'game'      },
  { headline: '★ PKO EXCLUSIVE: New savings rates — are you getting yours?',             source: 'PKO Bank',   category: 'partner'   },
  { headline: '★ STREAK ALERT: 847 players maintained a 7-day streak this week',         source: 'Knowly', category: 'community' },
  { headline: '★ FRAUD ALERT: Three new phishing schemes targeting Polish bank users',   source: 'Knowly', category: 'security'  },
  { headline: '★ MARKET UPDATE: Warsaw Stock Exchange hits 3-month high this morning',   source: 'WSE Report', category: 'markets'   },
  { headline: '★ NEW GAME MODE: Fraud Spotter challenge now available — test yourself',  source: 'Knowly', category: 'game'      },
  { headline: '★ LEADERBOARD SHAKEUP: Compound Carl reclaims #1 spot after 42-day run', source: 'Knowly', category: 'community' },
  { headline: '★ LEARNING PATH: Module 3 "Investing Basics" now unlocked for all users', source: 'Knowly', category: 'education' },
]

// ── Main ─────────────────────────────────────────────────────────

async function run() {
  console.log('🌱  Starting Knowly seed...\n')

  await applyMigration()

  // Orgs
  console.log('📌  Seeding orgs...')
  const { error: orgsErr } = await sb.from('orgs').upsert(ORGS, { onConflict: 'id' })
  if (orgsErr) { console.error('   ❌', orgsErr.message); process.exit(1) }
  console.log(`   ✓ ${ORGS.length} orgs`)

  // Badges
  console.log('🏆  Seeding badges...')
  const { error: badgesErr } = await sb.from('badges').upsert(BADGES, { onConflict: 'id' })
  if (badgesErr) { console.error('   ❌', badgesErr.message); process.exit(1) }
  console.log(`   ✓ ${BADGES.length} badges`)

  // Users
  console.log('👤  Seeding users...')
  const userRows = USERS.map(({ orgs: _o, badgeCount: _b, ...u }) => u)
  const { error: usersErr } = await sb.from('users').upsert(userRows, { onConflict: 'id' })
  if (usersErr) { console.error('   ❌', usersErr.message); process.exit(1) }
  console.log(`   ✓ ${USERS.length} users`)

  // Org memberships
  console.log('🏢  Seeding org memberships...')
  const memberships = USERS.flatMap(u => u.orgs.map(orgId => ({ user_id: u.id, org_id: orgId, is_admin: false })))
  const { error: memErr } = await sb.from('org_members').upsert(memberships, { onConflict: 'user_id,org_id', ignoreDuplicates: true })
  if (memErr) { console.error('   ❌', memErr.message); process.exit(1) }
  console.log(`   ✓ ${memberships.length} memberships`)

  // Game results
  console.log('🎮  Seeding game results...')
  const allResults = USERS.flatMap(u => gameResultsForUser(u.id, u.xp))
  // Insert in batches of 200
  for (let i = 0; i < allResults.length; i += 200) {
    const batch = allResults.slice(i, i + 200)
    const { error } = await sb.from('game_results').insert(batch)
    if (error) { console.error('   ❌', error.message); process.exit(1) }
  }
  console.log(`   ✓ ${allResults.length} game results`)

  // User badges
  console.log('🎖️   Seeding user badges...')
  const allBadges = USERS.flatMap(u => badgesForUser(u.id, u.xp, u.badgeCount))
  const { error: ubErr } = await sb.from('user_badges').upsert(allBadges, { onConflict: 'user_id,badge_id', ignoreDuplicates: true })
  if (ubErr) { console.error('   ❌', ubErr.message); process.exit(1) }
  console.log(`   ✓ ${allBadges.length} user badges`)

  // News items
  console.log('📰  Seeding news items...')
  const { error: newsErr } = await sb.from('news_items').upsert(NEWS)
  if (newsErr) { console.error('   ❌', newsErr.message); process.exit(1) }
  console.log(`   ✓ ${NEWS.length} news items`)

  // Invite codes
  console.log('🔑  Seeding invite codes...')
  const codes = [
    { org_id: 'genesis-dao', code: 'GENESIS',  created_by: USERS[0].id, max_uses: null, active: true },
    { org_id: 'alpha-club',  code: 'ALPHA23',  created_by: USERS[1].id, max_uses: 50,   active: true },
    { org_id: 'eth-silesia', code: 'SILESIA24',created_by: USERS[0].id, max_uses: 100,  active: true },
    { org_id: 'pko-bank',    code: 'PKO2025',  created_by: USERS[6].id, max_uses: 500,  active: true },
  ]
  const { error: codesErr } = await sb.from('invite_codes').upsert(codes, { onConflict: 'code', ignoreDuplicates: true })
  if (codesErr) { console.error('   ❌', codesErr.message); process.exit(1) }
  console.log(`   ✓ ${codes.length} invite codes`)

  console.log('\n✅  Seed complete!')
  console.log(`   ${USERS.length} users · ${allResults.length} game results · ${allBadges.length} badges · ${memberships.length} org memberships`)
}

run().catch(err => { console.error('Fatal:', err); process.exit(1) })

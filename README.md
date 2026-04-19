# Knowly

**A white-label, gamified knowledge-exchange platform.** One codebase, many spaces — each organization gets its own branded "newspaper" full of mini-games, branching scenarios, learning paths, leaderboards, and community features. The app ships with ready-made spaces for **PKO Bank** (financial literacy), **ETHLegal** (consumer rights & digital law), **ETH Silesia** (on-chain / DeFi), **Warsaw University** (student finance), and **Warsaw FinTech Hub** (builder / startup content) — and onboards any new organization in minutes.

Built for **ETH Silesia 2026**.

---

## What Knowly is

Knowly treats learning the way games treat play: short rounds, fast feedback, compounding progress, and a clear sense of *where you are* in the skill tree. Every interaction is a 30-second to 2-minute module. Every module awards XP, streaks, and badges. Every space (org) can re-skin the whole experience — masthead, ticker, hero story, quiz bank, learning path, decision scenarios, forecasts — without touching code.

- **Knowledge in short rounds** — Quiz, Swipe, and FraudSpotter games deliver five-question bursts.
- **Decision-as-gameplay** — branching scenarios where every choice visibly moves a needle.
- **Narrative learning path** — a chaptered skill tree with embedded lessons, cartoon slides, and mini-games.
- **First-days onboarding as a game world** — guided sign-up → join-a-space → first lesson → first badge, all telegraphed as "level 1 of your professional world."
- **Community spaces** — leaderboards, member directory, invite codes, per-org theming.
- **Secure by design** — 254 security tests against OWASP Top 10:2025, plus GDPR-ready data flows.

## How white-labelling works (the demo story)

Every org in Supabase owns a distinct content pack. Switching the active space in the Org Switcher **re-skins the whole app in real time**:

| Space | Theme | Masthead | Hero story sample | Quiz bank | Learning path |
|-------|-------|----------|-------------------|-----------|---------------|
| **PKO Bank** | Finance | *"All The Financial News Fit To Play · PKO Edition"* | *"PKO Savings Revolution: The Rate Your Branch Never Mentions"* | IKE/IKZE, mortgages, compound interest | Finance Basics → Investing Mastery |
| **ETHLegal** | Legal | *"All The Consumer Rights News Fit To Play"* | *"Is Your Bank Secretly Breaking GDPR?"* | PSD2, GDPR Art. 15/17, MiCA, Rzecznik Finansowy | Data Rights → Disputes & Remedies |
| **ETH Silesia** | Finance | *"All The On-Chain News Fit To Play"* | *"Silesia Dev Ships L2 dApp — Here's What We Learned"* | EIP-4844, blobs, L2s | (finance path fallback) |
| **Warsaw University** | Finance | *"All The Student Finance News Fit To Play"* | *"UW Student Graduates Debt-Free — Here's Exactly How"* | Budgeting, first-job contracts | (finance path fallback) |
| **Warsaw FinTech Hub** | Finance | *"All The FinTech News Fit To Play"* | *"Warsaw FinTech Raises €4M — The Product Pitch Inside"* | PSD2/PSD3, APIs, sandboxes | (finance path fallback) |

Content packs live in `src/data/` (`homeContent.ts`, `pathContent.ts`, `quizContent.ts`) and are resolved through `OrgContext.activeOrgId` + `theme`. Add a new org → add a content block → done.

---

## Bounty mapping

This repo is aimed at four bounties. Here is how each one is implemented.

### PKO XP — Idea 1: *Gaming: Knowledge in a Short Round*

> "Design a game-inspired educational format in which knowledge is unlocked in short rounds and users return to it with pleasure."

**Implemented as:**
- **Quiz (`/quiz`)** — 5-question rounds, 30 seconds each. Every question ships with a correct/incorrect reveal, an explanation card, and +100 XP per question. The PKO space swaps the question bank to IKE/IKZE, compound interest, budgeting rules (50/30/20), APR, and credit vs debit cards. Five rounds ≈ 2 minutes of play for ~+500 XP.
- **Swipe (`/swipe`)** — Tinder-style card game for smart-vs-dumb financial choices. Micro-sessions, dopamine loop, instant tally.
- **FraudSpotter (`/fraud`)** — snap-decision game: real transaction or scam? Builds the "pattern-recognition" muscle that PKO Bank teaches through fraud-awareness campaigns.
- **Daily streak** — `streak` and `last_active` tracked server-side; resets are forgiving (no day-zero penalty within 24h).
- **Short-round rhythm on the home page** — a newspaper "spread" format with a keyboard- and swipe-driven page-flip animation, so the surface area of the app is itself a paginated, micro-interactive medium.
- **Content co-creation ready** — quiz banks, path lessons, and hero stories are TypeScript data modules. The admin API already supports news/invite-code CRUD; the same pattern is ready to extend to quiz content (see `server/src/routes/admin.ts`).

### PKO XP — Idea 2: *Gaming: Financial Decisions as Gameplay*

> "Design an experience in which financial decisions become elements of gameplay — progress, difficulty levels, engagement loops — to build long-term competencies."

**Implemented as:**
- **Decision Room (`/decision`)** — fully branching scenarios with four distinct mechanics already shipped: relationship tracking, chapter summaries, mini-games, and a final debrief. Each choice changes outcomes, unlocks/locks later branches, and visibly moves in-scenario "resources" (trust, savings, time).
- **Outcome XP** — up to +320 XP per completed scenario, awarded server-side after validation (score ≤ total, no client-trusted amount).
- **Difficulty progression** — the Decision Room feeds into the Learning Path where each node is gated on prior completion; later chapters introduce higher-stakes scenarios (mortgage choice, early-retirement planning, negotiating a first B2B contract).
- **Replayable loops** — outcomes are stored in `game_results` with a 5-minute per-game-type cooldown to prevent grinding while still rewarding re-engagement.
- **Safe simulation** — everything is sandboxed; no financial product is actually connected. This is the "flight simulator" the brief asks for.

### PKO XP — Idea 3: *Gaming: First Days in a New World*

> "Design onboarding as a coherent experience that introduces new participants step by step, much like game campaigns."

**Implemented as:**
- **Campaign-style sign-up flow** (`src/pages/Onboarding.tsx`) — pick your avatar, pick your space (PKO Bank / ETHLegal / ETH Silesia / Warsaw Uni / FinTech Hub), set your goals, confirm. Each step feels like a character-creation screen.
- **Auto-join + warm landing** — new users auto-join their selected org and land directly on the org's themed Home (masthead, hero, ticker, forecast all personalized).
- **First-lesson-is-free** — the Learning Path's node 1 is unlocked by default so the user earns XP and a badge within minutes.
- **Badge campaign** — 26 badges including `first_quiz`, `path_starter`, `path_halfway`, `path_complete`, `streak_7`, `streak_30`, `xp_500` → `xp_10000`, creating a visible "level-up" ladder across the first days and weeks.
- **Community belonging** — the Org Switcher is always visible in the top bar, the member directory shows teammates in the same space, and the leaderboard is filterable per org (`/leaderboard?orgId=...`) so newcomers immediately see "the people in my world."
- **Extensible to corporate onboarding** — because content is per-space, a PKO internship program could deploy a `pko-interns` org with its own path ("Week 1: People & Culture", "Week 2: Systems Walkthrough", …), quiz banks on internal tools, and a custom Decision Room scenario ("your first customer call"). No code changes required.

### ETHLegal bounty

> "Empower citizens with legal and financial literacy. Build tools that make consumer rights, GDPR, PSD2, MiCA, and EU consumer law tangible, playable, and searchable."

**Implemented as:**
- **ETHLegal is a first-class space** — full parity with the finance spaces. Switch to ETHLegal in the Org Switcher and the entire Home page, Learning Path, Quiz, and news ticker become legal-literacy content.
- **Legal Learning Path (`src/data/pathContent.ts`, `LEGAL_CONTENT`)** — 5 chapters / 15 nodes covering:
  - *Your Data Rights* — GDPR Art. 15 (access), Art. 17 (erasure), Art. 20 (portability), Data Protection Authorities.
  - *Banking & Payments* — PSD2, Strong Customer Authentication (SCA), Payment Account Directive rights, chargeback timelines.
  - *Consumer Credit* — EU Consumer Credit Directive 2023/2225, 14-day cooling-off, unfair-terms directive.
  - *Crypto & Digital* — MiCA 2024, DSA, stablecoin rules.
  - *Disputes & Remedies* — UOKiK vs Rzecznik Finansowy, ADR, small-claims, cross-border complaints.
- **Rights Rounds quiz (`src/data/quizContent.ts`, `LEGAL_QUIZ`)** — five rapid-fire questions calibrated to the *exact* numbers people get wrong: 13-month PSD2 dispute window, 30-day GDPR SAR response, 14-day cooling-off period, which Polish body handles which complaint, what MiCA actually covers.
- **Legal news ticker & hero stories** — swap the PKO-flavored ticker for live-feeling legal headlines ("GDPR Shock: EU regulator fines Big Tech €390M", "PSD2 Alert: You have 13 months to dispute a card fraud — not 48 hours").
- **Knowly × ETHLegal back-cover** — co-branded call-to-action: *"Ready to Master Your Consumer Rights? Powered by ETHLegal — your consumer rights, gamified."*
- **Privacy-first UX** — shipped end-to-end:
  - `GET /api/users/me/export` — GDPR Article 15 Subject Access Request. Returns a single JSON bundle (profile, game_results, badges, path_progress, org memberships, plus a data-map) as a downloadable attachment.
  - `DELETE /api/users/me` — GDPR Article 17 Right to Erasure. CASCADE-deletes every user-scoped row, then removes the Supabase Auth record. Logs `[SECURITY] ERASURE_OK`.
  - **Privacy Dashboard** at `/profile/privacy` — transparency list of every field Knowly stores, a data-map (Supabase PG EU + Supabase Auth EU + stateless Hono + browser localStorage), one-click export button that streams the JSON download, consent toggles for sounds/analytics/marketing (localStorage-persisted), and a double-confirm account-erasure flow that requires typing `DELETE` before it fires.
  - Footer pointers to **UODO**, **Rzecznik Finansowy**, and **UOKiK** so users know where to escalate.

### AKMF — *Secure infrastructure for web and mobile applications*

> "Security by Design: correct authorization (IAM), secure secrets management, OWASP-resistant infrastructure, encryption, and monitoring."

**Implemented as a dedicated hardening layer across the Hono backend:**

| OWASP 2025 | How Knowly mitigates it |
|------------|-------------------------|
| **A01 Broken Access Control** | `userId` is always extracted from the verified Supabase JWT — never trusted from the request body. Ownership checks enforced on every self-service endpoint (`/games/user/:userId`, `PATCH /users/:id`). `isAdmin` is re-verified against the DB on every admin call, not cached in the token. |
| **A02 Security Misconfiguration** | Strict CORS allowlist (not `*`). Full security-header suite: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. Stack traces scrubbed from client responses in production. |
| **A03 Injection** | Only parameterized Supabase queries. `sanitizeSearch()` strips SQL metacharacters (including `--`, `/*`, `;`). UUID path params validated before any DB lookup. Game `type` is an allow-list (`quiz | decision | swipe | fraud | path`) — not a free-form string. |
| **A04 Cryptographic Failures** | Invite codes generated via `crypto.getRandomValues()` (CSPRNG). Password length bounds (8–128) enforced server-side. Service-role key lives in `server/.env`, never in the frontend bundle. |
| **A05 Insecure Design** | XP server-capped at 1000 per submission. `score > total` rejected as physically impossible. Explicit column mapping on responses — no `select('*')` passthrough that could accidentally leak a new column added later. |
| **A06 Vulnerable Components** | Minimal dependency surface on the server; Hono + Supabase JS + Zod only. Renovate-ready. |
| **A07 Identification & Auth Failures** | Rate-limiting per route class: registration 5/hr, game submission 20 per 5 min, invite-code claim 10 per 15 min. `supabase.auth.getUser()` exceptions fail *closed* to 401 — never open. |
| **A08 Software & Data Integrity** | All mutations go through typed Zod validators. The DB layer rejects malformed payloads before business logic runs. |
| **A09 Security Logging & Monitoring** | Auth failures, admin access attempts, XP-cap overrides, and rate-limit hits logged with a `[SECURITY]` prefix for easy log-drain filtering. |
| **A10 Server-Side Request Forgery / Exceptional Conditions** | Global error handler sanitizes every DB error before reaching the client. No user-controlled URLs are ever fetched server-side. |

**254 automated security tests** run in `server/tests/` across three suites:
- `security.test.ts` — baseline OWASP coverage.
- `security-advanced.test.ts` — exploitation-pattern tests (privilege escalation chains, XP farming, field exposure, header spoofing).
- `security-e2e.test.ts` — multi-step attack scenarios.

Run them with `cd server && npm test`.

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript, Vite, Tailwind CSS v4, shadcn/ui |
| Backend | Node.js, Hono, TypeScript, Zod |
| Database / Auth | Supabase (PostgreSQL + Auth, EU region) |
| Testing | Vitest (254 security-focused tests) |
| Theming | Custom `OrgContext` + content-as-data modules in `src/data/` |

## Project structure

```
ethsilesia/
├── src/                    # React frontend
│   ├── pages/              # Home (newspaper), Quiz, Decision, Swipe, FraudSpotter,
│   │                       # Path, Leaderboard, Community, Onboarding, Profile, ...
│   ├── components/         # Nav, OrgSwitcher, 45+ shadcn/ui components
│   ├── contexts/           # AuthContext, OrgContext (active-space + theme)
│   ├── data/               # homeContent.ts, pathContent.ts, quizContent.ts
│   │                       #   — per-space content packs (finance / legal / per-org)
│   └── lib/                # api.ts, supabase.ts, featureFlags.ts, sounds.ts
├── server/                 # Hono API
│   ├── src/
│   │   ├── app.ts          # App factory, route mounting, CORS, security middleware
│   │   ├── routes/         # auth, users, games, leaderboard, orgs, members, news, admin
│   │   └── middleware/     # auth, rateLimit, validate, securityHeaders, errorHandler
│   └── tests/              # security.test.ts, security-advanced.test.ts, security-e2e.test.ts
└── supabase/
    ├── migrations/         # 001_schema.sql, 002_feature_flags.sql
    └── seed.sql            # 7 orgs, 50 users, 26 badges, sample games & news
```

## Setup

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project

### 1. Clone and install

```bash
git clone <repo-url>
cd ethsilesia
npm install
cd server && npm install && cd ..
```

### 2. Environment variables

**Root `.env`** (frontend):
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**`server/.env`** (backend):
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key   # never expose this publicly
PORT=3001
```

### 3. Database

Run migrations in the Supabase SQL editor (or via the Supabase CLI):

```bash
# Option A — paste manually into the Supabase SQL editor
supabase/migrations/001_schema.sql
supabase/migrations/002_feature_flags.sql
supabase/seed.sql

# Option B — CLI
supabase db push
```

### 4. Run locally

```bash
# Both frontend (port 5173) and backend (port 3001)
npm run dev:full

# Frontend only
npm run dev

# Backend only
npm run dev:server
```

### 5. Tests

```bash
cd server
npm test
```

254 tests covering OWASP A01–A10.

---

## Game types

| Type | Route | Mechanic | Bounty fit |
|------|-------|----------|-----------|
| `quiz` | `/quiz` | 5-question flashcard round, 30s each | PKO Idea 1 — knowledge in short rounds |
| `decision` | `/decision` | Branching scenarios with relationships, mini-games, debrief | PKO Idea 2 — decisions as gameplay |
| `swipe` | `/swipe` | Card-based swipe micro-game | PKO Idea 1 — short, intense interactions |
| `fraud` | `/fraud` | Identify scams and fraudulent transactions | PKO Idea 1 + AKMF — security awareness |
| `path` | `/path` | Chaptered skill tree with embedded quizzes & slides | PKO Idea 2 + ETHLegal — long-form progression |

## XP & progression

- **XP cap:** 1000 XP per submission (server-enforced, not client-trusted)
- **Cooldown:** 5-minute cooldown per game type before XP is awarded again
- **Path nodes:** XP awarded once per node — idempotent, no repeat farming
- **Levels:** Rookie (0) → Rising (500) → Pro (2000) → Expert (5000) → Legend (10000)
- **Badges:** 26 total — auto-awarded for streaks, XP milestones, perfect rounds, path completion, and game-specific achievements

## API reference

All routes are prefixed with `/api`.

### Public endpoints (no auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server health check |
| GET | `/feature-flags` | Active feature flags |
| GET | `/leaderboard` | Top 50 by XP (`?orgId=` to filter by org) |
| GET | `/leaderboard/stats` | Platform-wide stats |
| GET | `/members` | Member directory (`?search=&orgId=&limit=&offset=`) |
| GET | `/members/:slug` | Member profile by username |
| GET | `/news` | Latest 20 news items |
| GET | `/orgs` | All public orgs |
| GET | `/orgs/:id` | Org details |
| GET | `/orgs/:id/members` | Org member list |
| GET | `/users/:id` | Public user profile |
| GET | `/users/:id/badges` | User badges |
| GET | `/users/:id/path-progress` | Learning path completion |
| GET | `/users/:id/orgs` | User's org memberships |
| POST | `/auth/register` | Create account (rate-limited: 5/hr) |

### Authenticated endpoints (Bearer JWT required)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/games` | Submit game result, earn XP + badges (rate-limited: 20/5 min) |
| GET | `/games/user/:userId` | Own game history (ownership enforced) |
| PATCH | `/users/:id` | Update own profile (`displayName`, `avatar`, `goals`) |
| POST | `/orgs/:id/join` | Join org by ID |
| POST | `/orgs/join-by-code` | Join via invite code (rate-limited: 10/15 min) |

### Admin endpoints (JWT + DB-verified admin status)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/flags` | All feature flags |
| PATCH | `/admin/flags/:key` | Toggle flag |
| GET | `/admin/stats` | Platform stats |
| GET | `/admin/members` | Member list with admin fields |
| PATCH | `/admin/members/:id` | Update member (toggle `is_platform_admin`) |
| DELETE | `/admin/members/:id` | Remove member from all orgs |
| GET | `/admin/invite-codes` | All invite codes |
| POST | `/admin/invite-codes` | Create invite code |
| PATCH | `/admin/invite-codes/:id` | Toggle code active |
| GET | `/admin/news` | All news (including inactive) |
| POST | `/admin/news` | Create news item |
| PATCH | `/admin/news/:id` | Update news |
| DELETE | `/admin/news/:id` | Delete news |
| POST | `/admin/promote/:id` | Promote user to admin |

## Database schema

Key tables: `users`, `game_results`, `user_badges`, `badges`, `orgs`, `org_members`, `invite_codes`, `path_progress`, `news_items`, `feature_flags`.

See [`supabase/migrations/001_schema.sql`](supabase/migrations/001_schema.sql) for the full schema and [`supabase/seed.sql`](supabase/seed.sql) for sample data.

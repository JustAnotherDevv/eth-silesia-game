# XP Gazette

A gamified financial literacy platform — learn personal finance through mini-games, branching scenarios, leaderboards, and community spaces. Built for the ETH Silesia 2026 hackathon.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript, Vite, Tailwind CSS v4, shadcn/ui |
| Backend | Node.js, Hono, TypeScript |
| Database | Supabase (PostgreSQL + Auth) |
| Testing | Vitest (254 security-focused tests) |

## Project Structure

```
ethsilesia/
├── src/                    # React frontend
│   ├── pages/              # Quiz, Decision, Swipe, FraudSpotter, Path, Leaderboard, Community, ...
│   ├── components/         # Nav, OrgSwitcher, 45+ shadcn/ui components
│   ├── contexts/           # AuthContext
│   └── lib/                # api.ts, supabase.ts, featureFlags.ts, sounds.ts
├── server/                 # Hono API
│   ├── src/
│   │   ├── app.ts          # App factory, route mounting, CORS, security middleware
│   │   ├── routes/         # auth, users, games, leaderboard, orgs, members, news, admin
│   │   └── middleware/     # auth, rateLimit, validate, securityHeaders, errorHandler
│   └── tests/              # security.test.ts, security-advanced.test.ts, security-e2e.test.ts
└── supabase/
    └── migrations/         # 001_schema.sql, 002_feature_flags.sql
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
# Option A — paste manually into Supabase SQL editor
supabase/migrations/001_schema.sql
supabase/migrations/002_feature_flags.sql

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

254 tests covering OWASP A01–A10: privilege escalation, XP farming, injection patterns, field exposure, rate limiting, and chained attack scenarios.

## API Reference

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

## Game Types

| Type | Route | Mechanic |
|------|-------|----------|
| `quiz` | `/quiz` | 3-question flashcard rounds |
| `decision` | `/decision` | Branching financial scenarios with outcomes |
| `swipe` | `/swipe` | Card-based swipe mini-game |
| `fraud` | `/fraud` | Identify scams and fraudulent transactions |
| `path` | `/path` | Structured learning path with embedded quizzes |

## XP & Progression

- **XP cap:** 1000 XP per submission (server-enforced, not client-trusted)
- **Cooldown:** 5-minute cooldown per game type before XP is awarded again
- **Path nodes:** Awarded once per node — idempotent, no repeat XP
- **Levels:** Rookie (0) → Rising (500) → Pro (2000) → Expert (5000) → Legend (10000)
- **Badges:** Auto-awarded for streaks, XP milestones, perfect rounds, path completion, and game-specific achievements

## Security

The backend implements OWASP Top 10:2025 mitigations:

| Category | Mitigation |
|----------|-----------|
| **A01 Broken Access Control** | `userId` always from verified JWT, never from request body. Ownership checks on self-service endpoints. Admin status DB-verified every request. |
| **A02 Security Misconfiguration** | Strict CORS allowlist, full security header suite (CSP, HSTS, X-Frame-Options, etc.), no stack traces to clients in production. |
| **A04 Cryptographic Failures** | Invite codes via `crypto.getRandomValues()`. Passwords 8–128 chars enforced server-side. |
| **A05 Injection** | Parameterized Supabase queries, `sanitizeSearch()` strips SQL metacharacters including `--`, UUID path params validated before any DB query, game type allowlist. |
| **A06 Insecure Design** | XP server-capped, score > total rejected (impossible result guard), explicit response field mapping (no `select('*')` passthrough). |
| **A07 Authentication Failures** | Rate limiting on auth, game submission, and invite code endpoints. `getUser()` exceptions fail closed to 401. |
| **A09 Security Logging** | Auth failures, admin access attempts, and security events logged with `[SECURITY]` prefix. |
| **A10 Exceptional Conditions** | Global error handler, all DB errors sanitized before reaching the client. |

## Database Schema

Key tables: `users`, `game_results`, `user_badges`, `badges`, `orgs`, `org_members`, `invite_codes`, `path_progress`, `news_items`, `feature_flags`.

See [`supabase/migrations/001_schema.sql`](supabase/migrations/001_schema.sql) for the full schema.

# XP Gazette

Gamified financial literacy platform with communities, quizzes, leaderboards, and learning paths. Built with a rubber-hose comic aesthetic.

## Tech Stack

**Frontend:** React 19 + TypeScript + Vite 8 + React Router v7  
**Backend:** Fastify 4 + Prisma 5 + SQLite  
**Auth:** JWT (`@fastify/jwt`) + bcryptjs password hashing

## Quick Start

### 1. Frontend

```bash
npm install
npm run dev        # http://localhost:5173
```

### 2. Backend

```bash
cd server
npm install
cp .env.example .env   # edit JWT_SECRET before deploying
npm run db:migrate
npm run db:seed
npm run dev            # http://localhost:3001
```

### 3. Run both together (from root)

```bash
npm install          # installs concurrently
npm run dev:all      # starts Vite + Fastify simultaneously
```

## Environment Variables

All server config lives in `server/.env` (gitignored).

| Variable       | Default                       | Description                          |
|----------------|-------------------------------|--------------------------------------|
| `DATABASE_URL` | `file:./dev.db`               | Prisma SQLite URL                    |
| `JWT_SECRET`   | *(required — no default)*     | Secret for signing JWTs, ≥32 chars   |
| `PORT`         | `3001`                        | API server port                      |

Copy `server/.env.example` and set at minimum `JWT_SECRET`.

## Seed Accounts

After running `npm run db:seed` in the `server` directory:

| Email                    | Password      | Role               |
|--------------------------|---------------|--------------------|
| `admin@xpgazette.dev`    | `admin123`    | Admin (ETH Silesia DAO) |
| `alice@example.com`      | `password123` | Member              |
| `bob@example.com`        | `password123` | Member              |

## API Routes

| Method | Path                         | Auth     | Description                       |
|--------|------------------------------|----------|-----------------------------------|
| POST   | `/api/auth/signup`           | —        | Register + optional community     |
| POST   | `/api/auth/login`            | —        | Login, returns JWT                |
| GET    | `/api/auth/me`               | JWT      | Current user                      |
| GET    | `/api/community`             | —        | List public communities           |
| POST   | `/api/community/join`        | JWT      | Join via invite code              |
| GET    | `/api/admin/community`       | JWT+Admin| Community stats                   |
| GET    | `/api/admin/invite-codes`    | JWT+Admin| List invite codes                 |
| POST   | `/api/admin/invite-codes`    | JWT+Admin| Generate new code                 |
| DELETE | `/api/admin/invite-codes/:id`| JWT+Admin| Revoke code                       |
| GET    | `/api/admin/members`         | JWT+Admin| List community members            |
| DELETE | `/api/admin/members/:userId` | JWT+Admin| Remove member                     |
| PATCH  | `/api/admin/settings`        | JWT+Admin| Update community settings         |
| GET    | `/api/admin/modules`         | JWT+Admin| List learning modules             |
| POST   | `/api/admin/modules`         | JWT+Admin| Create module                     |
| PATCH  | `/api/admin/modules/:id`     | JWT+Admin| Update / publish module           |
| DELETE | `/api/admin/modules/:id`     | JWT+Admin| Delete module                     |

## Frontend Routes

| Path                   | Description                              |
|------------------------|------------------------------------------|
| `/onboarding`          | Signup / login flow                      |
| `/`                    | Home dashboard                           |
| `/news`                | Financial news                           |
| `/quiz`                | Quick rounds quiz                        |
| `/design`              | Design sandbox                           |
| `/path`                | Learning path                            |
| `/decision`            | Decision room                            |
| `/community`           | Member grid                              |
| `/community/:username` | Individual member profile                |
| `/leaderboard`         | XP leaderboard                           |
| `/profile`             | Your profile                             |
| `/admin`               | Admin panel (community admin only)       |

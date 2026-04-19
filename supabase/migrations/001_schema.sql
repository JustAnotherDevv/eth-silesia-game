-- Knowly — Initial Schema
-- Run via: supabase db push  OR  paste into Supabase SQL editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Users ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  username     TEXT        UNIQUE NOT NULL,
  display_name TEXT        NOT NULL,
  avatar       TEXT        NOT NULL DEFAULT '🎩',
  xp           INTEGER     NOT NULL DEFAULT 0,
  streak       INTEGER     NOT NULL DEFAULT 0,
  last_active  DATE,
  goals        JSONB       NOT NULL DEFAULT '[]',
  location     TEXT        NOT NULL DEFAULT '',
  bio          TEXT        NOT NULL DEFAULT '',
  specialty    TEXT        NOT NULL DEFAULT 'Finance',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Game results ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.game_results (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  game_type  TEXT        NOT NULL,
  xp_earned  INTEGER     NOT NULL DEFAULT 0,
  score      INTEGER     NOT NULL DEFAULT 0,
  total      INTEGER     NOT NULL DEFAULT 0,
  metadata   JSONB       NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Organizations ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.orgs (
  id          TEXT        PRIMARY KEY,
  name        TEXT        NOT NULL,
  emoji       TEXT        NOT NULL DEFAULT '🏢',
  color       TEXT        NOT NULL DEFAULT '#1565C0',
  is_public   BOOLEAN     NOT NULL DEFAULT TRUE,
  invite_code TEXT        UNIQUE,
  description TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Org membership ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_members (
  user_id   UUID        NOT NULL REFERENCES public.users(id)  ON DELETE CASCADE,
  org_id    TEXT        NOT NULL REFERENCES public.orgs(id)   ON DELETE CASCADE,
  is_admin  BOOLEAN     NOT NULL DEFAULT FALSE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, org_id)
);

-- ── Badge catalog ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.badges (
  id          TEXT PRIMARY KEY,
  emoji       TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT NOT NULL
);

-- ── User badge assignments ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id   UUID        NOT NULL REFERENCES public.users(id)   ON DELETE CASCADE,
  badge_id  TEXT        NOT NULL REFERENCES public.badges(id)  ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- ── News / ticker items ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.news_items (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  headline   TEXT        NOT NULL,
  source     TEXT        NOT NULL DEFAULT 'Knowly',
  category   TEXT        NOT NULL DEFAULT 'news',
  active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Invite codes (admin-managed) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id      TEXT        NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  code        TEXT        NOT NULL UNIQUE,
  created_by  UUID        REFERENCES public.users(id),
  uses        INTEGER     NOT NULL DEFAULT 0,
  max_uses    INTEGER,
  active      BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Learning path progress ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.path_progress (
  user_id      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  node_id      TEXT        NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, node_id)
);

-- ── Indexes ───────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_game_results_user_id   ON public.game_results (user_id);
CREATE INDEX IF NOT EXISTS idx_game_results_created   ON public.game_results (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_members_user       ON public.org_members  (user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org        ON public.org_members  (org_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user       ON public.user_badges  (user_id);
CREATE INDEX IF NOT EXISTS idx_users_xp               ON public.users        (xp DESC);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code      ON public.invite_codes (code);
CREATE INDEX IF NOT EXISTS idx_users_last_active      ON public.users        (last_active);

-- ── RLS (permissive for hackathon — server uses service role) ─────
ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_results  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orgs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.path_progress ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read on public tables
CREATE POLICY "anon_read_orgs"    ON public.orgs        FOR SELECT USING (true);
CREATE POLICY "anon_read_badges"  ON public.badges       FOR SELECT USING (true);
CREATE POLICY "anon_read_news"    ON public.news_items   FOR SELECT USING (active = true);
CREATE POLICY "anon_read_users"   ON public.users        FOR SELECT USING (true);

-- Service role bypasses RLS automatically — no extra policies needed

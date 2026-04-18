-- Feature flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key         TEXT        PRIMARY KEY,
  enabled     BOOLEAN     NOT NULL DEFAULT true,
  label       TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  category    TEXT        NOT NULL DEFAULT 'general',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID        REFERENCES public.users(id)
);

-- Platform admin flag on users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT false;

-- Seed default flags
INSERT INTO public.feature_flags (key, label, description, category) VALUES
  ('quiz',         'Quick Rounds',    'Quiz minigame',                       'games'),
  ('decision',     'Decision Room',   'Narrative decision game',              'games'),
  ('swipe',        'Card Swipe',      'Card swipe minigame',                  'games'),
  ('fraud',        'Fraud Spotter',   'Fraud detection game',                 'games'),
  ('path',         'Learning Path',   'Structured learning path',             'games'),
  ('leaderboard',  'Leaderboard',     'Global leaderboard page',              'pages'),
  ('community',    'Community',       'Community page',                       'pages'),
  ('news',         'News',            'News ticker page',                     'pages'),
  ('registration', 'Registration',    'Allow new user signups',               'platform'),
  ('maintenance',  'Maintenance Mode','Show maintenance page to all users',   'platform')
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY anon_read_flags ON public.feature_flags FOR SELECT USING (true);

-- XP Gazette — Seed Data
-- Run AFTER 001_schema.sql
-- Uses fixed UUIDs so game_results and org_members can reference users

-- ── Orgs ──────────────────────────────────────────────────────────
INSERT INTO public.orgs (id, name, emoji, color, is_public, invite_code, description) VALUES
  ('eth-silesia',  'ETH Silesia',       '⛓️', '#7B2D8B', true,  null,      'Blockchain & crypto enthusiasts from Silesia.'),
  ('pko-bank',     'PKO Bank',          '🏦', '#1565C0', true,  null,      'PKO Bank innovation & fintech team.'),
  ('warsaw-uni',   'Warsaw University', '🎓', '#2D9A4E', true,  null,      'University of Warsaw finance students.'),
  ('fintech-hub',  'FinTech Hub',       '⚡', '#FF7B25', true,  null,      'Warsaw FinTech startup community.'),
  ('genesis-dao',  'Genesis DAO',       '🌐', '#E63946', false, 'GENESIS', 'Private DAO — invite only.'),
  ('alpha-club',   'Alpha Club',        '🔑', '#FFCD00', false, 'ALPHA23', 'Private alpha testing group.')
ON CONFLICT (id) DO NOTHING;

-- ── Badge catalog (26 badges) ─────────────────────────────────────
INSERT INTO public.badges (id, emoji, name, description) VALUES
  ('first_quiz',     '🏆', 'First Quiz',       'Completed your first quiz round'),
  ('speed_reader',   '⚡', 'Speed Reader',      'Answered a question in under 5 seconds'),
  ('finance_101',    '🎓', 'Finance 101',       'Completed the basics module'),
  ('xp_500',         '💰', '500 XP Club',       'Earned 500 total XP'),
  ('streak_7',       '🔥', '7-Day Streak',      'Logged in 7 consecutive days'),
  ('perfect_round',  '🌟', 'Perfect Round',     'Scored 5/5 on any quiz'),
  ('sharpshooter',   '🎯', 'Sharpshooter',      'Maintained 90%+ accuracy overall'),
  ('bull_market',    '📈', 'Bull Market',       'Won 10 games in a row'),
  ('fraud_fighter',  '🕵️', 'Fraud Fighter',     'Identified 5 scams correctly'),
  ('wise_swiper',    '🃏', 'Wise Swiper',       'Correct on all 10 card swipe choices'),
  ('decision_maker', '🎲', 'Decision Maker',    'Chose the brilliant option in Decision Room'),
  ('streak_30',      '💫', '30-Day Streak',     'Maintained a 30-day login streak'),
  ('xp_1000',        '🥇', '1000 XP Club',      'Earned 1000 total XP'),
  ('xp_5000',        '💎', '5000 XP Club',      'Earned 5000 total XP'),
  ('xp_10000',       '👑', 'Legend Status',     'Reached 10000 XP — true financial legend'),
  ('community_100',  '🤝', 'Community Builder', 'Joined 3+ organizations'),
  ('night_owl',      '🦉', 'Night Owl',         'Played 5 games after midnight'),
  ('early_bird',     '🐦', 'Early Bird',        'Completed a challenge before 8am'),
  ('quiz_master',    '🧠', 'Quiz Master',       'Completed 20 quiz rounds'),
  ('path_starter',   '🗺️', 'Path Starter',      'Completed first learning path node'),
  ('path_halfway',   '🏃', 'Halfway There',     'Completed 7 learning path nodes'),
  ('path_complete',  '🏅', 'Path Complete',     'Finished the full learning path'),
  ('top_10',         '🔟', 'Top 10',            'Ranked in the global top 10'),
  ('top_100',        '💯', 'Top 100',           'Ranked in the global top 100'),
  ('invite_3',       '📨', 'Recruiter',         'Invited 3 friends to join'),
  ('comeback',       '🔄', 'Comeback Kid',      'Returned after a 7-day absence')
ON CONFLICT (id) DO NOTHING;

-- ── Users (50 players) ────────────────────────────────────────────
-- Format: fixed UUIDs for cross-referencing in game_results / org_members
INSERT INTO public.users (id, username, display_name, avatar, xp, streak, last_active, specialty, location, bio) VALUES

-- Legends (10k+ XP)
('00000000-0000-0000-0000-000000000001','compound_carl',   'Compound Carl',   '🎩', 9840,  42, CURRENT_DATE,     'Quantitative Finance',  'Warsaw',  'I let math do the talking. Compound interest changed my life at 23.'),
('00000000-0000-0000-0000-000000000002','budget_barbara',  'Budget Barbara',  '👑', 8720,  31, CURRENT_DATE,     'Budgeting',             'Kraków',  '50/30/20 fanatic. Paid off 40k PLN debt in 18 months.'),
('00000000-0000-0000-0000-000000000003','value_victor',    'Value Victor',    '💎', 11200, 55, CURRENT_DATE,     'Value Investing',       'Gdańsk',  'Buying great companies at fair prices since 2018. Buffett disciple.'),
('00000000-0000-0000-0000-000000000004','savings_queen',   'Savings Queen',   '🌟', 10800, 44, CURRENT_DATE,     'Savings Strategy',      'Wrocław', 'FIRE by 40 is the goal. Currently at 68% savings rate.'),
('00000000-0000-0000-0000-000000000005','crypto_king_pl',  'Crypto King',     '🔮', 9500,  38, CURRENT_DATE,     'DeFi & Crypto',         'Silesia', 'ETH maxi. Building on-chain since 2020. Not financial advice.'),

-- Experts (5k–10k XP)
('00000000-0000-0000-0000-000000000006','options_oscar',   'Options Oscar',   '🎯', 9100,  25, CURRENT_DATE,     'Options Trading',       'Warsaw',  'Theta gang. Selling covered calls since the pandemic dip.'),
('00000000-0000-0000-0000-000000000007','risk_rowan',      'Risk Rowan',      '⚖️', 8200,  30, CURRENT_DATE,     'Risk Management',       'Warsaw',  'Ex-bank quant. Now teaching others to manage their downside.'),
('00000000-0000-0000-0000-000000000008','interest_igor',   'Interest Igor',   '🏦', 7655,  28, CURRENT_DATE,     'Fixed Income',          'Silesia', 'Bonds are boring until they save your portfolio.'),
('00000000-0000-0000-0000-000000000009','crypto_carla',    'Crypto Carla',    '🦋', 7200,  18, CURRENT_DATE,     'Blockchain',            'Poznań',  'Smart contract dev by day, DeFi yield farmer by night.'),
('00000000-0000-0000-0000-000000000010','macro_magnus',    'Macro Magnus',    '📊', 6800,  22, CURRENT_DATE,     'Macro Economics',       'Łódź',    'Reading central bank tea leaves since 2015.'),
('00000000-0000-0000-0000-000000000011','fintech_fiona',   'FinTech Fiona',   '🚀', 6100,  19, CURRENT_DATE,     'FinTech',               'Kraków',  'Building the future of payments one API at a time.'),
('00000000-0000-0000-0000-000000000012','dividend_dana',   'Dividend Dana',   '💰', 5910,  15, CURRENT_DATE,     'Dividend Investing',    'Wrocław', 'Cash flow > capital gains. DRIP investor for 6 years.'),
('00000000-0000-0000-0000-000000000013','etf_eddie',       'ETF Eddie',       '📈', 5240,  12, CURRENT_DATE - 1, 'Index Investing',       'Warsaw',  'You cannot beat the market. Just join it. VTI & chill.'),

-- Pro (2k–5k XP)
('00000000-0000-0000-0000-000000000014','index_ivan',      'Index Ivan',      '🔑', 4680,  10, CURRENT_DATE - 1, 'Passive Investing',     'Gdańsk',  'Three-fund portfolio. No stock picking, no stress.'),
('00000000-0000-0000-0000-000000000015','tech_tina',       'Tech Tina',       '💻', 3900,   8, CURRENT_DATE,     'Tech Stocks',           'Warsaw',  'Software engineer who finally learned what her stock options mean.'),
('00000000-0000-0000-0000-000000000016','bond_betty',      'Bond Betty',      '📜', 4100,  11, CURRENT_DATE - 2, 'Bonds & Fixed Income',  'Poznań',  'Duration risk is real. Ask me how I know.'),
('00000000-0000-0000-0000-000000000017','piotr_k',         'Piotr Kowalski',  '🇵🇱', 3200,  7, CURRENT_DATE,    'Personal Finance',      'Warsaw',  'Just a regular guy trying to understand his pension.'),
('00000000-0000-0000-0000-000000000018','anna_w',          'Anna Wiśniewska', '🌿', 2800,   9, CURRENT_DATE - 1, 'ESG Investing',         'Kraków',  'Sustainable investing is not just a trend — it is the future.'),
('00000000-0000-0000-0000-000000000019','marek_n',         'Marek Nowak',     '🏗️', 4500,  13, CURRENT_DATE,    'Real Estate',           'Silesia', 'Two rental properties and counting. Leverage works.'),
('00000000-0000-0000-0000-000000000020','julia_d',         'Julia Dąbrowska', '🎭', 2100,   6, CURRENT_DATE - 3, 'Behavioral Finance',    'Warsaw',  'Why do smart people make dumb money decisions? I study that.'),
('00000000-0000-0000-0000-000000000021','tomasz_j',        'Tomasz Jankowski','🔭', 3700,  10, CURRENT_DATE - 1, 'Macro Analysis',        'Wrocław', 'Watching macro trends before they hit the mainstream.'),
('00000000-0000-0000-0000-000000000022','katarzyna_n',     'Katarzyna Nowak', '🌸', 2600,   8, CURRENT_DATE,     'Retirement Planning',   'Poznań',  'IKE + IKZE maxed every year since I started working.'),
('00000000-0000-0000-0000-000000000023','lukasz_w',        'Łukasz Wójcik',   '🏋️', 4200,  12, CURRENT_DATE - 1, 'Portfolio Management',  'Gdańsk',  'Asset allocation is everything. I rebalance quarterly.'),
('00000000-0000-0000-0000-000000000024','marta_k',         'Marta Kowalczyk', '🌊', 2900,   7, CURRENT_DATE - 2, 'Risk Hedging',          'Kraków',  'Options not for speculation — for protection.'),
('00000000-0000-0000-0000-000000000025','adam_l',          'Adam Lewandowski','⚡', 3500,   9, CURRENT_DATE,     'Crypto & DeFi',         'Warsaw',  'DeFi yield strategies that still work in a bear market.'),

-- Rising (500–2k XP)
('00000000-0000-0000-0000-000000000026','zofia_k',         'Zofia Kamińska',  '🌺', 1850,   5, CURRENT_DATE,     'Stock Basics',          'Warsaw',  'First year investor. Learning fast, making fewer mistakes.'),
('00000000-0000-0000-0000-000000000027','michal_b',        'Michał Błaszczyk','🎸', 1640,   4, CURRENT_DATE - 1, 'ETFs',                  'Kraków',  'Music producer by day, index fund investor by night.'),
('00000000-0000-0000-0000-000000000028','ewa_s',           'Ewa Szymańska',   '🦋', 1920,   6, CURRENT_DATE,     'Budgeting',             'Warsaw',  'Finally got my finances sorted after reading one good book.'),
('00000000-0000-0000-0000-000000000029','bartosz_w',       'Bartosz Wiśniak', '🛡️', 1200,   3, CURRENT_DATE - 2, 'Insurance & Safety',   'Gdańsk',  'Emergency fund first. Always.'),
('00000000-0000-0000-0000-000000000030','agnieszka_m',     'Agnieszka Malik', '🌙', 980,    4, CURRENT_DATE - 1, 'Crypto',                'Silesia', 'Bought ETH at the top, learned the lesson, now DCA every month.'),
('00000000-0000-0000-0000-000000000031','konrad_p',        'Konrad Pawlak',   '🎯', 1550,   5, CURRENT_DATE,     'Dividend Stocks',       'Warsaw',  'Building a dividend snowball, one share at a time.'),
('00000000-0000-0000-0000-000000000032','natalia_z',       'Natalia Zając',   '💡', 760,    3, CURRENT_DATE - 3, 'Personal Finance',      'Wrocław', 'Just started my investment journey. Loving every lesson.'),
('00000000-0000-0000-0000-000000000033','rafal_c',         'Rafał Czarnecki', '🦅', 1380,   4, CURRENT_DATE - 1, 'Technical Analysis',    'Warsaw',  'Charts tell stories. Learning to read them properly.'),
('00000000-0000-0000-0000-000000000034','monika_h',        'Monika Hernik',   '🌼', 890,    2, CURRENT_DATE - 4, 'Real Estate',           'Kraków',  'Saving for first apartment while learning about the market.'),
('00000000-0000-0000-0000-000000000035','sebastian_r',     'Sebastian Rybak', '🎲', 1710,   5, CURRENT_DATE,     'Options',               'Warsaw',  'Cautious options trader. Learned from expensive mistakes.'),
('00000000-0000-0000-0000-000000000036','paulina_d',       'Paulina Duda',    '🌈', 640,    2, CURRENT_DATE - 2, 'Sustainable Finance',   'Gdańsk',  'Voting with my portfolio for a better world.'),
('00000000-0000-0000-0000-000000000037','pawel_s',         'Paweł Sikorski',  '🏔️', 1450,   4, CURRENT_DATE - 1, 'Growth Investing',      'Poznań',  'Looking for 10-baggers. Most become 0.5-baggers. Learning.'),
('00000000-0000-0000-0000-000000000038','dominika_k',      'Dominika Krawczyk','🦁',1100,   3, CURRENT_DATE,     'Financial Planning',    'Warsaw',  'Certified financial planner helping young professionals.'),
('00000000-0000-0000-0000-000000000039','jakub_m',         'Jakub Mazur',     '⚙️', 820,    3, CURRENT_DATE - 2, 'Algorithmic Trading',  'Łódź',    'Engineer building my first trading bot. Results pending.'),
('00000000-0000-0000-0000-000000000040','aleksandra_w',    'Aleksandra Wróbel','🦚', 1270,   4, CURRENT_DATE - 1, 'Wealth Management',    'Kraków',  'Working at a family office and studying evenings.'),

-- Rookies (0–500 XP)
('00000000-0000-0000-0000-000000000041','filip_n',         'Filip Nowicki',   '🐣', 480,    2, CURRENT_DATE,     'Basics',                'Warsaw',  'Total beginner. Just got my first job and want to invest.'),
('00000000-0000-0000-0000-000000000042','oliwia_j',        'Oliwia Janowska', '🌱', 320,    1, CURRENT_DATE - 1, 'Basics',                'Kraków',  'University student learning about money for the first time.'),
('00000000-0000-0000-0000-000000000043','kamil_b',         'Kamil Baran',     '🐥', 150,    1, CURRENT_DATE - 3, 'Crypto',                'Warsaw',  'Got wrecked on shitcoins. Starting fresh with fundamentals.'),
('00000000-0000-0000-0000-000000000044','weronika_k',      'Weronika Kubiak', '🌻', 270,    2, CURRENT_DATE - 2, 'Savings',               'Wrocław', 'Finally have savings beyond my checking account.'),
('00000000-0000-0000-0000-000000000045','damian_o',        'Damian Olszewski','🔰', 90,     1, CURRENT_DATE - 5, 'Basics',                'Gdańsk',  'Day one. Let the education begin.'),
('00000000-0000-0000-0000-000000000046','sylwia_p',        'Sylwia Pietrzykowska','🌷',410,  2, CURRENT_DATE - 1, 'Personal Finance',     'Warsaw',  'Nurse learning to make my money work harder.'),
('00000000-0000-0000-0000-000000000047','grzegorz_k',      'Grzegorz Kaczmarek','🎮',220,   1, CURRENT_DATE - 4, 'Gaming & Finance',     'Poznań',  'Gamer realising that XP in real life matters too.'),
('00000000-0000-0000-0000-000000000048','klaudia_w',       'Klaudia Witkowska','🦋', 340,   1, CURRENT_DATE - 2, 'Basics',                'Silesia', 'High school teacher. Time to practice what I preach.'),
('00000000-0000-0000-0000-000000000049','rookie_investor', 'Rookie Investor', '🎩', 340,    3, CURRENT_DATE,     'Learning',              'Warsaw',  'Starting my financial journey. Every XP counts.'),
('00000000-0000-0000-0000-000000000050','penny_prudence',  'Penny Prudence',  '🪙', 820,    4, CURRENT_DATE - 1, 'Frugality',             'Kraków',  'Small amounts invested consistently beat big amounts invested occasionally.')
ON CONFLICT (id) DO NOTHING;

-- ── Org memberships ───────────────────────────────────────────────
INSERT INTO public.org_members (user_id, org_id, is_admin) VALUES
-- ETH Silesia members
('00000000-0000-0000-0000-000000000001', 'eth-silesia', false),
('00000000-0000-0000-0000-000000000005', 'eth-silesia', false),
('00000000-0000-0000-0000-000000000009', 'eth-silesia', false),
('00000000-0000-0000-0000-000000000011', 'eth-silesia', false),
('00000000-0000-0000-0000-000000000025', 'eth-silesia', false),
('00000000-0000-0000-0000-000000000030', 'eth-silesia', false),
('00000000-0000-0000-0000-000000000043', 'eth-silesia', false),
('00000000-0000-0000-0000-000000000049', 'eth-silesia', false),

-- PKO Bank members
('00000000-0000-0000-0000-000000000002', 'pko-bank', false),
('00000000-0000-0000-0000-000000000007', 'pko-bank', false),
('00000000-0000-0000-0000-000000000008', 'pko-bank', false),
('00000000-0000-0000-0000-000000000012', 'pko-bank', false),
('00000000-0000-0000-0000-000000000017', 'pko-bank', false),
('00000000-0000-0000-0000-000000000022', 'pko-bank', false),
('00000000-0000-0000-0000-000000000028', 'pko-bank', false),
('00000000-0000-0000-0000-000000000038', 'pko-bank', false),
('00000000-0000-0000-0000-000000000041', 'pko-bank', false),
('00000000-0000-0000-0000-000000000046', 'pko-bank', false),
('00000000-0000-0000-0000-000000000049', 'pko-bank', false),

-- Warsaw Uni members
('00000000-0000-0000-0000-000000000003', 'warsaw-uni', false),
('00000000-0000-0000-0000-000000000004', 'warsaw-uni', false),
('00000000-0000-0000-0000-000000000015', 'warsaw-uni', false),
('00000000-0000-0000-0000-000000000020', 'warsaw-uni', false),
('00000000-0000-0000-0000-000000000026', 'warsaw-uni', false),
('00000000-0000-0000-0000-000000000032', 'warsaw-uni', false),
('00000000-0000-0000-0000-000000000042', 'warsaw-uni', false),
('00000000-0000-0000-0000-000000000047', 'warsaw-uni', false),
('00000000-0000-0000-0000-000000000048', 'warsaw-uni', false),

-- FinTech Hub members
('00000000-0000-0000-0000-000000000006', 'fintech-hub', false),
('00000000-0000-0000-0000-000000000010', 'fintech-hub', false),
('00000000-0000-0000-0000-000000000011', 'fintech-hub', false),
('00000000-0000-0000-0000-000000000013', 'fintech-hub', false),
('00000000-0000-0000-0000-000000000014', 'fintech-hub', false),
('00000000-0000-0000-0000-000000000021', 'fintech-hub', false),
('00000000-0000-0000-0000-000000000033', 'fintech-hub', false),
('00000000-0000-0000-0000-000000000035', 'fintech-hub', false),
('00000000-0000-0000-0000-000000000039', 'fintech-hub', false),

-- Genesis DAO (private)
('00000000-0000-0000-0000-000000000001', 'genesis-dao', true),
('00000000-0000-0000-0000-000000000003', 'genesis-dao', false),
('00000000-0000-0000-0000-000000000005', 'genesis-dao', false),
('00000000-0000-0000-0000-000000000009', 'genesis-dao', false),
('00000000-0000-0000-0000-000000000025', 'genesis-dao', false),

-- Alpha Club (private)
('00000000-0000-0000-0000-000000000002', 'alpha-club', true),
('00000000-0000-0000-0000-000000000004', 'alpha-club', false),
('00000000-0000-0000-0000-000000000006', 'alpha-club', false),
('00000000-0000-0000-0000-000000000007', 'alpha-club', false)
ON CONFLICT (user_id, org_id) DO NOTHING;

-- ── Game results (sample — scripts/seed.ts generates the full set) ──
INSERT INTO public.game_results (user_id, game_type, xp_earned, score, total, created_at) VALUES
('00000000-0000-0000-0000-000000000001','quiz',     120, 5, 5, NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000001','decision', 320, 1, 1, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000001','swipe',    180, 8, 10, NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000001','fraud',    150, 6, 8, NOW() - INTERVAL '4 days'),
('00000000-0000-0000-0000-000000000002','quiz',     100, 4, 5, NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000002','swipe',    200, 10, 10, NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000003','decision', 280, 1, 1, NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000003','quiz',     150, 5, 5, NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000049','quiz',      80, 3, 5, NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000049','swipe',     60, 5, 10, NOW() - INTERVAL '2 days');

-- ── User badges ───────────────────────────────────────────────────
INSERT INTO public.user_badges (user_id, badge_id, earned_at) VALUES
-- Legends get many badges
('00000000-0000-0000-0000-000000000001','first_quiz',    NOW() - INTERVAL '200 days'),
('00000000-0000-0000-0000-000000000001','speed_reader',  NOW() - INTERVAL '180 days'),
('00000000-0000-0000-0000-000000000001','finance_101',   NOW() - INTERVAL '170 days'),
('00000000-0000-0000-0000-000000000001','xp_500',        NOW() - INTERVAL '150 days'),
('00000000-0000-0000-0000-000000000001','streak_7',      NOW() - INTERVAL '130 days'),
('00000000-0000-0000-0000-000000000001','xp_1000',       NOW() - INTERVAL '120 days'),
('00000000-0000-0000-0000-000000000001','perfect_round', NOW() - INTERVAL '100 days'),
('00000000-0000-0000-0000-000000000001','quiz_master',   NOW() - INTERVAL '90 days'),
('00000000-0000-0000-0000-000000000001','streak_30',     NOW() - INTERVAL '60 days'),
('00000000-0000-0000-0000-000000000001','xp_5000',       NOW() - INTERVAL '50 days'),
('00000000-0000-0000-0000-000000000001','top_100',       NOW() - INTERVAL '40 days'),
('00000000-0000-0000-0000-000000000001','xp_10000',      NOW() - INTERVAL '10 days'),
('00000000-0000-0000-0000-000000000001','top_10',        NOW() - INTERVAL '5 days'),

('00000000-0000-0000-0000-000000000002','first_quiz',    NOW() - INTERVAL '180 days'),
('00000000-0000-0000-0000-000000000002','finance_101',   NOW() - INTERVAL '160 days'),
('00000000-0000-0000-0000-000000000002','xp_500',        NOW() - INTERVAL '140 days'),
('00000000-0000-0000-0000-000000000002','streak_7',      NOW() - INTERVAL '120 days'),
('00000000-0000-0000-0000-000000000002','xp_1000',       NOW() - INTERVAL '100 days'),
('00000000-0000-0000-0000-000000000002','xp_5000',       NOW() - INTERVAL '60 days'),
('00000000-0000-0000-0000-000000000002','top_10',        NOW() - INTERVAL '20 days'),

-- Rookies get fewer badges
('00000000-0000-0000-0000-000000000049','first_quiz',    NOW() - INTERVAL '5 days'),
('00000000-0000-0000-0000-000000000049','finance_101',   NOW() - INTERVAL '3 days')
ON CONFLICT (user_id, badge_id) DO NOTHING;

-- ── News items ────────────────────────────────────────────────────
INSERT INTO public.news_items (headline, source, category) VALUES
  ('★ COMPOUND INTEREST: The secret banks hope you never discover',         'XP Gazette',   'education'),
  ('★ BUDGETING SPECIAL: The 50/30/20 rule explained in one cartoon',       'XP Gazette',   'education'),
  ('★ DAILY CHALLENGE UNLOCKED: Today''s financial puzzle is now live',     'XP Gazette',   'game'),
  ('★ PKO EXCLUSIVE: New savings rates — are you getting yours?',           'PKO Bank',     'partner'),
  ('★ STREAK ALERT: 847 players maintained a 7-day streak this week',       'XP Gazette',   'community'),
  ('★ FRAUD ALERT: Three new phishing schemes targeting Polish bank users',  'XP Gazette',   'security'),
  ('★ MARKET UPDATE: Warsaw Stock Exchange hits 3-month high this morning',  'WSE Report',   'markets'),
  ('★ NEW GAME MODE: Fraud Spotter challenge now available — test yourself', 'XP Gazette',   'game'),
  ('★ LEADERBOARD SHAKEUP: Compound Carl reclaims #1 spot after 42-day run','XP Gazette',   'community'),
  ('★ LEARNING PATH: Module 3 "Investing Basics" now unlocked for all users','XP Gazette',  'education');

-- ── Invite codes ──────────────────────────────────────────────────
INSERT INTO public.invite_codes (org_id, code, created_by, max_uses, active) VALUES
  ('genesis-dao', 'GENESIS',  '00000000-0000-0000-0000-000000000001', null, true),
  ('alpha-club',  'ALPHA23',  '00000000-0000-0000-0000-000000000002', 50,   true),
  ('eth-silesia', 'SILESIA24','00000000-0000-0000-0000-000000000001', 100,  true),
  ('pko-bank',    'PKO2025',  '00000000-0000-0000-0000-000000000007', 500,  true)
ON CONFLICT (code) DO NOTHING;

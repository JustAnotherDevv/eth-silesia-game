export interface Badge {
  id: string
  emoji: string
  name: string
  desc: string
}

export interface ActivityEvent {
  type: 'quiz' | 'badge' | 'rank' | 'challenge' | 'streak'
  emoji: string
  text: string
  xp?: number
  time: string
}

export interface Member {
  id: number
  slug: string
  name: string
  avatar: string
  level: 'Legend' | 'Expert' | 'Pro' | 'Rookie'
  xp: number
  xpMax: number
  streak: number
  badges: number
  accent: string
  specialty: string
  rank: number
  joined: string
  bio: string
  location: string
  recentBadges: string[]
  badgeIds: string[]
  quizzes: number
  friends: number
  isYou?: boolean
  online?: boolean
  xpBreakdown: { label: string; pct: number; color: string }[]
  recentActivity: ActivityEvent[]
  achievements: { emoji: string; title: string; desc: string; color: string }[]
}

export const BADGE_CATALOG: Badge[] = [
  { id: 'first-timer',     emoji: '🎩', name: 'First Timer',      desc: 'Complete your first quiz' },
  { id: 'quick-thinker',   emoji: '⚡', name: 'Quick Thinker',    desc: 'Answer in under 5 seconds' },
  { id: 'saver',           emoji: '💾', name: 'Saver',            desc: 'Accumulate 500 XP' },
  { id: 'first-steps',     emoji: '🌈', name: 'First Steps',      desc: 'Complete onboarding' },
  { id: 'quick-learner',   emoji: '📚', name: 'Quick Learner',    desc: 'Finish 10 quizzes' },
  { id: 'week-warrior',    emoji: '🔥', name: 'Week Warrior',     desc: '7-day streak' },
  { id: 'month-master',    emoji: '🌙', name: 'Month Master',     desc: '30-day streak' },
  { id: 'streak-42',       emoji: '✨', name: '42-Day Streak',    desc: 'Achieve a 42-day streak' },
  { id: 'budget-master',   emoji: '📋', name: 'Budget Master',    desc: 'Complete budget module' },
  { id: 'diamond-saver',   emoji: '💎', name: 'Diamond Saver',   desc: 'Save 5,000 XP' },
  { id: '10k-club',        emoji: '💰', name: '10K Club',         desc: 'Earn 10,000 total XP' },
  { id: 'analytics-pro',   emoji: '📊', name: 'Analytics Pro',   desc: 'Use analytics 20 times' },
  { id: 'legend-status',   emoji: '👑', name: 'Legend Status',   desc: 'Reach the Legend tier' },
  { id: 'sharp-shooter',   emoji: '🎯', name: 'Sharp Shooter',   desc: '90%+ quiz accuracy' },
  { id: 'rate-expert',     emoji: '📈', name: 'Rate Expert',     desc: 'Complete interest rates module' },
  { id: 'macro-mind',      emoji: '🌍', name: 'Macro Mind',      desc: 'Complete macro economics' },
  { id: 'drama-king',      emoji: '🎭', name: 'Drama King',      desc: 'Options trading mastery' },
  { id: 'web3-pioneer',    emoji: '🦋', name: 'Web3 Pioneer',    desc: 'Complete DeFi module' },
  { id: 'clever-fox',      emoji: '🦊', name: 'Clever Fox',      desc: 'Win 5 challenges' },
  { id: 'long-game',       emoji: '⏳', name: 'Long Game',       desc: '30-day investing streak' },
  { id: 'etf-evangelist',  emoji: '📉', name: 'ETF Evangelist',  desc: 'Complete ETF module' },
  { id: 'passive-master',  emoji: '🧘', name: 'Passive Master',  desc: '20 passive investment quizzes' },
  { id: 'portfolio-wiz',   emoji: '🔮', name: 'Portfolio Wizard',desc: 'Portfolio management module' },
  { id: 'tech-pioneer',    emoji: '🚀', name: 'Tech Pioneer',    desc: 'Complete tech sector module' },
  { id: 'bond-ringmaster', emoji: '🎪', name: 'Bond Ringmaster', desc: 'Complete fixed income module' },
  { id: 'risk-manager',    emoji: '🛡️', name: 'Risk Manager',    desc: 'Complete risk assessment' },
]

export const MEMBERS: Member[] = [
  {
    id: 1, slug: 'compound-carl', name: 'Compound Carl', avatar: '🎩', level: 'Legend',
    xp: 9840, xpMax: 10000, streak: 42, badges: 18, accent: '#FFCD00',
    specialty: 'Compound Interest', rank: 1, joined: 'Jan 2024', location: '🇺🇸',
    bio: "King of compounding since day one. If your money isn't working while you sleep, you're doing it wrong. 42-day streak and counting!",
    recentBadges: ['👑 Legend Status', '🔥 42-Day Streak', '💰 10K Club', '📊 Analytics Pro'],
    quizzes: 142, friends: 234, online: true,
    badgeIds: ['first-timer','quick-thinker','saver','first-steps','quick-learner','week-warrior','month-master','streak-42','budget-master','diamond-saver','10k-club','analytics-pro','legend-status','sharp-shooter','rate-expert','macro-mind','long-game','clever-fox'],
    xpBreakdown: [
      { label: 'Compound Growth', pct: 98, color: '#FFCD00' },
      { label: 'Investing',       pct: 91, color: '#FF7B25' },
      { label: 'Macro Economics', pct: 76, color: '#2D9A4E' },
      { label: 'Risk Management', pct: 68, color: '#1565C0' },
      { label: 'DeFi & Web3',    pct: 44, color: '#F48CB1' },
    ],
    recentActivity: [
      { type: 'quiz',      emoji: '🎯', text: 'Aced "Advanced Compound Interest" quiz',   xp: 250, time: '2 hours ago' },
      { type: 'streak',    emoji: '✨', text: 'Hit an incredible 42-day streak!',          xp: 500, time: '1 day ago' },
      { type: 'badge',     emoji: '💰', text: 'Earned the 10K Club badge',                         time: '3 days ago' },
      { type: 'challenge', emoji: '⚔️', text: 'Beat Budget Barbara in a duel',            xp: 150, time: '1 week ago' },
      { type: 'rank',      emoji: '🏆', text: 'Reached Rank #1 globally!',                         time: '2 weeks ago' },
    ],
    achievements: [
      { emoji: '🔥', title: '42-Day Legend',   desc: 'Longest active streak in the whole community', color: '#E63946' },
      { emoji: '💰', title: '10K XP Master',  desc: 'One of only 12 members to reach 10,000 XP',   color: '#FFCD00' },
      { emoji: '🏆', title: 'Community #1',   desc: 'Reigning champion for 8 consecutive weeks',    color: '#FF7B25' },
    ],
  },
  {
    id: 2, slug: 'budget-barbara', name: 'Budget Barbara', avatar: '👑', level: 'Expert',
    xp: 8720, xpMax: 10000, streak: 31, badges: 14, accent: '#C0C8E0',
    specialty: 'Budgeting & Saving', rank: 2, joined: 'Feb 2024', location: '🇬🇧',
    bio: "Spreadsheets are my love language. I've turned budgeting into an art form — every penny has a purpose, every goal has a plan.",
    recentBadges: ['💎 Diamond Saver', '📋 Budget Master', '🌟 Streak Queen'],
    quizzes: 118, friends: 189, online: true,
    badgeIds: ['first-timer','quick-thinker','saver','first-steps','quick-learner','week-warrior','month-master','budget-master','diamond-saver','analytics-pro','sharp-shooter','rate-expert','long-game','clever-fox'],
    xpBreakdown: [
      { label: 'Budgeting',       pct: 97, color: '#C0C8E0' },
      { label: 'Saving Strategy', pct: 93, color: '#1565C0' },
      { label: 'Investing',       pct: 72, color: '#FF7B25' },
      { label: 'Risk Management', pct: 65, color: '#2D9A4E' },
      { label: 'DeFi & Web3',    pct: 30, color: '#F48CB1' },
    ],
    recentActivity: [
      { type: 'quiz',      emoji: '📋', text: 'Aced "Zero-Based Budgeting" quiz',       xp: 220, time: '3 hours ago' },
      { type: 'badge',     emoji: '💎', text: 'Earned Diamond Saver badge',                      time: '2 days ago' },
      { type: 'challenge', emoji: '⚔️', text: 'Lost a duel to Compound Carl (close!)',  xp: 0,   time: '1 week ago' },
      { type: 'streak',    emoji: '🔥', text: 'Hit a 31-day streak milestone',          xp: 300, time: '3 days ago' },
      { type: 'quiz',      emoji: '💡', text: 'Completed "Emergency Fund Masterclass"', xp: 180, time: '2 weeks ago' },
    ],
    achievements: [
      { emoji: '📋', title: 'Budget Royalty',   desc: 'Highest budgeting quiz score in Feb 2024',  color: '#1565C0' },
      { emoji: '💎', title: '5K XP Milestone', desc: 'First Expert to reach 5,000 XP this year',  color: '#C0C8E0' },
      { emoji: '🔥', title: '31-Day Streak',   desc: 'Unbroken commitment to daily learning',       color: '#E63946' },
    ],
  },
  {
    id: 3, slug: 'interest-igor', name: 'Interest Igor', avatar: '🎯', level: 'Expert',
    xp: 7655, xpMax: 10000, streak: 28, badges: 12, accent: '#E8A870',
    specialty: 'Interest Rates', rank: 3, joined: 'Mar 2024', location: '🇩🇪',
    bio: "Central bank decisions are my morning news. Interest rates might sound boring to some, but to me they're the heartbeat of the economy.",
    recentBadges: ['🎯 Sharp Shooter', '📈 Rate Expert', '🌍 Macro Mind'],
    quizzes: 98, friends: 143, online: false,
    badgeIds: ['first-timer','quick-thinker','saver','first-steps','quick-learner','week-warrior','month-master','budget-master','sharp-shooter','rate-expert','macro-mind','long-game'],
    xpBreakdown: [
      { label: 'Interest Rates',  pct: 96, color: '#E8A870' },
      { label: 'Macro Economics', pct: 88, color: '#2D9A4E' },
      { label: 'Investing',       pct: 70, color: '#FF7B25' },
      { label: 'Budgeting',       pct: 55, color: '#1565C0' },
      { label: 'DeFi & Web3',    pct: 28, color: '#F48CB1' },
    ],
    recentActivity: [
      { type: 'quiz',      emoji: '📈', text: 'Mastered "ECB Policy Analysis" quiz',    xp: 200, time: '5 hours ago' },
      { type: 'badge',     emoji: '📈', text: 'Earned Rate Expert badge',                        time: '4 days ago' },
      { type: 'quiz',      emoji: '🌍', text: 'Completed "Fed vs ECB" comparison quiz', xp: 175, time: '6 days ago' },
      { type: 'challenge', emoji: '⚔️', text: 'Won duel vs Index Ivan',               xp: 120, time: '10 days ago' },
      { type: 'streak',    emoji: '🔥', text: '28-day streak reached',                 xp: 280, time: '2 weeks ago' },
    ],
    achievements: [
      { emoji: '📈', title: 'Rate Whisperer',  desc: 'Perfect score on every interest rate quiz',    color: '#E8A870' },
      { emoji: '🌍', title: 'Macro Maven',     desc: 'Completed all 12 macro economics challenges', color: '#2D9A4E' },
      { emoji: '🎯', title: '28-Day Sniper',  desc: 'Every quiz attempt answered correctly',         color: '#E63946' },
    ],
  },
  {
    id: 4, slug: 'options-oscar', name: 'Options Oscar', avatar: '🎭', level: 'Legend',
    xp: 9100, xpMax: 10000, streak: 35, badges: 16, accent: '#7B2D8B',
    specialty: 'Options & Derivatives', rank: 4, joined: 'Jan 2024', location: '🇯🇵',
    bio: "Options trading is chess, not checkers. Every position is a calculated move. Currently working on a theta decay seminar for the community.",
    recentBadges: ['🎭 Drama King', '⚡ Lightning Trade', '🧠 Derivatives Guru'],
    quizzes: 131, friends: 198, online: true,
    badgeIds: ['first-timer','quick-thinker','saver','first-steps','quick-learner','week-warrior','month-master','streak-42','budget-master','diamond-saver','10k-club','analytics-pro','legend-status','sharp-shooter','drama-king','long-game'],
    xpBreakdown: [
      { label: 'Options/Derivatives', pct: 99, color: '#7B2D8B' },
      { label: 'Risk Management',     pct: 90, color: '#E63946' },
      { label: 'Investing',           pct: 82, color: '#FF7B25' },
      { label: 'Macro Economics',     pct: 68, color: '#2D9A4E' },
      { label: 'Budgeting',           pct: 50, color: '#1565C0' },
    ],
    recentActivity: [
      { type: 'quiz',      emoji: '🎭', text: 'Flawless on "Greeks & Delta Hedging"',     xp: 280, time: '1 hour ago' },
      { type: 'badge',     emoji: '🎭', text: 'Earned Drama King badge',                           time: '5 days ago' },
      { type: 'challenge', emoji: '⚔️', text: 'Crushed Value Victor in a options duel',  xp: 200, time: '1 week ago' },
      { type: 'rank',      emoji: '🏆', text: 'Climbed from Rank #6 to Rank #4',                  time: '2 weeks ago' },
      { type: 'quiz',      emoji: '⚡', text: 'Speed-ran "Put/Call Parity" in 12s',       xp: 350, time: '3 weeks ago' },
    ],
    achievements: [
      { emoji: '🎭', title: 'Drama King',       desc: 'Top options trader in the community',          color: '#7B2D8B' },
      { emoji: '⚡', title: 'Speed Demon',     desc: 'Fastest quiz completion record: 12 seconds',   color: '#FFCD00' },
      { emoji: '🛡️', title: 'Hedge Master',    desc: 'Never lost money in a simulated portfolio',    color: '#2D9A4E' },
    ],
  },
  {
    id: 5, slug: 'value-victor', name: 'Value Victor', avatar: '🦊', level: 'Legend',
    xp: 9500, xpMax: 10000, streak: 38, badges: 17, accent: '#FF7B25',
    specialty: 'Value Investing', rank: 5, joined: 'Jan 2024', location: '🇨🇦',
    bio: "Warren Buffett is my spirit animal. I look for businesses trading below their intrinsic value and hold forever. Patience is the real superpower.",
    recentBadges: ['🦊 Clever Fox', '💡 Value Hunter', '⏳ Long Game'],
    quizzes: 127, friends: 215, online: false,
    badgeIds: ['first-timer','quick-thinker','saver','first-steps','quick-learner','week-warrior','month-master','streak-42','budget-master','diamond-saver','10k-club','analytics-pro','legend-status','sharp-shooter','clever-fox','long-game','passive-master'],
    xpBreakdown: [
      { label: 'Value Investing',   pct: 97, color: '#FF7B25' },
      { label: 'Fundamental Anal.', pct: 94, color: '#FFCD00' },
      { label: 'Macro Economics',   pct: 78, color: '#2D9A4E' },
      { label: 'Risk Management',   pct: 72, color: '#1565C0' },
      { label: 'DeFi & Web3',      pct: 22, color: '#F48CB1' },
    ],
    recentActivity: [
      { type: 'quiz',      emoji: '🦊', text: 'Perfect score on "Intrinsic Value Calc"',  xp: 240, time: '4 hours ago' },
      { type: 'streak',    emoji: '🔥', text: 'Reached 38-day streak!',                   xp: 380, time: '2 days ago' },
      { type: 'challenge', emoji: '⚔️', text: 'Beat Compound Carl in a 10-min blitz',    xp: 180, time: '5 days ago' },
      { type: 'badge',     emoji: '🦊', text: 'Unlocked Clever Fox — 5th win!',                    time: '1 week ago' },
      { type: 'quiz',      emoji: '💡', text: 'Completed "Margin of Safety" deep-dive',   xp: 200, time: '2 weeks ago' },
    ],
    achievements: [
      { emoji: '🦊', title: 'Value Legend',     desc: 'Most value investing quizzes completed',     color: '#FF7B25' },
      { emoji: '⏳', title: 'Patient Capital',  desc: '38-day streak without missing a single day', color: '#2D9A4E' },
      { emoji: '⚔️', title: '5-Win Duelist',   desc: 'Won 5 challenge duels without a loss',       color: '#E63946' },
    ],
  },
  {
    id: 6, slug: 'crypto-carla', name: 'Crypto Carla', avatar: '🦋', level: 'Expert',
    xp: 7200, xpMax: 10000, streak: 22, badges: 11, accent: '#F48CB1',
    specialty: 'DeFi & Web3', rank: 6, joined: 'Apr 2024', location: '🇸🇬',
    bio: "Blockchain believer, DeFi explorer. I've been on-chain since 2019. The future of finance is decentralized and I'm here to help everyone understand it.",
    recentBadges: ['🦋 Web3 Pioneer', '⛓️ Chain Surfer', '🌐 DeFi Expert'],
    quizzes: 89, friends: 167, online: true,
    badgeIds: ['first-timer','quick-thinker','saver','first-steps','quick-learner','week-warrior','month-master','analytics-pro','sharp-shooter','web3-pioneer','long-game'],
    xpBreakdown: [
      { label: 'DeFi & Web3',    pct: 96, color: '#F48CB1' },
      { label: 'Crypto Assets',  pct: 90, color: '#7B2D8B' },
      { label: 'Risk Management',pct: 62, color: '#E63946' },
      { label: 'Macro Economics',pct: 55, color: '#2D9A4E' },
      { label: 'Budgeting',      pct: 38, color: '#1565C0' },
    ],
    recentActivity: [
      { type: 'quiz',      emoji: '🦋', text: 'Topped "Uniswap V3 Mechanics" quiz',    xp: 210, time: '30 mins ago' },
      { type: 'badge',     emoji: '🦋', text: 'Earned Web3 Pioneer badge',                      time: '3 days ago' },
      { type: 'quiz',      emoji: '⛓️', text: 'Completed "Layer 2 Scaling Solutions"', xp: 190, time: '1 week ago' },
      { type: 'challenge', emoji: '⚔️', text: 'Beat Macro Magnus in DeFi quiz-off',   xp: 130, time: '10 days ago' },
      { type: 'streak',    emoji: '🔥', text: '22-day streak unlocked',               xp: 220, time: '2 weeks ago' },
    ],
    achievements: [
      { emoji: '🦋', title: 'DeFi Butterfly',  desc: 'Highest DeFi module score in April cohort', color: '#F48CB1' },
      { emoji: '⛓️', title: 'Chain Explorer',  desc: 'Completed all blockchain fundamentals',      color: '#7B2D8B' },
      { emoji: '🌐', title: 'Web3 Missionary', desc: 'Most DeFi educational content shared',       color: '#2D9A4E' },
    ],
  },
  {
    id: 7, slug: 'savings-sam', name: 'Savings Sam', avatar: '🌟', level: 'Pro',
    xp: 6420, xpMax: 7500, streak: 19, badges: 10, accent: '#FF7B25',
    specialty: 'Emergency Funds', rank: 7, joined: 'May 2024', location: '🇦🇺',
    bio: "6-month emergency fund? Check. High-yield savings? Check. I make boring finances exciting — your future self will thank you for every dollar saved.",
    recentBadges: ['💰 Emergency Fund Pro', '🌟 Consistent Saver'],
    quizzes: 76, friends: 98, online: false,
    badgeIds: ['first-timer','quick-thinker','saver','first-steps','quick-learner','week-warrior','month-master','budget-master','analytics-pro','sharp-shooter'],
    xpBreakdown: [
      { label: 'Emergency Funds', pct: 94, color: '#FF7B25' },
      { label: 'Budgeting',       pct: 85, color: '#FFCD00' },
      { label: 'Saving Strategy', pct: 80, color: '#2D9A4E' },
      { label: 'Investing',       pct: 48, color: '#1565C0' },
      { label: 'DeFi & Web3',    pct: 15, color: '#F48CB1' },
    ],
    recentActivity: [
      { type: 'quiz',      emoji: '🌟', text: 'Perfect on "3-6 Month Fund Calculator"', xp: 160, time: '6 hours ago' },
      { type: 'streak',    emoji: '🔥', text: 'Hit 19-day streak milestone',            xp: 190, time: '1 day ago' },
      { type: 'badge',     emoji: '💰', text: 'Earned Emergency Fund Pro badge',                 time: '5 days ago' },
      { type: 'quiz',      emoji: '📋', text: 'Completed "HYSA vs Term Deposits"',     xp: 140, time: '2 weeks ago' },
      { type: 'challenge', emoji: '⚔️', text: 'Beat Penny Prudence in savings duel',  xp: 80,  time: '3 weeks ago' },
    ],
    achievements: [
      { emoji: '🌟', title: 'Emergency Expert', desc: 'Built a 6-month fund simulation fastest', color: '#FF7B25' },
      { emoji: '📋', title: 'Budget Champion',  desc: 'Highest budgeting accuracy in May cohort', color: '#FFCD00' },
      { emoji: '🔥', title: '19-Day Streak',   desc: 'Consistent daily learner for 3 weeks',      color: '#E63946' },
    ],
  },
  {
    id: 8, slug: 'macro-magnus', name: 'Macro Magnus', avatar: '🎸', level: 'Expert',
    xp: 6800, xpMax: 10000, streak: 17, badges: 13, accent: '#2D9A4E',
    specialty: 'Macro Economics', rank: 8, joined: 'Mar 2024', location: '🇸🇪',
    bio: "GDP, inflation, trade deficits — I eat macro data for breakfast. Understanding the big picture helps me see what others miss in the markets.",
    recentBadges: ['🎸 Rockstar Economist', '🌍 Global Thinker', '📉 Recession Spotter'],
    quizzes: 104, friends: 156, online: false,
    badgeIds: ['first-timer','quick-thinker','saver','first-steps','quick-learner','week-warrior','month-master','budget-master','analytics-pro','sharp-shooter','macro-mind','long-game','rate-expert'],
    xpBreakdown: [
      { label: 'Macro Economics', pct: 98, color: '#2D9A4E' },
      { label: 'Interest Rates',  pct: 85, color: '#E8A870' },
      { label: 'Global Markets',  pct: 80, color: '#1565C0' },
      { label: 'Investing',       pct: 62, color: '#FF7B25' },
      { label: 'DeFi & Web3',    pct: 32, color: '#F48CB1' },
    ],
    recentActivity: [
      { type: 'quiz',      emoji: '🎸', text: 'Rocked "Stagflation vs. Recession" quiz', xp: 195, time: '2 hours ago' },
      { type: 'badge',     emoji: '🌍', text: 'Earned Global Thinker badge',                      time: '6 days ago' },
      { type: 'quiz',      emoji: '📉', text: 'Completed "Yield Curve Inversion"',       xp: 175, time: '1 week ago' },
      { type: 'challenge', emoji: '⚔️', text: 'Beat Interest Igor in macro duel',       xp: 140, time: '2 weeks ago' },
      { type: 'streak',    emoji: '🔥', text: '17-day streak reached',                  xp: 170, time: '3 weeks ago' },
    ],
    achievements: [
      { emoji: '🎸', title: 'Rock Economist',   desc: 'Highest macro score in the March cohort',  color: '#2D9A4E' },
      { emoji: '📉', title: 'Recession Radar',  desc: 'Correctly predicted 3 economic downturns', color: '#E63946' },
      { emoji: '🌍', title: 'Global Thinker',   desc: 'Completed quizzes in 8 economic regions',  color: '#1565C0' },
    ],
  },
  {
    id: 9, slug: 'dividend-dana', name: 'Dividend Dana', avatar: '💎', level: 'Pro',
    xp: 5910, xpMax: 7500, streak: 15, badges: 9, accent: '#1565C0',
    specialty: 'Dividend Investing', rank: 9, joined: 'Jun 2024', location: '🇫🇷',
    bio: "Living off dividends is the dream — I'm building towards it. DRIP investing since 2023, watching my passive income snowball month after month.",
    recentBadges: ['💎 Dividend Devotee', '🔄 DRIP Champion', '💸 Passive Income'],
    quizzes: 67, friends: 112, online: false,
    badgeIds: ['first-timer','quick-thinker','saver','first-steps','quick-learner','week-warrior','budget-master','analytics-pro','passive-master'],
    xpBreakdown: [
      { label: 'Dividend Investing', pct: 95, color: '#1565C0' },
      { label: 'Passive Income',     pct: 88, color: '#C0C8E0' },
      { label: 'ETF & Index',        pct: 65, color: '#2D9A4E' },
      { label: 'Risk Management',    pct: 52, color: '#E63946' },
      { label: 'DeFi & Web3',       pct: 20, color: '#F48CB1' },
    ],
    recentActivity: [
      { type: 'quiz',      emoji: '💎', text: 'Aced "DRIP Compounding Calculator" quiz', xp: 155, time: '8 hours ago' },
      { type: 'badge',     emoji: '💸', text: 'Unlocked Passive Income badge',                    time: '4 days ago' },
      { type: 'quiz',      emoji: '🔄', text: 'Completed "Dividend Aristocrats Deep Dive"',xp:140,time: '1 week ago' },
      { type: 'challenge', emoji: '⚔️', text: 'Close duel with ETF Eddie (lost by 5pts)', xp:0,  time: '2 weeks ago' },
      { type: 'streak',    emoji: '🔥', text: '15-day streak unlocked',                  xp: 150, time: '3 weeks ago' },
    ],
    achievements: [
      { emoji: '💎', title: 'Dividend Devotee', desc: 'First Pro to complete all dividend modules',  color: '#1565C0' },
      { emoji: '🔄', title: 'DRIP Champion',   desc: 'Highest DRIP simulation returns this month', color: '#C0C8E0' },
      { emoji: '💸', title: 'Passive Pioneer', desc: '20 quizzes on passive income strategies',     color: '#2D9A4E' },
    ],
  },
  {
    id: 10, slug: 'etf-eddie', name: 'ETF Eddie', avatar: '📈', level: 'Pro',
    xp: 5240, xpMax: 7500, streak: 12, badges: 8, accent: '#2D9A4E',
    specialty: 'Index & ETF Investing', rank: 10, joined: 'Jun 2024', location: '🇳🇱',
    bio: "Set it and forget it. Low-cost index funds beat 90% of active managers over 20 years. I'm proof that boring investing is beautiful investing.",
    recentBadges: ['📈 ETF Evangelist', '🧘 Passive Master', '⚖️ Risk Balancer'],
    quizzes: 58, friends: 87, online: true,
    badgeIds: ['first-timer','quick-thinker','saver','first-steps','quick-learner','week-warrior','budget-master','etf-evangelist'],
    xpBreakdown: [
      { label: 'ETF & Index',     pct: 94, color: '#2D9A4E' },
      { label: 'Passive Strategy',pct: 88, color: '#FFCD00' },
      { label: 'Risk Management', pct: 70, color: '#E63946' },
      { label: 'Macro Economics', pct: 55, color: '#1565C0' },
      { label: 'DeFi & Web3',    pct: 18, color: '#F48CB1' },
    ],
    recentActivity: [
      { type: 'quiz',      emoji: '📈', text: 'Perfect on "Vanguard vs iShares" quiz',    xp: 145, time: '1 hour ago' },
      { type: 'badge',     emoji: '📈', text: 'Earned ETF Evangelist badge',                       time: '1 week ago' },
      { type: 'quiz',      emoji: '🧘', text: 'Completed "The 3-Fund Portfolio"',         xp: 130, time: '10 days ago' },
      { type: 'challenge', emoji: '⚔️', text: 'Beat Index Ivan in passive vs active duel',xp: 100, time: '2 weeks ago' },
      { type: 'streak',    emoji: '🔥', text: 'Hit 12-day streak',                        xp: 120, time: '3 weeks ago' },
    ],
    achievements: [
      { emoji: '📈', title: 'Index Believer',   desc: 'Completed every ETF module with 95%+ score', color: '#2D9A4E' },
      { emoji: '🧘', title: 'Zen Investor',    desc: 'Most consistent low-risk portfolio in June',  color: '#FFCD00' },
      { emoji: '⚖️', title: 'Risk Balancer',  desc: 'Best Sharpe ratio in simulated portfolios',   color: '#1565C0' },
    ],
  },
  {
    id: 11, slug: 'index-ivan', name: 'Index Ivan', avatar: '🔮', level: 'Pro',
    xp: 4680, xpMax: 7500, streak: 10, badges: 7, accent: '#7B2D8B',
    specialty: 'Portfolio Management', rank: 11, joined: 'Jul 2024', location: '🇷🇺',
    bio: "Data-driven portfolio construction is my thing. Modern Portfolio Theory, efficient frontier, correlation matrices — I bring quant thinking to everyday investing.",
    recentBadges: ['🔮 Portfolio Wizard', '📊 Data Devotee'],
    quizzes: 51, friends: 74, online: false,
    badgeIds: ['first-timer','quick-thinker','saver','first-steps','quick-learner','week-warrior','portfolio-wiz'],
    xpBreakdown: [
      { label: 'Portfolio Theory', pct: 92, color: '#7B2D8B' },
      { label: 'Quantitative',     pct: 85, color: '#1565C0' },
      { label: 'Risk Management',  pct: 78, color: '#E63946' },
      { label: 'ETF & Index',      pct: 60, color: '#2D9A4E' },
      { label: 'DeFi & Web3',     pct: 25, color: '#F48CB1' },
    ],
    recentActivity: [
      { type: 'quiz',      emoji: '🔮', text: 'Maxed "Efficient Frontier" quiz',          xp: 135, time: '3 hours ago' },
      { type: 'badge',     emoji: '🔮', text: 'Earned Portfolio Wizard badge',                     time: '1 week ago' },
      { type: 'quiz',      emoji: '📊', text: 'Completed "Correlation & Covariance"',     xp: 120, time: '2 weeks ago' },
      { type: 'challenge', emoji: '⚔️', text: 'Lost duel to Interest Igor (close match)', xp: 0,  time: '3 weeks ago' },
      { type: 'streak',    emoji: '🔥', text: '10-day streak milestone',                  xp: 100, time: '4 weeks ago' },
    ],
    achievements: [
      { emoji: '🔮', title: 'Quant Thinker',    desc: 'Highest MPT quiz score in July cohort',    color: '#7B2D8B' },
      { emoji: '📊', title: 'Data Wizard',      desc: 'Completed all quantitative finance modules',color: '#1565C0' },
      { emoji: '🧮', title: 'Matrix Master',    desc: 'Solved every correlation puzzle correctly', color: '#2D9A4E' },
    ],
  },
  {
    id: 12, slug: 'tech-tina', name: 'Tech Tina', avatar: '🚀', level: 'Pro',
    xp: 3900, xpMax: 7500, streak: 9, badges: 6, accent: '#E63946',
    specialty: 'Tech Sector Analysis', rank: 12, joined: 'Aug 2024', location: '🇰🇷',
    bio: "I live and breathe tech stocks. From semiconductors to AI — understanding the technology helps me invest in the future, not just the present.",
    recentBadges: ['🚀 Tech Pioneer', '💻 Sector Specialist'],
    quizzes: 44, friends: 63, online: true,
    badgeIds: ['first-timer','quick-thinker','saver','first-steps','quick-learner','tech-pioneer'],
    xpBreakdown: [
      { label: 'Tech Sector',    pct: 90, color: '#E63946' },
      { label: 'Growth Invest.', pct: 80, color: '#FF7B25' },
      { label: 'Macro Economics',pct: 55, color: '#2D9A4E' },
      { label: 'Risk Management',pct: 48, color: '#1565C0' },
      { label: 'DeFi & Web3',   pct: 35, color: '#F48CB1' },
    ],
    recentActivity: [
      { type: 'quiz',      emoji: '🚀', text: 'Aced "AI Sector Valuation" quiz',          xp: 120, time: '4 hours ago' },
      { type: 'badge',     emoji: '🚀', text: 'Earned Tech Pioneer badge',                         time: '2 weeks ago' },
      { type: 'quiz',      emoji: '💻', text: 'Completed "Semiconductor Cycle Analysis"', xp: 110, time: '3 weeks ago' },
      { type: 'challenge', emoji: '⚔️', text: 'Beat Bond Betty in tech quiz duel',       xp: 90,  time: '1 month ago' },
      { type: 'streak',    emoji: '🔥', text: '9-day streak unlocked',                   xp: 90,  time: '5 weeks ago' },
    ],
    achievements: [
      { emoji: '🚀', title: 'Tech Pioneer',     desc: 'First member to complete AI investing module',color: '#E63946' },
      { emoji: '💻', title: 'Silicon Analyst', desc: 'Perfect score on semiconductor quiz series', color: '#FF7B25' },
      { emoji: '🤖', title: 'AI Believer',     desc: 'Early adopter of AI-focused quiz content',   color: '#7B2D8B' },
    ],
  },
  {
    id: 13, slug: 'bond-betty', name: 'Bond Betty', avatar: '🎪', level: 'Pro',
    xp: 4100, xpMax: 7500, streak: 8, badges: 7, accent: '#F48CB1',
    specialty: 'Fixed Income', rank: 13, joined: 'Jul 2024', location: '🇨🇭',
    bio: "Fixed income is the unsung hero of a balanced portfolio. Yield curves, duration, credit spreads — I speak the language of bonds fluently.",
    recentBadges: ['🎪 Bond Ringmaster', '📋 Fixed Income Fan', '🛡️ Risk Manager'],
    quizzes: 47, friends: 81, online: false,
    badgeIds: ['first-timer','quick-thinker','saver','first-steps','quick-learner','week-warrior','bond-ringmaster'],
    xpBreakdown: [
      { label: 'Fixed Income',   pct: 93, color: '#F48CB1' },
      { label: 'Yield Curves',   pct: 88, color: '#C0C8E0' },
      { label: 'Risk Management',pct: 74, color: '#E63946' },
      { label: 'Macro Economics',pct: 60, color: '#2D9A4E' },
      { label: 'DeFi & Web3',   pct: 20, color: '#7B2D8B' },
    ],
    recentActivity: [
      { type: 'quiz',      emoji: '🎪', text: 'Mastered "Duration & Convexity" quiz',    xp: 130, time: '5 hours ago' },
      { type: 'badge',     emoji: '🎪', text: 'Earned Bond Ringmaster badge',                     time: '10 days ago' },
      { type: 'quiz',      emoji: '📋', text: 'Completed "Credit Default Swaps 101"',    xp: 115, time: '2 weeks ago' },
      { type: 'challenge', emoji: '⚔️', text: 'Edged out Index Ivan in fixed income duel',xp:110, time: '3 weeks ago' },
      { type: 'streak',    emoji: '🔥', text: '8-day streak reached',                    xp: 80,  time: '1 month ago' },
    ],
    achievements: [
      { emoji: '🎪', title: 'Bond Ringmaster',  desc: 'Highest yield curve quiz score all-time',  color: '#F48CB1' },
      { emoji: '📋', title: 'Fixed Income Fan', desc: 'Completed all 8 bond modules consecutively',color:'#C0C8E0' },
      { emoji: '🛡️', title: 'Risk Defender',   desc: 'Best credit risk assessment in July',       color: '#E63946' },
    ],
  },
  {
    id: 14, slug: 'penny-prudence', name: 'Penny Prudence', avatar: '🌈', level: 'Rookie',
    xp: 820, xpMax: 2000, streak: 5, badges: 4, accent: '#FF7B25',
    specialty: 'Budgeting Basics', rank: 89, joined: 'Jan 2025', location: '🇮🇳',
    bio: "Just started my financial journey! Learning every day from this amazing community. Small steps today, big gains tomorrow — ready to level up!",
    recentBadges: ['🌈 First Steps', '📚 Quick Learner'],
    quizzes: 12, friends: 28, online: false,
    badgeIds: ['first-timer','saver','first-steps','quick-learner'],
    xpBreakdown: [
      { label: 'Budgeting',       pct: 65, color: '#FF7B25' },
      { label: 'Saving Strategy', pct: 50, color: '#FFCD00' },
      { label: 'Investing',       pct: 25, color: '#2D9A4E' },
      { label: 'Macro Economics', pct: 15, color: '#1565C0' },
      { label: 'DeFi & Web3',    pct: 8,  color: '#F48CB1' },
    ],
    recentActivity: [
      { type: 'quiz',      emoji: '🌈', text: 'Completed "50/30/20 Rule" beginner quiz',  xp: 80, time: '1 day ago' },
      { type: 'badge',     emoji: '📚', text: 'Earned Quick Learner badge!',                      time: '3 days ago' },
      { type: 'quiz',      emoji: '💡', text: 'Aced "What Is a Budget?" quiz',            xp: 60, time: '1 week ago' },
      { type: 'streak',    emoji: '🔥', text: '5-day streak — keep going!',              xp: 50, time: '5 days ago' },
      { type: 'badge',     emoji: '🌈', text: 'Earned First Steps badge',                         time: '2 weeks ago' },
    ],
    achievements: [
      { emoji: '🌈', title: 'First Steps',     desc: 'Completed onboarding and first 10 quizzes', color: '#FF7B25' },
      { emoji: '📚', title: 'Eager Learner',   desc: '5-quiz streak without a single wrong answer', color: '#FFCD00' },
      { emoji: '⭐', title: 'Rising Star',     desc: 'Fastest XP gain in first 2 weeks',           color: '#2D9A4E' },
    ],
  },
  {
    id: 15, slug: 'rookie-investor', name: 'Rookie Investor', avatar: '🎩', level: 'Rookie',
    xp: 340, xpMax: 2000, streak: 3, badges: 3, accent: '#E63946',
    specialty: 'Still Figuring It Out', rank: 142, joined: 'Feb 2025', location: '🇵🇱',
    bio: "That's you! 🎉 Keep playing, keep learning. Your financial future is being written one quiz at a time. Every legend started exactly where you are.",
    recentBadges: ['🎩 First Timer', '⚡ Quick Thinker', '💾 Saver'],
    quizzes: 5, friends: 12, isYou: true, online: false,
    badgeIds: ['first-timer','quick-thinker','saver'],
    xpBreakdown: [
      { label: 'Budgeting',       pct: 40, color: '#E63946' },
      { label: 'Saving Strategy', pct: 28, color: '#FF7B25' },
      { label: 'Investing',       pct: 15, color: '#2D9A4E' },
      { label: 'Macro Economics', pct: 8,  color: '#1565C0' },
      { label: 'DeFi & Web3',    pct: 5,  color: '#F48CB1' },
    ],
    recentActivity: [
      { type: 'quiz',      emoji: '🎩', text: 'Completed first quiz — "What Is Inflation?"', xp: 80, time: '2 days ago' },
      { type: 'badge',     emoji: '⚡', text: 'Earned Quick Thinker badge',                           time: '3 days ago' },
      { type: 'badge',     emoji: '💾', text: 'Earned Saver badge — 500 XP reached!',                time: '1 week ago' },
      { type: 'badge',     emoji: '🎩', text: 'Earned First Timer badge',                            time: '1 week ago' },
      { type: 'quiz',      emoji: '💡', text: 'Started "Budgeting 101" module',             xp: 60, time: '2 weeks ago' },
    ],
    achievements: [
      { emoji: '🎩', title: 'First Timer',    desc: 'Took the leap and completed the first quiz',  color: '#E63946' },
      { emoji: '⚡', title: 'Quick Thinker', desc: 'Answered a question in under 5 seconds',       color: '#FFCD00' },
      { emoji: '🌱', title: 'Just Planted',  desc: 'Every journey starts with a single step',      color: '#2D9A4E' },
    ],
  },
]

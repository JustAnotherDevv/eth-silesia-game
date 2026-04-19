// Home-page copy per white-label theme.

import type { OrgTheme } from '../contexts/OrgContext'

export interface GameMode {
  tag: string
  kicker: string
  headline: string
  body: string
  emoji: string
  accent: string
  cta: string
  href: string
}

export interface GameModeCompact {
  tag: string
  kicker: string
  headline: string
  emoji: string
  accent: string
  xp: string
  href: string
}

export interface SpreadMeta {
  label: string
  headline: string
  subhead: string
}

export interface HomeContent {
  mastheadSubtitle: string
  sectionNav: string[]
  ticker: string[]
  hero: {
    eyebrow: string
    headline: string
    dropCapLetter: string
    dropCapRest: string
    emoji: string
    ctaLabel: string
    ctaHref: string
    meta: string
  }
  gameModesFull: GameMode[]
  gameModesCompact: GameModeCompact[]
  streak: {
    headline: string
    bodyTemplate: string // contains {streak}
    tipTitle: string
    tipHtml: string
  }
  backCover: {
    emoji: string
    headline: string
    body: string
    cta: string
    ctaHref: string
    poweredBy: string
    tagline: string
  }
  forecast: {
    label: string
    body: string
  }
  spreads: [SpreadMeta, SpreadMeta, SpreadMeta]
}

const FINANCE_CONTENT: HomeContent = {
  mastheadSubtitle: '"All The Financial News Fit To Play"',
  sectionNav: ['Savings', 'Budgeting', 'Investing', 'Loans', 'Challenges'],
  ticker: [
    '★ COMPOUND INTEREST: The secret banks hope you never discover',
    '★ BUDGETING SPECIAL: The 50/30/20 rule explained in one cartoon',
    "★ DAILY CHALLENGE UNLOCKED: Today's financial puzzle is now live",
    '★ SAVINGS SPECIAL: New rates — are you getting yours?',
    '★ STREAK ALERT: 847 players maintained a 7-day streak this week',
  ],
  hero: {
    eyebrow: "Today's Feature Story",
    headline: 'Compound Interest: The Villain Banks Hope You Never Discover',
    dropCapLetter: 'I',
    dropCapRest:
      'n a shocking exposé rocking the financial world, local experts confirmed what savvy investors long suspected: compound interest, when working <em>for</em> you, is the closest thing to a legal money-printing machine. When working <em>against</em> you, however…',
    emoji: '🪙',
    ctaLabel: 'Read Full Story →',
    ctaHref: '/quiz',
    meta: '5 min read · +120 XP',
  },
  gameModesFull: [
    { tag: 'QUICK ROUNDS',  kicker: 'TEST YOUR KNOWLEDGE', headline: 'Are You Smarter Than Your Bank Manager?',            body: 'Five rapid-fire questions. Thirty seconds each. Your financial IQ is about to be revealed.',             emoji: '🎯', accent: '#FFCD00', cta: 'Start Quiz →',    href: '/quiz' },
    { tag: 'DECISION ROOM', kicker: 'EXCLUSIVE SCENARIO',  headline: 'Young Investor Faces Impossible Choice',             body: 'One scenario. Multiple paths. Real consequences. Enter the Decision Room and choose wisely.',          emoji: '🎲', accent: '#E63946', cta: 'Enter Room →',    href: '/decision' },
    { tag: 'CARTOON EPISODE', kicker: 'STORY-BASED LEARNING', headline: "Can You Survive the Financial Jungle Without Going Broke?", body: "Choose your character. Face real-life money dilemmas. Every choice matters — and your wallet feels it.", emoji: '🎬', accent: '#FF7B25', cta: 'Watch Episode →', href: '/episode' },
  ],
  gameModesCompact: [
    { tag: 'QUICK ROUNDS', kicker: 'KNOWLEDGE TEST', headline: 'Are You Smarter Than Your Bank Manager?', emoji: '🎯', accent: '#FFCD00', xp: '+80 XP', href: '/quiz' },
    { tag: 'DECISION ROOM', kicker: 'SCENARIO', headline: 'Young Investor Faces Choice That Could Change Everything', emoji: '🎲', accent: '#E63946', xp: '+150 XP', href: '/decision' },
    { tag: 'CARTOON EPISODE', kicker: 'STORY GAME', headline: 'Can You Survive the Financial Jungle Without Going Broke?', emoji: '🎬', accent: '#FF7B25', xp: '+200 XP', href: '/episode' },
  ],
  streak: {
    headline: "The 30-Day Challenge That Changed One Investor's Life",
    bodyTemplate: 'One challenge per day keeps financial ignorance at bay. Your {streak}-day streak is on the line.',
    tipTitle: "Today's Tip",
    tipHtml: '🎓 <strong>The 1% Rule:</strong> Improving your financial knowledge by just 1% per day compounds into a 37× improvement over a year.',
  },
  backCover: {
    emoji: '🎩',
    headline: 'Ready to Become a Financial Genius?',
    body: "Knowly isn't just a newspaper — it's your daily training ground for financial mastery. Play. Learn. Level up.",
    cta: 'Start Playing Now →',
    ctaHref: '/quiz',
    poweredBy: 'Powered by PKO Bank Polski',
    tagline: '"Your financial future, gamified."',
  },
  forecast: {
    label: 'Financial Forecast',
    body: '☀️ Sunny with a chance of <strong>compound gains</strong>. Umbrella advised for unsecured loans.',
  },
  spreads: [
    {
      label: 'Front Page',
      headline: 'Compound Interest Scandal Rocks The Entire Banking World',
      subhead: 'Local experts reveal the truth behind the most powerful force in all of finance',
    },
    {
      label: 'Game Modes',
      headline: 'Two New Challenges Added To Knowly This Week',
      subhead: 'Test your knowledge in Quick Rounds, or face moral dilemmas in the Decision Room',
    },
    {
      label: 'Achievements',
      headline: 'Local Investor Earns Three Badges In A Single Session',
      subhead: 'How consistent daily practice turned one beginner into a certified financial thinker',
    },
  ],
}

const LEGAL_CONTENT: HomeContent = {
  mastheadSubtitle: '"All The Consumer Rights News Fit To Play"',
  sectionNav: ['Data', 'Banking', 'Credit', 'Crypto', 'Disputes'],
  ticker: [
    '★ GDPR SHOCK: EU regulator fines Big Tech €390M for cookie consent abuse',
    '★ PSD2 ALERT: You have 13 months to dispute a card fraud — not 48 hours',
    "★ DAILY CHALLENGE UNLOCKED: Today's rights puzzle is now live",
    '★ MiCA LIVE: New crypto rules — what every holder needs to know',
    '★ STREAK ALERT: 847 players maintained a 7-day streak this week',
  ],
  hero: {
    eyebrow: "Today's Feature Story",
    headline: 'Is Your Bank Secretly Breaking GDPR? The Clauses They Hope You Never Read',
    dropCapLetter: 'E',
    dropCapRest:
      'U regulators confirmed what consumer advocates long suspected: most standard banking T&Cs contain terms that quietly waive your rights. Article 15 guarantees data access in 30 days. Article 17 gives you the right to be forgotten. When you know the law, <em>you</em> hold the pen…',
    emoji: '⚖️',
    ctaLabel: 'Read Full Story →',
    ctaHref: '/quiz',
    meta: '5 min read · +120 XP',
  },
  gameModesFull: [
    { tag: 'RIGHTS ROUNDS',  kicker: 'TEST YOUR KNOWLEDGE', headline: 'Do You Actually Know Your Consumer Rights?',         body: 'Five rapid-fire questions on GDPR, PSD2, and the law banks hope you never read. Thirty seconds each.',    emoji: '⚖️', accent: '#FFCD00', cta: 'Start Quiz →',    href: '/quiz' },
    { tag: 'DECISION ROOM', kicker: 'EXCLUSIVE SCENARIO',  headline: 'Consumer Faces Fraudulent Charge — What Would You Do?', body: 'One dispute. Multiple paths. Real legal consequences. Enter the Decision Room and choose wisely.',      emoji: '🎲', accent: '#E63946', cta: 'Enter Room →',    href: '/decision' },
    { tag: 'CARTOON EPISODE', kicker: 'STORY-BASED LEARNING', headline: 'Can You Win a Chargeback Without Hiring a Lawyer?',      body: "Choose your character. Face real-life legal dilemmas. Every clause matters — and your rights depend on it.", emoji: '🎬', accent: '#FF7B25', cta: 'Watch Episode →', href: '/episode' },
  ],
  gameModesCompact: [
    { tag: 'RIGHTS ROUNDS', kicker: 'KNOWLEDGE TEST', headline: 'Do You Actually Know Your Consumer Rights?', emoji: '⚖️', accent: '#FFCD00', xp: '+80 XP', href: '/quiz' },
    { tag: 'DECISION ROOM', kicker: 'SCENARIO', headline: 'Consumer Faces Fraudulent Charge — What Would You Do?', emoji: '🎲', accent: '#E63946', xp: '+150 XP', href: '/decision' },
    { tag: 'CARTOON EPISODE', kicker: 'STORY GAME', headline: 'Can You Win a Chargeback Without Hiring a Lawyer?', emoji: '🎬', accent: '#FF7B25', xp: '+200 XP', href: '/episode' },
  ],
  streak: {
    headline: "The 30-Day Rights Challenge That Changed One Consumer's Life",
    bodyTemplate: 'One challenge per day keeps legal blind spots at bay. Your {streak}-day streak is on the line.',
    tipTitle: "Today's Tip",
    tipHtml: '⚖️ <strong>The 13-Month Rule:</strong> PSD2 gives you 13 months — not 48 hours — to dispute an unauthorised card transaction. Any shorter deadline in your bank\'s T&Cs is unenforceable.',
  },
  backCover: {
    emoji: '⚖️',
    headline: 'Ready to Master Your Consumer Rights?',
    body: "Knowly isn't just a newspaper — it's your daily training ground for legal literacy. Play. Learn. Know your rights.",
    cta: 'Start Playing Now →',
    ctaHref: '/quiz',
    poweredBy: 'Powered by ETHLegal',
    tagline: '"Your consumer rights, gamified."',
  },
  forecast: {
    label: 'Legal Forecast',
    body: '⚖️ Clear skies with a strong <strong>right-to-erasure</strong> breeze. Bank T&Cs advised to take shelter.',
  },
  spreads: [
    {
      label: 'Front Page',
      headline: 'GDPR Scandal Rocks Banking — Your Rights You Never Knew You Had',
      subhead: 'Consumer advocates reveal the clauses banks hope you never read',
    },
    {
      label: 'Game Modes',
      headline: 'Two New Rights Challenges Added To Knowly This Week',
      subhead: 'Test your knowledge in Rights Rounds, or face legal dilemmas in the Decision Room',
    },
    {
      label: 'Achievements',
      headline: 'Local Consumer Earns Three Badges Learning GDPR In A Single Session',
      subhead: 'How consistent daily practice turned one beginner into a certified rights advocate',
    },
  ],
}

const PKO_CONTENT: HomeContent = {
  mastheadSubtitle: '"All The Financial News Fit To Play · PKO Edition"',
  sectionNav: ['Savings', 'Mortgages', 'IKE/IKZE', 'Loans', 'Challenges'],
  ticker: [
    '★ PKO EXCLUSIVE: New savings rates — are you getting yours?',
    '★ IKE/IKZE ALERT: Tax-free retirement limits raised for 2026',
    '★ MORTGAGE WATCH: WIBOR ticks down — refinance window opens',
    '★ DAILY CHALLENGE: Today\'s PKO puzzle is live — +120 XP',
    '★ COMPOUND INTEREST: The PKO secret banks hope you never discover',
  ],
  hero: {
    eyebrow: "Today's PKO Feature",
    headline: 'PKO Savings Revolution: The Rate Your Branch Never Mentions',
    dropCapLetter: 'P',
    dropCapRest:
      'KO customers who asked one simple question unlocked savings rates 2.4× higher than the default. The trick? Knowing the difference between <em>promocyjne</em> and <em>standardowe</em> accounts — and exactly when to migrate. Our team rebuilt the playbook from scratch…',
    emoji: '🏦',
    ctaLabel: 'Read Full Story →',
    ctaHref: '/quiz',
    meta: '5 min read · +120 XP',
  },
  gameModesFull: [
    { tag: 'QUICK ROUNDS',  kicker: 'TEST YOUR KNOWLEDGE', headline: 'Can You Beat a PKO Product Advisor at Their Own Game?',    body: 'Five questions on IKE, IKZE, and the Polish banking products every customer should know.',                emoji: '🏦', accent: '#FFCD00', cta: 'Start Quiz →',    href: '/quiz' },
    { tag: 'DECISION ROOM', kicker: 'EXCLUSIVE SCENARIO',  headline: 'Young Warsaw Professional Faces 30-Year Mortgage Choice', body: 'Fixed or variable? WIBOR or WIRON? One scenario, multiple paths, real zlotys on the line.',                emoji: '🎲', accent: '#E63946', cta: 'Enter Room →',    href: '/decision' },
    { tag: 'CARTOON EPISODE', kicker: 'STORY-BASED LEARNING', headline: 'Can You Retire Early on a Warsaw Salary?',                  body: "Choose your character. Navigate IKE, IKZE, ETFs, and the ZUS maze. Every choice shifts your FIRE date.",   emoji: '🎬', accent: '#FF7B25', cta: 'Watch Episode →', href: '/episode' },
  ],
  gameModesCompact: [
    { tag: 'QUICK ROUNDS', kicker: 'KNOWLEDGE TEST', headline: 'Can You Beat a PKO Product Advisor?', emoji: '🏦', accent: '#FFCD00', xp: '+80 XP', href: '/quiz' },
    { tag: 'DECISION ROOM', kicker: 'SCENARIO', headline: 'Warsaw Pro Faces 30-Year Mortgage Choice', emoji: '🎲', accent: '#E63946', xp: '+150 XP', href: '/decision' },
    { tag: 'CARTOON EPISODE', kicker: 'STORY GAME', headline: 'Can You Retire Early on a Warsaw Salary?', emoji: '🎬', accent: '#FF7B25', xp: '+200 XP', href: '/episode' },
  ],
  streak: {
    headline: "The 30-Day PKO Challenge That Maxed Out One Customer's IKE",
    bodyTemplate: 'One PKO challenge per day — your {streak}-day streak keeps your IKZE tax-break alive.',
    tipTitle: "Today's Tip",
    tipHtml: '🏦 <strong>The IKZE Trick:</strong> Maxing out your IKZE cuts your Polish PIT by up to 32% of the contribution — a guaranteed return no market can match.',
  },
  backCover: {
    emoji: '🏦',
    headline: 'Ready to Master Your PKO Account?',
    body: "Knowly × PKO isn't just a newspaper — it's your daily training ground for Polish banking mastery. Play. Learn. Level up.",
    cta: 'Start Playing Now →',
    ctaHref: '/quiz',
    poweredBy: 'Powered by PKO Bank Polski',
    tagline: '"Your financial future, gamified."',
  },
  forecast: {
    label: 'Polish Zloty Forecast',
    body: '☀️ Sunny with a chance of <strong>compound gains</strong>. Umbrella advised for WIBOR-linked loans.',
  },
  spreads: [
    {
      label: 'Front Page',
      headline: 'PKO Savings Scandal: The Rate Every Customer Deserves',
      subhead: 'How one simple conversation unlocked 2.4× higher rates for thousands of PKO clients',
    },
    {
      label: 'Game Modes',
      headline: 'Two New PKO Challenges Added To Knowly This Week',
      subhead: 'Test your product knowledge in Quick Rounds, or face mortgage dilemmas in the Decision Room',
    },
    {
      label: 'Achievements',
      headline: 'Local PKO Customer Earns Three Badges In A Single Session',
      subhead: 'How consistent daily practice turned one beginner into a certified PKO power-user',
    },
  ],
}

const ETH_SILESIA_CONTENT: HomeContent = {
  mastheadSubtitle: '"All The On-Chain News Fit To Play"',
  sectionNav: ['DeFi', 'Staking', 'L2s', 'NFTs', 'Challenges'],
  ticker: [
    '★ L2 ROTATION: Base TVL crosses Optimism — Silesia builders take note',
    '★ STAKING WATCH: Solo validators now earning 3.8% real yield on ETH',
    '★ DAILY CHALLENGE: Today\'s on-chain puzzle is live — +120 XP',
    '★ GAS UPDATE: Dencun blobs cut L2 fees by 87% this week',
    '★ STREAK ALERT: 847 builders maintained a 7-day streak this week',
  ],
  hero: {
    eyebrow: "Today's Silesia Story",
    headline: 'ETH Silesia Dev Ships L2 dApp — Here\'s What We Learned',
    dropCapLetter: 'A',
    dropCapRest:
      ' local Silesia team deployed their first rollup app on Base last week and the lessons are brutal: gas wars, re-entrancy audits, and the one storage-slot optimisation that cut their fees 40%. If you\'re shipping on-chain in 2026, read this before you deploy…',
    emoji: '⛓️',
    ctaLabel: 'Read Full Story →',
    ctaHref: '/quiz',
    meta: '5 min read · +120 XP',
  },
  gameModesFull: [
    { tag: 'QUICK ROUNDS',  kicker: 'TEST YOUR KNOWLEDGE', headline: 'Do You Actually Understand EIP-4844?',                  body: 'Five questions on blobs, rollups, and the Ethereum roadmap. Thirty seconds each.',                            emoji: '⛓️', accent: '#FFCD00', cta: 'Start Quiz →',    href: '/quiz' },
    { tag: 'DECISION ROOM', kicker: 'EXCLUSIVE SCENARIO',  headline: 'Silesia Builder Faces Fork Decision — Ship or Audit?',   body: 'Launch now and iterate? Or pay for the audit first? One call. Real TVL on the line.',                       emoji: '🎲', accent: '#E63946', cta: 'Enter Room →',    href: '/decision' },
    { tag: 'CARTOON EPISODE', kicker: 'STORY-BASED LEARNING', headline: 'Can You Survive a DeFi Bear Market Without Getting Rugged?', body: "Choose your wallet. Face yield traps, approval scams, and governance drama. Your keys, your choices.",      emoji: '🎬', accent: '#FF7B25', cta: 'Watch Episode →', href: '/episode' },
  ],
  gameModesCompact: [
    { tag: 'QUICK ROUNDS', kicker: 'KNOWLEDGE TEST', headline: 'Do You Actually Understand EIP-4844?', emoji: '⛓️', accent: '#FFCD00', xp: '+80 XP', href: '/quiz' },
    { tag: 'DECISION ROOM', kicker: 'SCENARIO', headline: 'Silesia Builder Faces Fork Decision', emoji: '🎲', accent: '#E63946', xp: '+150 XP', href: '/decision' },
    { tag: 'CARTOON EPISODE', kicker: 'STORY GAME', headline: 'Can You Survive a DeFi Bear Market?', emoji: '🎬', accent: '#FF7B25', xp: '+200 XP', href: '/episode' },
  ],
  streak: {
    headline: "The 30-Day On-Chain Challenge That Turned One Builder Into a Shipping Machine",
    bodyTemplate: 'One contract deployed per day keeps bit-rot away. Your {streak}-day streak is on the line.',
    tipTitle: "Today's Tip",
    tipHtml: '⛓️ <strong>The Proxy Rule:</strong> Never deploy an immutable contract to mainnet without a withdrawal path. Always. Even for small demos.',
  },
  backCover: {
    emoji: '⛓️',
    headline: 'Ready to Level Up On-Chain?',
    body: "Knowly × ETH Silesia isn't just a newspaper — it's your daily training ground for crypto & DeFi mastery. Build. Learn. Ship.",
    cta: 'Start Playing Now →',
    ctaHref: '/quiz',
    poweredBy: 'Powered by ETH Silesia',
    tagline: '"Your on-chain future, gamified."',
  },
  forecast: {
    label: 'Gas Forecast',
    body: '⛓️ Clear skies over Base & Arbitrum — <strong>blob fees at 2 gwei</strong>. Storms expected on mainnet swaps.',
  },
  spreads: [
    {
      label: 'Front Page',
      headline: 'L2 Rollup Revolution — What Every Silesia Builder Needs To Know',
      subhead: 'Inside the Dencun upgrade and the fee collapse that changed DeFi economics',
    },
    {
      label: 'Game Modes',
      headline: 'Two New On-Chain Challenges Added To Knowly This Week',
      subhead: 'Test your EIP knowledge in Quick Rounds, or face fork dilemmas in the Decision Room',
    },
    {
      label: 'Achievements',
      headline: 'Local Silesia Builder Earns Three Badges In A Single Session',
      subhead: 'How consistent daily practice turned one beginner into a certified on-chain shipper',
    },
  ],
}

const WARSAW_UNI_CONTENT: HomeContent = {
  mastheadSubtitle: '"All The Student Finance News Fit To Play"',
  sectionNav: ['Basics', 'Student Loans', 'First Job', 'Renting', 'Challenges'],
  ticker: [
    '★ STUDENT SPECIAL: How to open your first IKE before graduation',
    '★ SCHOLARSHIP ALERT: Tax rules every UW student gets wrong',
    '★ DAILY CHALLENGE: Today\'s student-finance puzzle is live',
    '★ FIRST JOB: The umowa o pracę vs B2B decision — explained',
    '★ STREAK ALERT: 847 students maintained a 7-day streak this week',
  ],
  hero: {
    eyebrow: "Today's Campus Story",
    headline: 'Warsaw Student Graduates Debt-Free — Here\'s Exactly How',
    dropCapLetter: 'A',
    dropCapRest:
      ' UW economics student turned a 2500 PLN/month scholarship into a fully-funded IKE by graduation. The playbook: compound interest, a tiny budgeting app, and one very unpopular decision about weekend trips. We got the full breakdown…',
    emoji: '🎓',
    ctaLabel: 'Read Full Story →',
    ctaHref: '/quiz',
    meta: '5 min read · +120 XP',
  },
  gameModesFull: [
    { tag: 'QUICK ROUNDS',  kicker: 'TEST YOUR KNOWLEDGE', headline: 'Can You Pass Personal Finance 101?',                 body: 'Five questions on budgeting, student loans, and the Polish tax basics every grad should know.',           emoji: '🎓', accent: '#FFCD00', cta: 'Start Quiz →',    href: '/quiz' },
    { tag: 'DECISION ROOM', kicker: 'EXCLUSIVE SCENARIO',  headline: 'UW Grad Faces First-Job Contract Dilemma',            body: 'Umowa o pracę, B2B, or umowa zlecenie? One signature, very different take-home pay.',                     emoji: '🎲', accent: '#E63946', cta: 'Enter Room →',    href: '/decision' },
    { tag: 'CARTOON EPISODE', kicker: 'STORY-BASED LEARNING', headline: 'Can You Survive Warsaw Rent on a Junior Salary?',       body: "Choose your character. Face Warsaw rental prices, commute costs, and first-salary shock.",                emoji: '🎬', accent: '#FF7B25', cta: 'Watch Episode →', href: '/episode' },
  ],
  gameModesCompact: [
    { tag: 'QUICK ROUNDS', kicker: 'KNOWLEDGE TEST', headline: 'Can You Pass Personal Finance 101?', emoji: '🎓', accent: '#FFCD00', xp: '+80 XP', href: '/quiz' },
    { tag: 'DECISION ROOM', kicker: 'SCENARIO', headline: 'UW Grad Faces First-Job Contract Dilemma', emoji: '🎲', accent: '#E63946', xp: '+150 XP', href: '/decision' },
    { tag: 'CARTOON EPISODE', kicker: 'STORY GAME', headline: 'Can You Survive Warsaw Rent on a Junior Salary?', emoji: '🎬', accent: '#FF7B25', xp: '+200 XP', href: '/episode' },
  ],
  streak: {
    headline: "The 30-Day Student Challenge That Turned One UW Grad Into a FIRE Believer",
    bodyTemplate: 'One small habit per day beats a last-minute cram. Your {streak}-day streak keeps your future self debt-free.',
    tipTitle: "Today's Tip",
    tipHtml: '🎓 <strong>The Student IKE Rule:</strong> Opening an IKE at 20 with 100 PLN/month beats opening one at 30 with 500 PLN/month — compound interest doesn\'t care about your student budget.',
  },
  backCover: {
    emoji: '🎓',
    headline: 'Ready to Ace Your Money Before Graduation?',
    body: "Knowly × Warsaw University isn't just a newspaper — it's your daily training ground for student finance. Learn. Budget. Level up.",
    cta: 'Start Playing Now →',
    ctaHref: '/quiz',
    poweredBy: 'Powered by Warsaw University',
    tagline: '"Your graduate future, gamified."',
  },
  forecast: {
    label: 'Campus Forecast',
    body: '🎓 Sunny on the scholarship front — <strong>budget surplus expected</strong>. Umbrella advised for unexpected Żabka runs.',
  },
  spreads: [
    {
      label: 'Front Page',
      headline: 'UW Student Graduates Debt-Free — The Playbook Campus Is Copying',
      subhead: 'How one scholarship, one budget app, and one IKE beat the student debt trap',
    },
    {
      label: 'Game Modes',
      headline: 'Two New Student Challenges Added To Knowly This Week',
      subhead: 'Test your basics in Quick Rounds, or face first-job dilemmas in the Decision Room',
    },
    {
      label: 'Achievements',
      headline: 'Local UW Student Earns Three Badges In A Single Session',
      subhead: 'How consistent daily practice turned one freshman into a certified budget master',
    },
  ],
}

const FINTECH_HUB_CONTENT: HomeContent = {
  mastheadSubtitle: '"All The FinTech News Fit To Play"',
  sectionNav: ['APIs', 'Payments', 'Embedded', 'Regtech', 'Challenges'],
  ticker: [
    '★ PSD3 DRAFT: New API mandates — what every fintech founder must prepare for',
    '★ STABLECOIN WATCH: MiCA passporting opens doors for Polish issuers',
    '★ DAILY CHALLENGE: Today\'s fintech puzzle is live — +120 XP',
    '★ EMBEDDED FINANCE: 2026 is the year BaaS hits Polish SMBs',
    '★ STREAK ALERT: 847 builders maintained a 7-day streak this week',
  ],
  hero: {
    eyebrow: "Today's FinTech Story",
    headline: 'Warsaw FinTech Startup Raises €4M — Here\'s The Product Pitch',
    dropCapLetter: 'A',
    dropCapRest:
      ' three-person Warsaw fintech just closed €4M Series A on a single payment-API product. The twist: they built it in 9 months using PSD2 sandboxes, bank partnerships, and a go-to-market that skipped enterprise sales entirely. We got the full teardown…',
    emoji: '⚡',
    ctaLabel: 'Read Full Story →',
    ctaHref: '/quiz',
    meta: '5 min read · +120 XP',
  },
  gameModesFull: [
    { tag: 'QUICK ROUNDS',  kicker: 'TEST YOUR KNOWLEDGE', headline: 'Can You Beat a FinTech CTO on PSD2?',                 body: 'Five questions on payment APIs, SCA, and the compliance traps every fintech founder hits.',                emoji: '⚡', accent: '#FFCD00', cta: 'Start Quiz →',    href: '/quiz' },
    { tag: 'DECISION ROOM', kicker: 'EXCLUSIVE SCENARIO',  headline: 'FinTech Founder Faces Regulatory Crossroads',          body: 'KNF license now, or sandbox first? One decision shapes 18 months of runway.',                               emoji: '🎲', accent: '#E63946', cta: 'Enter Room →',    href: '/decision' },
    { tag: 'CARTOON EPISODE', kicker: 'STORY-BASED LEARNING', headline: 'Can You Ship a Payment API Before Your Runway Ends?',    body: "Choose your stack. Face compliance audits, bank partner chaos, and the API that eats your Sunday.",         emoji: '🎬', accent: '#FF7B25', cta: 'Watch Episode →', href: '/episode' },
  ],
  gameModesCompact: [
    { tag: 'QUICK ROUNDS', kicker: 'KNOWLEDGE TEST', headline: 'Can You Beat a FinTech CTO on PSD2?', emoji: '⚡', accent: '#FFCD00', xp: '+80 XP', href: '/quiz' },
    { tag: 'DECISION ROOM', kicker: 'SCENARIO', headline: 'Founder Faces Regulatory Crossroads', emoji: '🎲', accent: '#E63946', xp: '+150 XP', href: '/decision' },
    { tag: 'CARTOON EPISODE', kicker: 'STORY GAME', headline: 'Can You Ship a Payment API Before Runway Ends?', emoji: '🎬', accent: '#FF7B25', xp: '+200 XP', href: '/episode' },
  ],
  streak: {
    headline: "The 30-Day Build Challenge That Shipped One Warsaw Startup to Series A",
    bodyTemplate: 'One commit per day keeps runway anxiety at bay. Your {streak}-day streak is on the line.',
    tipTitle: "Today's Tip",
    tipHtml: '⚡ <strong>The Sandbox Rule:</strong> Build in the KNF regulatory sandbox before seeking a full license — it cuts compliance costs ~60% in the first 18 months.',
  },
  backCover: {
    emoji: '⚡',
    headline: 'Ready to Build the Next Polish FinTech?',
    body: "Knowly × FinTech Hub isn't just a newspaper — it's your daily training ground for builders shipping money products. Build. Ship. Level up.",
    cta: 'Start Playing Now →',
    ctaHref: '/quiz',
    poweredBy: 'Powered by Warsaw FinTech Hub',
    tagline: '"Your startup future, gamified."',
  },
  forecast: {
    label: 'Startup Weather',
    body: '⚡ Tailwinds on PSD3 compliance — <strong>sandbox window open</strong>. Storms forecast for unlicensed stablecoin issuers.',
  },
  spreads: [
    {
      label: 'Front Page',
      headline: 'Warsaw FinTech Raises €4M — The Product Pitch Inside',
      subhead: 'How three founders shipped a payment API in 9 months and skipped enterprise sales entirely',
    },
    {
      label: 'Game Modes',
      headline: 'Two New FinTech Challenges Added To Knowly This Week',
      subhead: 'Test your API knowledge in Quick Rounds, or face regulatory dilemmas in the Decision Room',
    },
    {
      label: 'Achievements',
      headline: 'Local FinTech Founder Earns Three Badges In A Single Session',
      subhead: 'How consistent daily practice turned one builder into a certified fintech shipper',
    },
  ],
}

const CONTENT_BY_ORG_ID: Record<string, HomeContent> = {
  'pko-bank':    PKO_CONTENT,
  'eth-silesia': ETH_SILESIA_CONTENT,
  'eth-legal':   LEGAL_CONTENT,
  'warsaw-uni':  WARSAW_UNI_CONTENT,
  'fintech-hub': FINTECH_HUB_CONTENT,
}

export function getHomeContent(orgId: string | null | undefined, theme: OrgTheme): HomeContent {
  if (orgId && CONTENT_BY_ORG_ID[orgId]) return CONTENT_BY_ORG_ID[orgId]
  return theme === 'legal' ? LEGAL_CONTENT : FINANCE_CONTENT
}

// White-label learning path content.
// Finance track = default (PKO Bank et al). Legal track = ETHLegal space.

import type { OrgTheme } from '../contexts/OrgContext'

export type Status = 'completed' | 'active' | 'locked'

export interface GameQ { q: string; choices: string[]; correct: number; explanation: string }
export interface Slide { headline: string; body: string; emoji: string; color: string }
export interface LessonDef {
  mascotType: 'professor' | 'piggy' | 'wizard'
  introQuote: string
  slides: Slide[]
  game: { title: string; questions: GameQ[] }
}
export interface PathNodeData {
  id: number; title: string; desc: string; icon: string
  chapter: number; status: Status; xp: number
}
export interface Chapter { id: number; title: string; color: string; icon: string }

export interface PathContent {
  chapters: Chapter[]
  nodes: PathNodeData[]
  lessons: Record<number, LessonDef>
  pageTitle: string
}

// ───────────────────────── FINANCE ─────────────────────────

const FINANCE_CHAPTERS: Chapter[] = [
  { id: 1, title: 'Finance Basics',    color: '#FFCD00', icon: '🎓' },
  { id: 2, title: 'Budgeting',         color: '#2D9A4E', icon: '📊' },
  { id: 3, title: 'Smart Saving',      color: '#1565C0', icon: '🏦' },
  { id: 4, title: 'Investing',         color: '#FF7B25', icon: '📈' },
  { id: 5, title: 'Financial Mastery', color: '#7B2D8B', icon: '🏆' },
]

const FINANCE_NODES: PathNodeData[] = [
  { id:  1, title: 'What Is Money?',        desc: 'From barter to crypto — how money became the language of value.',              icon: '💰', chapter: 1, status: 'completed', xp: 50  },
  { id:  2, title: 'Debit vs Credit',       desc: "One spends what you have. The other borrows what you don't.",                  icon: '💳', chapter: 1, status: 'completed', xp: 75  },
  { id:  3, title: 'How Banks Work',        desc: 'Why your money earns 1.5% while the bank charges borrowers 12%.',             icon: '🏦', chapter: 1, status: 'completed', xp: 100 },
  { id:  4, title: 'The 50/30/20 Rule',     desc: 'The single most practical budgeting framework ever devised.',                  icon: '📊', chapter: 2, status: 'completed', xp: 100 },
  { id:  5, title: 'Tracking Expenses',     desc: "You can't improve what you don't measure. Here's how.",                       icon: '📝', chapter: 2, status: 'active',    xp: 120 },
  { id:  6, title: 'Emergency Funds',       desc: 'Three to six months of expenses between you and financial disaster.',          icon: '🛡️', chapter: 2, status: 'locked',   xp: 150 },
  { id:  7, title: 'Compound Interest',     desc: 'The eighth wonder of the world — and why starting early is everything.',      icon: '🌱', chapter: 3, status: 'locked',    xp: 150 },
  { id:  8, title: 'High-Yield Savings',    desc: 'Why a 4.5% savings account beats a 1.5% one by 3× over 10 years.',           icon: '📈', chapter: 3, status: 'locked',    xp: 175 },
  { id:  9, title: 'Savings Goals',         desc: 'Short-term, medium-term, long-term — buckets that make saving automatic.',    icon: '🎯', chapter: 3, status: 'locked',    xp: 200 },
  { id: 10, title: 'Stock Market Basics',   desc: 'Shares, dividends, P/E ratios — demystified in plain language.',              icon: '📉', chapter: 4, status: 'locked',    xp: 200 },
  { id: 11, title: 'Index Funds & ETFs',    desc: 'Why Warren Buffett told his wife to put 90% in an S&P 500 index fund.',      icon: '🗂️', chapter: 4, status: 'locked',   xp: 225 },
  { id: 12, title: 'Risk & Diversification',desc: "Don't put all your eggs in one basket — the math behind spreading risk.",    icon: '⚖️', chapter: 4, status: 'locked',    xp: 250 },
  { id: 13, title: 'Tax Optimisation',      desc: 'Legal ways to keep more of what you earn — every year, forever.',            icon: '📋', chapter: 5, status: 'locked',    xp: 250 },
  { id: 14, title: 'Real Estate Basics',    desc: 'Buy vs rent, leverage, rental yield — what the numbers actually show.',      icon: '🏠', chapter: 5, status: 'locked',    xp: 275 },
  { id: 15, title: 'Financial Freedom',     desc: 'The FIRE number, passive income, and designing a life without money stress.', icon: '🏆', chapter: 5, status: 'locked',    xp: 300 },
]

const FINANCE_LESSONS: Record<number, LessonDef> = {
  1: {
    mascotType: 'professor',
    introQuote: "Money is just a shared illusion — and I'm about to prove it! 🎩",
    slides: [
      { headline: 'From Barter to Bitcoin', emoji: '⚖️', color: '#FFCD00',
        body: 'Before money existed, people bartered — trading fish for grain, labour for shelter. But barter has a fatal flaw: you need a "double coincidence of wants."\n\nOver centuries we invented commodity money (gold, silver), then representative money (paper backed by gold), then fiat currency (backed by government trust). Today, cryptocurrencies like Bitcoin are the latest chapter — digital scarcity enforced by mathematics instead of a central bank.' },
      { headline: 'The 3 Functions of Money', emoji: '🔑', color: '#FF7B25',
        body: 'Every form of money that has ever worked fulfils exactly three roles:\n\n1. Medium of Exchange — accepted as payment for goods and services.\n2. Store of Value — holds its worth over time (gold holds better than milk).\n3. Unit of Account — a common measuring stick so we can compare the price of a car to the price of a sandwich.\n\nBitcoin fans argue it nails #1 and #2 but struggles with #3 because its price is too volatile. The debate continues!' },
    ],
    game: { title: 'Money Fundamentals', questions: [
      { q: 'Which of the following is NOT one of the three functions of money?', choices: ['Medium of Exchange', 'Store of Value', 'Unit of Account', 'Source of Happiness'], correct: 3, explanation: 'The three functions are Medium of Exchange, Store of Value, and Unit of Account. Happiness is a side-effect — not guaranteed!' },
      { q: 'What backs modern fiat currencies like the US dollar or Euro?', choices: ['Gold reserves', 'Silver reserves', 'Government trust and law', 'Oil reserves'], correct: 2, explanation: 'Since the US left the gold standard in 1971, fiat currencies are backed purely by government authority and public trust — not any physical commodity.' },
      { q: 'In which year was the Bitcoin whitepaper published?', choices: ['2004', '2006', '2008', '2011'], correct: 2, explanation: 'Satoshi Nakamoto published the Bitcoin whitepaper in October 2008, right in the middle of the global financial crisis — perhaps not a coincidence.' },
    ]},
  },
  2: {
    mascotType: 'professor',
    introQuote: "Banks' greatest trick? Convincing you they're saving your money… when they're lending it out! 🪄",
    slides: [
      { headline: 'Debit: Your Money, Instantly', emoji: '💳', color: '#1565C0',
        body: "A debit card draws directly from your bank account the moment you swipe. There's no borrowing — if you have €200 in your account and spend €201, the transaction is declined.\n\nAdvantages: you can't overspend, no interest charges, no debt risk.\nDisadvantage: weaker fraud protection. If a fraudster drains your account, it's your real money that disappears while you wait for the bank to investigate." },
      { headline: 'Credit: Borrowed Power (with a catch)', emoji: '🏦', color: '#E63946',
        body: "A credit card lets you borrow from the issuer up to a set limit. Pay the full balance before the due date and you pay zero interest — you've effectively had an interest-free loan for up to 56 days.\n\nMiss the deadline? Average EU credit card APR is around 20–25%. On a €500 balance at 24% APR, that's €120 in interest after just one year.\n\nCredit cards offer superior fraud protection because it's the bank's money at risk, not yours." },
    ],
    game: { title: 'Debit vs Credit', questions: [
      { q: 'Which card type immediately deducts money from your bank account?', choices: ['Credit card', 'Debit card', 'Charge card', 'Prepaid card'], correct: 1, explanation: 'A debit card draws directly from your balance in real time. Credit cards create a temporary loan that you repay later.' },
      { q: 'At 24% APR, how much interest would you pay on a €500 balance left unpaid for one year?', choices: ['€60', '€100', '€120', '€240'], correct: 2, explanation: '24% of €500 = €120. This is why paying your credit card in full each month is one of the most impactful financial habits you can build.' },
      { q: 'For online shopping fraud protection, which is generally better?', choices: ['Debit card', 'Cash', 'Credit card', 'Bank transfer'], correct: 2, explanation: "Credit cards offer stronger fraud protection because it's the bank's money at risk. Most issuers have zero-liability policies for unauthorised transactions." },
    ]},
  },
  3: {
    mascotType: 'piggy',
    introQuote: 'You deposit €1,000… and I immediately lend €900 of it to someone else. Wild, right? 🐷',
    slides: [
      { headline: 'The Bank Business Model', emoji: '🏛️', color: '#1565C0',
        body: "Banks make money on the spread between what they pay depositors and what they charge borrowers.\n\nIn practice: they might pay you 2% on your savings, then lend that money out as a personal loan at 15%. The 13% difference is their profit margin — called the net interest margin.\n\nThat's why banks build gleaming headquarters and sponsor football stadiums. The math works overwhelmingly in their favour." },
      { headline: 'Fractional Reserve Banking', emoji: '🔢', color: '#7B2D8B',
        body: "Banks don't keep all your deposits in a vault. Under fractional reserve banking, they're only required to keep a fraction as reserves and can lend out the rest.\n\nWith a 10% reserve requirement: you deposit €1,000 → bank keeps €100, lends €900. That borrower deposits €900 in another bank → keeps €90, lends €810. And so on.\n\nThis process can theoretically expand the initial €1,000 into up to €10,000 of total deposits in the banking system. It's called the money multiplier effect — and it's how money is literally created." },
    ],
    game: { title: 'How Banks Work', questions: [
      { q: "A bank pays 2% on savings and charges 15% on loans. What's the net interest margin?", choices: ['2%', '13%', '15%', '17%'], correct: 1, explanation: 'Net interest margin = lending rate − deposit rate = 15% − 2% = 13%. This spread is the core of how retail banks generate profit.' },
      { q: 'With a 10% reserve requirement, how much can a bank lend out of €1,000 in deposits?', choices: ['€100', '€500', '€900', '€1,000'], correct: 2, explanation: 'With a 10% reserve ratio, the bank keeps €100 (10%) and can lend the remaining €900. The reserve is the safety buffer against sudden withdrawals.' },
      { q: 'In the EU, how much of your bank deposits are guaranteed per account if a bank fails?', choices: ['€10,000', '€50,000', '€75,000', '€100,000'], correct: 3, explanation: 'EU deposit guarantee schemes protect up to €100,000 per depositor per bank. Amounts above this are at risk if the bank goes insolvent.' },
    ]},
  },
  4: {
    mascotType: 'piggy',
    introQuote: 'One rule. That is ALL you need to budget like a professional. Let me show you! 📊',
    slides: [
      { headline: 'The 50/30/20 Split', emoji: '🥧', color: '#2D9A4E',
        body: "Elizabeth Warren popularised this elegant framework in her book 'All Your Worth.' Every euro of take-home pay gets assigned to one of three buckets:\n\n• 50% → Needs: rent, groceries, utilities, transport, insurance — essentials you'd struggle without.\n• 30% → Wants: restaurants, streaming services, holidays, hobbies — the things that make life enjoyable.\n• 20% → Financial goals: emergency fund, debt repayment, savings, investments.\n\nThe beauty: it's flexible enough for any income level and simple enough to actually stick to." },
      { headline: 'Needs vs Wants: The Honest Test', emoji: '🤔', color: '#FF7B25',
        body: "The hardest part of the 50/30/20 rule is classifying honestly. Ask yourself: 'Would my life be materially harmed without this for 30 days?'\n\nNeeds: basic groceries (not restaurant meals), minimum rent payment, necessary transport, minimum debt payments, basic phone plan.\n\nWants: coffee shop visits, premium subscriptions, gym membership (often), new clothes beyond basics, dining out.\n\nWhen your 'needs' bucket overflows 50%, look for ways to reduce fixed costs — moving to a cheaper flat, switching utility providers — rather than stealing from your savings." },
    ],
    game: { title: 'The 50/30/20 Rule', questions: [
      { q: "If your take-home pay is €4,000/month, how much should go to 'Needs' under the 50/30/20 rule?", choices: ['€800', '€1,200', '€2,000', '€2,400'], correct: 2, explanation: "50% of €4,000 = €2,000 for needs. This covers rent, groceries, utilities, minimum debt payments, and other essentials." },
      { q: 'Under the 50/30/20 rule, which category does a Netflix subscription fall under?', choices: ['Needs (50%)', 'Wants (30%)', 'Financial Goals (20%)', 'It depends'], correct: 1, explanation: 'Netflix is a Want — enjoyable but not essential. You could live without it. Classifying entertainment as needs is a common trap that derails budgets.' },
      { q: 'The 20% "Financial Goals" bucket is intended to cover:', choices: ['Only retirement savings', 'Only emergency funds', 'Only debt repayment', 'Savings, debt repayment, and investing'], correct: 3, explanation: 'The 20% covers all wealth-building activities: building your emergency fund, paying down high-interest debt, and investing for long-term goals.' },
    ]},
  },
  5: {
    mascotType: 'wizard',
    introQuote: "You can't improve what you can't see. I'll make your money visible! ✨",
    slides: [
      { headline: 'The Tracking Illusion', emoji: '🧐', color: '#7B2D8B',
        body: "Studies consistently show that people underestimate their actual spending by 30–40%. That morning coffee habit? You think it costs €15/month. Tracked properly, it's often €60–90.\n\nThis isn't a moral failing — it's how human memory works. We remember the big, intentional purchases and forget the dozens of small, habitual ones.\n\nTracking forces the truth into daylight. Within two weeks of honest tracking, most people identify at least one spending category they want to change — not because someone told them to, but because they genuinely surprised themselves." },
      { headline: 'The 3 Expense Types', emoji: '📂', color: '#1565C0',
        body: "Categorise every expense into one of three types:\n\n• Fixed: Same amount, same time every month. Rent, loan repayments, insurance premiums. These are hardest to reduce but most impactful when you do.\n\n• Variable Necessities: Fluctuating but essential. Groceries, electricity, petrol. Reduce through habits and switching providers.\n\n• Discretionary: Optional spending driven by choice. Coffee, eating out, subscriptions, entertainment. Highest reduction potential with least lifestyle impact.\n\nOnce you see each category clearly, you can make targeted cuts without feeling like you're depriving yourself." },
    ],
    game: { title: 'Tracking Expenses', questions: [
      { q: 'Your mortgage repayment is €900 every month without variation. This is which type of expense?', choices: ['Variable necessity', 'Discretionary', 'Fixed', 'Investment'], correct: 2, explanation: 'Fixed expenses are the same amount at the same time every period. Mortgage repayments, insurance, and loan payments are classic examples.' },
      { q: "You track your coffee spending and discover you're spending €180/month. After review you decide €60 is reasonable. What have you created?", choices: ['An investment goal', 'A savings account', 'A spending budget for that category', 'A debt repayment plan'], correct: 2, explanation: "You've set a category budget — a cap on discretionary spending. This is the core action that turns tracking into improvement." },
      { q: "For accurate expense tracking, when should you log a purchase?", choices: ['At the end of the month', 'Once a week', 'In real-time or same day', 'Whenever you remember'], correct: 2, explanation: 'Memory fades fast. Same-day logging captures expenses before they disappear from your mental record. Apps that auto-import bank transactions make this effortless.' },
    ]},
  },
}

export const FINANCE_CONTENT: PathContent = {
  pageTitle: 'Learning Path',
  chapters: FINANCE_CHAPTERS,
  nodes: FINANCE_NODES,
  lessons: FINANCE_LESSONS,
}

// ───────────────────────── LEGAL (ETHLegal) ─────────────────────────

const LEGAL_CHAPTERS: Chapter[] = [
  { id: 1, title: 'Your Data Rights',    color: '#2D9A4E', icon: '🛡️' },
  { id: 2, title: 'Banking & Payments',  color: '#1565C0', icon: '💳' },
  { id: 3, title: 'Consumer Credit',     color: '#FFCD00', icon: '📄' },
  { id: 4, title: 'Crypto & Digital',    color: '#7B2D8B', icon: '⛓️' },
  { id: 5, title: 'Disputes & Remedies', color: '#E63946', icon: '⚖️' },
]

const LEGAL_NODES: PathNodeData[] = [
  { id:  1, title: 'GDPR in Plain English',    desc: 'The 7 principles that every company processing your data must follow.',               icon: '📜', chapter: 1, status: 'completed', xp: 50  },
  { id:  2, title: 'Right of Access',          desc: "Any company can be asked: 'what do you know about me?' — and they must answer.",     icon: '🔍', chapter: 1, status: 'completed', xp: 75  },
  { id:  3, title: 'Right to Erasure',         desc: 'The "right to be forgotten" — when it applies and when it doesn\'t.',                icon: '🗑️', chapter: 1, status: 'completed', xp: 100 },
  { id:  4, title: 'PSD2 & Chargebacks',       desc: 'Unauthorised transaction? You have 13 months to dispute it — and the bank pays.',   icon: '💳', chapter: 2, status: 'completed', xp: 100 },
  { id:  5, title: 'Strong Customer Auth',     desc: "Why your bank demands two-factor — and what happens when it doesn't.",              icon: '🔐', chapter: 2, status: 'active',    xp: 120 },
  { id:  6, title: 'Payment Account Rights',   desc: 'Basic account access is a legal right in the EU. How to use it.',                   icon: '🏦', chapter: 2, status: 'locked',   xp: 150 },
  { id:  7, title: 'Consumer Credit Rules',    desc: 'APR, total cost of credit, and the 14-day cooling-off you never knew about.',       icon: '📊', chapter: 3, status: 'locked',    xp: 150 },
  { id:  8, title: 'Cooling-Off Period',       desc: 'Distance sales, loans, insurance — 14 days to change your mind, no questions.',      icon: '⏰', chapter: 3, status: 'locked',    xp: 175 },
  { id:  9, title: 'Unfair Contract Terms',    desc: 'Hidden fees, one-sided clauses — EU law voids them even if you signed.',            icon: '✂️', chapter: 3, status: 'locked',    xp: 200 },
  { id: 10, title: 'MiCA & Crypto Rights',     desc: 'The EU crypto regulation: what exchanges must disclose, what you can demand.',      icon: '⛓️', chapter: 4, status: 'locked',    xp: 200 },
  { id: 11, title: 'Digital Services Act',     desc: 'Platforms must tell you why posts were removed — and you can appeal.',              icon: '🌐', chapter: 4, status: 'locked',    xp: 225 },
  { id: 12, title: 'Data Portability',         desc: 'Your data is yours. You can demand it in a reusable format and take it elsewhere.', icon: '📦', chapter: 4, status: 'locked',    xp: 250 },
  { id: 13, title: 'UOKiK — Consumer Watchdog',desc: 'Poland\'s consumer protection authority. When and how to file a complaint.',        icon: '🛡️', chapter: 5, status: 'locked',    xp: 250 },
  { id: 14, title: 'Rzecznik Finansowy',       desc: 'Free ombudsman for bank, insurance, and loan disputes — often better than court.',  icon: '⚖️', chapter: 5, status: 'locked',    xp: 275 },
  { id: 15, title: 'ADR & Small Claims',       desc: 'Online dispute resolution, small claims court, class actions — the full toolkit.', icon: '🏛️', chapter: 5, status: 'locked',    xp: 300 },
]

const LEGAL_LESSONS: Record<number, LessonDef> = {
  1: {
    mascotType: 'professor',
    introQuote: "GDPR isn't just cookie banners — it's the strongest privacy law on earth. Let me show you why. ⚖️",
    slides: [
      { headline: 'The 7 GDPR Principles', emoji: '📜', color: '#2D9A4E',
        body: 'Every organisation processing your personal data must follow seven principles set out in Article 5:\n\n1. Lawfulness, fairness, transparency\n2. Purpose limitation — collected for specific, explicit reasons\n3. Data minimisation — only what is strictly needed\n4. Accuracy — kept up to date\n5. Storage limitation — not kept longer than necessary\n6. Integrity & confidentiality — protected from breach\n7. Accountability — the controller must prove compliance\n\nViolating any one of these can trigger fines up to 4% of global annual revenue or €20M, whichever is higher.' },
      { headline: 'What Counts as Personal Data?', emoji: '🔍', color: '#1565C0',
        body: "Much more than you think. Personal data is anything that can identify you, directly or indirectly:\n\n• Name, email, phone, address, ID number — obviously\n• IP address, device ID, cookie ID — yes, these too\n• Location data, browsing history, purchase patterns\n• Biometric data, health records, genetic data (special category)\n• Photos, voice recordings, even your handwriting\n\nIf it can be linked back to a living person, GDPR applies. The key test: could someone figure out who you are from this data, alone or combined with other info they have?" },
    ],
    game: { title: 'GDPR Fundamentals', questions: [
      { q: 'What is the maximum GDPR fine for a serious violation?', choices: ['€1M or 1% of turnover', '€10M or 2% of turnover', '€20M or 4% of turnover', '€50M or 10% of turnover'], correct: 2, explanation: 'The higher tier of GDPR fines is up to €20M or 4% of global annual turnover — whichever is larger. This is designed to make non-compliance economically irrational, even for the biggest companies.' },
      { q: "Which of these is NOT personal data under GDPR?", choices: ['IP address', 'Pseudonymised user ID', 'Fully anonymised aggregate statistics', 'Cookie identifier'], correct: 2, explanation: 'Only truly anonymous data — where re-identification is impossible — falls outside GDPR. Pseudonymised data (e.g. hashed IDs) still counts, because it can often be linked back.' },
      { q: 'The principle of "data minimisation" means:', choices: ['Companies should delete all data quickly', 'Only collect what is strictly needed for the stated purpose', 'Store data in minimal file formats', 'Use the smallest database possible'], correct: 1, explanation: 'Data minimisation means collecting only what is necessary for the specific purpose. A pizza delivery app needs your address — it does not need your date of birth.' },
    ]},
  },
  2: {
    mascotType: 'professor',
    introQuote: "Want to know everything a company has on you? Just ask. They have 30 days to reply — for free. 📬",
    slides: [
      { headline: 'Article 15 — Your Right to Know', emoji: '🔍', color: '#2D9A4E',
        body: "Under GDPR Article 15, you can send any data controller a Subject Access Request (SAR). They must respond within 30 days with:\n\n• Confirmation that they process your data\n• A copy of the actual data they hold\n• The purposes of processing\n• Who they shared the data with\n• How long they'll keep it\n• Your other rights (erasure, portability, objection)\n\nThe request is free. They can only charge if it's 'manifestly unfounded or excessive' — which is very hard to prove." },
      { headline: 'How to Submit a SAR', emoji: '✉️', color: '#1565C0',
        body: "A Subject Access Request doesn't need a lawyer. A short email works:\n\n'Dear [company], under Article 15 GDPR I request a copy of all personal data you hold about me, together with the information in Article 15(1)(a)–(h). My identity details are [name, email, account number]. Please respond within 30 days.'\n\nMost companies have a DPO (Data Protection Officer) email like privacy@ or dpo@. If they miss the deadline, ignore you, or send only part of the data, you can complain to your national data protection authority (UODO in Poland) — they can investigate and fine." },
    ],
    game: { title: 'Right of Access', questions: [
      { q: 'How long does a company have to respond to a Subject Access Request?', choices: ['7 days', '14 days', '30 days', '90 days'], correct: 2, explanation: 'The default deadline is one month (30 days). It can be extended by a further two months for complex requests, but the controller must notify you of the extension within the first month.' },
      { q: 'Can a company charge you for a standard Subject Access Request?', choices: ['Yes, always', 'Yes, if they want to', 'Only if the request is manifestly unfounded or excessive', 'Only for requests over 100 pages'], correct: 2, explanation: 'SARs are free by default. Fees are only allowed in narrow circumstances — repeated, clearly unfounded, or excessive requests. The bar is deliberately high.' },
      { q: 'If a company ignores your SAR, what should you do next?', choices: ['Sue them immediately', 'Lodge a complaint with the national data protection authority', 'Post about it on social media', 'Accept defeat'], correct: 1, explanation: 'Every EU country has a DPA (in Poland: UODO) that handles GDPR complaints. They investigate for free and can order the company to comply or impose fines.' },
    ]},
  },
  3: {
    mascotType: 'wizard',
    introQuote: "Delete me from your servers! It works — but only in the right circumstances. Let me explain. 🪄",
    slides: [
      { headline: 'When Erasure Applies', emoji: '🗑️', color: '#E63946',
        body: "Article 17 gives you the 'right to be forgotten' in six situations:\n\n1. The data is no longer needed for the original purpose\n2. You withdraw consent and there's no other legal basis\n3. You object and there are no overriding legitimate interests\n4. The data was processed unlawfully\n5. Erasure is required to comply with a legal obligation\n6. The data was collected from a child for online services\n\nIf any one applies, the controller must delete — usually within 30 days — and notify anyone they shared the data with." },
      { headline: "When It DOESN'T Apply", emoji: '🚫', color: '#7B2D8B',
        body: "The right to erasure has important limits. Companies can legally refuse if the data is needed for:\n\n• Compliance with legal obligations (banks must keep transaction records for 5+ years)\n• Public interest or official authority\n• Scientific or historical research\n• Freedom of expression and information\n• The establishment, exercise, or defence of legal claims\n\nSo you can't erase your mortgage payment history from your bank, or a news article that mentions you legitimately. But a marketing database, abandoned account, or outdated HR file? Absolutely." },
    ],
    game: { title: 'Right to Erasure', questions: [
      { q: 'A marketing company keeps sending you emails. You never consented. What right applies?', choices: ['Right of access', 'Right to erasure', 'Right to rectification', 'Right to portability'], correct: 1, explanation: 'Since they have no legal basis to process your data (no consent, no legitimate interest that overrides yours), you can demand erasure under Article 17. Often one email is enough.' },
      { q: 'Your bank refuses to delete your old mortgage records. Is this lawful?', choices: ['No, GDPR always wins', 'Yes — they have a legal obligation to keep financial records', 'Only if you paid off the loan', 'Only if you threaten a lawsuit'], correct: 1, explanation: 'Banks are required by anti-money-laundering and accounting laws to retain transaction records for 5+ years. GDPR explicitly exempts data needed for legal obligations.' },
      { q: 'How quickly must a company delete your data after a valid erasure request?', choices: ['Immediately', 'Within 30 days (same as SAR)', 'Within 90 days', 'Whenever they feel like it'], correct: 1, explanation: 'The same one-month default applies. Delay beyond that without notifying you is itself a GDPR violation.' },
    ]},
  },
  4: {
    mascotType: 'piggy',
    introQuote: "Card stolen? Fraudulent charge? PSD2 says the bank pays — not you. As long as you act fast. 💳",
    slides: [
      { headline: 'PSD2 Liability Rules', emoji: '💳', color: '#1565C0',
        body: "The second Payment Services Directive (PSD2) shifted fraud liability heavily onto banks. If an unauthorised transaction happens:\n\n• You owe at most €50 (deductible) — only for losses before you reported the card stolen\n• After you report it, your liability drops to €0\n• If the bank didn't require Strong Customer Authentication (SCA), you owe €0 regardless\n\nYou have 13 months from the debit date to dispute. The bank must refund by the end of the next business day, then investigate afterwards — not the other way round." },
      { headline: 'How to Invoke Your Rights', emoji: '📞', color: '#E63946',
        body: "Step-by-step when you see an unauthorised charge:\n\n1. Report to the bank in writing (email or app chat — create a record)\n2. State clearly: 'I did not authorise this transaction on [date] for [amount]. Under PSD2 Article 73 I request a full refund by end of next business day.'\n3. If they refuse, ask for the reason in writing\n4. Escalate to Rzecznik Finansowy (free) if it exceeds 30 days\n5. Last resort: small claims court (under 20,000 PLN) or UOKiK complaint\n\nBanks frequently try to blame 'gross negligence' to deny refunds. Unless they can prove you shared your PIN on purpose, this defence usually fails." },
    ],
    game: { title: 'PSD2 & Chargebacks', questions: [
      { q: 'How long do you have to dispute an unauthorised card transaction under PSD2?', choices: ['48 hours', '30 days', '6 months', '13 months'], correct: 3, explanation: 'PSD2 gives you 13 months from the debit date to report unauthorised transactions. Banks often claim shorter windows in their T&Cs — those terms are unenforceable under EU law.' },
      { q: 'If the bank did NOT use Strong Customer Authentication, your liability for fraud is:', choices: ['The full amount', '€50 deductible', '€0 — the bank absorbs it entirely', '50% of the loss'], correct: 2, explanation: 'PSD2 Article 74 is clear: if the bank failed to require SCA (2FA), they bear 100% of the loss. This is why every EU bank now demands 2FA for online payments.' },
      { q: 'When must a bank refund an unauthorised transaction?', choices: ['After a 30-day investigation', 'By end of next business day, then investigate', 'Only after police report', 'At the bank\'s discretion'], correct: 1, explanation: 'The "refund first, investigate later" rule is one of PSD2\'s strongest protections. If the bank stalls or demands you prove fraud before refunding, they are breaking EU law.' },
    ]},
  },
  5: {
    mascotType: 'wizard',
    introQuote: "Why does every payment demand a code? Because the law requires it — and it protects YOU. 🔐",
    slides: [
      { headline: 'What Is Strong Customer Authentication?', emoji: '🔐', color: '#2D9A4E',
        body: "Under PSD2, most electronic payments in the EU require Strong Customer Authentication (SCA) — two-factor authentication using at least two of:\n\n• Knowledge — something you know (PIN, password)\n• Possession — something you have (phone, card)\n• Inherence — something you are (fingerprint, face)\n\nThe classic combo: you enter your card details (knowledge) and confirm in your banking app (possession). That's SCA. Without both factors, the bank must decline or absorb any fraud loss." },
      { headline: 'When SCA is NOT Required', emoji: '⚖️', color: '#FFCD00',
        body: "SCA has specific, limited exemptions:\n\n• Small contactless payments under €50 (with cumulative caps)\n• Transport and parking terminals\n• Merchant-initiated recurring payments after the first one was authenticated\n• Trusted-beneficiary lists you've added in your banking app\n• Low-risk transactions flagged by the bank's fraud engine\n\nIf a payment bypassed SCA under one of these exemptions and turns out to be fraud, the liability rules depend on which exemption. In most cases the bank — not you — absorbs the loss. Merchants who misuse exemptions to avoid SCA friction are taking on that risk themselves." },
    ],
    game: { title: 'Strong Customer Authentication', questions: [
      { q: 'Which of these combinations does NOT satisfy SCA?', choices: ['Password + SMS code', 'Card + PIN at ATM', 'Password + security question', 'Fingerprint + banking app confirmation'], correct: 2, explanation: 'Password and security question are both "knowledge" — the same factor category. SCA requires two DIFFERENT categories: knowledge, possession, or inherence.' },
      { q: 'A contactless tap for €30 does not require SCA. Is this legal?', choices: ['No, SCA is always required', 'Yes — contactless under €50 is exempt (with cumulative caps)', 'Only if it is a debit card', 'Only for transit payments'], correct: 1, explanation: 'PSD2 allows an SCA exemption for contactless payments under €50, with cumulative limits (e.g. €150 or 5 consecutive payments) before SCA is forced. It\'s a convenience/security trade-off.' },
      { q: 'If a fraudulent payment went through without SCA and no exemption applies, who pays?', choices: ['You', 'The merchant', 'The bank', 'Split 50/50'], correct: 2, explanation: 'This is the core deterrent: banks that skip SCA without a valid exemption bear the full cost. It\'s why they invested billions deploying 3-D Secure v2 across Europe.' },
    ]},
  },
}

export const LEGAL_CONTENT: PathContent = {
  pageTitle: 'Know Your Rights',
  chapters: LEGAL_CHAPTERS,
  nodes: LEGAL_NODES,
  lessons: LEGAL_LESSONS,
}

export function getPathContent(theme: OrgTheme): PathContent {
  return theme === 'legal' ? LEGAL_CONTENT : FINANCE_CONTENT
}

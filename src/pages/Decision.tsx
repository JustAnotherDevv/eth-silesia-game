import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { submitGame } from '../lib/api'
import { getSession } from '../lib/session'
import { useIsMobile } from '../lib/responsive'
import { play, preload } from '../lib/sounds'

const ink     = 'var(--rh-ink)'
const paper   = 'var(--rh-paper)'
const surface = 'var(--rh-surface)'

// ─── Types ────────────────────────────────────────────────────

interface Stats {
  money: number
  mood: number    // 0-100
  stress: number  // 0-100
  flags: Record<string, boolean | number | string>
  relationships: Record<string, number>  // 0-100 trust per character id
}

interface Choice {
  emoji: string
  label: string
  detail: string
  next: string
  risk?: 'safe' | 'bold' | 'risky' | 'smart'
  effect?: Partial<Omit<Stats, 'flags' | 'relationships'>> & {
    flags?: Record<string, boolean | number | string>
    relationships?: Record<string, number>
  }
  condition?: (s: Stats) => boolean
}

interface Character {
  id: string
  name: string
  emoji: string
  color?: string
}

interface DebriefItem {
  icon: string
  title: string
  verdict: (s: Stats) => 'great' | 'ok' | 'poor'
  commentary: { great: string; ok: string; poor: string }
}

interface BudgetCategory {
  id: string
  label: string
  emoji: string
  hint?: string
}

interface BudgetGameConfig {
  prompt: string
  unit: string
  total: number | ((s: Stats) => number)
  categories: BudgetCategory[]
  next: string
  effectFn: (allocs: Record<string, number>, stats: Stats) => Choice['effect']
}

interface TimingZone {
  start: number  // 0-100 pct of bar
  end: number
  label: string
  color: string
  emoji: string
  message: string
  next: string
  effect?: Choice['effect']
}

interface TimingGameConfig {
  prompt: string
  speed?: number
  zones: TimingZone[]
}

interface Scene {
  id: string
  chapter: number
  emoji: string
  title: string
  text: string | ((s: Stats) => string)
  choices?: Choice[]
  autoNext?: string
  onEnter?: (s: Stats) => Partial<Omit<Stats, 'flags'>> & { flags?: Record<string, boolean | number> }
  isEnding?: boolean
  endingLabel?: string
  endingColor?: string
  xp?: number
  hiddenInfo?: HiddenInfo
  negotiate?: NegotiateConfig
  budgetGame?: BudgetGameConfig
  timingGame?: TimingGameConfig
  echoOf?: (s: Stats, log: DecisionLogEntry[]) => string | null
  debrief?: DebriefItem[]
}

// ─── New mechanic types ───────────────────────────────────────

interface DecisionLogEntry {
  sceneId: string
  chapter: number
  choiceLabel: string
  choiceEmoji: string
}

interface HiddenInfo {
  buttonLabel: string
  buttonEmoji: string
  cost: { mood?: number; stress?: number }
  title: string
  text: string
  flag: string
}

interface NegotiateOutcome {
  condition: (offer: number, stats: Stats) => boolean
  label: string
  color: string
  emoji: string
  next: string
  effect?: Choice['effect'] | ((offer: number) => Choice['effect'])
  message: string
}

interface NegotiateConfig {
  prompt: string
  unit: string
  min: number
  max: number
  step: number
  ask: number
  outcomes: NegotiateOutcome[]
}

interface Story {
  id: string
  emoji: string
  title: string
  subtitle: string
  color: string
  duration: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  startScene: string
  startStats: Stats
  chapters: string[]
  scenes: Record<string, Scene>
  characters?: Character[]
}

// ─── Story 1: The First Real Job ──────────────────────────────

const STORY_JOB: Story = {
  id: 'first_job',
  emoji: '💼',
  title: 'The First Real Job',
  subtitle: 'You landed your dream job. Now what?',
  color: '#2D9A4E',
  duration: '~8 min',
  difficulty: 'Beginner',
  startScene: 'arrival',
  startStats: { money: 800, mood: 80, stress: 20, flags: {}, relationships: { piotr: 70, boss: 50 } },
  chapters: ['First Week', 'First Paycheck', 'The Offer', 'Year One'],
  characters: [
    { id: 'piotr', name: 'Piotr', emoji: '👤', color: '#1565C0' },
    { id: 'boss', name: 'Your Boss', emoji: '👔', color: '#2D9A4E' },
  ],
  scenes: {
    arrival: {
      id: 'arrival', chapter: 1, emoji: '🎉',
      title: 'You got the job!',
      text: 'Warsaw, Monday morning. You just showed up at your first day at TechFlow — a 60-person startup paying you €2,800/month net. The office smells like coffee and ambition. Your bank account has €800 left from student savings.\n\nHR hands you an onboarding form. Under "transport allowance", you notice you can expense up to €200/month for commuting. But you\'d need to actually track every receipt.',
      choices: [
        { emoji: '📱', label: 'Set up an expense tracker', detail: 'Methodical from day one. Claim every euro.', next: 'apartment', risk: 'smart', effect: { flags: { tracks_expenses: true } } },
        { emoji: '🤷', label: 'Too much hassle, skip it', detail: 'You\'ll just ballpark it later.', next: 'apartment', risk: 'safe', effect: { mood: 5 } },
      ],
    },
    apartment: {
      id: 'apartment', chapter: 1, emoji: '🏠',
      title: 'The Housing Dilemma',
      text: 'You\'ve been crashing with a friend but need your own place. Two options just came up:\n\n🏚 Mokotów studio — €650/month. Small, 45-min commute each way. Your evenings would evaporate.\n\n🏙 Śródmieście flat with a roommate — €950/month. 10-min walk to the office. Split bills, shared kitchen, shared sanity.',
      choices: [
        { emoji: '🏚', label: 'Cheap studio, save the difference', detail: '€300 cheaper but 75 hours/month commuting', next: 'rent_negotiation', risk: 'safe', effect: { money: -650, stress: 15, flags: { cheap_apartment: true } } },
        { emoji: '🏙', label: 'City flat with roommate', detail: 'More expensive but reclaim your evenings', next: 'paycheck_1', risk: 'bold', effect: { money: -950, mood: 10, stress: -10, flags: { has_roommate: true } } },
      ],
    },
    rent_negotiation: {
      id: 'rent_negotiation', chapter: 1, emoji: '🤝',
      title: 'Negotiate the Rent',
      text: 'The Mokotów landlord seems open to discussion. "I prefer stable long-term tenants," he says. The listed price is €650/month — but you\'ve read that most private landlords have 5–10% flex.\n\nYou have one shot. Make your offer.',
      negotiate: {
        prompt: 'What monthly rent do you offer?',
        unit: '€/mo',
        min: 500, max: 650, step: 10, ask: 650,
        outcomes: [
          { condition: (o) => o < 530, label: 'Rejected!', color: '#E63946', emoji: '😡', next: 'paycheck_1', effect: { stress: 20, mood: -15 }, message: 'Way too low. The landlord is insulted — and you still pay full price to keep the flat.' },
          { condition: (o, s) => o <= 580 && s.mood >= 65, label: 'Excellent deal!', color: '#FFCD00', emoji: '🎉', next: 'paycheck_1', effect: { money: 840, mood: 15, flags: { negotiated_rent: true } }, message: 'Your calm confidence landed it. €580/month — you\'ll save €840 this year alone.' },
          { condition: (o) => o <= 580, label: 'Deal!', color: '#2D9A4E', emoji: '✅', next: 'paycheck_1', effect: { money: 600, mood: 10, flags: { negotiated_rent: true } }, message: 'After a long pause, accepted. Saving €60–70/month adds up fast.' },
          { condition: (o) => o <= 625, label: 'Small win', color: '#FF7B25', emoji: '🤝', next: 'paycheck_1', effect: { money: 240, flags: { negotiated_rent: true } }, message: 'They counter at €630. You agree — not huge, but €20/month is €240/year.' },
          { condition: () => true, label: 'No deal', color: '#1565C0', emoji: '😐', next: 'paycheck_1', message: 'You didn\'t push hard enough. Full €650 it is — but at least you tried.' },
        ],
      },
    },
    paycheck_1: {
      id: 'paycheck_1', chapter: 2, emoji: '💰',
      title: 'First Paycheck: €2,800',
      text: (s) => `The 25th. €2,800 hits your account. After rent (${s.flags.cheap_apartment ? '€650' : '€950'}) and groceries (~€350), you have €${s.flags.cheap_apartment ? '1,800' : '1,500'} to allocate.\n\nYour colleague Marta brags she's been auto-investing 20% of her salary since month one. Your friend group is planning a Kraków weekend for €400. Where does the money go?`,
      budgetGame: {
        prompt: 'Allocate your disposable income',
        unit: '€',
        total: (s) => s.flags.cheap_apartment ? 1800 : 1500,
        categories: [
          { id: 'savings', label: 'Savings account', emoji: '🏦', hint: 'Safe, low return, always accessible' },
          { id: 'invest', label: 'ETF / investments', emoji: '📈', hint: 'Higher long-term return, less liquid' },
          { id: 'fun', label: 'Lifestyle / fun', emoji: '🎉', hint: 'Kraków trip, dinners, experiences' },
          { id: 'emergency', label: 'Emergency fund', emoji: '🛡️', hint: '3–6 months expenses buffer' },
        ],
        next: 'friend_loan',
        effectFn: (allocs) => ({
          money: allocs.savings + allocs.invest + allocs.emergency,
          mood: allocs.fun >= 500 ? 20 : allocs.fun >= 250 ? 10 : -5,
          stress: allocs.emergency >= 400 ? -12 : allocs.emergency >= 200 ? -5 : 8,
          flags: {
            ...(allocs.invest >= 300 && { investing: true }),
            ...(allocs.fun >= 380 && { went_krakow: true }),
            ...(allocs.savings >= 900 && allocs.invest < 100 && { full_saver: true }),
          },
        }),
      },
    },
    friend_loan: {
      id: 'friend_loan', chapter: 2, emoji: '😬',
      title: 'The Text Message',
      text: 'Three months in. You\'re finally feeling financially stable. Then your best friend Piotr texts:\n\n"Hey… I know this is awkward but I got fired last month and I\'m about to miss rent. Can you lend me €500? I\'ll pay you back by the 15th, I promise."\n\nPiotr has been your friend since high school. He also borrowed €200 from you two years ago that you never fully got back.',
      choices: [
        { emoji: '💸', label: 'Send the €500', detail: 'Friendship first. It\'s just money.', next: 'work_review', risk: 'bold', effect: { money: -500, mood: 10, stress: 10, flags: { lent_piotr: true }, relationships: { piotr: 25 } } },
        { emoji: '🤝', label: 'Offer €200, not €500', detail: 'Help but protect yourself', next: 'work_review', risk: 'smart', effect: { money: -200, stress: 5, flags: { partial_help: true }, relationships: { piotr: 8 } } },
        { emoji: '❌', label: 'Say no, you can\'t afford it', detail: 'Protect your finances. It might cost the friendship.', next: 'work_review', risk: 'safe', effect: { mood: -15, stress: -5, flags: { refused_piotr: true }, relationships: { piotr: -35 } } },
      ],
    },
    work_review: {
      id: 'work_review', chapter: 3, emoji: '⭐',
      title: 'Six-Month Review',
      text: 'Your manager calls you in for a mid-year review. "You\'ve been fantastic," he says. "We want to keep you." He slides a paper across the table.\n\nOption A: €400/month raise — immediate, guaranteed.\nOption B: Stock options worth 0.1% of the company — vesting over 4 years. If TechFlow gets acquired (which management says is "likely"), this could be worth €50,000+. Or nothing.\n\n"You don\'t have to decide now," he says. "But by Friday."',
      choices: [
        { emoji: '💵', label: 'Take the €400 raise', detail: '€4,800/year guaranteed, starting now', next: 'side_hustle', risk: 'safe', effect: { money: 400, mood: 10, stress: -5, flags: { took_raise: true }, relationships: { boss: 5 } } },
        { emoji: '📊', label: 'Take the stock options', detail: 'High risk, potentially huge upside in 4 years', next: 'side_hustle', risk: 'risky', effect: { mood: 5, stress: 15, flags: { took_options: true }, relationships: { boss: 15 } } },
        { emoji: '🤝', label: 'Negotiate: half raise + half options', detail: '€200 raise AND reduced options', next: 'side_hustle', risk: 'smart', effect: { money: 200, mood: 15, flags: { negotiated: true }, relationships: { boss: 20 } } },
      ],
    },
    side_hustle: {
      id: 'side_hustle', chapter: 3, emoji: '💡',
      title: 'The Side Hustle Temptation',
      text: (s) => `Month eight. ${s.flags.took_raise ? 'The raise has been nice' : s.flags.negotiated ? 'The combined deal feels right' : 'The stock options feel like a gamble'}. A colleague mentions she makes €600/month doing freelance UX audits on weekends — 6-8 hours of work.\n\n"You could do it too," she says. "Just don't tell HR."\n\nYour employment contract has a vague clause about "competing activities". You're not sure if this counts.`,
      choices: [
        { emoji: '🚀', label: 'Start freelancing, don\'t mention it', detail: '€600/month extra but some legal grey area', next: 'year_end', risk: 'risky', effect: { money: 600, stress: 20, flags: { freelancing: true } } },
        { emoji: '📝', label: 'Ask HR to clarify the contract first', detail: 'Slower but clean', next: 'year_end', risk: 'smart', effect: { stress: -5, flags: { asked_hr: true } } },
        { emoji: '🙅', label: 'Skip it — your main job is enough', detail: 'Keep work-life balance', next: 'year_end', risk: 'safe', effect: { mood: 10, stress: -10 } },
      ],
    },
    year_end: {
      id: 'year_end', chapter: 4, emoji: '🎆',
      title: 'Year One: The Reckoning',
      echoOf: (s) => {
        if (s.flags.lent_piotr && s.flags.investing) return '⚡ Chapter 2 echo: You lent Piotr €500 AND started investing. How did both pan out?'
        if (s.flags.lent_piotr) return '⚡ Chapter 2 echo: You lent Piotr €500. He\'s repaid €300. Friendship survived — barely.'
        if (s.flags.refused_piotr && s.flags.investing) return '⚡ Chapter 2 echo: You said no to Piotr and put that €500 into investments instead. Cold — but financially sound.'
        if (s.flags.negotiated_rent) return '⚡ Chapter 1 echo: That rent negotiation saved you hundreds over the year. Small wins compound.'
        return null
      },
      text: (s) => {
        const totalMoney = s.money
        const investedStr = s.flags.investing ? ' Your ETF is up 11% — a small but real gain.' : ''
        const freelanceStr = s.flags.freelancing ? ' HR found out about the freelancing and gave you a verbal warning, but let it go.' : ''
        const piotrStr = s.flags.lent_piotr ? ' Piotr paid back €300 of the €500. You\'ve stopped expecting the rest.' : s.flags.refused_piotr ? ' Piotr barely talks to you now.' : ''
        return `One full year at TechFlow. You have €${totalMoney.toLocaleString()} in savings.${investedStr}${freelanceStr}${piotrStr}\n\nYour manager pulls you aside: "We\'re growing. We want to offer you a senior role — €3,600/month. But it means managing a team of three." More money, more responsibility. Or you could stay where you are, comfortable and coasting.`
      },
      choices: [
        { emoji: '👑', label: 'Take the senior role', detail: 'Step up. More money, more pressure.', next: 'ending_ambitious', risk: 'bold' },
        { emoji: '😌', label: 'Stay in your current role', detail: 'You\'re happy where you are.', next: (s: Stats) => s.flags.investing ? 'ending_balanced' : 'ending_comfortable' } as unknown as Choice,
      ],
    },
    ending_ambitious: {
      id: 'ending_ambitious', chapter: 4, emoji: '🏆', isEnding: true,
      endingLabel: 'The Ambitious Path', endingColor: '#FFCD00', xp: 350,
      title: 'One Year Later: Fast Mover',
      text: 'You took the senior role and never looked back. Managing three people is hard — you made mistakes early — but you grew into it fast. Your salary jumped to €3,600, and with disciplined saving you\'ve built a real cushion.\n\nYear one: done. You\'re 25, earning well above average, with savings, maybe some investments, and a career trajectory most people your age would kill for.\n\n📊 Key lesson: Early career is the cheapest time to take risks. Comfort now often means stagnation later.',
      choices: [],
      debrief: [
        { icon: '💰', title: 'Savings discipline', verdict: (s) => s.money >= 2000 ? 'great' : s.money >= 800 ? 'ok' : 'poor', commentary: { great: 'You built a real financial cushion in year one — most people spend it all.', ok: 'Modest savings, but you\'re ahead of your peers.', poor: 'Lifestyle inflation ate most of your income. Year two needs a reset.' } },
        { icon: '📈', title: 'Investing habit', verdict: (s) => s.flags.investing ? 'great' : s.flags.took_raise ? 'ok' : 'poor', commentary: { great: 'Starting early with ETFs is the single best financial move in your 20s.', ok: 'You prioritised income over returns — fine for now, revisit investing.', poor: 'No investing habit yet. Compound interest waits for no one.' } },
        { icon: '👤', title: 'Relationship with Piotr', verdict: (s) => (s.relationships.piotr ?? 70) >= 70 ? 'great' : (s.relationships.piotr ?? 70) >= 40 ? 'ok' : 'poor', commentary: { great: 'You showed up for a friend when it mattered.', ok: 'The money situation created tension, but the friendship survived.', poor: 'Saying no to Piotr cost more than money — mend that bridge.' } },
      ],
    },
    ending_balanced: {
      id: 'ending_balanced', chapter: 4, emoji: '⚖️', isEnding: true,
      endingLabel: 'The Balanced Path', endingColor: '#2D9A4E', xp: 300,
      title: 'One Year Later: Steady & Growing',
      text: 'You kept your current role but you\'ve been quietly building wealth in the background. Your ETF returns are modest but compounding. You didn\'t max your earning potential this year, but you built good habits that will carry you for decades.\n\n"Boring" financial discipline in your 20s is worth more than flashy moves in your 30s.\n\n📊 Key lesson: Consistent, automatic investing from your first paycheck is the single highest-leverage financial habit you can form.',
      choices: [],
      debrief: [
        { icon: '💰', title: 'Savings discipline', verdict: (s) => s.money >= 2500 ? 'great' : s.money >= 1000 ? 'ok' : 'poor', commentary: { great: 'Excellent savings rate for your first year.', ok: 'Decent savings, room to tighten up.', poor: 'Spending crept up. Automate savings before you can spend them.' } },
        { icon: '📈', title: 'Investing habit', verdict: () => 'great', commentary: { great: 'Auto-investing from salary day one is textbook correct. You get it.', ok: '', poor: '' } },
        { icon: '😊', title: 'Wellbeing balance', verdict: (s) => s.mood >= 70 ? 'great' : s.mood >= 45 ? 'ok' : 'poor', commentary: { great: 'High income AND high mood — the real goal.', ok: 'Financially sound, but watch the stress levels.', poor: 'Burnout risk. Money habits that ruin your health aren\'t worth it.' } },
      ],
    },
    ending_comfortable: {
      id: 'ending_comfortable', chapter: 4, emoji: '😌', isEnding: true,
      endingLabel: 'The Comfortable Path', endingColor: '#1565C0', xp: 200,
      title: 'One Year Later: Safe but Stagnant',
      text: 'Year one done. You\'re comfortable — nothing bad happened, and you learned a lot. But your savings are thinner than they could be, and you left some opportunities on the table.\n\nThe good news: you still have decades ahead of you. The bad news: the habits you form now tend to stick.\n\n📊 Key lesson: Your 20s are the highest-leverage years for financial habits. Starting a year late isn\'t catastrophic, but it has a real cost in compounding returns.',
      choices: [],
      debrief: [
        { icon: '💰', title: 'Savings discipline', verdict: (s) => s.money >= 1500 ? 'ok' : 'poor', commentary: { great: '', ok: 'You saved something — better than nothing, but aim for 20% of income.', poor: 'Almost nothing saved in year one. Automate a fixed transfer on payday.' } },
        { icon: '📈', title: 'Investing habit', verdict: (s) => s.flags.investing ? 'ok' : 'poor', commentary: { great: '', ok: 'Some investing — keep building the habit.', poor: 'No investments started. Every year you wait costs compounding returns.' } },
        { icon: '👔', title: 'Relationship with boss', verdict: (s) => (s.relationships.boss ?? 50) >= 60 ? 'great' : (s.relationships.boss ?? 50) >= 40 ? 'ok' : 'poor', commentary: { great: 'Strong rapport — this will matter at your next review.', ok: 'Professional but not close. Worth investing more here.', poor: 'Strained relationship. Start delivering above expectations consistently.' } },
      ],
    },
  },
}

// ─── Story 2: The Windfall ────────────────────────────────────

const STORY_WINDFALL: Story = {
  id: 'windfall',
  emoji: '💎',
  title: 'Sudden Windfall',
  subtitle: '€20,000 just landed in your account. Don\'t blow it.',
  color: '#FF7B25',
  duration: '~10 min',
  difficulty: 'Intermediate',
  startScene: 'inheritance',
  startStats: { money: 20000, mood: 70, stress: 30, flags: {}, relationships: { family: 65, advisor: 40 } },
  chapters: ['The News', 'The Pressure', 'The Decision', 'The Outcome'],
  characters: [
    { id: 'family', name: 'Family', emoji: '👨‍👩‍👧', color: '#FF7B25' },
    { id: 'advisor', name: 'Advisor', emoji: '🤵', color: '#1565C0' },
  ],
  scenes: {
    inheritance: {
      id: 'inheritance', chapter: 1, emoji: '📨',
      title: 'The Letter',
      text: 'A solicitor\'s letter. Your great-aunt Zofia — who you met exactly twice — has died. Unexpectedly, she left you €20,000.\n\nIt\'s the most money you\'ve ever had. Your current savings: €1,200. Your monthly salary: €2,200.\n\nYou stare at the bank notification for a full minute.\n\nFirst instinct?',
      choices: [
        { emoji: '🤫', label: 'Tell nobody. Keep it quiet.', detail: 'Information about money is dangerous.', next: 'financial_advisor', risk: 'smart', effect: { flags: { kept_secret: true } } },
        { emoji: '📣', label: 'Tell your close friends and family', detail: 'You trust them. And it\'s exciting news!', next: 'family_pressure', risk: 'bold', effect: { mood: 15, flags: { told_family: true } } },
      ],
    },
    family_pressure: {
      id: 'family_pressure', chapter: 2, emoji: '👨‍👩‍👧',
      title: 'The Asks Begin',
      text: 'Within 48 hours, the requests start.\n\nYour cousin needs €3,000 to fix his car. Your parents hint that the roof needs replacing (€8,000). Your brother has a "business opportunity" that needs €5,000 seed money.\n\nCollectively they\'re asking for €16,000 of your €20,000. Everyone frames it as an investment in family.',
      choices: [
        { emoji: '💸', label: 'Give generously — family first', detail: 'Distribute €10,000 among the requests', next: 'financial_advisor', risk: 'risky', effect: { money: -10000, mood: -10, stress: 25, flags: { gave_family: true }, relationships: { family: 30 } } },
        { emoji: '🛡️', label: 'Give a fixed amount and hold firm', detail: 'Offer €2,000 total, split however they like', next: 'financial_advisor', risk: 'smart', effect: { money: -2000, stress: 20, flags: { firm_with_family: true }, relationships: { family: -10 } } },
        { emoji: '❌', label: 'Sorry — I\'m investing all of it', detail: 'Hard boundary. Some relationships may suffer.', next: 'financial_advisor', risk: 'safe', effect: { mood: -20, stress: 10, flags: { refused_family: true }, relationships: { family: -35 } } },
      ],
    },
    financial_advisor: {
      id: 'financial_advisor', chapter: 2, emoji: '🤵',
      title: 'The "Free" Consultation',
      text: (s) => `You have €${s.money.toLocaleString()} remaining. A financial advisor at your bank calls to offer a free consultation. "These things are our specialty," he says warmly.\n\nHe recommends a managed investment fund with a 1.8% annual fee. "Our experts do all the work," he explains. He also mentions a structured product with a "guaranteed" 6% return — though the fine print reveals the guarantee has conditions.\n\nYou've read enough to know: 1.8% fees destroy long-term returns. But you don't know what to do instead.`,
      hiddenInfo: {
        buttonLabel: 'Look up this advisor before deciding',
        buttonEmoji: '🔍',
        cost: { mood: -8, stress: 5 },
        title: 'What You Dug Up',
        text: '15 minutes of searching reveals: this advisor earns 0.6% commission on every product he sells you. The "guaranteed 6%" product has a clause — the guarantee only kicks in after 10 years and only if you don\'t withdraw early. The managed fund has underperformed its benchmark index every year for 5 years.\n\nHe\'s not a bad person. He\'s just incentivised to sell, not to advise.',
        flag: 'investigated_advisor',
      },
      choices: [
        { emoji: '✍️', label: 'Sign up for the managed fund', detail: 'Easy. Expensive. Probably underperforms.', next: 'market_timing', risk: 'risky', effect: { stress: -10, flags: { managed_fund: true }, relationships: { advisor: 20 } } },
        { emoji: '📚', label: 'Do your own research first', detail: 'Spend two weeks learning before deciding', next: 'research_results', risk: 'smart', effect: { stress: 10, flags: { did_research: true }, relationships: { advisor: -5 } } },
        { emoji: '🏃', label: 'Walk out — trust nobody', detail: 'Pure paranoia, but not wrong in this case', next: 'market_timing', risk: 'bold', effect: { flags: { distrusts_advisor: true }, relationships: { advisor: -30 } } },
      ],
    },
    research_results: {
      id: 'research_results', chapter: 2, emoji: '🔍',
      title: 'What You Learned',
      text: 'Two weeks of nights reading. Here\'s what you found:\n\n• Index funds (e.g. Vanguard MSCI World) average ~7-10% annual returns over 20+ years\n• 1.8% management fees cut your final pot by 30-40% over 30 years\n• Keeping €5,000 in a high-yield savings account (4.5%) makes sense as an emergency fund\n• Tax-advantaged accounts (IKE/IKZE in Poland) let you defer capital gains tax\n\nYou feel genuinely smarter. And slightly angry that nobody taught you this at school.',
      autoNext: 'market_timing',
      onEnter: () => ({ mood: 15, stress: -5, flags: { financially_literate: true } }),
    },
    market_timing: {
      id: 'market_timing', chapter: 3, emoji: '📊',
      title: 'When to Enter the Market',
      text: (s) => `You have €${s.money.toLocaleString()} ready to invest. Markets are always moving — sometimes up, sometimes crashing. "Time in market beats timing the market," the saying goes.\n\nBut you still have to press the button at some point. The bar below shows market momentum. ${s.flags.financially_literate ? 'Your research: historically, buying at any point and holding beats waiting for the "perfect" dip.' : 'Your gut: wait for a dip. But the dip might not come.'}\n\nWhen do you pull the trigger?`,
      timingGame: {
        prompt: 'Click INVEST when the moment feels right',
        speed: 1.8,
        zones: [
          { start: 0, end: 15, label: 'Panic bottom — rare opportunity', color: '#FFCD00', emoji: '🎰', message: 'You caught a genuine market panic bottom. Rare and lucky — your investment starts at a significant discount.', next: 'property_dream', effect: { mood: 25, stress: -10, flags: { timed_market: true } } },
          { start: 15, end: 38, label: 'Below-average entry', color: '#2D9A4E', emoji: '📈', message: 'Good timing — you bought in a downturn. Not perfect, but meaningfully below average. Smart.', next: 'property_dream', effect: { mood: 15, stress: -5, flags: { timed_market: true } } },
          { start: 38, end: 62, label: 'Fair value — average entry', color: '#A8FF78', emoji: '✅', message: 'You entered at roughly fair value. Historically, this still outperforms savings accounts over 10+ years.', next: 'property_dream', effect: { mood: 5, stress: 0 } },
          { start: 62, end: 82, label: 'Slightly elevated — you hesitated', color: '#FF7B25', emoji: '😬', message: 'You waited too long. The market climbed while you deliberated. You\'re in, but at a higher price.', next: 'property_dream', effect: { stress: 10 } },
          { start: 82, end: 100, label: 'Near peak — bought the top', color: '#E63946', emoji: '😱', message: 'Classic FOMO entry. You bought near the peak. Short-term pain ahead — though long-term you\'ll likely be fine.', next: 'property_dream', effect: { mood: -10, stress: 25 } },
        ],
      },
    },
    property_dream: {
      id: 'property_dream', chapter: 3, emoji: '🏡',
      title: 'The Property Temptation',
      text: (s) => `You have €${s.money.toLocaleString()}. A friend mentions that property in a smaller Polish city is affordable — you could use this as a down payment on a studio apartment and rent it out for €500/month.\n\nThe numbers: apartment costs €90,000. You'd need €18,000 down + €3,000 closing costs. Monthly mortgage: €420. Rental income: €500. Theoretical profit: €80/month — before repairs, vacancies, taxes.\n\n${s.flags.financially_literate ? 'Your research tells you: rental yield here is ~6.7%, which is decent but illiquid. You can\'t easily sell if things go wrong.' : 'It sounds like free money. But you haven\'t fully run the numbers.'}`,
      choices: [
        { emoji: '🏠', label: 'Go for it — buy the property', detail: 'Commit to landlord life', next: 'crypto_tempt', risk: 'bold', effect: { money: -21000, stress: 20, flags: { bought_property: true } }, condition: (s) => s.money >= 21000 },
        { emoji: '📈', label: 'Invest in index funds instead', detail: 'Liquid, diversified, lower effort', next: 'crypto_tempt', risk: 'smart', effect: { mood: 5, flags: { index_investing: true } } },
        { emoji: '🏦', label: 'Split: emergency fund + ETF + wait', detail: '€5K savings, €15K ETF, keep options open', next: 'crypto_tempt', risk: 'smart', effect: { flags: { diversified: true } } },
      ],
    },
    crypto_tempt: {
      id: 'crypto_tempt', chapter: 3, emoji: '₿',
      title: 'The Signal',
      text: (s) => `Your phone lights up. A friend in a Discord group: "Bro. This new DeFi protocol is returning 340% APY. Fully audited. I already put in €3k. You NEED to get in before it moons."\n\nYou have €${s.money.toLocaleString()} at stake. ${s.flags.financially_literate || s.flags.did_research ? 'Everything you\'ve learned screams red flag. 340% APY is mathematically unsustainable.' : 'It sounds insane. But the friend-of-a-friend who got in early did make money...'}`,
      choices: [
        { emoji: '₿', label: 'YOLO in €2,000', detail: 'High risk. Probably a Ponzi. But maybe not?', next: 'two_years_later', risk: 'risky', effect: { money: -2000, stress: 25, flags: { yolo_crypto: true } } },
        { emoji: '🛑', label: 'Absolutely not', detail: 'Classic rug-pull setup. Hard no.', next: 'two_years_later', risk: 'smart', effect: { mood: 10, flags: { avoided_crypto_scam: true } } },
        { emoji: '🤏', label: 'Invest €200 — money I can lose', detail: 'Speculative allocation, capped at 1%', next: 'two_years_later', risk: 'bold', effect: { money: -200, stress: 5, flags: { small_crypto: true } } },
      ],
    },
    two_years_later: {
      id: 'two_years_later', chapter: 4, emoji: '⏩',
      title: 'Two Years Later',
      echoOf: (s) => {
        if (s.flags.managed_fund && !s.flags.investigated_advisor) return '⚡ Chapter 2 echo: You signed up for that managed fund without investigating. The fees have already cost you €800.'
        if (s.flags.investigated_advisor && s.flags.did_research) return '⚡ Chapter 2 echo: You did the research AND investigated the advisor. That saved you from two bad products — well played.'
        if (s.flags.gave_family && s.flags.yolo_crypto) return '⚡ Chapters 1–3 echo: Family gifts + the crypto gamble. Two pressure points that drained your windfall from both sides.'
        if (s.flags.kept_secret) return '⚡ Chapter 1 echo: Telling nobody about the windfall protected you from most of the pressure that arrived. Smart.'
        return null
      },
      text: (s) => {
        const crypto_note = s.flags.yolo_crypto ? '💥 The DeFi protocol rug-pulled three months after you entered. You lost the €2,000.' : s.flags.small_crypto ? '📉 The DeFi thing collapsed. You lost €200 — a lesson worth the price.' : '✅ Smart move avoiding that DeFi thing — it was a Ponzi that collapsed.'
        const invest_note = s.flags.index_investing || s.flags.diversified ? '📈 Your index funds are up 18% over two years — €2,700+ in gains.' : s.flags.managed_fund ? '📊 Your managed fund is up 9% but fees ate €800 of your gains.' : s.flags.bought_property ? '🏠 Your rental property has had two months of vacancy and a €600 boiler repair. Net income: €320 total.' : '💤 Your money sat in a savings account earning 2%. You\'ve lost ground to inflation.'
        const family_note = s.flags.gave_family ? '\n\n👨‍👩‍👧 Your cousin never repaid the car money. Your brother\'s "business" failed after six months.' : ''
        return `${crypto_note}\n\n${invest_note}${family_note}\n\nYou sit down and calculate your actual net worth.`
      },
      choices: [
        { emoji: '📊', label: 'See my final results', detail: '', next: (s: Stats) => {
          if ((s.flags.index_investing || s.flags.diversified) && !s.flags.gave_family && !s.flags.yolo_crypto) return 'ending_wise'
          if (s.flags.bought_property) return 'ending_landlord'
          if (s.flags.gave_family && s.flags.yolo_crypto) return 'ending_lessons'
          return 'ending_decent'
        } } as unknown as Choice,
      ],
    },
    ending_wise: {
      id: 'ending_wise', chapter: 4, emoji: '🧠', isEnding: true,
      endingLabel: 'The Wise Investor', endingColor: '#FFCD00', xp: 400,
      title: 'The Textbook Outcome',
      text: 'You dodged the family pressure, skipped the predatory advisor, did your research, invested in boring index funds, and avoided the obvious scam.\n\nTwo years later your €20,000 has grown to ~€24,000 — and unlike most windfalls, it\'s still intact and growing.\n\n📊 Key lesson: The winning move with a windfall is almost always: emergency fund → pay high-interest debt → boring diversified index funds. Repeat. The exciting options almost never win.',
      choices: [],
      debrief: [
        { icon: '🛡️', title: 'Resisted social pressure', verdict: (s) => !s.flags.gave_family && !s.flags.firm_with_family ? 'great' : s.flags.firm_with_family ? 'ok' : 'poor', commentary: { great: 'You kept the windfall intact — that\'s harder than it sounds when family asks.', ok: 'You gave some but held firm. Reasonable compromise.', poor: 'Family pressure cost you significantly. Protect money boundaries early.' } },
        { icon: '📈', title: 'Investment quality', verdict: (s) => s.flags.financially_literate && !s.flags.managed_fund ? 'great' : !s.flags.managed_fund ? 'ok' : 'poor', commentary: { great: 'Self-educated and chose index funds. This will compound beautifully.', ok: 'Good investment choices without the research deep-dive.', poor: 'High-fee products are wealth destroyers over time.' } },
        { icon: '🚩', title: 'Scam awareness', verdict: (s) => s.flags.avoided_crypto_scam ? 'great' : s.flags.small_crypto ? 'ok' : 'poor', commentary: { great: '340% APY is always a scam. You knew it instantly.', ok: 'You limited exposure — treating it like entertainment money is defensible.', poor: 'That DeFi protocol was a textbook rug-pull. Learn the red flags.' } },
      ],
    },
    ending_landlord: {
      id: 'ending_landlord', chapter: 4, emoji: '🔑', isEnding: true,
      endingLabel: 'The Reluctant Landlord', endingColor: '#1565C0', xp: 280,
      title: 'Property Is Complicated',
      text: 'You\'re a landlord now. It\'s not passive income — it\'s a part-time job. Repairs, tenant turnover, tax filing. Your actual yield after costs is closer to 3% than the 6% you planned for.\n\nNot a disaster. Not the slam dunk it looked like either.\n\n📊 Key lesson: Real estate has genuine advantages but "passive income" is a myth — it\'s illiquid capital doing part-time work that you have to manage.',
      choices: [],
      debrief: [
        { icon: '🏠', title: 'Property as investment', verdict: (s) => s.flags.financially_literate ? 'ok' : 'poor', commentary: { great: '', ok: 'You went in with realistic expectations. Property can work — with eyes open.', poor: '"Passive income" is a myth that property marketing sells hard. You learned the hard way.' } },
        { icon: '💧', title: 'Liquidity management', verdict: (s) => s.money >= 5000 ? 'ok' : 'poor', commentary: { great: '', ok: 'You kept some liquid reserves — smart when you have illiquid property.', poor: 'Almost all your capital is locked in bricks. One emergency and you\'re selling at a loss.' } },
        { icon: '👨‍👩‍👧', title: 'Family relationships', verdict: (s) => (s.relationships.family ?? 65) >= 60 ? 'great' : (s.relationships.family ?? 65) >= 35 ? 'ok' : 'poor', commentary: { great: 'You balanced family and finances.', ok: 'Some tension but manageable.', poor: 'The windfall created lasting friction with family.' } },
      ],
    },
    ending_decent: {
      id: 'ending_decent', chapter: 4, emoji: '📈', isEnding: true,
      endingLabel: 'Decent Outcome', endingColor: '#2D9A4E', xp: 240,
      title: 'Could\'ve Been Worse',
      text: 'You made some suboptimal moves — overpaid in fees, maybe lost some to a bad bet — but you didn\'t blow the whole thing. The money is still mostly there, still working.\n\nMost people who receive a windfall spend it within 2 years. You didn\'t. That alone puts you in the minority.\n\n📊 Key lesson: Preserving a windfall is harder than it sounds. The pressure to spend, give, and "invest" in bad ideas is enormous. You survived it.',
      choices: [],
      debrief: [
        { icon: '💰', title: 'Capital preservation', verdict: (s) => s.money >= 12000 ? 'ok' : 'poor', commentary: { great: '', ok: 'You kept most of the windfall. The starting position still matters.', poor: 'Significant capital eroded. Next windfall: park it for 30 days before ANY decisions.' } },
        { icon: '📊', title: 'Fee awareness', verdict: (s) => !s.flags.managed_fund ? 'great' : 'poor', commentary: { great: 'You avoided the high-fee trap.', ok: '', poor: '1.8% fees over 20 years will cost you tens of thousands. Always check fee structures.' } },
        { icon: '🔍', title: 'Due diligence', verdict: (s) => s.flags.investigated_advisor || s.flags.did_research ? 'great' : 'poor', commentary: { great: 'Researching before committing is a superpower most people lack.', ok: '', poor: 'Next time: 30 minutes of research before every major financial decision.' } },
      ],
    },
    ending_lessons: {
      id: 'ending_lessons', chapter: 4, emoji: '📖', isEnding: true,
      endingLabel: 'Expensive Education', endingColor: '#E63946', xp: 180,
      title: 'You Paid for the Lesson',
      text: 'Between family giving, the crypto loss, and bank fees, about €14,000 of your €20,000 has gone. €6,000 remains in savings.\n\nThat\'s still more than most people your age have saved. But the windfall that could have been a launchpad became a speed bump.\n\n📊 Key lesson: Windfalls are psychologically brutal. They attract everyone who wants your money. The single best move is to park it untouched for 30 days before making any decision — and tell nobody.',
      choices: [],
      debrief: [
        { icon: '🤐', title: 'Information security', verdict: (s) => s.flags.kept_secret ? 'great' : 'poor', commentary: { great: 'Telling nobody about the windfall was the single smartest move.', ok: '', poor: 'Sharing news of money is always a mistake. It invites pressure from people who feel entitled to it.' } },
        { icon: '🚩', title: 'Scam resistance', verdict: (s) => !s.flags.yolo_crypto ? 'great' : 'poor', commentary: { great: 'You spotted the obvious scam.', ok: '', poor: '340% APY is always a scam. No exceptions. Zero.' } },
        { icon: '💸', title: 'Family boundary setting', verdict: (s) => !s.flags.gave_family ? 'great' : 'poor', commentary: { great: 'Protecting your windfall from family pressure is hard but correct.', ok: '', poor: 'Family gifting from a windfall almost never works out. Theirs or yours.' } },
      ],
    },
  },
}

// ─── Story 3: The Side Hustle ─────────────────────────────────

const STORY_HUSTLE: Story = {
  id: 'side_hustle',
  emoji: '🚀',
  title: 'Side Hustle or Bust',
  subtitle: 'You have €3,000, a laptop, and an idea.',
  color: '#7B2D8B',
  duration: '~12 min',
  difficulty: 'Advanced',
  startScene: 'the_idea',
  startStats: { money: 3000, mood: 85, stress: 25, flags: {}, relationships: { client: 50 } },
  chapters: ['The Idea', 'Launch', 'Traction', 'Scale or Bail'],
  characters: [
    { id: 'client', name: 'First Client', emoji: '🙋', color: '#7B2D8B' },
  ],
  scenes: {
    the_idea: {
      id: 'the_idea', chapter: 1, emoji: '💡',
      title: 'The Idea',
      text: 'You\'ve been working a €2,400/month job for two years. Stable. Boring. You have €3,000 saved and an itch you can\'t scratch.\n\nThree ideas have been rattling around your head:\n\n📸 Freelance content — Social media management for local businesses. Low cost to start. Competitive market.\n\n🛍️ Dropshipping — Resell products online without holding inventory. Margins are thin; competition brutal.\n\n🎓 Online course — Teach something you know. Takes time to build. Huge margins if it works.',
      choices: [
        { emoji: '📸', label: 'Content creation agency', detail: 'B2B service, recurring revenue, relationship-driven', next: 'quit_or_stay', risk: 'smart', effect: { flags: { venture: 'content' } } },
        { emoji: '🛍️', label: 'Dropshipping store', detail: 'Product-first, ad-spend heavy, fast to launch', next: 'quit_or_stay', risk: 'risky', effect: { flags: { venture: 'dropship' } } },
        { emoji: '🎓', label: 'Online course or coaching', detail: 'Knowledge-based, high margin, slow to build audience', next: 'quit_or_stay', risk: 'bold', effect: { flags: { venture: 'course' } } },
      ],
    },
    quit_or_stay: {
      id: 'quit_or_stay', chapter: 1, emoji: '🤔',
      title: 'The Big Question',
      text: (s) => `Before you spend a zloty, you need to decide: do you do this on the side while keeping your job, or do you go all-in?\n\nYour job: €2,400/month, 8 hours a day, 40 hours a week.\nYour savings runway if you quit: ${Math.round(s.money / 1500)} months (estimating €1,500/month living costs).\n\nYour friend who went full-time says: "Having no fallback makes you work harder." Your accountant uncle says: "Keep income until revenue replaces it — ego kills startups."`,
      choices: [
        { emoji: '💼', label: 'Keep the job, hustle on weekends', detail: 'Safe. Slower. Sustainable longer.', next: 'first_spend', risk: 'safe', effect: { stress: 15, flags: { kept_job: true } } },
        { emoji: '🔥', label: 'Quit and commit fully', detail: 'You have 2 months of runway. Make it count.', next: 'first_spend', risk: 'risky', effect: { money: -2400, mood: 20, stress: 30, flags: { quit_job: true } } },
        { emoji: '💬', label: 'Negotiate part-time at your job first', detail: '20 hours/week at 60% pay while you test it', next: 'first_spend', risk: 'smart', effect: { money: -960, stress: 10, flags: { part_time: true } } },
      ],
    },
    first_spend: {
      id: 'first_spend', chapter: 2, emoji: '💸',
      title: 'The First Investment',
      text: (s) => `You have €${s.money.toLocaleString()} left. Time to spend some to make some.\n\n${s.flags.venture === 'content' ? 'Content agency path: You need a decent website and maybe some initial outreach tools. A done-for-you agency website costs €800. A template + your own time costs €50.' : s.flags.venture === 'dropship' ? 'Dropshipping path: You\'ll need a Shopify store (€30/month) plus ad spend. Most experts say you need €1,000+ to test ads properly.' : 'Course path: Recording equipment (€400), course platform (€50/month), and you need an audience to sell to first.'}`,
      choices: [
        { emoji: '💰', label: 'Spend big — proper setup from day one', detail: 'Invest €1,000-1,500 upfront', next: 'first_customer', risk: 'bold', effect: { money: -1200, stress: 10, flags: { big_spend: true } } },
        { emoji: '🪄', label: 'Bootstrap — minimum viable setup', detail: 'Spend only €100-200, figure out the rest later', next: 'first_customer', risk: 'smart', effect: { money: -150, stress: 5, flags: { bootstrapped: true } } },
      ],
    },
    first_customer: {
      id: 'first_customer', chapter: 2, emoji: '🙋',
      title: 'The First Yes',
      text: (s) => {
        const weeks = s.flags.quit_job ? 'Four weeks in' : 'Eight weeks in'
        const venture_txt = s.flags.venture === 'content' ? 'A local restaurant owner messages you on Instagram: "I saw your profile, I need help with my social media. What do you charge?"' : s.flags.venture === 'dropship' ? 'Your first sale comes in — €47 for a bamboo kitchen organizer. You net €12 after product cost and Shopify fees. It took €380 in ad spend to get here.\n\nA boutique shop owner emails asking for a custom bulk order. They ask your price.' : 'You\'ve been posting content about your expertise for weeks. One person DMs: "Do you do 1-on-1 coaching? I\'d pay for a session. What\'s your rate?"'
        return `${weeks}. ${venture_txt}\n\nThis is your first real signal. What do you charge?`
      },
      negotiate: {
        prompt: 'Set your rate for the first client',
        unit: '€',
        min: 0, max: 600, step: 25, ask: 0,
        outcomes: [
          { condition: (o) => o === 0, label: 'Free portfolio work', color: '#1565C0', emoji: '🆓', next: 'growing_pains', effect: { mood: 5, stress: 15, flags: { went_free: true }, relationships: { client: 15 } }, message: 'You\'re working for free. No income but you\'ll get a case study. It better be worth it.' },
          { condition: (o) => o <= 100, label: 'Trial rate accepted', color: '#FF7B25', emoji: '🤝', next: 'growing_pains', effect: (o: number) => ({ money: o, mood: 15, flags: { got_testimonial: true }, relationships: { client: 20 } }), message: 'Low barrier — they say yes immediately. You\'ll get a testimonial and some cash.' },
          { condition: (o) => o <= 300, label: 'Mid-market rate', color: '#2D9A4E', emoji: '✅', next: 'growing_pains', effect: (o: number) => ({ money: o, mood: 10, flags: { mid_price: true }, relationships: { client: 10 } }), message: 'They think it over and accept. Solid positioning — not cheap, not scary.' },
          { condition: (o, s) => o <= 500 && s.mood >= 70, label: 'Premium accepted!', color: '#FFCD00', emoji: '🎉', next: 'growing_pains', effect: (o: number) => ({ money: o, mood: 20, flags: { priced_high: true }, relationships: { client: 5 } }), message: 'They said yes to your premium rate. Your confidence — and prep — made the difference.' },
          { condition: (o) => o <= 500, label: 'Negotiated down', color: '#FF7B25', emoji: '🤔', next: 'growing_pains', effect: (o: number) => ({ money: Math.round(o * 0.7), mood: 5, flags: { mid_price: true }, relationships: { client: 8 } }), message: 'They pushed back and you settled for 30% less. Still a win — you have a paying client.' },
          { condition: () => true, label: 'Too expensive — lost them', color: '#E63946', emoji: '😬', next: 'growing_pains', effect: { stress: 20, mood: -10, relationships: { client: -25 } }, message: '€600 was too much too soon. They ghosted you. Back to square one.' },
        ],
      },
    },
    growing_pains: {
      id: 'growing_pains', chapter: 3, emoji: '😤',
      title: 'Month Three: The Wall',
      echoOf: (s) => {
        if (s.flags.went_free) return '⚡ Chapter 2 echo: You worked free to build portfolio. Did that free client ever refer anyone?'
        if (s.flags.priced_high) return '⚡ Chapter 2 echo: That bold pricing from Chapter 2 is setting your market positioning now. Higher floor, higher ceiling.'
        if (s.flags.quit_job && s.flags.went_free) return '⚡ Chapters 1–2 echo: You quit your job AND took a free client. You\'re burning runway with nothing coming in.'
        return null
      },
      text: (s) => {
        const income = s.flags.priced_high ? 'You landed two clients at €500/month each. €1,000 MRR. It\'s working — but slowly.' : s.flags.got_testimonial ? 'Three paying clients at various rates. Revenue: €600/month. Your testimonial is bringing in referrals.' : 'Still figuring it out. Revenue this month: €180.'
        const job_txt = s.flags.quit_job ? `\n\nWith no job, you\'re burning through savings. You have €${s.money.toLocaleString()} left. At current burn rate: ${Math.round(s.money / 1200)} months of runway.` : s.flags.part_time ? '\n\nYour part-time salary is covering your bills, which takes the pressure off slightly.' : '\n\nYour day job is covering bills. This is purely upside.'
        return `Month three. ${income}${job_txt}\n\nYou get an offer: a startup wants you to join them full-time. €3,200/month. Better than your old job. Your side hustle is early but showing signs of life.`
      },
      choices: [
        { emoji: '🤝', label: 'Take the job — side hustle is too slow', detail: 'Secure income, abandon the experiment', next: 'tax_surprise', risk: 'safe', effect: { money: 3200, mood: -10, stress: -20, flags: { took_new_job: true } } },
        { emoji: '🔥', label: 'Refuse — go harder on the hustle', detail: 'Double down. You\'re not done yet.', next: 'tax_surprise', risk: 'risky', effect: { stress: 20, mood: 15, flags: { doubled_down: true } } },
        { emoji: '⏸️', label: 'Ask for 3 months to decide', detail: 'Buy time. If revenue hits €2K/month by then, stay.', next: 'tax_surprise', risk: 'smart', effect: { flags: { delayed_decision: true } } },
      ],
    },
    tax_surprise: {
      id: 'tax_surprise', chapter: 3, emoji: '😱',
      title: 'The Tax Bill Nobody Warned You About',
      text: (s) => {
        const earned = s.flags.priced_high ? '€6,000' : s.flags.got_testimonial ? '€3,600' : '€1,800'
        return `Your accountant emails you. Turns out you\'ve been earning money without registering a business or setting aside VAT. You\'ve made ~${earned} in revenue this year.\n\nPolish tax rules: you need to file as self-employed (jednoosobowa działalność gospodarcza), pay social contributions (~€350/month), and potentially back-pay VAT if over the threshold.\n\nYou had no idea. Almost nobody tells you this when you "just start freelancing".`
      },
      choices: [
        { emoji: '📋', label: 'Hire an accountant, get it sorted properly', detail: '€150/month but total peace of mind', next: 'six_months', risk: 'smart', effect: { money: -1200, stress: -20, flags: { has_accountant: true } } },
        { emoji: '🙈', label: 'Stay under the radar, hope for the best', detail: 'Risky. Tax authorities catch up eventually.', next: 'six_months', risk: 'risky', effect: { stress: 20, flags: { tax_risk: true } } },
        { emoji: '📚', label: 'Learn it yourself and file manually', detail: 'Time-consuming but free', next: 'six_months', risk: 'bold', effect: { stress: 15, mood: -10, flags: { diy_tax: true } } },
      ],
    },
    six_months: {
      id: 'six_months', chapter: 4, emoji: '📊',
      title: 'Six Months In: The Numbers',
      text: (s) => {
        const revenue_txt = s.flags.doubled_down && s.flags.priced_high ? 'Your hustle is now generating €2,400/month. Real money.' : s.flags.took_new_job ? 'You took the new job. The side hustle ticked along part-time at €600/month.' : s.flags.got_testimonial ? 'Revenue has grown to €1,500/month through referrals.' : 'Revenue is at €800/month — enough to prove it works, not yet enough to live on.'
        const tax_txt = s.flags.tax_risk ? '\n\n⚠️ Tax authority sent a questionnaire. You\'re nervous.' : s.flags.has_accountant ? '\n\n✅ Taxes are handled. You actually know your real profit margins now.' : ''
        return `${revenue_txt}${tax_txt}\n\nSix months after launch, you face a final decision about where to take this.`
      },
      choices: [
        { emoji: '📈', label: 'Scale hard — hire a subcontractor', detail: 'Take on more clients, pay someone to help deliver', next: (s: Stats) => s.flags.doubled_down || s.flags.got_testimonial ? 'ending_founder' : 'ending_grind' } as unknown as Choice,
        { emoji: '😌', label: 'Keep it as a comfortable side income', detail: '€800-1,500/month part-time, no stress', next: 'ending_lifestyle', risk: 'safe' },
        { emoji: '🤝', label: 'Sell the client list and move on', detail: 'Cash out. Take the learnings.', next: 'ending_exit', risk: 'bold', effect: { money: 3000 } },
      ],
    },
    ending_founder: {
      id: 'ending_founder', chapter: 4, emoji: '🏆', isEnding: true,
      endingLabel: 'The Founder', endingColor: '#FFCD00', xp: 450,
      title: 'You Built Something Real',
      text: 'You hired a subcontractor, systematized your service delivery, and grew from 2 clients to 8. Monthly revenue: €5,200. Your own take-home after costs: €2,800 — matching your old salary, but now you set the hours.\n\nThis doesn\'t happen to most people who try this. You combined a real skill, smart pricing, patience through the hard months, and the discipline to handle taxes properly.\n\n📊 Key lesson: Side hustles succeed through boring execution, not magic ideas. Distribution (getting clients) is 80% of the work. The best time to raise prices is when you\'re fully booked.',
      choices: [],
      debrief: [
        { icon: '💰', title: 'Pricing strategy', verdict: (s) => s.flags.priced_high ? 'great' : s.flags.mid_price ? 'ok' : 'poor', commentary: { great: 'Bold pricing from day one set a high floor. You can always negotiate down, never up.', ok: 'Solid mid-market pricing. Raise rates as soon as you\'re fully booked.', poor: 'Free or ultra-low rates undermine your positioning. Clients assume price = quality.' } },
        { icon: '📋', title: 'Tax compliance', verdict: (s) => s.flags.has_accountant ? 'great' : s.flags.diy_tax ? 'ok' : 'poor', commentary: { great: 'Hiring an accountant was the right call. The ROI is massive.', ok: 'DIY tax filing shows discipline, but your time is worth more.', poor: 'Flying under the radar is survivorship bias. When caught, back-taxes are brutal.' } },
        { icon: '🙋', title: 'Client relationship', verdict: (s) => (s.relationships.client ?? 50) >= 60 ? 'great' : (s.relationships.client ?? 50) >= 35 ? 'ok' : 'poor', commentary: { great: 'Strong first-client relationship means referrals. That\'s your best marketing channel.', ok: 'The relationship is professional. Nurture it — one referral can double your revenue.', poor: 'Damaged first-client relationship is a missed referral engine. Always over-deliver on the first job.' } },
      ],
    },
    ending_lifestyle: {
      id: 'ending_lifestyle', chapter: 4, emoji: '☕', isEnding: true,
      endingLabel: 'Lifestyle Business', endingColor: '#2D9A4E', xp: 320,
      title: 'The Profitable Hobby',
      text: 'You didn\'t change your life, but you added €1,000+/month to it. That\'s €12,000/year invested automatically, or your holidays paid for, or a safety net that means you\'ll never have to panic about a surprise bill.\n\nMost "side hustles" fail in month two. Yours is still running. That alone puts you ahead.\n\n📊 Key lesson: A sustainable small business that funds your savings is genuinely better than a failed high-growth attempt. Not every venture needs to be a startup.',
      choices: [],
      debrief: [
        { icon: '⚖️', title: 'Work-life balance', verdict: (s) => s.flags.kept_job && s.stress <= 60 ? 'great' : s.stress <= 75 ? 'ok' : 'poor', commentary: { great: 'Kept the day job, built the side income, didn\'t burn out. That\'s the formula.', ok: 'Manageable stress — keep an eye on it as the business grows.', poor: 'High stress is unsustainable. Cut client count or systemize delivery.' } },
        { icon: '📈', title: 'Revenue growth', verdict: (s) => s.flags.got_testimonial ? 'great' : s.flags.mid_price ? 'ok' : 'poor', commentary: { great: 'Testimonial-based referrals are compounding — you\'ll keep growing without ads.', ok: 'Steady income. Now focus on raising your average client value.', poor: 'Revenue is thin. Test higher prices with new clients.' } },
        { icon: '💰', title: 'Financial position', verdict: (s) => s.money >= 2000 ? 'great' : s.money >= 500 ? 'ok' : 'poor', commentary: { great: 'Good cash reserves alongside the business. Smart.', ok: 'Modest reserves — keep 3 months of expenses in savings.', poor: 'Low cash buffer. The business needs to fund an emergency fund first.' } },
      ],
    },
    ending_grind: {
      id: 'ending_grind', chapter: 4, emoji: '😤', isEnding: true,
      endingLabel: 'The Hard Way', endingColor: '#1565C0', xp: 260,
      title: 'You\'re Still Standing',
      text: 'It was harder than you expected. Revenue grew slowly, taxes blindsided you, and there were weeks you questioned everything. But you didn\'t quit. You have a working business — small, not glamorous, but real.\n\nMost people who say "I should start something" never try. You tried AND survived the hard part.\n\n📊 Key lesson: The unsexy truth about entrepreneurship is that 90% of it is staying consistent through months where it feels pointless. The 10% who keep going become the "overnight successes".',
      choices: [],
      debrief: [
        { icon: '🔥', title: 'Resilience', verdict: () => 'great', commentary: { great: 'You hit the wall and didn\'t quit. That alone separates you from 90% of people who say they want to build something.', ok: '', poor: '' } },
        { icon: '📋', title: 'Tax preparedness', verdict: (s) => s.flags.has_accountant ? 'great' : s.flags.tax_risk ? 'poor' : 'ok', commentary: { great: 'Sorted taxes properly — foundation for scaling.', ok: 'You handled taxes yourself. Tedious but legal.', poor: 'Tax risk is a ticking clock. Sort it before the next revenue milestone.' } },
        { icon: '💡', title: 'Business model clarity', verdict: (s) => s.flags.venture === 'content' ? 'great' : 'ok', commentary: { great: 'Content agency: recurring revenue, relationship-driven, scalable. Good choice.', ok: 'Your model has merit. Keep tightening the value proposition.', poor: '' } },
      ],
    },
    ending_exit: {
      id: 'ending_exit', chapter: 4, emoji: '💰', isEnding: true,
      endingLabel: 'Smart Exit', endingColor: '#FF7B25', xp: 290,
      title: 'Know When to Fold',
      text: 'You sold your client list for €3,000 and walked away with the skills, the experience, and the cash. Sometimes the right move is a clean exit rather than grinding through a business that isn\'t your calling.\n\nYou\'re €3,000 richer, infinitely more employable, and you actually know what you\'re doing now.\n\n📊 Key lesson: Not every business needs to be a lifelong commitment. Validating an idea, learning the market, and selling the asset is a legitimate and often underrated outcome.',
      choices: [],
      debrief: [
        { icon: '🧠', title: 'Self-awareness', verdict: () => 'great', commentary: { great: 'Knowing when something isn\'t your calling and exiting cleanly is a skill most people lack.', ok: '', poor: '' } },
        { icon: '💰', title: 'Capital outcome', verdict: (s) => s.money >= 4000 ? 'great' : s.money >= 2000 ? 'ok' : 'poor', commentary: { great: 'You came out ahead financially.', ok: 'Modest profit, but the skills and experience are worth more.', poor: 'You spent more than you made — but the education is real.' } },
        { icon: '📚', title: 'Lessons learned', verdict: () => 'great', commentary: { great: 'You validated an idea, survived taxes, and built something sellable. That\'s a full MBA in 6 months.', ok: '', poor: '' } },
      ],
    },
  },
}

const STORIES: Story[] = [STORY_JOB, STORY_WINDFALL, STORY_HUSTLE]

// ─── Inline stat delta badge ──────────────────────────────────

function DeltaBadge({ delta, color }: { delta: number; color: string }) {
  const [opacity, setOpacity] = useState(1)
  useEffect(() => {
    const t1 = setTimeout(() => setOpacity(0), 1000)
    return () => clearTimeout(t1)
  }, [])
  if (delta === 0) return null
  return (
    <span style={{
      fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem',
      color, opacity, transition: 'opacity 0.6s ease',
      pointerEvents: 'none', whiteSpace: 'nowrap',
    }}>
      {delta > 0 ? `+${delta}` : delta}
    </span>
  )
}

// ─── Persistent stats panel ───────────────────────────────────

interface StatsPanelProps {
  stats: Stats
  deltas: { money: number; mood: number; stress: number; n: number }
  story: Story
  chapter: string
}

function StatsPanel({ stats, deltas, story, chapter }: StatsPanelProps) {
  const moneyFmt = stats.money >= 1000 ? `€${(stats.money / 1000).toFixed(1)}k` : `€${stats.money}`
  const moodPct  = Math.max(0, Math.min(100, stats.mood))
  const stressPct = Math.max(0, Math.min(100, stats.stress))
  const moodColor   = moodPct >= 60 ? '#2D9A4E' : moodPct >= 30 ? '#FF7B25' : '#E63946'
  const stressColor = stressPct <= 40 ? '#2D9A4E' : stressPct <= 70 ? '#FF7B25' : '#E63946'

  return (
    <div style={{
      background: paper, borderBottom: `3px solid ${ink}`,
      padding: '10px 20px',
      display: 'flex', alignItems: 'center', gap: '20px',
      flexWrap: 'wrap',
    }}>
      {/* Story / chapter */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', opacity: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{story.title}</span>
        <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.4 }}>{chapter}</span>
      </div>

      <div style={{ width: '1px', height: '32px', background: ink, opacity: 0.15, flexShrink: 0 }} />

      {/* Money */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '0.9rem' }}>💰</span>
          <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1rem', color: ink }}>{moneyFmt}</span>
          {deltas.money !== 0 && <DeltaBadge key={`m${deltas.n}`} delta={deltas.money} color={deltas.money > 0 ? '#2D9A4E' : '#E63946'} />}
        </div>
        <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.45 }}>Balance</span>
      </div>

      {/* Mood */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.55 }}>😊 Mood</span>
            {deltas.mood !== 0 && <DeltaBadge key={`md${deltas.n}`} delta={deltas.mood} color={deltas.mood > 0 ? '#2D9A4E' : '#E63946'} />}
          </div>
          <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.65rem', color: moodColor }}>{moodPct}</span>
        </div>
        <div style={{ height: '7px', borderRadius: '9999px', border: `1.5px solid ${ink}`, background: surface, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${moodPct}%`, background: moodColor, borderRadius: '9999px', transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1), background 0.4s' }} />
        </div>
      </div>

      {/* Stress */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '100px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.55 }}>😰 Stress</span>
            {deltas.stress !== 0 && <DeltaBadge key={`s${deltas.n}`} delta={deltas.stress} color={deltas.stress < 0 ? '#2D9A4E' : '#E63946'} />}
          </div>
          <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.65rem', color: stressColor }}>{stressPct}</span>
        </div>
        <div style={{ height: '7px', borderRadius: '9999px', border: `1.5px solid ${ink}`, background: surface, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${stressPct}%`, background: stressColor, borderRadius: '9999px', transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1), background 0.4s' }} />
        </div>
      </div>

      {/* Relationship meters */}
      {story.characters && story.characters.map(char => {
        const trust = Math.max(0, Math.min(100, stats.relationships[char.id] ?? 50))
        const relColor = trust >= 60 ? '#2D9A4E' : trust >= 30 ? '#FF7B25' : '#E63946'
        return (
          <div key={char.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.56rem', textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.55 }}>{char.emoji} {char.name}</span>
              <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.62rem', color: relColor }}>{trust}</span>
            </div>
            <div style={{ height: '7px', borderRadius: '9999px', border: `1.5px solid ${ink}`, background: surface, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${trust}%`, background: char.color ?? relColor, borderRadius: '9999px', transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Story Select ─────────────────────────────────────────────

function StorySelect({ onSelect }: { onSelect: (s: Story) => void }) {
  const isMobile = useIsMobile()
  const diffColor = { Beginner: '#2D9A4E', Intermediate: '#FF7B25', Advanced: '#E63946' }

  return (
    <div style={{ minHeight: '100vh', background: surface }}>
      {/* Header */}
      <div style={{ background: paper, borderBottom: `3px solid ${ink}`, padding: '20px 28px' }}>
        <Link to="/" style={{ textDecoration: 'none', color: ink, fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem', opacity: 0.6 }}>← Back</Link>
        <h1 className="text-4xl font-bold" style={{ margin: '8px 0 4px' }}>Decision Room</h1>
        <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.85rem', opacity: 0.6, margin: 0 }}>
          Choose your storyline. Every choice has consequences.
        </p>
      </div>

      {/* Story cards */}
      <div style={{ padding: isMobile ? '24px 16px' : '36px 28px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '20px', maxWidth: '1100px', margin: '0 auto' }}>
        {STORIES.map(story => (
          <button
            key={story.id}
            onClick={() => { play('click'); onSelect(story) }}
            style={{
              background: paper, border: `3px solid ${ink}`,
              borderRadius: '20px 22px 20px 21px',
              boxShadow: `6px 6px 0 ${ink}`,
              padding: '28px 24px',
              textAlign: 'left', cursor: 'pointer',
              transition: 'transform 0.12s, box-shadow 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-3px,-3px)'; e.currentTarget.style.boxShadow = `9px 9px 0 ${ink}` }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `6px 6px 0 ${ink}` }}
          >
            {/* Color strip */}
            <div style={{ height: '6px', background: story.color, borderRadius: '9999px', marginBottom: '16px', border: `2px solid ${ink}` }} />

            <div style={{ fontSize: '2.8rem', marginBottom: '10px' }}>{story.emoji}</div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.3rem', color: ink, marginBottom: '6px' }}>{story.title}</div>
            <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.82rem', opacity: 0.65, color: ink, lineHeight: 1.4, marginBottom: '18px' }}>{story.subtitle}</div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ background: story.color, border: `2px solid ${ink}`, borderRadius: '9999px', padding: '3px 12px', fontFamily: "'Fredoka One', cursive", fontSize: '0.68rem', color: '#1A0800' }}>
                {story.duration}
              </span>
              <span style={{ background: diffColor[story.difficulty], border: `2px solid ${ink}`, borderRadius: '9999px', padding: '3px 12px', fontFamily: "'Fredoka One', cursive", fontSize: '0.68rem', color: '#1A0800' }}>
                {story.difficulty}
              </span>
              <span style={{ background: surface, border: `2px solid ${ink}`, borderRadius: '9999px', padding: '3px 12px', fontFamily: "'Fredoka One', cursive", fontSize: '0.68rem', color: ink }}>
                {story.chapters.length} chapters
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Teaser */}
      <div style={{ padding: '0 28px 40px', textAlign: 'center', opacity: 0.5 }}>
        <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.78rem', color: ink }}>
          More stories coming soon — startup funding, real estate, retirement planning
        </p>
      </div>
    </div>
  )
}

// ─── Echo Banner ──────────────────────────────────────────────

function EchoBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setVisible(true)) }, [])
  return (
    <div style={{
      background: '#FFF8DC', border: `2.5px solid ${ink}`, borderRadius: '12px',
      padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px',
      boxShadow: `3px 3px 0 ${ink}`,
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(-8px)',
      transition: 'opacity 0.35s ease, transform 0.35s ease',
      animation: 'bounce-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
    }}>
      <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚡</span>
      <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.82rem', color: '#5C4000', lineHeight: 1.45, flex: 1 }}>{message}</span>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, fontSize: '1rem', padding: '0 0 0 4px', flexShrink: 0, color: ink }}>✕</button>
    </div>
  )
}

// ─── Hidden Info Button ───────────────────────────────────────

function HiddenInfoPanel({ info, onReveal, revealed }: {
  info: HiddenInfo; stats?: Stats; onReveal: () => void; revealed: boolean
}) {
  if (revealed) return (
    <div style={{ background: '#EEF6FF', border: `2.5px solid ${ink}`, borderRadius: '12px', padding: '14px 18px', boxShadow: `3px 3px 0 ${ink}`, animation: 'bounce-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '1.1rem' }}>🔍</span>
        <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem', color: ink }}>{info.title}</span>
      </div>
      <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.82rem', color: ink, lineHeight: 1.55, margin: 0, whiteSpace: 'pre-wrap' }}>{info.text}</p>
    </div>
  )

  const moodCost = info.cost.mood ?? 0
  const stressCost = info.cost.stress ?? 0
  const costParts = []
  if (moodCost) costParts.push(`${moodCost > 0 ? '+' : ''}${moodCost} Mood`)
  if (stressCost) costParts.push(`${stressCost > 0 ? '+' : ''}${stressCost} Stress`)

  return (
    <button
      onClick={onReveal}
      style={{
        background: '#EEF6FF', border: `2.5px solid ${ink}`, borderRadius: '12px',
        padding: '13px 18px', display: 'flex', alignItems: 'center', gap: '12px',
        cursor: 'pointer', width: '100%', textAlign: 'left',
        boxShadow: `3px 3px 0 ${ink}`, transition: 'transform 0.1s, box-shadow 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `5px 5px 0 ${ink}` }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `3px 3px 0 ${ink}` }}
    >
      <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{info.buttonEmoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.88rem', color: ink }}>{info.buttonLabel}</div>
        {costParts.length > 0 && <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.72rem', opacity: 0.55, marginTop: '2px' }}>Costs: {costParts.join(', ')}</div>}
      </div>
      <span style={{ opacity: 0.4, fontSize: '0.9rem' }}>→</span>
    </button>
  )
}

// ─── Negotiation Widget ───────────────────────────────────────

function NegotiationWidget({ config, stats, onSubmit }: {
  config: NegotiateConfig
  stats: Stats
  onSubmit: (offer: number, outcome: NegotiateOutcome) => void
}) {
  const [offer, setOffer] = useState(Math.round((config.min + config.max) / 2 / config.step) * config.step)
  const [result, setResult] = useState<NegotiateOutcome | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const pct = (offer - config.min) / (config.max - config.min)
  const boldness = config.ask > 0 ? Math.round((1 - offer / config.ask) * 100) : 0

  function handleSubmit() {
    if (submitted) return
    const outcome = config.outcomes.find(o => o.condition(offer, stats))!
    setResult(outcome)
    setSubmitted(true)
    setTimeout(() => onSubmit(offer, outcome), 1800)
  }

  return (
    <div style={{ background: paper, border: `3px solid ${ink}`, borderRadius: '16px', padding: '24px 22px', boxShadow: `5px 5px 0 ${ink}`, display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5, color: ink, marginBottom: '6px' }}>Negotiation</div>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1rem', color: ink }}>{config.prompt}</div>
        {config.ask > 0 && <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.78rem', opacity: 0.55, marginTop: '4px' }}>They're asking: {config.ask}{config.unit}</div>}
      </div>

      {/* Offer display */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '2.4rem', color: ink }}>{offer}{config.unit}</div>
        {config.ask > 0 && boldness > 0 && (
          <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.72rem', marginTop: '4px', color: boldness > 15 ? '#E63946' : boldness > 5 ? '#FF7B25' : '#2D9A4E', opacity: 0.8 }}>
            {boldness}% below ask — {boldness > 20 ? 'bold move' : boldness > 10 ? 'moderate push' : 'safe offer'}
          </div>
        )}
      </div>

      {/* Slider */}
      <div style={{ position: 'relative', padding: '6px 0' }}>
        <div style={{ height: '8px', borderRadius: '9999px', background: `linear-gradient(to right, #2D9A4E ${pct*100}%, rgba(0,0,0,0.1) ${pct*100}%)`, border: `1.5px solid ${ink}`, marginBottom: '8px' }} />
        <input
          type="range" min={config.min} max={config.max} step={config.step} value={offer}
          disabled={submitted}
          onChange={e => setOffer(Number(e.target.value))}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', opacity: 0, cursor: submitted ? 'default' : 'pointer', height: '20px' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Fredoka One', cursive", fontSize: '0.65rem', opacity: 0.45, color: ink }}>
          <span>{config.min}{config.unit}</span>
          <span>{config.max}{config.unit}</span>
        </div>
      </div>

      {/* Result or submit */}
      {result ? (
        <div style={{ background: result.color, border: `2.5px solid ${ink}`, borderRadius: '12px', padding: '14px 18px', textAlign: 'center', animation: 'bounce-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both', boxShadow: `3px 3px 0 ${ink}` }}>
          <div style={{ fontSize: '2rem', marginBottom: '6px' }}>{result.emoji}</div>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.1rem', color: '#1A0800', marginBottom: '6px' }}>{result.label}</div>
          <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.82rem', color: '#1A0800', lineHeight: 1.45 }}>{result.message}</div>
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          style={{ background: '#FFCD00', border: `3px solid ${ink}`, borderRadius: '9999px', padding: '14px 28px', fontFamily: "'Fredoka One', cursive", fontSize: '0.95rem', color: '#1A0800', cursor: 'pointer', boxShadow: `4px 4px 0 ${ink}`, transition: 'transform 0.1s, box-shadow 0.1s' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `6px 6px 0 ${ink}` }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0 ${ink}` }}
        >
          Lock in offer →
        </button>
      )}
    </div>
  )
}

// ─── Budget Game ─────────────────────────────────────────────

function BudgetGame({ config, stats, onSubmit }: {
  config: BudgetGameConfig
  stats: Stats
  onSubmit: (allocs: Record<string, number>) => void
}) {
  const totalAmount = typeof config.total === 'function' ? config.total(stats) : config.total
  const [allocs, setAllocs] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    config.categories.forEach((c, i) => { init[c.id] = i === 0 ? totalAmount : 0 })
    return init
  })
  const [submitted, setSubmitted] = useState(false)

  const allocated = Object.values(allocs).reduce((a, b) => a + b, 0)
  const remaining = totalAmount - allocated

  function setAlloc(id: string, value: number) {
    setAllocs(prev => {
      const capped = Math.min(value, value + remaining)
      return { ...prev, [id]: Math.max(0, capped) }
    })
  }

  function handleSubmit() {
    if (remaining !== 0 || submitted) return
    setSubmitted(true)
    setTimeout(() => onSubmit(allocs), 600)
  }

  return (
    <div style={{ background: paper, border: `3px solid ${ink}`, borderRadius: '16px', padding: '24px 22px', boxShadow: `5px 5px 0 ${ink}`, display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5, color: ink, marginBottom: '6px' }}>Budget Allocation</div>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1rem', color: ink }}>{config.prompt}</div>
      </div>

      {/* Remaining counter */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: remaining === 0 ? '#2D9A4E' : remaining < 0 ? '#E63946' : surface, border: `2px solid ${ink}`, borderRadius: '10px', padding: '10px 16px', transition: 'background 0.3s' }}>
        <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: remaining === 0 ? '#fff' : ink, opacity: remaining === 0 ? 1 : 0.7 }}>
          {remaining === 0 ? '✓ Fully allocated' : remaining > 0 ? `Unallocated:` : `Over by:`}
        </span>
        <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.2rem', color: remaining === 0 ? '#fff' : remaining > 0 ? ink : '#E63946' }}>
          {remaining !== 0 && (remaining > 0 ? '+' : '')}{remaining}{config.unit}
        </span>
      </div>

      {/* Sliders */}
      {config.categories.map(cat => {
        const val = allocs[cat.id] ?? 0
        const pct = totalAmount > 0 ? val / totalAmount : 0
        return (
          <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>{cat.emoji}</span>
                <div>
                  <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.88rem', color: ink }}>{cat.label}</div>
                  {cat.hint && <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.68rem', opacity: 0.5, color: ink }}>{cat.hint}</div>}
                </div>
              </div>
              <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1rem', color: ink, minWidth: '60px', textAlign: 'right' }}>{val}{config.unit}</span>
            </div>
            <div style={{ position: 'relative', padding: '6px 0' }}>
              <div style={{ height: '8px', borderRadius: '9999px', background: `linear-gradient(to right, #2D9A4E ${pct*100}%, rgba(0,0,0,0.08) ${pct*100}%)`, border: `1.5px solid ${ink}` }} />
              <input
                type="range" min={0} max={totalAmount} step={50} value={val}
                disabled={submitted}
                onChange={e => setAlloc(cat.id, Number(e.target.value))}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', opacity: 0, cursor: submitted ? 'default' : 'pointer', height: '20px' }}
              />
            </div>
          </div>
        )
      })}

      <button
        onClick={handleSubmit}
        disabled={remaining !== 0 || submitted}
        style={{
          background: remaining === 0 ? '#FFCD00' : surface,
          border: `3px solid ${ink}`, borderRadius: '9999px',
          padding: '14px 28px', fontFamily: "'Fredoka One', cursive", fontSize: '0.95rem',
          color: remaining === 0 ? '#1A0800' : ink, cursor: remaining === 0 ? 'pointer' : 'not-allowed',
          boxShadow: remaining === 0 ? `4px 4px 0 ${ink}` : 'none', opacity: remaining === 0 ? 1 : 0.5,
          transition: 'all 0.2s',
        }}
      >
        {remaining === 0 ? 'Commit budget →' : `Allocate ${remaining > 0 ? 'remaining ' : ''}${Math.abs(remaining)}${config.unit} first`}
      </button>
    </div>
  )
}

// ─── Timing Game ──────────────────────────────────────────────

function TimingGame({ config, onSubmit }: {
  config: TimingGameConfig
  stats?: Stats
  onSubmit: (zone: TimingZone) => void
}) {
  const [pos, setPos] = useState(0)
  const [locked, setLocked] = useState(false)
  const [result, setResult] = useState<TimingZone | null>(null)
  const rafRef = useRef<number>(0)
  const dirRef = useRef(1)
  const posRef = useRef(0)
  const speed = config.speed ?? 1.5

  useEffect(() => {
    if (locked) return
    function tick() {
      posRef.current += dirRef.current * speed
      if (posRef.current >= 100) { posRef.current = 100; dirRef.current = -1 }
      if (posRef.current <= 0) { posRef.current = 0; dirRef.current = 1 }
      setPos(Math.round(posRef.current))
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [locked, speed])

  function handleClick() {
    if (locked) return
    setLocked(true)
    const p = posRef.current
    const zone = config.zones.find(z => p >= z.start && p < z.end) ?? config.zones[config.zones.length - 1]
    setResult(zone)
    setTimeout(() => onSubmit(zone), 2000)
  }

  return (
    <div style={{ background: paper, border: `3px solid ${ink}`, borderRadius: '16px', padding: '24px 22px', boxShadow: `5px 5px 0 ${ink}`, display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5, color: ink, marginBottom: '6px' }}>Market Timing</div>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1rem', color: ink }}>{config.prompt}</div>
      </div>

      {/* Zone bar */}
      <div style={{ position: 'relative', height: '52px', borderRadius: '10px', overflow: 'hidden', border: `2.5px solid ${ink}` }}>
        {config.zones.map(z => (
          <div key={z.label} style={{
            position: 'absolute', left: `${z.start}%`, width: `${z.end - z.start}%`, height: '100%',
            background: z.color, opacity: locked ? (result?.label === z.label ? 1 : 0.35) : 0.6,
            transition: 'opacity 0.3s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '0.7rem', opacity: 0 }}>{z.emoji}</span>
          </div>
        ))}
        {/* Cursor */}
        <div style={{
          position: 'absolute', top: 0, height: '100%', width: '4px',
          background: ink, left: `${pos}%`,
          transform: 'translateX(-50%)',
          transition: locked ? 'none' : undefined,
          boxShadow: `0 0 8px ${ink}`,
        }} />
        {/* Zone labels */}
        {config.zones.map(z => (
          <div key={`lbl-${z.label}`} style={{
            position: 'absolute', left: `${z.start + (z.end - z.start) / 2}%`, top: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Fredoka One', cursive", fontSize: '0.6rem', color: '#1A0800',
            whiteSpace: 'nowrap', pointerEvents: 'none', opacity: 0.8,
          }}>{z.emoji}</div>
        ))}
      </div>

      {/* Zone legend */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {config.zones.map(z => (
          <div key={`leg-${z.label}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: z.color, border: `1px solid ${ink}` }} />
            <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.62rem', color: ink, opacity: 0.7 }}>{z.label}</span>
          </div>
        ))}
      </div>

      {/* Result card */}
      {result ? (
        <div style={{ background: result.color, border: `2.5px solid ${ink}`, borderRadius: '12px', padding: '16px 18px', textAlign: 'center', animation: 'bounce-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both', boxShadow: `3px 3px 0 ${ink}` }}>
          <div style={{ fontSize: '2rem', marginBottom: '6px' }}>{result.emoji}</div>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.1rem', color: '#1A0800', marginBottom: '6px' }}>{result.label}</div>
          <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.82rem', color: '#1A0800', lineHeight: 1.45 }}>{result.message}</div>
        </div>
      ) : (
        <button
          onClick={handleClick}
          style={{
            background: '#FFCD00', border: `3px solid ${ink}`, borderRadius: '9999px',
            padding: '16px 28px', fontFamily: "'Fredoka One', cursive", fontSize: '1rem',
            color: '#1A0800', cursor: 'pointer', boxShadow: `4px 4px 0 ${ink}`,
            transition: 'transform 0.1s, box-shadow 0.1s',
            animation: 'heartbeat 1.2s ease-in-out infinite',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `6px 6px 0 ${ink}` }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0 ${ink}` }}
        >
          INVEST NOW →
        </button>
      )}
    </div>
  )
}

// ─── Chapter Summary Overlay ──────────────────────────────────

function ChapterSummaryOverlay({ label, deltas, onDismiss }: {
  label: string
  deltas: { money: number; mood: number; stress: number }
  onDismiss: () => void
}) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(onDismiss, 3000)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const items = [
    deltas.money !== 0 ? { label: '💰 Balance', value: deltas.money, suffix: '€', good: deltas.money > 0 } : null,
    deltas.mood !== 0 ? { label: '😊 Mood', value: deltas.mood, suffix: '', good: deltas.mood > 0 } : null,
    deltas.stress !== 0 ? { label: '😰 Stress', value: deltas.stress, suffix: '', good: deltas.stress < 0 } : null,
  ].filter(Boolean) as { label: string; value: number; suffix: string; good: boolean }[]

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        padding: '0 16px 80px',
        pointerEvents: 'none',
      }}
    >
      <div
        onClick={onDismiss}
        style={{
          background: 'var(--rh-paper)', border: `3px solid var(--rh-ink)`,
          borderRadius: '20px', padding: '22px 28px',
          boxShadow: `6px 6px 0 var(--rh-ink)`,
          minWidth: '260px', maxWidth: '380px', width: '100%',
          pointerEvents: 'auto', cursor: 'pointer',
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.45, color: 'var(--rh-ink)', marginBottom: '6px' }}>
          Chapter complete
        </div>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1rem', color: 'var(--rh-ink)', marginBottom: '16px' }}>{label}</div>

        {items.length === 0 ? (
          <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.82rem', opacity: 0.55, color: 'var(--rh-ink)' }}>No stat changes this chapter.</div>
        ) : (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {items.map(item => (
              <div key={item.label} style={{
                background: item.good ? '#2D9A4E' : '#E63946',
                border: `2px solid var(--rh-ink)`, borderRadius: '10px',
                padding: '8px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                boxShadow: `2px 2px 0 var(--rh-ink)`,
              }}>
                <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.2rem', color: '#fff' }}>
                  {item.value > 0 ? '+' : ''}{item.suffix === '€' ? `€${Math.abs(item.value)}` : item.value}
                </div>
                <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>{item.label}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: '12px', fontFamily: "'Fredoka One', cursive", fontSize: '0.65rem', opacity: 0.35, color: 'var(--rh-ink)', textAlign: 'right' }}>tap to dismiss</div>
      </div>
    </div>
  )
}

// ─── Story Engine ─────────────────────────────────────────────

function StoryEngine({ story, onExit }: { story: Story; onExit: () => void }) {
  const isMobile = useIsMobile()
  const [stats, setStats] = useState<Stats>({ ...story.startStats, flags: { ...story.startStats.flags }, relationships: { ...story.startStats.relationships } })
  const [sceneId, setSceneId] = useState(story.startScene)
  const [displayedText, setDisplayedText] = useState('')
  const [textDone, setTextDone] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  // Track last stat deltas so the panel can show them (nonce forces re-mount on each choice)
  const [panelDeltas, setPanelDeltas] = useState<{ money: number; mood: number; stress: number; n: number }>({ money: 0, mood: 0, stress: 0, n: 0 })
  const [decisionLog, setDecisionLog] = useState<DecisionLogEntry[]>([])
  const [echo, setEcho] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [chapterSummary, setChapterSummary] = useState<{ label: string; deltas: { money: number; mood: number; stress: number } } | null>(null)
  const deltaNonce = useRef(0)
  const textRef = useRef('')
  const chapterStartStatsRef = useRef<Stats>({ ...story.startStats, flags: { ...story.startStats.flags }, relationships: { ...story.startStats.relationships } })
  const prevChapterRef = useRef(story.scenes[story.startScene].chapter)

  const scene = story.scenes[sceneId]
  const fullText = typeof scene.text === 'function' ? scene.text(stats) : scene.text

  // Typewriter effect
  useEffect(() => {
    setDisplayedText('')
    setTextDone(false)
    textRef.current = fullText
    let i = 0
    const speed = fullText.length > 400 ? 12 : 18
    const interval = setInterval(() => {
      if (textRef.current !== fullText) { clearInterval(interval); return }
      i++
      setDisplayedText(fullText.slice(0, i))
      if (i >= fullText.length) { setTextDone(true); clearInterval(interval) }
    }, speed)
    return () => clearInterval(interval)
  }, [sceneId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset reveal state, check echo, and detect chapter transitions on scene change
  useEffect(() => {
    setRevealed(false)
    const msg = scene.echoOf ? scene.echoOf(stats, decisionLog) : null
    setEcho(msg)
    const curChapter = scene.chapter
    const prevChapter = prevChapterRef.current
    if (curChapter > prevChapter && !scene.isEnding) {
      const start = chapterStartStatsRef.current
      setChapterSummary({
        label: story.chapters[prevChapter - 1] ?? `Chapter ${prevChapter}`,
        deltas: { money: stats.money - start.money, mood: stats.mood - start.mood, stress: stats.stress - start.stress },
      })
      chapterStartStatsRef.current = { ...stats, flags: { ...stats.flags }, relationships: { ...stats.relationships } }
    }
    prevChapterRef.current = curChapter
  }, [sceneId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-advance narrative scenes
  useEffect(() => {
    if (scene.autoNext && textDone) {
      const t = setTimeout(() => goTo(scene.autoNext!, scene.onEnter ? scene.onEnter(stats) : {}), 1200)
      return () => clearTimeout(t)
    }
  }, [textDone, sceneId]) // eslint-disable-line react-hooks/exhaustive-deps

  function applyEffect(effect: Choice['effect'], prevStats: Stats): Stats {
    if (!effect) return prevStats
    const newRel = { ...prevStats.relationships }
    if (effect.relationships) {
      for (const [k, v] of Object.entries(effect.relationships)) {
        newRel[k] = Math.min(100, Math.max(0, (newRel[k] ?? 50) + v))
      }
    }
    return {
      money:  Math.max(0, (prevStats.money  ?? 0) + (effect.money  ?? 0)),
      mood:   Math.min(100, Math.max(0, (prevStats.mood   ?? 50) + (effect.mood   ?? 0))),
      stress: Math.min(100, Math.max(0, (prevStats.stress ?? 50) + (effect.stress ?? 0))),
      flags: { ...prevStats.flags, ...(effect.flags ?? {}) },
      relationships: newRel,
    }
  }

  function goTo(nextId: string, extraEffect: Partial<Omit<Stats, 'flags'>> & { flags?: Record<string, boolean | number> } = {}) {
    if (transitioning) return
    setTransitioning(true)
    setTimeout(() => {
      setStats(prev => {
        const withEnter = applyEffect(extraEffect as Choice['effect'], prev)
        const nextScene = story.scenes[nextId]
        if (nextScene?.onEnter) {
          const enterEff = nextScene.onEnter(withEnter)
          const after = applyEffect(enterEff as Choice['effect'], withEnter)
          setPanelDeltas({ money: after.money - prev.money, mood: after.mood - prev.mood, stress: after.stress - prev.stress, n: ++deltaNonce.current })
          return after
        }
        setPanelDeltas({ money: withEnter.money - prev.money, mood: withEnter.mood - prev.mood, stress: withEnter.stress - prev.stress, n: ++deltaNonce.current })
        return withEnter
      })
      setSceneId(nextId)
      setTransitioning(false)
    }, 300)
  }

  function handleChoice(choice: Choice) {
    if (!textDone || transitioning) return
    play('click')
    setDecisionLog(prev => [...prev, { sceneId, chapter: scene.chapter, choiceLabel: choice.label, choiceEmoji: choice.emoji }])
    const nextId = typeof choice.next === 'function' ? (choice.next as (s: Stats) => string)(stats) : choice.next
    setStats(prev => {
      const after = applyEffect(choice.effect, prev)
      setPanelDeltas({ money: after.money - prev.money, mood: after.mood - prev.mood, stress: after.stress - prev.stress, n: ++deltaNonce.current })
      return after
    })
    goTo(nextId)
  }

  function handleReveal() {
    if (!scene.hiddenInfo) return
    const info = scene.hiddenInfo
    setRevealed(true)
    setStats(prev => {
      const after = applyEffect({ mood: info.cost.mood ?? 0, stress: info.cost.stress ?? 0, flags: { [info.flag]: true } }, prev)
      setPanelDeltas({ money: 0, mood: after.mood - prev.mood, stress: after.stress - prev.stress, n: ++deltaNonce.current })
      return after
    })
  }

  function handleNegotiate(offer: number, outcome: NegotiateOutcome) {
    play('click')
    setDecisionLog(prev => [...prev, { sceneId, chapter: scene.chapter, choiceLabel: `Offered ${offer}${scene.negotiate!.unit}`, choiceEmoji: outcome.emoji }])
    const effect = typeof outcome.effect === 'function' ? outcome.effect(offer) : outcome.effect
    if (effect) {
      setStats(prev => {
        const after = applyEffect(effect, prev)
        setPanelDeltas({ money: after.money - prev.money, mood: after.mood - prev.mood, stress: after.stress - prev.stress, n: ++deltaNonce.current })
        return after
      })
    }
    goTo(outcome.next)
  }

  function handleBudgetGame(allocs: Record<string, number>) {
    if (!scene.budgetGame) return
    play('click')
    const effect = scene.budgetGame.effectFn(allocs, stats)
    setDecisionLog(prev => [...prev, { sceneId, chapter: scene.chapter, choiceLabel: 'Budget allocated', choiceEmoji: '💰' }])
    setStats(prev => {
      const after = applyEffect(effect, prev)
      setPanelDeltas({ money: after.money - prev.money, mood: after.mood - prev.mood, stress: after.stress - prev.stress, n: ++deltaNonce.current })
      return after
    })
    goTo(scene.budgetGame.next)
  }

  function handleTimingGame(zone: TimingZone) {
    play('click')
    setDecisionLog(prev => [...prev, { sceneId, chapter: scene.chapter, choiceLabel: zone.label, choiceEmoji: zone.emoji }])
    if (zone.effect) {
      setStats(prev => {
        const after = applyEffect(zone.effect!, prev)
        setPanelDeltas({ money: after.money - prev.money, mood: after.mood - prev.mood, stress: after.stress - prev.stress, n: ++deltaNonce.current })
        return after
      })
    }
    goTo(zone.next)
  }

  function skipText() {
    setDisplayedText(fullText)
    setTextDone(true)
  }

  // Submit XP on ending
  useEffect(() => {
    if (!scene.isEnding) return
    const session = getSession()
    if (!session) return
    const xp = scene.xp ?? 250
    play('complete')
    submitGame({ userId: session.id, gameType: 'decision', xpEarned: xp, score: 1, total: 1, metadata: { story: story.id, ending: scene.id } })
      .then(res => { if (res.newBadges.length > 0) setTimeout(() => play('badge'), 800) })
      .catch(() => {})
  }, [scene.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const chapter = story.chapters[Math.min(scene.chapter - 1, story.chapters.length - 1)]
  const visibleChoices = (scene.choices ?? []).filter(c => !c.condition || c.condition(stats))

  return (
    <div style={{ minHeight: '100vh', background: surface, display: 'flex', flexDirection: 'column' }}>

      {/* Sticky header: back button */}
      <div style={{ background: paper, borderBottom: `2px solid ${ink}`, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px', position: 'sticky', top: 0, zIndex: 51 }}>
        <button onClick={onExit} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem', color: ink, opacity: 0.6, padding: 0, flexShrink: 0 }}>← Stories</button>
      </div>

      {/* Persistent stats panel — always visible */}
      <div style={{ position: 'sticky', top: '41px', zIndex: 50 }}>
        <StatsPanel stats={stats} deltas={panelDeltas} story={story} chapter={chapter} />
      </div>

      {/* Scene */}
      <div style={{ flex: 1, maxWidth: '720px', margin: '0 auto', width: '100%', padding: isMobile ? '24px 16px' : '40px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Chapter badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ background: story.color, border: `2px solid ${ink}`, borderRadius: '9999px', padding: '3px 14px', fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem', color: '#1A0800', boxShadow: `2px 2px 0 ${ink}` }}>
            Chapter {scene.chapter}: {chapter}
          </span>
          {scene.isEnding && (
            <span style={{ background: scene.endingColor ?? '#FFCD00', border: `2px solid ${ink}`, borderRadius: '9999px', padding: '3px 14px', fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem', color: '#1A0800', boxShadow: `2px 2px 0 ${ink}` }}>
              {scene.endingLabel}
            </span>
          )}
        </div>

        {/* Scene card */}
        <div
          style={{ background: paper, border: `3px solid ${ink}`, borderRadius: '20px 22px 20px 21px', boxShadow: `8px 8px 0 ${ink}`, overflow: 'hidden', cursor: textDone ? 'default' : 'pointer' }}
          onClick={!textDone ? skipText : undefined}
        >
          <div style={{ background: story.color, padding: '20px 24px', borderBottom: `3px solid ${ink}`, display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{ fontSize: isMobile ? '2.4rem' : '3rem' }}>{scene.emoji}</span>
            <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: isMobile ? '1.2rem' : '1.5rem', color: '#1A0800', margin: 0 }}>{scene.title}</h2>
          </div>
          <div style={{ padding: isMobile ? '20px 18px' : '28px 28px' }}>
            <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: isMobile ? '0.9rem' : '0.95rem', lineHeight: 1.7, color: ink, margin: 0, whiteSpace: 'pre-wrap' }}>
              {displayedText}
              {!textDone && <span style={{ animation: 'heartbeat 0.8s ease-in-out infinite', display: 'inline-block', marginLeft: '2px' }}>▌</span>}
            </p>
            {!textDone && (
              <div style={{ marginTop: '14px', opacity: 0.45, fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>tap to skip →</div>
            )}
          </div>
        </div>

        {/* Echo banner */}
        {echo && <EchoBanner message={echo} onDismiss={() => setEcho(null)} />}

        {/* Hidden info reveal */}
        {textDone && scene.hiddenInfo && (
          <HiddenInfoPanel info={scene.hiddenInfo} stats={stats} onReveal={handleReveal} revealed={revealed} />
        )}

        {/* Negotiation widget — replaces choices */}
        {textDone && scene.negotiate && (
          <NegotiationWidget config={scene.negotiate} stats={stats} onSubmit={handleNegotiate} />
        )}

        {/* Budget allocation mini-game */}
        {textDone && scene.budgetGame && (
          <BudgetGame config={scene.budgetGame} stats={stats} onSubmit={handleBudgetGame} />
        )}

        {/* Timing mini-game */}
        {textDone && scene.timingGame && (
          <TimingGame config={scene.timingGame} stats={stats} onSubmit={handleTimingGame} />
        )}

        {/* Choices */}
        {textDone && !scene.isEnding && !scene.negotiate && !scene.budgetGame && !scene.timingGame && visibleChoices.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'bounce-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5, color: ink }}>What do you do?</div>
            {visibleChoices.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleChoice(choice)}
                disabled={transitioning}
                style={{
                  background: paper, border: `3px solid ${ink}`,
                  borderRadius: '14px 16px 14px 15px',
                  boxShadow: `5px 5px 0 ${ink}`,
                  padding: '16px 20px',
                  display: 'flex', alignItems: 'flex-start', gap: '14px',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'transform 0.1s, box-shadow 0.1s',
                  opacity: transitioning ? 0.5 : 1,
                }}
                onMouseEnter={e => { if (!transitioning) { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `7px 7px 0 ${ink}` } }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `5px 5px 0 ${ink}` }}
              >
                <span style={{ fontSize: '1.6rem', flexShrink: 0, marginTop: '2px' }}>{choice.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '4px' }}>
                    <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.95rem', color: ink }}>{choice.label}</span>
                  </div>
                  <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.78rem', opacity: 0.65, color: ink, lineHeight: 1.4 }}>{choice.detail}</div>
                </div>
                <span style={{ fontSize: '1.1rem', flexShrink: 0, alignSelf: 'center', opacity: 0.45 }}>→</span>
              </button>
            ))}
          </div>
        )}

        {/* Ending screen */}
        {textDone && scene.isEnding && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.3s both' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { label: 'Final Balance', value: `€${stats.money.toLocaleString()}`, color: '#FFCD00' },
                { label: 'Mood', value: `${stats.mood}/100`, color: '#2D9A4E' },
                { label: 'Stress', value: `${stats.stress}/100`, color: '#E63946' },
              ].map(s => (
                <div key={s.label} style={{ background: s.color, border: `2.5px solid ${ink}`, borderRadius: '12px', padding: '14px 10px', textAlign: 'center', boxShadow: `3px 3px 0 ${ink}` }}>
                  <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.1rem', color: '#1A0800' }}>{s.value}</div>
                  <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.65, color: '#1A0800', marginTop: '3px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Debrief — expert verdict per decision area */}
            {scene.debrief && scene.debrief.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5, color: ink }}>Expert Debrief</div>
                {scene.debrief.map((item) => {
                  const v = item.verdict(stats)
                  const verdictColor = v === 'great' ? '#2D9A4E' : v === 'ok' ? '#FF7B25' : '#E63946'
                  const stars = v === 'great' ? '★★★' : v === 'ok' ? '★★☆' : '★☆☆'
                  return (
                    <div key={item.title} style={{ background: paper, border: `2.5px solid ${ink}`, borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: '12px', boxShadow: `3px 3px 0 ${ink}` }}>
                      <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{item.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem', color: ink }}>{item.title}</span>
                          <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem', color: verdictColor }}>{stars}</span>
                        </div>
                        <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.78rem', color: ink, opacity: 0.75, lineHeight: 1.45 }}>{item.commentary[v]}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => { play('click'); onExit() }}
                style={{ flex: 1, fontFamily: "'Fredoka One', cursive", fontSize: '0.95rem', padding: '14px 24px', borderRadius: '9999px', border: `3px solid ${ink}`, background: '#FFCD00', color: '#1A0800', boxShadow: `4px 4px 0 ${ink}`, cursor: 'pointer', transition: 'transform 0.1s, box-shadow 0.1s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `6px 6px 0 ${ink}` }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0 ${ink}` }}
              >Try Another Story →</button>
            </div>
          </div>
        )}
      </div>

      {/* Chapter summary overlay */}
      {chapterSummary && (
        <ChapterSummaryOverlay
          label={chapterSummary.label}
          deltas={chapterSummary.deltas}
          onDismiss={() => setChapterSummary(null)}
        />
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────

export default function Decision() {
  const [activeStory, setActiveStory] = useState<Story | null>(null)

  useEffect(() => { preload() }, [])

  if (activeStory) {
    return <StoryEngine story={activeStory} onExit={() => setActiveStory(null)} />
  }

  return <StorySelect onSelect={setActiveStory} />
}

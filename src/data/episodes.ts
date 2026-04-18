export type Mood = 'neutral' | 'happy' | 'worried' | 'shocked' | 'angry'
export type CharId = 'frog' | 'cat' | 'dog'
export type NpcId  = 'landlord' | 'banker' | 'friend' | 'narrator'
export type BgId   = 'apartment' | 'bank' | 'street'

export interface Choice {
  id:       string
  emoji:    string
  text:     string
  detail:   string
  stars:    1 | 2 | 3
  xp:       number
  next:     string
  outcome:  string
  isGood:   boolean
}

export interface Scene {
  id:          string
  bg:          BgId
  speakerType: 'player' | NpcId
  speakerName: string
  npc?:        NpcId
  npcMood:     Mood
  playerMood:  Mood
  dialogue:    string
  fact?:       string   // financial tip shown in this scene
  choices?:    Choice[]
  autoNext?:   string
  isEnding?:   boolean
}

export interface Episode {
  id:      string
  num:     number
  title:   string
  tagline: string
  theme:   string   // financial concept
  scenes:  Scene[]
}

export const CHARS: Record<CharId, { name: string; title: string; color: string; desc: string }> = {
  frog: { name: 'Freddie',  title: 'The Frog Banker',      color: '#5DC264', desc: 'By-the-book and always prepared. Never skips a budget review.' },
  cat:  { name: 'Clara',    title: 'The Cat Accountant',   color: '#FF8C42', desc: 'Sharp as her claws. Reads a balance sheet for fun on weekends.' },
  dog:  { name: 'Duke',     title: 'The Dog Hustler',      color: '#8B5E3C', desc: 'Charismatic risk-taker. Learning the hard way, one złoty at a time.' },
}

export const EPISODES: Episode[] = [
  // ── Episode 1 ────────────────────────────────────────────────────
  {
    id:      'ep1',
    num:     1,
    title:   'The Rent Squeeze',
    tagline: 'Three months upfront?! That\'s highway robbery, pal!',
    theme:   'Emergency Funds',
    scenes: [
      {
        id: 'intro',
        bg: 'apartment',
        speakerType: 'narrator',
        speakerName: 'Narrator',
        npc: 'narrator',
        npcMood: 'neutral',
        playerMood: 'happy',
        dialogue: 'Our hero has just scored a brand-new apartment in Warsaw! Life is looking UP... until there\'s a knock at the door.',
        autoNext: 'landlord',
      },
      {
        id: 'landlord',
        bg: 'apartment',
        speakerType: 'landlord',
        speakerName: 'Mr. Pigsworth (Landlord)',
        npc: 'landlord',
        npcMood: 'neutral',
        playerMood: 'shocked',
        dialogue: 'Aaaah, the new tenant! Welcome, welcome. Now — I\'ll need THREE months rent upfront. That\'s 4,500 złoty. Cash. By tomorrow morning.',
        choices: [
          {
            id: 'use_pko',
            emoji: '🏦',
            text: 'Use my PKO savings account',
            detail: 'I built an emergency fund for exactly this.',
            stars: 3, xp: 150,
            next: 'scene_pko',
            outcome: 'Your PKO account had it covered — plus you earned interest while saving! Mr. Pigsworth is quietly impressed.',
            isGood: true,
          },
          {
            id: 'ask_parents',
            emoji: '📱',
            text: 'Call my parents for help',
            detail: 'I\'ll pay them back... eventually.',
            stars: 2, xp: 80,
            next: 'scene_parents',
            outcome: 'Mum came through — but now you\'re going to every family event for the next three years. Every. Single. One.',
            isGood: false,
          },
          {
            id: 'payday_loan',
            emoji: '😈',
            text: 'Get a quick payday loan',
            detail: '\"Only\" 180% APR. Basically free money, right?',
            stars: 1, xp: 30,
            next: 'scene_loan',
            outcome: 'That 4,500 zł loan will cost 8,100 zł total to repay. The landlord got paid. Your wallet got wrecked.',
            isGood: false,
          },
        ],
      },
      {
        id: 'scene_pko',
        bg: 'bank',
        speakerType: 'banker',
        speakerName: 'PKO Teller',
        npc: 'banker',
        npcMood: 'happy',
        playerMood: 'happy',
        dialogue: 'Excellent! Your emergency fund had this covered. You\'d been saving at 4.5% interest — that money was working hard while it waited for you!',
        fact: '💡 An emergency fund should cover 3–6 months of expenses. Keep it in a high-interest savings account like PKO.',
        autoNext: 'end_good',
      },
      {
        id: 'scene_parents',
        bg: 'apartment',
        speakerType: 'narrator',
        speakerName: 'Mum (on video call)',
        npc: 'narrator',
        npcMood: 'neutral',
        playerMood: 'worried',
        dialogue: '"Of course I\'ll help, skarbie! But you\'re coming to Christmas. AND Easter. AND Bartek\'s wedding. AND his christening. We\'ll call it even." 😬',
        fact: '💡 Borrowing from family strains relationships. A monthly savings habit — even 200 zł — builds your own buffer in under 2 years.',
        autoNext: 'end_medium',
      },
      {
        id: 'scene_loan',
        bg: 'street',
        speakerType: 'narrator',
        speakerName: 'Narrator',
        npc: 'narrator',
        npcMood: 'angry',
        playerMood: 'worried',
        dialogue: 'The loan shark smiled. Our hero got the apartment — but every month, a huge chunk of their salary vanishes into repayments. The debt spiral begins...',
        fact: '💡 Payday loans can exceed 1000% APR. Banks like PKO offer personal loans from 8–12% APR — always compare before signing anything.',
        autoNext: 'end_bad',
      },
      {
        id: 'end_good',
        bg: 'apartment',
        speakerType: 'narrator',
        speakerName: 'Narrator',
        npc: 'narrator',
        npcMood: 'happy',
        playerMood: 'happy',
        dialogue: 'PERFECT ENDING! Emergency fund: used correctly. Apartment: secured. Dignity: intact. Mr. Pigsworth gave you a little nod of respect. That\'s worth more than money.',
        isEnding: true,
      },
      {
        id: 'end_medium',
        bg: 'apartment',
        speakerType: 'narrator',
        speakerName: 'Narrator',
        npc: 'narrator',
        npcMood: 'neutral',
        playerMood: 'neutral',
        dialogue: 'NOT BAD! You got the apartment, but you\'re in family debt now. The move: start a dedicated savings account TODAY. Even 300 zł/month builds a cushion in 15 months.',
        isEnding: true,
      },
      {
        id: 'end_bad',
        bg: 'street',
        speakerType: 'narrator',
        speakerName: 'Narrator',
        npc: 'narrator',
        npcMood: 'shocked',
        playerMood: 'worried',
        dialogue: 'LEARNING MOMENT! Payday loans are designed to trap you. Open a PKO savings account TODAY and set up an automatic monthly transfer. Future you will be so grateful.',
        isEnding: true,
      },
    ],
  },

  // ── Episode 2 ────────────────────────────────────────────────────
  {
    id:      'ep2',
    num:     2,
    title:   'The Crypto Bro',
    tagline: 'Trust me bro, MoonSquirrel Coin is going 10,000x!',
    theme:   'Investment Red Flags',
    scenes: [
      {
        id: 'intro',
        bg: 'street',
        speakerType: 'narrator',
        speakerName: 'Narrator',
        npc: 'narrator',
        npcMood: 'neutral',
        playerMood: 'neutral',
        dialogue: 'A familiar figure approaches. Eyes wild. Laptop open. Reeking of energy drinks and misplaced confidence. It\'s your "friend" Kacper.',
        autoNext: 'pitch',
      },
      {
        id: 'pitch',
        bg: 'street',
        speakerType: 'friend',
        speakerName: 'Kacper (Your "Friend")',
        npc: 'friend',
        npcMood: 'happy',
        playerMood: 'shocked',
        dialogue: 'BRO. BROOOOO. Listen. MoonSquirrel Coin. It\'s the next Bitcoin. Anonymous dev team. No whitepaper. But the vibe is IMMACULATE. I just need 2,000 złoty. Trust me bro.',
        choices: [
          {
            id: 'research',
            emoji: '🔍',
            text: 'Research it first',
            detail: 'If it\'s a sure thing, it\'ll still be a sure thing tomorrow.',
            stars: 3, xp: 150,
            next: 'scene_research',
            outcome: 'You found 47 "MoonSquirrel Coin is a SCAM" articles. The "dev team" was a meme account with 8 followers. Bullet. Dodged.',
            isGood: true,
          },
          {
            id: 'small_bet',
            emoji: '🪙',
            text: 'Invest only 200 zł — what I can lose',
            detail: 'Treat it like a lottery ticket.',
            stars: 2, xp: 90,
            next: 'scene_small',
            outcome: 'It went to zero. BUT: you only risked what you planned to lose. That\'s the rule — and you followed it.',
            isGood: false,
          },
          {
            id: 'all_in',
            emoji: '💸',
            text: 'ALL IN! 2,000 złoty, let\'s go!',
            detail: '10,000x means 20 million złoty...',
            stars: 1, xp: 20,
            next: 'scene_yolo',
            outcome: 'MoonSquirrel Coin rugged in 48 hours. Kacper has blocked you on every platform. You have lost 2,000 zł.',
            isGood: false,
          },
        ],
      },
      {
        id: 'scene_research',
        bg: 'street',
        speakerType: 'narrator',
        speakerName: 'Narrator',
        npc: 'narrator',
        npcMood: 'happy',
        playerMood: 'happy',
        dialogue: 'No whitepaper. Anonymous team. Promises of "guaranteed gains." Three classic scam signals avoided! Research is the most powerful financial tool you have.',
        fact: '💡 Before investing: check for a real whitepaper, named team, audited code. "Guaranteed returns" is always a red flag — even from friends.',
        autoNext: 'end_good',
      },
      {
        id: 'scene_small',
        bg: 'street',
        speakerType: 'narrator',
        speakerName: 'Narrator',
        npc: 'narrator',
        npcMood: 'neutral',
        playerMood: 'worried',
        dialogue: 'Your 200 zł is gone. But here\'s the thing — you followed the golden rule: never invest more than you can afford to lose 100%. You learned cheaply. That\'s something.',
        fact: '💡 For speculative assets, the "afford to lose it all" rule is non-negotiable. Diversify: keep most savings in low-risk instruments.',
        autoNext: 'end_medium',
      },
      {
        id: 'scene_yolo',
        bg: 'street',
        speakerType: 'narrator',
        speakerName: 'Narrator',
        npc: 'narrator',
        npcMood: 'shocked',
        playerMood: 'shocked',
        dialogue: 'Rug pull. Everything gone. Kacper is in Bali now. The lesson costs 2,000 zł this time — but the same lesson applied to a mortgage could cost you everything.',
        fact: '💡 "Rug pulls" happen when creators abandon a project and take investor funds. DYOR: Do Your Own Research — always.',
        autoNext: 'end_bad',
      },
      {
        id: 'end_good',
        bg: 'street',
        speakerType: 'narrator',
        speakerName: 'Narrator',
        npc: 'narrator',
        npcMood: 'happy',
        playerMood: 'happy',
        dialogue: 'INVESTOR OF THE YEAR! You used critical thinking, spotted the red flags, and kept your money safe. Financial literacy isn\'t about saying no — it\'s about asking the right questions.',
        isEnding: true,
      },
      {
        id: 'end_medium',
        bg: 'street',
        speakerType: 'narrator',
        speakerName: 'Narrator',
        npc: 'narrator',
        npcMood: 'neutral',
        playerMood: 'neutral',
        dialogue: 'LESSON LEARNED! Position sizing saved you. Next level: research BEFORE investing anything — even small amounts. Knowledge is the best compound interest.',
        isEnding: true,
      },
      {
        id: 'end_bad',
        bg: 'street',
        speakerType: 'narrator',
        speakerName: 'Narrator',
        npc: 'narrator',
        npcMood: 'shocked',
        playerMood: 'worried',
        dialogue: 'EXPENSIVE EDUCATION! Pump-and-dump schemes are as old as money itself. You know now. Build back slowly: diversify, research, and never invest more than you can lose.',
        isEnding: true,
      },
    ],
  },

  // ── Episode 3 ────────────────────────────────────────────────────
  {
    id:      'ep3',
    num:     3,
    title:   'The Suspicious Email',
    tagline: 'Dear Customer, your account needs urgent verification... 🚨',
    theme:   'Phishing & Fraud',
    scenes: [
      {
        id: 'intro',
        bg: 'apartment',
        speakerType: 'narrator',
        speakerName: 'Narrator',
        npc: 'narrator',
        npcMood: 'neutral',
        playerMood: 'neutral',
        dialogue: 'You sit down with your morning coffee. An email arrives. "PKO BANK SECURITY ALERT — Your account has been suspended. Click here to verify immediately."',
        autoNext: 'email',
      },
      {
        id: 'email',
        bg: 'apartment',
        speakerType: 'narrator',
        speakerName: 'The Email',
        npc: 'narrator',
        npcMood: 'angry',
        playerMood: 'worried',
        dialogue: 'FROM: security@pko-bank-secure-verify.ru\n"Your account will be PERMANENTLY CLOSED in 24 hours unless you verify your login credentials and card number at: pko-secure-bank.ru/login"',
        choices: [
          {
            id: 'report',
            emoji: '🚨',
            text: 'Report it as phishing',
            detail: 'Something is very off about this email.',
            stars: 3, xp: 150,
            next: 'scene_report',
            outcome: 'You spotted the fake domain (.ru, not .pl), the urgency pressure, and the request for credentials. Classic phishing. You saved yourself.',
            isGood: true,
          },
          {
            id: 'call_bank',
            emoji: '📞',
            text: 'Call PKO directly to verify',
            detail: 'I\'ll check with the bank using their official number.',
            stars: 2, xp: 100,
            next: 'scene_call',
            outcome: 'PKO confirmed: they never ask for credentials by email. The email was fake. Calling to verify was exactly right!',
            isGood: true,
          },
          {
            id: 'click_link',
            emoji: '🔗',
            text: 'Click the link to check',
            detail: 'It does look official... sort of.',
            stars: 1, xp: 20,
            next: 'scene_phished',
            outcome: 'You entered your credentials on the fake site. Within minutes, your account was accessed. You\'ve been phished.',
            isGood: false,
          },
        ],
      },
      {
        id: 'scene_report',
        bg: 'apartment',
        speakerType: 'banker',
        speakerName: 'PKO Security Team',
        npc: 'banker',
        npcMood: 'happy',
        playerMood: 'happy',
        dialogue: 'You reported it! Red flags: ".ru" domain (PKO uses .pl), urgency pressure, request for credentials. Banks NEVER ask for passwords or card numbers by email. Ever.',
        fact: '💡 Check: sender domain, look for urgency/threats, hover links before clicking. Real banks have direct phone lines — use them.',
        autoNext: 'end_good',
      },
      {
        id: 'scene_call',
        bg: 'apartment',
        speakerType: 'banker',
        speakerName: 'PKO Support (Real)',
        npc: 'banker',
        npcMood: 'happy',
        playerMood: 'happy',
        dialogue: '"Thank you for calling! Yes, that email is a phishing attempt. We NEVER ask for your credentials by email. We\'ve flagged this domain. Your instinct was correct!"',
        fact: '💡 When in doubt, call your bank directly using the number on their official website or the back of your card — never the number in the suspicious email.',
        autoNext: 'end_medium',
      },
      {
        id: 'scene_phished',
        bg: 'apartment',
        speakerType: 'narrator',
        speakerName: 'Narrator',
        npc: 'narrator',
        npcMood: 'shocked',
        playerMood: 'shocked',
        dialogue: 'Your screen froze. Then: an SMS — "Transaction of 3,200 zł approved." Panic. You call PKO immediately to freeze the account. Phishing attacks happen every 39 seconds globally.',
        fact: '💡 If phished: call your bank IMMEDIATELY, freeze your card, change passwords. Act within minutes — every second counts.',
        autoNext: 'end_bad',
      },
      {
        id: 'end_good',
        bg: 'apartment',
        speakerType: 'narrator',
        speakerName: 'Narrator',
        npc: 'narrator',
        npcMood: 'happy',
        playerMood: 'happy',
        dialogue: 'FRAUD FIGHTER! You spotted all three red flags: suspicious domain, artificial urgency, credential request. Share this knowledge — phishing catches smart people too.',
        isEnding: true,
      },
      {
        id: 'end_medium',
        bg: 'apartment',
        speakerType: 'narrator',
        speakerName: 'Narrator',
        npc: 'narrator',
        npcMood: 'happy',
        playerMood: 'happy',
        dialogue: 'SMART MOVE! Calling to verify is always correct. You were a bit slow spotting the domain, but your caution saved you. Keep honing those fraud-detection instincts!',
        isEnding: true,
      },
      {
        id: 'end_bad',
        bg: 'apartment',
        speakerType: 'narrator',
        speakerName: 'Narrator',
        npc: 'narrator',
        npcMood: 'shocked',
        playerMood: 'worried',
        dialogue: 'EXPENSIVE LESSON! You acted fast calling PKO — that minimized the damage. Now you know: urgency + credential request + weird domain = phishing. Always. No exceptions.',
        isEnding: true,
      },
    ],
  },
]

// Quiz question banks per white-label theme.

import type { OrgTheme } from '../contexts/OrgContext'

export interface QuizQuestion {
  question: string
  options: string[]
  correct: number
  explanation: string
  xp: number
}

export interface QuizContent {
  title: string
  subtitle: string
  questions: QuizQuestion[]
}

const FINANCE_QUESTIONS: QuizQuestion[] = [
  {
    question: 'What is compound interest?',
    options: [
      'Interest paid only on the original principal',
      'Interest calculated on principal AND accumulated interest',
      'A fixed monthly fee charged by banks',
      'Interest that decreases over time',
    ],
    correct: 1,
    explanation: 'Compound interest grows on itself — you earn interest on your interest, creating exponential growth over time.',
    xp: 100,
  },
  {
    question: 'The 50/30/20 budgeting rule divides your income into:',
    options: [
      '50% savings, 30% needs, 20% wants',
      '50% housing, 30% food, 20% transport',
      '50% needs, 30% wants, 20% savings',
      '50% investments, 30% needs, 20% fun',
    ],
    correct: 2,
    explanation: '50% for needs (rent, food), 30% for wants (entertainment), 20% for savings and debt repayment.',
    xp: 100,
  },
  {
    question: 'How many months of expenses should a basic emergency fund cover?',
    options: ['1 month', '2 months', '3–6 months', '12+ months'],
    correct: 2,
    explanation: 'Experts recommend 3–6 months of living expenses as a buffer against job loss or unexpected costs.',
    xp: 100,
  },
  {
    question: 'What is the key difference between a debit and credit card?',
    options: [
      'Debit cards have higher spending limits',
      'Credit cards use your own money; debit cards borrow',
      'Debit cards draw from your account; credit cards borrow from the bank',
      'There is no practical difference',
    ],
    correct: 2,
    explanation: 'A debit card spends money you already have. A credit card borrows money you must repay — often with interest.',
    xp: 100,
  },
  {
    question: 'What does APR stand for in finance?',
    options: [
      'Annual Percentage Rate',
      'Adjusted Payment Ratio',
      'Average Profit Return',
      'Allocated Principal Reserve',
    ],
    correct: 0,
    explanation: 'APR (Annual Percentage Rate) is the yearly cost of borrowing including fees. Higher APR = more expensive loan.',
    xp: 100,
  },
]

const LEGAL_QUESTIONS: QuizQuestion[] = [
  {
    question: 'Under PSD2, how long do you have to dispute an unauthorised card transaction?',
    options: ['48 hours', '30 days', '6 months', '13 months'],
    correct: 3,
    explanation: 'PSD2 guarantees 13 months from the debit date to report unauthorised transactions. Any shorter deadline in a bank\'s T&Cs is unenforceable.',
    xp: 100,
  },
  {
    question: 'How long does a company have to respond to a GDPR Subject Access Request?',
    options: ['7 days', '14 days', '30 days (one month)', '90 days'],
    correct: 2,
    explanation: 'The default is one month. Complex requests can be extended by two additional months, but the controller must notify you within the first month.',
    xp: 100,
  },
  {
    question: 'Which Polish body handles consumer complaints against banks and insurers for free?',
    options: ['UOKiK', 'Rzecznik Finansowy', 'KNF', 'NBP'],
    correct: 1,
    explanation: 'Rzecznik Finansowy (Financial Ombudsman) handles individual financial disputes for free. UOKiK tackles systemic consumer-protection violations.',
    xp: 100,
  },
  {
    question: 'For most distance-sold consumer credit, what is the EU-mandated cooling-off period?',
    options: ['3 days', '7 days', '14 days', '30 days'],
    correct: 2,
    explanation: 'EU Consumer Credit Directive 2023/2225 guarantees 14 days to withdraw from a credit agreement without reason — just pay back any amount drawn down.',
    xp: 100,
  },
  {
    question: 'MiCA is the EU regulation governing:',
    options: [
      'Medical device approvals',
      'Crypto-asset markets and issuers',
      'Military cybersecurity',
      'Marine insurance contracts',
    ],
    correct: 1,
    explanation: 'MiCA (Markets in Crypto-Assets) — in force from 2024 — harmonises rules for crypto issuers, exchanges, and stablecoins across the EU.',
    xp: 100,
  },
]

export const FINANCE_QUIZ: QuizContent = {
  title: 'Quick Rounds',
  subtitle: 'Test your financial savvy',
  questions: FINANCE_QUESTIONS,
}

export const LEGAL_QUIZ: QuizContent = {
  title: 'Rights Rounds',
  subtitle: 'Test your consumer-rights knowledge',
  questions: LEGAL_QUESTIONS,
}

export function getQuizContent(theme: OrgTheme): QuizContent {
  return theme === 'legal' ? LEGAL_QUIZ : FINANCE_QUIZ
}

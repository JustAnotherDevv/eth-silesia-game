import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { submitGame } from '../lib/api'
import { getSession } from '../lib/session'

// ── Questions ─────────────────────────────────────────────────
const QUESTIONS = [
  {
    question: "What is compound interest?",
    options: [
      "Interest paid only on the original principal",
      "Interest calculated on principal AND accumulated interest",
      "A fixed monthly fee charged by banks",
      "Interest that decreases over time",
    ],
    correct: 1,
    explanation: "Compound interest grows on itself — you earn interest on your interest, creating exponential growth over time.",
    xp: 100,
  },
  {
    question: "The 50/30/20 budgeting rule divides your income into:",
    options: [
      "50% savings, 30% needs, 20% wants",
      "50% housing, 30% food, 20% transport",
      "50% needs, 30% wants, 20% savings",
      "50% investments, 30% needs, 20% fun",
    ],
    correct: 2,
    explanation: "50% for needs (rent, food), 30% for wants (entertainment), 20% for savings and debt repayment.",
    xp: 100,
  },
  {
    question: "How many months of expenses should a basic emergency fund cover?",
    options: ["1 month", "2 months", "3–6 months", "12+ months"],
    correct: 2,
    explanation: "Experts recommend 3–6 months of living expenses as a buffer against job loss or unexpected costs.",
    xp: 100,
  },
  {
    question: "What is the key difference between a debit and credit card?",
    options: [
      "Debit cards have higher spending limits",
      "Credit cards use your own money; debit cards borrow",
      "Debit cards draw from your account; credit cards borrow from the bank",
      "There is no practical difference",
    ],
    correct: 2,
    explanation: "A debit card spends money you already have. A credit card borrows money you must repay — often with interest.",
    xp: 100,
  },
  {
    question: "What does APR stand for in finance?",
    options: [
      "Annual Percentage Rate",
      "Adjusted Payment Ratio",
      "Average Profit Return",
      "Allocated Principal Reserve",
    ],
    correct: 0,
    explanation: "APR (Annual Percentage Rate) is the yearly cost of borrowing including fees. Higher APR = more expensive loan.",
    xp: 100,
  },
]

const GRADES = [
  { min: 5, label: 'Financial Genius', emoji: '🌟', color: '#FFCD00' },
  { min: 4, label: 'Sharp Investor',   emoji: '🎩', color: '#2D9A4E' },
  { min: 3, label: 'Getting There',    emoji: '🪙', color: '#1565C0' },
  { min: 2, label: 'Keep Studying',    emoji: '💸', color: '#FF7B25' },
  { min: 0, label: 'Hit The Books',    emoji: '📚', color: '#E63946' },
]

const OPTION_LABELS = ['A', 'B', 'C', 'D']
const TIMER_MAX = 30
const ink = 'var(--rh-ink)'

type Phase = 'intro' | 'playing' | 'answered' | 'results'

export default function Quiz() {
  const [phase, setPhase]         = useState<Phase>('intro')
  const [qIdx, setQIdx]           = useState(0)
  const [selected, setSelected]   = useState<number | null>(null)
  const [timeLeft, setTimeLeft]   = useState(TIMER_MAX)
  const [totalXP, setTotalXP]     = useState(0)
  const [correct, setCorrect]     = useState(0)
  const [xpPop, setXpPop]         = useState<number | null>(null)

  // ── Submit to API on results ────────────────────────────────
  useEffect(() => {
    if (phase !== 'results') return
    const session = getSession()
    if (!session) return
    submitGame({ userId: session.id, gameType: 'quiz', xpEarned: totalXP, score: correct, total: QUESTIONS.length }).catch(() => {})
  }, [phase])

  // ── Timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return
    if (timeLeft <= 0) { handleAnswer(null); return }
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, timeLeft])

  // ── Actions ─────────────────────────────────────────────────
  function startQuiz() {
    setPhase('playing'); setQIdx(0); setSelected(null)
    setTimeLeft(TIMER_MAX); setTotalXP(0); setCorrect(0); setXpPop(null)
  }

  function handleAnswer(optionIdx: number | null) {
    if (phase !== 'playing') return
    setPhase('answered')
    setSelected(optionIdx)
    const q = QUESTIONS[qIdx]
    const isCorrect = optionIdx === q.correct
    if (isCorrect) {
      const bonus = Math.round((timeLeft / TIMER_MAX) * 50)
      const earned = q.xp + bonus
      setTotalXP(prev => prev + earned)
      setCorrect(prev => prev + 1)
      setXpPop(earned)
    }
    setTimeout(() => {
      setXpPop(null)
      if (qIdx < QUESTIONS.length - 1) {
        setQIdx(i => i + 1); setSelected(null)
        setTimeLeft(TIMER_MAX); setPhase('playing')
      } else {
        setPhase('results')
      }
    }, 2200)
  }

  const grade = GRADES.find(g => correct >= g.min)!
  const timerPct = (timeLeft / TIMER_MAX) * 100
  const timerColor = timeLeft <= 8 ? '#E63946' : timeLeft <= 15 ? '#FF7B25' : '#2D9A4E'

  // ── Shared card wrapper ─────────────────────────────────────
  const page = (children: React.ReactNode) => (
    <div style={{
      minHeight: '100vh',
      background: 'var(--rh-surface)',
      backgroundImage: 'radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px), radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px)',
      backgroundSize: '22px 22px', backgroundPosition: '0 0, 11px 11px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px 60px',
    }}>
      <div style={{
        width: '100%', maxWidth: '680px',
        background: 'var(--rh-paper)',
        border: `3px solid ${ink}`,
        borderRadius: '2.2rem 2rem 2.2rem 2.1rem',
        boxShadow: `8px 8px 0 ${ink}, 13px 13px 0 color-mix(in srgb, ${ink} 18%, transparent)`,
        overflow: 'hidden',
        backgroundImage: 'radial-gradient(circle, var(--rh-body-dot) 0.8px, transparent 0.8px)',
        backgroundSize: '16px 16px',
      }}>{children}</div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════
  // INTRO
  // ══════════════════════════════════════════════════════════════
  if (phase === 'intro') return page(
    <div style={{ padding: '40px 36px', textAlign: 'center' }}>
      <span style={{
        display: 'inline-block',
        background: '#FFCD00', color: '#1A0800',
        fontFamily: "'Fredoka One', cursive",
        fontSize: '0.65rem', letterSpacing: '0.14em',
        padding: '3px 14px', borderRadius: '9999px',
        border: `2px solid ${ink}`, boxShadow: `2px 2px 0 ${ink}`,
        marginBottom: '20px',
      }}>Quick Rounds</span>

      <div style={{ fontSize: '5rem', marginBottom: '12px' }} className="rh-animate-float">🎯</div>

      <h1 style={{
        fontFamily: "'Fredoka One', cursive",
        fontSize: 'clamp(2rem, 5vw, 3rem)',
        lineHeight: 1.05, marginBottom: '10px',
      }}>The Financial Intelligence Test</h1>

      <p style={{
        fontFamily: "'Fredoka Variable', sans-serif",
        fontWeight: 500, fontSize: '0.95rem',
        lineHeight: 1.6, opacity: 0.75, marginBottom: '28px',
      }}>
        5 questions. 30 seconds each.<br />
        Answer fast for a speed bonus. Think slow, pay the price.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '32px' }}>
        {[['5', 'Questions'], ['30s', 'Per question'], ['+550', 'XP available']].map(([val, label]) => (
          <div key={label} style={{
            border: `2px solid ${ink}`, borderRadius: '1rem',
            padding: '10px 18px', boxShadow: `3px 3px 0 ${ink}`,
            background: 'var(--rh-card)',
          }}>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.5rem', lineHeight: 1 }}>{val}</div>
            <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.55 }}>{label}</div>
          </div>
        ))}
      </div>

      <Btn accent="#FFCD00" onClick={startQuiz} big>Start Quiz →</Btn>

      <div style={{ marginTop: '16px' }}>
        <Link to="/" style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.75rem', opacity: 0.45, textDecoration: 'underline', color: 'var(--rh-ink)' }}>
          ← Back to Gazette
        </Link>
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════
  // RESULTS
  // ══════════════════════════════════════════════════════════════
  if (phase === 'results') return page(
    <div style={{ padding: '40px 36px', textAlign: 'center' }}>
      <div style={{ fontSize: '4.5rem', marginBottom: '8px' }} className="rh-animate-bounce-in">{grade.emoji}</div>

      <div style={{
        display: 'inline-block',
        background: grade.color, color: '#1A0800',
        fontFamily: "'Fredoka One', cursive",
        fontSize: '0.72rem', letterSpacing: '0.14em',
        padding: '3px 14px', borderRadius: '9999px',
        border: `2px solid ${ink}`, boxShadow: `2px 2px 0 ${ink}`,
        marginBottom: '14px',
      }}>{grade.label}</div>

      <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '2.8rem', margin: '0 0 4px' }}>
        {correct} / {QUESTIONS.length}
      </h2>
      <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.85rem', opacity: 0.6, marginBottom: '20px' }}>
        questions correct
      </p>

      {/* Score bar */}
      <div style={{
        height: '16px', borderRadius: '9999px',
        border: `2.5px solid ${ink}`, background: 'var(--rh-surface)',
        boxShadow: `3px 3px 0 ${ink}`, overflow: 'hidden', marginBottom: '24px',
      }}>
        <div style={{
          width: `${(correct / QUESTIONS.length) * 100}%`,
          height: '100%', background: grade.color,
          borderRight: correct > 0 ? `2px solid ${ink}` : 'none',
          borderRadius: '9999px',
          transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }} />
      </div>

      {/* XP badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        border: `2.5px solid ${ink}`, borderRadius: '9999px',
        padding: '10px 24px', background: '#FFCD00',
        boxShadow: `4px 4px 0 ${ink}`, marginBottom: '32px',
      }}>
        <span style={{ fontSize: '1.4rem' }}>⭐</span>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.3rem', lineHeight: 1 }}>+{totalXP} XP</div>
          <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6 }}>Earned this round</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        <Btn accent="#FFCD00" onClick={startQuiz}>Play Again</Btn>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Btn accent="var(--rh-surface)">← Back to Gazette</Btn>
        </Link>
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════════
  // PLAYING / ANSWERED
  // ══════════════════════════════════════════════════════════════
  const q = QUESTIONS[qIdx]

  return page(
    <div>
      {/* ── Header bar ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 20px',
        background: 'var(--rh-surface)',
        borderBottom: `2px solid ${ink}`,
      }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem', letterSpacing: '0.05em' }}>
          Q{qIdx + 1} <span style={{ opacity: 0.45 }}>/ {QUESTIONS.length}</span>
        </div>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {QUESTIONS.map((_, i) => (
            <div key={i} style={{
              width: '10px', height: '10px', borderRadius: '50%',
              border: `2px solid ${ink}`,
              background: i < qIdx ? '#2D9A4E' : i === qIdx ? '#FFCD00' : 'transparent',
              boxShadow: i === qIdx ? `1px 1px 0 ${ink}` : 'none',
              transition: 'background 0.2s',
            }} />
          ))}
        </div>

        <div style={{
          fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem',
          display: 'flex', alignItems: 'center', gap: '5px',
        }}>
          <span style={{ opacity: 0.5, fontSize: '0.7rem' }}>XP</span>
          <span>{totalXP}</span>
        </div>
      </div>

      {/* ── Timer bar ──────────────────────────────────────── */}
      <div style={{ height: '8px', background: 'var(--rh-surface)', position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${timerPct}%`,
          background: timerColor,
          borderRight: `2px solid ${ink}`,
          transition: 'width 1s linear, background 0.3s ease',
        }} />
      </div>

      {/* ── Question ───────────────────────────────────────── */}
      <div style={{ padding: '28px 28px 20px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
          <div style={{
            fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700,
            fontSize: '0.62rem', letterSpacing: '0.14em',
            textTransform: 'uppercase', opacity: 0.5,
          }}>
            {phase === 'playing' ? `${timeLeft}s remaining` : selected === q.correct ? '✓ Correct!' : selected === null ? '⏱ Time\'s up!' : '✗ Wrong answer'}
          </div>
        </div>

        <h2 style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 'clamp(1.2rem, 3vw, 1.7rem)',
          lineHeight: 1.25, margin: 0,
        }}>{q.question}</h2>

        {/* XP pop */}
        {xpPop && (
          <div style={{
            position: 'absolute', right: '28px', top: '20px',
            fontFamily: "'Fredoka One', cursive", fontSize: '1.4rem',
            color: '#2D9A4E',
            animation: 'pop 0.3s cubic-bezier(0.34,1.56,0.64,1) both, float 1.5s ease-in-out forwards',
            pointerEvents: 'none',
          }}>+{xpPop} XP ⭐</div>
        )}
      </div>

      {/* ── Answer options ─────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: '12px', padding: '0 28px 28px',
      }}>
        {q.options.map((opt, i) => {
          const isSelected  = selected === i
          const isCorrect   = i === q.correct
          const answered    = phase === 'answered'

          let bg = 'var(--rh-card)'
          let color = 'var(--rh-ink)'
          let opacity = 1
          let anim = ''
          let shadow = `3px 3px 0 ${ink}`

          if (answered) {
            if (isCorrect) { bg = '#2D9A4E'; color = '#FEF9EE'; anim = 'jelly 0.6s cubic-bezier(0.34,1.56,0.64,1)'; shadow = `3px 3px 0 ${ink}` }
            else if (isSelected) { bg = '#E63946'; color = '#FEF9EE'; anim = 'shake 0.5s ease-in-out'; shadow = `3px 3px 0 ${ink}` }
            else { opacity = 0.38 }
          }

          return (
            <button key={i}
              onClick={() => phase === 'playing' && handleAnswer(i)}
              disabled={answered}
              style={{
                fontFamily: "'Fredoka Variable', sans-serif",
                fontWeight: 600, fontSize: '0.85rem',
                lineHeight: 1.4, textAlign: 'left',
                padding: '14px 16px',
                borderRadius: '1.1rem 1.3rem 1.1rem 1.2rem',
                border: `2.5px solid ${ink}`,
                background: bg, color,
                boxShadow: shadow,
                cursor: phase === 'playing' ? 'pointer' : 'default',
                opacity,
                transition: 'transform 0.1s, box-shadow 0.1s, background 0.15s',
                animation: anim,
                display: 'flex', gap: '10px', alignItems: 'flex-start',
              }}
              onMouseEnter={e => { if (phase === 'playing') { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `5px 5px 0 ${ink}` } }}
              onMouseLeave={e => { if (phase === 'playing') { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `3px 3px 0 ${ink}` } }}
              onMouseDown={e => { if (phase === 'playing') { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = `1px 1px 0 ${ink}` } }}
              onMouseUp={e => { if (phase === 'playing') { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `5px 5px 0 ${ink}` } }}
            >
              <span style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: '0.85rem', flexShrink: 0,
                width: '22px', height: '22px',
                borderRadius: '50%',
                border: `2px solid currentColor`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: '1px',
              }}>{OPTION_LABELS[i]}</span>
              <span>{opt}</span>
            </button>
          )
        })}
      </div>

      {/* ── Explanation (after answering) ───────────────────── */}
      {phase === 'answered' && (
        <div style={{
          margin: '0 28px 24px',
          borderTop: `2px solid ${ink}`,
          paddingTop: '14px',
          fontFamily: "'Fredoka Variable', sans-serif",
          fontWeight: 500, fontSize: '0.82rem',
          lineHeight: 1.6, opacity: 0.8,
          animation: 'slam 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        }}>
          <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.55 }}>Did you know? </span>
          {q.explanation}
        </div>
      )}
    </div>
  )
}

// ── Reusable button ───────────────────────────────────────────
function Btn({ children, onClick, accent, big }: {
  children: React.ReactNode
  onClick?: () => void
  accent: string
  big?: boolean
}) {
  return (
    <button onClick={onClick} style={{
      fontFamily: "'Fredoka One', cursive",
      fontSize: big ? '1rem' : '0.82rem',
      letterSpacing: '0.07em',
      padding: big ? '12px 32px' : '9px 22px',
      borderRadius: '9999px',
      border: `2.5px solid var(--rh-ink)`,
      background: accent,
      color: accent === 'var(--rh-surface)' ? 'var(--rh-ink)' : '#1A0800',
      boxShadow: `4px 4px 0 var(--rh-ink)`,
      cursor: 'pointer',
      transition: 'transform 0.1s, box-shadow 0.1s',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `6px 6px 0 var(--rh-ink)` }}
    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0 var(--rh-ink)` }}
    onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = `1px 1px 0 var(--rh-ink)` }}
    onMouseUp={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `6px 6px 0 var(--rh-ink)` }}
    >{children}</button>
  )
}

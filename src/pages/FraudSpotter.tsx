import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { submitGame } from '../lib/api'
import { getSession } from '../lib/session'
import { useIsMobile } from '../lib/responsive'

const ink = 'var(--rh-ink)'
const paper = 'var(--rh-paper)'
const surface = 'var(--rh-surface)'

const TIMER_MAX = 12

type OfferKind = 'email' | 'notification' | 'ad' | 'message' | 'letter'

type Offer = {
  id: number
  kind: OfferKind
  sender: string
  subject: string
  body: string
  isScam: boolean
  redFlags?: string[]
  explanation: string
  xp: number
}

const OFFERS: Offer[] = [
  {
    id: 1, kind: 'notification',
    sender: 'CryptoOracle Pro',
    subject: 'You\'ve been pre-selected!',
    body: 'Congratulations! You qualify for our exclusive GUARANTEED 20% monthly returns program. Minimum investment: 5,000 PLN. Only 6 spots remaining — offer expires in 47 minutes.',
    isScam: true,
    redFlags: ['Guaranteed returns (impossible)', 'Artificial urgency', 'Unsolicited contact'],
    explanation: 'No legitimate investment guarantees 20% monthly (240% annually). This is a Ponzi scheme using artificial scarcity to prevent due diligence.',
    xp: 120,
  },
  {
    id: 2, kind: 'letter',
    sender: 'PKO Bank Polski',
    subject: '12-Month Fixed Deposit — 5.5% APR',
    body: 'Dear Customer, we are pleased to offer a 12-month fixed-term deposit at 5.5% annual percentage rate. Capital fully protected under the Bank Guarantee Fund (BFG) up to €100,000. No hidden fees. Apply in the PKO mobile app.',
    isScam: false,
    explanation: 'Regulated bank, transparent terms, realistic rate, government-backed deposit insurance. Entirely legitimate product.',
    xp: 100,
  },
  {
    id: 3, kind: 'message',
    sender: '+48 602 *** ***',
    subject: 'Private opportunity',
    body: 'Hey, my friend works at a private hedge fund. They\'re letting a few people in before public launch — 3× your money in 6 months, zero downside. I already made 40k PLN. I can get you a spot but you need to decide today.',
    isScam: true,
    redFlags: ['Social proof manipulation', 'Extreme time pressure', 'Unofficial channel', 'Unrealistic returns'],
    explanation: 'Classic social engineering via trusted channel. Legitimate investments don\'t arrive via anonymous texts with same-day deadlines.',
    xp: 120,
  },
  {
    id: 4, kind: 'ad',
    sender: 'Vanguard',
    subject: 'Vanguard FTSE All-World ETF',
    body: 'Invest in 3,700+ companies across 47 countries. Ongoing charge: 0.22% per year. No lock-in period. Capital at risk — past performance is not indicative of future results. Regulated by KNF.',
    isScam: false,
    explanation: 'Real ETF from a regulated asset manager. Discloses fees, acknowledges risk, no guaranteed returns. This is what legitimate investing looks like.',
    xp: 100,
  },
  {
    id: 5, kind: 'email',
    sender: 'security@pkoo-bank.com',
    subject: 'URGENT: Your account has been suspended',
    body: 'We detected unauthorized access to your PKO account. To restore access immediately, verify your identity by sending 200 PLN to our verification wallet: bc1q7x84nj... Your funds will be returned within 24 hours.',
    isScam: true,
    redFlags: ['Misspelled domain (pkoo vs pko)', 'Asks you to SEND money to verify', 'Crypto wallet — no recovery', 'Fear + urgency'],
    explanation: 'Banks never ask you to send money to verify identity. The misspelled sender domain is a dead giveaway. Funds sent to crypto wallets are unrecoverable.',
    xp: 120,
  },
  {
    id: 6, kind: 'letter',
    sender: 'Ministry of Finance — Poland',
    subject: 'Treasury Bonds — 6.1% Annual Return',
    body: 'Polish government treasury bonds (Obligacje Skarbowe), 12-month series. Annual return: 6.1% fixed. Capital guaranteed by the Polish state. Available exclusively via mObligacje.pl — the official government savings platform.',
    isScam: false,
    explanation: 'Government bonds are among the safest investments available. Polish state guarantee, official distribution channel, realistic rate.',
    xp: 100,
  },
  {
    id: 7, kind: 'ad',
    sender: 'WealthBot Pro™',
    subject: 'AI Trading — 95% Win Rate, Proven',
    body: 'Our proprietary AI has achieved a 95% win rate across 4 years of live trading. No experience needed. Subscribe for 299 PLN/month to activate automated profit generation. Limited licenses available — join 12,000 happy members.',
    isScam: true,
    redFlags: ['Impossible performance claim', 'Pay-to-access subscription model', 'Artificial scarcity', 'No risk disclosure'],
    explanation: 'No algorithm achieves a 95% win rate — top hedge funds average 55–60%. A monthly subscription means they profit from your fees regardless of your losses.',
    xp: 120,
  },
  {
    id: 8, kind: 'notification',
    sender: 'Santander Bank',
    subject: 'New: Online Savings — 4.75% APR',
    body: 'Santander Online Savings Account: 4.75% variable APR. Withdraw anytime, no penalties, no minimum balance. Deposits insured by BFG up to €100,000. Open in 5 minutes via the Santander app. Capital at risk if above BFG limit.',
    isScam: false,
    explanation: 'Variable rate (not guaranteed), realistic APR, regulated bank, explicit BFG insurance disclosure, risk acknowledgment. Clean legitimate offer.',
    xp: 100,
  },
]

const KIND_STYLE: Record<OfferKind, { icon: string; label: string; headerBg: string; headerColor: string }> = {
  email:        { icon: '📧', label: 'EMAIL',           headerBg: '#1565C0', headerColor: 'white' },
  notification: { icon: '🔔', label: 'NOTIFICATION',    headerBg: '#2D2D2D', headerColor: '#FFCD00' },
  ad:           { icon: '📢', label: 'ADVERTISEMENT',   headerBg: '#E63946', headerColor: 'white' },
  message:      { icon: '💬', label: 'TEXT MESSAGE',    headerBg: '#2D9A4E', headerColor: 'white' },
  letter:       { icon: '🏛️', label: 'OFFICIAL LETTER', headerBg: '#7B2D8B', headerColor: 'white' },
}

type Phase  = 'intro' | 'playing' | 'results'
type Choice = 'legit' | 'scam'

export default function FraudSpotter() {
  const isMobile = useIsMobile()
  const [phase,     setPhase]     = useState<Phase>('intro')
  const [offerIdx,  setOfferIdx]  = useState(0)
  const [timeLeft,  setTimeLeft]  = useState(TIMER_MAX)
  const [answered,  setAnswered]  = useState<{ choice: Choice; isCorrect: boolean; earned: number } | null>(null)
  const [answers,   setAnswers]   = useState<boolean[]>([])
  const [streak,    setStreak]    = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [totalXP,   setTotalXP]  = useState(0)

  const offer = OFFERS[offerIdx]

  function startGame() {
    setPhase('playing'); setOfferIdx(0); setTimeLeft(TIMER_MAX)
    setAnswered(null); setAnswers([]); setStreak(0); setMaxStreak(0); setTotalXP(0)
  }

  function handleChoice(choice: Choice) {
    if (answered) return
    const isCorrect = (choice === 'scam') === offer.isScam
    const newStreak = isCorrect ? streak + 1 : 0
    const mult      = streak >= 4 ? 2 : streak >= 2 ? 1.5 : 1
    const speed     = timeLeft > 6 ? 30 : 0
    const earned    = isCorrect ? Math.round((offer.xp + speed) * mult) : 0

    setAnswered({ choice, isCorrect, earned })
    setStreak(newStreak)
    setMaxStreak(prev => Math.max(prev, newStreak))
    setTotalXP(prev => prev + earned)
    setAnswers(prev => [...prev, isCorrect])

    setTimeout(() => {
      const next = offerIdx + 1
      if (next >= OFFERS.length) {
        setPhase('results')
      } else {
        setOfferIdx(next)
        setAnswered(null)
        setTimeLeft(TIMER_MAX)
      }
    }, 2400)
  }

  useEffect(() => {
    if (phase !== 'results') return
    const session = getSession()
    if (!session) return
    const correct = answers.filter(Boolean).length
    submitGame({ userId: session.id, gameType: 'fraud', xpEarned: totalXP, score: correct, total: OFFERS.length, metadata: { maxStreak } }).catch(() => {})
  }, [phase])

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || answered) return
    if (timeLeft <= 0) { handleChoice('legit'); return } // auto-wrong on timeout
    const t = setTimeout(() => setTimeLeft(n => n - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, timeLeft, answered])

  const timerPct   = (timeLeft / TIMER_MAX) * 100
  const timerColor = timeLeft <= 3 ? '#E63946' : timeLeft <= 6 ? '#FF7B25' : '#2D9A4E'
  const mult       = streak >= 4 ? 2 : streak >= 2 ? 1.5 : 1
  const ks         = offer ? KIND_STYLE[offer.kind] : KIND_STYLE.email

  const getStamp = () => {
    if (!answered) return null
    if (answered.isCorrect) {
      return answered.choice === 'scam'
        ? { text: 'SCAM!',    color: '#E63946' }
        : { text: 'VERIFIED', color: '#2D9A4E' }
    }
    return answered.choice === 'scam'
      ? { text: 'FALSE\nALARM',  color: '#FF7B25' }
      : { text: 'MISSED\nSCAM!', color: '#E63946' }
  }
  const stamp = getStamp()

  const wrap = (content: React.ReactNode) => (
    <div style={{
      minHeight: '100vh', background: surface,
      backgroundImage: 'radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px)',
      backgroundSize: '22px 22px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px 60px',
    }}>{content}</div>
  )

  // ── INTRO ──────────────────────────────────────────────────────
  if (phase === 'intro') return wrap(
    <div style={{ textAlign: 'center', maxWidth: '500px', width: '100%', animation: 'briefing-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
      <span style={{
        display: 'inline-block', background: '#E63946', color: 'white',
        fontFamily: "'Fredoka One', cursive", fontSize: '0.65rem', letterSpacing: '0.14em',
        padding: '3px 14px', borderRadius: '9999px', border: `2px solid ${ink}`,
        boxShadow: `2px 2px 0 ${ink}`, marginBottom: '20px',
      }}>FRAUD SPOTTER</span>

      <div style={{ fontSize: '5rem', marginBottom: '12px' }}>🔍</div>

      <h1 style={{
        fontFamily: "'Fredoka One', cursive",
        fontSize: 'clamp(2rem, 6vw, 3rem)', lineHeight: 1.05, marginBottom: '12px',
      }}>Real or Scam?</h1>

      <p style={{
        fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500,
        fontSize: '0.9rem', lineHeight: 1.65, opacity: 0.75, marginBottom: '28px',
      }}>
        8 financial offers. Each one is either legitimate or a fraud.<br />
        You have 12 seconds to decide. Miss the timer and you lose the point.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {([['8', 'Offers'], ['12s', 'Per offer'], ['+960', 'XP max'], ['Speed', 'Bonus']] as const).map(([v, l]) => (
          <div key={l} style={{
            border: `2px solid ${ink}`, borderRadius: '1rem', padding: '10px 16px',
            boxShadow: `3px 3px 0 ${ink}`, background: paper, textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.4rem', lineHeight: 1 }}>{v}</div>
            <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.5 }}>{l}</div>
          </div>
        ))}
      </div>

      <button onClick={startGame} style={{
        fontFamily: "'Fredoka One', cursive", fontSize: '1rem',
        letterSpacing: '0.07em', padding: '14px 40px',
        borderRadius: '9999px', border: `3px solid ${ink}`,
        background: '#E63946', color: 'white',
        boxShadow: `5px 5px 0 ${ink}`, cursor: 'pointer',
        transition: 'transform 0.1s, box-shadow 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `7px 7px 0 ${ink}` }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `5px 5px 0 ${ink}` }}
      >Start Investigation →</button>

      <div style={{ marginTop: '16px' }}>
        <Link to="/" style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.75rem', opacity: 0.45, textDecoration: 'underline', color: ink }}>
          ← Back to Gazette
        </Link>
      </div>
    </div>
  )

  // ── PLAYING ────────────────────────────────────────────────────
  if (phase === 'playing') return wrap(
    <div style={{ width: '100%', maxWidth: '560px' }}>
      {/* Timer + stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{
          fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem',
          background: paper, border: `2.5px solid ${ink}`,
          borderRadius: '9999px', padding: '4px 14px', boxShadow: `3px 3px 0 ${ink}`,
          whiteSpace: 'nowrap',
        }}>{offerIdx + 1}<span style={{ opacity: 0.4 }}> / {OFFERS.length}</span></div>

        {/* Timer bar */}
        <div style={{
          flex: 1, height: '14px', borderRadius: '9999px',
          border: `2.5px solid ${ink}`, background: surface,
          boxShadow: `3px 3px 0 ${ink}`, overflow: 'hidden',
        }}>
          <div style={{
            width: `${timerPct}%`, height: '100%',
            background: timerColor,
            borderRight: timeLeft > 0 ? `2px solid ${ink}` : 'none',
            borderRadius: '9999px',
            transition: 'width 1s linear, background 0.3s ease',
          }} />
        </div>

        <div style={{
          fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem',
          background: timeLeft <= 3 ? '#E63946' : paper,
          color: timeLeft <= 3 ? 'white' : ink,
          border: `2.5px solid ${ink}`,
          borderRadius: '9999px', padding: '4px 12px',
          boxShadow: `3px 3px 0 ${ink}`, minWidth: '48px', textAlign: 'center',
          transition: 'background 0.2s, color 0.2s',
        }}>{timeLeft}s</div>

        <div style={{
          fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem',
          background: streak >= 3 ? '#FFCD00' : paper,
          border: `2.5px solid ${ink}`, borderRadius: '9999px',
          padding: '4px 12px', boxShadow: `3px 3px 0 ${ink}`,
          transition: 'background 0.25s', whiteSpace: 'nowrap',
        }}>🔥 {streak}{mult > 1 ? ` ×${mult}` : ''}</div>
      </div>

      {/* Offer card */}
      <div style={{
        position: 'relative',
        background: paper, border: `3px solid ${ink}`,
        borderRadius: '2rem', boxShadow: `7px 7px 0 ${ink}`,
        overflow: 'hidden', marginBottom: '16px',
        animation: answered ? undefined : 'briefing-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        {/* Kind header */}
        <div style={{
          background: ks.headerBg, borderBottom: `3px solid ${ink}`,
          padding: '10px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '1.1rem' }}>{ks.icon}</span>
            <span style={{
              fontFamily: "'Fredoka One', cursive", fontSize: '0.65rem',
              letterSpacing: '0.16em', color: ks.headerColor,
            }}>{ks.label}</span>
          </div>
          <span style={{
            fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700,
            fontSize: '0.72rem', color: ks.headerColor, opacity: 0.8,
          }}>{offer.sender}</span>
        </div>

        {/* Subject */}
        <div style={{
          padding: '12px 20px 8px',
          borderBottom: `2px dashed color-mix(in srgb, ${ink} 25%, transparent)`,
        }}>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.45, marginBottom: '3px' }}>Subject</div>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1rem', lineHeight: 1.25 }}>{offer.subject}</div>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px 20px' }}>
          <p style={{
            fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500,
            fontSize: '0.88rem', lineHeight: 1.7, margin: 0, opacity: 0.85,
          }}>{offer.body}</p>
        </div>

        {/* Stamp overlay */}
        {stamp && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', zIndex: 10,
          }}>
            <div style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: 'clamp(2rem, 8vw, 3.2rem)',
              letterSpacing: '0.08em', whiteSpace: 'pre-line', textAlign: 'center',
              color: stamp.color, border: `5px solid ${stamp.color}`,
              padding: '10px 22px', borderRadius: '8px',
              transform: 'rotate(-14deg)',
              opacity: 0.92,
              background: `color-mix(in srgb, ${stamp.color} 10%, ${paper})`,
              boxShadow: `4px 4px 0 rgba(0,0,0,0.12)`,
              animation: 'xp-count-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
            }}>{stamp.text}</div>
          </div>
        )}
      </div>

      {/* Result feedback */}
      {answered && (
        <div style={{
          background: answered.isCorrect ? 'rgba(45,154,78,0.12)' : 'rgba(230,57,70,0.1)',
          border: `2.5px solid ${answered.isCorrect ? '#2D9A4E' : '#E63946'}`,
          borderRadius: '1.2rem', padding: '12px 16px', marginBottom: '16px',
          animation: 'fly-in-left 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
        }}>
          <div style={{
            fontFamily: "'Fredoka One', cursive", fontSize: '0.65rem',
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: answered.isCorrect ? '#2D9A4E' : '#E63946',
            marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            {answered.isCorrect ? '✓ Correct!' : '✗ Wrong!'}
            {answered.earned > 0 && (
              <span style={{
                background: '#FFCD00', color: '#1A0800',
                padding: '1px 10px', borderRadius: '9999px',
                border: `1.5px solid ${ink}`, fontSize: '0.62rem',
              }}>+{answered.earned} XP{mult > 1 ? ` (×${mult})` : ''}</span>
            )}
          </div>
          <p style={{
            fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500,
            fontSize: '0.78rem', lineHeight: 1.55, margin: 0, opacity: 0.88,
          }}>{offer.explanation}</p>
          {answered.isCorrect === false && offer.isScam && offer.redFlags && (
            <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {offer.redFlags.map(f => (
                <span key={f} style={{
                  fontFamily: "'Fredoka One', cursive", fontSize: '0.6rem',
                  background: 'rgba(230,57,70,0.15)', color: '#E63946',
                  border: `1.5px solid #E63946`, padding: '2px 10px',
                  borderRadius: '9999px', letterSpacing: '0.04em',
                }}>⚠ {f}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Red flags (always show after correct scam catch) */}
      {answered?.isCorrect && answered.choice === 'scam' && offer.redFlags && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px',
          animation: 'fly-in-left 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.1s both',
        }}>
          <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.6rem', opacity: 0.5, alignSelf: 'center', marginRight: '2px' }}>RED FLAGS:</span>
          {offer.redFlags.map(f => (
            <span key={f} style={{
              fontFamily: "'Fredoka One', cursive", fontSize: '0.6rem',
              background: 'rgba(230,57,70,0.12)', color: '#E63946',
              border: `1.5px solid #E63946`, padding: '2px 10px',
              borderRadius: '9999px',
            }}>⚠ {f}</span>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '14px' }}>
        {([['legit', '✓ Looks Legit', '#2D9A4E', 'white'], ['scam', '✗ It\'s a Scam!', '#E63946', 'white']] as const).map(([choice, label, bg, color]) => (
          <button key={choice}
            onClick={() => handleChoice(choice)}
            disabled={!!answered}
            style={{
              flex: 1, fontFamily: "'Fredoka One', cursive", fontSize: '1rem',
              letterSpacing: '0.06em', padding: '16px',
              borderRadius: '9999px', border: `3px solid ${ink}`,
              background: bg, color,
              boxShadow: `5px 5px 0 ${ink}`, cursor: answered ? 'default' : 'pointer',
              transition: 'transform 0.1s, box-shadow 0.1s',
              opacity: answered ? 0.4 : 1,
            }}
            onMouseEnter={e => { if (!answered) { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `7px 7px 0 ${ink}` } }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `5px 5px 0 ${ink}` }}
          >{label}</button>
        ))}
      </div>
    </div>
  )

  // ── RESULTS ────────────────────────────────────────────────────
  const correct = answers.filter(Boolean).length
  const grade = correct >= 8 ? { label: 'Fraud Detective', emoji: '🕵️', color: '#FFCD00' }
    : correct >= 6 ? { label: 'Sharp Eye',      emoji: '🔍', color: '#2D9A4E' }
    : correct >= 4 ? { label: 'Getting There',  emoji: '🪙', color: '#1565C0' }
    : { label: 'Scam Magnet',   emoji: '💀', color: '#E63946' }

  return wrap(
    <div style={{ width: '100%', maxWidth: '520px' }}>
      <div style={{
        background: paper, border: `3px solid ${ink}`,
        borderRadius: '2.2rem 2rem 2.2rem 2.1rem',
        boxShadow: `8px 8px 0 ${ink}`, overflow: 'hidden',
        animation: 'briefing-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        <div style={{
          background: '#1A0800', borderBottom: `3px solid #E63946`,
          padding: '12px 24px', textAlign: 'center',
        }}>
          <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.78rem', letterSpacing: '0.3em', color: '#E63946' }}>
            ✦ CASE CLOSED ✦
          </span>
        </div>

        <div style={{ padding: '28px' }}>
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '6px' }}>{grade.emoji}</div>
            <div style={{
              display: 'inline-block', background: grade.color, color: '#1A0800',
              fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem', letterSpacing: '0.14em',
              padding: '3px 16px', borderRadius: '9999px',
              border: `2px solid ${ink}`, boxShadow: `2px 2px 0 ${ink}`, marginBottom: '10px',
            }}>{grade.label}</div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '2.8rem', lineHeight: 1 }}>
              {correct}<span style={{ opacity: 0.35, fontSize: '1.5rem' }}> / {OFFERS.length}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            {([['⭐', String(totalXP), 'XP Earned'], ['🔥', String(maxStreak), 'Best Streak'], ['✓', String(correct), 'Correct']] as const).map(([icon, val, label]) => (
              <div key={label} style={{
                flex: 1, border: `2.5px solid ${ink}`, borderRadius: '1rem',
                padding: '10px', textAlign: 'center', boxShadow: `3px 3px 0 ${ink}`, background: surface,
              }}>
                <div style={{ fontSize: '1.2rem' }}>{icon}</div>
                <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.3rem', lineHeight: 1 }}>{val}</div>
                <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.56rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.5 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Offer breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: '8px', marginBottom: '22px' }}>
            {OFFERS.map((o, i) => {
              const ks2 = KIND_STYLE[o.kind]
              return (
                <div key={o.id} style={{
                  border: `2px solid ${ink}`, borderRadius: '0.9rem',
                  overflow: 'hidden', boxShadow: `2px 2px 0 ${ink}`,
                  background: answers[i] ? 'rgba(45,154,78,0.12)' : 'rgba(230,57,70,0.1)',
                }}>
                  <div style={{ background: ks2.headerBg, padding: '4px 6px', textAlign: 'center', fontSize: '0.85rem' }}>{ks2.icon}</div>
                  <div style={{ padding: '4px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.65rem', opacity: 0.6 }}>{o.isScam ? 'SCAM' : 'LEGIT'}</div>
                    <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.75rem', color: answers[i] ? '#2D9A4E' : '#E63946' }}>{answers[i] ? '✓' : '✗'}</div>
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={startGame} style={{
              flex: 1, fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem',
              letterSpacing: '0.06em', padding: '12px',
              borderRadius: '9999px', border: `2.5px solid ${ink}`,
              background: '#E63946', color: 'white',
              boxShadow: `4px 4px 0 ${ink}`, cursor: 'pointer',
              transition: 'transform 0.1s, box-shadow 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `6px 6px 0 ${ink}` }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0 ${ink}` }}
            >Play Again ↺</button>

            <Link to="/swipe" style={{
              flex: 1, fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem',
              letterSpacing: '0.06em', padding: '12px',
              borderRadius: '9999px', border: `2.5px solid ${ink}`,
              background: surface, color: ink,
              boxShadow: `4px 4px 0 ${ink}`, textDecoration: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'transform 0.1s, box-shadow 0.1s',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `6px 6px 0 ${ink}` }}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0 ${ink}` }}
            >Try Card Swipe →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

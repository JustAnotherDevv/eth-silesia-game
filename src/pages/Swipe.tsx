import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { submitGame } from '../lib/api'
import { getSession } from '../lib/session'
import { useIsMobile } from '../lib/responsive'

const ink = 'var(--rh-ink)'
const paper = 'var(--rh-paper)'
const surface = 'var(--rh-surface)'

type CardData = {
  id: number
  emoji: string
  title: string
  desc: string
  correct: 'wise' | 'bad'
  explanation: string
  xp: number
}

const CARDS: CardData[] = [
  {
    id: 1, emoji: '📱',
    title: 'New iPhone on credit',
    desc: "Latest model, 24% APR financing. Can't pay cash right now, but monthly payments seem manageable.",
    correct: 'bad', xp: 80,
    explanation: "24% APR means paying nearly a quarter of the phone's price in interest every year — on a depreciating asset.",
  },
  {
    id: 2, emoji: '⚡',
    title: 'Auto-save 10% every payday',
    desc: "Set up an automatic transfer to savings right when your salary hits. You never even see the money.",
    correct: 'wise', xp: 80,
    explanation: "Paying yourself first is the most reliable savings habit. Automation beats willpower 100% of the time.",
  },
  {
    id: 3, emoji: '🎰',
    title: 'Emergency fund → crypto',
    desc: "6-month emergency fund sits at 1.5% APR. Friend says ETH could 5x this year. Move it all over?",
    correct: 'bad', xp: 100,
    explanation: "Emergency funds must be liquid and stable. Crypto can drop 60% overnight — that's not an emergency fund anymore.",
  },
  {
    id: 4, emoji: '⚔️',
    title: 'Avalanche: pay 18% debt first',
    desc: "You have 2,000 PLN spare. Card A charges 18% APR, Card B is 7%. You clear Card A first.",
    correct: 'wise', xp: 80,
    explanation: "The avalanche method (highest interest first) minimizes total interest paid. Paying off 18% debt is a guaranteed 18% return.",
  },
  {
    id: 5, emoji: '🚨',
    title: 'Payday loan to cover rent',
    desc: "Rent's due Friday, you're short 800 PLN. A payday app offers instant cash at 400% APR.",
    correct: 'bad', xp: 100,
    explanation: "400% APR payday loans create debt spirals. One missed payment and fees compound catastrophically — people lose thousands on an 800 PLN loan.",
  },
  {
    id: 6, emoji: '📈',
    title: 'Monthly index ETF contributions',
    desc: "500 PLN/month into a broad market index ETF, automatic debit. Low fee (0.2%), no stock picking.",
    correct: 'wise', xp: 80,
    explanation: "Dollar-cost averaging into index funds is how long-term wealth is quietly built. Low fees, broad diversification, long horizon.",
  },
  {
    id: 7, emoji: '🚗',
    title: '7-year car loan you barely afford',
    desc: "65,000 PLN car. You earn 5,500/month. Dealer says 7-year financing makes it 'affordable'.",
    correct: 'bad', xp: 80,
    explanation: "A car losing 15% value/year while you pay 9% APR over 7 years is expensive lifestyle creep disguised as affordability.",
  },
  {
    id: 8, emoji: '🛡️',
    title: 'Build emergency fund before investing',
    desc: "Money to either invest or build a 3-month emergency cushion. You do the emergency fund first.",
    correct: 'wise', xp: 80,
    explanation: "Without an emergency fund, any unexpected cost forces you to sell investments at the worst time — or take on debt.",
  },
  {
    id: 9, emoji: '💳',
    title: 'Pay minimum on 19% APR card',
    desc: "5,000 PLN balance at 19% APR. Minimum payment is 150 PLN/month. You just pay the minimum.",
    correct: 'bad', xp: 100,
    explanation: "At minimum payments only, a 5,000 PLN balance at 19% APR takes 10+ years to clear and costs over 8,000 PLN in total interest.",
  },
  {
    id: 10, emoji: '💼',
    title: "Negotiate salary — 2 years, no raise",
    desc: "You haven't asked for a raise in 2 years. Market data shows you're 15–20% underpaid for your role.",
    correct: 'wise', xp: 100,
    explanation: "Salary negotiation is the highest ROI financial move available. A 15% raise compounds across your entire career.",
  },
]

type Phase = 'intro' | 'playing' | 'results'

export default function Swipe() {
  const isMobile = useIsMobile()
  const [phase, setPhase]           = useState<Phase>('intro')
  const [idx, setIdx]               = useState(0)
  const [dragX, setDragX]           = useState(0)
  const [dragging, setDragging]     = useState(false)
  const [flying, setFlying]         = useState<'wise' | 'bad' | null>(null)
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; explanation: string; earned: number } | null>(null)
  const [answers, setAnswers]       = useState<boolean[]>([])
  const [streak, setStreak]         = useState(0)
  const [maxStreak, setMaxStreak]   = useState(0)
  const [totalXP, setTotalXP]       = useState(0)

  const startXRef  = useRef(0)
  const cardRef    = useRef<HTMLDivElement>(null)
  const wrapRef    = useRef<HTMLDivElement>(null)

  const current = CARDS[idx]
  const done    = idx >= CARDS.length

  useEffect(() => {
    if (phase === 'playing') wrapRef.current?.focus()
  }, [phase])

  useEffect(() => {
    if (phase !== 'results') return
    const session = getSession()
    if (!session) return
    const correct = answers.filter(Boolean).length
    submitGame({ userId: session.id, gameType: 'swipe', xpEarned: totalXP, score: correct, total: CARDS.length, metadata: { maxStreak } }).catch(() => {})
  }, [phase])

  function startGame() {
    setPhase('playing'); setIdx(0); setDragX(0); setDragging(false)
    setFlying(null); setLastResult(null); setAnswers([])
    setStreak(0); setMaxStreak(0); setTotalXP(0)
  }

  function commitSwipe(dir: 'wise' | 'bad') {
    if (flying || done) return
    const card      = CARDS[idx]
    const isCorrect = dir === card.correct
    const newStreak = isCorrect ? streak + 1 : 0
    const mult      = streak >= 4 ? 2 : streak >= 2 ? 1.5 : 1
    const earned    = isCorrect ? Math.round(card.xp * mult) : 0

    setFlying(dir)
    setLastResult({ isCorrect, explanation: card.explanation, earned })
    setStreak(newStreak)
    setMaxStreak(prev => Math.max(prev, newStreak))
    setTotalXP(prev => prev + earned)
    setAnswers(prev => [...prev, isCorrect])
    setDragging(false)

    setTimeout(() => {
      const nextIdx = idx + 1
      setIdx(nextIdx)
      setFlying(null)
      setDragX(0)
      if (nextIdx >= CARDS.length) setTimeout(() => setPhase('results'), 400)
    }, 380)

    setTimeout(() => setLastResult(null), 2200)
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (flying) return
    e.currentTarget.setPointerCapture(e.pointerId)
    startXRef.current = e.clientX
    setDragging(true)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging) return
    setDragX(e.clientX - startXRef.current)
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!dragging) return
    setDragging(false)
    const dx = e.clientX - startXRef.current
    if (dx > 100)       commitSwipe('wise')
    else if (dx < -100) commitSwipe('bad')
    else                setDragX(0)
  }

  const rotation         = dragging ? dragX * 0.07 : 0
  const leftIndicator    = Math.min(1, Math.max(0, -dragX / 80))
  const rightIndicator   = Math.min(1, Math.max(0, dragX / 80))
  const mult             = streak >= 4 ? 2 : streak >= 2 ? 1.5 : 1

  const wrap = (content: React.ReactNode) => (
    <div style={{
      minHeight: '100vh',
      background: surface,
      backgroundImage: 'radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px)',
      backgroundSize: '22px 22px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px 60px',
    }}>{content}</div>
  )

  // ── INTRO ──────────────────────────────────────────────────────
  if (phase === 'intro') return wrap(
    <div style={{ textAlign: 'center', maxWidth: '480px', width: '100%', animation: 'briefing-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
      <span style={{
        display: 'inline-block', background: '#FFCD00', color: '#1A0800',
        fontFamily: "'Fredoka One', cursive", fontSize: '0.65rem', letterSpacing: '0.14em',
        padding: '3px 14px', borderRadius: '9999px', border: `2px solid ${ink}`,
        boxShadow: `2px 2px 0 ${ink}`, marginBottom: '20px',
      }}>SWIPE TO SORT</span>

      <div style={{ fontSize: '5rem', marginBottom: '12px' }}>🃏</div>

      <h1 style={{
        fontFamily: "'Fredoka One', cursive",
        fontSize: 'clamp(2rem, 6vw, 3rem)', lineHeight: 1.05, marginBottom: '12px',
      }}>Smart Move or<br />Bad Idea?</h1>

      <p style={{
        fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500,
        fontSize: '0.9rem', lineHeight: 1.65, opacity: 0.75, marginBottom: '28px',
      }}>
        10 financial decisions. Swipe right if it's a smart move.<br />
        Swipe left if it's a bad idea. Build your streak for bonus XP.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '32px' }}>
        {([['←', 'BAD IDEA', '#E63946'], ['→', 'WISE MOVE', '#2D9A4E']] as const).map(([key, label, color]) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: paper, border: `3px solid ${ink}`,
            borderRadius: '1rem', padding: '12px 20px',
            boxShadow: `4px 4px 0 ${ink}`,
          }}>
            <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.3rem', color }}>{key}</span>
            <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.75rem', letterSpacing: '0.06em' }}>{label}</span>
          </div>
        ))}
      </div>

      <button onClick={startGame} style={{
        fontFamily: "'Fredoka One', cursive", fontSize: '1rem',
        letterSpacing: '0.07em', padding: '14px 40px',
        borderRadius: '9999px', border: `3px solid ${ink}`,
        background: '#FFCD00', color: '#1A0800',
        boxShadow: `5px 5px 0 ${ink}`, cursor: 'pointer',
        transition: 'transform 0.1s, box-shadow 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `7px 7px 0 ${ink}` }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `5px 5px 0 ${ink}` }}
      >Deal the Cards →</button>

      <div style={{ marginTop: '16px' }}>
        <Link to="/" style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.75rem', opacity: 0.45, textDecoration: 'underline', color: ink }}>
          ← Back to Gazette
        </Link>
      </div>
    </div>
  )

  // ── PLAYING ────────────────────────────────────────────────────
  if (phase === 'playing') return wrap(
    <div
      ref={wrapRef}
      tabIndex={0}
      style={{ width: '100%', maxWidth: '420px', outline: 'none' }}
      onKeyDown={e => {
        if (e.key === 'ArrowRight') commitSwipe('wise')
        if (e.key === 'ArrowLeft')  commitSwipe('bad')
      }}
    >
      {/* Stats bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{
          fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem',
          background: paper, border: `2.5px solid ${ink}`,
          borderRadius: '9999px', padding: '5px 14px', boxShadow: `3px 3px 0 ${ink}`,
        }}>{Math.min(idx + 1, CARDS.length)}<span style={{ opacity: 0.4 }}> / {CARDS.length}</span></div>

        <div style={{
          fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem',
          background: streak >= 3 ? '#FFCD00' : paper,
          border: `2.5px solid ${ink}`, borderRadius: '9999px',
          padding: '5px 14px', boxShadow: `3px 3px 0 ${ink}`,
          transition: 'background 0.25s',
        }}>🔥 {streak}{mult > 1 ? ` ×${mult}` : ''}</div>

        <div style={{
          fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem',
          background: paper, border: `2.5px solid ${ink}`,
          borderRadius: '9999px', padding: '5px 14px', boxShadow: `3px 3px 0 ${ink}`,
        }}>⭐ {totalXP}</div>
      </div>

      {/* Card stack */}
      <div style={{ position: 'relative', height: '390px', marginBottom: '18px' }}>
        {/* Background card (peek) */}
        {!done && CARDS[idx + 1] && (
          <div style={{
            position: 'absolute', inset: 0,
            background: paper, border: `3px solid ${ink}`,
            borderRadius: '2rem', boxShadow: `5px 5px 0 ${ink}`,
            transform: 'translateY(10px) scale(0.965)',
            opacity: 0.55, zIndex: 1, pointerEvents: 'none', overflow: 'hidden',
          }}>
            <div style={{ padding: '36px', textAlign: 'center', opacity: 0.3, fontSize: '3rem' }}>
              {CARDS[idx + 1].emoji}
            </div>
          </div>
        )}

        {/* Current card */}
        {!done && (
          <div
            ref={cardRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              position: 'absolute', inset: 0, zIndex: 2,
              cursor: dragging ? 'grabbing' : 'grab',
              transform: flying
                ? `translateX(${flying === 'wise' ? '135%' : '-135%'}) rotate(${flying === 'wise' ? 28 : -28}deg)`
                : `translateX(${dragX}px) rotate(${rotation}deg)`,
              transition: flying
                ? 'transform 0.36s ease-in, opacity 0.36s ease-in'
                : dragging ? 'none' : 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
              opacity: flying ? 0 : 1,
              background: paper, border: `3px solid ${ink}`,
              borderRadius: '2rem', boxShadow: `6px 6px 0 ${ink}`,
              userSelect: 'none', WebkitUserSelect: 'none',
              overflow: 'hidden', touchAction: 'none',
            } as React.CSSProperties}
          >
            {/* WISE indicator */}
            <div style={{
              position: 'absolute', top: '18px', left: '14px',
              background: '#2D9A4E', color: 'white',
              fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem',
              letterSpacing: '0.1em', padding: '5px 13px',
              borderRadius: '9999px', border: `2.5px solid ${ink}`,
              transform: 'rotate(-12deg)', opacity: rightIndicator,
              pointerEvents: 'none', boxShadow: `2px 2px 0 ${ink}`,
            }}>WISE ✓</div>

            {/* BAD indicator */}
            <div style={{
              position: 'absolute', top: '18px', right: '14px',
              background: '#E63946', color: 'white',
              fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem',
              letterSpacing: '0.1em', padding: '5px 13px',
              borderRadius: '9999px', border: `2.5px solid ${ink}`,
              transform: 'rotate(12deg)', opacity: leftIndicator,
              pointerEvents: 'none', boxShadow: `2px 2px 0 ${ink}`,
            }}>BAD ✗</div>

            {/* Content */}
            <div style={{ padding: '52px 28px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '14px', lineHeight: 1 }}>{current.emoji}</div>
              <h3 style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: '1.3rem', lineHeight: 1.2, marginBottom: '12px',
              }}>{current.title}</h3>
              <p style={{
                fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500,
                fontSize: '0.82rem', lineHeight: 1.65, opacity: 0.78, margin: 0,
              }}>{current.desc}</p>
            </div>

            {/* Bottom hint */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '9px 20px', borderTop: `2.5px solid ${ink}`,
              background: surface, display: 'flex', justifyContent: 'space-between',
            }}>
              <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.62rem', color: '#E63946' }}>← Bad Idea</span>
              <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.58rem', opacity: 0.35 }}>drag or use buttons</span>
              <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.62rem', color: '#2D9A4E' }}>Wise Move →</span>
            </div>
          </div>
        )}
      </div>

      {/* Result / explanation */}
      <div style={{ minHeight: '76px', marginBottom: '16px' }}>
        {lastResult && (
          <div style={{
            background: lastResult.isCorrect ? 'rgba(45,154,78,0.12)' : 'rgba(230,57,70,0.1)',
            border: `2.5px solid ${lastResult.isCorrect ? '#2D9A4E' : '#E63946'}`,
            borderRadius: '1.2rem', padding: '12px 16px',
            animation: 'slam 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
          }}>
            <div style={{
              fontFamily: "'Fredoka One', cursive", fontSize: '0.65rem',
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: lastResult.isCorrect ? '#2D9A4E' : '#E63946',
              marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              {lastResult.isCorrect ? '✓ Correct!' : '✗ Wrong!'}
              {lastResult.earned > 0 && (
                <span style={{
                  background: '#FFCD00', color: '#1A0800',
                  padding: '1px 10px', borderRadius: '9999px',
                  border: `1.5px solid ${ink}`, fontSize: '0.62rem',
                }}>+{lastResult.earned} XP{mult > 1 ? ` (×${mult})` : ''}</span>
              )}
            </div>
            <p style={{
              fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500,
              fontSize: '0.78rem', lineHeight: 1.55, margin: 0, opacity: 0.85,
            }}>{lastResult.explanation}</p>
          </div>
        )}
      </div>

      {/* Click buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {([['bad', '✗ Bad Idea', '#E63946', 'white'], ['wise', '✓ Wise Move', '#2D9A4E', 'white']] as const).map(([dir, label, bg, color]) => (
          <button key={dir}
            onClick={() => commitSwipe(dir)}
            disabled={!!flying || done}
            style={{
              flex: 1, fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem',
              letterSpacing: '0.06em', padding: '12px',
              borderRadius: '9999px', border: `2.5px solid ${ink}`,
              background: bg, color,
              boxShadow: `4px 4px 0 ${ink}`, cursor: 'pointer',
              transition: 'transform 0.1s, box-shadow 0.1s',
              opacity: flying ? 0.55 : 1,
            }}
            onMouseEnter={e => { if (!flying) { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `6px 6px 0 ${ink}` } }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0 ${ink}` }}
          >{label}</button>
        ))}
      </div>
    </div>
  )

  // ── RESULTS ────────────────────────────────────────────────────
  const correct = answers.filter(Boolean).length
  const grade = correct >= 9 ? { label: 'Financial Genius', emoji: '🌟', color: '#FFCD00' }
    : correct >= 7 ? { label: 'Sharp Thinker',  emoji: '🎩', color: '#2D9A4E' }
    : correct >= 5 ? { label: 'Learning Fast',   emoji: '🪙', color: '#1565C0' }
    : { label: 'Keep Studying', emoji: '📚', color: '#E63946' }

  return wrap(
    <div style={{ width: '100%', maxWidth: '500px' }}>
      <div style={{
        background: paper, border: `3px solid ${ink}`,
        borderRadius: '2.2rem 2rem 2.2rem 2.1rem',
        boxShadow: `8px 8px 0 ${ink}`, overflow: 'hidden',
        animation: 'briefing-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        <div style={{
          background: '#1A0800', borderBottom: `3px solid #FFCD00`,
          padding: '12px 24px', textAlign: 'center',
        }}>
          <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.78rem', letterSpacing: '0.3em', color: '#FFCD00' }}>
            ✦ ROUND COMPLETE ✦
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
              {correct}<span style={{ opacity: 0.35, fontSize: '1.5rem' }}> / {CARDS.length}</span>
            </div>
          </div>

          {/* Stats */}
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

          {/* Card breakdown grid */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: '6px', marginBottom: '22px' }}>
            {CARDS.map((c, i) => (
              <div key={c.id} style={{
                border: `2px solid ${ink}`, borderRadius: '0.8rem',
                padding: '8px 4px', textAlign: 'center',
                background: answers[i] ? 'rgba(45,154,78,0.14)' : 'rgba(230,57,70,0.1)',
                boxShadow: `2px 2px 0 ${ink}`,
              }}>
                <div style={{ fontSize: '1.2rem' }}>{c.emoji}</div>
                <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.65rem', color: answers[i] ? '#2D9A4E' : '#E63946' }}>
                  {answers[i] ? '✓' : '✗'}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={startGame} style={{
              flex: 1, fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem',
              letterSpacing: '0.06em', padding: '12px',
              borderRadius: '9999px', border: `2.5px solid ${ink}`,
              background: '#FFCD00', color: '#1A0800',
              boxShadow: `4px 4px 0 ${ink}`, cursor: 'pointer',
              transition: 'transform 0.1s, box-shadow 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `6px 6px 0 ${ink}` }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0 ${ink}` }}
            >Play Again ↺</button>

            <Link to="/fraud" style={{
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
            >Try Fraud Spotter →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

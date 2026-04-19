import React, { useState, useEffect } from 'react'
import { Progress } from '@/components/ui/progress'
import { getUser } from '../lib/api'
import { getSession } from '../lib/session'
import { useIsMobile } from '../lib/responsive'

const TODAY = new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
})

const TICKER_ITEMS = [
  '★ COMPOUND INTEREST: The fundamental every smart saver should master',
  '★ BUDGETING SPECIAL: The 50/30/20 rule explained in one cartoon',
  '★ DAILY CHALLENGE UNLOCKED: Today\'s financial puzzle is live',
  '★ PKO EXCLUSIVE: New promotional savings rates now live — optimize yours today',
  '★ STREAK ALERT: 847 players maintained a 7-day streak this week',
]

const GAME_MODES = [
  {
    tag: 'QUICK ROUNDS',
    kicker: 'TEST YOUR KNOWLEDGE',
    headline: 'Think Like Your Bank Manager — Can You Nail Five In A Row?',
    body: 'Five rapid-fire questions. Thirty seconds each. Find out how close you are to pro-level financial thinking.',
    emoji: '🎯',
    accent: '#FFCD00',
    cta: 'Start Quiz →',
  },
  {
    tag: 'DECISION ROOM',
    kicker: 'EXCLUSIVE SCENARIO',
    headline: 'Young Investor Faces Impossible Choice — What Would YOU Do?',
    body: 'One scenario. Multiple paths. Real consequences. Enter the Decision Room and choose wisely.',
    emoji: '🎲',
    accent: '#E63946',
    cta: 'Enter Room →',
  },
  {
    tag: 'DAILY STREAK',
    kicker: 'STREAK CHALLENGE',
    headline: "The 30-Day Challenge That Changed One Investor's Life",
    body: "One challenge per day keeps financial ignorance at bay. Your streak multiplier is waiting.",
    emoji: '🔥',
    accent: '#FF7B25',
    cta: 'Claim Reward →',
  },
]

const ink = 'var(--rh-ink)'
const surface = 'var(--rh-surface)'
const hover = 'var(--rh-hover)'
const card = 'var(--rh-card)'

function btn(accent: string) {
  return {
    fontFamily: "'Fredoka One', cursive",
    fontSize: '0.78rem',
    letterSpacing: '0.07em',
    padding: '8px 20px',
    borderRadius: '9999px',
    border: `2.5px solid ${ink}`,
    background: accent,
    color: '#1A0800',
    boxShadow: `3px 3px 0 ${ink}`,
    cursor: 'pointer',
    transition: 'transform 0.1s, box-shadow 0.1s',
    display: 'inline-block',
  } as React.CSSProperties
}

function liftOn(e: React.MouseEvent<HTMLElement>) {
  e.currentTarget.style.transform = 'translate(-2px,-2px)'
  e.currentTarget.style.boxShadow = `5px 5px 0 ${ink}`
}
function liftOff(e: React.MouseEvent<HTMLElement>, shadow = `3px 3px 0 ${ink}`) {
  e.currentTarget.style.transform = ''
  e.currentTarget.style.boxShadow = shadow
}
function pressDown(e: React.MouseEvent<HTMLElement>) {
  e.currentTarget.style.transform = 'translate(2px,2px)'
  e.currentTarget.style.boxShadow = `1px 1px 0 ${ink}`
}

const XP_LEVELS = [
  { min: 10000, label: 'Legend',  xpMax: 10000 },
  { min: 5000,  label: 'Expert',  xpMax: 10000 },
  { min: 2000,  label: 'Pro',     xpMax: 5000  },
  { min: 500,   label: 'Rising',  xpMax: 2000  },
  { min: 0,     label: 'Rookie',  xpMax: 500   },
]

export default function News() {
  const isMobile = useIsMobile()
  const [player, setPlayer] = useState({
    name: 'You', level: 1, xp: 0, xpMax: 500, streak: 0,
    badges: [] as string[], avatar: '🎩',
  })

  const session = getSession()
  useEffect(() => {
    if (!session?.id) return
    getUser(session.id).then(u => {
      const lvl = XP_LEVELS.find(l => u.xp >= l.min) ?? XP_LEVELS[XP_LEVELS.length - 1]
      setPlayer({
        name:   u.display_name,
        level:  XP_LEVELS.indexOf(lvl) + 1,
        xp:     u.xp,
        xpMax:  lvl.xpMax,
        streak: u.streak,
        badges: [],
        avatar: u.avatar,
      })
    }).catch(() => {
      if (session) setPlayer(p => ({ ...p, name: session.displayName, avatar: session.avatar }))
    })
  }, [session?.id])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', paddingBottom: '44px' }}>

      {/* ── Metadata bar ─────────────────────────────────────── */}
      <div style={{
        borderBottom: `2px solid ${ink}`,
        padding: '5px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: "'Fredoka Variable', sans-serif",
        fontWeight: 700,
        fontSize: '0.63rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        opacity: 0.65,
      }}>
        <span>Vol. 1 · No. 42</span>
        <span>{TODAY}</span>
        <span>Price: Free</span>
      </div>

      {/* ── Masthead ──────────────────────────────────────────── */}
      <div style={{
        textAlign: 'center',
        padding: '20px 24px 14px',
        borderBottom: `4px double ${ink}`,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', left: '24px', top: '50%',
          transform: 'translateY(-50%)',
          fontFamily: "'Fredoka One', cursive",
          fontSize: '1.1rem', opacity: 0.3, letterSpacing: '0.3em',
        }} className="rh-animate-float">✦ ✦ ✦</div>
        <div style={{
          position: 'absolute', right: '24px', top: '50%',
          transform: 'translateY(-50%)',
          fontFamily: "'Fredoka One', cursive",
          fontSize: '1.1rem', opacity: 0.3, letterSpacing: '0.3em',
        }} className="rh-animate-float">✦ ✦ ✦</div>

        <p style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: '0.6rem', letterSpacing: '0.35em',
          textTransform: 'uppercase', opacity: 0.5, marginBottom: '4px',
        }}>★ The Original · Est. 2026 ★</p>

        <h1 style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 'clamp(2.8rem, 8vw, 6rem)',
          lineHeight: 1, margin: 0,
          letterSpacing: '-0.01em',
          textShadow: `4px 4px 0 ${ink}, 6px 6px 0 color-mix(in srgb, ${ink} 20%, transparent)`,
        }}>
          Knowly
        </h1>

        <p style={{
          fontFamily: "'Fredoka Variable', sans-serif",
          fontWeight: 600, fontSize: '0.72rem',
          letterSpacing: '0.18em', textTransform: 'uppercase',
          opacity: 0.55, marginTop: '8px',
          borderTop: `1px solid ${ink}`, borderBottom: `1px solid ${ink}`,
          padding: '4px 0', display: 'inline-block',
        }}>
          "All The Financial News Fit To Play"
        </p>
      </div>

      {/* ── Section nav ───────────────────────────────────────── */}
      <div style={{ borderBottom: `2px solid ${ink}`, display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
        {['Savings', 'Budgeting', 'Investing', 'Loans', 'Challenges'].map((s, i, arr) => (
          <button key={s} style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: '0.68rem', letterSpacing: '0.1em',
            textTransform: 'uppercase', padding: isMobile ? '8px 14px' : '8px 22px',
            borderRight: i < arr.length - 1 ? `1.5px solid ${ink}` : 'none',
            transition: 'background 0.1s',
            background: 'transparent',
            cursor: 'pointer',
            opacity: 0.75,
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = surface)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >{s}</button>
        ))}
      </div>

      {/* ── Main content ──────────────────────────────────────── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>

        {/* ── Row 1: Hero + Sidebar ─────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', borderBottom: `2px solid ${ink}` }}>

          {/* Hero article */}
          <div style={{
            padding: isMobile ? '16px' : '24px 24px 24px 0',
            borderRight: isMobile ? 'none' : `2px solid ${ink}`,
            borderBottom: isMobile ? `2px solid ${ink}` : 'none',
            cursor: 'pointer', transition: 'background 0.12s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = hover)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{
                background: '#E63946', color: '#FEF9EE',
                fontFamily: "'Fredoka One', cursive",
                fontSize: '0.6rem', letterSpacing: '0.12em',
                padding: '2px 10px', borderRadius: '9999px',
                border: `2px solid ${ink}`, boxShadow: `2px 2px 0 ${ink}`,
              }}>EXCLUSIVE</span>
              <span style={{
                fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700,
                fontSize: '0.6rem', letterSpacing: '0.12em',
                textTransform: 'uppercase', opacity: 0.55,
              }}>Today's Feature Story</span>
            </div>

            <h2 style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: 'clamp(1.6rem, 3vw, 2.6rem)',
              lineHeight: 1.1, marginBottom: '14px',
            }}>
              Compound Interest: The Superpower Every Saver Should Master
            </h2>

            <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontFamily: "'Fredoka Variable', sans-serif",
                  fontWeight: 500, fontSize: '0.9rem',
                  lineHeight: 1.65, opacity: 0.8, marginBottom: '20px',
                }}>
                  In a deep-dive feature rocking the financial world, local experts unpacked the timeless truth every saver can put to work: compound interest, when working <em>for</em> you, is the closest thing to a legal money-printing machine. When working <em>against</em> you, however...
                </p>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button style={btn('#FFCD00')}
                  onMouseEnter={liftOn}
                  onMouseLeave={e => liftOff(e, `3px 3px 0 ${ink}`)}
                  onMouseDown={pressDown}
                  onMouseUp={liftOn}
                  >Read Full Story →</button>

                  <span style={{
                    fontFamily: "'Fredoka Variable', sans-serif",
                    fontWeight: 600, fontSize: '0.72rem', opacity: 0.55,
                  }}>5 min read · +120 XP</span>
                </div>
              </div>

              <div style={{
                width: '130px', height: '130px',
                borderRadius: '50% 46% 50% 48%',
                border: `3px solid ${ink}`,
                background: '#FEF3C7',
                boxShadow: `4px 4px 0 ${ink}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '3.8rem', flexShrink: 0,
              }} className="rh-animate-float">🪙</div>
            </div>
          </div>

          {/* Player sidebar */}
          <div style={{ padding: '20px' }}>
            <div style={{
              border: `2.5px solid ${ink}`,
              borderRadius: '1.4rem 1.6rem 1.5rem 1.3rem',
              boxShadow: `5px 5px 0 ${ink}`,
              overflow: 'hidden', marginBottom: '16px',
              background: card,
            }}>
              <div style={{
                background: surface, borderBottom: `2px solid ${ink}`,
                padding: '7px 14px',
                fontFamily: "'Fredoka One', cursive",
                fontSize: '0.65rem', letterSpacing: '0.14em',
                textTransform: 'uppercase',
                display: 'flex', justifyContent: 'space-between',
              }}>
                <span>Your Profile</span><span>★</span>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    border: `3px solid ${ink}`, background: '#FFCD00',
                    boxShadow: `3px 3px 0 ${ink}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.9rem', margin: '0 auto 8px',
                  }} className="rh-hover-wobble">{player.avatar}</div>
                  <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.95rem' }}>{player.name}</div>
                  <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.55 }}>Level {player.level}</div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.7rem' }}>
                    <span>XP</span><span>{player.xp} / {player.xpMax}</span>
                  </div>
                  <Progress value={(player.xp / player.xpMax) * 100} />
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '6px 12px', borderRadius: '9999px',
                  border: `2px solid ${ink}`, background: '#FF7B25',
                  color: '#FEF9EE', marginBottom: '12px',
                  boxShadow: `2px 2px 0 ${ink}`,
                }}>
                  <span style={{ fontSize: '1.1rem' }}>🔥</span>
                  <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.78rem', letterSpacing: '0.05em' }}>{player.streak}-Day Streak</span>
                </div>

                <div>
                  <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.55, marginBottom: '7px' }}>Badges</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {player.badges.length === 0
                      ? <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.6rem', opacity: 0.4 }}>Play to earn badges!</span>
                      : player.badges.map(b => (
                        <span key={b} style={{
                          fontFamily: "'Fredoka Variable', sans-serif",
                          fontWeight: 700, fontSize: '0.58rem',
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                          padding: '2px 8px', borderRadius: '9999px',
                          border: `2px solid ${ink}`, background: surface,
                          boxShadow: `1px 1px 0 ${ink}`,
                        }}>{b}</span>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              border: `2px solid ${ink}`, borderRadius: '1rem 1.2rem 1rem 1.1rem',
              padding: '10px 14px', background: surface,
              boxShadow: `3px 3px 0 ${ink}`,
            }}>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.55, marginBottom: '5px' }}>Financial Forecast</div>
              <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.78rem', lineHeight: 1.5 }}>
                ☀️ Sunny with a chance of <strong>compound gains</strong>. Umbrella advised for unsecured loans.
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 2: Three game mode columns ─────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', borderBottom: `2px solid ${ink}` }}>
          {GAME_MODES.map((mode, i) => (
            <div key={mode.tag} style={{
              padding: '20px',
              borderRight: !isMobile && i < 2 ? `2px solid ${ink}` : 'none',
              borderBottom: isMobile && i < 2 ? `2px solid ${ink}` : 'none',
              cursor: 'pointer', transition: 'background 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = hover)}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{
                display: 'inline-block',
                background: mode.accent, color: '#1A0800',
                fontFamily: "'Fredoka One', cursive",
                fontSize: '0.58rem', letterSpacing: '0.1em',
                padding: '2px 10px', borderRadius: '9999px',
                border: `2px solid ${ink}`, boxShadow: `2px 2px 0 ${ink}`,
                marginBottom: '10px',
              }}>{mode.tag}</span>

              <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5, marginBottom: '6px' }}>{mode.kicker}</div>

              <h3 style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: '1.1rem', lineHeight: 1.2, marginBottom: '10px',
                display: 'flex', gap: '8px', alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: '1.7rem', lineHeight: 1, flexShrink: 0 }}>{mode.emoji}</span>
                <span>{mode.headline}</span>
              </h3>

              <p style={{
                fontFamily: "'Fredoka Variable', sans-serif",
                fontWeight: 500, fontSize: '0.82rem',
                lineHeight: 1.55, opacity: 0.72, marginBottom: '16px',
              }}>{mode.body}</p>

              <button style={btn(mode.accent)}
              onMouseEnter={liftOn}
              onMouseLeave={e => liftOff(e, `3px 3px 0 ${ink}`)}
              onMouseDown={pressDown}
              onMouseUp={liftOn}
              >{mode.cta}</button>
            </div>
          ))}
        </div>

        {/* ── Classifieds strip ────────────────────────────────── */}
        <div style={{
          padding: '10px 0',
          display: 'flex', alignItems: 'center',
          gap: '14px', flexWrap: 'wrap',
        }}>
          <span style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: '0.6rem', letterSpacing: '0.16em',
            textTransform: 'uppercase', opacity: 0.6,
            borderRight: `2px solid ${ink}`, paddingRight: '14px', flexShrink: 0,
          }}>Achievements</span>
          {[
            { icon: '🏆', text: 'First Quiz' },
            { icon: '⚡', text: 'Speed Reader' },
            { icon: '🎓', text: 'Finance 101' },
            { icon: '💰', text: '500 XP Club' },
            { icon: '🔥', text: '7-Day Streak' },
          ].map(item => (
            <div key={item.text} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              fontFamily: "'Fredoka Variable', sans-serif",
              fontWeight: 600, fontSize: '0.7rem', opacity: 0.5,
              padding: '3px 10px', borderRadius: '9999px',
              border: `1.5px dashed ${ink}`,
            }}>
              <span>{item.icon}</span><span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Breaking news ticker ──────────────────────────────── */}
      <BreakingTicker />
    </div>
  )
}

function BreakingTicker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS].join('   ·   ')
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      height: '36px', borderTop: `3px solid ${ink}`,
      display: 'flex', alignItems: 'center', overflow: 'hidden',
      background: '#E63946', color: '#FEF9EE',
    }}>
      <div style={{
        flexShrink: 0, height: '100%',
        display: 'flex', alignItems: 'center',
        padding: '0 14px', background: '#1A0800', color: '#FFCD00',
        fontFamily: "'Fredoka One', cursive",
        fontSize: '0.68rem', letterSpacing: '0.12em',
        borderRight: `3px solid ${ink}`, whiteSpace: 'nowrap',
      }}>BREAKING</div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <span style={{
          display: 'inline-block', whiteSpace: 'nowrap',
          fontFamily: "'Fredoka Variable', sans-serif",
          fontWeight: 600, fontSize: '0.78rem', letterSpacing: '0.03em',
          animation: 'ticker-scroll 55s linear infinite',
        }}>{doubled}</span>
      </div>
    </div>
  )
}

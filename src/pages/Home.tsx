import React from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'

const TODAY = new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
})

const TICKER_ITEMS = [
  '★ COMPOUND INTEREST: The secret banks hope you never discover',
  '★ BUDGETING SPECIAL: The 50/30/20 rule explained in one cartoon',
  '★ DAILY CHALLENGE UNLOCKED: Today\'s financial puzzle is now live',
  '★ PKO EXCLUSIVE: New savings rates announced — are you getting yours?',
  '★ STREAK ALERT: 847 players maintained a 7-day streak this week',
]

const PLAYER = { name: 'Rookie Investor', level: 1, xp: 340, xpMax: 1000, streak: 3 }

/* Ornamental rule with a centre symbol */
function Rule({ symbol = '✦', thick = false }: { symbol?: string; thick?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      margin: '10px 0',
    }}>
      <div style={{ flex: 1, height: thick ? '3px' : '1.5px', background: 'var(--rh-ink)', opacity: 0.7 }} />
      <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.75rem', opacity: 0.6 }}>{symbol}</span>
      <div style={{ flex: 1, height: thick ? '3px' : '1.5px', background: 'var(--rh-ink)', opacity: 0.7 }} />
    </div>
  )
}

/* Double thick rule — between major sections */
function DoubleRule() {
  return (
    <div style={{ margin: '0', borderTop: '3px double var(--rh-ink)', opacity: 0.8 }} />
  )
}

/* Column divider — vertical line */
const colDivider: React.CSSProperties = {
  borderRight: '2px solid var(--rh-ink)',
  opacity: 1,
}

export default function Home() {
  return (
    /* ── Page surface (the "desk" the newspaper sits on) ──── */
    <div style={{
      minHeight: '100vh',
      background: 'var(--rh-surface)',
      backgroundImage: 'radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px), radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px)',
      backgroundSize: '22px 22px',
      backgroundPosition: '0 0, 11px 11px',
      padding: '28px 20px 60px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>

      {/* Theme toggle — sits above the newspaper */}
      <div style={{ width: '100%', maxWidth: '980px', display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <ThemeToggle />
      </div>

      {/* ── THE NEWSPAPER ────────────────────────────────────── */}
      <div style={{
        width: '100%',
        maxWidth: '980px',
        background: 'var(--rh-paper)',
        border: '3px solid var(--rh-ink)',
        boxShadow: '8px 8px 0 var(--rh-ink), 14px 14px 0 color-mix(in srgb, var(--rh-ink) 20%, transparent)',
        transform: 'rotate(-0.4deg)',
        transformOrigin: 'center top',
        /* Newsprint dot texture */
        backgroundImage: 'radial-gradient(circle, var(--rh-body-dot) 0.8px, transparent 0.8px), radial-gradient(circle, var(--rh-body-dot) 0.8px, transparent 0.8px)',
        backgroundSize: '18px 18px',
        backgroundPosition: '0 0, 9px 9px',
      }}>

        {/* ── TOP META STRIP ─────────────────────────────────── */}
        <div style={{
          borderBottom: '1.5px solid var(--rh-ink)',
          padding: '4px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontFamily: "'Fredoka Variable', sans-serif",
          fontWeight: 700, fontSize: '0.6rem',
          letterSpacing: '0.1em', textTransform: 'uppercase',
          opacity: 0.65,
        }}>
          <span>Vol. I · No. 42 · Est. 2026</span>
          <span>{TODAY}</span>
          <span>Price: Free of Charge</span>
        </div>

        {/* ── MASTHEAD — inverted ─────────────────────────────── */}
        <div style={{
          background: 'var(--rh-ink)',
          color: 'var(--rh-paper)',
          textAlign: 'center',
          padding: '18px 20px 14px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative star row */}
          <div style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: '0.65rem', letterSpacing: '0.5em',
            opacity: 0.45, marginBottom: '4px',
          }}>✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦</div>

          {/* Newspaper name */}
          <h1 style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 'clamp(3rem, 9vw, 6.5rem)',
            lineHeight: 0.95, margin: 0,
            color: 'var(--rh-paper)',
            letterSpacing: '-0.01em',
            textShadow: '3px 3px 0 color-mix(in srgb, var(--rh-paper) 20%, transparent)',
          }}>The XP Gazette</h1>

          {/* Tagline bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '16px', marginTop: '8px',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--rh-paper)', opacity: 0.3 }} />
            <p style={{
              fontFamily: "'Fredoka Variable', sans-serif",
              fontWeight: 600, fontSize: '0.65rem',
              letterSpacing: '0.2em', textTransform: 'uppercase',
              margin: 0, opacity: 0.7, whiteSpace: 'nowrap',
            }}>"All The Financial News Fit To Play"</p>
            <div style={{ flex: 1, height: '1px', background: 'var(--rh-paper)', opacity: 0.3 }} />
          </div>

          {/* Bottom star row */}
          <div style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: '0.65rem', letterSpacing: '0.5em',
            opacity: 0.45, marginTop: '4px',
          }}>✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦</div>
        </div>

        {/* ── SECTION NAV ────────────────────────────────────── */}
        <div style={{
          borderBottom: '2px solid var(--rh-ink)',
          borderTop: '1.5px solid var(--rh-ink)',
          display: 'flex', justifyContent: 'center',
        }}>
          {['Savings', 'Budgeting', 'Investing', 'Loans', 'Challenges'].map((s, i, arr) => (
            <button key={s} style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: '0.65rem', letterSpacing: '0.12em',
              textTransform: 'uppercase', padding: '7px 20px',
              borderRight: i < arr.length - 1 ? '1.5px solid var(--rh-ink)' : 'none',
              background: 'transparent', cursor: 'pointer',
              transition: 'background 0.1s', opacity: 0.8,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--rh-surface)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >{s}</button>
          ))}
        </div>

        {/* ── MAIN HEADLINE ──────────────────────────────────── */}
        <div style={{ padding: '14px 18px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: '8px',
          }}>
            <span style={{
              background: 'var(--rh-ink)', color: 'var(--rh-paper)',
              fontFamily: "'Fredoka One', cursive",
              fontSize: '0.6rem', letterSpacing: '0.14em',
              padding: '2px 10px', borderRadius: '9999px',
            }}>EXCLUSIVE</span>
            <span style={{
              fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700,
              fontSize: '0.6rem', letterSpacing: '0.14em',
              textTransform: 'uppercase', opacity: 0.5,
            }}>Today's Front Page Feature</span>
          </div>

          <h2 style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: 'clamp(2rem, 5vw, 3.6rem)',
            lineHeight: 1.05, margin: '0 0 4px',
            letterSpacing: '0.01em',
          }}>
            Compound Interest: The Villain Banks Hope You Never Discover
          </h2>

          <p style={{
            fontFamily: "'Fredoka Variable', sans-serif",
            fontWeight: 600, fontSize: '0.85rem',
            lineHeight: 1.4, opacity: 0.65,
            fontStyle: 'italic', marginBottom: '6px',
          }}>
            A shocking exposé reveals the truth behind the most powerful (and dangerous) force in all of finance
          </p>
        </div>

        <div style={{ padding: '0 18px' }}>
          <Rule thick />
        </div>

        {/* ── THREE-COLUMN BODY ──────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 260px',
          borderBottom: '2px solid var(--rh-ink)',
        }}>

          {/* Column 1 */}
          <div style={{ padding: '14px 16px', ...colDivider }}>
            {/* Drop cap paragraph */}
            <p style={{
              fontFamily: "'Fredoka Variable', sans-serif",
              fontWeight: 500, fontSize: '0.82rem',
              lineHeight: 1.65, textAlign: 'justify',
              marginBottom: '12px',
            }}>
              <span style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: '3.6rem', lineHeight: '0.75',
                float: 'left', marginRight: '6px', marginTop: '4px',
                color: 'var(--rh-ink)',
              }}>I</span>
              n a shocking exposé that has rocked the financial world, local experts have confirmed what savvy investors have long suspected: compound interest, when working <em>for</em> you, is the closest thing to a legal money-printing machine available to ordinary citizens.
            </p>
            <p style={{
              fontFamily: "'Fredoka Variable', sans-serif",
              fontWeight: 500, fontSize: '0.82rem',
              lineHeight: 1.65, textAlign: 'justify',
            }}>
              "The problem," said one unnamed banker who wished to remain anonymous, "is that most people only experience compound interest when it's working against them — on a loan, a credit card, or a debt they can never seem to escape."
            </p>

            <Rule symbol="★" />

            {/* Pull quote */}
            <div style={{
              borderLeft: '4px solid var(--rh-ink)',
              paddingLeft: '12px', margin: '12px 0',
            }}>
              <p style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: '1.05rem', lineHeight: 1.3,
                fontStyle: 'italic', margin: 0,
              }}>"Give me compound interest working for me and I'll move the world."</p>
              <p style={{
                fontFamily: "'Fredoka Variable', sans-serif",
                fontWeight: 700, fontSize: '0.65rem',
                letterSpacing: '0.1em', textTransform: 'uppercase',
                opacity: 0.55, marginTop: '6px',
              }}>— Our Financial Correspondent</p>
            </div>
          </div>

          {/* Column 2 */}
          <div style={{ padding: '14px 16px', ...colDivider }}>
            {/* Illustration box */}
            <div style={{
              border: '2.5px solid var(--rh-ink)',
              borderRadius: '1rem 1.2rem 1rem 1.1rem',
              background: '#FEF3C7',
              marginBottom: '14px', overflow: 'hidden',
              boxShadow: '3px 3px 0 var(--rh-ink)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px', fontSize: '4.5rem',
                borderBottom: '2px solid var(--rh-ink)',
              }} className="rh-animate-float">🪙</div>
              <div style={{
                padding: '6px 10px', background: 'var(--rh-ink)', color: 'var(--rh-paper)',
                fontFamily: "'Fredoka One', cursive",
                fontSize: '0.6rem', letterSpacing: '0.12em',
                textTransform: 'uppercase', textAlign: 'center',
              }}>Fig. 1 — The Compound Coin</div>
            </div>

            <p style={{
              fontFamily: "'Fredoka Variable', sans-serif",
              fontWeight: 500, fontSize: '0.82rem',
              lineHeight: 1.65, textAlign: 'justify',
              marginBottom: '12px',
            }}>
              Experts recommend beginning one's savings journey as early as possible. "Starting at twenty-five versus thirty-five," noted one researcher, "can mean the difference between a comfortable retirement and eating toast for dinner at seventy."
            </p>
            <p style={{
              fontFamily: "'Fredoka Variable', sans-serif",
              fontWeight: 500, fontSize: '0.82rem',
              lineHeight: 1.65, textAlign: 'justify',
              marginBottom: '16px',
            }}>
              The full story, including interactive exercises and real PKO savings calculators, awaits inside today's edition. Readers who complete the full story earn <strong>+200 XP</strong> — redeemable toward Level 2 status.
            </p>

            <button style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: '0.78rem', letterSpacing: '0.08em',
              padding: '9px 22px', borderRadius: '9999px',
              border: '2.5px solid var(--rh-ink)',
              background: '#FFCD00', color: '#1A0800',
              boxShadow: '4px 4px 0 var(--rh-ink)',
              cursor: 'pointer', transition: 'transform 0.1s, box-shadow 0.1s',
              display: 'block',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '6px 6px 0 var(--rh-ink)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '4px 4px 0 var(--rh-ink)' }}
            onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = '1px 1px 0 var(--rh-ink)' }}
            onMouseUp={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '6px 6px 0 var(--rh-ink)' }}
            >Read Full Story → +200 XP</button>
          </div>

          {/* Sidebar column */}
          <div style={{ padding: '14px 14px' }}>

            {/* Player profile box */}
            <div style={{
              border: '2.5px solid var(--rh-ink)',
              borderRadius: '1.2rem 1.4rem 1.2rem 1.3rem',
              overflow: 'hidden', marginBottom: '14px',
              boxShadow: '4px 4px 0 var(--rh-ink)',
              background: 'var(--rh-card)',
            }}>
              <div style={{
                background: 'var(--rh-ink)', color: 'var(--rh-paper)',
                padding: '5px 12px',
                fontFamily: "'Fredoka One', cursive",
                fontSize: '0.6rem', letterSpacing: '0.16em',
                textTransform: 'uppercase', textAlign: 'center',
              }}>★ Your Profile ★</div>

              <div style={{ padding: '12px', textAlign: 'center' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  border: '3px solid var(--rh-ink)',
                  background: '#FFCD00',
                  boxShadow: '3px 3px 0 var(--rh-ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.7rem', margin: '0 auto 8px',
                }} className="rh-hover-wobble">🎩</div>
                <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.88rem' }}>{PLAYER.name}</div>
                <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.5, marginBottom: '10px' }}>Level {PLAYER.level}</div>

                {/* XP — hand-drawn bar style */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.65rem', marginBottom: '4px' }}>
                    <span>XP</span><span>{PLAYER.xp}/{PLAYER.xpMax}</span>
                  </div>
                  <div style={{
                    height: '12px', borderRadius: '9999px',
                    border: '2px solid var(--rh-ink)',
                    background: 'var(--rh-surface)',
                    boxShadow: '2px 2px 0 var(--rh-ink)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${(PLAYER.xp / PLAYER.xpMax) * 100}%`,
                      height: '100%',
                      background: '#FFCD00',
                      borderRight: '2px solid var(--rh-ink)',
                      borderRadius: '9999px',
                    }} />
                  </div>
                </div>

                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '4px 12px', borderRadius: '9999px',
                  border: '2px solid var(--rh-ink)',
                  background: '#FF7B25', color: '#FEF9EE',
                  boxShadow: '2px 2px 0 var(--rh-ink)',
                }}>
                  <span>🔥</span>
                  <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem' }}>{PLAYER.streak}-Day Streak</span>
                </div>
              </div>
            </div>

            {/* Financial forecast */}
            <div style={{
              border: '2px solid var(--rh-ink)',
              borderRadius: '1rem 1.2rem 1rem 1.1rem',
              overflow: 'hidden',
              boxShadow: '3px 3px 0 var(--rh-ink)',
              background: 'var(--rh-card)',
            }}>
              <div style={{
                background: 'var(--rh-ink)', color: 'var(--rh-paper)',
                padding: '4px 12px',
                fontFamily: "'Fredoka One', cursive",
                fontSize: '0.58rem', letterSpacing: '0.16em',
                textTransform: 'uppercase', textAlign: 'center',
              }}>Financial Forecast</div>
              <div style={{ padding: '10px 12px', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.55 }}>
                ☀️ Sunny with a chance of <strong>compound gains.</strong> Bring an umbrella if holding unsecured debt.
              </div>
            </div>
          </div>
        </div>

        {/* ── BOTTOM THREE STORIES ───────────────────────────── */}
        <div style={{
          borderBottom: '2px solid var(--rh-ink)',
          padding: '2px 18px',
          background: 'var(--rh-ink)',
          color: 'var(--rh-paper)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            ✦ Inside This Edition ✦
          </span>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        }}>
          {[
            { tag: 'QUICK ROUNDS', kicker: 'TEST YOUR IQ', headline: 'Are You Smarter Than Your Bank Manager?', body: 'Five rapid-fire questions. Thirty seconds each. Your financial intelligence is about to be tested.', emoji: '🎯', accent: '#FFCD00', xp: '+80 XP', cta: 'Start Quiz →' },
            { tag: 'DECISION ROOM', kicker: 'EXCLUSIVE SCENARIO', headline: 'Young Investor Faces Choice That Could Change Everything', body: 'Enter the Decision Room. One scenario, multiple paths, real consequences for your financial future.', emoji: '🎲', accent: '#E63946', xp: '+150 XP', cta: 'Enter Room →' },
            { tag: 'DAILY STREAK', kicker: 'STREAK CHALLENGE', headline: "The 30-Day Challenge That Changed One Investor's Life Forever", body: "One challenge per day keeps financial ignorance at bay. Don't break your streak now.", emoji: '🔥', accent: '#FF7B25', xp: '+50 XP', cta: 'Claim Reward →' },
          ].map((s, i) => (
            <div key={s.tag} style={{
              padding: '16px',
              borderRight: i < 2 ? '2px solid var(--rh-ink)' : 'none',
              cursor: 'pointer', transition: 'background 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--rh-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{
                  background: s.accent, color: '#1A0800',
                  fontFamily: "'Fredoka One', cursive",
                  fontSize: '0.58rem', letterSpacing: '0.1em',
                  padding: '1px 9px', borderRadius: '9999px',
                  border: '2px solid var(--rh-ink)', boxShadow: '2px 2px 0 var(--rh-ink)',
                }}>{s.tag}</span>
                <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.56rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.45 }}>{s.kicker}</span>
              </div>

              <h3 style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: '1rem', lineHeight: 1.2, marginBottom: '8px',
                display: 'flex', gap: '7px',
              }}>
                <span style={{ fontSize: '1.5rem', lineHeight: 1, flexShrink: 0 }}>{s.emoji}</span>
                <span>{s.headline}</span>
              </h3>

              <p style={{
                fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500,
                fontSize: '0.78rem', lineHeight: 1.55,
                opacity: 0.7, marginBottom: '12px', textAlign: 'justify',
              }}>{s.body}</p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button style={{
                  fontFamily: "'Fredoka One', cursive",
                  fontSize: '0.72rem', letterSpacing: '0.06em',
                  padding: '6px 16px', borderRadius: '9999px',
                  border: '2.5px solid var(--rh-ink)',
                  background: s.accent, color: '#1A0800',
                  boxShadow: '3px 3px 0 var(--rh-ink)',
                  cursor: 'pointer', transition: 'transform 0.1s, box-shadow 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '5px 5px 0 var(--rh-ink)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '3px 3px 0 var(--rh-ink)' }}
                onMouseDown={e => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = '1px 1px 0 var(--rh-ink)' }}
                onMouseUp={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = '5px 5px 0 var(--rh-ink)' }}
                >{s.cta}</button>
                <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.65rem', opacity: 0.5 }}>{s.xp}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── CLASSIFIEDS FOOTER ─────────────────────────────── */}
        <div style={{
          borderTop: '2.5px solid var(--rh-ink)',
          padding: '8px 18px',
          display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
          background: 'var(--rh-surface)',
        }}>
          <span style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: '0.58rem', letterSpacing: '0.18em',
            textTransform: 'uppercase', opacity: 0.6,
            borderRight: '1.5px solid var(--rh-ink)', paddingRight: '12px', flexShrink: 0,
          }}>Achievements</span>
          {['🏆 First Quiz', '⚡ Speed Reader', '🎓 Finance 101', '💰 500 XP Club', '🔥 7-Day Streak'].map(item => (
            <span key={item} style={{
              fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700,
              fontSize: '0.64rem', opacity: 0.5,
              padding: '2px 9px', borderRadius: '9999px',
              border: '1.5px dashed var(--rh-ink)',
            }}>{item}</span>
          ))}
        </div>

      </div>{/* end newspaper */}

      {/* ── BREAKING NEWS TICKER ─────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        height: '36px', borderTop: '3px solid var(--rh-ink)',
        display: 'flex', alignItems: 'center', overflow: 'hidden',
        background: '#E63946', color: '#FEF9EE',
      }}>
        <div style={{
          flexShrink: 0, height: '100%',
          display: 'flex', alignItems: 'center',
          padding: '0 14px', background: '#1A0800', color: '#FFCD00',
          fontFamily: "'Fredoka One', cursive",
          fontSize: '0.68rem', letterSpacing: '0.12em',
          borderRight: '3px solid var(--rh-ink)', whiteSpace: 'nowrap',
        }}>BREAKING</div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <span style={{
            display: 'inline-block', whiteSpace: 'nowrap',
            fontFamily: "'Fredoka Variable', sans-serif",
            fontWeight: 600, fontSize: '0.78rem', letterSpacing: '0.03em',
            animation: 'ticker-scroll 55s linear infinite',
          }}>{[...TICKER_ITEMS, ...TICKER_ITEMS].join('   ·   ')}</span>
        </div>
      </div>

    </div>
  )
}

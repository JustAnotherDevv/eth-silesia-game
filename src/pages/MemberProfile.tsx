import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { MEMBERS, BADGE_CATALOG } from '../data/members'

const ink     = 'var(--rh-ink)'
const paper   = 'var(--rh-paper)'
const surface = 'var(--rh-surface)'

const LEVEL_COLORS: Record<string, string> = {
  Legend: '#FFCD00',
  Expert: '#1565C0',
  Pro:    '#2D9A4E',
  Rookie: '#E63946',
}

const ACTIVITY_COLORS: Record<string, string> = {
  quiz:      '#1565C0',
  badge:     '#FFCD00',
  rank:      '#2D9A4E',
  challenge: '#E63946',
  streak:    '#FF7B25',
}

// ─── Starburst behind avatar ──────────────────────────────────────
function StarburstSVG({ color }: { color: string }) {
  const n = 16
  return (
    <svg width="240" height="240" viewBox="-120 -120 240 240"
      style={{ position:'absolute', top:'50%', left:'50%',
               transform:'translate(-50%,-50%)', pointerEvents:'none', opacity:0.85 }}>
      <g>
        {Array.from({ length: n }, (_, i) => {
          const angle = (i / n) * 360
          const isMain = i % 2 === 0
          const inner = 52, outer = isMain ? 110 : 84
          const rad = (angle * Math.PI) / 180
          return (
            <line key={i}
              x1={Math.cos(rad) * inner} y1={Math.sin(rad) * inner}
              x2={Math.cos(rad) * outer} y2={Math.sin(rad) * outer}
              stroke={color}
              strokeWidth={isMain ? 9 : 5}
              strokeLinecap="round"
              opacity={isMain ? 0.6 : 0.3}
            />
          )
        })}
        <animateTransform attributeName="transform" type="rotate"
          from="0 0 0" to="360 0 0" dur="28s" repeatCount="indefinite"/>
      </g>
    </svg>
  )
}

// ─── Confetti burst around avatar ─────────────────────────────────
function ConfettiRing({ color }: { color: string }) {
  const pieces = [
    { x:0,   y:-90, rot:0,   fill:'#E63946' },
    { x:64,  y:-64, rot:45,  fill:'#FFCD00' },
    { x:90,  y:0,   rot:90,  fill:color },
    { x:64,  y:64,  rot:135, fill:'#2D9A4E' },
    { x:0,   y:90,  rot:180, fill:'#F48CB1' },
    { x:-64, y:64,  rot:225, fill:'#FF7B25' },
    { x:-90, y:0,   rot:270, fill:'#7B2D8B' },
    { x:-64, y:-64, rot:315, fill:'#1565C0' },
  ]
  return (
    <svg width="220" height="220" viewBox="-110 -110 220 220"
      style={{ position:'absolute', top:'50%', left:'50%',
               transform:'translate(-50%,-50%)', pointerEvents:'none' }}>
      {pieces.map((p, i) => (
        <ellipse key={i} cx={p.x} cy={p.y} rx={5} ry={3}
          fill={p.fill} stroke="#1A0800" strokeWidth="0.8"
          transform={`rotate(${p.rot} ${p.x} ${p.y})`}>
          <animateTransform attributeName="transform" type="translate"
            values="0,0;0,-5;0,0" dur={`${1.4 + i * 0.22}s`}
            repeatCount="indefinite" additive="sum"/>
        </ellipse>
      ))}
    </svg>
  )
}

// ─── Not found ────────────────────────────────────────────────────
function NotFound() {
  return (
    <div style={{ minHeight:'100vh', background:'var(--rh-surface)',
      backgroundImage:'radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px)',
      backgroundSize:'22px 22px',
      display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'16px' }}>
      <div style={{ fontSize:'4rem' }} className="rh-animate-float">🔍</div>
      <div style={{ fontFamily:"'Fredoka One', cursive", fontSize:'1.8rem' }}>Member not found!</div>
      <Link to="/community" style={{
        fontFamily:"'Fredoka One', cursive", fontSize:'0.82rem',
        letterSpacing:'0.08em', padding:'10px 24px', borderRadius:'9999px',
        border:`2.5px solid ${ink}`, background:'#FFCD00', color:'#1A0800',
        boxShadow:`3px 3px 0 ${ink}`, textDecoration:'none',
      }}>← Back to Community</Link>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────
export default function MemberProfile() {
  const { slug } = useParams<{ slug: string }>()
  const member = MEMBERS.find(m => m.slug === slug)

  if (!member) return <NotFound />

  const lc      = LEVEL_COLORS[member.level]
  const isLight = member.level === 'Legend'
  const textOn  = isLight ? '#1A0800' : '#FEF9EE'
  const xpPct   = Math.round((member.xp / member.xpMax) * 100)

  const earnedSet  = new Set(member.badgeIds)
  const earnedList = BADGE_CATALOG.filter(b => earnedSet.has(b.id))
  const lockedList = BADGE_CATALOG.filter(b => !earnedSet.has(b.id))

  return (
    <>
      <style>{`
        @keyframes rh-online-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(45,154,78,0.55); }
          50%      { box-shadow: 0 0 0 6px rgba(45,154,78,0); }
        }
        .rh-online-pulse { animation: rh-online-pulse 2s ease-in-out infinite; }
      `}</style>

      <div style={{
        minHeight:'100vh',
        background:'var(--rh-surface)',
        backgroundImage:'radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px), radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px)',
        backgroundSize:'22px 22px', backgroundPosition:'0 0, 11px 11px',
        paddingBottom:'64px',
      }}>

        {/* ── HERO ─────────────────────────────────────────── */}
        <div style={{
          background: lc,
          borderBottom: `3px solid ${ink}`,
          borderRadius: '0 0 3rem 2.5rem',
          boxShadow: `0 8px 0 ${ink}`,
          padding: '0 24px 32px',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Dot pattern overlay */}
          <div style={{
            position:'absolute', inset:0, pointerEvents:'none',
            backgroundImage:'radial-gradient(circle, rgba(26,8,0,0.12) 1px, transparent 1px)',
            backgroundSize:'18px 18px',
          }} />

          {/* Back link */}
          <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
            <div style={{ paddingTop:'20px', marginBottom:'24px' }}>
              <Link to="/community" style={{
                fontFamily:"'Fredoka One', cursive", fontSize:'0.72rem',
                letterSpacing:'0.1em', textTransform:'uppercase',
                padding:'7px 18px', borderRadius:'9999px',
                border:`2px solid ${isLight ? 'rgba(26,8,0,0.35)' : 'rgba(254,249,238,0.4)'}`,
                background:'rgba(26,8,0,0.12)', color: textOn,
                textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'6px',
                backdropFilter:'blur(2px)',
              }}>← Community</Link>
            </div>

            {/* Hero content grid */}
            <div style={{
              display:'grid', gridTemplateColumns:'auto 1fr',
              gap:'36px', alignItems:'center',
            }}>
              {/* Avatar + starburst */}
              <div style={{ position:'relative', width:'160px', height:'160px', flexShrink:0 }}>
                <StarburstSVG color={isLight ? 'rgba(26,8,0,0.25)' : 'rgba(254,249,238,0.3)'} />
                <ConfettiRing color={lc} />
                <div className="rh-animate-float" style={{
                  position:'absolute', top:'50%', left:'50%',
                  transform:'translate(-50%,-50%)',
                  width:'120px', height:'120px', borderRadius:'50%',
                  background: member.accent,
                  border:`4px solid ${isLight ? '#1A0800' : '#FEF9EE'}`,
                  boxShadow:`5px 5px 0 ${isLight ? 'rgba(26,8,0,0.3)' : 'rgba(0,0,0,0.3)'}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'3.2rem', zIndex:2,
                } as React.CSSProperties}>
                  {member.avatar}
                  {member.online && (
                    <div className="rh-online-pulse" style={{
                      position:'absolute', bottom:'6px', right:'6px',
                      width:'16px', height:'16px', borderRadius:'50%',
                      background:'#2D9A4E',
                      border:`2.5px solid ${isLight ? '#1A0800' : '#FEF9EE'}`,
                    }} />
                  )}
                  {member.isYou && (
                    <span style={{
                      position:'absolute', bottom:'-10px',
                      background:'#E63946', color:'#FEF9EE',
                      fontFamily:"'Fredoka One', cursive", fontSize:'0.5rem',
                      letterSpacing:'0.1em', padding:'2px 10px',
                      borderRadius:'9999px', border:`2px solid #1A0800`,
                      whiteSpace:'nowrap', boxShadow:`2px 2px 0 #1A0800`,
                    }}>YOU</span>
                  )}
                </div>
              </div>

              {/* Name + info */}
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap', marginBottom:'10px' }}>
                  <h1 style={{
                    fontFamily:"'Fredoka One', cursive",
                    fontSize:'clamp(2.2rem, 5vw, 3.4rem)', lineHeight:1,
                    color: textOn,
                    textShadow: isLight ? `4px 4px 0 rgba(26,8,0,0.2)` : `3px 3px 0 rgba(0,0,0,0.3)`,
                    margin:0,
                  }}>{member.name}</h1>
                  {member.isYou && (
                    <span style={{
                      background:'#E63946', color:'#FEF9EE',
                      fontFamily:"'Fredoka One', cursive", fontSize:'0.6rem',
                      letterSpacing:'0.12em', padding:'4px 14px',
                      borderRadius:'9999px', border:`2px solid #1A0800`,
                      boxShadow:`2px 2px 0 #1A0800`,
                    }}>YOU</span>
                  )}
                </div>

                {/* Pills */}
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'18px' }}>
                  <span style={{
                    background:'rgba(26,8,0,0.2)', color: textOn,
                    fontFamily:"'Fredoka One', cursive", fontSize:'0.65rem',
                    letterSpacing:'0.15em', textTransform:'uppercase',
                    padding:'4px 16px', borderRadius:'9999px',
                    border:`2px solid rgba(26,8,0,0.25)`,
                  }}>{member.level}</span>
                  <span style={{
                    background:'rgba(26,8,0,0.15)', color: textOn,
                    fontFamily:"'Fredoka One', cursive", fontSize:'0.65rem',
                    letterSpacing:'0.08em', padding:'4px 16px', borderRadius:'9999px',
                    border:`2px solid rgba(26,8,0,0.2)`,
                  }}>{member.location} {member.specialty}</span>
                  <span style={{
                    background:'rgba(26,8,0,0.15)', color: textOn,
                    fontFamily:"'Fredoka One', cursive", fontSize:'0.65rem',
                    letterSpacing:'0.08em', padding:'4px 16px', borderRadius:'9999px',
                    border:`2px solid rgba(26,8,0,0.2)`,
                  }}>🗓️ Since {member.joined}</span>
                  {member.online && (
                    <span style={{
                      background:'#2D9A4E', color:'#FEF9EE',
                      fontFamily:"'Fredoka One', cursive", fontSize:'0.65rem',
                      letterSpacing:'0.08em', padding:'4px 16px', borderRadius:'9999px',
                      border:`2px solid rgba(26,8,0,0.3)`,
                    }}>● Online Now</span>
                  )}
                </div>

                {/* XP bar */}
                <div style={{ marginBottom:'18px', maxWidth:'500px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                    <span style={{
                      fontFamily:"'Fredoka One', cursive", fontSize:'0.65rem',
                      letterSpacing:'0.1em', textTransform:'uppercase', color: textOn, opacity:0.7,
                    }}>XP Progress</span>
                    <span style={{
                      fontFamily:"'Fredoka One', cursive", fontSize:'0.78rem', color: textOn,
                    }}>{member.xp.toLocaleString()} / {member.xpMax.toLocaleString()}</span>
                  </div>
                  <div style={{
                    height:'14px', borderRadius:'9999px', overflow:'hidden',
                    background:'rgba(26,8,0,0.2)',
                    border:`2px solid ${isLight ? 'rgba(26,8,0,0.25)' : 'rgba(254,249,238,0.25)'}`,
                  }}>
                    <div style={{
                      width:`${xpPct}%`, height:'100%', borderRadius:'9999px',
                      background: isLight ? 'rgba(26,8,0,0.45)' : 'rgba(254,249,238,0.7)',
                      transition:'width 1s cubic-bezier(.4,0,.2,1)',
                    }} />
                  </div>
                  <div style={{
                    fontFamily:"'Fredoka Variable', sans-serif", fontWeight:700,
                    fontSize:'0.58rem', textAlign:'right', color: textOn, opacity:0.6, marginTop:'3px',
                  }}>{xpPct}% to next level</div>
                </div>

                {/* Quick stats row */}
                <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                  {[
                    { label:'Global Rank', val:`#${member.rank}`,    emoji:'🏅' },
                    { label:'Day Streak',  val:`${member.streak}d`,  emoji:'🔥' },
                    { label:'Badges',      val:String(member.badges),emoji:'🏆' },
                    { label:'Quizzes',     val:String(member.quizzes),emoji:'🎯' },
                    { label:'Friends',     val:String(member.friends),emoji:'👥' },
                  ].map(s => (
                    <div key={s.label} style={{
                      background:'rgba(26,8,0,0.18)',
                      border:`2px solid rgba(26,8,0,0.2)`,
                      borderRadius:'1rem 0.8rem 1rem 0.9rem',
                      padding:'8px 14px', textAlign:'center',
                      backdropFilter:'blur(2px)',
                    }}>
                      <div style={{ fontSize:'1rem', marginBottom:'1px' }}>{s.emoji}</div>
                      <div style={{
                        fontFamily:"'Fredoka One', cursive", fontSize:'1rem', color: textOn,
                      }}>{s.val}</div>
                      <div style={{
                        fontFamily:"'Fredoka Variable', sans-serif", fontWeight:700,
                        fontSize:'0.5rem', color: textOn, opacity:0.6,
                        textTransform:'uppercase', letterSpacing:'0.07em',
                      }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display:'flex', gap:'10px', marginTop:'24px', flexWrap:'wrap' }}>
              {!member.isYou ? (
                <>
                  <button style={{
                    fontFamily:"'Fredoka One', cursive", fontSize:'0.8rem',
                    letterSpacing:'0.08em', textTransform:'uppercase',
                    padding:'11px 28px', borderRadius:'9999px',
                    border:`2.5px solid ${isLight ? '#1A0800' : '#FEF9EE'}`,
                    background: isLight ? '#1A0800' : '#FEF9EE',
                    color: isLight ? '#FEF9EE' : '#1A0800',
                    boxShadow:`3px 3px 0 ${isLight ? 'rgba(26,8,0,0.3)' : 'rgba(0,0,0,0.3)'}`,
                    cursor:'pointer', transition:'transform 0.1s, box-shadow 0.1s',
                  } as React.CSSProperties}
                  onMouseEnter={e => { e.currentTarget.style.transform='translate(-2px,-2px)'; e.currentTarget.style.boxShadow=`5px 5px 0 ${isLight ? 'rgba(26,8,0,0.3)' : 'rgba(0,0,0,0.3)'}` }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=`3px 3px 0 ${isLight ? 'rgba(26,8,0,0.3)' : 'rgba(0,0,0,0.3)'}` }}
                  >⚡ Challenge</button>
                  <button style={{
                    fontFamily:"'Fredoka One', cursive", fontSize:'0.8rem',
                    letterSpacing:'0.08em', textTransform:'uppercase',
                    padding:'11px 28px', borderRadius:'9999px',
                    border:`2.5px solid ${isLight ? '#1A0800' : '#FEF9EE'}`,
                    background:'rgba(26,8,0,0.15)', color: textOn,
                    boxShadow:`3px 3px 0 ${isLight ? 'rgba(26,8,0,0.3)' : 'rgba(0,0,0,0.3)'}`,
                    cursor:'pointer', transition:'transform 0.1s, box-shadow 0.1s',
                  } as React.CSSProperties}
                  onMouseEnter={e => { e.currentTarget.style.transform='translate(-2px,-2px)'; e.currentTarget.style.boxShadow=`5px 5px 0 ${isLight ? 'rgba(26,8,0,0.3)' : 'rgba(0,0,0,0.3)'}` }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=`3px 3px 0 ${isLight ? 'rgba(26,8,0,0.3)' : 'rgba(0,0,0,0.3)'}` }}
                  >👥 Follow</button>
                </>
              ) : (
                <Link to="/profile" style={{
                  fontFamily:"'Fredoka One', cursive", fontSize:'0.8rem',
                  letterSpacing:'0.08em', textTransform:'uppercase',
                  padding:'11px 28px', borderRadius:'9999px',
                  border:`2.5px solid #1A0800`,
                  background:'#1A0800', color:'#FFCD00',
                  boxShadow:`3px 3px 0 rgba(26,8,0,0.3)`,
                  textDecoration:'none', display:'inline-block',
                }}>✏️ Edit My Profile</Link>
              )}
            </div>
          </div>
        </div>

        {/* ── BODY ─────────────────────────────────────────── */}
        <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 24px' }}>

          {/* ── Row 1: About + XP Breakdown ──────────────── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'20px' }}>

            {/* About card */}
            <div style={{
              background:paper, border:`3px solid ${ink}`,
              borderRadius:'2rem 1.8rem 2rem 1.9rem',
              boxShadow:`6px 6px 0 ${ink}`, padding:'24px',
            }}>
              <div style={{
                fontFamily:"'Fredoka One', cursive", fontSize:'0.65rem',
                letterSpacing:'0.16em', textTransform:'uppercase', opacity:0.45, marginBottom:'14px',
              }}>★ About</div>

              {/* Specialty spotlight */}
              <div style={{
                background: `color-mix(in srgb, ${lc} 15%, ${surface})`,
                border:`2px solid color-mix(in srgb, ${lc} 40%, ${ink})`,
                borderRadius:'1.2rem 1rem 1.2rem 1rem',
                padding:'12px 16px', marginBottom:'16px',
                display:'flex', alignItems:'center', gap:'12px',
              }}>
                <div style={{
                  width:'44px', height:'44px', borderRadius:'50%',
                  background:lc, border:`2px solid ${ink}`,
                  boxShadow:`2px 2px 0 ${ink}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'1.4rem', flexShrink:0,
                }}>{member.avatar}</div>
                <div>
                  <div style={{
                    fontFamily:"'Fredoka One', cursive", fontSize:'0.7rem',
                    letterSpacing:'0.1em', textTransform:'uppercase', opacity:0.5,
                  }}>Specialty</div>
                  <div style={{ fontFamily:"'Fredoka One', cursive", fontSize:'1rem' }}>
                    {member.specialty}
                  </div>
                </div>
              </div>

              {/* Bio */}
              <p style={{
                fontFamily:"'Fredoka Variable', sans-serif", fontWeight:600,
                fontSize:'0.88rem', lineHeight:1.65, fontStyle:'italic',
                opacity:0.78, margin:'0 0 16px',
              }}>"{member.bio}"</p>

              {/* Details */}
              <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                {[
                  { icon:'📍', text: `${member.location} · Rank #${member.rank} globally` },
                  { icon:'🗓️', text: `Member since ${member.joined}` },
                  { icon:'👥', text: `${member.friends} friends · ${member.quizzes} quizzes completed` },
                ].map(d => (
                  <div key={d.icon} style={{
                    fontFamily:"'Fredoka Variable', sans-serif", fontWeight:600,
                    fontSize:'0.72rem', opacity:0.55,
                    display:'flex', alignItems:'center', gap:'8px',
                  }}>
                    <span>{d.icon}</span>{d.text}
                  </div>
                ))}
              </div>
            </div>

            {/* XP Breakdown */}
            <div style={{
              background:paper, border:`3px solid ${ink}`,
              borderRadius:'1.9rem 2rem 1.8rem 2rem',
              boxShadow:`6px 6px 0 ${ink}`, padding:'24px',
            }}>
              <div style={{
                fontFamily:"'Fredoka One', cursive", fontSize:'0.65rem',
                letterSpacing:'0.16em', textTransform:'uppercase', opacity:0.45, marginBottom:'14px',
              }}>★ XP Breakdown by Category</div>

              <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                {member.xpBreakdown.map(cat => (
                  <div key={cat.label}>
                    <div style={{
                      display:'flex', justifyContent:'space-between', marginBottom:'5px',
                    }}>
                      <span style={{
                        fontFamily:"'Fredoka One', cursive", fontSize:'0.76rem',
                      }}>{cat.label}</span>
                      <span style={{
                        fontFamily:"'Fredoka One', cursive", fontSize:'0.76rem', opacity:0.6,
                      }}>{cat.pct}%</span>
                    </div>
                    <div style={{
                      height:'11px', borderRadius:'9999px', overflow:'hidden',
                      background:surface,
                      border:`1.5px solid color-mix(in srgb, ${ink} 14%, transparent)`,
                    }}>
                      <div style={{
                        width:`${cat.pct}%`, height:'100%', borderRadius:'9999px',
                        background:`linear-gradient(90deg, ${cat.color}, color-mix(in srgb, ${cat.color} 65%, white))`,
                        transition:'width 1s cubic-bezier(.4,0,.2,1)',
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Total XP callout */}
              <div style={{
                marginTop:'20px',
                background:`color-mix(in srgb, ${lc} 18%, ${surface})`,
                border:`2px solid color-mix(in srgb, ${lc} 35%, ${ink})`,
                borderRadius:'1.2rem 1rem 1.2rem 1rem',
                padding:'10px 16px',
                display:'flex', justifyContent:'space-between', alignItems:'center',
              }}>
                <span style={{
                  fontFamily:"'Fredoka One', cursive", fontSize:'0.65rem',
                  letterSpacing:'0.1em', textTransform:'uppercase', opacity:0.55,
                }}>Total XP Earned</span>
                <span style={{
                  fontFamily:"'Fredoka One', cursive", fontSize:'1.2rem',
                }}>{member.xp.toLocaleString()} <span style={{ opacity:0.45, fontSize:'0.65rem' }}>XP</span></span>
              </div>
            </div>
          </div>

          {/* ── Badge Collection ──────────────────────────── */}
          <div style={{
            background:paper, border:`3px solid ${ink}`,
            borderRadius:'2.2rem 1.9rem 2rem 2.1rem',
            boxShadow:`6px 6px 0 ${ink}`,
            padding:'28px', marginBottom:'20px',
          }}>
            {/* Header */}
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              marginBottom:'20px', flexWrap:'wrap', gap:'8px',
            }}>
              <div>
                <div style={{
                  fontFamily:"'Fredoka One', cursive", fontSize:'0.65rem',
                  letterSpacing:'0.16em', textTransform:'uppercase', opacity:0.45, marginBottom:'4px',
                }}>★ Badge Collection</div>
                <div style={{ fontFamily:"'Fredoka One', cursive", fontSize:'1.4rem', lineHeight:1 }}>
                  {earnedList.length} Earned · <span style={{ opacity:0.4 }}>{lockedList.length} Locked</span>
                </div>
              </div>
              <div style={{
                background:`color-mix(in srgb, ${lc} 20%, ${surface})`,
                border:`2px solid color-mix(in srgb, ${lc} 40%, ${ink})`,
                borderRadius:'9999px', padding:'6px 18px',
                fontFamily:"'Fredoka One', cursive", fontSize:'0.72rem',
                letterSpacing:'0.08em',
              }}>{Math.round((earnedList.length / BADGE_CATALOG.length) * 100)}% Complete</div>
            </div>

            {/* Earned badges */}
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fill, minmax(130px, 1fr))',
              gap:'10px', marginBottom:'20px',
            }}>
              {earnedList.map(badge => (
                <div key={badge.id} className="rh-hover-wobble" style={{
                  background:`color-mix(in srgb, ${lc} 12%, ${paper})`,
                  border:`2.5px solid ${ink}`,
                  boxShadow:`3px 3px 0 ${ink}`,
                  borderRadius:'1.5rem 1.2rem 1.5rem 1.3rem',
                  padding:'14px 10px', textAlign:'center',
                  cursor:'default',
                  transition:'transform 0.12s, box-shadow 0.12s',
                } as React.CSSProperties}
                onMouseEnter={e => { e.currentTarget.style.transform='translate(-2px,-2px)'; e.currentTarget.style.boxShadow=`5px 5px 0 ${ink}` }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=`3px 3px 0 ${ink}` }}
                >
                  <div style={{ fontSize:'1.8rem', marginBottom:'6px' }}>{badge.emoji}</div>
                  <div style={{
                    fontFamily:"'Fredoka One', cursive", fontSize:'0.72rem',
                    lineHeight:1.2, marginBottom:'4px',
                  }}>{badge.name}</div>
                  <div style={{
                    fontFamily:"'Fredoka Variable', sans-serif", fontWeight:600,
                    fontSize:'0.52rem', opacity:0.45, lineHeight:1.3,
                  }}>{badge.desc}</div>
                </div>
              ))}
            </div>

            {/* Locked badges */}
            {lockedList.length > 0 && (
              <>
                <div style={{
                  fontFamily:"'Fredoka One', cursive", fontSize:'0.6rem',
                  letterSpacing:'0.14em', textTransform:'uppercase', opacity:0.35,
                  marginBottom:'10px', display:'flex', alignItems:'center', gap:'8px',
                }}>
                  <div style={{ flex:1, height:'1px', background:`color-mix(in srgb, ${ink} 15%, transparent)` }} />
                  🔒 Locked
                  <div style={{ flex:1, height:'1px', background:`color-mix(in srgb, ${ink} 15%, transparent)` }} />
                </div>
                <div style={{
                  display:'grid',
                  gridTemplateColumns:'repeat(auto-fill, minmax(110px, 1fr))',
                  gap:'8px',
                }}>
                  {lockedList.map(badge => (
                    <div key={badge.id} style={{
                      background:surface, opacity:0.42,
                      border:`2px dashed color-mix(in srgb, ${ink} 30%, transparent)`,
                      borderRadius:'1.2rem 1rem 1.2rem 1rem',
                      padding:'10px 8px', textAlign:'center',
                      filter:'grayscale(1)',
                    }}>
                      <div style={{ fontSize:'1.4rem', marginBottom:'4px' }}>{badge.emoji}</div>
                      <div style={{
                        fontFamily:"'Fredoka One', cursive", fontSize:'0.6rem', lineHeight:1.2,
                      }}>{badge.name}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── Row 2: Activity Timeline + Achievements ───── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>

            {/* Activity Timeline */}
            <div style={{
              background:paper, border:`3px solid ${ink}`,
              borderRadius:'2rem 1.8rem 2rem 1.9rem',
              boxShadow:`6px 6px 0 ${ink}`, padding:'24px',
            }}>
              <div style={{
                fontFamily:"'Fredoka One', cursive", fontSize:'0.65rem',
                letterSpacing:'0.16em', textTransform:'uppercase', opacity:0.45, marginBottom:'18px',
              }}>★ Recent Activity</div>

              <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
                {member.recentActivity.map((evt, i) => {
                  const dotColor = ACTIVITY_COLORS[evt.type]
                  const isLast = i === member.recentActivity.length - 1
                  return (
                    <div key={i} style={{ display:'flex', gap:'14px' }}>
                      {/* Timeline spine */}
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                        <div style={{
                          width:'14px', height:'14px', borderRadius:'50%',
                          background:dotColor, border:`2.5px solid ${ink}`,
                          boxShadow:`1px 1px 0 ${ink}`,
                          flexShrink:0, marginTop:'3px',
                        }} />
                        {!isLast && (
                          <div style={{
                            width:'2px', flex:1, minHeight:'24px',
                            background:`color-mix(in srgb, ${ink} 12%, transparent)`,
                            marginTop:'3px', marginBottom:'3px',
                          }} />
                        )}
                      </div>

                      {/* Event content */}
                      <div style={{ paddingBottom: isLast ? 0 : '16px', flex:1 }}>
                        <div style={{
                          fontFamily:"'Fredoka One', cursive", fontSize:'0.82rem',
                          lineHeight:1.3, marginBottom:'3px',
                        }}>
                          {evt.emoji} {evt.text}
                        </div>
                        <div style={{ display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
                          {evt.xp !== undefined && (
                            <span style={{
                              background:`color-mix(in srgb, ${dotColor} 20%, ${surface})`,
                              border:`1.5px solid color-mix(in srgb, ${dotColor} 40%, ${ink})`,
                              borderRadius:'9999px', padding:'1px 10px',
                              fontFamily:"'Fredoka One', cursive", fontSize:'0.58rem',
                              color: dotColor === '#FFCD00' ? '#1A0800' : dotColor,
                            }}>+{evt.xp} XP</span>
                          )}
                          <span style={{
                            fontFamily:"'Fredoka Variable', sans-serif", fontWeight:600,
                            fontSize:'0.58rem', opacity:0.4,
                          }}>{evt.time}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Achievements */}
            <div style={{
              background:paper, border:`3px solid ${ink}`,
              borderRadius:'1.9rem 2.1rem 1.8rem 2rem',
              boxShadow:`6px 6px 0 ${ink}`, padding:'24px',
            }}>
              <div style={{
                fontFamily:"'Fredoka One', cursive", fontSize:'0.65rem',
                letterSpacing:'0.16em', textTransform:'uppercase', opacity:0.45, marginBottom:'18px',
              }}>★ Special Achievements</div>

              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {member.achievements.map((ach, i) => (
                  <div key={i} className="rh-animate-bounce-in" style={{
                    animationDelay:`${i * 0.12}s`, animationFillMode:'both',
                    background:`color-mix(in srgb, ${ach.color} 12%, ${paper})`,
                    border:`2.5px solid ${ink}`,
                    boxShadow:`4px 4px 0 ${ink}`,
                    borderRadius:'1.4rem 1.2rem 1.4rem 1.2rem',
                    padding:'16px 18px',
                    display:'flex', gap:'14px', alignItems:'center',
                    position:'relative', overflow:'hidden',
                  } as React.CSSProperties}>
                    {/* Accent strip */}
                    <div style={{
                      position:'absolute', top:0, left:0, bottom:0, width:'5px',
                      background:ach.color,
                    }} />
                    <div style={{
                      width:'48px', height:'48px', borderRadius:'50%',
                      background:ach.color, border:`2.5px solid ${ink}`,
                      boxShadow:`2px 2px 0 ${ink}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'1.5rem', flexShrink:0,
                    }}>{ach.emoji}</div>
                    <div>
                      <div style={{
                        fontFamily:"'Fredoka One', cursive", fontSize:'0.9rem',
                        lineHeight:1.2, marginBottom:'4px',
                      }}>{ach.title}</div>
                      <div style={{
                        fontFamily:"'Fredoka Variable', sans-serif", fontWeight:600,
                        fontSize:'0.68rem', opacity:0.6, lineHeight:1.4,
                      }}>{ach.desc}</div>
                    </div>
                    {/* Rank ribbon */}
                    <div style={{
                      position:'absolute', top:'8px', right:'10px',
                      fontFamily:"'Fredoka One', cursive", fontSize:'0.9rem', opacity:0.25,
                    }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                  </div>
                ))}
              </div>

              {/* Bottom CTA */}
              {!member.isYou && (
                <div style={{ marginTop:'20px', borderTop:`1.5px solid color-mix(in srgb, ${ink} 12%, transparent)`, paddingTop:'16px' }}>
                  <button style={{
                    width:'100%', fontFamily:"'Fredoka One', cursive",
                    fontSize:'0.78rem', letterSpacing:'0.08em', textTransform:'uppercase',
                    padding:'11px', borderRadius:'9999px',
                    border:`2.5px solid ${ink}`, background:'#FFCD00', color:'#1A0800',
                    boxShadow:`3px 3px 0 ${ink}`, cursor:'pointer',
                    transition:'transform 0.1s, box-shadow 0.1s',
                  } as React.CSSProperties}
                  onMouseEnter={e => { e.currentTarget.style.transform='translate(-2px,-2px)'; e.currentTarget.style.boxShadow=`5px 5px 0 ${ink}` }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=`3px 3px 0 ${ink}` }}
                  >⚡ Challenge {member.name.split(' ')[0]}</button>
                </div>
              )}
              {member.isYou && (
                <div style={{ marginTop:'20px', borderTop:`1.5px solid color-mix(in srgb, ${ink} 12%, transparent)`, paddingTop:'16px' }}>
                  <Link to="/quiz" style={{
                    display:'block', textAlign:'center',
                    fontFamily:"'Fredoka One', cursive", fontSize:'0.78rem',
                    letterSpacing:'0.08em', textTransform:'uppercase',
                    padding:'11px', borderRadius:'9999px',
                    border:`2.5px solid ${ink}`, background:'#FFCD00', color:'#1A0800',
                    boxShadow:`3px 3px 0 ${ink}`, textDecoration:'none',
                    transition:'transform 0.1s, box-shadow 0.1s',
                  } as React.CSSProperties}
                  onMouseEnter={e => { e.currentTarget.style.transform='translate(-2px,-2px)'; e.currentTarget.style.boxShadow=`5px 5px 0 ${ink}` }}
                  onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=`3px 3px 0 ${ink}` }}
                  >🎯 Earn More Achievements</Link>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

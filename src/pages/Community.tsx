import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MEMBERS } from '../data/members'
import type { Member } from '../data/members'

const ink     = 'var(--rh-ink)'
const paper   = 'var(--rh-paper)'
const surface = 'var(--rh-surface)'

const LEVEL_COLORS: Record<string, string> = {
  Legend: '#FFCD00',
  Expert: '#1565C0',
  Pro:    '#2D9A4E',
  Rookie: '#E63946',
}

const FILTERS = ['All', 'Legend', 'Expert', 'Pro', 'Rookie', 'Online Now']

// ─── Hero SVG ────────────────────────────────────────────────────
function CommunityHeroSVG() {
  const chars = [
    { cx: 44,  emoji: '🎩', fill: '#FFCD00', dur: '1.8s', begin: '0s'   },
    { cx: 118, emoji: '🦋', fill: '#F48CB1', dur: '1.6s', begin: '0.4s' },
    { cx: 196, emoji: '🎭', fill: '#7B2D8B', dur: '2.0s', begin: '0.2s' },
    { cx: 274, emoji: '🔮', fill: '#1565C0', dur: '1.7s', begin: '0.6s' },
    { cx: 348, emoji: '🦊', fill: '#FF7B25', dur: '1.9s', begin: '0.1s' },
  ]
  const confetti = [
    { x:12,  y:18, rx:5, ry:2.5, rot:30,  fill:'#E63946' },
    { x:82,  y:8,  rx:4, ry:2,   rot:-20, fill:'#FFCD00' },
    { x:158, y:14, rx:5, ry:2.5, rot:45,  fill:'#1565C0' },
    { x:240, y:7,  rx:4, ry:2,   rot:15,  fill:'#2D9A4E' },
    { x:310, y:19, rx:5, ry:2.5, rot:-35, fill:'#FF7B25' },
    { x:375, y:11, rx:4, ry:2,   rot:25,  fill:'#7B2D8B' },
    { x:60,  y:72, rx:4, ry:2,   rot:-15, fill:'#F48CB1' },
    { x:265, y:78, rx:5, ry:2.5, rot:40,  fill:'#FFCD00' },
  ]
  const stars = [{ x:6, y:50 }, { x:388, y:44 }, { x:196, y:6 }, { x:330, y:75 }]

  return (
    <svg viewBox="0 0 392 100" width="392" height="100" xmlns="http://www.w3.org/2000/svg">
      {confetti.map((c, i) => (
        <ellipse key={i} cx={c.x} cy={c.y} rx={c.rx} ry={c.ry}
          fill={c.fill} stroke="#1A0800" strokeWidth="1"
          transform={`rotate(${c.rot} ${c.x} ${c.y})`}>
          <animateTransform attributeName="transform" type="translate"
            values="0,0;0,5;0,0" dur={`${1.4 + i * 0.28}s`} repeatCount="indefinite" additive="sum"/>
        </ellipse>
      ))}
      {stars.map((s, i) => (
        <text key={i} x={s.x} y={s.y} textAnchor="middle" fontSize="11"
          fill="#FFCD00" stroke="#1A0800" strokeWidth="0.5">
          ★
          <animateTransform attributeName="transform" type="rotate"
            values={`0 ${s.x} ${s.y};18 ${s.x} ${s.y};-18 ${s.x} ${s.y};0 ${s.x} ${s.y}`}
            dur={`${2 + i * 0.45}s`} repeatCount="indefinite"/>
        </text>
      ))}
      {chars.map((c, i) => (
        <g key={i}>
          <circle cx={c.cx} cy={56} r={30} fill={c.fill} stroke="#1A0800" strokeWidth="2.5"/>
          <circle cx={c.cx} cy={56} r={26} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
          <text x={c.cx} y={65} textAnchor="middle" fontSize="26">{c.emoji}</text>
          <animateTransform attributeName="transform" type="translate"
            values="0,0;0,-8;0,0" dur={c.dur} begin={c.begin} repeatCount="indefinite"
            calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
        </g>
      ))}
    </svg>
  )
}

// ─── Member Card ──────────────────────────────────────────────────
function MemberCard({ member, index, onSelect }: { member: Member; index: number; onSelect: () => void }) {
  const lc   = LEVEL_COLORS[member.level]
  const xpPct = Math.round((member.xp / member.xpMax) * 100)
  const isLight = member.level === 'Legend'

  return (
    <div
      className="rh-animate-bounce-in"
      onClick={onSelect}
      style={{
        animationDelay: `${index * 0.045}s`,
        animationFillMode: 'both',
        background: paper,
        border: `3px solid ${ink}`,
        borderRadius: '2.2rem 1.8rem 2rem 2.1rem',
        boxShadow: `6px 6px 0 ${ink}`,
        padding: '24px 20px 16px',
        cursor: 'pointer',
        transition: 'transform 0.14s, box-shadow 0.14s',
        position: 'relative',
        overflow: 'hidden',
      } as React.CSSProperties}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translate(-3px,-3px)'
        e.currentTarget.style.boxShadow = `9px 9px 0 ${ink}`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = `6px 6px 0 ${ink}`
      }}
    >
      {/* Level color accent bar */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'6px', background: lc }} />

      {/* Top-3 rank badge */}
      {member.rank <= 3 && (
        <div style={{
          position:'absolute', top:'12px', left:'12px',
          width:'26px', height:'26px', borderRadius:'50%',
          background: member.rank === 1 ? '#FFCD00' : member.rank === 2 ? '#C0C8E0' : '#E8A870',
          border:`2px solid ${ink}`, boxShadow:`2px 2px 0 ${ink}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:"'Fredoka One', cursive", fontSize:'0.7rem', color:'#1A0800',
        }}>#{member.rank}</div>
      )}

      {/* Online dot */}
      {member.online && (
        <div className="rh-online-pulse" style={{
          position:'absolute', top:'13px', right:'14px',
          width:'11px', height:'11px', borderRadius:'50%',
          background:'#2D9A4E', border:`2px solid ${ink}`,
        }} />
      )}

      {/* Avatar */}
      <div style={{ display:'flex', justifyContent:'center', paddingTop:'6px', marginBottom:'10px' }}>
        <div className="rh-animate-float" style={{
          width:'72px', height:'72px', borderRadius:'50%',
          background: member.accent, border:`3px solid ${ink}`,
          boxShadow:`3px 3px 0 ${ink}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'2rem', position:'relative', flexShrink:0,
        } as React.CSSProperties}>
          {member.avatar}
          {member.isYou && (
            <span style={{
              position:'absolute', bottom:'-9px',
              background:'#E63946', color:'#FEF9EE',
              fontFamily:"'Fredoka One', cursive", fontSize:'0.42rem',
              letterSpacing:'0.1em', padding:'2px 8px',
              borderRadius:'9999px', border:`1.5px solid ${ink}`,
              whiteSpace:'nowrap',
            }}>YOU</span>
          )}
        </div>
      </div>

      {/* Level badge */}
      <div style={{ display:'flex', justifyContent:'center', marginBottom:'8px' }}>
        <span style={{
          background: lc, color: isLight ? '#1A0800' : '#FEF9EE',
          fontFamily:"'Fredoka One', cursive", fontSize:'0.52rem',
          letterSpacing:'0.15em', textTransform:'uppercase',
          padding:'3px 12px', borderRadius:'9999px',
          border:`2px solid ${ink}`, boxShadow:`2px 2px 0 ${ink}`,
        }}>{member.level}</span>
      </div>

      {/* Name */}
      <div style={{
        fontFamily:"'Fredoka One', cursive", fontSize:'1rem',
        textAlign:'center', lineHeight:1.2, marginBottom:'3px',
      }}>{member.name}</div>

      {/* Location + specialty */}
      <div style={{
        fontFamily:"'Fredoka Variable', sans-serif", fontWeight:600,
        fontSize:'0.6rem', textAlign:'center', opacity:0.5, marginBottom:'14px',
      }}>{member.location} · {member.specialty}</div>

      {/* Stats row */}
      <div style={{
        display:'flex', justifyContent:'space-around',
        borderTop:`1.5px solid color-mix(in srgb, ${ink} 12%, transparent)`,
        paddingTop:'12px', marginBottom:'12px',
      }}>
        {[
          { label:'XP',       val: member.xp >= 1000 ? `${(member.xp/1000).toFixed(1)}k` : String(member.xp) },
          { label:'🔥 Streak', val: String(member.streak) },
          { label:'🏆 Badges', val: String(member.badges) },
        ].map(s => (
          <div key={s.label} style={{ textAlign:'center' }}>
            <div style={{ fontFamily:"'Fredoka One', cursive", fontSize:'0.92rem' }}>{s.val}</div>
            <div style={{
              fontFamily:"'Fredoka Variable', sans-serif", fontWeight:700,
              fontSize:'0.5rem', opacity:0.42, textTransform:'uppercase', letterSpacing:'0.07em',
            }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* XP bar */}
      <div style={{ height:'7px', borderRadius:'9999px', overflow:'hidden',
        background:surface, border:`1.5px solid color-mix(in srgb, ${ink} 15%, transparent)` }}>
        <div style={{
          width:`${xpPct}%`, height:'100%', borderRadius:'9999px',
          background:`linear-gradient(90deg, ${lc}, color-mix(in srgb, ${lc} 65%, white))`,
        }} />
      </div>
      <div style={{
        fontFamily:"'Fredoka Variable', sans-serif", fontWeight:700,
        fontSize:'0.46rem', textAlign:'right', opacity:0.38, marginTop:'3px',
      }}>{xpPct}% to next level</div>
    </div>
  )
}

// ─── Profile Modal ────────────────────────────────────────────────
function ProfileModal({ member, onClose }: { member: Member; onClose: () => void }) {
  const lc     = LEVEL_COLORS[member.level]
  const xpPct  = Math.round((member.xp / member.xpMax) * 100)
  const isLight = member.level === 'Legend'
  const textOnBanner = isLight ? '#1A0800' : '#FEF9EE'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position:'fixed', inset:0, zIndex:1000,
        background:'rgba(26,8,0,0.72)',
        backdropFilter:'blur(5px)',
        display:'flex', alignItems:'center', justifyContent:'center',
        padding:'20px',
      } as React.CSSProperties}
    >
      <div
        className="rh-animate-inflate"
        style={{
          background: paper,
          border:`3px solid ${ink}`,
          borderRadius:'2.5rem 2rem 2.5rem 2.2rem',
          boxShadow:`14px 14px 0 ${ink}`,
          maxWidth:'540px', width:'100%',
          maxHeight:'90vh', overflowY:'auto',
          position:'relative',
        } as React.CSSProperties}
      >
        {/* Coloured banner header */}
        <div style={{
          background: lc,
          borderRadius:'2.2rem 1.7rem 0 0',
          borderBottom:`3px solid ${ink}`,
          padding:'24px 24px 28px',
          textAlign:'center', position:'relative',
        }}>
          {/* Close */}
          <button onClick={onClose} style={{
            position:'absolute', top:'14px', right:'16px',
            width:'32px', height:'32px', borderRadius:'50%',
            border:`2.5px solid ${ink}`, background:paper,
            cursor:'pointer', boxShadow:`2px 2px 0 ${ink}`,
            fontFamily:"'Fredoka One', cursive", fontSize:'0.95rem',
            color:'#1A0800', display:'flex', alignItems:'center', justifyContent:'center',
          } as React.CSSProperties}>✕</button>

          {/* Avatar */}
          <div className="rh-animate-float" style={{
            width:'92px', height:'92px', borderRadius:'50%',
            background:member.accent, border:`3px solid ${ink}`,
            boxShadow:`5px 5px 0 rgba(26,8,0,0.25)`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'2.8rem', margin:'0 auto 14px',
          } as React.CSSProperties}>{member.avatar}</div>

          {/* Name */}
          <div style={{
            fontFamily:"'Fredoka One', cursive", fontSize:'1.9rem', lineHeight:1,
            color: textOnBanner,
            textShadow: isLight ? `3px 3px 0 rgba(26,8,0,0.18)` : `2px 2px 0 rgba(0,0,0,0.3)`,
            marginBottom:'10px',
          }}>{member.name}</div>

          {/* Pills row */}
          <div style={{ display:'flex', justifyContent:'center', gap:'6px', flexWrap:'wrap' }}>
            <span style={{
              background:'rgba(26,8,0,0.18)', color: textOnBanner,
              fontFamily:"'Fredoka One', cursive", fontSize:'0.6rem', letterSpacing:'0.15em',
              textTransform:'uppercase', padding:'3px 14px', borderRadius:'9999px',
              border:`2px solid rgba(26,8,0,0.25)`,
            }}>{member.level}</span>
            <span style={{
              background: paper, color:'#1A0800',
              fontFamily:"'Fredoka One', cursive", fontSize:'0.6rem',
              letterSpacing:'0.08em', padding:'3px 14px', borderRadius:'9999px',
              border:`2px solid ${ink}`,
            }}>{member.location} Rank #{member.rank}</span>
            {member.online && (
              <span style={{
                background:'#2D9A4E', color:'#FEF9EE',
                fontFamily:"'Fredoka One', cursive", fontSize:'0.6rem',
                letterSpacing:'0.08em', padding:'3px 14px', borderRadius:'9999px',
                border:`2px solid ${ink}`,
              }}>● Online Now</span>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'22px 24px 24px' }}>

          {/* Bio */}
          <div style={{
            fontFamily:"'Fredoka Variable', sans-serif", fontWeight:600,
            fontSize:'0.86rem', lineHeight:1.65, fontStyle:'italic',
            background:surface,
            borderRadius:'1.2rem 1rem 1.2rem 1rem',
            border:`2px solid color-mix(in srgb, ${ink} 14%, transparent)`,
            padding:'14px 18px', marginBottom:'20px', opacity:0.82,
          }}>"{member.bio}"</div>

          {/* XP bar */}
          <div style={{ marginBottom:'20px' }}>
            <div style={{
              display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'7px',
            }}>
              <span style={{
                fontFamily:"'Fredoka One', cursive", fontSize:'0.68rem',
                letterSpacing:'0.1em', textTransform:'uppercase', opacity:0.55,
              }}>Experience Points</span>
              <span style={{ fontFamily:"'Fredoka One', cursive", fontSize:'0.9rem' }}>
                {member.xp.toLocaleString()} / {member.xpMax.toLocaleString()} XP
              </span>
            </div>
            <div style={{
              height:'13px', borderRadius:'9999px', overflow:'hidden',
              background:surface, border:`2px solid color-mix(in srgb, ${ink} 16%, transparent)`,
            }}>
              <div style={{
                width:`${xpPct}%`, height:'100%', borderRadius:'9999px',
                background:`linear-gradient(90deg, ${lc}, color-mix(in srgb, ${lc} 60%, white))`,
                transition:'width 0.9s cubic-bezier(.4,0,.2,1)',
              }} />
            </div>
            <div style={{
              fontFamily:"'Fredoka Variable', sans-serif", fontWeight:700,
              fontSize:'0.56rem', textAlign:'right', opacity:0.42, marginTop:'4px',
            }}>{xpPct}% to next level</div>
          </div>

          {/* Stats grid */}
          <div style={{
            display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'8px', marginBottom:'20px',
          }}>
            {[
              { emoji:'🏅', label:'Global Rank',   val:`#${member.rank}` },
              { emoji:'🔥', label:'Day Streak',    val:`${member.streak}d` },
              { emoji:'🎯', label:'Quizzes',       val:String(member.quizzes) },
              { emoji:'👥', label:'Friends',       val:String(member.friends) },
            ].map(s => (
              <div key={s.label} style={{
                background:surface,
                border:`2px solid color-mix(in srgb, ${ink} 14%, transparent)`,
                borderRadius:'1.2rem 1rem 1.2rem 1rem',
                padding:'10px 6px', textAlign:'center',
              }}>
                <div style={{ fontSize:'1.15rem', marginBottom:'2px' }}>{s.emoji}</div>
                <div style={{ fontFamily:"'Fredoka One', cursive", fontSize:'0.95rem' }}>{s.val}</div>
                <div style={{
                  fontFamily:"'Fredoka Variable', sans-serif", fontWeight:700,
                  fontSize:'0.48rem', opacity:0.42, textTransform:'uppercase', letterSpacing:'0.06em',
                }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Recent badges */}
          <div style={{ marginBottom:'20px' }}>
            <div style={{
              fontFamily:"'Fredoka One', cursive", fontSize:'0.65rem',
              letterSpacing:'0.14em', textTransform:'uppercase', opacity:0.5, marginBottom:'8px',
            }}>★ Earned Badges</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
              {member.recentBadges.map((b, i) => (
                <span key={i} style={{
                  background:paper, border:`2px solid ${ink}`,
                  boxShadow:`2px 2px 0 ${ink}`, borderRadius:'9999px',
                  fontFamily:"'Fredoka Variable', sans-serif", fontWeight:700,
                  fontSize:'0.68rem', padding:'4px 14px',
                }}>{b}</span>
              ))}
            </div>
          </div>

          {/* Joined + specialty */}
          <div style={{
            fontFamily:"'Fredoka Variable', sans-serif", fontWeight:600,
            fontSize:'0.62rem', opacity:0.38, textAlign:'center', marginBottom:'20px',
          }}>🗓️ Member since {member.joined} · Specialty: {member.specialty}</div>

          {/* CTA buttons */}
          {!member.isYou ? (
            <div style={{ display:'flex', gap:'8px' }}>
              {[
                { label:'⚡ Challenge', bg:'#FFCD00', color:'#1A0800' },
                { label:'👥 Follow',   bg:surface,   color:ink },
              ].map(b => (
                <button key={b.label} style={{
                  flex:1, fontFamily:"'Fredoka One', cursive",
                  fontSize:'0.8rem', letterSpacing:'0.08em', textTransform:'uppercase',
                  padding:'12px', borderRadius:'9999px',
                  border:`2.5px solid ${ink}`, background:b.bg, color:b.color,
                  boxShadow:`3px 3px 0 ${ink}`, cursor:'pointer',
                  transition:'transform 0.1s, box-shadow 0.1s',
                } as React.CSSProperties}
                onMouseEnter={e => { e.currentTarget.style.transform='translate(-2px,-2px)'; e.currentTarget.style.boxShadow=`5px 5px 0 ${ink}` }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=`3px 3px 0 ${ink}` }}
                >{b.label}</button>
              ))}
            </div>
          ) : (
            <a href="/profile" style={{
              display:'block', textAlign:'center',
              fontFamily:"'Fredoka One', cursive", fontSize:'0.8rem',
              letterSpacing:'0.08em', textTransform:'uppercase',
              padding:'12px', borderRadius:'9999px',
              border:`2.5px solid ${ink}`, background:'#FFCD00', color:'#1A0800',
              boxShadow:`3px 3px 0 ${ink}`, textDecoration:'none',
              transition:'transform 0.1s, box-shadow 0.1s',
            } as React.CSSProperties}
            onMouseEnter={e => { e.currentTarget.style.transform='translate(-2px,-2px)'; e.currentTarget.style.boxShadow=`5px 5px 0 ${ink}` }}
            onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=`3px 3px 0 ${ink}` }}
            >✏️ Edit My Profile</a>
          )}
          {/* View Full Profile link */}
          <Link to={`/community/${member.slug}`} onClick={onClose} style={{
            display:'block', textAlign:'center', marginTop:'10px',
            fontFamily:"'Fredoka One', cursive", fontSize:'0.74rem',
            letterSpacing:'0.08em', textTransform:'uppercase',
            padding:'9px', borderRadius:'9999px',
            border:`2px solid color-mix(in srgb, ${ink} 28%, transparent)`,
            background:'transparent', color:ink,
            textDecoration:'none',
            transition:'border-color 0.12s, background 0.12s',
          } as React.CSSProperties}
          onMouseEnter={e => { e.currentTarget.style.background = surface }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >View Full Profile →</Link>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────
export default function Community() {
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('All')
  const [selected, setSelected] = useState<Member | null>(null)

  const onlineMembers = MEMBERS.filter(m => m.online)

  const filtered = MEMBERS.filter(m => {
    const q = search.toLowerCase()
    const matchSearch = !q || m.name.toLowerCase().includes(q) || m.specialty.toLowerCase().includes(q)
    const matchFilter =
      filter === 'All'        ? true :
      filter === 'Online Now' ? !!m.online :
      m.level === filter
    return matchSearch && matchFilter
  })

  return (
    <>
      <style>{`
        @keyframes rh-online-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(45,154,78,0.55); }
          50%      { box-shadow: 0 0 0 5px rgba(45,154,78,0);  }
        }
        .rh-online-pulse { animation: rh-online-pulse 2s ease-in-out infinite; }
      `}</style>

      <div style={{
        minHeight:'100vh',
        background:'var(--rh-surface)',
        backgroundImage:'radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px), radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px)',
        backgroundSize:'22px 22px', backgroundPosition:'0 0, 11px 11px',
        padding:'32px 24px 64px',
      }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>

          {/* ── Header card ───────────────────────────────── */}
          <div style={{
            background:paper, border:`3px solid ${ink}`,
            borderRadius:'2.2rem 2rem 2.2rem 2.1rem',
            boxShadow:`8px 8px 0 ${ink}`,
            overflow:'hidden', marginBottom:'24px',
            transform:'rotate(-0.2deg)',
          }}>
            {/* Carnival stripe */}
            <div style={{
              backgroundImage:'repeating-linear-gradient(-45deg, #1565C0 0px, #1565C0 14px, #FFCD00 14px, #FFCD00 28px)',
              borderBottom:`3px solid ${ink}`, padding:'10px 24px',
              display:'flex', alignItems:'center', gap:'8px',
            }}>
              <span style={{
                background:paper, color:'#1A0800',
                fontFamily:"'Fredoka One', cursive", fontSize:'0.7rem',
                letterSpacing:'0.2em', padding:'4px 14px',
                borderRadius:'9999px', border:`2.5px solid ${ink}`,
                boxShadow:`3px 3px 0 ${ink}`,
              }}>👥 MEET THE COMMUNITY 👥</span>
            </div>

            <div style={{
              display:'grid', gridTemplateColumns:'1fr auto',
              alignItems:'center', padding:'24px 28px', gap:'20px',
            }}>
              <div>
                <h1 style={{
                  fontFamily:"'Fredoka One', cursive",
                  fontSize:'clamp(2rem, 5vw, 3rem)', lineHeight:1,
                  marginBottom:'8px', textShadow:`4px 4px 0 ${ink}`,
                }}>The Community</h1>
                <p style={{
                  fontFamily:"'Fredoka Variable', sans-serif", fontWeight:600,
                  fontSize:'0.85rem', opacity:0.6, lineHeight:1.55, maxWidth:'400px',
                }}>Finance nerds, savings superstars & budgeting wizards — all in one place. Click anyone to see their story.</p>

                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'16px' }}>
                  {[
                    { label:'👥 Members',    val:'2,847' },
                    { label:'🟢 Online Now', val:`${onlineMembers.length}` },
                    { label:'🌍 Countries',  val:'24' },
                    { label:'⚡ Avg XP',     val:'4.2k' },
                  ].map(s => (
                    <div key={s.label} style={{
                      padding:'5px 14px', borderRadius:'9999px',
                      border:`2px solid ${ink}`, background:surface,
                      boxShadow:`2px 2px 0 ${ink}`,
                      fontFamily:"'Fredoka Variable', sans-serif", fontWeight:700, fontSize:'0.68rem',
                    }}>{s.label}: <strong>{s.val}</strong></div>
                  ))}
                </div>
              </div>

              <div style={{ flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <CommunityHeroSVG />
              </div>
            </div>

            {/* Online-now strip */}
            {onlineMembers.length > 0 && (
              <div style={{
                borderTop:`1.5px solid color-mix(in srgb, ${ink} 14%, transparent)`,
                padding:'12px 28px',
                display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap',
              }}>
                <span style={{
                  fontFamily:"'Fredoka One', cursive", fontSize:'0.6rem',
                  letterSpacing:'0.14em', textTransform:'uppercase', opacity:0.48,
                }}>Online right now →</span>
                <div style={{ display:'flex' }}>
                  {onlineMembers.map((m, i) => (
                    <div key={m.id} onClick={() => setSelected(m)} style={{
                      width:'30px', height:'30px', borderRadius:'50%',
                      background:m.accent, border:`2px solid ${ink}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'0.95rem', marginLeft: i > 0 ? '-9px' : 0,
                      boxShadow:`1px 1px 0 ${ink}`, cursor:'pointer',
                      zIndex: onlineMembers.length - i, position:'relative',
                      transition:'transform 0.1s',
                    } as React.CSSProperties}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px) scale(1.15)'}
                    onMouseLeave={e => e.currentTarget.style.transform = ''}
                    >{m.avatar}</div>
                  ))}
                </div>
                <span style={{
                  fontFamily:"'Fredoka Variable', sans-serif", fontWeight:700,
                  fontSize:'0.64rem', opacity:0.55,
                }}>{onlineMembers.length} members active</span>
              </div>
            )}
          </div>

          {/* ── Search + Filters ──────────────────────────── */}
          <div style={{ display:'flex', gap:'10px', marginBottom:'22px', flexWrap:'wrap', alignItems:'center' }}>
            {/* Search input */}
            <div style={{ position:'relative', flex:'0 0 255px' }}>
              <span style={{
                position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)',
                fontSize:'0.9rem', opacity:0.45, pointerEvents:'none',
              }}>🔍</span>
              <input
                type="text"
                placeholder="Search members…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width:'100%', boxSizing:'border-box',
                  fontFamily:"'Fredoka Variable', sans-serif", fontWeight:600,
                  fontSize:'0.82rem', padding:'10px 14px 10px 36px',
                  borderRadius:'9999px', border:`2.5px solid ${ink}`,
                  background:paper, color:'var(--rh-ink)',
                  boxShadow:`3px 3px 0 ${ink}`, outline:'none',
                } as React.CSSProperties}
              />
            </div>

            {/* Filter pill group */}
            <div style={{
              display:'flex', gap:'4px', flexWrap:'wrap',
              background:paper, border:`2.5px solid ${ink}`,
              borderRadius:'9999px', padding:'4px',
              boxShadow:`4px 4px 0 ${ink}`,
            }}>
              {FILTERS.map(f => {
                const label = f === 'Legend' ? '👑 Legend' : f === 'Expert' ? '🎯 Expert' : f === 'Pro' ? '💎 Pro' : f === 'Rookie' ? '🌱 Rookie' : f === 'Online Now' ? '🟢 Online' : f
                return (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    fontFamily:"'Fredoka One', cursive", fontSize:'0.68rem',
                    letterSpacing:'0.06em', padding:'6px 16px',
                    borderRadius:'9999px', border:'none',
                    background: filter === f ? ink : 'transparent',
                    color:       filter === f ? paper : ink,
                    cursor:'pointer', transition:'all 0.12s', whiteSpace:'nowrap',
                  } as React.CSSProperties}>{label}</button>
                )
              })}
            </div>

            <span style={{
              fontFamily:"'Fredoka Variable', sans-serif", fontWeight:700,
              fontSize:'0.7rem', opacity:0.45,
            }}>{filtered.length} member{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* ── Member grid ───────────────────────────────── */}
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'64px 20px' }}>
              <div style={{ fontSize:'3.5rem', marginBottom:'14px' }} className="rh-animate-float">🔍</div>
              <div style={{
                fontFamily:"'Fredoka One', cursive", fontSize:'1.3rem', opacity:0.4,
              }}>No members found — try a different search!</div>
            </div>
          ) : (
            <div style={{
              display:'grid',
              gridTemplateColumns:'repeat(auto-fill, minmax(215px, 1fr))',
              gap:'16px',
            }}>
              {filtered.map((m, i) => (
                <MemberCard key={m.id} member={m} index={i} onSelect={() => setSelected(m)} />
              ))}
            </div>
          )}

        </div>
      </div>

      {selected && <ProfileModal member={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ink     = 'var(--rh-ink)'
const paper   = 'var(--rh-paper)'
const surface = 'var(--rh-surface)'

// ── Static data ───────────────────────────────────────────────

const STEP_COLORS = ['#FFCD00', '#2D9A4E', '#1565C0', '#FF7B25', '#7B2D8B']

const ORGS = [
  { id: 'ETH_SIL',   name: 'ETH Silesia',       type: 'Conference', color: '#7B2D8B', emoji: '⛓️',  members: 312  },
  { id: 'PKO_BANK',  name: 'PKO Bank',           type: 'Corporate',  color: '#1565C0', emoji: '🏦',  members: 1240 },
  { id: 'WAW_UNI',   name: 'Warsaw University',  type: 'Education',  color: '#2D9A4E', emoji: '🎓',  members: 567  },
  { id: 'FINTECH',   name: 'FinTech Hub',         type: 'Startup',    color: '#FF7B25', emoji: '🚀',  members: 89   },
]

const AVATARS = ['🎩', '🪙', '🌟', '🏆', '🦊', '🐸', '🎭', '🦉', '🤖', '💎', '🐱', '🧙']

const GOALS = [
  { id: 'save',      emoji: '🎯', title: 'Save for something big',    desc: 'Holiday, car, home deposit'   },
  { id: 'debt',      emoji: '⛓️', title: 'Get out of debt',           desc: 'Pay off cards & loans'        },
  { id: 'invest',    emoji: '📈', title: 'Start investing',           desc: 'Grow wealth long-term'        },
  { id: 'paycheck',  emoji: '💸', title: 'Understand my paycheck',    desc: 'Taxes, deductions, net pay'   },
  { id: 'emergency', emoji: '🛡️', title: 'Build emergency fund',      desc: '3–6 months of expenses'       },
  { id: 'fire',      emoji: '🔥', title: 'Achieve financial freedom', desc: 'FIRE: retire on your terms'   },
]

const GOAL_COLORS = ['#FFCD00', '#E63946', '#FF7B25', '#1565C0', '#2D9A4E', '#7B2D8B']

// ── Shared helpers ────────────────────────────────────────────

const btnBase: React.CSSProperties = {
  fontFamily: "'Fredoka One', cursive",
  borderRadius: '9999px',
  border: `2.5px solid ${ink}`,
  cursor: 'pointer',
  transition: 'transform 0.1s, box-shadow 0.1s',
}

function lift(e: React.MouseEvent<HTMLElement>, shadow = '4px 4px 0') {
  const el = e.currentTarget as HTMLElement
  el.style.transform = 'translate(-2px,-2px)'
  el.style.boxShadow = `${shadow} ${ink}`
}
function unlift(e: React.MouseEvent<HTMLElement>, shadow = '3px 3px 0') {
  const el = e.currentTarget as HTMLElement
  el.style.transform = ''
  el.style.boxShadow = `${shadow} ${ink}`
}

// ── Animated professor mascot ─────────────────────────────────

function ProfessorSVG() {
  return (
    <svg viewBox="0 0 140 188" width="160" height="215" xmlns="http://www.w3.org/2000/svg">
      {/* Hat brim */}
      <rect x="32" y="60" width="76" height="10" rx="5" fill="#1A0800"/>
      {/* Hat top */}
      <rect x="46" y="18" width="48" height="44" rx="5" fill="#1A0800"/>
      {/* Tassel string + ball */}
      <line x1="94" y1="18" x2="102" y2="46" stroke="#FFCD00" strokeWidth="2.5"/>
      <circle cx="103" cy="50" r="8" fill="#FFCD00" stroke="#1A0800" strokeWidth="2"/>
      {/* Coin face */}
      <circle cx="70" cy="104" r="40" fill="#FFCD00" stroke="#1A0800" strokeWidth="4"/>
      <circle cx="52" cy="91" r="12" fill="white" stroke="#1A0800" strokeWidth="2.5"/>
      <circle cx="88" cy="91" r="12" fill="white" stroke="#1A0800" strokeWidth="2.5"/>
      <circle cx="55" cy="94" r="5.5" fill="#1A0800"/>
      <circle cx="91" cy="94" r="5.5" fill="#1A0800"/>
      <circle cx="57" cy="91"  r="2" fill="white"/>
      <circle cx="93" cy="91"  r="2" fill="white"/>
      {/* Shine */}
      <circle cx="50" cy="80" r="14" fill="#FFE566" opacity="0.35"/>
      {/* Monocle */}
      <circle cx="88" cy="91" r="15" fill="none" stroke="#1A0800" strokeWidth="2.5"/>
      <line x1="103" y1="89" x2="112" y2="82" stroke="#1A0800" strokeWidth="2"/>
      {/* Smile */}
      <path d="M54 116 Q70 130 86 116" fill="none" stroke="#1A0800" strokeWidth="4" strokeLinecap="round"/>
      {/* Bow tie */}
      <path d="M56 140 L70 149 L56 158 L70 149 L84 158 L70 149 L84 140 Z"
        fill="#E63946" stroke="#1A0800" strokeWidth="2"/>
      {/* Left arm (raised, waving) */}
      <path d="M30 118 Q10 106 8 84" fill="none" stroke="#FFCD00" strokeWidth="14" strokeLinecap="round"/>
      <circle cx="8" cy="80" r="14" fill="white" stroke="#1A0800" strokeWidth="2.5"/>
      {/* Right arm */}
      <path d="M110 118 Q130 112 132 96" fill="none" stroke="#FFCD00" strokeWidth="14" strokeLinecap="round"/>
      <circle cx="132" cy="92" r="14" fill="white" stroke="#1A0800" strokeWidth="2.5"/>
      {/* Float */}
      <animateTransform attributeName="transform" type="translate"
        values="0,0;0,-10;0,0" dur="2.5s" repeatCount="indefinite"
        calcMode="spline" keySplines="0.45 0.05 0.55 0.95;0.45 0.05 0.55 0.95"/>
    </svg>
  )
}

// ── Step progress bar ─────────────────────────────────────────

function StepProgress({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '18px 0 6px', gap: 0 }}>
      {[0,1,2,3,4].map(i => (
        <React.Fragment key={i}>
          {i > 0 && (
            <div style={{
              width: '36px', height: '3px',
              background: i <= step ? '#2D9A4E' : surface,
              border: `1px solid ${i <= step ? '#2D9A4E' : ink}`,
              opacity: i <= step ? 1 : 0.35,
              transition: 'background 0.4s',
            }}/>
          )}
          <div style={{
            width:  i === step ? '48px' : '16px',
            height: '16px', borderRadius: '9999px',
            background: i < step ? '#2D9A4E' : i === step ? STEP_COLORS[i] : surface,
            border: `2px solid ${ink}`,
            boxShadow: i === step ? `2px 2px 0 ${ink}` : 'none',
            opacity: i > step ? 0.35 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            {i < step  && <span style={{ fontSize: '8px', color: 'white', fontWeight: 700 }}>✓</span>}
            {i === step && (
              <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '7.5px', color: '#1A0800', whiteSpace: 'nowrap' }}>
                {i+1}/5
              </span>
            )}
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}

// ── Step 1: Welcome ───────────────────────────────────────────

function Step1Welcome({ onNext }: { onNext(): void }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 0 32px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
        <ProfessorSVG />
      </div>
      <p style={{
        fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem',
        letterSpacing: '0.18em', textTransform: 'uppercase',
        color: '#FFCD00', marginBottom: '6px',
        textShadow: `1px 1px 0 ${ink}`,
      }}>Welcome to</p>
      <h1 style={{
        fontFamily: "'Fredoka One', cursive",
        fontSize: 'clamp(2.6rem, 8vw, 3.8rem)',
        lineHeight: 0.95, marginBottom: '16px',
        color: ink,
        textShadow: `4px 4px 0 #FFCD00, 7px 7px 0 ${ink}`,
      }}>XP Gazette</h1>
      <p style={{
        fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500,
        fontSize: '0.97rem', lineHeight: 1.65, opacity: 0.6,
        maxWidth: '340px', margin: '0 auto 32px',
      }}>
        Level up your financial life, one lesson at a time.
        Your journey to money mastery starts here.
      </p>
      <button
        onClick={onNext}
        style={{
          ...btnBase,
          fontSize: '1.1rem', padding: '16px 52px',
          background: '#FFCD00', color: '#1A0800',
          boxShadow: `5px 5px 0 ${ink}`,
          animation: 'bounce-in 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.3s both',
        }}
        onMouseEnter={e => lift(e, '7px 7px 0')}
        onMouseLeave={e => unlift(e, '5px 5px 0')}
      >Get Started →</button>
    </div>
  )
}

// ── Step 2: Identity ──────────────────────────────────────────

function Step2Identity({ name, username, avatarIdx, onChange, onNext, onBack }: {
  name: string; username: string; avatarIdx: number
  onChange(k: string, v: unknown): void
  onNext(): void; onBack(): void
}) {
  const valid = name.trim().length > 0 && username.trim().length > 0

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 18px', boxSizing: 'border-box',
    fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '1rem',
    background: paper, border: `3px solid ${ink}`, borderRadius: '14px',
    boxShadow: `3px 3px 0 ${ink}`, outline: 'none', color: ink,
  }

  return (
    <div style={{ paddingBottom: '8px' }}>
      <div style={{ textAlign: 'center', marginBottom: '26px' }}>
        <span style={{ fontSize: '2.8rem' }}>🎩</span>
        <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.75rem', margin: '8px 0 4px' }}>
          Who are you?
        </h2>
        <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.85rem', opacity: 0.5, margin: 0 }}>
          Set up your player profile
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '22px' }}>
        {[
          { key: 'name',     label: 'YOUR NAME',  placeholder: 'e.g. Alex',           transform: (v: string) => v },
          { key: 'username', label: 'USERNAME',   placeholder: 'e.g. alex_investor',  transform: (v: string) => v.toLowerCase().replace(/[^a-z0-9_]/g, '') },
        ].map(f => (
          <div key={f.key}>
            <label style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.76rem', display: 'block', marginBottom: '6px', opacity: 0.6, letterSpacing: '0.1em' }}>
              {f.label}
            </label>
            <input
              value={f.key === 'name' ? name : username}
              onChange={e => onChange(f.key, f.transform(e.target.value))}
              placeholder={f.placeholder}
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '26px' }}>
        <label style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.76rem', display: 'block', marginBottom: '10px', opacity: 0.6, letterSpacing: '0.1em' }}>
          CHOOSE YOUR AVATAR
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
          {AVATARS.map((emoji, i) => (
            <button key={i} onClick={() => onChange('avatarIdx', i)} style={{
              aspectRatio: '1', borderRadius: '50%',
              border: `${avatarIdx === i ? 3 : 2}px solid ${ink}`,
              background: avatarIdx === i ? '#FFCD00' : surface,
              fontSize: '1.35rem', cursor: 'pointer',
              boxShadow: avatarIdx === i ? `3px 3px 0 ${ink}` : `1px 1px 0 ${ink}`,
              transform: avatarIdx === i ? 'scale(1.18) translate(-1px,-1px)' : '',
              transition: 'all 0.15s cubic-bezier(0.34,1.56,0.64,1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{ ...btnBase, fontSize: '0.9rem', padding: '12px 24px', background: surface, color: ink, boxShadow: `3px 3px 0 ${ink}` }}
          onMouseEnter={e => lift(e)} onMouseLeave={e => unlift(e)}>← Back</button>
        <button onClick={onNext} disabled={!valid} style={{
          ...btnBase, fontSize: '0.9rem', padding: '12px 32px',
          background: valid ? '#2D9A4E' : surface,
          color: valid ? 'white' : ink,
          boxShadow: valid ? `3px 3px 0 ${ink}` : `1px 1px 0 ${ink}`,
          opacity: valid ? 1 : 0.45,
        }}
          onMouseEnter={e => { if (valid) lift(e) }}
          onMouseLeave={e => { if (valid) unlift(e) }}>
          Continue →
        </button>
      </div>
    </div>
  )
}

// ── Step 3: Organization ──────────────────────────────────────

function Step3Organization({ orgId, orgCode, onChange, onNext, onBack }: {
  orgId: string; orgCode: string
  onChange(k: string, v: unknown): void
  onNext(): void; onBack(): void
}) {
  const [showCode, setShowCode] = useState(false)
  const [finding, setFinding]   = useState(false)
  const [found,   setFound]     = useState(false)

  const valid = orgId.length > 0

  function findOrg() {
    if (orgCode.trim().length < 4 || finding) return
    setFinding(true)
    setTimeout(() => {
      setFinding(false)
      setFound(true)
      onChange('orgId', 'CUSTOM_' + orgCode.trim().toUpperCase())
    }, 1100)
  }

  return (
    <div style={{ paddingBottom: '8px' }}>
      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
        <span style={{ fontSize: '2.8rem' }}>🏢</span>
        <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.75rem', margin: '8px 0 4px' }}>
          Join Your Organization
        </h2>
        <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.85rem', opacity: 0.5, margin: 0 }}>
          Select your company, school, or community
        </p>
      </div>

      {/* Org grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        {ORGS.map(org => {
          const sel = orgId === org.id
          return (
            <button key={org.id}
              onClick={() => { onChange('orgId', org.id); onChange('orgCode', ''); setFound(false) }}
              style={{
                padding: '14px 12px', borderRadius: '16px', textAlign: 'left',
                border: `${sel ? 3 : 2}px solid ${ink}`,
                background: sel ? org.color : paper,
                cursor: 'pointer',
                boxShadow: sel ? `4px 4px 0 ${ink}` : `2px 2px 0 ${ink}`,
                transform: sel ? 'translate(-1px,-1px)' : '',
                transition: 'all 0.15s cubic-bezier(0.34,1.56,0.64,1)',
              }}
              onMouseEnter={e => { if (!sel) lift(e, '3px 3px 0') }}
              onMouseLeave={e => { if (!sel) unlift(e, '2px 2px 0') }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '1.5rem' }}>{org.emoji}</span>
                {sel && <span style={{ fontSize: '1rem', fontWeight: 700 }}>✓</span>}
              </div>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.88rem', color: sel ? '#1A0800' : ink, marginBottom: '4px' }}>
                {org.name}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600,
                  fontSize: '0.6rem', opacity: 0.6,
                  background: 'rgba(255,255,255,0.3)', padding: '1px 7px',
                  borderRadius: '9999px', border: '1px solid rgba(0,0,0,0.12)',
                }}>{org.type}</span>
                <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.6rem', opacity: 0.5 }}>
                  {org.members.toLocaleString()} members
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Code toggle */}
      <div style={{ marginBottom: '22px' }}>
        <button
          onClick={() => setShowCode(v => !v)}
          style={{
            ...btnBase, width: '100%', fontSize: '0.78rem',
            padding: '9px 0', background: 'transparent', color: ink,
            boxShadow: `2px 2px 0 ${ink}`, marginBottom: showCode ? '12px' : 0,
          }}
        >
          {showCode ? '▲ Hide code input' : '▼ Have an invitation code?'}
        </button>

        {showCode && (
          <div style={{ animation: 'fly-in-left 0.3s ease both' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={orgCode}
                onChange={e => {
                  onChange('orgCode', e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))
                  onChange('orgId', '')
                  setFound(false)
                }}
                placeholder="ENTER CODE"
                maxLength={12}
                style={{
                  flex: 1, padding: '12px 18px',
                  fontFamily: "'Fredoka One', cursive", fontSize: '1rem',
                  letterSpacing: '0.22em', background: paper,
                  border: `3px solid ${ink}`, borderRadius: '12px',
                  boxShadow: `3px 3px 0 ${ink}`, outline: 'none', color: ink,
                }}
              />
              <button onClick={findOrg} disabled={finding || orgCode.trim().length < 4} style={{
                ...btnBase, fontSize: '0.88rem', padding: '12px 18px',
                borderRadius: '12px', background: '#1565C0', color: 'white',
                boxShadow: `3px 3px 0 ${ink}`, opacity: orgCode.trim().length >= 4 ? 1 : 0.45,
              }}>
                {finding ? '⏳' : found ? '✓' : 'Find'}
              </button>
            </div>
            {found && (
              <div style={{
                marginTop: '8px', padding: '10px 14px',
                background: 'rgba(45,154,78,0.12)',
                border: '2px solid #2D9A4E', borderRadius: '10px',
                animation: 'bounce-in 0.4s ease both',
              }}>
                <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.83rem', color: '#2D9A4E' }}>
                  ✓ Organization found! You're ready to join.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{ ...btnBase, fontSize: '0.9rem', padding: '12px 24px', background: surface, color: ink, boxShadow: `3px 3px 0 ${ink}` }}
          onMouseEnter={e => lift(e)} onMouseLeave={e => unlift(e)}>← Back</button>
        <button onClick={onNext} disabled={!valid} style={{
          ...btnBase, fontSize: '0.9rem', padding: '12px 32px',
          background: valid ? '#1565C0' : surface,
          color: valid ? 'white' : ink,
          boxShadow: valid ? `3px 3px 0 ${ink}` : `1px 1px 0 ${ink}`,
          opacity: valid ? 1 : 0.45,
        }}
          onMouseEnter={e => { if (valid) lift(e) }}
          onMouseLeave={e => { if (valid) unlift(e) }}>
          Join →
        </button>
      </div>
    </div>
  )
}

// ── Step 4: Goals ─────────────────────────────────────────────

function Step4Goals({ goals, onChange, onNext, onBack }: {
  goals: string[]
  onChange(k: string, v: unknown): void
  onNext(): void; onBack(): void
}) {
  function toggle(id: string) {
    onChange('goals', goals.includes(id) ? goals.filter(g => g !== id) : [...goals, id])
  }

  const valid = goals.length > 0

  return (
    <div style={{ paddingBottom: '8px' }}>
      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
        <span style={{ fontSize: '2.8rem' }}>🎯</span>
        <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.75rem', margin: '8px 0 4px' }}>
          Your Financial Mission
        </h2>
        <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.85rem', opacity: 0.5, margin: 0 }}>
          Pick everything that applies — no wrong answers
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '22px' }}>
        {GOALS.map((goal, i) => {
          const sel = goals.includes(goal.id)
          return (
            <button key={goal.id} onClick={() => toggle(goal.id)} style={{
              padding: '14px', borderRadius: '16px', textAlign: 'left',
              border: `${sel ? 3 : 2}px solid ${ink}`,
              background: sel ? GOAL_COLORS[i] : paper,
              cursor: 'pointer', position: 'relative',
              boxShadow: sel ? `4px 4px 0 ${ink}` : `2px 2px 0 ${ink}`,
              transform: sel ? 'translate(-1px,-1px)' : '',
              transition: 'all 0.15s cubic-bezier(0.34,1.56,0.64,1)',
            }}
            onMouseEnter={e => { if (!sel) lift(e, '3px 3px 0') }}
            onMouseLeave={e => { if (!sel) unlift(e, '2px 2px 0') }}
            >
              {sel && (
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#1A0800', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '9px', color: 'white', fontWeight: 700,
                }}>✓</div>
              )}
              <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{goal.emoji}</div>
              <div style={{
                fontFamily: "'Fredoka One', cursive", fontSize: '0.84rem',
                color: sel ? '#1A0800' : ink, lineHeight: 1.2, marginBottom: '3px',
              }}>{goal.title}</div>
              <div style={{
                fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500,
                fontSize: '0.68rem', opacity: 0.58, color: sel ? '#1A0800' : ink,
              }}>{goal.desc}</div>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onBack} style={{ ...btnBase, fontSize: '0.9rem', padding: '12px 24px', background: surface, color: ink, boxShadow: `3px 3px 0 ${ink}` }}
          onMouseEnter={e => lift(e)} onMouseLeave={e => unlift(e)}>← Back</button>
        <div style={{ textAlign: 'right' }}>
          {goals.length > 0 && (
            <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.7rem', opacity: 0.5, marginBottom: '5px' }}>
              {goals.length} selected
            </div>
          )}
          <button onClick={onNext} disabled={!valid} style={{
            ...btnBase, fontSize: '0.9rem', padding: '12px 32px',
            background: valid ? '#FF7B25' : surface,
            color: valid ? 'white' : ink,
            boxShadow: valid ? `3px 3px 0 ${ink}` : `1px 1px 0 ${ink}`,
            opacity: valid ? 1 : 0.45,
          }}
            onMouseEnter={e => { if (valid) lift(e) }}
            onMouseLeave={e => { if (valid) unlift(e) }}>
            Almost There! →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Step 5: Complete ──────────────────────────────────────────

function Step5Complete({ name, avatarIdx, orgId, goals }: {
  name: string; avatarIdx: number; orgId: string; goals: string[]
}) {
  const navigate = useNavigate()
  const org      = ORGS.find(o => o.id === orgId)
  const orgName  = org ? org.name : orgId.replace('CUSTOM_', '')

  return (
    <div style={{ textAlign: 'center', padding: '12px 0 28px', position: 'relative', overflow: 'hidden' }}>
      {/* Confetti rain */}
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${(i * 17 + 3) % 92 + 4}%`, top: '-24px',
          fontSize: `${12 + (i % 4) * 5}px`, pointerEvents: 'none',
          animation: `coin-fall ${1.2 + (i % 5) * 0.28}s ease-in ${i * 0.09}s both`,
        }}>
          {['🪙', '⭐', '💰', '✨', '🎊'][i % 5]}
        </div>
      ))}

      {/* Avatar bubble */}
      <div style={{
        width: 84, height: 84, borderRadius: '50%',
        border: `4px solid ${ink}`, background: '#FFCD00',
        boxShadow: `4px 4px 0 ${ink}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2.5rem', margin: '0 auto 18px',
        animation: 'bounce-in 0.6s cubic-bezier(0.34,1.56,0.64,1) both',
      }}>
        {AVATARS[avatarIdx]}
      </div>

      <h2 style={{
        fontFamily: "'Fredoka One', cursive",
        fontSize: 'clamp(1.75rem, 5vw, 2.4rem)',
        margin: '0 0 6px',
        textShadow: `3px 3px 0 #FFCD00`,
        animation: 'slam 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
      }}>
        You're in, {name}! 🎉
      </h2>
      <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.9rem', opacity: 0.5, margin: '0 0 26px' }}>
        Your financial journey begins now.
      </p>

      {/* Summary card */}
      <div style={{
        background: paper, border: `3px solid ${ink}`, borderRadius: '20px',
        padding: '18px', maxWidth: '340px', margin: '0 auto 26px',
        boxShadow: `5px 5px 0 ${ink}`, textAlign: 'left',
        animation: 'fly-in-left 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.4s both',
      }}>
        {[
          { label: 'Organization', value: orgName, emoji: '🏢' },
          { label: 'Starting XP',  value: '+100 XP', emoji: '✨' },
          { label: 'Missions set', value: `${goals.length} goal${goals.length !== 1 ? 's' : ''}`, emoji: '🎯' },
        ].map((row, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 0',
            borderBottom: i < 2 ? `1.5px solid color-mix(in srgb, var(--rh-ink) 10%, transparent)` : 'none',
          }}>
            <span style={{ fontSize: '1.2rem', width: '28px', textAlign: 'center' }}>{row.emoji}</span>
            <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.82rem', opacity: 0.52, flex: 1 }}>{row.label}</span>
            <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.92rem' }}>{row.value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/')}
        style={{
          ...btnBase,
          fontSize: '1.08rem', padding: '16px 52px',
          background: '#7B2D8B', color: 'white',
          boxShadow: `5px 5px 0 ${ink}`,
          animation: 'bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.6s both',
        }}
        onMouseEnter={e => lift(e, '7px 7px 0')}
        onMouseLeave={e => unlift(e, '5px 5px 0')}
      >
        Start Learning →
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────

interface Form {
  name: string; username: string; avatarIdx: number
  orgId: string; orgCode: string; goals: string[]
}

export default function Onboarding() {
  const [step, setStep]       = useState(0)
  const [dir,  setDir]        = useState<'fwd' | 'back'>('fwd')
  const [animKey, setAnimKey] = useState(0)

  const [form, setForm] = useState<Form>({
    name: '', username: '', avatarIdx: 0,
    orgId: '', orgCode: '', goals: [],
  })

  function update(k: string, v: unknown) {
    setForm(f => ({ ...f, [k]: v }))
  }
  function next() { setDir('fwd');  setAnimKey(k => k + 1); setStep(s => s + 1) }
  function back() { setDir('back'); setAnimKey(k => k + 1); setStep(s => s - 1) }

  const anim = dir === 'fwd' ? 'fly-in-right 0.32s ease both' : 'fly-in-left 0.32s ease both'

  return (
    <div style={{
      minHeight: '100vh',
      background: paper,
      backgroundImage: 'radial-gradient(circle, var(--rh-body-dot) 1.2px, transparent 1.2px), radial-gradient(circle, var(--rh-body-dot) 1.2px, transparent 1.2px)',
      backgroundSize: '24px 24px', backgroundPosition: '0 0, 12px 12px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '520px', padding: '0 20px' }}>
        {/* Logo */}
        <div style={{
          padding: '18px 0 0', textAlign: 'center',
          fontFamily: "'Fredoka One', cursive", fontSize: '0.95rem',
          opacity: 0.45, color: ink, letterSpacing: '0.06em',
        }}>★ XP Gazette</div>

        <StepProgress step={step} />
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '520px', padding: '0 16px 48px' }}>
        <div style={{
          background: paper, border: `3px solid ${ink}`,
          borderRadius: '24px', padding: '28px 28px 24px',
          boxShadow: `6px 6px 0 ${ink}`, overflow: 'hidden',
        }}>
          <div key={animKey} style={{ animation: anim }}>
            {step === 0 && <Step1Welcome onNext={next} />}
            {step === 1 && (
              <Step2Identity
                name={form.name} username={form.username} avatarIdx={form.avatarIdx}
                onChange={update} onNext={next} onBack={back}
              />
            )}
            {step === 2 && (
              <Step3Organization
                orgId={form.orgId} orgCode={form.orgCode}
                onChange={update} onNext={next} onBack={back}
              />
            )}
            {step === 3 && (
              <Step4Goals
                goals={form.goals}
                onChange={update} onNext={next} onBack={back}
              />
            )}
            {step === 4 && (
              <Step5Complete
                name={form.name} avatarIdx={form.avatarIdx}
                orgId={form.orgId} goals={form.goals}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

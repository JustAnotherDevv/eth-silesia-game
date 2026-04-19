import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser } from '../lib/api'
import { setSession } from '../lib/session'
import { supabase } from '../lib/supabase'


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

const COMMUNITY_EMOJIS = ['🌟', '🚀', '💡', '🏆', '🔮', '⚡', '🌿', '🎯', '💎', '🔥', '🌊', '🎪']
const COMMUNITY_TYPES  = ['Education', 'Corporate', 'Community', 'DAO', 'Startup', 'Research']

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

function genCode(name: string) {
  const base = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5).padEnd(4, 'X')
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return base + rand
}

// ── Animated professor mascot ─────────────────────────────────

function ProfessorSVG() {
  return (
    <svg viewBox="0 0 140 188" width="160" height="215" xmlns="http://www.w3.org/2000/svg">
      <rect x="32" y="60" width="76" height="10" rx="5" fill="#1A0800"/>
      <rect x="46" y="18" width="48" height="44" rx="5" fill="#1A0800"/>
      <line x1="94" y1="18" x2="102" y2="46" stroke="#FFCD00" strokeWidth="2.5"/>
      <circle cx="103" cy="50" r="8" fill="#FFCD00" stroke="#1A0800" strokeWidth="2"/>
      <circle cx="70" cy="104" r="40" fill="#FFCD00" stroke="#1A0800" strokeWidth="4"/>
      <circle cx="52" cy="91" r="12" fill="white" stroke="#1A0800" strokeWidth="2.5"/>
      <circle cx="88" cy="91" r="12" fill="white" stroke="#1A0800" strokeWidth="2.5"/>
      <circle cx="55" cy="94" r="5.5" fill="#1A0800"/>
      <circle cx="91" cy="94" r="5.5" fill="#1A0800"/>
      <circle cx="57" cy="91"  r="2" fill="white"/>
      <circle cx="93" cy="91"  r="2" fill="white"/>
      <circle cx="50" cy="80" r="14" fill="#FFE566" opacity="0.35"/>
      <circle cx="88" cy="91" r="15" fill="none" stroke="#1A0800" strokeWidth="2.5"/>
      <line x1="103" y1="89" x2="112" y2="82" stroke="#1A0800" strokeWidth="2"/>
      <path d="M54 116 Q70 130 86 116" fill="none" stroke="#1A0800" strokeWidth="4" strokeLinecap="round"/>
      <path d="M56 140 L70 149 L56 158 L70 149 L84 158 L70 149 L84 140 Z"
        fill="#E63946" stroke="#1A0800" strokeWidth="2"/>
      <path d="M30 118 Q10 106 8 84" fill="none" stroke="#FFCD00" strokeWidth="14" strokeLinecap="round"/>
      <circle cx="8" cy="80" r="14" fill="white" stroke="#1A0800" strokeWidth="2.5"/>
      <path d="M110 118 Q130 112 132 96" fill="none" stroke="#FFCD00" strokeWidth="14" strokeLinecap="round"/>
      <circle cx="132" cy="92" r="14" fill="white" stroke="#1A0800" strokeWidth="2.5"/>
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

// ── Landing screen ────────────────────────────────────────────

function Landing({ onLogin, onSignup }: { onLogin(): void; onSignup(): void }) {
  return (
    <div style={{ textAlign: 'center', padding: '12px 0 32px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
        <ProfessorSVG />
      </div>
      <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#FFCD00', marginBottom: '6px', textShadow: `1px 1px 0 ${ink}` }}>Welcome to</p>
      <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(2.6rem, 8vw, 3.8rem)', lineHeight: 0.95, marginBottom: '16px', color: ink, textShadow: `4px 4px 0 #FFCD00, 7px 7px 0 ${ink}` }}>XP Gazette</h1>
      <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.97rem', lineHeight: 1.65, opacity: 0.6, maxWidth: '340px', margin: '0 auto 32px' }}>
        Level up your financial life, one lesson at a time.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '280px', margin: '0 auto' }}>
        <button onClick={onSignup} style={{ ...btnBase, fontSize: '1.1rem', padding: '16px 52px', background: '#FFCD00', color: '#1A0800', boxShadow: `5px 5px 0 ${ink}` }}
          onMouseEnter={e => lift(e, '7px 7px 0')} onMouseLeave={e => unlift(e, '5px 5px 0')}>
          Create Account →
        </button>
        <button onClick={onLogin} style={{ ...btnBase, fontSize: '0.95rem', padding: '14px 40px', background: surface, color: ink, boxShadow: `3px 3px 0 ${ink}` }}
          onMouseEnter={e => lift(e)} onMouseLeave={e => unlift(e)}>
          Log In
        </button>
      </div>
    </div>
  )
}

// ── Login form ────────────────────────────────────────────────

function LoginForm({ onBack }: { onBack(): void }) {
  const navigate = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '13px 18px', boxSizing: 'border-box',
    fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '1rem',
    background: paper, border: `3px solid ${ink}`, borderRadius: '14px',
    boxShadow: `3px 3px 0 ${ink}`, outline: 'none', color: ink,
  }

  async function handleLogin() {
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    setError('')
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) { setError(authError.message); return }
      const user = await getUser(data.user.id)
      setSession({ id: user.id, username: user.username, displayName: user.display_name, avatar: user.avatar })
      navigate('/')
    } catch {
      setError('Login failed. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ paddingBottom: '8px' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <span style={{ fontSize: '2.8rem' }}>🔑</span>
        <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.75rem', margin: '8px 0 4px' }}>Welcome Back!</h2>
        <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.85rem', opacity: 0.5, margin: 0 }}>Log in to continue your journey</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
        {[
          { label: 'EMAIL',    value: email,    setter: setEmail,    type: 'email',    placeholder: 'your@email.com' },
          { label: 'PASSWORD', value: password, setter: setPassword, type: 'password', placeholder: '••••••••' },
        ].map(f => (
          <div key={f.label}>
            <label style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.76rem', display: 'block', marginBottom: '6px', opacity: 0.6, letterSpacing: '0.1em' }}>{f.label}</label>
            <input
              type={f.type}
              value={f.value}
              onChange={e => f.setter(e.target.value)}
              placeholder={f.placeholder}
              style={inputStyle}
              onKeyDown={e => { if (e.key === 'Enter') handleLogin() }}
            />
          </div>
        ))}
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(230,57,70,0.1)', border: '2px solid #E63946', borderRadius: '10px', marginBottom: '16px', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.82rem', color: '#E63946' }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{ ...btnBase, fontSize: '0.9rem', padding: '12px 24px', background: surface, color: ink, boxShadow: `3px 3px 0 ${ink}` }}
          onMouseEnter={e => lift(e)} onMouseLeave={e => unlift(e)}>← Back</button>
        <button onClick={handleLogin} disabled={loading} style={{ ...btnBase, fontSize: '0.9rem', padding: '12px 36px', background: '#2D9A4E', color: 'white', boxShadow: `3px 3px 0 ${ink}`, opacity: loading ? 0.6 : 1 }}
          onMouseEnter={e => { if (!loading) lift(e) }} onMouseLeave={e => { if (!loading) unlift(e) }}>
          {loading ? '⏳ Logging in…' : 'Log In →'}
        </button>
      </div>
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

function Step2Identity({ name, username, avatarIdx, email, password, onChange, onNext, onBack }: {
  name: string; username: string; avatarIdx: number; email: string; password: string
  onChange(k: string, v: unknown): void
  onNext(): void; onBack(): void
}) {
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const passwordValid = password.length >= 6

  useEffect(() => {
    const slug = username.toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (!slug) { setUsernameStatus('idle'); return }
    setUsernameStatus('checking')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/members/${slug}`)
        setUsernameStatus(res.ok ? 'taken' : 'available')
      } catch {
        setUsernameStatus('available')
      }
    }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [username])

  const valid = name.trim().length > 0 && username.trim().length > 0 && emailValid && passwordValid && usernameStatus !== 'taken' && usernameStatus !== 'checking'

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
        {/* Name */}
        <div>
          <label style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.76rem', display: 'block', marginBottom: '6px', opacity: 0.6, letterSpacing: '0.1em' }}>YOUR NAME</label>
          <input value={name} onChange={e => onChange('name', e.target.value)} placeholder="e.g. Alex" type="text" style={inputStyle} />
        </div>

        {/* Email with validation */}
        <div>
          <label style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.76rem', display: 'block', marginBottom: '6px', opacity: 0.6, letterSpacing: '0.1em' }}>EMAIL</label>
          <input
            value={email}
            onChange={e => onChange('email', e.target.value)}
            onBlur={() => setEmailTouched(true)}
            placeholder="your@email.com"
            type="email"
            style={{ ...inputStyle, borderColor: emailTouched && !emailValid ? '#D32F2F' : ink, boxShadow: emailTouched && !emailValid ? `3px 3px 0 #D32F2F` : `3px 3px 0 ${ink}` }}
          />
          {emailTouched && !emailValid && (
            <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', color: '#D32F2F', margin: '4px 0 0 4px' }}>Enter a valid email address</p>
          )}
        </div>

        {/* Password with validation */}
        <div>
          <label style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.76rem', display: 'block', marginBottom: '6px', opacity: 0.6, letterSpacing: '0.1em' }}>PASSWORD</label>
          <input
            value={password}
            onChange={e => onChange('password', e.target.value)}
            onBlur={() => setPasswordTouched(true)}
            placeholder="min 6 characters"
            type="password"
            style={{ ...inputStyle, borderColor: passwordTouched && !passwordValid ? '#D32F2F' : ink, boxShadow: passwordTouched && !passwordValid ? `3px 3px 0 #D32F2F` : `3px 3px 0 ${ink}` }}
          />
          {passwordTouched && !passwordValid && (
            <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', color: '#D32F2F', margin: '4px 0 0 4px' }}>Must be at least 6 characters</p>
          )}
        </div>

        {/* Username with inline availability check */}
        <div>
          <label style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.76rem', display: 'block', marginBottom: '6px', opacity: 0.6, letterSpacing: '0.1em' }}>
            USERNAME
          </label>
          <div style={{ position: 'relative' }}>
            <input
              value={username}
              onChange={e => onChange('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              placeholder="e.g. alex_investor"
              type="text"
              style={{ ...inputStyle, paddingRight: '110px' }}
            />
            {usernameStatus !== 'idle' && (
              <span style={{
                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                fontFamily: "'Fredoka One', cursive", fontSize: '0.75rem',
                color: usernameStatus === 'available' ? '#2D9A4E' : usernameStatus === 'taken' ? '#D32F2F' : ink,
                opacity: usernameStatus === 'checking' ? 0.5 : 1,
              }}>
                {usernameStatus === 'checking' && '⏳ checking…'}
                {usernameStatus === 'available' && '✓ Available'}
                {usernameStatus === 'taken' && '✗ Taken'}
              </span>
            )}
          </div>
        </div>
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

function Step3Organization({
  orgId, orgCode, newCommunityName, newCommunityEmoji, newCommunityType, communityPublic,
  onChange, onNext, onBack,
}: {
  orgId: string; orgCode: string
  newCommunityName: string; newCommunityEmoji: string
  newCommunityType: string; communityPublic: boolean
  onChange(k: string, v: unknown): void
  onNext(): void; onBack(): void
}) {
  const [mode,    setMode]    = useState<'browse' | 'code' | 'create'>('browse')
  const [finding, setFinding] = useState(false)
  const [found,   setFound]   = useState(false)

  const isCreating = mode === 'create'
  const createValid = isCreating && newCommunityName.trim().length >= 2

  const valid = isCreating
    ? createValid
    : orgId.length > 0

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 16px', boxSizing: 'border-box',
    fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.95rem',
    background: paper, border: `3px solid ${ink}`, borderRadius: '12px',
    boxShadow: `3px 3px 0 ${ink}`, outline: 'none', color: ink,
  }

  function findOrg() {
    if (orgCode.trim().length < 4 || finding) return
    setFinding(true)
    setTimeout(() => {
      setFinding(false)
      setFound(true)
      onChange('orgId', 'CUSTOM_' + orgCode.trim().toUpperCase())
    }, 1100)
  }

  function handleNext() {
    if (isCreating && createValid) {
      const code = genCode(newCommunityName)
      onChange('orgId', 'NEW_' + newCommunityName.trim().toUpperCase().replace(/\s+/g, '_'))
      onChange('communityCode', code)
      onChange('isAdmin', true)
    }
    onNext()
  }

  function switchMode(m: typeof mode) {
    setMode(m)
    if (m !== 'create') {
      onChange('isAdmin', false)
      onChange('communityCode', '')
    }
    if (m !== 'code') { setFound(false) }
    if (m === 'browse') onChange('orgId', '')
    if (m === 'create') onChange('orgId', '')
  }

  return (
    <div style={{ paddingBottom: '8px' }}>
      <div style={{ textAlign: 'center', marginBottom: '18px' }}>
        <span style={{ fontSize: '2.8rem' }}>{isCreating ? '🏗️' : '🏢'}</span>
        <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.75rem', margin: '8px 0 4px' }}>
          {isCreating ? 'Create Your Community' : 'Join Your Organization'}
        </h2>
        <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.85rem', opacity: 0.5, margin: 0 }}>
          {isCreating ? 'Set up your own space & become admin' : 'Select your company, school, or community'}
        </p>
      </div>

      {/* Mode tabs */}
      <div style={{
        display: 'flex', gap: '6px', marginBottom: '16px',
        background: surface, borderRadius: '14px',
        padding: '4px', border: `2px solid ${ink}`,
        boxShadow: `2px 2px 0 ${ink}`,
      }}>
        {([
          { key: 'browse', label: '🌍 Browse', },
          { key: 'code',   label: '🔒 Code',   },
          { key: 'create', label: '✨ Create',  },
        ] as const).map(t => (
          <button key={t.key} onClick={() => switchMode(t.key)} style={{
            flex: 1, padding: '8px 6px',
            fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem',
            border: `2px solid ${mode === t.key ? ink : 'transparent'}`,
            borderRadius: '10px',
            background: mode === t.key
              ? (t.key === 'create' ? '#7B2D8B' : t.key === 'code' ? '#1565C0' : '#FFCD00')
              : 'transparent',
            color: mode === t.key ? (t.key === 'browse' ? '#1A0800' : 'white') : ink,
            cursor: 'pointer',
            boxShadow: mode === t.key ? `2px 2px 0 ${ink}` : 'none',
            transition: 'all 0.15s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Browse mode ───────────────────────────────────────── */}
      {mode === 'browse' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          {ORGS.map(org => {
            const sel = orgId === org.id
            return (
              <button key={org.id}
                onClick={() => onChange('orgId', org.id)}
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
      )}

      {/* ── Code mode ─────────────────────────────────────────── */}
      {mode === 'code' && (
        <div style={{ marginBottom: '20px', animation: 'fly-in-left 0.3s ease both' }}>
          <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.85rem', opacity: 0.5, margin: '0 0 12px' }}>
            Enter the invite code shared by your organization admin.
          </p>
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

      {/* ── Create mode ───────────────────────────────────────── */}
      {mode === 'create' && (
        <div style={{ marginBottom: '20px', animation: 'fly-in-left 0.3s ease both', display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Admin badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 14px', borderRadius: '12px',
            background: 'rgba(123,45,139,0.1)', border: '2px solid #7B2D8B',
          }}>
            <span style={{ fontSize: '1.2rem' }}>👑</span>
            <div>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem', color: '#7B2D8B' }}>
                You'll be the Admin
              </div>
              <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.68rem', opacity: 0.55 }}>
                Manage members, invite codes & content
              </div>
            </div>
          </div>

          {/* Community name */}
          <div>
            <label style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', display: 'block', marginBottom: '6px', opacity: 0.6, letterSpacing: '0.1em' }}>
              COMMUNITY NAME
            </label>
            <input
              value={newCommunityName}
              onChange={e => onChange('newCommunityName', e.target.value)}
              placeholder="e.g. Krakow Crypto Crew"
              maxLength={40}
              style={inputStyle}
            />
          </div>

          {/* Emoji picker */}
          <div>
            <label style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', display: 'block', marginBottom: '8px', opacity: 0.6, letterSpacing: '0.1em' }}>
              COMMUNITY EMOJI
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {COMMUNITY_EMOJIS.map(em => (
                <button key={em} onClick={() => onChange('newCommunityEmoji', em)} style={{
                  width: '40px', height: '40px', borderRadius: '10px', fontSize: '1.25rem',
                  border: `${newCommunityEmoji === em ? 3 : 2}px solid ${ink}`,
                  background: newCommunityEmoji === em ? '#FFCD00' : surface,
                  cursor: 'pointer',
                  boxShadow: newCommunityEmoji === em ? `2px 2px 0 ${ink}` : `1px 1px 0 ${ink}`,
                  transform: newCommunityEmoji === em ? 'scale(1.12) translate(-1px,-1px)' : '',
                  transition: 'all 0.15s cubic-bezier(0.34,1.56,0.64,1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Type selector */}
          <div>
            <label style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', display: 'block', marginBottom: '8px', opacity: 0.6, letterSpacing: '0.1em' }}>
              TYPE
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {COMMUNITY_TYPES.map(t => (
                <button key={t} onClick={() => onChange('newCommunityType', t)} style={{
                  padding: '6px 14px', borderRadius: '9999px',
                  fontFamily: "'Fredoka One', cursive", fontSize: '0.73rem',
                  border: `2px solid ${ink}`,
                  background: newCommunityType === t ? '#7B2D8B' : surface,
                  color: newCommunityType === t ? 'white' : ink,
                  cursor: 'pointer',
                  boxShadow: newCommunityType === t ? `2px 2px 0 ${ink}` : `1px 1px 0 ${ink}`,
                  transition: 'all 0.13s cubic-bezier(0.34,1.56,0.64,1)',
                }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Public/Private toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', border: `2px solid ${ink}`, background: paper, boxShadow: `2px 2px 0 ${ink}` }}>
            <div>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem' }}>
                {communityPublic ? '🌍 Public Community' : '🔒 Private Community'}
              </div>
              <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.68rem', opacity: 0.5, marginTop: '2px' }}>
                {communityPublic ? 'Anyone can discover & join' : 'Invite code required'}
              </div>
            </div>
            <button
              onClick={() => onChange('communityPublic', !communityPublic)}
              style={{
                width: '48px', height: '26px', borderRadius: '13px',
                border: `2px solid ${ink}`,
                background: communityPublic ? '#2D9A4E' : surface,
                cursor: 'pointer', position: 'relative',
                boxShadow: `2px 2px 0 ${ink}`,
                transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute', top: '3px',
                left: communityPublic ? '22px' : '3px',
                width: '16px', height: '16px', borderRadius: '50%',
                background: 'white', border: `1.5px solid ${ink}`,
                transition: 'left 0.2s cubic-bezier(0.34,1.56,0.64,1)',
              }}/>
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{ ...btnBase, fontSize: '0.9rem', padding: '12px 24px', background: surface, color: ink, boxShadow: `3px 3px 0 ${ink}` }}
          onMouseEnter={e => lift(e)} onMouseLeave={e => unlift(e)}>← Back</button>
        <button onClick={handleNext} disabled={!valid} style={{
          ...btnBase, fontSize: '0.9rem', padding: '12px 32px',
          background: valid ? (isCreating ? '#7B2D8B' : '#1565C0') : surface,
          color: valid ? 'white' : ink,
          boxShadow: valid ? `3px 3px 0 ${ink}` : `1px 1px 0 ${ink}`,
          opacity: valid ? 1 : 0.45,
        }}
          onMouseEnter={e => { if (valid) lift(e) }}
          onMouseLeave={e => { if (valid) unlift(e) }}>
          {isCreating ? 'Create →' : 'Join →'}
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

function Step5Complete({ name, username, avatarIdx, orgId, goals, isAdmin, newCommunityName, newCommunityEmoji, communityCode, email, password }: {
  name: string; username: string; avatarIdx: number; orgId: string; goals: string[]
  isAdmin: boolean; newCommunityName: string; newCommunityEmoji: string; communityCode: string
  email: string; password: string
}) {
  const navigate = useNavigate()
  const org      = ORGS.find(o => o.id === orgId)
  const orgName  = isAdmin ? newCommunityName : (org ? org.name : orgId.replace('CUSTOM_', ''))
  const [status,  setStatus]  = React.useState<'loading' | 'success' | 'error'>('loading')
  const [authErr, setAuthErr] = React.useState('')
  const [retryKey, setRetryKey] = React.useState(0)

  React.useEffect(() => {
    let cancelled = false

    if (isAdmin) {
      localStorage.setItem('xp_is_admin', 'true')
      localStorage.setItem('xp_community_name', newCommunityName)
      localStorage.setItem('xp_community_emoji', newCommunityEmoji)
      localStorage.setItem('xp_community_code', communityCode)
    } else {
      localStorage.removeItem('xp_is_admin')
    }

    async function register() {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, username, displayName: name, avatar: AVATARS[avatarIdx], orgId, goals }),
        })
        if (cancelled) return
        const data = await res.json()
        if (cancelled) return

        // 409 = username/email already registered (StrictMode double-invoke in dev) — skip to sign-in
        if (!res.ok && res.status !== 409) {
          setAuthErr(data.error ?? 'Registration failed')
          setStatus('error')
          return
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (cancelled) return
        if (signInError) { setAuthErr(signInError.message); setStatus('error'); return }

        // Fetch fresh member data (handles both new registration and 409 re-run)
        const memberRes = await fetch(`/api/members/${username}`)
        if (cancelled) return
        const member = memberRes.ok ? await memberRes.json() : null
        if (cancelled) return

        setSession({
          id: member?.id ?? data.id,
          username: member?.username ?? data.username ?? username,
          displayName: member?.displayName ?? data.display_name ?? name,
          avatar: member?.avatar ?? data.avatar ?? AVATARS[avatarIdx],
        })
        setStatus('success')
      } catch {
        if (cancelled) return
        setAuthErr('Account creation failed. Please try again.')
        setStatus('error')
      }
    }
    register()
    return () => { cancelled = true }
  }, [retryKey])

  // Loading state while registering
  if (status === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.4rem', marginBottom: '8px' }}>
          Creating your account…
        </div>
        <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.85rem', opacity: 0.5 }}>
          Just a moment!
        </div>
      </div>
    )
  }

  // Error state
  if (status === 'error') {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>❌</div>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.4rem', marginBottom: '12px' }}>
          Registration Failed
        </div>
        <div style={{ padding: '12px 16px', background: 'rgba(230,57,70,0.1)', border: '2px solid #E63946', borderRadius: '12px', marginBottom: '20px', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.85rem', color: '#E63946' }}>
          {authErr}
        </div>
        <button onClick={() => { setStatus('loading'); setAuthErr(''); setRetryKey(k => k + 1) }} style={{ ...btnBase, fontSize: '0.95rem', padding: '14px 36px', background: '#FFCD00', color: '#1A0800', boxShadow: `4px 4px 0 ${ink}` }}
          onMouseEnter={e => lift(e)} onMouseLeave={e => unlift(e)}>
          ↩ Try Again
        </button>
      </div>
    )
  }

  // Success state
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
        {isAdmin ? `Community Created! 👑` : `You're in, ${name}! 🎉`}
      </h2>
      <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.9rem', opacity: 0.5, margin: '0 0 26px' }}>
        {isAdmin ? `You're now admin of ${orgName}` : 'Your financial journey begins now.'}
      </p>

      {/* Summary card */}
      <div style={{
        background: paper, border: `3px solid ${ink}`, borderRadius: '20px',
        padding: '18px', maxWidth: '340px', margin: '0 auto 20px',
        boxShadow: `5px 5px 0 ${ink}`, textAlign: 'left',
        animation: 'fly-in-left 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.4s both',
      }}>
        {[
          { label: isAdmin ? 'Your Community' : 'Organization', value: `${newCommunityEmoji || ''} ${orgName}`.trim(), emoji: isAdmin ? '👑' : '🏢' },
          ...(isAdmin ? [{ label: 'Invite Code', value: communityCode, emoji: '🔑' }] : []),
          { label: 'Starting XP',  value: '+100 XP', emoji: '✨' },
          { label: 'Missions set', value: `${goals.length} goal${goals.length !== 1 ? 's' : ''}`, emoji: '🎯' },
        ].map((row, i, arr) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 0',
            borderBottom: i < arr.length - 1 ? `1.5px solid color-mix(in srgb, var(--rh-ink) 10%, transparent)` : 'none',
          }}>
            <span style={{ fontSize: '1.2rem', width: '28px', textAlign: 'center' }}>{row.emoji}</span>
            <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.82rem', opacity: 0.52, flex: 1 }}>{row.label}</span>
            <span style={{
              fontFamily: "'Fredoka One', cursive", fontSize: row.label === 'Invite Code' ? '0.78rem' : '0.92rem',
              letterSpacing: row.label === 'Invite Code' ? '0.12em' : 0,
              color: row.label === 'Invite Code' ? '#7B2D8B' : ink,
            }}>{row.value}</span>
          </div>
        ))}
      </div>

      {/* Admin panel CTA */}
      {isAdmin && (
        <div style={{
          maxWidth: '340px', margin: '0 auto 16px',
          padding: '14px 16px', borderRadius: '16px',
          border: '2px dashed #7B2D8B',
          background: 'rgba(123,45,139,0.07)',
          animation: 'bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.55s both',
          textAlign: 'left',
        }}>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem', color: '#7B2D8B', marginBottom: '4px' }}>
            ⚙️ Admin Panel unlocked
          </div>
          <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.72rem', opacity: 0.55 }}>
            Manage members, invite codes & learning content from the ⚙️ icon in the nav.
          </div>
        </div>
      )}

      <button
        onClick={() => navigate('/')}
        style={{
          ...btnBase,
          fontSize: '1.08rem', padding: '16px 52px',
          background: isAdmin ? '#7B2D8B' : '#7B2D8B', color: 'white',
          boxShadow: `5px 5px 0 ${ink}`,
          animation: 'bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.6s both',
        }}
        onMouseEnter={e => lift(e, '7px 7px 0')}
        onMouseLeave={e => unlift(e, '5px 5px 0')}
      >
        {isAdmin ? 'Launch Community →' : 'Start Learning →'}
      </button>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────

interface Form {
  name: string; username: string; avatarIdx: number
  email: string; password: string
  orgId: string; orgCode: string; goals: string[]
  isAdmin: boolean
  newCommunityName: string; newCommunityEmoji: string
  newCommunityType: string; communityPublic: boolean
  communityCode: string
}

export default function Onboarding() {
  const [mode,    setMode]    = useState<'landing' | 'login' | 'signup'>('landing')
  const [step,    setStep]    = useState(0)
  const [dir,     setDir]     = useState<'fwd' | 'back'>('fwd')
  const [animKey, setAnimKey] = useState(0)

  const [form, setForm] = useState<Form>({
    name: '', username: '', avatarIdx: 0,
    email: '', password: '',
    orgId: '', orgCode: '', goals: [],
    isAdmin: false,
    newCommunityName: '', newCommunityEmoji: '🌟',
    newCommunityType: 'Community', communityPublic: false,
    communityCode: '',
  })

  function update(k: string, v: unknown) {
    setForm(f => ({ ...f, [k]: v }))
  }
  function next() { setDir('fwd');  setAnimKey(k => k + 1); setStep(s => s + 1) }
  function back() {
    setDir('back')
    setAnimKey(k => k + 1)
    if (step === 0) { setMode('landing') } else { setStep(s => s - 1) }
  }

  const anim = dir === 'fwd' ? 'fly-in-right 0.32s ease both' : 'fly-in-left 0.32s ease both'

  const showProgress = mode === 'signup'

  return (
    <div style={{
      minHeight: '100vh',
      background: paper,
      backgroundImage: 'radial-gradient(circle, var(--rh-body-dot) 1.2px, transparent 1.2px), radial-gradient(circle, var(--rh-body-dot) 1.2px, transparent 1.2px)',
      backgroundSize: '24px 24px', backgroundPosition: '0 0, 12px 12px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: '520px', padding: '0 20px' }}>
        <div style={{ padding: '18px 0 0', textAlign: 'center', fontFamily: "'Fredoka One', cursive", fontSize: '0.95rem', opacity: 0.45, color: ink, letterSpacing: '0.06em' }}>★ XP Gazette</div>
        {showProgress && <StepProgress step={step} />}
      </div>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: '520px', padding: '0 16px 48px' }}>
        <div style={{ background: paper, border: `3px solid ${ink}`, borderRadius: '24px', padding: '28px 28px 24px', boxShadow: `6px 6px 0 ${ink}`, overflow: 'hidden' }}>

          {mode === 'landing' && (
            <Landing
              onLogin={() => { setMode('login'); setAnimKey(k => k + 1) }}
              onSignup={() => { setMode('signup'); setStep(0); setAnimKey(k => k + 1) }}
            />
          )}

          {mode === 'login' && (
            <LoginForm onBack={() => { setMode('landing'); setAnimKey(k => k + 1) }} />
          )}

          {mode === 'signup' && (
            <div key={animKey} style={{ animation: anim }}>
              {step === 0 && <Step1Welcome onNext={next} />}
              {step === 1 && (
                <Step2Identity
                  name={form.name} username={form.username} avatarIdx={form.avatarIdx}
                  email={form.email} password={form.password}
                  onChange={update} onNext={next} onBack={back}
                />
              )}
              {step === 2 && (
                <Step3Organization
                  orgId={form.orgId} orgCode={form.orgCode}
                  newCommunityName={form.newCommunityName}
                  newCommunityEmoji={form.newCommunityEmoji}
                  newCommunityType={form.newCommunityType}
                  communityPublic={form.communityPublic}
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
                  name={form.name} username={form.username} avatarIdx={form.avatarIdx}
                  orgId={form.orgId} goals={form.goals}
                  isAdmin={form.isAdmin}
                  newCommunityName={form.newCommunityName}
                  newCommunityEmoji={form.newCommunityEmoji}
                  communityCode={form.communityCode}
                  email={form.email} password={form.password}
                />
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

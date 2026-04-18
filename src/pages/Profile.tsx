import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, getUserGames, getUserBadges, type User, type GameResult, type UserBadge } from '../lib/api'
import { getSession } from '../lib/session'
import { useAuth } from '../contexts/AuthContext'
import { useIsMobile } from '../lib/responsive'

const ink     = 'var(--rh-ink)'
const paper   = 'var(--rh-paper)'
const surface = 'var(--rh-surface)'

// ─── Animated SVG mascot ─────────────────────────────────────
// IMAGE GENERATION PROMPT:
// "1930s rubber hose cartoon style character, a cheerful anthropomorphic coin
//  wearing a tiny top hat, white gloves, big round black eyes with white shine
//  dots, thick black outlines (3-4px), rubbery bendable limbs, dancing pose,
//  cream/yellow color palette, flat 2D illustration, Fleischer Studios aesthetic,
//  transparent background, no shading gradients, bold halftone dots for texture"


// ─── XP ring SVG ─────────────────────────────────────────────
function XPRingSVG({ pct, xp, xpMax }: { pct: number; xp: number; xpMax: number }) {
  const r = 44, circ = 2 * Math.PI * r
  const dash = circ * Math.min(pct, 100) / 100
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke={surface} strokeWidth="10"/>
      <circle cx="55" cy="55" r={r} fill="none" stroke="#FFCD00" strokeWidth="10"
        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ * 0.25}
        strokeLinecap="round"/>
      <circle cx="55" cy="55" r={r} fill="none" stroke="#1A0800" strokeWidth="3"
        strokeDasharray={`${dash + 1} ${circ - dash - 1}`} strokeDashoffset={circ * 0.25}
        strokeLinecap="round" opacity="0.35"/>
      <text x="55" y="50" textAnchor="middle" fontFamily="'Fredoka One',cursive" fontSize="14" fill="var(--rh-ink)">{xp}</text>
      <text x="55" y="66" textAnchor="middle" fontFamily="'Fredoka Variable',sans-serif" fontWeight="700" fontSize="9" fill="var(--rh-ink)" opacity="0.55">/ {xpMax} XP</text>
    </svg>
  )
}

// ─── Trophy shelf SVG ────────────────────────────────────────
// IMAGE GENERATION PROMPT:
// "1930s rubber hose cartoon style wooden trophy shelf with 6 cartoon trophies
//  and medals, each trophy has a different color and cartoonish face expression,
//  thick black outlines, warm cream/parchment background, Fleischer Studios
//  style, flat 2D, bold shadows, halftone texture dots, no gradients"
function TrophyShelfSVG() {
  const trophies = [
    { x: 15, color: '#FFCD00', label: '1ST', locked: false },
    { x: 52, color: '#E63946', label: '🔥', locked: false },
    { x: 89, color: '#1565C0', label: '⚡', locked: false },
    { x: 126, color: '#2D9A4E', label: '📚', locked: true },
    { x: 163, color: '#FF7B25', label: '💰', locked: true },
    { x: 200, color: '#7B2D8B', label: '★', locked: true },
  ]
  return (
    <svg viewBox="0 0 240 90" width="100%" height="90" xmlns="http://www.w3.org/2000/svg">
      {/* Shelf plank */}
      <rect x="0" y="72" width="240" height="14" rx="3" fill="#E8D5A3" stroke="#1A0800" strokeWidth="2.5"/>
      <rect x="2" y="74" width="236" height="4" rx="2" fill="#D4B87A" opacity="0.6"/>
      {trophies.map((t, i) => (
        <g key={i} opacity={t.locked ? 0.3 : 1}>
          {/* Cup body */}
          <path d={`M${t.x} 30 Q${t.x-10} 10 ${t.x} 8 Q${t.x+10} 10 ${t.x} 30Z`}
            fill={t.color} stroke="#1A0800" strokeWidth="2.2"/>
          {/* Handles */}
          <path d={`M${t.x-8} 18 Q${t.x-18} 12 ${t.x-8} 22`} fill="none" stroke="#1A0800" strokeWidth="2"/>
          <path d={`M${t.x+8} 18 Q${t.x+18} 12 ${t.x+8} 22`} fill="none" stroke="#1A0800" strokeWidth="2"/>
          {/* Base */}
          <rect x={t.x-8} y="30" width="16" height="5" rx="2" fill={t.color} stroke="#1A0800" strokeWidth="2"/>
          <rect x={t.x-12} y="35" width="24" height="5" rx="2" fill={t.color} stroke="#1A0800" strokeWidth="2"/>
          {/* Stem */}
          <rect x={t.x-2} y="56" width="4" height="14" fill={t.color} stroke="#1A0800" strokeWidth="2"/>
          {/* Label */}
          <text x={t.x} y="22" textAnchor="middle" fontSize="8" fontFamily="'Fredoka One',cursive" fill="#1A0800">{t.label}</text>
          {/* Lock icon for locked */}
          {t.locked && <text x={t.x} y="50" textAnchor="middle" fontSize="10">🔒</text>}
        </g>
      ))}
    </svg>
  )
}

// ─── Streak fire SVG (animated) ──────────────────────────────
function FireSVG({ count }: { count: number }) {
  return (
    <svg viewBox="0 0 60 70" width="60" height="70" xmlns="http://www.w3.org/2000/svg">
      <path d="M30 65 Q10 50 15 30 Q20 18 30 22 Q25 10 35 5 Q38 18 45 22 Q55 28 50 45 Q47 58 30 65Z"
        fill="#FF7B25" stroke="#1A0800" strokeWidth="2.5" strokeLinejoin="round">
        <animate attributeName="d"
          values="M30 65 Q10 50 15 30 Q20 18 30 22 Q25 10 35 5 Q38 18 45 22 Q55 28 50 45 Q47 58 30 65Z;
                  M30 65 Q8 52 14 28 Q20 14 30 20 Q23 6 36 3 Q40 16 47 20 Q57 26 52 43 Q49 57 30 65Z;
                  M30 65 Q10 50 15 30 Q20 18 30 22 Q25 10 35 5 Q38 18 45 22 Q55 28 50 45 Q47 58 30 65Z"
          dur="1.4s" repeatCount="indefinite" calcMode="spline"
          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"/>
      </path>
      {/* Inner flame */}
      <path d="M30 58 Q18 46 22 34 Q28 28 30 32 Q32 25 38 28 Q44 35 40 48 Q37 57 30 58Z"
        fill="#FFCD00" stroke="#1A0800" strokeWidth="1.5">
        <animate attributeName="d"
          values="M30 58 Q18 46 22 34 Q28 28 30 32 Q32 25 38 28 Q44 35 40 48 Q37 57 30 58Z;
                  M30 58 Q16 48 21 32 Q27 25 30 30 Q31 22 39 26 Q46 33 42 47 Q39 56 30 58Z;
                  M30 58 Q18 46 22 34 Q28 28 30 32 Q32 25 38 28 Q44 35 40 48 Q37 57 30 58Z"
          dur="1.4s" repeatCount="indefinite" calcMode="spline"
          keySplines="0.4 0 0.6 1; 0.4 0 0.6 1"/>
      </path>
      <text x="30" y="50" textAnchor="middle" fontFamily="'Fredoka One',cursive" fontSize="14" fill="#1A0800">{count}</text>
    </svg>
  )
}

const ACCENT_MAP: Record<string, string> = {
  quiz: '#FFCD00', decision: '#E63946', swipe: '#1565C0', fraud: '#FF7B25', path: '#7B2D8B',
}

const TABS = ['Overview', 'Badges', 'History', 'Settings']

const BADGE_CATALOG = [
  { id: 'first_quiz',     emoji: '🏆', name: 'First Quiz',      desc: 'Completed your first round',         accent: '#FFCD00' },
  { id: 'speed_reader',   emoji: '⚡', name: 'Speed Reader',     desc: 'Answered in under 5 seconds',        accent: '#1565C0' },
  { id: 'finance_101',    emoji: '🎓', name: 'Finance 101',      desc: 'Completed chapter 1 basics',         accent: '#2D9A4E' },
  { id: 'xp_500',         emoji: '💰', name: '500 XP Club',      desc: 'Earn 500 XP total',                  accent: '#FF7B25' },
  { id: 'streak_7',       emoji: '🔥', name: '7-Day Streak',     desc: 'Log in 7 days straight',             accent: '#E63946' },
  { id: 'perfect_round',  emoji: '🌟', name: 'Perfect Round',    desc: 'Score 100% on any quiz',             accent: '#FFCD00' },
  { id: 'sharpshooter',   emoji: '🎯', name: 'Sharpshooter',     desc: '90% accuracy overall',               accent: '#7B2D8B' },
  { id: 'bull_market',    emoji: '📈', name: 'Bull Market',      desc: 'Win 10 games in a row',              accent: '#2D9A4E' },
  { id: 'fraud_fighter',  emoji: '🕵️', name: 'Fraud Fighter',   desc: 'Spot 5+ frauds in one game',         accent: '#1565C0' },
  { id: 'wise_swiper',    emoji: '🃏', name: 'Wise Swiper',      desc: 'Perfect score on Card Swipe',        accent: '#FF7B25' },
  { id: 'decision_maker', emoji: '🧠', name: 'Decision Maker',   desc: 'Make a brilliant decision',          accent: '#7B2D8B' },
  { id: 'streak_30',      emoji: '🔥', name: '30-Day Streak',    desc: 'Log in 30 days straight',            accent: '#E63946' },
  { id: 'xp_1000',        emoji: '💰', name: '1K XP Club',       desc: 'Earn 1,000 XP total',                accent: '#FF7B25' },
  { id: 'xp_5000',        emoji: '⚡', name: '5K XP Club',       desc: 'Earn 5,000 XP total',                accent: '#1565C0' },
  { id: 'xp_10000',       emoji: '💎', name: '10K XP Legend',    desc: 'Earn 10,000 XP total',               accent: '#FFCD00' },
  { id: 'community_100',  emoji: '👥', name: 'Community 100',    desc: 'Join a 100-member community',        accent: '#2D9A4E' },
  { id: 'night_owl',      emoji: '🦉', name: 'Night Owl',        desc: 'Play after midnight',                accent: '#7B2D8B' },
  { id: 'early_bird',     emoji: '🐦', name: 'Early Bird',       desc: 'Play before 7am',                    accent: '#FFCD00' },
  { id: 'quiz_master',    emoji: '🧠', name: 'Quiz Master',      desc: 'Complete 20+ quiz games',            accent: '#FF7B25' },
  { id: 'path_starter',   emoji: '🗺️', name: 'Path Starter',    desc: 'Complete your first path node',      accent: '#2D9A4E' },
  { id: 'path_halfway',   emoji: '🏃', name: 'Halfway There',    desc: 'Complete 7 path nodes',              accent: '#1565C0' },
  { id: 'path_complete',  emoji: '🏆', name: 'Path Complete',    desc: 'Complete all 15 path nodes',         accent: '#FFCD00' },
  { id: 'top_10',         emoji: '🥇', name: 'Top 10',           desc: 'Reach top 10 on leaderboard',        accent: '#FFCD00' },
  { id: 'top_100',        emoji: '🥈', name: 'Top 100',          desc: 'Reach top 100 on leaderboard',       accent: '#2D9A4E' },
  { id: 'invite_3',       emoji: '📨', name: 'Connector',        desc: 'Invite 3 friends',                   accent: '#FF7B25' },
  { id: 'comeback',       emoji: '💪', name: 'Comeback',         desc: 'Return after 7+ days away',          accent: '#E63946' },
]

const XP_LEVELS = [
  { min: 10000, label: 'Legend', xpMax: 15000 },
  { min: 5000,  label: 'Expert', xpMax: 10000 },
  { min: 2000,  label: 'Pro',    xpMax: 5000  },
  { min: 500,   label: 'Rising', xpMax: 2000  },
  { min: 0,     label: 'Rookie', xpMax: 500   },
]
function getXpMax(xp: number) {
  return (XP_LEVELS.find(l => xp >= l.min) ?? XP_LEVELS[XP_LEVELS.length - 1]).xpMax
}

export default function Profile() {
  const [tab, setTab] = useState('Overview')
  const [user, setUser] = useState<User | null>(null)
  const [history, setHistory] = useState<GameResult[]>([])
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([])
  const { signOut } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const session = getSession()
    if (!session) return
    getUser(session.id).then(setUser).catch(() => {})
    getUserGames(session.id).then(setHistory).catch(() => {})
    getUserBadges(session.id).then(setEarnedBadges).catch(() => {})
  }, [])

  async function handleSignOut() {
    await signOut()
    navigate('/onboarding')
  }

  const PLAYER = {
    name: user?.display_name ?? 'Rookie Investor',
    level: 1,
    xp: user?.xp ?? 0,
    xpMax: getXpMax(user?.xp ?? 0),
    streak: user?.streak ?? 0,
    badges: [] as string[],
    totalGames: history.length,
    rank: 0,
    accuracy: history.length > 0
      ? Math.round(history.reduce((s, r) => s + (r.total > 0 ? r.score / r.total : 0), 0) / history.length * 100)
      : 0,
    avatar: user?.avatar ?? '🎩',
  }

  const ACTIVITY = (() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const activeDates = new Set(history.map(r => r.created_at.split('T')[0]))
    return days.map((day, i) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - i))
      return { day, done: activeDates.has(d.toISOString().split('T')[0]) }
    })
  })()

  const HISTORY = history.slice(0, 4).map(r => ({
    mode: r.label,
    result: `+${r.xp_earned} XP`,
    score: r.total > 0 ? `${r.score}/${r.total}` : '✓',
    date: r.created_at.slice(5, 10).replace('-', ' '),
    accent: ACCENT_MAP[r.game_type] ?? '#FFCD00',
  }))

  const isMobile = useIsMobile()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--rh-surface)',
      backgroundImage: 'radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px), radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px)',
      backgroundSize: '22px 22px', backgroundPosition: '0 0, 11px 11px',
      padding: isMobile ? '16px 12px 64px' : '32px 24px 64px',
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* ── Profile hero card ─────────────────────────────── */}
        <div style={{
          background: paper, border: `3px solid ${ink}`,
          borderRadius: '2.2rem 2rem 2.2rem 2.1rem',
          boxShadow: `8px 8px 0 ${ink}`,
          overflow: 'hidden', marginBottom: '24px',
          transform: 'rotate(-0.2deg)',
        }}>
          {/* Banner strip */}
          <div style={{
            height: '100px', position: 'relative', overflow: 'hidden',
            backgroundImage: 'repeating-linear-gradient(-45deg, #FFCD00 0px, #FFCD00 18px, #1A0800 18px, #1A0800 36px)',
            borderBottom: `3px solid ${ink}`,
          }}>
            {/* IMAGE PLACEHOLDER — replace with generated image:
                PROMPT: "1930s rubber hose cartoon banner illustration, repeating
                pattern of tiny dancing coins, dollar signs, and star bursts on
                a yellow and black diagonal stripe background, Fleischer Studios
                style, thick black outlines, flat 2D, no gradients, tile-able" */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '40px', opacity: 0.18 }}>
              {['🪙','⭐','💵','🎩','🏆'].map((e,i) => <span key={i} style={{ fontSize: '2.5rem' }}>{e}</span>)}
            </div>
            <div style={{ position: 'absolute', top: '12px', right: '18px' }}>
              <span style={{
                background: '#E63946', color: '#FEF9EE',
                fontFamily: "'Fredoka One', cursive", fontSize: '0.6rem',
                letterSpacing: '0.14em', padding: '3px 12px',
                borderRadius: '9999px', border: `2px solid ${ink}`,
                boxShadow: `2px 2px 0 ${ink}`,
              }}>ROOKIE LEVEL</span>
            </div>
          </div>

          <div style={{ padding: isMobile ? '0 16px 20px' : '0 28px 24px', display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Avatar — pulled up over banner */}
            <div style={{ flexShrink: 0, marginTop: '-40px', position: 'relative' }}>
              <div style={{
                width: '90px', height: '90px', borderRadius: '50%',
                border: `4px solid ${ink}`, background: '#FFCD00',
                boxShadow: `4px 4px 0 ${ink}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                <span style={{ fontSize: '3rem' }}>{PLAYER.avatar}</span>
              </div>
              {/* Level badge */}
              <div style={{
                position: 'absolute', bottom: '-4px', right: '-4px',
                width: '28px', height: '28px', borderRadius: '50%',
                background: '#E63946', border: `2.5px solid ${ink}`,
                boxShadow: `2px 2px 0 ${ink}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem', color: '#FEF9EE',
              }}>1</div>
            </div>

            {/* Name + stats */}
            <div style={{ flex: 1, paddingTop: '14px' }}>
              <h1 style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: '1.9rem', lineHeight: 1, marginBottom: '4px',
                textShadow: `3px 3px 0 ${ink}`,
              }}>{PLAYER.name}</h1>
              <p style={{
                fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600,
                fontSize: '0.75rem', letterSpacing: '0.12em',
                textTransform: 'uppercase', opacity: 0.5, marginBottom: '16px',
              }}>Joined April 2026 · Rank #{PLAYER.rank} Globally</p>
              <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
                {[
                  { label: 'Total XP', value: `${PLAYER.xp}`, accent: '#FFCD00' },
                  { label: 'Games Played', value: `${PLAYER.totalGames}`, accent: '#1565C0' },
                  { label: 'Accuracy', value: `${PLAYER.accuracy}%`, accent: '#2D9A4E' },
                  { label: 'Badges', value: `${PLAYER.badges.length}`, accent: '#FF7B25' },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: '8px 16px', borderRadius: '9999px',
                    border: `2.5px solid ${ink}`, background: s.accent,
                    boxShadow: `3px 3px 0 ${ink}`, textAlign: 'center',
                  }}>
                    <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.1rem', lineHeight: 1, color: '#1A0800' }}>{s.value}</div>
                    <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7, color: '#1A0800' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* XP ring */}
            <div style={{ flexShrink: 0, paddingTop: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <XPRingSVG pct={(PLAYER.xp / PLAYER.xpMax) * 100} xp={PLAYER.xp} xpMax={PLAYER.xpMax} />
              <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5 }}>Progress</span>
            </div>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: paper, border: `2.5px solid ${ink}`, borderRadius: '9999px', padding: '5px', boxShadow: `4px 4px 0 ${ink}`, width: isMobile ? '100%' : 'fit-content', overflowX: 'auto' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem',
              letterSpacing: '0.07em', padding: '7px 20px',
              borderRadius: '9999px', border: 'none',
              background: tab === t ? ink : 'transparent',
              color: tab === t ? paper : ink,
              cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: tab === t ? `2px 2px 0 color-mix(in srgb, ${ink} 35%, transparent)` : 'none',
            }}>{t}</button>
          ))}
        </div>

        {/* ── Tab: Overview ─────────────────────────────────────── */}
        {tab === 'Overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>

            {/* Streak + weekly heatmap */}
            <SectionCard title="🔥 Current Streak">
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '16px' }}>
                <FireSVG count={PLAYER.streak} />
                <div>
                  <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '2rem', lineHeight: 1 }}>{PLAYER.streak} Days</div>
                  <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.75rem', opacity: 0.55, marginBottom: '12px' }}>Keep it up — 4 more for a bonus!</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {ACTIVITY.map(a => (
                      <div key={a.day} style={{ textAlign: 'center' }}>
                        <div style={{
                          width: '28px', height: '28px', borderRadius: '50%',
                          background: a.done ? '#FFCD00' : surface,
                          border: `2px solid ${ink}`,
                          boxShadow: a.done ? `2px 2px 0 ${ink}` : 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.8rem',
                        }}>{a.done ? '✓' : '·'}</div>
                        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.5rem', opacity: 0.5, marginTop: '3px' }}>{a.day}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Trophy shelf */}
            <SectionCard title="🏆 Trophy Shelf">
              <div style={{ padding: '16px 8px 4px' }}>
                <TrophyShelfSVG />
                <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.72rem', opacity: 0.5, textAlign: 'center', marginTop: '8px' }}>3 earned · 3 locked</div>
              </div>
            </SectionCard>

            {/* Recent activity */}
            <SectionCard title="📋 Recent Activity">
              <div style={{ padding: '0 16px 16px' }}>
                {HISTORY.map((h, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 0',
                    borderBottom: i < HISTORY.length-1 ? `1.5px solid color-mix(in srgb, ${ink} 15%, transparent)` : 'none',
                  }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: h.accent, border: `2px solid ${ink}`, boxShadow: `2px 2px 0 ${ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Fredoka One', cursive", fontSize: '0.62rem', flexShrink: 0 }}>{h.score}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem' }}>{h.mode}</div>
                      <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.65rem', opacity: 0.5 }}>{h.date}</div>
                    </div>
                    <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.78rem', color: '#2D9A4E' }}>{h.result}</div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Financial tip card */}
            <SectionCard title="💡 Your Learning Path">
              <div style={{ padding: '16px' }}>
                {/* IMAGE PLACEHOLDER — replace with generated illustration:
                    PROMPT: "1930s rubber hose cartoon road map illustration,
                    winding yellow brick road with signposts labeled Savings,
                    Budgeting, Investing, Retirement, cartoon style, thick black
                    outlines, Fleischer Studios aesthetic, warm cream background,
                    flat 2D, top-down map view, hand-drawn feel" */}
                <div style={{
                  height: '80px', borderRadius: '1rem', background: surface,
                  border: `2px solid ${ink}`, marginBottom: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column', gap: '4px', opacity: 0.6,
                }}>
                  <span style={{ fontSize: '1.8rem' }}>🗺️</span>
                  <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.58rem', letterSpacing: '0.1em', opacity: 0.7 }}>LEARNING MAP — IMAGE PLACEHOLDER</span>
                </div>
                {[
                  { label: 'Budgeting Basics', pct: 100, color: '#2D9A4E' },
                  { label: 'Compound Interest', pct: 60, color: '#FFCD00' },
                  { label: 'Stock Market 101', pct: 20, color: '#E63946' },
                ].map(p => (
                  <div key={p.label} style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.7rem', marginBottom: '4px' }}>
                      <span>{p.label}</span><span>{p.pct}%</span>
                    </div>
                    <div style={{ height: '10px', borderRadius: '9999px', border: `2px solid ${ink}`, background: surface, overflow: 'hidden', boxShadow: `2px 2px 0 ${ink}` }}>
                      <div style={{ width: `${p.pct}%`, height: '100%', background: p.color, borderRadius: '9999px', transition: 'width 0.5s' }}/>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        )}

        {/* ── Tab: Badges ───────────────────────────────────────── */}
        {tab === 'Badges' && (() => {
          const earnedIds = new Set(earnedBadges.map(b => b.badge_id))
          return (
            <div style={{ background: paper, border: `3px solid ${ink}`, borderRadius: '2rem 1.8rem 2rem 1.9rem', boxShadow: `8px 8px 0 ${ink}`, padding: '28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                {BADGE_CATALOG.map(b => {
                  const earned = earnedIds.has(b.id)
                  return (
                    <div key={b.id} style={{
                      border: `2.5px solid ${ink}`,
                      borderRadius: '1.4rem 1.6rem 1.4rem 1.5rem',
                      background: earned ? b.accent : surface,
                      boxShadow: `4px 4px 0 ${ink}`,
                      padding: '16px', textAlign: 'center',
                      opacity: earned ? 1 : 0.45,
                      transition: 'transform 0.12s, box-shadow 0.12s',
                      cursor: 'default',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `6px 6px 0 ${ink}` }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0 ${ink}` }}
                    >
                      <div style={{ fontSize: '2.4rem', marginBottom: '6px' }}>{earned ? b.emoji : '🔒'}</div>
                      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem', marginBottom: '4px', color: '#1A0800' }}>{b.name}</div>
                      <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.64rem', opacity: 0.65, color: '#1A0800', lineHeight: 1.4 }}>{b.desc}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* ── Tab: History ──────────────────────────────────────── */}
        {tab === 'History' && (
          <div style={{ background: paper, border: `3px solid ${ink}`, borderRadius: '2rem 1.8rem 2rem 1.9rem', boxShadow: `8px 8px 0 ${ink}`, overflow: 'hidden' }}>
            {!isMobile && (
              <div style={{ background: surface, borderBottom: `2px solid ${ink}`, padding: '10px 20px', fontFamily: "'Fredoka One', cursive", fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: '8px', opacity: 0.65 }}>
                <span>Game</span><span style={{ textAlign: 'center' }}>Score</span><span style={{ textAlign: 'center' }}>XP</span><span style={{ textAlign: 'center' }}>Date</span>
              </div>
            )}
            {[...HISTORY, ...HISTORY].map((h, i) => (
              <div key={i} style={{
                display: isMobile ? 'flex' : 'grid',
                gridTemplateColumns: '1fr 80px 80px 80px', gap: '8px',
                padding: isMobile ? '10px 14px' : '12px 20px', alignItems: 'center',
                borderBottom: `1.5px solid color-mix(in srgb, ${ink} 12%, transparent)`,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = surface)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: h.accent, border: `2px solid ${ink}`, flexShrink: 0 }}/>
                  <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem' }}>{h.mode}</span>
                </div>
                {isMobile ? (
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem', color: '#2D9A4E' }}>{h.result}</div>
                    <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.62rem', opacity: 0.5 }}>{h.date}</div>
                  </div>
                ) : (
                  <>
                    <div style={{ textAlign: 'center', fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem' }}>{h.score}</div>
                    <div style={{ textAlign: 'center', fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem', color: '#2D9A4E' }}>{h.result}</div>
                    <div style={{ textAlign: 'center', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.7rem', opacity: 0.5 }}>{h.date}</div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Tab: Settings ─────────────────────────────────────── */}
        {tab === 'Settings' && (
          <div style={{ background: paper, border: `3px solid ${ink}`, borderRadius: '2rem 1.8rem 2rem 1.9rem', boxShadow: `8px 8px 0 ${ink}`, padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { label: 'Display Name', value: PLAYER.name, type: 'text' },
              { label: 'Email', value: 'player@xpgazette.com', type: 'email' },
            ].map(f => (
              <div key={f.label}>
                <label style={{ display: 'block', fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px', opacity: 0.7 }}>{f.label}</label>
                <input type={f.type} defaultValue={f.value} style={{
                  width: '100%', padding: '10px 18px',
                  fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.9rem',
                  borderRadius: '9999px', border: `2.5px solid ${ink}`,
                  background: surface, boxShadow: `3px 3px 0 ${ink}`,
                  outline: 'none', boxSizing: 'border-box',
                }}/>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem', letterSpacing: '0.07em', padding: '12px 28px', borderRadius: '9999px', border: `2.5px solid ${ink}`, background: '#FFCD00', color: '#1A0800', boxShadow: `4px 4px 0 ${ink}`, cursor: 'pointer', transition: 'transform 0.1s, box-shadow 0.1s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `6px 6px 0 ${ink}` }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0 ${ink}` }}
              >Save Changes →</button>
              <button onClick={handleSignOut} style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem', letterSpacing: '0.07em', padding: '12px 28px', borderRadius: '9999px', border: `2.5px solid ${ink}`, background: '#E63946', color: 'white', boxShadow: `4px 4px 0 ${ink}`, cursor: 'pointer', transition: 'transform 0.1s, box-shadow 0.1s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `6px 6px 0 ${ink}` }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0 ${ink}` }}
              >🚪 Log Out</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: paper, border: `2.5px solid ${ink}`,
      borderRadius: '1.8rem 1.6rem 1.8rem 1.7rem',
      boxShadow: `6px 6px 0 ${ink}`, overflow: 'hidden',
    }}>
      <div style={{ background: surface, borderBottom: `2px solid ${ink}`, padding: '8px 16px', fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{title}</div>
      {children}
    </div>
  )
}

import React, { useState } from 'react'

const ink     = 'var(--rh-ink)'
const paper   = 'var(--rh-paper)'
const surface = 'var(--rh-surface)'
const card    = 'var(--rh-card)'

// ─── Animated SVG mascot ─────────────────────────────────────
// IMAGE GENERATION PROMPT:
// "1930s rubber hose cartoon style character, a cheerful anthropomorphic coin
//  wearing a tiny top hat, white gloves, big round black eyes with white shine
//  dots, thick black outlines (3-4px), rubbery bendable limbs, dancing pose,
//  cream/yellow color palette, flat 2D illustration, Fleischer Studios aesthetic,
//  transparent background, no shading gradients, bold halftone dots for texture"

function CoinMascotSVG() {
  return (
    <svg viewBox="0 0 120 160" width="120" height="160" xmlns="http://www.w3.org/2000/svg">
      {/* Body — coin */}
      <ellipse cx="60" cy="75" rx="36" ry="38" fill="#FFCD00" stroke="#1A0800" strokeWidth="3.5"/>
      <ellipse cx="60" cy="75" rx="28" ry="30" fill="none" stroke="#1A0800" strokeWidth="2" strokeDasharray="4 3" opacity="0.4"/>
      <text x="60" y="82" textAnchor="middle" fontFamily="'Fredoka One',cursive" fontSize="18" fill="#1A0800">$</text>

      {/* Eyes */}
      <circle cx="48" cy="65" r="7" fill="white" stroke="#1A0800" strokeWidth="2.5"/>
      <circle cx="72" cy="65" r="7" fill="white" stroke="#1A0800" strokeWidth="2.5"/>
      <circle cx="50" cy="64" r="4" fill="#1A0800"/>
      <circle cx="74" cy="64" r="4" fill="#1A0800"/>
      {/* Shine dots */}
      <circle cx="52" cy="62" r="1.5" fill="white"/>
      <circle cx="76" cy="62" r="1.5" fill="white"/>

      {/* Smile */}
      <path d="M49 80 Q60 90 71 80" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>

      {/* Top hat */}
      <rect x="44" y="28" width="32" height="18" rx="3" fill="#1A0800"/>
      <rect x="38" y="44" width="44" height="6" rx="3" fill="#1A0800"/>
      {/* Hat band */}
      <rect x="44" y="38" width="32" height="5" fill="#E63946"/>

      {/* Left arm (rubber hose, animated) */}
      <path d="M24 75 Q10 60 18 48" fill="none" stroke="#FFCD00" strokeWidth="10" strokeLinecap="round"/>
      <path d="M24 75 Q10 60 18 48" fill="none" stroke="#1A0800" strokeWidth="3" strokeLinecap="round" fill="none"/>
      {/* Left glove */}
      <circle cx="18" cy="47" r="8" fill="white" stroke="#1A0800" strokeWidth="2.5"/>

      {/* Right arm */}
      <path d="M96 75 Q110 58 104 46" fill="none" stroke="#FFCD00" strokeWidth="10" strokeLinecap="round"/>
      <path d="M96 75 Q110 58 104 46" fill="none" stroke="#1A0800" strokeWidth="3" strokeLinecap="round"/>
      {/* Right glove — holding a star */}
      <circle cx="104" cy="45" r="8" fill="white" stroke="#1A0800" strokeWidth="2.5"/>
      <text x="104" y="49" textAnchor="middle" fontSize="10">★</text>

      {/* Left leg */}
      <path d="M48 112 Q42 130 36 142" fill="none" stroke="#FFCD00" strokeWidth="10" strokeLinecap="round"/>
      <path d="M48 112 Q42 130 36 142" fill="none" stroke="#1A0800" strokeWidth="3" strokeLinecap="round"/>
      <ellipse cx="34" cy="145" rx="10" ry="5" fill="#1A0800"/>

      {/* Right leg */}
      <path d="M72 112 Q78 130 84 142" fill="none" stroke="#FFCD00" strokeWidth="10" strokeLinecap="round"/>
      <path d="M72 112 Q78 130 84 142" fill="none" stroke="#1A0800" strokeWidth="3" strokeLinecap="round"/>
      <ellipse cx="86" cy="145" rx="10" ry="5" fill="#1A0800"/>

      {/* Body outline over arms/legs */}
      <ellipse cx="60" cy="75" rx="36" ry="38" fill="none" stroke="#1A0800" strokeWidth="3.5"/>

      {/* Animation: float */}
      <animateTransform attributeName="transform" type="translate"
        values="0,0; 0,-6; 0,0" dur="2.8s" repeatCount="indefinite"
        calcMode="spline" keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"/>
    </svg>
  )
}

// ─── XP ring SVG ─────────────────────────────────────────────
function XPRingSVG({ pct }: { pct: number }) {
  const r = 44, circ = 2 * Math.PI * r
  const dash = circ * pct / 100
  return (
    <svg width="110" height="110" viewBox="0 0 110 110">
      <circle cx="55" cy="55" r={r} fill="none" stroke={surface} strokeWidth="10"/>
      <circle cx="55" cy="55" r={r} fill="none" stroke="#FFCD00" strokeWidth="10"
        strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ * 0.25}
        strokeLinecap="round"/>
      <circle cx="55" cy="55" r={r} fill="none" stroke="#1A0800" strokeWidth="3"
        strokeDasharray={`${dash + 1} ${circ - dash - 1}`} strokeDashoffset={circ * 0.25}
        strokeLinecap="round" opacity="0.35"/>
      <text x="55" y="50" textAnchor="middle" fontFamily="'Fredoka One',cursive" fontSize="14" fill="var(--rh-ink)">340</text>
      <text x="55" y="66" textAnchor="middle" fontFamily="'Fredoka Variable',sans-serif" fontWeight="700" fontSize="9" fill="var(--rh-ink)" opacity="0.55">/ 1000 XP</text>
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

const PLAYER = { name: 'Rookie Investor', level: 1, xp: 340, xpMax: 1000, streak: 3,
  badges: ['First Timer', 'Quick Thinker', 'Saver'], totalGames: 12, rank: 142, accuracy: 78 }

const ACTIVITY = [
  { day: 'Mon', done: true }, { day: 'Tue', done: true }, { day: 'Wed', done: true },
  { day: 'Thu', done: false }, { day: 'Fri', done: false }, { day: 'Sat', done: false }, { day: 'Sun', done: false },
]

const HISTORY = [
  { mode: 'Quick Rounds',  result: '+80 XP',  score: '4/5', date: 'Apr 17', accent: '#FFCD00' },
  { mode: 'Decision Room', result: '+150 XP', score: '★★★',  date: 'Apr 16', accent: '#E63946' },
  { mode: 'Quick Rounds',  result: '+60 XP',  score: '3/5', date: 'Apr 15', accent: '#FFCD00' },
  { mode: 'Daily Streak',  result: '+40 XP',  score: '✓',   date: 'Apr 14', accent: '#FF7B25' },
]

const TABS = ['Overview', 'Badges', 'History', 'Settings']

export default function Profile() {
  const [tab, setTab] = useState('Overview')

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--rh-surface)',
      backgroundImage: 'radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px), radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px)',
      backgroundSize: '22px 22px', backgroundPosition: '0 0, 11px 11px',
      padding: '32px 24px 64px',
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

          <div style={{ padding: '0 28px 24px', display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            {/* Avatar — pulled up over banner */}
            <div style={{ flexShrink: 0, marginTop: '-40px', position: 'relative' }}>
              <div style={{
                width: '90px', height: '90px', borderRadius: '50%',
                border: `4px solid ${ink}`, background: '#FFCD00',
                boxShadow: `4px 4px 0 ${ink}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                {/* IMAGE PLACEHOLDER — replace with generated avatar:
                    PROMPT: "1930s rubber hose cartoon portrait of a cheerful
                    investor character, round face, big eyes with white shine
                    dots, tiny top hat, white gloves, yellow skin, thick black
                    outlines, Fleischer Studios style, square crop, no background" */}
                <CoinMascotSVG />
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
              <XPRingSVG pct={(PLAYER.xp / PLAYER.xpMax) * 100} />
              <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5 }}>Progress</span>
            </div>
          </div>
        </div>

        {/* ── Tabs ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: paper, border: `2.5px solid ${ink}`, borderRadius: '9999px', padding: '5px', boxShadow: `4px 4px 0 ${ink}`, width: 'fit-content' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

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
        {tab === 'Badges' && (
          <div style={{ background: paper, border: `3px solid ${ink}`, borderRadius: '2rem 1.8rem 2rem 1.9rem', boxShadow: `8px 8px 0 ${ink}`, padding: '28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
              {[
                { icon: '🏆', label: 'First Quiz',     desc: 'Completed your first round', earned: true,  accent: '#FFCD00' },
                { icon: '⚡', label: 'Speed Reader',    desc: 'Answered in under 5 seconds', earned: true, accent: '#1565C0' },
                { icon: '🎓', label: 'Finance 101',     desc: 'Completed basics course',    earned: true,  accent: '#2D9A4E' },
                { icon: '💰', label: '500 XP Club',     desc: 'Earn 500 XP total',          earned: false, accent: '#FF7B25' },
                { icon: '🔥', label: '7-Day Streak',    desc: 'Log in 7 days straight',     earned: false, accent: '#E63946' },
                { icon: '🌟', label: 'Perfect Round',   desc: 'Score 5/5 on any quiz',      earned: false, accent: '#FFCD00' },
                { icon: '🎯', label: 'Sharpshooter',    desc: '90% accuracy overall',       earned: false, accent: '#7B2D8B' },
                { icon: '📈', label: 'Bull Market',     desc: 'Win 10 games in a row',      earned: false, accent: '#2D9A4E' },
              ].map(b => (
                <div key={b.label} style={{
                  border: `2.5px solid ${ink}`,
                  borderRadius: '1.4rem 1.6rem 1.4rem 1.5rem',
                  background: b.earned ? b.accent : surface,
                  boxShadow: `4px 4px 0 ${ink}`,
                  padding: '16px', textAlign: 'center',
                  opacity: b.earned ? 1 : 0.45,
                  transition: 'transform 0.12s, box-shadow 0.12s',
                  cursor: 'default',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `6px 6px 0 ${ink}` }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0 ${ink}` }}
                >
                  <div style={{ fontSize: '2.4rem', marginBottom: '6px' }}>{b.earned ? b.icon : '🔒'}</div>
                  <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem', marginBottom: '4px', color: '#1A0800' }}>{b.label}</div>
                  <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.64rem', opacity: 0.65, color: '#1A0800', lineHeight: 1.4 }}>{b.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: History ──────────────────────────────────────── */}
        {tab === 'History' && (
          <div style={{ background: paper, border: `3px solid ${ink}`, borderRadius: '2rem 1.8rem 2rem 1.9rem', boxShadow: `8px 8px 0 ${ink}`, overflow: 'hidden' }}>
            <div style={{ background: surface, borderBottom: `2px solid ${ink}`, padding: '10px 20px', fontFamily: "'Fredoka One', cursive", fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: '8px', opacity: 0.65 }}>
              <span>Game</span><span style={{ textAlign: 'center' }}>Score</span><span style={{ textAlign: 'center' }}>XP</span><span style={{ textAlign: 'center' }}>Date</span>
            </div>
            {[...HISTORY, ...HISTORY].map((h, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px', gap: '8px',
                padding: '12px 20px', alignItems: 'center',
                borderBottom: `1.5px solid color-mix(in srgb, ${ink} 12%, transparent)`,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = surface)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: h.accent, border: `2px solid ${ink}`, flexShrink: 0 }}/>
                  <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem' }}>{h.mode}</span>
                </div>
                <div style={{ textAlign: 'center', fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem' }}>{h.score}</div>
                <div style={{ textAlign: 'center', fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem', color: '#2D9A4E' }}>{h.result}</div>
                <div style={{ textAlign: 'center', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.7rem', opacity: 0.5 }}>{h.date}</div>
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
            <button style={{
              fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem', letterSpacing: '0.07em',
              padding: '12px 28px', borderRadius: '9999px',
              border: `2.5px solid ${ink}`, background: '#FFCD00', color: '#1A0800',
              boxShadow: `4px 4px 0 ${ink}`, cursor: 'pointer', alignSelf: 'flex-start',
              transition: 'transform 0.1s, box-shadow 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `6px 6px 0 ${ink}` }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0 ${ink}` }}
            >Save Changes →</button>
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

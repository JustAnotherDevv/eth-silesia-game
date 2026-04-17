import React, { useState } from 'react'

const ink     = 'var(--rh-ink)'
const paper   = 'var(--rh-paper)'
const surface = 'var(--rh-surface)'

// ─── Podium SVG (animated) ────────────────────────────────────
// IMAGE GENERATION PROMPT:
// "1930s rubber hose cartoon style victory podium, three platforms labeled
//  1st 2nd 3rd, three cartoon characters standing on each platform celebrating,
//  characters have rubbery limbs, big round eyes, white gloves, top hats,
//  confetti and stars flying around, thick black outlines 3-4px,
//  Fleischer Studios style, warm cream background, flat 2D, no gradients,
//  bold colors: gold/yellow for 1st, silver/blue for 2nd, bronze/orange for 3rd"
function PodiumSVG() {
  return (
    <svg viewBox="0 0 280 130" width="100%" height="130" xmlns="http://www.w3.org/2000/svg">
      {/* Confetti */}
      {[
        {x:20,y:15,r:4,c:'#E63946',rx:4,ry:2,rot:30}, {x:50,y:8,r:3,c:'#FFCD00',rx:3,ry:1.5,rot:-20},
        {x:230,y:10,r:4,c:'#1565C0',rx:4,ry:2,rot:15}, {x:255,y:20,r:3,c:'#2D9A4E',rx:3,ry:1.5,rot:-35},
        {x:140,y:5,r:3,c:'#FF7B25',rx:3,ry:1.5,rot:45}, {x:80,y:18,r:4,c:'#7B2D8B',rx:4,ry:2,rot:-10},
        {x:200,y:16,r:3,c:'#FFCD00',rx:3,ry:1.5,rot:25},
      ].map((c,i) => (
        <g key={i}>
          <ellipse cx={c.x} cy={c.y} rx={c.rx} ry={c.ry} fill={c.c} stroke="#1A0800" strokeWidth="1" transform={`rotate(${c.rot} ${c.x} ${c.y})`}>
            <animateTransform attributeName="transform" type="translate" values="0,0;0,3;0,0" dur={`${1.5+i*0.3}s`} repeatCount="indefinite" additive="sum"/>
          </ellipse>
        </g>
      ))}

      {/* Stars */}
      {[{x:35,y:30},{x:250,y:28},{x:140,y:12}].map((s,i) => (
        <text key={i} x={s.x} y={s.y} textAnchor="middle" fontSize="14" fill="#FFCD00" stroke="#1A0800" strokeWidth="0.8">
          ★
          <animateTransform attributeName="transform" type="rotate" values={`0 ${s.x} ${s.y};15 ${s.x} ${s.y};-15 ${s.x} ${s.y};0 ${s.x} ${s.y}`} dur={`${2+i*0.5}s`} repeatCount="indefinite"/>
        </text>
      ))}

      {/* 2nd place podium (left) */}
      <rect x="30" y="78" width="64" height="44" rx="4" fill="#C0C8E0" stroke="#1A0800" strokeWidth="2.5"/>
      <rect x="30" y="78" width="64" height="10" rx="4" fill="#E0E8F8" stroke="#1A0800" strokeWidth="0"/>
      <text x="62" y="106" textAnchor="middle" fontFamily="'Fredoka One',cursive" fontSize="22" fill="#1A0800">2</text>
      {/* 2nd character */}
      <circle cx="62" cy="54" r="16" fill="#C0C8E0" stroke="#1A0800" strokeWidth="2.5"/>
      <circle cx="56" cy="50" r="3.5" fill="#1A0800"/><circle cx="68" cy="50" r="3.5" fill="#1A0800"/>
      <circle cx="57" cy="49" r="1.2" fill="white"/><circle cx="69" cy="49" r="1.2" fill="white"/>
      <path d="M56 60 Q62 65 68 60" fill="none" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>
      <rect x="54" y="34" width="16" height="10" rx="2" fill="#1A0800"/>
      <rect x="50" y="43" width="24" height="4" rx="2" fill="#1A0800"/>
      <path d="M46 64 Q38 56 44 48" fill="none" stroke="#C0C8E0" strokeWidth="7" strokeLinecap="round"/>
      <path d="M46 64 Q38 56 44 48" fill="none" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>
      <path d="M78 64 Q86 56 80 48" fill="none" stroke="#C0C8E0" strokeWidth="7" strokeLinecap="round"/>
      <path d="M78 64 Q86 56 80 48" fill="none" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>

      {/* 1st place podium (center, tallest) */}
      <rect x="108" y="60" width="64" height="62" rx="4" fill="#FFCD00" stroke="#1A0800" strokeWidth="2.5"/>
      <rect x="108" y="60" width="64" height="12" rx="4" fill="#FFE066" stroke="#1A0800" strokeWidth="0"/>
      <text x="140" y="98" textAnchor="middle" fontFamily="'Fredoka One',cursive" fontSize="28" fill="#1A0800">1</text>
      {/* Crown above 1st */}
      <path d="M124 33 L130 24 L140 30 L150 24 L156 33 L124 33Z" fill="#FFCD00" stroke="#1A0800" strokeWidth="2.5"/>
      <circle cx="130" cy="24" r="3" fill="#E63946" stroke="#1A0800" strokeWidth="1.5"/>
      <circle cx="140" cy="30" r="3.5" fill="#E63946" stroke="#1A0800" strokeWidth="1.5"/>
      <circle cx="150" cy="24" r="3" fill="#E63946" stroke="#1A0800" strokeWidth="1.5"/>
      {/* 1st character */}
      <circle cx="140" cy="46" r="18" fill="#FFCD00" stroke="#1A0800" strokeWidth="2.5"/>
      <circle cx="133" cy="42" r="4" fill="#1A0800"/><circle cx="147" cy="42" r="4" fill="#1A0800"/>
      <circle cx="134.5" cy="40.5" r="1.5" fill="white"/><circle cx="148.5" cy="40.5" r="1.5" fill="white"/>
      <path d="M133 54 Q140 60 147 54" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M122 50 Q112 40 120 32" fill="none" stroke="#FFCD00" strokeWidth="8" strokeLinecap="round"/>
      <path d="M122 50 Q112 40 120 32" fill="none" stroke="#1A0800" strokeWidth="2.2" strokeLinecap="round"/>
      <path d="M158 50 Q168 40 160 32" fill="none" stroke="#FFCD00" strokeWidth="8" strokeLinecap="round"/>
      <path d="M158 50 Q168 40 160 32" fill="none" stroke="#1A0800" strokeWidth="2.2" strokeLinecap="round"/>
      {/* Animated bounce on 1st */}
      <animateTransform attributeName="transform" type="translate" values="0,0;0,-4;0,0" dur="2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>

      {/* 3rd place podium (right) */}
      <rect x="186" y="90" width="64" height="32" rx="4" fill="#E8A870" stroke="#1A0800" strokeWidth="2.5"/>
      <rect x="186" y="90" width="64" height="10" rx="4" fill="#F4BF90" stroke="#1A0800" strokeWidth="0"/>
      <text x="218" y="113" textAnchor="middle" fontFamily="'Fredoka One',cursive" fontSize="18" fill="#1A0800">3</text>
      {/* 3rd character */}
      <circle cx="218" cy="66" r="15" fill="#E8A870" stroke="#1A0800" strokeWidth="2.5"/>
      <circle cx="212" cy="62" r="3.5" fill="#1A0800"/><circle cx="224" cy="62" r="3.5" fill="#1A0800"/>
      <circle cx="213" cy="61" r="1.2" fill="white"/><circle cx="225" cy="61" r="1.2" fill="white"/>
      <path d="M212 72 Q218 77 224 72" fill="none" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>
      <rect x="210" y="47" width="16" height="9" rx="2" fill="#1A0800"/>
      <rect x="206" y="55" width="24" height="4" rx="2" fill="#1A0800"/>
      <path d="M203 72 Q195 64 201 56" fill="none" stroke="#E8A870" strokeWidth="7" strokeLinecap="round"/>
      <path d="M203 72 Q195 64 201 56" fill="none" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>
      <path d="M233 72 Q241 64 235 56" fill="none" stroke="#E8A870" strokeWidth="7" strokeLinecap="round"/>
      <path d="M233 72 Q241 64 235 56" fill="none" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// ─── Sparkle SVG for rank changes ────────────────────────────
function UpArrowSVG() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path d="M8 2 L13 10 L3 10 Z" fill="#2D9A4E" stroke="#1A0800" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  )
}
function DownArrowSVG() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path d="M8 14 L13 6 L3 6 Z" fill="#E63946" stroke="#1A0800" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── Animated trophy SVG for header ──────────────────────────
function TrophySVG() {
  return (
    <svg viewBox="0 0 80 90" width="80" height="90" xmlns="http://www.w3.org/2000/svg">
      <path d="M40 78 Q20 62 22 40 Q26 20 40 18 Q54 20 58 40 Q60 62 40 78Z"
        fill="#FFCD00" stroke="#1A0800" strokeWidth="3"/>
      {/* Handles */}
      <path d="M22 38 Q8 30 14 48 Q18 58 22 55" fill="none" stroke="#1A0800" strokeWidth="3" strokeLinecap="round"/>
      <path d="M58 38 Q72 30 66 48 Q62 58 58 55" fill="none" stroke="#1A0800" strokeWidth="3" strokeLinecap="round"/>
      {/* Base */}
      <rect x="28" y="78" width="24" height="6" rx="2" fill="#FFCD00" stroke="#1A0800" strokeWidth="2.5"/>
      <rect x="22" y="84" width="36" height="6" rx="3" fill="#E8A870" stroke="#1A0800" strokeWidth="2.5"/>
      {/* Star */}
      <text x="40" y="56" textAnchor="middle" fontSize="22" fill="#1A0800">★</text>
      {/* Shine lines */}
      <line x1="50" y1="28" x2="56" y2="22" stroke="#1A0800" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <line x1="55" y1="35" x2="63" y2="32" stroke="#1A0800" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <animateTransform attributeName="transform" type="rotate" values="-3 40 50;3 40 50;-3 40 50" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
    </svg>
  )
}

const PLAYERS = [
  { rank: 1,  name: 'Compound Carl',    xp: 9840, streak: 42, badges: 18, change: 0,  avatar: '🎩', level: 'Legend',  accent: '#FFCD00' },
  { rank: 2,  name: 'Budget Barbara',   xp: 8720, streak: 31, badges: 14, change: +1, avatar: '👑', level: 'Expert',  accent: '#C0C8E0' },
  { rank: 3,  name: 'Interest Igor',    xp: 7655, streak: 28, badges: 12, change: -1, avatar: '🎯', level: 'Expert',  accent: '#E8A870' },
  { rank: 4,  name: 'Savings Sam',      xp: 6420, streak: 19, badges: 10, change: +2, avatar: '🌟', level: 'Pro',     accent: '#FF7B25' },
  { rank: 5,  name: 'Dividend Dana',    xp: 5910, streak: 15, badges: 9,  change: 0,  avatar: '💎', level: 'Pro',     accent: '#1565C0' },
  { rank: 6,  name: 'ETF Eddie',        xp: 5240, streak: 12, badges: 8,  change: +3, avatar: '📈', level: 'Pro',     accent: '#2D9A4E' },
  { rank: 7,  name: 'Index Ivan',       xp: 4680, streak: 10, badges: 7,  change: -2, avatar: '🔮', level: 'Pro',     accent: '#7B2D8B' },
  { rank: 8,  name: 'Rookie Investor',  xp: 340,  streak: 3,  badges: 3,  change: +4, avatar: '🎩', level: 'Rookie',  accent: '#E63946', isYou: true },
]

const CATEGORIES = ['All Time', 'This Week', 'This Month']

export default function Leaderboard() {
  const [cat, setCat] = useState('All Time')

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--rh-surface)',
      backgroundImage: 'radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px), radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px)',
      backgroundSize: '22px 22px', backgroundPosition: '0 0, 11px 11px',
      padding: '32px 24px 64px',
    }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        {/* ── Header card ──────────────────────────────────────── */}
        <div style={{
          background: paper, border: `3px solid ${ink}`,
          borderRadius: '2.2rem 2rem 2.2rem 2.1rem',
          boxShadow: `8px 8px 0 ${ink}`,
          overflow: 'hidden', marginBottom: '24px',
          transform: 'rotate(0.2deg)',
        }}>
          {/* Carnival banner */}
          <div style={{
            backgroundImage: 'repeating-linear-gradient(-45deg, #E63946 0px, #E63946 14px, #1A0800 14px, #1A0800 28px)',
            borderBottom: `3px solid ${ink}`, padding: '10px 24px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <span style={{
              background: '#FFCD00', color: '#1A0800',
              fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem',
              letterSpacing: '0.2em', padding: '4px 14px',
              borderRadius: '9999px', border: `2.5px solid ${ink}`,
              boxShadow: `3px 3px 0 ${ink}`,
            }}>★ HALL OF FAME ★</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', padding: '24px 28px' }}>
            <div>
              <h1 style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                lineHeight: 1, marginBottom: '8px',
                textShadow: `4px 4px 0 ${ink}`,
              }}>The Leaderboard</h1>
              <p style={{
                fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600,
                fontSize: '0.85rem', opacity: 0.6, lineHeight: 1.5,
              }}>
                Top financial minds ranked by XP. Who'll claim the golden top hat?
              </p>
              <div style={{ display: 'flex', gap: '6px', marginTop: '16px' }}>
                {[
                  { label: '🏆 Players', value: '2,847' },
                  { label: '⚡ Active Today', value: '341' },
                  { label: '🔥 Longest Streak', value: '42 days' },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: '5px 14px', borderRadius: '9999px',
                    border: `2px solid ${ink}`, background: surface,
                    boxShadow: `2px 2px 0 ${ink}`,
                    fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.68rem',
                  }}>{s.label}: <strong>{s.value}</strong></div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrophySVG />
            </div>
          </div>

          {/* Podium SVG */}
          <div style={{ padding: '0 24px 24px', borderTop: `1.5px solid color-mix(in srgb, ${ink} 15%, transparent)`, paddingTop: '16px' }}>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.45, marginBottom: '8px', textAlign: 'center' }}>★ Top 3 This Week ★</div>
            <PodiumSVG />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '8px' }}>
              {[PLAYERS[1], PLAYERS[0], PLAYERS[2]].map((p, i) => (
                <div key={p.rank} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.75rem' }}>{p.name}</div>
                  <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.62rem', opacity: 0.55 }}>{p.xp.toLocaleString()} XP</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Category filter ───────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: paper, border: `2.5px solid ${ink}`, borderRadius: '9999px', padding: '5px', boxShadow: `4px 4px 0 ${ink}`, width: 'fit-content' }}>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem',
              letterSpacing: '0.07em', padding: '7px 20px',
              borderRadius: '9999px', border: 'none',
              background: cat === c ? ink : 'transparent',
              color: cat === c ? paper : ink,
              cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: cat === c ? `2px 2px 0 color-mix(in srgb, ${ink} 35%, transparent)` : 'none',
            }}>{c}</button>
          ))}
        </div>

        {/* ── Leaderboard table ─────────────────────────────────── */}
        <div style={{
          background: paper, border: `3px solid ${ink}`,
          borderRadius: '2rem 1.8rem 2rem 1.9rem',
          boxShadow: `8px 8px 0 ${ink}`,
          overflow: 'hidden',
        }}>
          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '52px 1fr 100px 80px 80px 60px',
            gap: '8px', padding: '10px 20px',
            background: surface, borderBottom: `2px solid ${ink}`,
            fontFamily: "'Fredoka One', cursive", fontSize: '0.58rem',
            letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.65,
          }}>
            <span>#</span><span>Player</span>
            <span style={{ textAlign: 'right' }}>XP</span>
            <span style={{ textAlign: 'center' }}>Streak</span>
            <span style={{ textAlign: 'center' }}>Badges</span>
            <span style={{ textAlign: 'center' }}>±</span>
          </div>

          {PLAYERS.map((p, i) => (
            <div key={p.rank} style={{
              display: 'grid', gridTemplateColumns: '52px 1fr 100px 80px 80px 60px',
              gap: '8px', padding: '12px 20px', alignItems: 'center',
              borderBottom: i < PLAYERS.length-1 ? `1.5px solid color-mix(in srgb, ${ink} 12%, transparent)` : 'none',
              background: p.isYou ? `color-mix(in srgb, #FFCD00 18%, ${paper})` : 'transparent',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => { if (!p.isYou) e.currentTarget.style.background = surface }}
            onMouseLeave={e => { e.currentTarget.style.background = p.isYou ? `color-mix(in srgb, #FFCD00 18%, ${paper})` : 'transparent' }}
            >
              {/* Rank */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {p.rank <= 3 ? (
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: p.rank === 1 ? '#FFCD00' : p.rank === 2 ? '#C0C8E0' : '#E8A870',
                    border: `2.5px solid ${ink}`, boxShadow: `2px 2px 0 ${ink}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Fredoka One', cursive", fontSize: '0.9rem', color: '#1A0800',
                  }}>{p.rank}</div>
                ) : (
                  <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem', opacity: 0.6 }}>{p.rank}</span>
                )}
              </div>

              {/* Player info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: p.accent, border: `2.5px solid ${ink}`,
                  boxShadow: `2px 2px 0 ${ink}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.2rem', flexShrink: 0,
                }}>{p.avatar}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.88rem' }}>{p.name}</span>
                    {p.isYou && <span style={{ background: '#E63946', color: '#FEF9EE', fontFamily: "'Fredoka One', cursive", fontSize: '0.5rem', letterSpacing: '0.1em', padding: '1px 7px', borderRadius: '9999px', border: `1.5px solid ${ink}` }}>YOU</span>}
                  </div>
                  <span style={{
                    fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700,
                    fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                    opacity: 0.45,
                  }}>{p.level}</span>
                </div>
              </div>

              {/* XP */}
              <div style={{ textAlign: 'right', fontFamily: "'Fredoka One', cursive", fontSize: '0.88rem' }}>
                {p.xp.toLocaleString()}
                <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.6rem', opacity: 0.5, marginLeft: '3px' }}>xp</span>
              </div>

              {/* Streak */}
              <div style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <span style={{ fontSize: '0.9rem' }}>🔥</span>
                <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem' }}>{p.streak}</span>
              </div>

              {/* Badges */}
              <div style={{ textAlign: 'center', fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem' }}>
                {p.badges} <span style={{ opacity: 0.4, fontSize: '0.65rem' }}>🏆</span>
              </div>

              {/* Change */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                {p.change > 0 && <><UpArrowSVG /><span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem', color: '#2D9A4E' }}>{p.change}</span></>}
                {p.change < 0 && <><DownArrowSVG /><span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem', color: '#E63946' }}>{Math.abs(p.change)}</span></>}
                {p.change === 0 && <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem', opacity: 0.3 }}>—</span>}
              </div>
            </div>
          ))}
        </div>

        {/* ── Your position callout ─────────────────────────────── */}
        <div style={{
          marginTop: '20px',
          background: paper, border: `2.5px solid ${ink}`,
          borderRadius: '1.8rem 1.6rem 1.8rem 1.7rem',
          boxShadow: `5px 5px 0 ${ink}`,
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ fontSize: '2rem' }} className="rh-animate-float">🎯</div>
            <div>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1rem' }}>You're ranked #142 globally!</div>
              <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.72rem', opacity: 0.55 }}>Play 3 more games to enter the Top 100 🚀</div>
            </div>
          </div>
          <a href="/quiz" style={{
            fontFamily: "'Fredoka One', cursive", fontSize: '0.78rem', letterSpacing: '0.07em',
            padding: '10px 22px', borderRadius: '9999px',
            border: `2.5px solid ${ink}`, background: '#FFCD00', color: '#1A0800',
            boxShadow: `3px 3px 0 ${ink}`, textDecoration: 'none',
            transition: 'transform 0.1s, box-shadow 0.1s', whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `5px 5px 0 ${ink}` }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `3px 3px 0 ${ink}` }}
          >Play Now →</a>
        </div>

      </div>
    </div>
  )
}

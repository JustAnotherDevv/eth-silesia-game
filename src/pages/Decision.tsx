import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { submitGame } from '../lib/api'
import { getSession } from '../lib/session'
import { useIsMobile } from '../lib/responsive'
import { play, preload } from '../lib/sounds'

const ink     = 'var(--rh-ink)'
const paper   = 'var(--rh-paper)'
const surface = 'var(--rh-surface)'

// ─── Types ────────────────────────────────────────────────────

type Outcome = 'brilliant' | 'smart' | 'neutral' | 'poor' | 'disaster'
type Phase   = 'intro' | 'briefing' | 'choosing' | 'consequence' | 'verdict'

type Choice = {
  letter:   'A' | 'B' | 'C' | 'D'
  label:    string
  desc:     string
  accent:   string
  icon:     string
  outcome:  Outcome
  xp:       number
  headline: string
  lesson:   string
  snap:     string
  timeline: { label: string; value: string; good: boolean }[]
}

type Scenario = {
  id:       number
  category: string
  title:    string
  story:    string
  choices:  [Choice, Choice, Choice, Choice]
}

// ─── Scenario data ────────────────────────────────────────────

const SCENARIOS: Scenario[] = [
  {
    id: 1,
    category: 'WINDFALL',
    title: 'The Inheritance',
    story: `Your great-aunt Władysława — known for legendary frugality — has left you 15,000 PLN. Your car loan sits at 8,000 PLN with a 12% annual interest rate, and a friend is evangelising index ETFs averaging 7–10% annual returns.\n\nYou have 30 days to decide.`,
    choices: [
      {
        letter: 'A', label: 'Invest Everything',
        desc: 'Put all 15,000 PLN into a diversified index ETF immediately.',
        accent: '#1565C0', icon: '📈', outcome: 'smart', xp: 180,
        headline: 'INVESTOR PLAYS THE LONG GAME — MARKET REWARDS PATIENCE',
        lesson: 'Investing in index ETFs is smart — but only after eliminating high-interest debt. Paying 12% APR while earning 7–10% is a net loss every year.',
        snap: 'Your investment grows steadily. But that 12% car loan quietly drains ~960 PLN in interest annually — money your ETF could have recouped instantly.',
        timeline: [
          { label: 'Month 6', value: '15,525 PLN',  good: true  },
          { label: 'Year 1',  value: '16,200 PLN',  good: true  },
          { label: 'Year 5',  value: '21,400 PLN',  good: true  },
        ],
      },
      {
        letter: 'B', label: 'Kill the Debt. Then Invest.',
        desc: 'Pay off the 8,000 PLN loan first. Invest the remaining 7,000 PLN.',
        accent: '#2D9A4E', icon: '🎯', outcome: 'brilliant', xp: 320,
        headline: 'FINANCIAL GENIUS: LOCAL INVESTOR ELIMINATES 12% DEBT BEFORE INVESTING',
        lesson: 'A guaranteed 12% return (by eliminating debt) beats a probable 7–10% return. Zero debt + growing investment = the mathematically dominant move.',
        snap: 'You lock in a guaranteed 12% "return" by erasing the loan, then compound the rest. No anchor, only tailwind.',
        timeline: [
          { label: 'Month 1', value: '0 PLN debt ✓',  good: true },
          { label: 'Year 1',  value: '7,490 PLN',      good: true },
          { label: 'Year 5',  value: '10,100 PLN',     good: true },
        ],
      },
      {
        letter: 'C', label: 'Treat Yourself',
        desc: 'New laptop, a trip to Italy, and park 5,000 PLN in a savings account.',
        accent: '#E63946', icon: '✈️', outcome: 'poor', xp: 40,
        headline: 'LIFESTYLE INFLATION STRIKES AGAIN: LOCAL INHERITOR SPENDS WINDFALL',
        lesson: '"Lifestyle creep" is the silent wealth killer. One-time windfalls spent on depreciating assets leave no lasting financial advantage.',
        snap: 'The laptop loses 40% value in year one. The trip is a memory. The 5,000 at 1.5% barely outpaces inflation — while the car loan drains on.',
        timeline: [
          { label: 'Month 1', value: '5,075 PLN',  good: false },
          { label: 'Year 1',  value: '4,850 PLN',  good: false },
          { label: 'Year 5',  value: '3,900 PLN',  good: false },
        ],
      },
      {
        letter: 'D', label: 'Play It Ultra-Safe',
        desc: 'Deposit all 15,000 PLN in a savings account at 1.5% APR.',
        accent: '#FF7B25', icon: '🏦', outcome: 'neutral', xp: 90,
        headline: 'CAUTIOUS INVESTOR PRESERVES CAPITAL, QUIETLY LOSES TO INFLATION',
        lesson: 'A savings account at 1.5% with 5% inflation means you\'re losing purchasing power every year. Capital "preservation" isn\'t wealth building.',
        snap: 'Safe? Yes. But with inflation at 5%, your 15,000 PLN buys less each year. Meanwhile, the car loan interest compounds silently against you.',
        timeline: [
          { label: 'Month 6', value: '15,112 PLN', good: false },
          { label: 'Year 1',  value: '15,225 PLN', good: false },
          { label: 'Year 5',  value: '16,150 PLN', good: false },
        ],
      },
    ] as [Choice, Choice, Choice, Choice],
  },
  {
    id: 2,
    category: 'TEMPTATION',
    title: 'The Crypto Oracle',
    story: `Your colleague Marek — who just bought a Tesla — approaches you with an "exclusive opportunity". His friend's crypto fund guarantees 20% monthly returns. Minimum: 5,000 PLN. You have 20,000 PLN in savings.\n\n"I've already made 40% in two months," Marek whispers. "Spots are closing fast."`,
    choices: [
      {
        letter: 'A', label: 'Go All In',
        desc: 'Invest all 20,000 PLN — 20% monthly is life-changing.',
        accent: '#E63946', icon: '💸', outcome: 'disaster', xp: 0,
        headline: 'TRAGEDY: INVESTOR LOSES ENTIRE SAVINGS TO PONZI SCHEME',
        lesson: '"Guaranteed returns" don\'t exist in legitimate finance. No verified fund has ever sustainably returned 20% monthly. This is a textbook Ponzi.',
        snap: 'The "fund" pays out for 2 months using new investor money. Month 3: Marek stops answering. Website goes offline. 20,000 PLN: gone.',
        timeline: [
          { label: 'Month 2', value: '24,000 (paper)',   good: false },
          { label: 'Month 3', value: '0 PLN',             good: false },
          { label: 'Year 1',  value: '-20,000 PLN lost',  good: false },
        ],
      },
      {
        letter: 'B', label: 'Test With a Small Bet',
        desc: 'Try just 2,000 PLN first — if it works, go bigger.',
        accent: '#FF7B25', icon: '🎰', outcome: 'poor', xp: 60,
        headline: '"JUST TESTING" BURNS LOCAL INVESTOR — PONZI COLLAPSES ON SCHEDULE',
        lesson: 'A Ponzi scheme doesn\'t become safe with a smaller bet. Any money in a fraud is money lost — but you avoided complete catastrophe.',
        snap: 'Your 400 PLN "return" in month 1 was designed to build confidence. The scheme collapses in month 3. You lose 2,000 — but saved 18,000 by hesitating.',
        timeline: [
          { label: 'Month 1', value: '2,400 (fake)',  good: false },
          { label: 'Month 3', value: '0 PLN',          good: false },
          { label: 'Year 1',  value: '-2,000 PLN lost', good: false },
        ],
      },
      {
        letter: 'C', label: 'Walk Away',
        desc: 'Politely decline. Something about this doesn\'t add up.',
        accent: '#1565C0', icon: '🛡️', outcome: 'smart', xp: 200,
        headline: 'SMART INVESTOR DODGES PONZI: "MY GUT SAID NO"',
        lesson: 'Red flags you spotted: guaranteed returns, artificial urgency, exclusivity claims, single-source social proof. All classic Ponzi hallmarks.',
        snap: 'You walk away. Three months later the scheme collapses. Marek loses 50,000 PLN. Your 20,000 sits safe — and keeps quietly compounding.',
        timeline: [
          { label: 'Month 1', value: '20,000 ✓',        good: true },
          { label: 'Month 3', value: 'Scheme collapses', good: true },
          { label: 'Year 1',  value: '21,400 PLN',       good: true },
        ],
      },
      {
        letter: 'D', label: 'Decline + Report It',
        desc: 'Turn it down AND report the scheme to UOKiK.',
        accent: '#2D9A4E', icon: '⚖️', outcome: 'brilliant', xp: 350,
        headline: 'FINANCIAL HERO: LOCAL INVESTOR EXPOSES PONZI, SAVES 23 VICTIMS',
        lesson: 'Reporting financial fraud to Poland\'s UOKiK stops others from losing everything. Civic duty pays — in this case, 350 XP and a clear conscience.',
        snap: 'Your report triggers an investigation. The scheme shuts before fully collapsing. 23 other investors are protected. You\'re cited in the arrest report.',
        timeline: [
          { label: 'Month 1', value: '20,000 ✓',       good: true },
          { label: 'Month 2', value: 'Scheme shut down', good: true },
          { label: 'Year 1',  value: '21,400 + hero 🦸', good: true },
        ],
      },
    ] as [Choice, Choice, Choice, Choice],
  },
]

// ─── Oracle character SVG ─────────────────────────────────────
// IMAGE GENERATION PROMPT:
// "1930s rubber hose cartoon villain/oracle character, mysterious financier
//  wearing a tall top hat with gold band and red feather, monocle over one
//  eye, knowing sinister smirk with one eyebrow raised, white gloves, dark
//  suit with cape, pointing finger at viewer, rubbery bendable limbs,
//  Fleischer Studios style, thick black outlines, cream skin tone,
//  transparent background, flat 2D, no gradients"

function OracleSVG() {
  return (
    <svg viewBox="0 0 160 230" width="160" height="230" xmlns="http://www.w3.org/2000/svg">
      <g>
        {/* Cape */}
        <path d="M42 100 Q12 145 24 200 L80 188 L136 200 Q148 145 118 100"
          fill="#1A0800" stroke="#1A0800" strokeWidth="1.5"/>
        {/* Body/suit */}
        <ellipse cx="80" cy="138" rx="34" ry="46" fill="#2A1208" stroke="#1A0800" strokeWidth="3"/>
        {/* Lapels / pocket square */}
        <path d="M46 112 Q62 126 80 120 Q98 126 114 112" fill="#FFCD00" stroke="#1A0800" strokeWidth="2"/>
        <rect x="74" y="108" width="12" height="10" rx="2" fill="#FFCD00" stroke="#1A0800" strokeWidth="1.5"/>
        {/* Head */}
        <circle cx="80" cy="72" r="32" fill="#FEF3C7" stroke="#1A0800" strokeWidth="3.5"/>
        {/* Left eye — normal */}
        <circle cx="67" cy="67" r="9" fill="white" stroke="#1A0800" strokeWidth="2.5"/>
        <circle cx="69" cy="66" r="5.5" fill="#1A0800"/>
        <circle cx="71" cy="64" r="2" fill="white"/>
        {/* Right eye — monocle */}
        <circle cx="93" cy="67" r="9" fill="white" stroke="#1A0800" strokeWidth="2.5"/>
        <circle cx="95" cy="66" r="5.5" fill="#1A0800"/>
        <circle cx="97" cy="64" r="2" fill="white"/>
        {/* Monocle ring */}
        <circle cx="93" cy="67" r="12" fill="none" stroke="#FFCD00" strokeWidth="2.5"/>
        <line x1="93" y1="55" x2="91" y2="43" stroke="#FFCD00" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="91" cy="42" r="3" fill="#FFCD00" stroke="#1A0800" strokeWidth="1.5"/>
        {/* Raised left eyebrow */}
        <path d="M58 58 Q66 52 75 57" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Flat right eyebrow */}
        <path d="M84 56 Q92 49 103 55" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Knowing smirk */}
        <path d="M66 83 Q76 94 90 86" fill="none" stroke="#1A0800" strokeWidth="3" strokeLinecap="round"/>
        <path d="M90 86 Q93 85 93 83" fill="none" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>
        {/* Top hat */}
        <rect x="50" y="22" width="60" height="38" rx="5" fill="#1A0800"/>
        <rect x="40" y="58" width="80" height="9" rx="5" fill="#1A0800"/>
        {/* Hat band */}
        <rect x="50" y="50" width="60" height="9" fill="#FFCD00"/>
        {/* Feather */}
        <path d="M110 22 Q126 4 132 16 Q122 9 112 20" fill="#E63946" stroke="#1A0800" strokeWidth="1.5"/>
        {/* Left arm — pointing at viewer */}
        <path d="M46 115 Q18 100 20 84" fill="none" stroke="#2A1208" strokeWidth="14" strokeLinecap="round"/>
        <path d="M46 115 Q18 100 20 84" fill="none" stroke="#1A0800" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="20" cy="82" r="11" fill="white" stroke="#1A0800" strokeWidth="2.5"/>
        {/* Pointing finger */}
        <path d="M8 74 L20 82" stroke="white" strokeWidth="5" strokeLinecap="round"/>
        <path d="M8 74 L20 82" stroke="#1A0800" strokeWidth="1.5" strokeLinecap="round"/>
        {/* Right arm — holding cane */}
        <path d="M114 115 Q142 100 140 84" fill="none" stroke="#2A1208" strokeWidth="14" strokeLinecap="round"/>
        <path d="M114 115 Q142 100 140 84" fill="none" stroke="#1A0800" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="140" cy="82" r="11" fill="white" stroke="#1A0800" strokeWidth="2.5"/>
        {/* Cane */}
        <line x1="150" y1="82" x2="156" y2="190" stroke="#7A4E2D" strokeWidth="5" strokeLinecap="round"/>
        <line x1="150" y1="82" x2="156" y2="190" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>
        <path d="M148 82 Q145 72 150 82" fill="#7A4E2D" stroke="#1A0800" strokeWidth="1.5" strokeLinecap="round"/>
        <ellipse cx="157" cy="192" rx="8" ry="4" fill="#7A4E2D" stroke="#1A0800" strokeWidth="2"/>
        {/* Legs */}
        <path d="M58 178 Q50 200 42 218" fill="none" stroke="#1A0800" strokeWidth="14" strokeLinecap="round"/>
        <ellipse cx="40" cy="220" rx="12" ry="6" fill="#1A0800"/>
        <path d="M102 178 Q110 200 118 218" fill="none" stroke="#1A0800" strokeWidth="14" strokeLinecap="round"/>
        <ellipse cx="120" cy="220" rx="12" ry="6" fill="#1A0800"/>
        {/* Body outline over arms */}
        <ellipse cx="80" cy="138" rx="34" ry="46" fill="none" stroke="#1A0800" strokeWidth="3"/>
        {/* Float animation */}
        <animateTransform attributeName="transform" type="translate"
          values="0,0;0,-9;0,0" dur="3.2s" repeatCount="indefinite"
          calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1"/>
      </g>
    </svg>
  )
}

// ─── Outcome consequence SVGs ─────────────────────────────────

function BrilliantSVG({ xp }: { xp: number }) {
  return (
    <svg viewBox="0 0 260 220" width="260" height="220" xmlns="http://www.w3.org/2000/svg">
      {/* Orbiting stars */}
      {[0, 1].map(i => (
        <g key={i} style={{ transformOrigin: '130px 100px', animation: `${i === 0 ? 'orbit-star' : 'orbit-star-2'} 3s linear infinite` }}>
          <text x="130" y="100" textAnchor="middle" fontSize="20" fill="#FFCD00" stroke="#1A0800" strokeWidth="1">★</text>
        </g>
      ))}
      {/* Trophy cup — bounces in */}
      <g style={{ transformOrigin: '130px 130px', animation: 'scale-up-bounce 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.1s both' }}>
        <path d="M95 170 Q68 140 74 104 Q84 80 130 78 Q176 80 186 104 Q192 140 165 170Z"
          fill="#FFCD00" stroke="#1A0800" strokeWidth="3.5"/>
        <path d="M74 110 Q54 98 60 122 Q64 140 74 135" fill="none" stroke="#1A0800" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M186 110 Q206 98 200 122 Q196 140 186 135" fill="none" stroke="#1A0800" strokeWidth="3.5" strokeLinecap="round"/>
        <rect x="116" y="170" width="28" height="14" rx="4" fill="#FFCD00" stroke="#1A0800" strokeWidth="3"/>
        <rect x="102" y="184" width="56" height="14" rx="5" fill="#E8A870" stroke="#1A0800" strokeWidth="3"/>
        <text x="130" y="142" textAnchor="middle" fontSize="36" fill="#1A0800">★</text>
        <text x="130" y="142" textAnchor="middle" fontSize="36" fill="#FFCD00" dx="-1.5" dy="-1.5" opacity="0.5">★</text>
      </g>
      {/* XP label */}
      <g style={{ animation: 'xp-count-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.9s both' }}>
        <rect x="80" y="4" width="100" height="32" rx="16" fill="#2D9A4E" stroke="#1A0800" strokeWidth="2.5"/>
        <text x="130" y="25" textAnchor="middle" fontFamily="'Fredoka One',cursive" fontSize="15" fill="white">+{xp} XP ⭐</text>
      </g>
      {/* Sparkle bursts */}
      {[{x:28,y:60},{x:230,y:55},{x:20,y:155},{x:240,y:150}].map((s,i) => (
        <text key={i} x={s.x} y={s.y} textAnchor="middle" fontSize="22" fill="#FFCD00" stroke="#1A0800" strokeWidth="0.8">
          ✦
          <animate attributeName="opacity" values="0;1;0" dur={`${1.2+i*0.25}s`} begin={`${i*0.18}s`} repeatCount="indefinite"/>
        </text>
      ))}
    </svg>
  )
}

function SmartSVG({ xp }: { xp: number }) {
  return (
    <svg viewBox="0 0 240 200" width="240" height="200" xmlns="http://www.w3.org/2000/svg">
      {/* Shield */}
      <g style={{ transformOrigin: '120px 110px', animation: 'scale-up-bounce 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.1s both' }}>
        <path d="M120 42 L170 62 L170 115 Q170 155 120 175 Q70 155 70 115 L70 62 Z"
          fill="#1565C0" stroke="#1A0800" strokeWidth="3.5"/>
        <path d="M120 52 L160 68 L160 114 Q160 147 120 165 Q80 147 80 114 L80 68 Z"
          fill="#3B82F6" stroke="#1A0800" strokeWidth="2" opacity="0.5"/>
        {/* Checkmark */}
        <path d="M97 112 L113 128 L148 90" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M97 112 L113 128 L148 90" fill="none" stroke="#1A0800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
      </g>
      {/* Coin stack */}
      {[0,1,2,3].map(i => (
        <g key={i} style={{ animation: `slam 0.4s cubic-bezier(0.34,1.56,0.64,1) ${0.3 + i*0.12}s both` }}>
          <ellipse cx="196" cy={172 - i*11} rx="20" ry="8" fill="#FFCD00" stroke="#1A0800" strokeWidth="2"/>
          <rect x="176" cy={165 - i*11} width="40" height="10" fill="#FFCD00" stroke="#1A0800" strokeWidth="0"/>
          <ellipse cx="196" cy={164 - i*11} rx="20" ry="8" fill="#FFE066" stroke="#1A0800" strokeWidth="2"/>
        </g>
      ))}
      {/* XP */}
      <g style={{ animation: 'xp-count-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.9s both' }}>
        <rect x="70" y="4" width="100" height="32" rx="16" fill="#1565C0" stroke="#1A0800" strokeWidth="2.5"/>
        <text x="120" y="25" textAnchor="middle" fontFamily="'Fredoka One',cursive" fontSize="15" fill="white">+{xp} XP ⭐</text>
      </g>
    </svg>
  )
}

function NeutralSVG({ xp }: { xp: number }) {
  return (
    <svg viewBox="0 0 240 200" width="240" height="200" xmlns="http://www.w3.org/2000/svg">
      {/* Balance beam */}
      <rect x="115" y="60" width="10" height="100" fill="#7A4E2D" stroke="#1A0800" strokeWidth="2.5" rx="2"/>
      <ellipse cx="120" cy="162" rx="30" ry="8" fill="#7A4E2D" stroke="#1A0800" strokeWidth="2.5"/>
      {/* Beam */}
      <g style={{ transformOrigin: '120px 75px', animation: 'wobble 3s ease-in-out infinite' }}>
        <rect x="50" y="70" width="140" height="10" rx="5" fill="#E8D5A3" stroke="#1A0800" strokeWidth="2.5"/>
        {/* Left pan */}
        <line x1="65" y1="80" x2="55" y2="110" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>
        <line x1="65" y1="80" x2="75" y2="110" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>
        <path d="M48 110 Q61 120 78 110" fill="#FFCD00" stroke="#1A0800" strokeWidth="2.5"/>
        {/* Left coin */}
        <circle cx="63" cy="105" r="9" fill="#FFCD00" stroke="#1A0800" strokeWidth="2"/>
        <text x="63" y="109" textAnchor="middle" fontSize="9" fill="#1A0800" fontFamily="'Fredoka One',cursive">$</text>
        {/* Right pan */}
        <line x1="175" y1="80" x2="165" y2="110" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>
        <line x1="175" y1="80" x2="185" y2="110" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>
        <path d="M158 110 Q171 120 188 110" fill="#FF7B25" stroke="#1A0800" strokeWidth="2.5"/>
        {/* Right savings jar */}
        <rect x="162" y="95" width="22" height="18" rx="3" fill="#FF7B25" stroke="#1A0800" strokeWidth="2"/>
        <text x="173" y="108" textAnchor="middle" fontSize="9" fill="#1A0800" fontFamily="'Fredoka One',cursive">$</text>
      </g>
      {/* XP */}
      <g style={{ animation: 'xp-count-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.6s both' }}>
        <rect x="70" y="4" width="100" height="32" rx="16" fill="#FF7B25" stroke="#1A0800" strokeWidth="2.5"/>
        <text x="120" y="25" textAnchor="middle" fontFamily="'Fredoka One',cursive" fontSize="15" fill="#1A0800">+{xp} XP</text>
      </g>
    </svg>
  )
}

function PoorSVG({ xp }: { xp: number }) {
  return (
    <svg viewBox="0 0 240 200" width="240" height="200" xmlns="http://www.w3.org/2000/svg">
      {/* Wallet */}
      <g style={{ transformOrigin: '120px 110px', animation: 'scale-up-bounce 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <rect x="60" y="90" width="120" height="80" rx="12" fill="#7A4E2D" stroke="#1A0800" strokeWidth="3"/>
        <rect x="60" y="90" width="120" height="35" rx="12" fill="#5C3820" stroke="#1A0800" strokeWidth="3"/>
        <circle cx="130" cy="110" r="14" fill="#E8D5A3" stroke="#1A0800" strokeWidth="2.5"/>
        <text x="130" y="116" textAnchor="middle" fontSize="14" fill="#1A0800">∅</text>
        {/* Hinge */}
        <rect x="60" y="124" width="120" height="4" fill="#1A0800" opacity="0.3"/>
      </g>
      {/* Moths flying out */}
      {[
        { style: { animation: 'moth-fly-1 1.4s 0.3s ease-out both' }, x: 108, y: 95 },
        { style: { animation: 'moth-fly-2 1.6s 0.5s ease-out both' }, x: 140, y: 92 },
        { style: { animation: 'moth-fly-3 1.5s 0.4s ease-out both' }, x: 124, y: 88 },
      ].map((m, i) => (
        <text key={i} x={m.x} y={m.y} fontSize="18" style={m.style}>🦋</text>
      ))}
      {/* XP (low) */}
      <g style={{ animation: 'xp-count-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.8s both' }}>
        <rect x="70" y="4" width="100" height="32" rx="16" fill="#E63946" stroke="#1A0800" strokeWidth="2.5"/>
        <text x="120" y="25" textAnchor="middle" fontFamily="'Fredoka One',cursive" fontSize="15" fill="white">+{xp} XP only...</text>
      </g>
      {/* Sad face */}
      <text x="120" y="180" textAnchor="middle" fontSize="28" style={{ animation: 'slam 0.4s cubic-bezier(0.34,1.56,0.64,1) 1.2s both' }}>😔</text>
    </svg>
  )
}

function DisasterSVG() {
  return (
    <svg viewBox="0 0 260 210" width="260" height="210" xmlns="http://www.w3.org/2000/svg">
      {/* Explosion burst */}
      <g style={{ transformOrigin: '130px 110px', animation: 'scale-up-bounce 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
        <path d="M130 60 L145 90 L178 78 L158 104 L190 118 L158 126 L168 158 L138 142 L130 172 L122 142 L92 158 L102 126 L70 118 L102 104 L82 78 L115 90 Z"
          fill="#E63946" stroke="#1A0800" strokeWidth="3"/>
        <text x="130" y="125" textAnchor="middle" fontSize="40">💀</text>
      </g>
      {/* Coins flying away */}
      {[
        { style: { animation: 'coin-fly-1 1.1s 0.2s ease-out both' }, x: 122, y: 110 },
        { style: { animation: 'coin-fly-2 1.3s 0.3s ease-out both' }, x: 138, y: 108 },
        { style: { animation: 'coin-fly-3 1.2s 0.15s ease-out both' }, x: 130, y: 105 },
        { style: { animation: 'coin-fly-4 1.4s 0.35s ease-out both' }, x: 118, y: 115 },
      ].map((c, i) => (
        <text key={i} x={c.x} y={c.y} fontSize="20" style={c.style}>🪙</text>
      ))}
      {/* 0 XP badge */}
      <g style={{ animation: 'xp-count-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.7s both' }}>
        <rect x="80" y="4" width="100" height="32" rx="16" fill="#1A0800" stroke="#E63946" strokeWidth="2.5"/>
        <text x="130" y="25" textAnchor="middle" fontFamily="'Fredoka One',cursive" fontSize="15" fill="#E63946">+0 XP 💀</text>
      </g>
      {/* Screen shake */}
      <style>{`@keyframes ds-shake { 0%,100%{transform:translate(0,0)} 20%{transform:translate(-6px,-2px)} 40%{transform:translate(6px,2px)} 60%{transform:translate(-4px,-1px)} 80%{transform:translate(4px,1px)} }`}</style>
    </svg>
  )
}

function OutcomeSVG({ outcome, xp }: { outcome: Outcome; xp: number }) {
  if (outcome === 'brilliant') return <BrilliantSVG xp={xp} />
  if (outcome === 'smart')     return <SmartSVG xp={xp} />
  if (outcome === 'neutral')   return <NeutralSVG xp={xp} />
  if (outcome === 'poor')      return <PoorSVG xp={xp} />
  return <DisasterSVG />
}

// ─── Coin shower (brilliant only) ────────────────────────────

function CoinShower() {
  const coins = Array.from({ length: 22 }, (_) => ({
    left: 4 + Math.random() * 92,
    delay: Math.random() * 2.4,
    size: 18 + Math.random() * 18,
    dur: 1.6 + Math.random() * 1.8,
    emoji: ['🪙','⭐','✨'][Math.floor(Math.random() * 3)],
  }))
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 200 }}>
      {coins.map((c, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${c.left}%`, top: '-40px',
          fontSize: `${c.size}px`,
          animation: `coin-fall ${c.dur}s ${c.delay}s ease-in both`,
        }}>{c.emoji}</div>
      ))}
    </div>
  )
}

// ─── 3-D tilt choice card ─────────────────────────────────────

function ChoiceCard({
  choice, onSelect, chosen, anyChosen,
}: {
  choice: Choice
  onSelect: (c: Choice) => void
  chosen: boolean
  anyChosen: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  function onMove(e: React.MouseEvent) {
    if (!ref.current || anyChosen) return
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - r.left)  / r.width  - 0.5
    const y = (e.clientY - r.top)   / r.height - 0.5
    ref.current.style.transition = 'none'
    ref.current.style.transform  =
      `perspective(700px) rotateX(${-y * 16}deg) rotateY(${x * 16}deg) translateZ(14px) scale(1.02)`
    ref.current.style.boxShadow  =
      `${7 + x * 6}px ${7 + y * 6}px 0 ${ink}, 0 0 0 2px ${choice.accent}`
  }

  function onLeave() {
    if (!ref.current) return
    ref.current.style.transition = 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.35s ease'
    ref.current.style.transform  = ''
    ref.current.style.boxShadow  = `5px 5px 0 ${ink}`
  }

  const opacity = anyChosen ? (chosen ? 1 : 0.25) : 1
  const anim    = anyChosen && !chosen ? 'choice-exit 0.4s cubic-bezier(0.55,0,1,0.45) both' : undefined
  const scale   = chosen && anyChosen ? 'scale(1.04)' : undefined

  return (
    <div
      ref={ref}
      onClick={() => !anyChosen && onSelect(choice)}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        background: paper, border: `3px solid ${ink}`,
        borderRadius: '1.8rem 1.6rem 1.9rem 1.7rem',
        boxShadow: `5px 5px 0 ${ink}`,
        overflow: 'hidden', cursor: anyChosen ? 'default' : 'pointer',
        opacity, animation: anim,
        transform: scale,
        transition: anyChosen ? 'opacity 0.3s, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)' : 'box-shadow 0.3s',
        willChange: 'transform',
      }}
    >
      {/* Colored header stripe */}
      <div style={{
        background: choice.accent, borderBottom: `3px solid ${ink}`,
        padding: '10px 18px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontFamily: "'Fredoka One', cursive", fontSize: '1rem',
          letterSpacing: '0.08em', color: '#1A0800',
        }}>Choice {choice.letter}</span>
        <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.65rem', opacity: 0.6, color: '#1A0800' }}>
          {anyChosen ? (chosen ? `+${choice.xp} XP` : '—') : '? XP'}
        </span>
      </div>

      {/* Icon */}
      <div style={{
        textAlign: 'center', fontSize: '3.8rem', padding: '20px 16px 8px',
        lineHeight: 1,
        filter: chosen && anyChosen ? 'drop-shadow(0 0 8px rgba(255,205,0,0.6))' : 'none',
        transition: 'filter 0.3s',
      }}>{choice.icon}</div>

      {/* Label */}
      <div style={{ padding: '0 18px 10px' }}>
        <h3 style={{
          fontFamily: "'Fredoka One', cursive", fontSize: '1.05rem',
          lineHeight: 1.2, marginBottom: '8px',
        }}>{choice.label}</h3>
        <p style={{
          fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500,
          fontSize: '0.78rem', lineHeight: 1.55, opacity: 0.7,
        }}>{choice.desc}</p>
      </div>

      {/* Bottom accent line */}
      <div style={{ height: '5px', background: choice.accent, borderTop: `2px solid ${ink}` }}/>
    </div>
  )
}

// ─── Outcome config ───────────────────────────────────────────

const OUTCOME_CONFIG: Record<Outcome, { label: string; accent: string; bg: string; stamp: string }> = {
  brilliant: { label: 'BRILLIANT MOVE', accent: '#2D9A4E', bg: '#2D9A4E',  stamp: '★ GENIUS ★' },
  smart:     { label: 'SMART CHOICE',   accent: '#1565C0', bg: '#1565C0',  stamp: '✓ WISE' },
  neutral:   { label: 'SAFE PLAY',      accent: '#FF7B25', bg: '#FF7B25',  stamp: '~ OK' },
  poor:      { label: 'COSTLY MISTAKE', accent: '#E63946', bg: '#E63946',  stamp: '✗ RISKY' },
  disaster:  { label: '💀 DISASTER',    accent: '#1A0800', bg: '#E63946',  stamp: '!! RUN !!' },
}

// ─── Main component ───────────────────────────────────────────

export default function Decision() {
  const isMobile = useIsMobile()
  useEffect(() => { preload() }, [])
  const [phase,        setPhase]        = useState<Phase>('intro')
  const [scenarioIdx,  setScenarioIdx]  = useState(0)
  const [chosenChoice, setChosenChoice] = useState<Choice | null>(null)
  const [showConsequence, setShowConsequence] = useState(false)

  const scenario = SCENARIOS[scenarioIdx]

  function handleChoose(choice: Choice) {
    play('click')
    setChosenChoice(choice)
    setTimeout(() => setPhase('consequence'), 600)
  }

  function handleNextScenario() {
    const next = (scenarioIdx + 1) % SCENARIOS.length
    setScenarioIdx(next)
    setChosenChoice(null)
    setShowConsequence(false)
    setPhase('briefing')
  }

  // ── Submit to API on verdict ────────────────────────────────
  useEffect(() => {
    if (phase !== 'verdict' || !chosenChoice) return
    play(chosenChoice.outcome === 'brilliant' ? 'complete' : chosenChoice.outcome === 'risky' ? 'wrong' : 'complete')
    const session = getSession()
    if (!session) return
    submitGame({ userId: session.id, gameType: 'decision', xpEarned: chosenChoice.xp, score: 1, total: 1, metadata: { outcome: chosenChoice.outcome, scenario: scenario.id } }).catch(() => {})
  }, [phase])

  // Consequence auto-advance
  useEffect(() => {
    if (phase !== 'consequence') return
    setShowConsequence(false)
    const t1 = setTimeout(() => setShowConsequence(true), 100)
    const t2 = setTimeout(() => setPhase('verdict'), 3800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [phase])

  const pageWrap = (children: React.ReactNode, dark = false) => (
    <div style={{
      minHeight: '100vh',
      background: dark ? '#1A0800' : 'var(--rh-surface)',
      backgroundImage: dark
        ? 'radial-gradient(circle, rgba(255,205,0,0.06) 1px, transparent 1px), radial-gradient(circle, rgba(255,205,0,0.06) 1px, transparent 1px)'
        : 'radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px), radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px)',
      backgroundSize: '22px 22px', backgroundPosition: '0 0, 11px 11px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '32px 20px 64px',
    }}>{children}</div>
  )

  // ══════════════════════════════════════════
  // INTRO
  // ══════════════════════════════════════════
  if (phase === 'intro') return pageWrap(
    <div style={{ textAlign: 'center', maxWidth: '640px', width: '100%' }}>

      {/* Spotlight rays */}
      <div style={{ position: 'relative', height: '180px', marginBottom: '-30px' }}>
        <svg viewBox="0 0 500 180" width="100%" height="180" style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <radialGradient id="ray1" cx="50%" cy="0%" r="100%">
              <stop offset="0%" stopColor="#FFCD00" stopOpacity="0.45"/>
              <stop offset="100%" stopColor="#FFCD00" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="ray2" cx="50%" cy="0%" r="100%">
              <stop offset="0%" stopColor="#FFCD00" stopOpacity="0.25"/>
              <stop offset="100%" stopColor="#FFCD00" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <ellipse cx="250" cy="0" rx="160" ry="240" fill="url(#ray1)">
            <animateTransform attributeName="transform" type="rotate"
              values="-12 250 200;12 250 200;-12 250 200" dur="5s" repeatCount="indefinite"
              calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1"/>
          </ellipse>
          <ellipse cx="250" cy="0" rx="100" ry="180" fill="url(#ray2)">
            <animateTransform attributeName="transform" type="rotate"
              values="10 250 200;-10 250 200;10 250 200" dur="4s" repeatCount="indefinite"
              calcMode="spline" keySplines="0.42 0 0.58 1;0.42 0 0.58 1"/>
          </ellipse>
          {/* Stage floor line */}
          <rect x="0" y="168" width="500" height="12" fill="#2A1208" opacity="0.8"/>
          <rect x="0" y="165" width="500" height="3" fill="#FFCD00" opacity="0.3"/>
        </svg>
        {/* Oracle character on stage */}
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>
          <OracleSVG />
        </div>
      </div>

      {/* Title */}
      <div style={{ animation: 'verdict-slam 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.2s both' }}>
        <div style={{
          display: 'inline-block', background: '#E63946', color: '#FEF9EE',
          fontFamily: "'Fredoka One', cursive", fontSize: '0.68rem',
          letterSpacing: '0.22em', padding: '4px 18px',
          borderRadius: '9999px', border: '2.5px solid #FFCD00',
          boxShadow: '3px 3px 0 rgba(255,205,0,0.5)',
          marginBottom: '16px',
        }}>★ GAME MODE ★</div>
        <h1 style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 'clamp(2.6rem, 7vw, 4.5rem)',
          lineHeight: 1, color: '#FEF9EE',
          textShadow: '4px 4px 0 #FFCD00, 7px 7px 0 rgba(255,205,0,0.2)',
          marginBottom: '16px', letterSpacing: '-0.01em',
        }}>The Decision Room</h1>
        <p style={{
          fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600,
          fontSize: '1rem', lineHeight: 1.6,
          color: 'rgba(254,249,238,0.72)', marginBottom: '36px',
        }}>
          Real financial dilemmas. Branching consequences.<br/>
          One choice separates the wise from the ruined.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginBottom: '36px', flexWrap: 'wrap' }}>
        {[
          ['2', 'Scenarios'],
          ['4', 'Choices each'],
          ['+350', 'XP max'],
          ['Real', 'Consequences'],
        ].map(([v, l]) => (
          <div key={l} style={{
            padding: '10px 16px', borderRadius: '1rem',
            border: '2px solid rgba(255,205,0,0.45)',
            background: 'rgba(255,205,0,0.08)',
            textAlign: 'center',
          }}>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.3rem', color: '#FFCD00', lineHeight: 1 }}>{v}</div>
            <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(254,249,238,0.5)' }}>{l}</div>
          </div>
        ))}
      </div>

      <button onClick={() => setPhase('briefing')} style={{
        fontFamily: "'Fredoka One', cursive", fontSize: '1.1rem',
        letterSpacing: '0.07em', padding: '16px 48px',
        borderRadius: '9999px', border: '3px solid #FFCD00',
        background: '#FFCD00', color: '#1A0800',
        boxShadow: '5px 5px 0 rgba(255,205,0,0.35)',
        cursor: 'pointer', transition: 'transform 0.1s, box-shadow 0.1s',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-3px,-3px)'; e.currentTarget.style.boxShadow = '8px 8px 0 rgba(255,205,0,0.35)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '5px 5px 0 rgba(255,205,0,0.35)' }}
      >Enter The Room →</button>

      <div style={{ marginTop: '20px' }}>
        <Link to="/" style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.75rem', color: 'rgba(254,249,238,0.4)', textDecoration: 'underline' }}>
          ← Back to Gazette
        </Link>
      </div>
    </div>
  , true)

  // ══════════════════════════════════════════
  // BRIEFING
  // ══════════════════════════════════════════
  if (phase === 'briefing') return pageWrap(
    <div style={{
      width: '100%', maxWidth: '740px',
      animation: 'briefing-in 0.55s cubic-bezier(0.34,1.56,0.64,1) both',
    }}>
      {/* Case file card */}
      <div style={{
        background: paper, border: `3px solid ${ink}`,
        borderRadius: '2.2rem 2rem 2.2rem 2.1rem',
        boxShadow: `8px 8px 0 ${ink}, 14px 14px 0 color-mix(in srgb, ${ink} 15%, transparent)`,
        overflow: 'hidden', transform: 'rotate(-0.3deg)',
      }}>
        {/* Header */}
        <div style={{
          background: '#1A0800', borderBottom: `3px solid #FFCD00`,
          padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              background: '#FFCD00', color: '#1A0800',
              fontFamily: "'Fredoka One', cursive", fontSize: '0.65rem',
              letterSpacing: '0.18em', padding: '3px 14px',
              borderRadius: '9999px', border: '2px solid #FFCD00',
            }}>CASE #{scenario.id}</span>
            <span style={{
              fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700,
              fontSize: '0.62rem', letterSpacing: '0.16em',
              textTransform: 'uppercase', color: 'rgba(254,249,238,0.55)',
            }}>{scenario.category}</span>
          </div>
          <span style={{
            fontFamily: "'Fredoka One', cursive", fontSize: '0.75rem',
            color: '#E63946', letterSpacing: '0.1em',
            border: '2px solid #E63946', padding: '2px 10px', borderRadius: '4px',
            transform: 'rotate(2deg)', display: 'inline-block',
          }}>CONFIDENTIAL</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 180px', gap: '0' }}>
          {/* Story column */}
          <div style={{ padding: '28px 24px 24px', borderRight: `2px solid ${ink}` }}>
            <h2 style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
              lineHeight: 1.1, marginBottom: '18px',
            }}>{scenario.title}</h2>
            {scenario.story.split('\n\n').map((p, i) => (
              <p key={i} style={{
                fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500,
                fontSize: '0.9rem', lineHeight: 1.7, opacity: 0.8,
                marginBottom: '14px',
              }}>
                {i === 0 && <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '2.8rem', lineHeight: 0.8, float: 'left', marginRight: '6px', marginTop: '4px' }}>{p[0]}</span>}
                {i === 0 ? p.slice(1) : p}
              </p>
            ))}
            <button onClick={() => setPhase('choosing')} style={{
              fontFamily: "'Fredoka One', cursive", fontSize: '0.9rem',
              letterSpacing: '0.06em', padding: '12px 28px',
              borderRadius: '9999px', border: `2.5px solid ${ink}`,
              background: '#E63946', color: '#FEF9EE',
              boxShadow: `4px 4px 0 ${ink}`, cursor: 'pointer',
              transition: 'transform 0.1s, box-shadow 0.1s', marginTop: '8px',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `6px 6px 0 ${ink}` }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0 ${ink}` }}
            >Make Your Choice →</button>
          </div>

          {/* Oracle sidebar */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '20px 12px',
            background: surface,
          }}>
            <OracleSVG />
            <div className="rh-speech-bubble" style={{ marginTop: '8px', textAlign: 'center', maxWidth: '150px' }}>
              <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem', lineHeight: 1.4, margin: 0 }}>
                Choose carefully, my friend. Some mistakes are… permanent.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // ══════════════════════════════════════════
  // CHOOSING
  // ══════════════════════════════════════════
  if (phase === 'choosing') return pageWrap(
    <div style={{ width: '100%', maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{
          display: 'inline-block', background: '#E63946', color: '#FEF9EE',
          fontFamily: "'Fredoka One', cursive", fontSize: '0.65rem',
          letterSpacing: '0.2em', padding: '4px 16px', borderRadius: '9999px',
          border: `2px solid ${ink}`, boxShadow: `2px 2px 0 ${ink}`, marginBottom: '10px',
        }}>SCENARIO {scenario.id} / {SCENARIOS.length}</div>
        <h2 style={{
          fontFamily: "'Fredoka One', cursive",
          fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
          lineHeight: 1.1, marginBottom: '6px',
          textShadow: `3px 3px 0 ${ink}`,
        }}>{scenario.title}</h2>
        <p style={{
          fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600,
          fontSize: '0.82rem', opacity: 0.55,
        }}>Hover to inspect · Click to commit · No going back</p>
      </div>

      {/* 2×2 choice grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '18px' }}>
        {scenario.choices.map(choice => (
          <ChoiceCard
            key={choice.letter}
            choice={choice}
            onSelect={handleChoose}
            chosen={chosenChoice?.letter === choice.letter}
            anyChosen={chosenChoice !== null}
          />
        ))}
      </div>
    </div>
  )

  // ══════════════════════════════════════════
  // CONSEQUENCE
  // ══════════════════════════════════════════
  if (phase === 'consequence' && chosenChoice) {
    const cfg = OUTCOME_CONFIG[chosenChoice.outcome]
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: cfg.bg,
        backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        transition: 'background 0.6s',
        animation: showConsequence ? 'consequence-in 0.5s ease-out both' : undefined,
        padding: '40px 24px',
      }}>
        {chosenChoice.outcome === 'brilliant' && <CoinShower />}
        {chosenChoice.outcome === 'disaster' && (
          <div style={{ position: 'fixed', inset: 0, animation: 'disaster-shake 0.6s 0.2s ease both', pointerEvents: 'none', zIndex: 10 }}/>
        )}

        <div style={{ maxWidth: '560px', width: '100%', textAlign: 'center' }}>
          {/* Outcome label */}
          <div style={{
            display: 'inline-block', background: 'rgba(0,0,0,0.35)',
            border: '2.5px solid rgba(255,255,255,0.4)',
            color: 'white', fontFamily: "'Fredoka One', cursive",
            fontSize: '0.72rem', letterSpacing: '0.22em',
            padding: '5px 18px', borderRadius: '9999px', marginBottom: '16px',
          }}>{cfg.label}</div>

          {/* Consequence SVG */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <OutcomeSVG outcome={chosenChoice.outcome} xp={chosenChoice.xp} />
          </div>

          {/* Snap story */}
          <div style={{
            background: 'rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.25)',
            borderRadius: '1.4rem', padding: '18px 22px', marginBottom: '20px',
            animation: 'slam 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.5s both',
          }}>
            <p style={{
              fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600,
              fontSize: '0.9rem', lineHeight: 1.65, color: 'white',
              margin: 0,
            }}>{chosenChoice.snap}</p>
          </div>

          {/* Timeline */}
          <div style={{
            display: 'flex', gap: '8px', justifyContent: 'center',
            animation: 'fly-in-left 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.8s both',
          }}>
            {chosenChoice.timeline.map((t, i) => (
              <div key={i} style={{
                flex: 1, background: t.good ? 'rgba(45,154,78,0.5)' : 'rgba(230,57,70,0.5)',
                border: `2px solid ${t.good ? '#2D9A4E' : '#E63946'}`,
                borderRadius: '1rem', padding: '10px 8px', textAlign: 'center',
              }}>
                <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.62rem', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.65)', marginBottom: '5px' }}>{t.label}</div>
                <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem', color: 'white', lineHeight: 1.3 }}>{t.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════
  // VERDICT
  // ══════════════════════════════════════════
  if (phase === 'verdict' && chosenChoice) {
    const cfg = OUTCOME_CONFIG[chosenChoice.outcome]
    const isGood = chosenChoice.outcome === 'brilliant' || chosenChoice.outcome === 'smart'

    return pageWrap(
      <div style={{ width: '100%', maxWidth: '720px' }}>
        {chosenChoice.outcome === 'brilliant' && <CoinShower />}

        {/* Newspaper EXTRA card */}
        <div style={{
          background: paper, border: `3px solid ${ink}`,
          borderRadius: '2.2rem 2rem 2.2rem 2.1rem',
          boxShadow: `8px 8px 0 ${ink}, 14px 14px 0 color-mix(in srgb, ${ink} 15%, transparent)`,
          overflow: 'hidden', transform: 'rotate(0.3deg)',
          animation: 'briefing-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
        }}>

          {/* EXTRA! banner */}
          <div style={{
            background: '#E63946', borderBottom: `3px solid ${ink}`,
            padding: '10px 24px', textAlign: 'center',
            backgroundImage: 'repeating-linear-gradient(-45deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 6px, transparent 6px, transparent 12px)',
          }}>
            <span style={{
              fontFamily: "'Fredoka One', cursive", fontSize: '1rem',
              letterSpacing: '0.4em', color: '#FFCD00',
              textShadow: '2px 2px 0 rgba(0,0,0,0.3)',
            }}>✦ EXTRA! EXTRA! ✦</span>
          </div>

          <div style={{ padding: '28px 28px 24px' }}>
            {/* Outcome stamp */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '20px' }}>
              <div style={{
                flexShrink: 0,
                border: `4px solid ${cfg.accent}`, borderRadius: '6px',
                padding: '6px 14px', transform: 'rotate(-4deg)',
                fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem',
                letterSpacing: '0.12em', color: cfg.accent,
                boxShadow: `3px 3px 0 ${cfg.accent}`,
                animation: 'xp-count-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.3s both',
              }}>{cfg.stamp}</div>
              <h2 style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: 'clamp(1.3rem, 3vw, 2rem)',
                lineHeight: 1.15, flex: 1,
                animation: 'verdict-slam 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.15s both',
              }}>{chosenChoice.headline}</h2>
            </div>

            {/* XP earned */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '14px',
              border: `3px solid ${ink}`,
              borderRadius: '9999px', padding: '12px 28px',
              background: chosenChoice.xp > 0 ? '#FFCD00' : surface,
              boxShadow: `5px 5px 0 ${ink}`, marginBottom: '22px',
              animation: 'xp-count-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.5s both',
            }}>
              <span style={{ fontSize: '1.6rem' }}>{chosenChoice.xp > 150 ? '⭐' : chosenChoice.xp > 50 ? '🪙' : '💀'}</span>
              <div>
                <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.5rem', lineHeight: 1, color: '#1A0800' }}>
                  +{chosenChoice.xp} XP
                </div>
                <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.6, color: '#1A0800' }}>Earned this round</div>
              </div>
            </div>

            {/* Lesson pullquote */}
            <div style={{
              borderLeft: `5px solid ${cfg.accent}`,
              paddingLeft: '18px', marginBottom: '24px',
              animation: 'fly-in-left 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.7s both',
            }}>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.45, marginBottom: '6px' }}>What The Experts Say</div>
              <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.88rem', lineHeight: 1.65, opacity: 0.85, margin: 0 }}>
                {chosenChoice.lesson}
              </p>
            </div>

            {/* CTA row */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              {scenarioIdx < SCENARIOS.length - 1 ? (
                <button onClick={handleNextScenario} style={{
                  fontFamily: "'Fredoka One', cursive", fontSize: '0.88rem',
                  letterSpacing: '0.06em', padding: '12px 28px',
                  borderRadius: '9999px', border: `2.5px solid ${ink}`,
                  background: isGood ? '#FFCD00' : '#E63946',
                  color: isGood ? '#1A0800' : '#FEF9EE',
                  boxShadow: `4px 4px 0 ${ink}`, cursor: 'pointer',
                  transition: 'transform 0.1s, box-shadow 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `6px 6px 0 ${ink}` }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0 ${ink}` }}
                >Next Scenario →</button>
              ) : (
                <button onClick={() => { setScenarioIdx(0); setChosenChoice(null); setPhase('intro') }} style={{
                  fontFamily: "'Fredoka One', cursive", fontSize: '0.88rem',
                  letterSpacing: '0.06em', padding: '12px 28px',
                  borderRadius: '9999px', border: `2.5px solid ${ink}`,
                  background: '#FFCD00', color: '#1A0800',
                  boxShadow: `4px 4px 0 ${ink}`, cursor: 'pointer',
                  transition: 'transform 0.1s, box-shadow 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `6px 6px 0 ${ink}` }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0 ${ink}` }}
                >Play Again ↺</button>
              )}
              <Link to="/quiz" style={{
                fontFamily: "'Fredoka One', cursive", fontSize: '0.88rem',
                letterSpacing: '0.06em', padding: '12px 28px',
                borderRadius: '9999px', border: `2.5px solid ${ink}`,
                background: surface, color: ink,
                boxShadow: `4px 4px 0 ${ink}`, textDecoration: 'none',
                transition: 'transform 0.1s, box-shadow 0.1s', display: 'inline-block',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `6px 6px 0 ${ink}` }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `4px 4px 0 ${ink}` }}
              >Try Quick Rounds →</Link>
              <Link to="/leaderboard" style={{
                fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700,
                fontSize: '0.75rem', opacity: 0.45, textDecoration: 'underline',
                color: ink, display: 'inline-block',
              }}>View Leaderboard</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}

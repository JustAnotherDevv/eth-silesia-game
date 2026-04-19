import React, { useState, useEffect, useRef } from 'react'
import { useIsMobile } from '../lib/responsive'
import { submitGame, getPathProgress } from '../lib/api'
import { getSession } from '../lib/session'
import { play, preload } from '../lib/sounds'
import { useOrg } from '../contexts/OrgContext'
import { getPathContent } from '../data/pathContent'
import type { LessonDef, PathNodeData, Chapter, Status } from '../data/pathContent'

const ink     = 'var(--rh-ink)'
const paper   = 'var(--rh-paper)'
const surface = 'var(--rh-surface)'

// ─── Types ────────────────────────────────────────────────────

type ModalPhase = 'intro' | 'lesson' | 'game' | 'victory'


// ─── SVG layout ───────────────────────────────────────────────

const CX = { A: 95, B: 320, C: 545 }
const RY = [120, 270, 420, 570, 720]

const POSITIONS: [number, number][] = [
  [CX.A, RY[0]], [CX.B, RY[0]], [CX.C, RY[0]],
  [CX.C, RY[1]], [CX.B, RY[1]], [CX.A, RY[1]],
  [CX.A, RY[2]], [CX.B, RY[2]], [CX.C, RY[2]],
  [CX.C, RY[3]], [CX.B, RY[3]], [CX.A, RY[3]],
  [CX.A, RY[4]], [CX.B, RY[4]], [CX.C, RY[4]],
]

const FULL_PATH = [
  `M ${CX.A} ${RY[0]} L ${CX.B} ${RY[0]} L ${CX.C} ${RY[0]}`,
  `C ${CX.C + 65} ${RY[0]}, ${CX.C + 65} ${RY[1]}, ${CX.C} ${RY[1]}`,
  `L ${CX.B} ${RY[1]} L ${CX.A} ${RY[1]}`,
  `C ${CX.A - 65} ${RY[1]}, ${CX.A - 65} ${RY[2]}, ${CX.A} ${RY[2]}`,
  `L ${CX.B} ${RY[2]} L ${CX.C} ${RY[2]}`,
  `C ${CX.C + 65} ${RY[2]}, ${CX.C + 65} ${RY[3]}, ${CX.C} ${RY[3]}`,
  `L ${CX.B} ${RY[3]} L ${CX.A} ${RY[3]}`,
  `C ${CX.A - 65} ${RY[3]}, ${CX.A - 65} ${RY[4]}, ${CX.A} ${RY[4]}`,
  `L ${CX.B} ${RY[4]} L ${CX.C} ${RY[4]}`,
].join(' ')

const ROW_CURVES = [
  `C ${CX.C + 65} ${RY[0]}, ${CX.C + 65} ${RY[1]}, ${CX.C} ${RY[1]}`,
  `C ${CX.A - 65} ${RY[1]}, ${CX.A - 65} ${RY[2]}, ${CX.A} ${RY[2]}`,
  `C ${CX.C + 65} ${RY[2]}, ${CX.C + 65} ${RY[3]}, ${CX.C} ${RY[3]}`,
  `C ${CX.A - 65} ${RY[3]}, ${CX.A - 65} ${RY[4]}, ${CX.A} ${RY[4]}`,
]

function computeProgressPath(completedCount: number): string {
  if (completedCount === 0) return `M ${POSITIONS[0][0]} ${POSITIONS[0][1]}`
  const parts: string[] = [`M ${POSITIONS[0][0]} ${POSITIONS[0][1]}`]
  for (let i = 1; i < completedCount; i++) {
    const prevRow = Math.floor((i - 1) / 3)
    const currRow = Math.floor(i / 3)
    if (currRow > prevRow) {
      parts.push(ROW_CURVES[prevRow])
    } else {
      parts.push(`L ${POSITIONS[i][0]} ${POSITIONS[i][1]}`)
    }
  }
  return parts.join(' ')
}

// ─── Mascots ──────────────────────────────────────────────────

function ProfessorSVG({ size = 100 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 140" width={size} height={size * 1.4} xmlns="http://www.w3.org/2000/svg">
      <g>
        <animateTransform attributeName="transform" type="translate"
          values="0,0;0,-6;0,0" dur="2.4s" repeatCount="indefinite"
          calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
        {/* Mortarboard brim */}
        <rect x="20" y="38" width="60" height="7" rx="3" fill="#1A0800" stroke="#1A0800" strokeWidth="1.5"/>
        {/* Hat top */}
        <rect x="30" y="20" width="40" height="20" rx="4" fill="#1A0800" stroke="#1A0800" strokeWidth="1.5"/>
        {/* Tassel */}
        <line x1="70" y1="24" x2="82" y2="34" stroke="#FFCD00" strokeWidth="2"/>
        <circle cx="83" cy="36" r="4" fill="#FFCD00" stroke="#1A0800" strokeWidth="1.5"/>
        {/* Face */}
        <circle cx="50" cy="80" r="28" fill="#FFCD00" stroke="#1A0800" strokeWidth="2.5"/>
        {/* Shine */}
        <ellipse cx="40" cy="68" rx="7" ry="5" fill="#FFE87A" opacity="0.6"/>
        {/* Left eye */}
        <circle cx="40" cy="76" r="6" fill="white" stroke="#1A0800" strokeWidth="1.5"/>
        <circle cx="41" cy="77" r="3" fill="#1A0800"/>
        <circle cx="42" cy="76" r="1" fill="white"/>
        {/* Right eye */}
        <circle cx="60" cy="76" r="6" fill="white" stroke="#1A0800" strokeWidth="1.5"/>
        <circle cx="61" cy="77" r="3" fill="#1A0800"/>
        <circle cx="62" cy="76" r="1" fill="white"/>
        {/* Monocle */}
        <circle cx="60" cy="76" r="8" fill="none" stroke="#1A0800" strokeWidth="1.5"/>
        <line x1="67" y1="82" x2="71" y2="90" stroke="#1A0800" strokeWidth="1.5"/>
        {/* Smile */}
        <path d="M 42 88 Q 50 96 58 88" fill="none" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>
        {/* Bow tie */}
        <polygon points="44,110 50,107 44,104" fill="#E63946" stroke="#1A0800" strokeWidth="1"/>
        <polygon points="56,110 50,107 56,104" fill="#E63946" stroke="#1A0800" strokeWidth="1"/>
        <circle cx="50" cy="107" r="3" fill="#E63946" stroke="#1A0800" strokeWidth="1"/>
        {/* Arms / gloves */}
        <circle cx="20" cy="100" r="9" fill="white" stroke="#1A0800" strokeWidth="2"/>
        <circle cx="80" cy="100" r="9" fill="white" stroke="#1A0800" strokeWidth="2"/>
        {/* Body */}
        <rect x="32" y="107" width="36" height="28" rx="10" fill="#1A0800"/>
      </g>
    </svg>
  )
}

function PiggySVG({ size = 100 }: { size?: number }) {
  return (
    <svg viewBox="0 0 110 130" width={size} height={size * 1.18} xmlns="http://www.w3.org/2000/svg">
      <g>
        <animateTransform attributeName="transform" type="rotate"
          values="0 55 90;-3 55 90;0 55 90;3 55 90;0 55 90" dur="3s" repeatCount="indefinite"
          calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"/>
        {/* Body */}
        <ellipse cx="55" cy="85" rx="36" ry="30" fill="#F9A8C9" stroke="#1A0800" strokeWidth="2.5"/>
        {/* Head */}
        <circle cx="55" cy="52" r="26" fill="#F9A8C9" stroke="#1A0800" strokeWidth="2.5"/>
        {/* Left ear */}
        <ellipse cx="33" cy="32" rx="9" ry="13" fill="#F9A8C9" stroke="#1A0800" strokeWidth="2"
          transform="rotate(-15 33 32)"/>
        <ellipse cx="33" cy="32" rx="5" ry="8" fill="#F4C2D4" transform="rotate(-15 33 32)"/>
        {/* Right ear */}
        <ellipse cx="77" cy="32" rx="9" ry="13" fill="#F9A8C9" stroke="#1A0800" strokeWidth="2"
          transform="rotate(15 77 32)"/>
        <ellipse cx="77" cy="32" rx="5" ry="8" fill="#F4C2D4" transform="rotate(15 77 32)"/>
        {/* Snout */}
        <ellipse cx="55" cy="60" rx="13" ry="10" fill="#F4A0BB" stroke="#1A0800" strokeWidth="1.5"/>
        <circle cx="50" cy="61" r="3" fill="#1A0800"/>
        <circle cx="60" cy="61" r="3" fill="#1A0800"/>
        {/* Eyes */}
        <circle cx="43" cy="46" r="6" fill="white" stroke="#1A0800" strokeWidth="1.5"/>
        <circle cx="44" cy="47" r="3" fill="#1A0800"/>
        <circle cx="45" cy="46" r="1" fill="white"/>
        <circle cx="67" cy="46" r="6" fill="white" stroke="#1A0800" strokeWidth="1.5"/>
        <circle cx="68" cy="47" r="3" fill="#1A0800"/>
        <circle cx="69" cy="46" r="1" fill="white"/>
        {/* Smile */}
        <path d="M 46 68 Q 55 75 64 68" fill="none" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>
        {/* Coin slot */}
        <rect x="47" y="27" width="16" height="4" rx="2" fill="#1A0800"/>
        {/* Legs */}
        {[23, 37, 68, 82].map((x, i) => (
          <rect key={i} x={x} y="107" width="14" height="20" rx="6" fill="#F9A8C9" stroke="#1A0800" strokeWidth="2"/>
        ))}
        {/* Tail */}
        <path d="M 91 80 C 105 75 108 90 98 93 C 88 96 90 105 100 102"
          fill="none" stroke="#F9A8C9" strokeWidth="3" strokeLinecap="round"/>
        <path d="M 91 80 C 105 75 108 90 98 93 C 88 96 90 105 100 102"
          fill="none" stroke="#1A0800" strokeWidth="1.5" strokeLinecap="round"/>
      </g>
    </svg>
  )
}

function WizardSVG({ size = 100 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 145" width={size} height={size * 1.45} xmlns="http://www.w3.org/2000/svg">
      <g>
        <animateTransform attributeName="transform" type="translate"
          values="0,0;0,-7;0,0" dur="3s" repeatCount="indefinite"
          calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
        {/* Robe */}
        <path d="M 30 90 L 20 140 L 80 140 L 70 90 Z" fill="#5B3FA0" stroke="#1A0800" strokeWidth="2.5"/>
        {/* Hat */}
        <polygon points="50,5 72,55 28,55" fill="#3D2880" stroke="#1A0800" strokeWidth="2"/>
        {/* Hat band */}
        <rect x="28" y="50" width="44" height="8" rx="4" fill="#FFCD00" stroke="#1A0800" strokeWidth="1.5"/>
        {/* Stars on hat */}
        <text x="46" y="28" textAnchor="middle" fontSize="10" fill="#FFCD00">✦
          <animate attributeName="opacity" values="1;0.2;1" dur="1.8s" repeatCount="indefinite"/>
        </text>
        <text x="58" y="40" textAnchor="middle" fontSize="7" fill="#FFCD00">✦
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2.3s" repeatCount="indefinite"/>
        </text>
        <text x="38" y="44" textAnchor="middle" fontSize="7" fill="#FFCD00">✦
          <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.5s" repeatCount="indefinite"/>
        </text>
        {/* Face */}
        <circle cx="50" cy="75" r="22" fill="#FDDBB4" stroke="#1A0800" strokeWidth="2.5"/>
        {/* Eyebrows */}
        <path d="M 38 65 Q 43 62 48 65" fill="none" stroke="#5B3FA0" strokeWidth="3" strokeLinecap="round"/>
        <path d="M 52 65 Q 57 62 62 65" fill="none" stroke="#5B3FA0" strokeWidth="3" strokeLinecap="round"/>
        {/* Eyes */}
        <circle cx="43" cy="72" r="5" fill="white" stroke="#1A0800" strokeWidth="1.5"/>
        <circle cx="44" cy="73" r="2.5" fill="#1A0800"/>
        <circle cx="44.5" cy="72.3" r="0.8" fill="white"/>
        <circle cx="57" cy="72" r="5" fill="white" stroke="#1A0800" strokeWidth="1.5"/>
        <circle cx="58" cy="73" r="2.5" fill="#1A0800"/>
        <circle cx="58.5" cy="72.3" r="0.8" fill="white"/>
        {/* Smile */}
        <path d="M 43 82 Q 50 88 57 82" fill="none" stroke="#1A0800" strokeWidth="2" strokeLinecap="round"/>
        {/* Beard patch */}
        <ellipse cx="50" cy="91" rx="8" ry="5" fill="white" stroke="#1A0800" strokeWidth="1"/>
        {/* Wand */}
        <line x1="22" y1="95" x2="15" y2="115" stroke="#7A4E2D" strokeWidth="3" strokeLinecap="round"/>
        <line x1="22" y1="95" x2="15" y2="115" stroke="#1A0800" strokeWidth="1.5" strokeLinecap="round"/>
        <text x="16" y="93" textAnchor="middle" fontSize="12" fill="#FFCD00">✦
          <animate attributeName="opacity" values="1;0.1;1" dur="0.9s" repeatCount="indefinite"/>
        </text>
        <text x="10" y="100" textAnchor="middle" fontSize="7" fill="#FFCD00">✦
          <animate attributeName="opacity" values="0.2;1;0.2" dur="1.1s" repeatCount="indefinite"/>
        </text>
      </g>
    </svg>
  )
}

function MascotSVG({ type, size }: { type: 'professor' | 'piggy' | 'wizard'; size?: number }) {
  if (type === 'professor') return <ProfessorSVG size={size} />
  if (type === 'piggy')     return <PiggySVG size={size} />
  return <WizardSVG size={size} />
}

// ─── Modal Phase Components ───────────────────────────────────

function IntroPhase({
  lesson, chapter, onBegin,
}: { lesson: LessonDef; chapter: Chapter; onBegin: () => void }) {
  return (
    <div style={{
      animation: 'briefing-in 0.4s ease both',
      padding: '32px 28px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px',
      background: `radial-gradient(circle at 50% 30%, ${chapter.color}28 0%, transparent 70%)`,
    }}>
      {/* Chapter badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        background: chapter.color, border: `2px solid ${ink}`,
        borderRadius: '9999px', padding: '5px 14px',
        fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem',
        letterSpacing: '0.1em', boxShadow: `2px 2px 0 ${ink}`,
        color: '#1A0800',
      }}>
        <span>{chapter.icon}</span>
        <span>{chapter.title.toUpperCase()}</span>
      </div>

      {/* Mascot */}
      <div style={{ filter: 'drop-shadow(4px 4px 0 rgba(26,8,0,0.2))' }}>
        <MascotSVG type={lesson.mascotType} size={130} />
      </div>

      {/* Speech bubble */}
      <div style={{
        background: paper, border: `3px solid ${ink}`,
        borderRadius: '18px', padding: '18px 22px',
        boxShadow: `4px 4px 0 ${ink}`,
        maxWidth: '420px', textAlign: 'center',
        fontFamily: "'Fredoka Variable', sans-serif",
        fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.55,
        color: ink, position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: -14, left: '50%',
          transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '14px solid transparent',
          borderRight: '14px solid transparent',
          borderBottom: `14px solid ${ink}`,
        }}/>
        <div style={{
          position: 'absolute', top: -10, left: '50%',
          transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '12px solid transparent',
          borderRight: '12px solid transparent',
          borderBottom: `12px solid ${paper}`,
        }}/>
        {lesson.introQuote}
      </div>

      {/* Begin button */}
      <button
        onClick={onBegin}
        style={{
          fontFamily: "'Fredoka One', cursive", fontSize: '1rem',
          letterSpacing: '0.06em', padding: '14px 36px',
          borderRadius: '9999px', border: `3px solid ${ink}`,
          background: chapter.color, color: '#1A0800',
          boxShadow: `5px 5px 0 ${ink}`,
          cursor: 'pointer', transition: 'transform 0.12s, box-shadow 0.12s',
        }}
        onMouseEnter={e => {
          const b = e.currentTarget as HTMLButtonElement
          b.style.transform = 'translate(-2px,-3px)'
          b.style.boxShadow = `7px 7px 0 ${ink}`
        }}
        onMouseLeave={e => {
          const b = e.currentTarget as HTMLButtonElement
          b.style.transform = ''
          b.style.boxShadow = `5px 5px 0 ${ink}`
        }}
      >
        Let's Begin! →
      </button>
    </div>
  )
}

function LessonPhase({
  lesson, chapter, onNext,
}: { lesson: LessonDef; chapter: Chapter; onNext: () => void }) {
  const [slideIdx, setSlideIdx] = useState(0)
  const [animKey, setAnimKey]   = useState(0)

  const slide = lesson.slides[slideIdx]
  const total = lesson.slides.length

  function goNext() {
    if (slideIdx < total - 1) {
      setSlideIdx(i => i + 1)
      setAnimKey(k => k + 1)
    } else {
      onNext()
    }
  }
  function goBack() {
    if (slideIdx > 0) {
      setSlideIdx(i => i - 1)
      setAnimKey(k => k + 1)
    }
  }

  return (
    <div style={{ padding: '28px 28px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700,
          fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase',
          opacity: 0.5, color: ink,
        }}>
          Lesson {slideIdx + 1} of {total}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {lesson.slides.map((_, i) => (
            <div key={i} style={{
              width: i === slideIdx ? '28px' : '10px',
              height: '10px', borderRadius: '9999px',
              background: i <= slideIdx ? chapter.color : surface,
              border: `2px solid ${ink}`,
              transition: 'width 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            }}/>
          ))}
        </div>
      </div>

      {/* Slide card */}
      <div
        key={animKey}
        style={{
          animation: 'briefing-in 0.35s ease both',
          background: paper, border: `3px solid ${ink}`,
          borderRadius: '16px', overflow: 'hidden',
          boxShadow: `5px 5px 0 ${ink}`,
        }}
      >
        {/* Slide top */}
        <div style={{
          padding: '20px 22px 16px',
          display: 'flex', alignItems: 'flex-start', gap: '16px',
        }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%', flexShrink: 0,
            background: slide.color, border: `2.5px solid ${ink}`,
            boxShadow: `3px 3px 0 ${ink}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.7rem',
          }}>{slide.emoji}</div>
          <h3 style={{
            fontFamily: "'Fredoka One', cursive", fontSize: '1.3rem',
            color: ink, margin: '8px 0 0',
          }}>{slide.headline}</h3>
        </div>

        {/* Body */}
        <div style={{ padding: '0 22px 20px' }}>
          {slide.body.split('\n\n').map((para, i) => (
            <p key={i} style={{
              fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500,
              fontSize: '0.9rem', lineHeight: 1.65, color: ink,
              margin: i === 0 ? '0 0 12px' : '0 0 12px',
              opacity: 0.85,
            }}>{para}</p>
          ))}
        </div>

        {/* Accent bar */}
        <div style={{ height: '5px', background: chapter.color, borderTop: `2px solid ${ink}` }}/>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {slideIdx > 0 ? (
          <button
            onClick={goBack}
            style={{
              fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem',
              padding: '10px 22px', borderRadius: '9999px',
              border: `2.5px solid ${ink}`, background: surface,
              boxShadow: `3px 3px 0 ${ink}`, cursor: 'pointer',
              transition: 'transform 0.1s, box-shadow 0.1s',
            }}
            onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = 'translate(-2px,-2px)'; b.style.boxShadow = `5px 5px 0 ${ink}` }}
            onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = ''; b.style.boxShadow = `3px 3px 0 ${ink}` }}
          >← Back</button>
        ) : <div />}

        <button
          onClick={goNext}
          style={{
            fontFamily: "'Fredoka One', cursive", fontSize: '0.92rem',
            padding: '12px 28px', borderRadius: '9999px',
            border: `3px solid ${ink}`, background: chapter.color,
            color: '#1A0800', boxShadow: `4px 4px 0 ${ink}`,
            cursor: 'pointer', transition: 'transform 0.12s, box-shadow 0.12s',
          }}
          onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = 'translate(-2px,-2px)'; b.style.boxShadow = `6px 6px 0 ${ink}` }}
          onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = ''; b.style.boxShadow = `4px 4px 0 ${ink}` }}
        >
          {slideIdx < total - 1 ? 'Next Slide →' : 'Play the Game! 🎮 →'}
        </button>
      </div>
    </div>
  )
}

const CHOICE_COLORS = ['#1565C0', '#FF7B25', '#2D9A4E', '#7B2D8B']
const CHOICE_LABELS = ['A', 'B', 'C', 'D']

function GamePhase({
  lesson, chapter, onComplete, isMobile,
}: { lesson: LessonDef; chapter: Chapter; onComplete: (score: number) => void; isMobile: boolean }) {
  const [qIdx,     setQIdx]     = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const scoreRef = useRef(0)

  const questions = lesson.game.questions
  const q         = questions[qIdx]

  function pick(i: number) {
    if (revealed) return
    setSelected(i)
    setRevealed(true)
    if (i === q.correct) { scoreRef.current += 1; play('correct') }
    else play('wrong')
  }

  function advance() {
    play('click')
    if (qIdx < questions.length - 1) {
      setQIdx(n => n + 1)
      setSelected(null)
      setRevealed(false)
    } else {
      onComplete(scoreRef.current)
    }
  }

  function choiceStyle(i: number): React.CSSProperties {
    const base: React.CSSProperties = {
      display: 'flex', alignItems: 'center', gap: '10px',
      padding: '13px 16px', borderRadius: '12px',
      border: `3px solid ${ink}`, background: paper,
      boxShadow: `4px 4px 0 ${ink}`, cursor: revealed ? 'default' : 'pointer',
      fontFamily: "'Fredoka Variable', sans-serif",
      fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.35,
      textAlign: 'left', color: ink,
      transition: 'transform 0.12s, box-shadow 0.12s, opacity 0.15s',
    }
    if (!revealed) return base
    if (i === q.correct) {
      return {
        ...base,
        background: '#D4EDDA', borderColor: '#2D9A4E',
        animation: 'bounce-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
      }
    }
    if (i === selected) {
      return {
        ...base,
        background: '#FFDCDC', borderColor: '#E63946',
        animation: 'shake 0.4s ease both',
      }
    }
    return { ...base, opacity: 0.25 }
  }

  return (
    <div style={{ padding: '24px 28px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Progress dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
        {questions.map((_, i) => (
          <div key={i} style={{
            height: '12px',
            width: i < qIdx ? '12px' : i === qIdx ? '36px' : '12px',
            borderRadius: '9999px',
            background: i < qIdx ? '#2D9A4E' : i === qIdx ? '#FFCD00' : '#ccc',
            border: `2px solid ${ink}`,
            transition: 'width 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            ...(i < qIdx && { animation: 'bounce-in 0.3s ease both' }),
          }}/>
        ))}
        <span style={{
          marginLeft: '8px',
          background: chapter.color, border: `2px solid ${ink}`,
          borderRadius: '9999px', padding: '2px 10px',
          fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem',
          color: '#1A0800', boxShadow: `1px 1px 0 ${ink}`,
        }}>Q {qIdx + 1}/{questions.length}</span>
      </div>

      {/* Question */}
      <div style={{
        background: surface, border: `3px solid ${ink}`,
        borderRadius: '16px', padding: '20px 22px',
        boxShadow: `4px 4px 0 ${ink}`,
        fontFamily: "'Fredoka One', cursive", fontSize: '1.05rem',
        lineHeight: 1.5, color: ink,
      }}>{q.q}</div>

      {/* Choices 2×2 */}
      <div style={{
        display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px',
      }}>
        {q.choices.map((choice, i) => (
          <button
            key={i}
            onClick={() => pick(i)}
            style={choiceStyle(i)}
            onMouseEnter={e => {
              if (revealed) return
              const b = e.currentTarget as HTMLButtonElement
              b.style.transform = 'translate(-2px,-2px) scale(1.02)'
              b.style.boxShadow = `6px 6px 0 ${ink}`
            }}
            onMouseLeave={e => {
              if (revealed) return
              const b = e.currentTarget as HTMLButtonElement
              b.style.transform = ''
              b.style.boxShadow = `4px 4px 0 ${ink}`
            }}
          >
            <span style={{
              minWidth: '26px', height: '26px', borderRadius: '50%',
              background: CHOICE_COLORS[i], color: 'white',
              fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${ink}`, flexShrink: 0,
            }}>{CHOICE_LABELS[i]}</span>
            <span>{choice}</span>
            {revealed && i === q.correct && (
              <span style={{ marginLeft: 'auto', fontSize: '1.1rem' }}>✓</span>
            )}
            {revealed && i === selected && i !== q.correct && (
              <span style={{ marginLeft: 'auto', fontSize: '1.1rem' }}>✗</span>
            )}
          </button>
        ))}
      </div>

      {/* Explanation */}
      {revealed && (
        <div style={{
          animation: 'fly-in-left 0.35s ease both',
          background: selected === q.correct ? '#D4EDDA' : '#FFDCDC',
          border: `2.5px solid ${selected === q.correct ? '#2D9A4E' : '#E63946'}`,
          borderRadius: '12px', padding: '14px 18px',
          fontFamily: "'Fredoka Variable', sans-serif",
          fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.55, color: ink,
        }}>
          <strong style={{ fontFamily: "'Fredoka One', cursive" }}>
            {selected === q.correct ? '🎉 Correct! ' : '💡 Not quite — '}
          </strong>
          {q.explanation}
        </div>
      )}

      {/* Next button */}
      {revealed && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={advance}
            style={{
              fontFamily: "'Fredoka One', cursive", fontSize: '0.92rem',
              padding: '12px 28px', borderRadius: '9999px',
              border: `3px solid ${ink}`, background: '#FFCD00',
              color: '#1A0800', boxShadow: `4px 4px 0 ${ink}`,
              cursor: 'pointer', transition: 'transform 0.12s, box-shadow 0.12s',
              animation: 'bounce-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
            }}
            onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = 'translate(-2px,-2px)'; b.style.boxShadow = `6px 6px 0 ${ink}` }}
            onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = ''; b.style.boxShadow = `4px 4px 0 ${ink}` }}
          >
            {qIdx < questions.length - 1 ? 'Next Question →' : 'See Results! 🎉'}
          </button>
        </div>
      )}
    </div>
  )
}

const CONFETTI_EMOJIS = ['🪙', '⭐', '💰', '✨', '🪙', '⭐', '💰', '✨', '🪙', '⭐', '💰', '✨', '🪙', '⭐', '💰', '✨']

function VictoryPhase({
  score, total, xp, onClose, onReplay, userId, nodeId, onCompleted,
}: {
  score: number; total: number; xp: number
  onClose: () => void; onReplay: () => void
  userId?: string | null; nodeId?: number; onCompleted?: (nodeId: number) => void
}) {
  const [displayXP, setDisplayXP] = useState(0)
  const submitted = useRef(false)

  const earnedXP = score === total ? xp : score >= 2 ? Math.round(xp * 0.6) : Math.round(xp * 0.3)

  const grade =
    score === total
      ? { label: 'BRILLIANT', emoji: '🏆', color: '#FFCD00' }
      : score >= 2
      ? { label: 'SMART!',    emoji: '⭐', color: '#2D9A4E' }
      : { label: 'KEEP AT IT!', emoji: '💪', color: '#FF7B25' }

  useEffect(() => {
    let current = 0
    const step = Math.ceil(earnedXP / 40)
    const interval = setInterval(() => {
      current = Math.min(current + step, earnedXP)
      setDisplayXP(current)
      if (current >= earnedXP) clearInterval(interval)
    }, 30)
    return () => clearInterval(interval)
  }, [earnedXP])

  useEffect(() => {
    if (!userId || nodeId == null || submitted.current) return
    submitted.current = true
    play('xp-gain')
    submitGame({ userId, gameType: 'path', xpEarned: earnedXP, score, total, metadata: { nodeId } })
      .then(res => {
        if (res.newBadges.length > 0) setTimeout(() => play('badge'), 800)
        onCompleted?.(nodeId)
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      padding: '36px 28px 40px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
      background: `radial-gradient(circle at 50% 30%, ${grade.color}30 0%, transparent 65%)`,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Confetti */}
      {CONFETTI_EMOJIS.map((em, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${(i * 6.5 + 2) % 96}%`,
          top: '-20px',
          fontSize: `${0.8 + (i % 3) * 0.3}rem`,
          animation: `coin-fall ${1.2 + (i % 5) * 0.4}s ease-in ${i * 0.08}s both`,
          pointerEvents: 'none', zIndex: 0,
        }}>{em}</div>
      ))}

      {/* Grade */}
      <div style={{
        fontSize: '4rem', lineHeight: 1,
        animation: 'bounce-in 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
        zIndex: 1,
      }}>{grade.emoji}</div>

      <div style={{
        fontFamily: "'Fredoka One', cursive", fontSize: '2.4rem',
        color: grade.color,
        animation: 'slam 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
        zIndex: 1,
      }}>{grade.label}</div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '380px', zIndex: 1 }}>
        <div style={{
          flex: 1, background: paper, border: `3px solid ${ink}`,
          borderRadius: '16px', padding: '16px', textAlign: 'center',
          boxShadow: `4px 4px 0 ${ink}`,
        }}>
          <div style={{
            fontFamily: "'Fredoka One', cursive", fontSize: '2rem', color: ink,
          }}>{score}<span style={{ fontSize: '1.1rem', opacity: 0.45 }}>/{total}</span></div>
          <div style={{
            fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700,
            fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            opacity: 0.55, marginTop: '4px',
          }}>Score</div>
        </div>

        <div style={{
          flex: 1, background: '#FFCD00', border: `3px solid ${ink}`,
          borderRadius: '16px', padding: '16px', textAlign: 'center',
          boxShadow: `4px 4px 0 ${ink}`,
        }}>
          <div style={{
            fontFamily: "'Fredoka One', cursive", fontSize: '2rem', color: '#1A0800',
            animation: displayXP > 0 ? 'xp-count-pop 0.3s ease both' : undefined,
          }}>+{displayXP}</div>
          <div style={{
            fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700,
            fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            opacity: 0.65, color: '#1A0800', marginTop: '4px',
          }}>XP Earned</div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '12px', zIndex: 1 }}>
        <button
          onClick={onReplay}
          style={{
            fontFamily: "'Fredoka One', cursive", fontSize: '0.88rem',
            padding: '12px 24px', borderRadius: '9999px',
            border: `2.5px solid ${ink}`, background: surface,
            boxShadow: `3px 3px 0 ${ink}`, cursor: 'pointer',
            transition: 'transform 0.1s, box-shadow 0.1s',
          }}
          onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = 'translate(-2px,-2px)'; b.style.boxShadow = `5px 5px 0 ${ink}` }}
          onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = ''; b.style.boxShadow = `3px 3px 0 ${ink}` }}
        >↺ Replay</button>

        <button
          onClick={onClose}
          style={{
            fontFamily: "'Fredoka One', cursive", fontSize: '0.92rem',
            padding: '12px 28px', borderRadius: '9999px',
            border: `3px solid ${ink}`, background: '#FFCD00',
            color: '#1A0800', boxShadow: `4px 4px 0 ${ink}`,
            cursor: 'pointer', transition: 'transform 0.12s, box-shadow 0.12s',
          }}
          onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = 'translate(-2px,-2px)'; b.style.boxShadow = `6px 6px 0 ${ink}` }}
          onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = ''; b.style.boxShadow = `4px 4px 0 ${ink}` }}
        >Back to Path →</button>
      </div>
    </div>
  )
}

// ─── Phase indicator ──────────────────────────────────────────

const PHASE_ORDER: ModalPhase[] = ['intro', 'lesson', 'game', 'victory']
const PHASE_LABELS: Record<ModalPhase, string> = { intro: 'Intro', lesson: 'Lesson', game: 'Game', victory: 'Victory' }

function PhaseIndicator({ current, chapter }: { current: ModalPhase; chapter: Chapter }) {
  const idx = PHASE_ORDER.indexOf(current)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '0', padding: '8px 20px',
      borderBottom: `2px solid ${ink}`,
      background: paper,
    }}>
      {PHASE_ORDER.map((p, i) => (
        <React.Fragment key={p}>
          {i > 0 && (
            <div style={{
              width: '28px', height: '2px',
              background: i <= idx ? chapter.color : 'color-mix(in srgb, var(--rh-ink) 20%, transparent)',
            }}/>
          )}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
          }}>
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              border: `2.5px solid ${ink}`,
              background: i < idx ? chapter.color : i === idx ? chapter.color : surface,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem',
              color: i <= idx ? '#1A0800' : ink,
              opacity: i > idx ? 0.45 : 1,
              boxShadow: i === idx ? `2px 2px 0 ${ink}` : 'none',
              transition: 'background 0.25s',
            }}>
              {i < idx ? '✓' : i + 1}
            </div>
            <span style={{
              fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700,
              fontSize: '0.58rem', letterSpacing: '0.08em',
              textTransform: 'uppercase', opacity: i === idx ? 1 : 0.4,
              color: ink,
            }}>{PHASE_LABELS[p]}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  )
}

// ─── Lesson Modal ─────────────────────────────────────────────

function LessonModal({
  node, chapter, lesson, onClose, isMobile, userId, onCompleted,
}: {
  node: PathNodeData; chapter: Chapter; lesson: LessonDef; onClose: () => void; isMobile: boolean
  userId?: string | null; onCompleted?: (nodeId: number) => void
}) {
  const [phase,      setPhase]      = useState<ModalPhase>('intro')
  const [finalScore, setFinalScore] = useState(0)
  const [gameKey,    setGameKey]    = useState(0)

  useEffect(() => { preload(); play('modal-open') }, [])

  function handleComplete(score: number) {
    setFinalScore(score)
    setPhase('victory')
  }

  function handleReplay() {
    setGameKey(k => k + 1)
    setPhase('game')
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(26,8,0,0.72)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '660px',
          maxHeight: '90vh', overflowY: 'auto',
          background: paper,
          border: `4px solid ${ink}`,
          borderRadius: '20px',
          boxShadow: `8px 8px 0 ${ink}`,
          animation: 'bounce-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 10,
          background: chapter.color,
          borderBottom: `3px solid ${ink}`,
          borderRadius: '16px 16px 0 0',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <span style={{ fontSize: '1.3rem' }}>{chapter.icon}</span>
              <span style={{
                fontFamily: "'Fredoka One', cursive", fontSize: '1rem',
                color: '#1A0800', lineHeight: 1.2,
              }}>{node.title}</span>
            </div>
            <button
              onClick={onClose}
              style={{
                fontFamily: "'Fredoka One', cursive", fontSize: '0.85rem',
                padding: '6px 14px', borderRadius: '9999px',
                border: `2px solid ${ink}`, background: paper,
                color: ink, cursor: 'pointer',
                boxShadow: `2px 2px 0 ${ink}`,
                transition: 'transform 0.1s, box-shadow 0.1s',
              }}
              onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = 'translate(-1px,-1px)'; b.style.boxShadow = `3px 3px 0 ${ink}` }}
              onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = ''; b.style.boxShadow = `2px 2px 0 ${ink}` }}
            >✕</button>
          </div>
          <PhaseIndicator current={phase} chapter={chapter} />
        </div>

        {/* Body */}
        {!lesson ? (
          // Locked teaser
          <div style={{
            padding: '48px 32px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '3.5rem',
              animation: 'heartbeat 2s ease-in-out infinite',
            }}>🔒</div>
            <h3 style={{
              fontFamily: "'Fredoka One', cursive", fontSize: '1.4rem', color: ink, margin: 0,
            }}>Lesson Locked</h3>
            <p style={{
              fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600,
              fontSize: '0.9rem', color: ink, opacity: 0.65, maxWidth: '300px', margin: 0,
            }}>Complete the previous lesson to unlock this chapter.</p>
            <div style={{
              marginTop: '8px', padding: '8px 20px',
              background: chapter.color, border: `2.5px solid ${ink}`,
              borderRadius: '9999px', boxShadow: `3px 3px 0 ${ink}`,
              fontFamily: "'Fredoka One', cursive", fontSize: '0.8rem', color: '#1A0800',
            }}>{chapter.icon} {chapter.title}</div>
          </div>
        ) : phase === 'intro' ? (
          <IntroPhase lesson={lesson} chapter={chapter} onBegin={() => setPhase('lesson')} />
        ) : phase === 'lesson' ? (
          <LessonPhase lesson={lesson} chapter={chapter} onNext={() => setPhase('game')} />
        ) : phase === 'game' ? (
          <GamePhase key={gameKey} lesson={lesson} chapter={chapter} onComplete={handleComplete} isMobile={isMobile} />
        ) : (
          <VictoryPhase
            score={finalScore}
            total={lesson.game.questions.length}
            xp={node.xp}
            onClose={onClose}
            onReplay={handleReplay}
            userId={userId}
            nodeId={node.id}
            onCompleted={onCompleted}
          />
        )}
      </div>
    </div>
  )
}

// ─── Decoration SVGs ──────────────────────────────────────────

function TreeSVG({ scale = 1 }: { scale?: number }) {
  return (
    <svg viewBox="0 0 48 64" width={48 * scale} height={64 * scale} xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="44" width="8" height="18" rx="4" fill="#7A4E2D" stroke="#1A0800" strokeWidth="2"/>
      <circle cx="24" cy="38" r="16" fill="#2D9A4E" stroke="#1A0800" strokeWidth="2.5"/>
      <circle cx="14" cy="44" r="11" fill="#2D9A4E" stroke="#1A0800" strokeWidth="2.5"/>
      <circle cx="34" cy="44" r="11" fill="#2D9A4E" stroke="#1A0800" strokeWidth="2.5"/>
      <circle cx="24" cy="22" r="12" fill="#3BAA5E" stroke="#1A0800" strokeWidth="2"/>
      <circle cx="18" cy="28" r="4" fill="#5DD07E" opacity="0.5"/>
      <animateTransform attributeName="transform" type="translate"
        values="0,0;0,-3;0,0" dur="2.4s" repeatCount="indefinite"
        calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
    </svg>
  )
}

function CoinPileSVG() {
  return (
    <svg viewBox="0 0 56 40" width="56" height="40" xmlns="http://www.w3.org/2000/svg">
      {[0, 1, 2].map(i => (
        <g key={i}>
          <ellipse cx={28 + (i - 1) * 2} cy={34 - i * 10} rx="18" ry="7" fill="#FFCD00" stroke="#1A0800" strokeWidth="2"/>
          <ellipse cx={28 + (i - 1) * 2} cy={27 - i * 10} rx="18" ry="7" fill="#FFE066" stroke="#1A0800" strokeWidth="2"/>
          <text x={28 + (i - 1) * 2} y={30 - i * 10} textAnchor="middle" fontSize="7"
            fontFamily="'Fredoka One',cursive" fill="#1A0800">$</text>
        </g>
      ))}
    </svg>
  )
}

function ActivePointerSVG() {
  return (
    <svg viewBox="0 0 44 52" width="44" height="52" xmlns="http://www.w3.org/2000/svg"
      style={{ animation: 'float 1.6s ease-in-out infinite', display: 'block' }}>
      <rect x="0" y="0" width="44" height="20" rx="10" fill="#E63946" stroke="#1A0800" strokeWidth="2"/>
      <text x="22" y="14" textAnchor="middle" fontFamily="'Fredoka One',cursive" fontSize="7.5"
        letterSpacing="0.08em" fill="white">YOU</text>
      <path d="M22 20 L30 34 L24 30 L24 50 L20 50 L20 30 L14 34 Z"
        fill="#E63946" stroke="#1A0800" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── Path Node ────────────────────────────────────────────────

function PathNode({
  node, pos, selected, onSelect, onOpenLesson,
}: {
  node: PathNodeData
  pos: [number, number]
  selected: boolean
  onSelect: (n: PathNodeData) => void
  onOpenLesson: (n: PathNodeData) => void
}) {
  const done   = node.status === 'completed'
  const active = node.status === 'active'
  const locked = node.status === 'locked'
  const R      = active ? 38 : 34

  function handleClick() {
    if (locked) return
    onSelect(node)
    onOpenLesson(node)
  }

  return (
    <div style={{
      position: 'absolute',
      left:  pos[0] - R,
      top:   pos[1] - R,
      width:  R * 2,
      height: R * 2,
      zIndex: 2,
    }}>
      {active && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '50%',
          transform: 'translateX(-50%)', marginBottom: '6px', zIndex: 5,
        }}>
          <ActivePointerSVG />
        </div>
      )}

      {selected && (
        <div style={{
          position: 'absolute', inset: -8, borderRadius: '50%',
          background: 'transparent',
          border: `3px solid ${done ? '#FFCD00' : active ? '#E63946' : '#7B2D8B'}`,
          animation: 'heartbeat 1.5s ease-in-out infinite', opacity: 0.55,
        }}/>
      )}

      <div
        onClick={handleClick}
        style={{
          width: '100%', height: '100%', borderRadius: '50%',
          background: done ? '#FFCD00' : active ? paper : 'color-mix(in srgb, var(--rh-surface) 80%, var(--rh-ink) 20%)',
          border: `${active ? 4 : 3}px solid ${ink}`,
          boxShadow: active
            ? `4px 4px 0 ${ink}, 0 0 0 6px rgba(230,57,70,0.18), 0 0 16px rgba(255,205,0,0.2)`
            : done
            ? `4px 4px 0 ${ink}`
            : `2px 2px 0 ${ink}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: done ? '1.6rem' : active ? '1.5rem' : '1.3rem',
          cursor: locked ? 'not-allowed' : 'pointer',
          opacity: locked ? 0.4 : 1,
          transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.15s',
          userSelect: 'none',
          ...(active && { animation: 'heartbeat 2.2s ease-in-out infinite' }),
        }}
        onMouseEnter={e => { if (!locked) (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.12) rotate(-3deg)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = '' }}
      >
        {done ? '✓' : locked ? '🔒' : node.icon}
      </div>

      {done && (
        <div style={{
          position: 'absolute', bottom: -14, left: '50%',
          transform: 'translateX(-50%)',
          background: '#FFCD00', color: '#1A0800',
          fontFamily: "'Fredoka One', cursive", fontSize: '0.5rem',
          padding: '1px 7px', borderRadius: '9999px',
          border: `1.5px solid ${ink}`, whiteSpace: 'nowrap',
          boxShadow: `1px 1px 0 ${ink}`,
        }}>+{node.xp} XP</div>
      )}
    </div>
  )
}

// ─── Chapter Label ────────────────────────────────────────────

function ChapterLabel({ chapter, pos }: { chapter: Chapter; pos: [number, number] }) {
  const isLeft  = pos[0] < 320
  const offsetX = isLeft ? -72 : 16
  const offsetY = -48

  return (
    <div style={{
      position: 'absolute',
      left: pos[0] + offsetX,
      top:  pos[1] + offsetY,
      zIndex: 3, pointerEvents: 'none',
    }}>
      <div style={{
        background: chapter.color, border: `2.5px solid ${ink}`,
        borderRadius: '9999px', padding: '4px 12px',
        boxShadow: `3px 3px 0 ${ink}`, whiteSpace: 'nowrap',
        fontFamily: "'Fredoka One', cursive",
        fontSize: '0.62rem', letterSpacing: '0.1em',
        color: '#1A0800', display: 'flex', alignItems: 'center', gap: '5px',
      }}>
        <span>{chapter.icon}</span>
        <span>{chapter.title}</span>
      </div>
    </div>
  )
}

// ─── Detail Card ──────────────────────────────────────────────

function DetailCard({
  node, chapter, onOpenLesson,
}: { node: PathNodeData; chapter: Chapter; onOpenLesson: (n: PathNodeData) => void }) {
  const done   = node.status === 'completed'
  const active = node.status === 'active'

  return (
    <div style={{
      position: 'sticky', bottom: 0, zIndex: 20,
      background: paper, borderTop: `3px solid ${ink}`,
      boxShadow: `0 -6px 0 ${ink}`,
      padding: '16px 24px',
      display: 'flex', alignItems: 'center', gap: '16px',
      animation: 'slam 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
    }}>
      <div style={{
        width: '54px', height: '54px', borderRadius: '50%', flexShrink: 0,
        background: chapter.color, border: `2.5px solid ${ink}`,
        boxShadow: `3px 3px 0 ${ink}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.7rem',
      }}>{done ? '✓' : node.icon}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
          <span style={{
            background: chapter.color, color: '#1A0800',
            fontFamily: "'Fredoka One', cursive", fontSize: '0.56rem',
            letterSpacing: '0.12em', padding: '1px 8px',
            borderRadius: '9999px', border: `1.5px solid ${ink}`,
            boxShadow: `1px 1px 0 ${ink}`, flexShrink: 0,
          }}>{chapter.title}</span>
          <span style={{
            fontFamily: "'Fredoka One', cursive", fontSize: '0.9rem',
            lineHeight: 1.1, color: ink,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{node.title}</span>
        </div>
        <p style={{
          fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500,
          fontSize: '0.78rem', lineHeight: 1.4, opacity: 0.65,
          margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{node.desc}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <div style={{
          textAlign: 'center', padding: '5px 12px',
          border: `2px solid ${ink}`, borderRadius: '9999px',
          background: done ? '#FFCD00' : surface,
          fontFamily: "'Fredoka One', cursive", fontSize: '0.78rem',
          boxShadow: `2px 2px 0 ${ink}`,
        }}>
          {done ? `✓ ${node.xp} XP` : `+${node.xp} XP`}
        </div>

        {(active || done) && (
          <button
            onClick={() => onOpenLesson(node)}
            style={{
              fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem',
              letterSpacing: '0.06em', padding: '10px 22px',
              borderRadius: '9999px', border: `2.5px solid ${ink}`,
              background: active ? '#E63946' : '#FFCD00',
              color: active ? '#FEF9EE' : '#1A0800',
              boxShadow: `3px 3px 0 ${ink}`,
              cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'transform 0.1s, box-shadow 0.1s',
            }}
            onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = 'translate(-2px,-2px)'; b.style.boxShadow = `5px 5px 0 ${ink}` }}
            onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.transform = ''; b.style.boxShadow = `3px 3px 0 ${ink}` }}
          >{done ? 'Review →' : 'Start Lesson →'}</button>
        )}
      </div>
    </div>
  )
}

// ─── Progress Header ──────────────────────────────────────────

function ProgressHeader({ nodes, chapters, pageTitle }: { nodes: PathNodeData[]; chapters: Chapter[]; pageTitle: string }) {
  const done    = nodes.filter(n => n.status === 'completed').length
  const totalXP = nodes.filter(n => n.status === 'completed').reduce((s, n) => s + n.xp, 0)
  const pct     = Math.round((done / nodes.length) * 100)
  const chapter = chapters[Math.floor(done / 3)]

  return (
    <div style={{
      background: paper, borderBottom: `3px solid ${ink}`,
      padding: '16px 28px',
      display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: '200px' }}>
        <h1 className="text-4xl font-bold" style={{ marginBottom: '4px' }}>{pageTitle}</h1>
        <p style={{
          fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600,
          fontSize: '0.8rem', opacity: 0.55, margin: 0,
        }}>
          Currently studying: <strong>{chapter?.title ?? 'Advanced'}</strong>
        </p>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'Completed', value: `${done}/${nodes.length}`, accent: '#2D9A4E' },
          { label: 'Total XP',  value: `${totalXP}`,              accent: '#FFCD00' },
          { label: 'Progress',  value: `${pct}%`,                 accent: '#1565C0' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '6px 14px', borderRadius: '9999px',
            border: `2px solid ${ink}`, background: s.accent,
            boxShadow: `2px 2px 0 ${ink}`, textAlign: 'center',
          }}>
            <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.95rem', color: '#1A0800' }}>{s.value}</span>
            <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.65, color: '#1A0800', marginLeft: '5px' }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ width: '100%', marginTop: '4px' }}>
        <div style={{
          height: '12px', borderRadius: '9999px',
          border: `2px solid ${ink}`, background: surface,
          boxShadow: `2px 2px 0 ${ink}`, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: 'linear-gradient(to right, #FFCD00, #2D9A4E)',
            borderRadius: '9999px',
            transition: 'width 0.8s cubic-bezier(0.34,1.56,0.64,1)',
          }}/>
        </div>
        <div style={{ position: 'relative', height: '6px' }}>
          {[20, 40, 60, 80].map((tick, i) => (
            <div key={i} style={{
              position: 'absolute', top: 0,
              left: `${tick}%`, transform: 'translateX(-50%)',
              width: '2px', height: '6px',
              background: 'color-mix(in srgb, var(--rh-ink) 25%, transparent)',
            }}/>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────

export default function Path() {
  const isMobile = useIsMobile()
  const { theme } = useOrg()
  const content = React.useMemo(() => getPathContent(theme), [theme])
  const { chapters, nodes, lessons, pageTitle } = content

  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set())
  const [userId,       setUserId]       = useState<string | null>(null)
  const [selectedId,   setSelectedId]   = useState<number>(5)
  const [modalNode,    setModalNode]    = useState<PathNodeData | null>(null)

  useEffect(() => {
    const session = getSession()
    if (!session) return
    setUserId(session.id)
    getPathProgress(session.id)
      .then(items => {
        const ids = new Set(items.map(item => parseInt(item.node_id)))
        setCompletedIds(ids)
        // Select the first non-completed node as active
        for (let i = 1; i <= nodes.length; i++) {
          if (!ids.has(i)) { setSelectedId(i); break }
        }
      })
      .catch(() => {})
  }, [nodes.length])

  function nodeStatus(id: number): Status {
    if (completedIds.has(id)) return 'completed'
    if (id === 1 || completedIds.has(id - 1)) return 'active'
    return 'locked'
  }

  const dynamicNodes: PathNodeData[] = nodes.map(n => ({ ...n, status: nodeStatus(n.id) }))

  function handleNodeCompleted(nodeId: number) {
    setCompletedIds(prev => new Set([...prev, nodeId]))
  }

  const selected = dynamicNodes.find(n => n.id === selectedId) ?? dynamicNodes[4] ?? dynamicNodes[0]
  const selectedChapter = chapters.find(c => c.id === selected.chapter)!
  const chapterFirstIdx = chapters.map(ch => nodes.findIndex(n => n.chapter === ch.id))
  const progressPath = computeProgressPath(completedIds.size)

  return (
    <div style={{ minHeight: '100vh', background: surface }}>
      <ProgressHeader nodes={dynamicNodes} chapters={chapters} pageTitle={pageTitle} />

      {/* Scrollable path area */}
      <div style={{
        padding: '28px 20px 24px',
        display: 'flex', justifyContent: 'center',
        backgroundImage: 'radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px), radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px)',
        backgroundSize: '22px 22px', backgroundPosition: '0 0, 11px 11px',
      }}>
        <div style={{ position: 'relative', width: '640px', height: '840px', flexShrink: 0 }}>

          {/* SVG layer */}
          <svg width="640" height="840" style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'visible' }}>
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFCD00"/>
                <stop offset="100%" stopColor="#2D9A4E"/>
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
            </defs>

            <path d={FULL_PATH}
              fill="none" stroke="color-mix(in srgb, var(--rh-ink) 22%, transparent)"
              strokeWidth="10" strokeLinecap="round" strokeDasharray="16 10"/>
            <path d={FULL_PATH}
              fill="none" stroke="color-mix(in srgb, var(--rh-ink) 18%, transparent)"
              strokeWidth="6" strokeLinecap="round"/>
            <path d={progressPath}
              fill="none" stroke="url(#goldGrad)"
              strokeWidth="8" strokeLinecap="round" strokeDasharray="20 6"/>
            <path d={progressPath}
              fill="none" stroke="#FFCD00"
              strokeWidth="4" strokeLinecap="round" opacity="0.35"/>

            {/* Trees */}
            <foreignObject x="188" y="172" width="56" height="72">
              <div style={{ width: 56, height: 72 }}><TreeSVG scale={0.9} /></div>
            </foreignObject>
            <foreignObject x="380" y="172" width="48" height="64">
              <div style={{ width: 48, height: 64 }}><TreeSVG scale={0.75} /></div>
            </foreignObject>
            <foreignObject x="220" y="322" width="48" height="64">
              <div style={{ width: 48, height: 64 }}><TreeSVG scale={0.8} /></div>
            </foreignObject>
            <foreignObject x="370" y="472" width="56" height="72">
              <div style={{ width: 56, height: 72 }}><TreeSVG scale={0.85} /></div>
            </foreignObject>
            <foreignObject x="180" y="622" width="48" height="64">
              <div style={{ width: 48, height: 64 }}><TreeSVG scale={0.75} /></div>
            </foreignObject>

            {/* Coin piles */}
            <foreignObject x="60" y="142" width="56" height="40">
              <div style={{ width: 56, height: 40 }}><CoinPileSVG /></div>
            </foreignObject>
            <foreignObject x="294" y="145" width="56" height="40">
              <div style={{ width: 56, height: 40 }}><CoinPileSVG /></div>
            </foreignObject>

            {/* Stars */}
            {[
              { x: 50,  y: 80  }, { x: 590, y: 85  }, { x: 52,  y: 236 },
              { x: 592, y: 232 }, { x: 300, y: 62  }, { x: 300, y: 208 },
            ].map((s, i) => (
              <text key={i} x={s.x} y={s.y} textAnchor="middle" fontSize="18"
                fill="#FFCD00" stroke="#1A0800" strokeWidth="0.8" opacity={i < 4 ? 0.9 : 0.4}>
                ✦
                <animate attributeName="opacity"
                  values={i < 4 ? '0.9;0.4;0.9' : '0.4;0.8;0.4'}
                  dur={`${1.8 + i * 0.4}s`} repeatCount="indefinite"/>
              </text>
            ))}

            {/* Chapter bridges */}
            {[RY[0] + 70, RY[1] + 70, RY[2] + 70, RY[3] + 70].map((y, i) => {
              const isRight = i % 2 === 0
              return (
                <g key={i}>
                  <rect x={isRight ? 575 : 5} y={y} width="60" height="20" rx="10"
                    fill="color-mix(in srgb, var(--rh-ink) 8%, transparent)"
                    stroke="color-mix(in srgb, var(--rh-ink) 15%, transparent)" strokeWidth="1.5"/>
                  <text x={isRight ? 605 : 35} y={y + 14} textAnchor="middle"
                    fontFamily="'Fredoka One',cursive" fontSize="9"
                    fill="color-mix(in srgb, var(--rh-ink) 35%, transparent)">
                    {chapters[i]?.icon} {chapters[i + 1]?.icon ?? ''}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Chapter labels */}
          {chapters.map((ch, i) => (
            <ChapterLabel key={ch.id} chapter={ch} pos={POSITIONS[chapterFirstIdx[i]]} />
          ))}

          {/* Path nodes */}
          {dynamicNodes.map((node, i) => (
            <PathNode
              key={node.id}
              node={node}
              pos={POSITIONS[i]}
              selected={selected.id === node.id}
              onSelect={n => setSelectedId(n.id)}
              onOpenLesson={setModalNode}
            />
          ))}
        </div>
      </div>

      {/* Sticky detail card */}
      <DetailCard node={selected} chapter={selectedChapter} onOpenLesson={setModalNode} />

      {/* Modal */}
      {modalNode && lessons[modalNode.id] && (
        <LessonModal
          node={modalNode}
          chapter={chapters.find(c => c.id === modalNode.chapter)!}
          lesson={lessons[modalNode.id]}
          onClose={() => setModalNode(null)}
          isMobile={isMobile}
          userId={userId}
          onCompleted={handleNodeCompleted}
        />
      )}
    </div>
  )
}

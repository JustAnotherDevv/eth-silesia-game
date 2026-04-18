import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const ink     = 'var(--rh-ink)'
const paper   = 'var(--rh-paper)'
const surface = 'var(--rh-surface)'

// ─── Data ─────────────────────────────────────────────────────

type Status = 'completed' | 'active' | 'locked'

type Node = {
  id:      number
  title:   string
  desc:    string
  icon:    string
  chapter: number
  status:  Status
  xp:      number
  quiz?:   string
}

type Chapter = {
  id:    number
  title: string
  color: string
  icon:  string
  desc:  string
}

const CHAPTERS: Chapter[] = [
  { id: 1, title: 'Finance Basics',     color: '#FFCD00', icon: '🎓', desc: 'The foundations every adult should know — but most never learned.' },
  { id: 2, title: 'Budgeting',          color: '#2D9A4E', icon: '📊', desc: 'Build a spending plan that actually works with your life.' },
  { id: 3, title: 'Smart Saving',       color: '#1565C0', icon: '🏦', desc: 'Make your money work while you sleep.' },
  { id: 4, title: 'Investing',          color: '#FF7B25', icon: '📈', desc: 'Build long-term wealth through markets and assets.' },
  { id: 5, title: 'Financial Mastery',  color: '#7B2D8B', icon: '🏆', desc: 'Advanced strategies for serious wealth building.' },
]

const NODES: Node[] = [
  // Chapter 1
  { id:  1, title: 'What Is Money?',         desc: 'From barter to crypto — how money became the language of value.',               icon: '💰', chapter: 1, status: 'completed', xp: 50,  quiz: '/quiz' },
  { id:  2, title: 'Debit vs Credit',         desc: 'One spends what you have. The other borrows what you don\'t.',                  icon: '💳', chapter: 1, status: 'completed', xp: 75,  quiz: '/quiz' },
  { id:  3, title: 'How Banks Work',          desc: 'Why your money earns 1.5% while the bank charges borrowers 12%.',              icon: '🏦', chapter: 1, status: 'completed', xp: 100, quiz: '/quiz' },
  // Chapter 2
  { id:  4, title: 'The 50/30/20 Rule',       desc: 'The single most practical budgeting framework ever devised.',                   icon: '📊', chapter: 2, status: 'completed', xp: 100, quiz: '/quiz' },
  { id:  5, title: 'Tracking Expenses',       desc: 'You can\'t improve what you don\'t measure. Here\'s how.',                    icon: '📝', chapter: 2, status: 'active',    xp: 120, quiz: '/quiz' },
  { id:  6, title: 'Emergency Funds',         desc: 'Three to six months of expenses between you and financial disaster.',           icon: '🛡️', chapter: 2, status: 'locked',   xp: 150 },
  // Chapter 3
  { id:  7, title: 'Compound Interest',       desc: 'The eighth wonder of the world — and why starting early is everything.',       icon: '🌱', chapter: 3, status: 'locked',    xp: 150 },
  { id:  8, title: 'High-Yield Savings',      desc: 'Why a 4.5% savings account beats a 1.5% one by 3× over 10 years.',            icon: '📈', chapter: 3, status: 'locked',    xp: 175 },
  { id:  9, title: 'Savings Goals',           desc: 'Short-term, medium-term, long-term — buckets that make saving automatic.',     icon: '🎯', chapter: 3, status: 'locked',    xp: 200 },
  // Chapter 4
  { id: 10, title: 'Stock Market Basics',     desc: 'Shares, dividends, P/E ratios — demystified in plain language.',               icon: '📉', chapter: 4, status: 'locked',    xp: 200 },
  { id: 11, title: 'Index Funds & ETFs',      desc: 'Why Warren Buffett told his wife to put 90% in an S&P 500 index fund.',       icon: '🗂️', chapter: 4, status: 'locked',   xp: 225 },
  { id: 12, title: 'Risk & Diversification',  desc: 'Don\'t put all your eggs in one basket — the math behind spreading risk.',    icon: '⚖️', chapter: 4, status: 'locked',    xp: 250 },
  // Chapter 5
  { id: 13, title: 'Tax Optimisation',        desc: 'Legal ways to keep more of what you earn — every year, forever.',             icon: '📋', chapter: 5, status: 'locked',    xp: 250 },
  { id: 14, title: 'Real Estate Basics',      desc: 'Buy vs rent, leverage, rental yield — what the numbers actually show.',       icon: '🏠', chapter: 5, status: 'locked',    xp: 275 },
  { id: 15, title: 'Financial Freedom',       desc: 'The FIRE number, passive income, and designing a life without money stress.', icon: '🏆', chapter: 5, status: 'locked',    xp: 300 },
]

// Snake-layout coordinates inside a 640×820 SVG container
// Row 0 L→R: nodes 1-3    Row 1 R→L: nodes 4-6
// Row 2 L→R: nodes 7-9    Row 3 R→L: nodes 10-12
// Row 4 L→R: nodes 13-15
const CX = { A: 95, B: 320, C: 545 }  // column x values
const RY = [120, 270, 420, 570, 720]    // row y values

const POSITIONS: [number, number][] = [
  [CX.A, RY[0]], [CX.B, RY[0]], [CX.C, RY[0]],  // nodes 1-3
  [CX.C, RY[1]], [CX.B, RY[1]], [CX.A, RY[1]],  // nodes 4-6 (R→L)
  [CX.A, RY[2]], [CX.B, RY[2]], [CX.C, RY[2]],  // nodes 7-9
  [CX.C, RY[3]], [CX.B, RY[3]], [CX.A, RY[3]],  // nodes 10-12 (R→L)
  [CX.A, RY[4]], [CX.B, RY[4]], [CX.C, RY[4]],  // nodes 13-15
]

// Full continuous path through all nodes
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

// Progress path: gold line through completed + to active (stops at node 5 center)
const PROGRESS_PATH = [
  `M ${CX.A} ${RY[0]} L ${CX.B} ${RY[0]} L ${CX.C} ${RY[0]}`,
  `C ${CX.C + 65} ${RY[0]}, ${CX.C + 65} ${RY[1]}, ${CX.C} ${RY[1]}`,
  `L ${CX.B} ${RY[1]}`,  // stops at node 5 (active, center of row 1)
].join(' ')

// ─── Small rubber-hose tree decoration SVG ────────────────────
function TreeSVG({ scale = 1 }: { scale?: number }) {
  return (
    <svg viewBox="0 0 48 64" width={48 * scale} height={64 * scale} xmlns="http://www.w3.org/2000/svg">
      {/* Trunk */}
      <rect x="20" y="44" width="8" height="18" rx="4" fill="#7A4E2D" stroke="#1A0800" strokeWidth="2"/>
      {/* Canopy balls — rubber hose style */}
      <circle cx="24" cy="38" r="16" fill="#2D9A4E" stroke="#1A0800" strokeWidth="2.5"/>
      <circle cx="14" cy="44" r="11" fill="#2D9A4E" stroke="#1A0800" strokeWidth="2.5"/>
      <circle cx="34" cy="44" r="11" fill="#2D9A4E" stroke="#1A0800" strokeWidth="2.5"/>
      <circle cx="24" cy="22" r="12" fill="#3BAA5E" stroke="#1A0800" strokeWidth="2"/>
      {/* Shine */}
      <circle cx="18" cy="28" r="4" fill="#5DD07E" opacity="0.5"/>
      {/* Animation */}
      <animateTransform attributeName="transform" type="translate"
        values="0,0;0,-3;0,0" dur="2.4s" repeatCount="indefinite"
        calcMode="spline" keySplines="0.4 0 0.6 1;0.4 0 0.6 1"/>
    </svg>
  )
}

// ─── Animated coin pile decoration ───────────────────────────
function CoinPileSVG() {
  return (
    <svg viewBox="0 0 56 40" width="56" height="40" xmlns="http://www.w3.org/2000/svg">
      {[0,1,2].map(i => (
        <g key={i}>
          <ellipse cx={28 + (i-1)*2} cy={34 - i*10} rx="18" ry="7" fill="#FFCD00" stroke="#1A0800" strokeWidth="2"/>
          <ellipse cx={28 + (i-1)*2} cy={27 - i*10} rx="18" ry="7" fill="#FFE066" stroke="#1A0800" strokeWidth="2"/>
          <text x={28 + (i-1)*2} y={30 - i*10} textAnchor="middle" fontSize="7" fontFamily="'Fredoka One',cursive" fill="#1A0800">$</text>
        </g>
      ))}
    </svg>
  )
}

// ─── Bouncing arrow pointer for active node ───────────────────
function ActivePointerSVG() {
  return (
    <svg viewBox="0 0 44 52" width="44" height="52" xmlns="http://www.w3.org/2000/svg"
      style={{ animation: 'float 1.6s ease-in-out infinite', display: 'block' }}>
      {/* YOU ARE HERE tag */}
      <rect x="0" y="0" width="44" height="20" rx="10" fill="#E63946" stroke="#1A0800" strokeWidth="2"/>
      <text x="22" y="14" textAnchor="middle" fontFamily="'Fredoka One',cursive" fontSize="7.5"
        letterSpacing="0.08em" fill="white">YOU</text>
      {/* Arrow */}
      <path d="M22 20 L30 34 L24 30 L24 50 L20 50 L20 30 L14 34 Z"
        fill="#E63946" stroke="#1A0800" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── Single path node ─────────────────────────────────────────
function PathNode({
  node, pos, selected, onSelect,
}: {
  node: Node
  pos: [number, number]
  selected: boolean
  onSelect: (n: Node) => void
}) {
  const done   = node.status === 'completed'
  const active = node.status === 'active'
  const locked = node.status === 'locked'
  const R      = active ? 38 : 34  // radius

  return (
    <div style={{
      position: 'absolute',
      left:  pos[0] - R,
      top:   pos[1] - R,
      width:  R * 2,
      height: R * 2,
      zIndex: 2,
    }}>
      {/* Pointer above active node */}
      {active && (
        <div style={{
          position: 'absolute',
          bottom: '100%', left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: '6px', zIndex: 5,
        }}>
          <ActivePointerSVG />
        </div>
      )}

      {/* Glow ring on selected */}
      {selected && (
        <div style={{
          position: 'absolute', inset: -8,
          borderRadius: '50%',
          background: 'transparent',
          border: `3px solid ${done ? '#FFCD00' : active ? '#E63946' : '#7B2D8B'}`,
          animation: 'heartbeat 1.5s ease-in-out infinite',
          opacity: 0.55,
        }}/>
      )}

      {/* Main circle */}
      <div
        onClick={() => !locked && onSelect(node)}
        style={{
          width: '100%', height: '100%',
          borderRadius: '50%',
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

      {/* XP badge for completed */}
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

// ─── Chapter label floating beside its first node ─────────────
function ChapterLabel({ chapter, pos }: { chapter: Chapter; pos: [number, number] }) {
  // Offset to the side: odd chapters left-heavy, even right-heavy
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
        borderRadius: '9999px',
        padding: '4px 12px',
        boxShadow: `3px 3px 0 ${ink}`,
        whiteSpace: 'nowrap',
        fontFamily: "'Fredoka One', cursive",
        fontSize: '0.62rem', letterSpacing: '0.1em',
        color: '#1A0800',
        display: 'flex', alignItems: 'center', gap: '5px',
      }}>
        <span>{chapter.icon}</span>
        <span>{chapter.title}</span>
      </div>
    </div>
  )
}

// ─── Detail card at bottom ────────────────────────────────────
function DetailCard({ node, chapter }: { node: Node; chapter: Chapter }) {
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
      {/* Icon circle */}
      <div style={{
        width: '54px', height: '54px', borderRadius: '50%', flexShrink: 0,
        background: chapter.color, border: `2.5px solid ${ink}`,
        boxShadow: `3px 3px 0 ${ink}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.7rem',
      }}>{done ? '✓' : node.icon}</div>

      {/* Text */}
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

      {/* XP + CTA */}
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
        {(active || done) && node.quiz && (
          <Link to={node.quiz} style={{
            fontFamily: "'Fredoka One', cursive", fontSize: '0.82rem',
            letterSpacing: '0.06em', padding: '10px 22px',
            borderRadius: '9999px', border: `2.5px solid ${ink}`,
            background: active ? '#E63946' : '#FFCD00',
            color: active ? '#FEF9EE' : '#1A0800',
            boxShadow: `3px 3px 0 ${ink}`,
            textDecoration: 'none', whiteSpace: 'nowrap',
            transition: 'transform 0.1s, box-shadow 0.1s',
            display: 'inline-block',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.transform = 'translate(-2px,-2px)'; e.currentTarget.style.boxShadow = `5px 5px 0 ${ink}` }}
          onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `3px 3px 0 ${ink}` }}
          >{done ? 'Review →' : 'Start Lesson →'}</Link>
        )}
      </div>
    </div>
  )
}

// ─── Overall progress header ──────────────────────────────────
function ProgressHeader() {
  const done     = NODES.filter(n => n.status === 'completed').length
  const totalXP  = NODES.filter(n => n.status === 'completed').reduce((s, n) => s + n.xp, 0)
  const pct      = Math.round((done / NODES.length) * 100)
  const chapter  = CHAPTERS[Math.floor(done / 3)]

  return (
    <div style={{
      background: paper, borderBottom: `3px solid ${ink}`,
      padding: '16px 28px',
      display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
    }}>
      {/* Title */}
      <div style={{ flex: 1, minWidth: '200px' }}>
        <h1 className="text-4xl font-bold" style={{
          marginBottom: '4px',
        }}>Learning Path</h1>
        <p style={{
          fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600,
          fontSize: '0.8rem', opacity: 0.55, margin: 0,
        }}>
          Currently studying: <strong>{chapter?.title ?? 'Advanced'}</strong>
        </p>
      </div>

      {/* Stats pills */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { label: 'Completed',   value: `${done}/${NODES.length}`, accent: '#2D9A4E' },
          { label: 'Total XP',    value: `${totalXP}`,              accent: '#FFCD00' },
          { label: 'Progress',    value: `${pct}%`,                 accent: '#1565C0' },
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

      {/* Overall progress bar */}
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
        {/* Chapter markers */}
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

// ─── Main page ────────────────────────────────────────────────

export default function Path() {
  const activeNode = NODES.find(n => n.status === 'active')!
  const [selected, setSelected] = useState<Node>(activeNode)

  const selectedChapter = CHAPTERS.find(c => c.id === selected.chapter)!

  // Chapter first-node indices: 0, 3, 6, 9, 12
  const chapterFirstIdx = CHAPTERS.map(ch => NODES.findIndex(n => n.chapter === ch.id))

  return (
    <div style={{ minHeight: '100vh', background: surface }}>
      <ProgressHeader />

      {/* Scrollable path area */}
      <div style={{
        padding: '28px 20px 24px',
        display: 'flex', justifyContent: 'center',
        backgroundImage: 'radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px), radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px)',
        backgroundSize: '22px 22px', backgroundPosition: '0 0, 11px 11px',
      }}>
        {/* Path container */}
        <div style={{ position: 'relative', width: '640px', height: '840px', flexShrink: 0 }}>

          {/* ── SVG layer: track + progress + decorations ─── */}
          <svg width="640" height="840" style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'visible' }}>
            <defs>
              {/* Gold progress gradient */}
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFCD00"/>
                <stop offset="100%" stopColor="#2D9A4E"/>
              </linearGradient>
              {/* Drop shadow for nodes */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
              </filter>
            </defs>

            {/* ── Base track (dashed) ─────────────────────── */}
            <path d={FULL_PATH}
              fill="none" stroke="color-mix(in srgb, var(--rh-ink) 22%, transparent)"
              strokeWidth="10" strokeLinecap="round"
              strokeDasharray="16 10"/>

            {/* ── Solid base track (thinner, on top of dashes) */}
            <path d={FULL_PATH}
              fill="none" stroke="color-mix(in srgb, var(--rh-ink) 18%, transparent)"
              strokeWidth="6" strokeLinecap="round"/>

            {/* ── Gold progress track ─────────────────────── */}
            <path d={PROGRESS_PATH}
              fill="none" stroke="url(#goldGrad)"
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray="20 6"/>

            {/* ── Progress glow ───────────────────────────── */}
            <path d={PROGRESS_PATH}
              fill="none" stroke="#FFCD00"
              strokeWidth="4" strokeLinecap="round"
              opacity="0.35"/>

            {/* ── Decorative trees ────────────────────────── */}
            <foreignObject x="188" y="172" width="56" height="72">
              <div style={{ width: 56, height: 72 }}>
                <TreeSVG scale={0.9} />
              </div>
            </foreignObject>
            <foreignObject x="380" y="172" width="48" height="64">
              <div style={{ width: 48, height: 64 }}>
                <TreeSVG scale={0.75} />
              </div>
            </foreignObject>
            <foreignObject x="220" y="322" width="48" height="64">
              <div style={{ width: 48, height: 64 }}>
                <TreeSVG scale={0.8} />
              </div>
            </foreignObject>
            <foreignObject x="370" y="472" width="56" height="72">
              <div style={{ width: 56, height: 72 }}>
                <TreeSVG scale={0.85} />
              </div>
            </foreignObject>
            <foreignObject x="180" y="622" width="48" height="64">
              <div style={{ width: 48, height: 64 }}>
                <TreeSVG scale={0.75} />
              </div>
            </foreignObject>

            {/* ── Coin pile decorations (near completed nodes) */}
            <foreignObject x="60" y="142" width="56" height="40">
              <div style={{ width: 56, height: 40 }}><CoinPileSVG /></div>
            </foreignObject>
            <foreignObject x="294" y="145" width="56" height="40">
              <div style={{ width: 56, height: 40 }}><CoinPileSVG /></div>
            </foreignObject>

            {/* ── Scattered stars ─────────────────────────── */}
            {[
              {x:50,  y:80},  {x:590, y:85},  {x:52,  y:236},
              {x:592, y:232}, {x:300, y:62},  {x:300, y:208},
            ].map((s,i) => (
              <text key={i} x={s.x} y={s.y} textAnchor="middle" fontSize="18"
                fill="#FFCD00" stroke="#1A0800" strokeWidth="0.8" opacity={i < 4 ? 0.9 : 0.4}>
                ✦
                <animate attributeName="opacity"
                  values={i < 4 ? '0.9;0.4;0.9' : '0.4;0.8;0.4'}
                  dur={`${1.8 + i * 0.4}s`} repeatCount="indefinite"/>
              </text>
            ))}

            {/* ── Chapter transition bridge decorations ───── */}
            {[RY[0] + 70, RY[1] + 70, RY[2] + 70, RY[3] + 70].map((y, i) => {
              const isRight = i % 2 === 0
              return (
                <g key={i}>
                  <rect x={isRight ? 575 : 5} y={y} width="60" height="20" rx="10"
                    fill="color-mix(in srgb, var(--rh-ink) 8%, transparent)"
                    stroke="color-mix(in srgb, var(--rh-ink) 15%, transparent)" strokeWidth="1.5"/>
                  <text x={isRight ? 605 : 35} y={y+14} textAnchor="middle"
                    fontFamily="'Fredoka One',cursive" fontSize="9"
                    fill="color-mix(in srgb, var(--rh-ink) 35%, transparent)">
                    {CHAPTERS[i].icon} {CHAPTERS[i + 1]?.icon ?? ''}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* ── Chapter labels ──────────────────────────── */}
          {CHAPTERS.map((ch, i) => (
            <ChapterLabel key={ch.id} chapter={ch} pos={POSITIONS[chapterFirstIdx[i]]} />
          ))}

          {/* ── Path nodes ─────────────────────────────── */}
          {NODES.map((node, i) => (
            <PathNode
              key={node.id}
              node={node}
              pos={POSITIONS[i]}
              selected={selected.id === node.id}
              onSelect={setSelected}
            />
          ))}
        </div>
      </div>

      {/* Sticky bottom detail card */}
      <DetailCard node={selected} chapter={selectedChapter} />
    </div>
  )
}

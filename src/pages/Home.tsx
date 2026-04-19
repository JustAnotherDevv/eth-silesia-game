import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getUser } from '../lib/api'
import { getSession } from '../lib/session'
import { useIsMobile } from '../lib/responsive'
import { useOrg } from '../contexts/OrgContext'
import { getHomeContent, type HomeContent, type GameModeCompact } from '../data/homeContent'

const FLIP_MS   = 700
const ink    = 'var(--rh-ink)'
const paper  = 'var(--rh-paper)'
const surface = 'var(--rh-surface)'
const card   = 'var(--rh-card)'

const TODAY = new Date().toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
})

const DEFAULT_PLAYER = { name: 'You', level: 1, xp: 0, xpMax: 500, streak: 0,
  badges: [] as string[], avatar: '🎩' }

// ─── Spread content for pages 2 & 3 ──────────────────────────

function PageGameModes({ modes }: { modes: GameModeCompact[] }) {
  return (
    <div style={{ padding: '16px' }}>
      {modes.map((m, i) => (
        <div key={m.tag} style={{ marginBottom: i < modes.length-1 ? '16px' : 0, paddingBottom: i < modes.length-1 ? '16px' : 0, borderBottom: i < modes.length-1 ? `1.5px solid ${ink}` : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ background: m.accent, color: '#1A0800', fontFamily: "'Fredoka One', cursive", fontSize: '0.56rem', letterSpacing: '0.1em', padding: '1px 9px', borderRadius: '9999px', border: `2px solid ${ink}`, boxShadow: `2px 2px 0 ${ink}` }}>{m.tag}</span>
            <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.55rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.45 }}>{m.kicker}</span>
          </div>
          <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1rem', lineHeight: 1.2, marginBottom: '8px', display: 'flex', gap: '7px' }}>
            <span style={{ fontSize: '1.5rem', lineHeight: 1, flexShrink: 0 }}>{m.emoji}</span>
            <span>{m.headline}</span>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FlipBtn accent={m.accent} href={m.href}>Play Now →</FlipBtn>
            <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.62rem', opacity: 0.5 }}>{m.xp}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function PageStreak({ streak, content }: { streak: number; content: HomeContent['streak'] }) {
  const body = content.bodyTemplate.replace('{streak}', String(streak))
  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ background: '#FF7B25', color: '#1A0800', fontFamily: "'Fredoka One', cursive", fontSize: '0.56rem', letterSpacing: '0.1em', padding: '1px 9px', borderRadius: '9999px', border: `2px solid ${ink}`, boxShadow: `2px 2px 0 ${ink}` }}>DAILY STREAK</span>
      </div>
      <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.1rem', lineHeight: 1.2, marginBottom: '8px', display: 'flex', gap: '7px' }}>
        <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>🔥</span>
        <span>{content.headline}</span>
      </h3>
      <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.8rem', lineHeight: 1.55, opacity: 0.72, marginBottom: '14px' }}>
        {body}
      </p>
      <FlipBtn accent="#FF7B25" href="#">Claim Today's Reward →</FlipBtn>
      <Rule />
      <Panel title={content.tipTitle}>
        <div
          style={{ padding: '10px 12px', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.78rem', lineHeight: 1.55 }}
          dangerouslySetInnerHTML={{ __html: content.tipHtml }}
        />
      </Panel>
    </div>
  )
}

function PageAchievements() {
  const earned = [
    { icon: '🏆', label: 'First Quiz',    desc: 'Completed your first round' },
    { icon: '⚡', label: 'Speed Reader',  desc: 'Answered in under 5 seconds' },
    { icon: '🎓', label: 'Finance 101',   desc: 'Completed the basics course' },
  ]
  const locked = [
    { icon: '💰', label: '500 XP Club',   desc: 'Earn 500 XP total' },
    { icon: '🔥', label: '7-Day Streak',  desc: 'Log in 7 days in a row' },
    { icon: '🌟', label: 'Perfect Round', desc: 'Score 5/5 on any quiz' },
  ]
  return (
    <div style={{ padding: '16px' }}>
      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.55, marginBottom: '10px' }}>Earned</div>
      {earned.map(a => (
        <div key={a.label} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '1.3rem', width: '28px', textAlign: 'center' }}>{a.icon}</span>
          <div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.78rem' }}>{a.label}</div>
            <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.68rem', opacity: 0.55 }}>{a.desc}</div>
          </div>
        </div>
      ))}
      <Rule />
      <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.62rem', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.4, marginBottom: '10px' }}>Locked</div>
      {locked.map(a => (
        <div key={a.label} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px', opacity: 0.38 }}>
          <span style={{ fontSize: '1.3rem', width: '28px', textAlign: 'center', filter: 'grayscale(1)' }}>{a.icon}</span>
          <div>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.78rem' }}>{a.label}</div>
            <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.68rem', opacity: 0.55 }}>{a.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PageBackCover({ content }: { content: HomeContent['backCover'] }) {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', marginBottom: '10px' }} className="rh-animate-float">{content.emoji}</div>
      <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.5rem', lineHeight: 1.1, marginBottom: '10px' }}>
        {content.headline}
      </h3>
      <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.85rem', lineHeight: 1.65, opacity: 0.75, marginBottom: '20px' }}>
        {content.body}
      </p>
      <FlipBtn accent="#FFCD00" href={content.ctaHref}>{content.cta}</FlipBtn>
      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1.5px solid ${ink}` }}>
        <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.72rem', opacity: 0.45, fontStyle: 'italic' }}>
          {content.poweredBy}<br />
          {content.tagline}
        </p>
      </div>
    </div>
  )
}

// ─── Old homepage body (spread 0) ────────────────────────────

function OldHomepageBody({ player, content }: { player: typeof DEFAULT_PLAYER; content: HomeContent }) {
  const { hero, gameModesFull, forecast } = content
  return (
    <div>
      {/* Row 1: Hero + Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', borderBottom: `2px solid ${ink}` }}>
        <div style={{
          padding: '20px 20px 20px 0', borderRight: `2px solid ${ink}`,
          cursor: 'pointer', transition: 'background 0.12s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = surface)}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ background: '#E63946', color: '#FEF9EE', fontFamily: "'Fredoka One', cursive", fontSize: '0.6rem', letterSpacing: '0.12em', padding: '2px 10px', borderRadius: '9999px', border: `2px solid ${ink}`, boxShadow: `2px 2px 0 ${ink}` }}>EXCLUSIVE</span>
            <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.55 }}>{hero.eyebrow}</span>
          </div>
          <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(1.6rem, 2.8vw, 2.4rem)', lineHeight: 1.1, marginBottom: '14px' }}>
            {hero.headline}
          </h2>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.88rem', lineHeight: 1.65, opacity: 0.8, marginBottom: '16px' }}>
                <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '3rem', lineHeight: 0.75, float: 'left', marginRight: '6px', marginTop: '4px' }}>{hero.dropCapLetter}</span>
                <span dangerouslySetInnerHTML={{ __html: hero.dropCapRest }} />
              </p>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <FlipBtn accent="#FFCD00" href={hero.ctaHref}>{hero.ctaLabel}</FlipBtn>
                <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.72rem', opacity: 0.55 }}>{hero.meta}</span>
              </div>
            </div>
            <div style={{ width: '120px', height: '120px', borderRadius: '50% 46% 50% 48%', border: `3px solid ${ink}`, background: '#FEF3C7', boxShadow: `4px 4px 0 ${ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', flexShrink: 0 }} className="rh-animate-float">{hero.emoji}</div>
          </div>
        </div>

        {/* Player sidebar */}
        <div style={{ padding: '18px' }}>
          <div style={{ border: `2.5px solid ${ink}`, borderRadius: '1.4rem 1.6rem 1.5rem 1.3rem', boxShadow: `5px 5px 0 ${ink}`, overflow: 'hidden', marginBottom: '14px', background: card }}>
            <div style={{ background: surface, borderBottom: `2px solid ${ink}`, padding: '7px 14px', fontFamily: "'Fredoka One', cursive", fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
              <span>Your Profile</span><span>★</span>
            </div>
            <div style={{ padding: '14px' }}>
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: `3px solid ${ink}`, background: '#FFCD00', boxShadow: `3px 3px 0 ${ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 8px' }} className="rh-hover-wobble">{player.avatar}</div>
                <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.92rem' }}>{player.name}</div>
                <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.55 }}>Level {player.level}</div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.68rem' }}>
                  <span>XP</span><span>{player.xp} / {player.xpMax}</span>
                </div>
                <XPBar value={player.xp} max={player.xpMax} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 12px', borderRadius: '9999px', border: `2px solid ${ink}`, background: '#FF7B25', color: '#FEF9EE', marginBottom: '10px', boxShadow: `2px 2px 0 ${ink}` }}>
                <span style={{ fontSize: '1.1rem' }}>🔥</span>
                <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.76rem' }}>{player.streak}-Day Streak</span>
              </div>
              <div>
                <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.55, marginBottom: '6px' }}>Badges</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {player.badges.length === 0
                    ? <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.6rem', opacity: 0.4 }}>Play to earn badges!</span>
                    : player.badges.map(b => (
                    <span key={b} style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.56rem', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: '9999px', border: `2px solid ${ink}`, background: surface, boxShadow: `1px 1px 0 ${ink}` }}>{b}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ border: `2px solid ${ink}`, borderRadius: '1rem 1.2rem 1rem 1.1rem', padding: '10px 14px', background: surface, boxShadow: `3px 3px 0 ${ink}` }}>
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.6rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.55, marginBottom: '5px' }}>{forecast.label}</div>
            <div
              style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.76rem', lineHeight: 1.5 }}
              dangerouslySetInnerHTML={{ __html: forecast.body }}
            />
          </div>
        </div>
      </div>

      {/* Row 2: Three game modes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderBottom: `2px solid ${ink}` }}>
        {gameModesFull.map((m, i) => (
          <div key={m.tag} style={{ padding: '18px', borderRight: i < 2 ? `2px solid ${ink}` : 'none', cursor: 'pointer', transition: 'background 0.12s' }}
          onMouseEnter={e => (e.currentTarget.style.background = surface)}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span style={{ display: 'inline-block', background: m.accent, color: '#1A0800', fontFamily: "'Fredoka One', cursive", fontSize: '0.58rem', letterSpacing: '0.1em', padding: '2px 10px', borderRadius: '9999px', border: `2px solid ${ink}`, boxShadow: `2px 2px 0 ${ink}`, marginBottom: '8px' }}>{m.tag}</span>
            <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.5, marginBottom: '6px' }}>{m.kicker}</div>
            <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1.05rem', lineHeight: 1.2, marginBottom: '8px', display: 'flex', gap: '7px' }}>
              <span style={{ fontSize: '1.6rem', lineHeight: 1, flexShrink: 0 }}>{m.emoji}</span>
              <span>{m.headline}</span>
            </h3>
            <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.82rem', lineHeight: 1.55, opacity: 0.72, marginBottom: '14px' }}>{m.body}</p>
            <FlipBtn accent={m.accent} href={m.href}>{m.cta}</FlipBtn>
          </div>
        ))}
      </div>

      {/* Row 3: Achievements strip */}
      <div style={{ padding: '9px 0', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.6, borderRight: `2px solid ${ink}`, paddingRight: '14px', flexShrink: 0 }}>Achievements</span>
        {[
          { icon: '🏆', text: 'First Quiz' },
          { icon: '⚡', text: 'Speed Reader' },
          { icon: '🎓', text: 'Finance 101' },
          { icon: '💰', text: '500 XP Club' },
          { icon: '🔥', text: '7-Day Streak' },
        ].map(item => (
          <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.68rem', opacity: 0.5, padding: '3px 10px', borderRadius: '9999px', border: `1.5px dashed ${ink}` }}>
            <span>{item.icon}</span><span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Spread definitions ───────────────────────────────────────

type Spread = {
  label:      string
  headline:   string
  subhead:    string
  isFullPage?: boolean
  left?:      React.ReactNode
  right?:     React.ReactNode
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

export default function Home() {
  const isMobile = useIsMobile()
  const { activeOrgId, theme } = useOrg()
  const content = useMemo(() => getHomeContent(activeOrgId, theme), [activeOrgId, theme])
  const { mastheadSubtitle, sectionNav, ticker, spreads, gameModesFull } = content
  const [player,    setPlayer]    = useState(DEFAULT_PLAYER)
  const [idx,       setIdx]       = useState(0)
  const [flipping,  setFlipping]  = useState(false)
  const [dir,       setDir]       = useState<'fwd'|'bwd'>('fwd')
  const [targetIdx, setTargetIdx] = useState(0)

  const session = getSession()
  useEffect(() => {
    if (!session?.id) return
    getUser(session.id).then(u => {
      const XP_LEVELS = [
        { min: 10000, label: 'Legend',  xpMax: 10000 },
        { min: 5000,  label: 'Expert',  xpMax: 10000 },
        { min: 2000,  label: 'Pro',     xpMax: 5000  },
        { min: 500,   label: 'Rising',  xpMax: 2000  },
        { min: 0,     label: 'Rookie',  xpMax: 500   },
      ]
      const lvl   = XP_LEVELS.find(l => u.xp >= l.min) ?? XP_LEVELS[XP_LEVELS.length - 1]
      setPlayer({
        name:   u.display_name,
        level:  XP_LEVELS.indexOf(lvl) + 1,
        xp:     u.xp,
        xpMax:  lvl.xpMax,
        streak: u.streak,
        badges: [],
        avatar: u.avatar,
      })
    }).catch(() => {
      if (session) setPlayer(p => ({ ...p, name: session.displayName, avatar: session.avatar }))
    })
  }, [session?.id])

  const SPREADS: Spread[] = [
    { ...spreads[0], isFullPage: true },
    {
      ...spreads[1],
      left:  <PageStreak streak={player.streak} content={content.streak} />,
      right: <PageGameModes modes={content.gameModesCompact} />,
    },
    {
      ...spreads[2],
      left:  <PageAchievements />,
      right: <PageBackCover content={content.backCover} />,
    },
  ]

  const flip = useCallback((direction: 'fwd'|'bwd') => {
    const next = direction === 'fwd' ? idx + 1 : idx - 1
    if (flipping || next < 0 || next >= SPREADS.length) return
    setDir(direction)
    setTargetIdx(next)
    setFlipping(true)
    // @keyframes animation starts automatically on mount; settle state after it ends
    setTimeout(() => {
      setIdx(next)
      setFlipping(false)
    }, FLIP_MS + 20)
  }, [idx, flipping])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') flip('fwd')
      if (e.key === 'ArrowLeft')  flip('bwd')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [flip])

  // Measure spread-0's full newspaper height once fonts load,
  // then lock the newspaper box to that height forever.
  const paperRef    = useRef<HTMLDivElement>(null)
  const [paperHeight, setPaperHeight] = useState(0)
  useEffect(() => {
    document.fonts.ready.then(() => {
      if (paperRef.current) setPaperHeight(paperRef.current.scrollHeight)
    })
  }, [])

  const curr = SPREADS[idx]
  const tgt  = SPREADS[targetIdx]

  // CSS @keyframes plays automatically on mount — no rAF needed
  const leafAnim = (origin: 'left center' | 'right center'): React.CSSProperties => ({
    position: 'relative', zIndex: 1,
    transformOrigin: origin,
    transformStyle: 'preserve-3d',
    animation: `flip-page-${dir} ${FLIP_MS}ms cubic-bezier(0.645, 0.045, 0.355, 1.000) both`,
  })

  // Shadow overlay helpers (direction = which side the spine/fold is on)
  const shadeLeaf = (fromSide: 'left'|'right') => (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
      background: fromSide === 'left'
        ? 'linear-gradient(to right, rgba(0,0,0,0.28) 0%, transparent 70%)'
        : 'linear-gradient(to left,  rgba(0,0,0,0.28) 0%, transparent 70%)',
      animation: `flip-shade ${FLIP_MS}ms ease-in-out both`,
    }}/>
  )
  const castShadow = (fromSide: 'left'|'right') => (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
      background: fromSide === 'left'
        ? 'linear-gradient(to right, rgba(0,0,0,0.35) 0%, transparent 65%)'
        : 'linear-gradient(to left,  rgba(0,0,0,0.35) 0%, transparent 65%)',
      animation: `flip-cast ${FLIP_MS}ms ease-out both`,
    }}/>
  )
  const spineHighlight = (side: 'left'|'right') => (
    <div style={{ position: 'absolute', top: 0, bottom: 0, pointerEvents: 'none', zIndex: 11,
      ...(side === 'left' ? { left: 0, width: '6px' } : { right: 0, width: '6px' }),
      background: side === 'left'
        ? 'linear-gradient(to right, rgba(255,255,255,0.55) 0%, transparent 100%)'
        : 'linear-gradient(to left,  rgba(255,255,255,0.55) 0%, transparent 100%)',
      animation: `flip-highlight ${FLIP_MS}ms ease-in-out both`,
    }}/>
  )

  function renderBody() {
    // ── Case A: static at spread 0 (full-page) ──────────────
    if (idx === 0 && !flipping) {
      return (
        <div onClick={() => flip('fwd')} style={{ cursor: 'e-resize', height: '100%' }}>
          <OldHomepageBody player={player} content={content} />
        </div>
      )
    }

    // ── Case B: forward flip FROM spread 0 ──────────────────
    if (flipping && dir === 'fwd' && idx === 0) {
      return (
        <div style={{ position: 'relative' }}>
          {/* Revealed: spread 1 two-column with cast shadow */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <TwoColSpread left={tgt.left} right={tgt.right} />
            {castShadow('left')}
          </div>
          {/* Leaf: full old homepage sweeps left */}
          <div style={leafAnim('left center')}>
            <div style={{ backfaceVisibility: 'hidden', background: paper, position: 'relative' }}>
              <OldHomepageBody player={player} content={content} />
              {shadeLeaf('left')}
              {spineHighlight('left')}
            </div>
            <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute', inset: 0, background: paper }}>
              {tgt.left}
              {shadeLeaf('right')}
            </div>
          </div>
        </div>
      )
    }

    // ── Case C: backward flip TO spread 0 ───────────────────
    if (flipping && dir === 'bwd' && targetIdx === 0) {
      return (
        <div style={{ position: 'relative' }}>
          {/* Revealed: spread 0 full-page with cast shadow */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <OldHomepageBody player={player} content={content} />
            {castShadow('right')}
          </div>
          {/* Leaf: current spread sweeps right */}
          <div style={leafAnim('right center')}>
            <div style={{ backfaceVisibility: 'hidden', background: paper, position: 'relative' }}>
              <TwoColSpread left={curr.left} right={curr.right} />
              {shadeLeaf('right')}
              {spineHighlight('right')}
            </div>
            <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute', inset: 0, background: paper }}>
              {shadeLeaf('left')}
            </div>
          </div>
        </div>
      )
    }

    // ── Case D: normal two-column flips (spreads 1 ↔ 2) ────
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%' }}>

        {/* Left column */}
        <div style={{ borderRight: `2px solid ${ink}`, position: 'relative' }}>
          {flipping && dir === 'bwd' ? (
            <div style={{ position: 'relative' }}>
              {/* Revealed page + cast shadow */}
              <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                {tgt.left}
                {castShadow('right')}
              </div>
              <div style={leafAnim('right center')}>
                <div style={{ backfaceVisibility: 'hidden', background: paper, position: 'relative' }}>
                  {curr.left}
                  {shadeLeaf('right')}
                  {spineHighlight('right')}
                </div>
                <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute', inset: 0, background: paper }}>
                  {tgt.right}
                  {shadeLeaf('left')}
                </div>
              </div>
            </div>
          ) : (
            <div onClick={() => !flipping && idx > 0 && flip('bwd')} style={{ cursor: idx > 0 ? 'w-resize' : 'default' }}>
              {curr.left}
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ position: 'relative' }}>
          {flipping && dir === 'fwd' ? (
            <div style={{ position: 'relative' }}>
              {/* Revealed page + cast shadow */}
              <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
                {tgt.right}
                {castShadow('left')}
              </div>
              <div style={leafAnim('left center')}>
                <div style={{ backfaceVisibility: 'hidden', background: paper, position: 'relative' }}>
                  {curr.right}
                  {shadeLeaf('left')}
                  {spineHighlight('left')}
                </div>
                <div style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute', inset: 0, background: paper }}>
                  {tgt.left}
                  {shadeLeaf('right')}
                </div>
              </div>
            </div>
          ) : (
            <div onClick={() => !flipping && idx < SPREADS.length-1 && flip('fwd')} style={{ cursor: idx < SPREADS.length-1 ? 'e-resize' : 'default' }}>
              {curr.right}
            </div>
          )}
        </div>

      </div>
    )
  }

  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: surface, padding: '16px 16px 72px' }}>
        {/* Masthead */}
        <div style={{ textAlign: 'center', padding: '16px 12px', border: `3px solid ${ink}`, borderRadius: '1.2rem', background: paper, marginBottom: '12px' }}>
          <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(2rem,10vw,3.2rem)', lineHeight: 1, margin: '0 0 4px', letterSpacing: '-0.01em' }}>Knowly</h1>
          <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.55, margin: 0 }}>{mastheadSubtitle}</p>
        </div>

        {/* Player card */}
        <div style={{ border: `2.5px solid ${ink}`, borderRadius: '1.2rem', boxShadow: `4px 4px 0 ${ink}`, overflow: 'hidden', marginBottom: '14px', background: paper }}>
          <div style={{ background: surface, borderBottom: `2px solid ${ink}`, padding: '7px 14px', fontFamily: "'Fredoka One', cursive", fontSize: '0.65rem', letterSpacing: '0.14em', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
            <span>Your Profile</span><span>★</span>
          </div>
          <div style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: `3px solid ${ink}`, background: '#FFCD00', boxShadow: `3px 3px 0 ${ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>{player.avatar}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1rem' }}>{player.name}</div>
              <div style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.62rem', textTransform: 'uppercase', opacity: 0.55 }}>Level {player.level} · {player.xp}/{player.xpMax} XP</div>
              <div style={{ marginTop: '6px', height: '6px', borderRadius: '9999px', background: surface, border: `1.5px solid ${ink}`, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min((player.xp/player.xpMax)*100, 100)}%`, background: '#FFCD00', borderRadius: '9999px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '5px 10px', borderRadius: '9999px', border: `2px solid ${ink}`, background: '#FF7B25', color: '#FEF9EE', flexShrink: 0 }}>
              <span>🔥</span><span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.75rem' }}>{player.streak}</span>
            </div>
          </div>
        </div>

        {/* Game modes */}
        {gameModesFull.map(m => (
          <Link key={m.tag} to={m.href} style={{ display: 'block', textDecoration: 'none', color: ink, border: `2.5px solid ${ink}`, borderRadius: '1.2rem', boxShadow: `4px 4px 0 ${ink}`, overflow: 'hidden', marginBottom: '12px', background: paper }}>
            <div style={{ background: m.accent, borderBottom: `2px solid ${ink}`, padding: '6px 14px', fontFamily: "'Fredoka One', cursive", fontSize: '0.62rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1A0800' }}>{m.tag}</div>
            <div style={{ padding: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '2.4rem', flexShrink: 0 }}>{m.emoji}</span>
              <div>
                <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: '1rem', lineHeight: 1.2, margin: '0 0 4px' }}>{m.headline}</h3>
                <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 500, fontSize: '0.8rem', opacity: 0.7, margin: 0, lineHeight: 1.4 }}>{m.body}</p>
              </div>
            </div>
          </Link>
        ))}

        {/* Breaking ticker */}
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, height: '36px', borderTop: `3px solid ${ink}`, display: 'flex', alignItems: 'center', overflow: 'hidden', background: '#E63946', color: '#FEF9EE' }}>
          <div style={{ flexShrink: 0, height: '100%', display: 'flex', alignItems: 'center', padding: '0 10px', background: '#1A0800', color: '#FFCD00', fontFamily: "'Fredoka One', cursive", fontSize: '0.62rem', letterSpacing: '0.1em', borderRight: `3px solid ${ink}`, whiteSpace: 'nowrap' }}>BREAKING</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <span style={{ display: 'inline-block', whiteSpace: 'nowrap', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.72rem', animation: 'ticker-scroll 55s linear infinite' }}>
              {[...ticker, ...ticker].join('   ·   ')}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: surface,
      backgroundImage: 'radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px), radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px)',
      backgroundSize: '22px 22px', backgroundPosition: '0 0, 11px 11px',
      padding: '28px 20px 56px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>

      {/* ── NEWSPAPER ─────────────────────────────────────── */}
      <div ref={paperRef} style={{
        width: '100%', maxWidth: '1020px',
        background: paper,
        border: `3px solid ${ink}`,
        borderRadius: '2.2rem 2rem 2.2rem 2.1rem',
        boxShadow: `8px 8px 0 ${ink}, 14px 14px 0 color-mix(in srgb, ${ink} 18%, transparent)`,
        transform: 'rotate(-0.3deg)',
        overflow: 'hidden',
        backgroundImage: 'radial-gradient(circle, var(--rh-body-dot) 0.8px, transparent 0.8px)',
        backgroundSize: '16px 16px',
        // Lock to spread-0 height so flipping never resizes the newspaper
        ...(paperHeight > 0 ? { height: `${paperHeight}px`, display: 'flex', flexDirection: 'column' } : { display: 'flex', flexDirection: 'column' }),
      }}>

        {/* ── Top meta ──────────────────────────────────────── */}
        <div style={{ borderBottom: `2px solid ${ink}`, padding: '5px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.63rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.65 }}>
          <span>Vol. I · No. 42 · Est. 2026</span>
          <span>{TODAY}</span>
          <span>Price: Free of Charge</span>
        </div>

        {/* ── Masthead (old non-inverted style) ─────────────── */}
        <div style={{ textAlign: 'center', padding: '20px 22px 14px', borderBottom: `4px double ${ink}`, position: 'relative' }}>
          <div style={{ position: 'absolute', left: '28px', top: '50%', transform: 'translateY(-50%)', fontFamily: "'Fredoka One', cursive", fontSize: '1.1rem', opacity: 0.25, letterSpacing: '0.3em' }} className="rh-animate-float">✦ ✦ ✦</div>
          <div style={{ position: 'absolute', right: '28px', top: '50%', transform: 'translateY(-50%)', fontFamily: "'Fredoka One', cursive", fontSize: '1.1rem', opacity: 0.25, letterSpacing: '0.3em' }} className="rh-animate-float">✦ ✦ ✦</div>
          <p style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.6rem', letterSpacing: '0.35em', textTransform: 'uppercase', opacity: 0.5, marginBottom: '4px' }}>★ The Original · Est. 2026 ★</p>
          <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(2.8rem, 8vw, 5.5rem)', lineHeight: 1, margin: 0, letterSpacing: '-0.01em', textShadow: `4px 4px 0 ${ink}, 6px 6px 0 color-mix(in srgb, ${ink} 20%, transparent)` }}>
            Knowly
          </h1>
          <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.55, marginTop: '8px', borderTop: `1px solid ${ink}`, borderBottom: `1px solid ${ink}`, padding: '4px 0', display: 'inline-block' }}>
            {mastheadSubtitle}
          </p>
        </div>

        {/* ── Section nav ───────────────────────────────────── */}
        <div style={{ borderBottom: `2px solid ${ink}`, display: 'flex', justifyContent: 'center' }}>
          {sectionNav.map((s,i,arr) => (
            <button key={s} style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 20px', borderRight: i < arr.length-1 ? `1.5px solid ${ink}` : 'none', background: 'transparent', cursor: 'pointer', transition: 'background 0.1s', opacity: 0.75 }}
              onMouseEnter={e=>(e.currentTarget.style.background=surface)} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>{s}</button>
          ))}
        </div>

        {/* ── Per-spread headline — always rendered so height is identical on every page ── */}
        <div style={{ padding: '12px 18px 0', borderBottom: `1.5px solid ${ink}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
            <span style={{ background: ink, color: paper, fontFamily: "'Fredoka One', cursive", fontSize: '0.58rem', letterSpacing: '0.14em', padding: '2px 10px', borderRadius: '9999px' }}>
              {(flipping ? tgt : curr).label.toUpperCase()}
            </span>
            <span style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 700, fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.45 }}>
              Page {(flipping ? targetIdx : idx)+1} of {SPREADS.length}
            </span>
          </div>
          <h2 style={{ fontFamily: "'Fredoka One', cursive", fontSize: 'clamp(1.2rem, 2.5vw, 2rem)', lineHeight: 1.1, marginBottom: '4px' }}>
            {(flipping ? tgt : curr).headline}
          </h2>
          <p style={{ fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.78rem', lineHeight: 1.4, opacity: 0.6, fontStyle: 'italic', marginBottom: '10px' }}>
            {(flipping ? tgt : curr).subhead}
          </p>
        </div>

        {/* ── Body — flex:1 fills whatever space is left so all spreads match ── */}
        <div style={{
          perspective: '900px',
          perspectiveOrigin: dir === 'fwd' ? '65% 85%' : '35% 85%',
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}>
          {renderBody()}
        </div>

        {/* ── Navigation bar ────────────────────────────────── */}
        <div style={{ borderTop: `2px solid ${ink}`, padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: surface, flexShrink: 0 }}>
          <NavArrow disabled={idx === 0 || flipping} onClick={() => flip('bwd')}>← Prev Page</NavArrow>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {SPREADS.map((_, i) => (
              <div key={i} onClick={() => { if (!flipping) { if (i > idx) flip('fwd'); else if (i < idx) flip('bwd') } }} style={{ width: i === idx ? '24px' : '10px', height: '10px', borderRadius: '9999px', border: `2px solid ${ink}`, background: i === idx ? ink : 'transparent', transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)', cursor: 'pointer' }} />
            ))}
          </div>
          <NavArrow disabled={idx === SPREADS.length-1 || flipping} onClick={() => flip('fwd')}>Next Page →</NavArrow>
        </div>

      </div>

      {/* ── Breaking ticker ───────────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, height: '36px', borderTop: `3px solid ${ink}`, display: 'flex', alignItems: 'center', overflow: 'hidden', background: '#E63946', color: '#FEF9EE' }}>
        <div style={{ flexShrink: 0, height: '100%', display: 'flex', alignItems: 'center', padding: '0 14px', background: '#1A0800', color: '#FFCD00', fontFamily: "'Fredoka One', cursive", fontSize: '0.68rem', letterSpacing: '0.12em', borderRight: `3px solid ${ink}`, whiteSpace: 'nowrap' }}>BREAKING</div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <span style={{ display: 'inline-block', whiteSpace: 'nowrap', fontFamily: "'Fredoka Variable', sans-serif", fontWeight: 600, fontSize: '0.78rem', letterSpacing: '0.03em', animation: 'ticker-scroll 55s linear infinite' }}>
            {[...ticker, ...ticker].join('   ·   ')}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────

function TwoColSpread({ left, right }: { left?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100%' }}>
      <div style={{ borderRight: `2px solid ${ink}` }}>{left}</div>
      <div>{right}</div>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: `2.5px solid ${ink}`, borderRadius: '1.2rem 1.4rem 1.2rem 1.3rem', overflow: 'hidden', boxShadow: `4px 4px 0 ${ink}`, background: card }}>
      <div style={{ background: ink, color: paper, padding: '5px 12px', fontFamily: "'Fredoka One', cursive", fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', textAlign: 'center' }}>{title}</div>
      {children}
    </div>
  )
}

function Rule() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0' }}>
      <div style={{ flex: 1, height: '1.5px', background: ink, opacity: 0.4 }} />
      <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.7rem', opacity: 0.4 }}>✦</span>
      <div style={{ flex: 1, height: '1.5px', background: ink, opacity: 0.4 }} />
    </div>
  )
}

function XPBar({ value, max }: { value: number; max: number }) {
  return (
    <div style={{ height: '12px', borderRadius: '9999px', border: `2px solid ${ink}`, background: surface, boxShadow: `2px 2px 0 ${ink}`, overflow: 'hidden' }}>
      <div style={{ width: `${(value/max)*100}%`, height: '100%', background: '#FFCD00', borderRight: `2px solid ${ink}`, borderRadius: '9999px' }} />
    </div>
  )
}

function FlipBtn({ accent, href, children }: { accent: string; href: string; children: React.ReactNode }) {
  return (
    <Link to={href} style={{ display: 'inline-block', textDecoration: 'none', fontFamily: "'Fredoka One', cursive", fontSize: '0.75rem', letterSpacing: '0.07em', padding: '7px 18px', borderRadius: '9999px', border: `2.5px solid ${ink}`, background: accent, color: '#1A0800', boxShadow: `3px 3px 0 ${ink}`, transition: 'transform 0.1s, box-shadow 0.1s' }}
    onMouseEnter={e=>{e.currentTarget.style.transform='translate(-2px,-2px)';e.currentTarget.style.boxShadow=`5px 5px 0 ${ink}`}}
    onMouseLeave={e=>{e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=`3px 3px 0 ${ink}`}}
    onMouseDown={e=>{e.currentTarget.style.transform='translate(2px,2px)';e.currentTarget.style.boxShadow=`1px 1px 0 ${ink}`}}
    onMouseUp={e=>{e.currentTarget.style.transform='translate(-2px,-2px)';e.currentTarget.style.boxShadow=`5px 5px 0 ${ink}`}}
    >{children}</Link>
  )
}

function NavArrow({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ fontFamily: "'Fredoka One', cursive", fontSize: '0.72rem', letterSpacing: '0.07em', padding: '6px 16px', borderRadius: '9999px', border: `2px solid ${ink}`, background: disabled ? 'transparent' : ink, color: disabled ? ink : paper, boxShadow: disabled ? 'none' : `3px 3px 0 ${surface}`, opacity: disabled ? 0.3 : 1, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'transform 0.1s, box-shadow 0.1s' }}
    onMouseEnter={e=>{if(!disabled){e.currentTarget.style.transform='translate(-1px,-1px)';e.currentTarget.style.boxShadow=`4px 4px 0 ${surface}`}}}
    onMouseLeave={e=>{if(!disabled){e.currentTarget.style.transform='';e.currentTarget.style.boxShadow=`3px 3px 0 ${surface}`}}}
    >{children}</button>
  )
}


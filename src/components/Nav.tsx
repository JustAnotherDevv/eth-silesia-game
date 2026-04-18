import { Link, useLocation } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'

const LINKS = [
  { to: '/',            label: 'Home' },
  { to: '/news',        label: 'News' },
  { to: '/quiz',        label: 'Quick Rounds' },
  { to: '/design',      label: 'Design' },
  { to: '/path',        label: 'My Path' },
  { to: '/decision',    label: 'Decision Room' },
]

const RIGHT_LINKS = [
  { to: '/leaderboard', label: '🏆 Leaderboard', accent: '#FFCD00' },
  { to: '/profile',     label: '🎩 Profile',     accent: '#FF7B25' },
]

export function Nav() {
  const { pathname } = useLocation()

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      borderBottom: '2.5px solid var(--rh-ink)',
      background: 'var(--rh-paper)',
      display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: '4px',
      backgroundImage: 'radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px)',
      backgroundSize: '18px 18px',
    }}>
      {/* Logo */}
      <Link to="/" style={{
        fontFamily: "'Fredoka One', cursive",
        fontSize: '1.1rem',
        letterSpacing: '0.02em',
        paddingRight: '16px',
        borderRight: '2px solid var(--rh-ink)',
        marginRight: '8px',
        textDecoration: 'none',
        color: 'var(--rh-ink)',
        whiteSpace: 'nowrap',
        opacity: 0.9,
      }}>★ XP Gazette</Link>

      {/* Nav links */}
      {LINKS.map(({ to, label }) => {
        const active = pathname === to
        return (
          <Link key={to} to={to} style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: '0.72rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            padding: '10px 14px',
            borderRadius: '9999px',
            color: 'var(--rh-ink)',
            background: active ? 'var(--rh-ink)' : 'transparent',
            color: active ? 'var(--rh-paper)' : 'var(--rh-ink)',
            boxShadow: active ? '2px 2px 0 var(--rh-ink)' : 'none',
            transition: 'background 0.1s, color 0.1s',
          } as React.CSSProperties}
          onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--rh-surface)' }}
          onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
          >{label}</Link>
        )
      })}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {RIGHT_LINKS.map(({ to, label, accent }) => {
          const active = pathname === to
          return (
            <Link key={to} to={to} style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: '0.72rem',
              letterSpacing: '0.08em',
              textDecoration: 'none',
              padding: '7px 14px',
              borderRadius: '9999px',
              border: `2px solid var(--rh-ink)`,
              background: active ? 'var(--rh-ink)' : accent,
              color: active ? 'var(--rh-paper)' : '#1A0800',
              boxShadow: active ? '2px 2px 0 var(--rh-ink)' : `3px 3px 0 var(--rh-ink)`,
              transition: 'transform 0.1s, box-shadow 0.1s',
              whiteSpace: 'nowrap',
            } as React.CSSProperties}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = `4px 4px 0 var(--rh-ink)` }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = active ? '2px 2px 0 var(--rh-ink)' : `3px 3px 0 var(--rh-ink)` }}
            >{label}</Link>
          )
        })}
        <div style={{ marginLeft: '6px' }}>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}

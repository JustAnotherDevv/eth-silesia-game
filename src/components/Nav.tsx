import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import { OrgSwitcher } from './OrgSwitcher'
import { useIsMobile } from '../lib/responsive'
import { useFeatureFlags } from '../lib/featureFlags'
import { useAuth } from '../contexts/AuthContext'

// Flags are keyed by the flag key; null means always show (no flag controls it)
const LINKS: { to: string; label: string; flag: string | null }[] = [
  { to: '/',          label: 'Home',          flag: null },
  { to: '/news',      label: 'News',          flag: 'news' },
  { to: '/quiz',      label: 'Quick Rounds',  flag: 'quiz' },
  { to: '/path',      label: 'My Path',       flag: 'path' },
  { to: '/decision',  label: 'Decision Room', flag: 'decision' },
  { to: '/swipe',     label: 'Card Swipe',    flag: 'swipe' },
  { to: '/fraud',     label: 'Fraud Spotter', flag: 'fraud' },
  { to: '/community', label: 'Community',     flag: 'community' },
]

const RIGHT_LINKS: { to: string; label: string; accent: string; flag: string | null }[] = [
  { to: '/leaderboard', label: '🏆 Leaderboard', accent: '#FFCD00', flag: 'leaderboard' },
  { to: '/profile',     label: '🎩 Profile',     accent: '#FF7B25', flag: null },
]

export function Nav() {
  const { pathname } = useLocation()
  const isMobile = useIsMobile()
  const [menuOpen, setMenuOpen] = useState(false)
  const { isEnabled } = useFeatureFlags()
  const { isAdmin } = useAuth()

  const closeMenu = () => setMenuOpen(false)

  const visibleLinks = LINKS.filter(l => l.flag === null || isEnabled(l.flag))
  const visibleRight = RIGHT_LINKS.filter(l => l.flag === null || isEnabled(l.flag))

  if (isMobile) {
    return (
      <>
        <nav style={{
          position: 'sticky', top: 0, zIndex: 100,
          borderBottom: '2.5px solid var(--rh-ink)',
          background: 'var(--rh-paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', height: '52px',
          backgroundImage: 'radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}>
          <Link to="/" onClick={closeMenu} style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: '1rem', letterSpacing: '0.02em',
            textDecoration: 'none', color: 'var(--rh-ink)', whiteSpace: 'nowrap',
          }}>★ Knowly</Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ThemeToggle />
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{
                background: 'none', border: '2px solid var(--rh-ink)', borderRadius: '8px',
                width: '36px', height: '36px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '5px',
                padding: '6px',
              }}
              aria-label="Toggle menu"
            >
              <span style={{ display: 'block', width: '18px', height: '2px', background: 'var(--rh-ink)', borderRadius: '2px', transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(5px,5px)' : '' }} />
              <span style={{ display: 'block', width: '18px', height: '2px', background: 'var(--rh-ink)', borderRadius: '2px', transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
              <span style={{ display: 'block', width: '18px', height: '2px', background: 'var(--rh-ink)', borderRadius: '2px', transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(5px,-5px)' : '' }} />
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div style={{
            position: 'fixed', top: '52px', left: 0, right: 0, bottom: 0, zIndex: 99,
            background: 'var(--rh-paper)',
            backgroundImage: 'radial-gradient(circle, var(--rh-body-dot) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
            borderTop: '2px solid var(--rh-ink)',
            overflowY: 'auto',
            display: 'flex', flexDirection: 'column', padding: '16px',
            gap: '4px',
          }}>
            <OrgSwitcher />
            <div style={{ height: '12px' }} />
            {visibleLinks.map(({ to, label }) => {
              const active = pathname === to
              return (
                <Link key={to} to={to} onClick={closeMenu} style={{
                  fontFamily: "'Fredoka One', cursive",
                  fontSize: '1.1rem', letterSpacing: '0.05em',
                  textDecoration: 'none',
                  padding: '14px 20px',
                  borderRadius: '14px',
                  background: active ? 'var(--rh-ink)' : 'transparent',
                  color: active ? 'var(--rh-paper)' : 'var(--rh-ink)',
                  border: `2px solid ${active ? 'var(--rh-ink)' : 'transparent'}`,
                  display: 'block',
                }}>
                  {label}
                </Link>
              )
            })}
            <div style={{ height: '8px', borderTop: '1.5px solid var(--rh-ink)', margin: '8px 0' }} />
            {visibleRight.map(({ to, label, accent }) => {
              const active = pathname === to
              return (
                <Link key={to} to={to} onClick={closeMenu} style={{
                  fontFamily: "'Fredoka One', cursive",
                  fontSize: '1.1rem', letterSpacing: '0.05em',
                  textDecoration: 'none',
                  padding: '14px 20px',
                  borderRadius: '14px',
                  background: active ? 'var(--rh-ink)' : accent,
                  color: active ? 'var(--rh-paper)' : '#1A0800',
                  border: `2px solid var(--rh-ink)`,
                  boxShadow: `3px 3px 0 var(--rh-ink)`,
                  display: 'block',
                }}>
                  {label}
                </Link>
              )
            })}
            {isAdmin && (
              <Link to="/admin" onClick={closeMenu} style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: '1.1rem', letterSpacing: '0.05em',
                textDecoration: 'none',
                padding: '14px 20px', borderRadius: '14px',
                background: pathname === '/admin' ? 'var(--rh-ink)' : '#7B2D8B',
                color: 'white',
                border: `2px solid var(--rh-ink)`,
                boxShadow: `3px 3px 0 var(--rh-ink)`,
                display: 'block', marginTop: '4px',
              }}>
                👑 Admin
              </Link>
            )}
          </div>
        )}
      </>
    )
  }

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
      }}>★ Knowly</Link>

      <OrgSwitcher />

      {visibleLinks.map(({ to, label }) => {
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
        {visibleRight.map(({ to, label, accent }) => {
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
        {isAdmin && (
          <Link to="/admin" style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: '0.72rem', letterSpacing: '0.08em',
            textDecoration: 'none', padding: '7px 14px',
            borderRadius: '9999px', border: `2px solid var(--rh-ink)`,
            background: pathname === '/admin' ? 'var(--rh-ink)' : '#7B2D8B',
            color: 'white',
            boxShadow: pathname === '/admin' ? '2px 2px 0 var(--rh-ink)' : `3px 3px 0 var(--rh-ink)`,
            whiteSpace: 'nowrap',
          } as React.CSSProperties}>👑 Admin</Link>
        )}
        <div style={{ marginLeft: '6px' }}>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}

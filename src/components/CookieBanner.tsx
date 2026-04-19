import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'knowly_cookie_consent'
const ink = 'var(--rh-ink)'

type Choice = 'accepted' | 'rejected' | null

function readChoice(): Choice {
  if (typeof window === 'undefined') return null
  const v = window.localStorage.getItem(STORAGE_KEY)
  return v === 'accepted' || v === 'rejected' ? v : null
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(readChoice() === null)
  }, [])

  function decide(choice: 'accepted' | 'rejected') {
    try { window.localStorage.setItem(STORAGE_KEY, choice) } catch { /* storage may be blocked */ }
    setVisible(false)
    window.dispatchEvent(new CustomEvent('knowly:cookie-consent', { detail: choice }))
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      data-testid="cookie-banner"
      style={{
        position: 'fixed',
        left: 0, right: 0, bottom: 0,
        zIndex: 100,
        background: 'var(--rh-paper, #FEF9EE)',
        borderTop: `3px solid ${ink}`,
        boxShadow: `0 -4px 0 color-mix(in srgb, ${ink} 20%, transparent)`,
        fontFamily: "'Fredoka Variable', sans-serif",
        color: ink,
        padding: '14px 20px',
      }}
    >
      <div style={{
        maxWidth: '1100px', margin: '0 auto',
        display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '1.2rem' }} aria-hidden>🍪</span>
        <p style={{
          flex: 1, minWidth: '220px', margin: 0, fontSize: '0.82rem', lineHeight: 1.45,
        }}>
          <strong style={{ fontFamily: "'Fredoka One', cursive" }}>Knowly uses cookies.</strong>{' '}
          We store a small consent choice and a session token so you stay signed in.
          No third-party trackers.{' '}
          <Link to="/profile/privacy" style={{ color: ink, textDecoration: 'underline' }}>
            Learn more
          </Link>.
        </p>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => decide('rejected')}
            data-testid="cookie-reject"
            style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: '0.72rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '8px 16px',
              border: `2px solid ${ink}`,
              borderRadius: '9999px',
              background: 'transparent',
              color: ink,
              cursor: 'pointer',
            }}
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => decide('accepted')}
            data-testid="cookie-accept"
            style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: '0.72rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '8px 18px',
              border: `2px solid ${ink}`,
              borderRadius: '9999px',
              background: '#FFCD00',
              color: '#1A0800',
              boxShadow: `3px 3px 0 ${ink}`,
              cursor: 'pointer',
            }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}

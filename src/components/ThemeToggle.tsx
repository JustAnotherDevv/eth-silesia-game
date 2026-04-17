import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const ink    = dark ? '#FEF9EE' : '#1A0800'
  const paper  = dark ? '#1A0800' : '#FEF9EE'
  const track  = dark ? '#3D1E0A' : '#E8D5A3'
  const knob   = dark ? '#FEF9EE' : '#1A0800'
  const shadow = hovered
    ? `5px 5px 0px ${ink}`
    : pressed
    ? `1px 1px 0px ${ink}`
    : `3px 3px 0px ${ink}`
  const translate = pressed
    ? 'translate(1px, 1px)'
    : hovered
    ? 'translate(-1px, -1px)'
    : 'translate(0, 0)'

  return (
    <button
      onClick={() => setDark((d) => !d)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '9999px',
        border: `2.5px solid ${ink}`,
        backgroundColor: paper,
        boxShadow: shadow,
        transform: translate,
        transition: 'box-shadow 80ms ease, transform 80ms ease, background-color 200ms ease',
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      <Sun
        size={16}
        strokeWidth={2.5}
        style={{
          color: dark ? ink : '#D97706',
          opacity: dark ? 0.4 : 1,
          transform: dark ? 'scale(0.75)' : 'scale(1)',
          transition: 'opacity 200ms, transform 200ms, color 200ms',
        }}
      />

      {/* pill track */}
      <span
        style={{
          position: 'relative',
          display: 'inline-flex',
          width: '36px',
          height: '20px',
          borderRadius: '9999px',
          border: `2px solid ${ink}`,
          backgroundColor: track,
          transition: 'background-color 200ms',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '2px',
            left: dark ? '16px' : '2px',
            width: '12px',
            height: '12px',
            borderRadius: '9999px',
            border: `2px solid ${ink}`,
            backgroundColor: knob,
            transition: 'left 200ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 200ms',
          }}
        />
      </span>

      <Moon
        size={16}
        strokeWidth={2.5}
        style={{
          color: dark ? '#93C5FD' : ink,
          opacity: dark ? 1 : 0.4,
          transform: dark ? 'scale(1)' : 'scale(0.75)',
          transition: 'opacity 200ms, transform 200ms, color 200ms',
        }}
      />
    </button>
  )
}

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <button
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="
        relative flex items-center gap-1.5 px-3 py-2 rounded-full
        rh-outline rh-shadow transition-all duration-100
        bg-rh-cream dark:bg-rh-black
        hover:-translate-x-0.5 hover:-translate-y-0.5 hover:rh-shadow-md
        active:translate-x-0.5 active:translate-y-0.5
      "
      style={{ boxShadow: '3px 3px 0px #1A0800' }}
    >
      <Sun
        className={`size-4 transition-all duration-200 ${dark ? 'opacity-40 scale-75' : 'opacity-100 scale-100 text-rh-gold'}`}
        strokeWidth={2.5}
      />
      {/* pill track */}
      <span
        className="relative inline-flex w-9 h-5 rounded-full border-2 border-rh-black bg-rh-tan dark:bg-rh-brown transition-colors duration-200"
      >
        <span
          className={`
            absolute top-0.5 size-3 rounded-full border-2 border-rh-black bg-rh-black dark:bg-rh-cream
            transition-all duration-200
            ${dark ? 'translate-x-4' : 'translate-x-0.5'}
          `}
        />
      </span>
      <Moon
        className={`size-4 transition-all duration-200 ${dark ? 'opacity-100 scale-100 text-rh-blue' : 'opacity-40 scale-75'}`}
        strokeWidth={2.5}
      />
    </button>
  )
}

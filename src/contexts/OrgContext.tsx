import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'knowly_active_org'

export type OrgTheme = 'finance' | 'legal'

interface OrgContextValue {
  activeOrgId: string | null
  setActiveOrgId: (id: string | null) => void
  theme: OrgTheme
}

const OrgContext = createContext<OrgContextValue | null>(null)

function themeForOrgId(id: string | null | undefined): OrgTheme {
  if (!id) return 'finance'
  if (id === 'eth-legal' || id.toUpperCase() === 'ETH_LEGAL') return 'legal'
  return 'finance'
}

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(() => {
    try { return localStorage.getItem(STORAGE_KEY) } catch { return null }
  })

  const setActiveOrgId = useCallback((id: string | null) => {
    setActiveOrgIdState(id)
    try {
      if (id) localStorage.setItem(STORAGE_KEY, id)
      else localStorage.removeItem(STORAGE_KEY)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setActiveOrgIdState(e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const theme = themeForOrgId(activeOrgId)

  return (
    <OrgContext.Provider value={{ activeOrgId, setActiveOrgId, theme }}>
      {children}
    </OrgContext.Provider>
  )
}

export function useOrg() {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error('useOrg must be used within OrgProvider')
  return ctx
}

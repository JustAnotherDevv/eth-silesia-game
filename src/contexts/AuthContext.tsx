import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getUser } from '../lib/api'
import { getSession, setSession, clearSession, type Session } from '../lib/session'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
  refreshSession: () => void
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  isAdmin: false,
  signOut: async () => {},
  refreshSession: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage immediately so returning users don't flash the loading screen
  const [session,  setSessionState] = useState<Session | null>(() => getSession())
  const [loading,  setLoading]      = useState(true)
  const [isAdmin,  setIsAdmin]      = useState(() => {
    const s = getSession()
    return s ? localStorage.getItem(`xp_admin_${s.id}`) === 'true' : false
  })

  async function loadUserFromAuth(userId: string): Promise<Session | null> {
    try {
      const user = await getUser(userId)
      const s: Session = {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        avatar: user.avatar,
      }
      setSession(s)
      setSessionState(s)
      // Sync platform admin flag
      const adminFlag = (user as unknown as Record<string, unknown>).is_platform_admin === true
      localStorage.setItem(`xp_admin_${user.id}`, String(adminFlag))
      setIsAdmin(adminFlag)
      return s
    } catch {
      return null
    }
  }

  function refreshSession() {
    const s = getSession()
    setSessionState(s)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: authSession } }) => {
      if (authSession) {
        // Auth session exists — validate against DB
        const loaded = await loadUserFromAuth(authSession.user.id)
        if (!loaded) {
          // DB user not found; during registration, keep existing localStorage session
          // (Step5Complete will write it). If no localStorage session exists either, clear.
          if (!getSession()) {
            clearSession()
            setSessionState(null)
          }
        }
      } else {
        // No Supabase auth — also clear any stale localStorage session
        clearSession()
        setSessionState(null)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, authSession) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && authSession) {
        // Attempt to load DB user; silently ignore failure (user may be mid-registration)
        await loadUserFromAuth(authSession.user.id)
      } else if (event === 'SIGNED_OUT') {
        clearSession()
        setSessionState(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    // Clear local state immediately — don't block on Supabase network call
    clearSession()
    setSessionState(null)
    setIsAdmin(false)
    // Best-effort server-side sign out (fire and forget)
    supabase.auth.signOut().catch(() => {})
  }

  return (
    <AuthContext.Provider value={{ session, loading, isAdmin, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

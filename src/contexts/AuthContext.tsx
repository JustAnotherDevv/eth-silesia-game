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
  // If localStorage already has a session we don't need to block the UI on the
  // Supabase round-trip — we already know who the user is. Only block when
  // there's no local session and we need Supabase to tell us.
  const [loading,  setLoading]      = useState(() => !getSession())
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
    // Hard deadline: never block the UI for more than 3 seconds regardless of
    // what Supabase does (hangs, slow network, SDK bugs).
    const timeout = setTimeout(() => setLoading(false), 3000)

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
      clearTimeout(timeout)
    }).catch(() => {
      setLoading(false)
      clearTimeout(timeout)
    })

    // Supabase serializes auth ops with an internal lock held for the duration of
    // the onAuthStateChange callback. If we `await` another supabase call here
    // (getSession, admin fetches, etc.) anything else trying to touch the auth
    // mutex in parallel — e.g. getAuthHeader() during a login click — deadlocks.
    // Defer async work with setTimeout so the lock is released before we run.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, authSession) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && authSession) {
        setTimeout(() => { loadUserFromAuth(authSession.user.id) }, 0)
      } else if (event === 'SIGNED_OUT') {
        clearSession()
        setSessionState(null)
      }
    })

    return () => { subscription.unsubscribe(); clearTimeout(timeout) }
  }, [])

  async function signOut() {
    // scope:'local' clears the Supabase client session instantly without a
    // network round-trip, so the client is immediately ready for a new sign-in
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
    clearSession()
    setSessionState(null)
    setIsAdmin(false)
  }

  return (
    <AuthContext.Provider value={{ session, loading, isAdmin, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

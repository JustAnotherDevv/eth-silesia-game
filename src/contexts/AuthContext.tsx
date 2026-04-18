import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export interface AuthUser {
  id: string
  email: string
  username: string
  name: string
  avatarEmoji: string
  xp: number
  level: string
  streak: number
  badges: number
  specialty: string
  bio: string
  location: string
  goals: string[]
  isAdmin: boolean
  communityId: string | null
  communityName: string | null
  communityEmoji: string | null
  communityCode: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAdmin: boolean
  login(email: string, password: string): Promise<void>
  logout(): void
  refreshUser(): Promise<void>
  setTokenAndUser(token: string, user: AuthUser): void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAdmin: false,
  login: async () => {},
  logout: () => {},
  refreshUser: async () => {},
  setTokenAndUser: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    const token = localStorage.getItem('xp_token')
    if (!token) { setIsLoading(false); return }
    try {
      const { user } = await api.get<{ user: AuthUser }>('/auth/me')
      setUser(user)
    } catch {
      localStorage.removeItem('xp_token')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchMe() }, [fetchMe])

  async function login(email: string, password: string) {
    const { token, user } = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password })
    localStorage.setItem('xp_token', token)
    setUser(user)
  }

  function logout() {
    localStorage.removeItem('xp_token')
    setUser(null)
  }

  async function refreshUser() {
    const token = localStorage.getItem('xp_token')
    if (!token) return
    try {
      const { user } = await api.get<{ user: AuthUser }>('/auth/me')
      setUser(user)
    } catch {
      logout()
    }
  }

  function setTokenAndUser(token: string, user: AuthUser) {
    localStorage.setItem('xp_token', token)
    setUser(user)
  }

  return (
    <AuthContext.Provider value={{
      user, isLoading, isAdmin: user?.isAdmin ?? false,
      login, logout, refreshUser, setTokenAndUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

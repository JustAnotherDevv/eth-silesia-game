import { useState, useEffect, useCallback } from 'react'
import { getSession } from './session'

export interface FeatureFlag {
  key: string
  enabled: boolean
  label: string
  description: string
  category: string
  updated_at: string
}

type FlagsMap = Record<string, boolean>

let cachedFlags: FlagsMap | null = null
let lastFetch = 0
const CACHE_TTL = 30_000

async function fetchFlags(): Promise<FlagsMap> {
  const now = Date.now()
  if (cachedFlags && now - lastFetch < CACHE_TTL) return cachedFlags

  try {
    const res = await fetch('/api/feature-flags')
    if (!res.ok) throw new Error('fetch failed')
    const list: FeatureFlag[] = await res.json()
    const map: FlagsMap = {}
    for (const f of list) map[f.key] = f.enabled
    cachedFlags = map
    lastFetch = now
    return map
  } catch {
    return cachedFlags ?? {}
  }
}

export function invalidateFlagCache() {
  cachedFlags = null
  lastFetch = 0
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FlagsMap>(cachedFlags ?? {})
  const [loading, setLoading] = useState(!cachedFlags)

  useEffect(() => {
    let cancelled = false
    fetchFlags().then(f => { if (!cancelled) { setFlags(f); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  const isEnabled = useCallback((key: string) => flags[key] !== false, [flags])

  return { flags, loading, isEnabled }
}

// Admin API calls

const adminReq = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
  const session = getSession()
  if (!session) throw new Error('not authenticated')
  const res = await fetch(`/api/admin${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Id': session.id,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? `${method} ${path} → ${res.status}`)
  }
  return res.json()
}

export const getAdminFlags   = () => adminReq<FeatureFlag[]>('GET', '/flags')
export const setAdminFlag    = (key: string, enabled: boolean) => adminReq<FeatureFlag>('PATCH', `/flags/${key}`, { enabled })
export const getAdminStats   = () => adminReq<AdminStats>('GET', '/stats')
export const getAdminMembers = (search?: string) =>
  adminReq<AdminMember[]>('GET', `/members${search ? `?search=${encodeURIComponent(search)}` : ''}`)
export const patchAdminMember   = (id: string, updates: Partial<AdminMember>) => adminReq<AdminMember>('PATCH', `/members/${id}`, updates)
export const deleteAdminMember  = (id: string) => adminReq<{ success: boolean }>('DELETE', `/members/${id}`)
export const getAdminCodes      = () => adminReq<AdminInviteCode[]>('GET', '/invite-codes')
export const createAdminCode    = (orgId?: string, maxUses?: number) => adminReq<AdminInviteCode>('POST', '/invite-codes', { orgId, maxUses })
export const patchAdminCode     = (id: string, active: boolean) => adminReq<AdminInviteCode>('PATCH', `/invite-codes/${id}`, { active })
export const getAdminNews       = () => adminReq<AdminNewsItem[]>('GET', '/news')
export const createAdminNews    = (headline: string, source?: string, category?: string) =>
  adminReq<AdminNewsItem>('POST', '/news', { headline, source, category })
export const patchAdminNews     = (id: string, updates: { active?: boolean; headline?: string }) =>
  adminReq<AdminNewsItem>('PATCH', `/news/${id}`, updates)
export const deleteAdminNews    = (id: string) => adminReq<{ success: boolean }>('DELETE', `/news/${id}`)
export const promoteToAdmin     = (id: string) => adminReq<{ id: string; username: string; is_platform_admin: boolean }>('POST', `/promote/${id}`)

export interface AdminStats {
  totalUsers: number
  activeToday: number
  totalGames: number
  totalXp: number
  totalBadges: number
}

export interface AdminMember {
  id: string
  username: string
  display_name: string
  avatar: string
  xp: number
  streak: number
  last_active: string | null
  is_platform_admin: boolean
  created_at: string
}

export interface AdminInviteCode {
  id: string
  code: string
  uses: number
  max_uses: number | null
  active: boolean
  created_at: string
  orgs?: { id: string; name: string; emoji: string } | null
}

export interface AdminNewsItem {
  id: string
  headline: string
  source: string
  category: string
  active: boolean
  created_at: string
}

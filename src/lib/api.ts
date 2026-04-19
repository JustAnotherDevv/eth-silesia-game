import { supabase } from './supabase'

const BASE = '/api'

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return {}
  return { Authorization: `Bearer ${session.access_token}` }
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const authHeader = await getAuthHeader()
  const headers: Record<string, string> = { ...authHeader }
  if (body) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}`)
  return res.json()
}

// Users
export const createUser = (data: {
  id?: string
  username: string
  displayName: string
  avatar?: string
  orgId?: string
  goals?: string[]
}) => req<User>('POST', '/users', data)

export const getUser = (id: string) => req<User>('GET', `/users/${id}`)

export const updateUser = (id: string, data: Partial<Pick<User, 'displayName' | 'avatar'> & { goals: string[] }>) =>
  req<User>('PATCH', `/users/${id}`, data)

export const getUserOrgs = (id: string) => req<Org[]>('GET', `/users/${id}/orgs`)

// Games
export const submitGame = (data: {
  userId?: string  // ignored by server — userId comes from JWT
  gameType: string
  xpEarned: number
  score?: number
  total?: number
  metadata?: Record<string, unknown>
}) => req<{ id: string; xpEarned: number; newXp: number; newStreak: number; newBadges: string[] }>('POST', '/games', data)

export const getUserGames = (userId: string) => req<GameResult[]>('GET', `/games/user/${userId}`)

// Leaderboard
export const getLeaderboard = (orgId?: string) =>
  req<LeaderboardEntry[]>('GET', `/leaderboard${orgId ? `?orgId=${orgId}` : ''}`)

export const getLeaderboardStats = () =>
  req<{ totalUsers: number; activeToday: number; maxStreak: number }>('GET', '/leaderboard/stats')

// Orgs
export const getOrgs = () => req<Org[]>('GET', '/orgs')

export const joinOrg = (orgId: string) =>
  req<{ success: boolean }>('POST', `/orgs/${orgId}/join`, {})

export const joinOrgByCode = (code: string) =>
  req<Org>('POST', '/orgs/join-by-code', { code })

export const getOrgMembers = (orgId: string) => req<User[]>('GET', `/orgs/${orgId}/members`)

// Members (community)
export const getMembers = (params?: {
  orgId?: string
  search?: string
  limit?: number
  offset?: number
}) => {
  const q = new URLSearchParams()
  if (params?.orgId)  q.set('orgId',  params.orgId)
  if (params?.search) q.set('search', params.search)
  if (params?.limit)  q.set('limit',  String(params.limit))
  if (params?.offset) q.set('offset', String(params.offset))
  const qs = q.toString()
  return req<ApiMember[]>('GET', `/members${qs ? '?' + qs : ''}`)
}

export const getMember = (slug: string) => req<ApiMember>('GET', `/members/${slug}`)

// User badges & path progress
export const getUserBadges = (userId: string) =>
  req<UserBadge[]>('GET', `/users/${userId}/badges`)

export const getPathProgress = (userId: string) =>
  req<PathProgressItem[]>('GET', `/users/${userId}/path-progress`)

// News
export const getNews = () => req<NewsItem[]>('GET', '/news')

// Types
export interface User {
  id: string
  username: string
  display_name: string
  avatar: string
  xp: number
  streak: number
  last_active: string | null
  goals: string
  created_at: string
  displayName?: string
}

export interface GameResult {
  id: string
  user_id: string
  game_type: string
  label: string
  xp_earned: number
  score: number
  total: number
  metadata: string
  created_at: string
}

export interface Org {
  id: string
  name: string
  emoji: string
  color: string
  is_public: number
  invite_code: string | null
  description: string
  created_at: string
  member_count?: number
}

export interface LeaderboardEntry {
  id: string
  username: string
  display_name: string
  avatar: string
  xp: number
  streak: number
  rank: number
  label: string
  color: string
}

export interface ApiMember {
  id: string
  username: string
  displayName: string
  avatar: string
  xp: number
  xpMax: number | null
  streak: number
  level: string
  accent: string
  rank: number
  online: boolean
  specialty: string
  location: string
  bio: string
  badgeCount: number
  joinedAt?: string
  gamesPlayed?: number
  xpBreakdown?: Record<string, number>
  recentActivity?: Array<{
    type: string
    label: string
    xpEarned: number
    score: number
    total: number
    date: string
  }>
  achievements?: Array<{
    id: string
    emoji: string
    name: string
    description: string
    earnedAt: string
  }>
  orgs?: Array<{ id: string; name: string; emoji: string; color: string }>
  goals?: string[]
  isYou?: boolean
}

export interface UserBadge {
  badge_id: string
  earned_at: string
  badges: { emoji: string; name: string; description: string } | null
}

export interface PathProgressItem {
  node_id: string
  completed_at: string
}

export interface NewsItem {
  id: string
  headline: string
  source: string
  category: string
  active: boolean
  created_at: string
}

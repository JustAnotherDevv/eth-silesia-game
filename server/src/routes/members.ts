import { Hono } from 'hono'
import { supabase } from '../supabase.js'

export const members = new Hono()

const XP_LEVELS = [
  { min: 10000, label: 'Legend',  color: '#FFCD00', xpMax: null  },
  { min: 5000,  label: 'Expert',  color: '#7B2D8B', xpMax: 10000 },
  { min: 2000,  label: 'Pro',     color: '#1565C0', xpMax: 5000  },
  { min: 500,   label: 'Rising',  color: '#2D9A4E', xpMax: 2000  },
  { min: 0,     label: 'Rookie',  color: '#E63946', xpMax: 500   },
]

function getLevel(xp: number) {
  return XP_LEVELS.find(l => xp >= l.min) ?? XP_LEVELS[XP_LEVELS.length - 1]
}

const GAME_LABELS: Record<string, string> = {
  quiz:     'Quick Rounds',
  decision: 'Decision Room',
  swipe:    'Card Swipe',
  fraud:    'Fraud Spotter',
  path:     'Learning Path',
}

members.get('/', async (c) => {
  const orgId    = c.req.query('orgId')
  const limit    = Math.min(Number(c.req.query('limit')  ?? 50), 100)
  const offset   = Number(c.req.query('offset') ?? 0)
  const search   = c.req.query('search')?.toLowerCase()
  const today    = new Date().toISOString().split('T')[0]

  let query = supabase
    .from('users')
    .select('id, username, display_name, avatar, xp, streak, last_active, specialty, location, bio, created_at')
    .order('xp', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) query = query.ilike('display_name', `%${search}%`)

  if (orgId) {
    const { data: ids } = await supabase.from('org_members').select('user_id').eq('org_id', orgId)
    const userIds = (ids ?? []).map(r => r.user_id)
    if (userIds.length === 0) return c.json([])
    query = query.in('id', userIds)
  }

  const { data: users, error } = await query
  if (error) return c.json({ error: error.message }, 500)

  const { data: allBadgeCounts } = await supabase
    .from('user_badges')
    .select('user_id')
    .in('user_id', (users ?? []).map(u => u.id))

  const badgeCounts: Record<string, number> = {}
  for (const row of allBadgeCounts ?? []) {
    badgeCounts[row.user_id] = (badgeCounts[row.user_id] ?? 0) + 1
  }

  return c.json(
    (users ?? []).map((u, i) => {
      const lvl = getLevel(u.xp)
      return {
        id:          u.id,
        username:    u.username,
        displayName: u.display_name,
        avatar:      u.avatar,
        xp:          u.xp,
        xpMax:       lvl.xpMax,
        streak:      u.streak,
        level:       lvl.label,
        accent:      lvl.color,
        rank:        offset + i + 1,
        online:      u.last_active === today,
        specialty:   u.specialty,
        location:    u.location,
        bio:         u.bio,
        badgeCount:  badgeCounts[u.id] ?? 0,
        joinedAt:    u.created_at,
      }
    })
  )
})

members.get('/:slug', async (c) => {
  const slug  = c.req.param('slug')
  const today = new Date().toISOString().split('T')[0]

  const { data: u, error: userErr } = await supabase
    .from('users')
    .select('*')
    .eq('username', slug)
    .maybeSingle()

  if (userErr) return c.json({ error: userErr.message }, 500)
  if (!u) return c.json({ error: 'not found' }, 404)

  const [{ data: gameResults }, { data: userBadges }, { data: orgRows }] = await Promise.all([
    supabase
      .from('game_results')
      .select('game_type, xp_earned, score, total, created_at')
      .eq('user_id', u.id)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('user_badges')
      .select('earned_at, badges(id, emoji, name, description)')
      .eq('user_id', u.id),
    supabase
      .from('org_members')
      .select('orgs(id, name, emoji, color)')
      .eq('user_id', u.id),
  ])

  const results = gameResults ?? []
  const xpBreakdown: Record<string, number> = {}
  for (const r of results) {
    xpBreakdown[r.game_type] = (xpBreakdown[r.game_type] ?? 0) + r.xp_earned
  }

  const recentActivity = results.slice(0, 10).map(r => ({
    type:      r.game_type,
    label:     GAME_LABELS[r.game_type] ?? r.game_type,
    xpEarned:  r.xp_earned,
    score:     r.score,
    total:     r.total,
    date:      r.created_at,
  }))

  const achievements = (userBadges ?? []).map(row => ({
    earnedAt: row.earned_at,
    ...(row.badges as object),
  }))

  const orgs = (orgRows ?? []).map(row => row.orgs).filter(Boolean)

  const lvl = getLevel(u.xp)

  return c.json({
    id:             u.id,
    username:       u.username,
    displayName:    u.display_name,
    avatar:         u.avatar,
    xp:             u.xp,
    xpMax:          lvl.xpMax,
    streak:         u.streak,
    level:          lvl.label,
    accent:         lvl.color,
    online:         u.last_active === today,
    specialty:      u.specialty,
    location:       u.location,
    bio:            u.bio,
    goals:          u.goals,
    xpBreakdown,
    recentActivity,
    achievements,
    orgs,
    badgeCount:     achievements.length,
    gamesPlayed:    results.length,
  })
})

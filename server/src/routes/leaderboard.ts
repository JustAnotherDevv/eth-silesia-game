import { Hono } from 'hono'
import { supabase } from '../supabase.js'
import { sanitizeError } from '../middleware/errorHandler.js'

export const leaderboard = new Hono()

const XP_LEVELS = [
  { min: 10000, label: 'Legend',  color: '#FFCD00', xpMax: null   },
  { min: 5000,  label: 'Expert',  color: '#7B2D8B', xpMax: 10000  },
  { min: 2000,  label: 'Pro',     color: '#1565C0', xpMax: 5000   },
  { min: 500,   label: 'Rising',  color: '#2D9A4E', xpMax: 2000   },
  { min: 0,     label: 'Rookie',  color: '#E63946', xpMax: 500    },
]

function getLevel(xp: number) {
  return XP_LEVELS.find(l => xp >= l.min) ?? XP_LEVELS[XP_LEVELS.length - 1]
}

leaderboard.get('/', async (c) => {
  const orgId = c.req.query('orgId')

  let query = supabase
    .from('users')
    .select('id, username, display_name, avatar, xp, streak')
    .order('xp', { ascending: false })
    .limit(50)

  if (orgId) {
    const { data: memberIds } = await supabase
      .from('org_members')
      .select('user_id')
      .eq('org_id', orgId)

    const ids = (memberIds ?? []).map(m => m.user_id)
    if (ids.length === 0) return c.json([])
    query = query.in('id', ids)
  }

  const { data, error } = await query
  if (error) return c.json({ error: sanitizeError(error) }, 500)

  return c.json(
    (data ?? []).map((u, i) => {
      const lvl = getLevel(u.xp)
      return {
        id: u.id, username: u.username, display_name: u.display_name,
        avatar: u.avatar, xp: u.xp, streak: u.streak,
        rank: i + 1, level: lvl.label, accent: lvl.color, xpMax: lvl.xpMax,
      }
    })
  )
})

leaderboard.get('/stats', async (c) => {
  const today = new Date().toISOString().split('T')[0]

  const [{ count: totalUsers }, { count: activeToday }, { data: streakData }] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('last_active', today),
    supabase.from('users').select('streak').order('streak', { ascending: false }).limit(1),
  ])

  const maxStreak = streakData?.[0]?.streak ?? 0
  return c.json({ totalUsers: totalUsers ?? 0, activeToday: activeToday ?? 0, maxStreak })
})

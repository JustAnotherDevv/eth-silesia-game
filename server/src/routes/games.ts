import { Hono } from 'hono'
import { supabase } from '../supabase.js'

export const games = new Hono()

const GAME_LABELS: Record<string, string> = {
  quiz:     'Quick Rounds',
  decision: 'Decision Room',
  swipe:    'Card Swipe',
  fraud:    'Fraud Spotter',
  path:     'Learning Path',
}

games.post('/', async (c) => {
  const body = await c.req.json()
  const { userId, gameType, xpEarned = 0, score = 0, total = 0, metadata = {} } = body

  if (!userId || !gameType) {
    return c.json({ error: 'userId and gameType required' }, 400)
  }

  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('id, xp, streak, last_active')
    .eq('id', userId)
    .maybeSingle()

  if (userErr) return c.json({ error: userErr.message }, 500)
  if (!user) return c.json({ error: 'user not found' }, 404)

  const { data: result, error: insertErr } = await supabase
    .from('game_results')
    .insert({ user_id: userId, game_type: gameType, xp_earned: xpEarned, score, total, metadata })
    .select('id')
    .single()

  if (insertErr) return c.json({ error: insertErr.message }, 500)

  const today     = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]
  const newXp     = user.xp + xpEarned

  let newStreak = user.streak
  if (user.last_active !== today) {
    newStreak = user.last_active === yesterday ? user.streak + 1 : 1
  }

  await supabase
    .from('users')
    .update({ xp: newXp, streak: newStreak, last_active: today })
    .eq('id', userId)

  return c.json({ id: result.id, xpEarned, newXp, newStreak })
})

games.get('/user/:userId', async (c) => {
  const { data, error } = await supabase
    .from('game_results')
    .select('*')
    .eq('user_id', c.req.param('userId'))
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return c.json({ error: error.message }, 500)
  return c.json((data ?? []).map(r => ({ ...r, label: GAME_LABELS[r.game_type] ?? r.game_type })))
})

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

  // ── XP eligibility check (before inserting game result) ───────
  // Path: only award XP the first time a node is completed
  // Other games: 5-minute cooldown per game type to prevent replay farming
  let effectiveXp = xpEarned

  if (gameType === 'path') {
    const nodeId = (metadata as Record<string, unknown>).nodeId
    if (nodeId) {
      const { data: alreadyDone } = await supabase
        .from('path_progress')
        .select('node_id')
        .eq('user_id', userId)
        .eq('node_id', String(nodeId))
        .maybeSingle()
      if (alreadyDone) effectiveXp = 0
    }
  } else {
    const cooldownStart = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: recentGame } = await supabase
      .from('game_results')
      .select('id')
      .eq('user_id', userId)
      .eq('game_type', gameType)
      .gte('created_at', cooldownStart)
      .limit(1)
      .maybeSingle()
    if (recentGame) effectiveXp = 0
  }

  // Insert game result (history always recorded, XP reflects actual grant)
  const { data: result, error: insertErr } = await supabase
    .from('game_results')
    .insert({ user_id: userId, game_type: gameType, xp_earned: effectiveXp, score, total, metadata })
    .select('id')
    .single()

  if (insertErr) return c.json({ error: insertErr.message }, 500)

  const today     = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0]
  const newXp     = user.xp + effectiveXp

  let newStreak = user.streak
  if (user.last_active !== today) {
    newStreak = user.last_active === yesterday ? user.streak + 1 : 1
  }

  await supabase
    .from('users')
    .update({ xp: newXp, streak: newStreak, last_active: today })
    .eq('id', userId)

  // ── Badge checks ──────────────────────────────────────────────
  const newBadges: string[] = []

  // Count total games played (including this one)
  const { count: gameCount } = await supabase
    .from('game_results')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (gameCount === 1) newBadges.push('first_quiz')

  // XP thresholds (use effectiveXp so replays don't trigger these)
  for (const [id, threshold] of [['xp_500', 500], ['xp_1000', 1000], ['xp_5000', 5000], ['xp_10000', 10000]] as [string, number][]) {
    if (user.xp < threshold && newXp >= threshold) newBadges.push(id)
  }

  // Streak thresholds
  if (user.streak < 7  && newStreak >= 7)  newBadges.push('streak_7')
  if (user.streak < 30 && newStreak >= 30) newBadges.push('streak_30')

  // Perfect score (badge earned even on replay — it's a skill achievement)
  if (score === total && total > 0) newBadges.push('perfect_round')

  // Game-type specific
  if (gameType === 'fraud' && score >= 5) newBadges.push('fraud_fighter')
  if (gameType === 'swipe' && score === total && total > 0) newBadges.push('wise_swiper')
  if (gameType === 'decision' && (metadata as Record<string, unknown>).outcome === 'brilliant') newBadges.push('decision_maker')

  // Quiz master: 20+ quiz games
  if (gameType === 'quiz') {
    const { count: quizCount } = await supabase
      .from('game_results')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('game_type', 'quiz')
    if ((quizCount ?? 0) >= 20) newBadges.push('quiz_master')
  }

  // Path-specific: write path_progress and check milestones
  if (gameType === 'path') {
    const nodeId = (metadata as Record<string, unknown>).nodeId
    if (nodeId) {
      await supabase
        .from('path_progress')
        .upsert({ user_id: userId, node_id: String(nodeId) }, { onConflict: 'user_id,node_id', ignoreDuplicates: true })
    }

    const { count: pathCount } = await supabase
      .from('path_progress')
      .select('node_id', { count: 'exact', head: true })
      .eq('user_id', userId)

    const pc = pathCount ?? 0
    if (pc === 1)  newBadges.push('path_starter')
    if (pc >= 7)   newBadges.push('path_halfway')
    if (pc >= 15)  newBadges.push('path_complete')

    if (pc >= 3) {
      const { data: ch1 } = await supabase
        .from('path_progress')
        .select('node_id')
        .eq('user_id', userId)
        .in('node_id', ['1', '2', '3'])
      if ((ch1?.length ?? 0) >= 3) newBadges.push('finance_101')
    }
  }

  // Filter to only newly earned badges
  let awardedBadges: string[] = []
  if (newBadges.length > 0) {
    const { data: existing } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId)
      .in('badge_id', newBadges)

    const alreadyHas = new Set((existing ?? []).map((b: { badge_id: string }) => b.badge_id))
    const toAward = newBadges.filter(b => !alreadyHas.has(b))

    if (toAward.length > 0) {
      await supabase.from('user_badges').insert(
        toAward.map(badge_id => ({ user_id: userId, badge_id }))
      )
      awardedBadges = toAward
    }
  }

  return c.json({ id: result.id, xpEarned: effectiveXp, newXp, newStreak, newBadges: awardedBadges })
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

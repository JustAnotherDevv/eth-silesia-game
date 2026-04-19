import { Hono } from 'hono'
import { supabase } from '../supabase.js'
import { requireAuth } from '../middleware/auth.js'
import { validateUUID } from '../middleware/validate.js'
import { sanitizeError } from '../middleware/errorHandler.js'
import { LIMITS } from '../middleware/validate.js'
import { gameLimiter } from '../middleware/rateLimit.js'

export const games = new Hono()

const ALLOWED_GAME_TYPES = new Set(['quiz', 'decision', 'swipe', 'fraud', 'path'])

const GAME_LABELS: Record<string, string> = {
  quiz:     'Quick Rounds',
  decision: 'Decision Room',
  swipe:    'Card Swipe',
  fraud:    'Fraud Spotter',
  path:     'Learning Path',
}

// A01: require auth; extract userId from verified JWT, never from body
games.post('/', requireAuth, gameLimiter, async (c) => {
  const userId = c.get('userId')

  let body: unknown
  try { body = await c.req.json() } catch { return c.json({ error: 'invalid JSON' }, 400) }
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return c.json({ error: 'request body must be a JSON object' }, 400)
  }

  const { gameType, xpEarned = 0, score = 0, total = 0, metadata = {} } = body as Record<string, unknown>

  if (!gameType) return c.json({ error: 'gameType required' }, 400)

  // A05: validate gameType against allowlist
  if (!ALLOWED_GAME_TYPES.has(String(gameType))) {
    return c.json({ error: 'invalid gameType' }, 400)
  }

  // A06: cap XP, clamp score/total, validate metadata is object
  const clampedXp   = Math.min(Math.max(0, Number(xpEarned) || 0), LIMITS.XP_PER_SUBMISSION_MAX)
  const safeMetadata = (metadata !== null && typeof metadata === 'object' && !Array.isArray(metadata))
    ? metadata as Record<string, unknown>
    : {}

  const { data: user, error: userErr } = await supabase
    .from('users')
    .select('id, xp, streak, last_active')
    .eq('id', userId)
    .maybeSingle()

  if (userErr) return c.json({ error: sanitizeError(userErr) }, 500)
  if (!user) return c.json({ error: 'user not found' }, 404)

  let effectiveXp = clampedXp

  if (gameType === 'path') {
    const nodeId = safeMetadata.nodeId
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
      .eq('game_type', String(gameType))
      .gte('created_at', cooldownStart)
      .limit(1)
      .maybeSingle()
    if (recentGame) effectiveXp = 0
  }

  const safeScore = Math.max(0, Number(score) || 0)
  const safeTotal = Math.max(0, Number(total) || 0)

  // Score cannot exceed total (impossible result)
  if (safeTotal > 0 && safeScore > safeTotal) {
    return c.json({ error: 'score cannot exceed total' }, 400)
  }

  const { data: result, error: insertErr } = await supabase
    .from('game_results')
    .insert({ user_id: userId, game_type: String(gameType), xp_earned: effectiveXp, score: safeScore, total: safeTotal, metadata: safeMetadata })
    .select('id')
    .single()

  if (insertErr) return c.json({ error: sanitizeError(insertErr) }, 500)

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

  const newBadges: string[] = []

  const { count: gameCount } = await supabase
    .from('game_results')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (gameCount === 1) newBadges.push('first_quiz')

  for (const [id, threshold] of [['xp_500', 500], ['xp_1000', 1000], ['xp_5000', 5000], ['xp_10000', 10000]] as [string, number][]) {
    if (user.xp < threshold && newXp >= threshold) newBadges.push(id)
  }

  if (user.streak < 7  && newStreak >= 7)  newBadges.push('streak_7')
  if (user.streak < 30 && newStreak >= 30) newBadges.push('streak_30')

  if (safeScore === safeTotal && safeTotal > 0) newBadges.push('perfect_round')

  if (gameType === 'fraud' && safeScore >= 5) newBadges.push('fraud_fighter')
  if (gameType === 'swipe' && safeScore === safeTotal && safeTotal > 0) newBadges.push('wise_swiper')
  if (gameType === 'decision' && safeMetadata.outcome === 'brilliant') newBadges.push('decision_maker')

  if (gameType === 'quiz') {
    const { count: quizCount } = await supabase
      .from('game_results')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('game_type', 'quiz')
    if ((quizCount ?? 0) >= 20) newBadges.push('quiz_master')
  }

  if (gameType === 'path') {
    const nodeId = safeMetadata.nodeId
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

// A01: only fetch own game history (auth required, userId from JWT)
games.get('/user/:userId', requireAuth, validateUUID('userId'), async (c) => {
  const callerUserId = c.get('userId')
  const targetUserId = c.req.param('userId')

  // Users may only see their own game history
  if (callerUserId !== targetUserId) return c.json({ error: 'forbidden' }, 403)

  const { data, error } = await supabase
    .from('game_results')
    .select('*')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return c.json({ error: sanitizeError(error) }, 500)
  return c.json((data ?? []).map(r => ({ ...r, label: GAME_LABELS[r.game_type] ?? r.game_type })))
})

import { Hono } from 'hono'
import { supabase } from '../supabase.js'
import { sanitizeError } from '../middleware/errorHandler.js'

export const news = new Hono()

news.get('/', async (c) => {
  const { data, error } = await supabase
    .from('news_items')
    .select('id, headline, source, category, created_at')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return c.json({ error: sanitizeError(error) }, 500)
  return c.json((data ?? []).map(({ id, headline, source, category, created_at }) =>
    ({ id, headline, source, category, created_at }))
  )
})

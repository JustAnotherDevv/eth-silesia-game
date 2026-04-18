import { Hono } from 'hono'
import { supabase } from '../supabase.js'

export const news = new Hono()

news.get('/', async (c) => {
  const { data, error } = await supabase
    .from('news_items')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})

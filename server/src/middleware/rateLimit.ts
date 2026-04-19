import type { MiddlewareHandler, Context } from 'hono'

// A07:2025 + A10:2025 - Authentication Failures + Exceptional Conditions
// Simple in-memory rate limiting (use Redis in production for multi-instance deployments)

interface Entry { count: number; resetAt: number }
const stores = new Map<string, Map<string, Entry>>()

export interface RateLimitOptions {
  windowMs: number
  max: number
  keyFn?: (c: Context) => string
}

function ipKey(c: Context): string {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
    c.req.header('x-real-ip') ??
    'unknown'
  )
}

export function rateLimit(name: string, opts: RateLimitOptions): MiddlewareHandler {
  if (!stores.has(name)) stores.set(name, new Map())
  const store = stores.get(name)!

  // Periodic cleanup: remove expired entries every 10 minutes
  const cleanup = () => {
    const now = Date.now()
    for (const [k, v] of store) {
      if (v.resetAt < now) store.delete(k)
    }
  }
  setInterval(cleanup, 10 * 60 * 1000).unref()

  return async (c, next) => {
    const key = opts.keyFn ? opts.keyFn(c) : ipKey(c)
    const now = Date.now()

    let entry = store.get(key)
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + opts.windowMs }
      store.set(key, entry)
    }

    entry.count++

    const remaining = Math.max(0, opts.max - entry.count)
    c.res.headers.set('X-RateLimit-Limit', String(opts.max))
    c.res.headers.set('X-RateLimit-Remaining', String(remaining))
    c.res.headers.set('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)))

    if (entry.count > opts.max) {
      console.warn(`[SECURITY] RATE_LIMIT_HIT name=${name} key=${key} count=${entry.count}`)
      return c.json({ error: 'too many requests' }, 429)
    }

    await next()
  }
}

// For testing: clear all rate limit stores
export function clearRateLimits(): void {
  for (const store of stores.values()) store.clear()
}

// Pre-configured limiters for common use cases
export const registrationLimiter = rateLimit('register', {
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
})

export const gameLimiter = rateLimit('game', {
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20,
})

export const joinCodeLimiter = rateLimit('join_code', {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
})

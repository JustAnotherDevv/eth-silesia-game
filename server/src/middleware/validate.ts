import type { MiddlewareHandler } from 'hono'

// A05:2025 - Injection prevention
// A10:2025 - Fail fast on malformed input

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Reject non-UUID :id route parameters before they reach DB queries
export function validateUUID(...paramNames: string[]): MiddlewareHandler {
  return async (c, next) => {
    for (const name of paramNames) {
      const val = c.req.param(name)
      if (val && !UUID_RE.test(val)) {
        return c.json({ error: `invalid ${name} format` }, 400)
      }
    }
    await next()
  }
}

export function isValidUUID(val: unknown): val is string {
  return typeof val === 'string' && UUID_RE.test(val)
}

// Sanitize free-text search strings: max 100 chars, strip injection characters
export function sanitizeSearch(s: string): string {
  return s
    .slice(0, 100)
    .replace(/[%;'"\\]/g, '')  // strip chars that could escape query context
    .replace(/--/g, '')        // strip SQL line comment marker
    .trim()
}

// Middleware: parse JSON body and fail with 400 on syntax error
export function requireJsonBody(): MiddlewareHandler {
  return async (c, next) => {
    const ct = c.req.header('content-type') ?? ''
    if (!ct.includes('application/json')) {
      return c.json({ error: 'content-type must be application/json' }, 415)
    }
    try {
      await c.req.json()
    } catch {
      return c.json({ error: 'invalid JSON body' }, 400)
    }
    await next()
  }
}

// String field constraints
export const LIMITS = {
  USERNAME_MIN: 3,
  USERNAME_MAX: 30,
  DISPLAY_NAME_MAX: 80,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 128,
  EMAIL_MAX: 254,
  SEARCH_MAX: 100,
  HEADLINE_MAX: 500,
  GOAL_MAX: 200,
  XP_PER_SUBMISSION_MAX: 1000,  // hard cap: no single game should award more than this
  AVATAR_MAX: 10,               // emoji are short
} as const

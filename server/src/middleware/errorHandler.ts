import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'

// A10:2025 - Mishandling of Exceptional Conditions
// Global error handler: fail closed, never expose internals to client

// Evaluated at call time so tests can change NODE_ENV without reloading the module
function isDev(): boolean {
  return process.env.NODE_ENV !== 'production'
}

export const globalErrorHandler: ErrorHandler = (err, c) => {
  // A09:2025 - Security Logging: always log internally
  const reqId = c.req.header('x-request-id') ?? 'no-id'
  console.error(`[ERROR] ${new Date().toISOString()} req=${reqId} ${c.req.method} ${c.req.url}`, err)

  // Hono HTTP exceptions carry their own status + message (trusted)
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }

  // Never expose raw error internals in production
  if (isDev()) {
    return c.json({ error: err.message, stack: err.stack }, 500)
  }
  return c.json({ error: 'internal server error' }, 500)
}

// Sanitize any Supabase/DB error before sending to client
export function sanitizeError(err: unknown): string {
  if (isDev() && typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message: string }).message)
  }
  return 'an error occurred'
}

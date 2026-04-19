import type { MiddlewareHandler } from 'hono'

// A02:2025 - Security Misconfiguration
// Set defensive HTTP headers on every response
export function securityHeaders(): MiddlewareHandler {
  return async (c, next) => {
    await next()
    const h = c.res.headers
    h.set('X-Content-Type-Options', 'nosniff')
    h.set('X-Frame-Options', 'DENY')
    h.set('X-XSS-Protection', '1; mode=block')
    h.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    h.set('Cross-Origin-Embedder-Policy', 'require-corp')
    h.set('Cross-Origin-Opener-Policy', 'same-origin')
    h.set(
      'Content-Security-Policy',
      [
        "default-src 'none'",
        "script-src 'self'",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
        "img-src 'self' data: https:",
        "style-src 'self' 'unsafe-inline'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')
    )
    h.delete('Server')
    h.delete('X-Powered-By')
  }
}

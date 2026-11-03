import 'server-only'

const WEAK_SSL_MODES = new Set(['require', 'prefer', 'verify-ca'])

/**
 * Neon manages DATABASE_URL and ships it with sslmode=require. pg-connection-string currently
 * treats that as verify-full and warns that it will become weaker (libpq semantics) in the next
 * major version, so we pin verify-full explicitly: full certificate and hostname verification.
 * Every other parameter (e.g. channel_binding) is preserved. Never log the returned value.
 */
export function databaseUrl() {
  const raw = process.env.DATABASE_URL
  if (!raw) return undefined
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error('DATABASE_URL is not a valid URL')
  }
  const sslmode = url.searchParams.get('sslmode')
  if (sslmode === null || WEAK_SSL_MODES.has(sslmode)) url.searchParams.set('sslmode', 'verify-full')
  return url.toString()
}

import { betterAuth } from 'better-auth'
import { Pool } from 'pg'
import { isAdminEmail } from '@/lib/admin-emails'

const baseUrl = process.env.BETTER_AUTH_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined)
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
  ?? process.env.V0_RUNTIME_URL

const configuredAuthOrigin = process.env.BETTER_AUTH_URL?.replace(/\/$/, '')

const trustedOrigins = [
  configuredAuthOrigin,
  ...(process.env.NODE_ENV === 'development'
    ? ['http://localhost:3000', process.env.V0_RUNTIME_URL, process.env.V0_DEV_APP_URL, process.env.V0_BUILD_URL, process.env.V0_SANDBOX_URL]
    : [
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
        process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
      ]),
].filter((origin): origin is string => Boolean(origin))

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL }),
  baseURL: baseUrl,
  trustedOrigins,
  emailAndPassword: { enabled: true },
  user: {
    // Only configured organizers may register; enforced server-side for every sign-up path.
    validateUserInfo: ({ user, source }) => {
      if (source.action === 'create-user' && !isAdminEmail(typeof user.email === 'string' ? user.email : null)) {
        return { error: 'registration_closed', errorDescription: 'Registration is limited to the organizers.' }
      }
    },
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          // Required by the cross-site v0 preview iframe. Without these
          // attributes, login succeeds but the next request appears signed out.
          defaultCookieAttributes: { sameSite: 'none' as const, secure: true },
        },
      }
    : {}),
})

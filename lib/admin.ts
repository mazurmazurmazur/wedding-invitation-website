import 'server-only'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { isAdminEmail } from '@/lib/admin-emails'

/**
 * All allowlisted organizers share one wedding, so admin data is authorized by the
 * allowlist rather than scoped by userId (userId only records who created a row).
 */
export async function getAdminUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user && isAdminEmail(session.user.email) ? session.user : null
}

export async function requireAdmin() {
  const user = await getAdminUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getAdminData } from '@/app/actions/admin'
import { DashboardClient } from '@/components/admin/dashboard-client'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const allowed = (process.env.WEDDING_ADMIN_EMAILS ?? '').split(',').map(email => email.trim().toLowerCase()).filter(Boolean)
  if (!session?.user || !allowed.includes(session.user.email.toLowerCase())) redirect('/sign-in')
  const data = await getAdminData()
  return <DashboardClient initialData={data} />
}

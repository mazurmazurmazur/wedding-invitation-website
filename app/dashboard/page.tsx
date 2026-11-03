import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/admin'
import { getAdminData } from '@/app/actions/admin'
import { DashboardClient } from '@/components/admin/dashboard-client'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false } }

export default async function DashboardPage() {
  if (!(await getAdminUser())) redirect('/sign-in')
  const data = await getAdminData()
  return <DashboardClient initialData={data} />
}

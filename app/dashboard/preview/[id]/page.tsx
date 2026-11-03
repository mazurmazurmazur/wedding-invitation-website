import { notFound, redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { invitations } from '@/lib/db/schema'
import { getAdminUser } from '@/lib/admin'
import { getWeddingSettings, toInvitation } from '@/lib/invitations'
import { InvitationSite } from '@/components/wedding/invitation-site'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' as const }

export default async function InvitationPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUser())) redirect('/sign-in')
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const [row] = await db.select().from(invitations).where(eq(invitations.id, id)).limit(1)
  if (!row) notFound()
  const settings = await getWeddingSettings()
  return <InvitationSite settings={settings} invitation={toInvitation(row, settings)} preview />
}

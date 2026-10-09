import { notFound } from 'next/navigation'
import { getInvitation } from '@/lib/invitations'
import { InvitationSite } from '@/components/wedding/invitation-site'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' as const }

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const result = await getInvitation(token)
  if (!result) notFound()
  return <InvitationSite settings={result.settings} invitation={result.invitation} token={token} />
}

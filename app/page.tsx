import { InvitationSite } from '@/components/wedding/invitation-site'
import { getWeddingSettings } from '@/lib/invitations'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const settings = await getWeddingSettings()
  return <InvitationSite settings={settings} />
}

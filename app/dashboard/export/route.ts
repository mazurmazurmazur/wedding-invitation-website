import Papa from 'papaparse'
import { asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { invitations } from '@/lib/db/schema'
import { getAdminUser } from '@/lib/admin'
import { invitationTitle, rsvpStatus } from '@/lib/wedding'

export const dynamic = 'force-dynamic'

const privateHeaders = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' }

// Prevent spreadsheet formula injection from guest-supplied text.
const safeCell = (value: string) => /^[=+\-@\t\r]/.test(value) ? `'${value}` : value

export async function GET(request: Request) {
  if (!(await getAdminUser())) return new Response('Unauthorized', { status: 401, headers: privateHeaders })
  const origin = new URL(request.url).origin
  const rows = await db.select().from(invitations).orderBy(asc(invitations.createdAt))
  const csv = Papa.unparse({
    fields: ['external_id', 'name', 'url', 'active', 'rsvp_status', 'send_wave', 'guests', 'attending'],
    data: rows.map(row => [
      safeCell(row.externalId ?? ''),
      safeCell(invitationTitle({ displayName: row.displayName, guests: row.guests }, 'pl')),
      row.token ? `${origin}/invite/${row.token}` : '',
      row.active ? 'active' : 'inactive',
      rsvpStatus(row.guests, row.respondedAt),
      safeCell(row.sendWave),
      String(row.guests.length),
      String(row.guests.filter(g => g.attendance === 'yes').length),
    ]),
  })
  const date = new Date().toISOString().slice(0, 10)
  return new Response(`\uFEFF${csv}`, { headers: { ...privateHeaders, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="zaproszenia-${date}.csv"` } })
}

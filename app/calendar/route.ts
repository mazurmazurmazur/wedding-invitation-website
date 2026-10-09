import { getWeddingSettings } from '@/lib/invitations'

function escapeIcs(value: string) { return value.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;') }

export async function GET() {
  const s = await getWeddingSettings()
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Maria and Krzysztof//Wedding//PL', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT', 'UID:maria-krzysztof-wedding-2027', `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`, `DTSTART;TZID=Europe/Warsaw:${s.date.replaceAll('-', '')}T${s.time.replace(':', '')}00`, 'SUMMARY:Maria & Krzysztof — ślub / wedding', `LOCATION:${escapeIcs(`${s.venue}, ${s.address}`)}`, 'DESCRIPTION:Ceremonia i wesele w jednym miejscu. / Ceremony and reception at the same venue.', 'END:VEVENT', 'END:VCALENDAR']
  return new Response(lines.join('\r\n') + '\r\n', { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'attachment; filename="maria-krzysztof.ics"' } })
}

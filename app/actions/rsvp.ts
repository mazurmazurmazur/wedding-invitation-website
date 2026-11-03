'use server'

import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { invitations } from '@/lib/db/schema'
import { hashToken, getWeddingSettings, TOKEN_PATTERN } from '@/lib/invitations'
import { deadlineEnd } from '@/lib/wedding'

const choice = z.enum(['yes', 'no', 'undecided'])
const responseSchema = z.object({
  token: z.string().regex(TOKEN_PATTERN),
  message: z.string().trim().max(3000),
  guests: z.array(z.object({
    id: z.string().uuid(),
    name: z.string().max(120).optional(),
    attendance: z.enum(['yes', 'no']),
    dietary: z.string().trim().max(1500),
    transport: choice,
    returnTime: z.enum(['01:00', '04:00', 'none', 'undecided']),
    accommodation: choice,
    nextDay: choice,
  })).min(1).max(30),
})

export async function saveRsvp(input: unknown): Promise<{ ok: true; savedAt: string } | { ok: false; error: 'invalid' | 'closed' | 'unavailable' }> {
  const parsed = responseSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid' }
  const { token, guests, message } = parsed.data
  try {
    return await db.transaction(async tx => {
      const [row] = await tx.select().from(invitations).where(and(eq(invitations.tokenHash, hashToken(token)), eq(invitations.active, true))).for('update').limit(1)
      if (!row) return { ok: false as const, error: 'unavailable' as const }
      const settings = await getWeddingSettings()
      if (Date.now() > Math.max(deadlineEnd(settings.deadline).getTime(), row.reopenUntil?.getTime() ?? 0)) return { ok: false as const, error: 'closed' as const }
      // The guest list is fixed by the organizers: answers must cover exactly the invited people, so no one can be added.
      const ids = new Set(guests.map(g => g.id))
      if (ids.size !== guests.length || row.guests.length !== guests.length || row.guests.some(g => !ids.has(g.id))) return { ok: false as const, error: 'invalid' as const }
      let invalid = false
      const updatedGuests = row.guests.map(original => {
        const { name: submittedName, ...answer } = guests.find(g => g.id === original.id)!
        // Only unnamed plus-one slots accept a name from the guest; named guests keep the organizers' spelling.
        const name = original.placeholder ? (submittedName ?? original.name).normalize('NFC').replace(/\s+/g, ' ').trim() : original.name
        if (original.placeholder && answer.attendance === 'yes' && !name) invalid = true
        const base = { ...original, ...answer, name }
        return answer.attendance === 'no' ? { ...base, dietary: '', transport: 'no' as const, returnTime: 'none' as const, accommodation: 'no' as const, nextDay: 'no' as const } : base
      })
      if (invalid) return { ok: false as const, error: 'invalid' as const }
      const now = new Date()
      const [saved] = await tx.update(invitations).set({ guests: updatedGuests, message, respondedAt: now, updatedAt: now }).where(and(eq(invitations.id, row.id), eq(invitations.tokenHash, hashToken(token)), eq(invitations.active, true))).returning({ id: invitations.id })
      if (!saved) return { ok: false as const, error: 'unavailable' as const }
      return { ok: true as const, savedAt: now.toISOString() }
    })
  } catch {
    return { ok: false, error: 'unavailable' }
  }
}

'use server'

import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db'
import { invitations } from '@/lib/db/schema'
import { hashToken, getWeddingSettings } from '@/lib/invitations'
import { deadlineEnd } from '@/lib/wedding'

const choice = z.enum(['yes', 'no', 'undecided'])
const responseSchema = z.object({
  token: z.string().regex(/^[a-zA-Z0-9_-]{43}$/),
  message: z.string().trim().max(3000),
  guests: z.array(z.object({
    id: z.string().uuid(),
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
      const settings = await getWeddingSettings(row.userId)
      if (Date.now() > Math.max(deadlineEnd(settings.deadline).getTime(), row.reopenUntil?.getTime() ?? 0)) return { ok: false as const, error: 'closed' as const }
      const ids = new Set(guests.map(g => g.id))
      if (ids.size !== guests.length || row.guests.length !== guests.length || row.guests.some(g => !ids.has(g.id))) return { ok: false as const, error: 'invalid' as const }
      const updatedGuests = row.guests.map(original => {
        const answer = guests.find(g => g.id === original.id)!
        return { ...answer, name: original.name, ...(answer.attendance === 'no' ? { dietary: '', transport: 'no' as const, returnTime: 'none' as const, accommodation: 'no' as const, nextDay: 'no' as const } : {}) }
      })
      const now = new Date()
      const [saved] = await tx.update(invitations).set({ guests: updatedGuests, message, respondedAt: now, updatedAt: now }).where(and(eq(invitations.id, row.id), eq(invitations.userId, row.userId), eq(invitations.tokenHash, hashToken(token)), eq(invitations.active, true))).returning({ id: invitations.id })
      if (!saved) return { ok: false as const, error: 'unavailable' as const }
      return { ok: true as const, savedAt: now.toISOString() }
    })
  } catch {
    return { ok: false, error: 'unavailable' }
  }
}

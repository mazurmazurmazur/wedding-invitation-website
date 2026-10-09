import 'server-only'
import { createHash } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { invitations, weddingSettings } from '@/lib/db/schema'
import { defaultSettings, deadlineEnd, type Invitation } from '@/lib/wedding'

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function getWeddingSettings(userId?: string) {
  const [row] = await db.select({ content: weddingSettings.content }).from(weddingSettings).where(userId ? and(eq(weddingSettings.id, 'wedding'), eq(weddingSettings.userId, userId)) : eq(weddingSettings.id, 'wedding')).limit(1)
  return row ? { ...defaultSettings, ...row.content } : defaultSettings
}

export async function findInvitation(token: string) {
  if (!/^[a-zA-Z0-9_-]{43}$/.test(token)) return null
  // A 256-bit bearer token is the guest's authorization; guests have no account.
  const [row] = await db.select().from(invitations).where(and(eq(invitations.tokenHash, hashToken(token)), eq(invitations.active, true))).limit(1)
  return row ?? null
}

export async function getInvitation(token: string): Promise<{ invitation: Invitation; settings: Awaited<ReturnType<typeof getWeddingSettings>> } | null> {
  const row = await findInvitation(token)
  if (!row) return null
  const settings = await getWeddingSettings(row.userId)
  const editable = Date.now() <= Math.max(deadlineEnd(settings.deadline).getTime(), row.reopenUntil?.getTime() ?? 0)
  return { settings, invitation: { greetingPl: row.greetingPl, greetingEn: row.greetingEn, guests: row.guests, message: row.message, respondedAt: row.respondedAt?.toISOString() ?? null, editable } }
}

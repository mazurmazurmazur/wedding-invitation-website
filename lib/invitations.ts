import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { invitations, weddingSettings } from '@/lib/db/schema'
import { defaultSettings, deadlineEnd, isLanguage, type Invitation, type WeddingSettings } from '@/lib/wedding'

export const TOKEN_PATTERN = /^[a-zA-Z0-9_-]{43}$/

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function newInvitationToken() {
  const token = randomBytes(32).toString('base64url')
  return { token, tokenHash: hashToken(token) }
}

export async function getWeddingSettings(): Promise<WeddingSettings> {
  const [row] = await db.select({ content: weddingSettings.content }).from(weddingSettings).where(eq(weddingSettings.id, 'wedding')).limit(1)
  return row ? { ...defaultSettings, ...row.content } : defaultSettings
}

export async function findInvitation(token: string) {
  if (!TOKEN_PATTERN.test(token)) return null
  // A 256-bit bearer token is the guest's authorization; guests have no account.
  const [row] = await db.select().from(invitations).where(and(eq(invitations.tokenHash, hashToken(token)), eq(invitations.active, true))).limit(1)
  return row ?? null
}

type InvitationRow = typeof invitations.$inferSelect

export function toInvitation(row: InvitationRow, settings: WeddingSettings): Invitation {
  const editable = Date.now() <= Math.max(deadlineEnd(settings.deadline).getTime(), row.reopenUntil?.getTime() ?? 0)
  return { displayName: row.displayName, defaultLanguage: isLanguage(row.defaultLanguage) ? row.defaultLanguage : 'pl', greetingPl: row.greetingPl, greetingEn: row.greetingEn, guests: row.guests, message: row.message, respondedAt: row.respondedAt?.toISOString() ?? null, editable }
}

export async function getInvitation(token: string): Promise<{ invitation: Invitation; settings: WeddingSettings } | null> {
  const row = await findInvitation(token)
  if (!row) return null
  const settings = await getWeddingSettings()
  return { settings, invitation: toInvitation(row, settings) }
}

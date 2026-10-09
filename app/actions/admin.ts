'use server'

import { randomBytes } from 'node:crypto'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { invitations, weddingSettings } from '@/lib/db/schema'
import { defaultSettings } from '@/lib/wedding'
import { hashToken } from '@/lib/invitations'

async function adminUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  const allowed = (process.env.WEDDING_ADMIN_EMAILS ?? '').split(',').map(email => email.trim().toLowerCase()).filter(Boolean)
  if (!session?.user || !allowed.includes(session.user.email.toLowerCase())) throw new Error('Unauthorized')
  return session.user
}

export async function getAdminData() {
  const user = await adminUser()
  const [settingsRow, rows] = await Promise.all([
    db.select({ content: weddingSettings.content }).from(weddingSettings).where(and(eq(weddingSettings.id, 'wedding'), eq(weddingSettings.userId, user.id))).limit(1),
    db.select().from(invitations).where(eq(invitations.userId, user.id)).orderBy(desc(invitations.createdAt)),
  ])
  return { user: { name: user.name, email: user.email }, settings: settingsRow[0]?.content ?? defaultSettings, invitations: rows }
}

const createSchema = z.object({ names: z.array(z.string().trim().min(1).max(120)).min(1).max(30), greetingPl: z.string().max(500), greetingEn: z.string().max(500) })
export async function createInvitation(input: unknown) {
  const user = await adminUser(); const parsed = createSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const }
  const token = randomBytes(32).toString('base64url')
  const guests = parsed.data.names.map(name => ({ id: crypto.randomUUID(), name, attendance: null, dietary: '', transport: 'undecided' as const, returnTime: 'undecided' as const, accommodation: 'undecided' as const, nextDay: 'undecided' as const }))
  await db.insert(invitations).values({ userId: user.id, tokenHash: hashToken(token), token, greetingPl: parsed.data.greetingPl, greetingEn: parsed.data.greetingEn, guests })
  revalidatePath('/dashboard')
  return { ok: true as const, token }
}

export async function deleteInvitation(id: string) {
  const user = await adminUser()
  await db.delete(invitations).where(and(eq(invitations.id, id), eq(invitations.userId, user.id)))
  revalidatePath('/dashboard')
}

export async function toggleInvitation(id: string, active: boolean) {
  const user = await adminUser()
  await db.update(invitations).set({ active, updatedAt: new Date() }).where(and(eq(invitations.id, id), eq(invitations.userId, user.id)))
  revalidatePath('/dashboard')
}

'use server'

import { desc, eq, inArray, or, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { invitations } from '@/lib/db/schema'
import { requireAdmin } from '@/lib/admin'
import { newInvitationToken } from '@/lib/invitations'
import { rsvpStatus, type Guest } from '@/lib/wedding'
import { blankGuest, buildGuests, cleanText, MAX_GUESTS_PER_INVITATION, MAX_IMPORT_BYTES, MAX_IMPORT_ROWS, parseImportCsv, rowExternalIds, validateRows, type ImportRow } from '@/lib/csv-import'

type InvitationRow = typeof invitations.$inferSelect

function toAdminInvitation(row: InvitationRow) {
  return {
    id: row.id,
    token: row.token,
    active: row.active,
    externalId: row.externalId,
    mergedIds: row.mergedExternalIds,
    displayName: row.displayName,
    maxGuests: row.maxGuests,
    sendWave: row.sendWave,
    sourceRsvp: row.sourceRsvp,
    guests: row.guests,
    message: row.message,
    respondedAt: row.respondedAt?.toISOString() ?? null,
    status: rsvpStatus(row.guests, row.respondedAt),
    createdAt: row.createdAt.toISOString(),
  }
}
export type AdminInvitation = ReturnType<typeof toAdminInvitation>

export async function getAdminData() {
  const user = await requireAdmin()
  const rows = await db.select().from(invitations).orderBy(desc(invitations.createdAt))
  return { user: { name: user.name, email: user.email }, invitations: rows.map(toAdminInvitation) }
}

async function findExistingIds(ids: string[]) {
  if (!ids.length) return new Set<string>()
  const rows = await db.select({ externalId: invitations.externalId, mergedIds: invitations.mergedExternalIds }).from(invitations)
    .where(or(inArray(invitations.externalId, ids), sql`${invitations.mergedExternalIds} && ARRAY[${sql.join(ids.map(id => sql`${id}`), sql`, `)}]::text[]`))
  return new Set(rows.flatMap(row => [row.externalId, ...row.mergedIds]).filter((id): id is string => Boolean(id) && ids.includes(id!)))
}

const createSchema = z.object({ names: z.array(z.string().trim().min(1).max(120)).min(1).max(MAX_GUESTS_PER_INVITATION), plusOnes: z.number().int().min(0).max(10).default(0), greetingPl: z.string().max(500), greetingEn: z.string().max(500) })
export async function createInvitation(input: unknown) {
  const user = await requireAdmin()
  const parsed = createSchema.safeParse(input)
  if (!parsed.success || parsed.data.names.length + parsed.data.plusOnes > MAX_GUESTS_PER_INVITATION) return { ok: false as const }
  const { token, tokenHash } = newInvitationToken()
  const guests = [...parsed.data.names.map(name => blankGuest(cleanText(name))), ...Array.from({ length: parsed.data.plusOnes }, () => blankGuest('', true))]
  await db.insert(invitations).values({ userId: user.id, tokenHash, token, greetingPl: parsed.data.greetingPl, greetingEn: parsed.data.greetingEn, guests })
  revalidatePath('/dashboard')
  return { ok: true as const, token }
}

/** Parses and validates a CSV without writing anything. */
export async function previewImport(csv: string) {
  await requireAdmin()
  if (typeof csv !== 'string' || csv.length > MAX_IMPORT_BYTES) return { rows: [], existingIds: [], errors: ['Plik jest za duży (maks. 1 MB).'] }
  const { rows, errors } = parseImportCsv(csv)
  const existing = await findExistingIds([...new Set(rows.flatMap(rowExternalIds))])
  return { rows, existingIds: [...existing], errors }
}

const rowSchema = z.object({
  key: z.string().max(120),
  lines: z.array(z.number().int()).max(MAX_IMPORT_ROWS),
  externalId: z.string().max(100),
  mergedIds: z.array(z.string().max(100)).max(MAX_IMPORT_ROWS),
  displayName: z.string().max(200),
  knownNames: z.array(z.string().max(120)).max(MAX_GUESTS_PER_INVITATION),
  unnamedSlots: z.number(),
  maxGuests: z.number().nullable(),
  sendWave: z.string().max(50),
  sourceRsvp: z.string().max(500),
  sourceRows: z.string().max(500),
})

/** Creates invitations for new rows only. Never sends anything; rows whose external_id already exists are skipped untouched. */
export async function commitImport(input: unknown) {
  const user = await requireAdmin()
  const parsed = z.array(rowSchema).min(1).max(MAX_IMPORT_ROWS).safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Nieprawidłowe dane importu.' }
  const rows: ImportRow[] = parsed.data.map(row => ({ ...row, externalId: cleanText(row.externalId), mergedIds: row.mergedIds.map(cleanText), displayName: cleanText(row.displayName), knownNames: row.knownNames.map(cleanText), sendWave: cleanText(row.sendWave), sourceRsvp: cleanText(row.sourceRsvp), sourceRows: cleanText(row.sourceRows) }))
  if (validateRows(rows).some(issues => issues.some(issue => issue.level === 'error'))) return { ok: false as const, error: 'Popraw błędy w podglądzie przed zapisem.' }
  const ids = [...new Set(rows.flatMap(rowExternalIds))]
  const result = await db.transaction(async tx => {
    // Serialize imports so two organizers importing at once can't both create the same external_id.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('wedding_invitations_import'))`)
    const existingRows = await tx.select({ externalId: invitations.externalId, mergedIds: invitations.mergedExternalIds }).from(invitations)
      .where(or(inArray(invitations.externalId, ids), sql`${invitations.mergedExternalIds} && ARRAY[${sql.join(ids.map(id => sql`${id}`), sql`, `)}]::text[]`))
    const existing = new Set(existingRows.flatMap(row => [row.externalId, ...row.mergedIds]))
    const fresh = rows.filter(row => !rowExternalIds(row).some(id => existing.has(id)))
    if (fresh.length) {
      await tx.insert(invitations).values(fresh.map(row => {
        const { token, tokenHash } = newInvitationToken()
        return { userId: user.id, tokenHash, token, externalId: row.externalId, mergedExternalIds: row.mergedIds, displayName: row.displayName, maxGuests: row.maxGuests, sendWave: row.sendWave, sourceRsvp: row.sourceRsvp, sourceRows: row.sourceRows, guests: buildGuests(row) }
      })).onConflictDoNothing({ target: invitations.externalId, where: sql`external_id is not null` })
    }
    return { created: fresh.length, skipped: rows.length - fresh.length }
  })
  revalidatePath('/dashboard')
  return { ok: true as const, ...result }
}

const editSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().max(200),
  sendWave: z.string().max(50),
  maxGuests: z.number().int().min(1).max(MAX_GUESTS_PER_INVITATION).nullable(),
  guests: z.array(z.object({ id: z.string().uuid().nullable(), name: z.string().max(120), placeholder: z.boolean() })).min(1).max(MAX_GUESTS_PER_INVITATION),
})

/** Edits group members and plus-one slots. Kept guests (matched by id) keep all their RSVP answers. */
export async function updateInvitation(input: unknown) {
  await requireAdmin()
  const parsed = editSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Nieprawidłowe dane.' }
  const { id, displayName, sendWave, maxGuests, guests } = parsed.data
  if (maxGuests !== null && guests.length > maxGuests) return { ok: false as const, error: `Osób (${guests.length}) jest więcej niż limit (${maxGuests}).` }
  if (guests.some(g => !g.placeholder && !cleanText(g.name))) return { ok: false as const, error: 'Każda imienna osoba musi mieć imię.' }
  return db.transaction(async tx => {
    const [row] = await tx.select().from(invitations).where(eq(invitations.id, id)).for('update').limit(1)
    if (!row) return { ok: false as const, error: 'Nie znaleziono zaproszenia.' }
    const byId = new Map(row.guests.map(g => [g.id, g]))
    const nextGuests: Guest[] = guests.map(input => {
      const existing = input.id ? byId.get(input.id) : undefined
      const name = cleanText(input.name)
      if (!existing) return blankGuest(name, input.placeholder)
      const { placeholder: _, ...rest } = existing
      return { ...rest, name, ...(input.placeholder ? { placeholder: true } : {}) }
    })
    await tx.update(invitations).set({ guests: nextGuests, displayName: cleanText(displayName), sendWave: cleanText(sendWave), maxGuests, updatedAt: new Date() }).where(eq(invitations.id, id))
    revalidatePath('/dashboard')
    return { ok: true as const }
  })
}

/** Issues a new link. The previous link stops working, so the UI asks for confirmation first. */
export async function regenerateLink(id: string) {
  await requireAdmin()
  if (!z.string().uuid().safeParse(id).success) return { ok: false as const }
  const { token, tokenHash } = newInvitationToken()
  await db.update(invitations).set({ token, tokenHash, updatedAt: new Date() }).where(eq(invitations.id, id))
  revalidatePath('/dashboard')
  return { ok: true as const }
}

export async function deleteInvitation(id: string) {
  await requireAdmin()
  if (!z.string().uuid().safeParse(id).success) return
  await db.delete(invitations).where(eq(invitations.id, id))
  revalidatePath('/dashboard')
}

export async function toggleInvitation(id: string, active: boolean) {
  await requireAdmin()
  if (!z.string().uuid().safeParse(id).success) return
  await db.update(invitations).set({ active: Boolean(active), updatedAt: new Date() }).where(eq(invitations.id, id))
  revalidatePath('/dashboard')
}

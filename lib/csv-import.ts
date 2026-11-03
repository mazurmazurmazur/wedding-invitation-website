import Papa from 'papaparse'
import type { Guest } from './wedding'

export const IMPORT_COLUMNS = ['external_id', 'display_name', 'known_guest_names', 'unnamed_guest_slots', 'max_guests', 'send_wave', 'source_rsvp', 'source_rows'] as const
export const MAX_IMPORT_ROWS = 500
export const MAX_IMPORT_BYTES = 1_000_000
export const MAX_GUESTS_PER_INVITATION = 30
const MAX_UNNAMED_SLOTS = 10

export type ImportRow = {
  /** Stable client key; the primary external_id of the row. */
  key: string
  lines: number[]
  externalId: string
  /** external_ids of CSV rows combined into this invitation; checked on re-import so they are never recreated. */
  mergedIds: string[]
  displayName: string
  knownNames: string[]
  unnamedSlots: number
  maxGuests: number | null
  sendWave: string
  sourceRsvp: string
  sourceRows: string
}
export type RowIssue = { level: 'error' | 'warning'; message: string }

export const cleanText = (value: unknown) => String(value ?? '').normalize('NFC').replace(/\s+/g, ' ').trim()
export const nameKey = (name: string) => cleanText(name).toLocaleLowerCase('pl')

export function dedupeNames(names: string[]) {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of names) {
    const name = cleanText(raw)
    if (!name || seen.has(nameKey(name))) continue
    seen.add(nameKey(name))
    result.push(name)
  }
  return result
}

export function splitNames(cell: string) {
  return dedupeNames(String(cell ?? '').normalize('NFC').split(/[|;\n]|\s+&\s+|\s+\+\s+/))
}

function parseCount(value: string): number | null {
  const v = cleanText(value)
  if (!v) return null
  return /^\d+$/.test(v) ? Number(v) : Number.NaN
}

export function parseImportCsv(input: string): { rows: ImportRow[]; errors: string[] } {
  if (new TextEncoder().encode(input).length > MAX_IMPORT_BYTES) return { rows: [], errors: ['Plik jest za duży (maks. 1 MB).'] }
  const text = input.replace(/^\uFEFF/, '')
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    delimitersToGuess: [',', ';', '\t'],
    transformHeader: header => header.replace(/^\uFEFF/, '').trim().toLowerCase(),
  })
  const headers = result.meta.fields ?? []
  const missing = IMPORT_COLUMNS.filter(column => !headers.includes(column))
  if (missing.length) return { rows: [], errors: [`Brakujące kolumny: ${missing.join(', ')}`] }
  const errors = result.errors.map(error => `Wiersz ${(error.row ?? 0) + 2}: ${error.message}`)
  if (result.data.length > MAX_IMPORT_ROWS) return { rows: [], errors: [`Za dużo wierszy (maks. ${MAX_IMPORT_ROWS}).`] }
  const rows = result.data.map((record, index): ImportRow => {
    const externalId = cleanText(record.external_id)
    const slots = parseCount(record.unnamed_guest_slots)
    return {
      key: externalId || `row-${index + 2}`,
      lines: [index + 2],
      externalId,
      mergedIds: [],
      displayName: cleanText(record.display_name),
      knownNames: splitNames(record.known_guest_names),
      unnamedSlots: slots ?? 0,
      maxGuests: parseCount(record.max_guests),
      sendWave: cleanText(record.send_wave),
      sourceRsvp: cleanText(record.source_rsvp),
      sourceRows: cleanText(record.source_rows),
    }
  })
  return { rows, errors }
}

/** Named guests of a row. The display name is only used as a guest when no names are listed, so it is never duplicated. */
export function rowNamedGuests(row: Pick<ImportRow, 'knownNames' | 'displayName'>) {
  return row.knownNames.length ? dedupeNames(row.knownNames) : dedupeNames([row.displayName])
}

export function rowGuestCount(row: ImportRow) {
  return rowNamedGuests(row).length + (Number.isInteger(row.unnamedSlots) ? row.unnamedSlots : 0)
}

export const rowExternalIds = (row: Pick<ImportRow, 'externalId' | 'mergedIds'>) => [row.externalId, ...row.mergedIds].filter(Boolean)

export function validateRows(rows: ImportRow[], existingIds: Iterable<string> = []): RowIssue[][] {
  const existing = new Set(existingIds)
  const counts = new Map<string, number>()
  for (const id of rows.flatMap(rowExternalIds)) counts.set(id, (counts.get(id) ?? 0) + 1)
  return rows.map(row => {
    const issues: RowIssue[] = []
    const error = (message: string) => issues.push({ level: 'error', message })
    const named = rowNamedGuests(row)
    const total = rowGuestCount(row)
    if (!row.externalId) error('Brak external_id.')
    else if (row.externalId.length > 100 || /[\u0000-\u001f]/.test(row.externalId)) error('Nieprawidłowy external_id.')
    for (const id of rowExternalIds(row)) if ((counts.get(id) ?? 0) > 1) error(`external_id „${id}” występuje więcej niż raz.`)
    if (!named.length) error('Brak display_name i known_guest_names.')
    if (row.displayName.length > 200) error('display_name jest za długie.')
    if (named.some(name => name.length > 120)) error('Imię i nazwisko jest za długie (maks. 120 znaków).')
    if (!Number.isInteger(row.unnamedSlots) || row.unnamedSlots < 0 || row.unnamedSlots > MAX_UNNAMED_SLOTS) error(`unnamed_guest_slots musi być liczbą 0–${MAX_UNNAMED_SLOTS}.`)
    if (row.maxGuests !== null && (!Number.isInteger(row.maxGuests) || row.maxGuests < 1 || row.maxGuests > MAX_GUESTS_PER_INVITATION)) error(`max_guests musi być liczbą 1–${MAX_GUESTS_PER_INVITATION}.`)
    if (total > MAX_GUESTS_PER_INVITATION) error(`Za dużo osób w zaproszeniu (maks. ${MAX_GUESTS_PER_INVITATION}).`)
    if (row.maxGuests !== null && Number.isInteger(row.maxGuests) && total > row.maxGuests) error(`Osób (${total}) jest więcej niż max_guests (${row.maxGuests}).`)
    if (row.maxGuests !== null && Number.isInteger(row.maxGuests) && total < row.maxGuests) issues.push({ level: 'warning', message: `max_guests (${row.maxGuests}) jest większe niż liczba osób (${total}). Goście nie mogą dodać nikogo sami.` })
    if (row.sendWave.length > 50 || row.sourceRsvp.length > 500 || row.sourceRows.length > 500) error('Za długa wartość send_wave, source_rsvp lub source_rows.')
    const alreadyImported = rowExternalIds(row).filter(id => existing.has(id))
    if (alreadyImported.length) issues.push({ level: 'warning', message: `Już zaimportowane (${alreadyImported.join(', ')}) — zostanie pominięte.` })
    return issues
  })
}

const uniqueJoin = (values: string[], separator: string) => [...new Set(values.map(cleanText).filter(Boolean))].join(separator)

/** Combine preliminary CSV groups into one household invitation. Names are de-duplicated; plus-one slots are summed. */
export function mergeRows(rows: ImportRow[], displayName?: string): ImportRow {
  const [primary] = rows
  const knownNames = dedupeNames(rows.flatMap(rowNamedGuests))
  const maxGuests = rows.every(row => row.maxGuests === null) ? null : rows.reduce((sum, row) => sum + (row.maxGuests ?? rowGuestCount(row)), 0)
  return {
    key: primary.key,
    lines: rows.flatMap(row => row.lines),
    externalId: primary.externalId,
    mergedIds: [...new Set(rows.flatMap(rowExternalIds).filter(id => id !== primary.externalId))],
    displayName: cleanText(displayName ?? '') || knownNames.join(' & '),
    knownNames,
    unnamedSlots: rows.reduce((sum, row) => sum + row.unnamedSlots, 0),
    maxGuests,
    sendWave: uniqueJoin(rows.map(row => row.sendWave), ' / '),
    sourceRsvp: uniqueJoin(rows.map(row => row.sourceRsvp), ' | '),
    sourceRows: uniqueJoin(rows.map(row => row.sourceRows), ', '),
  }
}

export function blankGuest(name: string, placeholder = false): Guest {
  return { id: crypto.randomUUID(), name, attendance: null, dietary: '', transport: 'undecided', returnTime: 'undecided', accommodation: 'undecided', nextDay: 'undecided', ...(placeholder ? { placeholder: true } : {}) }
}

export function buildGuests(row: ImportRow): Guest[] {
  return [...rowNamedGuests(row).map(name => blankGuest(name)), ...Array.from({ length: row.unnamedSlots }, () => blankGuest('', true))]
}

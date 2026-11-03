import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildGuests, mergeRows, parseImportCsv, rowGuestCount, rowNamedGuests, validateRows } from '../lib/csv-import.ts'

const header = 'external_id,display_name,known_guest_names,unnamed_guest_slots,max_guests,send_wave,source_rsvp,source_rows'
const errors = (issues: { level: string }[]) => issues.filter(i => i.level === 'error')

test('one-person invitation uses display name as the only guest', () => {
  const { rows } = parseImportCsv(`${header}\nA1,Łukasz Żółć,,0,1,1,,2`)
  assert.deepEqual(rowNamedGuests(rows[0]), ['Łukasz Żółć'])
  assert.equal(buildGuests(rows[0]).length, 1)
  assert.deepEqual(errors(validateRows(rows)[0]), [])
})

test('couple: display name is a label and never duplicated as a guest', () => {
  const { rows } = parseImportCsv(`${header}\nA2,Anna i Jan Gżegżółka,"Anna Gżegżółka|Jan Gżegżółka|anna  gżegżółka",0,2,1,,3`)
  assert.deepEqual(rowNamedGuests(rows[0]), ['Anna Gżegżółka', 'Jan Gżegżółka'])
  assert.equal(rowGuestCount(rows[0]), 2)
})

test('primary guest is not duplicated when display name repeats a known name', () => {
  const { rows } = parseImportCsv(`${header}\nA3,Ewa Nowak,Ewa Nowak,1,2,2,,4`)
  const guests = buildGuests(rows[0])
  assert.deepEqual(guests.map(g => [g.name, Boolean(g.placeholder)]), [['Ewa Nowak', false], ['', true]])
})

test('unnamed plus-ones count against max_guests', () => {
  const { rows } = parseImportCsv(`${header}\nA4,Piotr,Piotr Wiśniewski,2,2,1,,5`)
  assert.equal(rowGuestCount(rows[0]), 3)
  assert.ok(errors(validateRows(rows)[0]).some(i => /max_guests/.test((i as { message: string }).message)))
})

test('semicolon delimiter, UTF-8 BOM and Polish characters survive', () => {
  const csv = `\uFEFF${header.replaceAll(',', ';')}\nA5;Zażółć Gęślą;;0;;1;tak (papier);6`
  const { rows, errors: fileErrors } = parseImportCsv(csv)
  assert.deepEqual(fileErrors, [])
  assert.equal(rows[0].displayName, 'Zażółć Gęślą')
  assert.equal(rows[0].sourceRsvp, 'tak (papier)')
  assert.equal(rows[0].maxGuests, null)
})

test('Windows-1250 encoded Polish text decodes correctly', () => {
  const bytes = new Uint8Array([0xa3, 0x75, 0x6b, 0x61, 0x73, 0x7a, 0x20, 0xaf, 0xf3, 0xb3, 0xe6]) // "Łukasz Żółć"
  assert.equal(new TextDecoder('windows-1250').decode(bytes), 'Łukasz Żółć')
  assert.throws(() => new TextDecoder('utf-8', { fatal: true }).decode(bytes))
})

test('duplicate external_id inside one file is rejected', () => {
  const { rows } = parseImportCsv(`${header}\nB1,X,,0,,1,,1\nB1,Y,,0,,1,,2`)
  assert.ok(validateRows(rows).every(issues => errors(issues).length > 0))
})

test('missing required columns are reported', () => {
  assert.match(parseImportCsv('external_id,display_name\nA,B').errors[0], /Brakujące kolumny/)
})

test('repeated import: already-imported ids (including merged ones) are flagged, not errors', () => {
  const { rows } = parseImportCsv(`${header}\nC1,Kasia,,0,,1,,1\nC2,Tomek,,0,,1,,2`)
  const issues = validateRows(rows, ['C2'])
  assert.deepEqual(errors(issues[1]), [])
  assert.ok(issues[1].some(i => i.level === 'warning'))
})

test('merging rows combines households without duplicate names and keeps all ids', () => {
  const { rows } = parseImportCsv(`${header}\nD1,Ola Kowalska,,0,1,1,tak,7\nD2,Ola i Marek,"Ola Kowalska|Marek Kowalski",1,3,2,,8`)
  const merged = mergeRows(rows, 'Rodzina Kowalskich')
  assert.equal(merged.externalId, 'D1')
  assert.deepEqual(merged.mergedIds, ['D2'])
  assert.deepEqual(merged.knownNames, ['Ola Kowalska', 'Marek Kowalski'])
  assert.equal(merged.unnamedSlots, 1)
  assert.equal(merged.maxGuests, 4)
  assert.equal(merged.displayName, 'Rodzina Kowalskich')
  assert.equal(merged.sendWave, '1 / 2')
  assert.deepEqual(errors(validateRows([merged])[0]), [])
  // Re-importing the original file later must skip D2 because it now lives inside D1.
  assert.ok(validateRows(rows, ['D1', ...merged.mergedIds]).every(issues => issues.some(i => i.level === 'warning')))
})

'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FileUp, Merge, Split, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { commitImport, previewImport } from '@/app/actions/admin'
import { mergeRows, rowExternalIds, rowGuestCount, rowNamedGuests, validateRows, type ImportRow } from '@/lib/csv-import'

async function readCsvFile(file: File) {
  const buffer = await file.arrayBuffer()
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer)
  } catch {
    // Excel on Polish Windows often saves CSV as Windows-1250; decode it so Ł, ż, ó survive.
    return new TextDecoder('windows-1250').decode(buffer)
  }
}

export function ImportPanel() {
  const router = useRouter()
  const [csv, setCsv] = useState('')
  const [rows, setRows] = useState<ImportRow[] | null>(null)
  const [existingIds, setExistingIds] = useState<string[]>([])
  const [fileErrors, setFileErrors] = useState<string[]>([])
  const [sources, setSources] = useState<Record<string, ImportRow[]>>({})
  const [selected, setSelected] = useState<string[]>([])
  const [mergeName, setMergeName] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState('')

  const issues = useMemo(() => rows ? validateRows(rows, existingIds) : [], [rows, existingIds])
  const statusOf = (row: ImportRow, index: number) => issues[index]?.some(i => i.level === 'error') ? 'error' : rowExternalIds(row).some(id => existingIds.includes(id)) ? 'exists' : 'new'
  const counts = rows ? rows.reduce((acc, row, i) => ({ ...acc, [statusOf(row, i)]: acc[statusOf(row, i)] + 1 }), { new: 0, exists: 0, error: 0 }) : { new: 0, exists: 0, error: 0 }

  async function runPreview() {
    setBusy(true); setResult(''); setSelected([]); setSources({})
    const preview = await previewImport(csv)
    setRows(preview.rows); setExistingIds(preview.existingIds); setFileErrors(preview.errors)
    setBusy(false)
  }

  function merge() {
    if (!rows) return
    const chosen = rows.filter(row => selected.includes(row.key))
    if (chosen.length < 2) return
    const merged = mergeRows(chosen, mergeName)
    const at = rows.findIndex(row => row.key === chosen[0].key)
    const next = rows.filter(row => !selected.includes(row.key))
    next.splice(Math.min(at, next.length), 0, merged)
    setSources(prev => ({ ...prev, [merged.key]: chosen.flatMap(row => prev[row.key] ?? [row]) }))
    setRows(next); setSelected([]); setMergeName('')
  }

  function split(key: string) {
    if (!rows || !sources[key]) return
    const at = rows.findIndex(row => row.key === key)
    const next = [...rows]
    next.splice(at, 1, ...sources[key])
    setSources(prev => { const { [key]: _, ...rest } = prev; return rest })
    setRows(next)
  }

  async function save() {
    if (!rows || counts.error) return
    const fresh = rows.filter((row, i) => statusOf(row, i) === 'new')
    if (!fresh.length) { setResult('Brak nowych zaproszeń do zapisania.'); return }
    if (!window.confirm(`Utworzyć ${fresh.length} nowych zaproszeń? Nic nie zostanie wysłane do gości.`)) return
    setBusy(true)
    const response = await commitImport(fresh)
    setBusy(false)
    if (!response.ok) { setResult(response.error); return }
    setResult(`Utworzono ${response.created} zaproszeń, pominięto ${response.skipped}. Nic nie zostało wysłane.`)
    setRows(null); setCsv('')
    router.refresh()
  }

  return <section className="rounded-2xl border bg-card p-5" aria-labelledby="import-heading">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 id="import-heading" className="text-lg font-semibold">Import z CSV</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Najpierw podgląd — nic nie zapisuje się ani nie wysyła bez Twojego potwierdzenia. Ponowny import pomija istniejące external_id.</p></div>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"><FileUp className="size-4" aria-hidden="true" />Wybierz plik<input type="file" accept=".csv,text/csv" className="sr-only" onChange={async e => { const file = e.target.files?.[0]; if (file) setCsv(await readCsvFile(file)); e.target.value = '' }} /></label>
    </div>
    <Textarea aria-label="Zawartość CSV" value={csv} onChange={e => setCsv(e.target.value)} rows={4} placeholder="external_id,display_name,known_guest_names,unnamed_guest_slots,max_guests,send_wave,source_rsvp,source_rows,default_language" className="mt-4 font-mono text-xs" />
    <div className="mt-3 flex flex-wrap gap-2"><Button onClick={runPreview} disabled={!csv.trim() || busy}>{busy && !rows ? 'Sprawdzanie…' : 'Podgląd importu'}</Button>{rows && <Button variant="ghost" onClick={() => { setRows(null); setFileErrors([]) }}><X data-icon="inline-start" />Zamknij podgląd</Button>}</div>
    {fileErrors.length > 0 && <ul role="alert" className="mt-4 flex flex-col gap-1 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{fileErrors.map(e => <li key={e}>{e}</li>)}</ul>}
    {result && <p role="status" className="mt-4 rounded-lg bg-muted p-3 text-sm">{result}</p>}

    {rows && rows.length > 0 && <div className="mt-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-sm"><Badge>{counts.new} nowe</Badge><Badge variant="secondary">{counts.exists} już zaimportowane</Badge>{counts.error > 0 && <Badge variant="destructive">{counts.error} z błędami</Badge>}<Badge variant="outline">{`PL: ${rows.filter(r => r.defaultLanguage === 'pl').length} · EN: ${rows.filter(r => r.defaultLanguage === 'en').length}`}</Badge></div>
      <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground sm:flex-1">Zaznacz wiersze jednego gospodarstwa i połącz je w jedno zaproszenie. Imiona się nie zdublują.</p>
        <Input aria-label="Nazwa połączonego zaproszenia" placeholder="Nazwa, np. Rodzina Nowaków" value={mergeName} onChange={e => setMergeName(e.target.value)} className="sm:w-56" />
        <Button variant="outline" onClick={merge} disabled={selected.length < 2}><Merge data-icon="inline-start" />Połącz ({selected.length})</Button>
      </div>
      <ul className="flex flex-col gap-2">{rows.map((row, i) => {
        const status = statusOf(row, i)
        const named = rowNamedGuests(row)
        return <li key={row.key} className="rounded-xl border p-3">
          <div className="flex items-start gap-3">
            <Checkbox aria-label={`Zaznacz ${row.externalId || row.key}`} className="mt-1" checked={selected.includes(row.key)} disabled={status === 'exists'} onCheckedChange={checked => setSelected(prev => checked ? [...prev, row.key] : prev.filter(k => k !== row.key))} />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{rowExternalIds(row).join(' + ')}</span>{status === 'new' && <Badge>nowe</Badge>}{status === 'exists' && <Badge variant="secondary">pominięte</Badge>}{status === 'error' && <Badge variant="destructive">błąd</Badge>}{row.sendWave && <Badge variant="outline">fala {row.sendWave}</Badge>}<Badge variant="outline" aria-label={`Domyślny język: ${row.defaultLanguage.toUpperCase()}`}>{row.defaultLanguage.toUpperCase()}</Badge><span className="text-xs text-muted-foreground">wiersz {row.lines.join(', ')}</span></div>
              <Input aria-label={`Nazwa zaproszenia ${row.externalId}`} value={row.displayName} onChange={e => setRows(prev => prev!.map(r => r.key === row.key ? { ...r, displayName: e.target.value } : r))} className="h-8 font-medium" />
              <p className="text-sm leading-relaxed">{named.join(', ')}{row.unnamedSlots > 0 && <span className="text-muted-foreground">{` + ${row.unnamedSlots} ${row.unnamedSlots === 1 ? 'osoba towarzysząca' : 'osoby towarzyszące'}`}</span>}<span className="text-muted-foreground">{` · ${rowGuestCount(row)} os.${row.maxGuests !== null ? ` / limit ${row.maxGuests}` : ''}`}</span></p>
              {row.sourceRsvp && <p className="text-xs text-muted-foreground">Historyczne RSVP (nie jest odpowiedzią ze strony): {row.sourceRsvp}</p>}
              {issues[i]?.length > 0 && <ul className="flex flex-col gap-0.5 text-xs">{issues[i].map(issue => <li key={issue.message} className={issue.level === 'error' ? 'text-destructive' : 'text-muted-foreground'}>{issue.message}</li>)}</ul>}
            </div>
            <div className="flex shrink-0 flex-col gap-1">
              {sources[row.key] && <Button size="sm" variant="ghost" onClick={() => split(row.key)}><Split data-icon="inline-start" />Rozdziel</Button>}
              <Button size="sm" variant="ghost" aria-label={`Usuń ${row.externalId} z importu`} onClick={() => setRows(prev => prev!.filter(r => r.key !== row.key))}><X /></Button>
            </div>
          </div>
        </li>
      })}</ul>
      <div className="flex flex-wrap items-center gap-3"><Button onClick={save} disabled={busy || counts.error > 0 || counts.new === 0}>{busy ? 'Zapisywanie…' : `Zapisz ${counts.new} nowych zaproszeń`}</Button>{counts.error > 0 && <p className="text-sm text-destructive">Popraw lub usuń wiersze z błędami.</p>}</div>
    </div>}
  </section>
}

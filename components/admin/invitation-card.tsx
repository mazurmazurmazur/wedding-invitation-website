'use client'

import { useState, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Copy, Eye, ExternalLink, Pencil, Plus, RefreshCw, Trash2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { deleteInvitation, regenerateLink, setInvitationLanguage, setInvitationSent, toggleInvitation, updateInvitation, type AdminInvitation } from '@/app/actions/admin'
import { guestLabel, invitationTitle, LANGUAGES, type Language, type RsvpStatus } from '@/lib/wedding'

const subscribe = () => () => {}
export function useOrigin() {
  return useSyncExternalStore(subscribe, () => window.location.origin, () => '')
}

const statusLabels: Record<RsvpStatus, string> = { pending: 'Brak odpowiedzi', attending: 'Wszyscy będą', partial: 'Część będzie', declined: 'Nie będą' }
const attendanceLabel = { yes: 'będzie', no: 'nie będzie' } as const

type DraftGuest = { id: string | null; name: string; placeholder: boolean; answered: boolean }

function EditGuests({ invitation, onDone }: { invitation: AdminInvitation; onDone: () => void }) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(invitation.displayName)
  const [sendWave, setSendWave] = useState(invitation.sendWave)
  const [maxGuests, setMaxGuests] = useState(invitation.maxGuests?.toString() ?? '')
  const [guests, setGuests] = useState<DraftGuest[]>(invitation.guests.map(g => ({ id: g.id, name: g.name, placeholder: Boolean(g.placeholder), answered: g.attendance !== null })))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const limit = maxGuests.trim() ? Number(maxGuests) : null

  function remove(index: number) {
    const guest = guests[index]
    if (guest.answered && !window.confirm(`${guest.name || 'Ta osoba'} już odpowiedziała. Usunąć ją razem z odpowiedzią?`)) return
    setGuests(prev => prev.filter((_, i) => i !== index))
  }

  async function save() {
    setError('')
    if (limit !== null && (!Number.isInteger(limit) || limit < 1)) { setError('Limit musi być liczbą od 1.'); return }
    setSaving(true)
    const result = await updateInvitation({ id: invitation.id, displayName, sendWave, maxGuests: limit, guests: guests.map(({ id, name, placeholder }) => ({ id, name, placeholder })) })
    setSaving(false)
    if (!result.ok) { setError(result.error); return }
    router.refresh(); onDone()
  }

  return <div className="mt-4 flex flex-col gap-3 rounded-xl bg-muted/50 p-4">
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="flex flex-col gap-1 text-xs font-medium sm:col-span-3">Nazwa zaproszenia (opcjonalnie)<Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="np. Rodzina Nowaków" /></label>
      <label className="flex flex-col gap-1 text-xs font-medium">Fala wysyłki<Input value={sendWave} onChange={e => setSendWave(e.target.value)} /></label>
      <label className="flex flex-col gap-1 text-xs font-medium">Maks. osób<Input inputMode="numeric" value={maxGuests} onChange={e => setMaxGuests(e.target.value.replace(/\D/g, ''))} placeholder="bez limitu" /></label>
    </div>
    <ul className="flex flex-col gap-2">{guests.map((guest, index) => <li key={guest.id ?? `new-${index}`} className="flex items-center gap-2">
      <Input aria-label={guest.placeholder ? 'Imię osoby towarzyszącej (opcjonalnie)' : 'Imię i nazwisko'} value={guest.name} placeholder={guest.placeholder ? 'Osoba towarzysząca — imię wpisze gość' : 'Imię i nazwisko'} onChange={e => setGuests(prev => prev.map((g, i) => i === index ? { ...g, name: e.target.value } : g))} />
      {guest.answered && <Badge variant="secondary">odpowiedź</Badge>}
      <Button size="icon" variant="ghost" aria-label={`Usuń ${guest.name || 'osobę towarzyszącą'}`} onClick={() => remove(index)} disabled={guests.length === 1}><Trash2 /></Button>
    </li>)}</ul>
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" disabled={limit !== null && guests.length >= limit} onClick={() => setGuests(prev => [...prev, { id: null, name: '', placeholder: false, answered: false }])}><Plus data-icon="inline-start" />Osoba</Button>
      <Button size="sm" variant="outline" disabled={limit !== null && guests.length >= limit} onClick={() => setGuests(prev => [...prev, { id: null, name: '', placeholder: true, answered: false }])}><UserPlus data-icon="inline-start" />Osoba towarzysząca</Button>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex gap-2"><Button size="sm" onClick={save} disabled={saving}>{saving ? 'Zapisywanie…' : 'Zapisz zmiany'}</Button><Button size="sm" variant="ghost" onClick={onDone}>Anuluj</Button></div>
  </div>
}

function LanguageSelector({ invitation }: { invitation: AdminInvitation }) {
  const router = useRouter()
  const [language, setLanguage] = useState<Language>(invitation.defaultLanguage)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function choose(next: Language) {
    if (next === language || saving) return
    const previous = language
    setLanguage(next); setSaving(true); setError('')
    const result = await setInvitationLanguage({ id: invitation.id, language: next })
    setSaving(false)
    if (!result.ok) { setLanguage(previous); setError(result.error); return }
    router.refresh()
  }

  return <div className="flex items-center gap-2">
    <div role="group" aria-label="Domyślny język zaproszenia" className="flex rounded-lg border p-0.5" aria-busy={saving}>
      {LANGUAGES.map(code => <Button key={code} size="xs" variant={language === code ? 'default' : 'ghost'} aria-pressed={language === code} disabled={saving} onClick={() => choose(code)}>{code.toUpperCase()}</Button>)}
    </div>
    {error && <span role="alert" className="text-xs text-destructive">{error}</span>}
  </div>
}

function SentCheckbox({ invitation }: { invitation: AdminInvitation }) {
  const router = useRouter()
  const [sent, setSent] = useState(Boolean(invitation.sentAt))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const date = invitation.sentAt ? new Date(invitation.sentAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' }) : ''

  async function change(next: boolean) {
    setSent(next); setSaving(true); setError(false)
    const result = await setInvitationSent(invitation.id, next)
    setSaving(false)
    if (!result.ok) { setSent(!next); setError(true); return }
    router.refresh()
  }

  return <label className="flex cursor-pointer items-center gap-2 text-sm">
    <Checkbox checked={sent} disabled={saving} onCheckedChange={checked => change(checked === true)} />
    <span>Wysłane{sent && date ? <span className="text-xs text-muted-foreground"> · {date}</span> : null}</span>
    {error && <span role="alert" className="text-xs text-destructive">Nie zapisano</span>}
  </label>
}

export function InvitationCard({ invitation }: { invitation: AdminInvitation }) {
  const router = useRouter()
  const origin = useOrigin()
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const url = invitation.token && origin ? `${origin}/invite/${invitation.token}` : ''

  async function copy() {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  async function run(action: () => Promise<unknown>) { setBusy(true); await action(); router.refresh(); setBusy(false) }

  return <article className="rounded-xl border p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-medium">{invitationTitle(invitation, 'pl')}</h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {invitation.externalId && <span className="font-mono">{invitation.externalId}</span>}
          {invitation.sendWave && <span>fala {invitation.sendWave}</span>}
          <span>{invitation.guests.length}{invitation.maxGuests ? `/${invitation.maxGuests}` : ''} os.</span>
          <span>{invitation.active ? 'Aktywne' : 'Wyłączone'}</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <LanguageSelector key={invitation.defaultLanguage} invitation={invitation} />
        <Badge variant={invitation.status === 'pending' ? 'outline' : invitation.status === 'declined' ? 'secondary' : 'default'}>{statusLabels[invitation.status]}</Badge>
      </div>
    </div>
    <ul className="mt-3 flex flex-col gap-1 text-sm">{invitation.guests.map(g => <li key={g.id} className="flex justify-between gap-3"><span className={g.name ? '' : 'text-muted-foreground'}>{guestLabel(g, invitation.guests, 'pl')}</span><span className="text-xs text-muted-foreground">{g.attendance ? attendanceLabel[g.attendance] : '—'}</span></li>)}</ul>
    {invitation.token ? <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <Input readOnly value={url} aria-label="Osobisty link zaproszenia" className="font-mono text-xs" onFocus={e => e.target.select()} />
      <div className="flex gap-2">
        <Button variant="outline" onClick={copy} disabled={!url}>{copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}{copied ? 'Skopiowano' : 'Kopiuj'}</Button>
        <Button nativeButton={false} variant="outline" render={<a href={url || undefined} target="_blank" rel="noopener noreferrer" />}><ExternalLink data-icon="inline-start" />Otwórz</Button>
      </div>
    </div> : <div className="mt-3 flex flex-col gap-2 rounded-lg bg-muted p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="leading-relaxed text-muted-foreground">Link utworzony przed zapisywaniem linków — działa, ale nie da się go wyświetlić.</p>
      <Button size="sm" variant="outline" disabled={busy} onClick={() => window.confirm('Wygenerować nowy link? Jeśli stary link został już wysłany, przestanie działać, a odpowiedzi zostaną zachowane.') && run(() => regenerateLink(invitation.id))}><RefreshCw data-icon="inline-start" />Wygeneruj nowy link</Button>
    </div>}
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <SentCheckbox key={invitation.sentAt ?? 'unsent'} invitation={invitation} />
      <Button nativeButton={false} size="sm" variant="ghost" render={<a href={`/dashboard/preview/${invitation.id}`} target="_blank" rel="noopener noreferrer" />}><Eye data-icon="inline-start" />Podgląd</Button>
      <Button size="sm" variant="ghost" onClick={() => setEditing(v => !v)} aria-expanded={editing}><Pencil data-icon="inline-start" />Edytuj osoby</Button>
      <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => toggleInvitation(invitation.id, !invitation.active))}>{invitation.active ? 'Wyłącz' : 'Włącz'}</Button>
      <Button size="sm" variant="ghost" className="text-destructive" disabled={busy} onClick={() => window.confirm('Usunąć to zaproszenie wraz z odpowiedziami? Link przestanie działać.') && run(() => deleteInvitation(invitation.id))}><Trash2 data-icon="inline-start" />Usuń</Button>
    </div>
    {editing && <EditGuests invitation={invitation} onDone={() => setEditing(false)} />}
  </article>
}

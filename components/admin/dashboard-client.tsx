'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createInvitation, type getAdminData } from '@/app/actions/admin'
import { ImportPanel } from './import-panel'
import { InvitationCard } from './invitation-card'

type Data = Awaited<ReturnType<typeof getAdminData>>

export function DashboardClient({ initialData }: { initialData: Data }) {
  const router = useRouter()
  const [names, setNames] = useState('')
  const [plusOnes, setPlusOnes] = useState('0')
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState('')
  const people = initialData.invitations.reduce((sum, inv) => sum + inv.guests.length, 0)
  const attending = initialData.invitations.reduce((sum, inv) => sum + inv.guests.filter(g => g.attendance === 'yes').length, 0)
  const awaiting = initialData.invitations.filter(inv => inv.active && inv.status === 'pending').length

  async function create() {
    const parsed = names.split('\n').map(name => name.trim()).filter(Boolean)
    if (!parsed.length) return
    setPending(true)
    const result = await createInvitation({ names: parsed, plusOnes: Number(plusOnes) || 0, greetingPl: '', greetingEn: '' })
    setNotice(result.ok ? 'Zaproszenie utworzone — link znajdziesz na liście.' : 'Nie udało się utworzyć zaproszenia.')
    if (result.ok) { setNames(''); setPlusOnes('0'); router.refresh() }
    setPending(false)
  }

  async function logout() { await authClient.signOut(); router.push('/sign-in'); router.refresh() }

  return <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-8">
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Maria & Krzysztof</p><h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Panel organizatorów</h1><p className="mt-2 text-sm text-muted-foreground">{initialData.user.email}</p></div>
        <Button variant="outline" onClick={logout}>Wyloguj</Button>
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Zaproszenia', initialData.invitations.length], ['Osoby', people], ['Potwierdzone', attending], ['Czeka na odpowiedź', awaiting]].map(([label, value]) => <div key={label} className="rounded-xl border bg-card p-4"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd></div>)}
      </dl>

      <ImportPanel />

      <section className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="flex flex-col gap-3 self-start rounded-2xl border bg-card p-5">
          <h2 className="text-lg font-semibold">Nowe zaproszenie</h2>
          <label className="flex flex-col gap-1 text-sm">Imiona i nazwiska, jedno w linii<Textarea value={names} onChange={e => setNames(e.target.value)} rows={5} placeholder={'Maria Kowalska\nJan Kowalski'} /></label>
          <label className="flex flex-col gap-1 text-sm">Osoby towarzyszące bez imienia<Input inputMode="numeric" value={plusOnes} onChange={e => setPlusOnes(e.target.value.replace(/\D/g, '').slice(0, 2))} /></label>
          <Button onClick={create} disabled={pending}>{pending ? 'Tworzenie…' : 'Utwórz zaproszenie'}</Button>
          <p className="text-xs leading-relaxed text-muted-foreground">Tworzenie zaproszenia nie wysyła wiadomości. Link przekazujecie gościom sami.</p>
          {notice && <p role="status" className="rounded-lg bg-muted p-3 text-sm">{notice}</p>}
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Zaproszenia</h2><Button nativeButton={false} variant="outline" size="sm" render={<a href="/dashboard/export" download />}><Download data-icon="inline-start" />Eksport CSV</Button></div>
          <div className="mt-4 flex flex-col gap-3">{initialData.invitations.length ? initialData.invitations.map(inv => <InvitationCard key={inv.id} invitation={inv} />) : <p className="text-sm text-muted-foreground">Brak zaproszeń.</p>}</div>
        </div>
      </section>
    </div>
  </main>
}

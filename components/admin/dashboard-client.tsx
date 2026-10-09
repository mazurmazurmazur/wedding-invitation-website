'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { createInvitation, deleteInvitation, toggleInvitation } from '@/app/actions/admin'

type Data = Awaited<ReturnType<typeof import('@/app/actions/admin').getAdminData>>

export function DashboardClient({ initialData }: { initialData: Data }) {
  const router = useRouter()
  const [names, setNames] = useState('')
  const [createdToken, setCreatedToken] = useState('')
  const [pending, setPending] = useState(false)
  const [deletingId, setDeletingId] = useState('')

  async function create() {
    const parsed = names.split('\n').map(name => name.trim()).filter(Boolean)
    if (!parsed.length) return
    setPending(true)
    const result = await createInvitation({ names: parsed, greetingPl: 'Cześć!', greetingEn: 'Hello!' })
    if (result.ok) { setCreatedToken(result.token); setNames(''); router.refresh() }
    setPending(false)
  }

  async function remove(id: string) {
    if (!window.confirm('Usunąć to zaproszenie? Link przestanie działać.')) return
    setDeletingId(id)
    await deleteInvitation(id)
    router.refresh()
    setDeletingId('')
  }

  async function logout() { await authClient.signOut(); router.push('/sign-in'); router.refresh() }
  function copy(token: string) { navigator.clipboard?.writeText(`${window.location.origin}/invite/${token}`) }

  return <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-8"><div className="mx-auto max-w-5xl"><header className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Maria & Krzysztof</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Panel organizatorów</h1><p className="mt-2 text-sm text-muted-foreground">{initialData.user.email}</p></div><button onClick={logout} className="rounded-lg border px-3 py-2 text-sm">Wyloguj</button></header><section className="mt-8 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"><div className="rounded-2xl border bg-card p-5"><h2 className="text-lg font-semibold">Nowe zaproszenie</h2><p className="mt-1 text-sm text-muted-foreground">Jedno imię lub nazwisko w każdej linii.</p><textarea value={names} onChange={e => setNames(e.target.value)} rows={7} placeholder={'Maria Kowalska\nJan Kowalski'} className="mt-4 w-full rounded-lg border bg-background px-3 py-3 text-sm" /><button onClick={create} disabled={pending} className="mt-3 w-full rounded-lg bg-primary px-4 py-3 text-primary-foreground disabled:opacity-60">{pending ? 'Tworzenie…' : 'Utwórz zaproszenie'}</button>{createdToken && <div className="mt-4 rounded-lg bg-muted p-3 text-xs"><p className="font-medium">Nowe zaproszenie</p><button onClick={() => copy(createdToken)} className="mt-2 underline">Kopiuj link zaproszenia (/invite)</button></div>}</div><div className="rounded-2xl border bg-card p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Zaproszenia</h2><span className="rounded-full bg-muted px-2.5 py-1 text-xs">{initialData.invitations.length}</span></div><div className="mt-4 flex flex-col gap-3">{initialData.invitations.map(inv => <article key={inv.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{inv.guests.map(g => g.name).join(' & ')}</p><p className="mt-1 text-xs text-muted-foreground">{inv.active ? 'Aktywne' : 'Wyłączone'} · {inv.respondedAt ? 'Odpowiedź otrzymana' : 'Brak odpowiedzi'}</p></div><span className="rounded-full bg-muted px-2 py-1 text-xs">{inv.guests.length} os.</span></div><div className="mt-3 flex flex-wrap gap-2"><button onClick={() => inv.token && copy(inv.token)} disabled={!inv.token} className="rounded-lg border px-3 py-2 text-xs disabled:opacity-50">Kopiuj link</button><button onClick={() => toggleInvitation(inv.id, !inv.active).then(() => router.refresh())} className="rounded-lg border px-3 py-2 text-xs">{inv.active ? 'Wyłącz' : 'Włącz'}</button><button onClick={() => remove(inv.id)} disabled={deletingId === inv.id} className="rounded-lg border border-destructive px-3 py-2 text-xs text-destructive disabled:opacity-50">{deletingId === inv.id ? 'Usuwanie…' : 'Usuń'}</button></div></article>)}</div></div></section></div></main>
}

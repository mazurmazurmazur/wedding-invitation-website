'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError('')
    const result = await authClient.signIn.email({ email, password })
    if (result.error) setError('Nie udało się zalogować. Sprawdź dane i spróbuj ponownie.')
    else { router.push('/dashboard'); router.refresh() }
    setPending(false)
  }

  return <main className="min-h-screen bg-background px-5 py-12 text-foreground"><div className="mx-auto max-w-md"><p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Maria & Krzysztof</p><h1 className="mt-5 text-4xl font-semibold tracking-tight">Panel organizatorów</h1><p className="mt-3 text-muted-foreground">Zaloguj się, aby zarządzać listą gości i RSVP.</p><form onSubmit={submit} className="mt-8 flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-sm"><label className="flex flex-col gap-2 text-sm font-medium">Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="rounded-lg border bg-background px-3 py-3 font-normal" /></label><label className="flex flex-col gap-2 text-sm font-medium">Hasło<input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="rounded-lg border bg-background px-3 py-3 font-normal" /></label>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<button disabled={pending} className="rounded-lg bg-primary px-4 py-3 text-primary-foreground disabled:opacity-60">{pending ? 'Logowanie…' : 'Zaloguj się'}</button></form></div></main>
}

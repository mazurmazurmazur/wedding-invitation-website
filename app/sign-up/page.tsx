'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    const result = await authClient.signUp.email({ name, email, password })
    if (result.error) {
      setError('Nie udało się utworzyć konta. Sprawdź dane i spróbuj ponownie.')
      setPending(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-background px-5 py-12 text-foreground">
      <div className="mx-auto max-w-md">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Maria & Krzysztof</p>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight">Utwórz konto organizatora</h1>
        <p className="mt-3 text-muted-foreground">Użyj adresu wpisanego w konfiguracji administratorów.</p>
        <form onSubmit={submit} className="mt-8 flex flex-col gap-5 rounded-2xl border bg-card p-6 shadow-sm">
          <label className="flex flex-col gap-2 text-sm font-medium">Imię<input required value={name} onChange={(event) => setName(event.target.value)} className="rounded-lg border bg-background px-3 py-3 font-normal" /></label>
          <label className="flex flex-col gap-2 text-sm font-medium">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-lg border bg-background px-3 py-3 font-normal" /></label>
          <label className="flex flex-col gap-2 text-sm font-medium">Hasło<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-lg border bg-background px-3 py-3 font-normal" /></label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <button disabled={pending} className="rounded-lg bg-primary px-4 py-3 text-primary-foreground disabled:opacity-60">{pending ? 'Tworzenie…' : 'Utwórz konto'}</button>
          <p className="text-center text-sm text-muted-foreground"><a href="/sign-in" className="font-medium text-foreground underline underline-offset-4">Wróć do logowania</a></p>
        </form>
      </div>
    </main>
  )
}

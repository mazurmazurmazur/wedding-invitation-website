'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AdminInvitation } from '@/app/actions/admin'
import type { RsvpStatus } from '@/lib/wedding'
import { InvitationCard } from './invitation-card'

type Filter = 'all' | RsvpStatus

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'Wszystkie' },
  { value: 'attending', label: 'Przyjęte' },
  { value: 'partial', label: 'Częściowo' },
  { value: 'declined', label: 'Odmowy' },
  { value: 'pending', label: 'Brak odpowiedzi' },
]

const fold = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export function InvitationList({ invitations }: { invitations: AdminInvitation[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const counts = invitations.reduce<Record<Filter, number>>(
    (acc, inv) => ({ ...acc, [inv.status]: acc[inv.status] + 1 }),
    { all: invitations.length, attending: 0, partial: 0, declined: 0, pending: 0 },
  )
  const needle = fold(query.trim())
  const visible = invitations.filter(inv =>
    (filter === 'all' || inv.status === filter) &&
    (!needle || fold([inv.displayName ?? '', ...inv.guests.map(g => g.name)].join(' ')).includes(needle)),
  )

  return <>
    <div className="mt-4 flex flex-col gap-3">
      <div role="group" aria-label="Filtruj według odpowiedzi" className="flex flex-wrap gap-2">
        {FILTERS.map(f => <Button key={f.value} size="sm" variant={filter === f.value ? 'default' : 'outline'} aria-pressed={filter === f.value} onClick={() => setFilter(f.value)}>
          {f.label}<span className="tabular-nums opacity-70">{counts[f.value]}</span>
        </Button>)}
      </div>
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" aria-label="Szukaj gościa" placeholder="Szukaj po imieniu lub nazwie zaproszenia" value={query} onChange={e => setQuery(e.target.value)} className="pl-8" />
      </div>
      <p role="status" className="text-xs text-muted-foreground">{`Widoczne: ${visible.length} z ${invitations.length}`}</p>
    </div>
    <div className="mt-3 flex flex-col gap-3">
      {visible.length
        ? visible.map(inv => <InvitationCard key={inv.id} invitation={inv} />)
        : <p className="text-sm text-muted-foreground">{invitations.length ? 'Brak zaproszeń dla wybranego filtra.' : 'Brak zaproszeń.'}</p>}
    </div>
  </>
}

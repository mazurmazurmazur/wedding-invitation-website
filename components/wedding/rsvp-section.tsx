'use client'

import { useState, useTransition } from 'react'
import { ArrowUpRight, Check, Mail, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel, FieldSet, FieldLegend } from '@/components/ui/field'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import { saveRsvp } from '@/app/actions/rsvp'
import { formatDate, type Guest, type Invitation, type Language, type WeddingSettings } from '@/lib/wedding'

function GuestSelect({ id, label, value, onChange, options, required }: { id: string; label: string; value: string; onChange: (value: string) => void; options: [string, string][]; required?: boolean }) {
  return <Field><FieldLabel htmlFor={id}>{label}</FieldLabel><NativeSelect id={id} value={value} onChange={e => onChange(e.target.value)} required={required} className="w-full">{options.map(([v, text]) => <NativeSelectOption value={v} key={v}>{text}</NativeSelectOption>)}</NativeSelect></Field>
}

export function RsvpSection({ settings, language, invitation, token }: { settings: WeddingSettings; language: Language; invitation?: Invitation; token?: string }) {
  const t = (pl: string, en: string) => language === 'pl' ? pl : en
  const [guests, setGuests] = useState<Guest[]>(invitation?.guests ?? [])
  const [message, setMessage] = useState(invitation?.message ?? '')
  const [saved, setSaved] = useState(false)
  const [closed, setClosed] = useState(invitation ? !invitation.editable : false)
  const [error, setError] = useState<'invalid' | 'closed' | 'unavailable' | null>(null)
  const [pending, startTransition] = useTransition()
  const update = (id: string, values: Partial<Guest>) => { setSaved(false); setError(null); setGuests(prev => prev.map(g => g.id === id ? { ...g, ...values } : g)) }
  const yesNo: [string, string][] = [['undecided', t('Jeszcze nie wiem', 'Undecided')], ['yes', t('Tak', 'Yes')], ['no', t('Nie', 'No')]]
  const errors = { invalid: t('Sprawdźcie odpowiedzi dla wszystkich zaproszonych osób.', 'Please check the answers for every invited person.'), closed: t('Termin odpowiedzi minął. Napiszcie do nas, a pomożemy.', 'The RSVP deadline has passed. Please contact us for help.'), unavailable: t('Nie udało się zapisać odpowiedzi. Spróbujcie ponownie lub skontaktujcie się z nami.', 'We couldn’t save your answers. Please try again or contact us.') }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!token || pending || closed) return
    setError(null)
    setSaved(false)
    startTransition(async () => {
      try {
        const result = await saveRsvp({ token, guests, message })
        if (!result.ok) { setError(result.error); if (result.error === 'closed') setClosed(true); return }
        setGuests(prev => prev.map(g => g.attendance === 'no' ? { ...g, dietary: '', transport: 'no', returnTime: 'none', accommodation: 'no', nextDay: 'no' } : g))
        setSaved(true)
      } catch { setError('unavailable') }
    })
  }

  return <section id="rsvp" className="rsvp-section section-pad" aria-labelledby="rsvp-heading">
    <div className="rsvp-heading"><span className="eyebrow">03 / RSVP</span><h2 id="rsvp-heading">{t('Będziecie', 'Will you')}<br /><i>{t('z nami?', 'be there?')}</i></h2><p>{t('Mamy nadzieję, że tak! Dajcie nam znać, żebyśmy mogli przygotować dla Was miejsce i zadbać o wszystkie drobiazgi.', 'We hope so! Let us know so we can save you a place and take care of all the little things.')}</p><p className="rsvp-deadline">{`${t('Czekamy do', 'Reply by')} ${formatDate(settings.deadline, language)}.`}</p></div>
    <div className="rsvp-form-area">{!invitation ? <div className="private-invitation-note"><Mail size={28} strokeWidth={1.2} aria-hidden="true" /><h3>{t('Zaproszenie tylko dla Was.', 'An invitation just for you.')}</h3><p>{t('Aby potwierdzić obecność, otwórzcie swój osobisty link do zaproszenia. Znajdziecie tam Wasze imiona i krótki formularz.', 'To RSVP, open your personal invitation link. You’ll find your names and a short form waiting for you.')}</p><a href="#contact" className="text-link">{t('Nie możecie znaleźć linku? Napiszcie do nas', 'Can’t find your link? Get in touch')}<ArrowUpRight size={16} /></a></div> : <form onSubmit={submit} className="rsvp-form" aria-label={t('Potwierdzenie obecności', 'RSVP form')}>
      {invitation.respondedAt && !saved && <p className="form-notice">{t('Wasze wcześniejsze odpowiedzi są poniżej. Możecie je zaktualizować do końca terminu.', 'Your saved answers are below. You can update them until the deadline.')}</p>}
      {closed && <p className="form-notice">{errors.closed}</p>}
      <fieldset disabled={closed || pending} className="flex min-w-0 flex-col gap-6">
        <legend className="sr-only">{t('Wasze odpowiedzi', 'Your answers')}</legend>
        {guests.map(guest => <FieldSet className="guest-response" key={guest.id}><FieldLegend>{guest.name}</FieldLegend><FieldGroup><GuestSelect id={`${guest.id}-attendance`} label={t('Czy będziesz z nami?', 'Will you join us?')} value={guest.attendance ?? ''} required onChange={value => update(guest.id, { attendance: value as Guest['attendance'] })} options={[[ '', t('Wybierz odpowiedź', 'Choose an answer') ], ['yes', t('Tak, z przyjemnością!', 'Yes, I’d love to!')], ['no', t('Niestety, nie mogę', 'Unfortunately, I can’t')]]} />
          {guest.attendance === 'yes' && <>
            <Field><FieldLabel htmlFor={`${guest.id}-dietary`}>{t('Alergie i potrzeby żywieniowe (opcjonalnie)', 'Allergies and dietary needs (optional)')}</FieldLabel><Textarea id={`${guest.id}-dietary`} maxLength={1500} value={guest.dietary} onChange={e => update(guest.id, { dietary: e.target.value })} /></Field>
            <GuestSelect id={`${guest.id}-transport`} label={t('Autokar z Warszawy, około 12:00', 'Coach from Warsaw, around 12:00')} value={guest.transport} onChange={v => update(guest.id, { transport: v as Guest['transport'] })} options={yesNo} />
            <GuestSelect id={`${guest.id}-return`} label={t('Powrót do Warszawy (noc z 2 na 3 maja)', 'Return to Warsaw (night of May 2–3)')} value={guest.returnTime} onChange={v => update(guest.id, { returnTime: v as Guest['returnTime'] })} options={[[ 'undecided', t('Jeszcze nie wiem', 'Undecided') ], ['01:00', t('Około 01:00', 'Around 01:00')], ['04:00', t('Około 04:00', 'Around 04:00')], ['none', t('Nie potrzebuję', 'Not needed')]]} />
            <GuestSelect id={`${guest.id}-accommodation`} label={t('Czy interesuje Cię nocleg?', 'Interested in staying overnight?')} value={guest.accommodation} onChange={v => update(guest.id, { accommodation: v as Guest['accommodation'] })} options={yesNo} />
            <GuestSelect id={`${guest.id}-next-day`} label={t('Poprawiny, 3 maja', 'Next-day celebration, May 3')} value={guest.nextDay} onChange={v => update(guest.id, { nextDay: v as Guest['nextDay'] })} options={yesNo} />
          </>}
        </FieldGroup></FieldSet>)}
        <Field><FieldLabel htmlFor="rsvp-message">{t('Coś od Was (opcjonalnie)', 'A little note (optional)')}</FieldLabel><Textarea id="rsvp-message" maxLength={3000} value={message} onChange={e => { setMessage(e.target.value); setSaved(false) }} /></Field>
        {!closed && <Button type="submit" size="lg" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" data-icon="inline-start" /> : <ArrowUpRight data-icon="inline-start" />}{pending ? t('Zapisujemy…', 'Saving…') : t('Zapisz odpowiedzi', 'Save answers')}</Button>}
      </fieldset>
      {error && <p className="form-error" role="alert">{errors[error]}</p>}
      {saved && <div className="form-notice" role="status"><Check size={18} aria-hidden="true" /><strong>{t('Dziękujemy', 'Thank you')}, {guests.map(g => g.name).join(', ')}!</strong><p>{t('Wasze odpowiedzi zostały zapisane. Możecie wrócić do tego linku i zmienić je do końca terminu.', 'Your answers have been saved. You can revisit this link and update them until the deadline.')}</p></div>}
    </form>}
    <details className="rsvp-privacy"><summary>{t('Wasze dane zostają między nami', 'Your details stay between us')}</summary><p>{t('Maria i Krzysztof wykorzystują odpowiedzi wyłącznie do organizacji ślubu, transportu, noclegów i posiłków. Informacje o diecie są dobrowolne. Niezbędne informacje mogą trafić do osób pomagających w organizacji, np. cateringu. Nie udostępniajcie osobistego linku innym osobom. Aby poprawić lub usunąć dane, skontaktujcie się z nami. Dane usuniemy po zakończeniu organizacji wesela.', 'Maria and Krzysztof use your answers only to organise the wedding, transport, accommodation and food. Dietary information is optional. Necessary details may be shared with people helping organise the day, such as the caterer. Please don’t share your personal link. Contact us to correct or delete your details. We’ll remove the data once wedding arrangements are complete.')}</p></details>
    </div>
  </section>
}

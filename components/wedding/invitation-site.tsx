'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { ArrowDown, ArrowUpRight, Menu, X, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { photos, formatDate, type Language, type WeddingSettings, type Invitation } from '@/lib/wedding'
import { PracticalDetails } from './practical-details'
import { RsvpSection } from './rsvp-section'

export function InvitationSite({ settings, invitation, token }: { settings: WeddingSettings; invitation?: Invitation; token?: string }) {
  const [language, setLanguage] = useState<Language>('pl')
  const [menuOpen, setMenuOpen] = useState(false)
  const pl = language === 'pl'
  const t = (polish: string, english: string) => pl ? polish : english
  useEffect(() => { document.documentElement.lang = language }, [language])
  const links = [
    ['#celebration', t('Nasz dzień', 'Our day')],
    ['#information', t('Warto wiedzieć', 'Good to know')],
    ['#contact', t('Kontakt', 'Contact')],
  ]
  const greeting = invitation ? (pl ? invitation.greetingPl : invitation.greetingEn) || invitation.guests.map(g => g.name).join(', ') : t('Najlepsze chwile są wspólne.', 'The best moments are shared.')

  return (
    <div className="invitation-site">
      <a className="skip-link" href="#main">{t('Przejdź do treści', 'Skip to content')}</a>
      <header className="site-header">
        <a href="#" className="monogram" aria-label="Maria & Krzysztof">m<span>&</span>k<span className="monogram-dot">.</span></a>
        <nav className="desktop-navigation" aria-label={t('Nawigacja główna', 'Main navigation')}>
          {links.map(([href, label]) => <a href={href} key={href}>{label}</a>)}
        </nav>
        <div className="header-actions">
          <div className="language-switch" aria-label={t('Język', 'Language')}>
            <button type="button" aria-pressed={pl} className={cn(pl && 'selected')} onClick={() => setLanguage('pl')}>PL</button>
            <span aria-hidden="true">/</span>
            <button type="button" aria-pressed={!pl} className={cn(!pl && 'selected')} onClick={() => setLanguage('en')}>EN</button>
          </div>
          <a className="header-rsvp" href="#rsvp">RSVP <ArrowUpRight aria-hidden="true" size={14} /></a>
          <button className="mobile-menu-toggle" aria-label={t('Menu', 'Menu')} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
        {menuOpen && <nav id="mobile-navigation" className="mobile-navigation" aria-label={t('Nawigacja mobilna', 'Mobile navigation')}>{links.map(([href, label]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}<ArrowUpRight size={18} /></a>)}</nav>}
      </header>

      <main id="main">
        <section className="hero-section" aria-labelledby="hero-heading">
          <div className="hero-copy">
            <div className="eyebrow hero-eyebrow"><span className="little-line" />{t('TO BĘDZIE NASZ DZIEŃ', 'A DAY TO CALL OURS')}</div>
            <h1 id="hero-heading">Maria<span className="name-second"><i>&</i> Krzysztof</span></h1>
            {invitation ? <div className="guest-greeting"><strong>{invitation.guests.map(g => g.name).join(' & ')} - {t('zaproszenie', 'invitation')}</strong></div> : <p className="hero-subtitle">{t('Bierzemy ślub. Bądźcie z nami.', 'We’re getting married. Be there with us.')}</p>}
            <div className="hero-details"><span>{formatDate(settings.date, language)}</span><span className="detail-dot">·</span><span>{settings.venue}</span></div>
            <a href="#rsvp" className="solid-link">{t('Będziemy razem?', 'Will you join us?')}<ArrowUpRight size={18} aria-hidden="true" /></a>
            <p className="hero-deadline">{`${t('Dajcie znać do', 'Let us know by')} ${formatDate(settings.deadline, language)}`}</p>
            <a href="#welcome" className="scroll-cue"><ArrowDown size={16} aria-hidden="true" /><span>{t('DALEJ JEST WIĘCEJ', 'THERE’S MORE BELOW')}</span></a>
          </div>
          <div className="hero-collage">
            <figure className="main-photo"><Image src={photos.engagement} alt={t('Maria pokazuje pierścionek zaręczynowy, obok niej Krzysztof', 'Maria showing her engagement ring beside Krzysztof')} fill sizes="(max-width: 700px) 78vw, 39vw" priority /><span className="photo-corner" aria-hidden="true" /></figure>
            <figure className="small-photo"><Image src={photos.temple} alt={t('Wspólna podróż Marii i Krzysztofa', 'Maria and Krzysztof travelling together')} width={300} height={225} sizes="(max-width: 700px) 40vw, 18vw" /><figcaption>{t('zawsze lepiej razem', 'always better together')}</figcaption></figure>
            <div className="date-stamp" aria-label={formatDate(settings.date, language)}><span>{t('ZAPISZCIE TĘ DATĘ', 'SAVE THE DATE')}</span><strong>{settings.date.slice(8)}. {settings.date.slice(5, 7)}.</strong><span>{settings.date.slice(0, 4)}</span></div>
            <span className="collage-note">{t('i tak już na zawsze.', 'and so, forever.')}</span>
          </div>
        </section>

        <div className="day-ribbon"><span>{formatDate(settings.date, language, { weekday: 'long' }).toLocaleUpperCase(language)}</span><span className="ribbon-date">{settings.date.slice(8)} <i>/</i> {settings.date.slice(5, 7)} <i>/</i> {settings.date.slice(0, 4)}</span><span>{t('WY + MY + DOBRY DZIEŃ', 'YOU + US + A GOOD DAY')}</span></div>

        <section id="welcome" className="welcome-section section-pad">
          <span className="eyebrow">{t('MAŁE ZAPROSZENIE. WIELKA RADOŚĆ.', 'A LITTLE INVITATION. A LOT OF JOY.')}</span>
          <h2>{greeting}</h2>
          <p>{settings.welcome[language]}</p>
          <span className="signature">Maria & Krzysztof</span>
        </section>

        <section id="celebration" className="celebration-section section-pad">
          <div className="celebration-photo"><Image src={photos.together} alt={t('Maria i Krzysztof na spacerze z widokiem na miasto', 'Maria and Krzysztof enjoying a city view')} fill sizes="(max-width: 700px) 90vw, 44vw" /><span className="photo-label">{t('DOBRZE BYĆ RAZEM.', 'BETTER, TOGETHER.')}</span></div>
          <div className="celebration-copy"><span className="eyebrow">01 / {t('NASZ DZIEŃ', 'OUR DAY')}</span><h2>{t('Jedno miejsce.', 'One place.')}<br /><i>{t('Cały nasz świat.', 'All our people.')}</i></h2><p>{t('Ślub i wesele spędzimy w jednym miejscu, wśród zieleni. Bez pośpiechu i sztywnego planu. Z czasem na rozmowy, śmiech i jeszcze jeden taniec.', 'Our ceremony and celebration will be in one place, surrounded by greenery. No rush and no strict schedule. Just time for conversations, laughter and one more dance.')}</p><div className="venue-details"><div><span className="eyebrow">{t('KIEDY', 'WHEN')}</span><p>{formatDate(settings.date, language)}<br />{`${t('Ceremonia o', 'Ceremony at')} ${settings.time}`}</p></div><div><span className="eyebrow">{t('GDZIE', 'WHERE')}</span><p>{settings.venue}<br />{settings.address}</p></div></div><div className="venue-links"><a className="text-link" href={settings.mapsUrl} target="_blank" rel="noreferrer">{t('Jak dojechać', 'Get directions')} <ArrowUpRight size={16} /></a><a className="text-link" href="/calendar">{t('Dodaj do kalendarza', 'Add to calendar')}<ArrowUpRight size={16} /></a></div></div>
        </section>

        <PracticalDetails settings={settings} language={language} />

        <section className="memories-section" aria-labelledby="memories-heading"><div className="memories-heading"><span className="eyebrow">{t('TU I TAM. ZAWSZE RAZEM.', 'HERE AND THERE. ALWAYS TOGETHER.')}</span><h2 id="memories-heading">{t('Po prostu', 'Simply')}{' '}<i>{t('my.', 'us.')}</i></h2><span className="memory-counter">01 — 05</span></div><div className="photo-strip">{(['sailing', 'seoul', 'beach', 'shanghai', 'home'] as const).map((key, i) => <figure key={key}><div><Image src={photos[key]} alt={t(['Razem na żaglówce', 'Spacer w Seulu', 'Wspólny dzień na plaży', 'Nocny Szanghaj', 'Spokojny wieczór w domu'][i], ['Sailing together', 'A walk in Seoul', 'A day at the beach', 'Shanghai at night', 'A quiet evening at home'][i])} fill sizes="(max-width: 700px) 64vw, 25vw" /></div><figcaption><span>0{i + 1}</span>{t(['na wodzie', 'daleko od domu', 'z wiatrem we włosach', 'w świetle miasta', 'najbliżej siebie'][i], ['on the water', 'far from home', 'wind in our hair', 'city lights', 'close to home'][i])}</figcaption></figure>)}</div></section>

        <RsvpSection settings={settings} language={language} invitation={invitation} token={token} />

        <section id="contact" className="contact-section section-pad"><div><span className="eyebrow">{t('JESTEŚMY DLA WAS', 'WE’RE HERE FOR YOU')}</span><h2>{t('Pogadajmy.', 'Let’s talk.')}</h2><p>{t('Pytania, pomysły, coś do ustalenia? Po prostu do nas napiszcie lub zadzwońcie.', 'Questions, ideas or something to arrange? Just send us a message or give us a call.')}</p></div><div className="contact-people">{[['Maria', settings.mariaContact], ['Krzysztof', settings.krzysztofContact]].map(([name, contact]) => <div key={name}><span className="contact-name">{name}</span>{contact ? <a className="text-link" href={`tel:${contact.replace(/[^+\d]/g, '')}`}>{contact}<ArrowUpRight size={16} /></a> : <span className="contact-placeholder">{t('Numer podamy wkrótce', 'Phone number coming soon')}</span>}</div>)}</div></section>
      </main>
      <footer className="site-footer"><a href="#" className="monogram" aria-label={t('Wróć na górę', 'Back to top')}>m<span>&</span>k.</a><p>{`${t('Do zobaczenia', 'See you on')} ${formatDate(settings.date, language)}.`}</p><span>{t('Z RADOŚCIĄ', 'WITH JOY')} <Heart size={12} aria-hidden="true" /> M & K</span></footer>
    </div>
  )
}

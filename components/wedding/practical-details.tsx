import { ArrowDownRight, BusFront, Moon, Utensils, MoveUpRight } from 'lucide-react'
import type { Language, WeddingSettings } from '@/lib/wedding'

export function PracticalDetails({ settings, language }: { settings: WeddingSettings; language: Language }) {
  const t = (pl: string, en: string) => language === 'pl' ? pl : en
  return (
    <section id="information" className="practical-section section-pad">
      <div className="section-heading"><div><span className="eyebrow">02 / {t('WARTO WIEDZIEĆ', 'GOOD TO KNOW')}</span><h2>{t('Małe szczegóły,', 'Little details,')}<br /><i>{t('spokojna głowa.', 'peace of mind.')}</i></h2></div><ArrowDownRight className="section-arrow" strokeWidth={1} size={64} aria-hidden="true" /></div>
      <div className="practical-grid">
        <article className="practical-item"><BusFront size={25} strokeWidth={1.2} aria-hidden="true" /><h3>{t('W drogę razem', 'Let’s go together')}</h3><p>{settings.transport[language]}</p><div className="transport-times"><span>{t('WARSZAWA', 'WARSAW')} <MoveUpRight size={13} aria-hidden="true" /> BORUCZA</span><strong>~12:00</strong></div><p>{settings.returnTransport[language]}</p><div className="transport-times"><span>BORUCZA <MoveUpRight size={13} aria-hidden="true" /> {t('WARSZAWA', 'WARSAW')}</span><strong>~01:00 / ~04:00</strong></div></article>
        <article className="practical-item"><Moon size={25} strokeWidth={1.2} aria-hidden="true" /><h3>{t('Zostańcie na dłużej', 'Stay a little longer')}</h3><p>{settings.accommodation[language]}</p><div className="small-callout"><span className="eyebrow">{t('PONIEDZIAŁEK, 3 MAJA', 'MONDAY, MAY 3')}</span><span>{t('Poprawiny. Jeszcze trochę razem.', 'A next-day gathering. A little more us.')}</span></div><p className="fine-print">{t('Zaznaczcie swoje plany w RSVP — pomoże nam to wszystko zorganizować.', 'Share your plans in your RSVP — it will help us organise everything.')}</p></article>
        <article className="practical-item"><Utensils size={25} strokeWidth={1.2} aria-hidden="true" /><h3>{t('Smacznie i swobodnie', 'Good food, good company')}</h3><p>{settings.food[language]}</p><div className="small-callout"><span className="eyebrow">{t('A CO NA SIEBIE?', 'WHAT TO WEAR?')}</span><p>{settings.dressCode[language]}</p></div></article>
      </div>
    </section>
  )
}

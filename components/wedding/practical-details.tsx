import { ArrowDownRight, BusFront, Moon, Utensils, MoveUpRight } from 'lucide-react'
import type { Language, WeddingSettings } from '@/lib/wedding'

export function PracticalDetails({ settings, language }: { settings: WeddingSettings; language: Language }) {
  const t = (pl: string, en: string) => language === 'pl' ? pl : en
  return (
    <section id="information" className="practical-section section-pad">
      <div className="section-heading"><div><span className="eyebrow">02 / {t('WARTO WIEDZIEĆ', 'GOOD TO KNOW')}</span><h2>{t('Wszystko, co', 'Everything you')}<br /><i>{t('musisz wiedzieć', 'need to know')}</i></h2></div><ArrowDownRight className="section-arrow" strokeWidth={1} size={64} aria-hidden="true" /></div>
      <div className="practical-grid">
        <article className="practical-item"><BusFront size={25} strokeWidth={1.2} aria-hidden="true" /><h3>{t('Dojazd', 'Transport')}</h3><p>{settings.transport[language]}</p><div className="transport-times"><span>{t('WARSZAWA', 'WARSAW')} <MoveUpRight size={13} aria-hidden="true" /> BORUCZA</span><strong>~12:00</strong></div><p>{settings.returnTransport[language]}</p><div className="transport-times"><span>BORUCZA <MoveUpRight size={13} aria-hidden="true" /> {t('WARSZAWA', 'WARSAW')}</span><strong>~01:00 / ~04:00</strong></div></article>
        <article className="practical-item"><Moon size={25} strokeWidth={1.2} aria-hidden="true" /><h3>{t('Poprawiny', 'Next-day celebration')}</h3><p>{settings.accommodation[language]}</p><div className="small-callout"><span className="eyebrow">{t('PONIEDZIAŁEK, 3 MAJA', 'MONDAY, MAY 3')}</span><span>{t('Poprawiny. Jeszcze trochę razem.', 'A next-day gathering. A little more us.')}</span></div><p className="fine-print">{t('Zaznaczcie swoje plany w RSVP — pomoże nam to wszystko zorganizować.', 'Share your plans in your RSVP — it will help us organise everything.')}</p></article>
        <article className="practical-item"><Utensils size={25} strokeWidth={1.2} aria-hidden="true" /><h3>{t('Smacznie i swobodnie', 'Good food, good company')}</h3><p>{settings.food[language]}</p></article>
        <article className="practical-item" id="dresscode"><h3>Dresscode</h3><p>{settings.dressCode[language]}</p></article>
        <article className="practical-item" id="visa"><h3>{t('Wiza', 'Visa')}</h3><p>{t('Jeżeli Ty lub Twoja druga połówka potrzebujecie wizy do Polski, skontaktujcie się z nami jak najszybciej. Pomożemy Wam przygotować wszystkie dokumenty.', 'If you or your partner need a visa to Poland, please contact us as soon as possible. We will help you prepare all the necessary documents.')}</p><a className="text-link" href="#contact">{t('Skontaktujcie się z nami', 'Contact us')}<MoveUpRight size={16} aria-hidden="true" /></a></article>
        <article className="practical-item" id="poland"><h3>{t('Polska', 'Poland')}</h3><p>{t('Jeżeli mieszkacie za granicą i zastanawiacie się, na jakie lotnisko najlepiej przylecieć, skontaktujcie się z nami — pomożemy Wam w wyborze miejsca przylotu oraz zarekomendujemy dojazd do Warszawy.', 'If you live abroad and are wondering which airport to fly into, please contact us. We will help you choose your arrival airport and recommend how to get to Warsaw.')}</p><a className="text-link" href="#contact">{t('Skontaktujcie się z nami', 'Contact us')}<MoveUpRight size={16} aria-hidden="true" /></a></article>
      </div>
    </section>
  )
}

import Link from 'next/link'

export default function NotFound() {
  return <main className="error-page"><span className="eyebrow">MARIA & KRZYSZTOF</span><h1>Sprawdźmy link.</h1><p>To zaproszenie jest nieaktywne lub link jest niepoprawny. Skontaktujcie się z nami, a pomożemy.</p><p lang="en">This invitation is inactive or the link is incorrect. Please contact Maria or Krzysztof for a new link.</p><Link className="text-link" href="/">Strona główna / Home</Link></main>
}

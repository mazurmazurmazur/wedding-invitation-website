'use client'

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="error-page"><span className="eyebrow">MARIA & KRZYSZTOF</span><h1>Jeszcze chwilka.</h1><p>Nie udało się wczytać zaproszenia. Sprawdźcie połączenie i spróbujcie ponownie.</p><p lang="en">We couldn’t load the invitation. Please check your connection and try again.</p><button className="solid-link" onClick={reset}>Spróbuj ponownie / Try again</button></main>
}

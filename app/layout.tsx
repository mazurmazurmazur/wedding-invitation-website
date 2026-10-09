import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Manrope } from 'next/font/google'
import './globals.css'

const serif = Cormorant_Garamond({ subsets: ['latin', 'latin-ext'], weight: ['300', '400', '500', '600'], style: ['normal', 'italic'], variable: '--font-cormorant', display: 'swap' })
const sans = Manrope({ subsets: ['latin', 'latin-ext'], variable: '--font-manrope', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.V0_RUNTIME_URL || 'http://localhost:3000'),
  title: 'Maria & Krzysztof — 2 maja 2027',
  description: 'Bierzemy ślub. Bądźcie z nami! 2 maja 2027, Ostoja Borucza. Nasz dzień, wszystkie szczegóły i Wasze RSVP.',
  openGraph: { title: 'Maria & Krzysztof — Bądźcie z nami', description: '2 maja 2027 · Ostoja Borucza', type: 'website', locale: 'pl_PL', alternateLocale: 'en_GB' },
  twitter: { card: 'summary_large_image', title: 'Maria & Krzysztof — 2 maja 2027' },
  robots: { index: false, follow: false },
  icons: { icon: '/icon.svg' },
}

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#f7f5ee', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pl" className={`${serif.variable} ${sans.variable}`}><body>{children}</body></html>
}

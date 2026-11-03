import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Manrope } from 'next/font/google'
import { SHARE_DESCRIPTION, SHARE_IMAGE, SHARE_TITLE, SITE_NAME, SITE_URL } from '@/lib/site'
import './globals.css'

const serif = Cormorant_Garamond({ subsets: ['latin', 'latin-ext'], weight: ['300', '400', '500', '600'], style: ['normal', 'italic'], variable: '--font-cormorant', display: 'swap' })
const sans = Manrope({ subsets: ['latin', 'latin-ext'], variable: '--font-manrope', display: 'swap' })

// Every route (including personal /invite/[token] links) inherits this generic metadata.
// og:url and the canonical always point at the homepage, so tokens never appear in shared metadata.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SHARE_TITLE,
  description: SHARE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: SITE_NAME,
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    locale: 'pl_PL',
    alternateLocale: ['en_GB'],
    images: [SHARE_IMAGE],
  },
  twitter: { card: 'summary_large_image', title: SHARE_TITLE, description: SHARE_DESCRIPTION, images: [{ url: SHARE_IMAGE.url, alt: SHARE_IMAGE.alt }] },
  // Kept out of search results; link-preview crawlers (Facebook, Messenger, WhatsApp) still read Open Graph tags.
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: '/favicon.ico', sizes: '16x16 32x32 48x48' }, { url: '/icon-192.png', type: 'image/png', sizes: '192x192' }],
    apple: [{ url: '/apple-icon.png', sizes: '180x180' }],
  },
}

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#f7f5ee', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pl" className={`${serif.variable} ${sans.variable}`}><body>{children}</body></html>
}

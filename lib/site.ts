/**
 * Public origin used for canonical and Open Graph URLs. Production uses the final www host directly,
 * because the apex domain answers with a 308 redirect and link-preview crawlers should not need to follow it.
 */
export const SITE_URL =
  process.env.VERCEL_ENV === 'production' ? 'https://www.mariaikrzysztof.pl'
  : process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}`
  : process.env.V0_RUNTIME_URL || 'http://localhost:3000'

export const SITE_NAME = 'Maria & Krzysztof'
export const SHARE_TITLE = 'Maria & Krzysztof — 2 maja 2027'
export const SHARE_DESCRIPTION = 'Bierzemy ślub! Bądźcie z nami 2 maja 2027 w Ostoi Borucza.'

/** Static, generic preview: identical for the homepage and every personal invitation link. */
export const SHARE_IMAGE = {
  url: '/og-image.jpg',
  width: 1200,
  height: 630,
  type: 'image/jpeg',
  alt: 'Maria i Krzysztof w morzu na tle klifów — 2 maja 2027, Ostoja Borucza',
}

import type { MetadataRoute } from 'next'

// Crawling stays allowed on purpose: a robots.txt Disallow would stop Facebook, Messenger and WhatsApp
// from fetching link previews, and would also hide the noindex directives from search engines.
// Pages are kept out of search results by the robots meta tag and the X-Robots-Tag header instead.
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/' }] }
}

// Generates the static social preview (public/og-image.jpg) and the M&K monogram icons
// from the site's own photo, palette and fonts. Run: node scripts/build-social-images.mjs
// Output is committed; nothing here runs at request time.
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile, access } from 'node:fs/promises'
import { createElement as h } from 'react'

const require = createRequire(import.meta.url)
const nextRequire = createRequire(require.resolve('next/package.json'))
const sharp = nextRequire('sharp')
const { ImageResponse } = nextRequire('next/dist/compiled/@vercel/og/index.node.js')

const ROOT = new URL('..', import.meta.url)
const FONT_DIR = process.env.FONT_DIR ?? '/tmp/ogfonts'
const COLORS = { background: '#f7f5ee', ink: '#74372f', text: '#33382e', hairline: '#d9d4c4', cream: '#fffdf8' }

const FONTS = [
  { file: 'cormorant-500', family: 'Cormorant Garamond', axis: 'wght@500', name: 'Cormorant', weight: 500, style: 'normal' },
  { file: 'cormorant-500i', family: 'Cormorant Garamond', axis: 'ital,wght@1,500', name: 'Cormorant', weight: 500, style: 'italic' },
  { file: 'cormorant-600', family: 'Cormorant Garamond', axis: 'wght@600', name: 'Cormorant', weight: 600, style: 'normal' },
  { file: 'manrope-500', family: 'Manrope', axis: 'wght@500', name: 'Manrope', weight: 500, style: 'normal' },
]

async function loadFont({ file, family, axis }) {
  const path = `${FONT_DIR}/${file}.ttf`
  try { await access(path) } catch {
    await mkdir(FONT_DIR, { recursive: true })
    // Without a browser user agent Google Fonts serves complete TrueType files (incl. Polish glyphs).
    const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:${axis}`)).text()
    const url = css.match(/url\((https:[^)]+)\)/)?.[1]
    if (!url) throw new Error(`Font not found: ${family} ${axis}`)
    await writeFile(path, Buffer.from(await (await fetch(url)).arrayBuffer()))
  }
  return readFile(path)
}

const fonts = await Promise.all(FONTS.map(async font => ({ name: font.name, data: await loadFont(font), weight: font.weight, style: font.style })))
const render = async (element, width, height) => Buffer.from(await new ImageResponse(element, { width, height, fonts }).arrayBuffer())

// Open Graph card: 1200×630. The photo is DSC00106 (the hero image), cropped around the couple.
const PHOTO = { left: 655, top: 800, width: 1090, height: 1094 }
const FRAME = { left: 612, top: 40, width: 548, height: 550 }
const photo = await sharp(new URL('public/images/DSC00106.jpg', ROOT).pathname)
  .extract(PHOTO)
  .resize(FRAME.width * 2, FRAME.height * 2, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 90 })
  .toBuffer()

const card = h('div', { style: { display: 'flex', width: '100%', height: '100%', background: COLORS.background, position: 'relative' } },
  h('div', { style: { display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'absolute', left: 76, top: 0, bottom: 0, width: 500 } },
    h('div', { style: { display: 'flex', fontFamily: 'Cormorant', fontWeight: 500, fontSize: 132, lineHeight: 0.92, color: COLORS.ink, letterSpacing: -2 } }, 'Maria'),
    h('div', { style: { display: 'flex', alignItems: 'baseline', fontFamily: 'Cormorant', fontWeight: 500, fontSize: 112, lineHeight: 1.05, color: COLORS.ink, letterSpacing: -2 } },
      h('span', { style: { fontStyle: 'italic', marginRight: 22 } }, '&'),
      h('span', {}, 'Krzysztof')),
    h('div', { style: { display: 'flex', width: 64, height: 2, background: COLORS.ink, opacity: 0.55, marginTop: 34, marginBottom: 28 } }),
    h('div', { style: { display: 'flex', fontFamily: 'Cormorant', fontWeight: 600, fontSize: 44, color: COLORS.ink, lineHeight: 1.1 } }, '2 maja 2027'),
    h('div', { style: { display: 'flex', fontFamily: 'Manrope', fontWeight: 500, fontSize: 22, color: COLORS.text, letterSpacing: 3, marginTop: 14, textTransform: 'uppercase' } }, 'Ostoja Borucza')),
  h('img', { src: `data:image/jpeg;base64,${photo.toString('base64')}`, width: FRAME.width, height: FRAME.height, style: { position: 'absolute', left: FRAME.left, top: FRAME.top, width: FRAME.width, height: FRAME.height, objectFit: 'cover' } }))

const cardPng = await render(card, 1200, 630)
const og = await sharp(cardPng).flatten({ background: COLORS.background }).jpeg({ quality: 84, mozjpeg: true, progressive: true, chromaSubsampling: '4:4:4' }).toBuffer()
await writeFile(new URL('public/og-image.jpg', ROOT), og)

// Monogram icon, drawn large and downscaled so small sizes stay crisp.
const monogram = (size, rounded) => h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: COLORS.ink, borderRadius: rounded ? size * 0.2 : 0 } },
  h('div', { style: { display: 'flex', alignItems: 'baseline', fontFamily: 'Cormorant', fontWeight: 600, fontSize: size * 0.4, color: COLORS.cream, letterSpacing: -size * 0.01, marginTop: -size * 0.05 } },
    h('span', {}, 'M'), h('span', { style: { fontStyle: 'italic', fontWeight: 500, fontSize: size * 0.33, margin: `0 ${size * 0.008}px` } }, '&'), h('span', {}, 'K')))

const roundedMaster = await render(monogram(512, true), 512, 512)
const squareMaster = await render(monogram(512, false), 512, 512)
const png = (master, size) => sharp(master).resize(size, size, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toBuffer()

await writeFile(new URL('public/icon-192.png', ROOT), await png(roundedMaster, 192))
await writeFile(new URL('public/icon-512.png', ROOT), await png(roundedMaster, 512))
// iOS applies its own rounded mask, so the apple icon is full-bleed.
await writeFile(new URL('public/apple-icon.png', ROOT), await png(squareMaster, 180))

// favicon.ico with PNG-encoded 16/32/48 entries (supported by all current browsers).
const icoSizes = [16, 32, 48]
const icoImages = await Promise.all(icoSizes.map(size => png(roundedMaster, size)))
const header = Buffer.alloc(6 + 16 * icoSizes.length)
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(icoSizes.length, 4)
let offset = header.length
icoSizes.forEach((size, i) => {
  const entry = 6 + 16 * i
  header.writeUInt8(size, entry); header.writeUInt8(size, entry + 1); header.writeUInt8(0, entry + 2); header.writeUInt8(0, entry + 3)
  header.writeUInt16LE(1, entry + 4); header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(icoImages[i].length, entry + 8); header.writeUInt32LE(offset, entry + 12)
  offset += icoImages[i].length
})
await writeFile(new URL('public/favicon.ico', ROOT), Buffer.concat([header, ...icoImages]))

const meta = await sharp(og).metadata()
console.log(`og-image.jpg ${meta.width}x${meta.height} ${meta.format} ${(og.length / 1024).toFixed(0)} KB`)

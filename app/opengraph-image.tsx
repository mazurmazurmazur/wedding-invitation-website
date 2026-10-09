import { ImageResponse } from 'next/og'

export const alt = 'Maria & Krzysztof — 2 maja 2027 · Ostoja Borucza'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: '#f7f5ee', color: '#74372f', border: '24px solid #e4e7d9' }}><div style={{ display: 'flex', fontSize: 18, letterSpacing: 6, marginBottom: 38 }}>BĄDŹCIE Z NAMI</div><div style={{ display: 'flex', fontSize: 94, fontFamily: 'serif', marginBottom: 38 }}>Maria & Krzysztof</div><div style={{ display: 'flex', fontSize: 26 }}>2 maja 2027 · Ostoja Borucza</div></div>, size)
}

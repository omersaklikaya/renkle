import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Renkle — Günlük Renk Bulmacaları'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div style={{
        background: '#111110',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 24,
      }}
      >
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'conic-gradient(hsl(0,100%,60%), hsl(90,100%,60%), hsl(180,100%,60%), hsl(270,100%,60%), hsl(360,100%,60%))',
          display: 'flex',
        }}
        />
        <div style={{
          fontSize: 64,
          fontWeight: 700,
          color: '#f0ede8',
          letterSpacing: '-2px',
        }}
        >
          renkle
        </div>
        <div style={{
          fontSize: 24,
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '-0.5px',
        }}
        >
          günlük renk bulmacaları
        </div>
      </div>
    ),
    { ...size },
  )
}

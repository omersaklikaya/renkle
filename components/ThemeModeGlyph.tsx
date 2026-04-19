'use client'

import type { CSSProperties } from 'react'
import type { SiteTheme } from '@/lib/siteTheme'

/** Koyu görünümde güneş (açığa geç), açık görünümde ay (koyuya geç). */
export default function ThemeModeGlyph({
  theme,
  style,
}: {
  theme: SiteTheme
  style?: CSSProperties
}) {
  if (theme === 'dark') {
    const R = 4.25
    const Ro = 11
    const cx = 12
    const cy = 12
    const rays: [number, number, number, number][] = []
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + (Math.PI / 4) * i
      const ca = Math.cos(a)
      const sa = Math.sin(a)
      const x2 = cx + R * ca
      const y2 = cy + R * sa
      const x1 = cx + Ro * ca
      const y1 = cy + Ro * sa
      rays.push([x1, y1, x2, y2])
    }
    return (
      <svg
        width={14}
        height={14}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        style={style}
      >
        <g stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          {rays.map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
          ))}
        </g>
        <circle cx={cx} cy={cy} r={R} fill="currentColor" />
      </svg>
    )
  }
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={style}
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

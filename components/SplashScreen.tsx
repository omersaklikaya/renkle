'use client'

import { useState, useEffect } from 'react'

export default function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 1200)
    const t2 = setTimeout(() => setVisible(false), 1800)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.6s ease',
        pointerEvents: fading ? 'none' : 'all',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background:
            'conic-gradient(hsl(0,100%,60%), hsl(45,100%,60%), hsl(90,100%,60%), hsl(135,100%,60%), hsl(180,100%,60%), hsl(225,100%,60%), hsl(270,100%,60%), hsl(315,100%,60%), hsl(360,100%,60%))',
          boxShadow: '0 0 24px 4px rgba(128,128,128,0.2)',
          animation: 'splashDotSpin 1.2s cubic-bezier(0.34,1.56,0.64,1) forwards',
        }}
      />
      <span
        style={{
          fontSize: 24,
          fontWeight: 500,
          letterSpacing: '-0.4px',
          color: 'var(--text-primary)',
          animation: 'splashTextFade 0.6s ease 0.3s both',
        }}
      >
        renkle
      </span>
    </div>
  )
}

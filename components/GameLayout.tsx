'use client'

import type { ReactNode } from 'react'
import NavBar from '@/components/NavBar'

interface GameLayoutProps {
  lang: 'tr' | 'en'
  onLangChange: (l: 'tr' | 'en') => void
  streak: number
  children: ReactNode
}

export default function GameLayout({
  lang,
  onLangChange,
  streak,
  children,
}: GameLayoutProps) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
    }}
    >
      <NavBar lang={lang} onLangChange={onLangChange} streak={streak} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {children}
      </div>
    </div>
  )
}

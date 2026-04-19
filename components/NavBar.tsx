'use client'

import { useState } from 'react'
import ThemeModeGlyph from '@/components/ThemeModeGlyph'

interface NavBarProps {
  lang: 'tr' | 'en'
  onLangChange: (lang: 'tr' | 'en') => void
  streak: number
}

export default function NavBar({ lang, onLangChange, streak }: NavBarProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'var(--nav-padding)',
      borderBottom: '0.5px solid var(--border)',
      background: 'var(--bg)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: '#E24B4A', flexShrink: 0
        }} />
        <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.3px' }}>
          renkle
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {streak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#639922' }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              {streak} {lang === 'tr' ? 'günlük seri' : 'day streak'}
            </span>
          </div>
        )}

        <div style={{
          display: 'flex',
          border: '0.5px solid var(--border)',
          borderRadius: 20,
          overflow: 'hidden',
        }}>
          {(['tr', 'en'] as const).map((l) => (
            <button
              key={l}
              onClick={() => onLangChange(l)}
              style={{
                padding: '5px 12px',
                fontSize: 12,
                border: 'none',
                background: lang === l ? 'var(--bg-secondary)' : 'transparent',
                color: lang === l ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: lang === l ? 500 : 400,
                transition: 'all 0.15s',
              }}
            >
              {l}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
          aria-label={lang === 'tr' ? 'açık mod / koyu mod' : 'light or dark mode'}
          title={lang === 'tr' ? 'açık mod / koyu mod' : 'light or dark mode'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 10px',
            border: '0.5px solid var(--border)',
            borderRadius: 20,
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <ThemeModeGlyph theme={theme} />
        </button>
      </div>
    </nav>
  )
}
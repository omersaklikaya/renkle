'use client'

import StreakFlameIcon from '@/components/StreakFlameIcon'
import ThemeToggleButton from '@/components/ThemeToggleButton'

interface NavBarProps {
  lang: 'tr' | 'en'
  onLangChange: (lang: 'tr' | 'en') => void
  streak: number
}

export default function NavBar({ lang, onLangChange, streak }: NavBarProps) {
  const hasStreak = streak > 0
  return (
    <nav className="site-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div className="renkle-mark" aria-hidden />
        <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.3px' }}>renkle</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              color: hasStreak ? '#ea580c' : 'var(--text-tertiary)',
            }}
          >
            <StreakFlameIcon muted={!hasStreak} />
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {hasStreak
              ? `${streak} ${lang === 'tr' ? 'günlük seri' : 'day streak'}`
              : lang === 'tr'
                ? 'henüz seriniz yok'
                : 'no streak yet'}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            border: '0.5px solid var(--border)',
            borderRadius: 20,
            overflow: 'hidden',
          }}
        >
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

        <ThemeToggleButton lang={lang} />
      </div>
    </nav>
  )
}

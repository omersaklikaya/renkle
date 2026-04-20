'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'

interface GameLayoutProps {
  lang: 'tr' | 'en'
  onLangChange: (l: 'tr' | 'en') => void
  onBack?: () => void
  backLabel?: string
  gameTitle?: string
  showHelp?: boolean
  onHelpClick?: () => void
  /** Sağ uç (ör. tema düğmesi) */
  navEnd?: ReactNode
  children: React.ReactNode
}

export default function GameLayout({
  lang,
  onLangChange,
  onBack,
  backLabel,
  gameTitle,
  showHelp,
  onHelpClick,
  navEnd,
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
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--nav-padding)',
        borderBottom: '0.5px solid var(--border)',
      }}
      >
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          textDecoration: 'none',
        }}
        >
          <div style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: 'conic-gradient(hsl(0,100%,60%), hsl(60,100%,60%), hsl(120,100%,60%), hsl(180,100%,60%), hsl(240,100%,60%), hsl(300,100%,60%), hsl(360,100%,60%))',
            boxShadow: '0 0 6px 1px rgba(255,255,255,0.15)',
          }}
          />
          <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.3px' }}>
            renkle
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                fontSize: 12,
                color: 'var(--text-secondary)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                minHeight: 44,
                padding: '0 8px',
              }}
            >
              ← {backLabel || (lang === 'tr' ? 'geri' : 'back')}
            </button>
          )}
          {gameTitle && (
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
              {gameTitle}
            </span>
          )}
          {showHelp && (
            <button
              type="button"
              onClick={onHelpClick}
              style={{
                width: 44,
                height: 44,
                minHeight: 44,
                minWidth: 44,
                borderRadius: '50%',
                border: '0.5px solid var(--border)',
                background: 'transparent',
                fontSize: 13,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ?
            </button>
          )}
          <div style={{
            display: 'flex',
            border: '0.5px solid var(--border)',
            borderRadius: 20,
            overflow: 'hidden',
          }}
          >
            {(['tr', 'en'] as const).map(l => (
              <button
                key={l}
                type="button"
                onClick={() => onLangChange(l)}
                style={{
                  padding: '8px 14px',
                  fontSize: 12,
                  border: 'none',
                  minHeight: 44,
                  minWidth: 44,
                  background: lang === l ? 'var(--bg-secondary)' : 'transparent',
                  color: lang === l ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: lang === l ? 500 : 400,
                }}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          {navEnd}
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {children}
      </div>
    </div>
  )
}

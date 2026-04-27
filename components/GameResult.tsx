'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import type { Lang } from '@/lib/games'
import {
  gamePrimaryButtonStyle,
  gameSecondaryButtonStyle,
} from '@/lib/gamePageStyles'

const OTHER_SLUGS = [
  'rengi-hatirla',
  'hangisi-daha-koyu',
  'renk-karistir',
  'paleti-tamamla',
  'marka-rengi-bil',
] as const

type OtherSlug = (typeof OTHER_SLUGS)[number]

interface OtherGameDef {
  slug: OtherSlug
  mod: string
  label: Record<Lang, string>
  swatch: ReactNode
}

const OTHER_BY_SLUG: Record<OtherSlug, OtherGameDef> = {
  'rengi-hatirla': {
    slug: 'rengi-hatirla',
    mod: 'gunluk',
    label: { tr: 'ezberle', en: 'memorize' },
    swatch: (
      <div style={{
        height: '100%',
        background: 'linear-gradient(135deg, #9b94eb 0%, #5e57b8 100%)',
      }}
      />
    ),
  },
  'hangisi-daha-koyu': {
    slug: 'hangisi-daha-koyu',
    mod: 'sinirsiz',
    label: { tr: 'karşılaştır', en: 'compare' },
    swatch: (
      <div style={{ display: 'flex', height: '100%' }}>
        <div style={{ flex: 1, background: '#E24B4A' }} />
        <div style={{ flex: 1, background: '#1D9E75' }} />
      </div>
    ),
  },
  'renk-karistir': {
    slug: 'renk-karistir',
    mod: 'sinirsiz',
    label: { tr: 'karıştır', en: 'mix' },
    swatch: (
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 6, height: '100%',
        background: '#0d0d0d',
      }}
      >
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#E24B4A' }} />
        <span style={{ fontSize: 10, color: '#5a5856' }}>+</span>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#378ADD' }} />
      </div>
    ),
  },
  'paleti-tamamla': {
    slug: 'paleti-tamamla',
    mod: 'sinirsiz',
    label: { tr: 'tamamla', en: 'complete' },
    swatch: (
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: 3, padding: '0 8px', height: '100%',
        background: '#0d0d0d',
      }}
      >
        <div style={{ flex: 1, height: 28, borderRadius: 4, background: '#EF9F27' }} />
        <div style={{
          flex: 1, height: 28, borderRadius: 4,
          border: '1.5px dashed rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        >
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>?</span>
        </div>
        <div style={{ flex: 1, height: 28, borderRadius: 4, background: '#412402' }} />
      </div>
    ),
  },
  'marka-rengi-bil': {
    slug: 'marka-rengi-bil',
    mod: 'sinirsiz',
    label: { tr: 'tahmin et', en: 'guess brand' },
    swatch: (
      <div style={{ height: 48, display: 'flex', overflow: 'hidden', borderRadius: '8px 8px 0 0' }}>
        <div style={{ flex:1, background: '#E50914' }} />
        <div style={{ flex:1, background: '#1DB954' }} />
        <div style={{ flex:1, background: '#1877F2' }} />
      </div>
    ),
  },
}

function otherGamesFor(currentSlug: string): OtherGameDef[] {
  return OTHER_SLUGS
    .filter(s => s !== currentSlug)
    .map(s => OTHER_BY_SLUG[s])
}

export function GameResultOtherGamesGrid({
  currentSlug,
  lang,
}: {
  currentSlug: string
  lang: Lang
}) {
  const otherGames = otherGamesFor(currentSlug)
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        fontSize: 10, color: 'var(--text-tertiary)',
        letterSpacing: '0.08em', textTransform: 'uppercase',
        marginBottom: 12,
      }}
      >
        {lang === 'tr' ? 'diğer oyunlar' : 'other games'}
      </div>
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
        overflowX: 'hidden',
      }}
      >
        {otherGames.map(game => (
          <Link
            key={game.slug}
            href={`/${game.slug}?mod=${game.mod}`}
            style={{ textDecoration: 'none', color: 'inherit', flex: '1 1 200px', minWidth: 0 }}
          >
            <div style={{
              border: '0.5px solid var(--border)',
              borderRadius: 10,
              overflow: 'hidden',
              background: 'var(--bg-secondary)',
              cursor: 'pointer',
              transition: 'transform 0.15s, border-color 0.15s',
            }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-mid)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
              }}
            >
              <div style={{ height: 56, overflow: 'hidden' }}>
                {game.swatch}
              </div>
              <div style={{ padding: '8px 10px 10px' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {game.label[lang]}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export interface GameResultAction {
  label: string
  onClick: () => void
  disabled?: boolean
}

interface GameResultProps {
  lang: Lang
  score: number
  scoreLabel: string
  scoreColor: string
  subtitle: string
  topContent?: ReactNode
  primaryAction: GameResultAction
  secondaryAction?: GameResultAction
  currentSlug: string
}

export default function GameResult({
  lang,
  score,
  scoreLabel,
  scoreColor,
  subtitle,
  topContent,
  primaryAction,
  secondaryAction,
  currentSlug,
}: GameResultProps) {
  const primaryDisabled = primaryAction.disabled === true
  return (
    <>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>
          {subtitle}
        </div>
        <div style={{
          fontSize: 64,
          fontWeight: 500,
          letterSpacing: '-2px',
          lineHeight: 1,
          marginBottom: 4,
          color: scoreColor,
        }}
        >
          {score}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{scoreLabel}</div>
      </div>

      {topContent != null && (
        <div style={{ marginTop: 16, width: '100%' }}>{topContent}</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', marginTop: 8 }}>
        <button
          type="button"
          className="btn-press"
          disabled={primaryDisabled}
          onClick={primaryAction.onClick}
          style={{
            ...gamePrimaryButtonStyle,
            ...(primaryDisabled ? { opacity: 0.45, cursor: 'not-allowed' } : {}),
          }}
        >
          {primaryAction.label}
        </button>
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            style={gameSecondaryButtonStyle}
          >
            {secondaryAction.label}
          </button>
        )}
        <Link href="/" style={{ textDecoration: 'none', width: '100%', display: 'block' }}>
          <button
            type="button"
            style={{
              width: '100%', padding: '13px 0',
              fontSize: 14, fontWeight: 500,
              border: '0.5px solid var(--border)',
              borderRadius: 24,
              background: 'transparent',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              letterSpacing: '-0.2px',
            }}
          >
            {lang === 'tr' ? 'ana sayfaya dön' : 'back to home'}
          </button>
        </Link>
      </div>

      <div style={{
        width: '100%',
        borderTop: '0.5px solid var(--border)',
        paddingTop: 20,
        marginTop: 8,
      }}
      >
        <GameResultOtherGamesGrid currentSlug={currentSlug} lang={lang} />
      </div>
    </>
  )
}

'use client'

import ThemeModeGlyph from '@/components/ThemeModeGlyph'
import { useSiteTheme } from '@/components/SiteThemeProvider'

type Lang = 'tr' | 'en'

export default function ThemeToggleButton({
  lang,
  ariaLabel,
  title,
}: {
  lang: Lang
  ariaLabel?: string
  title?: string
}) {
  const { theme, toggleTheme } = useSiteTheme()

  const label =
    ariaLabel ?? (lang === 'tr' ? 'açık mod / koyu mod / sistem' : 'light, dark, or match system')
  const tip = title ?? label

  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      aria-label={label}
      title={tip}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '5px 12px',
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
  )
}

'use client'

import ThemeModeGlyph from '@/components/ThemeModeGlyph'
import { useSiteTheme } from '@/components/SiteThemeProvider'
import { useRef, useState } from 'react'

type Lang = 'tr' | 'en'

export default function ThemeToggleButton({
  lang,
  ariaLabel,
  title,
  size = 34,
}: {
  lang: Lang
  ariaLabel?: string
  title?: string
  size?: number
}) {
  const { theme, toggleTheme } = useSiteTheme()
  const btnRef = useRef<HTMLButtonElement>(null)
  const [anim, setAnim] = useState(false)

  const label =
    ariaLabel ?? (lang === 'tr' ? 'açık mod / koyu mod / sistem' : 'light, dark, or match system')
  const tip = title ?? label

  const runToggle = () => {
    const btn = btnRef.current
    setAnim(true)
    window.setTimeout(() => setAnim(false), 260)

    const startVT = (document as Document & { startViewTransition?: (cb: () => void) => void }).startViewTransition
    try {
      if (startVT && btn) {
        const rect = btn.getBoundingClientRect()
        const x = rect.left + rect.width / 2
        const y = rect.top + rect.height / 2
        const dx = Math.max(x, window.innerWidth - x)
        const dy = Math.max(y, window.innerHeight - y)
        const r = Math.ceil(Math.hypot(dx, dy))
        const rootStyle = document.documentElement.style
        rootStyle.setProperty('--theme-vt-x', `${x}px`)
        rootStyle.setProperty('--theme-vt-y', `${y}px`)
        rootStyle.setProperty('--theme-vt-r', `${r}px`)
        startVT(() => {
          toggleTheme()
        })
        return
      }
    } catch {
      // fall back below
    }

    // Fallback: expanding circle overlay (works without View Transitions API)
    if (btn) {
      const rect = btn.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      const dx = Math.max(x, window.innerWidth - x)
      const dy = Math.max(y, window.innerHeight - y)
      const r = Math.ceil(Math.hypot(dx, dy))

      const oldBg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#111110'

      const overlay = document.createElement('div')
      overlay.setAttribute('data-theme-circle', 'true')
      Object.assign(overlay.style, {
        position: 'fixed',
        inset: '0',
        background: oldBg,
        pointerEvents: 'none',
        zIndex: '2147483647',
        clipPath: `circle(${r}px at ${x}px ${y}px)`,
      } as Partial<CSSStyleDeclaration>)
      document.body.appendChild(overlay)

      toggleTheme()

      overlay.animate(
        [
          { clipPath: `circle(${r}px at ${x}px ${y}px)` },
          { clipPath: `circle(0px at ${x}px ${y}px)` },
        ],
        { duration: 520, easing: 'cubic-bezier(0.16,1,0.3,1)', fill: 'forwards' },
      ).finished
        .catch(() => {})
        .finally(() => overlay.remove())

      return
    }

    toggleTheme()
  }

  return (
    <button
      type="button"
      ref={btnRef}
      onClick={runToggle}
      aria-label={label}
      title={tip}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: size,
        width: size,
        padding: 0,
        border: '0.5px solid var(--border)',
        borderRadius: '50%',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      <ThemeModeGlyph
        theme={theme}
        style={{
          transition: 'transform 260ms cubic-bezier(0.16,1,0.3,1)',
          transform: anim ? 'scale(0.9) rotate(-25deg)' : 'scale(1) rotate(0deg)',
        }}
      />
    </button>
  )
}

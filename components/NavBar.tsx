'use client'

import Link from 'next/link'
import { useSiteTheme } from '@/components/SiteThemeProvider'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { games } from '@/lib/games'

interface NavBarProps {
  lang: 'tr' | 'en'
  onLangChange: (lang: 'tr' | 'en') => void
  streak: number
}

export default function NavBar({ lang, onLangChange, streak }: NavBarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useSiteTheme()
  const [isMobile, setIsMobile] = useState(false)
  const [showCalendarSoon, setShowCalendarSoon] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const CONTROL_H = 34

  const runThemeTo = (next: 'light' | 'dark', anchor?: HTMLElement | null) => {
    const startVT = (document as Document & { startViewTransition?: (cb: () => void) => void }).startViewTransition
    try {
      if (startVT && anchor) {
        const rect = anchor.getBoundingClientRect()
        const x = rect.left + rect.width / 2
        const y = rect.top + rect.height / 2
        const dx = Math.max(x, window.innerWidth - x)
        const dy = Math.max(y, window.innerHeight - y)
        const r = Math.ceil(Math.hypot(dx, dy))
        const rootStyle = document.documentElement.style
        rootStyle.setProperty('--theme-vt-x', `${x}px`)
        rootStyle.setProperty('--theme-vt-y', `${y}px`)
        rootStyle.setProperty('--theme-vt-r', `${r}px`)
        startVT(() => setTheme(next))
        return
      }
    } catch {
      // fall back below
    }

    if (anchor) {
      const rect = anchor.getBoundingClientRect()
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

      setTheme(next)

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

    setTheme(next)
  }

  const isGameRoute = !!pathname && games.some(g => pathname === `/${g.slug}` || pathname.startsWith(`/${g.slug}/`))
  const showHowTo = isGameRoute

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!showCalendarSoon) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowCalendarSoon(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showCalendarSoon])

  useEffect(() => {
    if (!showMobileMenu) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMobileMenu(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [showMobileMenu])

  useEffect(() => {
    if (!showMobileMenu) return
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.navbar-menu')) {
        setShowMobileMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMobileMenu])

  return (
    <>
      {showCalendarSoon && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="yakında"
          onClick={() => setShowCalendarSoon(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 320,
              borderRadius: 16,
              border: '0.5px solid var(--border)',
              background: 'var(--bg)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
              padding: '16px 16px 14px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
              yakında
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6, lineHeight: 1.35 }}>
              {lang === 'tr' ? 'takvim görünümü yakında eklenecek.' : 'calendar view is coming soon.'}
            </div>
            <button
              type="button"
              className="btn-press"
              onClick={() => setShowCalendarSoon(false)}
              style={{
                marginTop: 12,
                width: '100%',
                padding: '10px 0',
                borderRadius: 12,
                border: '0.5px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {lang === 'tr' ? 'tamam' : 'ok'}
            </button>
          </div>
        </div>
      )}

      <nav
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box',
          height: 'var(--nav-height)',
          minHeight: 'var(--nav-height)',
          padding: 'var(--nav-padding)',
          borderBottom: '0.5px solid var(--border)',
          background: 'var(--bg)',
          flexShrink: 0,
          animation: 'fadeUp 0.4s ease 0s both',
        }}
      >
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit' }}>
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: 'conic-gradient(hsl(0,100%,60%), hsl(60,100%,60%), hsl(120,100%,60%), hsl(180,100%,60%), hsl(240,100%,60%), hsl(300,100%,60%), hsl(360,100%,60%))',
            boxShadow: '0 0 6px 1px rgba(255,255,255,0.15)',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.3px' }}>
          renkle
        </span>
      </Link>

      <div style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 12,
        color: 'var(--text-secondary)',
        letterSpacing: '-0.2px',
        display: 'flex',
        alignItems: 'baseline',
        gap: 6,
        whiteSpace: 'nowrap',
      }}
      >
        {streak > 0 ? (
          <>
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.4px' }}>{streak}</span>
            <span>{lang === 'tr' ? 'günlük seri' : 'day streak'}</span>
          </>
        ) : (
          <span style={{ opacity: 0.7 }}>{lang === 'tr' ? 'seri yok' : 'no streak'}</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {pathname === '/' ? (
          <button
            type="button"
            className="btn-press"
            aria-label={lang === 'tr' ? 'takvim' : 'calendar'}
            onClick={() => setShowCalendarSoon(true)}
            style={{
              height: CONTROL_H,
              width: CONTROL_H,
              padding: 0,
              border: '0.5px solid var(--border)',
              borderRadius: '50%',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M7 2.8v2.6M17 2.8v2.6M5.2 7.6h13.6M6.8 4.8h10.4A2.8 2.8 0 0 1 20 7.6v12A2.8 2.8 0 0 1 17.2 22.4H6.8A2.8 2.8 0 0 1 4 19.6v-12A2.8 2.8 0 0 1 6.8 4.8Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.2 11.6h0.01M12 11.6h0.01M15.8 11.6h0.01M8.2 15.4h0.01M12 15.4h0.01M15.8 15.4h0.01"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : showHowTo ? (
          <button
            type="button"
            className="btn-press"
            aria-label={lang === 'tr' ? 'nasıl oynanır' : 'how to play'}
            onClick={() => {
              try { window.dispatchEvent(new Event('renkle:howto-open')) } catch { /* ignore */ }
            }}
            style={{
              height: CONTROL_H,
              width: CONTROL_H,
              padding: 0,
              border: '0.5px solid var(--border)',
              borderRadius: '50%',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: 16,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ?
          </button>
        ) : null}

        <div className="navbar-menu" style={{ position: 'relative', height: CONTROL_H, width: CONTROL_H, flexShrink: 0 }}>
          <button
            type="button"
            className="btn-press"
            aria-label={lang === 'tr' ? 'menü' : 'menu'}
            onClick={() => setShowMobileMenu(v => !v)}
            style={{
              height: CONTROL_H,
              width: CONTROL_H,
              padding: 0,
              border: '0.5px solid var(--border)',
              borderRadius: '50%',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {showMobileMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                animation: 'fadeDown 0.15s ease',
                zIndex: 5000,
              }}
            >
              <div style={{
                background: 'var(--bg-secondary)',
                border: '0.5px solid var(--border-mid)',
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                width: 34,
              }}
              >
                {lang !== 'tr' ? (
                  <div
                    onClick={() => { onLangChange('tr'); setShowMobileMenu(false) }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onLangChange('tr')
                        setShowMobileMenu(false)
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      borderBottom: '0.5px solid var(--border)',
                      background: 'transparent',
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)' }}>TR</span>
                  </div>
                ) : (
                  <div
                    onClick={() => { onLangChange('en'); setShowMobileMenu(false) }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onLangChange('en')
                        setShowMobileMenu(false)
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      borderBottom: '0.5px solid var(--border)',
                      background: 'transparent',
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)' }}>EN</span>
                  </div>
                )}

                {theme === 'light' ? (
                  <div
                    onClick={(e) => {
                      runThemeTo('dark', e.currentTarget as HTMLElement)
                      setShowMobileMenu(false)
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        runThemeTo('dark', e.currentTarget as unknown as HTMLElement)
                        setShowMobileMenu(false)
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: 'transparent',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" aria-hidden="true">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  </div>
                ) : (
                  <div
                    onClick={(e) => {
                      runThemeTo('light', e.currentTarget as HTMLElement)
                      setShowMobileMenu(false)
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        runThemeTo('light', e.currentTarget as unknown as HTMLElement)
                        setShowMobileMenu(false)
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      background: 'transparent',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </nav>
    </>
  )
}

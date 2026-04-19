'use client'

import { useCallback, useEffect, useRef, useState, type TransitionEvent } from 'react'
import Link from 'next/link'
import ThemeToggleButton from '@/components/ThemeToggleButton'

type Lang = 'tr' | 'en'

interface Color {
  r: number
  g: number
  b: number
}

function pseudo(n: number): number {
  const x = Math.sin(n) * 10000
  return x - Math.floor(x)
}

function hsvToRgb(h: number, s: number, v: number): Color {
  const f = (n: number) => {
    const k = (n + h / 60) % 6
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1))
  }
  return { r: Math.round(f(5) * 255), g: Math.round(f(3) * 255), b: Math.round(f(1) * 255) }
}

function relativeLuminance(c: Color): number {
  const lin = (u: number) => {
    const x = u / 255
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
  }
  const R = lin(c.r)
  const G = lin(c.g)
  const B = lin(c.b)
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

function colorToCss(c: Color): string {
  return `rgb(${c.r},${c.g},${c.b})`
}

/** WCAG parlaklık farkı: çok küçük = zor, çok küçük olursa yuvarlama yüzünden berabere kalmasın. */
const LUM_DIFF_MIN = 0.0028
const LUM_DIFF_MAX = 0.016

/** İki renk: aynı ton/doygunluk, çok yakın parlaklık (V); solda hangi tarafın daha koyu olduğu `darkerSide`. */
function pairFromSeed(seed: number): { left: Color; right: Color; darkerSide: 'left' | 'right' } {
  const h = pseudo(seed) * 360
  const s = 0.45 + pseudo(seed + 1) * 0.55
  const vDark = 0.22 + pseudo(seed + 2) * 0.52
  const deltaV = 0.006 + pseudo(seed + 3) * 0.026
  const vLight = Math.min(0.992, vDark + deltaV)
  const dark = hsvToRgb(h, s, vDark)
  const light = hsvToRgb(h, s, vLight)
  const swap = pseudo(seed + 4) < 0.5
  if (swap) {
    return { left: light, right: dark, darkerSide: 'right' }
  }
  return { left: dark, right: light, darkerSide: 'left' }
}

function luminanceDiff(p: { left: Color; right: Color }): number {
  return Math.abs(relativeLuminance(p.left) - relativeLuminance(p.right))
}

function randomPair(): { left: Color; right: Color; darkerSide: 'left' | 'right' } {
  let fallback: { left: Color; right: Color; darkerSide: 'left' | 'right' } | null = null
  let fallbackDiff = Infinity
  for (let i = 0; i < 160; i++) {
    const seed = Math.floor(Math.random() * 1e9) + i * 11003
    const p = pairFromSeed(seed)
    const d = luminanceDiff(p)
    if (d >= LUM_DIFF_MIN && d <= LUM_DIFF_MAX) return p
    if (d >= LUM_DIFF_MIN && d < fallbackDiff) {
      fallbackDiff = d
      fallback = p
    }
  }
  if (fallback) return fallback
  return pairFromSeed(Math.floor(Math.random() * 1e9))
}

const LS_ENDLESS = 'renkle-hangisi-daha-koyu-endless'

export default function HangisiDahaKoyu() {
  const [lang, setLang] = useState<Lang>('tr')
  const [left, setLeft] = useState<Color | null>(null)
  const [right, setRight] = useState<Color | null>(null)
  const [darkerSide, setDarkerSide] = useState<'left' | 'right' | null>(null)
  const [picked, setPicked] = useState<'left' | 'right' | null>(null)
  const [endlessStreak, setEndlessStreak] = useState(0)
  const [endlessBest, setEndlessBest] = useState(0)
  const [endlessFailModal, setEndlessFailModal] = useState<{ score: number } | null>(null)
  const endlessStreakRef = useRef(0)
  const [mounted, setMounted] = useState(false)
  const [storageReady, setStorageReady] = useState(false)

  const [incomingPair, setIncomingPair] = useState<{
    left: Color
    right: Color
    darkerSide: 'left' | 'right'
  } | null>(null)
  const [slideX, setSlideX] = useState(0)
  const [trackMotion, setTrackMotion] = useState<'off' | 'on'>('off')
  const pendingIncomingRef = useRef<{ left: Color; right: Color; darkerSide: 'left' | 'right' } | null>(null)
  const slideAnimActiveRef = useRef(false)
  const autoAdvanceTimerRef = useRef<number | null>(null)
  const failModalTimerRef = useRef<number | null>(null)
  const goNextRoundRef = useRef<() => void>(() => {})

  const clearAutoAdvanceTimer = useCallback(() => {
    if (autoAdvanceTimerRef.current !== null) {
      window.clearTimeout(autoAdvanceTimerRef.current)
      autoAdvanceTimerRef.current = null
    }
  }, [])

  const clearFailModalTimer = useCallback(() => {
    if (failModalTimerRef.current !== null) {
      window.clearTimeout(failModalTimerRef.current)
      failModalTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    endlessStreakRef.current = endlessStreak
  }, [endlessStreak])

  const startRound = useCallback(() => {
    clearAutoAdvanceTimer()
    clearFailModalTimer()
    const p = randomPair()
    setLeft(p.left)
    setRight(p.right)
    setDarkerSide(p.darkerSide)
    setPicked(null)
    setIncomingPair(null)
    setSlideX(0)
    setTrackMotion('off')
    pendingIncomingRef.current = null
    slideAnimActiveRef.current = false
  }, [clearAutoAdvanceTimer, clearFailModalTimer])

  const goNextRound = useCallback(() => {
    if (!left || !right || !darkerSide || slideAnimActiveRef.current) return
    clearAutoAdvanceTimer()
    clearFailModalTimer()
    const n = randomPair()
    pendingIncomingRef.current = n
    slideAnimActiveRef.current = true
    setIncomingPair(n)
    setTrackMotion('on')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setSlideX(-50))
    })
  }, [left, right, darkerSide, clearAutoAdvanceTimer, clearFailModalTimer])

  useEffect(() => {
    goNextRoundRef.current = goNextRound
  }, [goNextRound])

  const handleTrackTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (e.propertyName !== 'transform' || !slideAnimActiveRef.current) return
    const p = pendingIncomingRef.current
    if (!p) return
    slideAnimActiveRef.current = false
    pendingIncomingRef.current = null
    setLeft(p.left)
    setRight(p.right)
    setDarkerSide(p.darkerSide)
    setIncomingPair(null)
    setTrackMotion('off')
    setSlideX(0)
    setPicked(null)
  }

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(LS_ENDLESS)
        if (raw) {
          const o = JSON.parse(raw) as { streak?: number; best?: number }
          if (typeof o.streak === 'number') setEndlessStreak(o.streak)
          if (typeof o.best === 'number') setEndlessBest(o.best)
        }
      } catch {
        /* ignore */
      }
      startRound()
      setStorageReady(true)
      setMounted(true)
    })
  }, [startRound])

  useEffect(() => {
    if (!storageReady) return
    queueMicrotask(() => {
      try {
        localStorage.setItem(LS_ENDLESS, JSON.stringify({ streak: endlessStreak, best: endlessBest }))
      } catch {
        /* ignore */
      }
    })
  }, [storageReady, endlessStreak, endlessBest])

  useEffect(() => {
    return () => {
      clearAutoAdvanceTimer()
      clearFailModalTimer()
    }
  }, [clearAutoAdvanceTimer, clearFailModalTimer])

  const showResult = picked !== null && darkerSide !== null
  const isCorrect = showResult && picked === darkerSide

  useEffect(() => {
    clearAutoAdvanceTimer()
    if (!showResult || !isCorrect) return undefined
    if (slideAnimActiveRef.current) return undefined
    if (!left || !right) return undefined
    autoAdvanceTimerRef.current = window.setTimeout(() => {
      autoAdvanceTimerRef.current = null
      goNextRoundRef.current()
    }, 400)
    return () => clearAutoAdvanceTimer()
  }, [showResult, isCorrect, left, right, clearAutoAdvanceTimer])

  const closeEndlessFailModal = () => {
    clearAutoAdvanceTimer()
    clearFailModalTimer()
    setEndlessFailModal(null)
    startRound()
  }

  const shareEndlessRun = (score: number) => {
    const text =
      lang === 'tr'
        ? `renkle — hangisi daha koyu\nseri: ${score}\nrekor: ${endlessBest}`
        : `renkle — which is darker\nstreak: ${score}\nbest: ${endlessBest}`
    void navigator.clipboard?.writeText(text)
  }

  const t = {
    tr: {
      title: 'hangisi daha koyu?',
      subtitle: 'iki rengi karşılaştır, daha koyu olanı seç',
      home: 'ana sayfa',
      best: 'rekor',
      themeAria: 'tema: açık, koyu veya sistem',
      gameOver: 'seri bitti',
      gotRight: (n: number) =>
        n === 0 ? 'hiç bilemedin' : `${n} kez doğru bildin`,
      restart: 'tekrar başla',
      share: 'paylaş',
      toHome: 'ana menüye dön',
    },
    en: {
      title: 'which is darker?',
      subtitle: 'compare the two swatches and pick the darker one',
      home: 'home',
      best: 'best',
      themeAria: 'theme: light, dark, or match system',
      gameOver: 'streak over',
      gotRight: (n: number) =>
        n === 0 ? 'no correct picks' : n === 1 ? 'you got 1 right' : `you got ${n} right`,
      restart: 'play again',
      share: 'share',
      toHome: 'back to main menu',
    },
  }[lang]

  const handlePick = (side: 'left' | 'right') => {
    if (!darkerSide || picked !== null || !left || !right) return
    setPicked(side)
    const ok = side === darkerSide
    if (ok) {
      setEndlessStreak((s) => {
        const n = s + 1
        queueMicrotask(() => {
          setEndlessBest((b) => Math.max(b, n))
        })
        return n
      })
    } else {
      const runScore = endlessStreakRef.current
      setEndlessStreak(0)
      clearFailModalTimer()
      const delayMs = 400
      failModalTimerRef.current = window.setTimeout(() => {
        failModalTimerRef.current = null
        setEndlessFailModal({ score: runScore })
      }, delayMs)
    }
  }

  const slideDurationMs = 340

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.25s ease',
      }}
    >
      <nav className="site-nav">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="renkle-mark" aria-hidden />
          <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.3px' }}>renkle</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link
            href="/"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text-primary)',
              textDecoration: 'none',
            }}
          >
            {t.home}
          </Link>
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
                type="button"
                onClick={() => setLang(l)}
                style={{
                  padding: '5px 12px',
                  fontSize: 12,
                  border: 'none',
                  background: lang === l ? 'var(--bg-secondary)' : 'transparent',
                  color: lang === l ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: lang === l ? 500 : 400,
                }}
              >
                {l}
              </button>
            ))}
          </div>
          <ThemeToggleButton lang={lang} ariaLabel={t.themeAria} title={t.themeAria} />
        </div>
      </nav>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: 0,
          padding: '28px var(--page-padding) 48px',
          paddingBottom: 48,
          gap: 20,
          maxWidth: 'min(100%, 1024px)',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {left && right && (
          <>
            <div style={{ textAlign: 'center', width: '100%', flexShrink: 0 }}>
              <h1 style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.35px', marginBottom: 6 }}>
                {t.title}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: 0 }}>
                {t.subtitle}
              </p>
            </div>

            <div
              style={{
                position: 'relative',
                flex: 1,
                width: '100%',
                minHeight: 0,
                alignSelf: 'stretch',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                onTransitionEnd={handleTrackTransitionEnd}
                style={{
                  flex: 1,
                  minHeight: 0,
                  width: '200%',
                  display: 'flex',
                  flexDirection: 'row',
                  transform: `translateX(${slideX}%)`,
                  transition:
                    trackMotion === 'on'
                      ? `transform ${slideDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`
                      : 'none',
                  willChange: trackMotion === 'on' ? 'transform' : 'auto',
                }}
              >
                {(
                  [
                    { key: 'a', pl: left, pr: right, d: darkerSide },
                    {
                      key: 'b',
                      pl: incomingPair?.left ?? left,
                      pr: incomingPair?.right ?? right,
                      d: incomingPair?.darkerSide ?? darkerSide,
                    },
                  ] as const
                ).map((pane) => {
                  const isActivePane = pane.key === 'a'
                  return (
                    <div
                      key={pane.key}
                      className="hangisi-pane-colors"
                      style={{
                        flex: '0 0 50%',
                        alignSelf: 'stretch',
                        minHeight: 0,
                        minWidth: 0,
                        alignItems: 'stretch',
                      }}
                    >
                      {(['left', 'right'] as const).map((side) => {
                        const c = side === 'left' ? pane.pl : pane.pr
                        const wrongGlowCelebrate =
                          isActivePane && showResult && picked === side && !isCorrect
                        const correctGlowCelebrate =
                          isActivePane && showResult && picked === side && isCorrect
                        const aria =
                          side === 'left'
                            ? lang === 'tr'
                              ? 'Sol renk daha koyu'
                              : 'Left color is darker'
                            : lang === 'tr'
                              ? 'Sağ renk daha koyu'
                              : 'Right color is darker'
                        return (
                          <button
                            key={`${pane.key}-${side}`}
                            type="button"
                            className={[
                              'hangisi-swatch',
                              correctGlowCelebrate
                                ? 'hangisi-correct-glow hangisi-correct-glow--fast'
                                : wrongGlowCelebrate
                                  ? 'hangisi-wrong-glow hangisi-wrong-glow--fast'
                                  : '',
                            ]
                              .filter(Boolean)
                              .join(' ')}
                            disabled={picked !== null || !isActivePane}
                            onClick={() => isActivePane && handlePick(side)}
                            aria-label={aria}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              minHeight: 'clamp(240px, min(52dvh, 70vw), 780px)',
                              borderRadius: 'var(--radius-lg)',
                              border: correctGlowCelebrate
                                ? '3px solid rgba(150, 218, 138, 0.35)'
                                : wrongGlowCelebrate
                                  ? '3px solid rgba(240, 120, 120, 0.38)'
                                  : '0.5px solid var(--border)',
                              background: colorToCss(c),
                              cursor:
                                picked !== null || !isActivePane ? 'default' : 'pointer',
                              fontFamily: 'inherit',
                            }}
                          />
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {endlessFailModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="endless-fail-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: 'transparent',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 360,
              borderRadius: 'var(--radius-lg)',
              border: '0.5px solid var(--border-mid)',
              background: 'var(--bg-secondary)',
              padding: '28px 22px 22px',
              boxShadow: '0 18px 50px rgba(0,0,0,0.18)',
            }}
          >
            <h2
              id="endless-fail-title"
              style={{
                fontSize: 17,
                fontWeight: 600,
                marginBottom: 10,
                color: 'var(--text-primary)',
                textAlign: 'center',
              }}
            >
              {t.gameOver}
            </h2>
            <p
              style={{
                fontSize: 14,
                color: 'var(--text-secondary)',
                textAlign: 'center',
                lineHeight: 1.5,
                marginBottom: 8,
              }}
            >
              {t.gotRight(endlessFailModal.score)}
            </p>
            <p
              style={{
                fontSize: 12,
                color: 'var(--text-tertiary)',
                textAlign: 'center',
                marginBottom: 22,
              }}
            >
              {t.best}: {endlessBest}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                onClick={closeEndlessFailModal}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: 24,
                  background: 'var(--text-primary)',
                  color: 'var(--bg)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {t.restart}
              </button>
              <button
                type="button"
                onClick={() => shareEndlessRun(endlessFailModal.score)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  border: '0.5px solid var(--border-mid)',
                  borderRadius: 24,
                  background: 'var(--bg)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {t.share}
              </button>
              <Link
                href="/"
                onClick={() => setEndlessFailModal(null)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  border: 'none',
                  borderRadius: 24,
                  background: 'var(--text-primary)',
                  color: 'var(--bg)',
                  textAlign: 'center',
                  textDecoration: 'none',
                  fontFamily: 'inherit',
                }}
              >
                {t.toHome}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

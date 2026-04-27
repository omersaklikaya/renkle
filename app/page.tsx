'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import { readStreak, STREAK_KEY } from '@/lib/streak'
import { LS_RENGI_DAILY } from '@/lib/rengiDailyStreak'
import { games } from '@/lib/games'

function getLocalDayId() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDailyColor() {
  const d = new Date()
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
  const pseudo = (n: number) => { const x = Math.sin(n) * 10000; return x - Math.floor(x) }
  return {
    r: Math.floor(pseudo(seed) * 256),
    g: Math.floor(pseudo(seed + 1) * 256),
    b: Math.floor(pseudo(seed + 2) * 256),
  }
}

function getTimeUntilMidnight() {
  const now = new Date()
  const midnight = new Date()
  midnight.setHours(24, 0, 0, 0)
  const diff = midnight.getTime() - now.getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Home() {
  const [lang, setLang] = useState<'tr' | 'en'>('tr')
  const [streak, setStreak] = useState(0)
  const [countdown, setCountdown] = useState(getTimeUntilMidnight())
  const [dailyPlayed, setDailyPlayed] = useState(false)
  const [dailyScore, setDailyScore] = useState<number | null>(null)
  const [displayDailyScore, setDisplayDailyScore] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const syncDaily = () => {
      try {
        const raw = localStorage.getItem(LS_RENGI_DAILY)
        if (!raw) {
          setDailyPlayed(false)
          setDailyScore(null)
          return
        }
        const d = JSON.parse(raw) as { d?: string; s?: number }
        if (d.d === getLocalDayId() && typeof d.s === 'number') {
          setDailyPlayed(true)
          setDailyScore(d.s)
        } else {
          setDailyPlayed(false)
          setDailyScore(null)
        }
      } catch {
        setDailyPlayed(false)
        setDailyScore(null)
      }
    }

    const sync = () => {
      setStreak(readStreak())
      syncDaily()
    }

    sync()

    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)

    const timer = setInterval(() => setCountdown(getTimeUntilMidnight()), 1000)
    setTimeout(() => setMounted(true), 50)

    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_RENGI_DAILY || e.key === STREAK_KEY || e.key === null) sync()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', sync)

    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', sync)
      clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (!dailyPlayed || !dailyScore) return
    const duration = 1000
    const steps = 40
    const increment = dailyScore / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= dailyScore) {
        setDisplayDailyScore(dailyScore)
        clearInterval(timer)
      } else {
        setDisplayDailyScore(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [dailyPlayed, dailyScore])

  const dailyColor = getDailyColor()
  const colorCss = `rgb(${dailyColor.r},${dailyColor.g},${dailyColor.b})`
  const CARD_TEXT_HEIGHT = 80
  const SWATCH_INSET = `0px 0px ${CARD_TEXT_HEIGHT}px 0px`

  const renderGameSwatch = (game: (typeof games)[number]) => {
    if (game.slug === 'hangisi-daha-koyu') {
      return (
        <div className="game-swatch" style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
          <div style={{ flex: 1, background: '#2D6A4F' }} />
          <div style={{ flex: 1, background: '#95D5B2' }} />
        </div>
      )
    }

    if (game.slug === 'renk-karistir') {
      return (
        <div className="game-swatch" style={{ background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#E24B4A' }} />
            <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.25)', fontWeight: 300 }}>+</span>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#378ADD' }} />
            <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.25)', fontWeight: 300 }}>=</span>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#8B3A8F' }} />
          </div>
        </div>
      )
    }

    if (game.slug === 'paleti-tamamla') {
      return (
        <div className="game-swatch" style={{ flex: 1, display: 'flex', minHeight: 140 }}>
          <div style={{ flex: 1, background: '#EF9F27' }} />
          <div
            style={{
              flex: 1,
              background: 'var(--bg-secondary)',
              borderLeft: '2px dashed var(--border)',
              borderRight: '2px dashed var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-tertiary)' }}>?</span>
          </div>
          <div style={{ flex: 1, background: '#412402' }} />
        </div>
      )
    }

    if (game.slug === 'rengi-hatirla') {
      return (
        <div className="game-swatch" style={{ overflow: 'hidden', background: 'linear-gradient(135deg, #9f99e8, #5c54c4)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
              <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <div
              style={{
                fontSize: 9,
                color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.12em',
                whiteSpace: 'nowrap',
              }}
            >
              GÖR · EZBERLE · YARAT
            </div>
          </div>
        </div>
      )
    }

    const colors = game.swatchColors?.length ? game.swatchColors : ['#161616']
    return (
      <div className="game-swatch" style={{ display: 'flex', background: '#161616', overflow: 'hidden', height: '100%' }}>
        {colors.map((c, i) => (
          <div key={i} style={{ flex: 1, height: '100%', background: c }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      opacity: mounted ? 1 : 0,
      transition: 'opacity 0.3s ease',
    }}
    >
      <NavBar lang={lang} onLangChange={setLang} streak={streak} />

      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
        padding: '28px 48px 0',
        paddingBottom: 48,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
      >
        <div style={{ animation: 'fadeUp 0.4s ease 0.1s both' }}>
          <div style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--text-tertiary)',
            letterSpacing: '0.08em',
            marginBottom: 12,
          }}
          >
            {lang === 'tr' ? 'bugünün görevi' : "today's challenge"}
          </div>

          <Link href="/rengi-hatirla?mod=gunluk" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              border: '0.5px solid rgba(255,255,255,0.12)',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
              minHeight: 160,
            }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.25)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)'}
            >
              {/* Hue blob arka plan */}
              <div style={{
                position: 'absolute', inset: 0,
                overflow: 'hidden',
                borderRadius: 'inherit',
              }}
              >
                <div style={{
                  position: 'absolute',
                  width: 280, height: 280,
                  borderRadius: '50%',
                  background: '#7B4FD4',
                  filter: 'blur(70px)',
                  opacity: 0.55,
                  top: -80, left: -40,
                }}
                />
                <div style={{
                  position: 'absolute',
                  width: 240, height: 240,
                  borderRadius: '50%',
                  background: '#1D9E75',
                  filter: 'blur(65px)',
                  opacity: 0.45,
                  top: -60, left: '35%',
                }}
                />
                <div style={{
                  position: 'absolute',
                  width: 220, height: 220,
                  borderRadius: '50%',
                  background: '#E24B4A',
                  filter: 'blur(65px)',
                  opacity: 0.38,
                  top: -50, right: -30,
                }}
                />
                <div style={{
                  position: 'absolute',
                  width: 200, height: 200,
                  borderRadius: '50%',
                  background: '#EF9F27',
                  filter: 'blur(55px)',
                  opacity: 0.32,
                  bottom: -40, left: '25%',
                }}
                />
              </div>

              {/* Karartma overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.25)',
                borderRadius: 'inherit',
              }}
              />

              <div style={{
                position: 'relative',
                padding: isMobile ? '20px' : '28px 32px',
                height: '100%',
                minHeight: 160,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
              }}
              >
                <div style={{ maxWidth: 480, flex: 1 }}>
                  <div style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.45)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                  >
                    {lang === 'tr' ? 'günlük görev · ' : 'daily challenge · '}
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        color: 'rgba(255,255,255,0.92)',
                        letterSpacing: '0.06em',
                        fontSize: 12,
                      }}
                    >
                      {countdown}
                    </span>
                  </div>

                  {dailyPlayed ? (
                    <>
                      <div style={{
                        fontSize: isMobile ? 32 : 42,
                        fontWeight: 600,
                        color: '#a8e063',
                        letterSpacing: '-1.5px',
                        lineHeight: 1,
                        marginBottom: 8,
                      }}
                      >
                        {displayDailyScore}%
                      </div>
                      <div style={{
                        fontSize: 14,
                        color: 'rgba(255,255,255,0.55)',
                        fontWeight: 400,
                      }}
                      >
                        {lang === 'tr' ? 'bugün oynadın ✓' : 'played today ✓'}
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{
                        fontSize: isMobile ? 22 : 28,
                        fontWeight: 700,
                        color: '#ffffff',
                        letterSpacing: '-0.5px',
                        lineHeight: 1.2,
                        marginBottom: 8,
                      }}
                      >
                        {lang === 'tr' ? 'günün rengini tahmin et' : "guess today's color"}
                      </div>
                      <div style={{
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.45)',
                        marginBottom: 20,
                        lineHeight: 1.5,
                      }}
                      >
                        {lang === 'tr'
                          ? 'Herkes aynı rengi tahmin eder · Günde bir kez'
                          : 'Everyone guesses the same color · Once a day'}
                      </div>
                      <div
                        className="oyna-btn"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '10px 22px',
                          background: 'rgba(255,255,255,0.12)',
                          border: '0.5px solid rgba(255,255,255,0.25)',
                          borderRadius: 24,
                          fontSize: 13,
                          fontWeight: 500,
                          color: '#ffffff',
                          userSelect: 'none',
                        }}
                      >
                        <span>{lang === 'tr' ? 'oyna →' : 'play →'}</span>
                      </div>
                    </>
                  )}
                </div>

              </div>
            </div>
          </Link>
        </div>

        <div>
          <div style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--text-tertiary)',
            letterSpacing: '0.08em',
            marginBottom: 12,
            animation: 'fadeUp 0.4s ease 0.2s both',
          }}
          >
            {lang === 'tr' ? 'keşfet' : 'explore'}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: 8,
            alignItems: 'stretch',
          }}
          >
            {games.map((game, index) => {
              const href = `/${game.slug}?mod=sinirsiz`
              const wrapperStyle: React.CSSProperties = {
                textDecoration: 'none',
                color: 'inherit',
                display: 'block',
                height: '100%',
              }

              const card = (
                <div
                  className="game-card"
                  style={{
                    border: '0.5px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    background: 'var(--bg-secondary)',
                    animation: `fadeUp 0.4s ease ${0.25 + index * 0.05}s both`,
                    height: '100%',
                    minHeight: 220,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: game.locked ? 0.4 : 1,
                  }}
                >
                  <div style={{ flex: 1, minHeight: 140, position: 'relative', zIndex: 1 }}>
                    {renderGameSwatch(game)}
                  </div>

                  {game.locked && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        zIndex: 3,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.5)',
                        border: '0.5px solid rgba(255,255,255,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                  )}

                  <div
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      background: 'var(--bg-secondary)',
                      flexShrink: 0,
                      minHeight: 90,
                      padding: '14px 16px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 1 }}>
                      {game.title[lang]}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {game.slug === 'rengi-hatirla'
                        ? (lang === 'tr' ? 'rengi gör, yeniden yarat' : 'see the color, recreate it')
                        : game.description[lang]}
                    </div>
                  </div>
                </div>
              )

              if (game.locked) {
                return (
                  <div key={game.slug} style={wrapperStyle}>
                    {card}
                  </div>
                )
              }

              return (
                <Link key={game.slug} href={href} style={wrapperStyle}>
                  {card}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

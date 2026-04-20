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
  /** Tüm açık oyunlar (rengi-hatirla dahil); locked olanlar hariç */
  const endlessGames = games.filter(g => !g.locked)

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
              {/* Renk tam arka plan */}
              <div style={{
                position: 'absolute', inset: 0,
                background: colorCss,
                filter: dailyPlayed ? 'none' : 'blur(0px)',
                transform: dailyPlayed ? 'scale(1)' : 'scale(1.08)',
                animation: dailyPlayed ? 'none' : 'blurReveal 1.8s cubic-bezier(0.16,1,0.3,1) forwards',
              }}
              />

              {/* Karartma — alttan üste gradient */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.1) 100%)',
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
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  fontSize: 10, fontWeight: 600,
                  color: 'rgba(255,255,255,0.7)',
                  background: 'rgba(255,255,255,0.12)',
                  border: '0.5px solid rgba(255,255,255,0.2)',
                  padding: '3px 10px',
                  borderRadius: 20,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
                >
                  {lang === 'tr' ? 'günlük' : 'daily'}
                </div>
                <div style={{ maxWidth: 480, flex: 1 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginBottom: 12,
                  }}
                  >
                    <div style={{
                      fontSize: 10, fontWeight: 500,
                      color: 'rgba(255,255,255,0.5)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      background: 'rgba(255,255,255,0.1)',
                      padding: '3px 10px',
                      borderRadius: 20,
                    }}
                    >
                      {lang === 'tr' ? 'günlük görev' : 'daily challenge'}
                    </div>
                    <div style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.35)',
                      fontFamily: 'monospace',
                    }}
                    >
                      {countdown}
                    </div>
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
                        {lang === 'tr' ? 'bugünün rengini tahmin et' : "guess today's color"}
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
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '10px 22px',
                        background: 'rgba(255,255,255,0.15)',
                        border: '0.5px solid rgba(255,255,255,0.3)',
                        borderRadius: 24,
                        fontSize: 13,
                        fontWeight: 500,
                        color: '#ffffff',
                        backdropFilter: 'blur(4px)',
                      }}
                      >
                        {lang === 'tr' ? 'oyna' : 'play'} →
                      </div>
                    </>
                  )}
                </div>

                <div style={{
                  width: isMobile ? 68 : 92,
                  height: isMobile ? 68 : 92,
                  borderRadius: 16,
                  background: colorCss,
                  border: '0.5px solid rgba(255,255,255,0.22)',
                  boxShadow: '0 8px 28px rgba(0,0,0,0.22)',
                  flexShrink: 0,
                }}
                />
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
            {endlessGames.map((game, index) => (
              <Link
                key={game.slug}
                href={`/${game.slug}?mod=sinirsiz`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}
              >
                <div className="game-card" style={{
                  border: '0.5px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  background: 'var(--bg-secondary)',
                  animation: `fadeUp 0.4s ease ${0.25 + index * 0.05}s both`,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                >
                  {game.slug === 'hangisi-daha-koyu' && (
                    <div className="game-swatch" style={{ height: 120, display: 'flex', padding: 10, gap: 3, background: '#161616', borderTopLeftRadius: 12, borderTopRightRadius: 12, flexShrink: 0 }}>
                      {['#E24B4A', '#1D9E75'].map((c, i) => (
                        <div key={i} style={{ flex: 1, height: '100%', background: c, borderRadius: 6 }} />
                      ))}
                    </div>
                  )}
                  {game.slug === 'renk-karistir' && (
                    <div className="game-swatch" style={{ height: 120, background: '#0d0d0d', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, borderTopLeftRadius: 12, borderTopRightRadius: 12, flexShrink: 0 }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#E24B4A' }} />
                      <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.25)', fontWeight: 300 }}>+</span>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#378ADD' }} />
                      <span style={{ fontSize: 22, color: 'rgba(255,255,255,0.25)', fontWeight: 300 }}>=</span>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#8B3A8F' }} />
                    </div>
                  )}
                  {game.slug === 'paleti-tamamla' && (
                    <div className="game-swatch" style={{ height: 120, padding: '0 20px', display: 'flex', alignItems: 'center', gap: 8, background: '#161616', borderTopLeftRadius: 12, borderTopRightRadius: 12, flexShrink: 0 }}>
                      {['#EF9F27', '#BA7517', '', '#633806', '#412402'].map((c, i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: '64px',
                            borderRadius: 8,
                            background: c || 'transparent',
                            border: c ? 'none' : '2px dashed rgba(255,255,255,0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'rgba(255,255,255,0.35)',
                            fontSize: 22,
                            fontWeight: 500,
                          }}
                        >
                          {c ? '' : '?'}
                        </div>
                      ))}
                    </div>
                  )}
                  {game.slug === 'rengi-hatirla' && (
                    <div className="game-swatch" style={{ height: 120, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #9f99e8, #5c54c4)', borderTopLeftRadius: 12, borderTopRightRadius: 12, flexShrink: 0 }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                        <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.12em', whiteSpace: 'nowrap' }}>
                        GÖR · EZBERLE · YARAT
                      </div>
                    </div>
                  )}
                  <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>
                      {game.title[lang]}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {game.slug === 'rengi-hatirla'
                        ? (lang === 'tr' ? 'rengi gör, yeniden yarat' : 'see the color, recreate it')
                        : game.description[lang]}
                    </div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center',
                      gap: 4, marginTop: 4,
                    }}
                    >
                      <div style={{
                        fontSize: 9, fontWeight: 600,
                        color: 'var(--text-tertiary)',
                        background: 'var(--bg-tertiary)',
                        border: '0.5px solid var(--border)',
                        padding: '2px 7px', borderRadius: 20,
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                      }}
                      >
                        {lang === 'tr' ? 'sınırsız' : 'endless'}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

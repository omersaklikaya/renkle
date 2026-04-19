'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import StreakFlameIcon from '@/components/StreakFlameIcon'
import ThemeToggleButton from '@/components/ThemeToggleButton'
import {
  LS_RENGI_DAILY as LS_DAILY,
  calendarDaysBetween,
  dayKey,
  displayDailyStreakFromSaved,
} from '@/lib/rengiDailyStreak'

type Phase = 'memorize' | 'guess' | 'result'
type Mode = 'daily' | 'endless'
interface Color { r: number; g: number; b: number }

function getDailyColor(): Color {
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  const pseudo = (n: number) => { const x = Math.sin(n) * 10000; return x - Math.floor(x) }
  return {
    r: Math.floor(pseudo(seed) * 256),
    g: Math.floor(pseudo(seed + 1) * 256),
    b: Math.floor(pseudo(seed + 2) * 256),
  }
}

function randomColor(): Color {
  return { r: Math.floor(Math.random() * 256), g: Math.floor(Math.random() * 256), b: Math.floor(Math.random() * 256) }
}

function colorToHex(c: Color): string {
  return '#' + [c.r, c.g, c.b].map(v => v.toString(16).padStart(2, '0')).join('').toLowerCase()
}

function colorToCss(c: Color): string { return `rgb(${c.r},${c.g},${c.b})` }

function calcSimilarity(a: Color, b: Color): number {
  const dist = Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2)
  return Math.round((1 - dist / Math.sqrt(3 * 255 ** 2)) * 100)
}

function hsvToRgb(h: number, s: number, v: number): Color {
  const f = (n: number) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)) }
  return { r: Math.round(f(5) * 255), g: Math.round(f(3) * 255), b: Math.round(f(1) * 255) }
}

function getTimeUntilMidnight(): string {
  const now = new Date()
  const midnight = new Date()
  midnight.setHours(24, 0, 0, 0)
  const diff = midnight.getTime() - now.getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const LS_ENDLESS = 'renkle-rengi-hatirla-endless'

/** Ezber: 5 sn geri sayım (50 ms adım), bitince otomatik tahmin. */
const MEMORIZE_PREP_MS = 5000

function formatMemorizeSeconds(ms: number): string {
  return (Math.max(0, ms) / 1000).toFixed(2)
}

type DailyPersist = { d: string; s: number; streak: number; streakDay: string }

function ColorPicker({ onChange }: { onChange: (c: Color) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hueBarRef = useRef<HTMLDivElement>(null)
  const [hue, setHue] = useState(0)
  const [sv, setSv] = useState({ s: 0.5, v: 0.5 })
  const svRef = useRef(sv)
  svRef.current = sv
  const dragging = useRef(false)

  const update = useCallback((s: number, v: number, h: number) => {
    onChange(hsvToRgb(h, s, v))
  }, [onChange])

  const applyHueClientX = useCallback((clientX: number) => {
    const el = hueBarRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const h = Math.round(x * 360)
    const { s, v } = svRef.current
    setHue(h)
    update(s, v, h)
  }, [update])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const w = canvas.width, h = canvas.height
    const hGrad = ctx.createLinearGradient(0, 0, w, 0)
    hGrad.addColorStop(0, `hsla(${hue},100%,50%,0)`)
    hGrad.addColorStop(1, `hsla(${hue},100%,50%,1)`)
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, w, h)
    ctx.fillStyle = hGrad
    ctx.fillRect(0, 0, w, h)
    const vGrad = ctx.createLinearGradient(0, 0, 0, h)
    vGrad.addColorStop(0, 'rgba(0,0,0,0)')
    vGrad.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.fillStyle = vGrad
    ctx.fillRect(0, 0, w, h)
  }, [hue])

  const handleCanvas = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    const newSv = { s: x, v: 1 - y }
    setSv(newSv)
    update(newSv.s, newSv.v, hue)
  }, [hue, update])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
      <div
        ref={hueBarRef}
        style={{
          height: 20,
          borderRadius: 10,
          border: '0.5px solid var(--border)',
          background: 'linear-gradient(to right, hsl(0,100%,50%), hsl(30,100%,50%), hsl(60,100%,50%), hsl(90,100%,50%), hsl(120,100%,50%), hsl(150,100%,50%), hsl(180,100%,50%), hsl(210,100%,50%), hsl(240,100%,50%), hsl(270,100%,50%), hsl(300,100%,50%), hsl(330,100%,50%), hsl(360,100%,50%))',
          position: 'relative',
          cursor: 'pointer',
          touchAction: 'none',
        }}
        onPointerDown={(e) => {
          if (e.pointerType === 'mouse' && e.button !== 0) return
          ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
          applyHueClientX(e.clientX)
        }}
        onPointerMove={(e) => {
          if (!(e.currentTarget as HTMLDivElement).hasPointerCapture(e.pointerId)) return
          applyHueClientX(e.clientX)
        }}
        onPointerUp={(e) => {
          const el = e.currentTarget as HTMLDivElement
          if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
        }}
        onPointerCancel={(e) => {
          const el = e.currentTarget as HTMLDivElement
          if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
        }}
      >
        <div style={{
          position: 'absolute', left: `calc(${(hue / 360) * 100}% - 12px)`, top: '50%',
          transform: 'translateY(-50%)', width: 24, height: 24, borderRadius: '50%',
          background: `hsl(${hue},100%,50%)`, border: '2px solid white',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.2)', pointerEvents: 'none',
        }} />
      </div>

      <div style={{ position: 'relative', width: '100%' }}>
        <canvas
          ref={canvasRef} width={520} height={364}
          style={{
            width: '100%',
            height: 260,
            borderRadius: 'var(--radius-md)',
            border: '0.5px solid var(--border)',
            cursor: 'crosshair',
            display: 'block',
            touchAction: 'none',
          }}
          onMouseDown={e => { dragging.current = true; handleCanvas(e) }}
          onMouseMove={e => { if (dragging.current) handleCanvas(e) }}
          onMouseUp={() => { dragging.current = false }}
          onMouseLeave={() => { dragging.current = false }}
          onTouchStart={e => { dragging.current = true; handleCanvas(e) }}
          onTouchMove={(e) => {
            if (!dragging.current) return
            e.preventDefault()
            handleCanvas(e)
          }}
          onTouchEnd={() => { dragging.current = false }}
          onTouchCancel={() => { dragging.current = false }}
        />
        <div style={{
          position: 'absolute', left: `calc(${sv.s * 100}% - 8px)`, top: `calc(${(1 - sv.v) * 100}% - 8px)`,
          width: 16, height: 16, borderRadius: '50%', border: '2px solid white',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.3)', pointerEvents: 'none',
        }} />
      </div>
    </div>
  )
}

export default function RengiHatirla() {
  const [lang, setLang] = useState<'tr' | 'en'>('tr')
  const [mode, setMode] = useState<Mode | null>(null)
  const [phase, setPhase] = useState<Phase>('memorize')
  const [target, setTarget] = useState<Color>(randomColor())
  const [guess, setGuess] = useState<Color>({ r: 128, g: 128, b: 128 })
  /** ColorPicker ilk etkileşimde onChange çağırır; öncesinde önizlemede gri yerine uyarı metni. */
  const [guessPicked, setGuessPicked] = useState(false)
  const [similarity, setSimilarity] = useState<number | null>(null)
  const [endlessScores, setEndlessScores] = useState<number[]>([])
  const [endlessTargets, setEndlessTargets] = useState<Color[]>([])
  const [endlessBest, setEndlessBest] = useState(0)
  const [countdown, setCountdown] = useState(getTimeUntilMidnight())
  const [dailyPlayed, setDailyPlayed] = useState(false)
  const [dailyScore, setDailyScore] = useState<number | null>(null)
  const [dailyStreak, setDailyStreak] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [statsHydrated, setStatsHydrated] = useState(false)
  const [memorizePrepMsLeft, setMemorizePrepMsLeft] = useState(MEMORIZE_PREP_MS)
  const [narrowViewport, setNarrowViewport] = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    const sync = () => setNarrowViewport(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!mode || phase !== 'memorize') return undefined
    setMemorizePrepMsLeft(MEMORIZE_PREP_MS)
    const id = window.setInterval(() => {
      setMemorizePrepMsLeft((prev) => {
        if (prev <= 0) return 0
        const next = Math.max(0, prev - 50)
        if (next <= 0) {
          window.clearInterval(id)
          queueMicrotask(() => setPhase('guess'))
          return 0
        }
        return next
      })
    }, 50)
    return () => window.clearInterval(id)
  }, [mode, phase])

  useEffect(() => {
    const tick = () => {
      setCountdown(getTimeUntilMidnight())
      try {
        const dailyRaw = localStorage.getItem(LS_DAILY)
        const today = dayKey()
        if (!dailyRaw) {
          setDailyPlayed(false)
          setDailyScore(null)
          setDailyStreak(0)
          return
        }
        const parsed = JSON.parse(dailyRaw) as { d?: string; s?: number; streak?: number; streakDay?: string }
        setDailyStreak(displayDailyStreakFromSaved(parsed, today))
        if (parsed.d === today && typeof parsed.s === 'number') {
          setDailyPlayed(true)
          setDailyScore(parsed.s)
        } else {
          setDailyPlayed(false)
          setDailyScore(null)
        }
      } catch {
        setDailyPlayed(false)
        setDailyScore(null)
        setDailyStreak(0)
      }
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const enRaw = localStorage.getItem(LS_ENDLESS)
        if (enRaw) {
          const o = JSON.parse(enRaw) as {
            scores?: number[]
            targets?: unknown[]
            best?: number
          }
          if (Array.isArray(o.scores)) setEndlessScores(o.scores)
          if (Array.isArray(o.targets)) {
            const parsed: Color[] = []
            for (const item of o.targets) {
              if (
                item && typeof item === 'object'
                && 'r' in item && 'g' in item && 'b' in item
                && [((item as Color).r), ((item as Color).g), ((item as Color).b)].every(
                  n => typeof n === 'number' && n >= 0 && n <= 255,
                )
              ) {
                parsed.push({ r: (item as Color).r, g: (item as Color).g, b: (item as Color).b })
              }
            }
            if (parsed.length === o.scores?.length) setEndlessTargets(parsed)
          }
          if (typeof o.best === 'number') setEndlessBest(o.best)
        }
      } catch { /* ignore */ }
      setStatsHydrated(true)
    })
  }, [])

  useEffect(() => {
    if (!statsHydrated) return
    try {
      localStorage.setItem(LS_ENDLESS, JSON.stringify({
        scores: endlessScores,
        targets: endlessTargets,
        best: endlessBest,
      }))
    } catch { /* ignore */ }
  }, [statsHydrated, endlessScores, endlessTargets, endlessBest])

  const startMode = (m: Mode) => {
    if (m === 'daily' && dailyPlayed) return
    setMode(m)
    setTarget(m === 'daily' ? getDailyColor() : randomColor())
    setGuess({ r: 128, g: 128, b: 128 })
    setGuessPicked(false)
    setSimilarity(null)
    setMemorizePrepMsLeft(MEMORIZE_PREP_MS)
    setPhase('memorize')
  }

  const handleGuess = () => {
    const score = calcSimilarity(target, guess)
    setSimilarity(score)
    if (mode === 'endless') {
      setEndlessScores(prev => [...prev, score])
      setEndlessTargets(prev => [...prev, { r: target.r, g: target.g, b: target.b }])
      setEndlessBest(prev => Math.max(prev, score))
    }
    if (mode === 'daily') {
      const today = dayKey()
      let prevStreak = 0
      let prevStreakDay: string | undefined
      try {
        const raw = localStorage.getItem(LS_DAILY)
        if (raw) {
          const p = JSON.parse(raw) as { streak?: number; streakDay?: string; d?: string }
          prevStreak = typeof p.streak === 'number' ? p.streak : 0
          prevStreakDay = p.streakDay ?? p.d
        }
      } catch { /* ignore */ }

      let newStreak = 1
      if (prevStreakDay) {
        const gap = calendarDaysBetween(prevStreakDay, today)
        if (gap === 0) newStreak = prevStreak
        else if (gap === 1) newStreak = prevStreak + 1
        else newStreak = 1
      }

      setDailyStreak(newStreak)
      setDailyPlayed(true)
      setDailyScore(score)
      try {
        const payload: DailyPersist = { d: today, s: score, streak: newStreak, streakDay: today }
        localStorage.setItem(LS_DAILY, JSON.stringify(payload))
      } catch { /* ignore */ }
    }
    setPhase('result')
  }

  const nextRound = () => {
    setTarget(randomColor())
    setGuess({ r: 128, g: 128, b: 128 })
    setGuessPicked(false)
    setSimilarity(null)
    setMemorizePrepMsLeft(MEMORIZE_PREP_MS)
    setPhase('memorize')
  }

  const endlessAvg = endlessScores.length > 0
    ? Math.round(endlessScores.reduce((a, b) => a + b, 0) / endlessScores.length)
    : 0

  const recentEndlessColors = endlessTargets.slice(-5)
  const emptyColorSlots = Math.max(0, 5 - recentEndlessColors.length)
  const endlessColorChartSlots: (Color | null)[] = [
    ...Array.from({ length: emptyColorSlots }, () => null),
    ...recentEndlessColors,
  ]

  const t = {
    tr: {
      title: 'rengi hatırla', daily: 'günlük', endless: 'sınırsız',
      dailyDesc: 'Bugünün rengi — herkes aynı rengi tahmin ediyor',
      endlessDesc: 'İstediğin kadar oyna, statlarını takip et',
      memorize: 'rengi ezberle', guess: 'tahminde bulun', result: 'sonuç',
      submit: 'tahmin et', next: 'sonraki renk',
      target: 'hedef', yours: 'senin', best: 'en iyi', streak: 'seri',
      avg: 'ort.', share: 'paylaş', nextColor: 'yeni renge', home: 'ana sayfa',
      alreadyPlayed: 'Bugünü oynadın!', perfect: 'mükemmel!',
      good: 'iyi!', tryAgain: 'tekrar dene', backToMenu: 'mod seç',
      dailyDoneTitle: 'bugünlük tamam.', newColorCountdown: 'yeni renk:',
      todaysScore: 'bugünkü skorun',
      selectColor: 'renk seç',
      themeToggleAria: 'tema: açık, koyu veya sistem',
    },
    en: {
      title: 'color memory', daily: 'daily', endless: 'endless',
      dailyDesc: "Today's color — everyone guesses the same color",
      endlessDesc: 'Play as much as you want, track your stats',
      memorize: 'memorize the color', guess: 'make your guess', result: 'result',
      submit: 'submit', next: 'next color',
      target: 'target', yours: 'yours', best: 'best', streak: 'streak',
      avg: 'avg.', share: 'share', nextColor: 'next color in', home: 'home',
      alreadyPlayed: 'Already played today!', perfect: 'perfect!',
      good: 'good!', tryAgain: 'try again', backToMenu: 'choose mode',
      dailyDoneTitle: 'all done for today.', newColorCountdown: 'new color:',
      todaysScore: "today's score",
      selectColor: 'pick a color',
      themeToggleAria: 'theme: light, dark, or match system',
    },
  }[lang]

  const isGuessPhase = Boolean(mode && phase === 'guess')

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column',
      opacity: mounted ? 1 : 0, transition: 'opacity 0.3s ease',
    }}>
      <nav className="site-nav">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="renkle-mark" aria-hidden />
          <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.3px' }}>renkle</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {mode && (
            <button
              type="button"
              onClick={() => setMode(null)}
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--text-primary)',
                background: 'transparent',
                border: 'none',
                borderRadius: 0,
                cursor: 'pointer',
                padding: 0,
                fontFamily: 'inherit',
              }}
            >
              {t.backToMenu}
            </button>
          )}
          <div style={{ display: 'flex', border: '0.5px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
            {(['tr', 'en'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: '5px 12px', fontSize: 12, border: 'none',
                background: lang === l ? 'var(--bg-secondary)' : 'transparent',
                color: lang === l ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: lang === l ? 500 : 400,
              }}>{l}</button>
            ))}
          </div>
          <ThemeToggleButton lang={lang} ariaLabel={t.themeToggleAria} title={t.themeToggleAria} />
        </div>
      </nav>

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: 0,
        height: '100%',
        padding: isGuessPhase
          ? (narrowViewport
            ? `12px var(--page-padding) 40px`
            : `0 var(--page-padding) 40px`)
          : '48px var(--page-padding) 40px',
        gap: 28,
        maxWidth: 520,
        margin: '0 auto',
        width: '100%',
      }}>

        {/* MOD SEÇİM */}
        {!mode && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.4px', marginBottom: 6 }}>{t.title}</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {lang === 'tr' ? 'rengi gör, ezberle, yeniden yarat' : 'see the color, memorize it, recreate it'}
              </p>
            </div>

            <div className="rengi-mode-select">
              {/* Günlük */}
              <div
                className="rengi-mode-card"
                onClick={() => !dailyPlayed && startMode('daily')}
                style={{
                  minHeight: 240,
                  border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)',
                  padding: '24px', cursor: dailyPlayed ? 'default' : 'pointer',
                  background: 'var(--bg-secondary)', opacity: dailyPlayed ? 0.7 : 1,
                  transition: 'border-color 0.15s',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ marginBottom: 6 }}>
                    <span className="rengi-mode-card__title" style={{ fontSize: 15, fontWeight: 500 }}>{t.daily}</span>
                  </div>
                  <p className="rengi-mode-card__desc" style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t.dailyDesc}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14, alignItems: 'flex-start' }}>
                  {((dailyPlayed && dailyScore !== null) || dailyStreak > 0) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', lineHeight: 1 }}>
                      {dailyPlayed && dailyScore !== null && (
                        <span className="rengi-mode-card__score" style={{ fontSize: 22, fontWeight: 600, color: '#639922', letterSpacing: '-0.03em' }}>
                          {dailyScore}%
                        </span>
                      )}
                      {dailyStreak > 0 && (
                        <span
                          className="rengi-mode-card__streak"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 22,
                            fontWeight: 600,
                            letterSpacing: '-0.03em',
                          }}
                        >
                          <span style={{ color: '#ea580c', display: 'flex', alignItems: 'center', lineHeight: 0 }}>
                            <StreakFlameIcon muted={false} height={26} />
                          </span>
                          <span className="rengi-mode-card__streak-num">{dailyStreak}</span>
                        </span>
                      )}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#639922' }} />
                    <span className="rengi-mode-card__countdown" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                      {t.nextColor} {countdown}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sınırsız */}
              <div
                className="rengi-mode-card"
                onClick={() => startMode('endless')}
                style={{
                  minHeight: 240,
                  border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)',
                  padding: '24px', cursor: 'pointer',
                  background: 'var(--bg-secondary)',
                  transition: 'border-color 0.15s',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ marginBottom: 6 }}>
                    <span className="rengi-mode-card__title" style={{ fontSize: 15, fontWeight: 500 }}>{t.endless}</span>
                  </div>
                  <p className="rengi-mode-card__desc" style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{t.endlessDesc}</p>
                </div>
                <div style={{
                  display: 'flex', gap: 4, alignItems: 'flex-end', width: '100%', height: 32, marginTop: 14, marginBottom: 14,
                }}>
                  {endlessColorChartSlots.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'stretch', minWidth: 0,
                      }}
                    >
                      {c === null ? (
                        <div style={{
                          height: 32, minHeight: 8, borderRadius: 4,
                          border: '1px dashed var(--border-mid)', boxSizing: 'border-box',
                        }} />
                      ) : (
                        <div style={{
                          height: 32, borderRadius: 4,
                          background: colorToCss(c),
                          border: '0.5px solid var(--border)',
                          boxSizing: 'border-box',
                        }} />
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 28, marginTop: 0, justifyContent: 'flex-start' }}>
                  {[
                    { val: endlessScores.length > 0 ? `${endlessBest}%` : '—', lbl: t.best },
                    { val: endlessScores.length > 0 ? `${endlessAvg}%` : '—', lbl: t.avg },
                  ].map(({ val, lbl }) => (
                    <div key={lbl}>
                      <div className="rengi-mode-card__stat-val" style={{ fontSize: 16, fontWeight: 500 }}>{val}</div>
                      <div className="rengi-mode-card__stat-lbl" style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* EZBERLE */}
        {mode && phase === 'memorize' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              flex: 1,
              gap: 0,
              minHeight: 0,
              alignSelf: 'stretch',
            }}
          >
            <p style={{
              margin: 0,
              width: '100%',
              fontSize: narrowViewport ? 20 : 13,
              fontWeight: narrowViewport ? 500 : 400,
              letterSpacing: narrowViewport ? '-0.3px' : 'normal',
              color: narrowViewport ? 'var(--text-primary)' : 'var(--text-secondary)',
              padding: narrowViewport ? '0 0 16px' : '0 0 12px',
              textAlign: narrowViewport ? 'center' : 'left',
            }}
            >
              {t.memorize}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 12, minHeight: 0 }}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: 320,
                  borderRadius: 'var(--radius-lg)',
                  border: '0.5px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  overflow: 'hidden',
                }}
              >
                <div
                  aria-hidden
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: colorToCss(target),
                    opacity: 1,
                    pointerEvents: 'none',
                  }}
                />
              </div>
              <div
                style={{
                  alignSelf: 'center',
                  marginTop: 10,
                  padding: '12px 28px',
                  borderRadius: 16,
                  border: '0.5px solid var(--border)',
                  background: 'var(--bg-secondary)',
                  boxSizing: 'border-box',
                  minWidth: 132,
                }}
              >
                <span
                  aria-live="polite"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    fontSize: 48,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontVariantNumeric: 'tabular-nums',
                    lineHeight: 1,
                  }}
                >
                  {formatMemorizeSeconds(memorizePrepMsLeft)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAHMİN — mobilde başlık yok; geniş ekranda başlık navbar–renk kutusu arasında ortada */}
        {mode && phase === 'guess' && (
          <div style={{
            width: '100%',
            minWidth: 0,
            flex: narrowViewport ? '0 0 auto' : 1,
            minHeight: narrowViewport ? undefined : 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
          }}
          >
            {!narrowViewport && (
              <div style={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'stretch',
              }}
              >
                <p style={{
                  margin: 0,
                  width: '100%',
                  fontSize: 22,
                  fontWeight: 500,
                  letterSpacing: '-0.35px',
                  color: 'var(--text-primary)',
                  lineHeight: 1.35,
                  textAlign: 'center',
                }}
                >
                  {t.guess}
                </p>
              </div>
            )}

            <div style={{ width: '100%', minWidth: 0, flexShrink: 0 }}>
              <div
                style={{
                  width: '100%',
                  minWidth: 0,
                  height: 168,
                  borderRadius: 10,
                  border: '0.5px solid var(--border)',
                  background: guessPicked ? colorToCss(guess) : 'var(--bg-tertiary)',
                  transition: 'background 0.08s ease',
                  boxSizing: 'border-box',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {!guessPicked && (
                  <span style={{
                    fontSize: 16,
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                    color: 'var(--text-secondary)',
                  }}>
                    {t.selectColor}
                  </span>
                )}
              </div>
            </div>

            <div style={{ width: '100%', minWidth: 0, flexShrink: 0, marginTop: 12 }}>
              <ColorPicker onChange={(c) => { setGuess(c); setGuessPicked(true) }} />
            </div>

            <button onClick={handleGuess} style={{
              width: '100%',
              flexShrink: 0,
              marginTop: 12,
              padding: '16px 0',
              fontSize: 15,
              fontWeight: 500,
              border: '0.5px solid var(--border-mid)',
              borderRadius: 24,
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
            }}>
              {t.submit}
            </button>
          </div>
        )}

        {/* SONUÇ */}
        {mode && phase === 'result' && (
          <>
            {mode === 'daily' ? (
              <div style={{
                width: '100%', alignSelf: 'stretch', maxWidth: 560, margin: '0 auto',
                border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-secondary)', padding: '32px 24px 28px',
                textAlign: 'center',
              }}>
                <h2 style={{
                  fontSize: 20, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 10,
                  color: 'var(--text-primary)',
                }}>{t.dailyDoneTitle}</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.4 }}>
                  {t.newColorCountdown}{' '}
                  <span style={{ color: 'var(--text-primary)' }}>{countdown}</span>
                </p>

                <div style={{
                  display: 'flex',
                  flexDirection: narrowViewport ? 'column' : 'row',
                  gap: 10,
                  width: '100%',
                  marginBottom: 28,
                }}
                >
                  {[
                    { color: target, label: t.target, hex: colorToHex(target) },
                    { color: guess, label: t.yours, hex: colorToHex(guess) },
                  ].map(({ color, label, hex }) => (
                    <div
                      key={label}
                      style={{
                        flex: narrowViewport ? '0 0 auto' : 1,
                        width: '100%',
                        minWidth: 0,
                        borderRadius: 14,
                        overflow: 'hidden',
                        border: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column',
                        background: 'var(--bg-tertiary)',
                      }}
                    >
                      <div style={{
                        width: '100%', height: 112, flexShrink: 0,
                        background: colorToCss(color),
                      }} />
                      <div style={{
                        padding: '12px 10px 14px', textAlign: 'center',
                        background: 'var(--bg-tertiary)',
                      }}>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {label}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 6, letterSpacing: '0.04em' }}>
                          {hex}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  {t.todaysScore}
                </p>
                <div style={{
                  fontSize: 52, fontWeight: 600, letterSpacing: '-0.04em', lineHeight: 1,
                  color: similarity && similarity >= 90 ? '#c8e85c' : similarity && similarity >= 70 ? '#d4a524' : 'var(--text-primary)',
                  marginBottom: 10,
                }}>
                  {similarity}%
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 28 }}>
                  {similarity && similarity >= 90 ? t.perfect : similarity && similarity >= 70 ? t.good : t.tryAgain}
                </p>

                <div style={{
                  display: 'flex', justifyContent: 'space-between', gap: 12, paddingTop: 8,
                  borderTop: '0.5px solid var(--border)', marginBottom: 24,
                }}>
                  {[
                    { val: similarity !== null ? `${similarity}%` : '—', lbl: t.best },
                    { val: dailyStreak > 0 ? String(dailyStreak) : '—', lbl: t.streak },
                    { val: similarity !== null ? `${similarity}%` : '—', lbl: t.avg },
                  ].map(({ val, lbl }) => (
                    <div key={lbl} style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{val}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 6 }}>
                        {lbl}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const text = lang === 'tr'
                      ? `renkle — günlük rengi hatırla\nSkorun: ${similarity}%\nrenkle.vercel.app`
                      : `renkle — daily color memory\nScore: ${similarity}%\nrenkle.vercel.app`
                    navigator.clipboard.writeText(text)
                  }}
                  style={{
                    padding: '10px 28px', fontSize: 13, fontWeight: 500,
                    border: '0.5px solid var(--border-mid)', borderRadius: 24,
                    background: 'var(--bg)', color: 'var(--text-primary)',
                  }}
                >
                  {t.share}
                </button>
              </div>
            ) : (
              <>
                <p style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 500,
                  letterSpacing: '-0.35px',
                  color: 'var(--text-primary)',
                  textAlign: 'center',
                }}
                >
                  {t.result}
                </p>
                <div style={{
                  display: 'flex',
                  flexDirection: narrowViewport ? 'column' : 'row',
                  gap: 10,
                  width: '100%',
                }}
                >
                  {[
                    { color: target, label: t.target, hex: colorToHex(target) },
                    { color: guess, label: t.yours, hex: colorToHex(guess) },
                  ].map(({ color, label, hex }) => (
                    <div
                      key={label}
                      style={{
                        flex: narrowViewport ? '0 0 auto' : 1,
                        width: '100%',
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        alignItems: 'center',
                      }}
                    >
                      <div style={{
                        width: '100%', height: 120, borderRadius: 'var(--radius-md)',
                        background: colorToCss(color), border: '0.5px solid var(--border)',
                      }} />
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{hex}</span>
                    </div>
                  ))}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    fontSize: 52, fontWeight: 500, letterSpacing: '-1px',
                    color: similarity && similarity >= 90 ? '#639922' : similarity && similarity >= 70 ? '#BA7517' : 'var(--text-primary)',
                  }}>
                    {similarity}%
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {similarity && similarity >= 90 ? t.perfect : similarity && similarity >= 70 ? t.good : t.tryAgain}
                  </div>
                </div>
              </>
            )}

            {mode === 'endless' && (
              <div style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              >
                <div style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8,
                  maxWidth: '100%',
                }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const text = lang === 'tr'
                        ? `renkle — rengi hatırla\nSkorun: ${similarity}%\nEn iyi: ${endlessBest}% · Ort: ${endlessAvg}%\nrenkle.vercel.app`
                        : `renkle — color memory\nScore: ${similarity}%\nBest: ${endlessBest}% · Avg: ${endlessAvg}%\nrenkle.vercel.app`
                      navigator.clipboard.writeText(text)
                    }}
                    style={{
                      padding: '12px 14px',
                      fontSize: 14,
                      fontWeight: 500,
                      border: '0.5px solid var(--border-mid)',
                      borderRadius: 24,
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.share}
                  </button>
                  <button
                    type="button"
                    onClick={nextRound}
                    style={{
                      flexShrink: 0,
                      padding: '12px 18px',
                      fontSize: 14,
                      fontWeight: 500,
                      border: '0.5px solid var(--border-mid)',
                      borderRadius: 24,
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.next}
                  </button>
                  <Link
                    href="/"
                    style={{
                      padding: '12px 14px',
                      fontSize: 14,
                      fontWeight: 500,
                      border: '0.5px solid var(--border-mid)',
                      borderRadius: 24,
                      background: 'transparent',
                      color: 'var(--text-secondary)',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.home}
                  </Link>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
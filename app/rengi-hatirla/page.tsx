'use client'

import { Suspense, useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import GameLayout from '@/components/GameLayout'
import HowToPlayFab from '@/components/HowToPlayFab'
import { saveDailyResult } from '@/lib/colorHistory'
import {
  gameContentWrapperStyle,
  gamePrimaryButtonStyle,
  gameSecondaryButtonStyle,
} from '@/lib/gamePageStyles'
import { generateShareText, copyToClipboard } from '@/lib/share'
import { incrementStreak, readStreak } from '@/lib/streak'
import {
  LS_RENGI_DAILY as LS_DAILY,
  dayKey,
} from '@/lib/rengiDailyStreak'
import { GameResultOtherGamesGrid } from '@/components/GameResult'

type Phase = 'memorize' | 'guess' | 'result'
type Mode = 'daily' | 'endless'
type Difficulty = 'kolay' | 'orta' | 'zor'

interface Color { r: number; g: number; b: number }

const diffLabel = {
  kolay: { tr: 'kolay', en: 'easy' },
  orta: { tr: 'orta', en: 'medium' },
  zor: { tr: 'zor', en: 'hard' },
} as const

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

function randomColorByDifficulty(diff: Difficulty): Color {
  if (diff === 'kolay') {
    const presets = [
      { r: 255, g: 0, b: 0 },
      { r: 0, g: 255, b: 0 },
      { r: 0, g: 0, b: 255 },
      { r: 255, g: 255, b: 0 },
      { r: 255, g: 0, b: 255 },
      { r: 0, g: 255, b: 255 },
      { r: 255, g: 128, b: 0 },
      { r: 128, g: 0, b: 255 },
    ]
    return presets[Math.floor(Math.random() * presets.length)]
  }

  if (diff === 'orta') {
    return {
      r: Math.floor(Math.random() * 256),
      g: Math.floor(Math.random() * 256),
      b: Math.floor(Math.random() * 256),
    }
  }

  const base = Math.floor(Math.random() * 256)
  const variance = 40
  return {
    r: Math.min(255, Math.max(0, base + Math.floor((Math.random() - 0.5) * variance))),
    g: Math.min(255, Math.max(0, base + Math.floor((Math.random() - 0.5) * variance))),
    b: Math.min(255, Math.max(0, base + Math.floor((Math.random() - 0.5) * variance))),
  }
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

/** Ezber: 5 sn geri sayım, bitince otomatik tahmin. */
const MEMORIZE_PREP_SECONDS_ENDLESS = 5
const MEMORIZE_PREP_SECONDS_DAILY = 3
const DAILY_ROUNDS = 5

function getDailyTargets(): Color[] {
  const d = new Date()
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
  const pseudo = (n: number) => {
    const x = Math.sin(n) * 10000
    return x - Math.floor(x)
  }

  const targets: Color[] = []

  targets.push({
    r: Math.floor(pseudo(seed) * 256),
    g: Math.floor(pseudo(seed + 1) * 256),
    b: Math.floor(pseudo(seed + 2) * 256),
  })

  for (let i = 1; i <= 2; i++) {
    targets.push({
      r: Math.floor(pseudo(seed + i * 10) * 256),
      g: Math.floor(pseudo(seed + i * 10 + 1) * 256),
      b: Math.floor(pseudo(seed + i * 10 + 2) * 256),
    })
  }

  const base4 = Math.floor(pseudo(seed + 40) * 200) + 28
  targets.push({
    r: Math.min(255, Math.max(0, base4 + Math.floor(pseudo(seed + 41) * 40) - 20)),
    g: Math.min(255, Math.max(0, base4 + Math.floor(pseudo(seed + 42) * 40) - 20)),
    b: Math.min(255, Math.max(0, base4 + Math.floor(pseudo(seed + 43) * 40) - 20)),
  })

  const base5 = Math.floor(pseudo(seed + 50) * 180) + 40
  targets.push({
    r: Math.min(255, Math.max(0, base5 + Math.floor(pseudo(seed + 51) * 20) - 10)),
    g: Math.min(255, Math.max(0, base5 + Math.floor(pseudo(seed + 52) * 20) - 10)),
    b: Math.min(255, Math.max(0, base5 + Math.floor(pseudo(seed + 53) * 20) - 10)),
  })

  return targets
}

function getShareEmoji(score: number): string {
  if (score >= 90) return '🟢'
  if (score >= 70) return '🟡'
  return '🔴'
}

function LockIconSmall({ muted }: { muted?: boolean }) {
  const c = muted ? 'var(--text-tertiary)' : 'var(--text-secondary)'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden style={{ opacity: 0.85 }}>
      <path
        d="M7 11V8a5 5 0 0110 0v3"
        stroke={c}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <rect x="5" y="11" width="14" height="10" rx="2" stroke={c} strokeWidth="1.75" />
    </svg>
  )
}

type DailyPersist = {
  d: string
  s?: number
  score?: number
  streak: number
  streakDay?: string
  targetColor?: Color
  guessColor?: Color
  scores?: number[]
  targets?: Color[]
  guesses?: Color[]
}

function isColor(value: unknown): value is Color {
  if (!value || typeof value !== 'object') return false
  const c = value as Partial<Color>
  return typeof c.r === 'number' && typeof c.g === 'number' && typeof c.b === 'number'
}

function ColorPicker({ onChange }: { onChange: (c: Color) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hueBarRef = useRef<HTMLDivElement>(null)
  const [hue, setHue] = useState(0)
  const [sv, setSv] = useState({ s: 0.5, v: 0.5 })
  const svRef = useRef(sv)
  const dragging = useRef(false)

  useLayoutEffect(() => {
    svRef.current = sv
  }, [sv])

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

function RengiHatirlaContent() {
  const searchParams = useSearchParams()
  const modParam = searchParams.get('mod')

  const [lang, setLang] = useState<'tr' | 'en'>('tr')
  const [mode, setMode] = useState<Mode | null>(null)
  const [phase, setPhase] = useState<Phase>('memorize')
  const [difficulty, setDifficulty] = useState<Difficulty>('orta')
  const [target, setTarget] = useState<Color>(() => randomColorByDifficulty('orta'))
  const [guess, setGuess] = useState<Color>({ r: 128, g: 128, b: 128 })
  /** ColorPicker ilk etkileşimde onChange çağırır; öncesinde önizlemede gri yerine uyarı metni. */
  const [guessPicked, setGuessPicked] = useState(false)
  const [similarity, setSimilarity] = useState<number | null>(null)
  const [endlessScores, setEndlessScores] = useState<number[]>([])
  const [endlessTargets, setEndlessTargets] = useState<Color[]>([])
  const [endlessBest, setEndlessBest] = useState(0)
  const [countdown, setCountdown] = useState(getTimeUntilMidnight())
  const [dailyPlayed, setDailyPlayed] = useState(false)
  const [dailyHydrated, setDailyHydrated] = useState(false)
  const [dailyScore, setDailyScore] = useState<number | null>(null)
  const [dailyRound, setDailyRound] = useState(0)
  const [dailyScores, setDailyScores] = useState<number[]>([])
  const [dailyTargets, setDailyTargets] = useState<Color[]>([])
  const [dailyGuesses, setDailyGuesses] = useState<Color[]>([])
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [statsHydrated, setStatsHydrated] = useState(false)
  const [timer, setTimer] = useState(MEMORIZE_PREP_SECONDS_ENDLESS)
  const [answerAnim, setAnswerAnim] = useState<'correct' | 'wrong' | null>(null)
  const [displayScore, setDisplayScore] = useState(0)
  const dailyStreak = readStreak()
  const memorizeTime = mode === 'daily' ? MEMORIZE_PREP_SECONDS_DAILY : MEMORIZE_PREP_SECONDS_ENDLESS

  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])

  useEffect(() => {
    if (!mode || phase !== 'memorize') return undefined
    queueMicrotask(() => setTimer(memorizeTime))
    const id = window.setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          window.clearInterval(id)
          queueMicrotask(() => setPhase('guess'))
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [mode, phase, memorizeTime])

  useEffect(() => {
    const tick = () => {
      setCountdown(getTimeUntilMidnight())
      try {
        const dailyRaw = localStorage.getItem(LS_DAILY)
        const today = dayKey()
        if (!dailyRaw) {
          setDailyPlayed(false)
          setDailyScore(null)
          return
        }
        const parsed = JSON.parse(dailyRaw) as DailyPersist
        const savedScore = typeof parsed.score === 'number' ? parsed.score : parsed.s
        if (parsed.d === today && typeof savedScore === 'number') {
          setDailyPlayed(true)
          setDailyScore(savedScore)
          if (Array.isArray(parsed.scores)) setDailyScores(parsed.scores)
          if (Array.isArray(parsed.targets)) setDailyTargets(parsed.targets)
          if (Array.isArray(parsed.guesses)) setDailyGuesses(parsed.guesses)
        } else {
          setDailyPlayed(false)
          setDailyScore(null)
        }
      } catch {
        setDailyPlayed(false)
        setDailyScore(null)
      }
    }
    tick()
    setDailyHydrated(true)
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [phase, mode])

  useEffect(() => {
    if (phase !== 'result' || similarity === null) return
    const target = similarity
    const duration = 1200
    const steps = 60
    const increment = target / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        setDisplayScore(target)
        clearInterval(timer)
      } else {
        setDisplayScore(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [phase, similarity])

  const startMode = useCallback((m: Mode) => {
    if (m === 'daily' && dailyPlayed) return
    setMode(m)
    if (m === 'daily') {
      const targets = getDailyTargets()
      setDailyTargets(targets)
      setTarget(targets[0])
      setDailyRound(0)
      setDailyScores([])
      setDailyGuesses([])
    } else {
      setTarget(randomColorByDifficulty(difficulty))
      setDailyTargets([])
      setDailyRound(0)
      setDailyScores([])
      setDailyGuesses([])
    }
    setGuess({ r: 128, g: 128, b: 128 })
    setGuessPicked(false)
    setSimilarity(null)
    setTimer(m === 'daily' ? MEMORIZE_PREP_SECONDS_DAILY : MEMORIZE_PREP_SECONDS_ENDLESS)
    setPhase('memorize')
  }, [dailyPlayed, difficulty])

  useEffect(() => {
    if (!dailyHydrated) return
    if (modParam !== 'gunluk') return
    try {
      const raw = localStorage.getItem(LS_DAILY)
      if (raw) {
        const parsed = JSON.parse(raw) as DailyPersist
        const today = dayKey()
        const savedScore = typeof parsed.score === 'number' ? parsed.score : parsed.s
        if (parsed.d === today && typeof savedScore === 'number') {
          setMode('daily')
          setSimilarity(savedScore)
          setDailyPlayed(true)
          setDailyScore(savedScore)
          if (Array.isArray(parsed.scores)) setDailyScores(parsed.scores)
          if (Array.isArray(parsed.targets)) {
            setDailyTargets(parsed.targets)
            if (parsed.targets.length > 0 && isColor(parsed.targets[0])) setTarget(parsed.targets[0])
          } else if (isColor(parsed.targetColor)) {
            setTarget(parsed.targetColor)
          }
          if (Array.isArray(parsed.guesses)) {
            setDailyGuesses(parsed.guesses)
            if (parsed.guesses.length > 0 && isColor(parsed.guesses[parsed.guesses.length - 1])) {
              setGuess(parsed.guesses[parsed.guesses.length - 1])
              setGuessPicked(true)
            }
          } else if (isColor(parsed.guessColor)) {
            setGuess(parsed.guessColor)
            setGuessPicked(true)
          }
          setDailyRound(DAILY_ROUNDS - 1)
          setPhase('result')
          return
        }
      }
    } catch {
      // ignore and continue to start a new daily round
    }
    startMode('daily')
  }, [dailyHydrated, modParam, startMode])

  const handleGuess = () => {
    const score = calcSimilarity(target, guess)
    const isCorrect = score >= 70
    setAnswerAnim(isCorrect ? 'correct' : 'wrong')
    setTimeout(() => setAnswerAnim(null), 600)
    if (mode === 'endless') {
      setSimilarity(score)
      setEndlessScores(prev => [...prev, score])
      setEndlessTargets(prev => [...prev, { r: target.r, g: target.g, b: target.b }])
      setEndlessBest(prev => Math.max(prev, score))
      setPhase('result')
    }
    if (mode === 'daily') {
      const newScores = [...dailyScores, score]
      const newGuesses = [...dailyGuesses, guess]
      setDailyScores(newScores)
      setDailyGuesses(newGuesses)
      if (dailyRound < DAILY_ROUNDS - 1) {
        const nextRoundIdx = dailyRound + 1
        setDailyRound(nextRoundIdx)
        setTarget(dailyTargets[nextRoundIdx])
        setGuess({ r: 128, g: 128, b: 128 })
        setGuessPicked(false)
        setTimer(MEMORIZE_PREP_SECONDS_DAILY)
        setPhase('memorize')
        return
      }
      const totalScore = Math.round(newScores.reduce((a, b) => a + b, 0) / DAILY_ROUNDS)
      setSimilarity(totalScore)
      const today = dayKey()
      const newStreak = incrementStreak()
      setDailyPlayed(true)
      setDailyScore(totalScore)
      try {
        const payload: DailyPersist = {
          d: today,
          score: totalScore,
          s: totalScore,
          streak: newStreak,
          streakDay: today,
          targetColor: dailyTargets[0] ?? target,
          guessColor: guess,
          scores: newScores,
          targets: dailyTargets,
          guesses: newGuesses,
        }
        localStorage.setItem(LS_DAILY, JSON.stringify(payload))
      } catch { /* ignore */ }
      saveDailyResult(colorToHex(dailyTargets[0] ?? target), totalScore)
      setPhase('result')
    }
  }

  const nextRound = () => {
    setTarget(randomColorByDifficulty(difficulty))
    setGuess({ r: 128, g: 128, b: 128 })
    setGuessPicked(false)
    setSimilarity(null)
    setTimer(MEMORIZE_PREP_SECONDS_ENDLESS)
    setPhase('memorize')
  }

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
      dailyPlayedCheck: 'bugün oynadın ✓',
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
      dailyPlayedCheck: 'played today ✓',
    },
  }[lang]

  const helpIsDaily = mode === 'daily' || (!mode && modParam === 'gunluk')
  const helpFabTitle = lang === 'tr' ? 'nasıl oynanır?' : 'how to play'
  const helpFabAria = lang === 'tr' ? 'nasıl oynanır' : 'how to play'
  const helpFabSteps = helpIsDaily
    ? (lang === 'tr' ? [
        { text: '5 farklı renk sırayla gösterilir.' },
        { text: 'Her rengi 3 saniyede ezberle.' },
        { text: 'Renk seçiciyle aynısını bul.' },
        { text: '5 turun ortalaması skorun olur.' },
      ] : [
        { text: 'Five different colors are shown in order.' },
        { text: 'Memorize each color in 3 seconds.' },
        { text: 'Match it with the color picker.' },
        { text: 'Your score is the average of all 5 rounds.' },
      ])
    : (lang === 'tr' ? [
        { text: 'Bir renk gösterilir, 5 saniyede ezberle.' },
        { text: 'Renk seçiciyle aynısını yeniden yarat.' },
        { text: 'Yüzde olarak ne kadar yakın olduğunu gör.' },
        { text: 'İstediğin kadar oyna.' },
      ] : [
        { text: 'A color appears — memorize it in 5 seconds.' },
        { text: 'Recreate it with the color picker.' },
        { text: 'See how close you were as a percentage.' },
        { text: 'Play as many rounds as you like.' },
      ])

  const handleShare = async () => {
    if (!mode || similarity === null) return
    const text = generateShareText(
      'rengi-hatirla',
      mode,
      similarity,
      { lang, streak: mode === 'daily' ? readStreak() : undefined },
    )
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <GameLayout
      lang={lang}
      onLangChange={setLang}
      streak={readStreak()}
    >
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          width: '100%',
          animation: 'fadeIn 0.3s ease',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
        >
          <div style={{
            ...gameContentWrapperStyle,
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            justifyContent: !mode ? 'center' : 'flex-start',
          }}
          >
        <div
          key={`${mode ?? 'menu'}-${phase}`}
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            animation: 'phaseIn 0.35s cubic-bezier(0.16,1,0.3,1)',
          }}
        >

        {!mode && modParam === 'gunluk' && !dailyHydrated && (
          <div style={{ minHeight: 160 }} aria-busy="true" />
        )}

        {/* Giriş: sınırsız */}
        {!mode && modParam !== 'gunluk' && (
          <div style={{ width: '100%', maxWidth: 440, margin: '0 auto' }}>
            <div style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              marginBottom: 16,
              height: 160,
            }}
            >
              <div style={{
                width: '100%',
                height: '100%',
                background: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 8,
              }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="1.5"
                >
                  <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>
                  {lang === 'tr' ? 'başla → renk ortaya çıkacak' : 'start → color will be revealed'}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 18, fontWeight: 500,
                color: 'var(--text-primary)',
                letterSpacing: '-0.3px', marginBottom: 4,
              }}
              >
                {t.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {lang === 'tr' ? 'rengi gör, ezberle, yeniden yarat' : 'see it, memorize it, recreate it'}
              </div>
            </div>

            <div style={{
              border: '0.5px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-secondary)',
              padding: 20,
              display: 'flex', flexDirection: 'column', gap: 16,
            }}
            >
              <div>
                <div style={{
                  background: 'var(--bg)',
                  borderRadius: 12,
                  padding: 4,
                  display: 'flex',
                  gap: 3,
                  border: '0.5px solid var(--border)',
                }}
                >
                  {([
                    { d: 'kolay', sub: { tr: 'büyük fark', en: 'big diff' } },
                    { d: 'orta', sub: { tr: 'rastgele', en: 'random' } },
                    { d: 'zor', sub: { tr: 'çok yakın', en: 'very close' } },
                  ] as const).map(({ d, sub }) => (
                    <div
                      key={d}
                      onClick={() => setDifficulty(d)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setDifficulty(d)
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 9,
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: difficulty === d ? 'var(--bg-secondary)' : 'transparent',
                        border: difficulty === d
                          ? '0.5px solid var(--border-mid)'
                          : '0.5px solid transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        fontSize: 12,
                        color: difficulty === d ? 'var(--text-primary)' : 'var(--text-tertiary)',
                        fontWeight: difficulty === d ? 500 : 400,
                        marginBottom: 2,
                      }}
                      >
                        {diffLabel[d][lang]}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 2 }}>
                        {sub[lang]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{
                  background: 'var(--bg)',
                  borderRadius: 10,
                  padding: '14px 12px',
                  border: '0.5px solid var(--border)',
                  flex: 1,
                }}
                >
                  <div style={{ fontSize: 26, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-1px', marginBottom: 6, lineHeight: 1 }}>∞</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {lang === 'tr' ? 'sınırsız soru' : 'endless questions'}
                  </div>
                </div>
                <div style={{
                  background: 'var(--bg)',
                  borderRadius: 10,
                  padding: '14px 12px',
                  border: '0.5px solid var(--border)',
                  flex: 1,
                }}
                >
                  <div style={{ fontSize: 26, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-1px', marginBottom: 6, lineHeight: 1 }}>5s</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {lang === 'tr' ? 'ezberleme süresi' : 'memorize time'}
                  </div>
                </div>
                <div style={{
                  background: 'var(--bg)',
                  borderRadius: 10,
                  padding: '14px 12px',
                  border: '0.5px solid var(--border)',
                  flex: 1,
                }}
                >
                  <div style={{ fontSize: 26, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-1px', marginBottom: 6, lineHeight: 1 }}>%</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {lang === 'tr' ? 'yakınlık puanı' : 'similarity score'}
                  </div>
                </div>
              </div>

              <button
                className="btn-press"
                type="button"
                onClick={() => startMode('endless')}
                style={{
                  width: '100%', padding: '13px 0', fontSize: 14, fontWeight: 500,
                  border: '0.5px solid var(--border-mid)', borderRadius: 24,
                  background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                {lang === 'tr' ? 'başla →' : 'start →'}
              </button>
            </div>
          </div>
        )}

        {/* EZBERLE */}
        {mode && phase === 'memorize' && (
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
          >
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 4px',
            }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 13, color: 'var(--text-secondary)',
                }}
                >
                  {lang === 'tr' ? 'rengi ezberle' : 'memorize the color'}
                </span>
                {mode === 'daily' && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    {Array.from({ length: DAILY_ROUNDS }, (_, i) => i).map(i => (
                      <div key={i} style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: i <= dailyRound ? 'var(--text-primary)' : 'var(--border)',
                        transition: 'background 0.3s',
                      }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <span style={{
                fontSize: 32, fontWeight: 700,
                fontFamily: 'monospace',
                letterSpacing: '-1px',
                color: timer <= 1
                  ? '#E24B4A'
                  : timer <= 2
                    ? '#EF9F27'
                    : 'var(--text-primary)',
                transition: 'color 0.3s ease',
              }}
              >
                {timer}
              </span>
            </div>
            <div style={{
              width: '100%',
              height: 280,
              borderRadius: 'var(--radius-lg)',
              background: colorToCss(target),
              border: '0.5px solid var(--border)',
              transition: 'background 0.3s ease',
            }}
            />
          </div>
        )}

        {/* TAHMİN */}
        {mode && phase === 'guess' && (
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxSizing: 'border-box',
          }}
          >
            {mode === 'daily' && (
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', width: '100%',
              }}
              >
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {lang === 'tr' ? `tur ${dailyRound + 1}/${DAILY_ROUNDS}` : `round ${dailyRound + 1}/${DAILY_ROUNDS}`}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {Array.from({ length: DAILY_ROUNDS }, (_, i) => i).map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: i < dailyRound
                        ? '#a8e063'
                        : i === dailyRound
                          ? 'var(--text-primary)'
                          : 'var(--border)',
                    }}
                    />
                  ))}
                </div>
              </div>
            )}
            {mode === 'endless' && (
              <div style={{
                fontSize: 11,
                color: 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
              >
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 20,
                  border: '0.5px solid var(--border)',
                  fontSize: 10,
                }}
                >
                  {diffLabel[difficulty][lang]}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <div style={{
                  height: 120,
                  borderRadius: 8,
                  background: 'var(--bg-secondary)',
                  border: '2px dashed var(--border-mid)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxSizing: 'border-box',
                }}
                >
                  <LockIconSmall muted />
                </div>
                <span style={{
                  fontSize: 10,
                  color: 'var(--text-tertiary)',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  letterSpacing: '0.04em',
                }}
                >
                  {lang === 'tr' ? 'gizli' : 'hidden'}
                </span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
                <div style={{
                  height: 120,
                  borderRadius: 8,
                  border: '0.5px solid var(--border)',
                  background: guessPicked ? colorToCss(guess) : 'var(--bg-tertiary)',
                  transition: 'background 0.08s ease',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                >
                  {!guessPicked && (
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.selectColor}</span>
                  )}
                </div>
                <span style={{
                  fontSize: 10,
                  color: 'var(--text-tertiary)',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  letterSpacing: '0.04em',
                }}
                >
                  {colorToHex(guess)}
                </span>
              </div>
            </div>

            <ColorPicker onChange={(c) => { setGuess(c); setGuessPicked(true) }} />

            <button className="btn-press" type="button" onClick={handleGuess} style={{
              ...gamePrimaryButtonStyle,
              marginTop: 4,
            }}
            >
              {t.submit}
            </button>
          </div>
        )}

        {/* SONUÇ */}
        {mode && phase === 'result' && (
          <div style={{
            width: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
          }}
          >
            {mode === 'daily' ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
                width: '100%',
                maxWidth: 480,
                margin: '0 auto',
                padding: '32px var(--page-padding)',
                boxSizing: 'border-box',
              }}
              >
                <div style={{ textAlign: 'center', animation: 'countUp 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
                  <div style={{
                    fontSize: 11, color: 'var(--text-tertiary)',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                  >
                    {lang === 'tr' ? 'bugünkü skorun' : 'your score today'}
                  </div>
                  <div style={{
                    fontSize: 80, fontWeight: 700,
                    letterSpacing: '-3px', lineHeight: 1,
                    color: similarity && similarity >= 90 ? '#a8e063'
                      : similarity && similarity >= 70 ? '#EF9F27'
                      : 'var(--text-primary)',
                  }}
                  >
                    {similarity}%
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-tertiary)', marginTop: 6 }}>
                    {similarity && similarity >= 90
                      ? (lang === 'tr' ? 'mükemmel! 🎨' : 'perfect! 🎨')
                      : similarity && similarity >= 70
                      ? (lang === 'tr' ? 'iyi! yarın daha iyisini yapabilirsin' : 'good! try better tomorrow')
                      : lang === 'tr' ? 'yarın tekrar dene' : 'try again tomorrow'}
                  </div>
                </div>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, animation: 'fadeUp 0.4s ease 0.2s both' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {dailyTargets.map((targetColor, i) => {
                      const score = dailyScores[i] || 0
                      const guessColor = dailyGuesses[i]
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <div style={{
                            height: 40, borderRadius: 6,
                            background: colorToCss(targetColor),
                            border: '0.5px solid rgba(255,255,255,0.1)',
                          }}
                          />
                          <div style={{
                            height: 40, borderRadius: 6,
                            background: guessColor ? colorToCss(guessColor) : 'var(--bg-secondary)',
                            border: '0.5px solid rgba(255,255,255,0.1)',
                          }}
                          />
                          <div style={{
                            fontSize: 10, textAlign: 'center', fontWeight: 600,
                            color: score >= 90 ? '#a8e063'
                              : score >= 70 ? '#EF9F27'
                              : '#E24B4A',
                          }}
                          >
                            {score}%
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div style={{
                    padding: '12px 16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 10,
                    border: '0.5px solid var(--border)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  >
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {lang === 'tr' ? 'bugünkü ortalama' : "today's average"}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {lang === 'tr' ? 'tüm oyuncular ~%67' : 'all players ~67%'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {lang === 'tr' ? 'senin skorun' : 'your score'}
                      </div>
                      <div style={{
                        fontSize: 18, fontWeight: 700,
                        color: similarity && similarity >= 67 ? '#a8e063' : '#EF9F27',
                      }}
                      >
                        %{similarity}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{
                  width: '100%', padding: '16px 20px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 12,
                  border: '0.5px solid var(--border)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between',
                  animation: 'fadeUp 0.4s ease 0.3s both',
                }}
                >
                  <div>
                    <div style={{
                      fontSize: 10, color: 'var(--text-tertiary)',
                      marginBottom: 4, textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                    >
                      {lang === 'tr' ? 'yeni renge kalan süre' : 'next color in'}
                    </div>
                    <div style={{
                      fontSize: 22, fontWeight: 600,
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                      letterSpacing: '0.05em',
                    }}
                    >
                      {countdown}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a8e063' }} />
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {dailyStreak} {lang === 'tr' ? 'günlük seri' : 'day streak'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', animation: 'fadeUp 0.4s ease 0.35s both' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const emojiRow = dailyScores.map(getShareEmoji).join('')
                      const dateLabel = lang === 'tr'
                        ? new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
                        : new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' })
                      const text = lang === 'tr'
                        ? `renkle — günlük rengi hatırla\n${emojiRow}\nOrtalama: %${similarity}\n${dateLabel}\nrenkle.vercel.app`
                        : `renkle — daily color memory\n${emojiRow}\nAverage: ${similarity}%\n${dateLabel}\nrenkle.vercel.app`
                      navigator.clipboard.writeText(text)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    style={{
                      width: '100%', padding: '14px 0',
                      fontSize: 14, fontWeight: 600,
                      border: '0.5px solid rgba(255,255,255,0.15)',
                      borderRadius: 24,
                      background: 'rgba(255,255,255,0.08)',
                      color: 'var(--text-primary)', cursor: 'pointer',
                      letterSpacing: '-0.2px',
                    }}
                  >
                    {copied
                      ? (lang === 'tr' ? 'kopyalandı ✓' : 'copied ✓')
                      : (lang === 'tr' ? 'sonucu paylaş' : 'share result')}
                  </button>

                  <Link href="/" style={{ textDecoration: 'none' }}>
                    <button
                      type="button"
                      style={{
                        width: '100%', padding: '14px 0',
                        fontSize: 14, fontWeight: 500,
                        border: '0.5px solid var(--border)',
                        borderRadius: 24,
                        background: 'transparent',
                        color: 'var(--text-tertiary)', cursor: 'pointer',
                        letterSpacing: '-0.2px',
                      }}
                    >
                      {lang === 'tr' ? 'ana sayfaya dön' : 'back to home'}
                    </button>
                  </Link>
                </div>

                <div style={{
                  width: '100%',
                  animation: 'fadeUp 0.4s ease 0.4s both',
                }}
                >
                  <GameResultOtherGamesGrid currentSlug="rengi-hatirla" lang={lang} />
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 10, width: '100%', marginBottom: 24 }}>
                  {[
                    { color: target, label: t.target, hex: colorToHex(target) },
                    { color: guess, label: t.yours, hex: colorToHex(guess) },
                  ].map(({ color, label, hex }) => (
                    <div key={label} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{
                        width: '100%',
                        height: 160,
                        borderRadius: 'var(--radius-lg)',
                        background: colorToCss(color),
                        border: '0.5px solid var(--border)',
                        boxSizing: 'border-box',
                      }}
                      />
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{label}</div>
                        <div style={{
                          fontSize: 10,
                          color: 'var(--text-tertiary)',
                          marginTop: 4,
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          letterSpacing: '0.04em',
                        }}
                        >
                          {hex}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <div style={{
                    fontSize: 64,
                    fontWeight: 500,
                    letterSpacing: '-2px',
                    lineHeight: 1,
                    color: similarity != null && similarity >= 90 ? '#a8e063' : similarity != null && similarity >= 70 ? '#EF9F27' : 'var(--text-primary)',
                    animation: answerAnim === 'correct'
                      ? 'correctPulse 0.6s ease'
                      : answerAnim === 'wrong'
                        ? 'wrongShake 0.5s ease'
                        : 'none',
                  }}
                  >
                    {displayScore}%
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 10, marginBottom: 0 }}>
                    {similarity && similarity >= 90 ? t.perfect : similarity && similarity >= 70 ? t.good : t.tryAgain}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  <button
                    className="btn-press"
                    type="button"
                    onClick={nextRound}
                    style={gamePrimaryButtonStyle}
                  >
                    {t.next}
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    style={gameSecondaryButtonStyle}
                  >
                    {copied
                      ? (lang === 'tr' ? 'kopyalandı ✓' : 'copied ✓')
                      : t.share}
                  </button>
                </div>

                <div style={{
                  width: '100%',
                  borderTop: '0.5px solid var(--border)',
                  paddingTop: 20,
                  marginTop: 8,
                }}
                >
                  <GameResultOtherGamesGrid currentSlug="rengi-hatirla" lang={lang} />
                </div>
              </>
            )}
          </div>
        )}
        </div>

          </div>
        </div>
      <HowToPlayFab title={helpFabTitle} ariaLabel={helpFabAria} steps={helpFabSteps} />
    </GameLayout>
  )
}

export default function RengiHatirlaPage() {
  return (
    <Suspense fallback={(
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      >
        <div style={{
          width: 12, height: 12, borderRadius: '50%',
          background: 'conic-gradient(hsl(0,100%,60%), hsl(180,100%,60%), hsl(360,100%,60%))',
        }}
        />
      </div>
    )}
    >
      <RengiHatirlaContent />
    </Suspense>
  )
}
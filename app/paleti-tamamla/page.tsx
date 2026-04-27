  'use client'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import GameResult from '@/components/GameResult'
import NavBar from '@/components/NavBar'
import HowToPlayFab from '@/components/HowToPlayFab'
import { readStreak } from '@/lib/streak'

type Mode = 'daily' | 'endless'
type Phase = 'menu' | 'playing' | 'result'
type Difficulty = 'kolay' | 'orta' | 'zor'

interface Color { r: number; g: number; b: number }

function colorToCss(c: Color) { return `rgb(${c.r},${c.g},${c.b})` }

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function getLocalDayId() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// HSL ile renkler arası geçiş (gradient paleti)
function generateGradientPalette(count: number, seed: number): Color[] {
  const hue = Math.floor(seededRandom(seed) * 360)
  const saturation = 60 + Math.floor(seededRandom(seed + 1) * 30)
  const colors: Color[] = []

  for (let i = 0; i < count; i++) {
    const lightness = 20 + Math.floor((i / Math.max(1, count - 1)) * 60)
    const { r, g, b } = hslToRgb(hue / 360, saturation / 100, lightness / 100)
    colors.push({
      r: Math.round(255 * r),
      g: Math.round(255 * g),
      b: Math.round(255 * b),
    })
  }
  return colors
}

function hslToRgb(h: number, s: number, l: number) {
  let r: number
  let g: number
  let b: number
  if (s === 0) { r = g = b = l }
  else {
    const hue2rgb = (p: number, q: number, t: number) => {
      let tt = t
      if (tt < 0) tt += 1
      if (tt > 1) tt -= 1
      if (tt < 1 / 6) return p + (q - p) * 6 * tt
      if (tt < 1 / 2) return q
      if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return { r, g, b }
}

function getDifficultyCount(d: Difficulty) {
  return d === 'kolay' ? 3 : d === 'orta' ? 5 : 7
}

function shuffleSeeded<T>(arr: T[], seed: number): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i * 13) * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

function buildRound(seed: number, difficulty: Difficulty): {
  palette: Color[]
  emptyIndex: number
  options: Color[]
} {
  const count = getDifficultyCount(difficulty)
  const palette = generateGradientPalette(count, seed)
  const emptyIndex = Math.floor(seededRandom(seed + 100) * count)
  const correctColor = palette[emptyIndex]!

  const wrongs: Color[] = []
  for (let i = 0; i < 3; i++) {
    const offset = (i + 1) * 30
    wrongs.push({
      r: Math.min(255, Math.max(0, correctColor.r + (seededRandom(seed + i + 200) > 0.5 ? offset : -offset))),
      g: Math.min(255, Math.max(0, correctColor.g + (seededRandom(seed + i + 300) > 0.5 ? offset : -offset))),
      b: Math.min(255, Math.max(0, correctColor.b + (seededRandom(seed + i + 400) > 0.5 ? offset : -offset))),
    })
  }

  const options = shuffleSeeded([correctColor, ...wrongs], seed + 500)

  return { palette, emptyIndex, options }
}

function PaletiTamamlaContent() {
  const searchParams = useSearchParams()
  const modParam = searchParams.get('mod')

  const [lang, setLang] = useState<'tr' | 'en'>('tr')
  const [mode, setMode] = useState<Mode | null>(null)
  const [phase, setPhase] = useState<Phase>('menu')
  const [difficulty, setDifficulty] = useState<Difficulty>('orta')
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [totalRounds] = useState(5)
  const [palette, setPalette] = useState<Color[]>([])
  const [emptyIndex, setEmptyIndex] = useState(0)
  const [options, setOptions] = useState<Color[]>([])
  const [selected, setSelected] = useState<Color | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [draggedColor, setDraggedColor] = useState<Color | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [dailyPlayed, setDailyPlayed] = useState(false)
  const [dailyHydrated, setDailyHydrated] = useState(false)
  const [dailyScore, setDailyScore] = useState<number | null>(null)
  const [displayScore, setDisplayScore] = useState(0)
  const [isTouchPrimary, setIsTouchPrimary] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const phaseRef = useRef(phase)
  const pushedRef = useRef(false)

  useEffect(() => { phaseRef.current = phase }, [phase])

  useEffect(() => {
    setTimeout(() => setMounted(true), 50)
    try {
      const raw = localStorage.getItem('renkle-paleti-tamamla-daily')
      if (raw) {
        const d = JSON.parse(raw) as { dayId?: string; score?: number }
        if (d.dayId === getLocalDayId()) {
          setDailyPlayed(true)
          if (typeof d.score === 'number') setDailyScore(d.score)
        }
      }
    } catch { /* ignore */ }
    setDailyHydrated(true)
  }, [])

  // Browser back/gesture while playing -> return to menu instead of home
  useEffect(() => {
    if (phase === 'playing' && !pushedRef.current) {
      try { window.history.pushState({ renkle: 'paleti-tamamla-playing' }, '') } catch { /* ignore */ }
      pushedRef.current = true
    }
    if (phase === 'menu') pushedRef.current = false
  }, [phase])

  useEffect(() => {
    const onPop = () => {
      if (phaseRef.current !== 'playing') return
      setPhase('menu')
      setMode(null)
      setShowFeedback(false)
      setSelected(null)
      setDraggedColor(null)
      setDragOver(false)
      try { window.history.pushState({ renkle: 'paleti-tamamla-menu' }, '') } catch { /* ignore */ }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(max-width: 520px)')
    const update = () => setIsMobile(mq.matches)
    update()
    try {
      mq.addEventListener('change', update)
      return () => mq.removeEventListener('change', update)
    } catch {
      // Safari fallback
      // eslint-disable-next-line deprecation/deprecation
      mq.addListener(update)
      // eslint-disable-next-line deprecation/deprecation
      return () => mq.removeListener(update)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia('(hover: none)')
    const apply = () => setIsTouchPrimary(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  function getSeed(roundIndex: number, gameMode: Mode) {
    if (gameMode === 'daily') {
      const d = new Date()
      const base = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
      return base + roundIndex * 777
    }
    return Math.floor(Math.random() * 100000) + roundIndex * 777
  }

  function loadRound(roundIndex: number, diff: Difficulty, gameMode: Mode) {
    const seed = getSeed(roundIndex, gameMode)
    const built = buildRound(seed, diff)
    setPalette(built.palette)
    setEmptyIndex(built.emptyIndex)
    setOptions(built.options)
    setSelected(null)
    setShowFeedback(false)
    setDraggedColor(null)
    setDragOver(false)
  }

  const startGame = useCallback((m: Mode) => {
    if (m === 'daily' && dailyPlayed) return
    setMode(m)
    setLives(3)
    setScore(0)
    setRound(0)
    setPhase('playing')
    loadRound(0, difficulty, m)
  }, [dailyPlayed, difficulty])

  useEffect(() => {
    if (!dailyHydrated) return
    if (modParam !== 'gunluk') return
    if (dailyPlayed) return
    startGame('daily')
  }, [dailyHydrated, modParam, dailyPlayed, startGame])

  useEffect(() => {
    if (phase !== 'result') return
    const target = score
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
  }, [phase, score])

  function saveDailyResult(finalScore: number) {
    localStorage.setItem('renkle-paleti-tamamla-daily', JSON.stringify({
      dayId: getLocalDayId(),
      score: finalScore,
    }))
    setDailyPlayed(true)
    setDailyScore(finalScore)
  }

  function handleAnswer(color: Color) {
    if (showFeedback) return
    const correct = palette[emptyIndex]!
    const ok = color.r === correct.r
      && color.g === correct.g
      && color.b === correct.b

    setSelected(color)
    setIsCorrect(ok)
    setShowFeedback(true)

    if (ok) {
      setScore(s => s + 100)
    } else {
      const newLives = lives - 1
      setLives(newLives)
      if (newLives <= 0) {
        setTimeout(() => {
          if (mode === 'daily') saveDailyResult(score)
          setPhase('result')
        }, 1000)
        return
      }
    }

    setTimeout(() => {
      const nextRound = round + 1
      if (nextRound >= totalRounds) {
        if (mode === 'daily') saveDailyResult(ok ? score + 100 : score)
        setPhase('result')
      } else {
        setRound(nextRound)
        if (mode) loadRound(nextRound, difficulty, mode)
      }
    }, 1000)
  }

  const t = {
    tr: {
      title: 'paleti tamamla',
      desc: 'eksik rengi sürükle, doğru yere bırak',
      daily: 'günlük', endless: 'sınırsız',
      dailyDesc: '5 tur, herkes aynı palet',
      endlessDesc: 'ne kadar yüksek skor yapabilirsin?',
      dragHere: 'buraya sürükle',
      correct: 'doğru!', wrong: 'yanlış!',
      result: 'oyun bitti',
      score: 'puan', lives: 'can',
      round: 'tur', totalScore: 'toplam puan',
      again: 'tekrar oyna', menu: 'mod seç',
      kolay: 'kolay', orta: 'orta', zor: 'zor',
      alreadyPlayed: 'bugün oynadın',
      alreadyDaily: 'bugün bu modu oynadın.',
      options: 'doğru rengi seç ve sürükle',
    },
    en: {
      title: 'complete the palette',
      desc: 'drag the missing color to the right spot',
      daily: 'daily', endless: 'endless',
      dailyDesc: '5 rounds, same palettes for everyone',
      endlessDesc: 'how high can you score?',
      dragHere: 'drop here',
      correct: 'correct!', wrong: 'wrong!',
      result: 'game over',
      score: 'score', lives: 'lives',
      round: 'round', totalScore: 'total score',
      again: 'play again', menu: 'choose mode',
      kolay: 'easy', orta: 'medium', zor: 'hard',
      alreadyPlayed: 'already played today',
      alreadyDaily: 'You already played today.',
      options: 'pick the right color and drag it',
    },
  }[lang]

  const diffLabel = {
    kolay: { tr: 'kolay', en: 'easy' },
    orta: { tr: 'orta', en: 'medium' },
    zor: { tr: 'zor', en: 'hard' },
  }

  const helpIsDaily = mode === 'daily' || (!mode && modParam === 'gunluk')
  const helpFabTitle = lang === 'tr' ? 'nasıl oynanır?' : 'how to play'
  const helpFabAria = lang === 'tr' ? 'nasıl oynanır' : 'how to play'
  const helpFabSteps = helpIsDaily
    ? (lang === 'tr' ? [
        { text: 'Günlük görevde herkes aynı paletleri görür.' },
        { text: 'Alttan rengi sürükleyip boş kutuya bırak; mobilde renge dokun.' },
        { text: '3 canın ve 5 turun var.' },
        { text: 'Zorluk 3, 5 veya 7 renkli palet üretir.' },
      ] : [
        { text: 'In daily mode everyone sees the same palettes.' },
        { text: 'Drag a swatch to the empty slot; on mobile, tap a swatch.' },
        { text: 'You have 3 lives and 5 rounds.' },
        { text: 'Difficulty sets palette size: 3, 5, or 7 colors.' },
      ])
    : (lang === 'tr' ? [
        { text: 'Gradyan palette eksik rengi bul.' },
        { text: 'Masaüstünde sürükle-bırak; mobilde renge dokun.' },
        { text: '3 can; yanlışta can azalır.' },
        { text: 'Zorluk paletteki renk sayısını belirler (3 / 5 / 7).' },
      ] : [
        { text: 'Find the missing color in the gradient palette.' },
        { text: 'Drag and drop on desktop; tap a swatch on mobile.' },
        { text: 'You have 3 lives per run.' },
        { text: 'Difficulty sets how many colors are in the palette.' },
      ])

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      opacity: mounted ? 1 : 0, transition: 'opacity 0.3s ease',
    }}
    >
      <NavBar lang={lang} onLangChange={setLang} streak={readStreak()} />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px var(--page-padding)',
        maxWidth: 560, margin: '0 auto', width: '100%',
        gap: 24,
      }}
      >
        <div key={phase} style={{ width: '100%', animation: 'phaseIn 0.35s cubic-bezier(0.16,1,0.3,1)' }}>

        {phase === 'menu' && modParam === 'gunluk' && dailyHydrated && dailyPlayed && (
          <div style={{
            width: '100%', maxWidth: 440, margin: '0 auto',
            padding: 24, textAlign: 'center',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-secondary)',
          }}
          >
            <p style={{ fontSize: 15, color: 'var(--text-primary)', marginBottom: 12 }}>{t.alreadyDaily}</p>
            <Link href="/paleti-tamamla?mod=sinirsiz" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {lang === 'tr' ? 'sınırsız moda geç →' : 'try endless mode →'}
            </Link>
          </div>
        )}

        {phase === 'menu' && modParam === 'gunluk' && (!dailyHydrated || !dailyPlayed) && (
          <div style={{ minHeight: 160 }} aria-busy="true" />
        )}

        {phase === 'menu' && modParam !== 'gunluk' && (
          <div style={{ width: '100%', maxWidth: 440, margin: '0 auto' }}>
            <div style={{
              height: 160, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6, padding: '16px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)', marginBottom: 16,
            }}
            >
              {generateGradientPalette(5,
                new Date().getFullYear() * 10000
                + (new Date().getMonth() + 1) * 100
                + new Date().getDate(),
              ).map((c, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1, height: 56, borderRadius: 8,
                    background: i === 2
                      ? 'transparent'
                      : colorToCss(c),
                    border: i === 2
                      ? '2px dashed var(--border-mid)'
                      : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {i === 2 && <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-tertiary)' }}>?</span>}
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 12, textAlign: 'center' }}>
              <div style={{
                fontSize: 18, fontWeight: 500,
                color: 'var(--text-primary)',
                letterSpacing: '-0.3px', marginBottom: 4,
              }}
              >
                {t.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {t.desc}
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
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: 3,
                  border: '0.5px solid var(--border)',
                }}
                >
                  {([
                    { d: 'kolay', sub: { tr: '3 renk', en: '3 colors' } },
                    { d: 'orta', sub: { tr: '5 renk', en: '5 colors' } },
                    { d: 'zor', sub: { tr: '7 renk', en: '7 colors' } },
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
                        flex: isMobile ? 'none' : 1,
                        width: isMobile ? '100%' : undefined,
                        padding: isMobile ? '10px 12px' : '10px 0',
                        borderRadius: 9,
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: difficulty === d ? 'var(--bg-secondary)' : 'transparent',
                        border: difficulty === d
                          ? '0.5px solid var(--border-mid)'
                          : '0.5px solid transparent',
                        transition: 'all 0.15s',
                        minHeight: 56,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <div style={{
                        fontSize: 13,
                        color: difficulty === d ? 'var(--text-primary)' : 'var(--text-tertiary)',
                        fontWeight: difficulty === d ? 600 : 500,
                        letterSpacing: '-0.2px',
                        lineHeight: 1.2,
                      }}
                      >
                        {diffLabel[d][lang]}, {sub[lang]}
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
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
                >
                  <div style={{ display: 'flex', gap: 4, marginBottom: 10, justifyContent: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <svg key={i} width="16" height="16" viewBox="0 0 16 16" style={{ animation: 'heartBeat 1.8s ease infinite', animationDelay: `${i * 0.2}s` }}>
                        <path d="M8 13.5C8 13.5 1.5 9.5 1.5 5.5C1.5 3.5 3 2 5 2C6.2 2 7.2 2.6 8 3.5C8.8 2.6 9.8 2 11 2C13 2 14.5 3.5 14.5 5.5C14.5 9.5 8 13.5 8 13.5Z" fill="#E24B4A" />
                      </svg>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                    {lang === 'tr' ? '3 can hakkın' : '3 lives'}
                  </div>
                </div>
                <div style={{
                  background: 'var(--bg)',
                  borderRadius: 10,
                  padding: '14px 12px',
                  border: '0.5px solid var(--border)',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
                >
                  <div style={{ fontSize: 26, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-1px', marginBottom: 6, lineHeight: 1 }}>5</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {lang === 'tr' ? 'tur' : 'rounds'}
                  </div>
                </div>
                <div style={{
                  background: 'var(--bg)',
                  borderRadius: 10,
                  padding: '14px 12px',
                  border: '0.5px solid var(--border)',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                }}
                >
                  <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center', width: '100%' }}>
                    <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 4, background: '#EF9F27' }} />
                      <div style={{ width: 4, color: 'var(--text-tertiary)', fontSize: 10, display: 'flex', alignItems: 'center' }}>→</div>
                      <div style={{ width: 20, height: 20, borderRadius: 4, border: '1.5px dashed var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)' }}>
                        <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 700 }}>?</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {isTouchPrimary
                      ? (lang === 'tr' ? 'dokun & seç' : 'tap & pick')
                      : (lang === 'tr' ? 'sürükle & bırak' : 'drag & drop')}
                  </div>
                </div>
              </div>

              <button
                className="btn-press"
                type="button"
                onClick={() => startGame('endless')}
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

        {/* PLAYING */}
        {phase === 'playing' && (
          <div style={{
            maxWidth: isMobile ? 560 : 640,
            margin: '0 auto',
            width: '100%',
            padding: isMobile ? '22px var(--page-padding) 40px' : '40px var(--page-padding) 48px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
          >
            {/* Üst bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: i < lives ? '#E24B4A' : 'var(--bg-secondary)',
                      border: '0.5px solid var(--border)',
                    }}
                  />
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {round + 1}
                /
                {totalRounds}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{score}</div>
            </div>

            {/* Progress bar */}
            <div style={{ width: '100%', height: 3, background: 'var(--bg-secondary)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: 'var(--text-secondary)',
                width: `${((round) / totalRounds) * 100}%`,
                transition: 'width 0.3s ease',
              }}
              />
            </div>

            {/* Palet */}
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, textAlign: 'center' }}>
                {t.options}
              </div>
              <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                {palette.map((color, i) => {
                  const isEmpty = i === emptyIndex
                  const correct = palette[emptyIndex]!
                  const emptyBg = showFeedback && isEmpty
                    ? colorToCss(correct)
                    : isEmpty
                      ? (dragOver ? 'rgba(255,255,255,0.08)' : 'var(--bg-secondary)')
                      : colorToCss(color)
                  const emptyBorder = showFeedback && isEmpty
                    ? (isCorrect ? '2px solid #a8e063' : '2px solid #E24B4A')
                    : isEmpty
                      ? (dragOver
                        ? '2px dashed var(--text-secondary)'
                        : '2px dashed var(--text-tertiary)')
                      : '0.5px solid var(--border)'
                  return (
                    <div
                      key={i}
                      onDragOver={isEmpty ? (e) => { e.preventDefault(); setDragOver(true) } : undefined}
                      onDragLeave={isEmpty ? () => setDragOver(false) : undefined}
                      onDrop={isEmpty ? (e) => {
                        e.preventDefault()
                        setDragOver(false)
                        if (draggedColor) handleAnswer(draggedColor)
                      } : undefined}
                      style={{
                        flex: 1,
                        height: isMobile ? 92 : 104,
                        borderRadius: 10,
                        background: emptyBg,
                        border: emptyBorder,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s',
                        position: 'relative',
                        boxShadow: isEmpty
                          ? 'inset 0 0 0 1px rgba(255,255,255,0.10), inset 0 0 0 2px rgba(0,0,0,0.06)'
                          : undefined,
                      }}
                    >
                      {isEmpty && !showFeedback && (
                        <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-tertiary)' }}>?</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Seçenekler */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : (difficulty === 'zor' ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)'),
              gap: isMobile ? 10 : 8,
              width: '100%',
              marginTop: isMobile ? 18 : 24,
            }}
            >
              {options.map((opt, i) => {
                const isSelected = selected?.r === opt.r && selected?.g === opt.g && selected?.b === opt.b
                const correct = palette[emptyIndex]!
                const isThisCorrect = opt.r === correct.r && opt.g === correct.g && opt.b === correct.b
                const isDraggingThis = !showFeedback
                  && draggedColor?.r === opt.r
                  && draggedColor?.g === opt.g
                  && draggedColor?.b === opt.b
                let optionBorder = '0.5px solid var(--border)'
                if (showFeedback) {
                  if (isThisCorrect) optionBorder = '2px solid #a8e063'
                  else if (isSelected && !isThisCorrect) optionBorder = '2px solid #E24B4A'
                }
                return (
                  <div
                    key={i}
                    draggable={!showFeedback}
                    onDragStart={() => setDraggedColor(opt)}
                    onDragEnd={() => setDraggedColor(null)}
                    onTouchStart={(e) => e.stopPropagation()}
                    onClick={isTouchPrimary && !showFeedback ? () => handleAnswer(opt) : undefined}
                    role={isTouchPrimary ? 'button' : undefined}
                    tabIndex={isTouchPrimary && !showFeedback ? 0 : undefined}
                    onKeyDown={isTouchPrimary && !showFeedback ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleAnswer(opt)
                      }
                    } : undefined}
                    style={{
                      height: isMobile ? 92 : 104,
                      borderRadius: 10,
                      background: colorToCss(opt),
                      cursor: showFeedback ? 'default' : 'grab',
                      border: optionBorder,
                      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12), inset 0 0 0 2px rgba(0,0,0,0.06)',
                      transition: 'all 0.15s',
                      transform: isDraggingThis ? 'scale(0.95)' : 'scale(1)',
                      opacity: isDraggingThis
                        ? 0.5
                        : (showFeedback && isSelected && !isThisCorrect ? 0.5 : 1),
                    }}
                  />
                )
              })}
            </div>

            {/* Feedback */}
            {showFeedback && (
              <div style={{
                fontSize: 15, fontWeight: 500, textAlign: 'center',
                color: isCorrect ? '#a8e063' : '#E24B4A',
                animation: 'fadeIn 0.2s ease',
              }}
              >
                {isCorrect ? t.correct : t.wrong}
              </div>
            )}
          </div>
        )}

        {/* RESULT */}
        {phase === 'result' && (
          <GameResult
            lang={lang}
            score={displayScore}
            scoreLabel={t.totalScore}
            scoreColor={score >= 400 ? '#a8e063' : score >= 200 ? '#EF9F27' : 'var(--text-primary)'}
            subtitle={t.result}
            primaryAction={{
              label: t.again,
              onClick: () => startGame(mode!),
            }}
            currentSlug="paleti-tamamla"
          />
        )}
        </div>
      </div>
      <HowToPlayFab title={helpFabTitle} ariaLabel={helpFabAria} steps={helpFabSteps} />
    </div>
  )
}

export default function PaletiTamamlaPage() {
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
      <PaletiTamamlaContent />
    </Suspense>
  )
}

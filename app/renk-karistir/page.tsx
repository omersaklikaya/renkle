'use client'

import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import GameLayout from '@/components/GameLayout'
import { readStreak } from '@/lib/streak'
import { getLocalDayKey } from '@/lib/colorHistory'
import {
  gameContentWrapperStyle,
  gamePrimaryButtonStyle,
  gameSecondaryButtonStyle,
} from '@/lib/gamePageStyles'
import GameResult from '@/components/GameResult'
import HowToPlayFab from '@/components/HowToPlayFab'

const LS_RENK_DAILY = 'renkle-renk-karistir-daily'

type Phase = 'menu' | 'playing' | 'result'
type Mode = 'daily' | 'endless'

interface Color { r: number; g: number; b: number }

const PAINT_COLORS: { color: Color; name: string; name_en: string }[] = [
  { color: { r: 255, g: 0, b: 0 }, name: 'kırmızı', name_en: 'red' },
  { color: { r: 0, g: 0, b: 255 }, name: 'mavi', name_en: 'blue' },
  { color: { r: 255, g: 255, b: 0 }, name: 'sarı', name_en: 'yellow' },
  { color: { r: 255, g: 255, b: 255 }, name: 'beyaz', name_en: 'white' },
  { color: { r: 0, g: 0, b: 0 }, name: 'siyah', name_en: 'black' },
  { color: { r: 165, g: 42, b: 42 }, name: 'kahve', name_en: 'brown' },
]

// Boya karıştırma mantığı — ağırlıklı ortalama
function mixPaints(paints: Color[]): Color {
  if (paints.length === 0) return { r: 255, g: 255, b: 255 }
  const r = Math.round(paints.reduce((s, c) => s + c.r, 0) / paints.length)
  const g = Math.round(paints.reduce((s, c) => s + c.g, 0) / paints.length)
  const b = Math.round(paints.reduce((s, c) => s + c.b, 0) / paints.length)
  return { r, g, b }
}

function colorToCss(c: Color) { return `rgb(${c.r},${c.g},${c.b})` }

function calcSimilarity(a: Color, b: Color): number {
  const dist = Math.sqrt((a.r-b.r)**2 + (a.g-b.g)**2 + (a.b-b.b)**2)
  return Math.round((1 - dist / Math.sqrt(3*255**2)) * 100)
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function getDailyTarget(index: number): Color {
  const d = new Date()
  const seed = d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate()
  return {
    r: Math.floor(seededRandom(seed + index * 3) * 256),
    g: Math.floor(seededRandom(seed + index * 3 + 1) * 256),
    b: Math.floor(seededRandom(seed + index * 3 + 2) * 256),
  }
}

function getRandomTarget(): Color {
  return {
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
  }
}

function RenkKaristirContent() {
  const searchParams = useSearchParams()
  const modParam = searchParams.get('mod')

  const [lang, setLang] = useState<'tr' | 'en'>('tr')
  const [mode, setMode] = useState<Mode | null>(null)
  const [phase, setPhase] = useState<Phase>('menu')
  const [difficulty, setDifficulty] = useState<'kolay' | 'orta' | 'zor'>('orta')
  const [target, setTarget] = useState<Color>({ r: 128, g: 128, b: 128 })
  const [addedPaints, setAddedPaints] = useState<Color[]>([])
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const [totalRounds] = useState(5)
  const [roundScore, setRoundScore] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [dailyPlayed, setDailyPlayed] = useState(false)
  const [dailyHydrated, setDailyHydrated] = useState(false)
  const dailySavedRef = useRef(false)
  const [answerAnim, setAnswerAnim] = useState<'correct' | 'wrong' | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const phaseRef = useRef(phase)
  const modeRef = useRef(mode)
  const pushedRef = useRef(false)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { modeRef.current = mode }, [mode])

  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])

  // Browser back/gesture while playing -> return to menu instead of home
  useEffect(() => {
    if (phase === 'playing' && !pushedRef.current) {
      try { window.history.pushState({ renkle: 'renk-karistir-playing' }, '') } catch { /* ignore */ }
      pushedRef.current = true
    }
    if (phase === 'menu') pushedRef.current = false
  }, [phase])

  useEffect(() => {
    const onPop = () => {
      if (phaseRef.current !== 'playing') return
      // cancel leaving; show difficulty/menu screen
      setPhase('menu')
      setMode(null)
      setShowResult(false)
      setAddedPaints([])
      setRound(1)
      setScore(0)
      try { window.history.pushState({ renkle: 'renk-karistir-menu' }, '') } catch { /* ignore */ }
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
    try {
      const raw = localStorage.getItem(LS_RENK_DAILY)
      if (raw) {
        const o = JSON.parse(raw) as { d?: string; score?: number; completed?: boolean }
        if (o.d === getLocalDayKey() && o.completed) {
          setDailyPlayed(true)
        }
      }
    } catch { /* ignore */ }
    setDailyHydrated(true)
  }, [])

  const startGame = useCallback((m: Mode) => {
    if (m === 'daily' && dailyPlayed) return
    setMode(m)
    setLives(3)
    setScore(0)
    setRound(1)
    setAddedPaints([])
    setShowResult(false)
    setRoundScore(null)
    setTarget(m === 'daily' ? getDailyTarget(0) : getRandomTarget())
    setPhase('playing')
    dailySavedRef.current = false
  }, [dailyPlayed])

  useEffect(() => {
    if (!dailyHydrated) return
    if (modParam !== 'gunluk') return
    if (dailyPlayed) return
    startGame('daily')
  }, [dailyHydrated, modParam, dailyPlayed, startGame])

  useEffect(() => {
    if (phase !== 'result' || mode !== 'daily' || dailySavedRef.current) return
    dailySavedRef.current = true
    try {
      localStorage.setItem(LS_RENK_DAILY, JSON.stringify({
        d: getLocalDayKey(),
        score,
        completed: true,
      }))
      queueMicrotask(() => setDailyPlayed(true))
    } catch { /* ignore */ }
  }, [phase, mode, score])

  const maxPaints = difficulty === 'kolay' ? 2 : difficulty === 'orta' ? 3 : 4
  const mixed = mixPaints(addedPaints)

  const addPaint = (color: Color) => {
    if (addedPaints.length >= maxPaints) return
    setAddedPaints(prev => [...prev, color])
  }

  const removeLast = () => {
    setAddedPaints(prev => prev.slice(0, -1))
  }

  const handleSubmit = () => {
    const sim = calcSimilarity(mixed, target)
    setAnswerAnim(sim >= 70 ? 'correct' : 'wrong')
    setTimeout(() => setAnswerAnim(null), 600)
    setRoundScore(sim)
    setShowResult(true)

    if (sim < 70) {
      const newLives = lives - 1
      setLives(newLives)
      if (newLives <= 0) {
        setTimeout(() => setPhase('result'), 1200)
        return
      }
    } else {
      setScore(s => s + sim)
    }

    if (round >= totalRounds) {
      setTimeout(() => setPhase('result'), 1200)
    } else {
      setTimeout(() => {
        setRound(r => r + 1)
        setAddedPaints([])
        setShowResult(false)
        setRoundScore(null)
        setTarget(mode === 'daily'
          ? getDailyTarget(round)
          : getRandomTarget()
        )
      }, 1400)
    }
  }

  const t = {
    tr: {
      title: 'renk karıştır',
      desc: 'boya karıştırarak hedef rengi yarat',
      daily: 'günlük', endless: 'sınırsız',
      dailyDesc: '5 tur, herkes aynı renkler',
      endlessDesc: 'ne kadar yüksek skor yapabilirsin?',
      target: 'hedef', mixed: 'karışımın',
      submit: 'karıştır', undo: 'geri al',
      lives: 'can', score: 'puan', round: 'tur',
      result: 'oyun bitti', totalScore: 'toplam puan',
      again: 'tekrar oyna', menu: 'mod seç',
      add: 'ekle', maxReached: 'maksimum renk eklendi',
      kolay: 'kolay', orta: 'orta', zor: 'zor',
      perfect: 'mükemmel!', good: 'iyi!', bad: 'yanlış!',
      alreadyDaily: 'bugün bu modu oynadın.',
    },
    en: {
      title: 'mix colors',
      desc: 'mix paints to recreate the target color',
      daily: 'daily', endless: 'endless',
      dailyDesc: '5 rounds, same colors for everyone',
      endlessDesc: 'how high can you score?',
      target: 'target', mixed: 'your mix',
      submit: 'mix!', undo: 'undo',
      lives: 'lives', score: 'score', round: 'round',
      result: 'game over', totalScore: 'total score',
      again: 'play again', menu: 'choose mode',
      add: 'add', maxReached: 'max colors added',
      kolay: 'easy', orta: 'medium', zor: 'hard',
      perfect: 'perfect!', good: 'good!', bad: 'wrong!',
      alreadyDaily: 'You already played today.',
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
        { text: 'Her gün herkes aynı 5 hedef rengi görür.' },
        { text: 'Palleteki boyaları ekleyerek karışımını hedefe yaklaştır.' },
        { text: 'Zorluğa göre tur başına en fazla 2–4 renk ekleyebilirsin.' },
        { text: '%70 ve üzeri yakınlık turu kazandırır; 3 canın var.' },
      ] : [
        { text: 'Everyone gets the same 5 target colors each day.' },
        { text: 'Add paints from the palette to match the target mix.' },
        { text: 'Per round you can add up to 2–4 paints (by difficulty).' },
        { text: '70%+ similarity wins the round; you have 3 lives.' },
      ])
    : (lang === 'tr' ? [
        { text: 'Boyaları ekleyerek hedef rengi yaklaştır.' },
        { text: 'Karışım, seçilen renklerin ortalamasıdır.' },
        { text: '%70 üzeri başarı turu kazandırır; 5 tur oynarsın.' },
        { text: 'Canların bitince oyun biter.' },
      ] : [
        { text: 'Mix paints to get close to the target color.' },
        { text: 'Your mix is the average of the paints you picked.' },
        { text: '70%+ similarity clears a round; play 5 rounds.' },
        { text: 'The game ends when you run out of lives.' },
      ])

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
        animation: 'fadeIn 0.3s ease',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.3s ease',
        minHeight: 0,
      }}
      >
        <div style={{
          ...gameContentWrapperStyle,
          flex: 1,
          minHeight: 0,
          justifyContent: phase === 'menu' ? 'center' : 'flex-start',
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
            <Link href="/renk-karistir?mod=sinirsiz" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
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
              justifyContent: 'center', gap: 12,
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-lg)', marginBottom: 16,
            }}
            >
              {[
                { color: '#E24B4A', label: '' },
                { color: '', label: '+' },
                { color: '#378ADD', label: '' },
                { color: '', label: '=' },
                { color: '#8B3A8F', label: '' },
              ].map((item, i) => {
                if (item.color) {
                  return (
                    <div
                      key={i}
                      style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: item.color,
                      }}
                    />
                  )
                }
                return (
                  <span key={i} style={{ fontSize: 20, color: 'var(--text-tertiary)' }}>
                    {item.label}
                  </span>
                )
              })}
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
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, marginBottom: 10, height: 28, justifyContent: 'center', width: '100%' }}>
                    <div style={{ width: '70%', height: 4, background: '#1D9E75', borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {lang === 'tr' ? '%70 geçme eşiği' : '70% threshold'}
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
          <>
            {/* Üst bar */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', width: '100%',
            }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[...Array(3)].map((_, i) => (
                  <div key={i} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: i < lives ? '#E24B4A' : 'var(--bg-secondary)',
                    border: '0.5px solid var(--border)',
                  }} />
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {round}/{totalRounds}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{score}</div>
            </div>

            {/* Hedef + Karışım yan yana */}
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: 10,
              width: '100%',
              animation: answerAnim === 'correct'
                ? 'correctPulse 0.6s ease'
                : answerAnim === 'wrong'
                  ? 'wrongShake 0.5s ease'
                  : 'none',
            }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{
                  height: 120, borderRadius: 'var(--radius-lg)',
                  background: colorToCss(target),
                  border: '0.5px solid var(--border)',
                }} />
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' }}>
                  {t.target}
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{
                  height: 120, borderRadius: 'var(--radius-lg)',
                  background: addedPaints.length > 0
                    ? colorToCss(mixed)
                    : 'var(--bg-secondary)',
                  border: '0.5px solid var(--border)',
                  transition: 'background 0.2s ease',
                  position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {addedPaints.length === 0 && (
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {lang === 'tr' ? 'renk ekle' : 'add colors'}
                    </span>
                  )}
                  {showResult && roundScore !== null && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(0,0,0,0.5)',
                      borderRadius: 'var(--radius-lg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexDirection: 'column', gap: 4,
                    }}>
                      <div style={{
                        fontSize: 28, fontWeight: 500,
                        color: roundScore >= 90 ? '#a8e063'
                          : roundScore >= 70 ? '#EF9F27'
                          : '#E24B4A',
                      }}>
                        {roundScore}%
                      </div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                        {roundScore >= 90 ? t.perfect
                          : roundScore >= 70 ? t.good
                          : t.bad}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' }}>
                  {t.mixed}
                </div>
              </div>
            </div>

            {/* Eklenen boyalar */}
            <div style={{
              display: 'flex', gap: 6, width: '100%',
              minHeight: 40, flexWrap: 'wrap',
              alignItems: 'center',
            }}>
              {addedPaints.map((paint, i) => (
                <div key={i} style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: colorToCss(paint),
                  border: '0.5px solid var(--border)',
                  flexShrink: 0,
                }} />
              ))}
              {addedPaints.length < maxPaints && (
                <div style={{
                  fontSize: 10, color: 'var(--text-tertiary)',
                  marginLeft: 4,
                }}>
                  {maxPaints - addedPaints.length} {lang === 'tr' ? 'renk daha' : 'more'}
                </div>
              )}
            </div>

            {/* Renk paleti */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8, width: '100%',
            }}>
              {PAINT_COLORS.map((pc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => addPaint(pc.color)}
                  disabled={addedPaints.length >= maxPaints || showResult}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px',
                    minHeight: 44,
                    border: '0.5px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    cursor: addedPaints.length >= maxPaints ? 'not-allowed' : 'pointer',
                    opacity: addedPaints.length >= maxPaints ? 0.4 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: colorToCss(pc.color),
                    border: '0.5px solid rgba(255,255,255,0.1)',
                    flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                    {lang === 'tr' ? pc.name : pc.name_en}
                  </span>
                </button>
              ))}
            </div>

            {/* Butonlar */}
            <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 18 }}>
              <button
                type="button"
                onClick={removeLast}
                disabled={addedPaints.length === 0 || showResult}
                style={{
                  ...gameSecondaryButtonStyle,
                  width: 'auto',
                  padding: '13px 20px',
                  opacity: addedPaints.length === 0 ? 0.4 : 1,
                }}
              >
                {t.undo}
              </button>
              <button
                className="btn-press"
                type="button"
                onClick={handleSubmit}
                disabled={addedPaints.length === 0 || showResult}
                style={{
                  ...gamePrimaryButtonStyle,
                  flex: 1,
                  opacity: addedPaints.length === 0 ? 0.4 : 1,
                }}
              >
                {t.submit}
              </button>
            </div>
          </>
        )}

        {/* RESULT */}
        {phase === 'result' && (
          <GameResult
            lang={lang}
            score={score}
            scoreLabel={lang === 'tr' ? 'toplam puan' : 'total score'}
            scoreColor={
              score >= 400 ? '#a8e063'
                : score >= 200 ? '#EF9F27'
                  : 'var(--text-primary)'
            }
            subtitle={
              score >= 400
                ? (lang === 'tr' ? 'mükemmel!' : 'perfect!')
                : score >= 200
                  ? (lang === 'tr' ? 'iyi!' : 'good!')
                  : lang === 'tr' ? 'tekrar dene' : 'try again'
            }
            primaryAction={{
              label: lang === 'tr' ? 'tekrar oyna' : 'play again',
              onClick: () => startGame(mode!),
              disabled: mode === 'daily' && dailyPlayed,
            }}
            currentSlug="renk-karistir"
          />
        )}
        </div>
        </div>
      </div>
      <HowToPlayFab title={helpFabTitle} ariaLabel={helpFabAria} steps={helpFabSteps} />
    </GameLayout>
  )
}

export default function RenkKaristirPage() {
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
      <RenkKaristirContent />
    </Suspense>
  )
}

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import GameResult from '@/components/GameResult'
import GameLayout from '@/components/GameLayout'
import { readStreak } from '@/lib/streak'
import brandsTr from '@/data/brands-tr.json'
import brandsEn from '@/data/brands-en.json'

type Phase = 'menu' | 'playing' | 'result'
type Mode = 'daily' | 'endless'

interface Brand {
  name: string
  color: string
  colors?: string[]
  category: string
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return { r, g, b }
}

function colorDistance(hex1: string, hex2: string): number {
  const c1 = hexToRgb(hex1)
  const c2 = hexToRgb(hex2)
  return Math.sqrt(
    Math.pow(c1.r-c2.r,2) +
    Math.pow(c1.g-c2.g,2) +
    Math.pow(c1.b-c2.b,2)
  )
}

function seededRandom(seed: number) {
  let x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function getLocalDayId() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function getBrandColors(b: Brand): string[] {
  const raw = Array.isArray(b.colors) && b.colors.length > 0 ? b.colors : [b.color]
  return raw.slice(0, 3)
}

function getPrimaryColor(b: Brand): string {
  return getBrandColors(b)[0] ?? b.color
}

function minColorsDistance(a: Brand, b: Brand): number {
  const ca = getBrandColors(a)
  const cb = getBrandColors(b)
  let best = Number.POSITIVE_INFINITY
  for (const x of ca) {
    for (const y of cb) {
      const d = colorDistance(x, y)
      if (d < best) best = d
    }
  }
  return best
}

function generateOptions(brands: Brand[], correct: Brand, seed: number): Brand[] {
  const wrongs: Brand[] = []
  const shuffled = [...brands]
    .filter(b => b.name !== correct.name)
    .sort(() => seededRandom(seed + wrongs.length * 7) - 0.5)

  const TOO_CLOSE = 110
  const TOO_FAR = 400

  for (const brand of shuffled) {
    if (wrongs.length >= 3) break
    const dist = minColorsDistance(brand, correct)
    if (dist >= TOO_CLOSE && dist <= TOO_FAR) wrongs.push(brand)
  }

  for (const brand of shuffled) {
    if (wrongs.length >= 3) break
    if (minColorsDistance(brand, correct) < TOO_CLOSE) continue
    if (!wrongs.find(w => w.name === brand.name)) wrongs.push(brand)
  }

  return [correct, ...wrongs.slice(0,3)]
    .sort(() => seededRandom(seed + 99) - 0.5)
}

function getDailyBrands(brands: Brand[], count: number): Brand[] {
  const d = new Date()
  const seed = d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate()
  return [...brands]
    .sort((a,b) => seededRandom(seed + brands.indexOf(a)) - seededRandom(seed + brands.indexOf(b)))
    .slice(0, count)
}

function normalizeTrI(s: string) {
  return s.replaceAll('ı', 'i')
}

function normalizeBrand(b: Brand): Brand {
  return {
    ...b,
    name: normalizeTrI(b.name),
    colors: getBrandColors(b),
  }
}

function GameContent() {
  const searchParams = useSearchParams()
  void searchParams

  const [lang, setLang] = useState<'tr'|'en'>('tr')
  const [isMobile, setIsMobile] = useState(false)
  const [mode, setMode] = useState<Mode>('endless')
  const [phase, setPhase] = useState<Phase>('playing')
  const [brands, setBrands] = useState<Brand[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [options, setOptions] = useState<Brand[]>([])
  const [selected, setSelected] = useState<Brand|null>(null)
  const [score, setScore] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [mounted, setMounted] = useState(false)
  const didAutoStart = useRef(false)
  const allBrandsRef = useRef<Brand[]>([])

  const ROUNDS = 10

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 50)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const getBrands = useCallback((): Brand[] => {
    const raw = (lang === 'tr' ? brandsTr : brandsEn) as Brand[]
    return raw.map(normalizeBrand)
  }, [lang])

  const startGame = useCallback((m: Mode) => {
    const allBrands = getBrands()
    allBrandsRef.current = allBrands
    const gameBrands = m === 'daily'
      ? getDailyBrands(allBrands, ROUNDS)
      : [...allBrands].sort(() => Math.random() - 0.5).slice(0, ROUNDS)

    setBrands(gameBrands)
    setMode(m)
    setCurrentIndex(0)
    setScore(0)
    setCorrect(0)
    setSelected(null)
    setShowFeedback(false)

    const seed = m === 'daily'
      ? new Date().getFullYear() * 10000 + (new Date().getMonth()+1) * 100 + new Date().getDate()
      : Math.floor(Math.random() * 100000)

    setOptions(generateOptions(allBrands, gameBrands[0], seed))
    setPhase('playing')
  }, [lang])

  useEffect(() => {
    if (!mounted) return
    if (didAutoStart.current) return
    didAutoStart.current = true
    setMode('endless')
    startGame('endless')
  }, [mounted, startGame])

  function handleAnswer(brand: Brand) {
    if (showFeedback) return
    const currentBrand = brands[currentIndex]
    const ok = brand.name === currentBrand.name

    setSelected(brand)
    setIsCorrect(ok)
    setShowFeedback(true)

    if (ok) {
      setScore(s => s + 100)
      setCorrect(c => c + 1)
    }

    setTimeout(() => {
      const next = currentIndex + 1
      if (next >= ROUNDS) {
        const finalScore = ok ? score + 100 : score
        setPhase('result')
      } else {
        setCurrentIndex(next)
        setSelected(null)
        setShowFeedback(false)
        const allBrands = allBrandsRef.current.length ? allBrandsRef.current : getBrands()
        const seed = mode === 'daily'
          ? new Date().getFullYear() * 10000 + (new Date().getMonth()+1) * 100 + new Date().getDate() + next
          : Math.floor(Math.random() * 100000)
        setOptions(generateOptions(allBrands, brands[next], seed))
      }
    }, 1200)
  }

  const currentBrand = brands[currentIndex]

  const t = {
    tr: {
      title: 'marka rengi bil',
      desc: 'rengi gör, markayı tahmin et',
      question: 'bu renk hangi markaya ait?',
      correct: 'doğru!', wrong: 'yanlış!',
      score: 'puan', result: 'oyun bitti',
      totalScore: 'toplam puan',
      again: 'tekrar oyna',
    },
    en: {
      title: 'brand color quiz',
      desc: 'see the color, guess the brand',
      question: 'which brand uses this color?',
      correct: 'correct!', wrong: 'wrong!',
      score: 'score', result: 'game over',
      totalScore: 'total score',
      again: 'play again',
    },
  }[lang]

  return (
    <GameLayout lang={lang} onLangChange={setLang} streak={readStreak()}>
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}
      >
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center',
          justifyContent: isMobile ? 'flex-start' : 'center',
          padding: isMobile ? '18px var(--page-padding) 32px' : '32px var(--page-padding)',
          maxWidth: 520, margin: '0 auto', width: '100%',
          gap: 20,
        }}>

        {phase === 'playing' && currentBrand && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {currentIndex + 1}/{ROUNDS}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{score}</div>
            </div>

            <div style={{ width: '100%', height: 4, background: 'var(--bg-secondary)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 2,
                background: 'var(--text-secondary)',
                width: `${(currentIndex / ROUNDS) * 100}%`,
                transition: 'width 0.3s ease',
              }} />
            </div>

            <div
              style={{
                width: '100%',
                borderRadius: 'var(--radius-lg)',
                padding: 3,
                background: 'conic-gradient(from 180deg, #E50914, #EF9F27, #1DB954, #1877F2, #9146FF, #E50914)',
                animation: 'phaseIn 0.3s ease',
                boxShadow: '0 10px 30px rgba(0,0,0,0.28)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: 200,
                  borderRadius: 'calc(var(--radius-lg) - 3px)',
                  display: 'flex',
                  overflow: 'hidden',
                  border: '0.5px solid rgba(255,255,255,0.08)',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {getBrandColors(currentBrand).map((c, idx) => (
                  <div key={`${c}-${idx}`} style={{ flex: 1, background: c }} />
                ))}
              </div>
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
              {t.question}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 10 : 8, width: '100%' }}>
              {options.map((opt, i) => {
                const isSelected = selected?.name === opt.name
                const isCorrectOpt = opt.name === currentBrand.name

                let borderColor = 'var(--border)'
                let bg = 'var(--bg-secondary)'

                if (showFeedback) {
                  if (isCorrectOpt) { borderColor = '#a8e063'; bg = 'rgba(168,224,99,0.08)' }
                  else if (isSelected && !isCorrectOpt) { borderColor = '#E24B4A'; bg = 'rgba(226,75,74,0.08)' }
                }

                return (
                  <div key={i} onClick={() => handleAnswer(opt)} style={{
                    padding: isMobile ? '18px 16px' : '14px 16px',
                    minHeight: isMobile ? 56 : undefined,
                    border: `0.5px solid ${borderColor}`,
                    borderRadius: 'var(--radius-md)',
                    background: bg,
                    cursor: showFeedback ? 'default' : 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                  }}>
                    <span style={{ fontSize: isMobile ? 14 : 13, fontWeight: 500 }}>
                      {normalizeTrI(opt.name)}
                    </span>
                  </div>
                )
              })}
            </div>

            {showFeedback && (
              <div style={{
                fontSize: 14, fontWeight: 600,
                color: isCorrect ? '#a8e063' : '#E24B4A',
                textAlign: 'center',
                animation: 'fadeUp 0.3s ease',
              }}>
                {isCorrect ? t.correct : `${t.wrong} ${normalizeTrI(currentBrand.name)}`}
              </div>
            )}
          </>
        )}

        {phase === 'result' && (
          <GameResult
            lang={lang}
            score={score}
            scoreLabel={lang === 'tr' ? 'toplam puan' : 'total score'}
            scoreColor={
              score >= 800 ? '#a8e063'
              : score >= 500 ? '#EF9F27'
              : 'var(--text-primary)'
            }
            subtitle={
              score >= 800 ? (lang === 'tr' ? 'mükemmel!' : 'perfect!')
              : score >= 500 ? (lang === 'tr' ? 'iyi!' : 'good!')
              : lang === 'tr' ? 'tekrar dene' : 'try again'
            }
            topContent={
              <div style={{
                width: '100%', padding: '14px 16px',
                background: 'var(--bg-secondary)',
                borderRadius: 10, border: '0.5px solid var(--border)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 8,
              }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  {lang === 'tr' ? 'doğru cevap' : 'correct answers'}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>
                  {correct}/{ROUNDS}
                </div>
              </div>
            }
            primaryAction={{
              label: lang === 'tr' ? 'tekrar oyna' : 'play again',
              onClick: () => startGame(mode!),
            }}
            currentSlug="marka-rengi-bil"
          />
        )}
        </div>
      </div>
    </GameLayout>
  )
}

export default function MarkaRengiBil() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'conic-gradient(hsl(0,100%,60%), hsl(180,100%,60%), hsl(360,100%,60%))' }} />
      </div>
    }>
      <GameContent />
    </Suspense>
  )
}


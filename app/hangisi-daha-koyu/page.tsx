'use client'

import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import GameLayout from '@/components/GameLayout'
import { readStreak } from '@/lib/streak'
import { getLocalDayKey } from '@/lib/colorHistory'
import { gameContentWrapperStyle } from '@/lib/gamePageStyles'
import GameResult from '@/components/GameResult'
import HowToPlayFab from '@/components/HowToPlayFab'

const LS_HANGISI_DAILY = 'renkle-hangisi-daily'

type Phase = 'menu' | 'playing' | 'result'
type Mode = 'daily' | 'endless'

interface Color {
  r: number; g: number; b: number
}

function colorToCss(c: Color) { return `rgb(${c.r},${c.g},${c.b})` }

function getBrightness(c: Color) {
  return 0.299 * c.r + 0.587 * c.g + 0.114 * c.b
}

function randomColor(): Color {
  return {
    r: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    b: Math.floor(Math.random() * 256),
  }
}

function generatePair(difficulty: 'kolay' | 'orta' | 'zor'): [Color, Color] {
  const minDiff = difficulty === 'kolay' ? 80 : difficulty === 'orta' ? 40 : 15
  const maxDiff = difficulty === 'kolay' ? 255 : difficulty === 'orta' ? 120 : 45

  let a: Color, b: Color, diff: number
  do {
    a = randomColor()
    b = randomColor()
    diff = Math.abs(getBrightness(a) - getBrightness(b))
  } while (diff < minDiff || diff > maxDiff)

  return [a, b]
}

function getDailySeed() {
  const d = new Date()
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function getDailyPairs(): [Color, Color][] {
  const seed = getDailySeed()
  const pairs: [Color, Color][] = []
  let attempt = 0
  while (pairs.length < 10) {
    const r1 = Math.floor(seededRandom(seed + attempt * 6) * 256)
    const g1 = Math.floor(seededRandom(seed + attempt * 6 + 1) * 256)
    const b1 = Math.floor(seededRandom(seed + attempt * 6 + 2) * 256)
    const r2 = Math.floor(seededRandom(seed + attempt * 6 + 3) * 256)
    const g2 = Math.floor(seededRandom(seed + attempt * 6 + 4) * 256)
    const b2 = Math.floor(seededRandom(seed + attempt * 6 + 5) * 256)
    const c1 = { r: r1, g: g1, b: b1 }
    const c2 = { r: r2, g: g2, b: b2 }
    const diff = Math.abs(getBrightness(c1) - getBrightness(c2))
    if (diff >= 30) pairs.push([c1, c2])
    attempt++
  }
  return pairs
}

function HangisiDahaKoyuContent() {
  const searchParams = useSearchParams()
  const modParam = searchParams.get('mod')

  const [lang, setLang] = useState<'tr' | 'en'>('tr')
  const [mode, setMode] = useState<Mode | null>(null)
  const [phase, setPhase] = useState<Phase>('menu')
  const [difficulty, setDifficulty] = useState<'kolay' | 'orta' | 'zor'>('orta')
  const [pairs, setPairs] = useState<[Color, Color][]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [questionStart, setQuestionStart] = useState(0)
  const [lastPoints, setLastPoints] = useState<number | null>(null)
  const [showPoints, setShowPoints] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [wrongColor, setWrongColor] = useState<'left' | 'right' | null>(null)
  const [mounted, setMounted] = useState(false)
  const [dailyPlayed, setDailyPlayed] = useState(false)
  const [dailyHydrated, setDailyHydrated] = useState(false)
  const dailySavedRef = useRef(false)
  const [lives, setLives] = useState(3)
  const [answerAnim, setAnswerAnim] = useState<'correct' | 'wrong' | null>(null)

  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])

  const startGame = useCallback((m: Mode) => {
    if (m === 'daily' && dailyPlayed) return
    setMode(m)
    setScore(0)
    setStreak(0)
    setCurrentIndex(0)
    setGameOver(false)
    setWrongColor(null)
    setLastPoints(null)
    setLives(3)

    if (m === 'daily') {
      setPairs(getDailyPairs())
    } else {
      const newPairs: [Color, Color][] = []
      for (let i = 0; i < 100; i++) {
        newPairs.push(generatePair(difficulty))
      }
      setPairs(newPairs)
    }

    setPhase('playing')
    setQuestionStart(Date.now())
  }, [dailyPlayed, difficulty])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_HANGISI_DAILY)
      if (raw) {
        const o = JSON.parse(raw) as { d?: string; score?: number; completed?: boolean }
        if (o.d === getLocalDayKey() && o.completed) {
          setDailyPlayed(true)
        }
      }
    } catch { /* ignore */ }
    setDailyHydrated(true)
  }, [])

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
      localStorage.setItem(LS_HANGISI_DAILY, JSON.stringify({
        d: getLocalDayKey(),
        score,
        completed: true,
      }))
      queueMicrotask(() => setDailyPlayed(true))
    } catch { /* ignore */ }
  }, [phase, mode, score])

  const currentPair = pairs[currentIndex]

  const handleChoice = (choice: 'left' | 'right') => {
    if (!currentPair || gameOver) return

    const [left, right] = currentPair
    const leftBrightness = getBrightness(left)
    const rightBrightness = getBrightness(right)
    const correctChoice = leftBrightness < rightBrightness ? 'left' : 'right'

    // eslint-disable-next-line react-hooks/purity -- tıklama anı
    const elapsed = (Date.now() - questionStart) / 1000
    const timeBonus = Math.max(0, Math.floor((3 - elapsed) * 10))
    const basePoints = 100
    const points = basePoints + timeBonus

    if (choice === correctChoice) {
      setAnswerAnim('correct')
      setTimeout(() => setAnswerAnim(null), 600)
      setScore(s => s + points)
      setStreak(s => {
        const newStreak = s + 1
        if (newStreak > bestStreak) setBestStreak(newStreak)
        return newStreak
      })
      setLastPoints(points)
      setShowPoints(true)
      setTimeout(() => setShowPoints(false), 800)

      if (mode === 'daily' && currentIndex >= 9) {
        setPhase('result')
        return
      }

      setCurrentIndex(i => i + 1)
      // eslint-disable-next-line react-hooks/purity -- soru başlangıcı
      setQuestionStart(Date.now())
    } else {
      setAnswerAnim('wrong')
      setTimeout(() => setAnswerAnim(null), 600)
      setWrongColor(choice)
      setTimeout(() => {
        setWrongColor(null)
        setLives((prev) => {
          const n = prev - 1
          if (n <= 0) {
            queueMicrotask(() => {
              setGameOver(true)
              setPhase('result')
            })
          }
          return n
        })
      }, 600)
    }
  }

  const t = {
    tr: {
      title: 'hangisi daha koyu?',
      desc: 'iki rengi karşılaştır, hızlı karar ver',
      daily: 'günlük', endless: 'sınırsız',
      dailyDesc: '10 soru, herkes aynı renkler',
      endlessDesc: 'ne kadar uzun tutabilirsin?',
      question: 'hangisi daha koyu?',
      score: 'puan', streak: 'seri', best: 'en iyi seri', lives: 'can',
      result: 'oyun bitti', totalScore: 'toplam puan',
      again: 'tekrar oyna', menu: 'mod seç',
      kolay: 'kolay', orta: 'orta', zor: 'zor',
      correct: 'doğru!', wrong: 'yanlış',
      dailyComplete: 'günlük tamamlandı!',
      alreadyDaily: 'bugün bu modu oynadın.',
    },
    en: {
      title: 'which is darker?',
      desc: 'compare two colors, decide fast',
      daily: 'daily', endless: 'endless',
      dailyDesc: '10 questions, same colors for everyone',
      endlessDesc: 'how long can you last?',
      question: 'which is darker?',
      score: 'score', streak: 'streak', best: 'best streak', lives: 'lives',
      result: 'game over', totalScore: 'total score',
      again: 'play again', menu: 'choose mode',
      kolay: 'easy', orta: 'medium', zor: 'hard',
      correct: 'correct!', wrong: 'wrong',
      dailyComplete: 'daily complete!',
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
        { text: 'Günlük görevde herkes aynı 10 soruyu görür.' },
        { text: 'İki kutudan daha koyu olanı seç; 3 can hakkın var.' },
        { text: 'Hızlı cevap bonus puan kazandırır.' },
        { text: '10 soruyu bitir veya canların bitince skorunu gör.' },
      ] : [
        { text: 'In daily mode everyone gets the same 10 questions.' },
        { text: 'Tap the darker swatch; you have 3 lives.' },
        { text: 'Answering fast earns bonus points.' },
        { text: 'Finish all 10 or end when you run out of lives.' },
      ])
    : (lang === 'tr' ? [
        { text: 'İki renkten daha koyu olanı seç.' },
        { text: '3 canın var; yanlışta can azalır, sıfırda oyun biter.' },
        { text: 'Hızlı seçim ekstra puan verir.' },
        { text: 'Zorluk seviyesi renklerin birbirine yakınlığını değiştirir.' },
      ] : [
        { text: 'Choose which of the two colors is darker.' },
        { text: 'You have 3 lives; a wrong answer costs one.' },
        { text: 'Quick answers give extra points.' },
        { text: 'Difficulty changes how close the colors are.' },
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
            <Link href="/hangisi-daha-koyu?mod=sinirsiz" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
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
              height: 160, display: 'flex', overflow: 'hidden',
              borderRadius: 'var(--radius-lg)', marginBottom: 16,
            }}
            >
              {['#1a1a2e', '#4a4a6a', '#8a8aaa', '#cacae0'].map((c, i) => (
                <div key={i} style={{ flex: 1, background: c }} />
              ))}
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
                  <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
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
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, marginBottom: 10, height: 28 }}>
                    {[40, 65, 100].map((h, i) => (
                      <div key={i} style={{ width: 7, borderRadius: 2, background: '#EF9F27', height: `${h}%` }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {lang === 'tr' ? 'hızlı = bonus puan' : 'fast = bonus pts'}
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
        {phase === 'playing' && currentPair && (
          <>
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', width: '100%',
            }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t.question}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: i < lives ? '#E24B4A' : 'var(--bg-secondary)',
                        border: '0.5px solid var(--border)',
                      }}
                    />
                  ))}
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 4 }}>{t.lives}</span>
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 500 }}>{score}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{t.score}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 500 }}>{streak}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{t.streak}</div>
                  </div>
                </div>
              </div>
            </div>

            {mode === 'daily' && (
              <div style={{
                width: '100%', height: 3,
                background: 'var(--bg-secondary)',
                borderRadius: 2, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 2,
                  background: 'var(--text-secondary)',
                  width: `${(currentIndex / 10) * 100}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            )}

            <div style={{
              display: 'flex', gap: 12, width: '100%', position: 'relative',
              animation: answerAnim === 'correct'
                ? 'correctPulse 0.6s ease'
                : answerAnim === 'wrong'
                  ? 'wrongShake 0.5s ease'
                  : 'none',
            }}>
              {showPoints && (
                <div style={{
                  position: 'absolute', top: -32, right: 0,
                  fontSize: 14, fontWeight: 500, color: '#639922',
                  animation: 'hangisiPointsBonus 0.8s ease forwards',
                }}>
                  +{lastPoints}
                </div>
              )}
              {(['left', 'right'] as const).map((side) => {
                const color = side === 'left' ? currentPair[0] : currentPair[1]
                const isWrong = wrongColor === side
                return (
                  <div
                    key={side}
                    onClick={() => handleChoice(side)}
                    style={{
                      flex: 1, height: 260, borderRadius: 'var(--radius-lg)',
                      background: colorToCss(color),
                      cursor: gameOver ? 'default' : 'pointer',
                      border: isWrong
                        ? '3px solid #E24B4A'
                        : '0.5px solid rgba(255,255,255,0.1)',
                      transition: 'transform 0.15s ease, border 0.15s',
                      transform: isWrong ? 'scale(0.97)' : 'scale(1)',
                    }}
                  />
                )
              })}
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
              score >= 800 ? '#a8e063'
                : score >= 400 ? '#EF9F27'
                  : 'var(--text-primary)'
            }
            subtitle={
              score >= 800
                ? (lang === 'tr' ? 'mükemmel!' : 'perfect!')
                : score >= 400
                  ? (lang === 'tr' ? 'iyi!' : 'good!')
                  : lang === 'tr' ? 'tekrar dene' : 'try again'
            }
            topContent={(
              <div style={{
                display: 'flex', gap: 10,
                width: '100%', marginBottom: 8,
              }}
              >
                {[
                  { val: streak, lbl: lang === 'tr' ? 'seri' : 'streak' },
                  { val: bestStreak, lbl: lang === 'tr' ? 'en iyi seri' : 'best streak' },
                ].map(({ val, lbl }) => (
                  <div key={lbl} style={{
                    flex: 1, padding: '16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 10,
                    border: '0.5px solid var(--border)',
                    textAlign: 'center',
                  }}
                  >
                    <div style={{
                      fontSize: 28, fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: 4,
                    }}
                    >
                      {val}
                    </div>
                    <div style={{
                      fontSize: 11,
                      color: 'var(--text-tertiary)',
                    }}
                    >
                      {lbl}
                    </div>
                  </div>
                ))}
              </div>
            )}
            primaryAction={{
              label: lang === 'tr' ? 'tekrar oyna' : 'play again',
              onClick: () => startGame(mode!),
              disabled: mode === 'daily' && dailyPlayed,
            }}
            secondaryAction={{
              label: lang === 'tr' ? 'paylaş' : 'share',
              onClick: () => {
                const text = lang === 'tr'
                  ? `renkle — hangisi daha koyu?\n${score} puan · ${streak} seri\nrenkle.vercel.app`
                  : `renkle — which is darker?\n${score} pts · ${streak} streak\nrenkle.vercel.app`
                void navigator.clipboard.writeText(text)
              },
            }}
            currentSlug="hangisi-daha-koyu"
          />
        )}
        </div>
        </div>
      </div>
      <HowToPlayFab title={helpFabTitle} ariaLabel={helpFabAria} steps={helpFabSteps} />
    </GameLayout>
  )
}

export default function HangisiDahaKoyuPage() {
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
      <HangisiDahaKoyuContent />
    </Suspense>
  )
}

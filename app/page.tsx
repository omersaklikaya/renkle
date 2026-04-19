'use client'

import { useEffect, useState } from 'react'
import NavBar from '@/components/NavBar'
import GameCard from '@/components/GameCard'
import { games, Lang } from '@/lib/games'
import { LS_RENGI_DAILY, readRengiDailyStreak } from '@/lib/rengiDailyStreak'

export default function Home() {
  const [lang, setLang] = useState<Lang>('tr')
  const [dailyStreak, setDailyStreak] = useState(0)

  useEffect(() => {
    const sync = () => setDailyStreak(readRengiDailyStreak())
    sync()
    const onStorage = (e: StorageEvent) => {
      if (e.key === LS_RENGI_DAILY || e.key === null) sync()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', sync)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', sync)
    }
  }, [])

  const today = new Date()
  const dateStr = today.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <NavBar lang={lang} onLangChange={setLang} streak={dailyStreak} />

      <div style={{ padding: 'var(--hero-padding)', textAlign: 'center' }}>
        <div style={{
          fontSize: 11,
          color: 'var(--text-tertiary)',
          letterSpacing: '0.08em',
          marginBottom: 8
        }}>
          {dateStr}
        </div>
        <h1 style={{
          fontSize: 24,
          fontWeight: 500,
          letterSpacing: '-0.4px',
          marginBottom: 8
        }}>
          {lang === 'tr' ? 'Bugünün renk bulmacaları' : "Today's color puzzles"}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {lang === 'tr'
            ? 'Her gün yeni bulmacalar. Oyna, öğren, paylaş.'
            : 'New puzzles every day. Play, learn, share.'}
        </p>
      </div>

      <div
        className="home-game-grid"
        style={{
          padding: '0 var(--page-padding) var(--page-padding)',
        }}
      >
        {games.map((game) => (
          <GameCard
            key={game.slug}
            slug={game.slug}
            title={game.title[lang]}
            description={game.description[lang]}
            swatchColors={game.swatchColors}
            tag={game.tag}
            lang={lang}
            locked={game.locked}
          />
        ))}
      </div>
    </div>
  )
}
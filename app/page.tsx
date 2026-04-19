'use client'

import { useState } from 'react'
import NavBar from '@/components/NavBar'
import GameCard from '@/components/GameCard'
import StatsBar from '@/components/StatsBar'
import { games, Lang } from '@/lib/games'

export default function Home() {
  const [lang, setLang] = useState<Lang>('tr')

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
      <NavBar lang={lang} onLangChange={setLang} streak={7} />

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

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 10,
        padding: '0 var(--page-padding) var(--page-padding)',
        alignItems: 'start',
      }}>
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

      <div style={{ marginTop: 'auto' }}>
        <StatsBar
          played={3}
          total={games.filter(g => !g.locked).length}
          avgScore={84}
          lang={lang}
          onShare={() => alert(lang === 'tr' ? 'Yakında!' : 'Coming soon!')}
        />
      </div>
    </div>
  )
}
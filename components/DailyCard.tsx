'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Game, Lang } from '@/lib/games'
import { LS_RENGI_DAILY } from '@/lib/rengiDailyStreak'
import { getLocalDayId } from '@/lib/streak'

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

interface DailyCardProps {
  game: Game
  lang: Lang
  isMobile?: boolean
}

export default function DailyCard({ game, lang, isMobile }: DailyCardProps) {
  const [countdown, setCountdown] = useState(getTimeUntilMidnight)
  const [playedToday, setPlayedToday] = useState(false)
  const [todayScore, setTodayScore] = useState<number | null>(null)

  useEffect(() => {
    const id = setInterval(() => setCountdown(getTimeUntilMidnight()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (game.slug !== 'rengi-hatirla') return
    try {
      const raw = localStorage.getItem(LS_RENGI_DAILY)
      if (!raw) return
      const d = JSON.parse(raw) as { d?: string; s?: number }
      const today = getLocalDayId()
      if (d.d === today && typeof d.s === 'number') {
        setPlayedToday(true)
        setTodayScore(d.s)
      }
    } catch { /* ignore */ }
  }, [game.slug])

  const today = new Date()
  const seed = today.getFullYear() * 10000
    + (today.getMonth() + 1) * 100
    + today.getDate()

  const pseudo = (n: number) => {
    const x = Math.sin(n) * 10000
    return x - Math.floor(x)
  }
  const r = Math.floor(pseudo(seed) * 256)
  const g = Math.floor(pseudo(seed + 1) * 256)
  const b = Math.floor(pseudo(seed + 2) * 256)
  const dailyColor = `rgb(${r},${g},${b})`

  const minH = isMobile ? 240 : 320

  return (
    <Link
      href={`/${game.slug}`}
      style={{
        textDecoration: 'none',
        color: 'inherit',
        display: 'block',
        height: '100%',
      }}
    >
      <div
        style={{
          position: 'relative',
          borderRadius: 16,
          overflow: 'hidden',
          border: '0.5px solid rgba(255,255,255,0.1)',
          minHeight: minH,
          height: '100%',
          cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.22)'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.1)'
        }}
      >
        <div style={{
          position: 'absolute',
          inset: 0,
          background: dailyColor,
          filter: playedToday && game.slug === 'rengi-hatirla' ? 'none' : 'blur(32px)',
          transform: playedToday && game.slug === 'rengi-hatirla' ? 'none' : 'scale(1.1)',
        }}
        />

        <div style={{
          position: 'absolute',
          inset: 0,
          background: playedToday && game.slug === 'rengi-hatirla'
            ? 'rgba(0,0,0,0.22)'
            : 'rgba(0,0,0,0.38)',
        }}
        />

        <div style={{
          position: 'relative',
          height: '100%',
          minHeight: minH,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 22,
        }}
        >
          <div>
            <div style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.45)',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
            >
              {lang === 'tr' ? 'günlük' : 'daily'}
            </div>
            <div style={{
              fontSize: 20,
              fontWeight: 500,
              color: '#fff',
              letterSpacing: '-0.3px',
              marginBottom: 4,
            }}
            >
              {game.title[lang]}
            </div>
            <div style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.5,
            }}
            >
              {game.description[lang]}
            </div>
          </div>

          <div style={{ margin: '20px 0', position: 'relative', minHeight: 72 }}>
            {playedToday && game.slug === 'rengi-hatirla' ? (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: dailyColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 4,
                borderRadius: 10,
                border: '0.5px solid rgba(255,255,255,0.12)',
              }}
              >
                <div style={{ fontSize: 36, fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
                  {todayScore}%
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  {lang === 'tr' ? 'bugün oynadın' : 'played today'}
                  {' '}
                  ✓
                </div>
              </div>
            ) : (
              <>
                <div style={{
                  fontSize: 10,
                  color: 'rgba(255,255,255,0.35)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
                >
                  {lang === 'tr' ? 'bugünün rengi' : "today's color"}
                </div>
                <div style={{
                  height: 72,
                  borderRadius: 10,
                  background: dailyColor,
                  filter: 'blur(10px)',
                  transform: 'scale(0.98)',
                  border: '0.5px solid rgba(255,255,255,0.12)',
                }}
                />
              </>
            )}
          </div>

          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              marginBottom: 12,
            }}
            >
              <div style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: '#a8e063',
              }}
              />
              <span style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.4)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
              }}
              >
                {lang === 'tr' ? 'yeni renge' : 'next color'}
                {' '}
                —
                {' '}
                {countdown}
              </span>
            </div>
            <div style={{
              height: 42,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.12)',
              border: '0.5px solid rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            >
              <span style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.9)',
              }}
              >
                {lang === 'tr' ? 'oyna' : 'play'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

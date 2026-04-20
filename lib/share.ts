export function generateShareText(
  game: 'rengi-hatirla' | 'hangisi-daha-koyu' | 'renk-karistir',
  mode: 'daily' | 'endless',
  score: number | null,
  extra: {
    streak?: number
    rounds?: number
    lang: 'tr' | 'en'
  },
): string {
  const { lang, streak, rounds } = extra
  const date = new Date().toLocaleDateString(
    lang === 'tr' ? 'tr-TR' : 'en-US',
    { day: 'numeric', month: 'long' },
  )

  const emoji = score != null
    ? (score >= 90 ? '🟢' : score >= 70 ? '🟡' : '🔴')
    : '⚪'

  const gameNames = {
    'rengi-hatirla': { tr: 'rengi hatırla', en: 'color memory' },
    'hangisi-daha-koyu': { tr: 'hangisi daha koyu', en: 'which is darker' },
    'renk-karistir': { tr: 'renk karıştır', en: 'mix colors' },
  }

  const gameName = gameNames[game][lang]
  const modeLabel = mode === 'daily'
    ? (lang === 'tr' ? 'günlük' : 'daily')
    : (lang === 'tr' ? 'sınırsız' : 'endless')

  const scoreStr = score != null ? String(score) : '—'

  if (game === 'rengi-hatirla') {
    return lang === 'tr'
      ? `renkle — ${gameName}\n${emoji} ${modeLabel} · ${scoreStr}% doğruluk${streak ? ` · ${streak} günlük seri` : ''}\n${date}\nrenkle.vercel.app`
      : `renkle — ${gameName}\n${emoji} ${modeLabel} · ${scoreStr}% accuracy${streak ? ` · ${streak} day streak` : ''}\n${date}\nrenkle.vercel.app`
  }

  if (game === 'hangisi-daha-koyu') {
    return lang === 'tr'
      ? `renkle — ${gameName}\n${emoji} ${modeLabel} · ${scoreStr} puan${streak ? ` · ${streak} seri` : ''}\n${date}\nrenkle.vercel.app`
      : `renkle — ${gameName}\n${emoji} ${modeLabel} · ${scoreStr} pts${streak ? ` · ${streak} streak` : ''}\n${date}\nrenkle.vercel.app`
  }

  return lang === 'tr'
    ? `renkle — ${gameName}\n${emoji} ${modeLabel} · ${scoreStr} puan · ${rounds ?? 0} tur\n${date}\nrenkle.vercel.app`
    : `renkle — ${gameName}\n${emoji} ${modeLabel} · ${scoreStr} pts · ${rounds ?? 0} rounds\n${date}\nrenkle.vercel.app`
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

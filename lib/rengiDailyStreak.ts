/** Günlük mod kaydı — `app/rengi-hatirla/page.tsx` ile aynı anahtar. */
export const LS_RENGI_DAILY = 'renkle-rengi-hatirla-daily'

export function dayKey(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Takvim günü farkı (aynı gün → 0). */
export function calendarDaysBetween(earlierKey: string, laterKey: string): number {
  const [y1, m1, d1] = earlierKey.split('-').map(Number)
  const [y2, m2, d2] = laterKey.split('-').map(Number)
  const a = Date.UTC(y1, m1 - 1, d1)
  const b = Date.UTC(y2, m2 - 1, d2)
  return Math.round((b - a) / 86400000)
}

export function displayDailyStreakFromSaved(
  parsed: { d?: string; s?: number; streak?: number; streakDay?: string },
  today: string,
): number {
  const streak = typeof parsed.streak === 'number' ? parsed.streak : 0
  const streakDay = parsed.streakDay ?? parsed.d
  if (!streakDay) return 0
  const gap = calendarDaysBetween(streakDay, today)
  if (gap >= 2) return 0
  return streak
}

/** Ana sayfa / navbar için günlük seri (0 = yok veya kopmuş). */
export function readRengiDailyStreak(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = window.localStorage.getItem(LS_RENGI_DAILY)
    if (!raw) return 0
    const parsed = JSON.parse(raw) as { d?: string; s?: number; streak?: number; streakDay?: string }
    return displayDailyStreakFromSaved(parsed, dayKey())
  } catch {
    return 0
  }
}

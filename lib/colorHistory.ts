export interface DailyRecord {
  date: string
  colorHex: string
  score: number | null
  played: boolean
}

/** Yerel takvim günü YYYY-MM-DD (UTC midnight ile karışmaz). */
export function getLocalDayKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function saveDailyResult(colorHex: string, score: number) {
  if (typeof window === 'undefined') return
  const key = 'renkle_history'
  const today = getLocalDayKey()
  const existing = JSON.parse(localStorage.getItem(key) || '{}') as Record<string, DailyRecord>
  existing[today] = { date: today, colorHex, score, played: true }
  localStorage.setItem(key, JSON.stringify(existing))
}

export function getHistory(): Record<string, DailyRecord> {
  if (typeof window === 'undefined') return {}
  const key = 'renkle_history'
  return JSON.parse(localStorage.getItem(key) || '{}') as Record<string, DailyRecord>
}

export function getLast30Days(): string[] {
  const dates: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setHours(12, 0, 0, 0)
    d.setDate(d.getDate() - i)
    dates.push(getLocalDayKey(d))
  }
  return dates
}

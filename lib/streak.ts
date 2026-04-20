export const STREAK_KEY = 'renkle-daily-streak-v1'

export interface StreakData {
  lastDayId: string
  streak: number
}

export function getLocalDayId(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function calendarDaysBetween(a: string, b: string): number {
  const da = new Date(`${a}T12:00:00`)
  const db = new Date(`${b}T12:00:00`)
  return Math.round((db.getTime() - da.getTime()) / 86400000)
}

export function readStreak(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    if (!raw) return 0
    const data = JSON.parse(raw) as StreakData
    const today = getLocalDayId()
    const diff = calendarDaysBetween(data.lastDayId, today)
    if (diff === 0 || diff === 1) return data.streak
    return 0
  } catch {
    return 0
  }
}

export function incrementStreak(): number {
  if (typeof window === 'undefined') return 0
  try {
    const today = getLocalDayId()
    const raw = localStorage.getItem(STREAK_KEY)
    let newStreak = 1

    if (raw) {
      const data = JSON.parse(raw) as StreakData
      const diff = calendarDaysBetween(data.lastDayId, today)
      if (diff === 0) return data.streak
      if (diff === 1) newStreak = data.streak + 1
    }

    localStorage.setItem(STREAK_KEY, JSON.stringify({
      lastDayId: today,
      streak: newStreak,
    }))
    return newStreak
  } catch {
    return 0
  }
}

/** Seri (streak) için alev — emoji değil, vektör (Heroicons fire outline uyarlaması). */
export default function StreakFlameIcon({
  muted,
  height = 18,
}: {
  muted: boolean
  /** Piksel; genişlik 16:18 oranında hesaplanır. */
  height?: number
}) {
  const w = Math.max(12, Math.round((height * 16) / 18))
  return (
    <svg
      width={w}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ flexShrink: 0, display: 'block', opacity: muted ? 0.42 : 1 }}
    >
      <path
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"
      />
      <path
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.89-3.224A3.75 3.75 0 0 0 12 18Z"
      />
    </svg>
  )
}

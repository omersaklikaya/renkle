import Link from 'next/link'

interface GameCardProps {
  slug: string
  title: string
  description: string
  swatchColors: string[]
  locked?: boolean
}

export default function GameCard({
  slug,
  title,
  description,
  swatchColors,
  locked,
}: GameCardProps) {
  const card = (
    <div
      style={{
        height: '100%',
        minHeight: '100%',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        background: 'var(--bg-secondary)',
        opacity: locked ? 0.35 : 1,
        cursor: locked ? 'default' : 'pointer',
        transition: 'transform 0.2s ease, border-color 0.2s ease',
        overflow: 'hidden',
        pointerEvents: locked ? 'none' : undefined,
      }}
      onMouseEnter={(e) => {
        if (!locked) {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = 'var(--border-mid)'
          el.style.background = 'var(--bg-tertiary)'
          el.style.transform = 'translateY(-3px)'
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'var(--border)'
        el.style.background = 'var(--bg-secondary)'
        el.style.transform = 'translateY(0)'
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 100,
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
        }}
      >
        {swatchColors.map((color, i) => (
          <div key={i} style={{ flex: 1, height: '100%', background: color, borderRadius: 0 }} />
        ))}
      </div>

      <div
        style={{
          padding: '12px 14px 14px',
          height: 72,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 500 }}>{title}</div>
        <div style={{
          fontSize: 10,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          marginTop: 3,
        }}
        >
          {description}
        </div>
      </div>
    </div>
  )

  if (locked) return card
  return (
    <Link
      href={`/${slug}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}
    >
      {card}
    </Link>
  )
}

import Link from 'next/link'

interface GameCardProps {
  slug: string
  title: string
  description: string
  swatchColors: string[]
  tag: 'daily' | 'new' | 'soon' | 'played'
  lang: 'tr' | 'en'
  locked?: boolean
}

const tagStyles = {
  daily: { background: '#EAF3DE', color: '#3B6D11', label: { tr: 'oyna', en: 'play' } },
  new: { background: '#EEEDFE', color: '#534AB7', label: { tr: 'yeni', en: 'new' } },
  soon: { background: '#f0ede8', color: '#8a8880', label: { tr: 'yakında', en: 'soon' } },
  played: { background: '#f0ede8', color: '#8a8880', label: { tr: 'oynadın', en: 'played' } },
}

export default function GameCard({
  slug, title, description, swatchColors, tag, lang, locked
}: GameCardProps) {
  const t = tagStyles[tag]

  const card = (
    <div
      style={{
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        background: 'var(--bg-secondary)',
        opacity: locked ? 0.45 : 1,
        cursor: locked ? 'default' : 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => {
        if (!locked) {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-mid)'
          ;(e.currentTarget as HTMLDivElement).style.background = 'var(--bg-tertiary)'
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
        ;(e.currentTarget as HTMLDivElement).style.background = 'var(--bg-secondary)'
      }}
    >
      <div style={{
        height: 'var(--swatch-height)',
        borderRadius: 8,
        display: 'flex',
        gap: 4,
        overflow: 'hidden',
      }}>
        {swatchColors.map((color, i) => (
          <div key={i} style={{ flex: 1, background: color, borderRadius: 6 }} />
        ))}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{description}</div>
      </div>

      <div style={{
        fontSize: 11,
        padding: '3px 10px',
        borderRadius: 20,
        width: 'fit-content',
        background: t.background,
        color: t.color,
      }}>
        {t.label[lang]}
      </div>
    </div>
  )

  if (locked || tag === 'soon') return card
  return (
    <Link href={`/${slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      {card}
    </Link>
  )
}
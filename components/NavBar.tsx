'use client'

interface NavBarProps {
  lang: 'tr' | 'en'
  onLangChange: (lang: 'tr' | 'en') => void
  streak: number
}

export default function NavBar({ lang, onLangChange, streak }: NavBarProps) {
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 48px',
      borderBottom: '0.5px solid var(--border)',
      background: 'var(--bg)',
      animation: 'fadeUp 0.4s ease 0s both',
    }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: 'conic-gradient(hsl(0,100%,60%), hsl(60,100%,60%), hsl(120,100%,60%), hsl(180,100%,60%), hsl(240,100%,60%), hsl(300,100%,60%), hsl(360,100%,60%))',
          boxShadow: '0 0 6px 1px rgba(255,255,255,0.15)',
          flexShrink: 0,
        }}
        />
        <span style={{ fontSize: 17, fontWeight: 500, letterSpacing: '-0.3px' }}>
          renkle
        </span>
      </div>

      {streak > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <span style={{
            fontSize: 22,
            fontWeight: 500,
            letterSpacing: '-0.3px',
            animation: 'rollDown 0.5s cubic-bezier(0.16,1,0.3,1) 0.3s both',
          }}
          >
            {streak}
          </span>
          <span style={{
            fontSize: 10,
            color: 'var(--text-tertiary)',
            letterSpacing: '0.06em',
          }}
          >
            {lang === 'tr' ? 'günlük seri' : 'day streak'}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          display: 'flex',
          border: '0.5px solid var(--border)',
          borderRadius: 20,
          overflow: 'hidden',
        }}
        >
          {(['tr', 'en'] as const).map(l => (
            <button
              key={l}
              type="button"
              onClick={() => onLangChange(l)}
              style={{
                padding: '5px 12px',
                fontSize: 12,
                border: 'none',
                background: lang === l ? 'var(--bg-secondary)' : 'transparent',
                color: lang === l ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: lang === l ? 500 : 400,
                transition: 'all 0.15s',
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}

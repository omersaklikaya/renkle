interface StatsBarProps {
    played: number
    total: number
    avgScore: number
    lang: 'tr' | 'en'
    onShare: () => void
  }
  
  export default function StatsBar({ played, total, avgScore, lang, onShare }: StatsBarProps) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--nav-padding)',
        borderTop: '0.5px solid var(--border)',
        background: 'var(--bg)',
      }}>
        <div style={{ display: 'flex', gap: 28 }}>
          {[
            { val: `${played}/${total}`, lbl: lang === 'tr' ? 'bugün' : 'today' },
            { val: `${avgScore}%`, lbl: lang === 'tr' ? 'ort. başarı' : 'avg. score' },
          ].map(({ val, lbl }) => (
            <div key={lbl}>
              <div style={{ fontSize: 16, fontWeight: 500 }}>{val}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{lbl}</div>
            </div>
          ))}
        </div>
  
        <button
          onClick={onShare}
          style={{
            fontSize: 13,
            padding: '8px 20px',
            border: '0.5px solid var(--border-mid)',
            borderRadius: 20,
            color: 'var(--text-primary)',
            background: 'transparent',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {lang === 'tr' ? 'sonuçları paylaş' : 'share results'}
        </button>
      </div>
    )
  }
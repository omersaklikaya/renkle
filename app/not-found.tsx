import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      fontFamily: 'var(--font)',
    }}
    >
      <div style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: 'conic-gradient(hsl(0,100%,60%), hsl(90,100%,60%), hsl(180,100%,60%), hsl(270,100%,60%), hsl(360,100%,60%))',
        opacity: 0.5,
      }}
      />
      <div style={{
        fontSize: 18,
        fontWeight: 600,
        color: 'var(--text-primary)',
        letterSpacing: '-0.3px',
      }}
      >
        sayfa bulunamadı
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
        aradığın sayfa mevcut değil
      </div>
      <Link
        href="/"
        style={{
          marginTop: 8,
          padding: '10px 24px',
          fontSize: 13,
          fontWeight: 500,
          border: '0.5px solid var(--border-mid)',
          borderRadius: 24,
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          textDecoration: 'none',
        }}
      >
        ana sayfaya dön
      </Link>
    </div>
  )
}

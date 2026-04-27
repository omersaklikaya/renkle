'use client'

import { useEffect, useState } from 'react'

const LINK_STYLE: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-tertiary)',
  textDecoration: 'none',
  transition: 'color 0.15s',
}

export default function SiteFooter() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <footer
      style={{
        borderTop: '0.5px solid var(--border)',
        padding: isMobile ? '20px' : '24px 48px',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 12 : undefined,
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: isMobile ? 'flex-start' : 'space-between',
        background: 'var(--bg)',
        marginTop: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background:
              'conic-gradient(hsl(0,100%,60%), hsl(60,100%,60%), hsl(120,100%,60%), hsl(180,100%,60%), hsl(240,100%,60%), hsl(300,100%,60%), hsl(360,100%,60%))',
          }}
        />
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-tertiary)',
            letterSpacing: '-0.2px',
          }}
        >
          renkle
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <a
          href="https://github.com/omersaklikaya"
          target="_blank"
          rel="noopener noreferrer"
          style={LINK_STYLE}
          onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-tertiary)'}
        >
          github / omersaklikaya
        </a>
        <a
          href="https://github.com/burakcolay"
          target="_blank"
          rel="noopener noreferrer"
          style={LINK_STYLE}
          onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-tertiary)'}
        >
          github / burakcolay
        </a>
        <a
          href="https://omersaklikaya.com"
          target="_blank"
          rel="noopener noreferrer"
          style={LINK_STYLE}
          onMouseEnter={(e) => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-tertiary)'}
        >
          portfolio
        </a>
      </div>
    </footer>
  )
}


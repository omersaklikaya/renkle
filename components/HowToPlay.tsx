'use client'

interface Step {
  text: string
}

interface HowToPlayProps {
  title: string
  steps: Step[]
  onClose: () => void
}

export default function HowToPlay({ title, steps, onClose }: HowToPlayProps) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '0.5px solid var(--border)',
          padding: '28px 24px',
          maxWidth: 360,
          width: '90%',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 500 }}>{title}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'var(--bg-tertiary)',
                  border: '0.5px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                {i + 1}
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {step.text}
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '11px 0',
            fontSize: 13,
            fontWeight: 500,
            border: '0.5px solid var(--border-mid)',
            borderRadius: 24,
            background: 'var(--bg)',
            color: 'var(--text-primary)',
            marginTop: 4,
          }}
        >
          {title.includes('nasıl') ? 'anladım' : 'got it'}
        </button>
      </div>
    </div>
  )
}

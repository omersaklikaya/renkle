'use client'

import { useState } from 'react'
import HowToPlay from '@/components/HowToPlay'

interface HowToPlayFabProps {
  title: string
  steps: { text: string }[]
  ariaLabel: string
}

export default function HowToPlayFab({ title, steps, ariaLabel }: HowToPlayFabProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && (
        <HowToPlay title={title} steps={steps} onClose={() => setOpen(false)} />
      )}
      <button
        type="button"
        className="btn-press"
        aria-label={ariaLabel}
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 'max(24px, env(safe-area-inset-bottom, 0px))',
          transform: 'translateX(-50%)',
          zIndex: 40,
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '0.5px solid var(--border-mid)',
          background: 'color-mix(in srgb, var(--bg-secondary) 55%, transparent)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color: 'var(--text-secondary)',
          fontSize: 17,
          fontWeight: 500,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px color-mix(in srgb, var(--text-primary) 8%, transparent)',
        }}
      >
        ?
      </button>
    </>
  )
}

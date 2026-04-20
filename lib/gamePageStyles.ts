import type { CSSProperties } from 'react'

/** Oyun sayfaları ortak içerik alanı */
export const gameContentWrapperStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px var(--page-padding)',
  maxWidth: 560,
  margin: '0 auto',
  width: '100%',
  gap: 24,
}

export const gamePrimaryButtonStyle: CSSProperties = {
  padding: '13px 0',
  fontSize: 14,
  fontWeight: 500,
  border: '0.5px solid var(--border-mid)',
  borderRadius: 24,
  background: 'var(--bg-secondary)',
  color: 'var(--text-primary)',
  width: '100%',
  cursor: 'pointer',
  transition: 'background 0.15s',
}

export const gameSecondaryButtonStyle: CSSProperties = {
  padding: '13px 0',
  fontSize: 14,
  border: '0.5px solid var(--border)',
  borderRadius: 24,
  background: 'transparent',
  color: 'var(--text-secondary)',
  width: '100%',
  cursor: 'pointer',
}

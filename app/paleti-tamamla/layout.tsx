import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Paleti Tamamla — Renkle',
  description: 'Eksik rengi sürükle, paleti tamamla.',
}

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}

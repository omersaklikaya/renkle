import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Hangisi Daha Koyu? — Renkle',
  description: 'İki rengi karşılaştır, hangisinin daha koyu olduğunu bul.',
}

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}

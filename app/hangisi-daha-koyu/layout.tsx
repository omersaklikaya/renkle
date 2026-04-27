import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'hangisi daha koyu? — renkle',
  description: 'iki rengi karşılaştır, hangisinin daha koyu olduğunu bul.',
}

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}

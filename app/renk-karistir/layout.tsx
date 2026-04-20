import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Renk Karıştır — Renkle',
  description: 'Boya mantığıyla renkleri karıştır, hedef rengi yarat.',
}

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}

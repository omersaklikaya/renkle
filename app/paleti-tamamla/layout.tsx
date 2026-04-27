import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'paleti tamamla — renkle',
  description: 'eksik rengi sürükle, paleti tamamla.',
}

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}

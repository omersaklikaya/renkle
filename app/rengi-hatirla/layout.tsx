import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Rengi Hatırla — Renkle',
  description: 'Rengi gör, ezberle, yeniden yarat.',
}

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}

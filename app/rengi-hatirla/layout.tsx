import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'rengi hatırla — renkle',
  description: 'rengi gör, ezberle, yeniden yarat.',
}

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}

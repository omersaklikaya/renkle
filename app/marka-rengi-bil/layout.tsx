import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'marka rengi bil — renkle',
  description: 'rengi gör, markayı tahmin et.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}


import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'renkle — günlük renk bulmacaları',
  description: 'her gün yeni renk bulmacaları. oyna, öğren, paylaş.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  )
}
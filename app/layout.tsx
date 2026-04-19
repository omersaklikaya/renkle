import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { SiteThemeProvider } from '@/components/SiteThemeProvider'
import ThemeBootScript from '@/components/ThemeBootScript'
import { SITE_THEME_ICONS } from '@/lib/siteTheme'

export const metadata: Metadata = {
  title: 'renkle — günlük renk bulmacaları',
  description: 'her gün yeni renk bulmacaları. oyna, öğren, paylaş.',
  icons: {
    icon: [
      { url: SITE_THEME_ICONS.light, type: 'image/x-icon' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="tr" data-theme="light" suppressHydrationWarning>
      <head>
        <ThemeBootScript />
      </head>
      <body>
        <SiteThemeProvider>{children}</SiteThemeProvider>
      </body>
    </html>
  )
}
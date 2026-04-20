import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import SplashScreen from '@/components/SplashScreen'
import { SiteThemeProvider } from '@/components/SiteThemeProvider'
import ThemeBootScript from '@/components/ThemeBootScript'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://renkle.vercel.app'),
  title: 'renkle — günlük renk bulmacaları',
  description: 'her gün yeni renk bulmacaları. oyna, öğren, paylaş.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="tr" data-theme="light" suppressHydrationWarning className={dmSans.variable}>
      <head>
        <ThemeBootScript />
      </head>
      <body className={dmSans.variable}>
        <SplashScreen />
        <SiteThemeProvider>{children}</SiteThemeProvider>
      </body>
    </html>
  )
}
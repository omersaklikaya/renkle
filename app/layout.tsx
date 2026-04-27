import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import SplashScreen from '@/components/SplashScreen'
import { SiteThemeProvider } from '@/components/SiteThemeProvider'
import ThemeBootScript from '@/components/ThemeBootScript'
import SiteFooter from '@/components/SiteFooter'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://renkle.vercel.app'),
  title: 'renkle — günlük renk bulmacaları',
  description: 'her gün yeni renk bulmacaları. oyna, öğren, kopyala.',
  icons: {
    icon: [
      { url: '/icons/lightmode.ico', type: 'image/x-icon' },
      { url: '/icons/darkmode.ico', type: 'image/x-icon', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/icons/lightmode.ico',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
      <body
        className={dmSans.variable}
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <SplashScreen />
        <SiteThemeProvider>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {children}
            <SiteFooter />
          </div>
        </SiteThemeProvider>
      </body>
    </html>
  )
}
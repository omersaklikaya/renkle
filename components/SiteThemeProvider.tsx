'use client'

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useSyncExternalStore,
} from 'react'
import {
  applySiteThemeToDocument,
  commitSiteThemeFromPreference,
  getSiteThemeSyncSnapshot,
  subscribeSiteTheme,
  toggleSiteThemePreference,
  type SiteTheme,
  type SiteThemePreference,
} from '@/lib/siteTheme'

type SiteThemeContextValue = {
  theme: SiteTheme
  preference: SiteThemePreference
  setTheme: (t: SiteTheme) => void
  toggleTheme: () => void
}

const SiteThemeContext = createContext<SiteThemeContextValue | null>(null)

function parseSnapshot(s: string): { preference: SiteThemePreference; theme: SiteTheme } {
  const i = s.indexOf('|')
  if (i < 1) {
    return { preference: 'system', theme: 'light' }
  }
  const pref = s.slice(0, i) as SiteThemePreference
  const th = s.slice(i + 1) as SiteTheme
  const preference: SiteThemePreference =
    pref === 'light' || pref === 'dark' || pref === 'system' ? pref : 'system'
  const theme: SiteTheme = th === 'dark' ? 'dark' : 'light'
  return { preference, theme }
}

export function SiteThemeProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(
    subscribeSiteTheme,
    getSiteThemeSyncSnapshot,
    () => 'system|light',
  )
  const { preference, theme } = parseSnapshot(snapshot)

  useLayoutEffect(() => {
    applySiteThemeToDocument(theme)
  }, [theme])

  const setTheme = useCallback((t: SiteTheme) => {
    commitSiteThemeFromPreference(t)
  }, [])

  const toggleTheme = useCallback(() => {
    toggleSiteThemePreference()
  }, [])

  const value = useMemo(
    () => ({ theme, preference, setTheme, toggleTheme }),
    [theme, preference, setTheme, toggleTheme],
  )

  return <SiteThemeContext.Provider value={value}>{children}</SiteThemeContext.Provider>
}

export function useSiteTheme() {
  const ctx = useContext(SiteThemeContext)
  if (!ctx) {
    throw new Error('useSiteTheme must be used within <SiteThemeProvider>')
  }
  return ctx
}

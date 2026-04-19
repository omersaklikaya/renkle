export type SiteTheme = 'light' | 'dark'

/** `system` = cihaz; `light` / `dark` = elle kilitli. */
export type SiteThemePreference = 'system' | 'light' | 'dark'

export const SITE_THEME_STORAGE_KEY = 'renkle-theme'

export const SITE_THEME_ICONS: Record<SiteTheme, string> = {
  light: '/icons/lightmode.ico',
  dark: '/icons/darkmode.ico',
}

const THEME_EVENT = 'renkle:theme'

type ThemeListener = () => void
const themeListeners = new Set<ThemeListener>()

function notifySiteThemeSubscribers() {
  for (const l of themeListeners) l()
}

export function subscribeSiteTheme(listener: ThemeListener) {
  if (typeof window === 'undefined') return () => {}
  themeListeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === SITE_THEME_STORAGE_KEY || e.key === null) listener()
  }
  const onCustom = () => listener()
  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  const onMql = () => listener()
  window.addEventListener('storage', onStorage)
  window.addEventListener(THEME_EVENT, onCustom as EventListener)
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onMql)
  } else {
    mql.addListener(onMql)
  }
  return () => {
    themeListeners.delete(listener)
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(THEME_EVENT, onCustom as EventListener)
    if (typeof mql.removeEventListener === 'function') {
      mql.removeEventListener('change', onMql)
    } else {
      mql.removeListener(onMql)
    }
  }
}

/** Kayıtlı tercih; anahtar yoksa sistem modu. */
export function readSiteThemePreference(): SiteThemePreference {
  if (typeof window === 'undefined') return 'system'
  try {
    const raw = window.localStorage.getItem(SITE_THEME_STORAGE_KEY)
    if (raw === 'light' || raw === 'dark') return raw
    if (raw === 'system') return 'system'
  } catch {
    /* ignore */
  }
  return 'system'
}

export function getPreferredSiteTheme(): SiteTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** DOM / ikon için gerçek tema. */
export function getEffectiveSiteTheme(): SiteTheme {
  const pref = readSiteThemePreference()
  if (pref === 'light' || pref === 'dark') return pref
  return getPreferredSiteTheme()
}

/** React useSyncExternalStore için tek anlık görüntü (çift store yarışını önler). */
export function getSiteThemeSyncSnapshot(): string {
  return `${readSiteThemePreference()}|${getEffectiveSiteTheme()}`
}

export function applySiteThemeToDocument(theme: SiteTheme) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme

  const href = SITE_THEME_ICONS[theme]
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"][data-renkle-icon]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    link.setAttribute('data-renkle-icon', 'true')
    document.head.appendChild(link)
  }
  link.href = href
}

export function writeSiteThemePreference(pref: SiteThemePreference) {
  if (typeof window === 'undefined') return
  try {
    if (pref === 'system') {
      window.localStorage.removeItem(SITE_THEME_STORAGE_KEY)
    } else {
      window.localStorage.setItem(SITE_THEME_STORAGE_KEY, pref)
    }
  } catch {
    /* ignore */
  }
}

export function commitSiteThemeFromPreference(pref: SiteThemePreference) {
  writeSiteThemePreference(pref)
  const next = getEffectiveSiteTheme()
  applySiteThemeToDocument(next)
  /* Bazı tarayıcılarda ilk etkileşimde CSS geçişinin kaçmaması için layout zorlanır */
  if (typeof document !== 'undefined') {
    void document.documentElement.offsetHeight
  }
  try {
    window.dispatchEvent(new Event(THEME_EVENT))
  } catch {
    /* ignore */
  }
  notifySiteThemeSubscribers()
  queueMicrotask(() => notifySiteThemeSubscribers())
}

/** Sistem modundaysa zıt moda kilit; açık ↔ koyu; koyudan sonra tekrar sistem. */
export function toggleSiteThemePreference() {
  const pref = readSiteThemePreference()
  const eff = getEffectiveSiteTheme()
  if (pref === 'system') {
    commitSiteThemeFromPreference(eff === 'dark' ? 'light' : 'dark')
  } else if (pref === 'light') {
    commitSiteThemeFromPreference('dark')
  } else {
    /* pref === 'dark': normalde sistem. OS da koyuysa etkin tema değişmez (ilk tık “boşa”). */
    const sys = getPreferredSiteTheme()
    commitSiteThemeFromPreference(sys === 'dark' ? 'light' : 'system')
  }
}

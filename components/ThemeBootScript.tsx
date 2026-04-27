'use client'

import { SITE_THEME_ICONS, SITE_THEME_STORAGE_KEY, type SiteTheme } from '@/lib/siteTheme'

const boot = `
(function () {
  try {
    var raw = localStorage.getItem(${JSON.stringify(SITE_THEME_STORAGE_KEY)});
    var pref = (raw === 'light' || raw === 'dark' || raw === 'system') ? raw : 'system';
    var theme;
    if (pref === 'system') {
      theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      theme = pref;
    }
    document.documentElement.dataset.theme = theme;

    var href = (theme === 'dark' ? ${JSON.stringify(SITE_THEME_ICONS.dark)} : ${JSON.stringify(SITE_THEME_ICONS.light)}) + '?theme=' + theme;
    var link = document.querySelector('link[rel="icon"][data-renkle-icon]') || document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.setAttribute('data-renkle-icon', 'true');
    link.href = href;
  } catch (e) {
    document.documentElement.dataset.theme = ${JSON.stringify('light' satisfies SiteTheme)};
  }
})();
`.trim()

export default function ThemeBootScript() {
  return (
    <script
      id="renkle-theme-boot"
      dangerouslySetInnerHTML={{ __html: boot }}
    />
  )
}

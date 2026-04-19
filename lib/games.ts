export type Lang = 'tr' | 'en'

export interface Game {
  slug: string
  title: Record<Lang, string>
  description: Record<Lang, string>
  swatchColors: string[]
  tag: 'daily' | 'new' | 'soon' | 'played'
  locked?: boolean
}

export const games: Game[] = [
  {
    slug: 'rengi-hatirla',
    title: { tr: 'rengi hatırla', en: 'color memory' },
    description: { tr: 'Rengi gör, ezberle, yeniden yarat', en: 'See the color, memorize it, recreate it' },
    swatchColors: ['#7F77DD'],
    tag: 'daily',
  },
  {
    slug: 'hangisi-daha-koyu',
    title: { tr: 'hangisi daha koyu?', en: 'which is darker?' },
    description: { tr: 'İki rengi karşılaştır, hızlı karar ver', en: 'Compare two colors, decide fast' },
    swatchColors: ['#E24B4A', '#888780', '#1D9E75', '#BA7517'],
    tag: 'new',
  },
  {
    slug: 'renk-karistir',
    title: { tr: 'renk karıştır', en: 'mix colors' },
    description: { tr: 'Boya mantığıyla renk teorisi', en: 'Color theory with paint logic' },
    swatchColors: ['#E24B4A', '#1D9E75'],
    tag: 'new',
  },
  {
    slug: 'paleti-tamamla',
    title: { tr: 'paleti tamamla', en: 'complete the palette' },
    description: { tr: 'Eksik rengi bul', en: 'Find the missing color' },
    swatchColors: ['#EF9F27', '#BA7517', '#412402'],
    tag: 'new',
  },
  {
    slug: 'marka-rengi-bil',
    title: { tr: 'marka rengi bil', en: 'brand color quiz' },
    description: { tr: 'Bu renk hangi markaya ait?', en: 'Which brand owns this color?' },
    swatchColors: ['#D3D1C7', '#F1EFE8'],
    tag: 'soon',
    locked: true,
  },
  {
    slug: 'gradient-sirala',
    title: { tr: 'gradient sırala', en: 'sort the gradient' },
    description: { tr: 'Açıktan koyuya sürükle sırala', en: 'Drag to sort light to dark' },
    swatchColors: ['#5DCAA5', '#1D9E75', '#0F6E56'],
    tag: 'soon',
    locked: true,
  },
]
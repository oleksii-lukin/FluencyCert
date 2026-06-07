const WEIGHT_NAMES: Record<string, string> = {
  '100': 'Thin',
  '200': 'ExtraLight',
  '300': 'Light',
  '400': 'Regular',
  '500': 'Medium',
  '600': 'SemiBold',
  '700': 'Bold',
  '800': 'ExtraBold',
  '900': 'Black',
}

interface VariantEntry {
  key: string
  label: string
}

interface GroupedVariants {
  normal: VariantEntry[]
  italic: VariantEntry[]
}

const WEIGHT_ORDER = ['100', '200', '300', '400', '500', '600', '700', '800', '900']

export function groupVariants(variants: string[]): GroupedVariants {
  const normal: (VariantEntry & { sortKey: string })[] = []
  const italic: (VariantEntry & { sortKey: string })[] = []

  for (const v of variants) {
    if (v === 'regular') {
      normal.push({ key: v, label: 'Regular', sortKey: '400' })
    } else if (v === 'italic') {
      italic.push({ key: v, label: 'Regular Italic', sortKey: '400' })
    } else {
      const match = v.match(/^(\d{3})(italic)?$/)
      if (match) {
        const weight = match[1]
        const isItalic = match[2] === 'italic'
        const name = WEIGHT_NAMES[weight]
        if (name) {
          if (isItalic) {
            italic.push({ key: v, label: `${name} Italic`, sortKey: weight })
          } else {
            normal.push({ key: v, label: name, sortKey: weight })
          }
        }
      }
    }
  }

  const sortByWeight = (a: typeof normal[0], b: typeof normal[0]) =>
    WEIGHT_ORDER.indexOf(a.sortKey) - WEIGHT_ORDER.indexOf(b.sortKey)

  return {
    normal: normal.sort(sortByWeight).map(({ key, label }) => ({ key, label })),
    italic: italic.sort(sortByWeight).map(({ key, label }) => ({ key, label })),
  }
}

export function parseFontFilename(filename: string): { family: string; variant: string } {
  const withoutExt = filename.replace(/\.ttf$/i, '')

  const variantMatch = withoutExt.match(/^(.+)-(\d{3}(?:italic)?)$/)
  if (variantMatch) return { family: variantMatch[1], variant: variantMatch[2] }

  const italicMatch = withoutExt.match(/^(.+)-italic$/)
  if (italicMatch) return { family: italicMatch[1], variant: 'italic' }

  return { family: withoutExt, variant: 'regular' }
}

export interface FontVariantEntry {
  key: string
  variant: string
  name: string
  size: number
}

export interface FontFamilyGroup {
  family: string
  variants: FontVariantEntry[]
  totalSize: number
}

export function groupUploadedFonts(fonts: { key: string; name: string; size?: number }[]): FontFamilyGroup[] {
  const groups = new Map<string, FontVariantEntry[]>()

  for (const font of fonts) {
    const { family, variant } = parseFontFilename(font.name)
    const entry: FontVariantEntry = { key: font.key, variant, name: font.name, size: font.size ?? 0 }
    const existing = groups.get(family)
    if (existing) {
      existing.push(entry)
    } else {
      groups.set(family, [entry])
    }
  }

  const result: FontFamilyGroup[] = []
  for (const [family, variants] of groups) {
    const sorted = sortUploadedVariants(variants)
    const totalSize = sorted.reduce((sum, v) => sum + v.size, 0)
    result.push({ family, variants: sorted, totalSize })
  }

  result.sort((a, b) => a.family.localeCompare(b.family))
  return result
}

function sortUploadedVariants(variants: FontVariantEntry[]): FontVariantEntry[] {
  const order = ['regular', '100', '200', '300', '400', '500', '600', '700', '800', '900', 'italic', '100italic', '200italic', '300italic', '400italic', '500italic', '600italic', '700italic', '800italic', '900italic']
  return variants.toSorted((a, b) => {
    const ai = order.indexOf(a.variant)
    const bi = order.indexOf(b.variant)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return a.variant.localeCompare(b.variant)
  })
}

export type DateFormat = 'usa' | 'gb' | 'locale'
export type LevelFormat = 'short' | 'text' | 'long'

export function formatDate(isoString: string, format: DateFormat | null, locale?: string): string {
  const date = new Date(isoString)
  if (isNaN(date.getTime())) return isoString

  switch (format) {
    case 'gb':
      return date.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })
    case 'locale':
      return date.toLocaleDateString(locale || 'en', { year: 'numeric', month: 'long', day: 'numeric' })
    case 'usa':
    default:
      return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
  }
}

function parseEnglishLevel(level: string): { code: string; text: string } | null {
  const match = level.match(/^([A-Z]\d)\s*\((.+)\)$/)
  if (match) return { code: match[1], text: match[2] }
  const simple = level.trim()
  if (['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(simple)) return { code: simple, text: simple }
  return null
}

const LEVEL_MAP: Record<string, string> = {
  'A1': 'Beginner',
  'A2': 'Elementary',
  'B1': 'Intermediate',
  'B2': 'Upper-Intermediate',
  'C1': 'Advanced',
  'C2': 'Proficient',
}

export function formatEnglishLevel(level: string, format: LevelFormat | null): string {
  const parsed = parseEnglishLevel(level)

  if (!parsed) {
    switch (format) {
      case 'short': return level
      case 'text': return level
      case 'long': return level
      default: return level
    }
  }

  const text = LEVEL_MAP[parsed.code] || parsed.text

  switch (format) {
    case 'text':
      return text
    case 'long':
      return `${parsed.code} - ${text}`
    case 'short':
    default:
      return parsed.code
  }
}

export function getPreviewDate(format: DateFormat | null, locale?: string): string {
  const preview = '2026-12-12T00:00:00.000Z'
  return formatDate(preview, format, locale)
}

export function getPreviewLevel(format: LevelFormat | null): string {
  return formatEnglishLevel('C1 (Advanced)', format)
}

/** Formatting helpers — everything the UI renders from domain data. */

export function formatCitationCount(count: number | undefined): string {
  if (count === undefined || count === null) return '—'
  return new Intl.NumberFormat('en-US', {
    notation: count >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(count)
}

export function formatYear(date: string | undefined, year?: number): string | null {
  if (year) return String(year)
  if (!date) return null
  const match = date.match(/^(\d{4})/)
  return match ? match[1] : date
}

/** "2024-05-13" → "13 May 2024"; "2024-05" → "May 2024"; year-only stays. */
export function formatPublicationDate(
  date: string | undefined,
  year?: number,
): string | null {
  if (date) {
    if (/^\d{4}$/.test(date)) return date
    if (/^\d{4}-\d{2}$/.test(date)) {
      const [y, m] = date.split('-')
      const month = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString(
        'en-GB',
        { month: 'short', timeZone: 'UTC' },
      )
      return `${month} ${y}`
    }
    const d = new Date(`${date}T00:00:00Z`)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    }
  }
  return formatYear(date, year)
}

/** DOI "https://doi.org/10.1234/abc" → "10.1234/abc". */
export function doiSuffix(doi: string | undefined): string | null {
  if (!doi) return null
  const i = doi.indexOf('10.')
  if (i === -1) return doi
  return doi.slice(i)
}

/** OpenAlex id "https://openalex.org/W121" → "W121". */
export function idSuffix(id: string | undefined): string | null {
  if (!id) return null
  const last = id.split('/').filter(Boolean).at(-1)
  return last ?? id
}

export function formatPageCount(papers: number): string {
  return `${papers} ${papers === 1 ? 'result' : 'results'}`
}

export function listAuthors(authors: Array<{ name: string }>, max = 6): string {
  if (authors.length === 0) return 'Anonymous'
  const names = authors.slice(0, max).map((a) => a.name)
  const rest = authors.length - names.length
  if (rest > 0) {
    return `${names.join(', ')}${rest === 1 ? ', et al.' : `, et al. (${rest})`}`
  }
  return names.join(', ')
}

export const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  zh: 'Chinese',
  ja: 'Japanese',
  ru: 'Russian',
  pt: 'Portuguese',
  it: 'Italian',
  ar: 'Arabic',
  ko: 'Korean',
  tr: 'Turkish',
  nl: 'Dutch',
  sv: 'Swedish',
  pl: 'Polish',
  uk: 'Ukrainian',
}

export function formatSourceLabel(source: string): string {
  switch (source) {
    case 'openalex':
      return 'OpenAlex'
    case 'europepmc':
      return 'Europe PMC'
    case 'crossref':
      return 'Crossref'
    case 'mock':
      return 'Mock'
    default:
      return source
  }
}
import type { Author, Paper } from '@/domain/papers'
import type { CrossrefAuthor, CrossrefWork } from './types'

export function normalizeCrossrefAuthor(raw: CrossrefAuthor): Author {
  const name =
    [raw.given, raw.family].filter(Boolean).join(' ') ||
    raw.name ||
    'Unknown author'

  const orcid = raw.ORCID
    ? raw.ORCID.replace(/^https?:\/\/orcid\.org\//i, '')
    : undefined

  return {
    name,
    orcid,
  }
}

/**
 * Strips JATS XML tags (e.g. `<jats:p>`, `<jats:sec>`, `<jats:title>`) commonly
 * returned in Crossref abstract fields, leaving plain text.
 */
export function stripJatsTags(xml?: string): string | undefined {
  if (!xml) return undefined
  const clean = xml
    .replace(/<\/?[^>]+(>|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return clean || undefined
}

export function normalizeCrossrefWork(raw: CrossrefWork): Paper {
  const title = raw.title?.[0] || 'Untitled work'
  const authors = (raw.author ?? []).map(normalizeCrossrefAuthor)
  const venue = raw['container-title']?.[0]

  // Date parts: [[YYYY, MM, DD]]
  const dateParts =
    raw.published?.['date-parts']?.[0] ||
    raw['published-print']?.['date-parts']?.[0] ||
    raw['published-online']?.['date-parts']?.[0] ||
    raw.issued?.['date-parts']?.[0]

  const publicationYear = dateParts?.[0]
  const publicationDate = dateParts
    ? dateParts.map((n) => String(n).padStart(2, '0')).join('-')
    : undefined

  // Landing / DOI URL
  const landingPageUrl =
    raw.resource?.primary?.URL ||
    raw.URL ||
    (raw.DOI ? `https://doi.org/${raw.DOI}` : undefined)

  // PDF link if supplied by publisher in links
  const pdfLink = raw.link?.find((l) => l['content-type'] === 'application/pdf')?.URL

  return {
    id: raw.DOI,
    doi: raw.DOI,
    title,
    abstract: stripJatsTags(raw.abstract),
    authors,
    publicationYear,
    publicationDate,
    venue,
    biblio: {
      volume: raw.volume,
      issue: raw.issue,
      firstPage: raw.page || raw['article-number'],
    },
    type: raw.type?.replace(/-/g, ' ') || 'article',
    citationCount: typeof raw['is-referenced-by-count'] === 'number'
      ? raw['is-referenced-by-count']
      : 0,
    topics: raw.subject ?? [],
    language: 'en',
    isOpenAccess: false,
    pdfUrl: pdfLink,
    landingPageUrl,
    source: 'crossref',
    indexedIn: ['crossref'],
  }
}

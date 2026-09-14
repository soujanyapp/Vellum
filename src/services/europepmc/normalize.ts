import type { Author, Paper } from '@/domain/papers'
import type { EuropePmcAuthor, EuropePmcResponse, EuropePmcWork } from './types'

export function normalizeAuthor(raw: EuropePmcAuthor): Author {
  const name =
    raw.fullName ||
    [raw.firstName, raw.lastName].filter(Boolean).join(' ') ||
    'Unknown author'

  const orcid =
    raw.authorId?.type === 'ORCID' ? raw.authorId.value : undefined

  return {
    name,
    id: raw.authorId?.value,
    orcid,
  }
}

export function parseAuthorString(str?: string): Author[] {
  if (!str) return []
  return str
    .split(/,\s*(?![^()]*\))/)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter(Boolean)
    .map((name) => ({ name }))
}

export function cleanAbstract(text?: string): string | undefined {
  if (!text) return undefined
  const clean = text
    .replace(/<\/?[a-zA-Z][\w:-]*(?:\s+[^>]*)?>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<\/?[a-zA-Z][\w:-]*(?:\s+[^>]*)?>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
  return clean || undefined
}

export function normalizeWork(raw: EuropePmcWork): Paper {
  if (!raw) {
    return {
      id: 'unknown',
      title: 'Untitled work',
      authors: [],
      topics: [],
      isOpenAccess: false,
      source: 'europepmc',
      indexedIn: ['europepmc'],
    }
  }

  // Authors
  let authors: Author[] = []
  if (Array.isArray(raw.authorList?.author) && raw.authorList.author.length > 0) {
    authors = raw.authorList.author.map(normalizeAuthor)
  } else if (raw.authorString) {
    authors = parseAuthorString(raw.authorString)
  }

  // PDF & Full-text URLs
  const urls = Array.isArray(raw.fullTextUrlList?.fullTextUrl) ? raw.fullTextUrlList.fullTextUrl : []
  const pdfEntry = urls.find((u) => u.documentStyle === 'pdf' && u.availabilityCode === 'OA')
    ?? urls.find((u) => u.documentStyle === 'pdf')
  const htmlEntry = urls.find((u) => u.documentStyle === 'html')

  let pdfUrl = pdfEntry?.url
  let fullTextUrl = htmlEntry?.url

  if (!pdfUrl && raw.pmcid) {
    pdfUrl = `https://europepmc.org/articles/${raw.pmcid}?pdf=render`
  }
  if (!fullTextUrl && raw.pmcid) {
    fullTextUrl = `https://europepmc.org/articles/${raw.pmcid}`
  }

  const landingPageUrl = raw.doi
    ? `https://doi.org/${raw.doi}`
    : fullTextUrl || (raw.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${raw.pmid}/` : undefined)

  // Title: strip trailing dot if present
  const title = (raw.title || 'Untitled work').replace(/\.$/, '').trim()

  // Publication year
  const pubYear = raw.pubYear ? Number(raw.pubYear) : raw.journalInfo?.yearOfPublication

  // Indexed platforms
  const indexedIn: string[] = ['europepmc']
  if (raw.inPMC === 'Y' || raw.pmcid) indexedIn.push('pmc')
  if (raw.source === 'MED' || raw.pmid) indexedIn.push('pubmed')

  // Preferred identifier
  const id = raw.pmcid || (raw.pmid ? `pmid:${raw.pmid}` : `epmc:${raw.id}`)

  return {
    id,
    doi: raw.doi,
    title,
    abstract: cleanAbstract(raw.abstractText),
    authors,
    publicationDate: raw.journalInfo?.dateOfPublication,
    publicationYear: Number.isFinite(pubYear) ? pubYear : undefined,
    venue: raw.journalInfo?.journal?.title || raw.journalInfo?.journal?.medlineAbbreviation,
    biblio: {
      volume: raw.journalInfo?.volume,
      issue: raw.journalInfo?.issue,
    },
    type: raw.pubTypeList?.pubType?.[0]?.toLowerCase() || 'article',
    citationCount: typeof raw.citedByCount === 'number' ? raw.citedByCount : 0,
    topics: raw.keywordList?.keyword ?? [],
    language: raw.language || 'en',
    isOpenAccess: raw.isOpenAccess === 'Y' || Boolean(raw.pmcid),
    openAccessStatus: raw.isOpenAccess === 'Y' ? 'gold' : undefined,
    pdfUrl,
    fullTextUrl,
    landingPageUrl,
    source: 'europepmc',
    pmcid: raw.pmcid,
    pmid: raw.pmid,
    indexedIn,
  }
}

export function normalizeWorksList(
  data: EuropePmcResponse,
  pageSize: number,
  page: number,
): { papers: Paper[]; total: number; page: number; pageSize: number } {
  const rawResults = data.resultList?.result ?? []
  const papers = rawResults.map(normalizeWork)
  const total = typeof data.hitCount === 'number' ? data.hitCount : papers.length

  return {
    papers,
    total,
    page,
    pageSize,
  }
}

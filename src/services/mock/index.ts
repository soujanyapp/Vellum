import type {
  AuthorProfile,
  Paper,
  PaperSource,
  SearchQuery,
  SearchResult,
} from '@/domain/papers'
import { HttpError } from '@/lib/http'
import { mockPapers } from './data'

/**
 * Reference implementation of the domain PaperSource over synthetic
 * fixtures. Mirrors the OpenAlex adapter's behavior so the UI, states and
 * tests behave identically regardless of data source.
 *
 * Dev helpers (query strings):
 *   - "error"  → throws a simulated provider outage (HTTP 500)
 *   - "slow"   → returns results after a long delay
 */

export const MOCK_LATENCY = 420

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}

const normalizeQuery = (q: string) => q.trim().toLowerCase()

function matches(paper: Paper, q: string): boolean {
  if (!q) return true
  const haystack = [
    paper.title,
    ...paper.authors.map((a) => a.name),
    paper.venue ?? '',
    paper.topics.join(' '),
  ]
    .join(' ')
    .toLowerCase()
  return q
    .split(/\s+/)
    .every((term) => haystack.includes(term))
}

function sortPapers(
  result: Paper[],
  query: { sort: SearchQuery['sort'] },
): Paper[] {
  return [...result].sort((a, b) => {
    if (query.sort === 'cited_by_count') {
      return (b.citationCount ?? 0) - (a.citationCount ?? 0)
    }
    if (query.sort === 'publication_date') {
      return (b.publicationYear ?? 0) - (a.publicationYear ?? 0)
    }
    return 0
  })
}

function applyFilters(paper: Paper, query: SearchQuery): boolean {
  if (query.fromYear && (paper.publicationYear ?? 0) < query.fromYear) return false
  if (query.toYear && (paper.publicationYear ?? 0) > query.toYear) return false
  if (query.openAccessOnly && !paper.isOpenAccess) return false
  if (query.type && paper.type !== query.type) return false
  if (query.language && paper.language !== query.language) return false
  if (query.venueId && paper.venue !== query.venueId) return false
  if (query.minCitations && (paper.citationCount ?? 0) < query.minCitations) {
    return false
  }
  return true
}

export const mockSource: PaperSource = {
  id: 'mock',
  label: 'Demo fixtures',
  supportsSuggestions: true,

  async search(query, signal) {
    await wait(MOCK_LATENCY, signal)
    const q = normalizeQuery(query.q)
    const qOriginal = query.q.trim().toLowerCase()

    if (qOriginal === 'error') {
      throw new HttpError(500, 'Simulated provider outage (demo mode).')
    }

    const matched = mockPapers.filter(
      (p) => matches(p, q) && applyFilters(p, query),
    )
    const sorted = sortPapers(matched, query)
    const start = (query.page - 1) * query.pageSize
    const pagePapers = sorted.slice(start, start + query.pageSize)

    return {
      papers: pagePapers,
      meta: {
        total: sorted.length,
        page: query.page,
        pageSize: query.pageSize,
        hasMore: start + pagePapers.length < sorted.length,
      },
    }
  },

  async getPaper(paperId, signal) {
    await wait(MOCK_LATENCY, signal)
    const paper = mockPapers.find((p) => p.id === paperId)
    if (!paper) throw new HttpError(404, 'Work not found (demo mode).')
    return paper
  },

  async getRelated(paperId, signal) {
    await wait(MOCK_LATENCY, signal)
    const paper = mockPapers.find((p) => p.id === paperId)
    if (!paper) return []
    return mockPapers
      .filter((p) => p.id !== paperId && (p.topics[0] === paper.topics[0]))
      .slice(0, 6)
  },

  async getAuthor(authorId, signal): Promise<AuthorProfile> {
    await wait(MOCK_LATENCY, signal)
    const author = mockPapers
      .flatMap((p) => p.authors)
      .find((a) => a.id === authorId)
    if (!author) throw new HttpError(404, 'Author not found (demo mode).')
    const works = mockPapers.filter((p) =>
      p.authors.some((a) => a.id === authorId),
    )
    return {
      id: author.id ?? authorId,
      name: author.name,
      worksCount: works.length,
      citedByCount: works.reduce((sum, w) => sum + (w.citationCount ?? 0), 0),
      topics: Array.from(
        new Set(works.flatMap((w) => w.topics)),
      ).slice(0, 8),
    }
  },

  async listAuthorWorks(authorId, query, signal): Promise<SearchResult> {
    await wait(MOCK_LATENCY, signal)
    const works = mockPapers.filter((p) =>
      p.authors.some((a) => a.id === authorId),
    )
    const sorted = sortPapers(works, query)
    const start = (query.page - 1) * query.pageSize
    const pagePapers = sorted.slice(start, start + query.pageSize)
    return {
      papers: pagePapers,
      meta: {
        total: sorted.length,
        page: query.page,
        pageSize: query.pageSize,
        hasMore: start + pagePapers.length < sorted.length,
      },
    }
  },
}

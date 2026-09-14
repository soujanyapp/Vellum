import type { SearchQuery, SortOrder } from '@/domain/papers'

/**
 * Translates a domain SearchQuery into OpenAlex /works query parameters.
 * Pure & synchronous so it is unit-testable without network access.
 *
 * Docs: https://docs.openalex.org/api-entities/works/works-object
 */

const BASE = 'https://api.openalex.org/works'
// OpenAlex caps per_page at 100 and page-based paging at 10,000 rows.
export const OPENALEX_MAX_PAGE_SIZE = 100
export const OPENALEX_MAX_ROWS = 10000

export const VALID_TYPES: ReadonlySet<string> = new Set([
  'article',
  'book',
  'book-chapter',
  'dataset',
  'dissertation',
  'editorial',
  'encyclopedia-entry',
  'grant',
  'letter',
  'monograph',
  'paratext',
  'peer-review',
  'posted-content',
  'preprint',
  'proceedings-article',
  'reference-entry',
  'report',
  'review',
  'standard',
])

function resolveSort(
  sort: SortOrder,
  hasQuery: boolean,
): { sort: string; order: string } {
  switch (sort) {
    case 'cited_by_count':
      return { sort: 'cited_by_count', order: 'desc' }
    case 'publication_date':
      return { sort: 'publication_date', order: 'desc' }
    case 'relevance':
    default:
      // OpenAlex only permits relevance sorting alongside a search term.
      if (hasQuery) return { sort: 'relevance_score', order: 'desc' }
      return { sort: 'cited_by_count', order: 'desc' }
  }
}

export function buildWorksUrl(query: SearchQuery): string {
  const params = new URLSearchParams()

  if (query.q.trim()) {
    params.set('search', query.q.trim())
  }

  params.set('per-page', String(Math.min(query.pageSize, OPENALEX_MAX_PAGE_SIZE)))
  params.set('page', String(query.page))

  const filters: string[] = []
  if (query.fromYear) filters.push(`from_publication_date:${query.fromYear}-01-01`)
  if (query.toYear) filters.push(`until_publication_date:${query.toYear}-12-31`)
  if (query.openAccessOnly) filters.push('is_oa:true')
  if (query.type && VALID_TYPES.has(query.type)) filters.push(`type:${query.type}`)
  if (query.language) filters.push(`language:${query.language}`)
  if (query.venueId) filters.push(`primary_location.source.id:${query.venueId}`)
  if (query.minCitations) filters.push(`cited_by_count:>${query.minCitations}`)

  if (filters.length > 0) params.set('filter', filters.join(','))

  const { sort, order } = resolveSort(query.sort, Boolean(query.q.trim()))
  params.set('sort', `${sort}:${order}`)

  params.set('select', WORK_SELECT)

  return `${BASE}?${params.toString()}`
}

/** Keep payloads lean — only the fields the results index renders. */
export const WORK_SELECT = [
  'id',
  'doi',
  'title',
  'display_name',
  'abstract_inverted_index',
  'publication_date',
  'publication_year',
  'type',
  'language',
  'cited_by_count',
  'relevance_score',
  'is_retracted',
  'open_access',
  'best_oa_location',
  'primary_location',
  'biblio',
  'authorships',
  'topics',
  'concepts',
  'related_works',
  'indexed_in',
].join(',')

function idSuffixForFilter(id: string): string {
  return id.startsWith('https://openalex.org/')
    ? id.slice('https://openalex.org/'.length)
    : id
}

export function buildWorksByIdsUrl(ids: string[], pageSize = 50): string {
  // One OR'd filter, batched — avoids N+1 requests for related-work lists.
  const chunks = ids
    .slice(0, Math.min(pageSize, OPENALEX_MAX_PAGE_SIZE))
    .map(idSuffixForFilter)
    .join('|')
  const params = new URLSearchParams({
    filter: `openalex_id:${chunks}`,
    'per-page': String(pageSize),
    select: [
      'id',
      'doi',
      'title',
      'publication_year',
      'type',
      'language',
      'cited_by_count',
      'primary_location',
      'authorships',
      'open_access',
    ].join(','),
  })
  return `${BASE}?${params.toString()}`
}

export function buildWorkUrl(workId: string): string {
  const token = workId.split('/').filter(Boolean).at(-1) ?? ''
  const suffix = token.startsWith('W') ? token : `W${token}`
  const params = new URLSearchParams({
    select: [
      'id',
      'doi',
      'title',
      'abstract_inverted_index',
      'publication_date',
      'publication_year',
      'type',
      'language',
      'cited_by_count',
      'is_retracted',
      'open_access',
      'best_oa_location',
      'primary_location',
      'biblio',
      'authorships',
      'concepts',
      'topics',
      'referenced_works_count',
      'related_works',
      'indexed_in',
    ].join(','),
  })
  return `https://api.openalex.org/works/${suffix}?${params.toString()}`
}

export function buildAuthorUrl(authorId: string): string {
  const token = authorId.split('/').filter(Boolean).at(-1) ?? ''
  const suffix = token.startsWith('A') ? token : `A${token}`
  const params = new URLSearchParams({
    select: [
      'id',
      'display_name',
      'orcid',
      'works_count',
      'cited_by_count',
      'topics',
      'last_known_institutions',
    ].join(','),
  })
  return `https://api.openalex.org/authors/${suffix}?${params.toString()}`
}

export function buildAuthorWorksUrl(
  authorId: string,
  query: Pick<SearchQuery, 'page' | 'pageSize' | 'sort'>,
): string {
  const token = authorId.includes('/authors/')
    ? (authorId.split('/').at(-1) ?? '')
    : authorId
  const clean = token.replace(/^A/, '')
  const params = new URLSearchParams()
  params.set('filter', `authorships.author.id:A${clean}`)
  params.set('sort', 'cited_by_count:desc')
  params.set('page', String(query.page))
  params.set('per-page', String(Math.min(query.pageSize, OPENALEX_MAX_PAGE_SIZE)))
  params.set('select', WORK_SELECT)
  return `${BASE}?${params.toString()}`
}

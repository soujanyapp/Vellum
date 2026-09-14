import type { SearchQuery, SortOrder, SourceId } from '@/domain/papers'

export const RESULTS_PAGE_SIZE = 25

const SORTS: SortOrder[] = ['relevance', 'cited_by_count', 'publication_date']

export interface FilterParams {
  from_year?: string
  to_year?: string
  oa?: string
  type?: string
  lang?: string
  venue?: string
  min_cites?: string
  source?: string
}

/** Read the search + filter configuration from the URL into a SearchQuery. */
export function queryFromParams(params: URLSearchParams): SearchQuery {
  const page = Math.max(1, Number(params.get('page')) || 1)
  const sortRaw = params.get('sort')
  const q = params.get('q') ?? ''
  const sort = SORTS.includes(sortRaw as SortOrder)
    ? (sortRaw as SortOrder)
    : 'relevance'

  const sourceRaw = params.get('source') as SourceId | null
  const source = sourceRaw === 'europepmc' ? 'europepmc' : 'openalex'

  return {
    q,
    page,
    pageSize: RESULTS_PAGE_SIZE,
    fromYear: num(params.get('from_year')),
    toYear: num(params.get('to_year')),
    openAccessOnly: params.get('oa') === '1',
    type: params.get('type') || undefined,
    language: params.get('lang') || undefined,
    venueId: params.get('venue') || undefined,
    minCitations: num(params.get('min_cites')),
    sort,
    source,
  }
}

/** Interpreted filter fields, kept isolated so the panel can diff against them. */
export function queryFromParamsAsFilters(params: URLSearchParams): FilterParams {
  return {
    from_year: params.get('from_year') ?? '',
    to_year: params.get('to_year') ?? '',
    oa: params.get('oa') ?? '',
    type: params.get('type') ?? '',
    lang: params.get('lang') ?? '',
    venue: params.get('venue') ?? '',
    min_cites: params.get('min_cites') ?? '',
  }
}

/** True when any filter beyond q/page/sort is active. */
export function hasActiveFilters(params: URLSearchParams): boolean {
  return (
    params.has('from_year') ||
    params.has('to_year') ||
    params.has('oa') ||
    params.has('type') ||
    params.has('lang') ||
    params.has('venue') ||
    params.has('min_cites')
  )
}

export function anyParam(params: URLSearchParams, key: string): boolean {
  return params.has(key) && (params.get(key) ?? '') !== ''
}

function num(raw: string | null): number | undefined {
  if (!raw) return undefined
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : undefined
}

/** Serialize a filter change into a new URLSearchParams (page reset to 1). */
export function withFilter(
  params: URLSearchParams,
  key: keyof FilterParams,
  rawValue: string | number | boolean,
): URLSearchParams {
  const next = new URLSearchParams(params)
  if (rawValue === '' || rawValue === false) {
    next.delete(key)
  } else {
    next.set(key, String(rawValue))
  }
  if (next.has('page')) next.delete('page')
  return next
}

export function clearedFilters(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params)
  for (const key of [
    'from_year',
    'to_year',
    'oa',
    'type',
    'lang',
    'venue',
    'min_cites',
  ]) {
    next.delete(key)
  }
  next.delete('page')
  return next
}

export function withPage(params: URLSearchParams, page: number): URLSearchParams {
  const next = new URLSearchParams(params)
  if (page <= 1) next.delete('page')
  else next.set('page', String(page))
  return next
}

export function withSort(params: URLSearchParams, sort: SortOrder): URLSearchParams {
  const next = new URLSearchParams(params)
  if (sort === 'relevance') next.delete('sort')
  else next.set('sort', sort)
  next.delete('page')
  return next
}

export function withSource(params: URLSearchParams, source: SourceId): URLSearchParams {
  const next = new URLSearchParams(params)
  if (source === 'openalex') next.delete('source')
  else next.set('source', source)
  next.delete('page')
  return next
}

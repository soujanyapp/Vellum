import type { SearchQuery } from '@/domain/papers'

const BASE_URL = 'https://www.ebi.ac.uk/europepmc/webservices/rest/search'

export function buildSearchUrl(query: SearchQuery): string {
  const clauses: string[] = []

  const rawQ = query.q.trim()
  if (rawQ) {
    clauses.push(rawQ)
  } else {
    clauses.push('*')
  }

  // Year bounds
  if (query.fromYear && query.toYear) {
    clauses.push(`PUB_YEAR:[${query.fromYear} TO ${query.toYear}]`)
  } else if (query.fromYear) {
    clauses.push(`PUB_YEAR:[${query.fromYear} TO 3000]`)
  } else if (query.toYear) {
    clauses.push(`PUB_YEAR:[1000 TO ${query.toYear}]`)
  }

  // Open Access filter
  if (query.openAccessOnly) {
    clauses.push('OPEN_ACCESS:Y')
  }

  // Minimum citations
  if (query.minCitations !== undefined && query.minCitations > 0) {
    clauses.push(`CITED:[${query.minCitations} TO 9999999]`)
  }

  // Venue / Journal
  if (query.venueId && query.venueId.trim()) {
    clauses.push(`JOURNAL:"${query.venueId.trim()}"`)
  }

  const params = new URLSearchParams()
  params.set('query', clauses.join(' AND '))
  params.set('format', 'json')
  params.set('resultType', 'core')
  params.set('pageSize', String(Math.min(100, Math.max(1, query.pageSize))))
  params.set('page', String(Math.max(1, query.page)))

  // Sort
  if (query.sort === 'cited_by_count') {
    params.set('sort', 'CITED desc')
  } else if (query.sort === 'publication_date') {
    params.set('sort', 'P_PD_DATE desc')
  }

  return `${BASE_URL}?${params.toString()}`
}

export function buildWorkUrl(paperId: string): string {
  const cleanId = paperId.trim()
  const params = new URLSearchParams()
  params.set('format', 'json')
  params.set('resultType', 'core')
  params.set('pageSize', '1')

  if (cleanId.startsWith('PMC')) {
    params.set('query', `PMC:${cleanId}`)
  } else if (/^\d+$/.test(cleanId)) {
    params.set('query', `EXT_ID:${cleanId}`)
  } else {
    params.set('query', `DOI:"${cleanId}" OR EXT_ID:${cleanId}`)
  }

  return `${BASE_URL}?${params.toString()}`
}

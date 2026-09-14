import { describe, expect, it } from 'vitest'
import {
  buildAuthorUrl,
  buildAuthorWorksUrl,
  buildWorksByIdsUrl,
  buildWorkUrl,
  buildWorksUrl,
  OPENALEX_MAX_PAGE_SIZE,
} from '../openalex/buildQuery'
import type { SearchQuery } from '@/domain/papers'

const base: (over?: Partial<SearchQuery>) => SearchQuery = (over = {}) => ({
  q: 'cold fusion',
  page: 1,
  pageSize: 25,
  sort: 'relevance',
  ...over,
})

describe('buildWorksUrl', () => {
  it('sets search, paging and relevance sort', () => {
    const url = new URL(buildWorksUrl(base()))
    expect(url.searchParams.get('search')).toBe('cold fusion')
    expect(url.searchParams.get('page')).toBe('1')
    expect(url.searchParams.get('per-page')).toBe('25')
    expect(url.searchParams.get('sort')).toBe('relevance_score:desc')
  })

  it('maps domain filters to OpenAlex filter syntax', () => {
    const url = new URL(
      buildWorksUrl(
        base({
          fromYear: 2018,
          toYear: 2023,
          openAccessOnly: true,
          type: 'preprint',
          language: 'en',
        }),
      ),
    )
    const filter = url.searchParams.get('filter')
    expect(filter).toContain('from_publication_date:2018-01-01')
    expect(filter).toContain('until_publication_date:2023-12-31')
    expect(filter).toContain('is_oa:true')
    expect(filter).toContain('type:preprint')
    expect(filter).toContain('language:en')
  })

  it('ignores invalid types and treats minimum citations as a range', () => {
    const url = new URL(
      buildWorksUrl(base({ type: 'not-a-real-type', minCitations: 50 })),
    )
    const filter = url.searchParams.get('filter')
    expect(filter).not.toContain('type:')
    expect(filter).toContain('cited_by_count:>50')
  })

  it('falls back to citation sort when there is no query', () => {
    const url = new URL(buildWorksUrl(base({ q: '' })))
    expect(url.searchParams.get('sort')).toBe('cited_by_count:desc')
  })

  it('caps page size to OpenAlex limits', () => {
    const url = new URL(buildWorksUrl(base({ pageSize: 5000 })))
    expect(url.searchParams.get('per-page')).toBe(String(OPENALEX_MAX_PAGE_SIZE))
  })

  it('does not emit empty filters', () => {
    const url = new URL(buildWorksUrl(base()))
    expect(url.searchParams.get('filter')).toBeNull()
  })
})

describe('buildWorksByIdsUrl', () => {
  it('batches ids into one OR filter', () => {
    const url = new URL(buildWorksByIdsUrl(['https://openalex.org/W1', 'https://openalex.org/W2']))
    expect(url.searchParams.get('filter')).toBe('openalex_id:W1|W2')
  })
})

describe('buildWorkUrl', () => {
  it('targets the OpenAlex API single-work endpoint', () => {
    const url = new URL(buildWorkUrl('W123'))
    expect(url.origin + url.pathname).toBe('https://api.openalex.org/works/W123')
    expect(url.searchParams.get('select')).toContain('abstract_inverted_index')
    expect(url.searchParams.get('select')).toContain('related_works')
  })

  it('prefixes W when a bare numeric id is supplied', () => {
    expect(new URL(buildWorkUrl('123')).pathname).toBe('/works/W123')
    expect(new URL(buildWorkUrl('https://openalex.org/W7')).pathname).toBe('/works/W7')
  })
})

describe('buildAuthorUrl', () => {
  it('targets the OpenAlex API author endpoint', () => {
    const url = new URL(buildAuthorUrl('A42'))
    expect(url.origin + url.pathname).toBe('https://api.openalex.org/authors/A42')
    expect(url.searchParams.get('select')).toContain('last_known_institutions')
  })

  it('derives the id from a canonical url', () => {
    expect(new URL(buildAuthorUrl('https://openalex.org/A42')).pathname).toBe('/authors/A42')
  })
})

describe('buildAuthorWorksUrl', () => {
  it('targets the author via filter with sort by citations', () => {
    const url = new URL(buildAuthorWorksUrl('A42', { page: 2, pageSize: 10, sort: 'cited_by_count' }))
    expect(url.searchParams.get('filter')).toBe('authorships.author.id:A42')
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('sort')).toBe('cited_by_count:desc')
  })
})

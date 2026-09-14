import { describe, expect, it } from 'vitest'
import {
  queryFromParams,
  withSource,
  clearedFilters,
} from '../queryParams'

describe('queryParams source routing', () => {
  it('defaults to openalex when source parameter is omitted', () => {
    const params = new URLSearchParams('q=crispr')
    const query = queryFromParams(params)
    expect(query.source).toBe('openalex')
  })

  it('selects europepmc when source parameter is europepmc', () => {
    const params = new URLSearchParams('q=crispr&source=europepmc')
    const query = queryFromParams(params)
    expect(query.source).toBe('europepmc')
  })

  it('strictly rejects crossref as a search provider and defaults to openalex', () => {
    const params = new URLSearchParams('q=crispr&source=crossref')
    const query = queryFromParams(params)
    expect(query.source).toBe('openalex')
  })

  it('handles unknown or unexpected source values gracefully', () => {
    const params = new URLSearchParams('q=crispr&source=unsupported')
    const query = queryFromParams(params)
    expect(query.source).toBe('openalex')
  })

  it('withSource updates URLSearchParams and resets page', () => {
    const initial = new URLSearchParams('q=crispr&page=3')
    const next = withSource(initial, 'europepmc')
    expect(next.get('source')).toBe('europepmc')
    expect(next.has('page')).toBe(false)

    // Switching back to openalex removes source param (clean URL default)
    const backToDefault = withSource(next, 'openalex')
    expect(backToDefault.has('source')).toBe(false)
  })

  it('clearedFilters removes filter criteria but preserves search query and source provider', () => {
    const initial = new URLSearchParams('q=cancer&source=europepmc&oa=1&from_year=2020&page=2')
    const cleared = clearedFilters(initial)
    expect(cleared.get('q')).toBe('cancer')
    expect(cleared.get('source')).toBe('europepmc')
    expect(cleared.has('oa')).toBe(false)
    expect(cleared.has('from_year')).toBe(false)
    expect(cleared.has('page')).toBe(false)
  })
})

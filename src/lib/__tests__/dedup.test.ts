import { describe, expect, it } from 'vitest'
import { deduplicatePapers, mergePaperMetadata, normalizeDoi, paperFingerprint } from '../dedup'
import type { Paper } from '@/domain/papers'

function makePaper(partial: Partial<Paper>): Paper {
  return {
    id: 'W1',
    title: 'Attention Is All You Need',
    authors: [{ name: 'Vaswani, Ashish' }],
    topics: ['Computer science'],
    source: 'openalex',
    indexedIn: ['crossref'],
    isOpenAccess: true,
    ...partial,
  }
}

describe('normalizeDoi', () => {
  it('strips https://doi.org/ prefix', () => {
    expect(normalizeDoi('https://doi.org/10.1038/s41586-020-2649-2')).toBe(
      '10.1038/s41586-020-2649-2',
    )
  })

  it('strips http://dx.doi.org/ prefix', () => {
    expect(normalizeDoi('http://dx.doi.org/10.1038/s41586-020-2649-2')).toBe(
      '10.1038/s41586-020-2649-2',
    )
  })

  it('strips doi: prefix and whitespace', () => {
    expect(normalizeDoi('doi: 10.1038/S41586-020-2649-2 ')).toBe(
      '10.1038/s41586-020-2649-2',
    )
  })

  it('decodes percent-encoded characters', () => {
    expect(normalizeDoi('10.1038%2Fs41586-020-2649-2')).toBe(
      '10.1038/s41586-020-2649-2',
    )
  })

  it('strips trailing slashes and periods', () => {
    expect(normalizeDoi('https://doi.org/10.1038/nature123/.')).toBe(
      '10.1038/nature123',
    )
  })

  it('returns undefined for empty/null values', () => {
    expect(normalizeDoi('')).toBeUndefined()
    expect(normalizeDoi(undefined)).toBeUndefined()
    expect(normalizeDoi(null)).toBeUndefined()
  })
})

describe('paperFingerprint', () => {
  it('uses DOI if present', () => {
    const p = makePaper({ doi: 'https://doi.org/10.1145/12345' })
    expect(paperFingerprint(p)).toBe('doi:10.1145/12345')
  })

  it('falls back to title, author, year when DOI is absent and metadata is complete', () => {
    const p = makePaper({
      doi: undefined,
      title: 'Attention Is All You Need',
      authors: [{ name: 'Ashish Vaswani' }],
      publicationYear: 2017,
    })
    expect(paperFingerprint(p)).toBe('fp:attentionisallyouneed:ashishvaswani:2017')
  })

  it('does NOT merge papers with short generic titles lacking a DOI', () => {
    const p1 = makePaper({ id: 'E1', doi: undefined, title: 'Editorial', authors: [{ name: 'Editor A' }], publicationYear: 2024 })
    const p2 = makePaper({ id: 'E2', doi: undefined, title: 'Editorial', authors: [{ name: 'Editor A' }], publicationYear: 2024 })
    expect(paperFingerprint(p1)).toBe('id:E1')
    expect(paperFingerprint(p2)).toBe('id:E2')
    expect(deduplicatePapers([p1, p2])).toHaveLength(2)
  })

  it('does NOT merge papers lacking author or publication year', () => {
    const p1 = makePaper({ id: 'X1', doi: undefined, title: 'A Very Long Research Paper Title', authors: [], publicationYear: 2024 })
    const p2 = makePaper({ id: 'X2', doi: undefined, title: 'A Very Long Research Paper Title', authors: [{ name: 'Author' }], publicationYear: undefined })
    expect(paperFingerprint(p1)).toBe('id:X1')
    expect(paperFingerprint(p2)).toBe('id:X2')
  })
})

describe('mergePaperMetadata', () => {
  it('merges missing fields from secondary into primary', () => {
    const primary = makePaper({
      id: 'W1',
      title: 'Sample Paper',
      abstract: undefined,
      source: 'openalex',
      indexedIn: ['crossref'],
    })
    const secondary = makePaper({
      id: 'PMC123',
      title: 'Sample Paper',
      abstract: 'Detailed abstract from Europe PMC',
      source: 'europepmc',
      pmcid: 'PMC123',
      indexedIn: ['pubmed', 'europepmc'],
    })

    const merged = mergePaperMetadata(primary, secondary)
    expect(merged.id).toBe('W1')
    expect(merged.abstract).toBe('Detailed abstract from Europe PMC')
    expect(merged.pmcid).toBe('PMC123')
    expect(merged.source).toBe('openalex')
    expect(merged.alternateSources).toEqual(['europepmc'])
    expect(merged.indexedIn).toEqual(['crossref', 'pubmed', 'europepmc'])
  })

  it('preserves primary field when already populated', () => {
    const primary = makePaper({
      id: 'W1',
      abstract: 'Original primary abstract',
      source: 'openalex',
    })
    const secondary = makePaper({
      id: 'PMC123',
      abstract: 'Alternate abstract',
      source: 'europepmc',
    })

    const merged = mergePaperMetadata(primary, secondary)
    expect(merged.abstract).toBe('Original primary abstract')
  })

  it('does not add Crossref as an alternate discovery source', () => {
    const primary = makePaper({ id: 'W1', source: 'openalex' })
    const crossrefEnrichment = makePaper({ id: '10.1234/test', source: 'crossref' })
    const merged = mergePaperMetadata(primary, crossrefEnrichment)
    expect(merged.alternateSources).toBeUndefined()
  })

  it('propagates crossrefVerified flag', () => {
    const primary = makePaper({ id: 'W1', crossrefVerified: false })
    const secondary = makePaper({ id: 'W2', crossrefVerified: true })
    const merged = mergePaperMetadata(primary, secondary)
    expect(merged.crossrefVerified).toBe(true)
  })
})

describe('deduplicatePapers', () => {
  it('collapses papers with matching DOIs and records alternate sources', () => {
    const p1 = makePaper({
      id: 'W1',
      doi: '10.1038/nature123',
      source: 'openalex',
    })
    const p2 = makePaper({
      id: 'PMC999',
      doi: 'https://doi.org/10.1038/NATURE123',
      source: 'europepmc',
      pmcid: 'PMC999',
    })
    const p3 = makePaper({
      id: 'W3',
      doi: '10.1145/other',
      source: 'openalex',
    })

    const deduplicated = deduplicatePapers([p1, p2, p3])
    expect(deduplicated).toHaveLength(2)
    expect(deduplicated[0].id).toBe('W1')
    expect(deduplicated[0].pmcid).toBe('PMC999')
    expect(deduplicated[0].alternateSources).toEqual(['europepmc'])
    expect(deduplicated[1].id).toBe('W3')
  })

  it('preserves order of primary provider results', () => {
    const p1 = makePaper({ id: 'W1', doi: '10.1/a' })
    const p2 = makePaper({ id: 'W2', doi: '10.1/b' })
    const p3 = makePaper({ id: 'W3', doi: '10.1/c' })
    const pDuplicate = makePaper({ id: 'PMC2', doi: '10.1/b' })

    const result = deduplicatePapers([p1, p2, pDuplicate, p3])
    expect(result.map((p) => p.id)).toEqual(['W1', 'W2', 'W3'])
  })
})

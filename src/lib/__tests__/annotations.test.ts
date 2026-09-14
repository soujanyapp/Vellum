import { describe, expect, it } from 'vitest'
import { annotateResultSet } from '../annotations'
import type { Paper, SourceId } from '@/domain/papers'

/** Minimal Paper factory — only the fields the annotation engine reads. */
function paper(overrides: Partial<Paper> & { id: string }): Paper {
  return {
    title: 'Test paper',
    authors: [],
    topics: [],
    isOpenAccess: false,
    indexedIn: [],
    source: 'openalex' as SourceId,
    ...overrides,
  }
}

describe('annotateResultSet', () => {
  it('returns an empty map for an empty result set', () => {
    const result = annotateResultSet([])
    expect(result.size).toBe(0)
  })

  it('assigns no labels when the set is too small for percentiles', () => {
    const papers = [
      paper({ id: 'a', relevanceScore: 100, citationCount: 500 }),
      paper({ id: 'b', relevanceScore: 50, citationCount: 100 }),
    ]
    const result = annotateResultSet(papers)
    // With only 2 papers, percentile thresholds require >= 3 so no
    // relevance or citation labels should fire.
    for (const labels of result.values()) {
      const kinds = labels.map((l) => l.kind)
      expect(kinds).not.toContain('relevance')
      expect(kinds).not.toContain('highly-cited')
    }
  })

  it('labels the top paper by relevance score', () => {
    const papers = [
      paper({ id: 'top', relevanceScore: 100 }),
      paper({ id: 'mid1', relevanceScore: 40 }),
      paper({ id: 'mid2', relevanceScore: 35 }),
      paper({ id: 'mid3', relevanceScore: 30 }),
      paper({ id: 'low', relevanceScore: 10 }),
    ]
    const result = annotateResultSet(papers)
    const topLabels = result.get('top') ?? []
    expect(topLabels.some((l) => l.kind === 'relevance')).toBe(true)
    // Low-scoring paper should NOT get a relevance label
    const lowLabels = result.get('low') ?? []
    expect(lowLabels.some((l) => l.kind === 'relevance')).toBe(false)
  })

  it('labels the most-cited paper within the set', () => {
    const papers = [
      paper({ id: 'cited', citationCount: 5000 }),
      paper({ id: 'b', citationCount: 100 }),
      paper({ id: 'c', citationCount: 80 }),
      paper({ id: 'd', citationCount: 20 }),
      paper({ id: 'e', citationCount: 5 }),
    ]
    const result = annotateResultSet(papers)
    const citedLabels = result.get('cited') ?? []
    expect(citedLabels.some((l) => l.kind === 'highly-cited')).toBe(true)
    const lowLabels = result.get('e') ?? []
    expect(lowLabels.some((l) => l.kind === 'highly-cited')).toBe(false)
  })

  it('labels a paper central to the topic cluster', () => {
    // Paper "hub" shares topics with most other papers
    const sharedTopics = ['AI', 'ML', 'NLP', 'Deep Learning']
    const papers = [
      paper({ id: 'hub', topics: sharedTopics }),
      ...Array.from({ length: 20 }, (_, i) =>
        paper({ id: `p${i}`, topics: sharedTopics }),
      ),
    ]
    const result = annotateResultSet(papers)
    const hubLabels = result.get('hub') ?? []
    expect(hubLabels.some((l) => l.kind === 'topic-central')).toBe(true)
  })

  it('does not label topic-central when topics are sparse', () => {
    const papers = [
      paper({ id: 'a', topics: ['Alpha'] }),
      paper({ id: 'b', topics: ['Beta'] }),
      paper({ id: 'c', topics: ['Gamma'] }),
    ]
    const result = annotateResultSet(papers)
    for (const labels of result.values()) {
      expect(labels.some((l) => l.kind === 'topic-central')).toBe(false)
    }
  })

  it('labels recent low-citation papers', () => {
    const currentYear = new Date().getFullYear()
    const papers = [
      paper({
        id: 'recent',
        publicationYear: currentYear,
        citationCount: 5,
      }),
      paper({
        id: 'old-cited',
        publicationYear: 2010,
        citationCount: 2000,
      }),
      paper({
        id: 'mid',
        publicationYear: 2018,
        citationCount: 200,
      }),
    ]
    const result = annotateResultSet(papers)
    const recentLabels = result.get('recent') ?? []
    expect(recentLabels.some((l) => l.kind === 'recent')).toBe(true)
    // Old highly-cited paper should NOT get recent label
    const oldLabels = result.get('old-cited') ?? []
    expect(oldLabels.some((l) => l.kind === 'recent')).toBe(false)
  })

  it('does not label a recent paper if it is already highly cited', () => {
    const currentYear = new Date().getFullYear()
    // A recent paper with citation count above the median should not
    // get the "recent" label (it's already established).
    const papers = [
      paper({
        id: 'recent-famous',
        publicationYear: currentYear,
        citationCount: 9000,
      }),
      paper({ id: 'b', publicationYear: 2015, citationCount: 10 }),
      paper({ id: 'c', publicationYear: 2016, citationCount: 20 }),
    ]
    const result = annotateResultSet(papers)
    const labels = result.get('recent-famous') ?? []
    expect(labels.some((l) => l.kind === 'recent')).toBe(false)
  })

  it('labels review articles', () => {
    const papers = [
      paper({ id: 'rev', type: 'review' }),
      paper({ id: 'art', type: 'article' }),
      paper({ id: 'pre', type: 'preprint' }),
    ]
    const result = annotateResultSet(papers)
    expect(result.get('rev')?.some((l) => l.kind === 'review')).toBe(true)
    expect(result.get('art')?.some((l) => l.kind === 'review')).toBe(false)
  })

  it('caps labels at 3 per paper', () => {
    const currentYear = new Date().getFullYear()
    // Construct a paper that could qualify for many labels
    const sharedTopics = ['AI', 'ML', 'NLP', 'Deep Learning']
    const papers = [
      paper({
        id: 'multi',
        relevanceScore: 999,
        citationCount: 1,
        publicationYear: currentYear,
        type: 'review',
        topics: sharedTopics,
      }),
      ...Array.from({ length: 20 }, (_, i) =>
        paper({
          id: `filler-${i}`,
          relevanceScore: 1,
          citationCount: 500,
          publicationYear: 2015,
          topics: sharedTopics,
        }),
      ),
    ]
    const result = annotateResultSet(papers)
    const labels = result.get('multi') ?? []
    expect(labels.length).toBeLessThanOrEqual(3)
  })

  it('produces labels with non-empty text and detail', () => {
    const papers = [
      paper({ id: 'a', relevanceScore: 100, citationCount: 5000 }),
      paper({ id: 'b', relevanceScore: 10, citationCount: 10 }),
      paper({ id: 'c', relevanceScore: 5, citationCount: 5 }),
    ]
    const result = annotateResultSet(papers)
    for (const labels of result.values()) {
      for (const label of labels) {
        expect(label.text.length).toBeGreaterThan(0)
        expect(label.detail.length).toBeGreaterThan(0)
        expect(typeof label.kind).toBe('string')
      }
    }
  })

  it('handles papers with missing optional fields gracefully', () => {
    const papers = [
      paper({ id: 'a' }),
      paper({ id: 'b' }),
      paper({ id: 'c' }),
    ]
    // Should not throw — all optional fields are undefined
    const result = annotateResultSet(papers)
    expect(result.size).toBe(3)
  })
})

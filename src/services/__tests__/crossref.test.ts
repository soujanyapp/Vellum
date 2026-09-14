import { describe, expect, it } from 'vitest'
import { normalizeCrossrefAuthor, normalizeCrossrefWork, stripJatsTags } from '../crossref/normalize'
import type { CrossrefWork } from '../crossref/types'

describe('Crossref normalizer', () => {
  it('strips JATS XML tags from abstract', () => {
    const raw = '<jats:p>We introduce <jats:bold>Transformer</jats:bold>, an architecture based on attention.</jats:p>'
    expect(stripJatsTags(raw)).toBe('We introduce Transformer , an architecture based on attention.')
  })

  it('normalizes Crossref author and extracts ORCID', () => {
    const author = normalizeCrossrefAuthor({
      given: 'Ashish',
      family: 'Vaswani',
      ORCID: 'https://orcid.org/0000-0001-2345-6789',
    })
    expect(author.name).toBe('Ashish Vaswani')
    expect(author.orcid).toBe('0000-0001-2345-6789')
  })

  it('normalizes full Crossref work into Paper domain model', () => {
    const sample: CrossrefWork = {
      DOI: '10.1038/nature123',
      title: ['Attention Is All You Need'],
      author: [
        { given: 'Ashish', family: 'Vaswani' },
        { given: 'Noam', family: 'Shazeer' },
      ],
      'container-title': ['Advances in Neural Information Processing Systems'],
      published: {
        'date-parts': [[2017, 12, 6]],
      },
      volume: '30',
      issue: '1',
      page: '5998-6008',
      'is-referenced-by-count': 85000,
      type: 'proceedings-article',
      resource: {
        primary: {
          URL: 'https://proceedings.neurips.cc/paper/2017/hash/3f5ee243547dee91fbd053c1c4a845aa-Abstract.html',
        },
      },
      subject: ['Computer Science', 'Artificial Intelligence'],
    }

    const paper = normalizeCrossrefWork(sample)
    expect(paper.id).toBe('10.1038/nature123')
    expect(paper.doi).toBe('10.1038/nature123')
    expect(paper.title).toBe('Attention Is All You Need')
    expect(paper.authors).toHaveLength(2)
    expect(paper.authors[0].name).toBe('Ashish Vaswani')
    expect(paper.venue).toBe('Advances in Neural Information Processing Systems')
    expect(paper.publicationYear).toBe(2017)
    expect(paper.publicationDate).toBe('2017-12-06')
    expect(paper.biblio?.volume).toBe('30')
    expect(paper.biblio?.issue).toBe('1')
    expect(paper.biblio?.firstPage).toBe('5998-6008')
    expect(paper.citationCount).toBe(85000)
    expect(paper.type).toBe('proceedings article')
    expect(paper.source).toBe('crossref')
    expect(paper.landingPageUrl).toBe(
      'https://proceedings.neurips.cc/paper/2017/hash/3f5ee243547dee91fbd053c1c4a845aa-Abstract.html',
    )
  })
})

describe('enrichPaperWithCrossref', () => {
  it('returns paper immediately if DOI is missing', async () => {
    const { enrichPaperWithCrossref } = await import('../crossref/enrich')
    const paper = {
      id: 'W1',
      title: 'No DOI Paper',
      authors: [],
      topics: [],
      source: 'openalex' as const,
      indexedIn: [],
      isOpenAccess: false,
    }
    const result = await enrichPaperWithCrossref(paper)
    expect(result).toBe(paper)
  })

  it('handles Crossref network errors gracefully without crashing', async () => {
    const { enrichPaperWithCrossref } = await import('../crossref/enrich')
    const paper = {
      id: 'W1',
      doi: '10.9999/nonexistent-doi',
      title: 'Paper with bad DOI',
      authors: [],
      topics: [],
      source: 'openalex' as const,
      indexedIn: [],
      isOpenAccess: false,
    }
    const result = await enrichPaperWithCrossref(paper)
    expect(result.id).toBe('W1')
    expect(result.crossrefVerified).toBeUndefined()
  })
})


import { describe, expect, it } from 'vitest'
import { normalizeWork, normalizeWorksList } from '../openalex/normalize'
import type { OpenAlexWork } from '../openalex/types'

const sample: OpenAlexWork = {
  id: 'https://openalex.org/W1',
  doi: 'https://doi.org/10.1000/j.a.fake.2024.01.001',
  title: 'A Normalized Title',
  abstract_inverted_index: { Hello: [0], world: [1] },
  publication_date: '2024-03-14',
  publication_year: 2024,
  type: 'article',
  language: 'en',
  cited_by_count: 87,
  is_retracted: false,
  open_access: { is_oa: true, oa_status: 'gold' },
  best_oa_location: {
    landing_page_url: 'https://publisher.example/article',
    pdf_url: 'https://publisher.example/pdf',
  },
  primary_location: {
    source: { id: 'https://openalex.org/S5', display_name: 'Journal of Tests' },
    landing_page_url: 'https://publisher.example/article',
  },
  biblio: { volume: '12', issue: '3', first_page: '10', last_page: '20' },
  authorships: [
    {
      author: { id: 'https://openalex.org/A1', display_name: 'Ada Test', orcid: '0000-0002-0000-0001' },
    },
    { author: { id: 'https://openalex.org/A2', display_name: 'Grace Test' } },
  ],
  concepts: [
    { display_name: 'Software Engineering', score: 0.9 },
    { display_name: 'Programming Languages', score: 0.4 },
  ],
  topics: [{ display_name: 'Machine Learning', score: 0.8 }],
  indexed_in: ['crossref', 'arxiv'],
}

describe('normalizeWork', () => {
  it('maps every present field into the domain model', () => {
    const paper = normalizeWork(sample)
    expect(paper.id).toBe('https://openalex.org/W1')
    expect(paper.doi).toBe('10.1000/j.a.fake.2024.01.001')
    expect(paper.title).toBe('A Normalized Title')
    expect(paper.abstract).toBe('Hello world')
    expect(paper.publicationYear).toBe(2024)
    expect(paper.venue).toBe('Journal of Tests')
    expect(paper.biblio?.volume).toBe('12')
    expect(paper.citationCount).toBe(87)
    expect(paper.isOpenAccess).toBe(true)
    expect(paper.openAccessStatus).toBe('gold')
    expect(paper.pdfUrl).toBe('https://publisher.example/pdf')
    expect(paper.landingPageUrl).toBe('https://publisher.example/article')
    expect(paper.authors).toHaveLength(2)
    expect(paper.authors[0].orcid).toBe('0000-0002-0000-0001')
    expect(paper.topics).toEqual([
      'Machine Learning',
      'Software Engineering',
      'Programming Languages',
    ])
    expect(paper.indexedIn).toEqual(['crossref', 'arxiv'])
    expect(paper.source).toBe('openalex')
  })

  it('tolerates sparse records without crashing', () => {
    const paper = normalizeWork({ id: 'https://openalex.org/W2', title: null })
    expect(paper.title).toBe('Untitled work')
    expect(paper.abstract).toBeUndefined()
    expect(paper.authors).toEqual([])
    expect(paper.topics).toEqual([])
    expect(paper.isOpenAccess).toBe(false)
    expect(paper.pdfUrl).toBeUndefined()
  })

  it('surfaces retracted status', () => {
    expect(normalizeWork({ ...sample, is_retracted: true }).isRetracted).toBe(true)
  })
})

describe('normalizeWorksList', () => {
  it('returns paging metadata', () => {
    const result = normalizeWorksList(
      { meta: { count: 120 }, results: [sample] },
      25,
    )
    expect(result.papers).toHaveLength(1)
    expect(result.total).toBe(120)
    expect(result.pageSize).toBe(25)
  })
})

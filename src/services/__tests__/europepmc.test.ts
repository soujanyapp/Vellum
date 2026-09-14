import { describe, expect, it } from 'vitest'
import { buildSearchUrl, buildWorkUrl } from '../europepmc/buildQuery'
import { cleanAbstract, normalizeWork, normalizeWorksList } from '../europepmc/normalize'
import type { EuropePmcWork } from '../europepmc/types'

describe('Europe PMC buildQuery', () => {
  it('builds a keyword search URL with format and core resultType', () => {
    const url = buildSearchUrl({
      q: 'crispr cas9',
      page: 1,
      pageSize: 25,
      sort: 'relevance',
    })
    expect(url).toContain('format=json')
    expect(url).toContain('resultType=core')
    expect(url).toContain('pageSize=25')
    expect(url).toContain('page=1')
    expect(url).toContain('query=crispr+cas9')
  })

  it('adds publication year range when provided', () => {
    const url = buildSearchUrl({
      q: 'mrna',
      page: 1,
      pageSize: 20,
      fromYear: 2020,
      toYear: 2023,
      sort: 'relevance',
    })
    expect(url).toContain('PUB_YEAR%3A%5B2020+TO+2023%5D')
  })

  it('adds open access filter when requested', () => {
    const url = buildSearchUrl({
      q: 'vaccine',
      page: 1,
      pageSize: 10,
      openAccessOnly: true,
      sort: 'relevance',
    })
    expect(url).toContain('OPEN_ACCESS%3AY')
  })

  it('adds sort order for cited_by_count', () => {
    const url = buildSearchUrl({
      q: 'cancer',
      page: 1,
      pageSize: 10,
      sort: 'cited_by_count',
    })
    expect(url).toContain('sort=CITED+desc')
  })

  it('adds minCitations and venue filters when provided', () => {
    const url = buildSearchUrl({
      q: 'immunology',
      page: 1,
      pageSize: 10,
      minCitations: 50,
      venueId: 'Nature',
      sort: 'relevance',
    })
    expect(url).toContain('CITED%3A%5B50+TO+9999999%5D')
    expect(url).toContain('JOURNAL%3A%22Nature%22')
  })

  it('builds work URL by PMC or DOI or numeric ID', () => {
    expect(buildWorkUrl('PMC12345')).toContain('query=PMC%3APMC12345')
    expect(buildWorkUrl('34567890')).toContain('query=EXT_ID%3A34567890')
    expect(buildWorkUrl('10.1038/nature123')).toContain('DOI%3A%2210.1038%2Fnature123%22')
  })
})

describe('Europe PMC normalize', () => {
  const sampleWork: EuropePmcWork = {
    id: '12345678',
    pmid: '12345678',
    pmcid: 'PMC9988776',
    doi: '10.1038/s41586-021-00000',
    title: 'Structure of the SARS-CoV-2 Spike Glycoprotein.',
    pubYear: '2021',
    abstractText: 'Cryo-EM structure determination of the spike glycoprotein...',
    authorList: {
      author: [
        {
          fullName: 'Wrapp D',
          firstName: 'Daniel',
          lastName: 'Wrapp',
          authorId: { type: 'ORCID', value: '0000-0002-1234-5678' },
        },
      ],
    },
    journalInfo: {
      dateOfPublication: '2021 Mar',
      journal: { title: 'Nature' },
    },
    citedByCount: 450,
    isOpenAccess: 'Y',
    keywordList: {
      keyword: ['SARS-CoV-2', 'Spike protein', 'Cryo-EM'],
    },
    fullTextUrlList: {
      fullTextUrl: [
        {
          availability: 'Open access',
          availabilityCode: 'OA',
          documentStyle: 'pdf',
          url: 'https://europepmc.org/articles/PMC9988776?pdf=render',
        },
      ],
    },
  }

  it('normalizes Europe PMC record to Vellum Paper domain', () => {
    const paper = normalizeWork(sampleWork)
    expect(paper.id).toBe('PMC9988776')
    expect(paper.doi).toBe('10.1038/s41586-021-00000')
    expect(paper.title).toBe('Structure of the SARS-CoV-2 Spike Glycoprotein') // stripped trailing dot
    expect(paper.abstract).toBe('Cryo-EM structure determination of the spike glycoprotein...')
    expect(paper.authors[0].name).toBe('Wrapp D')
    expect(paper.authors[0].orcid).toBe('0000-0002-1234-5678')
    expect(paper.publicationYear).toBe(2021)
    expect(paper.venue).toBe('Nature')
    expect(paper.citationCount).toBe(450)
    expect(paper.isOpenAccess).toBe(true)
    expect(paper.source).toBe('europepmc')
    expect(paper.pmcid).toBe('PMC9988776')
    expect(paper.pmid).toBe('12345678')
    expect(paper.topics).toEqual(['SARS-CoV-2', 'Spike protein', 'Cryo-EM'])
    expect(paper.pdfUrl).toBe('https://europepmc.org/articles/PMC9988776?pdf=render')
  })

  it('normalizes works list with metadata counts', () => {
    const list = normalizeWorksList(
      {
        hitCount: 1500,
        resultList: { result: [sampleWork] },
      },
      25,
      1,
    )
    expect(list.total).toBe(1500)
    expect(list.papers).toHaveLength(1)
    expect(list.page).toBe(1)
    expect(list.pageSize).toBe(25)
  })

  it('cleans HTML tags and entities from abstractText while preserving mathematical inequalities', () => {
    expect(
      cleanAbstract(
        '<jats:p>The &lt;italic&gt;SARS-CoV-2&lt;/italic&gt; spike glycoprotein (p &lt; 0.05) &amp; its receptor.</jats:p>',
      ),
    ).toBe('The SARS-CoV-2 spike glycoprotein (p < 0.05) & its receptor.')

    const work: EuropePmcWork = {
      ...sampleWork,
      abstractText:
        '<jats:p>The &lt;italic&gt;SARS-CoV-2&lt;/italic&gt; spike glycoprotein &amp; its receptor.</jats:p>',
    }
    const paper = normalizeWork(work)
    expect(paper.abstract).toBe('The SARS-CoV-2 spike glycoprotein & its receptor.')
  })

  it('handles empty or malformed work record safely', () => {
    const emptyPaper = normalizeWork({} as EuropePmcWork)
    expect(emptyPaper.id).toBeDefined()
    expect(emptyPaper.title).toBe('Untitled work')
    expect(emptyPaper.authors).toEqual([])
    expect(emptyPaper.source).toBe('europepmc')
  })
})

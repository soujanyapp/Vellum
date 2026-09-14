import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { PaperSource, Paper, AuthorProfile, SearchResult } from '@/domain/papers'

vi.mock('@/services', () => {
  const paper: Paper = {
    id: 'W1',
    title: 'Attention is all you need',
    doi: '10.9999/fake.1',
    abstract: 'We propose a new network architecture based on attention.',
    authors: [{ name: 'Ada Test', id: 'A1' }],
    publicationYear: 2024,
    publicationDate: '2024-03-01',
    venue: 'Journal of Tests',
    type: 'article',
    citationCount: 100,
    topics: ['Transformer architecture'],
    isOpenAccess: true,
    pdfUrl: 'https://example.test/a.pdf',
    landingPageUrl: 'https://example.test/a',
    source: 'mock',
    indexedIn: ['crossref'],
  }
  const source: PaperSource = {
    id: 'mock',
    label: 'Mock',
    supportsSuggestions: true,
    search: () => Promise.resolve({ papers: [paper], meta: { total: 1, page: 1, pageSize: 25, hasMore: false } }),
    getPaper: () => Promise.resolve(paper),
    getRelated: () => Promise.resolve([{ ...paper, id: 'W2', title: 'A related work' }]),
    getAuthor: (id): Promise<AuthorProfile> =>
      Promise.resolve({ id, name: 'Ada Test', orcid: '0000-0001', worksCount: 3, citedByCount: 120, topics: ['ML'] }),
    listAuthorWorks: (_authorId, query): Promise<SearchResult> =>
      Promise.resolve({ papers: [paper], meta: { total: 1, page: query.page, pageSize: query.pageSize, hasMore: false } }),
  }
  return {
    activeSourceId: 'mock',
    discoverySource: source,
    getSource: () => source,
    isDemoMode: true,
    sourceLabel: 'Mock',
  }
})

const { PaperPage } = await import('@/features/paper/PaperPage')

describe('PaperPage', () => {
  it('renders the abstract, metadata and related works', async () => {
    render(
      <MemoryRouter initialEntries={['/papers/W1']}>
        <PaperPage />
      </MemoryRouter>,
    )
    expect(await screen.findByRole('heading', { name: 'Abstract' })).toBeInTheDocument()
    expect(screen.getByText(/based on attention/)).toBeInTheDocument()
    expect(screen.getAllByText(/Ada Test/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Open access PDF', { exact: false })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Related works' })).toBeInTheDocument()
    expect(screen.getByText('A related work')).toBeInTheDocument()
  }, 10_000)
})

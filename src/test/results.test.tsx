import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { PaperSource, Paper, AuthorProfile, SearchResult } from '@/domain/papers'

vi.mock('@/services', () => {
  const mockPapers: Paper[] = [
    {
      id: 'W1', title: 'Quantum error correction with surface codes', doi: '10.9999/test.1',
      authors: [{ name: 'A. Researcher' }], publicationYear: 2024,
      venue: 'Journal of Tests', type: 'article', citationCount: 5,
      topics: ['Quantum error correction'], isOpenAccess: true,
      source: 'mock', indexedIn: [],
    },
    {
      id: 'W2', title: 'Scaling laws for quantum compute', doi: '10.9999/test.2',
      authors: [{ name: 'B. Scientist' }], publicationYear: 2023,
      venue: 'Review of Fictitious Methods', type: 'preprint', citationCount: 12,
      topics: ['Robust optimization'], isOpenAccess: false,
      source: 'mock', indexedIn: [],
    },
    {
      id: 'W3', title: 'Federated quantum networks', doi: '10.9999/test.3',
      authors: [{ name: 'C. Author' }, { name: 'D. Author' }], publicationYear: 2025,
      venue: 'Annals of the Toy Dataset', type: 'review', citationCount: 0,
      topics: ['Federated learning', 'Quantum error correction'],
      isOpenAccess: true, source: 'mock', indexedIn: [],
    },
  ]

  const total = 3
  const fakeSearch = (q: string): Promise<SearchResult> =>
    Promise.resolve({
      papers: mockPapers.filter(
        (p) =>
          q === '' ||
          q
            .toLowerCase()
            .split(/\s+/)
            .every((t) => p.title.toLowerCase().includes(t) || p.topics.some((x) => x.toLowerCase().includes(t))),
      ),
      meta: { total, page: 1, pageSize: 25, hasMore: false },
    })

  const fakePaper = (id: string): Paper =>
    mockPapers.find((p) => p.id === id) ?? mockPapers[0]

  const source: PaperSource = {
    id: 'mock',
    label: 'Mock',
    supportsSuggestions: true,
    search: (query) => fakeSearch(query.q),
    getPaper: (id) => Promise.resolve(fakePaper(id)),
    getRelated: () => Promise.resolve([]),
    getAuthor: (_authorId): Promise<AuthorProfile> =>
      Promise.resolve({ id: 'A1', name: 'Mock Author', topics: [] }),
    listAuthorWorks: (_authorId, query) =>
      Promise.resolve({ papers: [], meta: { total: 0, page: query.page, pageSize: query.pageSize, hasMore: false } }),
  }

  return {
    activeSourceId: 'mock',
    discoverySource: source,
    getSource: () => source,
    SEARCH_SOURCES: [
      { id: 'openalex', label: 'All / OpenAlex', shortLabel: 'OpenAlex', description: 'OpenAlex' },
      { id: 'europepmc', label: 'Biomedical / Europe PMC', shortLabel: 'Europe PMC', description: 'Europe PMC' },
    ],
    isDemoMode: true,
    sourceLabel: 'Mock',
  }
})

const { ResultsPage } = await import('@/features/results/ResultsPage')

describe('ResultsPage', () => {
  it('loads mock results and shows total, sort and pagination', async () => {
    render(
      <MemoryRouter initialEntries={['/search?q=quantum']}>
        <ResultsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Page 1 of 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Sort')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  }, 10_000)

  it('shows an empty state when nothing matches', async () => {
    render(
      <MemoryRouter initialEntries={['/search?q=zzzzznothingzzzzz']}>
        <ResultsPage />
      </MemoryRouter>,
    )
    expect(await screen.findByText(/Nothing matched/i)).toBeInTheDocument()
  }, 10_000)

  it('renders selectable source provider tabs with active indicator', async () => {
    render(
      <MemoryRouter initialEntries={['/search?q=quantum&source=europepmc']}>
        <ResultsPage />
      </MemoryRouter>,
    )
    const europePmcTab = screen.getByRole('tab', { name: 'Biomedical / Europe PMC' })
    expect(europePmcTab).toBeInTheDocument()
    expect(europePmcTab).toHaveAttribute('aria-selected', 'true')

    const openAlexTab = screen.getByRole('tab', { name: 'All / OpenAlex' })
    expect(openAlexTab).toBeInTheDocument()
    expect(openAlexTab).toHaveAttribute('aria-selected', 'false')
  }, 10_000)
})

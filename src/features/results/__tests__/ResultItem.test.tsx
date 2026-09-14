import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ResultItem } from '../ResultItem'
import type { Paper } from '@/domain/papers'

function makeTestPaper(partial: Partial<Paper>): Paper {
  return {
    id: 'W12345',
    title: 'Functional Genomics of Cell Death',
    authors: [{ name: 'Jane Doe' }],
    topics: ['Cell biology'],
    isOpenAccess: true,
    source: 'openalex',
    indexedIn: ['crossref'],
    ...partial,
  }
}

describe('ResultItem Provenance & Verification Badges', () => {
  it('renders single discovery source as Source: OpenAlex', () => {
    const paper = makeTestPaper({ source: 'openalex', alternateSources: undefined })
    render(
      <MemoryRouter>
        <ResultItem paper={paper} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Source: OpenAlex')).toBeInTheDocument()
    expect(screen.queryByText(/Metadata verified via Crossref/i)).not.toBeInTheDocument()
  })

  it('renders multiple discovery sources without conflating Crossref', () => {
    const paper = makeTestPaper({
      source: 'openalex',
      alternateSources: ['europepmc'],
    })
    render(
      <MemoryRouter>
        <ResultItem paper={paper} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Sources: OpenAlex · Europe PMC')).toBeInTheDocument()
  })

  it('renders distinct Metadata verified via Crossref badge when verified', () => {
    const paper = makeTestPaper({
      source: 'openalex',
      alternateSources: ['europepmc'],
      crossrefVerified: true,
    })
    render(
      <MemoryRouter>
        <ResultItem paper={paper} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Sources: OpenAlex · Europe PMC')).toBeInTheDocument()
    expect(screen.getByText('Metadata verified via Crossref')).toBeInTheDocument()
    // Verify it does NOT render "OPENALEX · CROSSREF" as combined sources
    expect(screen.queryByText(/Sources:.*Crossref/i)).not.toBeInTheDocument()
  })
})

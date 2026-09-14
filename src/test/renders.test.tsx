import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HomePage } from '@/features/home/HomePage'
import { NotFoundPage } from '@/features/home/NotFoundPage'

describe('HomePage', () => {
  it('renders the masthead, search affordance, differentiation and sources', () => {
    vi.stubEnv('VITE_DISCOVERY_SOURCE', 'mock')
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { name: /One search across/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /Where Vellum is different/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /Scholarly sources/i }),
    ).toBeInTheDocument()
  })
})

describe('NotFoundPage', () => {
  it('offers a way home', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: /Back to Vellum/i })).toHaveAttribute('href', '/')
  })
})

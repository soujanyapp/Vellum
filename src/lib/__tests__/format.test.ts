import { describe, expect, it } from 'vitest'
import {
  doiSuffix,
  formatCitationCount,
  formatPublicationDate,
  idSuffix,
  listAuthors,
} from '../format'

describe('formatCitationCount', () => {
  it('compacts large counts and localizes thousands', () => {
    expect(formatCitationCount(8751)).toMatch(/8\.8K|8,751/)
    expect(formatCitationCount(undefined)).toBe('—')
    expect(formatCitationCount(0)).toBe('0')
  })
})

describe('formatPublicationDate', () => {
  it('renders full dates and falls back to year', () => {
    expect(formatPublicationDate('2024-05-13')).toBe('13 May 2024')
    expect(formatPublicationDate('2024')).toBe('2024')
    expect(formatPublicationDate(undefined, 2020)).toBe('2020')
    expect(formatPublicationDate(undefined, undefined)).toBeNull()
  })
})

describe('doiSuffix', () => {
  it('strips the registry host', () => {
    expect(doiSuffix('https://doi.org/10.1000/xyz')).toBe('10.1000/xyz')
    expect(doiSuffix('10.1000/xyz')).toBe('10.1000/xyz')
    expect(doiSuffix(undefined)).toBeNull()
  })
})

describe('idSuffix', () => {
  it('extracts the trailing identifier', () => {
    expect(idSuffix('https://openalex.org/W123')).toBe('W123')
    expect(idSuffix('W123')).toBe('W123')
  })
})

describe('listAuthors', () => {
  it('truncates long author lists with et al.', () => {
    const names = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((name) => ({ name }))
    expect(listAuthors(names, 5)).toBe('A, B, C, D, E, et al. (2)')
    expect(listAuthors([{ name: 'Solo' }])).toBe('Solo')
    expect(listAuthors([])).toBe('Anonymous')
    expect(listAuthors(names.slice(0, 6))).toBe('A, B, C, D, E, F')
  })
})

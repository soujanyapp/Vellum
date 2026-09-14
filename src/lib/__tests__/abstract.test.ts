import { describe, expect, it } from 'vitest'
import { abstractFromInvertedIndex, isInvertedIndexEmpty } from '../abstract'

describe('abstractFromInvertedIndex', () => {
  it('reassembles a simple inverted index', () => {
    const index = {
      declarations: [0],
      causes: [1, 4],
      actions: [1],
      are: [2],
      claims: [3],
    }
    const text = abstractFromInvertedIndex(index)
    expect(text).toBe('declarations causes actions are claims causes')
  })

  it('interleaves words sharing a position in deterministic order', () => {
    const index = {
      has: [1],
      served: [2],
      holds: [0],
      self: [2],
    }
    expect(abstractFromInvertedIndex(index)).toBe('holds has served self')
  })

  it('returns null for empty or missing index', () => {
    expect(abstractFromInvertedIndex(null)).toBeNull()
    expect(abstractFromInvertedIndex(undefined)).toBeNull()
    expect(abstractFromInvertedIndex({})).toBeNull()
  })

  it('handles punctuation as separate tokens untouched', () => {
    const index = { 'First,': [0], 'second': [1] }
    expect(abstractFromInvertedIndex(index)).toBe('First, second')
  })
})

describe('isInvertedIndexEmpty', () => {
  it('flags null/undefined/empty objects', () => {
    expect(isInvertedIndexEmpty(null)).toBe(true)
    expect(isInvertedIndexEmpty({})).toBe(true)
    expect(isInvertedIndexEmpty({ the: [0] })).toBe(false)
  })
})

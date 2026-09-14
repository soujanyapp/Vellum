import { useEffect, useState } from 'react'
import type { Paper } from '@/domain/papers'
import { discoverySource } from '@/services'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

const SUGGEST_COUNT = 6
const DEBOUNCE_MS = 220

export interface SuggestionsState {
  suggestions: Paper[]
  isLoading: boolean
}

/**
 * Debounced, abortable suggestion lookup for the search combobox.
 * Stalls while the field is empty so no requests leak out.
 */
export function useSuggestions(rawQuery: string): SuggestionsState {
  const query = useDebouncedValue(rawQuery, DEBOUNCE_MS)
  const [results, setResults] = useState<SuggestionsState>({
    suggestions: [],
    isLoading: false,
  })

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults({ suggestions: [], isLoading: false })
      return
    }
    const controller = new AbortController()
    setResults((prev) => ({ ...prev, isLoading: true }))
    discoverySource
      .search(
        { q, page: 1, pageSize: SUGGEST_COUNT, sort: 'relevance' },
        controller.signal,
      )
      .then((result) =>
        setResults({ suggestions: result.papers, isLoading: false }),
      )
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          setResults({ suggestions: [], isLoading: false })
        }
      })
    return () => controller.abort()
  }, [query])

  return results
}

import { useCallback, useEffect, useState } from 'react'

export interface AsyncState<T> {
  data?: T
  error?: unknown
  isLoading: boolean
  /** true only during refresh of already-present data */
  isRefreshing: boolean
}

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const cache = new Map<string, CacheEntry<unknown>>()
const MAX_ENTRIES = 100

/**
 * Runs an async fetcher whenever `dependencies` change.
 *
 * - New fetches abort/supersede in-flight ones (search cancellation).
 * - Successful responses are cached by `cacheKey` with a TTL, so navigating
 *   back to a page paints instantly while a fresh copy revalidates.
 */
export function useAsyncData<T>(
  cacheKey: string | null,
  fetcher: (signal: AbortSignal) => Promise<T>,
  dependencies: unknown[],
  staleMs = 60_000,
): AsyncState<T> & { refetch: () => void } {
  const now = Date.now()
  const [data, setData] = useState<T | undefined>(() => {
    if (cacheKey === null) return undefined
    const entry = cache.get(cacheKey) as CacheEntry<T> | undefined
    return entry?.value
  })
  const [error, setError] = useState<unknown>(undefined)
  const [isLoading, setIsLoading] = useState(() => {
    if (cacheKey === null) return true
    const entry = cache.get(cacheKey)
    return !entry || entry.expiresAt < now
  })
  const [isRefreshing, setIsRefreshing] = useState(false)

  const run = useCallback(
    (signal: AbortSignal) => {
      setError(undefined)
      const entry = cacheKey === null ? undefined : cache.get(cacheKey)
      setIsRefreshing(entry !== undefined && entry.expiresAt >= Date.now())
      setIsLoading(cacheKey === null || entry === undefined)
      fetcher(signal)
        .then((value) => {
          setData(value)
          setIsLoading(false)
          setIsRefreshing(false)
          if (cacheKey !== null) {
            if (cache.size >= MAX_ENTRIES) {
              const oldest = cache.keys().next().value
              if (oldest !== undefined) cache.delete(oldest)
            }
            cache.set(cacheKey, { value, expiresAt: Date.now() + staleMs })
          }
        })
        .catch((err: unknown) => {
          const aborted =
            err instanceof DOMException && err.name === 'AbortError'
          if (!aborted) {
            setError(err)
            setIsLoading(false)
            setIsRefreshing(false)
          }
        })
    },
    [cacheKey, fetcher, staleMs],
  )

  useEffect(() => {
    const controller = new AbortController()
    if (cacheKey !== null) {
      const cached = cache.get(cacheKey) as CacheEntry<T> | undefined
      if (cached !== undefined) {
        setData(cached.value)
      } else {
        setData(undefined)
      }
    } else {
      setData(undefined)
    }
    setError(undefined)
    run(controller.signal)
    return () => {
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies])

  const refetch = useCallback(() => {
    const controller = new AbortController()
    run(controller.signal)
  }, [run])

  return { data, error, isLoading, isRefreshing, refetch }
}

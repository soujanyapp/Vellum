/**
 * Minimal HTTP layer for provider calls.
 *
 * - AbortSignal support (search cancellation between keystrokes/pages).
 * - Small in-memory cache keyed by URL with a TTL — gives instant back-nav
 *   and absorbs repeated page visits without hammering the provider budget.
 * - Captures provider rate-limit headers for honest UI messaging.
 */

export interface HttpResult<T> {
  data: T
  /** remaining requests in the current budget window, when the provider says */
  remaining?: number
  limit?: number
}

export class HttpError extends Error {
  readonly status: number
  readonly retryAfterMs?: number

  constructor(status: number, message: string, retryAfterSec?: string | null) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    if (retryAfterSec) {
      this.retryAfterMs = Number(retryAfterSec) * 1000
    }
  }
}

export interface HttpOptions {
  signal?: AbortSignal
  /** bypass the cache (e.g. forced refresh) */
  fresh?: boolean
  /** seconds before the cached copy is considered stale */
  ttlMs?: number
}

interface CacheEntry {
  value: unknown
  expiresAt: number
}

const cache = new Map<string, CacheEntry>()
const DEFAULT_TTL_MS = 60_000
const MAX_CACHE_ENTRIES = 200

function readFromCache<T>(url: string): T | undefined {
  const entry = cache.get(url)
  if (!entry) return undefined
  if (entry.expiresAt < Date.now()) {
    cache.delete(url)
    return undefined
  }
  return entry.value as T
}

function writeToCache(url: string, value: unknown, ttlMs: number): void {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(url, { value, expiresAt: Date.now() + ttlMs })
}

export async function httpGet<T>(
  url: string,
  options: HttpOptions = {},
): Promise<HttpResult<T>> {
  const { signal, fresh = false, ttlMs = DEFAULT_TTL_MS } = options

  if (!fresh) {
    const cached = readFromCache<T>(url)
    if (cached !== undefined) return { data: cached }
  }

  let res: Response
  try {
    res = await fetch(url, { signal, headers: { Accept: 'application/json' } })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err
    }
    throw new HttpError(0, 'Network request failed. Check your connection and try again.')
  }

  if (!res.ok) {
    // 429 carries Retry-After; expose so the UI can offer a calm retry.
    const retryAfter = res.headers.get('retry-after')
    throw new HttpError(res.status, `Provider returned HTTP ${res.status}`, retryAfter)
  }

  const data = (await res.json()) as T
  if (!fresh) writeToCache(url, data, ttlMs)

  const remaining = res.headers.get('x-ratelimit-remaining')
  const limit = res.headers.get('x-ratelimit-limit')

  return {
    data,
    remaining: remaining ? Number(remaining) : undefined,
    limit: limit ? Number(limit) : undefined,
  }
}
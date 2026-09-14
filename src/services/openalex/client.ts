import { httpGet, HttpError } from '@/lib/http'
import type {
  OpenAlexAuthorDetail,
  OpenAlexWork,
  OpenAlexWorkList,
} from './types'
import {
  buildAuthorUrl,
  buildAuthorWorksUrl,
  buildWorkUrl,
  buildWorksByIdsUrl,
  buildWorksUrl,
} from './buildQuery'
import type { SearchQuery } from '@/domain/papers'

/**
 * Thin network client for OpenAlex. Returns raw payloads plus the
 * provider's rate-limit budget so the UI can message honestly.
 */

export interface OpenAlexResult<T> {
  data: T
  remaining?: number
  limit?: number
}

export async function fetchWorks(
  query: SearchQuery,
  signal?: AbortSignal,
): Promise<OpenAlexResult<OpenAlexWorkList>> {
  return httpGet<OpenAlexWorkList>(buildWorksUrl(query), { signal })
}

export async function fetchWork(
  workId: string,
  signal?: AbortSignal,
): Promise<OpenAlexResult<OpenAlexWork>> {
  return httpGet<OpenAlexWork>(buildWorkUrl(workId), { signal })
}

export async function fetchWorksByIds(
  ids: string[],
  signal?: AbortSignal,
): Promise<OpenAlexResult<OpenAlexWorkList>> {
  if (ids.length === 0) {
    return { data: { meta: { count: 0 }, results: [] } }
  }
  return httpGet<OpenAlexWorkList>(buildWorksByIdsUrl(ids), { signal })
}

export async function fetchAuthor(
  authorId: string,
  signal?: AbortSignal,
): Promise<OpenAlexResult<OpenAlexAuthorDetail>> {
  return httpGet<OpenAlexAuthorDetail>(buildAuthorUrl(authorId), { signal })
}

export async function fetchAuthorWorks(
  authorId: string,
  query: Pick<SearchQuery, 'page' | 'pageSize' | 'sort'>,
  signal?: AbortSignal,
): Promise<OpenAlexResult<OpenAlexWorkList>> {
  return httpGet<OpenAlexWorkList>(buildAuthorWorksUrl(authorId, query), { signal })
}

export function isNotFoundError(err: unknown): boolean {
  return err instanceof HttpError && err.status === 404
}
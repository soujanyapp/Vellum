import { httpGet, HttpError, type HttpResult } from '@/lib/http'
import type { EuropePmcResponse, EuropePmcWork } from './types'
import { buildSearchUrl, buildWorkUrl } from './buildQuery'
import type { SearchQuery } from '@/domain/papers'

export async function fetchWorks(
  query: SearchQuery,
  signal?: AbortSignal,
): Promise<HttpResult<EuropePmcResponse>> {
  return httpGet<EuropePmcResponse>(buildSearchUrl(query), { signal })
}

export async function fetchWork(
  paperId: string,
  signal?: AbortSignal,
): Promise<HttpResult<EuropePmcWork>> {
  const result = await httpGet<EuropePmcResponse>(buildWorkUrl(paperId), { signal })
  const first = result.data.resultList?.result?.[0]
  if (!first) {
    throw new HttpError(404, `Work not found: ${paperId}`)
  }
  return {
    data: first,
    remaining: result.remaining,
    limit: result.limit,
  }
}

import { httpGet, HttpError, type HttpResult } from '@/lib/http'
import type { CrossrefResponse, CrossrefWork, CrossrefWorksMessage } from './types'
import { normalizeDoi } from '@/lib/dedup'

const BASE_URL = 'https://api.crossref.org'
const POLITE_EMAIL = 'support@vellum-research.org'

export async function fetchCrossrefWork(
  doi: string,
  signal?: AbortSignal,
): Promise<HttpResult<CrossrefWork>> {
  const cleanDoi = normalizeDoi(doi)
  if (!cleanDoi) {
    throw new HttpError(400, 'Invalid DOI')
  }

  const url = `${BASE_URL}/works/${encodeURIComponent(cleanDoi)}?mailto=${encodeURIComponent(POLITE_EMAIL)}`
  const res = await httpGet<CrossrefResponse<CrossrefWork>>(url, { signal })
  return {
    data: res.data.message,
    remaining: res.remaining,
    limit: res.limit,
  }
}

export async function searchCrossrefWorks(
  query: string,
  rows = 25,
  offset = 0,
  signal?: AbortSignal,
): Promise<HttpResult<CrossrefWorksMessage>> {
  const params = new URLSearchParams()
  params.set('query', query.trim() || '*')
  params.set('rows', String(Math.min(100, Math.max(1, rows))))
  params.set('offset', String(Math.max(0, offset)))
  params.set('mailto', POLITE_EMAIL)

  const url = `${BASE_URL}/works?${params.toString()}`
  const res = await httpGet<CrossrefResponse<CrossrefWorksMessage>>(url, { signal })
  return {
    data: res.data.message,
    remaining: res.remaining,
    limit: res.limit,
  }
}

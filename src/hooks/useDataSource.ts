import { useMemo } from 'react'
import type {
  AuthorProfile,
  Paper,
  SearchQuery,
  SearchResult,
  SortOrder,
  SourceId,
} from '@/domain/papers'
import { useAsyncData } from './useAsyncData'
import { getSource, discoverySource } from '@/services'
import { deduplicatePapers } from '@/lib/dedup'
import { enrichPaperWithCrossref } from '@/services/crossref'

export interface AnyQuery {
  q: string
  page: number
  pageSize: number
  fromYear?: number
  toYear?: number
  openAccessOnly?: boolean
  type?: string
  language?: string
  venueId?: string
  minCitations?: number
  sort: SortOrder
  source?: SourceId
}

function useMemoStableSearchQuery(
  props: AnyQuery,
): SearchQuery {
  return useMemo<SearchQuery>(
    () => ({
      q: props.q,
      page: props.page,
      pageSize: props.pageSize,
      fromYear: props.fromYear,
      toYear: props.toYear,
      openAccessOnly: props.openAccessOnly,
      type: props.type,
      language: props.language,
      venueId: props.venueId,
      minCitations: props.minCitations,
      sort: props.sort,
      source: props.source,
    }),
    [
      props.q,
      props.page,
      props.pageSize,
      props.fromYear,
      props.toYear,
      props.openAccessOnly,
      props.type,
      props.language,
      props.venueId,
      props.minCitations,
      props.sort,
      props.source,
    ],
  )
}

/** Result set for the current search + filter configuration. */
export function useSearchResults(props: AnyQuery) {
  const query = useMemoStableSearchQuery(props)
  const source = getSource(query.source)
  const key = `results:${source.id}:${JSON.stringify(query)}`

  return useAsyncData<SearchResult>(
    key,
    async (signal) => {
      const res = await source.search(query, signal)
      return {
        ...res,
        papers: deduplicatePapers(res.papers),
      }
    },
    [
      source.id,
      query.q,
      query.page,
      query.fromYear,
      query.toYear,
      query.openAccessOnly,
      query.type,
      query.language,
      query.venueId,
      query.minCitations,
      query.sort,
      query.source,
    ],
  )
}

export function usePaper(paperId: string) {
  return useAsyncData<Paper>(
    `paper:${paperId}`,
    async (signal) => {
      // If the ID looks like a PMC/EPMC id, use Europe PMC, otherwise discovery source
      const source = paperId.startsWith('PMC') || paperId.startsWith('epmc:') || paperId.startsWith('pmid:')
        ? getSource('europepmc')
        : discoverySource

      const paper = await source.getPaper(paperId, signal)
      // Enrich with canonical Crossref publisher verification when DOI exists
      return enrichPaperWithCrossref(paper, signal)
    },
    [paperId],
  )
}

export function useRelatedPapers(paperId: string) {
  return useAsyncData<Paper[]>(
    `related:${paperId}`,
    (signal) => discoverySource.getRelated(paperId, signal),
    [paperId],
  )
}

export function useAuthor(authorId: string) {
  return useAsyncData<AuthorProfile>(
    `author:${authorId}`,
    (signal) => discoverySource.getAuthor(authorId, signal),
    [authorId],
  )
}

export function useAuthorWorks(
  authorId: string,
  page: number,
  pageSize: number,
) {
  const query = useMemo(
    () => ({ page, pageSize, sort: 'cited_by_count' as const }),
    [page, pageSize],
  )
  return useAsyncData<SearchResult>(
    `author-works:${authorId}:${page}`,
    (signal) => discoverySource.listAuthorWorks(authorId, query, signal),
    [authorId, page],
  )
}

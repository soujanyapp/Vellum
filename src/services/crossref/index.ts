import type {
  AuthorProfile,
  Paper,
  PaperSource,
  SearchResult,
} from '@/domain/papers'
import { fetchCrossrefWork, searchCrossrefWorks } from './client'
import { normalizeCrossrefWork } from './normalize'
import { enrichPaperWithCrossref } from './enrich'

export const crossrefSource: PaperSource = {
  id: 'crossref',
  label: 'Crossref (Publisher Records)',
  supportsSuggestions: false,

  async search(query, signal): Promise<SearchResult> {
    const offset = (Math.max(1, query.page) - 1) * query.pageSize
    const { data, remaining } = await searchCrossrefWorks(
      query.q,
      query.pageSize,
      offset,
      signal,
    )
    const papers = (data.items ?? []).map(normalizeCrossrefWork)

    return {
      papers,
      meta: {
        total: data['total-results'] ?? papers.length,
        page: query.page,
        pageSize: query.pageSize,
        hasMore: offset + papers.length < (data['total-results'] ?? 0),
        remaining,
      },
    }
  },

  async getPaper(paperId, signal): Promise<Paper> {
    const { data } = await fetchCrossrefWork(paperId, signal)
    return normalizeCrossrefWork(data)
  },

  async getRelated(): Promise<Paper[]> {
    return []
  },

  async getAuthor(authorId): Promise<AuthorProfile> {
    return {
      id: authorId,
      name: authorId,
      topics: [],
    }
  },

  async listAuthorWorks(authorId, query, signal): Promise<SearchResult> {
    const offset = (Math.max(1, query.page) - 1) * query.pageSize
    const { data, remaining } = await searchCrossrefWorks(
      `author:"${authorId}"`,
      query.pageSize,
      offset,
      signal,
    )
    const papers = (data.items ?? []).map(normalizeCrossrefWork)
    return {
      papers,
      meta: {
        total: data['total-results'] ?? papers.length,
        page: query.page,
        pageSize: query.pageSize,
        hasMore: offset + papers.length < (data['total-results'] ?? 0),
        remaining,
      },
    }
  },
}

export { enrichPaperWithCrossref }

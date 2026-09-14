import type {
  AuthorProfile,
  Paper,
  PaperSource,
  SearchResult,
} from '@/domain/papers'
import {
  fetchAuthor,
  fetchAuthorWorks,
  fetchWork,
  fetchWorks,
  fetchWorksByIds,
} from './client'
import { isNotFoundError } from './client'
import {
  normalizeAuthor,
  normalizeWork,
  normalizeWorksList,
} from './normalize'

/**
 * OpenAlex-backed implementation of the domain PaperSource.
 * The only module allowed to know OpenAlex's wire format.
 */
export const openAlexSource: PaperSource = {
  id: 'openalex',
  label: 'OpenAlex',
  supportsSuggestions: true,

  async search(query, signal) {
    const { data, remaining } = await fetchWorks(query, signal)
    const normalized = normalizeWorksList(data, query.pageSize)
    return {
      papers: normalized.papers,
      meta: {
        total: normalized.total,
        page: normalized.page,
        pageSize: normalized.pageSize,
        hasMore: normalized.page * normalized.pageSize < normalized.total,
        remaining,
      },
    }
  },

  async getPaper(paperId, signal) {
    const { data } = await fetchWork(paperId, signal)
    return normalizeWork(data)
  },

  async getRelated(paperId, signal) {
    const { data } = await fetchWork(paperId, signal)
    const related = (data.related_works ?? []).filter(
      (id) => id !== paperId,
    )
    if (related.length === 0) return []
    const { data: list } = await fetchWorksByIds(related, signal)
    return list.results.map(normalizeWork)
  },

  async getAuthor(authorId, signal) {
    const { data } = await fetchAuthor(authorId, signal)
    return normalizeAuthor(data)
  },

  async listAuthorWorks(
    authorId,
    query,
    signal,
  ): Promise<SearchResult> {
    const { data, remaining } = await fetchAuthorWorks(authorId, query, signal)
    const normalized = normalizeWorksList(data, query.pageSize)
    return {
      papers: normalized.papers,
      meta: {
        total: normalized.total,
        page: normalized.page,
        pageSize: normalized.pageSize,
        hasMore: normalized.page * normalized.pageSize < normalized.total,
        remaining,
      },
    }
  },
}

export { isNotFoundError }

export type { Paper, AuthorProfile }
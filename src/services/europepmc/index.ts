import type {
  PaperSource,
  SearchResult,
} from '@/domain/papers'
import { fetchWork, fetchWorks } from './client'
import { normalizeWork, normalizeWorksList } from './normalize'

export const europePmcSource: PaperSource = {
  id: 'europepmc',
  label: 'Europe PMC (Biomedical)',
  supportsSuggestions: false,

  async search(query, signal) {
    const { data, remaining } = await fetchWorks(query, signal)
    const normalized = normalizeWorksList(data, query.pageSize, query.page)
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
    // Lookup the paper first to retrieve its title/keywords
    try {
      const { data } = await fetchWork(paperId, signal)
      const kw = data.keywordList?.keyword?.[0] || data.title.split(' ').slice(0, 3).join(' ')
      if (!kw) return []

      const relatedRes = await fetchWorks(
        {
          q: kw,
          page: 1,
          pageSize: 6,
          sort: 'relevance',
        },
        signal,
      )
      const normalized = normalizeWorksList(relatedRes.data, 6, 1)
      return normalized.papers.filter((p) => p.id !== paperId).slice(0, 5)
    } catch {
      return []
    }
  },

  async getAuthor(authorId, signal) {
    // Query works by this author ORCID or name
    const res = await fetchWorks(
      {
        q: `AUTH:"${authorId}"`,
        page: 1,
        pageSize: 10,
        sort: 'cited_by_count',
      },
      signal,
    )
    const normalized = normalizeWorksList(res.data, 10, 1)
    const firstAuthor = normalized.papers[0]?.authors.find(
      (a) => a.id === authorId || a.name.toLowerCase().includes(authorId.toLowerCase()),
    )

    return {
      id: authorId,
      name: firstAuthor?.name || authorId,
      orcid: firstAuthor?.orcid,
      worksCount: normalized.total,
      topics: normalized.papers.flatMap((p) => p.topics).slice(0, 5),
    }
  },

  async listAuthorWorks(authorId, query, signal): Promise<SearchResult> {
    const res = await fetchWorks(
      {
        q: `AUTH:"${authorId}"`,
        page: query.page,
        pageSize: query.pageSize,
        sort: query.sort,
      },
      signal,
    )
    const normalized = normalizeWorksList(res.data, query.pageSize, query.page)
    return {
      papers: normalized.papers,
      meta: {
        total: normalized.total,
        page: normalized.page,
        pageSize: normalized.pageSize,
        hasMore: normalized.page * normalized.pageSize < normalized.total,
        remaining: res.remaining,
      },
    }
  },
}

import type { AuthorProfile, Paper, TopicTag } from '@/domain/papers'
import { abstractFromInvertedIndex } from '@/lib/abstract'
import { doiSuffix } from '@/lib/format'
import type {
  OpenAlexAuthorDetail,
  OpenAlexWork,
  OpenAlexWorkList,
} from './types'

/**
 * Normalizes OpenAlex /works payloads into the domain Paper model.
 * Pure — kept separate from network concerns for unit testing.
 */

const OPENALEX_SOURCE = 'openalex' as const

function normalizeAuthors(
  work: OpenAlexWork,
  limit = 25,
): Paper['authors'] {
  const authorships = work.authorships ?? []
  return authorships.slice(0, limit).map((a) => ({
    name: a.author.display_name,
    id: a.author.id,
    orcid: a.author.orcid ?? undefined,
  }))
}

function normalizeTopics(work: OpenAlexWork): string[] {
  const out: string[] = []
  for (const t of work.topics ?? []) {
    if (t.display_name) out.push(t.display_name)
  }
  for (const c of work.concepts ?? []) {
    if (c.display_name && !out.includes(c.display_name)) out.push(c.display_name)
  }
  return out.slice(0, 8)
}

/** Structured topic metadata with hierarchy and scores for analysis features. */
function normalizeTopicMetadata(work: OpenAlexWork): TopicTag[] | undefined {
  const topics = work.topics
  if (!topics || topics.length === 0) return undefined
  return topics.slice(0, 8).map((t) => ({
    name: t.display_name,
    score: t.score ?? undefined,
    id: t.id ?? undefined,
    field: t.field?.display_name ?? undefined,
    subfield: t.subfield?.display_name ?? undefined,
    domain: t.domain?.display_name ?? undefined,
  }))
}

export function normalizeWork(work: OpenAlexWork): Paper {
  const primaryLocation = work.primary_location ?? null
  const source = primaryLocation?.source ?? null
  const bestOa = work.best_oa_location ?? null

  const pdfUrl =
    primaryLocation?.pdf_url ?? bestOa?.pdf_url ?? undefined
  const landingPageUrl =
    primaryLocation?.landing_page_url ?? bestOa?.landing_page_url ?? undefined

  const doi = doiSuffix(work.doi ?? undefined) ?? undefined
  const abstract = abstractFromInvertedIndex(work.abstract_inverted_index) ?? undefined

  const biblio = work.biblio
  const venue =
    source?.display_name ??
    (primaryLocation?.landing_page_url ? 'Publisher' : undefined)

  return {
    id: work.id,
    doi,
    title: work.title ?? work.display_name ?? 'Untitled work',
    abstract,
    authors: normalizeAuthors(work),
    publicationDate: work.publication_date ?? undefined,
    publicationYear: work.publication_year ?? undefined,
    venue,
    biblio:
      biblio && (biblio.volume || biblio.issue || biblio.first_page || biblio.last_page)
        ? {
            volume: biblio.volume ?? undefined,
            issue: biblio.issue ?? undefined,
            firstPage: biblio.first_page ?? undefined,
            lastPage: biblio.last_page ?? undefined,
          }
        : undefined,
    type: work.type ?? undefined,
    citationCount: work.cited_by_count ?? undefined,
    topics: normalizeTopics(work),
    topicMetadata: normalizeTopicMetadata(work),
    language: work.language ?? undefined,
    isOpenAccess: Boolean(work.open_access?.is_oa),
    openAccessStatus: work.open_access?.oa_status ?? undefined,
    pdfUrl,
    landingPageUrl,
    source: OPENALEX_SOURCE,
    indexedIn: work.indexed_in ?? [],
    isRetracted: work.is_retracted ?? false,
    relevanceScore: work.relevance_score ?? undefined,
  }
}

export function normalizeWorksList(
  payload: OpenAlexWorkList,
  requestedPageSize: number,
): { papers: Paper[]; total: number; page: number; pageSize: number } {
  return {
    papers: payload.results.map(normalizeWork),
    total: payload.meta.count ?? 0,
    page: payload.meta.page ?? 1,
    pageSize: requestedPageSize,
  }
}

export function normalizeAuthor(
  detail: OpenAlexAuthorDetail,
): AuthorProfile {
  const institutions =
    detail.last_known_institutions ??
    detail.affiliations
      ?.map((a) => a?.institution?.display_name)
      .filter((name): name is string => Boolean(name)) ??
    []

  return {
    id: detail.id,
    name: detail.display_name ?? 'Unknown author',
    orcid: detail.orcid ?? undefined,
    worksCount: detail.works_count ?? undefined,
    citedByCount: detail.cited_by_count ?? undefined,
    topics: (detail.topics ?? [])
      .map((t) => t.display_name)
      .filter((name): name is string => Boolean(name))
      .slice(0, 8),
    affiliation:
      institutions.find((name): name is string => Boolean(name)) ?? undefined,
  }
}
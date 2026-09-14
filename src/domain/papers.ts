/**
 * Vellum domain model.
 *
 * These types are the single vocabulary the UI speaks. Provider payloads
 * (OpenAlex, Crossref, Semantic Scholar, …) are normalized into this shape at
 * the service boundary, so React never touches a provider response directly.
 */

export type SourceId = 'openalex' | 'europepmc' | 'crossref' | 'semantic-scholar' | 'arxiv' | 'mock'

export interface Author {
  name: string
  /** Provider-specific identifier (e.g. OpenAlex author id) */
  id?: string
  orcid?: string
}

/**
 * Structured topic with hierarchy and prediction score.
 * Complements the flat `Paper.topics: string[]` field with richer metadata
 * used by post-search intelligence features.
 */
export interface TopicTag {
  name: string
  /** Prediction confidence 0–1 from the provider's topic model. */
  score?: number
  /** Provider-specific topic identifier. */
  id?: string
  /** Parent field name (OpenAlex 4-level hierarchy). */
  field?: string
  /** Parent subfield name. */
  subfield?: string
  /** Top-level domain name. */
  domain?: string
}

/**
 * A single transparent annotation explaining why a paper was surfaced.
 * Computed locally from result-set metadata — never fabricated.
 */
export interface AnnotationLabel {
  kind:
    | 'relevance'
    | 'highly-cited'
    | 'topic-central'
    | 'recent'
    | 'review'
  /** Human-readable label shown in the UI. */
  text: string
  /** One-line explanation of how this signal was derived. */
  detail: string
}

export interface Biblio {
  volume?: string
  issue?: string
  firstPage?: string
  lastPage?: string
}

export interface Paper {
  /** Provider-specific work identifier (OpenAlex work id or PMC/EuropePMC id). */
  id: string
  doi?: string
  title: string
  /** Full abstract text if the provider supplies one. */
  abstract?: string
  authors: Author[]
  /** ISO 8601 date, may be partial (YYYY or YYYY-MM). */
  publicationDate?: string
  publicationYear?: number
  /** Journal / archive / repository display name. */
  venue?: string
  biblio?: Biblio
  /** Work form: article | preprint | review | book-chapter | … */
  type?: string
  citationCount?: number
  /** Research topic / concept labels contributed by the source. */
  topics: string[]
  /**
   * Structured topic metadata with hierarchy and scores.
   * Populated when the provider supplies enriched topic data.
   * Not consumed by existing UI — used by annotation/analysis features.
   */
  topicMetadata?: TopicTag[]
  language?: string
  isOpenAccess: boolean
  openAccessStatus?: string
  pdfUrl?: string
  landingPageUrl?: string
  fullTextUrl?: string
  source: SourceId
  /** Additional sources that corroborated or enriched this paper record. */
  alternateSources?: SourceId[]
  /** PubMed Central ID if available (e.g. PMC13227603). */
  pmcid?: string
  /** PubMed ID if available. */
  pmid?: string
  /** Platforms that indexed this work (e.g. 'arxiv', 'crossref', 'pubmed', 'europepmc'). */
  indexedIn: string[]
  isRetracted?: boolean
  /** Whether canonical metadata was verified against Crossref deposits. */
  crossrefVerified?: boolean
  /** Relevance score, only meaningful within a search result set. */
  relevanceScore?: number
}

export interface AuthorProfile {
  id: string
  name: string
  orcid?: string
  /** Document count indexed for this author. */
  worksCount?: number
  /** Sum of citations across indexed works. */
  citedByCount?: number
  topics: string[]
  /** Most recent affiliation name, when provided. */
  affiliation?: string
}

export type SortOrder =
  | 'relevance'
  | 'cited_by_count'
  | 'publication_date'

/** Domain-language query — providers translate this to their own syntax. */
export interface SearchQuery {
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
  /** Target provider for this query; defaults to the primary discovery source if omitted. */
  source?: SourceId
}

export interface SearchMeta {
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  /** Provider rate-limit budget (requests remaining this window). */
  remaining?: number
  offset?: number
}

export interface SearchResult {
  papers: Paper[]
  meta: SearchMeta
}

export interface PaperSource {
  readonly id: SourceId
  readonly label: string
  readonly supportsSuggestions: boolean
  search(query: SearchQuery, signal?: AbortSignal): Promise<SearchResult>
  getPaper(paperId: string, signal?: AbortSignal): Promise<Paper>
  getRelated(paperId: string, signal?: AbortSignal): Promise<Paper[]>
  getAuthor(authorId: string, signal?: AbortSignal): Promise<AuthorProfile>
  listAuthorWorks(
    authorId: string,
    query: Pick<SearchQuery, 'page' | 'pageSize' | 'sort'>,
    signal?: AbortSignal,
  ): Promise<SearchResult>
}

/** Facet counts derived from a result page, for the results index. */
export interface FacetDerived {
  types: Array<{ label: string; count: number }>
  languages: Array<{ label: string; count: number }>
}
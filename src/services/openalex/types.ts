/**
 * OpenAlex API — raw response shapes (subset we consume).
 * https://docs.openalex.org
 */

export interface OpenAlexMeta {
  count: number
  page?: number
  db_response_time_ms?: number
}

export interface OpenAlexAuthorBrief {
  id: string
  display_name: string
  orcid?: string | null
}

export interface OpenAlexAuthorship {
  author: OpenAlexAuthorBrief
  author_position?: string
}

export interface OpenAlexLocation {
  source?: {
    id?: string | null
    display_name?: string | null
  } | null
  landing_page_url?: string | null
  pdf_url?: string | null
}

export interface OpenAlexBiblio {
  volume?: string | null
  issue?: string | null
  first_page?: string | null
  last_page?: string | null
}

export interface OpenAlexOpenAccess {
  is_oa: boolean
  oa_status?: string | null
}

export interface OpenAlexConcept {
  display_name: string
  score?: number
}

/**
 * OpenAlex topic — includes hierarchical metadata.
 * Extends the simpler concept shape with subfield/field/domain references.
 */
export interface OpenAlexTopic {
  id?: string | null
  display_name: string
  score?: number
  subfield?: { id?: string | null; display_name?: string | null } | null
  field?: { id?: string | null; display_name?: string | null } | null
  domain?: { id?: string | null; display_name?: string | null } | null
}

export interface OpenAlexWork {
  id: string
  doi?: string | null
  title?: string | null
  display_name?: string | null
  abstract_inverted_index?: Record<string, number[]> | null
  publication_date?: string | null
  publication_year?: number | null
  type?: string | null
  language?: string | null
  cited_by_count?: number | null
  relevance_score?: number | null
  is_retracted?: boolean | null
  open_access?: OpenAlexOpenAccess | null
  best_oa_location?: OpenAlexLocation | null
  primary_location?: OpenAlexLocation | null
  biblio?: OpenAlexBiblio | null
  authorships?: OpenAlexAuthorship[] | null
  concepts?: OpenAlexConcept[] | null
  topics?: OpenAlexTopic[] | null
  related_works?: string[] | null
  indexed_in?: string[] | null
}

export interface OpenAlexWorkList {
  meta: OpenAlexMeta
  results: OpenAlexWork[]
}

export interface OpenAlexAuthorDetail {
  id: string
  display_name?: string | null
  orcid?: string | null
  works_count?: number | null
  cited_by_count?: number | null
  topics?: OpenAlexConcept[] | null
  last_known_institutions?: Array<{
    display_name?: string | null
  } | null> | null
  affiliations?: Array<{
    institution?: { display_name?: string | null } | null
  } | null> | null
}
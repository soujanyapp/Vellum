/**
 * Crossref REST API wire types.
 * Official schema reference: https://api.crossref.org/swagger-ui/index.html
 */

export interface CrossrefAffiliation {
  name: string
}

export interface CrossrefAuthor {
  given?: string
  family?: string
  name?: string
  sequence?: string
  ORCID?: string
  affiliation?: CrossrefAffiliation[]
}

export interface CrossrefDateParts {
  'date-parts'?: number[][]
}

export interface CrossrefLink {
  URL: string
  'content-type'?: string
  'content-version'?: string
  'intended-application'?: string
}

export interface CrossrefWork {
  DOI: string
  title?: string[]
  author?: CrossrefAuthor[]
  'container-title'?: string[]
  published?: CrossrefDateParts
  'published-print'?: CrossrefDateParts
  'published-online'?: CrossrefDateParts
  issued?: CrossrefDateParts
  abstract?: string
  URL?: string
  resource?: {
    primary?: {
      URL?: string
    }
  }
  'is-referenced-by-count'?: number
  'references-count'?: number
  type?: string
  publisher?: string
  volume?: string
  issue?: string
  page?: string
  'article-number'?: string
  subject?: string[]
  link?: CrossrefLink[]
  ISSN?: string[]
}

export interface CrossrefResponse<T> {
  status: string
  'message-type': string
  message: T
}

export interface CrossrefWorksMessage {
  'total-results': number
  items: CrossrefWork[]
  'items-per-page': number
  query?: {
    'search-terms'?: string
    'start-index'?: number
  }
}

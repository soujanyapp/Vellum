/**
 * Europe PMC wire types.
 * Official schema reference: https://europepmc.org/RestfulWebService
 */

export interface EuropePmcAuthorAffiliation {
  affiliation?: string
}

export interface EuropePmcAuthorId {
  type?: string
  value?: string
}

export interface EuropePmcAuthor {
  fullName?: string
  firstName?: string
  lastName?: string
  initials?: string
  authorId?: EuropePmcAuthorId
  authorAffiliationDetailsList?: {
    authorAffiliation?: EuropePmcAuthorAffiliation[]
  }
}

export interface EuropePmcFullTextUrl {
  availability?: string
  availabilityCode?: string
  documentStyle?: 'pdf' | 'html' | 'doi' | string
  site?: string
  url: string
}

export interface EuropePmcJournalInfo {
  issue?: string
  volume?: string
  dateOfPublication?: string
  yearOfPublication?: number
  journal?: {
    title?: string
    medlineAbbreviation?: string
    essn?: string
    issn?: string
  }
}

export interface EuropePmcWork {
  id: string
  source?: string
  pmid?: string
  pmcid?: string
  doi?: string
  title: string
  authorString?: string
  authorList?: {
    author?: EuropePmcAuthor[]
  }
  journalInfo?: EuropePmcJournalInfo
  pubYear?: string
  abstractText?: string
  isOpenAccess?: 'Y' | 'N'
  inEPMC?: 'Y' | 'N'
  inPMC?: 'Y' | 'N'
  hasPDF?: 'Y' | 'N'
  citedByCount?: number
  fullTextUrlList?: {
    fullTextUrl?: EuropePmcFullTextUrl[]
  }
  keywordList?: {
    keyword?: string[]
  }
  language?: string
  pubTypeList?: {
    pubType?: string[]
  }
}

export interface EuropePmcResponse {
  version?: string
  hitCount: number
  request?: {
    queryString?: string
    pageSize?: number
  }
  resultList?: {
    result?: EuropePmcWork[]
  }
}

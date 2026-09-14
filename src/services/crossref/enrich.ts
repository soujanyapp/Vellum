import type { Paper } from '@/domain/papers'
import { fetchCrossrefWork } from './client'
import { normalizeCrossrefWork } from './normalize'
import { normalizeDoi } from '@/lib/dedup'

/**
 * Enriches and verifies a paper record using canonical Crossref metadata.
 *
 * If the paper has a valid DOI:
 * 1. Queries Crossref polite pool for the definitive publisher deposit
 * 2. Merges missing metadata (volume, issue, pages, canonical landing URL)
 * 3. Records Crossref in alternateSources and indexedIn
 *
 * Silently returns the unaltered paper if Crossref is unreachable or the DOI is not indexed,
 * guaranteeing zero failure cascades.
 */
export async function enrichPaperWithCrossref(
  paper: Paper,
  signal?: AbortSignal,
): Promise<Paper> {
  if (paper.source === 'mock') return paper
  const normDoi = normalizeDoi(paper.doi)
  if (!normDoi) return paper

  try {
    const { data: crossrefWork } = await fetchCrossrefWork(normDoi, signal)
    const normalized = normalizeCrossrefWork(crossrefWork)

    const indexedIn = paper.indexedIn.includes('crossref')
      ? paper.indexedIn
      : [...paper.indexedIn, 'crossref']

    return {
      ...paper,
      doi: paper.doi || normalized.doi,
      venue: paper.venue || normalized.venue,
      publicationDate: paper.publicationDate || normalized.publicationDate,
      publicationYear: paper.publicationYear ?? normalized.publicationYear,
      landingPageUrl: paper.landingPageUrl || normalized.landingPageUrl,
      biblio: {
        volume: paper.biblio?.volume || normalized.biblio?.volume,
        issue: paper.biblio?.issue || normalized.biblio?.issue,
        firstPage: paper.biblio?.firstPage || normalized.biblio?.firstPage,
        lastPage: paper.biblio?.lastPage || normalized.biblio?.lastPage,
      },
      crossrefVerified: true,
      indexedIn,
      // Note: We deliberately do NOT add 'crossref' to alternateSources here.
      // alternateSources represents corroborating search providers (e.g. OpenAlex + Europe PMC).
    }
  } catch {
    // If Crossref lookup fails or times out, return original record intact
    return paper
  }
}

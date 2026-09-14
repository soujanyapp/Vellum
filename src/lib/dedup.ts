import type { Paper, SourceId } from '@/domain/papers'

/**
 * Normalizes a DOI string for deterministic comparison and deduplication:
 * - Strips protocol, domain prefixes (doi.org, dx.doi.org), and 'doi:' prefixes
 * - Trims whitespace
 * - Converts to lowercase (DOIs are case-insensitive per ISO 26324)
 * - Strips any trailing punctuation/slash
 */
export function normalizeDoi(doi?: string | null): string | undefined {
  if (!doi) return undefined
  let clean = doi.trim()
  try {
    clean = decodeURIComponent(clean)
  } catch {
    // Keep unescaped string if decode fails
  }
  clean = clean.toLowerCase()
  clean = clean.replace(/^(https?:\/\/(dx\.)?doi\.org\/)/i, '')
  clean = clean.replace(/^doi:\s*/i, '')
  clean = clean.replace(/[.\s/]+$/, '')
  return clean || undefined
}

/**
 * Creates a normalized fingerprint for papers lacking a DOI.
 * Based on full lowercase alphanumeric title + first author surname + publication year.
 *
 * Conservative safety rule:
 * Only papers with a substantial title (>= 15 chars), a valid author (>= 2 chars),
 * and a known publication year are eligible for fallback merging.
 * Short titles ("Editorial", "Review", etc.) or records with missing author/year
 * fall back to their unique paper ID to guarantee zero false-positive collisions.
 */
export function paperFingerprint(paper: Paper): string {
  const normDoi = normalizeDoi(paper.doi)
  if (normDoi) return `doi:${normDoi}`

  const cleanTitle = paper.title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

  const firstAuthor = paper.authors[0]?.name
    ?.toLowerCase()
    .replace(/[^a-z]/g, '') ?? ''

  const year = paper.publicationYear

  if (cleanTitle.length < 15 || firstAuthor.length < 2 || year === undefined) {
    return `id:${paper.id}`
  }

  return `fp:${cleanTitle}:${firstAuthor}:${year}`
}

/**
 * Merges two records representing the same work from different providers.
 * Primary record provides baseline identity and rankings; secondary enriches
 * missing metadata and adds source provenance.
 */
export function mergePaperMetadata(primary: Paper, secondary: Paper): Paper {
  // Collect alternate sources (excluding 'crossref', which is an enrichment service)
  const altSources = new Set<SourceId>(primary.alternateSources ?? [])
  if (secondary.source !== primary.source && secondary.source !== 'crossref') {
    altSources.add(secondary.source)
  }
  if (secondary.alternateSources) {
    for (const s of secondary.alternateSources) {
      if (s !== primary.source && s !== 'crossref') altSources.add(s)
    }
  }

  // Union of platforms that indexed the work
  const indexedIn = Array.from(
    new Set([...primary.indexedIn, ...secondary.indexedIn]),
  )

  // Union of topics, preserving order
  const topics = Array.from(
    new Set([...primary.topics, ...secondary.topics]),
  )

  return {
    ...primary,
    doi: primary.doi || secondary.doi,
    abstract: primary.abstract || secondary.abstract,
    venue: primary.venue || secondary.venue,
    publicationDate: primary.publicationDate || secondary.publicationDate,
    publicationYear: primary.publicationYear ?? secondary.publicationYear,
    language: primary.language || secondary.language,
    isOpenAccess: primary.isOpenAccess || secondary.isOpenAccess,
    openAccessStatus: primary.openAccessStatus || secondary.openAccessStatus,
    pdfUrl: primary.pdfUrl || secondary.pdfUrl,
    landingPageUrl: primary.landingPageUrl || secondary.landingPageUrl,
    fullTextUrl: primary.fullTextUrl || secondary.fullTextUrl,
    pmcid: primary.pmcid || secondary.pmcid,
    pmid: primary.pmid || secondary.pmid,
    biblio: primary.biblio || secondary.biblio,
    citationCount: Math.max(
      primary.citationCount ?? 0,
      secondary.citationCount ?? 0,
    ) || primary.citationCount,
    topics,
    topicMetadata: primary.topicMetadata || secondary.topicMetadata,
    crossrefVerified: primary.crossrefVerified || secondary.crossrefVerified,
    alternateSources: altSources.size > 0 ? Array.from(altSources) : undefined,
    indexedIn,
  }
}

/**
 * Deterministically deduplicates a list of papers by DOI and fingerprint.
 * When duplicates are detected, their metadata is merged and source provenance
 * is preserved on the surviving card.
 */
export function deduplicatePapers(papers: Paper[]): Paper[] {
  const indexByFingerprint = new Map<string, number>()
  const result: Paper[] = []

  for (const paper of papers) {
    const key = paperFingerprint(paper)
    const existingIndex = indexByFingerprint.get(key)

    if (existingIndex === undefined) {
      indexByFingerprint.set(key, result.length)
      result.push(paper)
    } else {
      // Merge duplicate into existing entry
      result[existingIndex] = mergePaperMetadata(result[existingIndex], paper)
    }
  }

  return result
}

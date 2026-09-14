/**
 * "Why This Paper?" — annotation engine.
 *
 * Computes transparent, metadata-derived labels for papers in a result set.
 * Every label is traceable to a concrete, visible data field. Nothing is
 * fabricated and language is always suggestive, never authoritative.
 *
 * Pure functions — no side effects, no network, no DOM.
 */

import type { AnnotationLabel, Paper } from '@/domain/papers'

/** Maximum labels attached to a single paper. */
const MAX_LABELS = 3

/** Percentile threshold: top N% by relevance score. */
const RELEVANCE_PERCENTILE = 0.10

/** Percentile threshold: top N% by citation count within set. */
const CITATION_PERCENTILE = 0.15

/** Minimum shared topics to qualify as "central to topic cluster". */
const TOPIC_OVERLAP_MIN = 3

/** Proportion of result set that must share a topic for it to count. */
const TOPIC_OVERLAP_RATIO = 0.50

/** Papers within this many years of the current year are "recent". */
const RECENCY_WINDOW = 2

/** Review/survey work types that earn a special label. */
const REVIEW_TYPES = new Set(['review', 'peer-review'])

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns the value at a given percentile in a sorted (ascending) array.
 * `p` is in [0, 1]: 0.10 = 10th percentile from the top.
 */
function percentileThreshold(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  // "top p" = value at index (1 - p) * (length - 1)
  const idx = Math.ceil((1 - p) * (sorted.length - 1))
  return sorted[Math.max(0, idx)]
}

/**
 * Count how many topics from `paper` appear in at least `minPapers` of the
 * other papers in the set.
 */
function countCentralTopics(
  paper: Paper,
  topicCounts: Map<string, number>,
  minPapers: number,
): number {
  let central = 0
  for (const topic of paper.topics) {
    if ((topicCounts.get(topic) ?? 0) >= minPapers) {
      central++
    }
  }
  return central
}

// ---------------------------------------------------------------------------
// Main API
// ---------------------------------------------------------------------------

/**
 * Annotate every paper in a result set with transparent metadata labels.
 *
 * Returns a `Map<paperId, AnnotationLabel[]>` with at most `MAX_LABELS`
 * labels per paper. Papers with no notable signals get an empty array.
 *
 * The computation is O(n²) in the worst case for topic overlap, where n is
 * the page size (typically 25). This runs in sub-millisecond time.
 */
export function annotateResultSet(
  papers: Paper[],
): Map<string, AnnotationLabel[]> {
  const result = new Map<string, AnnotationLabel[]>()
  if (papers.length === 0) return result

  // Pre-compute set-level statistics
  const currentYear = new Date().getFullYear()

  // Relevance scores (only meaningful when present)
  const relevanceScores = papers
    .map((p) => p.relevanceScore ?? 0)
    .filter((s) => s > 0)
    .sort((a, b) => a - b)

  const relevanceThreshold =
    relevanceScores.length >= 3
      ? percentileThreshold(relevanceScores, RELEVANCE_PERCENTILE)
      : Infinity // Not enough data to meaningfully percentile

  // Citation counts
  const citationCounts = papers
    .map((p) => p.citationCount ?? 0)
    .sort((a, b) => a - b)

  const citationThreshold =
    citationCounts.length >= 3
      ? percentileThreshold(citationCounts, CITATION_PERCENTILE)
      : Infinity

  const medianCitation =
    citationCounts.length > 0
      ? citationCounts[Math.floor(citationCounts.length / 2)]
      : 0

  // Topic frequency across the set
  const topicCounts = new Map<string, number>()
  for (const paper of papers) {
    for (const topic of paper.topics) {
      topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1)
    }
  }
  const topicOverlapMin = Math.max(
    TOPIC_OVERLAP_MIN,
    Math.ceil(papers.length * TOPIC_OVERLAP_RATIO),
  )

  // Annotate each paper
  for (const paper of papers) {
    const labels: AnnotationLabel[] = []

    // 1. Strong relevance match
    if (
      paper.relevanceScore !== undefined &&
      paper.relevanceScore > 0 &&
      paper.relevanceScore >= relevanceThreshold &&
      relevanceScores.length >= 3
    ) {
      labels.push({
        kind: 'relevance',
        text: 'Strong match for your search',
        detail: `Relevance score is in the top ${Math.round(RELEVANCE_PERCENTILE * 100)}% of results for this query.`,
      })
    }

    // 2. Highly cited within set
    if (
      paper.citationCount !== undefined &&
      paper.citationCount > 0 &&
      paper.citationCount >= citationThreshold &&
      citationCounts.length >= 3
    ) {
      labels.push({
        kind: 'highly-cited',
        text: 'Highly cited within these results',
        detail: `${paper.citationCount.toLocaleString()} citations — in the top ${Math.round(CITATION_PERCENTILE * 100)}% of this result set.`,
      })
    }

    // 3. Central to topic cluster
    if (paper.topics.length > 0) {
      const centralCount = countCentralTopics(paper, topicCounts, topicOverlapMin)
      if (centralCount >= TOPIC_OVERLAP_MIN) {
        labels.push({
          kind: 'topic-central',
          text: 'Central to this topic cluster',
          detail: `Shares ${centralCount} topics with the majority of results in this set.`,
        })
      }
    }

    // 4. Recent work
    if (
      paper.publicationYear !== undefined &&
      paper.publicationYear >= currentYear - RECENCY_WINDOW &&
      (paper.citationCount ?? 0) < medianCitation
    ) {
      labels.push({
        kind: 'recent',
        text: 'Recent work in this area',
        detail: `Published ${paper.publicationYear} — emerging work with citations still accumulating.`,
      })
    }

    // 5. Review or survey
    if (paper.type && REVIEW_TYPES.has(paper.type)) {
      labels.push({
        kind: 'review',
        text: 'Review or survey article',
        detail: `Classified as "${paper.type}" — may provide a broad overview of the topic.`,
      })
    }

    result.set(paper.id, labels.slice(0, MAX_LABELS))
  }

  return result
}

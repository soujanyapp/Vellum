/**
 * Mock discovery source — SYNTHETIC FIXTURES ONLY.
 *
 * These records are generated placeholder data for local UI development and
 * offline builds. They are NOT real papers:
 *
 *   - Titles are composed from a small pool of generic phrasings
 *   - DOIs use the reserved test prefix 10.9999
 *   - Authors, venues, citation counts and dates are fabricated
 *   - The UI renders a persistent "Demo data" notice whenever this source
 *     is active (see VITE_DISCOVERY_SOURCE=mock)
 *
 * Never use this module as the default for a deployed environment.
 */

import type { Paper, SourceId } from '@/domain/papers'

const TOPICS = [
  'Transformer architecture', 'Graph neural networks', 'Causal inference',
  'Federated learning', 'Robust optimization', 'Computational biology',
  'Astrophysical surveys', 'Neuromorphic computing', 'Cryogenic photonics',
  'pH-responsive materials', 'Population dynamics', 'Quantum error correction',
  'Radiomics', 'Electrocatalysis', 'Corpus linguistics',
]

const TITLE_PARTS_A = [
  'A calibrated framework for',
  'On the geometry of',
  'Unifying approaches to',
  'Robust estimation under',
  'A longitudinal study of',
  'Scaling laws for',
  'Transferable representations for',
  'Interpretable surrogates of',
  'Energy-aware scheduling of',
  'Provable bounds for',
]

const TITLE_PARTS_B = [
  'multi-scale attention', 'sparse optimization', 'agentic tool use',
  'graph-based retrieval', 'tissue phenotyping', 'orbital imaging',
  'low-power inference', 'mixture-of-experts routing', 'contrastive pretraining',
  'uncertainty quantification',
]

const VENUES = [
  'Journal of Synthetic Research', 'Proceedings of the Demo Symposium',
  'arXiv (mock) preprint', 'Review of Fictitious Methods',
  'Letters in Applied Modeling', 'Annals of the Toy Dataset',
]

const FIRST_NAMES = [
  'Akari', 'Ben', 'Catarina', 'Dmitri', 'Elena', 'Farid', 'Grace', 'Hiroshi',
  'Ingrid', 'Julian', 'Keiko', 'Lars', 'Mirela', 'Nadia', 'Otto', 'Priya',
  'Quentin', 'Rosa', 'Sanjay', 'Tilde',
]

const LAST_NAMES = [
  'Asano', 'Brandt', 'Costa', 'Duarte', 'Eriksen', 'Fayad', 'Gul', 'Haddad',
  'Ivanov', 'Jain', 'Kowalski', 'Lima', 'Mbeki', 'Novak', 'Okafor', 'Pereira',
  'Quintero', 'Roth', 'Silva', 'Tanaka',
]

/** Deterministic PRNG so dev renders are stable between reloads. */
export function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length]
}

export function generateMockPaper(index: number): Paper {
  const rng = mulberry32(index * 7919 + 13)
  const year = 2016 + Math.floor(rng() * 10)
  const authorCount = 1 + Math.floor(rng() * 5)
  const authors = Array.from({ length: authorCount }, (_, i) => ({
    name: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`,
    id: `mock-author-${index}-${i}`,
  }))

  return {
    id: `mock-paper-${index}`,
    doi: `10.9999/vellum.demo.${String(index).padStart(4, '0')}`,
    title: `${pick(rng, TITLE_PARTS_A)} ${pick(rng, TITLE_PARTS_B)}`,
    abstract:
      `This is a synthetic abstract for interface development. It discusses ` +
      `toy quantities, placeholder theory and illustrative numbers, and ` +
      `concludes with directions for future demo work. No real experiments ` +
      `were performed and none are implied.`,
    authors,
    publicationDate: `${year}-0${1 + Math.floor(rng() * 9)}-1${Math.floor(rng() * 9)}`,
    publicationYear: year,
    venue: pick(rng, VENUES),
    type: rng() > 0.5 ? 'article' : 'preprint',
    citationCount: Math.floor(rng() * rng() * 900),
    topics: [pick(rng, TOPICS), pick(rng, TOPICS)],
    language: 'en',
    isOpenAccess: rng() > 0.35,
    openAccessStatus: 'gold',
    landingPageUrl: `https://doi.org/10.9999/vellum.demo.${String(index).padStart(4, '0')}`,
    source: 'mock' as SourceId,
    indexedIn: ['mock-index'],
    isRetracted: false,
  }
}

export const MOCK_TOTAL = 120

export const mockPapers: Paper[] = Array.from(
  { length: MOCK_TOTAL },
  (_, i) => generateMockPaper(i + 1),
)

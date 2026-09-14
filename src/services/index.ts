import type { PaperSource, SourceId } from '@/domain/papers'
import { openAlexSource } from './openalex'
import { europePmcSource } from './europepmc'
import { crossrefSource } from './crossref'
import { mockSource } from './mock'

/**
 * Selects the active discovery source.
 *
 *   VITE_DISCOVERY_SOURCE=mock      → deterministic synthetic fixtures
 *   (default / anything else)       → live OpenAlex API
 *
 * The mock source is a development aid and is never enabled by default in
 * production builds.
 */

type SourceConfig = 'openalex' | 'mock' | 'auto'

function resolveSource(): SourceConfig {
  const env = import.meta.env.VITE_DISCOVERY_SOURCE as SourceConfig | undefined
  if (env === 'mock' || env === 'openalex') return env
  return 'openalex'
}

export const activeSourceId: SourceConfig = resolveSource()

/** Whether the UI is in mock fixture mode for preview/tests. */
export const isDemoMode = activeSourceId === 'mock'

/** Default primary discovery source (OpenAlex, or mock in test mode). */
export const discoverySource: PaperSource =
  isDemoMode ? mockSource : openAlexSource

export const sourceLabel: string = discoverySource.label

/**
 * Registry of available sources in Vellum.
 */
export const SOURCES_REGISTRY: Record<SourceId, PaperSource> = {
  openalex: openAlexSource,
  europepmc: europePmcSource,
  crossref: crossrefSource,
  'semantic-scholar': openAlexSource, // fallback
  arxiv: openAlexSource, // fallback
  mock: mockSource,
}

/**
 * Resolves a PaperSource adapter by identifier.
 * Honors mock mode during testing or development.
 */
export function getSource(id?: SourceId): PaperSource {
  if (isDemoMode) return mockSource
  if (!id) return openAlexSource
  return SOURCES_REGISTRY[id] ?? openAlexSource
}

/**
 * Selectable search providers exposed in the search interface.
 */
export interface SearchSourceOption {
  id: SourceId
  label: string
  shortLabel: string
  description: string
}

export const SEARCH_SOURCES: SearchSourceOption[] = [
  {
    id: 'openalex',
    label: 'All / OpenAlex',
    shortLabel: 'OpenAlex',
    description: 'General scholarly discovery across 250M+ works',
  },
  {
    id: 'europepmc',
    label: 'Biomedical / Europe PMC',
    shortLabel: 'Europe PMC',
    description: 'Specialized biomedical & life sciences with direct open access links',
  },
]

export { openAlexSource, europePmcSource, crossrefSource, mockSource }
export type { PaperSource }

import { LANGUAGE_LABELS } from '@/lib/format'

/** Curated, human-labeled work-form options for the type filter. */
export const TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'article', label: 'Article' },
  { value: 'preprint', label: 'Preprint' },
  { value: 'review', label: 'Review' },
  { value: 'book', label: 'Book' },
  { value: 'book-chapter', label: 'Book chapter' },
  { value: 'monograph', label: 'Monograph' },
  { value: 'proceedings-article', label: 'Proceedings article' },
  { value: 'dataset', label: 'Dataset' },
  { value: 'dissertation', label: 'Dissertation / thesis' },
  { value: 'report', label: 'Report' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'letter', label: 'Letter' },
  { value: 'reference-entry', label: 'Reference entry' },
  { value: 'encyclopedia-entry', label: 'Encyclopedia entry' },
  { value: 'grant', label: 'Grant' },
  { value: 'peer-review', label: 'Peer review' },
  { value: 'posted-content', label: 'Posted content' },
  { value: 'standard', label: 'Standard' },
  { value: 'paratext', label: 'Paratext' },
]

export const LANGUAGE_OPTIONS: Array<{ value: string; label: string }> =
  Object.entries(LANGUAGE_LABELS)
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([value, label]) => ({ value, label }))

/**
 * "Why This Paper?" — annotation label displayed on result cards.
 *
 * Renders a compact, muted label that explains why a paper was surfaced.
 * Clicking a label toggles an expanded detail explanation.
 * Fully accessible: keyboard-navigable, screen-reader-friendly.
 */

import { useState } from 'react'
import type { AnnotationLabel as Label } from '@/domain/papers'
import styles from './annotationlabel.module.css'

interface AnnotationLabelsProps {
  labels: Label[]
}

const ICON: Record<Label['kind'], string> = {
  relevance: '◎',
  'highly-cited': '◆',
  'topic-central': '⬡',
  recent: '↗',
  review: '▤',
}

export function AnnotationLabels({ labels }: AnnotationLabelsProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  if (labels.length === 0) return null

  return (
    <div className={styles.wrap} aria-label="Why this paper?">
      <ul className={styles.list}>
        {labels.map((label, i) => {
          const isExpanded = expandedIdx === i
          return (
            <li key={label.kind} className={styles.item}>
              <button
                type="button"
                className={styles.label}
                aria-expanded={isExpanded}
                onClick={() => setExpandedIdx(isExpanded ? null : i)}
                title={label.detail}
              >
                <span className={styles.icon} aria-hidden="true">
                  {ICON[label.kind]}
                </span>
                {label.text}
              </button>
              {isExpanded && (
                <p className={styles.detail}>{label.detail}</p>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

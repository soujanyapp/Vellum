import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Paper, AnnotationLabel } from '@/domain/papers'
import { ResultItem } from './ResultItem'
import styles from './results.module.css'

interface ResultsListProps {
  papers: Paper[]
  annotations?: Map<string, AnnotationLabel[]>
}

export function ResultsList({ papers, annotations }: ResultsListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: papers.length,
    getScrollElement: () => scrollRef.current,
    // Index-aware estimate: cards with annotation labels are taller.
    // Reduces layout shift vs. a flat 180 that measureElement must correct.
    estimateSize: (index: number) => {
      const id = papers[index]?.id
      const labelCount = id ? (annotations?.get(id)?.length ?? 0) : 0
      return labelCount > 0 ? 210 : 180
    },
    overscan: 4,
  })

  return (
    <div ref={scrollRef} className={styles.virtRoot} role="list" aria-label="Search results">
      <div
        style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}
      >
        {virtualizer.getVirtualItems().map((item) => {
          const paper = papers[item.index]
          return (
            <div
              key={paper.id}
              data-index={item.index}
              ref={virtualizer.measureElement}
              className={styles.virtRow}
              role="listitem"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${item.start}px)`,
              }}
            >
              <ResultItem
                paper={paper}
                annotations={annotations?.get(paper.id)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

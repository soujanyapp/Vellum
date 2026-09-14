import { Link } from 'react-router-dom'
import type { Paper, AnnotationLabel } from '@/domain/papers'
import { paperPath } from '@/lib/paths'
import {
  formatPublicationDate,
  formatCitationCount,
  listAuthors,
  formatSourceLabel,
} from '@/lib/format'
import { Icon } from '@/components/ui/Icon'
import { AnnotationLabels } from './AnnotationLabels'
import styles from './resultitem.module.css'

interface ResultItemProps {
  paper: Paper
  annotations?: AnnotationLabel[]
}

export function ResultItem({ paper, annotations }: ResultItemProps) {
  const snippet = paper.abstract ? truncate(paper.abstract, 260) : null

  return (
    <div className={styles.card}>
      <Link to={paperPath(paper.id)} className={`${styles.title} ${styles.titleLink}`}>
        {paper.title}
      </Link>

      <p className={styles.meta}>
        {listAuthors(paper.authors)}
        {paper.venue ? (
          <span className={styles.venue}>{paper.venue}</span>
        ) : null}
        <span>{formatPublicationDate(paper.publicationDate, paper.publicationYear) ?? 'n.d.'}</span>
      </p>

      {snippet ? (
        <p className={styles.snippet}>{snippet}</p>
      ) : null}

      <div className={styles.badges}>
        {paper.type ? (
          paper.landingPageUrl ? (
            <a
              href={paper.landingPageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.badge} ${styles.badgeType} ${styles.badgeLink}`}
            >
              {paper.type}
            </a>
          ) : (
            <span className={`${styles.badge} ${styles.badgeType}`}>
              {paper.type}
            </span>
          )
        ) : null}
        {paper.isOpenAccess ? (
          paper.pdfUrl ? (
            <a
              href={paper.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.badge} ${styles.badgeOa} ${styles.badgeLink}`}
            >
              <Icon name="globe" size={13} />
              Open access
            </a>
          ) : (
            <span className={`${styles.badge} ${styles.badgeOa}`}>
              <Icon name="globe" size={13} />
              Open access
            </span>
          )
        ) : null}
          {paper.isRetracted ? (
            <span className={`${styles.badge} ${styles.badgeRetracted}`}>
              <Icon name="retracted" size={13} />
              Retracted
            </span>
          ) : null}
          {paper.citationCount !== undefined && paper.citationCount > 0 ? (
            <span className={`${styles.badge}`}>
              <Icon name="quote" size={13} />
              {formatCitationCount(paper.citationCount)}
            </span>
          ) : null}
          <span
            className={`${styles.badge} ${styles.badgeSource}`}
            title={
              paper.alternateSources && paper.alternateSources.length > 0
                ? `Discovered in ${[paper.source, ...paper.alternateSources].map(formatSourceLabel).join(' and ')}`
                : `Discovered in ${formatSourceLabel(paper.source)}`
            }
          >
            {paper.alternateSources && paper.alternateSources.length > 0
              ? `Sources: ${formatSourceLabel(paper.source)} · ${paper.alternateSources.map(formatSourceLabel).join(' · ')}`
              : `Source: ${formatSourceLabel(paper.source)}`}
          </span>
          {paper.crossrefVerified ? (
            <span
              className={`${styles.badge} ${styles.badgeVerified}`}
              title="Canonical publisher metadata verified via Crossref"
            >
              <Icon name="check" size={12} />
              Metadata verified via Crossref
            </span>
          ) : null}
      </div>

      {paper.topics.length > 0 ? (
        <div className={styles.chips}>
          {paper.topics.slice(0, 3).map((topic) => (
            <span key={topic} className={styles.chip}>
              {topic}
            </span>
          ))}
        </div>
      ) : null}

      {annotations && annotations.length > 0 ? (
        <AnnotationLabels labels={annotations} />
      ) : null}
    </div>
  )
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max).lastIndexOf(' ')
  return `${text.slice(0, cut > max - 60 ? cut : max)}…`
}

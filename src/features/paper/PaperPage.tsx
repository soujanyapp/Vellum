import { Link, useParams } from 'react-router-dom'
import type { Paper } from '@/domain/papers'
import { usePaper, useRelatedPapers } from '@/hooks/useDataSource'
import { authorPath } from '@/lib/paths'
import {
  listAuthors,
  formatCitationCount,
  formatPublicationDate,
  doiSuffix,
  formatSourceLabel,
} from '@/lib/format'
import { isNotFoundError } from '@/services/openalex'
import { Icon } from '@/components/ui/Icon'
import styles from './paper.module.css'

export function PaperPage() {
  const { workId = '' } = useParams()
  const paper = usePaper(workId)
  const related = useRelatedPapers(workId)

  if (paper.isLoading) {
    return (
      <div className={`${styles.layout} container`} aria-busy="true">
        <div className={styles.skeletonTitle} />
        <div className={styles.skeletonAuthors} />
        <div className={styles.skeletonAbstract} />
      </div>
    )
  }

  if (paper.error || !paper.data) {
    const notFound = paper.error != null && isNotFoundError(paper.error)
    return (
      <section className={`${styles.layout} container`} aria-labelledby="paper-err">
        <h1 id="paper-err" className={styles.title}>
          {notFound ? 'This work isn’t in the record.' : 'We couldn’t open that work.'}
        </h1>
        <p className={styles.abstract}>
          {notFound
            ? 'It may have been removed by its source, or the identifier is out of date.'
            : paper.error instanceof Error
              ? paper.error.message
              : 'An unexpected problem occurred while fetching this record.'}
        </p>
        <Link to="/search" className={styles.backLink}>
          <Icon name="arrow-left" size={15} />
          Back to search
        </Link>
      </section>
    )
  }

  const p = paper.data
  const date = formatPublicationDate(p.publicationDate, p.publicationYear)

  return (
    <div className={`${styles.layout} container`}>
      <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
        <Link to="/search" className={styles.backLink}>
          <Icon name="arrow-left" size={15} />
          Search
        </Link>
      </nav>

      <article>
        {p.isRetracted ? (
          <div className={styles.retracted} role="alert">
            <Icon name="retracted" size={16} />
            This work has been retracted. Treat its claims with caution.
          </div>
        ) : null}

        <header className={styles.head}>
          <div className={styles.headBadges}>
            {p.type ? <span className={styles.badgeType}>{p.type}</span> : null}
            {p.isOpenAccess ? (
              <span className={styles.badgeOa}>
                <Icon name="globe" size={13} />
                Open access
              </span>
            ) : null}
            <span
              className={styles.badgeMuted}
              title={
                p.alternateSources && p.alternateSources.length > 0
                  ? `Discovered in ${[p.source, ...p.alternateSources].map(formatSourceLabel).join(' and ')}`
                  : `Discovered in ${formatSourceLabel(p.source)}`
              }
            >
              {p.alternateSources && p.alternateSources.length > 0
                ? `Sources: ${formatSourceLabel(p.source)} · ${p.alternateSources.map(formatSourceLabel).join(' · ')}`
                : `Source: ${formatSourceLabel(p.source)}`}
            </span>
            {p.crossrefVerified ? (
              <span
                className={styles.badgeMuted}
                title="Canonical publisher metadata verified via Crossref"
              >
                <Icon name="check" size={13} />
                Metadata verified via Crossref
              </span>
            ) : null}
          </div>

          <h1 className={styles.title}>{p.title}</h1>

          <p className={styles.authors}>
            {p.authors.map((a, i) => (
              <span key={a.id ?? `${a.name}-${i}`}>
                {a.id ? (
                  <Link to={`${authorPath(a.id)}`} className={styles.authorLink}>
                    {a.name}
                  </Link>
                ) : (
                  <span>{a.name}</span>
                )}
                {i < p.authors.length - 1 ? ', ' : ''}
              </span>
            ))}
          </p>

          <dl className={styles.facts}>
            {p.venue ? (
              <div className={styles.fact}>
                <dt>Venue</dt>
                <dd>{p.venue}</dd>
              </div>
            ) : null}
            {date ? (
              <div className={styles.fact}>
                <dt>Published</dt>
                <dd>{date}</dd>
              </div>
            ) : null}
            {p.biblio?.volume ? (
              <div className={styles.fact}>
                <dt>Volume</dt>
                <dd>{p.biblio.volume}</dd>
              </div>
            ) : null}
            {p.biblio?.issue ? (
              <div className={styles.fact}>
                <dt>Issue</dt>
                <dd>{p.biblio.issue}</dd>
              </div>
            ) : null}
            {p.biblio?.firstPage ? (
              <div className={styles.fact}>
                <dt>Pages</dt>
                <dd>{p.biblio.firstPage}</dd>
              </div>
            ) : null}
            {p.citationCount !== undefined ? (
              <div className={styles.fact}>
                <dt>Cited by</dt>
                <dd>{formatCitationCount(p.citationCount)}</dd>
              </div>
            ) : null}
          </dl>
        </header>

        {p.abstract ? (
          <section aria-labelledby="abstract-heading">
            <h2 id="abstract-heading" className={styles.sectionHeading}>
              Abstract
            </h2>
            <p className={styles.abstract}>{p.abstract}</p>
          </section>
        ) : null}

        {p.topics.length > 0 ? (
          <section aria-label="Research topics">
            <h2 className={styles.sectionHeading}>Topics</h2>
            <ul className={styles.topics}>
              {p.topics.map((t) => (
                <li key={t} className={styles.topic}>
                  {t}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {p.landingPageUrl || p.pdfUrl || p.doi ? (
          <AccessLinks paper={p} />
        ) : null}
      </article>

      <RelatedWorks
        related={related.data}
        isLoading={related.isLoading}
        error={related.error}
      />
    </div>
  )
}

interface AccessLinksProps {
  paper: Paper
}

function AccessLinks({ paper: p }: AccessLinksProps) {
  return (
    <section className={styles.links} aria-label="Find the full text">
      <h2 className={styles.sectionHeading}>Find the full text</h2>
      <div className={styles.linkRow}>
        {p.isOpenAccess && p.pdfUrl ? (
          <a href={p.pdfUrl} target="_blank" rel="noreferrer" className={styles.cta}>
            Open access PDF
            <Icon name="external" size={15} />
          </a>
        ) : null}
        {p.landingPageUrl && p.landingPageUrl !== p.pdfUrl ? (
          <a href={p.landingPageUrl} target="_blank" rel="noreferrer" className={styles.textLink}>
            {p.isOpenAccess ? 'Publisher landing page' : 'Publisher page'}
            <Icon name="external" size={14} />
          </a>
        ) : null}
        {p.doi ? (
          <a href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer" className={styles.textLink}>
            DOI: {doiSuffix(p.doi)}
            <Icon name="external" size={14} />
          </a>
        ) : null}
      </div>
      {p.doi && !p.isOpenAccess ? (
        <p className={styles.paywallNote}>
          Not open access here — check the DOI record for a legitimate copy.
          Vellum never links to predatory or pirated mirrors.
        </p>
      ) : null}
    </section>
  )
}

interface RelatedProps {
  related?: Paper[]
  isLoading: boolean
  error?: unknown
}

function RelatedWorks({ related, isLoading, error }: RelatedProps) {
  if (isLoading) {
    return (
      <section className={styles.related} aria-label="Related works">
        <h2 className={styles.sectionHeading}>Related works</h2>
        <p className={styles.relatedHint}>Scanning the graph…</p>
      </section>
    )
  }

  if (error || !related || related.length === 0) {
    return (
      <section className={styles.related} aria-label="Related works">
        <h2 className={styles.sectionHeading}>Related works</h2>
        <p className={styles.relatedHint}>
          {error
            ? 'The provider didn’t return related works for this record.'
            : 'No direct relations in the metadata index.'}
        </p>
      </section>
    )
  }

  return (
    <section className={styles.related} aria-label="Related works">
      <h2 className={styles.sectionHeading}>Related works</h2>
      <ol className={styles.relatedList}>
        {related.map((r) => (
          <li key={r.id}>
            <Link to={`/papers/${r.id.split('/').pop()}`} className={styles.relatedItem}>
              <span className={styles.relatedTitle}>{r.title}</span>
              <span className={styles.relatedMeta}>
                {listAuthors(r.authors)} · {r.venue ?? 'Unknown venue'} ·{' '}
                {r.publicationYear ?? 'n.d.'}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}

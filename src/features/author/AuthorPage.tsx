import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuthor, useAuthorWorks } from '@/hooks/useDataSource'
import { paperPath } from '@/lib/paths'
import { formatCitationCount } from '@/lib/format'
import { isNotFoundError } from '@/services/openalex'
import { Icon } from '@/components/ui/Icon'
import styles from './author.module.css'

const WORK_PAGE_SIZE = 20

export function AuthorPage() {
  const { authorId = '' } = useParams()
  const author = useAuthor(authorId)
  const [page, setPage] = useState(1)
  const works = useAuthorWorks(authorId, page, WORK_PAGE_SIZE)

  if (author.isLoading) {
    return (
      <div className={`${styles.layout} container`} aria-busy="true">
        <div className={styles.skeletonName} />
        <div className={styles.skeletonStat} />
      </div>
    )
  }

  if (author.error || !author.data) {
    const notFound = author.error != null && isNotFoundError(author.error)
    return (
      <section className={`${styles.layout} container`} aria-labelledby="author-err">
        <h1 id="author-err" className={styles.name}>
          {notFound ? 'This author isn’t in the record.' : 'We couldn’t load that profile.'}
        </h1>
        <p className={styles.bio}>
          {notFound
            ? 'The identifier may be out of date, or the profile was merged or removed.'
            : author.error instanceof Error
              ? author.error.message
              : 'An unexpected problem occurred.'}
        </p>
        <Link to="/search" className={styles.backLink}>
          <Icon name="arrow-left" size={15} />
          Back to search
        </Link>
      </section>
    )
  }

  const a = author.data
  const totalPages = Math.max(1, Math.ceil((works.data?.meta.total ?? 0) / WORK_PAGE_SIZE))

  return (
    <div className={`${styles.layout} container`}>
      <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
        <Link to="/search" className={styles.backLink}>
          <Icon name="arrow-left" size={15} />
          Search
        </Link>
      </nav>

      <header className={styles.head}>
        <p className={styles.eyebrow}>Author profile</p>
        <h1 className={styles.name}>{a.name}</h1>

        <ul className={styles.stats}>
          {a.worksCount !== undefined && (
            <li className={styles.stat}>
              <span className={styles.statValue}>{a.worksCount.toLocaleString()}</span>
              <span className={styles.statLabel}>works</span>
            </li>
          )}
          {a.citedByCount !== undefined && (
            <li className={styles.stat}>
              <span className={styles.statValue}>{formatCitationCount(a.citedByCount)}</span>
              <span className={styles.statLabel}>citations</span>
            </li>
          )}
        </ul>

        {a.affiliation ? (
          <p className={styles.bio}>Affiliated with {a.affiliation}.</p>
        ) : null}

        {a.orcid ? (
          <a
            href={`https://orcid.org/${a.orcid}`}
            target="_blank"
            rel="noreferrer"
            className={styles.orcid}
          >
            ORCID {a.orcid}
            <Icon name="external" size={14} />
          </a>
        ) : null}

        {a.topics.length > 0 ? (
          <div className={styles.topics}>
            {a.topics.slice(0, 8).map((t) => (
              <span key={t} className={styles.topic}>
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <section aria-labelledby="works-heading">
        <h2 id="works-heading" className={styles.sectionHeading}>
          Indexed work
          <span className={styles.worksTotal}>
            {works.data?.meta.total?.toLocaleString() ?? ''}
          </span>
        </h2>

        {works.isLoading && !works.data ? (
          <div className={styles.skeletonList} aria-hidden="true">
            <div className={styles.skeletonWork} />
            <div className={styles.skeletonWork} />
            <div className={styles.skeletonWork} />
          </div>
        ) : works.error ? (
          <p className={styles.worksHint}>
            Couldn’t load this author’s works — {works.error instanceof Error ? works.error.message : 'unknown error'}.
          </p>
        ) : works.data && works.data.papers.length === 0 ? (
          <p className={styles.worksHint}>No indexed works in this provider.</p>
        ) : (
          <ol className={styles.workList}>
            {(works.data?.papers ?? []).map((w) => (
              <li key={w.id}>
                <Link to={paperPath(w.id)} className={styles.workItem}>
                  <span className={styles.workTitle}>{w.title}</span>
                  <span className={styles.workMeta}>
                    {w.publicationYear ?? 'n.d.'}
                    {w.venue ? ` · ${w.venue}` : ''}
                    {w.citationCount ? ` · ${formatCitationCount(w.citationCount)} cited` : ''}
                    {w.type ? ` · ${w.type}` : ''}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              type="button"
              className={styles.pageButton}
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <Icon name="arrow-left" size={15} />
              Previous
            </button>
            <span className={styles.pageStatus}>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className={styles.pageButton}
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
              <Icon name="arrow-right" size={15} />
            </button>
          </div>
        )}
      </section>
    </div>
  )
}

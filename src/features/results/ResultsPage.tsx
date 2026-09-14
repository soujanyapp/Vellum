import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { SortOrder, SourceId } from '@/domain/papers'
import { SearchBar } from '@/features/search/SearchBar'
import { FilterPanel } from '@/features/filters/FilterPanel'
import { FiltersDrawer } from '@/features/filters/FiltersDrawer'
import { ResultsList } from './ResultsList'
import {
  RESULTS_PAGE_SIZE,
  queryFromParams,
  withPage,
  withSort,
  withSource,
} from '@/features/filters/queryParams'
import { useSearchResults } from '@/hooks/useDataSource'
import { getSource, SEARCH_SOURCES } from '@/services'
import { HttpError } from '@/lib/http'
import { annotateResultSet } from '@/lib/annotations'
import { Icon } from '@/components/ui/Icon'
import styles from './results.module.css'

const SORTS: Array<{ value: SortOrder; label: string }> = [
  { value: 'relevance', label: 'Most relevant' },
  { value: 'cited_by_count', label: 'Most cited' },
  { value: 'publication_date', label: 'Newest first' },
]

export function ResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = useMemo(() => queryFromParams(searchParams), [searchParams])
  const activeSource = getSource(query.source)
  const { data, error, isLoading, isRefreshing, refetch } =
    useSearchResults(query)

  const total = data?.meta.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / RESULTS_PAGE_SIZE))

  const changeSearch = (next: URLSearchParams) =>
    setSearchParams(next, { replace: true })

  const goToPage = (page: number) => changeSearch(withPage(searchParams, page))
  const onSort = (sort: SortOrder) => changeSearch(withSort(searchParams, sort))
  const onSource = (sourceId: SourceId) => changeSearch(withSource(searchParams, sourceId))
  const queryLabel = query.q.trim() || 'everything'

  // Compute "Why This Paper?" annotations across the result set
  const annotations = useMemo(
    () => (data?.papers ? annotateResultSet(data.papers) : new Map()),
    [data?.papers],
  )

  return (
    <div className={`${styles.layout} container`}>
      <aside className={styles.sidebar} aria-label="Result filters">
        <FilterPanel params={searchParams} onChange={changeSearch} />
      </aside>

      <section className={styles.main} aria-live="polite">
        <div className={styles.sourceBar} role="tablist" aria-label="Search provider">
          <span className={`${styles.sourceBarLabel} v-mono`}>Source</span>
          <div className={styles.sourceTabs}>
            {SEARCH_SOURCES.map((source) => {
              const isActive = (query.source || 'openalex') === source.id
              return (
                <button
                  key={source.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`${styles.sourceTab} ${isActive ? styles.sourceTabActive : ''}`}
                  onClick={() => onSource(source.id)}
                  title={source.description}
                >
                  {source.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className={styles.toolbar}>
          <p className={styles.toolbarCount}>
            {error ? (
              'Search failed'
            ) : isLoading && !data ? (
              `Searching ${activeSource.label.toLowerCase()}…`
            ) : (
              <>
                <strong>{total.toLocaleString()}</strong>{' '}
                {total === 1 ? 'work' : 'works'}
                {isRefreshing ? ' · updating' : ''}
              </>
            )}
          </p>

          <div className={styles.toolbarSearch}>
            <SearchBar variant="compact" initialValue={query.q} key={`${query.source ?? 'openalex'}-${query.q}`} source={query.source} />
          </div>

          <div className={styles.sortWrap}>
            <label className={styles.sortLabel} htmlFor="result-sort">
              Sort
            </label>
            <select
              id="result-sort"
              className={styles.select}
              value={query.sort}
              onChange={(e) => onSort(e.target.value as SortOrder)}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <div className={styles.state} role="alert">
            <h2>
              {error instanceof HttpError && error.status === 429
                ? 'OpenAlex is momentarily busy'
                : 'We couldn’t finish that search'}
            </h2>
            <p>
              {error instanceof HttpError && error.status === 429
                ? 'You’ve hit the shared rate limit. Wait a moment, then try again — Vellum never quietly drops requests.'
                : error instanceof Error
                  ? error.message
                  : 'An unexpected problem occurred while talking to the provider.'}
            </p>
            <button
              type="button"
              className={styles.retry}
              onClick={() => refetch()}
            >
              <Icon name="refresh" size={15} />
              Try again
            </button>
          </div>
        ) : isLoading && !data ? (
          <div className={styles.skeleton} aria-hidden="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeletonRow} />
            ))}
          </div>
        ) : data && data.papers.length === 0 ? (
          <div className={styles.state}>
            <h2>Nothing matched “{queryLabel}”.</h2>
            <p>
              Try broader terms, drop a filter, or search in English — Vellum
              matches against abstracts, so describing the idea often finds
              more than naming it.
            </p>
          </div>
        ) : (
          <>
            <ResultsList papers={data?.papers ?? []} annotations={annotations} />
            <nav className={styles.pagination} aria-label="Search results pages">
              <button
                type="button"
                className={styles.pageButton}
                disabled={query.page <= 1}
                onClick={() => goToPage(query.page - 1)}
              >
                <Icon name="arrow-left" size={15} />
                Previous
              </button>
              <span className={styles.pageStatus} aria-live="polite">
                Page {query.page} of {totalPages.toLocaleString()}
              </span>
              <button
                type="button"
                className={styles.pageButton}
                disabled={query.page >= totalPages}
                onClick={() => goToPage(query.page + 1)}
              >
                Next
                <Icon name="arrow-right" size={15} />
              </button>
            </nav>
          </>
        )}
      </section>

      <FiltersDrawer
        params={searchParams}
        onChange={changeSearch}
        resultCount={total}
      />
    </div>
  )
}

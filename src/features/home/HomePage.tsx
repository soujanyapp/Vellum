import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { SearchBar, ExampleSearches } from '@/features/search/SearchBar'
import { Icon } from '@/components/ui/Icon'
import { isDemoMode, sourceLabel } from '@/services'
import styles from './home.module.css'

const SOURCES = [
  {
    name: 'OpenAlex',
    meta: '250M+ works · General discovery',
    blurb:
      'A public index of over 250 million works contributed by thousands of institutions — the primary open catalogue Vellum searches across all disciplines.',
    link: 'https://openalex.org',
  },
  {
    name: 'Europe PMC',
    meta: '44M+ records · Biomedical search',
    blurb:
      'Specialized biomedical and life-sciences literature with direct links to PubMed Central full-text open-access articles and biological data.',
    link: 'https://europepmc.org',
  },
  {
    name: 'Crossref',
    meta: '160M+ records · Metadata verification',
    blurb:
      'Canonical publisher deposits used by Vellum for deterministic DOI verification, publisher links, and authoritative bibliographies.',
    link: 'https://crossref.org',
  },
]

export function HomePage() {
  const location = useLocation()
  const sourcesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (location.state?.scrollTo === 'sources') {
      sourcesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // consume the state so a refresh doesn't re-scroll
      window.history.replaceState({}, '')
    }
  }, [location.state])

  const live = !isDemoMode

  return (
    <div>
      <section className={`${styles.hero} container`} aria-labelledby="hero-title">
        <p className={`${styles.eyebrow} v-mono`}>Vellum · scholarly search</p>
        <h1 id="hero-title" className={styles.heroTitle}>
          One search across
          <br />
          the open scholarly record.
        </h1>
        <p className={styles.heroSub}>
          Ask the way a researcher thinks — concepts, methods, questions — and
          Vellum returns the works that answer it.
        </p>

        <div className={styles.searchZone}>
          <SearchBar variant="hero" />
          <div className={styles.underSearch}>
            <span className={styles.underSearchLabel}>Try</span>
            <ExampleSearches />
          </div>
        </div>

        <p className={`${styles.sourceLine} v-mono`}>
          {live
            ? 'Live lookup via OpenAlex — no key, no sign-in.'
            : `Serving ${sourceLabel.toLowerCase()} — synthetic records for preview.`}
        </p>
      </section>

      <section className="container" aria-label="How Vellum reads your search">
        <div className={styles.problems}>
          <article className={styles.problemCard}>
            <span className={styles.problemNum} aria-hidden="true">
              01
            </span>
            <h2>Ranked by understanding, not keywords</h2>
            <p>
              Your query is matched semantically against the abstract index,
              so a search for &ldquo;how attention fixes long-range
              dependencies&rdquo; finds the Transformer paper — not a
              keyword&rsquo;s echo chamber.
            </p>
          </article>
          <article className={styles.problemCard}>
            <span className={styles.problemNum} aria-hidden="true">
              02
            </span>
            <h2>Filter the way you already read</h2>
            <p>
              Year ranges, research type, language, venue and open-access
              status sit on the record itself — composed freely, no query
              syntax to learn.
            </p>
          </article>
          <article className={styles.problemCard}>
            <span className={styles.problemNum} aria-hidden="true">
              03
            </span>
            <h2>Every work leads somewhere real</h2>
            <p>
              Vellum is a finding aid, not a silo: every result links out to
              its publisher record, repository or a legitimate open copy you
              can actually read.
            </p>
          </article>
        </div>
      </section>

      <section className="container" aria-labelledby="differentiation-title">
        <div className={styles.whyVellum}>
          <div className={styles.whyVellumHeading}>
            <p className={`${styles.eyebrow} v-mono`}>Why Vellum</p>
            <h2 id="differentiation-title">Where Vellum is different</h2>
            <p className={styles.whyVellumIntro}>
              Most scholarly search engines help you find papers. Vellum helps
              you understand what you found.
            </p>
          </div>

          <div className={styles.pillars}>
            <article className={styles.pillar}>
              <span className={`${styles.pillarNum} v-mono`} aria-hidden="true">
                01
              </span>
              <h3>Why This Paper</h3>
              <p>
                Understand why a paper appeared in your results through
                transparent, metadata-derived signals.
              </p>
            </article>

            <article className={styles.pillar}>
              <span className={`${styles.pillarNum} v-mono`} aria-hidden="true">
                02
              </span>
              <h3>Start Here</h3>
              <p>
                Get a suggested path through a research topic, from foundations
                to recent developments.
              </p>
            </article>

            <article className={styles.pillar}>
              <span className={`${styles.pillarNum} v-mono`} aria-hidden="true">
                03
              </span>
              <h3>Research Landscape</h3>
              <p>
                Understand the shape of a research area through topics,
                publication trends, and the papers in your search.
              </p>
            </article>
          </div>

          <p className={styles.coda}>
            &ldquo;Search less blindly. Read with direction.&rdquo;
          </p>
        </div>
      </section>

      <section ref={sourcesRef} id="sources" className="container" aria-labelledby="sources-title">
        <div className={styles.sources}>
          <div className={styles.sourcesHeading}>
            <p className={`${styles.eyebrow} v-mono`}>The record today</p>
            <h2 id="sources-title">Scholarly sources</h2>
            <p className={styles.sourcesSub}>
              A search engine is only as honest as its sources. Vellum is
              transparent about what it indexes, and clearly marks every
              synthetic record used during development.
            </p>
          </div>

          <ul className={styles.sourceList}>
            {SOURCES.map((source) => (
              <li key={source.name}>
                <a
                  href={source.link}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.sourceCard}
                >
                  <span className={styles.sourceName}>
                    {source.name}
                    <Icon name="external" size={14} />
                  </span>
                  <span className={`${styles.sourceMeta} v-mono`}>{source.meta}</span>
                  <span className={styles.sourceBlurb}>{source.blurb}</span>
                </a>
              </li>
            ))}
            {isDemoMode && (
              <li className={styles.sourceCard}>
                <span className={styles.sourceName}>
                  Built-in preview data
                  <Icon name="alert" size={14} />
                </span>
                <span className={`${styles.sourceMeta} v-mono`}>Synthetic fixtures</span>
                <span className={styles.sourceBlurb}>
                  Clearly labeled stand-ins for records, used only when the
                  preview source is active. Never presented as real research.
                </span>
              </li>
            )}
          </ul>
        </div>
      </section>
    </div>
  )
}

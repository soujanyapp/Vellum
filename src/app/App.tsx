import type { ReactNode } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { isDemoMode } from '@/services'
import { Icon } from '@/components/ui/Icon'
import wordmarkStyles from './wordmark.module.css'

/**
 * "Sources" is a section on the home page. From other pages we land on home
 * first and scroll to the section via router state — this stays compatible
 * with hash routing, where a raw `/#sources` fragment would collide.
 */
function useSourcesNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const onHome = location.pathname === '/'
  return () => {
    if (onHome) {
      document
        .getElementById('sources')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      navigate('/', { state: { scrollTo: 'sources' } })
    }
  }
}

interface AppProps {
  children?: ReactNode
}

export function App({ children }: AppProps) {
  const goToSources = useSourcesNav()

  return (
    <div className="app">
      <a className="v-skip" href="#main">
        Skip to content
      </a>

      {isDemoMode && (
        <div className="demo-banner" role="status">
          <Icon name="alert" size={14} />
          Demo data — synthetic fixtures for interface development. Run with
          live OpenAlex data via <code>VITE_DISCOVERY_SOURCE=openalex</code>.
        </div>
      )}

      <header className="app-header">
        <div className="app-header__inner container">
          <Link to="/" className={wordmarkStyles.wordmark} aria-label="Vellum — home">
            <span className={wordmarkStyles.wordmarkMark} aria-hidden="true">
              V
            </span>
            <span className={wordmarkStyles.wordmarkName}>Vellum</span>
          </Link>

          <nav className="app-nav" aria-label="Primary">
            <Link to="/search" className="app-nav__link">
              Search
            </Link>
            <button type="button" className="app-nav__link" onClick={goToSources}>
              Sources
            </button>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        <div className="container app-footer__inner">
          <p className="app-footer__lede">
            Vellum is an open search interface over scholarly metadata. Works
            are linked to their publisher pages, repositories and legitimate
            open-access copies — Vellum does not host full texts.
          </p>
          <p className="app-footer__meta v-mono">
            Data: OpenAlex <span className="app-footer__dot">·</span> Not
            affiliated with any publisher
          </p>
        </div>
      </footer>

      {children}
    </div>
  )
}

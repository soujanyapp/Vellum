import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Restores scroll position on navigation (results to detail pages, etc.). */
export function ScrollToTopOnNavigate() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, search])
  return null
}

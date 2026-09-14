import { createHashRouter } from 'react-router-dom'
import { App } from './App'
import { HomePage } from '@/features/home/HomePage'
import { ResultsPage } from '@/features/results/ResultsPage'
import { PaperPage } from '@/features/paper/PaperPage'
import { AuthorPage } from '@/features/author/AuthorPage'
import { NotFoundPage } from '@/features/home/NotFoundPage'
import { ScrollToTopOnNavigate } from './ScrollToTopOnNavigate'

/**
 * HashRouter keeps every route refresh-safe on GitHub Pages, where there is
 * no server to rewrite `/search` to `index.html`. Deep links stay shareable
 * (`#/papers/W123…`).
 */
export const router = createHashRouter([
  {
    path: '/',
    element: (
      <App>
        <ScrollToTopOnNavigate />
      </App>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'search', element: <ResultsPage /> },
      { path: 'papers/:workId', element: <PaperPage /> },
      { path: 'authors/:authorId', element: <AuthorPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

# Vellum

A production-quality static search interface for the open scholarly record.

Vellum searches [OpenAlex](https://openalex.org) — a public index of over 250
million works — through a clean, editorial interface designed for researchers
and librarians. It is built with React, TypeScript and Vite, and deployed as a
static site on GitHub Pages.

## Getting started

```bash
npm install
npm run dev
```

The dev server opens at `http://localhost:5173`.

By default, Vellum searches live OpenAlex data. For offline development:

```bash
VITE_DISCOVERY_SOURCE=mock npm run dev
```

A "Demo data" banner appears when serving synthetic fixtures.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run unit tests (vitest) |
| `npm run lint` | Lint all source files |
| `npm run typecheck` | Type-check without emitting |

## Architecture

```
src/
  domain/          Domain types (Paper, Author, SearchQuery, PaperSource...)
  services/
    openalex/      OpenAlex adapter (types → normalize → client → adapter)
    mock/          Synthetic fixtures (reference adapter implementation)
    index.ts       Source selection (VITE_DISCOVERY_SOURCE)
  hooks/           Data-fetching hooks with AbortController + cache
  lib/             Shared utilities (formatting, HTTP, abstract reconstruction)
  features/
    home/          Landing page
    search/        SearchBar combobox + suggestion hook
    results/       Results list with virtualization, sort, pagination
    filters/       Filter panel + mobile drawer, URL-driven
    paper/         Paper detail page
    author/        Author profile page
  components/ui    Primitive UI (Icon)
  test/            Integration tests + vitest setup
```

## Data sources

Vellum is a discovery interface, not a repository. Every result links to its
publisher page or a legitimate open copy. No full texts are hosted.

| Source | Status | Notes |
| --- | --- | --- |
| **OpenAlex** | Default | Public index, no key required, rich metadata |
| Semantic Scholar | Excluded (MVP) | Shared-pool rate limits (429) |
| Crossref | Excluded (MVP) | Sparse records, poor abstract coverage |
| arXiv | Excluded (MVP) | No CORS headers; covered by OpenAlex |

See [docs/sources.md](./docs/sources.md) for full rationale and future plans.

## Deploying

Push to `main` to trigger the GitHub Pages deployment via the included
[workflow](.github/workflows/publish.yml).

Vellum uses `HashRouter` with `base: './'` so it works on GitHub Pages without
server-side URL rewriting.

## License

This project is an interface for public scholarly metadata. The code is
released under the MIT License. OpenAlex data is subject to its own terms.

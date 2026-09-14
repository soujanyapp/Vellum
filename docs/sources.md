# Data sources

Vellum is a discovery interface, not a repository. Every result links to its
publisher record or a legitimate open copy. No full texts are hosted.

## Default: OpenAlex

The production source is [OpenAlex](https://openalex.org), a public catalogue
of scholarly works. OpenAlex is built by the nonprofit OurResearch and indexes
over 250 million works.

**Why OpenAlex for the MVP:**

- Freely accessible with no API key required
- Rich, normalized metadata (abstracts via inverted index, citations, OA status, author profiles, topics)
- Strong coverage across disciplines and time periods
- Fast response times and generous rate limits on the shared endpoint

**What Vellum uses from OpenAlex:**

- Works search (`/works`) with abstract-inverted-index reconstruction
- Work detail with `related_works` graph
- Author profiles and author works listing
- Filter facets: publication year, work type, language, OA status, venue, citation threshold

**Limitations of the MVP OpenAlex source:**

- Relevance ranking uses OpenAlex's semantic relevance score, which is opaque
  and may not match human judgment in all cases
- Abstracts for works lacking `abstract_inverted_index` are unavailable
- The OpenAlex vocabulary for work types and languages is fixed; Vellum maps a
  curated subset into human-friendly labels
- Venue filtering matches by source display name; disambiguation of overlapping
  journal titles is out of scope for now

---

## What Vellum does NOT search

### Semantic Scholar

Semantic Scholar offers a high-quality graph and semantic search. However, as
of the evaluation date, the public API returned **HTTP 429 (Too Many Requests)**
consistently on the shared pool, making it unreliable as a default source
without an API key. It remains a strong candidate for a future paid or
key-based adapter.

### Crossref

Crossref has open CORS and good citation metadata, but work records are
frequently sparse (missing abstracts, inconsistent author normalization, no
topic/concept enrichment). It is a valuable fallback for citation graph
queries and metadata enrichment, but not a good primary search source for a
general discovery interface.

### arXiv

The arXiv API does not return CORS headers, which prevents direct browser-side
consumption without a backend proxy. arXiv preprints are well-covered by
OpenAlex, which includes full-text abstracts and links back to the arXiv
landing page.

---

## Synthetic mock data

During development and for preview deployments, Vellum can serve synthetic
fixtures (`VITE_DISCOVERY_SOURCE=mock`). These records are:

- Generated from a small pool of generic phrasings and fabricated authors
- Clearly marked with a persistent "Demo data" banner in the UI
- Assigned DOIs under the reserved test prefix `10.9999`
- Never presented as real research outputs

The mock source exists to develop the interface without depending on live
network conditions or API quotas. It is never the default in production builds.

---

## Future expansion

The adapter architecture supports adding new sources without changing any UI
code:

1. Implement the `PaperSource` contract in `src/services/<source>/`
2. Register the source in `src/services/index.ts`
3. Filter options are derived from the same domain types — no hardcoded source
   assumptions anywhere in the rendering layer

Planned additions:

- **Semantic Scholar** (keyed/paid tier) for citation-graph features
- **OpenAlex + Crossref** hybrid for citation-enriched results
- A backend proxy enabling **arXiv** full-text search and optional authenticated access

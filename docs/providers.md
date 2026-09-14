# Vellum — Scholarly Data Providers & Legal Attribution

**Last Verified:** September 2026  
**Architecture:** Client-Side Static (React + TypeScript on GitHub Pages) — No backend, zero exposed API keys, no paid dependencies.

---

## Overview & Provider Policy

Vellum interfaces with the open scholarly record directly from the researcher's browser. To ensure sustainability, fairness, and legal compliance, Vellum adheres strictly to three principles:

1. **Explicit Legal Permissions:** We only integrate providers whose terms, licenses, and access models explicitly permit open, public, non-commercial research discovery without requiring private API secrets in client bundles.
2. **Polite Client Identification:** Requests to providers include descriptive headers and contact metadata (`mailto=support@vellum-research.org`) so providers can identify and communicate with the project.
3. **No Unbounded Crawling:** Searches are executed strictly on user demand with client-side caching (TTL-backed in-memory store) and AbortController request cancellation.

---

## 1. OpenAlex

- **Provider:** OurResearch (501(c)(3) nonprofit)
- **Role in Vellum:** **Primary General Discovery Engine**. General keyword, title, and abstract search across 250M+ works with hierarchical topic tagging and citations.
- **Official API Endpoint:** `https://api.openalex.org`
- **Access Model:** Free and open access. No API key or registration required for the Polite Pool.
- **Polite Pool Identification:** Included in query params (`mailto=support@vellum-research.org`).
- **Rate Limits:** 10 requests per second; up to 100,000 requests per day per user/IP.
- **Licensing & Usage:** OpenAlex data is dedicated to the public domain under the **Creative Commons CC0 1.0 Universal Public Domain Dedication**. Free for commercial and non-commercial reuse.
- **Attribution:** Data provided by OpenAlex. Vellum provides direct links to canonical OpenAlex work records and publisher pages.

---

## 2. Europe PMC

- **Provider:** European Bioinformatics Institute (EMBL-EBI) & Europe PMC Funders
- **Role in Vellum:** **Biomedical & Life Sciences Specialist Provider**. Dedicated search across PubMed, PMC, and life-sciences literature with direct Open Access full-text links (PDF and HTML).
- **Official API Endpoint:** `https://www.ebi.ac.uk/europepmc/webservices/rest/search`
- **Access Model:** Completely free and open. No API key, account, or registration required.
- **CORS Support:** Full cross-origin browser access (`access-control-allow-origin: *`).
- **Rate Limits:** Polite fair-use policy (~5–10 requests per second with exponential backoff on 429).
- **Licensing & Usage:** Bibliographic metadata is provided freely under **CC0** and open government terms. Open Access full-text links point directly to open licenses (e.g. CC-BY).
- **Attribution:** Data courtesy of Europe PMC and EMBL-EBI.

---

## 3. Crossref

- **Provider:** Crossref (Publishers International Linking Association, Inc.)
- **Role in Vellum:** **Canonical DOI Resolution, Verification & Metadata Enrichment**. Enriches paper records with publisher-verified publication dates, journal volumes/issues, page numbers, and canonical publisher URLs.
- **Official API Endpoint:** `https://api.crossref.org`
- **Access Model:** Free public access. Polite Pool activated via `mailto` query parameter.
- **CORS Support:** Full cross-origin browser access (`access-control-allow-origin: *`).
- **Polite Pool Identification:** `?mailto=support@vellum-research.org`.
- **Rate Limits:** 10 requests per second in the Polite Pool (concurrency 3–5).
- **Licensing & Usage:** All bibliographic metadata deposited with Crossref is licensed under **Creative Commons CC0 1.0 Universal**. Permitted for public research and discovery.
- **Attribution:** Metadata retrieved via the Crossref REST API. Crossref and DOI are registered trademarks of PILA.

---

## 4. Evaluated Providers Awaiting Future Phases

The following providers were systematically investigated and evaluated, but are deferred from the current client-side static deployment:

| Provider | Evaluation Status | Reason for Deferral |
|---|---|---|
| **DataCite** | IMPLEMENT LATER | High quality for research datasets and software. Planned for a dedicated "Research Datasets" phase. |
| **PubMed (NCBI)** | IMPLEMENT LATER | Redundant on client side; Europe PMC already exposes all PubMed records in a single, unified JSON call without the 3 req/s limit or 2-stage request dance. |
| **Semantic Scholar** | IMPLEMENT LATER — BACKEND REQUIRED | Shared unauthenticated pool consistently returns HTTP 429; dedicated quota requires a secret API key that cannot be stored in client-side code. |
| **arXiv** | DO NOT IMPLEMENT (STATIC FRONTEND) | `export.arxiv.org` does not supply CORS headers, triggering browser Same-Origin Policy blocks. (arXiv preprints are already covered in OpenAlex & Europe PMC). |
| **CORE** | DO NOT IMPLEMENT (STATIC FRONTEND) | Requires an API key and does not support browser CORS. |
| **OpenAIRE** | DO NOT IMPLEMENT (STATIC FRONTEND) | Unauthenticated access is restricted to 60 requests per hour per IP, which is exhausted almost immediately in a public web interface. |

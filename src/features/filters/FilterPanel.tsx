import { useId } from 'react'
import {
  clearedFilters,
  hasActiveFilters,
  withFilter,
  type FilterParams,
} from './queryParams'
import { LANGUAGE_OPTIONS, TYPE_OPTIONS } from './options'

interface FilterPanelProps {
  params: URLSearchParams
  onChange: (next: URLSearchParams) => void
}

const CURRENT_YEAR = new Date().getFullYear()

/**
 * All filter controls read and write the URL, which is the single source of
 * truth. `params` is recreated by the consumer on every navigation, so this
 * component stays fully controlled and never holds its own state.
 */
export function FilterPanel({ params, onChange }: FilterPanelProps) {
  const uid = useId()
  const filters = {
    from_year: params.get('from_year') ?? '',
    to_year: params.get('to_year') ?? '',
    oa: params.get('oa') ?? '',
    type: params.get('type') ?? '',
    lang: params.get('lang') ?? '',
    venue: params.get('venue') ?? '',
    min_cites: params.get('min_cites') ?? '',
  } as FilterParams

  const set = (key: keyof FilterParams, raw: string | number | boolean) =>
    onChange(withFilter(params, key, raw))

  const isEuropePmc = params.get('source') === 'europepmc'

  return (
    <div className="fp">
      <div className="fp__heading">
        <span className="fp__title">Refine</span>
        {hasActiveFilters(params) && (
          <button
            type="button"
            className="fp__clear"
            onClick={() => onChange(clearedFilters(params))}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="fp__field">
        <label className="fp__check" htmlFor={`${uid}-oa`}>
          <input
            id={`${uid}-oa`}
            type="checkbox"
            checked={filters.oa === '1'}
            onChange={(e) => set('oa', e.target.checked ? '1' : '')}
          />
          <span>Open access only</span>
        </label>
        <p className="fp__hint">Works with a free-to-read copy linked.</p>
      </div>

      <div className="fp__field">
        <p className="fp__label" id={`${uid}-year`}>
          Published
        </p>
        <div className="fp__row">
          <div className="fp__sub">
            <label className="fp__sublabel" htmlFor={`${uid}-from`}>
              From
            </label>
            <input
              id={`${uid}-from`}
              type="number"
              inputMode="numeric"
              min={1900}
              max={CURRENT_YEAR}
              placeholder={String(CURRENT_YEAR - 25)}
              value={filters.from_year}
              onChange={(e) => set('from_year', e.target.value)}
            />
          </div>
          <div className="fp__sub">
            <label className="fp__sublabel" htmlFor={`${uid}-to`}>
              To
            </label>
            <input
              id={`${uid}-to`}
              type="number"
              inputMode="numeric"
              min={1900}
              max={CURRENT_YEAR}
              placeholder={String(CURRENT_YEAR)}
              value={filters.to_year}
              onChange={(e) => set('to_year', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="fp__field">
        <label className="fp__label" htmlFor={`${uid}-type`}>
          Work type
        </label>
        <select
          id={`${uid}-type`}
          value={filters.type}
          disabled={isEuropePmc}
          onChange={(e) => set('type', e.target.value)}
        >
          <option value="">All types</option>
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {isEuropePmc ? (
          <p className="fp__hint">Work type filter is specific to OpenAlex.</p>
        ) : null}
      </div>

      <div className="fp__field">
        <label className="fp__label" htmlFor={`${uid}-lang`}>
          Language
        </label>
        <select
          id={`${uid}-lang`}
          value={filters.lang}
          disabled={isEuropePmc}
          onChange={(e) => set('lang', e.target.value)}
        >
          <option value="">Any language</option>
          {LANGUAGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {isEuropePmc ? (
          <p className="fp__hint">Language filter is specific to OpenAlex.</p>
        ) : null}
      </div>

      <div className="fp__field">
        <label className="fp__label" htmlFor={`${uid}-venue`}>
          Venue
        </label>
        <input
          id={`${uid}-venue`}
          type="text"
          autoComplete="off"
          placeholder="Journal, archive, repository"
          value={filters.venue}
          onChange={(e) => set('venue', e.target.value)}
        />
        <p className="fp__hint">Matches journal, archive or preprint server names.</p>
      </div>

      <div className="fp__field">
        <label className="fp__label" htmlFor={`${uid}-cites`}>
          Cited at least
        </label>
        <input
          id={`${uid}-cites`}
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="0"
          value={filters.min_cites}
          onChange={(e) => set('min_cites', e.target.value)}
        />
      </div>
    </div>
  )
}

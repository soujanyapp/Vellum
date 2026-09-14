import { useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSuggestions } from './useSuggestions'
import { paperPath } from '@/lib/paths'
import { Icon } from '@/components/ui/Icon'
import styles from './searchbar.module.css'

import type { SourceId } from '@/domain/papers'

type Variant = 'hero' | 'compact'

interface SearchBarProps {
  variant?: Variant
  initialValue?: string
  source?: SourceId
}

export function SearchBar({ variant = 'hero', initialValue = '', source }: SearchBarProps) {
  const navigate = useNavigate()
  const listboxId = useId()
  const inputId = useId()
  const [value, setValue] = useState(initialValue)
  const [focused, setFocused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const { suggestions, isLoading } = useSuggestions(
    focused ? value : '',
  )

  const open = focused && suggestions.length > 0
  const showEmpty = focused && value.trim().length >= 2 && !isLoading && suggestions.length === 0

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = value.trim()
    if (!q) return
    const sourceParam = source && source !== 'openalex' ? `&source=${encodeURIComponent(source)}` : ''
    navigate(`/search?q=${encodeURIComponent(q)}${sourceParam}`)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && !showEmpty) {
      if (e.key === 'Escape') inputRef.current?.blur()
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, -1))
        break
      case 'Escape':
        setActiveIndex(-1)
        inputRef.current?.blur()
        break
      case 'Enter': {
        if (open && activeIndex >= 0) {
          e.preventDefault()
          navigate(paperPath(suggestions[activeIndex].id))
          break
        }
        // fall through to native form submit
        break
      }
    }
  }

  return (
    <form
      className={variant === 'hero' ? styles.hero : styles.compact}
      onSubmit={submit}
      role="search"
    >
      <label className={styles.inputShell}>
        <span className={styles.inputVisual} aria-hidden="true">
          <Icon name="search" size={variant === 'hero' ? 20 : 16} />
        </span>
        <span className="sr-only" id={inputId}>
          Search scholarly works
        </span>
        <input
          ref={inputRef}
          type="search"
          inputMode="search"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className={styles.input}
          placeholder={
            variant === 'hero'
              ? 'Search the open scholarly record…'
              : 'Search works'
          }
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setActiveIndex(-1)
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            window.setTimeout(() => setFocused(false), 120)
          }}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open && activeIndex >= 0 ? `${listboxId}-item-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          aria-label="Search scholarly works"
        />
        {isLoading && (
          <span className={styles.spinner} aria-hidden="true" />
        )}
        {value && (
          <button
            type="button"
            className={styles.clear}
            aria-label="Clear search"
            onClick={() => {
              setValue('')
              inputRef.current?.focus()
            }}
          >
            <Icon name="x" size={14} />
          </button>
        )}
      </label>

      {open && (
        <div className={styles.popover} role="listbox" id={listboxId}>
          <p className={styles.popoverHint}>
            {suggestions.length === 0
              ? 'Nothing matches — press Enter to run a full search'
              : `Showing ${suggestions.length} closest matches`}
          </p>
          <ul className={styles.suggestions}>
            {suggestions.map((paper, i) => (
              <li key={paper.id}>
                <Link
                  id={`${listboxId}-item-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  className={`${styles.suggestion} ${
                    i === activeIndex ? styles.suggestionActive : ''
                  }`}
                  to={paperPath(paper.id)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <span className={styles.suggestionTitle}>{paper.title}</span>
                  <span className={styles.suggestionMeta}>
                    {paper.authors[0]?.name ?? 'Anonymous'}
                    {paper.authors.length > 1 ? `+${paper.authors.length - 1}` : ''}
                    <span className={styles.suggestionDots} aria-hidden="true" />
                    {paper.venue ?? 'Unknown venue'}
                    <span className={styles.suggestionDots} aria-hidden="true" />
                    {paper.publicationYear ?? 'n.d.'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showEmpty && (
        <div className={styles.popover} role="status">
          <p className={styles.popoverHint}>
            No direct matches — press Enter to run a full search
          </p>
        </div>
      )}
    </form>
  )
}

export function ExampleSearches() {
  const examples = [
    ['Large language models in medicine', 'llm'],
    ['Reinforcement learning from human feedback', 'rlhf'],
    ['Electrocatalysis for green hydrogen', 'water electrolysis'],
    ['Causal inference in epidemiology', 'causal'],
  ]
  return (
    <ul className={styles.examples}>
      {examples.map(([label, query]) => (
        <li key={query}>
          <Link to={`/search?q=${encodeURIComponent(query)}`} className={styles.example}>
            {label}
            <Icon name="arrow-right" size={14} />
          </Link>
        </li>
      ))}
    </ul>
  )
}


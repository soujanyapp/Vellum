import { Icon } from '@/components/ui/Icon'
import * as Dialog from '@radix-ui/react-dialog'
import { FilterPanel } from './FilterPanel'
import styles from './filters.module.css'
import { hasActiveFilters } from './queryParams'

interface FiltersDrawerProps {
  params: URLSearchParams
  onChange: (next: URLSearchParams) => void
  resultCount?: number
}

export function FiltersDrawer({
  params,
  onChange,
  resultCount,
}: FiltersDrawerProps) {
  const active = hasActiveFilters(params)

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className={styles.trigger}
          aria-label="Filters"
        >
          <Icon name="sliders" size={16} />
          {active ? 'Filters (active)' : 'Filters'}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.drawer} aria-label="Filter results">
          <div className={styles.drawerHead}>
            <Dialog.Title asChild>
              <h2 className={styles.drawerHeading}>Refine your search</h2>
            </Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className={styles.drawerClose} aria-label="Close filters">
                <Icon name="x" size={18} />
              </button>
            </Dialog.Close>
          </div>
          <div className={styles.drawerScroll}>
            <FilterPanel params={params} onChange={onChange} />
          </div>
          <Dialog.Close asChild>
            <button type="button" className={styles.drawerSubmit}>
              Show {resultCount ?? 'results'}
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

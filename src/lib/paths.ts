import { idSuffix } from './format'

/** Route-safe ids: full URLs degrade to their trailing identifier. */
export function paperPath(id: string): string {
  return `/papers/${idSuffix(id) ?? id}`
}

export function authorPath(id: string): string {
  return `/authors/${idSuffix(id) ?? id}`
}

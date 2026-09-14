/**
 * Reconstructs an abstract from OpenAlex's inverted index.
 *
 * OpenAlex stores abstracts as `{ word: [positions...] }`. Reassembly must
 * sort each word by position and interleave words that share positions.
 *
 * Produced fragments are joined with a space — as OpenAlex does when
 * exporting abstracts — rather than a query string-style '+' (which is
 * commonly seen in examples but not what the API itself emits).
 */

export interface InvertedIndex {
  [word: string]: number[]
}

const WORD_TOKEN = /\S+/

export function abstractFromInvertedIndex(
  index: InvertedIndex | null | undefined,
): string | null {
  if (!index) return null

  const sorted: string[] = []
  const tokensByIdx = new Map<number, string[]>()

  for (const word of Object.keys(index)) {
    for (const pos of index[word]) {
      const group = tokensByIdx.get(pos)
      if (group) group.push(word)
      else tokensByIdx.set(pos, [word])
    }
  }

  const positions = Array.from(tokensByIdx.keys()).sort((a, b) => a - b)
  for (const pos of positions) {
    const words = tokensByIdx.get(pos)
    if (!words) continue
    // Words sharing a position belong to the same token sequence.
    sorted.push(...words)
  }

  if (sorted.length === 0) return null
  return sorted.join(' ')
}

/** Whether a total inverted index payload is present but — effectively — empty. */
export function isInvertedIndexEmpty(
  index: InvertedIndex | null | undefined,
): boolean {
  if (!index) return true
  return Object.keys(index).length === 0
}

export function wordCount(text: string | null | undefined): number {
  if (!text) return 0
  const m = text.match(WORD_TOKEN)
  return m ? m.length : 0
}
/**
 * The management toolbar's view rules shared by the Institute Admin's lists (the export's `vm04`
 * Student access and `vm06` People › Students, with `vm08` / `vm15` for the chips): which status
 * segments show — the first ("Current", "All") always, then each status that has rows or is the
 * one chosen, in the given order — and a filter chip with its remove button's name and the control
 * focus returns to. Counts come from the rows the page already read; nothing is counted elsewhere.
 */
import type { IaFilterChip, IaSegment } from '@xr/ui/v3';

import { removeFilterLabel } from '@/copy/ia-shared';

export interface SegmentDefinition<Key extends string> {
  readonly key: Key;
  readonly label: string;
}

/**
 * The segments to draw: `first` always with its count, then each of `rest` that has a count or is
 * `current` (a status chosen before its last row went still shows, with 0).
 */
export function visibleSegments<Key extends string>(
  first: SegmentDefinition<Key> & { readonly count: number },
  rest: readonly SegmentDefinition<Key>[],
  counts: ReadonlyMap<Key, number>,
  current: Key,
): IaSegment<Key>[] {
  return [
    { key: first.key, label: first.label, count: first.count },
    ...rest
      .filter((segment) => (counts.get(segment.key) ?? 0) > 0 || segment.key === current)
      .map((segment) => ({
        key: segment.key,
        label: segment.label,
        count: counts.get(segment.key) ?? 0,
      })),
  ];
}

/** How many rows each key has. */
export function countBy<Row, Key>(
  rows: readonly Row[],
  keyOf: (row: Row) => Key,
): Map<Key, number> {
  const counts = new Map<Key, number>();
  for (const row of rows) counts.set(keyOf(row), (counts.get(keyOf(row)) ?? 0) + 1);
  return counts;
}

/** A filter's chip: its words, its remove button's name, and the control focus returns to. */
export function filterChip(
  key: string,
  label: string,
  onRemove: () => void,
  focusId: string,
): IaFilterChip {
  return { key, label, removeLabel: removeFilterLabel(label), onRemove, focusId };
}

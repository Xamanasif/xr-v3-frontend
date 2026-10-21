'use client';

import { useMemo } from 'react';

import { usePublishedCatalogue } from '@/queries/catalogue';

/**
 * Course codes with their names (COMPONENT-EXTENSIONS "course codes always with names"): the
 * reviewer's reads carry a course's platform code only (`courseCode`, `scopeLine`), so its name is
 * looked up in ONE existing aggregate read — the public catalogue (`CatalogueService
 * .searchCatalogue`, the query every session may make), whose entries carry each course's code and
 * name. No per-row read. A course with nothing published is not in the catalogue: its code is shown
 * alone, as it is while the catalogue loads or if it fails.
 */
export type CourseNameOf = (code: string | null | undefined) => string | null;

/** The catalogue's entries as a code → name lookup (the first name seen for a code). */
export function courseNamesOf(
  entries: readonly { readonly platformCode: string | null; readonly courseName: string }[],
): ReadonlyMap<string, string> {
  const names = new Map<string, string>();
  for (const entry of entries) {
    if (entry.platformCode && !names.has(entry.platformCode)) {
      names.set(entry.platformCode, entry.courseName);
    }
  }
  return names;
}

/** The name of a course code, once the catalogue has answered; `null` otherwise. */
export function useRvCourseNames(): CourseNameOf {
  const catalogue = usePublishedCatalogue();
  const answer = catalogue.data;
  const names = useMemo(
    () => (answer?.ok ? courseNamesOf(answer.value.entries) : new Map<string, string>()),
    [answer],
  );
  return useMemo(() => (code) => (code ? (names.get(code) ?? null) : null), [names]);
}

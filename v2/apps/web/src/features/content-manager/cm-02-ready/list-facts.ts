'use client';

import { FORMAT_META, inDisplayOrder, type Technology } from '@xr/domain';
import type { FormatCode } from '@xr/ui';

import { weekdayDate } from '@/copy/dates';
import { CONTENT_LIBRARY_ADDRESS, type LibraryTab } from '@/nav/content-manager';
import { useSession } from '@/queries/session';

/**
 * Facts the Content Manager's lists (CM-01, CM-02, CM-04, CM-09) share in the V3 design: today
 * on the sample clock, a row's format codes, and the library's address with its view and course.
 */

/**
 * Today on the sample clock: the session's sign-in instant (the shell's top line, as the other
 * roles' V3 pages read it) — the waits ("13 days") are counted to it.
 */
export function useToday(): { readonly instant: string | null; readonly line: string | undefined } {
  const session = useSession();
  const instant = session.status === 'signed-in' ? session.signedInAt : null;
  return { instant, line: instant ? weekdayDate(instant) : undefined };
}

/** A row's formats as the badges name them, WEB · AR · VR · MR. */
export function formatCodes(formats: readonly Technology[]): FormatCode[] {
  return inDisplayOrder(new Set(formats)).map((format) => FORMAT_META[format].code as FormatCode);
}

/** `?course=` of the library address (none: every course). */
export function libraryCourseOf(search: string): string | null {
  return new URLSearchParams(search).get('course') || null;
}

/**
 * CM-04 on a view, filtered to a course or not (state-copy `CM-04.address`): Ready carries no
 * `tab`; a course adds `course=<id>`.
 */
export function libraryViewAddress(tab: LibraryTab, course: string | null = null): string {
  const params = new URLSearchParams();
  if (tab !== 'ready') params.set('tab', tab);
  if (course) params.set('course', course);
  const query = params.toString();
  return query ? `${CONTENT_LIBRARY_ADDRESS}?${query}` : CONTENT_LIBRARY_ADDRESS;
}

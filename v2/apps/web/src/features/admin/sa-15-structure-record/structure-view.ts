import type { Out, getStructureCourseOutput } from '@xr/contracts/draft';
import type { ActorRef, HistoryEntry, StructureEvent } from '@xr/domain';

import { dayMonthYear } from '@/copy/dates';
import {
  courseAddedNote,
  facultyUseWords,
  historyWhat,
  institutionUseWords,
  movedNote,
  RECORD_PAGE,
  renamedNote,
  usesList,
} from '@/copy/structure';

/** `AcademicStructureService.getCourse`: the course, its area’s name, what uses it (PC-69). */
export type CourseView = Out<typeof getStructureCourseOutput>;

/** One line of a record’s History (`li.xr-tl`). */
export interface HistoryLine {
  readonly id: string;
  readonly what: string;
  readonly when: string;
  readonly note: string | null;
}

function actorName(actor: ActorRef): string | null {
  if (actor.kind === 'person') return actor.displayName;
  if (actor.kind === 'requester') return actor.name;
  return null;
}

/**
 * A record’s History, newest first (state-copy `SA-15.history`): the entries the Super Admin may
 * read, each event in B7-07’s words with its day. Entries recorded at the same moment keep the
 * record’s own order, the later first (the course’s code after its addition, B7-07 f1).
 */
export function historyLines(
  history: readonly HistoryEntry<StructureEvent>[],
  areaName: string | null,
  areaNames: ReadonlyMap<string, string> = new Map(),
): readonly HistoryLine[] {
  const moved = history.some((entry) => entry.event === 'course-moved');
  // An added course’s note says it has no platform code yet — until a code is set (that newer
  // entry says so), as B7-07 draws “Fluid Mechanics” (f8) and not the coded courses (f1).
  const coded = history.some((entry) => entry.event === 'platform-code-set');
  return history
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.visibleTo.includes('super_admin'))
    .sort((a, b) =>
      a.entry.at === b.entry.at ? b.index - a.index : a.entry.at < b.entry.at ? 1 : -1,
    )
    .map(({ entry }) => ({
      id: entry.id,
      what: historyWhat(entry.event, actorName(entry.actor), entry.note),
      when: dayMonthYear(entry.at),
      note:
        entry.event === 'renamed' && entry.note
          ? renamedNote(entry.note)
          : entry.event === 'course-added' && !coded
            ? courseAddedNote(moved ? null : areaName)
            : entry.event === 'course-moved'
              ? movedNoteOf(entry, areaNames)
              : null,
    }));
}

/** A move's "From … to …." from the two areas the entry names, when both are known. */
function movedNoteOf(
  entry: HistoryEntry<StructureEvent>,
  areaNames: ReadonlyMap<string, string>,
): string | null {
  const [from, to] = entry.refs
    .filter((ref) => ref.kind === 'AREA')
    .map((ref) => areaNames.get(ref.id));
  return from && to ? movedNote(from, to) : null;
}

/** One row of “What uses this course” (`dl.xl-kv.xv-kv`). */
export interface UseRow {
  readonly key: string;
  readonly value: string;
}

/**
 * “What uses this course” (B7-07 f1 … f4, f8): the service’s counts and the named facts beside
 * them, in the board’s order (state-copy `SA-15.uses.*`).
 */
export function usesRows(view: CourseView): readonly UseRow[] {
  const keys = RECORD_PAGE.usesKeys;
  const institutions = [...view.detail.institutions]
    .map((institution, index) => ({ institution, index }))
    .sort((a, b) =>
      a.institution.ended === b.institution.ended
        ? a.index - b.index
        : a.institution.ended
          ? 1
          : -1,
    )
    .map(({ institution }) =>
      institutionUseWords(institution.name, institution.institutionCode, institution.ended),
    );
  const vendors = [...new Set(view.detail.vendors.map((vendor) => vendor.organisation))];
  const faculty = view.detail.faculty.map((group) =>
    facultyUseWords(group.institutionName, group.names),
  );
  return [
    { key: keys.experiments, value: String(view.usage.publishedExperiments) },
    { key: keys.institutions, value: usesList(institutions) },
    { key: keys.vendors, value: usesList(vendors) },
    { key: keys.faculty, value: usesList(faculty) },
    { key: keys.students, value: String(view.usage.studentsFiled) },
  ];
}

/** The Faculty part of the blocked notice: the record’s own “Faculty mapped to it” words. */
export function facultyWords(view: CourseView, facultyFiled: number): string {
  if (view.detail.faculty.length > 0) {
    return view.detail.faculty
      .map((group) => facultyUseWords(group.institutionName, group.names))
      .join(', ');
  }
  return facultyFiled > 0 ? `${facultyFiled} Faculty member${facultyFiled === 1 ? '' : 's'}` : '';
}

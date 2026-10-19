import type { getStructureCourseOutput, Out } from '@xr/contracts/draft';
import type { ActorRef, HistoryEntry, StructureEvent } from '@xr/domain';
import type { StructureLink } from '@xr/ui/v3';

import { dayMonthYear } from '@/copy/dates';
import {
  courseAddedNote,
  facultyCountWords,
  facultyUseWords,
  historyWhat,
  institutionAfterWords,
  movedNote,
  peopleFiledWords,
  renamedNote,
} from '@/copy/structure';
import { institutionAddress } from '@/nav/institutions';
import { holderAddress } from '@/nav/platform-roles';
import type { MoveCheck } from '@/queries/structure-forms';

/** `AcademicStructureService.getCourse`: the course, its area’s name, what uses it (PC-69). */
export type CourseView = Out<typeof getStructureCourseOutput>;

/** One line of a record’s History (`ol.rk-tl > li`). */
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

/**
 * “Institutions” (state-copy `SA-15.uses.institutions`): each institution whose access plan holds
 * one of the course’s experiments, current ones first, linked to its record (SA-07) by its name,
 * its own code for the course and “ended” after the link.
 */
export function institutionLinks(view: CourseView): readonly StructureLink[] {
  return [...view.detail.institutions]
    .map((institution, index) => ({ institution, index }))
    .sort((a, b) =>
      a.institution.ended === b.institution.ended
        ? a.index - b.index
        : a.institution.ended
          ? 1
          : -1,
    )
    .map(({ institution }) => ({
      key: institution.institutionId,
      href: institutionAddress(institution.institutionId),
      label: institution.name,
      after: institutionAfterWords(institution.institutionCode, institution.ended) || undefined,
    }));
}

/** “Vendors in scope” (state-copy `SA-15.uses.vendors`): each holder once, linked to SA-17. */
export function vendorLinks(view: CourseView): readonly StructureLink[] {
  const seen = new Set<string>();
  return view.detail.vendors
    .filter((vendor) => {
      if (seen.has(vendor.holderId)) return false;
      seen.add(vendor.holderId);
      return true;
    })
    .map((vendor) => ({
      key: vendor.holderId,
      href: holderAddress(vendor.holderId),
      label: vendor.name,
    }));
}

/** The Faculty mapped to the course, per institution, as the record words them. */
function facultyParts(view: CourseView, facultyFiled: number): readonly string[] {
  if (view.detail.faculty.length > 0) {
    return view.detail.faculty.map((group) => facultyUseWords(group.institutionName, group.names));
  }
  return facultyFiled > 0 ? [facultyCountWords(facultyFiled)] : [];
}

/** “People filed against it” (state-copy `SA-15.uses.people`): who, or nothing. */
export function peopleWords(view: CourseView): string {
  return peopleFiledWords(view.usage.studentsFiled, facultyParts(view, view.usage.facultyMapped));
}

/** Who blocks the move, from the service’s move check (the blocked notice’s “<who>”). */
export function blockedWho(view: CourseView, check: MoveCheck): string {
  return peopleFiledWords(check.blockers.students, facultyParts(view, check.blockers.faculty));
}

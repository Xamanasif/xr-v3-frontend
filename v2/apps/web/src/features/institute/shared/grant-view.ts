/**
 * A grant row as the Institute Admin's grants tables draw it (the export's `saRow`, shared by IA-03
 * "Students you’ve given access", IA-04 Student access and IA-07 "Experiments given"): who it
 * reaches, how it was given (individually, or through a group — its page's address), when, its
 * status in the V3 grammar, and the formats it inherits from the plan. Pure, over the rows the
 * existing reads answer: `StudentAccessService.listGrants` / `PeopleService.getStudent`
 * (`grantRow`) and `InstitutionService.getAccessPlan` (`planGrantRow`). Nothing here decides who
 * can open what (OD-B2-01): each row keeps the status the service answers.
 */
import type { GrantRow, PlanGrantRow } from '@xr/contracts/draft';
import type { Technology } from '@xr/domain';
import type { FormatCode } from '@xr/ui';

import { dayMonthYear } from '@/copy/dates';
import { IA_HOW_GIVEN, formatsFromPlanLabel, viaGroupLabel } from '@/copy/ia-shared';
import { groupAddress, studentRecordAddress } from '@/nav/institute';

import { formatCodes } from './format-codes';
import { grantStatusView, type IaStatusView } from './status-model';

/** How the grant reached the student, as the "How given" cell draws it. */
export type IaGrantHowView =
  | { readonly kind: 'individual'; readonly words: string }
  | { readonly kind: 'group'; readonly words: string; readonly href: string };

export interface IaGrantRowView {
  readonly grantId: string;
  readonly studentId: string;
  readonly studentName: string;
  /** The student's record (IA-07). */
  readonly studentHref: string;
  /** The institution student ID under the name (allowed: it is the institution's own). */
  readonly institutionStudentId: string;
  readonly how: IaGrantHowView;
  /** When it was given: "9 Oct 2026". */
  readonly date: string;
  readonly status: IaStatusView;
  /** A withdrawn grant's row is muted. */
  readonly muted: boolean;
}

/** A row of `getAccessPlan`'s `givenTo` (IA-03). */
export function planGrantRowView(row: PlanGrantRow): IaGrantRowView {
  return {
    grantId: row.grantId,
    studentId: row.student.id,
    studentName: row.student.fullName,
    studentHref: studentRecordAddress(row.student.id),
    institutionStudentId: row.student.institutionStudentId,
    how:
      row.via.kind === 'group'
        ? {
            kind: 'group',
            words: viaGroupLabel(row.via.groupName),
            href: groupAddress(row.via.groupId),
          }
        : { kind: 'individual', words: IA_HOW_GIVEN.individually },
    date: dayMonthYear(row.givenAt),
    status: grantStatusView(row.display),
    muted: row.display === 'withdrawn',
  };
}

/**
 * A row of `listGrants` or of a student's record (IA-04, IA-07). A group grant names its group by
 * the name `groupNames` gives (`listGroups`, or the record's own `groups`, which the pages already
 * read); a group it cannot name reads "Group: " as the export's `saRow` does — never the group's
 * reference.
 */
export function grantRowView(
  row: GrantRow,
  groupNames: ReadonlyMap<string, string>,
): IaGrantRowView {
  const { grant } = row;
  const target = grant.target;
  return {
    grantId: grant.id,
    studentId: row.student.id,
    studentName: row.student.fullName,
    studentHref: studentRecordAddress(row.student.id),
    institutionStudentId: row.student.institutionStudentId,
    how:
      target.kind === 'group'
        ? {
            kind: 'group',
            words: viaGroupLabel(groupNames.get(target.groupId) ?? ''),
            href: groupAddress(target.groupId),
          }
        : { kind: 'individual', words: IA_HOW_GIVEN.individually },
    date: dayMonthYear(grant.givenAt),
    status: grantStatusView(row.display),
    muted: row.display === 'withdrawn',
  };
}

/** The formats a row inherits from the plan, as badges and their name ("Formats from your plan: WEB, VR"). */
export function grantFormats(formats: readonly Technology[]): {
  readonly codes: FormatCode[];
  readonly label: string;
} {
  const codes = formatCodes(formats);
  return { codes, label: formatsFromPlanLabel(codes) };
}

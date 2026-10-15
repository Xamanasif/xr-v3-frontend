'use client';

/**
 * The Institute Admin's Student access workflow (Phase-2 Package 2A): IA-04 Student access
 * (B2-04) and IA-05 Give students access (B2-05), through `StudentAccessService` with the facts it
 * names read from `InstitutionService`, `PeopleService` and `GroupService`. The port resolves who
 * is asking from the session: an Institute Admin reads and writes their own institution only, and
 * every status, standing, wait and refusal is the adapter's (`@xr/domain` through
 * `@xr/sample-platform`). The screens filter the rows on show, pass choices and render answers.
 *
 * The actions are commands — `useCommand(ports => ports.studentAccess.giveAccess)` with the plan's
 * revision as the page read it (`expectedPlanRev`), and `useCommand(ports =>
 * ports.studentAccess.withdrawGrant)` with the grant's (`expectedRev`) — whose receipts (`SACC`,
 * `PER`, `ACC`) refresh these reads.
 */
import {
  parseInput,
  previewGiveAccessInput,
  type ProductPorts,
  toErrorSummary,
} from '@xr/contracts/draft';
import type { AccessPlanId, CourseId, ExperimentId, GroupId, PersonId } from '@xr/domain';

import { defineQuery, useXrQuery } from './use-xr-query';

/**
 * IA-04: every grant row of the institution, withdrawn ones included — "Show withdrawn" is a view
 * filter (the contract's own words), and B2-04 keeps an individual grant withdrawn beside a group
 * grant on show without it (`visible`), which the page decides from the row's `display`.
 */
export const studentAccessRows = defineQuery({
  family: 'SACC',
  view: 'ia-student-access',
  deps: ['SACC', 'PER', 'GRP', 'ACC', 'INST', 'EXP', 'CRS'],
  read: (ports: ProductPorts) => ports.studentAccess.listGrants({ showWithdrawn: true }),
});

export function useStudentAccessRows() {
  return useXrQuery(studentAccessRows, null);
}

/** The institution's groups, by name (B2-04 "Group: ME ZG523 — Sem II", "Also in …"). */
export const instituteGroups = defineQuery({
  family: 'GRP',
  view: 'ia-student-access-groups',
  deps: ['GRP', 'PER'],
  read: (ports: ProductPorts) => ports.groups.listGroups(),
});

export function useInstituteGroups() {
  return useXrQuery(instituteGroups, null);
}

/**
 * The institution as the Institute Admin's own overview reads it: whether its access is paused
 * (B2-04 f12 read-only), the plan the status names and the request it came from (B2-05 f16, f17).
 */
export const instituteStanding = defineQuery({
  family: 'INST',
  view: 'ia-student-access-standing',
  deps: ['INST', 'ACC', 'REQ', 'SACC', 'PER', 'GRP', 'EXP', 'CRS', 'CCODE'],
  read: (ports: ProductPorts) => ports.institutions.getMyOverview(),
});

export function useInstituteStanding() {
  return useXrQuery(instituteStanding, null);
}

/**
 * IA-05 steps 1–2: the plan, the courses in access, a course's experiments (in the plan or not,
 * formats inherited), the students and the groups with what the service computes about each
 * (`selectable`, `why`). Refused while paused, after the plan has ended or before anything is held.
 */
export const giveAccessOptions = defineQuery({
  family: 'SACC',
  view: 'ia-give-access-options',
  deps: ['SACC', 'PER', 'GRP', 'ACC', 'INST', 'EXP', 'CRS'],
  read: (ports: ProductPorts, courseId: string | null) =>
    ports.studentAccess.getGiveAccessOptions(courseId ? { courseId: courseId as CourseId } : {}),
});

export function useGiveAccessOptions(courseId: string | null, enabled = true) {
  return useXrQuery(giveAccessOptions, courseId, { enabled, keepPrevious: true });
}

/** IA-05 step 2: each student's institution ID and groups (B2-05 "GIT-2026-0418 · ME ZG523 — Sem II"). */
export const giveAccessStudents = defineQuery({
  family: 'PER',
  view: 'ia-give-access-students',
  deps: ['PER', 'GRP', 'SACC', 'ACC', 'EXP'],
  read: (ports: ProductPorts) => ports.people.listStudents({}),
});

export function useGiveAccessStudents() {
  return useXrQuery(giveAccessStudents, null);
}

/** IA-05 step 1: the plan's status in words (B2-05 "ACC-0107 · Active · 120 licences · …"). */
export const giveAccessPlan = defineQuery({
  family: 'ACC',
  view: 'ia-give-access-plan',
  deps: ['ACC', 'INST', 'SACC', 'PER', 'EXP', 'CRS'],
  read: (ports: ProductPorts, planId: string) =>
    ports.institutions.getAccessPlan(planId as AccessPlanId),
});

export function useGiveAccessPlan(planId: string | null) {
  return useXrQuery(giveAccessPlan, planId ?? '', { enabled: planId !== null });
}

/** What IA-05 asks the service to preview (and then to give). */
export interface GiveChoice {
  readonly experimentIds: readonly string[];
  readonly target:
    | { readonly kind: 'students'; readonly studentIds: readonly string[] }
    | { readonly kind: 'group'; readonly groupId: string };
}

/** The contract input for a choice (the ids are the service's own, from its options). */
export function giveInput(choice: GiveChoice) {
  return {
    experimentIds: choice.experimentIds.map((id) => id as ExperimentId),
    target:
      choice.target.kind === 'group'
        ? { kind: 'group' as const, groupId: choice.target.groupId as GroupId }
        : {
            kind: 'students' as const,
            studentIds: choice.target.studentIds.map((id) => id as PersonId),
          },
  };
}

/**
 * IA-05 step 3 "What will be created" (B2-05 f2, f5): the planned grants, whom each reaches and
 * how each one stands — the service's preview, which writes nothing (Appendix C rule 3).
 */
export const giveAccessPreview = defineQuery({
  family: 'SACC',
  view: 'ia-give-access-preview',
  deps: ['SACC', 'PER', 'GRP', 'ACC', 'INST', 'EXP'],
  read: (
    ports: ProductPorts,
    params: {
      readonly experimentIds: readonly string[];
      readonly studentIds: readonly string[];
      readonly groupId: string | null;
    },
  ) =>
    ports.studentAccess.previewGiveAccess(
      giveInput({
        experimentIds: params.experimentIds,
        target:
          params.groupId !== null
            ? { kind: 'group', groupId: params.groupId }
            : { kind: 'students', studentIds: params.studentIds },
      }),
    ),
});

export function useGiveAccessPreview(choice: GiveChoice | null) {
  return useXrQuery(
    giveAccessPreview,
    {
      experimentIds: choice ? [...choice.experimentIds] : [],
      studentIds: choice?.target.kind === 'students' ? [...choice.target.studentIds] : [],
      groupId: choice?.target.kind === 'group' ? choice.target.groupId : null,
    },
    { enabled: choice !== null },
  );
}

/** A failed IA-05 step check: the drawn summary title ("Check this step") and its lines. */
export interface GiveCheck {
  readonly title: string;
  readonly lines: readonly string[];
}

function checked(parsed: ReturnType<typeof parseInput>): GiveCheck | null {
  if (parsed.ok) return null;
  const summary = toErrorSummary(parsed.error);
  return {
    title: summary.title ?? '',
    lines: summary.items.map((item) => item.summaryText ?? item.message ?? ''),
  };
}

/**
 * B2-05 step 1 "Continue" (`next1`): the experiments checked by the contract's own input schema —
 * the very rule the adapter applies again — with its drawn words ("Choose at least one
 * experiment"). Nothing is sent.
 */
export function checkGiveExperiments(experimentIds: readonly string[]): GiveCheck | null {
  return checked(
    parseInput(previewGiveAccessInput.pick({ experimentIds: true }), { experimentIds }, 'IA-05'),
  );
}

/**
 * B2-05 step 2 "Continue" (`next2`): the students or the group, by the same schema ("Choose at
 * least one student, or switch to a group", "Choose a group").
 */
export function checkGiveTarget(
  target:
    | { readonly kind: 'students'; readonly studentIds: readonly string[] }
    | { readonly kind: 'group'; readonly groupId: string | null },
): GiveCheck | null {
  return checked(parseInput(previewGiveAccessInput.pick({ target: true }), { target }, 'IA-05'));
}

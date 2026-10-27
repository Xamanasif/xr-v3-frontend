/**
 * M25 Platform role holder (ROLE) + scopes (Appendix C §2; matrix ROLE-*; B7-08, B6-01, B7-06).
 * Vendors, Academic Reviewers and Content Managers are registered by the Super Admin with no
 * scope; scope ("All experiments · A course · One experiment") decides what they can act on.
 * No invitation, no SSO set-up, no deregistration (ROLE-05, ROLE-06; T-11). The effect of a scope
 * withdrawal on work already in flight is not decided (ROLE-09): nothing in flight is changed —
 * the queues simply read the scopes as they are.
 */
import type { ActorRef, PersonActorRef, Role } from '../roles.js';
import { type Decision, invalidInput, invalidState, isBlank, ok } from '../kernel/decision.js';
import { type HistoryEntry, historyEntry } from '../kernel/history.js';
import type { IdSource } from '../kernel/id-source.js';
import type { CourseId, ExperimentId, PersonId, RoleHolderId, ScopeId } from '../kernel/ids.js';
import { newMeta, nextMeta, type RecordMeta } from '../kernel/record.js';
import type { IsoInstant } from '../kernel/time.js';
import { WORK_EMAIL } from '../institution/decide.js';

/** The roles a Super Admin registers in Platform roles — never Institute Admins or Faculty (ROLE-07). */
export const PLATFORM_HOLDER_ROLES = ['vendor', 'academic_reviewer', 'content_manager'] as const;
export type PlatformRole = (typeof PLATFORM_HOLDER_ROLES)[number] & Role;

export type ScopeTarget =
  | { readonly kind: 'all' }
  | { readonly kind: 'course'; readonly courseId: CourseId }
  | { readonly kind: 'experiment'; readonly experimentId: ExperimentId };

export interface RoleScope {
  readonly id: ScopeId;
  readonly target: ScopeTarget;
  /** 'Since <date>'. */
  readonly assignedAt: IsoInstant;
  readonly assignedBy: ActorRef;
  readonly withdrawal: {
    readonly at: IsoInstant;
    readonly by: ActorRef;
    readonly reason: string;
  } | null;
  /** Set when the same target is assigned or restored again: the withdrawn row leaves the withdrawn
   *  list (B7-08 script) while the record and its history stay (BR-126). */
  readonly supersededAt: IsoInstant | null;
}

export type RoleHolderEvent =
  'registered' | 'scope-assigned' | 'scope-withdrawn' | 'scope-restored';

export interface PlatformRoleHolder extends RecordMeta {
  readonly id: RoleHolderId;
  readonly role: PlatformRole;
  readonly name: string;
  /** Unique across holders. */
  readonly workEmail: string;
  readonly organisation: string;
  readonly registeredAt: IsoInstant;
  readonly registeredBy: ActorRef;
  readonly scopes: readonly RoleScope[];
  readonly personId: PersonId;
  readonly history: readonly HistoryEntry<RoleHolderEvent>[];
}

const SA_ONLY = ['super_admin'] as const;

function sameTarget(a: ScopeTarget, b: ScopeTarget): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'course' && b.kind === 'course') return a.courseId === b.courseId;
  if (a.kind === 'experiment' && b.kind === 'experiment') return a.experimentId === b.experimentId;
  return true;
}

/** Appendix C M25 "Status → labels": a scope is active ("Since <date>") or withdrawn ("Withdrawn
 *  <date> · “reason”"); a holder with no active scope reads "Nothing — no scope yet". A superseded
 *  row is a withdrawn row kept in the history. */
export const SCOPE_STATUSES = ['active', 'withdrawn'] as const;
export type ScopeStatus = (typeof SCOPE_STATUSES)[number];

export function scopeStatus(scope: RoleScope): ScopeStatus {
  return scope.withdrawal === null && scope.supersededAt === null ? 'active' : 'withdrawn';
}

export function activeScopes(holder: PlatformRoleHolder): readonly RoleScope[] {
  return holder.scopes.filter((scope) => scopeStatus(scope) === 'active');
}

/** Does an active scope cover this course or experiment? ("Can act on: ME ZG523 / All experiments"). */
export function scopeCovers(
  holder: PlatformRoleHolder,
  subject: { readonly courseId: CourseId | null; readonly experimentId?: ExperimentId | null },
): boolean {
  return activeScopes(holder).some(
    (scope) =>
      scope.target.kind === 'all' ||
      (scope.target.kind === 'course' && scope.target.courseId === subject.courseId) ||
      (scope.target.kind === 'experiment' &&
        subject.experimentId != null &&
        scope.target.experimentId === subject.experimentId),
  );
}

/**
 * The courses a Vendor may submit new experiments under (B5-03 "Only the courses assigned to … are
 * listed"; ROLE-11, owner decision PD-2 of 27 Oct 2026). For a Vendor only, an active "All
 * experiments" scope means any existing course, now and later; course scopes list their courses;
 * a one-experiment scope gives a Vendor nothing (PD-4). No active scope — none assigned, or every
 * one withdrawn — gives nothing, never everything (PD-3). The grant decides submission only: it
 * never reaches another Vendor's records (ownership is the creator, SUB-14). `scopeCovers` stays
 * the Academic Reviewer / Content Manager rule.
 */
export type VendorCourseGrant =
  | { readonly kind: 'any-course' }
  | { readonly kind: 'listed'; readonly courseIds: readonly CourseId[] };

export function vendorCourseGrant(holder: PlatformRoleHolder): VendorCourseGrant {
  const scopes = activeScopes(holder);
  if (scopes.some((scope) => scope.target.kind === 'all')) return { kind: 'any-course' };
  return {
    kind: 'listed',
    courseIds: scopes.flatMap((scope) =>
      scope.target.kind === 'course' ? [scope.target.courseId] : [],
    ),
  };
}

/** Does the grant give this course? */
export function grantCovers(grant: VendorCourseGrant, courseId: CourseId): boolean {
  return grant.kind === 'any-course' || grant.courseIds.includes(courseId);
}

/** Does the grant give no course at all ("No course is assigned to you yet")? */
export function grantIsEmpty(grant: VendorCourseGrant): boolean {
  return grant.kind === 'listed' && grant.courseIds.length === 0;
}

/** A one-experiment scope is never given to a Vendor (PD-4): one already held stays recorded and
 *  can be withdrawn, but grants nothing. */
function experimentScopeForVendor(holder: PlatformRoleHolder, target: ScopeTarget): boolean {
  return holder.role === 'vendor' && target.kind === 'experiment';
}

interface SaWrite {
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

/** Register a Vendor / Academic Reviewer / Content Manager (ROLE-01): name, work e-mail (unique),
 *  organisation; "They start with no scope — you assign it next. Nothing is sent from here." */
export function registerHolder(
  input: SaWrite & {
    readonly holders: readonly PlatformRoleHolder[];
    readonly role: PlatformRole;
    readonly name: string;
    readonly workEmail: string;
    readonly organisation: string;
    readonly personId: PersonId;
  },
): Decision<PlatformRoleHolder> {
  if (!(PLATFORM_HOLDER_ROLES as readonly string[]).includes(input.role)) {
    return invalidInput({ field: 'role', rule: 'platform-role-only' });
  }
  const issues = [
    ...(isBlank(input.name) ? [{ field: 'name', rule: 'required' }] : []),
    ...(isBlank(input.workEmail)
      ? [{ field: 'workEmail', rule: 'required' }]
      : !WORK_EMAIL.test(input.workEmail.trim())
        ? [{ field: 'workEmail', rule: 'email-format' }]
        : input.holders.some(
              (holder) => holder.workEmail.toLowerCase() === input.workEmail.trim().toLowerCase(),
            )
          ? [{ field: 'workEmail', rule: 'taken' }]
          : []),
    ...(isBlank(input.organisation) ? [{ field: 'organisation', rule: 'required' }] : []),
  ];
  if (issues.length > 0) return invalidInput(...issues);
  return ok({
    ...newMeta(input.now),
    id: input.ids.next('roleHolder'),
    role: input.role,
    name: input.name.trim(),
    workEmail: input.workEmail.trim(),
    organisation: input.organisation.trim(),
    registeredAt: input.now,
    registeredBy: input.actor,
    scopes: [],
    personId: input.personId,
    history: [
      historyEntry({
        id: input.ids.next('history'),
        event: 'registered',
        at: input.now,
        actor: input.actor,
        note: input.role,
        visibleTo: SA_ONLY,
      }),
    ],
  });
}

function withScopeEvent(
  holder: PlatformRoleHolder,
  scopes: readonly RoleScope[],
  event: RoleHolderEvent,
  input: SaWrite,
  note: string | null = null,
): PlatformRoleHolder {
  return {
    ...holder,
    ...nextMeta(holder, input.now),
    scopes,
    history: [
      ...holder.history,
      historyEntry({
        id: input.ids.next('history'),
        event,
        at: input.now,
        actor: input.actor,
        note,
        visibleTo: SA_ONLY,
      }),
    ],
  };
}

/** Assign scope (ROLE-02): several people per experiment allowed; "<X> is already in scope".
 *  A withdrawn scope with the same target leaves the withdrawn list (superseded, kept). */
export function assignScope(
  input: SaWrite & { readonly holder: PlatformRoleHolder; readonly target: ScopeTarget },
): Decision<PlatformRoleHolder> {
  if (experimentScopeForVendor(input.holder, input.target)) {
    return invalidInput({ field: 'target', rule: 'not-for-vendor' });
  }
  if (activeScopes(input.holder).some((scope) => sameTarget(scope.target, input.target))) {
    return invalidInput({ field: 'target', rule: 'already-in-scope' });
  }
  const scopes = input.holder.scopes.map((scope) =>
    scope.withdrawal && scope.supersededAt === null && sameTarget(scope.target, input.target)
      ? { ...scope, supersededAt: input.now }
      : scope,
  );
  return ok(
    withScopeEvent(
      input.holder,
      [
        ...scopes,
        {
          id: input.ids.next('scope'),
          target: input.target,
          assignedAt: input.now,
          assignedBy: input.actor,
          withdrawal: null,
          supersededAt: null,
        },
      ],
      'scope-assigned',
      input,
    ),
  );
}

/** Withdraw a scope (ROLE-03; DL-2): "Add a reason — it is kept in the history"; "They stop seeing
 *  it straight away." */
export function withdrawScope(
  input: SaWrite & {
    readonly holder: PlatformRoleHolder;
    readonly scopeId: ScopeId;
    readonly reason: string;
  },
): Decision<PlatformRoleHolder> {
  const scope = input.holder.scopes.find((candidate) => candidate.id === input.scopeId);
  if (!scope || scope.withdrawal !== null || scope.supersededAt !== null)
    return invalidState('not-active');
  if (isBlank(input.reason)) return invalidInput({ field: 'reason', rule: 'required' });
  const reason = input.reason.trim();
  return ok(
    withScopeEvent(
      input.holder,
      input.holder.scopes.map((candidate) =>
        candidate === scope
          ? { ...candidate, withdrawal: { at: input.now, by: input.actor, reason } }
          : candidate,
      ),
      'scope-withdrawn',
      input,
      reason,
    ),
  );
}

/** Restore a withdrawn scope (ROLE-04, ROLE-14): one-click confirmation, no reason; "They can act on
 *  it again straight away." The withdrawn row is superseded (kept) and an active scope returns. */
export function restoreScope(
  input: SaWrite & { readonly holder: PlatformRoleHolder; readonly scopeId: ScopeId },
): Decision<PlatformRoleHolder> {
  const scope = input.holder.scopes.find((candidate) => candidate.id === input.scopeId);
  if (!scope || scope.withdrawal === null || scope.supersededAt !== null)
    return invalidState('not-withdrawn');
  if (experimentScopeForVendor(input.holder, scope.target)) return invalidState('not-for-vendor');
  if (activeScopes(input.holder).some((active) => sameTarget(active.target, scope.target))) {
    return invalidState('already-in-scope');
  }
  return ok(
    withScopeEvent(
      input.holder,
      [
        ...input.holder.scopes.map((candidate) =>
          candidate === scope ? { ...candidate, supersededAt: input.now } : candidate,
        ),
        {
          id: input.ids.next('scope'),
          target: scope.target,
          assignedAt: input.now,
          assignedBy: input.actor,
          withdrawal: null,
          supersededAt: null,
        },
      ],
      'scope-restored',
      input,
    ),
  );
}

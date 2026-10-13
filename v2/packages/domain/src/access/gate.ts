/**
 * The Student open gate and the Institute Admin's grant words (Appendix D §5.3 `experimentGate`,
 * `formatAvailability`, `canOpenFormat`; Appendix C M15). The gate reads publication, institution
 * access and entitlement only — never runtime activity, completion, feedback or an assessment
 * (BC3; invariant 5). Precedence of the refusals is PROVISIONAL (AD-27).
 *
 * Undecided cases return `policy-open` and make no can / can't statement:
 *  - a withdrawn individual grant beside an active group grant (OD-B2-01; SACC-15) — through the
 *    injected `OverlapGrantPolicy`, which has no default; the interim answers `policy-open` (DV-1);
 *  - a member added to a group after its grant (OD-B2-02; SACC-16);
 *  - a member removed from a group after its grant (GRP-05; P2-04);
 *  - a format "Not available right now" — drawn with no cause; only the seed may supply it (D-26).
 */
import type { Technology } from '../technology.js';
import type { OpenRefusal } from '../kernel/decision.js';
import type { IsoInstant } from '../kernel/time.js';
import { publishedFormats, type Experiment } from '../catalogue/model.js';
import { planTermState } from '../institution/term.js';
import type { AccessPlan, Institution } from '../institution/model.js';
import type {
  Group,
  GroupMemberStanding,
  GroupMembership,
  StudentPerson,
} from '../people/model.js';
import type {
  GrantDisplayStatus,
  OpenGate,
  OverlapGrantPolicy,
  ProvidedLicenceWait,
  StudentAccessGrant,
} from './model.js';

/**
 * The records an open gate reads besides the experiment and `now`: the Student, the institution
 * with its plans, grants and groups, the supplied licence waits, and the injected overlap policy.
 * A policy check computes the gate from these itself, so no caller can hand it a wrong gate.
 */
export interface AccessFacts {
  readonly student: StudentPerson;
  readonly institution: Institution;
  readonly plans: readonly AccessPlan[];
  /** The institution's grants. */
  readonly grants: readonly StudentAccessGrant[];
  /** The institution's groups. */
  readonly groups: readonly Group[];
  readonly waits: readonly ProvidedLicenceWait[];
  /** Required — the overlap rule has no default (Appendix C §3.18). */
  readonly overlap: OverlapGrantPolicy;
  /** Seed-only "Not available right now" formats for this experiment (D-26). */
  readonly unavailableRightNow?: readonly Technology[];
}

export interface GateInput extends AccessFacts {
  /** The published experiment; null when unknown or unpublished (same "not given" answer, so
   *  existence is not revealed — Appendix A ST-19 [PROPOSED]). */
  readonly experiment: Experiment | null;
  readonly now: IsoInstant;
}

const refusal = (reason: OpenRefusal): OpenGate => ({ canOpen: false, reason });
const open = (decision: string): OpenGate => ({ canOpen: false, reason: 'policy-open', decision });

function membershipAtGrant(
  memberships: readonly GroupMembership[],
  grant: StudentAccessGrant,
): 'member' | 'added-after' | 'removed-after' | 'not-a-member' {
  const current = memberships.find((membership) => membership.removedAt === null);
  if (current) return current.addedAt <= grant.givenAt ? 'member' : 'added-after';
  const removedLater = memberships.some(
    (membership) =>
      membership.addedAt <= grant.givenAt &&
      membership.removedAt !== null &&
      membership.removedAt > grant.givenAt,
  );
  return removedLater ? 'removed-after' : 'not-a-member';
}

interface Routes {
  readonly active: readonly StudentAccessGrant[];
  readonly withdrawnIndividual: readonly StudentAccessGrant[];
  readonly undecided: string | null;
}

function routes(input: GateInput, experiment: Experiment): Routes {
  const active: StudentAccessGrant[] = [];
  const withdrawnIndividual: StudentAccessGrant[] = [];
  let undecided: string | null = null;
  for (const grant of input.grants) {
    if (grant.experimentId !== experiment.id || grant.institutionId !== input.institution.id)
      continue;
    if (grant.target.kind === 'student') {
      if (grant.target.studentId !== input.student.id) continue;
      (grant.state === 'active' ? active : withdrawnIndividual).push(grant);
      continue;
    }
    const groupId = grant.target.groupId;
    const group = input.groups.find((candidate) => candidate.id === groupId);
    const memberships =
      group?.memberships.filter((membership) => membership.studentId === input.student.id) ?? [];
    const standing = membershipAtGrant(memberships, grant);
    if (standing === 'not-a-member' || grant.state !== 'active') continue;
    if (standing === 'member') active.push(grant);
    else undecided ??= standing === 'added-after' ? 'OD-B2-02' : 'GRP-05';
  }
  return { active, withdrawnIndividual, undecided };
}

/**
 * Can the Student open this experiment at all (ST-03, ST-05 … ST-10, ST-16, ST-19 family)?
 * No grant → not given; only withdrawn grants → no longer given; the plan ended → access ended;
 * the institution paused → paused; the account inactive → inactive; a supplied licence wait →
 * waiting for a licence; otherwise open through the active grants.
 */
export function experimentGate(input: GateInput): OpenGate {
  const experiment = input.experiment;
  if (!experiment) return refusal('not-given');
  const route = routes(input, experiment);
  let active = route.active;
  const hasIndividualActive = active.some((grant) => grant.target.kind === 'student');
  if (!hasIndividualActive && route.withdrawnIndividual.length > 0 && active.length > 0) {
    const answer = input.overlap.resolve({
      grants: [...route.withdrawnIndividual, ...active],
      studentId: input.student.id,
    });
    if (answer === 'undecided') return open('OD-B2-01');
    if (answer === 'closed') return refusal('no-longer-given');
  }
  if (active.length === 0) {
    if (route.undecided) return open(route.undecided);
    return refusal(route.withdrawnIndividual.length > 0 ? 'no-longer-given' : 'not-given');
  }
  const livePlans = active.filter((grant) => {
    const plan = input.plans.find((candidate) => candidate.id === grant.accessPlanId);
    return plan !== undefined && planTermState(plan, input.now) !== 'ended';
  });
  if (livePlans.length === 0) return refusal('access-ended');
  active = livePlans;
  if (input.institution.pause) return refusal('institution-paused');
  if (input.student.accountStatus === 'inactive') return refusal('student-inactive');
  const waiting = active.every((grant) =>
    input.waits.some((wait) => wait.grantId === grant.id && wait.studentId === input.student.id),
  );
  if (waiting) return refusal('waiting-for-a-licence');
  return { canOpen: true, viaGrantIds: active.map((grant) => grant.id) };
}

/**
 * Can the Student open this format now (`canOpenFormat`)? The experiment gate, then the format:
 * published ("Not available for this experiment") and in the plan ("Not included for your
 * institution"), B2-12, B3-02 (BR-027). Runtime activity and completion are never read.
 */
export function canOpenFormat(input: GateInput & { readonly format: Technology }): OpenGate {
  const gate = experimentGate(input);
  if (!gate.canOpen) return gate;
  const experiment = input.experiment!;
  if (!publishedFormats(experiment).includes(input.format)) return refusal('format-not-published');
  const inPlan = gate.viaGrantIds.some((grantId) => {
    const grant = input.grants.find((candidate) => candidate.id === grantId);
    const plan = input.plans.find((candidate) => candidate.id === grant?.accessPlanId);
    return plan?.items.some(
      (item) => item.experimentId === experiment.id && item.formats.includes(input.format),
    );
  });
  if (!inPlan) return refusal('format-not-in-plan');
  if (input.unavailableRightNow?.includes(input.format)) {
    return open('not-designed:format-temporarily-unavailable');
  }
  return gate;
}

/** The Student's per-format word source (`formatAvailability`): the same answer as the gate. */
export function formatAvailability(input: GateInput & { readonly format: Technology }): OpenGate {
  return canOpenFormat(input);
}

export interface GrantDisplayInput {
  readonly grant: StudentAccessGrant;
  /** The row's student (for a group grant, the member). */
  readonly student: StudentPerson;
  readonly plan: AccessPlan;
  readonly institution: Institution;
  readonly waits: readonly ProvidedLicenceWait[];
  /** An active group grant also gives this student the experiment (B2-04 "Also in …"). */
  readonly alsoInActiveGroupGrant: boolean;
  /** IA-03 plan page draws "Paused" (B2-03); IA-04 keeps the grant's own word (B2-04 f12). */
  readonly screen: 'student-access' | 'plan-page';
  readonly now: IsoInstant;
}

/** The Institute Admin's grant word (B2-03, B2-04 `LBL`, B2-06; §7 D-24). */
export function grantDisplayStatus(input: GrantDisplayInput): GrantDisplayStatus {
  if (input.grant.state === 'withdrawn') {
    return input.alsoInActiveGroupGrant ? 'individual-grant-withdrawn' : 'withdrawn';
  }
  if (input.screen === 'plan-page' && input.institution.pause) return 'paused';
  if (planTermState(input.plan, input.now) === 'ended') return 'access-ended';
  if (input.student.accountStatus === 'inactive') return 'student-inactive';
  if (
    input.waits.some(
      (wait) => wait.grantId === input.grant.id && wait.studentId === input.student.id,
    )
  ) {
    return 'waiting-for-a-licence';
  }
  return 'active';
}

/**
 * IA-14 member words (B2-08 `stText`) for one member and one group grant. A member whose own
 * individual grant was withdrawn while the group grant is active is the undecided overlap
 * (OD-B2-01; SACC-15: "show each grant's own state only … must not compute can-open"): no word is
 * computed for that case.
 */
export function groupMemberStanding(input: {
  readonly membership: GroupMembership;
  readonly student: StudentPerson;
  readonly groupGrant: StudentAccessGrant;
  /** The student's own individual grant for the same experiment, in any state, if any. */
  readonly individualGrant: StudentAccessGrant | null;
  readonly waits: readonly ProvidedLicenceWait[];
}): GroupMemberStanding | { readonly kind: 'policy-open'; readonly decision: 'OD-B2-01' } {
  if (input.student.accountStatus === 'inactive') return 'inactive';
  if (input.individualGrant?.state === 'active') return 'has-it-individually';
  if (input.membership.addedAt > input.groupGrant.givenAt) return 'added-after-the-group-grant';
  if (input.individualGrant?.state === 'withdrawn' && input.groupGrant.state === 'active') {
    return { kind: 'policy-open', decision: 'OD-B2-01' };
  }
  if (
    input.waits.some(
      (wait) => wait.grantId === input.groupGrant.id && wait.studentId === input.student.id,
    )
  ) {
    return 'waiting-for-a-licence';
  }
  return 'can-open-it';
}

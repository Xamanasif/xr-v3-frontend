/**
 * The policy rule table (Appendix F §5.1, §5.3): one rule per offered action, each carrying the
 * candidate-matrix ALLOW row ids it implements. Deny by default — an action with no rule is never
 * offered. The matrix is evidence-derived candidate policy, not owner approval: CONFIRMED and
 * PROVISIONAL ALLOW rows are built as v46 draws them (PROVISIONAL rows are drawn controls or
 * designed safe treatments governed by an open item, and say so in `status`); OPEN rows are never
 * offered (`OPEN_CAPABILITIES`); DENY rows have no rule; SYSTEM transitions are reachable only
 * through system writers; READ rows are visibility (`canRead`).
 *
 * Each rule checks who acts and their scope, then dry-runs the command's own decision against the
 * records, so a rule offers exactly what the decision would accept. Missing form input
 * (`validation-failed`) does not withdraw the offer; every other refusal does.
 */
import type { PersonActorRef, Role } from '../roles.js';
import type { Decision, Refusal } from '../kernel/decision.js';
import type { IdSource, MintedIds } from '../kernel/id-source.js';
import type { CourseId, ExperimentId, InstitutionId } from '../kernel/ids.js';
import type { IsoInstant } from '../kernel/time.js';
import { NO_LICENCE_WAITS, type OpenGate } from '../access/model.js';
import { giveAccess, withdrawGrant } from '../access/decide.js';
import { type AccessFacts, canOpenFormat, experimentGate } from '../access/gate.js';
import { changeAssessment, createAssessment } from '../assessment/assessment.js';
import {
  confirmMarks,
  saveAnswer,
  saveMark,
  startAttempt,
  submitAttempt,
} from '../assessment/attempt.js';
import { type ChoiceKey, NO_RULES, type Question } from '../assessment/model.js';
import {
  addDraftToBank,
  addQuestion,
  commitQuestionImport,
  deleteQuestion,
  editQuestion,
} from '../assessment/question-bank.js';
import {
  addArea,
  addCourse,
  moveCourse,
  renameStructure,
  savePlatformCourseCodes,
  setInstitutionCourseCode,
} from '../catalogue/decide.js';
import {
  approveUpdate,
  holdUpdate,
  liftHold,
  openCorrection,
  releaseUpdate,
  returnUpdate,
  saveCorrection,
  sendForAcademicReview,
  withdrawUpdate,
} from '../correction/correction.js';
import {
  approveDeviceTransfer,
  forwardDeviceTransfer,
  requestDeviceTransfer,
} from '../device/device.js';
import { sendFeedback } from '../feedback/feedback.js';
import {
  assignInstituteAdmin,
  pauseInstitution,
  restoreInstitution,
} from '../institution/decide.js';
import {
  addFaculty,
  addMembers,
  addStudent,
  commitStudentImport,
  createGroup,
  currentMembers,
  deactivateStudent,
  overrideStudentStatus,
  reactivateStudent,
  removeFacultyCourse,
  removeMember,
  renameGroup,
} from '../people/decide.js';
import {
  activeScopes,
  grantIsEmpty,
  registerHolder,
  type PlatformRoleHolder,
  restoreScope,
  scopeCovers,
  type VendorCourseGrant,
  vendorCourseGrant,
  withdrawScope,
} from '../platform-roles/platform-roles.js';
import {
  approveRequest,
  approveSmallerScope,
  requestMoreInformation,
  startPayment,
  submitAdditionalLicencesRequest,
  submitPublicRequest,
  submitRenewalRequest,
} from '../request/decide.js';
import { launchWebFormat } from '../runtime/activity.js';
import { openResource } from '../resources/resources.js';
import { signInOutcome } from '../session/session.js';
import {
  approveSubmission,
  overrideStatus,
  publish,
  resubmit,
  returnSubmission,
  saveDraft,
  saveRevision,
  sendBackToReviewer,
  sendBackToVendor,
  submitForReview,
} from '../submission/decide.js';
import { reopenReport, resolveReport } from '../support/support.js';
import type { PersonActor, PublicActor } from './context.js';
import type { SubjectKind, SubjectOf } from './subjects.js';

/** Ids a dry run mints: never stored, never shown. */
export const DRY_RUN_IDS: IdSource = {
  next<K extends keyof MintedIds>(kind: K): MintedIds[K] {
    return `dry-run:${kind}` as MintedIds[K];
  },
};

const REASON = 'Dry run';

export interface PolicyRule<K extends SubjectKind = SubjectKind> {
  readonly action: string;
  /** The candidate-matrix ALLOW rows this rule implements. */
  readonly rows: readonly string[];
  /** The weakest status among its rows: a rule is no firmer than its least-settled row. */
  readonly status: 'CONFIRMED' | 'PROVISIONAL';
  readonly actors: readonly (Role | 'public')[];
  readonly subject: K;
  /** Scope and state; null = allowed. */
  readonly check: (
    actor: PersonActor | PublicActor,
    subject: SubjectOf<K>,
    now: IsoInstant,
  ) => Refusal | null;
}

/** A dry-run outcome: allowed unless refused for anything but missing input. */
function dry(
  decision: Decision<unknown> | { readonly ok: false; readonly refusal: Refusal },
): Refusal | null {
  if (decision.ok) return null;
  return decision.refusal.kind === 'validation-failed' ? null : decision.refusal;
}

const outOfScope: Refusal = { kind: 'not-permitted', why: 'out-of-scope' };
const notOwn: Refusal = { kind: 'not-permitted', why: 'not-own-record' };

function person(actor: PersonActor | PublicActor): PersonActor {
  if (actor.kind !== 'person') throw new Error('A person rule was asked for a public actor.');
  return actor;
}

function ownInstitution(actor: PersonActor | PublicActor, institutionId: string): Refusal | null {
  return person(actor).institutionId === institutionId ? null : outOfScope;
}

function covers(
  actor: PersonActor | PublicActor,
  courseId: CourseId | null,
  experimentId: ExperimentId | null = null,
): Refusal | null {
  const holder = person(actor).holder;
  return holder && scopeCovers(holder, { courseId, experimentId }) ? null : outOfScope;
}

function rule<K extends SubjectKind, A extends string>(
  definition: PolicyRule<K> & { readonly action: A },
): PolicyRule<K> & { readonly action: A } {
  return definition;
}

/** The offered actions. Grouped by record family; each names its ALLOW rows. */
export const POLICY_RULES = [
  // ── Public surface: selection and requests (M03, M04) ──────────────────────────────────────
  rule({
    action: 'selection.edit',
    rows: ['SEL-01'],
    status: 'CONFIRMED',
    actors: ['public'],
    subject: 'selection',
    check: () => null,
  }),
  rule({
    action: 'request.submit-public',
    rows: ['REQ-01'],
    status: 'CONFIRMED',
    actors: ['public'],
    subject: 'selection',
    check: (_actor, subject, now) =>
      dry(
        submitPublicRequest({
          selection: subject.selection,
          form: {
            institutionName: '',
            contactPerson: '',
            contactEmail: '',
            contactPhone: null,
            licences: null,
            term: null,
            message: null,
          },
          publishedFormatsOf: () => ['web', 'ar', 'vr', 'mr'],
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'request.start-payment',
    rows: ['REQ-07'],
    status: 'PROVISIONAL',
    actors: ['public', 'tenant_admin'],
    subject: 'request',
    check: (actor, subject, now) => {
      if (actor.kind === 'public') {
        if (!actor.requestTokens.includes(subject.request.statusToken)) return notOwn;
      } else if (
        subject.request.institutionId !== actor.institutionId ||
        actor.institutionId === null
      ) {
        return outOfScope;
      }
      const payer =
        actor.kind === 'public'
          ? { kind: 'requester' as const, name: subject.request.contact.person }
          : actor.ref;
      return dry(startPayment({ request: subject.request, payer, now, ids: DRY_RUN_IDS }));
    },
  }),
  // ── Super Admin decisions on requests (M03; INST-01, ACC-01) ────────────────────────────────
  rule({
    action: 'request.set-route',
    rows: ['REQ-12'],
    status: 'PROVISIONAL',
    actors: ['super_admin'],
    subject: 'request',
    check: (actor, subject, now) => {
      if (subject.institution !== null) return { kind: 'refused', code: 'route-locked' };
      return dry(
        approveRequest({
          request: subject.request,
          institution: null,
          route: 'external',
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      );
    },
  }),
  rule({
    action: 'request.approve',
    rows: ['REQ-13', 'REQ-14', 'INST-01', 'ACC-01'],
    status: 'CONFIRMED',
    actors: ['super_admin'],
    subject: 'request',
    check: (actor, subject, now) =>
      dry(
        approveRequest({
          request: subject.request,
          institution: subject.institution,
          route: subject.institution?.kind ?? 'external',
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'request.approve-smaller-scope',
    rows: ['REQ-15'],
    status: 'CONFIRMED',
    actors: ['super_admin'],
    subject: 'request',
    check: (actor, subject, now) =>
      dry(
        approveSmallerScope({
          request: subject.request,
          institution: subject.institution,
          route: subject.institution?.kind ?? 'external',
          items: subject.request.items,
          licences: subject.request.licencesRequested,
          term: { kind: 'monthly' },
          reason: REASON,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'request.request-information',
    rows: ['REQ-17'],
    status: 'CONFIRMED',
    actors: ['super_admin'],
    subject: 'request',
    check: (actor, subject, now) =>
      dry(
        requestMoreInformation({
          request: subject.request,
          institution: subject.institution,
          reason: REASON,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  // ── Institute Admin: requests to BITS and student access (M03, M15) ─────────────────────────
  rule({
    action: 'request.submit-renewal',
    rows: ['REQ-25'],
    status: 'CONFIRMED',
    actors: ['tenant_admin'],
    subject: 'plan',
    check: (actor, subject, now) =>
      ownInstitution(actor, subject.plan.institutionId) ??
      dry(
        submitRenewalRequest({
          institution: subject.institution,
          plan: subject.plan,
          message: null,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'request.submit-additional-licences',
    rows: ['REQ-26'],
    status: 'CONFIRMED',
    actors: ['tenant_admin'],
    subject: 'plan',
    check: (actor, subject, now) =>
      ownInstitution(actor, subject.plan.institutionId) ??
      dry(
        submitAdditionalLicencesRequest({
          institution: subject.institution,
          plan: subject.plan,
          experimentIds: subject.plan.items.map((item) => item.experimentId),
          licences: 1,
          message: null,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'access.give-to-students',
    rows: ['SACC-01'],
    status: 'CONFIRMED',
    actors: ['tenant_admin'],
    subject: 'plan',
    check: (actor, subject, now) =>
      ownInstitution(actor, subject.plan.institutionId) ??
      dry(
        giveAccess({
          institution: subject.institution,
          plan: subject.plan,
          experimentIds: [],
          target: { kind: 'students', students: [] },
          grants: [],
          licences: NO_LICENCE_WAITS,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'access.give-to-group',
    rows: ['SACC-02'],
    status: 'CONFIRMED',
    actors: ['tenant_admin'],
    subject: 'plan',
    check: (actor, subject, now) =>
      ownInstitution(actor, subject.plan.institutionId) ??
      dry(
        giveAccess({
          institution: subject.institution,
          plan: subject.plan,
          experimentIds: [],
          target: { kind: 'students', students: [] },
          grants: [],
          licences: NO_LICENCE_WAITS,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'access.withdraw-individual',
    rows: ['SACC-07'],
    status: 'CONFIRMED',
    actors: ['tenant_admin'],
    subject: 'grant',
    check: (actor, subject, now) =>
      ownInstitution(actor, subject.grant.institutionId) ??
      dry(
        withdrawGrant({
          grant: subject.grant,
          institution: subject.institution,
          plan: subject.plan,
          student: subject.student,
          reason: REASON,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  // ── Super Admin: institutions (M01, M02) ────────────────────────────────────────────────────
  rule({
    action: 'institution.assign-institute-admin',
    rows: ['INST-04'],
    status: 'CONFIRMED',
    actors: ['super_admin'],
    subject: 'institution',
    check: (actor, subject, now) =>
      dry(
        assignInstituteAdmin({
          institution: subject.institution,
          plans: subject.plans,
          name: REASON,
          workEmail: 'dry.run@example.edu',
          personId: person(actor).ref.personId,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'institution.pause',
    rows: ['INST-07'],
    status: 'CONFIRMED',
    actors: ['super_admin'],
    subject: 'institution',
    check: (actor, subject, now) =>
      dry(
        pauseInstitution({
          institution: subject.institution,
          plans: subject.plans,
          reason: REASON,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'institution.restore',
    rows: ['INST-08'],
    status: 'CONFIRMED',
    actors: ['super_admin'],
    subject: 'institution',
    check: (actor, subject, now) =>
      dry(
        restoreInstitution({
          institution: subject.institution,
          plans: subject.plans,
          reason: REASON,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  // ── Institute Admin: people, groups, Faculty courses, course codes (M08, M12–M14) ──────────
  rule({
    action: 'person.add-student',
    rows: ['PER-01'],
    status: 'CONFIRMED',
    actors: ['tenant_admin'],
    subject: 'institution',
    check: (actor, subject, now) =>
      ownInstitution(actor, subject.institution.id) ??
      dry(
        addStudent({
          institution: subject.institution,
          people: subject.people,
          form: { fullName: '', email: '', studentId: '', programme: null },
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'person.import-students',
    rows: ['PER-02'],
    status: 'PROVISIONAL',
    actors: ['tenant_admin'],
    subject: 'institution',
    check: (actor, subject, now) =>
      ownInstitution(actor, subject.institution.id) ??
      dry(
        commitStudentImport({
          institution: subject.institution,
          people: subject.people,
          rows: [],
          resolveCourse: () => null,
          fileName: '',
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'person.add-faculty',
    rows: ['PER-03'],
    status: 'CONFIRMED',
    actors: ['tenant_admin'],
    subject: 'institution',
    check: (actor, subject, now) =>
      ownInstitution(actor, subject.institution.id) ??
      dry(
        addFaculty({
          institution: subject.institution,
          people: subject.people,
          fullName: '',
          email: '',
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'person.deactivate-student',
    rows: ['PER-05'],
    status: 'CONFIRMED',
    actors: ['tenant_admin'],
    subject: 'person',
    check: (actor, subject, now) =>
      ownInstitution(actor, subject.person.institutionId) ??
      (subject.person.kind !== 'student'
        ? { kind: 'policy-open', decision: 'PER-07' }
        : dry(
            deactivateStudent({
              institution: subject.institution,
              student: subject.person,
              reason: REASON,
              actor: person(actor).ref,
              now,
              ids: DRY_RUN_IDS,
            }),
          )),
  }),
  rule({
    action: 'person.reactivate-student',
    rows: ['PER-06'],
    status: 'CONFIRMED',
    actors: ['tenant_admin'],
    subject: 'person',
    check: (actor, subject, now) =>
      ownInstitution(actor, subject.person.institutionId) ??
      (subject.person.kind !== 'student'
        ? { kind: 'policy-open', decision: 'PER-07' }
        : dry(
            reactivateStudent({
              institution: subject.institution,
              student: subject.person,
              actor: person(actor).ref,
              now,
              ids: DRY_RUN_IDS,
            }),
          )),
  }),
  rule({
    action: 'person.override-student-status',
    rows: ['PER-11'],
    status: 'CONFIRMED',
    actors: ['super_admin'],
    subject: 'person',
    check: (actor, subject, now) =>
      subject.person.kind !== 'student'
        ? { kind: 'not-permitted', why: 'out-of-scope' }
        : dry(
            overrideStudentStatus({
              student: subject.person,
              to: subject.person.accountStatus === 'active' ? 'inactive' : 'active',
              reason: REASON,
              actor: person(actor).ref,
              now,
              ids: DRY_RUN_IDS,
            }),
          ),
  }),
  rule({
    action: 'group.create',
    rows: ['GRP-01'],
    status: 'CONFIRMED',
    actors: ['tenant_admin'],
    subject: 'institution',
    check: (actor, subject, now) =>
      ownInstitution(actor, subject.institution.id) ??
      dry(
        createGroup({
          institution: subject.institution,
          groups: subject.groups,
          name: '',
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'group.rename',
    rows: ['GRP-02'],
    status: 'PROVISIONAL',
    actors: ['tenant_admin'],
    subject: 'group',
    check: (actor, subject, now) =>
      ownInstitution(actor, subject.group.institutionId) ??
      dry(
        renameGroup({
          institution: subject.institution,
          group: subject.group,
          name: '',
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'group.add-members',
    rows: ['GRP-03'],
    status: 'PROVISIONAL',
    actors: ['tenant_admin'],
    subject: 'group',
    check: (actor, subject, now) =>
      ownInstitution(actor, subject.group.institutionId) ??
      dry(
        addMembers({
          institution: subject.institution,
          group: subject.group,
          students: [],
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'group.remove-member',
    rows: ['GRP-04'],
    status: 'PROVISIONAL',
    actors: ['tenant_admin'],
    subject: 'group',
    check: (actor, subject, now) => {
      const member = currentMembers(subject.group)[0];
      if (!member) return { kind: 'invalid-state', current: 'no-members' };
      return (
        ownInstitution(actor, subject.group.institutionId) ??
        dry(
          removeMember({
            institution: subject.institution,
            group: subject.group,
            studentId: member,
            actor: person(actor).ref,
            now,
            ids: DRY_RUN_IDS,
          }),
        )
      );
    },
  }),
  rule({
    action: 'faculty-course.assign',
    rows: ['FCM-01'],
    status: 'CONFIRMED',
    actors: ['tenant_admin'],
    subject: 'institution',
    check: (actor, subject) =>
      ownInstitution(actor, subject.institution.id) ??
      (subject.institution.pause ? { kind: 'refused', code: 'institution-paused' } : null),
  }),
  rule({
    action: 'faculty-course.remove',
    rows: ['FCM-02'],
    status: 'CONFIRMED',
    actors: ['tenant_admin'],
    subject: 'faculty-course',
    check: (actor, subject, now) =>
      ownInstitution(actor, subject.mapping.institutionId) ??
      dry(
        removeFacultyCourse({
          institution: subject.institution,
          mapping: subject.mapping,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'institution-course-code.set',
    rows: ['CC-01'],
    status: 'CONFIRMED',
    actors: ['tenant_admin'],
    subject: 'course-code',
    check: (actor, subject, now) =>
      ownInstitution(actor, subject.institution.id) ??
      dry(
        setInstitutionCourseCode({
          existing: subject.existing,
          institution: subject.institution,
          courseId: subject.courseId,
          coursesInAccess: subject.coursesInAccess,
          code: null,
          semester: null,
          actor: person(actor).ref,
          now,
        }),
      ),
  }),
  // ── Academic structure and platform course codes (M06, M07) ─────────────────────────────────
  rule({
    action: 'platform-course-code.save',
    rows: ['CC-04', 'CC-05'],
    status: 'PROVISIONAL',
    actors: ['content_manager'],
    subject: 'structure',
    check: (actor, subject, now) => {
      const holder = person(actor).holder;
      if (!holder || activeScopes(holder).length === 0) return outOfScope;
      // A Content Manager limited to a course or an experiment is not drawn (CC-06 OPEN).
      if (!activeScopes(holder).some((scope) => scope.target.kind === 'all'))
        return { kind: 'policy-open', decision: 'CC-06' };
      return dry(
        savePlatformCourseCodes({
          courses: subject.courses,
          changes: [],
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      );
    },
  }),
  rule({
    action: 'structure.add-area',
    rows: ['CRS-01'],
    status: 'CONFIRMED',
    actors: ['super_admin'],
    subject: 'structure',
    check: (actor, subject, now) =>
      dry(
        addArea({
          areas: subject.areas,
          name: '',
          description: null,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'structure.add-course',
    rows: ['CRS-02'],
    status: 'CONFIRMED',
    actors: ['super_admin'],
    subject: 'structure',
    check: (actor, subject, now) =>
      dry(
        addCourse({
          courses: subject.courses,
          areas: subject.areas,
          areaId: null,
          name: '',
          description: null,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'structure.rename',
    rows: ['CRS-03'],
    status: 'CONFIRMED',
    actors: ['super_admin'],
    subject: 'structure',
    check: (actor, subject, now) =>
      subject.course
        ? dry(
            renameStructure({
              record: subject.course,
              siblings: subject.courses,
              name: '',
              actor: person(actor).ref,
              now,
              ids: DRY_RUN_IDS,
            }),
          )
        : null,
  }),
  rule({
    action: 'structure.move-course',
    rows: ['CRS-04'],
    status: 'PROVISIONAL',
    actors: ['super_admin'],
    subject: 'structure',
    check: (actor, subject, now) => {
      if (!subject.course) return { kind: 'invalid-state', current: 'no-course' };
      const target = subject.areas.find((area) => area.id !== subject.course!.areaId);
      return dry(
        moveCourse({
          course: subject.course,
          areas: subject.areas,
          targetAreaId: target?.id ?? null,
          filed: subject.filed,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      );
    },
  }),
  // ── Student learning: resources, WEB, feedback (M16, M18, M19) ──────────────────────────────
  rule({
    action: 'resource.open',
    rows: ['RUN-01'],
    status: 'PROVISIONAL',
    actors: ['student'],
    subject: 'learning',
    check: (actor, subject, now) => {
      const scope = learner(actor, subject.access);
      if (scope) return scope;
      const resource = subject.experiment.resources[0];
      if (!resource) return { kind: 'invalid-state', current: 'no-resources' };
      return dry(
        openResource({
          existing: null,
          studentId: person(actor).ref.personId,
          resourceId: resource.id,
          experiment: subject.experiment,
          gate: experimentGate({ ...subject.access, experiment: subject.experiment, now }),
          now,
        }),
      );
    },
  }),
  rule({
    action: 'web.launch',
    rows: ['RUN-03'],
    status: 'PROVISIONAL',
    actors: ['student'],
    subject: 'learning',
    check: (actor, subject, now) =>
      learner(actor, subject.access) ??
      (subject.webActivity !== null && subject.webActivity.firstOpenedAt !== null
        ? { kind: 'invalid-state', current: 'in-progress' }
        : dry(launchWebFormat({ experiment: subject.experiment, webGate: webGate(subject, now) }))),
  }),
  rule({
    action: 'web.continue',
    rows: ['RUN-04'],
    status: 'PROVISIONAL',
    actors: ['student'],
    subject: 'learning',
    check: (actor, subject, now) =>
      learner(actor, subject.access) ??
      (subject.webActivity === null || subject.webActivity.firstOpenedAt === null
        ? { kind: 'invalid-state', current: 'not-started' }
        : dry(launchWebFormat({ experiment: subject.experiment, webGate: webGate(subject, now) }))),
  }),
  rule({
    action: 'feedback.open-form',
    rows: ['FB-01'],
    status: 'CONFIRMED',
    actors: ['student'],
    subject: 'feedback',
    check: (actor, subject, now) => feedbackCheck(actor, subject, now),
  }),
  rule({
    action: 'feedback.send',
    rows: ['FB-02'],
    status: 'CONFIRMED',
    actors: ['student'],
    subject: 'feedback',
    check: (actor, subject, now) => feedbackCheck(actor, subject, now),
  }),
  rule({
    action: 'faculty.export-students-list',
    rows: ['RUN-16'],
    status: 'CONFIRMED',
    actors: ['faculty'],
    subject: 'faculty-students',
    check: () => null,
  }),
  // ── Faculty: assessments and the question bank (M20, M21) ───────────────────────────────────
  rule({
    action: 'assessment.create',
    rows: ['ASMT-01', 'ASMT-04'],
    status: 'CONFIRMED',
    actors: ['faculty'],
    subject: 'assessment',
    check: (actor, subject, now) => createCheck(actor, subject, now, 'create'),
  }),
  rule({
    action: 'assessment.save-draft',
    rows: ['ASMT-02'],
    status: 'PROVISIONAL',
    actors: ['faculty'],
    subject: 'assessment',
    check: (actor, subject, now) => createCheck(actor, subject, now, 'draft'),
  }),
  rule({
    action: 'assessment.edit-settings',
    rows: ['ASMT-05'],
    status: 'PROVISIONAL',
    actors: ['faculty'],
    subject: 'assessment',
    check: (actor, subject, now) => editCheck(actor, subject, now),
  }),
  rule({
    action: 'assessment.edit-questions',
    rows: ['ASMT-06'],
    status: 'PROVISIONAL',
    actors: ['faculty'],
    subject: 'assessment',
    check: (actor, subject, now) => editCheck(actor, subject, now),
  }),
  rule({
    action: 'question.add',
    rows: ['Q-01'],
    status: 'CONFIRMED',
    actors: ['faculty'],
    subject: 'question-bank',
    check: (actor, subject, now) =>
      bankScope(actor, subject.institutionId, subject.experimentId) ??
      dry(
        addQuestion({
          institutionId: subject.institutionId,
          experimentId: subject.experimentId,
          taughtExperiments: person(actor).taughtExperiments,
          text: '',
          body: { type: 'written', markingGuidance: null },
          marks: null,
          explanation: null,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'question.edit',
    rows: ['Q-02'],
    status: 'PROVISIONAL',
    actors: ['faculty'],
    subject: 'question-bank',
    check: (actor, subject, now) =>
      !subject.question
        ? { kind: 'invalid-state', current: 'no-question' }
        : (ownQuestion(actor, subject.question) ??
          dry(
            editQuestion({
              question: subject.question,
              content: { text: '', body: subject.question.body, marks: null, explanation: null },
              actor: person(actor).ref,
              now,
              ids: DRY_RUN_IDS,
            }),
          )),
  }),
  rule({
    action: 'question.delete',
    rows: ['Q-03'],
    status: 'CONFIRMED',
    actors: ['faculty'],
    subject: 'question-bank',
    check: (actor, subject, now) =>
      !subject.question
        ? { kind: 'invalid-state', current: 'no-question' }
        : (ownQuestion(actor, subject.question) ??
          dry(
            deleteQuestion({
              question: subject.question,
              actor: person(actor).ref,
              now,
              ids: DRY_RUN_IDS,
            }),
          )),
  }),
  rule({
    action: 'question.request-drafts',
    rows: ['Q-04'],
    status: 'PROVISIONAL',
    actors: ['faculty'],
    subject: 'question-bank',
    check: (actor, subject) => bankScope(actor, subject.institutionId, subject.experimentId),
  }),
  rule({
    action: 'question.review-draft',
    rows: ['Q-05'],
    status: 'CONFIRMED',
    actors: ['faculty'],
    subject: 'question-bank',
    check: (actor, subject, now) =>
      !subject.draft
        ? { kind: 'invalid-state', current: 'no-draft' }
        : (bankScope(actor, subject.draft.institutionId, subject.draft.experimentId) ??
          (subject.draft.requestedBy !== person(actor).ref.personId ? notOwn : null) ??
          dry(
            addDraftToBank({
              draft: subject.draft,
              institutionId: subject.institutionId,
              taughtExperiments: person(actor).taughtExperiments,
              content: { text: '', body: subject.draft.body, marks: null, explanation: null },
              actor: person(actor).ref,
              now,
              ids: DRY_RUN_IDS,
            }),
          )),
  }),
  rule({
    action: 'question.import',
    rows: ['Q-07'],
    status: 'PROVISIONAL',
    actors: ['faculty'],
    subject: 'question-bank',
    check: (actor, subject, now) =>
      bankScope(actor, subject.institutionId, subject.experimentId) ??
      dry(
        commitQuestionImport({
          rows: [],
          institutionId: subject.institutionId,
          experimentId: subject.experimentId,
          taughtExperiments: person(actor).taughtExperiments,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  // ── Student attempts; Faculty marking (M22) ────────────────────────────────────────────────
  rule({
    action: 'attempt.start',
    rows: ['ATT-01'],
    status: 'CONFIRMED',
    actors: ['student'],
    subject: 'attempt',
    check: (actor, subject, now) =>
      subject.attempts.length > 0
        ? { kind: 'invalid-state', current: 'attempted' }
        : startCheck(actor, subject, now),
  }),
  rule({
    action: 'attempt.try-again',
    rows: ['ATT-05'],
    status: 'PROVISIONAL',
    actors: ['student'],
    subject: 'attempt',
    check: (actor, subject, now) =>
      subject.attempts.length === 0
        ? { kind: 'invalid-state', current: 'to-do' }
        : startCheck(actor, subject, now),
  }),
  rule({
    action: 'attempt.answer',
    rows: ['ATT-02'],
    status: 'CONFIRMED',
    actors: ['student'],
    subject: 'attempt',
    check: (actor, subject, now) => {
      const scope = learnerOf(actor, subject);
      if (scope) return scope;
      const attempt = subject.attempt;
      const first = subject.assessment.questions[0];
      if (!attempt || !first) return { kind: 'invalid-state', current: 'no-attempt' };
      const question = subject.questions.find((candidate) => candidate.id === first.questionId);
      // Any valid answer of the question's type — the dry run never reads the answer key.
      const firstOption =
        question?.body.type === 'multiple-choice'
          ? (Object.keys(question.body.options)[0] as ChoiceKey | undefined)
          : undefined;
      const value =
        question?.body.type === 'multiple-choice' && firstOption
          ? { type: 'multiple-choice' as const, choice: firstOption }
          : question?.body.type === 'true-false'
            ? { type: 'true-false' as const, value: true }
            : { type: 'written' as const, text: '' };
      return dry(
        saveAnswer({
          attempt,
          assessment: subject.assessment,
          questions: subject.questions,
          questionId: first.questionId,
          value,
          actor: person(actor).ref,
          now,
        }),
      );
    },
  }),
  rule({
    action: 'attempt.submit',
    rows: ['ATT-03'],
    status: 'CONFIRMED',
    actors: ['student'],
    subject: 'attempt',
    check: (actor, subject, now) =>
      learnerOf(actor, subject) ??
      (!subject.attempt
        ? { kind: 'invalid-state', current: 'no-attempt' }
        : dry(submitAttempt({ attempt: subject.attempt, actor: person(actor).ref, now }))),
  }),
  rule({
    action: 'marking.save-mark',
    rows: ['ATT-08', 'ATT-22'],
    status: 'PROVISIONAL',
    actors: ['faculty'],
    subject: 'attempt',
    check: (actor, subject, now) => {
      if (!subject.attempt) return { kind: 'invalid-state', current: 'no-attempt' };
      const scope = markingScope(actor, subject);
      if (scope) return scope;
      const written = subject.assessment.questions.find((ref) =>
        subject.questions.some(
          (question) => question.id === ref.questionId && question.body.type === 'written',
        ),
      );
      if (!written) return { kind: 'invalid-state', current: 'no-written-answer' };
      return dry(
        saveMark({
          attempt: subject.attempt,
          assessment: subject.assessment,
          questions: subject.questions,
          questionId: written.questionId,
          mark: 0,
          feedback: null,
          actor: person(actor).ref,
          now,
        }),
      );
    },
  }),
  rule({
    action: 'marking.confirm',
    rows: ['ATT-09'],
    status: 'CONFIRMED',
    actors: ['faculty'],
    subject: 'attempt',
    check: (actor, subject, now) => {
      if (!subject.attempt) return { kind: 'invalid-state', current: 'no-attempt' };
      return (
        markingScope(actor, subject) ??
        dry(
          confirmMarks({
            attempt: subject.attempt,
            assessment: subject.assessment,
            questions: subject.questions,
            actor: person(actor).ref,
            now,
          }),
        )
      );
    },
  }),
  // ── Device transfers (M23) ─────────────────────────────────────────────────────────────────
  rule({
    action: 'device-transfer.request',
    rows: ['DTR-01'],
    status: 'CONFIRMED',
    actors: ['student'],
    subject: 'device-transfer',
    check: (actor, subject, now) =>
      ownInstitution(actor, subject.institution.id) ??
      dry(
        requestDeviceTransfer({
          institution: subject.institution,
          devices: subject.devices,
          openTransfers: subject.openTransfers,
          newDevice: '',
          note: null,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'device-transfer.forward',
    rows: ['DTR-06'],
    status: 'CONFIRMED',
    actors: ['tenant_admin'],
    subject: 'device-transfer',
    check: (actor, subject, now) =>
      !subject.transfer
        ? { kind: 'invalid-state', current: 'no-transfer' }
        : dry(
            forwardDeviceTransfer({
              transfer: subject.transfer,
              institution: subject.institution,
              actor: person(actor).ref,
              now,
              ids: DRY_RUN_IDS,
            }),
          ),
  }),
  rule({
    action: 'device-transfer.approve',
    rows: ['DTR-10'],
    status: 'CONFIRMED',
    actors: ['super_admin'],
    subject: 'device-transfer',
    check: (actor, subject, now) => {
      const transfer = subject.transfer;
      if (!transfer) return { kind: 'invalid-state', current: 'no-transfer' };
      const device = subject.devices.find(
        (candidate) =>
          candidate.studentId === transfer.studentId && candidate.format === transfer.format,
      );
      if (!device) return { kind: 'invalid-state', current: 'no-device' };
      return dry(
        approveDeviceTransfer({
          transfer,
          device,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      );
    },
  }),
  // ── First publication (M10; LO-01) ─────────────────────────────────────────────────────────
  rule({
    action: 'submission.start',
    rows: ['SUB-01'],
    status: 'CONFIRMED',
    actors: ['vendor'],
    subject: 'submission',
    check: (actor, subject) => {
      if (subject.submission !== null) return { kind: 'invalid-state', current: 'saved' };
      const courses = vendorCoursesOf(actor);
      return courses.ok ? null : courses.refusal;
    },
  }),
  rule({
    action: 'submission.save-draft',
    rows: ['SUB-02', 'SUB-03', 'CRS-08'],
    status: 'PROVISIONAL',
    actors: ['vendor'],
    subject: 'submission',
    check: (actor, subject, now) =>
      vendorOwns(actor, subject) ??
      asVendor(actor, now, (write) =>
        dry(
          saveDraft({
            submission: subject.submission,
            content: subject.submission?.content ?? EMPTY_CONTENT,
            ...write,
          }),
        ),
      ),
  }),
  rule({
    action: 'submission.edit-attachments',
    rows: ['SUB-04'],
    status: 'PROVISIONAL',
    actors: ['vendor'],
    subject: 'submission',
    check: (actor, subject, now) => {
      const owned = vendorOwns(actor, subject);
      if (owned) return owned;
      const content = subject.submission?.content ?? EMPTY_CONTENT;
      return asVendor(actor, now, (write) =>
        subject.submission?.status.state === 'returned'
          ? dry(saveRevision({ submission: subject.submission, content, ...write }))
          : dry(saveDraft({ submission: subject.submission, content, ...write })),
      );
    },
  }),
  rule({
    action: 'submission.submit-for-review',
    rows: ['SUB-05'],
    status: 'CONFIRMED',
    actors: ['vendor'],
    subject: 'submission',
    check: (actor, subject, now) =>
      vendorOwns(actor, subject) ??
      asVendor(actor, now, (write) =>
        withoutChecklist(
          dry(
            submitForReview({
              submission: subject.submission,
              content: subject.submission?.content ?? EMPTY_CONTENT,
              otherNames: [],
              ...write,
            }),
          ),
        ),
      ),
  }),
  rule({
    action: 'submission.save-revision',
    rows: ['SUB-08', 'SUB-09'],
    status: 'PROVISIONAL',
    actors: ['vendor'],
    subject: 'submission',
    check: (actor, subject, now) =>
      vendorOwns(actor, subject) ??
      (!subject.submission
        ? { kind: 'invalid-state', current: 'none' }
        : asVendor(actor, now, (write) =>
            dry(
              saveRevision({
                submission: subject.submission!,
                content: subject.submission!.content,
                ...write,
              }),
            ),
          )),
  }),
  rule({
    action: 'submission.resubmit',
    rows: ['SUB-07'],
    status: 'CONFIRMED',
    actors: ['vendor'],
    subject: 'submission',
    check: (actor, subject, now) =>
      vendorOwns(actor, subject) ??
      (!subject.submission
        ? { kind: 'invalid-state', current: 'none' }
        : asVendor(actor, now, (write) =>
            withoutChecklist(
              dry(
                resubmit({
                  submission: subject.submission!,
                  content: subject.submission!.content,
                  otherNames: [],
                  ...write,
                }),
              ),
            ),
          )),
  }),
  rule({
    action: 'submission.approve',
    rows: ['SUB-17'],
    status: 'CONFIRMED',
    actors: ['academic_reviewer'],
    subject: 'submission',
    check: (actor, subject, now) => reviewerCheck(actor, subject, now, 'approve'),
  }),
  rule({
    action: 'submission.return',
    rows: ['SUB-18'],
    status: 'CONFIRMED',
    actors: ['academic_reviewer'],
    subject: 'submission',
    check: (actor, subject, now) => reviewerCheck(actor, subject, now, 'return'),
  }),
  rule({
    action: 'learning-outcomes.edit',
    rows: ['LO-01'],
    status: 'CONFIRMED',
    actors: ['academic_reviewer'],
    subject: 'submission',
    check: (actor, subject, now) => reviewerCheck(actor, subject, now, 'return'),
  }),
  rule({
    action: 'submission.publish',
    rows: ['SUB-24'],
    status: 'CONFIRMED',
    actors: ['content_manager'],
    subject: 'submission',
    check: (actor, subject, now) =>
      cmCheck(actor, subject) ??
      dry(
        publish({
          submission: subject.submission!,
          experimentId: DRY_RUN_IDS.next('experiment'),
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'submission.send-back-to-reviewer',
    rows: ['SUB-26'],
    status: 'CONFIRMED',
    actors: ['content_manager'],
    subject: 'submission',
    check: (actor, subject, now) =>
      cmCheck(actor, subject) ??
      dry(
        sendBackToReviewer({
          submission: subject.submission!,
          reason: REASON,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'submission.send-back-to-vendor',
    rows: ['SUB-27'],
    status: 'CONFIRMED',
    actors: ['content_manager'],
    subject: 'submission',
    check: (actor, subject, now) =>
      cmCheck(actor, subject) ??
      dry(
        sendBackToVendor({
          submission: subject.submission!,
          reason: REASON,
          references: [],
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'submission.override-status',
    rows: ['SUB-33'],
    status: 'CONFIRMED',
    actors: ['super_admin'],
    subject: 'submission',
    check: (actor, subject, now) =>
      !subject.submission
        ? { kind: 'invalid-state', current: 'none' }
        : dry(
            overrideStatus({
              submission: subject.submission,
              holders: subject.holders,
              reason: REASON,
              actor: person(actor).ref,
              now,
              ids: DRY_RUN_IDS,
            }),
          ),
  }),
  // ── Corrections (M11) ──────────────────────────────────────────────────────────────────────
  rule({
    action: 'correction.open',
    rows: ['UPD-01'],
    status: 'CONFIRMED',
    actors: ['content_manager'],
    subject: 'experiment',
    check: (actor, subject, now) => {
      const scope = covers(actor, subject.experiment.courseId, subject.experiment.id);
      if (scope) return scope;
      if (
        subject.openUpdate &&
        (subject.openUpdate.state === 'draft' || subject.openUpdate.state === 'returned')
      ) {
        return { kind: 'invalid-state', current: 'joinable' };
      }
      return dry(
        openCorrection({
          experiment: subject.experiment,
          openUpdate: subject.openUpdate,
          entry: 'start-a-correction',
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      );
    },
  }),
  rule({
    action: 'correction.join',
    rows: ['UPD-02'],
    status: 'PROVISIONAL',
    actors: ['content_manager'],
    subject: 'experiment',
    check: (actor, subject) =>
      covers(actor, subject.experiment.courseId, subject.experiment.id) ??
      (subject.openUpdate &&
      (subject.openUpdate.state === 'draft' || subject.openUpdate.state === 'returned')
        ? null
        : { kind: 'invalid-state', current: subject.openUpdate?.state ?? 'none' }),
  }),
  rule({
    action: 'correction.save',
    rows: ['UPD-04'],
    status: 'CONFIRMED',
    actors: ['content_manager'],
    subject: 'update',
    check: (actor, subject, now) =>
      covers(actor, subject.experiment.courseId, subject.experiment.id) ??
      dry(
        saveCorrection({
          update: subject.update,
          edit: { proposed: subject.update.proposed, whatChangesAndWhy: null, versionLabel: null },
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'correction.send-for-review',
    rows: ['UPD-05'],
    status: 'CONFIRMED',
    actors: ['content_manager'],
    subject: 'update',
    check: (actor, subject, now) =>
      covers(actor, subject.experiment.courseId, subject.experiment.id) ??
      dry(
        sendForAcademicReview({
          update: subject.update,
          experiment: subject.experiment,
          edit: { proposed: subject.update.proposed, whatChangesAndWhy: null, versionLabel: null },
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'correction.withdraw',
    rows: ['UPD-08'],
    status: 'PROVISIONAL',
    actors: ['content_manager'],
    subject: 'update',
    check: (actor, subject, now) =>
      covers(actor, subject.experiment.courseId, subject.experiment.id) ??
      dry(
        withdrawUpdate({
          update: subject.update,
          experiment: subject.experiment,
          reason: REASON,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'correction.approve',
    rows: ['UPD-13'],
    status: 'CONFIRMED',
    actors: ['academic_reviewer'],
    subject: 'update',
    check: (actor, subject, now) =>
      covers(actor, subject.experiment.courseId, subject.experiment.id) ??
      dry(
        approveUpdate({ update: subject.update, actor: person(actor).ref, now, ids: DRY_RUN_IDS }),
      ),
  }),
  rule({
    action: 'correction.return',
    rows: ['UPD-14'],
    status: 'CONFIRMED',
    actors: ['academic_reviewer'],
    subject: 'update',
    check: (actor, subject, now) =>
      covers(actor, subject.experiment.courseId, subject.experiment.id) ??
      dry(
        returnUpdate({
          update: subject.update,
          reason: REASON,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'correction.release',
    rows: ['UPD-19'],
    status: 'CONFIRMED',
    actors: ['super_admin'],
    subject: 'update',
    check: (actor, subject, now) =>
      dry(
        releaseUpdate({
          update: subject.update,
          experiment: subject.experiment,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'correction.hold',
    rows: ['UPD-20', 'UPD-25'],
    status: 'PROVISIONAL',
    actors: ['super_admin'],
    subject: 'update',
    check: (actor, subject, now) =>
      dry(
        holdUpdate({
          update: subject.update,
          reason: REASON,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'correction.lift-hold',
    rows: ['UPD-22'],
    status: 'PROVISIONAL',
    actors: ['super_admin'],
    subject: 'update',
    check: (actor, subject, now) =>
      dry(liftHold({ update: subject.update, actor: person(actor).ref, now, ids: DRY_RUN_IDS })),
  }),
  // ── Platform roles (M25) ───────────────────────────────────────────────────────────────────
  rule({
    action: 'platform-role.register',
    rows: ['ROLE-01'],
    status: 'CONFIRMED',
    actors: ['super_admin'],
    subject: 'role-holder',
    check: (actor, subject, now) =>
      dry(
        registerHolder({
          holders: subject.holders,
          role: 'vendor',
          name: '',
          workEmail: '',
          organisation: '',
          personId: person(actor).ref.personId,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      ),
  }),
  rule({
    action: 'platform-role.assign-scope',
    rows: ['ROLE-02'],
    status: 'CONFIRMED',
    actors: ['super_admin'],
    subject: 'role-holder',
    check: (_actor, subject) =>
      subject.holder ? null : { kind: 'invalid-state', current: 'no-holder' },
  }),
  rule({
    action: 'platform-role.withdraw-scope',
    rows: ['ROLE-03'],
    status: 'CONFIRMED',
    actors: ['super_admin'],
    subject: 'role-holder',
    check: (actor, subject, now) =>
      !subject.holder || !subject.scopeId
        ? { kind: 'invalid-state', current: 'no-scope' }
        : dry(
            withdrawScope({
              holder: subject.holder,
              scopeId: subject.scopeId,
              reason: REASON,
              actor: person(actor).ref,
              now,
              ids: DRY_RUN_IDS,
            }),
          ),
  }),
  rule({
    action: 'platform-role.restore-scope',
    rows: ['ROLE-04', 'ROLE-14'],
    status: 'PROVISIONAL',
    actors: ['super_admin'],
    subject: 'role-holder',
    check: (actor, subject, now) =>
      !subject.holder || !subject.scopeId
        ? { kind: 'invalid-state', current: 'no-scope' }
        : dry(
            restoreScope({
              holder: subject.holder,
              scopeId: subject.scopeId,
              actor: person(actor).ref,
              now,
              ids: DRY_RUN_IDS,
            }),
          ),
  }),
  // ── Help & support (M24) ───────────────────────────────────────────────────────────────────
  rule({
    action: 'support.report',
    rows: ['SUP-01'],
    status: 'CONFIRMED',
    actors: [
      'student',
      'faculty',
      'tenant_admin',
      'vendor',
      'academic_reviewer',
      'content_manager',
      'super_admin',
    ],
    subject: 'support-report',
    check: (_actor, subject) =>
      subject.report === null ? null : { kind: 'invalid-state', current: 'sent' },
  }),
  rule({
    action: 'support.resolve',
    rows: ['SUP-05'],
    status: 'CONFIRMED',
    actors: ['super_admin'],
    subject: 'support-report',
    check: (actor, subject, now) =>
      !subject.report
        ? { kind: 'invalid-state', current: 'none' }
        : subject.report.reporter.personId === person(actor).ref.personId
          ? outOfScope // SUP-03: nobody resolves their own report
          : dry(
              resolveReport({
                report: subject.report,
                note: REASON,
                actor: person(actor).ref,
                now,
                ids: DRY_RUN_IDS,
              }),
            ),
  }),
  rule({
    action: 'support.reopen',
    rows: ['SUP-06'],
    status: 'CONFIRMED',
    actors: ['super_admin'],
    subject: 'support-report',
    check: (actor, subject, now) =>
      !subject.report
        ? { kind: 'invalid-state', current: 'none' }
        : subject.report.reporter.personId === person(actor).ref.personId
          ? { kind: 'policy-open', decision: 'SUP-04' } // reopening one's own report is open
          : dry(
              reopenReport({
                report: subject.report,
                actor: person(actor).ref,
                now,
                ids: DRY_RUN_IDS,
              }),
            ),
  }),
  // ── Session (M26) ──────────────────────────────────────────────────────────────────────────
  rule({
    action: 'session.sign-in',
    rows: ['SES-01', 'SES-07', 'SES-08'],
    status: 'CONFIRMED',
    actors: [
      'student',
      'faculty',
      'tenant_admin',
      'vendor',
      'academic_reviewer',
      'content_manager',
      'super_admin',
    ],
    subject: 'session',
    check: (actor, subject) => {
      const outcome = signInOutcome({
        role: person(actor).ref.role,
        accountStatus: subject.accountStatus,
        institution: subject.institution,
      });
      return outcome.kind === 'policy-open'
        ? { kind: 'policy-open', decision: outcome.decision }
        : null;
    },
  }),
  rule({
    action: 'session.sign-out',
    rows: ['SES-06'],
    status: 'CONFIRMED',
    actors: [
      'student',
      'faculty',
      'tenant_admin',
      'vendor',
      'academic_reviewer',
      'content_manager',
      'super_admin',
    ],
    subject: 'session',
    check: () => null,
  }),
] as const;

/** Every offered action id. */
export type ActionId = (typeof POLICY_RULES)[number]['action'];

// ── helpers used by the rules above ──────────────────────────────────────────────────────────

const EMPTY_CONTENT = {
  courseId: null,
  name: '',
  summary: null,
  description: null,
  version: null,
  formats: [],
  delivery: {},
  preview: { label: null, link: null },
  documents: [],
} as const;

/**
 * The Vendor's courses come from their own active scopes (CRS-08; SUB-01 "course must be one of the
 * Vendor's assigned courses"): an "All experiments" scope gives any course (ROLE-11, owner decision
 * PD-2 of 27 Oct 2026), a one-experiment scope nothing (PD-4); a Vendor with no active scope can
 * act on nothing (PD-3).
 */
function vendorCoursesOf(actor: PersonActor | PublicActor): Decision<VendorCourseGrant> {
  const holder = person(actor).holder;
  if (!holder) return { ok: false, refusal: outOfScope };
  const grant = vendorCourseGrant(holder);
  return grantIsEmpty(grant) ? { ok: false, refusal: outOfScope } : { ok: true, value: grant };
}

interface VendorWriteContext {
  readonly actor: PersonActorRef;
  readonly vendor: PlatformRoleHolder;
  readonly assignedCourses: VendorCourseGrant;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

/** Runs a Vendor's dry run with the courses their scopes give them. */
function asVendor(
  actor: PersonActor | PublicActor,
  now: IsoInstant,
  run: (write: VendorWriteContext) => Refusal | null,
): Refusal | null {
  const courses = vendorCoursesOf(actor);
  if (!courses.ok) return courses.refusal;
  const self = person(actor);
  return run({
    actor: self.ref,
    vendor: self.holder!,
    assignedCourses: courses.value,
    now,
    ids: DRY_RUN_IDS,
  });
}

/** A Vendor acts on the experiments they created (SUB-14 "own"). */
function vendorOwns(
  actor: PersonActor | PublicActor,
  subject: SubjectOf<'submission'>,
): Refusal | null {
  const holder = person(actor).holder;
  if (!holder) return outOfScope;
  return subject.submission && subject.submission.vendorHolderId !== holder.id ? notOwn : null;
}

/** A complete checklist is a form matter, not an offer matter (the checklist lists what is missing). */
function withoutChecklist(refusal: Refusal | null): Refusal | null {
  return refusal?.kind === 'refused' && refusal.code === 'submit-checklist-incomplete'
    ? null
    : refusal;
}

function reviewerCheck(
  actor: PersonActor | PublicActor,
  subject: SubjectOf<'submission'>,
  now: IsoInstant,
  kind: 'approve' | 'return',
): Refusal | null {
  const submission = subject.submission;
  if (!submission) return { kind: 'invalid-state', current: 'none' };
  const scope = covers(actor, submission.content.courseId);
  if (scope) return scope;
  const outcomes = [{ id: DRY_RUN_IDS.next('learningOutcome'), text: REASON }];
  return kind === 'approve'
    ? dry(
        approveSubmission({
          submission,
          outcomes,
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      )
    : dry(
        returnSubmission({
          submission,
          outcomes,
          reason: REASON,
          references: [],
          actor: person(actor).ref,
          now,
          ids: DRY_RUN_IDS,
        }),
      );
}

function cmCheck(
  actor: PersonActor | PublicActor,
  subject: SubjectOf<'submission'>,
): Refusal | null {
  if (!subject.submission) return { kind: 'invalid-state', current: 'none' };
  return covers(actor, subject.submission.content.courseId);
}

function feedbackCheck(
  actor: PersonActor | PublicActor,
  subject: SubjectOf<'feedback'>,
  now: IsoInstant,
): Refusal | null {
  const scope = learner(actor, subject.access);
  if (scope) return scope;
  return dry(
    sendFeedback({
      existing: subject.feedback,
      completion: subject.completion,
      gate: experimentGate({ ...subject.access, experiment: subject.experiment, now }),
      studentId: subject.access.student.id,
      experimentId: subject.experiment.id,
      format: subject.format,
      ratings: [null, null, null, null, null],
      comments: null,
      now,
      ids: DRY_RUN_IDS,
    }),
  );
}

function createCheck(
  actor: PersonActor | PublicActor,
  subject: SubjectOf<'assessment'>,
  now: IsoInstant,
  mode: 'create' | 'draft',
): Refusal | null {
  if (subject.institutionId !== person(actor).institutionId) return outOfScope;
  return dry(
    createAssessment({
      existing: subject.assessment,
      institutionId: subject.institutionId,
      experimentId: subject.experimentId,
      taughtExperiments: person(actor).taughtExperiments,
      mode,
      name: '',
      introduction: null,
      rules: NO_RULES,
      questions: [],
      actor: person(actor).ref,
      now,
      ids: DRY_RUN_IDS,
    }),
  );
}

/** Editing someone else's assessment on a co-taught course is not drawn (ASMT-17 OPEN). */
function editCheck(
  actor: PersonActor | PublicActor,
  subject: SubjectOf<'assessment'>,
  now: IsoInstant,
): Refusal | null {
  const assessment = subject.assessment;
  if (!assessment) return { kind: 'invalid-state', current: 'none' };
  if (assessment.institutionId !== person(actor).institutionId) return outOfScope;
  if (!person(actor).taughtExperiments.includes(assessment.experimentId)) return outOfScope;
  const creator = assessment.createdBy;
  if (creator.kind === 'person' && creator.personId !== person(actor).ref.personId)
    return { kind: 'policy-open', decision: 'OD-B4-17' }; // ASMT-17
  const outcome = changeAssessment({
    assessment,
    name: assessment.name,
    introduction: assessment.introduction,
    rules: assessment.rules,
    questions: assessment.questions,
    hasSubmissions: subject.hasSubmissions,
    actor: person(actor).ref,
    now,
    ids: DRY_RUN_IDS,
  });
  return outcome.ok ||
    outcome.refusal.kind === 'invalid-state' ||
    outcome.refusal.kind === 'validation-failed'
    ? null
    : outcome.refusal;
}

function startCheck(
  actor: PersonActor | PublicActor,
  subject: SubjectOf<'attempt'>,
  now: IsoInstant,
): Refusal | null {
  const scope = learnerOf(actor, subject);
  if (scope || !subject.access) return scope ?? { kind: 'invalid-state', current: 'no-access' };
  if (subject.experiment && subject.experiment.id !== subject.assessment.experimentId) {
    return { kind: 'invalid-state', current: 'experiment-mismatch' };
  }
  return dry(
    startAttempt({
      assessment: subject.assessment,
      gate: experimentGate({ ...subject.access, experiment: subject.experiment, now }),
      attempts: subject.attempts,
      questions: subject.questions,
      actor: person(actor).ref,
      now,
      ids: DRY_RUN_IDS,
    }),
  );
}

/** A Student acts on their own learning, in their own institution (P7: self only). */
function learner(actor: PersonActor | PublicActor, access: AccessFacts | null): Refusal | null {
  const self = person(actor);
  if (!access) return { kind: 'invalid-state', current: 'no-access' };
  if (access.student.id !== self.ref.personId) return notOwn;
  return access.institution.id === self.institutionId ? null : outOfScope;
}

/** A Student's attempt: their own access, at an assessment of their own institution. */
function learnerOf(
  actor: PersonActor | PublicActor,
  subject: SubjectOf<'attempt'>,
): Refusal | null {
  return (
    learner(actor, subject.access) ??
    (subject.assessment.institutionId === person(actor).institutionId ? null : outOfScope)
  );
}

/** The WEB format gate: given, published and in the plan (RUN-03, RUN-04; RUN-06 DENY). */
function webGate(subject: SubjectOf<'learning'>, now: IsoInstant): OpenGate {
  return canOpenFormat({ ...subject.access, experiment: subject.experiment, now, format: 'web' });
}

/** A Faculty member's question bank: their institution, an experiment they teach (Q-01 … Q-07). */
function bankScope(
  actor: PersonActor | PublicActor,
  institutionId: InstitutionId,
  experimentId: ExperimentId,
): Refusal | null {
  const self = person(actor);
  if (self.institutionId !== institutionId) return outOfScope;
  return self.taughtExperiments.includes(experimentId) ? null : outOfScope;
}

/** "Own bank" (Q-02, Q-03): a question someone else added is open — whether the bank is per Faculty
 *  member or shared is undecided (Q-10, OD-B4-17). */
function ownQuestion(actor: PersonActor | PublicActor, question: Question): Refusal | null {
  return (
    bankScope(actor, question.institutionId, question.experimentId) ??
    (question.addedBy.kind === 'person' && question.addedBy.personId !== person(actor).ref.personId
      ? { kind: 'policy-open', decision: 'OD-B4-17' }
      : null)
  );
}

/** Marking: written answers in assessments of experiments the Faculty member teaches; on a
 *  co-taught assessment someone else created, confirming is not drawn (ASMT-17). */
function markingScope(
  actor: PersonActor | PublicActor,
  subject: SubjectOf<'attempt'>,
): Refusal | null {
  if (subject.assessment.institutionId !== person(actor).institutionId) return outOfScope;
  if (!person(actor).taughtExperiments.includes(subject.assessment.experimentId)) return outOfScope;
  const creator = subject.assessment.createdBy;
  return creator.kind === 'person' && creator.personId !== person(actor).ref.personId
    ? { kind: 'policy-open', decision: 'OD-B4-17' } // ASMT-17
    : null;
}

/**
 * The OPEN rows: capabilities that are undecided — never offered, refused with `policy-open`
 * naming the decision (P4; Appendix F §5.1). None of them has a rule above. The matrix draws 15;
 * ATT-17 (several written questions) left this list on the owner's decision of 24 Oct 2026 —
 * confirm once per attempt after every written answer has a saved mark (P4-04): it is served by
 * `marking.confirm` (ATT-09) and `confirmMarks`. ROLE-11 (a Vendor's non-course scope) left it on
 * the owner's decision of 27 Oct 2026 (PD-2, PD-4): served by `submission.start` and the Vendor
 * course grant (`OWNER_DECIDED_OPEN_ROWS`).
 */
export const OPEN_CAPABILITIES = {
  'request.narrow-multi-experiment': { row: 'REQ-19', decision: 'REQ-19' },
  'request.resolve-stuck-payment': { row: 'REQ-22', decision: 'R06' },
  'institution.replace-institute-admin': { row: 'INST-06', decision: 'INST-06' },
  'access.withdraw-group': { row: 'SACC-08', decision: 'OD-B2-01' },
  'person.deactivate-faculty': { row: 'PER-07', decision: 'PER-07' },
  'person.edit': { row: 'PER-08', decision: 'ND-04' },
  'platform-course-code.save-limited-scope': { row: 'CC-06', decision: 'CC-06' },
  'assessment.co-teaching-edit': { row: 'ASMT-17', decision: 'OD-B4-17' },
  'question.choose-experiment': { row: 'Q-11', decision: 'Q-11' },
  'device-transfer.resolve-without-institute-admin': { row: 'DTR-09', decision: 'OD-B3-05' },
  'submission.override-other-target': { row: 'SUB-35', decision: 'OD-B7-09' },
  'support.reopen-own': { row: 'SUP-04', decision: 'SUP-04' },
  'session.sign-in-inactive-faculty': { row: 'SES-09', decision: 'SES-09' },
} as const;

export type OpenCapability = keyof typeof OPEN_CAPABILITIES;

/**
 * Matrix rows of kind OPEN that an owner decision has since resolved (the frozen matrix,
 * `docs/v46/permission-matrix.json`, still reads OPEN): the row, the decision and its date, and the
 * rule that now serves it. They are no OPEN capability any more.
 */
export const OWNER_DECIDED_OPEN_ROWS = {
  'ATT-17': {
    decision: 'P4-04',
    decided: '2026-10-24',
    ruling:
      'Several written questions: Faculty saves a mark for every written answer, then confirms the attempt once',
    servedBy: 'marking.confirm',
  },
  'ROLE-11': {
    decision: 'PD-2',
    decided: '2026-10-27',
    ruling:
      'For a Vendor only, an active “All experiments” scope means any existing course, now and later; a one-experiment scope gives a Vendor nothing and is no longer assigned to Vendors (PD-4)',
    servedBy: 'submission.start',
  },
} as const satisfies Readonly<
  Record<
    string,
    {
      readonly decision: string;
      readonly decided: string;
      readonly ruling: string;
      readonly servedBy: string;
    }
  >
>;

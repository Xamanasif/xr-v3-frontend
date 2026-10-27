/**
 * WP-0.9 acceptance (4): policy coverage of the candidate permission matrix — 347/347 rows
 * (Appendix F §5.3). The matrix is evidence-derived candidate policy, not owner approval:
 *  - ALLOW → a policy rule: each acting role, in the required state and scope, gets `may()` true
 *    and the action in `availableActions`; every role not on an ALLOW row of the action is refused;
 *  - DENY → refusal and absence (no rule, no exported command);
 *  - OPEN (15) → never offered, refused with `policy-open` — except a row an owner decision has
 *    since resolved (`OWNER_DECIDED_OPEN_ROWS`: ATT-17, 24 Oct 2026; ROLE-11, 27 Oct 2026), whose
 *    case proves the decided behaviour through the rule that now serves it;
 *  - SYSTEM (11) → reachable only through system writers, never through a user command;
 *  - READ → visibility (`canRead`) and the read-model derivations.
 * Every test name carries the row's id, kind and status (and the stakeholder-conflict flag), so an
 * owner decision flips one row and its test.
 *
 * The matrix is read from v2/docs/v46/permission-matrix.json and pinned by the SHA-256 that
 * docs/v46/SHA256SUMS.txt records: a changed row fails here until this suite is updated with it.
 * (`pnpm verify` runs turbo with --force, so a cached replay never hides a changed matrix.)
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import * as domain from '../index.js';
import type { PersonActorRef, Role } from '../roles.js';
import { SYSTEM_ACTORS } from '../roles.js';
import {
  area,
  assessment,
  attempt,
  content,
  context,
  counterIds,
  course,
  device,
  experiment,
  expectOk,
  faculty,
  grant,
  group,
  holder,
  ids,
  institution,
  mapping,
  personRef,
  plan,
  publicContext,
  QUESTIONS,
  question,
  refusalOf,
  report,
  request,
  student,
  submission,
  system,
  T,
  transfer,
  update,
  who,
} from '../testing/fixtures.js';
import { unsafeBrand } from '../kernel/brand.js';
import type { IsoInstant } from '../kernel/time.js';
import { calendarDate } from '../kernel/time.js';
import { provided } from '../kernel/provided.js';
import { UNDECIDED_OVERLAP_POLICY, NO_LICENCE_WAITS, type OpenGate } from '../access/model.js';
import { giveAccess, withdrawGrant } from '../access/decide.js';
import {
  type AccessFacts,
  canOpenFormat,
  experimentGate,
  type GateInput,
  grantDisplayStatus,
} from '../access/gate.js';
import { ATTEMPT_TRANSITIONS, NO_RULES, type Attempt } from '../assessment/model.js';
import { assessmentReadiness, changeAssessment } from '../assessment/assessment.js';
import { addDraftToBank } from '../assessment/question-bank.js';
import {
  applyObjectiveMarks,
  assessmentForStudent,
  confirmMarks,
  resultReleaseAt,
  resultView,
  saveMark,
} from '../assessment/attempt.js';
import { publicAreas, publicCatalogue } from '../catalogue/decide.js';
import type { Experiment } from '../catalogue/model.js';
import {
  completionFromRuntimeEvents,
  type FormatCompletion,
  reportCompletion,
} from '../completion/record.js';
import type { CompletionPolicy } from '../completion/policy.js';
import { formatProgress, formatProgressView } from '../completion/progress.js';
import {
  holdUpdate,
  liveFields,
  openCorrection,
  releaseUpdate,
  UPDATE_TRANSITIONS,
  withdrawUpdate,
} from '../correction/correction.js';
import {
  DEVICE_TRANSFER_TRANSITIONS,
  forwardingBlocked,
  hasMyDevice,
  requestDeviceTransfer,
} from '../device/device.js';
import type { FormatFeedback } from '../feedback/feedback.js';
import { pauseInstitution } from '../institution/decide.js';
import { planTermState } from '../institution/term.js';
import {
  assignFacultyCourse,
  createGroup,
  deactivateStudent,
  facultyScope,
  removeMember,
  unmarkedAfterRemoval,
} from '../people/decide.js';
import type { Person } from '../people/model.js';
import {
  registerHolder,
  vendorCourseGrant,
  withdrawScope,
} from '../platform-roles/platform-roles.js';
import type { PlatformRoleHolder } from '../platform-roles/platform-roles.js';
import {
  accessEndingRows,
  iaContentAccess,
  inactiveDays,
  navCounts,
  usage,
} from '../read-models/read-models.js';
import {
  approveRequest,
  approveSmallerScope,
  reportPaymentOutcome,
  startPayment,
  submitAdditionalLicencesRequest,
  submitPublicRequest,
  submitRenewalRequest,
} from '../request/decide.js';
import { EMPTY_SELECTION, REQUEST_STATUSES, REQUEST_TRANSITIONS } from '../request/model.js';
import { addToSelection } from '../request/selection.js';
import { openResource } from '../resources/resources.js';
import {
  launchWebFormat,
  recordRuntimeActivity,
  type RuntimeActivity,
} from '../runtime/activity.js';
import type { RuntimeEventRecord } from '../runtime/events.js';
import { shellBanner } from '../session/session.js';
import {
  isStuck,
  overrideStatus,
  publish,
  returnSubmission,
  routeResubmission,
} from '../submission/decide.js';
import {
  DRAWN_WORKFLOW_ROUTING,
  SUBMISSION_TRANSITIONS,
  type SubmissionStatus,
} from '../submission/model.js';
import type { PolicyContext } from './context.js';
import { roleOf } from './context.js';
import { ALL_RULES, availableActions, isOpenCapability, may } from './may.js';
import { canRead, courseCodeFor, type ReadTarget } from './read.js';
import {
  type ActionId,
  OPEN_CAPABILITIES,
  type OpenCapability,
  OWNER_DECIDED_OPEN_ROWS,
} from './rules.js';
import type { Subject, SubjectOf } from './subjects.js';

// ── The matrix ──────────────────────────────────────────────────────────────────────────────────

interface MatrixRow {
  readonly id: string;
  readonly entity: string;
  readonly action: string;
  readonly roles: readonly string[];
  readonly kind: 'ALLOW' | 'DENY' | 'READ' | 'OPEN' | 'SYSTEM';
  readonly status: 'CONFIRMED' | 'PROVISIONAL' | 'UNRESOLVED';
  readonly stakeholderConflict: string | null;
}

const MATRIX_URL = new URL('../../../../docs/v46/permission-matrix.json', import.meta.url);
const MATRIX_SHA256 = '34826fec5420440afb55223fd22c363c29a4e1f58408761796bf0a9e20f3b3fa';
const MATRIX_BYTES = readFileSync(MATRIX_URL);
const ROWS = (JSON.parse(MATRIX_BYTES.toString('utf8')) as { readonly rows: readonly MatrixRow[] })
  .rows;
const ROW = new Map(ROWS.map((row) => [row.id, row]));
const idsOf = (kind: MatrixRow['kind']) =>
  ROWS.filter((row) => row.kind === kind).map((row) => row.id);

type RoleKey = Role | 'public';
const ROLE_OF: Readonly<Record<string, RoleKey | 'system'>> = {
  'Public (surface)': 'public',
  Student: 'student',
  Faculty: 'faculty',
  'Institute Admin': 'tenant_admin',
  Vendor: 'vendor',
  'Academic Reviewer': 'academic_reviewer',
  'Content Manager': 'content_manager',
  'Super Admin': 'super_admin',
  'System (mock service)': 'system',
};
const ALL_ROLES: readonly RoleKey[] = [
  'public',
  'student',
  'faculty',
  'tenant_admin',
  'vendor',
  'academic_reviewer',
  'content_manager',
  'super_admin',
];
const PEOPLE: readonly Role[] = [
  'student',
  'faculty',
  'tenant_admin',
  'vendor',
  'academic_reviewer',
  'content_manager',
  'super_admin',
];
const PERSON: Readonly<Record<Role, PersonActorRef>> = {
  student: who.student,
  faculty: who.faculty,
  tenant_admin: who.instituteAdmin,
  vendor: who.vendor,
  academic_reviewer: who.reviewer,
  content_manager: who.contentManager,
  super_admin: who.superAdmin,
};
const rolesOf = (row: MatrixRow): RoleKey[] =>
  row.roles
    .map((name) => ROLE_OF[name])
    .filter((role): role is RoleKey => role !== undefined && role !== 'system');

type Facts = Parameters<typeof context>[1];
function ctx(role: RoleKey, now: IsoInstant = T.oct14, facts: Facts = {}): PolicyContext {
  return role === 'public' ? publicContext([ids.token42], now) : context(PERSON[role], facts, now);
}

const ACTION_IDS: readonly string[] = ALL_RULES.map((rule) => rule.action);
const EXPORTS: readonly string[] = Object.keys(domain);
const WRONG = { kind: 'not-permitted', why: 'wrong-workspace' } as const;

// ── Shared fixtures ─────────────────────────────────────────────────────────────────────────────

const PAUSED = () =>
  institution({
    pause: { since: T.oct12, by: who.superAdmin, reason: 'Checking the student list.' },
  });
const OPEN: OpenGate = { canOpen: true, viaGrantIds: [ids.sacc310] };
const NOT_GIVEN: OpenGate = { canOpen: false, reason: 'not-given' };
const COMPLETED_WEB: FormatCompletion = {
  studentId: ids.rahul,
  experimentId: ids.shell,
  format: 'web',
  completedAt: T.oct14,
  reportedFrom: 'simulation',
  recordedBy: system('system:runtime-report'),
};
const SENT_FEEDBACK: FormatFeedback = {
  id: unsafeBrand('fb-1'),
  studentId: ids.rahul,
  experimentId: ids.shell,
  format: 'web',
  statementSet: 1,
  ratings: [4, 5, 4, 3, 4],
  comments: null,
  sentAt: T.oct14,
};
const WEB_ACTIVITY: RuntimeActivity = {
  studentId: ids.rahul,
  experimentId: ids.shell,
  format: 'web',
  firstOpenedAt: provided(T.oct12),
  lastSavedAt: provided(T.oct12),
  lastSessionReportedAt: null,
  sessions: provided(1),
};
const DRAFT = {
  id: unsafeBrand<domain.QuestionDraftId>('draft-1'),
  institutionId: ids.godavari,
  requestedBy: ids.ranganathan,
  experimentId: ids.shell,
  text: 'Why does counter-flow give a higher LMTD?',
  body: { type: 'written' as const, markingGuidance: null },
  marks: null,
  explanation: null,
  requestedAt: T.oct20,
};
const PENDING = {
  id: unsafeBrand<domain.PaymentAttemptId>('pay-1'),
  startedAt: T.oct9,
  outcome: 'pending' as const,
  outcomeAt: null,
};
const SELECTED = expectOk(
  addToSelection({
    selection: EMPTY_SELECTION,
    experimentId: ids.shell,
    published: ['web', 'vr'],
    formats: ['web', 'vr'],
    now: T.oct2,
  }),
);
const FORM = {
  institutionName: 'Godavari Institute of Technology',
  contactPerson: 'Meera Iyer',
  contactEmail: 'meera.iyer@godavari.edu.in',
  contactPhone: null,
  licences: 120,
  term: { kind: 'yearly' as const },
  message: null,
};
const INACTIVE_STUDENT = () =>
  student({
    accountStatus: 'inactive',
    deactivation: { at: T.oct12, by: who.instituteAdmin, reason: 'Left the programme' },
  });

const STATUS = {
  draft: { state: 'draft' },
  withReviewer: { state: 'with-academic-reviewer', since: T.aug14, reason: 'first-review' },
  returned: { state: 'returned', since: T.aug14, by: 'academic-reviewer' },
  withCm: { state: 'with-content-manager', since: T.aug14 },
  published: { state: 'published', at: T.aug28, experimentId: ids.wallA },
} as const satisfies Record<string, SubmissionStatus>;

const SUBMITTED = (overrides: Partial<Attempt> = {}): Attempt =>
  attempt({ state: 'submitted', submittedAt: T.nov5, ...overrides });
const SUBMITTED_WITH_MARK = (): Attempt =>
  SUBMITTED({
    marking: {
      automatic: [{ questionId: ids.q101, awarded: 6, outOf: 6 }],
      written: [
        { questionId: ids.q102, mark: 7, feedback: null, savedAt: T.nov7, savedBy: who.faculty },
      ],
      confirmed: null,
    },
  });
const MARKED = (written: number): Attempt =>
  SUBMITTED({
    marking: {
      automatic: [{ questionId: ids.q101, awarded: 6, outOf: 6 }],
      written: [
        {
          questionId: ids.q102,
          mark: written,
          feedback: null,
          savedAt: T.nov7,
          savedBy: who.faculty,
        },
      ],
      confirmed: { at: T.nov7, by: who.faculty },
    },
  });

const VENDOR_SCOPE = holder('vendor');
const WITHDRAWN_HOLDER = (): PlatformRoleHolder =>
  expectOk(
    withdrawScope({
      holder: VENDOR_SCOPE,
      scopeId: VENDOR_SCOPE.scopes[0]!.id,
      reason: 'Moved to another programme',
      actor: who.superAdmin,
      now: T.oct12,
      ids: counterIds(),
    }),
  );
const SA_REPORT = () =>
  report('resolved', {
    reporter: {
      personId: ids.arjun,
      role: 'super_admin',
      displayName: 'Arjun Mehta',
      institutionId: null,
      organisation: 'BITS Pilani',
    },
  });

const named = (id: Experiment['id'], name: string): Experiment => {
  const live = experiment().live;
  return experiment({
    id,
    live: { ...live, catalogue: { name, summary: name, description: name } },
  });
};
const WALL_A = named(ids.wallA, 'Composite Wall Conduction');
const WALL_B = named(ids.wallB, 'Conduction Through a Composite Wall');

/** A Student's access records — by default Rahul, given Shell-and-Tube individually on ACC-0107. */
const access = (overrides: Partial<AccessFacts> = {}): AccessFacts => ({
  student: student(),
  institution: institution(),
  plans: [plan()],
  grants: [grant()],
  groups: [],
  waits: [],
  overlap: UNDECIDED_OVERLAP_POLICY,
  ...overrides,
});
const gateInput = (overrides: Partial<GateInput> = {}): GateInput => ({
  ...access(),
  experiment: experiment(),
  now: T.oct14,
  ...overrides,
});
const GROUP_GRANT = () =>
  grant({ id: ids.sacc311, target: { kind: 'group', groupId: ids.grp12 }, givenAt: T.oct12 });
/** The undecided overlap: Rahul's individual grant withdrawn, the group grant still active (OD-B2-01). */
const OVERLAP: Partial<AccessFacts> = {
  grants: [grant({ state: 'withdrawn' }), GROUP_GRANT()],
  groups: [group([{ id: ids.rahul, addedAt: T.oct9 }])],
};
const GIVE = {
  institution: institution(),
  plan: plan(),
  experimentIds: [ids.shell],
  target: { kind: 'students' as const, students: [student()] },
  grants: [],
  licences: NO_LICENCE_WAITS,
  actor: who.instituteAdmin,
  now: T.oct14,
  ids: counterIds(),
};
const learningTarget = (overrides: Partial<AccessFacts> = {}): ReadTarget => ({
  kind: 'student-learning',
  experiment: experiment(),
  access: access(overrides),
});

/** Subjects: the records a policy check reads, in a known state. */
const S = {
  selection: (): Subject => ({ kind: 'selection', selection: SELECTED }),
  request: (
    overrides: Partial<domain.AccessRequest> = {},
    inst: domain.Institution | null = null,
  ): SubjectOf<'request'> => ({ kind: 'request', request: request(overrides), institution: inst }),
  plan: (inst = institution(), p = plan()): SubjectOf<'plan'> => ({
    kind: 'plan',
    plan: p,
    institution: inst,
  }),
  institution: (inst = institution(), plans = [plan()]): SubjectOf<'institution'> => ({
    kind: 'institution',
    institution: inst,
    plans,
    people: [student(), faculty()],
    groups: [],
    mappings: [],
    coursesInAccess: [ids.course],
  }),
  grant: (overrides: Partial<Omit<SubjectOf<'grant'>, 'kind'>> = {}): SubjectOf<'grant'> => ({
    kind: 'grant',
    grant: grant(),
    institution: institution(),
    plan: plan(),
    student: student(),
    ...overrides,
  }),
  person: (person: Person = student(), inst = institution()): SubjectOf<'person'> => ({
    kind: 'person',
    person,
    institution: inst,
  }),
  group: (inst = institution()): SubjectOf<'group'> => ({
    kind: 'group',
    group: group([{ id: ids.rahul }]),
    institution: inst,
  }),
  facultyCourse: (inst = institution()): SubjectOf<'faculty-course'> => ({
    kind: 'faculty-course',
    mapping: mapping(),
    institution: inst,
  }),
  courseCode: (inst = institution()): SubjectOf<'course-code'> => ({
    kind: 'course-code',
    institution: inst,
    courseId: ids.course,
    coursesInAccess: [ids.course],
    existing: null,
  }),
  structure: (): SubjectOf<'structure'> => ({
    kind: 'structure',
    areas: [area(), area({ id: ids.area2, name: 'Chemical & Process' })],
    courses: [course()],
    course: course(),
    filed: { students: 0, faculty: 0 },
  }),
  learning: (
    overrides: Partial<AccessFacts> = {},
    webActivity: RuntimeActivity | null = null,
  ): SubjectOf<'learning'> => ({
    kind: 'learning',
    experiment: experiment(),
    access: access(overrides),
    webActivity,
  }),
  feedback: (
    completion: FormatCompletion | null = COMPLETED_WEB,
    feedback: FormatFeedback | null = null,
    overrides: Partial<AccessFacts> = {},
  ): SubjectOf<'feedback'> => ({
    kind: 'feedback',
    experiment: experiment(),
    format: 'web',
    completion,
    feedback,
    access: access(overrides),
  }),
  assessment: (
    current: domain.Assessment | null = null,
    hasSubmissions = false,
  ): SubjectOf<'assessment'> => ({
    kind: 'assessment',
    assessment: current,
    experimentId: ids.shell,
    institutionId: ids.godavari,
    hasSubmissions,
  }),
  bank: (): SubjectOf<'question-bank'> => ({
    kind: 'question-bank',
    experimentId: ids.shell,
    institutionId: ids.godavari,
    question: QUESTIONS[0]!,
    draft: DRAFT,
  }),
  attempt: (
    current: Attempt | null,
    attempts: readonly Attempt[] = current ? [current] : [],
    overrides: Partial<AccessFacts> = {},
    of = assessment(),
    questions = QUESTIONS,
  ): SubjectOf<'attempt'> => ({
    kind: 'attempt',
    assessment: of,
    questions,
    attempts,
    attempt: current,
    experiment: experiment(),
    access: access(overrides),
  }),
  device: (
    current: domain.DeviceTransfer | null = null,
    inst = institution(),
    openTransfers: readonly domain.DeviceTransfer[] = [],
  ): SubjectOf<'device-transfer'> => ({
    kind: 'device-transfer',
    institution: inst,
    transfer: current,
    devices: [device()],
    openTransfers,
  }),
  submission: (
    current: domain.Submission | null,
    holders: readonly PlatformRoleHolder[] = [holder('academic_reviewer')],
  ): SubjectOf<'submission'> => ({ kind: 'submission', submission: current, holders }),
  experiment: (openUpdate: domain.CorrectionUpdate | null = null): SubjectOf<'experiment'> => ({
    kind: 'experiment',
    experiment: experiment({ openUpdateId: openUpdate?.id ?? null }),
    openUpdate,
  }),
  update: (state: domain.UpdateState): SubjectOf<'update'> => ({
    kind: 'update',
    update: update(state),
    experiment: experiment({ openUpdateId: ids.upd5 }),
  }),
  holder: (
    current: PlatformRoleHolder | null = null,
    scopeId: domain.ScopeId | null = null,
  ): SubjectOf<'role-holder'> => ({
    kind: 'role-holder',
    holder: current,
    holders: [VENDOR_SCOPE],
    scopeId,
  }),
  report: (current: domain.SupportReport | null = null): SubjectOf<'support-report'> => ({
    kind: 'support-report',
    report: current,
  }),
  session: (
    accountStatus: 'active' | 'inactive' = 'active',
    inst: domain.Institution | null = institution(),
  ): SubjectOf<'session'> => ({ kind: 'session', accountStatus, institution: inst }),
};

// ── Assertions ──────────────────────────────────────────────────────────────────────────────────

/** The action is never offered to these roles: refused and absent from `availableActions`. */
function deniedTo(
  roles: readonly RoleKey[],
  action: ActionId,
  subject: Subject,
  now?: IsoInstant,
  facts?: Facts,
): void {
  for (const role of roles) {
    const verdict = may(ctx(role, now, facts), action, subject);
    expect(verdict, `${role} · ${action}`).toMatchObject({ allowed: false });
    expect(availableActions(ctx(role, now, facts), subject)).not.toContain(action);
  }
}

/** The role's own action is refused in this state, with this refusal. */
function refusedFor(
  role: RoleKey,
  action: ActionId,
  subject: Subject,
  refusal: object,
  now?: IsoInstant,
  facts?: Facts,
): void {
  expect(may(ctx(role, now, facts), action, subject)).toEqual({
    allowed: false,
    refusal: expect.objectContaining(refusal),
  });
  expect(availableActions(ctx(role, now, facts), subject)).not.toContain(action);
}

/** Nothing offers it: no rule action and no exported domain command matches. */
function absent(pattern: RegExp): void {
  expect(ACTION_IDS.filter((id) => pattern.test(id))).toEqual([]);
  expect(EXPORTS.filter((name) => pattern.test(name))).toEqual([]);
}

function visible(role: RoleKey, target: ReadTarget, facts?: Facts): boolean {
  return canRead(ctx(role, T.oct14, facts), target).visible;
}

// ── ALLOW: one case per row ─────────────────────────────────────────────────────────────────────

interface AllowCase {
  readonly action: ActionId;
  readonly subject: () => Subject;
  readonly now?: IsoInstant;
}

const ALLOW_CASES: Readonly<Record<string, AllowCase>> = {
  'SEL-01': { action: 'selection.edit', subject: S.selection },
  'REQ-01': { action: 'request.submit-public', subject: S.selection },
  'REQ-07': {
    action: 'request.start-payment',
    subject: () =>
      S.request(
        { status: 'approved-payment-required', institutionId: ids.godavari, route: 'external' },
        institution(),
      ),
  },
  'REQ-12': { action: 'request.set-route', subject: () => S.request() },
  'REQ-13': { action: 'request.approve', subject: () => S.request() },
  'REQ-14': {
    action: 'request.approve',
    subject: () =>
      S.request(
        {
          type: 'renewal',
          origin: 'institute-admin',
          institutionId: ids.godavari,
          sourcePlanId: ids.plan,
        },
        institution({ kind: 'internal' }),
      ),
  },
  'REQ-15': { action: 'request.approve-smaller-scope', subject: () => S.request() },
  'REQ-17': { action: 'request.request-information', subject: () => S.request() },
  'REQ-25': { action: 'request.submit-renewal', subject: () => S.plan() },
  'REQ-26': { action: 'request.submit-additional-licences', subject: () => S.plan() },
  'INST-01': { action: 'request.approve', subject: () => S.request() },
  'INST-04': {
    action: 'institution.assign-institute-admin',
    subject: () => S.institution(institution({ instituteAdmin: null })),
  },
  'INST-07': { action: 'institution.pause', subject: () => S.institution() },
  'INST-08': { action: 'institution.restore', subject: () => S.institution(PAUSED()) },
  'ACC-01': { action: 'request.approve', subject: () => S.request() },
  'SACC-01': { action: 'access.give-to-students', subject: () => S.plan() },
  'SACC-02': { action: 'access.give-to-group', subject: () => S.plan() },
  'SACC-07': { action: 'access.withdraw-individual', subject: () => S.grant() },
  'GRP-01': { action: 'group.create', subject: () => S.institution() },
  'GRP-02': { action: 'group.rename', subject: () => S.group() },
  'GRP-03': { action: 'group.add-members', subject: () => S.group() },
  'GRP-04': { action: 'group.remove-member', subject: () => S.group() },
  'PER-01': { action: 'person.add-student', subject: () => S.institution() },
  'PER-02': { action: 'person.import-students', subject: () => S.institution() },
  'PER-03': { action: 'person.add-faculty', subject: () => S.institution() },
  'PER-05': { action: 'person.deactivate-student', subject: () => S.person(student()) },
  'PER-06': { action: 'person.reactivate-student', subject: () => S.person(INACTIVE_STUDENT()) },
  'PER-11': { action: 'person.override-student-status', subject: () => S.person(student()) },
  'FCM-01': { action: 'faculty-course.assign', subject: () => S.institution() },
  'FCM-02': { action: 'faculty-course.remove', subject: () => S.facultyCourse() },
  'CC-01': { action: 'institution-course-code.set', subject: () => S.courseCode() },
  'CC-04': { action: 'platform-course-code.save', subject: S.structure },
  'CC-05': { action: 'platform-course-code.save', subject: S.structure },
  'RUN-01': { action: 'resource.open', subject: () => S.learning() },
  'RUN-03': { action: 'web.launch', subject: () => S.learning() },
  'RUN-04': { action: 'web.continue', subject: () => S.learning({}, WEB_ACTIVITY) },
  'RUN-16': {
    action: 'faculty.export-students-list',
    subject: () => ({ kind: 'faculty-students' }),
  },
  'FB-01': { action: 'feedback.open-form', subject: () => S.feedback() },
  'FB-02': { action: 'feedback.send', subject: () => S.feedback() },
  'ASMT-01': { action: 'assessment.create', subject: () => S.assessment() },
  'ASMT-02': { action: 'assessment.save-draft', subject: () => S.assessment() },
  'ASMT-04': { action: 'assessment.create', subject: () => S.assessment() },
  'ASMT-05': {
    action: 'assessment.edit-settings',
    subject: () => S.assessment(assessment(), true),
  },
  'ASMT-06': {
    action: 'assessment.edit-questions',
    subject: () => S.assessment(assessment(), true),
  },
  'Q-01': { action: 'question.add', subject: S.bank },
  'Q-02': { action: 'question.edit', subject: S.bank },
  'Q-03': { action: 'question.delete', subject: S.bank },
  'Q-04': { action: 'question.request-drafts', subject: S.bank },
  'Q-05': { action: 'question.review-draft', subject: S.bank },
  'Q-07': { action: 'question.import', subject: S.bank },
  'ATT-01': { action: 'attempt.start', subject: () => S.attempt(null), now: T.nov5 },
  'ATT-02': { action: 'attempt.answer', subject: () => S.attempt(attempt()), now: T.nov5 },
  'ATT-03': { action: 'attempt.submit', subject: () => S.attempt(attempt()), now: T.nov5 },
  'ATT-05': {
    action: 'attempt.try-again',
    subject: () => S.attempt(null, [MARKED(0)]),
    now: T.nov20,
  },
  'ATT-08': { action: 'marking.save-mark', subject: () => S.attempt(SUBMITTED()), now: T.nov7 },
  'ATT-22': { action: 'marking.save-mark', subject: () => S.attempt(SUBMITTED()), now: T.nov7 },
  'ATT-09': {
    action: 'marking.confirm',
    subject: () => S.attempt(SUBMITTED_WITH_MARK()),
    now: T.nov7,
  },
  'DTR-01': { action: 'device-transfer.request', subject: () => S.device() },
  'DTR-06': {
    action: 'device-transfer.forward',
    subject: () => S.device(transfer('with-institute-admin')),
  },
  'DTR-10': { action: 'device-transfer.approve', subject: () => S.device(transfer('forwarded')) },
  'SUB-01': { action: 'submission.start', subject: () => S.submission(null) },
  'SUB-02': { action: 'submission.save-draft', subject: () => S.submission(null) },
  'SUB-03': {
    action: 'submission.save-draft',
    subject: () => S.submission(submission(STATUS.draft)),
  },
  'SUB-04': {
    action: 'submission.edit-attachments',
    subject: () => S.submission(submission(STATUS.draft)),
  },
  'SUB-05': {
    action: 'submission.submit-for-review',
    subject: () => S.submission(submission(STATUS.draft)),
  },
  'SUB-07': {
    action: 'submission.resubmit',
    subject: () => S.submission(submission(STATUS.returned)),
  },
  'SUB-08': {
    action: 'submission.save-revision',
    subject: () => S.submission(submission(STATUS.returned)),
  },
  'SUB-09': {
    action: 'submission.save-revision',
    subject: () =>
      S.submission(submission(STATUS.returned, { content: content({ formats: ['web'] }) })),
  },
  'SUB-17': {
    action: 'submission.approve',
    subject: () => S.submission(submission(STATUS.withReviewer)),
  },
  'SUB-18': {
    action: 'submission.return',
    subject: () => S.submission(submission(STATUS.withReviewer)),
  },
  'SUB-24': {
    action: 'submission.publish',
    subject: () => S.submission(submission(STATUS.withCm)),
  },
  'SUB-26': {
    action: 'submission.send-back-to-reviewer',
    subject: () => S.submission(submission(STATUS.withCm)),
  },
  'SUB-27': {
    action: 'submission.send-back-to-vendor',
    subject: () => S.submission(submission(STATUS.withCm)),
  },
  'SUB-33': {
    action: 'submission.override-status',
    subject: () => S.submission(submission(STATUS.withReviewer), []),
  },
  'LO-01': {
    action: 'learning-outcomes.edit',
    subject: () => S.submission(submission(STATUS.withReviewer)),
  },
  'UPD-01': { action: 'correction.open', subject: () => S.experiment() },
  'UPD-02': { action: 'correction.join', subject: () => S.experiment(update('draft')) },
  'UPD-04': { action: 'correction.save', subject: () => S.update('draft') },
  'UPD-05': { action: 'correction.send-for-review', subject: () => S.update('draft') },
  'UPD-08': { action: 'correction.withdraw', subject: () => S.update('in-academic-review') },
  'UPD-13': { action: 'correction.approve', subject: () => S.update('in-academic-review') },
  'UPD-14': { action: 'correction.return', subject: () => S.update('in-academic-review') },
  'UPD-19': { action: 'correction.release', subject: () => S.update('awaiting-release-decision') },
  'UPD-20': { action: 'correction.hold', subject: () => S.update('awaiting-release-decision') },
  'UPD-25': { action: 'correction.hold', subject: () => S.update('awaiting-release-decision') },
  'UPD-22': { action: 'correction.lift-hold', subject: () => S.update('on-hold') },
  'CRS-01': { action: 'structure.add-area', subject: S.structure },
  'CRS-02': { action: 'structure.add-course', subject: S.structure },
  'CRS-03': { action: 'structure.rename', subject: S.structure },
  'CRS-04': { action: 'structure.move-course', subject: S.structure },
  'CRS-08': { action: 'submission.save-draft', subject: () => S.submission(null) },
  'ROLE-01': { action: 'platform-role.register', subject: () => S.holder() },
  'ROLE-02': {
    action: 'platform-role.assign-scope',
    subject: () => S.holder(holder('vendor', [])),
  },
  'ROLE-03': {
    action: 'platform-role.withdraw-scope',
    subject: () => S.holder(VENDOR_SCOPE, VENDOR_SCOPE.scopes[0]!.id),
  },
  'ROLE-04': {
    action: 'platform-role.restore-scope',
    subject: () => S.holder(WITHDRAWN_HOLDER(), VENDOR_SCOPE.scopes[0]!.id),
  },
  'ROLE-14': {
    action: 'platform-role.restore-scope',
    subject: () => S.holder(WITHDRAWN_HOLDER(), VENDOR_SCOPE.scopes[0]!.id),
  },
  'SUP-01': { action: 'support.report', subject: () => S.report() },
  'SUP-05': { action: 'support.resolve', subject: () => S.report(report('open')) },
  'SUP-06': { action: 'support.reopen', subject: () => S.report(report('resolved')) },
  'SES-01': { action: 'session.sign-in', subject: () => S.session() },
  'SES-06': { action: 'session.sign-out', subject: () => S.session() },
  'SES-07': { action: 'session.sign-in', subject: () => S.session('active', PAUSED()) },
  'SES-08': { action: 'session.sign-in', subject: () => S.session('inactive') },
};

// ── DENY: refusal and absence, one case per row ────────────────────────────────────────────────

const OTHER_STAFF = [
  'faculty',
  'super_admin',
  'vendor',
  'academic_reviewer',
  'content_manager',
] as const;

const DENY_CASES: Readonly<Record<string, () => void>> = {
  'SEL-02': () => absent(/checkout|purchase|buy|cart|basket/i),
  'SEL-06': () => absent(/price|cost|amount/i),
  'SEL-03': () =>
    expect(
      refusalOf(
        addToSelection({
          selection: EMPTY_SELECTION,
          experimentId: ids.shell,
          published: ['web', 'vr'],
          formats: ['ar'],
          now: T.oct2,
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'format-not-published' }),
  'SEL-04': () => {
    const sent = expectOk(
      submitPublicRequest({
        selection: SELECTED,
        form: FORM,
        publishedFormatsOf: () => ['web', 'vr'],
        now: T.oct2,
        ids: counterIds(),
      }),
    );
    expect(Object.keys(sent).sort()).toEqual(['request', 'selection']);
    deniedTo(['public'], 'access.give-to-students', S.plan());
  },
  'SEL-05': () => deniedTo(['public'], 'request.submit-additional-licences', S.plan()),
  'REQ-02': () => deniedTo(['public'], 'request.set-route', S.request()),
  'REQ-03': () => {
    absent(/price|amount|cardNumber|paymentDetail/i);
    const paying = expectOk(
      startPayment({
        request: request({ status: 'approved-payment-required', route: 'external' }),
        payer: { kind: 'requester', name: 'Meera Iyer' },
        now: T.oct9,
        ids: counterIds(),
      }),
    );
    expect(Object.keys(paying.payments[0]!).sort()).toEqual([
      'id',
      'outcome',
      'outcomeAt',
      'startedAt',
    ]);
  },
  'REQ-06': () => {
    absent(/reply|respond/i);
    expect(REQUEST_TRANSITIONS.some((row) => row.from === 'information-requested')).toBe(false);
  },
  'REQ-08': () =>
    refusedFor(
      'public',
      'request.start-payment',
      S.request({ status: 'payment-not-confirmed', payments: [PENDING] }),
      { kind: 'invalid-state', current: 'payment-not-confirmed' },
    ),
  'REQ-09': () =>
    refusedFor(
      'public',
      'request.start-payment',
      S.request({ status: 'access-active', route: 'internal' }),
      { kind: 'invalid-state', current: 'access-active' },
    ),
  'REQ-10': () => {
    absent(/declin/i);
    expect(REQUEST_STATUSES.join(' ')).not.toMatch(/declin/);
  },
  'REQ-16': () =>
    refusedFor(
      'super_admin',
      'request.approve-smaller-scope',
      S.request(
        {
          type: 'renewal',
          origin: 'institute-admin',
          institutionId: ids.godavari,
          sourcePlanId: ids.plan,
        },
        institution(),
      ),
      {
        kind: 'refused',
        code: 'renewal-scope-not-adjustable',
      },
    ),
  'REQ-18': () =>
    refusedFor('super_admin', 'request.approve', S.request({ status: 'information-requested' }), {
      kind: 'policy-open',
      decision: 'T-03',
    }),
  'REQ-20': () => absent(/declin/i),
  'REQ-21': () => {
    absent(/markPaid|recordPayment|activateManual|manualActivat/i);
    const pending = request({
      status: 'payment-not-confirmed',
      payments: [PENDING],
      route: 'external',
    });
    expect(
      refusalOf(
        reportPaymentOutcome({
          request: pending,
          outcome: 'confirmed',
          institution: institution(),
          plans: [],
          actor: who.superAdmin as never,
          now: T.oct14,
          ids: counterIds(),
        }),
      ),
    ).toEqual(WRONG);
  },
  'REQ-23': () =>
    refusedFor(
      'super_admin',
      'request.approve',
      S.request({ institutionId: ids.godavari }, PAUSED()),
      { kind: 'refused', code: 'institution-paused' },
    ),
  'REQ-24': () =>
    refusedFor(
      'super_admin',
      'request.set-route',
      S.request({ institutionId: ids.godavari }, institution()),
      { kind: 'refused', code: 'route-locked' },
    ),
  'REQ-29': () => {
    const renewal = expectOk(
      submitRenewalRequest({
        institution: institution(),
        plan: plan(),
        message: null,
        actor: who.instituteAdmin,
        now: T.sep2027,
        ids: counterIds(),
      }),
    ).request;
    expect(renewal).toMatchObject({
      items: plan().items,
      licencesRequested: 120,
      term: { kind: 'yearly' },
    });
  },
  'REQ-30': () =>
    expect(
      refusalOf(
        submitAdditionalLicencesRequest({
          institution: institution(),
          plan: plan(),
          experimentIds: [ids.wallA],
          licences: 10,
          message: null,
          actor: who.instituteAdmin,
          now: T.oct14,
          ids: counterIds(),
        }),
      ),
    ).toEqual({
      kind: 'validation-failed',
      issues: [{ field: 'experimentIds', rule: 'not-in-plan' }],
    }),
  'REQ-27': () => {
    const others = [
      'student',
      'faculty',
      'vendor',
      'academic_reviewer',
      'content_manager',
    ] as const;
    deniedTo(others, 'request.submit-renewal', S.plan());
    deniedTo(others, 'request.submit-additional-licences', S.plan());
  },
  'INST-02': () => absent(/createInstitution|newInstitution|institution\.create/i),
  'INST-05': () =>
    refusedFor(
      'super_admin',
      'institution.assign-institute-admin',
      S.institution(institution({ instituteAdmin: null }), []),
      { kind: 'refused', code: 'access-not-active' },
    ),
  'INST-09': () => {
    refusedFor('super_admin', 'institution.pause', S.institution(institution(), []), {
      kind: 'invalid-state',
      current: 'approved-payment-required',
    });
    refusedFor(
      'super_admin',
      'institution.pause',
      S.institution(),
      { kind: 'invalid-state', current: 'access-ended' },
      T.oct2027,
    );
  },
  'INST-10': () => absent(/terminate|deleteInstitution|removeInstitution|institution\.delete/i),
  'INST-12': () => {
    const paused = { kind: 'refused', code: 'institution-paused' };
    refusedFor('tenant_admin', 'access.give-to-students', S.plan(PAUSED()), paused);
    refusedFor(
      'tenant_admin',
      'access.withdraw-individual',
      S.grant({ institution: PAUSED() }),
      paused,
    );
    refusedFor('tenant_admin', 'institution-course-code.set', S.courseCode(PAUSED()), paused);
    refusedFor(
      'tenant_admin',
      'device-transfer.forward',
      S.device(transfer('with-institute-admin'), PAUSED()),
      paused,
    );
  },
  'INST-13': () => {
    const paused = { kind: 'refused', code: 'institution-paused' };
    for (const action of [
      'person.add-student',
      'person.import-students',
      'person.add-faculty',
      'group.create',
      'faculty-course.assign',
    ] as const) {
      refusedFor('tenant_admin', action, S.institution(PAUSED()), paused);
    }
    for (const action of ['group.rename', 'group.add-members', 'group.remove-member'] as const)
      refusedFor('tenant_admin', action, S.group(PAUSED()), paused);
    refusedFor('tenant_admin', 'person.deactivate-student', S.person(student(), PAUSED()), paused);
    refusedFor(
      'tenant_admin',
      'person.reactivate-student',
      S.person(INACTIVE_STUDENT(), PAUSED()),
      paused,
    );
    refusedFor('tenant_admin', 'faculty-course.remove', S.facultyCourse(PAUSED()), paused);
    refusedFor('tenant_admin', 'request.submit-renewal', S.plan(PAUSED()), paused);
    refusedFor('tenant_admin', 'request.submit-additional-licences', S.plan(PAUSED()), paused);
  },
  'INST-14': () => {
    // Faculty: the banner only (OD-B7-07) — no Faculty rule reads the pause.
    expect(shellBanner({ role: 'faculty', institution: PAUSED(), accountStatus: 'active' })).toBe(
      'institution-paused',
    );
    expect(may(ctx('faculty'), 'question.add', S.bank()).allowed).toBe(true);
    expect(may(ctx('faculty', T.nov7), 'marking.save-mark', S.attempt(SUBMITTED())).allowed).toBe(
      true,
    );
  },
  'INST-16': () => absent(/sso|signInSetup|institutionSettings|configure/i),
  'ACC-03': () => absent(/amend|editPlan|updatePlan|changePlan|plan\.edit/i),
  'ACC-07': () => {
    absent(/remind|notif|sendEmail/i);
    expect(
      accessEndingRows({
        plans: [plan({ endsOn: calendarDate('2026-10-31') })],
        requests: [],
        now: T.oct23,
      })[0]!.standing,
    ).toEqual({ kind: 'reminder-due' });
  },
  'ACC-08': () => {
    absent(/remaining|licen[cs]es?(Used|Left|Remaining|Available|InUse)|consum|allocat/i);
    expect(expectOk(giveAccess({ ...GIVE, ids: counterIds() })).plan.licences).toBe(120);
  },
  'SACC-03': () => {
    expect(
      Object.keys(expectOk(giveAccess({ ...GIVE, ids: counterIds() })).grants[0]!),
    ).not.toContain('formats');
    deniedTo(['student'], 'access.give-to-students', S.plan());
  },
  'SACC-04': () =>
    expect(
      refusalOf(giveAccess({ ...GIVE, experimentIds: [ids.wallA], ids: counterIds() })),
    ).toEqual({ kind: 'refused', code: 'experiment-not-in-plan' }),
  'SACC-05': () => {
    refusedFor('tenant_admin', 'access.give-to-students', S.plan(PAUSED()), {
      kind: 'refused',
      code: 'institution-paused',
    });
    refusedFor(
      'tenant_admin',
      'access.give-to-students',
      S.plan(),
      { kind: 'refused', code: 'plan-ended' },
      T.oct2027,
    );
    expect(refusalOf(giveAccess({ ...GIVE, plan: null, ids: counterIds() }))).toEqual({
      kind: 'refused',
      code: 'nothing-held',
    });
  },
  'SACC-06': () => {
    expect(
      refusalOf(
        giveAccess({
          ...GIVE,
          target: { kind: 'students', students: [INACTIVE_STUDENT()] },
          ids: counterIds(),
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'student-inactive' });
    expect(refusalOf(giveAccess({ ...GIVE, grants: [grant()], ids: counterIds() }))).toEqual({
      kind: 'refused',
      code: 'already-given',
    });
  },
  'SACC-09': () =>
    refusedFor('tenant_admin', 'access.withdraw-individual', S.grant({ institution: PAUSED() }), {
      kind: 'refused',
      code: 'institution-paused',
    }),
  'SACC-10': () =>
    refusedFor(
      'tenant_admin',
      'access.withdraw-individual',
      S.grant({ student: INACTIVE_STUDENT() }),
      { kind: 'refused', code: 'student-inactive' },
    ),
  'SACC-11': () =>
    refusedFor(
      'tenant_admin',
      'access.withdraw-individual',
      S.grant(),
      { kind: 'policy-open', decision: 'SACC-11' },
      T.oct2027,
    ),
  'SACC-13': () => {
    expect(experimentGate(gateInput({ grants: [] }))).toEqual(NOT_GIVEN);
    refusedFor('student', 'web.launch', S.learning({ grants: [] }), {
      kind: 'refused',
      code: 'not-given',
    });
  },
  'SACC-17': () => {
    deniedTo(OTHER_STAFF, 'access.give-to-students', S.plan());
    deniedTo(OTHER_STAFF, 'access.give-to-group', S.plan());
    deniedTo(OTHER_STAFF, 'access.withdraw-individual', S.grant());
  },
  'SACC-18': () => {
    const published = expectOk(
      publish({
        submission: submission(STATUS.withCm),
        experimentId: ids.wallB,
        actor: who.contentManager,
        now: T.oct14,
        ids: counterIds(),
      }),
    );
    expect(Object.keys(published).sort()).toEqual(['experiment', 'submission']);
    const exp = experiment({ openUpdateId: ids.upd5 });
    const released = expectOk(
      releaseUpdate({
        update: update('awaiting-release-decision', {}, exp),
        experiment: exp,
        actor: who.superAdmin,
        now: T.oct20,
        ids: counterIds(),
      }),
    );
    expect(Object.keys(released).sort()).toEqual(['experiment', 'update']);
  },
  'GRP-06': () => absent(/deleteGroup|removeGroup|group\.delete/i),
  'GRP-07': () =>
    expect(
      Object.keys(
        expectOk(
          createGroup({
            institution: institution(),
            groups: [],
            name: 'ME ZG523 — Sem II',
            actor: who.instituteAdmin,
            now: T.oct14,
            ids: counterIds(),
          }),
        ),
      ),
    ).not.toContain('description'),
  'PER-04': () => absent(/importFaculty|import-faculty/i),
  'PER-09': () => absent(/deletePerson|removePerson|deleteStudent|deleteFaculty|person\.delete/i),
  'PER-10': () => absent(/invit|activationEmail|sendEmail|activateAccount/i),
  'PER-12': () => {
    refusedFor('super_admin', 'person.override-student-status', S.person(faculty()), {
      kind: 'not-permitted',
      why: 'out-of-scope',
    });
    for (const action of [
      'person.add-student',
      'person.import-students',
      'person.add-faculty',
    ] as const)
      deniedTo(['super_admin'], action, S.institution());
  },
  'PER-15': () => absent(/message|remind|notif/i),
  'PER-16': () =>
    expect(canRead(ctx('tenant_admin'), learningTarget())).toEqual({
      visible: false,
      refusal: WRONG,
    }),
  'PER-17': () => absent(/profile|editOwn/i),
  'FCM-03': () => {
    deniedTo(['faculty'], 'faculty-course.assign', S.institution());
    deniedTo(['faculty'], 'faculty-course.remove', S.facultyCourse());
  },
  'FCM-06': () => {
    const assigned = expectOk(
      assignFacultyCourse({
        institution: institution(),
        mappings: [],
        faculty: faculty(),
        courseId: ids.course,
        coursesInAccess: [ids.course],
        actor: who.instituteAdmin,
        now: T.oct14,
        ids: counterIds(),
      }),
    );
    expect(Object.keys(assigned)).not.toEqual(expect.arrayContaining(['experimentId']));
    expect(Object.keys(assigned)).not.toContain('accessPlanId');
  },
  'CC-02': () =>
    refusedFor('tenant_admin', 'institution-course-code.set', S.courseCode(PAUSED()), {
      kind: 'refused',
      code: 'institution-paused',
    }),
  'CC-03': () => deniedTo(['tenant_admin'], 'platform-course-code.save', S.structure()),
  'CC-07': () => deniedTo(['super_admin'], 'platform-course-code.save', S.structure()),
  'CC-08': () =>
    deniedTo(['content_manager', 'super_admin'], 'institution-course-code.set', S.courseCode()),
  'RUN-02': () => {
    absent(/markAsDone|markDone/i);
    const opened = expectOk(
      openResource({
        existing: null,
        studentId: ids.rahul,
        resourceId: unsafeBrand('res-1'),
        experiment: experiment(),
        gate: OPEN,
        now: T.oct12,
      }),
    );
    expect(Object.keys(opened)).toEqual(['opened', 'href']);
    expect(formatProgress({ activity: null, completion: null })).toBe('not-started');
  },
  'RUN-05': () => {
    expect(
      refusalOf(launchWebFormat({ experiment: experiment({}, ['vr']), webGate: OPEN })),
    ).toEqual({
      kind: 'refused',
      code: 'format-not-published',
    });
    expect(ACTION_IDS.filter((id) => /^(ar|vr|mr)\.|launch-(ar|vr|mr)/.test(id))).toEqual([]);
  },
  'RUN-06': () => {
    expect(
      canOpenFormat({
        ...gateInput({ experiment: experiment({}, ['web', 'ar', 'vr']) }),
        format: 'ar',
      }),
    ).toEqual({ canOpen: false, reason: 'format-not-in-plan' });
    expect(canOpenFormat({ ...gateInput({ grants: [] }), format: 'web' })).toEqual(NOT_GIVEN);
    // Through the policy: WEB published but not in the plan is never launched.
    const vrOnly = { plans: [plan({ items: [{ experimentId: ids.shell, formats: ['vr'] }] })] };
    refusedFor('student', 'web.launch', S.learning(vrOnly), {
      kind: 'refused',
      code: 'format-not-in-plan',
    });
    refusedFor('student', 'web.continue', S.learning(vrOnly, WEB_ACTIVITY), {
      kind: 'refused',
      code: 'format-not-in-plan',
    });
    // The experiment itself is given: its resources still open.
    expect(may(ctx('student'), 'resource.open', S.learning(vrOnly)).allowed).toBe(true);
  },
  'RUN-07': () => {
    const blocked = [
      [gateInput({ institution: PAUSED() }), 'institution-paused'],
      [
        gateInput({ waits: [{ grantId: ids.sacc310, studentId: ids.rahul, since: T.oct9 }] }),
        'waiting-for-a-licence',
      ],
      [gateInput({ now: T.oct2027 }), 'access-ended'],
      [gateInput({ student: INACTIVE_STUDENT() }), 'student-inactive'],
    ] as const;
    for (const [input, reason] of blocked)
      expect(canOpenFormat({ ...input, format: 'web' })).toEqual({ canOpen: false, reason });
    refusedFor('student', 'web.launch', S.learning({ institution: PAUSED() }), {
      kind: 'refused',
      code: 'institution-paused',
    });
  },
  'RUN-10': () => absent(/percent|rollUp|verdict|overall|experimentProgress|courseProgress/i),
  'RUN-13': () => absent(/exportUsage|usage\.export|chart|inUse/i),
  'RUN-15': () => {
    expect(Object.keys(attempt()).join(' ')).not.toMatch(
      /duration|seconds|timeSpent|technology|format/i,
    );
    expect(Object.keys(WEB_ACTIVITY).join(' ')).not.toMatch(/duration|seconds|timeSpent/i);
  },
  'CMP-02': () => {
    expect(
      refusalOf(
        reportCompletion({
          existing: null,
          report: {
            studentId: ids.rahul,
            experimentId: ids.shell,
            format: 'web',
            at: T.oct14,
            from: 'simulation',
          },
          actor: who.student as never,
        }),
      ),
    ).toEqual(WRONG);
    expect(ACTION_IDS.filter((id) => /complet|finish/i.test(id))).toEqual([]);
  },
  'CMP-03': () => {
    const acceptsEverything: CompletionPolicy = {
      id: 'test-everything',
      status: 'provisional',
      isCompletion: () => true,
    };
    const launchOnly: RuntimeEventRecord[] = [
      {
        type: 'SIMULATION_LAUNCHED',
        sessionId: 'S1',
        technology: 'web',
        occurredAt: '2026-10-14T09:00:00.000Z',
        seq: 1,
      },
      {
        type: 'SESSION_STARTED',
        sessionId: 'S1',
        technology: 'web',
        occurredAt: '2026-10-14T09:00:05.000Z',
        seq: 2,
      },
      {
        type: 'SESSION_ENDED',
        sessionId: 'S1',
        technology: 'web',
        occurredAt: '2026-10-14T15:00:00.000Z',
        seq: 3,
      },
    ];
    expect(
      completionFromRuntimeEvents({
        studentId: ids.rahul,
        experimentId: ids.shell,
        format: 'web',
        events: launchOnly,
        policy: acceptsEverything,
        existing: null,
      }),
    ).toBeNull();
    expect(formatProgress({ activity: WEB_ACTIVITY, completion: null })).toBe('in-progress');
    expect(
      formatProgressView({
        experimentId: ids.shell,
        format: 'web',
        activity: WEB_ACTIVITY,
        completion: null,
        feedback: 'not-offered',
        paused: false,
      }).status,
    ).toBe('in-progress');
  },
  'CMP-04': () => {
    for (const role of [
      'faculty',
      'tenant_admin',
      'super_admin',
      'content_manager',
      'academic_reviewer',
      'vendor',
    ] as const) {
      expect(
        refusalOf(
          reportCompletion({
            existing: null,
            report: {
              studentId: ids.rahul,
              experimentId: ids.shell,
              format: 'web',
              at: T.oct14,
              from: 'simulation',
            },
            actor: PERSON[role] as never,
          }),
        ),
      ).toEqual(WRONG);
    }
    expect(ACTION_IDS.filter((id) => /complet/i.test(id))).toEqual([]);
  },
  'CMP-05': () => {
    absent(/restart|demo|sampleControl|completedRun/i);
    expect(ACTION_IDS.filter((id) => /sample|restart|report-completed/i.test(id))).toEqual([]);
  },
  'FB-03': () => {
    refusedFor('student', 'feedback.send', S.feedback(COMPLETED_WEB, SENT_FEEDBACK), {
      kind: 'conflict',
      code: 'already-sent',
    });
    absent(/editFeedback|resubmitFeedback/i);
  },
  'FB-04': () => {
    refusedFor('student', 'feedback.open-form', S.feedback(null), {
      kind: 'refused',
      code: 'format-not-completed',
    });
    refusedFor('student', 'feedback.open-form', S.feedback(COMPLETED_WEB, null, { grants: [] }), {
      kind: 'refused',
      code: 'not-given',
    });
  },
  'FB-06': () => {
    for (const role of [
      'faculty',
      'tenant_admin',
      'super_admin',
      'content_manager',
      'academic_reviewer',
    ] as const)
      expect(visible(role, { kind: 'feedback', feedback: SENT_FEEDBACK })).toBe(false);
  },
  'ASMT-03': () =>
    refusedFor('faculty', 'assessment.create', S.assessment(assessment()), {
      kind: 'refused',
      code: 'assessment-exists',
    }),
  'ASMT-07': () =>
    absent(/makeAvailable|closeAssessment|openAssessment|assessment\.(open|close|make-available)/i),
  'ASMT-08': () => {
    absent(/deleteAssessment|archive|assessment\.delete/i);
    const changed = expectOk(
      changeAssessment({
        assessment: assessment(),
        name: 'Renamed',
        introduction: null,
        rules: assessment().rules,
        questions: assessment().questions,
        hasSubmissions: false,
        actor: who.faculty,
        now: T.oct20,
        ids: counterIds(),
      }),
    );
    expect(changed.experimentId).toBe(ids.shell);
  },
  'ASMT-09': () =>
    expect(Object.keys(NO_RULES).sort()).toEqual([
      'attemptsAllowed',
      'deadline',
      'passMarkPercent',
      'release',
    ]),
  'ASMT-11': () => {
    expect(Object.values(NO_RULES).every((value) => value === null)).toBe(true);
    absent(/default(Rules|Settings)|universal|platformDefault/i);
  },
  'ASMT-12': () => {
    const others = [
      'super_admin',
      'tenant_admin',
      'content_manager',
      'academic_reviewer',
      'vendor',
      'student',
    ] as const;
    deniedTo(others, 'assessment.create', S.assessment());
    deniedTo(others, 'assessment.save-draft', S.assessment());
    deniedTo(others, 'assessment.edit-settings', S.assessment(assessment()));
    deniedTo(others, 'assessment.edit-questions', S.assessment(assessment()));
  },
  'ASMT-14': () => {
    const draft = assessment({ rules: NO_RULES });
    expect(
      assessmentForStudent({
        assessment: draft,
        hasExperiment: true,
        gate: OPEN,
        attempts: [],
        questions: QUESTIONS,
        now: T.nov20,
      }),
    ).toEqual({ visible: false });
    expect(visible('student', { kind: 'assessment', assessment: draft })).toBe(false);
    refusedFor(
      'student',
      'attempt.start',
      S.attempt(null, [], {}, draft),
      { kind: 'invalid-state', current: 'draft-not-ready' },
      T.nov5,
    );
  },
  'Q-06': () => {
    expect(DRAFT.marks).toBeNull();
    expect(
      refusalOf(
        addDraftToBank({
          draft: DRAFT,
          institutionId: ids.godavari,
          taughtExperiments: [ids.shell],
          content: { text: DRAFT.text, body: DRAFT.body, marks: DRAFT.marks, explanation: null },
          actor: who.faculty,
          now: T.oct20,
          ids: counterIds(),
        }),
      ),
    ).toMatchObject({ kind: 'validation-failed' });
    absent(/autoAdd|autoBank/i);
  },
  'Q-08': () =>
    expect(canRead(ctx('student'), { kind: 'question', question: QUESTIONS[1]! })).toEqual({
      visible: false,
      refusal: WRONG,
    }),
  'Q-09': () => {
    expect(visible('student', { kind: 'question', question: QUESTIONS[0]! })).toBe(false);
    expect(
      resultView({
        attempt: attempt(),
        assessment: assessment(),
        questions: QUESTIONS,
        now: T.nov5,
      }),
    ).toEqual({ kind: 'in-progress' });
  },
  'ATT-04': () => {
    refusedFor(
      'student',
      'attempt.answer',
      S.attempt(SUBMITTED()),
      { kind: 'invalid-state', current: 'submitted' },
      T.nov7,
    );
    absent(/autoSubmit|countdown|timer/i);
  },
  'ATT-06': () =>
    refusedFor(
      'student',
      'attempt.try-again',
      S.attempt(null, [MARKED(7)]),
      { kind: 'refused', code: 'already-passed' },
      T.nov20,
    ),
  'ATT-21': () =>
    expect(
      refusalOf(
        saveMark({
          attempt: SUBMITTED(),
          assessment: assessment(),
          questions: QUESTIONS,
          questionId: ids.q102,
          mark: 7.5,
          feedback: null,
          actor: who.faculty,
          now: T.nov7,
        }),
      ),
    ).toEqual({
      kind: 'validation-failed',
      issues: [{ field: 'mark', rule: 'whole-number-0-to-marks' }],
    }),
  'ATT-10': () =>
    refusedFor(
      'faculty',
      'marking.save-mark',
      S.attempt(MARKED(7)),
      { kind: 'refused', code: 'marks-confirmed' },
      T.nov20,
    ),
  'ATT-11': () => {
    absent(/suggest|autoReview|autoMark/i);
    expect(
      refusalOf(
        applyObjectiveMarks({
          attempt: SUBMITTED(),
          assessment: assessment(),
          questions: QUESTIONS,
          supplied: [{ questionId: ids.q102, awarded: 5 }],
          actor: system('system:objective-marks'),
          now: T.nov7,
        }),
      ),
    ).toEqual({
      kind: 'validation-failed',
      issues: [{ field: ids.q102, rule: 'not-a-choice-question' }],
    });
  },
  'ATT-12': () => {
    const others = ['tenant_admin', 'academic_reviewer', 'content_manager', 'super_admin'] as const;
    deniedTo(others, 'marking.save-mark', S.attempt(SUBMITTED()), T.nov7);
    deniedTo(others, 'marking.confirm', S.attempt(SUBMITTED_WITH_MARK()), T.nov7);
  },
  'ATT-14': () => {
    absent(/releaseResult|result\.release/i);
    expect(ATTEMPT_TRANSITIONS.map((row) => row.command).join(' ')).not.toMatch(/release/i);
  },
  'ATT-15': () =>
    expect(
      resultView({
        attempt: MARKED(7),
        assessment: assessment(),
        questions: QUESTIONS,
        now: T.nov7,
      }),
    ).toEqual({ kind: 'not-released-yet', releaseRule: 'after-deadline' }),
  'ATT-19': () =>
    expect(
      resultView({
        attempt: SUBMITTED(),
        assessment: assessment(),
        questions: QUESTIONS,
        now: T.nov20,
      }),
    ).toEqual({ kind: 'waiting-for-marking' }),
  'ATT-20': () => absent(/reportsPage|^reports\./i),
  'DTR-02': () =>
    refusedFor(
      'student',
      'device-transfer.request',
      S.device(null, institution(), [transfer('with-institute-admin')]),
      { kind: 'refused', code: 'transfer-already-open' },
    ),
  'DTR-03': () =>
    refusedFor('student', 'device-transfer.request', S.device(null, PAUSED()), {
      kind: 'refused',
      code: 'institution-paused',
    }),
  'DTR-04': () => {
    absent(/cancel|withdrawTransfer|device-transfer\.withdraw/i);
    expect(DEVICE_TRANSFER_TRANSITIONS.map((row) => row.command).join(' ')).not.toMatch(
      /cancel|withdraw/i,
    );
  },
  'DTR-05': () => {
    expect(hasMyDevice([])).toBe(false);
    refusedFor(
      'student',
      'device-transfer.request',
      { ...S.device(), devices: [] },
      { kind: 'refused', code: 'no-authorised-device' },
    );
  },
  'DTR-07': () => {
    deniedTo(['tenant_admin'], 'device-transfer.approve', S.device(transfer('forwarded')));
    absent(/declin/i);
  },
  'DTR-08': () =>
    refusedFor(
      'tenant_admin',
      'device-transfer.forward',
      S.device(transfer('with-institute-admin'), PAUSED()),
      { kind: 'refused', code: 'institution-paused' },
    ),
  'DTR-11': () => absent(/declin/i),
  'DTR-12': () =>
    refusedFor(
      'super_admin',
      'device-transfer.approve',
      S.device(transfer('with-institute-admin')),
      { kind: 'refused', code: 'not-yet-forwarded' },
    ),
  'DTR-13': () => {
    expect(
      DEVICE_TRANSFER_TRANSITIONS.filter((row) => row.from === null).map((row) => row.to),
    ).toEqual(['with-institute-admin']);
    deniedTo(['student'], 'device-transfer.forward', S.device(transfer('with-institute-admin')));
    deniedTo(['student'], 'device-transfer.approve', S.device(transfer('forwarded')));
  },
  'DTR-14': () => {
    const others = ['faculty', 'vendor', 'academic_reviewer', 'content_manager'] as const;
    deniedTo(others, 'device-transfer.request', S.device());
    deniedTo(others, 'device-transfer.forward', S.device(transfer('with-institute-admin')));
    deniedTo(others, 'device-transfer.approve', S.device(transfer('forwarded')));
  },
  'SUB-06': () => {
    const underReview = S.submission(submission(STATUS.withReviewer));
    refusedFor('vendor', 'submission.save-draft', underReview, {
      kind: 'invalid-state',
      current: 'with-academic-reviewer',
    });
    refusedFor('vendor', 'submission.submit-for-review', underReview, {
      kind: 'invalid-state',
      current: 'with-academic-reviewer',
    });
    absent(/recall|withdrawSubmission/i);
  },
  'SUB-11': () =>
    refusedFor(
      'vendor',
      'submission.save-draft',
      S.submission(submission(STATUS.draft)),
      { kind: 'refused', code: 'course-not-assigned' },
      T.oct14,
      { holder: holder('vendor', [{ kind: 'course', courseId: ids.course2 }]) },
    ),
  'SUB-12': () =>
    deniedTo(['vendor'], 'submission.publish', S.submission(submission(STATUS.withCm))),
  'SUB-13': () => absent(/deleteDraft|duplicate|submission\.delete/i),
  'SUB-16': () => {
    for (const role of ['academic_reviewer', 'content_manager', 'super_admin'] as const) {
      expect(
        canRead(ctx(role), { kind: 'submission', submission: submission(STATUS.draft) }),
      ).toEqual({ visible: false, refusal: WRONG });
    }
  },
  'SUB-19': () =>
    refusedFor('academic_reviewer', 'submission.approve', S.submission(submission(STATUS.withCm)), {
      kind: 'invalid-state',
      current: 'with-content-manager',
    }),
  'SUB-20': () => absent(/reject|partial|perFormat|rubric|deviceTest/i),
  'SUB-21': () =>
    deniedTo(['academic_reviewer'], 'submission.publish', S.submission(submission(STATUS.withCm))),
  'SUB-25': () =>
    refusedFor(
      'content_manager',
      'submission.publish',
      S.submission(submission(STATUS.withCm, { revision: 2 })),
      { kind: 'refused', code: 'publication-blocked' },
    ),
  'SUB-28': () => {
    deniedTo(
      ['content_manager'],
      'submission.approve',
      S.submission(submission(STATUS.withReviewer)),
    );
    deniedTo(
      ['content_manager'],
      'learning-outcomes.edit',
      S.submission(submission(STATUS.withReviewer)),
    );
    refusedFor(
      'content_manager',
      'submission.publish',
      S.submission(submission(STATUS.withReviewer)),
      { kind: 'invalid-state', current: 'with-academic-reviewer' },
    );
  },
  'SUB-29': () => {
    absent(/holdBack|partialPublish/i);
    const out = expectOk(
      publish({
        submission: submission(STATUS.withCm),
        experimentId: ids.wallB,
        actor: who.contentManager,
        now: T.oct14,
        ids: counterIds(),
      }),
    );
    expect(out.experiment.live.formats.map((entry) => entry.format)).toEqual(['web', 'vr']);
  },
  'SUB-30': () => {
    const out = expectOk(
      publish({
        submission: submission(STATUS.withCm),
        experimentId: ids.wallB,
        actor: who.contentManager,
        now: T.oct14,
        ids: counterIds(),
      }),
    );
    expect(Object.keys(out).sort()).toEqual(['experiment', 'submission']);
  },
  'SUB-31': () => {
    absent(/editDelivery/i);
    const out = expectOk(
      publish({
        submission: submission(STATUS.withCm),
        experimentId: ids.wallB,
        actor: who.contentManager,
        now: T.oct14,
        ids: counterIds(),
      }),
    );
    expect(out.experiment.live.formats[0]!.delivery).toMatchObject({
      webLink: 'https://sim.example.org/wall',
    });
  },
  'SUB-32': () =>
    deniedTo(['super_admin'], 'submission.publish', S.submission(submission(STATUS.withCm))),
  'SUB-34': () => {
    refusedFor(
      'super_admin',
      'submission.override-status',
      S.submission(submission(STATUS.published), []),
      { kind: 'invalid-state', current: 'published' },
    );
    refusedFor(
      'super_admin',
      'submission.override-status',
      S.submission(submission(STATUS.withReviewer), [holder('academic_reviewer')]),
      { kind: 'refused', code: 'override-not-stuck' },
    );
  },
  'SUB-36': () =>
    deniedTo(
      ['super_admin'],
      'submission.send-back-to-vendor',
      S.submission(submission(STATUS.withCm)),
    ),
  'LO-02': () =>
    deniedTo(['vendor'], 'learning-outcomes.edit', S.submission(submission(STATUS.withReviewer))),
  'LO-03': () =>
    deniedTo(
      ['content_manager', 'super_admin', 'faculty'],
      'learning-outcomes.edit',
      S.submission(submission(STATUS.withReviewer)),
    ),
  'LO-05': () => {
    // The reviewer's working set travels with the decision; nothing is stored before it.
    expect(submission(STATUS.withReviewer).learningOutcomes).toEqual([]);
    const outcomes = [
      { id: unsafeBrand<domain.LearningOutcomeId>('lo-9'), text: 'Explain conduction.' },
    ];
    const returned = expectOk(
      returnSubmission({
        submission: submission(STATUS.withReviewer),
        outcomes,
        reason: 'Fix the link',
        references: [],
        actor: who.reviewer,
        now: T.oct14,
        ids: counterIds(),
      }),
    );
    expect(returned.learningOutcomes).toEqual(outcomes);
  },
  'LO-06': () => {
    expect(Object.keys(liveFields(experiment())).sort()).toEqual([
      'description',
      'name',
      'packageReferences',
      'summary',
      'webLink',
    ]);
    const exp = experiment({ openUpdateId: ids.upd5 });
    const out = expectOk(
      releaseUpdate({
        update: update('awaiting-release-decision', {}, exp),
        experiment: exp,
        actor: who.superAdmin,
        now: T.oct20,
        ids: counterIds(),
      }),
    );
    expect(out.experiment.learningOutcomes).toBe(exp.learningOutcomes);
  },
  'EXP-02': () =>
    expect(
      canRead(publicContext(), { kind: 'published-experiment', experiment: null }).visible,
    ).toBe(false),
  'EXP-05': () => {
    deniedTo(['faculty'], 'correction.open', S.experiment());
    deniedTo(['faculty'], 'correction.save', S.update('draft'));
    deniedTo(['faculty'], 'learning-outcomes.edit', S.submission(submission(STATUS.withReviewer)));
  },
  'EXP-06': () => {
    absent(/editLive|safeEdit|directEdit/i);
    expect(
      UPDATE_TRANSITIONS.some(
        (row) =>
          row.from === 'draft' && (row.to === 'released' || row.to === 'awaiting-release-decision'),
      ),
    ).toBe(false);
  },
  'EXP-07': () => {
    deniedTo(['super_admin'], 'correction.open', S.experiment());
    deniedTo(['super_admin'], 'correction.save', S.update('draft'));
  },
  'EXP-08': () => {
    deniedTo(['vendor'], 'correction.open', S.experiment());
    refusedFor('vendor', 'submission.save-draft', S.submission(submission(STATUS.published)), {
      kind: 'invalid-state',
      current: 'published',
    });
  },
  'EXP-09': () => {
    deniedTo(['academic_reviewer'], 'correction.open', S.experiment());
    deniedTo(['academic_reviewer'], 'correction.save', S.update('in-academic-review'));
  },
  'EXP-11': () => {
    absent(/merge|dedup|duplicateContent/i);
    expect(
      publicCatalogue([WALL_A, WALL_B], [course()]).map((entry) => entry.experimentId),
    ).toEqual([ids.wallA, ids.wallB]);
  },
  'EXP-12': () => {
    absent(/unpublish|retire/i);
    expect(SUBMISSION_TRANSITIONS.some((row) => row.from === 'published')).toBe(false);
  },
  'UPD-03': () => {
    refusedFor('content_manager', 'correction.open', S.experiment(update('in-academic-review')), {
      kind: 'refused',
      code: 'update-already-open',
    });
    refusedFor('content_manager', 'correction.join', S.experiment(update('on-hold')), {
      kind: 'invalid-state',
      current: 'on-hold',
    });
  },
  'UPD-06': () => {
    expect(
      UPDATE_TRANSITIONS.filter(
        (row) => row.to === 'awaiting-release-decision' && row.command !== 'liftHold',
      ).map((row) => row.from),
    ).toEqual(['in-academic-review']);
    deniedTo(['content_manager'], 'correction.release', S.update('awaiting-release-decision'));
  },
  'UPD-07': () => {
    expect(Object.keys(liveFields(experiment()))).not.toContain('formats');
    const exp = experiment({ openUpdateId: ids.upd5 });
    const out = expectOk(
      releaseUpdate({
        update: update('awaiting-release-decision', {}, exp),
        experiment: exp,
        actor: who.superAdmin,
        now: T.oct20,
        ids: counterIds(),
      }),
    );
    expect(out.experiment.live.formats.map((entry) => entry.format)).toEqual(['web', 'vr']);
  },
  'UPD-09': () => {
    refusedFor('content_manager', 'correction.withdraw', S.update('awaiting-release-decision'), {
      kind: 'invalid-state',
      current: 'awaiting-release-decision',
    });
    refusedFor('content_manager', 'correction.save', S.update('awaiting-release-decision'), {
      kind: 'invalid-state',
      current: 'awaiting-release-decision',
    });
  },
  'UPD-10': () => {
    deniedTo(['content_manager'], 'correction.release', S.update('awaiting-release-decision'));
    deniedTo(['content_manager'], 'correction.hold', S.update('awaiting-release-decision'));
    expect(ACTION_IDS.filter((id) => id.startsWith('correction.') && /publish/.test(id))).toEqual(
      [],
    );
  },
  'UPD-12': () => deniedTo(['vendor'], 'correction.open', S.experiment()),
  'UPD-15': () => {
    for (const action of ['correction.save', 'correction.release', 'correction.hold'] as const)
      deniedTo(['academic_reviewer'], action, S.update('awaiting-release-decision'));
  },
  'UPD-16': () => {
    expect(
      visible('academic_reviewer', {
        kind: 'update',
        update: update('draft'),
        experiment: experiment(),
      }),
    ).toBe(false);
    expect(
      navCounts.reviewerQueue(
        [],
        [update('draft'), update('awaiting-release-decision')],
        () => true,
      ),
    ).toBe(0);
  },
  'UPD-18': () =>
    expect(
      visible('super_admin', {
        kind: 'update',
        update: update('in-academic-review'),
        experiment: experiment(),
      }),
    ).toBe(false),
  'UPD-23': () =>
    refusedFor('super_admin', 'correction.release', S.update('on-hold'), {
      kind: 'refused',
      code: 'hold-must-be-lifted',
    }),
  'UPD-24': () =>
    deniedTo(['super_admin'], 'correction.save', S.update('awaiting-release-decision')),
  'CRS-05': () => absent(/retire|artwork/i),
  'CRS-06': () => {
    const others = [
      'content_manager',
      'tenant_admin',
      'vendor',
      'academic_reviewer',
      'faculty',
    ] as const;
    for (const action of [
      'structure.add-area',
      'structure.add-course',
      'structure.rename',
      'structure.move-course',
    ] as const)
      deniedTo(others, action, S.structure());
    absent(/deleteCourse|deleteArea/i);
  },
  'CRS-07': () => {
    absent(/module|programmeLevel/i);
    expect(domain.RECORD_KINDS.join(' ')).not.toMatch(/MOD|PROG/);
    expect(Object.keys(course())).not.toEqual(expect.arrayContaining(['programme']));
  },
  'ROLE-05': () => absent(/invit|sso/i),
  'ROLE-06': () => absent(/deregister|removeHolder|platform-role\.remove/i),
  'ROLE-07': () =>
    expect(
      refusalOf(
        registerHolder({
          holders: [],
          role: 'tenant_admin' as never,
          name: 'Meera Iyer',
          workEmail: 'meera.iyer@godavari.edu.in',
          organisation: 'Godavari',
          personId: ids.meera,
          actor: who.superAdmin,
          now: T.oct14,
          ids: counterIds(),
        }),
      ),
    ).toEqual({
      kind: 'validation-failed',
      issues: [{ field: 'role', rule: 'platform-role-only' }],
    }),
  'ROLE-13': () => {
    absent(/switchRole|viewingAs|chooseWorkspace|impersonat/i);
    expect(roleOf(ctx('student').actor)).toBe('student');
  },
  'SUP-03': () => {
    deniedTo(
      ['student', 'faculty', 'tenant_admin', 'vendor', 'academic_reviewer', 'content_manager'],
      'support.resolve',
      S.report(report('open')),
    );
    refusedFor(
      'super_admin',
      'support.resolve',
      S.report(report('open', { reporter: SA_REPORT().reporter })),
      { kind: 'not-permitted', why: 'out-of-scope' },
    );
    absent(/editReport|deleteReport/i);
  },
  'SUP-08': () => deniedTo(['public'], 'support.report', S.report()),
  'SES-02': () => {
    for (const role of PEOPLE) {
      const foreign = ALL_RULES.find((rule) => !rule.actors.includes(role))!;
      const subject = ALLOW_SUBJECT.get(foreign.action as ActionId)!;
      expect(may(ctx(role), foreign.action as ActionId, subject())).toEqual({
        allowed: false,
        refusal: WRONG,
      });
    }
  },
  'SES-03': () => {
    // Shared actions only: Help & support and the session; every other rule belongs to one workspace,
    // except "Continue to payment", which the public requester and the Institute Admin share.
    const shared = ALL_RULES.filter((rule) => rule.actors.length > 1).map((rule) => rule.action);
    expect(shared).toEqual([
      'request.start-payment',
      'support.report',
      'session.sign-in',
      'session.sign-out',
    ]);
  },
  'SES-04': () => {
    expect(domain.SHELL_BANNERS).toEqual(['institution-paused', 'account-inactive']);
    absent(/demo|chooser|selectAccount/i);
  },
  'SES-10': () => absent(/switchRole|viewingAs|chooseWorkspace/i),
  'SES-05': () => absent(/password|reset|activateAccount/i),
  'XC-01': () => absent(/notif|sendMessage|remind/i),
  'XC-02': () => absent(/kpi|revenue|dashboard/i),
  'XC-04': () => absent(/reportsPage|^reports\./i),
};

// ── READ: visibility and read models, one case per row ─────────────────────────────────────────

const READ_CASES: Readonly<Record<string, () => void>> = {
  'REQ-04': () => expect(visible('public', { kind: 'request', request: request() })).toBe(true),
  'REQ-05': () =>
    expect(canRead(publicContext([]), { kind: 'request', request: request() })).toEqual({
      visible: false,
      refusal: { kind: 'policy-open', decision: 'T-01' },
    }),
  'REQ-11': () =>
    expect(visible('super_admin', { kind: 'request', request: request() })).toBe(true),
  'REQ-28': () => {
    expect(
      visible('tenant_admin', {
        kind: 'request',
        request: request({ institutionId: ids.godavari }),
      }),
    ).toBe(true);
    expect(
      visible('tenant_admin', { kind: 'request', request: request({ institutionId: ids.konark }) }),
    ).toBe(false);
    expect(visible('tenant_admin', { kind: 'request', request: request() })).toBe(false);
  },
  'INST-03': () => {
    for (const kind of ['institution', 'access-plan', 'people', 'usage'] as const)
      expect(visible('super_admin', { kind, institutionId: ids.konark })).toBe(true);
  },
  'INST-11': () => {
    for (const role of ['tenant_admin', 'faculty', 'student'] as const) {
      expect(shellBanner({ role, institution: PAUSED(), accountStatus: 'active' })).toBe(
        'institution-paused',
      );
      expect(visible(role, { kind: 'institution', institutionId: ids.godavari })).toBe(true);
    }
  },
  'INST-15': () => {
    // Attribution is kept as the Super Admin's actor; the words ("BITS" for other readers) are copy.
    const outcome = expectOk(
      approveSmallerScope({
        request: request(),
        institution: null,
        route: 'external',
        items: [{ experimentId: ids.shell, formats: ['web'] }],
        licences: 100,
        term: { kind: 'yearly' },
        reason: 'Licences: 120 → 100',
        actor: who.superAdmin,
        now: T.oct8,
        ids: counterIds(),
      }),
    );
    expect(outcome.request.history.at(-1)).toMatchObject({
      actor: { kind: 'person', role: 'super_admin' },
      visibleTo: expect.arrayContaining(['tenant_admin']),
    });
  },
  'ACC-04': () => {
    expect(visible('tenant_admin', { kind: 'access-plan', institutionId: ids.godavari })).toBe(
      true,
    );
    expect(visible('tenant_admin', { kind: 'access-plan', institutionId: ids.konark })).toBe(false);
  },
  'ACC-05': () =>
    expect(iaContentAccess(plan(), [experiment()]).map((row) => row.item.experimentId)).toEqual([
      ids.shell,
    ]),
  'ACC-11': () => {
    expect(visible('super_admin', { kind: 'access-ending' })).toBe(true);
    expect(visible('tenant_admin', { kind: 'access-ending' })).toBe(false);
  },
  'ACC-09': () => {
    expect(
      NO_LICENCE_WAITS.waitFor({ planId: ids.plan, studentId: ids.rahul, experimentId: ids.shell }),
    ).toBeNull();
    const wait = { grantId: ids.sacc310, studentId: ids.rahul, since: T.oct9 };
    expect(
      grantDisplayStatus({
        grant: grant(),
        student: student(),
        plan: plan(),
        institution: institution(),
        waits: [wait],
        alsoInActiveGroupGrant: false,
        screen: 'student-access',
        now: T.oct14,
      }),
    ).toBe('waiting-for-a-licence');
    expect(experimentGate(gateInput({ waits: [wait] }))).toEqual({
      canOpen: false,
      reason: 'waiting-for-a-licence',
    });
  },
  'ACC-10': () => {
    expect(
      canOpenFormat({
        ...gateInput({ experiment: experiment({}, ['web', 'ar', 'vr']) }),
        format: 'ar',
      }),
    ).toEqual({ canOpen: false, reason: 'format-not-in-plan' });
    expect(canOpenFormat({ ...gateInput(), format: 'mr' })).toEqual({
      canOpen: false,
      reason: 'format-not-published',
    });
    expect(
      iaContentAccess(plan(), [experiment({}, ['web', 'ar', 'vr'])])[0]!.publishedNotInPlan,
    ).toEqual(['ar']);
  },
  'SACC-12': () => {
    expect(visible('student', learningTarget())).toBe(true);
    expect(canRead(ctx('student'), learningTarget({ grants: [] }))).toEqual({
      visible: false,
      refusal: { kind: 'refused', code: 'not-given' },
    });
    expect(canRead(ctx('student'), learningTarget({ student: student({ id: ids.arun }) }))).toEqual(
      { visible: false, refusal: { kind: 'not-permitted', why: 'not-own-record' } },
    );
  },
  'SACC-14': () => {
    const withdrawn = learningTarget({ grants: [grant({ state: 'withdrawn' })] });
    const ended = learningTarget({ plans: [plan({ endsOn: calendarDate('2026-10-13') })] });
    for (const target of [withdrawn, ended]) {
      expect(canRead(ctx('student'), target)).toEqual({
        visible: false,
        refusal: { kind: 'policy-open', decision: 'SACC-14' },
      });
    }
    // The drawn read-only states keep earlier work in view.
    expect(visible('student', learningTarget({ institution: PAUSED() }))).toBe(true);
  },
  'SACC-15': () => {
    expect(experimentGate(gateInput(OVERLAP))).toEqual({
      canOpen: false,
      reason: 'policy-open',
      decision: 'OD-B2-01',
    });
    expect(canRead(ctx('student'), learningTarget(OVERLAP))).toEqual({
      visible: false,
      refusal: { kind: 'policy-open', decision: 'OD-B2-01' },
    });
    // DV-1 through the policy: no can / can't statement, for opening a format or a resource.
    refusedFor('student', 'web.launch', S.learning(OVERLAP), {
      kind: 'policy-open',
      decision: 'OD-B2-01',
    });
    refusedFor('student', 'resource.open', S.learning(OVERLAP), {
      kind: 'policy-open',
      decision: 'OD-B2-01',
    });
  },
  'SACC-16': () => {
    const late = {
      grants: [GROUP_GRANT()],
      groups: [group([{ id: ids.rahul, addedAt: T.oct14 }])],
    };
    expect(experimentGate(gateInput(late))).toEqual({
      canOpen: false,
      reason: 'policy-open',
      decision: 'OD-B2-02',
    });
    expect(canRead(ctx('student'), learningTarget(late))).toEqual({
      visible: false,
      refusal: { kind: 'policy-open', decision: 'OD-B2-02' },
    });
    refusedFor('student', 'web.launch', S.learning(late), {
      kind: 'policy-open',
      decision: 'OD-B2-02',
    });
  },
  'SACC-19': () =>
    expect(
      visible('tenant_admin', { kind: 'student-access-list', institutionId: ids.godavari }),
    ).toBe(true),
  'SACC-20': () => {
    expect(visible('faculty', learningTarget())).toBe(true);
    expect(visible('faculty', learningTarget(), { taughtExperiments: [] })).toBe(false);
  },
  'GRP-08': () =>
    expect(visible('tenant_admin', { kind: 'groups', institutionId: ids.godavari })).toBe(true),
  'PER-13': () =>
    expect(
      shellBanner({ role: 'student', institution: institution(), accountStatus: 'inactive' }),
    ).toBe('account-inactive'),
  'PER-14': () => {
    expect(visible('faculty', learningTarget())).toBe(true);
    expect(inactiveDays(T.oct12, T.oct23)).toBe(11);
  },
  'PER-18': () => {
    expect(visible('tenant_admin', { kind: 'people', institutionId: ids.godavari })).toBe(true);
    expect(visible('tenant_admin', { kind: 'people', institutionId: ids.konark })).toBe(false);
  },
  'FCM-04': () =>
    expect(
      facultyScope({
        facultyId: ids.ranganathan,
        mappings: [mapping()],
        heldExperiments: [{ experimentId: ids.shell, courseId: ids.course }],
      }),
    ).toEqual({ courseIds: [ids.course], experimentIds: [ids.shell] }),
  'FCM-05': () =>
    expect(unmarkedAfterRemoval(mapping(), [mapping()], 1)).toEqual({
      waiting: 1,
      noOtherMarker: true,
    }),
  'CC-09': () => {
    expect(courseCodeFor('student', 'ME ZG523', 'MEC-523')).toBe('MEC-523');
    expect(courseCodeFor('student', 'ME ZG523', null)).toBe('ME ZG523');
    expect(courseCodeFor('public', 'ME ZG523', 'MEC-523')).toBe('ME ZG523');
    expect(courseCodeFor('faculty', null, 'MEC-523')).toBeNull();
  },
  'RUN-09': () => {
    expect(visible('student', learningTarget())).toBe(true);
    expect(formatProgress({ activity: WEB_ACTIVITY, completion: COMPLETED_WEB })).toBe('completed');
  },
  'RUN-11': () => expect(visible('faculty', learningTarget())).toBe(true),
  'RUN-12': () => {
    expect(visible('tenant_admin', { kind: 'usage', institutionId: ids.godavari })).toBe(true);
    const rows = usage({
      institution: institution(),
      plans: [plan()],
      experiments: [experiment()],
      students: [student()],
      grants: [grant()],
      groups: [],
      waits: [],
      overlap: UNDECIDED_OVERLAP_POLICY,
      activities: [WEB_ACTIVITY],
      completions: [COMPLETED_WEB],
      now: T.oct14,
    });
    expect(rows[0]).toMatchObject({
      studentsWithAccess: 1,
      perFormat: [
        { format: 'web', started: 1, completed: 1, sessions: 1 },
        { format: 'vr', started: 0, completed: 0, sessions: 0 },
      ],
    });
  },
  'RUN-14': () =>
    expect(visible('super_admin', { kind: 'usage', institutionId: ids.godavari })).toBe(true),
  'FB-05': () => {
    expect(visible('student', { kind: 'feedback', feedback: SENT_FEEDBACK })).toBe(true);
    expect(
      visible('student', { kind: 'feedback', feedback: { ...SENT_FEEDBACK, studentId: ids.arun } }),
    ).toBe(false);
  },
  'ASMT-10': () => {
    expect(visible('faculty', { kind: 'assessment', assessment: assessment() })).toBe(true);
    expect(visible('faculty', { kind: 'question', question: QUESTIONS[1]! })).toBe(true);
  },
  'ASMT-13': () => {
    const coTeacher = personRef(ids.kumar, 'faculty', 'Dr K. Kumar');
    expect(
      canRead(context(coTeacher, { taughtExperiments: [ids.shell] }), {
        kind: 'assessment',
        assessment: assessment(),
      }).visible,
    ).toBe(true);
  },
  'ASMT-15': () => {
    // A Ready assessment needs a question (OD-B4-03), so a question-less one is a draft: never listed.
    expect(
      assessmentReadiness({ name: 'Post-lab', rules: assessment().rules, questions: [] }),
    ).toBe('draft-not-ready');
    expect(
      assessmentForStudent({
        assessment: assessment({ questions: [] }),
        hasExperiment: true,
        gate: OPEN,
        attempts: [],
        questions: QUESTIONS,
        now: T.nov5,
      }),
    ).toEqual({ visible: false });
  },
  'ASMT-16': () =>
    expect(
      assessmentForStudent({
        assessment: assessment(),
        hasExperiment: true,
        gate: OPEN,
        attempts: [],
        questions: QUESTIONS,
        now: T.nov5,
      }),
    ).toEqual({ visible: true, status: 'to-do', canStart: true }),
  'Q-10': () => {
    const colleague = question(ids.q101, QUESTIONS[0]!.body, 6, {
      addedBy: personRef(ids.kumar, 'faculty', 'Dr K. Kumar'),
    });
    expect(canRead(ctx('faculty'), { kind: 'question', question: colleague })).toEqual({
      visible: false,
      refusal: { kind: 'policy-open', decision: 'OD-B4-17' },
    });
  },
  'ATT-23': () => {
    expect(
      visible('faculty', { kind: 'attempt', studentId: ids.rahul, assessment: assessment() }),
    ).toBe(true);
    expect(navCounts.facultyMarking([SUBMITTED()], [assessment()], QUESTIONS, [ids.shell])).toBe(1);
  },
  'ATT-16': () => {
    expect(
      visible('student', { kind: 'attempt', studentId: ids.rahul, assessment: assessment() }),
    ).toBe(true);
    expect(
      resultView({
        attempt: MARKED(7),
        assessment: assessment(),
        questions: QUESTIONS,
        now: T.nov20,
      }),
    ).toMatchObject({ kind: 'released', score: 13, outOf: 16, passed: true });
  },
  'ATT-18': () =>
    expect(
      visible('faculty', { kind: 'attempt', studentId: ids.arun, assessment: assessment() }),
    ).toBe(true),
  'DTR-15': () => {
    const sent = transfer('with-institute-admin');
    expect(visible('student', { kind: 'device-transfer', transfer: sent })).toBe(true);
    expect(visible('tenant_admin', { kind: 'device-transfer', transfer: sent })).toBe(true);
    expect(visible('super_admin', { kind: 'device-transfer', transfer: sent })).toBe(true);
  },
  'SUB-14': () =>
    expect(visible('vendor', { kind: 'submission', submission: submission(STATUS.returned) })).toBe(
      true,
    ),
  // Owner decision PD-1 of 27 Oct 2026: ownership is per person — a colleague of the same studio
  // meets the same answer as any other Vendor (the record is not theirs; nothing is disclosed).
  'SUB-15': () => {
    for (const state of [STATUS.draft, STATUS.returned, STATUS.withReviewer, STATUS.published]) {
      const colleague = submission(state, {
        vendorHolderId: unsafeBrand('holder-colleague'),
        vendorOrganisation: 'Northline Simulation Studio',
      });
      expect(canRead(ctx('vendor'), { kind: 'submission', submission: colleague })).toEqual({
        visible: false,
        refusal: { kind: 'not-permitted', why: 'not-own-record' },
      });
    }
  },
  'SUB-39': () =>
    expect(
      visible('academic_reviewer', { kind: 'submission', submission: submission(STATUS.withCm) }),
    ).toBe(true),
  'SUB-22': () =>
    expect(
      visible('academic_reviewer', {
        kind: 'submission',
        submission: submission(STATUS.withReviewer),
      }),
    ).toBe(true),
  'SUB-23': () => {
    const elsewhere = submission(STATUS.withReviewer, {
      content: content({ courseId: ids.course2 }),
    });
    expect(visible('academic_reviewer', { kind: 'submission', submission: elsewhere })).toBe(false);
    const inScope = (subject: { readonly submission?: domain.Submission }) =>
      subject.submission
        ? domain.scopeCovers(holder('academic_reviewer'), {
            courseId: subject.submission.content.courseId,
          })
        : false;
    expect(navCounts.reviewerQueue([submission(STATUS.withReviewer), elsewhere], [], inScope)).toBe(
      1,
    );
  },
  'SUB-40': () => {
    expect(
      visible('content_manager', { kind: 'submission', submission: submission(STATUS.withCm) }),
    ).toBe(true);
    expect(navCounts.contentManagerReady([submission(STATUS.withCm)], () => true)).toBe(1);
  },
  'SUB-37': () =>
    expect(
      visible('super_admin', { kind: 'submission', submission: submission(STATUS.withReviewer) }),
    ).toBe(true),
  'SUB-38': () => {
    const moved = expectOk(
      overrideStatus({
        submission: submission(STATUS.withReviewer),
        holders: [],
        reason: 'Nobody has EEE ZC341',
        actor: who.superAdmin,
        now: T.oct14,
        ids: counterIds(),
      }),
    );
    expect(moved.history.at(-1)).toMatchObject({
      event: 'status-overridden',
      visibleTo: ['super_admin'],
    });
  },
  'LO-04': () => {
    for (const role of ['vendor', 'content_manager', 'faculty', 'student', 'public'] as const)
      expect(visible(role, { kind: 'published-experiment', experiment: experiment() })).toBe(true);
    expect(experiment().learningOutcomes).toHaveLength(1);
  },
  'EXP-01': () => {
    expect(visible('public', { kind: 'published-experiment', experiment: experiment() })).toBe(
      true,
    );
    expect(publicCatalogue([experiment()], [course()])).toHaveLength(1);
  },
  'EXP-03': () => {
    const exp = experiment({ openUpdateId: ids.upd5 });
    const renamed = update(
      'awaiting-release-decision',
      { proposed: { ...liveFields(exp), name: 'Shell-and-Tube Heat Exchanger (revised)' } },
      exp,
    );
    const out = expectOk(
      releaseUpdate({
        update: renamed,
        experiment: exp,
        actor: who.superAdmin,
        now: T.oct20,
        ids: counterIds(),
      }),
    );
    expect(publicCatalogue([out.experiment], [course()])[0]!.name).toBe(
      'Shell-and-Tube Heat Exchanger (revised)',
    );
  },
  'EXP-04': () => {
    expect(visible('faculty', { kind: 'published-experiment', experiment: experiment() })).toBe(
      true,
    );
    expect(visible('faculty', { kind: 'published-experiment', experiment: WALL_B })).toBe(false);
  },
  'EXP-10': () =>
    expect(
      visible('content_manager', { kind: 'published-experiment', experiment: experiment() }),
    ).toBe(true),
  'UPD-11': () => {
    expect(
      visible('content_manager', {
        kind: 'update',
        update: update('on-hold'),
        experiment: experiment(),
      }),
    ).toBe(true);
    const held = expectOk(
      holdUpdate({
        update: update('awaiting-release-decision'),
        reason: 'Wait for the term to end.',
        actor: who.superAdmin,
        now: T.oct20,
        ids: counterIds(),
      }),
    );
    expect(held.history.at(-1)?.visibleTo).toContain('content_manager');
  },
  'UPD-17': () => {
    const exp = experiment({ openUpdateId: ids.upd5 });
    const out = expectOk(
      withdrawUpdate({
        update: update('in-academic-review', {}, exp),
        experiment: exp,
        reason: 'Superseded',
        actor: who.contentManager,
        now: T.oct20,
        ids: counterIds(),
      }),
    );
    expect(out.update.history.at(-1)).toMatchObject({
      event: 'withdrawn',
      visibleTo: ['content_manager'],
    });
  },
  'UPD-26': () =>
    expect(
      visible('super_admin', {
        kind: 'update',
        update: update('awaiting-release-decision'),
        experiment: experiment(),
      }),
    ).toBe(true),
  'CRS-09': () =>
    expect(
      publicAreas(
        [area(), area({ id: ids.area2, name: 'Chemical & Process' })],
        publicCatalogue([experiment()], [course()]),
      ).map((entry) => entry.id),
    ).toEqual([ids.area]),
  'ROLE-08': () => {
    // Held on the person (the holder record, B7-08; owner decision PD-1 of 27 Oct 2026): the scope
    // is the person's, and a colleague's record is not theirs (SUB-15).
    expect(holder('vendor').scopes[0]!.target).toEqual({ kind: 'course', courseId: ids.course });
    expect(
      canRead(ctx('vendor'), {
        kind: 'submission',
        submission: submission(STATUS.draft, { vendorHolderId: unsafeBrand('holder-colleague') }),
      }),
    ).toEqual({ visible: false, refusal: { kind: 'not-permitted', why: 'not-own-record' } });
  },
  'ROLE-10': () => {
    const limited = {
      holder: holder('content_manager', [{ kind: 'course', courseId: ids.course2 }]),
    };
    refusedFor(
      'content_manager',
      'submission.publish',
      S.submission(submission(STATUS.withCm)),
      { kind: 'not-permitted', why: 'out-of-scope' },
      T.oct14,
      limited,
    );
    refusedFor(
      'content_manager',
      'correction.open',
      S.experiment(),
      { kind: 'not-permitted', why: 'out-of-scope' },
      T.oct14,
      limited,
    );
  },
  'ROLE-12': () => {
    expect(
      visible('academic_reviewer', { kind: 'scope-line', holder: holder('academic_reviewer') }),
    ).toBe(true);
    expect(visible('academic_reviewer', { kind: 'scope-line', holder: holder('vendor') })).toBe(
      false,
    );
    expect(vendorCourseGrant(holder('vendor'))).toEqual({
      kind: 'listed',
      courseIds: [ids.course],
    });
  },
  'SUP-02': () => {
    for (const role of PEOPLE) {
      const own = report('resolved', {
        reporter: {
          personId: PERSON[role].personId,
          role,
          displayName: PERSON[role].displayName,
          institutionId: null,
          organisation: null,
        },
      });
      expect(visible(role, { kind: 'support-report', report: own })).toBe(true);
    }
  },
  'SUP-09': () =>
    expect(visible('super_admin', { kind: 'support-report', report: report('open') })).toBe(true),
  'SUP-07': () =>
    expect(
      canRead(ctx('tenant_admin'), { kind: 'support-report', report: report('open') }),
    ).toEqual({ visible: false, refusal: { kind: 'policy-open', decision: 'SUP-07' } }),
};

// ── OPEN: never offered, `policy-open`, one case per row ──────────────────────────────────────

const OPEN_CASES: Readonly<Record<string, () => void>> = {
  'REQ-19': () => {
    const two = request({
      items: [
        { experimentId: ids.shell, formats: ['web', 'vr'] },
        { experimentId: ids.wallA, formats: ['web'] },
      ],
    });
    expect(
      refusalOf(
        approveSmallerScope({
          request: two,
          institution: null,
          route: 'external',
          items: [{ experimentId: ids.shell, formats: ['web'] }],
          licences: 100,
          term: { kind: 'yearly' },
          reason: 'x',
          actor: who.superAdmin,
          now: T.oct14,
          ids: counterIds(),
        }),
      ),
    ).toEqual({
      kind: 'policy-open',
      decision: 'REQ-19',
    });
  },
  'REQ-22': () =>
    expect(
      availableActions(
        ctx('super_admin'),
        S.request({ status: 'payment-not-confirmed', payments: [PENDING] }),
      ),
    ).toEqual([]),
  'INST-06': () =>
    refusedFor('super_admin', 'institution.assign-institute-admin', S.institution(), {
      kind: 'policy-open',
      decision: 'INST-06',
    }),
  'SACC-08': () =>
    expect(
      refusalOf(
        withdrawGrant({
          grant: grant({ target: { kind: 'group', groupId: ids.grp12 } }),
          institution: institution(),
          plan: plan(),
          student: null,
          reason: 'x',
          actor: who.instituteAdmin,
          now: T.oct14,
          ids: counterIds(),
        }),
      ),
    ).toEqual({
      kind: 'policy-open',
      decision: 'OD-B2-01',
    }),
  'PER-07': () => {
    refusedFor('tenant_admin', 'person.deactivate-student', S.person(faculty()), {
      kind: 'policy-open',
      decision: 'PER-07',
    });
    refusedFor(
      'tenant_admin',
      'person.reactivate-student',
      S.person(faculty({ accountStatus: 'inactive' })),
      { kind: 'policy-open', decision: 'PER-07' },
    );
  },
  'PER-08': () => absent(/editPerson|updatePerson|person\.edit-details/i),
  'CC-06': () =>
    refusedFor(
      'content_manager',
      'platform-course-code.save',
      S.structure(),
      { kind: 'policy-open', decision: 'CC-06' },
      T.oct14,
      { holder: holder('content_manager', [{ kind: 'course', courseId: ids.course }]) },
    ),
  'ASMT-17': () => {
    const theirs = assessment({ createdBy: personRef(ids.kumar, 'faculty', 'Dr K. Kumar') });
    refusedFor('faculty', 'assessment.edit-settings', S.assessment(theirs), {
      kind: 'policy-open',
      decision: 'OD-B4-17',
    });
    refusedFor(
      'faculty',
      'marking.confirm',
      S.attempt(SUBMITTED_WITH_MARK(), undefined, {}, theirs),
      { kind: 'policy-open', decision: 'OD-B4-17' },
      T.nov7,
    );
  },
  'Q-11': () => {
    // A question belongs to the bank page's experiment; no picker is offered.
    expect(ACTION_IDS.filter((id) => /choose-experiment|pick-experiment/.test(id))).toEqual([]);
  },
  // Owner decision of 24 Oct 2026 (P4-04; `OWNER_DECIDED_OPEN_ROWS`): no longer OPEN. Faculty
  // saves a mark for every written answer, then confirms the attempt once — `marking.confirm`.
  'ATT-17': () => {
    expect(isOpenCapability('marking.confirm-several-written')).toBe(false);
    const second = question(unsafeBrand('Q-0103'), { type: 'written', markingGuidance: null }, 5);
    const several = assessment({
      versions: [
        {
          ...assessment().versions[0]!,
          questions: [...assessment().questions, { questionId: second.id, questionVersion: 1 }],
        },
      ],
    });
    const questions = [...QUESTIONS, second];
    const confirm = (attempt: Attempt) =>
      confirmMarks({ attempt, assessment: several, questions, actor: who.faculty, now: T.nov7 });
    // One of the two written answers marked: still on offer (a missing mark is form input), and
    // the command names the written question without a saved mark.
    const one = SUBMITTED_WITH_MARK();
    expect(
      may(
        ctx('faculty', T.nov7),
        'marking.confirm',
        S.attempt(one, undefined, {}, several, questions),
      ),
    ).toMatchObject({ allowed: true, rows: ['ATT-09'] });
    expect(refusalOf(confirm(one))).toEqual({
      kind: 'validation-failed',
      issues: [{ field: 'mark-Q-0103', rule: 'save-first' }],
    });
    // Both marked: confirmed once for the attempt, by the Faculty member.
    const both = SUBMITTED({
      marking: {
        ...one.marking,
        written: [
          ...one.marking.written,
          { questionId: second.id, mark: 4, feedback: null, savedAt: T.nov7, savedBy: who.faculty },
        ],
      },
    });
    const subject = S.attempt(both, undefined, {}, several, questions);
    expect(may(ctx('faculty', T.nov7), 'marking.confirm', subject)).toMatchObject({
      allowed: true,
      rows: ['ATT-09'],
    });
    expect(availableActions(ctx('faculty', T.nov7), subject)).toContain('marking.confirm');
    expect(expectOk(confirm(both)).marking.confirmed).toEqual({ at: T.nov7, by: who.faculty });
    for (const role of ALL_ROLES.filter((candidate) => candidate !== 'faculty')) {
      expect(may(ctx(role, T.nov7), 'marking.confirm', subject), role).toEqual({
        allowed: false,
        refusal: WRONG,
      });
    }
  },
  'DTR-09': () => {
    const none = institution({ instituteAdmin: null });
    const waiting = expectOk(
      requestDeviceTransfer({
        institution: none,
        devices: [device()],
        openTransfers: [],
        newDevice: 'GIT-VR-07',
        note: null,
        actor: who.student,
        now: T.oct20,
        ids: counterIds(),
      }),
    );
    expect(forwardingBlocked(waiting, none)).toBe('no-institute-admin');
    refusedFor('super_admin', 'device-transfer.approve', S.device(waiting, none), {
      kind: 'refused',
      code: 'not-yet-forwarded',
    });
  },
  'SUB-35': () =>
    refusedFor(
      'super_admin',
      'submission.override-status',
      S.submission(submission(STATUS.withCm), []),
      { kind: 'invalid-state', current: 'with-content-manager' },
    ),
  // Owner decision of 27 Oct 2026 (PD-2, PD-4; `OWNER_DECIDED_OPEN_ROWS`): no longer OPEN. For a
  // Vendor, "All experiments" = any existing course; a one-experiment scope gives nothing.
  'ROLE-11': () => {
    expect(isOpenCapability('vendor.non-course-scope')).toBe(false);
    expect(vendorCourseGrant(holder('vendor', [{ kind: 'all' }]))).toEqual({ kind: 'any-course' });
    const allScope = { holder: holder('vendor', [{ kind: 'all' }]) };
    expect(
      may(ctx('vendor', T.oct14, allScope), 'submission.start', S.submission(null)),
    ).toMatchObject({ allowed: true, rows: ['SUB-01'] });
    // A draft under a course no course scope names: allowed under "All experiments".
    const elsewhere = submission(STATUS.draft, { content: content({ courseId: ids.course2 }) });
    expect(
      may(ctx('vendor', T.oct14, allScope), 'submission.save-draft', S.submission(elsewhere)),
    ).toMatchObject({ allowed: true });
    // … but never another Vendor's record.
    refusedFor(
      'vendor',
      'submission.save-draft',
      S.submission(submission(STATUS.draft, { vendorHolderId: unsafeBrand('holder-colleague') })),
      { kind: 'not-permitted', why: 'not-own-record' },
      T.oct14,
      allScope,
    );
    // A one-experiment scope, no scope, or a withdrawn scope: nothing to start — out of scope.
    for (const targets of [[{ kind: 'experiment', experimentId: ids.shell }], []] as const) {
      refusedFor(
        'vendor',
        'submission.start',
        S.submission(null),
        { kind: 'not-permitted', why: 'out-of-scope' },
        T.oct14,
        { holder: holder('vendor', targets) },
      );
    }
  },
  'SUP-04': () => {
    deniedTo(
      ['student', 'faculty', 'tenant_admin', 'vendor', 'academic_reviewer', 'content_manager'],
      'support.reopen',
      S.report(report('resolved')),
    );
    refusedFor('super_admin', 'support.reopen', S.report(SA_REPORT()), {
      kind: 'policy-open',
      decision: 'SUP-04',
    });
  },
  'SES-09': () =>
    refusedFor('faculty', 'session.sign-in', S.session('inactive'), {
      kind: 'policy-open',
      decision: 'SES-09',
    }),
};

// ── SYSTEM: system writers only, one case per row ─────────────────────────────────────────────

/** Every user-facing actor: the seven roles and the public requester. */
const USER_ACTORS = [
  ...PEOPLE.map((role) => PERSON[role]),
  { kind: 'requester' as const, name: 'Meera Iyer' },
];

const SYSTEM_CASES: Readonly<Record<string, () => void>> = {
  'ACC-02': () => {
    const approved = expectOk(
      approveRequest({
        request: request(),
        institution: null,
        route: 'external',
        actor: who.superAdmin,
        now: T.oct8,
        ids: counterIds(),
      }),
    );
    const paying = expectOk(
      startPayment({
        request: approved.request,
        payer: { kind: 'requester', name: 'Meera Iyer' },
        now: T.oct8,
        ids: counterIds(),
      }),
    );
    for (const actor of USER_ACTORS) {
      expect(
        refusalOf(
          reportPaymentOutcome({
            request: paying,
            outcome: 'confirmed',
            institution: approved.institution,
            plans: [],
            actor: actor as never,
            now: T.oct8,
            ids: counterIds(),
          }),
        ),
      ).toEqual(WRONG);
    }
    const paid = expectOk(
      reportPaymentOutcome({
        request: paying,
        outcome: 'confirmed',
        institution: approved.institution,
        plans: [],
        actor: system('system:payment-provider'),
        now: T.oct8,
        ids: counterIds(),
      }),
    );
    expect(paid.planEffect.kind).toBe('plan-created');
  },
  'ACC-06': () => {
    expect(Object.keys(plan())).not.toContain('status');
    expect([
      planTermState(plan(), T.oct14),
      planTermState(plan(), T.sep2027),
      planTermState(plan(), T.oct2027),
    ]).toEqual(['active', 'ending-soon', 'ended']);
  },
  'GRP-05': () => {
    const removed = expectOk(
      removeMember({
        institution: institution(),
        group: group([{ id: ids.rahul, addedAt: T.oct9 }]),
        studentId: ids.rahul,
        actor: who.instituteAdmin,
        now: T.oct14,
        ids: counterIds(),
      }),
    );
    const groupGrant = grant({
      id: ids.sacc311,
      target: { kind: 'group', groupId: ids.grp12 },
      givenAt: T.oct12,
    });
    expect(experimentGate(gateInput({ grants: [groupGrant], groups: [removed] }))).toEqual({
      canOpen: false,
      reason: 'policy-open',
      decision: 'GRP-05',
    });
  },
  'RUN-08': () => {
    for (const actor of USER_ACTORS) {
      expect(
        refusalOf(
          recordRuntimeActivity({
            activity: null,
            report: {
              studentId: ids.rahul,
              experimentId: ids.shell,
              format: 'web',
              kind: 'opened',
              at: T.oct12,
            },
            actor: actor as never,
          }),
        ),
      ).toEqual(WRONG);
    }
  },
  'CMP-01': () => {
    for (const actor of USER_ACTORS) {
      expect(
        refusalOf(
          reportCompletion({
            existing: null,
            report: {
              studentId: ids.rahul,
              experimentId: ids.shell,
              format: 'web',
              at: T.oct14,
              from: 'simulation',
            },
            actor: actor as never,
          }),
        ),
      ).toEqual(WRONG);
    }
  },
  'ATT-07': () => {
    for (const actor of USER_ACTORS) {
      expect(
        refusalOf(
          applyObjectiveMarks({
            attempt: SUBMITTED(),
            assessment: assessment(),
            questions: QUESTIONS,
            supplied: [{ questionId: ids.q101, awarded: 6 }],
            actor: actor as never,
            now: T.nov7,
          }),
        ),
      ).toEqual(WRONG);
    }
  },
  'ATT-13': () => {
    expect(resultReleaseAt(assessment().rules, T.nov7)).toBe(T.nov14);
    expect(ATTEMPT_TRANSITIONS.map((row) => row.command).join(' ')).not.toMatch(/release/i);
  },
  'SUB-10': () => {
    const back = submission({ state: 'resubmitted', since: T.oct12 }, { revision: 2 });
    for (const actor of USER_ACTORS) {
      expect(
        refusalOf(
          routeResubmission({
            submission: back,
            routing: DRAWN_WORKFLOW_ROUTING,
            actor: actor as never,
            now: T.oct14,
            ids: counterIds(),
          }),
        ),
      ).toEqual(WRONG);
    }
    expect(DRAWN_WORKFLOW_ROUTING.route(back)).toEqual({ reason: 'resubmission' });
  },
  'UPD-21': () => {
    // Only the drawn effect is applied: a held update is still the experiment's open update.
    const exp = experiment({ openUpdateId: ids.upd5 });
    expect(
      refusalOf(
        openCorrection({
          experiment: exp,
          openUpdate: update('on-hold'),
          entry: 'start-a-correction',
          actor: who.contentManager,
          now: T.oct20,
          ids: counterIds(),
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'update-already-open' });
  },
  'ROLE-09': () => {
    const reviewer = holder('academic_reviewer');
    const withdrawn = expectOk(
      withdrawScope({
        holder: reviewer,
        scopeId: reviewer.scopes[0]!.id,
        reason: 'Moved',
        actor: who.superAdmin,
        now: T.oct14,
        ids: counterIds(),
      }),
    );
    // Nothing in flight is changed; the queues read the scopes as they are.
    expect(isStuck(submission(STATUS.withReviewer), [withdrawn])).toBe(true);
  },
  'XC-03': () => {
    const blank = { kind: 'validation-failed', issues: [{ field: 'reason', rule: 'required' }] };
    expect(
      refusalOf(
        withdrawGrant({
          grant: grant(),
          institution: institution(),
          plan: plan(),
          student: student(),
          reason: ' ',
          actor: who.instituteAdmin,
          now: T.oct14,
          ids: counterIds(),
        }),
      ),
    ).toEqual(blank);
    expect(
      refusalOf(
        deactivateStudent({
          institution: institution(),
          student: student(),
          reason: '',
          actor: who.instituteAdmin,
          now: T.oct14,
          ids: counterIds(),
        }),
      ),
    ).toEqual(blank);
    expect(
      refusalOf(
        pauseInstitution({
          institution: institution(),
          plans: [plan()],
          reason: '',
          actor: who.superAdmin,
          now: T.oct12,
          ids: counterIds(),
        }),
      ),
    ).toEqual(blank);
    expect(
      refusalOf(
        holdUpdate({
          update: update('awaiting-release-decision'),
          reason: '',
          actor: who.superAdmin,
          now: T.oct20,
          ids: counterIds(),
        }),
      ),
    ).toEqual(blank);
    const kept = expectOk(
      withdrawGrant({
        grant: grant(),
        institution: institution(),
        plan: plan(),
        student: student(),
        reason: 'Moved course',
        actor: who.instituteAdmin,
        now: T.oct14,
        ids: counterIds(),
      }),
    );
    expect(kept.grant.withdrawal?.reason).toBe('Moved course');
  },
};

/** The subject of each action's first ALLOW case (used for the workspace checks). */
const ALLOW_SUBJECT = new Map<ActionId, () => Subject>();
for (const [, entry] of Object.entries(ALLOW_CASES))
  if (!ALLOW_SUBJECT.has(entry.action)) ALLOW_SUBJECT.set(entry.action, entry.subject);

// ── The suite ───────────────────────────────────────────────────────────────────────────────────

const title = (row: MatrixRow) =>
  `${row.id} · ${row.kind} · ${row.status}${row.stakeholderConflict ? ' · stakeholder conflict (owner)' : ''} — ${row.action}`;

describe('the candidate matrix (docs/v46/permission-matrix.json)', () => {
  it('is the committed candidate, unchanged (SHA-256 pinned)', () => {
    expect(createHash('sha256').update(MATRIX_BYTES).digest('hex')).toBe(MATRIX_SHA256);
  });

  it('347 rows: ALLOW 103 · DENY 156 · READ 62 · OPEN 15 · SYSTEM 11; 22 stakeholder conflicts', () => {
    expect(ROWS).toHaveLength(347);
    expect(
      [idsOf('ALLOW'), idsOf('DENY'), idsOf('READ'), idsOf('OPEN'), idsOf('SYSTEM')].map(
        (list) => list.length,
      ),
    ).toEqual([103, 156, 62, 15, 11]);
    expect(ROWS.filter((row) => row.stakeholderConflict).map((row) => row.id)).toEqual([
      'SEL-05',
      'INST-02',
      'INST-10',
      'INST-16',
      'ACC-03',
      'ACC-07',
      'PER-02',
      'PER-16',
      'CC-07',
      'RUN-14',
      'RUN-15',
      'ASMT-09',
      'Q-04',
      'ATT-11',
      'ATT-16',
      'DTR-13',
      'SUB-33',
      'SUB-35',
      'EXP-06',
      'EXP-07',
      'EXP-08',
      'UPD-12',
    ]);
  });
});

describe('coverage 347/347: every row has exactly one case of its kind', () => {
  it.each([
    ['ALLOW', ALLOW_CASES],
    ['DENY', DENY_CASES],
    ['READ', READ_CASES],
    ['OPEN', OPEN_CASES],
    ['SYSTEM', SYSTEM_CASES],
  ] as const)('%s', (kind, cases) => {
    expect(Object.keys(cases).sort()).toEqual(idsOf(kind).sort());
  });

  it('every rule row is an ALLOW row, every ALLOW row is in exactly one rule, and the case names that rule', () => {
    const owners = new Map<string, string[]>();
    for (const rule of ALL_RULES)
      for (const id of rule.rows) owners.set(id, [...(owners.get(id) ?? []), rule.action]);
    expect([...owners.keys()].filter((id) => ROW.get(id)?.kind !== 'ALLOW')).toEqual([]);
    for (const id of idsOf('ALLOW')) {
      expect(owners.get(id), id).toEqual([ALLOW_CASES[id]!.action]);
    }
  });

  it('a rule is offered to exactly the roles of its rows, at the weakest status of its rows', () => {
    for (const rule of ALL_RULES) {
      const rows = rule.rows.map((id) => ROW.get(id)!);
      expect([...rule.actors].sort(), rule.action).toEqual(
        [...new Set(rows.flatMap(rolesOf))].sort(),
      );
      expect(rule.status, rule.action).toBe(
        rows.every((row) => row.status === 'CONFIRMED') ? 'CONFIRMED' : 'PROVISIONAL',
      );
    }
  });

  it('the absence checks scan the real surface: every rule action and every package export', () => {
    expect(ACTION_IDS).toHaveLength(ALL_RULES.length);
    expect(ACTION_IDS).toContain('request.approve');
    expect(EXPORTS).toEqual(
      expect.arrayContaining(['approveRequest', 'publish', 'releaseUpdate', 'may', 'canRead']),
    );
    expect(EXPORTS.length).toBeGreaterThan(200);
  });

  it('the 15 OPEN rows are the OPEN capabilities and the owner-decided rows, and no rule shares their names', () => {
    const decided = Object.keys(OWNER_DECIDED_OPEN_ROWS);
    expect(idsOf('OPEN')).toHaveLength(15);
    expect(decided).toEqual(['ATT-17', 'ROLE-11']);
    expect(decided.every((id) => ROW.get(id)?.kind === 'OPEN')).toBe(true);
    expect(
      Object.values(OPEN_CAPABILITIES)
        .map((entry) => entry.row)
        .sort(),
    ).toEqual(
      idsOf('OPEN')
        .filter((id) => !decided.includes(id))
        .sort(),
    );
    expect(Object.keys(OPEN_CAPABILITIES).filter((name) => ACTION_IDS.includes(name))).toEqual([]);
    // A decided row is served by a rule, never by a leftover OPEN capability.
    for (const entry of Object.values(OWNER_DECIDED_OPEN_ROWS)) {
      expect(ACTION_IDS).toContain(entry.servedBy);
      expect(['2026-10-24', '2026-10-27']).toContain(entry.decided);
    }
  });
});

describe('ALLOW → a policy rule (each acting role allowed; every other role refused)', () => {
  for (const id of idsOf('ALLOW')) {
    const row = ROW.get(id)!;
    it(title(row), () => {
      const entry = ALLOW_CASES[id]!;
      for (const role of rolesOf(row)) {
        const verdict = may(ctx(role, entry.now), entry.action, entry.subject());
        expect(verdict, `${role} · ${entry.action}`).toMatchObject({
          allowed: true,
          rows: expect.arrayContaining([id]),
        });
        expect(availableActions(ctx(role, entry.now), entry.subject())).toContain(entry.action);
      }
      const offered = new Set(
        idsOf('ALLOW')
          .filter((other) => ALLOW_CASES[other]!.action === entry.action)
          .flatMap((other) => rolesOf(ROW.get(other)!)),
      );
      for (const role of ALL_ROLES.filter((candidate) => !offered.has(candidate))) {
        expect(
          may(ctx(role, entry.now), entry.action, entry.subject()),
          `${role} · ${entry.action}`,
        ).toEqual({ allowed: false, refusal: WRONG });
      }
    });
  }
});

describe('DENY → refusal and absence', () => {
  for (const id of idsOf('DENY')) it(title(ROW.get(id)!), () => DENY_CASES[id]!());
});

describe('READ → visibility and read models', () => {
  for (const id of idsOf('READ')) it(title(ROW.get(id)!), () => READ_CASES[id]!());
});

describe('OPEN → never offered; refused with policy-open (an owner-decided row: the decided rule)', () => {
  for (const id of idsOf('OPEN')) {
    it(title(ROW.get(id)!), () => {
      if (Object.hasOwn(OWNER_DECIDED_OPEN_ROWS, id)) {
        OPEN_CASES[id]!();
        return;
      }
      const [capability, entry] = Object.entries(OPEN_CAPABILITIES).find(
        ([, value]) => value.row === id,
      )!;
      for (const role of ALL_ROLES) {
        expect(may(ctx(role), capability as OpenCapability, S.session())).toEqual({
          allowed: false,
          refusal: { kind: 'policy-open', decision: entry.decision },
        });
      }
      OPEN_CASES[id]!();
    });
  }
});

describe('P7 scope: no offer reaches another institution or another person’s own records', () => {
  const konark = { institutionId: ids.konark };
  const theirQuestion = question(ids.q101, QUESTIONS[0]!.body, 6, konark);
  const theirAssessment = assessment(konark);
  const bank = (overrides: Partial<SubjectOf<'question-bank'>>): SubjectOf<'question-bank'> => ({
    ...S.bank(),
    ...overrides,
  });
  const outside = { kind: 'not-permitted', why: 'out-of-scope' };

  it('Faculty: another institution’s bank, questions, assessments and attempts are out of scope', () => {
    for (const action of ['question.add', 'question.import', 'question.request-drafts'] as const) {
      refusedFor('faculty', action, bank({ institutionId: ids.konark }), outside);
    }
    for (const action of ['question.edit', 'question.delete'] as const)
      refusedFor('faculty', action, bank({ question: theirQuestion }), outside);
    refusedFor(
      'faculty',
      'question.review-draft',
      bank({ draft: { ...DRAFT, institutionId: ids.konark } }),
      outside,
    );
    refusedFor('faculty', 'assessment.edit-settings', S.assessment(theirAssessment), outside);
    refusedFor(
      'faculty',
      'marking.save-mark',
      S.attempt(SUBMITTED(), undefined, {}, theirAssessment),
      outside,
      T.nov7,
    );
    refusedFor(
      'faculty',
      'marking.confirm',
      S.attempt(SUBMITTED_WITH_MARK(), undefined, {}, theirAssessment),
      outside,
      T.nov7,
    );
  });

  it('Faculty: a colleague’s question or draft — whether the bank is shared is open (Q-10, OD-B4-17; Q-05 own drafts)', () => {
    const colleagues = question(ids.q101, QUESTIONS[0]!.body, 6, {
      addedBy: personRef(ids.kumar, 'faculty', 'Dr K. Kumar'),
    });
    for (const action of ['question.edit', 'question.delete'] as const) {
      refusedFor('faculty', action, bank({ question: colleagues }), {
        kind: 'policy-open',
        decision: 'OD-B4-17',
      });
    }
    refusedFor(
      'faculty',
      'question.review-draft',
      bank({ draft: { ...DRAFT, requestedBy: ids.kumar } }),
      { kind: 'not-permitted', why: 'not-own-record' },
    );
  });

  it('Students: another institution’s assessment, and another Student’s access, are never offered', () => {
    refusedFor(
      'student',
      'attempt.start',
      S.attempt(null, [], {}, theirAssessment),
      outside,
      T.nov5,
    );
    const arun = { student: student({ id: ids.arun }) };
    for (const action of ['web.launch', 'resource.open'] as const) {
      refusedFor('student', action, S.learning(arun), {
        kind: 'not-permitted',
        why: 'not-own-record',
      });
    }
    refusedFor('student', 'feedback.open-form', S.feedback(COMPLETED_WEB, null, arun), {
      kind: 'not-permitted',
      why: 'not-own-record',
    });
    refusedFor(
      'student',
      'attempt.start',
      S.attempt(null, [], arun),
      { kind: 'not-permitted', why: 'not-own-record' },
      T.nov5,
    );
    expect(visible('student', { kind: 'assessment', assessment: theirAssessment })).toBe(false);
  });
});

describe('SYSTEM → system writers only; no user command produces the transition', () => {
  for (const id of idsOf('SYSTEM')) it(title(ROW.get(id)!), () => SYSTEM_CASES[id]!());

  it('no rule reaches a system writer, and a system actor is offered no user command', () => {
    const source = readFileSync(new URL('./rules.ts', import.meta.url), 'utf8');
    for (const writer of [
      'recordReviewStarted',
      'reportPaymentOutcome',
      'routeResubmission',
      'applyObjectiveMarks',
      'reportCompletion',
      'recordRuntimeActivity',
      'completionFromRuntimeEvents',
    ]) {
      expect(source.includes(writer), writer).toBe(false);
    }
    for (const name of SYSTEM_ACTORS) {
      const systemContext: PolicyContext = {
        actor: { kind: 'system', ref: system(name) },
        now: T.oct14,
      };
      for (const [action, subject] of ALLOW_SUBJECT)
        expect(may(systemContext, action, subject())).toEqual({ allowed: false, refusal: WRONG });
    }
  });
});

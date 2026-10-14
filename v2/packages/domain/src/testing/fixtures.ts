/**
 * Test support only (never built or exported — tsconfig.build.json excludes src/testing/**):
 * deterministic ids, the board's sample people and one record of each kind in a known state.
 * Names and dates follow the v46 sample world (Godavari Institute of Technology, Rahul Verma,
 * Shell-and-Tube Heat Exchanger, ACC-0107, SACC-0310 …) so tests read like the boards.
 */
import type { PersonActorRef, Role, SystemActor, SystemActorRef } from '../roles.js';
import type { Technology } from '../technology.js';
import { unsafeBrand } from '../kernel/brand.js';
import type { IdSource, MintedIds } from '../kernel/id-source.js';
import { DRAWN_ID_PREFIX } from '../kernel/ids.js';
import type {
  AccessPlanId,
  AreaId,
  AssessmentId,
  CourseId,
  ExperimentId,
  GroupId,
  InstitutionId,
  PersonId,
  QuestionId,
  RequestId,
  RequestRouteId,
  RequestStatusToken,
  RoleHolderId,
  ScopeId,
  StudentAccessGrantId,
  SubmissionId,
  SupportReportId,
  UpdateId,
} from '../kernel/ids.js';
import { provided } from '../kernel/provided.js';
import { newMeta } from '../kernel/record.js';
import { calendarDate, isoInstant, type IsoInstant } from '../kernel/time.js';
import type { StudentAccessGrant } from '../access/model.js';
import type {
  Assessment,
  AssessmentRules,
  Attempt,
  Question,
  QuestionBody,
} from '../assessment/model.js';
import type {
  Course,
  EngineeringArea,
  Experiment,
  PlatformCourseCode,
} from '../catalogue/model.js';
import type { CorrectionUpdate } from '../correction/correction.js';
import { liveFields } from '../correction/correction.js';
import type { AuthorisedDevice, DeviceTransfer } from '../device/device.js';
import type { AccessPlan, Institution } from '../institution/model.js';
import type { FacultyCourseMapping, FacultyPerson, Group, StudentPerson } from '../people/model.js';
import type {
  PlatformRole,
  PlatformRoleHolder,
  ScopeTarget,
} from '../platform-roles/platform-roles.js';
import type { PersonActor, PolicyContext, PublicActor } from '../policy/context.js';
import type { AccessRequest } from '../request/model.js';
import type { Submission, SubmissionContent, SubmissionStatus } from '../submission/model.js';
import type { SupportReport } from '../support/support.js';

export const at = (value: string): IsoInstant => isoInstant(value);

/** Sample instants (UTC; the boards read them as Indian local time). */
export const T = {
  aug14: at('2026-08-14T05:00:00.000Z'),
  aug28: at('2026-08-28T04:35:00.000Z'),
  oct2: at('2026-10-02T04:44:00.000Z'),
  oct8: at('2026-10-08T09:35:00.000Z'),
  oct9: at('2026-10-09T04:50:00.000Z'),
  oct12: at('2026-10-12T05:00:00.000Z'),
  oct14: at('2026-10-14T10:00:00.000Z'),
  oct20: at('2026-10-20T05:45:00.000Z'),
  oct23: at('2026-10-23T05:00:00.000Z'),
  nov5: at('2026-11-05T13:22:00.000Z'),
  nov7: at('2026-11-07T04:45:00.000Z'),
  nov14: at('2026-11-14T18:29:00.000Z'),
  nov20: at('2026-11-20T05:00:00.000Z'),
  sep2027: at('2027-09-25T05:00:00.000Z'),
  oct2027: at('2027-10-15T05:00:00.000Z'),
} as const;

const DRAWN: Partial<Record<keyof MintedIds, string>> = {
  request: DRAWN_ID_PREFIX.request,
  accessPlan: DRAWN_ID_PREFIX.accessPlan,
  studentAccessGrant: DRAWN_ID_PREFIX.studentAccessGrant,
  assessment: DRAWN_ID_PREFIX.assessment,
  attempt: DRAWN_ID_PREFIX.attempt,
  submission: DRAWN_ID_PREFIX.submission,
  update: DRAWN_ID_PREFIX.update,
  deviceTransfer: DRAWN_ID_PREFIX.deviceTransfer,
  supportReport: DRAWN_ID_PREFIX.supportReport,
  question: DRAWN_ID_PREFIX.question,
  group: DRAWN_ID_PREFIX.group,
  facultyCourseMapping: DRAWN_ID_PREFIX.facultyCourseMapping,
};

/** A deterministic id source: drawn kinds as "PREFIX-0001", the rest as "kind-1". */
export function counterIds(start = 1000): IdSource {
  const counters = new Map<string, number>();
  return {
    next<K extends keyof MintedIds>(kind: K): MintedIds[K] {
      const value = (counters.get(kind) ?? start) + 1;
      counters.set(kind, value);
      const prefix = DRAWN[kind];
      return (
        prefix ? `${prefix}-${String(value).padStart(4, '0')}` : `${kind}-${value}`
      ) as MintedIds[K];
    },
  };
}

export const ids = {
  godavari: unsafeBrand<InstitutionId>('godavari'),
  konark: unsafeBrand<InstitutionId>('konark'),
  plan: unsafeBrand<AccessPlanId>('ACC-0107'),
  req42: unsafeBrand<RequestId>('REQ-0042'),
  token42: unsafeBrand<RequestStatusToken>('token-REQ-0042'),
  route42: unsafeBrand<RequestRouteId>('route-REQ-0042'),
  area: unsafeBrand<AreaId>('mechanical'),
  area2: unsafeBrand<AreaId>('chemical'),
  course: unsafeBrand<CourseId>('me-zg523'),
  course2: unsafeBrand<CourseId>('eee-zc341'),
  shell: unsafeBrand<ExperimentId>('shell-and-tube-heat-exchanger'),
  wallA: unsafeBrand<ExperimentId>('composite-wall-conduction'),
  wallB: unsafeBrand<ExperimentId>('conduction-through-a-composite-wall'),
  rahul: unsafeBrand<PersonId>('per-rahul'),
  arun: unsafeBrand<PersonId>('per-arun'),
  sneha: unsafeBrand<PersonId>('per-sneha'),
  meera: unsafeBrand<PersonId>('per-meera'),
  ranganathan: unsafeBrand<PersonId>('per-ranganathan'),
  kumar: unsafeBrand<PersonId>('per-kumar'),
  arjun: unsafeBrand<PersonId>('per-arjun'),
  anil: unsafeBrand<PersonId>('per-anil'),
  menon: unsafeBrand<PersonId>('per-menon'),
  kavya: unsafeBrand<PersonId>('per-kavya'),
  sacc310: unsafeBrand<StudentAccessGrantId>('SACC-0310'),
  sacc311: unsafeBrand<StudentAccessGrantId>('SACC-0311'),
  grp12: unsafeBrand<GroupId>('GRP-0012'),
  sub77: unsafeBrand<SubmissionId>('SUB-0077'),
  upd5: unsafeBrand<UpdateId>('UPD-0005'),
  asmt9: unsafeBrand<AssessmentId>('ASMT-0009'),
  q101: unsafeBrand<QuestionId>('Q-0101'),
  q102: unsafeBrand<QuestionId>('Q-0102'),
  holderAnil: unsafeBrand<RoleHolderId>('holder-anil'),
  holderMenon: unsafeBrand<RoleHolderId>('holder-menon'),
  holderKavya: unsafeBrand<RoleHolderId>('holder-kavya'),
  sup213: unsafeBrand<SupportReportId>('SUP-0213'),
};

export function personRef(personId: PersonId, role: Role, displayName: string): PersonActorRef {
  return { kind: 'person', personId, role, displayName };
}

export const who = {
  superAdmin: personRef(ids.arjun, 'super_admin', 'Arjun Mehta'),
  instituteAdmin: personRef(ids.meera, 'tenant_admin', 'Meera Iyer'),
  student: personRef(ids.rahul, 'student', 'Rahul Verma'),
  faculty: personRef(ids.ranganathan, 'faculty', 'Dr S. Ranganathan'),
  vendor: personRef(ids.anil, 'vendor', 'Anil Shetty'),
  reviewer: personRef(ids.menon, 'academic_reviewer', 'Prof. A. Menon'),
  contentManager: personRef(ids.kavya, 'content_manager', 'Kavya Nair'),
};

export function system<S extends SystemActor>(name: S): SystemActorRef<S> {
  return { kind: 'system', system: name };
}

export function institution(overrides: Partial<Institution> = {}): Institution {
  return {
    ...newMeta(T.oct8),
    id: ids.godavari,
    name: 'Godavari Institute of Technology',
    kind: 'external',
    createdFromRequestId: ids.req42,
    pause: null,
    instituteAdmin: {
      id: unsafeBrand('iaa-1'),
      institutionId: ids.godavari,
      name: 'Meera Iyer',
      workEmail: 'meera.iyer@godavari.edu.in',
      assignedAt: T.oct8,
      assignedBy: who.superAdmin,
      personId: ids.meera,
    },
    history: [],
    ...overrides,
  };
}

/** ACC-0107 · Shell-and-Tube Heat Exchanger · WEB, VR · 120 licences · Yearly, 8 Oct 2026 to 7 Oct 2027. */
export function plan(overrides: Partial<AccessPlan> = {}): AccessPlan {
  return {
    ...newMeta(T.oct8),
    id: ids.plan,
    institutionId: ids.godavari,
    sourceRequestId: ids.req42,
    items: [{ experimentId: ids.shell, formats: ['web', 'vr'] }],
    licences: provided(120),
    term: 'yearly',
    startsOn: calendarDate('2026-10-08'),
    endsOn: calendarDate('2027-10-07'),
    activatedAt: T.oct8,
    history: [],
    ...overrides,
  };
}

export function student(overrides: Partial<StudentPerson> = {}): StudentPerson {
  return {
    ...newMeta(T.oct8),
    kind: 'student',
    id: ids.rahul,
    institutionId: ids.godavari,
    fullName: 'Rahul Verma',
    institutionEmail: 'rahul.verma@godavari.edu.in',
    accountStatus: 'active',
    added: {
      at: T.oct8,
      by: who.instituteAdmin,
      how: 'import',
      importFileName: 'godavari-me-zg523.csv',
    },
    institutionStudentId: 'GIT-2026-0418',
    programme: 'B.E. Mechanical',
    courseFilings: [],
    deactivation: null,
    history: [],
    ...overrides,
  };
}

export function faculty(overrides: Partial<FacultyPerson> = {}): FacultyPerson {
  return {
    ...newMeta(T.oct8),
    kind: 'faculty',
    id: ids.ranganathan,
    institutionId: ids.godavari,
    fullName: 'Dr S. Ranganathan',
    institutionEmail: 's.ranganathan@godavari.edu.in',
    accountStatus: 'active',
    added: { at: T.oct8, by: who.instituteAdmin, how: 'form', importFileName: null },
    history: [],
    ...overrides,
  };
}

export function group(
  members: readonly {
    readonly id: PersonId;
    readonly addedAt?: IsoInstant;
    readonly removedAt?: IsoInstant | null;
  }[] = [],
  overrides: Partial<Group> = {},
): Group {
  return {
    ...newMeta(T.oct9),
    id: ids.grp12,
    institutionId: ids.godavari,
    name: 'ME ZG523 — Sem II',
    createdAt: T.oct9,
    createdBy: who.instituteAdmin,
    memberships: members.map((member) => ({
      studentId: member.id,
      addedAt: member.addedAt ?? T.oct9,
      addedBy: who.instituteAdmin,
      removedAt: member.removedAt ?? null,
      removedBy: member.removedAt ? who.instituteAdmin : null,
    })),
    history: [],
    ...overrides,
  };
}

export function grant(overrides: Partial<StudentAccessGrant> = {}): StudentAccessGrant {
  return {
    ...newMeta(T.oct9),
    id: ids.sacc310,
    institutionId: ids.godavari,
    accessPlanId: ids.plan,
    experimentId: ids.shell,
    target: { kind: 'student', studentId: ids.rahul },
    givenAt: T.oct9,
    givenBy: who.instituteAdmin,
    state: 'active',
    withdrawal: null,
    history: [],
    ...overrides,
  };
}

export function area(overrides: Partial<EngineeringArea> = {}): EngineeringArea {
  return {
    ...newMeta(T.aug14),
    id: ids.area,
    name: 'Mechanical & Manufacturing',
    description: null,
    artworkKey: null,
    history: [],
    ...overrides,
  };
}

export function course(overrides: Partial<Course> = {}): Course {
  return {
    ...newMeta(T.aug14),
    id: ids.course,
    areaId: ids.area,
    name: 'Thermodynamics & Heat Transfer',
    description: null,
    platformCode: unsafeBrand<PlatformCourseCode>('ME ZG523'),
    history: [],
    ...overrides,
  };
}

export function experiment(
  overrides: Partial<Experiment> = {},
  formats: readonly Technology[] = ['web', 'vr'],
): Experiment {
  const live = {
    label: '1.0',
    liveFrom: T.aug28,
    liveUntil: null,
    source: { kind: 'first-publication' as const, submissionId: null, revision: null },
    catalogue: {
      name: 'Shell-and-Tube Heat Exchanger',
      summary: 'Measure the overall heat-transfer coefficient.',
      description: 'A counter-flow shell-and-tube exchanger.',
    },
    formats: formats.map((format) =>
      format === 'web'
        ? {
            format,
            delivery: {
              format: 'web' as const,
              webLink: 'https://sim.example.org/shell',
              browserAndComputer: 'A current browser',
              notes: null,
            },
          }
        : {
            format,
            delivery: {
              format,
              packageLabel: `Shell — ${format.toUpperCase()} build 1.0`,
              packageReference: `MVL-SH-${format.toUpperCase()}-1.0`,
              packageFileName: null,
              deviceNeeded: 'Supported headset',
              installNotes: 'Install from the lab',
              notes: null,
            },
          },
    ),
    preview: null,
    documents: [],
  };
  return {
    ...newMeta(T.aug28),
    id: ids.shell,
    courseId: ids.course,
    originSubmissionId: null,
    vendorOrganisation: 'Northline Simulation Studio',
    artworkKey: null,
    live,
    versions: [live],
    learningOutcomes: [{ id: unsafeBrand('lo-1'), text: 'Explain counter-flow heat exchange.' }],
    resources: [
      {
        id: unsafeBrand('res-1'),
        title: 'Lab brief — Shell-and-Tube Heat Exchanger',
        kind: 'PDF document',
        sizeLabel: '6 pages',
        href: 'https://example.org/brief.pdf',
      },
    ],
    publishedAt: T.aug28,
    publishedBy: who.contentManager,
    openUpdateId: null,
    ...overrides,
  };
}

export function request(overrides: Partial<AccessRequest> = {}): AccessRequest {
  return {
    ...newMeta(T.oct2),
    id: ids.req42,
    statusToken: ids.token42,
    routeId: ids.route42,
    type: 'new-access',
    origin: 'public',
    institutionId: null,
    institutionName: 'Godavari Institute of Technology',
    contact: { person: 'Meera Iyer', email: 'meera.iyer@godavari.edu.in', phone: null },
    items: [{ experimentId: ids.shell, formats: ['web', 'vr'] }],
    licencesRequested: 120,
    term: { kind: 'yearly' },
    message: null,
    sourcePlanId: null,
    receivedAt: T.oct2,
    reviewStartedAt: null,
    status: 'under-review',
    route: null,
    decision: null,
    informationRequest: null,
    payments: [],
    activatedPlanId: null,
    history: [],
    ...overrides,
  };
}

export function holder(
  role: PlatformRole,
  targets: readonly ScopeTarget[] = [{ kind: 'course', courseId: ids.course }],
  overrides: Partial<PlatformRoleHolder> = {},
): PlatformRoleHolder {
  const base =
    role === 'vendor'
      ? {
          id: ids.holderAnil,
          personId: ids.anil,
          name: 'Anil Shetty',
          organisation: 'Northline Simulation Studio',
        }
      : role === 'academic_reviewer'
        ? {
            id: ids.holderMenon,
            personId: ids.menon,
            name: 'Prof. A. Menon',
            organisation: 'BITS Pilani',
          }
        : {
            id: ids.holderKavya,
            personId: ids.kavya,
            name: 'Kavya Nair',
            organisation: 'BITS Pilani',
          };
  return {
    ...newMeta(T.aug14),
    ...base,
    role,
    workEmail: `${base.name.toLowerCase().replace(/[^a-z]+/g, '.')}@example.org`,
    registeredAt: T.aug14,
    registeredBy: who.superAdmin,
    scopes: targets.map((target, index) => ({
      id: unsafeBrand<ScopeId>(`scope-${role}-${index}`),
      target,
      assignedAt: T.aug14,
      assignedBy: who.superAdmin,
      withdrawal: null,
      supersededAt: null,
    })),
    history: [],
    ...overrides,
  };
}

/** A complete four-step editor content (WEB + VR). */
export function content(overrides: Partial<SubmissionContent> = {}): SubmissionContent {
  return {
    courseId: ids.course,
    name: 'Conduction Through a Composite Wall',
    summary: 'Build a layered wall and measure its temperature profile.',
    description: 'Separate the contribution of each material.',
    version: '1.0',
    formats: ['web', 'vr'],
    delivery: {
      web: {
        format: 'web',
        webLink: 'https://sim.example.org/wall',
        browserAndComputer: 'A current browser',
        notes: null,
      },
      vr: {
        format: 'vr',
        packageLabel: 'Wall — VR build 1.0',
        packageReference: 'MVL-CW-VR-1.0',
        packageFileName: null,
        deviceNeeded: 'Supported VR headset',
        installNotes: 'Sideload in the lab',
        notes: null,
      },
    },
    preview: { label: null, link: null },
    documents: [],
    ...overrides,
  };
}

export function submission(
  status: SubmissionStatus,
  overrides: Partial<Submission> = {},
): Submission {
  return {
    ...newMeta(T.aug14),
    id: ids.sub77,
    vendorHolderId: ids.holderAnil,
    vendorOrganisation: 'Northline Simulation Studio',
    status,
    revision: 1,
    content: content(),
    learningOutcomes:
      status.state === 'with-content-manager' || status.state === 'published'
        ? [{ id: unsafeBrand('lo-9'), text: 'Explain conduction.' }]
        : [],
    lastStepReached: 'submit',
    reviewDecisions:
      status.state === 'with-content-manager'
        ? [
            {
              revision: 1,
              decision: 'approve',
              reason: null,
              references: [],
              outcomesAtDecision: [],
              wasRecheck: false,
              decidedAt: T.aug14,
              decidedBy: who.reviewer,
            },
          ]
        : [],
    contentManagerDecisions: [],
    overrides: [],
    firstSubmittedAt: status.state === 'draft' ? null : T.aug14,
    lastResubmittedAt: null,
    history: [],
    ...overrides,
  };
}

export function update(
  state: CorrectionUpdate['state'],
  overrides: Partial<CorrectionUpdate> = {},
  exp: Experiment = experiment(),
): CorrectionUpdate {
  return {
    ...newMeta(T.oct12),
    id: ids.upd5,
    experimentId: exp.id,
    baseVersionLabel: exp.live.label,
    state,
    entry: 'start-a-correction',
    proposed: { ...liveFields(exp), description: 'Corrects the reflux statement.' },
    whatChangesAndWhy: 'Corrects the reflux statement in the description.',
    versionLabel: '1.1',
    startedAt: T.oct12,
    startedBy: who.contentManager,
    sentForReviewAt: state === 'draft' ? null : T.oct12,
    reviewDecisions: [],
    hold:
      state === 'on-hold'
        ? { at: T.oct14, by: who.superAdmin, reason: 'Wait for the term to end.' }
        : null,
    holdLifts: [],
    release: null,
    withdrawal: null,
    history: [],
    ...overrides,
  };
}

export const RULES_READY: AssessmentRules = {
  passMarkPercent: 50,
  attemptsAllowed: 2,
  deadline: T.nov14,
  release: { option: 'after-deadline', releaseDate: null },
};

export function question(
  id: QuestionId,
  body: QuestionBody,
  marks: number,
  overrides: Partial<Question> = {},
): Question {
  return {
    ...newMeta(T.oct20),
    id,
    institutionId: ids.godavari,
    experimentId: ids.shell,
    text:
      id === ids.q101
        ? 'Which flow arrangement gives the higher LMTD?'
        : 'Explain why fouling lowers U.',
    body,
    marks,
    explanation: null,
    version: 1,
    versions: [{ version: 1, at: T.oct20, text: 'text', body, marks, explanation: null }],
    origin: 'written',
    addedAt: T.oct20,
    addedBy: who.faculty,
    deleted: null,
    ...overrides,
  };
}

export const QUESTIONS: readonly Question[] = [
  question(
    ids.q101,
    { type: 'multiple-choice', options: { A: 'Parallel', B: 'Counter' }, correct: 'B' },
    6,
  ),
  question(ids.q102, { type: 'written', markingGuidance: 'Mentions thermal resistance.' }, 10),
];

export function assessment(overrides: Partial<Assessment> = {}): Assessment {
  const questions = QUESTIONS.map((entry) => ({ questionId: entry.id, questionVersion: 1 }));
  return {
    ...newMeta(T.oct20),
    id: ids.asmt9,
    institutionId: ids.godavari,
    experimentId: ids.shell,
    name: 'Heat Exchanger — post-lab',
    introduction: null,
    rules: RULES_READY,
    questions,
    version: 1,
    versionSince: T.oct20,
    versions: [
      {
        version: 1,
        since: T.oct20,
        name: 'Heat Exchanger — post-lab',
        introduction: null,
        rules: RULES_READY,
        questions,
      },
    ],
    createdAt: T.oct20,
    createdBy: who.faculty,
    readySince: T.oct20,
    history: [],
    ...overrides,
  };
}

export function attempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    ...newMeta(T.nov5),
    id: unsafeBrand('ATT-0450'),
    assessmentId: ids.asmt9,
    assessmentVersion: 1,
    studentId: ids.rahul,
    attemptNumber: 1,
    state: 'in-progress',
    answers: {},
    startedAt: T.nov5,
    submittedAt: null,
    marking: { automatic: [], written: [], confirmed: null },
    ...overrides,
  };
}

export function device(overrides: Partial<AuthorisedDevice> = {}): AuthorisedDevice {
  return {
    studentId: ids.rahul,
    format: 'vr',
    description: 'ME lab VR headset, asset tag GIT-VR-03',
    usedFor: [ids.shell],
    since: T.oct9,
    viaTransferId: null,
    ...overrides,
  };
}

export function transfer(
  state: DeviceTransfer['state'],
  overrides: Partial<DeviceTransfer> = {},
): DeviceTransfer {
  return {
    ...newMeta(T.oct20),
    id: unsafeBrand('DTR-0018'),
    institutionId: ids.godavari,
    studentId: ids.rahul,
    format: 'vr',
    experimentId: ids.shell,
    fromDevice: 'ME lab VR headset, asset tag GIT-VR-03',
    newDevice: 'ME lab VR headset, asset tag GIT-VR-07',
    note: null,
    state,
    requestedAt: T.oct20,
    forwarded: state === 'with-institute-admin' ? null : { at: T.oct23, by: who.instituteAdmin },
    approved: state === 'approved' ? { at: T.oct23, by: who.superAdmin } : null,
    history: [],
    ...overrides,
  };
}

export function report(
  state: SupportReport['state'],
  overrides: Partial<SupportReport> = {},
): SupportReport {
  return {
    ...newMeta(T.oct2),
    id: ids.sup213,
    reporter: {
      personId: ids.rahul,
      role: 'student',
      displayName: 'Rahul Verma',
      institutionId: ids.godavari,
      organisation: null,
    },
    whatHappened: 'VR simulation stopped loading at step 2',
    where: 'My courses › Shell-and-Tube Heat Exchanger',
    screenshotFileName: null,
    state,
    sentAt: T.oct2,
    resolutions: [],
    reopenings: [],
    history: [],
    ...overrides,
  };
}

export function mapping(overrides: Partial<FacultyCourseMapping> = {}): FacultyCourseMapping {
  return {
    ...newMeta(T.oct9),
    id: unsafeBrand('FMAP-0021'),
    institutionId: ids.godavari,
    facultyId: ids.ranganathan,
    courseId: ids.course,
    assignedAt: T.oct9,
    assignedBy: who.instituteAdmin,
    removedAt: null,
    removedBy: null,
    ...overrides,
  };
}

/** A person's policy actor with the facts the policy reads. */
export function personActor(
  ref: PersonActorRef,
  facts: Partial<Omit<PersonActor, 'kind' | 'ref'>> = {},
): PersonActor {
  const tenant = ref.role === 'student' || ref.role === 'faculty' || ref.role === 'tenant_admin';
  return {
    kind: 'person',
    ref,
    institutionId: tenant ? ids.godavari : null,
    holder:
      ref.role === 'vendor'
        ? holder('vendor')
        : ref.role === 'academic_reviewer'
          ? holder('academic_reviewer')
          : ref.role === 'content_manager'
            ? holder('content_manager', [{ kind: 'all' }])
            : null,
    taughtExperiments: ref.role === 'faculty' ? [ids.shell] : [],
    ...facts,
  };
}

export function context(
  ref: PersonActorRef,
  facts: Partial<Omit<PersonActor, 'kind' | 'ref'>> = {},
  now: IsoInstant = T.oct14,
): PolicyContext {
  return { actor: personActor(ref, facts), now };
}

export function publicContext(
  requestTokens: readonly RequestStatusToken[] = [],
  now: IsoInstant = T.oct14,
): PolicyContext {
  const actor: PublicActor = { kind: 'public', requestTokens };
  return { actor, now };
}

/** Unwraps a decision expected to succeed; fails the test with the refusal otherwise. */
export function expectOk<T>(
  decision:
    { readonly ok: true; readonly value: T } | { readonly ok: false; readonly refusal: unknown },
): T {
  if (!decision.ok)
    throw new Error(`Expected the decision to succeed, got ${JSON.stringify(decision.refusal)}`);
  return decision.value;
}

/** The refusal of a decision expected to fail. */
export function refusalOf(decision: { readonly ok: boolean; readonly refusal?: unknown }): unknown {
  if (decision.ok) throw new Error('Expected a refusal, the decision succeeded.');
  return decision.refusal;
}

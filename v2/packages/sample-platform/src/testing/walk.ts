/**
 * The scripted walk (Appendix F §4.3): the boards' sample timeline replayed as real port commands
 * on the manual sample clock, in board-date order, from the spine-start world. Every record the
 * flows trace is created by the command the boards draw — REQ-0042, ACC-0107, SACC-0310,
 * ASMT-0009, ATT-0450, DTR-0018, SUB-0077, UPD-0005, SUP-0213, REQ-0058 — with the reserved ids.
 *
 * Timeline (sample times, Indian local time; Appendix C §4.2 conflicts resolved for one store):
 *  - Flows A–D and the device chain keep their drawn dates (2 Oct – 15 Nov 2026).
 *  - Flow E and the Content Manager / Academic Reviewer steps of Flow F are drawn in Aug 2026,
 *    before the spine-start anchor; because spine-start holds neither SUB-0077 nor UPD-0005 they
 *    move by exactly eight weeks (56 days — weekday and time kept): Flow E runs 6–23 Oct and
 *    UPD-0005 is sent on 20 Oct and approved on 22 Oct, so the Super Admin's drawn 23–24 Oct
 *    decisions (B7-05, B7-11) follow (S-5, S-6).
 *  - SUP-0213 is drawn "sent 3 Oct" by Rahul Verma, who is imported on 8 Oct; it moves to 16 Oct,
 *    after his first VR session (S-4). Times no board draws are marked "undrawn".
 *  - Background steps the B7 boards draw in the same period: SUP-0207 reopened (6 Oct), Deccan
 *    paused (12 Oct, 09:40), Dr K. Iyer registered (20 Oct).
 *
 * Fixture-supplied values (no product command writes them; each carries a seedNote): Prof. Ravi
 * Shankar's inactive account (PER-07 open) and Rahul's authorised VR device (no registry, D20b).
 * The resubmission is routed through the M-3 test seam and ATT-0450's choice marks are supplied
 * through the DV-2 seam. Priya Natarajan's ATT-0451 is not walked: she holds no grant on the walk
 * (her access is the later-sample group grant), so ASMT-0009 shows one attempt waiting (S-8).
 */
import type { ProductPorts, Result, ServiceError } from '@xr/contracts/draft';
import type { StandinPorts } from '@xr/contracts/draft/standins';
import {
  type AuthorisedDevice,
  type CourseId,
  type ExperimentId,
  type IsoInstant,
  type Person,
  type PersonId,
  type StudentImportRow,
  unsafeBrand,
} from '@xr/domain';

import { type Done, type Op, systemCommand } from '../pipeline/runner.js';
import { internalsOf, type SamplePlatform } from '../platform/create.js';
import { ist } from '../seed/book.js';
import { COURSE, EXPERIMENT } from '../seed/catalogue.js';
import { deviceKey } from '../world/records.js';
import {
  asPerson,
  personIdOf,
  type SampleSeams,
  seamsOf,
  setSampleNow,
  stageStudentImport,
  standinsOf,
  visitorPorts,
  worldOf,
} from './harness.js';

export type WalkFlow =
  | 'A'
  | 'B'
  | 'setup'
  | 'C'
  | 'D-prep'
  | 'D'
  | 'E'
  | 'F'
  | 'Device'
  | 'IA-17'
  | 'support'
  | 'background';

export interface WalkContext {
  readonly platform: SamplePlatform;
  /** The visitor who sent REQ-0042: their browser session holds its status ticket (PU-10). */
  readonly visitor: ProductPorts;
  readonly as: (name: string) => ProductPorts;
  readonly standins: StandinPorts;
  readonly seams: SampleSeams;
  readonly personId: (name: string) => PersonId;
  /** Values one step hands to a later one (the REQ-0042 status token). */
  readonly carried: Map<string, string>;
}

export interface WalkStep {
  readonly id: string;
  readonly flow: WalkFlow;
  readonly at: IsoInstant;
  readonly evidence: string;
  readonly run: (walk: WalkContext) => Promise<void> | void;
}

/** The value of a successful answer; a refused walk step is a broken walk and throws. */
export async function must<T>(
  answer: Result<T, ServiceError> | Promise<Result<T, ServiceError>>,
  what: string,
): Promise<T> {
  const result = await answer;
  if (!result.ok)
    throw new Error(`Walk step "${what}" was refused: ${JSON.stringify(result.error)}`);
  return result.value;
}

/** A value a fixture supplies that no product command writes (it carries a seedNote). */
function supply(walk: WalkContext, method: string, body: (op: Op) => Done<unknown>): void {
  const outcome = systemCommand(internalsOf(walk.platform).core, method, 'sample-fixture', body);
  if (!outcome.ok) throw new Error(`Fixture step ${method} was refused: ${outcome.current}`);
}

const SHELL = unsafeBrand<ExperimentId>(EXPERIMENT.shellAndTube);

const STUDENTS: readonly [string, string][] = [
  ['GIT-2026-0418', 'Rahul Verma'],
  ['GIT-2026-0431', 'Priya Natarajan'],
  ['GIT-2026-0377', 'Arun Kumar'],
  ['GIT-2026-0352', 'Sneha Reddy'],
  ['GIT-2026-0409', 'Imran Shaikh'],
  ['GIT-2026-0411', 'Divya Menon'],
  ['GIT-2026-0415', 'Karthik Rao'],
  ['GIT-2026-0421', 'Lakshmi Prasad'],
  ['GIT-2026-0426', 'Vikram Joshi'],
  ['GIT-2026-0430', 'Fatima Begum'],
  ['GIT-2026-0436', 'Nikhil Bose'],
  ['GIT-2026-0440', 'Ananya Das'],
];

const GROUP_MEMBERS = [
  'Rahul Verma',
  'Priya Natarajan',
  'Arun Kumar',
  'Sneha Reddy',
  'Imran Shaikh',
  'Divya Menon',
  'Karthik Rao',
];

const emailOf = (name: string) => `${name.toLowerCase().replace(/\s+/g, '.')}@godavari.edu.in`;

/** SUB-0077 as Anil Shetty sends it (B5-03 … B5-05); revision 2 changes the VR device need (B6-03). */
function compositeWall(vrDevice: string) {
  return {
    courseId: unsafeBrand<CourseId>(COURSE.thermo),
    name: 'Conduction Through a Composite Wall',
    summary:
      'Measure the temperature profile across a three-layer wall and compare it with the series-resistance model.',
    description:
      'Learners build a wall from three layers — brick, insulation and plaster — set the hot-side and cold-side temperatures, and read the temperature at each interface. They compare the measured profile and heat flux with the series thermal-resistance model and explain where the two differ.',
    version: '1.0',
    formats: ['web', 'vr'] as ('web' | 'vr')[],
    delivery: {
      web: {
        format: 'web' as const,
        webLink: 'https://labs.northline.example/composite-wall',
        browserAndComputer:
          'A current Chrome, Edge, Firefox or Safari on a laptop or desktop, with a keyboard and mouse',
        notes: null,
      },
      vr: {
        format: 'vr' as const,
        packageLabel: 'Composite Wall — VR build 1.0',
        packageReference: null,
        packageFileName: 'composite-wall-vr-1.0.zip',
        deviceNeeded: vrDevice,
        installNotes:
          'Install the build named above on the headset and open “Composite Wall Lab”. On first launch, set the play-area boundary.',
        notes: null,
      },
    },
    preview: {
      label: 'Two-minute walkthrough',
      link: 'https://media.northline.example/composite-wall-walkthrough',
    },
    documents: [
      { fileName: 'Lab handout — Composite Wall.pdf' },
      { fileName: 'Thermocouple positions.pdf' },
    ],
  };
}

const VR_DEVICE_REVISED =
  'Standalone VR headset — no PC or cable needed — and about 2 × 2 m of clear floor';

/** The Shell-and-Tube question bank (B4-07; B4-09 options and explanations). */
const BANK = [
  {
    at: '2026-10-20 16:30',
    type: 'multiple-choice' as const,
    text: 'What does the effectiveness (ε) of a heat exchanger compare?',
    options: {
      A: 'The actual heat transfer with the largest heat transfer possible',
      B: 'The hot-side flow rate with the cold-side flow rate',
      C: 'The overall heat transfer coefficient with the surface area',
      D: 'The hot fluid’s inlet temperature with its outlet temperature',
    },
    correct: 'A',
    marks: '2',
    explanation: 'ε = q ÷ q_max, where q_max = C_min (T_h,in − T_c,in).',
  },
  {
    at: '2026-10-20 16:40',
    type: 'multiple-choice' as const,
    text: 'How is the number of transfer units (NTU) defined?',
    options: { A: 'UA ÷ C_min', B: 'C_min ÷ C_max', C: 'q ÷ q_max', D: 'UA ÷ C_max' },
    correct: 'A',
    marks: '2',
    explanation:
      'NTU = UA ÷ C_min — the exchanger’s size measured against the smaller heat-capacity rate.',
  },
  {
    // B4-07 draws the text, type and marks only; the options and the answer are a sample fill.
    at: '2026-10-21 10:00',
    type: 'multiple-choice' as const,
    text: 'In a counter-flow exchanger, what can happen that cannot happen in parallel flow?',
    options: {
      A: 'The cold fluid can leave hotter than the hot fluid leaves',
      B: 'Both fluids can leave at their inlet temperatures',
      C: 'The heat duty can exceed the heat available from the hot fluid',
    },
    correct: 'A',
    marks: '2',
    explanation: null,
  },
  {
    at: '2026-10-21 10:10',
    type: 'true-false' as const,
    text: 'Fouling on the tube surfaces lowers the overall heat transfer coefficient U.',
    options: {},
    correct: 'true',
    marks: '2',
    explanation: 'Fouling adds a thermal resistance in series, so U falls.',
  },
  {
    // B4-07 draws the text, type and marks only; the answer is a sample fill.
    at: '2026-10-21 10:20',
    type: 'true-false' as const,
    text: 'For the same inlet conditions and UA, parallel flow transfers more heat than counter flow.',
    options: {},
    correct: 'false',
    marks: '2',
    explanation: null,
  },
  {
    at: '2026-10-22 10:00',
    type: 'written' as const,
    text: 'Explain how fouling changes the exchanger’s performance, using what you observed in the simulation.',
    options: {},
    correct: null,
    marks: '10',
    explanation:
      'Fouling adds a resistance, so U and the heat duty fall at the same flow rates: the hot fluid leaves hotter and the cold fluid leaves cooler.',
    guidance:
      'Look for: fouling adds a thermal resistance; U falls; at the same flow rates the heat duty and the effectiveness fall; the outlet temperatures move towards their inlet values. Give credit for linking this to readings taken in the simulation, and for mentioning cleaning or a fouling allowance in design.',
  },
];

const RAHUL_WRITTEN =
  'In the WEB run I turned the fouling up and kept both flow rates the same. The hot fluid left hotter than before and the cold fluid left cooler, so less heat was passed across. Fouling is an extra layer of resistance, so U goes down and the effectiveness goes down with it. That is why exchangers are cleaned, or designed with extra area.';

const step = (
  id: string,
  flow: WalkFlow,
  at: string,
  evidence: string,
  run: WalkStep['run'],
): WalkStep => ({ id, flow, at: ist(at), evidence, run });

/** The walk's steps, in board-date order. */
export const WALK_STEPS: readonly WalkStep[] = [
  step(
    'A2',
    'A',
    '2026-10-02 10:14',
    'flows.json A1–A2; B1-05 … B1-07; B1-11 "received 2 Oct 2026, 10:14"',
    async (walk) => {
      await must(
        walk.visitor.selection.add({ experimentId: SHELL, formats: ['web', 'vr'] }),
        'A1 add to selection',
      );
      const sent = await must(
        walk.visitor.accessRequests.submitPublicRequest({
          institutionName: 'Godavari Institute of Technology',
          contactPerson: 'Meera Iyer',
          email: 'meera.iyer@godavari.edu.in',
          phone: null,
          licencesRequested: '120',
          message:
            'We would like to start with the heat exchanger lab for our ME ZG523 cohort this term, in the browser and in VR.',
          term: { kind: 'yearly' },
        }),
        'A2 send the request',
      );
      walk.carried.set('requestToken', sent.statusToken);
    },
  ),
  step(
    'bg-SUP-0207',
    'background',
    '2026-10-06 10:00',
    'B7-09 SUP-0207 "Reopened · 6 Oct 2026" (undrawn time)',
    async (walk) => {
      const admin = walk.as('Arjun Mehta');
      const report = await must(
        admin.operations.getMyReport(unsafeBrand('SUP-0207')),
        'read SUP-0207',
      );
      await must(
        admin.operations.reopenReport({ id: report.id, expectedRev: report.rev }),
        'reopen SUP-0207',
      );
    },
  ),
  step(
    'E1-save',
    'E',
    '2026-10-06 17:40',
    'B5-03 "Draft saved · 11 Aug 2026, 17:40" (+56 days)',
    async (walk) => {
      await must(
        walk.as('Anil Shetty').production.saveDraft({
          id: null,
          content: compositeWall('VR headset'),
          step: 'course',
          expectedRev: null,
        }),
        'E1 save draft',
      );
    },
  ),
  step(
    'E1-submit',
    'E',
    '2026-10-07 10:52',
    'B5-05 "Submitted for academic review · 12 Aug 2026, 10:52" (+56 days)',
    async (walk) => {
      const vendor = walk.as('Anil Shetty');
      const record = await must(vendor.production.getRecord(unsafeBrand('SUB-0077')), 'E1 VE-07');
      await must(
        vendor.production.submitForReview({
          id: record.submission.id,
          content: compositeWall('VR headset'),
          expectedRev: record.submission.rev,
        }),
        'E1 submit for review',
      );
    },
  ),
  step(
    'A3',
    'A',
    '2026-10-08 11:20',
    'flows.json A3; B1-11; B7-03 "REQ-0042 approved — payment required · 8 Oct 2026, 11:20"',
    async (walk) => {
      const admin = walk.as('Arjun Mehta');
      const page = await must(
        admin.accessRequests.getRequestForDecision(unsafeBrand('REQ-0042')),
        'A3 SA-03',
      );
      await must(
        admin.accessRequests.approveRequest({
          id: page.request.id,
          route: 'external',
          expectedRev: page.request.rev,
        }),
        'A3 approve',
      );
    },
  ),
  step(
    'A4-pay',
    'A',
    '2026-10-08 14:55',
    'flows.json A4; B1-08 "Continue to payment" (undrawn time)',
    async (walk) => {
      const token = walk.carried.get('requestToken')!;
      const status = await must(
        walk.visitor.accessRequests.getRequestStatus(unsafeBrand(token)),
        'A4 PU-10',
      );
      await must(
        walk.visitor.accessRequests.startPayment({
          by: 'status-token',
          token: unsafeBrand(token),
          expectedRev: status.rev,
        }),
        'A4 start payment',
      );
    },
  ),
  step(
    'A4-confirm',
    'A',
    '2026-10-08 15:05',
    'flows.json A4; B2-13 step 1 "ACC-0107 · Access active · 8 Oct 2026, 15:05"',
    async (walk) => {
      await must(
        walk.standins.paymentOutcome.report({
          requestId: unsafeBrand('REQ-0042'),
          outcome: 'confirmed',
        }),
        'A4 payment confirmed',
      );
    },
  ),
  step(
    'B1',
    'B',
    '2026-10-08 15:20',
    'flows.json B1; B7-03 "Institute Admin assigned — Meera Iyer · 8 Oct 2026, 15:20"',
    async (walk) => {
      const admin = walk.as('Arjun Mehta');
      const detail = await must(
        admin.institutions.getInstitution(unsafeBrand('godavari')),
        'B1 SA-07',
      );
      await must(
        admin.institutions.assignInstituteAdmin({
          institutionId: detail.institution.id,
          name: 'Meera Iyer',
          workEmail: 'meera.iyer@godavari.edu.in',
          expectedRev: detail.institution.rev,
        }),
        'B1 assign Meera Iyer',
      );
    },
  ),
  step(
    'S1',
    'setup',
    '2026-10-08 15:40',
    'Appendix F S1 "students imported 8 Oct 2026"; B2-07 godavari-me-zg523-corrected.csv (undrawn time)',
    async (walk) => {
      const rows: StudentImportRow[] = STUDENTS.map(([studentId, fullName], index) => ({
        row: index + 2,
        studentId,
        fullName,
        email: emailOf(fullName),
        programme: 'B.Tech Mechanical',
        course: 'Thermodynamics & Heat Transfer',
        courseCode: 'ME ZG523',
      }));
      const batchId = stageStudentImport(walk.platform, {
        institutionId: 'godavari',
        fileName: 'godavari-me-zg523-corrected.csv',
        rows,
      });
      await must(
        walk.as('Meera Iyer').people.commitStudentImport({ batchId: unsafeBrand(batchId) }),
        'S1 import',
      );
    },
  ),
  step(
    'S2',
    'setup',
    '2026-10-08 15:45',
    'Appendix F S2 "Sneha Reddy inactive"; B2-06 (reason undrawn)',
    async (walk) => {
      const ia = walk.as('Meera Iyer');
      const id = walk.personId('Sneha Reddy');
      const record = await must(ia.people.getStudent(id), 'S2 IA-07');
      await must(
        ia.people.deactivateStudent({
          id,
          reason: 'Left the programme.',
          expectedRev: record.student.rev,
        }),
        'S2 deactivate Sneha',
      );
    },
  ),
  step(
    'S3',
    'setup',
    '2026-10-08 15:50',
    'Appendix F S3 "Faculty ×3"; B2-06 FC, B2-09',
    async (walk) => {
      const ia = walk.as('Meera Iyer');
      for (const fullName of ['Dr S. Ranganathan', 'Dr Anita Desai', 'Prof. Ravi Shankar']) {
        const email =
          fullName === 'Dr S. Ranganathan'
            ? 's.ranganathan@godavari.edu.in'
            : fullName === 'Dr Anita Desai'
              ? 'anita.desai@godavari.edu.in'
              : 'ravi.shankar@godavari.edu.in';
        await must(
          ia.people.addFaculty({ fullName, institutionEmail: email }),
          `S3 add ${fullName}`,
        );
      }
    },
  ),
  step(
    'S3-ravi',
    'setup',
    '2026-10-08 15:55',
    'B2-06 FC "Prof. Ravi Shankar · inactive" — a seeded value: Faculty deactivation is not designed (PER-07)',
    (walk) => {
      const id = walk.personId('Prof. Ravi Shankar');
      supply(walk, 'fixture.facultyInactive', (op) => {
        const person = op.found(op.records.people[id]) as Person;
        op.tx.put('people', id, {
          ...person,
          rev: person.rev + 1,
          updatedAt: op.now,
          accountStatus: 'inactive',
        });
        op.note(`PER:${id}`, {
          evidence: 'B2-06 FC; Appendix F S3',
          note: 'Inactive as drawn — PER-07 (Faculty deactivation) is open, so no command writes it',
        });
        return { value: null, decision: 'supplyFacultyStatus', actor: null };
      });
    },
  ),
  step('S4', 'setup', '2026-10-08 16:00', 'Appendix F "FMAP-0021"; B2-09', async (walk) => {
    await must(
      walk.as('Meera Iyer').facultyCourses.assign({
        facultyId: walk.personId('Dr S. Ranganathan'),
        courseId: unsafeBrand(COURSE.thermo),
      }),
      'S4 FMAP-0021',
    );
  }),
  step(
    'S5',
    'setup',
    '2026-10-08 16:05',
    'Appendix F "GRP-0012"; B2-08 "ME ZG523 — Sem II" (7 members)',
    async (walk) => {
      const ia = walk.as('Meera Iyer');
      const group = await must(
        ia.groups.createGroup({ name: 'ME ZG523 — Sem II' }),
        'S5 create group',
      );
      await must(
        ia.groups.addMembers({
          id: group.id,
          studentIds: GROUP_MEMBERS.map((name) => walk.personId(name)),
          expectedRev: group.rev,
        }),
        'S5 add members',
      );
    },
  ),
  step(
    'S6',
    'setup',
    '2026-10-08 16:10',
    'Appendix F "MEC-523"; B2-03 "MEC-523 · Sem II"',
    async (walk) => {
      await must(
        walk.as('Meera Iyer').institutionCourseCodes.set({
          courseId: unsafeBrand(COURSE.thermo),
          code: 'MEC-523',
          semester: 'Sem II',
          expectedRev: null,
        }),
        'S6 MEC-523',
      );
    },
  ),
  step(
    'S7',
    'setup',
    '2026-10-08 16:15',
    'Appendix F S7 "Rahul’s authorised VR device as a seeded value"; B3-07',
    (walk) => {
      const rahul = walk.personId('Rahul Verma');
      supply(walk, 'fixture.authorisedDevice', (op) => {
        const device: AuthorisedDevice = {
          studentId: rahul,
          format: 'vr',
          description: 'ME lab VR headset, asset tag GIT-VR-03',
          usedFor: [SHELL],
          since: op.now,
          viaTransferId: null,
        };
        const key = deviceKey(rahul, 'vr');
        op.tx.put('devices', key, device);
        op.note(`DTR:${key}`, {
          evidence: 'B3-07; Appendix F S7',
          note: 'Authorised device supplied by the fixture — no device registry is designed (D20b)',
        });
        return { value: device, decision: 'supplyAuthorisedDevice', actor: null };
      });
    },
  ),
  step(
    'B3',
    'B',
    '2026-10-09 10:20',
    'flows.json B3; B2-13 step 7 "SACC-0310 · Active · given 9 Oct 2026, 10:20"',
    async (walk) => {
      const ia = walk.as('Meera Iyer');
      const plan = await must(ia.institutions.getAccessPlan(unsafeBrand('ACC-0107')), 'B3 IA-03');
      await must(
        ia.studentAccess.giveAccess({
          experimentIds: [SHELL],
          target: { kind: 'student', studentId: walk.personId('Rahul Verma') },
          expectedPlanRev: plan.plan.rev,
        }),
        'B3 give Rahul access',
      );
    },
  ),
  step(
    'bg-deccan-pause',
    'background',
    '2026-10-12 09:40',
    'B7-03 deccan "Access paused by Arjun Mehta · 12 Oct 2026, 09:40"',
    async (walk) => {
      const admin = walk.as('Arjun Mehta');
      const detail = await must(
        admin.institutions.getInstitution(unsafeBrand('deccan')),
        'SA-07 Deccan',
      );
      await must(
        admin.institutions.pauseInstitution({
          institutionId: detail.institution.id,
          reason: 'The institution asked us to pause access while it checks its student list.',
          expectedRev: detail.institution.rev,
        }),
        'pause Deccan',
      );
    },
  ),
  step(
    'C1',
    'C',
    '2026-10-12 09:40',
    'flows.json C1; B3-01 resources — "res" 12 Oct 2026, 09:40',
    async (walk) => {
      await must(
        walk
          .as('Rahul Verma')
          .learning.openResource({ resourceId: unsafeBrand('res-shell-brief') }),
        'C1 open the lab brief',
      );
    },
  ),
  step(
    'C2-launch',
    'C',
    '2026-10-12 10:05',
    'flows.json C2; B3-03 "web_open" 12 Oct 2026, 10:05',
    async (walk) => {
      await must(
        walk.as('Rahul Verma').learning.launchWebFormat({ experimentId: SHELL }),
        'C2 launch WEB',
      );
      await must(
        walk.standins.runtimeReport.reportActivity({
          studentId: walk.personId('Rahul Verma'),
          experimentId: SHELL,
          format: 'web',
          kind: 'opened',
          at: ist('2026-10-12 10:05'),
        }),
        'C2 WEB opened',
      );
    },
  ),
  step(
    'C2-saved',
    'C',
    '2026-10-12 11:20',
    'B3-05 "WEB · In progress · 12 Oct 2026, 11:20"',
    async (walk) => {
      await must(
        walk.standins.runtimeReport.reportActivity({
          studentId: walk.personId('Rahul Verma'),
          experimentId: SHELL,
          format: 'web',
          kind: 'saved',
          at: ist('2026-10-12 11:20'),
        }),
        'C2 WEB saved',
      );
    },
  ),
  step(
    'C2-web-done',
    'C',
    '2026-10-14 15:30',
    'B3-05 "web_done" 14 Oct 2026, 15:30 — reported by the simulation',
    async (walk) => {
      await must(
        walk.standins.runtimeReport.reportCompletion({
          studentId: walk.personId('Rahul Verma'),
          experimentId: SHELL,
          format: 'web',
          at: ist('2026-10-14 15:30'),
          from: 'simulation',
        }),
        'C2 WEB completed',
      );
    },
  ),
  step(
    'C3-web',
    'C',
    '2026-10-14 15:42',
    'flows.json C3; B3-06 "fb_web" 14 Oct 2026, 15:42 (ratings undrawn)',
    async (walk) => {
      await must(
        walk.as('Rahul Verma').feedback.sendFeedback({
          experimentId: SHELL,
          format: 'web',
          ratings: [5, 4, 4, 5, 4],
          comments: null,
        }),
        'C3 WEB feedback',
      );
    },
  ),
  step(
    'E2-return',
    'E',
    '2026-10-14 16:05',
    'B6-03 "Returned with a reason · 19 Aug 2026, 16:05" (+56 days)',
    async (walk) => {
      const reviewer = walk.as('Prof. A. Menon');
      const view = await must(
        reviewer.production.getSubmissionForReview(unsafeBrand('SUB-0077')),
        'E2 RV-03',
      );
      await must(
        reviewer.production.returnSubmission({
          id: view.submission.id,
          reason: 'Please clarify the VR device requirements.',
          references: [{ step: 'formats-and-delivery', format: 'vr', field: 'device-need' }],
          outcomes: [],
          expectedRev: view.submission.rev,
        }),
        'E2 return to the vendor',
      );
    },
  ),
  step(
    'C2-vr-session',
    'C',
    '2026-10-16 14:10',
    'B3-04 "Last session reported 16 Oct 2026, 14:10"',
    async (walk) => {
      await must(
        walk.standins.runtimeReport.reportActivity({
          studentId: walk.personId('Rahul Verma'),
          experimentId: SHELL,
          format: 'vr',
          kind: 'session',
          at: ist('2026-10-16 14:10'),
        }),
        'C2 VR session',
      );
    },
  ),
  step(
    'SUP-0213',
    'support',
    '2026-10-16 15:00',
    'Board 07 / B7-09 SUP-0213 (drawn 3 Oct; moved after the first VR session, S-4)',
    async (walk) => {
      await must(
        walk.as('Rahul Verma').operations.reportProblem({
          whatHappened: 'The VR simulation stopped loading at the second step.',
          where: 'ME ZG523 · Shell-and-Tube Heat Exchanger · Simulation · VR',
          screenshotFileName: null,
        }),
        'SUP-0213 report a problem',
      );
    },
  ),
  step(
    'bg-k-iyer',
    'background',
    '2026-10-20 10:00',
    'B7-08 "Dr K. Iyer · registered 20 Oct 2026 · no scope yet" (undrawn time)',
    async (walk) => {
      await must(
        walk.as('Arjun Mehta').platformRoles.registerHolder({
          role: 'academic_reviewer',
          name: 'Dr K. Iyer',
          workEmail: 'k.iyer@wilp.example',
          organisation: 'BITS Pilani · WILP',
        }),
        'register Dr K. Iyer',
      );
    },
  ),
  step(
    'C2-vr-done',
    'C',
    '2026-10-20 11:15',
    'B3-05 "vr_done" 20 Oct 2026, 11:15 — reported from the headset',
    async (walk) => {
      await must(
        walk.standins.runtimeReport.reportCompletion({
          studentId: walk.personId('Rahul Verma'),
          experimentId: SHELL,
          format: 'vr',
          at: ist('2026-10-20 11:15'),
          from: 'headset',
        }),
        'C2 VR completed',
      );
    },
  ),
  step(
    'C3-vr',
    'C',
    '2026-10-20 11:30',
    'B3-06 "fb_vr" 20 Oct 2026, 11:30 (ratings undrawn)',
    async (walk) => {
      await must(
        walk.as('Rahul Verma').feedback.sendFeedback({
          experimentId: SHELL,
          format: 'vr',
          ratings: [4, 4, 5, 4, 5],
          comments: null,
        }),
        'C3 VR feedback',
      );
    },
  ),
  step(
    'F1-open',
    'F',
    '2026-10-20 15:40',
    'B6-09 "Correction started from Edit catalogue details · 25 Aug 2026, 15:40" (+56 days)',
    async (walk) => {
      await must(
        walk.as('Kavya Nair').corrections.openCorrection({
          experimentId: unsafeBrand(EXPERIMENT.distillation),
          entry: 'edit-catalogue-details',
        }),
        'F1 open UPD-0005',
      );
    },
  ),
  step('F1-save', 'F', '2026-10-20 15:55', 'B6-09 UPD-0005 draft (undrawn time)', async (walk) => {
    const cm = walk.as('Kavya Nair');
    const draft = await must(cm.corrections.getUpdate(unsafeBrand('UPD-0005')), 'F1 CM-08');
    await must(
      cm.corrections.saveCorrection({
        id: draft.update.id,
        proposed: {
          ...draft.update.proposed,
          description:
            'Learners start a binary column from cold and bring it to steady state. They then change the reflux ratio and watch the overhead purity respond with realistic lag. Raising the reflux ratio raises the overhead purity, at the cost of more reboiler heat.',
          webLink: 'https://labs.meridian.example/distillation-column-1-3',
        },
        whatChangesAndWhy:
          'Corrects the reflux statement in the description: raising the reflux ratio raises overhead purity — v1.2 says the opposite. The web link moves to build 1.3, which carries the same correction in its on-screen notes.',
        versionLabel: '1.3',
        expectedRev: draft.update.rev,
      }),
      'F1 save the correction',
    );
  }),
  step(
    'F1-send',
    'F',
    '2026-10-20 16:00',
    'B6-09 "Sent for academic review · 25 Aug 2026, 16:00" (+56 days)',
    async (walk) => {
      const cm = walk.as('Kavya Nair');
      const draft = await must(cm.corrections.getUpdate(unsafeBrand('UPD-0005')), 'F1 CM-08');
      await must(
        cm.corrections.sendForAcademicReview({
          id: draft.update.id,
          expectedRev: draft.update.rev,
        }),
        'F1 send',
      );
    },
  ),
  ...BANK.slice(0, 2).map((question, index) =>
    step(
      `D0-Q-010${index + 1}`,
      'D-prep',
      question.at,
      'B4-07 question bank (undrawn time)',
      (walk) => addQuestion(walk, question),
    ),
  ),
  ...BANK.slice(2, 5).map((question, index) =>
    step(
      `D0-Q-010${index + 3}`,
      'D-prep',
      question.at,
      'B4-07 question bank (undrawn time)',
      (walk) => addQuestion(walk, question),
    ),
  ),
  step(
    'E2-revise',
    'E',
    '2026-10-21 11:12',
    'B5-07 "Changes saved · 26 Aug 2026, 11:12 · not resubmitted yet" (+56 days)',
    async (walk) => {
      const vendor = walk.as('Anil Shetty');
      const record = await must(vendor.production.getRecord(unsafeBrand('SUB-0077')), 'E2 VE-07');
      await must(
        vendor.production.saveRevision({
          id: record.submission.id,
          content: compositeWall(VR_DEVICE_REVISED),
          expectedRev: record.submission.rev,
        }),
        'E2 save the revision',
      );
    },
  ),
  step(
    'E2-resubmit',
    'E',
    '2026-10-21 11:30',
    'B5-07 "Submitted · revision 2 · 26 Aug 2026, 11:30" (+56 days)',
    async (walk) => {
      const vendor = walk.as('Anil Shetty');
      const record = await must(vendor.production.getRecord(unsafeBrand('SUB-0077')), 'E2 VE-08');
      await must(
        vendor.production.resubmit({
          id: record.submission.id,
          content: compositeWall(VR_DEVICE_REVISED),
          expectedRev: record.submission.rev,
        }),
        'E2 resubmit',
      );
    },
  ),
  step(
    'E2-route',
    'E',
    '2026-10-21 11:31',
    'B5-08 "Routed by the approved workflow rule · 26 Aug 2026, 11:31" (M-3 seam)',
    (walk) => {
      walk.seams.routeResubmission('SUB-0077');
    },
  ),
  step(
    'IA-17',
    'IA-17',
    '2026-10-21 16:05',
    'B3-08 / B7-03 "REQ-0058 — 60 more licences · 21 Oct 2026, 16:05"',
    async (walk) => {
      await must(
        walk.as('Meera Iyer').accessRequests.submitAdditionalLicencesRequest({
          planId: unsafeBrand('ACC-0107'),
          experimentIds: [SHELL],
          licences: '60',
          message: null,
        }),
        'IA-17 REQ-0058',
      );
    },
  ),
  step(
    'Dv1',
    'Device',
    '2026-10-22 09:10',
    'flows.json Device 1; B3-07 "dtr" 22 Oct 2026, 09:10',
    async (walk) => {
      await must(
        walk.as('Rahul Verma').operations.requestDeviceTransfer({
          newDevice: 'ME lab VR headset, asset tag GIT-VR-07',
          note: 'GIT-VR-03 has gone for repair; the lab gave me GIT-VR-07.',
        }),
        'Dv1 request a transfer',
      );
    },
  ),
  step('D0-Q-0106', 'D-prep', BANK[5]!.at, 'B4-07 question bank (undrawn time)', (walk) =>
    addQuestion(walk, BANK[5]!),
  ),
  step(
    'F2-approve',
    'F',
    '2026-10-22 11:20',
    'B6-04 "approved · 27 Aug 2026, 11:20" (+56 days)',
    async (walk) => {
      const reviewer = walk.as('Prof. A. Menon');
      const view = await must(
        reviewer.corrections.getUpdateForReview(unsafeBrand('UPD-0005')),
        'F2 RV-04',
      );
      await must(
        reviewer.corrections.approveUpdate({ id: view.update.id, expectedRev: view.update.rev }),
        'F2 approve',
      );
    },
  ),
  step(
    'E3-approve',
    'E',
    '2026-10-22 15:20',
    'B6-03 "Approved by the Academic Reviewer · 27 Aug 2026, 15:20" (+56 days)',
    async (walk) => {
      const reviewer = walk.as('Prof. A. Menon');
      const view = await must(
        reviewer.production.getSubmissionForReview(unsafeBrand('SUB-0077')),
        'E3 RV-03',
      );
      await must(
        reviewer.production.approveSubmission({
          id: view.submission.id,
          outcomes: [
            'Explain conduction through layers in series using thermal resistance.',
            'Predict interface temperatures from layer properties.',
            'Compare measured and predicted heat flux and explain the difference.',
          ],
          expectedRev: view.submission.rev,
        }),
        'E3 approve',
      );
    },
  ),
  step(
    'Dv2',
    'Device',
    '2026-10-23 10:00',
    'flows.json Device 2; B3-09 "fwd" 23 Oct 2026, 10:00',
    async (walk) => {
      const ia = walk.as('Meera Iyer');
      const requests = await must(ia.operations.listDeviceRequests({}), 'Dv2 IA-18');
      const transfer = requests.find((entry) => entry.id === 'DTR-0018')!;
      await must(
        ia.operations.forwardDeviceTransfer({ id: transfer.id, expectedRev: transfer.rev }),
        'Dv2 forward',
      );
    },
  ),
  step(
    'E4-publish',
    'E',
    '2026-10-23 10:05',
    'B6-12 "Published by the Content Manager · 28 Aug 2026, 10:05" (+56 days)',
    async (walk) => {
      const cm = walk.as('Kavya Nair');
      const decision = await must(
        cm.production.getPublicationDecision(unsafeBrand('SUB-0077')),
        'E4 CM-03',
      );
      await must(
        cm.production.publish({ id: decision.submission.id, expectedRev: decision.submission.rev }),
        'E4 publish',
      );
    },
  ),
  step(
    'F3-hold',
    'F',
    '2026-10-23 10:30',
    'B7-11 hold (U7 times: 23 Oct 2026, 10:30; reason undrawn)',
    async (walk) => {
      const admin = walk.as('Arjun Mehta');
      const view = await must(
        admin.corrections.getUpdateDecision(unsafeBrand('UPD-0005')),
        'F3 SA-11',
      );
      await must(
        admin.corrections.holdUpdate({
          id: view.update.id,
          reason: 'Wait for the lab to confirm the new build.',
          expectedRev: view.update.rev,
        }),
        'F3 hold',
      );
    },
  ),
  step(
    'F3-lift',
    'F',
    '2026-10-23 15:10',
    'B7-11 lift hold (U7 times: 23 Oct 2026, 15:10)',
    async (walk) => {
      const admin = walk.as('Arjun Mehta');
      const view = await must(
        admin.corrections.getUpdateDecision(unsafeBrand('UPD-0005')),
        'F3 SA-11',
      );
      await must(
        admin.corrections.liftHold({ id: view.update.id, expectedRev: view.update.rev }),
        'F3 lift hold',
      );
    },
  ),
  step(
    'F4-release',
    'F',
    '2026-10-24 09:45',
    'B7-11 release (U7 times: 24 Oct 2026, 09:45)',
    async (walk) => {
      const admin = walk.as('Arjun Mehta');
      const view = await must(
        admin.corrections.getUpdateDecision(unsafeBrand('UPD-0005')),
        'F4 SA-11',
      );
      await must(
        admin.corrections.releaseUpdate({ id: view.update.id, expectedRev: view.update.rev }),
        'F4 release',
      );
    },
  ),
  step(
    'Dv3',
    'Device',
    '2026-10-24 12:30',
    'flows.json Device 3; B3-11 "appr" 24 Oct 2026, 12:30',
    async (walk) => {
      const admin = walk.as('Arjun Mehta');
      const transfers = await must(admin.operations.listDeviceTransfers({}), 'Dv3 SA-18');
      const transfer = transfers.find((entry) => entry.id === 'DTR-0018')!;
      await must(
        admin.operations.approveDeviceTransfer({ id: transfer.id, expectedRev: transfer.rev }),
        'Dv3 approve',
      );
    },
  ),
  step(
    'D1',
    'D',
    '2026-10-27 10:00',
    'flows.json D1; B4-14 "ASMT-0009 created · 27 Oct 2026" (undrawn time)',
    async (walk) => {
      await must(
        walk.as('Dr S. Ranganathan').assessments.createAssessment({
          mode: 'create',
          experimentId: SHELL,
          name: 'Heat Exchanger — post-lab',
          introduction: null,
          rules: {
            passMarkPercent: '50',
            attemptsAllowed: '2',
            deadline: '2026-11-14T23:59:00+05:30',
            releaseOption: 'after-deadline',
            releaseDate: null,
          },
          questions: [
            unsafeBrand('Q-0101'),
            unsafeBrand('Q-0102'),
            unsafeBrand('Q-0104'),
            unsafeBrand('Q-0106'),
          ],
        }),
        'D1 create ASMT-0009',
      );
    },
  ),
  step(
    'D2',
    'D',
    '2026-11-05 18:20',
    'flows.json D2; B4-12 "started 5 Nov 2026, 18:20"',
    async (walk) => {
      const student = walk.as('Rahul Verma');
      let attempt = await must(
        student.assessments.startAttempt(unsafeBrand('ASMT-0009')),
        'D2 start ATT-0450',
      );
      const answers = [
        ['Q-0101', { type: 'multiple-choice' as const, choice: 'A' as const }],
        ['Q-0102', { type: 'multiple-choice' as const, choice: 'B' as const }],
        ['Q-0104', { type: 'true-false' as const, value: true }],
        ['Q-0106', { type: 'written' as const, text: RAHUL_WRITTEN }],
      ] as const;
      for (const [questionId, answer] of answers) {
        attempt = await must(
          student.assessments.saveAnswer({
            attemptId: attempt.id,
            questionId: unsafeBrand(questionId),
            answer,
            expectedRev: attempt.rev,
          }),
          `D2 answer ${questionId}`,
        );
      }
    },
  ),
  step(
    'D2-submit',
    'D',
    '2026-11-05 18:52',
    'B4-12 "submitted 5 Nov 2026, 18:52"',
    async (walk) => {
      const student = walk.as('Rahul Verma');
      const attempt = worldOf(walk.platform).records.attempts['ATT-0450']!;
      await must(
        student.assessments.submitAttempt({ attemptId: attempt.id, expectedRev: attempt.rev }),
        'D2 submit',
      );
    },
  ),
  step(
    'D3-objective',
    'D',
    '2026-11-07 10:10',
    'B4-13 "11 of 16": choice marks supplied by the fixture (DV-2 seam; undrawn time)',
    (walk) => {
      walk.seams.supplyObjectiveMarks('ATT-0450');
    },
  ),
  step(
    'D3-mark',
    'D',
    '2026-11-07 10:12',
    'B4-14 D3 "mark 7 of 10 + feedback" (feedback text undrawn)',
    async (walk) => {
      const faculty = walk.as('Dr S. Ranganathan');
      const view = await must(
        faculty.marking.getAttemptForMarking(unsafeBrand('ATT-0450')),
        'D3 FA-19',
      );
      await must(
        faculty.marking.saveMark({
          attemptId: view.attempt.id,
          questionId: unsafeBrand('Q-0106'),
          mark: '7',
          feedback: 'Clear explanation of fouling.',
          expectedRev: view.attempt.rev,
        }),
        'D3 save mark',
      );
    },
  ),
  step('D3-confirm', 'D', '2026-11-07 10:15', 'B4-09 "marked 7 Nov 2026, 10:15"', async (walk) => {
    const faculty = walk.as('Dr S. Ranganathan');
    const view = await must(
      faculty.marking.getAttemptForMarking(unsafeBrand('ATT-0450')),
      'D3 FA-19',
    );
    await must(
      faculty.marking.confirmMarks({ attemptId: view.attempt.id, expectedRev: view.attempt.rev }),
      'D3 confirm marks',
    );
  }),
  step(
    'D5',
    'D',
    '2026-11-15 10:00',
    'B4-13 "ST-14 Result · passed · 15 Nov 2026" — released by the setting at 14 Nov 2026, 23:59',
    async (walk) => {
      const result = await must(
        walk.as('Rahul Verma').assessments.getResult(unsafeBrand('ATT-0450')),
        'D5 ST-14',
      );
      if (result.result.kind !== 'released')
        throw new Error('D5: the result is not released after the deadline.');
    },
  ),
];

async function addQuestion(walk: WalkContext, question: (typeof BANK)[number]): Promise<void> {
  await must(
    walk.as('Dr S. Ranganathan').questionBank.addQuestion({
      experimentId: SHELL,
      type: question.type,
      text: question.text,
      options: question.options,
      correct: question.correct,
      marks: question.marks,
      explanation: question.explanation,
      markingGuidance: 'guidance' in question ? (question.guidance ?? null) : null,
    }),
    `bank: ${question.text}`,
  );
}

/** Runs walk steps on a platform, each at its time on the manual clock. */
export async function runWalk(
  platform: SamplePlatform,
  steps: readonly WalkStep[],
  carried: Map<string, string> = new Map(),
  visitor: ProductPorts = visitorPorts(platform),
): Promise<void> {
  const context: WalkContext = {
    platform,
    visitor,
    as: (name) => asPerson(platform, name),
    standins: standinsOf(platform),
    seams: seamsOf(platform),
    personId: (name) => personIdOf(worldOf(platform), name),
    carried,
  };
  for (const current of steps) {
    setSampleNow(platform, current.at);
    await current.run(context);
  }
}

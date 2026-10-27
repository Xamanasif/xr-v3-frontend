/**
 * The DTO input schemas, table-driven (ADR-0008 decision 6; Appendix C §5.4; Appendix F §6.6):
 * each validating method accepts a complete form (trimmed and parsed, no choice made for the
 * person), and each rule reports its catalogue key on its field with the drawn words and the
 * form's drawn summary title. The table is complete: every drawn key a schema reports appears in
 * it. Nothing in an input names the caller or claims a permission (Appendix C rule 1).
 */
import { describe, expect, it } from 'vitest';
import type { z } from 'zod';

import { readSource, sourceFiles } from '../../test-support/sources.js';
import { parseInput } from '../errors/field-errors.js';
import {
  type MessageKey,
  isDrawn,
  isMessageKey,
  messageFor,
  summaryTitleFor,
} from '../errors/messages.js';
import { type LedgerRow, ledgerRows } from '../ledger/index.js';
import { acceptMarkAsTyped } from './assessment.js';
import type { MethodId } from './index.js';

const ROWS = new Map(ledgerRows().map((row) => [row.id, row]));
const rowOf = (method: MethodId): LedgerRow => ROWS.get(method)!;

type Path = readonly (string | number)[];
interface Case {
  readonly title: string;
  readonly set: readonly (readonly [Path, unknown])[];
  /** field → key, first issue per field, in report order. */
  readonly expect: Readonly<Record<string, MessageKey>>;
  /** Values the drawn words need, by field. */
  readonly params?: Readonly<Record<string, Readonly<Record<string, string>>>>;
}
interface Form {
  readonly method: MethodId;
  readonly valid: unknown;
  readonly cases: readonly Case[];
}

function patched(base: unknown, set: Case['set']): unknown {
  const copy = structuredClone(base) as Record<string, unknown>;
  for (const [path, value] of set) {
    let node = copy as Record<string | number, unknown>;
    for (const step of path.slice(0, -1)) node = node[step] as Record<string | number, unknown>;
    node[path[path.length - 1]!] = value;
  }
  return copy;
}

const one = (title: string, path: Path, value: unknown, field: string, key: MessageKey): Case => ({
  title,
  set: [[path, value]],
  expect: { [field]: key },
});

const reasonForm = (method: MethodId, idField: string, key: MessageKey): Form => ({
  method,
  valid: { [idField]: 'XX-0001', reason: 'Kept in the history.', expectedRev: 1 },
  cases: [
    one('blank reason', ['reason'], '  ', 'reason', key),
    one('empty reason', ['reason'], '', 'reason', key),
  ],
});

const content = {
  courseId: 'crs-me-zg523',
  name: 'Conduction Through a Composite Wall',
  summary: 'Heat flow through a wall of several layers.',
  description: 'Learners build a wall of three layers.',
  version: '1.0',
  formats: ['web', 'vr'],
  delivery: {
    web: {
      format: 'web',
      webLink: 'https://labs.northline.example/composite-wall',
      browserAndComputer: 'A current browser on a laptop.',
      notes: null,
    },
    vr: {
      format: 'vr',
      packageLabel: 'Composite Wall VR',
      packageReference: 'NSS-CW-VR-1.0',
      packageFileName: null,
      deviceNeeded: 'A supported VR headset.',
      installNotes: 'Install it from the lab’s device manager.',
      notes: null,
    },
  },
  preview: { label: null, link: null },
  documents: [],
};

const rules = {
  passMarkPercent: '60',
  attemptsAllowed: '2',
  deadline: '2026-10-20T17:00:00+05:30',
  releaseOption: 'after-deadline',
  releaseDate: null,
};

const question = {
  experimentId: 'heat-exchanger',
  type: 'multiple-choice',
  text: 'Which flow arrangement gives the larger LMTD?',
  options: { A: 'Parallel flow', B: 'Counter flow' },
  correct: 'B',
  marks: '2',
  explanation: null,
  markingGuidance: null,
};

const FORMS: readonly Form[] = [
  {
    method: 'SessionService.signIn',
    valid: { method: 'email', email: 'rahul.verma@godavari.edu.in', password: 'sample-password' },
    cases: [
      one('no e-mail', ['email'], ' ', 'email', 'XS-01.email.required'),
      one('not an e-mail', ['email'], 'rahul.verma', 'email', 'XS-01.email.format'),
      one('no password', ['password'], '', 'password', 'XS-01.password.required'),
    ],
  },
  {
    method: 'SelectionService.add',
    valid: { experimentId: 'heat-exchanger', formats: ['web'] },
    cases: [one('no format', ['formats'], [], 'formats', 'PU-06.formats.choose-one')],
  },
  {
    method: 'AccessRequestService.submitPublicRequest',
    valid: {
      institutionName: 'Godavari Institute of Technology',
      contactPerson: 'Meera Iyer',
      email: 'meera.iyer@godavari.edu.in',
      phone: null,
      licencesRequested: '60',
      message: null,
      term: { kind: 'until-date', endsOn: '2027-05-31' },
    },
    cases: [
      one(
        'no institution',
        ['institutionName'],
        ' ',
        'institutionName',
        'PU-08.institutionName.required',
      ),
      one('no contact', ['contactPerson'], '', 'contactPerson', 'PU-08.contactPerson.required'),
      one('no e-mail', ['email'], '', 'email', 'PU-08.email.required'),
      one('not an e-mail', ['email'], 'meera@godavari', 'email', 'PU-08.email.format'),
      one(
        'no licences',
        ['licencesRequested'],
        '',
        'licencesRequested',
        'PU-08.licencesRequested.required',
      ),
      one(
        'not whole',
        ['licencesRequested'],
        '60.5',
        'licencesRequested',
        'PU-08.licencesRequested.whole-number',
      ),
      one('no term', ['term'], null, 'term', 'PU-08.term.required'),
      one('no end date', ['term', 'endsOn'], ' ', 'term.endsOn', 'PU-08.term.endsOn.required'),
    ],
  },
  {
    method: 'AccessRequestService.submitAdditionalLicencesRequest',
    valid: { planId: 'ACC-0107', experimentIds: ['heat-exchanger'], licences: '20', message: null },
    cases: [
      one('no experiment', ['experimentIds'], [], 'experimentIds', 'IA-17.experimentIds.required'),
      one('no licences', ['licences'], ' ', 'licences', 'IA-17.licences.required'),
      one('not whole', ['licences'], 'two', 'licences', 'IA-17.licences.whole-number'),
    ],
  },
  {
    method: 'AccessRequestService.approveSmallerScope',
    valid: {
      id: 'REQ-0042',
      route: 'external',
      items: [{ experimentId: 'heat-exchanger', formats: ['web'] }],
      licences: '40',
      term: 'yearly',
      reason: 'The VR lab opens next term.',
      expectedRev: 2,
    },
    cases: [
      one('licences with a space', ['licences'], ' 40', 'licences', 'SA-03.licences.whole-number'),
      one('no term', ['term'], null, 'term', 'SA-03.term.required'),
      one('no reason', ['reason'], '', 'reason', 'SA-03.reason.required'),
    ],
  },
  {
    method: 'AccessRequestService.requestMoreInformation',
    valid: { id: 'REQ-0042', reason: 'Which semester?', expectedRev: 2 },
    cases: [one('no reason', ['reason'], ' ', 'reason', 'SA-03.informationReason.required')],
  },
  {
    method: 'InstitutionService.assignInstituteAdmin',
    valid: {
      institutionId: 'inst-godavari',
      name: 'Meera Iyer',
      workEmail: 'meera.iyer@godavari.edu.in',
      expectedRev: 3,
    },
    cases: [
      one('no name', ['name'], '', 'name', 'SA-07.name.required'),
      one('no e-mail', ['workEmail'], ' ', 'workEmail', 'SA-07.workEmail.required'),
      one('not an e-mail', ['workEmail'], 'meera', 'workEmail', 'SA-07.workEmail.format'),
    ],
  },
  reasonForm('InstitutionService.pauseInstitution', 'institutionId', 'SA-07.reason.required'),
  reasonForm('InstitutionService.restoreInstitution', 'institutionId', 'SA-07.reason.required'),
  {
    method: 'InstitutionService.overrideStudentStatus',
    valid: { studentId: 'per-rahul', to: 'active', reason: 'Re-enrolled.', expectedRev: 1 },
    cases: [one('no reason', ['reason'], '', 'reason', 'SA-07.reason.required')],
  },
  {
    method: 'PeopleService.addStudent',
    valid: {
      fullName: 'Rahul Verma',
      institutionEmail: 'rahul.verma@godavari.edu.in',
      institutionStudentId: 'GIT-2026-0418',
      programme: null,
      groupId: null,
    },
    cases: [
      one('no name', ['fullName'], ' ', 'fullName', 'IA-10.fullName.required'),
      one(
        'no e-mail',
        ['institutionEmail'],
        '',
        'institutionEmail',
        'IA-10.institutionEmail.required',
      ),
      one(
        'not an e-mail',
        ['institutionEmail'],
        'rahul@',
        'institutionEmail',
        'IA-10.institutionEmail.format',
      ),
      one(
        'no student ID',
        ['institutionStudentId'],
        '',
        'institutionStudentId',
        'IA-10.institutionStudentId.required',
      ),
    ],
  },
  {
    method: 'PeopleService.addFaculty',
    valid: { fullName: 'Dr S. Ranganathan', institutionEmail: 's.ranganathan@godavari.edu.in' },
    cases: [one('no name', ['fullName'], '', 'fullName', 'IA-10.fullName.required')],
  },
  {
    method: 'PeopleService.previewStudentImport',
    valid: { fileName: 'students.csv', csvText: 'student_id,full_name' },
    cases: [one('no file', ['fileName'], '', 'fileName', 'IA-11.file.required')],
  },
  reasonForm('PeopleService.deactivateStudent', 'id', 'IA-07.reason.required'),
  {
    method: 'GroupService.createGroup',
    valid: { name: 'Lab batch A' },
    cases: [one('no name', ['name'], ' ', 'name', 'IA-13.name.required')],
  },
  {
    method: 'GroupService.renameGroup',
    valid: { id: 'GRP-0003', name: 'Lab batch B', expectedRev: 1 },
    cases: [one('no name', ['name'], '', 'name', 'IA-13.name.required')],
  },
  {
    method: 'FacultyCourseService.assign',
    valid: { facultyId: 'per-ranganathan', courseId: 'crs-me-zg523' },
    cases: [
      {
        title: 'nothing chosen: the faculty member first',
        set: [
          [['facultyId'], null],
          [['courseId'], null],
        ],
        expect: { facultyId: 'IA-15.facultyId.required' },
      },
      one('no course', ['courseId'], null, 'courseId', 'IA-15.courseId.required'),
    ],
  },
  {
    method: 'InstitutionCourseCodeService.set',
    valid: { courseId: 'crs-me-zg523', code: 'MEC-523', semester: 'Semester 5', expectedRev: null },
    cases: [
      one('a semester without a code', ['code'], ' ', 'code', 'IA-16.code.semester-needs-code'),
    ],
  },
  {
    method: 'StudentAccessService.giveAccess',
    valid: {
      experimentIds: ['heat-exchanger'],
      target: { kind: 'students', studentIds: ['per-rahul'] },
      expectedPlanRev: 4,
    },
    cases: [
      one('no experiment', ['experimentIds'], [], 'experimentIds', 'IA-05.experimentIds.required'),
      one(
        'no student',
        ['target', 'studentIds'],
        [],
        'target.studentIds',
        'IA-05.students.required',
      ),
      one(
        'no group',
        ['target'],
        { kind: 'group', groupId: null },
        'target.groupId',
        'IA-05.group.required',
      ),
      one('no target', ['target'], null, 'target', 'IA-05.students.required'),
    ],
  },
  {
    method: 'StudentAccessService.previewGiveAccess',
    valid: { experimentIds: ['heat-exchanger'], target: { kind: 'group', groupId: 'GRP-0003' } },
    cases: [
      one('no experiment', ['experimentIds'], [], 'experimentIds', 'IA-05.experimentIds.required'),
    ],
  },
  reasonForm('StudentAccessService.withdrawGrant', 'grantId', 'IA-04.reason.required'),
  {
    method: 'FeedbackService.sendFeedback',
    valid: {
      experimentId: 'heat-exchanger',
      format: 'web',
      ratings: [5, 4, 4, 3, 5],
      comments: null,
    },
    cases: [
      {
        title: 'a missing rating',
        set: [[['ratings', 2], null]],
        expect: { 'ratings.2': 'ST-16.rating.required' },
        params: { 'ratings.2': { statement: '3' } },
      },
    ],
  },
  {
    method: 'AssessmentService.createAssessment',
    valid: {
      mode: 'create',
      experimentId: 'heat-exchanger',
      name: 'Heat exchanger check',
      introduction: null,
      rules,
      questions: ['Q-0101'],
    },
    cases: [
      one('no experiment', ['experimentId'], null, 'experimentId', 'FA-07.experimentId.required'),
      one('no name', ['name'], ' ', 'name', 'FA-07.name.required'),
      {
        title: 'a draft needs only a name',
        set: [
          [['mode'], 'save-as-draft'],
          [['name'], ''],
          [['questions'], []],
          [
            ['rules'],
            {
              ...rules,
              passMarkPercent: '',
              attemptsAllowed: '',
              deadline: '',
              releaseOption: null,
            },
          ],
        ],
        expect: { name: 'FA-07.name.required-for-draft' },
      },
      one('no question', ['questions'], [], 'questions', 'FA-07.questions.at-least-one-or-draft'),
      one(
        'pass mark above 100',
        ['rules', 'passMarkPercent'],
        '101',
        'rules.passMarkPercent',
        'FA-07.passMarkPercent.range',
      ),
      one(
        'no pass mark (no default, BC6)',
        ['rules', 'passMarkPercent'],
        '',
        'rules.passMarkPercent',
        'FA-07.passMarkPercent.range',
      ),
      one(
        'no attempts',
        ['rules', 'attemptsAllowed'],
        '0',
        'rules.attemptsAllowed',
        'FA-07.attemptsAllowed.whole-number',
      ),
      one('no deadline', ['rules', 'deadline'], ' ', 'rules.deadline', 'FA-07.deadline.required'),
      one(
        'no release option',
        ['rules', 'releaseOption'],
        null,
        'rules.releaseOption',
        'FA-07.releaseOption.required',
      ),
      one(
        'on a date, without the date',
        ['rules', 'releaseOption'],
        'on-date',
        'rules.releaseDate',
        'FA-07.releaseDate.required',
      ),
    ],
  },
  {
    method: 'QuestionBankService.addQuestion',
    valid: question,
    cases: [
      one('no type', ['type'], null, 'type', 'FA-15.type.required'),
      one('no question', ['text'], ' ', 'text', 'FA-15.text.required'),
      {
        title: 'one option',
        set: [
          [['options'], { A: 'Parallel flow', B: ' ' }],
          [['correct'], 'A'],
        ],
        expect: { options: 'FA-15.options.at-least-two' },
      },
      {
        title: 'the correct answer is an option left blank',
        set: [[['options'], { A: 'Parallel flow', B: ' ' }]],
        expect: { options: 'FA-15.options.at-least-two', correct: 'FA-15.correct.choose-correct' },
      },
      one('no correct answer', ['correct'], null, 'correct', 'FA-15.correct.choose-correct'),
      {
        title: 'true or false, unanswered',
        set: [
          [['type'], 'true-false'],
          [['options'], {}],
          [['correct'], null],
        ],
        expect: { correct: 'FA-15.correct.true-false' },
      },
      one('no marks', ['marks'], '0', 'marks', 'FA-15.marks.whole-number'),
    ],
  },
  {
    method: 'QuestionBankService.requestDrafts',
    valid: {
      experimentId: 'heat-exchanger',
      source: 'lab-brief',
      pastedText: null,
      types: ['multiple-choice'],
      howMany: 3,
    },
    cases: [
      one('no material', ['source'], null, 'source', 'FA-16.source.required'),
      one(
        'pasted text missing',
        ['source'],
        'pasted-text',
        'pastedText',
        'FA-16.pastedText.required',
      ),
      one('no type', ['types'], [], 'types', 'FA-16.types.at-least-one'),
      one('how many not chosen', ['howMany'], null, 'howMany', 'FA-16.howMany.required'),
    ],
  },
  {
    method: 'QuestionBankService.previewQuestionImport',
    valid: { experimentId: 'heat-exchanger', fileName: 'questions.csv', csvText: 'type,question' },
    cases: [one('no file', ['fileName'], ' ', 'fileName', 'FA-17.file.required')],
  },
  {
    method: 'ProductionService.continueStep',
    valid: { id: 'SUB-0077', content, from: 'course' },
    cases: [
      {
        title: 'course step, everything blank',
        set: [
          [['content', 'courseId'], null],
          [['content', 'name'], ' '],
          [['content', 'summary'], null],
          [['content', 'description'], ''],
          [['content', 'version'], null],
        ],
        expect: {
          'content.courseId': 'VE-03.courseId.required',
          'content.name': 'VE-03.name.required',
          'content.summary': 'VE-03.summary.required',
          'content.description': 'VE-03.description.required',
          'content.version': 'VE-03.version.required',
        },
      },
      {
        title: 'formats step, nothing chosen',
        set: [
          [['from'], 'formats'],
          [['content', 'formats'], []],
        ],
        expect: { 'content.formats': 'VE-04.formats.required' },
      },
      {
        title: 'formats step, WEB without link or browser',
        set: [
          [['from'], 'formats'],
          [['content', 'delivery', 'web', 'webLink'], null],
          [['content', 'delivery', 'web', 'browserAndComputer'], ' '],
        ],
        expect: {
          'content.delivery.web.webLink': 'VE-04.webLink.required',
          'content.delivery.web.browserAndComputer': 'VE-04.browserAndComputer.required',
        },
      },
      {
        title: 'formats step, WEB link not https',
        set: [
          [['from'], 'formats'],
          [['content', 'delivery', 'web', 'webLink'], 'http://labs.northline.example/x'],
        ],
        expect: { 'content.delivery.web.webLink': 'VE-04.webLink.format' },
      },
      {
        title: 'formats step, VR package blank',
        set: [
          [['from'], 'formats'],
          [
            ['content', 'delivery', 'vr'],
            {
              format: 'vr',
              packageLabel: null,
              packageReference: null,
              packageFileName: null,
              deviceNeeded: ' ',
              installNotes: null,
              notes: null,
            },
          ],
        ],
        expect: {
          'content.delivery.vr.packageLabel': 'VE-04.packageLabel.required',
          'content.delivery.vr.packageReference': 'VE-04.packageReference.required',
          'content.delivery.vr.deviceNeeded': 'VE-04.deviceNeeded.required',
          'content.delivery.vr.installNotes': 'VE-04.installNotes.required',
        },
        params: {
          'content.delivery.vr.packageLabel': { format: 'VR' },
          'content.delivery.vr.packageReference': { format: 'VR' },
          'content.delivery.vr.deviceNeeded': { format: 'VR' },
          'content.delivery.vr.installNotes': { format: 'VR' },
        },
      },
      {
        title: 'preview step, a label without a link',
        set: [
          [['from'], 'preview'],
          [['content', 'preview'], { label: 'Walkthrough', link: null }],
        ],
        expect: { 'content.preview.link': 'VE-05.previewLink.required-with-label' },
        params: { 'content.preview.link': { label: 'Walkthrough' } },
      },
      {
        title: 'preview step, a link not https',
        set: [
          [['from'], 'preview'],
          [['content', 'preview'], { label: null, link: 'www.example.com' }],
        ],
        expect: { 'content.preview.link': 'VE-05.previewLink.format' },
      },
    ],
  },
  {
    method: 'ProductionService.saveDraft',
    valid: { id: null, content, step: 'course', expectedRev: null },
    cases: [
      one('no name', ['content', 'name'], ' ', 'content.name', 'VE-03.name.required-for-draft'),
    ],
  },
  {
    method: 'ProductionService.saveRevision',
    valid: { id: 'SUB-0077', content, expectedRev: 3 },
    cases: [
      one('no name', ['content', 'name'], '', 'content.name', 'VE-03.name.required-for-draft'),
    ],
  },
  {
    method: 'ProductionService.approveSubmission',
    valid: { id: 'SUB-0077', outcomes: ['Explain heat flow in series.'], expectedRev: 4 },
    cases: [
      one('no outcome', ['outcomes'], [], 'outcomes', 'RV-03.outcomes.at-least-one'),
      one('a blank outcome', ['outcomes'], [' '], 'outcomes.0', 'RV-03.outcome.required'),
    ],
  },
  {
    method: 'ProductionService.returnSubmission',
    valid: {
      id: 'SUB-0077',
      reason: 'Give the thicknesses.',
      references: [],
      outcomes: [],
      expectedRev: 2,
    },
    cases: [
      one('no reason', ['reason'], '', 'reason', 'RV-03.reason.required'),
      one('a blank outcome', ['outcomes'], [''], 'outcomes.0', 'RV-03.outcome.required'),
    ],
  },
  {
    method: 'ProductionService.sendBack',
    valid: {
      id: 'SUB-0077',
      to: 'academic-reviewer',
      reason: 'Please re-check the outcomes.',
      expectedRev: 5,
    },
    cases: [
      one('no destination', ['to'], null, 'to', 'CM-03.to.required'),
      one('no reason', ['reason'], ' ', 'reason', 'CM-03.reason.required'),
    ],
  },
  reasonForm('ProductionService.overrideStatus', 'id', 'SA-13.reason.required'),
  reasonForm('CorrectionService.withdrawUpdate', 'id', 'CM-08.reason.required'),
  reasonForm('CorrectionService.returnUpdate', 'id', 'RV-04.reason.required'),
  reasonForm('CorrectionService.holdUpdate', 'id', 'SA-11.reason.required'),
  {
    method: 'AcademicStructureService.addArea',
    valid: { name: 'Thermal Engineering', description: null },
    cases: [one('no name', ['name'], '', 'name', 'SA-14.areaName.required')],
  },
  {
    method: 'AcademicStructureService.addCourse',
    valid: { name: 'Heat Transfer', areaId: 'area-thermal', description: null },
    cases: [
      one('no name', ['name'], ' ', 'name', 'SA-14.courseName.required'),
      one('no area', ['areaId'], null, 'areaId', 'SA-14.areaId.required'),
    ],
  },
  {
    method: 'AcademicStructureService.rename',
    valid: { kind: 'course', id: 'crs-me-zg523', name: 'Heat Transfer II', expectedRev: 2 },
    cases: [one('no name', ['name'], '', 'name', 'SA-15.name.required')],
  },
  {
    method: 'AcademicStructureService.moveCourse',
    valid: { courseId: 'crs-me-zg523', toAreaId: 'area-thermal', expectedRev: 2 },
    cases: [one('no area', ['toAreaId'], null, 'toAreaId', 'SA-15.toAreaId.required')],
  },
  {
    method: 'PlatformRoleService.registerHolder',
    valid: {
      role: 'vendor',
      name: 'Anil Shetty',
      workEmail: 'anil@northline.example',
      organisation: 'Northline Studios',
    },
    cases: [
      one('no name', ['name'], '', 'name', 'SA-16.name.required'),
      one('no e-mail', ['workEmail'], ' ', 'workEmail', 'SA-16.workEmail.required'),
      one('not an e-mail', ['workEmail'], 'anil', 'workEmail', 'SA-16.workEmail.format'),
      one('no organisation', ['organisation'], '', 'organisation', 'SA-16.organisation.required'),
    ],
  },
  {
    method: 'PlatformRoleService.assignScope',
    valid: {
      holderId: 'role-menon',
      target: { kind: 'course', courseId: 'crs-me-zg523' },
      expectedRev: 1,
    },
    cases: [
      one('nothing chosen', ['target'], { kind: null }, 'target', 'SA-17.target.required'),
      one(
        'no course',
        ['target'],
        { kind: 'course', courseId: null },
        'target.courseId',
        'SA-17.courseId.required',
      ),
      one(
        'no experiment',
        ['target'],
        { kind: 'experiment', experimentId: null },
        'target.experimentId',
        'SA-17.experimentId.required',
      ),
    ],
  },
  {
    method: 'PlatformRoleService.withdrawScope',
    valid: { holderId: 'role-menon', scopeId: 'scope-1', reason: 'Course moved.', expectedRev: 1 },
    cases: [one('no reason', ['reason'], '', 'reason', 'SA-17.reason.required')],
  },
  {
    method: 'OperationsService.requestDeviceTransfer',
    valid: { newDevice: 'Meta Quest 3, serial 2G0YC', note: null },
    cases: [one('no device', ['newDevice'], ' ', 'newDevice', 'ST-18.newDevice.required')],
  },
  {
    method: 'OperationsService.reportProblem',
    valid: { whatHappened: 'The WEB format did not open.', where: null, screenshotFileName: null },
    cases: [
      one('nothing said', ['whatHappened'], '', 'whatHappened', 'XS-07.whatHappened.required'),
    ],
  },
  {
    method: 'OperationsService.resolveReport',
    valid: { id: 'SUP-0012', note: 'Fixed the link.', expectedRev: 1 },
    cases: [one('no note', ['note'], ' ', 'note', 'SA-21.note.required')],
  },
];

describe.each(FORMS)('$method', (form) => {
  const row = rowOf(form.method);

  it('accepts the complete form', () => {
    const parsed = parseInput(row.input!, form.valid, row.form);
    expect(parsed.ok ? 'accepted' : parsed.error.fieldErrors).toBe('accepted');
  });

  it.each(form.cases)('$title', (testCase) => {
    const parsed = parseInput(row.input!, patched(form.valid, testCase.set), row.form);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    const { fieldErrors, summaryTitle } = parsed.error;
    expect(Object.fromEntries(fieldErrors.map((item) => [item.field, item.key]))).toEqual(
      testCase.expect,
    );
    for (const item of fieldErrors) {
      expect(item.params).toEqual(testCase.params?.[item.field] ?? {});
      expect(item.message).toBe(messageFor(item.key, item.params));
      if (isDrawn(item.key)) expect(item.message, item.key).not.toBeNull();
    }
    expect(summaryTitle).toBe(summaryTitleFor(row.form, fieldErrors.length));
  });
});

describe('FA-19 marks (checked against the question’s own marks)', () => {
  it('names the question when blank and the maximum when out of range', () => {
    expect(acceptMarkAsTyped(' ', { number: 3, marks: 5 })).toEqual({
      ok: false,
      error: {
        field: 'mark',
        key: 'FA-19.mark.required',
        message: 'Enter a mark for question 3',
        params: { question: '3' },
      },
    });
    expect(acceptMarkAsTyped('6', { number: 3, marks: 5 })).toMatchObject({
      ok: false,
      error: { key: 'FA-19.mark.range', message: 'Enter a whole number from 0 to 5' },
    });
    expect(acceptMarkAsTyped('2.5', { number: 3, marks: 5 })).toMatchObject({
      ok: false,
      error: { key: 'FA-19.mark.range' },
    });
    expect(acceptMarkAsTyped(' 0 ', { number: 3, marks: 5 })).toEqual({ ok: true, mark: 0 });
  });
});

describe('the table is complete', () => {
  it('covers every drawn key a port schema reports', () => {
    const referenced = new Set(
      sourceFiles('draft/ports')
        .flatMap((file) =>
          [...readSource(file).matchAll(/key\('([^']+)'\)/g)].map((match) => match[1]!),
        )
        .filter((value) => value !== 'contract.invalid-input'),
    );
    const covered = new Set<string>([
      ...FORMS.flatMap((form) => form.cases.flatMap((testCase) => Object.values(testCase.expect))),
      'FA-19.mark.required',
      'FA-19.mark.range',
    ]);
    expect([...referenced].filter((value) => !covered.has(value)).sort()).toEqual([]);
    expect(referenced.size).toBe(101);
  });
});

/** Wrong values a caller could send for any field. */
const WRONG = [undefined, null, 12345, -1, true, 'x', '', {}, [], [12345]];

function objectKeys(schema: z.ZodType): readonly string[] {
  const def = (schema as unknown as { _zod: { def: Record<string, unknown> } })._zod.def;
  if (def['type'] === 'object') return Object.keys(def['shape'] as object);
  if (def['type'] === 'pipe') return objectKeys(def['in'] as z.ZodType);
  return [];
}

/**
 * Issues about the shape of a value (a wrong type, an option that does not exist, no matching
 * union branch) are programming errors: `fieldErrorsFromIssues` reports them as
 * `contract.invalid-input`, which has no words. Every RULE (a length, a format, a range, a custom
 * check) must carry its catalogue key.
 */
const SHAPE_ISSUES = new Set([
  'invalid_type',
  'invalid_value',
  'invalid_union',
  'unrecognized_keys',
  'invalid_key',
  'invalid_element',
]);

describe('every input rule reports a catalogue key — never a default zod message', () => {
  const rows = ledgerRows().filter((row) => row.input !== null);

  it.each(rows.map((row) => [row.id, row.input!] as const))('%s', (_, schema) => {
    const probes: unknown[] = [
      ...WRONG,
      ...objectKeys(schema).flatMap((field) => WRONG.map((value) => ({ [field]: value }))),
    ];
    for (const probe of probes) {
      const result = schema.safeParse(probe);
      if (result.success) continue;
      for (const issue of result.error.issues) {
        if (isMessageKey(issue.message)) continue;
        expect(
          SHAPE_ISSUES.has(issue.code),
          `${JSON.stringify(probe)} → ${issue.code}: ${issue.message}`,
        ).toBe(true);
      }
      const parsed = parseInput(schema, probe, null);
      for (const item of parsed.ok ? [] : parsed.error.fieldErrors)
        expect(isMessageKey(item.key)).toBe(true);
    }
  });
});

describe('no input names the caller or claims a permission (Appendix C rule 1; WP-0.9 boundaries)', () => {
  const CALLER =
    /^(role|actor|actorId|caller\w*|as|asRole|userId|currentUser|session\w*|signedIn\w*|byRole|onBehalfOf)$/;
  /** A boolean that would let a caller assert an outcome the domain decides. */
  const CLAIM =
    /^(is|has|can)[A-Z]\w*$|(approved|allowed|permitted|authori[sz]ed|granted|open|eligible|bypass\w*|override)$/i;
  /** Record fields, not the caller: the platform role being registered. */
  const ALLOWED = new Set(['PlatformRoleService.registerHolder:role']);

  type Field = { readonly name: string; readonly boolean: boolean };
  const defOf = (schema: unknown) =>
    (schema as { _zod: { def: Record<string, unknown> } })._zod.def;
  function isBoolean(schema: unknown): boolean {
    const def = defOf(schema);
    if (def['type'] === 'boolean') return true;
    return (
      ['optional', 'nullable', 'readonly', 'default'].includes(def['type'] as string) &&
      isBoolean(def['innerType'])
    );
  }
  function fieldsOf(schema: z.ZodType, seen = new Set<z.ZodType>()): Field[] {
    if (seen.has(schema)) return [];
    seen.add(schema);
    const def = defOf(schema);
    const child = (value: unknown) => fieldsOf(value as z.ZodType, seen);
    switch (def['type']) {
      case 'object':
        return Object.entries(def['shape'] as Record<string, z.ZodType>).flatMap(
          ([name, value]) => [{ name, boolean: isBoolean(value) }, ...child(value)],
        );
      case 'array':
        return child(def['element']);
      case 'union':
        return (def['options'] as z.ZodType[]).flatMap(child);
      case 'record':
        return child(def['valueType']);
      case 'pipe':
        return [...child(def['in']), ...child(def['out'])];
      case 'optional':
      case 'nullable':
      case 'readonly':
      case 'default':
        return child(def['innerType']);
      default:
        return [];
    }
  }

  it('finds no role, actor or approval claim in any of the 183 inputs', () => {
    const findings = ledgerRows().flatMap((row) =>
      row.input === null
        ? []
        : fieldsOf(row.input)
            .filter((field) => CALLER.test(field.name) || (field.boolean && CLAIM.test(field.name)))
            .filter((field) => !ALLOWED.has(`${row.id}:${field.name}`))
            .map((field) => `${row.id}: ${field.name}`),
    );
    expect(findings).toEqual([]);
  });

  it('lists the booleans an input may carry: four view filters, a true-or-false answer and a starting scope', () => {
    const booleans = ledgerRows().flatMap((row) =>
      row.input === null
        ? []
        : fieldsOf(row.input)
            .filter((field) => field.boolean)
            .map((field) => `${row.id}: ${field.name}`),
    );
    expect(booleans).toEqual([
      // Package 1B (PC-32): the landing's featured experiments — a view of the public catalogue.
      'CatalogueService.searchCatalogue: featured',
      // Package 2A (PC-39): IA-06's "Not in a group" — a view of the institution's own students.
      'PeopleService.listStudents: notInGroup',
      'StudentAccessService.listGrants: showWithdrawn',
      'AssessmentService.saveAnswer: value',
      'QuestionBankService.listQuestions: includeDeleted',
      // PC-75 (owner decision PD-3, 27 Oct 2026): a Vendor may start with "Any course" — the scope
      // the Super Admin would assign next, written with the registration; no claim about the caller.
      'PlatformRoleService.registerHolder: anyCourse',
    ]);
  });
});

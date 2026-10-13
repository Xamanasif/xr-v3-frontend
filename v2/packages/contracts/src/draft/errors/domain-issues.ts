/**
 * From a WP-0.9 domain refusal to the port's `ServiceError`. The domain reports a rule key per
 * field (`InputIssue { field, rule }`) and leaves the words to the copy layer; here each issue a
 * method's decision can raise is mapped to the form field it belongs to and its catalogue key, so
 * the form shows the drawn words beside the field and in the error summary. An issue with no
 * mapping is a programming error and throws — no undrawn words are invented.
 *
 * Values a message needs from the records (`{name}` in "A group called “{name}” already exists")
 * are supplied by the adapter through `paramsFor`.
 */
import type { InputIssue, Refusal } from '@xr/domain';

import type { MethodId } from '../ports/index.js';
import { fieldError, validationFailed } from './field-errors.js';
import {
  type MessageKey,
  QUESTION_IMPORT_ROW_KEYS,
  STUDENT_IMPORT_ROW_KEYS,
  type SummaryForm,
} from './messages.js';
import type { FieldError, ServiceError } from './service-error.js';

export interface IssueTarget {
  readonly field: string;
  readonly key: MessageKey;
}

export interface IssueMapping {
  /** The domain's field (a pattern for a field that carries a value, e.g. `rating-3`). */
  readonly field: string | RegExp;
  readonly rule: string;
  readonly to: (match: RegExpExecArray | null, input: unknown) => IssueTarget;
}

const to = (field: string, key: MessageKey) => (): IssueTarget => ({ field, key });

const reason = (key: MessageKey): IssueMapping => ({
  field: 'reason',
  rule: 'required',
  to: to('reason', key),
});

const inputKind = (input: unknown, field: string): unknown =>
  typeof input === 'object' && input !== null
    ? (input as Record<string, unknown>)[field]
    : undefined;

const publicRequest: readonly IssueMapping[] = [
  {
    field: 'institutionName',
    rule: 'required',
    to: to('institutionName', 'PU-08.institutionName.required'),
  },
  {
    field: 'contactPerson',
    rule: 'required',
    to: to('contactPerson', 'PU-08.contactPerson.required'),
  },
  { field: 'contactEmail', rule: 'required', to: to('email', 'PU-08.email.required') },
  { field: 'contactEmail', rule: 'email-format', to: to('email', 'PU-08.email.format') },
  {
    field: 'licences',
    rule: 'required',
    to: to('licencesRequested', 'PU-08.licencesRequested.required'),
  },
  {
    field: 'licences',
    rule: 'whole-number',
    to: to('licencesRequested', 'PU-08.licencesRequested.whole-number'),
  },
  { field: 'term', rule: 'required', to: to('term', 'PU-08.term.required') },
  {
    field: 'selection',
    rule: 'format-not-published',
    to: to('selection', 'PU-08.selection.format-not-published'),
  },
];

const smallerScope: readonly IssueMapping[] = [
  { field: 'route', rule: 'required', to: to('route', 'SA-03.route.required') },
  {
    field: 'decision',
    rule: 'change-something',
    to: to('decision', 'SA-03.decision.change-something'),
  },
  { field: 'items', rule: 'keep-one-format', to: to('items', 'SA-03.items.keep-one-format') },
  { field: 'items', rule: 'not-requested', to: to('items', 'SA-03.items.not-requested') },
  { field: 'items', rule: 'same-experiments', to: to('items', 'SA-03.items.same-experiments') },
  { field: 'licences', rule: 'whole-number', to: to('licences', 'SA-03.licences.whole-number') },
  { field: 'licences', rule: 'not-smaller', to: to('licences', 'SA-03.licences.not-smaller') },
  { field: 'term', rule: 'required', to: to('term', 'SA-03.term.required') },
  reason('SA-03.reason.required'),
];

const nameAndEmail: readonly IssueMapping[] = [
  { field: 'fullName', rule: 'required', to: to('fullName', 'IA-10.fullName.required') },
  {
    field: 'email',
    rule: 'required',
    to: to('institutionEmail', 'IA-10.institutionEmail.required'),
  },
  {
    field: 'email',
    rule: 'email-format',
    to: to('institutionEmail', 'IA-10.institutionEmail.format'),
  },
  { field: 'email', rule: 'taken', to: to('institutionEmail', 'IA-10.institutionEmail.taken') },
];

const giveAccess: readonly IssueMapping[] = [
  {
    field: 'experimentIds',
    rule: 'required',
    to: to('experimentIds', 'IA-05.experimentIds.required'),
  },
  { field: 'students', rule: 'required', to: to('target.studentIds', 'IA-05.students.required') },
];

const assessmentRules: readonly IssueMapping[] = [
  {
    field: 'passMarkPercent',
    rule: 'required',
    to: to('rules.passMarkPercent', 'FA-07.passMarkPercent.range'),
  },
  {
    field: 'passMarkPercent',
    rule: 'whole-number-0-100',
    to: to('rules.passMarkPercent', 'FA-07.passMarkPercent.range'),
  },
  {
    field: 'attemptsAllowed',
    rule: 'required',
    to: to('rules.attemptsAllowed', 'FA-07.attemptsAllowed.whole-number'),
  },
  {
    field: 'attemptsAllowed',
    rule: 'whole-number-1-or-more',
    to: to('rules.attemptsAllowed', 'FA-07.attemptsAllowed.whole-number'),
  },
  { field: 'deadline', rule: 'required', to: to('rules.deadline', 'FA-07.deadline.required') },
  {
    field: 'release',
    rule: 'required',
    to: to('rules.releaseOption', 'FA-07.releaseOption.required'),
  },
  {
    field: 'releaseDate',
    rule: 'required',
    to: to('rules.releaseDate', 'FA-07.releaseDate.required'),
  },
];

const changeAssessment: readonly IssueMapping[] = [
  { field: 'name', rule: 'required', to: to('name', 'FA-07.name.required') },
  { field: 'questions', rule: 'at-least-one', to: to('questions', 'FA-09.questions.at-least-one') },
  ...assessmentRules,
];

const questionContent: readonly IssueMapping[] = [
  { field: 'text', rule: 'required', to: to('text', 'FA-15.text.required') },
  { field: 'options', rule: 'at-least-two', to: to('options', 'FA-15.options.at-least-two') },
  {
    field: 'correct',
    rule: 'choose-correct',
    to: (_, input) => ({
      field: 'correct',
      key:
        inputKind(input, 'type') === 'true-false'
          ? 'FA-15.correct.true-false'
          : 'FA-15.correct.choose-correct',
    }),
  },
  { field: 'marks', rule: 'whole-number-1-or-more', to: to('marks', 'FA-15.marks.whole-number') },
];

const vendorDraft: readonly IssueMapping[] = [
  {
    field: 'name',
    rule: 'required-for-draft',
    to: to('content.name', 'VE-03.name.required-for-draft'),
  },
  {
    field: 'courseId',
    rule: 'course-not-assigned',
    to: to('content.courseId', 'VE-03.courseId.course-not-assigned'),
  },
];

const vendorSubmit: readonly IssueMapping[] = [
  { field: 'name', rule: 'taken', to: to('content.name', 'VE-03.name.taken') },
  {
    field: 'courseId',
    rule: 'course-not-assigned',
    to: to('content.courseId', 'VE-03.courseId.course-not-assigned'),
  },
];

/**
 * A commit whose batch has row errors (the batch changed after its preview): the domain reports
 * `row <n> <field>` (students) or `row <n>` (questions) with the row rule. The field error names
 * the report row by the file's row number, as the report shows it (`rows.<n>.<field>`).
 */
const studentImportRows: readonly IssueMapping[] = Object.entries(STUDENT_IMPORT_ROW_KEYS).map(
  ([fieldRule, key]) => {
    const [field, rule] = fieldRule.split(':') as [string, string];
    return {
      field: new RegExp(`^row (\\d+) ${field}$`),
      rule,
      to: (match: RegExpExecArray | null) => ({ field: `rows.${match![1]}.${field}`, key }),
    };
  },
);

const questionImportRows: readonly IssueMapping[] = Object.entries(QUESTION_IMPORT_ROW_KEYS)
  // A warning never blocks an import, so the domain never raises it as an issue.
  .filter(([problem]) => problem !== 'explanation-empty')
  .map(([problem, key]) => ({
    field: /^row (\d+)$/,
    rule: problem,
    to: (match: RegExpExecArray | null) => ({ field: `rows.${match![1]}`, key }),
  }));

const courseMove: readonly IssueMapping[] = [
  { field: 'targetAreaId', rule: 'required', to: to('toAreaId', 'SA-15.toAreaId.required') },
  { field: 'targetAreaId', rule: 'unchanged', to: to('toAreaId', 'SA-15.toAreaId.unchanged') },
];

/** The domain issues each method's decision can raise (WP-0.9 `invalidInput` calls). */
export const DOMAIN_ISSUE_MAP: { readonly [M in MethodId]?: readonly IssueMapping[] } = {
  'SelectionService.add': [
    { field: 'formats', rule: 'choose-one', to: to('formats', 'PU-06.formats.choose-one') },
  ],
  'AccessRequestService.submitPublicRequest': publicRequest,
  'AccessRequestService.submitAdditionalLicencesRequest': [
    {
      field: 'experimentIds',
      rule: 'required',
      to: to('experimentIds', 'IA-17.experimentIds.required'),
    },
    {
      field: 'experimentIds',
      rule: 'not-in-plan',
      to: to('experimentIds', 'IA-17.experimentIds.not-in-plan'),
    },
    { field: 'licences', rule: 'required', to: to('licences', 'IA-17.licences.required') },
    { field: 'licences', rule: 'whole-number', to: to('licences', 'IA-17.licences.whole-number') },
  ],
  'AccessRequestService.approveRequest': [
    { field: 'route', rule: 'required', to: to('route', 'SA-03.route.required') },
  ],
  'AccessRequestService.approveSmallerScope': smallerScope,
  'AccessRequestService.requestMoreInformation': [reason('SA-03.informationReason.required')],
  'InstitutionService.assignInstituteAdmin': [
    { field: 'name', rule: 'required', to: to('name', 'SA-07.name.required') },
    { field: 'workEmail', rule: 'required', to: to('workEmail', 'SA-07.workEmail.required') },
    { field: 'workEmail', rule: 'email-format', to: to('workEmail', 'SA-07.workEmail.format') },
  ],
  'InstitutionService.pauseInstitution': [reason('SA-07.reason.required')],
  'InstitutionService.restoreInstitution': [reason('SA-07.reason.required')],
  'InstitutionService.overrideStudentStatus': [reason('SA-07.reason.required')],
  'PeopleService.addStudent': [
    ...nameAndEmail,
    {
      field: 'studentId',
      rule: 'required',
      to: to('institutionStudentId', 'IA-10.institutionStudentId.required'),
    },
    {
      field: 'studentId',
      rule: 'taken',
      to: to('institutionStudentId', 'IA-10.institutionStudentId.taken'),
    },
  ],
  'PeopleService.addFaculty': nameAndEmail,
  'PeopleService.commitStudentImport': [
    { field: 'file', rule: 'required', to: to('file', 'IA-11.file.required') },
    ...studentImportRows,
  ],
  'PeopleService.deactivateStudent': [reason('IA-07.reason.required')],
  'GroupService.createGroup': [
    { field: 'name', rule: 'required', to: to('name', 'IA-13.name.required') },
    { field: 'name', rule: 'taken', to: to('name', 'IA-13.name.taken') },
  ],
  'GroupService.renameGroup': [
    { field: 'name', rule: 'required', to: to('name', 'IA-13.name.required') },
  ],
  'GroupService.addMembers': [
    { field: 'students', rule: 'required', to: to('studentIds', 'IA-14.studentIds.required') },
  ],
  'FacultyCourseService.assign': [
    { field: 'facultyId', rule: 'active-only', to: to('facultyId', 'IA-15.facultyId.active-only') },
    {
      field: 'courseId',
      rule: 'in-content-access',
      to: to('courseId', 'IA-15.courseId.in-content-access'),
    },
    {
      field: 'courseId',
      rule: 'already-teaches',
      to: to('courseId', 'IA-15.courseId.already-teaches'),
    },
  ],
  'InstitutionCourseCodeService.set': [
    {
      field: 'code',
      rule: 'semester-needs-code',
      to: to('code', 'IA-16.code.semester-needs-code'),
    },
  ],
  'StudentAccessService.previewGiveAccess': giveAccess,
  'StudentAccessService.giveAccess': giveAccess,
  'StudentAccessService.withdrawGrant': [reason('IA-04.reason.required')],
  'FeedbackService.sendFeedback': [
    {
      field: /^rating-(\d+)$/,
      rule: 'choose-rating',
      to: (match) => ({ field: `ratings.${Number(match![1]) - 1}`, key: 'ST-16.rating.required' }),
    },
  ],
  'AssessmentService.createAssessment': [
    { field: 'name', rule: 'required', to: to('name', 'FA-07.name.required') },
    { field: 'name', rule: 'required-for-draft', to: to('name', 'FA-07.name.required-for-draft') },
    {
      field: 'questions',
      rule: 'at-least-one-or-draft',
      to: to('questions', 'FA-07.questions.at-least-one-or-draft'),
    },
    ...assessmentRules,
  ],
  'AssessmentService.updateQuestions': changeAssessment,
  'AssessmentService.useUpdatedVersion': changeAssessment,
  'AssessmentService.updateSettings': changeAssessment,
  'AssessmentService.saveAnswer': [
    {
      field: 'questionId',
      rule: 'not-in-attempt',
      to: to('questionId', 'ST-13.questionId.not-in-attempt'),
    },
    { field: 'value', rule: 'not-an-option', to: to('answer', 'ST-13.answer.not-an-option') },
    { field: 'value', rule: 'type', to: to('answer', 'ST-13.answer.type') },
  ],
  'QuestionBankService.addQuestion': questionContent,
  'QuestionBankService.editQuestion': questionContent,
  'QuestionBankService.addDraftToBank': questionContent,
  'QuestionBankService.requestDrafts': [
    { field: 'pastedText', rule: 'required', to: to('pastedText', 'FA-16.pastedText.required') },
    { field: 'types', rule: 'at-least-one', to: to('types', 'FA-16.types.at-least-one') },
    { field: 'howMany', rule: 'choose', to: to('howMany', 'FA-16.howMany.required') },
  ],
  'QuestionBankService.commitQuestionImport': [
    { field: 'file', rule: 'required', to: to('file', 'FA-17.file.required') },
    ...questionImportRows,
  ],
  'MarkingService.saveMark': [
    { field: 'mark', rule: 'required', to: to('mark', 'FA-19.mark.required') },
    { field: 'mark', rule: 'whole-number-0-to-marks', to: to('mark', 'FA-19.mark.range') },
    {
      field: 'questionId',
      rule: 'not-a-written-question',
      to: to('questionId', 'FA-19.questionId.not-a-written-question'),
    },
  ],
  'MarkingService.confirmMarks': [
    { field: 'mark', rule: 'save-first', to: to('mark', 'FA-19.mark.required') },
  ],
  'ProductionService.saveDraft': vendorDraft,
  'ProductionService.saveRevision': vendorDraft,
  'ProductionService.continueStep': vendorSubmit,
  'ProductionService.submitForReview': vendorSubmit,
  'ProductionService.resubmit': vendorSubmit,
  'ProductionService.approveSubmission': [
    { field: 'outcomes', rule: 'at-least-one', to: to('outcomes', 'RV-03.outcomes.at-least-one') },
  ],
  'ProductionService.returnSubmission': [reason('RV-03.reason.required')],
  'ProductionService.sendBack': [reason('CM-03.reason.required')],
  'ProductionService.overrideStatus': [reason('SA-13.reason.required')],
  'CorrectionService.sendForAcademicReview': [
    {
      field: 'whatChangesAndWhy',
      rule: 'required',
      to: to('whatChangesAndWhy', 'CM-08.whatChangesAndWhy.required'),
    },
    {
      field: 'versionLabel',
      rule: 'required',
      to: to('versionLabel', 'CM-08.versionLabel.required'),
    },
    {
      field: 'versionLabel',
      rule: 'same-as-live',
      to: to('versionLabel', 'CM-08.versionLabel.same-as-live'),
    },
    {
      field: 'summary',
      rule: 'change-something',
      to: to('proposed.summary', 'CM-08.proposed.change-something'),
    },
  ],
  'CorrectionService.withdrawUpdate': [reason('CM-08.reason.required')],
  'CorrectionService.returnUpdate': [reason('RV-04.reason.required')],
  'CorrectionService.holdUpdate': [reason('SA-11.reason.required')],
  'AcademicStructureService.addArea': [
    { field: 'name', rule: 'required', to: to('name', 'SA-14.areaName.required') },
    { field: 'name', rule: 'taken', to: to('name', 'SA-14.areaName.taken') },
  ],
  'AcademicStructureService.addCourse': [
    { field: 'name', rule: 'required', to: to('name', 'SA-14.courseName.required') },
    { field: 'name', rule: 'taken', to: to('name', 'SA-14.courseName.taken') },
    { field: 'areaId', rule: 'required', to: to('areaId', 'SA-14.areaId.required') },
  ],
  'AcademicStructureService.rename': [
    { field: 'name', rule: 'required', to: to('name', 'SA-15.name.required') },
    { field: 'name', rule: 'unchanged', to: to('name', 'SA-15.name.unchanged') },
    {
      field: 'name',
      rule: 'taken',
      to: (_, input) => ({
        field: 'name',
        key:
          inputKind(input, 'kind') === 'area' ? 'SA-15.name.taken-area' : 'SA-15.name.taken-course',
      }),
    },
  ],
  'AcademicStructureService.previewMoveCourse': courseMove,
  'AcademicStructureService.moveCourse': courseMove,
  'PlatformCourseCodeService.save': [
    {
      field: /^(.+)$/,
      rule: 'code-taken',
      to: (match, input) => ({
        field: changeField(input, match![1]!, 'code'),
        key: 'CM-09.code.taken',
      }),
    },
    {
      field: /^(.+)$/,
      rule: 'unknown-course',
      to: (match, input) => ({
        field: changeField(input, match![1]!, 'courseId'),
        key: 'CM-09.courseId.unknown-course',
      }),
    },
  ],
  'PlatformRoleService.registerHolder': [
    { field: 'name', rule: 'required', to: to('name', 'SA-16.name.required') },
    { field: 'workEmail', rule: 'required', to: to('workEmail', 'SA-16.workEmail.required') },
    { field: 'workEmail', rule: 'email-format', to: to('workEmail', 'SA-16.workEmail.format') },
    { field: 'workEmail', rule: 'taken', to: to('workEmail', 'SA-16.workEmail.taken') },
    {
      field: 'organisation',
      rule: 'required',
      to: to('organisation', 'SA-16.organisation.required'),
    },
    { field: 'role', rule: 'platform-role-only', to: to('role', 'SA-16.role.platform-role-only') },
  ],
  'PlatformRoleService.assignScope': [
    {
      field: 'target',
      rule: 'already-in-scope',
      to: to('target', 'SA-17.target.already-in-scope'),
    },
  ],
  'PlatformRoleService.withdrawScope': [reason('SA-17.reason.required')],
  'OperationsService.requestDeviceTransfer': [
    { field: 'newDevice', rule: 'required', to: to('newDevice', 'ST-18.newDevice.required') },
  ],
  'OperationsService.reportProblem': [
    {
      field: 'whatHappened',
      rule: 'required',
      to: to('whatHappened', 'XS-07.whatHappened.required'),
    },
  ],
  'OperationsService.resolveReport': [
    { field: 'note', rule: 'required', to: to('note', 'SA-21.note.required') },
  ],
};

/** The row of a CM-09 change that names `courseId` (`changes.<n>.<member>`), else the course itself. */
function changeField(input: unknown, courseId: string, member: string): string {
  const changes = inputKind(input, 'changes');
  if (Array.isArray(changes)) {
    const index = changes.findIndex(
      (change) =>
        typeof change === 'object' &&
        change !== null &&
        (change as { courseId?: unknown }).courseId === courseId,
    );
    if (index >= 0) return `changes.${index}.${member}`;
  }
  return `courses.${courseId}`;
}

/** The mapping of one domain issue for a method; throws when the domain raised an unmapped issue. */
export function issueTarget(method: MethodId, issue: InputIssue, input: unknown): IssueTarget {
  for (const mapping of DOMAIN_ISSUE_MAP[method] ?? []) {
    if (mapping.rule !== issue.rule) continue;
    if (typeof mapping.field === 'string') {
      if (mapping.field === issue.field) return mapping.to(null, input);
      continue;
    }
    const match = mapping.field.exec(issue.field);
    if (match) return mapping.to(match, input);
  }
  throw new Error(
    `${method}: no contract mapping for the domain issue ${issue.field} / ${issue.rule}.`,
  );
}

/**
 * Field errors for a domain `validation-failed`: one per field, the first issue first. `paramsFor`
 * supplies the record values a message needs; a missing value throws (`fieldError`).
 */
export function fieldErrorsFromDomain(
  method: MethodId,
  issues: readonly InputIssue[],
  input: unknown,
  paramsFor: (
    issue: InputIssue,
    target: IssueTarget,
  ) => Readonly<Record<string, string>> = () => ({}),
): FieldError[] {
  const seen = new Set<string>();
  const errors: FieldError[] = [];
  for (const issue of issues) {
    const target = issueTarget(method, issue, input);
    if (seen.has(target.field)) continue;
    seen.add(target.field);
    const params =
      target.key === 'ST-16.rating.required'
        ? { statement: String(Number(target.field.split('.')[1]) + 1), ...paramsFor(issue, target) }
        : paramsFor(issue, target);
    errors.push(fieldError(target.field, target.key, params));
  }
  return errors;
}

/**
 * A domain refusal as the port's error. `not-permitted`, `invalid-state`, `refused`, `conflict`
 * and `policy-open` carry over unchanged — a `policy-open` stays open, never a default ALLOW or
 * DENY (ADR-0008 decision 7); `validation-failed` gets its field errors and the form's drawn
 * summary title.
 */
export function fromDomainRefusal(
  method: MethodId,
  refusal: Refusal,
  input: unknown,
  form: SummaryForm | null,
  paramsFor?: (issue: InputIssue, target: IssueTarget) => Readonly<Record<string, string>>,
): ServiceError {
  if (refusal.kind === 'validation-failed') {
    return validationFailed(fieldErrorsFromDomain(method, refusal.issues, input, paramsFor), form);
  }
  return refusal;
}

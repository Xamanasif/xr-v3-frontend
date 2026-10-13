/**
 * M20 Assessment (+ versions), M21 Question bank item / assisted draft / import report, M22
 * Attempt, marking and result (Appendix C §2). Every rule belongs to the particular assessment —
 * nothing is pre-filled (BC6): a missing rule is `null`, never a default. Objective marks are
 * supplied values only (DV-2); a result carries no figure until marks are confirmed and the
 * assessment's own release setting is met (B4-13).
 */
import {
  ASSESSMENT_READINESS,
  ATTEMPT_STATES,
  type AnswerValue,
  type Assessment,
  type AssessmentEvent,
  type AssessmentQuestionRef,
  type AssessmentRules,
  type AssessmentVersionSnapshot,
  type Attempt,
  type AttemptMarking,
  type AttemptResult,
  type ChoiceKey,
  QUESTION_IMPORT_COLUMNS,
  QUESTION_STATUSES,
  type Question,
  type QuestionBody,
  type QuestionDraft,
  type QuestionImportReport,
  type QuestionType,
  type QuestionVersion,
  type ReleaseOption,
  type WrittenAnswerMark,
} from '@xr/domain';
import { z } from 'zod';

import {
  actorRef,
  assessmentId,
  attemptId,
  experimentId,
  historyOf,
  importBatchId,
  institutionId,
  isoInstant,
  personId,
  questionDraftId,
  questionId,
  recordMeta,
} from '../kernel/primitives.js';
import { typedAs, vocabulary } from '../kernel/typed.js';

export const RELEASE_OPTIONS = vocabulary<ReleaseOption>()([
  'immediately-after-marking',
  'after-deadline',
  'on-date',
]);
export const QUESTION_TYPES = vocabulary<QuestionType>()([
  'multiple-choice',
  'true-false',
  'written',
]);
export const CHOICE_KEYS = vocabulary<ChoiceKey>()(['A', 'B', 'C', 'D']);
export const ASSESSMENT_EVENTS = vocabulary<AssessmentEvent>()([
  'created',
  'saved-as-draft',
  'became-ready',
  'settings-saved',
  'questions-changed',
  'new-version',
]);

export const releaseOption = z.enum(RELEASE_OPTIONS);
export const questionType = z.enum(QUESTION_TYPES);
export const choiceKey = z.enum(CHOICE_KEYS);
export const assessmentReadiness = z.enum(ASSESSMENT_READINESS);
export const attemptState = z.enum(ATTEMPT_STATES);
export const questionStatus = z.enum(QUESTION_STATUSES);
export const questionImportColumn = z.enum(QUESTION_IMPORT_COLUMNS);

/** No defaults: a rule not yet set is `null` (BC6; B4-04 "nothing comes pre-filled"). */
export const assessmentRules = typedAs<AssessmentRules>()(
  z.object({
    passMarkPercent: z.number().int().min(0).max(100).nullable(),
    attemptsAllowed: z.number().int().min(1).nullable(),
    deadline: isoInstant.nullable(),
    release: z.object({ option: releaseOption, releaseDate: isoInstant.nullable() }).nullable(),
  }),
);

export const assessmentQuestionRef = typedAs<AssessmentQuestionRef>()(
  z.object({ questionId, questionVersion: z.number().int().min(1) }),
);

export const assessmentVersionSnapshot = typedAs<AssessmentVersionSnapshot>()(
  z.object({
    version: z.number().int().min(1),
    since: isoInstant,
    name: z.string(),
    introduction: z.string().nullable(),
    rules: assessmentRules,
    questions: z.array(assessmentQuestionRef),
  }),
);

export const assessment = typedAs<Assessment>()(
  z.object({
    ...recordMeta,
    id: assessmentId,
    institutionId,
    experimentId,
    name: z.string(),
    introduction: z.string().nullable(),
    rules: assessmentRules,
    questions: z.array(assessmentQuestionRef),
    version: z.number().int().min(1),
    versionSince: isoInstant,
    versions: z.array(assessmentVersionSnapshot),
    createdAt: isoInstant,
    createdBy: actorRef,
    readySince: isoInstant.nullable(),
    history: historyOf(ASSESSMENT_EVENTS),
  }),
);

export const questionBody = typedAs<QuestionBody>()(
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('multiple-choice'),
      options: z.partialRecord(choiceKey, z.string()),
      correct: choiceKey,
    }),
    z.object({ type: z.literal('true-false'), correct: z.boolean() }),
    z.object({ type: z.literal('written'), markingGuidance: z.string().nullable() }),
  ]),
);

export const questionVersion = typedAs<QuestionVersion>()(
  z.object({
    version: z.number().int().min(1),
    at: isoInstant,
    text: z.string().min(1),
    body: questionBody,
    marks: z.number().int().min(1),
    explanation: z.string().nullable(),
  }),
);

export const question = typedAs<Question>()(
  z.object({
    ...recordMeta,
    id: questionId,
    institutionId,
    experimentId,
    text: z.string().min(1),
    body: questionBody,
    marks: z.number().int().min(1),
    explanation: z.string().nullable(),
    version: z.number().int().min(1),
    versions: z.array(questionVersion),
    origin: z.enum(['written', 'reviewed-draft', 'import']),
    addedAt: isoInstant,
    addedBy: actorRef,
    deleted: z.object({ at: isoInstant, by: actorRef }).nullable(),
  }),
);

/**
 * A draft held for review; it never enters the bank on its own (Q-06). `institutionId` and
 * `requestedBy` were added in WP-0.9 for Q-05 "own drafts" — Appendix C M21 names no owner field
 * [PROPOSED; provisional register].
 */
export const questionDraft = typedAs<QuestionDraft>()(
  z.object({
    id: questionDraftId,
    institutionId,
    requestedBy: personId,
    experimentId,
    text: z.string().min(1),
    body: questionBody,
    marks: z.null(),
    explanation: z.string().nullable(),
    requestedAt: isoInstant,
  }),
);

export const questionImportReport = typedAs<QuestionImportReport>()(
  z.object({
    batchId: importBatchId,
    fileName: z.string().min(1),
    rowsChecked: z.number().int().min(0),
    rows: z.array(
      z.object({
        row: z.number().int().min(1),
        question: z.string(),
        problem: z.string(),
        severity: z.enum(['error', 'warning']),
      }),
    ),
    canImport: z.boolean(),
  }),
);

export const answerValue = typedAs<AnswerValue>()(
  z.discriminatedUnion('type', [
    z.object({ type: z.literal('multiple-choice'), choice: choiceKey }),
    z.object({ type: z.literal('true-false'), value: z.boolean() }),
    z.object({ type: z.literal('written'), text: z.string() }),
  ]),
);

export const writtenAnswerMark = typedAs<WrittenAnswerMark>()(
  z.object({
    questionId,
    mark: z.number().int().min(0).nullable(),
    feedback: z.string().nullable(),
    savedAt: isoInstant.nullable(),
    savedBy: actorRef.nullable(),
  }),
);

export const attemptMarking = typedAs<AttemptMarking>()(
  z.object({
    automatic: z.array(
      z.object({
        questionId,
        awarded: z.number().min(0),
        outOf: z.number().int().min(1),
      }),
    ),
    written: z.array(writtenAnswerMark),
    confirmed: z.object({ at: isoInstant, by: actorRef }).nullable(),
  }),
);

export const attempt = typedAs<Attempt>()(
  z.object({
    ...recordMeta,
    id: attemptId,
    assessmentId,
    assessmentVersion: z.number().int().min(1),
    studentId: personId,
    attemptNumber: z.number().int().min(1),
    state: attemptState,
    answers: z.partialRecord(questionId, answerValue),
    startedAt: isoInstant,
    submittedAt: isoInstant.nullable(),
    marking: attemptMarking,
  }),
);

export const attemptResult = typedAs<AttemptResult>()(
  z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('in-progress') }),
    z.object({ kind: z.literal('waiting-for-marking') }),
    z.object({ kind: z.literal('not-released-yet'), releaseRule: releaseOption }),
    z.object({
      kind: z.literal('released'),
      releasedAt: isoInstant,
      score: z.number().min(0),
      outOf: z.number().min(0),
      passMarkMarks: z.number().min(0),
      passed: z.boolean(),
      attemptsLeft: z.number().int().min(0),
    }),
  ]),
);

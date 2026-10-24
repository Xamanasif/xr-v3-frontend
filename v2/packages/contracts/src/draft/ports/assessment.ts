/**
 * §3.10 AssessmentService + QuestionBankService — FA-06…FA-17, FA-22; ST-11…ST-14 — and §3.11
 * MarkingService + TeachingService — FA-01…FA-05, FA-18…FA-22.
 *
 * Faculty own assessment creation and marking (BC6). Every rule belongs to the assessment:
 * nothing comes pre-filled, a blank rule is `null`, never a default. There is no Faculty release
 * control (B4-14 D4): a result releases by the assessment's own setting. Objective marks are
 * supplied values only — no scoring function exists (DV-2). No timer, no auto-submit (T-22).
 */
import type {
  Assessment,
  AssessmentRules,
  Attempt,
  ChoiceKey,
  IsoInstant,
  OpenRefusal,
  Question,
  QuestionBody,
  QuestionDraft,
  QuestionImportReport,
} from '@xr/domain';
import {
  isoInstantWire,
  normaliseInstant,
  optionalTrimmed,
  requiredTrimmed,
  WHOLE_NUMBER_FROM_ONE,
  WHOLE_NUMBER_FROM_ZERO,
} from '@xr/validation';
import { z } from 'zod';

import {
  assessmentId,
  attemptId,
  calendarDate,
  experimentId,
  expectedRev,
  ids,
  isoInstant,
  personId,
  questionId,
  technology,
} from '../kernel/primitives.js';
import {
  answerValue,
  assessment,
  assessmentQuestionRef,
  assessmentReadiness,
  attempt,
  attemptResult,
  attemptState,
  CHOICE_KEYS,
  choiceKey,
  question,
  questionDraft,
  questionType,
  releaseOption,
} from '../records/assessment.js';
import { formatProgressView } from '../records/learning.js';
import { studentPerson } from '../records/people.js';
import type { MessageKey } from '../errors/messages.js';
import { fieldError } from '../errors/field-errors.js';
import type {
  FieldError,
  InvalidState,
  NotFound,
  NotPermitted,
  NotSignedIn,
  PolicyOpen,
  Refused,
  StaleVersion,
  Unavailable,
  ValidationFailed,
} from '../errors/service-error.js';
import { courseCard, publicExperimentPage } from './catalogue.js';
import type { Answer, In, Out } from './common.js';
import { key } from './fields.js';

// ---- the rules form "as typed" (B4-04 / B4-06) ----

/** Appendix C `AssessmentRulesInput`: values exactly as typed. */
export const assessmentRulesInput = z.object({
  passMarkPercent: z.string(),
  attemptsAllowed: z.string(),
  /** An RFC 3339 date-time with offset; the form converts the typed value in the display zone. */
  deadline: z.string(),
  releaseOption: releaseOption.nullable(),
  releaseDate: z.string().nullable(),
});

type RawRules = z.output<typeof assessmentRulesInput>;

function instantOrNull(value: string | null): IsoInstant | null | 'invalid' {
  const trimmed = value?.trim() ?? '';
  if (trimmed === '') return null;
  return isoInstantWire.safeParse(trimmed).success
    ? (normaliseInstant(trimmed) as IsoInstant)
    : 'invalid';
}

/**
 * The accepted rules: blank is `null`, never a default (BC6). With `requireAll` ("Create", and the
 * B4-04 rule for a Ready assessment), a missing rule is reported with its drawn words.
 */
function acceptRules(
  raw: RawRules,
  context: z.RefinementCtx,
  path: readonly (string | number)[],
  requireAll: boolean,
): AssessmentRules | null {
  const issue = (field: string, message: MessageKey) =>
    context.addIssue({ code: 'custom', path: [...path, field], message });
  let ok = true;
  const pass = raw.passMarkPercent.trim();
  const passMark =
    pass === ''
      ? null
      : WHOLE_NUMBER_FROM_ZERO.test(pass) && Number(pass) <= 100
        ? Number(pass)
        : NaN;
  if (Number.isNaN(passMark) || (requireAll && passMark === null)) {
    issue('passMarkPercent', key('FA-07.passMarkPercent.range'));
    ok = false;
  }
  const att = raw.attemptsAllowed.trim();
  const attempts = att === '' ? null : WHOLE_NUMBER_FROM_ONE.test(att) ? Number(att) : NaN;
  if (Number.isNaN(attempts) || (requireAll && attempts === null)) {
    issue('attemptsAllowed', key('FA-07.attemptsAllowed.whole-number'));
    ok = false;
  }
  const deadline = instantOrNull(raw.deadline);
  if (deadline === 'invalid') {
    issue('deadline', key('contract.invalid-input'));
    ok = false;
  } else if (requireAll && deadline === null) {
    issue('deadline', key('FA-07.deadline.required'));
    ok = false;
  }
  if (requireAll && raw.releaseOption === null) {
    issue('releaseOption', key('FA-07.releaseOption.required'));
    ok = false;
  }
  const releaseDate = instantOrNull(raw.releaseDate);
  if (raw.releaseOption === 'on-date' && releaseDate === null) {
    issue('releaseDate', key('FA-07.releaseDate.required'));
    ok = false;
  } else if (releaseDate === 'invalid') {
    issue('releaseDate', key('contract.invalid-input'));
    ok = false;
  }
  if (!ok) return null;
  return {
    passMarkPercent: passMark,
    attemptsAllowed: attempts,
    deadline: deadline as IsoInstant | null,
    release:
      raw.releaseOption === null
        ? null
        : {
            option: raw.releaseOption,
            releaseDate: raw.releaseOption === 'on-date' ? (releaseDate as IsoInstant) : null,
          },
  };
}

/**
 * FA-07 (B4-04): "Create" needs a name, every rule and a question; "Save as draft" needs only a
 * name — "Enter a name to save a draft". One assessment per experiment per institution is the
 * domain's answer (`assessment-exists`, OD-B4-01 PROVISIONAL).
 */
export const createAssessmentInput = z
  .object({
    mode: z.enum(['create', 'save-as-draft'], { error: key('contract.invalid-input') }),
    experimentId: ids.in.experiment.nullable(),
    name: z.string(),
    introduction: optionalTrimmed(),
    rules: assessmentRulesInput,
    questions: z.array(ids.in.question, { error: key('contract.invalid-input') }),
  })
  .transform((input, context) => {
    const create = input.mode === 'create';
    let ok = true;
    if (input.experimentId === null) {
      context.addIssue({
        code: 'custom',
        path: ['experimentId'],
        message: key('FA-07.experimentId.required'),
      });
      ok = false;
    }
    const name = input.name.trim();
    if (name === '') {
      context.addIssue({
        code: 'custom',
        path: ['name'],
        message: create ? key('FA-07.name.required') : key('FA-07.name.required-for-draft'),
      });
      ok = false;
    }
    const rules = acceptRules(input.rules, context, ['rules'], create);
    if (create && input.questions.length === 0) {
      context.addIssue({
        code: 'custom',
        path: ['questions'],
        message: key('FA-07.questions.at-least-one-or-draft'),
      });
      ok = false;
    }
    if (!ok || rules === null || input.experimentId === null) return z.NEVER;
    return {
      mode: input.mode,
      experimentId: input.experimentId,
      name,
      introduction: input.introduction,
      rules,
      questions: input.questions,
    };
  });

/** FA-10 (B4-06): whether every rule is required depends on the record (a Ready assessment stays Ready) — the domain decides. */
export const updateSettingsInput = z
  .object({
    id: ids.in.assessment,
    name: z.string(),
    introduction: optionalTrimmed(),
    rules: assessmentRulesInput,
    expectedRev,
  })
  .transform((input, context) => {
    const rules = acceptRules(input.rules, context, ['rules'], false);
    if (rules === null) return z.NEVER;
    return { ...input, name: input.name.trim(), rules };
  });

export const updateQuestionsInput = z.object({
  id: ids.in.assessment,
  questions: z.array(
    z.object({ questionId: ids.in.question, questionVersion: z.number().int().min(1) }),
    { error: key('contract.invalid-input') },
  ),
  expectedRev,
});

export const useUpdatedVersionInput = z.object({
  id: ids.in.assessment,
  questionId: ids.in.question,
  expectedRev,
});

export const saveAnswerInput = z.object({
  attemptId: ids.in.attempt,
  questionId: ids.in.question,
  answer: answerValue.nullable(),
  expectedRev,
});

export const submitAttemptInput = z.object({ attemptId: ids.in.attempt, expectedRev });

// ---- AssessmentService outputs ----

export const listAssessmentsOutput = z.array(
  z.object({
    assessment,
    readiness: assessmentReadiness,
    submitted: z.number().int().min(0),
    reach: z.number().int().min(0),
    /** Submissions with a written answer whose marks are not confirmed (the own assessments'). */
    waitingForMarking: z.number().int().min(0),
    /**
     * PC-74: submissions without a written question whose automatic marks wait for the Faculty
     * member's confirmation (owner decision 24 Oct 2026, M22 / P4-05; 0 on a colleague's).
     */
    waitingToConfirm: z.number().int().min(0),
  }),
);
export const createOptionsOutput = z.array(
  z.object({
    experimentId,
    name: z.string().min(1),
    courseCode: z.string().nullable(),
    existingAssessmentId: assessmentId.nullable(),
  }),
);
/** `passMarkMarks` is pass mark × total; it may be fractional and its rounding is open (M22 [U]). */
export const getAssessmentOutput = z.object({
  assessment,
  readiness: assessmentReadiness,
  reach: z.number().int().min(0),
  /**
   * Students with a submitted attempt on the CURRENT version (PC-53): a change to questions or
   * rules makes a new version exactly while this is above zero (B4-05 f0, B4-06 f1).
   */
  submittedOnCurrentVersion: z.number().int().min(0),
  totalMarks: z.number().int().min(0),
  passMarkMarks: z.number().min(0).nullable(),
  questions: z.array(
    z.object({
      ref: assessmentQuestionRef,
      question,
      newerVersion: z.number().int().min(1).nullable(),
      deletedFromBank: z.boolean(),
    }),
  ),
});
export const changeAssessmentOutput = z.object({ assessment, newVersion: z.boolean() });
/** `releaseChanged` flags the separate result-release warning (B4-06 f2). */
export const updateSettingsOutput = changeAssessmentOutput.extend({ releaseChanged: z.boolean() });
/** FA-11: creates no attempt and saves nothing. */
export const previewAsStudentOutput = z.object({
  questions: z.array(question),
  answerKey: z.array(
    z.object({
      questionId,
      correct: z.string().nullable(),
      markingGuidance: z.string().nullable(),
    }),
  ),
});
// ---- Phase 4B facts (provisional register PC-54 … PC-59) ----

/**
 * The release terms of the version an attempt pins (PC-54): `on` is the deadline for "after the
 * deadline", the release date for "on a date", `null` for "immediately after marking". A submitted
 * attempt keeps its version's terms (P4-06 UNRESOLVED; Phase 4A).
 */
export const pinnedRelease = z.object({
  option: releaseOption.nullable(),
  on: isoInstant.nullable(),
});

/** A question as the Student answers it (PC-55): never its correct answer, explanation or marking guidance. */
export const sheetQuestion = z.object({
  questionId,
  number: z.number().int().min(1),
  type: questionType,
  text: z.string().min(1),
  options: z.partialRecord(choiceKey, z.string()).nullable(),
  marks: z.number().int().min(1),
});

/**
 * One of the Student's own attempts (PC-55), figure-free: `result` is `resultView`'s — no score
 * before the marks are confirmed and the pinned version's release setting is met (ATT-15).
 */
export const studentAttemptFacts = z.object({
  attemptId,
  attemptNumber: z.number().int().min(1),
  state: attemptState,
  startedAt: isoInstant,
  submittedAt: isoInstant.nullable(),
  answered: z.number().int().min(0),
  questionCount: z.number().int().min(0),
  result: attemptResult,
  release: pinnedRelease,
  /**
   * The version it pins (PC-55; Phase 4B review): its question mix, total marks, pass mark,
   * attempts allowed and deadline — what "Before you start" shows beside this attempt's notice.
   */
  pinned: z.object({
    questionTypes: z.object({
      multipleChoice: z.number().int().min(0),
      trueFalse: z.number().int().min(0),
      written: z.number().int().min(0),
    }),
    totalMarks: z.number().int().min(0),
    passMarkPercent: z.number().int().min(0).max(100).nullable(),
    attemptsAllowed: z.number().int().min(1).nullable(),
    deadline: isoInstant.nullable(),
  }),
});

/** The Student's attempt in progress (ST-13; PC-55): its pinned questions and their saved answers. */
export const attemptSheet = z.object({
  attemptId,
  rev: z.number().int().min(1),
  attemptNumber: z.number().int().min(1),
  attemptsAllowed: z.number().int().min(1).nullable(),
  deadline: isoInstant.nullable(),
  totalMarks: z.number().int().min(0),
  answers: z.partialRecord(questionId, answerValue),
  questions: z.array(sheetQuestion),
});

export const listSubmissionsOutput = z.array(
  z.object({
    attempt,
    student: studentPerson,
    score: z.number().min(0).nullable(),
    releasedAt: isoInstant.nullable(),
    /** PC-57: the attempt's total marks and its pinned release terms ("Not yet — after the deadline"). */
    outOf: z.number().int().min(0),
    release: pinnedRelease,
  }),
);
export const csvExportOutput = z.object({ fileName: z.string().min(1), csv: z.string() });
export const toDoResult = z.object({ kind: z.literal('to-do') });
export const listMyAssessmentsOutput = z.array(
  z.object({
    assessment,
    experimentName: z.string().min(1),
    result: z.union([attemptResult, toDoResult]),
    attemptsUsed: z.number().int().min(0),
    /** PC-56: the code Students see, the current version's size and the latest attempt. */
    courseCode: z.string().nullable(),
    questionCount: z.number().int().min(0),
    totalMarks: z.number().int().min(0),
    latest: studentAttemptFacts.nullable(),
  }),
);
export const assessmentIntroOutput = z.object({
  assessment,
  totalMarks: z.number().int().min(0),
  passMarkMarks: z.number().min(0),
  attemptsUsed: z.number().int().min(0),
  canStart: z.boolean(),
  /** PC-55: the experiment, the question mix, the Student's own attempts and the one in progress. */
  experimentName: z.string().min(1),
  courseCode: z.string().nullable(),
  questionTypes: z.object({
    multipleChoice: z.number().int().min(0),
    trueFalse: z.number().int().min(0),
    written: z.number().int().min(0),
  }),
  attempts: z.array(studentAttemptFacts),
  sheet: attemptSheet.nullable(),
});
/** ST-14: withheld until marks are confirmed and the assessment's own release setting is met. */
export const answerReview = z.object({
  questionId,
  yourAnswer: answerValue.nullable(),
  correct: z.string().nullable(),
  explanation: z.string().nullable(),
  feedback: z.string().nullable(),
  awarded: z.number().min(0),
  outOf: z.number().min(0),
  /** PC-55: the pinned question as it was answered, and who wrote the feedback. */
  number: z.number().int().min(1),
  type: questionType,
  text: z.string().min(1),
  options: z.partialRecord(choiceKey, z.string()).nullable(),
  feedbackBy: z.string().nullable(),
});
export const getResultOutput = z.object({
  result: attemptResult,
  review: z.array(answerReview).nullable(),
  /** PC-55: the attempt's pinned version — its name, attempts allowed and release terms. */
  assessmentName: z.string(),
  attemptNumber: z.number().int().min(1),
  attemptsAllowed: z.number().int().min(1).nullable(),
  submittedAt: isoInstant.nullable(),
  release: pinnedRelease,
});

type FacultyWrite = NotSignedIn | NotPermitted | NotFound | Unavailable;

export interface AssessmentService {
  // Faculty
  listAssessments(): Answer<
    Out<typeof listAssessmentsOutput>,
    NotSignedIn | NotPermitted | Unavailable
  >;
  getCreateOptions(): Answer<
    Out<typeof createOptionsOutput>,
    NotSignedIn | NotPermitted | Unavailable
  >;
  createAssessment(
    input: In<typeof createAssessmentInput>,
  ): Answer<Assessment, ValidationFailed | Refused<'assessment-exists'> | FacultyWrite>;
  /** Policy-open: OD-B4-17 (an assessment that pins a colleague's question, Q-10; Phase 4B). */
  getAssessment(
    id: In<typeof ids.in.assessment>,
  ): Answer<
    Out<typeof getAssessmentOutput>,
    NotSignedIn | NotPermitted | NotFound | PolicyOpen | Unavailable
  >;
  /** Policy-open: OD-B4-17 (a co-teaching colleague's assessment). */
  updateQuestions(
    input: In<typeof updateQuestionsInput>,
  ): Answer<
    { readonly assessment: Assessment; readonly newVersion: boolean },
    ValidationFailed | InvalidState | StaleVersion | PolicyOpen | FacultyWrite
  >;
  /** Policy-open: OD-B4-17. */
  useUpdatedVersion(
    input: In<typeof useUpdatedVersionInput>,
  ): Answer<
    { readonly assessment: Assessment; readonly newVersion: boolean },
    InvalidState | StaleVersion | PolicyOpen | FacultyWrite
  >;
  /** Policy-open: OD-B4-17. */
  updateSettings(input: In<typeof updateSettingsInput>): Answer<
    {
      readonly assessment: Assessment;
      readonly newVersion: boolean;
      readonly releaseChanged: boolean;
    },
    ValidationFailed | InvalidState | StaleVersion | PolicyOpen | FacultyWrite
  >;
  /** Policy-open: OD-B4-17 (the answer key of a colleague's question, Q-10). */
  previewAsStudent(
    id: In<typeof ids.in.assessment>,
  ): Answer<
    Out<typeof previewAsStudentOutput>,
    NotSignedIn | NotPermitted | NotFound | PolicyOpen | Unavailable
  >;
  /** Policy-open: OD-B4-17 (a co-teaching colleague's assessment; ATT-18 "own assessments"). */
  listSubmissions(
    id: In<typeof ids.in.assessment>,
  ): Answer<
    Out<typeof listSubmissionsOutput>,
    NotSignedIn | NotPermitted | NotFound | PolicyOpen | Unavailable
  >;
  /** FA-22: the list on screen only, escaped and formula-safe. Policy-open: OD-B4-17. */
  exportSubmissionsCsv(
    id: In<typeof ids.in.assessment>,
  ): Answer<
    Out<typeof csvExportOutput>,
    NotSignedIn | NotPermitted | NotFound | PolicyOpen | Unavailable
  >;
  // Student
  listMyAssessments(): Answer<
    Out<typeof listMyAssessmentsOutput>,
    NotSignedIn | NotPermitted | Unavailable
  >;
  /** A Student never sees an assessment that is not Ready (ASMT-14): `invalid-state`. */
  getAssessmentIntro(
    id: In<typeof ids.in.assessment>,
  ): Answer<
    Out<typeof assessmentIntroOutput>,
    | NotSignedIn
    | NotPermitted
    | NotFound
    | InvalidState
    | Refused<OpenRefusal>
    | PolicyOpen
    | Unavailable
  >;
  /** "Try again" only after a released "Not passed" with an attempt left (B4-13). */
  startAttempt(
    id: In<typeof ids.in.assessment>,
  ): Answer<
    Attempt,
    | NotSignedIn
    | NotPermitted
    | NotFound
    | InvalidState
    | Refused<'no-attempts-left' | 'previous-not-released' | 'already-passed' | OpenRefusal>
    | PolicyOpen
    | Unavailable
  >;
  /** Autosave; `unavailable` → "Your last answer didn’t save" (B4-12). */
  saveAnswer(
    input: In<typeof saveAnswerInput>,
  ): Answer<
    Attempt,
    | ValidationFailed
    | NotSignedIn
    | NotPermitted
    | NotFound
    | InvalidState
    | StaleVersion
    | Unavailable
  >;
  /** Never automatic. `unavailable` → "Your answers weren't submitted" (B4-12). */
  submitAttempt(
    input: In<typeof submitAttemptInput>,
  ): Answer<
    Attempt,
    NotSignedIn | NotPermitted | NotFound | InvalidState | StaleVersion | Unavailable
  >;
  getResult(
    attemptId: In<typeof ids.in.attempt>,
  ): Answer<Out<typeof getResultOutput>, NotSignedIn | NotPermitted | NotFound | Unavailable>;
}

// ---- QuestionBankService ----

/** FA-14: `includeDeleted` is a view filter. */
export const listQuestionsInput = z.object({
  experimentId: ids.in.experiment,
  type: questionType.optional(),
  includeDeleted: z.boolean().optional(),
});

/** Appendix C `QuestionInput`: values as typed; the accepted value is the question's content. */
export const questionInputFields = {
  experimentId: ids.in.experiment,
  type: questionType.nullable(),
  text: z.string(),
  options: z.partialRecord(z.enum(CHOICE_KEYS), z.string()),
  correct: z.string().nullable(),
  marks: z.string(),
  explanation: optionalTrimmed(),
  markingGuidance: optionalTrimmed(),
};

export interface AcceptedQuestion {
  readonly experimentId: z.output<typeof ids.in.experiment>;
  readonly text: string;
  readonly body: QuestionBody;
  readonly marks: number;
  readonly explanation: string | null;
}

/** FA-15 (B4-07 `save`): type, question, two options, the correct answer, whole-number marks. */
function acceptQuestion(
  input: {
    readonly experimentId: z.output<typeof ids.in.experiment>;
    readonly type: z.output<typeof questionType> | null;
    readonly text: string;
    readonly options: Partial<Record<ChoiceKey, string>>;
    readonly correct: string | null;
    readonly marks: string;
    readonly explanation: string | null;
    readonly markingGuidance: string | null;
  },
  context: z.RefinementCtx,
): AcceptedQuestion | null {
  const issue = (field: string, message: MessageKey) =>
    context.addIssue({ code: 'custom', path: [field], message });
  let ok = true;
  if (input.type === null) {
    issue('type', key('FA-15.type.required'));
    ok = false;
  }
  const text = input.text.trim();
  if (text === '') {
    issue('text', key('FA-15.text.required'));
    ok = false;
  }
  let body: QuestionBody | null = null;
  if (input.type === 'multiple-choice') {
    const options: Partial<Record<ChoiceKey, string>> = {};
    for (const choice of CHOICE_KEYS) {
      const value = input.options[choice]?.trim() ?? '';
      if (value !== '') options[choice] = value;
    }
    if (Object.keys(options).length < 2) {
      issue('options', key('FA-15.options.at-least-two'));
      ok = false;
    }
    const correct = input.correct as ChoiceKey | null;
    if (correct === null || !CHOICE_KEYS.includes(correct) || !options[correct]) {
      issue('correct', key('FA-15.correct.choose-correct'));
      ok = false;
    } else body = { type: 'multiple-choice', options, correct };
  } else if (input.type === 'true-false') {
    if (input.correct !== 'true' && input.correct !== 'false') {
      issue('correct', key('FA-15.correct.true-false'));
      ok = false;
    } else body = { type: 'true-false', correct: input.correct === 'true' };
  } else if (input.type === 'written') {
    body = { type: 'written', markingGuidance: input.markingGuidance };
  }
  const marks = input.marks.trim();
  if (!WHOLE_NUMBER_FROM_ONE.test(marks)) {
    issue('marks', key('FA-15.marks.whole-number'));
    ok = false;
  }
  if (!ok || body === null) return null;
  return {
    experimentId: input.experimentId,
    text,
    body,
    marks: Number(marks),
    explanation: input.explanation,
  };
}

export const addQuestionInput = z.object(questionInputFields).transform((input, context) => {
  const accepted = acceptQuestion(input, context);
  return accepted ?? z.NEVER;
});

export const editQuestionInput = z
  .object({ ...questionInputFields, id: ids.in.question, expectedRev })
  .transform((input, context) => {
    const accepted = acceptQuestion(input, context);
    return accepted ? { ...accepted, id: input.id, expectedRev: input.expectedRev } : z.NEVER;
  });

export const addDraftToBankInput = z
  .object({ ...questionInputFields, draftId: ids.in.questionDraft })
  .transform((input, context) => {
    const accepted = acceptQuestion(input, context);
    return accepted ? { ...accepted, draftId: input.draftId } : z.NEVER;
  });

export const deleteQuestionInput = z.object({ id: ids.in.question, expectedRev });

/** FA-16 (B4-08): the material, the pasted text when chosen, at least one type, how many. */
export const requestDraftsInput = z
  .object({
    experimentId: ids.in.experiment,
    source: z.enum(['lab-brief', 'pasted-text']).nullable(),
    pastedText: optionalTrimmed(),
    types: z.array(questionType, { error: key('contract.invalid-input') }),
    howMany: z.union([z.literal(3), z.literal(5)]).nullable(),
  })
  .transform((input, context) => {
    const issue = (field: string, message: MessageKey) =>
      context.addIssue({ code: 'custom', path: [field], message });
    let ok = true;
    if (input.source === null) {
      issue('source', key('FA-16.source.required'));
      ok = false;
    } else if (input.source === 'pasted-text' && input.pastedText === null) {
      issue('pastedText', key('FA-16.pastedText.required'));
      ok = false;
    }
    if (input.types.length === 0) {
      issue('types', key('FA-16.types.at-least-one'));
      ok = false;
    }
    if (input.howMany === null) {
      issue('howMany', key('FA-16.howMany.required'));
      ok = false;
    }
    if (!ok || input.source === null || input.howMany === null) return z.NEVER;
    return { ...input, source: input.source, howMany: input.howMany };
  });

export const discardDraftInput = z.object({ draftId: ids.in.questionDraft });

export const previewQuestionImportInput = z.object({
  experimentId: ids.in.experiment,
  fileName: requiredTrimmed(key('FA-17.file.required')),
  csvText: z.string(),
});

export const commitQuestionImportInput = z.object({ batchId: ids.in.importBatch });

/** A question file that cannot be read at all (its rows are never checked; undrawn on B4-08). */
export const QUESTION_IMPORT_FILE_KEYS = {
  columns: 'FA-17.file.columns',
  'no-rows': 'FA-17.file.no-rows',
} as const satisfies Readonly<Record<string, MessageKey>>;

export const listQuestionsOutput = z.array(z.object({ question, usedIn: z.number().int().min(0) }));
export const getQuestionOutput = z.object({ question, usedIn: z.array(assessmentId) });
export const editQuestionOutput = z.object({ question, newVersion: z.boolean() });
export const listDraftsOutput = z.array(questionDraft);
export const discardDraftOutput = z.object({ discarded: z.literal(true) });
export const commitQuestionImportOutput = z.object({ added: z.array(questionId) });

export interface QuestionBankService {
  listQuestions(
    filter: In<typeof listQuestionsInput>,
  ): Answer<Out<typeof listQuestionsOutput>, NotSignedIn | NotPermitted | Unavailable>;
  /** Policy-open: OD-B4-17 (a colleague's question on a co-taught course, Q-10). */
  getQuestion(
    id: In<typeof ids.in.question>,
  ): Answer<
    Out<typeof getQuestionOutput>,
    NotSignedIn | NotPermitted | NotFound | PolicyOpen | Unavailable
  >;
  addQuestion(
    input: In<typeof addQuestionInput>,
  ): Answer<Question, ValidationFailed | FacultyWrite>;
  /** Policy-open: OD-B4-17. Assessments keep their pinned version ("Use updated version"). */
  editQuestion(
    input: In<typeof editQuestionInput>,
  ): Answer<
    { readonly question: Question; readonly newVersion: boolean },
    ValidationFailed | InvalidState | StaleVersion | PolicyOpen | FacultyWrite
  >;
  /** Policy-open: OD-B4-17. History is kept ("deleted · history kept"). */
  deleteQuestion(
    input: In<typeof deleteQuestionInput>,
  ): Answer<Question, InvalidState | StaleVersion | PolicyOpen | FacultyWrite>;
  /** Drafts are held for review only; nothing enters the bank (T-23: no provider). */
  requestDrafts(
    input: In<typeof requestDraftsInput>,
  ): Answer<readonly QuestionDraft[], ValidationFailed | FacultyWrite>;
  listDrafts(
    experimentId: In<typeof ids.in.experiment>,
  ): Answer<readonly QuestionDraft[], NotSignedIn | NotPermitted | Unavailable>;
  addDraftToBank(
    input: In<typeof addDraftToBankInput>,
  ): Answer<Question, ValidationFailed | FacultyWrite>;
  discardDraft(
    input: In<typeof discardDraftInput>,
  ): Answer<Out<typeof discardDraftOutput>, FacultyWrite>;
  previewQuestionImport(
    input: In<typeof previewQuestionImportInput>,
  ): Answer<QuestionImportReport, ValidationFailed | FacultyWrite>;
  /** All rows or none, never into an assessment (T-24 interim). */
  commitQuestionImport(
    input: In<typeof commitQuestionImportInput>,
  ): Answer<Out<typeof commitQuestionImportOutput>, ValidationFailed | InvalidState | FacultyWrite>;
}

// ---- MarkingService ----

export const listQueueInput = z.object({
  assessmentId: ids.in.assessment.optional(),
  state: z.enum(['waiting', 'marked', 'all'], { error: key('contract.invalid-input') }),
});

/** The mark as typed; it is checked against the question's own marks (`acceptMarkAsTyped`). */
export const saveMarkInput = z.object({
  attemptId: ids.in.attempt,
  questionId: ids.in.question,
  mark: z.string(),
  feedback: optionalTrimmed(),
  expectedRev,
});

export const confirmMarksInput = z.object({ attemptId: ids.in.attempt, expectedRev });

/**
 * FA-19 (B4-09 `markCheck`): "Enter a mark for question <n>" when blank; "Enter a whole number
 * from 0 to <max>" otherwise. The question's number and marks come from the record, so the
 * adapter (and the form) call this with them.
 */
export function acceptMarkAsTyped(
  typed: string,
  questionOf: { readonly number: number; readonly marks: number },
):
  | { readonly ok: true; readonly mark: number }
  | { readonly ok: false; readonly error: FieldError } {
  const value = typed.trim();
  if (value === '') {
    return {
      ok: false,
      error: fieldError('mark', key('FA-19.mark.required'), {
        question: String(questionOf.number),
      }),
    };
  }
  if (!WHOLE_NUMBER_FROM_ZERO.test(value) || Number(value) > questionOf.marks) {
    return {
      ok: false,
      error: fieldError('mark', key('FA-19.mark.range'), { max: String(questionOf.marks) }),
    };
  }
  return { ok: true, mark: Number(value) };
}

/** The pinned questions of an attempt by number (PC-58): "Question 4 · Written answer", "Question 1 · 2 of 2". */
export const pinnedNumbering = z.array(
  z.object({ questionId, number: z.number().int().min(1), type: questionType, marks: z.number() }),
);

export const listQueueOutput = z.array(
  z.object({
    attempt,
    student: studentPerson,
    assessmentName: z.string(),
    submittedAt: isoInstant,
    /**
     * PC-58: the experiment and the written questions' numbers in the attempt's version — empty
     * for an attempt without a written question (its automatic marks wait for confirmation).
     */
    experimentName: z.string(),
    writtenNumbers: z.array(z.number().int().min(1)),
  }),
);
/**
 * `releaseLine` is pre-rendered words (Appendix C [P]) — PROVISIONAL (provisional register).
 * `questions` are the written questions as the attempt's version pins them (Phase 4B).
 */
export const attemptForMarkingOutput = z.object({
  attempt,
  questions: z.array(question),
  releaseLine: z.string().nullable(),
  /** PC-58: who submitted, the assessment and experiment, the pinned rules and numbering. */
  student: studentPerson,
  assessmentName: z.string(),
  experimentName: z.string(),
  attemptsAllowed: z.number().int().min(1).nullable(),
  release: pinnedRelease,
  numbering: pinnedNumbering,
});

type MarkingErrors =
  | NotSignedIn
  | NotPermitted
  | NotFound
  | InvalidState
  | Refused<'marks-confirmed'>
  | StaleVersion
  | PolicyOpen
  | Unavailable;

export interface MarkingService {
  /**
   * Oldest first: every submitted attempt of the Faculty member's own assessments — with written
   * answers to mark (`writtenNumbers`), or with none, waiting for the automatic marks to be
   * confirmed (`writtenNumbers` empty; owner decision of 24 Oct 2026, M22 / P4-05).
   */
  listQueue(
    filter: In<typeof listQueueInput>,
  ): Answer<Out<typeof listQueueOutput>, NotSignedIn | NotPermitted | Unavailable>;
  /** Policy-open: OD-B4-17 (an attempt at a co-teaching colleague's assessment; ASMT-17). */
  getAttemptForMarking(
    attemptId: In<typeof ids.in.attempt>,
  ): Answer<
    Out<typeof attemptForMarkingOutput>,
    NotSignedIn | NotPermitted | NotFound | PolicyOpen | Unavailable
  >;
  /** "Mark saved — not confirmed yet"; the Student sees nothing. Policy-open: OD-B4-17. */
  saveMark(input: In<typeof saveMarkInput>): Answer<Attempt, ValidationFailed | MarkingErrors>;
  /**
   * Once per attempt (owner decisions of 24 Oct 2026): every written answer needs its saved mark
   * first — one written question: `mark`; several: `marks.<questionId>` for each one without a
   * mark (ATT-17, P4-04); an attempt without a written question is confirmed on its automatic
   * marks (M22, P4-05). Policy-open: ATT-07 (objective marks not supplied), OD-B4-17.
   */
  confirmMarks(
    input: In<typeof confirmMarksInput>,
  ): Answer<Attempt, ValidationFailed | MarkingErrors>;
}

// ---- TeachingService ----

export const INACTIVE_FOR_DAYS = [7, 14, 30] as const;

/**
 * FA-20's Progress filter (B4-10 f0; PC-59, provisional reading): no format started; a format in
 * progress; a format completed; the assessment waiting for marking. Shared by the list and its
 * CSV export, so the export holds the filtered list only.
 */
export const STUDENT_PROGRESS_FILTERS = [
  'not-started',
  'in-progress',
  'completed',
  'waiting-for-marking',
] as const;

export const listTeachingStudentsInput = z.object({
  experimentId: ids.in.experiment,
  inactiveForDays: z.union([z.literal(7), z.literal(14), z.literal(30)]).optional(),
  progress: z.enum(STUDENT_PROGRESS_FILTERS, { error: key('contract.invalid-input') }).optional(),
});
export const studentDetailInput = z.object({
  studentId: ids.in.person,
  experimentId: ids.in.experiment,
});

/**
 * FA-20 (B4-10): per-format words, no percentage, no feedback, no score before release.
 * `lastActivityAt` follows the sample rule of OD-B4-10 (PROVISIONAL).
 */
export const facultyStudentRow = z.object({
  studentId: personId,
  institutionStudentId: z.string().min(1),
  perFormat: z.array(formatProgressView),
  /**
   * `policy-open` (Phase 4B protective refusal, PC-59): the assessment was created by a co-teaching
   * colleague — its results are not shown while co-teaching is open (ASMT-17, OD-B4-17; ATT-18
   * "own assessments").
   */
  assessment: z.union([
    attemptResult,
    z.object({ kind: z.literal('none-set') }),
    toDoResult,
    z.object({ kind: z.literal('policy-open'), decision: z.literal('OD-B4-17') }),
  ]),
  resultReleased: z.boolean(),
  lastActivityAt: isoInstant.nullable(),
  inactiveDays: z.number().int().min(0).nullable(),
  /** PC-59: the Student's name and when the experiment was first given to them (B4-10 f0, f5). */
  name: z.string().min(1),
  accessGivenAt: isoInstant.nullable(),
});

/**
 * FA-01 "Needs your attention" (B4-01; Phase 4A, provisional register PC-51): facts, never words —
 * the screen words them (as IA-01's `instituteAttention`, PC-38). In the order B4-01 draws them:
 * written answers waiting for marking per assessment (f0), Students inactive for 14 days or more
 * per experiment (f0; OD-B4-10 sample rule, PC-22), and a taught experiment whose institution
 * access has ended (f3). B4-01's "draft questions need your review" row has no fact: drafts exist
 * only once FA-16 requests them, and T-23 names no provider (FA-16 is not built).
 */
export const facultyAttention = z.discriminatedUnion('kind', [
  /** "1 written answer to mark" · "Heat Exchanger — post-lab · from Rahul Verma, 5 Nov 2026". */
  z.object({
    kind: z.literal('written-answers-to-mark'),
    assessmentId,
    assessmentName: z.string(),
    /**
     * The written answers whose marks are not confirmed — a submission with several written
     * questions counts each one (owner decision 24 Oct 2026, ATT-17 / P4-04; PC-74).
     */
    answers: z.number().int().min(1),
    /** The oldest waiting submission (the queue is oldest first). */
    oldest: z.object({ studentName: z.string().min(1), submittedAt: isoInstant }),
  }),
  /**
   * PC-74: submissions without a written question whose automatic marks wait for the Faculty
   * member's confirmation (owner decision 24 Oct 2026, M22 / P4-05), per own assessment.
   */
  z.object({
    kind: z.literal('marks-to-confirm'),
    assessmentId,
    assessmentName: z.string(),
    submissions: z.number().int().min(1),
    /** The oldest waiting submission (the queue is oldest first). */
    oldest: z.object({ studentName: z.string().min(1), submittedAt: isoInstant }),
  }),
  /** "2 students inactive for 14 days or more" · "Imran Shaikh, Karthik Rao · <experiment>". */
  z.object({
    kind: z.literal('students-inactive'),
    experimentId,
    experimentName: z.string().min(1),
    days: z.literal(14),
    students: z.array(z.object({ studentId: personId, name: z.string().min(1) })).min(1),
  }),
  /** "Your institution’s access to <experiment> ended on 7 Oct 2027" · "ME ZG523 · …". */
  z.object({
    kind: z.literal('access-ended'),
    experimentId,
    experimentName: z.string().min(1),
    courseCode: z.string().nullable(),
    endedOn: calendarDate,
  }),
]);

export const facultyOverviewOutput = z.object({
  scopeLine: z.object({
    courses: z.number().int().min(0),
    experiments: z.number().int().min(0),
  }),
  attention: z.array(facultyAttention),
  /** B4-01 "Coming up · at most 3": Ready assessments due in the next 30 days, soonest first. */
  comingUp: z.array(
    z.object({
      assessmentId,
      /** The assessment's name (PC-51), as the row draws it. */
      name: z.string(),
      deadline: isoInstant,
      submitted: z.number().int().min(0),
      reach: z.number().int().min(0),
    }),
  ),
});
export const teachingCoursesOutput = z.array(
  z.object({
    course: courseCard,
    experiments: z.number().int().min(0),
    studentsWithAccess: z.number().int().min(0),
    assessments: z.number().int().min(0),
    accessEndedOn: calendarDate.nullable(),
  }),
);
export const teachingExperimentOutput = z.object({
  experiment: publicExperimentPage,
  formatsInstitutionHas: z.array(technology),
  formatsUsedByStudents: z.array(technology),
  perFormatCounts: z.array(
    z.object({
      format: technology,
      completed: z.number().int().min(0),
      inProgress: z.number().int().min(0),
      notStarted: z.number().int().min(0),
    }),
  ),
  assessmentId: assessmentId.nullable(),
  /** B4-03 f0 "Resources students see" — the published resources' titles, read-only (PC-52). */
  resources: z.array(z.object({ title: z.string().min(1) })),
  /** B4-03 f0 "Student activity · as of 7 Nov 2026": the instant the counts were read (PC-52). */
  asOf: isoInstant,
});
export const listTeachingStudentsOutput = z.array(facultyStudentRow);
export const studentDetailOutput = z.object({
  row: facultyStudentRow,
  resources: z.array(z.object({ title: z.string().min(1), openedAt: isoInstant.nullable() })),
  /** Empty while the assessment is a co-teaching colleague's (`row.assessment` policy-open). */
  attempts: z.array(attempt),
  /** PC-59: the experiment, and per attempt its confirmed score, total and pinned release terms. */
  experimentName: z.string().min(1),
  courseCode: z.string().nullable(),
  assessment: z.object({ assessmentId, name: z.string() }).nullable(),
  attemptFacts: z.array(
    z.object({
      attemptId,
      attemptsAllowed: z.number().int().min(1).nullable(),
      score: z.number().min(0).nullable(),
      outOf: z.number().int().min(0),
      release: pinnedRelease,
      releasedAt: isoInstant.nullable(),
    }),
  ),
});

export type FacultyStudentRow = Out<typeof facultyStudentRow>;
export type FacultyAttention = Out<typeof facultyAttention>;
export type FacultyOverview = Out<typeof facultyOverviewOutput>;
export type TeachingCourseRow = Out<typeof teachingCoursesOutput>[number];
export type TeachingExperiment = Out<typeof teachingExperimentOutput>;
export type AssessmentListRow = Out<typeof listAssessmentsOutput>[number];
export type CreateOption = Out<typeof createOptionsOutput>[number];
export type AssessmentView = Out<typeof getAssessmentOutput>;
export type AssessmentPreview = Out<typeof previewAsStudentOutput>;
export type QuestionBankRow = Out<typeof listQuestionsOutput>[number];
export type PinnedRelease = Out<typeof pinnedRelease>;
export type SheetQuestion = Out<typeof sheetQuestion>;
export type StudentAttemptFacts = Out<typeof studentAttemptFacts>;
export type AttemptSheet = Out<typeof attemptSheet>;
export type MyAssessmentRow = Out<typeof listMyAssessmentsOutput>[number];
export type AssessmentIntro = Out<typeof assessmentIntroOutput>;
export type AttemptResultView = Out<typeof getResultOutput>;
export type AnswerReview = Out<typeof answerReview>;
export type SubmissionRow = Out<typeof listSubmissionsOutput>[number];
export type MarkingQueueRow = Out<typeof listQueueOutput>[number];
export type AttemptForMarking = Out<typeof attemptForMarkingOutput>;
export type StudentDetail = Out<typeof studentDetailOutput>;
export type StudentProgressFilter = (typeof STUDENT_PROGRESS_FILTERS)[number];
export type CsvExport = Out<typeof csvExportOutput>;

export interface TeachingService {
  getFacultyOverview(): Answer<
    Out<typeof facultyOverviewOutput>,
    NotSignedIn | NotPermitted | Unavailable
  >;
  listMyCourses(): Answer<
    Out<typeof teachingCoursesOutput>,
    NotSignedIn | NotPermitted | Unavailable
  >;
  getTeachingExperiment(
    experimentId: In<typeof ids.in.experiment>,
  ): Answer<
    Out<typeof teachingExperimentOutput>,
    NotSignedIn | NotPermitted | NotFound | Unavailable
  >;
  listStudents(
    input: In<typeof listTeachingStudentsInput>,
  ): Answer<readonly FacultyStudentRow[], NotSignedIn | NotPermitted | Unavailable>;
  getStudentDetail(
    input: In<typeof studentDetailInput>,
  ): Answer<Out<typeof studentDetailOutput>, NotSignedIn | NotPermitted | NotFound | Unavailable>;
  /** "It contains the filtered list only." */
  exportStudentsCsv(
    input: In<typeof listTeachingStudentsInput>,
  ): Answer<Out<typeof csvExportOutput>, NotSignedIn | NotPermitted | Unavailable>;
}

/**
 * The question bank (Appendix C M21; matrix Q-*; B4-07, B4-08). Three question types only (T-22).
 * A used question saves a new version; assessments keep theirs until "Use updated version". A
 * draft — written with assistance — never enters the bank on its own (Q-06) and has no suggested
 * marks (OD-B4-12). Imported questions go into the bank only, never into an assessment (T-24).
 * Who owns the bank (per Faculty member or shared) is open (Q-10; OD-B4-17); choosing the
 * experiment for a new question is not drawn (Q-11) — the bank page names it.
 */
import type { PersonActorRef } from '../roles.js';
import {
  type Decision,
  type InputIssue,
  invalidInput,
  invalidState,
  isBlank,
  isWholeNumber,
  notPermitted,
  ok,
} from '../kernel/decision.js';
import type { IdSource } from '../kernel/id-source.js';
import type { ExperimentId, InstitutionId } from '../kernel/ids.js';
import { newMeta, nextMeta } from '../kernel/record.js';
import type { IsoInstant } from '../kernel/time.js';
import {
  type ChoiceKey,
  QUESTION_IMPORT_COLUMNS,
  type Question,
  type QuestionBody,
  type QuestionDraft,
  type QuestionDraftRequest,
  type QuestionStatus,
} from './model.js';

const CHOICES: readonly ChoiceKey[] = ['A', 'B', 'C', 'D'];

export interface QuestionContent {
  readonly text: string;
  readonly body: QuestionBody;
  readonly marks: number | null;
  readonly explanation: string | null;
}

/** B4-07 rules: "Enter the question"; "Add at least two answer options"; "Choose the correct
 *  answer" / "Choose whether the statement is true or false"; "Enter the marks, as a whole number
 *  of 1 or more" (no upper bound). */
export function questionIssues(content: QuestionContent): InputIssue[] {
  const body = content.body;
  const issues: InputIssue[] = [];
  if (isBlank(content.text)) issues.push({ field: 'text', rule: 'required' });
  if (body.type === 'multiple-choice') {
    const given = CHOICES.filter((key) => !isBlank(body.options[key]));
    if (given.length < 2) issues.push({ field: 'options', rule: 'at-least-two' });
    if (!given.includes(body.correct)) issues.push({ field: 'correct', rule: 'choose-correct' });
  }
  if (content.marks === null || !isWholeNumber(content.marks, 1)) {
    issues.push({ field: 'marks', rule: 'whole-number-1-or-more' });
  }
  return issues;
}

interface FacultyWrite {
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

function created(
  input: FacultyWrite & {
    readonly institutionId: InstitutionId;
    readonly experimentId: ExperimentId;
  },
  content: QuestionContent,
  origin: Question['origin'],
): Question {
  const explanation = isBlank(content.explanation) ? null : content.explanation!.trim();
  return {
    ...newMeta(input.now),
    id: input.ids.next('question'),
    institutionId: input.institutionId,
    experimentId: input.experimentId,
    text: content.text.trim(),
    body: content.body,
    marks: content.marks!,
    explanation,
    version: 1,
    versions: [
      {
        version: 1,
        at: input.now,
        text: content.text.trim(),
        body: content.body,
        marks: content.marks!,
        explanation,
      },
    ],
    origin,
    addedAt: input.now,
    addedBy: input.actor,
    deleted: null,
  };
}

export interface AddQuestionInput extends FacultyWrite, QuestionContent {
  readonly institutionId: InstitutionId;
  readonly experimentId: ExperimentId;
  /** The Faculty member's experiments (the bank of an experiment they teach). */
  readonly taughtExperiments: readonly ExperimentId[];
}

export function questionStatus(question: Question): QuestionStatus {
  return question.deleted ? 'deleted' : 'active';
}

/** Add a question (Q-01). */
export function addQuestion(input: AddQuestionInput): Decision<Question> {
  if (!input.taughtExperiments.includes(input.experimentId)) return notPermitted('out-of-scope');
  const issues = questionIssues(input);
  if (issues.length > 0) return invalidInput(...issues);
  return ok(created(input, input, 'written'));
}

/** Edit a question (Q-02): "Saved as a new version…" — assessments keep their pinned version. */
export function editQuestion(
  input: FacultyWrite & { readonly question: Question; readonly content: QuestionContent },
): Decision<Question> {
  if (input.question.deleted) return invalidState('deleted');
  const issues = questionIssues(input.content);
  if (issues.length > 0) return invalidInput(...issues);
  const version = input.question.version + 1;
  const explanation = isBlank(input.content.explanation) ? null : input.content.explanation!.trim();
  return ok({
    ...input.question,
    ...nextMeta(input.question, input.now),
    text: input.content.text.trim(),
    body: input.content.body,
    marks: input.content.marks!,
    explanation,
    version,
    versions: [
      ...input.question.versions,
      {
        version,
        at: input.now,
        text: input.content.text.trim(),
        body: input.content.body,
        marks: input.content.marks!,
        explanation,
      },
    ],
  });
}

/** Delete a question (Q-03; DL-1, no reason): it leaves the bank, history is kept, assessments
 *  keep their copy (ND-15). */
export function deleteQuestion(
  input: FacultyWrite & { readonly question: Question },
): Decision<Question> {
  if (input.question.deleted) return invalidState('deleted');
  return ok({
    ...input.question,
    ...nextMeta(input.question, input.now),
    deleted: { at: input.now, by: input.actor },
  });
}

/** A request for drafts with assistance (Q-04; B4-08): "Choose the material to draft from" (+ the
 *  pasted text), "Choose at least one question type", "Choose how many drafts you want" (3 / 5).
 *  The drafts themselves are canned sample drafts; no provider is named (ADR-0002). */
export function draftRequestIssues(request: QuestionDraftRequest): InputIssue[] {
  return [
    ...(request.source === 'pasted-text' && isBlank(request.pastedText)
      ? [{ field: 'pastedText', rule: 'required' }]
      : []),
    ...(request.types.length === 0 ? [{ field: 'types', rule: 'at-least-one' }] : []),
    ...(request.howMany !== 3 && request.howMany !== 5
      ? [{ field: 'howMany', rule: 'choose' }]
      : []),
  ];
}

/** Add a reviewed draft to the bank (Q-05): the Faculty member sets the marks; "From a draft you
 *  reviewed". Discarding a draft leaves no trace (nothing is written). */
export function addDraftToBank(
  input: FacultyWrite & {
    readonly draft: QuestionDraft;
    readonly institutionId: InstitutionId;
    readonly taughtExperiments: readonly ExperimentId[];
    readonly content: QuestionContent;
  },
): Decision<Question> {
  if (input.draft.requestedBy !== input.actor.personId) return notPermitted('not-own-record');
  if (
    input.draft.institutionId !== input.institutionId ||
    !input.taughtExperiments.includes(input.draft.experimentId)
  ) {
    return notPermitted('out-of-scope');
  }
  const issues = questionIssues(input.content);
  if (issues.length > 0) return invalidInput(...issues);
  return ok(
    created({ ...input, experimentId: input.draft.experimentId }, input.content, 'reviewed-draft'),
  );
}

/** One CSV row (the ten-column template, B4-08). */
export type QuestionImportRow = { readonly row: number } & Readonly<
  Record<(typeof QUESTION_IMPORT_COLUMNS)[number], string>
>;

export interface ImportCheckRow {
  readonly row: number;
  readonly question: string;
  readonly problem: string;
  readonly severity: 'error' | 'warning';
}

const TYPE_WORDS: Readonly<Record<string, QuestionBody['type']>> = {
  'multiple choice': 'multiple-choice',
  'true or false': 'true-false',
  'written answer': 'written',
};

/** The row's question, or the problems that block it (B4-08 import rules). */
export function parseImportRow(row: QuestionImportRow): {
  readonly content: QuestionContent | null;
  readonly problems: readonly ImportCheckRow[];
} {
  const problems: ImportCheckRow[] = [];
  const fail = (problem: string) =>
    problems.push({ row: row.row, question: row.question, problem, severity: 'error' });
  const type = TYPE_WORDS[row.type.trim().toLowerCase()];
  if (!type) fail('type');
  if (isBlank(row.question)) fail('question');
  const marks = /^\d+$/.test(row.marks.trim()) ? Number(row.marks.trim()) : null;
  if (marks === null || marks < 1) fail('marks');
  let body: QuestionBody | null = null;
  if (type === 'multiple-choice') {
    const options: Partial<Record<ChoiceKey, string>> = {};
    for (const key of CHOICES) {
      const value = row[`option_${key.toLowerCase()}` as 'option_a'];
      if (!isBlank(value)) options[key] = value.trim();
    }
    const correct = row.correct.trim().toUpperCase() as ChoiceKey;
    if (Object.keys(options).length < 2) fail('options');
    if (!CHOICES.includes(correct) || !options[correct]) fail('correct');
    else body = { type, options, correct };
  } else if (type === 'true-false') {
    const correct = row.correct.trim().toUpperCase();
    if (correct !== 'TRUE' && correct !== 'FALSE') fail('correct');
    else body = { type, correct: correct === 'TRUE' };
  } else if (type === 'written') {
    body = {
      type,
      markingGuidance: isBlank(row.marking_guidance) ? null : row.marking_guidance.trim(),
    };
  }
  if (isBlank(row.explanation) && problems.length === 0) {
    problems.push({
      row: row.row,
      question: row.question,
      problem: 'explanation-empty',
      severity: 'warning',
    });
  }
  const blocked = problems.some((problem) => problem.severity === 'error');
  return {
    content:
      blocked || !body
        ? null
        : {
            text: row.question.trim(),
            body,
            marks,
            explanation: isBlank(row.explanation) ? null : row.explanation.trim(),
          },
    problems,
  };
}

/** Commit an import (Q-07): all or nothing while any row has an error (T-24 interim). */
export function commitQuestionImport(
  input: FacultyWrite & {
    readonly rows: readonly QuestionImportRow[];
    readonly institutionId: InstitutionId;
    readonly experimentId: ExperimentId;
    readonly taughtExperiments: readonly ExperimentId[];
  },
): Decision<readonly Question[]> {
  if (!input.taughtExperiments.includes(input.experimentId)) return notPermitted('out-of-scope');
  if (input.rows.length === 0) return invalidInput({ field: 'file', rule: 'required' });
  const parsed = input.rows.map(parseImportRow);
  const errors = parsed.flatMap((entry) =>
    entry.problems.filter((problem) => problem.severity === 'error'),
  );
  if (errors.length > 0) {
    return invalidInput(
      ...errors.map((problem) => ({ field: `row ${problem.row}`, rule: problem.problem })),
    );
  }
  return ok(parsed.map((entry) => created(input, entry.content!, 'import')));
}

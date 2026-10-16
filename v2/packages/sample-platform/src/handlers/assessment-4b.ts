/**
 * Phase 4B (boards B4-06 f7 … f11, B4-08 … B4-13): the facts the Student and Faculty assessment
 * screens read (provisional register PC-54 … PC-59), the answer-key stand-in for choice-question
 * marks (PC-60, owner-approved P4-01 interim), the CSV exports of FA-22, the drafting stand-in of
 * FA-16 and the question import of FA-17.
 *
 * - A submitted attempt keeps its version's terms (P4-06 unresolved): every release fact here is
 *   read from the version the attempt pins, never from a later one.
 * - The Student never receives a correct answer, an explanation or marking guidance before the
 *   result is released (`sheetQuestionOf` copies the options only; `resultView` gates figures).
 * - Drafts and staged import files are adapter state (`PlatformCore.drafts`, `.questionImports`),
 *   never world records: a draft enters the bank only through `addDraftToBank` (Q-05, Q-06).
 */
import type {
  AttemptSheet,
  PinnedRelease,
  SheetQuestion,
  StudentAttemptFacts,
} from '@xr/contracts/draft';
import {
  type AnswerValue,
  applyObjectiveMarks,
  type Assessment,
  type AssessmentRules,
  assessmentVersion,
  type AssessmentVersionSnapshot,
  type Attempt,
  type ExperimentId,
  type InstitutionId,
  type IsoInstant,
  type PersonId,
  pinnedQuestions,
  QUESTION_IMPORT_COLUMNS,
  type Question,
  type QuestionBody,
  type QuestionDraft,
  type QuestionDraftId,
  type QuestionImportRow,
  type QuestionType,
  type QuestionVersion,
  type RecordRef,
  resultReleaseAt,
  resultView,
  systemActor,
  unsafeBrand,
} from '@xr/domain';

import type { PlatformCore } from '../platform/core.js';

export type { StagedQuestionImport } from '../platform/core.js';
import { type Op, settle, systemCommand } from '../pipeline/runner.js';
import { values } from '../world/records.js';
import { csvRecords } from './student-import.js';

// ---- pinned versions ----

/** The version an attempt pins (its snapshot), or the assessment as it is now when none is kept. */
export function pinnedSnapshot(
  assessment: Assessment,
  version: number = assessment.version,
): AssessmentVersionSnapshot {
  return (
    assessmentVersion(assessment, version) ?? {
      version: assessment.version,
      since: assessment.versionSince,
      name: assessment.name,
      introduction: assessment.introduction,
      rules: assessment.rules,
      questions: assessment.questions,
    }
  );
}

/** PC-54: the release option of a version and its date (deadline, release date, or none). */
export function pinnedReleaseOf(rules: AssessmentRules): PinnedRelease {
  const option = rules.release?.option ?? null;
  return {
    option,
    on:
      option === 'after-deadline'
        ? rules.deadline
        : option === 'on-date'
          ? (rules.release?.releaseDate ?? null)
          : null,
  };
}

export interface NumberedQuestion {
  readonly questionId: Question['id'];
  readonly number: number;
  readonly version: QuestionVersion;
}

/** The questions a version pins, numbered in order ("Question 4 of 4"). */
export function numberedQuestions(
  op: Op,
  snapshot: AssessmentVersionSnapshot,
): readonly NumberedQuestion[] {
  return pinnedQuestions(snapshot, values(op.records.questions)).map((entry, index) => ({
    ...entry,
    number: index + 1,
  }));
}

/** The pinned question record for the Faculty: the record with the pinned version's content. */
export function pinnedQuestionRecord(op: Op, entry: NumberedQuestion): Question | null {
  const record = op.records.questions[entry.questionId];
  if (!record) return null;
  return {
    ...record,
    text: entry.version.text,
    body: entry.version.body,
    marks: entry.version.marks,
    explanation: entry.version.explanation,
    version: entry.version.version,
  };
}

export function totalMarksOfSnapshot(op: Op, snapshot: AssessmentVersionSnapshot): number {
  return numberedQuestions(op, snapshot).reduce((sum, entry) => sum + entry.version.marks, 0);
}

/** PC-55: a question as the Student answers it — the options only, never the key. */
export function sheetQuestionOf(entry: NumberedQuestion): SheetQuestion {
  const body = entry.version.body;
  return {
    questionId: entry.questionId,
    number: entry.number,
    type: body.type,
    text: entry.version.text,
    options: body.type === 'multiple-choice' ? { ...body.options } : null,
    marks: entry.version.marks,
  };
}

/** An answer counts as given when it says something (a blank written answer does not). */
export function isAnswered(answer: AnswerValue | undefined): boolean {
  if (!answer) return false;
  return answer.type !== 'written' || answer.text.trim() !== '';
}

/** PC-55: one of the Student's own attempts, figure-free until released (`resultView`). */
export function studentAttemptFactsOf(
  op: Op,
  assessment: Assessment,
  attempt: Attempt,
): StudentAttemptFacts {
  const snapshot = pinnedSnapshot(assessment, attempt.assessmentVersion);
  const pinned = numberedQuestions(op, snapshot);
  return {
    attemptId: attempt.id,
    attemptNumber: attempt.attemptNumber,
    state: attempt.state,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    answered: pinned.filter((entry) => isAnswered(attempt.answers[entry.questionId])).length,
    questionCount: pinned.length,
    result: resultView({
      attempt,
      assessment,
      questions: values(op.records.questions),
      now: op.now,
    }),
    release: pinnedReleaseOf(snapshot.rules),
    pinned: {
      questionTypes: {
        multipleChoice: pinned.filter((entry) => entry.version.body.type === 'multiple-choice')
          .length,
        trueFalse: pinned.filter((entry) => entry.version.body.type === 'true-false').length,
        written: pinned.filter((entry) => entry.version.body.type === 'written').length,
      },
      totalMarks: pinned.reduce((sum, entry) => sum + entry.version.marks, 0),
      passMarkPercent: snapshot.rules.passMarkPercent,
      attemptsAllowed: snapshot.rules.attemptsAllowed,
      deadline: snapshot.rules.deadline,
    },
  };
}

/** PC-55: the attempt in progress — its pinned questions (no key) and the saved answers. */
export function attemptSheetOf(op: Op, assessment: Assessment, attempt: Attempt): AttemptSheet {
  const snapshot = pinnedSnapshot(assessment, attempt.assessmentVersion);
  const pinned = numberedQuestions(op, snapshot);
  return {
    attemptId: attempt.id,
    rev: attempt.rev,
    attemptNumber: attempt.attemptNumber,
    attemptsAllowed: snapshot.rules.attemptsAllowed,
    deadline: snapshot.rules.deadline,
    totalMarks: pinned.reduce((sum, entry) => sum + entry.version.marks, 0),
    answers: { ...attempt.answers },
    questions: pinned.map(sheetQuestionOf),
  };
}

/** A confirmed attempt's score (Faculty only — ATT-19: never before the marks are confirmed). */
export function confirmedScore(attempt: Attempt): number | null {
  if (!attempt.marking.confirmed) return null;
  return (
    attempt.marking.automatic.reduce((sum, mark) => sum + mark.awarded, 0) +
    attempt.marking.written.reduce((sum, mark) => sum + (mark.mark ?? 0), 0)
  );
}

/** When a confirmed attempt's result is (or was) released by its pinned version's setting. */
export function releaseInstantOf(assessment: Assessment, attempt: Attempt): IsoInstant | null {
  const confirmed = attempt.marking.confirmed;
  if (!confirmed) return null;
  return resultReleaseAt(pinnedSnapshot(assessment, attempt.assessmentVersion).rules, confirmed.at);
}

// ---- co-teaching (Phase 4B protective refusal; ASMT-17, OD-B4-17) ----

/**
 * An assessment a co-teaching colleague created: its submissions, marking and results are not
 * shown while co-teaching is open (ATT-18 "own assessments"; ASMT-17 OPEN). The build decides
 * nothing about ownership: it refuses with `policy-open` OD-B4-17.
 */
export function isColleagueAssessment(assessment: Assessment, personId: PersonId): boolean {
  const creator = assessment.createdBy;
  return creator.kind === 'person' && creator.personId !== personId;
}

// ---- the answer-key stand-in (PC-60; owner answer to P4-01, 16 Oct 2026) ----

/** Whether a choice answer equals the pinned version's key (written answers are never compared). */
function equalsKey(body: QuestionBody, answer: AnswerValue | undefined): boolean {
  if (!answer) return false;
  if (body.type === 'multiple-choice')
    return answer.type === 'multiple-choice' && answer.choice === body.correct;
  if (body.type === 'true-false')
    return answer.type === 'true-false' && answer.value === body.correct;
  return false;
}

/**
 * The sample platform's `system:objective-marks` stand-in in a local prototype build: right after a
 * Student submits, each single-choice and true-or-false question of the attempt's version is given
 * its full marks when the answer equals that version's key, else 0 — applied through the domain's
 * `applyObjectiveMarks` with sample provenance. Written answers stay the Faculty member's (ATT-08).
 * Nothing is written for an attempt without choice questions.
 */
export function markChoiceQuestionsByKey(
  core: PlatformCore,
  attemptId: string,
): readonly RecordRef[] {
  const outcome = systemCommand(core, 'ObjectiveMarks.answerKey', 'sample-standin', (op) => {
    const attempt = op.found(op.records.attempts[attemptId]);
    const assessment = op.found(op.records.assessments[attempt.assessmentId]);
    const actor = systemActor('system:objective-marks');
    const choice = numberedQuestions(
      op,
      pinnedSnapshot(assessment, attempt.assessmentVersion),
    ).filter((entry) => entry.version.body.type !== 'written');
    if (choice.length === 0 || attempt.marking.automatic.length > 0) {
      return { value: attempt, decision: 'applyObjectiveMarks', actor };
    }
    const next = settle(
      applyObjectiveMarks({
        attempt,
        assessment,
        questions: values(op.records.questions),
        supplied: choice.map((entry) => ({
          questionId: entry.questionId,
          awarded: equalsKey(entry.version.body, attempt.answers[entry.questionId])
            ? entry.version.marks
            : 0,
        })),
        actor,
        now: op.now,
      }),
    );
    op.tx.put('attempts', next.id, next);
    return { value: next, decision: 'applyObjectiveMarks', actor };
  });
  return outcome.ok ? outcome.changed : [];
}

// ---- FA-22 CSV (escaped, formula-safe) ----

/**
 * One CSV cell (RFC 4180): quoted when it holds a comma, quote or line break, quotes doubled. A
 * value a spreadsheet would read as a formula — starting with `=`, `+`, `-`, `@`, a tab or a
 * carriage return — is written with a leading apostrophe (OWASP CSV injection).
 */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** CSV text with a header row, CRLF line ends, a final line end. */
export function csvText(rows: readonly (readonly string[])[]): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const IST_PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function istParts(instant: string): Record<string, string> {
  return Object.fromEntries(
    IST_PARTS.formatToParts(new Date(instant))
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );
}

/** "5 Nov 2026" — the sample world's dates are Indian time, as the screens read them. */
export function csvDate(instant: string): string {
  const parts = istParts(instant);
  return `${Number(parts['day'])} ${MONTHS[Number(parts['month']) - 1]} ${parts['year']}`;
}

/** "5 Nov 2026, 18:52". */
export function csvDateTime(instant: string): string {
  const parts = istParts(instant);
  return `${csvDate(instant)}, ${parts['hour']}:${parts['minute']}`;
}

/** A file-name part: lower case, letters and digits joined by hyphens. */
export function fileSlug(text: string): string {
  return (
    text
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'list'
  );
}

/** "Not yet — after the deadline" / "Released 14 Nov 2026, 23:59" (B4-06 f7 … f9). */
export function releasedWords(release: PinnedRelease, releasedAt: IsoInstant | null): string {
  if (releasedAt) return `Released ${csvDateTime(releasedAt)}`;
  switch (release.option) {
    case 'immediately-after-marking':
      return 'Not yet — when marked';
    case 'after-deadline':
      return 'Not yet — after the deadline';
    case 'on-date':
      return release.on ? `Not yet — on ${csvDateTime(release.on)}` : 'Not yet — on a date';
    default:
      return 'Not yet';
  }
}

// ---- FA-16 the drafting stand-in (T-23: no provider; OD-B4-12) ----

interface DraftContent {
  readonly text: string;
  readonly body: QuestionBody;
  readonly explanation: string | null;
}

/** Sample drafts for a heat-exchanger experiment's lab brief (B4-08 f1 draws the first three). */
const HEAT_EXCHANGER_DRAFTS: Readonly<Record<QuestionType, readonly DraftContent[]>> = {
  'multiple-choice': [
    {
      text: 'What is the log mean temperature difference (LMTD) used for?',
      body: {
        type: 'multiple-choice',
        options: {
          A: 'Sizing the exchanger from its duty and overall coefficient',
          B: 'Measuring the pressure drop across the tubes',
          C: 'Setting the cold-side flow rate',
          D: 'Estimating the fouling factor directly',
        },
        correct: 'A',
      },
      explanation: 'q = U A ΔT_lm: the LMTD is the mean driving force used to size the area.',
    },
    {
      text: 'Which heat-capacity rate sets the largest heat transfer possible, q_max?',
      body: {
        type: 'multiple-choice',
        options: { A: 'C_max', B: 'C_min', C: 'The hot-side rate only', D: 'Their sum' },
        correct: 'B',
      },
      explanation: 'q_max = C_min (T_h,in − T_c,in).',
    },
    {
      text: 'How is the number of transfer units (NTU) defined?',
      body: {
        type: 'multiple-choice',
        options: { A: 'UA ÷ C_min', B: 'C_min ÷ C_max', C: 'q ÷ q_max', D: 'UA ÷ C_max' },
        correct: 'A',
      },
      explanation: 'NTU = UA ÷ C_min.',
    },
    {
      text: 'Which arrangement gives the largest mean temperature difference for the same inlets?',
      body: {
        type: 'multiple-choice',
        options: { A: 'Counter flow', B: 'Parallel flow', C: 'Both are equal', D: 'Neither' },
        correct: 'A',
      },
      explanation: 'Counter flow keeps the two streams further apart along the exchanger.',
    },
    {
      text: 'What does fouling add to the overall resistance to heat transfer?',
      body: {
        type: 'multiple-choice',
        options: {
          A: 'A resistance in series with the others',
          B: 'A resistance in parallel with the others',
          C: 'Nothing: it changes only the flow rate',
          D: 'A negative resistance',
        },
        correct: 'A',
      },
      explanation: 'Fouling layers add resistances in series, so U falls.',
    },
  ],
  'true-false': [
    {
      text: 'Counter flow always needs a larger area than parallel flow for the same duty.',
      body: { type: 'true-false', correct: false },
      explanation:
        'Counter flow has the larger mean temperature difference, so it needs less area.',
    },
    {
      text: 'Raising the fouling factor lowers the overall heat transfer coefficient U.',
      body: { type: 'true-false', correct: true },
      explanation: 'Fouling adds a thermal resistance in series, so U falls.',
    },
    {
      text: 'The effectiveness of a heat exchanger can be greater than 1.',
      body: { type: 'true-false', correct: false },
      explanation: 'Effectiveness is q ÷ q_max, which cannot exceed 1.',
    },
    {
      text: 'At a fixed NTU, effectiveness depends on the heat-capacity rate ratio C_min ÷ C_max.',
      body: { type: 'true-false', correct: true },
      explanation: 'The ε–NTU relations depend on both NTU and C_r = C_min ÷ C_max.',
    },
    {
      text: 'Increasing the cold-side flow rate always lowers the cold-side outlet temperature.',
      body: { type: 'true-false', correct: true },
      explanation: 'At the same duty, a larger C_c gives a smaller temperature rise.',
    },
  ],
  written: [
    {
      text: 'Compare countercurrent and cocurrent arrangements at matched duty, using your readings.',
      body: {
        type: 'written',
        markingGuidance:
          'Look for: counter flow’s larger mean temperature difference; less area or more duty; readings quoted from the simulation.',
      },
      explanation: null,
    },
    {
      text: 'Explain how the effectiveness changes as NTU increases, using what you observed.',
      body: {
        type: 'written',
        markingGuidance:
          'Look for: effectiveness rises with NTU and levels off; a reading from the simulation.',
      },
      explanation: null,
    },
    {
      text: 'Describe how you would find the overall coefficient U from your readings.',
      body: {
        type: 'written',
        markingGuidance: 'Look for: the duty from one stream, the LMTD, then U = q ÷ (A ΔT_lm).',
      },
      explanation: null,
    },
    {
      text: 'Explain why exchangers are designed with a fouling allowance.',
      body: {
        type: 'written',
        markingGuidance: 'Look for: U falls in service; extra area keeps the duty; cleaning.',
      },
      explanation: null,
    },
    {
      text: 'Compare the outlet temperatures you measured with and without fouling.',
      body: {
        type: 'written',
        markingGuidance: 'Look for: hot outlet hotter, cold outlet cooler; less heat passed.',
      },
      explanation: null,
    },
  ],
};

/** Sample drafts for any other experiment, worded from its name. */
function genericDrafts(
  experimentName: string,
): Readonly<Record<QuestionType, readonly DraftContent[]>> {
  return {
    'multiple-choice': [
      {
        text: `Which reading should you record first in the ${experimentName} simulation?`,
        body: {
          type: 'multiple-choice',
          options: {
            A: 'The conditions you set before you start',
            B: 'The final result only',
            C: 'Nothing until the run ends',
            D: 'The time taken',
          },
          correct: 'A',
        },
        explanation: 'Recording the set conditions first lets you compare runs.',
      },
      {
        text: `What does changing one input at a time in ${experimentName} let you see?`,
        body: {
          type: 'multiple-choice',
          options: {
            A: 'The effect of that input alone',
            B: 'Nothing useful',
            C: 'Only the simulation’s speed',
            D: 'The effect of every input at once',
          },
          correct: 'A',
        },
        explanation: 'Holding the other inputs fixed isolates the effect of the one you change.',
      },
    ],
    'true-false': [
      {
        text: `A single run of ${experimentName} is enough to describe a trend.`,
        body: { type: 'true-false', correct: false },
        explanation: 'A trend needs several runs across a range of conditions.',
      },
      {
        text: `Readings from ${experimentName} should be compared with the theory in the lab brief.`,
        body: { type: 'true-false', correct: true },
        explanation: 'Comparing with theory shows where the model and the readings agree.',
      },
    ],
    written: [
      {
        text: `Describe one result you observed in ${experimentName} and explain its cause.`,
        body: {
          type: 'written',
          markingGuidance: 'Look for: a stated observation, its cause, and a reading quoted.',
        },
        explanation: null,
      },
      {
        text: `What would you change in ${experimentName} to test your explanation, and why?`,
        body: {
          type: 'written',
          markingGuidance: 'Look for: one input changed, a prediction, and the reason for it.',
        },
        explanation: null,
      },
    ],
  };
}

/** Sample drafts from pasted text: worded from its first sentence (no provider reads it). */
function pastedDrafts(pasted: string): Readonly<Record<QuestionType, readonly DraftContent[]>> {
  const first = (pasted.split(/(?<=[.!?])\s/)[0] ?? pasted).trim().slice(0, 140);
  const quoted = `“${first}”`;
  return {
    'multiple-choice': [
      {
        text: `Which statement best summarises this passage: ${quoted}?`,
        body: {
          type: 'multiple-choice',
          options: {
            A: 'It states the main idea of the passage',
            B: 'It contradicts the passage',
            C: 'It is unrelated to the passage',
            D: 'It repeats only the title',
          },
          correct: 'A',
        },
        explanation: null,
      },
    ],
    'true-false': [
      {
        text: `The passage says: ${quoted}`,
        body: { type: 'true-false', correct: true },
        explanation: null,
      },
    ],
    written: [
      {
        text: `In your own words, explain this passage and relate it to your readings: ${quoted}`,
        body: {
          type: 'written',
          markingGuidance: 'Look for: the passage’s idea restated, and a link to a reading.',
        },
        explanation: null,
      },
    ],
  };
}

const TYPE_ORDER: readonly QuestionType[] = ['multiple-choice', 'true-false', 'written'];

/**
 * Distinct drafts of one type: the library's own first, then numbered variants of them (never the
 * same words twice in one request — Phase 4B review), so 5 drafts of one type are 5 drafts.
 */
function distinctDrafts(options: readonly DraftContent[], count: number): DraftContent[] {
  return Array.from({ length: count }, (_, index) => {
    const base = options[index % options.length]!;
    const round = Math.floor(index / options.length);
    return round === 0 ? base : { ...base, text: `${base.text} (variant ${round + 1})` };
  });
}

/** Per platform: the next draft number (adapter state, never a world record). */
const draftCounters = new WeakMap<object, number>();

/**
 * FA-16's sample stand-in (no provider, T-23): `howMany` drafts of the chosen types, in type order,
 * from the lab brief's sample library or worded from the pasted text. Deterministic — the same
 * request always gives the same words. Each draft is "Draft — needs your review": its marks are
 * the Faculty member's to set (`marks: null`), and nothing enters the bank until they add it.
 */
export function sampleDrafts(
  core: PlatformCore,
  request: {
    readonly institutionId: InstitutionId;
    readonly requestedBy: PersonId;
    readonly experimentId: ExperimentId;
    readonly experimentName: string;
    readonly source: 'lab-brief' | 'pasted-text';
    readonly pastedText: string | null;
    readonly types: readonly QuestionType[];
    readonly howMany: number;
    readonly now: IsoInstant;
  },
): QuestionDraft[] {
  const library =
    request.source === 'pasted-text'
      ? pastedDrafts(request.pastedText ?? '')
      : /heat exchanger/i.test(request.experimentName)
        ? HEAT_EXCHANGER_DRAFTS
        : genericDrafts(request.experimentName);
  const types = TYPE_ORDER.filter((type) => request.types.includes(type));
  const perType = new Map<QuestionType, number>();
  for (let index = 0; index < request.howMany; index += 1) {
    const type = types[index % types.length]!;
    perType.set(type, (perType.get(type) ?? 0) + 1);
  }
  const pools = new Map(
    types.map((type) => [type, distinctDrafts(library[type], perType.get(type) ?? 0)]),
  );
  const used = new Map<QuestionType, number>();
  const drafts: QuestionDraft[] = [];
  for (let index = 0; index < request.howMany; index += 1) {
    const type = types[index % types.length]!;
    const taken = used.get(type) ?? 0;
    used.set(type, taken + 1);
    const content = pools.get(type)![taken]!;
    const number = (draftCounters.get(core) ?? 0) + 1;
    draftCounters.set(core, number);
    drafts.push({
      id: unsafeBrand<QuestionDraftId>(`qd-${String(number).padStart(4, '0')}`),
      institutionId: request.institutionId,
      requestedBy: request.requestedBy,
      experimentId: request.experimentId,
      text: content.text,
      body: content.body,
      marks: null,
      explanation: content.explanation,
      requestedAt: request.now,
    });
  }
  return drafts;
}

// ---- FA-17 question import (T-24 interim: the CSV template, all or nothing) ----

/** Why a question file cannot be read at all (its rows are never checked). */
export type QuestionFileProblem = 'no-rows' | 'columns';

/**
 * The template's ten columns, in any order, header names compared without case or surrounding
 * spaces; every other column is ignored. Blank lines are skipped. Rows are numbered as the file
 * shows them (the header is row 1).
 */
export function parseQuestionFile(
  text: string,
):
  | { readonly kind: 'rows'; readonly rows: QuestionImportRow[] }
  | { readonly kind: QuestionFileProblem } {
  const records = csvRecords(text);
  const nonBlank = records
    .map((cells, index) => ({ cells, row: index + 1 }))
    .filter((record) => record.cells.some((cell) => cell.trim() !== ''));
  if (nonBlank.length === 0) return { kind: 'no-rows' };
  const [header, ...body] = nonBlank;
  const names = header!.cells.map((cell) => cell.trim().toLowerCase());
  const at = new Map<string, number>();
  for (const column of QUESTION_IMPORT_COLUMNS) {
    const index = names.indexOf(column);
    if (index < 0) return { kind: 'columns' };
    at.set(column, index);
  }
  if (body.length === 0) return { kind: 'no-rows' };
  return {
    kind: 'rows',
    rows: body.map(({ cells, row }) => {
      const entry: Record<string, string | number> = { row };
      for (const column of QUESTION_IMPORT_COLUMNS) entry[column] = cells[at.get(column)!] ?? '';
      return entry as unknown as QuestionImportRow;
    }),
  };
}

/** Per platform: the next staged question file's number (adapter state). */
const questionImportCounters = new WeakMap<object, number>();

export function nextQuestionBatchId(core: PlatformCore, fileName: string): string {
  const next = (questionImportCounters.get(core) ?? 0) + 1;
  questionImportCounters.set(core, next);
  const safe = fileName.replace(/[^\w.-]+/g, '-').slice(0, 60);
  return `qimp-${String(next).padStart(4, '0')}-${safe}`;
}

const CHOICE_LETTERS = ['A', 'B', 'C', 'D'] as const;

/** "A–D", "A–B", or "A, C" — the options a row fills. */
function optionsText(row: QuestionImportRow): string {
  const filled = CHOICE_LETTERS.filter(
    (letter) => row[`option_${letter.toLowerCase()}` as 'option_a'].trim() !== '',
  );
  if (filled.length === 0) return 'none';
  const contiguous = filled.every((letter, index) => letter === CHOICE_LETTERS[index]);
  return contiguous && filled.length > 1 ? `A–${filled.at(-1)!}` : filled.join(', ');
}

/** The cell values a row problem's drawn words name (`FA-17.row.type`, `FA-17.row.correct`). */
export function importProblemParams(
  rule: string,
  row: QuestionImportRow,
): Readonly<Record<string, string>> {
  if (rule === 'type') return { value: row.type.trim() };
  if (rule === 'correct') return { value: row.correct.trim(), options: optionsText(row) };
  return {};
}

/**
 * One report row's problem (PC-61): the domain's rule, with the cells its drawn words name as URL
 * parameters — `type?value=multi-select`, `correct?value=E&options=A–D` (B4-08 f6) — so the screen
 * words it from the catalogue (`FA-17.row.*`) without reading the file again.
 */
export function importProblem(rule: string, row: QuestionImportRow): string {
  const params = importProblemParams(rule, row);
  return Object.keys(params).length === 0
    ? rule
    : `${rule}?${new URLSearchParams(params).toString()}`;
}

/**
 * Attempts, marking and results (Appendix C M22; matrix ATT-*; B4-09 … B4-14).
 *
 * - No timer, no auto-submit; nothing is submitted until Submit (ATT-04).
 * - Choice-question marks are supplied by fixtures through the system stand-in only — this package
 *   has no scoring function and never compares an answer with a key (DV-2; ATT-07).
 * - Written answers are marked by Faculty (whole numbers 0 … the question's marks; ATT-08, ATT-21);
 *   confirmed marks are read-only (ATT-10). An attempt's marks are confirmed once, by the Faculty
 *   member, whatever its shape (owner decisions of 24 Oct 2026: no written question — the
 *   automatic marks are confirmed (M22 [U], P4-05); several written questions — every written
 *   answer's mark is saved first, then the attempt is confirmed once (ATT-17, P4-04)).
 * - The result is released by the assessment's own setting, derived from the clock — no stored
 *   flag, no Faculty release control (ATT-13 SYSTEM, ATT-14 DENY). Before release the Student sees
 *   no figure (ATT-15).
 */
import type { PersonActorRef, SystemActorRef } from '../roles.js';
import {
  type Decision,
  invalidInput,
  invalidState,
  isWholeNumber,
  notPermitted,
  ok,
  policyOpen,
  refused,
} from '../kernel/decision.js';
import type { IdSource } from '../kernel/id-source.js';
import type { QuestionId } from '../kernel/ids.js';
import { isDrawnTransition } from '../kernel/machine.js';
import { newMeta, nextMeta } from '../kernel/record.js';
import { type IsoInstant, laterOf } from '../kernel/time.js';
import type { OpenGate } from '../access/model.js';
import { assessmentReadiness, assessmentVersion } from './assessment.js';
import {
  ATTEMPT_TRANSITIONS,
  type AnswerValue,
  type Assessment,
  type AssessmentRules,
  type AssessmentVersionSnapshot,
  type Attempt,
  type AttemptCommand,
  type AttemptResult,
  type AttemptState,
  type Question,
  type QuestionVersion,
  type StudentAssessmentStatus,
} from './model.js';

function can(attempt: Attempt | null, to: AttemptState, command: AttemptCommand): boolean {
  return isDrawnTransition(ATTEMPT_TRANSITIONS, attempt?.state ?? null, to, command);
}

/** The questions an attempt answers: its assessment version's pinned question versions. */
export function pinnedQuestions(
  snapshot: AssessmentVersionSnapshot,
  questions: readonly Question[],
): readonly { readonly questionId: QuestionId; readonly version: QuestionVersion }[] {
  return snapshot.questions.flatMap((ref) => {
    const question = questions.find((candidate) => candidate.id === ref.questionId);
    const version = question?.versions.find(
      (candidate) => candidate.version === ref.questionVersion,
    );
    return version ? [{ questionId: ref.questionId, version }] : [];
  });
}

/**
 * When a confirmed result is released by the assessment's own setting (B4-04 option texts;
 * PROPOSED reading): immediately → when marks are confirmed; after the deadline → the later of the
 * deadline and the confirmation; on a date → the later of that date and the confirmation.
 */
export function resultReleaseAt(
  rules: AssessmentRules,
  marksConfirmedAt: IsoInstant,
): IsoInstant | null {
  const release = rules.release;
  if (!release) return null;
  if (release.option === 'immediately-after-marking') return marksConfirmedAt;
  if (release.option === 'after-deadline')
    return rules.deadline ? laterOf(rules.deadline, marksConfirmedAt) : null;
  return release.releaseDate ? laterOf(release.releaseDate, marksConfirmedAt) : null;
}

/** Every pinned choice question of the attempt's version has a supplied mark (DV-2). */
function objectiveMarksComplete(
  attempt: Attempt,
  snapshot: AssessmentVersionSnapshot | null,
  questions: readonly Question[],
): boolean {
  const choice = (snapshot ? pinnedQuestions(snapshot, questions) : []).filter(
    (entry) => entry.version.body.type !== 'written',
  );
  return choice.every((entry) =>
    attempt.marking.automatic.some((mark) => mark.questionId === entry.questionId),
  );
}

/** The Student's result view (`resultView`, Appendix D §5.3): no figure before release, and none
 *  from a missing mark — a confirmed attempt without every choice mark reads as waiting. */
export function resultView(input: {
  readonly attempt: Attempt;
  readonly assessment: Assessment;
  readonly questions: readonly Question[];
  readonly now: IsoInstant;
}): AttemptResult {
  const attempt = input.attempt;
  if (attempt.state === 'in-progress') return { kind: 'in-progress' };
  const confirmed = attempt.marking.confirmed;
  if (!confirmed) return { kind: 'waiting-for-marking' };
  const snapshot = assessmentVersion(input.assessment, attempt.assessmentVersion);
  if (!objectiveMarksComplete(attempt, snapshot, input.questions)) {
    return { kind: 'waiting-for-marking' };
  }
  const rules = snapshot?.rules ?? input.assessment.rules;
  const releasedAt = resultReleaseAt(rules, confirmed.at);
  if (!releasedAt || input.now < releasedAt) {
    return { kind: 'not-released-yet', releaseRule: rules.release?.option ?? 'after-deadline' };
  }
  const pinned = snapshot ? pinnedQuestions(snapshot, input.questions) : [];
  const outOf = pinned.reduce((sum, entry) => sum + entry.version.marks, 0);
  const score =
    attempt.marking.automatic.reduce((sum, mark) => sum + mark.awarded, 0) +
    attempt.marking.written.reduce((sum, mark) => sum + (mark.mark ?? 0), 0);
  const passMark = rules.passMarkPercent ?? 0;
  return {
    kind: 'released',
    releasedAt,
    score,
    outOf,
    passMarkMarks: (passMark * outOf) / 100,
    passed: score * 100 >= passMark * outOf,
    attemptsLeft: Math.max(0, (rules.attemptsAllowed ?? 0) - attempt.attemptNumber),
  };
}

/**
 * `assessmentForStudent` (Appendix D §5.3; ASMT-14, ASMT-16): a Ready assessment of an experiment
 * the Student has is listed (To do, or the latest attempt's state); a draft is never visible.
 * Starting also needs the gate to be open.
 */
export function assessmentForStudent(input: {
  readonly assessment: Assessment;
  /** The Student has an active grant for the assessment's experiment. */
  readonly hasExperiment: boolean;
  readonly gate: OpenGate;
  readonly attempts: readonly Attempt[];
  readonly questions: readonly Question[];
  readonly now: IsoInstant;
}):
  | { readonly visible: false }
  | {
      readonly visible: true;
      readonly status: StudentAssessmentStatus;
      readonly canStart: boolean;
    } {
  if (assessmentReadiness(input.assessment) !== 'ready' || !input.hasExperiment)
    return { visible: false };
  const latest = [...input.attempts].sort((a, b) => a.attemptNumber - b.attemptNumber).at(-1);
  const status: StudentAssessmentStatus = latest
    ? resultView({
        attempt: latest,
        assessment: input.assessment,
        questions: input.questions,
        now: input.now,
      }).kind
    : 'to-do';
  return { visible: true, status, canStart: input.gate.canOpen };
}

/**
 * Start an assessment — "Attempt n of N" (ATT-01) — or Try again (ATT-05): only when the previous
 * result is released, not passed, and an attempt is left (B4-13; OD-B4-05; ATT-06).
 */
export function startAttempt(input: {
  readonly assessment: Assessment;
  readonly gate: OpenGate;
  readonly attempts: readonly Attempt[];
  readonly questions: readonly Question[];
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}): Decision<Attempt> {
  if (!can(null, 'in-progress', 'startAttempt')) return invalidState('none');
  if (assessmentReadiness(input.assessment) !== 'ready') return invalidState('draft-not-ready');
  if (!input.gate.canOpen) {
    return input.gate.reason === 'policy-open'
      ? policyOpen(input.gate.decision)
      : refused(input.gate.reason);
  }
  const own = [...input.attempts].sort((a, b) => a.attemptNumber - b.attemptNumber);
  if (own.some((attempt) => attempt.studentId !== input.actor.personId))
    return notPermitted('not-own-record');
  const allowed = input.assessment.rules.attemptsAllowed ?? 0;
  if (own.length >= allowed) return refused('no-attempts-left');
  const latest = own.at(-1);
  if (latest) {
    if (latest.state === 'in-progress') return invalidState('attempt-in-progress');
    const result = resultView({
      attempt: latest,
      assessment: input.assessment,
      questions: input.questions,
      now: input.now,
    });
    if (result.kind !== 'released') return refused('previous-not-released');
    if (result.passed) return refused('already-passed');
  }
  return ok({
    ...newMeta(input.now),
    id: input.ids.next('attempt'),
    assessmentId: input.assessment.id,
    assessmentVersion: input.assessment.version,
    studentId: input.actor.personId,
    attemptNumber: own.length + 1,
    state: 'in-progress',
    answers: {},
    startedAt: input.now,
    submittedAt: null,
    marking: { automatic: [], written: [], confirmed: null },
  });
}

/** Answer with autosave (ATT-02): an answer to a question of this attempt's version, of its type. */
export function saveAnswer(input: {
  readonly attempt: Attempt;
  readonly assessment: Assessment;
  readonly questions: readonly Question[];
  readonly questionId: QuestionId;
  readonly value: AnswerValue;
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
}): Decision<Attempt> {
  if (input.attempt.studentId !== input.actor.personId) return notPermitted('not-own-record');
  if (!can(input.attempt, 'in-progress', 'saveAnswer')) return invalidState(input.attempt.state);
  const snapshot = assessmentVersion(input.assessment, input.attempt.assessmentVersion);
  const question = snapshot
    ? pinnedQuestions(snapshot, input.questions).find(
        (entry) => entry.questionId === input.questionId,
      )
    : undefined;
  if (!question) return invalidInput({ field: 'questionId', rule: 'not-in-attempt' });
  const body = question.version.body;
  if (body.type !== input.value.type) return invalidInput({ field: 'value', rule: 'type' });
  if (
    body.type === 'multiple-choice' &&
    input.value.type === 'multiple-choice' &&
    !body.options[input.value.choice]
  ) {
    return invalidInput({ field: 'value', rule: 'not-an-option' });
  }
  return ok({
    ...input.attempt,
    ...nextMeta(input.attempt, input.now),
    answers: { ...input.attempt.answers, [input.questionId]: input.value },
  });
}

/** Submit answers (ATT-03; DL-1 "You can’t change your answers after submitting"; unanswered allowed). */
export function submitAttempt(input: {
  readonly attempt: Attempt;
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
}): Decision<Attempt> {
  if (input.attempt.studentId !== input.actor.personId) return notPermitted('not-own-record');
  if (!can(input.attempt, 'submitted', 'submitAttempt')) return invalidState(input.attempt.state);
  return ok({
    ...input.attempt,
    ...nextMeta(input.attempt, input.now),
    state: 'submitted',
    submittedAt: input.now,
  });
}

/**
 * Apply fixture-supplied objective marks (system stand-in only; DV-2 interim; ATT-07 UNRESOLVED).
 * The values are taken as given — no answer is compared with a key here.
 */
export function applyObjectiveMarks(input: {
  readonly attempt: Attempt;
  readonly assessment: Assessment;
  readonly questions: readonly Question[];
  readonly supplied: readonly { readonly questionId: QuestionId; readonly awarded: number }[];
  readonly actor: SystemActorRef;
  readonly now: IsoInstant;
}): Decision<Attempt> {
  if (input.actor.kind !== 'system' || input.actor.system !== 'system:objective-marks')
    return notPermitted('wrong-workspace');
  if (!can(input.attempt, 'submitted', 'applyObjectiveMarks'))
    return invalidState(input.attempt.state);
  if (input.attempt.marking.confirmed) return refused('marks-confirmed');
  const snapshot = assessmentVersion(input.assessment, input.attempt.assessmentVersion);
  const pinned = snapshot ? pinnedQuestions(snapshot, input.questions) : [];
  const automatic = [];
  for (const mark of input.supplied) {
    const question = pinned.find((entry) => entry.questionId === mark.questionId);
    if (!question || question.version.body.type === 'written')
      return invalidInput({ field: mark.questionId, rule: 'not-a-choice-question' });
    if (!isWholeNumber(mark.awarded) || mark.awarded > question.version.marks)
      return invalidInput({ field: mark.questionId, rule: 'out-of-range' });
    automatic.push({
      questionId: mark.questionId,
      awarded: mark.awarded,
      outOf: question.version.marks,
    });
  }
  return ok({
    ...input.attempt,
    ...nextMeta(input.attempt, input.now),
    marking: { ...input.attempt.marking, automatic },
  });
}

/**
 * Save a provisional mark for a written answer (ATT-08; optional feedback ATT-22): "Enter a whole
 * number from 0 to 10" — no half marks (ATT-21). "Mark saved — not confirmed yet". Not while the
 * attempt is in progress; not after confirmation (ATT-10).
 */
export function saveMark(input: {
  readonly attempt: Attempt;
  readonly assessment: Assessment;
  readonly questions: readonly Question[];
  readonly questionId: QuestionId;
  readonly mark: number | null;
  readonly feedback: string | null;
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
}): Decision<Attempt> {
  if (!can(input.attempt, 'submitted', 'saveMark')) return invalidState(input.attempt.state);
  if (input.attempt.marking.confirmed) return refused('marks-confirmed');
  const snapshot = assessmentVersion(input.assessment, input.attempt.assessmentVersion);
  const question = snapshot
    ? pinnedQuestions(snapshot, input.questions).find(
        (entry) => entry.questionId === input.questionId,
      )
    : undefined;
  if (!question || question.version.body.type !== 'written')
    return invalidInput({ field: 'questionId', rule: 'not-a-written-question' });
  if (input.mark === null) return invalidInput({ field: 'mark', rule: 'required' });
  if (!isWholeNumber(input.mark) || input.mark > question.version.marks) {
    return invalidInput({ field: 'mark', rule: 'whole-number-0-to-marks' });
  }
  const feedback =
    input.feedback === null || input.feedback.trim() === '' ? null : input.feedback.trim();
  const written = [
    ...input.attempt.marking.written.filter((existing) => existing.questionId !== input.questionId),
    {
      questionId: input.questionId,
      mark: input.mark,
      feedback,
      savedAt: input.now,
      savedBy: input.actor,
    },
  ];
  return ok({
    ...input.attempt,
    ...nextMeta(input.attempt, input.now),
    marking: { ...input.attempt.marking, written },
  });
}

/**
 * Confirm marks (ATT-09; DL-1 "Confirmed marks can’t be changed."): once per attempt, by the Faculty
 * member — never by a system actor. Every written answer needs its saved mark first: with one
 * written question the refusal is `save-first` on `mark` (as drawn, B4-09); with several, one
 * `save-first` issue names each written question still without a mark (`mark-<questionId>`, in
 * the version's order). Every choice question needs its automatic mark (ATT-07 stays open: without
 * one, `policy-open`). An attempt without a written question is confirmed on its automatic marks
 * alone.
 *
 * Owner decisions of 24 Oct 2026 (the assessment P0 fix, audit CB-2; recorded in
 * `docs/decisions/README.md`): an attempt with no written question — the Faculty member confirms
 * the automatic marks (Appendix C M22 [U] "no written questions", P4-05); several written questions
 * — confirm once per attempt after every written answer has a saved mark (ATT-17, P4-04). Neither
 * is `policy-open` any more. Unchanged: the score, the pass rule, rounding (open), attempts,
 * release, ATT-07, ATT-10.
 */
export function confirmMarks(input: {
  readonly attempt: Attempt;
  readonly assessment: Assessment;
  readonly questions: readonly Question[];
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
}): Decision<Attempt> {
  // The Faculty member confirms; no system actor and no other role has this authority.
  if (input.actor.kind !== 'person' || input.actor.role !== 'faculty')
    return notPermitted('wrong-workspace');
  if (!can(input.attempt, 'submitted', 'confirmMarks')) return invalidState(input.attempt.state);
  if (input.attempt.marking.confirmed) return refused('marks-confirmed');
  const snapshot = assessmentVersion(input.assessment, input.attempt.assessmentVersion);
  const written = (snapshot ? pinnedQuestions(snapshot, input.questions) : []).filter(
    (entry) => entry.version.body.type === 'written',
  );
  const unsaved = written.filter(
    (entry) =>
      !input.attempt.marking.written.some(
        (mark) => mark.questionId === entry.questionId && mark.mark !== null,
      ),
  );
  if (unsaved.length > 0) {
    return written.length === 1
      ? invalidInput({ field: 'mark', rule: 'save-first' })
      : invalidInput(
          ...unsaved.map((entry) => ({ field: `mark-${entry.questionId}`, rule: 'save-first' })),
        );
  }
  // Choice-question marks are supplied (seeded) only; without them no result can be confirmed —
  // automated marking is undecided (ATT-07; DV-2).
  if (!objectiveMarksComplete(input.attempt, snapshot, input.questions))
    return policyOpen('ATT-07');
  return ok({
    ...input.attempt,
    ...nextMeta(input.attempt, input.now),
    marking: { ...input.attempt.marking, confirmed: { at: input.now, by: input.actor } },
  });
}

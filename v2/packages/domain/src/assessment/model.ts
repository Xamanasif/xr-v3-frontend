/**
 * M20 Assessment (+ versions), M21 Question bank item / assisted draft / import batch, M22
 * Attempt, marking and result (Appendix C §2). Boards: B4-02 … B4-14.
 *
 * Every rule is set on the particular assessment — "Every value here is set for this assessment
 * only - nothing comes pre-filled." (B4-04; BC6; ASMT-04, ASMT-11). There are no defaults, no
 * timer (T-22; ASMT-09) and no delete / close / make-available control (T-18; ASMT-07, ASMT-08).
 * Objective marks come only from fixture-supplied values; this package has no scoring function
 * (DV-2 interim; ATT-07 UNRESOLVED; P4-01). Results release by the assessment's own setting — there
 * is no Faculty release control (B4-14 D4; ATT-13, ATT-14).
 */
import type { ActorRef } from '../roles.js';
import type { HistoryEntry } from '../kernel/history.js';
import type {
  AssessmentId,
  AttemptId,
  ExperimentId,
  ImportBatchId,
  InstitutionId,
  PersonId,
  QuestionDraftId,
  QuestionId,
} from '../kernel/ids.js';
import type { TransitionTable } from '../kernel/machine.js';
import type { RecordMeta } from '../kernel/record.js';
import type { IsoInstant } from '../kernel/time.js';

export type ReleaseOption = 'immediately-after-marking' | 'after-deadline' | 'on-date';

export interface AssessmentRules {
  /** Whole number 0–100. */
  readonly passMarkPercent: number | null;
  /** Whole number ≥ 1. */
  readonly attemptsAllowed: number | null;
  /** Advisory (T-18; OD-B4-02). */
  readonly deadline: IsoInstant | null;
  /** None pre-selected (T-19). */
  readonly release: {
    readonly option: ReleaseOption;
    readonly releaseDate: IsoInstant | null;
  } | null;
}

/** The empty rule set a new assessment starts from — nothing pre-filled (BC6). */
export const NO_RULES: AssessmentRules = Object.freeze({
  passMarkPercent: null,
  attemptsAllowed: null,
  deadline: null,
  release: null,
});

/** Ordered; pinned to a question version ("assessments keep their version until Use updated
 *  version", B4-07). */
export interface AssessmentQuestionRef {
  readonly questionId: QuestionId;
  readonly questionVersion: number;
}

export interface AssessmentVersionSnapshot {
  readonly version: number;
  readonly since: IsoInstant;
  readonly name: string;
  readonly introduction: string | null;
  readonly rules: AssessmentRules;
  readonly questions: readonly AssessmentQuestionRef[];
}

export type AssessmentEvent =
  | 'created'
  | 'saved-as-draft'
  | 'became-ready'
  | 'settings-saved'
  | 'questions-changed'
  | 'new-version';

export interface Assessment extends RecordMeta {
  /** ASMT-0009. */
  readonly id: AssessmentId;
  /** One per experiment per institution (OD-B4-01 PROVISIONAL). */
  readonly institutionId: InstitutionId;
  /** Per experiment, not per format. */
  readonly experimentId: ExperimentId;
  readonly name: string;
  readonly introduction: string | null;
  readonly rules: AssessmentRules;
  readonly questions: readonly AssessmentQuestionRef[];
  /** 'Version 2 since 8 Nov 2026'. */
  readonly version: number;
  readonly versionSince: IsoInstant;
  readonly versions: readonly AssessmentVersionSnapshot[];
  readonly createdAt: IsoInstant;
  readonly createdBy: ActorRef;
  /** 'ready since 27 Oct 2026, 11:05'. */
  readonly readySince: IsoInstant | null;
  readonly history: readonly HistoryEntry<AssessmentEvent>[];
}

export const ASSESSMENT_READINESS = ['draft-not-ready', 'ready'] as const;
/** Derived, never stored (OD-B4-03 assumption). */
export type AssessmentReadiness = (typeof ASSESSMENT_READINESS)[number];

export type QuestionType = 'multiple-choice' | 'true-false' | 'written';
export type ChoiceKey = 'A' | 'B' | 'C' | 'D';

export type QuestionBody =
  | {
      readonly type: 'multiple-choice';
      readonly options: Readonly<Partial<Record<ChoiceKey, string>>>;
      readonly correct: ChoiceKey;
    }
  | { readonly type: 'true-false'; readonly correct: boolean }
  /** Marking guidance: Faculty only; "Students don’t see it while they answer." (Q-08). */
  | { readonly type: 'written'; readonly markingGuidance: string | null };

export interface QuestionVersion {
  readonly version: number;
  readonly at: IsoInstant;
  readonly text: string;
  readonly body: QuestionBody;
  readonly marks: number;
  readonly explanation: string | null;
}

export interface Question extends RecordMeta {
  /** Q-0101. */
  readonly id: QuestionId;
  readonly institutionId: InstitutionId;
  /** 'Questions for Shell-and-Tube Heat Exchanger · ME ZG523'. */
  readonly experimentId: ExperimentId;
  readonly text: string;
  readonly body: QuestionBody;
  /** Whole number ≥ 1, on the question (OD-B4-07). */
  readonly marks: number;
  /** Shown with the correct answer after release (OD-B4-09). */
  readonly explanation: string | null;
  readonly version: number;
  readonly versions: readonly QuestionVersion[];
  readonly origin: 'written' | 'reviewed-draft' | 'import';
  readonly addedAt: IsoInstant;
  readonly addedBy: ActorRef;
  /** 'deleted 7 Nov 2026 · history kept'. */
  readonly deleted: { readonly at: IsoInstant; readonly by: ActorRef } | null;
}

/** Appendix C M21: a bank question is active ("Used in 1 assessment" / "Not used yet") or deleted
 *  ("deleted 7 Nov 2026 · history kept"); "reviewed draft" is an active question whose origin is
 *  `reviewed-draft`; a draft is the separate `QuestionDraft`, never in the bank. */
export const QUESTION_STATUSES = ['active', 'deleted'] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export interface QuestionDraftRequest {
  readonly source: 'lab-brief' | 'pasted-text';
  readonly pastedText: string | null;
  readonly types: readonly QuestionType[];
  readonly howMany: 3 | 5;
}

/** 'Draft — needs your review' · 'Drafted with assistance'. Never enters the bank on its own (Q-06).
 *  Owned by the Faculty member who asked for it — Q-05 "own drafts" [PROPOSED: Appendix C M21 names
 *  no owner field]. */
export interface QuestionDraft {
  readonly id: QuestionDraftId;
  readonly institutionId: InstitutionId;
  readonly requestedBy: PersonId;
  readonly experimentId: ExperimentId;
  readonly text: string;
  readonly body: QuestionBody;
  /** No suggested marks (OD-B4-12). */
  readonly marks: null;
  readonly explanation: string | null;
  readonly requestedAt: IsoInstant;
}

export const QUESTION_IMPORT_COLUMNS = [
  'type',
  'question',
  'option_a',
  'option_b',
  'option_c',
  'option_d',
  'correct',
  'marks',
  'explanation',
  'marking_guidance',
] as const;

export interface QuestionImportReport {
  readonly batchId: ImportBatchId;
  readonly fileName: string;
  readonly rowsChecked: number;
  readonly rows: readonly {
    readonly row: number;
    readonly question: string;
    readonly problem: string;
    readonly severity: 'error' | 'warning';
  }[];
  /** False while any error (all-or-nothing interim, T-24). */
  readonly canImport: boolean;
}

export type AnswerValue =
  | { readonly type: 'multiple-choice'; readonly choice: ChoiceKey }
  | { readonly type: 'true-false'; readonly value: boolean }
  | { readonly type: 'written'; readonly text: string };

export interface WrittenAnswerMark {
  readonly questionId: QuestionId;
  /** 0 … the question's marks, whole number. */
  readonly mark: number | null;
  readonly feedback: string | null;
  /** 'Mark saved — not confirmed yet'. */
  readonly savedAt: IsoInstant | null;
  readonly savedBy: ActorRef | null;
}

export interface AttemptMarking {
  /** Choice-question marks — supplied by fixtures only (DV-2). */
  readonly automatic: readonly {
    readonly questionId: QuestionId;
    readonly awarded: number;
    readonly outOf: number;
  }[];
  readonly written: readonly WrittenAnswerMark[];
  /** 'Marks confirmed 7 Nov 2026, 10:15 · Dr S. Ranganathan' — read-only afterwards. */
  readonly confirmed: { readonly at: IsoInstant; readonly by: ActorRef } | null;
}

export const ATTEMPT_STATES = ['in-progress', 'submitted'] as const;
export type AttemptState = (typeof ATTEMPT_STATES)[number];

export interface Attempt extends RecordMeta {
  /** ATT-0450. */
  readonly id: AttemptId;
  readonly assessmentId: AssessmentId;
  /** Earlier submissions keep their version. */
  readonly assessmentVersion: number;
  readonly studentId: PersonId;
  /** 'Attempt 1 of 2'. */
  readonly attemptNumber: number;
  readonly state: AttemptState;
  /** Unanswered allowed. */
  readonly answers: Readonly<Partial<Record<QuestionId, AnswerValue>>>;
  readonly startedAt: IsoInstant;
  /** 'Submitted 5 Nov 2026, 18:52'. */
  readonly submittedAt: IsoInstant | null;
  readonly marking: AttemptMarking;
}

export type AttemptCommand =
  | 'startAttempt'
  | 'saveAnswer'
  | 'submitAttempt'
  | 'applyObjectiveMarks'
  | 'saveMark'
  | 'confirmMarks';

/** Appendix C M22. Release is derived from the clock and the setting (system:release-setting), so it
 *  is not a stored transition. Re-marking and a Faculty release are not designed (T-20; ATT-14). */
export const ATTEMPT_TRANSITIONS: TransitionTable<AttemptState, AttemptCommand> = [
  { from: null, to: 'in-progress', command: 'startAttempt', actors: ['student'] },
  { from: 'in-progress', to: 'in-progress', command: 'saveAnswer', actors: ['student'] },
  { from: 'in-progress', to: 'submitted', command: 'submitAttempt', actors: ['student'] },
  {
    from: 'submitted',
    to: 'submitted',
    command: 'applyObjectiveMarks',
    actors: ['system:objective-marks'],
  },
  { from: 'submitted', to: 'submitted', command: 'saveMark', actors: ['faculty'] },
  { from: 'submitted', to: 'submitted', command: 'confirmMarks', actors: ['faculty'] },
];

export const ATTEMPT_RESULT_KINDS = [
  'in-progress',
  'waiting-for-marking',
  'not-released-yet',
  'released',
] as const;

/** What the Student sees — no figure of any kind until marks are confirmed and the release
 *  setting is met (ATT-15; B4-13). */
export type AttemptResult =
  | { readonly kind: 'in-progress' }
  | { readonly kind: 'waiting-for-marking' }
  | { readonly kind: 'not-released-yet'; readonly releaseRule: ReleaseOption }
  | {
      readonly kind: 'released';
      readonly releasedAt: IsoInstant;
      readonly score: number;
      readonly outOf: number;
      /** Pass mark × total; may be fractional — rounding is open (Appendix C M22 [U]). */
      readonly passMarkMarks: number;
      readonly passed: boolean;
      readonly attemptsLeft: number;
    };

/** The Student's assessment list word (B4-11 `W`). */
export type StudentAssessmentStatus = 'to-do' | Exclude<AttemptResult['kind'], never>;

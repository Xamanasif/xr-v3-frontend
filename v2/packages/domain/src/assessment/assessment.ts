/**
 * Assessment decisions (Appendix C M20; matrix ASMT-*; B4-04 … B4-06, B4-14). Faculty create and
 * configure assessments for experiments they teach (FCM ∩ ACC); nobody else does (ASMT-12).
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
  refused,
} from '../kernel/decision.js';
import { type HistoryEntry, historyEntry } from '../kernel/history.js';
import type { IdSource } from '../kernel/id-source.js';
import type { ExperimentId, InstitutionId } from '../kernel/ids.js';
import { newMeta, nextMeta } from '../kernel/record.js';
import type { IsoInstant } from '../kernel/time.js';
import type {
  Assessment,
  AssessmentEvent,
  AssessmentQuestionRef,
  AssessmentReadiness,
  AssessmentRules,
  AssessmentVersionSnapshot,
} from './model.js';

const FACULTY_ONLY = ['faculty'] as const;

/** B4-04 field rules for the values given (a draft may leave any rule empty). */
export function rulesIssues(rules: AssessmentRules): InputIssue[] {
  return [
    ...(rules.passMarkPercent !== null &&
    !(isWholeNumber(rules.passMarkPercent) && rules.passMarkPercent <= 100)
      ? [{ field: 'passMarkPercent', rule: 'whole-number-0-100' }]
      : []),
    ...(rules.attemptsAllowed !== null && !isWholeNumber(rules.attemptsAllowed, 1)
      ? [{ field: 'attemptsAllowed', rule: 'whole-number-1-or-more' }]
      : []),
    ...(rules.release?.option === 'on-date' && rules.release.releaseDate === null
      ? [{ field: 'releaseDate', rule: 'required' }]
      : []),
  ];
}

/** The rules a Ready assessment needs: every rule, and the release date when "On a date". */
function missingRules(rules: AssessmentRules): InputIssue[] {
  return [
    ...(rules.passMarkPercent === null ? [{ field: 'passMarkPercent', rule: 'required' }] : []),
    ...(rules.attemptsAllowed === null ? [{ field: 'attemptsAllowed', rule: 'required' }] : []),
    ...(rules.deadline === null ? [{ field: 'deadline', rule: 'required' }] : []),
    ...(rules.release === null ? [{ field: 'release', rule: 'required' }] : []),
  ];
}

/**
 * Ready = a name, every rule (and the release date when "On a date") and ≥ 1 question (B4-04
 * annotation; OD-B4-03 assumption). The introduction is optional (B4-04) — the B4-05 checklist
 * label "Name and introduction" is a wording inconsistency [U].
 */
export function assessmentReadiness(assessment: {
  readonly name: string;
  readonly rules: AssessmentRules;
  readonly questions: readonly AssessmentQuestionRef[];
}): AssessmentReadiness {
  return !isBlank(assessment.name) &&
    missingRules(assessment.rules).length === 0 &&
    rulesIssues(assessment.rules).length === 0 &&
    assessment.questions.length > 0
    ? 'ready'
    : 'draft-not-ready';
}

function snapshot(
  version: number,
  since: IsoInstant,
  content: {
    readonly name: string;
    readonly introduction: string | null;
    readonly rules: AssessmentRules;
    readonly questions: readonly AssessmentQuestionRef[];
  },
): AssessmentVersionSnapshot {
  return {
    version,
    since,
    name: content.name,
    introduction: content.introduction,
    rules: content.rules,
    questions: content.questions,
  };
}

function entry(
  input: { readonly ids: IdSource; readonly now: IsoInstant; readonly actor: PersonActorRef },
  event: AssessmentEvent,
): HistoryEntry<AssessmentEvent> {
  return historyEntry({
    id: input.ids.next('history'),
    event,
    at: input.now,
    actor: input.actor,
    visibleTo: FACULTY_ONLY,
  });
}

export interface CreateAssessmentInput {
  /** The institution's assessment for this experiment, if one exists. */
  readonly existing: Assessment | null;
  readonly institutionId: InstitutionId;
  readonly experimentId: ExperimentId;
  /** The Faculty member's experiments (FCM ∩ ACC). */
  readonly taughtExperiments: readonly ExperimentId[];
  /** "Create" needs every rule and a question; "Save as draft" only a name (ASMT-02). */
  readonly mode: 'create' | 'draft';
  readonly name: string;
  readonly introduction: string | null;
  readonly rules: AssessmentRules;
  readonly questions: readonly AssessmentQuestionRef[];
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

/**
 * Create an assessment (ASMT-01) or save it as a draft (ASMT-02). One per experiment per
 * institution: "This experiment already has an assessment" (ASMT-03; OD-B4-01). Nothing comes
 * pre-filled; every rule is this assessment's own (ASMT-04).
 */
export function createAssessment(input: CreateAssessmentInput): Decision<Assessment> {
  if (input.existing) return refused('assessment-exists');
  if (!input.taughtExperiments.includes(input.experimentId)) return notPermitted('out-of-scope');
  const issues = [
    ...(isBlank(input.name)
      ? [{ field: 'name', rule: input.mode === 'draft' ? 'required-for-draft' : 'required' }]
      : []),
    ...rulesIssues(input.rules),
    ...(input.mode === 'create'
      ? [
          ...missingRules(input.rules),
          ...(input.questions.length === 0
            ? [{ field: 'questions', rule: 'at-least-one-or-draft' }]
            : []),
        ]
      : []),
  ];
  if (issues.length > 0) return invalidInput(...issues);
  const content = {
    name: input.name.trim(),
    introduction: isBlank(input.introduction) ? null : input.introduction!.trim(),
    rules: input.rules,
    questions: input.questions,
  };
  const ready = assessmentReadiness(content) === 'ready';
  return ok({
    ...newMeta(input.now),
    id: input.ids.next('assessment'),
    institutionId: input.institutionId,
    experimentId: input.experimentId,
    ...content,
    version: 1,
    versionSince: input.now,
    versions: [snapshot(1, input.now, content)],
    createdAt: input.now,
    createdBy: input.actor,
    readySince: ready ? input.now : null,
    history: [
      entry(input, 'created'),
      ...(ready ? [entry(input, 'became-ready')] : [entry(input, 'saved-as-draft')]),
    ],
  });
}

export interface ChangeAssessmentInput {
  readonly assessment: Assessment;
  readonly name: string;
  readonly introduction: string | null;
  readonly rules: AssessmentRules;
  readonly questions: readonly AssessmentQuestionRef[];
  /** Attempts already submitted against the current version. */
  readonly hasSubmissions: boolean;
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

function sameRules(a: AssessmentRules, b: AssessmentRules): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function sameQuestions(
  a: readonly AssessmentQuestionRef[],
  b: readonly AssessmentQuestionRef[],
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Save settings / change questions / "Use updated version" (ASMT-05, ASMT-06). A Ready assessment
 * stays Ready (every rule and a question stay required). Changing rules or questions once
 * submissions exist makes a new version — "earlier submissions keep theirs" (B4-05, B4-06;
 * OD-B4-13).
 */
export function changeAssessment(input: ChangeAssessmentInput): Decision<Assessment> {
  const current = input.assessment;
  const wasReady = assessmentReadiness(current) === 'ready';
  const content = {
    name: input.name.trim(),
    introduction: isBlank(input.introduction) ? null : input.introduction!.trim(),
    rules: input.rules,
    questions: input.questions,
  };
  const issues = [
    ...(isBlank(input.name) ? [{ field: 'name', rule: 'required' }] : []),
    ...rulesIssues(input.rules),
    ...(wasReady
      ? [
          ...missingRules(input.rules),
          ...(input.questions.length === 0 ? [{ field: 'questions', rule: 'at-least-one' }] : []),
        ]
      : []),
  ];
  if (issues.length > 0) return invalidInput(...issues);
  const rulesChanged = !sameRules(current.rules, content.rules);
  const questionsChanged = !sameQuestions(current.questions, content.questions);
  const anyChange =
    rulesChanged ||
    questionsChanged ||
    content.name !== current.name ||
    content.introduction !== current.introduction;
  if (!anyChange) return invalidState('unchanged');
  const newVersion = input.hasSubmissions && (rulesChanged || questionsChanged);
  const version = newVersion ? current.version + 1 : current.version;
  const since = newVersion ? input.now : current.versionSince;
  const ready = assessmentReadiness(content) === 'ready';
  const events: AssessmentEvent[] = [
    ...(rulesChanged ||
    content.name !== current.name ||
    content.introduction !== current.introduction
      ? ['settings-saved' as const]
      : []),
    ...(questionsChanged ? ['questions-changed' as const] : []),
    ...(newVersion ? ['new-version' as const] : []),
    ...(!wasReady && ready ? ['became-ready' as const] : []),
  ];
  return ok({
    ...current,
    ...nextMeta(current, input.now),
    ...content,
    version,
    versionSince: since,
    versions: newVersion
      ? [...current.versions, snapshot(version, since, content)]
      : current.versions.map((existing) =>
          existing.version === version ? snapshot(version, since, content) : existing,
        ),
    readySince: current.readySince ?? (ready ? input.now : null),
    history: [...current.history, ...events.map((event) => entry(input, event))],
  });
}

/** The snapshot an attempt answers (earlier submissions keep their version). */
export function assessmentVersion(
  assessment: Assessment,
  version: number,
): AssessmentVersionSnapshot | null {
  return assessment.versions.find((snapshotOf) => snapshotOf.version === version) ?? null;
}

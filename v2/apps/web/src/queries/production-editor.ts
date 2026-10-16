/**
 * The experiment editor's checks (Phase 5; VE-03 … VE-06, VE-08, VE-09; boards B5-03 … B5-05,
 * B5-07), on the contract's own schemas and message catalogue — features import contracts for types
 * only (Appendix F §3.8), so the runtime pieces they need live here: a step checked with the same
 * `editorStepIssues` rules and message keys `continueStep` answers with (after the same
 * `submissionContentInput` transform: blank values are nothing), the name a draft save needs
 * (`saveDraftInput`), and every step at once for Check and submit (the board's `all()`). Each answers
 * the `validation-failed` the service would answer, so one mapping words both. Nothing is sent and
 * nothing is decided here: the name's uniqueness and a course that is no longer assigned need the
 * records, and the service answers them (`VE-03.name.taken`, `VE-03.courseId.course-not-assigned`).
 */
import {
  editorStepIssues,
  fieldError,
  type In,
  parseInput,
  saveDraftInput,
  submissionContentInput,
  type ValidationFailed,
  validationFailed,
} from '@xr/contracts/draft';

/** The editor's content as typed (`submissionContentInput`'s input). */
export type EditorContentInput = In<typeof submissionContentInput>;

type CheckedStep = 'course' | 'formats' | 'preview';

const FORM: Readonly<Record<CheckedStep, 'VE-03' | 'VE-04' | 'VE-05'>> = {
  course: 'VE-03',
  formats: 'VE-04',
  preview: 'VE-05',
};

/** The steps' issues as the service reports them (paths under `content`). */
function issuesOf(steps: readonly CheckedStep[], content: EditorContentInput) {
  const parsed = submissionContentInput.safeParse(content);
  if (!parsed.success) return null;
  return steps.flatMap((step) =>
    editorStepIssues(step, parsed.data).map((issue) =>
      fieldError(['content', ...issue.path].join('.'), issue.key, issue.params ?? {}),
    ),
  );
}

/**
 * One step checked as "Continue" will check it (B5-03 `e1`, `e2`, `e3`): `null` when it passes,
 * else the step's `validation-failed`. A value of the wrong shape is the contract's own answer.
 */
export function checkEditorStep(
  step: CheckedStep,
  content: EditorContentInput,
): ValidationFailed | null {
  const issues = issuesOf([step], content);
  if (issues === null) {
    const parsed = parseInput(submissionContentInput, content, FORM[step]);
    return parsed.ok ? null : parsed.error;
  }
  return issues.length === 0 ? null : validationFailed(issues, FORM[step]);
}

/**
 * Every step at once (VE-06 "N things to finish before you can submit", the board's `all()`):
 * `null` when nothing the contract can tell is missing.
 */
export function checkWholeExperiment(content: EditorContentInput): ValidationFailed | null {
  const issues = issuesOf(['course', 'formats', 'preview'], content) ?? [];
  return issues.length === 0 ? null : validationFailed(issues, 'VE-03');
}

/** Save draft / Save changes needs only a name ("Enter a name to save a draft", `saveDraftInput`). */
export function checkDraftSave(content: EditorContentInput): ValidationFailed | null {
  const parsed = parseInput(
    saveDraftInput,
    { id: null, content, step: 'course', expectedRev: null },
    'VE-03',
  );
  return parsed.ok ? null : parsed.error;
}

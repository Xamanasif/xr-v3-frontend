'use client';

import type { CreateOption, QuestionBankRow } from '@xr/contracts/draft';
import type { Assessment, AssessmentReadiness } from '@xr/domain';
import {
  Button,
  FailedState,
  FieldError,
  Icon,
  Link,
  LoadingState,
  Notice,
  Skeleton,
} from '@xr/ui';
import type { ReactNode } from 'react';

import {
  deadlineWords,
  marksWords,
  QUESTION_TYPE_WORDS,
  questionsAndMarks,
  READINESS_WORDS,
  releaseValueWords,
  rulesChecklistLine,
  rulesSummaryLine,
} from '@/copy/assessment-words';
import {
  ADD_QUESTIONS,
  bankRowSub,
  CHOOSE_EXPERIMENT,
  CREATE_ASSESSMENT,
  CREATE_RESULT,
  experimentCourseLine,
  PREVIEW_STEP,
  previewQuestionHead,
  readyLine,
  resultNoticeTitle,
  THIS_ASSESSMENT,
} from '@/copy/assessments';
import { stateWords } from '@/copy/state-copy';
import {
  assessmentAddress,
  ASSESSMENTS_ADDRESS,
  createAssessmentAddress,
  newQuestionAddress,
} from '@/nav/faculty';
import { useTeachingExperiment } from '@/queries/teaching';

import { type FormFieldError, RulesFields, type RulesField } from '../shared/rules-fields';
import { FIELD_IDS, ID_PREFIX, typedRules } from './create-assessment-view';
import type { CreateDraft } from './create-draft';

/** The step's footer (`div.xw-flow-foot`): the way back first, the step's actions last. */
function FlowFoot({
  start,
  children,
}: {
  readonly start: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className="xw-flow-foot">
      {start}
      <div className="xw-actions">{children}</div>
    </div>
  );
}

/** What every step's "Save as draft" needs (steps 2–4; B4-04 `canDraft`). */
export interface DraftAction {
  readonly onDraft: () => void;
  readonly busy: boolean;
}

function SaveAsDraft({ action }: { readonly action: DraftAction }) {
  return (
    <Button
      variant="secondary"
      onClick={action.onDraft}
      busy={action.busy}
      busyLabel={stateWords('FA-07.saving')}
    >
      {CREATE_ASSESSMENT.saveAsDraft}
    </Button>
  );
}

// ---- Step 1 · Choose the experiment (B4-04 f1, f8) ----------------------------------------------

/** One experiment the Faculty member teaches, as a radio card (`label.xr-choice`, two sub lines). */
function ExperimentChoice({
  option,
  checked,
  existingName,
  onPick,
}: {
  readonly option: CreateOption;
  readonly checked: boolean;
  readonly existingName: string | null;
  readonly onPick: (experimentId: string) => void;
}) {
  // "ME ZG523 · Thermodynamics & Heat Transfer": the course is the teaching view's own read.
  const teaching = useTeachingExperiment(option.experimentId);
  const courseName = teaching.data?.ok ? teaching.data.value.experiment.courseName : null;
  const line = experimentCourseLine(option.courseCode, courseName);
  const id = `${ID_PREFIX}-e-${option.experimentId}`;
  return (
    <label className="xr-choice" htmlFor={id}>
      <input
        type="radio"
        id={id}
        name={`${ID_PREFIX}-exp`}
        checked={checked}
        onChange={() => onPick(option.experimentId)}
      />
      <span>
        <span className="xr-choice-title">{option.name}</span>
        {line ? <span className="xr-choice-sub">{line}</span> : null}
        <span className="xr-choice-sub">
          {option.existingAssessmentId === null
            ? CHOOSE_EXPERIMENT.noAssessment
            : `${CHOOSE_EXPERIMENT.hasAssessment}${existingName ?? option.existingAssessmentId}`}
        </span>
      </span>
    </label>
  );
}

export function ExperimentStep({
  options,
  chosen,
  existingNames,
  error,
  onPick,
  onCancel,
  onContinue,
}: {
  readonly options: readonly CreateOption[];
  readonly chosen: CreateOption | null;
  /** The names of the assessments the experiments already have, by id. */
  readonly existingNames: ReadonlyMap<string, string>;
  readonly error: string | undefined;
  readonly onPick: (experimentId: string) => void;
  readonly onCancel: () => void;
  readonly onContinue: () => void;
}) {
  const errorId = `${FIELD_IDS.experiment}-e`;
  const existingId = chosen?.existingAssessmentId ?? null;
  return (
    <div className="xr-section flex flex-col gap-[18px] p-6">
      <fieldset
        className="xr-fieldset m-0 min-w-0 border-0 p-0"
        id={FIELD_IDS.experiment}
        tabIndex={-1}
        aria-describedby={error ? errorId : undefined}
      >
        <legend className="xr-legend mb-2 text-[16px] font-[700] text-ink">
          {CHOOSE_EXPERIMENT.legend}
        </legend>
        {error ? <FieldError id={errorId}>{error}</FieldError> : null}
        {options.length > 0 ? (
          <div className="xr-choice-list">
            {options.map((option) => (
              <ExperimentChoice
                key={option.experimentId}
                option={option}
                checked={chosen?.experimentId === option.experimentId}
                existingName={
                  option.existingAssessmentId === null
                    ? null
                    : (existingNames.get(option.existingAssessmentId) ?? null)
                }
                onPick={onPick}
              />
            ))}
          </div>
        ) : (
          <p className="xr-body m-0 text-ink-2">{stateWords('FA-07.no-experiments')}</p>
        )}
      </fieldset>
      {existingId !== null ? (
        // f8: one assessment per experiment is the open decision's interim (OD-B4-01).
        <Notice tone="warn" title={CHOOSE_EXPERIMENT.exists}>
          {CHOOSE_EXPERIMENT.existsBefore}
          <Link href={assessmentAddress(existingId)}>
            {existingNames.get(existingId) ?? existingId}
          </Link>
          {CHOOSE_EXPERIMENT.existsAfter}
        </Notice>
      ) : null}
      <p className="xw-note m-0">
        <Icon name="readOnly" />
        <span>{CHOOSE_EXPERIMENT.note}</span>
      </p>
      <FlowFoot
        start={
          <Link className="xr-btn xr-btn--text" href={ASSESSMENTS_ADDRESS} onClick={onCancel}>
            {CREATE_ASSESSMENT.cancel}
          </Link>
        }
      >
        <Button variant="primary" onClick={onContinue}>
          {CREATE_ASSESSMENT.continue}
        </Button>
      </FlowFoot>
    </div>
  );
}

// ---- Step 2 · Set the rules (B4-04 f2, f3, f11) -------------------------------------------------

export function RulesStep({
  draft,
  errors,
  onChange,
  onBack,
  onContinue,
  draftAction,
}: {
  readonly draft: CreateDraft;
  readonly errors: readonly FormFieldError<RulesField>[];
  readonly onChange: (field: RulesField, value: string) => void;
  readonly onBack: () => void;
  readonly onContinue: () => void;
  readonly draftAction: DraftAction;
}) {
  return (
    <div className="xr-section flex flex-col gap-5 p-6">
      <RulesFields
        idPrefix={ID_PREFIX}
        draft={draft.rules}
        onChange={onChange}
        errors={errors}
        variant="create"
      />
      <FlowFoot
        start={
          <Button variant="text" onClick={onBack}>
            {CREATE_ASSESSMENT.goBack}
          </Button>
        }
      >
        <SaveAsDraft action={draftAction} />
        <Button variant="primary" onClick={onContinue}>
          {CREATE_ASSESSMENT.continue}
        </Button>
      </FlowFoot>
    </div>
  );
}

// ---- Step 3 · Add questions (B4-04 f4) ----------------------------------------------------------

/** The bank as step 3 reads it: loading, failed, or its rows. */
export type BankState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'failed'; readonly retry: () => void }
  | { readonly kind: 'rows'; readonly rows: readonly QuestionBankRow[] };

export function QuestionsStep({
  experimentId,
  experimentName,
  bank,
  questionIds,
  totalText,
  error,
  onToggle,
  onBack,
  onContinue,
  draftAction,
}: {
  readonly experimentId: string;
  readonly experimentName: string;
  readonly bank: BankState;
  readonly questionIds: readonly string[];
  /** "4 questions · 16 marks" or "No questions yet". */
  readonly totalText: string;
  readonly error: string | undefined;
  readonly onToggle: (questionId: string) => void;
  readonly onBack: () => void;
  readonly onContinue: () => void;
  readonly draftAction: DraftAction;
}) {
  // FA-15 sends the person back here with `added=<questionId>` (state-copy `FA-07.question-added`).
  const newQuestion = newQuestionAddress({
    experimentId,
    returnTo: createAssessmentAddress({ step: 'questions', experimentId }),
  });
  return (
    <div className="xr-section flex flex-col gap-4 p-6" id={FIELD_IDS.questions} tabIndex={-1}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="xr-h3 m-0">
          {ADD_QUESTIONS.fromBank}
          {experimentName}
        </h2>
        <span className="xr-meta" role="status">
          {totalText}
        </span>
      </div>
      {error ? <FieldError id={`${FIELD_IDS.questions}-e`}>{error}</FieldError> : null}
      {bank.kind === 'loading' ? (
        <LoadingState
          label={stateWords('FA-07.bank-loading')}
          surface={null}
          className="flex flex-col gap-3"
          skeleton={
            <>
              <Skeleton />
              <Skeleton className="w-[70%]" />
              <Skeleton className="w-[55%]" />
            </>
          }
        />
      ) : bank.kind === 'failed' ? (
        <FailedState title={stateWords('FA-07.bank-failed')} onRetry={bank.retry}>
          {stateWords('FA-06.failed.line')}
        </FailedState>
      ) : bank.rows.length === 0 ? (
        <p className="xr-body m-0 text-ink-2">{stateWords('FA-07.bank-empty')}</p>
      ) : (
        <ul className="xw-pick" aria-label={ADD_QUESTIONS.listLabel}>
          {bank.rows.map(({ question }) => {
            const id = `${ID_PREFIX}-b-${question.id}`;
            return (
              <li key={question.id}>
                <div className="xw-pick-row">
                  <label htmlFor={id}>
                    <input
                      type="checkbox"
                      id={id}
                      checked={questionIds.includes(question.id)}
                      onChange={() => onToggle(question.id)}
                    />
                    <span className="xw-pick-name">
                      <span className="font-[600]">{question.text}</span>
                      <span className="xr-meta">
                        {bankRowSub(
                          question.id,
                          QUESTION_TYPE_WORDS[question.body.type],
                          marksWords(question.marks),
                        )}
                      </span>
                    </span>
                  </label>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {/* "Draft with assistance" (FA-16) and "Import" (FA-17) are not built: not rendered (DEV-21). */}
      <div className="xw-actions">
        <Link className="xr-btn xr-btn--text" href={newQuestion}>
          <Icon name="add" />
          {ADD_QUESTIONS.newQuestion}
        </Link>
      </div>
      <FlowFoot
        start={
          <Button variant="text" onClick={onBack}>
            {CREATE_ASSESSMENT.goBack}
          </Button>
        }
      >
        <SaveAsDraft action={draftAction} />
        <Button variant="primary" onClick={onContinue}>
          {CREATE_ASSESSMENT.continue}
        </Button>
      </FlowFoot>
    </div>
  );
}

// ---- Step 4 · Preview and create (B4-04 f5) -----------------------------------------------------

export function PreviewStep({
  draft,
  picked,
  creating,
  onBack,
  onCreate,
  draftAction,
}: {
  readonly draft: CreateDraft;
  readonly picked: readonly QuestionBankRow[];
  readonly creating: boolean;
  readonly onBack: () => void;
  readonly onCreate: () => void;
  readonly draftAction: DraftAction;
}) {
  const rules = typedRules(draft.rules);
  const marks = picked.reduce((sum, row) => sum + row.question.marks, 0);
  return (
    <div className="xr-section flex flex-col gap-[18px] p-6">
      <p className="xr-body m-0 text-ink-2">{PREVIEW_STEP.lead}</p>
      <dl className="xl-kv">
        <dt>{PREVIEW_STEP.name}</dt>
        <dd>{draft.rules.name.trim()}</dd>
        <dt>{PREVIEW_STEP.questions}</dt>
        <dd>{questionsAndMarks(picked.length, marks)}</dd>
        <dt>{PREVIEW_STEP.passMark}</dt>
        <dd>{rules.passMarkPercent === null ? '' : `${rules.passMarkPercent}%`}</dd>
        <dt>{PREVIEW_STEP.attempts}</dt>
        <dd>{rules.attemptsAllowed ?? ''}</dd>
        <dt>{PREVIEW_STEP.deadline}</dt>
        <dd>{rules.deadline === null ? '' : deadlineWords(rules.deadline)}</dd>
        <dt>{PREVIEW_STEP.release}</dt>
        <dd>{releaseValueWords(rules.release) ?? ''}</dd>
      </dl>
      <ol className="xa-qs">
        {picked.map(({ question }, index) => (
          <li key={question.id} className="xa-q gap-[6px] [padding:16px_20px]">
            <span className="xa-q-n">
              {previewQuestionHead(
                index + 1,
                QUESTION_TYPE_WORDS[question.body.type],
                marksWords(question.marks),
              )}
            </span>
            <p className="xr-body m-0 font-[600]">{question.text}</p>
          </li>
        ))}
      </ol>
      <FlowFoot
        start={
          <Button variant="text" onClick={onBack}>
            {CREATE_ASSESSMENT.goBack}
          </Button>
        }
      >
        <SaveAsDraft action={draftAction} />
        <Button
          variant="primary"
          onClick={onCreate}
          busy={creating}
          busyLabel={CREATE_ASSESSMENT.creating}
        >
          {CREATE_ASSESSMENT.create}
        </Button>
      </FlowFoot>
    </div>
  );
}

// ---- The result (B4-04 f6, f7) ------------------------------------------------------------------

export function ResultSection({
  assessment,
  readiness,
  experimentName,
  onAnother,
}: {
  readonly assessment: Assessment;
  readonly readiness: AssessmentReadiness;
  readonly experimentName: string;
  readonly onAnother: () => void;
}) {
  const ready = readiness === 'ready';
  const checklist = [
    {
      key: 'rules',
      text: CREATE_RESULT.nameAndRules,
      ok: assessment.name.trim() !== '' && rulesChecklistLine(assessment.rules) !== null,
    },
    {
      key: 'questions',
      text: CREATE_RESULT.atLeastOneQuestion,
      ok: assessment.questions.length > 0,
    },
  ];
  return (
    <div className="xr-section flex flex-col gap-4 p-6">
      <Notice
        tone={ready ? 'ok' : 'warn'}
        title={resultNoticeTitle(assessment.id, READINESS_WORDS[readiness].label)}
      >
        {ready ? readyLine(experimentName) : CREATE_RESULT.draftLine}
      </Notice>
      <ul className="xa-check" aria-label={CREATE_RESULT.checklist}>
        {checklist.map((item) => (
          <li key={item.key}>
            <span className={item.ok ? 'is-ok' : 'is-no'}>
              <Icon name={item.ok ? 'done' : 'clock'} />
            </span>
            {item.text}
          </li>
        ))}
      </ul>
      <div className="xw-actions">
        <Link className="xr-btn xr-btn--primary" href={assessmentAddress(assessment.id)}>
          {CREATE_RESULT.open}
        </Link>
        <Button variant="secondary" onClick={onAnother}>
          {CREATE_RESULT.another}
        </Button>
      </div>
    </div>
  );
}

// ---- This assessment (B4-04 f1 … f5; collapsible below 860 px of content, f8, f11) -------------

export interface SummaryValues {
  readonly experiment: string | null;
  readonly draft: CreateDraft;
  readonly picked: readonly QuestionBankRow[];
}

/** "4 questions · 16 marks", or "No questions yet" (B4-04 `totalText`). */
export function totalWords(picked: readonly QuestionBankRow[]): string {
  if (picked.length === 0) return THIS_ASSESSMENT.noQuestions;
  return questionsAndMarks(
    picked.length,
    picked.reduce((sum, row) => sum + row.question.marks, 0),
  );
}

export function ThisAssessment({
  values,
  variant,
}: {
  readonly values: SummaryValues;
  readonly variant: 'aside' | 'bar';
}) {
  const list = (
    <dl>
      <dt>{THIS_ASSESSMENT.experiment}</dt>
      <dd>{values.experiment ?? THIS_ASSESSMENT.notChosen}</dd>
      <dt>{THIS_ASSESSMENT.name}</dt>
      <dd>{values.draft.rules.name.trim() || THIS_ASSESSMENT.notNamed}</dd>
      <dt>{THIS_ASSESSMENT.rules}</dt>
      <dd>{rulesSummaryLine(typedRules(values.draft.rules)) ?? THIS_ASSESSMENT.notSet}</dd>
      <dt>{THIS_ASSESSMENT.questions}</dt>
      <dd>{totalWords(values.picked)}</dd>
    </dl>
  );
  if (variant === 'bar') {
    return (
      <details className="xw-sumbar">
        <summary>
          {THIS_ASSESSMENT.title}
          <Icon name="chevronDown" />
        </summary>
        {list}
      </details>
    );
  }
  const headingId = `${ID_PREFIX}-sum`;
  return (
    <aside className="xw-sum" aria-labelledby={headingId}>
      <h2 id={headingId} className="xw-sum-title">
        {THIS_ASSESSMENT.title}
      </h2>
      {list}
    </aside>
  );
}

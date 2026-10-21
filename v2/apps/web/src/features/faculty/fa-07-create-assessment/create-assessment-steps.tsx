'use client';

import type { CreateOption, QuestionBankRow } from '@xr/contracts/draft';
import type { Assessment, AssessmentReadiness } from '@xr/domain';
import { FailedState, LoadingState } from '@xr/ui';
import {
  Button,
  ButtonLink,
  FaChecklist,
  FaCreateExperiments,
  FaCreatePicker,
  FaCreateResultStatus,
  FaCreateSideNote,
  FaCreateSideTitle,
  FaCreateSummary,
  FaFormatBadges,
  FaFormFoot,
  FaFormSection,
  FaKey,
  FaActions,
  FaPickCount,
  FaQuestionHead,
  FaQuiet,
  FaRecordIntro,
  FaRecordLine,
  FaRecordQuestions,
  FaRecordRules,
  FaResult,
  FaResultText,
  FaSide,
  FaSideSection,
  FieldError,
  Hint,
  Notice,
  StatusPill,
  V46Island,
} from '@xr/ui/v3';
import type { FormatCode } from '@xr/ui';
import type { ReactNode, Ref } from 'react';

import {
  deadlineWords,
  marksWords,
  QUESTION_TYPE_WORDS,
  questionsAndMarks,
  READINESS_WORDS,
} from '@/copy/assessment-words';
import {
  ADD_QUESTIONS,
  CHOOSE_EXPERIMENT,
  CREATE_ASSESSMENT,
  CREATE_RESULT,
  createSeesWords,
  existsLine,
  experimentCourseLine,
  formatsHeldLabel,
  openAssessmentWords,
  passMarkWithMarks,
  PREVIEW_STEP,
  readyLine,
  studentsWithAccessWords,
  THIS_ASSESSMENT,
  typedReleaseWords,
  typedRulesLine,
} from '@/copy/assessments';
import { assessmentName } from '@/copy/fa-shared';
import { BANK_TOOLS } from '@/copy/question-tools';
import { stateWords } from '@/copy/state-copy';
import {
  assessmentAddress,
  ASSESSMENTS_ADDRESS,
  createAssessmentAddress,
  draftQuestionsAddress,
  importQuestionsAddress,
  newQuestionAddress,
} from '@/nav/faculty';
import { useTeachingExperiment } from '@/queries/teaching';

import { type FormFieldError, RulesFields, type RulesField } from '../shared/rules-fields';
import { FIELD_IDS, ID_PREFIX, typedRules } from './create-assessment-view';
import type { CreateDraft } from './create-draft';

/** What every step's "Save as draft" needs (steps 2–4). */
export interface DraftAction {
  readonly onDraft: () => void;
  readonly busy: boolean;
}

function SaveAsDraft({ action }: { readonly action: DraftAction }) {
  return (
    <Button onClick={action.onDraft} busy={action.busy} busyLabel={stateWords('FA-07.saving')}>
      {CREATE_ASSESSMENT.saveAsDraft}
    </Button>
  );
}

/** "Back" and the step's actions (`div.fa-formfoot`). */
function StepFoot({
  onBack,
  draftAction,
  children,
}: {
  readonly onBack: () => void;
  readonly draftAction: DraftAction;
  readonly children: ReactNode;
}) {
  return (
    <FaFormFoot
      start={<Button onClick={onBack}>{CREATE_ASSESSMENT.goBack}</Button>}
      end={
        <>
          <SaveAsDraft action={draftAction} />
          {children}
        </>
      }
    />
  );
}

// ---- Step 1 · Choose the experiment ----------------------------------------------------------

/** "ME ZG523 · Thermodynamics & Heat Transfer · No assessment yet" — the course from the teaching read. */
function ExperimentLine({
  option,
  existingName,
}: {
  readonly option: CreateOption;
  readonly existingName: string | null;
}) {
  const teaching = useTeachingExperiment(option.experimentId);
  const courseName = teaching.data?.ok ? teaching.data.value.experiment.courseName : null;
  const course = experimentCourseLine(option.courseCode, courseName);
  const assessment =
    option.existingAssessmentId === null
      ? CHOOSE_EXPERIMENT.noAssessment
      : `${CHOOSE_EXPERIMENT.hasAssessment}${assessmentName(existingName)}`;
  return <>{course ? `${course} · ${assessment}` : assessment}</>;
}

/** The formats the institution holds and the students who have the experiment (the teaching read). */
function ExperimentMeta({ option }: { readonly option: CreateOption }) {
  const teaching = useTeachingExperiment(option.experimentId);
  if (!teaching.data?.ok) return null;
  const view = teaching.data.value;
  const formats = view.formatsInstitutionHas.map((format) => format.toUpperCase() as FormatCode);
  // Each student with access has exactly one status in every format the institution has.
  const first = view.perFormatCounts[0];
  const reach = first ? first.completed + first.inProgress + first.notStarted : 0;
  return (
    <>
      {formats.length > 0 ? (
        <FaFormatBadges formats={formats} label={formatsHeldLabel(formats)} />
      ) : null}
      <span>{studentsWithAccessWords(reach)}</span>
    </>
  );
}

export function ExperimentStep({
  options,
  chosen,
  existingNames,
  error,
  onPick,
}: {
  readonly options: readonly CreateOption[];
  readonly chosen: CreateOption | null;
  /** The names of the assessments the experiments already have, by id. */
  readonly existingNames: ReadonlyMap<string, string>;
  readonly error: string | undefined;
  readonly onPick: (experimentId: string) => void;
}) {
  const existingId = chosen?.existingAssessmentId ?? null;
  const existing = existingId === null ? null : assessmentName(existingNames.get(existingId));
  return (
    <FaFormSection>
      <FaCreateExperiments
        id={FIELD_IDS.experiment}
        name={`${ID_PREFIX}-exp`}
        legend={CHOOSE_EXPERIMENT.legend}
        legendHint={CHOOSE_EXPERIMENT.note}
        options={options.map((option) => ({
          value: option.experimentId,
          title: option.name,
          line: (
            <ExperimentLine
              option={option}
              existingName={
                option.existingAssessmentId === null
                  ? null
                  : (existingNames.get(option.existingAssessmentId) ?? null)
              }
            />
          ),
          meta: <ExperimentMeta option={option} />,
        }))}
        value={chosen?.experimentId ?? null}
        onChange={onPick}
        error={error}
      />
      {options.length === 0 ? <FaQuiet>{stateWords('FA-07.no-experiments')}</FaQuiet> : null}
      {existingId !== null && existing !== null ? (
        // One assessment per experiment is the open decision's interim (OD-B4-01).
        <Notice
          tone="info"
          icon="infoDisc"
          role="status"
          title={CHOOSE_EXPERIMENT.exists}
          actions={
            <ButtonLink href={assessmentAddress(existingId)}>
              {openAssessmentWords(existing)}
            </ButtonLink>
          }
        >
          {existsLine(existing)}
        </Notice>
      ) : null}
    </FaFormSection>
  );
}

export function ExperimentFoot({
  onCancel,
  onContinue,
}: {
  readonly onCancel: () => void;
  readonly onContinue: () => void;
}) {
  return (
    <FaFormFoot
      start={
        <ButtonLink href={ASSESSMENTS_ADDRESS} onClick={onCancel}>
          {CREATE_ASSESSMENT.cancel}
        </ButtonLink>
      }
      end={
        <Button variant="primary" size="lg" onClick={onContinue}>
          {CREATE_ASSESSMENT.continue}
        </Button>
      }
    />
  );
}

// ---- Step 2 · Set the rules ------------------------------------------------------------------

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
    <>
      <RulesFields
        idPrefix={ID_PREFIX}
        draft={draft.rules}
        onChange={onChange}
        errors={errors}
        variant="create"
      />
      <StepFoot onBack={onBack} draftAction={draftAction}>
        <Button variant="primary" size="lg" onClick={onContinue}>
          {CREATE_ASSESSMENT.continue}
        </Button>
      </StepFoot>
    </>
  );
}

// ---- Step 3 · Add questions --------------------------------------------------------------------

/** The bank as step 3 reads it: loading, failed, or its rows. */
export type BankState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'failed'; readonly retry: () => void }
  | { readonly kind: 'rows'; readonly rows: readonly QuestionBankRow[] };

export function QuestionsStep({
  experimentId,
  experimentLine,
  bank,
  questionIds,
  totalText,
  error,
  added,
  onToggle,
  onBack,
  onContinue,
  draftAction,
}: {
  readonly experimentId: string;
  /** "Shell-and-Tube Heat Exchanger · ME ZG523". */
  readonly experimentLine: string;
  readonly bank: BankState;
  readonly questionIds: readonly string[];
  /** "4 questions · 16 marks" or "No questions chosen yet". */
  readonly totalText: string;
  readonly error: string | undefined;
  /** A question just written in FA-15 came back ticked: the notice says so. */
  readonly added: boolean;
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
  const errorId = `${FIELD_IDS.questions}-e`;
  return (
    <>
      <FaFormSection>
        <FaQuestionHead title={ADD_QUESTIONS.title} aside={<FaPickCount>{totalText}</FaPickCount>}>
          <Hint>{experimentLine}</Hint>
        </FaQuestionHead>
        {added ? (
          <Notice tone="ok" role="status" title={ADD_QUESTIONS.savedTitle}>
            {ADD_QUESTIONS.savedLine}
          </Notice>
        ) : null}
        {bank.kind === 'loading' ? (
          <V46Island>
            <LoadingState
              label={stateWords('FA-07.bank-loading')}
              surface={null}
              className="flex flex-col gap-3"
              lines={3}
            />
          </V46Island>
        ) : bank.kind === 'failed' ? (
          <V46Island>
            <FailedState title={stateWords('FA-07.bank-failed')} onRetry={bank.retry}>
              {stateWords('FA-06.failed.line')}
            </FailedState>
          </V46Island>
        ) : bank.rows.length === 0 ? (
          <div id={FIELD_IDS.questions} tabIndex={-1}>
            <FaQuiet>{ADD_QUESTIONS.noBank}</FaQuiet>
            {error ? <FieldError id={errorId}>{error}</FieldError> : null}
          </div>
        ) : (
          <FaCreatePicker
            id={FIELD_IDS.questions}
            legend={ADD_QUESTIONS.listLabel}
            options={bank.rows.map(({ question }) => ({
              value: question.id,
              title: question.text,
              line: `${QUESTION_TYPE_WORDS[question.body.type]} · ${marksWords(question.marks)}`,
            }))}
            chosen={questionIds}
            onToggle={onToggle}
            error={error}
          />
        )}
      </FaFormSection>
      {/* New question (FA-15), Draft with assistance (FA-16) and Import (FA-17) for this
          experiment; neither tool adds to the assessment on its own. */}
      <FaFormSection tone="tint">
        <FaKey>{ADD_QUESTIONS.otherWays}</FaKey>
        <FaActions>
          <ButtonLink href={newQuestion} icon="add" iconSize={20}>
            {ADD_QUESTIONS.newQuestion}
          </ButtonLink>
          <ButtonLink href={draftQuestionsAddress(experimentId)}>
            {BANK_TOOLS.draftWithAssistance}
          </ButtonLink>
          <ButtonLink href={importQuestionsAddress(experimentId)} icon="upload" iconSize={20}>
            {BANK_TOOLS.import}
          </ButtonLink>
        </FaActions>
        <Hint>{ADD_QUESTIONS.marksNote}</Hint>
      </FaFormSection>
      <StepFoot onBack={onBack} draftAction={draftAction}>
        <Button variant="primary" size="lg" onClick={onContinue}>
          {CREATE_ASSESSMENT.continue}
        </Button>
      </StepFoot>
    </>
  );
}

// ---- Step 4 · Preview and create ---------------------------------------------------------------

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
  // The service's own formula (pass mark × total; its rounding is open, M22).
  const passMarks = rules.passMarkPercent === null ? null : (rules.passMarkPercent * marks) / 100;
  const intro = draft.rules.introduction.trim();
  return (
    <>
      <FaFormSection>
        <FaRecordLine>{PREVIEW_STEP.lead}</FaRecordLine>
        <FaRecordRules
          items={[
            { key: 'name', term: PREVIEW_STEP.name, value: draft.rules.name.trim() },
            {
              key: 'questions',
              term: PREVIEW_STEP.questions,
              value: questionsAndMarks(picked.length, marks),
            },
            {
              key: 'pass',
              term: PREVIEW_STEP.passMark,
              value:
                rules.passMarkPercent === null
                  ? draft.rules.passMark
                  : passMarkWithMarks(rules.passMarkPercent, passMarks, marks),
            },
            {
              key: 'attempts',
              term: PREVIEW_STEP.attempts,
              value: rules.attemptsAllowed === null ? '' : String(rules.attemptsAllowed),
            },
            {
              key: 'deadline',
              term: PREVIEW_STEP.deadline,
              value: rules.deadline === null ? '' : deadlineWords(rules.deadline),
            },
            {
              key: 'release',
              term: PREVIEW_STEP.release,
              value: releaseWords(rules.release),
            },
            { key: 'time', term: PREVIEW_STEP.timeLimit, value: PREVIEW_STEP.none },
          ]}
        />
        <FaRecordIntro label={PREVIEW_STEP.introduction} quiet={intro === ''}>
          {intro === '' ? PREVIEW_STEP.none : intro}
        </FaRecordIntro>
      </FaFormSection>
      <FaFormSection title={PREVIEW_STEP.listTitle}>
        <FaRecordQuestions
          items={picked.map(({ question }, index) => ({
            key: question.id,
            number: index + 1,
            text: question.text,
            type: QUESTION_TYPE_WORDS[question.body.type],
            written: question.body.type === 'written',
            marks: marksWords(question.marks),
          }))}
        />
      </FaFormSection>
      <StepFoot onBack={onBack} draftAction={draftAction}>
        <Button
          variant="primary"
          size="lg"
          onClick={onCreate}
          busy={creating}
          busyLabel={CREATE_ASSESSMENT.creating}
        >
          {CREATE_ASSESSMENT.create}
        </Button>
      </StepFoot>
    </>
  );
}

/** "After the deadline", "On a date — 20 Nov 2026, 09:00" (the export's `relText`). */
function releaseWords(release: ReturnType<typeof typedRules>['release']): string {
  if (release === null) return '';
  if (release.option === 'on-date')
    return `On a date — ${release.releaseDate === null ? '' : deadlineWords(release.releaseDate)}`;
  return release.option === 'after-deadline' ? 'After the deadline' : 'Immediately after marking';
}

// ---- The result -----------------------------------------------------------------------------------

export function ResultSection({
  assessment,
  readiness,
  experimentName,
  marks,
  resultRef,
  onAnother,
}: {
  readonly assessment: Assessment;
  readonly readiness: AssessmentReadiness;
  readonly experimentName: string;
  /** The questions' marks (the questions ticked when it was created). */
  readonly marks: number;
  readonly resultRef?: Ref<HTMLDivElement>;
  readonly onAnother: () => void;
}) {
  const ready = readiness === 'ready';
  const rules = assessment.rules;
  const rulesSet =
    rules.passMarkPercent !== null &&
    rules.attemptsAllowed !== null &&
    rules.deadline !== null &&
    rules.release !== null &&
    (rules.release.option !== 'on-date' || rules.release.releaseDate !== null);
  const questions = assessment.questions.length;
  return (
    <FaResult
      id={`${ID_PREFIX}-done`}
      resultRef={resultRef}
      actions={
        <>
          <ButtonLink variant="primary" size="lg" href={assessmentAddress(assessment.id)}>
            {CREATE_RESULT.open}
          </ButtonLink>
          <ButtonLink size="lg" href={ASSESSMENTS_ADDRESS}>
            {CREATE_RESULT.backToAssessments}
          </ButtonLink>
          <Button size="lg" onClick={onAnother}>
            {CREATE_RESULT.another}
          </Button>
        </>
      }
    >
      <FaCreateResultStatus>
        <StatusPill tone={ready ? 'ok' : 'neutral'} size="lg">
          {READINESS_WORDS[readiness].label}
        </StatusPill>
      </FaCreateResultStatus>
      <FaResultText>{ready ? readyLine(experimentName) : CREATE_RESULT.draftLine}</FaResultText>
      <FaChecklist
        flush
        label={CREATE_RESULT.checklist}
        items={[
          {
            key: 'name',
            text: CREATE_RESULT.nameCheck,
            done: assessment.name.trim() !== '',
          },
          {
            key: 'rules',
            text: rulesSet ? CREATE_RESULT.rulesSet : CREATE_RESULT.rulesNotFinished,
            done: rulesSet,
          },
          {
            key: 'questions',
            text: questions > 0 ? questionsAndMarks(questions, marks) : CREATE_RESULT.noQuestion,
            done: questions > 0,
          },
        ]}
      />
    </FaResult>
  );
}

// ---- This assessment ------------------------------------------------------------------------------

export interface SummaryValues {
  readonly experiment: string | null;
  readonly draft: CreateDraft;
  readonly picked: readonly QuestionBankRow[];
}

/** "4 questions · 16 marks", or `none` (step 3 "No questions chosen yet", the side "None yet"). */
export function totalWords(picked: readonly QuestionBankRow[], none: string): string {
  if (picked.length === 0) return none;
  return questionsAndMarks(
    picked.length,
    picked.reduce((sum, row) => sum + row.question.marks, 0),
  );
}

/** "This assessment" beside steps 1–3; "When you create it" beside step 4. */
export function ThisAssessment({
  values,
  step4,
  experimentName,
}: {
  readonly values: SummaryValues;
  readonly step4: boolean;
  readonly experimentName: string | null;
}) {
  const titleId = `${ID_PREFIX}-sum`;
  const rules = typedRules(values.draft.rules);
  const rulesLine = typedRulesLine({
    passMark: rules.passMarkPercent === null ? null : String(rules.passMarkPercent),
    attempts: rules.attemptsAllowed,
    deadline: rules.deadline === null ? null : deadlineWords(rules.deadline),
    release:
      rules.release === null
        ? null
        : typedReleaseWords(
            rules.release.option,
            rules.release.releaseDate === null ? null : deadlineWords(rules.release.releaseDate),
          ),
  });
  const rulesDone =
    rules.passMarkPercent !== null &&
    rules.attemptsAllowed !== null &&
    rules.deadline !== null &&
    rules.release !== null &&
    (rules.release.option !== 'on-date' || rules.release.releaseDate !== null);
  const name = values.draft.rules.name.trim();
  const item = (key: string, label: string, value: string, done: boolean) => ({
    key,
    label,
    value,
    done,
    state: done ? THIS_ASSESSMENT.done : THIS_ASSESSMENT.notDone,
  });
  return (
    <FaSide labelledBy={titleId}>
      <FaSideSection>
        <FaCreateSideTitle id={titleId}>
          {step4 ? THIS_ASSESSMENT.whenCreated : THIS_ASSESSMENT.title}
        </FaCreateSideTitle>
        {step4 ? (
          <FaChecklist
            side
            label={THIS_ASSESSMENT.createLabel}
            items={[
              { key: 'sees', text: createSeesWords(experimentName ?? ''), done: true },
              { key: 'marked', text: THIS_ASSESSMENT.markedAutomatically, done: true },
              { key: 'later', text: THIS_ASSESSMENT.changeLater, done: true },
            ]}
          />
        ) : (
          <FaCreateSummary
            items={[
              item(
                'experiment',
                THIS_ASSESSMENT.experiment,
                values.experiment ?? THIS_ASSESSMENT.notChosen,
                values.experiment !== null,
              ),
              item('name', THIS_ASSESSMENT.name, name || THIS_ASSESSMENT.notNamed, name !== ''),
              item('rules', THIS_ASSESSMENT.rules, rulesLine ?? THIS_ASSESSMENT.notSet, rulesDone),
              item(
                'questions',
                THIS_ASSESSMENT.questions,
                totalWords(values.picked, THIS_ASSESSMENT.noQuestions),
                values.picked.length > 0,
              ),
            ]}
          />
        )}
        <FaCreateSideNote>{THIS_ASSESSMENT.note}</FaCreateSideNote>
      </FaSideSection>
    </FaSide>
  );
}

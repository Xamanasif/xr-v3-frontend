'use client';

import type { QuestionBankRow, ServiceError } from '@xr/contracts/draft';
import type { Assessment, AssessmentReadiness } from '@xr/domain';
import {
  BackLink,
  ErrorSummary,
  FailedState,
  LoadingState,
  Notice,
  PageContent,
  PageHeader,
  Skeleton,
  Stepper,
  stepCountText,
} from '@xr/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { CREATE_ASSESSMENT, summaryExperimentWords } from '@/copy/assessments';
import { stateWords } from '@/copy/state-copy';
import {
  ASSESSMENTS_ADDRESS,
  createAssessmentAddress,
  createAssessmentPlacement,
  type CreateStep,
} from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import {
  useAssessmentRecord,
  useCreateOptions,
  useFacultyAssessments,
  useQuestionBank,
} from '@/queries/teaching';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { type RulesField, rulesSummaryTitle } from '../shared/rules-fields';
import {
  type BankState,
  ExperimentStep,
  PreviewStep,
  QuestionsStep,
  ResultSection,
  RulesStep,
  ThisAssessment,
  totalWords,
} from './create-assessment-steps';
import {
  checkDraft,
  checkStep,
  chosenOption,
  type CreateError,
  createErrors,
  createInput,
  ERRORS_ID,
  EXISTS_ERROR,
  FIELD_IDS,
  nextStep,
  pickedRows,
  previousStep,
  reachableStep,
  stepNumber,
  stepOf,
  stepOfField,
  TITLE_ID,
} from './create-assessment-view';
import { clearCreateDraft, createDraftFor, useCreateDraft, useSessionKey } from './create-draft';

type Mode = 'create' | 'save-as-draft';

/** What Create or Save as draft answered (f6, f7). */
interface Created {
  readonly assessment: Assessment;
  readonly mode: Mode;
}

/** The errors on show, with the step they belong to (a step shows only its own). */
interface StepErrors {
  readonly step: CreateStep;
  readonly items: readonly CreateError[];
}

const RULE_FIELDS: ReadonlySet<string> = new Set<RulesField>([
  'name',
  'introduction',
  'passMark',
  'attempts',
  'deadline',
  'releaseOption',
  'releaseDate',
]);

function isRuleError(error: CreateError): error is CreateError & { readonly field: RulesField } {
  return RULE_FIELDS.has(error.field);
}

/**
 * FA-07 Create assessment, guided — board B4-04 f1 … f8 and f11, at `/faculty/assessments/new`
 * (`?step=rules|questions|preview`, Appendix A rule S1; the first step has none; `?experimentId=`
 * chooses the experiment, FA-05's way in).
 *
 * - **Read**: `AssessmentService.getCreateOptions` — the experiments the Faculty member teaches,
 *   each with the code Faculty see and the assessment it already has (one per experiment per
 *   institution, OD-B4-01 PROVISIONAL: f8); `listAssessments` for that assessment's name; the
 *   experiment's course from the teaching view; step 3's questions from `QuestionBankService`.
 * - **Four steps** in the address, with "This assessment" beside them (below 860 px of content, a
 *   collapsible block). Every rule starts empty — nothing is pre-filled (BC6); there is no timer
 *   (T-22) and no availability control: Ready means students who have the experiment see it
 *   (T-18). "Continue" checks the step with the contract's own `createAssessmentInput` (only that
 *   step's fields; the drawn summary "Check this step" takes focus, f3). What is typed is kept per
 *   signed-in person for the tab's life, across the steps and a round trip to "New question"
 *   (FA-15, which comes back with the new question chosen) — state-copy `FA-07.kept`.
 * - **Act**: "Create assessment" sends `createAssessment` (mode `create`) once; "Save as draft"
 *   (steps 2–4) sends mode `save-as-draft`, which needs only a name. The result (f6, f7) is shown
 *   in place: the record's readiness, the checklist, "Open assessment" (FA-08) and "Create
 *   another". A refusal because the experiment already has an assessment goes back to step 1 with
 *   f8; a failure for now keeps everything and says nothing was saved.
 * - "Draft with assistance" (FA-16) and "Import" (FA-17) are not built and not rendered (T-23).
 */
export function CreateAssessment() {
  useShellPage(createAssessmentPlacement(CREATE_ASSESSMENT.title));
  const navigation = useAppNavigation();
  const { step: addressStep, known } = stepOf(navigation.search);
  const sessionKey = useSessionKey();
  const [draft, update] = useCreateDraft();
  const [errors, setErrors] = useState<StepErrors | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [failure, setFailure] = useState<Mode | null>(null);
  const [sending, setSending] = useState<Mode | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [missing, setMissing] = useState(false);
  const [focusTitle, setFocusTitle] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const create = useCommand((ports) => ports.assessments.createAssessment);

  const optionsRead = useCreateOptions();
  const listRead = useFacultyAssessments();
  const options = optionsRead.data?.ok ? optionsRead.data.value : null;
  const bankRead = useQuestionBank(draft.experimentId);
  const record = useAssessmentRecord(created?.assessment.id ?? null);

  // The bank of the experiment chosen now (a previous experiment's rows are never shown).
  const bankSettled = !bankRead.isPlaceholderData;
  const bankData = bankSettled ? bankRead.data : undefined;
  const bankRows = useMemo<readonly QuestionBankRow[] | null>(
    () => (bankData?.ok ? bankData.value.filter((row) => row.question.deleted === null) : null),
    [bankData],
  );
  const bankFailed =
    draft.experimentId !== null &&
    (bankRead.isError || (bankSettled && bankRead.data !== undefined && !bankRead.data.ok));
  const picked = bankRows ? pickedRows(bankRows, draft.questionIds) : bankFailed ? [] : null;
  const pickedIds = (picked ?? []).map((row) => row.question.id);

  const existingNames = useMemo(() => {
    const rows = listRead.data?.ok ? listRead.data.value : [];
    return new Map(rows.map((row) => [row.assessment.id as string, row.assessment.name]));
  }, [listRead.data]);
  const chosen = options ? chosenOption(options, draft) : null;

  // The address's experiment (FA-05's way in) and a question FA-15 has just added (`added=`).
  const appliedExperiment = useRef<string | null>(null);
  useEffect(() => {
    if (!options || created) return;
    const params = new URLSearchParams(navigation.search);
    const fromAddress = params.get('experimentId');
    if (fromAddress !== null && fromAddress !== appliedExperiment.current) {
      appliedExperiment.current = fromAddress;
      if (options.some((option) => option.experimentId === fromAddress)) {
        update((current) =>
          current.experimentId === fromAddress
            ? current
            : { ...current, experimentId: fromAddress, questionIds: [] },
        );
      }
    }
    const added = params.get('added');
    if (added !== null) {
      update((current) =>
        current.questionIds.includes(added)
          ? current
          : { ...current, questionIds: [...current.questionIds, added] },
      );
      navigation.navigate(
        createAssessmentAddress({
          step: addressStep,
          ...(fromAddress ? { experimentId: fromAddress } : {}),
        }),
        { replace: true },
      );
    }
  }, [navigation, options, created, update, addressStep]);

  // A step's address reached before the earlier steps are complete moves to the first step that
  // is not (state-copy `FA-07.step-address`); an unknown step is the first. Read from the draft
  // as it is now, so the address's own experiment, applied just before, counts.
  const shownExperiment = draft.experimentId;
  const redirected = useRef<string | null>(null);
  useEffect(() => {
    if (!options || created) return;
    const params = new URLSearchParams(navigation.search);
    if (params.has('added')) return;
    const current = createDraftFor(sessionKey);
    const currentPicked =
      current.experimentId === shownExperiment && bankRows
        ? pickedRows(bankRows, current.questionIds).map((row) => row.question.id)
        : current.experimentId === shownExperiment && bankFailed
          ? []
          : null;
    const target = known
      ? reachableStep(addressStep, current, options, currentPicked)
      : 'experiment';
    if (target === null || (known && target === addressStep)) {
      redirected.current = null;
      return;
    }
    const href = createAssessmentAddress({ step: target });
    if (redirected.current === href) return;
    redirected.current = href;
    navigation.navigate(href, { replace: true });
  }, [
    options,
    created,
    navigation,
    sessionKey,
    shownExperiment,
    bankRows,
    bankFailed,
    known,
    addressStep,
  ]);

  // The step on show: the address's, unless an earlier one is still to do.
  const step: CreateStep =
    options && known
      ? (reachableStep(
          addressStep,
          draft,
          options,
          picked ? picked.map((row) => row.question.id) : null,
        ) ?? addressStep)
      : addressStep;
  const shown = created ? 'result' : step;

  // The title takes focus when the step or the result changes in the page (B4-04 `focus(pid +
  // '-h')`), unless the step opens with its errors (their summary takes it, `focus(pid + '-err')`).
  const [lastShown, setLastShown] = useState(shown);
  if (lastShown !== shown) {
    setLastShown(shown);
    setFailure(null);
    if (errors === null || errors.step !== shown) {
      setErrors(null);
      setFocusTitle((count) => count + 1);
    }
  }
  // What was typed is dropped once the result is on show (Create, Save as draft: `FA-07.kept`).
  useEffect(() => {
    if (created) clearCreateDraft();
  }, [created]);
  useEffect(() => {
    if (focusTitle > 0) titleRef.current?.focus();
  }, [focusTitle]);

  if (missing) navigation.notFound();

  const goTo = (next: CreateStep) => navigation.navigate(createAssessmentAddress({ step: next }));

  /** Shows the errors on the earliest step they belong to, moving there if needed. */
  const fail = (items: readonly CreateError[]) => {
    if (items.length === 0) return;
    const at = stepOfField(items[0]!.field);
    setErrors({ step: at, items: items.filter((item) => stepOfField(item.field) === at) });
    setAttempt((count) => count + 1);
    if (at !== step) goTo(at);
  };

  const clearError = (field: string) =>
    setErrors((current) =>
      current
        ? { ...current, items: current.items.filter((item) => item.field !== field) }
        : current,
    );

  const onContinue = () => {
    if (!options) return;
    setFailure(null);
    const found = checkStep(step, draft, options, pickedIds);
    if (found.length > 0) {
      fail(found);
      return;
    }
    setErrors(null);
    goTo(nextStep(step));
  };
  const onBack = () => {
    setErrors(null);
    goTo(previousStep(step));
  };
  const onCancel = () => clearCreateDraft();

  const refused = (error: ServiceError, mode: Mode) => {
    if (error.kind === 'validation-failed') {
      fail(createErrors(error));
    } else if (error.kind === 'refused' && error.code === 'assessment-exists') {
      // f8: the experiment has one now (state-copy `FA-07.exists-refused`).
      void optionsRead.refetch();
      void listRead.refetch();
      fail([EXISTS_ERROR]);
    } else if (error.kind === 'not-found' || error.kind === 'not-permitted') {
      setMissing(true);
    } else {
      setFailure(mode);
    }
  };

  const send = (mode: Mode) => {
    if (!options || create.busy) return;
    setFailure(null);
    const found =
      mode === 'create'
        ? (['experiment', 'rules', 'questions'] as const).flatMap((each) =>
            checkStep(each, draft, options, pickedIds),
          )
        : [...checkStep('experiment', draft, options, pickedIds), ...checkDraft(draft, pickedIds)];
    if (found.length > 0) {
      fail(found);
      return;
    }
    setSending(mode);
    create.run(createInput(draft, mode, pickedIds)).then(
      (answer) => {
        setSending(null);
        if (answer.ok) {
          setErrors(null);
          setCreated({ assessment: answer.value, mode });
        } else {
          refused(answer.error, mode);
        }
      },
      () => {
        // Failed for now: nothing was saved and every value stays (`FA-07.*-unavailable`).
        setSending(null);
        setFailure(mode);
      },
    );
  };

  const restart = () => {
    clearCreateDraft();
    create.reset();
    setCreated(null);
    setErrors(null);
    setFailure(null);
    appliedExperiment.current = null;
    navigation.navigate(createAssessmentAddress());
  };

  const onRuleChange = useCallback(
    (field: RulesField, value: string) => {
      update((current) => ({ ...current, rules: { ...current.rules, [field]: value } }));
    },
    [update],
  );

  // ---- the page ----
  const failed = optionsRead.isError || (optionsRead.data !== undefined && !optionsRead.data.ok);
  const loading = !failed && options === null;
  const shownErrors = errors && errors.step === shown ? errors.items : [];
  const errorOf = (field: string) => shownErrors.find((item) => item.field === field)?.message;
  const draftAction = {
    onDraft: () => send('save-as-draft'),
    busy: create.busy && sending === 'save-as-draft',
  };
  const experimentWords = chosen ? summaryExperimentWords(chosen.name, chosen.courseCode) : null;
  const summary = { experiment: experimentWords, draft, picked: picked ?? [] };

  let readiness: AssessmentReadiness | null = null;
  if (created) {
    readiness = record.data?.ok
      ? record.data.value.readiness
      : created.mode === 'create' || created.assessment.readySince !== null
        ? 'ready'
        : 'draft-not-ready';
  }

  const bank: BankState =
    bankRows !== null
      ? { kind: 'rows', rows: bankRows }
      : bankFailed
        ? { kind: 'failed', retry: () => void bankRead.refetch() }
        : { kind: 'loading' };

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mt-2 mb-4"
        back={<BackLink href={ASSESSMENTS_ADDRESS}>{CREATE_ASSESSMENT.back}</BackLink>}
        overline={created ? CREATE_ASSESSMENT.title : stepCountText(stepNumber(step), 4)}
        title={
          created
            ? created.mode === 'create'
              ? CREATE_ASSESSMENT.createdTitle
              : CREATE_ASSESSMENT.draftTitle
            : CREATE_ASSESSMENT.stepTitles[step]
        }
        titleId={TITLE_ID}
        titleFocusTarget
        titleRef={titleRef}
      />
      {created ? null : (
        <Stepper
          label={CREATE_ASSESSMENT.title}
          steps={CREATE_ASSESSMENT.steps}
          current={stepNumber(step)}
          doneWords={false}
          className="mb-6"
        />
      )}
      <div className="xw-flow">
        <div className="xw-flow-main">
          {shownErrors.length > 0 ? (
            <ErrorSummary
              key={attempt}
              id={ERRORS_ID}
              title={rulesSummaryTitle(shownErrors.length)}
              items={shownErrors.map((item) => ({
                fieldId: FIELD_IDS[item.field],
                summaryText: item.summaryText,
              }))}
            />
          ) : null}
          {failure ? (
            <Notice tone="err">
              {failure === 'create'
                ? stateWords('FA-07.create-unavailable')
                : stateWords('FA-07.draft-unavailable')}
            </Notice>
          ) : null}
          {created && readiness ? (
            <ResultSection
              assessment={created.assessment}
              readiness={readiness}
              experimentName={
                options?.find((option) => option.experimentId === created.assessment.experimentId)
                  ?.name ?? created.assessment.experimentId
              }
              onAnother={restart}
            />
          ) : failed ? (
            <FailedState
              title={stateWords('FA-07.failed')}
              onRetry={() => {
                void optionsRead.refetch();
                void listRead.refetch();
              }}
            >
              {stateWords('FA-06.failed.line')}
            </FailedState>
          ) : loading || !options ? (
            <LoadingState
              label={stateWords('FA-07.loading')}
              surface="section"
              className="flex flex-col gap-4 p-6"
              skeleton={
                <>
                  <Skeleton className="w-[40%]" />
                  <Skeleton />
                  <Skeleton className="w-[70%]" />
                </>
              }
            />
          ) : step === 'experiment' ? (
            <ExperimentStep
              options={options}
              chosen={chosen}
              existingNames={existingNames}
              error={errorOf('experiment')}
              onPick={(experimentId) => {
                update((current) =>
                  current.experimentId === experimentId
                    ? current
                    : { ...current, experimentId, questionIds: [] },
                );
                setErrors(null);
              }}
              onCancel={onCancel}
              onContinue={onContinue}
            />
          ) : step === 'rules' ? (
            <RulesStep
              draft={draft}
              errors={shownErrors.filter(isRuleError)}
              onChange={(field, value) => {
                onRuleChange(field, value);
                clearError(field);
              }}
              onBack={onBack}
              onContinue={onContinue}
              draftAction={draftAction}
            />
          ) : step === 'questions' ? (
            <QuestionsStep
              experimentId={draft.experimentId ?? ''}
              experimentName={chosen?.name ?? ''}
              bank={bank}
              questionIds={draft.questionIds}
              totalText={totalWords(picked ?? [])}
              error={errorOf('questions')}
              onToggle={(questionId) => {
                update((current) => ({
                  ...current,
                  questionIds: current.questionIds.includes(questionId)
                    ? current.questionIds.filter((id) => id !== questionId)
                    : [...current.questionIds, questionId],
                }));
                setErrors(null);
              }}
              onBack={onBack}
              onContinue={onContinue}
              draftAction={draftAction}
            />
          ) : (
            <PreviewStep
              draft={draft}
              picked={picked ?? []}
              creating={create.busy && sending === 'create'}
              onBack={onBack}
              onCreate={() => send('create')}
              draftAction={draftAction}
            />
          )}
          {!created && options ? <ThisAssessment values={summary} variant="bar" /> : null}
        </div>
        {!created && options ? <ThisAssessment values={summary} variant="aside" /> : null}
      </div>
    </PageContent>
  );
}

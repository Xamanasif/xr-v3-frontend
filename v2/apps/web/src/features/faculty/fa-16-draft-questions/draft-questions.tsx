'use client';

import type { ServiceError, ValidationFailed } from '@xr/contracts/draft';
import type { ExperimentId, QuestionType } from '@xr/domain';
import {
  BackLink,
  Button,
  ErrorSummary,
  FailedState,
  Field,
  FieldError,
  Link,
  LoadingState,
  Notice,
  PageContent,
  PageHeader,
  Select,
  Textarea,
} from '@xr/ui';
import { type ReactNode, type Ref, useEffect, useRef, useState } from 'react';

import { QUESTION_TYPE_WORDS, QUESTION_TYPES } from '@/copy/assessment-words';
import { DRAFT_QUESTIONS, draftSummaryTitle, labBriefLine } from '@/copy/question-tools';
import { stateWords } from '@/copy/state-copy';
import { questionBankAddress, questionToolPlacement } from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import { type FormFieldError, formFieldErrors } from '@/queries/faculty-forms';
import { useQuestionDrafts } from '@/queries/faculty-assessment-work';
import { useCreateOptions, useTeachingExperiment } from '@/queries/teaching';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { NoExperiment } from '../fa-14-question-bank/question-bank';
import { SUMMARY_TARGETS } from './draft-editor';
import { DraftsList, SampleDraftsNote } from './drafts-list';

type Source = 'lab-brief' | 'pasted-text';
type RequestField = 'source' | 'pastedText' | 'types' | 'howMany';

/** The choices as made (B4-08 `drInit`: nothing chosen). */
interface Choices {
  readonly source: Source | null;
  readonly pasted: string;
  readonly types: readonly QuestionType[];
  readonly howMany: '' | '3' | '5';
}

const NO_CHOICES: Choices = { source: null, pasted: '', types: [], howMany: '' };

/** The control each error and its summary link point to (B4-08 `#Dd-src`, `#Dd-types` …). */
const FIELD_IDS: Readonly<Record<RequestField, string>> = {
  source: 'dq-src',
  pastedText: 'dq-paste',
  types: 'dq-types',
  howMany: 'dq-n',
};

function requestFieldErrors(error: ValidationFailed): FormFieldError<RequestField>[] {
  return formFieldErrors(error, (path) => (path in FIELD_IDS ? (path as RequestField) : null));
}

/** "Lab brief — …": the experiment's published resource Students see as its lab brief. */
function labBriefOf(resources: readonly { readonly title: string }[]): string | null {
  return resources.find((resource) => /^lab brief\b/i.test(resource.title))?.title ?? null;
}

type Phase = 'form' | 'list';

/**
 * FA-16 Draft questions with assistance — board B4-08 f0 … f4, at `/faculty/question-bank/draft`
 * (`?experimentId=`).
 *
 * - **The experiment** is the address's, else the first one taught (`getCreateOptions`); its name
 *   is the overline and its lab brief (`getTeachingExperiment` resources) the first choice's line
 *   (`FA-16.experiment`, `FA-16.lab-brief`).
 * - **The form** (f0, f3, f4): “Draft from” (the lab brief, or “Text I paste” with its text),
 *   “Question types” (any of the three) and “How many drafts” (3 or 5). “Draft questions” sends
 *   `QuestionBankService.requestDrafts`; the service answers the drawn words (f2 “Check these
 *   choices”, focused). While it drafts, “Drafting questions…”; if drafting fails for now, f3's
 *   “Drafting didn’t work this time” returns with the choices kept (`FA-16.request`).
 * - **Drafts to review** (f1): `DraftsList` — review and edit in place, add to bank, discard.
 *   “Draft more” returns to the form. The drafts are the sample stand-in's, and the page says so
 *   (`FA-16.sample-stand-in`); none enters the bank until the Faculty member adds it.
 */
export function DraftQuestions() {
  useShellPage(questionToolPlacement('FA-16', DRAFT_QUESTIONS.place));
  const navigation = useAppNavigation();
  const addressed = new URLSearchParams(navigation.search).get('experimentId');
  const options = useCreateOptions();
  const taught = options.data?.ok ? options.data.value : null;
  const experiment = taught
    ? ((addressed ? taught.find((entry) => entry.experimentId === addressed) : taught[0]) ?? null)
    : null;
  const experimentId = experiment?.experimentId ?? null;
  const teaching = useTeachingExperiment(experimentId);
  const drafts = useQuestionDrafts(experimentId);
  const request = useCommand((ports) => ports.questionBank.requestDrafts);

  const [phase, setPhase] = useState<Phase>('form');
  const [generation, setGeneration] = useState(0);
  const [choices, setChoices] = useState<Choices>(NO_CHOICES);
  const [errors, setErrors] = useState<readonly FormFieldError<RequestField>[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const [gone, setGone] = useState(false);
  const [focus, setFocus] = useState<{ readonly target: 'fail' | 'list'; readonly count: number }>({
    target: 'fail',
    count: 0,
  });
  const failRef = useRef<HTMLDivElement>(null);
  const listHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focus.count === 0) return;
    (focus.target === 'fail' ? failRef.current : listHeadingRef.current)?.focus();
  }, [focus]);

  if (gone) return navigation.notFound();
  if (taught && addressed && experiment === null) return navigation.notFound();
  if (teaching.data && !teaching.data.ok) {
    const kind = teaching.data.error.kind;
    if (kind === 'not-found' || kind === 'not-permitted') return navigation.notFound();
  }

  const bankHref = questionBankAddress(experimentId ?? undefined);
  const optionsFailed = options.isError || (options.data !== undefined && !options.data.ok);
  const teachingFailed = teaching.isError || (teaching.data !== undefined && !teaching.data.ok);
  const resources = teaching.data?.ok ? teaching.data.value.resources : null;

  const change = (patch: Partial<Choices>, ...cleared: RequestField[]) => {
    setChoices((current) => ({ ...current, ...patch }));
    if (cleared.length > 0) {
      setErrors((current) => current.filter((error) => !cleared.includes(error.field)));
    }
  };

  const refused = (error: ServiceError) => {
    if (error.kind === 'validation-failed') {
      setErrors(requestFieldErrors(error));
      setAttempt((current) => current + 1);
      return;
    }
    if (error.kind === 'not-found' || error.kind === 'not-permitted') {
      setGone(true);
      return;
    }
    fail();
  };
  const fail = () => {
    setFailed(true);
    setPhase('form');
    setFocus((current) => ({ target: 'fail', count: current.count + 1 }));
  };

  const submit = () => {
    if (request.busy || experimentId === null) return;
    setFailed(false);
    request
      .run({
        experimentId: experimentId as ExperimentId,
        source: choices.source,
        pastedText: choices.source === 'pasted-text' ? choices.pasted : null,
        types: QUESTION_TYPES.filter((type) => choices.types.includes(type)),
        howMany: choices.howMany === '' ? null : (Number(choices.howMany) as 3 | 5),
      })
      .then(
        async (answer) => {
          if (!answer.ok) {
            refused(answer.error);
            return;
          }
          setErrors([]);
          await drafts.refetch();
          setGeneration((current) => current + 1);
          setPhase('list');
          setFocus((current) => ({ target: 'list', count: current.count + 1 }));
        },
        // Drafting failed for now (f3): the form with its choices and the drawn failure.
        () => fail(),
      );
  };

  let body: ReactNode;
  if (optionsFailed || (experiment !== null && teachingFailed)) {
    body = (
      <FailedState
        title={stateWords('FA-16.failed')}
        onRetry={() => {
          void options.refetch();
          if (experimentId !== null) void teaching.refetch();
        }}
      >
        {stateWords('FA-14.failed.line')}
      </FailedState>
    );
  } else if (taught === null || (experiment !== null && resources === null)) {
    body = <LoadingState label={stateWords('FA-16.loading')} surface="section" />;
  } else if (experiment === null) {
    body = <NoExperiment />;
  } else if (request.busy) {
    // B4-08 `d.busy`: the form makes way for the drafting status.
    body = (
      <div className="xr-section flex flex-col gap-3.5 p-6" aria-busy="true">
        <p className="xa-save m-0" role="status">
          <span className="xr-spin" aria-hidden="true" />
          {DRAFT_QUESTIONS.drafting}
        </p>
        <span className="xr-skel w-[70%]" />
        <span className="xr-skel" />
        <span className="xr-skel w-[55%]" />
      </div>
    );
  } else if (phase === 'list') {
    body = (
      <DraftsList
        key={generation}
        place="draft-page"
        experimentId={experiment.experimentId}
        headingRef={listHeadingRef}
        onDraftMore={() => setPhase('form')}
      />
    );
  } else {
    body = (
      <RequestForm
        choices={choices}
        errors={errors}
        attempt={attempt}
        failed={failed}
        failRef={failRef}
        labBrief={labBriefOf(resources ?? [])}
        cancelHref={bankHref}
        onChange={change}
        onSubmit={submit}
      />
    );
  }

  return (
    <PageContent wrap="form">
      <PageHeader
        className="mt-2 mb-6"
        back={<BackLink href={bankHref}>{DRAFT_QUESTIONS.back}</BackLink>}
        overline={experiment?.name}
        title={DRAFT_QUESTIONS.title}
        meta={<span className="xl-meta">{DRAFT_QUESTIONS.lead}</span>}
      />
      {body}
    </PageContent>
  );
}

/** f0 … f4: the choices, as B4-08 draws them in one section. */
function RequestForm({
  choices,
  errors,
  attempt,
  failed,
  failRef,
  labBrief,
  cancelHref,
  onChange,
  onSubmit,
}: {
  readonly choices: Choices;
  readonly errors: readonly FormFieldError<RequestField>[];
  readonly attempt: number;
  readonly failed: boolean;
  readonly failRef: Ref<HTMLDivElement>;
  readonly labBrief: string | null;
  readonly cancelHref: string;
  readonly onChange: (patch: Partial<Choices>, ...cleared: RequestField[]) => void;
  readonly onSubmit: () => void;
}) {
  const errorOf = (field: RequestField) => errors.find((error) => error.field === field)?.message;
  const toggleType = (type: QuestionType) =>
    onChange(
      {
        types: choices.types.includes(type)
          ? choices.types.filter((entry) => entry !== type)
          : [...choices.types, type],
      },
      'types',
    );

  return (
    <form
      className="xr-section flex flex-col gap-5 p-6"
      noValidate
      aria-label={DRAFT_QUESTIONS.title}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <SampleDraftsNote />
      {errors.length > 0 ? (
        <ErrorSummary
          key={attempt}
          id="dq-err"
          className={SUMMARY_TARGETS}
          title={draftSummaryTitle(errors.length)}
          items={errors.map((error) => ({
            fieldId: FIELD_IDS[error.field],
            summaryText: error.summaryText,
          }))}
        />
      ) : null}
      {failed ? (
        <div id="dq-fail" ref={failRef} tabIndex={-1}>
          <Notice tone="err" role="alert" title={DRAFT_QUESTIONS.failTitle}>
            {DRAFT_QUESTIONS.failLine}
          </Notice>
        </div>
      ) : null}
      <fieldset
        className="xr-fieldset m-0 min-w-0 border-0 p-0"
        id={FIELD_IDS.source}
        tabIndex={-1}
        aria-describedby={errorOf('source') ? 'dq-src-e' : undefined}
      >
        <legend className="xr-label mb-2">{DRAFT_QUESTIONS.source}</legend>
        {errorOf('source') ? <FieldError id="dq-src-e">{errorOf('source')}</FieldError> : null}
        <div className="xr-choice-list">
          <label
            className={choices.source === 'lab-brief' ? 'xr-choice is-checked' : 'xr-choice'}
            htmlFor="dq-s1"
          >
            <input
              type="radio"
              id="dq-s1"
              name="dq-s"
              checked={choices.source === 'lab-brief'}
              onChange={() => onChange({ source: 'lab-brief' }, 'source', 'pastedText')}
            />
            <span>
              <span className="xr-choice-title">{DRAFT_QUESTIONS.sourceBrief}</span>
              {labBrief ? (
                <span className="xr-choice-sub">{labBriefLine(labBrief, null)}</span>
              ) : null}
            </span>
          </label>
          <label
            className={choices.source === 'pasted-text' ? 'xr-choice is-checked' : 'xr-choice'}
            htmlFor="dq-s2"
          >
            <input
              type="radio"
              id="dq-s2"
              name="dq-s"
              checked={choices.source === 'pasted-text'}
              onChange={() => onChange({ source: 'pasted-text' }, 'source')}
            />
            <span>
              <span className="xr-choice-title">{DRAFT_QUESTIONS.sourcePaste}</span>
              <span className="xr-choice-sub">{DRAFT_QUESTIONS.sourcePasteSub}</span>
            </span>
          </label>
        </div>
      </fieldset>
      {choices.source === 'pasted-text' ? (
        <Field
          id={FIELD_IDS.pastedText}
          label={DRAFT_QUESTIONS.pasteLabel}
          error={errorOf('pastedText')}
        >
          <Textarea
            className="min-h-[120px]"
            value={choices.pasted}
            onChange={(event) => onChange({ pasted: event.target.value }, 'pastedText')}
          />
        </Field>
      ) : null}
      <fieldset
        className="xr-fieldset m-0 min-w-0 border-0 p-0"
        id={FIELD_IDS.types}
        tabIndex={-1}
        aria-describedby={errorOf('types') ? 'dq-types-e' : undefined}
      >
        <legend className="xr-label">{DRAFT_QUESTIONS.types}</legend>
        {errorOf('types') ? <FieldError id="dq-types-e">{errorOf('types')}</FieldError> : null}
        <div className="flex flex-wrap [gap:0_24px]">
          {QUESTION_TYPES.map((type) => (
            <label key={type} className="xr-check" htmlFor={`dq-t-${type}`}>
              <input
                type="checkbox"
                id={`dq-t-${type}`}
                checked={choices.types.includes(type)}
                onChange={() => toggleType(type)}
              />
              {QUESTION_TYPE_WORDS[type]}
            </label>
          ))}
        </div>
      </fieldset>
      <Field id={FIELD_IDS.howMany} label={DRAFT_QUESTIONS.howMany} error={errorOf('howMany')}>
        <div className="max-w-[200px]">
          <Select
            value={choices.howMany}
            onChange={(event) =>
              onChange({ howMany: event.target.value as Choices['howMany'] }, 'howMany')
            }
            options={[
              { value: '', label: DRAFT_QUESTIONS.choose },
              { value: '3', label: '3' },
              { value: '5', label: '5' },
            ]}
          />
        </div>
      </Field>
      <div className="xw-flow-foot">
        <Link className="xr-btn xr-btn--text" href={cancelHref}>
          {DRAFT_QUESTIONS.cancel}
        </Link>
        <div className="xw-actions">
          <Button variant="primary" type="submit" icon="assist">
            {DRAFT_QUESTIONS.draft}
          </Button>
        </div>
      </div>
    </form>
  );
}

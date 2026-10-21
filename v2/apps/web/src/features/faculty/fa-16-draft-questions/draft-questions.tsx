'use client';

import type { ServiceError, ValidationFailed } from '@xr/contracts/draft';
import type { ExperimentId, QuestionType } from '@xr/domain';
import {
  Breadcrumbs,
  Button,
  ButtonLink,
  ErrorSummary,
  FaAuthor,
  FaBankHowTo,
  FaBankSideTitle,
  FaDraftBusy,
  FaDraftCountPick,
  FaDraftFacts,
  FaDraftFoot,
  FaDraftForm,
  FaDraftFormMessage,
  FaDraftGroup,
  FaDraftPaste,
  FaDraftSideActions,
  FaDraftSourceCards,
  FaDraftStep,
  FaDraftSteps,
  FaDraftTypeCards,
  FaFormColumn,
  FaMessageCard,
  FaSide,
  FaSideSection,
  ListState,
  LoadingRows,
  Notice,
  PageHead,
  Surface,
} from '@xr/ui/v3';
import { type ReactNode, type Ref, useEffect, useRef, useState } from 'react';

import { QUESTION_TYPE_WORDS, QUESTION_TYPES } from '@/copy/assessment-words';
import { experimentContext, QUESTION_TYPE_LINES } from '@/copy/question-bank';
import {
  DRAFT_QUESTIONS,
  draftsCountWords,
  draftSummaryTitle,
  labBriefLine,
} from '@/copy/question-tools';
import { stateWords } from '@/copy/state-copy';
import { questionBankAddress, questionToolPlacement } from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import { useQuestionDrafts } from '@/queries/faculty-assessment-work';
import { type FormFieldError, formFieldErrors } from '@/queries/faculty-forms';
import { useCreateOptions, useQuestionBank, useTeachingExperiment } from '@/queries/teaching';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { DraftsList, SampleDraftsNote } from './drafts-list';

type Source = 'lab-brief' | 'pasted-text';
type RequestField = 'source' | 'pastedText' | 'types' | 'howMany';

/** The choices as made (nothing chosen at first). */
interface Choices {
  readonly source: Source | null;
  readonly pasted: string;
  readonly types: readonly QuestionType[];
  readonly howMany: '' | '3' | '5';
}

const NO_CHOICES: Choices = { source: null, pasted: '', types: [], howMany: '' };

/** The groups' ids: each fieldset, its error (`<id>-e`) and its inputs (`<prefix>-<value>`). */
const GROUP_IDS = { source: 'dq-src', types: 'dq-types', howMany: 'dq-n' } as const;
const INPUT_PREFIX = { source: 'dq-s', types: 'dq-t', howMany: 'dq-n' } as const;

/**
 * Where each error's summary link takes focus: the step's first choice (the export's
 * `fa-dr-src-brief`, `fa-dr-t-sc`, `fa-dr-n`), or the pasted text.
 */
const FIELD_TARGETS: Readonly<Record<RequestField, string>> = {
  source: `${INPUT_PREFIX.source}-lab-brief`,
  pastedText: 'dq-paste',
  types: `${INPUT_PREFIX.types}-${QUESTION_TYPES[0]!}`,
  howMany: `${INPUT_PREFIX.howMany}-3`,
};

function requestFieldErrors(error: ValidationFailed): FormFieldError<RequestField>[] {
  return formFieldErrors(error, (path) => (path in FIELD_TARGETS ? (path as RequestField) : null));
}

/** "Lab brief — …": the experiment's published resource Students see as its lab brief. */
function labBriefOf(resources: readonly { readonly title: string }[]): string | null {
  return resources.find((resource) => /^lab brief\b/i.test(resource.title))?.title ?? null;
}

type Phase = 'form' | 'list';

const H1_ID = 'dq-h1';

/**
 * FA-16 Draft questions with assistance — the V3 export's drafting page (FA-v1 `Main.dc.html`
 * "FA-16 Draft questions with assistance"), at `/faculty/question-bank/draft` (`?experimentId=`).
 *
 * - **The experiment** is the address's, else the first one taught (`getCreateOptions`);
 *   “<experiment> · <code>” is the eyebrow and its lab brief (`getTeachingExperiment` resources)
 *   the first choice's line (`FA-16.experiment`, `FA-16.lab-brief`). None taught: the drawn
 *   “Nothing to draft from yet” card.
 * - **The form**: three numbered steps — the material (the lab brief, or “Text I paste” with its
 *   text), the question types (cards, one or more) and how many (“3 drafts” · “5 drafts”). “Draft
 *   questions” sends `QuestionBankService.requestDrafts`; the service answers the words (“Check
 *   these choices”, focused). While it drafts, “Drafting questions…”; if drafting fails for now,
 *   “Drafting didn’t work this time” returns with the choices kept (`FA-16.request`).
 * - **Drafts to review**: `DraftsList` — review and edit in the card, add to bank, discard.
 * - **The side panel**: “How drafting works”, then for the request its figures (drafted, left to
 *   review, added, discarded) with “Draft more” and “Back to Question bank”; and “Your bank for
 *   this experiment” (its questions, the drafts waiting). The drafts are the sample stand-in's,
 *   and the page says so (`FA-16.sample-stand-in`); none enters the bank until it is added.
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
  const bank = useQuestionBank(experimentId);
  const request = useCommand((ports) => ports.questionBank.requestDrafts);

  const [phase, setPhase] = useState<Phase>('form');
  const [generation, setGeneration] = useState(0);
  const [choices, setChoices] = useState<Choices>(NO_CHOICES);
  const [errors, setErrors] = useState<readonly FormFieldError<RequestField>[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const [gone, setGone] = useState(false);
  // The request on show: its drafts, and which of them were added or discarded on this visit.
  const [batch, setBatch] = useState<readonly string[]>([]);
  const [addedIds, setAddedIds] = useState<ReadonlySet<string>>(new Set());
  const [discardedIds, setDiscardedIds] = useState<ReadonlySet<string>>(new Set());
  const [focus, setFocus] = useState<{
    readonly target: 'fail' | 'list' | 'busy' | 'title';
    readonly count: number;
  }>({ target: 'fail', count: 0 });
  const failRef = useRef<HTMLDivElement>(null);
  const listHeadingRef = useRef<HTMLHeadingElement>(null);
  const busyRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (focus.count === 0) return;
    const target =
      focus.target === 'fail'
        ? failRef.current
        : focus.target === 'list'
          ? listHeadingRef.current
          : focus.target === 'busy'
            ? busyRef.current
            : document.getElementById(H1_ID);
    target?.focus();
  }, [focus]);
  const focusOn = (target: 'fail' | 'list' | 'busy' | 'title') =>
    setFocus((current) => ({ target, count: current.count + 1 }));

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
  const waiting = drafts.data?.ok ? drafts.data.value : null;
  const questions = bank.data?.ok && !bank.isPlaceholderData ? bank.data.value : null;

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
    focusOn('fail');
  };

  const submit = () => {
    if (request.busy || experimentId === null) return;
    setFailed(false);
    const sent = request.run({
      experimentId: experimentId as ExperimentId,
      source: choices.source,
      pastedText: choices.source === 'pasted-text' ? choices.pasted : null,
      types: QUESTION_TYPES.filter((type) => choices.types.includes(type)),
      howMany: choices.howMany === '' ? null : (Number(choices.howMany) as 3 | 5),
    });
    focusOn('busy');
    sent.then(
      async (answer) => {
        if (!answer.ok) {
          refused(answer.error);
          return;
        }
        setErrors([]);
        setBatch(answer.value.map((draft) => draft.id));
        setAddedIds(new Set());
        setDiscardedIds(new Set());
        await drafts.refetch();
        setGeneration((current) => current + 1);
        setPhase('list');
        focusOn('list');
      },
      // Drafting failed for now: the form with its choices and the drawn failure.
      () => fail(),
    );
  };

  const draftMore = () => {
    setPhase('form');
    focusOn('title');
  };

  const left = batch.filter((id) => waiting?.some((draft) => draft.id === id) ?? true).length;
  const listing = phase === 'list' && !request.busy;

  let body: ReactNode;
  if (optionsFailed || (experiment !== null && teachingFailed)) {
    body = (
      <Surface>
        <ListState
          kind="failed"
          title={stateWords('FA-16.failed')}
          action={
            <Button
              onClick={() => {
                void options.refetch();
                if (experimentId !== null) void teaching.refetch();
              }}
            >
              {stateWords('FA-14.try-again')}
            </Button>
          }
        >
          {stateWords('FA-14.failed.line')}
        </ListState>
      </Surface>
    );
  } else if (taught === null || (experiment !== null && resources === null)) {
    body = (
      <Surface busy>
        <LoadingRows message={stateWords('FA-16.loading')} rows={2} />
      </Surface>
    );
  } else if (experiment === null) {
    body = (
      <FaMessageCard
        icon="draft"
        title={DRAFT_QUESTIONS.noCourseTitle}
        titleId="dq-none"
        actions={<ButtonLink href={bankHref}>{DRAFT_QUESTIONS.backToBank}</ButtonLink>}
      >
        {DRAFT_QUESTIONS.noCourseLine}
      </FaMessageCard>
    );
  } else {
    let main: ReactNode;
    if (request.busy) {
      main = <FaDraftBusy id="dq-busy" message={DRAFT_QUESTIONS.drafting} ref={busyRef} />;
    } else if (phase === 'list') {
      main = (
        <DraftsList
          key={generation}
          place="draft-page"
          experimentId={experiment.experimentId}
          headingRef={listHeadingRef}
          requestDone={batch.length > 0 && left === 0}
          onAdded={(id) => setAddedIds((current) => new Set(current).add(id))}
          onDiscarded={(id) => setDiscardedIds((current) => new Set(current).add(id))}
        />
      );
    } else {
      main = (
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
    const inBatch = (ids: ReadonlySet<string>) => batch.filter((id) => ids.has(id)).length;
    body = (
      <FaAuthor>
        <FaFormColumn bare>{main}</FaFormColumn>
        <FaSide labelledBy="dq-side">
          <FaSideSection>
            <FaBankSideTitle id="dq-side" small>
              {listing ? DRAFT_QUESTIONS.requestTitle : DRAFT_QUESTIONS.howTitle}
            </FaBankSideTitle>
            {listing ? (
              <>
                <FaDraftFacts
                  facts={[
                    { key: 'drafted', term: DRAFT_QUESTIONS.facts.drafted, value: batch.length },
                    { key: 'left', term: DRAFT_QUESTIONS.facts.left, value: left },
                    { key: 'added', term: DRAFT_QUESTIONS.facts.added, value: inBatch(addedIds) },
                    {
                      key: 'discarded',
                      term: DRAFT_QUESTIONS.facts.discarded,
                      value: inBatch(discardedIds),
                    },
                  ]}
                />
                <FaDraftSideActions>
                  <Button onClick={draftMore}>{DRAFT_QUESTIONS.draftMore}</Button>
                  <ButtonLink href={bankHref}>{DRAFT_QUESTIONS.backToBank}</ButtonLink>
                </FaDraftSideActions>
              </>
            ) : (
              <FaBankHowTo steps={DRAFT_QUESTIONS.how} />
            )}
          </FaSideSection>
          {questions !== null && waiting !== null ? (
            <FaSideSection>
              <FaBankSideTitle small>{DRAFT_QUESTIONS.bankTitle}</FaBankSideTitle>
              <FaDraftFacts
                facts={[
                  {
                    key: 'questions',
                    term: DRAFT_QUESTIONS.bankQuestions,
                    value: questions.length,
                  },
                  { key: 'waiting', term: DRAFT_QUESTIONS.bankWaiting, value: waiting.length },
                ]}
              />
            </FaSideSection>
          ) : null}
        </FaSide>
      </FaAuthor>
    );
  }

  return (
    <>
      <PageHead
        breadcrumbs={
          <Breadcrumbs
            levels={[{ label: DRAFT_QUESTIONS.back, href: bankHref }]}
            current={DRAFT_QUESTIONS.place}
          />
        }
        eyebrow={experiment ? experimentContext(experiment.name, experiment.courseCode) : undefined}
        title={DRAFT_QUESTIONS.title}
        titleId={H1_ID}
        titleFocusTarget
        lead={DRAFT_QUESTIONS.lead}
      />
      {body}
    </>
  );
}

/** The choices, as the export draws them: the stand-in note, then three numbered steps. */
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
  const sourceDone =
    choices.source === 'lab-brief' ||
    (choices.source === 'pasted-text' && choices.pasted.trim() !== '');

  return (
    <FaDraftForm
      titleId="dq-fh"
      title={DRAFT_QUESTIONS.formTitle}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <SampleDraftsNote />
      {errors.length > 0 ? (
        <FaDraftFormMessage>
          <ErrorSummary
            spaced
            key={attempt}
            id="dq-err"
            title={draftSummaryTitle(errors.length)}
            items={errors.map((error) => ({
              fieldId: FIELD_TARGETS[error.field],
              summaryText: error.summaryText,
            }))}
          />
        </FaDraftFormMessage>
      ) : null}
      {failed ? (
        <FaDraftFormMessage>
          <Notice
            id="dq-fail"
            ref={failRef}
            tone="warn"
            icon="alertCircle"
            role="alert"
            title={DRAFT_QUESTIONS.failTitle}
          >
            {DRAFT_QUESTIONS.failLine}
          </Notice>
        </FaDraftFormMessage>
      ) : null}
      <FaDraftSteps>
        <FaDraftStep number={1} done={sourceDone}>
          <FaDraftGroup
            id={GROUP_IDS.source}
            legend={DRAFT_QUESTIONS.source}
            hint={DRAFT_QUESTIONS.sourceHint}
            error={errorOf('source')}
          >
            <FaDraftSourceCards
              idPrefix={INPUT_PREFIX.source}
              name={INPUT_PREFIX.source}
              options={[
                {
                  value: 'lab-brief' as const,
                  title: DRAFT_QUESTIONS.sourceBrief,
                  description: labBrief ? labBriefLine(labBrief, null) : undefined,
                  icon: 'file' as const,
                },
                {
                  value: 'pasted-text' as const,
                  title: DRAFT_QUESTIONS.sourcePaste,
                  description: DRAFT_QUESTIONS.sourcePasteSub,
                  icon: 'pencil' as const,
                },
              ]}
              value={choices.source}
              onChange={(source) =>
                source === 'lab-brief'
                  ? onChange({ source }, 'source', 'pastedText')
                  : onChange({ source }, 'source')
              }
            />
          </FaDraftGroup>
          {choices.source === 'pasted-text' ? (
            <FaDraftPaste
              id={FIELD_TARGETS.pastedText}
              label={DRAFT_QUESTIONS.pasteLabel}
              error={errorOf('pastedText')}
              value={choices.pasted}
              onChange={(pasted) => onChange({ pasted }, 'pastedText')}
            />
          ) : null}
        </FaDraftStep>
        <FaDraftStep number={2} done={choices.types.length > 0}>
          <FaDraftGroup
            id={GROUP_IDS.types}
            legend={DRAFT_QUESTIONS.types}
            hint={DRAFT_QUESTIONS.typesHint}
            error={errorOf('types')}
          >
            <FaDraftTypeCards
              idPrefix={INPUT_PREFIX.types}
              options={QUESTION_TYPES.map((type) => ({
                value: type,
                title: QUESTION_TYPE_WORDS[type],
                description: QUESTION_TYPE_LINES[type],
              }))}
              values={choices.types}
              onToggle={toggleType}
            />
          </FaDraftGroup>
        </FaDraftStep>
        <FaDraftStep number={3} done={choices.howMany !== ''}>
          <FaDraftGroup
            id={GROUP_IDS.howMany}
            legend={DRAFT_QUESTIONS.howMany}
            hint={DRAFT_QUESTIONS.howManyHint}
            error={errorOf('howMany')}
          >
            <FaDraftCountPick
              idPrefix={INPUT_PREFIX.howMany}
              name={INPUT_PREFIX.howMany}
              options={[
                { value: '3' as const, label: draftsCountWords(3) },
                { value: '5' as const, label: draftsCountWords(5) },
              ]}
              value={choices.howMany === '' ? null : choices.howMany}
              onChange={(howMany) => onChange({ howMany }, 'howMany')}
            />
          </FaDraftGroup>
        </FaDraftStep>
      </FaDraftSteps>
      <FaDraftFoot
        cancel={<ButtonLink href={cancelHref}>{DRAFT_QUESTIONS.cancel}</ButtonLink>}
        note={DRAFT_QUESTIONS.footNote}
        primaryLabel={DRAFT_QUESTIONS.draft}
      />
    </FaDraftForm>
  );
}

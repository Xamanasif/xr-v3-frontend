'use client';

import type { CreateOption } from '@xr/contracts/draft';
import type { Question } from '@xr/domain';
import {
  Breadcrumbs,
  Button,
  FaAuthor,
  FaBankFacts,
  FaBankSeeList,
  FaBankSideTitle,
  FaId,
  FaSide,
  FaSideSection,
  ListState,
  LoadingRows,
  Notice,
  PageHead,
  Surface,
} from '@xr/ui/v3';
import { type ReactNode, useState } from 'react';

import { dayMonthYear } from '@/copy/dates';
import { assessmentName } from '@/copy/fa-shared';
import {
  addedFactWords,
  experimentContext,
  namesList,
  QUESTION_EDITOR,
  versionFactWords,
  versionWords,
} from '@/copy/question-bank';
import { stateWords } from '@/copy/state-copy';
import { questionBankAddress, questionPlacement } from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import { useCreateOptions, useFacultyAssessments, useQuestionRecord } from '@/queries/teaching';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { BankNoCourse } from '../fa-14-question-bank/question-bank';
import {
  draftOf,
  EMPTY_QUESTION,
  type FormOutcome,
  QuestionForm,
  UsedNotice,
} from './question-form';
import { safeReturnTo } from './return-to';

/** The page's H1 (`h1#fa-h1`): the form's name. */
const H1_ID = 'qe-h1';

/**
 * FA-15 Add a question — the V3 export's editor (FA-v1 `Main.dc.html` "FA-15 Add / edit question"),
 * at `/faculty/question-bank/new` (`?experimentId=`, `?returnTo=`).
 *
 * The experiment is the address's, else the first one the Faculty member teaches
 * (`AssessmentService.getCreateOptions`); “<experiment> · <code>” is the eyebrow. Saving calls
 * `QuestionBankService.addQuestion`; the new question appears in the bank, which says so — or,
 * with `returnTo` (a same-origin path under `/faculty/`), the page goes back there with
 * `added=<key>` (state-copy `FA-15.after-add`). Beside the form, “This question” and “What
 * students see”.
 */
export function NewQuestion() {
  useShellPage(questionPlacement(QUESTION_EDITOR.addTitle));
  const navigation = useAppNavigation();
  const params = new URLSearchParams(navigation.search);
  const addressed = params.get('experimentId');
  const returnTo = safeReturnTo(params.get('returnTo'));
  const options = useCreateOptions();
  const [gone, setGone] = useState(false);
  const [blocked, setBlocked] = useState(false);
  if (gone) return navigation.notFound();

  const failed = options.isError || (options.data !== undefined && !options.data.ok);
  const taught = options.data?.ok ? options.data.value : null;
  if (failed) {
    return (
      <EditorPage title={QUESTION_EDITOR.addTitle} experiment={null}>
        <LoadFailed onRetry={() => void options.refetch()} />
      </EditorPage>
    );
  }
  if (taught === null) {
    return (
      <EditorPage title={QUESTION_EDITOR.addTitle} experiment={null}>
        <Loading />
      </EditorPage>
    );
  }
  const experiment = addressed
    ? taught.find((entry) => entry.experimentId === addressed)
    : taught[0];
  if (addressed && !experiment) return navigation.notFound();
  if (!experiment) {
    return (
      <EditorPage title={QUESTION_EDITOR.addTitle} experiment={null}>
        <BankNoCourse />
      </EditorPage>
    );
  }

  const outcome = (next: FormOutcome) => {
    if (next === 'gone') setGone(true);
    else if (next === 'policy-open') setBlocked(true);
  };

  return (
    <EditorPage title={QUESTION_EDITOR.addTitle} experiment={experiment}>
      {blocked ? (
        <PolicyOpen />
      ) : (
        <FaAuthor>
          <QuestionForm
            labelledBy={H1_ID}
            experimentId={experiment.experimentId}
            initial={EMPTY_QUESTION}
            editing={null}
            returnTo={returnTo}
            onOutcome={outcome}
          />
          <QuestionSide
            facts={[
              {
                key: 'used',
                term: QUESTION_EDITOR.factUsed,
                value: QUESTION_EDITOR.notInAssessment,
                quiet: true,
              },
            ]}
          />
        </FaAuthor>
      )}
    </EditorPage>
  );
}

/**
 * FA-15 Edit question — the export's “Edit question” (and its used question), at
 * `/faculty/question-bank/[questionId]`.
 *
 * Reads `QuestionBankService.getQuestion` (the question and the assessments that use it, named
 * from `listAssessments` — never by their reference). A used question shows the drawn notice:
 * saving makes a new version and every assessment keeps the version it has until “Use updated
 * version” (never changed silently). Saving calls `editQuestion` with the revision read: the saved
 * notice (“Saved as version 2.”) takes focus; a conflict reads the question again and says so
 * (`FA-15.stale`). A colleague’s question (an undecided rule) shows a notice and no form
 * (`FA-15.policy-open`); a deleted one says it was deleted (`FA-15.deleted`); an unknown or
 * out-of-scope one is the in-shell not-found page. The version is the quiet line under the title.
 */
export function EditQuestion({ questionId }: { readonly questionId: string }) {
  useShellPage(questionPlacement(QUESTION_EDITOR.editTitle));
  const navigation = useAppNavigation();
  const returnTo = safeReturnTo(new URLSearchParams(navigation.search).get('returnTo'));
  const record = useQuestionRecord(questionId);
  const options = useCreateOptions();
  const answer = record.data?.ok ? record.data.value : null;
  const usedIds = answer?.usedIn ?? [];
  const assessments = useFacultyAssessments(usedIds.length > 0);
  const [generation, setGeneration] = useState(0);
  const [stale, setStale] = useState(false);
  const [gone, setGone] = useState(false);
  const [blocked, setBlocked] = useState(false);
  if (gone) return navigation.notFound();

  if (record.data && !record.data.ok) {
    const kind = record.data.error.kind;
    if (kind === 'not-found' || kind === 'not-permitted') return navigation.notFound();
    if (kind === 'policy-open') {
      return (
        <EditorPage title={QUESTION_EDITOR.editTitle} experiment={null}>
          <PolicyOpen />
        </EditorPage>
      );
    }
  }
  // The assessments that use it are named, never referenced: a failed read of them fails the page.
  const assessmentsFailed =
    usedIds.length > 0 &&
    (assessments.isError || (assessments.data !== undefined && !assessments.data.ok));
  const failed =
    record.isError ||
    (record.data !== undefined && !record.data.ok) ||
    options.isError ||
    (options.data !== undefined && !options.data.ok) ||
    assessmentsFailed;
  if (failed) {
    return (
      <EditorPage title={QUESTION_EDITOR.editTitle} experiment={null}>
        <LoadFailed
          onRetry={() => {
            void record.refetch();
            void options.refetch();
            if (usedIds.length > 0) void assessments.refetch();
          }}
        />
      </EditorPage>
    );
  }
  const taught = options.data?.ok ? options.data.value : null;
  const list = assessments.data?.ok ? assessments.data.value : null;
  const names: readonly string[] | null = list
    ? usedIds.flatMap((id) => {
        const row = list.find((entry) => entry.assessment.id === id);
        return row ? [assessmentName(row.assessment.name)] : [];
      })
    : null;
  if (!answer || !taught || (usedIds.length > 0 && names === null)) {
    return (
      <EditorPage title={QUESTION_EDITOR.editTitle} experiment={null}>
        <Loading />
      </EditorPage>
    );
  }

  const { question } = answer;
  const experiment = taught.find((entry) => entry.experimentId === question.experimentId) ?? null;
  const usedNames = names ?? [];

  const outcome = (next: FormOutcome) => {
    if (next === 'gone') setGone(true);
    else if (next === 'policy-open') setBlocked(true);
    else if (next === 'saved') setStale(false);
    else {
      // A conflict or a deletion meanwhile: read the question again and show it as it is now.
      void record.refetch().then(() => {
        setGeneration((current) => current + 1);
        setStale(next === 'stale');
      });
    }
  };

  let body: ReactNode;
  if (blocked) body = <PolicyOpen />;
  else if (question.deleted) {
    body = <Notice tone="off" title={stateWords('FA-15.deleted')} />;
  } else {
    body = (
      <FaAuthor>
        <QuestionForm
          key={`${question.id}:${generation}`}
          labelledBy={H1_ID}
          experimentId={question.experimentId}
          initial={draftOf(question)}
          editing={{ id: question.id, rev: question.rev, usedNames }}
          returnTo={returnTo}
          aboveFields={
            stale || usedNames.length > 0 ? (
              <>
                {stale ? (
                  <Notice
                    tone="warn"
                    icon="alertCircle"
                    role="alert"
                    title={stateWords('FA-15.stale')}
                  />
                ) : null}
                {usedNames.length > 0 ? <UsedNotice names={usedNames} /> : null}
              </>
            ) : undefined
          }
          onOutcome={outcome}
        />
        <QuestionSide facts={questionFacts(question, usedNames)} />
      </FaAuthor>
    );
  }

  return (
    <EditorPage title={QUESTION_EDITOR.editTitle} experiment={experiment} question={question}>
      {body}
    </EditorPage>
  );
}

/** “This question” (`QE.facts`): its version, where it is used, when it was added. */
function questionFacts(question: Question, usedNames: readonly string[]) {
  return [
    {
      key: 'version',
      term: QUESTION_EDITOR.factVersion,
      value: versionFactWords(question.version),
    },
    {
      key: 'used',
      term: QUESTION_EDITOR.factUsed,
      value: usedNames.length > 0 ? namesList(usedNames) : QUESTION_EDITOR.notInAssessment,
      quiet: usedNames.length === 0,
    },
    {
      key: 'added',
      term: QUESTION_EDITOR.factAdded,
      value: addedFactWords(dayMonthYear(question.addedAt), question.origin === 'reviewed-draft'),
    },
  ];
}

/** The side panel (`aside.fa-side`): “This question” and “What students see”. */
function QuestionSide({
  facts,
}: {
  readonly facts: readonly {
    readonly key: string;
    readonly term: string;
    readonly value: string;
    readonly quiet?: boolean;
  }[];
}) {
  return (
    <FaSide labelledBy="qe-side">
      <FaSideSection>
        <FaBankSideTitle id="qe-side">{QUESTION_EDITOR.sideTitle}</FaBankSideTitle>
        <FaBankFacts facts={facts} />
      </FaSideSection>
      <FaSideSection>
        <FaBankSideTitle level={3}>{QUESTION_EDITOR.seeTitle}</FaBankSideTitle>
        <FaBankSeeList items={QUESTION_EDITOR.see} />
      </FaSideSection>
    </FaSide>
  );
}

/**
 * The page around the form: the crumbs (“Question bank › Add a question”), the experiment as the
 * eyebrow, the H1 and, for a question with more than one version, its version.
 */
function EditorPage({
  title,
  experiment,
  question,
  children,
}: {
  readonly title: string;
  readonly experiment: CreateOption | null;
  readonly question?: Question;
  readonly children: ReactNode;
}) {
  const experimentId = experiment?.experimentId ?? question?.experimentId;
  return (
    <>
      <PageHead
        breadcrumbs={
          <Breadcrumbs
            levels={[{ label: QUESTION_EDITOR.back, href: questionBankAddress(experimentId) }]}
            current={title}
          />
        }
        eyebrow={experiment ? experimentContext(experiment.name, experiment.courseCode) : undefined}
        title={title}
        titleId={H1_ID}
        titleFocusTarget
        meta={
          question && question.version > 1 ? (
            <FaId>{versionWords(question.version)}</FaId>
          ) : undefined
        }
      />
      {children}
    </>
  );
}

/** A colleague's question: who may change it is undecided (`FA-15.policy-open`). */
function PolicyOpen() {
  return <Notice tone="off" icon="lock" title={stateWords('FA-15.policy-open')} />;
}

/** Undrawn: loading (`FA-15.loading`). */
function Loading() {
  return (
    <Surface busy>
      <LoadingRows message={stateWords('FA-15.loading')} rows={2} />
    </Surface>
  );
}

/** Undrawn: failed + Try again (`FA-15.failed`). */
function LoadFailed({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <Surface>
      <ListState
        kind="failed"
        title={stateWords('FA-15.failed')}
        action={<Button onClick={onRetry}>{stateWords('FA-14.try-again')}</Button>}
      >
        {stateWords('FA-14.failed.line')}
      </ListState>
    </Surface>
  );
}

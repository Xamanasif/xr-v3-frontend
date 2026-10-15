'use client';

import type { CreateOption } from '@xr/contracts/draft';
import type { Question } from '@xr/domain';
import { BackLink, FailedState, LoadingState, Notice, PageContent, PageHeader } from '@xr/ui';
import { type ReactNode, useState } from 'react';

import { QUESTION_EDITOR, usedNoticeTitle } from '@/copy/question-bank';
import { stateWords } from '@/copy/state-copy';
import { questionBankAddress, questionPlacement } from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import { useCreateOptions, useFacultyAssessments, useQuestionRecord } from '@/queries/teaching';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { NoExperiment } from '../fa-14-question-bank/question-bank';
import { draftOf, EMPTY_QUESTION, type FormOutcome, QuestionForm } from './question-form';
import { safeReturnTo } from './return-to';

/**
 * FA-15 Add a question — board B4-07 f3, f5, f6, f8, at `/faculty/question-bank/new`
 * (`?experimentId=`, `?returnTo=`).
 *
 * The experiment is the address's, else the first one the Faculty member teaches
 * (`AssessmentService.getCreateOptions`); its name is the overline. Saving calls
 * `QuestionBankService.addQuestion`; the new question appears in the bank, which says so — or,
 * with `returnTo` (a same-origin path under `/faculty/`), the page goes back there with
 * `added=<questionId>` (state-copy `FA-15.after-add`).
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
        <LoadingState label={stateWords('FA-15.loading')} surface="section" />
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
        <NoExperiment />
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
        <Notice tone="quiet">{stateWords('FA-15.policy-open')}</Notice>
      ) : (
        <QuestionForm
          experimentId={experiment.experimentId}
          initial={EMPTY_QUESTION}
          editing={null}
          returnTo={returnTo}
          onOutcome={outcome}
        />
      )}
    </EditorPage>
  );
}

/**
 * FA-15 Edit question — board B4-07 f4, at `/faculty/question-bank/[questionId]`.
 *
 * Reads `QuestionBankService.getQuestion` (the question and the assessments that use it, named
 * from `listAssessments`). A used question shows the drawn notice: saving makes a new version and
 * every assessment keeps the version it has until “Use updated version” (never changed silently).
 * Saving calls `editQuestion` with the revision read: the saved notice takes focus; a conflict
 * reads the question again and says so (`FA-15.stale`). A colleague’s question (an undecided rule)
 * shows a plain message and no form (`FA-15.policy-open`); a deleted one says it was deleted
 * (`FA-15.deleted`); an unknown or out-of-scope one is the in-shell not-found page.
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
          <Notice tone="quiet">{stateWords('FA-15.policy-open')}</Notice>
        </EditorPage>
      );
    }
  }
  const failed =
    record.isError ||
    (record.data !== undefined && !record.data.ok) ||
    options.isError ||
    (options.data !== undefined && !options.data.ok);
  if (failed) {
    return (
      <EditorPage title={QUESTION_EDITOR.editTitle} experiment={null}>
        <LoadFailed
          onRetry={() => {
            void record.refetch();
            void options.refetch();
          }}
        />
      </EditorPage>
    );
  }
  const taught = options.data?.ok ? options.data.value : null;
  const list = assessments.data?.ok ? assessments.data.value : null;
  const names: readonly string[] | null = list
    ? usedIds.map((id) => list.find((row) => row.assessment.id === id)?.assessment.name || id)
    : assessments.isError || (assessments.data && !assessments.data.ok)
      ? usedIds
      : null;
  if (!answer || !taught || (usedIds.length > 0 && names === null)) {
    return (
      <EditorPage title={QUESTION_EDITOR.editTitle} experiment={null}>
        <LoadingState label={stateWords('FA-15.loading')} surface="section" />
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

  return (
    <EditorPage title={QUESTION_EDITOR.editTitle} experiment={experiment} question={question}>
      {blocked ? (
        <Notice tone="quiet">{stateWords('FA-15.policy-open')}</Notice>
      ) : question.deleted ? (
        <Notice tone="quiet">{stateWords('FA-15.deleted')}</Notice>
      ) : (
        <>
          {usedNames.length > 0 ? (
            <div className="mb-4">
              <Notice tone="warn" title={usedNoticeTitle(usedNames)}>
                {usedNames.length > 1
                  ? QUESTION_EDITOR.usedNoticeSeveral
                  : QUESTION_EDITOR.usedNotice}
              </Notice>
            </div>
          ) : null}
          {stale ? (
            <div className="mb-4">
              <Notice tone="warn" role="alert">
                {stateWords('FA-15.stale')}
              </Notice>
            </div>
          ) : null}
          <QuestionForm
            key={`${question.id}:${generation}`}
            experimentId={question.experimentId}
            initial={draftOf(question)}
            editing={{ id: question.id, rev: question.rev, usedNames }}
            returnTo={returnTo}
            onOutcome={outcome}
          />
        </>
      )}
    </EditorPage>
  );
}

/** The page around the form: the back link, the experiment overline, the H1 (and f4’s ID). */
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
    <PageContent wrap="form">
      <PageHeader
        className="mt-2 mb-4"
        back={<BackLink href={questionBankAddress(experimentId)}>{QUESTION_EDITOR.back}</BackLink>}
        overline={experiment?.name}
        title={title}
        meta={question ? <span className="xr-id">{question.id}</span> : null}
      />
      {children}
    </PageContent>
  );
}

/** Undrawn: failed + Try again (`FA-15.failed`). */
function LoadFailed({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <FailedState title={stateWords('FA-15.failed')} onRetry={onRetry}>
      {stateWords('FA-14.failed.line')}
    </FailedState>
  );
}

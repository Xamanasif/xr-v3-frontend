'use client';

import type { AssessmentPreview as PreviewAnswer } from '@xr/contracts/draft';
import type { ChoiceKey, Question } from '@xr/domain';
import { EmptyState, FailedState, Icon, LoadingState, SegmentedControl } from '@xr/ui';
import { useEffect, useState } from 'react';

import {
  PREVIEW_PAGE,
  previewAnswerLabel,
  questionHeading,
  studentViewLine,
} from '@/copy/assessment-settings';
import {
  deadlineWords,
  marksWords,
  QUESTION_TYPE_WORDS,
  questionsAndMarks,
} from '@/copy/assessment-words';
import { stateWords } from '@/copy/state-copy';
import { assessmentAddress, PREVIEW_KEY_VIEW } from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import { useAssessmentPreview } from '@/queries/teaching';

import {
  AssessmentFallback,
  AssessmentFrame,
  type AssessmentFrameView,
  useAssessmentPage,
} from '../shared/assessment-frame';

type PreviewView = 'student' | 'key';

/** The view an address asks for, and whether it must become the bare address (`FA-11.view-address`). */
function previewViewOf(search: string): {
  readonly view: PreviewView;
  readonly normalise: boolean;
} {
  const view = new URLSearchParams(search).get('view');
  if (view === PREVIEW_KEY_VIEW) return { view: 'key', normalise: false };
  return { view: 'student', normalise: view !== null };
}

function previewAddress(assessmentId: string, view: PreviewView): string {
  const address = assessmentAddress(assessmentId, 'preview');
  return view === 'key' ? `${address}?view=${PREVIEW_KEY_VIEW}` : address;
}

const CHOICE_KEYS: readonly ChoiceKey[] = ['A', 'B', 'C', 'D'];

/**
 * FA-11 Assessment · Preview — board B4-06 f5 (Student view) and f6 (Answer key), at
 * `/faculty/assessments/[assessmentId]/preview` (`?view=key` for the key; rule T3).
 *
 * - **Reads**: the record's frame (`useAssessmentPage`) and `AssessmentService.previewAsStudent` —
 *   the questions exactly as the assessment pins them (a newer bank version shows only after "Use
 *   updated version", `FA-11.pinned`) and the answer key with the marking guidance. It creates no
 *   attempt and saves nothing; there is no command on this page.
 * - **As drawn**: the switch "Student view · Answer key" (`div.xr-seg`, mirrored into the address
 *   without a history entry, `FA-11.view-address`) with "Previewing creates no attempt and saves
 *   nothing." Student view: "As a student sees it: …" (`FA-11.as-a-student`), each question with its
 *   number, type and marks, its options as disabled radios with nothing marked, a written answer's
 *   disabled box and "Your faculty marks written answers." Answer key: "Only you see the answer key
 *   and the marking guidance.", the correct option marked "Correct", "Explanation" and, for a
 *   written answer, "Marking guidance" (`FA-11.key-rows`).
 * - **Undrawn**: a draft without questions (`FA-11.empty.*`), the preview loading or failing
 *   (`FA-11.loading`, `FA-11.failed`), the frame's own loading, failed and not-found.
 */
export function AssessmentPreview({ assessmentId }: { readonly assessmentId: string }) {
  const state = useAssessmentPage(assessmentId, 'preview');
  if (state.kind !== 'ready') return <AssessmentFallback state={state} />;
  return (
    <AssessmentFrame view={state.view} tab="preview">
      <PreviewBody key={state.view.record.assessment.id} view={state.view} />
    </AssessmentFrame>
  );
}

function PreviewBody({ view }: { readonly view: AssessmentFrameView }) {
  const navigation = useAppNavigation();
  const assessmentId = view.record.assessment.id;
  const preview = useAssessmentPreview(assessmentId);

  // The view lives here while the page is on show; the address mirrors it (replaced, no history
  // entry). An address that differs from the view came from outside (Back): it is read again.
  const addressed = previewViewOf(navigation.search);
  const [shown, setShown] = useState<PreviewView>(addressed.view);
  const [seenSearch, setSeenSearch] = useState(navigation.search);
  if (navigation.search !== seenSearch) {
    setSeenSearch(navigation.search);
    setShown(addressed.view);
  }
  const { normalise } = addressed;
  useEffect(() => {
    if (normalise) navigation.replace(previewAddress(assessmentId, 'student'));
  }, [normalise, navigation, assessmentId]);
  const choose = (next: PreviewView) => {
    setShown(next);
    navigation.replace(previewAddress(assessmentId, next));
  };

  if (preview.isError || (preview.data && !preview.data.ok)) {
    if (preview.data && !preview.data.ok) {
      const kind = preview.data.error.kind;
      if (kind === 'not-found' || kind === 'not-permitted') return navigation.notFound();
      // A colleague's questions on a co-taught experiment: their key is undecided (OD-B4-17).
      if (kind === 'policy-open') {
        return (
          <EmptyState icon="question" title={stateWords('FA-11.policy-open.title')}>
            {stateWords('FA-11.policy-open.line')}
          </EmptyState>
        );
      }
    }
    return (
      <FailedState title={stateWords('FA-11.failed')} onRetry={() => void preview.refetch()}>
        {stateWords('FA-shared.record-failed.line')}
      </FailedState>
    );
  }
  if (!preview.data) {
    return <LoadingState label={stateWords('FA-11.loading')} surface="section" />;
  }
  const answer = preview.data.value;
  if (answer.questions.length === 0) {
    return (
      <EmptyState icon="question" title={stateWords('FA-11.empty.title')}>
        {stateWords('FA-11.empty.line')}
      </EmptyState>
    );
  }

  const deadline = view.record.assessment.rules.deadline;
  const total = answer.questions.reduce((sum, question) => sum + question.marks, 0);
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-5 gap-y-3">
        <SegmentedControl<PreviewView>
          label={PREVIEW_PAGE.viewLabel}
          options={[
            { value: 'student', label: PREVIEW_PAGE.studentView },
            { value: 'key', label: PREVIEW_PAGE.answerKey },
          ]}
          value={shown}
          onValueChange={choose}
        />
        <p className="xl-open m-0">
          <Icon name="eye" size={16} />
          <span>{PREVIEW_PAGE.createsNothing}</span>
        </p>
      </div>
      <div className="max-w-[820px]">
        {shown === 'key' ? (
          <AnswerKey answer={answer} />
        ) : (
          <StudentView
            answer={answer}
            line={studentViewLine(
              questionsAndMarks(answer.questions.length, total),
              deadline === null ? null : deadlineWords(deadline),
            )}
          />
        )}
      </div>
    </>
  );
}

/** The options of a choice question in key order, or True / False. */
function optionsOf(
  question: Question,
): readonly { readonly key: string; readonly words: string }[] {
  const body = question.body;
  if (body.type === 'multiple-choice') {
    return CHOICE_KEYS.flatMap((key) => {
      const words = body.options[key];
      return words === undefined ? [] : [{ key, words }];
    });
  }
  if (body.type === 'true-false') {
    return [
      { key: 'true', words: PREVIEW_PAGE.trueWord },
      { key: 'false', words: PREVIEW_PAGE.falseWord },
    ];
  }
  return [];
}

function QuestionHead({
  question,
  position,
  count,
}: {
  readonly question: Question;
  readonly position: number;
  readonly count: number;
}) {
  return (
    <div className="xa-q-head">
      <span className="xa-q-n">
        {questionHeading(position, count, QUESTION_TYPE_WORDS[question.body.type])}
      </span>
      <span className="xr-meta">{marksWords(question.marks)}</span>
    </div>
  );
}

/** f5: the questions as a student sees them — nothing answered, nothing marked, nothing saved. */
function StudentView({ answer, line }: { readonly answer: PreviewAnswer; readonly line: string }) {
  const count = answer.questions.length;
  return (
    <>
      <p className="xl-meta mt-0 mb-3">{line}</p>
      <ol className="xa-qs">
        {answer.questions.map((question, index) => {
          const position = index + 1;
          return (
            <li key={question.id} className="xa-q">
              <QuestionHead question={question} position={position} count={count} />
              {question.body.type === 'written' ? (
                <>
                  <p className="xa-q-text m-0">{question.text}</p>
                  <span className="xr-hint">{PREVIEW_PAGE.writtenHint}</span>
                  <textarea
                    className="xr-textarea min-h-24"
                    disabled
                    aria-label={previewAnswerLabel(position)}
                  />
                </>
              ) : (
                <fieldset className="xr-fieldset">
                  <legend className="xa-q-text">{question.text}</legend>
                  <div className="xr-choice-list">
                    {optionsOf(question).map((option) => (
                      <label key={option.key} className="xr-choice">
                        <input type="radio" name={`preview-${question.id}`} disabled />
                        <span>{option.words}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}

/** f6: the answer key — the correct option, the explanation and a written answer's guidance. */
function AnswerKey({ answer }: { readonly answer: PreviewAnswer }) {
  const count = answer.questions.length;
  return (
    <>
      <p className="xl-meta mt-0 mb-3">{PREVIEW_PAGE.keyLine}</p>
      <ol className="xa-qs">
        {answer.questions.map((question, index) => {
          const key = answer.answerKey.find((entry) => entry.questionId === question.id);
          const correct = key?.correct ?? null;
          const guidance = key?.markingGuidance ?? null;
          return (
            <li key={question.id} className="xa-q">
              <QuestionHead question={question} position={index + 1} count={count} />
              <p className="xa-q-text m-0">{question.text}</p>
              {question.body.type === 'written' ? null : (
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {optionsOf(question).map((option) => (
                    <li key={option.key} className="flex items-start gap-2.5">
                      {option.key === correct ? (
                        <span className="xa-mk is-ok">
                          <Icon name="done" />
                          {PREVIEW_PAGE.correct}
                        </span>
                      ) : (
                        <span className="xa-mk min-w-[72px] text-ink-3">{'\u00a0'}</span>
                      )}
                      <span>{option.words}</span>
                    </li>
                  ))}
                </ul>
              )}
              {question.body.type === 'written' && guidance ? (
                <div className="xa-ans-row">
                  <span>{PREVIEW_PAGE.markingGuidance}</span>
                  <span>{guidance}</span>
                </div>
              ) : null}
              {question.explanation ? (
                <div className="xa-ans-row">
                  <span>{PREVIEW_PAGE.explanation}</span>
                  <span>{question.explanation}</span>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </>
  );
}

'use client';

import type { ChoiceKey, Question } from '@xr/domain';
import { LoadingState } from '@xr/ui';
import {
  Button,
  ButtonLink,
  FaInlineMessage,
  FaPreviewBar,
  FaPreviewSheet,
  FaPreviewStage,
  FaPreviewSurface,
  FaSegmented,
  ListState,
  TextLink,
  V46Island,
} from '@xr/ui/v3';
import { useEffect, useState } from 'react';

import { PREVIEW_PAGE, questionHeading, studentViewLine } from '@/copy/assessment-settings';
import {
  deadlineWords,
  marksWords,
  QUESTION_TYPE_WORDS,
  questionsAndMarks,
} from '@/copy/assessment-words';
import { assessmentName, FA_GUIDANCE_LABEL } from '@/copy/fa-shared';
import { stateWords } from '@/copy/state-copy';
import { assessmentAddress, FACULTY_HELP_ADDRESS, PREVIEW_KEY_VIEW } from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import { useAssessmentPreview } from '@/queries/teaching';

import {
  AssessmentFallback,
  AssessmentFrame,
  type AssessmentFrameView,
  TAB_HEADING_ID,
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
 * FA-11 Assessment · Preview in the V3 Refined B design (FA-v1 `Main.dc.html` "FA-11 Preview",
 * `vmPreview`), at `/faculty/assessments/[assessmentId]/preview` (`?view=key` for the key; rule T3).
 *
 * - **Reads**: the record's frame (`useAssessmentPage`) and `AssessmentService.previewAsStudent` —
 *   the questions exactly as the assessment pins them (a newer bank version shows only after "Use
 *   updated version", `FA-11.pinned`) and the answer key with the marking guidance. It creates no
 *   attempt and saves nothing; there is no command on this page.
 * - **As drawn**: the switch "Student view · Answer key" (`div.fa-seg`, mirrored into the address
 *   without a history entry, `FA-11.view-address`) with "Previewing creates no attempt and saves
 *   nothing.", then the sheet. Student view: "As students see it", the assessment's name, "4
 *   questions · 16 marks · due … · no time limit" and the introduction; each question with its
 *   place, type and marks, its options with nothing marked, a written answer's box. Answer key:
 *   "Only you see the answer key and the marking guidance", the correct option marked "Correct",
 *   a written answer's "Marking guidance · only you see this" and each question's explanation
 *   (`FA-11.key-rows`).
 * - **States**: nothing to preview (a draft without questions, with "Add questions"), the preview
 *   failing ("We couldn’t load the preview" with "Try again"), and a co-teaching colleague's
 *   questions (policy-open, OD-B4-17: the existing words, in the role's refusal with "Back to
 *   Summary" and "Help"). Loading keeps the application's existing state.
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
  const assessment = view.record.assessment;
  const assessmentId = assessment.id;
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
          <FaPreviewSurface labelledBy={TAB_HEADING_ID}>
            <FaInlineMessage
              icon="lock"
              lock
              title={stateWords('FA-11.policy-open.title')}
              titleId={TAB_HEADING_ID}
              focusable
              actions={
                <>
                  <ButtonLink href={assessmentAddress(assessmentId)}>
                    {PREVIEW_PAGE.backToSummary}
                  </ButtonLink>
                  <TextLink href={FACULTY_HELP_ADDRESS}>{PREVIEW_PAGE.help}</TextLink>
                </>
              }
            >
              {stateWords('FA-11.policy-open.line')}
            </FaInlineMessage>
          </FaPreviewSurface>
        );
      }
    }
    return (
      <FaPreviewSurface labelledBy={TAB_HEADING_ID}>
        <ListState
          kind="failed"
          titleAs="h2"
          titleId={TAB_HEADING_ID}
          titleFocusable
          title={PREVIEW_PAGE.failedTitle}
          action={
            <Button
              onClick={() => {
                void preview.refetch();
                window.setTimeout(() => document.getElementById(TAB_HEADING_ID)?.focus(), 0);
              }}
            >
              {PREVIEW_PAGE.tryAgain}
            </Button>
          }
        >
          {PREVIEW_PAGE.failedLine}
        </ListState>
      </FaPreviewSurface>
    );
  }
  if (!preview.data) {
    return (
      <V46Island>
        <LoadingState label={stateWords('FA-11.loading')} surface="section" />
      </V46Island>
    );
  }
  const answer = preview.data.value;
  const count = answer.questions.length;
  const total = answer.questions.reduce((sum, question) => sum + question.marks, 0);
  const deadline = assessment.rules.deadline;
  const key = shown === 'key';
  return (
    <FaPreviewSurface labelledBy={TAB_HEADING_ID}>
      <FaPreviewBar
        headingId={TAB_HEADING_ID}
        heading={PREVIEW_PAGE.heading}
        switcher={
          <FaSegmented
            label={PREVIEW_PAGE.viewLabel}
            segments={[
              {
                key: 'student',
                label: PREVIEW_PAGE.studentView,
                icon: 'eye',
                pressed: !key,
                onPress: () => choose('student'),
              },
              {
                key: 'key',
                label: PREVIEW_PAGE.answerKey,
                icon: 'key',
                pressed: key,
                onPress: () => choose('key'),
              },
            ]}
          />
        }
        note={PREVIEW_PAGE.createsNothing}
      />
      {count === 0 ? (
        <FaPreviewStage>
          <ListState
            kind="empty"
            icon="eye"
            title={PREVIEW_PAGE.emptyTitle}
            action={
              <ButtonLink href={assessmentAddress(assessmentId, 'questions')}>
                {PREVIEW_PAGE.addQuestions}
              </ButtonLink>
            }
          >
            {PREVIEW_PAGE.emptyLine}
          </ListState>
        </FaPreviewStage>
      ) : (
        <FaPreviewSheet
          head={
            key
              ? {
                  kind: 'key',
                  label: PREVIEW_PAGE.answerKey,
                  title: PREVIEW_PAGE.keyTitle,
                  line: PREVIEW_PAGE.keyLine,
                }
              : {
                  kind: 'student',
                  label: PREVIEW_PAGE.asStudents,
                  title: assessmentName(assessment.name),
                  line: studentViewLine(
                    questionsAndMarks(count, total),
                    deadline === null ? null : deadlineWords(deadline),
                    assessment.version,
                  ),
                  ...(assessment.introduction ? { intro: assessment.introduction } : {}),
                }
          }
          questions={answer.questions.map((question, index) => {
            const entry = answer.answerKey.find((item) => item.questionId === question.id);
            const correct = entry?.correct ?? null;
            const written = question.body.type === 'written';
            const guidance = entry?.markingGuidance ?? null;
            return {
              key: question.id,
              head: questionHeading(index + 1, count, QUESTION_TYPE_WORDS[question.body.type]),
              marks: marksWords(question.marks),
              text: question.text,
              ...(written
                ? key
                  ? {}
                  : { writtenBox: PREVIEW_PAGE.writtenBox }
                : {
                    options: optionsOf(question).map((option) => ({
                      key: option.key,
                      text: option.words,
                      correct: key && option.key === correct,
                    })),
                    correctWord: PREVIEW_PAGE.correct,
                  }),
              ...(key && written && guidance
                ? { guidance: { label: FA_GUIDANCE_LABEL, text: guidance } }
                : {}),
              ...(key
                ? {
                    explanation: {
                      label: PREVIEW_PAGE.explanation,
                      text: question.explanation ?? PREVIEW_PAGE.noExplanation,
                    },
                  }
                : {}),
            };
          })}
        />
      )}
    </FaPreviewSurface>
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

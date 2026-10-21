'use client';

import type { ServiceError, ValidationFailed } from '@xr/contracts/draft';
import type { ExperimentId, Question, QuestionId } from '@xr/domain';
import {
  Button,
  ButtonLink,
  ErrorSummary,
  FaFormColumn,
  FaFormFoot,
  FaFormMessages,
  Notice,
} from '@xr/ui/v3';
import { type FormEvent, type ReactNode, useEffect, useRef, useState } from 'react';

import {
  QUESTION_EDITOR,
  savedUsedLine,
  savedVersionWords,
  usedNoticeTitle,
} from '@/copy/question-bank';
import { stateWords } from '@/copy/state-copy';
import { QUESTION_BANK_ADDRESS, questionBankAddress } from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import { facultySummaryTitle, type FormFieldError, formFieldErrors } from '@/queries/faculty-forms';
import { useCommand } from '@/queries/use-command';

import { noteRouteFocus } from '../../shared/workspace-frame/route-focus';
import { BANK_MESSAGE_ID } from '../fa-14-question-bank/question-bank';
import {
  EMPTY_QUESTION,
  QUESTION_FIELDS,
  type QuestionDraft,
  type QuestionField,
  QuestionFields,
  questionFieldTarget,
} from './question-fields';
import { withAdded } from './return-to';

export { EMPTY_QUESTION, type QuestionDraft };

/** A bank question's current version, as the form shows it again. */
export function draftOf(question: Question): QuestionDraft {
  const { body } = question;
  return {
    type: body.type,
    text: question.text,
    options:
      body.type === 'multiple-choice'
        ? {
            A: body.options.A ?? '',
            B: body.options.B ?? '',
            C: body.options.C ?? '',
            D: body.options.D ?? '',
          }
        : EMPTY_QUESTION.options,
    correctChoice: body.type === 'multiple-choice' ? body.correct : null,
    statement: body.type === 'true-false' ? (body.correct ? 'true' : 'false') : null,
    guidance: body.type === 'written' ? (body.markingGuidance ?? '') : '',
    marks: String(question.marks),
    explanation: question.explanation ?? '',
  };
}

/** The contract's `QuestionInput` (values as typed): only the chosen type's answer fields. */
function inputOf(experimentId: string, draft: QuestionDraft) {
  return {
    experimentId: experimentId as ExperimentId,
    type: draft.type,
    text: draft.text,
    options: draft.type === 'multiple-choice' ? { ...draft.options } : {},
    correct:
      draft.type === 'multiple-choice'
        ? draft.correctChoice
        : draft.type === 'true-false'
          ? draft.statement
          : null,
    marks: draft.marks,
    explanation: draft.explanation,
    markingGuidance: draft.type === 'written' ? draft.guidance : null,
  };
}

/** The form's ids' prefix: the summary is `qe-err`, the notice `qe-saved`. */
const PREFIX = 'qe';

function questionFieldErrors(error: ValidationFailed): FormFieldError<QuestionField>[] {
  return formFieldErrors(error, (path) =>
    QUESTION_FIELDS.has(path) ? (path as QuestionField) : null,
  );
}

/** How the page around the form learns of an answer it shows itself. */
export type FormOutcome = 'saved' | 'stale' | 'policy-open' | 'gone' | 'deleted';

interface FormNotice {
  readonly tone: 'ok' | 'err';
  readonly title: string;
  readonly line?: string;
}

/**
 * The FA-15 form (the export's form column): the three sections (`QuestionFields`), Cancel and
 * "Save question". Messages sit at its top (`div.fa-fmsg--stack`): the error summary "Check this
 * question" (which takes focus), the saved or failed notice (which takes focus), the conflict
 * warning and the used question's notice (`aboveFields`, from the page). The service checks the
 * values and answers the words (`FA-15.*` keys); typing in a field clears its error. Single correct
 * answer only, three types only, no automatic grading.
 */
export function QuestionForm({
  labelledBy,
  experimentId,
  initial,
  editing,
  returnTo,
  aboveFields,
  onOutcome,
}: {
  /** The form's name: the page's H1. */
  readonly labelledBy: string;
  readonly experimentId: string;
  readonly initial: QuestionDraft;
  /** The question being edited: its key, the revision read and the assessments that use it. */
  readonly editing: {
    readonly id: string;
    readonly rev: number;
    readonly usedNames: readonly string[];
  } | null;
  readonly returnTo: string | null;
  /** The page's own notices at the form's top (the conflict, the used question's notice). */
  readonly aboveFields?: ReactNode;
  readonly onOutcome: (outcome: FormOutcome) => void;
}) {
  const navigation = useAppNavigation();
  const [draft, setDraft] = useState<QuestionDraft>(initial);
  const [errors, setErrors] = useState<readonly FormFieldError<QuestionField>[]>([]);
  const [attempt, setAttempt] = useState(0);
  const [notice, setNotice] = useState<FormNotice | null>(null);
  const [focusNotice, setFocusNotice] = useState(0);
  const [rev, setRev] = useState(editing?.rev ?? 0);
  const noticeRef = useRef<HTMLDivElement>(null);
  const add = useCommand((ports) => ports.questionBank.addQuestion);
  const edit = useCommand((ports) => ports.questionBank.editQuestion);
  const busy = add.busy || edit.busy;
  const bankHref = questionBankAddress(experimentId);

  useEffect(() => {
    if (focusNotice > 0) noticeRef.current?.focus();
  }, [focusNotice]);

  const change = (patch: Partial<QuestionDraft>, ...fields: QuestionField[]) => {
    setDraft((current) => ({ ...current, ...patch }));
    if (fields.length > 0) {
      setErrors((current) => current.filter((error) => !fields.includes(error.field)));
    }
  };
  const say = (next: FormNotice) => {
    setNotice(next);
    setFocusNotice((current) => current + 1);
  };

  const refused = (error: ServiceError) => {
    switch (error.kind) {
      case 'validation-failed':
        setNotice(null);
        setErrors(questionFieldErrors(error));
        setAttempt((current) => current + 1);
        return;
      case 'stale-version':
        onOutcome('stale');
        return;
      case 'policy-open':
        onOutcome('policy-open');
        return;
      case 'invalid-state':
        onOutcome('deleted');
        return;
      case 'not-found':
      case 'not-permitted':
        onOutcome('gone');
        return;
      default:
        say({ tone: 'err', title: stateWords('FA-15.unavailable') });
    }
  };
  // Failed for now: every value stays and the page says it didn't save (`FA-15.unavailable`).
  const unavailable = () => say({ tone: 'err', title: stateWords('FA-15.unavailable') });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const input = inputOf(experimentId, draft);
    if (editing === null) {
      add.run(input).then((answer) => {
        if (!answer.ok) return refused(answer.error);
        const id = answer.value.id;
        if (returnTo) {
          navigation.navigate(withAdded(returnTo, id));
          return;
        }
        // Back to the bank, which says it was saved; focus lands on that message (`FA-14.added`).
        noteRouteFocus(QUESTION_BANK_ADDRESS, BANK_MESSAGE_ID);
        const query = new URLSearchParams({ experimentId, added: id });
        navigation.navigate(`${QUESTION_BANK_ADDRESS}?${query.toString()}`);
      }, unavailable);
      return;
    }
    edit.run({ ...input, id: editing.id as QuestionId, expectedRev: rev }).then((answer) => {
      if (!answer.ok) return refused(answer.error);
      setErrors([]);
      setRev(answer.value.question.rev);
      onOutcome('saved');
      if (returnTo) {
        navigation.navigate(returnTo);
        return;
      }
      // Every edit is a new version (`FA-15.saved-edit`); a used question's assessments keep theirs.
      say({
        tone: 'ok',
        title: savedVersionWords(answer.value.question.version),
        line: editing.usedNames.length > 0 ? savedUsedLine(editing.usedNames) : undefined,
      });
    }, unavailable);
  };

  const hasTop = errors.length > 0 || notice !== null || Boolean(aboveFields);
  return (
    <FaFormColumn as="form" labelledBy={labelledBy} onSubmit={submit}>
      {hasTop ? (
        <FaFormMessages stack>
          {errors.length > 0 ? (
            <ErrorSummary
              spaced
              key={attempt}
              id={`${PREFIX}-err`}
              title={facultySummaryTitle('FA-15', errors.length)}
              items={errors.map((error) => ({
                fieldId: questionFieldTarget(PREFIX, error.field, draft.type),
                summaryText: error.summaryText,
              }))}
            />
          ) : null}
          {notice ? (
            <Notice
              id={`${PREFIX}-saved`}
              ref={noticeRef}
              tone={notice.tone === 'ok' ? 'ok' : 'warn'}
              icon={notice.tone === 'ok' ? undefined : 'alertCircle'}
              role={notice.tone === 'ok' ? 'status' : 'alert'}
              title={notice.title}
            >
              {notice.line}
            </Notice>
          ) : null}
          {aboveFields}
        </FaFormMessages>
      ) : null}
      <QuestionFields prefix={PREFIX} values={draft} errors={errors} onChange={change} />
      <FaFormFoot
        start={<ButtonLink href={returnTo ?? bankHref}>{QUESTION_EDITOR.cancel}</ButtonLink>}
        end={
          <Button
            variant="primary"
            size="lg"
            type="submit"
            busy={busy}
            busyLabel={QUESTION_EDITOR.saving}
          >
            {QUESTION_EDITOR.save}
          </Button>
        }
      />
    </FaFormColumn>
  );
}

/** The used question's notice (`QE.used`): which assessments use it, and what saving changes. */
export function UsedNotice({ names }: { readonly names: readonly string[] }) {
  return (
    <Notice tone="info" icon="infoDisc" title={usedNoticeTitle(names)}>
      {names.length > 1 ? QUESTION_EDITOR.usedNoticeSeveral : QUESTION_EDITOR.usedNotice}
    </Notice>
  );
}

'use client';

import type { CreateOption, QuestionBankRow, ServiceError } from '@xr/contracts/draft';
import type { QuestionType } from '@xr/domain';
import {
  Button,
  ConfirmDialog,
  Field,
  Icon,
  Link,
  Notice,
  PageContent,
  PageHeader,
  SectionTabs,
  Select,
  Skeleton,
  TextInput,
} from '@xr/ui';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { QUESTION_TYPE_WORDS, QUESTION_TYPES } from '@/copy/assessment-words';
import { dayMonthYear } from '@/copy/dates';
import {
  addedMessage,
  bankMetaLine,
  DELETE_DIALOG,
  deletedMessage,
  deletedRowWords,
  deleteLabel,
  deleteTitle,
  deleteUsedCountWords,
  deleteUsedWords,
  editLabel,
  QUESTION_BANK,
  questionCount,
  usedWords,
} from '@/copy/question-bank';
import { BANK_TOOLS } from '@/copy/question-tools';
import { stateWords } from '@/copy/state-copy';
import {
  draftQuestionsAddress,
  draftsToReviewAddress,
  importQuestionsAddress,
  newQuestionAddress,
  QUESTION_BANK_TITLE,
  questionAddress,
  questionBankAddress,
  questionBankPlacement,
} from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import { useQuestionDrafts } from '@/queries/faculty-assessment-work';
import { useCreateOptions, useFacultyAssessments, useQuestionBank } from '@/queries/teaching';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { DraftsList } from '../fa-16-draft-questions/drafts-list';

/** The message slot's id (B4-07 `#Kb-msg`): FA-15 lands focus here after adding a question. */
export const BANK_MESSAGE_ID = 'qb-msg';

type TypeFilter = 'all' | QuestionType;

interface Message {
  readonly tone: 'ok' | 'err';
  readonly text: string;
}

interface DeletedRow {
  readonly id: string;
  readonly text: string;
  readonly at: string;
}

/**
 * FA-14 Question bank — board B4-07 f0, f1, f2, f7, f9, at `/faculty/question-bank`
 * (`?experimentId=`, `?tab=drafts`).
 *
 * - **Reads**: `AssessmentService.getCreateOptions` for the experiments the Faculty member teaches
 *   (name and platform code, the Experiment filter), `QuestionBankService.listQuestions` for the
 *   chosen experiment's questions (each with how many assessments use it), and
 *   `AssessmentService.listAssessments` for the names of the assessments a question is used in
 *   (the delete dialog). The experiment is the address's, else the first taught one; one outside
 *   the teaching scope is the in-shell not-found page (state-copy `FA-14.experiment`).
 * - **As B4-07 draws it**: the header (“Question bank”, “Questions for <experiment> · <code>”,
 *   “Add a question”, “Draft with assistance” → FA-16, “Import” → FA-17), the tabs “Questions ·
 *   Drafts to review <n>”, the Questions section with its count, the toolbar (Search questions,
 *   Experiment, Type), the table (Question + ID, “From a draft you reviewed” · Type · Marks · Used ·
 *   Added · Edit / Delete), the empty bank (f7, with “Import”) and labelled rows below 760 px of
 *   content (f9).
 * - **Drafts to review** (f1, `?tab=drafts`): the Faculty member's drafts for the experiment, with
 *   FA-16's review, add and discard (`DraftsList`; `FA-14.drafts-tab`).
 * - **Delete** (f2, DL-1, destructive: focus on Cancel): `QuestionBankService.deleteQuestion` with
 *   the revision read; the question leaves the list, its history is kept and assessments keep their
 *   copy. The drawn message takes focus and the “Deleted” list names it (`FA-14.deleted-list`).
 *   Refusals read the list again (`FA-14.delete-refused`, `FA-14.delete-policy-open`); a failure
 *   for now keeps the dialog open (`FA-14.delete-unavailable`).
 * - **States B4-07 does not draw**: loading, failed + Try again, no match, no experiment taught.
 */
export function QuestionBank() {
  useShellPage(questionBankPlacement());
  const navigation = useAppNavigation();
  const params = new URLSearchParams(navigation.search);
  const addressed = params.get('experimentId');
  const onDrafts = params.get('tab') === 'drafts';

  // The experiment lives here while the page is on show; the address mirrors it (replaced, no
  // history entry). An address that differs came from outside (Back): it is read again.
  const [chosen, setChosen] = useState<string | null>(addressed);
  const [seenSearch, setSeenSearch] = useState(navigation.search);
  if (navigation.search !== seenSearch) {
    setSeenSearch(navigation.search);
    setChosen(addressed);
  }

  // FA-15 returns here with `added=<ID>` after adding a question (`FA-14.added`): the message is
  // shown once the question is in the list, and the address drops the parameter.
  const [addedId] = useState(() => params.get('added'));
  const dropAdded = useRef(addedId !== null);
  useEffect(() => {
    if (!dropAdded.current) return;
    dropAdded.current = false;
    navigation.replace(questionBankAddress(addressed ?? undefined));
  }, [navigation, addressed]);

  const options = useCreateOptions();
  const taught = options.data?.ok ? options.data.value : null;
  const optionsFailed = options.isError || (options.data !== undefined && !options.data.ok);
  const experimentId = chosen ?? taught?.[0]?.experimentId ?? null;
  const experiment = taught?.find((entry) => entry.experimentId === experimentId) ?? null;
  const drafts = useQuestionDrafts(experiment?.experimentId ?? null);
  if (taught && chosen !== null && experiment === null) return navigation.notFound();
  const draftCount = drafts.data?.ok ? drafts.data.value.length : undefined;

  const choose = (next: string) => {
    setChosen(next);
    navigation.replace(questionBankAddress(next));
  };

  let body;
  if (optionsFailed) {
    body = (
      <BankSection count="">
        <LoadFailed onRetry={() => void options.refetch()} />
      </BankSection>
    );
  } else if (taught === null) {
    body = (
      <BankSection count="">
        <LoadingRows />
      </BankSection>
    );
  } else if (experiment === null) {
    body = <NoExperiment />;
  } else if (onDrafts) {
    body = (
      <DraftsList
        key={experiment.experimentId}
        place="bank"
        experimentId={experiment.experimentId}
      />
    );
  } else {
    body = (
      <BankList
        key={experiment.experimentId}
        experiment={experiment}
        taught={taught}
        onExperiment={choose}
        addedId={addedId}
      />
    );
  }

  return (
    <PageContent wrap="wide">
      <PageHeader
        title={QUESTION_BANK_TITLE}
        meta={
          experiment ? (
            <span className="xl-meta">{bankMetaLine(experiment.name, experiment.courseCode)}</span>
          ) : null
        }
        actions={
          experiment ? (
            <>
              <Link
                className="xr-btn xr-btn--primary"
                href={newQuestionAddress({ experimentId: experiment.experimentId })}
              >
                <Icon name="add" />
                {QUESTION_BANK.addQuestion}
              </Link>
              <Link
                className="xr-btn xr-btn--secondary"
                href={draftQuestionsAddress(experiment.experimentId)}
              >
                <Icon name="assist" />
                {BANK_TOOLS.draftWithAssistance}
              </Link>
              <Link
                className="xr-btn xr-btn--secondary"
                href={importQuestionsAddress(experiment.experimentId)}
              >
                <Icon name="readyToPublish" />
                {BANK_TOOLS.import}
              </Link>
            </>
          ) : null
        }
      />
      {experiment ? (
        <SectionTabs
          label={BANK_TOOLS.tabsLabel}
          tabs={[
            {
              href: questionBankAddress(experiment.experimentId),
              label: BANK_TOOLS.questionsTab,
              current: !onDrafts,
            },
            {
              href: draftsToReviewAddress(experiment.experimentId),
              label: BANK_TOOLS.draftsTab,
              count: draftCount,
              current: onDrafts,
            },
          ]}
        />
      ) : null}
      {body}
    </PageContent>
  );
}

/** The Questions section (`section.xr-section` with its H2 and the count in a polite status). */
function BankSection({
  count,
  children,
}: {
  readonly count: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="xr-section" aria-labelledby="qb-qh">
      <div className="xr-section-head">
        <h2 id="qb-qh" className="xr-h2">
          {QUESTION_BANK.sectionTitle}
        </h2>
        <span className="xr-meta" role="status">
          {count}
        </span>
      </div>
      {children}
    </section>
  );
}

/** One experiment's questions: the toolbar, the message slot, the table and the Deleted list. */
function BankList({
  experiment,
  taught,
  onExperiment,
  addedId,
}: {
  readonly experiment: CreateOption;
  readonly taught: readonly CreateOption[];
  readonly onExperiment: (experimentId: string) => void;
  readonly addedId: string | null;
}) {
  const navigation = useAppNavigation();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [message, setMessage] = useState<Message | null>(null);
  const [focusMessage, setFocusMessage] = useState(0);
  const [deleted, setDeleted] = useState<readonly DeletedRow[]>([]);
  const [target, setTarget] = useState<QuestionBankRow | null>(null);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  const bank = useQuestionBank(experiment.experimentId);
  const all = bank.data?.ok && !bank.isPlaceholderData ? bank.data.value : null;
  const assessments = useFacultyAssessments(all?.some((row) => row.usedIn > 0) ?? false);
  const remove = useCommand((ports) => ports.questionBank.deleteQuestion);

  useEffect(() => {
    if (focusMessage > 0) messageRef.current?.focus();
  }, [focusMessage]);

  // An experiment outside the teaching scope (or unknown) is not found (`FA-14.experiment`).
  if (bank.data && !bank.data.ok && bank.data.error.kind === 'not-permitted') {
    return navigation.notFound();
  }
  const failed = bank.isError || (bank.data !== undefined && !bank.data.ok);

  const query = search.trim().toLowerCase();
  const rows =
    all?.filter(
      (row) =>
        (query === '' || `${row.question.text} ${row.question.id}`.toLowerCase().includes(query)) &&
        (type === 'all' || row.question.body.type === type),
    ) ?? [];
  const shown =
    message ??
    (addedId && all?.some((row) => row.question.id === addedId)
      ? { tone: 'ok' as const, text: addedMessage(addedId) }
      : null);

  const usedNames = (questionId: string): readonly string[] | null => {
    const list = assessments.data?.ok ? assessments.data.value : null;
    if (!list) return null;
    return list
      .filter((row) => row.assessment.questions.some((ref) => ref.questionId === questionId))
      .map((row) => row.assessment.name || row.assessment.id);
  };

  const say = (next: Message) => {
    setMessage(next);
    setFocusMessage((current) => current + 1);
  };

  const refused = (error: ServiceError) => {
    setTarget(null);
    void bank.refetch();
    say({
      tone: 'err',
      text:
        error.kind === 'policy-open'
          ? stateWords('FA-14.delete-policy-open')
          : stateWords('FA-14.delete-refused'),
    });
  };

  const confirmDelete = () => {
    if (!target || remove.busy) return;
    const row = target;
    setDeleteFailed(false);
    remove.run({ id: row.question.id, expectedRev: row.question.rev }).then(
      (answer) => {
        if (!answer.ok) {
          refused(answer.error);
          return;
        }
        setDeleted((current) => [
          ...current,
          {
            id: answer.value.id,
            text: answer.value.text,
            at: answer.value.deleted?.at ?? answer.value.updatedAt,
          },
        ]);
        setTarget(null);
        say({ tone: 'ok', text: deletedMessage(answer.value.id) });
      },
      // Failed for now: the dialog stays open and says so (`FA-14.delete-unavailable`).
      () => setDeleteFailed(true),
    );
  };

  const filtered = query !== '' || type !== 'all';
  const clearFilters = () => {
    setSearch('');
    setType('all');
  };

  let list;
  if (failed) {
    list = <LoadFailed onRetry={() => void bank.refetch()} />;
  } else if (all === null) {
    list = <LoadingRows />;
  } else if (all.length === 0) {
    list = <EmptyBank experimentId={experiment.experimentId} />;
  } else if (rows.length === 0) {
    list = (
      <div className="xr-section-body">
        <p className="xr-body m-0 text-ink-2">
          {QUESTION_BANK.noMatch}{' '}
          {filtered ? (
            <Button variant="text" className="min-h-8" onClick={clearFilters}>
              {stateWords('FA-14.clear-filters')}
            </Button>
          ) : null}
        </p>
      </div>
    );
  } else {
    list = <QuestionTable rows={rows} experimentName={experiment.name} onDelete={setTarget} />;
  }

  const targetNames = target && target.usedIn > 0 ? usedNames(target.question.id) : null;

  return (
    <BankSection count={all === null || failed ? '' : questionCount(rows.length)}>
      <div className="xr-toolbar px-6 pb-3">
        <Field id="qb-q" label={QUESTION_BANK.search} className="xr-toolbar-search">
          <TextInput
            type="search"
            placeholder={QUESTION_BANK.searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </Field>
        <Field id="qb-e" label={QUESTION_BANK.experiment}>
          <Select
            value={experiment.experimentId}
            onChange={(event) => onExperiment(event.target.value)}
            options={taught.map((entry) => ({ value: entry.experimentId, label: entry.name }))}
          />
        </Field>
        <Field id="qb-t" label={QUESTION_BANK.type} className="xr-filter-2">
          <Select
            value={type}
            onChange={(event) => setType(event.target.value as TypeFilter)}
            options={[
              { value: 'all', label: QUESTION_BANK.allTypes },
              ...QUESTION_TYPES.map((value) => ({ value, label: QUESTION_TYPE_WORDS[value] })),
            ]}
          />
        </Field>
      </div>
      <div id={BANK_MESSAGE_ID} ref={messageRef} tabIndex={-1}>
        {shown ? (
          <p
            className={`xa-save ${shown.tone === 'ok' ? 'is-ok' : 'is-err'} mx-6 mb-3`}
            role="status"
          >
            <Icon name={shown.tone === 'ok' ? 'done' : 'failed'} />
            {shown.text}
          </p>
        ) : null}
      </div>
      {list}
      {deleted.length > 0 ? (
        <div className="xr-section-body pt-4">
          <h3 className="xr-h3 mb-2">{QUESTION_BANK.deletedTitle}</h3>
          <ul className="m-0 pl-5 text-ink-2">
            {deleted.map((row) => (
              <li key={row.id}>
                <span className="xr-id">{row.id}</span>{' '}
                {deletedRowWords(row.text, dayMonthYear(row.at))}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <ConfirmDialog
        open={target !== null}
        idPrefix="qb-del"
        align="start"
        destructive
        title={target ? deleteTitle(target.question.id) : ''}
        effect={DELETE_DIALOG.effect}
        notice={
          <>
            {target && target.usedIn > 0 ? (
              <UsedLine names={targetNames} count={target.usedIn} />
            ) : null}
            {deleteFailed ? (
              <Notice tone="err" role="alert">
                {stateWords('FA-14.delete-unavailable')}
              </Notice>
            ) : null}
          </>
        }
        cancelLabel={DELETE_DIALOG.cancel}
        confirmLabel={DELETE_DIALOG.confirm}
        busy={remove.busy}
        busyLabel={stateWords('FA-14.delete-busy')}
        onConfirm={confirmDelete}
        onCancel={() => {
          setTarget(null);
          setDeleteFailed(false);
        }}
        returnFocusFallback={messageRef}
      />
    </BankSection>
  );
}

/** f2: “**It is used in <assessment>.** That assessment keeps its copy, …”. */
function UsedLine({
  names,
  count,
}: {
  readonly names: readonly string[] | null;
  readonly count: number;
}) {
  const words = names && names.length > 0 ? deleteUsedWords(names) : deleteUsedCountWords(count);
  return (
    <p className="mt-2">
      <strong>{words.strong}</strong>
      {words.rest}
    </p>
  );
}

/** The table (f0) — labelled rows below 760 px of content (f9). */
function QuestionTable({
  rows,
  experimentName,
  onDelete,
}: {
  readonly rows: readonly QuestionBankRow[];
  readonly experimentName: string;
  readonly onDelete: (row: QuestionBankRow) => void;
}) {
  const { columns } = QUESTION_BANK;
  return (
    <div className="xr-table-wrap">
      <table className="xr-table">
        <caption className="xr-sr">{bankMetaLine(experimentName, null)}</caption>
        <thead>
          <tr>
            <th scope="col">{columns.question}</th>
            <th scope="col">{columns.type}</th>
            <th scope="col">{columns.marks}</th>
            <th scope="col">{columns.used}</th>
            <th scope="col">{columns.added}</th>
            <th scope="col">
              <span className="xr-sr">{columns.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.question.id}>
              <td>
                <strong className="text-ink">{row.question.text}</strong>
                <span className="xa-qrow-meta mt-1">
                  <span className="xr-id">{row.question.id}</span>
                  {row.question.origin === 'reviewed-draft' ? (
                    <span className="xa-tag">{BANK_TOOLS.fromDraft}</span>
                  ) : null}
                </span>
              </td>
              <td>
                <span className="xa-tag">{QUESTION_TYPE_WORDS[row.question.body.type]}</span>
              </td>
              <td className="xl-num">{row.question.marks}</td>
              <td>{usedWords(row.usedIn)}</td>
              <td>{dayMonthYear(row.question.addedAt)}</td>
              <td>
                <div className="xw-actions flex-nowrap">
                  <Link
                    className="xr-btn xr-btn--secondary xr-btn--sm"
                    href={questionAddress(row.question.id)}
                    aria-label={editLabel(row.question.id)}
                  >
                    {QUESTION_BANK.edit}
                  </Link>
                  <Button
                    variant="text"
                    className="min-h-9 text-err"
                    aria-label={deleteLabel(row.question.id)}
                    onClick={() => onDelete(row)}
                  >
                    {QUESTION_BANK.delete}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** f7 “Your question bank is empty” with “Add a question” and “Import”. */
function EmptyBank({ experimentId }: { readonly experimentId: string }) {
  return (
    <div className="xr-section-body">
      <div className="xr-empty">
        <span className="xr-empty-icon">
          <Icon name="questionBank" />
        </span>
        <h3 className="xr-h3 m-0">{QUESTION_BANK.emptyTitle}</h3>
        <p className="xr-body m-0 text-ink-2">{BANK_TOOLS.emptyLine}</p>
        <div className="flex flex-wrap gap-3">
          <Link className="xr-btn xr-btn--primary" href={newQuestionAddress({ experimentId })}>
            {QUESTION_BANK.addQuestion}
          </Link>
          <Link className="xr-btn xr-btn--secondary" href={importQuestionsAddress(experimentId)}>
            {BANK_TOOLS.import}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Undrawn: no experiment taught yet (`FA-14.no-experiment`). */
export function NoExperiment() {
  return (
    <div className="xr-section">
      <div className="xr-empty">
        <span className="xr-empty-icon">
          <Icon name="questionBank" />
        </span>
        <h2 className="xr-h3 m-0">{stateWords('FA-14.no-experiment')}</h2>
        <p className="xr-body m-0 text-ink-2">{stateWords('FA-14.no-experiment.line')}</p>
      </div>
    </div>
  );
}

/** Undrawn: loading (`FA-14.loading`), B4-02 f4’s skeleton rows. */
function LoadingRows() {
  return (
    <div className="xr-table-wrap" aria-busy="true">
      <span className="xr-sr" role="status">
        {stateWords('FA-14.loading')}
      </span>
      {[0, 1, 2, 3].map((row) => (
        <div
          key={row}
          aria-hidden="true"
          className="grid grid-cols-[1.6fr_1fr_80px_1fr_1fr] gap-5 px-4 py-[18px] [border-block-start:1px_solid_var(--xr-line)]"
        >
          {[0, 1, 2, 3, 4].map((cell) => (
            <Skeleton key={cell} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Undrawn: failed + Try again (`FA-14.failed`), B4-02 f5’s formula in the section body. */
function LoadFailed({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div className="xr-section-body">
      <div className="xr-empty">
        <span className="xr-empty-icon bg-err-bg text-err">
          <Icon name="failed" />
        </span>
        <h3 className="xr-h3 m-0">{stateWords('FA-14.failed')}</h3>
        <p className="xr-body m-0 text-ink-2">{stateWords('FA-14.failed.line')}</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" icon="tryAgain" onClick={onRetry}>
            {stateWords('FA-14.try-again')}
          </Button>
        </div>
      </div>
    </div>
  );
}

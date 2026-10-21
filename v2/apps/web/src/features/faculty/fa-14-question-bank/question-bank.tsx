'use client';

import type { CreateOption, QuestionBankRow, ServiceError } from '@xr/contracts/draft';
import type { QuestionType } from '@xr/domain';
import {
  Button,
  ButtonLink,
  ConfirmDialog,
  FaBankDeleted,
  FaBankPhoneOnly,
  FaCellActions,
  FaCellLine,
  FaCellName,
  FaFilters,
  FaId,
  FaMessageCard,
  FaQuestionMarks,
  FaQuestionMeta,
  FaQuestionText,
  FaQuiet,
  FaRecordTabs,
  FaSearchField,
  FaSelectField,
  FaStatusLine,
  FaTable,
  FaTableBar,
  FaTag,
  FaToolbar,
  Hint,
  ListState,
  LoadingRows,
  Notice,
  PageHead,
  Surface,
} from '@xr/ui/v3';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { QUESTION_TYPE_WORDS, QUESTION_TYPES } from '@/copy/assessment-words';
import { dayMonthYear } from '@/copy/dates';
import { assessmentName } from '@/copy/fa-shared';
import {
  ADDED_MESSAGE,
  addedOnWords,
  bankLead,
  DELETE_DIALOG,
  DELETED_MESSAGE,
  deletedLine,
  deletedRowWords,
  deleteLabel,
  deleteUsedWords,
  editLabel,
  marksWords,
  QUESTION_BANK,
  questionCount,
  removeFilterLabel,
  searchChipWords,
  typeChipWords,
  typeSplitWords,
  usedWords,
  versionWords,
} from '@/copy/question-bank';
import { BANK_TOOLS } from '@/copy/question-tools';
import { stateWords } from '@/copy/state-copy';
import {
  draftQuestionsAddress,
  draftsToReviewAddress,
  FACULTY_HELP_ADDRESS,
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
import { useBankTodayLine } from './today-line';

/** The message's id (the export's `#fa-msg`): FA-15 lands focus here after adding a question. */
export const BANK_MESSAGE_ID = 'qb-msg';

/** The Questions tab's heading (`h2#fa-tabh`): the section's name and a focus target. */
const QUESTIONS_HEADING_ID = 'qb-qh';

type TypeFilter = 'all' | QuestionType;

interface Message {
  readonly tone: 'ok' | 'err';
  readonly title: string;
  readonly line?: string;
}

interface DeletedRow {
  readonly id: string;
  readonly text: string;
  readonly at: string;
}

/**
 * FA-14 Question bank — the V3 export's bank (FA-v1 `Main.dc.html` "FA-14 Question bank"), at
 * `/faculty/question-bank` (`?experimentId=`, `?tab=drafts`).
 *
 * - **Reads**: `AssessmentService.getCreateOptions` for the experiments the Faculty member teaches
 *   (name and course code; the Experiment filter when there is more than one),
 *   `QuestionBankService.listQuestions` for the chosen experiment's questions (each with how many
 *   assessments use it), `QuestionBankService.listDrafts` for the Drafts tab's count, and
 *   `AssessmentService.listAssessments` for the names of the assessments a question is used in.
 *   The experiment is the address's, else the first taught one; one outside the teaching scope is
 *   the in-shell not-found page (state-copy `FA-14.experiment`).
 * - **As the export draws it**: the head (“Question bank”, “Your questions for <experiment> ·
 *   <code>. …”, “Add a question”, “Draft with assistance” → FA-16, “Import” → FA-17), the record
 *   tabs “Questions · Drafts to review” with their counts, the Questions section (its type split,
 *   Search “Words in the question”, Type, the count and chips), the table (the question with its
 *   type tag and version, “From a draft you reviewed” · Marks · Used in · Added · Edit / Delete,
 *   each named by the question's words — never its reference), no match, the empty bank and the
 *   no-course card.
 * - **Drafts to review** (`?tab=drafts`): the Faculty member's drafts for the experiment as review
 *   cards beside “How review works”, with FA-16's review, add and discard (`DraftsList`).
 * - **Delete** (“Delete this question?”, focus on Cancel): `QuestionBankService.deleteQuestion`
 *   with the revision read; the question leaves the list, its history is kept and assessments keep
 *   their copy. The drawn message takes focus and the “Deleted” box names it
 *   (`FA-14.deleted-list`). Refusals read the list again (`FA-14.delete-refused`,
 *   `FA-14.delete-policy-open`); a failure for now keeps the dialog open
 *   (`FA-14.delete-unavailable`).
 * - **States the export does not draw**: loading and failed + Try again (V3 list states).
 */
export function QuestionBank() {
  useShellPage(questionBankPlacement());
  const today = useBankTodayLine();
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

  // FA-15 returns here with `added=<key>` after adding a question (`FA-14.added`): the message is
  // shown once the question is in the list, and the address drops the parameter — after the move
  // that brought the page here has settled (a replace during it can be lost), and again while the
  // address still holds it.
  const [addedId] = useState(() => params.get('added'));
  const addressHasAdded = params.has('added');
  useEffect(() => {
    if (!addressHasAdded) return undefined;
    const timer = window.setTimeout(() => {
      navigation.replace(questionBankAddress(addressed ?? undefined));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [addressHasAdded, navigation, addressed]);

  const options = useCreateOptions();
  const taught = options.data?.ok ? options.data.value : null;
  const optionsFailed = options.isError || (options.data !== undefined && !options.data.ok);
  const experimentId = chosen ?? taught?.[0]?.experimentId ?? null;
  const experiment = taught?.find((entry) => entry.experimentId === experimentId) ?? null;
  const drafts = useQuestionDrafts(experiment?.experimentId ?? null);
  const bank = useQuestionBank(experiment?.experimentId ?? null);
  if (taught && chosen !== null && experiment === null) return navigation.notFound();
  const draftCount = drafts.data?.ok ? drafts.data.value.length : undefined;
  const questionTotal =
    bank.data?.ok && !bank.isPlaceholderData ? bank.data.value.length : undefined;

  const choose = (next: string) => {
    setChosen(next);
    navigation.replace(questionBankAddress(next));
  };

  let body: ReactNode;
  if (optionsFailed) {
    body = (
      <QuestionsSurface>
        <LoadFailed onRetry={() => void options.refetch()} />
      </QuestionsSurface>
    );
  } else if (taught === null) {
    body = (
      <QuestionsSurface>
        <LoadingRows message={stateWords('FA-14.loading')} />
      </QuestionsSurface>
    );
  } else if (experiment === null) {
    body = <BankNoCourse />;
  } else {
    body = (
      <FaRecordTabs
        label={BANK_TOOLS.tabsLabel}
        tabs={[
          {
            key: 'questions',
            href: questionBankAddress(experiment.experimentId),
            label: BANK_TOOLS.questionsTab,
            count: questionTotal,
            current: !onDrafts,
          },
          {
            key: 'drafts',
            href: draftsToReviewAddress(experiment.experimentId),
            label: BANK_TOOLS.draftsTab,
            count: draftCount,
            current: onDrafts,
          },
        ]}
      >
        {onDrafts ? (
          <DraftsList
            key={experiment.experimentId}
            place="bank"
            experimentId={experiment.experimentId}
          />
        ) : (
          <BankList
            key={experiment.experimentId}
            experiment={experiment}
            taught={taught}
            onExperiment={choose}
            addedId={addedId}
          />
        )}
      </FaRecordTabs>
    );
  }

  return (
    <>
      <PageHead
        date={today}
        title={QUESTION_BANK_TITLE}
        titleFocusTarget
        lead={
          experiment
            ? bankLead(experiment.name, experiment.courseCode)
            : taught !== null
              ? QUESTION_BANK.noCourseLead
              : undefined
        }
        actions={
          experiment ? (
            <>
              <ButtonLink
                variant="primary"
                size="lg"
                icon="add"
                iconSize={20}
                href={newQuestionAddress({ experimentId: experiment.experimentId })}
              >
                {QUESTION_BANK.addQuestion}
              </ButtonLink>
              <ButtonLink size="lg" href={draftQuestionsAddress(experiment.experimentId)}>
                {BANK_TOOLS.draftWithAssistance}
              </ButtonLink>
              <ButtonLink
                variant="ghost"
                size="lg"
                icon="upload"
                iconSize={20}
                href={importQuestionsAddress(experiment.experimentId)}
              >
                {BANK_TOOLS.import}
              </ButtonLink>
            </>
          ) : null
        }
      />
      {body}
    </>
  );
}

/** The Questions section while the taught experiments load or fail (heading only, no tools). */
function QuestionsSurface({ children }: { readonly children: ReactNode }) {
  return (
    <Surface labelledBy={QUESTIONS_HEADING_ID}>
      <FaToolbar>
        <FaTableBar title={QUESTION_BANK.sectionTitle} titleId={QUESTIONS_HEADING_ID} focusable />
      </FaToolbar>
      {children}
    </Surface>
  );
}

/**
 * No experiment taught yet (`QB.noCourse`): “Your question bank opens with your first course”,
 * with Help & support — no head actions, no tabs. FA-15 shows it in place of its form.
 */
export function BankNoCourse() {
  return (
    <FaMessageCard
      icon="stack"
      title={QUESTION_BANK.noCourseTitle}
      titleId="qb-none"
      actions={<ButtonLink href={FACULTY_HELP_ADDRESS}>{QUESTION_BANK.help}</ButtonLink>}
    >
      {QUESTION_BANK.noCourseLine}
    </FaMessageCard>
  );
}

/** The assessments that use each question, by name (one read: the Faculty member's assessments). */
function useUsedNames(enabled: boolean): (questionId: string) => readonly string[] | null {
  const assessments = useFacultyAssessments(enabled);
  const list = assessments.data?.ok ? assessments.data.value : null;
  return (questionId) =>
    list
      ? list
          .filter((row) => row.assessment.questions.some((ref) => ref.questionId === questionId))
          .map((row) => assessmentName(row.assessment.name))
      : null;
}

/** One experiment's questions: the toolbar, the message, the table and the Deleted box. */
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
  const addedFocused = useRef(false);
  const [deleted, setDeleted] = useState<readonly DeletedRow[]>([]);
  const [target, setTarget] = useState<QuestionBankRow | null>(null);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const bank = useQuestionBank(experiment.experimentId);
  const all = bank.data?.ok && !bank.isPlaceholderData ? bank.data.value : null;
  const usedNames = useUsedNames(all?.some((row) => row.usedIn > 0) ?? false);
  const remove = useCommand((ports) => ports.questionBank.deleteQuestion);

  const addedShown =
    message === null &&
    addedId !== null &&
    (all?.some((row) => row.question.id === addedId) ?? false);
  const shown: Message | null =
    message ??
    (addedShown ? { tone: 'ok', title: ADDED_MESSAGE.title, line: ADDED_MESSAGE.line } : null);

  useEffect(() => {
    if (focusMessage > 0) messageRef.current?.focus();
  }, [focusMessage]);
  // Back from FA-15 with the question in the list: its message takes focus once (`FA-14.added`).
  useEffect(() => {
    if (!addedShown || addedFocused.current) return;
    addedFocused.current = true;
    messageRef.current?.focus();
  }, [addedShown]);

  // An experiment outside the teaching scope (or unknown) is not found (`FA-14.experiment`).
  if (bank.data && !bank.data.ok && bank.data.error.kind === 'not-permitted') {
    return navigation.notFound();
  }
  const failed = bank.isError || (bank.data !== undefined && !bank.data.ok);

  const query = search.trim().toLowerCase();
  // The search reads the question's words and its stored key, which is never shown (`FA-14.filters`).
  const rows =
    all?.filter(
      (row) =>
        (query === '' || `${row.question.text} ${row.question.id}`.toLowerCase().includes(query)) &&
        (type === 'all' || row.question.body.type === type),
    ) ?? [];
  const filtered = query !== '' || type !== 'all';

  const say = (next: Message) => {
    setMessage(next);
    setFocusMessage((current) => current + 1);
  };

  const refused = (error: ServiceError) => {
    setTarget(null);
    void bank.refetch();
    say({
      tone: 'err',
      title:
        error.kind === 'policy-open'
          ? stateWords('FA-14.delete-policy-open')
          : stateWords('FA-14.delete-refused'),
    });
  };

  const confirmDelete = () => {
    if (!target || remove.busy) return;
    const row = target;
    const names = row.usedIn > 0 ? usedNames(row.question.id) : null;
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
        say({ tone: 'ok', title: DELETED_MESSAGE, line: deletedLine(names) });
      },
      // Failed for now: the dialog stays open and says so (`FA-14.delete-unavailable`).
      () => setDeleteFailed(true),
    );
  };

  const clearFilters = () => {
    setSearch('');
    setType('all');
  };

  const typeOptions = [
    { value: 'all', label: QUESTION_BANK.allTypes },
    ...QUESTION_TYPES.map((value) => ({ value, label: QUESTION_TYPE_WORDS[value] })),
  ];
  const chips = [
    ...(query !== ''
      ? [
          {
            key: 'search',
            label: searchChipWords(search.trim()),
            onRemove: () => setSearch(''),
            focusId: 'qb-q',
          },
        ]
      : []),
    ...(type !== 'all'
      ? [
          {
            key: 'type',
            label: typeChipWords(QUESTION_TYPE_WORDS[type]),
            onRemove: () => setType('all'),
            focusId: 'qb-t',
          },
        ]
      : []),
  ];

  const hasAny = all !== null && all.length > 0;
  let list: ReactNode;
  if (failed) {
    list = <LoadFailed onRetry={() => void bank.refetch()} />;
  } else if (all === null) {
    list = <LoadingRows message={stateWords('FA-14.loading')} />;
  } else if (all.length === 0) {
    list = (
      <ListState kind="empty" roomy icon="stack" title={QUESTION_BANK.emptyTitle}>
        {BANK_TOOLS.emptyLine}
      </ListState>
    );
  } else if (rows.length === 0) {
    list = (
      <ListState
        kind="nomatch"
        title={QUESTION_BANK.noMatchTitle}
        action={<Button onClick={clearFilters}>{QUESTION_BANK.clearFilters}</Button>}
      >
        {QUESTION_BANK.noMatchLine}
      </ListState>
    );
  } else {
    list = <QuestionTable rows={rows} usedNames={usedNames} onDelete={setTarget} />;
  }

  const targetNames = target && target.usedIn > 0 ? usedNames(target.question.id) : null;

  return (
    <Surface labelledBy={QUESTIONS_HEADING_ID}>
      <FaToolbar>
        <FaTableBar
          title={QUESTION_BANK.sectionTitle}
          titleId={QUESTIONS_HEADING_ID}
          titleRef={headingRef}
        >
          {hasAny ? <Hint>{typeSplitWords(splitOf(all))}</Hint> : null}
        </FaTableBar>
        {hasAny ? (
          <>
            <FaFilters label={QUESTION_BANK.filterLabel}>
              <FaSearchField
                id="qb-q"
                label={QUESTION_BANK.search}
                placeholder={QUESTION_BANK.searchPlaceholder}
                value={search}
                onChange={setSearch}
              />
              {taught.length > 1 ? (
                <FaSelectField
                  id="qb-e"
                  label={QUESTION_BANK.experiment}
                  value={experiment.experimentId}
                  options={taught.map((entry) => ({
                    value: entry.experimentId,
                    label: entry.name,
                  }))}
                  onChange={onExperiment}
                />
              ) : null}
              <FaSelectField
                id="qb-t"
                label={QUESTION_BANK.type}
                value={type}
                options={typeOptions}
                onChange={(value) => setType(value as TypeFilter)}
              />
            </FaFilters>
            <FaStatusLine
              count={filtered ? questionCount(all.length, rows.length) : questionCount(all.length)}
              chips={chips}
              removeLabel={(chip) => removeFilterLabel(chip.label)}
              clearLabel={QUESTION_BANK.clearFilters}
              onClearFilters={clearFilters}
              clearFocusId="qb-q"
            />
          </>
        ) : null}
        {shown ? (
          <Notice
            id={BANK_MESSAGE_ID}
            ref={messageRef}
            tone={shown.tone === 'ok' ? 'ok' : 'warn'}
            icon={shown.tone === 'ok' ? undefined : 'alertCircle'}
            role="status"
            title={shown.title}
          >
            {shown.line}
          </Notice>
        ) : null}
      </FaToolbar>
      {list}
      {deleted.length > 0 ? (
        <FaBankDeleted
          titleId="qb-delh"
          title={QUESTION_BANK.deletedTitle}
          items={deleted.map((row) => ({
            key: row.id,
            text: deletedRowWords(row.text, dayMonthYear(row.at)),
          }))}
        />
      ) : null}
      <ConfirmDialog
        open={target !== null}
        idPrefix="qb-del"
        initialFocus="cancel"
        title={DELETE_DIALOG.title}
        description={target ? target.question.text : ''}
        groups={[
          {
            kind: 'now',
            title: DELETE_DIALOG.effectsTitle,
            items: [
              DELETE_DIALOG.leaves,
              DELETE_DIALOG.history,
              ...(target && target.usedIn > 0 ? [deleteUsedWords(targetNames, target.usedIn)] : []),
            ],
          },
        ]}
        cancelLabel={DELETE_DIALOG.cancel}
        confirmLabel={DELETE_DIALOG.confirm}
        busy={remove.busy}
        busyLabel={stateWords('FA-14.delete-busy')}
        onConfirm={confirmDelete}
        onCancel={() => {
          setTarget(null);
          setDeleteFailed(false);
        }}
        returnFocusFallback={headingRef}
      >
        {deleteFailed ? (
          <Notice
            tone="warn"
            icon="alertCircle"
            role="alert"
            title={stateWords('FA-14.delete-unavailable')}
          />
        ) : null}
      </ConfirmDialog>
    </Surface>
  );
}

/** How many questions of each type the bank holds (`QB.split`). */
function splitOf(rows: readonly QuestionBankRow[]) {
  const count = (type: QuestionType) =>
    rows.filter((row) => row.question.body.type === type).length;
  return {
    multipleChoice: count('multiple-choice'),
    trueFalse: count('true-false'),
    written: count('written'),
  };
}

/** The questions (the export's `fa-btable`), each named by its words. */
function QuestionTable({
  rows,
  usedNames,
  onDelete,
}: {
  readonly rows: readonly QuestionBankRow[];
  readonly usedNames: (questionId: string) => readonly string[] | null;
  readonly onDelete: (row: QuestionBankRow) => void;
}) {
  const { columns } = QUESTION_BANK;
  return (
    <FaTable
      kind="bank"
      caption={QUESTION_BANK.caption}
      columns={[
        { key: 'question', header: columns.question, width: 'q' },
        { key: 'marks', header: columns.marks, desktopOnly: true },
        { key: 'used', header: columns.used, width: 'used' },
        { key: 'added', header: columns.added, desktopOnly: true },
        { key: 'actions', header: columns.actions, hidden: true },
      ]}
      rows={rows.map((row) => {
        const { question } = row;
        const marks = marksWords(question.marks);
        const added = dayMonthYear(question.addedAt);
        return {
          key: question.id,
          static: true,
          cells: [
            {
              key: 'question',
              main: true,
              wide: true,
              children: (
                <>
                  <FaQuestionText inCell>{question.text}</FaQuestionText>
                  <FaQuestionMeta
                    inCell
                    type={QUESTION_TYPE_WORDS[question.body.type]}
                    written={question.body.type === 'written'}
                  >
                    {question.version > 1 ? <FaId>{versionWords(question.version)}</FaId> : null}
                    <FaQuestionMarks phoneOnly>{marks}</FaQuestionMarks>
                    <FaBankPhoneOnly>{addedOnWords(added)}</FaBankPhoneOnly>
                  </FaQuestionMeta>
                  {question.origin === 'reviewed-draft' ? (
                    <FaCellLine apart>
                      <FaTag checked>{BANK_TOOLS.fromDraft}</FaTag>
                    </FaCellLine>
                  ) : null}
                </>
              ),
            },
            {
              key: 'marks',
              nowrap: true,
              desktopOnly: true,
              children: <FaQuestionMarks>{marks}</FaQuestionMarks>,
            },
            {
              key: 'used',
              wide: true,
              inline: true,
              label: columns.used,
              children:
                row.usedIn > 0 ? (
                  <FaCellName>{usedWords(row.usedIn, usedNames(question.id))}</FaCellName>
                ) : (
                  <FaQuiet inline>{QUESTION_BANK.notUsed}</FaQuiet>
                ),
            },
            { key: 'added', nowrap: true, desktopOnly: true, children: added },
            {
              key: 'actions',
              nowrap: true,
              wide: true,
              children: (
                <FaCellActions>
                  <ButtonLink
                    href={questionAddress(question.id)}
                    icon="pencil"
                    iconSize={20}
                    aria-label={editLabel(question.text)}
                  >
                    {QUESTION_BANK.edit}
                  </ButtonLink>
                  <Button
                    variant="ghost"
                    id={`qb-del-${question.id}`}
                    aria-label={deleteLabel(question.text)}
                    onClick={() => onDelete(row)}
                  >
                    {QUESTION_BANK.delete}
                  </Button>
                </FaCellActions>
              ),
            },
          ],
        };
      })}
    />
  );
}

/** Undrawn: failed + Try again (`FA-14.failed`), the V3 failed list state. */
function LoadFailed({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <ListState
      kind="failed"
      title={stateWords('FA-14.failed')}
      action={<Button onClick={onRetry}>{stateWords('FA-14.try-again')}</Button>}
    >
      {stateWords('FA-14.failed.line')}
    </ListState>
  );
}

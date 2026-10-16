'use client';

import type { ExperimentId, QuestionImportReport } from '@xr/domain';
import {
  BackLink,
  Button,
  FailedState,
  Icon,
  Link,
  LoadingState,
  Notice,
  PageContent,
  PageHeader,
  StatusPill,
  Stepper,
} from '@xr/ui';
import {
  type ChangeEvent,
  type ReactNode,
  type Ref,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react';

import {
  errorCountWords,
  IMPORT_CONFIRM_LINE,
  IMPORT_QUESTIONS,
  importedLine,
  importFileRefusalWords,
  importQuestionsButton,
  importQuietLine,
  importStepWords,
  MAX_QUESTION_FILE_BYTES,
  noExplanationWords,
  QUESTION_CHOOSER_WORDS,
  QUESTION_TEMPLATE_DOWNLOAD,
  QUESTION_TEMPLATE_LINE,
  questionsWords,
  readyCountWords,
  rowsWords,
  warningCountWords,
} from '@/copy/question-tools';
import { stateWords } from '@/copy/state-copy';
import { questionBankAddress, questionToolPlacement } from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import { useCreateOptions } from '@/queries/teaching';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { NoExperiment } from '../fa-14-question-bank/question-bank';
import {
  importReducer,
  type ImportState,
  problemLines,
  QUESTION_TEMPLATE_COLUMNS,
  reportCounts,
  START,
} from './import-view';

/** The ids B4-08 focuses (`Ii-h`, `Ii-choose`) and the chooser's description. */
const IDS = {
  title: 'qimport-title',
  choose: 'qimport-choose',
  input: 'qimport-file',
  status: 'qimport-file-status',
  error: 'qimport-file-e',
} as const;

type FocusTarget = 'title' | 'choose';

/**
 * FA-17 Import questions — board B4-08 f5 … f9, at `/faculty/question-bank/import`
 * (`?experimentId=`).
 *
 * - **The experiment** is the address's, else the first one taught (`getCreateOptions`): its bank
 *   receives the questions (`FA-17.experiment`). Unknown or out of scope → the in-shell not-found.
 * - **Three steps in the page**, then the result. The heading names the step ("Step 1 of 3" ·
 *   "Choose a file") and takes focus on every change, as B4-08 `focus(pid + '-h')` does.
 * - **Step 1 · Choose a file** (f5, f9): the template (its ten columns and the `data:` download)
 *   and a real file chooser — the file is read as text in the browser (up to 1 MB) and nothing is
 *   uploaded. "Check file" sends its name and text to `QuestionBankService.previewQuestionImport`,
 *   a check that writes nothing; its file refusals show under the chooser, which takes focus.
 * - **Step 2 · Check rows** (f6): the counts, and each row problem in words — "Error — blocks
 *   import" or "Warning" (an empty explanation). Any error blocks the whole import (the interim
 *   T-24 all-or-nothing, `FA-17.commit-mode`): "Choose the corrected file" returns to step 1.
 * - **Step 3 · Confirm import** (f7): "Import N questions" sends `commitQuestionImport` once; the
 *   questions go into the bank only, never into an assessment.
 * - **Result** (f8): "Import finished", the new IDs, "Open question bank", "Import another file".
 */
export function ImportQuestions() {
  useShellPage(questionToolPlacement('FA-17', IMPORT_QUESTIONS.title));
  const navigation = useAppNavigation();
  const addressed = new URLSearchParams(navigation.search).get('experimentId');
  const options = useCreateOptions();
  const [state, dispatch] = useReducer(importReducer, START);
  const [focus, setFocus] = useState<{ readonly target: FocusTarget; readonly count: number }>({
    target: 'title',
    count: 0,
  });
  const titleRef = useRef<HTMLHeadingElement>(null);
  const chooseRef = useRef<HTMLButtonElement>(null);
  const preview = useCommand((ports) => ports.questionBank.previewQuestionImport);
  const commit = useCommand((ports) => ports.questionBank.commitQuestionImport);

  useEffect(() => {
    if (focus.count === 0) return;
    (focus.target === 'title' ? titleRef.current : chooseRef.current)?.focus();
  }, [focus]);
  const focusOn = (target: FocusTarget) =>
    setFocus((current) => ({ target, count: current.count + 1 }));

  const taught = options.data?.ok ? options.data.value : null;
  const experiment = taught
    ? ((addressed ? taught.find((entry) => entry.experimentId === addressed) : taught[0]) ?? null)
    : null;
  if (taught && addressed && experiment === null) return navigation.notFound();
  const optionsFailed = options.isError || (options.data !== undefined && !options.data.ok);
  const bankHref = questionBankAddress(experiment?.experimentId);

  const onChosen = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    // Cleared, so choosing the same file again (corrected on disk) is read again.
    input.value = '';
    if (!file) return;
    if (file.size > MAX_QUESTION_FILE_BYTES) {
      dispatch({ type: 'unreadable', words: QUESTION_CHOOSER_WORDS.tooLarge });
      return;
    }
    file.text().then(
      (text) => dispatch({ type: 'chosen', file: { name: file.name, text } }),
      () => dispatch({ type: 'unreadable', words: QUESTION_CHOOSER_WORDS.unreadable }),
    );
  };

  const checked = (report: QuestionImportReport) => {
    dispatch({ type: 'checked', report });
    focusOn('title');
  };

  const check = (file: { readonly name: string; readonly text: string } | null, again: boolean) => {
    if (experiment === null || preview.busy) return;
    preview
      .run({
        experimentId: experiment.experimentId as ExperimentId,
        fileName: file?.name ?? '',
        csvText: file?.text ?? '',
      })
      .then(
        (answer) => {
          if (answer.ok) {
            checked(answer.value);
            return;
          }
          if (answer.error.kind === 'not-found' || answer.error.kind === 'not-permitted') {
            if (again) stale();
            return;
          }
          const words =
            answer.error.kind === 'validation-failed' ? importFileRefusalWords(answer.error) : null;
          if (words === null) {
            if (again) stale();
            return;
          }
          dispatch({ type: 'check-refused', words });
          focusOn('choose');
        },
        // Failed for now: nothing changes (state-copy `FA-17.unavailable`).
        () => undefined,
      );
  };

  const stale = () => {
    dispatch({ type: 'stale', words: QUESTION_CHOOSER_WORDS.stale });
    focusOn('title');
  };

  const onImport = () => {
    const report = state.report;
    if (report === null || commit.busy || preview.busy) return;
    commit.run({ batchId: report.batchId }).then(
      (answer) => {
        if (answer.ok) {
          dispatch({ type: 'imported', added: answer.value.added });
          focusOn('title');
          return;
        }
        const error = answer.error;
        // The file changed meaning since the check: check the same file again and show it now.
        if (error.kind === 'validation-failed') check(state.file, true);
        else stale();
      },
      () => undefined,
    );
  };

  const restart = () => {
    dispatch({ type: 'restart' });
    preview.reset();
    commit.reset();
    focusOn('title');
  };

  const done = state.done;
  const title = done ? IMPORT_QUESTIONS.importedTitle : IMPORT_QUESTIONS.steps[state.step - 1]!;
  const overline = done ? IMPORT_QUESTIONS.title : importStepWords(state.step);

  let body: ReactNode;
  if (optionsFailed) {
    body = (
      <FailedState title={stateWords('FA-17.failed')} onRetry={() => void options.refetch()}>
        {stateWords('FA-14.failed.line')}
      </FailedState>
    );
  } else if (taught === null) {
    body = <LoadingState label={stateWords('FA-17.loading')} surface="section" />;
  } else if (experiment === null) {
    body = <NoExperiment />;
  } else if (done) {
    body = <ResultStep added={done} bankHref={bankHref} onRestart={restart} />;
  } else {
    body = (
      <>
        <Stepper
          label={IMPORT_QUESTIONS.title}
          steps={IMPORT_QUESTIONS.steps}
          current={state.step}
          doneWords={false}
          className="mb-6"
        />
        {state.step === 1 ? (
          <ChooseStep
            state={state}
            busy={preview.busy}
            experimentName={experiment.name}
            cancelHref={bankHref}
            chooseRef={chooseRef}
            onChosen={onChosen}
            onCheck={() => check(state.file, false)}
          />
        ) : state.report === null ? null : state.step === 2 ? (
          <CheckStep
            report={state.report}
            onBack={() => {
              dispatch({ type: 'back' });
              focusOn('title');
            }}
            onChooseFixed={() => {
              dispatch({ type: 'choose-fixed' });
              preview.reset();
              focusOn('choose');
            }}
            onContinue={() => {
              dispatch({ type: 'continue' });
              focusOn('title');
            }}
          />
        ) : (
          <ConfirmStep
            report={state.report}
            busy={commit.busy || preview.busy}
            onBack={() => {
              dispatch({ type: 'back' });
              focusOn('title');
            }}
            onImport={onImport}
          />
        )}
      </>
    );
  }

  return (
    <PageContent wrap="read">
      <PageHeader
        className="mt-2 mb-4"
        back={<BackLink href={bankHref}>{IMPORT_QUESTIONS.back}</BackLink>}
        overline={overline}
        title={title}
        titleId={IDS.title}
        titleFocusTarget
        titleRef={titleRef}
      />
      {body}
    </PageContent>
  );
}

/** The step's footer (`xw-flow-foot`): the way back first, the step's action last. */
function FlowFoot({
  start,
  children,
}: {
  readonly start: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className="xw-flow-foot">
      {start}
      <div className="xw-actions">{children}</div>
    </div>
  );
}

// ---- Step 1 · Choose a file (B4-08 f5, f9) ----

function ChooseStep({
  state,
  busy,
  experimentName,
  cancelHref,
  chooseRef,
  onChosen,
  onCheck,
}: {
  readonly state: ImportState;
  readonly busy: boolean;
  readonly experimentName: string;
  readonly cancelHref: string;
  readonly chooseRef: Ref<HTMLButtonElement>;
  readonly onChosen: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onCheck: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="xr-section flex flex-col gap-[18px] p-6">
      <div>
        <h2 className="xr-h3 m-0 mb-1.5">{IMPORT_QUESTIONS.templateHeading}</h2>
        <p className="xr-body m-0 mb-2.5 text-ink-2">
          {QUESTION_TEMPLATE_LINE.map((run, index) =>
            typeof run === 'string' ? run : <strong key={index}>{run.column}</strong>,
          )}
        </p>
        <ul className="xw-cols" aria-label={IMPORT_QUESTIONS.columnsLabel}>
          {QUESTION_TEMPLATE_COLUMNS.map((column) => (
            <li key={column}>{column}</li>
          ))}
        </ul>
        <p className="m-0 mt-3">
          <a
            className="inline-flex items-center gap-1.5 font-[600]"
            href={QUESTION_TEMPLATE_DOWNLOAD.href}
            download={QUESTION_TEMPLATE_DOWNLOAD.fileName}
          >
            <Icon name="download" />
            {IMPORT_QUESTIONS.download}
          </a>
        </p>
      </div>
      <div className="xw-file">
        {state.file ? (
          <span className="xw-file-name" id={IDS.status}>
            <Icon name="fileText" />
            {state.file.name}
          </span>
        ) : (
          <span className="xr-meta" id={IDS.status}>
            {IMPORT_QUESTIONS.noFile}
          </span>
        )}
        <Button
          ref={chooseRef}
          id={IDS.choose}
          variant="secondary"
          size="sm"
          icon="readyToPublish"
          aria-describedby={state.fileError ? `${IDS.status} ${IDS.error}` : IDS.status}
          onClick={() => inputRef.current?.click()}
        >
          {IMPORT_QUESTIONS.choose}
        </Button>
        {/* The browser's own chooser, opened by the drawn button (state-copy FA-17.chooser). */}
        <input
          ref={inputRef}
          id={IDS.input}
          className="xr-sr"
          type="file"
          accept=".csv,text/csv"
          tabIndex={-1}
          aria-hidden="true"
          aria-labelledby={IDS.choose}
          onChange={onChosen}
        />
      </div>
      {state.fileError ? (
        <span className="xw-ferr" role="alert" id={IDS.error}>
          <Icon name="failed" />
          {state.fileError}
        </span>
      ) : null}
      <p className="xr-meta m-0">{importQuietLine(experimentName)}</p>
      <FlowFoot
        start={
          <Link className="xr-btn xr-btn--text" href={cancelHref}>
            {IMPORT_QUESTIONS.cancel}
          </Link>
        }
      >
        <Button
          variant="primary"
          busy={busy}
          busyLabel={IMPORT_QUESTIONS.checking}
          onClick={onCheck}
        >
          {IMPORT_QUESTIONS.check}
        </Button>
      </FlowFoot>
    </div>
  );
}

// ---- Step 2 · Check rows (B4-08 f6) ----

function CheckStep({
  report,
  onBack,
  onChooseFixed,
  onContinue,
}: {
  readonly report: QuestionImportReport;
  readonly onBack: () => void;
  readonly onChooseFixed: () => void;
  readonly onContinue: () => void;
}) {
  const counts = reportCounts(report);
  const lines = problemLines(report);
  const columns = IMPORT_QUESTIONS.tableColumns;
  return (
    <div className="xr-section flex flex-col gap-[18px] p-6">
      <p className="xw-file-name m-0">
        <Icon name="fileText" />
        {report.fileName}
      </p>
      <div className="xw-counts" role="status">
        <span className="xw-tag">{rowsWords(counts.rows)}</span>
        <span className="xw-tag">
          <Icon name="done" />
          {readyCountWords(counts.ready)}
        </span>
        {counts.errors > 0 ? (
          // B4-08 draws the error count tag inline (no class): v46 err tokens, PF-13's border.
          <span className="xw-tag border-[var(--xr-x-err-line)] bg-err-bg text-err">
            <Icon name="failed" />
            {errorCountWords(counts.errors)}
          </span>
        ) : null}
        {counts.warnings > 0 ? (
          <span className="xw-tag xw-tag--warn">
            <Icon name="warning" />
            {warningCountWords(counts.warnings)}
          </span>
        ) : null}
      </div>
      {counts.errors > 0 ? (
        <Notice tone="err" role="status" title={IMPORT_QUESTIONS.blockedTitle}>
          {IMPORT_QUESTIONS.blockedLine}
        </Notice>
      ) : null}
      {lines.length > 0 ? (
        <div className="xr-table-wrap">
          <table className="xr-table">
            <caption className="xr-sr">{IMPORT_QUESTIONS.tableCaption}</caption>
            <thead>
              <tr>
                <th scope="col">{columns.row}</th>
                <th scope="col">{columns.question}</th>
                <th scope="col">{columns.fix}</th>
                <th scope="col">{columns.type}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.key}>
                  <td className="xr-num" data-label={columns.row}>
                    {line.row}
                  </td>
                  <td data-label={columns.question}>{line.question}</td>
                  <td data-label={columns.fix}>{line.words}</td>
                  <td data-label={columns.type}>
                    {line.severity === 'error' ? (
                      <StatusPill tone="err">{IMPORT_QUESTIONS.errorType}</StatusPill>
                    ) : (
                      <StatusPill tone="wait">{IMPORT_QUESTIONS.warningType}</StatusPill>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <FlowFoot
        start={
          <Button variant="text" onClick={onBack}>
            {IMPORT_QUESTIONS.backStep}
          </Button>
        }
      >
        {counts.errors > 0 ? (
          <Button variant="primary" icon="readyToPublish" onClick={onChooseFixed}>
            {IMPORT_QUESTIONS.chooseFixed}
          </Button>
        ) : (
          <Button variant="primary" onClick={onContinue}>
            {IMPORT_QUESTIONS.continue}
          </Button>
        )}
      </FlowFoot>
    </div>
  );
}

// ---- Step 3 · Confirm import (B4-08 f7) ----

function ConfirmStep({
  report,
  busy,
  onBack,
  onImport,
}: {
  readonly report: QuestionImportReport;
  readonly busy: boolean;
  readonly onBack: () => void;
  readonly onImport: () => void;
}) {
  const counts = reportCounts(report);
  const noExplanation = noExplanationWords(counts.noExplanation);
  return (
    <div className="xr-section flex flex-col gap-[18px] p-6">
      <p className="xr-lead m-0">
        <strong className="text-ink">{questionsWords(counts.ready)}</strong>
        {IMPORT_CONFIRM_LINE.middle}
        <strong className="text-ink">{report.fileName}</strong>
        {IMPORT_CONFIRM_LINE.end}
      </p>
      <ul className="m-0 flex flex-col gap-1.5 pl-5 text-[15px] leading-[22px] text-ink-2">
        <li>{IMPORT_QUESTIONS.notInAssessment}</li>
        {noExplanation ? <li>{noExplanation}</li> : null}
      </ul>
      <FlowFoot
        start={
          <Button variant="text" onClick={onBack}>
            {IMPORT_QUESTIONS.backStep}
          </Button>
        }
      >
        <Button
          variant="primary"
          busy={busy}
          busyLabel={IMPORT_QUESTIONS.importing}
          onClick={onImport}
        >
          {importQuestionsButton(counts.ready)}
        </Button>
      </FlowFoot>
    </div>
  );
}

// ---- Result (B4-08 f8) ----

function ResultStep({
  added,
  bankHref,
  onRestart,
}: {
  readonly added: readonly string[];
  readonly bankHref: string;
  readonly onRestart: () => void;
}) {
  return (
    <div className="xw-stack">
      <Notice tone="ok" title={IMPORT_QUESTIONS.finished}>
        {importedLine(added)}
      </Notice>
      <div className="xw-actions">
        <Link className="xr-btn xr-btn--primary" href={bankHref}>
          {IMPORT_QUESTIONS.openBank}
        </Link>
        <Button variant="text" onClick={onRestart}>
          {IMPORT_QUESTIONS.again}
        </Button>
      </div>
    </div>
  );
}

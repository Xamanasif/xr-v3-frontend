'use client';

import type { ServiceError, StudentImportReport } from '@xr/contracts/draft';
import {
  BackLink,
  Button,
  Icon,
  Link,
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
  addedNamesWords,
  CHOOSER_WORDS,
  CONFIRM_LINE,
  fileRefusalWords,
  IMPORT_STUDENTS,
  importButtonWords,
  importedLine,
  importedTitle,
  importStepCount,
  MAX_FILE_BYTES,
  readyWords,
  rowsCheckedWords,
  rowsWithErrorsWords,
  studentsWords,
  TEMPLATE_DOWNLOAD,
  TEMPLATE_LINE,
} from '@/copy/import-students';
import { giveAccessAddress, PEOPLE_ADDRESS, underPlacement } from '@/nav/institute';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { PausedNotice, useInstitutionPaused } from '../ia-06-people/paused';
import {
  type ImportedResult,
  importReducer,
  type ImportState,
  problemLines,
  rowsWithErrors,
  START,
  TEMPLATE_COLUMNS,
} from './import-view';

/** The ids B2-07 focuses (`Ii-h`, `Ii-choose`) and the chooser's description. */
const IDS = {
  title: 'import-title',
  choose: 'import-choose',
  input: 'import-file',
  status: 'import-file-status',
  error: 'import-file-e',
} as const;

type FocusTarget = 'title' | 'choose';

/**
 * IA-11 Import students — board B2-07 f5 … f10, at `/institute/people/import`.
 *
 * - **Three steps in the page** (Appendix A rule S3: not in the address), then the result. The
 *   heading names the step ("Step 1 of 3" · "Choose a file") and takes focus on every change, as
 *   B2-07 `focus(pid + '-h')` does.
 * - **Step 1 · Choose a file**: the template (its six required columns and the `data:` download the
 *   handoff marks as intentional) and a real file chooser — the drawn "Choose a CSV file" opens the
 *   browser's own; the file is read as text in the browser (up to 1 MB) and nothing is uploaded.
 *   "Check file" sends its name and text to `PeopleService.previewStudentImport`, a check that
 *   writes nothing; its file refusals ("Choose a CSV file first", the columns, no rows) show under
 *   the chooser, which takes focus.
 * - **Step 2 · Check rows**: the service's counts and every problem in words ("Error — blocks
 *   import"). Any error blocks the whole import — the interim T-24 all-or-nothing, not a final
 *   policy (state-copy `IA-11.commit-mode`); "Choose the corrected file" goes back to step 1 with no
 *   file chosen. No warning is defined, so none is drawn.
 * - **Step 3 · Confirm import**: "Import N students" sends `commitStudentImport` once. Its receipt
 *   refreshes People; the result names who was added and offers "Give students access" (IA-05),
 *   "View students" and "Import another file". No invitation or e-mail is sent (T-11).
 * - **Refusals**: the records changed since the check → the same file is checked again and step 2
 *   shows what is wrong now; the check no longer current → step 1; failed for now → nothing
 *   changes. Paused → read-only: the paused notice instead of the flow.
 */
export function ImportStudents() {
  useShellPage(underPlacement('IA-11', IMPORT_STUDENTS.title));
  const sessionPaused = useInstitutionPaused();
  const [refusedPaused, setRefusedPaused] = useState(false);
  const paused = sessionPaused || refusedPaused;
  const [state, dispatch] = useReducer(importReducer, START);
  const [focus, setFocus] = useState<{ readonly target: FocusTarget; readonly count: number }>({
    target: 'title',
    count: 0,
  });
  const titleRef = useRef<HTMLHeadingElement>(null);
  const chooseRef = useRef<HTMLButtonElement>(null);
  const preview = useCommand((ports) => ports.people.previewStudentImport);
  const commit = useCommand((ports) => ports.people.commitStudentImport);

  useEffect(() => {
    if (focus.count === 0) return;
    (focus.target === 'title' ? titleRef.current : chooseRef.current)?.focus();
  }, [focus]);
  const focusOn = (target: FocusTarget) =>
    setFocus((current) => ({ target, count: current.count + 1 }));

  /** A write refused while paused: the page turns read-only (state-copy `IA-11.paused`). */
  const pausedBy = (error: ServiceError): boolean => {
    if (error.kind !== 'refused' || error.code !== 'institution-paused') return false;
    setRefusedPaused(true);
    focusOn('title');
    return true;
  };

  const onChosen = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    // Cleared, so choosing the same file again (corrected on disk) is read again.
    input.value = '';
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      dispatch({ type: 'unreadable', words: CHOOSER_WORDS.tooLarge });
      return;
    }
    file.text().then(
      (text) => dispatch({ type: 'chosen', file: { name: file.name, text } }),
      () => dispatch({ type: 'unreadable', words: CHOOSER_WORDS.unreadable }),
    );
  };

  const checked = (report: StudentImportReport) => {
    dispatch({ type: 'checked', report });
    focusOn('title');
  };

  const onCheck = () => {
    if (preview.busy) return;
    preview.run({ fileName: state.file?.name ?? '', csvText: state.file?.text ?? '' }).then(
      (answer) => {
        if (answer.ok) {
          checked(answer.value);
          return;
        }
        if (pausedBy(answer.error)) return;
        const words =
          answer.error.kind === 'validation-failed' ? fileRefusalWords(answer.error) : null;
        if (words === null) return;
        dispatch({ type: 'check-refused', words });
        focusOn('choose');
      },
      // Failed for now: nothing changes (state-copy `IA-11.unavailable`).
      () => undefined,
    );
  };

  const stale = () => {
    dispatch({ type: 'stale', words: CHOOSER_WORDS.stale });
    focusOn('title');
  };

  /** People changed since the check: the same file again, and step 2 shows it as it is now. */
  const checkAgain = () => {
    const file = state.file;
    if (file === null) {
      stale();
      return;
    }
    preview.run({ fileName: file.name, csvText: file.text }).then(
      (answer) => {
        if (answer.ok) checked(answer.value);
        else if (!pausedBy(answer.error)) stale();
      },
      () => undefined,
    );
  };

  const onImport = () => {
    const report = state.report;
    if (report === null || commit.busy || preview.busy) return;
    commit.run({ batchId: report.batchId }).then(
      (answer) => {
        if (answer.ok) {
          dispatch({
            type: 'imported',
            result: {
              added: answer.value.added,
              names: answer.value.students.map((student) => student.fullName),
              fileName: report.fileName,
            },
          });
          focusOn('title');
          return;
        }
        const error = answer.error;
        if (pausedBy(error)) return;
        if (error.kind === 'validation-failed') checkAgain();
        else if (error.kind === 'not-found' || error.kind === 'invalid-state') stale();
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
  const title = paused
    ? IMPORT_STUDENTS.title
    : done
      ? importedTitle(done.added)
      : IMPORT_STUDENTS.steps[state.step - 1]!;
  const overline = paused ? null : done ? IMPORT_STUDENTS.title : importStepCount(state.step);

  let body: ReactNode = null;
  if (paused) body = <PausedNotice />;
  else if (done) body = <ResultStep done={done} onRestart={restart} />;
  else
    body = (
      <>
        <Stepper
          label={IMPORT_STUDENTS.title}
          steps={IMPORT_STUDENTS.steps}
          current={state.step}
          doneWords={false}
          className="mb-6"
        />
        {state.step === 1 ? (
          <ChooseStep
            state={state}
            busy={preview.busy}
            chooseRef={chooseRef}
            onChosen={onChosen}
            onCheck={onCheck}
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

  return (
    <PageContent wrap="read">
      <PageHeader
        className="mt-2 mb-4"
        back={<BackLink href={PEOPLE_ADDRESS}>{IMPORT_STUDENTS.back}</BackLink>}
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

// ---- Step 1 · Choose a file (B2-07 f5) ----

function ChooseStep({
  state,
  busy,
  chooseRef,
  onChosen,
  onCheck,
}: {
  readonly state: ImportState;
  readonly busy: boolean;
  readonly chooseRef: Ref<HTMLButtonElement>;
  readonly onChosen: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onCheck: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="xr-section flex flex-col gap-[18px] p-6">
      <div>
        <h2 className="xr-h3 m-0 mb-1.5">{IMPORT_STUDENTS.templateHeading}</h2>
        <p className="xr-body m-0 mb-2.5 text-ink-2">
          {TEMPLATE_LINE.map((run, index) =>
            typeof run === 'string' ? (
              run
            ) : (
              <strong key={index}>
                {'strong' in run ? run.strong : TEMPLATE_COLUMNS[run.column]}
              </strong>
            ),
          )}
        </p>
        <ul className="xw-cols" aria-label={IMPORT_STUDENTS.columnsLabel}>
          {TEMPLATE_COLUMNS.map((column) => (
            <li key={column}>{column}</li>
          ))}
        </ul>
        <p className="m-0 mt-3">
          <a
            className="inline-flex items-center gap-1.5 font-[600]"
            href={TEMPLATE_DOWNLOAD.href}
            download={TEMPLATE_DOWNLOAD.fileName}
          >
            <Icon name="download" />
            {IMPORT_STUDENTS.download}
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
            {IMPORT_STUDENTS.noFile}
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
          {IMPORT_STUDENTS.choose}
        </Button>
        {/* The browser's own chooser, opened by the drawn button (state-copy IA-11.chooser). */}
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
      <p className="xr-meta m-0">{IMPORT_STUDENTS.quietLine}</p>
      <FlowFoot
        start={
          <Link className="xr-btn xr-btn--text" href={PEOPLE_ADDRESS}>
            {IMPORT_STUDENTS.cancel}
          </Link>
        }
      >
        <Button
          variant="primary"
          busy={busy}
          busyLabel={IMPORT_STUDENTS.checking}
          onClick={onCheck}
        >
          {IMPORT_STUDENTS.check}
        </Button>
      </FlowFoot>
    </div>
  );
}

// ---- Step 2 · Check rows (B2-07 f6, f7, f10) ----

function CheckStep({
  report,
  onBack,
  onChooseFixed,
  onContinue,
}: {
  readonly report: StudentImportReport;
  readonly onBack: () => void;
  readonly onChooseFixed: () => void;
  readonly onContinue: () => void;
}) {
  const errors = rowsWithErrors(report);
  const columns = IMPORT_STUDENTS.tableColumns;
  return (
    <div className="xr-section flex flex-col gap-[18px] p-6">
      <p className="xw-file-name m-0">
        <Icon name="fileText" />
        {report.fileName}
      </p>
      <div className="xw-counts" role="status">
        <span className="xw-tag">{rowsCheckedWords(report.rowsChecked)}</span>
        <span className="xw-tag">
          <Icon name="done" />
          {readyWords(report.readyToImport)}
        </span>
        {errors > 0 ? (
          // B2-07 draws the error count tag inline (no class): v46 err tokens, PF-13's border.
          <span className="xw-tag border-[var(--xr-x-err-line)] bg-err-bg text-err">
            <Icon name="failed" />
            {rowsWithErrorsWords(errors)}
          </span>
        ) : null}
      </div>
      {errors > 0 ? (
        <Notice tone="err" role="status" title={IMPORT_STUDENTS.blockedTitle}>
          {IMPORT_STUDENTS.blockedLine}
        </Notice>
      ) : null}
      <div className="xr-table-wrap">
        <table className="xr-table">
          <caption className="xr-sr">{IMPORT_STUDENTS.tableCaption}</caption>
          <thead>
            <tr>
              <th scope="col">{columns.row}</th>
              <th scope="col">{columns.student}</th>
              <th scope="col">{columns.fix}</th>
              <th scope="col">{columns.type}</th>
            </tr>
          </thead>
          <tbody>
            {problemLines(report).map((line) => (
              <tr key={line.key} className="is-error">
                <td className="xr-num" data-label={columns.row}>
                  {line.row}
                </td>
                <td data-label={columns.student}>
                  {line.name}
                  {line.studentId ? <span className="xr-sub xr-id">{line.studentId}</span> : null}
                </td>
                <td data-label={columns.fix}>{line.words}</td>
                <td data-label={columns.type}>
                  <StatusPill tone="err">{IMPORT_STUDENTS.errorType}</StatusPill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <FlowFoot
        start={
          <Button variant="text" onClick={onBack}>
            {IMPORT_STUDENTS.backStep}
          </Button>
        }
      >
        {errors > 0 ? (
          <Button variant="primary" icon="readyToPublish" onClick={onChooseFixed}>
            {IMPORT_STUDENTS.chooseFixed}
          </Button>
        ) : (
          <Button variant="primary" onClick={onContinue}>
            {IMPORT_STUDENTS.continue}
          </Button>
        )}
      </FlowFoot>
    </div>
  );
}

// ---- Step 3 · Confirm import (B2-07 f8) ----

function ConfirmStep({
  report,
  busy,
  onBack,
  onImport,
}: {
  readonly report: StudentImportReport;
  readonly busy: boolean;
  readonly onBack: () => void;
  readonly onImport: () => void;
}) {
  return (
    <div className="xr-section flex flex-col gap-[18px] p-6">
      <p className="xr-lead m-0">
        <strong className="text-ink">{studentsWords(report.readyToImport)}</strong>
        {CONFIRM_LINE.middle}
        <strong className="text-ink">{report.fileName}</strong>
        {CONFIRM_LINE.end}
      </p>
      <ul className="m-0 flex flex-col gap-1.5 pl-5 text-[15px] leading-[22px] text-ink-2">
        {IMPORT_STUDENTS.confirmPoints.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <FlowFoot
        start={
          <Button variant="text" onClick={onBack}>
            {IMPORT_STUDENTS.backStep}
          </Button>
        }
      >
        <Button
          variant="primary"
          busy={busy}
          busyLabel={IMPORT_STUDENTS.importing}
          onClick={onImport}
        >
          {importButtonWords(report.readyToImport)}
        </Button>
      </FlowFoot>
    </div>
  );
}

// ---- Result (B2-07 f9) ----

function ResultStep({
  done,
  onRestart,
}: {
  readonly done: ImportedResult;
  readonly onRestart: () => void;
}) {
  return (
    <div className="xw-stack">
      <Notice tone="ok" title={IMPORT_STUDENTS.finished}>
        {importedLine(done.added, done.fileName)}
      </Notice>
      <div className="xr-section flex flex-col gap-3.5 p-6">
        <h2 className="xr-h3 m-0">{IMPORT_STUDENTS.added}</h2>
        <p className="xr-body m-0 text-ink-2">{addedNamesWords(done.names)}</p>
        <div className="xw-actions">
          <Link className="xr-btn xr-btn--primary" href={giveAccessAddress()}>
            {IMPORT_STUDENTS.giveAccess}
          </Link>
          <Link className="xr-btn xr-btn--secondary" href={PEOPLE_ADDRESS}>
            {IMPORT_STUDENTS.viewStudents}
          </Link>
          <Button variant="text" onClick={onRestart}>
            {IMPORT_STUDENTS.again}
          </Button>
        </div>
      </div>
    </div>
  );
}

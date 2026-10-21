'use client';

import type { ServiceError, StudentImportReport } from '@xr/contracts/draft';
import {
  Breadcrumbs,
  Button,
  ButtonLink,
  Hint,
  IaActions,
  IaBusyButton,
  IaFileChooser,
  IaImportAdded,
  IaImportChecked,
  IaImportFailed,
  IaImportLead,
  IaImportProblems,
  IaImportSurface,
  IaImportTemplate,
  IaLines,
  IaMessageCard,
  IaStack,
  IaSteps,
  Notice,
  PageHead,
  StatusPill,
  TextLink,
} from '@xr/ui/v3';
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
  ADD_PERSON_V3,
  attentionCaption,
  backToWords,
  checkSummaryWords,
  cleanLine,
  IMPORT_V3,
  rowNumberWords,
  templateCodeExample,
  templateLine,
  willAddLine,
} from '@/copy/ia-people';
import {
  addedNamesWords,
  CHOOSER_WORDS,
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
} from '@/copy/import-students';
import { stateWords } from '@/copy/state-copy';
import {
  giveAccessAddress,
  INSTITUTE_HELP_ADDRESS,
  PEOPLE_ADDRESS,
  underPlacement,
} from '@/nav/institute';
import { useCourseCodeList } from '@/queries/institute-records';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { useInstitutionPaused } from '../shared/paused';
import { useInstituteTodayLine } from '../shared/use-today-line';
import {
  type ImportedResult,
  importReducer,
  type ImportState,
  problemLines,
  rowsWithErrors,
  START,
  TEMPLATE_COLUMNS,
} from './import-view';

/** The ids the page focuses (the H1, the chooser, the failure) and the chooser's parts. */
const IDS = {
  title: 'ia-h1',
  choose: 'import-choose',
  input: 'import-file',
  label: 'import-file-l',
  status: 'import-file-status',
  error: 'import-file-e',
  failed: 'import-failed',
} as const;

type FocusTarget = 'title' | 'choose' | 'failed';

/**
 * IA-11 Import students — the V3 export's import (IA-v1 `Main.dc.html` IA-11), at
 * `/institute/people/import`.
 *
 * - **Three steps in the page** (not in the address), then the result, in the form column under
 *   the step indicator (`ol.ia-steps` "Steps"). The heading names the step ("Step 1 of 3" ·
 *   "Choose a file") and takes focus on every change.
 * - **Step 1 · Choose a file**: the template (its six required columns, the course-code example
 *   from the institution's first course in content access and its own code —
 *   `InstitutionCourseCodeService.list` — and the header-only `data:` download) and a real file
 *   chooser — "Choose a CSV file" opens the browser's own; the file is read as text in the browser
 *   (up to 1 MB) and nothing is uploaded. "Check file" sends its name and text to
 *   `PeopleService.previewStudentImport`, a check that writes nothing; its file refusals ("Choose a
 *   CSV file first", the columns, no rows) show under the chooser, which takes focus.
 * - **Step 2 · Check rows**: the file and the service's counts on one line, then "Nothing is
 *   imported while the file has errors" and every problem in the role's list table ("Row 4", the
 *   student, what to fix, "Error — blocks import") — or "No problems found". Any error blocks the
 *   whole import (the interim T-24 all-or-nothing; state-copy `IA-11.commit-mode`); "Choose the
 *   corrected file" goes back to step 1 with no file chosen. No warning is defined.
 * - **Step 3 · Confirm import**: who will be added and what it does not do; "Import N students"
 *   sends `commitStudentImport` once. Its receipt refreshes People; the result names who was added
 *   and offers "Give students access" (IA-05), "View students" and "Import another file". No
 *   invitation or e-mail is sent (T-11).
 * - **Refusals**: the records changed since the check → the same file is checked again and step 2
 *   shows what is wrong now; the check no longer current → step 1; failed for now → nothing
 *   changes and "The import didn’t finish — Nothing was added. Try again." takes focus. Paused →
 *   the refusal instead of the flow ("You can’t import students while your institution’s access is
 *   paused"), with the way back and Help.
 */
export function ImportStudents() {
  useShellPage(underPlacement('IA-11', IMPORT_STUDENTS.title));
  const today = useInstituteTodayLine();
  const sessionPaused = useInstitutionPaused();
  const [refusedPaused, setRefusedPaused] = useState(false);
  const paused = sessionPaused || refusedPaused;
  const [state, dispatch] = useReducer(importReducer, START);
  const [failed, setFailed] = useState(false);
  const [focus, setFocus] = useState<{ readonly target: FocusTarget; readonly count: number }>({
    target: 'title',
    count: 0,
  });
  const chooseRef = useRef<HTMLButtonElement>(null);
  const preview = useCommand((ports) => ports.people.previewStudentImport);
  const commit = useCommand((ports) => ports.people.commitStudentImport);
  const codes = useCourseCodeList();

  useEffect(() => {
    if (focus.count === 0) return;
    const target =
      focus.target === 'choose'
        ? chooseRef.current
        : document.getElementById(focus.target === 'failed' ? IDS.failed : IDS.title);
    target?.focus();
  }, [focus]);
  const focusOn = (target: FocusTarget) =>
    setFocus((current) => ({ target, count: current.count + 1 }));

  /** A write refused while paused: the page turns into the refusal (state-copy `IA-11.paused`). */
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
    setFailed(false);
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
      // Failed for now: nothing was added, and it can be sent again (state-copy
      // `IA-11.unavailable`): the export's "The import didn’t finish" takes focus.
      () => {
        setFailed(true);
        focusOn('failed');
      },
    );
  };

  const restart = () => {
    dispatch({ type: 'restart' });
    setFailed(false);
    preview.reset();
    commit.reset();
    focusOn('title');
  };

  const back = () => {
    dispatch({ type: 'back' });
    setFailed(false);
    focusOn('title');
  };

  const crumbs = (
    <Breadcrumbs
      levels={[{ label: IMPORT_STUDENTS.back, href: PEOPLE_ADDRESS }]}
      current={IMPORT_STUDENTS.title}
    />
  );
  if (paused) {
    return (
      <>
        {crumbs}
        <IaMessageCard
          icon="pauseCircle"
          title={IMPORT_V3.pausedTitle}
          titleId={IDS.title}
          actions={
            <>
              <ButtonLink variant="navy" href={PEOPLE_ADDRESS}>
                {backToWords(IMPORT_STUDENTS.back)}
              </ButtonLink>
              <TextLink href={INSTITUTE_HELP_ADDRESS}>{ADD_PERSON_V3.help}</TextLink>
            </>
          }
        >
          {IMPORT_V3.pausedLine}
        </IaMessageCard>
      </>
    );
  }

  // The template's course-code example: the first course in content access, with the
  // institution's own code for it (state-copy `IA-11.template.example`).
  const first = codes.data?.ok ? codes.data.value[0] : undefined;
  const example = first
    ? templateCodeExample(first.course.platformCode ?? first.course.name, first.code?.code ?? null)
    : stateWords('IA-11.template.no-course');

  const done = state.done;
  let body: ReactNode;
  if (done) body = <ResultStep done={done} onRestart={restart} />;
  else if (state.step === 1)
    body = (
      <ChooseStep
        state={state}
        busy={preview.busy}
        chooseRef={chooseRef}
        example={example}
        onChosen={onChosen}
        onCheck={onCheck}
      />
    );
  else if (state.report === null) body = null;
  else if (state.step === 2)
    body = (
      <CheckStep
        report={state.report}
        onBack={back}
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
    );
  else
    body = (
      <ConfirmStep
        report={state.report}
        busy={commit.busy || preview.busy}
        failed={failed}
        onBack={back}
        onImport={onImport}
      />
    );

  return (
    <>
      <PageHead
        breadcrumbs={crumbs}
        date={today}
        eyebrow={done ? IMPORT_STUDENTS.title : importStepCount(state.step)}
        title={done ? importedTitle(done.added) : IMPORT_STUDENTS.steps[state.step - 1]!}
        titleId={IDS.title}
        titleFocusTarget
      />
      {done ? null : (
        <IaSteps
          label={IMPORT_V3.stepsLabel}
          steps={IMPORT_STUDENTS.steps.map((label) => ({ key: label, label }))}
          current={state.step}
          stateWords={{ done: IMPORT_V3.stepDone, current: IMPORT_V3.stepCurrent }}
        />
      )}
      <IaImportSurface labelledBy={IDS.title}>{body}</IaImportSurface>
    </>
  );
}

// ---- Step 1 · Choose a file ----

function ChooseStep({
  state,
  busy,
  chooseRef,
  example,
  onChosen,
  onCheck,
}: {
  readonly state: ImportState;
  readonly busy: boolean;
  readonly chooseRef: Ref<HTMLButtonElement>;
  readonly example: string;
  readonly onChosen: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onCheck: () => void;
}) {
  return (
    <>
      <IaStack sec>
        <IaImportTemplate
          title={IMPORT_STUDENTS.templateHeading}
          line={templateLine(TEMPLATE_COLUMNS, example)}
          columnsLabel={IMPORT_V3.columnsLabel}
          columns={TEMPLATE_COLUMNS}
          download={{
            href: TEMPLATE_DOWNLOAD.href,
            fileName: TEMPLATE_DOWNLOAD.fileName,
            label: IMPORT_STUDENTS.download,
          }}
        />
        <IaFileChooser
          label={IMPORT_V3.fileLabel}
          labelId={IDS.label}
          file={state.file ? { name: state.file.name } : null}
          noFile={IMPORT_STUDENTS.noFile}
          statusId={IDS.status}
          button={{
            id: IDS.choose,
            label: state.file ? IMPORT_V3.chooseAnother : IMPORT_STUDENTS.choose,
            ref: chooseRef,
          }}
          input={{ id: IDS.input, accept: '.csv,text/csv', onChange: onChosen }}
          error={state.fileError ? { id: IDS.error, text: state.fileError } : null}
        />
        <Hint>{IMPORT_STUDENTS.quietLine}</Hint>
      </IaStack>
      <IaActions>
        <ButtonLink size="lg" href={PEOPLE_ADDRESS}>
          {IMPORT_STUDENTS.cancel}
        </ButtonLink>
        <IaBusyButton
          variant="primary"
          size="lg"
          busy={busy}
          busyLabel={IMPORT_STUDENTS.checking}
          onClick={onCheck}
        >
          {IMPORT_STUDENTS.check}
        </IaBusyButton>
      </IaActions>
    </>
  );
}

// ---- Step 2 · Check rows ----

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
    <>
      <IaStack sec>
        <IaImportChecked
          fileName={report.fileName}
          summary={checkSummaryWords([
            rowsCheckedWords(report.rowsChecked),
            readyWords(report.readyToImport),
            rowsWithErrorsWords(errors),
          ])}
        />
        {errors > 0 ? (
          <Notice
            tone="warn"
            icon="alertTriangle"
            role="status"
            title={IMPORT_STUDENTS.blockedTitle}
          >
            {IMPORT_V3.blockedLine}
          </Notice>
        ) : (
          <Notice tone="ok" role="status" title={IMPORT_V3.cleanTitle}>
            {cleanLine(report.rowsChecked)}
          </Notice>
        )}
      </IaStack>
      {errors > 0 ? (
        <IaImportProblems
          title={IMPORT_V3.attentionTitle}
          note={IMPORT_V3.rowsNote}
          caption={attentionCaption()}
          headers={columns}
          rows={problemLines(report).map((line) => ({
            key: line.key,
            row: rowNumberWords(line.row),
            who: line.name,
            studentId: line.studentId || null,
            message: line.words,
            type: <StatusPill tone="err">{IMPORT_STUDENTS.errorType}</StatusPill>,
          }))}
        />
      ) : null}
      <IaActions>
        <Button size="lg" onClick={onBack}>
          {IMPORT_STUDENTS.backStep}
        </Button>
        {errors > 0 ? (
          <Button variant="primary" size="lg" onClick={onChooseFixed}>
            {IMPORT_STUDENTS.chooseFixed}
          </Button>
        ) : (
          <Button variant="primary" size="lg" onClick={onContinue}>
            {IMPORT_STUDENTS.continue}
          </Button>
        )}
      </IaActions>
    </>
  );
}

// ---- Step 3 · Confirm import ----

function ConfirmStep({
  report,
  busy,
  failed,
  onBack,
  onImport,
}: {
  readonly report: StudentImportReport;
  readonly busy: boolean;
  readonly failed: boolean;
  readonly onBack: () => void;
  readonly onImport: () => void;
}) {
  return (
    <>
      <IaStack sec>
        {/* The export sets this line larger and in navy inline (17/26 px): left to the central
            patch; its words are bold, as drawn. */}
        <IaImportLead>
          {willAddLine(studentsWords(report.readyToImport), report.fileName)}
        </IaImportLead>
        <IaLines
          lines={IMPORT_V3.confirmPoints.map((point) => ({
            key: point,
            tone: 'info' as const,
            children: point,
          }))}
        />
        {failed ? (
          <IaImportFailed
            id={IDS.failed}
            title={IMPORT_V3.failedTitle}
            line={IMPORT_V3.failedLine}
          />
        ) : null}
      </IaStack>
      <IaActions>
        <Button size="lg" onClick={onBack}>
          {IMPORT_STUDENTS.backStep}
        </Button>
        <IaBusyButton
          variant="primary"
          size="lg"
          busy={busy}
          busyLabel={IMPORT_STUDENTS.importing}
          onClick={onImport}
        >
          {importButtonWords(report.readyToImport)}
        </IaBusyButton>
      </IaActions>
    </>
  );
}

// ---- Result ----

function ResultStep({
  done,
  onRestart,
}: {
  readonly done: ImportedResult;
  readonly onRestart: () => void;
}) {
  return (
    <>
      <IaStack sec>
        <Notice tone="ok" role="status" title={IMPORT_STUDENTS.finished}>
          {importedLine(done.added, done.fileName)}
        </Notice>
        <IaImportAdded title={IMPORT_STUDENTS.added} names={addedNamesWords(done.names)} />
      </IaStack>
      <IaActions start>
        <ButtonLink variant="primary" size="lg" href={giveAccessAddress()}>
          {IMPORT_STUDENTS.giveAccess}
        </ButtonLink>
        <ButtonLink size="lg" href={PEOPLE_ADDRESS}>
          {IMPORT_STUDENTS.viewStudents}
        </ButtonLink>
        <Button variant="ghost" size="lg" onClick={onRestart}>
          {IMPORT_STUDENTS.again}
        </Button>
      </IaActions>
    </>
  );
}

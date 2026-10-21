'use client';

import type { ExperimentId, QuestionImportReport } from '@xr/domain';
import {
  Breadcrumbs,
  Button,
  ButtonLink,
  FaAuthor,
  FaBankSideTitle,
  FaChecklist,
  FaFormColumn,
  FaFormFoot,
  FaFormSection,
  FaImportColumns,
  FaImportDest,
  FaImportFigures,
  FaImportFile,
  FaImportFileField,
  FaImportFileRow,
  FaImportRowCheck,
  FaImportTemplate,
  FaMessageCard,
  FaResult,
  FaResultText,
  FaSide,
  FaSideSection,
  FaSteps,
  ListState,
  LoadingRows,
  Notice,
  PageHead,
  Surface,
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
  IMPORT_QUESTIONS,
  importConfirmLine,
  importedLine,
  importFileRefusalWords,
  importIntoBankLine,
  importQuestionsButton,
  importQuietLine,
  importStepWords,
  MAX_QUESTION_FILE_BYTES,
  noExplanationWords,
  QUESTION_CHOOSER_WORDS,
  QUESTION_TEMPLATE_DOWNLOAD,
  QUESTION_TEMPLATE_GUIDE,
} from '@/copy/question-tools';
import { stateWords } from '@/copy/state-copy';
import { questionBankAddress, questionToolPlacement } from '@/nav/faculty';
import { useAppNavigation } from '@/nav/navigation';
import { useCreateOptions } from '@/queries/teaching';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { importReducer, type ImportState, problemLines, reportCounts, START } from './import-view';

/** The ids the page focuses (the H1, the chooser) and the chooser's parts. */
const IDS = {
  title: 'qimport-title',
  fileTitle: 'qimport-file-l',
  choose: 'qimport-choose',
  input: 'qimport-file',
  status: 'qimport-file-status',
  error: 'qimport-file-e',
  done: 'qimport-done',
  template: 'qimport-tpl',
} as const;

type FocusTarget = 'title' | 'choose';

/**
 * FA-17 Import questions — the V3 export's import (FA-v1 `Main.dc.html` "FA-17 Import questions"),
 * at `/faculty/question-bank/import` (`?experimentId=`).
 *
 * - **The experiment** is the address's, else the first one taught (`getCreateOptions`): its bank
 *   receives the questions (`FA-17.experiment`). Unknown or out of scope → the in-shell not-found;
 *   none taught → the drawn “Nothing to import into yet” card.
 * - **Three steps in the page** (the stepper above the form column, the template beside it), then
 *   the result. The heading names the step (“Step 1 of 3” · “Choose a file”) and takes focus on
 *   every change.
 * - **Step 1 · Choose a file**: a real file chooser — the file is read as text in the browser (up
 *   to 1 MB) and nothing is uploaded. “Check file” sends its name and text to
 *   `QuestionBankService.previewQuestionImport`, a check that writes nothing; its file refusals
 *   show under the chooser, which takes focus.
 * - **Step 2 · Check rows**: the figures (Rows · Ready · With errors · With warnings) and each row
 *   problem in words — “Error — blocks import” or “Warning” (an empty explanation). Any error
 *   blocks the whole import (the interim T-24 all-or-nothing, `FA-17.commit-mode`): “Choose
 *   another file” returns to step 1.
 * - **Step 3 · Confirm import**: “Import N questions” sends `commitQuestionImport` once; the
 *   questions go into the bank only, never into an assessment.
 * - **Result**: “Import finished” with how many were added (never the references they were given),
 *   “Open question bank”, “Import another file”.
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

  const back = () => {
    dispatch({ type: 'back' });
    focusOn('title');
  };

  const done = state.done;
  const title = done ? IMPORT_QUESTIONS.importedTitle : IMPORT_QUESTIONS.steps[state.step - 1]!;
  const eyebrow = done ? IMPORT_QUESTIONS.title : importStepWords(state.step);

  let body: ReactNode;
  if (optionsFailed) {
    body = (
      <Surface>
        <ListState
          kind="failed"
          title={stateWords('FA-17.failed')}
          action={
            <Button onClick={() => void options.refetch()}>{stateWords('FA-14.try-again')}</Button>
          }
        >
          {stateWords('FA-14.failed.line')}
        </ListState>
      </Surface>
    );
  } else if (taught === null) {
    body = (
      <Surface busy>
        <LoadingRows message={stateWords('FA-17.loading')} rows={2} />
      </Surface>
    );
  } else if (experiment === null) {
    body = (
      <FaMessageCard
        icon="upload"
        title={IMPORT_QUESTIONS.noCourseTitle}
        titleId="qimport-none"
        actions={<ButtonLink href={bankHref}>{IMPORT_QUESTIONS.backToBank}</ButtonLink>}
      >
        {IMPORT_QUESTIONS.noCourseLine}
      </FaMessageCard>
    );
  } else {
    let step: ReactNode;
    if (done) {
      step = <ResultStep added={done} bankHref={bankHref} onRestart={restart} />;
    } else if (state.step === 1) {
      step = (
        <ChooseStep
          state={state}
          busy={preview.busy}
          experimentName={experiment.name}
          cancelHref={bankHref}
          chooseRef={chooseRef}
          onChosen={onChosen}
          onCheck={() => check(state.file, false)}
        />
      );
    } else if (state.report === null) {
      step = null;
    } else if (state.step === 2) {
      step = (
        <CheckStep
          report={state.report}
          onBack={back}
          onChooseAnother={() => {
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
    } else {
      step = (
        <ConfirmStep
          report={state.report}
          experimentName={experiment.name}
          busy={commit.busy || preview.busy}
          onBack={back}
          onImport={onImport}
        />
      );
    }
    body = (
      <>
        {done ? null : (
          <FaSteps
            label={IMPORT_QUESTIONS.stepsLabel}
            steps={IMPORT_QUESTIONS.steps.map((label, index) => ({
              key: label,
              label,
              state:
                index + 1 < state.step ? 'done' : index + 1 === state.step ? 'current' : 'todo',
            }))}
            stateWords={{
              done: IMPORT_QUESTIONS.stepDone,
              current: IMPORT_QUESTIONS.stepCurrent,
              todo: IMPORT_QUESTIONS.stepTodo,
            }}
          />
        )}
        <FaAuthor single={done !== null}>
          <FaFormColumn labelledBy={IDS.title}>{step}</FaFormColumn>
          {done ? null : <TemplateSide />}
        </FaAuthor>
      </>
    );
  }

  return (
    <>
      <PageHead
        breadcrumbs={
          <Breadcrumbs
            levels={[{ label: IMPORT_QUESTIONS.back, href: bankHref }]}
            current={IMPORT_QUESTIONS.title}
          />
        }
        eyebrow={eyebrow}
        title={title}
        titleId={IDS.title}
        titleFocusTarget
        titleRef={titleRef}
      />
      {body}
    </>
  );
}

/** The template beside the steps: its line and download, then its columns. */
function TemplateSide() {
  return (
    <FaSide labelledBy={IDS.template}>
      <FaSideSection>
        <FaBankSideTitle id={IDS.template}>{IMPORT_QUESTIONS.templateTitle}</FaBankSideTitle>
        <FaImportTemplate
          line={IMPORT_QUESTIONS.templateLine}
          download={{
            label: IMPORT_QUESTIONS.download,
            href: QUESTION_TEMPLATE_DOWNLOAD.href,
            fileName: QUESTION_TEMPLATE_DOWNLOAD.fileName,
          }}
        />
      </FaSideSection>
      <FaSideSection>
        <FaBankSideTitle level={3}>{IMPORT_QUESTIONS.columnsTitle}</FaBankSideTitle>
        <FaImportColumns columns={QUESTION_TEMPLATE_GUIDE} />
      </FaSideSection>
    </FaSide>
  );
}

// ---- Step 1 · Choose a file ----

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
    <>
      <FaFormSection>
        <FaImportFileField
          titleId={IDS.fileTitle}
          title={IMPORT_QUESTIONS.fileTitle}
          hint={IMPORT_QUESTIONS.fileHint}
          error={state.fileError ? { id: IDS.error, text: state.fileError } : null}
          foot={IMPORT_QUESTIONS.csvOnly}
        >
          {/* The browser's own chooser, opened by the drawn button (state-copy FA-17.chooser). */}
          <FaImportFile
            labelledBy={IDS.fileTitle}
            fileName={state.file?.name ?? null}
            noFile={IMPORT_QUESTIONS.noFile}
            statusId={IDS.status}
            button={{
              id: IDS.choose,
              label: IMPORT_QUESTIONS.choose,
              ref: chooseRef,
              describedBy: state.fileError ? `${IDS.status} ${IDS.error}` : IDS.status,
            }}
            input={{ id: IDS.input, accept: '.csv,text/csv', onChange: onChosen, ref: inputRef }}
            onChoose={() => inputRef.current?.click()}
          />
        </FaImportFileField>
        <FaImportDest>{importQuietLine(experimentName)}</FaImportDest>
      </FaFormSection>
      <FaFormFoot
        start={<ButtonLink href={cancelHref}>{IMPORT_QUESTIONS.cancel}</ButtonLink>}
        end={
          <Button
            variant="primary"
            size="lg"
            busy={busy}
            busyLabel={IMPORT_QUESTIONS.checking}
            onClick={onCheck}
          >
            {IMPORT_QUESTIONS.check}
          </Button>
        }
      />
    </>
  );
}

// ---- Step 2 · Check rows ----

function CheckStep({
  report,
  onBack,
  onChooseAnother,
  onContinue,
}: {
  readonly report: QuestionImportReport;
  readonly onBack: () => void;
  readonly onChooseAnother: () => void;
  readonly onContinue: () => void;
}) {
  const counts = reportCounts(report);
  const lines = problemLines(report);
  const { figures, tableColumns } = IMPORT_QUESTIONS;
  return (
    <>
      <FaFormSection>
        <FaImportFileRow>{report.fileName}</FaImportFileRow>
        <FaImportFigures
          figures={[
            { key: 'rows', term: figures.rows, value: counts.rows },
            { key: 'ready', term: figures.ready, value: counts.ready, tone: 'ok' },
            {
              key: 'errors',
              term: figures.errors,
              value: counts.errors,
              tone: counts.errors > 0 ? 'err' : 'none',
            },
            {
              key: 'warnings',
              term: figures.warnings,
              value: counts.warnings,
              tone: counts.warnings > 0 ? 'warn' : 'none',
            },
          ]}
        />
        {counts.errors > 0 ? (
          <Notice tone="warn" icon="alertCircle" title={IMPORT_QUESTIONS.blockedTitle}>
            {IMPORT_QUESTIONS.blockedLine}
          </Notice>
        ) : null}
        {lines.length > 0 ? (
          <FaImportRowCheck
            title={IMPORT_QUESTIONS.tableTitle}
            caption={IMPORT_QUESTIONS.tableTitle}
            headers={tableColumns}
            rows={lines.map((line) => ({
              key: line.key,
              row: line.row,
              question: line.question,
              fix: line.words,
              type:
                line.severity === 'error'
                  ? IMPORT_QUESTIONS.errorType
                  : IMPORT_QUESTIONS.warningType,
              severity: line.severity,
            }))}
          />
        ) : null}
      </FaFormSection>
      <FaFormFoot
        start={<Button onClick={onBack}>{IMPORT_QUESTIONS.backStep}</Button>}
        end={
          counts.errors > 0 ? (
            <Button variant="primary" size="lg" onClick={onChooseAnother}>
              {IMPORT_QUESTIONS.chooseAnother}
            </Button>
          ) : (
            <Button variant="primary" size="lg" onClick={onContinue}>
              {IMPORT_QUESTIONS.continue}
            </Button>
          )
        }
      />
    </>
  );
}

// ---- Step 3 · Confirm import ----

function ConfirmStep({
  report,
  experimentName,
  busy,
  onBack,
  onImport,
}: {
  readonly report: QuestionImportReport;
  readonly experimentName: string;
  readonly busy: boolean;
  readonly onBack: () => void;
  readonly onImport: () => void;
}) {
  const counts = reportCounts(report);
  const noExplanation = noExplanationWords(counts.noExplanation);
  return (
    <>
      <FaFormSection>
        <FaResultText>{importConfirmLine(counts.ready, report.fileName)}</FaResultText>
        <FaChecklist
          flush
          label={IMPORT_QUESTIONS.whatImportingDoes}
          items={[
            { key: 'bank', text: importIntoBankLine(experimentName), done: true },
            { key: 'assessment', text: IMPORT_QUESTIONS.notInAssessment, done: true },
            ...(noExplanation
              ? [
                  {
                    key: 'explanation',
                    text: noExplanation,
                    done: false,
                    icon: 'infoDisc' as const,
                  },
                ]
              : []),
          ]}
        />
      </FaFormSection>
      <FaFormFoot
        start={<Button onClick={onBack}>{IMPORT_QUESTIONS.backStep}</Button>}
        end={
          <Button
            variant="primary"
            size="lg"
            busy={busy}
            busyLabel={IMPORT_QUESTIONS.importing}
            onClick={onImport}
          >
            {importQuestionsButton(counts.ready)}
          </Button>
        }
      />
    </>
  );
}

// ---- Result ----

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
    <FaResult
      id={IDS.done}
      actions={
        <>
          <ButtonLink variant="primary" size="lg" href={bankHref}>
            {IMPORT_QUESTIONS.openBank}
          </ButtonLink>
          <Button variant="ghost" size="lg" onClick={onRestart}>
            {IMPORT_QUESTIONS.again}
          </Button>
        </>
      }
    >
      <Notice tone="ok" role="status" title={IMPORT_QUESTIONS.finished}>
        {importedLine(added.length)}
      </Notice>
    </FaResult>
  );
}

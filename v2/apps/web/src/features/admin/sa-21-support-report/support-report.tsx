'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { SupportReport as SupportReportRecord } from '@xr/domain';
import {
  Breadcrumbs,
  Button,
  ConfirmDialog,
  DecisionOutcome,
  DecisionPanel,
  DefinitionList,
  DetailLayout,
  Field,
  GoButton,
  Hint,
  MetaSeparator,
  Notice,
  PageHead,
  Quote,
  SectionNote,
  StatusPill,
  SurfaceSection,
  Textarea,
  TextLink,
  Timeline,
} from '@xr/ui/v3';
import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { dayMonthYear, weekdayDate } from '@/copy/dates';
import { reportTitle } from '@/copy/help';
import { OPERATIONS_PAGE } from '@/copy/operations';
import {
  fromWords,
  openInstitutionWords,
  REPORT_PAGE,
  reporterWords,
  resolvedFlashLine,
  sentWords,
  SUPPORT_STATUS,
} from '@/copy/operations-6';
import { SA_UNAVAILABLE } from '@/copy/sa-shared';
import { stateWords } from '@/copy/state-copy';
import { institutionAddress } from '@/nav/institutions';
import {
  DEVICE_TRANSFERS_ADDRESS,
  operationsUnavailablePlacement,
  SUPPORT_ADDRESS,
  supportReportPlacement,
} from '@/nav/operations';
import { useInstitutionTab } from '@/queries/institutions';
import { useMyReport } from '@/queries/operations';
import { checkResolveNote, noteErrorOf } from '@/queries/operations-6-forms';
import { useSession } from '@/queries/session';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { SaRecordGuard } from '../shared/sa-record-guard';
import { historyEvents, reopenedNotice, reportedFacts, resolutionOf } from './report-view';

/** The panel's ids, the note's and the flash's. */
const PANEL_ID = 'support-decision';
const PANEL_TITLE_ID = 'support-decision-h';
const NOTE_ID = 'support-note';
const FLASH_ID = 'support-flash';

/**
 * SA-21 Support report, at `/admin/operations/support/[reportId]`, as the Super Admin export draws
 * it (SA-v1 `V.report`, `SA.DLG.reopen`).
 *
 * - **Read**: `OperationsService.getMyReport` — the Super Admin may read every report (SUP-09);
 *   the record is the one the reporter reads on their own Help (`/<base>/help/reports/[id]`,
 *   XS-07) — with the reporter's institution named from `listInstitutions`. A reference the
 *   service does not answer (`not-found`, `not-permitted`, `policy-open`) is the GL-04 "This page
 *   isn’t available" message in place (`SaRecordGuard`). The page names the report by its title —
 *   the excerpt of "What happened" (P0-31) — never by its SUP reference.
 * - **As drawn**: the crumbs Operations › Support › the title; "Support report", the title, the
 *   status (the reporter's own words), who sent it and when; "What they reported" (From, What
 *   happened, Where, Screenshot — a file name only) and the History, newest first, on the sheet;
 *   the panel beside it from 860 px, under it below with "Go to decision". The product keeps
 *   "Open <institution>" under the facts for a reporter with an institution (state-copy
 *   `SA-21.institution-link`; the export draws none).
 * - **Decide** (the panel "Resolve"): open or reopened — on a reopened report the earlier note
 *   first; "Resolution note (required)" ("Add a note — the reporter sees it", checked before
 *   anything is sent) and "Resolve report" (`resolveReport`, the revision the page shows); "No
 *   response-time target is set.". Resolved (the panel "Resolved") — when, the note shown to the
 *   reporter and Reopen, which confirms first and sends `reopenReport` with the revision the
 *   confirmation opened on. Each result is said in the flash, which takes focus.
 * - **Refused**, in the panel, the record read again and focus on the panel's heading: changed
 *   since it was opened (stale; the typed note stays), moved on (resolved or reopened elsewhere),
 *   the Super Admin's own report (SUP-03; reopening one's own is open, SUP-04) — state-copy
 *   `SA-21.*`. Nothing is sent from the product.
 */
export function SupportReport({ reportId }: { readonly reportId: string }) {
  const read = useMyReport(reportId);
  const institutions = useInstitutionTab('all');
  const report = read.data?.ok ? read.data.value : null;
  // The address is untrusted text: the crumbs name the report only once it is read.
  useShellPage(
    report
      ? supportReportPlacement(reportTitle(report.whatHappened))
      : read.data && !read.data.ok
        ? operationsUnavailablePlacement('SA-21', SA_UNAVAILABLE.documentTitle)
        : supportReportPlacement(null),
  );

  const names = useMemo(() => {
    const map = new Map<string, string>();
    if (institutions.data?.ok) for (const row of institutions.data.value) map.set(row.id, row.name);
    return map;
  }, [institutions.data]);
  const waiting = institutions.isPending;

  return (
    <SaRecordGuard
      read={{
        data: waiting ? undefined : read.data,
        isPending: read.isPending || waiting,
        isError: read.isError || institutions.isError,
        refetch: () => {
          void read.refetch();
          if (institutions.isError) void institutions.refetch();
        },
      }}
      loadingLabel={stateWords('SA-21.loading')}
      failedTitle={stateWords('SA-21.failed')}
    >
      {(record) => (
        <ReportPage
          key={record.id}
          report={record}
          institution={
            record.reporter.institutionId
              ? (names.get(record.reporter.institutionId) ?? null)
              : null
          }
          onReread={() => void read.refetch()}
        />
      )}
    </SaRecordGuard>
  );
}

/** A refused command, as the panel says it (state-copy `SA-21.stale.*`, `SA-21.moved-on` …). */
type PanelNotice = 'stale' | 'moved-on' | 'own-report' | 'reopen-own' | 'unavailable-resolve';

type Flash = 'resolved' | 'reopened';

type FocusTarget = 'flash' | 'panel' | 'note' | 'title';

function ReportPage({
  report,
  institution,
  onReread,
}: {
  readonly report: SupportReportRecord;
  readonly institution: string | null;
  readonly onReread: () => void;
}) {
  const session = useSession();
  const today = session.status === 'signed-in' ? session.signedInAt : null;
  const title = reportTitle(report.whatHappened);
  const status = SUPPORT_STATUS[report.state];
  const from = fromWords(report.reporter.displayName, report.reporter.role, institution);
  const reopened = reopenedNotice(report);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [notice, setNotice] = useState<PanelNotice | null>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const panelTitleRef = useRef<HTMLHeadingElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  // Focus moves in an effect, after the commit that shows its target (as SA-19, CM-03): the
  // flash once the result is read back, the panel's heading after a refusal, the note when it is
  // missing, the page's heading after "Check it again".
  const [focusTo, setFocusTo] = useState<{ readonly target: FocusTarget; readonly n: number }>({
    target: 'panel',
    n: 0,
  });
  useEffect(() => {
    if (focusTo.n === 0) return;
    const element =
      focusTo.target === 'flash'
        ? flashRef.current
        : focusTo.target === 'note'
          ? noteRef.current
          : focusTo.target === 'title'
            ? titleRef.current
            : panelTitleRef.current;
    element?.focus();
  }, [focusTo, report.state]);
  const focus = (target: FocusTarget) => setFocusTo((current) => ({ target, n: current.n + 1 }));

  const refused = (error: ServiceError, command: 'resolve' | 'reopen') => {
    setNotice(
      error.kind === 'stale-version'
        ? 'stale'
        : error.kind === 'not-permitted' && command === 'resolve'
          ? 'own-report'
          : error.kind === 'policy-open' && command === 'reopen'
            ? 'reopen-own'
            : 'moved-on',
    );
    setFlash(null);
    onReread();
    focus('panel');
  };

  const open = report.state === 'open' || report.state === 'reopened';
  const flashShown = flash !== null && (flash === 'resolved' ? report.state === 'resolved' : open);

  return (
    <>
      <PageHead
        breadcrumbs={
          <Breadcrumbs
            levels={[
              { label: OPERATIONS_PAGE.title, href: DEVICE_TRANSFERS_ADDRESS },
              { label: OPERATIONS_PAGE.tabs.support, href: SUPPORT_ADDRESS },
            ]}
            current={title}
          />
        }
        variant="record"
        date={today ? weekdayDate(today) : undefined}
        eyebrow={REPORT_PAGE.eyebrow}
        title={title}
        titleId="page-h1"
        titleFocusTarget
        titleRef={titleRef}
        meta={
          <>
            <StatusPill tone={status.tone} size="lg">
              {status.words}
            </StatusPill>
            <span>{reporterWords(report.reporter.displayName, report.reporter.role)}</span>
            <MetaSeparator />
            <span>{sentWords(dayMonthYear(report.sentAt))}</span>
          </>
        }
        goTo={{ label: REPORT_PAGE.goTo, targetId: PANEL_ID }}
      />
      {flashShown ? (
        <Notice
          ref={flashRef}
          id={FLASH_ID}
          tone="ok"
          icon="okDisc"
          role="status"
          title={flash === 'resolved' ? REPORT_PAGE.resolvedFlash : REPORT_PAGE.reopenedFlash}
        >
          {flash === 'resolved'
            ? resolvedFlashLine(report.reporter.displayName)
            : REPORT_PAGE.reopenedFlashLine}
        </Notice>
      ) : null}
      <DetailLayout
        asideId={PANEL_ID}
        asideLabelledBy={PANEL_TITLE_ID}
        main={
          <>
            <SurfaceSection
              title={REPORT_PAGE.reported}
              titleId="support-reported"
              aside={
                // Kept from the product (the export draws none): the reporter's institution,
                // beside the heading (state-copy SA-21.institution-link).
                report.reporter.institutionId && institution ? (
                  <TextLink href={institutionAddress(report.reporter.institutionId)}>
                    {openInstitutionWords(institution)}
                  </TextLink>
                ) : undefined
              }
            >
              <DefinitionList items={reportedFacts(report, from)} />
            </SurfaceSection>
            <SurfaceSection
              title={REPORT_PAGE.history}
              titleId="support-history"
              aside={<SectionNote>{REPORT_PAGE.historyNote}</SectionNote>}
            >
              <Timeline events={historyEvents(report)} />
            </SurfaceSection>
          </>
        }
        aside={
          <DecisionPanel
            title={open ? REPORT_PAGE.panelTitle.open : REPORT_PAGE.panelTitle.resolved}
            titleId={PANEL_TITLE_ID}
            titleRef={panelTitleRef}
          >
            {notice ? (
              <RefusedNotice
                notice={notice}
                onCheckAgain={() => {
                  setNotice(null);
                  focus('title');
                }}
              />
            ) : null}
            {open ? (
              <>
                {reopened ? (
                  <Notice tone="warn" icon="alertCircle" role="status" title={reopened.title}>
                    {reopened.line}
                  </Notice>
                ) : null}
                <ResolvePanel
                  report={report}
                  noteRef={noteRef}
                  onResolved={() => {
                    setNotice(null);
                    setFlash('resolved');
                    focus('flash');
                  }}
                  onInvalid={() => focus('note')}
                  onRefused={(error) => refused(error, 'resolve')}
                  onUnavailable={() => setNotice('unavailable-resolve')}
                />
              </>
            ) : (
              <ResolvedPanel
                report={report}
                panelTitleRef={panelTitleRef}
                onReopened={() => {
                  setNotice(null);
                  setFlash('reopened');
                  focus('flash');
                }}
                onRefused={(error) => refused(error, 'reopen')}
              />
            )}
          </DecisionPanel>
        }
      />
    </>
  );
}

function RefusedNotice({
  notice,
  onCheckAgain,
}: {
  readonly notice: PanelNotice;
  readonly onCheckAgain: () => void;
}) {
  switch (notice) {
    case 'stale':
      return (
        <Notice
          tone="warn"
          icon="alertCircle"
          role="alert"
          title={stateWords('SA-21.stale.title')}
          actions={<Button onClick={onCheckAgain}>{REPORT_PAGE.checkAgain}</Button>}
        >
          {stateWords('SA-21.stale.line')}
        </Notice>
      );
    case 'own-report':
      return (
        <Notice
          tone="info"
          icon="infoDisc"
          role="alert"
          title={stateWords('SA-21.own-report.title')}
        >
          {stateWords('SA-21.own-report.line')}
        </Notice>
      );
    case 'reopen-own':
      return (
        <Notice tone="info" icon="infoDisc" role="alert" title={stateWords('SA-21.reopen-own')} />
      );
    case 'unavailable-resolve':
      return (
        <Notice
          tone="warn"
          icon="alertCircle"
          role="alert"
          title={stateWords('SA-21.unavailable.resolve')}
        />
      );
    case 'moved-on':
      return (
        <Notice tone="warn" icon="alertCircle" role="alert" title={stateWords('SA-21.moved-on')} />
      );
  }
}

/** Open or reopened: the resolution note the reporter sees and "Resolve report". */
function ResolvePanel({
  report,
  noteRef,
  onResolved,
  onInvalid,
  onRefused,
  onUnavailable,
}: {
  readonly report: SupportReportRecord;
  readonly noteRef: RefObject<HTMLTextAreaElement | null>;
  readonly onResolved: () => void;
  readonly onInvalid: () => void;
  readonly onRefused: (error: ServiceError) => void;
  readonly onUnavailable: () => void;
}) {
  const resolve = useCommand((ports) => ports.operations.resolveReport);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const send = () => {
    if (resolve.busy) return;
    const checked = checkResolveNote(note);
    if (checked) {
      setError(checked);
      onInvalid();
      return;
    }
    resolve.run({ id: report.id, note, expectedRev: report.rev }).then(
      (answer) => {
        if (answer.ok) {
          setNote('');
          setError(null);
          onResolved();
          return;
        }
        if (answer.error.kind === 'validation-failed') {
          setError(noteErrorOf(answer.error));
          onInvalid();
          return;
        }
        // Stale, moved on, or the Super Admin's own report: nothing was written; the note stays.
        onRefused(answer.error);
      },
      // Unavailable for now: nothing changed; the note stays (state-copy SA-21.unavailable.resolve).
      () => onUnavailable(),
    );
  };

  return (
    <>
      <Field
        id={NOTE_ID}
        label={REPORT_PAGE.noteLabel}
        hint={REPORT_PAGE.noteHint}
        error={error ?? undefined}
      >
        <Textarea
          ref={noteRef}
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            setError(null);
          }}
        />
      </Field>
      <GoButton busy={resolve.busy} busyLabel={REPORT_PAGE.resolving} onClick={send}>
        {REPORT_PAGE.resolve}
      </GoButton>
      <Hint>{REPORT_PAGE.noTarget}</Hint>
    </>
  );
}

/**
 * Resolved: when, the note the reporter sees, and Reopen — the only action — through its
 * confirmation, which names the report as it stood when it opened and sends exactly that revision.
 */
function ResolvedPanel({
  report,
  panelTitleRef,
  onReopened,
  onRefused,
}: {
  readonly report: SupportReportRecord;
  readonly panelTitleRef: RefObject<HTMLHeadingElement | null>;
  readonly onReopened: () => void;
  readonly onRefused: (error: ServiceError) => void;
}) {
  const reopen = useCommand((ports) => ports.operations.reopenReport);
  const [confirming, setConfirming] = useState<SupportReportRecord | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const resolution = resolutionOf(report);

  const send = (named: SupportReportRecord) => {
    if (reopen.busy) return;
    setUnavailable(false);
    reopen.run({ id: named.id, expectedRev: named.rev }).then(
      (answer) => {
        setConfirming(null);
        if (answer.ok) onReopened();
        else onRefused(answer.error);
      },
      // Unavailable for now: nothing changed; the confirmation stays open and says so in its body
      // (state-copy SA-21.unavailable.reopen).
      () => setUnavailable(true),
    );
  };

  return (
    <DecisionOutcome
      status={
        <StatusPill tone={SUPPORT_STATUS.resolved.tone} size="lg">
          {SUPPORT_STATUS.resolved.words}
        </StatusPill>
      }
      meta={resolution?.line}
    >
      {resolution ? <Quote by={REPORT_PAGE.noteShown}>{resolution.note}</Quote> : null}
      <Button
        onClick={() => {
          setUnavailable(false);
          setConfirming(report);
        }}
      >
        {REPORT_PAGE.reopen}
      </Button>
      <Hint>{REPORT_PAGE.reopenEffect}</Hint>
      <ConfirmDialog
        open={confirming !== null}
        idPrefix="support-reopen"
        title={REPORT_PAGE.reopenTitle}
        description={REPORT_PAGE.reopenEffect}
        confirmLabel={REPORT_PAGE.reopen}
        cancelLabel={REPORT_PAGE.cancel}
        busy={reopen.busy}
        busyLabel={REPORT_PAGE.reopening}
        returnFocusFallback={panelTitleRef}
        initialFocus="confirm"
        onConfirm={() => {
          if (confirming) send(confirming);
        }}
        onCancel={() => setConfirming(null)}
      >
        {unavailable ? (
          <Notice
            tone="warn"
            icon="alertCircle"
            role="alert"
            title={stateWords('SA-21.unavailable.reopen')}
          />
        ) : null}
      </ConfirmDialog>
    </DecisionOutcome>
  );
}

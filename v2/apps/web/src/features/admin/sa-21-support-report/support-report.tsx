'use client';

import type { ServiceError } from '@xr/contracts/draft';
import type { SupportReport as SupportReportRecord } from '@xr/domain';
import {
  BackLink,
  Button,
  ConfirmDialog,
  DecisionLayout,
  Field,
  Icon,
  Link,
  Notice,
  PageContent,
  PageHeader,
  Section,
  SectionBody,
  StatusPill,
  Textarea,
  Timeline,
} from '@xr/ui';
import { Fragment, type RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { dayMonthYear } from '@/copy/dates';
import { reportTitle } from '@/copy/help';
import {
  fromWords,
  openInstitutionWords,
  REOPEN_EFFECT,
  reopenedFlash,
  reopenTitle,
  REPORT_PAGE,
  resolvedFlash,
  sentWords,
  STRIPPED_OPERATIONS,
  SUPPORT_STATUS,
} from '@/copy/operations-6';
import { stateWords } from '@/copy/state-copy';
import { institutionAddress } from '@/nav/institutions';
import {
  OPERATIONS_REPORT_ADDRESS,
  SUPPORT_ADDRESS,
  supportReportPlacement,
} from '@/nav/operations';
import { useInstitutionTab } from '@/queries/institutions';
import { useMyReport } from '@/queries/operations';
import { checkResolveNote, noteErrorOf } from '@/queries/operations-6-forms';
import { useCommand } from '@/queries/use-command';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { historyEvents, reopenedNotice, reportedFacts, resolutionOf } from './report-view';

/** The board's ids, with the product prefix (B7-09 `Sd-decision`, `Sd-note`, `Sd-flash`). */
const PANEL_ID = 'support-decision';
const NOTE_ID = 'support-note';
const FLASH_ID = 'support-flash';

/**
 * SA-21 Support report — board B7-09 f8 (open), f9 (resolved — the note shown to the reporter,
 * Reopen the only action), f10 (reopened — the earlier note first, resolve again with a new
 * note), f11 (Resolve with no note), f12 (Reopen · DL-1), f14 (375); B7-10 f12; B7-12 f28 … f31,
 * at `/admin/operations/support/[reportId]`.
 *
 * - **Read**: `OperationsService.getMyReport` — the Super Admin may read every report (SUP-09);
 *   the record is the one the reporter reads on their own Help (`/<base>/help/reports/[id]`, XS-07)
 *   — with the reporter's institution named from `listInstitutions`. A reference the service does
 *   not answer (`not-found`, `not-permitted`, `policy-open`) is the in-shell not-found page.
 * - **As B7-09 draws it** (AR-4, details ~72 % and one static panel ~28 % from 860 px of content;
 *   below, the panel follows the details, with no "Go to decision"): the back link "Support",
 *   "Support report · SUP-0213", the excerpt of "What happened" as the title (no saved title,
 *   P0-31), the status chip and "Sent 3 Oct 2026"; on a reopened report the notice "Reopened by …
 *   / Earlier note: “…”" first; "What they reported" (From, What happened, Where, Screenshot — a
 *   file name only, nothing is uploaded) with "Open <institution>"; the History, newest first.
 * - **Decide** (the panel "Resolve"): open or reopened — "Note to the reporter" (required: "Add a
 *   note — the reporter sees it", checked before anything is sent, f11) and Resolve
 *   (`resolveReport`, the revision the page shows); resolved — "Resolved on … by …", the note in
 *   quotation marks, "The reporter sees this note." and Reopen, which confirms first (DL-1, f12:
 *   focus on Reopen; Cancel returns to it) and sends `reopenReport` with the revision the
 *   confirmation opened on. "No response-time target is set." closes the panel (ND-14, the id
 *   out of the words, P1-14). Each result is said in the flash (B7-09 `Sd-flash`), which takes
 *   focus.
 * - **Refused**, calmly in the panel, the record read again and focus on the panel's heading:
 *   changed since it was opened (stale; the typed note stays), moved on (resolved or reopened
 *   elsewhere), the Super Admin's own report (nobody resolves their own report, SUP-03; reopening
 *   one's own is open, SUP-04) — state-copy `SA-21.*`. Nothing is sent from the product.
 */
export function SupportReport({ reportId }: { readonly reportId: string }) {
  const read = useMyReport(reportId);
  const institutions = useInstitutionTab('all');
  const report = read.data?.ok ? read.data.value : null;
  // The address is untrusted text: the crumbs name the report only once it is read.
  useShellPage(supportReportPlacement(report ? report.id : null));

  const names = useMemo(() => {
    const map = new Map<string, string>();
    if (institutions.data?.ok) for (const row of institutions.data.value) map.set(row.id, row.name);
    return map;
  }, [institutions.data]);
  const waiting = institutions.isPending;

  return (
    <PageContent wrap="wide">
      <RecordGuard
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
        failed={{
          title: stateWords('SA-21.failed'),
          line: stateWords('SA-21.failed.line'),
          reportHref: OPERATIONS_REPORT_ADDRESS,
        }}
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
      </RecordGuard>
    </PageContent>
  );
}

/** A refused command, as the panel says it (state-copy `SA-21.stale.*`, `SA-21.moved-on` …). */
type PanelNotice = 'stale' | 'moved-on' | 'own-report' | 'reopen-own' | 'unavailable-resolve';

type Flash = 'resolved' | 'reopened';

type FocusTarget = 'flash' | 'title' | 'note';

function ReportPage({
  report,
  institution,
  onReread,
}: {
  readonly report: SupportReportRecord;
  readonly institution: string | null;
  readonly onReread: () => void;
}) {
  const title = reportTitle(report.whatHappened);
  const status = SUPPORT_STATUS[report.state];
  const from = fromWords(report.reporter.displayName, report.reporter.role, institution);
  const reopened = reopenedNotice(report);
  const [flash, setFlash] = useState<Flash | null>(null);
  const [notice, setNotice] = useState<PanelNotice | null>(null);
  const flashRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  // Focus moves in an effect, after the commit that shows its target (as SA-19, CM-03): the
  // flash once the result is read back, the panel's heading after a refusal, the note on f11.
  const [focusTo, setFocusTo] = useState<{ readonly target: FocusTarget; readonly n: number }>({
    target: 'title',
    n: 0,
  });
  useEffect(() => {
    if (focusTo.n === 0) return;
    const element =
      focusTo.target === 'flash'
        ? flashRef.current
        : focusTo.target === 'note'
          ? noteRef.current
          : titleRef.current;
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
    focus('title');
  };

  const open = report.state === 'open' || report.state === 'reopened';

  return (
    <>
      <PageHeader
        className="[margin:8px_0_16px]"
        back={<BackLink href={SUPPORT_ADDRESS}>{REPORT_PAGE.back}</BackLink>}
        overline={
          <>
            {REPORT_PAGE.overline} · <span className="xr-id">{report.id}</span>
          </>
        }
        title={title}
        titleId="support-report-title"
        titleFocusTarget
        meta={
          <>
            <StatusPill tone={status.tone}>{status.words}</StatusPill>
            <span>{sentWords(dayMonthYear(report.sentAt))}</span>
          </>
        }
      />
      {/* B7-09 `Sd-flash`: always mounted, said once the result is read back. */}
      <p
        ref={flashRef}
        id={FLASH_ID}
        className="xa-save is-ok [margin:0_0_12px]"
        role="status"
        tabIndex={-1}
      >
        {flash && (flash === 'resolved' ? report.state === 'resolved' : open) ? (
          <>
            <Icon name="done" />
            <span>
              {flash === 'resolved' ? resolvedFlash(report.id) : reopenedFlash(report.id)}
            </span>
          </>
        ) : null}
      </p>
      <DecisionLayout
        jump={false}
        className="[&>.xr-stack]:gap-5"
        panel={{
          id: PANEL_ID,
          title: REPORT_PAGE.panelTitle,
          titleFocusTarget: true,
          titleRef,
          position: 'static',
          children: (
            <>
              {notice ? <RefusedNotice notice={notice} /> : null}
              {open ? (
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
              ) : (
                <ResolvedPanel
                  report={report}
                  titleRef={titleRef}
                  onReopened={() => {
                    setNotice(null);
                    setFlash('reopened');
                    focus('flash');
                  }}
                  onRefused={(error) => refused(error, 'reopen')}
                />
              )}
              <p className="xl-open m-0">
                <Icon name="info" size={16} />
                <span>{STRIPPED_OPERATIONS.noResponseTarget.words}</span>
              </p>
            </>
          ),
        }}
      >
        {reopened ? (
          <Notice tone="warn" title={reopened.title}>
            {reopened.line}
          </Notice>
        ) : null}
        <Section title={REPORT_PAGE.reported}>
          <SectionBody>
            <dl className="xl-kv xv-kv">
              {reportedFacts(report, from).map((fact) => (
                <Fragment key={fact.term}>
                  <dt>{fact.term}</dt>
                  <dd>{fact.value}</dd>
                </Fragment>
              ))}
            </dl>
            {report.reporter.institutionId && institution ? (
              <p className="[margin:12px_0_0]">
                <Link
                  className="xr-btn xr-btn--text xr-btn--sm"
                  href={institutionAddress(report.reporter.institutionId)}
                >
                  {openInstitutionWords(institution)}
                </Link>
              </p>
            ) : null}
          </SectionBody>
        </Section>
        <Section title={REPORT_PAGE.history} meta={REPORT_PAGE.historyMeta}>
          <SectionBody>
            <Timeline events={historyEvents(report)} markLatest={false} />
          </SectionBody>
        </Section>
      </DecisionLayout>
    </>
  );
}

function RefusedNotice({ notice }: { readonly notice: PanelNotice }) {
  switch (notice) {
    case 'stale':
      return (
        <Notice tone="warn" role="alert" title={stateWords('SA-21.stale.title')}>
          {stateWords('SA-21.stale.line')}
        </Notice>
      );
    case 'own-report':
      return (
        <Notice tone="info" role="alert" title={stateWords('SA-21.own-report.title')}>
          {stateWords('SA-21.own-report.line')}
        </Notice>
      );
    case 'reopen-own':
      return (
        <Notice tone="info" role="alert">
          {stateWords('SA-21.reopen-own')}
        </Notice>
      );
    case 'unavailable-resolve':
      return (
        <Notice tone="err" role="alert">
          {stateWords('SA-21.unavailable.resolve')}
        </Notice>
      );
    case 'moved-on':
      return (
        <Notice tone="warn" role="alert">
          {stateWords('SA-21.moved-on')}
        </Notice>
      );
  }
}

/** Open or reopened (B7-09 `rOpen`, f8, f10, f11): the note to the reporter and Resolve. */
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
          className="min-h-[120px]"
          value={note}
          onChange={(event) => {
            setNote(event.target.value);
            setError(null);
          }}
        />
      </Field>
      <Button
        variant="primary"
        block
        busy={resolve.busy}
        busyLabel={REPORT_PAGE.resolving}
        onClick={send}
      >
        {REPORT_PAGE.resolve}
      </Button>
    </>
  );
}

/**
 * Resolved (B7-09 `rDone`, f9, f12): who resolved it and when, the note the reporter sees, and
 * Reopen — the only action — through its DL-1 confirmation, which names the report as it stood
 * when it opened and sends exactly that revision.
 */
function ResolvedPanel({
  report,
  titleRef,
  onReopened,
  onRefused,
}: {
  readonly report: SupportReportRecord;
  readonly titleRef: RefObject<HTMLHeadingElement | null>;
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
      // Unavailable for now: nothing changed; the confirmation stays open.
      () => setUnavailable(true),
    );
  };

  const named = confirming ?? report;
  return (
    <>
      <StatusPill tone="ok">{REPORT_PAGE.resolved}</StatusPill>
      {resolution ? (
        <>
          <p className="xr-small m-0 text-ink-2">{resolution.line}</p>
          <p className="xr-body m-0">{resolution.note}</p>
        </>
      ) : null}
      <p className="xl-meta m-0">{REPORT_PAGE.reporterSees}</p>
      <Button
        variant="secondary"
        block
        onClick={() => {
          setUnavailable(false);
          setConfirming(report);
        }}
      >
        {REPORT_PAGE.reopen}
      </Button>
      <ConfirmDialog
        open={confirming !== null}
        align="decision"
        idPrefix="support-reopen"
        title={reopenTitle(named.id)}
        effect={REOPEN_EFFECT}
        notice={
          unavailable ? (
            <Notice tone="err" role="alert">
              {stateWords('SA-21.unavailable.reopen')}
            </Notice>
          ) : undefined
        }
        confirmLabel={REPORT_PAGE.reopen}
        cancelLabel={REPORT_PAGE.cancel}
        busy={reopen.busy}
        busyLabel={REPORT_PAGE.reopening}
        returnFocusFallback={titleRef}
        onConfirm={() => {
          if (confirming) send(confirming);
        }}
        onCancel={() => setConfirming(null)}
      />
    </>
  );
}

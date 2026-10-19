'use client';

import {
  Breadcrumbs,
  Button,
  DefinitionList,
  HelpColumn,
  HelpFoot,
  ListState,
  LoadingRows,
  MetaSeparator,
  Notice,
  PageHead,
  ReportSection,
  StatusPill,
  Surface,
  TextLink,
  Timeline,
  V3Region,
} from '@xr/ui/v3';
import { useEffect, useRef } from 'react';

import {
  HELP,
  historyOf,
  reopenedOf,
  REPORT_STATUS,
  reportedFacts,
  reportTitle,
  resolutionOf,
  sentOn,
  showsReportReferences,
} from '@/copy/help';
import { HELP_TITLE, helpAddresses, helpPlacement } from '@/nav/help';
import { useAppNavigation } from '@/nav/navigation';
import { useMyReport } from '@/queries/operations';

import { MAIN_ID } from '../workspace-frame/route-focus';
import { useShellPage, useWorkspaceIdentity } from '../workspace-frame/shell-page';

/**
 * XS-07 — a report's detail, in the owner-approved Entry & shared design
 * (design/v3-refined-b/roles/XS-v6, `XsHelp` view `detail`), at `/<base>/help/reports/[reportId]`:
 * the breadcrumb, the reference (none for a Super Admin, owner decision 6), the provisional title
 * (P0-31), the status in words and when it was sent; the resolution note first when resolved, or
 * "This report is open again" when reopened; what was reported; the history, newest first; and
 * "Something else isn’t working? Report a problem".
 *
 * Read through `OperationsService.getMyReport`, which answers only the signed-in person's own
 * report. Any refusal — no such report, someone else's, SUP-07 open — is the in-shell not-found:
 * existence is never revealed. Loading and failed follow the export's list states (it draws none
 * for one report; PROVISIONAL). The reporter has no Reopen control (P0-30; SUP-04 open): resolving
 * and reopening are Super Admin actions.
 */
export function ReportDetail({ reportId }: { readonly reportId: string }) {
  const { role } = useWorkspaceIdentity();
  const { notFound } = useAppNavigation();
  const addresses = helpAddresses(role);
  const read = useMyReport(reportId);
  const report = read.data?.ok === true && !read.isError ? read.data.value : null;
  useShellPage(
    helpPlacement(role, {
      kind: 'detail',
      reportId,
      title: report ? reportTitle(report.whatHappened) : null,
    }),
  );

  // The heading arrives with the record: if the route focus has put focus on the page while the
  // report was loading, it moves on to the heading (XS-P2: the destination focuses its H1).
  const titleRef = useRef<HTMLHeadingElement>(null);
  const loaded = report !== null;
  useEffect(() => {
    if (loaded && document.activeElement?.id === MAIN_ID) titleRef.current?.focus();
  }, [loaded]);

  if (read.data && !read.data.ok && !read.isError) notFound();

  let body;
  if (read.isError && !read.isFetching) {
    body = (
      <Surface>
        <ListState
          kind="failed"
          title={HELP.detail.failedTitle}
          action={
            <Button size="lg" onClick={() => void read.refetch()}>
              {HELP.retry}
            </Button>
          }
        >
          {HELP.failed.line}
        </ListState>
      </Surface>
    );
  } else if (!report) {
    body = (
      <Surface busy>
        <LoadingRows message={HELP.detail.loading} rows={2} cells={[2, 1]} />
      </Surface>
    );
  } else {
    const title = reportTitle(report.whatHappened);
    const status = REPORT_STATUS[report.state];
    const resolution = resolutionOf(report);
    const reopened = reopenedOf(report);
    body = (
      <>
        <div>
          <Breadcrumbs levels={[{ label: HELP_TITLE, href: addresses.reports }]} current={title} />
          <PageHead
            variant="record"
            title={title}
            titleRef={titleRef}
            titleFocusTarget
            titleFit
            eyebrow={showsReportReferences(role) ? report.id : undefined}
            meta={
              <>
                <StatusPill tone={status.tone} size="lg">
                  {status.label}
                </StatusPill>
                <MetaSeparator />
                <span>{sentOn(report)}</span>
              </>
            }
          />
        </div>
        {resolution ? (
          <Notice tone="ok" icon="checkCircle" role="status" title={resolution.title}>
            {resolution.note}
          </Notice>
        ) : null}
        {reopened ? (
          <Notice tone="info" icon="retry" role="status" title={HELP.detail.reopenedTitle}>
            {reopened}
          </Notice>
        ) : null}
        <Surface label={HELP.detail.sheet}>
          <ReportSection title={HELP.detail.reported}>
            <DefinitionList items={reportedFacts(report)} />
          </ReportSection>
          <ReportSection title={HELP.detail.history} note={HELP.detail.newestFirst}>
            <Timeline events={historyOf(report)} />
          </ReportSection>
        </Surface>
        <HelpFoot>
          {HELP.detail.foot}
          <TextLink href={addresses.report}>{HELP.report}</TextLink>
        </HelpFoot>
      </>
    );
  }

  return (
    <V3Region>
      <HelpColumn>{body}</HelpColumn>
    </V3Region>
  );
}

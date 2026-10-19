'use client';

import {
  Button,
  ButtonLink,
  HelpColumn,
  ListState,
  LoadingRows,
  PageHead,
  ReportListSurface,
  ReportRows,
  V3Region,
} from '@xr/ui/v3';
import { useEffect, useRef } from 'react';

import {
  HELP,
  newestFirst,
  REPORT_STATUS,
  reportCountText,
  reportMeta,
  reportTitle,
  showsReportReferences,
} from '@/copy/help';
import { helpAddresses, helpPlacement } from '@/nav/help';
import { useMyReports } from '@/queries/operations';

import { useShellPage, useWorkspaceIdentity } from '../workspace-frame/shell-page';

/**
 * XS-07 Help & support — My reports, the Help landing, in the owner-approved Entry & shared design
 * (design/v3-refined-b/roles/XS-v6, `XsHelp` view `list`). The same template in all seven
 * workspaces, at `/<base>/help`, with Help current in the sidebar foot.
 *
 * The rows are the signed-in person's own reports, as `OperationsService.listMyReports` answers for
 * the session — no other person's report is listed or reachable. Newest first; each row opens its
 * detail; the title is the provisional excerpt of "What happened" (P0-31); the status in words and
 * shape; a Super Admin's rows carry no reference (owner decision 6). States as the export draws
 * them: populated (with "Report a problem" in the head), empty (the action moves into the empty
 * state), loading, and failed with "Try again" — which reloads, changes nothing, and moves focus to
 * "My reports" once the list is back.
 */
export function HelpHome() {
  const { role } = useWorkspaceIdentity();
  useShellPage(helpPlacement(role, { kind: 'reports' }));
  const addresses = helpAddresses(role);
  const reports = useMyReports();
  const mineRef = useRef<HTMLHeadingElement>(null);
  const retried = useRef(false);

  // `listMyReports` refuses only a signed-out caller; the session gate is leaving then.
  const mine =
    reports.data?.ok === true && !reports.isError ? newestFirst(reports.data.value) : null;
  const failed = reports.isError && !reports.isFetching;
  const ready = mine !== null;

  useEffect(() => {
    if (!ready || !retried.current) return;
    retried.current = false;
    mineRef.current?.focus();
  }, [ready]);

  const retry = () => {
    retried.current = true;
    void reports.refetch();
  };

  const reportAction = (
    <ButtonLink variant="primary" size="lg" href={addresses.report}>
      {HELP.report}
    </ButtonLink>
  );

  let body;
  if (failed) {
    body = (
      <ListState
        kind="failed"
        title={HELP.failed.title}
        action={
          <Button size="lg" onClick={retry}>
            {HELP.retry}
          </Button>
        }
      >
        {HELP.failed.line}
      </ListState>
    );
  } else if (!mine) {
    body = <LoadingRows message={HELP.loading} cells={[2, 1]} />;
  } else if (mine.length === 0) {
    body = (
      <ListState kind="empty" icon="help" title={HELP.empty.title} action={reportAction}>
        {HELP.empty.line}
      </ListState>
    );
  } else {
    const references = showsReportReferences(role);
    body = (
      <ReportRows
        rows={mine.map((report) => ({
          href: addresses.detail(report.id),
          title: reportTitle(report.whatHappened),
          meta: reportMeta(report, references),
          status: REPORT_STATUS[report.state],
        }))}
      />
    );
  }

  return (
    <V3Region>
      <HelpColumn>
        <PageHead
          title={HELP.title}
          titleFocusTarget
          titleFit
          lead={HELP.lead}
          actions={mine && mine.length > 0 ? reportAction : undefined}
        />
        <ReportListSurface
          title={HELP.mine}
          titleId="xs-help-mine"
          titleRef={mineRef}
          note={mine && mine.length > 0 ? reportCountText(mine.length) : undefined}
          busy={!failed && !mine}
        >
          {body}
        </ReportListSurface>
      </HelpColumn>
    </V3Region>
  );
}

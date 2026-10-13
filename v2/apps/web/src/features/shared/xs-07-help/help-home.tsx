'use client';

import { FailedState, HelpSupportHome, LoadingState, PageContent } from '@xr/ui';

import { newestFirst, REPORT_STATUS, reportCountText, reportSub, reportTitle } from '@/copy/help';
import { stateWords } from '@/copy/state-copy';
import { helpAddresses, helpPlacement } from '@/nav/help';
import { useMyReports } from '@/queries/operations';

import { useShellPage, useWorkspaceIdentity } from '../workspace-frame/shell-page';

/**
 * XS-07 Help & support — My reports, the Help landing (board 07 "State 2 · My reports · open /
 * reopened / resolved", "State 2a · My reports · empty", the 375 frame "Phone · 375 · My
 * reports"; board 05 the Help page in the shell). The same template in all seven workspaces, at
 * `/<base>/help`, with Help current in the sidebar foot.
 *
 * The rows are the signed-in person's own reports, as `OperationsService.listMyReports` answers
 * for the session — no other person's report is listed or reachable (board 07 "The Help landing
 * is the person’s own reports"). Newest first; each row opens its detail; the title is the
 * provisional excerpt of "What happened" (P0-31). With nothing to list, "Report a problem" moves
 * into the empty state (board 07 "Rules").
 */
export function HelpHome() {
  const { role } = useWorkspaceIdentity();
  useShellPage(helpPlacement(role, { kind: 'reports' }));
  const addresses = helpAddresses(role);
  const reports = useMyReports();

  let body;
  if (reports.isError) {
    body = (
      <FailedState
        title={stateWords('XS-07.reports.failed')}
        reportHref={addresses.report}
        onRetry={() => {
          void reports.refetch();
        }}
      >
        {stateWords('XS-07.failed.line')}
      </FailedState>
    );
  } else if (!reports.data || !reports.data.ok) {
    // `listMyReports` refuses only a signed-out caller; the session gate is leaving then.
    body = <LoadingState label={stateWords('XS-07.reports.loading')} surface="section" />;
  } else {
    const mine = newestFirst(reports.data.value);
    body = (
      <HelpSupportHome
        reportHref={addresses.report}
        countText={reportCountText(mine.length)}
        reports={mine.map((report) => ({
          reference: report.id,
          title: reportTitle(report.whatHappened),
          sub: reportSub(report),
          href: addresses.detail(report.id),
          status: REPORT_STATUS[report.state],
        }))}
      />
    );
  }
  return <PageContent wrap="read">{body}</PageContent>;
}

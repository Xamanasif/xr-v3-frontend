'use client';

import { HelpReportDetail, Icon, PageContent, Timeline } from '@xr/ui';
import { Fragment } from 'react';

import { dayMonth } from '@/copy/dates';
import {
  historyOf,
  reopenedOf,
  REPORT_STATUS,
  reportedFacts,
  reportTitle,
  resolutionOf,
} from '@/copy/help';
import { stateWords } from '@/copy/state-copy';
import { helpAddresses, helpPlacement } from '@/nav/help';
import { useMyReport } from '@/queries/operations';

import { RecordGuard } from '../record-guard/record-guard';
import { useShellPage, useWorkspaceIdentity } from '../workspace-frame/shell-page';

/**
 * XS-07 — a report's detail (board 07 "State 3 · Report detail · resolved with note", "State 3a ·
 * Report detail · reopened"), at `/<base>/help/reports/[reportId]`: the reference, the
 * provisional title (P0-31), the status in words and when it was sent; the resolution note first
 * when resolved, or "This report is open again" when reopened; what was reported; the history
 * last; "Something else isn’t working? Report a problem".
 *
 * Read through `OperationsService.getMyReport`, which answers only the signed-in person's own
 * report. Any refusal — no such report, someone else's, SUP-07 open — is the in-shell not-found:
 * existence is never revealed (record guard). The reporter has no Reopen control (P0-30; SUP-04
 * open): resolving and reopening are Super Admin actions (board 07 "Rules").
 */
export function ReportDetail({ reportId }: { readonly reportId: string }) {
  const { role } = useWorkspaceIdentity();
  const addresses = helpAddresses(role);
  useShellPage(helpPlacement(role, { kind: 'detail', reportId, reference: reportId }));
  const read = useMyReport(reportId);
  return (
    <PageContent wrap="read">
      <RecordGuard
        read={read}
        loadingLabel={stateWords('XS-07.detail.loading')}
        failed={{
          title: stateWords('XS-07.detail.failed'),
          line: stateWords('XS-07.failed.line'),
          reportHref: addresses.report,
        }}
      >
        {(report) => {
          const resolution = resolutionOf(report);
          const reopened = reopenedOf(report);
          return (
            <HelpReportDetail
              helpHref={addresses.reports}
              reportHref={addresses.report}
              reference={report.id}
              title={reportTitle(report.whatHappened)}
              status={REPORT_STATUS[report.state]}
              sent={dayMonth(report.sentAt)}
              {...(resolution ? { resolution } : {})}
              {...(reopened ? { reopened } : {})}
              reported={
                // Board 07 lists these in a canvas-only `dl.doc-kv`; the product KeyValueList class
                // is `xl-kv` (Appendix E §3 KeyValueList) — the variance is reported (WP-0.13).
                <dl className="xl-kv">
                  {reportedFacts(report).map((fact) => (
                    <Fragment key={fact.term}>
                      <dt>{fact.term}</dt>
                      <dd>
                        {fact.icon ? (
                          <span className="inline-flex items-center gap-2">
                            <Icon name={fact.icon} />
                            {fact.value}
                          </span>
                        ) : (
                          fact.value
                        )}
                      </dd>
                    </Fragment>
                  ))}
                </dl>
              }
              history={<Timeline events={historyOf(report)} markLatest lineElement="p" />}
            />
          );
        }}
      </RecordGuard>
    </PageContent>
  );
}

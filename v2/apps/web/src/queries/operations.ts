'use client';

/**
 * Help & support reads (XS-07; Appendix F §3.2 `queries/<port>.ts`: "operations (support)"),
 * through `OperationsService`. Every read is the signed-in person's own (ADR-0003): the port
 * resolves who is asking from the session and answers only their reports — the screen passes no
 * person, role or filter. Sending a report is a command: `useCommand(ports =>
 * ports.operations.reportProblem)`; its receipt (`changed: SUP`) refreshes these reads.
 */
import type { ProductPorts } from '@xr/contracts/draft';
import type { SupportReportId } from '@xr/domain';

import { defineQuery, useXrQuery } from './use-xr-query';

/** `listMyReports`: the person's own reports (board 07 "The Help landing is the person’s own reports"). */
export const myReports = defineQuery({
  family: 'SUP',
  view: 'mine',
  deps: ['SUP'],
  read: (ports: ProductPorts) => ports.operations.listMyReports(),
});

/**
 * `getMyReport`: one of the person's reports, by its reference as the address carries it. A
 * reference that names no report of theirs is refused (`not-found`, `not-permitted`, or
 * `policy-open` SUP-07) — the screen shows the not-found page, never whose it is.
 */
export const myReport = defineQuery({
  family: 'SUP',
  view: 'mine-one',
  deps: ['SUP'],
  // The address is untrusted text: existence and format are the adapter's answer (lenient ids).
  read: (ports: ProductPorts, reportId: string) =>
    ports.operations.getMyReport(reportId as SupportReportId),
});

export function useMyReports() {
  return useXrQuery(myReports, null);
}

export function useMyReport(reportId: string) {
  return useXrQuery(myReport, reportId);
}

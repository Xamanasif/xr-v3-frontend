'use client';

import type { SupportReport } from '@xr/domain';
import { HelpReportForm, HelpReportSent, PageContent } from '@xr/ui';
import { useState } from 'react';

import { helpAddresses, helpPlacement } from '@/nav/help';
import { originOf } from '@/nav/page-location';
import { useCommand } from '@/queries/use-command';

import { useShellPage, useWorkspaceIdentity } from '../workspace-frame/shell-page';

/**
 * XS-07 — Report a problem and Report sent (board 07 "State 1 · Report a problem", "1a ·
 * Validation", "1b · Sending", "1c · Sent · reference"; board 11 "375 · AR-8 form"), at
 * `/<base>/help/report`.
 *
 * - The fields are board 07's and nothing else (P0-34: no category): "What happened?",
 *   "Where did it happen?" — pre-filled from the page the person came from
 *   (`@/nav/page-location`), editable — and an optional screenshot, of which only the chosen
 *   file's NAME is kept: nothing is read, uploaded or stored (Appendix C M24).
 * - "Send report" runs `OperationsService.reportProblem` through `useCommand` (one command id,
 *   sent once while busy: "Sending…"). The SERVICE validates: its refusal for an empty "What
 *   happened" is the drawn validation — "One thing needs fixing" and "Say what happened, so it can
 *   be looked into" (board 07 "1a"; the contract copy catalogue holds the same words).
 * - The confirmation replaces the form in place with the reference the shared world gave the new
 *   report (SUP-…), then focus moves to it. No promise of when or by whom (ND-14).
 */
export function ReportProblem() {
  const { role, personId, home } = useWorkspaceIdentity();
  const addresses = helpAddresses(role);
  const [what, setWhat] = useState('');
  const [where, setWhere] = useState(() => originOf(personId));
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [whatMissing, setWhatMissing] = useState(false);
  const [sent, setSent] = useState<SupportReport | null>(null);
  const report = useCommand((ports) => ports.operations.reportProblem);

  useShellPage(helpPlacement(role, { kind: sent ? 'sent' : 'report' }));

  const send = () => {
    // A new attempt starts clean: an earlier refusal neither stays beside a corrected field nor
    // takes focus again before this answer arrives (a new refusal shows and focuses it again).
    setWhatMissing(false);
    report
      .run({ whatHappened: what, where, screenshotFileName: screenshot })
      .then((answer) => {
        if (answer.ok) {
          setSent(answer.value);
          return;
        }
        // Board 07 draws one field rule; the service's refusal names its field.
        const missing =
          answer.error.kind === 'validation-failed' &&
          answer.error.fieldErrors.some((error) => error.field === 'whatHappened');
        setWhatMissing(missing);
      })
      .catch(() => {
        // `unavailable` (thrown): board 07 draws no failure frame (contract ledger note); the form
        // stays as it was, so nothing typed is lost and Send can be pressed again.
      });
  };

  if (sent) {
    return <HelpReportSent reference={sent.id} reportsHref={addresses.reports} homeHref={home} />;
  }
  return (
    <PageContent wrap="form">
      <HelpReportForm
        helpHref={addresses.reports}
        what={what}
        onWhatChange={setWhat}
        where={where}
        onWhereChange={setWhere}
        onScreenshotChange={(files) => setScreenshot(files?.[0]?.name ?? null)}
        whatMissing={whatMissing}
        sending={report.busy}
        onSend={send}
      />
    </PageContent>
  );
}

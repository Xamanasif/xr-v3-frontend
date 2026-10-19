'use client';

import type { SupportReport } from '@xr/domain';
import {
  Breadcrumbs,
  Button,
  ButtonLink,
  ErrorSummary,
  Field,
  FileInput,
  FormActions,
  HelpColumn,
  LiveStatus,
  MessagePage,
  OptionalMark,
  PageHead,
  ReportFormSurface,
  Textarea,
  TextInput,
  V3Region,
} from '@xr/ui/v3';
import { type FormEvent, useEffect, useRef, useState } from 'react';

import { HELP, showsReportReferences } from '@/copy/help';
import { HELP_TITLE, helpAddresses, helpPlacement } from '@/nav/help';
import { homeLabelOf } from '@/nav/nav-config';
import { originOf } from '@/nav/page-location';
import { useCommand } from '@/queries/use-command';

import { useShellPage, useWorkspaceIdentity } from '../workspace-frame/shell-page';

const FORM_TITLE_ID = 'xs-help-form-title';
const SENT_TITLE_ID = 'xs-help-sent-title';
const WHAT_ID = 'xs-help-what';
const WHERE_ID = 'xs-help-where';
const SCREENSHOT_ID = 'xs-help-shot';

/**
 * XS-07 — Report a problem and Report sent, in the owner-approved Entry & shared design
 * (design/v3-refined-b/roles/XS-v6, `XsHelp` views `report` and `sent`), at `/<base>/help/report`.
 *
 * - The fields are the export's and nothing else (no category): "What happened?" (required),
 *   "Where did it happen?" — pre-filled from the page the person came from
 *   (`@/nav/page-location`), editable — and an optional screenshot, of which only the chosen
 *   file's NAME is kept: nothing is read, uploaded or stored (Appendix C M24).
 * - "Send report" runs `OperationsService.reportProblem` through `useCommand` (one command id,
 *   sent once while busy: "Sending…"). The SERVICE validates: its refusal for an empty "What
 *   happened" is the drawn validation — the error summary "One thing needs fixing" (which takes
 *   focus; its link focuses the field) and the field's own line. `unavailable` changes nothing:
 *   the form keeps what was typed and Send can be pressed again.
 * - "Report sent" replaces the form in place, its heading focused: the reference the shared world
 *   gave the new report (SUP-…) — none for a Super Admin (owner decision 6) — "View my reports" and
 *   the way back to the role's home. No promise of when or by whom (ND-14).
 */
export function ReportProblem() {
  const { role, personId, home } = useWorkspaceIdentity();
  const addresses = helpAddresses(role);
  const [what, setWhat] = useState('');
  const [where, setWhere] = useState(() => originOf(personId));
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [whatError, setWhatError] = useState<string | null>(null);
  const [sent, setSent] = useState<SupportReport | null>(null);
  const report = useCommand((ports) => ports.operations.reportProblem);
  const summaryRef = useRef<HTMLDivElement>(null);
  const sentTitleRef = useRef<HTMLHeadingElement>(null);

  useShellPage(helpPlacement(role, { kind: sent ? 'sent' : 'report' }));

  // "Report sent" takes focus when it replaces the form.
  useEffect(() => {
    if (sent) sentTitleRef.current?.focus();
  }, [sent]);

  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (report.busy) return;
    report
      .run({ whatHappened: what, where, screenshotFileName: screenshot })
      .then((answer) => {
        if (answer.ok) {
          setWhatError(null);
          setSent(answer.value);
          return;
        }
        // The export draws one field rule; the service's refusal names its field and its words.
        const refusal =
          answer.error.kind === 'validation-failed'
            ? answer.error.fieldErrors.find((error) => error.field === 'whatHappened')
            : undefined;
        if (refusal) {
          setWhatError(refusal.message || HELP.form.whatError);
          // A summary still on screen from the last attempt takes focus again.
          summaryRef.current?.focus();
        }
      })
      .catch(() => {
        // `unavailable` (thrown): no failure is drawn; the form stays as it was, so nothing typed
        // is lost and Send can be pressed again (state-copy `XS-07.send.failed`).
      });
  };

  if (sent) {
    return (
      <V3Region>
        <HelpColumn>
          <Breadcrumbs
            tight
            levels={[{ label: HELP_TITLE, href: addresses.reports }]}
            current={HELP.sent.title}
          />
          <MessagePage
            kind="done"
            title={HELP.sent.title}
            titleId={SENT_TITLE_ID}
            titleRef={sentTitleRef}
            primary={{ href: addresses.reports, label: HELP.sent.view }}
            secondary={{ href: home, label: HELP.sent.back(homeLabelOf(role)) }}
          >
            {showsReportReferences(role) ? (
              <>
                {HELP.sent.referenceBefore}
                <b>{sent.id}</b>
                {HELP.sent.referenceAfter}
              </>
            ) : (
              HELP.sent.withoutReference
            )}
          </MessagePage>
        </HelpColumn>
      </V3Region>
    );
  }

  return (
    <V3Region>
      <HelpColumn>
        <div>
          <Breadcrumbs
            levels={[{ label: HELP_TITLE, href: addresses.reports }]}
            current={HELP.report}
          />
          <PageHead
            title={HELP.report}
            titleId={FORM_TITLE_ID}
            titleFocusTarget
            titleFit
            lead={HELP.form.lead}
          />
        </div>
        <ReportFormSurface labelledBy={FORM_TITLE_ID} onSubmit={send}>
          <ErrorSummary
            ref={summaryRef}
            title={HELP.form.summary}
            items={whatError ? [{ fieldId: WHAT_ID, summaryText: HELP.form.whatSummary }] : []}
          />
          <Field
            id={WHAT_ID}
            label={HELP.form.what}
            hint={HELP.form.whatHint}
            error={whatError ?? undefined}
            errorPlacement="before"
          >
            <Textarea
              rows={5}
              value={what}
              onChange={(event) => {
                setWhat(event.target.value);
                // Typing clears the field's error and the summary (the export's `onWhat`).
                if (whatError && event.target.value.trim()) setWhatError(null);
              }}
            />
          </Field>
          <Field id={WHERE_ID} label={HELP.form.where} hint={HELP.form.whereHint}>
            <TextInput value={where} onChange={(event) => setWhere(event.target.value)} />
          </Field>
          <Field
            id={SCREENSHOT_ID}
            label={
              <>
                {HELP.form.screenshot} <OptionalMark>{HELP.form.optional}</OptionalMark>
              </>
            }
            hint={HELP.form.screenshotHint}
          >
            <FileInput
              accept="image/*"
              onChange={(event) => setScreenshot(event.target.files?.[0]?.name ?? null)}
            />
          </Field>
          <FormActions>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              busy={report.busy}
              spinner
              busyLabel={HELP.form.sending}
            >
              {HELP.form.send}
            </Button>
            <ButtonLink variant="ghost" size="lg" href={addresses.reports}>
              {HELP.form.cancel}
            </ButtonLink>
          </FormActions>
          <LiveStatus>{report.busy ? HELP.form.sendingStatus : ''}</LiveStatus>
        </ReportFormSurface>
      </HelpColumn>
    </V3Region>
  );
}

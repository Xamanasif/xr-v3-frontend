'use client';

import type { RequesterRequestView } from '@xr/contracts/draft';
import type { AccessPlan, RequestType } from '@xr/domain';
import {
  BackLink,
  Link,
  LoadingState,
  Notice,
  PageContent,
  PageHeader,
  Section,
  StatusPill,
  Timeline,
} from '@xr/ui';
import { useMemo } from 'react';

import { askedTermWords, quoted, REQUEST_DETAIL, sentWords } from '@/copy/institute-requests';
import { stateWords } from '@/copy/state-copy';
import {
  INSTITUTE_REQUESTS_ADDRESS,
  paymentPageAddress,
  requestDetailPlacement,
} from '@/nav/institute-requests';
import { useAppNavigation } from '@/nav/navigation';
import { useContentAccess } from '@/queries/institute-home';
import { useInstitutionRequest, useInstitutionRequests } from '@/queries/institute-requests';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { LoadFailed } from '../ia-02-content-access/institute-parts';
import {
  askedExperimentLines,
  type ExperimentNames,
  plansOf,
  REQUEST_TONE,
  requestHistoryLines,
  requestStatusWords,
  requestSummary,
  requestTitle,
  requestTypeWords,
  sentAt,
} from './request-view';
import { useExperimentNames } from './use-experiment-names';

/**
 * IA-17's request detail — board B3-08 f4 … f6 (no screen id of its own, O-02; the register's
 * PROPOSED `/institute/requests/[requestId]`): one request to BITS as its requester reads it.
 *
 * - **Reads**: `AccessRequestService.getInstitutionRequest` (the record's status, what was asked
 *   for, what BITS asked, the history; existence and scope are the adapter's answer — another
 *   institution's request is not found), the institution's request rows (`listInstitutionRequests`,
 *   for the request's kind), the published catalogue's names and the plans (`listContentAccess`,
 *   whose own history names a renewal's plan).
 * - **As B3-08 draws it**: back to Requests; "Request to BITS · REQ-0058", the title ("60 more
 *   licences"), the status chip and "Sent …"; "BITS asked for more information" with the reason
 *   quoted (f5 — no reply field: nothing leaves "Information requested", T-03); "Approved —
 *   payment required" with "Nothing changes until the payment is confirmed." and "Open the
 *   payment page" (f6), which opens PU-12 by the request's opaque address — the Institute Admin of
 *   the requesting institution may pay there (O-05; ADR-0009); "What you asked for" and "History".
 *   Undrawn states and words are provisional (state-copy `IA-17.detail.*`); a renewal or more
 *   licences never reads as a changed plan (OD-B3-09). The requester's own message shows as
 *   "Message to BITS" when the request carries one (PC-50; `IA-17.detail.message`).
 * - Nothing here writes: payment starts on PU-12 ("Continue to payment").
 */
export function InstituteRequestDetail({ requestId }: { readonly requestId: string }) {
  const request = useInstitutionRequest(requestId);
  const rows = useInstitutionRequests();
  const names = useExperimentNames();
  const content = useContentAccess();
  const view = request.data?.ok ? request.data.value : null;
  useShellPage(requestDetailPlacement(view ? view.reference : null));
  const { notFound } = useAppNavigation();
  const plans = useMemo(
    () => (content.data?.ok ? plansOf(content.data.value) : []),
    [content.data],
  );

  if (request.isError || rows.isError) {
    return (
      <PageContent wrap="read">
        <BackLink href={INSTITUTE_REQUESTS_ADDRESS}>{REQUEST_DETAIL.back}</BackLink>
        <div className="h-2" />
        <LoadFailed
          title={stateWords('IA-17.detail.failed')}
          onRetry={() => {
            void request.refetch();
            void rows.refetch();
          }}
        />
      </PageContent>
    );
  }
  if (request.data && !request.data.ok) notFound();
  if (view === null || rows.isPending || names.pending || content.isPending) {
    return (
      <PageContent wrap="read">
        <LoadingState label={stateWords('IA-17.detail.loading')} surface="section" />
      </PageContent>
    );
  }
  const row = rows.data?.ok ? rows.data.value.find((entry) => entry.id === view.reference) : null;
  // The list names the kind; a request it does not list reads by what it asked (a more-licences
  // request asks no term of its own: "Current term").
  const type: RequestType =
    row?.type ?? (view.asked.term.kind === 'current-plan' ? 'additional-licences' : 'new-access');
  return <Detail view={view} type={type} names={names.byId} plans={plans} />;
}

function Detail({
  view,
  type,
  names,
  plans,
}: {
  readonly view: RequesterRequestView;
  readonly type: RequestType;
  readonly names: ExperimentNames;
  readonly plans: readonly AccessPlan[];
}) {
  const { keys } = REQUEST_DETAIL;
  const status = requestStatusWords(view);
  const summary = requestSummary(type, view, names, plans);
  const history = requestHistoryLines(view, summary);
  const payable = view.status === 'approved-payment-required' || view.status === 'payment-failed';
  return (
    <PageContent wrap="read">
      <PageHeader
        className="mt-2 mb-4"
        back={<BackLink href={INSTITUTE_REQUESTS_ADDRESS}>{REQUEST_DETAIL.back}</BackLink>}
        overline={
          <>
            {REQUEST_DETAIL.overline} · <span className="xr-id">{view.reference}</span>
          </>
        }
        title={requestTitle(type, view, plans)}
        meta={
          <>
            <StatusPill tone={REQUEST_TONE[view.status]}>{status}</StatusPill>
            <span>{sentWords(sentAt(view))}</span>
          </>
        }
      />
      <div className="xw-stack">
        {view.status === 'information-requested' && view.whatBitsAsked ? (
          <Notice title={REQUEST_DETAIL.infoTitle}>{quoted(view.whatBitsAsked)}</Notice>
        ) : null}
        {payable ? (
          <Notice
            tone="warn"
            icon="payment"
            title={
              view.status === 'approved-payment-required' ? REQUEST_DETAIL.paymentTitle : status
            }
            actions={
              <Link className="xr-btn xr-btn--primary" href={paymentPageAddress(view.routeId)}>
                {REQUEST_DETAIL.openPayment}
              </Link>
            }
          >
            {REQUEST_DETAIL.paymentLine}
          </Notice>
        ) : null}
        <Section title={REQUEST_DETAIL.asked} headingId="request-asked">
          <div className="xr-section-body">
            <dl className="xp-kv m-0 grid grid-cols-[190px_minmax(0,1fr)] gap-x-5 gap-y-[10px] text-[15px] leading-[22px]">
              <dt className="font-[700] text-ink">{keys.type}</dt>
              <dd className="m-0 text-ink-2">{requestTypeWords(type, view.reference, plans)}</dd>
              <dt className="font-[700] text-ink">{keys.experiment}</dt>
              <dd className="m-0 text-ink-2">
                {askedExperimentLines(view, names).map((line, index) => (
                  <span key={line} className={index > 0 ? 'block' : undefined}>
                    {line}
                  </span>
                ))}
              </dd>
              <dt className="font-[700] text-ink">{keys.licences}</dt>
              <dd className="m-0 text-ink-2">{view.asked.licences}</dd>
              {view.message === null ? null : (
                <>
                  <dt className="font-[700] text-ink">{keys.message}</dt>
                  <dd className="m-0 text-ink-2">{quoted(view.message)}</dd>
                </>
              )}
              {type === 'additional-licences' ? null : (
                <>
                  <dt className="font-[700] text-ink">{keys.term}</dt>
                  <dd className="m-0 text-ink-2">{askedTermWords(view.asked.term)}</dd>
                </>
              )}
            </dl>
          </div>
        </Section>
        <Section title={REQUEST_DETAIL.history} headingId="request-history">
          <div className="xr-section-body">
            <Timeline
              events={history.map((line) => ({
                id: line.id,
                what: line.what,
                when: line.when,
                ...(line.note ? { note: line.note } : {}),
              }))}
            />
          </div>
        </Section>
      </div>
    </PageContent>
  );
}

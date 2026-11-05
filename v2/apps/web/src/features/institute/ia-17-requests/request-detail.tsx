'use client';

import type { RequesterRequestView } from '@xr/contracts/draft';
import type { AccessPlan, RequestType } from '@xr/domain';
import {
  Breadcrumbs,
  Button,
  ButtonLink,
  DefinitionList,
  IaFormatBadges,
  IaRecordGrid,
  IaRqMessage,
  IaRqStands,
  IaSectionBody,
  ListState,
  LoadingRows,
  Notice,
  PageHead,
  StatusPill,
  Surface,
  Timeline,
} from '@xr/ui/v3';
import { Fragment, type ReactNode, useMemo } from 'react';

import {
  formatsLabel,
  informationLine,
  planCreatedWords,
  quoted,
  REQUEST_DETAIL,
  REQUESTS_PAGE,
  sentWords,
} from '@/copy/institute-requests';
import { stateWords } from '@/copy/state-copy';
import { accessPlanAddress } from '@/nav/institute';
import {
  paymentPageAddress,
  REQUESTS_CRUMB,
  requestDetailPlacement,
} from '@/nav/institute-requests';
import { useAppNavigation } from '@/nav/navigation';
import { useContentAccess } from '@/queries/institute-home';
import { useInstitutionRequest, useInstitutionRequests } from '@/queries/institute-requests';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { formatCodes } from '../shared/format-codes';
import {
  askedFacts,
  createdPlanOf,
  type ExperimentNames,
  informationAskedAt,
  plansOf,
  REQUEST_TONE,
  requestFormats,
  requestHistoryLines,
  requestStands,
  requestStatusWords,
  requestSummary,
  requestTitle,
  sentAt,
} from './request-view';
import { useExperimentNames } from './use-experiment-names';

const TITLE_ID = 'request-title';

/**
 * IA-17's request detail in V3 (the owner-approved Institute Admin export, IA-v1 `Main.dc.html`
 * "IA-17 detail", `vm17detail`; no screen id of its own, O-02; the register's PROPOSED
 * `/institute/requests/[requestId]`): one request to BITS as its requester reads it.
 *
 * - **Reads**: `AccessRequestService.getInstitutionRequest` (the record's status, what was asked
 *   for, what BITS asked, the history; existence and scope are the adapter's answer — another
 *   institution's request is not found), the institution's request rows (`listInstitutionRequests`,
 *   for the request's kind), the published catalogue's names and the plans (`listContentAccess`,
 *   whose own history names a renewal's plan and whose source names the plan a request created).
 * - **As the export draws it**, named by content, never by the reference (state-copy
 *   `IA-17.no-reference`): the crumbs "Requests › <title>" (the browser tab too); "Request to
 *   BITS", the title ("60 more licences", "Renewal of your access plan", "New access · <experiment>"),
 *   the status and "Sent …"; "BITS asked for more information" with the reason quoted, when and
 *   "Reply outside the platform; there is no reply form here." (T-03); "Approved — payment
 *   required" with "Nothing changes until the payment is confirmed." and "Open the payment page"
 *   (PU-12 by the request's opaque address — the Institute Admin of the requesting institution may
 *   pay there, O-05; ADR-0009); "Access active" with the plan the request created and "View your
 *   access plan"; then the record: "What you asked for" (the facts, the formats, the requester's
 *   message, PC-50), "Where it stands" beside it (request, payment and access plan kept apart,
 *   `IA-17.detail.stands`) and "History" below. A renewal or more licences never reads as a
 *   changed plan (OD-B3-09).
 * - Nothing here writes: payment starts on PU-12 ("Continue to payment"). While the institution is
 *   paused no payment step is offered (DP-08): the service answers `nextStep: 'none'` and "Open the
 *   payment page" is not shown. Loading and a failed read
 *   draw the V3 list states under the crumbs; another institution's or no request is the in-shell
 *   not-found page (the export's "We can’t find that request" card is not adopted: the record
 *   guard does not reveal existence).
 */
export function InstituteRequestDetail({ requestId }: { readonly requestId: string }) {
  const request = useInstitutionRequest(requestId);
  const rows = useInstitutionRequests();
  const names = useExperimentNames();
  const content = useContentAccess();
  const view = request.data?.ok ? request.data.value : null;
  const { notFound } = useAppNavigation();
  const plans = useMemo(
    () => (content.data?.ok ? plansOf(content.data.value) : []),
    [content.data],
  );
  const ready = view !== null && !rows.isPending && !names.pending && !content.isPending;
  const row =
    ready && rows.data?.ok ? rows.data.value.find((entry) => entry.id === view.reference) : null;
  // The list names the kind; a request it does not list reads by what it asked (a more-licences
  // request asks no term of its own: "Current term").
  const type: RequestType | null = view
    ? (row?.type ??
      (view.asked.term.kind === 'current-plan' ? 'additional-licences' : 'new-access'))
    : null;
  const title = ready && type ? requestTitle(type, view, names.byId, plans) : null;
  useShellPage(requestDetailPlacement(title));

  if (request.isError || rows.isError) {
    return (
      <>
        <Breadcrumbs levels={[REQUESTS_CRUMB]} current={REQUEST_DETAIL.overline} />
        <Surface>
          <ListState
            kind="failed"
            titleAs="h2"
            title={stateWords('IA-17.detail.failed')}
            action={
              <Button
                onClick={() => {
                  void request.refetch();
                  void rows.refetch();
                }}
              >
                {REQUESTS_PAGE.tryAgain}
              </Button>
            }
          >
            {REQUESTS_PAGE.failedLine}
          </ListState>
        </Surface>
      </>
    );
  }
  if (request.data && !request.data.ok) notFound();
  if (!ready || type === null || title === null) {
    return (
      <Surface busy>
        <LoadingRows message={stateWords('IA-17.detail.loading')} cells={[2, 1]} rows={2} />
      </Surface>
    );
  }
  return <Detail view={view} type={type} title={title} names={names.byId} plans={plans} />;
}

/** A notice above the record: what the request's state asks of the Institute Admin. */
function StateNotice({
  view,
  plans,
}: {
  readonly view: RequesterRequestView;
  readonly plans: readonly AccessPlan[];
}): ReactNode {
  if (view.status === 'information-requested' && view.whatBitsAsked) {
    return (
      <Notice tone="info" icon="infoNote" role="status" title={REQUEST_DETAIL.infoTitle}>
        {informationLine(view.whatBitsAsked, informationAskedAt(view))}
      </Notice>
    );
  }
  if (view.status === 'approved-payment-required' || view.status === 'payment-failed') {
    // DP-08: while the institution is paused the service offers no payment step (`nextStep`
    // `none`), so "Open the payment page" is not shown; the status and its line stay.
    const payable =
      view.nextStep === 'continue-to-payment' || view.nextStep === 'try-payment-again';
    return (
      <Notice
        tone="warn"
        icon="alertTriangle"
        role="status"
        title={
          view.status === 'approved-payment-required'
            ? REQUEST_DETAIL.paymentTitle
            : requestStatusWords(view)
        }
        actions={
          payable ? (
            <ButtonLink variant="navy" href={paymentPageAddress(view.routeId)}>
              {REQUEST_DETAIL.openPayment}
            </ButtonLink>
          ) : undefined
        }
      >
        {REQUEST_DETAIL.paymentLine}
      </Notice>
    );
  }
  if (view.status === 'access-active') {
    const created = createdPlanOf(view.reference, plans);
    return (
      <Notice
        tone="ok"
        role="status"
        title={REQUEST_DETAIL.activeTitle}
        actions={
          created ? (
            <ButtonLink href={accessPlanAddress(created.id)}>{REQUEST_DETAIL.viewPlan}</ButtonLink>
          ) : null
        }
      >
        {created ? planCreatedWords(created.activatedAt) : REQUEST_DETAIL.activeByBits}
      </Notice>
    );
  }
  return null;
}

function Detail({
  view,
  type,
  title,
  names,
  plans,
}: {
  readonly view: RequesterRequestView;
  readonly type: RequestType;
  readonly title: string;
  readonly names: ExperimentNames;
  readonly plans: readonly AccessPlan[];
}) {
  const status = requestStatusWords(view);
  const summary = requestSummary(type, view, names, plans);
  const history = requestHistoryLines(view, summary);
  const formats = requestFormats(view);
  const facts = askedFacts(type, view, names, plans);
  return (
    <>
      <PageHead
        breadcrumbs={<Breadcrumbs levels={[REQUESTS_CRUMB]} current={title} />}
        variant="record"
        eyebrow={REQUEST_DETAIL.overline}
        title={title}
        titleId={TITLE_ID}
        titleFocusTarget
        meta={
          <>
            <StatusPill tone={REQUEST_TONE[view.status]}>{status}</StatusPill>
            <span>{sentWords(sentAt(view))}</span>
          </>
        }
      />
      <StateNotice view={view} plans={plans} />
      <IaRecordGrid
        main={
          <Surface labelledBy="request-asked">
            <IaSectionBody title={REQUEST_DETAIL.asked} titleId="request-asked" size="section">
              <DefinitionList
                items={[
                  ...facts.map((fact) => ({
                    term: fact.term,
                    value:
                      typeof fact.value === 'string'
                        ? fact.value
                        : fact.value.map((line, index) => (
                            <Fragment key={index}>
                              {index > 0 ? <br /> : null}
                              {line}
                            </Fragment>
                          )),
                  })),
                  ...(formats.length > 0
                    ? [
                        {
                          term: REQUEST_DETAIL.keys.formats,
                          value: (
                            <IaFormatBadges
                              flush
                              formats={formatCodes(formats)}
                              label={formatsLabel(formats)}
                            />
                          ),
                        },
                      ]
                    : []),
                ]}
              />
              {view.message === null ? null : (
                <IaRqMessage label={REQUEST_DETAIL.keys.message}>
                  {quoted(view.message)}
                </IaRqMessage>
              )}
            </IaSectionBody>
          </Surface>
        }
        side={
          <Surface labelledBy="request-stands">
            <IaSectionBody title={REQUEST_DETAIL.stand.title} titleId="request-stands">
              <IaRqStands
                items={requestStands(view, plans).map((fact) => ({
                  term: fact.term,
                  value: fact.value,
                }))}
                hint={REQUEST_DETAIL.stand.hint}
              />
            </IaSectionBody>
          </Surface>
        }
        more={
          <Surface labelledBy="request-history">
            <IaSectionBody title={REQUEST_DETAIL.history} titleId="request-history" size="section">
              <Timeline
                events={history.map((line) => ({
                  what: line.what,
                  when: line.when,
                  ...(line.note ? { note: line.note } : {}),
                }))}
              />
            </IaSectionBody>
          </Surface>
        }
      />
    </>
  );
}

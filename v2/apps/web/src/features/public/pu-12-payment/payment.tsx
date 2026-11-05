'use client';

import type { RequesterRequestView } from '@xr/contracts/draft';
import { BackLink, Button, Link, Notice } from '@xr/ui';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { CATALOGUE } from '@/copy/public';
import { PAYMENT, itemsLine, licencesLine, paymentLead, termWords } from '@/copy/request-access';
import { stateWords } from '@/copy/state-copy';
import { DocumentTitle } from '@/features/shared/document-title';
import { PublicNotFound } from '@/features/shared/pu-15-not-found/not-found';
import { useAppNavigation } from '@/nav/navigation';
import { isHidden, useRequestStatus } from '@/queries/public-request';
import { useCommand } from '@/queries/use-command';

import { statusAddress } from '../pu-10-request-status/request-status';
import { PublicMain } from '../shell/public-frame';
import { FailedBlock } from '../shared/blocks';
import { nameOf, useCatalogueNames } from '../shared/request-flow';

/** A request with a payment step now (B1-08 f0 "Continue to payment", f7 "Try payment again"). */
function payable(view: RequesterRequestView): boolean {
  return view.nextStep === 'continue-to-payment' || view.nextStep === 'try-payment-again';
}

/**
 * PU-12 Payment (B1-08 f5; Appendix A PU-12 `/requests/[requestId]/payment`): external route only,
 * a provider-neutral summary of what will be activated — the approved scope, never an amount, a
 * method, a provider, a refund or "mark paid" (ND-08, T-05). Behind the same gate as PU-10 (O-05):
 * anyone else sees the public not-found page. A request with no payment step now — internal, not
 * yet approved, pending or confirmed, or its institution paused (DP-08: the service answers
 * `nextStep: 'none'` and refuses a start `institution-paused`) — goes to its status (state-copy
 * `PU-12.not-payable`).
 *
 * "Continue to payment" starts the payment (`startPayment`). In a local prototype build the
 * sample payment provider stand-in answers it (TE-4, owner authorisation of 14 Oct 2026); the
 * request status then shows the outcome. "Payment not confirmed" and "Payment failed" come only
 * from fixtures and CI test hooks. A stale or already-started payment is refused by the service:
 * the page reads the request again and shows where it stands (P1-21).
 */
export function PaymentPage({ routeId }: { readonly routeId: string }) {
  const navigation = useAppNavigation();
  const status = useRequestStatus(routeId);
  const names = useCatalogueNames();
  const pay = useCommand((ports) => ports.accessRequests.startPayment);
  const [failed, setFailed] = useState(false);
  const leaving = useRef(false);
  const answer = status.data;
  const view = answer?.ok ? answer.value : null;

  useEffect(() => {
    if (leaving.current || !view || payable(view)) return;
    leaving.current = true;
    navigation.navigate(statusAddress(routeId), { replace: true });
  }, [view, routeId, navigation]);

  if (answer && !answer.ok && isHidden(answer.error)) return <PublicNotFound />;

  if (status.isError || (answer && !answer.ok)) {
    return (
      <>
        <DocumentTitle title={stateWords('PU-10.failed')} />
        <PublicMain className="xp-page">
          <div className="xp-in xp-in--form py-6">
            <FailedBlock
              title={stateWords('PU-10.failed')}
              line={CATALOGUE.failedLine}
              retryLabel={CATALOGUE.retry}
              onRetry={() => void status.refetch()}
            />
          </div>
        </PublicMain>
      </>
    );
  }

  if (!view || !payable(view) || (names.byId === null && !names.failed)) {
    return (
      <>
        <DocumentTitle title={PAYMENT.title} />
        <PublicMain>
          <span className="xr-sr" role="status">
            {stateWords('PU-12.loading')}
          </span>
        </PublicMain>
      </>
    );
  }

  const scope = view.approved ?? view.asked;
  const kind = view.asked.term.kind === 'current-plan' ? 'additional-licences' : 'new-access';
  const rows: readonly { readonly label: string; readonly value: ReactNode }[] = [
    { label: PAYMENT.institution, value: view.institutionName },
    { label: PAYMENT.experiments, value: itemsLine(scope.items, (id) => nameOf(names.byId, id)) },
    { label: PAYMENT.licences, value: licencesLine(kind, scope.licences) },
    { label: PAYMENT.term, value: termWords(scope.term) },
    { label: PAYMENT.request, value: <span className="xr-id">{view.reference}</span> },
  ];

  const onContinue = async () => {
    setFailed(false);
    let result;
    try {
      result = await pay.run({ request: view.routeId, expectedRev: view.rev });
    } catch {
      setFailed(true);
      window.setTimeout(() => document.getElementById('payment-failed')?.focus(), 0);
      return;
    }
    if (result.ok) {
      leaving.current = true;
      navigation.navigate(statusAddress(routeId), { replace: true });
      return;
    }
    // Refused (a stale page, a payment already started, a request no longer payable): the request
    // is read again and the page shows where it stands — or goes to its status (P1-21).
    void status.refetch();
  };

  return (
    <>
      <DocumentTitle title={PAYMENT.title} />
      <PublicMain className="xp-page">
        <div className="xp-in xp-in--form">
          <BackLink href={statusAddress(routeId)}>{PAYMENT.back}</BackLink>
          <div className="xp-phead-main mt-4 mb-7">
            <span className="xp-eyebrow">{`${PAYMENT.eyebrowBefore}${view.reference}`}</span>
            <h1 className="xp-h1">{PAYMENT.title}</h1>
            <p className="xp-lead">{paymentLead(view.institutionName)}</p>
          </div>
          {failed ? (
            <Notice
              tone="err"
              role="alert"
              id="payment-failed"
              tabIndex={-1}
              className="mb-5"
              title={stateWords('PU-12.failed')}
            >
              {stateWords('PU-12.failed-line')}
            </Notice>
          ) : null}
          <div className="xp-pay">
            <h2 className="xp-h3">{PAYMENT.activated}</h2>
            <dl className="xp-review grid-cols-[200px_minmax(0,1fr)_0]">
              {rows.map((row) => (
                <PaymentRow key={row.label} label={row.label} value={row.value} />
              ))}
            </dl>
            <Notice tone="quiet" role="note">
              {PAYMENT.note}
            </Notice>
            <div className="xp-formfoot pt-0">
              <Link href={statusAddress(routeId)}>{PAYMENT.back}</Link>
              <Button
                variant="primary"
                className="xp-cta"
                icon="payment"
                busy={pay.busy}
                busyLabel={stateWords('PU-12.busy')}
                onClick={() => void onContinue()}
              >
                {PAYMENT.continue}
              </Button>
              {pay.busy ? (
                <span className="xr-sr" role="status">
                  {stateWords('PU-12.busy-status')}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </PublicMain>
    </>
  );
}

function PaymentRow({ label, value }: { readonly label: string; readonly value: ReactNode }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
      <dd />
    </>
  );
}

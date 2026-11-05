'use client';

import { Button, Link, LoadingState, Notice } from '@xr/ui';
import { useEffect, useRef, useState } from 'react';

import { dateTime } from '@/copy/dates';
import { SIMULATED_PAYMENT } from '@/copy/prototype';
import { useAppNavigation } from '@/nav/navigation';
import { useRequestStatus } from '@/queries/public-request';
import { useSamplePaymentReport } from '@/queries/prototype';

import { statusAddress } from '../../public/pu-10-request-status/request-status';
import { DocumentTitle } from '../document-title';
import { PrototypeFrame } from './prototype-frame';

type Choice = 'confirmed' | 'failed';
type Problem = 'paused' | 'failed' | null;

/**
 * The simulated payment provider's page, `/prototype/payment?request=<address>` (owner decisions
 * DP-05, DP-06, DP-08, 5 Nov 2026; B2B milestone I3; a build that runs the sample stand-ins only).
 * It stands in for a payment provider: no amount, no payment details, no provider, nothing
 * collected. The payer — whoever may open the request (O-05) — chooses what the provider reports for
 * the payment waiting on it: Complete the payment (confirmed; access activates as the domain
 * decides), Make the payment fail (failed; the payment can be tried again from the request status),
 * or Leave it unconfirmed (nothing reported; the payment waits and can be answered here later, from
 * the prototype tools). A paused institution's payment is never completed (DP-08): the page says so
 * and the payment stays unconfirmed. Anything else — no payment waiting, an address this session may
 * not open — shows that nothing is waiting here, revealing nothing. Not a designed screen: the
 * prototype support pages' frame, the v46 components as they are.
 */
export function SamplePaymentPage({ routeId }: { readonly routeId: string | null }) {
  const status = useRequestStatus(routeId ?? '');
  const report = useSamplePaymentReport();
  const navigation = useAppNavigation();
  const [busy, setBusy] = useState<Choice | null>(null);
  const [problem, setProblem] = useState<Problem>(null);
  const noticeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (problem) noticeRef.current?.focus();
  }, [problem]);

  const view = routeId && status.data?.ok ? status.data.value : null;
  const loading = routeId !== null && !status.data && !status.isError;
  const waiting = view !== null && view.status === 'payment-not-confirmed';
  const startedAt = view
    ? [...view.history].reverse().find((entry) => entry.event === 'payment-started')?.at
    : undefined;

  const toStatus = () => {
    if (routeId) navigation.navigate(statusAddress(routeId), { replace: true });
  };

  const choose = async (outcome: Choice) => {
    if (!routeId || busy) return;
    setBusy(outcome);
    setProblem(null);
    let answer;
    try {
      answer = await report(routeId, outcome);
    } catch {
      setBusy(null);
      setProblem('failed');
      return;
    }
    if (answer.ok) {
      toStatus();
      return;
    }
    setBusy(null);
    if (answer.reason === 'institution-paused') {
      setProblem('paused');
      return;
    }
    // No longer waiting (answered in another tab) or not this session's: the page reads it again.
    void status.refetch();
  };

  return (
    <PrototypeFrame>
      <DocumentTitle title={SIMULATED_PAYMENT.title} />
      <div ref={noticeRef} tabIndex={-1} className="outline-none">
        {problem === 'paused' ? (
          <Notice tone="warn" title={SIMULATED_PAYMENT.pausedTitle}>
            {SIMULATED_PAYMENT.pausedLine}
          </Notice>
        ) : null}
        {problem === 'failed' ? (
          <Notice tone="err" title={SIMULATED_PAYMENT.failedTitle}>
            {SIMULATED_PAYMENT.failedLine}
          </Notice>
        ) : null}
      </div>
      <h1 className="xp-auth-h">{SIMULATED_PAYMENT.title}</h1>
      {loading ? (
        <LoadingState label={SIMULATED_PAYMENT.loading} surface="section" />
      ) : !waiting ? (
        <Notice tone="quiet" title={SIMULATED_PAYMENT.notWaitingTitle}>
          {SIMULATED_PAYMENT.notWaitingLine}
        </Notice>
      ) : (
        <>
          <Notice tone="info" title={SIMULATED_PAYMENT.noticeTitle}>
            {SIMULATED_PAYMENT.noticeLine}
          </Notice>
          <dl className="m-0 grid gap-2 text-[15px] leading-[22px]">
            <div className="flex flex-wrap gap-x-3">
              <dt className="text-ink-2">{SIMULATED_PAYMENT.payingFor}</dt>
              <dd className="m-0">{view.institutionName}</dd>
            </div>
            <div className="flex flex-wrap gap-x-3">
              <dt className="text-ink-2">{SIMULATED_PAYMENT.request}</dt>
              <dd className="m-0">{view.reference}</dd>
            </div>
            {startedAt ? (
              <div className="flex flex-wrap gap-x-3">
                <dt className="text-ink-2">{SIMULATED_PAYMENT.started}</dt>
                <dd className="m-0">{dateTime(startedAt)}</dd>
              </div>
            ) : null}
          </dl>
          <Button
            variant="primary"
            block
            busy={busy === 'confirmed'}
            busyLabel={SIMULATED_PAYMENT.busy}
            onClick={() => void choose('confirmed')}
          >
            {SIMULATED_PAYMENT.complete}
          </Button>
          <Button
            variant="secondary"
            block
            busy={busy === 'failed'}
            busyLabel={SIMULATED_PAYMENT.busy}
            onClick={() => void choose('failed')}
          >
            {SIMULATED_PAYMENT.fail}
          </Button>
          <Button variant="text" block onClick={toStatus}>
            {SIMULATED_PAYMENT.leave}
          </Button>
          <section aria-labelledby="simulated-payment-outcomes" className="grid gap-2">
            <h2
              id="simulated-payment-outcomes"
              className="m-0 text-[15px] font-semibold leading-[22px]"
            >
              {SIMULATED_PAYMENT.outcomesLabel}
            </h2>
            <ul className="m-0 grid gap-2 p-0 text-[14px] leading-[20px] text-ink-2">
              {SIMULATED_PAYMENT.outcomes.map((outcome) => (
                <li key={outcome.tag} className="list-none">
                  <strong className="text-ink">{outcome.tag}</strong> · {outcome.line}
                </li>
              ))}
            </ul>
          </section>
          <p className="m-0 text-[14px] leading-[20px] text-ink-2">
            {SIMULATED_PAYMENT.storedLine}
          </p>
        </>
      )}
      <div className="xp-auth-links">
        {routeId ? (
          <Link href={statusAddress(routeId)}>{SIMULATED_PAYMENT.backToStatus}</Link>
        ) : null}
        <Link href="/prototype">{SIMULATED_PAYMENT.tools}</Link>
      </div>
    </PrototypeFrame>
  );
}

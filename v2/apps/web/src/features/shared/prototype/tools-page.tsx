'use client';

import { Button, Link, LoadingState, Notice } from '@xr/ui';

import { dateTime } from '@/copy/dates';
import { PROTOTYPE_TOOLS } from '@/copy/prototype';
import {
  samplePaymentAddress,
  useSampleWorldStart,
  useWaitingSamplePayments,
} from '@/queries/prototype';

import { DocumentTitle } from '../document-title';
import { PrototypeFrame } from './prototype-frame';

/**
 * The prototype tools, `/prototype` (B2B milestones I2 and I3; owner decisions DP-06 and DP-18,
 * 5 Nov 2026; a build that runs the sample stand-ins only): the payments waiting for an outcome that
 * this browser's session may open — the recovery path of a payment left unconfirmed (DP-06) — each
 * with "Choose the outcome" on the simulated provider's page; what this browser keeps, including a
 * fresh start that replaced a save of another version (DP-18); and the reset. Not part of the
 * platform and never linked from a designed screen.
 */
export function PrototypeToolsPage() {
  const waiting = useWaitingSamplePayments();
  const kept = useSampleWorldStart();

  return (
    <PrototypeFrame>
      <DocumentTitle title={PROTOTYPE_TOOLS.title} />
      <h1 className="xp-auth-h">{PROTOTYPE_TOOLS.title}</h1>
      <p className="m-0 text-[15px] leading-[22px] text-ink-2">{PROTOTYPE_TOOLS.intro}</p>

      <section aria-labelledby="prototype-waiting" className="grid gap-3">
        <h2 id="prototype-waiting" className="m-0 text-[17px] font-semibold leading-[24px]">
          {PROTOTYPE_TOOLS.waitingTitle}
        </h2>
        {waiting.status === 'loading' ? (
          <LoadingState label={PROTOTYPE_TOOLS.loading} surface="section" />
        ) : waiting.status === 'failed' ? (
          <Notice
            tone="err"
            title={PROTOTYPE_TOOLS.failedTitle}
            actions={
              <Button variant="secondary" size="sm" icon="tryAgain" onClick={waiting.retry}>
                {PROTOTYPE_TOOLS.tryAgain}
              </Button>
            }
          >
            {PROTOTYPE_TOOLS.failedLine}
          </Notice>
        ) : waiting.status === 'not-served' || waiting.payments.length === 0 ? (
          <p className="m-0 text-[15px] leading-[22px] text-ink-2">{PROTOTYPE_TOOLS.waitingNone}</p>
        ) : (
          <ul className="m-0 grid gap-3 p-0">
            {waiting.payments.map((payment) => (
              <li key={payment.routeId} className="grid list-none gap-1 text-[15px] leading-[22px]">
                <span>
                  <strong>{payment.institutionName}</strong> · {payment.reference} ·{' '}
                  {PROTOTYPE_TOOLS.startedAt} {dateTime(payment.startedAt)}
                </span>
                <Link href={samplePaymentAddress(payment.routeId)}>{PROTOTYPE_TOOLS.choose}</Link>
              </li>
            ))}
          </ul>
        )}
        <p className="m-0 text-[14px] leading-[20px] text-ink-2">{PROTOTYPE_TOOLS.waitingNote}</p>
      </section>

      <section aria-labelledby="prototype-kept" className="grid gap-3">
        <h2 id="prototype-kept" className="m-0 text-[17px] font-semibold leading-[24px]">
          {PROTOTYPE_TOOLS.keptTitle}
        </h2>
        {kept.status === 'loading' ? (
          <LoadingState label={PROTOTYPE_TOOLS.loading} surface="section" />
        ) : (
          <p className="m-0 text-[15px] leading-[22px] text-ink-2">
            {kept.start === 'restored'
              ? PROTOTYPE_TOOLS.keptRestored
              : kept.start === 'fresh'
                ? PROTOTYPE_TOOLS.keptFresh
                : kept.start === 'replaced'
                  ? PROTOTYPE_TOOLS.keptReplaced
                  : PROTOTYPE_TOOLS.keptNone}
          </p>
        )}
        <Link href="/prototype/reset">{PROTOTYPE_TOOLS.resetLink}</Link>
      </section>

      <div className="xp-auth-links">
        <Link href="/">{PROTOTYPE_TOOLS.home}</Link>
      </div>
    </PrototypeFrame>
  );
}

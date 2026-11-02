'use client';

import type { RequesterRequestView } from '@xr/contracts/draft';
import { Button, Icon, Link, StatusPill, Timeline } from '@xr/ui';
import { useId } from 'react';

import { requestWords, wordsOf } from '@/copy/flow-state-words';
import { CATALOGUE } from '@/copy/public';
import {
  NEXT_ACTION,
  REQUEST_STATUS,
  itemsLine,
  licencesLine,
  requesterHistory,
  statusHead,
  termWords,
  updatedWords,
} from '@/copy/request-access';
import { stateWords } from '@/copy/state-copy';
import { DocumentTitle } from '@/features/shared/document-title';
import { PublicNotFound } from '@/features/shared/pu-15-not-found/not-found';
import { isHidden, useRequestStatus } from '@/queries/public-request';

import { PublicMain } from '../shell/public-frame';
import { FailedBlock } from '../shared/blocks';
import { nameOf, useCatalogueNames } from '../shared/request-flow';

/** The request's own pages, by its opaque address (O-05). */
export function statusAddress(routeId: string): string {
  return `/requests/${encodeURIComponent(routeId)}`;
}

/**
 * PU-10 Request status with the PU-13 Access active state (B1-08; Appendix A PU-10
 * `/requests/[requestId]`, PU-13 a state of it): the status in words, one next action (only when
 * there is one), what was asked for against what was approved, and a short history — nothing else
 * (B1-08 "Layout"). Approval, payment and activation are separate events with separate statuses:
 * "Approved" never reads as "active", "Payment started" never as "paid". The requester's
 * "Submitted" becomes "Under review" only from the seeded or test-only review-start fact (AD-14).
 *
 * Who may open it (owner decision DV-5 / O-05): the browser session that sent the request, by the
 * ticket it holds, or the signed-in Institute Admin of the requesting institution — the service
 * decides. Anyone else, and an address that names nothing, sees the public not-found page and
 * nothing of the request (state-copy `PU-10.not-found`). No reply field (T-03), no Declined state
 * (T-02), no "pay again" while a confirmation is pending (REQ-08).
 */
export function RequestStatusPage({ routeId }: { readonly routeId: string }) {
  const status = useRequestStatus(routeId);
  const names = useCatalogueNames();
  const answer = status.data;

  if (answer && !answer.ok && isHidden(answer.error)) {
    return <PublicNotFound />;
  }

  if (status.isError || (answer && !answer.ok)) {
    return (
      <>
        <DocumentTitle title={stateWords('PU-10.failed')} />
        <PublicMain className="xp-page">
          <div className="xp-in xp-in--read py-6">
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

  if (!answer || (names.byId === null && !names.failed)) {
    return (
      <>
        <DocumentTitle title="" />
        <PublicMain>
          <span className="xr-sr" role="status">
            {stateWords('PU-10.loading')}
          </span>
        </PublicMain>
      </>
    );
  }

  const view = answer.value;
  return (
    <>
      <DocumentTitle title={`${REQUEST_STATUS.titleBefore}${view.reference}`} />
      <PublicMain className="xp-page">
        <div className="xp-in xp-in--read">
          <div className="mb-6 flex flex-col gap-2">
            <span className="xp-eyebrow">{REQUEST_STATUS.eyebrow}</span>
            <h1 className="xp-h1">
              <span className="xr-sr">{REQUEST_STATUS.titleBefore}</span>
              {view.reference}
            </h1>
            <p className="xr-meta text-[16px]">{view.institutionName}</p>
          </div>
          <div className="xr-stack">
            <StatusHeadPanel
              view={view}
              routeId={routeId}
              checking={status.isFetching}
              onCheckAgain={() => void status.refetch()}
            />
            <Compare view={view} nameOf={(id) => nameOf(names.byId, id)} />
            <History view={view} />
          </div>
        </div>
      </PublicMain>
    </>
  );
}

const PILL_TONE = { info: 'info', wait: 'wait', err: 'err', ok: 'ok' } as const;

function StatusHeadPanel({
  view,
  routeId,
  checking,
  onCheckAgain,
}: {
  readonly view: RequesterRequestView;
  readonly routeId: string;
  readonly checking: boolean;
  readonly onCheckAgain: () => void;
}) {
  const head = statusHead(view);
  const words = wordsOf(requestWords(view, 'requester'));
  const latest = view.history.at(-1)?.at ?? view.updatedAt;
  const payment = `${statusAddress(routeId)}/payment`;
  return (
    <div
      className={
        head.tone === 'info' ? 'xp-statushead' : `xp-statushead xp-statushead--${head.tone}`
      }
      role="status"
    >
      <div className="xp-statushead-ref">
        <StatusPill tone={PILL_TONE[head.tone]}>{words}</StatusPill>
        <span className="xr-meta">{updatedWords(latest)}</span>
      </div>
      <h2 className="xp-status-title">{head.title}</h2>
      <p className="xp-status-text">{head.text}</p>
      {view.status === 'information-requested' && view.whatBitsAsked !== null ? (
        <div className="xp-reason">
          <span className="xp-reason-label">{REQUEST_STATUS.whatBitsAsked}</span>
          {`“${view.whatBitsAsked}”`}
        </div>
      ) : null}
      {view.status === 'information-requested' ? (
        <p className="xr-body text-ink-2">{REQUEST_STATUS.replyOutside}</p>
      ) : null}
      {view.status === 'approved-payment-required' && view.whyItChanged !== null ? (
        <div className="xp-reason">
          <span className="xp-reason-label">{REQUEST_STATUS.whyItChanged}</span>
          {`“${view.whyItChanged}”`}
        </div>
      ) : null}
      {view.status === 'access-active' && view.activatedPlanId !== null ? (
        <p className="xr-body text-ink-2">
          {REQUEST_STATUS.accessPlan}
          <span className="xr-id font-[700] text-ink">{view.activatedPlanId}</span>
        </p>
      ) : null}
      {view.nextStep === 'continue-to-payment' || view.nextStep === 'try-payment-again' ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link className="xr-btn xr-btn--primary" href={payment}>
            {NEXT_ACTION[view.nextStep]} <Icon name="next" />
          </Link>
        </div>
      ) : null}
      {view.nextStep === 'check-again' ? (
        <div>
          <Button
            variant="secondary"
            icon="tryAgain"
            onClick={() => {
              // A read again, never "pay again" (REQ-08; state-copy `PU-10.check-again`).
              if (!checking) onCheckAgain();
            }}
          >
            {NEXT_ACTION['check-again']}
          </Button>
        </div>
      ) : null}
      {view.nextStep === 'sign-in' ? (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Link className="xr-btn xr-btn--primary" href="/sign-in">
            {NEXT_ACTION['sign-in']} <Icon name="next" />
          </Link>
          <span className="xr-hint">{REQUEST_STATUS.signInHint}</span>
        </div>
      ) : null}
    </div>
  );
}

/** B1-08 "What you asked for and what was approved" (`table.xp-compare`; differences marked). */
function Compare({
  view,
  nameOf: name,
}: {
  readonly view: RequesterRequestView;
  readonly nameOf: (experimentId: string) => string;
}) {
  const ids = useId();
  const type = typeOf(view);
  const approved = view.approved;
  const rows: readonly {
    readonly key: 'items' | 'licences' | 'term';
    readonly label: string;
    readonly asked: string;
    readonly approved: string | null;
  }[] = [
    {
      key: 'items',
      label: REQUEST_STATUS.experiments,
      asked: itemsLine(view.asked.items, name),
      approved: approved ? itemsLine(approved.items, name) : null,
    },
    {
      key: 'licences',
      label: REQUEST_STATUS.licences,
      asked: licencesLine(type, view.asked.licences),
      approved: approved ? licencesLine(type, approved.licences) : null,
    },
    {
      key: 'term',
      label: REQUEST_STATUS.term,
      asked: termWords(view.asked.term),
      approved: approved ? termWords(approved.term) : null,
    },
  ];
  return (
    <section className="xr-section" aria-labelledby={`${ids}cmp`}>
      <div className="xr-section-head">
        <h2 id={`${ids}cmp`} className="xr-h2">
          {REQUEST_STATUS.compareTitle}
        </h2>
      </div>
      <div className="px-6 pb-6">
        <table className="xp-compare">
          <thead>
            <tr>
              <th>
                <span className="xr-sr">{REQUEST_STATUS.compareItem}</span>
              </th>
              <th>{REQUEST_STATUS.asked}</th>
              <th>{REQUEST_STATUS.approved}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const changed = approved?.changed.includes(row.key) ?? false;
              return (
                <tr key={row.key} className={changed ? 'is-diff' : undefined}>
                  <td data-label="">{row.label}</td>
                  <td data-label={REQUEST_STATUS.asked}>{row.asked}</td>
                  <td data-label={REQUEST_STATUS.approved}>
                    {row.approved === null ? (
                      <span className="xr-meta">{REQUEST_STATUS.notDecided}</span>
                    ) : (
                      <>
                        {row.approved}
                        {changed ? <span className="xp-diff">{REQUEST_STATUS.changed}</span> : null}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/**
 * The request's kind for the licences line: only a more-licences request asks for the plan's
 * "Current term" (B1-11 REQ-0040; the domain gives no other request that term), and B1-11 writes its
 * licences "60 more".
 */
function typeOf(view: RequesterRequestView): 'new-access' | 'additional-licences' | 'renewal' {
  return view.asked.term.kind === 'current-plan' ? 'additional-licences' : 'new-access';
}

function History({ view }: { readonly view: RequesterRequestView }) {
  const ids = useId();
  const lines = requesterHistory(view);
  return (
    <section className="xr-section" aria-labelledby={`${ids}hist`}>
      <div className="xr-section-head">
        <h2 id={`${ids}hist`} className="xr-h2">
          {REQUEST_STATUS.history}
        </h2>
      </div>
      <div className="xr-section-body">
        <Timeline
          lineElement="p"
          events={lines.map((line) => ({
            id: line.id,
            what: line.what,
            when: line.when,
            note: line.note,
          }))}
        />
      </div>
    </section>
  );
}

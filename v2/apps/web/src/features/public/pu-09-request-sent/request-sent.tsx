'use client';

import { Icon, Link } from '@xr/ui';
import { useEffect } from 'react';

import { REQUEST_SENT } from '@/copy/request-access';
import { stateWords } from '@/copy/state-copy';
import { DocumentTitle } from '@/features/shared/document-title';
import { useAppNavigation } from '@/nav/navigation';
import { useSentRequest } from '@/queries/request-flow';

import { PublicMain } from '../shell/public-frame';
import { RequestStepper } from '../shared/request-flow';

/**
 * PU-09 Request sent (B1-07 f2, f8; Appendix A PU-09 `/request-access/sent`): step 4 — the reference
 * to quote, and one next action, "Check request status", which continues from this browser session
 * at the request's opaque address (O-05). The reference identifies the request and is never a key
 * to it; the page promises no link, e-mail or account (R01 open). It shows only the request this
 * tab has just sent: a cold visit goes to Your selection (P1-03, state-copy `PU-09.cold-visit`).
 * Focus arrives on the heading (B1-07 `reqFocus(pid + '-h1s')`).
 */
export function RequestSentPage() {
  const navigation = useAppNavigation();
  const sent = useSentRequest();

  useEffect(() => {
    if (!sent) navigation.navigate('/selection', { replace: true });
  }, [sent, navigation]);

  if (!sent) {
    return (
      <>
        <DocumentTitle title={REQUEST_SENT.title} />
        <PublicMain>
          <span className="xr-sr" role="status">
            {stateWords('PU-07.loading')}
          </span>
        </PublicMain>
      </>
    );
  }

  return (
    <>
      <DocumentTitle title={REQUEST_SENT.title} />
      <PublicMain className="xp-page">
        <div className="xp-in xp-in--form">
          <RequestStepper current={4} />
          <div className="xr-msg mx-0 mt-2 mb-6">
            <span className="xr-msg-icon xr-x-msg-icon--ok">
              <Icon name="done" size={24} />
            </span>
            <h1 className="xr-msg-title" id="request-sent-title" tabIndex={-1}>
              {REQUEST_SENT.title}
            </h1>
            <p className="xr-body text-ink-2">
              {REQUEST_SENT.referenceBefore}
              <span className="xr-id font-[700] text-ink">{sent.reference}</span>
              {REQUEST_SENT.referenceAfter}
            </p>
            <p className="xr-body text-ink-2">{REQUEST_SENT.emptied}</p>
            <div className="xr-msg-actions">
              <Link
                className="xr-btn xr-btn--primary"
                href={`/requests/${encodeURIComponent(sent.routeId)}`}
              >
                {REQUEST_SENT.checkStatus} <Icon name="next" />
              </Link>
              <Link href="/experiments">{REQUEST_SENT.browse}</Link>
            </div>
          </div>
        </div>
      </PublicMain>
    </>
  );
}

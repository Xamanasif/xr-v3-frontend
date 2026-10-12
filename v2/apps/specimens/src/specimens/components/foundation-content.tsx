'use client';

import {
  BackLink,
  Button,
  EmptyState,
  FailedState,
  FormatBadge,
  FormatSet,
  JumpLink,
  Link,
  LoadingState,
  MessagePage,
  NoMatch,
  Notice,
  ShellBanner,
  StatusPill,
  type ShellBannerKind,
} from '@xr/ui';
import { useEffect, useRef, useState } from 'react';

/**
 * Specimens of the foundation content components (Appendix E §3.1: Link / BackLink / JumpLink,
 * FormatBadge / FormatSet, StatusPill, Notice, ShellBanner (XS-08), the four list states and
 * MessagePage). Words are the boards' sample words. Counters and the loading toggle are harness
 * state that let the browser specs prove behaviour; they are not product controls.
 */

/**
 * Boards 03 "Back link", 02 "Links and focus", 09a / 11 / B1-11 decision page with "Go to
 * decision". The external link points at a fragment: the harness never leaves the page.
 */
export function LinksSpecimen() {
  return (
    <div className="xr-app">
      <main className="xr-page">
        <div className="xr-wrap xr-content" data-probe="content">
          <BackLink href="#c-links-requests">Requests</BackLink>
          <div className="xr-phead">
            <div className="xr-phead-main">
              <span className="xr-id">REQ-0042</span>
              <h1 className="xr-h1">Godavari Institute of Technology</h1>
              <div className="xr-phead-meta">
                <StatusPill tone="info">Under review</StatusPill>
                <span>Submitted 2 Oct · 2 experiments</span>
              </div>
              <JumpLink targetId="c-links-decision" data-probe="jump" />
            </div>
          </div>
          <div className="xr-decide">
            <div className="xr-stack">
              <section className="xr-section" aria-labelledby="c-links-asked">
                <div className="xr-section-head">
                  <h2 id="c-links-asked" className="xr-h2">
                    What they asked for
                  </h2>
                </div>
                <div className="xr-section-body">
                  <p className="xr-body" id="c-links-requests">
                    Read the <Link href="#c-links-asked">lab brief</Link> before you start.
                  </p>
                  <p className="xr-body" id="c-links-delivery">
                    <Link href="#c-links-delivery" external data-probe="external">
                      Open delivery link
                    </Link>
                  </p>
                </div>
              </section>
            </div>
            <aside
              className="xr-dpanel"
              id="c-links-decision"
              tabIndex={-1}
              aria-labelledby="c-links-dp"
              data-probe="decision"
            >
              <h2 id="c-links-dp" className="xr-dpanel-title">
                Your decision
              </h2>
              <p className="xr-body">Approving does not publish.</p>
              <Button variant="primary" block>
                Approve request
              </Button>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Board 04 "Format chips · WEB · AR · VR · MR"; B2-11, B3-01 compact chips. */
export function FormatBadgeSpecimen() {
  return (
    <div className="xr-app">
      <main className="xr-page">
        <div className="xr-wrap xr-content">
          <h1 className="xr-h1">Format chips</h1>
          <div className="xr-stack">
            <p className="xr-body">
              <FormatSet formats={['WEB', 'AR', 'VR', 'MR']} />
            </p>
            <p className="xr-body">
              <FormatSet formats={['WEB', 'VR']} variant="yours" />{' '}
              <span className="xr-small">Available to you</span>
            </p>
            <p className="xr-body">
              <FormatBadge format="AR" variant="off" />{' '}
              <span className="xr-small">Not included for your institution</span>
            </p>
            <p className="xr-body">
              <FormatSet formats={['WEB', 'VR', { format: 'AR', variant: 'off' }]} compact />{' '}
              <span className="xr-sub">Formats in your plan</span>
            </p>
            <p className="xr-body">
              <FormatSet formats={['WEB', 'VR']} compact glyph={false} />
            </p>
            <div className="xw-hubhead xr-dark">
              <FormatSet formats={['WEB', 'VR']} variant="on-dark" />
              <FormatSet formats={['WEB', 'VR']} variant="on-dark" compact />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Board 04 "Status chips · tone, icon, words". */
export function StatusPillSpecimen() {
  return (
    <div className="xr-app">
      <main className="xr-page">
        <div className="xr-wrap xr-content">
          <h1 className="xr-h1">Status chips</h1>
          <div className="xr-stack">
            <div className="xr-fmt-set">
              <StatusPill tone="neutral">No access yet</StatusPill>
              <StatusPill tone="info">Under review</StatusPill>
              <StatusPill tone="wait">Waiting for a licence</StatusPill>
              <StatusPill tone="ok">Access active</StatusPill>
              <StatusPill tone="err">Payment failed</StatusPill>
              <StatusPill tone="paused">On hold</StatusPill>
              <StatusPill tone="paused" icon="readOnly">
                Read-only
              </StatusPill>
              <StatusPill tone="off">Withdrawn</StatusPill>
              <StatusPill tone="live">Live</StatusPill>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Board 03 "Notices, empty, error, loading and read-only"; board 04 "State grammar". */
export function NoticeSpecimen() {
  return (
    <div className="xr-app">
      <main className="xr-page">
        <div className="xr-wrap xr-content">
          <h1 className="xr-h1">Notices</h1>
          <div className="xr-stack">
            <Notice title="A new version of this experiment is live">
              Open the experiment to see what changed.
            </Notice>
            <Notice tone="ok" title="Access given">
              Rahul Verma can now open Shell-and-Tube Heat Exchanger.
            </Notice>
            <Notice
              tone="warn"
              title="Access plan ends on 30 Jun 2027"
              actions={<Link href="#c-notice-plan">View plan</Link>}
            >
              Renewing mirrors the current plan.
            </Notice>
            <Notice
              tone="err"
              role="status"
              title="Returned to you"
              actions={
                <Link className="xr-btn xr-btn--secondary xr-btn--sm" href="#c-notice-revise">
                  Revise and resubmit
                </Link>
              }
            >
              Prof. A. Menon · 19 Aug: “Please clarify the VR device requirements.”
            </Notice>
            <Notice tone="quiet" title="Institution sign-in isn’t available right now">
              Sign in with your e-mail and password instead.
            </Notice>
          </div>
        </div>
      </main>
    </div>
  );
}

/** B2-10 "Institution paused" / "Student inactive": the banner below the top bar. */
export function ShellBannerSpecimen({ kind }: { readonly kind: ShellBannerKind }) {
  return (
    <div className="xr-app">
      <ShellBanner kind={kind} helpHref="#c-banner-help" />
      <main className="xr-page">
        <div className="xr-wrap xr-content">
          <h1 className="xr-h1" id="c-banner-help">
            Home
          </h1>
        </div>
      </main>
    </div>
  );
}

/** Board 04 "State grammar"; board 03 "Empty", "Loading"; B1-10 frames 4–7. */
export function StatesSpecimen() {
  const [loading, setLoading] = useState(true);
  const [retries, setRetries] = useState(0);
  const [cleared, setCleared] = useState(0);
  return (
    <div className="xr-app">
      <main className="xr-page">
        <div className="xr-wrap xr-content">
          <h1 className="xr-h1">Requests</h1>
          <div className="xr-stack">
            <div className="xr-section">
              <EmptyState icon="requests" title="No requests yet">
                Requests that institutions send from the public site appear here.
              </EmptyState>
            </div>
            <div className="xr-section">
              <EmptyState
                icon="assessments"
                iconSize={24}
                title="No assessments yet"
                actions={<Button variant="primary">Create assessment</Button>}
              >
                Create an assessment for an experiment you teach.
              </EmptyState>
            </div>
            <div className="xr-section">
              <NoMatch
                title="No requests match these filters"
                onClearFilters={() => setCleared((count) => count + 1)}
              />
            </div>
            <p className="xr-meta" role="status" data-probe="cleared">
              {`Cleared ${cleared}`}
            </p>
            <FailedState
              title="We couldn’t load the requests"
              onRetry={() => setRetries((count) => count + 1)}
              reportHref="#c-states-report"
            >
              Nothing has changed. Try again.
            </FailedState>
            <p className="xr-meta" role="status" data-probe="retries">
              {`Retried ${retries}`}
            </p>
            <LoadingState label="Loading requests" loading={loading}>
              <table className="xr-table">
                <caption className="xr-sr">Institutional access requests</caption>
                <thead>
                  <tr>
                    <th scope="col">Reference</th>
                    <th scope="col">Institution</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="is-primary">
                      <Link href="#c-states-req">REQ-0042</Link>
                    </td>
                    <td data-label="Institution">Godavari Institute of Technology</td>
                    <td data-label="Status">
                      <StatusPill tone="info">Under review</StatusPill>
                    </td>
                  </tr>
                </tbody>
              </table>
            </LoadingState>
            <Button
              variant="secondary"
              onClick={() => setLoading((busy) => !busy)}
              data-probe="toggle-loading"
            >
              {loading ? 'Finish loading' : 'Load again'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Board 08 "In context · Student workspace · 1312 px": a message page inside the page area. */
export function MessagePageSpecimen() {
  return (
    <div className="xr-app">
      <main className="xr-page">
        <MessagePage
          icon="notAvailable"
          title="This experiment isn’t available to you"
          action={{ href: '#c-msg-courses', label: 'Back to My courses' }}
          secondary={{ href: '#c-msg-help', label: 'Help' }}
        >
          Your institution hasn’t given you access to Forced Convection. Experiments you can open
          are in My courses.
        </MessagePage>
      </main>
    </div>
  );
}

/**
 * B4-12 "ST-13 Assessment attempt · 1440 · interactive · 5 Nov 2026": the confirmation shown in
 * place after "Submit answers" — the focus target (`id`, `tabIndex={-1}`), a 20 px icon, the
 * lead sentence and a text-button link. The press-to-confirm swap and the focus move are harness
 * state standing in for the screen that owns them.
 */
export function MessageConfirmationSpecimen() {
  const [submitted, setSubmitted] = useState(false);
  const confirmation = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (submitted) confirmation.current?.focus();
  }, [submitted]);
  return (
    <div className="xr-app">
      <main className="xr-page">
        <div className="xr-wrap--read xr-content">
          {submitted ? (
            <MessagePage
              ref={confirmation}
              id="c-msg-done"
              tabIndex={-1}
              icon="done"
              iconSize={20}
              lead
              title="Answers submitted"
              action={{ href: '#c-msg-hub', label: 'Back to experiment' }}
              secondary={{ href: '#c-msg-result', label: 'See your result page' }}
              secondaryVariant="text"
              data-probe="confirmation"
            >
              Submitted 5 Nov 2026, 18:52. Your faculty marks written answers. Your result appears
              after the deadline: 14 Nov 2026, 23:59.
            </MessagePage>
          ) : (
            <>
              <h1 className="xr-h1">Heat Exchanger — post-lab</h1>
              <Button variant="primary" onClick={() => setSubmitted(true)} data-probe="submit">
                Submit answers
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

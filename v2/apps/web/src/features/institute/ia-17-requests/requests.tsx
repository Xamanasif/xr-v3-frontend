'use client';

import type { RequestRow } from '@xr/contracts/draft';
import type { AccessPlan } from '@xr/domain';
import {
  Button,
  EmptyState,
  Icon,
  Link,
  LoadingState,
  PageContent,
  PageHeader,
  SectionTabs,
  StatusPill,
} from '@xr/ui';
import { useEffect, useMemo, useState } from 'react';

import {
  ASK_FORM,
  REQUESTS_PAGE,
  requestKindWords,
  SENT_TITLE,
  sentLine,
} from '@/copy/institute-requests';
import { stateWords } from '@/copy/state-copy';
import {
  DEVICE_REQUESTS_ADDRESS,
  deviceRequestsPlacement,
  INSTITUTE_REQUESTS_ADDRESS,
  INSTITUTE_REQUESTS_TITLE,
  instituteRequestAddress,
  requestsPlacement,
} from '@/nav/institute-requests';
import { useAppNavigation } from '@/nav/navigation';
import { useInstituteOverview, useContentAccess } from '@/queries/institute-home';
import { useInstitutionRequest, useInstitutionRequests } from '@/queries/institute-requests';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { LoadFailed } from '../ia-02-content-access/institute-parts';
import { PausedNotice, useInstitutionPaused } from '../ia-06-people/paused';
import { DeviceRequestsTab } from '../ia-18-device-requests/device-requests';
import { AskForm, type SentRequest } from './ask-form';
import { type ExperimentNames, plansOf, requestRowView } from './request-view';
import { useExperimentNames } from './use-experiment-names';

type RequestsTab = 'bits' | 'devices';

const LIST_TITLE_ID = 'requests-title';
const FORM_TITLE_ID = 'ask-title';
const DONE_ID = 'ask-done';

/**
 * Requests — the Institute Admin's Requests destination, one page with two tabs (`nav.xr-tabs`
 * "Requests", ordinary links; Appendix A rule T2):
 *
 * - **Requests to BITS** (IA-17, `/institute/requests`; board B3-08 f0, f3, f7): "What have we
 *   asked BITS for, and where is it?" — the institution's requests (`listInstitutionRequests`),
 *   newest first, each with its reference and kind, what was asked for, its status in the
 *   Institute Admin's words and the last change (each row reads its request,
 *   `getInstitutionRequest`, for the licences and term; names from the published catalogue; a
 *   renewal's plan from the plans' own history). The reference opens the request detail.
 *   "Ask BITS for a renewal or more licences" opens the form in place (f1, f2; `AskForm`):
 *   `submitRenewalRequest` or `submitAdditionalLicencesRequest`, whose receipt (`changed: REQ`)
 *   refreshes the list, then "Request REQ-0058 sent to BITS" (f0 `done`) and "Back to Requests"
 *   (f3) — the same record the Super Admin decides (SA-02, SA-03).
 * - **Device requests** (IA-18, `?tab=devices`; B3-09 f0): `DeviceRequestsTab`. Any other `tab`
 *   shows Requests to BITS and the address becomes the bare `/institute/requests` (state-copy
 *   `IA-18.tab-address`).
 * - **Header**: the action on Requests to BITS only (B3-09 f0 draws none); not offered while the
 *   institution is paused — read-only, the paused notice shows (state-copy `IA-17.paused`) — or
 *   without a plan to renew (`IA-17.no-plan`). No licence arithmetic (D7); no plan change is ever
 *   claimed (OD-B3-09). The sidebar's Requests count stays undrawn (DEV-17).
 * - The top bar: "Requests" on Requests to BITS (and while the form shows); "Requests / Device
 *   requests" on the tab.
 */
export function InstituteRequests() {
  const navigation = useAppNavigation();
  const tabParam = new URLSearchParams(navigation.search).get('tab');
  const tab: RequestsTab = tabParam === 'devices' ? 'devices' : 'bits';
  const normalise = tabParam !== null && tab === 'bits';
  useEffect(() => {
    if (normalise) navigation.replace(INSTITUTE_REQUESTS_ADDRESS);
  }, [normalise, navigation]);
  useShellPage(
    tab === 'devices' ? deviceRequestsPlacement(REQUESTS_PAGE.tabs.devices) : requestsPlacement(),
  );

  const sessionPaused = useInstitutionPaused();
  const [refusedPaused, setRefusedPaused] = useState(false);
  const paused = sessionPaused || refusedPaused;
  const overview = useInstituteOverview();
  const plan = overview.data?.ok ? overview.data.value.plan : null;

  const [view, setView] = useState<'list' | 'form' | 'done'>('list');
  const [sent, setSent] = useState<SentRequest | null>(null);
  // The form belongs to Requests to BITS: leaving the tab closes it (state adjusted while rendering).
  const [shownTab, setShownTab] = useState(tab);
  if (shownTab !== tab) {
    setShownTab(tab);
    setView('list');
  }

  // Focus moves after the commit that shows its target (B3-08 `focus(pid + '-fh' | '-h' | '-done')`).
  const [focusRequest, setFocusRequest] = useState({ id: '', n: 0 });
  useEffect(() => {
    if (focusRequest.n === 0) return;
    document.getElementById(focusRequest.id)?.focus();
  }, [focusRequest]);
  const focus = (id: string) => setFocusRequest((current) => ({ id, n: current.n + 1 }));

  const toList = () => {
    setView('list');
    focus(LIST_TITLE_ID);
  };

  if (view === 'form' && tab === 'bits' && !paused && plan) {
    return (
      <PageContent wrap="wide">
        <AskForm
          plan={plan}
          institution={overview.data?.ok ? overview.data.value.institution : null}
          titleId={FORM_TITLE_ID}
          onCancel={toList}
          onPaused={() => {
            setRefusedPaused(true);
            toList();
          }}
          onSent={(request) => {
            setSent(request);
            setView('done');
            focus(DONE_ID);
          }}
        />
      </PageContent>
    );
  }

  if (view === 'done' && tab === 'bits' && sent) {
    return (
      <PageContent wrap="wide">
        <div className="xr-msg mx-0 my-2 items-start text-left" id={DONE_ID} tabIndex={-1}>
          <span className="xr-msg-icon xr-x-msg-icon--ok">
            <Icon name="done" />
          </span>
          <h1 className="xr-msg-title">
            {SENT_TITLE.before}
            <span className="xr-id">{sent.reference}</span>
            {SENT_TITLE.after}
          </h1>
          <p className="xr-lead m-0">{sentLine(sent.what, sent.status)}</p>
          <div className="xr-msg-actions">
            <Button variant="primary" onClick={toList}>
              {ASK_FORM.backToRequests}
            </Button>
          </div>
        </div>
      </PageContent>
    );
  }

  const canAsk = tab === 'bits' && !paused && plan !== null;
  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mb-4"
        title={INSTITUTE_REQUESTS_TITLE}
        titleId={LIST_TITLE_ID}
        titleFocusTarget
        meta={tab === 'bits' ? <span>{REQUESTS_PAGE.meta}</span> : REQUESTS_PAGE.meta}
        actions={
          canAsk ? (
            <Button
              variant="primary"
              onClick={() => {
                setView('form');
                focus(FORM_TITLE_ID);
              }}
            >
              {REQUESTS_PAGE.ask}
            </Button>
          ) : null
        }
      />
      {paused ? <PausedNotice className="mb-4" /> : null}
      <SectionTabs
        label={REQUESTS_PAGE.tabsLabel}
        tabs={[
          {
            href: INSTITUTE_REQUESTS_ADDRESS,
            label: REQUESTS_PAGE.tabs.bits,
            current: tab === 'bits',
          },
          {
            href: DEVICE_REQUESTS_ADDRESS,
            label: REQUESTS_PAGE.tabs.devices,
            current: tab === 'devices',
          },
        ]}
      />
      <div className="h-5" />
      {tab === 'devices' ? <DeviceRequestsTab paused={paused} /> : <RequestsToBits />}
    </PageContent>
  );
}

/** B3-08 f0 / f3 / f7: the table (labelled rows below 600 px of app width, as the v46 sheet does). */
function RequestsToBits() {
  const requests = useInstitutionRequests();
  const names = useExperimentNames();
  const content = useContentAccess();
  const plans = useMemo(
    () => (content.data?.ok ? plansOf(content.data.value) : []),
    [content.data],
  );
  const answer = requests.data;
  if (requests.isError || (answer && !answer.ok)) {
    return (
      <LoadFailed
        title={stateWords('IA-17.failed')}
        onRetry={() => {
          void requests.refetch();
        }}
      />
    );
  }
  if (!answer || names.pending || content.isPending) {
    return <LoadingState label={stateWords('IA-17.loading')} surface="section" />;
  }
  if (answer.value.length === 0) {
    return (
      <div className="xr-section">
        <EmptyState icon="requests" title={stateWords('IA-17.empty.title')}>
          {stateWords('IA-17.empty.line')}
        </EmptyState>
      </div>
    );
  }
  const { columns } = REQUESTS_PAGE;
  return (
    <div className="xr-table-wrap">
      <table className="xr-table">
        <caption className="xr-sr">{REQUESTS_PAGE.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{columns.request}</th>
            <th scope="col">{columns.what}</th>
            <th scope="col">{columns.status}</th>
            <th scope="col">{columns.lastChange}</th>
          </tr>
        </thead>
        <tbody>
          {answer.value.map((row) => (
            <RequestTableRow key={row.id} row={row} names={names.byId} plans={plans} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** One B3-08 row; its request's own read gives the licences, the term and the history. */
function RequestTableRow({
  row,
  names,
  plans,
}: {
  readonly row: RequestRow;
  readonly names: ExperimentNames;
  readonly plans: readonly AccessPlan[];
}) {
  const detail = useInstitutionRequest(row.id);
  const view = detail.data?.ok ? requestRowView(row.type, detail.data.value, names, plans) : null;
  const { columns } = REQUESTS_PAGE;
  return (
    <tr>
      <td className="is-primary">
        <Link href={instituteRequestAddress(row.id)} className="font-[700]">
          <span className="xr-id">{row.id}</span>
        </Link>
        <span className="xr-sub">{requestKindWords(row.type)}</span>
      </td>
      <td data-label={columns.what}>{view?.what ?? ''}</td>
      <td data-label={columns.status}>
        {view ? <StatusPill tone={view.tone}>{view.status}</StatusPill> : null}
      </td>
      <td data-label={columns.lastChange}>{view?.lastChange ?? ''}</td>
    </tr>
  );
}

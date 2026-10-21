'use client';

import type { RequesterRequestView, RequestRow } from '@xr/contracts/draft';
import {
  Button,
  ButtonLink,
  ContentStack,
  IaManageFoot,
  IaManageSurface,
  IaMessageCard,
  IaRqCrumbs,
  IaRqTable,
  type IaRqRow,
  LinkTabs,
  ListState,
  LoadingRows,
  Notice,
  PageHead,
  StatusPill,
} from '@xr/ui/v3';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  ASK_FORM,
  REQUESTS_PAGE,
  requestKindWords,
  requestRowLabel,
  requestSentDayWords,
  SENT_PAGE,
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
import { useContentAccess, useInstituteOverview } from '@/queries/institute-home';
import { useInstitutionRequest, useInstitutionRequests } from '@/queries/institute-requests';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { DeviceRequestsTab } from '../ia-18-device-requests/device-requests';
import { useInstitutionPaused } from '../shared/paused';
import { useInstituteTodayLine } from '../shared/use-today-line';
import { AskForm, type SentRequest } from './ask-form';
import {
  type ExperimentNames,
  plansOf,
  REQUEST_TONE,
  requestRowView,
  requestStatusWords,
} from './request-view';
import { useExperimentNames } from './use-experiment-names';

type RequestsTab = 'bits' | 'devices';

const LIST_TITLE_ID = 'requests-title';
const FORM_TITLE_ID = 'ask-title';
const DONE_ID = 'ask-done';
const LIST_HEADING_ID = 'requests-to-bits-h';

/**
 * Requests — the Institute Admin's Requests destination in V3 (the owner-approved Institute Admin
 * export, design/v3-refined-b/roles/IA-v1, `Main.dc.html` "Requests head and tabs", "IA-17",
 * "IA-18"): one page with two tabs (`nav.rk-tabs` "Requests", ordinary links):
 *
 * - **Requests to BITS** (IA-17, `/institute/requests`): "What have we asked BITS for, and where
 *   is it?" — the institution's requests (`listInstitutionRequests`), newest first, in the role's
 *   list table: the kind (opening the request; the whole row follows it) with when it was sent,
 *   what was asked for (each row reads its request, `getInstitutionRequest`, for the experiments,
 *   licences and term; names from the published catalogue; a renewal's plan from the plans' own
 *   history), the status in the Institute Admin's words and the last change; the footnote
 *   "Licences are shown as requested and approved by BITS." "Ask BITS for a renewal or more
 *   licences" opens the form in place (`AskForm`, crumbs "Requests › Ask BITS"):
 *   `submitRenewalRequest` or `submitAdditionalLicencesRequest`, whose receipt (`changed: REQ`)
 *   refreshes the list, then "Request sent to BITS" (crumbs "Requests › Request sent") with "View
 *   request" and "Back to Requests" — the same record the Super Admin decides (SA-02, SA-03).
 * - **Device requests** (IA-18, `?tab=devices`): `DeviceRequestsTab`. Any other `tab` shows
 *   Requests to BITS and the address becomes the bare `/institute/requests` (state-copy
 *   `IA-18.tab-address`).
 * - **Head**: the date line, "Requests", its line and the action on Requests to BITS only; not
 *   offered while the institution is paused — read-only, with the drawn notice (state-copy
 *   `IA-17.paused`) — or without a plan to renew (`IA-17.no-plan`, its notice). No licence
 *   arithmetic (D7); no plan change is ever claimed (OD-B3-09). No request is named by its
 *   reference (`IA-17.no-reference`).
 */
export function InstituteRequests() {
  const navigation = useAppNavigation();
  const tabParam = new URLSearchParams(navigation.search).get('tab');
  const tab: RequestsTab = tabParam === 'devices' ? 'devices' : 'bits';
  const normalise = tabParam !== null && tab === 'bits';
  useEffect(() => {
    if (normalise) navigation.replace(INSTITUTE_REQUESTS_ADDRESS);
  }, [normalise, navigation]);

  const today = useInstituteTodayLine();
  const sessionPaused = useInstitutionPaused();
  const [refusedPaused, setRefusedPaused] = useState(false);
  const paused = sessionPaused || refusedPaused;
  const overview = useInstituteOverview();
  const plan = overview.data?.ok ? overview.data.value.plan : null;
  const noPlan = overview.data?.ok === true && plan === null;

  const [view, setView] = useState<'list' | 'form' | 'done'>('list');
  const [sent, setSent] = useState<SentRequest | null>(null);
  // The form belongs to Requests to BITS: leaving the tab closes it (state adjusted while rendering).
  const [shownTab, setShownTab] = useState(tab);
  if (shownTab !== tab) {
    setShownTab(tab);
    setView('list');
  }
  const formShown = view === 'form' && tab === 'bits' && !paused && plan !== null;
  const doneShown = view === 'done' && tab === 'bits' && sent !== null;
  useShellPage(
    tab === 'devices'
      ? deviceRequestsPlacement(REQUESTS_PAGE.tabs.devices)
      : formShown
        ? requestsPlacement(ASK_FORM.crumb)
        : doneShown
          ? requestsPlacement(SENT_PAGE.crumb)
          : requestsPlacement(),
  );

  // Focus moves after the commit that shows its target (the export's `focusLater('ia-h1')`).
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
  const back = {
    label: INSTITUTE_REQUESTS_TITLE,
    href: INSTITUTE_REQUESTS_ADDRESS,
    onFollow: toList,
  };

  if (formShown && plan) {
    return (
      <>
        <IaRqCrumbs back={back} current={ASK_FORM.crumb} />
        <AskForm
          plan={plan}
          institution={overview.data?.ok ? overview.data.value.institution : null}
          titleId={FORM_TITLE_ID}
          date={today}
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
      </>
    );
  }

  if (doneShown && sent) {
    return (
      <>
        <IaRqCrumbs back={back} current={SENT_PAGE.crumb} />
        <IaMessageCard
          icon="check"
          titleId={DONE_ID}
          title={SENT_PAGE.title}
          actions={
            <>
              <ButtonLink variant="navy" href={instituteRequestAddress(sent.reference)}>
                {SENT_PAGE.view}
              </ButtonLink>
              <Button onClick={toList}>{SENT_PAGE.back}</Button>
            </>
          }
        >
          {sentLine(sent.what, sent.status)}
        </IaMessageCard>
      </>
    );
  }

  const canAsk = tab === 'bits' && !paused && plan !== null;
  return (
    <>
      <PageHead
        date={today}
        title={INSTITUTE_REQUESTS_TITLE}
        titleId={LIST_TITLE_ID}
        titleFocusTarget
        lead={REQUESTS_PAGE.meta}
        actions={
          canAsk ? (
            <Button
              variant="primary"
              size="lg"
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
      <ContentStack>
        <LinkTabs
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
        {tab === 'devices' ? (
          <DeviceRequestsTab paused={paused} onRetry={() => focus(LIST_TITLE_ID)} />
        ) : (
          <>
            {paused ? (
              <Notice tone="paused" icon="lock" role="status" title={REQUESTS_PAGE.pausedTitle}>
                {REQUESTS_PAGE.pausedLine}
              </Notice>
            ) : null}
            {noPlan && !paused ? (
              <Notice tone="info" icon="infoNote" role="status" title={REQUESTS_PAGE.noPlanTitle}>
                {stateWords('IA-17.no-plan')}
              </Notice>
            ) : null}
            <RequestsToBits onRetry={() => focus(LIST_TITLE_ID)} />
          </>
        )}
      </ContentStack>
    </>
  );
}

/** One request's own read, handed up so the list can show what it asked for (no words of its own). */
function RequestRead({
  id,
  onRead,
}: {
  readonly id: string;
  readonly onRead: (id: string, view: RequesterRequestView | null) => void;
}) {
  const read = useInstitutionRequest(id);
  const view = read.data?.ok ? read.data.value : null;
  useEffect(() => {
    onRead(id, view);
  }, [id, view, onRead]);
  return null;
}

/** IA-v1 "IA-17 list": the requests in the role's list table, or the list's state. */
function RequestsToBits({ onRetry }: { readonly onRetry: () => void }) {
  const requests = useInstitutionRequests();
  const names = useExperimentNames();
  const content = useContentAccess();
  const plans = useMemo(
    () => (content.data?.ok ? plansOf(content.data.value) : []),
    [content.data],
  );
  const [views, setViews] = useState<Readonly<Record<string, RequesterRequestView | null>>>({});
  const onRead = useCallback((id: string, view: RequesterRequestView | null) => {
    setViews((current) => (current[id] === view ? current : { ...current, [id]: view }));
  }, []);
  const answer = requests.data;
  const failed = requests.isError || (answer !== undefined && !answer.ok);
  const loading = !failed && (!answer || names.pending || content.isPending);

  let body;
  if (failed) {
    body = (
      <ListState
        kind="failed"
        titleAs="h2"
        title={stateWords('IA-17.failed')}
        action={
          <Button
            onClick={() => {
              void requests.refetch();
              onRetry();
            }}
          >
            {REQUESTS_PAGE.tryAgain}
          </Button>
        }
      >
        {REQUESTS_PAGE.failedLine}
      </ListState>
    );
  } else if (loading || !answer?.ok) {
    body = <LoadingRows message={stateWords('IA-17.loading')} cells={[2, 1, 1, 1]} />;
  } else if (answer.value.length === 0) {
    body = (
      <ListState kind="empty" roomy titleAs="h2" title={stateWords('IA-17.empty.title')}>
        {stateWords('IA-17.empty.line')}
      </ListState>
    );
  } else {
    body = (
      <>
        {answer.value.map((row) => (
          <RequestRead key={row.id} id={row.id} onRead={onRead} />
        ))}
        <IaRqTable
          caption={REQUESTS_PAGE.caption}
          headers={REQUESTS_PAGE.columns}
          rows={answer.value.map((row) =>
            requestRow(row, views[row.id] ?? null, names.byId, plans),
          )}
        />
        <IaManageFoot>{REQUESTS_PAGE.foot}</IaManageFoot>
      </>
    );
  }
  return (
    <IaManageSurface
      labelledBy={LIST_HEADING_ID}
      hiddenTitle={REQUESTS_PAGE.heading}
      busy={loading}
    >
      {body}
    </IaManageSurface>
  );
}

/** One row: the list's own facts (kind, sent, status) and, once read, what the request asked for. */
function requestRow(
  row: RequestRow,
  view: RequesterRequestView | null,
  names: ExperimentNames,
  plans: ReturnType<typeof plansOf>,
): IaRqRow {
  const kind = requestKindWords(row.type);
  const status = requestStatusWords({ status: row.status, reviewStarted: false });
  const facts = view ? requestRowView(row.type, view, names, plans) : null;
  return {
    key: row.id,
    name: kind,
    href: instituteRequestAddress(row.id),
    accessibleName: requestRowLabel(kind, row.receivedAt, status),
    sub: requestSentDayWords(row.receivedAt),
    what: facts?.what ?? '',
    status: <StatusPill tone={REQUEST_TONE[row.status]}>{status}</StatusPill>,
    lastChange: facts?.lastChange ?? '',
  };
}

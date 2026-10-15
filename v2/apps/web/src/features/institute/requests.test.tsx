/**
 * Phase 3 — the Institute Admin's Requests on the real composition root and the sample world:
 * IA-17 Requests to BITS, its form and its request detail (B3-08), IA-18 Device requests and IA-19
 * Device request — review & forward (B3-09), and the Phase-2 actions they enable (IA-01's
 * device-request row). Every row, status and line is the ports' answer: a request sent from the
 * form is the record the Super Admin decides (SA-02 / SA-03), and the Super Admin's decisions
 * change what the detail shows; forwarding a device request is the record the Student and the
 * Super Admin read. The Institute Admin never approves or declines a transfer (T-32), and no plan
 * change is ever claimed for a renewal or more licences (OD-B3-09).
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { asPersonId, faults } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import {
  PERSON_OF_ROLE,
  renderInTab,
  SUPER_ADMIN,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { InstituteOverview } from './ia-01-overview/overview';
import { InstituteRequestDetail } from './ia-17-requests/request-detail';
import { InstituteRequests } from './ia-17-requests/requests';
import { DeviceRequest } from './ia-19-device-request/device-request';

afterEach(() => {
  forgetLastAddress();
});

const MEERA = PERSON_OF_ROLE.tenant_admin;
const IMRAN = 'per-0006';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function inInstitute(runtime: PlatformRuntime, path: string, page: ReactNode, search = '') {
  const navigation = testNavigation(path, search);
  const view = renderInTab(
    <WorkspaceLayout workspace="institute">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

const main = () => screen.getByRole('main');
const topTitle = () => document.querySelector('.xr-top-title')?.textContent;
const crumbs = () =>
  [...document.querySelectorAll('.xr-crumbs li')].map((item) =>
    item.textContent?.replace('/', '').trim(),
  );
const rowsOf = (table: HTMLElement) => [...table.querySelectorAll('tbody tr')] as HTMLElement[];
const cells = (row: HTMLElement) =>
  [...row.querySelectorAll('td')].map((cell) => cell.textContent?.trim());

/** The Super Admin pauses Godavari (B7-04). */
async function pauseGodavari(sample: Sample) {
  const arjun = asPersonId(sample, SUPER_ADMIN);
  const detail = await arjun.institutions.getInstitution('godavari' as never);
  if (!detail.ok) throw new Error('godavari');
  const paused = await arjun.institutions.pauseInstitution({
    institutionId: detail.value.institution.id,
    reason: 'The institution asked us to pause access while it checks its student list.',
    expectedRev: detail.value.institution.rev,
  });
  if (!paused.ok) throw new Error(`pause ${JSON.stringify(paused.error)}`);
}

/** The Super Admin decides REQ-0058 on SA-03, as B3-08 f5 / f6 draw the result. */
async function decide(sample: Sample, decision: 'information' | 'approve') {
  const arjun = asPersonId(sample, SUPER_ADMIN);
  const page = await arjun.accessRequests.getRequestForDecision('REQ-0058' as never);
  if (!page.ok) throw new Error('REQ-0058');
  const answer =
    decision === 'information'
      ? await arjun.accessRequests.requestMoreInformation({
          id: page.value.request.id,
          reason: 'Please confirm the batch size for Sem II before we review the request.',
          expectedRev: page.value.request.rev,
        })
      : await arjun.accessRequests.approveRequest({
          id: page.value.request.id,
          route: null,
          expectedRev: page.value.request.rev,
        });
  if (!answer.ok) throw new Error(`${decision} ${JSON.stringify(answer.error)}`);
}

async function requestsTable() {
  return screen.findByRole('table', { name: 'Requests to BITS' });
}

// ---- IA-17 Requests to BITS (B3-08 f0, f3, f7) ----------------------------------------------------

describe('IA-17 — Requests to BITS (B3-08 f0, f3)', () => {
  it('the list: REQ-0042 as the institution’s new-access request, the tabs and the one action (f0)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    inInstitute(runtime, '/institute/requests', <InstituteRequests />);
    const table = await requestsTable();
    await waitFor(() => expect(rowsOf(table)[0]).toHaveTextContent('Access active'));
    expect(screen.getByRole('heading', { level: 1, name: 'Requests' })).toBeVisible();
    expect(main().querySelector('.xr-phead-meta')).toHaveTextContent(
      'What you’ve asked BITS for, and device requests from your students',
    );
    expect(topTitle()).toBe('Requests');
    const tabs = screen.getByRole('navigation', { name: 'Requests' });
    expect(within(tabs).getByRole('link', { name: 'Requests to BITS' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(tabs).getByRole('link', { name: 'Device requests' })).toHaveAttribute(
      'href',
      '/institute/requests?tab=devices',
    );
    expect([...table.querySelectorAll('thead th')].map((cell) => cell.textContent)).toEqual([
      'Request',
      'What you asked for',
      'Status',
      'Last change',
    ]);
    expect(rowsOf(table)).toHaveLength(1);
    const row = rowsOf(table)[0]!;
    expect(cells(row)).toEqual([
      'REQ-0042New access',
      'Shell-and-Tube Heat Exchanger · WEB and VR · 120 licences · Yearly',
      'Access active',
      'Access active since 8 Oct 2026',
    ]);
    expect(row.querySelector('.xr-status--ok')).toHaveTextContent('Access active');
    expect(within(row).getByRole('link', { name: 'REQ-0042' })).toHaveAttribute(
      'href',
      '/institute/requests/REQ-0042',
    );
    expect(
      within(main().querySelector('.xr-phead-actions') as HTMLElement).getByRole('button', {
        name: 'Ask BITS for a renewal or more licences',
      }),
    ).toHaveClass('xr-btn--primary');
  });

  it('after IA-17 on 21 Oct: REQ-0058 Under review, listed above REQ-0042 (f3)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-c');
    inInstitute(runtime, '/institute/requests', <InstituteRequests />);
    const table = await requestsTable();
    await waitFor(() => expect(rowsOf(table)[0]).toHaveTextContent('Under review'));
    expect(rowsOf(table).map(cells)).toEqual([
      [
        'REQ-0058More licences',
        '60 more licences · Shell-and-Tube Heat Exchanger',
        'Under review',
        '21 Oct 2026, 16:05',
      ],
      [
        'REQ-0042New access',
        'Shell-and-Tube Heat Exchanger · WEB and VR · 120 licences · Yearly',
        'Access active',
        'Access active since 8 Oct 2026',
      ],
    ]);
    expect(rowsOf(table)[0]!.querySelector('.xr-status--wait')).toHaveTextContent('Under review');
  });

  it('an unknown tab shows Requests to BITS and the address becomes the bare one', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    const { navigation } = inInstitute(
      runtime,
      '/institute/requests',
      <InstituteRequests />,
      '?tab=elsewhere',
    );
    expect(await requestsTable()).toBeVisible();
    expect(navigation.replace).toHaveBeenCalledWith('/institute/requests');
  });

  it('announces loading; a failed read has Try again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    faults(sample).failNext('AccessRequestService.listInstitutionRequests');
    renderInTab(<InstituteRequests />, {
      runtime,
      navigation: testNavigation('/institute/requests'),
    });
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      'Loading your requests',
    );
    const failed = await screen.findByRole('heading', { name: 'We couldn’t load your requests' });
    expect(failed.closest('.xr-empty')).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await requestsTable()).toBeVisible();
  });

  it('paused: read-only — no “Ask BITS …”, the paused notice; the list stays', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-c');
    await pauseGodavari(sample);
    await act(async () => {
      await runtime.session.refresh();
    });
    inInstitute(runtime, '/institute/requests', <InstituteRequests />);
    expect(await requestsTable()).toBeVisible();
    expect(main()).toHaveTextContent('Read-only while your institution’s access is paused');
    expect(
      screen.queryByRole('button', { name: 'Ask BITS for a renewal or more licences' }),
    ).toBeNull();
  });
});

// ---- IA-17's form (B3-08 f1, f2) and the result (f0 done) ----------------------------------------

async function openForm(runtime: PlatformRuntime) {
  const user = userEvent.setup();
  inInstitute(runtime, '/institute/requests', <InstituteRequests />);
  await user.click(
    await screen.findByRole('button', { name: 'Ask BITS for a renewal or more licences' }),
  );
  const title = await screen.findByRole('heading', {
    level: 1,
    name: 'Ask for a renewal or more licences',
  });
  await waitFor(() => expect(title).toHaveFocus());
  await screen.findByRole('region', { name: 'Organisation and contact person' });
  return user;
}

describe('IA-17 — Ask for a renewal or more licences (B3-08 f1, f2)', () => {
  it('more licences: each drawn error, then REQ sent, Under review, the same record SA-02 lists', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    const user = await openForm(runtime);
    expect(topTitle()).toBe('Requests');
    expect(main().querySelector('.xr-overline')).toHaveTextContent('Request to BITS');
    const organisation = screen.getByRole('region', { name: 'Organisation and contact person' });
    expect(organisation).toHaveTextContent('InstitutionGodavari Institute of Technology');
    expect(organisation).toHaveTextContent('Contact personMeera Iyer · meera.iyer@godavari.edu.in');
    const version = sample.worldVersion();

    // Nothing chosen: "Choose what you need" (the form's own check).
    await user.click(screen.getByRole('button', { name: 'Send request to BITS' }));
    const summary = await screen.findByRole('alert');
    expect(summary).toHaveClass('xw-errsum');
    expect(summary).toHaveTextContent('Check your request');
    expect(summary).toHaveTextContent('Choose what you need');
    await waitFor(() => expect(summary).toHaveFocus());

    await user.click(screen.getByRole('radio', { name: /More licences for experiments you hold/ }));
    expect(screen.queryByRole('alert')).toBeNull();
    const more = screen.getByRole('region', { name: 'Experiments and licences' });
    const experiment = within(more).getByRole('checkbox', {
      name: 'Shell-and-Tube Heat Exchanger · ME ZG523 · WEB and VR',
    });
    expect(experiment).toBeChecked();
    expect(within(more).getByRole('group', { name: 'Experiments in ACC-0107' })).toBeVisible();
    const licences = within(more).getByRole('textbox', { name: 'Licences requested' });
    expect(licences).toHaveAccessibleDescription(/How many more you need, as a whole number./);

    // Empty → required; "sixty" → whole number; no experiment → at least one.
    await user.click(screen.getByRole('button', { name: 'Send request to BITS' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Enter the number of licences you need',
    );
    expect(licences).toHaveAttribute('aria-invalid', 'true');
    await user.type(licences, 'sixty');
    expect(screen.queryByRole('alert')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Send request to BITS' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a whole number, like 60');
    expect(more).toHaveTextContent('Enter a whole number, like 60');
    await user.click(experiment);
    await user.clear(licences);
    await user.type(licences, '60');
    await user.click(screen.getByRole('button', { name: 'Send request to BITS' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Choose at least one experiment');
    expect(sample.worldVersion()).toBe(version);

    await user.click(experiment);
    await user.type(
      screen.getByRole('textbox', { name: 'Message to BITS (optional)' }),
      'Sem II has a larger batch than planned.',
    );
    await user.click(screen.getByRole('button', { name: 'Send request to BITS' }));
    const sent = await screen.findByRole('heading', { level: 1, name: /sent to BITS$/ });
    const reference = sent.querySelector('.xr-id')!.textContent!;
    expect(reference).toMatch(/^REQ-\d{4}$/);
    expect(sent).toHaveTextContent(`Request ${reference} sent to BITS`);
    expect(main()).toHaveTextContent(
      '60 more licences · Shell-and-Tube Heat Exchanger. Status: Under review. Each change shows here, in Requests.',
    );
    await waitFor(() => expect(document.getElementById('ask-done')).toHaveFocus());

    await user.click(screen.getByRole('button', { name: 'Back to Requests' }));
    const table = await requestsTable();
    await waitFor(() => expect(rowsOf(table)).toHaveLength(2));
    expect(cells(rowsOf(table)[0]!).slice(0, 3)).toEqual([
      `${reference}More licences`,
      '60 more licences · Shell-and-Tube Heat Exchanger',
      'Under review',
    ]);
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Requests' })).toHaveFocus(),
    );

    // The same record reaches Super Admin › Requests (SA-02).
    const rows = await asPersonId(sample, SUPER_ADMIN).accessRequests.listRequests({
      sort: 'received-newest',
    });
    expect(rows.ok && rows.value.find((row) => row.id === reference)).toMatchObject({
      type: 'additional-licences',
      status: 'under-review',
      institutionName: 'Godavari Institute of Technology',
    });
    // No plan changes on sending (nor on approval: OD-B3-09).
    const plan = await runtime.ports.institutions.getAccessPlan('ACC-0107' as never);
    expect(plan.ok && plan.value.plan.licences).toBe(120);
  });

  it('renewal mirrors the plan (f2) and is sent as “Renewal of ACC-0107”', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    const user = await openForm(runtime);
    await user.click(screen.getByRole('radio', { name: /Renew access plan ACC-0107/ }));
    const renewing = screen.getByRole('region', { name: 'The plan you’re renewing' });
    expect([...renewing.querySelectorAll('dt')].map((node) => node.textContent)).toEqual([
      'Access plan',
      'Experiment',
      'Formats',
      'Licences',
      'Term',
    ]);
    expect([...renewing.querySelectorAll('dd')].map((node) => node.textContent)).toEqual([
      'ACC-0107',
      'Shell-and-Tube Heat Exchanger · ME ZG523',
      'WEBVR',
      '120 licences',
      'Yearly · current plan ends 7 Oct 2027',
    ]);
    expect(screen.queryByRole('textbox', { name: 'Licences requested' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Send request to BITS' }));
    expect(await screen.findByRole('heading', { level: 1, name: /sent to BITS$/ })).toBeVisible();
    expect(main()).toHaveTextContent(
      'Renewal of ACC-0107. Status: Under review. Each change shows here, in Requests.',
    );
    await user.click(screen.getByRole('button', { name: 'Back to Requests' }));
    const table = await requestsTable();
    await waitFor(() => expect(rowsOf(table)[0]).toHaveTextContent('Renewal of ACC-0107'));
    expect(rowsOf(table)[0]).toHaveTextContent('Renewal');
  });

  it('Cancel and the back link return to the list, focus on its title; nothing is sent', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    const version = sample.worldVersion();
    let user = await openForm(runtime);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    const title = await screen.findByRole('heading', { level: 1, name: 'Requests' });
    await waitFor(() => expect(title).toHaveFocus());
    user = userEvent.setup();
    await user.click(
      screen.getByRole('button', { name: 'Ask BITS for a renewal or more licences' }),
    );
    await screen.findByRole('heading', { level: 1, name: 'Ask for a renewal or more licences' });
    await user.click(main().querySelector('button.xr-back') as HTMLElement);
    expect(await requestsTable()).toBeVisible();
    expect(sample.worldVersion()).toBe(version);
  });

  it('a pause meanwhile: the refusal returns to the list, read-only', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    const user = await openForm(runtime);
    await user.click(screen.getByRole('radio', { name: /Renew access plan ACC-0107/ }));
    await pauseGodavari(sample);
    await user.click(screen.getByRole('button', { name: 'Send request to BITS' }));
    expect(await requestsTable()).toBeVisible();
    expect(main()).toHaveTextContent('Read-only while your institution’s access is paused');
    expect(
      screen.queryByRole('button', { name: 'Ask BITS for a renewal or more licences' }),
    ).toBeNull();
  });
});

// ---- IA-17's request detail (B3-08 f4 … f6) ---------------------------------------------------

async function detailOf(runtime: PlatformRuntime, requestId = 'REQ-0058') {
  inInstitute(
    runtime,
    `/institute/requests/${requestId}`,
    <InstituteRequestDetail requestId={requestId} />,
  );
  return screen.findByRole('region', { name: 'History' });
}

const historyLines = (region: HTMLElement) =>
  [...region.querySelectorAll('li.xr-tl')].map((item) =>
    [...item.querySelectorAll('.xr-tl-what, .xr-tl-when, .xr-tl-note')].map(
      (line) => line.textContent,
    ),
  );

describe('IA-17 — request detail (B3-08 f4 … f6)', () => {
  it('Under review (f4): the request, what was asked for and its history', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-c');
    const history = await detailOf(runtime);
    expect(screen.getByRole('heading', { level: 1, name: '60 more licences' })).toBeVisible();
    expect(main().querySelector('.xr-back')).toHaveAttribute('href', '/institute/requests');
    expect(main().querySelector('.xr-overline')).toHaveTextContent('Request to BITS · REQ-0058');
    const meta = main().querySelector('.xr-phead-meta')!;
    expect(meta.querySelector('.xr-status--wait')).toHaveTextContent('Under review');
    expect(meta).toHaveTextContent('Sent 21 Oct 2026, 16:05');
    expect(topTitle()).toBe('REQ-0058');
    expect(crumbs()).toEqual(['Requests', 'REQ-0058']);
    const asked = screen.getByRole('region', { name: 'What you asked for' });
    expect([...asked.querySelectorAll('dt')].map((node) => node.textContent)).toEqual([
      'Request type',
      'Experiment',
      'Licences requested',
    ]);
    expect([...asked.querySelectorAll('dd')].map((node) => node.textContent)).toEqual([
      'More licences for experiments you hold',
      'Shell-and-Tube Heat Exchanger · ME ZG523 · WEB and VR',
      '60',
    ]);
    expect(historyLines(history)).toEqual([
      [
        'Sent to BITS',
        '21 Oct 2026, 16:05 · Meera Iyer',
        '60 more licences · Shell-and-Tube Heat Exchanger',
      ],
    ]);
    expect(main().querySelector('.xr-notice')).toBeNull();
  });

  it('Information requested (f5): the reason, no reply field', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-c');
    await decide(sample, 'information');
    const history = await detailOf(runtime);
    expect(main().querySelector('.xr-phead-meta .xr-status--info')).toHaveTextContent(
      'Information requested',
    );
    const notice = main().querySelector('.xw-stack > .xr-notice')!;
    expect(notice).toHaveTextContent(
      'BITS asked for more information“Please confirm the batch size for Sem II before we review the request.”',
    );
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(historyLines(history)[0]).toEqual([
      'BITS asked for more information',
      expect.stringMatching(/ · BITS$/),
      '“Please confirm the batch size for Sem II before we review the request.”',
    ]);
  });

  it('Approved — payment required (f6): “Open the payment page” opens PU-12 by its address; no plan change', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-c');
    await decide(sample, 'approve');
    const history = await detailOf(runtime);
    const notice = main().querySelector('.xw-stack > .xr-notice--warn')!;
    expect(notice).toHaveTextContent('Approved — payment required');
    expect(notice).toHaveTextContent('Nothing changes until the payment is confirmed.');
    expect(
      within(notice as HTMLElement).getByRole('link', { name: 'Open the payment page' }),
    ).toHaveAttribute('href', '/requests/rq-0012/payment');
    expect(historyLines(history)[0]).toEqual([
      'Approved — payment required',
      expect.stringMatching(/ · BITS$/),
      'Approved as asked: 60 licences',
    ]);
    expect(main()).not.toHaveTextContent(/plan (changed|updated)|licences added/i);
    const plan = await runtime.ports.institutions.getAccessPlan('ACC-0107' as never);
    expect(plan.ok && plan.value.plan.licences).toBe(120);
  });

  it('REQ-0042, the new-access request: its term and the events up to Access active', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    const history = await detailOf(runtime, 'REQ-0042');
    expect(screen.getByRole('heading', { level: 1, name: 'New access' })).toBeVisible();
    const asked = screen.getByRole('region', { name: 'What you asked for' });
    expect([...asked.querySelectorAll('dd')].map((node) => node.textContent)).toEqual([
      'New access',
      'Shell-and-Tube Heat Exchanger · ME ZG523 · WEB and VR',
      '120',
      // PC-50: the requester's own message as sent (B1-07), "Message to BITS" (B3-08 f4).
      '“We would like to start with the heat exchanger lab for our ME ZG523 cohort this term, in the browser and in VR.”',
      'Yearly',
    ]);
    expect(historyLines(history).map((line) => line[0])).toEqual([
      'Access active',
      'Payment confirmed',
      'Approved — payment required',
      'Sent to BITS',
    ]);
    expect(historyLines(history)[0]![2]).toBe('Access plan ACC-0107.');
  });

  it.each(['REQ-9999', 'REQ-0029'])(
    '%s: not this institution’s request → the in-shell not-found page',
    async (requestId) => {
      const { runtime } = await tabPlatform(MEERA, 'after-flow-c');
      inInstitute(
        runtime,
        `/institute/requests/${requestId}`,
        <InstituteRequestDetail requestId={requestId} />,
      );
      expect(await screen.findByRole('heading', { name: 'We can’t find that page' })).toBeVisible();
      expect(main()).not.toHaveTextContent(requestId);
    },
  );

  it('announces loading; a failed read has Try again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-c');
    faults(sample).failNext('AccessRequestService.getInstitutionRequest');
    renderInTab(<InstituteRequestDetail requestId="REQ-0058" />, {
      runtime,
      navigation: testNavigation('/institute/requests/REQ-0058'),
    });
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      'Loading the request',
    );
    expect(
      await screen.findByRole('heading', { name: 'We couldn’t load this request' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: '60 more licences' }),
    ).toBeVisible();
  });
});

// ---- IA-18 Device requests (B3-09 f0) ---------------------------------------------------------

async function deviceTable() {
  return screen.findByRole('table', { name: 'Device requests' });
}

describe('IA-18 — Device requests (B3-09 f0)', () => {
  it('one row per request, newest first, status in words; Review only on the one waiting', async () => {
    const { runtime } = await tabPlatform(MEERA, 'state-coverage');
    inInstitute(runtime, '/institute/requests', <InstituteRequests />, '?tab=devices');
    const table = await deviceTable();
    expect(topTitle()).toBe('Device requests');
    expect(crumbs()).toEqual(['Requests', 'Device requests']);
    expect(main()).toHaveTextContent('You forward device requests to BITS. BITS decides.');
    expect(
      screen.queryByRole('button', { name: 'Ask BITS for a renewal or more licences' }),
    ).toBeNull();
    expect(
      within(screen.getByRole('navigation', { name: 'Requests' })).getByRole('link', {
        name: 'Device requests',
      }),
    ).toHaveAttribute('aria-current', 'page');
    const [imran, rahul] = rowsOf(table);
    expect(cells(imran!)).toEqual([
      'Imran ShaikhGIT-2026-0409',
      'VR device transferDTR-0019 · 15 Nov 2026',
      'Waiting on you',
      'Review',
    ]);
    expect(imran!.querySelector('.xr-status--wait')).toHaveTextContent('Waiting on you');
    expect(
      within(imran!).getByRole('link', { name: 'Review Imran Shaikh’s request' }),
    ).toHaveAttribute('href', '/institute/requests/devices/DTR-0019');
    expect(cells(rahul!)).toEqual([
      'Rahul VermaGIT-2026-0418',
      'VR device transferDTR-0018 · 22 Oct 2026',
      'Decided · approved by BITS',
      '',
    ]);
    expect(within(rahul!).getByRole('link', { name: 'Rahul Verma' })).toHaveAttribute(
      'href',
      '/institute/requests/devices/DTR-0018',
    );
    // No approve or decline anywhere (T-32).
    expect(screen.queryByRole('button', { name: /approve|decline/i })).toBeNull();
  });

  it('no request yet: “No device request yet”', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    inInstitute(runtime, '/institute/requests', <InstituteRequests />, '?tab=devices');
    expect(await screen.findByRole('heading', { name: 'No device request yet' })).toBeVisible();
    expect(main()).toHaveTextContent(
      'When a student asks to move a headset format to another device, the request appears here for you to forward to BITS.',
    );
  });

  it('paused: the request waits, no Review', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'state-coverage');
    await pauseGodavari(sample);
    await act(async () => {
      await runtime.session.refresh();
    });
    inInstitute(runtime, '/institute/requests', <InstituteRequests />, '?tab=devices');
    const table = await deviceTable();
    expect(rowsOf(table)[0]).toHaveTextContent('Waiting on you');
    expect(screen.queryByRole('link', { name: /^Review/ })).toBeNull();
  });

  it('a failed read has Try again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'state-coverage');
    faults(sample).failNext('OperationsService.listDeviceRequests');
    inInstitute(runtime, '/institute/requests', <InstituteRequests />, '?tab=devices');
    expect(
      await screen.findByRole('heading', { name: 'We couldn’t load device requests' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await deviceTable()).toBeVisible();
  });
});

// ---- IA-19 Device request — review & forward (B3-09 f1 … f5) ------------------------------------

async function transferPage(runtime: PlatformRuntime, transferId = 'DTR-0019') {
  inInstitute(
    runtime,
    `/institute/requests/devices/${transferId}`,
    <DeviceRequest transferId={transferId} />,
  );
  return screen.findByRole('region', { name: 'What the student asked for' });
}

describe('IA-19 — review and forward (B3-09 f1 … f5)', () => {
  it('waiting on you: forward through DL-1 → “Forwarded to BITS”, the same record the Student and BITS read (f1 → f2)', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'state-coverage');
    const asked = await transferPage(runtime);
    expect(
      screen.getByRole('heading', { level: 1, name: 'VR device transfer for Imran Shaikh' }),
    ).toBeVisible();
    expect(main().querySelector('.xr-overline')).toHaveTextContent('Device request · DTR-0019');
    expect(main().querySelector('.xr-back')).toHaveAttribute(
      'href',
      '/institute/requests?tab=devices',
    );
    expect(topTitle()).toBe('DTR-0019');
    expect(crumbs()).toEqual(['Requests', 'Device requests', 'DTR-0019']);
    const status = document.getElementById('device-request-status')!;
    expect(status.querySelector('.xr-status--wait')).toHaveTextContent('Waiting on you');
    expect(status).toHaveTextContent('Requested 15 Nov 2026, 10:40 by Imran Shaikh');
    expect([...asked.querySelectorAll('dd')].map((node) => node.textContent)).toEqual([
      'Imran Shaikh · GIT-2026-0409',
      'VR for Shell-and-Tube Heat Exchanger',
      'ME lab VR headset, asset tag GIT-VR-04',
      'ME lab VR headset, asset tag GIT-VR-08',
      'No note',
    ]);
    expect(within(asked).getByRole('link', { name: 'Imran Shaikh' })).toHaveAttribute(
      'href',
      `/institute/people/students/${IMRAN}`,
    );
    expect(asked.querySelector('.xr-fmt.xr-fmt--yours')).toHaveTextContent('VR');
    const action = screen.getByRole('region', { name: 'Your action' });
    expect(action).toHaveTextContent(
      'Forward it to BITS. BITS decides; you can’t approve device transfers.',
    );
    expect(screen.queryByRole('button', { name: /approve|decline/i })).toBeNull();

    const user = userEvent.setup();
    const version = sample.worldVersion();
    const forward = within(action).getByRole('button', { name: 'Forward to BITS' });
    await user.click(forward);
    let dialog = screen.getByRole('dialog', { name: 'Forward DTR-0019 to BITS?' });
    expect(dialog).toHaveTextContent(
      'BITS decides whether Imran Shaikh can move VR to ME lab VR headset, asset tag GIT-VR-08. You can’t take it back once it’s forwarded.',
    );
    expect(dialog.querySelector('strong')).toHaveTextContent(
      'ME lab VR headset, asset tag GIT-VR-08',
    );
    expect(within(dialog).getByRole('button', { name: 'Forward to BITS' })).toHaveFocus();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(sample.worldVersion()).toBe(version);

    await user.click(forward);
    dialog = screen.getByRole('dialog', { name: 'Forward DTR-0019 to BITS?' });
    await user.click(within(dialog).getByRole('button', { name: 'Forward to BITS' }));
    await waitFor(() =>
      expect(main()).toHaveTextContent(
        'Forwarded to BITS. Imran Shaikh sees “Forwarded to BITS”. BITS decides.',
      ),
    );
    await waitFor(() => expect(document.getElementById('device-request-status')).toHaveFocus());
    expect(
      document.getElementById('device-request-status')!.querySelector('.xr-status--info'),
    ).toHaveTextContent('Forwarded to BITS');
    expect(screen.getByRole('region', { name: 'Your action' })).toHaveTextContent(
      'Forwarded. Nothing more is needed from you; BITS decides.',
    );
    expect(screen.queryByRole('button', { name: 'Forward to BITS' })).toBeNull();
    expect(
      historyLines(screen.getByRole('region', { name: 'History' })).map((line) => line[0]),
    ).toEqual(['Forwarded to BITS by Meera Iyer', 'Requested by Imran Shaikh']);

    // The Student reads "Forwarded to BITS" on My device; BITS reads it forwarded (B3-07, B3-11).
    const imran = await asPersonId(sample, IMRAN).operations.getMyDevice();
    expect(imran.ok && imran.value.openTransfer?.transfer.state).toBe('forwarded');
    const transfers = await asPersonId(sample, SUPER_ADMIN).operations.listDeviceTransfers({});
    expect(transfers.ok && transfers.value.find((entry) => entry.id === 'DTR-0019')?.state).toBe(
      'forwarded',
    );
  });

  it('moved on meanwhile: nothing written, the page shows where it stands, focus on the title', async () => {
    const { runtime } = await tabPlatform(MEERA, 'state-coverage');
    await transferPage(runtime);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Forward to BITS' }));
    // Forwarded meanwhile (another tab of the same Institute Admin): the page's revision is stale.
    const fresh = await runtime.ports.operations.getDeviceRequest('DTR-0019' as never);
    if (!fresh.ok) throw new Error('DTR-0019');
    const other = await runtime.ports.operations.forwardDeviceTransfer({
      id: fresh.value.id,
      expectedRev: fresh.value.rev,
    });
    expect(other.ok).toBe(true);
    const dialog = screen.getByRole('dialog', { name: 'Forward DTR-0019 to BITS?' });
    await user.click(within(dialog).getByRole('button', { name: 'Forward to BITS' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { level: 1, name: 'VR device transfer for Imran Shaikh' }),
      ).toHaveFocus(),
    );
    expect(main()).not.toHaveTextContent('Imran Shaikh sees “Forwarded to BITS”');
    expect(screen.getByRole('region', { name: 'Your action' })).toHaveTextContent(
      'Forwarded. Nothing more is needed from you; BITS decides.',
    );
  });

  it('institution paused: the request waits, read-only (f4)', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'state-coverage');
    await pauseGodavari(sample);
    await act(async () => {
      await runtime.session.refresh();
    });
    await transferPage(runtime);
    const notice = main().querySelector('.xr-notice--warn')!;
    expect(notice).toHaveTextContent('You can’t forward requests right now');
    expect(notice).toHaveTextContent(
      'Your institution’s access is paused. Requests wait here until BITS lifts the pause.',
    );
    expect(screen.getByRole('region', { name: 'Your action' })).toHaveTextContent(
      'Forwarding is unavailable while access is paused.',
    );
    expect(screen.queryByRole('button', { name: 'Forward to BITS' })).toBeNull();
    expect(main().querySelector('.xr-status--wait')).toHaveTextContent('Waiting on you');
  });

  it('paused while the dialog is open: the refusal shows f4, nothing written', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'state-coverage');
    await transferPage(runtime);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Forward to BITS' }));
    await pauseGodavari(sample);
    const dialog = screen.getByRole('dialog', { name: 'Forward DTR-0019 to BITS?' });
    await user.click(within(dialog).getByRole('button', { name: 'Forward to BITS' }));
    await waitFor(() =>
      expect(main()).toHaveTextContent('Forwarding is unavailable while access is paused.'),
    );
    const transfer = await runtime.ports.operations.getDeviceRequest('DTR-0019' as never);
    expect(transfer.ok && transfer.value.state).toBe('with-institute-admin');
  });

  it('decided · approved by BITS (f3): read-only, the whole history', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-device');
    await transferPage(runtime, 'DTR-0018');
    expect(main().querySelector('.xr-status--ok')).toHaveTextContent('Decided · approved by BITS');
    expect(screen.getByRole('region', { name: 'Your action' })).toHaveTextContent(
      'BITS approved this transfer. Nothing more is needed from you.',
    );
    expect(screen.queryByRole('button', { name: 'Forward to BITS' })).toBeNull();
    expect(historyLines(screen.getByRole('region', { name: 'History' }))).toEqual([
      [
        'Approved by BITS',
        '24 Oct 2026, 12:30',
        'The authorised device is now: ME lab VR headset, asset tag GIT-VR-07',
      ],
      ['Forwarded to BITS by Meera Iyer', '23 Oct 2026, 10:00'],
      [
        'Requested by Rahul Verma',
        '22 Oct 2026, 09:10',
        'From ME lab VR headset, asset tag GIT-VR-03 to ME lab VR headset, asset tag GIT-VR-07',
      ],
    ]);
    expect(screen.getByRole('region', { name: 'What the student asked for' })).toHaveTextContent(
      'GIT-VR-03 has gone for repair; the lab gave me GIT-VR-07.',
    );
  });

  it('an unknown request → the in-shell not-found page', async () => {
    const { runtime } = await tabPlatform(MEERA, 'state-coverage');
    inInstitute(
      runtime,
      '/institute/requests/devices/DTR-9999',
      <DeviceRequest transferId="DTR-9999" />,
    );
    expect(await screen.findByRole('heading', { name: 'We can’t find that page' })).toBeVisible();
  });

  it('announces loading; a failed read has Try again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'state-coverage');
    faults(sample).failNext('OperationsService.getDeviceRequest');
    renderInTab(<DeviceRequest transferId="DTR-0019" />, {
      runtime,
      navigation: testNavigation('/institute/requests/devices/DTR-0019'),
    });
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      'Loading the device request',
    );
    expect(
      await screen.findByRole('heading', { name: 'We couldn’t load this device request' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'VR device transfer for Imran Shaikh' }),
    ).toBeVisible();
  });
});

// ---- IA-01's device-request row (B2-01 f7), drawn since IA-18 is built --------------------------

describe('IA-01 — the device-request row (B2-01 f7; P3-07)', () => {
  it('a request waiting on Meera: the row, its line and “Open requests” → Device requests', async () => {
    const { runtime } = await tabPlatform(MEERA, 'state-coverage');
    inInstitute(runtime, '/institute', <InstituteOverview />);
    const region = await screen.findByRole('region', { name: 'Needs your attention' });
    const row = await waitFor(() => {
      const found = [...region.querySelectorAll('li.xr-row')].find((item) =>
        item.textContent?.includes('device request'),
      );
      if (!found) throw new Error('no device row');
      return found as HTMLElement;
    });
    expect(row.querySelector('.xr-row-title')).toHaveTextContent(
      '1 device request to forward to BITS',
    );
    expect(row.querySelector('.xr-row-sub')).toHaveTextContent('From Imran Shaikh · 15 Nov 2026');
    expect(row.querySelector('.xr-row-icon--info')).not.toBeNull();
    expect(within(row).getByRole('link', { name: 'Open requests' })).toHaveAttribute(
      'href',
      '/institute/requests?tab=devices',
    );
    const titles = [...region.querySelectorAll('.xr-row-title')].map((node) => node.textContent);
    const withoutAccess = titles.findIndex((title) => title?.includes('no access yet'));
    if (withoutAccess >= 0) {
      expect(titles.indexOf('1 device request to forward to BITS')).toBeLessThan(withoutAccess);
    }
  });

  it('nothing waiting: no row (the decided DTR-0018 is not counted)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-device');
    inInstitute(runtime, '/institute', <InstituteOverview />);
    const region = await screen.findByRole('region', { name: 'Needs your attention' });
    expect(region).not.toHaveTextContent('device request');
  });
});

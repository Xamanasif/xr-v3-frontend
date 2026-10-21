/**
 * Phase 3 in V3 — the Institute Admin's Requests on the real composition root and the sample world,
 * as the owner-approved Institute Admin export draws them (design/v3-refined-b/roles/IA-v1):
 * IA-17 Requests to BITS, its form, its result and its request detail, IA-18 Device requests and
 * IA-19 Device request — review & forward, and the Phase-2 actions they enable (IA-01's
 * device-request row). Every row, status and line is the ports' answer: a request sent from the
 * form is the record the Super Admin decides (SA-02 / SA-03), and the Super Admin's decisions
 * change what the detail shows; forwarding a device request is the record the Student and the
 * Super Admin read. The Institute Admin never approves or declines a transfer (T-32), no plan
 * change is ever claimed for a renewal or more licences (OD-B3-09), and no page names a request,
 * an access plan or a device request by its internal reference (state-copy `IA-17.no-reference`).
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
const RAHUL = PERSON_OF_ROLE.student;

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
/** The browser tab's words before the product's name. */
const tabTitle = () => document.title.replace(/ · XR Learning Platform$/, '');
/** The page's own crumbs (V3 draws them in the page): each level, then this page. */
const crumbs = () =>
  [
    ...main().querySelectorAll(
      'nav[aria-label="Breadcrumb"] > a, nav[aria-label="Breadcrumb"] > [aria-current="page"]',
    ),
  ].map((item) => item.textContent);
const crumbLink = (name: string) =>
  within(main().querySelector('nav[aria-label="Breadcrumb"]') as HTMLElement).getByRole('link', {
    name,
  });
const rowsOf = (table: HTMLElement) => [...table.querySelectorAll('tbody tr')] as HTMLElement[];
const cells = (row: HTMLElement) =>
  [...row.querySelectorAll('td')].map((cell) => cell.textContent?.trim());
const terms = (region: HTMLElement, list = 'dl') =>
  [...region.querySelectorAll(`${list} dt`)].map((node) => node.textContent);
const values = (region: HTMLElement, list = 'dl') =>
  [...region.querySelectorAll(`${list} dd`)].map((node) => node.textContent);

/** An internal reference (the owner's identifier rule, state-copy `IA-17.no-reference`). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

/**
 * No internal reference anywhere a person meets it: the page's words (closed dialogs too), the
 * accessible names, titles and placeholders, the fields' values and the browser tab.
 */
function expectNoReference(): void {
  expect(document.body.textContent ?? '').not.toMatch(REFERENCE);
  for (const control of document.querySelectorAll('input, textarea')) {
    expect((control as HTMLInputElement | HTMLTextAreaElement).value).not.toMatch(REFERENCE);
  }
  for (const element of document.querySelectorAll('[aria-label], [title], [placeholder]')) {
    for (const name of ['aria-label', 'title', 'placeholder']) {
      expect(element.getAttribute(name) ?? '').not.toMatch(REFERENCE);
    }
  }
  expect(document.title).not.toMatch(REFERENCE);
}

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

/** The Super Admin decides REQ-0058 on SA-03. */
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
  return screen.findByRole('table', { name: 'Requests to BITS, newest first' });
}

// ---- IA-17 Requests to BITS (IA-v1 "IA-17 list") --------------------------------------------------

describe('IA-17 — Requests to BITS (IA-v1 list)', () => {
  it('the list: the institution’s new-access request named by its kind and date, the tabs and the one action', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    inInstitute(runtime, '/institute/requests', <InstituteRequests />);
    const table = await requestsTable();
    await waitFor(() => expect(cells(rowsOf(table)[0]!)[1]).not.toBe(''));
    expect(screen.getByRole('heading', { level: 1, name: 'Requests' })).toBeVisible();
    expect(main().querySelector('.rk-head .rk-sub')).toHaveTextContent(
      'What you’ve asked BITS for, and device requests from your students',
    );
    expect(tabTitle()).toBe('Requests');
    expect(crumbs()).toEqual([]);
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
      'New accessSent 2 Oct 2026',
      'Shell-and-Tube Heat Exchanger · WEB and VR · 120 licences · Yearly',
      'Access active',
      'Last change8 Oct 2026, 15:05',
    ]);
    expect(row.querySelector('.xr-st--ok')).toHaveTextContent('Access active');
    expect(
      within(row).getByRole('link', {
        name: 'New access, sent 2 Oct 2026, Access active. Open the request',
      }),
    ).toHaveAttribute('href', '/institute/requests/REQ-0042');
    expect(row).toHaveClass('is-link');
    expect(main().querySelector('.ia-gm-foot')).toHaveTextContent(
      'Licences are shown as requested and approved by BITS.',
    );
    expect(
      within(main().querySelector('.rk-head-act') as HTMLElement).getByRole('button', {
        name: 'Ask BITS for a renewal or more licences',
      }),
    ).toHaveClass('rb-btn--primary');
    expectNoReference();
  });

  it('after IA-17 on 21 Oct: the more-licences request Under review, listed above the new-access one', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-c');
    inInstitute(runtime, '/institute/requests', <InstituteRequests />);
    const table = await requestsTable();
    await waitFor(() => expect(cells(rowsOf(table)[0]!)[1]).not.toBe(''));
    await waitFor(() => expect(cells(rowsOf(table)[1]!)[1]).not.toBe(''));
    expect(rowsOf(table).map(cells)).toEqual([
      [
        'More licencesSent 21 Oct 2026',
        '60 more licences · Shell-and-Tube Heat Exchanger',
        'Under review',
        'Last change21 Oct 2026, 16:05',
      ],
      [
        'New accessSent 2 Oct 2026',
        'Shell-and-Tube Heat Exchanger · WEB and VR · 120 licences · Yearly',
        'Access active',
        'Last change8 Oct 2026, 15:05',
      ],
    ]);
    expect(rowsOf(table)[0]!.querySelector('.xr-st--info')).toHaveTextContent('Under review');
    expect(
      within(rowsOf(table)[0]!).getByRole('link', {
        name: 'More licences, sent 21 Oct 2026, Under review. Open the request',
      }),
    ).toHaveAttribute('href', '/institute/requests/REQ-0058');
    expectNoReference();
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

  it('announces loading; a failed read has Try again, which reads again', async () => {
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
    expect(failed.closest('.rk-state')).toHaveTextContent('Nothing has changed. Try again.');
    expect(failed.closest('.rk-state')).toHaveAttribute('role', 'alert');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await requestsTable()).toBeVisible();
  });

  it('paused: read-only — no “Ask BITS …”, the drawn notice; the list stays', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-c');
    await pauseGodavari(sample);
    await act(async () => {
      await runtime.session.refresh();
    });
    inInstitute(runtime, '/institute/requests', <InstituteRequests />);
    expect(await requestsTable()).toBeVisible();
    const notice = main().querySelector('.rk-notice--paused')!;
    expect(notice).toHaveTextContent(
      'You can’t ask BITS for anything while your institution’s access is paused',
    );
    expect(notice).toHaveTextContent(
      'Your requests and their history stay here. You can ask again when BITS lifts the pause.',
    );
    expect(
      screen.queryByRole('button', { name: 'Ask BITS for a renewal or more licences' }),
    ).toBeNull();
    expectNoReference();
  });
});

// ---- IA-17's form (IA-v1 "IA-17 form") and the result ("sent") -----------------------------------

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

/** The new request's reference, read from its address ("View request"), never from the page's words. */
function sentReference(): string {
  const href = screen.getByRole('link', { name: 'View request' }).getAttribute('href') ?? '';
  const reference = /\/institute\/requests\/(REQ-\d{4})$/.exec(href)?.[1];
  if (!reference) throw new Error(`no request address: ${href}`);
  return reference;
}

describe('IA-17 — Ask for a renewal or more licences (IA-v1 form, sent)', () => {
  it('more licences: each drawn error, then sent, Under review, the same record SA-02 lists', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    const user = await openForm(runtime);
    expect(tabTitle()).toBe('Ask BITS · Requests');
    expect(crumbs()).toEqual(['Requests', 'Ask BITS']);
    expect(crumbLink('Requests')).toHaveAttribute('href', '/institute/requests');
    expect(main().querySelector('.rk-head .rk-eyebrow')).toHaveTextContent('Request to BITS');
    expect(
      screen.getByRole('form', { name: 'Ask for a renewal or more licences' }),
    ).toHaveAttribute('novalidate');
    const organisation = screen.getByRole('region', { name: 'Organisation and contact person' });
    expect(organisation).toHaveTextContent('InstitutionGodavari Institute of Technology');
    expect(organisation).toHaveTextContent('Contact personMeera Iyer · meera.iyer@godavari.edu.in');
    const version = sample.worldVersion();

    // Nothing chosen: "Choose what you need" (the form's own check).
    await user.click(screen.getByRole('button', { name: 'Send request to BITS' }));
    const summary = await screen.findByRole('alert');
    expect(summary).toHaveClass('rk-errsum');
    expect(summary).toHaveTextContent('Check your request');
    expect(summary).toHaveTextContent('Choose what you need');
    await waitFor(() => expect(summary).toHaveFocus());
    expect(screen.getByRole('group', { name: 'What you need' })).toHaveAccessibleDescription(
      'Choose what you need',
    );

    await user.click(screen.getByRole('radio', { name: 'More licences for experiments you hold' }));
    expect(screen.queryByRole('alert')).toBeNull();
    const more = screen.getByRole('region', { name: 'Experiments and licences' });
    const experiment = within(more).getByRole('checkbox', {
      name: 'Shell-and-Tube Heat Exchanger · ME ZG523',
    });
    expect(experiment).toBeChecked();
    expect(experiment).toHaveAccessibleDescription('WEB and VR · in your access plan');
    expect(
      within(more).getByRole('group', { name: 'Experiments in your access plan' }),
    ).toBeVisible();
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
    const sent = await screen.findByRole('heading', { level: 1, name: 'Request sent to BITS' });
    const reference = sentReference();
    expect(main()).toHaveTextContent(
      '60 more licences · Shell-and-Tube Heat Exchanger. Status: Under review. Each change shows here, in Requests.',
    );
    await waitFor(() => expect(document.getElementById('ask-done')).toHaveFocus());
    expect(sent).toHaveAttribute('id', 'ask-done');
    expect(crumbs()).toEqual(['Requests', 'Request sent']);
    expect(tabTitle()).toBe('Request sent · Requests');
    expectNoReference();

    await user.click(screen.getByRole('button', { name: 'Back to Requests' }));
    const table = await requestsTable();
    await waitFor(() => expect(rowsOf(table)).toHaveLength(2));
    await waitFor(() => expect(cells(rowsOf(table)[0]!)[1]).not.toBe(''));
    expect(cells(rowsOf(table)[0]!)[0]).toMatch(/^More licencesSent /);
    expect(cells(rowsOf(table)[0]!).slice(1, 3)).toEqual([
      '60 more licences · Shell-and-Tube Heat Exchanger',
      'Under review',
    ]);
    expect(within(rowsOf(table)[0]!).getByRole('link', { name: /^More licences/ })).toHaveAttribute(
      'href',
      `/institute/requests/${reference}`,
    );
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

  it('renewal mirrors the plan, is sent as “Renewal of your access plan” and is noted as open', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    let user = await openForm(runtime);
    expect(screen.queryByRole('note')).toBeNull();
    await user.click(screen.getByRole('radio', { name: 'Renew your access plan' }));
    const renewing = screen.getByRole('region', { name: 'The plan you’re renewing' });
    expect(terms(renewing)).toEqual(['Experiment', 'Formats', 'Licences', 'Term']);
    expect(values(renewing)).toEqual([
      'Shell-and-Tube Heat Exchanger · ME ZG523',
      'WEBVR',
      '120 licences',
      'Yearly · current plan ends 7 Oct 2027',
    ]);
    expect(
      within(renewing).getByRole('img', { name: 'Formats in your access plan: WEB, VR' }),
    ).toBeVisible();
    expect(screen.queryByRole('textbox', { name: 'Licences requested' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Send request to BITS' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Request sent to BITS' }),
    ).toBeVisible();
    expect(main()).toHaveTextContent(
      'Renewal of your access plan. Status: Under review. Each change shows here, in Requests.',
    );
    expectNoReference();
    await user.click(screen.getByRole('button', { name: 'Back to Requests' }));
    const table = await requestsTable();
    await waitFor(() => expect(rowsOf(table)[0]).toHaveTextContent('Renewal of your access plan'));
    expect(cells(rowsOf(table)[0]!)[0]).toMatch(/^RenewalSent /);
    expectNoReference();

    // The form again: the renewal still with BITS is noted under "What you need".
    user = userEvent.setup();
    await user.click(
      screen.getByRole('button', { name: 'Ask BITS for a renewal or more licences' }),
    );
    const note = await screen.findByRole('note');
    expect(note).toHaveTextContent('You’ve already asked for a renewal');
    expect(note).toHaveTextContent(
      /Renewal sent \d{1,2} \w{3} \d{4} · Under review\. You can still send another request; BITS sees both\./,
    );
    expectNoReference();
  });

  it('Cancel and the crumb return to the list, focus on its title; nothing is sent', async () => {
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
    await user.click(crumbLink('Requests'));
    expect(await requestsTable()).toBeVisible();
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Requests' })).toHaveFocus(),
    );
    expect(sample.worldVersion()).toBe(version);
  });

  it('a pause meanwhile: the refusal returns to the list, read-only', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    const user = await openForm(runtime);
    await user.click(screen.getByRole('radio', { name: 'Renew your access plan' }));
    await pauseGodavari(sample);
    await user.click(screen.getByRole('button', { name: 'Send request to BITS' }));
    expect(await requestsTable()).toBeVisible();
    expect(main()).toHaveTextContent(
      'You can’t ask BITS for anything while your institution’s access is paused',
    );
    expect(
      screen.queryByRole('button', { name: 'Ask BITS for a renewal or more licences' }),
    ).toBeNull();
  });
});

// ---- IA-17's request detail (IA-v1 "IA-17 detail") -----------------------------------------------

async function detailOf(runtime: PlatformRuntime, requestId = 'REQ-0058') {
  inInstitute(
    runtime,
    `/institute/requests/${requestId}`,
    <InstituteRequestDetail requestId={requestId} />,
  );
  return screen.findByRole('region', { name: 'History' });
}

const historyLines = (region: HTMLElement) =>
  [...region.querySelectorAll('ol.rk-tl > li')].map((item) =>
    [...item.querySelectorAll('.rk-tl-w, .rk-tl-t, .rk-tl-n')].map((line) => line.textContent),
  );

const stands = () => screen.getByRole('region', { name: 'Where it stands' });

describe('IA-17 — request detail (IA-v1 detail)', () => {
  it('Under review: the request named by what it asks, what was asked for, where it stands, its history', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-c');
    const history = await detailOf(runtime);
    expect(screen.getByRole('heading', { level: 1, name: '60 more licences' })).toBeVisible();
    expect(crumbs()).toEqual(['Requests', '60 more licences']);
    expect(crumbLink('Requests')).toHaveAttribute('href', '/institute/requests');
    expect(tabTitle()).toBe('60 more licences · Requests');
    expect(main().querySelector('.rk-head .rk-eyebrow')).toHaveTextContent('Request to BITS');
    const meta = main().querySelector('.rk-head .rk-meta')!;
    expect(meta.querySelector('.xr-st--info')).toHaveTextContent('Under review');
    expect(meta).toHaveTextContent('Sent 21 Oct 2026, 16:05');
    const asked = screen.getByRole('region', { name: 'What you asked for' });
    expect(terms(asked)).toEqual(['Request type', 'Experiment', 'Licences requested', 'Formats']);
    expect(values(asked)).toEqual([
      'More licences for experiments you hold',
      'Shell-and-Tube Heat Exchanger · ME ZG523',
      '60',
      'WEBVR',
    ]);
    expect(within(asked).getByRole('img', { name: 'Formats: WEB, VR' })).toBeVisible();
    expect(asked.querySelector('.rk-quote')).toBeNull();
    expect(terms(stands())).toEqual(['Request', 'Payment', 'Your access plan']);
    expect(values(stands())).toEqual(['Under review', 'Not started', 'Unchanged']);
    expect(stands()).toHaveTextContent(
      'Review, payment and your access plan are separate steps. A request doesn’t change your plan by itself.',
    );
    expect(historyLines(history)).toEqual([
      [
        'Sent to BITS',
        '21 Oct 2026, 16:05 · Meera Iyer',
        '60 more licences · Shell-and-Tube Heat Exchanger',
      ],
    ]);
    expect(main().querySelector('.rk-notice')).toBeNull();
    expectNoReference();
  });

  it('Information requested: the reason, when, and no reply field', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-c');
    await decide(sample, 'information');
    const history = await detailOf(runtime);
    expect(main().querySelector('.rk-head .rk-meta .xr-st--err')).toHaveTextContent(
      'Information requested',
    );
    const notice = main().querySelector('.rk-notice--info')!;
    expect(notice).toHaveAttribute('role', 'status');
    expect(notice).toHaveTextContent('BITS asked for more information');
    expect(notice).toHaveTextContent(
      /^BITS asked for more information“Please confirm the batch size for Sem II before we review the request\.” · \d{1,2} \w{3} \d{4}, \d\d:\d\d\. Reply outside the platform; there is no reply form here\.$/,
    );
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(values(stands())).toEqual(['Information requested', 'Not started', 'Unchanged']);
    expect(historyLines(history)[0]).toEqual([
      'BITS asked for more information',
      expect.stringMatching(/ · BITS$/),
      '“Please confirm the batch size for Sem II before we review the request.”',
    ]);
    expectNoReference();
  });

  it('Approved — payment required: “Open the payment page” opens PU-12 by its address; no plan change', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-c');
    await decide(sample, 'approve');
    const history = await detailOf(runtime);
    expect(main().querySelector('.rk-head .rk-meta .xr-st--warn')).toHaveTextContent(
      'Approved — payment required',
    );
    const notice = main().querySelector('.rk-notice--warn')!;
    expect(notice).toHaveTextContent('Approved — payment required');
    expect(notice).toHaveTextContent('Nothing changes until the payment is confirmed.');
    const pay = within(notice as HTMLElement).getByRole('link', { name: 'Open the payment page' });
    expect(pay).toHaveAttribute('href', '/requests/rq-0012/payment');
    expect(pay).toHaveClass('rb-btn--navy');
    expect(values(stands())).toEqual(['Approved', 'Waiting, not confirmed', 'Unchanged']);
    expect(historyLines(history)[0]).toEqual([
      'Approved — payment required',
      expect.stringMatching(/ · BITS$/),
      'Approved as asked: 60 licences',
    ]);
    expect(main()).not.toHaveTextContent(/plan (changed|updated)|licences added/i);
    const plan = await runtime.ports.institutions.getAccessPlan('ACC-0107' as never);
    expect(plan.ok && plan.value.plan.licences).toBe(120);
    expectNoReference();
  });

  it('the new-access request: its term, its message, the plan it created and the events up to Access active', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    const history = await detailOf(runtime, 'REQ-0042');
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'New access · Shell-and-Tube Heat Exchanger',
      }),
    ).toBeVisible();
    expect(crumbs()).toEqual(['Requests', 'New access · Shell-and-Tube Heat Exchanger']);
    const asked = screen.getByRole('region', { name: 'What you asked for' });
    expect(terms(asked)).toEqual(['Request type', 'Experiment', 'Licences', 'Term', 'Formats']);
    expect(values(asked)).toEqual([
      'New access (sent from the public request form)',
      'Shell-and-Tube Heat Exchanger · ME ZG523',
      '120',
      'Yearly',
      'WEBVR',
    ]);
    // PC-50: the requester's own message as sent, "Message to BITS".
    expect(asked.querySelector('.rk-label')).toHaveTextContent('Message to BITS');
    expect(asked.querySelector('.rk-quote')).toHaveTextContent(
      '“We would like to start with the heat exchanger lab for our ME ZG523 cohort this term, in the browser and in VR.”',
    );
    const notice = main().querySelector('.rk-notice--ok')!;
    expect(notice).toHaveTextContent('Access active');
    expect(notice).toHaveTextContent(
      'Payment confirmed. Your access plan was created 8 Oct 2026, 15:05.',
    );
    expect(
      within(notice as HTMLElement).getByRole('link', { name: 'View your access plan' }),
    ).toHaveAttribute('href', '/institute/content-access/plans/ACC-0107');
    expect(values(stands())).toEqual([
      'Approved',
      expect.stringMatching(/^Confirmed \d{1,2} \w{3} \d{4}, \d\d:\d\d$/),
      'Active since 8 Oct 2026, 15:05',
    ]);
    expect(historyLines(history).map((line) => line[0])).toEqual([
      'Access active',
      'Payment confirmed',
      'Approved — payment required',
      'Sent to BITS',
    ]);
    expect(historyLines(history)[0]![2]).toBe('Your access plan was created.');
    expectNoReference();
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

// ---- IA-18 Device requests (IA-v1 "IA-18") --------------------------------------------------------

async function deviceTable() {
  return screen.findByRole('table', { name: 'Device requests from your students' });
}

describe('IA-18 — Device requests (IA-v1 tab)', () => {
  it('one row per request, newest first, status in words; Review only on the one waiting', async () => {
    const { runtime } = await tabPlatform(MEERA, 'state-coverage');
    inInstitute(runtime, '/institute/requests', <InstituteRequests />, '?tab=devices');
    const table = await deviceTable();
    expect(tabTitle()).toBe('Device requests');
    expect(main()).toHaveTextContent('You forward device requests to BITS. BITS decides.');
    expect(
      screen.queryByRole('button', { name: 'Ask BITS for a renewal or more licences' }),
    ).toBeNull();
    expect(
      within(screen.getByRole('navigation', { name: 'Requests' })).getByRole('link', {
        name: 'Device requests',
      }),
    ).toHaveAttribute('aria-current', 'page');
    expect([...table.querySelectorAll('thead th')].map((cell) => cell.textContent)).toEqual([
      'Student',
      'Request',
      'Status',
      'Action',
    ]);
    const [imran, rahul] = rowsOf(table);
    expect(cells(imran!)).toEqual([
      'Imran ShaikhGIT-2026-0409',
      'VR device transfer15 Nov 2026',
      'Waiting on you',
      'Review',
    ]);
    expect(imran!.querySelector('.xr-st--warn')).toHaveTextContent('Waiting on you');
    expect(
      within(imran!).getByRole('link', { name: 'Review Imran Shaikh’s request' }),
    ).toHaveAttribute('href', '/institute/requests/devices/DTR-0019');
    expect(
      within(imran!).getByRole('link', {
        name: 'VR device transfer from Imran Shaikh, 15 Nov 2026',
      }),
    ).toHaveAttribute('href', '/institute/requests/devices/DTR-0019');
    expect(cells(rahul!)).toEqual([
      'Rahul VermaGIT-2026-0418',
      'VR device transfer22 Oct 2026',
      'Decided · approved by BITS',
      '',
    ]);
    expect(within(rahul!).getByRole('link', { name: 'Rahul Verma' })).toHaveAttribute(
      'href',
      `/institute/people/students/${RAHUL}`,
    );
    expect(
      within(rahul!).getByRole('link', {
        name: 'VR device transfer from Rahul Verma, 22 Oct 2026',
      }),
    ).toHaveAttribute('href', '/institute/requests/devices/DTR-0018');
    // No approve or decline anywhere (T-32).
    expect(screen.queryByRole('button', { name: /approve|decline/i })).toBeNull();
    expectNoReference();
  });

  it('no request yet: “No device request yet”', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    inInstitute(runtime, '/institute/requests', <InstituteRequests />, '?tab=devices');
    const empty = await screen.findByRole('heading', { name: 'No device request yet' });
    expect(empty.closest('.rk-state')).toHaveClass('rk-state--roomy');
    expect(main()).toHaveTextContent(
      'When a student asks to move a headset format to another device, the request appears here for you to forward to BITS.',
    );
  });

  it('paused: the request waits, no Review, the drawn notice', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'state-coverage');
    await pauseGodavari(sample);
    await act(async () => {
      await runtime.session.refresh();
    });
    inInstitute(runtime, '/institute/requests', <InstituteRequests />, '?tab=devices');
    const table = await deviceTable();
    expect(rowsOf(table)[0]).toHaveTextContent('Waiting on you');
    expect(screen.queryByRole('link', { name: /^Review/ })).toBeNull();
    const notice = main().querySelector('.rk-notice--paused')!;
    expect(notice).toHaveTextContent('You can’t forward requests right now');
    expect(notice).toHaveTextContent(
      'Your institution’s access is paused. Requests wait here until BITS lifts the pause.',
    );
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

// ---- IA-19 Device request — review & forward (IA-v1 "IA-19") -------------------------------------

async function transferPage(runtime: PlatformRuntime, transferId = 'DTR-0019') {
  inInstitute(
    runtime,
    `/institute/requests/devices/${transferId}`,
    <DeviceRequest transferId={transferId} />,
  );
  return screen.findByRole('region', { name: 'What the student asked for' });
}

const FORWARD_IMRAN = 'Forward Imran Shaikh’s device request to BITS?';

describe('IA-19 — review and forward (IA-v1)', () => {
  it('waiting on you: forward through the dialog → “Forwarded to BITS”, the same record the Student and BITS read', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'state-coverage');
    const asked = await transferPage(runtime);
    expect(
      screen.getByRole('heading', { level: 1, name: 'VR device transfer for Imran Shaikh' }),
    ).toBeVisible();
    expect(main().querySelector('.rk-head .rk-eyebrow')).toHaveTextContent('Device request');
    expect(crumbs()).toEqual(['Device requests', 'VR device transfer for Imran Shaikh']);
    expect(crumbLink('Device requests')).toHaveAttribute('href', '/institute/requests?tab=devices');
    expect(tabTitle()).toBe('VR device transfer for Imran Shaikh · Device requests');
    const meta = main().querySelector('.rk-head .rk-meta')!;
    expect(meta.querySelector('.xr-st--warn')).toHaveTextContent('Waiting on you');
    expect(meta).toHaveTextContent('Requested 15 Nov 2026, 10:40 by Imran Shaikh');
    expect(values(asked)).toEqual([
      'Imran Shaikh · GIT-2026-0409',
      'VRfor Shell-and-Tube Heat Exchanger',
      'ME lab VR headset, asset tag GIT-VR-04',
      'ME lab VR headset, asset tag GIT-VR-08',
      'No note',
    ]);
    expect(within(asked).getByRole('link', { name: 'Imran Shaikh' })).toHaveAttribute(
      'href',
      `/institute/people/students/${IMRAN}`,
    );
    expect(asked.querySelector('.xr-fmt')).toHaveTextContent('VR');
    const action = screen.getByRole('region', { name: 'Your action' });
    expect(action).toHaveTextContent(
      'Forward it to BITS. BITS decides; you can’t approve device transfers.',
    );
    expect(terms(action)).toEqual(['Request', 'Forwarded to BITS', 'BITS decision']);
    expect(values(action)).toEqual(['Waiting on you', 'Not yet', 'Not yet']);
    expect(screen.queryByRole('button', { name: /approve|decline/i })).toBeNull();
    expectNoReference();

    const user = userEvent.setup();
    const version = sample.worldVersion();
    const forward = within(action).getByRole('button', { name: 'Forward to BITS' });
    expect(forward).toHaveClass('rb-btn--primary', 'rb-btn--lg', 'rk-go');
    await user.click(forward);
    let dialog = screen.getByRole('dialog', { name: FORWARD_IMRAN });
    expect(dialog).toHaveAccessibleDescription(
      'BITS decides whether Imran Shaikh can move VR to ME lab VR headset, asset tag GIT-VR-08. You can’t take it back once it’s forwarded.',
    );
    expect(within(dialog).getByRole('button', { name: 'Forward to BITS' })).toHaveFocus();
    expectNoReference();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(sample.worldVersion()).toBe(version);

    await user.click(forward);
    dialog = screen.getByRole('dialog', { name: FORWARD_IMRAN });
    await user.click(within(dialog).getByRole('button', { name: 'Forward to BITS' }));
    await waitFor(() =>
      expect(main()).toHaveTextContent('Imran Shaikh sees “Forwarded to BITS”. BITS decides.'),
    );
    const flash = document.getElementById('device-request-flash')!;
    expect(flash).toHaveClass('rk-notice--ok');
    expect(flash).toHaveAttribute('role', 'status');
    expect(flash).toHaveTextContent('Forwarded to BITS');
    await waitFor(() => expect(flash).toHaveFocus());
    expect(main().querySelector('.rk-head .rk-meta .xr-st--info')).toHaveTextContent(
      'Forwarded to BITS',
    );
    expect(screen.getByRole('region', { name: 'Your action' })).toHaveTextContent(
      'Forwarded. Nothing more is needed from you; BITS decides.',
    );
    expect(values(screen.getByRole('region', { name: 'Your action' }))).toEqual([
      'Forwarded to BITS',
      expect.stringMatching(/^\d{1,2} \w{3} \d{4}, \d\d:\d\d · Meera Iyer$/),
      'Not yet',
    ]);
    expect(screen.queryByRole('button', { name: 'Forward to BITS' })).toBeNull();
    expect(
      historyLines(screen.getByRole('region', { name: 'History' })).map((line) => line[0]),
    ).toEqual(['Forwarded to BITS by Meera Iyer', 'Requested by Imran Shaikh']);
    expectNoReference();

    // The Student reads "Forwarded to BITS" on My device; BITS reads it forwarded.
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
    const dialog = screen.getByRole('dialog', { name: FORWARD_IMRAN });
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

  it('institution paused: the request waits, read-only', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'state-coverage');
    await pauseGodavari(sample);
    await act(async () => {
      await runtime.session.refresh();
    });
    await transferPage(runtime);
    const notice = main().querySelector('.rk-notice--paused')!;
    expect(notice).toHaveAttribute('role', 'status');
    expect(notice).toHaveTextContent('You can’t forward requests right now');
    expect(notice).toHaveTextContent(
      'Your institution’s access is paused. Requests wait here until BITS lifts the pause.',
    );
    expect(screen.getByRole('region', { name: 'Your action' })).toHaveTextContent(
      'Forwarding is unavailable while access is paused.',
    );
    expect(screen.queryByRole('button', { name: 'Forward to BITS' })).toBeNull();
    expect(main().querySelector('.rk-head .rk-meta .xr-st--warn')).toHaveTextContent(
      'Waiting on you',
    );
    expectNoReference();
  });

  it('paused while the dialog is open: the refusal shows the paused state, nothing written', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'state-coverage');
    await transferPage(runtime);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Forward to BITS' }));
    await pauseGodavari(sample);
    const dialog = screen.getByRole('dialog', { name: FORWARD_IMRAN });
    await user.click(within(dialog).getByRole('button', { name: 'Forward to BITS' }));
    await waitFor(() =>
      expect(main()).toHaveTextContent('Forwarding is unavailable while access is paused.'),
    );
    const transfer = await runtime.ports.operations.getDeviceRequest('DTR-0019' as never);
    expect(transfer.ok && transfer.value.state).toBe('with-institute-admin');
  });

  it('decided · approved by BITS: read-only, the whole history without the devices repeated', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-device');
    await transferPage(runtime, 'DTR-0018');
    expect(main().querySelector('.rk-head .rk-meta .xr-st--ok')).toHaveTextContent(
      'Decided · approved by BITS',
    );
    const action = screen.getByRole('region', { name: 'Your action' });
    expect(action).toHaveTextContent(
      'BITS approved this transfer. Nothing more is needed from you.',
    );
    expect(values(action)).toEqual([
      'Decided · approved by BITS',
      '23 Oct 2026, 10:00 · Meera Iyer',
      'Approved · 24 Oct 2026, 12:30',
    ]);
    expect(screen.queryByRole('button', { name: 'Forward to BITS' })).toBeNull();
    expect(historyLines(screen.getByRole('region', { name: 'History' }))).toEqual([
      [
        'Approved by BITS',
        '24 Oct 2026, 12:30',
        'The authorised device is now: ME lab VR headset, asset tag GIT-VR-07',
      ],
      ['Forwarded to BITS by Meera Iyer', '23 Oct 2026, 10:00'],
      ['Requested by Rahul Verma', '22 Oct 2026, 09:10'],
    ]);
    const asked = screen.getByRole('region', { name: 'What the student asked for' });
    expect(asked).toHaveTextContent('GIT-VR-03 has gone for repair; the lab gave me GIT-VR-07.');
    expect(values(asked).slice(2, 4)).toEqual([
      'ME lab VR headset, asset tag GIT-VR-03',
      'ME lab VR headset, asset tag GIT-VR-07',
    ]);
    // The student's own note is quoted as written (it names devices, never a reference).
    expectNoReference();
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

// ---- IA-01's device-request item (IA-v1 `attention`), drawn since IA-18 is built -----------------

describe('IA-01 — the device-request item (IA-v1 IA-01; P3-07)', () => {
  it('a request waiting on Meera: the item, its line and “Open requests” → Device requests', async () => {
    const { runtime } = await tabPlatform(MEERA, 'state-coverage');
    inInstitute(runtime, '/institute', <InstituteOverview />);
    const region = await screen.findByRole('region', { name: 'Needs your attention' });
    const item = await waitFor(() => {
      const found = [...region.querySelectorAll('li.ia-att-item')].find((candidate) =>
        candidate.textContent?.includes('device request'),
      );
      if (!found) throw new Error('no device item');
      return found as HTMLElement;
    });
    expect(item.querySelector('.ia-att-n')).toHaveTextContent('1');
    expect(item.querySelector('.ia-att-t')).toHaveTextContent(
      '1 device request to forward to BITS',
    );
    expect(item.querySelector('.ia-att-d')?.textContent).toMatch(
      /^From Imran Shaikh on 15 November( 2026)?\. BITS decides after you forward it\.$/,
    );
    const open = within(item).getByRole('link', { name: 'Open requests' });
    expect(open).toHaveClass('ia-att-go');
    expect(open).toHaveAttribute('href', '/institute/requests?tab=devices');
    const titles = [...region.querySelectorAll('.ia-att-t')].map((node) => node.textContent);
    const withoutAccess = titles.findIndex((title) => title?.includes('no access yet'));
    if (withoutAccess >= 0) {
      expect(titles.indexOf('1 device request to forward to BITS')).toBeLessThan(withoutAccess);
    }
    // Named by content: no request reference in the item.
    expect(item.textContent).not.toMatch(/\bDTR-\d+/);
  });

  it('nothing waiting: no row (the decided DTR-0018 is not counted)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-device');
    inInstitute(runtime, '/institute', <InstituteOverview />);
    const region = await screen.findByRole('region', { name: 'Needs your attention' });
    expect(region).not.toHaveTextContent('device request');
  });
});

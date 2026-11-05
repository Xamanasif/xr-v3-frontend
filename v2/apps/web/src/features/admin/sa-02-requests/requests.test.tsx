/**
 * SA-02 Requests in the V3 design (the Super Admin export `sa-views-a.js` `V.requests`) on the real
 * composition root and the spine-start sample world: the rows are
 * `AccessRequestService.listRequests`'s answer (search, Status, Type and "Internal or external" go
 * to the port as filters, Received's order as `sort`), named from the published catalogue; every
 * applied filter is a removable chip; the count follows the export; each row opens its decision,
 * named by its institution, never by its reference; and nothing decides a status here.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { asPersonId, faults, planPayment, visitorPorts } from '@xr/sample-platform/testing';
import { afterEach, describe, expect, it } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import { saExport } from '@/test-support/boards';
import {
  renderInTab,
  SUPER_ADMIN,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../../shared/workspace-frame/workspace-frame';
import { Requests } from './requests';

afterEach(() => {
  forgetLastAddress();
});

const VIEWS = saExport('sa-views-a.js');

function inAdmin(runtime: PlatformRuntime, page: ReactNode) {
  const navigation = testNavigation('/admin/requests');
  renderInTab(
    <WorkspaceLayout workspace="admin">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return navigation;
}

/** The listed rows (the loading skeleton's rows have no row link). */
async function rowsShown(): Promise<HTMLTableRowElement[]> {
  await waitFor(() =>
    expect(document.querySelectorAll('main table.rk-table a.rk-rowlink').length).toBeGreaterThan(0),
  );
  return [...document.querySelectorAll<HTMLTableRowElement>('main table.rk-table tbody tr')];
}

/** Each row's request, read from where its link goes (the reference is never shown). */
function references(rows: readonly HTMLTableRowElement[]): string[] {
  return rows.map((row) =>
    decodeURIComponent(row.querySelector('a.rk-rowlink')!.getAttribute('href')!.split('/').at(-1)!),
  );
}

const count = () => document.querySelector('main .rk-count[role="status"]');

async function portRows(runtime: PlatformRuntime, filter: Record<string, unknown> = {}) {
  const answer = await runtime.ports.accessRequests.listRequests({
    sort: 'received-newest',
    ...filter,
  });
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

describe('SA-02 — the list is the port’s answer', () => {
  it('every request the Super Admin can see, newest first, with the export’s columns and words', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    inAdmin(runtime, <Requests />);
    const rows = await rowsShown();
    const expected = await portRows(runtime);
    expect(references(rows)).toEqual(expected.map((row) => row.id));
    expect(screen.getByRole('heading', { level: 1, name: 'Requests' })).toHaveAttribute(
      'tabindex',
      '-1',
    );
    expect(
      screen.getByText(
        'Institutional access requests sent from the public site. Open one to decide it.',
      ),
    ).toHaveClass('rk-sub');
    expect(screen.getByRole('region', { name: 'Institutional access requests' })).toHaveClass(
      'rk-surface',
    );
    expect(screen.getByRole('search', { name: 'Filter requests' })).toBeVisible();
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveAttribute(
      'placeholder',
      'Institution or contact person',
    );
    // The count: every request, in the export's words.
    expect(count()).toHaveTextContent(`${expected.length} requests`);
    const headers = [...document.querySelectorAll('main thead th')].map(
      (th) => th.textContent ?? '',
    );
    expect(headers).toEqual([
      'Institution and contact person',
      'Experiments',
      'Type',
      'Received',
      'Status',
    ]);
    for (const words of [
      'Institution and contact person',
      'Institution or contact person',
      'No requests match these filters',
      'Institutional access requests sent from the public site. Open one to decide it.',
    ]) {
      expect(VIEWS).toContain(words);
    }
    // No internal reference anywhere on the page: requests are named by their institution.
    expect(screen.getByRole('main').textContent).not.toMatch(/REQ-\d/);
    for (const link of screen.getByRole('main').querySelectorAll('a')) {
      expect(link.getAttribute('aria-label') ?? '').not.toMatch(/REQ-\d/);
    }
  });

  it('REQ-0040, REQ-0038 and REQ-0041 as the seeded world holds them', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    inAdmin(runtime, <Requests />);
    const rows = await rowsShown();
    const row = (reference: string) => rows[references(rows).indexOf(reference)]!;
    const cells = (reference: string) =>
      [...row(reference).querySelectorAll('td')].map((cell) => cell.textContent);
    expect(cells('REQ-0040')).toEqual([
      'Konark PolytechnicR. Bhatt',
      'Buck Converter RippleFormats requested: WEB, ARWEBAR',
      'Additional licencesExternal',
      'Received 29 Sep 2026',
      'Under review',
    ]);
    expect(cells('REQ-0038')).toEqual([
      'BITS Pilani — Hyderabad CampusA. Menon',
      '2 experiments',
      'RenewalInternal',
      'Received 26 Sep 2026',
      'Under review',
    ]);
    expect(cells('REQ-0041')).toEqual([
      'Krishna College of EngineeringS. Pillai',
      '3 experiments',
      'New accessNot set yet',
      'Received 30 Sep 2026',
      'Information requested',
    ]);
    // Status tones as the export draws them (`SA.REQ_KIND`).
    expect(row('REQ-0040').querySelector('.xr-st')).toHaveClass('xr-st--info');
    expect(row('REQ-0041').querySelector('.xr-st')).toHaveClass('xr-st--err');
    // The row link opens the decision, named as the export names it.
    const link = within(row('REQ-0040')).getByRole('link', {
      name: 'Konark Polytechnic, additional licences, received 29 Sep 2026, Under review. Open the request',
    });
    expect(link).toHaveAttribute('href', '/admin/requests/REQ-0040');
    expect(link).toHaveClass('rk-rowlink');
    expect(link).toHaveTextContent('Konark Polytechnic');
  });
});

describe('SA-02 — search, filters and chips', () => {
  it('Status: Under review — the requests that need a decision; the chip removes it', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    inAdmin(runtime, <Requests />);
    await rowsShown();
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText('Status'), 'Under review');
    const expected = await portRows(runtime, { status: 'under-review' });
    await waitFor(async () =>
      expect(references(await rowsShown())).toEqual(expected.map((row) => row.id)),
    );
    const all = await portRows(runtime);
    expect(count()).toHaveTextContent(`${expected.length} of ${all.length} requests`);
    await user.click(screen.getByRole('button', { name: 'Remove filter Status: Under review' }));
    await waitFor(async () => expect(await rowsShown()).toHaveLength(all.length));
  });

  it('the announced count never states a figure for the wrong filter while the answer loads', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    inAdmin(runtime, <Requests />);
    await rowsShown();
    const status = count()!;
    const all = (await portRows(runtime)).length;
    const underReview = (await portRows(runtime, { status: 'under-review' })).length;
    const heard: string[] = [status.textContent ?? ''];
    const observer = new MutationObserver(() => heard.push(status.textContent ?? ''));
    observer.observe(status, { childList: true, characterData: true, subtree: true });
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText('Status'), 'Under review');
    await waitFor(() => expect(status).toHaveTextContent(`${underReview} of ${all} requests`));
    observer.disconnect();
    expect(new Set(heard)).toEqual(
      new Set([`${all} requests`, `${underReview} of ${all} requests`]),
    );
  });

  it('search matches reference, institution or contact; no match offers one way back', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    inAdmin(runtime, <Requests />);
    await rowsShown();
    const user = userEvent.setup();
    const search = screen.getByRole('searchbox', { name: 'Search' });
    await user.type(search, 'konark');
    await waitFor(async () =>
      expect(references(await rowsShown())).toEqual(
        (await portRows(runtime, { search: 'konark' })).map((row) => row.id),
      ),
    );
    expect(screen.getByRole('button', { name: 'Remove filter Search: “konark”' })).toBeVisible();
    await user.clear(search);
    await user.type(search, 'Narmada');
    const none = await screen.findByText('No requests match these filters');
    expect(none).toHaveClass('rk-state-t');
    expect(none.closest('.rk-state')).toHaveTextContent(
      'Try fewer filters or a different spelling of the institution or contact person.',
    );
    expect(count()).toHaveTextContent(`0 of ${(await portRows(runtime)).length} requests`);
    const clear = within(none.closest('.rk-state') as HTMLElement).getByRole('button', {
      name: 'Clear filters',
    });
    await user.click(clear);
    await waitFor(async () =>
      expect(await rowsShown()).toHaveLength((await portRows(runtime)).length),
    );
    expect(search).toHaveValue('');
    expect(search).toHaveFocus();
  });

  it('More filters: “Internal or external” applies at once; the button counts it', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    inAdmin(runtime, <Requests />);
    await rowsShown();
    const user = userEvent.setup();
    const more = screen.getByRole('button', { name: 'More filters' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    await user.click(more);
    expect(more).toHaveAttribute('aria-expanded', 'true');
    const panel = document.getElementById(more.getAttribute('aria-controls')!)!;
    await user.selectOptions(within(panel).getByLabelText('Internal or external'), 'External');
    const expected = await portRows(runtime, { route: 'external' });
    await waitFor(async () =>
      expect(references(await rowsShown())).toEqual(expected.map((row) => row.id)),
    );
    expect(screen.getByRole('button', { name: 'More filters, 1 applied' })).toBe(more);
    expect(
      screen.getByRole('button', { name: 'Remove filter Internal or external: External' }),
    ).toBeVisible();
    await user.selectOptions(within(panel).getByLabelText('Internal or external'), 'Not set yet');
    const notSet = await portRows(runtime, { route: 'not-set' });
    await waitFor(async () =>
      expect(references(await rowsShown())).toEqual(notSet.map((row) => row.id)),
    );
  });

  it('Type, with no Declined anywhere (T-02)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    inAdmin(runtime, <Requests />);
    await rowsShown();
    const user = userEvent.setup();
    const type = screen.getByLabelText('Type') as HTMLSelectElement;
    expect([...type.options].map((option) => option.textContent)).toEqual([
      'All types',
      'New access',
      'Additional licences',
      'Renewal',
    ]);
    const status = screen.getByLabelText('Status') as HTMLSelectElement;
    expect([...status.options].map((option) => option.textContent)).toEqual([
      'All statuses',
      'Under review',
      'Information requested',
      'Approved — payment required',
      'Payment not confirmed',
      'Payment failed',
      'Access active',
    ]);
    expect(document.body.textContent).not.toMatch(/Declin/);
    await user.selectOptions(type, 'Renewal');
    await waitFor(async () => expect(references(await rowsShown())).toEqual(['REQ-0038']));
  });
});

describe('SA-02 — the “Payment failed” filter (B2B milestone I1, C1)', () => {
  it('lists only the requests whose payment failed', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    // A visitor's request, approved as external, whose payment the provider stand-in fails.
    const visitor = visitorPorts(sample);
    const added = visitor.selection.add({
      experimentId: 'shell-and-tube-heat-exchanger' as never,
      formats: ['web'],
    });
    if (!added.ok) throw new Error(added.error.kind);
    const sent = await visitor.accessRequests.submitPublicRequest({
      institutionName: 'Krishna Engineering College',
      contactPerson: 'R. Rao',
      email: 'r.rao@krishna.edu.in',
      phone: null,
      licencesRequested: '30',
      message: null,
      term: { kind: 'yearly' },
    });
    if (!sent.ok) throw new Error(sent.error.kind);
    const arjun = asPersonId(sample, SUPER_ADMIN);
    const page = await arjun.accessRequests.getRequestForDecision(sent.value.reference);
    if (!page.ok) throw new Error(page.error.kind);
    const approved = await arjun.accessRequests.approveRequest({
      id: sent.value.reference,
      route: 'external',
      expectedRev: page.value.request.rev,
    });
    if (!approved.ok) throw new Error(approved.error.kind);
    const status = await visitor.accessRequests.getRequestStatus(sent.value.routeId);
    if (!status.ok) throw new Error(status.error.kind);
    planPayment(sample, 'failed');
    const started = await visitor.accessRequests.startPayment({
      request: sent.value.routeId,
      expectedRev: status.value.rev,
    });
    if (!started.ok) throw new Error(started.error.kind);

    inAdmin(runtime, <Requests />);
    await rowsShown();
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText('Status'), 'Payment failed');
    await waitFor(async () =>
      expect(references(await rowsShown())).toEqual([sent.value.reference]),
    );
  });
});

describe('SA-02 — Received sorts newest / oldest first', () => {
  it('the header button reverses the order in place and is the only th[aria-sort]', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    inAdmin(runtime, <Requests />);
    const newest = references(await rowsShown());
    const sorted = document.querySelectorAll('main th[aria-sort]');
    expect(sorted).toHaveLength(1);
    expect(sorted[0]).toHaveAttribute('aria-sort', 'descending');
    const user = userEvent.setup();
    const header = within(sorted[0] as HTMLElement).getByRole('button', {
      name: 'Received, newest first. Change order',
    });
    await user.click(header);
    // Same render: the rows already held are reordered (no loading state for a sort).
    expect(document.querySelector('main [aria-busy="true"]')).toBeNull();
    expect(references(await rowsShown())).toEqual([...newest].reverse());
    expect(document.querySelector('main th[aria-sort]')).toHaveAttribute('aria-sort', 'ascending');
    expect(document.querySelector('main table caption')).toHaveTextContent(
      'Institutional access requests, received, oldest first',
    );
    await waitFor(async () =>
      expect(references(await rowsShown())).toEqual(
        (await portRows(runtime, { sort: 'received-oldest' })).map((row) => row.id),
      ),
    );
  });
});

describe('SA-02 — the list’s states', () => {
  it('loading, then failed with Try again: nothing has changed, and trying again lists the rows', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    faults(sample).failNext('AccessRequestService.listRequests');
    inAdmin(runtime, <Requests />);
    expect(await screen.findByText('Loading requests…')).toHaveClass('rk-loading-msg');
    const failed = await screen.findByRole('alert');
    expect(failed).toHaveTextContent('We couldn’t load the requests');
    expect(failed).toHaveTextContent('Nothing has changed. Try again.');
    expect(count()).toBeNull();
    const user = userEvent.setup();
    await user.click(within(failed).getByRole('button', { name: 'Try again' }));
    await rowsShown();
    expect(screen.getByRole('heading', { level: 1, name: 'Requests' })).toHaveFocus();
  });
});

describe('SA-02 — the rail count (requests under review)', () => {
  it('Requests is current and counts the requests under review, in words', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    inAdmin(runtime, <Requests />);
    await rowsShown();
    const underReview = (await portRows(runtime, { status: 'under-review' })).length;
    const item = document.querySelector('aside nav a[href="/admin/requests"]')!;
    expect(item).toHaveAttribute('aria-current', 'page');
    await waitFor(() =>
      expect(item.querySelector('.rb-count .xr-sr')).toHaveTextContent(
        `${underReview} requests under review`,
      ),
    );
  });
});

describe('SA-02 — only the Super Admin', () => {
  it('another role’s person sees “Not your workspace” and no request', async () => {
    const { runtime } = await tabPlatform('per-kavya-nair', 'spine-start');
    inAdmin(runtime, <Requests />);
    await screen.findByRole('heading', { name: 'This page isn’t part of your workspace' });
    expect(document.querySelector('table.rk-table')).toBeNull();
    expect(document.body.textContent).not.toContain('Konark Polytechnic');
  });
});

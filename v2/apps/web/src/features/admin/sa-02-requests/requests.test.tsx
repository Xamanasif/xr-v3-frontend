/**
 * SA-02 Requests (board B1-10) on the real composition root and the spine-start sample world:
 * the rows are `AccessRequestService.listRequests`'s answer (search, Status, Type and "Internal or
 * external" go to the port as filters, Received's order as `sort`), named from the published
 * catalogue; every applied filter is a removable chip; the count follows B1-10; each reference
 * opens its decision; and nothing decides a status here.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import { board } from '@/test-support/boards';
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

const B1_10 = board('B1-10-SA-Requests.dc.html');

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

/** The listed rows (the loading skeleton's rows have no reference link). */
async function rowsShown(): Promise<HTMLTableRowElement[]> {
  await waitFor(() =>
    expect(document.querySelectorAll('main table.xr-table td.is-primary a').length).toBeGreaterThan(
      0,
    ),
  );
  return [...document.querySelectorAll<HTMLTableRowElement>('main table.xr-table tbody tr')];
}

function references(rows: readonly HTMLTableRowElement[]): string[] {
  return rows.map((row) => row.querySelector('td.is-primary a')!.textContent!);
}

async function portRows(runtime: PlatformRuntime, filter: Record<string, unknown> = {}) {
  const answer = await runtime.ports.accessRequests.listRequests({
    sort: 'received-newest',
    ...filter,
  });
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

describe('SA-02 — the list is the port’s answer (B1-10 f0)', () => {
  it('every request the Super Admin can see, newest first, with B1-10’s columns and words', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    inAdmin(runtime, <Requests />);
    const rows = await rowsShown();
    const expected = await portRows(runtime);
    expect(references(rows)).toEqual(expected.map((row) => row.id));
    expect(screen.getByRole('heading', { level: 1, name: 'Requests' })).toBeVisible();
    expect(
      screen.getByText(
        'Institutional access requests sent from the public site. Open one to decide it.',
      ),
    ).toBeVisible();
    // The count: every request, in B1-10's words.
    expect(document.querySelector('.xr-toolbar-status [role="status"]')).toHaveTextContent(
      `${expected.length} requests`,
    );
    const headers = [...document.querySelectorAll('main thead th')].map(
      (th) => th.textContent ?? '',
    );
    expect(headers.slice(0, 4)).toEqual([
      'Reference',
      'Institution and contact person',
      'Experiments',
      'Type',
    ]);
    expect(headers[4]).toContain('Received');
    expect(headers[5]).toBe('Status');
    for (const words of [
      'Institution and contact person',
      'Reference, institution or contact',
      'No requests match these filters',
      'Institutional access requests sent from the public site. Open one to decide it.',
    ]) {
      expect(B1_10).toContain(words);
    }
  });

  it('REQ-0040, REQ-0038 and REQ-0041 as the seeded world holds them', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    inAdmin(runtime, <Requests />);
    const rows = await rowsShown();
    const row = (reference: string) =>
      rows.find(
        (candidate) => candidate.querySelector('td.is-primary a')!.textContent === reference,
      )!;
    const cells = (reference: string) =>
      [...row(reference).querySelectorAll('td')].map((cell) => cell.textContent);
    expect(cells('REQ-0040')).toEqual([
      'REQ-0040',
      'Konark PolytechnicR. Bhatt',
      'Buck Converter RippleWEB, AR',
      'Additional licencesExternal',
      '29 Sep 2026',
      'Under review',
    ]);
    expect(cells('REQ-0038')).toEqual([
      'REQ-0038',
      'BITS Pilani — Hyderabad CampusA. Menon',
      '2 experiments',
      'RenewalInternal',
      '26 Sep 2026',
      'Under review',
    ]);
    expect(cells('REQ-0041')).toEqual([
      'REQ-0041',
      'Krishna College of EngineeringS. Pillai',
      '3 experiments',
      'New accessNot set yet',
      '30 Sep 2026',
      'Information requested',
    ]);
    // Status tones as B1-10 draws them.
    expect(row('REQ-0040').querySelector('.xr-status')).toHaveClass('xr-status--info');
    expect(row('REQ-0041').querySelector('.xr-status')).toHaveClass('xr-status--err');
    // The reference opens the decision, named as B1-10 names it.
    const link = within(row('REQ-0040')).getByRole('link', {
      name: 'Open request REQ-0040, Konark Polytechnic',
    });
    expect(link).toHaveAttribute('href', '/admin/requests/REQ-0040');
    expect(link).toHaveClass('xr-id', 'font-[700]', 'text-link');
  });
});

describe('SA-02 — search, filters and chips (B1-10 f1, f3, f4)', () => {
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
    expect(document.querySelector('.xr-toolbar-status [role="status"]')).toHaveTextContent(
      `${expected.length} of ${all.length} requests`,
    );
    await user.click(screen.getByRole('button', { name: 'Remove Status: Under review' }));
    await waitFor(async () => expect(await rowsShown()).toHaveLength(all.length));
  });

  it('the announced count never states a figure for the wrong filter while the answer loads', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    inAdmin(runtime, <Requests />);
    await rowsShown();
    const status = document.querySelector('.xr-toolbar-status [role="status"]')!;
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
    expect(screen.getByRole('button', { name: 'Remove Search: “konark”' })).toBeVisible();
    await user.clear(search);
    await user.type(search, 'Narmada');
    await screen.findByRole('heading', { name: 'No requests match these filters' });
    await user.click(screen.getAllByRole('button', { name: 'Clear filters' }).at(-1)!);
    await waitFor(async () =>
      expect(await rowsShown()).toHaveLength((await portRows(runtime)).length),
    );
    expect(search).toHaveValue('');
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
    const panel = screen.getByRole('group', { name: 'More filters' });
    await user.selectOptions(within(panel).getByLabelText('Internal or external'), 'External');
    const expected = await portRows(runtime, { route: 'external' });
    await waitFor(async () =>
      expect(references(await rowsShown())).toEqual(expected.map((row) => row.id)),
    );
    expect(screen.getByRole('button', { name: 'More filters (1)' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Remove Internal or external: External' }),
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
    const type = document.querySelector('.xr-toolbar .xr-filter-2 select') as HTMLSelectElement;
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
      'Access active',
    ]);
    expect(document.body.textContent).not.toMatch(/Declin/);
    await user.selectOptions(type, 'Renewal');
    await waitFor(async () => expect(references(await rowsShown())).toEqual(['REQ-0038']));
  });
});

describe('SA-02 — Received sorts newest / oldest first (B1-10; PF-01 fix)', () => {
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
    await waitFor(async () =>
      expect(references(await rowsShown())).toEqual(
        (await portRows(runtime, { sort: 'received-oldest' })).map((row) => row.id),
      ),
    );
  });
});

describe('SA-02 — the sidebar count (B1-10 “Nav count = requests under review”)', () => {
  it('Requests is current and counts the requests under review, in words', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    inAdmin(runtime, <Requests />);
    await rowsShown();
    const underReview = (await portRows(runtime, { status: 'under-review' })).length;
    const item = document.querySelector('aside nav a[href="/admin/requests"]')!;
    expect(item).toHaveAttribute('aria-current', 'page');
    await waitFor(() =>
      expect(item.querySelector('.xr-count .xr-sr')).toHaveTextContent(
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
    expect(document.querySelector('table.xr-table')).toBeNull();
    expect(document.body.textContent).not.toContain('REQ-0040');
  });
});

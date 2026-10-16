/**
 * Phase 6 · the Super Admin's Operations: SA-20 Support (B7-09 f7, f13), SA-21 Support report
 * (B7-09 f8 … f12, f14; B7-10 f12) and SA-22 Access ending (B7-09 f4, f5, f6; B7-10 f13), with
 * SA-07's access-ending row of "Needs attention" (B7-03 konark), on the real composition root and
 * the sample world after Flow E (23 Oct 2026: SUP-0207 reopened, SUP-0213 open; BITS Hyderabad's
 * renewal, Konark's reminder, Malnad ended). Resolve and Reopen are `resolveReport` /
 * `reopenReport` with the revision the page shows (Reopen: the one its confirmation opened on);
 * refusals write nothing; the results are read back through the reporter's own port (the same
 * SUP record their Help shows). Nothing is sent from the product.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ServiceError } from '@xr/contracts/draft';
import type { AccessPlan } from '@xr/domain';
import { asPersonId, faults, fixtureWorld } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { expandTarget } from '@/nav/link-targets';
import { P6_OPERATIONS_6_LINK_TARGETS } from '@/nav/link-targets-p6/operations-6';
import { resolveAddress } from '@/nav/routes';
import type { PlatformRuntime } from '@/platform/runtime';
import {
  renderInTab,
  SUPER_ADMIN,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
  worldPlatform,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { InstitutionDetail } from './sa-07-institution-detail/institution-detail';
import { SupportReports } from './sa-20-support/support-reports';
import { SupportReport } from './sa-21-support-report/support-report';
import { AccessEnding, asOfDate } from './sa-22-access-ending/access-ending';

afterEach(() => {
  forgetLastAddress();
  vi.restoreAllMocks();
});

const RAHUL = 'per-0002';
const SUPPORT = '/admin/operations/support';
const ENDING = '/admin/operations/access-ending';
const FIXTURE = 'after-flow-e';

function inAdmin(runtime: PlatformRuntime, path: string, page: ReactNode, search = '') {
  const navigation = testNavigation(path, search);
  const view = renderInTab(
    <WorkspaceLayout workspace="admin">
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
    item.textContent?.replace(/\/\s*$/, '').trim(),
  );
const cells = (row: Element) => [...row.querySelectorAll('td')].map((cell) => cell.textContent);
const tabsOf = () =>
  within(screen.getByRole('navigation', { name: 'Operations' }))
    .getAllByRole('link')
    .map((link) => [
      link.textContent,
      link.getAttribute('href'),
      link.getAttribute('aria-current'),
    ]);
const panel = () => screen.findByRole('complementary', { name: 'Resolve' });
/** An element's words, its text nodes joined by spaces (as a screen reader reads them). */
function text(element: Element | null): string {
  if (!element) return '';
  const parts: string[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    parts.push(node.textContent ?? '');
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

async function reportOf(runtime: PlatformRuntime, id: string) {
  const answer = await runtime.ports.operations.getMyReport(id as never);
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

/** One port's command answered with a refusal (the screen's handling of it, not the service). */
function answerWith(
  runtime: PlatformRuntime,
  method: 'resolveReport' | 'reopenReport',
  error: ServiceError,
): void {
  const real = runtime.withCommandId.bind(runtime);
  vi.spyOn(runtime, 'withCommandId').mockImplementation((commandId) => {
    const ports = real(commandId);
    return {
      ...ports,
      operations: { ...ports.operations, [method]: async () => ({ ok: false as const, error }) },
    } as typeof ports;
  });
}

const OPERATIONS_TABS_SUPPORT = [
  ['Device transfers', '/admin/operations/device-transfers', null],
  ['Support', SUPPORT, 'page'],
  ['Access ending', ENDING, null],
];

// ---- SA-20 Operations › Support ---------------------------------------------------------------

describe('SA-20 — Operations › Support (B7-09 f7, f13)', () => {
  it('Open: the header, the three tabs, the view tabs with counts and the open reports, oldest first (f7)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    inAdmin(runtime, SUPPORT, <SupportReports />);
    const table = await screen.findByRole('table');
    expect(screen.getByRole('heading', { level: 1, name: 'Operations' })).toBeVisible();
    expect(main().querySelector('.xr-phead-meta .xl-meta')).toHaveTextContent(
      'Device transfers, support reports and access that is ending',
    );
    expect(topTitle()).toBe('Operations');
    expect(crumbs()).toEqual(['Operations', 'Support']);
    expect(tabsOf()).toEqual(OPERATIONS_TABS_SUPPORT);
    const section = screen.getByRole('region', { name: 'Support reports' });
    expect(section.querySelector('.xr-section-head .xr-meta')).toHaveTextContent(
      'Sent from Help by any signed-in person · oldest open first',
    );
    const views = within(section).getByRole('tablist', { name: 'Show' });
    expect(
      within(views)
        .getAllByRole('tab')
        .map((tab) => text(tab)),
    ).toEqual(['Open 2', 'Resolved 0', 'All 2']);
    expect(within(views).getByRole('tab', { name: /Open/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect([...table.querySelectorAll('th')].map((th) => th.textContent)).toEqual([
      'Report',
      'From',
      'Status',
      'Action',
    ]);
    expect(table.querySelector('th:last-child .xr-sr')).not.toBeNull();
    const rows = [...table.querySelectorAll('tbody tr')];
    expect(rows.map(cells)).toEqual([
      [
        'The preview of the WEB delivery link showed an empty frameSUP-0207 · Sent 28 Sep 2026',
        'Kavya Nair · Content Manager',
        'Reopened',
        'Open',
      ],
      [
        'The VR simulation stopped loading at the second stepSUP-0213 · Sent 16 Oct 2026',
        'Rahul Verma · Student · Godavari Institute of Technology',
        'Open',
        'Open',
      ],
    ]);
    expect(rows[0]!.querySelector('.xr-status')).toHaveClass('xr-status--wait');
    expect(rows[1]!.querySelector('.xr-status')).toHaveClass('xr-status--info');
    expect(rows[1]!.querySelector('td[data-label="From"]')).not.toBeNull();
    const open = within(rows[1] as HTMLElement).getByRole('link', {
      name: 'Open SUP-0213 The VR simulation stopped loading at the second step',
    });
    expect(open).toHaveAttribute('href', `${SUPPORT}/SUP-0213`);
    expect(open).toHaveClass('xr-btn', 'xr-btn--secondary', 'xr-btn--sm');
  });

  it('All and Resolved: the address follows the view; Resolved is calm and empty', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    const { navigation } = inAdmin(runtime, SUPPORT, <SupportReports />);
    await screen.findByRole('table');
    const user = userEvent.setup();
    await user.click(screen.getByRole('tab', { name: /Resolved/ }));
    expect(navigation.replace).toHaveBeenLastCalledWith(`${SUPPORT}?show=resolved`);
    expect(
      await screen.findByRole('heading', { level: 3, name: 'No resolved reports yet' }),
    ).toBeVisible();
    expect(main()).toHaveTextContent('Reports sent from Help appear here.');
    await user.click(screen.getByRole('tab', { name: /All/ }));
    expect(navigation.replace).toHaveBeenLastCalledWith(`${SUPPORT}?show=all`);
    expect(screen.getByRole('table').querySelectorAll('tbody tr')).toHaveLength(2);
  });

  it('an addressed view is read; one that names no view is replaced by the list', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    const first = inAdmin(runtime, SUPPORT, <SupportReports />, '?show=all');
    await screen.findByRole('table');
    expect(screen.getByRole('tab', { name: /All/ })).toHaveAttribute('aria-selected', 'true');
    expect(first.navigation.replace).not.toHaveBeenCalled();
    first.view.unmount();
    const second = inAdmin(runtime, SUPPORT, <SupportReports />, '?show=everything');
    await screen.findByRole('table');
    expect(second.navigation.replace).toHaveBeenCalledWith(SUPPORT);
  });

  it('nothing open: the calm state on the Open tab (f13)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    for (const id of ['SUP-0207', 'SUP-0213']) {
      const report = await reportOf(runtime, id);
      const answer = await runtime.ports.operations.resolveReport({
        id: report.id,
        note: 'Fixed — please try again.',
        expectedRev: report.rev,
      });
      expect(answer.ok).toBe(true);
    }
    inAdmin(runtime, SUPPORT, <SupportReports />);
    const empty = await screen.findByRole('heading', { level: 3, name: 'No open support reports' });
    const block = empty.closest('.xr-empty')!;
    expect(block.querySelector('.xr-empty-icon')).toHaveClass('xr-x-empty-icon--ok');
    expect(block).toHaveTextContent('Reports sent from Help appear here.');
    expect(
      within(screen.getByRole('tablist'))
        .getAllByRole('tab')
        .map((tab) => text(tab)),
    ).toEqual(['Open 0', 'Resolved 2', 'All 2']);
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('failed for now: the board-04 failed state, then Try again reads the list', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    faults(sample).failNext('OperationsService.listSupportReports');
    inAdmin(runtime, SUPPORT, <SupportReports />);
    expect(
      await screen.findByText('The support reports didn’t load. Nothing was lost.'),
    ).toBeVisible();
    expect(main()).toHaveTextContent('Try again. If it keeps happening, report the problem.');
    expect(screen.getByRole('link', { name: 'Report a problem' })).toHaveAttribute(
      'href',
      '/admin/help/report',
    );
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('table')).toBeVisible();
  });
});

// ---- SA-21 Support report ---------------------------------------------------------------------

function openReport(runtime: PlatformRuntime, id: string) {
  return inAdmin(runtime, `${SUPPORT}/${id}`, <SupportReport reportId={id} />);
}

describe('SA-21 — Support report (B7-09 f8 … f12, f14)', () => {
  it('open: the header, what they reported, the history and the Resolve panel (f8)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    openReport(runtime, 'SUP-0213');
    const decision = await panel();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'The VR simulation stopped loading at the second step',
      }),
    ).toHaveAttribute('tabindex', '-1');
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', SUPPORT);
    expect(main().querySelector('a.xr-back')).toHaveTextContent('Support');
    expect(text(main().querySelector('.xr-overline'))).toBe('Support report · SUP-0213');
    expect(main().querySelector('.xr-overline .xr-id')).toHaveTextContent('SUP-0213');
    expect(text(main().querySelector('.xr-phead-meta'))).toBe('Open Sent 16 Oct 2026');
    expect(main().querySelector('.xr-phead-meta .xr-status')).toHaveClass('xr-status--info');
    expect(topTitle()).toBe('Operations');
    expect(crumbs()).toEqual(['Operations', 'Support', 'SUP-0213']);
    const reported = screen.getByRole('region', { name: 'What they reported' });
    expect(
      [...reported.querySelectorAll('dl.xl-kv.xv-kv > *')].map((node) => node.textContent),
    ).toEqual([
      'From',
      'Rahul Verma · Student · Godavari Institute of Technology',
      'What happened',
      'The VR simulation stopped loading at the second step.',
      'Where',
      'ME ZG523 · Shell-and-Tube Heat Exchanger · Simulation · VR',
      'Screenshot',
      'No screenshot added',
    ]);
    const institution = within(reported).getByRole('link', {
      name: 'Open Godavari Institute of Technology',
    });
    expect(institution).toHaveAttribute('href', '/admin/institutions/godavari');
    expect(institution).toHaveClass('xr-btn', 'xr-btn--text', 'xr-btn--sm');
    const history = screen.getByRole('region', { name: 'History' });
    expect(history.querySelector('.xr-section-head .xr-meta')).toHaveTextContent('Newest first');
    expect([...history.querySelectorAll('li.xr-tl')].map((item) => text(item))).toEqual([
      'Sent 16 Oct 2026',
    ]);
    expect(history.querySelector('li.is-latest')).toBeNull();
    // The panel: one static panel, the note, Resolve, and the stripped foot (ND-14).
    expect(decision).toHaveClass('xr-dpanel', 'xg-static');
    const note = within(decision).getByRole('textbox', { name: 'Note to the reporter' });
    expect(note).toHaveAccessibleDescription(
      'They see it with the report. Say what changed and what to try.',
    );
    expect(within(decision).getByRole('button', { name: 'Resolve' })).toHaveClass(
      'xr-btn--primary',
      'xr-btn--block',
    );
    expect(decision.querySelector('.xl-open')).toHaveTextContent('No response-time target is set.');
    expect(decision).not.toHaveTextContent('ND-14');
    expect(main().querySelector('.xr-jump')).toBeNull();
    expect(main().querySelector('.xr-notice')).toBeNull();
  });

  it('Resolve with no note: the drawn error, focus on the note, nothing written (f11)', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    openReport(runtime, 'SUP-0213');
    const decision = await panel();
    const version = sample.worldVersion();
    const user = userEvent.setup();
    await user.type(within(decision).getByRole('textbox'), '   ');
    await user.click(within(decision).getByRole('button', { name: 'Resolve' }));
    const note = within(decision).getByRole('textbox', { name: 'Note to the reporter' });
    await waitFor(() => expect(note).toHaveFocus());
    expect(note).toHaveAttribute('aria-invalid', 'true');
    expect(note).toHaveAccessibleDescription(
      'They see it with the report. Say what changed and what to try. Add a note — the reporter sees it',
    );
    expect(decision.querySelector('.xr-error')).toHaveTextContent(
      'Add a note — the reporter sees it',
    );
    expect(sample.worldVersion()).toBe(version);
    // Typing clears the error.
    await user.type(note, 'x');
    expect(note).not.toHaveAttribute('aria-invalid');
  });

  it('Resolve: the flash takes focus, the decided panel shows, the reporter reads Resolved and the note (f9)', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    openReport(runtime, 'SUP-0213');
    const decision = await panel();
    const user = userEvent.setup();
    const words = 'The VR build was fixed. Please open the simulation again.';
    await user.type(within(decision).getByRole('textbox'), words);
    await user.click(within(decision).getByRole('button', { name: 'Resolve' }));
    const flash = document.getElementById('support-flash')!;
    await waitFor(() =>
      expect(flash).toHaveTextContent('SUP-0213 resolved. The reporter sees your note.'),
    );
    await waitFor(() => expect(flash).toHaveFocus());
    expect(flash).toHaveClass('xa-save', 'is-ok');
    expect(flash).toHaveAttribute('role', 'status');
    expect(text(main().querySelector('.xr-phead-meta'))).toBe('Resolved Sent 16 Oct 2026');
    expect(within(decision).queryByRole('textbox')).toBeNull();
    expect(decision.querySelector('.xr-status--ok')).toHaveTextContent('Resolved');
    expect(decision).toHaveTextContent(/Resolved on 23 Oct 2026 by Arjun Mehta/);
    expect(decision).toHaveTextContent(`“${words}”`);
    expect(decision).toHaveTextContent('The reporter sees this note.');
    expect(within(decision).getByRole('button', { name: 'Reopen' })).toHaveClass(
      'xr-btn--secondary',
      'xr-btn--block',
    );
    const history = screen.getByRole('region', { name: 'History' });
    expect([...history.querySelectorAll('li.xr-tl')].map((item) => text(item))).toEqual([
      `Resolved 23 Oct 2026 “${words}”`,
      'Sent 16 Oct 2026',
    ]);
    // The same SUP record, as the reporter reads it on their own Help.
    const theirs = await asPersonId(sample, RAHUL).operations.getMyReport('SUP-0213' as never);
    expect(theirs.ok && [theirs.value.state, theirs.value.resolutions.at(-1)?.note]).toEqual([
      'resolved',
      words,
    ]);
  });

  it('Reopen (DL-1): focus on Reopen, Cancel returns to it; confirmed, the report reads Reopened on both sides (f12)', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    const before = await reportOf(runtime, 'SUP-0213');
    await runtime.ports.operations.resolveReport({
      id: before.id,
      note: 'Fixed — please try again.',
      expectedRev: before.rev,
    });
    openReport(runtime, 'SUP-0213');
    const decision = await panel();
    const user = userEvent.setup();
    const reopen = await within(decision).findByRole('button', { name: 'Reopen' });
    await user.click(reopen);
    let dialog = await screen.findByRole('dialog', { name: 'Reopen SUP-0213?' });
    expect(dialog).toHaveTextContent(
      'It goes back to the open reports. The reporter sees it is open again. Your earlier note stays in the history.',
    );
    expect(within(dialog).getByRole('button', { name: 'Reopen' })).toHaveFocus();
    const version = sample.worldVersion();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(reopen).toHaveFocus();
    expect(sample.worldVersion()).toBe(version);

    await user.click(reopen);
    dialog = await screen.findByRole('dialog', { name: 'Reopen SUP-0213?' });
    await user.click(within(dialog).getByRole('button', { name: 'Reopen' }));
    const flash = document.getElementById('support-flash')!;
    await waitFor(() =>
      expect(flash).toHaveTextContent('SUP-0213 is open again. The reporter sees it is reopened.'),
    );
    await waitFor(() => expect(flash).toHaveFocus());
    expect(text(main().querySelector('.xr-phead-meta'))).toBe('Reopened Sent 16 Oct 2026');
    expect(main().querySelector('.xr-phead-meta .xr-status')).toHaveClass('xr-status--wait');
    const notice = main().querySelector('.xr-notice--warn')!;
    expect(text(notice)).toBe('Reopened by Arjun Mehta Earlier note: “Fixed — please try again.”');
    expect(within(decision).getByRole('textbox', { name: 'Note to the reporter' })).toHaveValue('');
    const history = screen.getByRole('region', { name: 'History' });
    expect([...history.querySelectorAll('li.xr-tl')].map((item) => text(item))).toEqual([
      'Reopened 23 Oct 2026 By Arjun Mehta.',
      'Resolved 23 Oct 2026 “Fixed — please try again.”',
      'Sent 16 Oct 2026',
    ]);
    const theirs = await asPersonId(sample, RAHUL).operations.getMyReport('SUP-0213' as never);
    expect(theirs.ok && theirs.value.state).toBe('reopened');
  });

  it('reopened (f10): the earlier note first; Resolve again with a new note', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    openReport(runtime, 'SUP-0207');
    const decision = await panel();
    const notice = main().querySelector('.xr-notice--warn')!;
    expect(notice).toHaveAttribute('role', 'status');
    expect(text(notice)).toBe(
      'Reopened by Arjun Mehta Earlier note: “The preview now loads. Please try again.”',
    );
    // The notice is the first thing in the details column.
    expect(main().querySelector('.xr-decide > .xr-stack')!.firstElementChild).toBe(notice);
    const reported = screen.getByRole('region', { name: 'What they reported' });
    expect(reported).toHaveTextContent('Kavya Nair · Content Manager');
    expect(within(reported).queryByRole('link')).toBeNull();
    const history = screen.getByRole('region', { name: 'History' });
    expect([...history.querySelectorAll('li.xr-tl')].map((item) => text(item))).toEqual([
      'Reopened 6 Oct 2026 By Arjun Mehta.',
      'Resolved 30 Sep 2026 “The preview now loads. Please try again.”',
      'Sent 28 Sep 2026',
    ]);
    expect(within(decision).getByRole('textbox', { name: 'Note to the reporter' })).toBeVisible();
  });

  it('changed since it was opened: refused calmly, the note kept, focus on the panel’s heading', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    openReport(runtime, 'SUP-0213');
    const decision = await panel();
    answerWith(runtime, 'resolveReport', { kind: 'stale-version', currentRev: 9 });
    const version = sample.worldVersion();
    const user = userEvent.setup();
    await user.type(within(decision).getByRole('textbox'), 'Fixed.');
    await user.click(within(decision).getByRole('button', { name: 'Resolve' }));
    await waitFor(() =>
      expect(within(decision).getByRole('heading', { name: 'Resolve' })).toHaveFocus(),
    );
    const notice = decision.querySelector('.xr-notice--warn')!;
    expect(notice).toHaveAttribute('role', 'alert');
    expect(text(notice)).toBe(
      'This report changed since you opened it It has been read again. Check it, then decide again.',
    );
    expect(within(decision).getByRole('textbox')).toHaveValue('Fixed.');
    expect(sample.worldVersion()).toBe(version);
  });

  it('resolved in another session meanwhile: refused as moved on, the current state shown', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    openReport(runtime, 'SUP-0213');
    const decision = await panel();
    const opened = await reportOf(runtime, 'SUP-0213');
    const elsewhere = await asPersonId(sample, SUPER_ADMIN).operations.resolveReport({
      id: opened.id,
      note: 'Fixed elsewhere.',
      expectedRev: opened.rev,
    });
    expect(elsewhere.ok).toBe(true);
    const version = sample.worldVersion();
    const user = userEvent.setup();
    await user.type(within(decision).getByRole('textbox'), 'Fixed here.');
    await user.click(within(decision).getByRole('button', { name: 'Resolve' }));
    await waitFor(() => expect(decision).toHaveTextContent('“Fixed elsewhere.”'));
    expect(text(decision.querySelector('.xr-notice'))).toBe(
      'This report has moved on. Its current state is shown.',
    );
    await waitFor(() =>
      expect(within(decision).getByRole('heading', { name: 'Resolve' })).toHaveFocus(),
    );
    expect(sample.worldVersion()).toBe(version);
  });

  it('the Super Admin’s own report: Resolve is refused by the service, calmly (SUP-03)', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    const sent = await runtime.ports.operations.reportProblem({
      whatHappened: 'The Overview figures did not refresh.',
      where: 'Overview',
      screenshotFileName: 'overview.png',
    });
    if (!sent.ok) throw new Error(sent.error.kind);
    openReport(runtime, sent.value.id);
    const decision = await panel();
    expect(screen.getByRole('region', { name: 'What they reported' })).toHaveTextContent(
      'Arjun Mehta · Super Admin',
    );
    expect(screen.getByRole('region', { name: 'What they reported' })).toHaveTextContent(
      'overview.png',
    );
    const version = sample.worldVersion();
    const user = userEvent.setup();
    await user.type(within(decision).getByRole('textbox'), 'Done.');
    await user.click(within(decision).getByRole('button', { name: 'Resolve' }));
    await waitFor(() =>
      expect(within(decision).getByRole('heading', { name: 'Resolve' })).toHaveFocus(),
    );
    expect(text(decision.querySelector('.xr-notice'))).toBe(
      'You sent this report Nobody resolves a report they sent themselves. Nothing has changed.',
    );
    expect(sample.worldVersion()).toBe(version);
    expect(within(decision).getByRole('textbox')).toHaveValue('Done.');
  });

  it('Reopen refused while the policy is open (SUP-04): the report stays resolved', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    const before = await reportOf(runtime, 'SUP-0213');
    await runtime.ports.operations.resolveReport({
      id: before.id,
      note: 'Fixed.',
      expectedRev: before.rev,
    });
    openReport(runtime, 'SUP-0213');
    const decision = await panel();
    answerWith(runtime, 'reopenReport', { kind: 'policy-open', decision: 'SUP-04' });
    const user = userEvent.setup();
    await user.click(await within(decision).findByRole('button', { name: 'Reopen' }));
    const dialog = await screen.findByRole('dialog', { name: 'Reopen SUP-0213?' });
    await user.click(within(dialog).getByRole('button', { name: 'Reopen' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(decision).toHaveTextContent(
      'Reopening a report you sent isn’t decided yet. Nothing has changed.',
    );
    expect(decision).not.toHaveTextContent('SUP-04');
    expect(decision.querySelector('.xr-status--ok')).toHaveTextContent('Resolved');
  });

  it('a reference the service does not answer is the in-shell not-found page', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    openReport(runtime, 'SUP-9999');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
  });

  it('failed for now: the failed state with Try again', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    faults(sample).failNext('OperationsService.getMyReport');
    openReport(runtime, 'SUP-0213');
    expect(
      await screen.findByText('The support report didn’t load. Nothing was lost.'),
    ).toBeVisible();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(await panel()).toBeVisible();
  });
});

// ---- SA-22 Operations › Access ending ---------------------------------------------------------

describe('SA-22 — Operations › Access ending (B7-09 f4, f5, f6; B7-10 f13)', () => {
  it('soonest first, ended after: the drawn rows, their two actions and the note (f4)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    inAdmin(runtime, ENDING, <AccessEnding />);
    const table = await screen.findByRole('table');
    expect(screen.getByRole('heading', { level: 1, name: 'Operations' })).toBeVisible();
    expect(main().querySelector('.xr-phead-meta .xl-meta')).toHaveTextContent(
      'Device transfers, support reports and access that is ending',
    );
    expect(topTitle()).toBe('Operations');
    expect(crumbs()).toEqual(['Operations', 'Access ending']);
    expect(tabsOf()).toEqual([
      ['Device transfers', '/admin/operations/device-transfers', null],
      ['Support', SUPPORT, null],
      ['Access ending', ENDING, 'page'],
    ]);
    const section = screen.getByRole('region', { name: 'Ending within 15 days, or ended' });
    expect(section.querySelector('.xr-section-head .xr-meta')).toHaveTextContent(
      'As of 23 Oct 2026 · soonest first',
    );
    expect([...table.querySelectorAll('th')].map((th) => th.textContent)).toEqual([
      'Institution',
      'Access ends',
      'Status',
      'Actions',
    ]);
    const rows = [...table.querySelectorAll('tbody tr')];
    expect(rows.map((row) => [...row.querySelectorAll('td')].map((cell) => text(cell)))).toEqual([
      [
        'BITS Pilani — Hyderabad Campus ACC-0098 · Internal',
        '31 Oct 2026 8 days left',
        'Renewal in progress REQ-0038 under review',
        'Open request Open institution',
      ],
      [
        'Konark Polytechnic ACC-0091 · External',
        '2 Nov 2026 10 days left',
        'Reminder due Nothing is sent from here',
        'Open institution',
      ],
      [
        'Malnad College of Engineering ACC-0079 · External',
        '15 Oct 2026 Ended 8 days ago',
        'Access ended No renewal requested',
        'Open institution',
      ],
    ]);
    expect(rows.map((row) => row.querySelector('.xr-status')!.className)).toEqual([
      'xr-status xr-status--info',
      'xr-status xr-status--wait',
      'xr-status xr-status--off',
    ]);
    const request = within(rows[0] as HTMLElement).getByRole('link', {
      name: 'Open request REQ-0038',
    });
    expect(request).toHaveAttribute('href', '/admin/requests/REQ-0038');
    expect(request).toHaveClass('xr-btn--secondary', 'xr-btn--sm');
    for (const [index, id, name] of [
      [0, 'bitshyd', 'BITS Pilani — Hyderabad Campus'],
      [1, 'konark', 'Konark Polytechnic'],
      [2, 'malnad', 'Malnad College of Engineering'],
    ] as const) {
      const link = within(rows[index] as HTMLElement).getByRole('link', { name: `Open ${name}` });
      expect(link).toHaveAttribute('href', `/admin/institutions/${id}`);
      expect(link).toHaveClass('xr-btn--text', 'xr-btn--sm');
    }
    // No status action anywhere (B7-10 f8, f13): links only, nothing is sent.
    expect(within(table).queryAllByRole('button')).toHaveLength(0);
    expect(main().querySelector('p.xl-open')).toHaveTextContent(
      '“Reminder due” is a status only — nothing is sent from here, and no reminder channel is set. Renewals come in as requests.',
    );
    expect(main()).not.toHaveTextContent('T-31');
  });

  it('nothing ending: the calm state, the note kept; the answer carries no date (f5)', async () => {
    const world = await fixtureWorld(FIXTURE);
    const plans = Object.fromEntries(
      Object.entries(world.records.plans).map(([id, plan]) => [
        id,
        { ...(plan as AccessPlan), endsOn: '2027-12-31' },
      ]),
    );
    const { runtime } = await worldPlatform(SUPER_ADMIN, {
      ...world,
      records: { ...world.records, plans: plans as typeof world.records.plans },
    });
    inAdmin(runtime, ENDING, <AccessEnding />);
    const empty = await screen.findByRole('heading', {
      level: 3,
      name: 'No access is ending in the next 15 days',
    });
    const block = empty.closest('.xr-empty')!;
    expect(block.querySelector('.xr-empty-icon')).toHaveClass('xr-x-empty-icon--ok');
    expect(block).toHaveTextContent(
      'Institutions whose access ends within 15 days, or has just ended, appear here.',
    );
    expect(screen.queryByRole('table')).toBeNull();
    expect(main().querySelector('.xr-section-head .xr-meta')).toBeNull();
    expect(main().querySelector('p.xl-open')).toHaveTextContent('“Reminder due” is a status only');
  });

  it('the “as of” day is read back from the answer’s own day counts', () => {
    const row = (endsOn: string, daysLeft: number | null, endedDaysAgo: number | null) => ({
      row: {
        institutionId: 'x',
        planId: 'ACC-0001',
        endsOn,
        daysLeft,
        endedDaysAgo,
        standing: { kind: 'reminder-due' },
      },
      institutionName: 'X',
      institutionKind: 'external',
    });
    expect(asOfDate([row('2026-11-02', 10, null)] as never)).toBe('2026-10-23');
    expect(asOfDate([row('2026-10-15', null, 8)] as never)).toBe('2026-10-23');
    expect(asOfDate([row('2027-01-05', 7, null)] as never)).toBe('2026-12-29');
    expect(asOfDate([])).toBeNull();
  });

  it('failed for now: the failed state with Try again', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    faults(sample).failNext('OperationsService.listAccessEnding');
    inAdmin(runtime, ENDING, <AccessEnding />);
    expect(
      await screen.findByText('Access that is ending didn’t load. Nothing was lost.'),
    ).toBeVisible();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('table')).toBeVisible();
  });
});

// ---- SA-07 "Needs attention": access ending (B7-03 konark) -------------------------------------

describe('SA-07 — access ending with a reminder due needs attention (B7-03 konark)', () => {
  it('Konark: the reminder row first, opening Operations › Access ending; Malnad: nothing', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    const first = inAdmin(
      runtime,
      '/admin/institutions/konark',
      <InstitutionDetail institutionId="konark" />,
    );
    await screen.findByRole('heading', { level: 1, name: 'Konark Polytechnic' });
    const attention = screen.getByRole('region', { name: 'Needs attention' });
    expect([...attention.querySelectorAll('.xr-row-title')].map((row) => row.textContent)).toEqual([
      'Access ends 2 Nov 2026 — reminder due (nothing is sent from here)',
      'REQ-0040 additional licences — under review',
    ]);
    const row = attention.querySelector('.xr-row') as HTMLElement;
    expect(within(row).getByRole('link', { name: 'Operations › Access ending' })).toHaveAttribute(
      'href',
      ENDING,
    );
    first.view.unmount();

    inAdmin(runtime, '/admin/institutions/malnad', <InstitutionDetail institutionId="malnad" />);
    await screen.findByRole('heading', { level: 1, name: 'Malnad College of Engineering' });
    expect(screen.getByRole('region', { name: 'Needs attention' })).toHaveTextContent(
      'Nothing needs attention.',
    );
  });
});

// ---- The ledger rows of these screens --------------------------------------------------------

describe('the SA-20 / SA-21 / SA-22 link-target rows', () => {
  it('every link target is built; Resolve is the one primary', () => {
    for (const entry of P6_OPERATIONS_6_LINK_TARGETS) {
      expect(entry.outcome, entry.action).not.toBe('not-rendered');
      if (entry.target === null) continue;
      const target = expandTarget(entry.target, '/admin').split('?')[0]!;
      expect(['screen', 'record-screen'], `${entry.screen} ${entry.action}`).toContain(
        resolveAddress(target).kind,
      );
    }
    expect(
      P6_OPERATIONS_6_LINK_TARGETS.filter((entry) => entry.role === 'primary').map(
        (entry) => `${entry.screen}: ${entry.action}`,
      ),
    ).toEqual(['SA-21: Resolve']);
    const keys = P6_OPERATIONS_6_LINK_TARGETS.map(
      (entry) => `${entry.screen}|${entry.where}|${entry.action}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
  });
});

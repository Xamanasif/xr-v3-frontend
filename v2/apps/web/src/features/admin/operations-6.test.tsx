/**
 * The Super Admin's Operations in the V3 design (SA-v1 `V.support`, `V.report`, `V.accessEnding`):
 * SA-20 Support, SA-21 Support report and SA-22 Access ending, with SA-07's access-ending row of
 * "Needs attention" (B7-03 konark), on the real composition root and
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
const crumbs = () => {
  const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
  return [...nav.querySelectorAll('a, [aria-current="page"]')].map((item) => item.textContent);
};
const cells = (row: Element) => [...row.querySelectorAll('td')].map((cell) => cell.textContent);
const tabsOf = () =>
  within(screen.getByRole('navigation', { name: 'Operations' }))
    .getAllByRole('link')
    .map((link) => [
      link.textContent,
      link.getAttribute('href'),
      link.getAttribute('aria-current'),
    ]);
const views = () =>
  within(screen.getByRole('group', { name: 'Show support reports' }))
    .getAllByRole('button')
    .map((button) => [button.textContent, button.getAttribute('aria-pressed')]);
const panel = () => screen.findByRole('complementary', { name: /^Resolved?$/ });
const INTERNAL = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

/** No internal reference in the page's words, names or descriptions (SA-v1 HANDOFF). */
function expectNoReferences(root: Element = main()) {
  expect(root.textContent).not.toMatch(INTERNAL);
  for (const element of root.querySelectorAll('[aria-label], [title]')) {
    expect(element.getAttribute('aria-label') ?? '').not.toMatch(INTERNAL);
    expect(element.getAttribute('title') ?? '').not.toMatch(INTERNAL);
  }
  expect(document.title).not.toMatch(INTERNAL);
}

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

const SUP_0213_TITLE = 'The VR simulation stopped loading at the second step';
const SUP_0207_TITLE = 'The preview of the WEB delivery link showed an empty frame';

// ---- SA-20 Operations › Support ---------------------------------------------------------------

describe('SA-20 — Operations › Support (SA-v1 `V.support`)', () => {
  it('Open: the head, the tabs, the counted views and the open reports, oldest first, named by their titles', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    inAdmin(runtime, SUPPORT, <SupportReports />);
    const table = await screen.findByRole('table', { name: 'Support reports, oldest first' });
    expect(screen.getByRole('heading', { level: 1, name: 'Operations' })).toHaveAttribute(
      'tabindex',
      '-1',
    );
    expect(main()).toHaveTextContent(
      'Device transfers, support reports and access that is ending.',
    );
    expect(document.title).toBe('Support · Operations · XR Learning Platform');
    expect(tabsOf()).toEqual(OPERATIONS_TABS_SUPPORT);
    expect(screen.getByRole('region', { name: 'Support reports' })).toHaveTextContent(
      'Sent from Help by anyone signed in · oldest first',
    );
    expect(views()).toEqual([
      ['Open 2', 'true'],
      ['Resolved 0', 'false'],
      ['All 2', 'false'],
    ]);
    expect([...table.querySelectorAll('th')].map((th) => th.textContent)).toEqual([
      'Report',
      'From',
      'Where',
      'Last activity',
      'Status',
    ]);
    const rows = [...table.querySelectorAll('tbody tr')];
    expect(rows.map(cells)).toEqual([
      [
        `${SUP_0207_TITLE}Sent 28 Sep 2026`,
        'Kavya NairContent Manager',
        'Content library · Forced Convection',
        'Last activity Reopened 6 Oct',
        'Reopened',
      ],
      [
        `${SUP_0213_TITLE}Sent 16 Oct 2026`,
        'Rahul VermaStudent · Godavari Institute of Technology',
        'ME ZG523 · Shell-and-Tube Heat Exchanger · Simulation · VR',
        'Last activity Sent 16 Oct',
        'Open',
      ],
    ]);
    expect(rows[0]!.querySelector('.xr-st')).toHaveClass('xr-st--warn');
    expect(rows[1]!.querySelector('.xr-st')).toHaveClass('xr-st--info');
    expect(
      within(rows[1] as HTMLElement).getByRole('link', {
        name: `${SUP_0213_TITLE}, Open. Open the report`,
      }),
    ).toHaveAttribute('href', `${SUPPORT}/SUP-0213`);
    expect(main()).toHaveTextContent(
      'The reporter reads your resolution note. No response-time target is set.',
    );
    expectNoReferences();
  });

  it('All and Resolved: the address follows the view; Resolved is empty', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    const { navigation } = inAdmin(runtime, SUPPORT, <SupportReports />);
    await screen.findByRole('table');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /^Resolved/ }));
    expect(navigation.replace).toHaveBeenLastCalledWith(`${SUPPORT}?show=resolved`);
    expect(await screen.findByText('No resolved reports yet')).toHaveClass('rk-state-t');
    expect(main()).toHaveTextContent('Reports sent from Help appear here.');
    await user.click(screen.getByRole('button', { name: /^All/ }));
    expect(navigation.replace).toHaveBeenLastCalledWith(`${SUPPORT}?show=all`);
    expect(screen.getByRole('button', { name: /^All/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('table').querySelectorAll('tbody tr')).toHaveLength(2);
  });

  it('an addressed view is read; one that names no view is replaced by the list', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    const first = inAdmin(runtime, SUPPORT, <SupportReports />, '?show=all');
    await screen.findByRole('table');
    expect(screen.getByRole('button', { name: /^All/ })).toHaveAttribute('aria-pressed', 'true');
    expect(first.navigation.replace).not.toHaveBeenCalled();
    first.view.unmount();
    const second = inAdmin(runtime, SUPPORT, <SupportReports />, '?show=everything');
    await screen.findByRole('table');
    expect(second.navigation.replace).toHaveBeenCalledWith(SUPPORT);
  });

  it('nothing open: the empty state on the Open view', async () => {
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
    const empty = await screen.findByText('Nothing is open');
    expect(empty.closest('.rk-state')).toHaveTextContent('Reports sent from Help appear here.');
    expect(views()).toEqual([
      ['Open 0', 'true'],
      ['Resolved 2', 'false'],
      ['All 2', 'false'],
    ]);
    expect(screen.queryByRole('table')).toBeNull();
  });

  it('failed for now: the failed state, then Try again reads the list', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    faults(sample).failNext('OperationsService.listSupportReports');
    inAdmin(runtime, SUPPORT, <SupportReports />);
    expect(await screen.findByText('We couldn’t load the support reports')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('Nothing has changed. Try again.');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('table')).toBeVisible();
  });
});

// ---- SA-21 Support report ---------------------------------------------------------------------

function openReport(runtime: PlatformRuntime, id: string) {
  return inAdmin(runtime, `${SUPPORT}/${id}`, <SupportReport reportId={id} />);
}

describe('SA-21 — Support report (SA-v1 `V.report`)', () => {
  it('open: the crumbs, the head, what they reported, the history and the Resolve panel', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    openReport(runtime, 'SUP-0213');
    const decision = await panel();
    const h1 = screen.getByRole('heading', { level: 1, name: SUP_0213_TITLE });
    expect(h1).toHaveAttribute('tabindex', '-1');
    expect(crumbs()).toEqual(['Operations', 'Support', SUP_0213_TITLE]);
    const head = main().querySelector('.rk-head')!;
    expect(head.querySelector('.rk-eyebrow')).toHaveTextContent('Support report');
    expect(text(head.querySelector('.rk-meta'))).toBe('Open Rahul Verma, Student Sent 16 Oct 2026');
    expect(head.querySelector('.xr-st')).toHaveClass('xr-st--info', 'rk-st-lg');
    expect(document.title).toBe(`${SUP_0213_TITLE} · Operations · XR Learning Platform`);
    const reported = screen.getByRole('region', { name: 'What they reported' });
    expect([...reported.querySelectorAll('dl.rk-dl > *')].map((node) => node.textContent)).toEqual([
      'From',
      'Rahul Verma · Student · Godavari Institute of Technology',
      'What happened',
      'The VR simulation stopped loading at the second step.',
      'Where',
      'ME ZG523 · Shell-and-Tube Heat Exchanger · Simulation · VR',
      'Screenshot',
      'No screenshot added',
    ]);
    // Kept from the product: the reporter's institution.
    expect(
      within(reported).getByRole('link', { name: 'Open Godavari Institute of Technology' }),
    ).toHaveAttribute('href', '/admin/institutions/godavari');
    const history = screen.getByRole('region', { name: 'History' });
    expect(history).toHaveTextContent('Newest first');
    expect([...history.querySelectorAll('ol.rk-tl li')].map((item) => text(item))).toEqual([
      'Sent 16 Oct 2026',
    ]);
    // The panel: the note, Resolve report and the line about response times.
    expect(decision).toHaveAttribute('id', 'support-decision');
    const note = within(decision).getByRole('textbox', { name: 'Resolution note (required)' });
    expect(note).toHaveAccessibleDescription(
      'The reporter sees this note on their report in Help & support.',
    );
    expect(within(decision).getByRole('button', { name: 'Resolve report' })).toHaveClass(
      'rb-btn--primary',
      'rk-go',
    );
    expect(decision).toHaveTextContent('No response-time target is set.');
    expect(main().querySelector('.rk-notice')).toBeNull();
    expectNoReferences();
  });

  it('Resolve with no note: the drawn error, focus on the note, nothing written', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    openReport(runtime, 'SUP-0213');
    const decision = await panel();
    const version = sample.worldVersion();
    const user = userEvent.setup();
    await user.type(within(decision).getByRole('textbox'), '   ');
    await user.click(within(decision).getByRole('button', { name: 'Resolve report' }));
    const note = within(decision).getByRole('textbox', { name: 'Resolution note (required)' });
    await waitFor(() => expect(note).toHaveFocus());
    expect(note).toHaveAttribute('aria-invalid', 'true');
    expect(note).toHaveAccessibleDescription(
      'The reporter sees this note on their report in Help & support. Add a note — the reporter sees it',
    );
    expect(decision.querySelector('.rk-ferr')).toHaveTextContent(
      'Add a note — the reporter sees it',
    );
    expect(sample.worldVersion()).toBe(version);
    // Typing clears the error.
    await user.type(note, 'x');
    expect(note).not.toHaveAttribute('aria-invalid');
  });

  it('Resolve: the flash takes focus, the decided panel shows, the reporter reads Resolved and the note', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    openReport(runtime, 'SUP-0213');
    const decision = await panel();
    const user = userEvent.setup();
    const words = 'The VR build was fixed. Please open the simulation again.';
    await user.type(within(decision).getByRole('textbox'), words);
    await user.click(within(decision).getByRole('button', { name: 'Resolve report' }));
    const flash = await waitFor(() => {
      const element = document.getElementById('support-flash');
      expect(element).toHaveFocus();
      return element!;
    });
    expect(flash).toHaveClass('rk-notice', 'rk-notice--ok');
    expect(flash).toHaveAttribute('role', 'status');
    expect(text(flash)).toBe('Report resolved. Rahul Verma sees your note on their report.');
    expect(text(main().querySelector('.rk-head .rk-meta'))).toBe(
      'Resolved Rahul Verma, Student Sent 16 Oct 2026',
    );
    expect(within(decision).getByRole('heading', { name: 'Resolved' })).toBeVisible();
    expect(within(decision).queryByRole('textbox')).toBeNull();
    const done = decision.querySelector('.rk-done')!;
    expect(done.querySelector('.xr-st')).toHaveTextContent('Resolved');
    expect(done.querySelector('.rk-done-meta')).toHaveTextContent('Resolved on 23 Oct 2026');
    expect(text(done.querySelector('blockquote.rk-quote'))).toBe(
      `${words} Note shown to the reporter`,
    );
    expect(within(decision).getByRole('button', { name: 'Reopen' })).toHaveClass('rb-btn');
    expect(done).toHaveTextContent(
      'It goes back to the open reports. The reporter sees it is open again. Your earlier note stays in the history.',
    );
    const history = screen.getByRole('region', { name: 'History' });
    expect([...history.querySelectorAll('ol.rk-tl li')].map((item) => text(item))).toEqual([
      `Resolved 23 Oct 2026 “${words}”`,
      'Sent 16 Oct 2026',
    ]);
    // The same report, as the reporter reads it on their own Help.
    const theirs = await asPersonId(sample, RAHUL).operations.getMyReport('SUP-0213' as never);
    expect(theirs.ok && [theirs.value.state, theirs.value.resolutions.at(-1)?.note]).toEqual([
      'resolved',
      words,
    ]);
    expectNoReferences();
  });

  it('Reopen asks first: focus on the title, Cancel returns to Reopen; confirmed, the report reads Reopened on both sides', async () => {
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
    let dialog = await screen.findByRole('dialog', { name: 'Reopen this report?' });
    expect(dialog).toHaveAccessibleDescription(
      'It goes back to the open reports. The reporter sees it is open again. Your earlier note stays in the history.',
    );
    // The export opens it on its confirm button (`SA.openDlg(…, 'dlg-ok')`).
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Reopen' })).toHaveFocus(),
    );
    const version = sample.worldVersion();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(reopen).toHaveFocus();
    expect(sample.worldVersion()).toBe(version);

    await user.click(reopen);
    dialog = await screen.findByRole('dialog', { name: 'Reopen this report?' });
    await user.click(within(dialog).getByRole('button', { name: 'Reopen' }));
    const flash = await waitFor(() => {
      const element = document.getElementById('support-flash');
      expect(element).toHaveFocus();
      return element!;
    });
    expect(text(flash)).toBe('Report reopened. It is back with the open reports.');
    expect(text(main().querySelector('.rk-head .rk-meta'))).toBe(
      'Reopened Rahul Verma, Student Sent 16 Oct 2026',
    );
    expect(main().querySelector('.rk-head .xr-st')).toHaveClass('xr-st--warn');
    const notice = decision.querySelector('.rk-notice--warn')!;
    expect(text(notice)).toBe(
      'Reopened by Arjun Mehta Your earlier note: “Fixed — please try again.”',
    );
    expect(
      within(decision).getByRole('textbox', { name: 'Resolution note (required)' }),
    ).toHaveValue('');
    const history = screen.getByRole('region', { name: 'History' });
    expect([...history.querySelectorAll('ol.rk-tl li')].map((item) => text(item))).toEqual([
      'Reopened 23 Oct 2026 By Arjun Mehta.',
      'Resolved 23 Oct 2026 “Fixed — please try again.”',
      'Sent 16 Oct 2026',
    ]);
    const theirs = await asPersonId(sample, RAHUL).operations.getMyReport('SUP-0213' as never);
    expect(theirs.ok && theirs.value.state).toBe('reopened');
  });

  it('reopened: the earlier note first in the panel; Resolve again with a new note', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    openReport(runtime, 'SUP-0207');
    const decision = await panel();
    const notice = decision.querySelector('.rk-notice--warn')!;
    expect(notice).toHaveAttribute('role', 'status');
    expect(text(notice)).toBe(
      'Reopened by Arjun Mehta Your earlier note: “The preview now loads. Please try again.”',
    );
    // The notice is the first thing in the panel's body.
    expect(decision.querySelector('.rk-panel-body')!.firstElementChild).toBe(notice);
    const reported = screen.getByRole('region', { name: 'What they reported' });
    expect(reported).toHaveTextContent('Kavya Nair · Content Manager');
    expect(within(reported).queryByRole('link')).toBeNull();
    const history = screen.getByRole('region', { name: 'History' });
    expect([...history.querySelectorAll('ol.rk-tl li')].map((item) => text(item))).toEqual([
      'Reopened 6 Oct 2026 By Arjun Mehta.',
      'Resolved 30 Sep 2026 “The preview now loads. Please try again.”',
      'Sent 28 Sep 2026',
    ]);
    expect(
      within(decision).getByRole('textbox', { name: 'Resolution note (required)' }),
    ).toBeVisible();
  });

  it('changed since it was opened: refused calmly, the note kept, focus on the panel’s heading; Check it again closes the notice', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    openReport(runtime, 'SUP-0213');
    const decision = await panel();
    answerWith(runtime, 'resolveReport', { kind: 'stale-version', currentRev: 9 });
    const version = sample.worldVersion();
    const user = userEvent.setup();
    await user.type(within(decision).getByRole('textbox'), 'Fixed.');
    await user.click(within(decision).getByRole('button', { name: 'Resolve report' }));
    await waitFor(() =>
      expect(within(decision).getByRole('heading', { name: 'Resolve' })).toHaveFocus(),
    );
    const notice = within(decision).getByRole('alert');
    expect(notice).toHaveClass('rk-notice--warn');
    expect(text(notice)).toBe(
      'This report changed since you opened it It has been read again. Check it, then decide again. Check it again',
    );
    expect(within(decision).getByRole('textbox')).toHaveValue('Fixed.');
    expect(sample.worldVersion()).toBe(version);
    await user.click(within(notice).getByRole('button', { name: 'Check it again' }));
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: SUP_0213_TITLE })).toHaveFocus(),
    );
    expect(within(decision).queryByRole('alert')).toBeNull();
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
    await user.click(within(decision).getByRole('button', { name: 'Resolve report' }));
    await waitFor(() => expect(decision).toHaveTextContent('Fixed elsewhere.'));
    expect(text(within(decision).getByRole('alert'))).toMatch(
      /^(This report has moved on\. Its current state is shown\.|This report changed since you opened it .*)$/,
    );
    await waitFor(() =>
      expect(within(decision).getByRole('heading', { name: 'Resolved' })).toHaveFocus(),
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
    await user.click(within(decision).getByRole('button', { name: 'Resolve report' }));
    await waitFor(() =>
      expect(within(decision).getByRole('heading', { name: 'Resolve' })).toHaveFocus(),
    );
    const notice = within(decision).getByRole('alert');
    expect(notice).toHaveClass('rk-notice--info');
    expect(text(notice)).toBe(
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
    const dialog = await screen.findByRole('dialog', { name: 'Reopen this report?' });
    await user.click(within(dialog).getByRole('button', { name: 'Reopen' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(decision).toHaveTextContent(
      'Reopening a report you sent isn’t decided yet. Nothing has changed.',
    );
    expect(decision).not.toHaveTextContent('SUP-04');
    expect(decision.querySelector('.rk-done .xr-st')).toHaveTextContent('Resolved');
  });

  it('Reopen unavailable for now: the confirmation stays open and says so in its body; nothing changed', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    const before = await reportOf(runtime, 'SUP-0213');
    await runtime.ports.operations.resolveReport({
      id: before.id,
      note: 'Fixed.',
      expectedRev: before.rev,
    });
    openReport(runtime, 'SUP-0213');
    const decision = await panel();
    const user = userEvent.setup();
    const reopen = await within(decision).findByRole('button', { name: 'Reopen' });
    await user.click(reopen);
    let dialog = await screen.findByRole('dialog', { name: 'Reopen this report?' });
    expect(within(dialog).queryByRole('alert')).toBeNull();
    const version = sample.worldVersion();
    faults(sample).failNext('OperationsService.reopenReport');
    await user.click(within(dialog).getByRole('button', { name: 'Reopen' }));
    // State-copy SA-21.unavailable.reopen, in the dialog's body (the export's `rk-dlg-body`).
    const alert = await within(dialog).findByRole('alert');
    expect(text(alert)).toBe('It wasn’t reopened. Nothing was lost — try again.');
    expect(alert).toHaveClass('rk-notice', 'rk-notice--warn');
    expect(alert.parentElement).toHaveClass('rk-dlg-body');
    expect(dialog).toBeVisible();
    expect(sample.worldVersion()).toBe(version);
    // Cancelled and opened again, the confirmation starts without the line.
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await user.click(reopen);
    dialog = await screen.findByRole('dialog', { name: 'Reopen this report?' });
    expect(within(dialog).queryByRole('alert')).toBeNull();
    // Confirmed again, it is sent.
    await user.click(within(dialog).getByRole('button', { name: 'Reopen' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect((await reportOf(runtime, 'SUP-0213')).state).toBe('reopened');
  });

  it('a reference the service does not answer is the “not available” message in place', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    openReport(runtime, 'SUP-9999');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'This page isn’t available' }),
    ).toBeVisible();
    await waitFor(() => expect(document.title).toBe('Not available · XR Learning Platform'));
    expectNoReferences();
  });

  it('failed for now: the failed state with Try again', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    faults(sample).failNext('OperationsService.getMyReport');
    openReport(runtime, 'SUP-0213');
    expect(await screen.findByText('We couldn’t load the support report')).toBeVisible();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(await panel()).toBeVisible();
  });
});

// ---- SA-22 Operations › Access ending ---------------------------------------------------------

describe('SA-22 — Operations › Access ending (SA-v1 `V.accessEnding`)', () => {
  it('soonest first, ended after: the read-only rows, their links and the note', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    inAdmin(runtime, ENDING, <AccessEnding />);
    const table = await screen.findByRole('table', {
      name: 'Access ending within 15 days, or recently ended, soonest first',
    });
    expect(screen.getByRole('heading', { level: 1, name: 'Operations' })).toBeVisible();
    expect(document.title).toBe('Access ending · Operations · XR Learning Platform');
    expect(tabsOf()).toEqual([
      ['Device transfers', '/admin/operations/device-transfers', null],
      ['Support', SUPPORT, null],
      ['Access ending', ENDING, 'page'],
    ]);
    const surface = screen.getByRole('region', {
      name: 'Access ending within 15 days, or recently ended',
    });
    expect(
      within(surface).getByRole('heading', {
        level: 2,
        name: 'Ending within 15 days, or recently ended',
      }),
    ).toBeVisible();
    expect(surface.querySelector('.rk-sec-h.sa-pad')).toHaveTextContent(
      'As of 23 Oct 2026 · soonest first',
    );
    expect(table).toHaveClass('sa-table', 'sa-table--rows');
    expect([...table.querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
      'Institution',
      'Access ends',
      'Status',
      'Actions',
    ]);
    const rows = [...table.querySelectorAll('tbody tr')];
    expect(
      rows.map((row) => [...row.querySelectorAll('th, td')].map((cell) => text(cell))),
    ).toEqual([
      [
        'BITS Pilani — Hyderabad Campus Internal',
        '31 Oct 2026 8 days left',
        'Renewal in progress Request under review',
        'Open request Open institution',
      ],
      [
        'Konark Polytechnic External',
        '2 Nov 2026 10 days left',
        'Reminder due Nothing is sent from here',
        'Open institution',
      ],
      [
        'Malnad College of Engineering External',
        '15 Oct 2026 Ended 8 days ago',
        'Access ended No renewal requested',
        'Open institution',
      ],
    ]);
    expect(rows.map((row) => row.querySelector('.xr-st')!.className)).toEqual([
      'xr-st xr-st--info',
      'xr-st xr-st--warn',
      'xr-st rk-st-ended',
    ]);
    expect([...rows[0]!.querySelectorAll('td')].map((cell) => cell.dataset['label'])).toEqual([
      'Access ends',
      'Status',
      'Actions',
    ]);
    const request = within(rows[0] as HTMLElement).getByRole('link', {
      name: 'Open the renewal request from BITS Pilani — Hyderabad Campus',
    });
    expect(request).toHaveAttribute('href', '/admin/requests/REQ-0038');
    expect(request).toHaveClass('rb-btn', 'rb-btn--ghost');
    for (const [index, id, name] of [
      [0, 'bitshyd', 'BITS Pilani — Hyderabad Campus'],
      [1, 'konark', 'Konark Polytechnic'],
      [2, 'malnad', 'Malnad College of Engineering'],
    ] as const) {
      const row = rows[index] as HTMLElement;
      expect(within(row).getByRole('link', { name })).toHaveAttribute(
        'href',
        `/admin/institutions/${id}`,
      );
      const open = within(row).getByRole('link', { name: `Open ${name}` });
      expect(open).toHaveAttribute('href', `/admin/institutions/${id}`);
      expect(open).toHaveClass('rb-btn--ghost');
    }
    // No status action anywhere: links only, nothing is sent.
    expect(within(table).queryAllByRole('button')).toHaveLength(0);
    expect(main().querySelector('p.rk-ca-foot')).toHaveTextContent(
      '“Reminder due” is a status only. Nothing is sent from here, and no reminder channel is set. Renewals come in as requests.',
    );
    expectNoReferences();
  });

  it('nothing ending: the empty state, the note kept; the answer carries no date', async () => {
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
    const empty = await screen.findByText('No access is ending in the next 15 days');
    expect(empty.closest('.rk-state')).toHaveTextContent(
      'Institutions whose access ends within 15 days, or has just ended, appear here.',
    );
    expect(screen.queryByRole('table')).toBeNull();
    expect(main().querySelector('.rk-sec-h.sa-pad p')).toBeNull();
    expect(main().querySelector('p.rk-ca-foot')).toHaveTextContent(
      '“Reminder due” is a status only.',
    );
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
    expect(await screen.findByText('We couldn’t load access ending')).toBeVisible();
    expect(screen.getByRole('alert')).toHaveTextContent('Nothing has changed. Try again.');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('table')).toBeVisible();
  });
});

// ---- SA-07: access ending on the plan band (SA-v1 `planBand`) --------------------------------------

describe('SA-07 — access ending with a reminder due, on its plan band (SA-v1 `planBand`)', () => {
  it('Konark: the reminder note, opening Operations › Access ending; Malnad: the ended note', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, FIXTURE);
    const first = inAdmin(
      runtime,
      '/admin/institutions/konark',
      <InstitutionDetail institutionId="konark" />,
    );
    await screen.findByRole('heading', { level: 1, name: 'Konark Polytechnic' });
    const note = document.querySelector('section.rk-plan .rk-plan-note--warn') as HTMLElement;
    expect(note).toHaveTextContent('Ends on 2 Nov 2026Reminder due. Nothing is sent from here.');
    expect(within(note).getByRole('link', { name: 'View access ending' })).toHaveAttribute(
      'href',
      ENDING,
    );
    first.view.unmount();

    inAdmin(runtime, '/admin/institutions/malnad', <InstitutionDetail institutionId="malnad" />);
    await screen.findByRole('heading', { level: 1, name: 'Malnad College of Engineering' });
    expect(document.querySelector('section.rk-plan .rk-plan-note--warn')).toBeNull();
    expect(document.querySelector('section.rk-plan .rk-plan-note--off')).toHaveTextContent(
      'This plan ended on 15 Oct 2026',
    );
    expect(screen.getByRole('complementary', { name: 'What you can do' })).toHaveTextContent(
      'Nothing else needs you here.',
    );
  });
});

// ---- The ledger rows of these screens --------------------------------------------------------

describe('the SA-20 / SA-21 / SA-22 link-target rows', () => {
  it('every link target is built; Resolve report is the one primary', () => {
    for (const entry of P6_OPERATIONS_6_LINK_TARGETS) {
      expect(entry.outcome, entry.action).not.toBe('not-rendered');
      if (entry.target === null || entry.target.startsWith('#')) continue;
      const target = expandTarget(entry.target, '/admin').split('?')[0]!;
      expect(['screen', 'record-screen'], `${entry.screen} ${entry.action}`).toContain(
        resolveAddress(target).kind,
      );
    }
    expect(
      P6_OPERATIONS_6_LINK_TARGETS.filter((entry) => entry.role === 'primary').map(
        (entry) => `${entry.screen}: ${entry.action}`,
      ),
    ).toEqual(['SA-21: Resolve report']);
    const keys = P6_OPERATIONS_6_LINK_TARGETS.map(
      (entry) => `${entry.screen}|${entry.where}|${entry.action}`,
    );
    expect(new Set(keys).size).toBe(keys.length);
    for (const entry of P6_OPERATIONS_6_LINK_TARGETS) expect(entry.action).not.toMatch(INTERNAL);
  });
});

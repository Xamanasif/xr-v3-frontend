/**
 * The Super Admin's content oversight in the V3 Refined B design (the owner-approved Super Admin
 * export, design/v3-refined-b/roles/SA-v1 `V.allContent`, `V.record`), on the real composition
 * root and the sample world, as Arjun Mehta (SA-01 Overview is tested in
 * sa-01-overview/overview.test.tsx): SA-12 All content and SA-13 Content record. Every figure,
 * row, status and refusal is the ports' answer: All content counts what `listAllContent` answers,
 * and the override moves a stuck record back to the vendor only through `overrideStatus` (a reason
 * required, the revision the page showed, the service deciding). No reference is shown. The
 * fixture `after-flow-e` is the B7 boards' day (23 Oct 2026).
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ServiceError } from '@xr/contracts/draft';
import { asPersonId, faults } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import {
  renderInTab,
  SUPER_ADMIN,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { AllContent } from './sa-12-all-content/all-content';
import { ContentRecord } from './sa-13-content-record/content-record';

afterEach(() => {
  forgetLastAddress();
  vi.restoreAllMocks();
});

const RITU = 'per-ritu-sharma';
const ALL = '/admin/content/all';

function inAdmin(runtime: PlatformRuntime, path: string, page: ReactNode, search = '') {
  const navigation = testNavigation(path, search);
  renderInTab(
    <WorkspaceLayout workspace="admin">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return navigation;
}

/** The page's main region (the document body where a test renders a page without its shell). */
const main = (): HTMLElement => screen.queryByRole('main') ?? document.body;
/** An element's words, its text nodes joined by spaces (as a screen reader reads them). */
function text(element: Element | null | undefined): string {
  if (!element) return '';
  const parts: string[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    parts.push(node.textContent ?? '');
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}
const heading = (name: string) =>
  screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });

/** No reference in the page's words or names (HANDOFF “Internal references”). */
function expectNoReferences() {
  const reference = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;
  expect(main().textContent ?? '').not.toMatch(reference);
  for (const element of main().querySelectorAll('[aria-label], [title]')) {
    expect(element.getAttribute('aria-label') ?? '').not.toMatch(reference);
  }
}

// ---- SA-12 All content (SA-v1 `V.allContent`) -------------------------------------------------

const tableRows = () => [
  ...main().querySelectorAll<HTMLTableRowElement>('table.rk-table tbody tr'),
];
const rowNamed = (name: string) =>
  tableRows().find((row) => text(row.querySelector('a.rk-rowlink')) === name);
const rowNames = () => tableRows().map((row) => text(row.querySelector('a.rk-rowlink')));
const count = () => text(main().querySelector('.rk-statusline [role="status"]'));
const statusFilter = () => screen.getByRole('combobox', { name: 'Workflow status' });
const search = () => screen.getByRole('searchbox', { name: 'Search' });

describe('SA-12 All content — the list is the service’s answer', () => {
  it('the head, the notices, the filter with its figures, the count and the rows', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    inAdmin(runtime, ALL, <AllContent />);
    await waitFor(() => expect(tableRows().length).toBeGreaterThan(0));
    expect(screen.getByRole('heading', { level: 1, name: 'Content' })).toBeVisible();
    expect(text(main().querySelector('.rk-head .rk-sub'))).toBe(
      'Where every experiment and submission is in the workflow, and who can act on it.',
    );
    const tabs = screen.getByRole('navigation', { name: 'Content' });
    expect(within(tabs).getByRole('link', { name: 'All content' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(tabs).getByRole('link', { name: 'Updates' })).toHaveAttribute(
      'href',
      '/admin/content/updates',
    );
    const all = await runtime.ports.production.listAllContent({});
    if (!all.ok) throw new Error('list');
    expect(all.value).toHaveLength(19);
    expect(
      within(statusFilter())
        .getAllByRole('option')
        .map((option) => [option.getAttribute('value'), option.textContent]),
    ).toEqual([
      ['all', 'All statuses (19)'],
      ['published', 'Published (13)'],
      ['review', 'With the Academic Reviewer (2)'],
      ['cm', 'With the Content Manager (2)'],
      ['vendor', 'Returned to the vendor (1)'],
      ['stuck', 'Stuck — nobody can act (1)'],
    ]);
    expect(statusFilter()).toHaveValue('all');
    expect(search()).toHaveAttribute('placeholder', 'Experiment or course code');
    expect(count()).toBe('19 records · read-only');
    const notices = [...main().querySelectorAll('.rk-notice')].map(text);
    expect(notices).toEqual([
      '1 record stuck — nobody can act DC Motor Speed Control (EEE ZC341). Open the record to see why. Show stuck records',
      'A correction is waiting for your release decision Distillation Column 1.2 → 1.3. Open Updates',
    ]);
    expect(screen.getByRole('link', { name: 'Open Updates' })).toHaveAttribute(
      'href',
      '/admin/content/updates',
    );
    const table = screen.getByRole('table', {
      name: 'Experiments and submissions with their workflow status',
    });
    expect([...table.querySelectorAll('thead th')].map(text)).toEqual([
      'Experiment',
      'Where it is',
      'Who can act',
      'Formats',
      'Status',
    ]);
    expect(tableRows()).toHaveLength(19);
    const distillation = rowNamed('Distillation Column')!;
    expect([...distillation.cells].map(text)).toEqual([
      'Distillation Column CHE ZG513',
      'Published · version 1.2 · live since 3 Jul 2026 Correction waiting for your release decision',
      'Nobody needs to act',
      'Formats: WEB, VR WEB VR',
      'Published',
    ]);
    expect(distillation.querySelector('.xr-st')).toHaveClass('xr-st--ok');
    expect(
      within(distillation).getByRole('link', {
        name: 'Distillation Column, Published. Open the record',
      }),
    ).toHaveAttribute('href', '/admin/content/records/distillation-column');
    expect(text(rowNamed('Boiler Drum Level')!.cells[1])).toContain('Correction on hold');
    // UPD-0006 is returned: the service names no such correction to the Super Admin (UPD-18).
    expect(text(rowNamed('Induction Motor Loading')!.cells[1])).toBe(
      'Published · version 1.0 · live since 9 Jun 2026',
    );
    const stuck = rowNamed('DC Motor Speed Control')!;
    expect([...stuck.cells].map(text)).toEqual([
      'DC Motor Speed Control EEE ZC341',
      'With the Academic Reviewer since 2 Oct 2026',
      'Nobody — no Academic Reviewer has EEE ZC341 in scope',
      'Formats: WEB WEB',
      'Stuck — nobody can act',
    ]);
    expect(stuck.querySelector('.xr-st')).toHaveClass('xr-st--err');
    expect(
      within(stuck).getByRole('link', {
        name: 'DC Motor Speed Control, Stuck — nobody can act. Open the record',
      }),
    ).toHaveAttribute('href', '/admin/content/records/SUB-0085');
    const venturi = rowNamed('Venturi Meter Calibration')!;
    expect(text(venturi.cells[1])).toBe(
      'Back with the Academic Reviewer for a re-check since 25 Aug 2026',
    );
    expect(text(venturi.cells[4])).toBe('With the Academic Reviewer');
    expect(venturi.querySelector('.xr-st')).toHaveClass('xr-st--info');
    const forced = rowNamed('Forced Convection')!;
    expect(text(forced.cells[2])).toBe('Anil Shetty · Northline Simulation Studio');
    expect(forced.querySelector('.xr-st')).toHaveClass('xr-st--warn');
    expect(text(main().querySelector('.rk-ca-foot'))).toBe(
      'Published content is read-only. It changes only through a correction: Content Manager, then Academic Reviewer, then your release decision.',
    );
    expectNoReferences();
  });

  it('“Show stuck records” sets the filter to Stuck (focus on it; the address mirrors it); the filter keeps one status', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const navigation = inAdmin(runtime, ALL, <AllContent />);
    await waitFor(() => expect(tableRows()).toHaveLength(19));
    await user.click(screen.getByRole('button', { name: 'Show stuck records' }));
    expect(statusFilter()).toHaveValue('stuck');
    await waitFor(() => expect(statusFilter()).toHaveFocus());
    expect(rowNames()).toEqual(['DC Motor Speed Control']);
    expect(navigation.replace).toHaveBeenLastCalledWith(`${ALL}?show=stuck`);
    expect(count()).toBe('1 of 19 records · read-only');
    expect(
      screen.getByRole('button', { name: 'Remove filter Status: Stuck — nobody can act' }),
    ).toBeVisible();
    await user.selectOptions(statusFilter(), 'review');
    expect(rowNames()).toEqual(['Venturi Meter Calibration', 'Flash Distillation']);
    await user.selectOptions(statusFilter(), 'published');
    expect(tableRows()).toHaveLength(13);
    expect(navigation.replace).toHaveBeenLastCalledWith(`${ALL}?show=published`);
    // Removing the chip shows every status again.
    await user.click(screen.getByRole('button', { name: 'Remove filter Status: Published' }));
    expect(tableRows()).toHaveLength(19);
    expect(statusFilter()).toHaveValue('all');
  });

  it('no match: “No content matches” and one way back, Clear filters', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const navigation = inAdmin(runtime, ALL, <AllContent />);
    await waitFor(() => expect(tableRows()).toHaveLength(19));
    await user.type(search(), 'Heat pump');
    await screen.findByText('No content matches');
    expect(count()).toBe('0 of 19 records · read-only');
    expect(main()).toHaveTextContent('Try another name or course code.');
    expect(navigation.replace).toHaveBeenLastCalledWith(`${ALL}?q=Heat+pump`);
    expect(screen.getByRole('button', { name: 'Remove filter Search: “Heat pump”' })).toBeVisible();
    const clears = screen.getAllByRole('button', { name: 'Clear filters' });
    expect(clears).toHaveLength(2);
    await user.click(clears[1]!);
    await waitFor(() => expect(tableRows()).toHaveLength(19));
    expect(navigation.replace).toHaveBeenLastCalledWith(ALL);
    expect(search()).toHaveValue('');
    expect(search()).toHaveFocus();
    // The search is the service's: a course code finds its records.
    await user.type(search(), 'EEE ZC341');
    await waitFor(() => expect(tableRows()).toHaveLength(4));
  });

  it('opens on the status and search its address names', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    inAdmin(runtime, ALL, <AllContent />, '?show=review&q=CHE');
    await waitFor(() => expect(statusFilter()).toHaveValue('review'));
    await waitFor(() =>
      expect(rowNames()).toEqual(['Venturi Meter Calibration', 'Flash Distillation']),
    );
    expect(search()).toHaveValue('CHE');
    expect(count()).toBe('2 of 19 records · read-only');
  });

  it('an unknown status in the address (the Phase 6 `workflow` too) names every status and is replaced', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const navigation = inAdmin(runtime, ALL, <AllContent />, '?show=workflow');
    await waitFor(() => expect(tableRows()).toHaveLength(19));
    expect(statusFilter()).toHaveValue('all');
    expect(navigation.replace).toHaveBeenCalledWith(ALL);
  });

  it('no correction waiting: no notice (spine-start)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    inAdmin(runtime, ALL, <AllContent />);
    await waitFor(() => expect(tableRows().length).toBeGreaterThan(0));
    expect(main()).not.toHaveTextContent('A correction is waiting for your release decision');
    expect(main()).toHaveTextContent('1 record stuck — nobody can act');
  });

  it('loading is announced; a failure has a way forward', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    faults(sample).failNext('ProductionService.listAllContent');
    renderInTab(<AllContent />, { runtime, navigation: testNavigation(ALL) });
    expect(await screen.findByText('Loading content…')).toHaveAttribute('role', 'status');
    const failed = await screen.findByRole('alert');
    expect(text(failed)).toBe(
      'We couldn’t load the content Nothing has changed. Try again. Try again',
    );
    await user.click(within(failed).getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(tableRows()).toHaveLength(19));
  });
});

// ---- SA-13 Content record (SA-v1 `V.record`) --------------------------------------------------

function showRecord(runtime: PlatformRuntime, recordId: string) {
  return inAdmin(
    runtime,
    `/admin/content/records/${recordId}`,
    <ContentRecord recordId={recordId} />,
  );
}
const historyLines = () => [...main().querySelectorAll('ol.rk-tl > li')].map((item) => text(item));
const details = () => text(main().querySelector('dl.rk-dl'));
const meta = () => text(main().querySelector('.rk-head .rk-meta'));
const overridePanel = () => screen.queryByRole('complementary', { name: 'Move status (override)' });

describe('SA-13 Content record — stuck', () => {
  it('why nobody can act, the way to Platform roles and the override panel', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showRecord(runtime, 'SUB-0085');
    await heading('DC Motor Speed Control');
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(
      within(crumbs)
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['Content', '/admin/content/updates'],
      ['All content', ALL],
    ]);
    expect(text(crumbs.querySelector('[aria-current="page"]'))).toBe('DC Motor Speed Control');
    expect(text(main().querySelector('.rk-head .rk-eyebrow'))).toBe('Submission');
    expect(meta()).toBe('Stuck — nobody can act EEE ZC341 Electrical Machines');
    expect(main().querySelector('.rk-head .rk-meta .xr-st')).toHaveClass('xr-st--err', 'rk-st-lg');
    expect(main().querySelector('a.rk-goto')).toHaveAttribute('href', '#content-record-panel');
    const notice = main().querySelector('.rk-notice--warn')!;
    expect(text(notice)).toBe(
      'Stuck — nobody can act No Academic Reviewer has EEE ZC341 in scope, so this review can’t continue. Giving an Academic Reviewer EEE ZC341 in Platform roles lets the review continue. Use the override only when that isn’t possible. Open Platform roles',
    );
    expect(
      within(notice as HTMLElement).getByRole('link', { name: 'Open Platform roles' }),
    ).toHaveAttribute('href', '/admin/roles?tab=reviewers');
    expect(details()).toBe(
      'Summary Control the speed of a DC motor under load and compare armature and field control. Formats Formats: WEB WEB Live version Not published Vendor Ritu Sharma · Meridian Virtual Labs Who can act Nobody — no Academic Reviewer has EEE ZC341 in scope',
    );
    expect(historyLines()).toEqual([
      'No Academic Reviewer has EEE ZC341 in scope 2 Oct 2026 Prof. A. Menon’s EEE ZC341 scope was withdrawn on 1 Oct 2026 (Platform roles).',
      'Submitted for academic review 2 Oct 2026 Revision 1 · from Ritu Sharma, Meridian Virtual Labs',
    ]);
    const panel = overridePanel()!;
    expect(panel).toHaveClass('rk-aside');
    expect(text(panel.querySelector('dl.rk-stand'))).toBe(
      'From With the Academic Reviewer To Returned to the vendor',
    );
    expect(text(panel.querySelector('.rk-panel-body > p.rk-hint'))).toBe(
      'Returning it to the vendor is the one supported move for a stuck record. Published is never offered; only the Content Manager publishes.',
    );
    expect(
      within(panel).getByRole('textbox', { name: 'Reason (required)' }),
    ).toHaveAccessibleDescription(
      'Recorded with your name. The vendor sees it with the returned submission.',
    );
    expect(within(panel).getByRole('button', { name: 'Move status' })).toHaveClass('rk-go');
    await waitFor(() => expect(document.title).toContain('DC Motor Speed Control'));
    expectNoReferences();
  });

  it('Move status: a reason is required; the move returns it to the vendor (Vendor reads returned)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showRecord(runtime, 'SUB-0085');
    await heading('DC Motor Speed Control');
    const panel = overridePanel()!;
    const reason = within(panel).getByRole('textbox', { name: 'Reason (required)' });
    await user.click(within(panel).getByRole('button', { name: 'Move status' }));
    expect(within(panel).getByText('Add a reason — it is kept in the history')).toBeVisible();
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(reason).toHaveFocus());
    expect(screen.queryByRole('dialog')).toBeNull();
    // Nothing moved.
    const still = await runtime.ports.production.getContentRecord({
      kind: 'SUB',
      id: 'SUB-0085',
    } as never);
    expect(still.ok && still.value.stuck).toBe(true);

    await user.type(reason, 'No reviewer for Electrical Machines until November.');
    expect(reason).not.toHaveAttribute('aria-invalid');
    const go = within(panel).getByRole('button', { name: 'Move status' });
    await user.click(go);
    const dialog = await screen.findByRole('dialog', {
      name: 'Return DC Motor Speed Control to the vendor?',
    });
    expect(dialog).toHaveAccessibleDescription('An override, recorded with your name and reason.');
    expect(text(dialog.querySelector('.rk-dlg-now'))).toBe(
      'What happens now Its status moves from “With the Academic Reviewer” to “Returned to the vendor”. Ritu Sharma · Meridian Virtual Labs can work on it again.',
    );
    expect(text(dialog.querySelector('.rk-dlg-later'))).toBe(
      'Only after later events, or not from here Nothing is published. It goes through academic review again after the vendor resubmits.',
    );
    expect(text(dialog.querySelector('blockquote.rk-quote'))).toBe(
      'No reviewer for Electrical Machines until November. Your reason',
    );
    expect(within(dialog).getByRole('button', { name: 'Move status' })).toHaveFocus();
    // Cancel moves nothing; focus back to the button.
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(go).toHaveFocus();

    await user.click(go);
    const again = await screen.findByRole('dialog', {
      name: 'Return DC Motor Speed Control to the vendor?',
    });
    await user.click(within(again).getByRole('button', { name: 'Move status' }));
    const flash = (await screen.findByText('Returned to the vendor.')).closest('.rk-notice')!;
    expect(text(flash)).toBe(
      'Returned to the vendor. The override and your reason are in the governance history.',
    );
    await waitFor(() => expect(flash).toHaveFocus());
    await waitFor(() =>
      expect(meta()).toBe('Returned to the vendor EEE ZC341 Electrical Machines'),
    );
    expect(overridePanel()).toBeNull();
    expect(main().querySelector('div.sa-single')).not.toBeNull();
    expect(text(main().querySelector('.rk-notice--ok:not(#content-record-flash)'))).toBe(
      'In the workflow Ritu Sharma · Meridian Virtual Labs can act on it. Nothing is needed from you.',
    );
    expect(historyLines()[0]).toMatch(
      /^Status moved by Arjun Mehta \(override\) 23 Oct 2026, \d\d:\d\d “No reviewer for Electrical Machines until November\.” From “With the Academic Reviewer” to “Returned to the vendor”\.$/,
    );
    expectNoReferences();
    // The Vendor's record reads returned (the one supported move, OD-B7-09).
    const vendor = await asPersonId(sample, RITU).production.getRecord('SUB-0085' as never);
    expect(vendor.ok && vendor.value.submission.status.state).toBe('returned');
  });

  it('a record no longer stuck when the move is sent: nothing moves, the page says so', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showRecord(runtime, 'SUB-0085');
    await heading('DC Motor Speed Control');
    const panel = overridePanel()!;
    await user.type(
      within(panel).getByRole('textbox', { name: 'Reason (required)' }),
      'Nobody can review it.',
    );
    await user.click(within(panel).getByRole('button', { name: 'Move status' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Return DC Motor Speed Control to the vendor?',
    });
    // Meanwhile (another tab) Dr K. Iyer is given EEE ZC341.
    const admin = asPersonId(sample, SUPER_ADMIN);
    const holder = await admin.platformRoles.getHolder('role-0001' as never);
    if (!holder.ok) throw new Error('holder');
    await act(async () => {
      const assigned = await admin.platformRoles.assignScope({
        holderId: 'role-0001',
        target: { kind: 'course', courseId: 'electrical-machines' },
        expectedRev: holder.value.holder.rev,
      } as never);
      expect(assigned.ok).toBe(true);
    });
    await user.click(within(dialog).getByRole('button', { name: 'Move status' }));
    const refusal = await screen.findByRole('alert');
    expect(text(refusal)).toBe(
      'Nothing was moved: this record has moved on. Its current state is shown. Check it again',
    );
    await waitFor(() =>
      expect(meta()).toBe('With the Academic Reviewer EEE ZC341 Electrical Machines'),
    );
    await waitFor(() => expect(refusal).toHaveFocus());
    expect(overridePanel()).toBeNull();
    expect(screen.queryByRole('button', { name: 'Move status' })).toBeNull();
    const vendor = await asPersonId(sample, RITU).production.getRecord('SUB-0085' as never);
    expect(vendor.ok && vendor.value.submission.status.state).toBe('with-academic-reviewer');
    await user.click(within(refusal).getByRole('button', { name: 'Check it again' }));
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus());
  });

  it('a stale revision: nothing moves; the record is read again; the panel says so', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const stale: ServiceError = { kind: 'stale-version', currentRev: 99 } as ServiceError;
    const real = runtime.withCommandId.bind(runtime);
    vi.spyOn(runtime, 'withCommandId').mockImplementation((commandId) => {
      const ports = real(commandId);
      return {
        ...ports,
        production: {
          ...ports.production,
          overrideStatus: async () => ({ ok: false, error: stale }),
        },
      } as typeof ports;
    });
    showRecord(runtime, 'SUB-0085');
    await heading('DC Motor Speed Control');
    const panel = overridePanel()!;
    await user.type(within(panel).getByRole('textbox'), 'Stuck too long.');
    await user.click(within(panel).getByRole('button', { name: 'Move status' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Return DC Motor Speed Control to the vendor?',
    });
    await user.click(within(dialog).getByRole('button', { name: 'Move status' }));
    const refusal = await within(overridePanel()!).findByRole('alert');
    expect(text(refusal)).toBe(
      'This record changed since you opened it Nothing was moved. It has been read again — check it, then decide again. Check it again',
    );
    await waitFor(() => expect(refusal).toHaveFocus());
    expect(within(overridePanel()!).getByRole('button', { name: 'Move status' })).toBeVisible();
    expect(within(overridePanel()!).getByRole('textbox')).toHaveValue('Stuck too long.');
  });

  it('failed for now: the confirmation stays open and says nothing was lost', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showRecord(runtime, 'SUB-0085');
    await heading('DC Motor Speed Control');
    const panel = overridePanel()!;
    await user.type(within(panel).getByRole('textbox'), 'Stuck too long.');
    faults(sample).failNext('ProductionService.overrideStatus' as never);
    await user.click(within(panel).getByRole('button', { name: 'Move status' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Return DC Motor Speed Control to the vendor?',
    });
    await user.click(within(dialog).getByRole('button', { name: 'Move status' }));
    expect(
      await within(dialog).findByText('It wasn’t moved. Nothing was lost — try again.'),
    ).toBeVisible();
    expect(meta()).toBe('Stuck — nobody can act EEE ZC341 Electrical Machines');
  });
});

describe('SA-13 Content record — published, read-only', () => {
  it('a correction waiting for her: “Open the release decision”; no edit, no override', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showRecord(runtime, 'distillation-column');
    await heading('Distillation Column');
    expect(text(main().querySelector('.rk-head .rk-eyebrow'))).toBe('Experiment');
    expect(meta()).toBe('Published CHE ZG513 Process Instrumentation & Control');
    expect(main().querySelector('a.rk-goto')).toBeNull();
    const notice = main().querySelector('.rk-notice')!;
    expect(notice).toHaveClass('rk-notice--info');
    expect(text(notice)).toBe(
      'Published · read-only Published content changes only through a correction: Content Manager, then Academic Reviewer, then your release decision. Open the release decision',
    );
    const open = within(notice as HTMLElement).getByRole('link', {
      name: 'Open the release decision',
    });
    expect(open).toHaveAttribute('href', '/admin/content/updates/UPD-0005');
    expect(open).toHaveClass('rb-btn');
    expect(overridePanel()).toBeNull();
    expect(screen.queryByRole('button', { name: /Move status|Edit/ })).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(main().querySelector('div.sa-single')).not.toBeNull();
    expect(details()).toBe(
      'Summary Bring a binary column from cold start to steady state, tuning reflux ratio against overhead purity under realistic lag. Formats Formats: WEB, VR WEB VR Live version Version 1.2, live since 3 Jul 2026 Vendor Meridian Virtual Labs Who can act Nobody needs to act',
    );
    expect([...main().querySelectorAll('ul.sa-bullets li')].map(text)).toEqual([
      'Bring a column to steady state from cold start',
      'Tune reflux ratio against an overhead purity target',
    ]);
    expect(historyLines()).toEqual([
      'Correction approved by the Academic Reviewer — waiting for the release decision 22 Oct 2026 Correction 1.2 → 1.3. Version 1.2 stays live until it is released.',
      'Version 1.2 released 3 Jul 2026 Released by the Super Admin.',
      'Version 1.1 released 19 Jun 2026 Released by the Super Admin.',
      'Published · version 1.0 2 Jun 2026 By Kavya Nair, Content Manager.',
    ]);
    expectNoReferences();
  });

  it('a correction on hold: “Open the held correction”', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showRecord(runtime, 'boiler-drum-level');
    await heading('Boiler Drum Level');
    const notice = main().querySelector('.rk-notice')!;
    expect(
      within(notice as HTMLElement).getByRole('link', { name: 'Open the held correction' }),
    ).toHaveAttribute('href', '/admin/content/updates/UPD-0004');
    expect(details()).toContain('Vendor —');
    expect(historyLines()[0]).toBe(
      'Correction put on hold by Arjun Mehta 20 Aug 2026 Version 2.0 stays live.',
    );
    expectNoReferences();
  });

  it('published from a submission: read-only, its review history', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showRecord(runtime, 'SUB-0077');
    await heading('Conduction Through a Composite Wall');
    expect(text(main().querySelector('.rk-head .rk-eyebrow'))).toBe('Experiment');
    expect(meta()).toBe('Published ME ZG523 Thermodynamics & Heat Transfer');
    const notices = main().querySelectorAll('.rk-notice');
    expect(notices).toHaveLength(1);
    expect(within(notices[0] as HTMLElement).queryByRole('link')).toBeNull();
    expect(details()).toBe(
      'Summary Measure the temperature profile across a three-layer wall and compare it with the series-resistance model. Formats Formats: WEB, VR WEB VR Live version Version 1.0, live since 23 Oct 2026 Vendor Anil Shetty · Northline Simulation Studio Who can act Nobody needs to act',
    );
    expect(historyLines()).toEqual([
      'Published · version 1.0 23 Oct 2026 By Kavya Nair, Content Manager.',
      'Approved by Prof. A. Menon 22 Oct 2026 Academic review, revision 2.',
      'Resubmitted · revision 2 21 Oct 2026 From Anil Shetty, Northline Simulation Studio.',
      'Returned to the vendor by Prof. A. Menon 14 Oct 2026 Revision 1.',
      'Submitted for academic review 7 Oct 2026 Revision 1 · from Anil Shetty, Northline Simulation Studio',
    ]);
    expectNoReferences();
  });

  it('a returned correction is never named to her (UPD-0006, spine-start)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    showRecord(runtime, 'induction-motor-loading');
    await heading('Induction Motor Loading');
    const notices = main().querySelectorAll('.rk-notice');
    expect(notices).toHaveLength(1);
    expect(within(notices[0] as HTMLElement).queryByRole('link')).toBeNull();
    expect(main()).not.toHaveTextContent('UPD-0006');
  });
});

describe('SA-13 Content record — in the workflow; not available; failed', () => {
  it('someone can act: nothing is needed from her', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showRecord(runtime, 'SUB-0086');
    await heading('Flash Distillation');
    expect(text(main().querySelector('.rk-head .rk-eyebrow'))).toBe('Submission');
    expect(text(main().querySelector('.rk-notice'))).toBe(
      'In the workflow Prof. A. Menon · Academic Reviewer can act on it. Nothing is needed from you.',
    );
    expect(overridePanel()).toBeNull();
    expect(screen.queryByRole('button', { name: 'Move status' })).toBeNull();
    expect(historyLines()).toEqual([
      'Submitted for academic review 24 Aug 2026 Revision 1 · from Ritu Sharma, Meridian Virtual Labs',
    ]);
  });

  it('a failure has a way forward', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    faults(sample).failNext('ProductionService.getContentRecord');
    showRecord(runtime, 'SUB-0086');
    await screen.findByText('We couldn’t load this record');
    expect(main()).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await heading('Flash Distillation');
  });

  it('an address that names no record is the GL-04 “This page isn’t available”', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showRecord(runtime, 'SUB-9999');
    expect(await heading('This page isn’t available')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Back to Overview' })).toHaveAttribute(
      'href',
      '/admin',
    );
  });
});

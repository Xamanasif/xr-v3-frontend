/**
 * VE-01 Overview (board B5-01 f0 … f3; B5-08 f1) and VE-02 My experiments (B5-02 f0 … f5; B5-08 f3)
 * on the real composition root and the sample world, as Anil Shetty (Northline Simulation Studio,
 * ME ZG523; MEL ZG512 withdrawn on 15 Aug). The spine-start world holds his five records — SUB-0079
 * Pin Fin Efficiency (draft), SUB-0081 Forced Convection (returned by the Academic Reviewer),
 * SUB-0074 Transient Cooling (with the Content Manager), SUB-0083 Surface Roughness in Turning
 * (read-only draft) and SUB-0052 Fin-Tube Bundle (published); Flow E's SUB-0077 “Conduction
 * Through a Composite Wall” is saved and submitted through his own ports, as the editor would. The
 * one world moves the pages: the Academic Reviewer's return and the Content Manager's send-back
 * through their ports change both screens in the same tab. Ritu Sharma (Meridian) has nothing to
 * do (f1); a Vendor the Super Admin has just registered has no experiment yet (B5-01 f2, B5-02 f3).
 * The undrawn loading and failed states read again.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CourseId, SubmissionId } from '@xr/domain';
import { asPersonId, beginSession, faults, fixtureWorld } from '@xr/sample-platform/testing';
import { afterEach, describe, expect, it } from 'vitest';

import { STATE_COPY_VENDOR_HOME } from '@/copy/state-copy-vendor-home';
import type { PlatformRuntime } from '@/platform/runtime';
import { renderInTab, tabPlatform, testNavigation, worldPlatform } from '@/test-support/workspace';

import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { VendorOverview } from './ve-01-overview/overview';
import { attentionRows } from './ve-01-overview/overview-view';
import {
  changedRecently,
  statusFilterOf,
  vendorStatusOf,
  type MyExperimentRow,
} from './ve-02-my-experiments/experiment-rows';
import { MyExperiments } from './ve-02-my-experiments/my-experiments';

afterEach(() => {
  forgetLastAddress();
});

const ANIL = 'per-anil-shetty';
const RITU = 'per-ritu-sharma';
const MENON = 'per-a-menon';
const KAVYA = 'per-kavya-nair';
const ARJUN = 'sa-arjun-mehta';
const NORTHLINE = 'Northline Simulation Studio';
const THERMO = 'thermodynamics-heat-transfer';
const REASON =
  'The AR install notes don’t say which phones and tablets it runs on. Add the supported devices and the install steps.';
/** B5-02's “now”, 27 Aug 2026 (10:00 in Indian time): its `recentIds` are the last seven days'. */
const BOARD_NOW = '2026-08-27T04:30:00.000Z';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

/** Flow E's SUB-0077, as the walk's E1 saves it (B5-03 … B5-05). */
function compositeWall() {
  return {
    courseId: THERMO as CourseId,
    name: 'Conduction Through a Composite Wall',
    summary:
      'Measure the temperature profile across a three-layer wall and compare it with the series-resistance model.',
    description:
      'Learners build a wall from three layers — brick, insulation and plaster — set the hot-side and cold-side temperatures, and read the temperature at each interface.',
    version: '1.0',
    formats: ['web', 'vr'] as ('web' | 'vr')[],
    delivery: {
      web: {
        format: 'web' as const,
        webLink: 'https://labs.northline.example/composite-wall',
        browserAndComputer: 'A current Chrome, Edge, Firefox or Safari on a laptop or desktop',
        notes: null,
      },
      vr: {
        format: 'vr' as const,
        packageLabel: 'Composite Wall — VR build 1.0',
        packageReference: null,
        packageFileName: 'composite-wall-vr-1.0.zip',
        deviceNeeded: 'VR headset',
        installNotes: 'Install the build named above on the headset and open “Composite Wall Lab”.',
        notes: null,
      },
    },
    preview: { label: null, link: null },
    documents: [],
  };
}

/** Anil saves SUB-0077 (the editor's first save mints it), optionally at a later step, and submits. */
async function saveCompositeWall(
  runtime: PlatformRuntime,
  options: { readonly step?: 'course' | 'formats'; readonly submit?: boolean } = {},
) {
  let id: SubmissionId | null = null;
  await act(async () => {
    const answer = await runtime.ports.production.saveDraft({
      id: null,
      content: compositeWall(),
      step: options.step ?? 'course',
      expectedRev: null,
    });
    if (!answer.ok) throw new Error(`save ${JSON.stringify(answer.error)}`);
    await runtime.invalidate(answer.changed);
    const saved = answer.value;
    id = saved.id;
    if (options.submit) {
      const sent = await runtime.ports.production.submitForReview({
        id: saved.id,
        content: compositeWall(),
        expectedRev: saved.rev,
      });
      if (!sent.ok) throw new Error(`submit ${JSON.stringify(sent.error)}`);
      await runtime.invalidate(sent.changed);
    }
  });
  return id!;
}

/** The Academic Reviewer returns a submission (RV-03), through his own ports. */
async function menonReturns(runtime: PlatformRuntime, sample: Sample, id: SubmissionId) {
  const menon = asPersonId(sample, MENON);
  await act(async () => {
    const page = ok(await menon.production.getSubmissionForReview(id));
    const returned = await menon.production.returnSubmission({
      id,
      reason: 'Please clarify the VR device requirements.',
      references: [{ step: 'formats-and-delivery', format: 'vr', field: 'device-need' }],
      outcomes: [],
      expectedRev: page.submission.rev,
    });
    if (!returned.ok) throw new Error(`return ${JSON.stringify(returned.error)}`);
    await runtime.invalidate(returned.changed);
  });
}

/** A Vendor the Super Admin registers now (SA-16): no experiment yet. */
async function newVendor(): Promise<{ runtime: PlatformRuntime; sample: Sample }> {
  const { runtime, sample } = await tabPlatform(null, 'spine-start');
  const holder = ok(
    await asPersonId(sample, ARJUN).platformRoles.registerHolder({
      role: 'vendor',
      name: 'Kiran Rao',
      workEmail: 'kiran.rao@northline.example',
      organisation: NORTHLINE,
    }),
  );
  beginSession(sample, holder.personId);
  await runtime.session.refresh();
  return { runtime, sample };
}

function showOverview(runtime: PlatformRuntime) {
  const navigation = testNavigation('/vendor');
  const view = renderInTab(
    <WorkspaceLayout workspace="vendor">
      <VendorOverview />
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

function showList(runtime: PlatformRuntime, search = '') {
  const navigation = testNavigation('/vendor/experiments', search);
  const view = renderInTab(
    <WorkspaceLayout workspace="vendor">
      <MyExperiments />
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

const main = () => screen.getByRole('main');
const header = () => main().querySelector('.xr-phead') as HTMLElement;
const statusLine = () => main().querySelector('p.xv-statusline');
const attention = () => screen.findByRole('region', { name: 'Needs your action' });
const rowTitles = (region: HTMLElement) =>
  [...region.querySelectorAll('.xr-row-title')].map((node) => node.textContent);
const rowSubs = (region: HTMLElement) =>
  [...region.querySelectorAll('.xr-row-sub')].map((node) => node.textContent);
/** The list section once its toolbar is on show (it is drawn around the loading rows too). */
const list = async () => {
  await screen.findByRole('searchbox', { name: 'Search your experiments' });
  return screen.getByRole('region', { name: 'All your experiments' });
};
const count = () => main().querySelector('.xr-toolbar-status [role="status"]');
const table = () => main().querySelector('table.xr-table') as HTMLTableElement;
const bodyRows = () => [...table().querySelectorAll('tbody tr')] as HTMLTableRowElement[];
const rowOf = (name: string) =>
  bodyRows().find((row) => row.querySelector('td.is-primary strong')?.textContent === name)!;
const cell = (row: HTMLTableRowElement, index: number) => row.querySelectorAll('td')[index]!;

// ---- VE-01 Overview ---------------------------------------------------------------------------

describe('VE-01 Overview — Anil Shetty (B5-01 f0, f3)', () => {
  it('the overline, the H1, the status line, the attention rows in order and the shell', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    showOverview(runtime);
    const region = await attention();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
    expect(header().querySelector('.xr-overline')).toHaveTextContent(NORTHLINE);
    // `p.xv-statusline[role=status]`: the service's four counts, B5-01's words.
    expect(statusLine()).toHaveAttribute('role', 'status');
    expect([...statusLine()!.querySelectorAll('span')].map((span) => span.textContent)).toEqual([
      '2 Draft',
      '0 With Academic Reviewer',
      '1 With Content Manager',
      '1 Published',
    ]);
    expect(statusLine()!.querySelector('strong')).toHaveTextContent('2');
    // The header's Create experiment is secondary on the Overview (f0 … f3).
    const create = within(header()).getByRole('link', { name: 'Create experiment' });
    expect(create).toHaveClass('xr-btn', 'xr-btn--secondary');
    expect(create).toHaveAttribute('href', '/vendor/experiments/new');
    // “Needs your action”: returned first, then the draft — the read-only draft is not listed.
    expect(within(region).getByText('2 items')).toHaveClass('xr-meta');
    expect(rowTitles(region)).toEqual([
      'Returned: Forced Convection',
      'Draft to finish: Pin Fin Efficiency',
    ]);
    expect(rowSubs(region)).toEqual([
      `Academic Reviewer · 24 Aug 2026 · “${REASON}”`,
      'Last saved 25 Aug 2026 · only you can see it',
    ]);
    expect(region.querySelectorAll('.xr-row-icon--err')).toHaveLength(1);
    expect(region.querySelectorAll('.xr-row-icon--info')).toHaveLength(1);
    const revise = within(region).getByRole('link', { name: 'Revise “Forced Convection”' });
    expect(revise).toHaveClass('xr-btn--primary', 'xr-btn--sm');
    expect(revise).toHaveAttribute('href', '/vendor/experiments/SUB-0081/revise');
    const finish = within(region).getByRole('link', { name: 'Finish draft' });
    expect(finish).toHaveClass('xr-btn--secondary', 'xr-btn--sm');
    expect(finish).toHaveAttribute('href', '/vendor/experiments/SUB-0079/edit');
    expect(main().querySelectorAll('.xr-btn--primary')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'See all your experiments' })).toHaveAttribute(
      'href',
      '/vendor/experiments',
    );
    expect(screen.queryByText('Surface Roughness in Turning', { exact: false })).toBeNull();
    // The shell: the top bar, the sidebar's two destinations and Help.
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Overview');
    const sidebar = screen.getByRole('navigation', { name: 'Vendor navigation' });
    expect(
      within(sidebar)
        .getAllByRole('link')
        .map((link) => link.querySelector('.xr-nav-text')?.textContent),
    ).toEqual(['Overview', 'My experiments']);
    expect(sidebar.querySelector('[aria-current="page"]')).toHaveAttribute('href', '/vendor');
  });

  it('after Flow E’s submit the status line reads as f0: 2 · 1 · 1 · 1', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    showOverview(runtime);
    await attention();
    await saveCompositeWall(runtime, { submit: true });
    await waitFor(() =>
      expect([...statusLine()!.querySelectorAll('span')].map((span) => span.textContent)).toEqual([
        '2 Draft',
        '1 With Academic Reviewer',
        '1 With Content Manager',
        '1 Published',
      ]),
    );
    expect(rowTitles(await attention())).toEqual([
      'Returned: Forced Convection',
      'Draft to finish: Pin Fin Efficiency',
    ]);
  });

  it('B5-08 f1: a new draft joins the list (oldest save first); Finish draft opens the step it reached', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    showOverview(runtime);
    await attention();
    const id = await saveCompositeWall(runtime, { step: 'formats' });
    await waitFor(async () => expect(within(await attention()).getByText('3 items')).toBeVisible());
    const region = await attention();
    expect(rowTitles(region)).toEqual([
      'Returned: Forced Convection',
      'Draft to finish: Pin Fin Efficiency',
      'Draft to finish: Conduction Through a Composite Wall',
    ]);
    expect(rowSubs(region)[2]).toBe('Last saved 2 Oct 2026 · only you can see it');
    expect([...statusLine()!.querySelectorAll('span')].map((span) => span.textContent)).toEqual([
      '3 Draft',
      '0 With Academic Reviewer',
      '1 With Content Manager',
      '1 Published',
    ]);
    const finishes = within(region).getAllByRole('link', { name: 'Finish draft' });
    await waitFor(() =>
      expect(finishes[1]).toHaveAttribute('href', `/vendor/experiments/${id}/edit?step=formats`),
    );
    for (const finish of finishes) expect(finish).toHaveClass('xr-btn--secondary');
  });

  it('one world: the Academic Reviewer’s return puts a second “Revise …” row in (oldest decision first)', async () => {
    const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
    showOverview(runtime);
    await attention();
    const id = await saveCompositeWall(runtime, { submit: true });
    await menonReturns(runtime, sample, id);
    await waitFor(async () =>
      expect(rowTitles(await attention())).toEqual([
        'Returned: Forced Convection',
        'Returned: Conduction Through a Composite Wall',
        'Draft to finish: Pin Fin Efficiency',
      ]),
    );
    const region = await attention();
    expect(rowSubs(region)[1]).toBe(
      'Academic Reviewer · 2 Oct 2026 · “Please clarify the VR device requirements.”',
    );
    const second = within(region).getByRole('link', {
      name: 'Revise “Conduction Through a Composite Wall”',
    });
    expect(second).toHaveClass('xr-btn--secondary');
    expect(second).toHaveAttribute('href', `/vendor/experiments/${id}/revise`);
  });

  it('f1 “Nothing needs you” (Ritu Sharma): the calm state with a secondary Create experiment', async () => {
    const { runtime } = await tabPlatform(RITU, 'spine-start');
    showOverview(runtime);
    const calm = await screen.findByRole('heading', {
      level: 2,
      name: 'Nothing needs you right now',
    });
    const empty = calm.closest('.xr-empty') as HTMLElement;
    expect(empty.querySelector('.xr-empty-icon')).toHaveClass('xr-x-empty-icon--ok');
    expect(empty).toHaveTextContent(
      'Experiments with the Academic Reviewer or the Content Manager need nothing from you. You’ll see them here if they come back.',
    );
    expect(within(empty).getByRole('link', { name: 'Create experiment' })).toHaveClass(
      'xr-btn--secondary',
    );
    expect(header().querySelector('.xr-overline')).toHaveTextContent('Meridian Virtual Labs');
    expect(statusLine()).not.toBeNull();
    expect(screen.queryByRole('region', { name: 'Needs your action' })).toBeNull();
    expect(main().querySelectorAll('.xr-btn--primary')).toHaveLength(0);
  });

  it('f2 first visit: no status line; the primary Create experiment is in the empty state', async () => {
    const { runtime } = await newVendor();
    showOverview(runtime);
    const first = await screen.findByRole('heading', {
      level: 2,
      name: 'Create your first experiment',
    });
    const empty = first.closest('.xr-empty') as HTMLElement;
    expect(empty).toHaveTextContent(
      'Describe it, add its formats and delivery, then submit it for academic review. You can save a draft at every step.',
    );
    const create = within(empty).getByRole('link', { name: 'Create experiment' });
    expect(create).toHaveClass('xr-btn--primary');
    expect(create).toHaveAttribute('href', '/vendor/experiments/new');
    expect(within(header()).getByRole('link', { name: 'Create experiment' })).toHaveClass(
      'xr-btn--secondary',
    );
    expect(statusLine()).toBeNull();
    expect(screen.getByRole('link', { name: 'See all your experiments' })).toBeVisible();
  });

  it('undrawn: failed with Try again, then the overview; focus goes to the main region', async () => {
    const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
    faults(sample).failNext('ProductionService.getVendorOverview');
    showOverview(runtime);
    const title = await screen.findByRole('heading', {
      level: 2,
      name: STATE_COPY_VENDOR_HOME['VE-01.failed'].words,
    });
    const failed = title.closest('.xr-empty') as HTMLElement;
    expect(failed).toHaveTextContent('Nothing has changed. Try again.');
    expect(screen.getByRole('link', { name: 'See all your experiments' })).toBeVisible();
    const retry = within(failed).getByRole('button', { name: 'Try again' });
    retry.focus();
    await userEvent.click(retry);
    await attention();
    await waitFor(() => expect(document.activeElement).toBe(main()));
  });

  it('undrawn: loading is announced politely, in the section’s shape', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    showOverview(runtime);
    const status = await screen.findByText(STATE_COPY_VENDOR_HOME['VE-01.loading'].words);
    expect(status).toHaveAttribute('role', 'status');
    expect(status.closest('[aria-busy="true"]')).toHaveClass('xr-section');
    await attention();
  });

  it('attentionRows: the first row is the primary, whatever its kind', () => {
    const rows = attentionRows(
      [
        {
          kind: 'draft',
          submissionId: 'SUB-0079' as never,
          name: 'Pin Fin Efficiency',
          savedAt: BOARD_NOW as never,
        },
      ],
      () => 'preview',
    );
    expect(rows[0]?.action).toEqual({
      label: 'Finish draft',
      href: '/vendor/experiments/SUB-0079/edit?step=preview',
      variant: 'primary',
    });
  });
});

// ---- VE-02 My experiments ---------------------------------------------------------------------

describe('VE-02 My experiments — Anil Shetty (B5-02 f0, f4, f5)', () => {
  it('the header, the toolbar, the count and every row as B5-02 draws them, newest change first', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    const id = await saveCompositeWall(runtime, { submit: true });
    showList(runtime);
    const section = await list();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: 'My experiments' })).toBeVisible();
    expect(header().querySelector('.xr-overline')).toHaveTextContent(NORTHLINE);
    expect(header().querySelector('.xr-phead-meta .xl-meta')).toHaveTextContent(
      'Every experiment you created, in any status',
    );
    const create = within(header()).getByRole('link', { name: 'Create experiment' });
    expect(create).toHaveClass('xr-btn--primary');
    expect(create).toHaveAttribute('href', '/vendor/experiments/new');
    // The toolbar: the search, Status and the checkbox, each labelled.
    expect(
      within(section).getByRole('searchbox', { name: 'Search your experiments' }),
    ).toHaveAttribute('placeholder', 'Name, ID or course');
    const status = within(section).getByRole('combobox', { name: 'Status' });
    expect([...(status as HTMLSelectElement).options].map((option) => option.textContent)).toEqual([
      'All statuses',
      'Draft',
      'Submitted',
      'With Academic Reviewer',
      'Returned',
      'With Content Manager',
      'Published',
    ]);
    expect(
      within(section).getByRole('checkbox', { name: 'Changed in the last 7 days' }),
    ).not.toBeChecked();
    expect(count()).toHaveTextContent('6 of 6 experiments');
    expect(within(section).queryByRole('button', { name: 'Clear filters' })).toBeNull();
    expect([...table().querySelectorAll('thead th')].map((th) => th.textContent)).toEqual([
      'Experiment',
      'Formats',
      'Status · last change',
      'With',
      'Action',
    ]);
    // Newest change first (the service's order).
    expect(bodyRows().map((row) => row.querySelector('.xr-id')?.textContent)).toEqual([
      id,
      'SUB-0079',
      'SUB-0081',
      'SUB-0074',
      'SUB-0083',
      'SUB-0052',
    ]);

    const expectRow = (
      name: string,
      expected: {
        sub: string;
        formats: string[];
        chip: string;
        tone: string;
        date: string;
        with: string;
        action: string;
        href: string;
        primary?: boolean;
      },
    ) => {
      const row = rowOf(name);
      const first = cell(row, 0);
      expect(within(first).getByRole('link', { name })).toHaveAttribute(
        'href',
        `/vendor/experiments/${row.querySelector('.xr-id')?.textContent}`,
      );
      expect(first.querySelector('.xr-meta')).toHaveTextContent(expected.sub);
      expect(
        [...cell(row, 1).querySelectorAll('.xr-fmt.xr-fmt--compact')].map(
          (chip) => chip.textContent,
        ),
      ).toEqual(expected.formats);
      expect(cell(row, 1)).toHaveAttribute('data-label', 'Formats');
      const chip = cell(row, 2).querySelector('.xr-status');
      expect(chip).toHaveTextContent(expected.chip);
      expect(chip).toHaveClass(`xr-status--${expected.tone}`);
      expect(cell(row, 2).querySelector('.xr-meta')).toHaveTextContent(expected.date);
      expect(cell(row, 2)).toHaveAttribute('data-label', 'Status');
      expect(cell(row, 3)).toHaveTextContent(expected.with);
      expect(cell(row, 3)).toHaveAttribute('data-label', 'With');
      const action = within(cell(row, 4)).getByRole('link', { name: `${expected.action} ${name}` });
      expect(action).toHaveTextContent(expected.action);
      expect(action).toHaveAttribute('href', expected.href);
      expect(action).toHaveClass(
        expected.primary ? 'xr-btn--primary' : 'xr-btn--secondary',
        'xr-btn--sm',
      );
    };
    expectRow('Conduction Through a Composite Wall', {
      sub: `${id} · ME ZG523`,
      formats: ['WEB', 'VR'],
      chip: 'With Academic Reviewer',
      tone: 'wait',
      date: '2 Oct 2026',
      with: 'Academic Reviewer',
      action: 'Open',
      href: `/vendor/experiments/${id}`,
    });
    expectRow('Forced Convection', {
      sub: 'SUB-0081 · ME ZG523',
      formats: ['WEB', 'AR'],
      chip: 'Returned',
      tone: 'err',
      date: '24 Aug 2026',
      with: 'You',
      action: 'Revise',
      href: '/vendor/experiments/SUB-0081/revise',
      primary: true,
    });
    expectRow('Pin Fin Efficiency', {
      sub: 'SUB-0079 · ME ZG523',
      formats: ['WEB'],
      chip: 'Draft',
      tone: 'off',
      date: '25 Aug 2026',
      with: 'You',
      action: 'Edit draft',
      href: '/vendor/experiments/SUB-0079/edit',
    });
    expectRow('Transient Cooling', {
      sub: 'SUB-0074 · ME ZG523',
      formats: ['WEB'],
      chip: 'With Content Manager',
      tone: 'wait',
      date: '14 Aug 2026',
      with: 'Content Manager',
      action: 'Open',
      href: '/vendor/experiments/SUB-0074',
    });
    expectRow('Fin-Tube Bundle', {
      sub: 'SUB-0052 · ME ZG523',
      formats: ['WEB', 'VR'],
      chip: 'Published',
      tone: 'ok',
      date: '30 Jul 2026',
      with: '—',
      action: 'Open',
      href: '/vendor/experiments/SUB-0052',
    });
    // SUB-0083: MEL ZG512 withdrawn from him — read-only, opened as a record (OD-B5-01).
    expectRow('Surface Roughness in Turning', {
      sub: 'SUB-0083 · MEL ZG512',
      formats: ['WEB'],
      chip: 'Draft · read-only',
      tone: 'paused',
      date: '14 Aug 2026',
      with: '—',
      action: 'Open',
      href: '/vendor/experiments/SUB-0083',
    });
    expect(main().querySelectorAll('.xr-btn--primary')).toHaveLength(2);
    expect(table().closest('.xr-table-wrap')).toHaveClass(
      'rounded-none',
      'border-x-0',
      'border-b-0',
    );
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('My experiments');
    expect(
      screen
        .getByRole('navigation', { name: 'Vendor navigation' })
        .querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', '/vendor/experiments');
  });

  it('f1 Filtered: Returned — from the address; the Status filter mirrors into it; Clear filters', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    const { navigation } = showList(runtime, '?status=returned');
    const section = await list();
    await waitFor(() => expect(count()).toHaveTextContent('1 of 5 experiments'));
    const status = within(section).getByRole('combobox', { name: 'Status' });
    expect(status).toHaveValue('returned');
    expect(bodyRows().map((row) => row.querySelector('strong')?.textContent)).toEqual([
      'Forced Convection',
    ]);
    expect(within(section).getByRole('link', { name: 'Revise Forced Convection' })).toHaveClass(
      'xr-btn--primary',
    );
    const clear = within(section.querySelector('.xr-toolbar-status') as HTMLElement).getByRole(
      'button',
      { name: 'Clear filters' },
    );
    expect(clear).toHaveClass('xr-btn--text');

    // Draft takes the read-only draft too (B5-02 `fst === 'draft'` keeps `readonly`).
    await userEvent.selectOptions(status, 'draft');
    expect(navigation.replace).toHaveBeenLastCalledWith('/vendor/experiments?status=draft');
    await waitFor(() =>
      expect(bodyRows().map((row) => row.querySelector('strong')?.textContent)).toEqual([
        'Pin Fin Efficiency',
        'Surface Roughness in Turning',
      ]),
    );
    expect(count()).toHaveTextContent('2 of 5 experiments');

    await userEvent.click(
      within(section.querySelector('.xr-toolbar-status') as HTMLElement).getByRole('button', {
        name: 'Clear filters',
      }),
    );
    expect(navigation.replace).toHaveBeenLastCalledWith('/vendor/experiments');
    await waitFor(() => expect(count()).toHaveTextContent('5 of 5 experiments'));
    expect(status).toHaveValue('all');
    expect(document.activeElement).toBe(
      within(section).getByRole('searchbox', { name: 'Search your experiments' }),
    );
  });

  it('the search matches the name, the SUB id and the course code (the service’s search)', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    showList(runtime);
    const section = await list();
    const search = within(section).getByRole('searchbox', { name: 'Search your experiments' });
    await userEvent.type(search, 'SUB-0081');
    await waitFor(() =>
      expect(bodyRows().map((row) => row.querySelector('strong')?.textContent)).toEqual([
        'Forced Convection',
      ]),
    );
    expect(count()).toHaveTextContent('1 of 5 experiments');
    await userEvent.clear(search);
    await userEvent.type(search, 'MEL ZG512');
    await waitFor(() =>
      expect(bodyRows().map((row) => row.querySelector('strong')?.textContent)).toEqual([
        'Surface Roughness in Turning',
      ]),
    );
    await userEvent.clear(search);
    await userEvent.type(search, 'fin');
    await waitFor(() =>
      expect(bodyRows().map((row) => row.querySelector('strong')?.textContent)).toEqual([
        'Pin Fin Efficiency',
        'Fin-Tube Bundle',
      ]),
    );
  });

  it('f2 No match: “No experiments match”, its Clear filters brings every row back', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    showList(runtime);
    const section = await list();
    const search = within(section).getByRole('searchbox', { name: 'Search your experiments' });
    await userEvent.type(search, 'Radiation');
    const none = await within(section).findByRole('heading', {
      level: 3,
      name: 'No experiments match',
    });
    const empty = none.closest('.xr-empty') as HTMLElement;
    expect(empty.closest('.xr-section-body')).not.toBeNull();
    expect(empty).toHaveTextContent('Try a different name, or clear the filters.');
    expect(count()).toHaveTextContent('0 of 5 experiments');
    expect(main().querySelector('table')).toBeNull();
    expect(within(section).getAllByRole('button', { name: 'Clear filters' })).toHaveLength(2);
    await userEvent.click(within(empty).getByRole('button', { name: 'Clear filters' }));
    await waitFor(() => expect(bodyRows()).toHaveLength(5));
    expect(search).toHaveValue('');
    expect(document.activeElement).toBe(search);
  });

  it('“Changed in the last 7 days” keeps B5-02’s recentIds on its own clock (27 Aug 2026)', async () => {
    const world = await fixtureWorld('spine-start');
    const { runtime } = await worldPlatform(ANIL, { ...world, anchor: BOARD_NOW as never });
    const id = await saveCompositeWall(runtime, { submit: true });
    showList(runtime);
    const section = await list();
    await waitFor(() => expect(count()).toHaveTextContent('6 of 6 experiments'));
    await userEvent.click(
      within(section).getByRole('checkbox', { name: 'Changed in the last 7 days' }),
    );
    expect(count()).toHaveTextContent('3 of 6 experiments');
    expect(
      bodyRows()
        .map((row) => row.querySelector('.xr-id')?.textContent)
        .sort(),
    ).toEqual([id, 'SUB-0079', 'SUB-0081'].sort());
    expect(id).toBe('SUB-0077');
    // With the Status filter: the returned one only.
    await userEvent.selectOptions(
      within(section).getByRole('combobox', { name: 'Status' }),
      'returned',
    );
    await waitFor(() => expect(count()).toHaveTextContent('1 of 6 experiments'));
    await userEvent.selectOptions(
      within(section).getByRole('combobox', { name: 'Status' }),
      'published',
    );
    expect(
      await within(section).findByRole('heading', { level: 3, name: 'No experiments match' }),
    ).toBeVisible();
  });

  it('one world (B5-08 f3): the Content Manager sends SUB-0074 back — Returned, You, Revise', async () => {
    const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
    showList(runtime);
    await list();
    await waitFor(() =>
      expect(cell(rowOf('Transient Cooling'), 3)).toHaveTextContent('Content Manager'),
    );
    const kavya = asPersonId(sample, KAVYA);
    await act(async () => {
      const decision = ok(
        await kavya.production.getPublicationDecision('SUB-0074' as SubmissionId),
      );
      const sent = await kavya.production.sendBack({
        id: 'SUB-0074' as SubmissionId,
        to: 'vendor',
        reason: 'The summary repeats the description. Please write one sentence.',
        references: [{ step: 'course-and-description', format: null, field: 'summary' }],
        expectedRev: decision.submission.rev,
      });
      if (!sent.ok) throw new Error(`send back ${JSON.stringify(sent.error)}`);
      await runtime.invalidate(sent.changed);
    });
    await waitFor(() => expect(cell(rowOf('Transient Cooling'), 2)).toHaveTextContent('Returned'));
    const row = rowOf('Transient Cooling');
    expect(cell(row, 3)).toHaveTextContent('You');
    expect(
      within(cell(row, 4)).getByRole('link', { name: 'Revise Transient Cooling' }),
    ).toHaveAttribute('href', '/vendor/experiments/SUB-0074/revise');
    // Newest change first: it moves to the top.
    expect(bodyRows()[0]).toBe(row);
  });

  it('f3 Empty: “You haven’t created an experiment yet” with the primary Create experiment', async () => {
    const { runtime } = await newVendor();
    showList(runtime);
    const title = await screen.findByRole('heading', {
      level: 2,
      name: 'You haven’t created an experiment yet',
    });
    const empty = title.closest('.xr-empty') as HTMLElement;
    expect(empty.parentElement).toHaveClass('xr-section');
    expect(empty).toHaveTextContent(
      'Create one, describe it, add its formats and delivery, and submit it for academic review.',
    );
    expect(within(empty).getByRole('link', { name: 'Create experiment' })).toHaveClass(
      'xr-btn--primary',
    );
    expect(screen.queryByRole('region', { name: 'All your experiments' })).toBeNull();
  });

  it('undrawn: failed with Try again (the section stays), then the list', async () => {
    const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
    faults(sample).failNext('ProductionService.listMyExperiments');
    showList(runtime);
    const title = await screen.findByRole('heading', {
      level: 3,
      name: STATE_COPY_VENDOR_HOME['VE-02.failed'].words,
    });
    expect(title.closest('.xr-section')).toHaveAccessibleName('All your experiments');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(count()).toHaveTextContent('5 of 5 experiments'));
  });

  it('undrawn: loading is announced politely in the table’s shape', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    showList(runtime);
    const status = await screen.findByText(STATE_COPY_VENDOR_HOME['VE-02.loading'].words);
    expect(status).toHaveAttribute('role', 'status');
    expect(status.closest('[aria-busy="true"]')).toHaveClass('xr-table-wrap');
    expect(status.closest('section')).toHaveAccessibleName('All your experiments');
    await list();
    await waitFor(() => expect(count()).toHaveTextContent('5 of 5 experiments'));
  });
});

describe('VE-02 helpers', () => {
  it('statusFilterOf reads the six service values; anything else is All statuses', () => {
    expect(statusFilterOf('?status=returned')).toBe('returned');
    expect(statusFilterOf('?status=with-academic-reviewer')).toBe('with-academic-reviewer');
    expect(statusFilterOf('?status=with_rv')).toBeNull();
    expect(statusFilterOf('')).toBeNull();
  });

  it('changedRecently: within seven days of the sample clock, a later change counts', () => {
    expect(changedRecently('2026-08-20T04:30:00.000Z', BOARD_NOW)).toBe(true);
    expect(changedRecently('2026-08-20T04:29:59.000Z', BOARD_NOW)).toBe(false);
    expect(changedRecently('2026-08-15T04:30:00.000Z', BOARD_NOW)).toBe(false);
    expect(changedRecently('2026-08-28T04:30:00.000Z', BOARD_NOW)).toBe(true);
  });

  it('vendorStatusOf: a resubmission reads “Submitted” until it moves on (M-3); a re-check is with the reviewer', () => {
    const of = (status: unknown, revision: number) =>
      vendorStatusOf({ status, revision } as MyExperimentRow['submission']);
    expect(of({ state: 'resubmitted', since: BOARD_NOW }, 2)).toBe('submitted');
    expect(
      of({ state: 'with-academic-reviewer', since: BOARD_NOW, reason: 'resubmission' }, 2),
    ).toBe('submitted');
    expect(of({ state: 'with-academic-reviewer', since: BOARD_NOW, reason: 'recheck' }, 1)).toBe(
      'with-academic-reviewer',
    );
    expect(
      of({ state: 'with-academic-reviewer', since: BOARD_NOW, reason: 'first-review' }, 1),
    ).toBe('with-academic-reviewer');
  });
});

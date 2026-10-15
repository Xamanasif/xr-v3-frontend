/**
 * Phase-2 Package 2A on the real composition root and the sample world: IA-01 Overview (B2-01),
 * IA-02 Content access (B2-02) and IA-03 Access plan (B2-03 frames 0–5), as Meera Iyer (Godavari)
 * and the other sample Institute Admins. Every status, line, item, row and figure is the ports'
 * answer: a grant given through the port changes what the pages show; the sample clock moves a
 * plan to "ending soon" and "ended"; the Super Admin's pause makes the pages read-only. Links to
 * screens not built in Package 2A are not drawn.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { IsoInstant } from '@xr/domain';
import { asPersonId, faults, setSampleNow } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import { board } from '@/test-support/boards';
import {
  PAUSED_INSTITUTE_ADMIN,
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
import { ContentAccess } from './ia-02-content-access/content-access';
import { AccessPlanDetail } from './ia-03-access-plan/access-plan';

afterEach(() => {
  forgetLastAddress();
});

const MEERA = PERSON_OF_ROLE.tenant_admin;
const MALNAD_IA = 'per-v-hegde';
const KONARK_IA = 'per-r-bhatt';
const SHELL = 'shell-and-tube-heat-exchanger';

const B2_01 = board('B2-01-IA-Overview.dc.html');
const B2_02 = board('B2-02-Content-Access.dc.html');
const B2_03 = board('B2-03-Access-Plan-and-Course-Codes.dc.html');

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function inInstitute(runtime: PlatformRuntime, path: string, page: ReactNode) {
  const navigation = testNavigation(path);
  const view = renderInTab(
    <WorkspaceLayout workspace="institute">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

const main = () => screen.getByRole('main');
const text = (node: Element | null) => node?.textContent ?? '';

/** The sample clock on a day of the plan's term (B2-01 f3 "15-day reminder", f4 ended). */
function moveClock(sample: Sample, instant: string) {
  setSampleNow(sample, instant as IsoInstant);
}
const ENDING_SOON = '2027-09-22T04:30:00.000Z';
const ENDED = '2027-10-20T04:30:00.000Z';

/** The Super Admin pauses Godavari (B7-04), as the record says it happened. */
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

async function overviewOf(runtime: PlatformRuntime) {
  const answer = await runtime.ports.institutions.getMyOverview();
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

/** Meera gives students an experiment through the port, as IA-05 sends it; the receipt refreshes. */
async function giveThroughPort(
  runtime: PlatformRuntime,
  target:
    | { readonly kind: 'student'; readonly studentId: string }
    | { readonly kind: 'students'; readonly studentIds: readonly string[] },
) {
  const plan = await runtime.ports.institutions.getAccessPlan('ACC-0107' as never);
  if (!plan.ok) throw new Error('plan');
  await act(async () => {
    const given = await runtime.ports.studentAccess.giveAccess({
      experimentIds: [SHELL as never],
      target: target as never,
      expectedPlanRev: plan.value.plan.rev,
    });
    if (!given.ok) throw new Error(`give ${JSON.stringify(given.error)}`);
    await runtime.invalidate(given.changed);
  });
}

async function attentionRegion() {
  return screen.findByRole('region', { name: 'Needs your attention' });
}

const rowTitles = (region: HTMLElement) =>
  [...region.querySelectorAll('.xr-row-title')].map((node) => node.textContent);

// ---- IA-01 Overview (B2-01) ------------------------------------------------------------------

describe('IA-01 — the status line, actions and attention rows are the port’s (B2-01 f0)', () => {
  it('access just activated: the institution, the plan, two actions and the rows', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    inInstitute(runtime, '/institute', <InstituteOverview />);
    const region = await attentionRegion();
    const overview = await overviewOf(runtime);
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
    expect(main().querySelector('.xr-overline')).toHaveTextContent(overview.institution.name);
    const statusLine = main().querySelector('.xw-statusline')!;
    expect(statusLine.querySelector('.xr-status--ok')).toHaveTextContent('Access active');
    expect(text(statusLine.querySelector('.xr-num'))).toBe(
      'Access plan ACC-0107 · 120 licences · Yearly, ends 7 Oct 2027',
    );
    expect(B2_01).toContain('Access plan ACC-0107 · 120 licences · Yearly, ends 7 Oct 2027');
    const actions = main().querySelector('.xr-phead-actions')!;
    expect(
      within(actions as HTMLElement).getByRole('link', { name: 'Add students' }),
    ).toHaveAttribute('href', '/institute/people/add');
    expect(
      within(actions as HTMLElement).getByRole('link', { name: 'Give students access' }),
    ).toHaveAttribute('href', '/institute/student-access/give');
    expect(actions.querySelector('.xr-btn--primary')).toHaveTextContent('Give students access');
    // One row per attention fact, in the port's order.
    expect(overview.attention.map((item) => item.kind)).toEqual([
      'experiment-not-given',
      'students-without-access',
    ]);
    const without = overview.attention[1] as { students: number };
    expect(rowTitles(region)).toEqual([
      'Shell-and-Tube Heat Exchanger hasn’t been given to any student',
      `${without.students} students have no access yet`,
    ]);
    expect(region.querySelector('.xr-section-head .xr-meta')).toHaveTextContent('2 items');
    const rows = [...region.querySelectorAll('li.xr-row')];
    expect(text(rows[0]!.querySelector('.xr-row-sub'))).toBe('ME ZG523 · access plan ACC-0107');
    expect(rows[0]!.querySelector('.xr-row-icon')).toHaveClass('xr-row-icon--wait');
    expect(
      within(rows[0] as HTMLElement).getByRole('link', { name: 'Give access' }),
    ).toHaveAttribute(
      'href',
      `/institute/student-access/give?course=thermodynamics-heat-transfer&experiment=${SHELL}`,
    );
    expect(text(rows[1]!.querySelector('.xr-row-sub'))).toBe('Imported on 8 Oct 2026');
    expect(
      within(rows[1] as HTMLElement).getByRole('link', { name: 'Review students' }),
    ).toHaveAttribute('href', '/institute/people');
    for (const words of [
      'Shell-and-Tube Heat Exchanger hasn’t been given to any student',
      'Imported on 8 Oct 2026',
      'Needs your attention',
    ]) {
      expect(B2_01).toContain(words);
    }
    // Top bar: "Overview" (a destination's own page).
    expect(document.querySelector('.xr-top-title')).toHaveTextContent('Overview');
  });

  it('after Meera gives access through the port, “hasn’t been given to any student” goes', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    inInstitute(runtime, '/institute', <InstituteOverview />);
    const region = await attentionRegion();
    expect(rowTitles(region)[0]).toBe(
      'Shell-and-Tube Heat Exchanger hasn’t been given to any student',
    );
    const before = (await overviewOf(runtime)).attention[1] as { students: number };
    await giveThroughPort(runtime, { kind: 'student', studentId: 'per-0002' });
    await waitFor(() =>
      expect(rowTitles(region)).toEqual([`${before.students - 1} students have no access yet`]),
    );
    expect(region.querySelector('.xr-section-head .xr-meta')).toHaveTextContent('1 item');
  });

  it('nothing needs attention once every active student has it (B2-01 f2)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    // Package 2B (PC-48): "Already has it" is answered for the experiment being given.
    const options = await runtime.ports.studentAccess.getGiveAccessOptions({
      experimentIds: [SHELL as never],
    });
    if (!options.ok) throw new Error('options');
    const studentIds = options.value.students
      .filter((student) => student.selectable)
      .map((student) => student.id);
    await giveThroughPort(runtime, { kind: 'students', studentIds });
    inInstitute(runtime, '/institute', <InstituteOverview />);
    const region = await attentionRegion();
    await waitFor(() =>
      expect(within(region).getByRole('heading', { level: 3 })).toHaveTextContent(
        'Nothing needs your attention right now.',
      ),
    );
    expect(region).toHaveTextContent('New items appear here as they come in.');
    expect(region.querySelector('.xr-empty-icon')).toHaveClass('xr-x-empty-icon--ok');
    expect(region.querySelector('.xr-section-head .xr-meta')).toBeNull();
    // The status line stays.
    expect(main().querySelector('.xw-statusline')).toHaveTextContent('Access active');
  });

  it('ending soon: the 15-day reminder is a state; “Request renewal” is not drawn (B2-01 f3)', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    moveClock(sample, ENDING_SOON);
    inInstitute(runtime, '/institute', <InstituteOverview />);
    const region = await attentionRegion();
    const statusLine = main().querySelector('.xw-statusline')!;
    expect(statusLine.querySelector('.xr-status--wait')).toHaveTextContent('Ending soon');
    expect(text(statusLine.querySelector('.xr-num'))).toBe(
      'Access plan ACC-0107 · 120 licences · ends 7 Oct 2027 — 15 days left',
    );
    const first = region.querySelector('li.xr-row')!;
    expect(text(first.querySelector('.xr-row-title'))).toBe('Access plan ACC-0107 ends in 15 days');
    expect(text(first.querySelector('.xr-row-sub'))).toBe('Ends 7 Oct 2027 · renewal reminder due');
    expect(first.querySelector('a')).toBeNull();
    expect(main()).not.toHaveTextContent('Request renewal');
    for (const words of [
      'Access plan ACC-0107 · 120 licences · ends 7 Oct 2027 — 15 days left',
      'Access plan ACC-0107 ends in 15 days',
      'Ends 7 Oct 2027 · renewal reminder due',
    ]) {
      expect(B2_01).toContain(words);
    }
    // Both actions stay while it is ending soon.
    expect(screen.getByRole('link', { name: 'Give students access' })).toBeVisible();
  });

  it('ended: one item, “Add students” only (B2-01 f4)', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    moveClock(sample, ENDED);
    inInstitute(runtime, '/institute', <InstituteOverview />);
    const region = await attentionRegion();
    const statusLine = main().querySelector('.xw-statusline')!;
    expect(statusLine.querySelector('.xr-status--off')).toHaveTextContent('Access ended');
    expect(text(statusLine.querySelector('.xr-num'))).toBe(
      'Access plan ACC-0107 ended on 7 Oct 2027',
    );
    expect(rowTitles(region)).toEqual(['Access plan ACC-0107 has ended']);
    expect(text(region.querySelector('.xr-row-sub'))).toBe(
      'Ended 7 Oct 2027 · students can’t open its experiments now',
    );
    expect(region.querySelector('li.xr-row a')).toBeNull();
    expect(screen.getByRole('link', { name: 'Add students' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Give students access' })).toBeNull();
    expect(B2_01).toContain('Access plan ACC-0107 ended on 7 Oct 2027');
  });

  it('paused: read-only, the one item opens Help (B2-01 f5; Deccan’s Institute Admin)', async () => {
    const { runtime } = await tabPlatform(PAUSED_INSTITUTE_ADMIN, 'after-flow-b');
    inInstitute(runtime, '/institute', <InstituteOverview />);
    const region = await attentionRegion();
    const overview = await overviewOf(runtime);
    const statusLine = main().querySelector('.xw-statusline')!;
    expect(statusLine.querySelector('.xr-status--paused')).toHaveTextContent('Access paused');
    expect(text(statusLine.querySelector('.xr-num'))).toBe(
      `Access plan ${overview.plan!.id} · paused by BITS on 12 Oct 2026`,
    );
    expect(main().querySelector('.xr-phead-actions')).toBeNull();
    expect(rowTitles(region)).toEqual(['BITS has paused your institution’s access']);
    expect(region).toHaveTextContent(
      'Students can’t open experiments. Pages are read-only until BITS lifts the pause.',
    );
    expect(within(region).getByRole('link', { name: 'Help' })).toHaveAttribute(
      'href',
      '/institute/help',
    );
    // The shell's paused banner (Batch 0) is the frame's.
    expect(document.querySelector('.xr-banner--paused')).not.toBeNull();
  });

  it('supplied licence waits, never counted, open Student access (B2-01 f7; later sample)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    inInstitute(runtime, '/institute', <InstituteOverview />);
    const region = await attentionRegion();
    const waiting = [...region.querySelectorAll('li.xr-row')].find((row) =>
      row.textContent!.includes('waiting for a licence'),
    )!;
    expect(text(waiting.querySelector('.xr-row-title'))).toBe(
      '2 students are waiting for a licence',
    );
    expect(text(waiting.querySelector('.xr-row-sub'))).toBe('Shell-and-Tube Heat Exchanger');
    expect(
      within(waiting as HTMLElement).getByRole('link', { name: 'View students' }),
    ).toHaveAttribute('href', '/institute/student-access');
    expect(B2_01).toContain('2 students are waiting for a licence');
  });

  it('a course without the institution’s code: “Add course code” opens Course codes (Konark, B2-01 f0; IA-16 since Package 2B)', async () => {
    const { runtime } = await tabPlatform(KONARK_IA, 'after-flow-b');
    inInstitute(runtime, '/institute', <InstituteOverview />);
    const region = await attentionRegion();
    const noCode = [...region.querySelectorAll('li.xr-row')].find((row) =>
      row.textContent!.includes('has no course code from your institution'),
    )!;
    expect(text(noCode.querySelector('.xr-row-sub'))).toBe('Content access · Course codes');
    expect(
      within(noCode as HTMLElement).getByRole('link', { name: 'Add course code' }),
    ).toHaveAttribute('href', '/institute/content-access?tab=course-codes');
  });

  it('announces loading; a failed read has Try again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    faults(sample).failNext('InstitutionService.getMyOverview');
    inInstitute(runtime, '/institute', <InstituteOverview />);
    const failed = await screen.findByRole('heading', { name: 'We couldn’t load your overview' });
    expect(failed.closest('.xr-empty')).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await attentionRegion()).toBeVisible();
  });

  it('the loading state is announced in the header', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    renderInTab(<InstituteOverview />, { runtime, navigation: testNavigation('/institute') });
    expect(document.querySelector('.xr-phead-meta [role="status"]')).toHaveTextContent(
      'Loading your overview',
    );
    expect(await attentionRegion()).toBeVisible();
  });
});

// ---- IA-02 Content access (B2-02) ------------------------------------------------------------

async function planSection(id = 'ACC-0107') {
  return screen.findByRole('region', { name: `Access plan ${id}` });
}

const countStatus = () => document.querySelector('.xr-toolbar-status [role="status"]');

describe('IA-02 — what BITS has given, per plan and experiment (B2-02 f0, f2)', () => {
  it('the plan band, the course group and one row per experiment, from the port', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    inInstitute(runtime, '/institute/content-access', <ContentAccess />);
    const section = await planSection();
    expect(screen.getByRole('heading', { level: 1, name: 'Content access' })).toBeVisible();
    expect(main().querySelector('.xr-phead-meta')).toHaveTextContent(
      'What BITS has given your institution to use',
    );
    expect(main().querySelector('.xr-phead-actions .xr-btn--primary')).toHaveAttribute(
      'href',
      '/institute/student-access/give',
    );
    // Both tabs since Package 2B: Course codes is IA-16.
    const tabs = screen.getByRole('navigation', { name: 'Content access' });
    expect(
      within(tabs)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Experiments', 'Course codes']);
    expect(within(tabs).getByRole('link', { name: 'Experiments' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(countStatus()).toHaveTextContent('1 experiment in 1 course');
    const band = section.querySelector('.xw-plan')!;
    expect(band.querySelector('.xr-status--ok')).toHaveTextContent('Active');
    expect(text(band.querySelector('.xr-num'))).toBe(
      '120 licences · Yearly · 8 Oct 2026 – 7 Oct 2027',
    );
    expect(
      within(band as HTMLElement).getByRole('link', { name: 'View access plan ACC-0107' }),
    ).toHaveAttribute('href', '/institute/content-access/plans/ACC-0107');
    expect(within(section).getByRole('heading', { level: 3 })).toHaveTextContent(
      'Thermodynamics & Heat Transfer',
    );
    // MEC-523 was added in the setup (S-steps): "Your code".
    expect(section.querySelector('.xw-cgroup-code')).toHaveTextContent(
      'ME ZG523·Your code: MEC-523',
    );
    const table = within(section).getByRole('table', { name: 'Experiments held in ME ZG523' });
    const cells = [...table.querySelectorAll('tbody tr td')];
    expect(within(cells[0] as HTMLElement).getByRole('link')).toHaveAttribute(
      'href',
      '/institute/content-access/plans/ACC-0107',
    );
    expect(text(cells[0]!)).toBe('Shell-and-Tube Heat Exchanger');
    expect(
      [...cells[1]!.querySelectorAll('.xr-fmt')].map((chip) => [
        chip.textContent,
        chip.classList.contains('xr-fmt--off'),
      ]),
    ).toEqual([
      ['WEB', false],
      ['VR', false],
      ['AR', true],
    ]);
    expect(cells[1]).toHaveTextContent('AR is published but not in your plan');
    expect(cells[2]).toHaveTextContent('Active');
    expect(text(cells[3]!)).toBe('None yet');
    expect(
      within(cells[4] as HTMLElement).getByRole('link', {
        name: 'Give students access to Shell-and-Tube Heat Exchanger',
      }),
    ).toHaveAttribute(
      'href',
      `/institute/student-access/give?course=thermodynamics-heat-transfer&experiment=${SHELL}`,
    );
    expect(cells[1]).toHaveAttribute('data-label', 'Formats in your plan');
    expect(B2_02).toContain('AR is published but not in your plan');
  });

  it('after Meera gives access the count opens Student access (B2-02 f2)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    inInstitute(runtime, '/institute/content-access', <ContentAccess />);
    const section = await planSection();
    await giveThroughPort(runtime, { kind: 'student', studentId: 'per-0002' });
    await waitFor(() =>
      expect(within(section).getByRole('link', { name: '1 student' })).toHaveAttribute(
        'href',
        '/institute/student-access',
      ),
    );
  });

  it('search and status narrow the rows; no match has one way back (B2-02 f7)', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    inInstitute(runtime, '/institute/content-access', <ContentAccess />);
    await planSection();
    const search = screen.getByRole('searchbox', { name: 'Search' });
    await user.type(search, 'Distillation');
    expect(
      await screen.findByRole('heading', { name: 'No experiments match these filters' }),
    ).toBeVisible();
    expect(countStatus()).toHaveTextContent('0 of 1 experiment');
    expect(screen.getByRole('button', { name: 'Remove Search: “Distillation”' })).toBeVisible();
    expect(screen.queryByRole('region', { name: 'Access plan ACC-0107' })).toBeNull();
    const clear = within(document.querySelector('.xr-empty') as HTMLElement).getByRole('button', {
      name: 'Clear filters',
    });
    await user.click(clear);
    expect(await planSection()).toBeVisible();
    expect(search).toHaveValue('');
    expect(search).toHaveFocus();
    // The course code matches too; the status filter keeps only that status.
    await user.type(search, 'zg523');
    expect(countStatus()).toHaveTextContent('1 of 1 experiment');
    await user.clear(search);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'ended');
    expect(
      await screen.findByRole('heading', { name: 'No experiments match these filters' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Remove Status: Ended' })).toBeVisible();
    await user.click(
      within(document.querySelector('.xr-toolbar-status') as HTMLElement).getByRole('button', {
        name: 'Clear filters',
      }),
    );
    expect(await planSection()).toBeVisible();
  });

  it('ending soon: the band counts the days and the notice says a reminder is due (B2-02 f3)', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    moveClock(sample, ENDING_SOON);
    inInstitute(runtime, '/institute/content-access', <ContentAccess />);
    const section = await planSection();
    expect(text(section.querySelector('.xw-plan .xr-num'))).toBe(
      '120 licences · Yearly · 8 Oct 2026 – 7 Oct 2027 · 15 days left',
    );
    const notice = within(section).getByRole('status');
    expect(notice).toHaveClass('xr-notice--warn');
    expect(notice).toHaveTextContent('Ends on 7 Oct 2027');
    expect(notice).toHaveTextContent('Renewal reminder due. Ask BITS for a renewal from Requests.');
    expect(within(notice).queryByRole('link')).toBeNull();
    expect(section.querySelector('tbody .xr-status--wait')).toHaveTextContent('Ending soon');
    expect(within(section).getByRole('link', { name: /^Give students access to/ })).toBeVisible();
    expect(B2_02).toContain('120 licences · Yearly · 8 Oct 2026 – 7 Oct 2027 · 15 days left');
  });

  it('ended: history stays, no Give access (B2-02 f4)', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    moveClock(sample, ENDED);
    inInstitute(runtime, '/institute/content-access', <ContentAccess />);
    const section = await planSection();
    const notice = within(section).getByRole('status');
    expect(notice).toHaveClass('xr-notice--quiet');
    expect(notice).toHaveTextContent('This plan has ended');
    expect(notice).toHaveTextContent(
      'Students can’t open its experiments now. You can still see who had access.',
    );
    expect(section.querySelector('.xw-plan .xr-status--off')).toHaveTextContent('Ended');
    expect(within(section).getByRole('link', { name: '1 student' })).toBeVisible();
    expect(screen.queryByRole('link', { name: /Give students access/ })).toBeNull();
    expect(main().querySelector('.xr-phead-actions')).toBeNull();
  });

  it('paused: read-only, actions removed (B2-02 f5)', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    await pauseGodavari(sample);
    inInstitute(runtime, '/institute/content-access', <ContentAccess />);
    const section = await planSection();
    const notice = within(section).getByRole('status');
    expect(notice).toHaveTextContent('Read-only while your institution’s access is paused');
    expect(notice).toHaveTextContent(
      'You can’t give or withdraw access until BITS lifts the pause.',
    );
    expect(section.querySelector('.xw-plan .xr-status--paused')).toHaveTextContent('Paused');
    expect(section.querySelector('tbody .xr-status--paused')).toHaveTextContent('Paused');
    expect(screen.queryByRole('link', { name: /Give students access/ })).toBeNull();
  });

  it('a course without the institution’s code is flagged, with “Add code” to Course codes (Konark; IA-16 since Package 2B)', async () => {
    const { runtime } = await tabPlatform(KONARK_IA, 'after-flow-b');
    inInstitute(runtime, '/institute/content-access', <ContentAccess />);
    const rows = await runtime.ports.institutions.listContentAccess();
    if (!rows.ok) throw new Error('rows');
    const section = await planSection(rows.value[0]!.plans[0]!.plan.id);
    expect(section.querySelector('.xw-tag--warn')).toHaveTextContent(
      'Your institution’s code: not added',
    );
    expect(within(section).getByRole('link', { name: 'Add code' })).toHaveAttribute(
      'href',
      '/institute/content-access?tab=course-codes',
    );
  });

  it('announces loading; a failed read has Try again (B2-02 f8, f9)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    faults(sample).failNext('InstitutionService.listContentAccess');
    renderInTab(<ContentAccess />, {
      runtime,
      navigation: testNavigation('/institute/content-access'),
    });
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      'Loading content access',
    );
    expect(
      await screen.findByRole('heading', { name: 'We couldn’t load content access' }),
    ).toBeVisible();
    expect(document.querySelector('.xr-empty')).toHaveTextContent(
      'Nothing has changed. Try again.',
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await planSection()).toBeVisible();
  });
});

// ---- IA-03 Access plan (B2-03 f0 … f5) -------------------------------------------------------

const PLAN_PATH = '/institute/content-access/plans/ACC-0107';

async function planPage(runtime: PlatformRuntime, planId = 'ACC-0107') {
  inInstitute(
    runtime,
    `/institute/content-access/plans/${planId}`,
    <AccessPlanDetail planId={planId} />,
  );
  return screen.findByRole('heading', { level: 1, name: `Access plan ${planId}` });
}

const regionNamed = (name: string) => screen.getByRole('region', { name });
const historyLines = () =>
  [...regionNamed('History').querySelectorAll('li.xr-tl')].map((item) =>
    [...item.querySelectorAll('.xr-tl-what, .xr-tl-when, .xr-tl-note')].map(
      (line) => line.textContent,
    ),
  );

describe('IA-03 — what BITS gave and who has it (B2-03 f0, f1)', () => {
  it('just activated: the plan, nobody given yet, and its history from the plan and the request', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    await planPage(runtime);
    expect(main().querySelector('.xr-back')).toHaveAttribute('href', '/institute/content-access');
    expect(main().querySelector('.xr-overline')).toHaveTextContent(
      'Godavari Institute of Technology',
    );
    const meta = main().querySelector('.xr-phead-meta')!;
    expect(meta.querySelector('.xr-status--ok')).toHaveTextContent('Active');
    expect(meta).toHaveTextContent('From request REQ-0042');
    expect(within(meta as HTMLElement).queryByRole('link')).toBeNull();
    expect(meta).toHaveTextContent('Active since 8 Oct 2026, 15:05');
    expect(
      within(main().querySelector('.xr-phead-actions') as HTMLElement).getByRole('link', {
        name: 'Give students access',
      }),
    ).toHaveAttribute('href', '/institute/student-access/give');
    const gave = regionNamed('What BITS gave your institution');
    expect([...gave.querySelectorAll('dt')].map((node) => node.textContent)).toEqual([
      'Licences',
      'Term',
      'Course',
    ]);
    expect([...gave.querySelectorAll('dd')].map((node) => node.textContent)).toEqual([
      '120 — as approved by BITS',
      'Yearly · 8 Oct 2026 to 7 Oct 2027',
      'ME ZG523 · Thermodynamics & Heat Transfer',
    ]);
    const experiments = within(gave).getByRole('table', { name: 'Experiments in this plan' });
    const cells = [...experiments.querySelectorAll('tbody td')];
    expect(text(cells[0]!)).toBe('Shell-and-Tube Heat Exchanger');
    expect([...cells[1]!.querySelectorAll('.xr-fmt')].map((chip) => chip.textContent)).toEqual([
      'WEB',
      'VR',
    ]);
    expect([...cells[2]!.querySelectorAll('.xr-fmt--off')].map((chip) => chip.textContent)).toEqual(
      ['AR'],
    );
    expect(gave).not.toHaveTextContent('Ask BITS from Requests');
    const given = regionNamed('Students you’ve given access');
    expect(within(given).getByRole('heading', { level: 3 })).toHaveTextContent(
      'You haven’t given anyone access yet',
    );
    expect(given).toHaveTextContent(
      'Choose students and give them Shell-and-Tube Heat Exchanger. They see the formats in this plan.',
    );
    expect(within(given).getByRole('link', { name: 'Give students access' })).toHaveAttribute(
      'href',
      `/institute/student-access/give?course=thermodynamics-heat-transfer&experiment=${SHELL}`,
    );
    expect(historyLines()).toEqual([
      [
        'Access activated',
        '8 Oct 2026, 15:05',
        'Payment confirmed for REQ-0042. Plan ACC-0107 created.',
      ],
      ['Request approved · External', '8 Oct 2026, 11:20', 'Approved — payment required.'],
      ['Request submitted', '2 Oct 2026, 10:14 · Meera Iyer'],
    ]);
    for (const words of [
      'Payment confirmed for REQ-0042. Plan ACC-0107 created.',
      '2 Oct 2026, 10:14 · Meera Iyer',
      'Request approved · External',
    ]) {
      expect(B2_03).toContain(words);
    }
    // Top bar: "ACC-0107", crumbed under Content access.
    expect(document.querySelector('.xr-top-title')).toHaveTextContent('ACC-0107');
    const crumbs = screen.getByRole('list', { name: 'You are here' });
    expect(within(crumbs).getByRole('link', { name: 'Content access' })).toHaveAttribute(
      'href',
      '/institute/content-access',
    );
  });

  it('after SACC-0310: Rahul under “Students you’ve given access”, the grant in the history (B2-03 f1)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    await planPage(runtime);
    const given = regionNamed('Students you’ve given access');
    expect(within(given).getByRole('link', { name: 'Open Student access' })).toHaveAttribute(
      'href',
      '/institute/student-access',
    );
    const table = within(given).getByRole('table', {
      name: 'Students given access under ACC-0107',
    });
    const cells = [...table.querySelectorAll('tbody tr td')];
    expect(
      within(cells[0] as HTMLElement).getByRole('link', { name: 'Rahul Verma' }),
    ).toHaveAttribute('href', '/institute/people/students/per-0002');
    expect(cells[0]).toHaveTextContent('GIT-2026-0418');
    expect(cells[1]).toHaveTextContent('Shell-and-Tube Heat Exchanger');
    expect([...cells[1]!.querySelectorAll('.xr-fmt')].map((chip) => chip.textContent)).toEqual([
      'WEB',
      'VR',
    ]);
    expect(text(cells[2]!)).toBe('9 Oct 2026 · individuallySACC-0310');
    expect(cells[3]!.querySelector('.xr-status--ok')).toHaveTextContent('Active');
    expect(historyLines()[0]).toEqual([
      'Rahul Verma given Shell-and-Tube Heat Exchanger',
      '9 Oct 2026, 10:20 · Meera Iyer',
      'SACC-0310 · individually',
    ]);
    expect(historyLines()).toHaveLength(4);
    expect(B2_03).toContain('9 Oct 2026 · individually');
  });

  it('later sample: a group grant reaches its members, each with their own status', async () => {
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    await planPage(runtime);
    const table = within(regionNamed('Students you’ve given access')).getByRole('table');
    const rows = [...table.querySelectorAll('tbody tr')];
    const arun = rows.find((row) => row.textContent!.includes('Arun Kumar'))!;
    expect(arun.querySelector('td[data-label="Given"]')).toHaveTextContent(
      '12 Oct 2026 · through the group ME ZG523 — Sem II',
    );
    expect(arun.querySelector('.xr-status--wait')).toHaveTextContent('Waiting for a licence');
    const sneha = rows.find((row) => row.textContent!.includes('Sneha Reddy'))!;
    expect(sneha.querySelector('.xr-status--off')).toHaveTextContent('Student inactive');
    const view = await runtime.ports.institutions.getAccessPlan('ACC-0107' as never);
    if (!view.ok) throw new Error('plan');
    expect(rows).toHaveLength(view.value.givenTo.length);
    expect(historyLines().map((line) => line[0])).toContain(
      'ME ZG523 — Sem II given Shell-and-Tube Heat Exchanger',
    );
    expect(historyLines().map((line) => line[0])).toContain(
      'Nikhil Bose’s access to Shell-and-Tube Heat Exchanger withdrawn',
    );
  });
});

describe('IA-03 — ending soon, ended and paused (B2-03 f2, f3, f4)', () => {
  it('ending soon: the term counts the days left (f2)', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    moveClock(sample, ENDING_SOON);
    await planPage(runtime);
    expect(main().querySelector('.xr-phead-meta .xr-status--wait')).toHaveTextContent(
      'Ending soon',
    );
    expect(regionNamed('What BITS gave your institution')).toHaveTextContent(
      'Yearly · 8 Oct 2026 to 7 Oct 2027 · 15 days left',
    );
    expect(screen.getByRole('link', { name: 'Give students access' })).toBeVisible();
    expect(B2_03).toContain('Yearly · 8 Oct 2026 to 7 Oct 2027 · 15 days left');
  });

  it('ended: the notice, access ended on every row, “Plan ended” first in the history (f3)', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    moveClock(sample, ENDED);
    await planPage(runtime);
    expect(main().querySelector('.xr-phead-meta .xr-status--off')).toHaveTextContent('Ended');
    const notice = main().querySelector('.xw-stack > .xr-notice--quiet')!;
    expect(notice).toHaveTextContent('This plan ended on 7 Oct 2027');
    expect(notice).toHaveTextContent(
      'Students can’t open its experiments now. Your records stay here.',
    );
    expect(notice.querySelector('a')).toBeNull();
    expect(
      regionNamed('Students you’ve given access').querySelector('tbody .xr-status--off'),
    ).toHaveTextContent('Access ended');
    expect(historyLines()[0]).toEqual(['Plan ended', '7 Oct 2027', 'End of the yearly term.']);
    expect(screen.queryByRole('link', { name: 'Give students access' })).toBeNull();
  });

  it('paused: read-only notice, Paused rows, the pause in the history (f4)', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    await pauseGodavari(sample);
    await planPage(runtime);
    expect(main().querySelector('.xr-phead-meta .xr-status--paused')).toHaveTextContent('Paused');
    const notice = main().querySelector('.xw-stack > .xr-notice--warn')!;
    expect(notice).toHaveTextContent('Read-only while your institution’s access is paused');
    expect(
      regionNamed('Students you’ve given access').querySelector('tbody .xr-status--paused'),
    ).toHaveTextContent('Paused');
    expect(historyLines()[0]).toEqual(['Access paused by BITS', '12 Oct 2026']);
    expect(screen.queryByRole('link', { name: 'Give students access' })).toBeNull();
  });
});

describe('IA-03 — guards and states', () => {
  it.each(['ACC-0085', 'ACC-9999'])(
    '%s: not this institution’s plan → the in-shell not-found page',
    async (planId) => {
      const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
      inInstitute(
        runtime,
        `/institute/content-access/plans/${planId}`,
        <AccessPlanDetail planId={planId} />,
      );
      expect(await screen.findByRole('heading', { name: 'We can’t find that page' })).toBeVisible();
      expect(main()).not.toHaveTextContent(planId);
    },
  );

  it('announces loading; a failed read has Try again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    faults(sample).failNext('InstitutionService.getAccessPlan');
    inInstitute(runtime, PLAN_PATH, <AccessPlanDetail planId="ACC-0107" />);
    expect(
      await screen.findByRole('heading', { name: 'We couldn’t load this access plan' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Access plan ACC-0107' }),
    ).toBeVisible();
  });

  it('the ending-soon plan of another institution reads the same way (Malnad, 3 days left)', async () => {
    const { runtime } = await tabPlatform(MALNAD_IA, 'after-flow-b');
    const overview = await overviewOf(runtime);
    await planPage(runtime, overview.plan!.id);
    expect(regionNamed('What BITS gave your institution')).toHaveTextContent('3 days left');
  });
});

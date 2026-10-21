/**
 * Package 2B, ST-04 My courses › All experiments (B2-11 f2, f4, f15) and the My courses tab strip,
 * on the real composition root and the sample world. Every row is the ports' answer for the
 * signed-in Student: an experiment appears only while the service gives it (never one published
 * but not given), with ST-03's row words for a paused institution and a supplied licence wait; a
 * withdrawal by the Institute Admin in the same world empties the tab.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { asPersonId, beginSession, faults } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

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
import { MyCourses } from './st-02-my-courses/my-courses';

afterEach(() => {
  forgetLastAddress();
});

const RAHUL = 'per-0002';
const ARUN = 'per-0004';
const MEERA = 'per-0001';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function inStudent(runtime: PlatformRuntime, search: string, page: ReactNode = <MyCourses />) {
  const navigation = testNavigation('/student/courses', search);
  const view = renderInTab(
    <WorkspaceLayout workspace="student">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

const main = () => screen.getByRole('main');
const rows = () => [...document.querySelectorAll<HTMLElement>('main .sv-xpanel li.sv-xli')];
const count = () => document.querySelector('.sv-toolbar-s .rk-count[role="status"]')?.textContent;
const formatLines = (row: HTMLElement) =>
  [...row.querySelectorAll('.sv-xli-f > li')].map((li) => li.textContent);
/** Student words never carry an internal record reference (lead decision 3). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT)-\d+/;

async function signIn(sample: Sample, runtime: PlatformRuntime, personId: string) {
  beginSession(sample, personId);
  await act(async () => {
    await runtime.session.refresh();
  });
}

describe('ST-04 — the experiments given to the Student (B2-11 f2)', () => {
  it('one row per given experiment, with its formats and progress, opening the hub', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, '?tab=experiments');
    await waitFor(() => expect(rows()).toHaveLength(1));
    const [row] = rows();
    expect(within(row!).getByRole('heading', { level: 3 }).textContent).toBe(
      'Shell-and-Tube Heat Exchanger',
    );
    // The institution's own code once set (T-17; MEC-523 since 8 Oct), then the course.
    const kicker = row!.querySelector('.sv-li-k')!;
    expect(kicker.querySelector('.rk-owncode.sv-code-sm')).toHaveTextContent('MEC-523');
    expect(kicker).toHaveTextContent('MEC-523Thermodynamics & Heat Transfer');
    expect(formatLines(row!)).toEqual([
      'WEBBrowser: Not started',
      'VRVirtual reality: Not started',
    ]);
    expect(
      within(row!).getByRole('list', { name: 'Your formats for Shell-and-Tube Heat Exchanger' }),
    ).toBeVisible();
    expect(
      within(row!).getByRole('link', { name: 'Open experiment Shell-and-Tube Heat Exchanger' }),
    ).toHaveAttribute('href', '/student/experiments/shell-and-tube-heat-exchanger');
    expect(screen.getByRole('list', { name: 'Experiments' })).toContainElement(row!);
    expect(screen.getByRole('region', { name: 'All the experiments given to you' })).toHaveClass(
      'sv-card',
      'sv-xpanel',
    );
    expect(screen.getByRole('search', { name: 'Filter your experiments' })).toBeVisible();
    expect(count()).toBe('1 experiment in 1 course');
    // The tab strip: "Courses · All experiments", All experiments current; the top bar crumbs it.
    const tabs = screen.getByRole('navigation', { name: 'My courses' });
    expect(within(tabs).getByRole('link', { name: 'All experiments' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(tabs).getByRole('link', { name: 'Courses' })).toHaveAttribute(
      'href',
      '/student/courses',
    );
    await waitFor(() => expect(document.title).toBe('All experiments · XR Learning Platform'));
    expect(main().textContent).not.toMatch(REFERENCE);
  });

  it('an experiment published but not given is never listed: searching for it matches nothing (f4)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, '?tab=experiments');
    await waitFor(() => expect(rows()).toHaveLength(1));
    const user = userEvent.setup();
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'Fin-Tube');
    await waitFor(() => expect(rows()).toHaveLength(0));
    // The export's no-match row (`X.nomatch`): a status with its line and "Clear filters".
    const none = main().querySelector<HTMLElement>('.sv-pstate.sv-pstate--row')!;
    expect(none).toHaveAttribute('role', 'status');
    expect(none).toHaveTextContent(
      'No experiments matchOnly experiments your institution has given you are listed. Try fewer filters or a different spelling.',
    );
    expect(count()).toBe('0 of 1 experiment');
    expect(screen.getByRole('button', { name: 'Remove filter Search: “Fin-Tube”' })).toBeVisible();
    // Two "Clear filters": the toolbar's (`rk-clear`) and the no-match row's; the row's is last.
    const clears = within(main()).getAllByRole('button', { name: 'Clear filters' });
    expect(clears[0]).toHaveClass('rk-clear');
    await user.click(clears.at(-1)!);
    await waitFor(() => expect(rows()).toHaveLength(1));
    const search = screen.getByRole('searchbox', { name: 'Search' });
    expect(search).toHaveValue('');
    // Focus left with the button: it returns to the search box.
    expect(document.activeElement).toBe(search);
  });

  it('removing a chip returns focus to its field', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, '?tab=experiments');
    await waitFor(() => expect(rows()).toHaveLength(1));
    const user = userEvent.setup();
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'shell');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Format' }), 'web');
    expect(count()).toBe('1 of 1 experiment');
    expect([...main().querySelectorAll('.rk-chip')].map((chip) => chip.textContent)).toEqual([
      'Search: “shell”',
      'Format: WEB',
    ]);
    await user.click(screen.getByRole('button', { name: 'Remove filter Format: WEB' }));
    expect(document.activeElement).toBe(screen.getByRole('combobox', { name: 'Format' }));
    await user.click(screen.getByRole('button', { name: 'Remove filter Search: “shell”' }));
    expect(document.activeElement).toBe(screen.getByRole('searchbox', { name: 'Search' }));
    expect(main().querySelector('.rk-chip')).toBeNull();
    expect(main().querySelector('.rk-clear')).toBeNull();
    expect(count()).toBe('1 experiment in 1 course');
  });

  it('the Format filter offers the given formats and narrows the rows', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, '?tab=experiments');
    await waitFor(() => expect(rows()).toHaveLength(1));
    const format = screen.getByRole('combobox', { name: 'Format' });
    expect([...format.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      'All formats',
      'WEB',
      'VR',
    ]);
    const user = userEvent.setup();
    await user.selectOptions(format, 'vr');
    expect(rows()).toHaveLength(1);
    expect(count()).toBe('1 of 1 experiment');
  });

  it('nothing given yet: the drawn empty state, no toolbar', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-setup');
    inStudent(runtime, '?tab=experiments');
    await waitFor(() =>
      expect(main().textContent).toContain('Your institution hasn’t given you access yet'),
    );
    expect(main().textContent).toContain(
      'Experiments appear here when your institution gives them to you.',
    );
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(within(main()).getByRole('link', { name: 'Help & support' })).toHaveAttribute(
      'href',
      '/student/help',
    );
  });

  it('loading is announced, a failure says nothing changed, “Try again” reads again', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    faults(sample).failNext('StudentAccessService.listMyCourses');
    inStudent(runtime, '?tab=experiments');
    const loading = await screen.findByText('Loading your experiments…');
    expect(loading).toHaveAttribute('role', 'status');
    const failed = await screen.findByRole('heading', {
      name: 'We couldn’t load your experiments',
    });
    const card = failed.closest<HTMLElement>('section.sv-msg')!;
    expect(card).toHaveAttribute('role', 'alert');
    expect(card).toHaveTextContent('Nothing has changed. Try again.');
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(document.activeElement).toBe(main());
  });

  it('a supplied licence wait is named and keeps “Open” (later sample, Arun Kumar)', async () => {
    const { runtime } = await tabPlatform(ARUN, 'later-sample');
    inStudent(runtime, '?tab=experiments');
    await waitFor(() => expect(rows().length).toBeGreaterThan(0));
    const [row] = rows();
    // The held chip with the clock and "Waiting for a licence" (`fmtStatus`), named by content —
    // never by the plan (lead decision 3).
    expect(formatLines(row!).every((line) => line?.includes('Waiting for a licence'))).toBe(true);
    expect(row!.querySelectorAll('.sv-fmt--held').length).toBeGreaterThan(0);
    expect(row!.textContent).not.toMatch(REFERENCE);
    expect(row!.textContent).not.toContain('Available to you');
    expect(within(row!).getByRole('link', { name: /^Open experiment / })).toBeVisible();
  });

  it('paused by BITS: the formats off with the paused words, no “Open”', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    const admin = asPersonId(sample, SUPER_ADMIN);
    const detail = await admin.institutions.getInstitution('godavari' as never);
    if (!detail.ok) throw new Error('godavari');
    const paused = await admin.institutions.pauseInstitution({
      institutionId: 'godavari' as never,
      reason: 'Licence review.',
      expectedRev: detail.value.institution.rev,
    });
    if (!paused.ok) throw new Error('pause');
    await act(async () => {
      await runtime.session.refresh();
    });
    inStudent(runtime, '?tab=experiments');
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(formatLines(rows()[0]!)).toEqual(['WEBBrowser: Paused', 'VRVirtual reality: Paused']);
    expect(rows()[0]!.querySelectorAll('.sv-fmt--held')).toHaveLength(2);
    expect(within(rows()[0]!).queryByRole('link')).toBeNull();
  });

  it('the Institute Admin withdraws the grant in the same world: the tab empties, earlier work kept', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, '?tab=experiments');
    await waitFor(() => expect(rows()).toHaveLength(1));
    await signIn(sample, runtime, MEERA);
    const grants = await runtime.ports.studentAccess.listGrants({ showWithdrawn: false });
    if (!grants.ok) throw new Error('listGrants');
    const row = grants.value.find((entry) => entry.grant.id === 'SACC-0310')!;
    const withdrawn = await runtime.ports.studentAccess.withdrawGrant({
      grantId: row.grant.id,
      reason: 'Given individually by mistake.',
      expectedRev: row.grant.rev,
    });
    expect(withdrawn.ok).toBe(true);
    await signIn(sample, runtime, RAHUL);
    // The empty state itself, not only "no rows" (true while the tab is still loading too).
    await waitFor(() =>
      expect(main().textContent).toMatch(
        /No experiments are given to you right now|Your institution hasn’t given you access yet/,
      ),
    );
    expect(rows()).toHaveLength(0);
  });
});

describe('My courses tabs (B2-11 f0)', () => {
  it('Courses is the bare address; any other tab is normalised to it', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    const { navigation } = inStudent(runtime, '?tab=courses');
    await waitFor(() =>
      expect(
        within(screen.getByRole('navigation', { name: 'My courses' })).getByRole('link', {
          name: 'Courses',
        }),
      ).toHaveAttribute('aria-current', 'page'),
    );
    expect(navigation.replace).toHaveBeenCalledWith('/student/courses');
    await waitFor(() => expect(document.title).toBe('My courses · XR Learning Platform'));
  });
});

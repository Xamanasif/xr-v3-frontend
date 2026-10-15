/**
 * Package 2B, ST-04 My courses › All experiments (B2-11 f2, f4, f15) and the My courses tab strip,
 * on the real composition root and the sample world. Every row is the ports' answer for the
 * signed-in Student: an experiment appears only while the service gives it (never one published
 * but not given), with ST-03's row words for a paused institution and a supplied licence wait; a
 * withdrawal by the Institute Admin in the same world empties the tab.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { asPersonId, beginSession } from '@xr/sample-platform/testing';
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
const rows = () => [...document.querySelectorAll<HTMLElement>('main .xw-erow')];
const count = () => document.querySelector('.xr-toolbar-status [role="status"]')?.textContent;

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
    // The institution's own code once set (T-17; MEC-523 since 8 Oct).
    expect(row!.textContent).toContain('MEC-523 · Thermodynamics & Heat Transfer');
    expect(row!.textContent).toContain('Available to you:');
    expect(row!.textContent).toContain('WEB Not started · VR Not started');
    expect(
      within(row!).getByRole('link', { name: 'Open Shell-and-Tube Heat Exchanger' }),
    ).toHaveAttribute('href', '/student/experiments/shell-and-tube-heat-exchanger');
    expect(count()).toBe('1 experiment given to you');
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
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('All experiments');
  });

  it('an experiment published but not given is never listed: searching for it matches nothing (f4)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, '?tab=experiments');
    await waitFor(() => expect(rows()).toHaveLength(1));
    const user = userEvent.setup();
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'Fin-Tube');
    await waitFor(() => expect(rows()).toHaveLength(0));
    expect(main().textContent).toContain('No experiments match');
    expect(count()).toBe('0 of 1 experiment');
    expect(screen.getByRole('button', { name: 'Remove Search: “Fin-Tube”' })).toBeVisible();
    await user.click(within(main()).getAllByRole('button', { name: 'Clear filters' }).at(-1)!);
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(screen.getByRole('searchbox', { name: 'Search' })).toHaveValue('');
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
  });

  it('a supplied licence wait is named and keeps “Open” (later sample, Arun Kumar)', async () => {
    const { runtime } = await tabPlatform(ARUN, 'later-sample');
    inStudent(runtime, '?tab=experiments');
    await waitFor(() => expect(rows().length).toBeGreaterThan(0));
    const [row] = rows();
    expect(row!.textContent).toMatch(/No licence is available for you on ACC-\d+ right now\./);
    expect(row!.textContent).not.toContain('Available to you:');
    expect(within(row!).getByRole('link', { name: /^Open / })).toBeVisible();
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
    expect(rows()[0]!.textContent).toContain(
      'Paused — your institution’s access is paused. Your work is kept.',
    );
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
    await waitFor(() => expect(rows()).toHaveLength(0));
    expect(main().textContent).toMatch(
      /No experiments are given to you right now|Your institution hasn’t given you access yet/,
    );
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
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('My courses');
  });
});

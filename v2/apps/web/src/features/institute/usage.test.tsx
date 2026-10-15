/**
 * IA-20 Usage (board B3-10 f0 … f4) on the real composition root and the sample world: the
 * figures per experiment × format as `OperationsService.getUsage` answers them, by course (f1,
 * `?view=course`), "No activity yet" (f2), the undrawn loading and failed states, and the figures
 * moving when the runtime's own reports (the stand-ins, as the CI seam writes them) record
 * activity or a completion in the same tab. Nothing is ever summed; no feedback, export or licence
 * figure is shown.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AccessPlan, ExperimentId, PersonId } from '@xr/domain';
import { faults, fixtureWorld, standinsOf } from '@xr/sample-platform/testing';
import { afterEach, describe, expect, it } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import {
  PAUSED_INSTITUTE_ADMIN,
  PERSON_OF_ROLE,
  renderInTab,
  tabPlatform,
  testNavigation,
  worldPlatform,
} from '@/test-support/workspace';

import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { Usage } from './ia-20-usage/usage';

afterEach(() => {
  forgetLastAddress();
});

const MEERA = PERSON_OF_ROLE.tenant_admin;
const RAHUL = 'per-0002';
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const FIN_TUBE = 'fin-tube-bundle';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function showUsage(runtime: PlatformRuntime, search = '') {
  const navigation = testNavigation('/institute/usage', search);
  const view = renderInTab(<WorkspaceLayout workspace="institute">{<Usage />}</WorkspaceLayout>, {
    runtime,
    navigation,
  });
  return { navigation, view };
}

const main = () => screen.getByRole('main');
const meta = () => document.querySelector('.xr-phead-meta');
const viewSwitch = () => screen.getByRole('group', { name: 'View' });

/** A table's body rows as their cells' text. */
function cells(table: HTMLElement): string[][] {
  return [...table.querySelectorAll('tbody tr')].map((row) =>
    [...row.querySelectorAll('td')].map((cell) => cell.textContent ?? ''),
  );
}

async function experimentSection(name = SHELL_NAME) {
  return screen.findByRole('region', { name });
}

/** The runtime's own report through the stand-in, then the tab's reads refreshed (the CI seam). */
async function report(
  sample: Sample,
  runtime: PlatformRuntime,
  format: 'web' | 'vr',
  kind: 'opened' | 'session' | 'completed',
) {
  const standins = standinsOf(sample);
  const base = {
    studentId: RAHUL as PersonId,
    experimentId: SHELL as ExperimentId,
    format,
    at: standins.clock.now(),
  };
  const answer =
    kind === 'completed'
      ? standins.runtimeReport.reportCompletion({
          ...base,
          from: format === 'web' ? 'simulation' : 'headset',
        })
      : standins.runtimeReport.reportActivity({ ...base, kind });
  if (!answer.ok) throw new Error(`runtime report refused: ${answer.error.kind}`);
  await act(async () => {
    await runtime.invalidate(answer.changed);
  });
}

// ---- f0, f3, f4: by experiment and format ----------------------------------------------------

describe('IA-20 — by experiment and format (B3-10 f0)', () => {
  it('the header, the view switch, the experiment’s figures per format and the definitions', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-c');
    showUsage(runtime);
    const section = await experimentSection();
    expect(screen.getByRole('heading', { level: 1, name: 'Usage' })).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    // The service's "figures up to" instant (the sample world's now, 27 Oct in Indian time).
    expect(meta()).toHaveTextContent('How your content is being used · figures up to 27 Oct 2026');
    // The shell: Usage current, the top bar and crumb "Usage".
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Usage');
    expect(
      screen
        .getByRole('navigation', { name: 'Institute Admin navigation' })
        .querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', '/institute/usage');

    const buttons = within(viewSwitch()).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual([
      'By experiment and format',
      'By course',
    ]);
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'false');

    expect(section.querySelector('.xr-section-head')).toHaveTextContent(
      'ME ZG523 · access plan ACC-0107',
    );
    // Rahul is the one Godavari student who can open it in this world (the board's five are sample).
    expect(section.querySelector('.xr-section-head')).toHaveTextContent('1 student with access');
    const table = within(section).getByRole('table', {
      name: `Usage by format for ${SHELL_NAME}`,
    });
    expect([...table.querySelectorAll('th')].map((header) => header.textContent)).toEqual([
      'Format',
      'Started',
      'Completed',
      'Sessions',
    ]);
    // WEB then VR (display order); his two completions are inside these per-format counts.
    expect(cells(table)).toEqual([
      ['WEBWEB', '1', '1', '1'],
      ['VRVR', '1', '1', '1'],
    ]);
    expect(table.querySelector('td.is-primary .xr-fmt.xr-fmt--compact')).toHaveTextContent('WEB');
    // Labelled rows below 760 px of content (f4): every figure cell carries its column's name.
    expect(
      [...table.querySelectorAll('tbody tr:first-child td[data-label]')].map((cell) =>
        cell.getAttribute('data-label'),
      ),
    ).toEqual(['Started', 'Completed', 'Sessions']);

    const definitions = screen.getByRole('region', { name: 'What the figures mean' });
    expect([...definitions.querySelectorAll('dt')].map((term) => term.textContent)).toEqual([
      'Students with access',
      'Started',
      'Completed',
      'Sessions',
    ]);
    expect(definitions.querySelectorAll('dd')).toHaveLength(4);
  });

  it('never a total, a feedback column, an export or a licence figure', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-c');
    showUsage(runtime);
    await experimentSection();
    const text = main().textContent ?? '';
    expect(text).not.toMatch(/total|feedback|export|download|licen[cs]e|%/i);
    // Rahul sent feedback on both formats in this world: none of it is read here (T-25).
    expect(text).not.toMatch(/rating|comment/i);
    expect(within(main()).queryAllByRole('link')).toHaveLength(0);
  });

  it('an unknown view shows this view and the address becomes the bare one', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-c');
    const { navigation } = showUsage(runtime, '?view=formats');
    await experimentSection();
    expect(navigation.replace).toHaveBeenCalledWith('/institute/usage');
    expect(
      within(viewSwitch()).getByRole('button', { name: 'By experiment and format' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});

// ---- f1: by course ------------------------------------------------------------------------------

describe('IA-20 — by course (B3-10 f1)', () => {
  it('“By course” switches the view and mirrors it into the address; back again', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(MEERA, 'after-flow-c');
    const { navigation } = showUsage(runtime);
    await experimentSection();
    await user.click(within(viewSwitch()).getByRole('button', { name: 'By course' }));
    expect(navigation.replace).toHaveBeenLastCalledWith('/institute/usage?view=course');
    expect(within(viewSwitch()).getByRole('button', { name: 'By course' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(viewSwitch()).getByRole('button', { name: 'By course' })).toHaveFocus();
    const table = screen.getByRole('table', { name: 'Usage by course' });
    expect([...table.querySelectorAll('th')].map((header) => header.textContent)).toEqual([
      'Course',
      'Experiments given',
      'Students with access',
      'Sessions (WEB · VR)',
    ]);
    // Started and completed stay per format: the course row has none of them (never a verdict).
    expect(cells(table)).toEqual([['Thermodynamics & Heat TransferME ZG523', '1', '1', '1 · 1']]);
    expect(table.querySelector('td.is-primary .xr-sub.xr-id')).toHaveTextContent('ME ZG523');
    expect(screen.queryByRole('region', { name: SHELL_NAME })).toBeNull();
    expect(screen.getByRole('region', { name: 'What the figures mean' })).toBeVisible();

    await user.click(
      within(viewSwitch()).getByRole('button', { name: 'By experiment and format' }),
    );
    expect(navigation.replace).toHaveBeenLastCalledWith('/institute/usage');
    expect(await experimentSection()).toBeVisible();
    expect(screen.queryByRole('table', { name: 'Usage by course' })).toBeNull();
  });

  it('`?view=course` opens on the course view', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-device');
    const { navigation } = showUsage(runtime, '?view=course');
    expect(await screen.findByRole('table', { name: 'Usage by course' })).toBeVisible();
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(meta()).toHaveTextContent('figures up to 24 Oct 2026');
  });

  it('a course with two experiments: two sections, and its course row adds nothing up', async () => {
    const world = await fixtureWorld('after-flow-c');
    const plan = world.records.plans['ACC-0107'] as AccessPlan;
    const { runtime } = await worldPlatform(MEERA, {
      ...world,
      records: {
        ...world.records,
        plans: {
          ...world.records.plans,
          'ACC-0107': {
            ...plan,
            items: [...plan.items, { experimentId: FIN_TUBE as never, formats: ['web'] }],
          },
        },
      },
    });
    const user = userEvent.setup();
    showUsage(runtime);
    await experimentSection();
    const sections = main().querySelectorAll('section.xr-section');
    // Shell-and-Tube, Fin-Tube, then the definitions.
    expect(sections).toHaveLength(3);
    const fin = sections[1] as HTMLElement;
    expect(within(fin).getByRole('heading', { level: 2 }).textContent).toMatch(/Fin-Tube/);
    expect(fin.querySelector('.xr-section-head')).toHaveTextContent('0 students with access');
    expect(cells(within(fin).getByRole('table'))).toEqual([['WEBWEB', '0', '0', '0']]);

    await user.click(within(viewSwitch()).getByRole('button', { name: 'By course' }));
    const table = screen.getByRole('table', { name: 'Usage by course' });
    expect(cells(table)).toEqual([
      [
        'Thermodynamics & Heat TransferME ZG523',
        '2',
        'Shown per experiment',
        'Shown per experiment',
      ],
    ]);
  });
});

// ---- f2: no activity yet -------------------------------------------------------------------------

describe('IA-20 — no activity yet (B3-10 f2)', () => {
  it('before any student opens a format: the empty state and its one way on', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    showUsage(runtime);
    expect(await screen.findByRole('heading', { level: 2, name: 'No activity yet' })).toBeVisible();
    expect(main().querySelector('.xr-empty')).toHaveTextContent(
      'Figures appear when students open the experiments you’ve given them.',
    );
    expect(screen.getByRole('link', { name: 'Open Student access' })).toHaveAttribute(
      'href',
      '/institute/student-access',
    );
    expect(screen.getByRole('link', { name: 'Open Student access' })).toHaveClass(
      'xr-btn',
      'xr-btn--secondary',
    );
    // f2 draws neither the view switch nor the definitions; the meta keeps its date.
    expect(screen.queryByRole('group', { name: 'View' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'What the figures mean' })).toBeNull();
    expect(meta()).toHaveTextContent('figures up to 12 Oct 2026');
  });

  it('`?view=course` with no activity: still the empty state', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const { navigation } = showUsage(runtime, '?view=course');
    expect(await screen.findByRole('heading', { level: 2, name: 'No activity yet' })).toBeVisible();
    expect(screen.queryByRole('table')).toBeNull();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('a paused institution’s Institute Admin reads the page as drawn', async () => {
    const { runtime } = await tabPlatform(PAUSED_INSTITUTE_ADMIN, 'after-flow-b');
    showUsage(runtime);
    expect(await screen.findByRole('heading', { level: 2, name: 'No activity yet' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Open Student access' })).toBeVisible();
  });
});

// ---- The same record: runtime activity and completions move the figures --------------------------

describe('IA-20 — the figures follow the runtime’s reports in the same tab', () => {
  it('opened → started and a session; another session; a completion — per format, never summed', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    showUsage(runtime);
    await screen.findByRole('heading', { level: 2, name: 'No activity yet' });

    await report(sample, runtime, 'web', 'opened');
    const section = await experimentSection();
    const table = () => within(section).getByRole('table');
    await waitFor(() =>
      expect(cells(table())).toEqual([
        ['WEBWEB', '1', '0', '1'],
        ['VRVR', '0', '0', '0'],
      ]),
    );

    // A second WEB opening is a second session, not a second student started.
    await report(sample, runtime, 'web', 'opened');
    await waitFor(() => expect(cells(table())[0]).toEqual(['WEBWEB', '1', '0', '2']));

    // Completed comes only from the runtime's completion record (T-12).
    await report(sample, runtime, 'web', 'completed');
    await waitFor(() => expect(cells(table())[0]).toEqual(['WEBWEB', '1', '1', '2']));

    // VR is its own row: a headset session starts it; nothing is carried over from WEB.
    await report(sample, runtime, 'vr', 'session');
    await waitFor(() =>
      expect(cells(table())).toEqual([
        ['WEBWEB', '1', '1', '2'],
        ['VRVR', '1', '0', '1'],
      ]),
    );
  });
});

// ---- Undrawn: loading and failed ---------------------------------------------------------------

describe('IA-20 — loading and failed (undrawn; state-copy IA-20.loading, IA-20.failed)', () => {
  it('announces loading; a failed read has Try again, which reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-c');
    faults(sample).failNext('OperationsService.getUsage');
    // The page alone (the workspace frame first waits for the session with its own "Loading …").
    renderInTab(<Usage />, { runtime, navigation: testNavigation('/institute/usage') });
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      'Loading usage',
    );
    expect(meta()).toHaveTextContent(/^How your content is being used$/);
    expect(
      await screen.findByRole('heading', { level: 2, name: 'We couldn’t load usage' }),
    ).toBeVisible();
    expect(document.querySelector('.xr-empty')).toHaveTextContent(
      'Nothing has changed. Try again.',
    );
    expect(meta()).toHaveTextContent(/^How your content is being used$/);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await experimentSection()).toBeVisible();
  });

  it('the course and plan facts failing fail the page too', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-c');
    faults(sample).failNext('InstitutionService.listContentAccess');
    showUsage(runtime);
    expect(
      await screen.findByRole('heading', { level: 2, name: 'We couldn’t load usage' }),
    ).toBeVisible();
  });
});

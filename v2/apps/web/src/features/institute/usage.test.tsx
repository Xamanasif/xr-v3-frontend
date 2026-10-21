/**
 * IA-20 Usage in the V3 design (the owner-approved export design/v3-refined-b/roles/IA-v1,
 * `Main.dc.html` IA-20 and `vm20`) on the real composition root and the sample world: the figures
 * per experiment × format as `OperationsService.getUsage` answers them, by course (`?view=course`),
 * each experiment's own "No activity yet", the paused and ended notices, the undrawn loading and
 * failed states, and the figures moving when the runtime's own reports (the stand-ins, as the CI
 * seam writes them) record activity or a completion in the same tab. Nothing is ever summed; no
 * feedback, export, licence figure or internal reference is shown.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AccessPlan, ExperimentId, IsoInstant, PersonId } from '@xr/domain';
import { faults, fixtureWorld, setSampleNow, standinsOf } from '@xr/sample-platform/testing';
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
const COURSE_CAPTION = /^Usage by course\. /;

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
const meta = () => document.querySelector('.rk-head .rk-sub');
const viewSwitch = () => screen.getByRole('group', { name: 'View usage' });

/** An internal reference (the owner's identifier rule, 21 Oct 2026). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC)-\d+/;

function expectNoReferences(): void {
  expect(document.body.textContent ?? '').not.toMatch(REFERENCE);
  for (const element of document.body.querySelectorAll('[aria-label], [title], [placeholder]')) {
    for (const name of ['aria-label', 'title', 'placeholder']) {
      expect(element.getAttribute(name) ?? '').not.toMatch(REFERENCE);
    }
  }
  expect(document.title).not.toMatch(REFERENCE);
}

/** A table's body rows as their cells' text, without the labels phones show (`ia-lt-lab`). */
function cells(table: HTMLElement): string[][] {
  return [...table.querySelectorAll('tbody tr')].map((row) =>
    [...row.querySelectorAll('td')].map((cell) => {
      const copy = cell.cloneNode(true) as HTMLElement;
      for (const label of copy.querySelectorAll('.ia-lt-lab')) label.remove();
      return copy.textContent ?? '';
    }),
  );
}

async function experimentSection(name = SHELL_NAME) {
  return screen.findByRole('region', { name }, { timeout: 5000 });
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

// ---- by experiment and format ----------------------------------------------------------------------

describe('IA-20 — by experiment and format (IA-v1 IA-20)', () => {
  it('the head, the view switch, the experiment’s figures per format and the definitions beside', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-c');
    showUsage(runtime);
    const section = await experimentSection();
    expect(screen.getByRole('heading', { level: 1, name: 'Usage' })).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    // The service's "figures up to" instant (the sample world's now, 27 Oct in Indian time).
    expect(meta()).toHaveTextContent('How your content is being used · figures up to 27 Oct 2026');
    // The shell: Usage current, the tab titled "Usage".
    await waitFor(() => expect(document.title).toMatch(/^Usage/));
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
    expect(viewSwitch()).toHaveClass('rb-switch');

    // The course code alone under the name (its plan's reference is left out).
    expect(section.querySelector('.ia-shead-sub')).toHaveTextContent(/^ME ZG523$/);
    // Rahul is the one Godavari student who can open it in this world.
    expect(section.querySelector('.ia-shead-n.ia-shead-key')).toHaveTextContent(
      '1 student with access',
    );
    const table = within(section).getByRole('table', {
      name: `Usage by format for ${SHELL_NAME}`,
    });
    expect(table).toHaveClass('ia-lt', 'ia-lt--stats');
    expect([...table.querySelectorAll('th')].map((header) => header.textContent)).toEqual([
      'Format',
      'Started',
      'Completed',
      'Sessions',
    ]);
    // WEB then VR (display order); his two completions are inside these per-format counts.
    expect(cells(table)).toEqual([
      ['WEBBrowser', '1', '1', '1'],
      ['VRVirtual reality', '1', '1', '1'],
    ]);
    expect(table.querySelector('td.ia-lt-main .ia-cell-line .xr-fmt')).toHaveTextContent('WEB');
    // On phones each figure carries its label above it (`ia-lt-lab`).
    expect(
      [...table.querySelectorAll('tbody tr:first-child td .ia-lt-lab')].map(
        (label) => label.textContent,
      ),
    ).toEqual(['Started', 'Completed', 'Sessions']);

    const definitions = screen.getByRole('region', { name: 'What the figures mean' });
    expect(definitions.closest('.ia-rec-side')).not.toBeNull();
    expect([...definitions.querySelectorAll('dt')].map((term) => term.textContent)).toEqual([
      'Students with access',
      'Started',
      'Completed',
      'Sessions',
    ]);
    expect(definitions.querySelectorAll('dd')).toHaveLength(4);
    expectNoReferences();
  });

  it('never a total, a feedback column, an export or a licence figure', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-c');
    showUsage(runtime);
    await experimentSection();
    const words = main().textContent ?? '';
    expect(words).not.toMatch(/total|feedback|export|download|licen[cs]e|%/i);
    // Rahul sent feedback on both formats in this world: none of it is read here (T-25).
    expect(words).not.toMatch(/rating|comment/i);
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

// ---- by course --------------------------------------------------------------------------------------

describe('IA-20 — by course (IA-v1 st-ia20-course)', () => {
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
    expect(screen.getByRole('region', { name: 'Usage by course' })).toBeVisible();
    const table = screen.getByRole('table', { name: COURSE_CAPTION });
    expect([...table.querySelectorAll('th')].map((header) => header.textContent)).toEqual([
      'Course',
      'Experiments given',
      'Students with access',
      'Sessions by format',
    ]);
    // Started and completed stay per format: the course row has none of them (never a verdict).
    expect(cells(table)).toEqual([
      ['Thermodynamics & Heat TransferME ZG523', '1', '1', 'WEB 1 · VR 1'],
    ]);
    expect(table.querySelector('td.ia-lt-main .ia-cell-sub')).toHaveTextContent('ME ZG523');
    expect(screen.queryByRole('region', { name: SHELL_NAME })).toBeNull();
    expect(screen.getByRole('region', { name: 'What the figures mean' })).toBeVisible();
    expectNoReferences();

    await user.click(
      within(viewSwitch()).getByRole('button', { name: 'By experiment and format' }),
    );
    expect(navigation.replace).toHaveBeenLastCalledWith('/institute/usage');
    expect(await experimentSection()).toBeVisible();
    expect(screen.queryByRole('table', { name: COURSE_CAPTION })).toBeNull();
  });

  it('`?view=course` opens on the course view', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-device');
    const { navigation } = showUsage(runtime, '?view=course');
    expect(await screen.findByRole('table', { name: COURSE_CAPTION })).toBeVisible();
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(meta()).toHaveTextContent('figures up to 24 Oct 2026');
  });

  it('a course with two experiments: two surfaces, and its course row adds nothing up', async () => {
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
    const sections = [...main().querySelectorAll('section.rk-surface')] as HTMLElement[];
    // Shell-and-Tube, Fin-Tube, then the definitions.
    expect(sections).toHaveLength(3);
    const fin = sections[1]!;
    expect(within(fin).getByRole('heading', { level: 2 }).textContent).toMatch(/Fin-Tube/);
    expect(fin.querySelector('.ia-shead-n')).toHaveTextContent('0 students with access');
    // No figure of it is above zero: its own "No activity yet".
    expect(within(fin).getByRole('heading', { level: 3, name: 'No activity yet' })).toBeVisible();
    expect(within(fin).queryByRole('table')).toBeNull();
    expect(within(sections[0]!).getByRole('table')).toBeVisible();

    await user.click(within(viewSwitch()).getByRole('button', { name: 'By course' }));
    const table = screen.getByRole('table', { name: COURSE_CAPTION });
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

// ---- no activity yet ---------------------------------------------------------------------------------

describe('IA-20 — no activity yet (IA-v1 st-ia20-empty)', () => {
  it('before any student opens a format: each experiment says so, with its one way on', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    showUsage(runtime);
    const section = await experimentSection();
    expect(
      within(section).getByRole('heading', { level: 3, name: 'No activity yet' }),
    ).toBeVisible();
    expect(section.querySelector('.rk-state')).toHaveTextContent(
      'Figures appear when students open the experiments you’ve given them.',
    );
    const open = within(section).getByRole('link', { name: 'Open Student access' });
    expect(open).toHaveAttribute('href', '/institute/student-access');
    expect(open).toHaveClass('rb-btn');
    expect(section.querySelector('.ia-shead-n')).toHaveTextContent('1 student with access');
    // The view switch and "What the figures mean" stay; the head line has no date yet.
    expect(viewSwitch()).toBeVisible();
    expect(screen.getByRole('region', { name: 'What the figures mean' })).toBeVisible();
    expect(meta()).toHaveTextContent(/^How your content is being used$/);
    expectNoReferences();
  });

  it('`?view=course` with no activity: the course row says so', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const { navigation } = showUsage(runtime, '?view=course');
    const table = await screen.findByRole('table', { name: COURSE_CAPTION });
    expect(cells(table)[0]![3]).toBe('No activity yet');
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('a paused institution: the paused notice, nobody counts as having access today', async () => {
    const { runtime } = await tabPlatform(PAUSED_INSTITUTE_ADMIN, 'after-flow-b');
    showUsage(runtime);
    const notice = await screen.findByText('Your institution’s access is paused');
    const box = notice.closest('.rk-notice')!;
    expect(box).toHaveClass('rk-notice--paused');
    expect(box).toHaveAttribute('role', 'status');
    expect(box).toHaveTextContent(
      'No student can open your experiments while the pause lasts, so nobody counts as having access today. Earlier activity stays in the figures.',
    );
    expect(
      screen.getAllByRole('heading', { level: 3, name: 'No activity yet' }).length,
    ).toBeGreaterThan(0);
    expectNoReferences();
  });

  it('every plan ended: the ended notice names the end date, not the plan', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-c');
    setSampleNow(sample, '2027-10-20T04:30:00.000Z' as IsoInstant);
    showUsage(runtime);
    const notice = await screen.findByText('Your access plan ended on 7 Oct 2027');
    expect(notice.closest('.rk-notice')).toHaveClass('rk-notice--off');
    expect(notice.closest('.rk-notice')).toHaveTextContent(
      'No student can open its experiments now, so nobody counts as having access today. Earlier activity stays in the figures.',
    );
    expectNoReferences();
  });
});

// ---- The same record: runtime activity and completions move the figures ------------------------------

describe('IA-20 — the figures follow the runtime’s reports in the same tab', () => {
  it('opened → started and a session; another session; a completion — per format, never summed', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    showUsage(runtime);
    const section = await experimentSection();
    await within(section).findByRole('heading', { level: 3, name: 'No activity yet' });

    await report(sample, runtime, 'web', 'opened');
    const table = () => within(section).getByRole('table');
    await waitFor(() =>
      expect(cells(table())).toEqual([
        ['WEBBrowser', '1', '0', '1'],
        ['VRVirtual reality', '0', '0', '0'],
      ]),
    );
    expect(meta()).toHaveTextContent(/· figures up to /);

    // A second WEB opening is a second session, not a second student started.
    await report(sample, runtime, 'web', 'opened');
    await waitFor(() => expect(cells(table())[0]).toEqual(['WEBBrowser', '1', '0', '2']));

    // Completed comes only from the runtime's completion record (T-12).
    await report(sample, runtime, 'web', 'completed');
    await waitFor(() => expect(cells(table())[0]).toEqual(['WEBBrowser', '1', '1', '2']));

    // VR is its own row: a headset session starts it; nothing is carried over from WEB.
    await report(sample, runtime, 'vr', 'session');
    await waitFor(() =>
      expect(cells(table())).toEqual([
        ['WEBBrowser', '1', '1', '2'],
        ['VRVirtual reality', '1', '0', '1'],
      ]),
    );
  });
});

// ---- Undrawn: loading and failed -------------------------------------------------------------------

describe('IA-20 — loading and failed (undrawn; state-copy IA-20.loading, IA-20.failed)', () => {
  it('announces loading; a failed read has Try again, which reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-c');
    faults(sample).failNext('OperationsService.getUsage');
    // The page alone (the workspace frame first waits for the session with its own "Loading …").
    renderInTab(<Usage />, { runtime, navigation: testNavigation('/institute/usage') });
    const loading = document.querySelector('.rk-loading-msg[role="status"]')!;
    expect(loading).toHaveTextContent('Loading usage');
    expect(loading.closest('section.rk-surface')).toHaveAttribute('aria-busy', 'true');
    expect(meta()).toHaveTextContent(/^How your content is being used$/);
    const failed = await screen.findByRole('heading', { level: 2, name: 'We couldn’t load usage' });
    expect(failed.closest('.rk-state')).toHaveAttribute('role', 'alert');
    expect(failed.closest('.rk-state')).toHaveTextContent('Nothing has changed. Try again.');
    expect(meta()).toHaveTextContent(/^How your content is being used$/);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Usage' })).toHaveFocus();
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

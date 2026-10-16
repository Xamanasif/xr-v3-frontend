/**
 * Package 2A, the Student's access, on the real composition root and the sample world: ST-01 Home
 * (B2-10), ST-02 My courses and ST-03 Course (B2-11), ST-05 Experiment hub (B2-12) and its ST-19
 * state (B2-11 f12, B2-12 f4; B2-13 f1–f4). Every course, experiment, format word and refusal is
 * the ports' answer for the signed-in Student; the cross-role effects — an Institute Admin's grant
 * withdrawn, a Super Admin's pause — go through the ports of the same one world.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { asPersonId, beginSession, faults } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import type { HomeRead } from '@/queries/student';
import type { PlatformRuntime } from '@/platform/runtime';
import {
  INACTIVE_STUDENT,
  renderInTab,
  SUPER_ADMIN,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { homeCard, hubFormatOrder, notAvailableKind, upNextItems } from './shared/student-view';
import { StudentHome } from './st-01-home/home';
import { MyCourses } from './st-02-my-courses/my-courses';
import { MyCourse } from './st-03-course/course';
import { ExperimentHub } from './st-05-experiment-hub/experiment-hub';

afterEach(() => {
  forgetLastAddress();
});

const RAHUL = 'per-0002';
const MEERA = 'per-0001';
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const THERMO = 'thermodynamics-heat-transfer';
const THERMO_NAME = 'Thermodynamics & Heat Transfer';
const HUB = `/student/experiments/${SHELL}`;
const COURSE = `/student/courses/${THERMO}`;

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function inStudent(runtime: PlatformRuntime, path: string, page: ReactNode) {
  const navigation = testNavigation(path);
  const view = renderInTab(
    <WorkspaceLayout workspace="student">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

const main = () => screen.getByRole('main');
const topTitle = () => document.querySelector('.xr-top-title');

/** Signs another person into this tab's one world (the CI seam), as the test-hook bridge does. */
async function signIn(sample: Sample, runtime: PlatformRuntime, personId: string) {
  beginSession(sample, personId);
  await act(async () => {
    await runtime.session.refresh();
  });
}

/** Meera withdraws Rahul's individual grant SACC-0310 through her own port (B2-04, B2-13 f0). */
async function meeraWithdrawsRahulsGrant(sample: Sample, runtime: PlatformRuntime) {
  await signIn(sample, runtime, MEERA);
  const grants = await runtime.ports.studentAccess.listGrants({ showWithdrawn: false });
  if (!grants.ok) throw new Error(`listGrants refused: ${grants.error.kind}`);
  const row = grants.value.find(
    (entry) => entry.grant.id === 'SACC-0310' && entry.student.id === RAHUL,
  );
  if (!row) throw new Error('SACC-0310 is not listed for Rahul');
  const withdrawn = await runtime.ports.studentAccess.withdrawGrant({
    grantId: row.grant.id,
    reason: 'Given individually by mistake.',
    expectedRev: row.grant.rev,
  });
  if (!withdrawn.ok) throw new Error(`withdraw refused: ${withdrawn.error.kind}`);
  await signIn(sample, runtime, RAHUL);
}

/** The Super Admin pauses Godavari through the port (B7-04), as XS-08's tests do. */
async function pauseGodavari(sample: Sample, runtime: PlatformRuntime) {
  const admin = asPersonId(sample, SUPER_ADMIN).institutions;
  const found = await admin.getInstitution('godavari' as never);
  if (!found.ok) throw new Error('getInstitution refused');
  const answer = await admin.pauseInstitution({
    institutionId: found.value.institution.id,
    reason: 'The institution asked us to pause access while it checks its student list.',
    expectedRev: found.value.institution.rev,
  });
  if (!answer.ok) throw new Error(`pause refused: ${answer.error.kind}`);
  await act(async () => {
    await runtime.invalidate(answer.changed);
  });
}

// ---- before access (after-setup, 8 Oct: Rahul is in People, nothing given) ---------------------

describe('before access — Rahul on after-setup (B2-10 f0, B2-11 f3, B2-11 f12; B2-13 f1–f3)', () => {
  it('ST-01: “Hello, Rahul” and one clear message with Help, nothing that leads nowhere', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-setup');
    inStudent(runtime, '/student', <StudentHome />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Hello, Rahul' })).toBeVisible();
    expect(main().querySelector('.xw-greet .xr-overline')).toHaveTextContent(
      'Godavari Institute of Technology',
    );
    const message = await screen.findByRole('heading', {
      level: 2,
      name: 'Your institution hasn’t given you access yet',
    });
    expect(message.closest('.xr-empty')).toHaveTextContent(
      'When it gives you an experiment, it appears here and in My courses.',
    );
    const links = within(main()).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Help', '/student/help'],
    ]);
    expect(main().querySelector('.xw-continue')).toBeNull();
    expect(topTitle()).toHaveTextContent('Home');
  });

  it('ST-02: no courses yet, with Help — and the tab strip (ST-04, Package 2B)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-setup');
    inStudent(runtime, '/student/courses', <MyCourses />);
    expect(await screen.findByRole('heading', { level: 1, name: 'My courses' })).toBeVisible();
    expect(main()).toHaveTextContent('Courses with experiments your institution has given you');
    const message = await screen.findByRole('heading', {
      name: 'Your institution hasn’t given you access yet',
    });
    expect(message.closest('.xr-empty')).toHaveTextContent(
      'Courses appear here when your institution gives you an experiment in them.',
    );
    expect(within(main()).getByRole('link', { name: 'Help' })).toHaveAttribute(
      'href',
      '/student/help',
    );
    // Package 2B: the "Courses · All experiments" strip (ST-04), Courses current.
    expect(
      within(main().querySelector<HTMLElement>('.xr-tabs')!).getByRole('link', {
        name: 'Courses',
      }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      within(main().querySelector<HTMLElement>('.xr-tabs')!).getByRole('link', {
        name: 'All experiments',
      }),
    ).toHaveAttribute('href', '/student/courses?tab=experiments');
  });

  it('ST-19: opening Shell-and-Tube reads “isn’t available”, named, with a way back', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-setup');
    inStudent(runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'This experiment isn’t available to you',
      }),
    ).toBeVisible();
    const message = main().querySelector('.xr-msg')!;
    expect(message.querySelector('p.xr-lead')).toHaveTextContent(
      'Your institution hasn’t given you Shell-and-Tube Heat Exchanger. Experiments you can open are in My courses.',
    );
    expect(within(main()).getByRole('link', { name: 'Back to My courses' })).toHaveAttribute(
      'href',
      '/student/courses',
    );
    expect(within(main()).getByRole('link', { name: 'Help' })).toHaveAttribute(
      'href',
      '/student/help',
    );
    expect(message.querySelector('.xr-msg-icon.xr-x-msg-icon--ok')).toBeNull();
    await waitFor(() => expect(topTitle()).toHaveTextContent('Not available'));
    expect(document.querySelector('.xr-crumbs')).toHaveTextContent('My courses');
  });

  it('ST-19: an unknown experiment is “not given” too, without revealing a name', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, '/student/experiments/no-such', <ExperimentHub experimentId="no-such" />);
    expect(
      await screen.findByRole('heading', { name: 'This experiment isn’t available to you' }),
    ).toBeVisible();
    expect(main()).toHaveTextContent(
      'Your institution hasn’t given you this experiment. Experiments you can open are in My courses.',
    );
  });
});

// ---- first time after the grant (after-flow-b: SACC-0310 given to Rahul) ----------------------

describe('after SACC-0310 — Rahul on after-flow-b (B2-10 f1, f9; B2-11 f0, f1, f11; B2-12 f0)', () => {
  it('ST-01: Start here names the experiment and its course; Up next is honestly empty', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, '/student', <StudentHome />);
    const card = await waitFor(() => {
      const found = main().querySelector<HTMLElement>('section.xw-continue');
      expect(found).not.toBeNull();
      return found!;
    });
    expect(card.querySelector('.xr-overline')).toHaveTextContent('Start here');
    expect(within(card).getByRole('heading', { level: 2 })).toHaveTextContent(SHELL_NAME);
    expect(card).toHaveAccessibleName(SHELL_NAME);
    const metas = [...card.querySelectorAll('.xw-continue-meta')].map((node) => node.textContent);
    // T-17: Godavari's own code MEC-523 is set (after-setup), so it is the code shown (B2-10 f9).
    expect(metas[0]).toBe(`MEC-523 · ${THERMO_NAME}`);
    expect(metas[1]).toBe('Available to you: WEBVR');
    expect([...card.querySelectorAll('.xr-fmt.xr-fmt--yours')].map((n) => n.textContent)).toEqual([
      'WEB',
      'VR',
    ]);
    expect(within(card).getByRole('link', { name: `Open ${SHELL_NAME}` })).toHaveAttribute(
      'href',
      HUB,
    );

    const upNext = screen.getByRole('region', { name: 'Up next' });
    expect(upNext).toHaveTextContent('Nothing else is waiting for you right now.');

    const courses = screen.getByRole('region', { name: 'My courses' });
    expect(courses.querySelector('.xr-row-title')).toHaveTextContent(THERMO_NAME);
    expect(courses.querySelector('.xr-row-sub')).toHaveTextContent(
      'MEC-523 · 1 experiment given to you · WEB and VR available',
    );
    expect(courses.querySelector('.xr-row-sub .xr-id')).toHaveTextContent('MEC-523');
    expect(
      within(courses).getByRole('link', { name: `Open course ${THERMO_NAME}` }),
    ).toHaveAttribute('href', COURSE);
    expect(within(courses).getByRole('link', { name: 'View all courses' })).toHaveAttribute(
      'href',
      '/student/courses',
    );
  });

  it('ST-02 → ST-03 → ST-05: the course, its given experiment, then the hub', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    const courses = inStudent(runtime, '/student/courses', <MyCourses />);
    const open = await screen.findByRole('link', { name: `Open course ${THERMO_NAME}` });
    expect(open).toHaveAttribute('href', COURSE);
    expect(main().querySelector('.xr-row-sub')).toHaveTextContent(
      'MEC-523 · 1 experiment given to you · WEB and VR available',
    );
    expect(main().querySelector('.xr-tabs')).toHaveTextContent('CoursesAll experiments');
    courses.view.unmount();

    const course = inStudent(runtime, COURSE, <MyCourse courseId={THERMO} />);
    expect(await screen.findByRole('heading', { level: 1, name: THERMO_NAME })).toBeVisible();
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', '/student/courses');
    expect(main().querySelector('.xr-phead .xr-overline')).toHaveTextContent('MEC-523');
    expect(main().querySelector('.xr-phead-meta')).toHaveTextContent('1 experiment given to you');
    const section = screen.getByRole('region', { name: 'Your experiments in this course' });
    const rows = section.querySelectorAll('.xw-erow');
    // Only the experiment given to him (B2-11 f1: Fin-Tube and Composite Wall are not listed).
    expect(rows).toHaveLength(1);
    const row = rows[0] as HTMLElement;
    expect(within(row).getByRole('heading', { level: 3 })).toHaveTextContent(SHELL_NAME);
    expect(row.querySelector('.xr-meta')).toHaveTextContent(`MEC-523 · ${THERMO_NAME}`);
    const lines = [...row.querySelectorAll('.xw-inherit')].map((node) => node.textContent);
    expect(lines).toEqual(['Available to you: WEBVR', 'WEB Not started · VR Not started']);
    expect(within(row).getByRole('link', { name: `Open ${SHELL_NAME}` })).toHaveAttribute(
      'href',
      HUB,
    );
    await waitFor(() => expect(topTitle()).toHaveTextContent(THERMO_NAME));
    course.view.unmount();

    inStudent(runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    expect(await screen.findByRole('heading', { level: 1, name: SHELL_NAME })).toBeVisible();
    const head = main().querySelector('.xw-hubhead')!;
    expect(head.querySelector('.xr-overline')).toHaveTextContent(`MEC-523 · ${THERMO_NAME}`);
    const formats = within(head as HTMLElement).getByRole('list', { name: 'Formats for you' });
    expect([...formats.querySelectorAll('li')].map((li) => [li.className, li.textContent])).toEqual(
      [
        ['', 'WEBAvailable to you'],
        ['', 'VRAvailable to you'],
        ['is-off', 'ARNot included for your institution'],
        ['is-off', 'MRNot available for this experiment'],
      ],
    );
    const cards = [...main().querySelectorAll('.xw-scard')].map((card) => card.textContent);
    expect(cards).toEqual([
      'Step 1 of 3Resources3 resources · none opened yet.Open resources',
      'Step 2 of 3SimulationWEB and VR are available to you. WEB not started · VR not started.Choose a format',
      'Step 3 of 3AssessmentYour faculty hasn’t set an assessment for this experiment yet.Nothing to do here yet.',
    ]);
    expect(main()).toHaveTextContent(
      'Suggested order: resources, then a simulation, then the assessment. Nothing is locked.',
    );
    const about = screen.getByRole('region', { name: 'About this experiment' });
    expect(about).toHaveTextContent(`CourseMEC-523 · ${THERMO_NAME}`);
    expect(about).toHaveTextContent('Engineering areaMechanical & Manufacturing');
    expect([...about.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      'WEB — laptop or desktop with a current web browser',
      'VR — supported VR headset',
    ]);
    const outcomes = screen.getByRole('region', { name: 'Learning outcomes' });
    expect(outcomes).toHaveTextContent('The same for every format.');
    expect(outcomes.querySelectorAll('li')).toHaveLength(2);
    // Phase 3: the tabs (the Assessment tab since Phase 4B, B4-11 f7), the Next step and the
    // cards' actions lead to the built tabs (`ST-05.unbuilt`; the hub's own tests:
    // learning-hub.test.tsx).
    expect([...main().querySelectorAll('.xw-hubtabs a')].map((tab) => tab.textContent)).toEqual([
      'Overview',
      'Resources',
      'Simulation',
      'Assessment',
      'Progress',
    ]);
    expect(main()).toHaveTextContent('Next step: open the resources');
    // No assessment is set yet (after Flow B): the tab is the only way to it.
    expect(
      within(main())
        .getAllByRole('link', { name: /Assessment/ })
        .map((link) => link.getAttribute('href')),
    ).toEqual([`${HUB}/assessment`]);
    await waitFor(() => expect(topTitle()).toHaveTextContent(SHELL_NAME));
    const crumbs = document.querySelector('.xr-crumbs')!;
    expect(within(crumbs as HTMLElement).getByRole('link', { name: 'MEC-523' })).toHaveAttribute(
      'href',
      COURSE,
    );
  });

  it('ST-03: a course that was not given (or does not exist) is the in-shell not-found', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, '/student/courses/heat-transfer-x', <MyCourse courseId="heat-transfer-x" />);
    expect(await screen.findByRole('heading', { level: 1, name: /can’t find/i })).toBeVisible();
  });
});

describe('a group grant — Priya Natarajan on the later sample (B2-13 f6, SACC-0311)', () => {
  it('ST-01: the same experiment and formats as Rahul, reached through her group', async () => {
    const { runtime } = await tabPlatform('per-0003', 'later-sample');
    inStudent(runtime, '/student', <StudentHome />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Hello, Priya' })).toBeVisible();
    const card = await waitFor(() => {
      const found = main().querySelector<HTMLElement>('section.xw-continue');
      expect(found).not.toBeNull();
      return found!;
    });
    expect(card.querySelector('.xr-overline')).toHaveTextContent('Start here');
    expect(within(card).getByRole('link', { name: `Open ${SHELL_NAME}` })).toHaveAttribute(
      'href',
      HUB,
    );
    expect(screen.getByRole('region', { name: 'My courses' })).toHaveTextContent(
      'MEC-523 · 1 experiment given to you · WEB and VR available',
    );
  });
});

describe('a licence wait — Fatima Begum on the later sample (B3-02 "Waiting for a licence"; PC-45)', () => {
  async function fatimaId(): Promise<string> {
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    const rows = await runtime.ports.people.listStudents({ search: 'Fatima Begum' });
    if (!rows.ok) throw new Error(rows.error.kind);
    return rows.value[0]!.student.id;
  }

  it('ST-03 and ST-05 name the wait beside the formats she was given — no unqualified “can open”', async () => {
    const fatima = await fatimaId();
    const course = await tabPlatform(fatima, 'later-sample');
    const courseView = inStudent(course.runtime, COURSE, <MyCourse courseId={THERMO} />);
    expect(
      await screen.findByText(
        /No licence is available for you on ACC-0107 right now\./,
        undefined,
        {
          timeout: 5000,
        },
      ),
    ).toBeVisible();
    expect(main()).not.toHaveTextContent('Available to you');
    courseView.view.unmount();
    const hub = await tabPlatform(fatima, 'later-sample');
    inStudent(hub.runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    expect(await screen.findByRole('heading', { level: 1, name: SHELL_NAME })).toBeVisible();
    expect(main()).toHaveTextContent('No licence is available for you on ACC-0107 right now.');
  }, 30_000);
});

// ---- the cross-role effect: Meera withdraws the grant (B2-13 f0 → f1–f3) -----------------------

describe('Meera withdraws SACC-0310 — the same world, the Student’s next read (B2-12 f4, B2-13 f3)', () => {
  it('the hub that opened becomes “no longer given”', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    expect(await screen.findByRole('heading', { level: 1, name: SHELL_NAME })).toBeVisible();

    await meeraWithdrawsRahulsGrant(sample, runtime);

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'This experiment is no longer given to you',
      }),
    ).toBeVisible();
    expect(main().querySelector('.xr-msg p.xr-lead')).toHaveTextContent(
      'Your institution no longer gives you Shell-and-Tube Heat Exchanger. Your work is kept.',
    );
    expect(within(main()).getByRole('link', { name: 'Back to My courses' })).toHaveAttribute(
      'href',
      '/student/courses',
    );
    await waitFor(() => expect(topTitle()).toHaveTextContent('Not available'));
  });

  it('with no work recorded, Home and My courses read as before access (SACC-14: no row, no words)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await meeraWithdrawsRahulsGrant(sample, runtime);
    const home = inStudent(runtime, '/student', <StudentHome />);
    expect(
      await screen.findByRole('heading', { name: 'Your institution hasn’t given you access yet' }),
    ).toBeVisible();
    home.view.unmount();
    inStudent(runtime, '/student/courses', <MyCourses />);
    expect(
      await screen.findByRole('heading', { name: 'Your institution hasn’t given you access yet' }),
    ).toBeVisible();
  });

  it('after some work, Home and My courses keep it as earlier work (B2-11 f7, course by course)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    await meeraWithdrawsRahulsGrant(sample, runtime);
    const home = inStudent(runtime, '/student', <StudentHome />);
    const message = await screen.findByRole('heading', {
      level: 2,
      name: 'No experiments are given to you right now',
    });
    expect(message.closest('.xr-empty')).toHaveTextContent('Your earlier work is kept.');
    const courses = screen.getByRole('region', { name: 'My courses' });
    expect(courses.querySelector('.xr-row-sub')).toHaveTextContent('MEC-523 · earlier work kept');
    expect(within(courses).queryByRole('link')).toBeNull();
    expect(main()).not.toHaveTextContent('See earlier work');
    home.view.unmount();

    inStudent(runtime, '/student/courses', <MyCourses />);
    const empty = await screen.findByRole('heading', {
      name: 'No experiments are given to you right now',
    });
    expect(empty.closest('.xr-empty')).toHaveTextContent('Your earlier work is kept below.');
    const earlier = screen.getByRole('region', { name: 'Earlier work' });
    expect(earlier.querySelector('.xr-row-title')).toHaveTextContent(THERMO_NAME);
    expect(within(earlier).queryByRole('link')).toBeNull();
    expect(main()).not.toHaveTextContent('View earlier work');
  });

  it('an undecided overlap (later sample, a group grant remains) makes no can / can’t claim', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'later-sample');
    await meeraWithdrawsRahulsGrant(sample, runtime);
    const hub = inStudent(runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Your access to this experiment hasn’t been settled yet',
      }),
    ).toBeVisible();
    expect(main()).not.toHaveTextContent(/no longer given|isn’t available/);
    hub.view.unmount();
    inStudent(runtime, COURSE, <MyCourse courseId={THERMO} />);
    const row = await waitFor(() => {
      const found = main().querySelector<HTMLElement>('.xw-erow');
      expect(found).not.toBeNull();
      return found!;
    });
    expect(row).toHaveTextContent('Your access to this experiment hasn’t been settled yet.');
    expect(within(row).queryByRole('link')).toBeNull();
    expect(row.querySelector('.xr-fmt')).toBeNull();
  });
});

// ---- inactive and paused (B2-10 f6, f7; B2-11 f5, f6; B2-12 f3; B2-13 f4) ----------------------

describe('an inactive Student — Sneha Reddy (B2-10 f7)', () => {
  it('ST-01: “Your account is inactive”, and no course section', async () => {
    const { runtime } = await tabPlatform(INACTIVE_STUDENT, 'later-sample');
    inStudent(runtime, '/student', <StudentHome />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Hello, Sneha' })).toBeVisible();
    const message = await screen.findByRole('heading', {
      level: 2,
      name: 'Your account is inactive',
    });
    expect(message.closest('.xr-empty')).toHaveTextContent(
      'You can’t open experiments until your institution reactivates your account. Your work is kept.',
    );
    expect(screen.queryByRole('region', { name: 'My courses' })).toBeNull();
    expect(main().querySelector('.xw-continue')).toBeNull();
  });
});

describe('a paused institution — the Super Admin pauses Godavari (B2-10 f6, B2-11 f5, f6, B2-12 f3)', () => {
  it('ST-01 and ST-02: “You can’t open experiments right now”; the course reads paused', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await pauseGodavari(sample, runtime);
    const home = inStudent(runtime, '/student', <StudentHome />);
    const message = await screen.findByRole('heading', {
      level: 2,
      name: 'You can’t open experiments right now',
    });
    expect(message.closest('.xr-empty')).toHaveTextContent(
      'Your institution’s access is paused. Your work is kept, and you can continue when it’s lifted.',
    );
    const courses = screen.getByRole('region', { name: 'My courses' });
    expect(courses.querySelector('.xr-row-sub')).toHaveTextContent(
      'MEC-523 · Paused — your institution’s access is paused',
    );
    expect(within(courses).getByRole('link', { name: `Open course ${THERMO_NAME}` })).toBeVisible();
    expect(within(courses).queryByRole('link', { name: 'View all courses' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Up next' })).toBeNull();
    home.view.unmount();

    inStudent(runtime, '/student/courses', <MyCourses />);
    await waitFor(() =>
      expect(main().querySelector('.xr-row-sub')).toHaveTextContent(
        'MEC-523 · Paused — your institution’s access is paused',
      ),
    );
  });

  it('ST-03 and ST-05: paused status, the notice, every given format paused, no way to open', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await pauseGodavari(sample, runtime);
    const course = inStudent(runtime, COURSE, <MyCourse courseId={THERMO} />);
    expect(await screen.findByRole('heading', { level: 1, name: THERMO_NAME })).toBeVisible();
    expect(main().querySelector('.xr-phead-meta .xr-status--paused')).toHaveTextContent('Paused');
    const notice = main().querySelector('.xr-notice--warn')!;
    expect(notice).toHaveTextContent(
      'Your institution’s access is pausedYou can’t open experiments right now. Your work is kept.',
    );
    const row = main().querySelector<HTMLElement>('.xw-erow')!;
    expect([...row.querySelectorAll('.xr-fmt--off')].map((n) => n.textContent)).toEqual([
      'WEB',
      'VR',
    ]);
    expect(row).toHaveTextContent(
      'Paused — your institution’s access is paused. Your work is kept.',
    );
    expect(within(row).queryByRole('link')).toBeNull();
    course.view.unmount();

    inStudent(runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    expect(await screen.findByRole('heading', { level: 1, name: SHELL_NAME })).toBeVisible();
    const formats = screen.getByRole('list', { name: 'Formats for you' });
    expect([...formats.querySelectorAll('li')].map((li) => [li.className, li.textContent])).toEqual(
      [
        ['is-off', 'WEBPaused'],
        ['is-off', 'VRPaused'],
        ['is-off', 'ARNot included for your institution'],
        ['is-off', 'MRNot available for this experiment'],
      ],
    );
    const cards = [...main().querySelectorAll('.xw-scard')].map((card) => card.textContent);
    expect(cards[0]).toBe(
      'Step 1 of 3ResourcesNot available while your institution’s access is paused.Nothing to do here yet.',
    );
    expect(cards[1]).toBe(
      'Step 2 of 3SimulationNot available while your institution’s access is paused. Your progress is kept.Nothing to do here yet.',
    );
  });
});

// ---- later samples: continue where you left off (B2-10 f4), loading and failed (B2-11 f9, f10) --

describe('continue, loading and failed', () => {
  it('ST-01: “Continue where you left off” names each given format’s own progress', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    inStudent(runtime, '/student', <StudentHome />);
    const card = await waitFor(() => {
      const found = main().querySelector<HTMLElement>('section.xw-continue');
      expect(found).not.toBeNull();
      return found!;
    });
    expect(card.querySelector('.xr-overline')).toHaveTextContent('Continue where you left off');
    expect(card.querySelector('.xw-inherit')).toHaveTextContent('WEB Completed · VR Completed');
    expect(card).not.toHaveTextContent('%');
    expect(within(card).getByRole('link', { name: `Continue ${SHELL_NAME}` })).toHaveAttribute(
      'href',
      HUB,
    );
  });

  it('ST-02: loading is announced, a failure says nothing changed, “Try again” reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    faults(sample).failNext('StudentAccessService.listMyCourses');
    inStudent(runtime, '/student/courses', <MyCourses />);
    expect(await screen.findByText('Loading your courses')).toHaveAttribute('role', 'status');
    const failed = await screen.findByRole('heading', { name: 'We couldn’t load your courses' });
    expect(failed.closest('.xr-empty')).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('link', { name: `Open course ${THERMO_NAME}` })).toBeVisible();
    expect(document.activeElement).toBe(main());
  });
});

// ---- the view helpers on the service's own answers ---------------------------------------------

describe('view helpers', () => {
  it('Start here leaves the card’s own formats out of Up next; another experiment’s stay', () => {
    const shell = {
      experimentId: SHELL,
      name: SHELL_NAME,
      formats: [
        { format: 'web', availability: 'available-to-you', progress: 'not-started' },
        { format: 'vr', availability: 'available-to-you', progress: 'not-started' },
      ],
    } as const;
    const fin = { ...shell, experimentId: 'fin-tube', name: 'Fin-Tube Bundle' } as const;
    const course = {
      courseId: THERMO,
      name: THERMO_NAME,
      codeShown: 'ME ZG523',
      experimentsGiven: 2,
      formatsAvailable: ['web', 'vr'],
      earlierWork: false,
    } as const;
    const read = {
      home: {
        continue: null,
        upNext: [
          { kind: 'format', experimentId: SHELL, format: 'web' },
          { kind: 'format', experimentId: SHELL, format: 'vr' },
          { kind: 'format', experimentId: 'fin-tube', format: 'vr' },
          { kind: 'assessment', assessmentId: 'ASMT-0009' },
          { kind: 'feedback', experimentId: SHELL, format: 'web' },
        ],
        myCourses: [course],
        noAccessYet: false,
      },
      courses: [{ course, experiments: [shell, fin] }],
      assessmentExperiments: { 'ASMT-0009': SHELL_NAME },
    } as unknown as HomeRead;
    const card = homeCard(read);
    expect(card).toMatchObject({ kind: 'start', experiment: { experimentId: SHELL } });
    expect(upNextItems(read, card)).toEqual([
      {
        kind: 'format',
        experimentId: 'fin-tube',
        experimentName: 'Fin-Tube Bundle',
        format: 'vr',
        progress: 'not-started',
      },
      { kind: 'assessment', assessmentId: 'ASMT-0009', experimentName: SHELL_NAME },
      { kind: 'feedback', experimentId: SHELL, experimentName: SHELL_NAME, format: 'web' },
    ]);
  });

  it('orders the hub’s formats given first, and maps refusals to ST-19', () => {
    const row = {
      experimentId: SHELL,
      name: SHELL_NAME,
      formats: [
        { format: 'web', availability: 'available-to-you', progress: 'not-started' },
        {
          format: 'ar',
          availability: 'not-included-for-your-institution',
          progress: 'not-started',
        },
        { format: 'vr', availability: 'not-available-right-now', progress: 'not-started' },
        {
          format: 'mr',
          availability: 'not-available-for-this-experiment',
          progress: 'not-started',
        },
      ],
    } as const;
    expect(hubFormatOrder(row as never).map((entry) => entry.format)).toEqual([
      'web',
      'vr',
      'ar',
      'mr',
    ]);
    expect(notAvailableKind({ kind: 'refused', code: 'not-given' })).toBe('not-given');
    expect(notAvailableKind({ kind: 'policy-open', decision: 'SACC-14' })).toBe('no-longer-given');
    expect(notAvailableKind({ kind: 'policy-open', decision: 'OD-B2-01' })).toBe('undecided');
    expect(notAvailableKind({ kind: 'refused', code: 'access-ended' })).toBe('access-ended');
    expect(notAvailableKind({ kind: 'not-found' })).toBeNull();
  });
});

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
/** The browser tab's title (the V3 shell has no top title: the page names the tab). */
const tabTitle = () => document.title;
/** Student words never carry an internal record reference (lead decision 3). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT)-\d+/;

function expectNoReferences() {
  expect(main().textContent ?? '').not.toMatch(REFERENCE);
  for (const element of main().querySelectorAll('[aria-label]')) {
    expect(element.getAttribute('aria-label')).not.toMatch(REFERENCE);
  }
  expect(document.title).not.toMatch(REFERENCE);
}

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
  it('ST-01: “Hello, Rahul” and one clear message with Help & support, nothing that leads nowhere', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-setup');
    inStudent(runtime, '/student', <StudentHome />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Hello, Rahul' })).toBeVisible();
    expect(main().querySelector('.rk-head .rk-eyebrow')).toHaveTextContent(
      'Godavari Institute of Technology',
    );
    const message = await screen.findByRole('heading', {
      level: 2,
      name: 'Your institution hasn’t given you access yet',
    });
    const card = message.closest<HTMLElement>('section.sv-msg')!;
    expect(card).toHaveAccessibleName('Your institution hasn’t given you access yet');
    expect(card).toHaveTextContent(
      'When it gives you an experiment, it appears here and in My courses.',
    );
    // The export's "How it works" (`homeVM` before access): three numbered steps.
    const how = within(card).getByRole('list', { name: 'How it works' });
    expect([...how.querySelectorAll('.sv-how-t')].map((step) => step.textContent)).toEqual([
      'Your institution gives you an experiment, with the formats you can use.',
      'Read its resources, then run a simulation. Nothing is locked.',
      'Answer the assessment when your faculty sets one.',
    ]);
    const links = within(main()).getAllByRole('link');
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Help & support', '/student/help'],
    ]);
    expect(main().querySelector('.sv-home')).toBeNull();
    await waitFor(() => expect(tabTitle()).toBe('Home · XR Learning Platform'));
    expectNoReferences();
  });

  it('ST-02: no courses yet, with Help & support — and the tab strip (ST-04, Package 2B)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-setup');
    inStudent(runtime, '/student/courses', <MyCourses />);
    expect(await screen.findByRole('heading', { level: 1, name: 'My courses' })).toBeVisible();
    expect(main().querySelector('.rk-head .rk-sub')).toHaveTextContent(
      'Courses with experiments your institution has given you',
    );
    const message = await screen.findByRole('heading', {
      name: 'Your institution hasn’t given you access yet',
    });
    expect(message.closest('section.sv-msg')).toHaveTextContent(
      'Courses appear here when your institution gives you an experiment in them.',
    );
    expect(within(main()).getByRole('link', { name: 'Help & support' })).toHaveAttribute(
      'href',
      '/student/help',
    );
    // Package 2B: the "Courses · All experiments" strip (ST-04), Courses current.
    const tabs = screen.getByRole('navigation', { name: 'My courses' });
    expect(tabs).toHaveClass('rk-tabs');
    expect(within(tabs).getByRole('link', { name: 'Courses' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(tabs).getByRole('link', { name: 'All experiments' })).toHaveAttribute(
      'href',
      '/student/courses?tab=experiments',
    );
    expectNoReferences();
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
    // The export's compact refusal (`msg('notgiven')`): the experiment it is about, the H1, one
    // sentence — nothing given yet, so no "Experiments you can open" and the primary way back.
    const message = main().querySelector<HTMLElement>('section.sv-refuse')!;
    expect(message).toHaveAccessibleName('This experiment isn’t available to you');
    expect(message.querySelector('.sv-refuse-k')).toHaveTextContent(SHELL_NAME);
    expect(message.querySelector('p.sv-refuse-d')).toHaveTextContent(
      'Your institution hasn’t given you Shell-and-Tube Heat Exchanger. Experiments you can open are in My courses.',
    );
    expect(message.querySelector('.sv-refuse-alt')).toBeNull();
    expect(message.querySelector('.sv-refuse-ico')).toHaveClass('sv-refuse-ico--off');
    const back = within(main()).getByRole('link', { name: 'Back to My courses' });
    expect(back).toHaveAttribute('href', '/student/courses');
    expect(back).toHaveClass('rb-btn', 'rb-btn--primary', 'rb-btn--lg');
    expect(within(main()).getByRole('link', { name: 'Help & support' })).toHaveAttribute(
      'href',
      '/student/help',
    );
    await waitFor(() => expect(tabTitle()).toBe('Not available · XR Learning Platform'));
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(crumbs).getByRole('link', { name: 'My courses' })).toHaveAttribute(
      'href',
      '/student/courses',
    );
    expect(crumbs.querySelector('[aria-current="page"]')).toHaveTextContent('Not available');
    expectNoReferences();
  });

  it('ST-19: with experiments given, “not given” lists them to open instead (`msg` expAlt)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(
      runtime,
      '/student/experiments/fin-tube-bundle',
      <ExperimentHub experimentId="fin-tube-bundle" />,
    );
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'This experiment isn’t available to you',
      }),
    ).toBeVisible();
    const message = main().querySelector<HTMLElement>('section.sv-refuse')!;
    expect(message.querySelector('p.sv-refuse-d')).toHaveTextContent(
      /^Your institution hasn’t given you Fin-Tube Bundle\.$/,
    );
    const others = within(message).getByRole('list', { name: 'Experiments you can open' });
    expect(others).toHaveTextContent(`${SHELL_NAME}MEC-523 · ${THERMO_NAME}`);
    expect(
      within(others).getByRole('link', { name: `Open experiment ${SHELL_NAME}` }),
    ).toHaveAttribute('href', HUB);
    const back = within(message).getByRole('link', { name: 'Back to My courses' });
    expect(back).toHaveClass('rb-btn', 'rb-btn--lg');
    expect(back).not.toHaveClass('rb-btn--primary');
    expectNoReferences();
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
  it('ST-01: Start here names the experiment, its course and its one next step (the resources)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    inStudent(runtime, '/student', <StudentHome />);
    const cover = await screen.findByRole('region', { name: 'Start here' });
    const card = within(cover).getByRole('article', { name: SHELL_NAME });
    expect(within(card).getByRole('heading', { level: 3 })).toHaveTextContent(SHELL_NAME);
    // T-17: Godavari's own code MEC-523 is set (after-setup), so it is the code shown.
    expect(card.querySelector('.sv-now-course .rk-owncode')).toHaveTextContent('MEC-523');
    expect(within(card).getByRole('link', { name: `${THERMO_NAME}, open course` })).toHaveAttribute(
      'href',
      COURSE,
    );
    // The hub read (one more read on the Home) gives the description.
    expect(card.querySelector('.sv-now-d')?.textContent).toBeTruthy();
    for (const open of within(card).getAllByRole('link', {
      name: `Open experiment, ${SHELL_NAME}`,
    })) {
      expect(open).toHaveAttribute('href', HUB);
    }
    // Nothing opened yet: the next step is the resources (the export's `nextStep` "res").
    const step = card.querySelector<HTMLElement>('.sv-step.is-next')!;
    expect(step.querySelector('.sv-step-k')).toHaveTextContent('Your next step');
    expect(step.querySelector('.sv-step-t')).toHaveTextContent('Start with the resources');
    expect(step.querySelector('.sv-step-d')).toHaveTextContent('3 resources · none opened yet');
    const go = within(step).getByRole('link', { name: `Open resources, ${SHELL_NAME}` });
    expect(go).toHaveAttribute('href', `${HUB}/resources`);
    expect(go).toHaveClass('rb-btn', 'rb-btn--primary', 'rb-btn--lg');
    expect(card).not.toHaveTextContent(/stage/i);

    // The rest of the experiment: its formats (both given, not started) and its assessment.
    const also = screen.getByRole('region', { name: 'Also in this experiment' });
    const items = [...also.querySelectorAll('li')].map((li) => li.textContent);
    expect(items).toEqual([
      'WEBBrowserNot started',
      'VRVirtual realityNot started',
      'AssessmentNot set by your faculty yet',
    ]);
    expect(within(also).getByRole('link', { name: /Browser/ })).toHaveAttribute(
      'href',
      `${HUB}/simulation/web`,
    );
    expect(also.querySelectorAll('.sv-fmt--on')).toHaveLength(2);
    // An assessment not set yet is not a link.
    expect(within(also).queryByRole('link', { name: /Assessment/ })).toBeNull();

    const learning = screen.getByRole('region', { name: 'What you’re learning' });
    expect(learning).toHaveTextContent('The same in every format');
    expect(learning.querySelectorAll('ol.sv-outcomes > li')).toHaveLength(2);
    // No other experiment is waiting: no Up next column.
    expect(screen.queryByRole('heading', { name: 'Up next' })).toBeNull();
    expectNoReferences();
  });

  it('ST-02 → ST-03 → ST-05: the course, its given experiment, then the hub', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    const courses = inStudent(runtime, '/student/courses', <MyCourses />);
    const open = await screen.findByRole('link', { name: `Open course ${THERMO_NAME}` });
    expect(open).toHaveAttribute('href', COURSE);
    // The course as a section (`courseCard`): its code, name, count, then its experiments.
    const courseCard = screen.getByRole('region', { name: THERMO_NAME });
    expect(courseCard).toHaveClass('sv-card', 'sv-course');
    expect(courseCard.querySelector('.sv-course-k .rk-owncode')).toHaveTextContent('MEC-523');
    expect(courseCard.querySelector('.sv-course-m')).toHaveTextContent('1 experiment given to you');
    const given = within(courseCard).getByRole('list', {
      name: `Experiments given to you in ${THERMO_NAME}`,
    });
    expect(within(given).getByRole('heading', { level: 4 })).toHaveTextContent(SHELL_NAME);
    expect(
      within(given).getByRole('link', { name: `Open experiment ${SHELL_NAME}` }),
    ).toHaveAttribute('href', HUB);
    expect(screen.getByRole('navigation', { name: 'My courses' })).toHaveTextContent(
      'CoursesAll experiments',
    );
    courses.view.unmount();

    const course = inStudent(runtime, COURSE, <MyCourse courseId={THERMO} />);
    expect(await screen.findByRole('heading', { level: 1, name: THERMO_NAME })).toBeVisible();
    const courseCrumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(courseCrumbs).getByRole('link', { name: 'My courses' })).toHaveAttribute(
      'href',
      '/student/courses',
    );
    expect(courseCrumbs.querySelector('[aria-current="page"]')).toHaveTextContent(THERMO_NAME);
    expect(main().querySelector('.rk-head .st-eyecode')).toHaveTextContent('MEC-523Course');
    expect(main().querySelector('.rk-head .sv-head-meta')).toHaveTextContent(
      '1 experiment given to you',
    );
    const section = screen.getByRole('region', { name: 'Experiments given to you' });
    expect(section).toHaveTextContent('Only experiments given to you are listed');
    const rows = section.querySelectorAll('li.sv-xli');
    // Only the experiment given to him (Fin-Tube and Composite Wall are not listed).
    expect(rows).toHaveLength(1);
    const row = rows[0] as HTMLElement;
    expect(within(row).getByRole('heading', { level: 3 })).toHaveTextContent(SHELL_NAME);
    const rowFormats = within(row).getByRole('list', { name: `Your formats for ${SHELL_NAME}` });
    expect([...rowFormats.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      'WEBBrowser: Not started',
      'VRVirtual reality: Not started',
    ]);
    expect(rowFormats.querySelectorAll('.xr-fmt.sv-fmt--on')).toHaveLength(2);
    expect(
      within(row).getByRole('link', { name: `Open experiment ${SHELL_NAME}` }),
    ).toHaveAttribute('href', HUB);
    await waitFor(() => expect(tabTitle()).toBe(`${THERMO_NAME} · XR Learning Platform`));
    expectNoReferences();
    course.view.unmount();

    inStudent(runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    expect(await screen.findByRole('heading', { level: 1, name: SHELL_NAME })).toBeVisible();
    // V3 (ST-v1 `hubVM`, `overviewVM`; the hub's own tests: learning-hub.test.tsx): the head —
    // the course code shown and the course above the name — and the five section tabs.
    expect(main().querySelector('.rk-head .st-eyecode')).toHaveTextContent(`MEC-523${THERMO_NAME}`);
    expect(
      [
        ...screen.getByRole('navigation', { name: `${SHELL_NAME} sections` }).querySelectorAll('a'),
      ].map((tab) => tab.textContent),
    ).toEqual(['Overview', 'Resources', 'Simulation', 'Assessment', 'Progress']);
    // Your formats, each with its access, progress and one action; then those not available.
    const mine = await screen.findByRole('list', { name: 'Your formats' }, { timeout: 5000 });
    expect(
      [...mine.querySelectorAll(':scope > li')].map((li) => [
        li.querySelector('.sv-frow-t')?.textContent,
        li.querySelector('.xr-st')?.textContent,
        li.querySelector('a')?.textContent,
      ]),
    ).toEqual([
      ['Browser (WEB),  · Available to you', 'Not started', 'Open WEB'],
      ['Virtual reality (VR),  · Available to you', 'Not started', 'Open VR'],
    ]);
    expect(
      [...main().querySelectorAll('li.sv-xrow')].map((li) => li.querySelector('b')?.textContent),
    ).toEqual(['Augmented reality', 'Mixed reality']);
    // About, what you learn, and the one next step: the resources (nothing opened, nothing started).
    const about = screen.getByRole('region', { name: 'About this experiment' });
    expect(about).toHaveTextContent('Mechanical & Manufacturing');
    expect(about).toHaveTextContent('BITS course codeME ZG523');
    const outcomes = screen.getByRole('region', { name: 'What you’ll learn' });
    expect(outcomes).toHaveTextContent('The same in every format');
    expect(outcomes.querySelectorAll('li')).toHaveLength(2);
    const resources = screen.getByRole('region', { name: 'Learning resources' });
    expect(resources).toHaveTextContent('Next step');
    expect(resources).toHaveTextContent('None opened yet.');
    expect(within(resources).getByRole('link')).toHaveClass('rb-btn--primary');
    expect(main().querySelectorAll('.rb-btn--primary')).toHaveLength(1);
    // No assessment is set yet (after Flow B): the tab is the only way to it.
    expect(
      within(main())
        .getAllByRole('link', { name: /Assessment/ })
        .map((link) => link.getAttribute('href')),
    ).toEqual([`${HUB}/assessment`]);
    await waitFor(() => expect(tabTitle()).toBe(`${SHELL_NAME} · XR Learning Platform`));
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(crumbs).getByRole('link', { name: THERMO_NAME })).toHaveAttribute('href', COURSE);
    expectNoReferences();
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
    const cover = await screen.findByRole('region', { name: 'Start here' });
    const card = within(cover).getByRole('article', { name: SHELL_NAME });
    expect(card.querySelector('.sv-now-course')).toHaveTextContent(`MEC-523${THERMO_NAME}`);
    expect(
      within(card).getAllByRole('link', { name: `Open experiment, ${SHELL_NAME}` })[0],
    ).toHaveAttribute('href', HUB);
    const also = screen.getByRole('region', { name: 'Also in this experiment' });
    expect(also).toHaveTextContent('BrowserNot started');
    expect(also).toHaveTextContent('Virtual realityNot started');
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
    // The course's status and each given format read the wait (`courseVM`, `fmtStatus`: the
    // held chip with the clock) — named by content, never by the plan (lead decision 3).
    const pill = await screen.findByText(
      'Waiting for a licence',
      { selector: '.xr-st' },
      {
        timeout: 5000,
      },
    );
    expect(pill).toHaveClass('xr-st--warn');
    const row = main().querySelector<HTMLElement>('li.sv-xli')!;
    expect([...row.querySelectorAll('.sv-xli-f > li')].map((li) => li.textContent)).toEqual([
      'WEBBrowser: Waiting for a licence',
      'VRVirtual reality: Waiting for a licence',
    ]);
    expect(row.querySelectorAll('.sv-fmt--held')).toHaveLength(2);
    // The hub still opens (PC-45: it names the wait).
    expect(within(row).getByRole('link', { name: `Open experiment ${SHELL_NAME}` })).toBeVisible();
    expect(main()).not.toHaveTextContent('Available to you');
    expectNoReferences();
    courseView.view.unmount();
    const hub = await tabPlatform(fatima, 'later-sample');
    inStudent(hub.runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    expect(await screen.findByRole('heading', { level: 1, name: SHELL_NAME })).toBeVisible();
    // The head says the wait once, without the plan (lead decision 3); the formats read it too.
    expect(main().querySelector('.rk-head .rk-meta')).toHaveTextContent(
      'Waiting for a licenceYour institution can tell you more.',
    );
    const mine = await screen.findByRole('list', { name: 'Your formats' }, { timeout: 5000 });
    expect([...mine.querySelectorAll('.sv-frow-acc')].map((n) => n.textContent)).toEqual([
      'Waiting for a licence',
      'Waiting for a licence',
    ]);
    expect(within(mine).queryByRole('link')).toBeNull();
    expectNoReferences();
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
    const message = main().querySelector<HTMLElement>('section.sv-refuse')!;
    expect(message.querySelector('.sv-refuse-k')).toHaveTextContent(SHELL_NAME);
    expect(message.querySelector('p.sv-refuse-d')).toHaveTextContent(
      'Your institution no longer gives you Shell-and-Tube Heat Exchanger. Your work is kept.',
    );
    // SACC-14: no "Your work, as recorded" and no "See your earlier work" (no read holds them).
    expect(message.querySelector('.sv-refuse-alt')).toBeNull();
    expect(message).not.toHaveTextContent('See your earlier work');
    expect(within(main()).getByRole('link', { name: 'Back to My courses' })).toHaveAttribute(
      'href',
      '/student/courses',
    );
    await waitFor(() => expect(tabTitle()).toBe('Not available · XR Learning Platform'));
    expectNoReferences();
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
    expect(message.closest('section.sv-msg')).toHaveTextContent('Your earlier work is kept.');
    // The export's "See earlier work" opens My courses, where the course is kept (`homeVM`).
    expect(within(main()).getByRole('link', { name: 'See earlier work' })).toHaveAttribute(
      'href',
      '/student/courses',
    );
    expect(main().querySelector('.sv-home')).toBeNull();
    home.view.unmount();

    inStudent(runtime, '/student/courses', <MyCourses />);
    const earlier = await screen.findByRole('region', {
      name: 'No experiments are given to you right now',
    });
    expect(earlier).toHaveTextContent('Your earlier work is kept below.');
    const row = earlier.querySelector<HTMLElement>('li.sv-xli')!;
    expect(row.querySelector('.sv-li-k')).toHaveTextContent('MEC-523');
    expect(row.querySelector('.sv-li-t')).toHaveTextContent(THERMO_NAME);
    expect(row).toHaveTextContent('Your earlier work is kept.');
    expect(within(earlier).queryByRole('link')).toBeNull();
    // SACC-14: no earlier-work row in Progress, so no "View earlier work".
    expect(main()).not.toHaveTextContent('View earlier work');
    expectNoReferences();
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
      const found = main().querySelector<HTMLElement>('li.sv-xli');
      expect(found).not.toBeNull();
      return found!;
    });
    expect(row.querySelector('.sv-li-d')).toHaveTextContent(
      'Your access to this experiment hasn’t been settled yet.',
    );
    expect(within(row).queryByRole('link')).toBeNull();
    expect(row.querySelector('.xr-fmt')).toBeNull();
  });
});

// ---- inactive and paused (B2-10 f6, f7; B2-11 f5, f6; B2-12 f3; B2-13 f4) ----------------------

describe('an inactive Student — Sneha Reddy (B2-10 f7)', () => {
  it('ST-01: “You can’t open experiments right now” (the banner names the inactive account), no cover', async () => {
    const { runtime } = await tabPlatform(INACTIVE_STUDENT, 'later-sample');
    inStudent(runtime, '/student', <StudentHome />);
    expect(await screen.findByRole('heading', { level: 1, name: 'Hello, Sneha' })).toBeVisible();
    const message = await screen.findByRole('heading', {
      level: 2,
      name: 'You can’t open experiments right now',
    });
    const card = message.closest<HTMLElement>('section.sv-msg')!;
    expect(card).toHaveTextContent(
      'Your work is kept and will be here when your account is reactivated.',
    );
    expect(card.querySelector('.sv-msg-ico')).toHaveClass('sv-msg-ico--paused');
    expect(within(card).queryByRole('link')).toBeNull();
    expect(main().querySelector('.sv-home')).toBeNull();
    expectNoReferences();
  });
});

describe('a paused institution — the Super Admin pauses Godavari (B2-10 f6, B2-11 f5, f6, B2-12 f3)', () => {
  it('ST-01 and ST-02: “You can’t open experiments right now”; the course reads paused', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await pauseGodavari(sample, runtime);
    const home = inStudent(runtime, '/student', <StudentHome />);
    // The cover names the experiment (`homeVM` paused): the held step, no way in, the parts static.
    const cover = await screen.findByRole('region', { name: 'Your experiment' });
    const step = cover.querySelector<HTMLElement>('.sv-step.sv-step--held')!;
    expect(step.querySelector('.sv-step-t')).toHaveTextContent(
      'You can’t open experiments right now',
    );
    expect(step.querySelector('.sv-step-d')).toHaveTextContent(
      'You can carry on from where you left off when the pause is lifted.',
    );
    expect(step.querySelector('.sv-step-k')).toBeNull();
    expect(within(cover).queryByRole('link', { name: /Open experiment/ })).toBeNull();
    expect(within(cover).getByRole('link', { name: `${THERMO_NAME}, open course` })).toBeVisible();
    const parts = screen.getByRole('region', { name: 'In this experiment' });
    expect(within(parts).queryByRole('link')).toBeNull();
    expect(parts).toHaveTextContent('BrowserPaused');
    expect(parts.querySelectorAll('.sv-fmt--held')).toHaveLength(2);
    expect(screen.queryByRole('heading', { name: 'Up next' })).toBeNull();
    home.view.unmount();

    inStudent(runtime, '/student/courses', <MyCourses />);
    const course = await screen.findByRole('region', { name: THERMO_NAME });
    expect(course.querySelector('.sv-course-m .xr-st--paused')).toHaveTextContent('Paused');
    expect(within(course).getByRole('link', { name: `Open course ${THERMO_NAME}` })).toBeVisible();
    expect(within(course).queryByRole('link', { name: /Open experiment/ })).toBeNull();
  });

  it('ST-03 and ST-05: paused status, the notice, every given format paused, no way to open', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await pauseGodavari(sample, runtime);
    const course = inStudent(runtime, COURSE, <MyCourse courseId={THERMO} />);
    expect(await screen.findByRole('heading', { level: 1, name: THERMO_NAME })).toBeVisible();
    expect(main().querySelector('.sv-head-meta .xr-st--paused')).toHaveTextContent('Paused');
    // The shell's banner says the institution's access is paused (the export draws no notice).
    expect(document.querySelector('.rk-banner')).toHaveTextContent(/paused/);
    const row = main().querySelector<HTMLElement>('li.sv-xli')!;
    expect([...row.querySelectorAll('.sv-fmt--held')].map((n) => n.textContent)).toEqual([
      'WEB',
      'VR',
    ]);
    expect([...row.querySelectorAll('.sv-xli-ft')].map((n) => n.textContent)).toEqual([
      'Browser: Paused',
      'Virtual reality: Paused',
    ]);
    expect(within(row).queryByRole('link')).toBeNull();
    course.view.unmount();

    inStudent(runtime, HUB, <ExperimentHub experimentId={SHELL} />);
    expect(await screen.findByRole('heading', { level: 1, name: SHELL_NAME })).toBeVisible();
    const mine = await screen.findByRole('list', { name: 'Your formats' }, { timeout: 5000 });
    await waitFor(() =>
      expect([...mine.querySelectorAll('.sv-frow-acc')].map((n) => n.textContent)).toEqual([
        'Paused',
        'Paused',
      ]),
    );
    expect(mine.querySelectorAll('.sv-fmt--held')).toHaveLength(2);
    expect(within(mine).queryByRole('link')).toBeNull();
    expect(
      [...main().querySelectorAll('li.sv-xrow')].map(
        (li) => li.querySelector('.sv-xrow-r')?.textContent,
      ),
    ).toEqual([
      'Published for this experiment, not included in your institution’s access',
      'Not published for this experiment',
    ]);
    const resources = screen.getByRole('region', { name: 'Learning resources' });
    expect(resources).toHaveTextContent('They open again when the pause is lifted.');
    expect(within(resources).queryByRole('link')).toBeNull();
    expect(main()).not.toHaveTextContent('Next step');
  });
});

// ---- later samples: continue where you left off (B2-10 f4), loading and failed (B2-11 f9, f10) --

describe('continue, loading and failed', () => {
  it('ST-01: after both formats, the cover names each given format’s own progress and nothing waiting', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    inStudent(runtime, '/student', <StudentHome />);
    // Feedback sent on both and no assessment set: nothing waits (the export's `nextStep` "none").
    const cover = await screen.findByRole('region', { name: 'Your experiment' });
    const step = cover.querySelector<HTMLElement>('.sv-step')!;
    expect(step).not.toHaveClass('is-next');
    expect(step.querySelector('.sv-step-t')).toHaveTextContent(
      'Nothing else is waiting for you right now',
    );
    expect(step.querySelector('.sv-step-d')).toHaveTextContent(
      'Your work on each format is kept in Progress.',
    );
    const parts = screen.getByRole('region', { name: 'In this experiment' });
    expect([...parts.querySelectorAll('li')].map((li) => li.textContent)).toEqual([
      'Resources1 of 3 opened',
      'WEBBrowserCompleted',
      'VRVirtual realityCompleted',
      'AssessmentNot set by your faculty yet',
    ]);
    expect(parts).not.toHaveTextContent('%');
    expect(within(parts).getByRole('link', { name: /Resources/ })).toHaveAttribute(
      'href',
      `${HUB}/resources`,
    );
    for (const open of within(cover).getAllByRole('link', {
      name: `Open experiment, ${SHELL_NAME}`,
    })) {
      expect(open).toHaveAttribute('href', HUB);
    }
    expectNoReferences();
  });

  it('ST-02: loading is announced, a failure says nothing changed, “Try again” reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    faults(sample).failNext('StudentAccessService.listMyCourses');
    inStudent(runtime, '/student/courses', <MyCourses />);
    const loading = await screen.findByText('Loading your courses…');
    expect(loading).toHaveAttribute('role', 'status');
    expect(loading.closest('section.sv-loading')).toHaveAttribute('aria-busy', 'true');
    const failed = await screen.findByRole('heading', { name: 'We couldn’t load your courses' });
    const card = failed.closest<HTMLElement>('section.sv-msg')!;
    expect(card).toHaveAttribute('role', 'alert');
    expect(card).toHaveTextContent('Nothing has changed. Try again.');
    expect(card.querySelector('.sv-msg-ico')).toHaveClass('sv-msg-ico--err');
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

/**
 * ST-15 Progress and ST-16 Format feedback with its ST-17 Feedback sent state, in the owner-approved
 * V3 Student design (ST-v1 `StudentFinal.dc.html`: `progress`, `feedback`), with the ST-01 Up next
 * "Give feedback" they enable (B2-10 f5, home's), on the real composition root and the sample
 * world. Every word is the ports' answer for the signed-in Student: "In
 * progress" and "Completed" come only from the runtime's report and the system completion record
 * (the CI-only stand-in, as the test-hook bridge's `reportRuntime`), never from a page, a launch or
 * feedback; feedback is offered per format, from that format's own completion (BC5), and a sent
 * record is read-only.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ExperimentId, PersonId, Technology } from '@xr/domain';
import { asPersonId, beginSession, faults, standinsOf } from '@xr/sample-platform/testing';
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
import { StudentHome } from './st-01-home/home';
import { Progress } from './st-15-progress/progress';
import { FormatFeedback } from './st-16-feedback/format-feedback';

/**
 * Text as it reads: the export's no-break spaces that keep a date on one line (`nbd`) read as
 * spaces (in a string, or in each string of a row).
 */
function plain<T>(value: T): T {
  if (typeof value === 'string') return value.replace(/\u00a0/g, ' ') as T;
  if (Array.isArray(value)) return value.map((item: unknown) => plain(item)) as T;
  return value;
}

afterEach(() => {
  forgetLastAddress();
});

const RAHUL = 'per-0002';
const MEERA = 'per-0001';
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const THERMO_NAME = 'Thermodynamics & Heat Transfer';
const HUB = `/student/experiments/${SHELL}`;

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
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT)-\d+/;
const count = () => document.querySelector('main .sv-ptools-s [role="status"]')?.textContent;
const rows = () => [...document.querySelectorAll<HTMLElement>('main table.sv-ptable tbody tr')];
/** A format's table row, by its code (read in the row head: "Browser (WEB) Available to you"). */
const row = (code: string) =>
  rows().find((item) => item.querySelector('th')?.textContent?.includes(`(${code})`))!;
const facts = (code: string) =>
  [...row(code).querySelectorAll('.sv-pc-fact')].map((fact) => fact.textContent);
const offRows = () => [...document.querySelectorAll<HTMLElement>('main .sv-poff li')];
const assessmentLine = () => main().querySelector('.sv-pas')?.textContent;

/** Nothing the Student reads names a record by its internal reference (lead decision 3). */
function expectNoReference() {
  expect(main().textContent ?? '').not.toMatch(REFERENCE);
  for (const element of main().querySelectorAll('[aria-label], [title]')) {
    expect(element.getAttribute('aria-label') ?? '').not.toMatch(REFERENCE);
  }
  expect(document.title).not.toMatch(REFERENCE);
}

function progressPage(runtime: PlatformRuntime) {
  return inStudent(runtime, '/student/progress', <Progress />);
}

function feedbackPage(runtime: PlatformRuntime, format: string, experimentId = SHELL) {
  return inStudent(
    runtime,
    `/student/experiments/${experimentId}/feedback/${format}`,
    <FormatFeedback experimentId={experimentId} format={format} />,
  );
}

/**
 * The runtime's own report through the CI-only stand-in (`system:runtime-report`, sample
 * provenance) at the world's sample "now" — as the test-hook bridge's `reportRuntime` does; the
 * tab's reads are refreshed with the receipt.
 */
async function report(
  sample: Sample,
  runtime: PlatformRuntime,
  format: Technology,
  kind: 'opened' | 'saved' | 'session' | 'completed',
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
  if (!answer.ok) throw new Error(`runtime report refused: ${JSON.stringify(answer.error)}`);
  await act(async () => {
    await runtime.invalidate(answer.changed);
  });
}

async function signIn(sample: Sample, runtime: PlatformRuntime, personId: string) {
  beginSession(sample, personId);
  await act(async () => {
    await runtime.session.refresh();
  });
}

/** Meera withdraws Rahul's individual grant SACC-0310 through her own port (B2-04). */
async function meeraWithdrawsRahulsGrant(sample: Sample, runtime: PlatformRuntime) {
  await signIn(sample, runtime, MEERA);
  const grants = await runtime.ports.studentAccess.listGrants({ showWithdrawn: false });
  if (!grants.ok) throw new Error(`listGrants refused: ${grants.error.kind}`);
  const found = grants.value.find(
    (entry) => entry.grant.id === 'SACC-0310' && entry.student.id === RAHUL,
  )!;
  const withdrawn = await runtime.ports.studentAccess.withdrawGrant({
    grantId: found.grant.id,
    reason: 'Given individually by mistake.',
    expectedRev: found.grant.rev,
  });
  if (!withdrawn.ok) throw new Error(`withdraw refused: ${withdrawn.error.kind}`);
  await signIn(sample, runtime, RAHUL);
}

/** The Super Admin pauses Godavari through the port (B7-04). */
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
  await act(async () => {
    await runtime.session.refresh();
  });
}

// ---- ST-15 Progress (ST-v1 `progress`) ------------------------------------------------------------

describe('ST-15 Progress (ST-v1 `progress`, `progVM`, `progExp`)', () => {
  it('before access: “Nothing to show yet” with Help & support, no filters; Progress is current', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-setup');
    progressPage(runtime);
    expect(await screen.findByRole('heading', { level: 1, name: 'Progress' })).toBeVisible();
    const empty = await screen.findByRole('heading', { level: 2, name: 'Nothing to show yet' });
    expect(empty.closest('.sv-msg')).toHaveTextContent(
      'Your progress appears here when your institution gives you an experiment and you start a format.',
    );
    expect(within(main()).getByRole('link', { name: 'Help & support' })).toHaveAttribute(
      'href',
      '/student/help',
    );
    expect(document.querySelector('main .sv-ptools')).toBeNull();
    expect(main().querySelector('.rk-head .rk-sub')).toHaveTextContent(
      'What you’ve started and finished, format by format',
    );
    expect(main().querySelector('.rk-head .rb-eyebrow-date')?.textContent).toMatch(
      /^[A-Z][a-z]+day \d{1,2} [A-Z][a-z]+ 2026$/,
    );
    await waitFor(() => expect(document.title).toContain('Progress'));
    expect(
      screen
        .getByRole('navigation', { name: 'Student navigation' })
        .querySelector('[aria-current="page"]'),
    ).toHaveTextContent('Progress');
    expectNoReference();
  });

  it('first visit (after Flow B): one course group, one experiment, its formats “Not started”, the others not available', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    progressPage(runtime);
    await waitFor(() => expect(rows()).toHaveLength(2));
    const group = screen.getByRole('group', { name: THERMO_NAME });
    expect(group.querySelector('.sv-pgroup-h .rk-owncode')).toHaveTextContent('MEC-523');
    expect(group.querySelector('.sv-pgroup-d')).toHaveTextContent('1 experiment');
    const block = within(group).getByRole('article', { name: SHELL_NAME });
    expect(
      within(block).getByRole('link', { name: `Open experiment ${SHELL_NAME}` }),
    ).toHaveAttribute('href', HUB);
    expect(block.querySelector('.sv-pexp-g')).toHaveTextContent('Given by your institution');
    expect(block).not.toHaveTextContent('SACC-0310');
    expect(count()).toBe('1 experiment in 1 course');
    expect(row('WEB').querySelector('.sv-pc-acc')).toHaveTextContent('Available to you');
    expect(row('WEB').querySelector('.xr-st')).toHaveTextContent('Not started');
    expect(facts('WEB')).toEqual(['Not opened yet']);
    const openWeb = within(row('WEB')).getByRole('link', { name: `Open WEB, ${SHELL_NAME}` });
    expect(openWeb).toHaveAttribute('href', `${HUB}/simulation/web`);
    // One gold action on the page: the first "Open".
    expect(openWeb).toHaveClass('rb-btn--primary');
    expect(row('VR').querySelector('.xr-st')).toHaveTextContent('Not started');
    expect(facts('VR')).toEqual(['No headset session reported yet']);
    const openVr = within(row('VR')).getByRole('link', { name: `Open VR, ${SHELL_NAME}` });
    expect(openVr).toHaveAttribute('href', `${HUB}/simulation/vr`);
    expect(openVr).not.toHaveClass('rb-btn--primary');
    expect(main().querySelectorAll('.rb-btn--primary')).toHaveLength(1);
    expect(offRows().map((item) => item.textContent)).toEqual([
      'ARAugmented reality (AR),  · Published for this experiment, not included in your institution’s access',
      'MRMixed reality (MR),  · Not published for this experiment',
    ]);
    expect(assessmentLine()).toBe('AssessmentNot set by your faculty yet');
    // Opening a resource or pressing Launch writes no progress: nothing reads "In progress" (T-12).
    expect(rows().some((item) => item.textContent?.includes('In progress'))).toBe(false);
    expect(main()).not.toHaveTextContent('%');
    expectNoReference();
  });

  it('WEB in progress only from the runtime’s report: “Last saved …” and “Continue WEB”', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    progressPage(runtime);
    await waitFor(() => expect(rows()).toHaveLength(2));
    await report(sample, runtime, 'web', 'opened');
    await report(sample, runtime, 'web', 'saved');
    await waitFor(() =>
      expect(row('WEB').querySelector('.xr-st')).toHaveTextContent('In progress'),
    );
    expect(facts('WEB')).toHaveLength(2);
    expect(plain(facts('WEB')[0])).toMatch(/^First opened \d{1,2} [A-Z][a-z]{2} 2026, \d\d:\d\d$/);
    expect(plain(facts('WEB')[1])).toMatch(/^Last saved \d{1,2} [A-Z][a-z]{2} 2026, \d\d:\d\d$/);
    const go = within(row('WEB')).getByRole('link', { name: `Continue WEB, ${SHELL_NAME}` });
    expect(go).toHaveAttribute('href', `${HUB}/simulation/web`);
    // "Continue" beats "Open" for the page's one gold action.
    expect(go).toHaveClass('rb-btn--primary');
    expect(row('VR').querySelector('.xr-st')).toHaveTextContent('Not started');
    expect(within(main()).queryByRole('link', { name: /Give feedback/ })).toBeNull();
  });

  it('a headset format in progress reads its reported session and continues on its page', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    progressPage(runtime);
    await waitFor(() => expect(rows()).toHaveLength(2));
    await report(sample, runtime, 'vr', 'session');
    await waitFor(() => expect(row('VR').querySelector('.xr-st')).toHaveTextContent('In progress'));
    expect(plain(facts('VR')[0])).toMatch(/^First session reported \d{1,2} [A-Z][a-z]{2} 2026/);
    expect(
      within(row('VR')).getByRole('link', { name: `Continue VR, ${SHELL_NAME}` }),
    ).toHaveAttribute('href', `${HUB}/simulation/vr`);
    expect(row('WEB').querySelector('.xr-st')).toHaveTextContent('Not started');
  });

  it('WEB completed, VR not: feedback is offered on WEB only — VR has no entry (BC5)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    progressPage(runtime);
    await waitFor(() => expect(rows()).toHaveLength(2));
    await report(sample, runtime, 'web', 'opened');
    await report(sample, runtime, 'web', 'completed');
    await waitFor(() =>
      expect(row('WEB').querySelector('.xr-st')?.textContent).toMatch(/^Completed \d/),
    );
    expect(facts('WEB').at(-1)).toMatch(/^Reported by the simulation at \d\d:\d\d$/);
    const give = within(row('WEB')).getByRole('link', {
      name: `Give feedback on WEB, ${SHELL_NAME}`,
    });
    expect(give).toHaveAttribute('href', `${HUB}/feedback/web`);
    expect(row('VR').querySelector('.xr-st')).toHaveTextContent('Not started');
    expect(within(row('VR')).queryByRole('link', { name: /feedback/i })).toBeNull();
    // The service's per-format answer: WEB eligible from its own completion; VR is not.
    const web = await runtime.ports.feedback.getFeedbackState({
      experimentId: SHELL as ExperimentId,
      format: 'web',
    });
    const vr = await runtime.ports.feedback.getFeedbackState({
      experimentId: SHELL as ExperimentId,
      format: 'vr',
    });
    expect(web).toMatchObject({ ok: true, value: { state: 'eligible' } });
    expect(vr).toMatchObject({ ok: true, value: { state: 'not-eligible' } });
  });

  it('both completed, feedback sent (after Flow C): dated facts, “Feedback sent”, no action, no verdict', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    progressPage(runtime);
    await waitFor(() =>
      expect(row('VR').querySelector('.xr-st')).toHaveTextContent('Completed 20 Oct 2026'),
    );
    expect(row('WEB').querySelector('.xr-st')).toHaveTextContent('Completed 14 Oct 2026');
    expect(plain(facts('WEB'))).toEqual([
      'First opened 12 Oct 2026, 10:05',
      'Reported by the simulation at 15:30',
      'Feedback sent 14 Oct 2026',
    ]);
    expect(plain(facts('VR'))).toEqual([
      'First session reported 16 Oct 2026, 14:10',
      'Reported from the headset at 11:15',
      'Feedback sent 20 Oct 2026',
    ]);
    expect(main().querySelectorAll('table .rb-btn')).toHaveLength(0);
    expect(within(main()).queryByRole('link', { name: /Give feedback/ })).toBeNull();
    expect(assessmentLine()).toBe('AssessmentNot set by your faculty yet');
    // Per format only: no percentage, no aggregate "experiment completed", no course verdict.
    expect(main()).not.toHaveTextContent('%');
    expect(main().textContent).not.toMatch(/experiment completed|all formats|overall/i);
    expectNoReference();
  });

  it('filters apply at once: “Not started” matches nothing; chips, counts and Clear filters', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    progressPage(runtime);
    await waitFor(() => expect(count()).toBe('1 experiment in 1 course'));
    expect(screen.getByRole('search', { name: 'Filter your progress' })).toBeVisible();
    const status = screen.getByRole('combobox', { name: 'Status' });
    expect([...(status as HTMLSelectElement).options].map((option) => option.text)).toEqual([
      'All statuses',
      'In progress',
      'Completed',
      'Not started',
    ]);
    const course = screen.getByRole('combobox', { name: 'Course' });
    expect([...(course as HTMLSelectElement).options].map((option) => option.text)).toEqual([
      'All courses',
      `MEC-523 · ${THERMO_NAME}`,
    ]);
    await user.selectOptions(status, 'not-started');
    expect(count()).toBe('0 of 1 experiment');
    const none = main().querySelector('.sv-pstate')!;
    expect(none).toHaveTextContent('No experiments match these filters');
    expect(none).toHaveTextContent('Try a different status or course.');
    expect(screen.getByRole('button', { name: 'Remove filter Status: Not started' })).toBeVisible();
    await user.selectOptions(status, 'completed');
    expect(count()).toBe('1 of 1 experiment');
    // The table lists the formats with that status; "Not available to you" waits for no filter.
    expect(rows()).toHaveLength(2);
    expect(offRows()).toHaveLength(0);
    await user.selectOptions(course, 'thermodynamics-heat-transfer');
    expect(screen.getByRole('button', { name: 'Remove filter Course: MEC-523' })).toBeVisible();
    await user.selectOptions(status, 'in-progress');
    expect(count()).toBe('0 of 1 experiment');
    await user.click(
      within(main().querySelector('.sv-pstate') as HTMLElement).getByRole('button', {
        name: 'Clear filters',
      }),
    );
    expect(count()).toBe('1 experiment in 1 course');
    expect(status).toHaveValue('all');
    expect(status).toHaveFocus();
    expect(offRows()).toHaveLength(2);
  });

  it('institution paused: each format held “Paused” with its progress as it stands, no action', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await report(sample, runtime, 'web', 'opened');
    await report(sample, runtime, 'web', 'completed');
    await pauseGodavari(sample, runtime);
    progressPage(runtime);
    await waitFor(() => expect(row('WEB').querySelector('.sv-pc-acc')).toHaveTextContent('Paused'));
    expect(row('WEB').querySelector('.sv-fmt--held')).not.toBeNull();
    expect(plain(row('WEB').querySelector('.xr-st')?.textContent)).toMatch(
      /^Completed \d{1,2} [A-Z][a-z]{2} 2026$/,
    );
    expect(row('VR').querySelector('.sv-pc-acc')).toHaveTextContent('Paused');
    expect(row('VR').querySelector('.xr-st')).toHaveTextContent('Not started');
    // The pause is said once, by the banner: no hold note, no action, no "Open experiment".
    expect(main().querySelector('.sv-holdnote')).toBeNull();
    expect(
      within(main())
        .queryAllByRole('link')
        .filter((link) => !link.closest('.rk-banner'))
        .map((link) => link.textContent),
    ).toEqual([]);
  });

  it('only earlier work left: says so instead of “Nothing to show yet” (SACC-14 open)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    await meeraWithdrawsRahulsGrant(sample, runtime);
    progressPage(runtime);
    const heading = await screen.findByRole('heading', {
      level: 2,
      name: 'No experiments are given to you right now',
    });
    expect(heading.closest('.sv-msg')).toHaveTextContent('Your earlier work is kept.');
    expect(main()).not.toHaveTextContent('Nothing to show yet');
    expect(document.querySelector('main .sv-ptools')).toBeNull();
  });

  it('loading inside the surface, then failed with “Try again”, then the list', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    faults(sample).failNext('LearningService.getMyProgress');
    progressPage(runtime);
    const loading = await screen.findByText('Loading your progress…');
    expect(loading).toHaveAttribute('role', 'status');
    expect(loading.closest('.sv-pstate')).toHaveAttribute('aria-busy', 'true');
    const failed = await screen.findByRole('heading', {
      level: 3,
      name: 'We couldn’t load your progress',
    });
    expect(failed.closest('[role="alert"]')).toHaveTextContent('Nothing has changed. Try again.');
    expect(screen.getByRole('search', { name: 'Filter your progress' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(count()).toBe('1 experiment in 1 course'));
    expect(document.activeElement).toBe(main());
  });
});

// ---- ST-16 Format feedback / ST-17 Feedback sent (ST-v1 `feedback`) -------------------------------

const groups = () => screen.getAllByRole('group').filter((group) => group.matches('fieldset'));
const crumbs = () => screen.getByRole('navigation', { name: 'Breadcrumb' });

async function chooseRating(
  user: ReturnType<typeof userEvent.setup>,
  statement: number,
  rating: number,
) {
  await user.click(document.getElementById(`feedback-q${statement}-${rating}`)!);
}

describe('ST-16 Format feedback (ST-v1 `feedback`, `fbVM`)', () => {
  it('a format the address cannot name is not found', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    feedbackPage(runtime, 'xr');
    expect(await screen.findByRole('heading', { level: 1, name: /can’t find/i })).toBeVisible();
  });

  it('not open yet — VR given, not completed: the export’s refusal card, no form', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await report(sample, runtime, 'vr', 'session');
    feedbackPage(runtime, 'vr');
    const title = await screen.findByRole('heading', {
      level: 1,
      name: 'Feedback on VR isn’t open yet',
    });
    const card = title.closest('.sv-refuse')!;
    expect(card.querySelector('.sv-refuse-k')).toHaveTextContent(`${SHELL_NAME} · Feedback`);
    expect(card).toHaveTextContent(
      'You can give feedback on VR once VR is recorded as completed. Each format has its own feedback.',
    );
    expect(within(card as HTMLElement).getByRole('link', { name: 'Back to VR' })).toHaveAttribute(
      'href',
      `${HUB}/simulation/vr`,
    );
    expect(within(crumbs()).getByRole('link', { name: SHELL_NAME })).toHaveAttribute('href', HUB);
    expect(crumbs().querySelector('[aria-current="page"]')).toHaveTextContent('Feedback');
    expect(screen.queryByRole('button', { name: 'Submit feedback' })).toBeNull();
    expectNoReference();
  });

  it('a format not given (AR) stays the not-found: nothing is revealed', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    feedbackPage(runtime, 'ar');
    expect(await screen.findByRole('heading', { level: 1, name: /can’t find/i })).toBeVisible();
  });

  it('WEB completed opens WEB’s form only; VR stays not open (its own completion, BC5)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await report(sample, runtime, 'web', 'completed');
    const web = feedbackPage(runtime, 'web');
    expect(await screen.findByRole('heading', { level: 1, name: 'Feedback on WEB' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Submit feedback' })).toBeVisible();
    web.view.unmount();
    feedbackPage(runtime, 'vr');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Feedback on VR isn’t open yet' }),
    ).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Submit feedback' })).toBeNull();
  });

  it('the rating sheet as drawn: five statements on a 1–5 scale named once, comments, crumbs', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await report(sample, runtime, 'vr', 'session');
    await report(sample, runtime, 'vr', 'completed');
    feedbackPage(runtime, 'vr');
    const h1 = await screen.findByRole('heading', { level: 1, name: 'Feedback on VR' });
    expect(h1.closest('.rk-head')?.querySelector('.st-eyecode')).toHaveTextContent(
      `VR${SHELL_NAME}`,
    );
    expect(main()).toHaveTextContent(
      'Your feedback helps improve this experience. Rate all five statements; additional comments are optional.',
    );
    expect(screen.getByRole('region', { name: 'Feedback on VR' })).toHaveClass('sv-fb');
    expect(main().querySelector('.sv-lk-head')).toHaveTextContent('Rate each statement');
    expect(groups().map((group) => group.querySelector('legend')!.textContent)).toEqual([
      '1. This experience helped me understand the concept.',
      '2. The instructions were clear and easy to follow.',
      '3. The simulation was easy to use and interact with.',
      '4. This experience worked smoothly without technical issues.',
      '5. Overall, I was satisfied with this learning experience.',
    ]);
    const scale = groups()[0]!.querySelector('.sv-lk-opts')!;
    expect([...scale.querySelectorAll('label')].map((label) => label.textContent)).toEqual([
      '1Strongly disagree',
      '2Disagree',
      '3Neither agree nor disagree',
      '4Agree',
      '5Strongly agree',
    ]);
    expect(within(groups()[0]!).getByRole('radio', { name: 'Agree' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Additional comments (optional)' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      `${HUB}/simulation/vr`,
    );
    await waitFor(() => expect(document.title).toContain('Feedback on VR'));
    expect(within(crumbs()).getByRole('link', { name: SHELL_NAME })).toHaveAttribute('href', HUB);
    expect(within(crumbs()).getByRole('link', { name: 'VR' })).toHaveAttribute(
      'href',
      `${HUB}/simulation/vr`,
    );
    expect(crumbs().querySelector('[aria-current="page"]')).toHaveTextContent('Feedback');
    expectNoReference();
  });

  it('missing ratings: the service’s summary takes focus, links each statement’s radio, recounts', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await report(sample, runtime, 'web', 'completed');
    feedbackPage(runtime, 'web');
    await screen.findByRole('heading', { level: 1, name: 'Feedback on WEB' });
    await chooseRating(user, 1, 4);
    await chooseRating(user, 3, 5);
    await user.click(screen.getByRole('button', { name: 'Submit feedback' }));
    const summary = await screen.findByRole('alert');
    expect(summary).toHaveFocus();
    expect(summary.querySelector('.rk-errsum-t')).toHaveTextContent('3 ratings are missing');
    expect(
      within(summary)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([
      'Choose a rating for statement 2',
      'Choose a rating for statement 4',
      'Choose a rating for statement 5',
    ]);
    const second = groups()[1]!;
    expect(second).toHaveTextContent('Choose a rating for statement 2');
    expect(second).toHaveClass('is-invalid');
    expect(second).toHaveAttribute('aria-describedby', 'feedback-q2-e');
    expect(groups()[0]!.querySelector('.rk-ferr')).toBeNull();
    await user.click(
      within(summary).getByRole('link', { name: 'Choose a rating for statement 4' }),
    );
    expect(document.getElementById('feedback-q4-1')).toHaveFocus();
    await chooseRating(user, 2, 4);
    await chooseRating(user, 4, 3);
    expect(screen.getByRole('alert').querySelector('.rk-errsum-t')).toHaveTextContent(
      'One rating is missing',
    );
    expect(groups()[1]!.querySelector('.rk-ferr')).toBeNull();
    // Nothing was written.
    const state = await runtime.ports.feedback.getFeedbackState({
      experimentId: SHELL as ExperimentId,
      format: 'web',
    });
    expect(state).toMatchObject({ ok: true, value: { state: 'eligible' } });
  });

  it('sending fails for now: answers stay, “Nothing was lost”, focus on the notice; try again sends', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await report(sample, runtime, 'web', 'completed');
    feedbackPage(runtime, 'web');
    await screen.findByRole('heading', { level: 1, name: 'Feedback on WEB' });
    for (const [statement, rating] of [
      [1, 4],
      [2, 4],
      [3, 5],
      [4, 3],
      [5, 4],
    ] as const) {
      await chooseRating(user, statement, rating);
    }
    await user.type(
      screen.getByRole('textbox', { name: 'Additional comments (optional)' }),
      'The counter-flow run was easy to follow.',
    );
    faults(sample).failNext('FeedbackService.sendFeedback');
    await user.click(screen.getByRole('button', { name: 'Submit feedback' }));
    const notice = await screen.findByText('Your feedback wasn’t sent');
    expect(notice.closest('#feedback-failed')).toHaveFocus();
    expect(notice.closest('.rk-notice')).toHaveTextContent(
      'Nothing was lost — your answers are still here. Try again.',
    );
    expect(document.getElementById('feedback-q3-5')).toBeChecked();
    expect(screen.getByRole('textbox', { name: 'Additional comments (optional)' })).toHaveValue(
      'The counter-flow run was easy to follow.',
    );
    await user.click(screen.getByRole('button', { name: 'Submit feedback' }));
    const sent = await screen.findByRole('heading', { level: 1, name: 'Feedback on WEB sent' });
    await waitFor(() => expect(sent).toHaveFocus());
    const answers = main().querySelector('dl.sv-fbsent-dl')!;
    expect(
      [...answers.querySelectorAll(':scope > div')].map(
        (entry) =>
          `${entry.querySelector('dt')!.textContent} = ${(entry.querySelector('.sv-lk-v') ?? entry.querySelector('dd'))!.textContent}`,
      ),
    ).toEqual([
      '1. This experience helped me understand the concept. = 4 — Agree',
      '2. The instructions were clear and easy to follow. = 4 — Agree',
      '3. The simulation was easy to use and interact with. = 5 — Strongly agree',
      '4. This experience worked smoothly without technical issues. = 3 — Neither agree nor disagree',
      '5. Overall, I was satisfied with this learning experience. = 4 — Agree',
      'Additional comments = The counter-flow run was easy to follow.',
    ]);
    expect(screen.queryByRole('button', { name: 'Submit feedback' })).toBeNull();
    await waitFor(() => expect(document.title).toContain('Feedback on WEB'));
    // One record, never resent (FB-03).
    const again = await runtime.ports.feedback.sendFeedback({
      experimentId: SHELL as ExperimentId,
      format: 'web',
      ratings: [1, 1, 1, 1, 1],
      comments: null,
    });
    expect(again).toMatchObject({ ok: false, error: { kind: 'conflict', code: 'already-sent' } });
  });

  it('already sent from another tab: “Submit feedback” shows that record, read-only', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await report(sample, runtime, 'web', 'completed');
    feedbackPage(runtime, 'web');
    await screen.findByRole('heading', { level: 1, name: 'Feedback on WEB' });
    for (let statement = 1; statement <= 5; statement += 1) await chooseRating(user, statement, 2);
    // The same Student, in another tab of the same world.
    const other = await asPersonId(sample, RAHUL).feedback.sendFeedback({
      experimentId: SHELL as ExperimentId,
      format: 'web',
      ratings: [5, 5, 5, 5, 5],
      comments: 'Sent from the other tab.',
    });
    expect(other.ok).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Submit feedback' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Feedback on WEB sent' }),
    ).toBeVisible();
    const answers = main().querySelector('dl.sv-fbsent-dl')!;
    expect(answers).toHaveTextContent('Sent from the other tab.');
    expect(answers).toHaveTextContent('5 — Strongly agree');
  });

  it('refused for a moved-on record (paused meanwhile): nothing written, the state is read again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await report(sample, runtime, 'web', 'completed');
    feedbackPage(runtime, 'web');
    await screen.findByRole('heading', { level: 1, name: 'Feedback on WEB' });
    for (let statement = 1; statement <= 5; statement += 1) await chooseRating(user, statement, 4);
    // The Super Admin pauses Godavari elsewhere; this tab has not read it yet.
    const admin = asPersonId(sample, SUPER_ADMIN).institutions;
    const found = await admin.getInstitution('godavari' as never);
    if (!found.ok) throw new Error('getInstitution refused');
    const paused = await admin.pauseInstitution({
      institutionId: found.value.institution.id,
      reason: 'The institution asked us to pause access while it checks its student list.',
      expectedRev: found.value.institution.rev,
    });
    expect(paused.ok).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Submit feedback' }));
    // Not eligible any more, and WEB is completed: the not-found pattern (`ST-16.not-eligible`).
    expect(await screen.findByRole('heading', { level: 1, name: /can’t find/i })).toBeVisible();
    const state = await runtime.ports.feedback.getFeedbackState({
      experimentId: SHELL as ExperimentId,
      format: 'web',
    });
    expect(state).toMatchObject({ ok: true, value: { state: 'not-eligible' } });
  });

  it('the feedback state fails to load: the failed message with “Try again”', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    faults(sample).failNext('FeedbackService.getFeedbackState');
    feedbackPage(runtime, 'vr');
    const failed = await screen.findByRole('heading', {
      level: 2,
      name: 'We couldn’t load your feedback',
    });
    expect(failed.closest('.sv-msg')).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Feedback on VR sent' }),
    ).toBeVisible();
  });
});

describe('ST-17 Feedback sent (ST-v1 `fbVM` sent)', () => {
  it('VR sent on 20 Oct: read-only on the same scale, the date, “—” for no comment, the two ways on', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    feedbackPage(runtime, 'vr');
    await screen.findByRole('heading', { level: 1, name: 'Feedback on VR sent' });
    const band = main().querySelector('.sv-fbsent-top')!;
    expect(band).toHaveAttribute('role', 'status');
    expect(band).toHaveTextContent(
      'Thank youSent 20 Oct 2026, 11:30. Feedback can’t be changed after it’s sent.',
    );
    const back = within(band as HTMLElement).getByRole('link', { name: 'Back to experiment' });
    expect(back).toHaveAttribute('href', HUB);
    expect(back).toHaveClass('rb-btn--primary');
    expect(
      within(band as HTMLElement).getByRole('link', { name: 'See your progress' }),
    ).toHaveAttribute('href', '/student/progress');
    const card = screen.getByRole('region', { name: 'Your answers · VR' });
    expect(card).toHaveTextContent('Read-only');
    expect([...card.querySelectorAll('.sv-lk-v')].map((value) => value.textContent)).toEqual([
      '4 — Agree',
      '4 — Agree',
      '5 — Strongly agree',
      '4 — Agree',
      '5 — Strongly agree',
    ]);
    // The chosen point is the one dark dot of its row.
    expect(
      [...card.querySelectorAll('.sv-fbsent-dl > div:first-child .sv-lk-dot')].map((dot) =>
        dot.classList.contains('is-on'),
      ),
    ).toEqual([false, false, false, true, false]);
    expect(card.querySelector('.sv-fbsent-c dd')).toHaveTextContent('—');
    expect(within(main()).queryByRole('button')).toBeNull();
    expect(within(main()).queryByRole('radio')).toBeNull();
    await waitFor(() => expect(document.title).toContain('Feedback on VR'));
    expectNoReference();
  });

  it('WEB and VR are separate records (WEB sent on 14 Oct)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    feedbackPage(runtime, 'web');
    await screen.findByRole('heading', { level: 1, name: 'Feedback on WEB sent' });
    expect(main().querySelector('.sv-fbsent-d')).toHaveTextContent('Sent 14 Oct 2026, 15:42.');
    expect(screen.getByRole('heading', { level: 2, name: 'Your answers · WEB' })).toBeVisible();
  });
});

// ---- ST-01 Home's Up next "Give feedback" (B2-10 f5 → B3-06) ----------------------------------------

describe('ST-01 Up next “Give feedback” (B2-10 f5)', () => {
  it('a completed format without feedback offers “Give feedback”, opening that format’s form', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await report(sample, runtime, 'web', 'opened');
    await report(sample, runtime, 'web', 'completed');
    inStudent(runtime, '/student', <StudentHome />);
    // V3 Home (the export's `nextStep` "fb-WEB"): the cover's one next step.
    const cover = await screen.findByRole('region', { name: 'Continue learning' });
    const step = cover.querySelector<HTMLElement>('.sv-step.is-next')!;
    expect(step.querySelector('.sv-step-badge .sv-fmt--on')).toHaveTextContent('WEB');
    expect(step.querySelector('.sv-step-t')).toHaveTextContent('Feedback on WEB is open');
    expect(step.querySelector('.sv-step-d')).toHaveTextContent('You completed WEB.');
    const give = within(step).getByRole('link', { name: `Give feedback on WEB, ${SHELL_NAME}` });
    expect(give).toHaveTextContent('Give feedback on WEB');
    expect(give).toHaveAttribute('href', `${HUB}/feedback/web`);
    // The step covers WEB: the experiment's parts list VR and the rest, not WEB again.
    const also = screen.getByRole('region', { name: 'Also in this experiment' });
    expect(also).not.toHaveTextContent('Browser');
    expect(also).toHaveTextContent('Virtual realityNot started');
  });

  it('once sent, the step is gone (after Flow C)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    inStudent(runtime, '/student', <StudentHome />);
    await screen.findByRole('article', { name: SHELL_NAME });
    expect(within(main()).queryByRole('link', { name: /^Give feedback/ })).toBeNull();
    expect(main()).not.toHaveTextContent('feedback to give');
  });

  it('a format in progress is the step: “Continue WEB” opens the WEB page (no stage, no date the Home does not read)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await report(sample, runtime, 'web', 'opened');
    inStudent(runtime, '/student', <StudentHome />);
    const cover = await screen.findByRole('region', { name: 'Continue learning' });
    const step = cover.querySelector<HTMLElement>('.sv-step.is-next')!;
    expect(step.querySelector('.sv-step-t')).toHaveTextContent('Continue in your browser');
    expect(step.querySelector('.sv-step-d')).toHaveTextContent('WEB is in progress.');
    expect(within(step).getByRole('link', { name: `Continue WEB, ${SHELL_NAME}` })).toHaveAttribute(
      'href',
      `${HUB}/simulation/web`,
    );
    // Lead decision 1: no stage tracker, no "stage N of 3".
    expect(cover.querySelector('.sv-steps')).toBeNull();
    expect(cover).not.toHaveTextContent(/stage/i);
  });
});

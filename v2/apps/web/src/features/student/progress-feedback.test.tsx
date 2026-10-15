/**
 * Phase 3, ST-15 Progress (B3-05) and ST-16 Format feedback with its ST-17 Feedback sent state
 * (B3-06), with the ST-01 Up next "Give feedback" they enable (B2-10 f5), on the real composition
 * root and the sample world. Every word is the ports' answer for the signed-in Student: "In
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
const topTitle = () => document.querySelector('.xr-top-title');
const count = () => document.querySelector('.xr-toolbar-status [role="status"]')?.textContent;
const lines = () => [...document.querySelectorAll<HTMLElement>('main ul.xl-fl > li')];
const line = (code: string) =>
  lines().find((item) => item.querySelector('.xl-fl-fmt')?.textContent?.endsWith(code))!;

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
  const row = grants.value.find(
    (entry) => entry.grant.id === 'SACC-0310' && entry.student.id === RAHUL,
  )!;
  const withdrawn = await runtime.ports.studentAccess.withdrawGrant({
    grantId: row.grant.id,
    reason: 'Given individually by mistake.',
    expectedRev: row.grant.rev,
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

// ---- ST-15 Progress (B3-05) ---------------------------------------------------------------------

describe('ST-15 Progress (B3-05)', () => {
  it('before access: “Nothing to show yet” with Help, no toolbar (f4); Progress is current', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-setup');
    progressPage(runtime);
    expect(await screen.findByRole('heading', { level: 1, name: 'Progress' })).toBeVisible();
    const empty = await screen.findByRole('heading', { level: 2, name: 'Nothing to show yet' });
    expect(empty.closest('.xr-empty')).toHaveTextContent(
      'Your progress appears here when your institution gives you an experiment and you start a format.',
    );
    expect(within(main()).getByRole('link', { name: 'Help' })).toHaveAttribute(
      'href',
      '/student/help',
    );
    expect(document.querySelector('main .xr-toolbar')).toBeNull();
    expect(main()).toHaveTextContent('What you’ve started and finished, format by format');
    expect(topTitle()).toHaveTextContent('Progress');
    expect(
      screen
        .getByRole('navigation', { name: 'Student navigation' })
        .querySelector('[aria-current="page"]'),
    ).toHaveTextContent('Progress');
  });

  it('first visit (after Flow B): one course, one experiment, every format “Not started” or its availability', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-b');
    progressPage(runtime);
    await waitFor(() => expect(lines()).toHaveLength(4));
    const section = screen.getByRole('region', { name: THERMO_NAME });
    expect(section.querySelector('.xr-section-head .xr-meta')).toHaveTextContent(
      'MEC-523 · 1 experiment',
    );
    expect(within(section).getByRole('link', { name: SHELL_NAME })).toHaveAttribute('href', HUB);
    expect(section).toHaveTextContent('Given by your institution · SACC-0310');
    expect(count()).toBe('1 experiment');
    expect(line('WEB')).toHaveTextContent('Not started');
    expect(within(line('WEB')).getByRole('link', { name: 'Open WEB' })).toHaveAttribute(
      'href',
      `${HUB}/simulation/web`,
    );
    expect(line('VR')).toHaveTextContent('Not started');
    expect(within(line('VR')).getByRole('link', { name: 'Open VR' })).toHaveAttribute(
      'href',
      `${HUB}/simulation/vr`,
    );
    expect(line('AR')).toHaveClass('is-off');
    expect(line('AR')).toHaveTextContent('Not included for your institution');
    expect(line('MR')).toHaveTextContent('Not available for this experiment');
    // Opening a resource or pressing Launch writes no progress: nothing reads "In progress" (T-12).
    expect(lines().some((item) => item.textContent?.includes('In progress'))).toBe(false);
    expect(main()).not.toHaveTextContent('%');
  });

  it('WEB in progress only from the runtime’s report: “Last saved …” and “Continue WEB” (f1)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    progressPage(runtime);
    await waitFor(() => expect(lines()).toHaveLength(4));
    await report(sample, runtime, 'web', 'opened');
    await report(sample, runtime, 'web', 'saved');
    await waitFor(() => expect(line('WEB')).toHaveTextContent('In progress'));
    expect(line('WEB').querySelector('.xl-fl-state')!.textContent).toMatch(
      /^In progressLast saved \d{1,2} [A-Z][a-z]{2} 2026, \d\d:\d\d$/,
    );
    expect(within(line('WEB')).getByRole('link', { name: 'Continue WEB' })).toHaveAttribute(
      'href',
      `${HUB}/simulation/web`,
    );
    expect(line('VR')).toHaveTextContent('Not started');
    expect(within(main()).queryByRole('link', { name: /Give feedback/ })).toBeNull();
    const details = main().querySelector('details.xl-more')!;
    expect(details.querySelector('dl')!.textContent).toMatch(
      /^WEBFirst opened .+ · last saved .+AssessmentNone set yet$/,
    );
  });

  it('a headset format in progress reads its last reported session and opens its page', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    progressPage(runtime);
    await waitFor(() => expect(lines()).toHaveLength(4));
    await report(sample, runtime, 'vr', 'session');
    await waitFor(() => expect(line('VR')).toHaveTextContent('In progress'));
    expect(line('VR')).toHaveTextContent(/Last session reported \d{1,2} [A-Z][a-z]{2} 2026/);
    expect(within(line('VR')).getByRole('link', { name: 'Open VR' })).toBeVisible();
    expect(line('WEB')).toHaveTextContent('Not started');
  });

  it('WEB completed, VR not: feedback is offered on WEB only — VR has no entry (f0; BC5)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    progressPage(runtime);
    await waitFor(() => expect(lines()).toHaveLength(4));
    await report(sample, runtime, 'web', 'opened');
    await report(sample, runtime, 'web', 'completed');
    await waitFor(() => expect(line('WEB')).toHaveTextContent(/^WEBWEBCompleted \d/));
    expect(within(line('WEB')).getByRole('link', { name: 'Give feedback on WEB' })).toHaveAttribute(
      'href',
      `${HUB}/feedback/web`,
    );
    expect(line('VR')).toHaveTextContent('Not started');
    expect(within(line('VR')).queryByRole('link', { name: /feedback/i })).toBeNull();
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

  it('both completed, feedback sent (after Flow C): dates, “Feedback sent”, details — no verdict (f2)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    progressPage(runtime);
    await waitFor(() => expect(line('VR')).toHaveTextContent('Completed 20 Oct 2026'));
    expect(line('WEB').querySelector('.xl-fl-state')).toHaveTextContent('Completed 14 Oct 2026');
    expect(line('WEB').querySelector('.xl-fl-act')).toHaveTextContent('Feedback sent 14 Oct 2026');
    expect(line('VR').querySelector('.xl-fl-act')).toHaveTextContent('Feedback sent 20 Oct 2026');
    expect(within(main()).queryByRole('link', { name: /Give feedback/ })).toBeNull();
    const rows = [...main().querySelectorAll('details.xl-more dt')].map((dt) => [
      dt.textContent,
      dt.nextElementSibling?.textContent,
    ]);
    expect(rows).toEqual([
      ['WEB', 'First opened 12 Oct 2026, 10:05 · completed 14 Oct 2026, 15:30'],
      ['VR', 'First session reported 16 Oct 2026, 14:10 · completed 20 Oct 2026, 11:15'],
      ['WEB feedback', 'Sent 14 Oct 2026'],
      ['VR feedback', 'Sent 20 Oct 2026'],
      ['Assessment', 'None set yet'],
    ]);
    // Per format only: no percentage, no aggregate "experiment completed", no course verdict.
    expect(main()).not.toHaveTextContent('%');
    expect(main().textContent).not.toMatch(/experiment completed|all formats|overall/i);
  });

  it('filters apply at once: Status “Not started” matches nothing; chips and Clear filters (f3)', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    progressPage(runtime);
    await waitFor(() => expect(count()).toBe('1 experiment'));
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
    expect(count()).toBe('0 experiments');
    expect(
      screen.getByRole('heading', { level: 2, name: 'No experiments match these filters' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Remove Status: Not started' })).toBeVisible();
    await user.selectOptions(status, 'completed');
    expect(count()).toBe('1 experiment');
    await user.selectOptions(course, 'thermodynamics-heat-transfer');
    expect(screen.getByRole('button', { name: 'Remove Course: MEC-523' })).toBeVisible();
    await user.selectOptions(status, 'in-progress');
    expect(count()).toBe('0 experiments');
    const empty = screen.getByRole('heading', { name: 'No experiments match these filters' });
    await user.click(
      within(empty.closest('.xr-empty')!).getByRole('button', { name: 'Clear filters' }),
    );
    expect(count()).toBe('1 experiment');
    expect(status).toHaveValue('all');
    expect(status).toHaveFocus();
  });

  it('institution paused: “Paused” with the progress before the pause, no action (f5)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await report(sample, runtime, 'web', 'opened');
    await report(sample, runtime, 'web', 'completed');
    await pauseGodavari(sample, runtime);
    progressPage(runtime);
    await waitFor(() => expect(line('WEB')).toHaveTextContent('Paused'));
    expect(line('WEB').querySelector('.xl-fl-state')!.textContent).toMatch(
      /^PausedCompleted \d{1,2} [A-Z][a-z]{2} 2026 before the pause$/,
    );
    expect(line('VR').querySelector('.xl-fl-state')).toHaveTextContent(
      'PausedNot started before the pause',
    );
    expect(
      within(main())
        .queryAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([SHELL_NAME]);
  });

  it('only earlier work left: says so instead of “Nothing to show yet” (SACC-14 open)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    await meeraWithdrawsRahulsGrant(sample, runtime);
    progressPage(runtime);
    const heading = await screen.findByRole('heading', {
      level: 2,
      name: 'No experiments are given to you right now',
    });
    expect(heading.closest('.xr-empty')).toHaveTextContent('Your earlier work is kept.');
    expect(main()).not.toHaveTextContent('Nothing to show yet');
    expect(document.querySelector('main .xr-toolbar')).toBeNull();
  });

  it('loading, then failed with “Try again”, then the list (f7, f8)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    faults(sample).failNext('LearningService.getMyProgress');
    progressPage(runtime);
    expect(await screen.findByText('Loading your progress')).toHaveAttribute('role', 'status');
    expect(
      await screen.findByRole('heading', { level: 2, name: 'We couldn’t load your progress' }),
    ).toBeVisible();
    expect(main()).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(count()).toBe('1 experiment'));
    expect(document.activeElement).toBe(main());
  });
});

// ---- ST-16 Format feedback / ST-17 Feedback sent (B3-06) ------------------------------------------

const groups = () => screen.getAllByRole('group').filter((group) => group.matches('fieldset'));

async function chooseRating(
  user: ReturnType<typeof userEvent.setup>,
  statement: number,
  rating: number,
) {
  await user.click(document.getElementById(`feedback-q${statement}-${rating}`)!);
}

describe('ST-16 Format feedback (B3-06)', () => {
  it('a format the address cannot name is not found', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    feedbackPage(runtime, 'xr');
    expect(await screen.findByRole('heading', { level: 1, name: /can’t find/i })).toBeVisible();
  });

  it('not eligible — that format not completed — has no entry: the not-found pattern (f5)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await report(sample, runtime, 'vr', 'session');
    feedbackPage(runtime, 'vr');
    expect(await screen.findByRole('heading', { level: 1, name: /can’t find/i })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Submit feedback' })).toBeNull();
  });

  it('WEB completed opens WEB’s form only; VR stays without an entry (its own completion, BC5)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await report(sample, runtime, 'web', 'completed');
    const web = feedbackPage(runtime, 'web');
    expect(
      await screen.findByRole('heading', { level: 1, name: `${SHELL_NAME} WEB` }),
    ).toBeVisible();
    web.view.unmount();
    feedbackPage(runtime, 'vr');
    expect(await screen.findByRole('heading', { level: 1, name: /can’t find/i })).toBeVisible();
  });

  it('the form as drawn: five statements on a 1–5 scale, comments optional, crumbs (f0)', async () => {
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await report(sample, runtime, 'vr', 'session');
    await report(sample, runtime, 'vr', 'completed');
    feedbackPage(runtime, 'vr');
    expect(
      await screen.findByRole('heading', { level: 1, name: `${SHELL_NAME} VR` }),
    ).toBeVisible();
    expect(main()).toHaveTextContent('Give feedback');
    expect(main()).toHaveTextContent('Your feedback helps improve this experience.');
    expect(main()).toHaveTextContent('Rate all five statements. Additional comments are optional.');
    expect(groups().map((group) => group.querySelector('legend')!.textContent)).toEqual([
      '1. This experience helped me understand the concept.',
      '2. The instructions were clear and easy to follow.',
      '3. The simulation was easy to use and interact with.',
      '4. This experience worked smoothly without technical issues.',
      '5. Overall, I was satisfied with this learning experience.',
    ]);
    const scale = groups()[0]!.querySelector('.xr-scale')!;
    expect([...scale.querySelectorAll('label')].map((label) => label.textContent)).toEqual([
      '1Strongly disagree',
      '2Disagree',
      '3Neither agree nor disagree',
      '4Agree',
      '5Strongly agree',
    ]);
    expect(screen.getByRole('textbox', { name: 'Additional comments (optional)' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      `${HUB}/simulation/vr`,
    );
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', `${HUB}/simulation/vr`);
    expect(main().querySelector('a.xr-back')).toHaveTextContent('VR');
    await waitFor(() => expect(topTitle()).toHaveTextContent('Feedback on VR'));
    const crumbs = document.querySelector('.xr-crumbs')!;
    expect(within(crumbs as HTMLElement).getByRole('link', { name: 'My courses' })).toHaveAttribute(
      'href',
      '/student/courses',
    );
    expect(within(crumbs as HTMLElement).getByRole('link', { name: SHELL_NAME })).toHaveAttribute(
      'href',
      HUB,
    );
  });

  it('missing ratings: the service’s summary takes focus, links each statement, recounts (f1)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await report(sample, runtime, 'web', 'completed');
    feedbackPage(runtime, 'web');
    await screen.findByRole('heading', { level: 1, name: `${SHELL_NAME} WEB` });
    await chooseRating(user, 1, 4);
    await chooseRating(user, 3, 5);
    await user.click(screen.getByRole('button', { name: 'Submit feedback' }));
    const summary = await screen.findByRole('alert');
    expect(summary).toHaveFocus();
    expect(summary.querySelector('strong')).toHaveTextContent('3 ratings are missing');
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
    expect(second).toHaveTextContent('Choose a rating');
    expect(second.querySelector('.xr-scale')).toHaveClass('is-invalid');
    expect(second).toHaveAttribute('aria-describedby', 'feedback-q2-e');
    expect(groups()[0]!.querySelector('.xr-error')).toBeNull();
    await user.click(
      within(summary).getByRole('link', { name: 'Choose a rating for statement 4' }),
    );
    expect(groups()[3]!.contains(document.activeElement)).toBe(true);
    await chooseRating(user, 2, 4);
    await chooseRating(user, 4, 3);
    expect(screen.getByRole('alert').querySelector('strong')).toHaveTextContent(
      'One rating is missing',
    );
    expect(groups()[1]!.querySelector('.xr-error')).toBeNull();
    // Nothing was written.
    const state = await runtime.ports.feedback.getFeedbackState({
      experimentId: SHELL as ExperimentId,
      format: 'web',
    });
    expect(state).toMatchObject({ ok: true, value: { state: 'eligible' } });
  });

  it('sending fails for now: answers stay, “Nothing was lost”, focus on the notice; try again sends (f2 → f3)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await report(sample, runtime, 'web', 'completed');
    feedbackPage(runtime, 'web');
    await screen.findByRole('heading', { level: 1, name: `${SHELL_NAME} WEB` });
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
    expect(notice.closest('.xr-notice')).toHaveTextContent(
      'Nothing was lost — your answers are still here. Try again.',
    );
    expect(document.getElementById('feedback-q3-5')).toBeChecked();
    expect(screen.getByRole('textbox', { name: 'Additional comments (optional)' })).toHaveValue(
      'The counter-flow run was easy to follow.',
    );
    await user.click(screen.getByRole('button', { name: 'Submit feedback' }));
    const sent = await screen.findByRole('heading', { level: 1, name: 'Feedback on WEB sent' });
    await waitFor(() => expect(sent.closest('.xr-msg')).toHaveFocus());
    const answers = screen.getByRole('list', { name: 'Your answers' });
    expect([...answers.querySelectorAll('li')].map((item) => item.textContent)).toEqual([
      '1. This experience helped me understand the concept.4 — Agree',
      '2. The instructions were clear and easy to follow.4 — Agree',
      '3. The simulation was easy to use and interact with.5 — Strongly agree',
      '4. This experience worked smoothly without technical issues.3 — Neither agree nor disagree',
      '5. Overall, I was satisfied with this learning experience.4 — Agree',
      'Additional commentsThe counter-flow run was easy to follow.',
    ]);
    expect(screen.queryByRole('button', { name: 'Submit feedback' })).toBeNull();
    await waitFor(() => expect(topTitle()).toHaveTextContent('Feedback on WEB'));
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
    await screen.findByRole('heading', { level: 1, name: `${SHELL_NAME} WEB` });
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
    expect(screen.getByRole('list', { name: 'Your answers' })).toHaveTextContent(
      'Sent from the other tab.',
    );
    expect(screen.getByRole('list', { name: 'Your answers' })).toHaveTextContent(
      '5 — Strongly agree',
    );
  });

  it('refused for a moved-on record (paused meanwhile): nothing written, the state is read again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-b');
    await report(sample, runtime, 'web', 'completed');
    feedbackPage(runtime, 'web');
    await screen.findByRole('heading', { level: 1, name: `${SHELL_NAME} WEB` });
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
    // Not eligible any more: no entry, so the not-found pattern (`ST-16.not-eligible`).
    expect(await screen.findByRole('heading', { level: 1, name: /can’t find/i })).toBeVisible();
    const state = await runtime.ports.feedback.getFeedbackState({
      experimentId: SHELL as ExperimentId,
      format: 'web',
    });
    expect(state).toMatchObject({ ok: true, value: { state: 'not-eligible' } });
  });

  it('the feedback state fails to load: the drawn failed pattern with “Try again”', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RAHUL, 'after-flow-c');
    faults(sample).failNext('FeedbackService.getFeedbackState');
    feedbackPage(runtime, 'vr');
    expect(
      await screen.findByRole('heading', { level: 2, name: 'We couldn’t load your feedback' }),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Feedback on VR sent' }),
    ).toBeVisible();
  });
});

describe('ST-17 Feedback sent (B3-06 f3, f4)', () => {
  it('VR sent on 20 Oct: read-only, the date, the answers, “—” for no comment, the two ways on', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    feedbackPage(runtime, 'vr');
    const heading = await screen.findByRole('heading', { level: 1, name: 'Feedback on VR sent' });
    const message = heading.closest('.xr-msg')!;
    expect(message).toHaveTextContent(
      'Thank you. Sent 20 Oct 2026, 11:30. Feedback can’t be changed after it’s sent.',
    );
    expect(
      within(message as HTMLElement).getByRole('link', { name: 'Back to experiment' }),
    ).toHaveAttribute('href', HUB);
    expect(
      within(message as HTMLElement).getByRole('link', { name: 'See your progress' }),
    ).toHaveAttribute('href', '/student/progress');
    expect(screen.getByRole('heading', { level: 2, name: 'Your answers · VR' })).toBeVisible();
    const answers = [...screen.getByRole('list', { name: 'Your answers' }).querySelectorAll('li')];
    expect(answers.map((item) => item.querySelector('span:last-child')!.textContent)).toEqual([
      '4 — Agree',
      '4 — Agree',
      '5 — Strongly agree',
      '4 — Agree',
      '5 — Strongly agree',
      '—',
    ]);
    expect(within(main()).queryByRole('button')).toBeNull();
    expect(within(main()).queryByRole('radio')).toBeNull();
    await waitFor(() => expect(topTitle()).toHaveTextContent('Feedback on VR'));
  });

  it('WEB and VR are separate records (f3 WEB on 14 Oct)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    feedbackPage(runtime, 'web');
    const heading = await screen.findByRole('heading', { level: 1, name: 'Feedback on WEB sent' });
    expect(heading.closest('.xr-msg')).toHaveTextContent('Sent 14 Oct 2026, 15:42.');
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
    const upNext = await screen.findByRole('region', { name: 'Up next' });
    const item = await waitFor(() => {
      const found = [...upNext.querySelectorAll<HTMLElement>('.xr-row')].find((row) =>
        row.textContent?.includes('Give feedback on WEB'),
      );
      expect(found).toBeDefined();
      return found!;
    });
    expect(item).toHaveTextContent(`${SHELL_NAME} · you completed WEB`);
    expect(within(item).getByRole('link', { name: 'Give feedback' })).toHaveAttribute(
      'href',
      `${HUB}/feedback/web`,
    );
  });

  it('once sent, the item is gone (after Flow C)', async () => {
    const { runtime } = await tabPlatform(RAHUL, 'after-flow-c');
    inStudent(runtime, '/student', <StudentHome />);
    await screen.findByRole('region', { name: 'Up next' });
    await waitFor(() => expect(main()).not.toHaveTextContent('Loading'));
    expect(within(main()).queryByRole('link', { name: 'Give feedback' })).toBeNull();
  });
});

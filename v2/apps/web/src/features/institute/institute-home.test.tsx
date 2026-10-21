/**
 * IA-01 Overview, IA-02 Content access and IA-03 Access plan in the V3 design (the owner-approved
 * export design/v3-refined-b/roles/IA-v1, `Main.dc.html`), on the real composition root and the
 * sample world, as Meera Iyer (Godavari) and the other sample Institute Admins. Every status, line,
 * item, row and figure is the ports' answer: a grant given through the port changes what the pages
 * show; the sample clock moves a plan to "ending soon" and "ended"; the Super Admin's pause makes
 * the pages read-only. No page shows an internal reference (ACC-, REQ-, SACC-) in its words, names
 * or tab title.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { IsoInstant } from '@xr/domain';
import { asPersonId, faults, setSampleNow } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
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
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';

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
/** An element's words as they read: each text node apart, white space collapsed. */
function text(node: Element | null): string {
  if (!node) return '';
  const parts: string[] = [];
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  for (let current = walker.nextNode(); current; current = walker.nextNode()) {
    parts.push(current.textContent ?? '');
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/** An internal reference (the owner's identifier rule, 21 Oct 2026), the grant's included. */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|GRP|FMAP)-\d+/;

/**
 * No internal reference in the document's words (hidden and screen-reader-only words and the
 * announcements included), in any `aria-label`, `title` or `placeholder`, or in the tab's title.
 * Nothing on these pages quotes a person's words that name one, so nothing is excepted.
 */
function expectNoReferences(): void {
  expect(document.body.textContent ?? '').not.toMatch(REFERENCE);
  for (const element of document.body.querySelectorAll('[aria-label], [title], [placeholder]')) {
    for (const name of ['aria-label', 'title', 'placeholder']) {
      expect(element.getAttribute(name) ?? '', `${name} of ${element.tagName}`).not.toMatch(
        REFERENCE,
      );
    }
  }
  expect(document.title).not.toMatch(REFERENCE);
}

/** The sample clock on a day of the plan's term (ending soon, ended). */
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

// ---- IA-01 Overview -------------------------------------------------------------------------------

async function attentionRegion() {
  return screen.findByRole('region', { name: 'Needs your attention' }, { timeout: 5000 });
}

/** Each counted item's words, the count read first ("2 students have no access yet"). */
const itemTitles = (region: HTMLElement) =>
  [...region.querySelectorAll('li.ia-att-item .ia-att-t')].map((node) => text(node));
const items = (region: HTMLElement) => [...region.querySelectorAll('li.ia-att-item')];
const planCard = () => screen.getByRole('region', { name: 'Access plan' });
const headStatus = () => main().querySelector('.ia-ov-status')!;

describe('IA-01 — the head, the attention list and the plan card are the ports’ (IA-v1 IA-01)', () => {
  it('access just activated: the institution, the plan, two actions, the items and the plan card', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    inInstitute(runtime, '/institute', <InstituteOverview />);
    const region = await attentionRegion();
    const overview = await overviewOf(runtime);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.textContent).toBe(`Overview, ${overview.institution.name}`);
    expect(h1).toHaveAttribute('tabindex', '-1');
    expect(h1.querySelector('.xr-sr')).toHaveTextContent('Overview,');
    expect(headStatus().querySelector('.xr-st--ok')).toHaveTextContent('Access active');
    expect(text(headStatus().querySelector(':scope > span:last-child'))).toBe(
      'Your access plan ends on 7 October 2027.',
    );
    const actions = main().querySelector('.ia-ov-head .rk-head-act') as HTMLElement;
    expect(within(actions).getByRole('link', { name: 'Add students' })).toHaveAttribute(
      'href',
      '/institute/people/add',
    );
    const give = within(actions).getByRole('link', { name: 'Give students access' });
    expect(give).toHaveAttribute('href', '/institute/student-access/give');
    expect(give).toHaveClass('rb-btn', 'rb-btn--primary', 'rb-btn--lg');
    // One item per attention fact, in the port's order.
    expect(overview.attention.map((item) => item.kind)).toEqual([
      'experiment-not-given',
      'students-without-access',
    ]);
    const without = overview.attention[1] as { students: number };
    expect(itemTitles(region)).toEqual([
      '1 experiment hasn’t been given to any student',
      `${without.students} students have no access yet`,
    ]);
    expect(region.querySelector('.ia-att-head .rb-note')).toHaveTextContent('2 items');
    expect(region.querySelector('.rb-lead')).toBeNull();
    const [notGiven, noAccess] = items(region);
    expect(text(notGiven!.querySelector('.ia-att-d'))).toBe(SHELL_NAME);
    expect(
      within(notGiven as HTMLElement).getByRole('link', { name: 'Give access' }),
    ).toHaveAttribute(
      'href',
      `/institute/student-access/give?course=thermodynamics-heat-transfer&experiment=${SHELL}`,
    );
    expect(text(noAccess!.querySelector('.ia-att-d'))).toBe('Added on 8 October');
    expect(
      within(noAccess as HTMLElement).getByRole('link', { name: 'Review students' }),
    ).toHaveAttribute('href', '/institute/people');

    // The plan planBox on the plan tint: the term from its dates and the days the service gives.
    const planBox = planCard();
    expect(planBox).toHaveClass('ia-plan');
    expect(planBox.querySelector('.ia-plan-id .xr-st--ok')).toHaveTextContent('Active');
    const left = overview.planDaysLeft!;
    const term = within(planBox).getByRole('img', {
      name: new RegExp(
        `^Access term from 8 October 2026 to 7 October 2027\\. .*${left} days are left\\.$`,
      ),
    });
    expect(text(term.querySelector('.ia-plan-term-top'))).toBe(`Yearly term ${left} days left`);
    expect(term.querySelector('.ia-tt-today')).not.toBeNull();
    expect([...planBox.querySelectorAll('.ia-plan-facts dd')].map((node) => text(node))).toEqual([
      '120 as approved by BITS',
      'Yearly',
    ]);
    expect(text(planBox.querySelector('.ia-plan-exp-t'))).toBe(SHELL_NAME);
    expect(text(planBox.querySelector('.ia-plan-exp-c'))).toBe(
      'ME ZG523 · Thermodynamics & Heat Transfer',
    );
    // MEC-523 was added in the setup (S-steps).
    expect(text(planBox.querySelector('.ia-plan-code'))).toBe('Your course code MEC-523');
    const badges = within(planBox).getByRole('list', { name: `Formats of ${SHELL_NAME}` });
    expect([...badges.querySelectorAll('li')].map((li) => [li.className, text(li)])).toEqual([
      ['xr-fmt', 'WEB WEB, Browser: In your plan'],
      ['xr-fmt xr-fmt--pub', 'AR AR, Augmented reality: Published, not in your plan'],
      ['xr-fmt', 'VR VR, Virtual reality: In your plan'],
      ['xr-fmt xr-fmt--none', 'MR MR, Mixed reality: Not published'],
    ]);
    expect(text(planBox.querySelector('.ia-fmt-key'))).toBe(
      'WEB and VR in your plan · AR published, not in your plan · MR not published',
    );
    expect(within(planBox).getByRole('link', { name: 'View plan' })).toHaveAttribute(
      'href',
      '/institute/content-access/plans/ACC-0107',
    );
    expect(within(planBox).getByRole('link', { name: 'Open Content access' })).toHaveAttribute(
      'href',
      '/institute/content-access',
    );
    // The top line names the home page before the date.
    expect(document.querySelector('.rb-top-date')).toHaveTextContent(/^Overview/);
    expectNoReferences();
  });

  it('after Meera gives access through the port, “hasn’t been given to any student” goes', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    inInstitute(runtime, '/institute', <InstituteOverview />);
    const region = await attentionRegion();
    expect(itemTitles(region)[0]).toBe('1 experiment hasn’t been given to any student');
    const before = (await overviewOf(runtime)).attention[1] as { students: number };
    await giveThroughPort(runtime, { kind: 'student', studentId: 'per-0002' });
    await waitFor(() =>
      expect(itemTitles(region)).toEqual([`${before.students - 1} students have no access yet`]),
    );
    expect(region.querySelector('.rb-note')).toHaveTextContent('1 item');
  });

  it('nothing needs attention once every active student has it (the calm state)', async () => {
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
      expect(within(region).getByRole('status')).toHaveTextContent(
        'Nothing needs your attention right now.',
      ),
    );
    const calm = within(region).getByRole('status');
    expect(calm).toHaveClass('rb-calm');
    expect(calm).toHaveTextContent('New items appear here as they come in.');
    expect(region.querySelector('.rb-note')).toBeNull();
    expect(region.querySelector('.ia-att-list')).toBeNull();
    // The head's status stays.
    expect(headStatus()).toHaveTextContent('Access active');
    expectNoReferences();
  });

  it('ending soon: the lead band asks for a renewal; a state, nothing is sent (IA-v1 st-ia01-ending)', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    moveClock(sample, ENDING_SOON);
    inInstitute(runtime, '/institute', <InstituteOverview />);
    const region = await attentionRegion();
    expect(headStatus().querySelector('.xr-st--warn')).toHaveTextContent('Ending soon');
    expect(headStatus()).toHaveTextContent('Your access plan ends on 7 October 2027.');
    const lead = region.querySelector('.rb-lead')!;
    expect(lead.className).toBe('rb-lead');
    expect(text(lead.querySelector('.rb-lead-t'))).toBe('Request a renewal');
    expect(text(lead.querySelector('.rb-lead-d'))).toMatch(
      /^Your plan ends on 7 October( 2027)?\. The reminder is due; nothing is sent automatically\.$/,
    );
    expect(
      within(lead as HTMLElement).getByRole('link', { name: 'Request renewal' }),
    ).toHaveAttribute('href', '/institute/requests');
    // The term bar counts the days left in gold.
    const left = planCard().querySelector('.ia-plan-left')!;
    expect(left).toHaveTextContent('15 days left');
    expect(left).toHaveClass('is-warn');
    expect(planCard().querySelector('.ia-tt-rest')).not.toBeNull();
    // Both actions stay while it is ending soon.
    expect(screen.getByRole('link', { name: 'Give students access' })).toBeVisible();
    expectNoReferences();
  });

  it('ended: the lead band alone, “Add students” only (IA-v1 st-ia01-ended)', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    moveClock(sample, ENDED);
    inInstitute(runtime, '/institute', <InstituteOverview />);
    const region = await attentionRegion();
    expect(headStatus().querySelector('.rk-st-ended')).toHaveTextContent('Access ended');
    expect(headStatus()).toHaveTextContent('Your access plan ended on 7 October 2027.');
    const lead = region.querySelector('.rb-lead')!;
    expect(lead).toHaveClass('ia-lead--off');
    expect(text(lead.querySelector('.rb-lead-t'))).toBe('Your access plan has ended');
    expect(text(lead.querySelector('.rb-lead-d'))).toBe(
      'Ended 7 Oct 2027 · students can’t open its experiments now.',
    );
    expect(
      within(lead as HTMLElement).getByRole('link', { name: 'Request renewal' }),
    ).toHaveAttribute('href', '/institute/requests');
    expect(region.querySelector('.ia-att-list')).toBeNull();
    expect(region.querySelector('.rb-note')).toHaveTextContent('1 item');
    expect(screen.getByRole('link', { name: 'Add students' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Give students access' })).toBeNull();
    expect(planCard().querySelector('.ia-tt')).toHaveClass('is-full');
    expect(planCard().querySelector('.ia-plan-left')).toHaveTextContent('Ended on 7 Oct 2027');
    expectNoReferences();
  });

  it('paused: read-only, the lead band opens Help (IA-v1 st-ia01-paused; Deccan’s Institute Admin)', async () => {
    const { runtime } = await tabPlatform(PAUSED_INSTITUTE_ADMIN, 'after-flow-b');
    inInstitute(runtime, '/institute', <InstituteOverview />);
    const region = await attentionRegion();
    expect(headStatus().querySelector('.xr-st--paused')).toHaveTextContent('Access paused');
    expect(headStatus()).toHaveTextContent('Your access plan was paused by BITS on 12 Oct 2026.');
    expect(main().querySelector('.ia-ov-head .rk-head-act')).toBeNull();
    const lead = region.querySelector('.rb-lead')!;
    expect(lead).toHaveClass('ia-lead--paused');
    expect(text(lead.querySelector('.rb-lead-t'))).toBe(
      'BITS has paused your institution’s access',
    );
    expect(text(lead.querySelector('.rb-lead-d'))).toBe(
      'Students can’t open experiments. Pages are read-only until BITS lifts the pause. Your work is kept.',
    );
    expect(within(lead as HTMLElement).getByRole('link', { name: 'Help' })).toHaveAttribute(
      'href',
      '/institute/help',
    );
    expect(region.querySelector('.ia-att-list')).toBeNull();
    // The term bar is striped and says when BITS paused it.
    expect(planCard().querySelector('.ia-tt')).toHaveClass('is-paused');
    expect(planCard().querySelector('.ia-plan-left')).toHaveTextContent(
      'Paused by BITS on 12 Oct 2026',
    );
    // The shell's paused banner (the XS banner, XS-08) is the frame's.
    expect(document.querySelector('main#main > .rk-banner')).toHaveTextContent(
      'Your institution’s access is paused — your work is kept.',
    );
    expectNoReferences();
  });

  it('supplied licence waits, never counted, open Student access (later sample)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    inInstitute(runtime, '/institute', <InstituteOverview />);
    const region = await attentionRegion();
    const waiting = items(region).find((item) =>
      item.textContent!.includes('waiting for a licence'),
    )!;
    expect(text(waiting.querySelector('.ia-att-n'))).toBe('2');
    expect(text(waiting.querySelector('.ia-att-t'))).toBe('2 students are waiting for a licence');
    expect(text(waiting.querySelector('.ia-att-d'))).toBe(SHELL_NAME);
    expect(
      within(waiting as HTMLElement).getByRole('link', { name: 'View students' }),
    ).toHaveAttribute('href', '/institute/student-access');
    expectNoReferences();
  });

  it('a course without the institution’s code: “Add course code” opens Course codes (Konark)', async () => {
    const { runtime } = await tabPlatform(KONARK_IA, 'after-flow-b');
    inInstitute(runtime, '/institute', <InstituteOverview />);
    const region = await attentionRegion();
    const rows = await runtime.ports.institutions.listContentAccess();
    if (!rows.ok) throw new Error('rows');
    const course = rows.value[0]!.course;
    const noCode = items(region).find((item) =>
      item.textContent!.includes('course has no course code from your institution'),
    )!;
    expect(text(noCode.querySelector('.ia-att-d'))).toBe(`${course.platformCode} ${course.name}`);
    expect(
      within(noCode as HTMLElement).getByRole('link', { name: 'Add course code' }),
    ).toHaveAttribute('href', '/institute/content-access?tab=course-codes');
    expect(planCard().querySelector('.ia-plan-code .rk-tag-warn')).toHaveTextContent(
      'Your course code: not added',
    );
    expectNoReferences();
  });

  it('a failed read has Try again, which reads again and keeps focus on the title', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    faults(sample).failNext('InstitutionService.getMyOverview');
    inInstitute(runtime, '/institute', <InstituteOverview />);
    const failed = await screen.findByRole('heading', {
      level: 2,
      name: 'We couldn’t load your overview',
    });
    const state = failed.closest('.rk-state')!;
    expect(state).toHaveAttribute('role', 'alert');
    expect(state).toHaveTextContent('Nothing has changed. Try again.');
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await attentionRegion()).toBeVisible();
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus());
  });

  it('the loading state is announced under the head', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    renderInTab(<InstituteOverview />, { runtime, navigation: testNavigation('/institute') });
    expect(document.querySelector('.rk-loading-msg[role="status"]')).toHaveTextContent(
      'Loading your overview',
    );
    expect(await attentionRegion()).toBeVisible();
  });
});

// ---- IA-02 Content access ---------------------------------------------------------------------------

async function planStrip() {
  return screen.findByRole('region', { name: 'Access plan' }, { timeout: 5000 });
}
const experimentsTable = () =>
  screen.getByRole('table', { name: 'Experiments in your access plan, grouped by course' });
const countStatus = () => document.querySelector('.ia-xs-count[role="status"]');
const noMatch = () => screen.queryByText('No experiments match these filters');

describe('IA-02 — what BITS has given, the plan strip and the experiments by course (IA-v1 IA-02)', () => {
  it('the head, the tabs, the strip, the course group and one row per experiment, from the port', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    inInstitute(runtime, '/institute/content-access', <ContentAccess />);
    const strip = await planStrip();
    expect(screen.getByRole('heading', { level: 1, name: 'Content access' })).toBeVisible();
    expect(main().querySelector('.rk-head .rk-sub')).toHaveTextContent(
      'What BITS has given your institution to use',
    );
    // The head's action is secondary here, so each row's action reads as the clear one.
    const give = within(main().querySelector('.rk-head-act') as HTMLElement).getByRole('link', {
      name: 'Give students access',
    });
    expect(give).toHaveAttribute('href', '/institute/student-access/give');
    expect(give).not.toHaveClass('rb-btn--primary');
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
    // The strip: status, licences as approved, the term bar, View plan named by its term.
    expect(strip).toHaveClass('ia-cp');
    expect(strip.querySelector('.ia-cp-name .xr-st--ok')).toHaveTextContent('Active');
    expect(text(strip.querySelector('.ia-cp-facts dd'))).toBe('120 as approved by BITS');
    expect(
      within(strip).getByRole('img', { name: /^Access term from 8 October 2026/ }),
    ).toBeVisible();
    const view = within(strip).getByRole('link', {
      name: 'View access plan, 8 Oct 2026 – 7 Oct 2027',
    });
    expect(view).toHaveTextContent('View plan');
    expect(view).toHaveAttribute('href', '/institute/content-access/plans/ACC-0107');
    expect(strip.querySelector('.ia-cp-note')).toBeNull();
    // The course group: BITS code, course, "Your course code" (MEC-523 added in the setup).
    const table = experimentsTable();
    const head = table.querySelector('tr.ia-xt-grp')!;
    expect(text(head.querySelector('.rb-code'))).toBe('ME ZG523');
    expect(text(head.querySelector('.ia-xt-gt'))).toBe('Thermodynamics & Heat Transfer');
    expect(text(head.querySelector('.ia-xt-own'))).toBe('Your course code MEC-523');
    const row = table.querySelector('tr.ia-xt-row') as HTMLElement;
    expect(text(row.querySelector('.ia-xt-t'))).toBe(SHELL_NAME);
    expect(row.querySelector('.ia-xt-name a')).toBeNull();
    expect(row.querySelector('.ia-xt-nm .xr-st--ok')).toHaveTextContent('Active');
    const badges = within(row).getByRole('list', { name: `Formats of ${SHELL_NAME}` });
    expect(
      [...badges.querySelectorAll('li')].map((li) => [li.getAttribute('title'), li.className]),
    ).toEqual([
      ['WEB, Browser: In your plan', 'xr-fmt'],
      ['AR, Augmented reality: Published, not in your plan', 'xr-fmt xr-fmt--pub'],
      ['VR, Virtual reality: In your plan', 'xr-fmt'],
      ['MR, Mixed reality: Not published', 'xr-fmt xr-fmt--none'],
    ]);
    expect(text(row.querySelector('.ia-xt-none'))).toBe('None yet');
    expect(
      within(row).getByRole('link', { name: `Give students access to ${SHELL_NAME}` }),
    ).toHaveAttribute(
      'href',
      `/institute/student-access/give?course=thermodynamics-heat-transfer&experiment=${SHELL}`,
    );
    expect(main().querySelector('.ia-gm-foot')).toHaveTextContent(
      'Only experiments in your access plan are listed here.',
    );
    expectNoReferences();
  });

  it('after Meera gives access the count opens Student access', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    inInstitute(runtime, '/institute/content-access', <ContentAccess />);
    await planStrip();
    await giveThroughPort(runtime, { kind: 'student', studentId: 'per-0002' });
    const link = await screen.findByRole('link', {
      name: `1 student given access to ${SHELL_NAME}. Open Student access`,
    });
    expect(link).toHaveTextContent('1 student');
    expect(link).toHaveAttribute('href', '/institute/student-access');
  });

  it('search and status narrow the rows; no match has one way back (IA-v1 st-ia02-nomatch)', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    inInstitute(runtime, '/institute/content-access', <ContentAccess />);
    await planStrip();
    const search = screen.getByRole('searchbox', { name: 'Search experiments' });
    expect(search).toHaveAttribute('placeholder', 'Search experiment or course');
    await user.type(search, 'Distillation');
    expect(noMatch()).toBeVisible();
    expect(countStatus()).toHaveTextContent('0 of 1 experiment');
    expect(
      screen.getByRole('button', { name: 'Remove filter Search: “Distillation”' }),
    ).toBeVisible();
    expect(screen.queryByRole('table')).toBeNull();
    // The strips stay whatever the filters.
    expect(screen.getByRole('region', { name: 'Access plan' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Show all experiments' }));
    expect(experimentsTable()).toBeVisible();
    expect(search).toHaveValue('');
    await waitFor(() => expect(search).toHaveFocus());
    // The course code and the institution's own code match too.
    await user.type(search, 'zg523');
    expect(countStatus()).toHaveTextContent('1 of 1 experiment');
    await user.clear(search);
    await user.type(search, 'MEC-523');
    expect(countStatus()).toHaveTextContent('1 of 1 experiment');
    await user.clear(search);
    // The status filter keeps only that status.
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'ended');
    expect(noMatch()).toBeVisible();
    expect(screen.getByRole('button', { name: 'Remove filter Status: Ended' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(experimentsTable()).toBeVisible();
    expect(search).toHaveFocus();
    expectNoReferences();
  });

  it('ending soon: the term counts the days and the note says a reminder is due (IA-v1 st-ia02-ending)', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    moveClock(sample, ENDING_SOON);
    inInstitute(runtime, '/institute/content-access', <ContentAccess />);
    const strip = await planStrip();
    expect(strip.querySelector('.ia-cp-name .xr-st--warn')).toHaveTextContent('Ending soon');
    expect(strip.querySelector('.ia-plan-left')).toHaveTextContent('15 days left');
    expect(strip.querySelector('.ia-plan-left')).toHaveClass('is-warn');
    const note = strip.querySelector('.ia-cp-note--warn') as HTMLElement;
    expect(text(note.querySelector('p'))).toBe(
      'Ends on 7 Oct 2027. Renewal reminder due. Ask BITS for a renewal from Requests.',
    );
    expect(within(note).getByRole('link', { name: 'Request renewal' })).toHaveAttribute(
      'href',
      '/institute/requests',
    );
    expect(experimentsTable().querySelector('tbody .xr-st--warn')).toHaveTextContent('Ending soon');
    expect(
      screen.getByRole('link', { name: `Give students access to ${SHELL_NAME}` }),
    ).toBeVisible();
    expectNoReferences();
  });

  it('ended: who had access stays, no Give access', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    moveClock(sample, ENDED);
    inInstitute(runtime, '/institute/content-access', <ContentAccess />);
    const strip = await planStrip();
    const note = strip.querySelector('.ia-cp-note--off') as HTMLElement;
    expect(text(note.querySelector('p'))).toBe(
      'This plan has ended. Students can’t open its experiments now. You can still see who had access.',
    );
    expect(within(note).getByRole('link', { name: 'Request renewal' })).toBeVisible();
    expect(strip.querySelector('.ia-cp-name .rk-st-ended')).toHaveTextContent('Ended');
    expect(strip.querySelector('.ia-tt')).toHaveClass('is-full');
    expect(
      screen.getByRole('link', {
        name: `1 student given access to ${SHELL_NAME}. Open Student access`,
      }),
    ).toBeVisible();
    expect(screen.queryByRole('link', { name: /Give students access/ })).toBeNull();
    expect(main().querySelector('.rk-head-act')).toBeNull();
  });

  it('paused: read-only, actions removed (IA-v1 world 5)', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    await pauseGodavari(sample);
    inInstitute(runtime, '/institute/content-access', <ContentAccess />);
    const strip = await planStrip();
    const note = strip.querySelector('.ia-cp-note--paused') as HTMLElement;
    expect(text(note.querySelector('p'))).toBe(
      'Read-only while your institution’s access is paused. You can’t give or withdraw access until BITS lifts the pause.',
    );
    expect(note.querySelector('a')).toBeNull();
    expect(strip.querySelector('.ia-cp-name .xr-st--paused')).toHaveTextContent('Paused');
    expect(strip.querySelector('.ia-tt')).toHaveClass('is-paused');
    expect(experimentsTable().querySelector('tbody .xr-st--paused')).toHaveTextContent('Paused');
    expect(screen.queryByRole('link', { name: /Give students access/ })).toBeNull();
    expectNoReferences();
  });

  it('a course without the institution’s code is flagged, with “Add code” to Course codes (Konark)', async () => {
    const { runtime } = await tabPlatform(KONARK_IA, 'after-flow-b');
    inInstitute(runtime, '/institute/content-access', <ContentAccess />);
    await planStrip();
    const rows = await runtime.ports.institutions.listContentAccess();
    if (!rows.ok) throw new Error('rows');
    const course = rows.value[0]!.course;
    const own = experimentsTable().querySelector('.ia-xt-own') as HTMLElement;
    expect(own.querySelector('.rk-tag-warn')).toHaveTextContent('Your course code: not added');
    const add = within(own).getByRole('link', {
      name: `Add your course code for ${course.platformCode} ${course.name}`,
    });
    expect(add).toHaveTextContent('Add code');
    expect(add).toHaveAttribute('href', '/institute/content-access?tab=course-codes');
  });

  it('announces loading; a failed read has Try again, which reads again (IA-v1 st-ia02-loading, -failed)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    faults(sample).failNext('InstitutionService.listContentAccess');
    renderInTab(<ContentAccess />, {
      runtime,
      navigation: testNavigation('/institute/content-access'),
    });
    const loading = document.querySelector('.rk-loading-msg[role="status"]')!;
    expect(loading).toHaveTextContent('Loading content access…');
    expect(loading.closest('section.rk-surface')).toHaveAttribute('aria-busy', 'true');
    const failed = await screen.findByRole('heading', {
      level: 2,
      name: 'We couldn’t load content access',
    });
    expect(failed.closest('.rk-state')).toHaveAttribute('role', 'alert');
    expect(failed.closest('.rk-state')).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Content access' })).toHaveFocus();
    expect(await planStrip()).toBeVisible();
  });
});

// ---- IA-03 Access plan ------------------------------------------------------------------------------

const PLAN_PATH = '/institute/content-access/plans/ACC-0107';

async function planPage(runtime: PlatformRuntime, planId = 'ACC-0107') {
  inInstitute(
    runtime,
    `/institute/content-access/plans/${planId}`,
    <AccessPlanDetail planId={planId} />,
  );
  await screen.findByRole('region', { name: 'History' }, { timeout: 5000 });
  return screen.getByRole('heading', { level: 1, name: 'Your access plan' });
}

const regionNamed = (name: string) => screen.getByRole('region', { name });
const historyLines = () =>
  [...regionNamed('History').querySelectorAll('ol.rk-tl > li')].map((item) =>
    [...item.querySelectorAll('.rk-tl-w, .rk-tl-t, .rk-tl-n')].map((line) => line.textContent),
  );
const meta = () => main().querySelector('.rk-head .rk-meta')!;
const strip = () => regionNamed('Licences and term');
const givenTable = () =>
  within(regionNamed('Students you’ve given access')).getByRole('table', {
    name: 'Students given access under your access plan, grouped by experiment: one row per student',
  });

describe('IA-03 — what BITS gave and who has it (IA-v1 IA-03)', () => {
  it('just activated: the crumbs, the head, the strip, what BITS gave, nobody given yet, the history', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const h1 = await planPage(runtime);
    expect(h1).toHaveClass('rk-title');
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(crumbs).getByRole('link', { name: 'Content access' })).toHaveAttribute(
      'href',
      '/institute/content-access',
    );
    expect(crumbs.querySelector('[aria-current="page"]')).toHaveTextContent('Access plan');
    expect(main().querySelector('.rk-head .rk-eyebrow')).toHaveTextContent(
      'Godavari Institute of Technology',
    );
    expect(meta().querySelector('.xr-st--ok')).toHaveTextContent('Active');
    expect(meta()).toHaveTextContent('From your request to BITS');
    // The request opens its detail in Requests (IA-17); its reference stays in the address.
    expect(
      within(meta() as HTMLElement).getByRole('link', { name: 'your request to BITS' }),
    ).toHaveAttribute('href', '/institute/requests/REQ-0042');
    expect(meta()).toHaveTextContent('Active since 8 Oct 2026, 15:05');
    const give = within(main().querySelector('.rk-head-act') as HTMLElement).getByRole('link', {
      name: 'Give students access',
    });
    expect(give).toHaveAttribute('href', '/institute/student-access/give');
    expect(give).toHaveClass('rb-btn--primary');
    // The strip: licences as approved, the term, where to ask BITS, the footnote.
    expect(text(strip().querySelector('.ia-cp-facts dd'))).toBe('120 as approved by BITS');
    const view = await runtime.ports.institutions.getAccessPlan('ACC-0107' as never);
    if (!view.ok) throw new Error('plan');
    expect(text(strip().querySelector('.ia-cp-term-top'))).toBe(
      `Yearly term ${view.value.daysLeft} days left`,
    );
    expect(strip().querySelector('.ia-cp-row')!.className).toBe('ia-cp-row ia-cp-row--plan');
    expect(text(strip().querySelector('.ia-cp-ask'))).toBe(
      'Need more, or a renewal? Ask BITS from Requests',
    );
    expect(within(strip()).getByRole('link', { name: 'Ask BITS from Requests' })).toHaveAttribute(
      'href',
      '/institute/requests',
    );
    expect(strip().querySelector('.ia-cp-foot')).toHaveTextContent(
      'Licences and term are as BITS approved them. Giving or withdrawing access doesn’t change what is shown here.',
    );
    // What BITS gave: one course group, the experiment and its four format badges.
    const gave = regionNamed('What BITS gave your institution');
    expect(within(gave).getByRole('list', { name: 'Format key' })).toBeVisible();
    const table = within(gave).getByRole('table', {
      name: 'Experiments in your access plan, grouped by course, with the formats in your plan',
    });
    expect(text(table.querySelector('.ia-xt-gh'))).toMatch(
      /^ME ZG523 Thermodynamics & Heat Transfer Your course code MEC-523/,
    );
    const row = table.querySelector('tr.ia-xt-row') as HTMLElement;
    expect(text(row.querySelector('.ia-xt-t'))).toBe(SHELL_NAME);
    expect(
      [
        ...within(row)
          .getByRole('list', { name: `Formats of ${SHELL_NAME}` })
          .querySelectorAll('li'),
      ].map((li) => li.className),
    ).toEqual(['xr-fmt', 'xr-fmt xr-fmt--pub', 'xr-fmt', 'xr-fmt xr-fmt--none']);
    // Nobody given yet.
    const given = regionNamed('Students you’ve given access');
    expect(within(given).getByRole('heading', { level: 3 })).toHaveTextContent(
      'You haven’t given anyone access yet',
    );
    expect(given).toHaveTextContent(
      'Choose students and give them experiments from this plan. They see the formats in this plan.',
    );
    expect(within(given).queryByRole('link', { name: 'Open Student access' })).toBeNull();
    expect(within(given).getByRole('link', { name: 'Give students access' })).toHaveAttribute(
      'href',
      `/institute/student-access/give?course=thermodynamics-heat-transfer&experiment=${SHELL}`,
    );
    expect(historyLines()).toEqual([
      ['Access activated', '8 Oct 2026, 15:05', 'Payment confirmed. Your access plan was created.'],
      ['Request approved · External', '8 Oct 2026, 11:20', 'Approved — payment required.'],
      ['Request submitted', '2 Oct 2026, 10:14 · Meera Iyer'],
    ]);
    expect(regionNamed('History').querySelector('li.is-latest')).toHaveTextContent(
      'Access activated',
    );
    // The tab is titled "Access plan", crumbed under Content access — never the plan's reference.
    await waitFor(() => expect(document.title).toMatch(/^Access plan/));
    expectNoReferences();
  });

  it('after the first grant: Rahul under “Students you’ve given access”, the grant in the history', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-flow-b');
    await planPage(runtime);
    const given = regionNamed('Students you’ve given access');
    expect(within(given).getByRole('link', { name: 'Open Student access' })).toHaveAttribute(
      'href',
      '/institute/student-access',
    );
    const table = givenTable();
    const head = table.querySelector('tr.ia-gt-grp')!;
    expect(text(head.querySelector('.ia-gt-gt'))).toBe(SHELL_NAME);
    expect(text(head.querySelector('.rk-code'))).toBe('ME ZG523');
    expect(
      within(head as HTMLElement).getByRole('img', {
        name: 'Formats from your access plan: WEB, VR',
      }),
    ).toBeVisible();
    expect(text(head.querySelector('.ia-gt-gn'))).toBe('1 student');
    const row = table.querySelector('tr.ia-gt-row') as HTMLElement;
    expect(within(row).getByRole('link', { name: 'Rahul Verma' })).toHaveAttribute(
      'href',
      '/institute/people/students/per-0002',
    );
    expect(text(row.querySelector('.ia-gt-who .ia-cell-sub'))).toBe('GIT-2026-0418');
    expect(text(row.querySelector('.ia-gt-how'))).toBe('Individually 9 Oct 2026');
    expect(row.querySelector('.ia-gt-st .xr-st--ok')).toHaveTextContent('Active');
    expect(row.querySelector('.ia-cell-note')).toBeNull();
    expect(historyLines()[0]).toEqual([
      `Rahul Verma given ${SHELL_NAME}`,
      '9 Oct 2026, 10:20 · Meera Iyer',
      'Individually',
    ]);
    expect(historyLines()).toHaveLength(4);
    expectNoReferences();
  });

  it('later sample: one row per student, the group grant, the wait note only where waiting', async () => {
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    await planPage(runtime);
    const rows = [...givenTable().querySelectorAll('tbody tr.ia-gt-row')] as HTMLElement[];
    const view = await runtime.ports.institutions.getAccessPlan('ACC-0107' as never);
    if (!view.ok) throw new Error('plan');
    // One row per student and experiment, however many grants reach them.
    const students = new Set(
      view.value.givenTo.map((row) => `${row.experimentId}:${row.student.id}`),
    );
    expect(rows).toHaveLength(students.size);
    expect(rows.length).toBeLessThan(view.value.givenTo.length);
    const rowOf = (name: string) => rows.find((row) => row.textContent!.includes(name))!;
    const arun = rowOf('Arun Kumar');
    const group = within(arun.querySelector('.ia-gt-how') as HTMLElement).getByRole('link', {
      name: 'Group: ME ZG523 — Sem II',
    });
    expect(group.getAttribute('href')).toMatch(/^\/institute\/people\/groups\//);
    expect(arun.querySelector('.ia-gt-how .ia-cell-sub')).toHaveTextContent('12 Oct 2026');
    expect(arun.querySelector('.xr-st--warn')).toHaveTextContent('Waiting for a licence');
    expect(text(arun.querySelector('.ia-cell-note'))).toBe(
      'No licence is available for Arun on this plan right now.',
    );
    expect(rowOf('Sneha Reddy').querySelector('.rk-st-ended')).toHaveTextContent(
      'Student inactive',
    );
    const rahul = rowOf('Rahul Verma');
    expect(rahul.querySelector('.ia-gt-how .ia-cell-t')).toHaveTextContent('Individually');
    expect(text(rahul.querySelector('.ia-cell-also'))).toBe(
      'Also in ME ZG523 — Sem II, which has this experiment',
    );
    // The wait note never shows on a row that does not read Waiting for a licence.
    for (const row of rows) {
      if (!row.querySelector('.xr-st--warn')) expect(row.querySelector('.ia-cell-note')).toBeNull();
    }
    const lines = historyLines();
    expect(lines).toContainEqual([
      `Group ME ZG523 — Sem II given ${SHELL_NAME}`,
      expect.stringMatching(/^12 Oct 2026, \d\d:\d\d · Meera Iyer$/),
      'Group grant',
    ]);
    expect(lines).toContainEqual([
      'Individual grant withdrawn',
      expect.stringMatching(/^12 Oct 2026, \d\d:\d\d · Meera Iyer$/),
      `Nikhil Bose · ${SHELL_NAME}`,
    ]);
    expectNoReferences();
  });
});

describe('IA-03 — ending soon, ended and paused (IA-v1 st-ia03-ending, -ended, -paused)', () => {
  it('ending soon: the days left in gold, the note in place of the ask', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    moveClock(sample, ENDING_SOON);
    await planPage(runtime);
    expect(meta().querySelector('.xr-st--warn')).toHaveTextContent('Ending soon');
    expect(strip().querySelector('.ia-plan-left')).toHaveTextContent('15 days left');
    expect(strip().querySelector('.ia-cp-row')).toHaveClass('is-noask');
    expect(strip().querySelector('.ia-cp-ask')).toBeNull();
    const note = strip().querySelector('.ia-cp-note--warn') as HTMLElement;
    expect(text(note.querySelector('p'))).toBe(
      'Ends on 7 Oct 2027. Renewal reminder due. Ask BITS for a renewal from Requests.',
    );
    expect(within(note).getByRole('link', { name: 'Request renewal' })).toHaveAttribute(
      'href',
      '/institute/requests',
    );
    expect(screen.getByRole('link', { name: 'Give students access' })).toBeVisible();
    expectNoReferences();
  });

  it('ended: the note, access ended on every row, “Plan ended” first in the history', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    moveClock(sample, ENDED);
    await planPage(runtime);
    expect(meta().querySelector('.rk-st-ended')).toHaveTextContent('Ended');
    const note = strip().querySelector('.ia-cp-note--off') as HTMLElement;
    expect(text(note.querySelector('p'))).toBe(
      'This plan ended on 7 Oct 2027. Students can’t open its experiments now. Your records stay here.',
    );
    expect(within(note).getByRole('link', { name: 'Request renewal' })).toHaveAttribute(
      'href',
      '/institute/requests',
    );
    expect(strip().querySelector('.ia-tt')).toHaveClass('is-full');
    expect(givenTable().querySelector('tbody .rk-st-ended')).toHaveTextContent('Access ended');
    expect(historyLines()[0]).toEqual(['Plan ended', '7 Oct 2027', 'End of the yearly term.']);
    expect(screen.queryByRole('link', { name: 'Give students access' })).toBeNull();
    expectNoReferences();
  });

  it('paused: the read-only note, Paused rows, the pause in the history', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    await pauseGodavari(sample);
    await planPage(runtime);
    expect(meta().querySelector('.xr-st--paused')).toHaveTextContent('Paused');
    const note = strip().querySelector('.ia-cp-note--paused') as HTMLElement;
    expect(text(note.querySelector('p'))).toBe(
      'Read-only while your institution’s access is paused. You can’t give or withdraw access, or ask BITS for more, until BITS lifts the pause.',
    );
    expect(strip().querySelector('.ia-cp-ask')).toBeNull();
    expect(strip().querySelector('.ia-plan-left')).toHaveTextContent(/^Paused by BITS on /);
    expect(givenTable().querySelector('tbody .xr-st--paused')).toHaveTextContent('Paused');
    expect(historyLines()[0]![0]).toBe('Access paused by BITS');
    expect(screen.queryByRole('link', { name: 'Give students access' })).toBeNull();
    expectNoReferences();
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

  it('a failed read has Try again, which reads again and keeps focus on the title', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MEERA, 'after-flow-b');
    faults(sample).failNext('InstitutionService.getAccessPlan');
    inInstitute(runtime, PLAN_PATH, <AccessPlanDetail planId="ACC-0107" />);
    const failed = await screen.findByRole('heading', {
      level: 2,
      name: 'We couldn’t load this access plan',
    });
    expect(failed.closest('.rk-state')).toHaveAttribute('role', 'alert');
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('region', { name: 'History' })).toBeVisible();
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: 'Your access plan' })).toHaveFocus(),
    );
    expectNoReferences();
  });

  it('the ending-soon plan of another institution reads the same way (Malnad, 3 days left)', async () => {
    const { runtime } = await tabPlatform(MALNAD_IA, 'after-flow-b');
    const overview = await overviewOf(runtime);
    await planPage(runtime, overview.plan!.id);
    expect(strip().querySelector('.ia-plan-left')).toHaveTextContent('3 days left');
    expectNoReferences();
  });
});

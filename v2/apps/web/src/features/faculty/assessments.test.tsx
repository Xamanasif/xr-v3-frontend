/**
 * Phase 4A, FA-06 Assessments and FA-07 Create assessment (board B4-04 f0 … f11), on the real
 * composition root and the one sample world: the list as `AssessmentService.listAssessments`
 * answers it, the guided flow through the real ports — every rule empty to start, each step checked
 * with the contract's own words, the bank's questions, Create and Save as draft — and the effect
 * on the same world: the new assessment in FA-06, and in the Student's own `listMyAssessments`
 * only once it is Ready. Fixtures: `after-flow-c` (27 Oct: Q-0101 … Q-0106 in the bank, no
 * assessment), `after-flow-d` (ASMT-0009 "Heat Exchanger — post-lab" Ready), Dr S. Ranganathan
 * (per-0014) teaching Shell-and-Tube; Dr Anita Desai (per-0015) teaching nothing.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type AssessmentId, type AttemptId, type ExperimentId, unsafeBrand } from '@xr/domain';
import { asPersonId, beginSession, faults } from '@xr/sample-platform/testing';
import { type ReactNode, type RefObject, useEffect, useMemo, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ADD_QUESTIONS,
  ASSESSMENTS_PAGE,
  CHOOSE_EXPERIMENT,
  CREATE_ASSESSMENT,
  CREATE_RESULT,
  PREVIEW_STEP,
  RULES_WORDS,
  THIS_ASSESSMENT,
} from '@/copy/assessments';
import { STATE_COPY } from '@/copy/state-copy';
import { STATE_COPY_ASSESSMENTS } from '@/copy/state-copy-assessments';
import { type AppNavigation, NavigationProvider } from '@/nav/navigation';
import type { PlatformRuntime } from '@/platform/runtime';
import { faExport } from '@/test-support/boards';
import {
  NotFoundSignal,
  renderInTab,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { FacultyAssessments } from './fa-06-assessments/assessments';
import { CreateAssessment } from './fa-07-create-assessment/create-assessment';
import { clearCreateDraft } from './fa-07-create-assessment/create-draft';

const RANGANATHAN = 'per-0014';
const DESAI = 'per-0015';
const RAHUL = 'per-0002';
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const LIST = '/faculty/assessments';
const NEW = '/faculty/assessments/new';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

beforeEach(() => {
  clearCreateDraft();
});
afterEach(() => {
  forgetLastAddress();
  clearCreateDraft();
});

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

/** Moves the test's address, as a link or the router would. */
type Router = RefObject<((href: string) => void) | null>;

/**
 * The app's navigation as the router gives it, with the Faculty pages behind their addresses: the
 * page stays mounted across its own query changes (`?step=`), and another address unmounts it.
 */
function LiveRoutes({
  start,
  moves,
  routerRef,
  children,
}: {
  readonly start: string;
  readonly moves: string[];
  readonly routerRef: Router;
  readonly children: (pathname: string) => ReactNode;
}) {
  const [address, setAddress] = useState(start);
  useEffect(() => {
    routerRef.current = setAddress;
  }, [routerRef]);
  const value = useMemo<AppNavigation>(() => {
    const url = new URL(address, 'http://localhost');
    const go = (href: string, replace: boolean) => {
      moves.push(`${replace ? 'replace' : 'push'} ${href}`);
      setAddress(href);
    };
    return {
      pathname: url.pathname,
      search: url.search,
      replace: (href) => go(href, true),
      navigate: (href, options) => go(href, options?.replace === true),
      notFound: () => {
        throw new NotFoundSignal(url.pathname);
      },
    };
  }, [address, moves]);
  return (
    <NavigationProvider value={value}>
      <WorkspaceLayout workspace="faculty">
        <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>
          {children(value.pathname)}
        </TestNotFoundBoundary>
      </WorkspaceLayout>
    </NavigationProvider>
  );
}

/** FA-06 and FA-07 at their addresses; any other address shows where the person went. */
function show(runtime: PlatformRuntime, start: string) {
  const moves: string[] = [];
  const routerRef: Router = { current: null };
  const view = renderInTab(
    <LiveRoutes start={start} moves={moves} routerRef={routerRef}>
      {(pathname) =>
        pathname === NEW ? (
          <CreateAssessment />
        ) : pathname === LIST ? (
          <FacultyAssessments />
        ) : (
          <p data-testid="elsewhere">{pathname}</p>
        )
      }
    </LiveRoutes>,
    { runtime, navigation: testNavigation(start) },
  );
  return { moves, routerRef, view };
}

const main = () => screen.getByRole('main');
const h1 = () => screen.getByRole('heading', { level: 1 });
const errorSummary = () => document.getElementById('Cc-err');
const summaryLinks = () =>
  [...(errorSummary()?.querySelectorAll('li a') ?? [])].map((link) => link.textContent);
const aside = () =>
  screen.getByRole('complementary', { name: /^(This assessment|When you create it)$/ });
/** "This assessment": each part's value (`p.fa-sum-v`). */
const asideValues = () =>
  [...aside().querySelectorAll('.fa-sum-v')].map((value) => value.textContent);
/** Each part's state, as read: "Experiment (done)", "Name (not done yet)". */
const asideStates = () => [...aside().querySelectorAll('.fa-k')].map((key) => key.textContent);
const rows = () => [...document.querySelectorAll<HTMLTableRowElement>('main tbody tr')];
/** A row's cells without the phone labels (`span.fa-lbl`). */
const cellsOf = (row: HTMLTableRowElement) =>
  [...row.querySelectorAll('td')].map((cell) => {
    const copy = cell.cloneNode(true) as HTMLElement;
    for (const label of copy.querySelectorAll('.fa-lbl')) label.remove();
    return copy.textContent ?? '';
  });
const countLine = () => main().querySelector('.rk-statusline [role="status"]');

/** Any internal reference: an assessment's, an attempt's, a question's, a draft's (the owner's rule). */
const REFERENCE = /\b(?:ASMT|ATT|Q|D|REQ|ACC|UPD|DTR|SUB|SUP)-\d+/;

/**
 * No reference in the document's words (screen-reader-only words included), in a field's value,
 * in any `aria-label`, `title` or `placeholder`, or in the browser tab (WHAT-CHANGED P10).
 */
function expectNoReferences() {
  expect(document.body.textContent ?? '').not.toMatch(REFERENCE);
  for (const control of document.querySelectorAll('input, textarea')) {
    expect((control as HTMLInputElement | HTMLTextAreaElement).value).not.toMatch(REFERENCE);
  }
  for (const element of document.querySelectorAll('[aria-label], [title], [placeholder]')) {
    for (const name of ['aria-label', 'title', 'placeholder']) {
      expect(element.getAttribute(name) ?? '').not.toMatch(REFERENCE);
    }
  }
  expect(document.title).not.toMatch(REFERENCE);
}

async function waitForStep(title: string) {
  await waitFor(() => expect(h1()).toHaveTextContent(title));
}

/** Step 1 → 2: the one experiment chosen and "Continue". */
async function toRules(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('radio', { name: new RegExp(SHELL_NAME) }));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await waitForStep('Set the rules');
}

/** Step 2 with every rule, as the export's sample (typed, never defaults). */
async function fillRules(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(RULES_WORDS.name), 'Heat Exchanger — post-lab');
  await user.type(screen.getByLabelText(RULES_WORDS.passMark), '50');
  await user.type(screen.getByLabelText(RULES_WORDS.attempts), '2');
  await user.type(screen.getByLabelText(RULES_WORDS.deadline), '14 Nov 2026, 23:59');
  await user.click(screen.getByRole('radio', { name: /After the deadline/ }));
}

/** A bank question's box, named by its words (never its reference). */
async function tick(user: ReturnType<typeof userEvent.setup>, words: string) {
  await user.click(await screen.findByRole('checkbox', { name: words }));
}

const Q0101 = 'What does the effectiveness (ε) of a heat exchanger compare?';
const Q0102 = 'How is the number of transfer units (NTU) defined?';
const Q0104 = 'Fouling on the tube surfaces lowers the overall heat transfer coefficient U.';
const Q0106 =
  'Explain how fouling changes the exchanger’s performance, using what you observed in the simulation.';

/** Rahul answers the written question and submits (the Student's own ports, the same world). */
async function rahulSubmits(sample: Sample, assessmentId: string) {
  const rahul = asPersonId(sample, RAHUL);
  let attempt = ok(await rahul.assessments.startAttempt(unsafeBrand<AssessmentId>(assessmentId)));
  attempt = ok(
    await rahul.assessments.saveAnswer({
      attemptId: attempt.id as AttemptId,
      questionId: unsafeBrand('Q-0106'),
      answer: { type: 'written', text: 'Fouling adds a resistance, so U falls.' },
      expectedRev: attempt.rev,
    }),
  );
  ok(
    await rahul.assessments.submitAttempt({
      attemptId: attempt.id as AttemptId,
      expectedRev: attempt.rev,
    }),
  );
}

/** The Faculty member's own ports saving a draft (the CI seam in browser tests is `actAs`). */
async function saveDraftBehind(sample: Sample, questions: readonly string[] = []) {
  return ok(
    await asPersonId(sample, RANGANATHAN).assessments.createAssessment({
      mode: 'save-as-draft',
      experimentId: unsafeBrand<ExperimentId>(SHELL),
      name: 'Heat Exchanger — post-lab',
      introduction: null,
      rules: {
        passMarkPercent: '50',
        attemptsAllowed: '2',
        deadline: '2026-11-14T23:59:00+05:30',
        releaseOption: 'after-deadline',
        releaseDate: null,
      },
      questions: questions.map((id) => unsafeBrand(id)),
    }),
  );
}

// ---- the words are the export's ------------------------------------------------------------------

describe('FA-v1 words (FA-06, FA-07)', () => {
  const EXPORT = (() => {
    const raw = faExport('Main.dc.html');
    return `${raw
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')}\n${raw}`;
  })();
  const strings = (value: unknown): string[] =>
    typeof value === 'string'
      ? [value]
      : Array.isArray(value)
        ? value.flatMap(strings)
        : value && typeof value === 'object'
          ? Object.values(value).flatMap(strings)
          : [];
  // The product's own words the export does not draw (each a state-copy entry or the role's
  // shared words): "Create another" (`FA-07.result`), the toolbar's "Search" label is the export's.
  // A colleague's submissions line says the export's in the product's words for co-teaching (B8-03
  // allows no role-name variant; checked below).
  const PRODUCT_ONLY = new Set<string>([
    CREATE_RESULT.another,
    ASSESSMENTS_PAGE.coTeacherSubmissions,
  ]);
  const drawn = [
    ...strings(ASSESSMENTS_PAGE),
    ...strings(CREATE_ASSESSMENT),
    ...strings(CHOOSE_EXPERIMENT),
    ...strings(RULES_WORDS),
    ...strings(THIS_ASSESSMENT),
    ...strings(ADD_QUESTIONS),
    ...strings(PREVIEW_STEP),
    ...strings(CREATE_RESULT),
  ]
    .map((phrase) => phrase.trim())
    .filter((phrase) => !PRODUCT_ONLY.has(phrase));

  it.each(drawn)('“%s” is in the export', (phrase) => {
    expect(EXPORT).toContain(phrase);
  });

  it('a colleague’s submissions line is the export’s, in the product’s words for co-teaching', () => {
    expect(EXPORT).toContain('Submissions aren’t shown to co-teachers yet');
    expect(ASSESSMENTS_PAGE.coTeacherSubmissions).toBe(
      'Submissions aren’t shown to co-teaching colleagues yet',
    );
  });

  it('every undrawn word is a provisional register entry, read from the one register', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_ASSESSMENTS)) {
      expect(entry.status, id).toBe('provisional');
      expect(STATE_COPY[id as keyof typeof STATE_COPY], id).toBe(entry);
      expect(entry.words ?? '', id).not.toMatch(/\b(?:OD|T|PC|DEV|VD)-[\w-]+/);
    }
  });
});

// ---- FA-06 Assessments -------------------------------------------------------------------------

describe('FA-06 — the assessments as the service lists them', () => {
  it('the head, the toolbar and the row: name, experiment, deadline, submissions, state', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    show(runtime, LIST);
    expect(await screen.findByRole('heading', { level: 2, name: 'All assessments' })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(h1()).toHaveTextContent('Assessments');
    expect(main().querySelector('.rk-head .rk-sub')).toHaveTextContent(
      'Assessments for the experiments you teach. Rules and pass marks belong to each assessment.',
    );
    await waitFor(() => expect(rows()).toHaveLength(1));
    const create = within(main()).getByRole('link', { name: 'Create assessment' });
    expect(create).toHaveAttribute('href', NEW);
    expect(create).toHaveClass('rb-btn', 'rb-btn--primary', 'rb-btn--lg');
    expect(create.querySelector('svg')).not.toBeNull();
    // The shell: Assessments current.
    expect(
      screen.getByRole('navigation', { name: /Faculty/ }).querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', LIST);

    const section = screen.getByRole('region', { name: 'All assessments' });
    expect(countLine()).toHaveTextContent('1 assessment');
    const tools = within(section).getByRole('search', { name: 'Filter assessments' });
    expect(within(tools).getByLabelText('Search')).toHaveAttribute(
      'placeholder',
      'Name or experiment',
    );
    const options = (label: string) =>
      [...within(tools).getByLabelText(label).querySelectorAll('option')].map(
        (option) => option.textContent,
      );
    expect(options('Course')).toEqual(['All courses', 'ME ZG523']);
    expect(options('State')).toEqual([
      'All states',
      'Draft — not ready',
      'Ready',
      'Waiting for marking',
    ]);
    expect(within(tools).getByLabelText('State').closest('.rk-field')).toHaveClass('fa-field-sel');
    expect(section.querySelector('table caption')).toHaveTextContent(
      'Assessments for the experiments you teach',
    );
    expect([...section.querySelectorAll('th')].map((header) => header.textContent)).toEqual([
      'Assessment',
      'Experiment',
      'Deadline',
      'Submissions',
      'State',
    ]);
    const cells = cellsOf(rows()[0]!);
    expect(cells[0]).toBe('Heat Exchanger — post-lab');
    expect(cells[1]).toBe('Shell-and-Tube Heat ExchangerME ZG523 · Thermodynamics & Heat Transfer');
    // After Flow D the deadline has passed (today is the session's 15 Nov 2026).
    expect(cells[2]).toBe('14 Nov 2026, 23:59Deadline passed');
    // One Godavari student has the experiment in this world (the export's "2 of 5" is sample).
    expect(cells[3]).toBe('1 of 1 students submitted');
    expect(rows()[0]!.querySelector('.fa-cellmeter .fa-units i.is-sub')).not.toBeNull();
    expect(cells[4]).toBe('Ready');
    expect(rows()[0]!.querySelector('.xr-st--ok')).toHaveTextContent('Ready');
    // The whole row opens the record; its link is named by content, never the reference.
    const link = within(rows()[0]!).getByRole('link', {
      name: 'Open Heat Exchanger — post-lab, Ready',
    });
    expect(link).toHaveAttribute('href', '/faculty/assessments/ASMT-0009');
    expect(link).toHaveClass('rk-rowlink');
    // No availability or release control, nothing that opens marking (T-18; DEV-21).
    expect(main()).not.toHaveTextContent(/Make available|Publish|Release|Mark now|Mark next/);
    expectNoReferences();
  });

  it('a press on the row follows its link', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    show(runtime, LIST);
    await waitFor(() => expect(rows()).toHaveLength(1));
    const link = within(rows()[0]!).getByRole('link');
    const followed = vi.fn();
    link.addEventListener('click', (event) => {
      event.preventDefault();
      followed();
    });
    await user.click(rows()[0]!.querySelectorAll('td')[2]!);
    expect(followed).toHaveBeenCalledTimes(1);
  });

  it('days left while Ready and open; a submission waiting for marking; the State filter', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const created = ok(
      await asPersonId(sample, RANGANATHAN).assessments.createAssessment({
        mode: 'create',
        experimentId: unsafeBrand<ExperimentId>(SHELL),
        name: 'Heat Exchanger — post-lab',
        introduction: null,
        rules: {
          passMarkPercent: '50',
          attemptsAllowed: '2',
          deadline: '2026-11-14T23:59:00+05:30',
          releaseOption: 'after-deadline',
          releaseDate: null,
        },
        questions: [unsafeBrand('Q-0101'), unsafeBrand('Q-0106')],
      }),
    );
    await rahulSubmits(sample, created.id);
    show(runtime, LIST);
    await waitFor(() => expect(rows()).toHaveLength(1));
    const cells = cellsOf(rows()[0]!);
    // Today on the session's clock is 27 Oct 2026 after Flow C: 18 days to 14 Nov.
    expect(cells[2]).toBe('14 Nov 2026, 23:5918 days left');
    expect(rows()[0]!.querySelector('.fa-left')).toHaveTextContent('18 days left');
    expect(cells[3]).toBe('1 of 1 students submitted1 waiting for marking');
    expect(rows()[0]!.querySelector('.fa-xwait')).toHaveTextContent('1 waiting for marking');

    await user.selectOptions(screen.getByLabelText('State'), 'Waiting for marking');
    expect(rows()).toHaveLength(1);
    expect(countLine()).toHaveTextContent('1 of 1 assessment');
    expect(
      screen.getByRole('button', { name: 'Remove filter State: Waiting for marking' }),
    ).toBeVisible();
    await user.selectOptions(screen.getByLabelText('State'), 'Draft — not ready');
    expect(rows()).toHaveLength(0);
    expect(main()).toHaveTextContent('No assessment matches these filters');
    expectNoReferences();
  });

  it('search and the filters narrow the list; chips; no match; “Clear filters” brings the rows back', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    show(runtime, LIST);
    await waitFor(() => expect(rows()).toHaveLength(1));
    const search = screen.getByLabelText('Search');
    await user.type(search, 'shell-and');
    expect(rows()).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Remove filter Search: “shell-and”' })).toBeVisible();
    await user.clear(search);
    // The search still matches the reference the service keys it by; no row prints it.
    await user.type(search, 'asmt-0009');
    expect(rows()).toHaveLength(1);
    await user.type(search, 'x');
    expect(rows()).toHaveLength(0);
    expect(main().querySelector('.rk-state')).toHaveTextContent(
      'No assessment matches these filtersTry fewer filters or a different spelling of the name or experiment.',
    );
    expect(countLine()).toHaveTextContent('0 of 1 assessment');
    const clears = screen.getAllByRole('button', { name: 'Clear filters' });
    await user.click(clears[clears.length - 1]!);
    expect(rows()).toHaveLength(1);
    expect(search).toHaveValue('');
    await waitFor(() => expect(search).toHaveFocus());
    await user.selectOptions(screen.getByLabelText('Course'), 'ME ZG523');
    await user.selectOptions(screen.getByLabelText('State'), 'Ready');
    expect(rows()).toHaveLength(1);
    // Removing a chip moves focus to the field it filtered.
    await user.click(screen.getByRole('button', { name: 'Remove filter Course: ME ZG523' }));
    expect(screen.getByLabelText('Course')).toHaveFocus();
    expect(screen.getByLabelText('Course')).toHaveValue('');
  });

  it('“No assessments yet” before any, with Create assessment', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    show(runtime, LIST);
    expect(await screen.findByText('No assessments yet')).toBeVisible();
    const state = main().querySelector('.rk-state.rk-state--roomy')!;
    expect(state).toHaveTextContent(
      'No assessments yetCreate an assessment for an experiment you teach. You can save a draft while you add questions.',
    );
    expect(state.querySelector('.rk-state-ico svg')).not.toBeNull();
    // The head draws its action once there is an assessment; the empty state draws it here.
    const creates = screen.getAllByRole('link', { name: 'Create assessment' });
    expect(creates).toHaveLength(1);
    expect(creates[0]).toHaveAttribute('href', NEW);
    expect(creates[0]).toHaveClass('rb-btn--primary');
    expect(creates[0]!.querySelector('svg')).toBeNull();
    expect(document.querySelector('.rk-toolbar')).toBeNull();
  });

  it('no course assigned: the message card, nothing to create', async () => {
    const { runtime } = await tabPlatform(DESAI, 'after-flow-c');
    show(runtime, LIST);
    const card = await screen.findByRole('region', { name: 'No assessments yet' });
    expect(card).toHaveClass('rk-surface', 'fa-msgcard');
    expect(card).toHaveTextContent(
      'Assessments appear here when your Institute Admin assigns you a course.',
    );
    expect(screen.queryByRole('link', { name: 'Create assessment' })).toBeNull();
    expect(document.querySelector('table')).toBeNull();
  });

  it('a draft: Draft — not ready and what it lacks', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await saveDraftBehind(sample);
    show(runtime, LIST);
    await waitFor(() => expect(rows()).toHaveLength(1));
    const cells = cellsOf(rows()[0]!);
    expect(cells[2]).toBe('14 Nov 2026, 23:59');
    expect(cells[3]).toBe('No questions yet · students can’t see it');
    expect(cells[4]).toBe('Draft — not ready');
    const pill = rows()[0]!.querySelector('.xr-st')!;
    expect(pill).toHaveTextContent('Draft — not ready');
    expect(pill.className).toBe('xr-st');
    expect(
      within(rows()[0]!).getByRole('link', {
        name: 'Open Heat Exchanger — post-lab, Draft — not ready',
      }),
    ).toHaveAttribute('href', '/faculty/assessments/ASMT-0009');
    expectNoReferences();
  });

  it('announces loading; a failed read has Try again, which reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    faults(sample).failNext('AssessmentService.listAssessments');
    renderInTab(<FacultyAssessments />, { runtime, navigation: testNavigation(LIST) });
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      'Loading assessments',
    );
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'We couldn’t load the assessmentsNothing has changed. Try again.',
    );
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(h1()).toHaveFocus();
    await waitFor(() => expect(document.querySelectorAll('tbody tr')).toHaveLength(1));
  });
});

// ---- FA-07 Create assessment -------------------------------------------------------------------

describe('FA-07 — step 1, choose the experiment', () => {
  it('the crumbs, the steps, the experiments taught, Cancel and Continue, and an empty summary', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    show(runtime, NEW);
    const radio = await screen.findByRole('radio', { name: new RegExp(SHELL_NAME) });
    expect(h1()).toHaveTextContent('Choose the experiment');
    expect(main().querySelector('.rk-head .rk-eyebrow')).toHaveTextContent('Step 1 of 4');
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(crumbs).getByRole('link', { name: 'Assessments' })).toHaveAttribute('href', LIST);
    expect(crumbs.querySelector('[aria-current="page"]')).toHaveTextContent('Create assessment');
    const steps = screen.getByRole('list', { name: 'Steps to create an assessment' });
    expect([...steps.querySelectorAll('.fa-step-l')].map((step) => step.textContent)).toEqual([
      'Experiment',
      'Rules',
      'Questions',
      'Preview',
    ]);
    expect(steps.querySelector('[aria-current="step"]')).toHaveTextContent(
      '1Experiment, current step',
    );
    const card = radio.closest('label.rk-choice')!;
    expect(card).toHaveClass('fa-expchoice');
    await waitFor(() =>
      expect(card.querySelector('.rk-choice-d')).toHaveTextContent(
        'ME ZG523 · Thermodynamics & Heat Transfer · No assessment yet',
      ),
    );
    await waitFor(() =>
      expect(card.querySelector('.fa-expchoice-m')).toHaveTextContent('WEBVR1 student with access'),
    );
    expect(
      within(card as HTMLElement).getByRole('img', {
        name: 'Formats your institution has: WEB, VR',
      }),
    ).toBeVisible();
    expect(radio).not.toBeChecked();
    expect(within(main()).getByRole('group', { name: /^Experiment/ })).toBeVisible();
    expect(main()).toHaveTextContent(
      'Assessments are set per experiment, not per format. Students get the formats their institution holds.',
    );
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', LIST);
    expect(screen.queryByRole('button', { name: 'Save as draft' })).toBeNull();
    expect(asideValues()).toEqual(['Not chosen yet', 'Not named yet', 'Not set yet', 'None yet']);
    expect(asideStates()).toEqual([
      'Experiment (not done yet)',
      'Name (not done yet)',
      'Rules (not done yet)',
      'Questions (not done yet)',
    ]);
    expect(aside()).toHaveTextContent('Nothing is saved until you create it or save a draft.');
    expectNoReferences();
  });

  it('Continue with nothing chosen: “Choose an experiment”, the summary takes focus', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    show(runtime, NEW);
    await screen.findByRole('radio', { name: new RegExp(SHELL_NAME) });
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(errorSummary()).toHaveFocus();
    expect(errorSummary()).toHaveTextContent('Check this step');
    expect(summaryLinks()).toEqual(['Choose an experiment']);
    expect(document.getElementById('Cc-exp-e')).toHaveTextContent('Choose an experiment');
    expect(document.getElementById('Cc-exp')).toHaveClass('is-invalid');
    await user.click(screen.getByRole('link', { name: 'Choose an experiment' }));
    // The link moves focus into the group: its first option.
    expect(screen.getByRole('radio', { name: new RegExp(SHELL_NAME) })).toHaveFocus();
    await user.click(screen.getByRole('radio', { name: new RegExp(SHELL_NAME) }));
    expect(errorSummary()).toBeNull();
    expect(asideValues()[0]).toBe(SHELL_NAME);
    expect(asideStates()[0]).toBe('Experiment (done)');
  });

  it('an experiment that already has an assessment: the notice, then the refusal on Continue', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    const { moves } = show(runtime, NEW);
    const radio = await screen.findByRole('radio', { name: new RegExp(SHELL_NAME) });
    await waitFor(() =>
      expect(radio.closest('label')).toHaveTextContent(
        'Already has an assessment: Heat Exchanger — post-lab',
      ),
    );
    await user.click(radio);
    const notice = main().querySelector('.rk-notice--info')!;
    expect(notice).toHaveTextContent(
      'This experiment already has an assessmentOpen Heat Exchanger — post-lab to change its questions or rules. One assessment per experiment is how this works for now.Open Heat Exchanger — post-lab',
    );
    expect(
      within(notice as HTMLElement).getByRole('link', { name: 'Open Heat Exchanger — post-lab' }),
    ).toHaveAttribute('href', '/faculty/assessments/ASMT-0009');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(summaryLinks()).toEqual(['This experiment already has an assessment']);
    expect(document.getElementById('Cc-exp-e')).toHaveTextContent(
      'This experiment already has an assessment',
    );
    expect(h1()).toHaveTextContent('Choose the experiment');
    expect(moves).toEqual([]);
    expectNoReferences();
  });

  it('a Faculty member with no course mapped: nothing to set an assessment on', async () => {
    const { runtime } = await tabPlatform(DESAI, 'after-flow-c');
    show(runtime, NEW);
    const card = await screen.findByRole('region', { name: 'Nothing to set an assessment on yet' });
    expect(card).toHaveClass('fa-msgcard');
    expect(card).toHaveTextContent(
      'Assessments are set per experiment you teach. Your Institute Admin hasn’t assigned you a course yet.',
    );
    expect(within(card).getByRole('link', { name: 'Back to Assessments' })).toHaveAttribute(
      'href',
      LIST,
    );
    expect(screen.queryByRole('radio')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
    expect(screen.queryByRole('list', { name: 'Steps to create an assessment' })).toBeNull();
  });

  it('?experimentId= chooses the experiment (FA-05’s way in)', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    show(runtime, `${NEW}?experimentId=${SHELL}`);
    await waitFor(() =>
      expect(screen.getByRole('radio', { name: new RegExp(SHELL_NAME) })).toBeChecked(),
    );
    expect(asideValues()[0]).toBe(SHELL_NAME);
  });

  it('announces loading while the experiments you teach are read', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    renderInTab(<CreateAssessment />, { runtime, navigation: testNavigation(NEW) });
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      'Loading the experiments you teach',
    );
    expect(await screen.findByRole('radio', { name: new RegExp(SHELL_NAME) })).toBeVisible();
  });

  it('the options failing: Try again reads them again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    faults(sample).failNext('AssessmentService.getCreateOptions');
    show(runtime, NEW);
    expect(await screen.findByText('We couldn’t load the experiments you teach')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('radio', { name: new RegExp(SHELL_NAME) })).toBeVisible();
  });
});

describe('FA-07 — the whole flow on the one world (after-flow-c)', () => {
  it('rules start empty and are checked with the service’s words; questions from the bank; Create; FA-06 and the Student see it', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { moves } = show(runtime, NEW);
    await toRules(user);
    expect(moves).toEqual(['push /faculty/assessments/new?step=rules']);
    expect(h1()).toHaveFocus();
    expect(main().querySelector('.rk-head .rk-eyebrow')).toHaveTextContent('Step 2 of 4');
    expect(
      screen.getByRole('list', { name: 'Steps to create an assessment' }).querySelector('.is-done'),
    ).toHaveTextContent('Experiment, done');
    // Every field blank, no release option chosen — nothing pre-filled (BC6, T-19).
    for (const label of [
      RULES_WORDS.name,
      RULES_WORDS.introduction,
      RULES_WORDS.passMark,
      RULES_WORDS.attempts,
      RULES_WORDS.deadline,
    ]) {
      expect(screen.getByLabelText(label)).toHaveValue('');
    }
    for (const radio of screen.getAllByRole('radio')) expect(radio).not.toBeChecked();
    expect(screen.getByRole('group', { name: 'Name and introduction' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'Rules' })).toBeVisible();
    expect(screen.getByLabelText(RULES_WORDS.passMark).closest('.fa-fields3')).not.toBeNull();
    expect(main()).toHaveTextContent(
      'No time limit and no timer. Every value here is set for this assessment only — nothing comes pre-filled.',
    );
    expect(main()).not.toHaveTextContent(/timer:|time limit \(|minutes/i);
    expect(screen.getByRole('button', { name: 'Save as draft' })).toBeVisible();
    expect(asideValues()).toEqual([SHELL_NAME, 'Not named yet', 'Not set yet', 'None yet']);

    // The step's check, as the contract checks it.
    await user.type(screen.getByLabelText(RULES_WORDS.name), 'Heat Exchanger — post-lab');
    await user.type(screen.getByLabelText(RULES_WORDS.passMark), '50.5');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(errorSummary()).toHaveFocus();
    expect(summaryLinks()).toEqual([
      'Enter a pass mark from 0 to 100, as a whole number',
      'Enter how many attempts are allowed, as a whole number',
      'Enter the deadline',
      'Choose when students see their result',
    ]);
    expect(screen.getByLabelText(RULES_WORDS.passMark)).toHaveAttribute('aria-invalid', 'true');
    expect(document.getElementById('Cc-pass-e')).toHaveTextContent(
      'Enter a pass mark from 0 to 100, as a whole number',
    );
    expect(document.getElementById('Cc-rel-e')).toHaveTextContent(
      'Choose when students see their result',
    );
    expect(asideValues()[1]).toBe('Heat Exchanger — post-lab');
    expect(asideValues()[2]).toBe('Pass mark 50.5%');
    expect(asideStates()[2]).toBe('Rules (not done yet)');
    expect(h1()).toHaveTextContent('Set the rules');
    expect(moves).toHaveLength(1);

    // Typing in a field takes its error away.
    await user.clear(screen.getByLabelText(RULES_WORDS.passMark));
    await user.type(screen.getByLabelText(RULES_WORDS.passMark), '50');
    expect(document.getElementById('Cc-pass-e')).toBeNull();
    expect(summaryLinks()).toHaveLength(3);
    await user.type(screen.getByLabelText(RULES_WORDS.attempts), '2');
    await user.type(screen.getByLabelText(RULES_WORDS.deadline), '14 Nov 2026, 23:59');
    await user.click(screen.getByRole('radio', { name: /After the deadline/ }));
    expect(asideValues()[2]).toBe(
      'Pass mark 50% · 2 attempts · due 14 Nov 2026, 23:59 · results after the deadline',
    );
    expect(asideStates()[2]).toBe('Rules (done)');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitForStep('Add questions');

    // The bank's questions for this experiment, named by their words; Continue needs one.
    const list = await screen.findByRole('group', { name: 'Questions for this assessment' });
    expect(within(list).getAllByRole('checkbox')).toHaveLength(6);
    expect(main()).toHaveTextContent(
      'From your question bankShell-and-Tube Heat Exchanger · ME ZG523',
    );
    expect(main().querySelector('.fa-pickcount')).toHaveTextContent('No questions chosen yet');
    const first = within(list).getByRole('checkbox', { name: Q0101 });
    expect(first).toHaveAccessibleDescription('Multiple choice · 2 marks');
    expect(screen.getByRole('link', { name: 'New question' })).toHaveAttribute(
      'href',
      '/faculty/question-bank/new?experimentId=shell-and-tube-heat-exchanger&returnTo=%2Ffaculty%2Fassessments%2Fnew%3Fstep%3Dquestions%26experimentId%3Dshell-and-tube-heat-exchanger',
    );
    // Phase 4B: the drafting and import tools open for this experiment.
    expect(screen.getByRole('link', { name: 'Draft with assistance' })).toHaveAttribute(
      'href',
      '/faculty/question-bank/draft?experimentId=shell-and-tube-heat-exchanger',
    );
    expect(screen.getByRole('link', { name: 'Import' })).toHaveAttribute(
      'href',
      '/faculty/question-bank/import?experimentId=shell-and-tube-heat-exchanger',
    );
    expect(main()).toHaveTextContent(
      'Questions keep the marks set in your bank. Choice questions are marked automatically; you mark written answers.',
    );
    expectNoReferences();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(summaryLinks()).toEqual(['Add at least one question, or save as a draft']);
    expect(document.getElementById('Cc-qs-e')).toHaveTextContent(
      'Add at least one question, or save as a draft',
    );
    await tick(user, Q0106);
    await tick(user, Q0101);
    await tick(user, Q0104);
    expect(errorSummary()).toBeNull();
    expect(main().querySelector('.fa-pickcount')).toHaveTextContent('3 questions · 14 marks');
    expect(asideValues()[3]).toBe('3 questions · 14 marks');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitForStep('Preview and create');

    // What students will see before they start, in the bank's order.
    expect(main()).toHaveTextContent(
      'What students will see before they start. Previewing creates no attempt.',
    );
    const facts = main().querySelector('dl.fa-rules')!;
    expect([...facts.querySelectorAll('dt')].map((term) => term.textContent)).toEqual([
      'Name',
      'Questions',
      'Pass mark',
      'Attempts allowed',
      'Deadline',
      'Result and answers',
      'Time limit',
    ]);
    expect([...facts.querySelectorAll('dd')].map((value) => value.textContent)).toEqual([
      'Heat Exchanger — post-lab',
      '3 questions · 14 marks',
      '50% · 7 of 14 marks',
      '2',
      '14 Nov 2026, 23:59',
      'After the deadline',
      'None',
    ]);
    expect(main().querySelector('.fa-introbox')).toHaveTextContent('IntroductionNone');
    expect(
      [...main().querySelectorAll('ol.fa-qlist > li.fa-q')].map((item) => item.textContent),
    ).toEqual([
      `1${Q0101}Multiple choice2 marks`,
      `2${Q0104}True or false2 marks`,
      `3${Q0106}Written answer10 marks`,
    ]);
    // Beside step 4: what creating does.
    expect(aside()).toHaveTextContent('When you create it');
    expect(
      [...screen.getByRole('list', { name: 'What creating does' }).querySelectorAll('li')].map(
        (item) => item.textContent,
      ),
    ).toEqual([
      `Students who have ${SHELL_NAME} can see it in Assessments and start it.`,
      'Choice questions are marked automatically; you mark written answers.',
      'You can change it later from its tabs. A change after students submit makes a new version.',
    ]);
    // Previewing created nothing.
    expect(ok(await asPersonId(sample, RANGANATHAN).assessments.listAssessments())).toEqual([]);

    await user.click(screen.getByRole('button', { name: 'Create assessment' }));
    await waitForStep('Assessment created');
    expect(h1()).toHaveFocus();
    expect(main().querySelector('.rk-head .rk-eyebrow')).toHaveTextContent('Create assessment');
    expect(screen.queryByRole('list', { name: 'Steps to create an assessment' })).toBeNull();
    expect(
      screen.queryByRole('complementary', { name: /^(This assessment|When you create it)$/ }),
    ).toBeNull();
    const result = main().querySelector('.fa-result')!;
    expect(result.querySelector('.xr-st.xr-st--ok.rk-st-lg')).toHaveTextContent('Ready');
    expect(result.querySelector('.fa-result-t')).toHaveTextContent(
      'Students who have Shell-and-Tube Heat Exchanger can now see it in Assessments and start it.',
    );
    const checklist = screen.getByRole('list', { name: 'Ready checklist' });
    expect(checklist.querySelectorAll('li.is-ok')).toHaveLength(3);
    expect([...checklist.querySelectorAll('li')].map((item) => item.textContent)).toEqual([
      'Name and introduction',
      'Rules set for this assessment',
      '3 questions · 14 marks',
    ]);
    expect(screen.getByRole('link', { name: 'Open assessment' })).toHaveAttribute(
      'href',
      '/faculty/assessments/ASMT-0009',
    );
    expect(screen.getByRole('link', { name: 'Back to Assessments' })).toHaveAttribute('href', LIST);
    // The created card names the assessment's readiness, never its reference.
    expectNoReferences();

    // The one world: the record as the service holds it…
    const view = ok(
      await asPersonId(sample, RANGANATHAN).assessments.getAssessment(
        unsafeBrand<AssessmentId>('ASMT-0009'),
      ),
    );
    expect(view.readiness).toBe('ready');
    expect(view.questions.map((entry) => entry.ref.questionId)).toEqual([
      'Q-0101',
      'Q-0104',
      'Q-0106',
    ]);
    expect(view.assessment.rules).toEqual({
      passMarkPercent: 50,
      attemptsAllowed: 2,
      deadline: '2026-11-14T18:29:00.000Z',
      release: { option: 'after-deadline', releaseDate: null },
    });
    // …Rahul (same platform, his own session) sees it in Assessments…
    const mine = ok(await asPersonId(sample, RAHUL).assessments.listMyAssessments());
    expect(mine.map((row) => [row.assessment.id, row.experimentName])).toEqual([
      ['ASMT-0009', SHELL_NAME],
    ]);
  });

  it('the created assessment is in FA-06 as Ready, and nothing typed is kept', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { routerRef } = show(runtime, NEW);
    await toRules(user);
    await fillRules(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitForStep('Add questions');
    await tick(user, Q0101);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitForStep('Preview and create');
    await user.click(screen.getByRole('button', { name: 'Create assessment' }));
    await waitForStep('Assessment created');

    act(() => routerRef.current!(LIST));
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(cellsOf(rows()[0]!)[4]).toBe('Ready');
    expect(cellsOf(rows()[0]!)[3]).toBe('0 of 1 students submitted');

    // FA-07 again starts empty, and its experiment now has an assessment.
    act(() => routerRef.current!(NEW));
    const radio = await screen.findByRole('radio', { name: new RegExp(SHELL_NAME) });
    expect(radio).not.toBeChecked();
    await waitFor(() =>
      expect(radio.closest('label')).toHaveTextContent(
        'Already has an assessment: Heat Exchanger — post-lab',
      ),
    );
  });

  it('“Create another” starts again at step 1 with nothing kept; “Back to Assessments” is FA-06', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { moves } = show(runtime, NEW);
    await toRules(user);
    await user.type(screen.getByLabelText(RULES_WORDS.name), 'Heat Exchanger — post-lab');
    await user.click(screen.getByRole('button', { name: 'Save as draft' }));
    await waitForStep('Saved as draft');
    expect(screen.getByRole('link', { name: 'Back to Assessments' })).toHaveAttribute('href', LIST);
    await user.click(screen.getByRole('button', { name: 'Create another' }));
    await waitForStep('Choose the experiment');
    expect(moves.at(-1)).toBe('push /faculty/assessments/new');
    expect(h1()).toHaveFocus();
    expect(asideValues()).toEqual(['Not chosen yet', 'Not named yet', 'Not set yet', 'None yet']);
  });
});

describe('FA-07 — Save as draft', () => {
  it('needs a name only: “Enter a name to save a draft”', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    show(runtime, NEW);
    await toRules(user);
    await user.click(screen.getByRole('button', { name: 'Save as draft' }));
    expect(errorSummary()).toHaveFocus();
    expect(summaryLinks()).toEqual(['Enter a name to save a draft']);
    expect(document.getElementById('Cc-name-e')).toHaveTextContent('Enter a name to save a draft');
  });

  it('a draft with its rules and no question: Draft — not ready; FA-06 lists it; Rahul does not see it', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { routerRef } = show(runtime, NEW);
    await toRules(user);
    await fillRules(user);
    await user.click(screen.getByRole('button', { name: 'Save as draft' }));
    await waitForStep('Saved as draft');
    expect(main().querySelector('.rk-head .rk-eyebrow')).toHaveTextContent('Create assessment');
    const result = main().querySelector('.fa-result')!;
    expect(result.querySelector('.xr-st.rk-st-lg')).toHaveTextContent('Draft — not ready');
    expect(result.querySelector('.fa-result-t')).toHaveTextContent(
      'Students can’t see a draft. Finish what’s missing on the assessment.',
    );
    const checklist = screen.getByRole('list', { name: 'Ready checklist' });
    const items = [...checklist.querySelectorAll('li')];
    expect(items[0]).toHaveClass('is-ok');
    expect(items[0]).toHaveTextContent('Name and introduction');
    expect(items[1]).toHaveClass('is-ok');
    expect(items[1]).toHaveTextContent('Rules set for this assessment');
    expect(items[2]).toHaveClass('is-no');
    expect(items[2]).toHaveTextContent('At least one question — none yet');
    expect(screen.getByRole('link', { name: 'Open assessment' })).toHaveAttribute(
      'href',
      '/faculty/assessments/ASMT-0009',
    );
    expectNoReferences();

    expect(ok(await asPersonId(sample, RAHUL).assessments.listMyAssessments())).toEqual([]);
    act(() => routerRef.current!(LIST));
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(cellsOf(rows()[0]!).slice(3, 5)).toEqual([
      'No questions yet · students can’t see it',
      'Draft — not ready',
    ]);
  });

  it('from step 2 with some rules: the draft keeps them; the checklist says what is missing', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    show(runtime, NEW);
    await toRules(user);
    await user.type(screen.getByLabelText(RULES_WORDS.name), 'Heat Exchanger — post-lab');
    await user.type(screen.getByLabelText(RULES_WORDS.passMark), '50');
    await user.click(screen.getByRole('button', { name: 'Save as draft' }));
    await waitForStep('Saved as draft');
    const view = ok(
      await asPersonId(sample, RANGANATHAN).assessments.getAssessment(
        unsafeBrand<AssessmentId>('ASMT-0009'),
      ),
    );
    expect(view.readiness).toBe('draft-not-ready');
    expect(view.assessment.rules.passMarkPercent).toBe(50);
    expect(view.assessment.rules.attemptsAllowed).toBeNull();
    const items = [...screen.getByRole('list', { name: 'Ready checklist' }).querySelectorAll('li')];
    expect(items.map((item) => item.className)).toEqual(['is-ok', 'is-no', 'is-no']);
    expect(items[1]).toHaveTextContent('Rules — not finished');
  });

  it('from step 3 with questions: the draft keeps them', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    show(runtime, NEW);
    await toRules(user);
    await user.type(screen.getByLabelText(RULES_WORDS.name), 'Heat Exchanger — post-lab');
    await fillRulesRest(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitForStep('Add questions');
    await tick(user, Q0101);
    await user.click(screen.getByRole('button', { name: 'Save as draft' }));
    await waitForStep('Saved as draft');
    const view = ok(
      await asPersonId(sample, RANGANATHAN).assessments.getAssessment(
        unsafeBrand<AssessmentId>('ASMT-0009'),
      ),
    );
    expect(view.questions.map((entry) => entry.ref.questionId)).toEqual(['Q-0101']);
    expect(screen.getByRole('list', { name: 'Ready checklist' })).toHaveTextContent(
      '1 question · 2 marks',
    );
  });
});

/** The rules but the name (step 2 after the name was typed). */
async function fillRulesRest(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(RULES_WORDS.passMark), '50');
  await user.type(screen.getByLabelText(RULES_WORDS.attempts), '2');
  await user.type(screen.getByLabelText(RULES_WORDS.deadline), '14 Nov 2026, 23:59');
  await user.click(screen.getByRole('radio', { name: /After the deadline/ }));
}

describe('FA-07 — refusals and failures', () => {
  it('the bank failing in step 3: Try again reads it again; what was chosen stays', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    // The bank is read once an experiment is chosen (the summary counts its marks).
    faults(sample).failNext('QuestionBankService.listQuestions');
    show(runtime, NEW);
    await toRules(user);
    await fillRules(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitForStep('Add questions');
    expect(await screen.findByText('We couldn’t load your question bank')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('group', { name: 'Questions for this assessment' }),
    ).toBeVisible();
    expect(asideValues()[1]).toBe('Heat Exchanger — post-lab');
  });

  it('the service refuses: the experiment got an assessment meanwhile → step 1, everything kept', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { moves } = show(runtime, NEW);
    await toRules(user);
    await fillRules(user);
    // Another tab of the same Faculty member saves one first.
    await saveDraftBehind(sample);
    await user.click(screen.getByRole('button', { name: 'Save as draft' }));
    await waitForStep('Choose the experiment');
    expect(moves.at(-1)).toBe('push /faculty/assessments/new');
    expect(summaryLinks()).toEqual(['This experiment already has an assessment']);
    expect(errorSummary()).toHaveFocus();
    await waitFor(() =>
      expect(main().querySelector('.rk-notice--info')).toHaveTextContent(
        'Open Heat Exchanger — post-lab to change its questions or rules.',
      ),
    );
    expect(asideValues()[1]).toBe('Heat Exchanger — post-lab');
    expect(asideValues()[2]).toBe(
      'Pass mark 50% · 2 attempts · due 14 Nov 2026, 23:59 · results after the deadline',
    );
  });

  it('Create failing for now: nothing is saved, the words say so, every value stays', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    show(runtime, NEW);
    await toRules(user);
    await fillRules(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitForStep('Add questions');
    await tick(user, Q0102);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitForStep('Preview and create');
    faults(sample).failNext('AssessmentService.createAssessment');
    await user.click(screen.getByRole('button', { name: 'Create assessment' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The assessment wasn’t created. Nothing was changed. Try again.',
    );
    expect(h1()).toHaveTextContent('Preview and create');
    expect(ok(await asPersonId(sample, RANGANATHAN).assessments.listAssessments())).toEqual([]);
    await user.click(screen.getByRole('button', { name: 'Create assessment' }));
    await waitForStep('Assessment created');
  });
});

describe('FA-07 — kept between the steps and across “New question” (FA-15)', () => {
  it('Back and the address keep what was typed; a step reached too early moves back', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { moves, routerRef } = show(runtime, NEW);
    await toRules(user);
    await user.type(screen.getByLabelText(RULES_WORDS.name), 'Heat Exchanger — post-lab');
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await waitForStep('Choose the experiment');
    expect(screen.getByRole('radio', { name: new RegExp(SHELL_NAME) })).toBeChecked();
    act(() => routerRef.current!(`${NEW}?step=rules`));
    await waitForStep('Set the rules');
    expect(screen.getByLabelText(RULES_WORDS.name)).toHaveValue('Heat Exchanger — post-lab');
    // The preview's address before the rules are complete: the rules step, in place.
    act(() => routerRef.current!(`${NEW}?step=preview`));
    await waitFor(() => expect(moves.at(-1)).toBe('replace /faculty/assessments/new?step=rules'));
    expect(h1()).toHaveTextContent('Set the rules');
    act(() => routerRef.current!(`${NEW}?step=nonsense`));
    await waitFor(() => expect(moves.at(-1)).toBe('replace /faculty/assessments/new'));
  });

  it('a round trip to FA-15 keeps everything and comes back with the new question chosen', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { moves, routerRef } = show(runtime, NEW);
    await toRules(user);
    await fillRules(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitForStep('Add questions');
    await tick(user, Q0101);
    const href = screen.getByRole('link', { name: 'New question' }).getAttribute('href')!;
    act(() => routerRef.current!(href));
    expect(await screen.findByTestId('elsewhere')).toHaveTextContent('/faculty/question-bank/new');
    // FA-15 adds the question (its receipt refreshes the tab) and goes back to `returnTo`.
    const text = 'Counter flow can cross the outlet temperatures.';
    const answer = await asPersonId(sample, RANGANATHAN).questionBank.addQuestion({
      experimentId: unsafeBrand<ExperimentId>(SHELL),
      type: 'true-false',
      text,
      options: {},
      correct: 'true',
      marks: '3',
      explanation: null,
      markingGuidance: null,
    });
    const added = ok(answer);
    if (answer.ok) {
      await act(async () => {
        await runtime.invalidate(answer.changed);
      });
    }
    const returnTo = new URLSearchParams(href.split('?')[1]).get('returnTo')!;
    act(() => routerRef.current!(`${returnTo}&added=${added.id}`));
    await waitForStep('Add questions');
    await waitFor(() => expect(screen.getByRole('checkbox', { name: text })).toBeChecked());
    expect(screen.getByRole('checkbox', { name: Q0101 })).toBeChecked();
    // The page says so: saved to the bank, ticked here, and it can be unticked.
    const notice = main().querySelector('.rk-notice--ok')!;
    expect(notice).toHaveTextContent(
      'Saved to your question bank.It’s ticked below. You can untick it.',
    );
    expect(moves.at(-1)).toBe(
      'replace /faculty/assessments/new?step=questions&experimentId=shell-and-tube-heat-exchanger',
    );
    expect(asideValues()).toEqual([
      SHELL_NAME,
      'Heat Exchanger — post-lab',
      'Pass mark 50% · 2 attempts · due 14 Nov 2026, 23:59 · results after the deadline',
      '2 questions · 5 marks',
    ]);
    expectNoReferences();
    // The notice goes with the step.
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await waitForStep('Set the rules');
    expect(main().querySelector('.rk-notice--ok')).toBeNull();
  });

  it('Cancel drops what was typed', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { routerRef } = show(runtime, NEW);
    await toRules(user);
    await user.type(screen.getByLabelText(RULES_WORDS.name), 'Heat Exchanger — post-lab');
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await waitForStep('Choose the experiment');
    await user.click(screen.getByRole('link', { name: 'Cancel' }));
    act(() => routerRef.current!(NEW));
    await waitFor(() =>
      expect(screen.getByRole('radio', { name: new RegExp(SHELL_NAME) })).not.toBeChecked(),
    );
    expect(asideValues()[1]).toBe('Not named yet');
  });

  it('another sign-in in the tab never sees it', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { routerRef } = show(runtime, NEW);
    await toRules(user);
    await user.type(screen.getByLabelText(RULES_WORDS.name), 'Heat Exchanger — post-lab');
    act(() => routerRef.current!(LIST));
    await screen.findByText('No assessments yet');
    // A new sign-in (a new session key) in the same tab and world.
    beginSession(sample, RANGANATHAN);
    await act(async () => {
      await runtime.session.refresh();
    });
    act(() => routerRef.current!(`${NEW}?step=rules`));
    await waitForStep('Choose the experiment');
    expect(screen.getByRole('radio', { name: new RegExp(SHELL_NAME) })).not.toBeChecked();
    expect(asideValues()[1]).toBe('Not named yet');
  });
});

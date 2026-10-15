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
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { RULES_FORM } from '@/copy/assessment-words';
import {
  ADD_QUESTIONS,
  ASSESSMENTS_PAGE,
  CHOOSE_EXPERIMENT,
  CREATE_ASSESSMENT,
  CREATE_RESULT,
  PREVIEW_STEP,
  THIS_ASSESSMENT,
} from '@/copy/assessments';
import { STATE_COPY } from '@/copy/state-copy';
import { STATE_COPY_ASSESSMENTS } from '@/copy/state-copy-assessments';
import { type AppNavigation, NavigationProvider } from '@/nav/navigation';
import type { PlatformRuntime } from '@/platform/runtime';
import { board } from '@/test-support/boards';
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
const aside = () => screen.getByRole('complementary', { name: THIS_ASSESSMENT.title });
const asideValues = () => [...aside().querySelectorAll('dd')].map((value) => value.textContent);
const rows = () => [...document.querySelectorAll<HTMLTableRowElement>('main tbody tr')];
const cellsOf = (row: HTMLTableRowElement) =>
  [...row.querySelectorAll('td')].map((cell) => cell.textContent ?? '');

async function waitForStep(title: string) {
  await waitFor(() => expect(h1()).toHaveTextContent(title));
}

/** Step 1 → 2: the one experiment chosen and "Continue". */
async function toRules(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('radio', { name: new RegExp(SHELL_NAME) }));
  await user.click(screen.getByRole('button', { name: 'Continue' }));
  await waitForStep('Set the rules');
}

/** Step 2 with every rule, as B4-04 f4's sample (typed, never defaults). */
async function fillRules(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(RULES_FORM.name), 'Heat Exchanger — post-lab');
  await user.type(screen.getByLabelText(RULES_FORM.passMark), '50');
  await user.type(screen.getByLabelText(RULES_FORM.attempts), '2');
  await user.type(screen.getByLabelText(RULES_FORM.deadline), '14 Nov 2026, 23:59');
  await user.click(screen.getByRole('radio', { name: /After the deadline/ }));
}

async function tick(user: ReturnType<typeof userEvent.setup>, questionId: string) {
  await user.click(await screen.findByRole('checkbox', { name: new RegExp(questionId) }));
}

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

// ---- the words are B4-04's ---------------------------------------------------------------------

describe('B4-04 words', () => {
  const B4_04 = (() => {
    const raw = board('B4-04-Assessments-and-Create.dc.html');
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
  const drawn = [
    ...strings(ASSESSMENTS_PAGE),
    ...strings(CREATE_ASSESSMENT),
    ...strings(CHOOSE_EXPERIMENT),
    ...strings(THIS_ASSESSMENT),
    ...strings(ADD_QUESTIONS),
    ...strings(PREVIEW_STEP),
    ...strings(CREATE_RESULT),
  ].map((phrase) => phrase.trim());

  it.each(drawn)('“%s” is on B4-04', (phrase) => {
    expect(B4_04).toContain(phrase);
  });

  it('every undrawn word is a provisional register entry, read from the one register', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_ASSESSMENTS)) {
      expect(entry.status, id).toBe('provisional');
      expect(STATE_COPY[id as keyof typeof STATE_COPY], id).toBe(entry);
      expect(entry.words ?? '', id).not.toMatch(/\b(?:OD|T|PC|DEV|VD)-[\w-]+/);
    }
  });
});

// ---- FA-06 Assessments (B4-04 f0, f9, f10) -------------------------------------------------------

describe('FA-06 — the assessments as the service lists them (B4-04 f0)', () => {
  it('the header, the toolbar and the row: name, experiment, state, deadline and submissions, Open', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    show(runtime, LIST);
    expect(await screen.findByRole('heading', { level: 2, name: 'All assessments' })).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(h1()).toHaveTextContent('Assessments');
    expect(main().querySelector('.xr-phead-meta .xl-meta')).toHaveTextContent(
      'Assessments for experiments you teach',
    );
    const create = within(main()).getByRole('link', { name: 'Create assessment' });
    expect(create).toHaveAttribute('href', NEW);
    expect(create).toHaveClass('xr-btn', 'xr-btn--primary');
    // The shell: Assessments current, the top bar "Assessments" with no crumb.
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Assessments');
    expect(
      screen.getByRole('navigation', { name: /Faculty/ }).querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', LIST);

    await waitFor(() => expect(rows()).toHaveLength(1));
    const section = screen.getByRole('region', { name: 'All assessments' });
    expect(section.querySelector('.xr-section-head .xr-meta')).toHaveTextContent('1 assessment');
    expect(within(section).getByLabelText('Search assessments')).toHaveAttribute(
      'placeholder',
      'Name or experiment',
    );
    const options = (label: string) =>
      [...within(section).getByLabelText(label).querySelectorAll('option')].map(
        (option) => option.textContent,
      );
    expect(options('Course')).toEqual(['All courses', 'ME ZG523']);
    expect(options('State')).toEqual(['All states', 'Draft', 'Ready', 'Waiting for marking']);
    expect(within(section).getByLabelText('State').closest('.xr-field')).toHaveClass('xr-filter-2');
    expect([...section.querySelectorAll('th')].map((header) => header.textContent)).toEqual([
      'Assessment',
      'Experiment',
      'State',
      'Deadline and submissions',
      'Action',
    ]);
    expect(rows()).toHaveLength(1);
    const cells = cellsOf(rows()[0]!);
    expect(cells[0]).toBe('Heat Exchanger — post-labASMT-0009');
    expect(cells[1]).toBe('Shell-and-Tube Heat ExchangerME ZG523');
    expect(cells[2]).toBe('Ready');
    // One Godavari student has the experiment in this world (the board's "1 of 5" is sample).
    expect(cells[3]).toBe('Due 14 Nov 2026, 23:59 · 1 of 1 submitted');
    expect(rows()[0]!.querySelector('.xr-status--ok')).toHaveTextContent('Ready');
    expect(
      within(rows()[0]!).getByRole('link', { name: 'Heat Exchanger — post-lab' }),
    ).toHaveAttribute('href', '/faculty/assessments/ASMT-0009');
    const open = within(rows()[0]!).getByRole('link', { name: 'Open Heat Exchanger — post-lab' });
    expect(open).toHaveTextContent(/^Open$/);
    expect(open).toHaveAttribute('href', '/faculty/assessments/ASMT-0009');
    expect(open).toHaveClass('xr-btn', 'xr-btn--secondary', 'xr-btn--sm');
    // No availability or release control, nothing that opens marking (T-18; DEV-21).
    expect(main()).not.toHaveTextContent(/Make available|Publish|Release|Mark now|Mark next/);
  });

  it('a submission waiting for a written answer’s marks: the wait pill, and the State filter', async () => {
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
    const cell = rows()[0]!.querySelectorAll('td')[3]!;
    expect(cell).toHaveTextContent(
      'Due 14 Nov 2026, 23:59 · 1 of 1 submitted · 1 waiting for marking',
    );
    expect(cell.querySelector('.xr-status--wait')).toHaveTextContent('1 waiting for marking');

    await user.selectOptions(screen.getByLabelText('State'), 'Waiting for marking');
    expect(rows()).toHaveLength(1);
    expect(document.querySelector('.xr-section-head [role="status"]')).toHaveTextContent(
      '1 of 1 assessment',
    );
    await user.selectOptions(screen.getByLabelText('State'), 'Draft');
    expect(rows()).toHaveLength(0);
    expect(
      screen.getByRole('heading', { level: 2, name: 'No assessments match these filters' }),
    ).toBeVisible();
  });

  it('search and the filters narrow the list; no match; “Clear filters” brings the rows back', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    show(runtime, LIST);
    await waitFor(() => expect(rows()).toHaveLength(1));
    const search = screen.getByLabelText('Search assessments');
    await user.type(search, 'shell-and');
    expect(rows()).toHaveLength(1);
    await user.clear(search);
    await user.type(search, 'asmt-0009');
    expect(rows()).toHaveLength(1);
    await user.type(search, 'x');
    expect(rows()).toHaveLength(0);
    expect(main()).toHaveTextContent('Check the spelling, or choose another course or state.');
    expect(document.querySelector('.xr-section-head [role="status"]')).toHaveTextContent(
      '0 of 1 assessment',
    );
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(rows()).toHaveLength(1);
    expect(search).toHaveValue('');
    expect(search).toHaveFocus();
    await user.selectOptions(screen.getByLabelText('Course'), 'ME ZG523');
    await user.selectOptions(screen.getByLabelText('State'), 'Ready');
    expect(rows()).toHaveLength(1);
  });

  it('“No assessments yet” before any (f9), with Create assessment', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    show(runtime, LIST);
    expect(
      await screen.findByRole('heading', { level: 2, name: 'No assessments yet' }),
    ).toBeVisible();
    expect(main().querySelector('.xr-empty')).toHaveTextContent(
      'Create an assessment for an experiment you teach. You can save a draft while you add questions.',
    );
    expect(main().querySelector('.xr-empty .xr-empty-icon')).not.toBeNull();
    const creates = screen.getAllByRole('link', { name: 'Create assessment' });
    expect(creates).toHaveLength(2);
    for (const link of creates) {
      expect(link).toHaveAttribute('href', NEW);
      expect(link).toHaveClass('xr-btn--primary');
    }
    expect(creates[1]!.querySelector('svg')).toBeNull();
    expect(document.querySelector('.xr-toolbar')).toBeNull();
  });

  it('a draft (f10): Draft — not ready, what it lacks, “Continue setting up”', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await saveDraftBehind(sample);
    show(runtime, LIST);
    await waitFor(() => expect(rows()).toHaveLength(1));
    const cells = cellsOf(rows()[0]!);
    expect(cells[2]).toBe('Draft — not ready');
    expect(rows()[0]!.querySelector('.xr-status--wait')).toHaveTextContent('Draft — not ready');
    expect(cells[3]).toBe('Rules set · no questions yet · students can’t see it');
    const action = within(rows()[0]!).getByRole('link', {
      name: 'Continue setting up Heat Exchanger — post-lab',
    });
    expect(action).toHaveAttribute('href', '/faculty/assessments/ASMT-0009');
  });

  it('announces loading; a failed read has Try again, which reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    faults(sample).failNext('AssessmentService.listAssessments');
    renderInTab(<FacultyAssessments />, { runtime, navigation: testNavigation(LIST) });
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      'Loading assessments',
    );
    expect(
      await screen.findByRole('heading', { level: 2, name: 'We couldn’t load the assessments' }),
    ).toBeVisible();
    expect(document.querySelector('.xr-empty')).toHaveTextContent(
      'Nothing has changed. Try again.',
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { level: 2, name: 'All assessments' })).toBeVisible();
  });
});

// ---- FA-07 Create assessment (B4-04 f1 … f8, f11) ----------------------------------------------

describe('FA-07 — step 1, choose the experiment (B4-04 f1)', () => {
  it('the stepper, the experiments taught, the note, Cancel and Continue, and an empty summary', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    show(runtime, NEW);
    const radio = await screen.findByRole('radio', { name: new RegExp(SHELL_NAME) });
    expect(h1()).toHaveTextContent('Choose the experiment');
    expect(main().querySelector('.xr-phead .xr-overline')).toHaveTextContent('Step 1 of 4');
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Create assessment');
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', LIST);
    const stepper = screen.getByRole('list', { name: 'Create assessment' });
    expect([...stepper.querySelectorAll('.xr-step-label')].map((step) => step.textContent)).toEqual(
      ['Experiment', 'Rules', 'Questions', 'Preview'],
    );
    expect(stepper.querySelector('[aria-current="step"]')).toHaveTextContent('Step 1Experiment');
    const card = radio.closest('label.xr-choice')!;
    await waitFor(() =>
      expect([...card.querySelectorAll('.xr-choice-sub')].map((sub) => sub.textContent)).toEqual([
        'ME ZG523 · Thermodynamics & Heat Transfer',
        'No assessment yet',
      ]),
    );
    expect(radio).not.toBeChecked();
    expect(within(main()).getByRole('group', { name: 'Experiments you teach' })).toBeVisible();
    expect(main().querySelector('.xw-note')).toHaveTextContent(
      'Students get the formats their institution holds. Assessments are set per experiment, not per format.',
    );
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', LIST);
    expect(screen.queryByRole('button', { name: 'Save as draft' })).toBeNull();
    expect(asideValues()).toEqual([
      'Not chosen yet',
      'Not named yet',
      'Not set yet',
      'No questions yet',
    ]);
    // Below 860 px of content the same summary is a collapsible block (f8, f11).
    expect(main().querySelector('details.xw-sumbar summary')).toHaveTextContent('This assessment');
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
    await user.click(screen.getByRole('link', { name: 'Choose an experiment' }));
    // The fieldset takes focus (`tabindex="-1"`, as drawn).
    expect(document.getElementById('Cc-exp')).toHaveFocus();
    await user.click(screen.getByRole('radio', { name: new RegExp(SHELL_NAME) }));
    expect(errorSummary()).toBeNull();
    expect(asideValues()[0]).toBe('Shell-and-Tube Heat Exchanger · ME ZG523');
  });

  it('an experiment that already has an assessment (f8): the notice, then the refusal on Continue', async () => {
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
    const notice = main().querySelector('.xr-notice--warn')!;
    expect(notice).toHaveTextContent(
      'This experiment already has an assessmentOpen Heat Exchanger — post-lab to change its questions or rules. One assessment per experiment is how this works for now (open decision).',
    );
    expect(within(notice as HTMLElement).getByRole('link')).toHaveAttribute(
      'href',
      '/faculty/assessments/ASMT-0009',
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(summaryLinks()).toEqual(['This experiment already has an assessment']);
    expect(document.getElementById('Cc-exp-e')).toHaveTextContent(
      'This experiment already has an assessment',
    );
    expect(h1()).toHaveTextContent('Choose the experiment');
    expect(moves).toEqual([]);
  });

  it('a Faculty member with no course mapped: no experiment to choose', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(DESAI, 'after-flow-c');
    show(runtime, NEW);
    expect(
      await screen.findByText(/Your Institute Admin hasn’t assigned you courses yet/),
    ).toBeVisible();
    expect(screen.queryByRole('radio')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(summaryLinks()).toEqual(['Choose an experiment']);
  });

  it('?experimentId= chooses the experiment (FA-05’s way in)', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    show(runtime, `${NEW}?experimentId=${SHELL}`);
    await waitFor(() =>
      expect(screen.getByRole('radio', { name: new RegExp(SHELL_NAME) })).toBeChecked(),
    );
    expect(asideValues()[0]).toBe('Shell-and-Tube Heat Exchanger · ME ZG523');
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

describe('FA-07 — the whole flow on the one world (after-flow-c, B4-04 f1 → f6)', () => {
  it('rules start empty and are checked with the drawn words; questions from the bank; Create; FA-06 and the Student see it', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { moves } = show(runtime, NEW);
    await toRules(user);
    expect(moves).toEqual(['push /faculty/assessments/new?step=rules']);
    expect(h1()).toHaveFocus();
    expect(main().querySelector('.xr-phead .xr-overline')).toHaveTextContent('Step 2 of 4');
    // f2: every field blank, no release option chosen — nothing pre-filled (BC6, T-19).
    for (const label of [
      RULES_FORM.name,
      RULES_FORM.introduction,
      RULES_FORM.passMark,
      RULES_FORM.attempts,
      RULES_FORM.deadline,
    ]) {
      expect(screen.getByLabelText(new RegExp(`^${label.replace(/[()]/g, '\\$&')}`))).toHaveValue(
        '',
      );
    }
    for (const radio of screen.getAllByRole('radio')) expect(radio).not.toBeChecked();
    expect(main()).toHaveTextContent(
      'No time limit and no timer. Every value here is set for this assessment only — nothing comes pre-filled.',
    );
    expect(main()).not.toHaveTextContent(/timer:|time limit \(|minutes/i);
    expect(screen.getByRole('button', { name: 'Save as draft' })).toBeVisible();
    expect(asideValues()).toEqual([
      'Shell-and-Tube Heat Exchanger · ME ZG523',
      'Not named yet',
      'Not set yet',
      'No questions yet',
    ]);

    // f3: the step's check, as the contract checks it.
    await user.type(screen.getByLabelText(RULES_FORM.name), 'Heat Exchanger — post-lab');
    await user.type(screen.getByLabelText(RULES_FORM.passMark), '50.5');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(errorSummary()).toHaveFocus();
    expect(summaryLinks()).toEqual([
      'Enter a pass mark from 0 to 100, as a whole number',
      'Enter how many attempts are allowed, as a whole number',
      'Enter the deadline',
      'Choose when students see their result',
    ]);
    expect(screen.getByLabelText(RULES_FORM.passMark)).toHaveAttribute('aria-invalid', 'true');
    expect(document.getElementById('Cc-pass-e')).toHaveTextContent(
      'Enter a pass mark from 0 to 100, as a whole number',
    );
    expect(document.getElementById('Cc-rel-e')).toHaveTextContent(
      'Choose when students see their result',
    );
    expect(asideValues()[1]).toBe('Heat Exchanger — post-lab');
    expect(asideValues()[2]).toBe('Pass mark 50.5%');
    expect(h1()).toHaveTextContent('Set the rules');
    expect(moves).toHaveLength(1);

    // Typing in a field takes its error away.
    await user.clear(screen.getByLabelText(RULES_FORM.passMark));
    await user.type(screen.getByLabelText(RULES_FORM.passMark), '50');
    expect(document.getElementById('Cc-pass-e')).toBeNull();
    expect(summaryLinks()).toHaveLength(3);
    await user.type(screen.getByLabelText(RULES_FORM.attempts), '2');
    await user.type(screen.getByLabelText(RULES_FORM.deadline), '14 Nov 2026, 23:59');
    await user.click(screen.getByRole('radio', { name: /After the deadline/ }));
    expect(asideValues()[2]).toBe(
      'Pass mark 50% · 2 attempts · due 14 Nov 2026, 23:59 · results: after the deadline',
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitForStep('Add questions');

    // f4: the bank's questions for this experiment; Continue needs one.
    const list = await screen.findByRole('list', { name: 'Questions' });
    expect(within(list).getAllByRole('checkbox')).toHaveLength(6);
    expect(main()).toHaveTextContent('From your question bank · Shell-and-Tube Heat Exchanger');
    expect(within(list).getAllByRole('listitem')[0]).toHaveTextContent(
      'What does the effectiveness (ε) of a heat exchanger compare?Q-0101 · Multiple choice · 2 marks',
    );
    expect(screen.getByRole('link', { name: 'New question' })).toHaveAttribute(
      'href',
      '/faculty/question-bank/new?experimentId=shell-and-tube-heat-exchanger&returnTo=%2Ffaculty%2Fassessments%2Fnew%3Fstep%3Dquestions%26experimentId%3Dshell-and-tube-heat-exchanger',
    );
    expect(screen.queryByRole('link', { name: 'Draft with assistance' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Import' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(summaryLinks()).toEqual(['Add at least one question, or save as a draft']);
    expect(document.getElementById('Cc-qs-e')).toHaveTextContent(
      'Add at least one question, or save as a draft',
    );
    await tick(user, 'Q-0106');
    await tick(user, 'Q-0101');
    await tick(user, 'Q-0104');
    expect(errorSummary()).toBeNull();
    expect(main().querySelector('.xr-section [role="status"]')).toHaveTextContent(
      '3 questions · 14 marks',
    );
    expect(asideValues()[3]).toBe('3 questions · 14 marks');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitForStep('Preview and create');

    // f5: what students will see before they start, in the bank's order.
    expect(main()).toHaveTextContent(
      'What students will see before they start. Previewing creates no attempt.',
    );
    const facts = main().querySelector('dl.xl-kv')!;
    expect([...facts.querySelectorAll('dt')].map((term) => term.textContent)).toEqual([
      'Name',
      'Questions',
      'Pass mark',
      'Attempts allowed',
      'Deadline',
      'Result and answers',
    ]);
    expect([...facts.querySelectorAll('dd')].map((value) => value.textContent)).toEqual([
      'Heat Exchanger — post-lab',
      '3 questions · 14 marks',
      '50%',
      '2',
      '14 Nov 2026, 23:59',
      'After the deadline',
    ]);
    expect([...main().querySelectorAll('.xa-q-n')].map((head) => head.textContent)).toEqual([
      'Question 1 · Multiple choice · 2 marks',
      'Question 2 · True or false · 2 marks',
      'Question 3 · Written answer · 10 marks',
    ]);
    // Previewing created nothing.
    expect(ok(await asPersonId(sample, RANGANATHAN).assessments.listAssessments())).toEqual([]);

    await user.click(screen.getByRole('button', { name: 'Create assessment' }));
    await waitForStep('Assessment created');
    expect(h1()).toHaveFocus();
    expect(main().querySelector('.xr-phead .xr-overline')).toHaveTextContent('Create assessment');
    expect(screen.queryByRole('list', { name: 'Create assessment' })).toBeNull();
    expect(main().querySelector('.xr-notice--ok')).toHaveTextContent(
      'ASMT-0009 · ReadyStudents who have Shell-and-Tube Heat Exchanger can now see it in Assessments and start it.',
    );
    const checklist = screen.getByRole('list', { name: 'Ready checklist' });
    expect(checklist.querySelectorAll('.is-ok')).toHaveLength(2);
    expect(checklist).toHaveTextContent('Name and rulesAt least one question');
    expect(screen.getByRole('link', { name: 'Open assessment' })).toHaveAttribute(
      'href',
      '/faculty/assessments/ASMT-0009',
    );

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
    await tick(user, 'Q-0101');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitForStep('Preview and create');
    await user.click(screen.getByRole('button', { name: 'Create assessment' }));
    await waitForStep('Assessment created');

    act(() => routerRef.current!(LIST));
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(cellsOf(rows()[0]!)[2]).toBe('Ready');
    expect(cellsOf(rows()[0]!)[3]).toBe('Due 14 Nov 2026, 23:59 · 0 of 1 submitted');

    // FA-07 again starts empty, and its experiment now has an assessment.
    act(() => routerRef.current!(NEW));
    const radio = await screen.findByRole('radio', { name: new RegExp(SHELL_NAME) });
    expect(radio).not.toBeChecked();
    expect(radio.closest('label')).toHaveTextContent(
      'Already has an assessment: Heat Exchanger — post-lab',
    );
  });

  it('“Create another” starts again at step 1 with nothing kept', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { moves } = show(runtime, NEW);
    await toRules(user);
    await user.type(screen.getByLabelText(RULES_FORM.name), 'Heat Exchanger — post-lab');
    await user.click(screen.getByRole('button', { name: 'Save as draft' }));
    await waitForStep('Saved as draft');
    await user.click(screen.getByRole('button', { name: 'Create another' }));
    await waitForStep('Choose the experiment');
    expect(moves.at(-1)).toBe('push /faculty/assessments/new');
    expect(h1()).toHaveFocus();
    expect(asideValues()).toEqual([
      'Not chosen yet',
      'Not named yet',
      'Not set yet',
      'No questions yet',
    ]);
  });
});

describe('FA-07 — Save as draft (B4-04 f7)', () => {
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
    expect(main().querySelector('.xr-phead .xr-overline')).toHaveTextContent('Create assessment');
    expect(main().querySelector('.xr-notice--warn')).toHaveTextContent(
      'ASMT-0009 · Draft — not readyStudents can’t see a draft. Finish what’s missing below.',
    );
    const checklist = screen.getByRole('list', { name: 'Ready checklist' });
    const items = [...checklist.querySelectorAll('li')];
    expect(items[0]!.querySelector('.is-ok')).not.toBeNull();
    expect(items[0]).toHaveTextContent('Name and rules');
    expect(items[1]!.querySelector('.is-no')).not.toBeNull();
    expect(items[1]).toHaveTextContent('At least one question');
    expect(screen.getByRole('link', { name: 'Open assessment' })).toHaveAttribute(
      'href',
      '/faculty/assessments/ASMT-0009',
    );

    expect(ok(await asPersonId(sample, RAHUL).assessments.listMyAssessments())).toEqual([]);
    act(() => routerRef.current!(LIST));
    await waitFor(() => expect(rows()).toHaveLength(1));
    expect(cellsOf(rows()[0]!).slice(2, 4)).toEqual([
      'Draft — not ready',
      'Rules set · no questions yet · students can’t see it',
    ]);
  });

  it('from step 3 with questions: the draft keeps them', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    show(runtime, NEW);
    await toRules(user);
    await user.type(screen.getByLabelText(RULES_FORM.name), 'Heat Exchanger — post-lab');
    await user.type(screen.getByLabelText(RULES_FORM.passMark), '50');
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
    expect(items.map((item) => item.querySelector('span')?.className)).toEqual(['is-no', 'is-no']);
  });
});

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
    expect(await screen.findByRole('list', { name: 'Questions' })).toBeVisible();
    expect(asideValues()[1]).toBe('Heat Exchanger — post-lab');
  });

  it('the service refuses: the experiment got an assessment meanwhile → step 1 with f8, everything kept', async () => {
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
      expect(main().querySelector('.xr-notice--warn')).toHaveTextContent(
        'Open Heat Exchanger — post-lab to change its questions or rules.',
      ),
    );
    expect(asideValues()[1]).toBe('Heat Exchanger — post-lab');
    expect(asideValues()[2]).toBe(
      'Pass mark 50% · 2 attempts · due 14 Nov 2026, 23:59 · results: after the deadline',
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
    await tick(user, 'Q-0102');
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
    await user.type(screen.getByLabelText(RULES_FORM.name), 'Heat Exchanger — post-lab');
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await waitForStep('Choose the experiment');
    expect(screen.getByRole('radio', { name: new RegExp(SHELL_NAME) })).toBeChecked();
    act(() => routerRef.current!(`${NEW}?step=rules`));
    await waitForStep('Set the rules');
    expect(screen.getByLabelText(RULES_FORM.name)).toHaveValue('Heat Exchanger — post-lab');
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
    await tick(user, 'Q-0101');
    const href = screen.getByRole('link', { name: 'New question' }).getAttribute('href')!;
    act(() => routerRef.current!(href));
    expect(await screen.findByTestId('elsewhere')).toHaveTextContent('/faculty/question-bank/new');
    // FA-15 adds the question (its receipt refreshes the tab) and goes back to `returnTo`.
    const answer = await asPersonId(sample, RANGANATHAN).questionBank.addQuestion({
      experimentId: unsafeBrand<ExperimentId>(SHELL),
      type: 'true-false',
      text: 'Counter flow can cross the outlet temperatures.',
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
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: new RegExp(added.id) })).toBeChecked(),
    );
    expect(screen.getByRole('checkbox', { name: /Q-0101/ })).toBeChecked();
    expect(moves.at(-1)).toBe(
      'replace /faculty/assessments/new?step=questions&experimentId=shell-and-tube-heat-exchanger',
    );
    expect(asideValues()).toEqual([
      'Shell-and-Tube Heat Exchanger · ME ZG523',
      'Heat Exchanger — post-lab',
      'Pass mark 50% · 2 attempts · due 14 Nov 2026, 23:59 · results: after the deadline',
      '2 questions · 5 marks',
    ]);
  });

  it('Cancel drops what was typed', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { routerRef } = show(runtime, NEW);
    await toRules(user);
    await user.type(screen.getByLabelText(RULES_FORM.name), 'Heat Exchanger — post-lab');
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
    await user.type(screen.getByLabelText(RULES_FORM.name), 'Heat Exchanger — post-lab');
    act(() => routerRef.current!(LIST));
    await screen.findByRole('heading', { level: 2, name: 'No assessments yet' });
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

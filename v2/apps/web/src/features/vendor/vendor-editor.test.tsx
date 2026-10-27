/**
 * The experiment editor — VE-03 … VE-06, VE-09 Edit draft and VE-08 Revise and resubmit, the one
 * four-step editor of the V3 Vendor design (VE-v1 `Main.dc.html`) — on the real composition root
 * and the sample world (`spine-start`), as Anil Shetty of Northline Simulation Studio. The router is
 * the test's: the editor stays mounted across its own `?step=` and another address unmounts it, as
 * Next.js does. Each drawn state: the titled sections and the field grid, the step's validation and
 * summary, the name already in use (the service's answer), a course withdrawn while editing, the
 * first save minting SUB-0077 and its saved line next to Cancel, what was typed kept across in-app
 * navigation, “Leave without saving?” for a link with unsaved changes, the stepper and the outline
 * with their live status, the format selector and one delivery block per format, Attach file, the
 * documents and their dashed empty line, the missing items with their links, the review sections
 * with Change, the confirmation and the outcome card, the read-only draft, the refusals, and a
 * revision returned by the Academic Reviewer: the returned reason (focused first), its references
 * jumping to tagged fields, Save changes and Resubmit → “Submitted” (M-3) — and the one world
 * moving: the reviewer's queue holds revision 2. No state names the experiment by its reference
 * (the owner's identifier rule for the Vendor, 22 Oct 2026; state-copy `VE-02.no-reference`): each
 * is checked, and the reference is read from the address only.
 */
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CourseId, ReturnReference, SubmissionId } from '@xr/domain';
import { asPersonId, beginSession, faults, worldOf } from '@xr/sample-platform/testing';
import { type ReactNode, type RefObject, useEffect, useMemo, useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { type AppNavigation, NavigationProvider } from '@/nav/navigation';
import type { PlatformRuntime } from '@/platform/runtime';
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
import { forgetEditorDrafts } from './editor/editor-draft';
import { reviseReferenceAddress } from './editor/editor-view';
import { ExperimentEditor } from './editor/experiment-editor';

afterEach(() => {
  forgetLastAddress();
  forgetEditorDrafts();
});

/** Real typing through four steps takes a while in jsdom. */
const SLOW = 30_000;
const ANIL = 'per-anil-shetty';
const MENON = 'per-a-menon';
const ARJUN = 'sa-arjun-mehta';
const THERMO = 'thermodynamics-heat-transfer';
const MANUFACTURING = 'manufacturing-processes';
const NEW = '/vendor/experiments/new';
const LIST = '/vendor/experiments';

/** The contract suite's Flow E content (`contract-suite/cases/flow-e.ts` `contentFor`). */
const FLOW_E = {
  name: 'Conduction Through a Composite Wall',
  summary: 'Heat flow through a wall of several layers.',
  description:
    'Learners build a wall of three layers and compare the temperature profile with the series-resistance model.',
  version: '1.0',
  webLink: 'https://labs.northline.example/composite-wall',
  browser: 'A current browser on a laptop or desktop.',
  packageLabel: 'Composite Wall VR',
  packageReference: 'NSS-CW-VR-1.0',
  device: 'A supported VR headset.',
  install: 'Install it from the lab’s device manager.',
} as const;

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];
type Router = RefObject<((href: string) => void) | null>;

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

/** The Vendor's editor pages behind their addresses; any other address shows where Anil went. */
function LiveRoutes({
  start,
  moves,
  routerRef,
}: {
  readonly start: string;
  readonly moves: string[];
  readonly routerRef: Router;
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
  const page = (pathname: string): ReactNode => {
    if (pathname === NEW)
      return <ExperimentEditor key={pathname} mode="create" submissionId={null} />;
    const match = /^\/vendor\/experiments\/([^/]+)\/(edit|revise)$/.exec(pathname);
    if (match)
      return (
        <ExperimentEditor
          key={pathname}
          mode={match[2] as 'edit' | 'revise'}
          submissionId={decodeURIComponent(match[1]!)}
        />
      );
    return <p data-testid="elsewhere">{pathname}</p>;
  };
  return (
    <NavigationProvider value={value}>
      <WorkspaceLayout workspace="vendor">
        <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>
          {page(value.pathname)}
        </TestNotFoundBoundary>
      </WorkspaceLayout>
    </NavigationProvider>
  );
}

function show(runtime: PlatformRuntime, start: string) {
  const moves: string[] = [];
  const routerRef: Router = { current: null };
  const view = renderInTab(<LiveRoutes start={start} moves={moves} routerRef={routerRef} />, {
    runtime,
    navigation: testNavigation(start),
  });
  const go = (href: string) => act(() => routerRef.current?.(href));
  return { moves, go, view };
}

async function anilAt(start: string, fixture: 'spine-start' | 'after-flow-e' = 'spine-start') {
  const { runtime, sample } = await tabPlatform(ANIL, fixture);
  const user = userEvent.setup();
  return { runtime, sample, user, ...show(runtime, start) };
}

const main = () => screen.getByRole('main');
/** An element's words, one space between its text pieces (as a reader hears them). */
function text(element: Element | null): string {
  if (!element) return '';
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const pieces: string[] = [];
  for (let node = walker.nextNode(); node; node = walker.nextNode())
    pieces.push(node.textContent ?? '');
  return pieces
    .map((piece) => piece.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' ');
}
const title = async (name: string) =>
  screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });
/** An internal reference no Vendor page shows (the owner's identifier rule, 22 Oct 2026). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

/** No reference in the words, names, titles or placeholders drawn, nor in the tab's title. */
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

/** The head's eyebrow (`p.rk-eyebrow`) and the meta line's last words (`div.rk-meta > span`). */
const eyebrow = () => text(main().querySelector('.rk-head .rk-eyebrow'));
const idLine = () => text(main().querySelector('.rk-head .rk-meta > span:last-child'));
const crumbs = () => screen.getByRole('navigation', { name: 'Breadcrumb' });
const summary = () => document.getElementById('Ve-err');
const summaryLinks = () =>
  [...(summary()?.querySelectorAll('li a') ?? [])].map((link) => link.textContent);
const fieldError = (id: string) => text(document.getElementById(`${id}-e`));
const button = (name: string | RegExp) => within(main()).getByRole('button', { name });
/** A delivery block, by its heading: “Browser · Web link” (jsdom drops the space before “·”). */
const block = (name: string) =>
  screen.getByRole('region', { name: new RegExp(`^${name.replace(' · ', ' ?· ')}$`) });
const field = (label: string) => screen.getByLabelText(label, { exact: true });
/** The top stepper (`nav.ve-steps`) and the aside outline (`aside.ve-edaside`). */
const stepper = () => main().querySelector<HTMLElement>('nav.ve-steps')!;
const outline = () =>
  screen.getByRole('complementary', {
    name: /^(?:Draft|Revision \d+ returned|New experiment · not saved yet)$/,
  });
const actions = () => main().querySelector<HTMLElement>('.vr-actions')!;

async function fillStepOne(user: ReturnType<typeof userEvent.setup>, name: string = FLOW_E.name) {
  await user.selectOptions(screen.getByRole('combobox', { name: 'Course' }), THERMO);
  const nameField = field('Experiment name');
  await user.clear(nameField);
  await user.type(nameField, name);
  await user.type(field('Summary'), FLOW_E.summary);
  await user.type(field('Description'), FLOW_E.description);
  await user.type(field('Version'), FLOW_E.version);
}

async function fillStepTwo(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('checkbox', { name: /Browser/ }));
  await user.click(screen.getByRole('checkbox', { name: /Virtual reality/ }));
  const web = block('Browser · Web link');
  await user.type(within(web).getByLabelText('Web link'), FLOW_E.webLink);
  await user.type(within(web).getByLabelText('Browser and computer needed'), FLOW_E.browser);
  const vr = block('Virtual reality · App package');
  await user.type(within(vr).getByLabelText('Package label'), FLOW_E.packageLabel);
  await user.type(within(vr).getByLabelText('Package reference'), FLOW_E.packageReference);
  await user.type(within(vr).getByLabelText('Device needed'), FLOW_E.device);
  await user.type(within(vr).getByLabelText('Install notes'), FLOW_E.install);
}

/** Anil's own submissions in the world, by name. */
function submissionsNamed(sample: Sample, name: string) {
  return Object.values(worldOf(sample).records.submissions).filter(
    (submission) => submission.content.name === name,
  );
}

// ---- VE-03 Course and description ---------------------------------------------------------------

describe('VE-03 Course and description', () => {
  it(
    'the head, the breadcrumbs, the two sections on the grid, only the assigned courses, the stepper, the outline and the actions',
    async () => {
      await anilAt(NEW);
      await title('Course and description');
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(eyebrow()).toBe('Create experiment · Step 1 of 4');
      expect(idLine()).toBe('Not saved yet');
      expect(text(crumbs())).toBe('My experiments Create experiment');
      expect(within(crumbs()).getByRole('link', { name: 'My experiments' })).toHaveAttribute(
        'href',
        LIST,
      );
      // Two titled sections; the form is named by the step's H1.
      const form = screen.getByRole('region', { name: 'Course and description' });
      expect(form).toHaveClass('rk-surface', 've-form', 'vr-form');
      expect(
        within(form)
          .getAllByRole('group')
          .map((group) => group.getAttribute('aria-labelledby')),
      ).toEqual(['Ve-s1-a-h', 'Ve-s1-b-h']);
      expect(screen.getByRole('group', { name: 'Course and name' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Catalogue text' })).toBeInTheDocument();
      // The field grid (PD-5): Engineering area and course 3 columns each, then the name 4 and the
      // version 2, the rest the full width.
      expect(field('Engineering area').closest('.rk-field')).toHaveClass('vr-w3');
      expect(field('Course').closest('.rk-field')).toHaveClass('vr-w3');
      expect(field('Experiment name').closest('.rk-field')).toHaveClass('vr-w4');
      expect(field('Version').closest('.rk-field')).toHaveClass('vr-w2');
      // One area on offer (Anil's ME ZG523): chosen already, no “Choose an Engineering area”.
      const area = screen.getByRole('combobox', { name: 'Engineering area' });
      expect([...area.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
        'Mechanical & Manufacturing',
      ]);
      expect(area).toHaveValue('mechanical-manufacturing');
      expect(field('Summary')).toHaveClass('rk-textarea', 'vr-ta2');
      expect(field('Description')).toHaveClass('rk-textarea', 'vr-ta4');
      const course = screen.getByRole('combobox', { name: 'Course' });
      expect([...course.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
        'Choose a course',
        'ME ZG523 · Thermodynamics & Heat Transfer',
      ]);
      // Course-restricted (Anil holds ME ZG523): the hint says the courses are assigned to him.
      expect(course).toHaveAccessibleDescription(
        'Only the courses the platform team assigned to you are listed.',
      );
      expect(main().querySelector('p.vr-foot')).toHaveTextContent(
        'Prototype field set — the catalogue fields, and who maps an experiment to a course, are still open. Learning outcomes are added by the Academic Reviewer.',
      );
      // The top stepper and the outline: four steps, the first current, each with its state.
      expect(
        within(stepper())
          .getAllByRole('button')
          .map((step) => step.getAttribute('aria-label')),
      ).toEqual([
        'Step 1 of 4, Course and description, not started',
        'Step 2 of 4, Formats and delivery, not started',
        'Step 3 of 4, Preview and documents, optional',
        'Step 4 of 4, Check and submit, not ready yet',
      ]);
      expect(stepper().querySelector('[aria-current="step"]')).toHaveTextContent('1Course');
      const aside = outline();
      expect(text(aside.querySelector('.ve-prog-k'))).toBe('New experiment · not saved yet');
      expect(text(aside.querySelector('.ve-prog-t'))).toBe('Untitled experiment');
      expect(
        within(aside)
          .getByRole('list', { name: 'Parts of Course and description' })
          .querySelectorAll('li'),
      ).toHaveLength(2);
      expect(text(aside.querySelector('.vr-sub'))).toBe(
        'Course and name 3 still needed Catalogue text 2 still needed',
      );
      expect(text(aside.querySelector('.ve-prog-meta'))).toBe(
        'Not saved yet Save a draft to keep your work. Only you can see a draft.',
      );
      // The actions: Cancel to My experiments, Save draft, Continue (the one primary).
      expect(within(actions()).getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', LIST);
      expect(button('Save draft')).toHaveClass('rb-btn', 'rb-btn--lg');
      expect(button('Save draft')).not.toHaveClass('rb-btn--primary');
      expect(button('Continue')).toHaveClass('rb-btn--primary', 'rb-btn--lg');
      // The shell: My experiments is the current destination.
      const rail = screen.getByRole('navigation', { name: 'Vendor navigation' });
      expect(rail.querySelector('[aria-current="page"]')).toHaveAttribute('href', LIST);
      expectNoReferences();
    },
    SLOW,
  );

  it(
    'Continue with nothing entered: every field’s error and the summary, which takes focus; the outline counts what to fix',
    async () => {
      const { user, moves } = await anilAt(NEW);
      await title('Course and description');
      await user.click(button('Continue'));
      await waitFor(() => expect(summary()).not.toBeNull());
      expect(summary()).toHaveClass('rk-errsum');
      expect(summary()!.parentElement).toHaveClass('vr-errwrap');
      expect(text(summary()!.querySelector('.rk-errsum-t'))).toBe('Check this step');
      expect(summaryLinks()).toEqual([
        'Choose a course',
        'Enter the experiment name',
        'Enter a one-sentence summary',
        'Enter a description',
        'Enter a version, for example 1.0',
      ]);
      expect(summary()).toHaveFocus();
      expect(fieldError('Ve-course')).toBe('Choose a course');
      expect(fieldError('Ve-name')).toBe('Enter the experiment name');
      expect(field('Experiment name')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('combobox', { name: 'Course' })).toHaveAttribute(
        'aria-invalid',
        'true',
      );
      expect(text(outline().querySelector('.vr-sub'))).toBe(
        'Course and name 3 to fix Catalogue text 2 to fix',
      );
      // A summary link moves focus to its field; typing clears that field's error.
      await user.click(screen.getByRole('link', { name: 'Enter a description' }));
      expect(field('Description')).toHaveFocus();
      await user.type(field('Description'), 'x');
      expect(document.getElementById('Ve-desc-e')).toBeNull();
      expect(text(outline().querySelector('.vr-sub'))).toBe(
        'Course and name 3 to fix Catalogue text 1 to fix',
      );
      expect(moves).toEqual([]);
      expectNoReferences();
    },
    SLOW,
  );

  it(
    'a name already in use is the service’s answer (the published “Composite Wall Conduction”)',
    async () => {
      const { user, moves } = await anilAt(NEW);
      await title('Course and description');
      await fillStepOne(user, 'Composite Wall Conduction');
      await user.click(button('Continue'));
      await waitFor(() => expect(summary()).not.toBeNull());
      const words =
        'An experiment called “Composite Wall Conduction” already exists. Choose a different name.';
      expect(summaryLinks()).toEqual([words]);
      expect(fieldError('Ve-name')).toBe(words);
      expect(moves).toEqual([]);
      expectNoReferences();
    },
    SLOW,
  );

  it(
    'Save draft needs a name; the first save mints SUB-0077, gives the draft its own address and the saved line next to Cancel',
    async () => {
      const { user, moves, sample } = await anilAt(NEW);
      await title('Course and description');
      await user.click(button('Save draft'));
      await waitFor(() => expect(summaryLinks()).toEqual(['Enter a name to save a draft']));
      expect(submissionsNamed(sample, FLOW_E.name)).toHaveLength(0);

      await fillStepOne(user);
      await user.click(button('Save draft'));
      await waitFor(() => expect(moves).toEqual(['replace /vendor/experiments/SUB-0077/edit']));
      await waitFor(() => expect(idLine()).toBe('Only you can see a draft'));
      expect(eyebrow()).toBe('Edit draft · Step 1 of 4');
      expect(text(crumbs())).toBe(`My experiments ${FLOW_E.name} Edit draft`);
      expect(within(crumbs()).getByRole('link', { name: FLOW_E.name })).toHaveAttribute(
        'href',
        '/vendor/experiments/SUB-0077',
      );
      expect(main().querySelector('.rk-meta .xr-st')).toHaveTextContent('Draft');
      const saved = document.getElementById('Ve-saved')!;
      expect(saved).toHaveClass('ve-saved', 'vr-saved');
      expect(saved).toHaveAttribute('role', 'status');
      expect(saved.parentElement).toBe(actions());
      expect(text(saved)).toMatch(/^Draft saved · \d{1,2} [A-Z][a-z]{2} 2026, \d\d:\d\d$/);
      expect(saved).toHaveFocus();
      expect(text(outline().querySelector('.ve-prog-k'))).toBe('Draft');
      expectNoReferences();
      expect(text(outline().querySelector('.ve-prog-meta b'))).toMatch(
        /^Last saved \d{1,2} [A-Z][a-z]{2} 2026, \d\d:\d\d$/,
      );
      // The saved record carries what was typed; only the Vendor sees a draft.
      const [draft] = submissionsNamed(sample, FLOW_E.name);
      expect(draft).toMatchObject({ id: 'SUB-0077', status: { state: 'draft' } });
      expect(draft!.content).toMatchObject({
        courseId: THERMO,
        summary: FLOW_E.summary,
        version: '1.0',
      });
      expect(field('Experiment name')).toHaveValue(FLOW_E.name);
      // A change clears the saved line.
      await user.type(field('Version'), '1');
      expect(document.getElementById('Ve-saved')).toBeNull();
      expectNoReferences();
    },
    SLOW,
  );

  it(
    'what is typed survives leaving the editor and coming back, for this session only; Cancel asks first, then drops it',
    async () => {
      const { user, go, moves } = await anilAt(NEW);
      await title('Course and description');
      await user.type(field('Experiment name'), 'Half-typed name');
      go(LIST);
      expect(await screen.findByTestId('elsewhere')).toHaveTextContent(LIST);
      go(NEW);
      await title('Course and description');
      expect(field('Experiment name')).toHaveValue('Half-typed name');
      // Cancel with unsaved changes: “Leave without saving?” — Keep editing keeps the value.
      await user.click(within(actions()).getByRole('link', { name: 'Cancel' }));
      let dialog = await screen.findByRole('dialog', { name: 'Leave without saving?' });
      await user.click(within(dialog).getByRole('button', { name: 'Keep editing' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(field('Experiment name')).toHaveValue('Half-typed name');
      // Leave without saving drops it and goes to My experiments.
      await user.click(within(actions()).getByRole('link', { name: 'Cancel' }));
      dialog = await screen.findByRole('dialog', { name: 'Leave without saving?' });
      await user.click(within(dialog).getByRole('button', { name: 'Leave without saving' }));
      expect(await screen.findByTestId('elsewhere')).toHaveTextContent(LIST);
      expect(moves.at(-1)).toBe(`push ${LIST}`);
      go(NEW);
      await title('Course and description');
      expect(field('Experiment name')).toHaveValue('');
      expectNoReferences();
    },
    SLOW,
  );

  it(
    'Leave without saving? guards the breadcrumbs and the rail while changes are unsaved, and only then',
    async () => {
      const { user, moves } = await anilAt(NEW);
      await title('Course and description');
      // Nothing typed: a link is not held back.
      const list = within(crumbs()).getByRole('link', { name: 'My experiments' });
      expect(fireEvent.click(list)).toBe(true);
      expect(screen.queryByRole('dialog')).toBeNull();
      await user.type(field('Summary'), 'Heat flow');
      // A breadcrumb: the dialog, focus on its title; Keep editing (or Esc) keeps every value.
      await user.click(within(crumbs()).getByRole('link', { name: 'My experiments' }));
      const dialog = await screen.findByRole('dialog', { name: 'Leave without saving?' });
      expect(dialog).toHaveClass('rk-dialog');
      expect(dialog).toHaveAccessibleDescription(
        'Your changes since you last saved will be lost. Save a draft first to keep them.',
      );
      expect(within(dialog).getByRole('heading', { name: 'Leave without saving?' })).toHaveFocus();
      // As the export draws it: no body, Keep editing and the navy “Leave without saving”.
      expect([...dialog.children].map((part) => part.className)).toEqual([
        'rk-dlg-head',
        'rk-dlg-foot',
      ]);
      expect(
        within(dialog)
          .getAllByRole('button')
          .map((button) => [button.textContent, button.className]),
      ).toEqual([
        ['Keep editing', 'rb-btn rb-btn--lg'],
        ['Leave without saving', 'rb-btn rb-btn--navy rb-btn--lg'],
      ]);
      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(field('Summary')).toHaveValue('Heat flow');
      expect(moves).toEqual([]);
      // The rail: Leave without saving goes where the link pointed.
      const rail = screen.getByRole('navigation', { name: 'Vendor navigation' });
      await user.click(within(rail).getByRole('link', { name: /Overview/ }));
      await user.click(
        within(await screen.findByRole('dialog')).getByRole('button', {
          name: 'Leave without saving',
        }),
      );
      expect(await screen.findByTestId('elsewhere')).toHaveTextContent('/vendor');
      expect(moves).toEqual(['push /vendor']);
      expectNoReferences();
    },
    SLOW,
  );

  it(
    'a course withdrawn while editing: the stale hint inside the course hint and the service’s words',
    async () => {
      const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
      const admin = asPersonId(sample, ARJUN);
      const holderOf = () => worldOf(sample).records.holders['role-anil-shetty']!;
      const manufacturing = () =>
        holderOf().scopes.find(
          (each) =>
            each.target.kind === 'course' &&
            each.target.courseId === MANUFACTURING &&
            each.supersededAt === null,
        )!;
      // Super Admin gives MEL ZG512 back to Anil (as SA-17 would) …
      ok(
        await admin.platformRoles.restoreScope({
          holderId: holderOf().id,
          scopeId: manufacturing().id,
          expectedRev: holderOf().rev,
        }),
      );
      const user = userEvent.setup();
      show(runtime, NEW);
      await title('Course and description');
      const course = screen.getByRole('combobox', { name: 'Course' });
      await waitFor(() => expect(course.querySelectorAll('option')).toHaveLength(3));
      await user.selectOptions(course, MANUFACTURING);
      await user.type(field('Experiment name'), FLOW_E.name);
      await user.type(field('Summary'), FLOW_E.summary);
      await user.type(field('Description'), FLOW_E.description);
      await user.type(field('Version'), '1.0');
      // … and withdraws it again while Anil is editing.
      await act(async () => {
        const withdrawn = await admin.platformRoles.withdrawScope({
          holderId: holderOf().id,
          scopeId: manufacturing().id,
          reason: 'Back in-house.',
          expectedRev: holderOf().rev,
        });
        if (withdrawn.ok) await runtime.invalidate(withdrawn.changed);
      });
      await waitFor(() => expect(course.querySelectorAll('option')).toHaveLength(2));
      expect(course).toHaveValue('');
      await waitFor(() =>
        expect(document.querySelector('#Ve-course-h .ve-hint-stale')).toHaveTextContent(
          'You chose MEL ZG512 · Manufacturing Processes, which was withdrawn from your courses while you were editing.',
        ),
      );
      await user.click(button('Continue'));
      const words =
        'MEL ZG512 is no longer one of your assigned courses. Choose one of your courses.';
      await waitFor(() => expect(summaryLinks()).toEqual([words]));
      expect(fieldError('Ve-course')).toBe(words);
      expectNoReferences();
    },
    SLOW,
  );
});

// ---- VE-04 Formats and delivery ----------------------------------------------------------------

describe('VE-03 step 1 · Engineering area, then Course (PD-5, correction B)', () => {
  const RITU = 'per-ritu-sharma';
  const ELEC = 'electrical-electronics';
  const CHEM = 'chemical-process';
  const MECH = 'mechanical-manufacturing';
  const options = (name: string) =>
    [...screen.getByRole('combobox', { name }).querySelectorAll('option')].map(
      (option) => option.textContent,
    );

  /** A draft of Ritu's under CHE ZG513, saved through the port (set-up only). */
  async function rituDraft(sample: Parameters<typeof asPersonId>[0]) {
    const seed = worldOf(sample).records.submissions['SUB-0070' as SubmissionId]!;
    const saved = await asPersonId(sample, RITU).production.saveDraft({
      id: null,
      content: {
        ...seed.content,
        courseId: 'process-instrumentation-control' as CourseId,
        name: 'Packed Column Absorption',
      } as never,
      step: 'course',
      expectedRev: null,
    });
    if (!saved.ok) throw new Error('saved');
    return saved.value;
  }

  it('two areas on offer: an explicit area choice; Course follows the area; another area clears it', async () => {
    const { runtime } = await tabPlatform(RITU, 'spine-start');
    const user = userEvent.setup();
    show(runtime, NEW);
    await title('Course and description');
    expect(options('Engineering area')).toEqual([
      'Choose an Engineering area',
      'Electrical & Electronics',
      'Chemical & Process',
    ]);
    expect(field('Engineering area')).toHaveValue('');
    expect(options('Course')).toEqual(['Choose an Engineering area first']);
    // Two course scopes, no Any course: the restriction in words (PC-77).
    expect(field('Course')).toHaveAccessibleDescription(
      'Only the courses the platform team assigned to you are listed.',
    );
    await user.selectOptions(field('Engineering area'), ELEC);
    expect(options('Course')).toEqual(['Choose a course', 'EEE ZC341 · Electrical Machines']);
    await user.selectOptions(field('Course'), 'electrical-machines');
    expect(field('Course')).toHaveValue('electrical-machines');
    // Another area: the course of the first is cleared.
    await user.selectOptions(field('Engineering area'), CHEM);
    expect(field('Course')).toHaveValue('');
    expect(options('Course')).toEqual([
      'Choose a course',
      'CHE ZG513 · Process Instrumentation & Control',
    ]);
    // No course: Continue answers “Choose a course”, as before.
    await user.click(button('Continue'));
    expect(await screen.findByText('Choose a course', { selector: '.rk-ferr' })).toBeVisible();
  });

  it('a saved draft reopens with the area of its course', async () => {
    const { runtime, sample } = await tabPlatform(RITU, 'spine-start');
    const draft = await rituDraft(sample);
    show(runtime, `${LIST}/${draft.id}/edit`);
    await title('Course and description');
    expect(field('Engineering area')).toHaveValue(CHEM);
    expect(field('Course')).toHaveValue('process-instrumentation-control');
    // The record keeps the course only.
    expect(Object.keys(worldOf(sample).records.submissions[draft.id]!.content)).not.toContain(
      'areaId',
    );
  });

  it('a moved course: the draft reopens under the course’s new area, its course kept', async () => {
    const { runtime, sample } = await tabPlatform(RITU, 'spine-start');
    const draft = await rituDraft(sample);
    const course = worldOf(sample).records.courses['process-instrumentation-control' as CourseId]!;
    const moved = await asPersonId(sample, ARJUN).academicStructure.moveCourse({
      courseId: course.id,
      toAreaId: MECH as never,
      expectedRev: course.rev,
    });
    expect(moved.ok).toBe(true);
    show(runtime, `${LIST}/${draft.id}/edit`);
    await title('Course and description');
    expect(options('Engineering area')).toEqual([
      'Choose an Engineering area',
      'Mechanical & Manufacturing',
      'Electrical & Electronics',
    ]);
    expect(field('Engineering area')).toHaveValue(MECH);
    expect(field('Course')).toHaveValue('process-instrumentation-control');
  });

  it('a returned experiment opens Revise with the area of its course (Anil with Any course)', async () => {
    const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
    const anil = worldOf(sample).records.holders['role-anil-shetty' as never]!;
    const assigned = await asPersonId(sample, ARJUN).platformRoles.assignScope({
      holderId: anil.id,
      target: { kind: 'all' },
      expectedRev: anil.rev,
    });
    expect(assigned.ok).toBe(true);
    show(runtime, `${LIST}/SUB-0081/revise`);
    await title('Course and description');
    expect(options('Engineering area')).toEqual([
      'Choose an Engineering area',
      'Mechanical & Manufacturing',
      'Electrical & Electronics',
      'Chemical & Process',
    ]);
    expect(field('Engineering area')).toHaveValue(MECH);
    expect(field('Course')).toHaveValue(THERMO);
    expect(options('Course')).toEqual([
      'Choose a course',
      'ME ZG523 · Thermodynamics & Heat Transfer',
      'MEL ZG512 · Manufacturing Processes',
      'Fluid Mechanics',
    ]);
    // Any course: no list assigned to the studio is implied (PC-77; owner closure review of B).
    expect(field('Course')).toHaveAccessibleDescription(
      'Choose an existing course in the selected Engineering area.',
    );
  });

  it('a returned experiment whose course is no longer granted: Revise names it, keeps it, never reassigns it', async () => {
    const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
    const admin = asPersonId(sample, ARJUN);
    const holderOf = () => worldOf(sample).records.holders['role-anil-shetty' as never]!;
    // Anil is given EEE ZC341 and loses ME ZG523, the course of his returned SUB-0081.
    ok(
      await admin.platformRoles.assignScope({
        holderId: holderOf().id,
        target: { kind: 'course', courseId: 'electrical-machines' as CourseId },
        expectedRev: holderOf().rev,
      }),
    );
    const thermo = holderOf().scopes.find(
      (each) =>
        each.target.kind === 'course' &&
        each.target.courseId === THERMO &&
        each.withdrawal === null &&
        each.supersededAt === null,
    )!;
    ok(
      await admin.platformRoles.withdrawScope({
        holderId: holderOf().id,
        scopeId: thermo.id,
        reason: 'Moved in-house.',
        expectedRev: holderOf().rev,
      }),
    );
    const user = userEvent.setup();
    show(runtime, `${LIST}/SUB-0081/revise`);
    await title('Course and description');
    // Only the area that holds a course he may choose; the old course is named, not chosen.
    expect(options('Engineering area')).toEqual(['Electrical & Electronics']);
    expect(options('Course')).toEqual(['Choose a course', 'EEE ZC341 · Electrical Machines']);
    expect(field('Course')).toHaveValue('');
    await waitFor(() =>
      expect(document.querySelector('#Ve-course-h .ve-hint-stale')).toHaveTextContent(
        'You chose ME ZG523 · Thermodynamics & Heat Transfer, which was withdrawn from your courses while you were editing.',
      ),
    );
    // Save changes is refused with the service's words; nothing is written.
    const before = worldOf(sample).records.submissions['SUB-0081' as SubmissionId]!;
    await user.click(button('Save changes'));
    await waitFor(() =>
      expect(fieldError('Ve-course')).toBe(
        'ME ZG523 is no longer one of your assigned courses. Choose one of your courses.',
      ),
    );
    const after = worldOf(sample).records.submissions['SUB-0081' as SubmissionId]!;
    expect(after.content.courseId).toBe(THERMO);
    expect(after.rev).toBe(before.rev);
  });

  it('a draft whose course is no longer granted opens read-only and keeps its course', async () => {
    const { runtime, sample } = await tabPlatform(RITU, 'spine-start');
    const draft = await rituDraft(sample);
    const admin = asPersonId(sample, ARJUN);
    const holderOf = () => worldOf(sample).records.holders['role-ritu-sharma' as never]!;
    const process = holderOf().scopes.find(
      (each) =>
        each.target.kind === 'course' &&
        each.target.courseId === 'process-instrumentation-control' &&
        each.supersededAt === null,
    )!;
    ok(
      await admin.platformRoles.withdrawScope({
        holderId: holderOf().id,
        scopeId: process.id,
        reason: 'Moved in-house.',
        expectedRev: holderOf().rev,
      }),
    );
    show(runtime, `${LIST}/${draft.id}/edit`);
    await title('Packed Column Absorption');
    expect(text(main().querySelector('.rk-notice--warn .rk-notice-t'))).toBe(
      'CHE ZG513 is no longer assigned to you',
    );
    expect(screen.queryByRole('combobox', { name: 'Course' })).toBeNull();
    // The port refuses a save; the record keeps its course.
    const saved = await asPersonId(sample, RITU).production.saveDraft({
      id: draft.id,
      content: draft.content as never,
      step: 'course',
      expectedRev: worldOf(sample).records.submissions[draft.id]!.rev,
    });
    expect(saved).toMatchObject({
      ok: false,
      error: { kind: 'refused', code: 'course-not-assigned' },
    });
    expect(worldOf(sample).records.submissions[draft.id]!.content.courseId).toBe(
      'process-instrumentation-control',
    );
  });
});

describe('VE-04 Formats and delivery', () => {
  it(
    'the format selector, one block per chosen format with its live status, the guidance once, the drawn validation and Attach file',
    async () => {
      const { user, moves } = await anilAt(NEW);
      await title('Course and description');
      await fillStepOne(user);
      await user.click(button('Continue'));
      await waitFor(() => expect(moves).toEqual(['push /vendor/experiments/new?step=formats']));
      await title('Formats and delivery');
      expect(eyebrow()).toBe('Create experiment · Step 2 of 4');
      expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
      // The step before is complete: a tick in the stepper.
      expect(stepper().querySelector('button.is-done')).toHaveAccessibleName(
        'Step 1 of 4, Course and description, complete',
      );
      const formats = screen.getByRole('group', { name: /^Formats it supports/ });
      expect(formats).toHaveClass('rk-fieldset', 'vr-fmtsel');
      expect(
        [...formats.querySelectorAll('label.vr-fmtopt')].map((option) =>
          [...option.querySelectorAll('span')].map((span) => span.textContent),
        ),
      ).toEqual([
        ['WEB', 'Browser', 'Web link'],
        ['AR', 'Augmented reality', 'App package'],
        ['VR', 'Virtual reality', 'App package'],
        ['MR', 'Mixed reality', 'App package'],
      ]);
      expect(formats.querySelector('.xr-fmt')).toHaveClass('xr-fmt--none');
      expect(screen.queryByRole('group', { name: /Delivery details/ })).toBeNull();
      // No format chosen.
      await user.click(button('Continue'));
      await waitFor(() => expect(summaryLinks()).toEqual(['Choose at least one format']));
      expect(fieldError('Ve-fmts')).toBe('Choose at least one format');
      expect(formats).toHaveAttribute('aria-describedby', 'Ve-fmts-e');

      // WEB + VR chosen, a link without https:// and the rest empty.
      await user.click(screen.getByRole('checkbox', { name: /Browser/ }));
      await user.click(screen.getByRole('checkbox', { name: /Virtual reality/ }));
      expect(formats.querySelector('.xr-fmt')).not.toHaveClass('xr-fmt--none');
      const delivery = screen.getByRole('group', { name: 'Delivery details' });
      expect(
        within(delivery)
          .getAllByRole('region')
          .map((region) => region.id || region.getAttribute('aria-labelledby')),
      ).toEqual(['Ve-WEB-t', 'Ve-VR-t']);
      expect(text(delivery.querySelector('.vr-sec-st'))).toBe('0 of 2 formats complete');
      // The app-package guidance is written once, above the blocks; each package field points at it.
      const guide = delivery.querySelector('.vr-guide')!;
      expect(text(guide.querySelector('.vr-guide-t'))).toBe('What each app package needs');
      expect(guide).toHaveTextContent(
        'Package fields are provisional — how app packages are delivered is still open.',
      );
      const web = block('Browser · Web link');
      expect(text(web.querySelector('.vr-dlv-st'))).toBe('2 still needed');
      await user.type(
        within(web).getByLabelText('Web link'),
        'labs.northline.example/composite-wall',
      );
      const vr = block('Virtual reality · App package');
      expect(within(vr).getByLabelText('Device needed')).toHaveAccessibleDescription(
        'Which devices it runs on, and anything else it needs.',
      );
      expect(text(vr.querySelector('.vr-dlv-st'))).toBe('4 still needed');
      await user.type(within(vr).getByLabelText('Package label'), 'Composite Wall — VR build 1.0');
      expect(text(vr.querySelector('.vr-dlv-st'))).toBe('3 still needed');
      expect(text(outline().querySelector('.vr-sub'))).toBe(
        'WEB · Browser 2 still needed VR · Virtual reality 3 still needed',
      );
      await user.click(button('Continue'));
      await waitFor(() =>
        expect(summaryLinks()).toEqual([
          'Enter a web link that starts with https://',
          'Say which browser and computer WEB needs',
          'Enter a package reference for VR, or attach the package file',
          'Say which device VR needs',
          'Add install notes for VR',
        ]),
      );
      expect(text(web.querySelector('.vr-dlv-st'))).toBe('2 to fix');
      expect(web.querySelector('.vr-dlv-st')).toHaveClass('xr-st--err', 'vr-st-sm');
      expect(moves).toHaveLength(1);

      // Attach file: a sample name instead of a reference, nothing uploaded, no sample label.
      await user.click(within(vr).getByRole('button', { name: 'Attach the VR package file' }));
      const file = vr.querySelector('.ve-file.vr-file')!;
      expect(text(file)).toBe('conduction-through-a-composite-wall-vr-1.0.zip Remove');
      expect(document.getElementById('Ve-VR_ref-e')).toBeNull();
      expect(within(vr).queryByRole('button', { name: 'Attach the VR package file' })).toBeNull();
      await user.click(within(vr).getByRole('button', { name: 'Remove the VR package file' }));
      expect(
        within(vr).getByRole('button', { name: 'Attach the VR package file' }),
      ).toBeInTheDocument();

      // All four formats: AR, VR and MR share the package fields, in WEB/AR/VR/MR order.
      await user.click(screen.getByRole('checkbox', { name: /Augmented reality/ }));
      await user.click(screen.getByRole('checkbox', { name: /Mixed reality/ }));
      expect(
        within(delivery)
          .getAllByRole('region')
          .map((region) => text(region.querySelector('h3'))),
      ).toEqual([
        'Browser · Web link',
        'Augmented reality · App package',
        'Virtual reality · App package',
        'Mixed reality · App package',
      ]);
      expect(delivery.querySelectorAll('.vr-guide')).toHaveLength(1);
      // An outline entry moves focus to its block.
      await user.click(within(outline()).getByRole('button', { name: /MR · Mixed reality/ }));
      await waitFor(() => expect(document.getElementById('Ve-MR-t')).toHaveFocus());
      expectNoReferences();
    },
    SLOW,
  );

  it(
    'a complete block turns Complete; the stepper moves between steps with the values kept',
    async () => {
      const { user } = await anilAt(NEW);
      await title('Course and description');
      await fillStepOne(user);
      await user.click(button('Continue'));
      await title('Formats and delivery');
      await fillStepTwo(user);
      expect(text(block('Browser · Web link').querySelector('.vr-dlv-st'))).toBe('Complete');
      expect(text(block('Virtual reality · App package').querySelector('.vr-dlv-st'))).toBe(
        'Complete',
      );
      expect(text(main().querySelector('.vr-sec-st[role="status"]'))).toBe(
        '2 of 2 formats complete',
      );
      // The stepper's first step, then the outline's second: what was typed is kept.
      await user.click(
        within(stepper()).getByRole('button', { name: /^Step 1 of 4, Course and description/ }),
      );
      await title('Course and description');
      expect(field('Experiment name')).toHaveValue(FLOW_E.name);
      await user.click(within(outline()).getByRole('button', { name: /Formats and delivery/ }));
      await title('Formats and delivery');
      expect(
        within(block('Virtual reality · App package')).getByLabelText('Device needed'),
      ).toHaveValue(FLOW_E.device);
      expectNoReferences();
    },
    SLOW,
  );
});

// ---- VE-05, VE-06 and the submit ------------------------------------------------------------------

describe('VE-05 Preview and documents · VE-06 Check and submit', () => {
  it(
    'everything optional, a label needs a link, sample documents; the missing items; the review sections; the confirmation; the outcome card',
    async () => {
      const { user, moves, sample, go } = await anilAt(NEW);
      await title('Course and description');
      await fillStepOne(user);
      await user.click(button('Continue'));
      await title('Formats and delivery');
      await fillStepTwo(user);
      await user.click(button('Continue'));
      await title('Preview and documents');
      expect(screen.getByRole('group', { name: 'Preview' })).toHaveTextContent(
        'Everything here is optional. A preview reaches the public only if the experiment is published.',
      );
      expect(screen.getByLabelText(/^Preview label/).closest('.rk-field')).toHaveClass('vr-w3');
      // No documents: the dashed line.
      const documents = screen.getByRole('group', { name: 'Documents (optional)' });
      expect(text(documents.querySelector('p.vr-empty'))).toBe('No documents added.');
      // A label without a link.
      await user.type(screen.getByLabelText(/^Preview label/), 'Two-minute walkthrough');
      await user.click(within(documents).getByRole('button', { name: 'Add document' }));
      await user.click(within(documents).getByRole('button', { name: 'Add document' }));
      expect([...documents.querySelectorAll('ul.ve-files > li.ve-file')].map(text)).toEqual([
        'Lab handout — Composite Wall.pdf Remove',
        'Thermocouple positions.pdf Remove',
      ]);
      expect(documents.querySelector('p.vr-empty')).toBeNull();
      await user.click(button('Continue'));
      const label = 'Add a preview link for “Two-minute walkthrough”, or remove the label';
      await waitFor(() => expect(summaryLinks()).toEqual([label]));
      expect(fieldError('Ve-plink')).toBe(label);
      expect(stepper().querySelector('[aria-current="step"]')).toHaveAccessibleName(
        'Step 3 of 4, Preview and documents, check the preview link',
      );

      // On to the check without the link: the quiet warning, then the list when Submit is pressed.
      go('/vendor/experiments/new?step=submit');
      await title('Check and submit');
      expect(main().querySelector('.rk-notice--warn')).toHaveTextContent(
        '1 thing to finish before you can submit',
      );
      await user.click(button('Submit for academic review'));
      const missing = document.getElementById('Ve-miss')!;
      await waitFor(() =>
        expect(text(missing.querySelector('.rk-errsum-t'))).toBe(
          '1 thing to finish before you can submit',
        ),
      );
      expect(missing).toHaveFocus();
      expect([...missing.querySelectorAll('li .ve-errline')].map(text)).toEqual([
        `${label} Go to preview and documents`,
      ]);
      const review = (name: RegExp) => screen.getByRole('region', { name });
      expect(text(review(/^Course and description$/).querySelector('.xr-st'))).toBe('Provided');
      expect(text(review(/^Formats and delivery$/).querySelector('.xr-st'))).toBe('Provided');
      expect(review(/^Preview and documents/).querySelector('.xr-st')).toHaveClass('xr-st--warn');
      expect(text(review(/^Preview and documents/).querySelector('.xr-st'))).toBe(
        'Preview link missing',
      );
      expect(screen.queryByRole('dialog')).toBeNull();
      // “Go to preview and documents” opens the step with its error, focus on the field.
      await user.click(screen.getByRole('link', { name: 'Go to preview and documents' }));
      await title('Preview and documents');
      await waitFor(() => expect(screen.getByLabelText(/^Preview link/)).toHaveFocus());
      expect(fieldError('Ve-plink')).toBe(label);
      await user.type(
        screen.getByLabelText(/^Preview link/),
        'https://media.northline.example/composite-wall-walkthrough',
      );
      await user.click(button('Continue'));
      await title('Check and submit');

      // Ready: the notice, one review section per step with Change, the outcomes, the note.
      expect(main().querySelector('.rk-notice--ok')).toHaveTextContent(
        'Everything required is providedYou can submit it for academic review now.',
      );
      const course = review(/^Course and description$/);
      expect([...course.querySelectorAll('dl.rk-dl > dt')].map(text)).toEqual([
        'Experiment',
        'Course',
        'Version',
        'Summary',
        'Description',
      ]);
      expect([...course.querySelectorAll('dl.rk-dl > dd')].map(text)).toEqual([
        FLOW_E.name,
        'ME ZG523 · Thermodynamics & Heat Transfer',
        '1.0',
        FLOW_E.summary,
        FLOW_E.description,
      ]);
      expect(
        within(course).getByRole('button', { name: 'Change course and description' }),
      ).toHaveTextContent('Change');
      const delivery = review(/^Formats and delivery$/);
      expect([...delivery.querySelectorAll('.vr-dlv-h')].map(text)).toEqual([
        'WEB Browser · Web link',
        'VR Virtual reality · App package',
      ]);
      expect([...delivery.querySelectorAll('.vr-dlv dd')].map(text)).toEqual([
        FLOW_E.webLink,
        FLOW_E.browser,
        FLOW_E.packageLabel,
        FLOW_E.packageReference,
        FLOW_E.device,
        FLOW_E.install,
      ]);
      expect([...review(/^Preview and documents/).querySelectorAll('dd')].map(text)).toEqual([
        'Two-minute walkthrough — https://media.northline.example/composite-wall-walkthrough',
        'Lab handout — Composite Wall.pdf · Thermocouple positions.pdf',
      ]);
      expect(screen.getByRole('region', { name: 'Learning outcomes' })).toHaveTextContent(
        'None yet. The Academic Reviewer adds them during review — one set for every format.',
      );
      expect(main().querySelector('p.ve-submitnote')).toHaveTextContent(
        'Submitting sends it to the Academic Reviewer. It does not publish anything.',
      );
      expect(text(outline().querySelector('[aria-current="step"]'))).toBe(
        '4 Check and submit Ready to submit',
      );

      // The confirmation (never saved: Submit works without an id), then the outcome card.
      await user.click(button('Submit for academic review'));
      const dialog = await screen.findByRole('dialog', { name: 'Submit for academic review?' });
      expect(dialog).toHaveAccessibleDescription(
        'This sends “Conduction Through a Composite Wall” to the Academic Reviewer. It does not publish anything.',
      );
      expect([...dialog.querySelectorAll('.rk-dlg-group')].map(text)).toEqual([
        'What happens now It is with the Academic Reviewer. You can’t edit it while it is being reviewed.',
        'Only after later events If it comes back to you, you can revise it.',
      ]);
      expect(
        within(dialog).getByRole('heading', { name: 'Submit for academic review?' }),
      ).toHaveFocus();
      await user.click(within(dialog).getByRole('button', { name: 'Submit for academic review' }));
      await title('Submitted for academic review');
      const card = document.getElementById('Ve-done')!;
      expect(card).toHaveClass('rk-surface', 'vr-outcome');
      expect(text(card.querySelector('.rk-eyebrow'))).toBe(FLOW_E.name);
      expectNoReferences();
      expect(text(card.querySelector('.vr-outcome-d'))).toBe(
        'It is with the Academic Reviewer. Nothing is published. You can’t edit it while it is being reviewed.',
      );
      expect([...card.querySelectorAll('.vr-facts dt')].map(text)).toEqual([
        'Status',
        'Submitted',
        'Formats',
      ]);
      expect(text(card.querySelector('.vr-facts .xr-st'))).toBe('With Academic Reviewer');
      expect(card.querySelector('.vr-facts .xr-st')).toHaveClass('xr-st--info', 'rk-st-lg');
      expect(text(card.querySelector('.ve-chips .xr-sr'))).toBe('Formats: WEB, VR');
      expect(text(card.querySelector('.rk-next'))).toBe(
        'Nothing is published. If it comes back to you, you can revise it here.',
      );
      expect(screen.getByRole('link', { name: 'Open the experiment record' })).toHaveAttribute(
        'href',
        '/vendor/experiments/SUB-0077',
      );
      expect(screen.getByRole('link', { name: 'Back to My experiments' })).toHaveAttribute(
        'href',
        LIST,
      );
      expect(text(crumbs())).toBe(`My experiments ${FLOW_E.name} Submitted for academic review`);
      await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus());
      const [submitted] = submissionsNamed(sample, FLOW_E.name);
      expect(submitted).toMatchObject({
        id: 'SUB-0077',
        revision: 1,
        status: { state: 'with-academic-reviewer', reason: 'first-review' },
      });
      expect(submitted!.content.documents).toEqual([
        { fileName: 'Lab handout — Composite Wall.pdf' },
        { fileName: 'Thermocouple positions.pdf' },
      ]);
      // Submitting publishes nothing: no experiment comes from SUB-0077.
      expect(
        Object.values(worldOf(sample).records.experiments).filter(
          (experiment) => experiment.originSubmissionId === 'SUB-0077',
        ),
      ).toHaveLength(0);
      expect(moves.filter((move) => move.startsWith('replace'))).toEqual([]);
      expectNoReferences();
    },
    SLOW,
  );

  it(
    'Change on a review section opens its step; no format chosen reads “None chosen yet”; Remove empties the documents',
    async () => {
      const { user, go } = await anilAt(NEW);
      await title('Course and description');
      await fillStepOne(user);
      go('/vendor/experiments/new?step=submit');
      await title('Check and submit');
      const delivery = screen.getByRole('region', { name: 'Formats and delivery' });
      expect(text(delivery.querySelector('p.vr-empty'))).toBe('None chosen yet');
      expect(text(delivery.querySelector('.xr-st'))).toBe('1 missing');
      expect(
        text(
          screen.getByRole('region', { name: /^Preview and documents/ }).querySelector('.xr-st'),
        ),
      ).toBe('None — optional');
      await user.click(
        within(delivery).getByRole('button', { name: 'Change formats and delivery' }),
      );
      await title('Formats and delivery');
      go('/vendor/experiments/new?step=preview');
      await title('Preview and documents');
      await user.click(button('Add document'));
      await user.click(button('Remove Lab handout — Composite Wall.pdf'));
      expect(text(main().querySelector('p.vr-empty'))).toBe('No documents added.');
      expectNoReferences();
    },
    SLOW,
  );

  it(
    'a failure for now keeps everything and says nothing was sent',
    async () => {
      const { user, sample, go } = await anilAt(NEW);
      await title('Course and description');
      await fillStepOne(user);
      go('/vendor/experiments/new?step=formats');
      await title('Formats and delivery');
      await fillStepTwo(user);
      go('/vendor/experiments/new?step=submit');
      await title('Check and submit');
      faults(sample).failNext('ProductionService.submitForReview' as never);
      await user.click(button('Submit for academic review'));
      const dialog = await screen.findByRole('dialog', { name: 'Submit for academic review?' });
      await user.click(within(dialog).getByRole('button', { name: 'Submit for academic review' }));
      await waitFor(() =>
        expect(main().querySelector('.vr-errwrap .rk-notice[role="alert"]')).toHaveTextContent(
          'We couldn’t submit it. Nothing was sent — try again.',
        ),
      );
      expect(submissionsNamed(sample, FLOW_E.name)).toHaveLength(0);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Check and submit');
      expectNoReferences();
    },
    SLOW,
  );
});

// ---- VE-09 Edit draft and the read-only draft ----------------------------------------------------

describe('VE-09 Edit draft', () => {
  it(
    'a saved draft opens where it was last saved',
    async () => {
      const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
      const vendor = asPersonId(sample, ANIL);
      const pin = worldOf(sample).records.submissions['SUB-0079']!;
      await act(async () => {
        ok(
          await vendor.production.saveDraft({
            id: 'SUB-0079' as SubmissionId,
            content: { ...pin.content, courseId: THERMO as CourseId },
            step: 'formats',
            expectedRev: pin.rev,
          }),
        );
      });
      const { moves } = show(runtime, '/vendor/experiments/SUB-0079/edit');
      await title('Formats and delivery');
      expect(moves).toEqual(['replace /vendor/experiments/SUB-0079/edit?step=formats']);
      expect(eyebrow()).toBe('Edit draft · Step 2 of 4');
      expect(idLine()).toBe('Only you can see a draft');
      expect(text(crumbs())).toBe('My experiments Pin Fin Efficiency Edit draft');
      expect(screen.getByRole('checkbox', { name: /Browser/ })).toBeChecked();
      expect(block('Browser · Web link')).toBeInTheDocument();
      expectNoReferences();
    },
    SLOW,
  );

  it(
    'a draft whose course is no longer assigned is read-only — the notice and “What you entered”',
    async () => {
      await anilAt('/vendor/experiments/SUB-0083/edit');
      await title('Surface Roughness in Turning');
      expect(eyebrow()).toBe('Experiment');
      expect(text(crumbs())).toBe('My experiments Surface Roughness in Turning Read-only');
      expect(main().querySelector('.rk-meta .xr-st')).toHaveClass('xr-st--paused', 'rk-st-lg');
      expect(text(main().querySelector('.rk-meta .xr-st'))).toBe('Draft · read-only');
      expect(idLine()).toMatch(/^Last saved \d{1,2} [A-Z][a-z]{2} 2026, \d\d:\d\d$/);
      const notice = main().querySelector('.rk-notice--warn')!;
      expect(text(notice.querySelector('.rk-notice-t'))).toBe(
        'MEL ZG512 is no longer assigned to you',
      );
      expect(notice).toHaveTextContent(
        'MEL ZG512 · Manufacturing Processes was withdrawn from Northline Simulation Studio. This draft is kept, read-only. BITS / WILP decides which courses are yours.',
      );
      expect(
        within(notice as HTMLElement).getByRole('link', { name: 'Back to My experiments' }),
      ).toHaveAttribute('href', LIST);
      // XS-07's report form, "Where" filled in from this page (LINK-MAP L45), as the record's.
      expect(
        within(notice as HTMLElement).getByRole('link', { name: 'Ask for help' }),
      ).toHaveAttribute('href', '/vendor/help/report');
      const entered = screen.getByRole('region', { name: 'What you entered' });
      expect(entered).toHaveClass('rk-surface', 'vr-sheet');
      expect([...entered.querySelectorAll(':scope .vr-sec > dl.rk-dl > dt')].map(text)).toEqual([
        'Course',
        'Summary',
        'Version',
        'Formats',
      ]);
      expect(entered.querySelector('.vr-dlvs--after .vr-dlv')).toHaveTextContent(
        'WEBBrowser · Web linkWeb linkhttps://labs.northline.example/surface-roughnessBrowser and computerA current browser on a laptop or desktop',
      );
      expect(screen.queryByRole('button', { name: 'Save draft' })).toBeNull();
      expect(document.querySelector('.vr-form')).toBeNull();
      expectNoReferences();
    },
    SLOW,
  );
});

// ---- VE-08 Revise and resubmit ------------------------------------------------------------------

describe('VE-08 Revise and resubmit', () => {
  it(
    'the returned reason above the editor takes focus first; a reference opens its field, tagged',
    async () => {
      const { user, moves } = await anilAt('/vendor/experiments/SUB-0081/revise');
      await title('Course and description');
      expect(eyebrow()).toBe('Revise and resubmit · Step 1 of 4');
      expect(idLine()).toBe('Revision 1 was returned');
      expect(main().querySelector('.rk-meta .xr-st')).toHaveClass('xr-st--err');
      expect(text(crumbs())).toBe('My experiments Forced Convection Revise and resubmit');
      const reason = await screen.findByRole('region', {
        name: 'Returned by the Academic Reviewer',
      });
      expect(reason).toHaveClass('vr-ret');
      await waitFor(() => expect(reason).toHaveFocus());
      expect(text(reason.querySelector('.vr-ret-m'))).toMatch(
        /^24 Aug 2026, \d\d:\d\d · Prof\. A\. Menon$/,
      );
      expect(text(reason.querySelector('blockquote.vr-ret-q'))).toBe(
        'The AR install notes don’t say which phones and tablets it runs on. Add the supported devices and the install steps.',
      );
      const references = within(reason).getByRole('list', { name: 'What it refers to' });
      expect(
        within(references)
          .getAllByRole('button')
          .map((each) => each.textContent),
      ).toEqual([
        'Formats & delivery · AR · Device need',
        'Formats & delivery · AR · Install notes',
      ]);
      expect(button('Save changes')).toBeInTheDocument();
      expect(text(outline().querySelector('.ve-prog-k'))).toBe('Revision 1 returned');
      expect(text(outline().querySelector('.ve-prog-meta'))).toBe(
        'No changes saved yet Others see revision 1 as submitted until you resubmit.',
      );
      // The reason sits above the editor.
      expect(
        reason.compareDocumentPosition(stepper()) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
      expect(main().querySelector('.ve-reftag')).toBeNull();
      await user.click(
        within(reason).getByRole('button', {
          name: 'Go to Formats & delivery · AR · Install notes',
        }),
      );
      await title('Formats and delivery');
      expect(moves).toEqual(['push /vendor/experiments/SUB-0081/revise?step=formats']);
      const ar = block('Augmented reality · App package');
      await waitFor(() => expect(within(ar).getByLabelText('Install notes')).toHaveFocus());
      // Both referenced fields carry the tag.
      expect(
        [...ar.querySelectorAll('.rk-field')]
          .filter((each) => each.querySelector('.rk-tag-warn.ve-reftag'))
          .map((each) => text(each.querySelector('label'))),
      ).toEqual(['Device needed', 'Install notes']);
      expect(text(ar.querySelector('.ve-reftag'))).toBe('Referred to in the return');
      expectNoReferences();
    },
    SLOW,
  );

  it(
    'Save changes keeps them privately; Resubmit through the confirmation reads “Submitted”; the reviewer’s queue holds revision 2; the stale link is refused',
    async () => {
      const { user, sample, go } = await anilAt('/vendor/experiments/SUB-0081/revise?step=formats');
      await title('Formats and delivery');
      const ar = block('Augmented reality · App package');
      const device = within(ar).getByLabelText('Device needed');
      await user.clear(device);
      await user.type(device, 'Android phones and tablets with ARCore, iOS 16 or later.');
      await user.click(button('Save changes'));
      const saved = await waitFor(() => {
        const line = document.getElementById('Ve-saved');
        expect(line).not.toBeNull();
        return line!;
      });
      expect(text(saved)).toMatch(
        /^Changes saved · \d{1,2} [A-Z][a-z]{2} 2026, \d\d:\d\d · not resubmitted yet$/,
      );
      expect(worldOf(sample).records.submissions['SUB-0081']!.status.state).toBe('returned');
      await waitFor(() =>
        expect(text(outline().querySelector('.ve-prog-meta b'))).toMatch(
          /^Changes saved · \d\d:\d\d today · not resubmitted$/,
        ),
      );
      // No changed-field list: the read model does not say which fields changed.
      expect(main().querySelector('.vr-ret-pend')).toBeNull();

      await user.click(button('Continue'));
      await title('Preview and documents');
      await user.click(button('Continue'));
      await title('Check and submit');
      expect(eyebrow()).toBe('Revise and resubmit · Step 4 of 4');
      expect(main().querySelector('.rk-notice--ok')).toHaveTextContent('You can resubmit it now.');
      expect(main().querySelector('p.ve-submitnote')).toHaveTextContent(
        'Resubmitting sends your changes for review. It does not publish anything.',
      );
      await user.click(button('Resubmit'));
      const dialog = await screen.findByRole('dialog', { name: 'Resubmit your changes?' });
      expect(dialog).toHaveAccessibleDescription(
        'Your changes are submitted for review. This does not publish anything.',
      );
      expect(dialog).toHaveTextContent('Your changes are sent as revision 2.');
      expect(within(dialog).getByRole('button', { name: 'Keep editing' })).toBeInTheDocument();
      await user.click(within(dialog).getByRole('button', { name: 'Resubmit' }));
      await title('Submitted');
      const card = document.getElementById('Ve-done')!;
      expect(text(card.querySelector('.vr-outcome-d'))).toBe(
        'Your changes have been submitted for review.',
      );
      expect(text(card.querySelector('.rk-eyebrow'))).toBe('Forced Convection');
      expectNoReferences();
      expect([...card.querySelectorAll('.vr-facts > div')].map(text).slice(0, 2)).toEqual([
        'Status Submitted',
        'Revision 2',
      ]);
      expect(text(card.querySelector('.rk-next'))).toBe(
        'Nothing is needed from you now. If it comes back to you, you can revise it again.',
      );
      // M-3: no reviewer, Content Manager or other stage named.
      expect(text(card)).not.toMatch(/Reviewer|Content Manager/);
      const record = worldOf(sample).records.submissions['SUB-0081']!;
      expect(record.revision).toBe(2);
      // The routing stand-in sent it back to the Academic Reviewer (PC-66).
      const queue = ok(await asPersonId(sample, MENON).production.getReviewQueue({}));
      expect(queue.find((item) => item.ref.id === 'SUB-0081')).toMatchObject({
        name: 'Forced Convection',
      });
      expect(record.status).toMatchObject({
        state: 'with-academic-reviewer',
        reason: 'resubmission',
      });
      // The stale revise link now: “This experiment was already submitted”.
      go('/vendor/experiments/SUB-0074/edit');
      await title('This experiment was approved by the Academic Reviewer');
      go('/vendor/experiments/SUB-0081/revise');
      await title('This experiment was already submitted');
      expect(main()).toHaveTextContent(
        /It was submitted on \d{1,2} [A-Z][a-z]{2} 2026\. You can’t edit it after it is submitted\. If it is returned to you, you can revise it here\./,
      );
      expectNoReferences();
    },
    SLOW,
  );

  it(
    'the record’s chip names its reference in the address (`field=`): that field takes focus, tagged',
    async () => {
      await anilAt('/vendor/experiments/SUB-0081/revise?step=formats&field=ar.device-need');
      await title('Formats and delivery');
      const device = within(block('Augmented reality · App package')).getByLabelText(
        'Device needed',
      );
      await waitFor(() => expect(device).toHaveFocus());
      expect(device.closest('.rk-field')!.querySelector('.ve-reftag')).toHaveTextContent(
        'Referred to in the return',
      );
      expectNoReferences();
    },
    SLOW,
  );

  it('reviseReferenceAddress: a reference’s step and field (`field=`), as the record’s chips open it', () => {
    const reference = (
      step: ReturnReference['step'],
      format: ReturnReference['format'],
      field: ReturnReference['field'],
    ): ReturnReference => ({ step, format, field });
    expect(
      reviseReferenceAddress('SUB-0081', reference('formats-and-delivery', 'ar', 'device-need')),
    ).toBe('/vendor/experiments/SUB-0081/revise?step=formats&field=ar.device-need');
    expect(
      reviseReferenceAddress('SUB-0081', reference('preview-and-documents', null, 'preview-link')),
    ).toBe('/vendor/experiments/SUB-0081/revise?step=preview&field=preview-link');
    // The first step is the address's default: a Course and description reference has no `step=`.
    expect(
      reviseReferenceAddress('SUB-0074', reference('course-and-description', null, 'summary')),
    ).toBe('/vendor/experiments/SUB-0074/revise?field=summary');
  });

  it(
    'a `field=` that names none of the return’s references leaves the reason to take focus',
    async () => {
      await anilAt('/vendor/experiments/SUB-0081/revise?field=summary');
      await title('Course and description');
      const reason = await screen.findByRole('region', {
        name: 'Returned by the Academic Reviewer',
      });
      await waitFor(() => expect(reason).toHaveFocus());
      expectNoReferences();
    },
    SLOW,
  );

  it(
    'returned by the Content Manager — her reason and its reference to the summary in step 1',
    async () => {
      const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
      const transient = worldOf(sample).records.submissions['SUB-0074']!;
      const reason =
        'The summary runs to three sentences. Shorten it to one; the catalogue shows only the first line.';
      await act(async () => {
        ok(
          await asPersonId(sample, 'per-kavya-nair').production.sendBack({
            id: 'SUB-0074' as SubmissionId,
            to: 'vendor',
            reason,
            references: [{ step: 'course-and-description', format: null, field: 'summary' }],
            expectedRev: transient.rev,
          }),
        );
      });
      const user = userEvent.setup();
      show(runtime, '/vendor/experiments/SUB-0074/revise?step=preview');
      await title('Preview and documents');
      const notice = await screen.findByRole('region', {
        name: 'Returned by the Content Manager',
      });
      expect(text(notice.querySelector('.vr-ret-m'))).toMatch(/ · Kavya Nair$/);
      expect(text(notice.querySelector('blockquote'))).toBe(reason);
      await user.click(
        within(notice).getByRole('button', { name: 'Go to Course & description · Summary' }),
      );
      await title('Course and description');
      await waitFor(() => expect(field('Summary')).toHaveFocus());
      expect(field('Summary').closest('.rk-field')!.querySelector('.ve-reftag')).toHaveTextContent(
        'Referred to in the return',
      );
      expectNoReferences();
    },
    SLOW,
  );

  it(
    'an edit address for a returned record becomes its revise address',
    async () => {
      const { moves } = await anilAt('/vendor/experiments/SUB-0081/edit?step=preview');
      await waitFor(() =>
        expect(moves).toEqual(['replace /vendor/experiments/SUB-0081/revise?step=preview']),
      );
      await title('Preview and documents');
      expectNoReferences();
    },
    SLOW,
  );
});

describe('the editor’s other states', () => {
  it('no course assigned (PD-3): Create experiment keeps its heading and explains, no form and no “not found”', async () => {
    const { runtime, sample } = await tabPlatform(null, 'spine-start');
    const holder = await asPersonId(sample, ARJUN).platformRoles.registerHolder({
      role: 'vendor',
      name: 'Kiran Rao',
      workEmail: 'kiran.rao@northline.example',
      organisation: 'Northline Simulation Studio',
      anyCourse: false,
    });
    if (!holder.ok) throw new Error('registered');
    beginSession(sample, holder.value.personId);
    await runtime.session.refresh();
    show(runtime, '/vendor/experiments/new');
    expect(
      await screen.findByRole('heading', { level: 2, name: 'No course is assigned to you yet' }),
    ).toBeVisible();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Create experiment');
    expect(main()).toHaveTextContent(
      'The platform team assigns the courses you can submit experiments to. Once a course is assigned, you can create experiments here.',
    );
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Save draft' })).toBeNull();
    expect(screen.queryByText('We can’t find that page')).toBeNull();
  });

  it(
    'a record with others is refused with the export’s words and the two ways on (SUB-0074, with the Content Manager)',
    async () => {
      await anilAt('/vendor/experiments/SUB-0074/edit');
      await title('This experiment was approved by the Academic Reviewer');
      const refusal = screen.getByRole('region', {
        name: 'This experiment was approved by the Academic Reviewer',
      });
      expect(refusal.querySelector('.rk-state.rk-state--roomy .ve-ico-lock')).not.toBeNull();
      expect(text(refusal.querySelector('.rk-eyebrow'))).toBe('Transient Cooling');
      expect(text(refusal.querySelector('.rk-state-d'))).toBe(
        'It is with the Content Manager. Nothing is needed from you now.',
      );
      expect(
        within(refusal).getByRole('link', { name: 'Open the experiment record' }),
      ).toHaveAttribute('href', '/vendor/experiments/SUB-0074');
      expect(within(refusal).getByRole('link', { name: 'Back to My experiments' })).toHaveAttribute(
        'href',
        LIST,
      );
      expect(text(crumbs())).toBe('My experiments Transient Cooling Edit draft');
      expectNoReferences();
    },
    SLOW,
  );

  it(
    'another vendor’s record is not found (SUB-0086, Meridian Virtual Labs)',
    async () => {
      await anilAt('/vendor/experiments/SUB-0086/edit');
      expect(await title('We can’t find that page')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Save draft' })).toBeNull();
      expectNoReferences();
    },
    SLOW,
  );
});

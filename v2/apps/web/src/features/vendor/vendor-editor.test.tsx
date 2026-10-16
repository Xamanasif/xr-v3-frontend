/**
 * The experiment editor — VE-03 … VE-06 (boards B5-03, B5-04, B5-05), VE-09 Edit draft and VE-08
 * Revise and resubmit (B5-07) — on the real composition root and the sample world (`spine-start`),
 * as Anil Shetty of Northline Simulation Studio. The router is the test's: the editor stays mounted
 * across its own `?step=` and another address unmounts it, as Next.js does. Each drawn state: the
 * validation per step (B5-03 f3, B5-04 f4, f5, B5-05 f4), the name already in use (f4, the
 * service's answer), a course withdrawn while editing (f5), the first save minting SUB-0077 (f6),
 * what was typed kept across in-app navigation, the missing items with their links (B5-05 f5), DL-1
 * and the submitted result (f6, f1), the read-only draft (B5-07 f6), and a revision returned by
 * the Academic Reviewer: the reason box, its references, Save changes and Resubmit → “Submitted”
 * (B5-07 f0, f2, f3, f4; M-3) — and the one world moving: the reviewer's queue holds revision 2.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CourseId, SubmissionId } from '@xr/domain';
import { asPersonId, faults, worldOf } from '@xr/sample-platform/testing';
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
const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
const title = async (name: string) =>
  screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });
const overline = () => text(main().querySelector('.xr-phead .xr-overline'));
const idLine = () => text(main().querySelector('.xr-phead-meta .xl-meta'));
const summary = () => document.getElementById('Ve-err');
const summaryLinks = () =>
  [...(summary()?.querySelectorAll('li a') ?? [])].map((link) => link.textContent);
const fieldError = (id: string) => text(document.getElementById(`${id}-e`));
const button = (name: string | RegExp) => screen.getByRole('button', { name });
const panel = (name: string) => screen.getByRole('region', { name });

async function fillStepOne(user: ReturnType<typeof userEvent.setup>, name: string = FLOW_E.name) {
  await user.selectOptions(screen.getByRole('combobox', { name: 'Course' }), THERMO);
  const nameField = screen.getByLabelText('Experiment name');
  await user.clear(nameField);
  await user.type(nameField, name);
  await user.type(screen.getByLabelText('Summary'), FLOW_E.summary);
  await user.type(screen.getByLabelText('Description'), FLOW_E.description);
  await user.type(screen.getByLabelText('Version'), FLOW_E.version);
}

async function fillStepTwo(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('checkbox', { name: /Browser \(WEB\)/ }));
  await user.click(screen.getByRole('checkbox', { name: /Virtual reality \(VR\)/ }));
  const web = panel('Browser (WEB) · Web link');
  await user.type(within(web).getByLabelText('Web link'), FLOW_E.webLink);
  await user.type(within(web).getByLabelText('Browser and computer needed'), FLOW_E.browser);
  const vr = panel('Virtual reality (VR) · App package');
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

describe('VE-03 Course and description (B5-03)', () => {
  it(
    'f0: the header, the stepper, only the assigned courses, the fields and the footer',
    async () => {
      const { user } = await anilAt(NEW);
      await title('Course and description');
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(overline()).toBe('Create experiment · Step 1 of 4');
      expect(idLine()).toBe('Not saved yet');
      expect(main().querySelector('a.xr-back')).toHaveTextContent('My experiments');
      const steps = screen.getByRole('list', { name: 'Steps' });
      expect([...steps.querySelectorAll('li')].map((step) => text(step))).toEqual([
        'Step 1Course',
        'Step 2Formats',
        'Step 3Preview',
        'Step 4Check',
      ]);
      expect(steps.querySelector('[aria-current="step"]')).toHaveTextContent('Course');
      const course = screen.getByRole('combobox', { name: 'Course' });
      expect([...course.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
        'Choose a course',
        'ME ZG523 · Thermodynamics & Heat Transfer',
      ]);
      expect(main()).toHaveTextContent(
        'Only the courses assigned to Northline Simulation Studio are listed.',
      );
      for (const label of ['Experiment name', 'Summary', 'Description', 'Version'])
        expect(screen.getByLabelText(label)).toBeInTheDocument();
      expect(main().querySelector('p.xl-open')).toHaveTextContent(
        'Prototype field set — the catalogue fields, and who maps an experiment to a course, are still open (T-29). Learning outcomes are added by the Academic Reviewer.',
      );
      const foot = main().querySelector('.xw-flow-foot')!;
      expect(within(foot as HTMLElement).getByRole('link', { name: 'Cancel' })).toHaveAttribute(
        'href',
        LIST,
      );
      expect(button('Save draft')).toHaveClass('xr-btn--secondary');
      expect(button('Continue')).toHaveClass('xr-btn--primary');
      // The shell: My experiments current; the top bar “My experiments / Experiment”.
      const sidebar = screen.getByRole('navigation', { name: 'Vendor navigation' });
      expect(sidebar.querySelector('[aria-current="page"]')).toHaveAttribute('href', LIST);
      expect(screen.getByRole('list', { name: 'You are here' })).toHaveTextContent(
        /My experiments\s*\/\s*Experiment/,
      );
      void user;
    },
    SLOW,
  );

  it(
    'f3: Continue with nothing entered — every field’s error and the summary, which takes focus',
    async () => {
      const { user, moves } = await anilAt(NEW);
      await title('Course and description');
      await user.click(button('Continue'));
      await waitFor(() => expect(summary()).not.toBeNull());
      expect(text(summary()!.querySelector('strong'))).toBe('Check this step');
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
      expect(screen.getByLabelText('Experiment name')).toHaveAttribute('aria-invalid', 'true');
      // A summary link moves focus to its field; typing clears that field's error.
      await user.click(screen.getByRole('link', { name: 'Enter a description' }));
      expect(screen.getByLabelText('Description')).toHaveFocus();
      await user.type(screen.getByLabelText('Description'), 'x');
      expect(document.getElementById('Ve-desc-e')).toBeNull();
      expect(moves).toEqual([]);
    },
    SLOW,
  );

  it(
    'f4: a name already in use is the service’s answer (the published “Composite Wall Conduction”)',
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
    },
    SLOW,
  );

  it(
    'Save draft needs a name; the first save mints SUB-0077 and gives the draft its own address (f6)',
    async () => {
      const { user, moves, sample } = await anilAt(NEW);
      await title('Course and description');
      await user.click(button('Save draft'));
      await waitFor(() => expect(summaryLinks()).toEqual(['Enter a name to save a draft']));
      expect(submissionsNamed(sample, FLOW_E.name)).toHaveLength(0);

      await fillStepOne(user);
      await user.click(button('Save draft'));
      await waitFor(() => expect(moves).toEqual(['replace /vendor/experiments/SUB-0077/edit']));
      await waitFor(() => expect(idLine()).toBe('SUB-0077 · draft'));
      expect(overline()).toBe('Edit draft · Step 1 of 4');
      const saved = document.getElementById('Ve-saved')!;
      expect(saved).toHaveClass('xa-save', 'is-ok');
      expect(text(saved)).toMatch(/^Draft saved · \d{1,2} [A-Z][a-z]{2} 2026, \d\d:\d\d$/);
      expect(saved).toHaveFocus();
      // The saved record carries what was typed; only the Vendor sees a draft.
      const [draft] = submissionsNamed(sample, FLOW_E.name);
      expect(draft).toMatchObject({ id: 'SUB-0077', status: { state: 'draft' } });
      expect(draft!.content).toMatchObject({
        courseId: THERMO,
        summary: FLOW_E.summary,
        version: '1.0',
      });
      expect(screen.getByLabelText('Experiment name')).toHaveValue(FLOW_E.name);
      // A change clears the saved line (B5-03 `saved: ''`).
      await user.type(screen.getByLabelText('Version'), '1');
      expect(document.getElementById('Ve-saved')).toBeNull();
    },
    SLOW,
  );

  it(
    'what is typed survives leaving the editor and coming back, for this session only',
    async () => {
      const { user, go } = await anilAt(NEW);
      await title('Course and description');
      await user.type(screen.getByLabelText('Experiment name'), 'Half-typed name');
      go(LIST);
      expect(await screen.findByTestId('elsewhere')).toHaveTextContent(LIST);
      go(NEW);
      await title('Course and description');
      expect(screen.getByLabelText('Experiment name')).toHaveValue('Half-typed name');
      // Cancel drops it.
      await user.click(screen.getByRole('link', { name: 'Cancel' }));
      go(NEW);
      await title('Course and description');
      expect(screen.getByLabelText('Experiment name')).toHaveValue('');
    },
    SLOW,
  );

  it(
    'f5: a course withdrawn while editing — the warning hint and the service’s words',
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
      await user.type(screen.getByLabelText('Experiment name'), FLOW_E.name);
      await user.type(screen.getByLabelText('Summary'), FLOW_E.summary);
      await user.type(screen.getByLabelText('Description'), FLOW_E.description);
      await user.type(screen.getByLabelText('Version'), '1.0');
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
        expect(main()).toHaveTextContent(
          'You chose MEL ZG512 · Manufacturing Processes, which was withdrawn from your courses while you were editing.',
        ),
      );
      await user.click(button('Continue'));
      const words =
        'MEL ZG512 is no longer one of your assigned courses. Choose one of your courses.';
      await waitFor(() => expect(summaryLinks()).toEqual([words]));
      expect(fieldError('Ve-course')).toBe(words);
    },
    SLOW,
  );
});

// ---- VE-04 Formats and delivery ----------------------------------------------------------------

describe('VE-04 Formats and delivery (B5-04)', () => {
  it(
    'f0 → f3: one panel per ticked format; f5 and f4 validation; Choose file adds a sample name only',
    async () => {
      const { user, moves } = await anilAt(NEW);
      await title('Course and description');
      await fillStepOne(user);
      await user.click(button('Continue'));
      await waitFor(() => expect(moves).toEqual(['push /vendor/experiments/new?step=formats']));
      await title('Formats and delivery');
      expect(overline()).toBe('Create experiment · Step 2 of 4');
      expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
      const formats = screen.getByRole('group', { name: 'Formats it supports' });
      expect(
        within(formats)
          .getAllByRole('checkbox')
          .map((box) => box.closest('label')?.textContent?.replace(/\s+/g, ' ').trim()),
      ).toEqual([
        'WEB Browser (WEB)',
        'AR Augmented reality (AR)',
        'VR Virtual reality (VR)',
        'MR Mixed reality (MR)',
      ]);
      // f5: no format.
      await user.click(button('Continue'));
      await waitFor(() => expect(summaryLinks()).toEqual(['Choose at least one format']));
      expect(fieldError('Ve-fmts')).toBe('Choose at least one format');

      // f4: WEB + VR ticked, a link without https:// and the rest empty.
      await user.click(screen.getByRole('checkbox', { name: /Browser \(WEB\)/ }));
      await user.click(screen.getByRole('checkbox', { name: /Virtual reality \(VR\)/ }));
      expect(
        screen.getAllByRole('region').map((region) => region.getAttribute('aria-labelledby')),
      ).toEqual(['Ve-WEB-t', 'Ve-VR-t']);
      const web = panel('Browser (WEB) · Web link');
      await user.type(
        within(web).getByLabelText('Web link'),
        'labs.northline.example/composite-wall',
      );
      const vr = panel('Virtual reality (VR) · App package');
      expect(vr).toHaveTextContent(
        'Package fields are provisional — how app packages are delivered is still open (T-14).',
      );
      await user.type(within(vr).getByLabelText('Package label'), 'Composite Wall — VR build 1.0');
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
      expect(moves).toHaveLength(1);

      // A package file instead of a reference: a sample name, nothing uploaded (f1).
      await user.click(within(vr).getByRole('button', { name: 'Choose file' }));
      // The board's “(sample file)” marker is a canvas label: sample labels do not ship (T-36).
      expect(vr.querySelector('.xv-file')).toHaveTextContent(
        'conduction-through-a-composite-wall-vr-1.0.zipRemove',
      );
      expect(document.getElementById('Ve-VR_ref-e')).toBeNull();
      await user.click(within(vr).getByRole('button', { name: 'Remove the VR package file' }));
      expect(within(vr).getByRole('button', { name: 'Choose file' })).toBeInTheDocument();

      // f6: all four formats — AR, VR and MR share the package fields.
      await user.click(screen.getByRole('checkbox', { name: /Augmented reality \(AR\)/ }));
      await user.click(screen.getByRole('checkbox', { name: /Mixed reality \(MR\)/ }));
      expect(
        screen.getAllByRole('region').map((region) => text(region.querySelector('h3'))),
      ).toEqual([
        'Browser (WEB) · Web link',
        'Augmented reality (AR) · App package',
        'Virtual reality (VR) · App package',
        'Mixed reality (MR) · App package',
      ]);
    },
    SLOW,
  );
});

// ---- VE-05, VE-06 and the submit ------------------------------------------------------------------

describe('VE-05 Preview and documents · VE-06 Check and submit (B5-05)', () => {
  it(
    'f3, f4: everything optional, a label needs a link, sample documents; f5 missing items; f6 DL-1; f1 submitted',
    async () => {
      const { user, moves, sample, go } = await anilAt(NEW);
      await title('Course and description');
      await fillStepOne(user);
      await user.click(button('Continue'));
      await title('Formats and delivery');
      await fillStepTwo(user);
      await user.click(button('Continue'));
      await title('Preview and documents');
      expect(main()).toHaveTextContent(
        'Everything here is optional. A preview reaches the public only if the experiment is published.',
      );
      expect(main()).toHaveTextContent('No documents added.');
      // f4: a label without a link.
      await user.type(screen.getByLabelText(/^Preview label/), 'Two-minute walkthrough');
      await user.click(button('Add document'));
      await user.click(button('Add document'));
      expect([...main().querySelectorAll('ul.xv-files > li')].map((item) => text(item))).toEqual([
        'Lab handout — Composite Wall.pdfRemove',
        'Thermocouple positions.pdfRemove',
      ]);
      await user.click(button('Continue'));
      const label = 'Add a preview link for “Two-minute walkthrough”, or remove the label';
      await waitFor(() => expect(summaryLinks()).toEqual([label]));
      expect(fieldError('Ve-plink')).toBe(label);

      // Go on to the check without the link: the quiet warning, then f5 when Submit is pressed.
      go('/vendor/experiments/new?step=submit');
      await title('Check and submit');
      expect(main().querySelector('.xr-notice--warn')).toHaveTextContent(
        '1 thing to finish before you can submit',
      );
      await user.click(button('Submit for academic review'));
      const missing = document.getElementById('Ve-miss')!;
      await waitFor(() =>
        expect(text(missing.querySelector('strong'))).toBe(
          '1 thing to finish before you can submit',
        ),
      );
      expect(missing).toHaveFocus();
      expect([...missing.querySelectorAll('li')].map((item) => text(item))).toEqual([
        `${label}Go to preview and documents`,
      ]);
      const rows = [...main().querySelectorAll('ul.xv-checklist > li')].map((row) => text(row));
      expect(rows).toEqual([
        'Course and descriptionProvidedChange',
        'Formats and deliveryProvidedChange',
        'Preview and documents (optional)Preview link missingChange',
      ]);
      expect(screen.queryByRole('dialog')).toBeNull();
      // “Go to preview and documents” opens the step with its error, focus on the field.
      await user.click(button('Go to preview and documents'));
      await title('Preview and documents');
      await waitFor(() => expect(screen.getByLabelText(/^Preview link/)).toHaveFocus());
      expect(fieldError('Ve-plink')).toBe(label);
      await user.type(
        screen.getByLabelText(/^Preview link/),
        'https://media.northline.example/composite-wall-walkthrough',
      );
      await user.click(button('Continue'));
      await title('Check and submit');

      // f0: everything provided, the summary and the outcomes (none yet).
      expect(main().querySelector('.xr-notice--ok')).toHaveTextContent(
        'Everything required is providedYou can submit it for academic review now.',
      );
      expect([...main().querySelectorAll('dl.xv-kv > dt')].map((term) => text(term))).toEqual([
        'Experiment',
        'Course',
        'Version',
        'Formats',
        'Preview',
        'Documents',
      ]);
      expect([...main().querySelectorAll('dl.xv-kv > dd')].map((value) => text(value))).toEqual([
        FLOW_E.name,
        'ME ZG523 · Thermodynamics & Heat Transfer',
        '1.0',
        'WEB · VR',
        'Two-minute walkthrough — https://media.northline.example/composite-wall-walkthrough',
        'Lab handout — Composite Wall.pdf · Thermocouple positions.pdf',
      ]);
      expect(screen.getByRole('region', { name: 'Learning outcomes' })).toHaveTextContent(
        'None yet. The Academic Reviewer adds them during review — one set for every format.',
      );
      expect(main()).toHaveTextContent(
        'Submitting sends it to the Academic Reviewer. It does not publish anything.',
      );

      // f6: DL-1, then f1 (never saved: Submit works without an id).
      await user.click(button('Submit for academic review'));
      const dialog = await screen.findByRole('dialog', { name: 'Submit for academic review?' });
      expect(dialog).toHaveTextContent(
        'This sends “Conduction Through a Composite Wall” to the Academic Reviewer. It does not publish anything.',
      );
      expect(dialog).toHaveTextContent(
        'You can’t edit it while it is being reviewed. If it comes back to you, you can revise it.',
      );
      await user.click(within(dialog).getByRole('button', { name: 'Submit for academic review' }));
      await title('Submitted for academic review');
      expect(main()).toHaveTextContent(
        'SUB-0077 · Conduction Through a Composite Wall is with the Academic Reviewer. Nothing is published. You can’t edit it while it is being reviewed.',
      );
      expect(screen.getByRole('link', { name: 'Open the experiment record' })).toHaveAttribute(
        'href',
        '/vendor/experiments/SUB-0077',
      );
      expect(screen.getByRole('link', { name: 'Back to My experiments' })).toHaveAttribute(
        'href',
        LIST,
      );
      await waitFor(() => expect(document.getElementById('Ve-done')).toHaveFocus());
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
        expect(main().querySelector('.xr-notice--err')).toHaveTextContent(
          'We couldn’t submit it. Nothing was sent — try again.',
        ),
      );
      expect(submissionsNamed(sample, FLOW_E.name)).toHaveLength(0);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Check and submit');
    },
    SLOW,
  );
});

// ---- VE-09 Edit draft and the read-only draft ----------------------------------------------------

describe('VE-09 Edit draft (B5-07 f5, f6)', () => {
  it(
    'f5: a saved draft opens where it was last saved',
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
      expect(overline()).toBe('Edit draft · Step 2 of 4');
      expect(idLine()).toBe('SUB-0079 · draft');
      expect(screen.getByRole('checkbox', { name: /Browser \(WEB\)/ })).toBeChecked();
      expect(screen.getByRole('region', { name: 'Browser (WEB) · Web link' })).toBeInTheDocument();
    },
    SLOW,
  );

  it(
    'f6: a draft whose course is no longer assigned is read-only — “What you entered”',
    async () => {
      await anilAt('/vendor/experiments/SUB-0083/edit');
      await title('Surface Roughness in Turning');
      expect(overline()).toBe('SUB-0083 · MEL ZG512');
      const notice = main().querySelector('.xr-notice--warn')!;
      expect(text(notice.querySelector('.xr-notice-title'))).toBe(
        'MEL ZG512 is no longer assigned to you',
      );
      expect(notice).toHaveTextContent(
        'MEL ZG512 · Manufacturing Processes was withdrawn from Northline Simulation Studio. This draft is kept, read-only. BITS / WILP decides which courses are yours.',
      );
      const entered = screen.getByRole('region', { name: 'What you entered' });
      expect([...entered.querySelectorAll(':scope .xr-section-body > dl > dt')].map(text)).toEqual([
        'Course',
        'Summary',
        'Version',
        'Formats',
      ]);
      expect(entered.querySelector('.xv-deliv')).toHaveTextContent(
        'WEBWeb linkWeb linkhttps://labs.northline.example/surface-roughnessBrowser and computerA current browser on a laptop or desktop',
      );
      expect(screen.queryByRole('button', { name: 'Save draft' })).toBeNull();
      expect(screen.getByRole('link', { name: 'Back to My experiments' })).toHaveAttribute(
        'href',
        LIST,
      );
      expect(screen.getByRole('link', { name: 'Ask for help' })).toHaveAttribute(
        'href',
        '/vendor/help',
      );
    },
    SLOW,
  );
});

// ---- VE-08 Revise and resubmit ------------------------------------------------------------------

describe('VE-08 Revise and resubmit (B5-07 f0 … f4)', () => {
  it(
    'f2: the reason box with two references above the editor; a reference opens its field',
    async () => {
      const { user, moves } = await anilAt('/vendor/experiments/SUB-0081/revise');
      await title('Course and description');
      expect(overline()).toBe('Revise and resubmit · Step 1 of 4');
      expect(idLine()).toBe('SUB-0081 · revision 1 was returned');
      const reason = await screen.findByRole('region', {
        name: 'Returned by the Academic Reviewer',
      });
      expect(reason).toHaveClass('xv-reason');
      expect(text(reason.querySelector('.xr-meta'))).toMatch(
        /^24 Aug 2026, \d\d:\d\d · Prof\. A\. Menon$/,
      );
      expect(text(reason.querySelector('blockquote.xv-quote'))).toBe(
        'The AR install notes don’t say which phones and tablets it runs on. Add the supported devices and the install steps.',
      );
      expect(
        within(reason)
          .getAllByRole('button')
          .map((each) => each.textContent),
      ).toEqual([
        'Formats & delivery · AR · Device need',
        'Formats & delivery · AR · Install notes',
      ]);
      expect(button('Save changes')).toBeInTheDocument();
      // The reason sits above the stepper (B5-07 “Reason first”).
      const steps = screen.getByRole('list', { name: 'Steps' });
      expect(reason.compareDocumentPosition(steps) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      await user.click(
        within(reason).getByRole('button', {
          name: 'Go to Formats & delivery · AR · Install notes',
        }),
      );
      await title('Formats and delivery');
      expect(moves).toEqual(['push /vendor/experiments/SUB-0081/revise?step=formats']);
      await waitFor(() =>
        expect(
          within(panel('Augmented reality (AR) · App package')).getByLabelText('Install notes'),
        ).toHaveFocus(),
      );
    },
    SLOW,
  );

  it(
    'f0 → f3 → f4: Save changes, then Resubmit through DL-1 reads “Submitted”; the reviewer’s queue holds revision 2',
    async () => {
      const { user, sample } = await anilAt('/vendor/experiments/SUB-0081/revise?step=formats');
      await title('Formats and delivery');
      const ar = panel('Augmented reality (AR) · App package');
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

      await user.click(button('Continue'));
      await title('Preview and documents');
      await user.click(button('Continue'));
      await title('Check and submit');
      expect(overline()).toBe('Revise and resubmit · Step 4 of 4');
      await user.click(button('Resubmit'));
      const dialog = await screen.findByRole('dialog', { name: 'Resubmit your changes?' });
      expect(dialog).toHaveTextContent(
        'Your changes are submitted for review. This does not publish anything.',
      );
      expect(within(dialog).getByRole('button', { name: 'Keep editing' })).toBeInTheDocument();
      await user.click(within(dialog).getByRole('button', { name: 'Resubmit' }));
      await title('Submitted');
      expect(main()).toHaveTextContent('Your changes have been submitted for review.');
      expect(main()).toHaveTextContent(
        'SUB-0081 · Forced Convection · nothing is needed from you now.',
      );
      // M-3: no reviewer, Content Manager or other gate named.
      expect(text(document.getElementById('Ve-done'))).not.toMatch(/Reviewer|Content Manager/);
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
    },
    SLOW,
  );

  it(
    'f1: returned by the Content Manager — her reason and its reference to the summary in step 1',
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
      expect(text(notice.querySelector('.xr-meta'))).toMatch(/ · Kavya Nair$/);
      expect(text(notice.querySelector('blockquote'))).toBe(reason);
      await user.click(
        within(notice).getByRole('button', { name: 'Go to Course & description · Summary' }),
      );
      await title('Course and description');
      await waitFor(() => expect(screen.getByLabelText('Summary')).toHaveFocus());
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
    },
    SLOW,
  );
});

describe('the editor’s other states', () => {
  it(
    'a record with others opens with its notice and the record’s link (SUB-0074, with the Content Manager)',
    async () => {
      await anilAt('/vendor/experiments/SUB-0074/edit');
      await title('Transient Cooling');
      expect(main().querySelector('.xr-notice')).toHaveTextContent(
        'You can’t change this experiment hereOnly a draft, or an experiment returned to you, can be changed.Open the experiment record',
      );
    },
    SLOW,
  );

  it(
    'another vendor’s record is not found (SUB-0086, Meridian Virtual Labs)',
    async () => {
      await anilAt('/vendor/experiments/SUB-0086/edit');
      expect(await title('We can’t find that page')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Save draft' })).toBeNull();
    },
    SLOW,
  );
});

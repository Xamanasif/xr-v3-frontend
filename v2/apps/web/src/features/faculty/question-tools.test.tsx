/**
 * Phase 4B, FA-16 Draft questions with assistance and FA-17 Import questions (board B4-08
 * f0 … f9), and FA-14's Drafts to review tab (B4-07 f1), on the real composition root and the
 * sample world (after Flow C: Q-0101 … Q-0106 for Shell-and-Tube, Dr S. Ranganathan teaching it).
 * Drafts come from the sample stand-in and are held for review — never in the bank until added
 * with marks the Faculty member sets; the import is the service's check of a real CSV file and an
 * all-or-nothing commit into the bank only.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ExperimentId, QuestionId } from '@xr/domain';
import { asPersonId, faults } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { stateWords } from '@/copy/state-copy';
import { P4B_QUESTION_TOOLS_LINK_TARGETS } from '@/nav/link-targets-p4b/question-tools';
import type { PlatformRuntime } from '@/platform/runtime';
import {
  renderInTab,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { QuestionBank } from './fa-14-question-bank/question-bank';
import { DraftQuestions } from './fa-16-draft-questions/draft-questions';
import { ImportQuestions } from './fa-17-import-questions/import-questions';

afterEach(() => {
  forgetLastAddress();
});

const RANGANATHAN = 'per-0014';
const DESAI = 'per-0015';
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const DRAFT_PATH = '/faculty/question-bank/draft';
const IMPORT_PATH = '/faculty/question-bank/import';
const STAND_IN = /^Sample drafts: no drafting service is connected yet/;

/** B4-08 f1's three drafts: the stand-in's first of each type for a heat-exchanger lab brief. */
const F1_DRAFTS = [
  'What is the log mean temperature difference (LMTD) used for?',
  'Counter flow always needs a larger area than parallel flow for the same duty.',
  'Compare countercurrent and cocurrent arrangements at matched duty, using your readings.',
];

const HEADER =
  'type,question,option_a,option_b,option_c,option_d,correct,marks,explanation,marking_guidance';

/** B4-08 f6's file: 8 rows — row 3 "correct is E", row 6 "multi-select", row 7 no explanation. */
const WITH_ERRORS = [
  HEADER,
  'multiple choice,What does the effectiveness compare?,Actual to maximum heat transfer,Two flow rates,Two areas,Two temperatures,A,2,It compares q to q_max.,',
  'multiple choice,What does C_min stand for?,The smaller heat-capacity rate,The larger heat-capacity rate,The cold inlet temperature,The minimum area,E,2,C_min is the smaller of C_h and C_c.,',
  'true or false,Counter flow can bring the cold outlet above the hot outlet.,,,,,TRUE,2,Only counter flow allows a temperature cross.,',
  'true or false,Parallel flow always needs less area.,,,,,FALSE,2,Counter flow needs less area for the same duty.,',
  'multi-select,Which statements about fouling are true? (choose two),It lowers U,It raises U,It adds a resistance,It has no effect,"A,C",2,Fouling adds a resistance.,',
  'written answer,State the units of the overall heat transfer coefficient.,,,,,,2,,Look for W/m²K.',
  'written answer,Explain how NTU relates to effectiveness.,,,,,,10,More NTU gives more effectiveness.,Look for the trend.',
  'multiple choice,Which rate sets q_max?,C_min,C_max,Both,Neither,A,2,q_max = C_min times the largest temperature difference.,',
].join('\r\n');

/** The corrected file: the two errors fixed, the warning kept (f7 "One has no explanation"). */
const CORRECTED = WITH_ERRORS.replace(',E,2,', ',A,2,').replace(
  'multi-select,Which statements about fouling are true? (choose two),It lowers U,It raises U,It adds a resistance,It has no effect,"A,C"',
  'multiple choice,Which statement about fouling is true?,It lowers U,It raises U,It removes a resistance,It has no effect,A',
);

function inShell(runtime: PlatformRuntime, path: string, search: string, page: ReactNode) {
  const navigation = testNavigation(path, search);
  const view = renderInTab(
    <WorkspaceLayout workspace="faculty">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

const main = () => screen.getByRole('main');
const h1 = () => screen.getByRole('heading', { level: 1 });
const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
/** A meta line's parts (tags, then the type), each as its text. */
const metaOf = (row: Element) =>
  [...(row.querySelector('.xa-qrow-meta')?.children ?? [])].map((part) => text(part)).join(' ');
const notFoundHeading = () =>
  screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }, { timeout: 5000 });

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

async function bankOf(sample: Sample) {
  return ok(
    await asPersonId(sample, RANGANATHAN).questionBank.listQuestions({
      experimentId: SHELL as ExperimentId,
    }),
  );
}

async function draftsOf(sample: Sample) {
  return ok(await asPersonId(sample, RANGANATHAN).questionBank.listDrafts(SHELL as ExperimentId));
}

// ---- FA-16 -------------------------------------------------------------------------------------

async function openDraft(runtime: PlatformRuntime, search = `?experimentId=${SHELL}`) {
  const rendered = inShell(runtime, DRAFT_PATH, search, <DraftQuestions />);
  await screen.findByRole('form', { name: 'Draft questions with assistance' }, { timeout: 5000 });
  return rendered;
}

/** f1's request: the lab brief, every type, 3 drafts. */
async function requestThree(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('radio', { name: /The experiment’s lab brief/ }));
  for (const type of ['Multiple choice', 'True or false', 'Written answer']) {
    await user.click(screen.getByRole('checkbox', { name: type }));
  }
  await user.selectOptions(screen.getByRole('combobox', { name: 'How many drafts' }), '3');
  await user.click(screen.getByRole('button', { name: 'Draft questions' }));
  const heading = await screen.findByRole('heading', { level: 2, name: 'Drafts to review' });
  await waitFor(() => expect(heading).toHaveFocus());
  return heading;
}

const draftRows = () => [...main().querySelectorAll<HTMLLIElement>('ul.xr-rows > li.xr-row')];

describe('FA-16 — the form (B4-08 f0, f4)', () => {
  it('as drawn, for the addressed experiment, with its lab brief and the stand-in named', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await openDraft(runtime);
    expect(h1()).toHaveTextContent('Draft questions with assistance');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(main().querySelector('.xr-overline')).toHaveTextContent(SHELL_NAME);
    expect(main().querySelector('.xr-phead-meta .xl-meta')).toHaveTextContent(
      'Drafts are suggestions for you to check. They never go into your bank on their own.',
    );
    expect(main().querySelector('a.xr-back')).toHaveAttribute(
      'href',
      `/faculty/question-bank?experimentId=${SHELL}`,
    );
    // The shell: "Question bank / Draft with assistance", Question bank current.
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Draft with assistance');
    expect(
      screen
        .getByRole('navigation', { name: 'Faculty navigation' })
        .querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', '/faculty/question-bank');

    const form = screen.getByRole('form', { name: 'Draft questions with assistance' });
    expect(within(form).getByRole('note')).toHaveTextContent(STAND_IN);
    const source = within(form).getByRole('group', { name: 'Draft from' });
    expect(
      within(source)
        .getAllByRole('radio')
        .map((radio) => [
          text(radio.closest('label')!.querySelector('.xr-choice-title')),
          text(radio.closest('label')!.querySelector('.xr-choice-sub')),
        ]),
    ).toEqual([
      ['The experiment’s lab brief', 'Lab brief — Shell-and-Tube Heat Exchanger'],
      ['Text I paste', 'Your own notes or a passage'],
    ]);
    for (const radio of within(source).getAllByRole('radio')) expect(radio).not.toBeChecked();
    expect(
      within(within(form).getByRole('group', { name: 'Question types' }))
        .getAllByRole('checkbox')
        .map((box) => text(box.closest('label'))),
    ).toEqual(['Multiple choice', 'True or false', 'Written answer']);
    const howMany = within(form).getByRole('combobox', { name: 'How many drafts' });
    expect(
      within(howMany)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Choose', '3', '5']);
    expect(howMany).toHaveValue('');
    expect(within(form).getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      `/faculty/question-bank?experimentId=${SHELL}`,
    );
    expect(within(form).getByRole('button', { name: 'Draft questions' })).toHaveClass(
      'xr-btn--primary',
    );
  });

  it('without an address: the first experiment taught; out of scope → the in-shell not-found', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { view } = await openDraft(runtime, '');
    expect(main().querySelector('.xr-overline')).toHaveTextContent(SHELL_NAME);
    view.unmount();
    inShell(runtime, DRAFT_PATH, '?experimentId=fin-tube-bundle', <DraftQuestions />);
    expect(await notFoundHeading()).toBeVisible();
  });

  it('no experiment taught: the bank’s empty state, no form', async () => {
    const { runtime } = await tabPlatform(DESAI, 'after-flow-c');
    inShell(runtime, DRAFT_PATH, '', <DraftQuestions />);
    expect(
      await screen.findByRole(
        'heading',
        { level: 2, name: 'Your Institute Admin hasn’t assigned you courses yet' },
        { timeout: 5000 },
      ),
    ).toBeVisible();
    expect(screen.queryByRole('form')).toBeNull();
  });
});

describe('FA-16 — validation (B4-08 f2)', () => {
  it('the service’s drawn words: “Check these choices”, focused, and each field’s line', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await openDraft(runtime);
    await user.click(screen.getByRole('button', { name: 'Draft questions' }));
    const summary = await screen.findByRole('alert');
    await waitFor(() => expect(summary).toHaveFocus());
    expect(summary.querySelector('strong')).toHaveTextContent('Check these choices');
    expect(
      within(summary)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([
      'Choose the material to draft from',
      'Choose at least one question type',
      'Choose how many drafts you want',
    ]);
    expect(main().querySelector('#dq-src-e')).toHaveTextContent(
      'Choose the material to draft from',
    );
    expect(main().querySelector('#dq-types-e')).toHaveTextContent(
      'Choose at least one question type',
    );
    expect(screen.getByRole('combobox', { name: 'How many drafts' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    // A summary link moves focus to its field.
    await user.click(
      within(summary).getByRole('link', { name: 'Choose how many drafts you want' }),
    );
    expect(screen.getByRole('combobox', { name: 'How many drafts' })).toHaveFocus();
    // Choosing clears that field's error, and its summary line.
    await user.click(screen.getByRole('checkbox', { name: 'True or false' }));
    expect(main().querySelector('#dq-types-e')).toBeNull();
    expect(within(summary).getAllByRole('link')).toHaveLength(2);
    // "Text I paste" asks for the text.
    await user.click(screen.getByRole('radio', { name: /Text I paste/ }));
    expect(screen.getByRole('textbox', { name: 'Text to draft from' })).toBeVisible();
    await user.selectOptions(screen.getByRole('combobox', { name: 'How many drafts' }), '3');
    await user.click(screen.getByRole('button', { name: 'Draft questions' }));
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Text to draft from' })).toHaveAttribute(
        'aria-invalid',
        'true',
      ),
    );
    expect(main()).toHaveTextContent('Paste the text to draft from');
    expect(await draftsOf(sample)).toEqual([]);
  });
});

describe('FA-16 — drafts to review (B4-08 f1)', () => {
  it('three drafts, each for review, typed but without marks; none in the bank', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await openDraft(runtime);
    await requestThree(user);
    const section = screen.getByRole('region', { name: 'Drafts to review' });
    expect(section.querySelector('.xr-section-head [role="status"]')).toHaveTextContent(
      '3 left to review',
    );
    expect(section).toHaveTextContent(
      'Read each draft against the material before adding it. Edit anything that isn’t right.',
    );
    expect(within(section).getByRole('note')).toHaveTextContent(STAND_IN);
    expect(draftRows().map((row) => text(row.querySelector('.xr-row-title')))).toEqual(F1_DRAFTS);
    expect(draftRows().map((row) => metaOf(row))).toEqual([
      'Draft — needs your review Drafted with assistance Multiple choice',
      'Draft — needs your review Drafted with assistance True or false',
      'Draft — needs your review Drafted with assistance Written answer',
    ]);
    expect(section).not.toHaveTextContent('marks');
    const first = draftRows()[0]!;
    expect(
      within(first).getByRole('button', {
        name: `Add draft “${F1_DRAFTS[0]}” to your question bank`,
      }),
    ).toHaveClass('xr-btn--secondary', 'xr-btn--sm');
    expect(
      within(first).getByRole('button', { name: `Discard draft “${F1_DRAFTS[0]}”` }),
    ).toHaveClass('xr-btn--text');
    expect(within(section).getByRole('button', { name: 'Draft more' })).toBeVisible();
    // Held for review only (Q-06): the bank still has its six questions.
    expect(await bankOf(sample)).toHaveLength(6);
    expect((await draftsOf(sample)).map((draft) => draft.marks)).toEqual([null, null, null]);
  });

  it('Add to bank without marks opens the fields with the marks error; with marks it is added', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await openDraft(runtime);
    await requestThree(user);
    await user.click(
      screen.getByRole('button', { name: `Add draft “${F1_DRAFTS[0]}” to your question bank` }),
    );
    const editor = await screen.findByRole('form', { name: F1_DRAFTS[0] });
    const summary = within(editor).getByRole('alert');
    await waitFor(() => expect(summary).toHaveFocus());
    expect(summary.querySelector('strong')).toHaveTextContent('Check this question');
    expect(
      within(summary)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Enter the marks, as a whole number of 1 or more']);
    // The draft's own content, as the FA-15 fields.
    expect(within(editor).getByRole('radio', { name: 'Multiple choice' })).toBeChecked();
    expect(within(editor).getByRole('textbox', { name: 'Question' })).toHaveValue(F1_DRAFTS[0]);
    expect(within(editor).getByRole('textbox', { name: 'Option A' })).toHaveValue(
      'Sizing the exchanger from its duty and overall coefficient',
    );
    expect(
      within(editor).getByRole('radio', { name: 'Option A is the correct answer' }),
    ).toBeChecked();
    expect(within(editor).getByRole('textbox', { name: 'Marks' })).toHaveValue('');
    expect(await bankOf(sample)).toHaveLength(6);

    await user.type(within(editor).getByRole('textbox', { name: 'Marks' }), '2');
    await user.click(within(editor).getByRole('button', { name: 'Add to bank' }));
    const message = main().querySelector('#dq-msg') as HTMLElement;
    await waitFor(() =>
      expect(message).toHaveTextContent(/^Added to your question bank as Q-\d{4}\.$/),
    );
    await waitFor(() => expect(message).toHaveFocus());
    const id = /Q-\d{4}/.exec(message.textContent ?? '')![0];
    // The draft stays in place, in the bank (`d.added`); two are left.
    expect(metaOf(draftRows()[0]!)).toBe('In your bank · reviewed by you Multiple choice');
    expect(within(draftRows()[0]!).queryByRole('button')).toBeNull();
    expect(main().querySelector('.xr-section-head [role="status"]')).toHaveTextContent(
      '2 left to review',
    );
    const record = ok(
      await asPersonId(sample, RANGANATHAN).questionBank.getQuestion(id as QuestionId),
    );
    expect(record.question).toMatchObject({
      origin: 'reviewed-draft',
      marks: 2,
      text: F1_DRAFTS[0],
    });
    expect(record.usedIn).toEqual([]);
    expect(await draftsOf(sample)).toHaveLength(2);
  });

  it('Review and edit: the fields in place; Cancel keeps what was typed; the edit goes to the bank', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await openDraft(runtime);
    await requestThree(user);
    const row = draftRows()[1]!;
    await user.click(within(row).getByRole('button', { name: 'Review and edit' }));
    const editor = await screen.findByRole('form', { name: F1_DRAFTS[1] });
    await waitFor(() =>
      expect(within(editor).getByRole('textbox', { name: 'Question' })).toHaveFocus(),
    );
    expect(within(editor).getByRole('radio', { name: 'False' })).toBeChecked();
    const question = within(editor).getByRole('textbox', { name: 'Question' });
    await user.clear(question);
    await user.type(question, 'Counter flow needs less area than parallel flow for the same duty.');
    await user.click(within(editor).getByRole('radio', { name: 'True' }));
    await user.click(within(editor).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('form', { name: F1_DRAFTS[1] })).toBeNull();
    await waitFor(() =>
      expect(
        within(draftRows()[1]!).getByRole('button', { name: 'Review and edit' }),
      ).toHaveFocus(),
    );
    await user.click(within(draftRows()[1]!).getByRole('button', { name: 'Review and edit' }));
    const again = await screen.findByRole('form', { name: F1_DRAFTS[1] });
    expect(within(again).getByRole('textbox', { name: 'Question' })).toHaveValue(
      'Counter flow needs less area than parallel flow for the same duty.',
    );
    await user.type(within(again).getByRole('textbox', { name: 'Marks' }), '3');
    await user.click(within(again).getByRole('button', { name: 'Add to bank' }));
    await waitFor(() =>
      expect(main().querySelector('#dq-msg')).toHaveTextContent(/^Added to your question bank/),
    );
    const added = (await bankOf(sample)).find((entry) =>
      entry.question.text.startsWith('Counter flow needs less area'),
    );
    expect(added?.question).toMatchObject({
      marks: 3,
      body: { type: 'true-false', correct: true },
      origin: 'reviewed-draft',
    });
  });

  it('Discard leaves no trace; Draft more returns to the form with the choices kept', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await openDraft(runtime);
    await requestThree(user);
    await user.click(screen.getByRole('button', { name: `Discard draft “${F1_DRAFTS[2]}”` }));
    const message = main().querySelector('#dq-msg') as HTMLElement;
    await waitFor(() => expect(message).toHaveTextContent('Draft discarded. Nothing was added.'));
    await waitFor(() => expect(message).toHaveFocus());
    expect(draftRows()).toHaveLength(2);
    expect(main().querySelector('.xr-section-head [role="status"]')).toHaveTextContent(
      '2 left to review',
    );
    expect(await draftsOf(sample)).toHaveLength(2);
    expect(await bankOf(sample)).toHaveLength(6);

    await user.click(screen.getByRole('button', { name: 'Draft more' }));
    const form = await screen.findByRole('form', { name: 'Draft questions with assistance' });
    expect(within(form).getByRole('radio', { name: /lab brief/ })).toBeChecked();
    expect(within(form).getByRole('checkbox', { name: 'Written answer' })).toBeChecked();
    expect(within(form).getByRole('combobox', { name: 'How many drafts' })).toHaveValue('3');
  });

  it('drafting fails for now (f3): the drawn failure takes focus, the choices stay; trying again works', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await openDraft(runtime);
    faults(sample).failNext('QuestionBankService.requestDrafts');
    await user.click(screen.getByRole('radio', { name: /lab brief/ }));
    await user.click(screen.getByRole('checkbox', { name: 'Multiple choice' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'How many drafts' }), '3');
    await user.click(screen.getByRole('button', { name: 'Draft questions' }));
    const fail = await screen.findByText('Drafting didn’t work this time');
    await waitFor(() => expect(main().querySelector('#dq-fail')).toHaveFocus());
    expect(fail.closest('.xr-notice')).toHaveTextContent(
      'Nothing was added to your bank. Try again.',
    );
    expect(screen.getByRole('radio', { name: /lab brief/ })).toBeChecked();
    expect(screen.getByRole('combobox', { name: 'How many drafts' })).toHaveValue('3');
    await user.click(screen.getByRole('button', { name: 'Draft questions' }));
    await screen.findByRole('heading', { level: 2, name: 'Drafts to review' });
    expect(draftRows().map((row) => metaOf(row))).toEqual([
      'Draft — needs your review Drafted with assistance Multiple choice',
      'Draft — needs your review Drafted with assistance Multiple choice',
      'Draft — needs your review Drafted with assistance Multiple choice',
    ]);
  });

  it('a draft gone meanwhile: the list is read again and says so', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await openDraft(runtime);
    await requestThree(user);
    const [first] = await draftsOf(sample);
    ok(await asPersonId(sample, RANGANATHAN).questionBank.discardDraft({ draftId: first!.id }));
    await user.click(screen.getByRole('button', { name: `Discard draft “${F1_DRAFTS[0]}”` }));
    await waitFor(() =>
      expect(main().querySelector('#dq-msg')).toHaveTextContent(stateWords('FA-16.draft-gone')),
    );
    await waitFor(() => expect(draftRows()).toHaveLength(2));
  });
});

// ---- FA-14 Drafts to review tab ------------------------------------------------------------------

describe('FA-14 — Drafts to review (B4-07 f1)', () => {
  it('the tab lists the drafts with the same actions; an added draft moves to Questions', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    ok(
      await asPersonId(sample, RANGANATHAN).questionBank.requestDrafts({
        experimentId: SHELL as ExperimentId,
        source: 'lab-brief',
        pastedText: null,
        types: ['multiple-choice', 'true-false', 'written'],
        howMany: 3,
      }),
    );
    inShell(
      runtime,
      '/faculty/question-bank',
      `?tab=drafts&experimentId=${SHELL}`,
      <QuestionBank />,
    );
    const section = await screen.findByRole(
      'region',
      { name: 'Drafts to review' },
      { timeout: 5000 },
    );
    await waitFor(() => expect(draftRows()).toHaveLength(3));
    const tabs = screen.getByRole('navigation', { name: 'Question bank' });
    expect(within(tabs).getByRole('link', { name: /^Drafts to review/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(tabs).getByRole('link', { name: /^Drafts to review/ })).toHaveTextContent(
      'Drafts to review 3',
    );
    expect(section).toHaveTextContent(
      'Drafts never go into your bank on their own. Review each one, then add it or discard it.',
    );
    expect(section.querySelector('.xr-section-head [role="status"]')).toBeNull();
    expect(within(section).getByRole('note')).toHaveTextContent(STAND_IN);
    expect(within(section).queryByRole('button', { name: 'Draft more' })).toBeNull();

    await user.click(screen.getByRole('button', { name: `Discard draft “${F1_DRAFTS[1]}”` }));
    await waitFor(() =>
      expect(main().querySelector('#qb-dmsg')).toHaveTextContent(
        'Draft discarded. Nothing was added to your bank.',
      ),
    );
    await user.click(within(draftRows()[0]!).getByRole('button', { name: 'Review and edit' }));
    const editor = await screen.findByRole('form', { name: F1_DRAFTS[0] });
    await user.type(within(editor).getByRole('textbox', { name: 'Marks' }), '2');
    await user.click(within(editor).getByRole('button', { name: 'Add to bank' }));
    await waitFor(() =>
      expect(main().querySelector('#qb-dmsg')).toHaveTextContent(
        /^Added to your question bank as Q-\d{4}\.$/,
      ),
    );
    // Added drafts leave this list (they are under Questions, "From a draft you reviewed").
    await waitFor(() => expect(draftRows()).toHaveLength(1));
    await waitFor(() =>
      expect(within(tabs).getByRole('link', { name: /^Drafts to review/ })).toHaveTextContent(
        'Drafts to review 1',
      ),
    );
  });

  it('a question from a reviewed draft says so in the bank', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const faculty = asPersonId(sample, RANGANATHAN).questionBank;
    const [draft] = ok(
      await faculty.requestDrafts({
        experimentId: SHELL as ExperimentId,
        source: 'lab-brief',
        pastedText: null,
        types: ['true-false'],
        howMany: 3,
      }),
    );
    const added = ok(
      await faculty.addDraftToBank({
        draftId: draft!.id,
        experimentId: SHELL as ExperimentId,
        type: 'true-false',
        text: draft!.text,
        options: {},
        correct: 'false',
        marks: '2',
        explanation: null,
        markingGuidance: null,
      }),
    );
    inShell(runtime, '/faculty/question-bank', `?experimentId=${SHELL}`, <QuestionBank />);
    const table = await screen.findByRole('table', {}, { timeout: 5000 });
    const row = [...table.querySelectorAll('tbody tr')].find((tr) =>
      tr.textContent?.includes(added.id),
    )!;
    expect(row.querySelector('.xa-qrow-meta')).toHaveTextContent(
      `${added.id}From a draft you reviewed`,
    );
    expect(text(table.querySelector('tbody tr .xa-qrow-meta'))).toBe('Q-0101');
    await waitFor(() =>
      expect(
        within(screen.getByRole('navigation', { name: 'Question bank' })).getByRole('link', {
          name: /^Drafts to review/,
        }),
      ).toHaveTextContent('Drafts to review 2'),
    );
  });

  it('no drafts: “No drafts to review”, with Draft with assistance', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    inShell(
      runtime,
      '/faculty/question-bank',
      `?tab=drafts&experimentId=${SHELL}`,
      <QuestionBank />,
    );
    const title = await screen.findByRole(
      'heading',
      { level: 3, name: 'No drafts to review' },
      { timeout: 5000 },
    );
    const empty = title.closest('.xr-empty') as HTMLElement;
    expect(empty).toHaveTextContent(
      'Drafts you ask for appear here until you add or discard them.',
    );
    expect(within(empty).getByRole('link', { name: 'Draft with assistance' })).toHaveAttribute(
      'href',
      `/faculty/question-bank/draft?experimentId=${SHELL}`,
    );
  });
});

// ---- FA-17 -------------------------------------------------------------------------------------

const fileInput = () => main().querySelector<HTMLInputElement>('input[type="file"]')!;

async function openImport(runtime: PlatformRuntime, search = `?experimentId=${SHELL}`) {
  const rendered = inShell(runtime, IMPORT_PATH, search, <ImportQuestions />);
  await screen.findByRole('heading', { level: 1, name: 'Choose a file' }, { timeout: 5000 });
  return rendered;
}

async function choose(user: ReturnType<typeof userEvent.setup>, csv: string, name: string) {
  await user.upload(fileInput(), new File([csv], name, { type: 'text/csv' }));
  await waitFor(() =>
    expect(main().querySelector('.xw-file .xw-file-name')).toHaveTextContent(name),
  );
}

async function checkFile(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Check file' }));
  await screen.findByRole('heading', { level: 1, name: 'Check rows' });
  await waitFor(() => expect(h1()).toHaveFocus());
}

describe('FA-17 — step 1 (B4-08 f5, f9)', () => {
  it('the template, its columns and download; the experiment named; a check without a file is refused', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await openImport(runtime);
    expect(main().querySelector('.xr-overline')).toHaveTextContent('Step 1 of 3');
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Import questions');
    expect(screen.getByRole('list', { name: 'Import questions' })).toHaveClass('xr-steps');
    expect(
      [...screen.getByRole('list', { name: 'Template columns' }).querySelectorAll('li')].map(
        (item) => item.textContent,
      ),
    ).toEqual([
      'type',
      'question',
      'option_a',
      'option_b',
      'option_c',
      'option_d',
      'correct',
      'marks',
      'explanation',
      'marking_guidance',
    ]);
    const download = screen.getByRole('link', { name: 'Download the template (CSV)' });
    expect(download).toHaveAttribute('download', 'questions-template.csv');
    expect(download.getAttribute('href')).toMatch(/^data:text\/csv;charset=utf-8,type%2Cquestion/);
    expect(main()).toHaveTextContent(
      `Questions go into your bank for ${SHELL_NAME}. They aren’t added to any assessment.`,
    );
    expect(main().querySelector('.xw-file .xr-meta')).toHaveTextContent('No file chosen');
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      `/faculty/question-bank?experimentId=${SHELL}`,
    );

    await user.click(screen.getByRole('button', { name: 'Check file' }));
    await waitFor(() =>
      expect(main().querySelector('.xw-ferr')).toHaveTextContent('Choose a CSV file first'),
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Choose a CSV file' })).toHaveFocus(),
    );
  });

  it('a file without the template’s columns, or without rows: the register’s words', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await openImport(runtime);
    await choose(user, 'question,marks\nWhat?,2', 'two-columns.csv');
    await user.click(screen.getByRole('button', { name: 'Check file' }));
    await waitFor(() =>
      expect(main().querySelector('.xw-ferr')).toHaveTextContent(stateWords('FA-17.file.columns')),
    );
    await choose(user, HEADER, 'header-only.csv');
    await user.click(screen.getByRole('button', { name: 'Check file' }));
    await waitFor(() =>
      expect(main().querySelector('.xw-ferr')).toHaveTextContent(stateWords('FA-17.file.no-rows')),
    );
  });

  it('out of scope → the in-shell not-found', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    inShell(runtime, IMPORT_PATH, '?experimentId=fin-tube-bundle', <ImportQuestions />);
    expect(await notFoundHeading()).toBeVisible();
  });
});

describe('FA-17 — check rows, confirm, imported (B4-08 f6, f7, f8)', () => {
  it('errors block; the corrected file imports all eight into the bank only', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await openImport(runtime);
    await choose(user, WITH_ERRORS, 'post-lab-questions.csv');
    await checkFile(user);
    expect(main().querySelector('.xr-overline')).toHaveTextContent('Step 2 of 3');
    expect(main().querySelector('p.xw-file-name')).toHaveTextContent('post-lab-questions.csv');
    expect([...main().querySelectorAll('.xw-counts .xw-tag')].map((tag) => text(tag))).toEqual([
      '8 rows',
      '6 ready',
      '2 with errors',
      '1 with a warning',
    ]);
    expect(main()).toHaveTextContent('Nothing is imported while the file has errors');
    const table = screen.getByRole('table', { name: 'Rows that need attention' });
    expect(
      [...table.querySelectorAll('tbody tr')].map((tr) =>
        [...tr.querySelectorAll('td')].map((td) => text(td)),
      ),
    ).toEqual([
      [
        '3',
        'What does C_min stand for?',
        'correct is “E”, but the question has options A–D only.',
        'Error — blocks import',
      ],
      [
        '6',
        'Which statements about fouling are true? (choose two)',
        'type “multi-select” isn’t available. Use multiple choice (one correct), true or false, or written answer.',
        'Error — blocks import',
      ],
      [
        '7',
        'State the units of the overall heat transfer coefficient.',
        'explanation is empty. The question imports without one.',
        'Warning',
      ],
    ]);
    expect(table.querySelectorAll('.xr-status--err')).toHaveLength(2);
    expect(table.querySelectorAll('.xr-status--wait')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();

    // "Choose the corrected file": step 1, no file, the chooser focused.
    await user.click(screen.getByRole('button', { name: 'Choose the corrected file' }));
    await screen.findByRole('heading', { level: 1, name: 'Choose a file' });
    expect(main().querySelector('.xw-file .xr-meta')).toHaveTextContent('No file chosen');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Choose a CSV file' })).toHaveFocus(),
    );
    await choose(user, CORRECTED, 'post-lab-questions-corrected.csv');
    await checkFile(user);
    expect([...main().querySelectorAll('.xw-counts .xw-tag')].map((tag) => text(tag))).toEqual([
      '8 rows',
      '8 ready',
      '1 with a warning',
    ]);
    expect(main()).not.toHaveTextContent('Nothing is imported');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('heading', { level: 1, name: 'Confirm import' });
    expect(text(main().querySelector('p.xr-lead'))).toBe(
      '8 questions will be added to your bank from post-lab-questions-corrected.csv.',
    );
    expect([...main().querySelectorAll('.xr-section li')].map((item) => item.textContent)).toEqual([
      'They aren’t added to any assessment.',
      'One has no explanation — students would see none for it.',
    ]);
    expect(await bankOf(sample)).toHaveLength(6);
    // Back keeps the check.
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await screen.findByRole('heading', { level: 1, name: 'Check rows' });
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(await screen.findByRole('button', { name: 'Import 8 questions' }));

    await screen.findByRole('heading', { level: 1, name: 'Questions imported' });
    await waitFor(() => expect(h1()).toHaveFocus());
    expect(main().querySelector('.xr-overline')).toHaveTextContent('Import questions');
    expect(screen.queryByRole('list', { name: 'Import questions' })).toBeNull();
    const bank = await bankOf(sample);
    expect(bank).toHaveLength(14);
    const imported = bank.filter((entry) => entry.question.origin === 'import');
    expect(imported).toHaveLength(8);
    expect(imported.every((entry) => entry.usedIn === 0)).toBe(true);
    const ids = imported.map((entry) => entry.question.id).sort();
    expect(main().querySelector('.xr-notice--ok')).toHaveTextContent(
      `Import finished8 questions were added to your bank as ${ids[0]} to ${ids.at(-1)}. None is in an assessment yet.`,
    );
    expect(screen.getByRole('link', { name: 'Open question bank' })).toHaveAttribute(
      'href',
      `/faculty/question-bank?experimentId=${SHELL}`,
    );
    await user.click(screen.getByRole('button', { name: 'Import another file' }));
    await screen.findByRole('heading', { level: 1, name: 'Choose a file' });
    expect(main().querySelector('.xw-file .xr-meta')).toHaveTextContent('No file chosen');
  });

  it('importing fails for now: nothing changes, and it can be sent again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await openImport(runtime);
    await choose(user, CORRECTED, 'post-lab-questions-corrected.csv');
    await checkFile(user);
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('button', { name: 'Import 8 questions' });
    faults(sample).failNext('QuestionBankService.commitQuestionImport');
    await user.click(screen.getByRole('button', { name: 'Import 8 questions' }));
    // Failed for now: nothing changes (`FA-17.unavailable`).
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Import 8 questions' })).not.toHaveAttribute(
        'aria-disabled',
        'true',
      ),
    );
    expect(h1()).toHaveTextContent('Confirm import');
    expect(await bankOf(sample)).toHaveLength(6);
    await user.click(screen.getByRole('button', { name: 'Import 8 questions' }));
    await screen.findByRole('heading', { level: 1, name: 'Questions imported' });
    expect(await bankOf(sample)).toHaveLength(14);
  });
});

describe('the ledger (FA-16, FA-17, FA-14’s Drafts tab)', () => {
  it('one primary per drawn state; every drawn action is built or in the page', () => {
    expect(
      P4B_QUESTION_TOOLS_LINK_TARGETS.filter((entry) => entry.role === 'primary').map(
        (entry) => `${entry.screen}: ${entry.action}`,
      ),
    ).toEqual([
      'FA-16: Draft questions',
      'FA-17: Check file · Choose the corrected file · Continue · Import N questions',
      'FA-17: Open question bank',
    ]);
    expect(
      P4B_QUESTION_TOOLS_LINK_TARGETS.filter((entry) => entry.outcome === 'not-rendered'),
    ).toEqual([]);
  });
});

/**
 * FA-16 Draft questions with assistance and FA-17 Import questions, and FA-14's Drafts to review
 * tab, as the V3 export draws them (FA-v1 `Main.dc.html` "FA-16", "FA-17", "FA-14"), on the real
 * composition root and the sample world (after Flow C: six questions for Shell-and-Tube, Dr S.
 * Ranganathan teaching it). Drafts come from the sample stand-in and are held for review — never
 * in the bank until added with marks the Faculty member sets; the import is the service's check of
 * a real CSV file and an all-or-nothing commit into the bank only. No draft or question is named
 * by its internal reference anywhere a person reads or hears it (the owner's identifier rule).
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ExperimentId } from '@xr/domain';
import { asPersonId, faults } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { QUESTION_TEMPLATE_DOWNLOAD } from '@/copy/question-tools';
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
import { QUESTION_TEMPLATE_COLUMNS } from './fa-17-import-questions/import-view';

afterEach(() => {
  forgetLastAddress();
});

const RANGANATHAN = 'per-0014';
const DESAI = 'per-0015';
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const DRAFT_PATH = '/faculty/question-bank/draft';
const IMPORT_PATH = '/faculty/question-bank/import';
const BANK_ADDRESS = `/faculty/question-bank?experimentId=${SHELL}`;
const STAND_IN = /^Sample drafts: no drafting service is connected yet/;

/** The stand-in's first draft of each type for a heat-exchanger lab brief. */
const F1_DRAFTS = [
  'What is the log mean temperature difference (LMTD) used for?',
  'Counter flow always needs a larger area than parallel flow for the same duty.',
  'Compare countercurrent and cocurrent arrangements at matched duty, using your readings.',
];

const HEADER =
  'type,question,option_a,option_b,option_c,option_d,correct,marks,explanation,marking_guidance';

/** A file of 8 rows — row 3 "correct is E", row 6 "multi-select", row 7 no explanation. */
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

/** The corrected file: the two errors fixed, the warning kept ("One has no explanation"). */
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
const notFoundHeading = () =>
  screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }, { timeout: 5000 });
const railCurrent = () =>
  within(screen.getByRole('navigation', { name: 'Faculty navigation' }))
    .getAllByRole('link')
    .find((link) => link.getAttribute('aria-current') === 'page');
const crumbs = () => within(main()).getByRole('navigation', { name: 'Breadcrumb' });

/** The draft cards; each card's tags, its type line and its words. */
const draftRows = () => [...main().querySelectorAll<HTMLLIElement>('ul.fa-dlist > li.fa-dcard')];
const tagsOf = (row: Element) =>
  [...row.querySelectorAll('.fa-dcard-tags > *')].map((part) => text(part));
const metaOf = (row: Element) => text(row.querySelector('.fa-dcard-m'));
const titleOf = (row: Element) => text(row.querySelector('.fa-dcard-t'));
/** A side panel's figures, as [term, value]. */
const factsOf = (section: Element) =>
  [...section.querySelectorAll('.fa-sidefacts > div')].map((fact) => [
    text(fact.querySelector('dt')),
    text(fact.querySelector('dd')),
  ]);

/** An internal reference no Faculty page shows (the owner's identifier rule, 21 Oct 2026). */
const REFERENCE = /\b(?:ASMT|ATT|Q|D|REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

function expectNoReference(): void {
  expect(document.body.textContent ?? '').not.toMatch(REFERENCE);
  for (const element of document.querySelectorAll('[aria-label], [title], [placeholder]')) {
    for (const attribute of ['aria-label', 'title', 'placeholder']) {
      expect(
        element.getAttribute(attribute) ?? '',
        `${attribute} of ${element.tagName}`,
      ).not.toMatch(REFERENCE);
    }
  }
  expect(document.title).not.toMatch(REFERENCE);
}

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
  await screen.findByRole('form', { name: 'What to draft' }, { timeout: 5000 });
  return rendered;
}

/** The request through the page: the lab brief, every type, 3 drafts. */
async function requestThree(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('radio', { name: /The experiment’s lab brief/ }));
  for (const type of ['Multiple choice', 'True or false', 'Written answer']) {
    await user.click(screen.getByRole('checkbox', { name: type }));
  }
  await user.click(screen.getByRole('radio', { name: '3 drafts' }));
  await user.click(screen.getByRole('button', { name: 'Draft questions' }));
  const heading = await screen.findByRole('heading', { level: 2, name: 'Drafts to review' });
  await waitFor(() => expect(heading).toHaveFocus());
  return heading;
}

describe('FA-16 — the form', () => {
  it('as drawn, for the addressed experiment, with its lab brief and the stand-in named', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await openDraft(runtime);
    expect(h1()).toHaveTextContent('Draft questions with assistance');
    expect(h1()).toHaveAttribute('tabindex', '-1');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(main().querySelector('.rk-head .rk-eyebrow')).toHaveTextContent(
      `${SHELL_NAME} · ME ZG523`,
    );
    expect(main().querySelector('.rk-head .rk-sub')).toHaveTextContent(
      'Drafts are suggestions for you to check. They never go into your bank on their own.',
    );
    expect(within(crumbs()).getByRole('link', { name: 'Question bank' })).toHaveAttribute(
      'href',
      BANK_ADDRESS,
    );
    expect(crumbs().querySelector('[aria-current="page"]')).toHaveTextContent(
      'Draft with assistance',
    );
    // The shell: Question bank current; the tab's title.
    await waitFor(() => expect(document.title).toMatch(/^Draft with assistance · /));
    expect(railCurrent()).toHaveAttribute('href', '/faculty/question-bank');

    const form = screen.getByRole('form', { name: 'What to draft' });
    expect(form).toHaveClass('rk-surface');
    expect(within(form).getByRole('note')).toHaveTextContent(STAND_IN);
    expect(within(form).getByRole('note')).toHaveClass('fa-sample');
    expect(form.querySelectorAll('ol.fa-nsteps > li.fa-nstep')).toHaveLength(3);
    const source = within(form).getByRole('group', { name: 'Material to draft from' });
    expect(source).toHaveTextContent('Choose one.');
    expect(
      within(source)
        .getAllByRole('radio')
        .map((radio) => [
          text(radio.closest('label')!.querySelector('.rk-choice-t')),
          text(radio.closest('label')!.querySelector('.rk-choice-d')),
        ]),
    ).toEqual([
      ['The experiment’s lab brief', 'Lab brief — Shell-and-Tube Heat Exchanger'],
      ['Text I paste', 'Your own notes or a passage'],
    ]);
    for (const radio of within(source).getAllByRole('radio')) expect(radio).not.toBeChecked();
    const types = within(form).getByRole('group', { name: 'Question types' });
    expect(
      within(types)
        .getAllByRole('checkbox')
        .map((box) => text(box.closest('label')!.querySelector('.rk-choice-t'))),
    ).toEqual(['Multiple choice', 'True or false', 'Written answer']);
    const howMany = within(form).getByRole('group', { name: 'How many drafts' });
    expect(howMany).toHaveTextContent('Shared across the question types you choose.');
    expect(
      within(howMany)
        .getAllByRole('radio')
        .map((radio) => text(radio.closest('label'))),
    ).toEqual(['3 drafts', '5 drafts']);
    for (const radio of within(howMany).getAllByRole('radio')) expect(radio).not.toBeChecked();
    expect(within(form).getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      BANK_ADDRESS,
    );
    expect(form).toHaveTextContent('Drafting adds nothing to your bank.');
    expect(within(form).getByRole('button', { name: 'Draft questions' })).toHaveClass(
      'rb-btn--primary',
      'fa-draftfoot-primary',
    );
    // Beside it: how drafting works, and the bank for this experiment.
    const side = screen.getByRole('complementary', { name: 'How drafting works' });
    expect([...side.querySelectorAll('.fa-howto b')].map((item) => item.textContent)).toEqual([
      'Drafts arrive as suggestions',
      'You check every draft',
      'Only what you add goes into your bank',
    ]);
    await waitFor(() =>
      expect(factsOf(side.querySelectorAll('.fa-side-sec')[1]!)).toEqual([
        ['Questions', '6'],
        ['Drafts waiting', '0'],
      ]),
    );
    expectNoReference();
  });

  it('without an address: the first experiment taught; out of scope → the in-shell not-found', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { view } = await openDraft(runtime, '');
    expect(main().querySelector('.rk-head .rk-eyebrow')).toHaveTextContent(SHELL_NAME);
    view.unmount();
    inShell(runtime, DRAFT_PATH, '?experimentId=fin-tube-bundle', <DraftQuestions />);
    expect(await notFoundHeading()).toBeVisible();
  });

  it('no experiment taught: the no-course card, no form', async () => {
    const { runtime } = await tabPlatform(DESAI, 'after-flow-c');
    inShell(runtime, DRAFT_PATH, '', <DraftQuestions />);
    const title = await screen.findByRole(
      'heading',
      { level: 2, name: 'Nothing to draft from yet' },
      { timeout: 5000 },
    );
    const card = title.closest('section') as HTMLElement;
    expect(card).toHaveClass('fa-msgcard');
    expect(card).toHaveTextContent(
      'Drafts are made from an experiment you teach. Your Institute Admin hasn’t assigned you a course yet.',
    );
    expect(within(card).getByRole('link', { name: 'Back to Question bank' })).toHaveAttribute(
      'href',
      '/faculty/question-bank',
    );
    expect(screen.queryByRole('form')).toBeNull();
  });
});

describe('FA-16 — validation', () => {
  it('the service’s words: “Check these choices”, focused, and each step’s line', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await openDraft(runtime);
    await user.click(screen.getByRole('button', { name: 'Draft questions' }));
    const summary = await screen.findByRole('alert');
    await waitFor(() => expect(summary).toHaveFocus());
    expect(summary).toHaveClass('rk-errsum');
    expect(summary.querySelector('.rk-errsum-t')).toHaveTextContent('Check these choices');
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
    expect(main().querySelector('#dq-n-e')).toHaveTextContent('Choose how many drafts you want');
    const howMany = screen.getByRole('group', { name: 'How many drafts' });
    expect(howMany).toHaveClass('is-invalid');
    expect(howMany).toHaveAccessibleDescription('Choose how many drafts you want');
    // A summary link moves focus to its step's first choice.
    await user.click(
      within(summary).getByRole('link', { name: 'Choose how many drafts you want' }),
    );
    expect(screen.getByRole('radio', { name: '3 drafts' })).toHaveFocus();
    await user.click(
      within(summary).getByRole('link', { name: 'Choose the material to draft from' }),
    );
    expect(screen.getByRole('radio', { name: /The experiment’s lab brief/ })).toHaveFocus();
    // Choosing clears that step's error, and its summary line.
    await user.click(screen.getByRole('checkbox', { name: 'True or false' }));
    expect(main().querySelector('#dq-types-e')).toBeNull();
    expect(within(summary).getAllByRole('link')).toHaveLength(2);
    // "Text I paste" asks for the text.
    await user.click(screen.getByRole('radio', { name: /Text I paste/ }));
    expect(screen.getByRole('textbox', { name: 'Text to draft from' })).toBeVisible();
    await user.click(screen.getByRole('radio', { name: '3 drafts' }));
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

describe('FA-16 — drafts to review', () => {
  it('three drafts, each a review card, typed but without marks; none in the bank', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await openDraft(runtime);
    await requestThree(user);
    const section = screen.getByRole('region', { name: 'Drafts to review' });
    expect(section.querySelector('.rk-sec-h [role="status"]')).toHaveTextContent(
      '3 drafts left to review',
    );
    expect(section).toHaveTextContent(
      'Read each draft against the material before adding it. Edit anything that isn’t right.',
    );
    expect(within(section).getByRole('note')).toHaveTextContent(STAND_IN);
    expect(draftRows().map((row) => titleOf(row))).toEqual(F1_DRAFTS);
    expect(draftRows().map((row) => tagsOf(row))).toEqual([
      ['Draft — needs your review', 'Drafted with assistance'],
      ['Draft — needs your review', 'Drafted with assistance'],
      ['Draft — needs your review', 'Drafted with assistance'],
    ]);
    // The type alone: a draft has no marks (state-copy `FA-16.marks`).
    expect(draftRows().map((row) => metaOf(row))).toEqual([
      'Multiple choice',
      'True or false',
      'Written answer',
    ]);
    const [first, second] = draftRows() as [HTMLLIElement, HTMLLIElement];
    // The choice draft's options with its key; the true-or-false draft's answer.
    const options = within(first).getByRole('list', { name: 'Answer options in this draft' });
    expect(options.querySelectorAll('li.fa-dopt.is-key')).toHaveLength(1);
    expect(options.querySelector('li.is-key')).toHaveTextContent('Correct');
    expect(second.querySelector('.fa-dkey')).toHaveTextContent('Correct answerFalse');
    expect(within(first).getByRole('button', { name: `Add to bank: ${F1_DRAFTS[0]}` })).toHaveClass(
      'rb-btn',
    );
    expect(
      within(first).getByRole('button', { name: `Discard draft: ${F1_DRAFTS[0]}` }),
    ).toHaveClass('rb-btn--ghost');
    expect(
      within(first).getByRole('button', { name: `Review and edit draft: ${F1_DRAFTS[0]}` }),
    ).toBeVisible();
    // The side panel: this request's figures, Draft more and the way back.
    const side = screen.getByRole('complementary', { name: 'This request' });
    expect(factsOf(side.querySelector('.fa-side-sec')!)).toEqual([
      ['Drafted', '3'],
      ['Left to review', '3'],
      ['Added to your bank', '0'],
      ['Discarded', '0'],
    ]);
    expect(within(side).getByRole('button', { name: 'Draft more' })).toBeVisible();
    expect(within(side).getByRole('link', { name: 'Back to Question bank' })).toHaveAttribute(
      'href',
      BANK_ADDRESS,
    );
    await waitFor(() =>
      expect(factsOf(side.querySelectorAll('.fa-side-sec')[1]!)).toEqual([
        ['Questions', '6'],
        ['Drafts waiting', '3'],
      ]),
    );
    expectNoReference();
    // Held for review only (Q-06): the bank still has its six questions.
    expect(await bankOf(sample)).toHaveLength(6);
    expect((await draftsOf(sample)).map((draft) => draft.marks)).toEqual([null, null, null]);
  });

  it('Add to bank without marks opens the fields with the marks error; with marks it is added', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await openDraft(runtime);
    await requestThree(user);
    await user.click(screen.getByRole('button', { name: `Add to bank: ${F1_DRAFTS[0]}` }));
    const editor = await screen.findByRole('form', { name: F1_DRAFTS[0] });
    expect(editor).toHaveClass('fa-formcol');
    expect(editor.closest('li')).toHaveClass('fa-dcard');
    const summary = within(editor).getByRole('alert');
    await waitFor(() => expect(summary).toHaveFocus());
    expect(summary.querySelector('.rk-errsum-t')).toHaveTextContent('Check this question');
    expect(
      within(summary)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Enter the marks, as a whole number of 1 or more']);
    // The draft's own content, as the FA-15 sections (their headings under the list's).
    expect(
      within(editor).getByRole('heading', { level: 3, name: 'Question and answer' }),
    ).toBeVisible();
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
    const message = await waitFor(() => document.getElementById('dq-msg')!);
    expect(message).toHaveTextContent('Added to your question bank.');
    expect(message).toHaveClass('rk-notice--ok');
    await waitFor(() => expect(message).toHaveFocus());
    // The draft stays in place, in the bank (`d.added`); two are left.
    const added = draftRows()[0]!;
    expect(added).toHaveClass('is-added');
    expect(tagsOf(added)).toEqual(['In your bank · reviewed by you']);
    expect(metaOf(added)).toBe('In your question bank · Multiple choice');
    expect(within(added).queryByRole('button')).toBeNull();
    expect(main().querySelector('.rk-sec-h [role="status"]')).toHaveTextContent(
      '2 drafts left to review',
    );
    const side = screen.getByRole('complementary', { name: 'This request' });
    expect(factsOf(side.querySelector('.fa-side-sec')!)).toEqual([
      ['Drafted', '3'],
      ['Left to review', '2'],
      ['Added to your bank', '1'],
      ['Discarded', '0'],
    ]);
    expectNoReference();
    const record = (await bankOf(sample)).find((entry) => entry.question.text === F1_DRAFTS[0]);
    expect(record?.question).toMatchObject({ origin: 'reviewed-draft', marks: 2 });
    expect(record?.usedIn).toBe(0);
    expect(await draftsOf(sample)).toHaveLength(2);
  });

  it('Review and edit: the fields in the card; Cancel keeps what was typed; the edit goes to the bank', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await openDraft(runtime);
    await requestThree(user);
    const row = draftRows()[1]!;
    await user.click(
      within(row).getByRole('button', { name: `Review and edit draft: ${F1_DRAFTS[1]}` }),
    );
    const editor = await screen.findByRole('form', { name: F1_DRAFTS[1] });
    await waitFor(() =>
      expect(within(editor).getByRole('textbox', { name: 'Question' })).toHaveFocus(),
    );
    // The card's own actions make way for the fields.
    expect(within(row).queryByRole('button', { name: /^Add to bank:/ })).toBeNull();
    expect(within(editor).getByRole('radio', { name: 'False' })).toBeChecked();
    const question = within(editor).getByRole('textbox', { name: 'Question' });
    await user.clear(question);
    await user.type(question, 'Counter flow needs less area than parallel flow for the same duty.');
    await user.click(within(editor).getByRole('radio', { name: 'True' }));
    await user.click(within(editor).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('form', { name: F1_DRAFTS[1] })).toBeNull();
    await waitFor(() =>
      expect(
        within(draftRows()[1]!).getByRole('button', {
          name: `Review and edit draft: ${F1_DRAFTS[1]}`,
        }),
      ).toHaveFocus(),
    );
    await user.click(
      within(draftRows()[1]!).getByRole('button', {
        name: `Review and edit draft: ${F1_DRAFTS[1]}`,
      }),
    );
    const again = await screen.findByRole('form', { name: F1_DRAFTS[1] });
    expect(within(again).getByRole('textbox', { name: 'Question' })).toHaveValue(
      'Counter flow needs less area than parallel flow for the same duty.',
    );
    await user.type(within(again).getByRole('textbox', { name: 'Marks' }), '3');
    await user.click(within(again).getByRole('button', { name: 'Add to bank' }));
    await waitFor(() =>
      expect(document.getElementById('dq-msg')).toHaveTextContent('Added to your question bank.'),
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
    await user.click(screen.getByRole('button', { name: `Discard draft: ${F1_DRAFTS[2]}` }));
    const message = await waitFor(() => document.getElementById('dq-msg')!);
    expect(message).toHaveTextContent('Draft discarded. Nothing was added to your bank.');
    await waitFor(() => expect(message).toHaveFocus());
    expect(draftRows()).toHaveLength(2);
    expect(main().querySelector('.rk-sec-h [role="status"]')).toHaveTextContent(
      '2 drafts left to review',
    );
    expect(
      factsOf(
        screen.getByRole('complementary', { name: 'This request' }).querySelector('.fa-side-sec')!,
      ),
    ).toEqual([
      ['Drafted', '3'],
      ['Left to review', '2'],
      ['Added to your bank', '0'],
      ['Discarded', '1'],
    ]);
    expect(await draftsOf(sample)).toHaveLength(2);
    expect(await bankOf(sample)).toHaveLength(6);

    await user.click(screen.getByRole('button', { name: 'Draft more' }));
    const form = await screen.findByRole('form', { name: 'What to draft' });
    await waitFor(() => expect(h1()).toHaveFocus());
    expect(within(form).getByRole('radio', { name: /lab brief/ })).toBeChecked();
    expect(within(form).getByRole('checkbox', { name: 'Written answer' })).toBeChecked();
    expect(within(form).getByRole('radio', { name: '3 drafts' })).toBeChecked();
    expect(screen.getByRole('complementary', { name: 'How drafting works' })).toBeVisible();
  });

  it('every draft of the request added or discarded: the list says so', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await openDraft(runtime);
    await requestThree(user);
    for (const draft of F1_DRAFTS) {
      await user.click(screen.getByRole('button', { name: `Discard draft: ${draft}` }));
      await waitFor(() =>
        expect(screen.queryByRole('button', { name: `Discard draft: ${draft}` })).toBeNull(),
      );
    }
    expect(main().querySelector('.rk-sec-h [role="status"]')).toHaveTextContent('All reviewed');
    expect(main().querySelector('.fa-dl-done')).toHaveTextContent(
      'Every draft from this request has been added or discarded.',
    );
  });

  it('drafting fails for now: the failure takes focus, the choices stay; trying again works', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await openDraft(runtime);
    faults(sample).failNext('QuestionBankService.requestDrafts');
    await user.click(screen.getByRole('radio', { name: /lab brief/ }));
    await user.click(screen.getByRole('checkbox', { name: 'Multiple choice' }));
    await user.click(screen.getByRole('radio', { name: '3 drafts' }));
    await user.click(screen.getByRole('button', { name: 'Draft questions' }));
    const fail = await screen.findByText('Drafting didn’t work this time');
    await waitFor(() => expect(main().querySelector('#dq-fail')).toHaveFocus());
    expect(fail.closest('.rk-notice')).toHaveClass('rk-notice--warn');
    expect(fail.closest('.rk-notice')).toHaveTextContent(
      'Nothing was added to your bank. Your choices are kept — try again.',
    );
    expect(screen.getByRole('radio', { name: /lab brief/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: '3 drafts' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Draft questions' }));
    await screen.findByRole('heading', { level: 2, name: 'Drafts to review' });
    expect(draftRows().map((row) => [...tagsOf(row), metaOf(row)].join(' '))).toEqual([
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
    await user.click(screen.getByRole('button', { name: `Discard draft: ${F1_DRAFTS[0]}` }));
    await waitFor(() =>
      expect(document.getElementById('dq-msg')).toHaveTextContent(stateWords('FA-16.draft-gone')),
    );
    expect(document.getElementById('dq-msg')).toHaveClass('rk-notice--warn');
    await waitFor(() => expect(draftRows()).toHaveLength(2));
  });
});

// ---- FA-14 Drafts to review tab ------------------------------------------------------------------

describe('FA-14 — Drafts to review', () => {
  it('the tab lists the drafts as cards beside “How review works”; an added draft moves to Questions', async () => {
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
    expect(section).toHaveClass('rk-surface', 'fa-formcol');
    await waitFor(() => expect(draftRows()).toHaveLength(3));
    const tabs = screen.getByRole('navigation', { name: 'Question bank' });
    expect(within(tabs).getByRole('link', { name: 'Drafts to review, 3' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(section).toHaveTextContent(
      'Drafts never go into your bank on their own. Review each one, then add it or discard it.',
    );
    expect(section.querySelector('.fa-pickcount')).toHaveTextContent('3 drafts to review');
    expect(within(section).getByRole('note')).toHaveTextContent(STAND_IN);
    expect(within(section).queryByRole('button', { name: 'Draft more' })).toBeNull();
    const side = screen.getByRole('complementary', { name: 'How review works' });
    expect([...side.querySelectorAll('.fa-howto b')].map((item) => item.textContent)).toEqual([
      'Check it against the material',
      'Edit what isn’t right',
      'Add it or discard it',
    ]);
    expectNoReference();

    await user.click(screen.getByRole('button', { name: `Discard draft: ${F1_DRAFTS[1]}` }));
    await waitFor(() =>
      expect(document.getElementById('qb-dmsg')).toHaveTextContent(
        'Draft discarded. Nothing was added to your bank.',
      ),
    );
    await user.click(
      within(draftRows()[0]!).getByRole('button', {
        name: `Review and edit draft: ${F1_DRAFTS[0]}`,
      }),
    );
    const editor = await screen.findByRole('form', { name: F1_DRAFTS[0] });
    await user.type(within(editor).getByRole('textbox', { name: 'Marks' }), '2');
    await user.click(within(editor).getByRole('button', { name: 'Add to bank' }));
    await waitFor(() =>
      expect(document.getElementById('qb-dmsg')?.querySelector('.rk-notice-t')).toHaveTextContent(
        'Added to your question bank.',
      ),
    );
    expect(document.getElementById('qb-dmsg')?.querySelector('.rk-notice-d')).toHaveTextContent(
      'It’s under Questions now. It isn’t in any assessment yet.',
    );
    // Added drafts leave this list (they are under Questions, "From a draft you reviewed").
    await waitFor(() => expect(draftRows()).toHaveLength(1));
    await waitFor(() =>
      expect(within(tabs).getByRole('link', { name: 'Drafts to review, 1' })).toBeVisible(),
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
    ok(
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
    const row = [...table.querySelectorAll('tbody tr')].find(
      (tr) => text(tr.querySelector('.fa-qt')) === draft!.text,
    )!;
    expect(row.querySelector('.fa-cellline .fa-tag')).toHaveTextContent(
      'From a draft you reviewed',
    );
    expect(table.querySelector('tbody tr')!.querySelector('.fa-tag')).toBeNull();
    await waitFor(() =>
      expect(
        within(screen.getByRole('navigation', { name: 'Question bank' })).getByRole('link', {
          name: 'Drafts to review, 2',
        }),
      ).toBeVisible(),
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
    const title = await screen.findByText('No drafts to review', {}, { timeout: 5000 });
    const empty = title.closest('.rk-state') as HTMLElement;
    expect(empty).toHaveTextContent(
      'Drafts you ask for appear here until you add or discard them.',
    );
    expect(within(empty).getByRole('link', { name: 'Draft with assistance' })).toHaveAttribute(
      'href',
      `/faculty/question-bank/draft?experimentId=${SHELL}`,
    );
    expect(main().querySelector('.fa-pickcount')).toBeNull();
  });
});

// ---- FA-17 -------------------------------------------------------------------------------------

const fileInput = () => main().querySelector<HTMLInputElement>('input[type="file"]')!;
const chosenName = () => main().querySelector('.fa-file .fa-file-name');
/** A table cell's value, without its phone label (`span.fa-lbl`). */
function valueOf(cell: Element): string {
  const copy = cell.cloneNode(true) as Element;
  for (const label of copy.querySelectorAll('.fa-lbl')) label.remove();
  return text(copy);
}
const figures = () =>
  [...main().querySelectorAll('dl.fa-repfigs > div')].map((figure) => [
    text(figure.querySelector('dt')),
    text(figure.querySelector('dd')),
    figure.className,
  ]);

async function openImport(runtime: PlatformRuntime, search = `?experimentId=${SHELL}`) {
  const rendered = inShell(runtime, IMPORT_PATH, search, <ImportQuestions />);
  await screen.findByRole('heading', { level: 1, name: 'Choose a file' }, { timeout: 5000 });
  return rendered;
}

async function choose(user: ReturnType<typeof userEvent.setup>, csv: string, name: string) {
  await user.upload(fileInput(), new File([csv], name, { type: 'text/csv' }));
  await waitFor(() => expect(chosenName()).toHaveTextContent(name));
}

async function checkFile(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Check file' }));
  await screen.findByRole('heading', { level: 1, name: 'Check rows' });
  await waitFor(() => expect(h1()).toHaveFocus());
}

describe('FA-17 — step 1', () => {
  it('the stepper, the chooser, the template beside it; a check without a file is refused', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await openImport(runtime);
    expect(main().querySelector('.rk-head .rk-eyebrow')).toHaveTextContent('Step 1 of 3');
    expect(crumbs().querySelector('[aria-current="page"]')).toHaveTextContent('Import questions');
    await waitFor(() => expect(document.title).toMatch(/^Import questions · /));
    const steps = screen.getByRole('list', { name: 'Steps to import questions' });
    expect(steps).toHaveClass('fa-steps', 'fa-steps--fit');
    expect(steps.querySelector('[aria-current="step"]')).toHaveTextContent(
      'Choose a file, current step',
    );
    const template = screen.getByRole('complementary', { name: 'The template' });
    expect(template).toHaveTextContent('One row per question. A file imports whole or not at all.');
    expect([...template.querySelectorAll('.fa-tpl dt')].map((term) => term.textContent)).toEqual([
      'type',
      'question',
      'option_a – option_d',
      'correct',
      'marks',
      'explanation',
      'marking_guidance',
    ]);
    // The type column keeps the product's "multiple choice", the spelling the domain reads.
    expect(template.querySelector('.fa-tpl dd')).toHaveTextContent(
      'multiple choice, true or false, or written answer',
    );
    const download = within(template).getByRole('link', { name: 'Download the template (CSV)' });
    expect(download).toHaveAttribute('download', 'questions-template.csv');
    expect(decodeURIComponent(QUESTION_TEMPLATE_DOWNLOAD.href.split(',').slice(1).join(','))).toBe(
      `${QUESTION_TEMPLATE_COLUMNS.join(',')}\n`,
    );
    expect(main()).toHaveTextContent(
      `Questions go into your bank for ${SHELL_NAME}. They aren’t added to any assessment.`,
    );
    expect(chosenName()).toHaveTextContent('No file chosen');
    expect(chosenName()).toHaveClass('is-none');
    expect(screen.getByRole('group', { name: 'Your CSV file' })).toHaveClass('fa-file--import');
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', BANK_ADDRESS);

    await user.click(screen.getByRole('button', { name: 'Check file' }));
    await waitFor(() =>
      expect(main().querySelector('#qimport-file-e')).toHaveTextContent('Choose a CSV file first'),
    );
    expect(main().querySelector('#qimport-file-e')).toHaveAttribute('role', 'alert');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Choose a CSV file' })).toHaveFocus(),
    );
    expectNoReference();
  });

  it('a file without the template’s columns, or without rows: the register’s words', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await openImport(runtime);
    await choose(user, 'question,marks\nWhat?,2', 'two-columns.csv');
    await user.click(screen.getByRole('button', { name: 'Check file' }));
    await waitFor(() =>
      expect(main().querySelector('#qimport-file-e')).toHaveTextContent(
        stateWords('FA-17.file.columns'),
      ),
    );
    await choose(user, HEADER, 'header-only.csv');
    await user.click(screen.getByRole('button', { name: 'Check file' }));
    await waitFor(() =>
      expect(main().querySelector('#qimport-file-e')).toHaveTextContent(
        stateWords('FA-17.file.no-rows'),
      ),
    );
  });

  it('out of scope → the in-shell not-found; none taught → the no-course card', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { view } = inShell(
      runtime,
      IMPORT_PATH,
      '?experimentId=fin-tube-bundle',
      <ImportQuestions />,
    );
    expect(await notFoundHeading()).toBeVisible();
    view.unmount();
    const desai = await tabPlatform(DESAI, 'after-flow-c');
    inShell(desai.runtime, IMPORT_PATH, '', <ImportQuestions />);
    const title = await screen.findByRole(
      'heading',
      { level: 2, name: 'Nothing to import into yet' },
      { timeout: 5000 },
    );
    expect(title.closest('section')).toHaveTextContent(
      'Imported questions belong to an experiment you teach. Your Institute Admin hasn’t assigned you a course yet.',
    );
    expect(screen.queryByRole('list', { name: 'Steps to import questions' })).toBeNull();
  });
});

describe('FA-17 — check rows, confirm, imported', () => {
  it('errors block; another file imports all eight into the bank only', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    await openImport(runtime);
    await choose(user, WITH_ERRORS, 'post-lab-questions.csv');
    await checkFile(user);
    expect(main().querySelector('.rk-head .rk-eyebrow')).toHaveTextContent('Step 2 of 3');
    expect(main().querySelector('p.fa-filerow')).toHaveTextContent('post-lab-questions.csv');
    expect(figures()).toEqual([
      ['Rows', '8', ''],
      ['Ready', '6', 'is-ok'],
      ['With errors', '2', 'is-err'],
      ['With warnings', '1', 'is-warn'],
    ]);
    expect(main()).toHaveTextContent('Nothing is imported while the file has errors');
    expect(main()).toHaveTextContent(
      'Fix the rows marked Error in your file, then choose it again. For now, a file imports whole or not at all.',
    );
    const table = screen.getByRole('table', { name: 'Rows that need attention' });
    expect(table.closest('.fa-tablewrap')).toHaveClass('fa-boxtable');
    expect(
      [...table.querySelectorAll('tbody tr')].map((tr) =>
        [...tr.querySelectorAll('td')].map((td) => valueOf(td)),
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
    expect(table.querySelectorAll('.xr-st--err')).toHaveLength(2);
    expect(table.querySelectorAll('.xr-st--warn')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
    expect(
      screen.getByRole('list', { name: 'Steps to import questions' }).querySelector('.is-done'),
    ).toHaveTextContent('Choose a file, done');

    // "Choose another file": step 1, no file, the chooser focused.
    await user.click(screen.getByRole('button', { name: 'Choose another file' }));
    await screen.findByRole('heading', { level: 1, name: 'Choose a file' });
    expect(chosenName()).toHaveTextContent('No file chosen');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Choose a CSV file' })).toHaveFocus(),
    );
    await choose(user, CORRECTED, 'post-lab-questions-corrected.csv');
    await checkFile(user);
    expect(figures()).toEqual([
      ['Rows', '8', ''],
      ['Ready', '8', 'is-ok'],
      ['With errors', '0', 'is-none'],
      ['With warnings', '1', 'is-warn'],
    ]);
    expect(main()).not.toHaveTextContent('Nothing is imported');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('heading', { level: 1, name: 'Confirm import' });
    expect(text(main().querySelector('p.fa-result-t'))).toBe(
      '8 questions will be added to your bank from post-lab-questions-corrected.csv.',
    );
    const does = screen.getByRole('list', { name: 'What importing does' });
    expect([...does.querySelectorAll('li')].map((item) => [item.className, text(item)])).toEqual([
      ['is-ok', `They go into your question bank for ${SHELL_NAME}.`],
      ['is-ok', 'They aren’t added to any assessment. You choose where to use them.'],
      ['is-no', 'One has no explanation — students would see none for it.'],
    ]);
    expect(await bankOf(sample)).toHaveLength(6);
    // Back keeps the check.
    await user.click(screen.getByRole('button', { name: 'Back' }));
    await screen.findByRole('heading', { level: 1, name: 'Check rows' });
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(await screen.findByRole('button', { name: 'Import 8 questions' }));

    await screen.findByRole('heading', { level: 1, name: 'Questions imported' });
    await waitFor(() => expect(h1()).toHaveFocus());
    expect(main().querySelector('.rk-head .rk-eyebrow')).toHaveTextContent('Import questions');
    expect(screen.queryByRole('list', { name: 'Steps to import questions' })).toBeNull();
    expect(screen.queryByRole('complementary', { name: 'The template' })).toBeNull();
    expect(main().querySelector('.fa-author')).toHaveClass('fa-author--one');
    const bank = await bankOf(sample);
    expect(bank).toHaveLength(14);
    const imported = bank.filter((entry) => entry.question.origin === 'import');
    expect(imported).toHaveLength(8);
    expect(imported.every((entry) => entry.usedIn === 0)).toBe(true);
    const done = main().querySelector('.fa-result') as HTMLElement;
    expect(done.querySelector('.rk-notice-t')).toHaveTextContent('Import finished');
    // How many were added — never the references they were given.
    expect(done.querySelector('.rk-notice-d')).toHaveTextContent(
      '8 questions were added to your bank. None is in an assessment yet.',
    );
    expectNoReference();
    expect(screen.getByRole('link', { name: 'Open question bank' })).toHaveAttribute(
      'href',
      BANK_ADDRESS,
    );
    await user.click(screen.getByRole('button', { name: 'Import another file' }));
    await screen.findByRole('heading', { level: 1, name: 'Choose a file' });
    expect(chosenName()).toHaveTextContent('No file chosen');
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
      'FA-17: Check file · Choose another file · Continue · Import N questions',
      'FA-17: Open question bank',
    ]);
    expect(
      P4B_QUESTION_TOOLS_LINK_TARGETS.filter((entry) => entry.outcome === 'not-rendered'),
    ).toEqual([]);
  });
});

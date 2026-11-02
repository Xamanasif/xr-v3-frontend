/**
 * FA-14 Question bank and FA-15 Add / edit question as the V3 export draws them (FA-v1
 * `Main.dc.html` "FA-14", "FA-15"), on the real composition root and the sample world. After
 * Flow C the bank holds six questions for Shell-and-Tube; after Flow D four of them are used by
 * "Heat Exchanger — post-lab". The one world moves both pages: a question added through the form is
 * in the bank list; an edit of a used question makes a new version while the assessment keeps the
 * version it pinned (`newerVersion` set); a deleted question leaves the list with its history kept.
 * The service's validation words for each type; the `returnTo` + `added=` protocol FA-07 and FA-09
 * rely on; the loading, failed, no-match, no-experiment, colleague's question (an undecided rule),
 * conflict and not-found states. The owner's identifier rule: no question or assessment is named by
 * its internal reference anywhere a person reads or hears it — the references stay in addresses
 * and keys (the search still finds a question by its key). The "Drafts to review" tab's behaviour
 * is `question-tools.test.tsx`'s.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AccessPlan, AssessmentId, ExperimentId, Question, QuestionId } from '@xr/domain';
import { asPersonId, faults, fixtureWorld } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  ADDED_MESSAGE,
  addedFactWords,
  addedOnWords,
  bankLead,
  DELETE_DIALOG,
  DELETED_MESSAGE,
  deletedLine,
  deletedRowWords,
  deleteLabel,
  deleteUsedWords,
  editLabel,
  experimentContext,
  marksWords,
  QUESTION_BANK,
  QUESTION_EDITOR,
  QUESTION_TYPE_LINES,
  questionCount,
  removeFilterLabel,
  savedUsedLine,
  savedVersionWords,
  searchChipWords,
  typeChipWords,
  typeSplitWords,
  usedNoticeTitle,
  usedWords,
  versionFactWords,
  versionWords,
} from '@/copy/question-bank';
import { STATE_COPY } from '@/copy/state-copy';
import { STATE_COPY_QUESTION_BANK } from '@/copy/state-copy-question-bank';
import { P4_QUESTION_BANK_LINK_TARGETS } from '@/nav/link-targets-p4/question-bank';
import type { PlatformRuntime } from '@/platform/runtime';
import { faExport } from '@/test-support/boards';
import {
  renderInTab,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
  worldPlatform,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { QuestionBank } from './fa-14-question-bank/question-bank';
import { EditQuestion, NewQuestion } from './fa-15-question/question-editor';
import { safeReturnTo, withAdded } from './fa-15-question/return-to';

afterEach(() => {
  forgetLastAddress();
});

const RANGANATHAN = 'per-0014';
const DESAI = 'per-0015';
const SHELL = 'shell-and-tube-heat-exchanger';
const FIN_TUBE = 'fin-tube-bundle';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const BANK_ADDRESS = `/faculty/question-bank?experimentId=${SHELL}`;
const POST_LAB = 'Heat Exchanger — post-lab';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function inShell(ui: ReactNode) {
  return (
    <WorkspaceLayout workspace="faculty">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{ui}</TestNotFoundBoundary>
    </WorkspaceLayout>
  );
}

function showBank(runtime: PlatformRuntime, search = '') {
  const navigation = testNavigation('/faculty/question-bank', search);
  const view = renderInTab(inShell(<QuestionBank />), { runtime, navigation });
  return { navigation, view };
}

function showNew(runtime: PlatformRuntime, search = `?experimentId=${SHELL}`) {
  const navigation = testNavigation('/faculty/question-bank/new', search);
  const view = renderInTab(inShell(<NewQuestion />), { runtime, navigation });
  return { navigation, view };
}

function showEdit(runtime: PlatformRuntime, questionId: string, search = '') {
  const navigation = testNavigation(`/faculty/question-bank/${questionId}`, search);
  const view = renderInTab(inShell(<EditQuestion questionId={questionId} />), {
    runtime,
    navigation,
  });
  return { navigation, view };
}

const main = () => screen.getByRole('main');
const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
const bankHeading = () =>
  screen.findByRole('heading', { level: 1, name: 'Question bank' }, { timeout: 5000 });
const notFoundHeading = () =>
  screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }, { timeout: 5000 });
const table = () => screen.findByRole('table', {}, { timeout: 5000 });
const count = () => text(main().querySelector('.rk-statusline .rk-count'));
const form = (name: string) => screen.findByRole('form', { name }, { timeout: 5000 });
const railCurrent = () =>
  within(screen.getByRole('navigation', { name: 'Faculty navigation' }))
    .getAllByRole('link')
    .find((link) => link.getAttribute('aria-current') === 'page');
const crumbs = () => within(main()).getByRole('navigation', { name: 'Breadcrumb' });

/** An internal reference no Faculty page shows (the owner's identifier rule, 21 Oct 2026). */
const REFERENCE = /\b(?:ASMT|ATT|Q|D|REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

/**
 * No internal reference anywhere a person reads or hears it: the document's words (hidden dialogs,
 * screen-reader words and status regions included), every `aria-label`, `title` and
 * `placeholder`, form values, and the tab's title. The references stay in addresses and keys.
 */
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
  for (const field of document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
    'input:not([type="radio"]):not([type="checkbox"]), textarea',
  )) {
    expect(field.value).not.toMatch(REFERENCE);
  }
  expect(document.title).not.toMatch(REFERENCE);
}

interface RowFacts {
  readonly text: string;
  readonly type: string;
  readonly version: string | null;
  readonly marks: string;
  readonly used: string;
  readonly added: string;
  readonly fromDraft: boolean;
}

/** The table's rows as the export draws each one. */
async function rows(): Promise<RowFacts[]> {
  const found = await table();
  return [...found.querySelectorAll('tbody tr')].map((row) => {
    const cells = row.querySelectorAll('td');
    return {
      text: text(row.querySelector('.fa-qt')),
      type: text(row.querySelector('.fa-qtype')),
      version: row.querySelector('.fa-id') ? text(row.querySelector('.fa-id')) : null,
      marks: text(cells[1]!),
      used: text(cells[2]!.querySelector('.fa-cellname, .fa-quiet')),
      added: text(cells[3]!),
      fromDraft: row.querySelector('.fa-tag') !== null,
    };
  });
}

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

function faculty(sample: Sample) {
  return asPersonId(sample, RANGANATHAN);
}

/** The bank's questions as the service reads them for Dr Ranganathan (deleted ones too). */
async function bankOf(sample: Sample, includeDeleted = false) {
  return ok(
    await faculty(sample).questionBank.listQuestions({
      experimentId: SHELL as ExperimentId,
      includeDeleted,
    }),
  );
}

/** The keys of the questions the table shows, read back from their words (never shown). */
async function ids(sample: Sample): Promise<string[]> {
  const all = await bankOf(sample, true);
  return (await rows()).map(
    (row) => all.find((entry) => entry.question.text === row.text)?.question.id ?? `?${row.text}`,
  );
}

async function textOf(sample: Sample, questionId: string): Promise<string> {
  return ok(await faculty(sample).questionBank.getQuestion(questionId as QuestionId)).question.text;
}

/** After Flow C, with Fin-Tube Bundle (Shell-and-Tube's course) held too: two experiments taught. */
async function twoExperiments() {
  const world = await fixtureWorld('after-flow-c');
  const plan = world.records.plans['ACC-0107'] as AccessPlan;
  return worldPlatform(RANGANATHAN, {
    ...world,
    records: {
      ...world.records,
      plans: {
        ...world.records.plans,
        'ACC-0107': {
          ...plan,
          items: [...plan.items, { experimentId: FIN_TUBE as never, formats: ['web'] }],
        },
      },
    },
  });
}

// ---- The bank ---------------------------------------------------------------------------------

describe('FA-14 — the bank', () => {
  it('the head, the record tabs, the Questions section, its toolbar and each question with its use', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showBank(runtime);
    await bankHeading();
    await table();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('tabindex', '-1');
    expect(main().querySelector('.rk-head .rk-sub')).toHaveTextContent(
      `Your questions for ${SHELL_NAME} · ME ZG523. Drafts stay apart until you review them.`,
    );
    // The head's actions in the export's order: the gold primary, Draft with assistance, Import.
    const actions = main().querySelector('.rk-head-act') as HTMLElement;
    expect(
      [...actions.querySelectorAll('a')].map((link) => [
        text(link),
        link.getAttribute('href'),
        link.className,
      ]),
    ).toEqual([
      [
        'Add a question',
        `/faculty/question-bank/new?experimentId=${SHELL}`,
        'rb-btn rb-btn--primary rb-btn--lg',
      ],
      [
        'Draft with assistance',
        `/faculty/question-bank/draft?experimentId=${SHELL}`,
        'rb-btn rb-btn--lg',
      ],
      [
        'Import',
        `/faculty/question-bank/import?experimentId=${SHELL}`,
        'rb-btn rb-btn--ghost rb-btn--lg',
      ],
    ]);
    // The record tabs with their counts (a hidden figure, read as ", 6").
    const tabs = screen.getByRole('navigation', { name: 'Question bank' });
    expect(tabs).toHaveClass('rk-tabs', 'fa-tabs');
    expect(within(tabs).getByRole('link', { name: 'Questions, 6' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await waitFor(() =>
      expect(within(tabs).getByRole('link', { name: 'Drafts to review, 0' })).toHaveAttribute(
        'href',
        `/faculty/question-bank?tab=drafts&experimentId=${SHELL}`,
      ),
    );
    // The shell: Question bank current; the tab's title.
    expect(railCurrent()).toHaveAttribute('href', '/faculty/question-bank');
    expect(document.title).toMatch(/^Question bank · /);

    const section = screen.getByRole('region', { name: 'Questions' });
    expect(section.querySelector('.fa-tbar-t .rk-hint')).toHaveTextContent(
      '3 multiple choice · 2 true or false · 1 written answer',
    );
    expect(within(section).getByRole('search', { name: 'Filter questions' })).toBeVisible();
    expect(within(section).getByRole('searchbox', { name: 'Search' })).toHaveAttribute(
      'placeholder',
      'Words in the question',
    );
    // One experiment taught: no Experiment filter (the export's `QB.multiExp`).
    expect(within(section).queryByRole('combobox', { name: 'Experiment' })).toBeNull();
    const type = within(section).getByRole('combobox', { name: 'Type' });
    expect(
      within(type)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['All types', 'Multiple choice', 'True or false', 'Written answer']);
    expect(type.closest('.rk-field')).toHaveClass('fa-field-sel');

    const found = await table();
    expect(found).toHaveClass('rk-table', 'fa-table', 'fa-btable', 'fa-ptable');
    expect([...found.querySelectorAll('th')].map((cell) => text(cell))).toEqual([
      'Question',
      'Marks',
      'Used in',
      'Added',
      'Actions',
    ]);
    const facts = await rows();
    expect(facts.map((row) => [row.type, row.marks, row.used])).toEqual([
      ['Multiple choice', '2 marks', POST_LAB],
      ['Multiple choice', '2 marks', POST_LAB],
      ['Multiple choice', '2 marks', 'Not yet'],
      ['True or false', '2 marks', POST_LAB],
      ['True or false', '2 marks', 'Not yet'],
      ['Written answer', '10 marks', POST_LAB],
    ]);
    expect(facts[0]!.text).toMatch(/^What does the effectiveness .* compare\?$/);
    expect(facts[0]!.added).toMatch(/^\d{1,2} [A-Z][a-z]{2} 2026$/);
    expect(facts.every((row) => row.version === null && !row.fromDraft)).toBe(true);
    expect(count()).toBe('6 questions');
    // Each row: Edit and Delete, named by the question's words; Edit opens it by its address.
    const first = found.querySelector('tbody tr') as HTMLElement;
    expect(first).toHaveClass('fa-static');
    expect(first.querySelector('.fa-qtype--w')).toBeNull();
    const q101 = await textOf(sample, 'Q-0101');
    expect(within(first).getByRole('link', { name: `Edit question: ${q101}` })).toHaveAttribute(
      'href',
      '/faculty/question-bank/Q-0101',
    );
    expect(within(first).getByRole('button', { name: `Delete question: ${q101}` })).toHaveClass(
      'rb-btn',
      'rb-btn--ghost',
    );
    expect(found.querySelector('tbody tr:last-child .fa-qtype')).toHaveClass('fa-qtype--w');
    expectNoReference();
  });

  it('search and type filter at once, with chips; no match says so and clears', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showBank(runtime);
    await table();
    const search = () => screen.getByRole('searchbox', { name: 'Search' });
    await user.type(search(), 'ntu');
    expect(await ids(sample)).toEqual(['Q-0102']);
    expect(count()).toBe('1 of 6 questions');
    expect(
      screen.getByRole('button', { name: 'Remove filter Search: “ntu”' }).closest('.rk-chip'),
    ).toHaveTextContent('Search: “ntu”');
    await user.clear(search());
    // The search still finds a question by its key, which is never shown (`FA-14.filters`).
    await user.type(search(), 'q-0105');
    expect(await ids(sample)).toEqual(['Q-0105']);
    await user.clear(search());
    await user.selectOptions(screen.getByRole('combobox', { name: 'Type' }), 'True or false');
    expect(await ids(sample)).toEqual(['Q-0104', 'Q-0105']);
    expect(count()).toBe('2 of 6 questions');
    await user.type(search(), 'NTU');
    expect(screen.queryByRole('table')).toBeNull();
    expect(main()).toHaveTextContent('No question matches these filters');
    expect(main()).toHaveTextContent('Try fewer filters or other words.');
    expect(count()).toBe('0 of 6 questions');
    // Removing the type chip: focus goes to the Type filter.
    await user.click(screen.getByRole('button', { name: 'Remove filter Type: True or false' }));
    expect(screen.getByRole('combobox', { name: 'Type' })).toHaveValue('all');
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Type' })).toHaveFocus());
    expect(await ids(sample)).toEqual(['Q-0102']);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Type' }), 'True or false');
    // The no-match state's own "Clear filters" clears both.
    const state = main().querySelector('.rk-state') as HTMLElement;
    await user.click(within(state).getByRole('button', { name: 'Clear filters' }));
    expect(await ids(sample)).toHaveLength(6);
    expect(screen.getByRole('combobox', { name: 'Type' })).toHaveValue('all');
    expect(search()).toHaveValue('');
    expect(count()).toBe('6 questions');
  });

  it('with more than one experiment taught, the Experiment filter lists them and replaces the address', async () => {
    const user = userEvent.setup();
    const { runtime } = await twoExperiments();
    const { navigation } = showBank(runtime, `?experimentId=${SHELL}`);
    await table();
    const experiment = screen.getByRole('combobox', { name: 'Experiment' });
    expect(experiment).toHaveValue(SHELL);
    expect(within(experiment).getAllByRole('option')).toHaveLength(2);
    expect(
      within(experiment)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toContain(SHELL_NAME);
    await user.selectOptions(experiment, SHELL);
    expect(navigation.replace).toHaveBeenLastCalledWith(BANK_ADDRESS);
  });

  it('an experiment outside the teaching scope is the in-shell not-found', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showBank(runtime, `?experimentId=${FIN_TUBE}`);
    expect(await notFoundHeading()).toBeVisible();
  });

  it('no experiment taught yet: the no-course card, no head actions, no tabs', async () => {
    const { runtime } = await tabPlatform(DESAI, 'after-flow-c');
    showBank(runtime);
    await bankHeading();
    const title = await screen.findByRole('heading', {
      level: 2,
      name: 'Your question bank opens with your first course',
    });
    const card = title.closest('section') as HTMLElement;
    expect(card).toHaveClass('rk-surface', 'fa-msgcard');
    expect(card).toHaveTextContent(
      'Questions belong to the experiments you teach. Your Institute Admin hasn’t assigned you a course yet.',
    );
    expect(within(card).getByRole('link', { name: 'Help & support' })).toHaveAttribute(
      'href',
      '/faculty/help',
    );
    expect(main().querySelector('.rk-head .rk-sub')).toHaveTextContent(
      'Questions belong to the experiments you teach.',
    );
    expect(screen.queryByRole('link', { name: 'Add a question' })).toBeNull();
    expect(screen.queryByRole('navigation', { name: 'Question bank' })).toBeNull();
    expect(screen.queryByRole('searchbox')).toBeNull();
  });
});

// ---- The empty bank ---------------------------------------------------------------------------

describe('FA-14 — the empty bank', () => {
  it('“Your question bank is empty”, the head’s ways to add questions, no toolbar', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-b');
    showBank(runtime);
    const title = await screen.findByText('Your question bank is empty', {}, { timeout: 5000 });
    const empty = title.closest('.rk-state') as HTMLElement;
    expect(empty).toHaveClass('rk-state--roomy');
    expect(empty).toHaveTextContent(
      'Add a question, draft some with assistance from the experiment’s material, or import a file. Questions stay here until you use them in an assessment.',
    );
    const head = main().querySelector('.rk-head-act') as HTMLElement;
    expect(within(head).getByRole('link', { name: 'Add a question' })).toHaveAttribute(
      'href',
      `/faculty/question-bank/new?experimentId=${SHELL}`,
    );
    expect(within(head).getByRole('link', { name: 'Import' })).toHaveAttribute(
      'href',
      `/faculty/question-bank/import?experimentId=${SHELL}`,
    );
    expect(
      within(screen.getByRole('navigation', { name: 'Question bank' })).getByRole('link', {
        name: 'Questions, 0',
      }),
    ).toBeVisible();
    // The export draws no toolbar and no count on an empty bank.
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(main().querySelector('.rk-count')).toBeNull();
  });
});

// ---- Delete --------------------------------------------------------------------------------------

describe('FA-14 — delete a question (“Delete this question?”)', () => {
  const dialogItems = (dialog: HTMLElement) =>
    [...dialog.querySelectorAll('.rk-dlg-list li')].map((item) => text(item));

  it('a used question: what deleting does, named by its words; Cancel changes nothing', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showBank(runtime);
    await table();
    const q101 = await textOf(sample, 'Q-0101');
    await user.click(screen.getByRole('button', { name: `Delete question: ${q101}` }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete this question?' });
    expect(dialog).toHaveAccessibleDescription(q101);
    await waitFor(() =>
      expect(dialogItems(dialog)).toEqual([
        'It leaves your question bank and won’t be offered for new assessments.',
        'Its history is kept.',
        'It is used in Heat Exchanger — post-lab. That assessment keeps its copy, so nothing changes for students.',
      ]),
    );
    expect(dialog.querySelector('.rk-dlg-now h3')).toHaveTextContent('What deleting does');
    // Focus on Cancel (VD-07: a destructive confirmation); the export's gold confirm.
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    expect(within(dialog).getByRole('button', { name: 'Delete question' })).toHaveClass(
      'rb-btn--primary',
    );
    expectNoReference();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(await ids(sample)).toHaveLength(6);
  });

  it('an unused question: it leaves the list, history kept; the message takes focus', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showBank(runtime);
    await table();
    const q103 = await textOf(sample, 'Q-0103');
    await user.click(screen.getByRole('button', { name: `Delete question: ${q103}` }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete this question?' });
    expect(dialogItems(dialog)).toEqual([DELETE_DIALOG.leaves, DELETE_DIALOG.history]);
    await user.click(within(dialog).getByRole('button', { name: 'Delete question' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(await ids(sample)).toEqual(['Q-0101', 'Q-0102', 'Q-0104', 'Q-0105', 'Q-0106']);
    const message = await waitFor(() => document.getElementById('qb-msg')!);
    expect(message).toHaveClass('rk-notice', 'rk-notice--ok');
    expect(message).toHaveAttribute('role', 'status');
    expect(message.querySelector('.rk-notice-t')).toHaveTextContent(
      'Question deleted from your question bank.',
    );
    expect(message.querySelector('.rk-notice-d')).toHaveTextContent('Its history is kept.');
    await waitFor(() => expect(message).toHaveFocus());
    const deleted = screen.getByRole('heading', { level: 3, name: 'Deleted' });
    expect(deleted.closest('[role="region"]')).toHaveClass('fa-deletedbox');
    expect(text(deleted.nextElementSibling)).toMatch(
      /^In a counter-flow exchanger, .* — deleted \d{1,2} [A-Z][a-z]{2} 2026 · history kept$/,
    );
    expect(count()).toBe('5 questions');
    expectNoReference();
    // The one world: the bank no longer lists it; its record (history) is kept, marked deleted.
    expect((await bankOf(sample)).map((row) => row.question.id)).not.toContain('Q-0103');
    const kept = (await bankOf(sample, true)).find((row) => row.question.id === 'Q-0103');
    expect(kept?.question.deleted).not.toBeNull();
  });

  it('a used question deleted: the assessment keeps its copy, and the message says so', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showBank(runtime);
    await table();
    const q101 = await textOf(sample, 'Q-0101');
    await user.click(screen.getByRole('button', { name: `Delete question: ${q101}` }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete this question?' });
    await waitFor(() => expect(dialogItems(dialog)).toHaveLength(3));
    await user.click(within(dialog).getByRole('button', { name: 'Delete question' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(await ids(sample)).not.toContain('Q-0101');
    await waitFor(() =>
      expect(document.getElementById('qb-msg')?.querySelector('.rk-notice-d')).toHaveTextContent(
        'Its history is kept. Heat Exchanger — post-lab keeps its copy, so nothing changes for students.',
      ),
    );
    const view = ok(await faculty(sample).assessments.getAssessment('ASMT-0009' as AssessmentId));
    const pinned = view.questions.find((entry) => entry.ref.questionId === 'Q-0101');
    expect(pinned).toMatchObject({ deletedFromBank: true, ref: { questionVersion: 1 } });
  });

  it('a conflict reads the list again and deletes nothing; a failure keeps the dialog open', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showBank(runtime);
    await table();
    const q105 = await textOf(sample, 'Q-0105');
    await user.click(screen.getByRole('button', { name: `Delete question: ${q105}` }));
    let dialog = await screen.findByRole('dialog', { name: 'Delete this question?' });
    faults(sample).failNext('QuestionBankService.deleteQuestion');
    await user.click(within(dialog).getByRole('button', { name: 'Delete question' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'The question wasn’t deleted. Nothing has changed. Try again.',
    );
    expect(screen.getByRole('dialog', { name: 'Delete this question?' })).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    // Edited elsewhere meanwhile (a new revision): the delete is refused as stale.
    const before = (await bankOf(sample)).find((row) => row.question.id === 'Q-0105')!.question;
    ok(
      await faculty(sample).questionBank.editQuestion({
        id: before.id,
        expectedRev: before.rev,
        experimentId: SHELL as ExperimentId,
        type: 'true-false',
        text: before.text,
        options: {},
        correct: 'false',
        marks: '3',
        explanation: null,
        markingGuidance: null,
      }),
    );
    await user.click(screen.getByRole('button', { name: `Delete question: ${q105}` }));
    dialog = await screen.findByRole('dialog', { name: 'Delete this question?' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete question' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const message = await waitFor(() => document.getElementById('qb-msg')!);
    expect(message).toHaveTextContent('Nothing was deleted. The list has been read again.');
    expect(message).toHaveClass('rk-notice--warn');
    await waitFor(async () => expect((await rows())[4]!.marks).toBe('3 marks'));
    expect((await rows())[4]!.version).toBe('Version 2');
    expect(await ids(sample)).toContain('Q-0105');
  });
});

// ---- Loading, failed ------------------------------------------------------------------------------

describe('FA-14 — loading and failed (state-copy FA-14.loading, FA-14.failed)', () => {
  it('a failed read has Try again, which reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    faults(sample).failNext('QuestionBankService.listQuestions');
    showBank(runtime);
    await bankHeading();
    const title = await screen.findByText(
      'We couldn’t load the question bank',
      {},
      { timeout: 5000 },
    );
    expect(title.closest('.rk-state')).toHaveAttribute('role', 'alert');
    expect(main()).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await ids(sample)).toHaveLength(6);
  });

  it('the loading rows are announced while the list reads', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    renderInTab(<QuestionBank />, {
      runtime,
      navigation: testNavigation('/faculty/question-bank'),
    });
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      'Loading questions…',
    );
    expect(await ids(sample)).toHaveLength(6);
  });

  it('the taught experiments failing fail the page too', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    faults(sample).failNext('AssessmentService.getCreateOptions');
    showBank(runtime);
    expect(
      await screen.findByText('We couldn’t load the question bank', {}, { timeout: 5000 }),
    ).toBeVisible();
  });
});

// ---- FA-15: add a question --------------------------------------------------------------------------

/** Fills the form for one type, as a Faculty member types it. */
async function fill(
  user: ReturnType<typeof userEvent.setup>,
  values: {
    readonly type: 'Multiple choice' | 'True or false' | 'Written answer';
    readonly text: string;
    readonly options?: readonly string[];
    readonly correct?: string;
    readonly guidance?: string;
    readonly marks: string;
    readonly explanation?: string;
  },
) {
  await user.click(screen.getByRole('radio', { name: values.type }));
  await user.type(screen.getByRole('textbox', { name: 'Question' }), values.text);
  for (const [index, option] of (values.options ?? []).entries()) {
    await user.type(screen.getByRole('textbox', { name: `Option ${'ABCD'[index]}` }), option);
  }
  if (values.correct) await user.click(screen.getByRole('radio', { name: values.correct }));
  if (values.guidance)
    await user.type(screen.getByRole('textbox', { name: /Marking guidance/ }), values.guidance);
  await user.type(screen.getByRole('textbox', { name: 'Marks' }), values.marks);
  if (values.explanation)
    await user.type(screen.getByRole('textbox', { name: /Explanation/ }), values.explanation);
}

describe('FA-15 — add a question', () => {
  it('the form as drawn: nothing chosen, the type decides the answer fields; the side panel', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showNew(runtime);
    const found = await form('Add a question');
    expect(found).toHaveClass('rk-surface', 'fa-formcol');
    expect(found.parentElement).toHaveClass('fa-author');
    const h1 = screen.getByRole('heading', { level: 1, name: 'Add a question' });
    expect(h1).toHaveAttribute('tabindex', '-1');
    expect(main().querySelector('.rk-head .rk-eyebrow')).toHaveTextContent(
      `${SHELL_NAME} · ME ZG523`,
    );
    expect(within(crumbs()).getByRole('link', { name: 'Question bank' })).toHaveAttribute(
      'href',
      BANK_ADDRESS,
    );
    expect(crumbs().querySelector('[aria-current="page"]')).toHaveTextContent('Add a question');
    expect(railCurrent()).toHaveAttribute('href', '/faculty/question-bank');
    await waitFor(() => expect(document.title).toMatch(/^Add a question · /));
    const type = screen.getByRole('group', { name: /^Question type/ });
    expect(
      within(type)
        .getAllByRole('radio')
        .map((radio) => text(radio.closest('label')!.querySelector('.rk-choice-t'))),
    ).toEqual(['Multiple choice', 'True or false', 'Written answer']);
    for (const radio of within(type).getAllByRole('radio')) expect(radio).not.toBeChecked();
    expect(
      within(type).getByRole('radio', { name: 'Multiple choice' }),
    ).toHaveAccessibleDescription(
      'One correct answer from up to four options. Marked automatically.',
    );
    expect(type).toHaveTextContent('Three types only.');
    expect(type.querySelector('.rk-choices')).toHaveClass('fa-choices3');
    // No answer fields until a type is chosen: the drawn hint stands in.
    expect(screen.queryByRole('group', { name: /^Answer options/ })).toBeNull();
    expect(found).toHaveTextContent('Choose the question type to set its answer.');
    expect(within(found).getByRole('textbox', { name: 'Marks' })).toHaveAccessibleDescription(
      'A whole number, 1 or more.',
    );
    expect(
      within(found).getByRole('textbox', { name: 'Explanation (optional)' }),
    ).toHaveAccessibleDescription(
      'Shown to students with the correct answer when their result is released.',
    );
    expect(within(found).getByRole('link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      BANK_ADDRESS,
    );
    expect(screen.getByRole('button', { name: 'Save question' })).toHaveClass(
      'rb-btn--primary',
      'rb-btn--lg',
    );
    // Beside the form: this question's facts, and what students see.
    const side = screen.getByRole('complementary', { name: 'This question' });
    expect(side).toHaveTextContent('Used inNot in an assessment yet');
    expect(side.querySelector('dd')).toHaveClass('is-quiet');
    expect(
      within(side).getByRole('heading', { level: 3, name: 'What students see' }),
    ).toBeVisible();
    expect([...side.querySelectorAll('.fa-seelist b')].map((item) => item.textContent)).toEqual([
      'When they take the assessment',
      'When their result is released',
      'Never',
    ]);

    await user.click(screen.getByRole('radio', { name: 'Multiple choice' }));
    expect(found).not.toHaveTextContent('Choose the question type to set its answer.');
    const options = screen.getByRole('group', { name: /^Answer options/ });
    expect(options).toHaveTextContent('Up to four. Mark the one correct answer.');
    expect(
      within(options)
        .getAllByRole('textbox')
        .map((input) => input.id),
    ).toEqual(['qe-o0', 'qe-o1', 'qe-o2', 'qe-o3']);
    expect(
      within(options)
        .getAllByRole('radio')
        .map((radio) => radio.getAttribute('aria-label')),
    ).toEqual([
      'Option A is the correct answer',
      'Option B is the correct answer',
      'Option C is the correct answer',
      'Option D is the correct answer',
    ]);
    await user.click(screen.getByRole('radio', { name: 'True or false' }));
    expect(screen.queryByRole('group', { name: /^Answer options/ })).toBeNull();
    const statement = screen.getByRole('group', { name: 'The statement is' });
    expect(
      within(statement)
        .getAllByRole('radio')
        .map((radio) => radio.closest('label')?.textContent),
    ).toEqual(['True', 'False']);
    // Written: marking guidance, free text, never shown to students.
    await user.click(screen.getByRole('radio', { name: 'Written answer' }));
    expect(
      screen.getByRole('textbox', { name: 'Marking guidance (optional)' }),
    ).toHaveAccessibleDescription(
      'Free text for whoever marks it — what a good answer includes. Students don’t see it.',
    );
    expectNoReference();
  });

  it(
    'adds a question of each type; each is in the bank list on the same platform',
    { timeout: 20_000 },
    async () => {
      // UX-22: a long typed journey; about 6–7 s on a slower Windows laptop. Its limit is stated here
      // rather than raised for every test.
      const user = userEvent.setup();
      const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
      const added: string[] = [];
      const ADDED = new RegExp(`^/faculty/question-bank\\?experimentId=${SHELL}&added=(Q-\\d{4})$`);

      async function save(navigation: ReturnType<typeof showNew>['navigation']) {
        await user.click(screen.getByRole('button', { name: 'Save question' }));
        await waitFor(() => expect(navigation.navigate).toHaveBeenCalledTimes(1));
        const match = ADDED.exec(navigation.navigate.mock.calls[0]![0]);
        expect(match).not.toBeNull();
        added.push(match![1]!);
      }

      const mc = showNew(runtime);
      await form('Add a question');
      await fill(user, {
        type: 'Multiple choice',
        text: 'Which arrangement can bring the cold outlet above the hot outlet?',
        options: ['Counter flow', 'Parallel flow'],
        correct: 'Option A is the correct answer',
        marks: '2',
        explanation: 'Only counter flow lets the cold stream leave hotter than the hot outlet.',
      });
      await save(mc.navigation);
      mc.view.unmount();

      const tf = showNew(runtime);
      await form('Add a question');
      await fill(user, {
        type: 'True or false',
        text: 'Counter flow always needs a larger area than parallel flow for the same duty.',
        correct: 'False',
        marks: '2',
      });
      await save(tf.navigation);
      tf.view.unmount();

      const written = showNew(runtime);
      await form('Add a question');
      await fill(user, {
        type: 'Written answer',
        text: 'Explain how fouling changes the exchanger’s performance.',
        guidance: 'Look for: U falls; the heat duty falls.',
        marks: '10',
      });
      await save(written.navigation);
      written.view.unmount();

      // The one world: the three questions as typed (single correct answer; free-text guidance).
      const [mcId, tfId, writtenId] = added as [string, string, string];
      const bank = await bankOf(sample);
      const byId = (id: string) => bank.find((row) => row.question.id === id)!.question;
      expect(byId(mcId)).toMatchObject({
        marks: 2,
        body: {
          type: 'multiple-choice',
          options: { A: 'Counter flow', B: 'Parallel flow' },
          correct: 'A',
        },
        explanation: 'Only counter flow lets the cold stream leave hotter than the hot outlet.',
      });
      expect(byId(tfId)).toMatchObject({ body: { type: 'true-false', correct: false } });
      expect(byId(writtenId)).toMatchObject({
        marks: 10,
        explanation: null,
        body: { type: 'written', markingGuidance: 'Look for: U falls; the heat duty falls.' },
      });

      // Back on the bank (as FA-15 sends it there): the message, with focus, and the three new rows.
      const { navigation } = showBank(runtime, `?experimentId=${SHELL}&added=${writtenId}`);
      expect(await ids(sample)).toEqual([
        'Q-0101',
        'Q-0102',
        'Q-0103',
        'Q-0104',
        'Q-0105',
        'Q-0106',
        mcId,
        tfId,
        writtenId,
      ]);
      const message = await waitFor(() => document.getElementById('qb-msg')!);
      expect(message.querySelector('.rk-notice-t')).toHaveTextContent(
        'Saved to your question bank.',
      );
      expect(message.querySelector('.rk-notice-d')).toHaveTextContent(
        'It isn’t in any assessment yet.',
      );
      await waitFor(() => expect(message).toHaveFocus());
      expect(navigation.replace).toHaveBeenCalledWith(BANK_ADDRESS);
      const facts = await rows();
      expect(facts.slice(6).map((row) => [row.type, row.marks, row.used])).toEqual([
        ['Multiple choice', '2 marks', 'Not yet'],
        ['True or false', '2 marks', 'Not yet'],
        ['Written answer', '10 marks', 'Not yet'],
      ]);
      expectNoReference();
    },
  );

  it('an `added` that is not a question of this bank says nothing', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showBank(runtime, `?experimentId=${SHELL}&added=Your%20account%20is%20closed`);
    await table();
    expect(document.getElementById('qb-msg')).toBeNull();
    expect(main()).not.toHaveTextContent('Your account is closed');
  });

  it('returnTo: back there with `added=<key>`; Cancel goes there too; anything else is ignored', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const back = `/faculty/assessments/new?step=questions&experimentId=${SHELL}`;
    const { navigation, view } = showNew(
      runtime,
      `?experimentId=${SHELL}&returnTo=${encodeURIComponent(back)}`,
    );
    await form('Add a question');
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', back);
    await fill(user, {
      type: 'True or false',
      text: 'Fouling raises U.',
      correct: 'False',
      marks: '1',
    });
    await user.click(screen.getByRole('button', { name: 'Save question' }));
    await waitFor(() => expect(navigation.navigate).toHaveBeenCalledTimes(1));
    expect(navigation.navigate.mock.calls[0]![0]).toMatch(
      new RegExp(`^${back.replace(/[?]/g, '\\?')}&added=Q-\\d{4}$`),
    );
    view.unmount();

    for (const bad of [
      'https://evil.example/faculty/x',
      '//evil.example/faculty/',
      '/admin/requests',
      '/faculty/../admin',
    ]) {
      const other = showNew(runtime, `?experimentId=${SHELL}&returnTo=${encodeURIComponent(bad)}`);
      await form('Add a question');
      expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', BANK_ADDRESS);
      other.view.unmount();
    }
    expect(safeReturnTo('/faculty/assessments/ASMT-0009/questions')).toBe(
      '/faculty/assessments/ASMT-0009/questions',
    );
    expect(withAdded('/faculty/assessments/ASMT-0009/questions', 'Q-0110')).toBe(
      '/faculty/assessments/ASMT-0009/questions?added=Q-0110',
    );
    expect(withAdded('/faculty/assessments/new?added=Q-0001&step=questions', 'Q-0110')).toBe(
      '/faculty/assessments/new?added=Q-0110&step=questions',
    );
  });

  it('an experiment outside the teaching scope is the in-shell not-found; none taught says so', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { view } = showNew(runtime, `?experimentId=${FIN_TUBE}`);
    expect(await notFoundHeading()).toBeVisible();
    view.unmount();
    const desai = await tabPlatform(DESAI, 'after-flow-c');
    showNew(desai.runtime, '');
    expect(
      await screen.findByRole(
        'heading',
        { level: 2, name: 'Your question bank opens with your first course' },
        { timeout: 5000 },
      ),
    ).toBeVisible();
    expect(screen.queryByRole('form')).toBeNull();
  });

  it('without an address experiment, the first taught one', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showNew(runtime, '');
    await form('Add a question');
    expect(main().querySelector('.rk-head .rk-eyebrow')).toHaveTextContent(SHELL_NAME);
  });

  it('a failure for now keeps every value and says it didn’t save', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { navigation } = showNew(runtime);
    await form('Add a question');
    await fill(user, { type: 'True or false', text: 'U falls.', correct: 'True', marks: '1' });
    faults(sample).failNext('QuestionBankService.addQuestion');
    await user.click(screen.getByRole('button', { name: 'Save question' }));
    const saved = await waitFor(() => document.getElementById('qe-saved')!);
    expect(saved).toHaveTextContent(
      'The question wasn’t saved. Everything you typed is still here — try again.',
    );
    expect(saved).toHaveAttribute('role', 'alert');
    await waitFor(() => expect(saved).toHaveFocus());
    expect(screen.getByRole('textbox', { name: 'Question' })).toHaveValue('U falls.');
    expect(screen.getByRole('radio', { name: 'True' })).toBeChecked();
    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(await bankOf(sample)).toHaveLength(6);
  });
});

// ---- FA-15: validation ------------------------------------------------------------------------------

describe('FA-15 — validation', () => {
  const summary = () => screen.findByRole('alert', {}, { timeout: 5000 });
  const summaryItems = (element: HTMLElement) =>
    within(element)
      .getAllByRole('link')
      .map((link) => [link.textContent, link.getAttribute('href')]);

  it('multiple choice: the summary and errors; typing clears each', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showNew(runtime);
    await form('Add a question');
    await fill(user, {
      type: 'Multiple choice',
      text: 'Which arrangement can bring the cold outlet above the hot outlet?',
      options: ['Counter flow'],
      marks: 'two',
    });
    await user.click(screen.getByRole('button', { name: 'Save question' }));
    const found = await summary();
    expect(found).toHaveClass('rk-errsum');
    expect(found.closest('.fa-fmsg')).toHaveClass('fa-fmsg--stack');
    expect(found.querySelector('.rk-errsum-t')).toHaveTextContent('Check this question');
    expect(summaryItems(found)).toEqual([
      ['Add at least two answer options', '#qe-opts'],
      ['Choose the correct answer', '#qe-c0'],
      ['Enter the marks, as a whole number of 1 or more', '#qe-marks'],
    ]);
    await waitFor(() => expect(found).toHaveFocus());
    const options = screen.getByRole('group', { name: /^Answer options/ });
    expect(options).toHaveClass('is-invalid');
    expect([...options.querySelectorAll('.rk-ferr')].map((error) => error.textContent)).toEqual([
      'Add at least two answer options',
      'Choose the correct answer',
    ]);
    expect(screen.getByRole('textbox', { name: 'Option B' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    const marks = screen.getByRole('textbox', { name: 'Marks' });
    expect(marks).toHaveAttribute('aria-invalid', 'true');
    expect(marks).toHaveAccessibleDescription(
      'A whole number, 1 or more. Enter the marks, as a whole number of 1 or more',
    );
    // The summary link moves focus to its field.
    await user.click(within(found).getByRole('link', { name: /Enter the marks/ }));
    expect(marks).toHaveFocus();
    await user.click(within(found).getByRole('link', { name: 'Choose the correct answer' }));
    expect(screen.getByRole('radio', { name: 'Option A is the correct answer' })).toHaveFocus();
    // Typing clears each field's error; the summary follows.
    await user.clear(marks);
    await user.type(marks, '2');
    expect(summaryItems(await summary())).toHaveLength(2);
    await user.type(screen.getByRole('textbox', { name: 'Option B' }), 'Parallel flow');
    await user.click(screen.getByRole('radio', { name: 'Option A is the correct answer' }));
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('nothing chosen; true or false without its answer; written without marks', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showNew(runtime);
    await form('Add a question');
    await user.click(screen.getByRole('button', { name: 'Save question' }));
    expect(summaryItems(await summary())).toEqual([
      ['Choose the question type', '#qe-type'],
      ['Enter the question', '#qe-text'],
      ['Enter the marks, as a whole number of 1 or more', '#qe-marks'],
    ]);
    const type = screen.getByRole('group', { name: /^Question type/ });
    expect(type).toHaveTextContent('Choose the question type');
    expect(type).toHaveClass('is-invalid');
    await user.click(screen.getByRole('radio', { name: 'True or false' }));
    await user.type(screen.getByRole('textbox', { name: 'Question' }), 'U falls.');
    await user.type(screen.getByRole('textbox', { name: 'Marks' }), '0');
    await user.click(screen.getByRole('button', { name: 'Save question' }));
    await waitFor(async () =>
      expect(summaryItems(await summary())).toEqual([
        ['Choose whether the statement is true or false', '#qe-correct'],
        ['Enter the marks, as a whole number of 1 or more', '#qe-marks'],
      ]),
    );
    expect(screen.getByRole('group', { name: 'The statement is' })).toHaveTextContent(
      'Choose whether the statement is true or false',
    );
    await user.click(screen.getByRole('radio', { name: 'Written answer' }));
    await user.clear(screen.getByRole('textbox', { name: 'Marks' }));
    await user.type(screen.getByRole('textbox', { name: 'Marks' }), '1.5');
    await user.click(screen.getByRole('button', { name: 'Save question' }));
    await waitFor(async () =>
      expect(summaryItems(await summary())).toEqual([
        ['Enter the marks, as a whole number of 1 or more', '#qe-marks'],
      ]),
    );
  });
});

// ---- FA-15: edit a question -----------------------------------------------------------------------

describe('FA-15 — edit a question', () => {
  it('a used question: the notice and the facts; saving makes a new version, the assessment keeps its own', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showEdit(runtime, 'Q-0102');
    const found = await form('Edit question');
    expect(screen.getByRole('heading', { level: 1, name: 'Edit question' })).toBeVisible();
    // A first version: no version line under the title — and never the question's reference.
    expect(main().querySelector('.rk-head .rk-meta')).toBeNull();
    expect(main().querySelector('.rk-head .rk-eyebrow')).toHaveTextContent(
      `${SHELL_NAME} · ME ZG523`,
    );
    expect(crumbs().querySelector('[aria-current="page"]')).toHaveTextContent('Edit question');
    await waitFor(() => expect(document.title).toMatch(/^Edit question · /));
    const notice = main().querySelector('.rk-notice--info')!;
    expect(notice.querySelector('.rk-notice-t')).toHaveTextContent(
      'Used in 1 assessment: Heat Exchanger — post-lab',
    );
    expect(notice).toHaveTextContent(
      'Saving makes a new version in your bank. The assessment keeps the version it has until you choose “Use updated version” on its Questions tab. Earlier submissions are never changed.',
    );
    const side = screen.getByRole('complementary', { name: 'This question' });
    expect(
      [...side.querySelectorAll('.fa-sidedl > div')].map((fact) => [
        text(fact.querySelector('dt')),
        text(fact.querySelector('dd')),
      ]),
    ).toEqual([
      ['Version', 'Version 1'],
      ['Used in', POST_LAB],
      ['Added', expect.stringMatching(/^\d{1,2} [A-Z][a-z]{2} 2026$/)],
    ]);
    // The current version as typed: the type, the question, the options and the one correct answer.
    expect(screen.getByRole('radio', { name: 'Multiple choice' })).toBeChecked();
    expect(screen.getByRole('textbox', { name: 'Question' })).toHaveValue(
      'How is the number of transfer units (NTU) defined?',
    );
    const record = ok(await faculty(sample).questionBank.getQuestion('Q-0102' as QuestionId));
    const body = record.question.body as Extract<Question['body'], { type: 'multiple-choice' }>;
    expect(screen.getByRole('textbox', { name: 'Option A' })).toHaveValue(body.options.A ?? '');
    expect(
      screen.getByRole('radio', { name: `Option ${body.correct} is the correct answer` }),
    ).toBeChecked();
    expect(within(found).getByRole('textbox', { name: 'Marks' })).toHaveValue(
      String(record.question.marks),
    );
    expectNoReference();

    await user.clear(screen.getByRole('textbox', { name: 'Marks' }));
    await user.type(screen.getByRole('textbox', { name: 'Marks' }), '3');
    await user.click(screen.getByRole('button', { name: 'Save question' }));
    const saved = await waitFor(() => document.getElementById('qe-saved')!);
    await waitFor(() =>
      expect(saved.querySelector('.rk-notice-t')).toHaveTextContent('Saved as version 2.'),
    );
    expect(saved.querySelector('.rk-notice-d')).toHaveTextContent(
      'Heat Exchanger — post-lab keeps the version it has until you choose “Use updated version” on its Questions tab. Earlier submissions are never changed.',
    );
    expect(saved).toHaveClass('rk-notice--ok');
    expect(saved).toHaveAttribute('role', 'status');
    await waitFor(() => expect(saved).toHaveFocus());

    // The one world: a new version in the bank; the assessment still pins version 1 and says a newer one exists.
    const now = ok(await faculty(sample).questionBank.getQuestion('Q-0102' as QuestionId));
    expect(now.question).toMatchObject({ version: 2, marks: 3 });
    const view = ok(await faculty(sample).assessments.getAssessment('ASMT-0009' as AssessmentId));
    const pinned = view.questions.find((entry) => entry.ref.questionId === 'Q-0102')!;
    expect(pinned.ref.questionVersion).toBe(1);
    expect(pinned.newerVersion).toBe(2);
    // The page reads the question again: its version under the title and in the facts.
    await waitFor(() =>
      expect(main().querySelector('.rk-head .rk-meta .fa-id')).toHaveTextContent('Version 2'),
    );

    // Saving again sends the new revision (no conflict) and makes version 3.
    await user.clear(screen.getByRole('textbox', { name: 'Marks' }));
    await user.type(screen.getByRole('textbox', { name: 'Marks' }), '2');
    await user.click(screen.getByRole('button', { name: 'Save question' }));
    await waitFor(async () =>
      expect(
        ok(await faculty(sample).questionBank.getQuestion('Q-0102' as QuestionId)).question.version,
      ).toBe(3),
    );
    await waitFor(() =>
      expect(document.getElementById('qe-saved')).toHaveTextContent('Saved as version 3.'),
    );
  });

  it('a question edited from the bank’s Edit: the assessment keeps version 1 with a newer one noted', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showEdit(runtime, 'Q-0101');
    await form('Edit question');
    const question = screen.getByRole('textbox', { name: 'Question' });
    await user.type(question, ' (in words)');
    await user.click(screen.getByRole('button', { name: 'Save question' }));
    await waitFor(() =>
      expect(document.getElementById('qe-saved')).toHaveTextContent(savedUsedLine([POST_LAB])),
    );
    const view = ok(await faculty(sample).assessments.getAssessment('ASMT-0009' as AssessmentId));
    const pinned = view.questions.find((entry) => entry.ref.questionId === 'Q-0101')!;
    expect(pinned).toMatchObject({ ref: { questionVersion: 1 }, newerVersion: 2 });
    expect(pinned.question.text).toMatch(/\(in words\)$/);
  });

  it('an unused question: no notice; “Saved as version 2.”', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showEdit(runtime, 'Q-0105');
    await form('Edit question');
    expect(main().querySelector('.rk-notice--info')).toBeNull();
    expect(
      screen.getByRole('complementary', { name: 'This question' }).querySelectorAll('dd')[1],
    ).toHaveTextContent('Not in an assessment yet');
    expect(screen.getByRole('radio', { name: 'True or false' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Save question' }));
    await waitFor(() =>
      expect(document.getElementById('qe-saved')).toHaveTextContent('Saved as version 2.'),
    );
    expect(document.getElementById('qe-saved')?.querySelector('.rk-notice-d')).toBeNull();
  });

  it('a written question shows its marking guidance', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showEdit(runtime, 'Q-0106');
    await form('Edit question');
    expect(screen.getByRole('radio', { name: 'Written answer' })).toBeChecked();
    expect(screen.getByRole('textbox', { name: 'Marking guidance (optional)' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Marks' })).toHaveValue('10');
  });

  it('a conflict reads the question again and says so; nothing is overwritten', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showEdit(runtime, 'Q-0103');
    await form('Edit question');
    // Edited elsewhere meanwhile.
    const before = ok(await faculty(sample).questionBank.getQuestion('Q-0103' as QuestionId));
    const body = before.question.body as Extract<Question['body'], { type: 'multiple-choice' }>;
    ok(
      await faculty(sample).questionBank.editQuestion({
        id: before.question.id,
        expectedRev: before.question.rev,
        experimentId: SHELL as ExperimentId,
        type: 'multiple-choice',
        text: 'Changed elsewhere',
        options: body.options,
        correct: body.correct,
        marks: '4',
        explanation: null,
        markingGuidance: null,
      }),
    );
    await user.clear(screen.getByRole('textbox', { name: 'Marks' }));
    await user.type(screen.getByRole('textbox', { name: 'Marks' }), '9');
    await user.click(screen.getByRole('button', { name: 'Save question' }));
    const warning = await screen.findByText(
      'This question changed while you were editing it. Its latest version is shown — make your change again.',
    );
    expect(warning.closest('.rk-notice')).toHaveClass('rk-notice--warn');
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Question' })).toHaveValue('Changed elsewhere'),
    );
    expect(screen.getByRole('textbox', { name: 'Marks' })).toHaveValue('4');
    expect(
      ok(await faculty(sample).questionBank.getQuestion('Q-0103' as QuestionId)).question.marks,
    ).toBe(4);
  });

  it('a colleague’s question: a notice, no form (an undecided rule)', async () => {
    const world = await fixtureWorld('after-flow-c');
    const question = world.records.questions['Q-0103'] as Question;
    const { runtime } = await worldPlatform(RANGANATHAN, {
      ...world,
      records: {
        ...world.records,
        questions: {
          ...world.records.questions,
          'Q-0103': {
            ...question,
            addedBy: { ...question.addedBy, personId: DESAI } as Question['addedBy'],
          },
        },
      },
    });
    showEdit(runtime, 'Q-0103');
    expect(
      await screen.findByText(
        'A colleague added this question. Whether you can change it hasn’t been decided yet, so it can’t be edited here.',
        {},
        { timeout: 5000 },
      ),
    ).toBeVisible();
    expect(screen.queryByRole('form')).toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: 'Edit question' })).toBeVisible();
  });

  it('a deleted question says so, with no form', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const q = ok(await faculty(sample).questionBank.getQuestion('Q-0105' as QuestionId));
    ok(
      await faculty(sample).questionBank.deleteQuestion({
        id: q.question.id,
        expectedRev: q.question.rev,
      }),
    );
    showEdit(runtime, 'Q-0105');
    expect(
      await screen.findByText(
        'This question was deleted from your question bank. Its history is kept, so it can’t be edited.',
        {},
        { timeout: 5000 },
      ),
    ).toBeVisible();
    expect(screen.queryByRole('form')).toBeNull();
  });

  it('an unknown question, or another person’s workspace record, is the in-shell not-found', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showEdit(runtime, 'Q-9999');
    expect(await notFoundHeading()).toBeVisible();
  });

  it('returnTo after an edit: back there, without `added`', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    const back = '/faculty/assessments/ASMT-0009/questions';
    const { navigation } = showEdit(runtime, 'Q-0104', `?returnTo=${encodeURIComponent(back)}`);
    await form('Edit question');
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', back);
    await user.click(screen.getByRole('button', { name: 'Save question' }));
    await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith(back));
  });
});

// ---- The words are the export's; the register and the ledger -------------------------------------

/** The export's text with tags removed and `&amp;` read, then its raw markup and script. */
function words(file: string): string {
  const raw = faExport(file);
  const plain = raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
  return `${plain}\n${raw}`;
}

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('FA-14 / FA-15 words (FA-v1 Main.dc.html)', () => {
  const MAIN = words('Main.dc.html');

  it.each([
    ...strings(QUESTION_BANK),
    ...strings(DELETE_DIALOG),
    ...strings(ADDED_MESSAGE),
    DELETED_MESSAGE,
    ...strings(QUESTION_TYPE_LINES),
    ...strings(QUESTION_EDITOR).filter(
      (value) =>
        value !== QUESTION_EDITOR.usedNotice && value !== QUESTION_EDITOR.usedNoticeSeveral,
    ),
  ])('“%s” is in the export', (phrase) => {
    expect(MAIN).toContain(phrase);
  });

  it('the composed words follow the export’s formulas with the records’ values', () => {
    expect(bankLead(SHELL_NAME, 'ME ZG523')).toBe(
      `Your questions for ${SHELL_NAME} · ME ZG523. Drafts stay apart until you review them.`,
    );
    expect(MAIN).toContain(`'Your questions for '`);
    expect(MAIN).toContain(`'. Drafts stay apart until you review them.'`);
    expect(questionCount(6)).toBe('6 questions');
    expect(questionCount(6, 1)).toBe('1 of 6 questions');
    expect(MAIN).toContain(`rows.length + ' of ' + this.plural(live.length, 'question')`);
    expect(typeSplitWords({ multipleChoice: 3, trueFalse: 2, written: 1 })).toBe(
      '3 multiple choice · 2 true or false · 1 written answer',
    );
    expect(MAIN).toContain(`' true or false'`);
    expect(MAIN).toContain(`this.plural(c.w, 'written answer')`);
    expect(editLabel('Why?')).toBe('Edit question: Why?');
    expect(deleteLabel('Why?')).toBe('Delete question: Why?');
    expect(MAIN).toContain(`'Edit question: ' + v.t`);
    expect(MAIN).toContain(`'Delete question: ' + v.t`);
    expect(searchChipWords('ntu')).toBe('Search: “ntu”');
    expect(MAIN).toContain(`'Search: “' + b.q.trim() + '”'`);
    expect(typeChipWords('True or false')).toBe('Type: True or false');
    expect(MAIN).toContain(`'Type: ' + Component.TYPES[b.type]`);
    expect(removeFilterLabel('Type: True or false')).toBe('Remove filter Type: True or false');
    expect(MAIN).toContain(`'Remove filter ' + c.label`);
    expect(marksWords(1)).toBe('1 mark');
    expect(marksWords(10)).toBe('10 marks');
    expect(versionWords(2)).toBe('Version 2');
    expect(MAIN).toContain(`'Version ' + q.v.length`);
    expect(addedOnWords('20 Oct 2026')).toBe('added 20 Oct 2026');
    expect(MAIN).toContain('added {{ r.added }}');
    expect(usedWords(0, null)).toBe('Not yet');
    expect(usedWords(1, [POST_LAB])).toBe(POST_LAB);
    expect(usedWords(2, null)).toBe('2 assessments');
    expect(deletedRowWords('Why?', '7 Nov 2026')).toBe('Why? — deleted 7 Nov 2026 · history kept');
    expect(MAIN).toContain(`'deleted ' + q.deleted + ' · history kept'`);
    expect(deleteUsedWords([POST_LAB], 1)).toBe(
      `It is used in ${POST_LAB}. That assessment keeps its copy, so nothing changes for students.`,
    );
    expect(MAIN).toContain(`'It is used in ' + this.names(use.cur) + '. '`);
    expect(MAIN).toContain(`'Those assessments keep their copy'`);
    expect(MAIN).toContain(`', so nothing changes for students.'`);
    expect(deletedLine([POST_LAB])).toBe(
      `Its history is kept. ${POST_LAB} keeps its copy, so nothing changes for students.`,
    );
    expect(MAIN).toContain(`' keeps its copy, so nothing changes for students.'`);
    expect(deletedLine(null)).toBe('Its history is kept.');
    expect(experimentContext(SHELL_NAME, 'ME ZG523')).toBe(`${SHELL_NAME} · ME ZG523`);
    expect(MAIN).toContain(`ctx: e ? e.t + ' · ' + cr.code`);
    expect(usedNoticeTitle([POST_LAB])).toBe(`Used in 1 assessment: ${POST_LAB}`);
    expect(MAIN).toContain(`'Used in ' + this.plural(use.cur.length, 'assessment') + ': '`);
    expect(QUESTION_EDITOR.usedNotice).toBe(
      [
        'Saving makes a new version in your bank. ',
        'The assessment keeps the version it has until you choose “Use updated version” on its Questions tab. ',
        'Earlier submissions are never changed.',
      ].join(''),
    );
    for (const piece of [
      'Saving makes a new version in your bank. ',
      'The assessment keeps the version it has until you choose “Use updated version” on its Questions tab. ',
      'Earlier submissions are never changed.',
    ]) {
      expect(MAIN).toContain(piece);
    }
    expect(versionFactWords(2)).toBe('Version 2 — earlier versions are kept');
    expect(versionFactWords(1)).toBe('Version 1');
    expect(MAIN).toContain(`' — earlier versions are kept'`);
    expect(addedFactWords('20 Oct 2026', true)).toBe('20 Oct 2026 · from a draft you reviewed');
    expect(MAIN).toContain(`' · from a draft you reviewed'`);
    expect(savedVersionWords(2)).toBe('Saved as version 2.');
    expect(MAIN).toContain(`'Saved as version ' + q.v.length + '.'`);
    expect(savedUsedLine([POST_LAB])).toBe(
      `${POST_LAB} keeps the version it has until you choose “Use updated version” on its Questions tab. Earlier submissions are never changed.`,
    );
  });

  it('the type words stay the product’s “Multiple choice” (the export’s “Single choice” is not adopted)', () => {
    expect(MAIN).toContain('Single choice');
    expect(strings(QUESTION_BANK).join(' ')).not.toMatch(/single choice/i);
    expect(typeSplitWords({ multipleChoice: 1, trueFalse: 0, written: 0 })).toBe(
      '1 multiple choice',
    );
  });

  it('no phrase names a question or an assessment by its reference', () => {
    for (const phrase of [
      ...strings(QUESTION_BANK),
      ...strings(QUESTION_EDITOR),
      ...strings(DELETE_DIALOG),
      ...strings(ADDED_MESSAGE),
      DELETED_MESSAGE,
    ]) {
      expect(phrase).not.toMatch(REFERENCE);
    }
  });

  it('the undrawn words and rules are provisional entries of the one register', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_QUESTION_BANK)) {
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
      expect(['FA-14', 'FA-15']).toContain(entry.screen);
      expect(entry.status).toBe('provisional');
      if (entry.words) {
        expect(entry.words).not.toMatch(/\b(?:OD|T|PC|DEV|VD|ND|P1)-\d/);
        expect(entry.words).not.toMatch(REFERENCE);
      }
    }
  });

  it('the ledger: one primary per page; drafting, importing and the tabs are built', () => {
    const primaries = P4_QUESTION_BANK_LINK_TARGETS.filter((entry) => entry.role === 'primary');
    expect(primaries.map((entry) => `${entry.screen} ${entry.on} ${entry.action}`)).toEqual([
      'FA-14 /faculty/question-bank Add a question',
      'FA-15 /faculty/question-bank/new Save question',
      'FA-15 /faculty/question-bank/{questionId} Save question',
    ]);
    expect(
      P4_QUESTION_BANK_LINK_TARGETS.filter((entry) => entry.outcome === 'not-rendered'),
    ).toEqual([]);
    expect(
      P4_QUESTION_BANK_LINK_TARGETS.filter((entry) =>
        ['Draft with assistance', 'Import', 'Questions', 'Drafts to review'].includes(entry.action),
      ).map((entry) => `${entry.where} ${entry.action} → ${entry.target}`),
    ).toEqual([
      'Header Draft with assistance → /faculty/question-bank/draft?experimentId={experimentId}',
      'Header Import → /faculty/question-bank/import?experimentId={experimentId}',
      'Tabs Questions → /faculty/question-bank?experimentId={experimentId}',
      'Tabs Drafts to review → /faculty/question-bank?tab=drafts&experimentId={experimentId}',
    ]);
  });
});

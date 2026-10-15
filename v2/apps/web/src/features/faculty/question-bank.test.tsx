/**
 * FA-14 Question bank and FA-15 Add / edit question (board B4-07 f0 … f9) on the real composition
 * root and the sample world. After Flow C the bank holds Q-0101 … Q-0106 for Shell-and-Tube; after
 * Flow D four of them are used by ASMT-0009 "Heat Exchanger — post-lab". The one world moves both
 * pages: a question added through the form is in the bank list; an edit of a used question makes
 * a new version while the assessment keeps the version it pinned (`newerVersion` set); a deleted
 * question leaves the list with its history kept. The service's drawn validation words for each
 * type; the `returnTo` + `added=` protocol FA-07 and FA-09 rely on; the undrawn loading, failed,
 * no-match, no-experiment, colleague's question (an undecided rule), conflict and not-found
 * states. Drafting with assistance and importing are not rendered (FA-16, FA-17 not built).
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AssessmentId, ExperimentId, Question, QuestionId } from '@xr/domain';
import { asPersonId, faults, fixtureWorld } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  DELETE_DIALOG,
  QUESTION_BANK,
  QUESTION_EDITOR,
  savedUsedMessage,
  usedNoticeTitle,
} from '@/copy/question-bank';
import { STATE_COPY } from '@/copy/state-copy';
import { STATE_COPY_QUESTION_BANK } from '@/copy/state-copy-question-bank';
import { P4_QUESTION_BANK_LINK_TARGETS } from '@/nav/link-targets-p4/question-bank';
import type { PlatformRuntime } from '@/platform/runtime';
import { board } from '@/test-support/boards';
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
const count = () => text(main().querySelector('.xr-section-head [role="status"]'));
const form = (name: string) => screen.findByRole('form', { name }, { timeout: 5000 });

/** The table's rows as their cells' text. */
async function rows(): Promise<string[][]> {
  const found = await table();
  return [...found.querySelectorAll('tbody tr')].map((row) =>
    [...row.querySelectorAll('td')].map((cell) => text(cell)),
  );
}

async function ids(): Promise<string[]> {
  return (await rows()).map((cells) => /Q-\d{4}/.exec(cells[0]!)?.[0] ?? '');
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

// ---- f0, f9: the bank -----------------------------------------------------------------------

describe('FA-14 — the bank (B4-07 f0, f9)', () => {
  it('the header, the Questions section, the toolbar and each question with its use', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showBank(runtime);
    await bankHeading();
    await table();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(main().querySelector('.xr-phead-meta .xl-meta')).toHaveTextContent(
      `Questions for ${SHELL_NAME} · ME ZG523`,
    );
    expect(screen.getByRole('link', { name: 'Add a question' })).toHaveAttribute(
      'href',
      `/faculty/question-bank/new?experimentId=${SHELL}`,
    );
    expect(screen.getByRole('link', { name: 'Add a question' })).toHaveClass('xr-btn--primary');
    // FA-16 and FA-17 are not built: no "Draft with assistance", no "Import", no tab strip.
    expect(screen.queryByText('Draft with assistance')).toBeNull();
    expect(screen.queryByText('Import')).toBeNull();
    expect(screen.queryByText('Drafts to review')).toBeNull();
    expect(main().querySelector('nav.xr-tabs')).toBeNull();
    // The shell: Question bank current; the top bar reads "Question bank".
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Question bank');
    expect(
      screen
        .getByRole('navigation', { name: 'Faculty navigation' })
        .querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', '/faculty/question-bank');

    const section = screen.getByRole('region', { name: 'Questions' });
    expect(within(section).getByRole('searchbox', { name: 'Search questions' })).toHaveAttribute(
      'placeholder',
      'Words or question ID',
    );
    const experiment = within(section).getByRole('combobox', { name: 'Experiment' });
    expect(
      within(experiment)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual([SHELL_NAME]);
    const type = within(section).getByRole('combobox', { name: 'Type' });
    expect(
      within(type)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['All types', 'Multiple choice', 'True or false', 'Written answer']);
    expect(type.closest('.xr-field')).toHaveClass('xr-filter-2');

    const found = await table();
    expect([...found.querySelectorAll('th')].map((cell) => text(cell))).toEqual([
      'Question',
      'Type',
      'Marks',
      'Used',
      'Added',
      'Actions',
    ]);
    const cells = await rows();
    expect(cells.map((row) => row.slice(1, 4))).toEqual([
      ['Multiple choice', '2', 'Used in 1 assessment'],
      ['Multiple choice', '2', 'Used in 1 assessment'],
      ['Multiple choice', '2', 'Not used yet'],
      ['True or false', '2', 'Used in 1 assessment'],
      ['True or false', '2', 'Not used yet'],
      ['Written answer', '10', 'Used in 1 assessment'],
    ]);
    expect(cells[0]![0]).toMatch(/^What does the effectiveness .* compare\?\s?Q-0101$/);
    expect(cells[0]![4]).toMatch(/^\d{1,2} [A-Z][a-z]{2} 2026$/);
    expect(count()).toBe('6 questions');
    // Each row: the question (strong) with its ID (`xa-qrow-meta` › `xr-id`), the type tag, Edit and Delete.
    const first = found.querySelector('tbody tr')!;
    expect(first.querySelector('td strong')).toHaveClass('text-ink');
    expect(first.querySelector('.xa-qrow-meta .xr-id')).toHaveTextContent('Q-0101');
    expect(first.querySelector('.xa-tag')).toHaveTextContent('Multiple choice');
    expect(first.querySelector('td.xl-num')).toHaveTextContent('2');
    expect(within(first as HTMLElement).getByRole('link', { name: 'Edit Q-0101' })).toHaveAttribute(
      'href',
      '/faculty/question-bank/Q-0101',
    );
    expect(within(first as HTMLElement).getByRole('button', { name: 'Delete Q-0101' })).toHaveClass(
      'xr-btn--text',
    );
  });

  it('search and type filter at once; no match says so and clears', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showBank(runtime);
    await table();
    await user.type(screen.getByRole('searchbox', { name: 'Search questions' }), 'ntu');
    expect(await ids()).toEqual(['Q-0102']);
    expect(count()).toBe('1 question');
    await user.clear(screen.getByRole('searchbox', { name: 'Search questions' }));
    await user.type(screen.getByRole('searchbox', { name: 'Search questions' }), 'q-0105');
    expect(await ids()).toEqual(['Q-0105']);
    await user.clear(screen.getByRole('searchbox', { name: 'Search questions' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Type' }), 'True or false');
    expect(await ids()).toEqual(['Q-0104', 'Q-0105']);
    await user.type(screen.getByRole('searchbox', { name: 'Search questions' }), 'NTU');
    expect(screen.queryByRole('table')).toBeNull();
    expect(main()).toHaveTextContent('No question matches.');
    expect(count()).toBe('0 questions');
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(await ids()).toHaveLength(6);
    expect(screen.getByRole('combobox', { name: 'Type' })).toHaveValue('all');
  });

  it('the Experiment filter lists the taught experiments and replaces the address', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { navigation } = showBank(runtime, `?experimentId=${SHELL}`);
    await table();
    const experiment = screen.getByRole('combobox', { name: 'Experiment' });
    expect(experiment).toHaveValue(SHELL);
    await user.selectOptions(experiment, SHELL);
    expect(navigation.replace).toHaveBeenLastCalledWith(BANK_ADDRESS);
  });

  it('an experiment outside the teaching scope is the in-shell not-found', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showBank(runtime, '?experimentId=fin-tube-bundle');
    expect(await notFoundHeading()).toBeVisible();
  });

  it('no experiment taught yet: the undrawn empty state, no “Add a question”', async () => {
    const { runtime } = await tabPlatform(DESAI, 'after-flow-c');
    showBank(runtime);
    await bankHeading();
    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: 'Your Institute Admin hasn’t assigned you courses yet',
      }),
    ).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Add a question' })).toBeNull();
    expect(screen.queryByRole('searchbox')).toBeNull();
  });
});

// ---- f7: the empty bank -----------------------------------------------------------------------

describe('FA-14 — the empty bank (B4-07 f7)', () => {
  it('“Your question bank is empty” with “Add a question” (no Import)', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-b');
    showBank(runtime);
    const title = await screen.findByRole(
      'heading',
      { level: 3, name: 'Your question bank is empty' },
      { timeout: 5000 },
    );
    const empty = title.closest('.xr-empty') as HTMLElement;
    expect(empty).toHaveTextContent(
      'Add a question. Questions stay here until you use them in an assessment.',
    );
    expect(within(empty).getByRole('link', { name: 'Add a question' })).toHaveAttribute(
      'href',
      `/faculty/question-bank/new?experimentId=${SHELL}`,
    );
    expect(within(empty).queryByText('Import')).toBeNull();
    expect(count()).toBe('0 questions');
    expect(screen.getByRole('searchbox', { name: 'Search questions' })).toBeVisible();
  });
});

// ---- f2: delete (DL-1) -------------------------------------------------------------------------

describe('FA-14 — delete a question (B4-07 f2, DL-1)', () => {
  it('a used question: the drawn words; Cancel changes nothing', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showBank(runtime);
    await table();
    await user.click(screen.getByRole('button', { name: 'Delete Q-0101' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete Q-0101?' });
    await waitFor(() => expect(within(dialog).getByText(new RegExp(POST_LAB))).toBeVisible());
    expect([...dialog.querySelectorAll('.xr-dialog-body p')].map((p) => text(p))).toEqual([
      'It leaves your question bank and won’t be offered for new assessments. Its history is kept.',
      'It is used in Heat Exchanger — post-lab. That assessment keeps its copy, so nothing changes for students.',
    ]);
    expect(dialog.querySelector('.xr-dialog-body strong')).toHaveTextContent(
      'It is used in Heat Exchanger — post-lab.',
    );
    // Destructive DL-1: focus on Cancel (board 10, VD-07); the confirm is the red button.
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    expect(within(dialog).getByRole('button', { name: 'Delete question' })).toHaveClass(
      'xr-btn--danger',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(await ids()).toHaveLength(6);
  });

  it('an unused question: it leaves the list, history kept; the message takes focus', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showBank(runtime);
    await table();
    await user.click(screen.getByRole('button', { name: 'Delete Q-0103' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete Q-0103?' });
    expect(text(dialog.querySelector('.xr-dialog-body'))).toBe(DELETE_DIALOG.effect);
    await user.click(within(dialog).getByRole('button', { name: 'Delete question' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(await ids()).toEqual(['Q-0101', 'Q-0102', 'Q-0104', 'Q-0105', 'Q-0106']);
    const message = document.getElementById('qb-msg')!;
    expect(message).toHaveTextContent(
      'Q-0103 deleted from your question bank. Its history is kept.',
    );
    await waitFor(() => expect(message).toHaveFocus());
    expect(message.querySelector('p.xa-save.is-ok[role="status"]')).not.toBeNull();
    const deleted = screen.getByRole('heading', { level: 3, name: 'Deleted' });
    expect(text(deleted.nextElementSibling)).toMatch(
      /^Q-0103 In a counter-flow exchanger, .* — deleted \d{1,2} [A-Z][a-z]{2} 2026 · history kept$/,
    );
    expect(count()).toBe('5 questions');
    // The one world: the bank no longer lists it; its record (history) is kept, marked deleted.
    expect((await bankOf(sample)).map((row) => row.question.id)).not.toContain('Q-0103');
    const kept = (await bankOf(sample, true)).find((row) => row.question.id === 'Q-0103');
    expect(kept?.question.deleted).not.toBeNull();
  });

  it('a used question deleted: the assessment keeps its copy', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showBank(runtime);
    await table();
    await user.click(screen.getByRole('button', { name: 'Delete Q-0101' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete Q-0101?' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete question' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(await ids()).not.toContain('Q-0101');
    const view = ok(await faculty(sample).assessments.getAssessment('ASMT-0009' as AssessmentId));
    const pinned = view.questions.find((entry) => entry.ref.questionId === 'Q-0101');
    expect(pinned).toMatchObject({ deletedFromBank: true, ref: { questionVersion: 1 } });
  });

  it('a conflict reads the list again and deletes nothing; a failure keeps the dialog open', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showBank(runtime);
    await table();
    await user.click(screen.getByRole('button', { name: 'Delete Q-0105' }));
    let dialog = await screen.findByRole('dialog', { name: 'Delete Q-0105?' });
    faults(sample).failNext('QuestionBankService.deleteQuestion');
    await user.click(within(dialog).getByRole('button', { name: 'Delete question' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'The question wasn’t deleted. Nothing has changed. Try again.',
    );
    expect(screen.getByRole('dialog', { name: 'Delete Q-0105?' })).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    // Edited elsewhere meanwhile (a new revision): the delete is refused as stale.
    const q105 = (await bankOf(sample)).find((row) => row.question.id === 'Q-0105')!.question;
    ok(
      await faculty(sample).questionBank.editQuestion({
        id: q105.id,
        expectedRev: q105.rev,
        experimentId: SHELL as ExperimentId,
        type: 'true-false',
        text: q105.text,
        options: {},
        correct: 'false',
        marks: '3',
        explanation: null,
        markingGuidance: null,
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Delete Q-0105' }));
    dialog = await screen.findByRole('dialog', { name: 'Delete Q-0105?' });
    await user.click(within(dialog).getByRole('button', { name: 'Delete question' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const message = document.getElementById('qb-msg')!;
    expect(message).toHaveTextContent('Nothing was deleted. The list has been read again.');
    expect(message.querySelector('.xa-save.is-err')).not.toBeNull();
    await waitFor(async () => expect((await rows())[4]![2]).toBe('3'));
    expect(await ids()).toContain('Q-0105');
  });
});

// ---- Undrawn: loading, failed ----------------------------------------------------------------

describe('FA-14 — loading and failed (undrawn; state-copy FA-14.loading, FA-14.failed)', () => {
  it('announces loading; a failed read has Try again, which reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    faults(sample).failNext('QuestionBankService.listQuestions');
    showBank(runtime);
    await bankHeading();
    expect(
      await screen.findByRole(
        'heading',
        { level: 3, name: 'We couldn’t load the question bank' },
        { timeout: 5000 },
      ),
    ).toBeVisible();
    expect(main()).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await ids()).toHaveLength(6);
  });

  it('the loading rows are announced while the list reads', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    renderInTab(<QuestionBank />, {
      runtime,
      navigation: testNavigation('/faculty/question-bank'),
    });
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      'Loading questions',
    );
    expect(await ids()).toHaveLength(6);
  });

  it('the taught experiments failing fail the page too', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    faults(sample).failNext('AssessmentService.getCreateOptions');
    showBank(runtime);
    expect(
      await screen.findByRole(
        'heading',
        { level: 3, name: 'We couldn’t load the question bank' },
        { timeout: 5000 },
      ),
    ).toBeVisible();
  });
});

// ---- f3, f5, f8: add a question ------------------------------------------------------------------

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

describe('FA-15 — add a question (B4-07 f3, f5, f8)', () => {
  it('the form as drawn: nothing chosen, the type decides the answer fields', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showNew(runtime);
    const found = await form('Add a question');
    expect(screen.getByRole('heading', { level: 1, name: 'Add a question' })).toBeVisible();
    expect(main().querySelector('.xr-overline')).toHaveTextContent(SHELL_NAME);
    expect(within(main()).getByRole('link', { name: 'Question bank' })).toHaveAttribute(
      'href',
      BANK_ADDRESS,
    );
    expect(main().querySelector('a.xr-back')).toHaveTextContent('Question bank');
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Add a question');
    expect(
      screen
        .getByRole('navigation', { name: 'Faculty navigation' })
        .querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', '/faculty/question-bank');
    const type = screen.getByRole('group', { name: 'Question type' });
    expect(
      within(type)
        .getAllByRole('radio')
        .map((radio) => radio.closest('label')?.textContent),
    ).toEqual(['Multiple choice', 'True or false', 'Written answer']);
    for (const radio of within(type).getAllByRole('radio')) expect(radio).not.toBeChecked();
    expect(type).toHaveTextContent('Three types only.');
    // f3: no answer fields until a type is chosen.
    expect(screen.queryByRole('group', { name: 'Answer options' })).toBeNull();
    expect(within(found).getByRole('textbox', { name: 'Marks' })).toHaveAccessibleDescription(
      'A whole number.',
    );
    expect(
      within(found).getByRole('textbox', { name: 'Explanation (optional)' }),
    ).toHaveAccessibleDescription(
      'Shown to students with the correct answer when their result is released.',
    );
    expect(screen.getByRole('link', { name: 'Cancel' })).toHaveAttribute('href', BANK_ADDRESS);
    expect(screen.getByRole('button', { name: 'Save question' })).toHaveClass('xr-btn--primary');

    await user.click(screen.getByRole('radio', { name: 'Multiple choice' }));
    const options = screen.getByRole('group', { name: 'Answer options' });
    expect(options).toHaveTextContent('Up to four; mark the one correct answer.');
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
    expect(screen.queryByRole('group', { name: 'Answer options' })).toBeNull();
    const statement = screen.getByRole('group', { name: 'The statement is' });
    expect(
      within(statement)
        .getAllByRole('radio')
        .map((radio) => radio.closest('label')?.textContent),
    ).toEqual(['True', 'False']);
    // f5: written — marking guidance, free text, never shown to students while they answer.
    await user.click(screen.getByRole('radio', { name: 'Written answer' }));
    expect(
      screen.getByRole('textbox', { name: 'Marking guidance (optional)' }),
    ).toHaveAccessibleDescription(
      'Free text for whoever marks it — what a good answer includes. Students don’t see it while they answer.',
    );
  });

  it('adds a question of each type; each is in the bank list on the same platform', async () => {
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

    // Back on the bank (as FA-15 sends it there): the message and the three new rows.
    const { navigation } = showBank(runtime, `?experimentId=${SHELL}&added=${writtenId}`);
    expect(await ids()).toEqual([
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
    expect(document.getElementById('qb-msg')).toHaveTextContent(
      `Saved to your question bank as ${writtenId}.`,
    );
    expect(navigation.replace).toHaveBeenCalledWith(BANK_ADDRESS);
    expect((await rows())[8]!.slice(1, 4)).toEqual(['Written answer', '10', 'Not used yet']);
    expect((await rows())[6]!.slice(1, 4)).toEqual(['Multiple choice', '2', 'Not used yet']);
    expect((await rows())[7]!.slice(1, 4)).toEqual(['True or false', '2', 'Not used yet']);
  });

  it('an `added` that is not a question of this bank says nothing', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showBank(runtime, `?experimentId=${SHELL}&added=Your%20account%20is%20closed`);
    await table();
    expect(document.getElementById('qb-msg')).toBeEmptyDOMElement();
  });

  it('returnTo: back there with `added=<ID>`; Cancel goes there too; anything else is ignored', async () => {
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
    const { view } = showNew(runtime, '?experimentId=fin-tube-bundle');
    expect(await notFoundHeading()).toBeVisible();
    view.unmount();
    const desai = await tabPlatform(DESAI, 'after-flow-c');
    showNew(desai.runtime, '');
    expect(
      await screen.findByRole(
        'heading',
        { level: 2, name: 'Your Institute Admin hasn’t assigned you courses yet' },
        { timeout: 5000 },
      ),
    ).toBeVisible();
    expect(screen.queryByRole('form')).toBeNull();
  });

  it('without an address experiment, the first taught one', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    showNew(runtime, '');
    await form('Add a question');
    expect(main().querySelector('.xr-overline')).toHaveTextContent(SHELL_NAME);
  });

  it('a failure for now keeps every value and says it didn’t save', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const { navigation } = showNew(runtime);
    await form('Add a question');
    await fill(user, { type: 'True or false', text: 'U falls.', correct: 'True', marks: '1' });
    faults(sample).failNext('QuestionBankService.addQuestion');
    await user.click(screen.getByRole('button', { name: 'Save question' }));
    const saved = document.getElementById('qe-saved')!;
    await waitFor(() =>
      expect(saved).toHaveTextContent(
        'The question wasn’t saved. Everything you typed is still here — try again.',
      ),
    );
    await waitFor(() => expect(saved).toHaveFocus());
    expect(screen.getByRole('textbox', { name: 'Question' })).toHaveValue('U falls.');
    expect(screen.getByRole('radio', { name: 'True' })).toBeChecked();
    expect(navigation.navigate).not.toHaveBeenCalled();
    expect(await bankOf(sample)).toHaveLength(6);
  });
});

// ---- f6: validation ----------------------------------------------------------------------------

describe('FA-15 — validation (B4-07 f6)', () => {
  const summary = () => screen.findByRole('alert', {}, { timeout: 5000 });
  const summaryItems = (element: HTMLElement) =>
    within(element)
      .getAllByRole('link')
      .map((link) => [link.textContent, link.getAttribute('href')]);

  it('multiple choice: the drawn summary and errors; typing clears each', async () => {
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
    expect(found).toHaveClass('xw-errsum');
    expect(within(found).getByText('Check this question').tagName).toBe('STRONG');
    expect(summaryItems(found)).toEqual([
      ['Add at least two answer options', '#qe-opts'],
      ['Choose the correct answer', '#qe-correct'],
      ['Enter the marks, as a whole number of 1 or more', '#qe-marks'],
    ]);
    await waitFor(() => expect(found).toHaveFocus());
    const options = screen.getByRole('group', { name: 'Answer options' });
    expect([...options.querySelectorAll('.xr-error')].map((error) => error.textContent)).toEqual([
      'Add at least two answer options',
      'Choose the correct answer',
    ]);
    const marks = screen.getByRole('textbox', { name: 'Marks' });
    expect(marks).toHaveAttribute('aria-invalid', 'true');
    expect(marks).toHaveAccessibleDescription(
      'A whole number. Enter the marks, as a whole number of 1 or more',
    );
    // The summary link moves focus to its field.
    await user.click(within(found).getByRole('link', { name: /Enter the marks/ }));
    expect(marks).toHaveFocus();
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
    expect(screen.getByRole('group', { name: 'Question type' })).toHaveTextContent(
      'Choose the question type',
    );
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

// ---- f4: edit a used question --------------------------------------------------------------------

describe('FA-15 — edit a question (B4-07 f4)', () => {
  it('a used question: the drawn notice; saving makes a new version, the assessment keeps its own', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showEdit(runtime, 'Q-0102');
    const found = await form('Edit question');
    expect(screen.getByRole('heading', { level: 1, name: 'Edit question' })).toBeVisible();
    expect(main().querySelector('.xr-phead-meta .xr-id')).toHaveTextContent('Q-0102');
    expect(main().querySelector('.xr-overline')).toHaveTextContent(SHELL_NAME);
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Edit question');
    const notice = main().querySelector('.xr-notice--warn')!;
    expect(notice.querySelector('.xr-notice-title')).toHaveTextContent(
      'Used in 1 assessment: Heat Exchanger — post-lab',
    );
    expect(notice).toHaveTextContent(
      'Saving makes a new version in your bank. The assessment keeps the version it has until you choose “Use updated version” on its Questions tab. Earlier submissions are never changed.',
    );
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

    await user.clear(screen.getByRole('textbox', { name: 'Marks' }));
    await user.type(screen.getByRole('textbox', { name: 'Marks' }), '3');
    await user.click(screen.getByRole('button', { name: 'Save question' }));
    const saved = document.getElementById('qe-saved')!;
    await waitFor(() =>
      expect(saved).toHaveTextContent(
        'Saved as a new version. Heat Exchanger — post-lab keeps the version it has until you choose “Use updated version” there.',
      ),
    );
    expect(saved.querySelector('.xr-notice--ok[role="status"] .xr-notice-title')).not.toBeNull();
    await waitFor(() => expect(saved).toHaveFocus());

    // The one world: a new version in the bank; ASMT-0009 still pins version 1 and says a newer one exists.
    const now = ok(await faculty(sample).questionBank.getQuestion('Q-0102' as QuestionId));
    expect(now.question).toMatchObject({ version: 2, marks: 3 });
    const view = ok(await faculty(sample).assessments.getAssessment('ASMT-0009' as AssessmentId));
    const pinned = view.questions.find((entry) => entry.ref.questionId === 'Q-0102')!;
    expect(pinned.ref.questionVersion).toBe(1);
    expect(pinned.newerVersion).toBe(2);

    // Saving again sends the new revision (no conflict) and makes version 3.
    await user.clear(screen.getByRole('textbox', { name: 'Marks' }));
    await user.type(screen.getByRole('textbox', { name: 'Marks' }), '2');
    await user.click(screen.getByRole('button', { name: 'Save question' }));
    await waitFor(async () =>
      expect(
        ok(await faculty(sample).questionBank.getQuestion('Q-0102' as QuestionId)).question.version,
      ).toBe(3),
    );
  });

  it('Q-0101 edited from the bank’s Edit: the assessment keeps version 1 with a newer one noted', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showEdit(runtime, 'Q-0101');
    await form('Edit question');
    const question = screen.getByRole('textbox', { name: 'Question' });
    await user.type(question, ' (in words)');
    await user.click(screen.getByRole('button', { name: 'Save question' }));
    await waitFor(() =>
      expect(document.getElementById('qe-saved')).toHaveTextContent(savedUsedMessage([POST_LAB])),
    );
    const view = ok(await faculty(sample).assessments.getAssessment('ASMT-0009' as AssessmentId));
    const pinned = view.questions.find((entry) => entry.ref.questionId === 'Q-0101')!;
    expect(pinned).toMatchObject({ ref: { questionVersion: 1 }, newerVersion: 2 });
    expect(pinned.question.text).toMatch(/\(in words\)$/);
  });

  it('an unused question: no notice; “Saved as a new version.”', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showEdit(runtime, 'Q-0105');
    await form('Edit question');
    expect(main().querySelector('.xr-notice--warn')).toBeNull();
    expect(screen.getByRole('radio', { name: 'True or false' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Save question' }));
    await waitFor(() =>
      expect(document.getElementById('qe-saved')).toHaveTextContent('Saved as a new version.'),
    );
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
    expect(
      await screen.findByText(
        'This question changed while you were editing it. Its latest version is shown — make your change again.',
      ),
    ).toBeVisible();
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Question' })).toHaveValue('Changed elsewhere'),
    );
    expect(screen.getByRole('textbox', { name: 'Marks' })).toHaveValue('4');
    expect(
      ok(await faculty(sample).questionBank.getQuestion('Q-0103' as QuestionId)).question.marks,
    ).toBe(4);
  });

  it('a colleague’s question: a plain message, no form (an undecided rule)', async () => {
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

// ---- The words are B4-07's; the register and the ledger ------------------------------------------

/** A board's text with tags removed and `&amp;` read, then its raw markup. */
function words(file: string): string {
  const raw = board(file);
  const plain = raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');
  return `${plain}\n${raw}`;
}

describe('FA-14 / FA-15 words (B4-07)', () => {
  const B4_07 = words('B4-07-Question-Bank-and-Editor.dc.html');

  it.each([
    ...Object.values(QUESTION_BANK).filter((value) => typeof value === 'string'),
    ...Object.values(QUESTION_BANK.columns),
    ...Object.values(DELETE_DIALOG),
    ...Object.values(QUESTION_EDITOR).filter(
      (value) => value !== QUESTION_EDITOR.usedNoticeSeveral,
    ),
  ])('“%s” is on B4-07', (phrase) => {
    expect(B4_07).toContain(phrase);
  });

  it('the composed words follow the board with its own sample values', () => {
    expect(B4_07).toContain(usedNoticeTitle([POST_LAB]));
    expect(B4_07).toContain('Saved as a new version. ');
    expect(B4_07).toContain('Saved to your question bank as ');
    expect(B4_07).toContain(' deleted from your question bank. Its history is kept.');
  });

  it('the undrawn words and rules are provisional entries of the one register', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_QUESTION_BANK)) {
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
      expect(['FA-14', 'FA-15']).toContain(entry.screen);
      expect(entry.status).toBe('provisional');
      if (entry.words) expect(entry.words).not.toMatch(/\b(?:OD|T|PC|DEV|VD|ND|P1)-\d/);
    }
  });

  it('the ledger: one primary per page; the unbuilt actions are not rendered and say why', () => {
    const primaries = P4_QUESTION_BANK_LINK_TARGETS.filter((entry) => entry.role === 'primary');
    expect(primaries.map((entry) => `${entry.screen} ${entry.on} ${entry.action}`)).toEqual([
      'FA-14 /faculty/question-bank Add a question',
      'FA-15 /faculty/question-bank/new Save question',
      'FA-15 /faculty/question-bank/{questionId} Save question',
    ]);
    const hidden = P4_QUESTION_BANK_LINK_TARGETS.filter(
      (entry) => entry.outcome === 'not-rendered',
    );
    expect(hidden.map((entry) => entry.action)).toEqual([
      'Draft with assistance',
      'Import',
      'Drafts to review',
      'Import',
    ]);
    for (const entry of hidden) expect(entry.note).toMatch(/FA-1[67] .* is not built/);
  });
});

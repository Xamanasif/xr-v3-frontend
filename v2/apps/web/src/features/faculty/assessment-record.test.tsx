/**
 * FA-08 Assessment · Summary and FA-09 Assessment · Questions in the V3 Refined B design (FA-v1
 * `Main.dc.html` "FA-08 Summary", "FA-09 Questions"; earlier board B4-05 f0 … f8) on the real
 * composition root and the sample world, as Dr S. Ranganathan (per-0014). After Flow D, ASMT-0009
 * "Heat Exchanger — post-lab" is Ready with four questions and Rahul's released attempt: every
 * change to its questions makes a new version, and the Summary then says so (f4). After Flow C a
 * draft created through the assessments port shows the draft Summary (f3) and the empty Questions
 * tab (f1). The questions are shown as the assessment PINS them: a bank edit made through
 * `questionBank.editQuestion` shows "A newer version …" until "Use updated version" pins it; a
 * question deleted through `deleteQuestion` keeps its copy (f2). Remove, Add (through the bank
 * panel, f7), a move and "Use updated version" all reach the one world: the record and the tab
 * strip's Questions count change. Refusals re-read the record; nothing is written.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Result, ServiceError } from '@xr/contracts/draft';
import type { AssessmentId, ExperimentId, QuestionId } from '@xr/domain';
import { asPersonId, faults } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { QUESTIONS_WORDS, SUMMARY_WORDS } from '@/copy/assessment-record';
import { SUMMARY_ACTIONS } from '@/copy/submissions';
import { ASSESSMENT_QUESTIONS_EMPTY_LINE } from '@/copy/question-tools';
import { STATE_COPY, type StateCopyEntry, stateWords } from '@/copy/state-copy';
import type { PlatformRuntime } from '@/platform/runtime';
import { faExport } from '@/test-support/boards';
import {
  PERSON_OF_ROLE,
  renderInTab,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { AssessmentSummary } from './fa-08-assessment-summary/assessment-summary';
import { AssessmentQuestions } from './fa-09-assessment-questions/assessment-questions';

afterEach(() => {
  forgetLastAddress();
});

const RANGANATHAN = PERSON_OF_ROLE.faculty;
const DESAI = 'per-0015';
const ASMT = 'ASMT-0009';
const NAME = 'Heat Exchanger — post-lab';
const SHELL = 'shell-and-tube-heat-exchanger';
const SHELL_NAME = 'Shell-and-Tube Heat Exchanger';
const GODAVARI = 'Godavari Institute of Technology';

/** The export's text with tags removed, and its source (the script's words). */
const EXPORT_RAW = faExport('Main.dc.html');
const EXPORT = `${EXPORT_RAW.replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')}\n${EXPORT_RAW}`;

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

function show(runtime: PlatformRuntime, path: string, page: ReactNode, search = '') {
  const navigation = testNavigation(path, search);
  const view = renderInTab(
    <WorkspaceLayout workspace="faculty">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

const showSummary = (runtime: PlatformRuntime, id = ASMT) =>
  show(runtime, `/faculty/assessments/${id}`, <AssessmentSummary assessmentId={id} />);

const showQuestions = (runtime: PlatformRuntime, id = ASMT, search = '') =>
  show(
    runtime,
    `/faculty/assessments/${id}/questions`,
    <AssessmentQuestions assessmentId={id} />,
    search,
  );

const main = () => screen.getByRole('main');
const region = (name: string) => screen.getByRole('region', { name });
const questionsRegion = () => screen.findByRole('region', { name: QUESTIONS_WORDS.title });
const panel = () => screen.queryByRole('complementary', { name: QUESTIONS_WORDS.panelTitle });
const submissionsPanel = () =>
  screen.getByRole('complementary', { name: SUMMARY_WORDS.submissionsTitle });
const message = () => document.getElementById('questions-msg')!;
const tabs = () => screen.getByRole('navigation', { name: `${NAME} sections` });

/** An element's words without what only screen readers read (`span.xr-sr`). */
function shown(element: Element | null): string {
  if (!element) return '';
  const copy = element.cloneNode(true) as HTMLElement;
  for (const hidden of copy.querySelectorAll('.xr-sr')) hidden.remove();
  return copy.textContent ?? '';
}

/** The rows of "Questions in order": number, words, type and marks. */
function rowsOf(section: HTMLElement): string[][] {
  return [...section.querySelectorAll('ol.fa-qlist > li.fa-q')].map((row) => [
    row.querySelector('.fa-qn')?.textContent ?? '',
    shown(row.querySelector('.fa-qt')),
    row.querySelector('.fa-qmeta')?.textContent ?? '',
  ]);
}

/** The record tabs' Questions count (`span.fa-tabn`). */
function questionsCount(): string | null {
  return (
    within(tabs())
      .getByRole('link', { name: /^Questions/ })
      .querySelector('.fa-tabn')?.textContent ?? null
  );
}

async function record(runtime: PlatformRuntime, id = ASMT) {
  const answer = await runtime.ports.assessments.getAssessment(id as AssessmentId);
  if (!answer.ok) throw new Error(`getAssessment ${answer.error.kind}`);
  return answer.value;
}

/** A port command as the tab's own person, then its receipt refreshes the tab (as a command does). */
async function viaPort<T, E extends ServiceError>(
  runtime: PlatformRuntime,
  send: () => Promise<Result<T, E>>,
  refresh = true,
): Promise<T> {
  let value: T | null = null;
  await act(async () => {
    const answer = await send();
    if (!answer.ok) throw new Error(`refused: ${answer.error.kind}`);
    value = answer.value;
    if (refresh) await runtime.invalidate(answer.changed);
  });
  return value as T;
}

const RULES = {
  passMarkPercent: '50',
  attemptsAllowed: '2',
  deadline: '2026-11-14T23:59:00+05:30',
  releaseOption: 'after-deadline' as const,
  releaseDate: null,
};
const NO_RULES = {
  passMarkPercent: '',
  attemptsAllowed: '',
  deadline: '',
  releaseOption: null,
  releaseDate: null,
};

/** After Flow C: an assessment of Shell-and-Tube created through the port (FA-07). */
async function createOnC(
  runtime: PlatformRuntime,
  options: {
    readonly mode: 'create' | 'save-as-draft';
    readonly rules?: typeof RULES | typeof NO_RULES;
    readonly questions?: readonly string[];
  },
): Promise<string> {
  const created = await viaPort(runtime, () =>
    runtime.ports.assessments.createAssessment({
      mode: options.mode,
      experimentId: SHELL as ExperimentId,
      name: NAME,
      introduction: null,
      rules: options.rules ?? RULES,
      questions: (options.questions ?? []).map((id) => id as QuestionId),
    }),
  );
  return created.id;
}

/** A bank edit through `questionBank.editQuestion`: the same question with new words. */
async function editText(runtime: PlatformRuntime, id: string, text: string) {
  const current = await runtime.ports.questionBank.getQuestion(id as QuestionId);
  if (!current.ok) throw new Error(current.error.kind);
  const question = current.value.question;
  return viaPort(runtime, () =>
    runtime.ports.questionBank.editQuestion({
      id: question.id,
      experimentId: question.experimentId,
      type: question.body.type,
      text,
      options: question.body.type === 'multiple-choice' ? question.body.options : {},
      correct:
        question.body.type === 'multiple-choice'
          ? question.body.correct
          : question.body.type === 'true-false'
            ? String(question.body.correct)
            : null,
      marks: String(question.marks),
      explanation: question.explanation,
      markingGuidance: question.body.type === 'written' ? question.body.markingGuidance : null,
      expectedRev: question.rev,
    }),
  );
}

const Q0101 = 'What does the effectiveness (ε) of a heat exchanger compare?';
const Q0102 = 'How is the number of transfer units (NTU) defined?';
const Q0103 = 'In a counter-flow exchanger, what can happen that cannot happen in parallel flow?';
const Q0104 = 'Fouling on the tube surfaces lowers the overall heat transfer coefficient U.';
const Q0105 =
  'For the same inlet conditions and UA, parallel flow transfers more heat than counter flow.';
const Q0106 =
  'Explain how fouling changes the exchanger’s performance, using what you observed in the simulation.';

/** The four questions in order, named by their words (never their references). */
const ROWS = [
  ['1', Q0101, 'Multiple choice2 marks'],
  ['2', Q0102, 'Multiple choice2 marks'],
  ['3', Q0104, 'True or false2 marks'],
  ['4', Q0106, 'Written answer10 marks'],
];

// ---- The drawn words ---------------------------------------------------------------------------

describe('FA-v1 words (FA-08, FA-09)', () => {
  it('every drawn word of the copy module is in the export; every undrawn one is provisional', () => {
    for (const words of [
      ...Object.values(SUMMARY_WORDS),
      ...Object.values(QUESTIONS_WORDS),
      ...Object.values(SUMMARY_ACTIONS),
    ]) {
      expect(EXPORT, words).toContain(words);
    }
    for (const [id, entry] of (Object.entries(STATE_COPY) as [string, StateCopyEntry][]).filter(
      ([key]) => /^FA-0[89]\./.test(key),
    )) {
      expect(entry.status, id).toBe('provisional');
      expect(entry.decisions?.length, id).toBeGreaterThan(0);
      // Decision ids never appear in the words a person reads.
      if (entry.words) expect(entry.words, id).not.toMatch(/\b(?:OD|T|PC|DEV|VD|M)-?\d/);
    }
  });
});

// ---- FA-08 Summary -----------------------------------------------------------------------------

describe('FA-08 Summary — Ready with a submission', () => {
  it('the record band and tabs, readiness, checklist, rules, reach and the Submissions panel', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSummary(runtime);
    const ready = await screen.findByRole('region', { name: SUMMARY_WORDS.readyTitle });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: NAME })).toBeVisible();
    // The crumbs name the assessment by its name; the tab title names the tab.
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(crumbs).getByRole('link', { name: 'Assessments' })).toHaveAttribute(
      'href',
      '/faculty/assessments',
    );
    expect(crumbs.querySelector('[aria-current="page"]')).toHaveTextContent(NAME);
    await waitFor(() => expect(document.title).toMatch(/^Summary · /));
    // The record band: the course code and experiment, the readiness and the figures.
    const band = main().querySelector('header.fa-cid.fa-rec')!;
    expect(band.querySelector('.fa-cid-eyebrow')).toHaveTextContent(`ME ZG523${SHELL_NAME}`);
    expect(band.querySelector('.fa-rec-meta .xr-st--ok')).toHaveTextContent('Ready');
    expect(
      [...band.querySelectorAll('.fa-fig')].map((figure) => [
        figure.querySelector('dt')?.textContent,
        figure.querySelector('dd')?.textContent,
      ]),
    ).toEqual([
      ['14 Nov 2026, 23:59', 'Deadline passed'],
      ['Students submitted', '1 of 1'],
      ['Questions · 16 marks', '4'],
    ]);
    expect(tabs().querySelector('[aria-current="page"]')).toHaveTextContent('Summary');
    expect([...tabs().querySelectorAll('a')].map((tab) => shown(tab))).toEqual([
      'Summary',
      'Questions4',
      'Settings',
      'Preview',
      'Submissions1',
    ]);
    expect(questionsCount()).toBe('4');

    expect(ready).toHaveTextContent(`Students who have ${SHELL_NAME} can see and start it.`);
    const items = [...ready.querySelectorAll('ul.fa-check > li')];
    expect(items.map((item) => item.textContent)).toEqual([
      'Name and introduction',
      'Rules set for this assessment',
      '4 questions · 16 marks',
    ]);
    expect(items.every((item) => item.classList.contains('is-ok'))).toBe(true);
    expect(within(ready).queryByRole('link')).toBeNull();

    // The one Student it reaches has submitted; nothing waits.
    const submissions = submissionsPanel();
    expect(submissions.querySelector('.rk-panel-head .fa-ph-note')).toBeNull();
    expect(submissions.querySelector('.fa-panel-lead')).toHaveTextContent(
      'Nothing is waiting for marking.',
    );
    expect(submissions).toHaveTextContent(
      'Students have submitted. If you change the questions or rules now, that makes a new version — earlier submissions keep theirs.',
    );
    // Phase 4B: nothing waits, so no "Mark next" (`FA-08.mark-next`); "See submissions" opens
    // FA-12, as the record's Submissions tab does.
    expect(within(submissions).queryByRole('link', { name: 'Mark next' })).toBeNull();
    expect(within(submissions).getByRole('link', { name: 'See submissions' })).toHaveAttribute(
      'href',
      `/faculty/assessments/${ASMT}/submissions`,
    );

    expect(region(SUMMARY_WORDS.reachTitle).querySelector('p.rk-next')).toHaveTextContent(
      `1 student who has ${SHELL_NAME} from ${GODAVARI}. Formats don’t change who it reaches: one assessment covers the experiment, whichever format a student used.`,
    );
    expect(region(SUMMARY_WORDS.reachTitle)).toHaveTextContent(
      'Reach follows Student access, set by the Institute Admin.',
    );

    const rules = region(SUMMARY_WORDS.rulesTitle);
    const pairs = [...rules.querySelectorAll('dl.fa-rules dt')].map((term) => [
      term.textContent,
      term.nextElementSibling?.textContent,
    ]);
    expect(pairs).toEqual([
      ['Pass mark', '50% · 8 of 16 marks'],
      ['Attempts allowed', '2'],
      ['Deadline', '14 Nov 2026, 23:59'],
      ['Result and answers', 'After the deadline'],
      ['Time limit', 'None'],
    ]);
    expect(rules.querySelector('.fa-introbox')).toHaveTextContent(
      'Introduction students read firstNone',
    );
    expect(rules.querySelector('.fa-introtext')).toHaveClass('is-quiet');
    expect(rules.querySelector('p.rk-hint')).toHaveTextContent(
      'Created 27 Oct 2026, 10:00 by you · ready since 27 Oct 2026, 10:00',
    );
    expect(within(rules).getByRole('link', { name: 'Change settings' })).toHaveAttribute(
      'href',
      `/faculty/assessments/${ASMT}/settings`,
    );
    // No release control, no availability lifecycle (T-18).
    expect(
      within(main()).queryByRole('button', { name: /release|publish|make available/i }),
    ).toBeNull();
    expectNoReferences();
  });

  it('a rule changed after the submission makes version 2, and the Summary says so', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    const before = await record(runtime);
    const saved = await viaPort(runtime, () =>
      runtime.ports.assessments.updateSettings({
        id: ASMT as AssessmentId,
        name: NAME,
        introduction: null,
        rules: { ...RULES, attemptsAllowed: '3' },
        expectedRev: before.assessment.rev,
      }),
    );
    expect(saved.newVersion).toBe(true);
    showSummary(runtime);
    const versions = await screen.findByRole('region', { name: SUMMARY_WORDS.versionsTitle });
    const notice = versions.querySelector('.rk-notice.rk-notice--info')!;
    expect(notice.querySelector('.rk-notice-t')).toHaveTextContent(
      /^Version 2 since 15 Nov 2026, \d{2}:\d{2}$/,
    );
    // Whose submission keeps which version, once the submissions are read.
    await waitFor(() =>
      expect(notice.querySelector('.rk-notice-d')).toHaveTextContent(
        'You changed a rule after students submitted. Rahul Verma’s submission keeps version 1; new attempts use version 2.',
      ),
    );
    expect(document.querySelector('.fa-rec-meta')).toHaveTextContent('ReadyVersion 2');
    // Nobody has submitted version 2: a change applies to it.
    expect(submissionsPanel()).toHaveTextContent(
      'Earlier submissions keep the version they answered.',
    );
    expect(region(SUMMARY_WORDS.rulesTitle)).toHaveTextContent('Attempts allowed3');
    expect(region(SUMMARY_WORDS.rulesTitle).querySelector('p.rk-hint')).toHaveTextContent(
      /· version 2 since 15 Nov 2026, \d{2}:\d{2}$/,
    );
    expectNoReferences();
  });
});

describe('FA-08 Summary — a written answer waiting for marking', () => {
  it('Rahul submits in the same world: the waiting list, oldest first, and Mark next', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const id = await createOnC(runtime, { mode: 'create', questions: ['Q-0106'] });
    // Rahul Verma (per-0002), who has Shell-and-Tube, answers and submits through his own ports.
    const rahul = asPersonId(sample, 'per-0002');
    const started = await rahul.assessments.startAttempt(id as AssessmentId);
    if (!started.ok) throw new Error(`startAttempt ${started.error.kind}`);
    const saved = await rahul.assessments.saveAnswer({
      attemptId: started.value.id,
      questionId: 'Q-0106' as QuestionId,
      answer: { type: 'written', text: 'Fouling adds a thermal resistance, so U falls.' },
      expectedRev: started.value.rev,
    });
    if (!saved.ok) throw new Error(`saveAnswer ${saved.error.kind}`);
    await viaPort(runtime, () =>
      rahul.assessments.submitAttempt({
        attemptId: saved.value.id,
        expectedRev: saved.value.rev,
      }),
    );

    showSummary(runtime, id);
    await screen.findByRole('region', { name: SUMMARY_WORDS.readyTitle });
    const submissions = submissionsPanel();
    expect(submissions.querySelector('.fa-ph-note')).toHaveTextContent('Oldest first');
    expect(submissions.querySelector('p.rk-pending')).toHaveTextContent(
      '1 written answer waiting for marking',
    );
    const waiting = await within(submissions).findByRole('list', {
      name: 'Waiting for marking, oldest first',
    });
    expect([...waiting.querySelectorAll('li')].map((item) => item.textContent)).toEqual([
      expect.stringMatching(/^Rahul Verma\d{1,2} \w{3}, \d{2}:\d{2}$/),
    ]);
    expect(submissions).toHaveTextContent(
      'Students have submitted. If you change the questions or rules now, that makes a new version — earlier submissions keep theirs.',
    );
    // The band's meta reads the same figure, as a link to Marking for this assessment.
    expect(
      within(document.querySelector('.fa-rec-meta') as HTMLElement).getByRole('link', {
        name: '1 waiting for marking',
      }),
    ).toHaveAttribute('href', expect.stringMatching(/^\/faculty\/marking/));
    // Phase 4B: "Mark next" opens FA-19 for the oldest waiting submission.
    const markNext = within(submissions).getByRole('link', { name: 'Mark next' });
    expect(markNext).toHaveClass('rb-btn--primary', 'rk-go');
    await waitFor(() =>
      expect(markNext).toHaveAttribute('href', `/faculty/marking/${saved.value.id}`),
    );
    expectNoReferences();
  });
});

describe('FA-08 Summary — drafts', () => {
  it('a draft with every rule and no question: "At least one question — none yet" and Add questions', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const id = await createOnC(runtime, { mode: 'save-as-draft' });
    showSummary(runtime, id);
    const ready = await screen.findByRole('region', { name: SUMMARY_WORDS.draftTitle });
    expect(document.querySelector('.fa-rec-meta .xr-st')).toHaveTextContent('Draft — not ready');
    expect(ready).toHaveTextContent('Students can’t see a draft. It needs at least one question.');
    const items = [...ready.querySelectorAll('ul.fa-check > li')];
    expect(items.map((item) => [item.textContent, item.className])).toEqual([
      ['Name and introduction', 'is-ok'],
      ['Rules set for this assessment', 'is-ok'],
      ['At least one question — none yet', 'is-no'],
    ]);
    const add = within(ready).getByRole('link', { name: 'Add questions' });
    expect(add).toHaveClass('rb-btn', 'rb-btn--primary');
    expect(add).toHaveAttribute('href', `/faculty/assessments/${id}/questions`);
    expect(questionsCount()).toBe('0');
    // No submission yet: the Submissions tab has no count; the panel says why.
    expect(within(tabs()).getByRole('link', { name: 'Submissions' })).toBeVisible();
    expect(submissionsPanel()).toHaveTextContent(
      'Students can’t see a draft, so no one can submit yet.',
    );
    expect(submissionsPanel().querySelector('.fa-panel-lead')).toBeNull();
    // The band: the deadline as set (not counted down while a draft), no questions yet.
    expect(
      [...document.querySelectorAll('.fa-rec .fa-fig')].map((figure) => figure.textContent),
    ).toEqual(['Deadline14 Nov 2026, 23:59', 'QuestionsNone yet']);
    // Never Ready: "not ready yet"; with no question the pass mark has no marks yet.
    expect(region(SUMMARY_WORDS.rulesTitle).querySelector('p.rk-hint')).toHaveTextContent(
      /^Created 27 Oct 2026, 10:00 by you · not ready yet$/,
    );
    expect(region(SUMMARY_WORDS.rulesTitle)).toHaveTextContent('Pass mark50%Attempts');
    expectNoReferences();
  });

  it('a draft saved with its name only: every rule "Not set yet", nothing pre-filled', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const id = await createOnC(runtime, { mode: 'save-as-draft', rules: NO_RULES });
    showSummary(runtime, id);
    const ready = await screen.findByRole('region', { name: SUMMARY_WORDS.draftTitle });
    expect(ready).toHaveTextContent('Students can’t see a draft. It needs at least one question.');
    expect([...ready.querySelectorAll('ul.fa-check > li')][1]).toHaveTextContent(
      'Rules — not finished',
    );
    const dd = [...region(SUMMARY_WORDS.rulesTitle).querySelectorAll('dl.fa-rules dd')];
    expect(dd.map((value) => [value.textContent, value.className])).toEqual([
      ['Not set yet', 'is-quiet'],
      ['Not set yet', 'is-quiet'],
      ['Not set yet', 'is-quiet'],
      ['Not chosen yet', 'is-quiet'],
      ['None', ''],
    ]);
    expect(document.querySelector('.fa-rec .fa-fig')).toHaveTextContent('DeadlineNot set yet');
  });
});

describe('FA-08 Summary — undrawn states', () => {
  it('announces loading; a failed read has Try again, which reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    faults(sample).failNext('AssessmentService.getAssessment');
    // The page alone (the workspace frame first waits for the session with its own "Loading …").
    renderInTab(<AssessmentSummary assessmentId={ASMT} />, {
      runtime,
      navigation: testNavigation(`/faculty/assessments/${ASMT}`),
    });
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      stateWords('FA-shared.record-loading'),
    );
    expect(await screen.findByText(stateWords('FA-shared.record-failed'))).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('region', { name: SUMMARY_WORDS.readyTitle })).toBeVisible();
  });

  it('an unknown assessment, or one outside the teaching scope, is the in-shell not-found', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSummary(runtime, 'ASMT-9999');
    expect(await screen.findByRole('heading', { name: 'We can’t find that page' })).toBeVisible();
  });

  it('Dr Anita Desai (no course mapped) cannot open ASMT-0009', async () => {
    const { runtime } = await tabPlatform(DESAI, 'after-flow-d');
    showSummary(runtime);
    expect(await screen.findByRole('heading', { name: 'We can’t find that page' })).toBeVisible();
    expect(screen.queryByText(NAME)).toBeNull();
  });
});

// ---- FA-09 Questions ---------------------------------------------------------------------------

describe('FA-09 Questions — the list', () => {
  it('the pinned questions in order with their marks, named by their words, and only the built actions', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showQuestions(runtime);
    const section = await questionsRegion();
    expect(screen.getByRole('heading', { level: 1, name: NAME })).toBeVisible();
    await waitFor(() => expect(document.title).toMatch(/^Questions · /));
    expect(section.querySelector('.fa-qhead [role="status"]')).toHaveTextContent(
      '4 questions · 16 marks',
    );
    expect(section.querySelector('.fa-qhead .rk-hint')).toHaveTextContent(
      '3 marked automatically · 1 written answer you mark',
    );
    expect(rowsOf(section)).toEqual(ROWS);
    // A screen reader hears each question's place before its words.
    expect(section.querySelector('li.fa-q .fa-qt .xr-sr')).toHaveTextContent('Question 1:');
    expect(section.querySelector('li.fa-q:last-child .fa-qtype')).toHaveClass('fa-qtype--w');

    const add = within(section).getByRole('button', { name: 'Add from question bank' });
    expect(add).toHaveClass('rb-btn');
    const newQuestion = within(section).getByRole('link', { name: 'New question' });
    expect(newQuestion).toHaveAttribute(
      'href',
      `/faculty/question-bank/new?experimentId=${SHELL}&returnTo=%2Ffaculty%2Fassessments%2F${ASMT}%2Fquestions`,
    );
    // Phase 4B: the text links to FA-16 and FA-17, for the assessment's experiment.
    const draft = within(section).getByRole('link', { name: 'Draft with assistance' });
    expect(draft).toHaveClass('rb-link');
    expect(draft).toHaveAttribute('href', `/faculty/question-bank/draft?experimentId=${SHELL}`);
    expect(within(section).getByRole('link', { name: 'Import' })).toHaveAttribute(
      'href',
      `/faculty/question-bank/import?experimentId=${SHELL}`,
    );

    expect(screen.getByRole('button', { name: 'Move question 1 up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move question 4 down' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move question 2 up' })).toBeEnabled();
    expect(screen.getByRole('group', { name: 'Order of question 2' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Remove question 3 from this assessment' }),
    ).toHaveTextContent('Remove');
    expect(section).toHaveTextContent(
      'Removing takes a question off this assessment. It stays in your question bank — removing is not deleting.',
    );
    // Rahul has submitted this version: the page says so before any change.
    expect(await within(section).findByText(/^Rahul Verma has submitted\./)).toHaveTextContent(
      'Rahul Verma has submitted. If you change the questions now, that makes a new version — their submissions keep theirs.',
    );
    expect(panel()).toBeNull();
    expectNoReferences();
  });
});

describe('FA-09 Questions — Remove and Add back through the bank panel', () => {
  it('changes the record, the count and the tab strip, with a new version after the submission', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showQuestions(runtime);
    const section = await questionsRegion();
    await within(section).findByText(/^Rahul Verma has submitted\./);

    await user.click(
      screen.getByRole('button', { name: 'Remove question 2 from this assessment' }),
    );
    expect(
      await within(section).findByText(
        'Question removed from this assessment. It is still in your question bank.',
      ),
    ).toBeVisible();
    await waitFor(() => expect(document.activeElement).toBe(message()));
    expect(message()).toHaveClass('rk-notice', 'rk-notice--ok');
    expect(message()).toHaveAttribute('role', 'status');
    expect(rowsOf(section).map((row) => row[1])).toEqual([Q0101, Q0104, Q0106]);
    expect(section.querySelector('.fa-qhead [role="status"]')).toHaveTextContent(
      '3 questions · 14 marks',
    );
    expect(questionsCount()).toBe('3');
    // Rahul has submitted: the change made version 2, and his submission keeps version 1.
    await waitFor(() =>
      expect(message().querySelector('.rk-notice-d')).toHaveTextContent(
        'This made version 2. Rahul Verma’s submission keeps version 1; new attempts use version 2.',
      ),
    );
    let now = await record(runtime);
    expect(now.assessment.version).toBe(2);
    expect(now.assessment.questions.map((ref) => ref.questionId)).toEqual([
      'Q-0101',
      'Q-0104',
      'Q-0106',
    ]);

    // The panel lists the bank questions not in the assessment; its title takes focus.
    await user.click(screen.getByRole('button', { name: 'Add from question bank' }));
    const aside = await screen.findByRole('complementary', { name: 'From your question bank' });
    await waitFor(() =>
      expect(document.activeElement).toBe(
        within(aside).getByRole('heading', { name: 'From your question bank' }),
      ),
    );
    expect(screen.queryByRole('button', { name: 'Add from question bank' })).toBeNull();
    expect(main().querySelector('.rk-detail')).toContainElement(aside);
    expect(aside).toHaveTextContent(`${SHELL_NAME} · not in this assessment`);
    await waitFor(() =>
      expect(
        [...aside.querySelectorAll('li')].map((item) => [
          item.querySelector('.fa-avail-t')?.textContent,
          item.querySelector('.fa-qm')?.textContent,
        ]),
      ).toEqual([
        [Q0102, 'Multiple choice · 2 marks'],
        [Q0103, 'Multiple choice · 2 marks'],
        [Q0105, 'True or false · 2 marks'],
      ]),
    );
    await user.click(
      within(aside).getByRole('button', { name: `Add to this assessment: ${Q0102}` }),
    );
    expect(await within(section).findByText('Added as question 4.')).toBeVisible();
    expect(questionsCount()).toBe('4');
    expect(rowsOf(section).at(-1)).toEqual(['4', Q0102, 'Multiple choice2 marks']);
    await waitFor(() =>
      expect(
        within(aside).queryByRole('button', { name: `Add to this assessment: ${Q0102}` }),
      ).toBeNull(),
    );
    now = await record(runtime);
    expect(now.assessment.questions.map((ref) => ref.questionId)).toEqual([
      'Q-0101',
      'Q-0104',
      'Q-0106',
      'Q-0102',
    ]);
    // Still version 2: nobody has submitted against it — the line says nothing about a version.
    expect(now.assessment.version).toBe(2);
    expect(message().querySelector('.rk-notice-d')).toBeNull();

    // Close returns focus to the opener; Escape closes too.
    await user.click(within(aside).getByRole('button', { name: 'Close question bank' }));
    expect(panel()).toBeNull();
    await waitFor(() =>
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Add from question bank' }),
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Add from question bank' }));
    await waitFor(() => expect(panel()).not.toBeNull());
    await user.keyboard('{Escape}');
    expect(panel()).toBeNull();
    expectNoReferences();
  });

  it('then the Summary shows version 2 since the change', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    const { view } = showQuestions(runtime);
    await questionsRegion();
    await user.click(
      screen.getByRole('button', { name: 'Remove question 4 from this assessment' }),
    );
    await screen.findByText(
      'Question removed from this assessment. It is still in your question bank.',
    );
    view.unmount();
    forgetLastAddress();

    showSummary(runtime);
    const versions = await screen.findByRole('region', { name: SUMMARY_WORDS.versionsTitle });
    expect(versions.querySelector('.rk-notice-t')).toHaveTextContent(
      /^Version 2 since 15 Nov 2026, \d{2}:\d{2}$/,
    );
    await waitFor(() =>
      expect(versions.querySelector('.rk-notice-d')).toHaveTextContent(
        'You changed the questions after students submitted. Rahul Verma’s submission keeps version 1; new attempts use version 2.',
      ),
    );
    expect(region(SUMMARY_WORDS.readyTitle)).toHaveTextContent('3 questions · 6 marks');
    expect(region(SUMMARY_WORDS.rulesTitle)).toHaveTextContent('50% · 3 of 6 marks');
  });

  it('a move sends the new order and focus follows the moved row', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showQuestions(runtime);
    const section = await questionsRegion();
    await user.click(screen.getByRole('button', { name: 'Move question 2 up' }));
    expect(await within(section).findByText('Moved question 2 to position 1.')).toBeVisible();
    await waitFor(() =>
      expect(document.activeElement).toBe(document.getElementById('questions-row-Q-0102')),
    );
    expect(rowsOf(section).map((row) => `${row[0]} ${row[1]}`)).toEqual([
      `1 ${Q0102}`,
      `2 ${Q0101}`,
      `3 ${Q0104}`,
      `4 ${Q0106}`,
    ]);
    expect((await record(runtime)).assessment.questions[0]!.questionId).toBe('Q-0102');
  });
});

describe('FA-09 Questions — the bank changed', () => {
  it('a bank edit shows "A newer version …"; "Use updated version" pins it', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showQuestions(runtime);
    const section = await questionsRegion();
    const edited = 'How is the number of transfer units (NTU) defined, and what does it measure?';
    await editText(runtime, 'Q-0102', edited);

    const row = await waitFor(() => {
      const found = document.getElementById('questions-row-Q-0102')!;
      expect(found).toHaveTextContent('A newer version is in your question bank.');
      return found;
    });
    // The assessment still shows the version it pins.
    expect(shown(row.querySelector('.fa-qt'))).toBe(Q0102);
    expect(row.querySelector('p.fa-qnote')).not.toBeNull();
    const use = within(row).getByRole('button', { name: 'Use the updated version of question 2' });
    expect(use).toHaveTextContent('Use updated version');
    expect(
      within(section).getAllByRole('button', { name: /^Use the updated version/ }),
    ).toHaveLength(1);

    await user.click(use);
    expect(
      await within(section).findByText('Question 2 now uses the version in your bank.'),
    ).toBeVisible();
    await waitFor(() =>
      expect(shown(document.getElementById('questions-row-Q-0102')!.querySelector('.fa-qt'))).toBe(
        edited,
      ),
    );
    expect(section).not.toHaveTextContent('A newer version is in your question bank.');
    const now = await record(runtime);
    expect(now.assessment.questions[1]).toEqual({ questionId: 'Q-0102', questionVersion: 2 });
  });

  it('a question deleted from the bank keeps its copy and leaves the panel', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showQuestions(runtime);
    const section = await questionsRegion();
    const current = await runtime.ports.questionBank.getQuestion('Q-0104' as QuestionId);
    if (!current.ok) throw new Error(current.error.kind);
    await viaPort(runtime, () =>
      runtime.ports.questionBank.deleteQuestion({
        id: 'Q-0104' as QuestionId,
        expectedRev: current.value.question.rev,
      }),
    );
    const row = await waitFor(() => {
      const found = document.getElementById('questions-row-Q-0104')!;
      expect(found).toHaveTextContent(
        'Deleted from your question bank on 15 Nov 2026 — this assessment keeps its copy.',
      );
      return found;
    });
    expect(shown(row.querySelector('.fa-qt'))).toBe(Q0104);
    expect(row).not.toHaveTextContent('A newer version');
    expect(questionsCount()).toBe('4');

    // Removing another question keeps the deleted one's pinned copy in the record.
    await user.click(
      screen.getByRole('button', { name: 'Remove question 1 from this assessment' }),
    );
    await within(section).findByText(
      'Question removed from this assessment. It is still in your question bank.',
    );
    expect((await record(runtime)).assessment.questions.map((ref) => ref.questionId)).toEqual([
      'Q-0102',
      'Q-0104',
      'Q-0106',
    ]);
    await user.click(screen.getByRole('button', { name: 'Add from question bank' }));
    const aside = await screen.findByRole('complementary', { name: 'From your question bank' });
    await waitFor(() =>
      expect(
        [...aside.querySelectorAll('li')].map(
          (item) => item.querySelector('.fa-avail-t')?.textContent,
        ),
      ).toEqual([Q0101, Q0103, Q0105]),
    );
  });
});

describe('FA-09 Questions — empty, and back from New question', () => {
  it('"No questions yet"; adding the first question makes the draft Ready', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const id = await createOnC(runtime, { mode: 'save-as-draft' });
    const { view } = showQuestions(runtime, id);
    const section = await questionsRegion();
    expect(section.querySelector('.fa-qhead [role="status"]')).toHaveTextContent(
      '0 questions · 0 marks',
    );
    const empty = section.querySelector('.rk-state') as HTMLElement;
    expect(empty.querySelector('.rk-state-t')).toHaveTextContent('No questions yet');
    // The export's own line (Phase 4B: drafting and importing are built).
    expect(empty).toHaveTextContent(ASSESSMENT_QUESTIONS_EMPTY_LINE);
    expect(within(section).getByRole('link', { name: 'New question' })).toHaveClass('rb-btn');
    expect(section.querySelector('ol.fa-qlist')).toBeNull();

    await user.click(within(section).getByRole('button', { name: 'Add from question bank' }));
    const aside = await screen.findByRole('complementary', { name: 'From your question bank' });
    await waitFor(() => expect(aside.querySelectorAll('li')).toHaveLength(6));
    await user.click(
      within(aside).getByRole('button', { name: `Add to this assessment: ${Q0101}` }),
    );
    expect(await within(section).findByText('Added as question 1.')).toBeVisible();
    // No submission: no new version.
    expect(message().querySelector('.rk-notice-d')).toBeNull();
    expect(questionsCount()).toBe('1');
    await waitFor(() =>
      expect(document.querySelector('.fa-rec-meta .xr-st')).toHaveTextContent('Ready'),
    );
    view.unmount();
    forgetLastAddress();

    showSummary(runtime, id);
    const ready = await screen.findByRole('region', { name: SUMMARY_WORDS.readyTitle });
    expect(ready).toHaveTextContent(`Students who have ${SHELL_NAME} can see and start it.`);
    expect(ready).toHaveTextContent('1 question · 2 marks');
    expect(within(ready).queryByRole('link', { name: 'Add questions' })).toBeNull();
  });

  it('back from FA-15 with ?added=: the page offers the question — nothing attached on its own', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    const text = 'A larger LMTD means a smaller exchanger for the same duty.';
    const added = await viaPort(runtime, () =>
      runtime.ports.questionBank.addQuestion({
        experimentId: SHELL as ExperimentId,
        type: 'true-false',
        text,
        options: {},
        correct: 'true',
        marks: '2',
        explanation: null,
        markingGuidance: null,
      }),
    );
    const { navigation } = showQuestions(runtime, ASMT, `?added=${added.id}`);
    const section = await questionsRegion();
    await waitFor(() => expect(document.activeElement).toBe(message()));
    expect(message()).toHaveTextContent(
      'Saved to your question bank.It isn’t in this assessment yet. Add it only if you want it here.',
    );
    expect(navigation.replace).toHaveBeenCalledWith(`/faculty/assessments/${ASMT}/questions`);
    expect(panel()).toBeNull();
    // Nothing attached on its own.
    expect((await record(runtime)).assessment.questions).toHaveLength(4);
    const offer = await within(message()).findByRole('button', {
      name: 'Add this question to the assessment',
    });
    expectNoReferences();
    await user.click(offer);
    expect(await within(section).findByText('Added as question 5.')).toBeVisible();
    expect(questionsCount()).toBe('5');
    expect(rowsOf(section).at(-1)).toEqual(['5', text, 'True or false2 marks']);
  });
});

describe('FA-09 Questions — refusals and failures', () => {
  it('a stale record is read again and the page says so; nothing is written', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showQuestions(runtime);
    const section = await questionsRegion();
    // Changed elsewhere (another tab): this tab's copy is not refreshed.
    const before = await record(runtime);
    await viaPort(
      runtime,
      () =>
        runtime.ports.assessments.updateQuestions({
          id: ASMT as AssessmentId,
          questions: before.assessment.questions.slice(0, 3),
          expectedRev: before.assessment.rev,
        }),
      false,
    );
    expect(rowsOf(section)).toHaveLength(4);
    await user.click(
      screen.getByRole('button', { name: 'Remove question 1 from this assessment' }),
    );
    const line = await within(section).findByText(stateWords('FA-09.stale'));
    expect(line.closest('.rk-notice')).toHaveClass('rk-notice--warn');
    expect(line.closest('.rk-notice')).toHaveAttribute('role', 'alert');
    await waitFor(() => expect(document.activeElement).toBe(message()));
    // Read again: the other tab's change shows; the first question is still there.
    await waitFor(() => expect(rowsOf(section)).toHaveLength(3));
    expect((await record(runtime)).assessment.questions.map((ref) => ref.questionId)).toEqual([
      'Q-0101',
      'Q-0102',
      'Q-0104',
    ]);
  });

  it('the only question of a Ready assessment cannot be removed', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const id = await createOnC(runtime, { mode: 'create', questions: ['Q-0103'] });
    showQuestions(runtime, id);
    const section = await questionsRegion();
    await user.click(
      screen.getByRole('button', { name: 'Remove question 1 from this assessment' }),
    );
    expect(await within(section).findByText(stateWords('FA-09.last-question'))).toBeVisible();
    expect(rowsOf(section)).toHaveLength(1);
    expect((await record(runtime, id)).assessment.questions).toHaveLength(1);
  });

  it('a change that fails for now changes nothing and says so', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showQuestions(runtime);
    const section = await questionsRegion();
    faults(sample).failNext('AssessmentService.updateQuestions');
    await user.click(
      screen.getByRole('button', { name: 'Remove question 2 from this assessment' }),
    );
    expect(await within(section).findByText(stateWords('FA-09.unavailable'))).toBeVisible();
    expect(rowsOf(section)).toEqual(ROWS);
    expect((await record(runtime)).assessment.version).toBe(1);
    // Pressed again, it goes through.
    await user.click(
      screen.getByRole('button', { name: 'Remove question 2 from this assessment' }),
    );
    expect(
      await within(section).findByText(
        'Question removed from this assessment. It is still in your question bank.',
      ),
    ).toBeVisible();
  });

  it('the bank panel failing to load has Try again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showQuestions(runtime);
    await questionsRegion();
    faults(sample).failNext('QuestionBankService.listQuestions');
    await user.click(screen.getByRole('button', { name: 'Add from question bank' }));
    const aside = await screen.findByRole('complementary', { name: 'From your question bank' });
    expect(await within(aside).findByText(stateWords('FA-09.bank-failed'))).toBeVisible();
    await user.click(within(aside).getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(aside.querySelectorAll('ul.fa-avail li')).toHaveLength(2));
  });
});

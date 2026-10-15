/**
 * FA-08 Assessment · Summary and FA-09 Assessment · Questions (board B4-05 f0 … f8) on the real
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
import { STATE_COPY, type StateCopyEntry, stateWords } from '@/copy/state-copy';
import type { PlatformRuntime } from '@/platform/runtime';
import { board } from '@/test-support/boards';
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

/** B4-05's text with tags removed, and its source (the interactive frames' script words). */
const B4_05_RAW = board('B4-05-Assessment-Summary-and-Questions.dc.html');
const B4_05 = `${B4_05_RAW.replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')}\n${B4_05_RAW}`;

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
const message = () => document.getElementById('questions-msg')!;

/** The rows of "Questions in order": number, text, meta. */
function rowsOf(section: HTMLElement): string[][] {
  return [...section.querySelectorAll('ul.xr-rows > li')].map((row) => [
    row.querySelector('.xl-n')?.textContent ?? '',
    row.querySelector('.xr-row-title')?.textContent ?? '',
    row.querySelector('.xa-qrow-meta')?.textContent ?? '',
  ]);
}

/** The tab strip's Questions count. */
function questionsCount(): string | null {
  const tabs = screen.getByRole('navigation', { name: NAME });
  return (
    within(tabs)
      .getByRole('link', { name: /^Questions/ })
      .querySelector('.xr-tab-count')?.textContent ?? null
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

const F6_ROWS = [
  [
    '1',
    'What does the effectiveness (ε) of a heat exchanger compare?',
    'Multiple choice2 marksQ-0101',
  ],
  ['2', 'How is the number of transfer units (NTU) defined?', 'Multiple choice2 marksQ-0102'],
  [
    '3',
    'Fouling on the tube surfaces lowers the overall heat transfer coefficient U.',
    'True or false2 marksQ-0104',
  ],
  [
    '4',
    'Explain how fouling changes the exchanger’s performance, using what you observed in the simulation.',
    'Written answer10 marksQ-0106',
  ],
];

// ---- The drawn words ---------------------------------------------------------------------------

describe('B4-05 words', () => {
  it('every drawn word of the copy module is on the board; every undrawn one is provisional', () => {
    for (const words of [...Object.values(SUMMARY_WORDS), ...Object.values(QUESTIONS_WORDS)]) {
      expect(B4_05, words).toContain(words);
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

describe('FA-08 Summary — Ready with a submission (B4-05 f0)', () => {
  it('readiness, checklist, submissions, reach and the rules exactly as set', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSummary(runtime);
    const ready = await screen.findByRole('region', { name: SUMMARY_WORDS.readyTitle });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: NAME })).toBeVisible();
    // The shell: "Assessments / Heat Exchanger — post-lab / Summary", Summary current.
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Summary');
    expect(
      screen.getByRole('navigation', { name: NAME }).querySelector('[aria-current="page"]'),
    ).toHaveTextContent('Summary');
    expect(questionsCount()).toBe('4');

    expect(ready.querySelector('.xr-status')).toHaveTextContent('Ready');
    expect(ready).toHaveTextContent(`Students who have ${SHELL_NAME} can see and start it.`);
    const items = [...ready.querySelectorAll('ul.xa-check > li')];
    expect(items.map((item) => item.textContent)).toEqual([
      'Name and introduction',
      'Rules: pass mark 50%, 2 attempts, due 14 Nov 2026, 23:59, results after the deadline',
      '4 questions · 16 marks',
    ]);
    expect(items.every((item) => item.querySelector('.is-ok'))).toBe(true);
    expect(within(ready).queryByRole('link')).toBeNull();

    // One of the one Student it reaches has submitted; ATT-0450's marks are confirmed.
    const submissions = region(SUMMARY_WORDS.submissionsTitle);
    expect(submissions.querySelector('p.xr-body')).toHaveTextContent(/^1 of 1 submitted$/);
    expect(submissions.querySelector('.xr-status--wait')).toBeNull();
    expect(submissions.querySelector('.xr-notice--quiet')).toHaveTextContent(
      '1 student has submitted. If you change questions or rules now, that makes a new version — earlier submissions keep theirs.',
    );
    // FA-18 and FA-12 are Phase 4B: not rendered.
    expect(within(main()).queryByText('Mark next')).toBeNull();
    expect(within(main()).queryByText('See submissions')).toBeNull();
    expect(within(main()).queryByRole('link', { name: /Submissions/ })).toBeNull();

    expect(region(SUMMARY_WORDS.reachTitle).querySelector('p.xr-body')).toHaveTextContent(
      `1 student who has ${SHELL_NAME} from ${GODAVARI}. Formats don’t change who it reaches: one assessment covers the experiment, whichever format a student used.`,
    );
    expect(region(SUMMARY_WORDS.reachTitle).querySelector('strong')).toHaveTextContent('1 student');
    expect(region(SUMMARY_WORDS.reachTitle)).toHaveTextContent(
      'Reach follows Student access, set by the Institute Admin.',
    );

    const rules = region(SUMMARY_WORDS.rulesTitle);
    const pairs = [...rules.querySelectorAll('dt')].map((term) => [
      term.textContent,
      term.nextElementSibling?.textContent,
    ]);
    expect(pairs).toEqual([
      ['Introduction', 'None'],
      ['Pass mark', '50% · 8 of 16 marks'],
      ['Attempts allowed', '2'],
      ['Deadline', '14 Nov 2026, 23:59'],
      ['Result and answers', 'After the deadline'],
      ['Time limit', 'None'],
    ]);
    expect(rules.querySelector('p.xl-meta')).toHaveTextContent(
      'Created 27 Oct 2026, 10:00 by you · ready since 27 Oct 2026, 10:00 · Change settings',
    );
    expect(within(rules).getByRole('link', { name: 'Change settings' })).toHaveAttribute(
      'href',
      `/faculty/assessments/${ASMT}/settings`,
    );
    // No release control, no availability lifecycle (T-18, B4-14 D4).
    expect(
      within(main()).queryByRole('button', { name: /release|publish|make available/i }),
    ).toBeNull();
  });

  it('a rule changed after the submission makes version 2, and the Summary says so (f4)', async () => {
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
    const submissions = await screen.findByRole('region', { name: SUMMARY_WORDS.submissionsTitle });
    const notice = submissions.querySelector('.xr-notice')!;
    expect(notice).not.toHaveClass('xr-notice--quiet');
    expect(notice.querySelector('.xr-notice-title')).toHaveTextContent(
      'Version 2 since 15 Nov 2026',
    );
    expect(notice).toHaveTextContent(
      'You changed a rule after students submitted. Earlier submissions keep the version they answered; new attempts use version 2.',
    );
    expect(submissions).not.toHaveTextContent('If you change questions or rules now');
    expect(region(SUMMARY_WORDS.rulesTitle)).toHaveTextContent('Attempts allowed3');
  });
});

describe('FA-08 Summary — a written answer waiting for marking (B4-05 f0)', () => {
  it('Rahul submits in the same world: "1 of 1 submitted · 1 waiting for marking"', async () => {
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
    const submissions = await screen.findByRole('region', {
      name: SUMMARY_WORDS.submissionsTitle,
    });
    expect(submissions.querySelector('p.xr-body')).toHaveTextContent(
      /^1 of 1 submitted · 1 waiting for marking$/,
    );
    expect(submissions.querySelector('p.xr-body .xr-status--wait')).toHaveTextContent(
      '1 waiting for marking',
    );
    expect(submissions.querySelector('.xr-notice--quiet')).toHaveTextContent(
      '1 student has submitted.',
    );
    // The header's fact (the frame) reads the same figure.
    expect(document.querySelector('.xa-headfacts')).toHaveTextContent('1 waiting for marking');
    expect(within(main()).queryByText('Mark next')).toBeNull();
  });
});

describe('FA-08 Summary — drafts (B4-05 f3)', () => {
  it('a draft with every rule and no question: "At least one question — none yet" and Add questions', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const id = await createOnC(runtime, { mode: 'save-as-draft' });
    showSummary(runtime, id);
    const ready = await screen.findByRole('region', { name: SUMMARY_WORDS.readyTitle });
    expect(ready.querySelector('.xr-status--wait')).toHaveTextContent('Draft — not ready');
    expect(ready).toHaveTextContent('Students can’t see it until it has a question.');
    const items = [...ready.querySelectorAll('ul.xa-check > li')];
    expect(items.map((item) => [item.textContent, item.firstElementChild?.className])).toEqual([
      ['Name and introduction', 'is-ok'],
      [
        'Rules: pass mark 50%, 2 attempts, due 14 Nov 2026, 23:59, results after the deadline',
        'is-ok',
      ],
      ['At least one question — none yet', 'is-no'],
    ]);
    const add = within(ready).getByRole('link', { name: 'Add questions' });
    expect(add).toHaveClass('xr-btn', 'xr-btn--primary');
    expect(add).toHaveAttribute('href', `/faculty/assessments/${id}/questions`);
    expect(questionsCount()).toBe('0');
    // No submission yet: no Submissions section.
    expect(screen.queryByRole('region', { name: SUMMARY_WORDS.submissionsTitle })).toBeNull();
    // Never Ready: no "ready since"; with no question the pass mark has no marks yet.
    expect(region(SUMMARY_WORDS.rulesTitle).querySelector('p.xl-meta')).toHaveTextContent(
      /^Created 27 Oct 2026, 10:00 by you · Change settings$/,
    );
    expect(region(SUMMARY_WORDS.rulesTitle)).toHaveTextContent('Pass mark50%Attempts');
  });

  it('a draft saved with its name only: every rule "Not set yet", nothing pre-filled', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const id = await createOnC(runtime, { mode: 'save-as-draft', rules: NO_RULES });
    showSummary(runtime, id);
    const ready = await screen.findByRole('region', { name: SUMMARY_WORDS.readyTitle });
    expect(ready).toHaveTextContent(
      'Students can’t see it until every rule is set and it has a question.',
    );
    expect([...ready.querySelectorAll('ul.xa-check > li')][1]).toHaveTextContent(
      'Rules — not set yet: pass mark, attempts allowed, deadline, result and answers',
    );
    const values = [...region(SUMMARY_WORDS.rulesTitle).querySelectorAll('dd')].map(
      (value) => value.textContent,
    );
    expect(values).toEqual([
      'None',
      'Not set yet',
      'Not set yet',
      'Not set yet',
      'Not set yet',
      'None',
    ]);
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

describe('FA-09 Questions — the list (B4-05 f6)', () => {
  it('the pinned questions in order with their marks, and only the built actions', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showQuestions(runtime);
    const section = await questionsRegion();
    expect(screen.getByRole('heading', { level: 1, name: NAME })).toBeVisible();
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Questions');
    expect(section.querySelector('.xr-section-head .xr-meta')).toHaveTextContent(
      '4 questions · 16 marks',
    );
    expect(section.querySelector('.xr-section-head .xr-meta')).toHaveAttribute('role', 'status');
    expect(rowsOf(section)).toEqual(F6_ROWS);

    const add = within(section).getByRole('button', { name: 'Add from question bank' });
    expect(add).toHaveClass('xr-btn--primary', 'xr-btn--sm');
    const newQuestion = within(section).getByRole('link', { name: 'New question' });
    expect(newQuestion).toHaveAttribute(
      'href',
      `/faculty/question-bank/new?experimentId=${SHELL}&returnTo=%2Ffaculty%2Fassessments%2F${ASMT}%2Fquestions`,
    );
    // FA-16 and FA-17 are not built (T-23): not rendered.
    expect(within(main()).queryByText('Draft with assistance')).toBeNull();
    expect(within(main()).queryByText('Import')).toBeNull();

    expect(screen.getByRole('button', { name: 'Move question 1 up' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Move question 4 down' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Move question 2 up' })).not.toHaveAttribute(
      'aria-disabled',
    );
    expect(
      screen.getByRole('button', { name: 'Remove question 3 from this assessment' }),
    ).toHaveTextContent('Remove');
    expect(section).toHaveTextContent(
      'Removing takes a question off this assessment. It stays in your question bank — removing is not deleting.',
    );
    expect(panel()).toBeNull();
  });
});

describe('FA-09 Questions — Remove and Add back through the bank panel (f6, f7)', () => {
  it('changes the record, the count and the tab strip, with a new version after the submission', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showQuestions(runtime);
    const section = await questionsRegion();

    await user.click(
      screen.getByRole('button', { name: 'Remove question 2 from this assessment' }),
    );
    expect(
      await within(section).findByText(
        'Q-0102 removed from this assessment. It is still in your question bank.',
      ),
    ).toBeVisible();
    await waitFor(() => expect(document.activeElement).toBe(message()));
    expect(rowsOf(section).map((row) => row[2])).toEqual([
      'Multiple choice2 marksQ-0101',
      'True or false2 marksQ-0104',
      'Written answer10 marksQ-0106',
    ]);
    expect(section.querySelector('.xr-section-head .xr-meta')).toHaveTextContent(
      '3 questions · 14 marks',
    );
    expect(questionsCount()).toBe('3');
    // Rahul has submitted: the change made version 2 (the drawn notice, without his name).
    const notice = section.querySelector('.xr-notice--warn')!;
    expect(notice.querySelector('.xr-notice-title')).toHaveTextContent('This makes a new version');
    expect(notice).toHaveTextContent(
      '1 student has submitted. Their submission keeps the version they answered; new attempts use this one.',
    );
    let now = await record(runtime);
    expect(now.assessment.version).toBe(2);
    expect(now.assessment.questions.map((ref) => ref.questionId)).toEqual([
      'Q-0101',
      'Q-0104',
      'Q-0106',
    ]);

    // f7: the panel lists the bank questions not in the assessment; its title takes focus.
    await user.click(screen.getByRole('button', { name: 'Add from question bank' }));
    const aside = await screen.findByRole('complementary', { name: 'From your question bank' });
    await waitFor(() =>
      expect(document.activeElement).toBe(
        within(aside).getByRole('heading', { name: 'From your question bank' }),
      ),
    );
    expect(screen.queryByRole('button', { name: 'Add from question bank' })).toBeNull();
    expect(main().querySelector('.xr-decide')).toContainElement(aside);
    expect(aside).toHaveTextContent(`${SHELL_NAME} · not in this assessment`);
    await waitFor(() =>
      expect(
        [...aside.querySelectorAll('li')].map(
          (item) => item.querySelector('.xr-meta')?.textContent,
        ),
      ).toEqual([
        'Q-0102 · Multiple choice · 2 marks',
        'Q-0103 · Multiple choice · 2 marks',
        'Q-0105 · True or false · 2 marks',
      ]),
    );
    await user.click(within(aside).getByRole('button', { name: 'Add Q-0102 to this assessment' }));
    expect(await within(section).findByText('Q-0102 added as question 4.')).toBeVisible();
    expect(questionsCount()).toBe('4');
    expect(rowsOf(section).at(-1)).toEqual(['4', F6_ROWS[1]![1], 'Multiple choice2 marksQ-0102']);
    await waitFor(() =>
      expect(
        within(aside).queryByRole('button', { name: 'Add Q-0102 to this assessment' }),
      ).toBeNull(),
    );
    now = await record(runtime);
    expect(now.assessment.questions.map((ref) => ref.questionId)).toEqual([
      'Q-0101',
      'Q-0104',
      'Q-0106',
      'Q-0102',
    ]);
    // Still version 2: nobody has submitted against it.
    expect(now.assessment.version).toBe(2);

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
  });

  it('then the Summary shows version 2 since the change (f4)', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    const { view } = showQuestions(runtime);
    await questionsRegion();
    await user.click(
      screen.getByRole('button', { name: 'Remove question 4 from this assessment' }),
    );
    await screen.findByText(
      'Q-0106 removed from this assessment. It is still in your question bank.',
    );
    view.unmount();
    forgetLastAddress();

    showSummary(runtime);
    const submissions = await screen.findByRole('region', { name: SUMMARY_WORDS.submissionsTitle });
    expect(submissions.querySelector('.xr-notice-title')).toHaveTextContent(
      'Version 2 since 15 Nov 2026',
    );
    expect(submissions.querySelector('.xr-notice')).toHaveTextContent(
      'You changed the questions after students submitted. Earlier submissions keep the version they answered; new attempts use version 2.',
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
    expect(await within(section).findByText('Moved Q-0102 to position 1')).toBeVisible();
    await waitFor(() =>
      expect(document.activeElement).toBe(document.getElementById('questions-row-Q-0102')),
    );
    expect(rowsOf(section).map((row) => row[0]! + row[2]!.slice(-6))).toEqual([
      '1Q-0102',
      '2Q-0101',
      '3Q-0104',
      '4Q-0106',
    ]);
    expect((await record(runtime)).assessment.questions[0]!.questionId).toBe('Q-0102');
  });
});

describe('FA-09 Questions — the bank changed (B4-05 f8, f2)', () => {
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
    expect(row.querySelector('.xr-row-title')).toHaveTextContent(F6_ROWS[1]![1]!);
    expect(within(section).getAllByRole('button', { name: 'Use updated version' })).toHaveLength(1);

    await user.click(within(row).getByRole('button', { name: 'Use updated version' }));
    expect(
      await within(section).findByText('Q-0102 now uses the version in your bank.'),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        document.getElementById('questions-row-Q-0102')!.querySelector('.xr-row-title'),
      ).toHaveTextContent(edited),
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
    expect(row.querySelector('.xr-row-title')).toHaveTextContent(F6_ROWS[2]![1]!);
    expect(row).not.toHaveTextContent('A newer version');
    expect(questionsCount()).toBe('4');

    // Removing another question keeps the deleted one's pinned copy in the record.
    await user.click(
      screen.getByRole('button', { name: 'Remove question 1 from this assessment' }),
    );
    await within(section).findByText(
      'Q-0101 removed from this assessment. It is still in your question bank.',
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
          (item) => item.querySelector('.xr-meta')?.textContent,
        ),
      ).toEqual([
        'Q-0101 · Multiple choice · 2 marks',
        'Q-0103 · Multiple choice · 2 marks',
        'Q-0105 · True or false · 2 marks',
      ]),
    );
  });
});

describe('FA-09 Questions — empty, and back from New question (B4-05 f1)', () => {
  it('"No questions yet"; adding the first question makes the draft Ready', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const id = await createOnC(runtime, { mode: 'save-as-draft' });
    const { view } = showQuestions(runtime, id);
    const section = await questionsRegion();
    expect(section.querySelector('.xr-section-head .xr-meta')).toHaveTextContent(
      '0 questions · 0 marks',
    );
    const empty = section.querySelector('.xr-empty') as HTMLElement;
    expect(
      within(empty).getByRole('heading', { level: 3, name: 'No questions yet' }),
    ).toBeVisible();
    expect(empty).toHaveTextContent(stateWords('FA-09.empty-line'));
    expect(empty).not.toHaveTextContent('assistance');
    expect(within(empty).getByRole('link', { name: 'New question' })).toHaveClass(
      'xr-btn--secondary',
    );
    expect(section.querySelector('ul.xr-rows')).toBeNull();

    await user.click(within(empty).getByRole('button', { name: 'Add from question bank' }));
    const aside = await screen.findByRole('complementary', { name: 'From your question bank' });
    await waitFor(() => expect(aside.querySelectorAll('li')).toHaveLength(6));
    await user.click(within(aside).getByRole('button', { name: 'Add Q-0101 to this assessment' }));
    expect(await within(section).findByText('Q-0101 added as question 1.')).toBeVisible();
    // No submission: no new version, no notice.
    expect(section.querySelector('.xr-notice--warn')).toBeNull();
    expect(questionsCount()).toBe('1');
    expect(document.querySelector('.xl-hubhead .xr-status')).toHaveTextContent('Ready');
    view.unmount();
    forgetLastAddress();

    showSummary(runtime, id);
    const ready = await screen.findByRole('region', { name: SUMMARY_WORDS.readyTitle });
    expect(ready).toHaveTextContent(`Students who have ${SHELL_NAME} can see and start it.`);
    expect(ready).toHaveTextContent('1 question · 2 marks');
    expect(within(ready).queryByRole('link', { name: 'Add questions' })).toBeNull();
  });

  it('back from FA-15 with ?added=: the panel opens with that question first — nothing attached', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    const added = await viaPort(runtime, () =>
      runtime.ports.questionBank.addQuestion({
        experimentId: SHELL as ExperimentId,
        type: 'true-false',
        text: 'A larger LMTD means a smaller exchanger for the same duty.',
        options: {},
        correct: 'true',
        marks: '2',
        explanation: null,
        markingGuidance: null,
      }),
    );
    const { navigation } = showQuestions(runtime, ASMT, `?added=${added.id}`);
    const aside = await screen.findByRole('complementary', { name: 'From your question bank' });
    await waitFor(() =>
      expect(document.activeElement).toBe(
        within(aside).getByRole('heading', { name: 'From your question bank' }),
      ),
    );
    expect(navigation.replace).toHaveBeenCalledWith(`/faculty/assessments/${ASMT}/questions`);
    const first = await waitFor(() => {
      const item = aside.querySelector('li')!;
      expect(item).toHaveTextContent(added.id);
      return item;
    });
    expect(first).toHaveTextContent('Just added to your question bank');
    expect(aside.querySelectorAll('li')).toHaveLength(3);
    // Nothing attached on its own.
    expect((await record(runtime)).assessment.questions).toHaveLength(4);
    await user.click(
      within(first).getByRole('button', { name: `Add ${added.id} to this assessment` }),
    );
    expect(await screen.findByText(`${added.id} added as question 5.`)).toBeVisible();
    expect(questionsCount()).toBe('5');
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
    expect(line).toHaveClass('xa-save', 'is-err');
    await waitFor(() => expect(document.activeElement).toBe(message()));
    // Read again: the other tab's change shows; Q-0101 is still there.
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
    expect(rowsOf(section)).toEqual(F6_ROWS);
    expect((await record(runtime)).assessment.version).toBe(1);
    // Pressed again, it goes through.
    await user.click(
      screen.getByRole('button', { name: 'Remove question 2 from this assessment' }),
    );
    expect(
      await within(section).findByText(
        'Q-0102 removed from this assessment. It is still in your question bank.',
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
    await waitFor(() => expect(aside.querySelectorAll('li')).toHaveLength(2));
  });
});

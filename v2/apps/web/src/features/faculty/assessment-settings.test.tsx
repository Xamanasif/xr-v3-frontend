/**
 * FA-10 Assessment · Settings and FA-11 Assessment · Preview in the V3 Refined B design (FA-v1
 * `Main.dc.html` "FA-10 Settings", "FA-11 Preview"; earlier board B4-06 f0 … f6) on the real
 * composition root and the sample world, as Dr S. Ranganathan (per-0014). After Flow D,
 * ASMT-0009 "Heat Exchanger — post-lab" is Ready with Rahul's submission: a changed rule shows
 * "This makes a new version" (f1) and the save answers a new version; a changed result option shows
 * f2. After Flow C a draft saved through the assessments port shows every rule empty (f3). The
 * preview shows the PINNED question versions — a bank edit reaches it only after "Use updated
 * version" — and the answer key; it writes nothing. Every save reaches the one world: the record
 * read again carries the new rules. Configuration only — no release control anywhere.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ServiceError } from '@xr/contracts/draft';
import type { AssessmentId, ExperimentId, QuestionId } from '@xr/domain';
import { faults, worldOf } from '@xr/sample-platform/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PREVIEW_PAGE, SETTINGS_PAGE } from '@/copy/assessment-settings';
import { rulesChecklistLine } from '@/copy/assessment-words';
import { RULES_WORDS } from '@/copy/assessments';
import { FA_GUIDANCE_LABEL } from '@/copy/fa-shared';
import { STATE_COPY, type StateCopyEntry } from '@/copy/state-copy';
import { expandTarget, LINK_TARGET_LEDGER } from '@/nav/link-targets';
import { resolveAddress } from '@/nav/routes';
import type { PlatformRuntime } from '@/platform/runtime';
import { faExport } from '@/test-support/boards';
import {
  PERSON_OF_ROLE,
  renderInTab,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { AssessmentSettings } from './fa-10-assessment-settings/assessment-settings';
import { AssessmentPreview } from './fa-11-assessment-preview/assessment-preview';

afterEach(() => {
  forgetLastAddress();
});

const RANGANATHAN = PERSON_OF_ROLE.faculty;
const ASMT = 'ASMT-0009';
const NAME = 'Heat Exchanger — post-lab';
const SHELL = 'shell-and-tube-heat-exchanger';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

/** The export's text with tags removed, and its source (the script's words). */
const EXPORT_RAW = faExport('Main.dc.html');
const EXPORT = `${EXPORT_RAW.replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')}\n${EXPORT_RAW}`;

/** Any internal reference: an assessment's, an attempt's, a question's, a draft's (the owner's rule). */
const REFERENCE = /\b(?:ASMT|ATT|Q|D|REQ|ACC|UPD|DTR|SUB|SUP)-\d+/;

/** No reference in the words, the fields, the names and placeholders, or the tab title. */
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

function showSettings(runtime: PlatformRuntime, id = ASMT) {
  const navigation = testNavigation(`/faculty/assessments/${id}/settings`);
  const view = renderInTab(
    <WorkspaceLayout workspace="faculty">
      <AssessmentSettings assessmentId={id} />
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

function showPreview(runtime: PlatformRuntime, id = ASMT, search = '') {
  const navigation = testNavigation(`/faculty/assessments/${id}/preview`, search);
  const view = renderInTab(
    <WorkspaceLayout workspace="faculty">
      <AssessmentPreview assessmentId={id} />
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

const main = () => screen.getByRole('main');
const form = () => screen.findByRole('form', { name: 'Settings' });
const field = (label: string) => screen.getByLabelText(label) as HTMLInputElement;
const radio = (name: RegExp) => screen.getByRole('radio', { name }) as HTMLInputElement;
const saveButton = () => screen.getByRole('button', { name: SETTINGS_PAGE.save });
/** The save's answer (`#Es-saved`, a notice that takes focus); none before an answer. */
const answerSlot = () => document.getElementById('Es-saved')!;
const warnings = () =>
  [...main().querySelectorAll('.fa-fsec--warn .rk-notice-t')].map((node) => node.textContent);
const tabs = () => screen.getByRole('navigation', { name: `${NAME} sections` });

async function record(runtime: PlatformRuntime, id = ASMT) {
  const answer = await runtime.ports.assessments.getAssessment(id as AssessmentId);
  if (!answer.ok) throw new Error(`getAssessment ${answer.error.kind}`);
  return answer.value;
}

/** A draft of Shell-and-Tube saved through the assessments port (FA-07 "Save as draft"). */
async function saveDraft(
  runtime: PlatformRuntime,
  questions: readonly string[] = [],
): Promise<AssessmentId> {
  let id: AssessmentId | null = null;
  await act(async () => {
    const created = await runtime.ports.assessments.createAssessment({
      mode: 'save-as-draft',
      experimentId: SHELL as ExperimentId,
      name: 'Heat Exchanger — draft',
      introduction: null,
      rules: {
        passMarkPercent: '',
        attemptsAllowed: '',
        deadline: '',
        releaseOption: null,
        releaseDate: null,
      },
      questions: questions.map((question) => question as QuestionId),
    });
    if (!created.ok) throw new Error(`createAssessment ${created.error.kind}`);
    id = created.value.id;
    await runtime.invalidate(created.changed);
  });
  return id!;
}

/** Stages the settings command's refusal (a state the sample world cannot reach on its own). */
function answerSettingsWith(runtime: PlatformRuntime, error: ServiceError): void {
  const real = runtime.withCommandId.bind(runtime);
  vi.spyOn(runtime, 'withCommandId').mockImplementation((commandId) => {
    const ports = real(commandId);
    return {
      ...ports,
      assessments: {
        ...ports.assessments,
        updateSettings: async () => ({ ok: false as const, error }),
      },
    } as typeof ports;
  });
}

async function typeInto(user: ReturnType<typeof userEvent.setup>, label: string, value: string) {
  const input = field(label);
  await user.clear(input);
  if (value) await user.type(input, value);
}

// ---- FA-10: the record's own values ---------------------------------------------------------

describe('FA-10 Settings — as set', () => {
  it('the frame, the record’s values, the sections, the foot and the side panel; no release control', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSettings(runtime);
    await form();
    expect(screen.getByRole('heading', { level: 1, name: NAME })).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    await waitFor(() => expect(document.title).toMatch(/^Settings · /));
    expect(main().querySelector('.fa-rec .fa-cid-eyebrow')).toHaveTextContent(
      'ME ZG523Shell-and-Tube Heat Exchanger',
    );
    expect(main().querySelector('.fa-rec .fa-fig')).toHaveTextContent(
      '14 Nov 2026, 23:59Deadline passed',
    );
    expect(within(tabs()).getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // Submissions (FA-12, Phase 4B): the fifth tab, with the Students who have submitted.
    expect(within(tabs()).getByRole('link', { name: /^Submissions/ })).toHaveTextContent(
      'Submissions1',
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Settings' })).toBeVisible();
    expect(main()).toHaveTextContent(
      'Each value belongs to this assessment only. There is no time limit.',
    );
    expect(screen.getByRole('group', { name: 'Name and introduction' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'Rules' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 3, name: 'Rules' })).toBeVisible();
    expect(field(RULES_WORDS.name).value).toBe(NAME);
    expect(field(RULES_WORDS.introduction).value).toBe('');
    expect(field(RULES_WORDS.passMark).value).toBe('50');
    expect(field(RULES_WORDS.attempts).value).toBe('2');
    expect(field(RULES_WORDS.deadline).value).toBe('14 Nov 2026, 23:59');
    expect(radio(/After the deadline/).checked).toBe(true);
    expect(radio(/Immediately after marking/).checked).toBe(false);
    expect(radio(/On a date/).checked).toBe(false);
    expect(screen.queryByLabelText(RULES_WORDS.releaseDate)).toBeNull();
    expect(warnings()).toEqual([]);
    expect(document.getElementById('Es-saved')).toBeNull();

    expect(screen.getByRole('button', { name: 'Cancel changes' })).toHaveClass('rb-btn');
    expect(saveButton()).toHaveClass('rb-btn--primary', 'rb-btn--lg');
    expect(saveButton()).toHaveAttribute('type', 'submit');
    expect(main().querySelectorAll('.rb-btn--primary')).toHaveLength(1);
    // Configuration only: nothing releases, publishes, closes or times anything (T-18, T-22).
    expect(main().textContent).not.toMatch(
      /release results|release now|make available|publish|close assessment|timer|time limit:/i,
    );
    // The markup: the form column, the ids the error summary links to, the foot.
    const formColumn = main().querySelector('form.rk-surface.fa-formcol')!;
    expect(formColumn.parentElement).toHaveClass('fa-author');
    for (const id of ['Es-name', 'Es-intro', 'Es-pass', 'Es-att', 'Es-dl', 'Es-rel']) {
      expect(document.getElementById(id), id).not.toBeNull();
    }
    expect(formColumn.querySelector('.fa-formfoot .fa-formfoot-r .rb-btn--primary')).toBe(
      saveButton(),
    );
    // How changes apply: the version, who submitted it, what a change makes.
    const side = screen.getByRole('complementary', { name: 'How changes apply' });
    expect(side.querySelector('.fa-side-ver')).toHaveTextContent(
      /^Version 1 · since 27 Oct 2026, \d{2}:\d{2}$/,
    );
    await waitFor(() =>
      expect(side.querySelector('.rk-next')).toHaveTextContent(
        'Rahul Verma has submitted version 1. Changing a rule or when results are shown makes version 2; that submission keeps version 1.',
      ),
    );
    expect(side).toHaveTextContent(
      'Changing the name or the introduction never makes a new version.',
    );
    expectNoReferences();
  });

  it('every drawn word on this page is in the export', () => {
    for (const words of [
      ...Object.values(SETTINGS_PAGE),
      ...Object.values(PREVIEW_PAGE),
      ...Object.values(RULES_WORDS),
      FA_GUIDANCE_LABEL,
    ]) {
      expect(EXPORT, words).toContain(words);
    }
    // Every undrawn word is a provisional register entry naming its decisions.
    const entries = Object.entries(STATE_COPY) as [string, StateCopyEntry][];
    for (const [id, entry] of entries.filter(([key]) => /^FA-1[01]\./.test(key))) {
      expect(entry.status, id).toBe('provisional');
      expect(entry.decisions?.length, id).toBeGreaterThan(0);
      expect(entry.words ?? '', id).not.toMatch(/\b(?:OD|T|PC|P\d)-[\w-]+\d\b/);
      expect(entry.words ?? '', id).not.toMatch(/Rahul|\bhe\b|\bhis\b/);
    }
  });
});

// ---- FA-10: the warnings, then the save ------------------------------------------------------

describe('FA-10 Settings — after a submission', () => {
  it('a changed pass mark warns of a new version; the save makes version 2 and the world has it', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSettings(runtime);
    await form();
    await waitFor(() =>
      expect(screen.getByRole('complementary', { name: 'How changes apply' })).toHaveTextContent(
        'Rahul Verma has submitted version 1.',
      ),
    );
    await typeInto(user, RULES_WORDS.passMark, '60');
    expect(warnings()).toEqual([SETTINGS_PAGE.newVersionTitle]);
    const notice = main().querySelector('.fa-fsec--warn .rk-notice--warn')!;
    expect(notice).toHaveTextContent(
      'Rahul Verma has submitted. That submission keeps the rules it was answered under; new attempts use these.',
    );
    expect(notice.getAttribute('role')).toBe('status');
    // Putting the value back takes the warning away (compared with the record).
    await typeInto(user, RULES_WORDS.passMark, '50');
    expect(warnings()).toEqual([]);
    await typeInto(user, RULES_WORDS.passMark, '60');

    await user.click(saveButton());
    await waitFor(() =>
      expect(answerSlot()).toHaveTextContent(
        'Settings saved as version 2.Rahul Verma’s submission keeps version 1; new attempts use version 2.',
      ),
    );
    expect(answerSlot()).toHaveFocus();
    expect(answerSlot()).toHaveClass('rk-notice', 'rk-notice--ok');
    expect(answerSlot()).toHaveAttribute('role', 'status');
    expect(warnings()).toEqual([]);
    expect(field(RULES_WORDS.passMark).value).toBe('60');

    // The one world: the record read again has the new rule and version — what FA-08 shows.
    const saved = await record(runtime);
    expect(saved.assessment.rules.passMarkPercent).toBe(60);
    expect(saved.assessment.version).toBe(2);
    expect(rulesChecklistLine(saved.assessment.rules)).toBe(
      'Rules: pass mark 60%, 2 attempts, due 14 Nov 2026, 23:59, results after the deadline',
    );
    // Rahul's submission keeps version 1.
    expect(attemptVersion(sample, 'ATT-0450')).toBe(1);
    expect(main().querySelector('.fa-rec-meta')).toHaveTextContent('Version 2');
    expectNoReferences();
  });

  it('a changed result option warns that it makes a new version, and that submissions keep their terms (P4-06)', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSettings(runtime);
    await form();
    await user.click(radio(/Immediately after marking/));
    // The domain versions a release change like any rule: both warnings show (Phase 4A review).
    expect(warnings()).toEqual([SETTINGS_PAGE.newVersionTitle, SETTINGS_PAGE.releaseTitle]);
    expect(SETTINGS_PAGE.releaseTitle).toBe('This changes when results are shown for new attempts');
    await waitFor(() =>
      expect(main().querySelectorAll('.fa-fsec--warn .rk-notice--warn')[1]).toHaveTextContent(
        'Rahul Verma has submitted. Submitted attempts keep the result terms of the version they answered (after the deadline); new attempts use the terms you choose here.',
      ),
    );

    await user.click(saveButton());
    await waitFor(() =>
      expect(answerSlot()).toHaveTextContent(
        'Settings saved as version 2.Rahul Verma’s submission keeps version 1; new attempts use version 2. New attempts release their result immediately after marking.',
      ),
    );
    expect(warnings()).toEqual([]);
    const saved = await record(runtime);
    expect(saved.assessment.rules.release).toEqual({
      option: 'immediately-after-marking',
      releaseDate: null,
    });
    // Saved as version 2: no submission on it yet, so a further change warns of nothing.
    expect(saved.submittedOnCurrentVersion).toBe(0);
    await typeInto(user, RULES_WORDS.attempts, '3');
    expect(warnings()).toEqual([]);
  });

  it('“On a date” asks for the release date; the typed date and time is saved', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSettings(runtime);
    await form();
    await user.click(radio(/On a date/));
    expect(field(RULES_WORDS.releaseDate)).toHaveAccessibleDescription(RULES_WORDS.releaseDateHint);
    expect(field(RULES_WORDS.releaseDate).closest('.rk-field')).toHaveClass('fa-reldate');
    await user.click(saveButton());
    // The service's word for the missing date, in the summary and on the field.
    const summary = await screen.findByRole('alert');
    expect(summary).toHaveAttribute('id', 'Es-err');
    expect(within(summary).getByText(SETTINGS_PAGE.summaryTitle)).toBeVisible();
    expect(within(summary).getByRole('link', { name: 'Enter the release date' })).toHaveAttribute(
      'href',
      '#Es-reldate',
    );
    await typeInto(user, RULES_WORDS.releaseDate, '20 Nov 2026, 09:00');
    expect(screen.queryByRole('alert')).toBeNull();
    await user.click(saveButton());
    await waitFor(() =>
      expect(answerSlot()).toHaveTextContent(
        'New attempts release their result on 20 Nov 2026, 09:00.',
      ),
    );
    expect(field(RULES_WORDS.releaseDate).value).toBe('20 Nov 2026, 09:00');
  });

  it('a new deadline typed as drawn is saved and the record band reads it', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSettings(runtime);
    await form();
    // Typed without the comma: the same date and time reads the same (no warning).
    await typeInto(user, RULES_WORDS.deadline, '14 Nov 2026 23:59');
    expect(warnings()).toEqual([]);
    await typeInto(user, RULES_WORDS.deadline, '20 Nov 2026, 23:59');
    expect(warnings()).toEqual([SETTINGS_PAGE.newVersionTitle]);
    await user.click(saveButton());
    // Today on the session's clock is 15 Nov 2026: five days to 20 Nov.
    await waitFor(() =>
      expect(main().querySelector('.fa-rec .fa-fig')).toHaveTextContent(
        'Due 20 Nov 2026, 23:595 days left',
      ),
    );
    expect(main().querySelector('.fa-rec .fa-fig .fa-fig-v')).toHaveClass('is-warn');
    expect(field(RULES_WORDS.deadline).value).toBe('20 Nov 2026, 23:59');
    expect((await record(runtime)).assessment.rules.deadline).toBe('2026-11-20T18:29:00.000Z');
  });

  it('Cancel changes puts the record’s values back and clears errors and warnings', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSettings(runtime);
    await form();
    const before = worldOf(sample).worldVersion;
    await typeInto(user, RULES_WORDS.name, '');
    await typeInto(user, RULES_WORDS.passMark, '150');
    await user.click(radio(/On a date/));
    await user.click(saveButton());
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Cancel changes' }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(field(RULES_WORDS.name).value).toBe(NAME);
    expect(field(RULES_WORDS.passMark).value).toBe('50');
    expect(radio(/After the deadline/).checked).toBe(true);
    expect(screen.queryByLabelText(RULES_WORDS.releaseDate)).toBeNull();
    expect(warnings()).toEqual([]);
    expect(main().querySelectorAll('.rk-ferr')).toHaveLength(0);
    expect(worldOf(sample).worldVersion).toBe(before);
  });
});

// ---- FA-10 validation, refusals, failures ------------------------------------------------------

describe('FA-10 Settings — the service’s checks and answers', () => {
  it('the field errors and “Check these settings”, which takes focus; nothing is saved', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSettings(runtime);
    await form();
    const before = (await record(runtime)).assessment.rev;
    await typeInto(user, RULES_WORDS.name, '');
    await typeInto(user, RULES_WORDS.passMark, '150');
    await typeInto(user, RULES_WORDS.attempts, '0');
    await typeInto(user, RULES_WORDS.deadline, 'next Friday');
    await user.click(saveButton());
    const summary = await screen.findByRole('alert');
    expect(summary).toHaveClass('rk-errsum');
    expect(summary.parentElement).toHaveClass('fa-fmsg');
    expect(summary).toHaveFocus();
    expect(within(summary).getByText('Check these settings')).toBeVisible();
    // The service checks the typed rules first (the contract), then the record's own rules.
    expect(
      within(summary)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual([
      'Enter a pass mark from 0 to 100, as a whole number',
      'Enter how many attempts are allowed, as a whole number',
      'Enter the deadline as a date and time, for example 14 Nov 2026, 23:59',
    ]);
    expect(field(RULES_WORDS.passMark)).toHaveAttribute('aria-invalid', 'true');
    expect(field(RULES_WORDS.passMark)).toHaveAccessibleDescription(
      `${RULES_WORDS.passMarkHint} Enter a pass mark from 0 to 100, as a whole number`,
    );
    // A summary link moves focus to its field.
    await user.click(within(summary).getByRole('link', { name: /attempts/ }));
    expect(field(RULES_WORDS.attempts)).toHaveFocus();
    // Typing in a field clears its error (and its summary entry).
    await typeInto(user, RULES_WORDS.passMark, '55');
    expect(field(RULES_WORDS.passMark)).not.toHaveAttribute('aria-invalid');
    expect(within(screen.getByRole('alert')).getAllByRole('link')).toHaveLength(2);
    await typeInto(user, RULES_WORDS.attempts, '3');
    await typeInto(user, RULES_WORDS.deadline, '20 Nov 2026, 23:59');
    expect(screen.queryByRole('alert')).toBeNull();
    // A Ready assessment keeps its name: the empty name is refused next, with focus on the summary.
    await user.click(saveButton());
    await waitFor(() =>
      expect(
        within(screen.getByRole('alert'))
          .getAllByRole('link')
          .map((link) => link.textContent),
      ).toEqual(['Enter a name for the assessment']),
    );
    expect(screen.getByRole('alert')).toHaveFocus();
    expect(screen.getByRole('alert')).toHaveAttribute('id', 'Es-err');
    expect((await record(runtime)).assessment.rev).toBe(before);
  });

  it('nothing changed: says so, saves nothing', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSettings(runtime);
    await form();
    await user.click(saveButton());
    await waitFor(() =>
      expect(answerSlot()).toHaveTextContent(
        'Nothing to save — these are the settings already set.',
      ),
    );
    expect(answerSlot()).toHaveFocus();
    expect((await record(runtime)).assessment.version).toBe(1);
  });

  it('changed elsewhere meanwhile: read again, typed values kept, the next save goes through', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSettings(runtime);
    await form();
    await typeInto(user, RULES_WORDS.passMark, '60');
    // Another tab of the same Faculty member saves an introduction (the page's revision is stale).
    const current = (await record(runtime)).assessment;
    const other = await runtime.ports.assessments.updateSettings({
      id: current.id,
      name: current.name,
      introduction: 'Four short questions on what you measured.',
      rules: {
        passMarkPercent: '50',
        attemptsAllowed: '2',
        deadline: '2026-11-14T23:59:00+05:30',
        releaseOption: 'after-deadline',
        releaseDate: null,
      },
      expectedRev: current.rev,
    });
    expect(other.ok).toBe(true);
    await user.click(saveButton());
    await waitFor(() =>
      expect(answerSlot()).toHaveTextContent('This assessment was changed elsewhere'),
    );
    expect(answerSlot()).toHaveTextContent(
      'Nothing of yours was saved and your values are still here. Save again to use them, or Cancel to see the current settings.',
    );
    expect(answerSlot()).toHaveAttribute('role', 'alert');
    expect(answerSlot()).toHaveFocus();
    expect(field(RULES_WORDS.passMark).value).toBe('60');
    // Saving again uses the current revision.
    await user.click(saveButton());
    await waitFor(() => expect(answerSlot()).toHaveTextContent('Settings saved as version 2.'));
    expect((await record(runtime)).assessment.rules.passMarkPercent).toBe(60);
  });

  it('failed for now: “didn’t save”, every value kept, nothing written', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSettings(runtime);
    await form();
    await typeInto(user, RULES_WORDS.attempts, '3');
    faults(sample).failNext('AssessmentService.updateSettings');
    await user.click(saveButton());
    await waitFor(() => expect(answerSlot()).toHaveTextContent('Your settings didn’t save'));
    expect(answerSlot()).toHaveAttribute('role', 'alert');
    expect(answerSlot()).toHaveTextContent(
      'Nothing was changed and your values are still here. Try again.',
    );
    expect(field(RULES_WORDS.attempts).value).toBe('3');
    expect(warnings()).toEqual([SETTINGS_PAGE.newVersionTitle]);
    expect((await record(runtime)).assessment.rules.attemptsAllowed).toBe(2);
    // The next save goes through.
    await user.click(saveButton());
    await waitFor(() => expect(answerSlot()).toHaveTextContent('Settings saved as version 2.'));
  });

  it('the record failing to load has Try again; an unknown or out-of-scope assessment is not found', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    faults(sample).failNext('AssessmentService.getAssessment');
    showSettings(runtime);
    expect(await screen.findByText('The assessment didn’t load. Nothing was lost.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await form()).toBeVisible();
  });

  it('an undecided permission (a colleague’s assessment): says so plainly, values kept', async () => {
    // The sample world has no co-teaching colleague (OD-B4-17 open): the port's answer is staged.
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    answerSettingsWith(runtime, { kind: 'policy-open', decision: 'OD-B4-17' });
    showSettings(runtime);
    await form();
    await typeInto(user, RULES_WORDS.attempts, '3');
    await user.click(saveButton());
    await waitFor(() =>
      expect(answerSlot()).toHaveTextContent('These settings can’t be saved yet'),
    );
    expect(answerSlot()).toHaveTextContent(
      'Whether you can change this assessment hasn’t been decided yet. Nothing was saved.',
    );
    expect(answerSlot()).not.toHaveTextContent('OD-B4-17');
    expect(answerSlot()).toHaveFocus();
    expect(field(RULES_WORDS.attempts).value).toBe('3');
  });

  it('a save answered not found (the assessment left his scope meanwhile): the in-shell not-found', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    answerSettingsWith(runtime, { kind: 'not-found' });
    renderInTab(
      <TestNotFoundBoundary fallback={<p>not found</p>}>
        <AssessmentSettings assessmentId={ASMT} />
      </TestNotFoundBoundary>,
      { runtime, navigation: testNavigation(`/faculty/assessments/${ASMT}/settings`) },
    );
    await form();
    await typeInto(user, RULES_WORDS.attempts, '3');
    await user.click(saveButton());
    expect(await screen.findByText('not found')).toBeVisible();
  });

  it('not found: the in-shell not-found, whichever it is', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    renderInTab(
      <TestNotFoundBoundary fallback={<p>not found</p>}>
        <AssessmentSettings assessmentId="ASMT-0999" />
      </TestNotFoundBoundary>,
      { runtime, navigation: testNavigation('/faculty/assessments/ASMT-0999/settings') },
    );
    expect(await screen.findByText('not found')).toBeVisible();
    // Dr Anita Desai teaches no course: ASMT-0009 is not hers.
    const desai = await tabPlatform('per-0015', 'after-flow-d');
    renderInTab(
      <TestNotFoundBoundary fallback={<p>not hers</p>}>
        <AssessmentSettings assessmentId={ASMT} />
      </TestNotFoundBoundary>,
      {
        runtime: desai.runtime,
        navigation: testNavigation(`/faculty/assessments/${ASMT}/settings`),
      },
    );
    expect(await screen.findByText('not hers')).toBeVisible();
  });
});

// ---- FA-10: a draft, nothing pre-filled -------------------------------------------------------

describe('FA-10 Settings — a new draft', () => {
  it('every rule empty, no option chosen; partial rules save without a warning', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const id = await saveDraft(runtime);
    showSettings(runtime, id);
    await form();
    expect(main().querySelector('.fa-rec-meta')).toHaveTextContent('Draft — not ready');
    expect(main().querySelector('.fa-rec .fa-fig')).toHaveTextContent('DeadlineNot set yet');
    expect(field(RULES_WORDS.name).value).toBe('Heat Exchanger — draft');
    for (const label of [RULES_WORDS.introduction, RULES_WORDS.passMark, RULES_WORDS.attempts]) {
      expect(field(label).value, label).toBe('');
    }
    expect(field(RULES_WORDS.deadline).value).toBe('');
    for (const name of [/Immediately after marking/, /After the deadline/, /On a date/]) {
      expect(radio(name).checked).toBe(false);
    }
    expect(screen.getByRole('complementary', { name: 'How changes apply' })).toHaveTextContent(
      'No one has submitted version 1 yet, so changes apply to it directly.',
    );
    // No one has submitted a draft: no warning, whatever changes.
    await typeInto(user, RULES_WORDS.passMark, '40');
    await user.click(radio(/After the deadline/));
    expect(warnings()).toEqual([]);
    await user.click(saveButton());
    await waitFor(() => expect(answerSlot()).toHaveTextContent(/^Settings saved\./));
    expect(answerSlot()).not.toHaveTextContent('version');
    const saved = (await record(runtime, id)).assessment;
    expect(saved.rules).toMatchObject({
      passMarkPercent: 40,
      attemptsAllowed: null,
      deadline: null,
      release: { option: 'after-deadline', releaseDate: null },
    });
  });
});

// ---- FA-11: the preview ---------------------------------------------------------------------------

/** The questions' heads, as the page shows them: the place and type, the marks. */
const cardHeads = () =>
  [...main().querySelectorAll('li.fa-pvq .fa-sheetq-h')].map((head) =>
    [...head.children].map((child) => child.textContent),
  );

describe('FA-11 Preview — Student view', () => {
  it('the pinned questions as a student sees them, nothing marked, nothing written', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    const before = worldOf(sample).worldVersion;
    showPreview(runtime);
    const viewSwitch = await screen.findByRole('group', { name: 'Preview as' });
    expect(screen.getByRole('heading', { level: 1, name: NAME })).toBeVisible();
    await waitFor(() => expect(document.title).toMatch(/^Preview · /));
    expect(within(tabs()).getByRole('link', { name: 'Preview' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('region', { name: 'Preview' })).toHaveClass('fa-pvsurf');
    expect(within(viewSwitch).getByRole('button', { name: 'Student view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(main().querySelector('.fa-pvbar .rk-hint')).toHaveTextContent(
      'Previewing creates no attempt and saves nothing.',
    );
    const head = main().querySelector('.fa-pvhead')!;
    expect(head).not.toHaveClass('fa-pvhead--key');
    expect(head.querySelector('.fa-pvhead-k')).toHaveTextContent('As students see it');
    expect(head.querySelector('.fa-pvhead-t')).toHaveTextContent(NAME);
    expect(head.querySelector('.fa-pvhead-d')).toHaveTextContent(
      '4 questions · 16 marks · due 14 Nov 2026, 23:59 · no time limit',
    );
    expect(cardHeads()).toEqual([
      ['Question 1 of 4 · Multiple choice', '2 marks'],
      ['Question 2 of 4 · Multiple choice', '2 marks'],
      ['Question 3 of 4 · True or false', '2 marks'],
      ['Question 4 of 4 · Written answer', '10 marks'],
    ]);
    const cards = [...main().querySelectorAll('li.fa-pvq')];
    expect(cards[0]!.querySelector('.fa-pvq-t')).toHaveTextContent(
      'What does the effectiveness (ε) of a heat exchanger compare?',
    );
    expect(
      [...cards[0]!.querySelectorAll('li.fa-opt')].map((option) => option.textContent),
    ).toEqual([
      'The actual heat transfer with the largest heat transfer possible',
      'The hot-side flow rate with the cold-side flow rate',
      'The overall heat transfer coefficient with the surface area',
      'The hot fluid’s inlet temperature with its outlet temperature',
    ]);
    expect(
      [...cards[2]!.querySelectorAll('li.fa-opt')].map((option) => option.textContent),
    ).toEqual(['True', 'False']);
    expect(cards[3]!.querySelector('.fa-wbox')).toHaveTextContent(
      'The student’s written answer goes here. Your faculty marks written answers.',
    );
    // Nothing answerable, nothing marked: a picture of the sheet.
    expect(within(main()).queryAllByRole('radio')).toHaveLength(0);
    expect(within(main()).queryAllByRole('textbox')).toHaveLength(0);
    expect(main().querySelector('.fa-opt.is-correct')).toBeNull();
    // Nothing of the key in the student view.
    expect(main()).not.toHaveTextContent(/Correct|Explanation|Marking guidance/);
    // A read: no attempt, nothing saved.
    expect(worldOf(sample).worldVersion).toBe(before);
    expectNoReferences();
  });
});

describe('FA-11 Preview — Answer key', () => {
  it('the switch mirrors into `?view=key`; the correct answers, explanations and guidance', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    const before = worldOf(sample).worldVersion;
    const { navigation } = showPreview(runtime);
    const viewSwitch = await screen.findByRole('group', { name: 'Preview as' });
    await user.click(within(viewSwitch).getByRole('button', { name: 'Answer key' }));
    expect(navigation.replace).toHaveBeenLastCalledWith(
      `/faculty/assessments/${ASMT}/preview?view=key`,
    );
    expect(within(viewSwitch).getByRole('button', { name: 'Answer key' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const head = main().querySelector('.fa-pvhead.fa-pvhead--key')!;
    expect(head).toHaveTextContent(
      'Answer keyOnly you see the answer key and the marking guidanceStudents see correct answers and explanations only when their result is released.',
    );
    const cards = [...main().querySelectorAll('li.fa-pvq')];
    expect(cards).toHaveLength(4);
    const correctOf = (card: Element) =>
      [...card.querySelectorAll('li.fa-opt.is-correct')].map((option) => option.textContent);
    expect(cards.slice(0, 3).map(correctOf)).toEqual([
      ['The actual heat transfer with the largest heat transfer possibleCorrect'],
      ['UA ÷ C_minCorrect'],
      ['TrueCorrect'],
    ]);
    const parts = (card: Element) =>
      [...card.querySelectorAll('.fa-guide-k, .fa-expl-k')].map((part) => part.textContent);
    expect(cards.map(parts)).toEqual([
      ['Explanation'],
      ['Explanation'],
      ['Explanation'],
      ['Marking guidance · only you see this', 'Explanation'],
    ]);
    expect(cards[0]).toHaveTextContent('ε = q ÷ q_max, where q_max = C_min (T_h,in − T_c,in).');
    expect(cards[3]!.querySelector('.fa-guide .fa-guide-t')?.textContent).toBeTruthy();
    expect(cards[3]!.querySelector('.fa-opt')).toBeNull();
    expect(cards[3]!.querySelector('.fa-wbox')).toBeNull();
    // No inputs in the key.
    expect(within(main()).queryAllByRole('radio')).toHaveLength(0);

    await user.click(within(viewSwitch).getByRole('button', { name: 'Student view' }));
    expect(navigation.replace).toHaveBeenLastCalledWith(`/faculty/assessments/${ASMT}/preview`);
    expect(main()).not.toHaveTextContent('Marking guidance');
    expect(worldOf(sample).worldVersion).toBe(before);
  });

  it('`?view=key` opens on the key; any other view becomes the bare address', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    const { navigation } = showPreview(runtime, ASMT, '?view=key');
    expect(await screen.findByText(PREVIEW_PAGE.keyTitle)).toBeVisible();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('an unknown view shows the student view and normalises the address', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    const { navigation } = showPreview(runtime, ASMT, '?view=marks');
    expect(await screen.findByText('As students see it')).toBeVisible();
    expect(navigation.replace).toHaveBeenCalledWith(`/faculty/assessments/${ASMT}/preview`);
  });
});

describe('FA-11 Preview — pinned versions, drafts, failures', () => {
  it('a bank edit does not reach the preview until “Use updated version”', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showPreview(runtime);
    const original = 'What does the effectiveness (ε) of a heat exchanger compare?';
    const edited = 'What does a heat exchanger’s effectiveness (ε) compare?';
    const words = () =>
      [...main().querySelectorAll('li.fa-pvq .fa-pvq-t')].map((text) => text.textContent);
    await waitFor(() => expect(words()[0]).toBe(original));
    const question = await runtime.ports.questionBank.getQuestion('Q-0101' as QuestionId);
    if (!question.ok) throw new Error('Q-0101');
    const current = question.value.question;
    if (current.body.type !== 'multiple-choice') throw new Error('Q-0101 type');
    await act(async () => {
      const result = await runtime.ports.questionBank.editQuestion({
        id: current.id,
        experimentId: SHELL as ExperimentId,
        type: 'multiple-choice',
        text: edited,
        options: current.body.type === 'multiple-choice' ? current.body.options : {},
        correct: 'A',
        marks: '2',
        explanation: current.explanation,
        markingGuidance: null,
        expectedRev: current.rev,
      });
      if (!result.ok) throw new Error(`editQuestion ${result.error.kind}`);
      await runtime.invalidate(result.changed);
    });
    // The assessment keeps its pinned version.
    expect(words()[0]).toBe(original);
    expect(words()).not.toContain(edited);

    await act(async () => {
      const asmt = (await record(runtime)).assessment;
      const used = await runtime.ports.assessments.useUpdatedVersion({
        id: asmt.id,
        questionId: 'Q-0101' as QuestionId,
        expectedRev: asmt.rev,
      });
      if (!used.ok) throw new Error(`useUpdatedVersion ${used.error.kind}`);
      await runtime.invalidate(used.changed);
    });
    await waitFor(() => expect(words()[0]).toBe(edited));
  });

  it('a draft without questions: nothing to preview, with Add questions; with questions and no deadline: “no deadline yet”', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const empty = await saveDraft(runtime);
    const first = showPreview(runtime, empty);
    expect(await screen.findByText('Nothing to preview yet')).toBeVisible();
    const state = main().querySelector('.fa-pvsheet .rk-state')!;
    expect(state).toHaveTextContent(
      'Nothing to preview yetAdd a question first. Students can’t see an assessment without questions.Add questions',
    );
    expect(
      within(state as HTMLElement).getByRole('link', { name: 'Add questions' }),
    ).toHaveAttribute('href', `/faculty/assessments/${empty}/questions`);
    first.view.unmount();
    forgetLastAddress();

    const { runtime: other } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const withQuestions = await saveDraft(other, ['Q-0101', 'Q-0106']);
    showPreview(other, withQuestions);
    expect(await screen.findByText('As students see it')).toBeVisible();
    expect(main().querySelector('.fa-pvhead-d')).toHaveTextContent(
      '2 questions · 12 marks · no deadline yet · no time limit',
    );
  });

  it('the preview failing to load has Try again, which reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    faults(sample).failNext('AssessmentService.previewAsStudent');
    showPreview(runtime);
    const alert = await screen.findByRole('alert');
    expect(
      within(alert).getByRole('heading', { level: 2, name: 'We couldn’t load the preview' }),
    ).toBeVisible();
    expect(alert).toHaveTextContent('Nothing has changed, and no attempt was created. Try again.');
    // The frame stays: the record band and tabs above the failure.
    expect(screen.getByRole('heading', { level: 1, name: NAME })).toBeVisible();
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('group', { name: 'Preview as' })).toBeVisible();
  });
});

// ---- The link-target ledger ---------------------------------------------------------------------

describe('FA-10 / FA-11 link targets', () => {
  const rows = LINK_TARGET_LEDGER.filter(
    (entry) => entry.screen === 'FA-10' || entry.screen === 'FA-11',
  );

  it('one primary on Settings (the save command), none on Preview', () => {
    expect(
      rows
        .filter((entry) => entry.role === 'primary')
        .map((entry) => `${entry.screen} ${entry.action}`),
    ).toEqual(['FA-10 Save settings']);
  });

  it('every built target resolves (Submissions since FA-12 is built)', () => {
    for (const entry of rows) {
      if (entry.outcome === 'built') {
        // A colleague's preview offers Help (a workspace screen); the rest are record tabs.
        expect(resolveAddress(expandTarget(entry.target!, '/faculty')).kind, entry.action).toBe(
          entry.action === 'Help' ? 'screen' : 'record-screen',
        );
      }
    }
    expect(rows.filter((entry) => entry.outcome === 'not-rendered')).toEqual([]);
  });
});

/** A submitted attempt's assessment version in the world (Rahul's ATT-0450 keeps version 1). */
function attemptVersion(sample: Sample, id: string): number {
  const attempts = Object.values(worldOf(sample).records.attempts) as readonly {
    readonly id: string;
    readonly assessmentVersion: number;
  }[];
  return attempts.find((attempt) => attempt.id === id)!.assessmentVersion;
}

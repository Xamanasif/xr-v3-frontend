/**
 * FA-10 Assessment · Settings and FA-11 Assessment · Preview (board B4-06 f0 … f6) on the real
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
import { RULES_FORM, rulesChecklistLine } from '@/copy/assessment-words';
import { STATE_COPY, type StateCopyEntry } from '@/copy/state-copy';
import { expandTarget, LINK_TARGET_LEDGER } from '@/nav/link-targets';
import { resolveAddress } from '@/nav/routes';
import type { PlatformRuntime } from '@/platform/runtime';
import { board } from '@/test-support/boards';
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

/** B4-06's text with tags removed (the drawn words this page quotes). */
const B4_06_RAW = board('B4-06-Settings-Preview-Submissions.dc.html');
const B4_06 = `${B4_06_RAW.replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')}\n${B4_06_RAW}`;

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
const answerSlot = () => document.getElementById('Es-saved')!;
const warnings = () =>
  [...main().querySelectorAll('.xr-notice--warn .xr-notice-title')].map((node) => node.textContent);

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

// ---- FA-10 f0, f4: the record's own values ------------------------------------------------

describe('FA-10 Settings — as set (B4-06 f0, f4)', () => {
  it('the frame, the record’s values, the drawn foot; no release control', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSettings(runtime);
    await form();
    expect(screen.getByRole('heading', { level: 1, name: NAME })).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Settings');
    expect(main().querySelector('.xw-hubhead .xr-overline')).toHaveTextContent(
      'ME ZG523 · Shell-and-Tube Heat Exchanger',
    );
    expect(main().querySelector('.xa-headfacts')).toHaveTextContent('Due 14 Nov 2026, 23:59');
    const tabs = screen.getByRole('navigation', { name: NAME });
    expect(within(tabs).getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // Submissions (FA-12, Phase 4B): the fifth tab, with the Students who have submitted.
    expect(within(tabs).getByRole('link', { name: /^Submissions/ })).toHaveTextContent(
      'Submissions 1',
    );

    expect(field(RULES_FORM.name).value).toBe(NAME);
    expect(field('Introduction (optional)').value).toBe('');
    expect(field(RULES_FORM.passMark).value).toBe('50');
    expect(field(RULES_FORM.attempts).value).toBe('2');
    expect(field(RULES_FORM.deadline).value).toBe('14 Nov 2026, 23:59');
    expect(radio(/After the deadline/).checked).toBe(true);
    expect(radio(/Immediately after marking/).checked).toBe(false);
    expect(radio(/On a date/).checked).toBe(false);
    expect(screen.queryByLabelText(RULES_FORM.releaseDate)).toBeNull();
    expect(main()).toHaveTextContent(RULES_FORM.noTimerSettings);
    expect(warnings()).toEqual([]);
    expect(answerSlot()).toBeEmptyDOMElement();

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass('xr-btn', 'xr-btn--text');
    expect(saveButton()).toHaveClass('xr-btn--primary');
    expect(main().querySelectorAll('.xr-btn--primary')).toHaveLength(1);
    // Configuration only: nothing releases, publishes, closes or times anything (D4, T-18, T-22).
    expect(main().textContent).not.toMatch(
      /release results|release now|make available|publish|close assessment|timer|time limit:/i,
    );
    // The drawn markup: the section, the field ids the error summary links to, the foot.
    const section = main().querySelector('form.xr-section')!;
    expect(section.parentElement).toHaveClass('max-w-[820px]');
    for (const id of ['Es-name', 'Es-intro', 'Es-pass', 'Es-att', 'Es-dl', 'Es-rel']) {
      expect(document.getElementById(id), id).not.toBeNull();
    }
    expect(section.querySelector('.xw-flow-foot .xw-actions .xr-btn--primary')).toBe(saveButton());
  });

  it('every drawn word on this page is on B4-06', () => {
    for (const words of [
      SETTINGS_PAGE.summaryTitle,
      SETTINGS_PAGE.save,
      SETTINGS_PAGE.saving,
      SETTINGS_PAGE.saved,
      SETTINGS_PAGE.newVersionTitle,
      PREVIEW_PAGE.viewLabel,
      PREVIEW_PAGE.studentView,
      PREVIEW_PAGE.answerKey,
      PREVIEW_PAGE.createsNothing,
      PREVIEW_PAGE.keyLine,
      PREVIEW_PAGE.writtenHint,
      PREVIEW_PAGE.markingGuidance,
      RULES_FORM.noTimerSettings,
    ]) {
      expect(B4_06, words).toContain(words);
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

// ---- FA-10 f1, f2: the warnings, then the save -------------------------------------------------

describe('FA-10 Settings — after a submission (B4-06 f1, f2)', () => {
  it('a changed pass mark warns of a new version; the save makes version 2 and the world has it', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSettings(runtime);
    await form();
    await typeInto(user, RULES_FORM.passMark, '60');
    expect(warnings()).toEqual([SETTINGS_PAGE.newVersionTitle]);
    expect(main().querySelector('.xr-notice--warn')).toHaveTextContent(
      '1 student has submitted. Their submission keeps the rules they answered under; new attempts use these.',
    );
    // The notice sits after the result choice and before the "no time limit" line (f1).
    const notice = main().querySelector('.xr-notice--warn')!;
    expect(notice.getAttribute('role')).toBe('status');
    // Putting the value back takes the warning away (compared with the record).
    await typeInto(user, RULES_FORM.passMark, '50');
    expect(warnings()).toEqual([]);
    await typeInto(user, RULES_FORM.passMark, '60');

    await user.click(saveButton());
    await waitFor(() =>
      expect(answerSlot()).toHaveTextContent(
        'Settings saved as version 2. Earlier submissions keep the version they answered.',
      ),
    );
    expect(answerSlot()).toHaveFocus();
    expect(answerSlot().querySelector('.xr-notice--ok[role="status"]')).not.toBeNull();
    expect(warnings()).toEqual([]);
    expect(field(RULES_FORM.passMark).value).toBe('60');

    // The one world: the record read again has the new rule and version — what FA-08 shows.
    const saved = await record(runtime);
    expect(saved.assessment.rules.passMarkPercent).toBe(60);
    expect(saved.assessment.version).toBe(2);
    expect(rulesChecklistLine(saved.assessment.rules)).toBe(
      'Rules: pass mark 60%, 2 attempts, due 14 Nov 2026, 23:59, results after the deadline',
    );
    // Rahul's submission keeps version 1.
    expect(attemptVersion(sample, 'ATT-0450')).toBe(1);
  });

  it('a changed result option warns that it makes a new version, and that submissions keep their terms (P4-06)', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSettings(runtime);
    await form();
    await user.click(radio(/Immediately after marking/));
    // The domain versions a release change like any rule: f1 shows with f2 (Phase 4A review).
    expect(warnings()).toEqual([SETTINGS_PAGE.newVersionTitle, SETTINGS_PAGE.releaseTitle]);
    expect(SETTINGS_PAGE.releaseTitle).toBe('This changes when students see their result');
    expect(main().querySelectorAll('.xr-notice--warn')[1]).toHaveTextContent(
      '1 student has submitted. Submissions already made keep the result terms of the version they answered; new attempts use these.',
    );

    await user.click(saveButton());
    await waitFor(() =>
      expect(answerSlot()).toHaveTextContent(
        'Settings saved as version 2. Earlier submissions keep the version they answered. New attempts release their result immediately after marking.',
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
    await typeInto(user, RULES_FORM.attempts, '3');
    expect(warnings()).toEqual([]);
  });

  it('“On a date” asks for the release date; the typed date and time is saved', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSettings(runtime);
    await form();
    await user.click(radio(/On a date/));
    expect(field(RULES_FORM.releaseDate)).toHaveAccessibleDescription(RULES_FORM.releaseDateHint);
    await user.click(saveButton());
    // The service's drawn word for the missing date, in the summary and on the field.
    const summary = await screen.findByRole('alert');
    expect(summary).toHaveAttribute('id', 'Es-err');
    expect(within(summary).getByText(SETTINGS_PAGE.summaryTitle)).toBeVisible();
    expect(within(summary).getByRole('link', { name: 'Enter the release date' })).toHaveAttribute(
      'href',
      '#Es-reldate',
    );
    await typeInto(user, RULES_FORM.releaseDate, '20 Nov 2026, 09:00');
    expect(screen.queryByRole('alert')).toBeNull();
    await user.click(saveButton());
    await waitFor(() =>
      expect(answerSlot()).toHaveTextContent(
        'New attempts release their result on 20 Nov 2026, 09:00.',
      ),
    );
    expect(field(RULES_FORM.releaseDate).value).toBe('20 Nov 2026, 09:00');
  });

  it('a new deadline typed as drawn is saved and the header reads it', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSettings(runtime);
    await form();
    // Typed without the comma: the same date and time reads the same (no warning).
    await typeInto(user, RULES_FORM.deadline, '14 Nov 2026 23:59');
    expect(warnings()).toEqual([]);
    await typeInto(user, RULES_FORM.deadline, '20 Nov 2026, 23:59');
    expect(warnings()).toEqual([SETTINGS_PAGE.newVersionTitle]);
    await user.click(saveButton());
    await waitFor(() =>
      expect(main().querySelector('.xa-headfacts')).toHaveTextContent('Due 20 Nov 2026, 23:59'),
    );
    expect(field(RULES_FORM.deadline).value).toBe('20 Nov 2026, 23:59');
    expect((await record(runtime)).assessment.rules.deadline).toBe('2026-11-20T18:29:00.000Z');
  });

  it('Cancel puts the record’s values back and clears errors and warnings', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSettings(runtime);
    await form();
    const before = worldOf(sample).worldVersion;
    await typeInto(user, RULES_FORM.name, '');
    await typeInto(user, RULES_FORM.passMark, '150');
    await user.click(radio(/On a date/));
    await user.click(saveButton());
    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(field(RULES_FORM.name).value).toBe(NAME);
    expect(field(RULES_FORM.passMark).value).toBe('50');
    expect(radio(/After the deadline/).checked).toBe(true);
    expect(screen.queryByLabelText(RULES_FORM.releaseDate)).toBeNull();
    expect(warnings()).toEqual([]);
    expect(main().querySelectorAll('.xr-error')).toHaveLength(0);
    expect(worldOf(sample).worldVersion).toBe(before);
  });
});

// ---- FA-10 validation, refusals, failures ------------------------------------------------------

describe('FA-10 Settings — the service’s checks and answers', () => {
  it('the drawn field errors and “Check these settings”, which takes focus; nothing is saved', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSettings(runtime);
    await form();
    const before = (await record(runtime)).assessment.rev;
    await typeInto(user, RULES_FORM.name, '');
    await typeInto(user, RULES_FORM.passMark, '150');
    await typeInto(user, RULES_FORM.attempts, '0');
    await typeInto(user, RULES_FORM.deadline, 'next Friday');
    await user.click(saveButton());
    const summary = await screen.findByRole('alert');
    expect(summary).toHaveClass('xw-errsum');
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
    expect(field(RULES_FORM.passMark)).toHaveAttribute('aria-invalid', 'true');
    expect(field(RULES_FORM.passMark)).toHaveAccessibleDescription(
      `${RULES_FORM.passMarkHint} Enter a pass mark from 0 to 100, as a whole number`,
    );
    // A summary link moves focus to its field.
    await user.click(within(summary).getByRole('link', { name: /attempts/ }));
    expect(field(RULES_FORM.attempts)).toHaveFocus();
    // Typing in a field clears its error (and its summary entry).
    await typeInto(user, RULES_FORM.passMark, '55');
    expect(field(RULES_FORM.passMark)).not.toHaveAttribute('aria-invalid');
    expect(within(screen.getByRole('alert')).getAllByRole('link')).toHaveLength(2);
    await typeInto(user, RULES_FORM.attempts, '3');
    await typeInto(user, RULES_FORM.deadline, '20 Nov 2026, 23:59');
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
      expect(answerSlot()).toHaveTextContent('Nothing has changed, so there was nothing to save.'),
    );
    expect(answerSlot()).toHaveFocus();
    expect((await record(runtime)).assessment.version).toBe(1);
  });

  it('changed elsewhere meanwhile: read again, typed values kept, the next save goes through', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSettings(runtime);
    await form();
    await typeInto(user, RULES_FORM.passMark, '60');
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
    expect(answerSlot()).toHaveFocus();
    expect(field(RULES_FORM.passMark).value).toBe('60');
    // Cancel would now show the current settings; saving again uses the current revision.
    await user.click(saveButton());
    await waitFor(() => expect(answerSlot()).toHaveTextContent('Settings saved as version 2.'));
    expect((await record(runtime)).assessment.rules.passMarkPercent).toBe(60);
  });

  it('failed for now: “didn’t save”, every value kept, nothing written', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showSettings(runtime);
    await form();
    await typeInto(user, RULES_FORM.attempts, '3');
    faults(sample).failNext('AssessmentService.updateSettings');
    await user.click(saveButton());
    await waitFor(() => expect(answerSlot()).toHaveTextContent('Your settings didn’t save'));
    expect(answerSlot().querySelector('.xr-notice--err')).toHaveAttribute('role', 'alert');
    expect(answerSlot()).toHaveTextContent(
      'Nothing was changed and your values are still here. Try again.',
    );
    expect(field(RULES_FORM.attempts).value).toBe('3');
    expect(warnings()).toEqual([SETTINGS_PAGE.newVersionTitle]);
    expect((await record(runtime)).assessment.rules.attemptsAllowed).toBe(2);
    // Typing again clears the message; the next save goes through.
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
    await typeInto(user, RULES_FORM.attempts, '3');
    await user.click(saveButton());
    await waitFor(() =>
      expect(answerSlot()).toHaveTextContent('These settings can’t be saved yet'),
    );
    expect(answerSlot()).toHaveTextContent(
      'Whether you can change this assessment hasn’t been decided yet. Nothing was saved.',
    );
    expect(answerSlot()).not.toHaveTextContent('OD-B4-17');
    expect(answerSlot()).toHaveFocus();
    expect(field(RULES_FORM.attempts).value).toBe('3');
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
    await typeInto(user, RULES_FORM.attempts, '3');
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

// ---- FA-10 f3: a draft, nothing pre-filled ------------------------------------------------------

describe('FA-10 Settings — a new draft (B4-06 f3)', () => {
  it('every rule empty, no option chosen; partial rules save without a warning', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const id = await saveDraft(runtime);
    showSettings(runtime, id);
    await form();
    expect(main().querySelector('.xw-hubhead')).toHaveTextContent('Draft — not ready');
    expect(main().querySelector('.xa-headfacts')).toBeNull();
    expect(field(RULES_FORM.name).value).toBe('Heat Exchanger — draft');
    for (const label of ['Introduction (optional)', RULES_FORM.passMark, RULES_FORM.attempts]) {
      expect(field(label).value, label).toBe('');
    }
    expect(field(RULES_FORM.deadline).value).toBe('');
    for (const name of [/Immediately after marking/, /After the deadline/, /On a date/]) {
      expect(radio(name).checked).toBe(false);
    }
    // No one has submitted a draft: no warning, whatever changes.
    await typeInto(user, RULES_FORM.passMark, '40');
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

// ---- FA-11 f5, f6: the preview ------------------------------------------------------------------

/** The question cards' headings, as the page shows them (capitals are CSS). */
const cardHeads = () =>
  [...main().querySelectorAll('.xa-q .xa-q-head')].map((head) =>
    [...head.children].map((child) => child.textContent),
  );

describe('FA-11 Preview — Student view (B4-06 f5)', () => {
  it('the pinned questions as a student sees them, nothing marked, nothing written', async () => {
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    const before = worldOf(sample).worldVersion;
    showPreview(runtime);
    const viewSwitch = await screen.findByRole('group', { name: 'Preview as' });
    expect(screen.getByRole('heading', { level: 1, name: NAME })).toBeVisible();
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Preview');
    expect(
      within(screen.getByRole('navigation', { name: NAME })).getByRole('link', {
        name: 'Preview',
      }),
    ).toHaveAttribute('aria-current', 'page');
    expect(within(viewSwitch).getByRole('button', { name: 'Student view' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(main().querySelector('p.xl-open')).toHaveTextContent(
      'Previewing creates no attempt and saves nothing.',
    );
    expect(main().querySelector('p.xl-meta')).toHaveTextContent(
      'As a student sees it: 4 questions · 16 marks · due 14 Nov 2026, 23:59 · no time limit.',
    );
    expect(cardHeads()).toEqual([
      ['Question 1 of 4 · Multiple choice', '2 marks'],
      ['Question 2 of 4 · Multiple choice', '2 marks'],
      ['Question 3 of 4 · True or false', '2 marks'],
      ['Question 4 of 4 · Written answer', '10 marks'],
    ]);
    const first = screen.getByRole('group', {
      name: 'What does the effectiveness (ε) of a heat exchanger compare?',
    });
    const options = within(first).getAllByRole('radio') as HTMLInputElement[];
    expect(options.map((option) => option.closest('label')?.textContent)).toEqual([
      'The actual heat transfer with the largest heat transfer possible',
      'The hot-side flow rate with the cold-side flow rate',
      'The overall heat transfer coefficient with the surface area',
      'The hot fluid’s inlet temperature with its outlet temperature',
    ]);
    expect(options.every((option) => option.disabled && !option.checked)).toBe(true);
    const truth = screen.getByRole('group', {
      name: 'Fouling on the tube surfaces lowers the overall heat transfer coefficient U.',
    });
    expect(
      within(truth)
        .getAllByRole('radio')
        .map((option) => option.closest('label')?.textContent),
    ).toEqual(['True', 'False']);
    expect(screen.getByRole('textbox', { name: 'Answer to question 4 (preview)' })).toBeDisabled();
    expect(main()).toHaveTextContent('Your faculty marks written answers.');
    // Nothing of the key in the student view.
    expect(main()).not.toHaveTextContent(/Correct|Explanation|Marking guidance/);
    expect(main().querySelector('.xa-mk')).toBeNull();
    // A read: no attempt, nothing saved.
    expect(worldOf(sample).worldVersion).toBe(before);
  });
});

describe('FA-11 Preview — Answer key (B4-06 f6)', () => {
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
    expect(main().querySelector('p.xl-meta')).toHaveTextContent(
      'Only you see the answer key and the marking guidance.',
    );
    const cards = [...main().querySelectorAll('li.xa-q')];
    expect(cards).toHaveLength(4);
    const correctOf = (card: Element) =>
      card.querySelector('.xa-mk.is-ok')?.closest('li')?.lastElementChild?.textContent;
    expect(cards.slice(0, 3).map(correctOf)).toEqual([
      'The actual heat transfer with the largest heat transfer possible',
      'UA ÷ C_min',
      'True',
    ]);
    expect(cards[0]!.querySelectorAll('.xa-mk.is-ok')).toHaveLength(1);
    const rows = (card: Element) =>
      [...card.querySelectorAll('.xa-ans-row')].map((row) => row.firstElementChild?.textContent);
    expect(cards.map(rows)).toEqual([
      ['Explanation'],
      ['Explanation'],
      ['Explanation'],
      ['Marking guidance', 'Explanation'],
    ]);
    expect(cards[0]).toHaveTextContent('ε = q ÷ q_max, where q_max = C_min (T_h,in − T_c,in).');
    expect(cards[3]!.querySelector('.xa-ans-row')).toHaveTextContent(/^Marking guidance\S/);
    expect(cards[3]!.querySelector('.xa-mk')).toBeNull();
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
    expect(await screen.findByText(PREVIEW_PAGE.keyLine)).toBeVisible();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('an unknown view shows the student view and normalises the address', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    const { navigation } = showPreview(runtime, ASMT, '?view=marks');
    expect(await screen.findByText(/^As a student sees it:/)).toBeVisible();
    expect(navigation.replace).toHaveBeenCalledWith(`/faculty/assessments/${ASMT}/preview`);
  });
});

describe('FA-11 Preview — pinned versions, drafts, failures', () => {
  it('a bank edit does not reach the preview until “Use updated version”', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    showPreview(runtime);
    const original = 'What does the effectiveness (ε) of a heat exchanger compare?';
    expect(await screen.findByRole('group', { name: original })).toBeVisible();
    const question = await runtime.ports.questionBank.getQuestion('Q-0101' as QuestionId);
    if (!question.ok) throw new Error('Q-0101');
    const current = question.value.question;
    if (current.body.type !== 'multiple-choice') throw new Error('Q-0101 type');
    await act(async () => {
      const edited = await runtime.ports.questionBank.editQuestion({
        id: current.id,
        experimentId: SHELL as ExperimentId,
        type: 'multiple-choice',
        text: 'What does a heat exchanger’s effectiveness (ε) compare?',
        options: current.body.type === 'multiple-choice' ? current.body.options : {},
        correct: 'A',
        marks: '2',
        explanation: current.explanation,
        markingGuidance: null,
        expectedRev: current.rev,
      });
      if (!edited.ok) throw new Error(`editQuestion ${edited.error.kind}`);
      await runtime.invalidate(edited.changed);
    });
    // The assessment keeps its pinned version.
    expect(screen.getByRole('group', { name: original })).toBeVisible();
    expect(
      screen.queryByRole('group', {
        name: 'What does a heat exchanger’s effectiveness (ε) compare?',
      }),
    ).toBeNull();

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
    expect(
      await screen.findByRole('group', {
        name: 'What does a heat exchanger’s effectiveness (ε) compare?',
      }),
    ).toBeVisible();
  });

  it('a draft without questions: the empty state; with questions and no deadline: no “due”', async () => {
    const { runtime } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const empty = await saveDraft(runtime);
    const first = showPreview(runtime, empty);
    expect(
      await screen.findByRole('heading', { level: 2, name: 'No questions to preview yet' }),
    ).toBeVisible();
    expect(main()).toHaveTextContent(
      'Questions you add on the Questions tab appear here as students will see them.',
    );
    expect(screen.queryByRole('group', { name: 'Preview as' })).toBeNull();
    first.view.unmount();
    forgetLastAddress();

    const { runtime: other } = await tabPlatform(RANGANATHAN, 'after-flow-c');
    const withQuestions = await saveDraft(other, ['Q-0101', 'Q-0106']);
    showPreview(other, withQuestions);
    expect(await screen.findByText(/^As a student sees it:/)).toHaveTextContent(
      'As a student sees it: 2 questions · 12 marks · no time limit.',
    );
  });

  it('the preview failing to load has Try again, which reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(RANGANATHAN, 'after-flow-d');
    faults(sample).failNext('AssessmentService.previewAsStudent');
    showPreview(runtime);
    expect(await screen.findByText('The preview didn’t load. Nothing was lost.')).toBeVisible();
    // The frame stays: header and tabs above the failure.
    expect(screen.getByRole('heading', { level: 1, name: NAME })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
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
        expect(resolveAddress(expandTarget(entry.target!, '/faculty')).kind, entry.action).toBe(
          'record-screen',
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

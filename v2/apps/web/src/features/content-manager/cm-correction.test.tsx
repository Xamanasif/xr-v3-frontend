/**
 * Phase 6's correction entry on CM-05 Published experiment (board B6-08 f0 … f4; B6-11 f9; B7-11
 * f4) and the CM-08 update page it opens — the draft of CM-06 / CM-07 and every later state (B6-09
 * f1 … f8; B6-11 f10, f11; B6-13 f0; B7-11 f3) — on the real composition root and the sample
 * world, as Kavya Nair. The entries open or join the one draft (never a second update) and land on
 * its page with the named field focused; the draft is pre-filled with the live version and
 * compared with it as typed; Send checks its three rules at once, then saves and sends through
 * DL-1; Withdraw needs a reason (DL-2); typed work survives leaving the page; a stale save is
 * refused and said calmly. Nothing here changes the live version.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ServiceError } from '@xr/contracts/draft';
import { asPersonId, faults } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import {
  renderInTab,
  TestNotFoundBoundary,
  tabPlatform,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { PublishedExperiment } from './cm-05-published/published-experiment';
import { Correction } from './cm-08-updates/correction';
import { forgetCorrectionDrafts, noteBackFromCorrection } from './cm-08-updates/correction-draft';
import { updateHistory } from './cm-08-updates/correction-view';

afterEach(() => {
  forgetLastAddress();
  forgetCorrectionDrafts();
  vi.restoreAllMocks();
});

const KAVYA = 'per-kavya-nair';
const MENON = 'per-a-menon';
const DISTILLATION = 'distillation-column';
const LIVE_DESCRIPTION =
  'Learners start a binary column from cold and bring it to steady state. They then change the reflux ratio and watch the overhead purity respond with realistic lag. Lowering the reflux ratio raises the overhead purity, at the cost of more reboiler heat.';
const NEW_DESCRIPTION = LIVE_DESCRIPTION.replace('Lowering the reflux', 'Raising the reflux');
const WHY =
  'Corrects the reflux statement in the description: raising the reflux ratio raises overhead purity — v1.2 says the opposite.';

function inShell(ui: ReactNode) {
  return (
    <WorkspaceLayout workspace="content-manager">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{ui}</TestNotFoundBoundary>
    </WorkspaceLayout>
  );
}

function showPublished(runtime: PlatformRuntime, experimentId = DISTILLATION) {
  const navigation = testNavigation(`/content-manager/published/${experimentId}`);
  const view = renderInTab(inShell(<PublishedExperiment experimentId={experimentId} />), {
    runtime,
    navigation,
  });
  return { navigation, view };
}

function showUpdate(runtime: PlatformRuntime, updateId: string, search = '') {
  const navigation = testNavigation(`/content-manager/updates/${updateId}`, search);
  const view = renderInTab(inShell(<Correction updateId={updateId} />), { runtime, navigation });
  return { navigation, view };
}

const main = () => screen.getByRole('main');
/** An element’s words, its text nodes joined by spaces (as a screen reader reads them). */
function text(element: Element | null): string {
  if (!element) return '';
  const parts: string[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    parts.push(node.textContent ?? '');
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}
const heading = (name: string | RegExp) =>
  screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });
const chip = () => text(main().querySelector('.xr-phead-meta .xr-status'));
const field = (label: string) =>
  within(main()).getByLabelText(label, { selector: 'input, textarea' }) as
    HTMLInputElement | HTMLTextAreaElement;
const historyWhat = () => [...main().querySelectorAll('.xr-tl-what')].map((node) => text(node));

/** One port's command answered with a refusal (the screen's handling of it, not the service). */
function answerWith(
  runtime: PlatformRuntime,
  method: 'saveCorrection' | 'sendForAcademicReview' | 'openCorrection',
  error: ServiceError,
): void {
  const real = runtime.withCommandId.bind(runtime);
  vi.spyOn(runtime, 'withCommandId').mockImplementation((commandId) => {
    const ports = real(commandId);
    return {
      ...ports,
      corrections: { ...ports.corrections, [method]: async () => ({ ok: false as const, error }) },
    } as typeof ports;
  });
}

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

async function openDraft(sample: Sample, entry = 'edit-catalogue-details' as const) {
  const opened = await asPersonId(sample, KAVYA).corrections.openCorrection({
    experimentId: DISTILLATION as never,
    entry,
  });
  if (!opened.ok) throw new Error(JSON.stringify(opened.error));
  return opened.value.update;
}

/** UPD-0005 saved with the reflux correction (Flow F's F1-save), then sent if asked. */
async function savedDraft(sample: Sample, send = false) {
  const cm = asPersonId(sample, KAVYA).corrections;
  const update = await openDraft(sample);
  const saved = await cm.saveCorrection({
    id: update.id,
    proposed: {
      ...update.proposed,
      description: NEW_DESCRIPTION,
      webLink: 'https://labs.meridian.example/distillation-column-1-3',
    },
    whatChangesAndWhy: WHY,
    versionLabel: '1.3',
    expectedRev: update.rev,
  });
  if (!saved.ok) throw new Error(JSON.stringify(saved.error));
  if (!send) return saved.value;
  const sent = await cm.sendForAcademicReview({ id: update.id, expectedRev: saved.value.rev });
  if (!sent.ok) throw new Error(JSON.stringify(sent.error));
  return sent.value;
}

async function updateOf(sample: Sample, id = 'UPD-0005') {
  const read = await asPersonId(sample, KAVYA).corrections.getUpdate(id as never);
  if (!read.ok) throw new Error(JSON.stringify(read.error));
  return read.value.update;
}

async function liveOf(sample: Sample) {
  const read = await asPersonId(sample, KAVYA).corrections.getPublishedExperiment(
    DISTILLATION as never,
  );
  if (!read.ok) throw new Error(JSON.stringify(read.error));
  return read.value.experiment.live;
}

describe('CM-05 the correction entry (B6-08 f0, f4; B6-13 f1)', () => {
  it('no update in progress: Start a correction (primary) · Edit catalogue details · Edit delivery link', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showPublished(runtime);
    await heading('Distillation Column');
    const actions = main().querySelector('.xw-actions')!;
    expect(
      within(actions as HTMLElement)
        .getAllByRole('button')
        .map((button) => [text(button), button.className]),
    ).toEqual([
      ['Start a correction', 'xr-btn xr-btn--primary'],
      ['Edit catalogue details', 'xr-btn xr-btn--secondary'],
      ['Edit delivery link', 'xr-btn xr-btn--secondary'],
    ]);
    expect(main().querySelector('.xr-notice')).toBeNull();
    // The actions sit between the header and the change line (B6-08 f0).
    expect(actions.nextElementSibling).toHaveTextContent(
      'Every change opens a correction draft. The live experiment changes only when the Super Admin releases it.',
    );
  });

  it('Edit catalogue details opens the one draft and its page, the summary focused (CM-06)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    const { navigation } = showPublished(runtime);
    await heading('Distillation Column');
    await user.click(within(main()).getByRole('button', { name: 'Edit catalogue details' }));
    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith(
        '/content-manager/updates/UPD-0005?focus=summary',
      ),
    );
    const update = await updateOf(sample);
    expect([update.state, update.entry, update.baseVersionLabel]).toEqual([
      'draft',
      'edit-catalogue-details',
      '1.2',
    ]);
    // The live version is unchanged.
    expect((await liveOf(sample)).label).toBe('1.2');
  });

  it('Start a correction lands with nothing focused; a refusal is said calmly', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    const { navigation } = showPublished(runtime);
    await heading('Distillation Column');
    await user.click(within(main()).getByRole('button', { name: 'Start a correction' }));
    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith('/content-manager/updates/UPD-0005'),
    );
  });

  it('an update already open elsewhere: the entry is refused and the page is read again', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    answerWith(runtime, 'openCorrection', {
      kind: 'refused',
      code: 'update-already-open',
    } as never);
    const { navigation } = showPublished(runtime);
    await heading('Distillation Column');
    await user.click(within(main()).getByRole('button', { name: 'Edit delivery link' }));
    expect(
      await within(main()).findByText(
        'An update is already open for this experiment. Its current state is shown.',
      ),
    ).toBeVisible();
    expect(navigation.navigate).not.toHaveBeenCalled();
  });

  it('failed for now: nothing has changed', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    showPublished(runtime);
    await heading('Distillation Column');
    faults(sample).failNext('CorrectionService.openCorrection' as never);
    await user.click(within(main()).getByRole('button', { name: 'Start a correction' }));
    expect(
      await within(main()).findByText(
        'The correction didn’t open. Nothing has changed — try again.',
      ),
    ).toBeVisible();
  });
});

describe('CM-05 an update in progress (B6-08 f1, f2, f3; B6-11 f9; B7-11 f4)', () => {
  it('a draft: Open update and the edit entries join it — never a second update (f2)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await openDraft(sample);
    const { navigation } = showPublished(runtime);
    await heading('Distillation Column');
    const notice = main().querySelector('.xr-notice--warn')!;
    expect(text(notice)).toBe(
      'An update is in progress — UPD-0005 · Draft Edits to this experiment join that update. Open it to continue.',
    );
    expect(notice.querySelector('a, button')).toBeNull();
    const actions = main().querySelector('.xw-actions') as HTMLElement;
    const open = within(actions).getByRole('link', { name: 'Open update' });
    expect(open).toHaveAttribute('href', '/content-manager/updates/UPD-0005');
    expect(open).toHaveClass('xr-btn', 'xr-btn--primary');
    expect(
      within(actions)
        .getAllByRole('button')
        .map((button) => text(button)),
    ).toEqual(['Edit catalogue details', 'Edit delivery link']);
    await user.click(within(actions).getByRole('button', { name: 'Edit delivery link' }));
    await waitFor(() =>
      expect(navigation.navigate).toHaveBeenCalledWith(
        '/content-manager/updates/UPD-0005?focus=web-link',
      ),
    );
    // Joined: still the one update, started from Edit catalogue details.
    expect((await updateOf(sample)).entry).toBe('edit-catalogue-details');
    const missing = await asPersonId(sample, KAVYA).corrections.getUpdate('UPD-0007' as never);
    expect(missing.ok).toBe(false);
  });

  it('returned (UPD-0006): the entries join it too', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showPublished(runtime, 'induction-motor-loading');
    await heading('Induction Motor Loading');
    const actions = main().querySelector('.xw-actions') as HTMLElement;
    expect(within(actions).getByRole('link', { name: 'Open update' })).toHaveAttribute(
      'href',
      '/content-manager/updates/UPD-0006',
    );
    expect(within(actions).getAllByRole('button')).toHaveLength(2);
  });

  it('in academic review: only “Open update”, in the notice (f1; B6-11 f9)', async () => {
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await savedDraft(sample, true);
    showPublished(runtime);
    await heading('Distillation Column');
    const notice = main().querySelector('.xr-notice--warn') as HTMLElement;
    expect(text(notice)).toBe(
      'An update is in progress — UPD-0005 · In academic review It is with the Academic Reviewer. You can’t start another update until it is decided. Open update',
    );
    const open = within(notice).getByRole('link', { name: 'Open update' });
    expect(open).toHaveClass('xr-btn', 'xr-btn--primary', 'xr-btn--sm');
    expect(open.parentElement).toHaveClass('xr-notice-actions');
    expect(within(main()).queryAllByRole('button')).toHaveLength(0);
    expect(main().querySelector('.xw-actions')).toBeNull();
  });

  it('awaiting release decision (after Flow E; B7-11 f4) and on hold (UPD-0004): only “Open update”', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'after-flow-e');
    showPublished(runtime);
    await heading('Distillation Column');
    expect(text(main().querySelector('.xr-notice--warn'))).toBe(
      'An update is in progress — UPD-0005 · Awaiting release decision The Academic Reviewer approved it. The Super Admin decides when to release it. Open update',
    );
    expect(within(main()).queryAllByRole('button')).toHaveLength(0);
  });

  it('back from the correction: the notice once, then not again (f3)', async () => {
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await openDraft(sample);
    const session = runtime.session.getSnapshot();
    noteBackFromCorrection(
      session.status === 'signed-in' ? session.sessionKey : null,
      DISTILLATION,
    );
    const first = showPublished(runtime);
    await heading('Distillation Column');
    const notices = [...main().querySelectorAll('.xr-notice')].map((node) => text(node));
    expect(notices).toEqual([
      'Back from the correction The live version is unchanged until the Super Admin releases the update.',
      'An update is in progress — UPD-0005 · Draft Edits to this experiment join that update. Open it to continue.',
    ]);
    first.view.unmount();
    showPublished(runtime);
    await heading('Distillation Column');
    expect(within(main()).queryByText('Back from the correction')).toBeNull();
  });
});

describe('CM-08 the correction draft (B6-09 f1, f4; B6-11 f11)', () => {
  it('pre-filled with the live version; nothing changed yet; started from Edit catalogue details', async () => {
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await openDraft(sample);
    showUpdate(runtime, 'UPD-0005', '?focus=summary');
    await heading('Update to version …');
    expect(text(main().querySelector('a.xr-back'))).toBe('Back to the published experiment');
    expect(main().querySelector('a.xr-back')).toHaveAttribute(
      'href',
      '/content-manager/published/distillation-column',
    );
    expect(text(main().querySelector('.xr-overline'))).toBe(
      'UPD-0005 · correction to Distillation Column (live version 1.2)',
    );
    expect(chip()).toBe('Draft');
    expect(main().querySelector('.xr-status--off')).not.toBeNull();
    expect(text(main().querySelector('.xg-live'))).toBe('Live version 1.2 unchanged');
    // The shell: the top bar names the destination; the crumbs the update.
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Updates');
    expect(text(screen.getByRole('list', { name: 'You are here' }))).toMatch(
      /Updates\s*\/\s*UPD-0005/,
    );
    expect(field('What changes and why').value).toBe('');
    expect(field('Name').value).toBe('Distillation Column');
    expect(field('Summary').value).toMatch(/^Bring a binary column from cold start/);
    expect(field('Description').value).toBe(LIVE_DESCRIPTION);
    expect(field('WEB · web link').value).toBe('https://labs.meridian.example/distillation-column');
    expect(field('VR · package reference').value).toBe('MVL-DC-VR-1.2');
    // No decision id in what the page shows or announces (P1-14 / VD-10): the package hint is
    // B6-09's sentence without its "(T-14)".
    expect(text(field('VR · package reference').closest('.xr-field'))).toContain(
      'App package fields are provisional.',
    );
    expect(text(main())).not.toMatch(/\((?:T|OD|ND|D|SUP|UPD|ROLE)-[\w-]+\)/);
    expect(field('Version label').value).toBe('');
    expect(text(field('Version label').closest('.xr-field'))).toContain(
      'For example 1.3. The live version is 1.2.',
    );
    const comparison = screen.getByRole('region', { name: 'Current and proposed' });
    expect(text(comparison)).toBe('Current and proposed Nothing changed yet.');
    expect(historyWhat()).toEqual(['Correction started from Edit catalogue details']);
    expect(text(main().querySelector('.xr-tl-note'))).toBe('Pre-filled with the live version 1.2.');
    expect(
      within(main().querySelector('.xw-flow-foot') as HTMLElement)
        .getAllByRole('button')
        .map((button) => text(button)),
    ).toEqual(['Withdraw update', 'Save draft', 'Send for academic review']);
    // CM-06: the summary is focused.
    await waitFor(() => expect(field('Summary')).toHaveFocus());
  });

  it('CM-07: ?focus=web-link focuses the web link', async () => {
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await openDraft(sample, 'edit-delivery-link' as never);
    showUpdate(runtime, 'UPD-0005', '?focus=web-link');
    await heading('Update to version …');
    await waitFor(() => expect(field('WEB · web link')).toHaveFocus());
    expect(historyWhat()).toEqual(['Correction started from Edit delivery link']);
  });

  it('Send with nothing changed: all three drawn errors at once under “Check the update” (B6-11 f11)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await openDraft(sample, 'start-a-correction' as never);
    showUpdate(runtime, 'UPD-0005');
    await heading('Update to version …');
    expect(historyWhat()).toEqual(['Correction started from the published experiment']);
    await user.click(within(main()).getByRole('button', { name: 'Send for academic review' }));
    const summary = await screen.findByRole('alert');
    expect(summary).toHaveClass('xw-errsum');
    expect(text(summary)).toBe(
      'Check the update Say what changes and why Enter the version label, for example 1.3 Change at least one catalogue detail or delivery link',
    );
    await waitFor(() => expect(summary).toHaveFocus());
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(field('What changes and why')).toHaveAttribute('aria-invalid', 'true');
    expect(field('Version label')).toHaveAttribute('aria-invalid', 'true');
    expect(text(document.getElementById('cm-u-chg-e'))).toBe(
      'Change at least one catalogue detail or delivery link',
    );
    expect(field('Summary').getAttribute('aria-describedby')).toContain('cm-u-chg-e');
    // The change link lands on the summary.
    await user.click(within(summary).getByRole('link', { name: /Change at least one/ }));
    expect(field('Summary')).toHaveFocus();
    // The live label is not a new one.
    await user.type(field('Version label'), '1.2');
    await user.click(within(main()).getByRole('button', { name: 'Send for academic review' }));
    expect(text(await screen.findByRole('alert'))).toContain(
      'Use a new version label — 1.2 is live',
    );
    expect((await updateOf(sample)).state).toBe('draft');
  });

  it('typing shows the comparison live; Save draft keeps it and the live version is unchanged', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await openDraft(sample);
    showUpdate(runtime, 'UPD-0005');
    await heading('Update to version …');
    await user.clear(field('Description'));
    await user.type(field('Description'), NEW_DESCRIPTION);
    await user.type(field('Version label'), '1.3');
    await heading('Update to version 1.3');
    const comparison = screen.getByRole('region', { name: 'Current and proposed' });
    const rows = within(comparison).getAllByRole('row').slice(1);
    expect(rows.map((row) => text(row.querySelector('[role="rowheader"]')))).toEqual([
      'Description',
      'Version',
    ]);
    expect(text(rows[1]!)).toBe('Version Live now 1.2 Proposed 1.3');
    await user.click(within(main()).getByRole('button', { name: 'Save draft' }));
    const saved = await screen.findByText(/^Draft saved · .* · the live version is unchanged$/);
    await waitFor(() => expect(saved.closest('p')).toHaveFocus());
    const update = await updateOf(sample);
    expect([update.state, update.proposed.description, update.versionLabel]).toEqual([
      'draft',
      NEW_DESCRIPTION,
      '1.3',
    ]);
    // A saved draft is never public: the live version and its description are unchanged.
    const live = await liveOf(sample);
    expect([live.label, live.catalogue.description]).toEqual(['1.2', LIVE_DESCRIPTION]);
  });

  it('typed work survives leaving the page and coming back (in memory)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await openDraft(sample);
    const first = showUpdate(runtime, 'UPD-0005');
    await heading('Update to version …');
    await user.type(field('What changes and why'), 'Typed, not saved.');
    first.view.unmount();
    showUpdate(runtime, 'UPD-0005');
    await heading('Update to version …');
    expect(field('What changes and why').value).toBe('Typed, not saved.');
    expect((await updateOf(sample)).whatChangesAndWhy).toBeNull();
  });

  it('a stale save is refused and said calmly; what was typed stays', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await openDraft(sample);
    answerWith(runtime, 'saveCorrection', { kind: 'stale-version', currentRev: 9 });
    showUpdate(runtime, 'UPD-0005');
    await heading('Update to version …');
    await user.type(field('What changes and why'), 'Mine.');
    await user.click(within(main()).getByRole('button', { name: 'Save draft' }));
    expect(
      await within(main()).findByText(
        'This update changed since you opened it. Nothing was saved — check what you entered and try again.',
      ),
    ).toBeVisible();
    expect(field('What changes and why').value).toBe('Mine.');
    expect((await updateOf(sample)).whatChangesAndWhy).toBeNull();
  });

  it('a save failed for now: nothing was lost', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await openDraft(sample);
    showUpdate(runtime, 'UPD-0005');
    await heading('Update to version …');
    await user.type(field('What changes and why'), 'Kept.');
    faults(sample).failNext('CorrectionService.saveCorrection' as never);
    await user.click(within(main()).getByRole('button', { name: 'Save draft' }));
    expect(
      await within(main()).findByText('It wasn’t saved. Nothing was lost — try again.'),
    ).toBeVisible();
    expect(field('What changes and why').value).toBe('Kept.');
  });

  it('Send for academic review (DL-1): saves what is typed, sends it — read-only, In academic review (f3)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await openDraft(sample);
    showUpdate(runtime, 'UPD-0005');
    await heading('Update to version …');
    await user.type(field('What changes and why'), WHY);
    await user.clear(field('Description'));
    await user.type(field('Description'), NEW_DESCRIPTION);
    await user.type(field('Version label'), '1.3');
    await user.click(within(main()).getByRole('button', { name: 'Send for academic review' }));
    const dialog = await screen.findByRole('dialog', { name: 'Send for academic review?' });
    expect(text(dialog.querySelector('.xr-dialog-body'))).toBe(
      'It goes to the Academic Reviewer, then to the Super Admin, who decides when to release it. The live version 1.2 doesn’t change until it is released.',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Send for academic review' }));
    await heading('Update to version 1.3');
    await waitFor(() => expect(chip()).toBe('In academic review'));
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus());
    expect(text(main().querySelector('.xr-notice'))).toMatch(
      /^In academic review With the Academic Reviewer since \d+ \w+ 2026\. Read-only while it is reviewed\. The live version 1\.2 is unchanged\.$/,
    );
    expect(within(main()).queryAllByRole('textbox')).toHaveLength(0);
    const why = screen.getByRole('region', { name: 'What changes and why' });
    expect(text(why.querySelector('.xr-section-head'))).toBe('What changes and why Version 1.3');
    expect(text(why.querySelector('p.xr-body'))).toBe(WHY);
    expect(historyWhat()).toEqual([
      'Sent for academic review',
      'Correction started from Edit catalogue details',
    ]);
    // Withdraw is still offered while it is reviewed.
    expect(
      within(main())
        .getAllByRole('button')
        .map((button) => text(button)),
    ).toEqual(['Withdraw update']);
    const update = await updateOf(sample);
    expect([update.state, update.whatChangesAndWhy, update.versionLabel]).toEqual([
      'in-academic-review',
      WHY,
      '1.3',
    ]);
    expect((await liveOf(sample)).label).toBe('1.2');
  });

  it('Withdraw (DL-2): a reason is required; then Withdrawn (f8) and nothing changed in the live version', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await savedDraft(sample, true);
    showUpdate(runtime, 'UPD-0005');
    await heading('Update to version 1.3');
    await user.click(within(main()).getByRole('button', { name: 'Withdraw update' }));
    const dialog = await screen.findByRole('dialog', { name: 'Withdraw this update?' });
    expect(text(dialog.querySelector('.xr-dialog-body > p'))).toBe(
      'Nothing changes in the live version.',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Withdraw update' }));
    expect(
      await within(dialog).findByText('Add a reason for withdrawing this update'),
    ).toBeVisible();
    await user.type(within(dialog).getByLabelText('Reason'), 'Raised by mistake.');
    await user.click(within(dialog).getByRole('button', { name: 'Withdraw update' }));
    await waitFor(() => expect(chip()).toBe('Withdrawn'));
    expect(text(main().querySelector('.xr-notice--quiet'))).toMatch(
      /^Withdrawn Withdrawn on \d+ \w+ 2026: “Raised by mistake\.” The live version is unchanged\. You can start a new correction from the published experiment\.$/,
    );
    expect(historyWhat()[0]).toBe('Withdrawn');
    expect(text(main().querySelector('.xr-tl-note'))).toBe(
      '“Raised by mistake.” Nothing changed in the live version.',
    );
    expect(within(main()).queryAllByRole('button')).toHaveLength(0);
    expect((await liveOf(sample)).label).toBe('1.2');
  });
});

describe('CM-08 the later states (B6-09 f2, f5 … f7; B6-11 f10; B7-11 f3; B6-13 f0)', () => {
  it('returned (UPD-0006): the reviewer’s reason first, editable again (f2)', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showUpdate(runtime, 'UPD-0006');
    await heading('Update to version 1.1');
    expect(chip()).toBe('Returned');
    expect(main().querySelector('.xr-status--err')).not.toBeNull();
    const reason = screen.getByRole('region', { name: 'Returned by the Academic Reviewer' });
    expect(reason).toHaveClass('xv-reason');
    expect(text(reason)).toBe(
      'Returned by the Academic Reviewer 26 Aug 2026, 10:00 · Prof. A. Menon The proposed description says slip falls as the load rises. It rises. Please correct it before I approve.',
    );
    expect(field('What changes and why').value).toBe('Correction UPD-0006.');
    expect(historyWhat()).toEqual([
      'Returned by Prof. A. Menon',
      'Sent for academic review',
      'Correction started from the published experiment',
    ]);
  });

  it('awaiting release decision (after Flow E; f5; B6-11 f10; B7-11 f3): read-only, the comparison', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'after-flow-e');
    showUpdate(runtime, 'UPD-0005');
    await heading('Update to version 1.3');
    expect(chip()).toBe('Awaiting release decision');
    expect(text(main().querySelector('.xr-notice'))).toMatch(
      /^Awaiting release decision Approved by Prof\. A\. Menon on \d+ \w+ 2026\. The Super Admin decides whether to release it or put it on hold\. Version 1\.2 stays live until it is released\.$/,
    );
    const rows = within(screen.getByRole('table', { name: 'Current and proposed' }))
      .getAllByRole('row')
      .slice(1)
      .map((row) => text(row.querySelector('[role="rowheader"]')));
    expect(rows).toEqual(['Description', 'WEB · web link', 'Version']);
    expect(historyWhat()).toEqual([
      'Approved by Prof. A. Menon',
      'Sent for academic review',
      'Correction started from Edit catalogue details',
    ]);
    expect(within(main()).queryAllByRole('button')).toHaveLength(0);
  });

  it('on hold (UPD-0004; f6): the live version stays as it is; the reason in the history', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showUpdate(runtime, 'UPD-0004');
    await heading('Update to version 2.1');
    expect(chip()).toBe('On hold');
    expect(main().querySelector('.xr-status--paused')).not.toBeNull();
    expect(text(main().querySelector('.xr-notice--warn'))).toBe(
      'On hold The Super Admin put this update on hold. The live version stays as it is.',
    );
    expect(historyWhat()[0]).toBe('Put on hold by Arjun Mehta');
    expect(text(main().querySelector('.xr-tl-note'))).toBe(
      '“Version 2.0 stays live while the 2.1 build is checked.” Version 2.0 stays live.',
    );
  });

  it('released (after Flow F; f7): live for everyone; the comparison with the version it corrected', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'after-flow-f');
    showUpdate(runtime, 'UPD-0005');
    await heading('Update to version 1.3');
    expect(chip()).toBe('Released');
    expect(text(main().querySelector('.xr-overline'))).toBe(
      'UPD-0005 · correction to Distillation Column (live version 1.2)',
    );
    expect(main().querySelector('.xg-live')).toBeNull();
    expect(text(main().querySelector('.xr-notice--ok'))).toBe(
      'Released This version is live for everyone.',
    );
    const rows = within(screen.getByRole('table', { name: 'Current and proposed' }))
      .getAllByRole('row')
      .slice(1);
    expect(text(rows.at(-1)!)).toBe('Version Live now 1.2 Proposed 1.3');
    expect(historyWhat()[0]).toBe('Released by Arjun Mehta');
  });

  it('no such update: “No update open” with the Content library (B6-13 f0)', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showUpdate(runtime, 'UPD-0099');
    await heading('No update open');
    expect(text(main())).toContain('Start a correction from a published experiment.');
    expect(within(main()).getByRole('link', { name: 'Open the Content library' })).toHaveAttribute(
      'href',
      '/content-manager/library',
    );
  });

  it('the history in her words, newest first (state-copy `CM-08.history`)', async () => {
    const { sample } = await tabPlatform(MENON, 'after-flow-e');
    const update = await updateOf(sample);
    expect(
      updateHistory(update).map((event) => `${event.what as string} — ${event.note as string}`),
    ).toEqual([
      'Approved by Prof. A. Menon — With the Super Admin for a release decision. The live version stays 1.2 until then.',
      'Sent for academic review — To the Academic Reviewer. The live version 1.2 is unchanged.',
      'Correction started from Edit catalogue details — Pre-filled with the live version 1.2.',
    ]);
  });
});

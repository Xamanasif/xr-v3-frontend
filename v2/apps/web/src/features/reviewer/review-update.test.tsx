/**
 * RV-04 Review an update (boards B6-04 f0 … f4, B6-13 f4, B7-11 f6) as Prof. A. Menon and CM-08
 * Updates (V3: the CM-v1 correction tracker; was B6-09 f0, B6-13 f2, B7-11 f2) as Kavya Nair, on
 * the real composition root and the sample world (spine-start). The board’s correction is
 * prepared through the ports (set-up only): Kavya Nair opens the Distillation Column correction,
 * changes the reflux sentence and the web link, labels it 1.3 with her reason and sends it for
 * academic review at the board’s times (UPD-0005).
 * Everything the pages do — Approve update through DL-1, Return to the Content Manager through
 * DL-2 with its required reason — is done by clicks and typing; approval releases nothing (the
 * public catalogue still lists the live 1.2); the Content Manager’s list follows in the same
 * world. The refusals (stale, moved on, failed for now) are answered by a port stand-in or the
 * fault plan.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ServiceError } from '@xr/contracts/draft';
import type { CorrectionUpdate, IsoInstant } from '@xr/domain';
import { asPersonId, faults, fixtureWorld, standinsOf } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import {
  renderInTab,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
  worldPlatform,
} from '@/test-support/workspace';

import { Updates } from '../content-manager/cm-08-updates/updates';
import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { ReviewUpdate } from './rv-04-review-update/review-update';

// Whole decisions by clicks and typing on the real world: longer than the default 5 s.
vi.setConfig({ testTimeout: 30_000 });

afterEach(() => {
  forgetLastAddress();
  vi.restoreAllMocks();
});

const MENON = 'per-a-menon';
const KAVYA = 'per-kavya-nair';
const DISTILLATION = 'distillation-column';
const ORIFICE = 'orifice-plate-metering';

const LIVE_DESCRIPTION =
  'Learners start a binary column from cold and bring it to steady state. They then change the reflux ratio and watch the overhead purity respond with realistic lag. Lowering the reflux ratio raises the overhead purity, at the cost of more reboiler heat.';
const CORRECTED_DESCRIPTION =
  'Learners start a binary column from cold and bring it to steady state. They then change the reflux ratio and watch the overhead purity respond with realistic lag. Raising the reflux ratio raises the overhead purity, at the cost of more reboiler heat.';
const LIVE_LINK = 'https://labs.meridian.example/distillation-column';
const NEW_LINK = 'https://labs.meridian.example/distillation-column-1-3';
const WHY =
  'Corrects the reflux statement in the description: raising the reflux ratio raises overhead purity — v1.2 says the opposite. The web link moves to build 1.3, which carries the same correction in its on-screen notes.';
const RETURN_REASON =
  'The corrected sentence is right. Please also say that the purity gain levels off at high reflux, as the build 1.3 notes do.';

/** B6-04’s times, in Indian time. */
const STARTED = '2026-08-25T10:10:00.000Z'; // 25 Aug 2026, 15:40
const SENT = '2026-08-25T10:30:00.000Z'; // 25 Aug 2026, 16:00
const DECIDED = '2026-08-27T05:50:00.000Z'; // 27 Aug 2026, 11:20

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

function moveClock(sample: Sample, instant: string) {
  standinsOf(sample).clock.setSampleNow(instant as IsoInstant);
}

/**
 * Kavya Nair opens a correction to `experimentId` (Edit catalogue details), changes it, labels
 * it and — unless `send` is false — sends it for academic review (set-up through the port).
 */
async function propose(
  sample: Sample,
  experimentId: string,
  change: (proposed: CorrectionUpdate['proposed']) => CorrectionUpdate['proposed'],
  versionLabel: string,
  options: { readonly send?: boolean; readonly why?: string } = {},
): Promise<CorrectionUpdate> {
  const cm = asPersonId(sample, KAVYA);
  const opened = ok(
    await cm.corrections.openCorrection({
      experimentId: experimentId as never,
      entry: 'edit-catalogue-details',
    }),
  );
  const saved = ok(
    await cm.corrections.saveCorrection({
      id: opened.update.id,
      proposed: change(opened.update.proposed),
      whatChangesAndWhy: options.why ?? WHY,
      versionLabel,
      expectedRev: opened.update.rev,
    } as never),
  );
  if (options.send === false) return saved;
  return ok(await cm.corrections.sendForAcademicReview({ id: saved.id, expectedRev: saved.rev }));
}

/** B6-04 f0’s world: UPD-0005 Distillation Column 1.2 → 1.3, with the Academic Reviewer. */
async function inReview() {
  const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
  moveClock(sample, STARTED);
  const opened = await propose(
    sample,
    DISTILLATION,
    (proposed) => ({ ...proposed, description: CORRECTED_DESCRIPTION, webLink: NEW_LINK }),
    '1.3',
    { send: false },
  );
  moveClock(sample, SENT);
  const cm = asPersonId(sample, KAVYA);
  ok(await cm.corrections.sendForAcademicReview({ id: opened.id, expectedRev: opened.rev }));
  moveClock(sample, DECIDED);
  return { runtime, sample, id: opened.id };
}

function inShell(workspace: 'reviewer' | 'content-manager', ui: ReactNode) {
  return (
    <WorkspaceLayout workspace={workspace}>
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{ui}</TestNotFoundBoundary>
    </WorkspaceLayout>
  );
}

function showReview(runtime: PlatformRuntime, updateId: string) {
  const navigation = testNavigation(`/reviewer/updates/${updateId}`);
  const view = renderInTab(inShell('reviewer', <ReviewUpdate updateId={updateId} />), {
    runtime,
    navigation,
  });
  return { navigation, view };
}

function showUpdates(runtime: PlatformRuntime) {
  const navigation = testNavigation('/content-manager/updates');
  return renderInTab(inShell('content-manager', <Updates />), { runtime, navigation });
}

/** One port’s command answered with a refusal (the page’s handling of it, not the service). */
function answerWith(
  runtime: PlatformRuntime,
  method: 'approveUpdate' | 'returnUpdate',
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

const main = () => screen.getByRole('main');
const panel = () => screen.getByRole('complementary', { name: 'Your decision' });
const region = (name: string) => screen.getByRole('region', { name });
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
const heading = (name: string) =>
  screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });
const chip = () => text(main().querySelector('.xr-phead-meta .xr-status'));
const historyRows = () =>
  [...region('Update history').querySelectorAll('li.xr-tl')].map((row) => [
    text(row.querySelector('.xr-tl-what')),
    text(row.querySelector('.xr-tl-when')),
    text(row.querySelector('.xr-tl-note')),
  ]);
const decided = () => document.getElementById('ru-dec');
const TITLE = 'Distillation Column · 1.2 → 1.3';

// ---- RV-04: waiting for the decision ------------------------------------------------------------

describe('RV-04 Review an update — waiting for your decision (B6-04 f0 … f2)', () => {
  it('the header, what changes, why, the live experiment, the history and the open panel', async () => {
    const { runtime, id } = await inReview();
    expect(id).toBe('UPD-0005');
    showReview(runtime, id);
    await heading(TITLE);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', '/reviewer/queue');
    expect(text(main().querySelector('.xr-overline'))).toBe(
      'UPD-0005 · Update (Content Manager correction)',
    );
    expect(chip()).toBe('Waiting for your decision');
    expect(main().querySelector('.xr-phead-meta .xr-status')).toHaveClass('xr-status--wait');
    expect(text(main().querySelector('.xr-phead-meta'))).toBe(
      'Waiting for your decision From Kavya Nair · CHE ZG513 · live version 1.2',
    );
    // The shell: the queue current, the top bar “Review queue”, the crumbs the record.
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Review queue');
    expect(text(screen.getByRole('list', { name: 'You are here' }))).toMatch(
      /Review queue\s*\/\s*UPD-0005/,
    );
    expect(
      screen
        .getByRole('navigation', { name: 'Academic Reviewer navigation' })
        .querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', '/reviewer/queue');
    // “Go to decision” before the layout (shown below 860 px of content by the sheet).
    const jump = main().querySelector('a.xr-jump');
    expect(jump).toHaveAttribute('href', '#ru-decision');
    expect(jump?.nextElementSibling).toHaveClass('xr-decide');

    // What changes — the changed fields only, the shared comparison.
    const changes = region('What changes');
    expect(text(changes.querySelector('.xr-section-head .xr-meta'))).toBe('Changed fields only');
    const table = within(changes).getByRole('table', { name: 'Current and proposed' });
    expect(
      [...table.querySelectorAll('.xg-cmp-row:not(.xg-cmp-head)')].map((row) => [
        text(row.querySelector('.xg-cmp-f')),
        text(row.querySelector('.xg-cmp-cur')),
        text(row.querySelector('.xg-cmp-pro')),
      ]),
    ).toEqual([
      ['Description', `Live now ${LIVE_DESCRIPTION}`, `Proposed ${CORRECTED_DESCRIPTION}`],
      ['WEB · web link', `Live now ${LIVE_LINK}`, `Proposed ${NEW_LINK}`],
      ['Version', 'Live now 1.2', 'Proposed 1.3'],
    ]);
    // Why — from the Content Manager.
    const why = region('Why — from the Content Manager').querySelector('blockquote.xv-quote');
    expect(text(why)).toBe(WHY);
    expect(why).toHaveClass('bg-(--xr-surface-2)');
    // About this experiment — the live version, read-only.
    const about = region('About this experiment');
    expect(text(about.querySelector('.xr-section-head .xr-meta'))).toBe('Live · read-only');
    expect(text(about.querySelector('dl.xl-kv.xv-kv'))).toBe(
      'Course CHE ZG513 · Process Instrumentation & Control Formats WEB VR Live version 1.2 · since 3 Jul 2026 Learning outcomes Bring a column to steady state from cold start Tune reflux ratio against an overhead purity target',
    );
    expect([...about.querySelectorAll('.xr-fmt.xr-fmt--compact')].map(text)).toEqual(['WEB', 'VR']);
    expect(text(about.querySelector('p.xl-open'))).toBe(
      'Whether a correction may change formats, and references on update returns, are still open.',
    );
    expect(about).not.toHaveTextContent('T-28');
    // Update history — the steps shown to the reviewer, newest first.
    expect(text(region('Update history').querySelector('.xr-meta'))).toBe('Newest first');
    expect(historyRows()).toEqual([
      [
        'Sent for academic review',
        '25 Aug 2026, 16:00',
        'To Prof. A. Menon. The live version 1.2 is unchanged.',
      ],
      [
        'Correction started from the published experiment',
        '25 Aug 2026, 15:40',
        'Pre-filled with the live version 1.2.',
      ],
    ]);

    // Your decision: Approve update chosen first, Return to the Content Manager beside it.
    expect(panel()).toHaveClass('xr-dpanel', 'xg-static');
    const approve = within(panel()).getByRole('radio', { name: /^Approve update/ });
    expect(approve).toBeChecked();
    expect(approve.closest('label')).toHaveTextContent(
      'Approve updateSends it to the Super Admin, who decides when to release it. The live version doesn’t change until then.',
    );
    expect(
      within(panel())
        .getByRole('radio', { name: /^Return to the Content Manager/ })
        .closest('label'),
    ).toHaveTextContent(
      'Return to the Content ManagerYou’ll add a reason the Content Manager will see.',
    );
    const go = within(panel()).getByRole('button', { name: 'Approve update' });
    expect(go).toHaveClass('xr-btn', 'xr-btn--primary', 'xr-btn--block');
    expect(main()).not.toHaveTextContent(/\bpublish\b/i);
  });
});

// ---- RV-04: Approve update (DL-1) → f4 ------------------------------------------------------------

describe('RV-04 Approve update (DL-1 → B6-04 f4; B7-11 f6)', () => {
  it('approval goes to the Super Admin and releases nothing; the Content Manager’s list follows', async () => {
    const user = userEvent.setup();
    const { runtime, sample, id } = await inReview();
    showReview(runtime, id);
    await heading(TITLE);
    await user.click(within(panel()).getByRole('button', { name: 'Approve update' }));
    const dialog = await screen.findByRole('dialog', { name: 'Approve UPD-0005?' });
    expect(text(dialog.querySelector('.xr-dialog-body'))).toBe(
      'It goes to the Super Admin, who decides when to release it. Version 1.2 stays live until then.',
    );
    expect(dialog.querySelector('.xr-dialog-body strong')).not.toBeNull();
    const confirm = within(dialog).getByRole('button', { name: 'Approve update' });
    await waitFor(() => expect(confirm).toHaveFocus());
    // Cancel first: nothing is approved.
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(chip()).toBe('Waiting for your decision');
    await user.click(within(panel()).getByRole('button', { name: 'Approve update' }));
    const again = await screen.findByRole('dialog', { name: 'Approve UPD-0005?' });
    await user.click(within(again).getByRole('button', { name: 'Approve update' }));

    // f4: the decided panel, focused; the chip; the history.
    await waitFor(() => expect(decided()).not.toBeNull());
    await waitFor(() => expect(decided()).toHaveFocus());
    const result = decided()!;
    expect(result.querySelector('.xr-status--ok')).toHaveTextContent(
      'Approved — awaiting the Super Admin’s release decision',
    );
    expect(text(result)).toBe(
      'Approved — awaiting the Super Admin’s release decision 27 Aug 2026 · Prof. A. Menon Version 1.2 stays live. Release or hold is the Super Admin’s decision. Back to the review queue',
    );
    expect(within(result).getByRole('link', { name: 'Back to the review queue' })).toHaveAttribute(
      'href',
      '/reviewer/queue',
    );
    expect(chip()).toBe('Approved — with the Super Admin');
    expect(within(panel()).queryByRole('radio')).toBeNull();
    expect(historyRows()).toEqual([
      [
        'Approved by Prof. A. Menon',
        '27 Aug 2026, 11:20',
        'With the Super Admin for a release decision. The live version stays 1.2 until then.',
      ],
      [
        'Sent for academic review',
        '25 Aug 2026, 16:00',
        'To Prof. A. Menon. The live version 1.2 is unchanged.',
      ],
      [
        'Correction started from the published experiment',
        '25 Aug 2026, 15:40',
        'Pre-filled with the live version 1.2.',
      ],
    ]);
    // The live experiment is unchanged: the public catalogue still lists 1.2’s description.
    const listed = ok(
      await asPersonId(sample, KAVYA).catalogue.getExperiment(DISTILLATION as never),
    );
    expect(listed.description).toBe(LIVE_DESCRIPTION);
    const published = ok(
      await asPersonId(sample, KAVYA).corrections.getPublishedExperiment(DISTILLATION as never),
    );
    expect(published.experiment.live.label).toBe('1.2');
    expect(published.openUpdate?.state).toBe('awaiting-release-decision');
    expect(text(region('About this experiment'))).toContain('1.2 · since 3 Jul 2026');
  });
});

// ---- RV-04: Return to the Content Manager (DL-2) → f3 ----------------------------------------------

describe('RV-04 Return to the Content Manager (DL-2 → B6-04 f3)', () => {
  it('the reason is required; returned, the Content Manager has it again with the reason', async () => {
    const user = userEvent.setup();
    const { runtime, sample, id } = await inReview();
    showReview(runtime, id);
    await heading(TITLE);
    await user.click(
      within(panel()).getByRole('radio', { name: /^Return to the Content Manager/ }),
    );
    const go = within(panel()).getByRole('button', { name: 'Return to the Content Manager' });
    await user.click(go);
    const dialog = await screen.findByRole('dialog', { name: 'Return to the Content Manager?' });
    expect(dialog).toHaveTextContent(
      'The Content Manager sees your reason and can change the update and send it again.',
    );
    const reason = within(dialog).getByRole('textbox', {
      name: 'Reason the Content Manager will see',
    });
    await waitFor(() => expect(reason).toHaveFocus());
    // No references: they are open for update returns.
    expect(within(dialog).queryByRole('checkbox')).toBeNull();
    // No reason: refused on the field, which keeps focus; nothing is sent.
    await user.click(within(dialog).getByRole('button', { name: 'Return to the Content Manager' }));
    expect(
      await within(dialog).findByText('Add a reason so the Content Manager knows what to change'),
    ).toBeVisible();
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(reason).toHaveFocus());
    const still = ok(await asPersonId(sample, MENON).corrections.getUpdateForReview(id as never));
    expect(still.update.state).toBe('in-academic-review');

    await user.type(reason, RETURN_REASON);
    await user.click(within(dialog).getByRole('button', { name: 'Return to the Content Manager' }));
    await waitFor(() => expect(decided()).not.toBeNull());
    await waitFor(() => expect(decided()).toHaveFocus());
    expect(decided()!.querySelector('.xr-status--err')).toHaveTextContent(
      'Returned to the Content Manager',
    );
    expect(text(decided())).toBe(
      `Returned to the Content Manager 27 Aug 2026 · “${RETURN_REASON}” The Content Manager can change it and send it again. Back to the review queue`,
    );
    expect(chip()).toBe('Returned to the Content Manager');
    expect(historyRows()[0]).toEqual([
      'Returned by Prof. A. Menon',
      '27 Aug 2026, 11:20',
      `“${RETURN_REASON}”`,
    ]);
    // The Content Manager has it again, with the reason.
    const back = ok(await asPersonId(sample, KAVYA).corrections.getUpdate(id as never));
    expect(back.update.state).toBe('returned');
    expect(back.update.reviewDecisions.at(-1)?.reason).toBe(RETURN_REASON);
  });
});

// ---- RV-04: the other states -------------------------------------------------------------------

describe('RV-04 — not sent yet, withdrawn, on hold, released (B6-13 f4; B6-04 script)', () => {
  it('a draft is not shown: “No update is waiting for your decision” (B6-13 f4)', async () => {
    const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
    const draft = await propose(
      sample,
      DISTILLATION,
      (proposed) => ({ ...proposed, description: CORRECTED_DESCRIPTION }),
      '1.3',
      { send: false },
    );
    showReview(runtime, draft.id);
    const title = await screen.findByRole(
      'heading',
      { level: 2, name: 'No update is waiting for your decision' },
      { timeout: 5000 },
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Review an update');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', '/reviewer/queue');
    const empty = title.closest('.xr-empty')!;
    expect(
      within(empty as HTMLElement).getByRole('heading', {
        level: 2,
        name: 'No update is waiting for your decision',
      }),
    ).toHaveClass('xr-h3');
    expect(empty).toHaveTextContent(
      'Corrections from the Content Manager appear in your review queue once they are sent.',
    );
    expect(empty.querySelector('.xr-empty-icon')).toHaveClass('xr-x-empty-icon--ok');
    expect(
      within(empty as HTMLElement).getByRole('link', { name: 'Open the review queue' }),
    ).toHaveAttribute('href', '/reviewer/queue');
    expect(main()).not.toHaveTextContent(CORRECTED_DESCRIPTION);
    expect(screen.queryByRole('complementary', { name: 'Your decision' })).toBeNull();
  });

  it('withdrawn by the Content Manager: read-only, the reason stays hers', async () => {
    const { runtime, sample, id } = await inReview();
    const cm = asPersonId(sample, KAVYA);
    const current = ok(await cm.corrections.getUpdate(id as never));
    ok(
      await cm.corrections.withdrawUpdate({
        id: current.update.id,
        reason: 'The vendor will fix the build first.',
        expectedRev: current.update.rev,
      }),
    );
    showReview(runtime, id);
    await heading(TITLE);
    expect(chip()).toBe('Withdrawn');
    expect(main().querySelector('.xr-phead-meta .xr-status')).toHaveClass('xr-status--off');
    expect(text(decided())).toBe('Withdrawn by the Content Manager Back to the review queue');
    expect(main()).not.toHaveTextContent('The vendor will fix the build first.');
    expect(within(panel()).queryByRole('button')).toBeNull();
  });

  it('on hold (UPD-0004) and released (UPD-0003): nothing to decide', async () => {
    const { runtime } = await tabPlatform(MENON, 'spine-start');
    const held = showReview(runtime, 'UPD-0004');
    await heading('Boiler Drum Level · 2.0 → 2.1');
    expect(chip()).toBe('Approved — with the Super Admin');
    expect(text(decided())).toBe('Nothing to decide Back to the review queue');
    expect(historyRows().map((row) => row[0])).toEqual([
      'Approved by Prof. A. Menon',
      'Sent for academic review',
      'Correction started from the published experiment',
    ]);
    held.view.unmount();
    showReview(runtime, 'UPD-0003');
    await heading('Orifice Plate Metering · 1.0 → 1.1');
    expect(chip()).toBe('Update approved — released');
    expect(text(decided())).toBe('Nothing to decide Back to the review queue');
    expect(historyRows()[0]![0]).toBe('Released by Arjun Mehta');
    expect(historyRows()[0]![2]).toBe('Version 1.1 is live for everyone.');
    // Released: compared with the version its release replaced — “Live before · Released”.
    const released = within(region('What changes')).getByRole('table', {
      name: 'Current and proposed',
    });
    expect([...released.querySelectorAll('[role="columnheader"]')].map(text)).toEqual([
      'Field',
      'Live before',
      'Released',
    ]);
    expect(text(released.querySelector('.xg-cmp-row:not(.xg-cmp-head)'))).toContain('Version');
  });
});

// ---- RV-04: refusals ---------------------------------------------------------------------------

describe('RV-04 — refusals, not found, loading and failed', () => {
  it('stale: nothing written, a calm warning in the panel; the next Approve goes through', async () => {
    const user = userEvent.setup();
    const { runtime, sample, id } = await inReview();
    answerWith(runtime, 'approveUpdate', { kind: 'stale-version', currentRev: 99 });
    showReview(runtime, id);
    await heading(TITLE);
    await user.click(within(panel()).getByRole('button', { name: 'Approve update' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Approve update' }),
    );
    expect(
      await within(panel()).findByText('This update changed since you opened it'),
    ).toBeVisible();
    expect(panel()).toHaveTextContent(
      'It has been read again. Check what changes and decide again.',
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Your decision' })).toHaveFocus(),
    );
    const view = ok(await asPersonId(sample, MENON).corrections.getUpdateForReview(id as never));
    expect(view.update.state).toBe('in-academic-review');
    vi.restoreAllMocks();
    await user.click(within(panel()).getByRole('button', { name: 'Approve update' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Approve update' }),
    );
    await waitFor(() =>
      expect(decided()).toHaveTextContent('Approved — awaiting the Super Admin’s release decision'),
    );
  });

  it('moved on (withdrawn meanwhile): the current state with a calm notice', async () => {
    const user = userEvent.setup();
    const { runtime, sample, id } = await inReview();
    answerWith(runtime, 'approveUpdate', { kind: 'invalid-state', current: 'withdrawn' });
    showReview(runtime, id);
    await heading(TITLE);
    await user.click(within(panel()).getByRole('button', { name: 'Approve update' }));
    const dialog = await screen.findByRole('dialog');
    // Meanwhile the Content Manager withdraws it in another tab (set-up through the port).
    const cm = asPersonId(sample, KAVYA);
    const current = ok(await cm.corrections.getUpdate(id as never));
    ok(
      await cm.corrections.withdrawUpdate({
        id: current.update.id,
        reason: 'Not needed after all.',
        expectedRev: current.update.rev,
      }),
    );
    await user.click(within(dialog).getByRole('button', { name: 'Approve update' }));
    expect(
      await within(panel()).findByText(
        'It is no longer waiting for your decision — nothing you entered was sent.',
      ),
    ).toBeVisible();
    await waitFor(() => expect(panel()).toHaveTextContent('Withdrawn by the Content Manager'));
  });

  it('failed for now: DL-1 stays open and says so; the next press goes through', async () => {
    const user = userEvent.setup();
    const { runtime, sample, id } = await inReview();
    showReview(runtime, id);
    await heading(TITLE);
    await user.click(within(panel()).getByRole('button', { name: 'Approve update' }));
    const dialog = await screen.findByRole('dialog');
    faults(sample).failNext('CorrectionService.approveUpdate' as never);
    await user.click(within(dialog).getByRole('button', { name: 'Approve update' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Your decision wasn’t sent. Nothing was lost — try again.',
    );
    expect(dialog).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Approve update' }));
    await waitFor(() =>
      expect(decided()).toHaveTextContent('Approved — awaiting the Super Admin’s release decision'),
    );
  });

  it('an unknown update is the in-shell not-found page', async () => {
    const { runtime } = await tabPlatform(MENON, 'spine-start');
    showReview(runtime, 'UPD-9999');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
  });

  it('loading, then failed + Try again (a test fault plan)', async () => {
    const user = userEvent.setup();
    const { runtime, sample, id } = await inReview();
    faults(sample).failNext('CorrectionService.getUpdateForReview' as never);
    showReview(runtime, id);
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent('Review an update');
    const failed = await screen.findByRole('alert', {}, { timeout: 5000 });
    expect(failed).toHaveTextContent('We couldn’t load this update');
    expect(failed).toHaveTextContent('Nothing has changed. Try again.');
    await act(async () => {
      await user.click(within(failed).getByRole('button', { name: 'Try again' }));
    });
    await heading(TITLE);
  });
});

// ---- CM-08 Updates (the list) --------------------------------------------------------------------

/**
 * CM-08 Updates in V3 (the owner-approved export CM-v1 “CM-08 Updates list”, boards CM08-Updates,
 * L07, L13, L14): the v46 table (B6-09 f0, B6-13 f2, B7-11 f2) became the correction tracker — the
 * cards grouped by who must act (Need you · With others · Closed), each with its name, ID, course
 * and last change, its version change, its status, its action and the mini four-stage track (whose
 * current step names who has it) or, once closed, its outcome line. The tracker's own run is in
 * `content-manager/cm-correction.test.tsx`; these keep the chain's view from the Content Manager's
 * side, in the same world as RV-04 above.
 */
describe('CM-08 Updates — the list (V3 CM-v1 tracker; was B6-09 f0, B6-13 f2, B7-11 f2)', () => {
  /** Every card in page order: the groups, then each group's cards (the service's order). */
  const cards = () => [...main().querySelectorAll('section.cm-trksec li.cm-trk')] as HTMLElement[];
  /** A card's facts: name, meta (ID · course · last change), version change, status, action. */
  const card = (entry: Element) => [
    text(entry.querySelector('.cm-qname')),
    text(entry.querySelector('.cm-trk-meta > span')),
    text(entry.querySelector('.cm-ver')),
    text(entry.querySelector('.cm-trk-st')),
    text(entry.querySelector('.cm-trk-act a')),
  ];
  /** Who has it now: the mini track's current step, or nothing once closed. */
  const holder = (entry: Element) => text(entry.querySelector('[aria-current="step"]'));
  const groupOf = (name: string) =>
    screen.getByRole('heading', { level: 2, name: new RegExp(`^${name}`) }).closest('section')!;
  const countLine = (corrections: number) =>
    screen.findByText(
      `${corrections} corrections you raised, most recent change first`,
      {},
      { timeout: 5000 },
    );

  it('spine-start: her corrections, newest change first within who has each, its action', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showUpdates(runtime);
    await heading('Updates');
    // The chain, said under the title (v46: the head's meta line).
    expect(text(main().querySelector('.rb-head .rk-sub'))).toBe(
      'Corrections you raised to published experiments. Live content changes only this way: you, then the Academic Reviewer, then the Super Admin’s release.',
    );
    // The count (v46: “5 updates”).
    expect(await countLine(5)).toHaveAttribute('role', 'status');
    // Who has each (v46: the With column): the groups, then each card's current step.
    expect(
      [...main().querySelectorAll('section.cm-trksec')].map((group) =>
        text(group.querySelector('h2')),
      ),
    ).toEqual(['Need you 1', 'With others 1', 'Closed 3']);
    expect(cards().map(card)).toEqual([
      [
        'Induction Motor Loading',
        'EEE ZC341 · Electrical Machines · last change 26 Aug',
        '1.0 live 1.1 proposed',
        'Returned',
        'Continue',
      ],
      [
        'Boiler Drum Level',
        'CHE ZG513 · Process Instrumentation & Control · last change 20 Aug',
        '2.0 live 2.1 proposed',
        'On hold',
        'Open',
      ],
      [
        'Orifice Plate Metering',
        'CHE ZG513 · Process Instrumentation & Control · last change 5 Aug',
        '1.0 1.1 live',
        'Released',
        'Open',
      ],
      [
        'Distillation Column',
        'CHE ZG513 · Process Instrumentation & Control · last change 3 Jul',
        '1.1 1.2 live',
        'Released',
        'Open',
      ],
      [
        'Distillation Column',
        'CHE ZG513 · Process Instrumentation & Control · last change 19 Jun',
        '1.0 1.1 live',
        'Released',
        'Open',
      ],
    ]);
    expect(cards().map(holder)).toEqual([
      'Your step, now: You Returned to you Change it and send it again',
      'On hold: Super Admin On hold Since 20 Aug',
      '',
      '',
      '',
    ]);
    const [returned, held, released] = cards();
    expect(returned).toHaveClass('is-you');
    expect(returned!.querySelector('.cm-trk-st .xr-st')).toHaveClass('xr-st--err');
    expect(held!.querySelector('.cm-trk-st .xr-st')).toHaveClass('xr-st--paused');
    expect(released!.querySelector('.cm-trk-st .xr-st')).toHaveClass('xr-st--ok');
    expect(text(released!.querySelector('p.cm-trk-res'))).toBe(
      'Released by Arjun Mehta, Super Admin, on 5 Aug 2026. Version 1.1 is live for everyone.',
    );
    const cont = within(returned!).getByRole('link', {
      name: 'Continue the update to Induction Motor Loading, version 1.1, returned',
    });
    expect(cont).toHaveClass('rb-btn', 'rb-btn--primary');
    expect(cont).toHaveAttribute('href', '/content-manager/updates/UPD-0006');
    expect(
      within(held!).getByRole('link', {
        name: 'Open the update to Boiler Drum Level, version 2.1, on hold',
      }),
    ).toHaveAttribute('href', '/content-manager/updates/UPD-0004');
    // The one primary is the Need-you card's Continue (v46 drew none: every row's was secondary).
    expect([...main().querySelectorAll('a.rb-btn--primary')]).toEqual([cont]);
    // The shell: Updates current; the title is the page's own H1 (V3), no crumbs.
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(main().querySelector('nav[aria-label="Breadcrumb"]')).toBeNull();
    expect(
      screen
        .getByRole('navigation', { name: 'Content Manager navigation' })
        .querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', '/content-manager/updates');
  });

  it('follows the chain in the same world: in review, then approved — awaiting release (was B6-09 f0; B7-11 f2)', async () => {
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    moveClock(sample, SENT);
    const sent = await propose(
      sample,
      DISTILLATION,
      (proposed) => ({ ...proposed, description: CORRECTED_DESCRIPTION, webLink: NEW_LINK }),
      '1.3',
    );
    showUpdates(runtime);
    await heading('Updates');
    await countLine(6);
    // Sent: with the Academic Reviewer, the newest change of the With-others group (25 Aug, before
    // UPD-0004's hold of 20 Aug); UPD-0006, returned on 26 Aug, stays hers.
    const withOthers = () => [...groupOf('With others').querySelectorAll('li.cm-trk')];
    expect(withOthers().map(card)[0]).toEqual([
      'Distillation Column',
      'CHE ZG513 · Process Instrumentation & Control · last change 25 Aug',
      '1.2 live 1.3 proposed',
      'In academic review',
      'Open',
    ]);
    expect(holder(withOthers()[0]!)).toBe('Now: Academic Reviewer Academic review Since 25 Aug');
    expect(withOthers()[0]!.querySelector('.cm-trk-st .xr-st')).toHaveClass('xr-st--info');
    expect(withOthers().map((entry) => text(entry.querySelector('.cm-qname')))).toEqual([
      'Distillation Column',
      'Boiler Drum Level',
    ]);
    expect(
      [...groupOf('Need you').querySelectorAll('li.cm-trk')].map((entry) =>
        text(entry.querySelector('.cm-trk-meta > span')),
      ),
    ).toEqual(['EEE ZC341 · Electrical Machines · last change 26 Aug']);
    // The Academic Reviewer approves it (set-up through the port; RV-04’s own run is above).
    moveClock(sample, DECIDED);
    const reviewer = asPersonId(sample, MENON);
    const view = ok(await reviewer.corrections.getUpdateForReview(sent.id as never));
    ok(
      await reviewer.corrections.approveUpdate({
        id: view.update.id,
        expectedRev: view.update.rev,
      }),
    );
    await act(async () => {
      await runtime.invalidate([{ kind: 'UPD', id: sent.id }]);
    });
    await waitFor(() =>
      expect(withOthers().map(card)[0]).toEqual([
        'Distillation Column',
        'CHE ZG513 · Process Instrumentation & Control · last change 27 Aug',
        '1.2 live 1.3 proposed',
        'Awaiting release decision',
        'Open',
      ]),
    );
    // Now with the Super Admin; nothing is released: 1.2 stays live.
    expect(holder(withOthers()[0]!)).toBe('Now: Super Admin Release decision Waiting since 27 Aug');
    expect(
      within(groupOf('With others')).getByRole('link', {
        name: 'Open the update to Distillation Column, version 1.3, awaiting release decision',
      }),
    ).toHaveAttribute('href', `/content-manager/updates/${sent.id}`);
    expect(await countLine(6)).toBeVisible();
  });

  it('a draft is hers to continue; the version reads “No version label yet” until set', async () => {
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    const cm = asPersonId(sample, KAVYA);
    ok(
      await cm.corrections.openCorrection({
        experimentId: ORIFICE as never,
        entry: 'start-a-correction',
      }),
    );
    showUpdates(runtime);
    await heading('Updates');
    await countLine(6);
    const draft = cards()[0]!;
    expect(draft.closest('section')).toBe(groupOf('Need you'));
    expect(card(draft)).toEqual([
      'Orifice Plate Metering',
      'CHE ZG513 · Process Instrumentation & Control · last change 2 Oct',
      '1.1 live No version label yet',
      'Draft',
      'Continue',
    ]);
    expect(holder(draft)).toBe('Your step, now: You Draft Saved 2 Oct');
    // Draft is neutral (no tone).
    expect(draft.querySelector('.cm-trk-st .xr-st')!.className).toBe('xr-st');
    expect(
      within(draft).getByRole('link', {
        name: 'Continue the update to Orifice Plate Metering, draft',
      }),
    ).toHaveAttribute('href', '/content-manager/updates/UPD-0005');
  });

  it('empty: “You haven’t raised any corrections” with the Content library', async () => {
    const world = await fixtureWorld('spine-start');
    const { runtime } = await worldPlatform(KAVYA, {
      ...world,
      records: { ...world.records, updates: {} },
    });
    showUpdates(runtime);
    await heading('Updates');
    const empty = await screen.findByRole(
      'heading',
      { level: 2, name: 'You haven’t raised any corrections' },
      { timeout: 5000 },
    );
    const box = empty.closest('section.rk-surface')!;
    expect(box).toHaveTextContent('Start one from a published experiment in the Content library.');
    expect(box.querySelector('svg')).not.toBeNull();
    expect(
      within(box as HTMLElement).getByRole('link', { name: 'Open the Content library' }),
    ).toHaveAttribute('href', '/content-manager/library?tab=published');
    // No count, no figures, no card (v46: “0 updates” and no table).
    expect(main().querySelector('.cm-trkcount')).toBeNull();
    expect(main().querySelector('dl.rb-figs')).toBeNull();
    expect(cards()).toHaveLength(0);
  });

  it('loading, then failed + Try again (a test fault plan)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    faults(sample).failNext('CorrectionService.listUpdates' as never);
    showUpdates(runtime);
    await waitFor(() =>
      expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
        'Loading your corrections…',
      ),
    );
    const failed = await screen.findByRole('alert', {}, { timeout: 5000 });
    expect(failed).toHaveTextContent('We couldn’t load your corrections');
    expect(failed).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(within(failed).getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(cards()).toHaveLength(5));
  });
});

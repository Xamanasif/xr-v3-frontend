/**
 * RV-04 Review an update (V3: the owner-approved Academic Reviewer export RV-v1, `RV.dc.html` item
 * view for an update; boards RV04, RV04-return-errors, -confirm, -approved, -returned, -stale-armed,
 * -stale, RV06-update) as Prof. A. Menon and CM-08 Updates (V3: the CM-v1 correction tracker; was
 * B6-09 f0, B6-13 f2, B7-11 f2) as Kavya Nair, on the real composition root and the sample world
 * (spine-start). The correction is prepared through the ports (set-up only): Kavya Nair opens the
 * Distillation Column correction, changes the reflux sentence and the web link, labels it 1.3 with
 * her reason and sends it for academic review at the board’s times (UPD-0005).
 * Everything the pages do — choosing, Approve update through its confirmation, Return to the
 * Content Manager in the panel with its required reason — is done by clicks and typing; approval
 * releases nothing (the public catalogue still lists the live 1.2); the Content Manager’s list
 * follows in the same world. The refusals (stale, withdrawn meanwhile, decided elsewhere, failed
 * for now) are answered by a port stand-in or the fault plan. No drawn state shows an internal
 * reference (the owner’s identifier rule), except the seeded reason quoted as written.
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
/** An element’s text as one string (marked runs and quotation marks joined as printed). */
const flat = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
const heading = (name: string) =>
  screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });
/** The identity card’s status (`header.rv-idcard span.rv-meta-main .xr-st`). */
const status = () => main().querySelector('header.rv-idcard .rv-meta-main .xr-st');
const chip = () => text(status());
/** The identity card’s facts, term and value. */
const facts = () =>
  [...main().querySelectorAll('header.rv-idcard dl.rv-id-facts .rv-id-fact')].map((fact) => [
    text(fact.querySelector('dt')),
    text(fact.querySelector('dd')),
  ]);
const historyRows = () =>
  [...region('Update history').querySelectorAll('ol.rk-tl > li')].map((row) => [
    text(row.querySelector('.rk-tl-w')),
    text(row.querySelector('.rk-tl-t')),
    text(row.querySelector('.rk-tl-n')),
  ]);
const decided = () => document.getElementById('rv-done');
const refusal = () => document.getElementById('rv-refusal');
const TITLE = 'Distillation Column';
const LIVE_SUMMARY =
  'Bring a binary column from cold start to steady state, tuning reflux ratio against overhead purity under realistic lag.';

/** The owner’s identifier rule: no internal reference anywhere a reviewer reads or hears. */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;
/**
 * Every reviewer-facing word on the page — the main’s text, the names and descriptions given by
 * attributes, an open dialog and the tab’s title — carries no reference. `except` leaves out the
 * named exception: the Content Manager’s reason quoted as written (the seeded “Correction
 * UPD-000n.”).
 */
function expectNoReference(except?: string): void {
  const strip = (words: string) => (except ? words.split(except).join('') : words);
  const roots = [main(), ...document.querySelectorAll('dialog[open]')];
  for (const root of roots) {
    expect(strip(text(root))).not.toMatch(REFERENCE);
    for (const element of [root, ...root.querySelectorAll('*')]) {
      for (const name of ['aria-label', 'title', 'placeholder', 'alt', 'value']) {
        expect(element.getAttribute(name) ?? '').not.toMatch(REFERENCE);
      }
    }
  }
  expect(document.title).not.toMatch(REFERENCE);
}

/** Chooses one of the panel’s decisions (`fieldset.rk-fieldset` radios). */
async function choose(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  await user.click(within(panel()).getByRole('radio', { name }));
}

// ---- RV-04: waiting for the decision ------------------------------------------------------------

describe('RV-04 Review an update — waiting for your decision (V3: RV-v1 board RV04)', () => {
  it('the identity card, why, what changes, the live experiment, the history and the open panel', async () => {
    const { runtime, id } = await inReview();
    expect(id).toBe('UPD-0005');
    showReview(runtime, id);
    await heading(TITLE);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const h1 = screen.getByRole('heading', { level: 1, name: TITLE });
    expect(h1).toHaveClass('rk-title');
    expect(h1).toHaveAttribute('id', 'rv-title');
    // The breadcrumb names the experiment under its list; the tab names it too, never the reference.
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(crumbs).getByRole('link', { name: 'Review queue' })).toHaveAttribute(
      'href',
      '/reviewer/queue',
    );
    expect(crumbs.querySelector('[aria-current="page"]')).toHaveTextContent(TITLE);
    expect(
      screen
        .getByRole('navigation', { name: 'Academic Reviewer navigation' })
        .querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', '/reviewer/queue');
    await waitFor(() => expect(document.title).toContain(TITLE));

    // The identity card: Update · 1.2 → 1.3, the name, the summary, the status, the course, the sender.
    const card = main().querySelector('header.rv-idcard')!;
    const kind = card.querySelector('.rv-id-eyebrow .rv-kind')!;
    expect(kind).toHaveClass('rv-kind--update');
    expect(text(kind.querySelector('.rv-kind-t'))).toBe('Update');
    expect(text(kind.querySelector('.rv-kind-d'))).toBe('1.2 → 1.3');
    expect(text(card.querySelector('p.rv-id-lead'))).toBe(LIVE_SUMMARY);
    expect(chip()).toBe('Waiting for your decision');
    expect(status()).toHaveClass('xr-st', 'xr-st--info', 'rk-st-lg', 'rv-st-wrap');
    expect(text(card.querySelector('.rv-meta-course .rk-code'))).toBe('CHE ZG513');
    expect(text(card.querySelector('.rv-meta-course'))).toBe(
      'CHE ZG513 Process Instrumentation & Control',
    );
    expect(text(card.querySelector('.rv-meta-who'))).toBe('From Kavya Nair, Content Manager');
    expect(card.querySelector('a.rk-goto')).toHaveAttribute('href', '#rv-panel');
    expect(facts()).toEqual([
      ['Live version', '1.2 · since 3 Jul'],
      ['Proposed version', '1.3'],
      ['Waiting', expect.stringMatching(/^(?:Today|1 day|\d+ days) · sent 25 Aug$/)],
      ['Formats', 'WEB · VR'],
    ]);
    // The page map: each link names a section on the page, with the changed fields' count.
    const map = screen.getByRole('navigation', { name: 'On this page' });
    expect(
      within(map)
        .getAllByRole('link')
        .map((link) => [link.getAttribute('href'), text(link)]),
    ).toEqual([
      ['#rv-s-why', 'Why this correction'],
      ['#rv-s-cmp', 'What changes 3'],
      ['#rv-s-live', 'Live experiment'],
      ['#rv-s-hist', 'Update history'],
    ]);

    // Why this correction — the Content Manager’s reason, quoted, with who and when.
    const why = region('Why this correction');
    expect(text(why.querySelector('.rv-band .rv-band-note'))).toBe('From the Content Manager');
    expect(text(why.querySelector('blockquote.rk-quote.rv-quote > p:first-child'))).toBe(WHY);
    expect(text(why.querySelector('blockquote .rk-quote-by'))).toBe(
      'Kavya Nair, Content Manager · sent 25 Aug 2026, 16:00',
    );
    // What changes — live now beside proposed, removed words struck, added words highlighted.
    const changes = region('What changes');
    expect(text(changes.querySelector('.rv-block-h .rb-note'))).toBe(
      '3 changed fields · everything else stays as in 1.2',
    );
    const table = within(changes).getByRole('table', {
      name: 'What changes, live now against proposed',
    });
    expect(within(table).getAllByRole('columnheader').map(text)).toEqual([
      'Field',
      'Live now · 1.2',
      'Proposed · 1.3',
    ]);
    const rows = [...table.querySelectorAll('.rv-cmp-row:not(.rv-cmp-row--head)')];
    expect(
      rows.map((row) => [
        text(row.querySelector('.rv-cmp-f')),
        flat(row.querySelector('.rv-cmp-v--was')),
        flat(row.querySelector('.rv-cmp-v:not(.rv-cmp-v--was)')),
      ]),
    ).toEqual([
      [
        'Description',
        `Live now · 1.2${LIVE_DESCRIPTION}`,
        `Proposed · 1.3${CORRECTED_DESCRIPTION}`,
      ],
      ['WEB · web link', `Live now · 1.2${LIVE_LINK}`, `Proposed · 1.3${NEW_LINK}`],
      ['Version', 'Live now · 1.21.2', 'Proposed · 1.31.3'],
    ]);
    expect([...table.querySelectorAll('del')].map(text)).toEqual(['Lowering', '1.2']);
    expect([...table.querySelectorAll('ins')].map(text)).toEqual(['Raising', '-1-3', '1.3']);
    expect(text(changes.querySelector('p.rv-footnote'))).toBe(
      'Removed text is struck through; added text is highlighted.',
    );
    // The live experiment — its outcomes read-only; a correction does not change them.
    const live = region('The live experiment');
    expect(text(live.querySelector('.rv-block-k'))).toBe('Read-only context');
    expect(text(live.querySelector('.rv-block-h .rb-note'))).toBe(
      'Version 1.2 · live since 3 Jul 2026',
    );
    expect(text(live.querySelector('h3.rv-mini-h'))).toBe('Learning outcomes in version 1.2');
    expect([...live.querySelectorAll('ol.rv-lo-ro li')].map(text)).toEqual([
      'Bring a column to steady state from cold start',
      'Tune reflux ratio against an overhead purity target',
    ]);
    expect(text(live.querySelector('p.rv-footnote'))).toBe(
      'Learning outcomes are not part of this correction.',
    );
    // Update history — the steps shown to the reviewer, newest first, quiet while it waits.
    expect(region('Update history')).toHaveClass('rv-block', 'rv-block--quiet', 'rv-hist');
    expect(text(region('Update history').querySelector('.rb-note'))).toBe('Newest first');
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

    // Your decision: before you decide, the choice (none made), the gold button, what happens next.
    expect(panel()).toHaveAttribute('id', 'rv-panel');
    expect([...panel().querySelectorAll('.rv-ready-list li')].map(text)).toEqual([
      'Whole update. You decide on every changed field together.',
      'Version 1.2 stays live until the Super Admin releases 1.3.',
      '3 changed fields. See what changes',
    ]);
    expect(within(panel()).getByRole('link', { name: 'See what changes' })).toHaveAttribute(
      'href',
      '#rv-s-cmp',
    );
    const approve = within(panel()).getByRole('radio', { name: 'Approve update' });
    const giveBack = within(panel()).getByRole('radio', { name: 'Return to the Content Manager' });
    expect(approve).not.toBeChecked();
    expect(giveBack).not.toBeChecked();
    // Each decision is described by its consequence line, then by "Whole update." in Before you
    // decide (RV-v1 `aria-describedby="rv-whole"`).
    expect(approve).toHaveAccessibleDescription(
      'Sends it to the Super Admin, who decides when to release it. The live version doesn’t change until then. Whole update. You decide on every changed field together.',
    );
    expect(giveBack).toHaveAccessibleDescription(
      'You’ll add a reason the Content Manager will see. Whole update. You decide on every changed field together.',
    );
    const go = within(panel()).getByRole('button', { name: 'Approve update' });
    expect(go).toHaveClass('rb-btn', 'rb-btn--primary', 'rk-go');
    expect([...panel().querySelectorAll('.rv-path-list li')].map(text)).toEqual([
      '1 You · academic decision Approve the update, or return it to the Content Manager.',
      '2 Super Admin · release or hold Approving does not release it.',
      '3 Live version Version 1.2 stays live until a release. Releasing changes no one’s access.',
    ]);
    expect(main()).not.toHaveTextContent(/\bpublish\b/i);
    expectNoReference();
  });

  it('pressed without a choice: “Check your decision” takes focus, nothing is sent', async () => {
    const user = userEvent.setup();
    const { runtime, sample, id } = await inReview();
    showReview(runtime, id);
    await heading(TITLE);
    await user.click(within(panel()).getByRole('button', { name: 'Approve update' }));
    const summary = await within(panel()).findByRole('alert');
    expect(summary).toHaveClass('rk-errsum');
    await waitFor(() => expect(summary).toHaveFocus());
    expect(text(summary)).toBe('Check your decision Choose a decision');
    expect(panel().querySelector('fieldset.rk-fieldset')).toHaveClass('is-invalid');
    expect(screen.queryByRole('dialog')).toBeNull();
    // The summary's link moves focus to the choices.
    await user.click(within(summary).getByRole('link', { name: 'Choose a decision' }));
    expect(within(panel()).getByRole('radio', { name: 'Approve update' })).toHaveFocus();
    const still = ok(await asPersonId(sample, MENON).corrections.getUpdateForReview(id as never));
    expect(still.update.state).toBe('in-academic-review');
    // Choosing clears it.
    await choose(user, /^Approve update/);
    expect(within(panel()).queryByRole('alert')).toBeNull();
  });
});

// ---- RV-04: Approve update (the confirmation) → approved -----------------------------------------

describe('RV-04 Approve update (the confirmation → board RV04-approved)', () => {
  it('approval goes to the Super Admin and releases nothing; the Content Manager’s list follows', async () => {
    const user = userEvent.setup();
    const { runtime, sample, id } = await inReview();
    showReview(runtime, id);
    await heading(TITLE);
    await choose(user, /^Approve update/);
    const go = within(panel()).getByRole('button', { name: 'Approve update' });
    await user.click(go);
    const dialog = await screen.findByRole('dialog', {
      name: 'Approve the update to Distillation Column?',
    });
    expect(dialog).toHaveClass('rk-dialog');
    expect(dialog).toHaveAccessibleDescription(
      'Check what approving does now, and what happens only after later decisions.',
    );
    expect(
      [...dialog.querySelectorAll('.rk-dlg-group')].map((group) => [
        text(group.querySelector('h3')),
        [...group.querySelectorAll('li')].map(text),
      ]),
    ).toEqual([
      [
        'What happens now',
        [
          'It goes to the Super Admin for a release decision.',
          'It leaves your review queue and is listed in Reviewed by me.',
        ],
      ],
      [
        'Only after later decisions',
        [
          'Version 1.3 goes live only if the Super Admin releases it. Version 1.2 stays live until then.',
          'Releasing changes no one’s access.',
        ],
      ],
    ]);
    await waitFor(() =>
      expect(
        within(dialog).getByRole('heading', { name: 'Approve the update to Distillation Column?' }),
      ).toHaveFocus(),
    );
    expect(dialog).not.toHaveTextContent(/\b(?:release[sd]? it now|publish)\b/i);
    expectNoReference();
    // Cancel first: nothing is approved; focus back on the button.
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(go).toHaveFocus());
    expect(chip()).toBe('Waiting for your decision');
    await user.click(go);
    const again = await screen.findByRole('dialog', {
      name: 'Approve the update to Distillation Column?',
    });
    // A repeated press sends one decision (repeat-press protection).
    const confirm = within(again).getByRole('button', { name: 'Approve update' });
    await user.dblClick(confirm);

    // Approved: the outcome, focused; the status; the history.
    await waitFor(() => expect(decided()).not.toBeNull());
    await waitFor(() => expect(decided()).toHaveFocus());
    const result = decided()!;
    expect(result).toHaveClass('rk-done');
    expect(result.querySelector('.xr-st')).toHaveClass('xr-st--ok', 'rk-st-lg');
    expect(text(result)).toBe(
      'Approved — with the Super Admin Decided by you on 27 Aug 2026, 11:20 Academic review Approved by you Release decision With the Super Admin Live version 1.2, unchanged Access Unchanged Version 1.2 stays live. Release or hold is the Super Admin’s decision. Back to the review queue',
    );
    expect(within(result).getByRole('link', { name: 'Back to the review queue' })).toHaveAttribute(
      'href',
      '/reviewer/queue',
    );
    expect(chip()).toBe('Approved — with the Super Admin');
    expect(facts()).toContainEqual(['Decided', '27 Aug 2026, 11:20']);
    expect(within(panel()).queryByRole('radio')).toBeNull();
    expect(region('Update history')).toHaveClass('rv-hist--card');
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
    const after = ok(await asPersonId(sample, MENON).corrections.getUpdateForReview(id as never));
    expect(after.update.reviewDecisions).toHaveLength(1);
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
    expect(text(region('The live experiment'))).toContain('Version 1.2 · live since 3 Jul 2026');
    expectNoReference();
  });
});

// ---- RV-04: Return to the Content Manager (in the panel) → returned ------------------------------

describe('RV-04 Return to the Content Manager (in the panel → boards RV04-return-errors, RV04-returned)', () => {
  it('the reason is required; returned, the Content Manager has it again with the reason', async () => {
    const user = userEvent.setup();
    const { runtime, sample, id } = await inReview();
    showReview(runtime, id);
    await heading(TITLE);
    await choose(user, /^Return to the Content Manager/);
    const reason = within(panel()).getByRole('textbox', {
      name: 'Reason the Content Manager will see (required)',
    });
    expect(reason).toHaveAccessibleDescription(
      'Shown first on the correction when it is editable again.',
    );
    expect(reason).toHaveAttribute('id', 'rv-reason');
    expect(text(panel().querySelector('p.rk-pending'))).toBe(
      'Add the reason before you return it.',
    );
    // No references: they are open for update returns.
    expect(within(panel()).queryByRole('checkbox')).toBeNull();
    const go = within(panel()).getByRole('button', { name: 'Return to the Content Manager' });
    // No reason: refused in the panel — the summary takes focus, the field says why; nothing is sent.
    await user.click(go);
    const summary = await within(panel()).findByRole('alert');
    await waitFor(() => expect(summary).toHaveFocus());
    expect(text(summary)).toBe(
      'Check your decision Add a reason so the Content Manager knows what to change',
    );
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    expect(reason).toHaveAccessibleDescription(
      'Shown first on the correction when it is editable again. Add a reason so the Content Manager knows what to change',
    );
    // The pending line steps aside while the same problem is shown as an error.
    expect(panel().querySelector('p.rk-pending')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
    const still = ok(await asPersonId(sample, MENON).corrections.getUpdateForReview(id as never));
    expect(still.update.state).toBe('in-academic-review');
    expectNoReference();
    await user.click(within(summary).getByRole('link'));
    expect(reason).toHaveFocus();

    await user.type(reason, RETURN_REASON);
    expect(reason).not.toHaveAttribute('aria-invalid');
    // No confirmation: the return is sent at once.
    await user.click(go);
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(decided()).not.toBeNull());
    await waitFor(() => expect(decided()).toHaveFocus());
    expect(decided()!.querySelector('.xr-st')).toHaveClass('xr-st--err');
    expect(text(decided())).toBe(
      `Returned to the Content Manager Decided by you on 27 Aug 2026, 11:20 Your reason “ ${RETURN_REASON} ” Academic review Returned to the Content Manager Live version 1.2, unchanged The Content Manager can change it and send it again. Back to the review queue`,
    );
    expect(decided()!.querySelector('.rv-done-q b')).toHaveTextContent('Your reason');
    expect(flat(decided()!.querySelector('.rv-done-q'))).toBe(`Your reason“${RETURN_REASON}”`);
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
    expectNoReference();
  });

  it('failed for now: the panel says so, the reason is kept; the next press goes through', async () => {
    const user = userEvent.setup();
    const { runtime, sample, id } = await inReview();
    showReview(runtime, id);
    await heading(TITLE);
    await choose(user, /^Return to the Content Manager/);
    const reason = within(panel()).getByRole('textbox', {
      name: 'Reason the Content Manager will see (required)',
    });
    await user.type(reason, RETURN_REASON);
    faults(sample).failNext('CorrectionService.returnUpdate' as never);
    const go = within(panel()).getByRole('button', { name: 'Return to the Content Manager' });
    await user.click(go);
    expect(await within(panel()).findByRole('alert')).toHaveTextContent(
      'Your decision wasn’t sent. Nothing was lost — try again.',
    );
    expect(reason).toHaveValue(RETURN_REASON);
    await user.click(go);
    await waitFor(() => expect(decided()).toHaveTextContent('Returned to the Content Manager'));
  });
});

// ---- RV-04: the other states -------------------------------------------------------------------

describe('RV-04 — not sent yet, out of scope, withdrawn, on hold, released (RV06-update)', () => {
  it('a draft is not shown: the XS message “No update is waiting for your decision”', async () => {
    const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
    const draft = await propose(
      sample,
      DISTILLATION,
      (proposed) => ({ ...proposed, description: CORRECTED_DESCRIPTION }),
      '1.3',
      { send: false },
    );
    showReview(runtime, draft.id);
    const title = await heading('No update is waiting for your decision');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const message = title.closest('section.xs-msg')!;
    expect(message).toHaveTextContent(
      'Corrections from the Content Manager appear in your review queue once they are sent.',
    );
    expect(
      within(message as HTMLElement).getByRole('link', { name: 'Open the review queue' }),
    ).toHaveAttribute('href', '/reviewer/queue');
    expect(within(message as HTMLElement).getByRole('link', { name: 'Help' })).toHaveAttribute(
      'href',
      '/reviewer/help',
    );
    expect(main()).not.toHaveTextContent(CORRECTED_DESCRIPTION);
    expect(screen.queryByRole('complementary', { name: 'Your decision' })).toBeNull();
    expectNoReference();
  });

  it('outside the reviewer’s scope (UPD-0006, EEE ZC341 withdrawn): not found, as the service says', async () => {
    const { runtime } = await tabPlatform(MENON, 'spine-start');
    showReview(runtime, 'UPD-0006');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
    expect(main()).not.toHaveTextContent('Induction Motor Loading');
  });

  it('withdrawn by the Content Manager: read-only under Reviewed by me, the reason stays hers', async () => {
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
    expect(chip()).toBe('Withdrawn by the Content Manager');
    expect(status()).toHaveClass('rk-st-ended');
    expect(text(decided())).toBe(
      'Withdrawn by the Content Manager Update Withdrawn by the Content Manager Live version 1.2, unchanged There is nothing to decide. Back to Reviewed by me',
    );
    expect(
      within(screen.getByRole('navigation', { name: 'Breadcrumb' })).getByRole('link', {
        name: 'Reviewed by me',
      }),
    ).toHaveAttribute('href', '/reviewer/reviewed');
    expect(main()).not.toHaveTextContent('The vendor will fix the build first.');
    expect(within(panel()).queryByRole('button')).toBeNull();
    expectNoReference();
  });

  it('on hold (UPD-0004) reads as with the Super Admin; released (UPD-0003): the release', async () => {
    const { runtime } = await tabPlatform(MENON, 'spine-start');
    const held = showReview(runtime, 'UPD-0004');
    await heading('Boiler Drum Level');
    expect(text(main().querySelector('.rv-kind-d'))).toBe('2.0 → 2.1');
    expect(chip()).toBe('Approved — with the Super Admin');
    expect(main()).not.toHaveTextContent(/on hold|\bheld\b/i);
    expect(text(decided())).toMatch(
      /^Approved — with the Super Admin Decided by you on \d{1,2} [A-Z][a-z]{2} 2026, \d{2}:\d{2} Academic review Approved by you Release decision With the Super Admin Live version 2\.0, unchanged Access Unchanged Version 2\.0 stays live\. Release or hold is the Super Admin’s decision\. Back to Reviewed by me$/,
    );
    expect(historyRows().map((row) => row[0])).toEqual([
      'Approved by Prof. A. Menon',
      'Sent for academic review',
      'Correction started from the published experiment',
    ]);
    // The seeded reason is quoted as written (“Correction UPD-0004.”): the named exception.
    const seeded = text(region('Why this correction').querySelector('blockquote > p'));
    expectNoReference(seeded);
    held.view.unmount();
    showReview(runtime, 'UPD-0003');
    await heading('Orifice Plate Metering');
    expect(chip()).toBe('Approved — released');
    expect(text(decided())).toMatch(
      /^Approved — released Decided by you on .+ Academic review Approved by you Release Released on \d{1,2} [A-Z][a-z]{2} 2026 Live version 1\.1 Version 1\.1 is live\. Releasing changed no one’s access\. Back to Reviewed by me$/,
    );
    expect(historyRows()[0]![0]).toBe('Released by Arjun Mehta');
    expect(historyRows()[0]![2]).toBe('Version 1.1 is live for everyone.');
    // Released: compared with the version its release replaced — “Live before · Released”.
    const released = within(region('What changes')).getByRole('table');
    expect(within(released).getAllByRole('columnheader').map(text)).toEqual([
      'Field',
      'Live before · 1.0',
      'Released · 1.1',
    ]);
    expect(text(released)).toContain('Version');
    expectNoReference(text(region('Why this correction').querySelector('blockquote > p')));
  });
});

// ---- RV-04: refusals ---------------------------------------------------------------------------

describe('RV-04 — refusals (boards RV04-stale-armed, RV04-stale), not found, loading and failed', () => {
  it('stale while still waiting: nothing written, the notice in the panel; the next Approve goes through', async () => {
    const user = userEvent.setup();
    const { runtime, sample, id } = await inReview();
    answerWith(runtime, 'approveUpdate', { kind: 'stale-version', currentRev: 99 });
    showReview(runtime, id);
    await heading(TITLE);
    await choose(user, /^Approve update/);
    await user.click(within(panel()).getByRole('button', { name: 'Approve update' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Approve update' }),
    );
    await waitFor(() => expect(refusal()).not.toBeNull());
    expect(refusal()).toHaveClass('rk-notice', 'rk-notice--warn', 'rv-refusal');
    expect(text(refusal())).toBe(
      'This update changed since you opened it It has been read again. Check what changes and decide again.',
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(refusal()).toHaveFocus());
    const view = ok(await asPersonId(sample, MENON).corrections.getUpdateForReview(id as never));
    expect(view.update.state).toBe('in-academic-review');
    vi.restoreAllMocks();
    await user.click(within(panel()).getByRole('button', { name: 'Approve update' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Approve update' }),
    );
    await waitFor(() => expect(decided()).toHaveTextContent('Approved — with the Super Admin'));
    expect(refusal()).toBeNull();
  });

  it('withdrawn after the page was opened: “Nothing was recorded” and where it stands', async () => {
    const user = userEvent.setup();
    const { runtime, sample, id } = await inReview();
    answerWith(runtime, 'approveUpdate', { kind: 'invalid-state', current: 'withdrawn' });
    showReview(runtime, id);
    await heading(TITLE);
    await choose(user, /^Approve update/);
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
    await waitFor(() => expect(refusal()).not.toBeNull());
    expect(text(refusal())).toBe(
      'Nothing was recorded The Content Manager withdrew this update after you opened it. The page now shows where it stands.',
    );
    await waitFor(() => expect(refusal()).toHaveFocus());
    expect(chip()).toBe('Withdrawn by the Content Manager');
    expect(text(decided())).toBe(
      'Withdrawn by the Content Manager Update Withdrawn by the Content Manager Live version 1.2, unchanged There is nothing to decide. Back to the review queue',
    );
    expect(main()).not.toHaveTextContent('Not needed after all.');
    expect(region('Update history')).toHaveClass('rv-hist--card');
    expectNoReference();
  });

  it('decided in another window: “Nothing new was recorded” and the decision shown read-only', async () => {
    const user = userEvent.setup();
    const { runtime, sample, id } = await inReview();
    answerWith(runtime, 'returnUpdate', {
      kind: 'invalid-state',
      current: 'awaiting-release-decision',
    });
    showReview(runtime, id);
    await heading(TITLE);
    // Meanwhile the same reviewer approves it in another window (set-up through the port).
    const current = ok(await asPersonId(sample, MENON).corrections.getUpdateForReview(id as never));
    ok(
      await asPersonId(sample, MENON).corrections.approveUpdate({
        id: current.update.id,
        expectedRev: current.update.rev,
      } as never),
    );
    await choose(user, /^Return to the Content Manager/);
    await user.type(
      within(panel()).getByRole('textbox', { name: /^Reason the Content Manager will see/ }),
      RETURN_REASON,
    );
    await user.click(
      within(panel()).getByRole('button', { name: 'Return to the Content Manager' }),
    );
    await waitFor(() => expect(refusal()).not.toBeNull());
    expect(text(refusal())).toBe(
      'Nothing new was recorded It is no longer waiting for your decision — nothing you entered was sent.',
    );
    await waitFor(() => expect(refusal()).toHaveFocus());
    expect(decided()).toHaveTextContent('Approved — with the Super Admin');
    const after = ok(await asPersonId(sample, KAVYA).corrections.getUpdate(id as never));
    expect(after.update.state).toBe('awaiting-release-decision');
  });

  it('failed for now: the confirmation stays open and says so; the next press goes through', async () => {
    const user = userEvent.setup();
    const { runtime, sample, id } = await inReview();
    showReview(runtime, id);
    await heading(TITLE);
    await choose(user, /^Approve update/);
    await user.click(within(panel()).getByRole('button', { name: 'Approve update' }));
    const dialog = await screen.findByRole('dialog');
    faults(sample).failNext('CorrectionService.approveUpdate' as never);
    await user.click(within(dialog).getByRole('button', { name: 'Approve update' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Your decision wasn’t sent. Nothing was lost — try again.',
    );
    expect(dialog).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Approve update' }));
    await waitFor(() => expect(decided()).toHaveTextContent('Approved — with the Super Admin'));
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

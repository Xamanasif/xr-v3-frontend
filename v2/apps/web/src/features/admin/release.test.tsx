/**
 * Phase 6 · the Super Admin's release decision: SA-10 Content › Updates (B7-05 f0, f2, f3, f4;
 * B7-11 f0) and SA-11 Release or hold an update (B7-05 f1, f5 … f10; B7-10 f0 … f4), on the real
 * composition root and the sample world — after-flow-e (UPD-0005 approved and waiting, 23 Oct
 * 2026), after-flow-f (UPD-0005 released) and spine-start (UPD-0004 on hold, UPD-0006 returned).
 * The lists are the service's answers per tab; the three commands carry the revision their
 * confirmation opened on; a refusal writes nothing and is said calmly; Release changes the
 * experiment's live version and nothing else (BC9: no plan, grant or person), and “Publish” is
 * never said on this path.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { asPersonId, faults, snapshot } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { expandTarget } from '@/nav/link-targets';
import { P6_RELEASE_LINK_TARGETS } from '@/nav/link-targets-p6/release';
import { resolveAddress } from '@/nav/routes';
import type { PlatformRuntime } from '@/platform/runtime';
import {
  renderInTab,
  SUPER_ADMIN,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { ContentUpdates } from './sa-10-updates/content-updates';
import { decisionFacts, historyEvents } from './sa-11-update-decision/decision-view';
import { UpdateDecision } from './sa-11-update-decision/update-decision';

afterEach(() => {
  forgetLastAddress();
});

const LIST = '/admin/content/updates';
const KAVYA = 'per-kavya-nair';
const RAHUL = 'per-0002';
const DISTILLATION = 'distillation-column';

function inAdmin(runtime: PlatformRuntime, path: string, page: ReactNode, search = '') {
  const navigation = testNavigation(path, search);
  const view = renderInTab(
    <WorkspaceLayout workspace="admin">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

function showDecision(runtime: PlatformRuntime, id: string) {
  return inAdmin(runtime, `${LIST}/${id}`, <UpdateDecision updateId={id} />);
}

const main = () => screen.getByRole('main');
const topTitle = () => document.querySelector('.xr-top-title')?.textContent;
const currentNav = () => document.querySelector('.xr-nav a[aria-current="page"]');
const crumbs = () => text(screen.getByRole('list', { name: 'You are here' }));
const panel = () => screen.getByRole('complementary', { name: 'Your decision' });
const chip = () => text(main().querySelector('.xr-phead-meta .xr-status'));
const heading = (name: string) =>
  screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });

/** An element's words, its text nodes joined by spaces (as a screen reader reads them). */
function text(element: Element | null): string {
  if (!element) return '';
  const parts: string[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    parts.push(node.textContent ?? '');
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

const cells = (row: Element) => [...row.querySelectorAll('td')].map((cell) => text(cell));

/** “Publish” is never said on this path (B7-05 “Never”; B7-10 “Release vs Publish”). */
function expectNoPublish() {
  expect(document.body.textContent ?? '').not.toMatch(/publish(?!ed)/i);
  expect(document.body.textContent ?? '').not.toMatch(/\bPublish\b/);
}

async function decisionOf(runtime: PlatformRuntime, id: string) {
  const answer = await runtime.ports.corrections.getUpdateDecision(id as never);
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

// ---- SA-10 Content › Updates ------------------------------------------------------------------

describe('SA-10 — Content › Updates (B7-05 f0, f2, f3, f4; B7-11 f0)', () => {
  it('Waiting for you: the header, the sub-navigation, the tabs with their counts and UPD-0005 (f0)', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const version = sample.worldVersion();
    inAdmin(runtime, LIST, <ContentUpdates />);
    const tablist = await screen.findByRole('tablist', { name: 'Show' });
    expect(screen.getByRole('heading', { level: 1, name: 'Content' })).toBeVisible();
    expect(text(main().querySelector('.xr-phead-meta .xl-meta'))).toBe(
      'Corrections raised by the Content Manager and approved by the Academic Reviewer wait here for release',
    );
    expect(topTitle()).toBe('Content');
    expect(crumbs()).toMatch(/^Content \/ Updates$/);
    expect(currentNav()).toHaveTextContent('Content');
    const subnav = screen.getByRole('navigation', { name: 'Content' });
    expect(subnav).toHaveClass('xr-tabs', 'xr-tabs--on-white');
    expect(
      within(subnav)
        .getAllByRole('link')
        .map((link) => [
          link.textContent,
          link.getAttribute('href'),
          link.getAttribute('aria-current'),
        ]),
    ).toEqual([
      ['Updates', LIST, 'page'],
      ['All content', '/admin/content/all', null],
    ]);
    const section = screen.getByRole('region', { name: 'Corrections to published content' });
    expect(text(section.querySelector('.xr-section-head .xr-meta'))).toBe(
      'Approved by the Academic Reviewer',
    );
    expect(
      within(tablist)
        .getAllByRole('tab')
        .map((tab) => text(tab)),
    ).toEqual(['Waiting for you 1', 'On hold 1', 'Released 3']);
    expect(within(tablist).getByRole('tab', { name: /Waiting for you/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const table = within(section).getByRole('table');
    expect([...table.querySelectorAll('th')].map((th) => text(th))).toEqual([
      'Update',
      'Status',
      'Action',
    ]);
    expect(table.querySelector('th:last-child .xr-sr')).not.toBeNull();
    const rows = table.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(1);
    expect(cells(rows[0]!)).toEqual([
      'Distillation Column · 1.2 → 1.3 UPD-0005 · CHE ZG513',
      'Waiting for your decision Approved by the Academic Reviewer on 22 Oct 2026',
      'Review',
    ]);
    expect(rows[0]!.querySelector('.xr-id')).toHaveTextContent('UPD-0005');
    expect(rows[0]!.querySelector('.xr-status')).toHaveClass('xr-status--wait');
    const review = within(rows[0] as HTMLElement).getByRole('link', {
      name: 'Review UPD-0005 Distillation Column · 1.2 → 1.3',
    });
    expect(review).toHaveAttribute('href', `${LIST}/UPD-0005`);
    expect(review).toHaveClass('xr-btn', 'xr-btn--secondary', 'xr-btn--sm');
    expect(
      [...rows[0]!.querySelectorAll('td[data-label]')].map((cell) =>
        cell.getAttribute('data-label'),
      ),
    ).toEqual(['Status']);
    expectNoPublish();
    // Opening the list writes nothing.
    expect(sample.worldVersion()).toBe(version);
  });

  it('On hold and Released: the tab changes the address; each row opens its record (f2, f3)', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const { navigation } = inAdmin(runtime, LIST, <ContentUpdates />);
    const tablist = await screen.findByRole('tablist', { name: 'Show' });
    await user.click(within(tablist).getByRole('tab', { name: /On hold/ }));
    expect(navigation.replace).toHaveBeenLastCalledWith(`${LIST}?show=on-hold`);
    let rows = screen.getByRole('table').querySelectorAll('tbody tr');
    expect([...rows].map((row) => cells(row))).toEqual([
      [
        'Boiler Drum Level · 2.0 → 2.1 UPD-0004 · CHE ZG513',
        'On hold On hold since 20 Aug 2026',
        'Open',
      ],
    ]);
    expect(rows[0]!.querySelector('.xr-status')).toHaveClass('xr-status--paused');
    expect(
      within(rows[0] as HTMLElement).getByRole('link', {
        name: 'Open UPD-0004 Boiler Drum Level · 2.0 → 2.1',
      }),
    ).toHaveAttribute('href', `${LIST}/UPD-0004`);
    // ← → move between the tabs (board 12 “Patterns”).
    await user.keyboard('{ArrowRight}');
    expect(within(tablist).getByRole('tab', { name: /Released/ })).toHaveFocus();
    expect(navigation.replace).toHaveBeenLastCalledWith(`${LIST}?show=released`);
    rows = screen.getByRole('table').querySelectorAll('tbody tr');
    expect([...rows].map((row) => cells(row))).toEqual([
      [
        'Orifice Plate Metering · 1.0 → 1.1 UPD-0003 · CHE ZG513',
        'Released Released on 5 Aug 2026',
        'Open',
      ],
      [
        'Distillation Column · 1.1 → 1.2 UPD-0002 · CHE ZG513',
        'Released Released on 3 Jul 2026',
        'Open',
      ],
      [
        'Distillation Column · 1.0 → 1.1 UPD-0001 · CHE ZG513',
        'Released Released on 19 Jun 2026',
        'Open',
      ],
    ]);
    expect(rows[0]!.querySelector('.xr-status')).toHaveClass('xr-status--ok');
    expectNoPublish();
  });

  it('the address names the tab; an unknown one is replaced by the list’s address', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-f');
    inAdmin(runtime, LIST, <ContentUpdates />, '?show=released');
    const tablist = await screen.findByRole('tablist', { name: 'Show' });
    expect(within(tablist).getByRole('tab', { name: /Released/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(text(screen.getByRole('table').querySelector('tbody tr'))).toContain(
      'Distillation Column · 1.2 → 1.3 UPD-0005 · CHE ZG513 Released Released on 24 Oct 2026',
    );
    const other = await tabPlatform(SUPER_ADMIN, 'after-flow-f');
    const { navigation } = inAdmin(other.runtime, LIST, <ContentUpdates />, '?show=everything');
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith(LIST));
  });

  it('nothing waiting: the calm empty state, the other tabs still counted (f4)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    inAdmin(runtime, LIST, <ContentUpdates />);
    const tablist = await screen.findByRole('tablist', { name: 'Show' });
    expect(
      within(tablist)
        .getAllByRole('tab')
        .map((tab) => text(tab)),
    ).toEqual(['Waiting for you 0', 'On hold 1', 'Released 3']);
    expect(screen.queryByRole('table')).toBeNull();
    const empty = main().querySelector('.xr-empty')!;
    expect(within(empty as HTMLElement).getByRole('heading', { level: 3 })).toHaveTextContent(
      'Nothing is waiting for a release decision',
    );
    expect(text(empty.querySelector('p'))).toBe(
      'Corrections reach you after the Academic Reviewer approves them.',
    );
  });

  it('loading is announced; failed says so and “Try again” reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    faults(sample).failNext('CorrectionService.listUpdatesForRelease' as never);
    inAdmin(runtime, LIST, <ContentUpdates />);
    expect(await screen.findByText('Loading the updates')).toHaveAttribute('role', 'status');
    expect(await screen.findByText('We couldn’t load the updates')).toBeVisible();
    expect(screen.getByText('Nothing has changed. Try again.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('tablist', { name: 'Show' })).toBeVisible();
  });
});

// ---- SA-11 Release or hold an update -----------------------------------------------------------

describe('SA-11 — waiting for your decision (B7-05 f1; B7-11 f1)', () => {
  it('the header, what changes, why, the review, the institutions, the history and the open panel', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const version = sample.worldVersion();
    showDecision(runtime, 'UPD-0005');
    await heading('Distillation Column · 1.2 → 1.3');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', LIST);
    expect(text(main().querySelector('a.xr-back'))).toBe('Updates');
    expect(text(main().querySelector('.xr-overline'))).toBe(
      'UPD-0005 · Correction to published content',
    );
    expect(chip()).toBe('Waiting for your decision');
    expect(main().querySelector('.xr-phead-meta .xr-status')).toHaveClass('xr-status--wait');
    expect(text(main().querySelector('.xr-phead-meta'))).toContain(
      'Live now: version 1.2 · since 3 Jul 2026',
    );
    expect(topTitle()).toBe('Content');
    expect(crumbs()).toMatch(/^Content \/ Updates \/ UPD-0005$/);
    expect(currentNav()).toHaveTextContent('Content');
    // “Go to decision” before the layout; no “Hold lifted” notice before a lift.
    expect(main().querySelector('a.xr-jump')).toHaveAttribute('href', '#update-decision');
    expect(screen.queryByText('Hold lifted')).toBeNull();

    const changes = screen.getByRole('region', { name: 'What changes' });
    expect(text(changes.querySelector('.xr-section-head .xr-meta'))).toBe('Changed fields only');
    const comparison = within(changes).getByRole('table', { name: 'Current and proposed' });
    expect(
      [...comparison.querySelectorAll('[role="columnheader"]')].map((cell) => text(cell)),
    ).toEqual(['Field', 'Live now', 'Proposed']);
    expect(
      [...comparison.querySelectorAll('[role="rowheader"]')].map((cell) => text(cell)),
    ).toEqual(['Description', 'WEB · web link', 'Version']);
    expect(text(comparison)).toContain('Lowering the reflux ratio raises the overhead purity');
    expect(text(comparison)).toContain('Raising the reflux ratio raises the overhead purity');
    expect(text(comparison)).toContain('https://labs.meridian.example/distillation-column-1-3');

    const why = screen.getByRole('region', { name: 'Why — from the Content Manager' });
    expect(text(why.querySelector('blockquote.xv-quote'))).toMatch(
      /^Corrects the reflux statement in the description/,
    );
    expect(text(why.querySelector('p.xl-meta'))).toBe(
      'Raised by Kavya Nair, Content Manager · started 20 Oct 2026 · sent for academic review 20 Oct 2026',
    );
    const review = screen.getByRole('region', { name: 'Academic review' });
    expect(text(review.querySelector('p.xr-body'))).toBe(
      'Approved Approved by Prof. A. Menon on 22 Oct 2026',
    );
    expect(review.querySelector('.xr-status')).toHaveClass('xr-status--ok');
    expect(text(review.querySelector('p.xl-meta'))).toBe('The full review history is below.');

    const institutions = screen.getByRole('region', { name: 'Institutions using it' });
    expect(institutions.querySelector('.xr-section-head .xr-meta')).toBeNull();
    const table = within(institutions).getByRole('table');
    expect([...table.querySelectorAll('th')].map((th) => text(th))).toEqual([
      'Institution',
      'Access',
      'Students',
      'Note',
    ]);
    expect([...table.querySelectorAll('tbody tr')].map((row) => cells(row))).toEqual([
      [
        'BITS Pilani — Hyderabad Campus',
        'ACC-0098 · WEB + VR',
        'No students with access yet',
        'Access ends 31 Oct 2026 · renewal REQ-0038 under review',
      ],
    ]);
    expect(text(institutions.querySelector('p.xl-meta'))).toBe(
      'Release changes the experiment for everyone at once. Nothing here changes any institution’s access.',
    );

    const history = screen.getByRole('region', { name: 'History' });
    expect(text(history.querySelector('.xr-section-head .xr-meta'))).toBe(
      'Newest first · kept after every decision',
    );
    expect([...history.querySelectorAll('li.xr-tl')].map((item) => text(item))).toEqual([
      'Approved by Prof. A. Menon 22 Oct 2026, 11:20 With the Super Admin for a release decision. The live version stays 1.2 until then.',
      'Sent for academic review 20 Oct 2026, 16:00 To Prof. A. Menon. The live version 1.2 is unchanged.',
      'Correction started from the published experiment 20 Oct 2026, 15:40 Pre-filled with the live version 1.2.',
    ]);
    expect(history.querySelector('li.is-latest')).toBeNull();

    // The open panel: Release update (chosen) or Hold, and the one primary button.
    expect(panel()).toHaveClass('xr-dpanel', 'xg-static');
    expect(within(panel()).getByRole('radio', { name: /^Release update/ })).toBeChecked();
    expect(within(panel()).getByRole('radio', { name: /^Hold/ })).not.toBeChecked();
    expect(text(panel().querySelector('.xr-choice-list'))).toBe(
      'Release update The proposed version goes live for everyone. Hold The live version stays. You can lift the hold later.',
    );
    expect(within(panel()).getByRole('button', { name: 'Release update' })).toHaveClass(
      'xr-btn--primary',
      'xr-btn--block',
    );
    expectNoPublish();
    expect(sample.worldVersion()).toBe(version);
  });
});

describe('SA-11 — Release (B7-05 f8, f6; B7-10 f0, f3)', () => {
  it('DL-1 says what goes live and for whom; Cancel changes nothing; Release changes the live version and nothing else', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const rahulBefore = await asPersonId(sample, RAHUL).catalogue.getExperiment(
      DISTILLATION as never,
    );
    showDecision(runtime, 'UPD-0005');
    await heading('Distillation Column · 1.2 → 1.3');
    const before = snapshot(sample);

    const go = within(panel()).getByRole('button', { name: 'Release update' });
    await user.click(go);
    let dialog = await screen.findByRole('dialog', { name: 'Release UPD-0005?' });
    expect(text(dialog.querySelector('.xr-dialog-body'))).toBe(
      'Version 1.3 of Distillation Column goes live for everyone — the public catalogue and every institution that uses it. Version 1.2 is no longer shown.',
    );
    expect(dialog).toHaveClass('xr-x-dialog--decision');
    expect(within(dialog).getByRole('button', { name: 'Release update' })).toHaveFocus();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(go).toHaveFocus();
    expect(snapshot(sample)).toEqual(before);

    await user.click(go);
    dialog = await screen.findByRole('dialog', { name: 'Release UPD-0005?' });
    await user.click(within(dialog).getByRole('button', { name: 'Release update' }));
    await waitFor(() => expect(chip()).toBe('Released'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(main().querySelector('.xr-phead-meta .xr-status')).toHaveClass('xr-status--ok');
    expect(text(main().querySelector('.xr-phead-meta'))).toContain(
      'Live now: version 1.3 · released 23 Oct 2026',
    );
    const decided = panel().querySelector('#update-decided')!;
    expect(text(decided)).toBe(
      'Released Released on 23 Oct 2026 · Arjun Mehta Version 1.3 is live for everyone. The history below keeps the earlier version and every decision.',
    );
    await waitFor(() => expect(decided).toHaveFocus());
    expect(within(panel()).queryByRole('button')).toBeNull();
    expect(text(screen.getByRole('region', { name: 'History' }).querySelector('li'))).toMatch(
      /^Released by Arjun Mehta 23 Oct 2026, \d\d:\d\d Version 1\.3 is live for everyone\.$/,
    );
    // The page title keeps the versions of the release; the comparison is kept for the record
    // against the version the release replaced — "Field · Live before · Released" (B7-05 f6).
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Distillation Column · 1.2 → 1.3',
    );
    const compared = within(screen.getByRole('region', { name: 'What changes' }));
    expect(compared.getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual([
      'Field',
      'Live before',
      'Released',
    ]);
    expect(compared.getAllByRole('rowheader').map((cell) => cell.textContent)).toEqual([
      'Description',
      'WEB · web link',
      'Version',
    ]);
    expectNoPublish();

    // Only the update and the experiment's live version changed (BC9).
    const after = snapshot(sample);
    const changed = Object.keys(after).filter(
      (key) => JSON.stringify(after[key]) !== JSON.stringify(before[key]),
    );
    expect(changed.sort()).toEqual(
      Object.keys(after)
        .filter((key) => /UPD-0005|distillation-column/.test(key))
        .filter((key) => JSON.stringify(after[key]) !== JSON.stringify(before[key]))
        .sort(),
    );
    expect(changed.length).toBe(2);
    // The public catalogue reads the released version; the same Student opens it as before.
    const page = await asPersonId(sample, RAHUL).catalogue.getExperiment(DISTILLATION as never);
    expect(page.ok && page.value.description).toMatch(/^Learners start a binary column.*Raising/);
    expect(rahulBefore.ok && rahulBefore.value.description).toMatch(/Lowering/);
    const cm = await asPersonId(sample, KAVYA).corrections.getPublishedExperiment(
      DISTILLATION as never,
    );
    expect(cm.ok && cm.value.experiment.live.label).toBe('1.3');
  });

  it('a stale revision: nothing is released, the panel says so and the update is read again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showDecision(runtime, 'UPD-0005');
    await heading('Distillation Column · 1.2 → 1.3');
    // Meanwhile, in another tab, the Super Admin held and lifted it (the revision moved on).
    const other = asPersonId(sample, SUPER_ADMIN).corrections;
    const read = await other.getUpdateDecision('UPD-0005' as never);
    if (!read.ok) throw new Error(read.error.kind);
    const held = await other.holdUpdate({
      id: 'UPD-0005' as never,
      reason: 'Checked in another tab.',
      expectedRev: read.value.update.rev,
    });
    if (!held.ok) throw new Error(held.error.kind);
    await other.liftHold({ id: 'UPD-0005' as never, expectedRev: held.value.rev });

    await user.click(within(panel()).getByRole('button', { name: 'Release update' }));
    const dialog = await screen.findByRole('dialog', { name: 'Release UPD-0005?' });
    await user.click(within(dialog).getByRole('button', { name: 'Release update' }));
    expect(
      await within(panel()).findByText('This update changed since you opened it'),
    ).toBeVisible();
    expect(
      within(panel()).getByText('It has been read again. Check it, then decide again.'),
    ).toBeVisible();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: 'Your decision' })).toHaveFocus(),
    );
    // Read again: still waiting, the lift is noted; nothing went live.
    expect(chip()).toBe('Waiting for your decision');
    expect(await screen.findByText('Hold lifted')).toBeVisible();
    expect((await decisionOf(runtime, 'UPD-0005')).update.state).toBe('awaiting-release-decision');
  });

  it('decided meanwhile elsewhere: the panel says it moved on and shows its current state', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showDecision(runtime, 'UPD-0005');
    await heading('Distillation Column · 1.2 → 1.3');
    const other = asPersonId(sample, SUPER_ADMIN).corrections;
    const read = await other.getUpdateDecision('UPD-0005' as never);
    if (!read.ok) throw new Error(read.error.kind);
    await other.releaseUpdate({ id: 'UPD-0005' as never, expectedRev: read.value.update.rev });

    await user.click(within(panel()).getByRole('button', { name: 'Release update' }));
    const dialog = await screen.findByRole('dialog', { name: 'Release UPD-0005?' });
    await user.click(within(dialog).getByRole('button', { name: 'Release update' }));
    expect(
      await within(panel()).findByText('This update has moved on. Its current state is shown.'),
    ).toBeVisible();
    await waitFor(() => expect(chip()).toBe('Released'));
  });

  it('failed for now: the confirmation stays open and says nothing was lost', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showDecision(runtime, 'UPD-0005');
    await heading('Distillation Column · 1.2 → 1.3');
    faults(sample).failNext('CorrectionService.releaseUpdate' as never);
    await user.click(within(panel()).getByRole('button', { name: 'Release update' }));
    const dialog = await screen.findByRole('dialog', { name: 'Release UPD-0005?' });
    await user.click(within(dialog).getByRole('button', { name: 'Release update' }));
    expect(
      await within(dialog).findByText('It wasn’t released. Nothing was lost — try again.'),
    ).toBeVisible();
    expect(chip()).toBe('Waiting for your decision');
  });
});

describe('SA-11 — Hold and Lift hold (B7-05 f9, f5, f7; B7-10 f1, f2)', () => {
  it('the reason is required; Hold keeps 1.2 live; Release is not offered; Lift hold returns it to waiting', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showDecision(runtime, 'UPD-0005');
    await heading('Distillation Column · 1.2 → 1.3');

    await user.click(within(panel()).getByRole('radio', { name: /^Hold/ }));
    const go = within(panel()).getByRole('button', { name: 'Hold' });
    await user.click(go);
    const dialog = await screen.findByRole('dialog', { name: 'Hold UPD-0005?' });
    expect(text(dialog.querySelector('.xr-dialog-body > p'))).toBe(
      'Version 1.2 stays live. The update waits until you lift the hold. The Content Manager sees your reason.',
    );
    const reason = within(dialog).getByRole('textbox', {
      name: 'Reason the Content Manager will see',
    });
    expect(reason).toHaveFocus();
    // f9: Hold with no reason — the error on the field, focus on it, nothing sent.
    const before = snapshot(sample);
    await user.click(within(dialog).getByRole('button', { name: 'Hold' }));
    expect(
      await within(dialog).findByText('Add a reason — the Content Manager sees it'),
    ).toBeVisible();
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(reason).toHaveFocus());
    expect(snapshot(sample)).toEqual(before);

    await user.type(
      reason,
      'Hold until the Hyderabad lab has finished this month’s runs on version 1.2.',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Hold' }));
    await waitFor(() => expect(chip()).toBe('On hold'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const decided = panel().querySelector('#update-decided')!;
    expect(text(decided)).toBe(
      'On hold On hold since 23 Oct 2026 · Arjun Mehta “Hold until the Hyderabad lab has finished this month’s runs on version 1.2.” The live version stays as it is. Lift hold What else a hold affects, and whether it blocks later corrections, is still open.',
    );
    await waitFor(() => expect(decided).toHaveFocus());
    expect(within(panel()).queryByRole('button', { name: /Release/ })).toBeNull();
    expect(text(main().querySelector('.xr-phead-meta'))).toContain(
      'Live now: version 1.2 · since 3 Jul 2026',
    );
    expect(text(screen.getByRole('region', { name: 'History' }).querySelector('li'))).toMatch(
      /^Put on hold by Arjun Mehta 23 Oct 2026, \d\d:\d\d “Hold until the Hyderabad lab has finished this month’s runs on version 1\.2\.” Version 1\.2 stays live\.$/,
    );
    // The live version stays; the Content Manager sees the reason; the service refuses a release.
    const page = await asPersonId(sample, RAHUL).catalogue.getExperiment(DISTILLATION as never);
    expect(page.ok && page.value.description).toMatch(/Lowering/);
    const mine = await asPersonId(sample, KAVYA).corrections.getUpdate('UPD-0005' as never);
    expect(mine.ok && mine.value.update.hold?.reason).toBe(
      'Hold until the Hyderabad lab has finished this month’s runs on version 1.2.',
    );
    const current = await decisionOf(runtime, 'UPD-0005');
    const refused = await asPersonId(sample, SUPER_ADMIN).corrections.releaseUpdate({
      id: 'UPD-0005' as never,
      expectedRev: current.update.rev,
    });
    expect(refused.ok ? null : refused.error).toEqual({
      kind: 'refused',
      code: 'hold-must-be-lifted',
    });
    expectNoPublish();

    // Lift hold (DL-1, no reason): back to waiting, nothing goes live; focus to the title.
    await user.click(within(panel()).getByRole('button', { name: 'Lift hold' }));
    const lift = await screen.findByRole('dialog', { name: 'Lift the hold on UPD-0005?' });
    expect(text(lift.querySelector('.xr-dialog-body'))).toBe(
      'It goes back to waiting for your decision. Nothing goes live until you release it.',
    );
    expect(within(lift).queryByRole('textbox')).toBeNull();
    await user.click(within(lift).getByRole('button', { name: 'Lift hold' }));
    await waitFor(() => expect(chip()).toBe('Waiting for your decision'));
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus());
    const notice = screen.getByText('Hold lifted').closest('.xr-notice')!;
    expect(text(notice)).toBe(
      'Hold lifted The hold was lifted on 23 Oct 2026. It is waiting for your decision again.',
    );
    expect(within(panel()).getByRole('button', { name: 'Release update' })).toBeVisible();
    expect(text(screen.getByRole('region', { name: 'History' }).querySelector('li'))).toMatch(
      /^Hold lifted by Arjun Mehta 23 Oct 2026, \d\d:\d\d Waiting for a decision again\. Nothing went live\.$/,
    );
    const still = await asPersonId(sample, RAHUL).catalogue.getExperiment(DISTILLATION as never);
    expect(still.ok && still.value.description).toMatch(/Lowering/);
  });

  it('a stale Hold keeps the typed reason and says the update changed', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showDecision(runtime, 'UPD-0005');
    await heading('Distillation Column · 1.2 → 1.3');
    const other = asPersonId(sample, SUPER_ADMIN).corrections;
    const read = await other.getUpdateDecision('UPD-0005' as never);
    if (!read.ok) throw new Error(read.error.kind);
    const held = await other.holdUpdate({
      id: 'UPD-0005' as never,
      reason: 'Elsewhere.',
      expectedRev: read.value.update.rev,
    });
    if (!held.ok) throw new Error(held.error.kind);
    await other.liftHold({ id: 'UPD-0005' as never, expectedRev: held.value.rev });

    await user.click(within(panel()).getByRole('radio', { name: /^Hold/ }));
    await user.click(within(panel()).getByRole('button', { name: 'Hold' }));
    const dialog = await screen.findByRole('dialog', { name: 'Hold UPD-0005?' });
    const reason = within(dialog).getByRole('textbox');
    await user.type(reason, 'Wait for the lab.');
    await user.click(within(dialog).getByRole('button', { name: 'Hold' }));
    expect(
      await within(dialog).findByText('This update changed since you opened it'),
    ).toBeVisible();
    expect(reason).toHaveValue('Wait for the lab.');
    // The next press sends the current revision.
    await user.click(within(dialog).getByRole('button', { name: 'Hold' }));
    await waitFor(() => expect(chip()).toBe('On hold'));
  });
});

describe('SA-11 — on hold, released, not approved yet, unknown (B7-05 f5, f6, f10; B7-10 f2 … f4)', () => {
  it('on hold (UPD-0004): the reason and date first; Lift hold the only action', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    showDecision(runtime, 'UPD-0004');
    await heading('Boiler Drum Level · 2.0 → 2.1');
    expect(chip()).toBe('On hold');
    expect(main().querySelector('.xr-phead-meta .xr-status')).toHaveClass('xr-status--paused');
    expect(text(panel().querySelector('#update-decided'))).toContain(
      'On hold since 20 Aug 2026 · Arjun Mehta “Version 2.0 stays live while the 2.1 build is checked.”',
    );
    expect(
      within(panel())
        .getAllByRole('button')
        .map((button) => text(button)),
    ).toEqual(['Lift hold']);
    expect(within(panel()).queryByRole('radio')).toBeNull();
    expect(screen.queryByText('Hold lifted')).toBeNull();
    expectNoPublish();
  });

  it('released (after-flow-f): decided, read-only; the live line says when it was released', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-f');
    showDecision(runtime, 'UPD-0005');
    await heading('Distillation Column · 1.2 → 1.3');
    expect(chip()).toBe('Released');
    expect(text(main().querySelector('.xr-phead-meta'))).toContain(
      'Live now: version 1.3 · released 24 Oct 2026',
    );
    expect(text(panel())).toBe(
      'Your decision Released Released on 24 Oct 2026 · Arjun Mehta Version 1.3 is live for everyone. The history below keeps the earlier version and every decision.',
    );
    expect(within(panel()).queryByRole('button')).toBeNull();
    expect(screen.queryByText('Hold lifted')).toBeNull();
    expect(
      [...screen.getByRole('region', { name: 'History' }).querySelectorAll('.xr-tl-what')].map(
        (line) => text(line),
      ),
    ).toEqual([
      'Released by Arjun Mehta',
      'Hold lifted by Arjun Mehta',
      'Put on hold by Arjun Mehta',
      'Approved by Prof. A. Menon',
      'Sent for academic review',
      'Correction started from the published experiment',
    ]);
    expectNoPublish();
  });

  it('not approved yet (UPD-0006, returned): “Nothing to decide”, never not found', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    showDecision(runtime, 'UPD-0006');
    await heading('Release or hold an update');
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', LIST);
    const empty = main().querySelector('.xr-section .xr-empty')!;
    expect(within(empty as HTMLElement).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Nothing to decide',
    );
    expect(text(empty.querySelector('p'))).toBe(
      'This update hasn’t been approved by the Academic Reviewer yet. It reaches you when it is.',
    );
    expect(
      within(empty as HTMLElement).getByRole('link', { name: 'Back to Updates' }),
    ).toHaveAttribute('href', LIST);
    expect(crumbs()).toMatch(/^Content \/ Updates \/ UPD-0006$/);
    expect(screen.queryByRole('complementary', { name: 'Your decision' })).toBeNull();
  });

  it('an unknown update is not found', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    showDecision(runtime, 'UPD-9999');
    expect(
      await screen.findByRole('heading', { level: 1, name: /not found|can’t find/i }),
    ).toBeVisible();
  });

  it('failed for now: the drawn failed state, and “Try again” reads it again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    faults(sample).failNext('CorrectionService.getUpdateDecision' as never);
    showDecision(runtime, 'UPD-0005');
    expect(await screen.findByText('We couldn’t load this update')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await heading('Distillation Column · 1.2 → 1.3');
  });
});

describe('SA-10 / SA-11 views and ledger', () => {
  it('decisionFacts and historyEvents name each fixture state', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-f');
    const released = decisionFacts(await decisionOf(runtime, 'UPD-0005'));
    expect([released.kind, released.title, released.baseVersion, released.liveVersion]).toEqual([
      'released',
      'Distillation Column · 1.2 → 1.3',
      '1.2',
      '1.3',
    ]);
    const held = decisionFacts(await decisionOf(runtime, 'UPD-0004'));
    expect([held.kind, held.title, held.hold?.by]).toEqual([
      'held',
      'Boiler Drum Level · 2.0 → 2.1',
      'Arjun Mehta',
    ]);
    const events = historyEvents((await decisionOf(runtime, 'UPD-0005')).update);
    expect(events.map((event) => event.note)).toContain(
      '“Wait for the lab to confirm the new build.” Version 1.2 stays live.',
    );
  });

  it('the ledger: every built target is a page, SA-11 has one primary, nothing is not rendered', () => {
    for (const entry of P6_RELEASE_LINK_TARGETS) {
      if (entry.outcome === 'built') {
        expect(['screen', 'record-screen']).toContain(
          resolveAddress(expandTarget(entry.target!, '/admin')).kind,
        );
      }
      expect(entry.outcome).not.toBe('not-rendered');
      expect(`${entry.action} ${entry.note ?? ''}`).not.toMatch(/\bPublish\b/);
    }
    expect(
      P6_RELEASE_LINK_TARGETS.filter((entry) => entry.role === 'primary').map(
        (entry) => `${entry.screen}: ${entry.action}`,
      ),
    ).toEqual(['SA-11: Release update · Hold']);
  });
});

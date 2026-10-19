/**
 * The Super Admin's release decision in the V3 Refined B design (the owner-approved Super Admin
 * export, design/v3-refined-b/roles/SA-v1 `V.updates`, `V.update`): SA-10 Content updates and
 * SA-11 Release or hold an update, on the real composition root and the sample world —
 * after-flow-e (UPD-0005 approved and waiting, 23 Oct 2026), after-flow-f (UPD-0005 released) and
 * spine-start (UPD-0004 on hold, UPD-0006 returned). The lists are the service's answers per
 * segment; the three commands carry the revision their confirmation opened on; a refusal writes
 * nothing and is said calmly; Release changes the experiment's live version and nothing else (BC9:
 * no plan, grant or person); “Publish” is never said on this path, and no reference is shown.
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
const HOLD_REASON = 'Hold until the Hyderabad lab has finished this month’s runs on version 1.2.';

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
/** The V3 rail's current destination. */
const currentNav = () => document.querySelector('aside.rb-rail .rb-nav a[aria-current="page"]');
const panel = () => screen.getByRole('complementary', { name: 'Your decision' });
/** The status pill in the page head. */
const chip = () => text(main().querySelector('.rk-head .rk-meta .xr-st'));
const heading = (name: string) =>
  screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });
const segments = () => screen.getByRole('group', { name: 'Show corrections' });

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

/** “Publish” is never said on this path (B7-05 “Never”; HANDOFF SA-10/11 “Publish”). */
function expectNoPublish() {
  expect(document.body.textContent ?? '').not.toMatch(/publish(?!ed)/i);
  expect(document.body.textContent ?? '').not.toMatch(/\bPublish\b/);
}

/** No reference in the page's words or names (HANDOFF “Internal references”). */
function expectNoReferences() {
  const reference = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;
  expect(main().textContent ?? '').not.toMatch(reference);
  for (const element of main().querySelectorAll('[aria-label], [title]')) {
    expect(element.getAttribute('aria-label') ?? '').not.toMatch(reference);
    expect(element.getAttribute('title') ?? '').not.toMatch(reference);
  }
  expect(document.title).not.toMatch(reference);
}

async function decisionOf(runtime: PlatformRuntime, id: string) {
  const answer = await runtime.ports.corrections.getUpdateDecision(id as never);
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

// ---- SA-10 Content updates ----------------------------------------------------------------------

describe('SA-10 — Content updates (SA-v1 `V.updates`)', () => {
  it('Waiting for your decision: the head, the page tabs, the segments with their figures and the Distillation Column row', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const version = sample.worldVersion();
    inAdmin(runtime, LIST, <ContentUpdates />);
    await screen.findByRole('group', { name: 'Show corrections' });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const title = screen.getByRole('heading', { level: 1, name: 'Content' });
    expect(title).toHaveClass('rb-h1');
    expect(title).toHaveAttribute('tabindex', '-1');
    expect(text(main().querySelector('.rk-head .rk-sub'))).toBe(
      'Corrections to published experiments reach you after the Academic Reviewer approves them. Nothing goes live until you release it.',
    );
    expect(text(main().querySelector('.rb-eyebrow-date'))).toBe('Friday 23 October 2026');
    expect(currentNav()).toHaveTextContent('Content');
    const tabs = screen.getByRole('navigation', { name: 'Content' });
    expect(tabs).toHaveClass('rk-tabs', 'sa-tabs');
    expect(
      within(tabs)
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
    const surface = screen.getByRole('region', { name: 'Corrections to published content' });
    expect(surface).toHaveClass('rk-surface');
    expect(
      within(segments())
        .getAllByRole('button')
        .map((button) => [text(button), button.getAttribute('aria-pressed')]),
    ).toEqual([
      ['Waiting for your decision 1', 'true'],
      ['On hold 1', 'false'],
      ['Released 3', 'false'],
    ]);
    const table = within(surface).getByRole('table', {
      name: 'Corrections, Waiting for your decision',
    });
    expect(table).toHaveClass('rk-table');
    expect([...table.querySelectorAll('thead th')].map((th) => text(th))).toEqual([
      'Experiment',
      'What changes',
      'Approved by',
      'Approved',
      'Status',
    ]);
    const rows = table.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(1);
    expect(cells(rows[0]!)).toEqual([
      'Distillation Column CHE ZG513',
      'Version 1.2 → 1.3 Version 1.2 stays live until released',
      'Academic Reviewer Prof. A. Menon',
      'Approved 22 Oct 2026',
      'Waiting for your decision',
    ]);
    expect(rows[0]!.querySelector('.rk-code')).toHaveTextContent('CHE ZG513');
    expect(rows[0]!.querySelector('.xr-st')).toHaveClass('xr-st--warn');
    const open = within(rows[0] as HTMLElement).getByRole('link', {
      name: 'Distillation Column correction, version 1.2 to 1.3, Waiting for your decision. Open',
    });
    expect(open).toHaveAttribute('href', `${LIST}/UPD-0005`);
    expect(open).toHaveClass('rk-rowlink');
    expect(text(surface.querySelector('.rk-ca-foot'))).toBe(
      'The only route for changing published content: Content Manager, then Academic Reviewer, then your release decision.',
    );
    expectNoPublish();
    expectNoReferences();
    // Opening the list writes nothing.
    expect(sample.worldVersion()).toBe(version);
  });

  it('On hold and Released: the segment changes the address; each row opens its decision', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const { navigation } = inAdmin(runtime, LIST, <ContentUpdates />);
    await screen.findByRole('group', { name: 'Show corrections' });
    const held = within(segments()).getByRole('button', { name: 'On hold 1' });
    await user.click(held);
    expect(held).toHaveAttribute('aria-pressed', 'true');
    expect(held).toHaveFocus();
    expect(navigation.replace).toHaveBeenLastCalledWith(`${LIST}?show=on-hold`);
    let table = screen.getByRole('table', { name: 'Corrections, On hold' });
    let rows = table.querySelectorAll('tbody tr');
    expect([...rows].map((row) => cells(row))).toEqual([
      [
        'Boiler Drum Level CHE ZG513',
        'Version 2.0 → 2.1 Version 2.0 stays live until released',
        'Academic Reviewer Prof. A. Menon',
        'Approved 14 Aug 2026',
        'On hold',
      ],
    ]);
    expect(rows[0]!.querySelector('.xr-st')).toHaveClass('xr-st--paused');
    expect(
      within(rows[0] as HTMLElement).getByRole('link', {
        name: 'Boiler Drum Level correction, version 2.0 to 2.1, On hold. Open',
      }),
    ).toHaveAttribute('href', `${LIST}/UPD-0004`);

    await user.click(within(segments()).getByRole('button', { name: 'Released 3' }));
    expect(navigation.replace).toHaveBeenLastCalledWith(`${LIST}?show=released`);
    table = screen.getByRole('table', { name: 'Corrections, Released' });
    rows = table.querySelectorAll('tbody tr');
    expect([...rows].map((row) => cells(row).slice(0, 2))).toEqual([
      ['Orifice Plate Metering CHE ZG513', 'Version 1.0 → 1.1 Released 5 Aug 2026'],
      ['Distillation Column CHE ZG513', 'Version 1.1 → 1.2 Released 3 Jul 2026'],
      ['Distillation Column CHE ZG513', 'Version 1.0 → 1.1 Released 19 Jun 2026'],
    ]);
    expect(rows[0]!.querySelector('.xr-st')).toHaveClass('xr-st--ok');
    expectNoPublish();
    expectNoReferences();
  });

  it('the address names the segment; an unknown one is replaced by the list’s address', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-f');
    inAdmin(runtime, LIST, <ContentUpdates />, '?show=released');
    await screen.findByRole('group', { name: 'Show corrections' });
    expect(within(segments()).getByRole('button', { name: /^Released/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      text(screen.getByRole('table', { name: 'Corrections, Released' }).querySelector('tbody tr')),
    ).toContain('Distillation Column CHE ZG513 Version 1.2 → 1.3 Released 24 Oct 2026');
    const other = await tabPlatform(SUPER_ADMIN, 'after-flow-f');
    const { navigation } = inAdmin(other.runtime, LIST, <ContentUpdates />, '?show=everything');
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith(LIST));
  });

  it('nothing waiting: the calm empty state, the other segments still counted', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    inAdmin(runtime, LIST, <ContentUpdates />);
    await screen.findByRole('group', { name: 'Show corrections' });
    expect(
      within(segments())
        .getAllByRole('button')
        .map((button) => text(button)),
    ).toEqual(['Waiting for your decision 0', 'On hold 1', 'Released 3']);
    expect(screen.queryByRole('table')).toBeNull();
    const empty = main().querySelector('.rk-state')!;
    expect(text(empty.querySelector('.rk-state-t'))).toBe(
      'Nothing is waiting for your release decision',
    );
    expect(text(empty.querySelector('.rk-state-d'))).toBe(
      'Corrections reach you after the Academic Reviewer approves them.',
    );
  });

  it('loading is announced; failed says so and “Try again” reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    faults(sample).failNext('CorrectionService.listUpdatesForRelease' as never);
    inAdmin(runtime, LIST, <ContentUpdates />);
    expect(await screen.findByText('Loading corrections…')).toHaveAttribute('role', 'status');
    const failed = await screen.findByRole('alert');
    expect(text(failed)).toBe(
      'We couldn’t load the corrections Nothing has changed. Try again. Try again',
    );
    await user.click(within(failed).getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('group', { name: 'Show corrections' })).toBeVisible();
  });
});

// ---- SA-11 Release or hold an update ------------------------------------------------------------

describe('SA-11 — waiting for your decision (SA-v1 `V.update`)', () => {
  it('the head, the facts, what changes, why, the review, the institutions, the history and the open panel', async () => {
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const version = sample.worldVersion();
    showDecision(runtime, 'UPD-0005');
    await heading('Distillation Column');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(
      within(crumbs)
        .getAllByRole('link')
        .map((link) => [link.textContent, link.getAttribute('href')]),
    ).toEqual([
      ['Content', LIST],
      ['Updates', LIST],
    ]);
    expect(text(crumbs.querySelector('[aria-current="page"]'))).toBe('Distillation Column');
    expect(text(main().querySelector('.rk-head .rk-eyebrow'))).toBe(
      'Correction to a published experiment',
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('rk-title');
    expect(chip()).toBe('Waiting for your decision');
    expect(main().querySelector('.rk-head .rk-meta .xr-st')).toHaveClass('xr-st--warn', 'rk-st-lg');
    expect(text(main().querySelector('.rk-head .rk-meta'))).toBe(
      'Waiting for your decision Version 1.2 → 1.3 Approved by Prof. A. Menon on 22 Oct 2026',
    );
    expect(currentNav()).toHaveTextContent('Content');
    await waitFor(() => expect(document.title).toContain('Distillation Column correction'));
    // “Go to decision” leads to the panel (shown below 860 px of page width); no lift notice yet.
    expect(main().querySelector('a.rk-goto')).toHaveAttribute('href', '#update-decision');
    expect(screen.queryByText('Hold lifted')).toBeNull();

    expect(
      [...main().querySelectorAll('dl.rk-factstrip .rk-fact')].map((fact) => text(fact)),
    ).toEqual([
      'Live now Version 1.2',
      'Proposed Version 1.3',
      'Course CHE ZG513',
      'Formats WEB, VR',
    ]);

    const changes = screen.getByRole('region', { name: 'What changes' });
    expect(text(changes.querySelector('.rk-sec-h p'))).toBe('Changed fields only');
    const comparison = within(changes).getByRole('table', {
      name: 'Changed fields, live and proposed',
    });
    expect(comparison).toHaveClass('sa-table', 'sa-table--rows', 'sa-compare');
    expect(
      within(comparison)
        .getAllByRole('columnheader')
        .map((cell) => text(cell)),
    ).toEqual(['Field', 'Live now · 1.2', 'Proposed · 1.3']);
    expect(
      within(comparison)
        .getAllByRole('rowheader')
        .map((cell) => text(cell)),
    ).toEqual(['Description', 'WEB · web link', 'Version']);
    expect(text(comparison)).toContain('Lowering the reflux ratio raises the overhead purity');
    expect(text(comparison)).toContain('Raising the reflux ratio raises the overhead purity');
    expect(comparison.querySelectorAll('td.sa-compare-new')).toHaveLength(3);
    // A long web link may break at its separators (no sideways scroll inside the sheet).
    expect(comparison.querySelectorAll('wbr').length).toBeGreaterThan(0);
    expect(comparison.textContent).toContain(
      'https://labs.meridian.example/distillation-column-1-3',
    );

    const why = screen.getByRole('region', { name: 'Why, from the Content Manager' });
    expect(text(why.querySelector('blockquote.rk-quote > p'))).toMatch(
      /^Corrects the reflux statement in the description/,
    );
    expect(text(why.querySelector('.rk-quote-by'))).toBe('Kavya Nair, Content Manager');
    const review = screen.getByRole('region', { name: 'Academic review' });
    expect(text(review.querySelector('p.rk-next'))).toBe(
      'Approved by Prof. A. Menon on 22 Oct 2026, 11:20. The full review history is below.',
    );

    const institutions = screen.getByRole('region', { name: 'Institutions using it' });
    const table = within(institutions).getByRole('table', {
      name: 'Institutions using this experiment',
    });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => text(cell)),
    ).toEqual(['Institution', 'Access', 'Status']);
    expect(
      [...table.querySelectorAll('tbody tr')].map((row) => [
        text(row.querySelector('th')),
        ...cells(row),
      ]),
    ).toEqual([['BITS Pilani — Hyderabad Campus', 'In its access plan · WEB, VR', 'Ending soon']]);
    expect(text(institutions.querySelector('p.rk-hint'))).toBe(
      'Release changes the experiment for everyone at once. Nothing here changes any institution’s access.',
    );

    const history = screen.getByRole('region', { name: 'History' });
    expect(text(history.querySelector('.rk-sec-h p'))).toBe(
      'Newest first · kept after every decision',
    );
    expect([...history.querySelectorAll('ol.rk-tl > li')].map((item) => text(item))).toEqual([
      'Approved by Prof. A. Menon 22 Oct 2026, 11:20 With the Super Admin for a release decision. The live version stays 1.2 until then.',
      'Sent for academic review 20 Oct 2026, 16:00 To Prof. A. Menon. The live version 1.2 is unchanged.',
      'Correction started from the published experiment 20 Oct 2026, 15:40 Pre-filled with the live version 1.2.',
    ]);
    expect(history.querySelector('ol.rk-tl > li')).toHaveClass('is-latest');

    // The open panel: no decision is chosen for her; the one primary button.
    expect(panel()).toHaveClass('rk-aside');
    expect(panel().querySelector('.rk-panel-head h2')).toHaveTextContent('Your decision');
    expect(within(panel()).getByRole('radio', { name: 'Release update' })).not.toBeChecked();
    expect(within(panel()).getByRole('radio', { name: 'Hold' })).not.toBeChecked();
    expect(text(panel().querySelector('.rk-choices'))).toBe(
      'Release update Version 1.3 goes live for everyone. Hold Version 1.2 stays live. You can lift the hold later.',
    );
    expect(within(panel()).getByRole('button', { name: 'Release update' })).toHaveClass(
      'rb-btn',
      'rb-btn--primary',
      'rk-go',
    );
    expect(text(panel().querySelector('.rk-panel-body > p.rk-hint'))).toBe(
      'Releasing never grants or changes an institution’s access.',
    );
    expectNoPublish();
    expectNoReferences();
    expect(sample.worldVersion()).toBe(version);
  });
});

describe('SA-11 — Release (`SA.DLG.releaseUpd`)', () => {
  it('a decision is required; the confirmation says what goes live and for whom; Cancel changes nothing; Release changes the live version and nothing else', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const rahulBefore = await asPersonId(sample, RAHUL).catalogue.getExperiment(
      DISTILLATION as never,
    );
    showDecision(runtime, 'UPD-0005');
    await heading('Distillation Column');
    const before = snapshot(sample);

    // No choice yet: the error summary, focused, with its link to the choices; nothing opens.
    const go = within(panel()).getByRole('button', { name: 'Release update' });
    await user.click(go);
    const summary = within(panel()).getByRole('alert');
    expect(summary).toHaveClass('rk-errsum');
    expect(text(summary)).toBe('Check your decision Choose a decision');
    await waitFor(() => expect(summary).toHaveFocus());
    expect(panel().querySelector('fieldset.rk-fieldset')).toHaveClass('is-invalid');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(snapshot(sample)).toEqual(before);

    await user.click(within(panel()).getByRole('radio', { name: 'Release update' }));
    expect(within(panel()).queryByRole('alert')).toBeNull();
    await user.click(go);
    let dialog = await screen.findByRole('dialog', {
      name: 'Release version 1.3 of Distillation Column?',
    });
    expect(dialog).toHaveClass('rk-dialog');
    expect(dialog).toHaveAccessibleDescription(
      'Releasing replaces the live version for everyone at once.',
    );
    expect(text(dialog.querySelector('.rk-dlg-now'))).toBe(
      'What happens now Version 1.3 goes live for everyone: the public catalogue and every institution using it. Version 1.2 is kept in the history as Live before.',
    );
    expect(text(dialog.querySelector('.rk-dlg-later'))).toBe(
      'Only after later events, or not from here No institution’s or student’s access changes.',
    );
    expect(within(dialog).getByRole('button', { name: 'Release update' })).toHaveFocus();
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(go).toHaveFocus();
    expect(snapshot(sample)).toEqual(before);

    await user.click(go);
    dialog = await screen.findByRole('dialog', {
      name: 'Release version 1.3 of Distillation Column?',
    });
    await user.click(within(dialog).getByRole('button', { name: 'Release update' }));
    await waitFor(() => expect(chip()).toBe('Released'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(main().querySelector('.rk-head .rk-meta .xr-st')).toHaveClass('xr-st--ok');
    // The flash says what happened and takes focus.
    const flash = await screen.findByText('Version 1.3 is live.');
    const notice = flash.closest('.rk-notice')!;
    expect(notice).toHaveClass('rk-notice--ok');
    expect(text(notice)).toBe(
      'Version 1.3 is live. Everyone now sees the corrected experiment. No access changed.',
    );
    await waitFor(() => expect(notice).toHaveFocus());
    const decided = panel().querySelector('#update-decided')!;
    expect(text(decided)).toBe(
      'Released Released on 23 Oct 2026 by Arjun Mehta Live now Version 1.3 Live before Version 1.2 Institutional access Unchanged This decision is recorded and read-only. Back to Updates',
    );
    expect(within(panel()).queryByRole('button')).toBeNull();
    expect(within(panel()).getByRole('link', { name: 'Back to Updates' })).toHaveAttribute(
      'href',
      LIST,
    );
    expect(text(screen.getByRole('region', { name: 'History' }).querySelector('li'))).toMatch(
      /^Released by Arjun Mehta 23 Oct 2026, \d\d:\d\d Version 1\.3 is live for everyone\.$/,
    );
    // The comparison is kept for the record against the version the release replaced.
    const compared = within(screen.getByRole('region', { name: 'What changes' }));
    expect(compared.getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual([
      'Field',
      'Live before',
      'Released · 1.3',
    ]);
    expect(compared.getByText('“Live before” is the version that was live until the release.'));
    expect(
      [...main().querySelectorAll('dl.rk-factstrip .rk-fact')].map((fact) => text(fact)),
    ).toEqual([
      'Live now Version 1.3',
      'Released Version 1.3',
      'Course CHE ZG513',
      'Formats WEB, VR',
    ]);
    expectNoPublish();
    expectNoReferences();

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

  it('a stale revision: nothing is released, the panel says so in the repo’s words and the update is read again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showDecision(runtime, 'UPD-0005');
    await heading('Distillation Column');
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

    await user.click(within(panel()).getByRole('radio', { name: 'Release update' }));
    await user.click(within(panel()).getByRole('button', { name: 'Release update' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Release version 1.3 of Distillation Column?',
    });
    await user.click(within(dialog).getByRole('button', { name: 'Release update' }));
    const refusal = await within(panel()).findByRole('alert');
    expect(text(refusal)).toBe(
      'This update changed since you opened it It has been read again. Check it, then decide again. Check it again',
    );
    expect(refusal).toHaveClass('rk-notice--warn');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(refusal).toHaveFocus());
    // Read again: still waiting, the lift is noted; nothing went live.
    expect(chip()).toBe('Waiting for your decision');
    expect(await screen.findByText('Hold lifted')).toBeVisible();
    expect((await decisionOf(runtime, 'UPD-0005')).update.state).toBe('awaiting-release-decision');
    // “Check it again” puts the refusal away and focus on the title.
    await user.click(within(refusal).getByRole('button', { name: 'Check it again' }));
    expect(within(panel()).queryByRole('alert')).toBeNull();
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 })).toHaveFocus());
  });

  it('decided meanwhile elsewhere: the panel says it moved on and shows its current state', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showDecision(runtime, 'UPD-0005');
    await heading('Distillation Column');
    const other = asPersonId(sample, SUPER_ADMIN).corrections;
    const read = await other.getUpdateDecision('UPD-0005' as never);
    if (!read.ok) throw new Error(read.error.kind);
    await other.releaseUpdate({ id: 'UPD-0005' as never, expectedRev: read.value.update.rev });

    await user.click(within(panel()).getByRole('radio', { name: 'Release update' }));
    await user.click(within(panel()).getByRole('button', { name: 'Release update' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Release version 1.3 of Distillation Column?',
    });
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
    await heading('Distillation Column');
    faults(sample).failNext('CorrectionService.releaseUpdate' as never);
    await user.click(within(panel()).getByRole('radio', { name: 'Release update' }));
    await user.click(within(panel()).getByRole('button', { name: 'Release update' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Release version 1.3 of Distillation Column?',
    });
    await user.click(within(dialog).getByRole('button', { name: 'Release update' }));
    expect(
      await within(dialog).findByText('It wasn’t released. Nothing was lost — try again.'),
    ).toBeVisible();
    expect(chip()).toBe('Waiting for your decision');
  });
});

describe('SA-11 — Hold and Lift hold (`SA.DLG.holdUpd`, `SA.DLG.liftUpd`)', () => {
  it('the reason is required; Hold keeps 1.2 live; Release isn’t available while held; Lift hold returns it to waiting', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showDecision(runtime, 'UPD-0005');
    await heading('Distillation Column');

    await user.click(within(panel()).getByRole('radio', { name: 'Hold' }));
    const reason = within(panel()).getByRole('textbox', { name: 'Reason for the hold (required)' });
    expect(reason).toHaveAccessibleDescription('The Content Manager sees this reason.');
    expect(text(panel().querySelector('p.rk-pending'))).toBe('Add the reason before holding.');
    const go = within(panel()).getByRole('button', { name: 'Hold update' });
    // No reason: the error under the field and in the summary, focused; nothing sent.
    const before = snapshot(sample);
    await user.click(go);
    const summary = within(panel()).getByRole('alert');
    expect(text(summary)).toBe('Check your decision Add a reason — the Content Manager sees it');
    await waitFor(() => expect(summary).toHaveFocus());
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(snapshot(sample)).toEqual(before);
    // The summary's link moves focus to the field.
    await user.click(within(summary).getByRole('link'));
    expect(reason).toHaveFocus();

    await user.type(reason, HOLD_REASON);
    expect(panel().querySelector('p.rk-pending')).toBeNull();
    await user.click(go);
    const dialog = await screen.findByRole('dialog', {
      name: 'Hold the Distillation Column correction?',
    });
    expect(dialog).toHaveAccessibleDescription(
      'Version 1.2 stays live. The Content Manager sees your reason.',
    );
    expect(text(dialog.querySelector('blockquote.rk-quote'))).toBe(`${HOLD_REASON} Your reason`);
    await user.click(within(dialog).getByRole('button', { name: 'Hold update' }));
    await waitFor(() => expect(chip()).toBe('On hold'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const flash = (await screen.findByText('The correction is on hold.')).closest('.rk-notice')!;
    expect(text(flash)).toBe('The correction is on hold. Version 1.2 stays live.');
    await waitFor(() => expect(flash).toHaveFocus());
    const decided = panel().querySelector('#update-decided')!;
    expect(text(decided)).toBe(
      `On hold Put on hold on 23 Oct 2026 by Arjun Mehta ${HOLD_REASON} Release isn’t available while the update is on hold Lift the hold first. It goes back to waiting for your decision; nothing goes live by itself. Lift hold What else a hold affects, and whether it blocks later corrections, is still open.`,
    );
    expect(
      within(panel())
        .getAllByRole('button')
        .map((button) => text(button)),
    ).toEqual(['Lift hold']);
    expect(text(screen.getByRole('region', { name: 'History' }).querySelector('li'))).toMatch(
      /^Put on hold by Arjun Mehta 23 Oct 2026, \d\d:\d\d “Hold until the Hyderabad lab has finished this month’s runs on version 1\.2\.” Version 1\.2 stays live\.$/,
    );
    // The live version stays; the Content Manager sees the reason; the service refuses a release.
    const page = await asPersonId(sample, RAHUL).catalogue.getExperiment(DISTILLATION as never);
    expect(page.ok && page.value.description).toMatch(/Lowering/);
    const mine = await asPersonId(sample, KAVYA).corrections.getUpdate('UPD-0005' as never);
    expect(mine.ok && mine.value.update.hold?.reason).toBe(HOLD_REASON);
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
    expectNoReferences();

    // Lift hold (confirmed, no reason): back to waiting, nothing goes live; the flash says so.
    await user.click(within(panel()).getByRole('button', { name: 'Lift hold' }));
    const lift = await screen.findByRole('dialog', {
      name: 'Lift the hold on the Distillation Column correction?',
    });
    expect(lift).toHaveAccessibleDescription(
      'It goes back to waiting for your decision. Nothing goes live.',
    );
    expect(within(lift).queryByRole('textbox')).toBeNull();
    await user.click(within(lift).getByRole('button', { name: 'Lift hold' }));
    await waitFor(() => expect(chip()).toBe('Waiting for your decision'));
    const lifted = (await screen.findByText('Hold lifted.')).closest('.rk-notice')!;
    expect(text(lifted)).toBe(
      'Hold lifted. The correction is waiting for your decision again. Nothing went live.',
    );
    await waitFor(() => expect(lifted).toHaveFocus());
    expect(within(panel()).getByRole('radio', { name: 'Release update' })).toBeVisible();
    expect(text(screen.getByRole('region', { name: 'History' }).querySelector('li'))).toMatch(
      /^Hold lifted by Arjun Mehta 23 Oct 2026, \d\d:\d\d Waiting for a decision again\. Nothing went live\.$/,
    );
    const still = await asPersonId(sample, RAHUL).catalogue.getExperiment(DISTILLATION as never);
    expect(still.ok && still.value.description).toMatch(/Lowering/);
  });

  it('a stale Hold keeps the typed reason, says the update changed, and the next confirmation goes through', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showDecision(runtime, 'UPD-0005');
    await heading('Distillation Column');
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

    await user.click(within(panel()).getByRole('radio', { name: 'Hold' }));
    const reason = within(panel()).getByRole('textbox', { name: 'Reason for the hold (required)' });
    await user.type(reason, 'Wait for the lab.');
    await user.click(within(panel()).getByRole('button', { name: 'Hold update' }));
    let dialog = await screen.findByRole('dialog', {
      name: 'Hold the Distillation Column correction?',
    });
    await user.click(within(dialog).getByRole('button', { name: 'Hold update' }));
    expect(
      await within(panel()).findByText('This update changed since you opened it'),
    ).toBeVisible();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(reason).toHaveValue('Wait for the lab.');
    // The next confirmation sends the current revision.
    await user.click(within(panel()).getByRole('button', { name: 'Hold update' }));
    dialog = await screen.findByRole('dialog', {
      name: 'Hold the Distillation Column correction?',
    });
    await user.click(within(dialog).getByRole('button', { name: 'Hold update' }));
    await waitFor(() => expect(chip()).toBe('On hold'));
  });
});

describe('SA-11 — on hold, released, not approved yet, unknown (SA-v1 states)', () => {
  it('on hold (UPD-0004): who held it and why first; Lift hold the only action', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    showDecision(runtime, 'UPD-0004');
    await heading('Boiler Drum Level');
    expect(chip()).toBe('On hold');
    expect(main().querySelector('.rk-head .rk-meta .xr-st')).toHaveClass('xr-st--paused');
    const decided = panel().querySelector('#update-decided')!;
    expect(text(decided)).toContain(
      'On hold Put on hold on 20 Aug 2026 by Arjun Mehta Version 2.0 stays live while the 2.1 build is checked.',
    );
    expect(decided.querySelector('.rk-notice--paused')).not.toBeNull();
    expect(
      within(panel())
        .getAllByRole('button')
        .map((button) => text(button)),
    ).toEqual(['Lift hold']);
    expect(within(panel()).queryByRole('radio')).toBeNull();
    expect(screen.queryByText('Hold lifted')).toBeNull();
    expectNoPublish();
  });

  it('released (after-flow-f): decided, read-only; Live now and Live before', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-f');
    showDecision(runtime, 'UPD-0005');
    await heading('Distillation Column');
    expect(chip()).toBe('Released');
    expect(text(main().querySelector('.rk-head .rk-meta'))).toContain('Version 1.2 → 1.3');
    expect(text(panel())).toBe(
      'Your decision Released Released on 24 Oct 2026 by Arjun Mehta Live now Version 1.3 Live before Version 1.2 Institutional access Unchanged This decision is recorded and read-only. Back to Updates',
    );
    expect(within(panel()).queryByRole('button')).toBeNull();
    expect(screen.queryByText('Hold lifted')).toBeNull();
    expect(
      [...screen.getByRole('region', { name: 'History' }).querySelectorAll('.rk-tl-w')].map(
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
    expectNoReferences();
  });

  it('not approved yet (UPD-0006, returned): “Nothing to decide”, never “not available”', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    showDecision(runtime, 'UPD-0006');
    await heading('Nothing to decide');
    const message = main().querySelector('.sa-msg')!;
    expect(text(message.querySelector('.rk-sub'))).toBe(
      'This correction hasn’t been approved by the Academic Reviewer yet. It reaches you when it is. The live version is unchanged.',
    );
    const back = within(message as HTMLElement).getByRole('link', { name: 'Back to Updates' });
    expect(back).toHaveAttribute('href', LIST);
    expect(back).toHaveClass('rb-btn--primary');
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(text(crumbs)).toBe('Content Updates Nothing to decide');
    expect(screen.queryByRole('complementary', { name: 'Your decision' })).toBeNull();
    expectNoReferences();
  });

  it('an unknown update is the GL-04 “This page isn’t available”', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
    showDecision(runtime, 'UPD-9999');
    expect(await heading('This page isn’t available')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Back to Overview' })).toHaveAttribute(
      'href',
      '/admin',
    );
  });

  it('failed for now: the failed state, and “Try again” reads it again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    faults(sample).failNext('CorrectionService.getUpdateDecision' as never);
    showDecision(runtime, 'UPD-0005');
    expect(await screen.findByText('We couldn’t load this update')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await heading('Distillation Column');
  });
});

describe('SA-10 / SA-11 views and ledger', () => {
  it('decisionFacts and historyEvents name each fixture state', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-f');
    const released = decisionFacts(await decisionOf(runtime, 'UPD-0005'));
    expect([
      released.kind,
      released.experiment,
      released.from,
      released.to,
      released.baseVersion,
      released.liveVersion,
    ]).toEqual(['released', 'Distillation Column', '1.2', '1.3', '1.2', '1.3']);
    const held = decisionFacts(await decisionOf(runtime, 'UPD-0004'));
    expect([held.kind, held.experiment, held.hold?.by]).toEqual([
      'held',
      'Boiler Drum Level',
      'Arjun Mehta',
    ]);
    const events = historyEvents((await decisionOf(runtime, 'UPD-0005')).update);
    expect(events.map((event) => event.note)).toContain(
      '“Wait for the lab to confirm the new build.” Version 1.2 stays live.',
    );
  });

  it('the ledger: every built target is a page, SA-11 has one primary, nothing is not rendered, no reference names an action', () => {
    for (const entry of P6_RELEASE_LINK_TARGETS) {
      if (entry.outcome === 'built') {
        expect(['screen', 'record-screen']).toContain(
          resolveAddress(expandTarget(entry.target!, '/admin')).kind,
        );
      }
      expect(entry.outcome).not.toBe('not-rendered');
      expect(`${entry.action} ${entry.note ?? ''}`).not.toMatch(/\bPublish\b/);
      expect(entry.action).not.toMatch(/\b(?:UPD|SUB)-\d+/);
    }
    expect(
      P6_RELEASE_LINK_TARGETS.filter((entry) => entry.role === 'primary').map(
        (entry) => `${entry.screen}: ${entry.action}`,
      ),
    ).toEqual(['SA-11: Release update · Hold update']);
  });
});

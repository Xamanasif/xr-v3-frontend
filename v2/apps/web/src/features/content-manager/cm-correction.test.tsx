/**
 * The correction group on the real composition root and the sample world, as Kavya Nair: CM-05's
 * correction entry (it opens or joins the one draft, never a second update, and lands on its page
 * with the named field focused and the arrival explained), CM-08 Updates (the correction tracker,
 * grouped by who must act; empty, loading, couldn't load) and the correction page in V3 (the
 * owner-approved export CM-v1) in every state — the draft pre-filled with the live version and
 * compared with it as typed; the check (all three errors at once); Save draft, its failure and
 * Last saved; Send for academic review through its dialog (it saves, then sends; Cancel and Esc
 * wait while it runs); Withdraw through its dialog (a reason is required); typed work kept in the
 * tab; a stale or approved-meanwhile refusal said calmly and read again; the read-only states with
 * the hold reason and the released comparison. Nothing here changes the live version. No page
 * names an update by its reference — words, accessible names, hidden dialogs, the browser tab — the
 * owner's correction of 20 Oct 2026 (state-copy `CM-08.no-reference`); the reference stays in the
 * address, where these tests read it.
 */
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ServiceError } from '@xr/contracts/draft';
import type { IsoInstant } from '@xr/domain';
import { asPersonId, faults, fixtureWorld, standinsOf } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import {
  renderInTab,
  TestNotFoundBoundary,
  tabPlatform,
  testNavigation,
  worldPlatform,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { PublishedExperiment } from './cm-05-published/published-experiment';
import { Correction } from './cm-08-updates/correction';
import {
  forgetCorrectionDrafts,
  noteBackFromCorrection,
  noteCorrectionArrival,
} from './cm-08-updates/correction-draft';
import { updateHistory } from './cm-08-updates/correction-view';
import { Updates } from './cm-08-updates/updates';

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

function showUpdates(runtime: PlatformRuntime) {
  const navigation = testNavigation('/content-manager/updates');
  return renderInTab(inShell(<Updates />), { runtime, navigation });
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
/** The band's status pill. */
const chip = () => text(main().querySelector('.rb-id-status .xr-st'));
const band = () => main().querySelector('section.rb-id.cm-idband') as HTMLElement;
const panel = () => screen.getByRole('complementary', { name: 'Your update' });
const stateNotice = () => document.getElementById('cm-u-state');
const field = (label: string | RegExp) =>
  within(main()).getByLabelText(label, { selector: 'input, textarea' }) as
    HTMLInputElement | HTMLTextAreaElement;
const historyWhat = () => [...main().querySelectorAll('.rk-tl-w')].map((node) => text(node));
/** The band's facts, “term: value”. */
const facts = () =>
  [...band().querySelectorAll('dl.cm-idfacts > div')].map(
    (fact) => `${text(fact.querySelector('dt'))}: ${text(fact.querySelector('dd'))}`,
  );
/** The comparison's rows: the field names. */
const comparisonFields = () =>
  [...main().querySelectorAll('table.cm-cmp tbody td.cm-cmp-f')].map((cell) => text(cell));

/** Any internal reference (state-copy `CM-08.no-reference`; the SA-v1 rule). */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;
/**
 * The only references these pages show: the sample world's seeded “what changes and why” — words a
 * person wrote, quoted as written (the Reason field while editable, “What changes and why” once
 * sent) — named one by one, never a pattern.
 */
type SeededWhy =
  | 'Correction UPD-0001.'
  | 'Correction UPD-0002.'
  | 'Correction UPD-0003.'
  | 'Correction UPD-0004.'
  | 'Correction UPD-0006.';

/**
 * No reference in the document's words (hidden dialogs and screen-reader-only words included), in
 * a field's value, in any `aria-label`, `title` or `placeholder`, or in the browser tab — except the
 * one seeded quote named, which must show where a person's words show.
 */
function expectNoReferences(seeded?: SeededWhy) {
  const drop = (words: string) => (seeded ? words.split(seeded).join('') : words);
  if (seeded) {
    const why = document.getElementById('cm-u-why');
    const quoted = [
      why instanceof HTMLTextAreaElement ? why.value : '',
      ...[...main().querySelectorAll('blockquote.rk-quote')].map((quote) => text(quote)),
    ];
    expect(quoted).toContain(seeded);
  }
  expect(drop(document.body.textContent ?? '')).not.toMatch(REFERENCE);
  for (const control of document.querySelectorAll('input, textarea')) {
    expect(drop((control as HTMLInputElement | HTMLTextAreaElement).value)).not.toMatch(REFERENCE);
  }
  for (const element of document.querySelectorAll('[aria-label], [title], [placeholder]')) {
    for (const name of ['aria-label', 'title', 'placeholder']) {
      expect(element.getAttribute(name) ?? '').not.toMatch(REFERENCE);
    }
  }
  expect(document.title).not.toMatch(REFERENCE);
}

/** One port's command answered with a refusal (the screen's handling of it, not the service). */
function answerWith(
  runtime: PlatformRuntime,
  method: 'saveCorrection' | 'sendForAcademicReview' | 'openCorrection' | 'withdrawUpdate',
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

/** One port's command held until released (the dialogs' busy states). */
function holdCommand(
  runtime: PlatformRuntime,
  method: 'sendForAcademicReview' | 'withdrawUpdate',
): () => void {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const real = runtime.withCommandId.bind(runtime);
  vi.spyOn(runtime, 'withCommandId').mockImplementation((commandId) => {
    const ports = real(commandId);
    const original = ports.corrections[method].bind(ports.corrections) as (
      input: unknown,
    ) => Promise<unknown>;
    return {
      ...ports,
      corrections: {
        ...ports.corrections,
        [method]: async (input: unknown) => {
          await gate;
          return original(input);
        },
      },
    } as typeof ports;
  });
  return release;
}

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

async function openDraft(
  sample: Sample,
  entry:
    | 'edit-catalogue-details'
    | 'edit-delivery-link'
    | 'start-a-correction' = 'edit-catalogue-details',
) {
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

function sessionKeyOf(runtime: PlatformRuntime): string | null {
  const session = runtime.session.getSnapshot();
  return session.status === 'signed-in' ? session.sessionKey : null;
}

// ---- CM-05 the correction entry -------------------------------------------------------------------

describe('CM-05 the correction entry (CM-06, CM-07 open or join the one draft)', () => {
  it('no update in progress: Start a correction (the primary), Edit catalogue details, Edit delivery link', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showPublished(runtime);
    await heading('Distillation Column');
    const start = within(main()).getByRole('button', { name: 'Start a correction' });
    expect(start).toHaveClass('rb-btn--primary');
    expect(within(main()).getByRole('button', { name: 'Edit catalogue details' })).not.toHaveClass(
      'rb-btn--primary',
    );
    expect(within(main()).getByRole('button', { name: 'Edit delivery link' })).not.toHaveClass(
      'rb-btn--primary',
    );
    expect(
      within(main()).queryByRole('link', { name: /Open update|Continue the update/ }),
    ).toBeNull();
  });

  it('Edit catalogue details opens the one draft and its page, the summary named (CM-06)', async () => {
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

  it('Start a correction lands with nothing named', async () => {
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

  it('a draft: the update’s link and the edit entries, which join it — never a second update', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await openDraft(sample);
    const { navigation } = showPublished(runtime);
    await heading('Distillation Column');
    const links = within(main())
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/content-manager/updates/UPD-0005');
    expect(links.length).toBeGreaterThan(0);
    expect(within(main()).queryByRole('button', { name: 'Start a correction' })).toBeNull();
    await user.click(within(main()).getByRole('button', { name: 'Edit delivery link' }));
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
    expect(
      within(main())
        .getAllByRole('link')
        .some((link) => link.getAttribute('href') === '/content-manager/updates/UPD-0006'),
    ).toBe(true);
    expect(within(main()).getByRole('button', { name: 'Edit catalogue details' })).toBeVisible();
    expect(within(main()).getByRole('button', { name: 'Edit delivery link' })).toBeVisible();
  });

  it('in academic review, awaiting the release decision: only “Open update”', async () => {
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await savedDraft(sample, true);
    showPublished(runtime);
    await heading('Distillation Column');
    expect(within(main()).getByRole('link', { name: 'Open update' })).toHaveAttribute(
      'href',
      '/content-manager/updates/UPD-0005',
    );
    for (const name of ['Start a correction', 'Edit catalogue details', 'Edit delivery link']) {
      expect(within(main()).queryByRole('button', { name })).toBeNull();
    }
    const after = await tabPlatform(KAVYA, 'after-flow-e');
    showPublished(after.runtime);
    await waitFor(() =>
      expect(screen.getAllByRole('link', { name: 'Open update' })).toHaveLength(2),
    );
  });

  it('back from the correction: the notice once, then not again', async () => {
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await openDraft(sample);
    noteBackFromCorrection(sessionKeyOf(runtime), DISTILLATION);
    const first = showPublished(runtime);
    await heading('Distillation Column');
    expect(within(main()).getByText('Back from the correction')).toBeVisible();
    expect(
      within(main()).getByText(
        'The live version is unchanged until the Super Admin releases the update.',
      ),
    ).toBeVisible();
    first.view.unmount();
    showPublished(runtime);
    await heading('Distillation Column');
    expect(within(main()).queryByText('Back from the correction')).toBeNull();
  });
});

// ---- CM-08 Updates --------------------------------------------------------------------------------

describe('CM-08 Updates — the correction tracker', () => {
  it('spine-start: grouped by who must act, each card’s facts, track, reason and action', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showUpdates(runtime);
    await heading('Updates');
    const count = await screen.findByText(
      '5 corrections you raised, most recent change first',
      {},
      { timeout: 5000 },
    );
    expect(count).toHaveAttribute('role', 'status');
    expect(text(main().querySelector('.rb-head .rk-sub'))).toBe(
      'Corrections you raised to published experiments. Live content changes only this way: you, then the Academic Reviewer, then the Super Admin’s release.',
    );
    const figures = main().querySelector('dl.rb-figs')!;
    expect(figures).toHaveAttribute('aria-label', 'Your corrections at a glance');
    expect(text(figures)).toBe(
      'Need you 1 Returned to you or not sent yet With others 1 With the Academic Reviewer or the Super Admin',
    );
    const groups = [...main().querySelectorAll('section.cm-trksec')];
    expect(groups.map((group) => text(group.querySelector('.cm-grp-head')))).toEqual([
      'Need you 1 Change it and send it, or withdraw it',
      'With others 1 Nothing for you to do · the live version stays until release',
      'Closed 3 Kept with their history',
    ]);
    expect(groups[0]!.querySelector('.cm-grp-n')).toHaveClass('is-you');
    // Need you: Induction Motor Loading (UPD-0006 in the address), returned — the ivory card,
    // Continue in gold, the reason quoted.
    const returned = groups[0]!.querySelector('li.cm-trk')!;
    expect(returned).toHaveClass('is-you');
    expect(text(returned.querySelector('.cm-qname'))).toBe('Induction Motor Loading');
    expect(text(returned.querySelector('.cm-trk-meta > span'))).toBe(
      'EEE ZC341 · Electrical Machines · last change 26 Aug',
    );
    expect(text(returned.querySelector('.cm-ver'))).toBe('1.0 live 1.1 proposed');
    expect(returned.querySelector('.cm-trk-st .xr-st')).toHaveClass('xr-st--err');
    const cont = within(returned as HTMLElement).getByRole('link', {
      name: 'Continue the update to Induction Motor Loading, version 1.1, returned',
    });
    expect(cont).toHaveClass('rb-btn', 'rb-btn--primary');
    expect(cont).toHaveAttribute('href', '/content-manager/updates/UPD-0006');
    const track = within(returned as HTMLElement).getByRole('list', {
      name: 'Where this correction is',
    });
    expect(track).toHaveClass('cm-flow--mini');
    expect(track.querySelector('[aria-current="step"]')).toHaveClass('is-you');
    expect(text(returned.querySelector('blockquote.cm-trk-note'))).toBe(
      '“The proposed description says slip falls as the load rises. It rises. Please correct it before I approve.” Prof. A. Menon, Academic Reviewer · 26 Aug',
    );
    // With others: Boiler Drum Level (UPD-0004) on hold, the Super Admin's reason.
    const held = groups[1]!.querySelector('li.cm-trk')!;
    expect(held).not.toHaveClass('is-you');
    expect(held.querySelector('.cm-trk-st .xr-st')).toHaveClass('xr-st--paused');
    expect(
      within(held as HTMLElement).getByRole('link', {
        name: 'Open the update to Boiler Drum Level, version 2.1, on hold',
      }),
    ).not.toHaveClass('rb-btn--primary');
    expect(within(held as HTMLElement).getByRole('link')).toHaveAttribute(
      'href',
      '/content-manager/updates/UPD-0004',
    );
    expect(text(held.querySelector('blockquote.cm-trk-note footer'))).toBe(
      'Arjun Mehta, Super Admin · 20 Aug',
    );
    expect(held.querySelector('[aria-current="step"]')).toHaveClass('is-held');
    // Closed: the outcome line instead of the track.
    const closed = [...groups[2]!.querySelectorAll('li.cm-trk')];
    expect(closed.map((card) => text(card.querySelector('.cm-trk-meta > span')))).toEqual([
      'CHE ZG513 · Process Instrumentation & Control · last change 5 Aug',
      'CHE ZG513 · Process Instrumentation & Control · last change 3 Jul',
      'CHE ZG513 · Process Instrumentation & Control · last change 19 Jun',
    ]);
    // Two updates to one experiment never share a name: the version label tells them apart; the
    // reference is only in the address.
    expect(
      closed.map((card) => {
        const link = within(card as HTMLElement).getByRole('link');
        return [link.getAttribute('aria-label'), link.getAttribute('href')];
      }),
    ).toEqual([
      [
        'Open the update to Orifice Plate Metering, version 1.1, released',
        '/content-manager/updates/UPD-0003',
      ],
      [
        'Open the update to Distillation Column, version 1.2, released',
        '/content-manager/updates/UPD-0002',
      ],
      [
        'Open the update to Distillation Column, version 1.1, released',
        '/content-manager/updates/UPD-0001',
      ],
    ]);
    expect(closed[0]).toHaveClass('is-closed');
    expect(closed[0]!.querySelector('.cm-flowwrap')).toBeNull();
    expect(text(closed[0]!.querySelector('.cm-ver'))).toBe('1.0 1.1 live');
    expect(closed[0]!.querySelector('.cm-ver-old')).toHaveTextContent('1.0');
    expect(text(closed[0]!.querySelector('p.cm-trk-res.is-ok'))).toBe(
      'Released by Arjun Mehta, Super Admin, on 5 Aug 2026. Version 1.1 is live for everyone.',
    );
    expect(text(main().querySelector('p.cm-trkfoot'))).toBe(
      'Start a correction from a published experiment in the Content library. Each experiment has at most one open update.',
    );
    // The shell: Updates current, no crumbs.
    expect(
      screen
        .getByRole('navigation', { name: 'Content Manager navigation' })
        .querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', '/content-manager/updates');
    expect(screen.getByRole('heading', { level: 1, name: 'Updates' })).toHaveAttribute(
      'tabindex',
      '-1',
    );
    await waitFor(() => expect(document.title).toBe('Updates · XR Learning Platform'));
    expectNoReferences();
  });

  it('follows the chain in the same world: a draft is hers, then sent it is with others', async () => {
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    const draft = await openDraft(sample, 'start-a-correction');
    showUpdates(runtime);
    await heading('Updates');
    await screen.findByText(
      '6 corrections you raised, most recent change first',
      {},
      {
        timeout: 5000,
      },
    );
    const mine = main().querySelectorAll('section.cm-trksec')[0]!;
    const start = within(mine as HTMLElement).getByRole('link', {
      name: 'Continue the update to Distillation Column, draft',
    });
    expect(start).toHaveAttribute('href', `/content-manager/updates/${draft.id}`);
    const card = start.closest('li')!;
    expectNoReferences();
    expect(text(card.querySelector('.cm-ver'))).toBe('1.2 live No version label yet');
    expect(card.querySelector('.cm-trk-st .xr-st')).not.toHaveClass('xr-st--err');
    expect(card.querySelector('blockquote')).toBeNull();
    // Sent for academic review: with the Academic Reviewer.
    const cm = asPersonId(sample, KAVYA).corrections;
    const saved = await cm.saveCorrection({
      id: draft.id,
      proposed: { ...draft.proposed, description: NEW_DESCRIPTION },
      whatChangesAndWhy: WHY,
      versionLabel: '1.3',
      expectedRev: draft.rev,
    });
    if (!saved.ok) throw new Error('save');
    await cm.sendForAcademicReview({ id: draft.id, expectedRev: saved.value.rev });
    await act(async () => {
      await runtime.invalidate([{ kind: 'UPD', id: draft.id }]);
    });
    await waitFor(() =>
      expect(
        within(main()).getByRole('link', {
          name: 'Open the update to Distillation Column, version 1.3, in academic review',
        }),
      ).toBeVisible(),
    );
    expect(text(main().querySelector('dl.rb-figs'))).toContain('With others 2');
    expectNoReferences();
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
    const surface = empty.closest('section.rk-surface')!;
    expect(surface).toHaveAttribute('aria-label', 'Corrections you raised');
    expect(surface).toHaveTextContent(
      'Start one from a published experiment in the Content library.',
    );
    expect(
      within(surface as HTMLElement).getByRole('link', { name: 'Open the Content library' }),
    ).toHaveAttribute('href', '/content-manager/library?tab=published');
    expect(main().querySelector('dl.rb-figs')).toBeNull();
    expect(main().querySelector('.cm-trkcount')).toBeNull();
    expectNoReferences();
  });

  it('loading (no count, no figures), then couldn’t load + Try again (focus to the title)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    faults(sample).failNext('CorrectionService.listUpdates' as never);
    showUpdates(runtime);
    await waitFor(() =>
      expect(document.querySelector('section[aria-busy="true"] [role="status"]')).toHaveTextContent(
        'Loading your corrections…',
      ),
    );
    expect(main().querySelector('dl.rb-figs')).toBeNull();
    expect(main().querySelector('.cm-trkcount')).toBeNull();
    expectNoReferences();
    const failed = await screen.findByRole('alert', {}, { timeout: 5000 });
    expect(text(failed)).toBe(
      'We couldn’t load your corrections Nothing has changed. Try again. Try again',
    );
    expect(main().querySelector('dl.rb-figs')).toBeNull();
    expectNoReferences();
    await user.click(within(failed).getByRole('button', { name: 'Try again' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Updates' })).toHaveFocus();
    await screen.findByText(
      '5 corrections you raised, most recent change first',
      {},
      {
        timeout: 5000,
      },
    );
  });
});

// ---- CM-08 the correction: the draft --------------------------------------------------------------

// UX-22: every CM-08 test types long correction text; 5–12 s each on a busy 8 GB Windows laptop.
// The limit is stated for this group rather than raised for the whole suite.
describe('CM-08 the correction draft (CM-06, CM-07 arrivals)', { timeout: 20_000 }, () => {
  it('the band, the sheet and the panel: pre-filled with the live version, nothing changed yet', async () => {
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await openDraft(sample);
    showUpdate(runtime, 'UPD-0005', '?focus=summary');
    const title = await heading('Update to Distillation Column');
    expect(title).toHaveAttribute('tabindex', '-1');
    expect(text(band().querySelector('.rk-eyebrow'))).toBe('Correction to a published experiment');
    expect(chip()).toBe('Draft');
    expect(band().querySelector('.rb-id-status .xr-st')).toHaveClass('rk-st-lg');
    expect(text(band().querySelector('.cm-ver'))).toBe('1.2 live No version label yet');
    expect(text(band().querySelector('.cm-fmtname'))).toBe(
      'CHE ZG513 Process Instrumentation & Control',
    );
    expect(
      within(band()).getByRole('link', { name: 'Back to the published experiment' }),
    ).toHaveAttribute('href', '/content-manager/published/distillation-column');
    expect(within(band()).getByRole('link', { name: 'Go to actions' })).toHaveAttribute(
      'href',
      '#cm-u-panel',
    );
    expect(facts()).toEqual([
      'Live version: 1.2, unchanged until released',
      'Proposed: Not set yet',
      'Fields changed: None yet',
      expect.stringMatching(/^Started: \d+ \w+ 2026 · from Edit catalogue details$/),
    ]);
    expect(band().querySelectorAll('dd.is-quiet')).toHaveLength(2);
    const track = within(band()).getByRole('list', { name: 'Where this correction is' });
    expect(track.querySelector('li.is-you .cm-you')).toHaveTextContent('Your step');
    // The crumbs: Updates › the H1's words (never the reference); the top bar names the
    // destination; the browser tab leads with the update.
    expect(text(screen.getByRole('navigation', { name: 'Breadcrumb' }))).toBe(
      'Updates Update to Distillation Column',
    );
    await waitFor(() =>
      expect(document.title).toBe('Update to Distillation Column · Updates · XR Learning Platform'),
    );
    // The sheet.
    expect(field('Reason for the change (required to send)').value).toBe('');
    expect(field('Name').value).toBe('Distillation Column');
    expect(field('Summary').value).toMatch(/^Bring a binary column from cold start/);
    expect(field('Description').value).toBe(LIVE_DESCRIPTION);
    expect(field('WEB · web link').value).toBe('https://labs.meridian.example/distillation-column');
    expect(field('WEB · web link')).toHaveAttribute('type', 'url');
    expect(field('VR · package reference').value).toBe('MVL-DC-VR-1.2');
    expect(text(field('VR · package reference').closest('.rk-field'))).toContain(
      'App package fields are provisional. The live reference is MVL-DC-VR-1.2.',
    );
    expect(text(main())).not.toMatch(/\((?:T|OD|ND|D|SUP|UPD|ROLE)-[\w-]+\)/);
    expect(field('New version label (required to send)').value).toBe('');
    expect(text(field('New version label (required to send)').closest('.rk-field'))).toContain(
      'For example 1.3. The live version is 1.2.',
    );
    expect(main().querySelectorAll('.cm-tag')).toHaveLength(0);
    const comparison = screen.getByRole('region', { name: 'Current and proposed' });
    expect(text(comparison)).toBe('Current and proposed Changed fields only Nothing changed yet.');
    expect(historyWhat()).toEqual(['Correction started from Edit catalogue details']);
    expect(text(main().querySelector('.rk-tl-n'))).toBe('Pre-filled with the live version 1.2.');
    // The panel.
    expect(text(stateNotice())).toBe(
      'Draft — only you can see it Version 1.2 stays live. Send it for academic review when it’s ready.',
    );
    expect(stateNotice()).toHaveClass('rk-notice--info');
    expect(text(panel().querySelector('dl.rk-stand'))).toMatch(
      /^Changes None yet Last saved \d+ \w+ 2026, \d\d:\d\d$/,
    );
    expect(text(panel().querySelector('.rk-pending'))).toBe(
      'Before you send it: say what changes and why, add a new version label, change at least one field.',
    );
    expect(
      within(panel())
        .getAllByRole('button')
        .map((button) => [text(button), button.className]),
    ).toEqual([
      ['Send for academic review', 'rb-btn rb-btn--primary rk-go'],
      ['Save draft', 'rb-btn cm-wide'],
      ['Withdraw update', 'rb-btn rb-btn--ghost cm-wide'],
    ]);
    // CM-06: the summary is focused.
    await waitFor(() => expect(field('Summary')).toHaveFocus());
    // Nowhere a reference — the closed Send and Withdraw dialogs included.
    expect(
      [...document.querySelectorAll('dialog.rk-dialog h2')].map((title) => text(title)),
    ).toEqual([
      'Send the update to Distillation Column for academic review?',
      'Withdraw the update to Distillation Column?',
    ]);
    expectNoReferences();
  });

  it('CM-06 arrival (CM-05’s note): “New correction draft, from Edit catalogue details”; Go to the catalogue details', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await openDraft(sample);
    noteCorrectionArrival(sessionKeyOf(runtime), 'UPD-0005', {
      entry: 'edit-catalogue-details',
      joined: false,
    });
    showUpdate(runtime, 'UPD-0005', '?focus=summary');
    await heading('Update to Distillation Column');
    const arrival = document.getElementById('cm-u-entry')!;
    expect(arrival).toHaveAttribute('role', 'status');
    expect(text(arrival)).toBe(
      'New correction draft, from Edit catalogue details Every field is pre-filled with live version 1.2. Change only what needs correcting and say why. Nothing changes in the catalogue until the Super Admin releases it. Go to the catalogue details',
    );
    field('Name').focus();
    await user.click(within(arrival).getByRole('button', { name: 'Go to the catalogue details' }));
    expect(field('Summary')).toHaveFocus();
    expectNoReferences();
  });

  it('CM-07 joins the open draft: “Your edit joins the open update”, the web link focused; Go to the web link', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await openDraft(sample);
    noteCorrectionArrival(sessionKeyOf(runtime), 'UPD-0005', {
      entry: 'edit-delivery-link',
      joined: true,
    });
    showUpdate(runtime, 'UPD-0005', '?focus=web-link');
    await heading('Update to Distillation Column');
    await waitFor(() => expect(field('WEB · web link')).toHaveFocus());
    const arrival = document.getElementById('cm-u-entry')!;
    expect(text(arrival)).toBe(
      'Your edit joins the open update This experiment already has an open correction, so your delivery change goes into it. One correction at a time per experiment. Go to the web link',
    );
    field('Name').focus();
    await user.click(within(arrival).getByRole('button', { name: 'Go to the web link' }));
    expect(field('WEB · web link')).toHaveFocus();
    expectNoReferences();
  });

  it('CM-07 without CM-05’s note: the address names the entry (a new draft from Edit a delivery link)', async () => {
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await openDraft(sample, 'edit-delivery-link');
    const first = showUpdate(runtime, 'UPD-0005', '?focus=web-link');
    await heading('Update to Distillation Column');
    await waitFor(() => expect(field('WEB · web link')).toHaveFocus());
    expect(text(document.getElementById('cm-u-entry'))).toMatch(
      /^New correction draft, from Edit a delivery link The delivery details are pre-filled with live version 1\.2\./,
    );
    expect(historyWhat()).toEqual(['Correction started from Edit delivery link']);
    first.view.unmount();
    // Opened from the list, nothing explains an arrival.
    showUpdate(runtime, 'UPD-0005');
    await heading('Update to Distillation Column');
    expect(document.getElementById('cm-u-entry')).toBeNull();
  });

  it('Send with nothing changed: all three errors at once under “Check the update”', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await openDraft(sample, 'start-a-correction');
    showUpdate(runtime, 'UPD-0005');
    await heading('Update to Distillation Column');
    expect(historyWhat()).toEqual(['Correction started from the published experiment']);
    expect(facts()[3]).toMatch(/· from the published experiment$/);
    await user.click(within(panel()).getByRole('button', { name: 'Send for academic review' }));
    const summary = await screen.findByRole('alert');
    expect(summary).toHaveClass('rk-errsum');
    expect(summary).toHaveAttribute('id', 'cm-u-errs');
    expect(text(summary)).toBe(
      'Check the update Say what changes and why Enter the version label, for example 1.3 Change at least one catalogue detail or delivery link',
    );
    await waitFor(() => expect(summary).toHaveFocus());
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(field('Reason for the change (required to send)')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(field('New version label (required to send)')).toHaveAttribute('aria-invalid', 'true');
    const change = document.getElementById('cm-u-chg-err')!;
    expect(change).toHaveClass('rk-ferr');
    expect(text(change)).toBe('Change at least one catalogue detail or delivery link');
    expect(change.closest('section')).toBe(
      screen.getByRole('region', { name: 'Current and proposed' }),
    );
    expect(field('Summary').getAttribute('aria-describedby')).toContain('cm-u-chg-err');
    // The change link lands on the summary.
    await user.click(within(summary).getByRole('link', { name: /Change at least one/ }));
    expect(field('Summary')).toHaveFocus();
    // The live label is not a new one.
    await user.type(field('New version label (required to send)'), '1.2');
    await user.click(within(panel()).getByRole('button', { name: 'Send for academic review' }));
    expect(text(await screen.findByRole('alert'))).toContain(
      'Use a new version label — 1.2 is live',
    );
    expect((await updateOf(sample)).state).toBe('draft');
  });

  it('typing: the comparison, the Changed tags, the band and Last saved follow it; Save draft keeps it — live unchanged', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await openDraft(sample);
    showUpdate(runtime, 'UPD-0005');
    await heading('Update to Distillation Column');
    await user.clear(field('Description'));
    await user.type(field('Description'), NEW_DESCRIPTION);
    await user.type(field('New version label (required to send)'), '1.3');
    expect(comparisonFields()).toEqual(['Description', 'Version']);
    const version = main().querySelectorAll('table.cm-cmp tbody tr')[1]!;
    expect(text(version)).toBe('Version Live now 1.2 Proposed 1.3');
    expect(screen.getByRole('table', { name: 'Current and proposed, changed fields only' })).toBe(
      main().querySelector('table.cm-cmp'),
    );
    expect(text(field('Description').closest('.rk-field')!.querySelector('.cm-tag'))).toBe(
      'Changed',
    );
    expect(field('Name').closest('.rk-field')!.querySelector('.cm-tag')).toBeNull();
    expect(text(band().querySelector('.cm-ver'))).toBe('1.2 live 1.3 proposed');
    expect(facts().slice(1, 3)).toEqual(['Proposed: 1.3', 'Fields changed: 1 field']);
    expect(text(panel().querySelector('dl.rk-stand'))).toMatch(
      /^Changes 1 field changed Last saved .* · you have unsaved changes$/,
    );
    expect(text(panel().querySelector('.rk-pending'))).toBe(
      'Before you send it: say what changes and why.',
    );
    await user.click(within(panel()).getByRole('button', { name: 'Save draft' }));
    const saved = await screen.findByText(
      /^\d+ \w+ 2026, \d\d:\d\d · the live version is unchanged$/,
    );
    const notice = saved.closest('.rk-notice')!;
    expect(notice).toHaveClass('rk-notice--ok');
    expect(notice).toHaveAttribute('id', 'cm-u-saved');
    expect(notice.querySelector('.rk-notice-t')).toHaveTextContent('Draft saved');
    await waitFor(() => expect(notice).toHaveFocus());
    expect(text(panel().querySelector('dl.rk-stand'))).not.toContain('unsaved');
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
    await heading('Update to Distillation Column');
    await user.type(field('Reason for the change (required to send)'), 'Typed, not saved.');
    first.view.unmount();
    showUpdate(runtime, 'UPD-0005');
    await heading('Update to Distillation Column');
    expect(field('Reason for the change (required to send)').value).toBe('Typed, not saved.');
    expect(text(panel().querySelector('dl.rk-stand'))).toContain('you have unsaved changes');
    expect((await updateOf(sample)).whatChangesAndWhy).toBeNull();
  });

  it('a stale save is refused calmly and focused; what was typed stays; Show where it is now', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await openDraft(sample);
    answerWith(runtime, 'saveCorrection', { kind: 'stale-version', currentRev: 9 });
    showUpdate(runtime, 'UPD-0005');
    await heading('Update to Distillation Column');
    await user.type(field('Reason for the change (required to send)'), 'Mine.');
    await user.click(within(panel()).getByRole('button', { name: 'Save draft' }));
    const stale = await screen.findByRole('alert');
    expect(stale).toHaveAttribute('id', 'cm-u-stale');
    expect(stale).toHaveClass('rk-notice', 'rk-notice--warn');
    expect(text(stale)).toBe(
      'This update changed while you were on the page This update changed since you opened it. Nothing was saved — check what you entered and try again. Show where it is now',
    );
    await waitFor(() => expect(stale).toHaveFocus());
    expect(field('Reason for the change (required to send)').value).toBe('Mine.');
    expect((await updateOf(sample)).whatChangesAndWhy).toBeNull();
    await user.click(within(stale).getByRole('button', { name: 'Show where it is now' }));
    await waitFor(() => expect(stateNotice()).toHaveFocus());
    expect(document.getElementById('cm-u-stale')).toBeNull();
  });

  it('a save failed for now: “We couldn’t save your draft”, edits kept, Try again saves', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await openDraft(sample);
    showUpdate(runtime, 'UPD-0005');
    await heading('Update to Distillation Column');
    await user.type(field('Reason for the change (required to send)'), 'Kept.');
    faults(sample).failNext('CorrectionService.saveCorrection' as never);
    await user.click(within(panel()).getByRole('button', { name: 'Save draft' }));
    const failed = await within(panel()).findByRole('alert');
    expect(failed).toHaveAttribute('id', 'cm-u-savefail');
    expect(text(failed)).toBe(
      'We couldn’t save your draft Your changes are still on this page. The live version is unchanged. Try again. Try again',
    );
    await waitFor(() => expect(failed).toHaveFocus());
    expect(field('Reason for the change (required to send)').value).toBe('Kept.');
    await user.click(within(failed).getByRole('button', { name: 'Try again' }));
    await screen.findByText(/· the live version is unchanged$/);
    expect(document.getElementById('cm-u-savefail')).toBeNull();
    expect((await updateOf(sample)).whatChangesAndWhy).toBe('Kept.');
  });

  it('Save draft while it runs: Saving…, presses ignored', async () => {
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await openDraft(sample);
    showUpdate(runtime, 'UPD-0005');
    await heading('Update to Distillation Column');
    const save = within(panel()).getByRole('button', { name: 'Save draft' });
    fireEvent.click(save);
    expect(save).toHaveTextContent('Saving…');
    expect(save).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(save);
    await screen.findByText(/· the live version is unchanged$/);
    expect(within(panel()).getByRole('button', { name: 'Save draft' })).not.toHaveAttribute(
      'aria-disabled',
    );
  });

  it(
    'Send for academic review (its dialog): saves what is typed, sends it — read-only, In academic review',
    { timeout: 20_000 },
    async () => {
      // UX-22: a long typed journey; about 6–7 s on a slower Windows laptop. Its limit is stated here
      // rather than raised for every test.
      const user = userEvent.setup();
      const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
      await openDraft(sample);
      showUpdate(runtime, 'UPD-0005');
      await heading('Update to Distillation Column');
      await user.type(field('Reason for the change (required to send)'), WHY);
      await user.clear(field('Description'));
      await user.type(field('Description'), NEW_DESCRIPTION);
      await user.type(field('New version label (required to send)'), '1.3');
      await user.click(within(panel()).getByRole('button', { name: 'Send for academic review' }));
      const dialog = await screen.findByRole('dialog', {
        name: 'Send the update to Distillation Column for academic review?',
      });
      expect(dialog).toHaveClass('rk-dialog');
      expectNoReferences();
      await waitFor(() => expect(within(dialog).getByRole('heading', { level: 2 })).toHaveFocus());
      expect(text(dialog.querySelector('.rk-dlg-head p'))).toBe(
        'It goes to the Academic Reviewer, then to the Super Admin, who decides when to release it.',
      );
      expect(text(dialog.querySelector('.rk-dlg-now'))).toBe(
        'What happens now The Academic Reviewer can review it. It becomes read-only for you while it is reviewed. Version 1.2 stays live — nothing changes for the public or for students.',
      );
      expect(text(dialog.querySelector('.rk-dlg-later'))).toBe(
        'Only after later events If it is approved, the Super Admin decides whether to release it or put it on hold. Releasing changes it for everyone who can already open it. It gives no one new access.',
      );
      await user.click(within(dialog).getByRole('button', { name: 'Send for academic review' }));
      await waitFor(() => expect(chip()).toBe('In academic review'));
      await waitFor(() => expect(stateNotice()).toHaveFocus());
      expect(text(stateNotice())).toMatch(
        /^In academic review With the Academic Reviewer since \d+ \w+ 2026\. Read-only while it is reviewed\. The live version 1\.2 is unchanged\.$/,
      );
      expect(within(main()).queryAllByRole('textbox')).toHaveLength(0);
      const why = screen.getByRole('region', { name: 'What changes and why' });
      expect(text(why.querySelector('.rk-sec-h'))).toBe('What changes and why Version 1.3');
      expect(text(why.querySelector('blockquote.rk-quote'))).toBe(WHY);
      expect(historyWhat()).toEqual([
        'Sent for academic review',
        'Correction started from Edit catalogue details',
      ]);
      expect(facts()[3]).toMatch(/^Sent: \d+ \w+ 2026$/);
      // Withdraw is still offered while it is reviewed, with the published experiment.
      expect(
        within(panel())
          .getAllByRole('button')
          .map((button) => text(button)),
      ).toEqual(['Withdraw update']);
      expect(
        within(panel()).getByRole('link', { name: 'Open the published experiment' }),
      ).toHaveAttribute('href', '/content-manager/published/distillation-column');
      const update = await updateOf(sample);
      expect([update.state, update.whatChangesAndWhy, update.versionLabel]).toEqual([
        'in-academic-review',
        WHY,
        '1.3',
      ]);
      expectNoReferences();
      expect((await liveOf(sample)).label).toBe('1.2');
    },
  );

  it('the send dialog while it runs: Sending…, Cancel and Esc wait; closing changes nothing before it', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await savedDraft(sample);
    showUpdate(runtime, 'UPD-0005');
    await heading('Update to Distillation Column');
    // Esc closes the dialog before anything is sent, focus back to the opener.
    const send = within(panel()).getByRole('button', { name: 'Send for academic review' });
    await user.click(send);
    let dialog = await screen.findByRole('dialog', {
      name: 'Send the update to Distillation Column for academic review?',
    });
    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(send).toHaveFocus();
    expect((await updateOf(sample)).state).toBe('draft');
    // Confirmed: it runs; Cancel and Esc wait for the answer.
    const release = holdCommand(runtime, 'sendForAcademicReview');
    await user.click(send);
    dialog = await screen.findByRole('dialog', {
      name: 'Send the update to Distillation Column for academic review?',
    });
    const confirm = within(dialog).getByRole('button', { name: 'Send for academic review' });
    fireEvent.click(confirm);
    await waitFor(() => expect(confirm).toHaveTextContent('Sending…'));
    expect(confirm).toHaveAttribute('aria-disabled', 'true');
    // Cancel is disabled and focus is held on the dialog's title (CM-v1 "Behaviour notes").
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(within(dialog).getByRole('heading', { level: 2 })).toHaveFocus();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(
      screen.getByRole('dialog', {
        name: 'Send the update to Distillation Column for academic review?',
      }),
    ).toBeVisible();
    release();
    await waitFor(() => expect(chip()).toBe('In academic review'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('Withdraw (its dialog): a reason is required; then Withdrawn — closed stages dashed, live unchanged', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await savedDraft(sample, true);
    showUpdate(runtime, 'UPD-0005');
    await heading('Update to Distillation Column');
    await user.click(within(panel()).getByRole('button', { name: 'Withdraw update' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Withdraw the update to Distillation Column?',
    });
    expect(text(dialog.querySelector('.rk-dlg-head p'))).toBe(
      'Nothing changes in the live version. The update closes and can’t be sent again; you can start a new correction later.',
    );
    const reason = within(dialog).getByLabelText('Reason (required)');
    await waitFor(() => expect(reason).toHaveFocus());
    expect(text(reason.closest('.rk-field'))).toContain('Kept in this update’s history.');
    expectNoReferences();
    const confirm = within(dialog).getByRole('button', { name: 'Withdraw update' });
    expect(confirm).toHaveClass('rb-btn--navy');
    await user.click(confirm);
    expect(
      await within(dialog).findByText('Add a reason for withdrawing this update'),
    ).toBeVisible();
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(reason).toHaveFocus());
    await user.type(reason, 'Raised by mistake.');
    await user.click(confirm);
    await waitFor(() => expect(chip()).toBe('Withdrawn'));
    await waitFor(() => expect(stateNotice()).toHaveFocus());
    expect(stateNotice()).toHaveClass('rk-notice--off');
    expect(text(stateNotice())).toMatch(
      /^Withdrawn Withdrawn on \d+ \w+ 2026\. The live version is unchanged\. You can start a new correction from the published experiment\. Reason: “Raised by mistake\.”$/,
    );
    expect(text(band().querySelector('.cm-ver'))).toBe('1.2 live 1.3 withdrawn');
    expect(facts()[0]).toBe('Live version: 1.2, unchanged');
    expect(band().querySelectorAll('li.cm-step.is-off')).toHaveLength(4);
    expect(historyWhat()[0]).toBe('Withdrawn');
    expect(text(main().querySelector('.rk-tl-n'))).toBe(
      '“Raised by mistake.” Nothing changed in the live version.',
    );
    expect(within(panel()).queryAllByRole('button')).toHaveLength(0);
    expect((await liveOf(sample)).label).toBe('1.2');
    expectNoReferences();
  });

  it('the withdraw dialog while it runs: Withdrawing…, Cancel and Esc wait', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    await openDraft(sample);
    showUpdate(runtime, 'UPD-0005');
    await heading('Update to Distillation Column');
    const release = holdCommand(runtime, 'withdrawUpdate');
    await user.click(within(panel()).getByRole('button', { name: 'Withdraw update' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Withdraw the update to Distillation Column?',
    });
    await user.type(within(dialog).getByLabelText('Reason (required)'), 'Not needed.');
    const confirm = within(dialog).getByRole('button', { name: 'Withdraw update' });
    fireEvent.click(confirm);
    await waitFor(() => expect(confirm).toHaveTextContent('Withdrawing…'));
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(within(dialog).getByRole('heading', { level: 2 })).toHaveFocus();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(
      screen.getByRole('dialog', {
        name: 'Withdraw the update to Distillation Column?',
      }),
    ).toBeVisible();
    release();
    await waitFor(() => expect(chip()).toBe('Withdrawn'));
  });

  it('withdraw after an unseen approval: refused, the approval said, read again (stale)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    const sent = await savedDraft(sample, true);
    showUpdate(runtime, 'UPD-0005');
    await heading('Update to Distillation Column');
    // The Academic Reviewer approves it meanwhile (through the port; the page has not read it).
    const reviewer = asPersonId(sample, MENON).corrections;
    const approved = await reviewer.approveUpdate({ id: sent.id, expectedRev: sent.rev });
    expect(approved.ok).toBe(true);
    await user.click(within(panel()).getByRole('button', { name: 'Withdraw update' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Withdraw the update to Distillation Column?',
    });
    await user.type(within(dialog).getByLabelText('Reason (required)'), 'No longer needed.');
    await user.click(within(dialog).getByRole('button', { name: 'Withdraw update' }));
    const stale = await screen.findByRole('alert');
    expect(stale).toHaveAttribute('id', 'cm-u-stale');
    await waitFor(() =>
      expect(text(stale)).toMatch(
        /^This update changed while you were on the page The Academic Reviewer approved it at \d\d:\d\d, so it can’t be withdrawn or changed now\. Release or hold is the Super Admin’s decision\. Nothing was changed by your action\. Show where it is now$/,
      ),
    );
    await waitFor(() => expect(chip()).toBe('Awaiting release decision'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect((await updateOf(sample)).state).toBe('awaiting-release-decision');
    expectNoReferences();
  });
});

// ---- CM-08 the correction: the later states -------------------------------------------------------

describe('CM-08 the correction: returned, awaiting, on hold, hold lifted, released; no update', () => {
  it('returned (UPD-0006): the reviewer’s reason first, editable again', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showUpdate(runtime, 'UPD-0006');
    await heading('Update to Induction Motor Loading');
    expect(chip()).toBe('Returned');
    expect(band().querySelector('.rb-id-status .xr-st')).toHaveClass('xr-st--err');
    const reason = screen.getByRole('region', { name: 'Returned by the Academic Reviewer' });
    expect(reason.querySelector('.cm-retbox')).not.toBeNull();
    expect(text(reason)).toBe(
      'Returned by the Academic Reviewer 26 Aug 2026, 10:00 · Prof. A. Menon The proposed description says slip falls as the load rises. It rises. Please correct it before I approve. Prof. A. Menon, Academic Reviewer Change what’s needed below, then send it for academic review again.',
    );
    // The reason is first on the sheet.
    expect(main().querySelector('.rk-mainsheet > section')).toBe(reason);
    expect(field('Reason for the change (required to send)').value).toBe('Correction UPD-0006.');
    expect(text(stateNotice())).toBe(
      'Returned to you Prof. A. Menon returned it on 26 Aug 2026. Change it and send it for academic review again. Version 1.0 stays live.',
    );
    expect(text(panel().querySelector('dl.rk-stand'))).toBe(
      'Changes None yet Last saved 24 Aug 2026, 11:00',
    );
    const track = within(band()).getByRole('list', { name: 'Where this correction is' });
    expect([...track.querySelectorAll('li')].map((step) => step.className)).toEqual([
      'cm-step is-you',
      'cm-step is-back',
      'cm-step',
      'cm-step',
    ]);
    expect(historyWhat()).toEqual([
      'Returned by Prof. A. Menon',
      'Sent for academic review',
      'Correction started from the published experiment',
    ]);
    // An app package reference for each app format the experiment has.
    expect(field('VR · package reference')).toBeVisible();
    expect(field('MR · package reference')).toBeVisible();
    // The seeded reason is the one reference shown: a person's words, quoted as written.
    expect(text(screen.getByRole('navigation', { name: 'Breadcrumb' }))).toBe(
      'Updates Update to Induction Motor Loading',
    );
    await waitFor(() =>
      expect(document.title).toBe(
        'Update to Induction Motor Loading · Updates · XR Learning Platform',
      ),
    );
    expectNoReferences('Correction UPD-0006.');
  });

  it('sent again after a return: “Sent again for academic review” in the history', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showUpdate(runtime, 'UPD-0006');
    await heading('Update to Induction Motor Loading');
    await user.type(field('Name'), ' (corrected)');
    await user.click(within(panel()).getByRole('button', { name: 'Send for academic review' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Send the update to Induction Motor Loading for academic review?',
    });
    expectNoReferences('Correction UPD-0006.');
    await user.click(within(dialog).getByRole('button', { name: 'Send for academic review' }));
    await waitFor(() => expect(chip()).toBe('In academic review'));
    expect(historyWhat()[0]).toBe('Sent again for academic review');
  });

  it('awaiting the release decision (after Flow E): read-only, the comparison, no action but the experiment', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'after-flow-e');
    showUpdate(runtime, 'UPD-0005');
    await heading('Update to Distillation Column');
    expect(chip()).toBe('Awaiting release decision');
    expect(text(stateNotice())).toMatch(
      /^Awaiting release decision Approved by Prof\. A\. Menon on \d+ \w+ 2026\. The Super Admin decides whether to release it or put it on hold\. Version 1\.2 stays live until it is released\.$/,
    );
    expect(comparisonFields()).toEqual(['Description', 'WEB · web link', 'Version']);
    expect(facts()[2]).toBe('Fields changed: 2 fields');
    expect(historyWhat()).toEqual([
      'Approved by Prof. A. Menon',
      'Sent for academic review',
      'Correction started from Edit catalogue details',
    ]);
    expect(within(main()).queryAllByRole('textbox')).toHaveLength(0);
    expect(within(panel()).queryAllByRole('button')).toHaveLength(0);
    expect(
      within(panel()).getByRole('link', { name: 'Open the published experiment' }),
    ).toBeVisible();
    expectNoReferences();
  });

  it('on hold (UPD-0004): the reason shown; then the hold lifted (awaiting again)', async () => {
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    const first = showUpdate(runtime, 'UPD-0004');
    await heading('Update to Boiler Drum Level');
    expect(chip()).toBe('On hold');
    expect(band().querySelector('.rb-id-status .xr-st')).toHaveClass('xr-st--paused');
    expect(stateNotice()).toHaveClass('rk-notice--paused');
    expect(text(stateNotice())).toBe(
      'On hold The Super Admin put this update on hold on 20 Aug 2026. Version 2.0 stays live. Reason: “Version 2.0 stays live while the 2.1 build is checked.” — Arjun Mehta, Super Admin',
    );
    expect(historyWhat()[0]).toBe('Put on hold by Arjun Mehta');
    expect(text(main().querySelector('.rk-tl-n'))).toBe(
      '“Version 2.0 stays live while the 2.1 build is checked.” Version 2.0 stays live.',
    );
    expect(band().querySelector('li.cm-step.is-held')).not.toBeNull();
    // The seeded “what changes and why” is quoted as written, the one reference shown.
    expect(
      text(
        screen
          .getByRole('region', { name: 'What changes and why' })
          .querySelector('blockquote.rk-quote'),
      ),
    ).toBe('Correction UPD-0004.');
    expectNoReferences('Correction UPD-0004.');
    first.view.unmount();
    // The Super Admin lifts the hold (through the port): awaiting again, the lift said.
    const admin = asPersonId(sample, 'sa-arjun-mehta').corrections;
    const held = await asPersonId(sample, KAVYA).corrections.getUpdate('UPD-0004' as never);
    if (!held.ok) throw new Error('read');
    const lifted = await admin.liftHold({
      id: 'UPD-0004',
      expectedRev: held.value.update.rev,
    } as never);
    expect(lifted.ok).toBe(true);
    await act(async () => {
      await runtime.invalidate([{ kind: 'UPD', id: 'UPD-0004' }]);
    });
    showUpdate(runtime, 'UPD-0004');
    await heading('Update to Boiler Drum Level');
    await waitFor(() => expect(chip()).toBe('Awaiting release decision'));
    expect(text(stateNotice())).toMatch(
      / The hold was lifted on \d+ \w+ 2026\. Nothing went live; it is waiting for the Super Admin’s decision again\.$/,
    );
    expect(historyWhat()[0]).toBe('Hold lifted by Arjun Mehta');
    expectNoReferences('Correction UPD-0004.');
  });

  it('released (after Flow F): what changed — Live before against Released', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'after-flow-f');
    showUpdate(runtime, 'UPD-0005');
    await heading('Update to Distillation Column');
    expect(chip()).toBe('Released');
    expect(text(band().querySelector('.cm-ver'))).toBe('1.2 1.3 live');
    expect(facts()).toEqual([
      'Live before: 1.2',
      'Released version: 1.3',
      'Fields changed: 2 fields',
      expect.stringMatching(/^Released: \d+ \w+ 2026 · Arjun Mehta$/),
    ]);
    expect(band().querySelectorAll('li.cm-step.is-done')).toHaveLength(4);
    expect(stateNotice()).toHaveClass('rk-notice--ok');
    expect(text(stateNotice())).toMatch(
      /^Released Version 1\.3 is live for everyone since \d+ \w+ 2026\. The history keeps version 1\.2 and every decision\.$/,
    );
    const changed = screen.getByRole('region', { name: 'What changed' });
    expect(text(changed.querySelector('.rk-sec-h'))).toBe(
      'What changed Live before and released · changed fields only',
    );
    expect(
      within(changed)
        .getAllByRole('columnheader')
        .map((cell) => text(cell)),
    ).toEqual(['Field', 'Live before', 'Released']);
    expect(text(main().querySelectorAll('table.cm-cmp tbody tr')[2]!)).toBe(
      'Version Live before 1.2 Released 1.3',
    );
    expect(historyWhat()[0]).toBe('Released by Arjun Mehta');
    expectNoReferences();
  });

  it('loading, then couldn’t load + Try again: no reference while it waits (a test fault plan)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    faults(sample).failNext('CorrectionService.getUpdate' as never);
    showUpdate(runtime, 'UPD-0006');
    await waitFor(() => expect(main()).toHaveTextContent('Loading the update'));
    expectNoReferences();
    const failed = await screen.findByRole('alert', {}, { timeout: 5000 });
    expect(failed).toHaveTextContent('We couldn’t load this update');
    expect(failed).toHaveTextContent('Nothing has changed. Try again.');
    // Until the update is read the crumbs and the tab name only the destination.
    await waitFor(() => expect(document.title).toBe('Updates · XR Learning Platform'));
    expectNoReferences();
    await act(async () => {
      await user.click(within(failed).getByRole('button', { name: 'Try again' }));
    });
    await heading('Update to Induction Motor Loading');
    expectNoReferences('Correction UPD-0006.');
  });

  it('no such update: “No update open” with the Content library', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showUpdate(runtime, 'UPD-0099');
    await heading('No update open');
    expect(text(main())).toContain('Start a correction from a published experiment.');
    expect(within(main()).getByRole('link', { name: 'Open the Content library' })).toHaveAttribute(
      'href',
      '/content-manager/library',
    );
    // The crumb says the H1's words, never the address's reference.
    expect(text(screen.getByRole('navigation', { name: 'Breadcrumb' }))).toBe(
      'Updates No update open',
    );
    expectNoReferences();
  });

  it('the history in her words, newest first (state-copy `CM-08.history`)', async () => {
    const { sample } = await tabPlatform(MENON, 'after-flow-e');
    standinsOf(sample).clock.setSampleNow('2026-10-23T05:00:00.000Z' as IsoInstant);
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

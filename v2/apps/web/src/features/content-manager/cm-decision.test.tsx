/**
 * CM-03 Publication decision (boards B6-07, B6-11 f4 … f8) and CM-05 Published experiment (B6-08,
 * B6-11 f9) on the real composition root and the sample world, as Kavya Nair. Publish through
 * DL-1 creates the experiment and changes no other record (BC9: no plan, licence, grant or
 * person); a check that fails (a state sample — the spine-start world has none, OD-B6-03) lists
 * only the record’s own failing checks and offers Send back only; Send back checks who and why
 * at once, sends references toward the vendor only and keeps what was typed when the record
 * changed meanwhile; still in review or with the vendor, the page is read-only. CM-05 states the
 * live version and an update in progress; its Phase-6 correction entry is `cm-correction.test.tsx`.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ServiceError } from '@xr/contracts/draft';
import type { Submission } from '@xr/domain';
import { asPersonId, faults, fixtureWorld, snapshot } from '@xr/sample-platform/testing';
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
import { decisionFacts } from './cm-03-decision/decision-view';
import { PublicationDecision } from './cm-03-decision/publication-decision';
import { PublishedExperiment } from './cm-05-published/published-experiment';

afterEach(() => {
  forgetLastAddress();
  vi.restoreAllMocks();
});

const KAVYA = 'per-kavya-nair';
const RITU = 'per-ritu-sharma';

function inShell(ui: ReactNode) {
  return (
    <WorkspaceLayout workspace="content-manager">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{ui}</TestNotFoundBoundary>
    </WorkspaceLayout>
  );
}

function showDecision(runtime: PlatformRuntime, submissionId: string) {
  const navigation = testNavigation(`/content-manager/decisions/${submissionId}`);
  renderInTab(inShell(<PublicationDecision submissionId={submissionId} />), {
    runtime,
    navigation,
  });
  return navigation;
}

function showPublished(runtime: PlatformRuntime, experimentId: string) {
  const navigation = testNavigation(`/content-manager/published/${experimentId}`);
  renderInTab(inShell(<PublishedExperiment experimentId={experimentId} />), {
    runtime,
    navigation,
  });
  return navigation;
}

const main = () => screen.getByRole('main');
const panel = () => screen.getByRole('complementary', { name: 'Your decision' });
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
const checkRows = () =>
  [...within(main()).getByRole('list', { name: 'Publication check' }).querySelectorAll('li')].map(
    (row) => text(row),
  );

/** One port’s command answered with a refusal (the screen’s handling of it, not the service). */
function answerWith(
  runtime: PlatformRuntime,
  method: 'publish' | 'sendBack',
  error: ServiceError,
): void {
  const real = runtime.withCommandId.bind(runtime);
  vi.spyOn(runtime, 'withCommandId').mockImplementation((commandId) => {
    const ports = real(commandId);
    return {
      ...ports,
      production: { ...ports.production, [method]: async () => ({ ok: false as const, error }) },
    } as typeof ports;
  });
}

describe('CM-03 Publication decision — ready (B6-07 f0)', () => {
  it('the header, the preview, the check, the summary, the history and the open panel', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showDecision(runtime, 'SUB-0074');
    await heading('Transient Cooling');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', '/content-manager/ready');
    expect(text(main().querySelector('.xr-overline'))).toBe('SUB-0074 · First publication');
    expect(chip()).toBe('Ready to publish');
    expect(text(main().querySelector('.xr-phead-meta'))).toContain(
      'Northline Simulation Studio · ME ZG523 · approved by Prof. A. Menon on 14 Aug 2026',
    );
    // The shell: the top bar names the destination; the crumbs the record.
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Ready to publish');
    const crumbs = screen.getByRole('list', { name: 'You are here' });
    expect(text(crumbs)).toMatch(/Ready to publish\s*\/\s*SUB-0074/);
    const preview = main().querySelector('.xp.xg-preview');
    expect(text(preview?.querySelector('.xg-preview-tag') ?? null)).toBe(
      'Preview — not public yet',
    );
    expect(within(preview as HTMLElement).getByRole('heading', { level: 3 })).toHaveTextContent(
      'Transient Cooling',
    );
    expect(checkRows()).toEqual([
      'Approved by the Academic Reviewer Prof. A. Menon · 14 Aug 2026',
      'Learning outcomes 2 outcomes · one set for every format',
      'Catalogue details Name, course, summary, description, version',
      'Delivery details for each format WEB — complete',
    ]);
    expect(text(main().querySelector('dl.xv-kv'))).toContain(
      'From the vendor Northline Simulation Studio · Anil Shetty Submissions Submitted 6 Aug 2026 Academic review Approved by Prof. A. Menon on 14 Aug 2026 Version 1.0',
    );
    expect(
      [...main().querySelectorAll('ol.xr-timeline .xr-tl-what')].map((node) => text(node)),
    ).toEqual(['Approved by Prof. A. Menon', 'Submitted for academic review']);
    // The draft save is the Vendor’s only (not listed).
    expect(text(main().querySelector('ol.xr-timeline'))).not.toMatch(/draft/i);
    expect(within(panel()).getByRole('radio', { name: /^Publish/ })).toBeChecked();
    expect(within(panel()).getByRole('button', { name: 'Publish' })).toBeVisible();
  });
});

describe('CM-03 Publish (DL-1; B6-11 f6, f8; B6-07 f4)', () => {
  it('DL-1 says publishing gives no one access; Publish creates the experiment and changes nothing else', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    showDecision(runtime, 'SUB-0074');
    await heading('Transient Cooling');
    const before = snapshot(sample);

    await user.click(within(panel()).getByRole('button', { name: 'Publish' }));
    const dialog = await screen.findByRole('dialog', { name: 'Publish “Transient Cooling”?' });
    expect(text(dialog.querySelector('.xr-dialog-body'))).toBe(
      'It will appear in the public catalogue under ME ZG523 with WEB. Publishing gives no one access — institutions still need access before their students can open it.',
    );
    // Cancel: nothing is published.
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(snapshot(sample)).toEqual(before);

    await user.click(within(panel()).getByRole('button', { name: 'Publish' }));
    const again = await screen.findByRole('dialog', { name: 'Publish “Transient Cooling”?' });
    await user.click(within(again).getByRole('button', { name: 'Publish' }));

    const decided = await waitFor(() => {
      const found = document.getElementById('cm-cdec');
      expect(found?.querySelector('.xr-status--ok')).toHaveTextContent('Published');
      return found!;
    });
    await waitFor(() => expect(decided).toHaveFocus());
    expect(text(decided)).toContain(
      'In the public catalogue under ME ZG523 with WEB. Publishing gave no one access.',
    );
    expect(text(decided)).toContain('· Kavya Nair');
    expect(within(decided).getByRole('link', { name: 'View in the catalogue' })).toHaveAttribute(
      'href',
      '/experiments/transient-cooling',
    );
    expect(within(decided).getByRole('link', { name: 'Open the Content library' })).toHaveAttribute(
      'href',
      '/content-manager/library',
    );
    expect(chip()).toBe('Published');
    expect(checkRows()[0]).toBe('Approved by the Academic Reviewer Prof. A. Menon · 14 Aug 2026');

    // BC9: the submission and the new experiment are the only records written.
    const after = snapshot(sample);
    const changed = Object.keys(after).filter(
      (key) => JSON.stringify(after[key]) !== JSON.stringify(before[key]),
    );
    expect(changed.sort()).toEqual(
      [...changed].filter((key) => /SUB-0074|transient-cooling/.test(key)).sort(),
    );
    expect(changed.some((key) => key.includes('transient-cooling'))).toBe(true);
    expect(Object.keys(before).filter((key) => !(key in after))).toEqual([]);
    // … and the public catalogue now has it.
    const page = await asPersonId(sample, RITU).catalogue.getExperiment(
      'transient-cooling' as never,
    );
    expect(page.ok).toBe(true);
  });

  it('a stale revision: nothing is published, the panel says so and the record is read again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    answerWith(runtime, 'publish', { kind: 'stale-version', currentRev: 99 });
    showDecision(runtime, 'SUB-0074');
    await heading('Transient Cooling');
    await user.click(within(panel()).getByRole('button', { name: 'Publish' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Publish' }));
    expect(
      await within(panel()).findByText('This submission changed since you opened it'),
    ).toBeVisible();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(chip()).toBe('Ready to publish');
    const record = await asPersonId(sample, KAVYA).production.getPublicationDecision(
      'SUB-0074' as never,
    );
    expect(record.ok && record.value.submission.status.state).toBe('with-content-manager');
  });

  it('a check that fails meanwhile (publication-blocked): the panel says it moved on', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    answerWith(runtime, 'publish', { kind: 'refused', code: 'publication-blocked' } as never);
    showDecision(runtime, 'SUB-0074');
    await heading('Transient Cooling');
    await user.click(within(panel()).getByRole('button', { name: 'Publish' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Publish' }),
    );
    expect(
      await within(panel()).findByText('This submission has moved on. Its current state is shown.'),
    ).toBeVisible();
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 2, name: 'Your decision' })).toHaveFocus(),
    );
  });

  it('failed for now: the confirmation stays open and says nothing was lost', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    showDecision(runtime, 'SUB-0074');
    await heading('Transient Cooling');
    faults(sample).failNext('ProductionService.publish' as never);
    await user.click(within(panel()).getByRole('button', { name: 'Publish' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Publish' }));
    expect(
      await within(dialog).findByText('It wasn’t published. Nothing was lost — try again.'),
    ).toBeVisible();
    expect(chip()).toBe('Ready to publish');
  });
});

describe('CM-03 blockers listed (B6-07 f2; B6-11 f4 — a state sample, OD-B6-03)', () => {
  it('learning outcomes missing: only that check fails, Publish is not offered, Send back is', async () => {
    const world = await fixtureWorld('spine-start');
    const sub = world.records.submissions['SUB-0070'] as Submission;
    const { runtime } = await worldPlatform(KAVYA, {
      ...world,
      records: {
        ...world.records,
        submissions: { ...world.records.submissions, 'SUB-0070': { ...sub, learningOutcomes: [] } },
      },
    });
    showDecision(runtime, 'SUB-0070');
    await heading('Packed Bed Pressure Drop');
    expect(chip()).toBe('Ready to publish · 1 to resolve');
    expect(main().querySelector('.xr-phead-meta .xr-status--err')).not.toBeNull();
    expect(text(main().querySelector('.xg-preview'))).toContain('None yet.');
    expect(checkRows()).toEqual([
      'Approved by the Academic Reviewer Prof. A. Menon · 21 Aug 2026',
      'Learning outcomes None Send it back to the Academic Reviewer to add them.',
      'Catalogue details Name, course, summary, description, version',
      'Delivery details for each format WEB · AR — complete',
    ]);
    const notice = panel().querySelector('.xr-notice--err');
    expect(text(notice)).toBe(
      '1 thing to resolve before it can be published Learning outcomes: none. Send it back to the Academic Reviewer to add them.',
    );
    const publish = within(panel()).getByRole('radio', { name: /^Publish/ });
    expect(publish).toBeDisabled();
    expect(publish.closest('label')).toHaveClass('is-off');
    expect(text(publish.closest('label'))).toBe('Publish Possible once nothing is missing.');
    expect(within(panel()).getByRole('radio', { name: /^Send back/ })).toBeChecked();
    expect(within(panel()).queryByRole('button', { name: 'Publish' })).toBeNull();
    expect(within(panel()).getByRole('button', { name: 'Send back' })).toBeVisible();
  });
});

describe('CM-03 Send back (DL-2; B6-11 f7; OD-B6-05)', () => {
  it('who and why are both required at once; references only toward the vendor; then sent with the reference', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    showDecision(runtime, 'SUB-0070');
    await heading('Packed Bed Pressure Drop');
    await user.click(within(panel()).getByRole('radio', { name: /^Send back/ }));
    await user.click(within(panel()).getByRole('button', { name: 'Send back' }));
    const dialog = await screen.findByRole('dialog', { name: 'Send it back?' });
    expect(text(dialog.querySelector('.xr-dialog-body p'))).toBe(
      'Nothing is published. The person you choose sees your reason.',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Send back' }));
    expect([...dialog.querySelectorAll('.xr-error')].map((node) => text(node))).toEqual([
      'Choose who it goes back to',
      'Add a reason so they know what to change',
    ]);
    await waitFor(() =>
      expect(within(dialog).getByRole('radio', { name: /^Academic Reviewer/ })).toHaveFocus(),
    );
    expect(within(dialog).queryByRole('group', { name: /What it refers to/ })).toBeNull();

    // To the Academic Reviewer: no references.
    await user.click(within(dialog).getByRole('radio', { name: /^Academic Reviewer/ }));
    expect(
      within(dialog).getByRole('textbox', { name: 'Reason the Academic Reviewer will see' }),
    ).toBeVisible();
    expect(within(dialog).queryByRole('group', { name: /What it refers to/ })).toBeNull();
    // To the vendor: references, for the submission’s formats.
    await user.click(within(dialog).getByRole('radio', { name: /^Vendor/ }));
    expect(
      text(
        within(dialog)
          .getByRole('radio', { name: /^Vendor/ })
          .closest('label'),
      ),
    ).toBe('Vendor Meridian Virtual Labs — to revise and resubmit');
    const refs = within(dialog).getByRole('group', { name: /What it refers to/ });
    expect(within(refs).getAllByRole('checkbox')).toHaveLength(8);
    expect(text(refs)).not.toContain('VR');
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Reason the vendor will see' }),
      'Name the supported phones and tablets for the AR build.',
    );
    await user.click(
      within(refs).getByRole('checkbox', { name: 'Formats & delivery · AR · Device need' }),
    );
    expect(dialog.querySelectorAll('.xr-error')).toHaveLength(0);
    await user.click(within(dialog).getByRole('button', { name: 'Send back' }));

    const decided = await waitFor(() => {
      const found = document.getElementById('cm-cdec');
      expect(found?.querySelector('.xr-status--wait')).toHaveTextContent('Sent back to the vendor');
      return found!;
    });
    await waitFor(() => expect(decided).toHaveFocus());
    expect(text(decided)).toContain(
      '· Kavya Nair · “Name the supported phones and tablets for the AR build.”',
    );
    expect(chip()).toBe('With the vendor');
    expect(within(decided).getByRole('link', { name: 'Back to Ready to publish' })).toHaveAttribute(
      'href',
      '/content-manager/ready',
    );
    const record = await asPersonId(sample, RITU).production.getRecord('SUB-0070' as never);
    expect(record.ok && record.value.submission.status).toMatchObject({
      state: 'returned',
      by: 'content-manager',
    });
    expect(record.ok && record.value.lastReturn).toMatchObject({
      reason: 'Name the supported phones and tablets for the AR build.',
      references: [{ step: 'formats-and-delivery', format: 'ar', field: 'device-need' }],
    });
  });

  it('a stale revision keeps the choice and the reason typed, and says the record changed', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    answerWith(runtime, 'sendBack', { kind: 'stale-version', currentRev: 99 });
    showDecision(runtime, 'SUB-0074');
    await heading('Transient Cooling');
    await user.click(within(panel()).getByRole('radio', { name: /^Send back/ }));
    await user.click(within(panel()).getByRole('button', { name: 'Send back' }));
    const dialog = await screen.findByRole('dialog', { name: 'Send it back?' });
    await user.click(within(dialog).getByRole('radio', { name: /^Academic Reviewer/ }));
    const reason = within(dialog).getByRole('textbox', {
      name: 'Reason the Academic Reviewer will see',
    });
    await user.type(reason, 'Please re-check the second outcome.');
    await user.click(within(dialog).getByRole('button', { name: 'Send back' }));
    expect(
      await within(dialog).findByText('This submission changed since you opened it'),
    ).toBeVisible();
    expect(within(dialog).getByRole('radio', { name: /^Academic Reviewer/ })).toBeChecked();
    expect(reason).toHaveValue('Please re-check the second outcome.');
    expect(chip()).toBe('Ready to publish');
  });

  it('the service’s own validation words show on the fields', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    answerWith(runtime, 'sendBack', {
      kind: 'validation-failed',
      summaryTitle: null,
      fieldErrors: [
        {
          field: 'reason',
          key: 'CM-03.reason.required',
          message: 'Add a reason so they know what to change',
          params: {},
        },
      ],
    } as ServiceError);
    showDecision(runtime, 'SUB-0074');
    await heading('Transient Cooling');
    await user.click(within(panel()).getByRole('radio', { name: /^Send back/ }));
    await user.click(within(panel()).getByRole('button', { name: 'Send back' }));
    const dialog = await screen.findByRole('dialog', { name: 'Send it back?' });
    await user.click(within(dialog).getByRole('radio', { name: /^Vendor/ }));
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Reason the vendor will see' }),
      'x',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Send back' }));
    expect(
      await within(dialog).findByText('Add a reason so they know what to change'),
    ).toBeVisible();
  });
});

describe('CM-03 read-only (B6-07 f3; B6-11 f5) and not found', () => {
  it('still in academic review: the notice, “Not approved yet” without a fix line, nothing to decide', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showDecision(runtime, 'SUB-0086');
    await heading('Flash Distillation');
    expect(chip()).toBe('Still in academic review');
    expect(text(main().querySelector('.xr-decide .xr-notice'))).toBe(
      'Still in academic review The Academic Reviewer hasn’t decided yet. It appears in Ready to publish once it is approved — read-only until then.',
    );
    expect(checkRows().slice(0, 2)).toEqual([
      'Approved by the Academic Reviewer Not approved yet',
      'Learning outcomes None',
    ]);
    expect(text(panel())).toBe('Your decision Nothing to decide yet.');
    expect(within(panel()).queryByRole('button')).toBeNull();
  });

  it('returned to the vendor by the Academic Reviewer: “With the vendor”, read-only', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showDecision(runtime, 'SUB-0081');
    await heading('Forced Convection');
    expect(chip()).toBe('With the vendor');
    expect(main().querySelector('.xr-phead-meta .xr-status--off')).not.toBeNull();
    expect(text(main().querySelector('.xr-decide .xr-notice'))).toBe(
      'With the vendor It was returned with a reason. It comes back to the Academic Reviewer when the vendor resubmits.',
    );
    expect(text(main().querySelector('ol.xr-timeline .xr-tl-what'))).toBe(
      'Returned to vendor by Prof. A. Menon',
    );
    expect(text(panel())).toBe('Your decision Nothing to decide yet.');
  });

  it('a re-check she asked for: “Sent back to the Academic Reviewer” with her reason, read-only', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showDecision(runtime, 'SUB-0071');
    await heading('Venturi Meter Calibration');
    // B6-07 script `cmChipWords`: a re-check reads "Back with the Academic Reviewer".
    expect(chip()).toBe('Back with the Academic Reviewer');
    expect(main().querySelector('.xr-decide .xr-notice')).toBeNull();
    const decided = document.getElementById('cm-cdec')!;
    expect(text(decided.querySelector('.xr-status--wait'))).toBe(
      'Sent back to the Academic Reviewer',
    );
    expect(text(decided)).toContain(
      '25 Aug 2026, 10:00 · Kavya Nair · “The second learning outcome mentions a Pitot tube',
    );
    expect(within(panel()).queryByRole('button')).toBeNull();
  });

  it('a draft is the Vendor’s only: not found', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showDecision(runtime, 'SUB-0079');
    expect(
      await screen.findByRole('heading', { level: 1, name: /can’t find/i }, { timeout: 5000 }),
    ).toBeVisible();
  });

  it('decisionFacts: the panel kinds of the spine-start records', async () => {
    const { sample } = await tabPlatform(KAVYA, 'spine-start');
    const kinds: Record<string, string> = {};
    for (const id of ['SUB-0074', 'SUB-0070', 'SUB-0086', 'SUB-0071', 'SUB-0081', 'SUB-0052']) {
      const answer = await asPersonId(sample, KAVYA).production.getPublicationDecision(id as never);
      if (answer.ok) kinds[id] = decisionFacts(answer.value).kind;
    }
    expect(kinds).toEqual({
      'SUB-0074': 'open',
      'SUB-0070': 'open',
      'SUB-0086': 'read-only',
      'SUB-0071': 'sent',
      'SUB-0081': 'read-only',
      'SUB-0052': 'published',
    });
  });
});

describe('CM-05 Published experiment (B6-08)', () => {
  it('live and read-only; the correction entry is the only action (Phase 6)', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showPublished(runtime, 'distillation-column');
    await heading('Distillation Column');
    expect(text(main().querySelector('.xr-overline'))).toBe('CHE ZG513 · Published · version 1.2');
    expect(text(main().querySelector('.xr-phead-meta'))).toBe(
      'Published Live since 3 Jul 2026 · Meridian Virtual Labs',
    );
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Content library');
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', '/content-manager/library');
    // Phase 6: the correction entry (`cm-correction.test.tsx`) — nothing on the page edits it.
    expect(
      within(main())
        .queryAllByRole('button')
        .map((button) => text(button)),
    ).toEqual(['Start a correction', 'Edit catalogue details', 'Edit delivery link']);
    expect(main().querySelectorAll('input, textarea, select')).toHaveLength(0);
    expect(main().querySelector('.xr-notice--warn')).toBeNull();
    const history = screen.getByRole('region', { name: 'History' });
    expect([...history.querySelectorAll('.xr-tl-what')].map((node) => text(node))).toEqual([
      'Version 1.2 released',
      'Version 1.1 released',
      'Published · version 1.0',
    ]);
    const delivery = screen.getByRole('region', { name: 'Delivery' });
    expect(text(delivery)).toContain('Package reference MVL-DC-VR-1.2');
  });

  it('an update in progress: the notice names it and its state; the history leads with it', async () => {
    const { runtime, sample } = await tabPlatform(KAVYA, 'spine-start');
    const opened = await asPersonId(sample, KAVYA).corrections.openCorrection({
      experimentId: 'distillation-column' as never,
      entry: 'start-a-correction',
    });
    expect(opened.ok).toBe(true);
    showPublished(runtime, 'distillation-column');
    await heading('Distillation Column');
    const notice = main().querySelector('.xr-notice--warn');
    expect(text(notice)).toBe(
      'An update is in progress — UPD-0005 · Draft Edits to this experiment join that update. Open it to continue.',
    );
    // Phase 6: the edit entries join it (`cm-correction.test.tsx`).
    expect(
      within(main())
        .queryAllByRole('button')
        .map((button) => text(button)),
    ).toEqual(['Edit catalogue details', 'Edit delivery link']);
    const history = screen.getByRole('region', { name: 'History' });
    expect(text(history.querySelector('.xr-tl'))).toMatch(
      /^UPD-0005 started — draft .* Version not set\. The live version below is unchanged\.$/,
    );
  });

  it('on hold and returned (UPD-0004, UPD-0006); a blank package value reads “—”', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showPublished(runtime, 'boiler-drum-level');
    await heading('Boiler Drum Level');
    expect(text(main().querySelector('.xr-notice--warn'))).toBe(
      'An update is in progress — UPD-0004 · On hold The Super Admin put it on hold. Version 2.0 stays live. Open update',
    );
    expect(text(main().querySelector('.xr-phead-meta'))).toBe('Published Live since 18 Jun 2026');
    expect(text(screen.getByRole('region', { name: 'Delivery' }))).toContain('Package —');
  });

  it('an unknown experiment is not found', async () => {
    const { runtime } = await tabPlatform(KAVYA, 'spine-start');
    showPublished(runtime, 'no-such-experiment');
    expect(
      await screen.findByRole('heading', { level: 1, name: /can’t find/i }, { timeout: 5000 }),
    ).toBeVisible();
  });
});

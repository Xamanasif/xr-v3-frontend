/**
 * RV-03 Review a submission and RV-06 its decided state (boards B6-03 f0 … f5, B6-11 f0 … f3,
 * B6-12 f1) on the real composition root and the sample world, as Prof. A. Menon. spine-start
 * draws three of them as they are: SUB-0086 Flash Distillation (no learning outcomes yet, f2),
 * SUB-0071 Venturi Meter Calibration (back from the Content Manager for a re-check, f3) and
 * SUB-0074 Transient Cooling (approved, with the Content Manager — RV-06, f4). f0’s resubmission
 * is prepared through the ports (set-up only): Anil Shetty submits “Conduction Through a Composite
 * Wall” (SUB-0077), Prof. Menon returns it, Anil changes the VR device need and resubmits; the
 * routing stand-in sends it back as revision 2. Everything the page does — the outcome editor,
 * Approve through DL-1, Return to vendor through DL-2 with its reason and references — is done by
 * clicks and typing; the refusals (stale, decided elsewhere, failed for now) are answered by a
 * port stand-in.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ServiceError } from '@xr/contracts/draft';
import type { IsoInstant } from '@xr/domain';
import { asPersonId, faults, standinsOf } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { PlatformRuntime } from '@/platform/runtime';
import {
  renderInTab,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { forgetReviewDrafts } from './rv-03-review/review-draft';
import { ReviewSubmission } from './rv-03-review/review-submission';

// Whole decisions by clicks and typing on the real world: longer than the default 5 s.
vi.setConfig({ testTimeout: 30_000 });

afterEach(() => {
  forgetLastAddress();
  forgetReviewDrafts();
  vi.restoreAllMocks();
});

const MENON = 'per-a-menon';
const ANIL = 'per-anil-shetty';
const RITU = 'per-ritu-sharma';
const THERMO = 'thermodynamics-heat-transfer';
const COMPOSITE = 'Conduction Through a Composite Wall';
const RETURN_REASON = 'Please clarify the VR device requirements.';
const NEW_DEVICE =
  'Standalone VR headset — no PC or cable needed — and about 2 × 2 m of clear floor';
const RECHECK_REASON =
  'The second learning outcome mentions a Pitot tube, which this experiment does not use. Please check the outcomes.';
const FLASH_OUTCOME = 'Find the vapour fraction of a feed flashed at a set drum pressure.';

/** The set-up’s sample times, in Indian time. */
const SUBMITTED = '2026-08-12T05:22:00.000Z'; // 12 Aug 2026, 10:52
const RETURNED = '2026-08-19T10:35:00.000Z'; // 19 Aug 2026, 16:05
const RESUBMITTED = '2026-08-26T06:00:00.000Z'; // 26 Aug 2026, 11:30

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

function moveClock(sample: Sample, instant: string) {
  standinsOf(sample).clock.setSampleNow(instant as IsoInstant);
}

/** SUB-0077 as Anil Shetty sends it (B5-03 … B5-05). */
function compositeWall(vrDevice: string) {
  return {
    courseId: THERMO,
    name: COMPOSITE,
    summary:
      'Measure the temperature profile across a three-layer wall and compare it with the series-resistance model.',
    description:
      'Learners build a wall from three layers — brick, insulation and plaster — and compare the measured profile with the series thermal-resistance model.',
    version: '1.0',
    formats: ['web', 'vr'],
    delivery: {
      web: {
        format: 'web',
        webLink: 'https://labs.northline.example/composite-wall',
        browserAndComputer:
          'A current Chrome, Edge, Firefox or Safari on a laptop or desktop, with a keyboard and mouse',
        notes: null,
      },
      vr: {
        format: 'vr',
        packageLabel: 'Composite Wall — VR build 1.0',
        packageReference: 'NSS-CW-VR-1.0',
        packageFileName: null,
        deviceNeeded: vrDevice,
        installNotes: 'Install it from the lab’s device manager.',
        notes: null,
      },
    },
    preview: { label: 'Two-minute walkthrough', link: 'https://labs.northline.example/cw-tour' },
    documents: [{ fileName: 'Lab handout — Composite Wall.pdf' }],
  } as never;
}

/** f0’s world: SUB-0077 submitted, returned with a reason, revised and resubmitted (revision 2). */
async function resubmitted() {
  const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
  const vendor = asPersonId(sample, ANIL);
  const reviewer = asPersonId(sample, MENON);
  moveClock(sample, SUBMITTED);
  const draft = ok(
    await vendor.production.saveDraft({
      id: null,
      content: compositeWall('VR headset'),
      step: 'course',
      expectedRev: null,
    } as never),
  );
  ok(
    await vendor.production.submitForReview({
      id: draft.id,
      content: compositeWall('VR headset'),
      expectedRev: draft.rev,
    } as never),
  );
  moveClock(sample, RETURNED);
  const view = ok(await reviewer.production.getSubmissionForReview(draft.id));
  ok(
    await reviewer.production.returnSubmission({
      id: draft.id,
      reason: RETURN_REASON,
      references: [{ step: 'formats-and-delivery', format: 'vr', field: 'device-need' }],
      outcomes: [],
      expectedRev: view.submission.rev,
    } as never),
  );
  moveClock(sample, RESUBMITTED);
  const record = ok(await vendor.production.getRecord(draft.id));
  const saved = ok(
    await vendor.production.saveRevision({
      id: draft.id,
      content: compositeWall(NEW_DEVICE),
      expectedRev: record.submission.rev,
    } as never),
  );
  ok(
    await vendor.production.resubmit({
      id: draft.id,
      content: compositeWall(NEW_DEVICE),
      expectedRev: saved.rev,
    } as never),
  );
  return { runtime, sample, id: draft.id as string };
}

function inShell(ui: ReactNode) {
  return (
    <WorkspaceLayout workspace="reviewer">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{ui}</TestNotFoundBoundary>
    </WorkspaceLayout>
  );
}

function show(runtime: PlatformRuntime, id: string) {
  const navigation = testNavigation(`/reviewer/submissions/${id}`);
  const view = renderInTab(inShell(<ReviewSubmission submissionId={id} />), {
    runtime,
    navigation,
  });
  return { navigation, view };
}

const main = () => screen.getByRole('main');
const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
const heading = (name: string) =>
  screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });
const panel = () => screen.getByRole('complementary', { name: 'Your decision' });
const outcomes = () => screen.queryByRole('list', { name: 'Learning outcomes' });
const outcomeTexts = () =>
  [...(outcomes()?.querySelectorAll('.xg-lo-t') ?? [])].map((element) => text(element));
const addField = () => screen.getByRole('textbox', { name: /^Add a learning outcome/ });
const region = (name: string) => screen.getByRole('region', { name });

/** A port command answered by a stand-in for the first `times` calls, then by the real port. */
function answerWith(
  runtime: PlatformRuntime,
  method: 'approveSubmission' | 'returnSubmission',
  error: ServiceError,
  times = 1,
): void {
  const real = runtime.withCommandId.bind(runtime);
  let left = times;
  vi.spyOn(runtime, 'withCommandId').mockImplementation((commandId) => {
    const ports = real(commandId);
    if (left <= 0) return ports;
    return {
      ...ports,
      production: {
        ...ports.production,
        [method]: async () => {
          left -= 1;
          return { ok: false as const, error };
        },
      },
    } as typeof ports;
  });
}

describe('RV-03 — not ready: no learning outcomes yet (B6-03 f2; B6-11 f2)', () => {
  it('the header, the sections and the panel as drawn', async () => {
    const { runtime } = await tabPlatform(MENON, 'spine-start');
    show(runtime, 'SUB-0086');
    await heading('Flash Distillation');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(text(main().querySelector('a.xr-back'))).toBe('Review queue');
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', '/reviewer/queue');
    expect(text(main().querySelector('.xr-overline'))).toBe('SUB-0086 · New submission');
    const meta = main().querySelector('.xr-phead-meta')!;
    expect(meta.querySelector('.xr-status')).toHaveClass('xr-status--info');
    expect(text(meta)).toBe(
      'Waiting · revision 1Meridian Virtual Labs · CHE ZG513 · Process Instrumentation & Control',
    );
    expect(main().querySelector('a.xr-jump')).toHaveAttribute('href', '#rv-decision');
    // The shell: Review queue current, the crumbs “Review queue / SUB-0086”.
    const current = screen
      .getByRole('navigation', { name: 'Academic Reviewer navigation' })
      .querySelector('[aria-current="page"]');
    expect(current).toHaveAttribute('href', '/reviewer/queue');
    expect(text(screen.getByRole('list', { name: 'You are here' }))).toBe('Review queue/SUB-0086');

    const lo = region('Learning outcomes');
    expect(text(lo.querySelector('.xr-section-head .xr-meta'))).toBe(
      'One set for the Experiment · every format',
    );
    expect(lo).toHaveTextContent(
      'You set these. The vendor and the Content Manager see the set you approve or return.',
    );
    const warn = lo.querySelector('.xr-notice--warn')!;
    expect(text(warn)).toBe(
      'No learning outcomes yetAdd at least one before you approve. One set for the Experiment, whichever format a learner uses.',
    );
    expect(outcomes()).toBeNull();
    expect(addField()).toHaveAccessibleDescription(
      'What a learner can do after the experiment. Start with a verb.',
    );

    const details = region('Submission details');
    expect(
      [...details.querySelectorAll('dl.xl-kv dt')].map((dt) => [
        text(dt),
        text(dt.nextElementSibling),
      ]),
    ).toEqual([
      ['Course', 'CHE ZG513 · Process Instrumentation & Control'],
      [
        'Summary',
        'Flash a hot binary feed across a valve into a drum and find the vapour fraction from your own readings.',
      ],
      [
        'Description',
        'Learners set the feed temperature and the drum pressure, read the vapour and liquid flows, and compare the vapour fraction with an equilibrium calculation.',
      ],
      ['Version', '1.0'],
      ['Formats', 'WEB'],
      ['Preview', 'None'],
      ['Documents', 'Flash drum handout.pdf'],
    ]);
    const delivery = region('Formats and delivery');
    expect(text(delivery.querySelector('.xr-section-head .xr-meta'))).toBe('Read-only');
    const web = within(delivery).getByRole('link', {
      name: /^Open web link ?\(opens in a new tab\)$/,
    });
    expect(web).toHaveAttribute('href', 'https://labs.meridian.example/flash-distillation');
    expect(web).toHaveAttribute('target', '_blank');
    expect(web).toHaveAttribute('rel', 'noopener noreferrer');
    // T-30: delivery details and web links only — the id is not shown (P1-14).
    expect(text(delivery.querySelector('.xl-open'))).toBe(
      'You see delivery details and web links only. Who tests on a real device is still open.',
    );
    expect(main().textContent).not.toMatch(/\bT-\d{2}\b/);
    const history = region('Review history');
    expect([...history.querySelectorAll('li.xr-tl')].map((li) => text(li))).toEqual([
      'Submitted for academic review24 Aug 2026, 10:00Revision 1 · from Meridian Virtual Labs',
    ]);

    expect(panel()).toHaveClass('xr-dpanel', 'xg-static');
    const choices = within(panel()).getAllByRole('radio');
    expect(choices.map((radio) => (radio as HTMLInputElement).checked)).toEqual([true, false]);
    expect(within(panel()).getByRole('group', { name: 'Decision' })).toBeInTheDocument();
    expect(panel()).toHaveTextContent(
      'You decide for the whole Experiment — every format together.',
    );
    expect(within(panel()).getByRole('button', { name: 'Approve' })).toHaveClass(
      'xr-btn--primary',
      'xr-btn--block',
    );
  });

  it('Approve with no outcome says why it can’t go yet, and opens nothing (B6-11 f2)', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(MENON, 'spine-start');
    show(runtime, 'SUB-0086');
    await heading('Flash Distillation');
    await user.click(within(panel()).getByRole('button', { name: 'Approve' }));
    const error = await within(panel()).findByRole('alert');
    expect(text(error)).toBe('Add at least one learning outcome before you approve');
    await waitFor(() => expect(error).toHaveFocus());
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('adds an outcome (blank first: “Enter the outcome text”), approves through DL-1 → RV-06', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
    show(runtime, 'SUB-0086');
    await heading('Flash Distillation');
    await user.click(screen.getByRole('button', { name: 'Add outcome' }));
    expect(text(region('Learning outcomes').querySelector('.xr-error'))).toBe(
      'Enter the outcome text',
    );
    await waitFor(() => expect(addField()).toHaveFocus());
    await user.type(addField(), `  ${FLASH_OUTCOME}  `);
    await user.click(screen.getByRole('button', { name: 'Add outcome' }));
    expect(outcomeTexts()).toEqual([FLASH_OUTCOME]);
    expect(addField()).toHaveValue('');
    expect(text(document.getElementById('rv-lo-msg'))).toBe(
      'Outcome added — 1 outcome in the list.',
    );
    expect(region('Learning outcomes').querySelector('.xr-notice--warn')).toBeNull();

    await user.click(within(panel()).getByRole('button', { name: 'Approve' }));
    const dialog = await screen.findByRole('dialog', { name: 'Approve “Flash Distillation”?' });
    expect(text(dialog.querySelector('.xr-dialog-body'))).toBe(
      'It goes to the Content Manager with its 1 learning outcome. Approving does not publish it.',
    );
    expect(dialog.querySelector('.xr-dialog-body strong')).not.toBeNull();
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Approve' })).toHaveFocus(),
    );
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }));

    const decided = await screen.findByText('Approved — with the Content Manager', {
      selector: '.xr-dpanel .xr-status',
    });
    const done = decided.closest('#rv-dec')!;
    await waitFor(() => expect(done).toHaveFocus());
    expect(done).toHaveTextContent(
      'The Content Manager decides whether to publish it. Nothing is published yet.',
    );
    expect(text(done.querySelector('p.xr-small'))).toMatch(
      /^\d{1,2} \w{3} 2026, \d\d:\d\d · Prof\. A\. Menon$/,
    );
    expect(
      within(done as HTMLElement).getByRole('link', { name: 'Back to the review queue' }),
    ).toHaveAttribute('href', '/reviewer/queue');
    expect(text(main().querySelector('.xr-phead-meta .xr-status'))).toBe(
      'Approved — with the Content Manager',
    );
    // RV-06: the set read-only, nothing to edit.
    expect([...region('Learning outcomes').querySelectorAll('ul.xv-los li')].map(text)).toEqual([
      FLASH_OUTCOME,
    ]);
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
    // One world: with the Content Manager, the set travelled with it — and nothing is published.
    const reviewer = asPersonId(sample, MENON);
    const after = ok(await reviewer.production.getSubmissionForReview('SUB-0086' as never));
    expect(after.submission.status.state).toBe('with-content-manager');
    expect(after.submission.learningOutcomes.map((outcome) => outcome.text)).toEqual([
      FLASH_OUTCOME,
    ]);
    const published = ok(
      await asPersonId(sample, MENON).catalogue.searchCatalogue({
        text: 'Flash Distillation',
        sort: 'default',
      }),
    );
    expect(published.entries).toEqual([]);
  });
});

describe('RV-03 — the outcomes editor (B6-03 f3: back for a re-check)', () => {
  it('the Content Manager’s reason first; move, edit (blank: “…, or cancel”), delete and undo', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(MENON, 'spine-start');
    show(runtime, 'SUB-0071');
    await heading('Venturi Meter Calibration');
    expect(text(main().querySelector('.xr-overline'))).toBe('SUB-0071 · Re-check');
    expect(main().querySelector('.xr-phead-meta .xr-status')).toHaveClass('xr-status--wait');
    expect(text(main().querySelector('.xr-phead-meta .xr-status'))).toBe('Back for a re-check');
    const stack = main().querySelector('.xr-decide > .xr-stack')!;
    const first = stack.firstElementChild!;
    expect(first).toHaveClass('xv-reason');
    expect(text(first.querySelector('h2'))).toBe('Sent back by the Content Manager for a re-check');
    expect(text(first.querySelector('.xr-meta'))).toBe('25 Aug 2026, 10:00 · Kavya Nair');
    expect(text(first.querySelector('blockquote.xv-quote'))).toBe(RECHECK_REASON);
    expect(first).toHaveTextContent('Check it again and approve, or return it to the vendor.');
    expect(outcomeTexts()).toEqual([
      'Calibrate a Venturi meter against a weigh tank.',
      'Compare the discharge coefficient with a Pitot tube reading.',
      'Explain where the pressure is recovered downstream of the throat.',
    ]);
    const up1 = screen.getByRole('button', { name: 'Move outcome 1 up' });
    expect(up1).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: 'Move outcome 3 down' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await user.click(up1);
    expect(outcomeTexts()[0]).toBe('Calibrate a Venturi meter against a weigh tank.');

    // Move outcome 3 up: it is now outcome 2, and focus stays with its Move up.
    await user.click(screen.getByRole('button', { name: 'Move outcome 3 up' }));
    expect(outcomeTexts()[1]).toBe(
      'Explain where the pressure is recovered downstream of the throat.',
    );
    expect(text(document.getElementById('rv-lo-msg'))).toBe(
      'Outcome 3 moved up — it is now outcome 2.',
    );
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Move outcome 2 up' })).toHaveFocus(),
    );

    // Edit outcome 3 (the Pitot tube): cleared, Save → the editor’s own words.
    await user.click(screen.getByRole('button', { name: 'Edit outcome 3' }));
    const field = screen.getByRole('textbox', { name: 'Outcome 3' });
    await waitFor(() => expect(field).toHaveFocus());
    expect(field).toHaveValue('Compare the discharge coefficient with a Pitot tube reading.');
    // While it is edited, deciding asks to save or cancel it first.
    await user.click(within(panel()).getByRole('button', { name: 'Approve' }));
    expect(text(within(panel()).getByRole('alert'))).toBe(
      'Save or cancel the outcome you are editing first',
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.clear(field);
    await user.click(screen.getByRole('button', { name: 'Save outcome' }));
    expect(text(field.parentElement!.querySelector('.xr-error'))).toBe(
      'Enter the outcome text, or cancel',
    );
    expect(field).toHaveAttribute('aria-invalid', 'true');
    await user.type(field, 'Compare the discharge coefficient with the weigh-tank reading.');
    await user.click(screen.getByRole('button', { name: 'Save outcome' }));
    expect(outcomeTexts()[2]).toBe(
      'Compare the discharge coefficient with the weigh-tank reading.',
    );
    expect(text(document.getElementById('rv-lo-msg'))).toBe('Outcome 3 saved.');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Edit outcome 3' })).toHaveFocus(),
    );

    // Delete outcome 1 → “Outcome 1 deleted.” with Undo; Undo puts it back where it was.
    await user.click(screen.getByRole('button', { name: 'Delete outcome 1' }));
    expect(outcomeTexts()).toHaveLength(2);
    expect(text(document.getElementById('rv-lo-msg'))).toBe('Outcome 1 deleted.Undo');
    await waitFor(() => expect(document.getElementById('rv-lo-msg')).toHaveFocus());
    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(outcomeTexts()[0]).toBe('Calibrate a Venturi meter against a weigh tank.');
    expect(text(document.getElementById('rv-lo-msg'))).toBe('Outcome 1 restored.');
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();

    // Cancel an edit: nothing changes.
    await user.click(screen.getByRole('button', { name: 'Edit outcome 2' }));
    await user.type(screen.getByRole('textbox', { name: 'Outcome 2' }), ' (draft)');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(outcomeTexts()[1]).toBe(
      'Explain where the pressure is recovered downstream of the throat.',
    );
  });

  it('the set is kept while the reviewer moves around the app, and sent with Approve', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
    const first = show(runtime, 'SUB-0071');
    await heading('Venturi Meter Calibration');
    await user.click(screen.getByRole('button', { name: 'Delete outcome 2' }));
    await user.type(addField(), 'Plot the discharge coefficient against the Reynolds number.');
    first.view.unmount();

    show(runtime, 'SUB-0071');
    await heading('Venturi Meter Calibration');
    expect(outcomeTexts()).toEqual([
      'Calibrate a Venturi meter against a weigh tank.',
      'Explain where the pressure is recovered downstream of the throat.',
    ]);
    expect(addField()).toHaveValue('Plot the discharge coefficient against the Reynolds number.');
    await user.click(screen.getByRole('button', { name: 'Add outcome' }));
    await user.click(within(panel()).getByRole('button', { name: 'Approve' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Approve “Venturi Meter Calibration”?',
    });
    expect(dialog).toHaveTextContent('with its 3 learning outcomes');
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }));
    await screen.findByText('Approved — with the Content Manager', {
      selector: '.xr-dpanel .xr-status',
    });
    const after = ok(
      await asPersonId(sample, MENON).production.getSubmissionForReview('SUB-0071' as never),
    );
    expect(after.submission.learningOutcomes.map((outcome) => outcome.text)).toEqual([
      'Calibrate a Venturi meter against a weigh tank.',
      'Explain where the pressure is recovered downstream of the throat.',
      'Plot the discharge coefficient against the Reynolds number.',
    ]);
  });
});

describe('RV-03 — Return to vendor (B6-11 f1)', () => {
  it('a reason is required; the references are the submission’s; the vendor sees both', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
    show(runtime, 'SUB-0086');
    await heading('Flash Distillation');
    await user.click(within(panel()).getByRole('radio', { name: /^Return to vendor/ }));
    const go = within(panel()).getByRole('button', { name: 'Return to vendor' });
    await user.click(go);
    const dialog = await screen.findByRole('dialog', { name: 'Return to vendor?' });
    expect(dialog).toHaveAccessibleDescription(
      'The vendor sees your reason and can revise and resubmit.',
    );
    const reason = within(dialog).getByRole('textbox', { name: 'Reason the vendor will see' });
    await waitFor(() => expect(reason).toHaveFocus());
    const refs = within(dialog).getByRole('group', { name: 'What it refers to (optional)' });
    expect(refs).toHaveAccessibleDescription(
      'The vendor sees these as links to the fields, above their editor.',
    );
    expect(
      within(refs)
        .getAllByRole('checkbox')
        .map((box) => text(box.closest('label'))),
    ).toEqual([
      'Course & description · Summary',
      'Course & description · Description',
      'Formats & delivery · WEB · Web link',
      'Formats & delivery · WEB · Browser and computer',
      'Preview & documents · Preview link',
    ]);
    // Return with no reason: the error on the field, which takes focus; nothing is sent.
    await user.click(within(dialog).getByRole('button', { name: 'Return to vendor' }));
    expect(text(dialog.querySelector('.xr-error'))).toBe(
      'Add a reason so the vendor knows what to change',
    );
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(reason).toHaveFocus());
    await user.type(reason, 'Add the drum pressure range to the description.');
    expect(dialog.querySelector('.xr-error')).toBeNull();
    await user.click(
      within(refs).getByRole('checkbox', { name: 'Course & description · Description' }),
    );
    await user.click(within(dialog).getByRole('button', { name: 'Return to vendor' }));

    const decided = await screen.findByText('Returned to vendor', {
      selector: '.xr-dpanel .xr-status',
    });
    expect(decided).toHaveClass('xr-status--err');
    const done = decided.closest('#rv-dec')!;
    expect(done).toHaveTextContent('“Add the drum pressure range to the description.”');
    expect(done).toHaveTextContent('The vendor sees your reason and can revise and resubmit.');
    await waitFor(() => expect(done).toHaveFocus());
    const history = region('Review history');
    expect(text(history.querySelector('li.xr-tl'))).toMatch(
      /^Returned to vendor by Prof\. A\. Menon.*“Add the drum pressure range to the description\.”$/,
    );
    // The vendor (Ritu Sharma, Meridian) sees the reason and the reference above the editor.
    const record = ok(await asPersonId(sample, RITU).production.getRecord('SUB-0086' as never));
    expect(record.lastReturn).toMatchObject({
      decision: 'return-to-vendor',
      reason: 'Add the drum pressure range to the description.',
      references: [{ step: 'course-and-description', format: null, field: 'description' }],
    });
  });

  it('Cancel closes DL-2 and returns nothing; the reason starts empty next time', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
    show(runtime, 'SUB-0086');
    await heading('Flash Distillation');
    await user.click(within(panel()).getByRole('radio', { name: /^Return to vendor/ }));
    await user.click(within(panel()).getByRole('button', { name: 'Return to vendor' }));
    const dialog = await screen.findByRole('dialog', { name: 'Return to vendor?' });
    await user.type(within(dialog).getByRole('textbox'), 'Not this time.');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() =>
      expect(within(panel()).getByRole('button', { name: 'Return to vendor' })).toHaveFocus(),
    );
    await user.click(within(panel()).getByRole('button', { name: 'Return to vendor' }));
    expect(
      within(await screen.findByRole('dialog', { name: 'Return to vendor?' })).getByRole(
        'textbox',
        {
          name: 'Reason the vendor will see',
        },
      ),
    ).toHaveValue('');
    const view = ok(
      await asPersonId(sample, MENON).production.getSubmissionForReview('SUB-0086' as never),
    );
    expect(view.submission.status.state).toBe('with-academic-reviewer');
  });
});

describe('RV-03 — resubmitted · revision 2 (B6-03 f0, f1, f5; B6-11 f0; B6-12 f1)', () => {
  it('what changed first, with the previous return; the delivery card marks the change', async () => {
    const user = userEvent.setup();
    const { runtime, id } = await resubmitted();
    expect(id).toBe('SUB-0077');
    show(runtime, id);
    await heading(COMPOSITE);
    expect(text(main().querySelector('.xr-phead-meta'))).toBe(
      'Resubmitted · revision 2Northline Simulation Studio · ME ZG523 · Thermodynamics & Heat Transfer',
    );
    const stack = main().querySelector('.xr-decide > .xr-stack')!;
    const changed = stack.firstElementChild!;
    expect(changed).toHaveClass('xr-section', 'xg-changed');
    expect(text(changed.querySelector('h2'))).toBe('What changed in revision 2');
    expect(text(changed.querySelector('.xr-section-head .xr-meta'))).toBe(
      'Only what the vendor changed',
    );
    expect(text(changed.querySelector('p.xl-meta'))).toBe(
      `You returned revision 1 on 19 Aug: “${RETURN_REASON}”`,
    );
    expect([...changed.querySelectorAll('li.xg-chg-row')].map(text)).toEqual([
      `Formats & delivery · VR · Device needWasVR headsetNow${NEW_DEVICE}`,
    ]);
    const delivery = region('Formats and delivery');
    const vr = [...delivery.querySelectorAll('.xv-deliv')][1]!;
    expect(text(vr.querySelector('.xv-deliv-head'))).toBe('VRApp package (provisional)');
    expect(text(vr.querySelector('.xw-tag--warn'))).toBe('Changed');
    const toggle = within(vr as HTMLElement).getByRole('button', { name: 'View package details' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveTextContent('Hide package details');
    const more = document.getElementById(toggle.getAttribute('aria-controls')!)!;
    expect(
      [...more.querySelectorAll('dt')].map((dt) => [text(dt), text(dt.nextElementSibling)]),
    ).toEqual([
      ['Package reference', 'NSS-CW-VR-1.0'],
      ['Install notes', 'Install it from the lab’s device manager.'],
    ]);
    const history = region('Review history');
    expect([...history.querySelectorAll('li.xr-tl')].map(text)).toEqual([
      'Resubmitted · revision 226 Aug 2026, 11:30Northline Simulation Studio changed the VR device need.',
      `Returned to vendor by Prof. A. Menon19 Aug 2026, 16:05“${RETURN_REASON}”`,
      'Submitted for academic review12 Aug 2026, 10:52Revision 1 · from Northline Simulation Studio',
    ]);
    // The return kept no outcomes: none yet, so Approve needs one first.
    expect(outcomes()).toBeNull();
  });
});

describe('RV-06 — decided · read-only (B6-03 f4)', () => {
  it('the outcomes read-only and the panel: status, when and by whom, where it is now', async () => {
    const { runtime } = await tabPlatform(MENON, 'spine-start');
    show(runtime, 'SUB-0074');
    await heading('Transient Cooling');
    expect(text(main().querySelector('.xr-overline'))).toBe('SUB-0074 · New submission');
    expect(main().querySelector('.xr-phead-meta .xr-status')).toHaveClass('xr-status--ok');
    expect([...region('Learning outcomes').querySelectorAll('ul.xv-los li')].map(text)).toEqual([
      'Decide when the lumped-capacitance model applies, using the Biot number.',
      'Estimate a heat transfer coefficient from a measured cooling curve.',
    ]);
    expect(region('Learning outcomes')).not.toHaveTextContent('You set these.');
    const done = panel().querySelector('#rv-dec')!;
    expect(text(done)).toBe(
      'Approved — with the Content Manager14 Aug 2026, 15:10 · Prof. A. MenonThe Content Manager decides whether to publish it. Nothing is published yet.Back to the review queue',
    );
    expect(done.querySelector('.xr-status')).toHaveClass('xr-status--ok', 'self-stretch');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull();
    expect([...region('Review history').querySelectorAll('li.xr-tl')].map(text)).toEqual([
      'Approved by Prof. A. Menon14 Aug 2026, 15:10Sent to the Content Manager with 2 learning outcomes. Nothing is published.',
      'Submitted for academic review6 Aug 2026, 12:02Revision 1 · from Northline Simulation Studio',
    ]);
    // The shell names it the decided state (RV-06) under Review queue.
    expect(
      screen
        .getByRole('navigation', { name: 'Academic Reviewer navigation' })
        .querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', '/reviewer/queue');
  });
});

describe('RV-03 — refusals, not found, loading and failed', () => {
  async function withOutcome(user: ReturnType<typeof userEvent.setup>) {
    await heading('Flash Distillation');
    await user.type(addField(), FLASH_OUTCOME);
    await user.click(screen.getByRole('button', { name: 'Add outcome' }));
  }

  it('stale: nothing written, a calm warning, the set kept — the next Approve goes through', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
    answerWith(runtime, 'approveSubmission', { kind: 'stale-version', currentRev: 99 });
    show(runtime, 'SUB-0086');
    await withOutcome(user);
    await user.click(within(panel()).getByRole('button', { name: 'Approve' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Approve' }),
    );
    expect(
      await within(panel()).findByText('This submission changed since you opened it'),
    ).toBeVisible();
    expect(panel()).toHaveTextContent(
      'It has been read again. Your outcomes are kept — check them and decide again.',
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(outcomeTexts()).toEqual([FLASH_OUTCOME]);
    const view = ok(
      await asPersonId(sample, MENON).production.getSubmissionForReview('SUB-0086' as never),
    );
    expect(view.submission.status.state).toBe('with-academic-reviewer');
    await user.click(within(panel()).getByRole('button', { name: 'Approve' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Approve' }),
    );
    await screen.findByText('Approved — with the Content Manager', {
      selector: '.xr-dpanel .xr-status',
    });
  });

  it('decided elsewhere (invalid state): the decided page with a calm notice', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
    answerWith(runtime, 'approveSubmission', {
      kind: 'invalid-state',
      current: 'with-content-manager',
    });
    show(runtime, 'SUB-0086');
    await withOutcome(user);
    // Meanwhile the record is decided in another tab (set-up through the port).
    const reviewer = asPersonId(sample, MENON);
    const view = ok(await reviewer.production.getSubmissionForReview('SUB-0086' as never));
    ok(
      await reviewer.production.approveSubmission({
        id: view.submission.id,
        outcomes: ['Measure the vapour and liquid flows.'],
        expectedRev: view.submission.rev,
      } as never),
    );
    await user.click(within(panel()).getByRole('button', { name: 'Approve' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Approve' }),
    );
    expect(
      await within(panel()).findByText('It was decided elsewhere — nothing you entered was sent.'),
    ).toBeVisible();
    expect(panel()).toHaveTextContent('Approved — with the Content Manager');
    expect([...region('Learning outcomes').querySelectorAll('ul.xv-los li')].map(text)).toEqual([
      'Measure the vapour and liquid flows.',
    ]);
  });

  it('failed for now: DL-1 stays open and says so; nothing is lost', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
    show(runtime, 'SUB-0086');
    await withOutcome(user);
    await user.click(within(panel()).getByRole('button', { name: 'Approve' }));
    const dialog = await screen.findByRole('dialog');
    faults(sample).failNext('ProductionService.approveSubmission');
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Your decision wasn’t sent. Nothing was lost — try again.',
    );
    expect(dialog).toBeVisible();
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }));
    await screen.findByText('Approved — with the Content Manager', {
      selector: '.xr-dpanel .xr-status',
    });
  });

  it('an unknown submission, or one outside the reviewer’s scope, is the in-shell not-found page', async () => {
    const { runtime } = await tabPlatform(MENON, 'spine-start');
    const first = show(runtime, 'SUB-9999');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
    first.view.unmount();
    // A draft only the Vendor sees (SUB-16).
    show(runtime, 'SUB-0079');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
  });

  it('loading, then failed + Try again (a test fault plan)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
    faults(sample).failNext('ProductionService.getSubmissionForReview');
    show(runtime, 'SUB-0086');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'Review a submission',
    );
    const failed = await screen.findByRole('alert', {}, { timeout: 5000 });
    expect(failed).toHaveTextContent('We couldn’t load this submission');
    expect(failed).toHaveTextContent('Nothing has changed. Try again.');
    await act(async () => {
      await user.click(within(failed).getByRole('button', { name: 'Try again' }));
    });
    await heading('Flash Distillation');
  });
});

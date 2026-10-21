/**
 * RV-03 Review a submission and RV-06 its decided state — the owner-approved Academic Reviewer
 * export (V3, design/v3-refined-b/roles/RV-v1, `RV.dc.html` item view) — on the real composition
 * root and the sample world, as Prof. A. Menon. spine-start holds three of them as they are:
 * SUB-0086 Flash Distillation (no learning outcomes yet), SUB-0071 Venturi Meter Calibration (back
 * from the Content Manager for a re-check) and SUB-0074 Transient Cooling (approved, with the
 * Content Manager — RV-06). The resubmission is prepared through the ports (set-up only): Anil
 * Shetty submits “Conduction Through a Composite Wall” (SUB-0077), Prof. Menon returns it, Anil
 * changes the VR device need and resubmits; the routing stand-in sends it back as revision 2.
 * Everything the page does — the outcome editor, Approve through its confirmation, Return to vendor
 * in the panel with its reason and references — is done by clicks and typing; the refusals (stale,
 * decided elsewhere, failed for now) are answered by a port stand-in. Every drawn state is checked
 * for internal references (the owner's identifier rule).
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
import { internalReferencesIn } from './shared/references';

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

/** The world with SUB-0077 submitted, returned with a reason, revised and resubmitted (revision 2). */
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
/** The editable list's texts, without each item's screen-reader prefix (“Outcome 2: ”). */
const outcomeTexts = () =>
  [...(outcomes()?.querySelectorAll('.rv-lo-t') ?? [])].map((element) =>
    text(element).replace(/^Outcome \d+: /, ''),
  );
const readOnlyOutcomes = () =>
  [...(outcomes()?.querySelectorAll('ol.rv-lo-ro li') ?? [])].map(text);
const addField = () => screen.getByRole('textbox', { name: /^Add a learning outcome/ });
const region = (name: string) => screen.getByRole('region', { name });
const crumbs = () => screen.getByRole('navigation', { name: 'Breadcrumb' });
const choose = (user: ReturnType<typeof userEvent.setup>, name: RegExp) =>
  user.click(within(panel()).getByRole('radio', { name }));
const summary = () => document.getElementById('rv-errs');
const done = () => document.getElementById('rv-done');

/** No SUB-/UPD-/… reference anywhere the reviewer reads, nor in the browser tab. */
function expectNoReferences() {
  expect(internalReferencesIn(document.body)).toEqual([]);
  expect(document.title).not.toMatch(/\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/);
}

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

describe('RV-03 — not ready: no learning outcomes yet (RV03-outcomes)', () => {
  it('the identity card, the blocks and the panel as drawn', async () => {
    const { runtime } = await tabPlatform(MENON, 'spine-start');
    show(runtime, 'SUB-0086');
    await heading('Flash Distillation');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    // The breadcrumb: the parent list, then the experiment — never a record reference.
    expect(text(crumbs())).toBe('Review queueFlash Distillation');
    expect(within(crumbs()).getByRole('link', { name: 'Review queue' })).toHaveAttribute(
      'href',
      '/reviewer/queue',
    );
    const card = main().querySelector('header.rv-idcard')!;
    expect(text(card.querySelector('.rv-kind'))).toBe('New submission');
    expect(card.querySelector('.rv-kind')).toHaveClass('rv-kind--new');
    expect(text(card.querySelector('.rv-id-lead'))).toBe(
      'Flash a hot binary feed across a valve into a drum and find the vapour fraction from your own readings.',
    );
    expect(card.querySelector('.rv-meta-main .xr-st')).toHaveClass('xr-st--info', 'rk-st-lg');
    expect(text(card.querySelector('.rk-meta'))).toBe(
      'Waiting for your decisionCHE ZG513Process Instrumentation & ControlFrom Meridian Virtual Labs',
    );
    expect(card.querySelector('a.rk-goto')).toHaveAttribute('href', '#rv-panel');
    const facts = [...card.querySelectorAll('.rv-id-fact')].map((fact) => [
      text(fact.querySelector('dt')),
      text(fact.querySelector('dd')),
    ]);
    expect(facts.map(([term]) => term)).toEqual(['Waiting', 'Revision', 'Version', 'Formats']);
    expect(facts[0]![1]).toMatch(/^(Today|1 day|\d+ days) · since 24 Aug$/);
    expect(facts.slice(1)).toEqual([
      ['Revision', '1'],
      ['Version', '1.0'],
      ['Formats', 'WEB'],
    ]);
    const map = screen.getByRole('navigation', { name: 'On this page' });
    expect(within(map).getAllByRole('link').map(text)).toEqual([
      'Learning outcomes0',
      'Description and documents',
      'Formats and delivery1',
      'Review history',
    ]);
    // The shell: Review queue current.
    const current = screen
      .getByRole('navigation', { name: 'Academic Reviewer navigation' })
      .querySelector('[aria-current="page"]');
    expect(current).toHaveAttribute('href', '/reviewer/queue');

    const lo = region('Learning outcomes');
    expect(lo).toHaveClass('rv-block--work');
    expect(text(lo.querySelector('.rv-lo-sub'))).toBe(
      'You set one list for the Experiment, used in every format. The vendor and the Content Manager see it with your decision.',
    );
    expect(text(lo.querySelector('.rv-req'))).toBe('At least one needed to approve');
    expect(lo.querySelector('.rv-req')).toHaveClass('rv-req--need');
    expect(text(lo.querySelector('.rk-notice--warn'))).toBe(
      'No learning outcomes yetApprove needs at least one. Add what a learner can do after this experiment; the same list applies to every format.',
    );
    expect(outcomes()).toBeNull();
    expect(addField()).toHaveAccessibleDescription(
      'What a learner can do after the experiment. Start with a verb.',
    );

    const details = region('Description and documents');
    expect(text(details.querySelector('.rv-block-k'))).toBe('From Meridian Virtual Labs');
    expect(text(details.querySelector('.rv-prose p'))).toBe(
      'Learners set the feed temperature and the drum pressure, read the vapour and liquid flows, and compare the vapour fraction with an equilibrium calculation.',
    );
    expect([...details.querySelectorAll('ul.rv-files > li')].map(text)).toEqual([
      'No preview link',
      'Flash drum handout.pdf',
    ]);
    const delivery = region('Formats and delivery');
    expect(text(delivery.querySelector('.rv-fmtline'))).toBe(
      'In this submissionWEBNot included: AR, VR, MR',
    );
    const web = within(delivery).getByRole('link', {
      name: /^Open web link ?\(opens in a new tab\)$/,
    });
    expect(web).toHaveAttribute('href', 'https://labs.meridian.example/flash-distillation');
    expect(web).toHaveAttribute('target', '_blank');
    expect(web).toHaveAttribute('rel', 'noopener noreferrer');
    expect(text(delivery.querySelector('.rv-footnote'))).toBe(
      'You see delivery details and web links only. Opening a link is not a test on a real device.',
    );
    expect(main().textContent).not.toMatch(/\bT-\d{2}\b/);
    const history = region('Review history');
    expect(history).toHaveClass('rv-block--quiet');
    expect([...history.querySelectorAll('ol.rk-tl > li')].map(text)).toEqual([
      'Submitted for academic review24 Aug 2026, 10:00Revision 1 · from Meridian Virtual Labs',
    ]);

    expect(text(panel().querySelector('.rv-ready'))).toBe(
      'Before you decideNo learning outcomes yet. Approve needs at least one. Add an outcomeWhole Experiment. You decide for every format together: WEB.',
    );
    // No decision is chosen at first.
    const choices = within(panel()).getAllByRole('radio');
    expect(choices.map((radio) => (radio as HTMLInputElement).checked)).toEqual([false, false]);
    // Each decision is described by its consequence line, then by "Whole Experiment." in Before
    // you decide (RV-v1 `aria-describedby="rv-whole"`).
    for (const radio of choices) {
      expect(radio.getAttribute('aria-describedby')?.split(' ').at(-1)).toBe('rv-whole');
      expect(radio).toHaveAccessibleDescription(
        /Whole Experiment\. You decide for every format together: WEB\.$/,
      );
    }
    expect(within(panel()).getByRole('group', { name: 'Decision' })).toBeInTheDocument();
    expect(within(panel()).getByRole('button', { name: 'Approve' })).toHaveClass(
      'rb-btn--primary',
      'rk-go',
    );
    expect(text(panel().querySelector('.rv-path'))).toBe(
      'What happens next1You · academic decisionApprove it, or return it to the vendor.2Content Manager · publicationApproving does not publish.3Institutions · student accessPublishing gives no one access.',
    );
    expectNoReferences();
  });

  it('deciding with nothing chosen asks for a decision; nothing opens', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(MENON, 'spine-start');
    show(runtime, 'SUB-0086');
    await heading('Flash Distillation');
    await user.click(within(panel()).getByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(summary()).toHaveFocus());
    expect(text(summary())).toBe('Check your decisionChoose a decision');
    expect(text(panel().querySelector('fieldset.is-invalid .rk-ferr'))).toBe('Choose a decision');
    expect(screen.queryByRole('dialog')).toBeNull();
    // The summary's link focuses the choices.
    await user.click(within(summary()!).getByRole('link', { name: 'Choose a decision' }));
    expect(within(panel()).getAllByRole('radio')[0]).toHaveFocus();
  });

  it('Approve with no outcome says why it can’t go yet, in the panel and at the field (RV03-outcomes)', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(MENON, 'spine-start');
    show(runtime, 'SUB-0086');
    await heading('Flash Distillation');
    await choose(user, /^Approve/);
    expect(text(panel().querySelector('.rk-pending'))).toBe(
      'Add at least one learning outcome before you approve.',
    );
    await user.click(within(panel()).getByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(summary()).toHaveFocus());
    expect(summary()).toHaveAttribute('role', 'alert');
    expect(text(summary())).toBe(
      'Check your decisionAdd at least one learning outcome before you approve',
    );
    // The pending hint steps aside rather than repeating it; the field says it too.
    expect(panel().querySelector('.rk-pending')).toBeNull();
    expect(text(document.getElementById('rv-lo-err'))).toBe(
      'Add at least one learning outcome before you approve',
    );
    expect(region('Learning outcomes')).toHaveClass('is-invalid');
    expect(addField()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(
      within(summary()!).getByRole('link', {
        name: 'Add at least one learning outcome before you approve',
      }),
    );
    expect(addField()).toHaveFocus();
    expectNoReferences();
  });

  it('adds an outcome (blank first: “Enter the outcome text”), approves through the confirmation → RV-06', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
    show(runtime, 'SUB-0086');
    await heading('Flash Distillation');
    await user.click(screen.getByRole('button', { name: 'Add outcome' }));
    expect(text(document.getElementById('rv-lo-new-err'))).toBe('Enter the outcome text');
    await waitFor(() => expect(addField()).toHaveFocus());
    await user.type(addField(), `  ${FLASH_OUTCOME}  `);
    await user.click(screen.getByRole('button', { name: 'Add outcome' }));
    expect(outcomeTexts()).toEqual([FLASH_OUTCOME]);
    expect(addField()).toHaveValue('');
    expect(text(document.getElementById('rv-lo-msg'))).toBe(
      'Outcome added — 1 outcome in the list.',
    );
    expect(region('Learning outcomes').querySelector('.rk-notice--warn')).toBeNull();
    expect(text(region('Learning outcomes').querySelector('.rv-req'))).toBe('Requirement met');

    await choose(user, /^Approve/);
    await user.click(within(panel()).getByRole('button', { name: 'Approve' }));
    const dialog = await screen.findByRole('dialog', { name: 'Approve “Flash Distillation”?' });
    expect(dialog).toHaveAccessibleDescription(
      'Check what approving does now, and what happens only after later decisions.',
    );
    expect([...dialog.querySelectorAll('.rk-dlg-group')].map(text)).toEqual([
      'What happens nowIt goes to the Content Manager with its 1 learning outcome.It leaves your review queue and is listed in Reviewed by me.',
      'Only after later decisionsThe Content Manager decides whether to publish it. Approving does not publish.Publishing gives no one access. Institutions give their students access separately.',
    ]);
    await waitFor(() =>
      expect(
        within(dialog).getByRole('heading', { name: 'Approve “Flash Distillation”?' }),
      ).toHaveFocus(),
    );
    expectNoReferences();
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }));

    await waitFor(() => expect(done()).toHaveFocus());
    const outcome = done()!;
    expect(outcome.querySelector('.xr-st')).toHaveClass('xr-st--ok', 'rk-st-lg');
    expect(text(outcome.querySelector('.xr-st'))).toBe('Approved — with the Content Manager');
    expect(text(outcome.querySelector('.rk-done-meta'))).toMatch(
      /^Decided by you on \d{1,2} \w{3} 2026, \d\d:\d\d$/,
    );
    expect(
      [...outcome.querySelectorAll('dl.rk-stand > div')].map((row) => [
        text(row.querySelector('dt')),
        text(row.querySelector('dd')),
      ]),
    ).toEqual([
      ['Academic review', 'Approved by you'],
      ['Learning outcomes', '1 outcome, sent with your decision'],
      ['Publication', 'Not published — the Content Manager decides'],
      ['Access', 'None — publishing gives no one access'],
    ]);
    expect(text(outcome.querySelector('.rk-next'))).toBe(
      'The Content Manager decides whether to publish it. Nothing is published yet.',
    );
    // Decided on the page: it stays under the review queue.
    expect(
      within(outcome as HTMLElement).getByRole('link', { name: 'Back to the review queue' }),
    ).toHaveAttribute('href', '/reviewer/queue');
    expect(text(main().querySelector('.rv-meta-main .xr-st'))).toBe(
      'Approved — with the Content Manager',
    );
    // RV-06: the set read-only, nothing to edit; the history is a card.
    expect(readOnlyOutcomes()).toEqual([FLASH_OUTCOME]);
    expect(text(region('Learning outcomes').querySelector('.rv-req'))).toBe(
      'Set by you · read-only',
    );
    expect(region('Review history')).toHaveClass('rv-hist--card');
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
    expectNoReferences();
    // One world: with the Content Manager, the set travelled with it — and nothing is published.
    const reviewer = asPersonId(sample, MENON);
    const after = ok(await reviewer.production.getSubmissionForReview('SUB-0086' as never));
    expect(after.submission.status.state).toBe('with-content-manager');
    expect(after.submission.learningOutcomes.map((entry) => entry.text)).toEqual([FLASH_OUTCOME]);
    const published = ok(
      await asPersonId(sample, MENON).catalogue.searchCatalogue({
        text: 'Flash Distillation',
        sort: 'default',
      }),
    );
    expect(published.entries).toEqual([]);
  });
});

describe('RV-03 — the outcomes editor (RV03-recheck, RV03-editing: back for a re-check)', () => {
  it('the Content Manager’s reason first; move, edit (blank: “…, or cancel”), delete and undo', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(MENON, 'spine-start');
    show(runtime, 'SUB-0071');
    await heading('Venturi Meter Calibration');
    expect(text(main().querySelector('.rv-idcard .rv-kind'))).toBe('Re-check');
    expect(main().querySelector('.rv-idcard .rv-meta-main .xr-st')).toHaveClass('xr-st--info');
    expect(text(main().querySelector('.rv-idcard .rv-meta-main .xr-st'))).toBe(
      'Waiting for your decision',
    );
    const first = main().querySelector('.rv-main')!.firstElementChild!;
    expect(first).toHaveClass('rv-block', 'rv-block--attn');
    expect(text(first.querySelector('h2'))).toBe('Sent back for a re-check');
    expect(text(first.querySelector('.rv-band-note'))).toBe('25 Aug 2026, 10:00');
    expect(text(first.querySelector('blockquote p'))).toBe(RECHECK_REASON);
    expect(text(first.querySelector('.rk-quote-by'))).toBe('Kavya Nair, Content Manager');
    expect(text(first.querySelector('p.rk-next'))).toBe(
      'Check it again and approve, or return it to the vendor.',
    );
    expect(text(panel().querySelector('.rv-ready'))).toContain(
      'Re-check. The Content Manager sent it back to you. Read why',
    );
    expect(outcomeTexts()).toEqual([
      'Calibrate a Venturi meter against a weigh tank.',
      'Compare the discharge coefficient with a Pitot tube reading.',
      'Explain where the pressure is recovered downstream of the throat.',
    ]);
    expect(screen.getByRole('button', { name: 'Move outcome 1 up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move outcome 3 down' })).toBeDisabled();
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

    // Edit outcome 3 (the Pitot tube): every other control waits; cleared, Save → its own words.
    await user.click(screen.getByRole('button', { name: 'Edit outcome 3' }));
    const field = screen.getByRole('textbox', { name: 'Outcome 3' });
    await waitFor(() => expect(field).toHaveFocus());
    expect(field).toHaveValue('Compare the discharge coefficient with a Pitot tube reading.');
    expect(screen.getByRole('button', { name: 'Edit outcome 1' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete outcome 2' })).toBeDisabled();
    // While it is edited, deciding asks to save or cancel it first.
    await choose(user, /^Approve/);
    expect(text(panel().querySelector('.rk-pending'))).toBe(
      'Save or cancel the outcome you are editing first.',
    );
    await user.click(within(panel()).getByRole('button', { name: 'Approve' }));
    await waitFor(() => expect(summary()).toHaveFocus());
    expect(text(summary())).toBe(
      'Check your decisionSave or cancel the outcome you are editing first',
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    await user.click(
      within(summary()!).getByRole('link', {
        name: 'Save or cancel the outcome you are editing first',
      }),
    );
    expect(field).toHaveFocus();
    await user.clear(field);
    await user.click(screen.getByRole('button', { name: 'Save outcome' }));
    expect(text(document.getElementById('rv-lo-ed-err'))).toBe('Enter the outcome text, or cancel');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription('Enter the outcome text, or cancel');
    await user.type(field, 'Compare the discharge coefficient with the weigh-tank reading.');
    await user.click(screen.getByRole('button', { name: 'Save outcome' }));
    expect(outcomeTexts()[2]).toBe(
      'Compare the discharge coefficient with the weigh-tank reading.',
    );
    expect(text(document.getElementById('rv-lo-msg'))).toBe('Outcome 3 saved.');
    expect(summary()).toBeNull();
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
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Edit outcome 1' })).toHaveFocus(),
    );

    // Cancel an edit: nothing changes.
    await user.click(screen.getByRole('button', { name: 'Edit outcome 2' }));
    await user.type(screen.getByRole('textbox', { name: 'Outcome 2' }), ' (draft)');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(outcomeTexts()[1]).toBe(
      'Explain where the pressure is recovered downstream of the throat.',
    );
    expectNoReferences();
  });

  it('the set is kept while the reviewer moves around the app, and sent with Approve', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
    const first = show(runtime, 'SUB-0071');
    await heading('Venturi Meter Calibration');
    await user.click(screen.getByRole('button', { name: 'Delete outcome 2' }));
    await user.type(addField(), 'Plot the discharge coefficient against the Reynolds number.');
    await choose(user, /^Approve/);
    first.view.unmount();

    show(runtime, 'SUB-0071');
    await heading('Venturi Meter Calibration');
    expect(outcomeTexts()).toEqual([
      'Calibrate a Venturi meter against a weigh tank.',
      'Explain where the pressure is recovered downstream of the throat.',
    ]);
    expect(addField()).toHaveValue('Plot the discharge coefficient against the Reynolds number.');
    expect(within(panel()).getByRole('radio', { name: /^Approve/ })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Add outcome' }));
    await user.click(within(panel()).getByRole('button', { name: 'Approve' }));
    const dialog = await screen.findByRole('dialog', {
      name: 'Approve “Venturi Meter Calibration”?',
    });
    // A re-check goes back to the Content Manager.
    expect(dialog).toHaveTextContent(
      'It goes back to the Content Manager with its 3 learning outcomes.',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Approve' }));
    await waitFor(() =>
      expect(text(done()?.querySelector('.xr-st') ?? null)).toBe(
        'Approved — with the Content Manager',
      ),
    );
    const after = ok(
      await asPersonId(sample, MENON).production.getSubmissionForReview('SUB-0071' as never),
    );
    expect(after.submission.learningOutcomes.map((entry) => entry.text)).toEqual([
      'Calibrate a Venturi meter against a weigh tank.',
      'Explain where the pressure is recovered downstream of the throat.',
      'Plot the discharge coefficient against the Reynolds number.',
    ]);
  });
});

describe('RV-03 — Return to vendor, in the panel (RV03-return-errors, -return-filled, -returned)', () => {
  it('a reason is required; the references are the submission’s, grouped; the vendor sees both', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
    show(runtime, 'SUB-0086');
    await heading('Flash Distillation');
    await choose(user, /^Return to vendor/);
    const go = within(panel()).getByRole('button', { name: 'Return to vendor' });
    const reason = within(panel()).getByRole('textbox', {
      name: 'Reason the vendor will see (required)',
    });
    expect(reason).toHaveAccessibleDescription('The vendor sees this above their editor.');
    expect(text(panel().querySelector('.rk-pending'))).toBe('Add the reason before you return it.');
    const refs = within(panel()).getByRole('group', { name: /^What it refers to \(optional\)/ });
    // The preview link is offered only when the submission has one (SUB-0086 has none).
    expect(
      within(refs)
        .getAllByRole('group')
        .map((group) => [
          text(group.querySelector('legend')),
          within(group)
            .getAllByRole('checkbox')
            .map((box) => text(box.closest('label'))),
        ]),
    ).toEqual([
      ['Course & description', ['Summary', 'Description']],
      ['Formats & delivery · WEB', ['Web link', 'Browser and computer']],
    ]);
    // Return with no reason: the summary (focused) and the error at the field; nothing is sent.
    await user.click(go);
    await waitFor(() => expect(summary()).toHaveFocus());
    expect(text(summary())).toBe(
      'Check your decisionAdd a reason so the vendor knows what to change',
    );
    expect(text(document.getElementById('rv-reason-e'))).toBe(
      'Add a reason so the vendor knows what to change',
    );
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    expect(panel().querySelector('.rk-pending')).toBeNull();
    expectNoReferences();
    await user.click(
      within(summary()!).getByRole('link', {
        name: 'Add a reason so the vendor knows what to change',
      }),
    );
    expect(reason).toHaveFocus();
    await user.type(reason, 'Add the drum pressure range to the description.');
    expect(document.getElementById('rv-reason-e')).toBeNull();
    await user.click(
      within(within(refs).getByRole('group', { name: 'Course & description' })).getByRole(
        'checkbox',
        { name: 'Description' },
      ),
    );
    expectNoReferences();
    await user.click(go);

    await waitFor(() => expect(done()).toHaveFocus());
    const outcome = done()!;
    expect(outcome.querySelector('.xr-st')).toHaveClass('xr-st--err');
    expect(text(outcome.querySelector('.xr-st'))).toBe('Returned to vendor');
    expect(text(outcome.querySelector('.rv-done-q'))).toBe(
      'Your reason“Add the drum pressure range to the description.”Course & description · Description',
    );
    expect(
      [...outcome.querySelectorAll('dl.rk-stand > div')].map((row) => [
        text(row.querySelector('dt')),
        text(row.querySelector('dd')),
      ]),
    ).toEqual([
      ['Academic review', 'Returned to the vendor'],
      ['References', '1 field'],
      ['Publication', 'Not published'],
    ]);
    expect(text(outcome.querySelector('.rk-next'))).toBe(
      'The vendor sees your reason above their editor and can revise and resubmit. A resubmission comes back to your queue as a new revision.',
    );
    expect(screen.queryByRole('dialog')).toBeNull();
    const history = region('Review history');
    expect(text(history.querySelector('ol.rk-tl > li'))).toMatch(
      /^Returned to vendor by Prof\. A\. Menon.*“Add the drum pressure range to the description\.”$/,
    );
    expectNoReferences();
    // The vendor (Ritu Sharma, Meridian) sees the reason and the reference above the editor.
    const record = ok(await asPersonId(sample, RITU).production.getRecord('SUB-0086' as never));
    expect(record.lastReturn).toMatchObject({
      decision: 'return-to-vendor',
      reason: 'Add the drum pressure range to the description.',
      references: [{ step: 'course-and-description', format: null, field: 'description' }],
    });
  });

  it('choosing Approve instead returns nothing; the reason typed is kept for the return', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
    show(runtime, 'SUB-0086');
    await heading('Flash Distillation');
    await choose(user, /^Return to vendor/);
    await user.type(
      within(panel()).getByRole('textbox', { name: 'Reason the vendor will see (required)' }),
      'Not this time.',
    );
    await choose(user, /^Approve/);
    expect(within(panel()).queryByRole('textbox')).toBeNull();
    expect(within(panel()).getByRole('button', { name: 'Approve' })).toBeVisible();
    await choose(user, /^Return to vendor/);
    expect(
      within(panel()).getByRole('textbox', { name: 'Reason the vendor will see (required)' }),
    ).toHaveValue('Not this time.');
    const view = ok(
      await asPersonId(sample, MENON).production.getSubmissionForReview('SUB-0086' as never),
    );
    expect(view.submission.status.state).toBe('with-academic-reviewer');
  });

  it('failed for now: the panel says so; the reason stays and the next press goes through', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
    show(runtime, 'SUB-0086');
    await heading('Flash Distillation');
    await choose(user, /^Return to vendor/);
    const reason = within(panel()).getByRole('textbox', {
      name: 'Reason the vendor will see (required)',
    });
    await user.type(reason, 'Add the drum pressure range.');
    faults(sample).failNext('ProductionService.returnSubmission');
    await user.click(within(panel()).getByRole('button', { name: 'Return to vendor' }));
    expect(await within(panel()).findByRole('alert')).toHaveTextContent(
      'Your decision wasn’t sent. Nothing was lost — try again.',
    );
    expect(reason).toHaveValue('Add the drum pressure range.');
    await user.click(within(panel()).getByRole('button', { name: 'Return to vendor' }));
    await waitFor(() =>
      expect(text(done()?.querySelector('.xr-st') ?? null)).toBe('Returned to vendor'),
    );
  });
});

describe('RV-03 — resubmitted · revision 2 (RV03, RV03-1024/768/375)', () => {
  it('what changed first, with the previous return; the delivery card marks the change', async () => {
    const user = userEvent.setup();
    const { runtime, id } = await resubmitted();
    expect(id).toBe('SUB-0077');
    show(runtime, id);
    await heading(COMPOSITE);
    const card = main().querySelector('header.rv-idcard')!;
    expect(text(card.querySelector('.rv-kind'))).toBe('Resubmittedrevision 2');
    expect(card.querySelector('.rv-kind')).toHaveClass('rv-kind--resub');
    expect(text(card.querySelector('.rk-meta'))).toBe(
      'Waiting for your decisionME ZG523Thermodynamics & Heat TransferFrom Northline Simulation Studio',
    );
    expect(
      [...card.querySelectorAll('.rv-id-fact')]
        .map((fact) => [text(fact.querySelector('dt')), text(fact.querySelector('dd'))])
        .slice(1),
    ).toEqual([
      ['Revision', '2 · resubmitted 26 Aug'],
      ['Version', '1.0'],
      ['Formats', 'WEB · VR'],
    ]);
    const changed = main().querySelector('.rv-main')!.firstElementChild!;
    expect(changed).toHaveClass('rv-block');
    expect(text(changed.querySelector('h2'))).toBe('What changed in revision 2');
    expect(text(changed.querySelector('.rv-band-note'))).toBe('Only what the vendor changed');
    expect(text(changed.querySelector('blockquote p'))).toBe(`“${RETURN_REASON}”`);
    expect(text(changed.querySelector('.rk-quote-by'))).toBe(
      'Your reason when you returned revision 1 · 19 Aug 2026',
    );
    const table = within(changed as HTMLElement).getByRole('table', {
      name: 'What changed in revision 2',
    });
    expect(
      within(table)
        .getAllByRole('row')
        .slice(1)
        .map((row) => text(row)),
    ).toEqual([`Formats & delivery · VR · Device needWasVR headsetNow${NEW_DEVICE}`]);
    expect(text(table.querySelector('del'))).toBe('VR headset');
    expect(text(panel().querySelector('.rv-ready'))).toContain(
      '1 change since you returned it. See what changed',
    );
    const details = region('Description and documents');
    const preview = within(details).getByRole('link', { name: /^Two-minute walkthrough/ });
    expect(preview).toHaveAttribute('href', 'https://labs.northline.example/cw-tour');
    expect(preview).toHaveAttribute('target', '_blank');
    const delivery = region('Formats and delivery');
    const vr = within(delivery)
      .getByRole('heading', { level: 3, name: /^VR, ?Virtual reality$/ })
      .closest('.rv-dcard')!;
    expect(text(vr.querySelector('.rv-dcard-k'))).toBe('App package');
    expect(text(vr.querySelector('.rv-tag'))).toBe('Changed in revision 2');
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
    expect([...history.querySelectorAll('ol.rk-tl > li')].map(text)).toEqual([
      'Resubmitted · revision 226 Aug 2026, 11:30Northline Simulation Studio changed the VR device need.',
      `Returned to vendor by Prof. A. Menon19 Aug 2026, 16:05“${RETURN_REASON}”`,
      'Submitted for academic review12 Aug 2026, 10:52Revision 1 · from Northline Simulation Studio',
    ]);
    // The return kept no outcomes: none yet, so Approve needs one first.
    expect(outcomes()).toBeNull();
    // The references now offer the VR fields and the preview link, grouped.
    await choose(user, /^Return to vendor/);
    const refs = within(panel()).getByRole('group', { name: /^What it refers to/ });
    expect(
      within(refs)
        .getAllByRole('group')
        .map((group) => text(group.querySelector('legend'))),
    ).toEqual([
      'Course & description',
      'Formats & delivery · WEB',
      'Formats & delivery · VR',
      'Preview & documents',
    ]);
    // The vendor’s build name is vendor data, not a platform reference (HANDOFF exception).
    expectNoReferences();
  });
});

describe('RV-06 — decided · read-only (RV06)', () => {
  it('the outcomes read-only and the outcome block: status, when, where it stands, the way back', async () => {
    const { runtime } = await tabPlatform(MENON, 'spine-start');
    show(runtime, 'SUB-0074');
    await heading('Transient Cooling');
    // A decided item sits under Reviewed by me.
    expect(text(crumbs())).toBe('Reviewed by meTransient Cooling');
    expect(within(crumbs()).getByRole('link', { name: 'Reviewed by me' })).toHaveAttribute(
      'href',
      '/reviewer/reviewed',
    );
    const card = main().querySelector('header.rv-idcard')!;
    expect(text(card.querySelector('.rv-kind'))).toBe('New submission');
    expect(card.querySelector('.rv-meta-main .xr-st')).toHaveClass('xr-st--ok');
    expect(
      [...card.querySelectorAll('.rv-id-fact')].map((fact) => [
        text(fact.querySelector('dt')),
        text(fact.querySelector('dd')),
      ]),
    ).toEqual([
      ['Decided', '14 Aug 2026, 15:10'],
      ['Revision', '1'],
      ['Version', '1.0'],
      ['Formats', 'WEB'],
    ]);
    expect(readOnlyOutcomes()).toEqual([
      'Decide when the lumped-capacitance model applies, using the Biot number.',
      'Estimate a heat transfer coefficient from a measured cooling curve.',
    ]);
    expect(text(region('Learning outcomes').querySelector('.rv-lo-sub'))).toBe(
      'One list for the Experiment, used in every format.',
    );
    expect(text(done())).toBe(
      'Approved — with the Content ManagerDecided by you on 14 Aug 2026, 15:10Academic reviewApproved by youLearning outcomes2 outcomesPublicationNot published — the Content Manager decidesAccessNone — publishing gives no one accessThe Content Manager decides whether to publish it. Nothing is published yet.Back to Reviewed by me',
    );
    expect(within(done()!).getByRole('link', { name: 'Back to Reviewed by me' })).toHaveAttribute(
      'href',
      '/reviewer/reviewed',
    );
    expect(text(region('Description and documents').querySelector('ul.rv-files'))).toBe(
      'No preview link or documents',
    );
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Approve' })).toBeNull();
    // The shell names it the decided state (RV-06), under its parent list.
    // The tab names the experiment and its parent list. The rail keeps Review queue current for
    // RV-06 (the active-item map, unchanged); RV-v1 RV06 marks Reviewed by me — reported.
    expect(document.title).toBe('Transient Cooling · Reviewed by me · XR Learning Platform');
    expect(
      screen
        .getByRole('navigation', { name: 'Academic Reviewer navigation' })
        .querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', '/reviewer/queue');
    expect(region('Review history')).toHaveClass('rv-hist--card');
    expect([...region('Review history').querySelectorAll('ol.rk-tl > li')].map(text)).toEqual([
      'Approved by Prof. A. Menon14 Aug 2026, 15:10Sent to the Content Manager with 2 learning outcomes. Nothing is published.',
      'Submitted for academic review6 Aug 2026, 12:02Revision 1 · from Northline Simulation Studio',
    ]);
    expectNoReferences();
  });

  it('SUB-0070: the outcomes, count and dates the record holds', async () => {
    const { runtime } = await tabPlatform(MENON, 'spine-start');
    show(runtime, 'SUB-0070');
    await heading('Packed Bed Pressure Drop');
    expect(readOnlyOutcomes()).toHaveLength(3);
    expect(
      within(screen.getByRole('navigation', { name: 'On this page' }))
        .getAllByRole('link')
        .map(text)[0],
    ).toBe('Learning outcomes3');
    expect(text(done())).toContain('Learning outcomes3 outcomes');
    expect(text(done()?.querySelector('.rk-done-meta') ?? null)).toBe(
      'Decided by you on 21 Aug 2026, 10:00',
    );
    expectNoReferences();
  });
});

describe('RV-03 — refusals, not found, loading and failed', () => {
  async function withOutcome(user: ReturnType<typeof userEvent.setup>) {
    await heading('Flash Distillation');
    await user.type(addField(), FLASH_OUTCOME);
    await user.click(screen.getByRole('button', { name: 'Add outcome' }));
    await choose(user, /^Approve/);
  }

  it('stale: nothing written, “Nothing was recorded”, the set kept — the next Approve goes through', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(MENON, 'spine-start');
    answerWith(runtime, 'approveSubmission', { kind: 'stale-version', currentRev: 99 });
    show(runtime, 'SUB-0086');
    await withOutcome(user);
    await user.click(within(panel()).getByRole('button', { name: 'Approve' }));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Approve' }),
    );
    await waitFor(() => expect(document.getElementById('rv-refusal')).toHaveFocus());
    const refusal = document.getElementById('rv-refusal')!;
    expect(refusal).toHaveAttribute('role', 'alert');
    expect(text(refusal)).toBe(
      'Nothing was recordedThis submission changed since you opened it. It has been read again — your outcomes are kept; check them and decide again.',
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
    await waitFor(() =>
      expect(text(done()?.querySelector('.xr-st') ?? null)).toBe(
        'Approved — with the Content Manager',
      ),
    );
  });

  it('decided elsewhere (invalid state): “Nothing new was recorded” and the decided page', async () => {
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
    await waitFor(() =>
      expect(text(done()?.querySelector('.xr-st') ?? null)).toBe(
        'Approved — with the Content Manager',
      ),
    );
    expect(text(document.getElementById('rv-refusal'))).toBe(
      'Nothing new was recordedIt was decided elsewhere. The page now shows that decision.',
    );
    expect(text(done()?.querySelector('.rk-done-meta') ?? null)).toMatch(
      /^Decided by you on \d{1,2} \w{3} 2026, \d\d:\d\d, in another window$/,
    );
    expect(readOnlyOutcomes()).toEqual(['Measure the vapour and liquid flows.']);
    expectNoReferences();
  });

  it('failed for now: the confirmation stays open and says so; nothing is lost', async () => {
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
    await waitFor(() =>
      expect(text(done()?.querySelector('.xr-st') ?? null)).toBe(
        'Approved — with the Content Manager',
      ),
    );
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

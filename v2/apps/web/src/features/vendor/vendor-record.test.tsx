/**
 * VE-07 Experiment record and VE-13 History (board B5-06 f0 … f10; B5-08 f2, B6-12 f4) on the real
 * composition root and the sample world, as Anil Shetty. The spine-start seed holds the drawn
 * states — a draft (SUB-0079), returned by the Academic Reviewer (SUB-0081), with the Content
 * Manager (SUB-0074), a draft in a withdrawn course (SUB-0083), published (SUB-0052). Flow E’s
 * SUB-0077 moves through the ports as each role would (Anil saves and submits, Prof. A. Menon
 * returns and approves, Anil resubmits — the routing stand-in routes it at once, PC-66 — Kavya Nair
 * publishes or sends back) while the page reads the one world. The undrawn loading, failed, not
 * found, not permitted and policy-open states; `?tab=history`.
 */
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ProductPorts, Result } from '@xr/contracts/draft';
import type { IsoInstant, SubmissionId } from '@xr/domain';
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
import { ExperimentRecord } from './ve-07-record/experiment-record';
import { historyEvents, recordStateOf, type VendorRecordView } from './ve-07-record/record-view';

afterEach(() => {
  forgetLastAddress();
  vi.restoreAllMocks();
});

const ANIL = 'per-anil-shetty';
const MENON = 'per-a-menon';
const KAVYA = 'per-kavya-nair';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

function at(sample: Sample, instant: string) {
  standinsOf(sample).clock.setSampleNow(instant as IsoInstant);
}

/** A command as another role (or Anil himself), its receipt refreshing the page’s reads. */
async function as<T>(
  runtime: PlatformRuntime,
  sample: Sample,
  personId: string,
  command: (ports: ProductPorts) => Promise<Result<T>>,
): Promise<T> {
  let value: T | undefined;
  await act(async () => {
    const answer = await command(asPersonId(sample, personId));
    value = ok(answer);
    if (answer.ok) await runtime.invalidate(answer.changed);
  });
  return value as T;
}

/** SUB-0077 as Anil sends it (B5-03 … B5-05); the revision changes the VR device need (B5-07). */
function compositeWall(vrDevice: string) {
  return {
    courseId: 'thermodynamics-heat-transfer',
    name: 'Conduction Through a Composite Wall',
    summary:
      'Measure the temperature profile across a three-layer wall and compare it with the series-resistance model.',
    description:
      'Learners build a wall from three layers — brick, insulation and plaster — set the hot-side and cold-side temperatures, and read the temperature at each interface. They compare the measured profile and heat flux with the series thermal-resistance model and explain where the two differ.',
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
        installNotes:
          'Install the build named above on the headset and open “Composite Wall Lab”. On first launch, set the play-area boundary.',
        notes: null,
      },
    },
    preview: {
      label: 'Two-minute walkthrough',
      link: 'https://media.northline.example/composite-wall-walkthrough',
    },
    documents: [
      { fileName: 'Lab handout — Composite Wall.pdf' },
      { fileName: 'Thermocouple positions.pdf' },
    ],
  } as never;
}
const VR_DEVICE_REVISED =
  'Standalone VR headset — no PC or cable needed — and about 2 × 2 m of clear floor';
const OUTCOMES = [
  'Explain conduction through layers in series using thermal resistance.',
  'Predict interface temperatures from layer properties.',
  'Compare measured and predicted heat flux and explain the difference.',
];

function inShell(ui: ReactNode) {
  return (
    <WorkspaceLayout workspace="vendor">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{ui}</TestNotFoundBoundary>
    </WorkspaceLayout>
  );
}

function show(runtime: PlatformRuntime, submissionId: string, search = '') {
  const navigation = testNavigation(`/vendor/experiments/${submissionId}`, search);
  const view = renderInTab(inShell(<ExperimentRecord submissionId={submissionId} />), {
    runtime,
    navigation,
  });
  return { navigation, view };
}

const main = () => screen.getByRole('main');
const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
const title = (name: string) => screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });
const chip = () => main().querySelector('.xr-phead-meta .xr-status');
const overline = () => text(main().querySelector('.xr-phead .xr-overline'));
const banner = () => main().querySelector('.xr-notice');
const region = (name: string) => screen.getByRole('region', { name });
const details = () => region('Details');
const historyRegion = () => region('Submission and version history');
const what = () => [...historyRegion().querySelectorAll('.xr-tl-what')].map((line) => text(line));
const notes = () =>
  [...historyRegion().querySelectorAll('li.xr-tl')].map((item) =>
    text(item.querySelector('.xr-tl-note')),
  );
const links = () =>
  within(main())
    .getAllByRole('link')
    .map((link) => text(link));

function detailsRows(): string[] {
  const list = details().querySelector('dl.xv-kv')!;
  return [...list.querySelectorAll('dt')].map((key) =>
    `${text(key)} = ${text(key.nextElementSibling)}`.trim(),
  );
}

function deliveryBoxes(): string[][] {
  return [...details().querySelectorAll('.xv-deliv')].map((box) => [
    text(box.querySelector('.xv-deliv-head')),
    ...[...box.querySelectorAll('dt')].map(
      (key) => `${text(key)} = ${text(key.nextElementSibling)}`,
    ),
  ]);
}

describe('VE-07 — a draft (B5-06 f1)', () => {
  it('the header, the banner with Edit draft, the details, no outcomes yet, the history; the shell', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    show(runtime, 'SUB-0079');
    await title('Pin Fin Efficiency');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(main().querySelector('a.xr-back')).toHaveTextContent('My experiments');
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', '/vendor/experiments');
    await waitFor(() => expect(overline()).toBe('SUB-0079 · ME ZG523'));
    expect(chip()).toHaveTextContent('Draft');
    expect(chip()).toHaveClass('xr-status', 'xr-status--off');
    expect(banner()).toHaveClass('xr-notice');
    expect(text(banner()!.querySelector('.xr-notice-title'))).toBe('Draft — only you can see it');
    expect(banner()).toHaveTextContent('Finish it and submit it for academic review.');
    const edit = within(banner() as HTMLElement).getByRole('link', { name: 'Edit draft' });
    expect(edit).toHaveClass('xr-btn', 'xr-btn--primary');
    // Where the draft stopped: the seed’s draft last reached the first step.
    expect(edit).toHaveAttribute('href', '/vendor/experiments/SUB-0079/edit');
    expect(detailsRows()).toEqual([
      'Course = ME ZG523 · Thermodynamics & Heat Transfer',
      'Summary =',
      'Description =',
      'Version = 1.0',
      'Formats = WEB',
      'Preview = None',
      'Documents = None',
    ]);
    expect(deliveryBoxes()).toEqual([
      [
        'WEBWeb link',
        'Web link = —',
        'Browser and computer = A current browser on a laptop or desktop',
      ],
    ]);
    const outcomes = region('Learning outcomes');
    expect(text(outcomes.querySelector('.xr-section-head .xr-meta'))).toBe(
      'Added by the Academic Reviewer · read-only',
    );
    expect(outcomes).toHaveTextContent(
      'None yet. The Academic Reviewer adds them during review — one set for every format.',
    );
    expect(text(historyRegion().querySelector('.xr-section-head .xr-meta'))).toBe(
      'Newest first · not an audit log',
    );
    expect(historyRegion().querySelector('ol.xr-timeline .is-latest')).toBeNull();
    expect(what()).toEqual(['Draft saved']);
    expect(notes()).toEqual(['Only you can see a draft.']);
    // The shell: My experiments current; “Experiment record” on top, crumbed under My experiments.
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Experiment record');
    const sidebar = screen.getByRole('navigation', { name: 'Vendor navigation' });
    expect(sidebar.querySelector('[aria-current="page"]')).toHaveAttribute(
      'href',
      '/vendor/experiments',
    );
    expect(text(screen.getByRole('list', { name: 'You are here' }))).toMatch(
      /^My experiments\s*\/\s*Experiment record$/,
    );
  });

  it('Edit draft opens the editor at the step the draft last reached', async () => {
    const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
    const record = ok(
      await asPersonId(sample, ANIL).production.getRecord('SUB-0079' as SubmissionId),
    );
    await as(runtime, sample, ANIL, (ports) =>
      ports.production.saveDraft({
        id: record.submission.id,
        content: record.submission.content as never,
        step: 'preview',
        expectedRev: record.submission.rev,
      }),
    );
    show(runtime, 'SUB-0079');
    await title('Pin Fin Efficiency');
    expect(screen.getByRole('link', { name: 'Edit draft' })).toHaveAttribute(
      'href',
      '/vendor/experiments/SUB-0079/edit?step=preview',
    );
  });
});

describe('VE-07 — returned by the Academic Reviewer (B5-06 f3, f10)', () => {
  it('the reason with when and by whom, what it refers to, Revise & resubmit; the history note', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    show(runtime, 'SUB-0081');
    await title('Forced Convection');
    expect(chip()).toHaveTextContent('Returned');
    expect(chip()).toHaveClass('xr-status--err');
    const reason = main().querySelector('section.xv-reason') as HTMLElement;
    expect(reason).toHaveAttribute('tabindex', '-1');
    expect(within(reason).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Returned by the Academic Reviewer',
    );
    expect(text(reason.querySelector('.xr-meta'))).toBe('24 Aug 2026, 10:00 · Prof. A. Menon');
    expect(text(reason.querySelector('blockquote.xv-quote'))).toBe(
      'The AR install notes don’t say which phones and tablets it runs on. Add the supported devices and the install steps.',
    );
    expect(text(reason.querySelector('.xv-refs .xr-label'))).toBe('What it refers to');
    expect([...reason.querySelectorAll('li.xv-ref')].map((item) => text(item))).toEqual([
      'Formats & delivery · AR · Device need',
      'Formats & delivery · AR · Install notes',
    ]);
    // On the record the references are words, not links (the editor’s jumps, B5-07).
    expect(within(reason).queryAllByRole('link')).toHaveLength(0);
    expect(within(reason).queryAllByRole('button')).toHaveLength(0);
    const revise = screen.getByRole('link', { name: 'Revise & resubmit' });
    expect(revise.parentElement).toHaveClass('xw-actions');
    expect(revise).toHaveClass('xr-btn', 'xr-btn--primary');
    expect(revise).toHaveAttribute('href', '/vendor/experiments/SUB-0081/revise');
    expect(links()).toEqual(['My experiments', 'Revise & resubmit']);
    expect(deliveryBoxes().map((box) => box[0])).toEqual(['WEBWeb link', 'ARApp package']);
    expect(deliveryBoxes()[1]).toEqual([
      'ARApp package',
      'Package label = Forced Convection — AR build 1.0',
      'Package reference = —',
      'Package file = forced-convection-ar-1.0.zip',
      'Device needed = Supported phone or tablet',
      'Install notes = Install the build named above.',
    ]);
    expect(what()).toEqual([
      'Returned with a reason',
      'Submitted for academic review',
      'Draft saved',
    ]);
    expect(notes()).toEqual([
      'Academic Reviewer: “The AR install notes don’t say which phones and tablets it runs on…”',
      'With the Academic Reviewer. Nothing is published.',
      'Only you can see a draft.',
    ]);
  });
});

describe('VE-07 — read-only states (B5-06 f5, f8, f9)', () => {
  it('f5 with the Content Manager: approved on the day, nothing is needed; the outcomes', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    show(runtime, 'SUB-0074');
    await title('Transient Cooling');
    expect(chip()).toHaveTextContent('With Content Manager');
    expect(chip()).toHaveClass('xr-status--wait');
    expect(text(banner()!.querySelector('.xr-notice-title'))).toBe('With the Content Manager');
    expect(banner()).toHaveTextContent(
      'Approved by the Academic Reviewer on 14 Aug 2026. The Content Manager decides whether to publish it. Nothing is needed from you now.',
    );
    const outcomes = region('Learning outcomes');
    expect(outcomes).toHaveTextContent('One set for every format.');
    expect([...outcomes.querySelectorAll('ul.xv-los li')].map((item) => text(item))).toEqual([
      'Decide when the lumped-capacitance model applies, using the Biot number.',
      'Estimate a heat transfer coefficient from a measured cooling curve.',
    ]);
    expect(what()).toEqual([
      'Approved by the Academic Reviewer',
      'Submitted for academic review',
      'Draft saved',
    ]);
    expect(notes()[0]).toBe('With the Content Manager.');
    expect(links()).toEqual(['My experiments']);
    expect(screen.queryAllByRole('button', { name: /withdraw|publish|update|format/i })).toEqual(
      [],
    );
  });

  it('f9 a draft whose course is no longer assigned: Draft · read-only, no Edit draft', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    show(runtime, 'SUB-0083');
    await title('Surface Roughness in Turning');
    await waitFor(() => expect(overline()).toBe('SUB-0083 · MEL ZG512'));
    expect(chip()).toHaveTextContent('Draft · read-only');
    expect(chip()).toHaveClass('xr-status--paused');
    expect(banner()).toHaveClass('xr-notice--warn');
    expect(text(banner()!.querySelector('.xr-notice-title'))).toBe(
      'MEL ZG512 is no longer assigned to you',
    );
    expect(banner()).toHaveTextContent(
      'Withdrawn from Northline Simulation Studio. This draft is kept, read-only. BITS / WILP decides which courses are yours.',
    );
    expect(detailsRows()[0]).toBe('Course = MEL ZG512 · Manufacturing Processes');
    expect(links()).toEqual(['My experiments']);
  });

  it('f8 published: the day, the formats published, read-only; no catalogue link', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    show(runtime, 'SUB-0052');
    await title('Fin-Tube Bundle');
    expect(chip()).toHaveTextContent('Published');
    expect(chip()).toHaveClass('xr-status--ok');
    expect(banner()).toHaveClass('xr-notice--ok');
    expect(text(banner()!.querySelector('.xr-notice-title'))).toBe('Published · 30 Jul 2026');
    expect(banner()).toHaveTextContent(
      'It is live in the catalogue with the formats below. It is read-only here.',
    );
    expect(text(details().querySelector('p.xl-meta'))).toBe(
      'Formats published: WEB · VR. Changes to a published experiment are not made from the Vendor workspace.',
    );
    expect(what()[0]).toBe('Published by the Content Manager');
    expect(notes()[0]).toBe('WEB and VR are live in the catalogue.');
    expect(links()).toEqual(['My experiments']);
  });
});

describe('VE-07 — Flow E on one world (SUB-0077)', () => {
  it('saved, submitted (f2), returned (f3), resubmitted — “Submitted” (f4), with the CM, published (B6-12 f4)', async () => {
    const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
    show(runtime, 'SUB-0077');
    // Before the first save it does not exist.
    await title('Experiment record');
    expect(
      await screen.findByRole('heading', { level: 2, name: 'We can’t find that experiment' }),
    ).toBeVisible();

    at(sample, '2026-10-06T12:10:00.000Z'); // 6 Oct 2026, 17:40
    const saved = await as(runtime, sample, ANIL, (ports) =>
      ports.production.saveDraft({
        id: null,
        content: compositeWall('VR headset'),
        step: 'course',
        expectedRev: null,
      }),
    );
    expect((saved as { id: string }).id).toBe('SUB-0077');
    await title('Conduction Through a Composite Wall');
    expect(chip()).toHaveTextContent('Draft');
    expect(what()).toEqual(['Draft saved']);

    at(sample, '2026-10-07T05:22:00.000Z'); // 7 Oct 2026, 10:52
    const draft = saved as { id: SubmissionId; rev: number };
    await as(runtime, sample, ANIL, (ports) =>
      ports.production.submitForReview({
        id: draft.id,
        content: compositeWall('VR headset'),
        expectedRev: draft.rev,
      }),
    );
    await waitFor(() => expect(chip()).toHaveTextContent('With Academic Reviewer'));
    expect(overline()).toBe('SUB-0077 · ME ZG523');
    expect(text(banner()!.querySelector('.xr-notice-title'))).toBe('With the Academic Reviewer');
    expect(banner()).toHaveTextContent(
      'Nothing is needed from you now. You can edit it again only if it is returned to you.',
    );
    expect(what()).toEqual(['Submitted for academic review', 'Draft saved']);
    expect(historyRegion()).toHaveTextContent('7 Oct 2026, 10:52');
    expect(links()).toEqual(['My experiments']);

    at(sample, '2026-10-14T10:35:00.000Z'); // 14 Oct 2026, 16:05
    let review = ok(
      await asPersonId(sample, MENON).production.getSubmissionForReview(draft.id),
    ).submission;
    await as(runtime, sample, MENON, (ports) =>
      ports.production.returnSubmission({
        id: draft.id,
        reason: 'Please clarify the VR device requirements.',
        references: [{ step: 'formats-and-delivery', format: 'vr', field: 'device-need' }],
        outcomes: OUTCOMES,
        expectedRev: review.rev,
      }),
    );
    await waitFor(() => expect(chip()).toHaveTextContent('Returned'));
    const reason = main().querySelector('section.xv-reason')!;
    expect(text(reason.querySelector('.xr-meta'))).toBe('14 Oct 2026, 16:05 · Prof. A. Menon');
    expect([...reason.querySelectorAll('li.xv-ref')].map((item) => text(item))).toEqual([
      'Formats & delivery · VR · Device need',
    ]);
    expect(notes()[0]).toBe('Academic Reviewer: “Please clarify the VR device requirements.”');
    // The outcomes travel with the return (OD-B6-04).
    expect(
      [...region('Learning outcomes').querySelectorAll('ul.xv-los li')].map((item) => text(item)),
    ).toEqual(OUTCOMES);

    at(sample, '2026-10-21T06:00:00.000Z'); // 21 Oct 2026, 11:30
    let current = ok(await asPersonId(sample, ANIL).production.getRecord(draft.id)).submission;
    await as(runtime, sample, ANIL, (ports) =>
      ports.production.resubmit({
        id: draft.id,
        content: compositeWall(VR_DEVICE_REVISED),
        expectedRev: current.rev,
      }),
    );
    // Routed back to the Academic Reviewer at once (PC-66) — the Vendor reads “Submitted” (f4).
    current = ok(await asPersonId(sample, ANIL).production.getRecord(draft.id)).submission;
    expect(current.status).toMatchObject({
      state: 'with-academic-reviewer',
      reason: 'resubmission',
    });
    await waitFor(() => expect(chip()).toHaveTextContent('Submitted'));
    expect(chip()).toHaveClass('xr-status--info');
    expect(overline()).toBe('SUB-0077 · ME ZG523 · revision 2');
    expect(text(banner()!.querySelector('.xr-notice-title'))).toBe('Submitted');
    expect(banner()).toHaveTextContent(
      'Your changes have been submitted for review. Nothing is needed from you now.',
    );
    expect(what()).toEqual([
      'Submitted · revision 2',
      'Returned with a reason',
      'Submitted for academic review',
      'Draft saved',
    ]);
    expect(notes()[0]).toBe('Your changes have been submitted for review.');
    expect(main()).not.toHaveTextContent('Routed by the approved workflow rule.');
    expect(banner()).not.toHaveTextContent('Academic Reviewer');
    expect(chip()).not.toHaveTextContent('Academic Reviewer');
    expect(main().querySelector('section.xv-reason')).toBeNull();
    expect(details()).toHaveTextContent(VR_DEVICE_REVISED);
    expect(links()).toEqual(['My experiments']);

    at(sample, '2026-10-22T09:50:00.000Z'); // 22 Oct 2026, 15:20
    review = ok(
      await asPersonId(sample, MENON).production.getSubmissionForReview(draft.id),
    ).submission;
    await as(runtime, sample, MENON, (ports) =>
      ports.production.approveSubmission({
        id: draft.id,
        outcomes: OUTCOMES,
        expectedRev: review.rev,
      }),
    );
    await waitFor(() => expect(chip()).toHaveTextContent('With Content Manager'));
    expect(banner()).toHaveTextContent('Approved by the Academic Reviewer on 22 Oct 2026.');
    // Once it moved on, the routing reads as f0 draws it.
    expect(what()).toEqual([
      'Approved by the Academic Reviewer',
      'With Academic Reviewer · revision 2',
      'Submitted · revision 2',
      'Returned with a reason',
      'Submitted for academic review',
      'Draft saved',
    ]);
    expect(notes()[1]).toBe('Routed by the approved workflow rule.');

    at(sample, '2026-10-23T04:35:00.000Z'); // 23 Oct 2026, 10:05
    current = ok(await asPersonId(sample, ANIL).production.getRecord(draft.id)).submission;
    await as(runtime, sample, KAVYA, (ports) =>
      ports.production.publish({ id: draft.id, expectedRev: current.rev }),
    );
    await waitFor(() => expect(chip()).toHaveTextContent('Published'));
    expect(text(banner()!.querySelector('.xr-notice-title'))).toBe('Published · 23 Oct 2026');
    expect(text(details().querySelector('p.xl-meta'))).toBe(
      'Formats published: WEB · VR. Changes to a published experiment are not made from the Vendor workspace.',
    );
    expect(what()[0]).toBe('Published by the Content Manager');
    expect(notes()[0]).toBe('WEB and VR are live in the catalogue.');
    expect(links()).toEqual(['My experiments']);
  });

  it('f6 returned by the Content Manager: her reason, what it refers to, Revise & resubmit', async () => {
    const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
    show(runtime, 'SUB-0074');
    await title('Transient Cooling');
    const current = ok(
      await asPersonId(sample, ANIL).production.getRecord('SUB-0074' as SubmissionId),
    ).submission;
    await as(runtime, sample, KAVYA, (ports) =>
      ports.production.sendBack({
        id: current.id,
        to: 'vendor',
        reason:
          'The summary runs to three sentences. Shorten it to one; the catalogue shows only the first line.',
        references: [{ step: 'course-and-description', format: null, field: 'summary' }],
        expectedRev: current.rev,
      }),
    );
    await waitFor(() => expect(chip()).toHaveTextContent('Returned'));
    const reason = main().querySelector('section.xv-reason') as HTMLElement;
    expect(within(reason).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Returned by the Content Manager',
    );
    expect(text(reason.querySelector('.xr-meta'))).toMatch(/ · Kavya Nair$/);
    expect([...reason.querySelectorAll('li.xv-ref')].map((item) => text(item))).toEqual([
      'Course & description · Summary',
    ]);
    expect(screen.getByRole('link', { name: 'Revise & resubmit' })).toHaveAttribute(
      'href',
      '/vendor/experiments/SUB-0074/revise',
    );
    expect(what()[0]).toBe('Returned with a reason');
    expect(notes()[0]).toBe('Content Manager: “The summary runs to three sentences…”');
  });

  it('f7 back with the Academic Reviewer for a re-check: nothing is needed; her reason is not shown', async () => {
    const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
    show(runtime, 'SUB-0074');
    await title('Transient Cooling');
    const current = ok(
      await asPersonId(sample, ANIL).production.getRecord('SUB-0074' as SubmissionId),
    ).submission;
    await as(runtime, sample, KAVYA, (ports) =>
      ports.production.sendBack({
        id: current.id,
        to: 'academic-reviewer',
        reason: 'Please check the second outcome against the description.',
        expectedRev: current.rev,
      }),
    );
    await waitFor(() =>
      expect(text(banner()!.querySelector('.xr-notice-title'))).toBe(
        'Back with the Academic Reviewer for a re-check',
      ),
    );
    expect(chip()).toHaveTextContent('With Academic Reviewer');
    expect(chip()).toHaveClass('xr-status--wait');
    expect(banner()).toHaveTextContent(
      'The Content Manager asked the Academic Reviewer to look at it again. Nothing is needed from you.',
    );
    expect(what()[0]).toBe('Back with the Academic Reviewer for a re-check');
    expect(notes()[0]).toBe('Sent back by the Content Manager. Nothing is needed from you.');
    expect(main()).not.toHaveTextContent('Please check the second outcome');
    expect(links()).toEqual(['My experiments']);
  });
});

describe('VE-13 History (`?tab=history`)', () => {
  it('lands on the record with focus on its history; the shell places it as VE-13', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    const { navigation } = show(runtime, 'SUB-0081', '?tab=history');
    await title('Forced Convection');
    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Submission and version history',
    });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(document.querySelector('.xr-top-title')?.textContent).toBe('Experiment record');
    expect(
      screen
        .getByRole('navigation', { name: 'Vendor navigation' })
        .querySelector('[aria-current="page"]'),
    ).toHaveAttribute('href', '/vendor/experiments');
  });

  it('any other tab value shows the record at its bare address', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    const { navigation } = show(runtime, 'SUB-0081', '?tab=details');
    await title('Forced Convection');
    expect(navigation.replace).toHaveBeenCalledWith('/vendor/experiments/SUB-0081');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Submission and version history' }),
    ).not.toHaveFocus();
  });

  it('the Vendor’s entries only: an override is the Super Admin’s; a resubmission’s routing waits', () => {
    const entry = (event: string, note: string | null, visibleTo: string[], instant: string) => ({
      id: `${event}-${instant}`,
      event,
      at: instant,
      actor: { kind: 'system', system: 'system:workflow-routing' },
      note,
      visibleTo,
      refs: [],
    });
    const staff = ['vendor', 'academic_reviewer', 'content_manager', 'super_admin'];
    const view = (status: unknown, history: unknown[]) =>
      ({
        submission: {
          id: 'SUB-0001',
          revision: 2,
          status,
          content: { formats: ['web'] },
          history,
        },
        guards: { courseNoLongerAssigned: false },
        lastReturn: null,
      }) as unknown as VendorRecordView;
    // The resubmitted state before routing (a build whose seam routes it later): “Submitted”.
    const resubmitted = view({ state: 'resubmitted', since: '2026-08-26T06:00:00.000Z' }, [
      entry('submitted', null, staff, '2026-08-12T05:22:00.000Z'),
      entry('resubmitted', '2', staff, '2026-08-26T06:00:00.000Z'),
    ]);
    expect(recordStateOf(resubmitted)).toBe('submitted');
    expect(historyEvents(resubmitted).map((event) => event.what)).toEqual([
      'Submitted · revision 2',
      'Submitted for academic review',
    ]);
    // Routed: still “Submitted”, the routing entry of this revision left out.
    const routed = view(
      {
        state: 'with-academic-reviewer',
        since: '2026-08-26T06:01:00.000Z',
        reason: 'resubmission',
      },
      [
        entry('resubmitted', '2', staff, '2026-08-26T06:00:00.000Z'),
        entry('routed', '2', staff, '2026-08-26T06:01:00.000Z'),
        entry('status-overridden', 'Stuck', ['super_admin'], '2026-08-27T06:01:00.000Z'),
      ],
    );
    expect(recordStateOf(routed)).toBe('submitted');
    expect(historyEvents(routed).map((event) => event.what)).toEqual(['Submitted · revision 2']);
    // A single format’s publication note, and three (state-copy VE-13.published-one).
    const published = (formats: string[]) =>
      historyEvents({
        ...view({ state: 'published', at: '2026-08-28T04:35:00.000Z', experimentId: 'x' }, [
          entry('published', null, staff, '2026-08-28T04:35:00.000Z'),
        ]),
        submission: {
          ...view({ state: 'published' }, []).submission,
          content: { formats },
          history: [entry('published', null, staff, '2026-08-28T04:35:00.000Z')],
        },
      } as unknown as VendorRecordView)[0]!.note;
    expect(published(['web'])).toBe('WEB is live in the catalogue.');
    expect(published(['vr', 'web', 'ar'])).toBe('WEB, AR and VR are live in the catalogue.');
  });
});

describe('VE-07 — not found, not permitted, policy-open, loading and failed (undrawn)', () => {
  it.each([
    ['an unknown id', 'SUB-9999'],
    ['another vendor’s record (Meridian’s SUB-0086)', 'SUB-0086'],
  ])('%s: “We can’t find that experiment”, nothing of the record', async (_, id) => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    show(runtime, id);
    await title('Experiment record');
    const calm = (
      await screen.findByRole('heading', { level: 2, name: 'We can’t find that experiment' })
    ).closest('.xr-empty');
    expect(calm).toHaveTextContent(
      'It isn’t one of your experiments, or the address is wrong. Your experiments are in My experiments.',
    );
    expect(main()).not.toHaveTextContent('Flash Distillation');
    expect(links()).toEqual(['My experiments']);
  });

  it('a colleague’s record (policy-open SUB-15): a calm state', async () => {
    const { runtime } = await tabPlatform(ANIL, 'spine-start');
    vi.spyOn(runtime.ports.production, 'getRecord').mockResolvedValue({
      ok: false,
      error: { kind: 'policy-open', decision: 'SUB-15' },
    } as never);
    show(runtime, 'SUB-0099');
    await title('Experiment record');
    const calm = (
      await screen.findByRole('heading', {
        level: 2,
        name: 'This experiment was created by a colleague',
      })
    ).closest('.xr-empty');
    expect(calm).toHaveTextContent(
      'Opening a colleague’s experiment isn’t settled yet. Your own experiments are in My experiments.',
    );
  });

  it('announces loading; a failed read has Try again, which reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(ANIL, 'spine-start');
    faults(sample).failNext('ProductionService.getRecord');
    renderInTab(<ExperimentRecord submissionId="SUB-0081" />, {
      runtime,
      navigation: testNavigation('/vendor/experiments/SUB-0081'),
    });
    expect(document.querySelector('[aria-busy="true"] [role="status"]')).toHaveTextContent(
      'Loading the experiment record',
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Experiment record');
    const failed = await screen.findByRole('heading', {
      level: 2,
      name: 'We couldn’t load the experiment record',
    });
    expect(failed.closest('.xr-empty')).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await title('Forced Convection')).toBeVisible();
  });
});

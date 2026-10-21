/**
 * The presentation models every Academic Reviewer screen group reads (RV-v1: the script's `kindOf`,
 * `standing`, `ageOf`, `parentOf`; COMPONENT-EXTENSIONS "course codes always with names"): the
 * review type, where a record stands, the course names, the waiting age, the breadcrumb's parent
 * and the identifier check — run on the records the sample platform's services answer Prof. A.
 * Menon (the Academic Reviewer) in the sample worlds (spine-start, after Flow E, after Flow F) and
 * after the commands that put a resubmission and an update in her queue.
 */
import type { IsoInstant, SubmissionId, UpdateId } from '@xr/domain';
import { asPersonId, type FixtureName, standinsOf } from '@xr/sample-platform/testing';
import { act, render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  reviewerParentCrumb,
  reviewSubmissionPlacement,
  reviewUpdatePlacement,
} from '@/nav/reviewer';
import { documentWords } from '@/features/shared/workspace-frame/workspace-frame';
import { tabPlatform, renderInTab, testNavigation } from '@/test-support/workspace';

import { courseNamesOf, useRvCourseNames } from './course-names';
import { queueItemKind, reviewedRowKind, submissionKind, updateKind } from './kind';
import { rvBackOf, useRvParent } from './parent';
import { internalReferencesIn } from './references';
import {
  reviewedRowStanding,
  submissionStanding,
  updateRecordStanding,
  updateStanding,
} from './standing';
import { daysWaiting, useRvToday, useRvTodayLine, waitingAge } from './waiting';

const MENON = 'per-a-menon';
const ANIL = 'per-anil-shetty';
const KAVYA = 'per-kavya-nair';

type Sample = Awaited<ReturnType<typeof tabPlatform>>['sample'];

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

function moveClock(sample: Sample, instant: string) {
  standinsOf(sample).clock.setSampleNow(instant as IsoInstant);
}

async function asMenon(fixture: FixtureName) {
  const { sample, runtime } = await tabPlatform(MENON, fixture);
  return { sample, runtime, ports: asPersonId(sample, MENON) };
}

/** Composite Wall as the vendor sends it (the reviewer-review set-up, B5-03 … B5-05). */
function compositeWall(vrDevice: string) {
  return {
    courseId: 'thermodynamics-heat-transfer',
    name: 'Conduction Through a Composite Wall',
    summary: 'Measure the temperature profile across a three-layer wall.',
    description: 'Learners build a wall from three layers.',
    version: '1.0',
    formats: ['web', 'vr'],
    delivery: {
      web: {
        format: 'web',
        webLink: 'https://labs.northline.example/composite-wall',
        browserAndComputer: 'A current browser on a laptop or desktop',
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

/** Composite Wall submitted, returned by the reviewer, revised and resubmitted: revision 2 waits. */
async function resubmitted() {
  const { sample, runtime, ports } = await asMenon('spine-start');
  const vendor = asPersonId(sample, ANIL);
  moveClock(sample, '2026-08-12T05:22:00.000Z');
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
  moveClock(sample, '2026-08-19T10:35:00.000Z');
  const view = ok(await ports.production.getSubmissionForReview(draft.id));
  ok(
    await ports.production.returnSubmission({
      id: draft.id,
      reason: 'Please clarify the VR device requirements.',
      references: [{ step: 'formats-and-delivery', format: 'vr', field: 'device-need' }],
      outcomes: [],
      expectedRev: view.submission.rev,
    } as never),
  );
  moveClock(sample, '2026-08-26T06:00:00.000Z');
  const record = ok(await vendor.production.getRecord(draft.id));
  const saved = ok(
    await vendor.production.saveRevision({
      id: draft.id,
      content: compositeWall('Standalone VR headset'),
      expectedRev: record.submission.rev,
    } as never),
  );
  ok(
    await vendor.production.resubmit({
      id: draft.id,
      content: compositeWall('Standalone VR headset'),
      expectedRev: saved.rev,
    } as never),
  );
  return { sample, runtime, ports, id: draft.id as string };
}

/** Distillation Column 1.2 → 1.3, sent by the Content Manager for academic review. */
async function updateInReview() {
  const { sample, runtime, ports } = await asMenon('spine-start');
  const cm = asPersonId(sample, KAVYA);
  moveClock(sample, '2026-08-25T10:10:00.000Z');
  const opened = ok(
    await cm.corrections.openCorrection({
      experimentId: 'distillation-column' as never,
      entry: 'edit-catalogue-details',
    }),
  );
  const saved = ok(
    await cm.corrections.saveCorrection({
      id: opened.update.id,
      proposed: { ...opened.update.proposed, description: 'Raising the reflux ratio …' },
      whatChangesAndWhy: 'Corrects the reflux statement in the description.',
      versionLabel: '1.3',
      expectedRev: opened.update.rev,
    } as never),
  );
  moveClock(sample, '2026-08-25T10:30:00.000Z');
  ok(await cm.corrections.sendForAcademicReview({ id: saved.id, expectedRev: saved.rev }));
  return { sample, runtime, ports, id: saved.id as string };
}

describe('the review type (RvKindTag: the script’s `kindOf`)', () => {
  it('spine-start’s queue: a new submission without outcomes, and a re-check', async () => {
    const { ports } = await asMenon('spine-start');
    const overview = ok(await ports.production.getReviewerOverview());
    expect(overview.waiting.map((item) => [item.name, queueItemKind(item)])).toEqual([
      ['Flash Distillation', { kind: 'new', label: 'New submission', detail: null }],
      ['Venturi Meter Calibration', { kind: 'recheck', label: 'Re-check', detail: null }],
    ]);
    const recheck = ok(await ports.production.getSubmissionForReview('SUB-0071' as SubmissionId));
    expect(submissionKind(recheck.submission)).toEqual({
      kind: 'recheck',
      label: 'Re-check',
      detail: null,
    });
    const fresh = ok(await ports.production.getSubmissionForReview('SUB-0086' as SubmissionId));
    expect(submissionKind(fresh.submission).kind).toBe('new');
  });

  it('a resubmission: “Resubmitted · revision 2” on the queue row and on its page', async () => {
    const { ports, id } = await resubmitted();
    const queue = ok(await ports.production.getReviewQueue({}));
    const item = queue.find((entry) => entry.ref.id === id)!;
    expect(item.subLine).toBe('Resubmitted · revision 2');
    expect(queueItemKind(item)).toEqual({
      kind: 'resub',
      label: 'Resubmitted',
      detail: 'revision 2',
    });
    const view = ok(await ports.production.getSubmissionForReview(id as SubmissionId));
    expect(submissionKind(view.submission)).toEqual(queueItemKind(item));
  });

  it('an update: “Update · 1.2 → 1.3” on the queue row and on its page', async () => {
    const { ports, id } = await updateInReview();
    const queue = ok(await ports.production.getReviewQueue({ type: 'update' }));
    const item = queue.find((entry) => entry.ref.id === id)!;
    expect(queueItemKind(item)).toEqual({ kind: 'update', label: 'Update', detail: '1.2 → 1.3' });
    const view = ok(await ports.corrections.getUpdateForReview(id as UpdateId));
    expect(updateKind(view.update)).toEqual(queueItemKind(item));
    // Without a proposed version label, the plain kind (the queue's words end at the arrow).
    expect(updateKind({ baseVersionLabel: '1.2', versionLabel: null })).toEqual({
      kind: 'update',
      label: 'Update',
      detail: null,
    });
    expect(
      queueItemKind({ type: 'update', subLine: 'Correction to the live version 1.2 →' }),
    ).toEqual({ kind: 'update', label: 'Update', detail: null });
  });

  it('Reviewed by me after Flow E: each decision as the item was when decided', async () => {
    const { ports } = await asMenon('after-flow-e');
    const rows = ok(await ports.production.listReviewedByMe());
    expect(rows.map((row) => [row.name, reviewedRowKind(row)])).toEqual([
      [
        'Conduction Through a Composite Wall',
        { kind: 'resub', label: 'Resubmitted', detail: 'revision 2' },
      ],
      // An update's row holds no versions: the plain kind.
      ['Distillation Column', { kind: 'update', label: 'Update', detail: null }],
      ['Forced Convection', { kind: 'new', label: 'New submission', detail: null }],
      ['Packed Bed Pressure Drop', { kind: 'new', label: 'New submission', detail: null }],
      ['Venturi Meter Calibration', { kind: 'new', label: 'New submission', detail: null }],
      ['Transient Cooling', { kind: 'new', label: 'New submission', detail: null }],
      ['Boiler Drum Level', { kind: 'update', label: 'Update', detail: null }],
      ['Orifice Plate Metering', { kind: 'update', label: 'Update', detail: null }],
      ['Fin-Tube Bundle', { kind: 'new', label: 'New submission', detail: null }],
      ['Distillation Column', { kind: 'update', label: 'Update', detail: null }],
      ['Distillation Column', { kind: 'update', label: 'Update', detail: null }],
    ]);
    // A decision taken on a re-check reads as one.
    expect(reviewedRowKind({ type: 'recheck', decision: { revision: 1 } }).kind).toBe('recheck');
  });
});

describe('where a record stands (the script’s `standing`)', () => {
  it('spine-start’s Reviewed by me: nine decisions, a hold never shown (UPD-0006 out of scope)', async () => {
    const { ports } = await asMenon('spine-start');
    const rows = ok(await ports.production.listReviewedByMe());
    expect(
      rows.map((row) => {
        const standing = reviewedRowStanding(row)!;
        return [row.name, standing.tone, standing.label, standing.now];
      }),
    ).toEqual([
      ['Forced Convection', 'err', 'Returned to vendor', 'With the vendor to revise'],
      [
        'Packed Bed Pressure Drop',
        'ok',
        'Approved — with the Content Manager',
        'With the Content Manager · not published',
      ],
      [
        'Venturi Meter Calibration',
        'info',
        'Waiting for your decision',
        'Back in your queue for a re-check',
      ],
      [
        'Transient Cooling',
        'ok',
        'Approved — with the Content Manager',
        'With the Content Manager · not published',
      ],
      // UPD-0004 is on hold: the reviewer reads it as with the Super Admin.
      [
        'Boiler Drum Level',
        'ok',
        'Approved — with the Super Admin',
        'With the Super Admin for a release decision',
      ],
      ['Orifice Plate Metering', 'ok', 'Approved — released', 'Released by the Super Admin'],
      ['Fin-Tube Bundle', 'ok', 'Approved — published', 'Published on 30 Jul 2026'],
      ['Distillation Column', 'ok', 'Approved — released', 'Released by the Super Admin'],
      ['Distillation Column', 'ok', 'Approved — released', 'Released by the Super Admin'],
    ]);
    expect(rows.some((row) => row.name === 'Induction Motor Loading')).toBe(false);
  });

  it('after Flow E: the resubmission published, the update with the Super Admin', async () => {
    const { ports } = await asMenon('after-flow-e');
    const rows = ok(await ports.production.listReviewedByMe());
    expect(rows.slice(0, 2).map((row) => reviewedRowStanding(row)!.now)).toEqual([
      'Published on 23 Oct 2026',
      'With the Super Admin for a release decision',
    ]);
  });

  it('after Flow F: a released update’s page names its date and the version live', async () => {
    const { ports } = await asMenon('after-flow-f');
    const rows = ok(await ports.production.listReviewedByMe());
    const update = rows.find((row) => row.type === 'update')!;
    expect(reviewedRowStanding(update)!.now).toBe('Released by the Super Admin');
    const view = ok(await ports.corrections.getUpdateForReview(update.recordRef.id as UpdateId));
    expect(view.update.state).toBe('released');
    expect(updateRecordStanding(view.update)).toEqual({
      key: 'released',
      tone: 'ok',
      label: 'Approved — released',
      now: `Released on ${new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
        .format(new Date(view.update.release!.at))
        .replace('Sept', 'Sep')} · version ${view.update.versionLabel} is live`,
    });
  });

  it('a waiting resubmission names its revision on its page; the list row says “In your queue”', async () => {
    const { ports, id } = await resubmitted();
    const view = ok(await ports.production.getSubmissionForReview(id as SubmissionId));
    expect(submissionStanding(view.submission.status, view.submission.revision)).toEqual({
      key: 'waiting',
      tone: 'info',
      label: 'Waiting for your decision',
      now: 'Revision 2 is in your queue',
    });
    expect(submissionStanding(view.submission.status)!.now).toBe('In your queue');
  });

  it('an update waiting, returned, withdrawn — and a draft is never the reviewer’s', async () => {
    const { ports, id } = await updateInReview();
    const view = ok(await ports.corrections.getUpdateForReview(id as UpdateId));
    expect(updateRecordStanding(view.update)).toEqual({
      key: 'waiting',
      tone: 'info',
      label: 'Waiting for your decision',
      now: 'In your queue',
    });
    expect(updateStanding('returned')).toEqual({
      key: 'returned',
      tone: 'err',
      label: 'Returned to the Content Manager',
      now: 'With the Content Manager',
    });
    expect(updateStanding('withdrawn')).toEqual({
      key: 'withdrawn',
      tone: 'ended',
      label: 'Withdrawn by the Content Manager',
      now: 'Withdrawn by the Content Manager',
    });
    expect(updateStanding('draft')).toBeNull();
    expect(submissionStanding({ state: 'draft' })).toBeNull();
  });
});

describe('course names (one catalogue read)', () => {
  it('names every course of the reviewer’s scope from the public catalogue', async () => {
    const { ports } = await asMenon('spine-start');
    const overview = ok(await ports.production.getReviewerOverview());
    const catalogue = ok(await ports.catalogue.searchCatalogue({ sort: 'default' }));
    const names = courseNamesOf(catalogue.entries);
    expect(overview.scopeLine.map((code) => [code, names.get(code)])).toEqual([
      ['ME ZG523', 'Thermodynamics & Heat Transfer'],
      ['MEL ZG512', 'Manufacturing Processes'],
      ['CHE ZG513', 'Process Instrumentation & Control'],
    ]);
  });

  it('the hook answers once the catalogue has, and a code alone before (or when unknown)', async () => {
    const { runtime } = await asMenon('spine-start');
    function Probe() {
      const nameOf = useRvCourseNames();
      return (
        <p>{['CHE ZG513', 'XYZ 000', null].map((code) => `${code}=${nameOf(code)}`).join('; ')}</p>
      );
    }
    renderInTab(<Probe />, { runtime, navigation: testNavigation('/reviewer') });
    expect(
      await screen.findByText(
        'CHE ZG513=Process Instrumentation & Control; XYZ 000=null; null=null',
      ),
    ).toBeInTheDocument();
  });
});

describe('the waiting age (the script’s `ageOf`, on the session clock)', () => {
  it('whole days in Indian time, from the day it arrived to today', async () => {
    const { ports } = await asMenon('spine-start');
    const overview = ok(await ports.production.getReviewerOverview());
    const today = '2026-08-27T06:00:00.000Z'; // 27 Aug 2026, 11:30
    expect(overview.waiting.map((item) => waitingAge(item.waitingSince, today))).toEqual([
      { days: 3, age: '3 days', day: '24 Aug', since: 'since 24 Aug' },
      { days: 2, age: '2 days', day: '25 Aug', since: 'since 25 Aug' },
    ]);
    expect(waitingAge('2026-08-26T06:00:00.000Z', today).age).toBe('1 day');
    expect(waitingAge('2026-08-27T01:00:00.000Z', today).age).toBe('Today');
    // 23:00 IST on 26 Aug is the 26th in Indian time, whatever the browser's zone.
    expect(daysWaiting('2026-08-26T17:30:00.000Z', today)).toBe(1);
    expect(daysWaiting(today, '2026-08-20T00:00:00.000Z')).toBe(0);
  });

  it('today is the session’s sign-in instant', async () => {
    const { runtime } = await asMenon('spine-start');
    function Probe() {
      return (
        <p>
          {useRvToday()} | {useRvTodayLine()}
        </p>
      );
    }
    renderInTab(<Probe />, { runtime, navigation: testNavigation('/reviewer') });
    const snapshot = runtime.session.getSnapshot();
    expect(snapshot.status).toBe('signed-in');
    const signedInAt = snapshot.status === 'signed-in' ? snapshot.signedInAt : '';
    expect(
      screen.getByText(new RegExp(`^${signedInAt} \\| \\w+day \\d+ \\w+ 2026$`)),
    ).toBeVisible();
  });
});

describe('the breadcrumb’s parent and the item’s place (the script’s `parentOf`)', () => {
  it('waiting → the Review queue, decided → Reviewed by me; deciding on the page keeps the queue', () => {
    const { result, rerender } = renderHook(
      ({ id, waiting }: { id: string; waiting: boolean | null }) => useRvParent(id, waiting),
      { initialProps: { id: 'SUB-0077', waiting: null as boolean | null } },
    );
    expect(result.current).toBeNull();
    rerender({ id: 'SUB-0077', waiting: true });
    expect(result.current).toBe('queue');
    // Decided on this page: still under the queue.
    rerender({ id: 'SUB-0077', waiting: false });
    expect(result.current).toBe('queue');
    // Another item, already decided: under Reviewed by me.
    rerender({ id: 'SUB-0074', waiting: false });
    expect(result.current).toBe('reviewed');
    expect(rvBackOf('queue')).toEqual({
      label: 'Back to the review queue',
      href: '/reviewer/queue',
    });
    expect(rvBackOf('reviewed')).toEqual({
      label: 'Back to Reviewed by me',
      href: '/reviewer/reviewed',
    });
  });

  it('the placement names the experiment — breadcrumb, browser tab — never the reference', () => {
    const waiting = reviewSubmissionPlacement({
      name: 'Flash Distillation',
      decided: false,
      parent: 'queue',
    });
    expect(waiting).toEqual({
      screen: 'RV-03',
      title: 'Review queue',
      trail: [reviewerParentCrumb('queue')],
      currentCrumb: 'Flash Distillation',
    });
    expect(documentWords(waiting)).toBe('Flash Distillation · Review queue');
    const decided = reviewSubmissionPlacement({ name: 'Transient Cooling', decided: true });
    expect(decided.screen).toBe('RV-06');
    expect(decided.trail).toEqual([{ label: 'Reviewed by me', href: '/reviewer/reviewed' }]);
    expect(documentWords(decided)).toBe('Transient Cooling · Reviewed by me');
    const update = reviewUpdatePlacement({ name: 'Distillation Column', decided: false });
    expect(update).toEqual({
      screen: 'RV-04',
      title: 'Review queue',
      trail: [{ label: 'Review queue', href: '/reviewer/queue' }],
      currentCrumb: 'Distillation Column',
    });
    expect(reviewUpdatePlacement(null)).toEqual({
      screen: 'RV-04',
      title: 'Review queue',
      trail: [],
    });
    for (const placement of [waiting, decided, update]) {
      expect(JSON.stringify(placement)).not.toMatch(/\b(?:SUB|UPD)-\d+/);
    }
  });
});

describe('the identifier check (lead decision 4)', () => {
  it('finds references in text, hidden text, names and fields — except a person’s quoted words', () => {
    render(
      <main>
        <h1>Distillation Column</h1>
        <p>Correction UPD-0005.</p>
        <span className="xr-sr">SUB-0077</span>
        <button
          type="button"
          data-href="/reviewer/updates/UPD-0005"
          aria-label="Review the update to Distillation Column"
        >
          Review
        </button>
        <button type="button" title="REQ-0042">
          Open
        </button>
        <input readOnly value="Review queue › SUB-0070" aria-label="Where" />
      </main>,
    );
    const main = screen.getByRole('main');
    expect(internalReferencesIn(main, ['Correction UPD-0005.'])).toEqual([
      'text: SUB-0077',
      'title: REQ-0042',
      'value: SUB-0070',
      'field: SUB-0070',
    ]);
    // Addresses keep their references: an address attribute is not read.
    act(() => main.querySelector('span')!.remove());
    act(() => main.querySelector('button[title]')!.remove());
    act(() => main.querySelector('input')!.remove());
    expect(internalReferencesIn(main, ['Correction UPD-0005.'])).toEqual([]);
    expect(internalReferencesIn(main)).toEqual(['text: UPD-0005']);
  });
});

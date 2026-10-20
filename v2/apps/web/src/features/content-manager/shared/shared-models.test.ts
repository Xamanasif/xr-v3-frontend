/**
 * The presentation models more than one Content Manager screen group reads (CM-v1
 * COMPONENT-EXTENSIONS A, D and "Status mapping used"): the status pill of a submission and of a
 * correction, the stage track of each and a correction's version change — run on the records the
 * sample platform's services answer Kavya Nair (the Content Manager), as they stand in the sample
 * worlds and after her own commands (send back, open, send, withdraw). Dates are the records' own,
 * in the sample world's day ("27 Aug").
 */
import type { CorrectionUpdate, SubmissionId, UpdateId } from '@xr/domain';
import { asPersonId, type FixtureName } from '@xr/sample-platform/testing';
import type { CmStep } from '@xr/ui/v3';
import { describe, expect, it } from 'vitest';

import { dayMonth } from '@/copy/dates';
import { tabPlatform } from '@/test-support/workspace';

import { cmActorName, lastApproval } from './records';
import { CM_STAGE_STATE_WORDS, correctionStages, submissionStages } from './stages';
import { cmSubmissionPill, cmUpdatePill, cmUpdateTone } from './status';
import { correctionVersionChange, liveVersionOnly } from './version-change';

const KAVYA = 'per-kavya-nair';

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

async function asKavya(fixture: FixtureName) {
  const { sample } = await tabPlatform(KAVYA, fixture);
  return asPersonId(sample, KAVYA);
}

type Ports = Awaited<ReturnType<typeof asKavya>>;

async function decisionOf(ports: Ports, id: string) {
  return ok(await ports.production.getPublicationDecision(id as SubmissionId));
}

async function updateOf(ports: Ports, id: string): Promise<CorrectionUpdate> {
  const rows = ok(await ports.corrections.listUpdates({}));
  const row = rows.find((entry) => entry.update.id === id);
  if (!row) throw new Error(`${id} is not listed`);
  return row.update;
}

/** A track as rows: who, what, when (or null), state, the icon override (or null). */
function rows(steps: readonly CmStep[]) {
  return steps.map((step) => [
    step.who,
    step.what,
    step.when ?? null,
    step.state,
    step.icon ?? null,
  ]);
}

describe('a submission’s status and stage track (CM-03 band)', () => {
  it('ready to publish: the two done stages with their dates and reviewer, then your step; checks not met first', async () => {
    const ports = await asKavya('spine-start');
    const view = await decisionOf(ports, 'SUB-0074');
    const blockers = view.check.filter((item) => !item.ok).length;
    expect(blockers).toBe(0);
    expect(cmSubmissionPill(view.submission.status, blockers)).toEqual({
      tone: 'info',
      words: 'Ready to publish',
    });
    expect(rows(submissionStages(view.submission, blockers))).toEqual([
      ['Vendor', 'Submitted', '6 Aug', 'done', null],
      ['Academic Reviewer', 'Approved', 'Prof. A. Menon · 14 Aug', 'done', null],
      ['You', 'Publication decision', 'Waiting since 14 Aug', 'you', null],
      ['Public catalogue', 'Listed', 'After you publish', 'next', null],
    ]);
    // With publication checks not met (B6-11 state 5), the step and the pill say so.
    expect(cmSubmissionPill(view.submission.status, 2)).toEqual({
      tone: 'err',
      words: 'Ready to publish · 2 to resolve',
    });
    expect(submissionStages(view.submission, 1)[2]!.when).toBe('1 thing to resolve first');
    expect(lastApproval(view.submission)).toEqual({
      by: 'Prof. A. Menon',
      at: '2026-08-14T09:40:00.000Z',
    });
  });

  it('in academic review, a re-check she asked for, and returned to the vendor by the reviewer', async () => {
    const ports = await asKavya('spine-start');
    const review = (await decisionOf(ports, 'SUB-0086')).submission;
    expect(cmSubmissionPill(review.status)).toEqual({ tone: 'info', words: 'In academic review' });
    expect(rows(submissionStages(review))).toEqual([
      ['Vendor', 'Submitted', '24 Aug', 'done', null],
      ['Academic Reviewer', 'In academic review', 'Since 24 Aug', 'now', null],
      ['You', 'Publication decision', 'After approval', 'next', null],
      ['Public catalogue', 'Listed', 'After you publish', 'next', null],
    ]);
    const recheck = (await decisionOf(ports, 'SUB-0071')).submission;
    expect(cmSubmissionPill(recheck.status)).toEqual({
      tone: 'info',
      words: 'Back with the Academic Reviewer',
    });
    expect(rows(submissionStages(recheck))).toEqual([
      ['Vendor', 'Submitted', '12 Aug', 'done', null],
      ['Academic Reviewer', 'Re-check you asked for', 'Since 25 Aug', 'now', null],
      ['You', 'Publication decision', 'Back here once approved again', 'next', null],
      ['Public catalogue', 'Listed', 'After you publish', 'next', null],
    ]);
    const returned = (await decisionOf(ports, 'SUB-0081')).submission;
    expect(cmSubmissionPill(returned.status)).toEqual({
      tone: 'neutral',
      words: 'With the vendor',
    });
    expect(rows(submissionStages(returned))).toEqual([
      ['Vendor', 'Revising', 'Returned 24 Aug by the Academic Reviewer', 'back', null],
      ['Academic Reviewer', 'Academic review', 'When it is resubmitted', 'next', null],
      ['You', 'Publication decision', 'After approval', 'next', null],
      ['Public catalogue', 'Listed', 'After you publish', 'next', null],
    ]);
  });

  it('sent back to the vendor by her: returned “by you”, on the day of her send back', async () => {
    const ports = await asKavya('spine-start');
    const before = (await decisionOf(ports, 'SUB-0070')).submission;
    ok(
      await ports.production.sendBack({
        id: before.id,
        to: 'vendor',
        reason: 'Add the supported phones and tablets to the AR install notes.',
        references: [],
        expectedRev: before.rev,
      }),
    );
    const after = (await decisionOf(ports, 'SUB-0070')).submission;
    expect(after.status.state).toBe('returned');
    if (after.status.state !== 'returned') return;
    expect(cmSubmissionPill(after.status)).toEqual({ tone: 'neutral', words: 'With the vendor' });
    expect(submissionStages(after)[0]).toEqual({
      key: 'vendor',
      who: 'Vendor',
      what: 'Revising',
      when: `Returned ${dayMonth(after.status.since)} by you`,
      state: 'back',
    });
  });

  it('published, first time and after a resubmission (its revision and the resubmission’s day)', async () => {
    const first = (await decisionOf(await asKavya('spine-start'), 'SUB-0052')).submission;
    expect(cmSubmissionPill(first.status)).toEqual({ tone: 'ok', words: 'Published' });
    expect(rows(submissionStages(first))).toEqual([
      ['Vendor', 'Submitted', '17 Jul', 'done', null],
      ['Academic Reviewer', 'Approved', 'Prof. A. Menon · 24 Jul', 'done', null],
      ['You', 'Published', '30 Jul', 'done', null],
      ['Public catalogue', 'Listed', 'Live now', 'done', null],
    ]);
    const second = (await decisionOf(await asKavya('after-flow-c'), 'SUB-0077')).submission;
    expect(rows(submissionStages(second))).toEqual([
      ['Vendor', 'Submitted', 'Revision 2 · 21 Oct', 'done', null],
      ['Academic Reviewer', 'Approved', 'Prof. A. Menon · 22 Oct', 'done', null],
      ['You', 'Published', '23 Oct', 'done', null],
      ['Public catalogue', 'Listed', 'Live now', 'done', null],
    ]);
  });

  it('a date the record does not hold is left out, never invented', () => {
    const steps = submissionStages({
      status: { state: 'with-content-manager', since: '2026-08-14T09:40:00.000Z' as never },
      revision: 2,
      firstSubmittedAt: null,
      lastResubmittedAt: null,
      reviewDecisions: [],
    });
    expect(rows(steps).slice(0, 3)).toEqual([
      ['Vendor', 'Submitted', 'Revision 2', 'done', null],
      ['Academic Reviewer', 'Approved', null, 'done', null],
      ['You', 'Publication decision', null, 'you', null],
    ]);
  });
});

describe('a correction’s status, stage track and version change (CM-05 band, CM-08 list and detail)', () => {
  it('returned to her: your step with the edit mark, the reviewer’s return in red', async () => {
    const update = await updateOf(await asKavya('spine-start'), 'UPD-0006');
    expect(cmUpdatePill(update.state)).toEqual({ tone: 'err', words: 'Returned' });
    expect(rows(correctionStages(update))).toEqual([
      ['You', 'Returned to you', 'Change it and send it again', 'you', 'edit'],
      ['Academic Reviewer', 'Academic review', 'Returned 26 Aug', 'back', null],
      ['Super Admin', 'Release decision', 'After approval', 'next', null],
      ['Everyone', 'Live', 'When released', 'next', null],
    ]);
    expect(correctionVersionChange(update)).toEqual({
      from: { text: '1.0 live', kind: 'live' },
      to: { text: '1.1 proposed', kind: 'new' },
    });
  });

  it('on hold, awaiting the release decision, released (also after a lifted hold)', async () => {
    const spine = await asKavya('spine-start');
    const held = await updateOf(spine, 'UPD-0004');
    expect(cmUpdatePill(held.state)).toEqual({ tone: 'paused', words: 'On hold' });
    expect(rows(correctionStages(held))).toEqual([
      ['You', 'Sent', '10 Aug', 'done', null],
      ['Academic Reviewer', 'Approved', '14 Aug', 'done', null],
      ['Super Admin', 'On hold', 'Since 20 Aug', 'held', null],
      ['Everyone', 'Live', '2.0 stays live', 'next', null],
    ]);
    const released = await updateOf(spine, 'UPD-0003');
    expect(cmUpdatePill(released.state)).toEqual({ tone: 'ok', words: 'Released' });
    expect(rows(correctionStages(released))).toEqual([
      ['You', 'Sent', '27 Jul', 'done', null],
      ['Academic Reviewer', 'Approved', '30 Jul', 'done', null],
      ['Super Admin', 'Released', '5 Aug', 'done', null],
      ['Everyone', 'Live', 'Version 1.1 since 5 Aug', 'done', null],
    ]);
    expect(correctionVersionChange(released)).toEqual({
      from: { text: '1.0', kind: 'old' },
      to: { text: '1.1 live', kind: 'live' },
    });
    const awaiting = await updateOf(await asKavya('after-flow-e'), 'UPD-0005');
    expect(cmUpdatePill(awaiting.state)).toEqual({
      tone: 'info',
      words: 'Awaiting release decision',
    });
    expect(rows(correctionStages(awaiting))).toEqual([
      ['You', 'Sent', '20 Oct', 'done', null],
      ['Academic Reviewer', 'Approved', '22 Oct', 'done', null],
      ['Super Admin', 'Release decision', 'Waiting since 22 Oct', 'now', null],
      ['Everyone', 'Live', 'When released · 1.2 live now', 'next', null],
    ]);
    const relisted = await updateOf(await asKavya('after-flow-f'), 'UPD-0005');
    expect(relisted.holdLifts).toHaveLength(1);
    expect(rows(correctionStages(relisted)).slice(2)).toEqual([
      ['Super Admin', 'Released', '24 Oct', 'done', null],
      ['Everyone', 'Live', 'Version 1.3 since 24 Oct', 'done', null],
    ]);
    // Waiting again after a lifted hold: since the lift (the export's `u.lifted || u.appr`).
    expect(
      correctionStages({ ...relisted, state: 'awaiting-release-decision', release: null })[2]!.when,
    ).toBe('Waiting since 23 Oct');
  });

  it('a new draft, then sent for academic review, then withdrawn — her own commands', async () => {
    const ports = await asKavya('spine-start');
    const opened = ok(
      await ports.corrections.openCorrection({
        experimentId: 'distillation-column' as never,
        entry: 'start-a-correction',
      }),
    );
    expect(opened.joined).toBe(false);
    const draft = opened.update;
    expect(cmUpdatePill(draft.state)).toEqual({ tone: 'neutral', words: 'Draft' });
    expect(rows(correctionStages(draft))).toEqual([
      ['You', 'Draft', `Saved ${dayMonth(draft.updatedAt)}`, 'you', 'edit'],
      ['Academic Reviewer', 'Academic review', 'After you send it', 'next', null],
      ['Super Admin', 'Release decision', 'After approval', 'next', null],
      ['Everyone', 'Live', 'When released', 'next', null],
    ]);
    expect(correctionVersionChange(draft)).toEqual({
      from: { text: '1.2 live', kind: 'live' },
      to: { text: 'No version label yet', kind: 'new' },
    });

    const returned = await updateOf(ports, 'UPD-0006');
    const saved = ok(
      await ports.corrections.saveCorrection({
        id: returned.id as UpdateId,
        proposed: {
          ...returned.proposed,
          description: `${returned.proposed.description} The slip rises as the load rises.`,
        },
        whatChangesAndWhy: returned.whatChangesAndWhy,
        versionLabel: returned.versionLabel,
        expectedRev: returned.rev,
      }),
    );
    const sent = ok(
      await ports.corrections.sendForAcademicReview({
        id: saved.id as UpdateId,
        expectedRev: saved.rev,
      }),
    );
    expect(cmUpdatePill(sent.state)).toEqual({ tone: 'info', words: 'In academic review' });
    const day = dayMonth(sent.sentForReviewAt!);
    expect(rows(correctionStages(sent))).toEqual([
      ['You', 'Sent', day, 'done', null],
      ['Academic Reviewer', 'Academic review', `Since ${day}`, 'now', null],
      ['Super Admin', 'Release decision', 'After approval', 'next', null],
      ['Everyone', 'Live', 'When released', 'next', null],
    ]);

    const withdrawn = ok(
      await ports.corrections.withdrawUpdate({
        id: sent.id as UpdateId,
        reason: 'The slip correction goes into the next build instead.',
        expectedRev: sent.rev,
      }),
    );
    expect(cmUpdatePill(withdrawn.state)).toEqual({ tone: 'ended', words: 'Withdrawn' });
    expect(rows(correctionStages(withdrawn))).toEqual([
      ['You', 'Withdrawn', dayMonth(withdrawn.withdrawal!.at), 'off', null],
      ['Academic Reviewer', 'Academic review', 'Closed without a decision', 'off', null],
      ['Super Admin', 'Release decision', 'Closed without a decision', 'off', null],
      ['Everyone', 'Live', 'Version 1.0 unchanged', 'off', null],
    ]);
    expect(correctionVersionChange(withdrawn)).toEqual({
      from: { text: '1.0 live', kind: 'live' },
      to: { text: '1.1 withdrawn', kind: 'old' },
    });
    // A page that reads the experiment passes its live label.
    expect(correctionVersionChange(withdrawn, '1.2').from.text).toBe('1.2 live');
    expect(correctionStages(withdrawn, '1.2')[3]!.when).toBe('Version 1.2 unchanged');
  });

  it('every state’s tone is the export’s mapping; the published record’s own version alone', () => {
    expect(
      (
        [
          'draft',
          'in-academic-review',
          'returned',
          'awaiting-release-decision',
          'on-hold',
          'released',
          'withdrawn',
        ] as const
      ).map(cmUpdateTone),
    ).toEqual(['neutral', 'info', 'err', 'info', 'paused', 'ok', 'ended']);
    expect(liveVersionOnly('1.2')).toEqual({ from: { text: '1.2 live', kind: 'live' } });
    expect(CM_STAGE_STATE_WORDS.you).toBe('Your step, now: ');
    expect(cmActorName({ kind: 'system', system: 'workflow-routing' } as never)).toBe('');
  });
});

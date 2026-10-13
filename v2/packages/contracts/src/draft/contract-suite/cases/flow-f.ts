/**
 * Flow F — a corrected version (flows.json F1–F4; Appendix D §4.7; B6-08, B6-09, B6-04, B7-05,
 * B7-11): Content Manager → Academic Reviewer → Super Admin Release / Hold (BC8). The live version
 * is unchanged until Release; Release is never "Publish" and changes no institution's access
 * (BC9); one open update per experiment; no Release while on hold.
 */
import type { CorrectionUpdate } from '@xr/domain';

import type { MethodId } from '../../ports/index.js';
import { changedKinds, check, deepEqual, errorOf, valueOf } from '../assert.js';
import { experimentNamed, keysOf } from '../helpers.js';
import type { CaseContext, ContractCase } from '../run.js';
import { DRAWN, SAMPLE } from '../sample.js';

const F_METHODS: readonly MethodId[] = [
  'CatalogueService.searchCatalogue',
  'CorrectionService.getPublishedExperiment',
  'CorrectionService.openCorrection',
  'CorrectionService.getUpdate',
  'CorrectionService.saveCorrection',
  'CorrectionService.sendForAcademicReview',
];

/** F1: open the draft (and join it), save, send — the live version stays 1.2. */
async function sendForReview(context: CaseContext) {
  const cm = context.as('Kavya Nair');
  const distillation = await experimentNamed(context.publicPorts, SAMPLE.experiments.distillation);
  const experimentId = distillation.experimentId;
  const live = async (step: string) =>
    valueOf(await cm.corrections.getPublishedExperiment(experimentId), step).experiment.live.label;
  check((await live('CM-05')) === '1.2', 'F1: the live version is 1.2 (B6-08)');
  const opened = valueOf(
    await cm.corrections.openCorrection({ experimentId, entry: 'start-a-correction' }),
    'F1 start a correction',
  );
  check(DRAWN.update.test(opened.update.id) && !opened.joined, 'F1: a new draft, UPD-nnnn');
  const joined = valueOf(
    await cm.corrections.openCorrection({ experimentId, entry: 'edit-catalogue-details' }),
    'F1 edit catalogue details',
  );
  check(
    joined.joined && joined.update.id === opened.update.id,
    'F1: three entries, one draft (M-1)',
  );
  const draft = valueOf(await cm.corrections.getUpdate(opened.update.id), 'F1 CM-08').update;
  const proposed = { ...draft.proposed, description: `${draft.proposed.description} (corrected)` };
  let update: CorrectionUpdate = valueOf(
    await cm.corrections.saveCorrection({
      id: draft.id,
      proposed,
      whatChangesAndWhy: 'Corrects the reflux statement in the description.',
      versionLabel: '1.2',
      expectedRev: draft.rev,
    }),
    'F1 save the draft',
  );
  const sameLabel = await cm.corrections.sendForAcademicReview({
    id: update.id,
    expectedRev: update.rev,
  });
  const labelError = errorOf(sameLabel, 'validation-failed', 'F1 send with the live label');
  deepEqual(
    keysOf(labelError),
    ['CM-08.versionLabel.same-as-live'],
    'F1: the label must differ from the live one',
  );
  check(
    labelError.fieldErrors[0]!.message === 'Use a new version label — 1.2 is live',
    'F1: "Use a new version label — 1.2 is live" (B6-09)',
  );
  check(labelError.summaryTitle === 'Check the update', 'F1: the drawn summary title');
  update = valueOf(
    await cm.corrections.saveCorrection({
      id: update.id,
      proposed,
      whatChangesAndWhy: 'Corrects the reflux statement in the description.',
      versionLabel: '1.3',
      expectedRev: update.rev,
    }),
    'F1 save with 1.3',
  );
  update = valueOf(
    await cm.corrections.sendForAcademicReview({ id: update.id, expectedRev: update.rev }),
    'F1 send for academic review',
  );
  check(update.state === 'in-academic-review', 'F1: In academic review');
  check((await live('F1 CM-05')) === '1.2', 'F1: the live version 1.2 is unchanged');
  return { experimentId, update, live };
}

const flowF: ContractCase = {
  id: 'flow:F',
  title: 'Flow F — correction, review, hold, lift hold, release (F1–F4)',
  group: 'flow',
  evidence: 'flows.json F1–F4; Appendix D §4.7; B6-08, B6-09, B6-04, B7-05, B7-11; BC8, BC9',
  requires: {
    fixture: { kind: 'spine-start' },
    methods: [
      ...F_METHODS,
      'CorrectionService.approveUpdate',
      'CorrectionService.holdUpdate',
      'CorrectionService.releaseUpdate',
      'CorrectionService.liftHold',
    ],
  },
  run: async (context) => {
    const { experimentId, update: sent, live } = await sendForReview(context);
    let update: CorrectionUpdate = sent;
    const cm = context.as('Kavya Nair');
    const blocked = await cm.corrections.openCorrection({
      experimentId,
      entry: 'start-a-correction',
    });
    check(
      errorOf(blocked, 'refused', 'F1 a second update').code === 'update-already-open',
      'F1: never a second, conflicting update (B6-08)',
    );
    const shown = valueOf(
      await cm.corrections.getPublishedExperiment(experimentId),
      'CM-05',
    ).openUpdate;
    check(shown?.id === update.id, 'F1: the experiment shows its one open update');

    const reviewer = context.as('Prof. A. Menon');
    update = valueOf(
      await reviewer.corrections.approveUpdate({ id: update.id, expectedRev: update.rev }),
      'F2 approve the update',
    );
    check(update.state === 'awaiting-release-decision', 'F2: Awaiting release decision');
    check((await live('F2 CM-05')) === '1.2', 'F2: approving does not change what is live');

    const admin = context.as('Arjun Mehta');
    const noReason = await admin.corrections.holdUpdate({
      id: update.id,
      reason: '',
      expectedRev: update.rev,
    });
    deepEqual(
      keysOf(errorOf(noReason, 'validation-failed', 'F3 hold without a reason')),
      ['SA-11.reason.required'],
      'F3: "Add a reason — the Content Manager sees it"',
    );
    update = valueOf(
      await admin.corrections.holdUpdate({
        id: update.id,
        reason: 'Wait for the lab to confirm the new build.',
        expectedRev: update.rev,
      }),
      'F3 hold',
    );
    check(update.state === 'on-hold', 'F3: On hold');
    const whileHeld = await admin.corrections.releaseUpdate({
      id: update.id,
      expectedRev: update.rev,
    });
    check(
      errorOf(whileHeld, 'refused', 'F3 release while held').code === 'hold-must-be-lifted',
      'F3: no Release while held (B7-10 f2)',
    );
    update = valueOf(
      await admin.corrections.liftHold({ id: update.id, expectedRev: update.rev }),
      'F3 lift hold',
    );
    check(update.state === 'awaiting-release-decision', 'F3: lifting the hold never releases');
    const released = await admin.corrections.releaseUpdate({
      id: update.id,
      expectedRev: update.rev,
    });
    const outcome = valueOf(released, 'F3 release');
    check(
      outcome.update.state === 'released' && outcome.experiment.live.label === '1.3',
      'F3: 1.3 is live',
    );
    check(
      changedKinds(released).every((kind) => kind === 'UPD' || kind === 'EXP'),
      'F3: Release writes the update and the experiment only — no access changes (BC9)',
    );
    const after = valueOf(await cm.corrections.getPublishedExperiment(experimentId), 'F4 CM-05');
    check(
      after.experiment.live.label === '1.3' && after.openUpdate === null,
      'F4: 1.3 live; no open update',
    );
    check(
      after.experiment.versions.some((version) => version.label === '1.2'),
      'F4: history keeps every version (B7-11)',
    );
  },
};

const flowFReturnAndWithdraw: ContractCase = {
  id: 'flow:F-return-withdraw',
  title: 'Flow F alternates — the reviewer returns the update; the Content Manager withdraws it',
  group: 'flow',
  evidence: 'Appendix D §4.7 F2b, F-alt; B6-04; B6-09; OD-B6-06',
  requires: {
    fixture: { kind: 'spine-start' },
    methods: [...F_METHODS, 'CorrectionService.returnUpdate', 'CorrectionService.withdrawUpdate'],
  },
  run: async (context) => {
    const { experimentId, update: sent, live } = await sendForReview(context);
    const reviewer = context.as('Prof. A. Menon');
    const cm = context.as('Kavya Nair');
    const blank = await reviewer.corrections.returnUpdate({
      id: sent.id,
      reason: ' ',
      expectedRev: sent.rev,
    });
    deepEqual(
      keysOf(errorOf(blank, 'validation-failed', 'F2b return without a reason')),
      ['RV-04.reason.required'],
      'F2b: "Add a reason so the Content Manager knows what to change"',
    );
    const returned = valueOf(
      await reviewer.corrections.returnUpdate({
        id: sent.id,
        reason: 'The reflux sentence still reads the wrong way round.',
        expectedRev: sent.rev,
      }),
      'F2b return the update',
    );
    check(returned.state === 'returned', 'F2b: Returned — editable again');
    const noReason = await cm.corrections.withdrawUpdate({
      id: returned.id,
      reason: '',
      expectedRev: returned.rev,
    });
    deepEqual(
      keysOf(errorOf(noReason, 'validation-failed', 'F-alt withdraw without a reason')),
      ['CM-08.reason.required'],
      'F-alt: "Add a reason for withdrawing this update"',
    );
    const withdrawn = valueOf(
      await cm.corrections.withdrawUpdate({
        id: returned.id,
        reason: 'The correction moves to the next release.',
        expectedRev: returned.rev,
      }),
      'F-alt withdraw',
    );
    check(withdrawn.state === 'withdrawn', 'F-alt: Withdrawn');
    const page = valueOf(await cm.corrections.getPublishedExperiment(experimentId), 'CM-05');
    check(page.openUpdate === null, 'F-alt: the experiment has no open update again');
    check((await live('after the withdrawal')) === '1.2', 'F-alt: the live version is unchanged');
  },
};

export const FLOW_F_CASES: readonly ContractCase[] = [flowF, flowFReturnAndWithdraw];

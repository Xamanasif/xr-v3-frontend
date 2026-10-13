/**
 * Flow E — first publication (flows.json E1–E5; Appendix D §4.6; B5-03 … B5-08; B6-02 … B6-12):
 * Vendor → Academic Reviewer → Content Manager → Published → catalogue (BC7). Submitting,
 * approving and returning publish nothing; publishing gives no one access (BC9); "Composite Wall
 * Conduction" and "Conduction Through a Composite Wall" stay two records (BC11; invariant 10).
 * The moment a resubmission is routed is the owner's (M-3): a held resubmission is routed through
 * the test seam.
 */
import type { Submission } from '@xr/domain';

import type { MethodId } from '../../ports/index.js';
import { changedKinds, check, deepEqual, errorOf, valueOf } from '../assert.js';
import { experimentNamed, experimentsNamed, keysOf } from '../helpers.js';
import type { CaseContext, ContractCase } from '../run.js';
import { DRAWN, SAMPLE } from '../sample.js';

const E_METHODS: readonly MethodId[] = [
  'CatalogueService.searchCatalogue',
  'ProductionService.saveDraft',
  'ProductionService.continueStep',
  'ProductionService.submitForReview',
  'ProductionService.getReviewQueue',
  'ProductionService.getSubmissionForReview',
  'ProductionService.returnSubmission',
  'ProductionService.getRecord',
  'ProductionService.saveRevision',
  'ProductionService.resubmit',
  'ProductionService.approveSubmission',
  'ProductionService.overrideStatus',
];

async function contentFor(context: CaseContext) {
  const shell = await experimentNamed(context.publicPorts, SAMPLE.experiments.shellAndTube);
  check(shell.platformCode === SAMPLE.courseCode, 'Shell-and-Tube Heat Exchanger is in ME ZG523');
  return {
    courseId: shell.courseId,
    name: SAMPLE.experiments.compositeWallNew,
    summary: 'Heat flow through a wall of several layers.',
    description:
      'Learners build a wall of three layers and compare the temperature profile with the series-resistance model.',
    version: '1.0',
    formats: ['web', 'vr'] as ('web' | 'vr')[],
    delivery: {
      web: {
        format: 'web' as const,
        webLink: 'https://labs.northline.example/composite-wall',
        browserAndComputer: 'A current browser on a laptop or desktop.',
        notes: null,
      },
      vr: {
        format: 'vr' as const,
        packageLabel: 'Composite Wall VR',
        packageReference: 'NSS-CW-VR-1.0',
        packageFileName: null,
        deviceNeeded: 'A supported VR headset.',
        installNotes: 'Install it from the lab’s device manager.',
        notes: null,
      },
    },
    preview: { label: null, link: null },
    documents: [],
  };
}

/** E1–E3: draft, submit, return, revise, resubmit, approve. Answers the submission. */
async function toContentManager(context: CaseContext): Promise<Submission> {
  const vendor = context.as('Anil Shetty');
  const reviewer = context.as('Prof. A. Menon');
  const content = await contentFor(context);
  const unnamed = await vendor.production.saveDraft({
    id: null,
    content: { ...content, name: ' ' },
    step: 'course',
    expectedRev: null,
  });
  deepEqual(
    keysOf(errorOf(unnamed, 'validation-failed', 'E1 save a draft without a name')),
    ['VE-03.name.required-for-draft'],
    'E1: "Enter a name to save a draft"',
  );
  const draft = valueOf(
    await vendor.production.saveDraft({ id: null, content, step: 'course', expectedRev: null }),
    'E1 save the draft',
  );
  check(
    DRAWN.submission.test(draft.id) && draft.status.state === 'draft',
    'E1: "Draft saved · SUB-nnnn"',
  );
  const step = await vendor.production.continueStep({
    id: draft.id,
    content: { ...content, summary: null },
    from: 'course',
  });
  deepEqual(
    keysOf(errorOf(step, 'validation-failed', 'E1 continue without a summary')),
    ['VE-03.summary.required'],
    'E1: "Enter a one-sentence summary"',
  );
  let submission = valueOf(
    await vendor.production.submitForReview({ id: draft.id, content, expectedRev: draft.rev }),
    'E1 submit for review',
  );
  check(
    submission.status.state === 'with-academic-reviewer' && submission.revision === 1,
    'E1: With Academic Reviewer, revision 1',
  );
  check(
    (await experimentsNamed(context.publicPorts, SAMPLE.experiments.compositeWallNew)).length === 0,
    'E1: submitting publishes nothing',
  );
  const override = await context.as('Arjun Mehta').production.overrideStatus({
    id: submission.id,
    reason: 'Moving it on.',
    expectedRev: submission.rev,
  });
  check(
    errorOf(override, 'refused', 'SA-13 override a record the reviewer can act on').code ===
      'override-not-stuck',
    'SA-13: "In the workflow — someone can act … nothing to do here." (B7-06 f4)',
  );

  const queue = valueOf(await reviewer.production.getReviewQueue({}), 'E2 RV-02');
  check(
    queue.some((item) => item.ref.kind === 'SUB' && item.ref.id === submission.id),
    'E2: in the reviewer’s queue',
  );
  const noReason = await reviewer.production.returnSubmission({
    id: submission.id,
    reason: '',
    references: [],
    outcomes: [],
    expectedRev: submission.rev,
  });
  deepEqual(
    keysOf(errorOf(noReason, 'validation-failed', 'E2 return without a reason')),
    ['RV-03.reason.required'],
    'E2: "Add a reason so the vendor knows what to change"',
  );
  submission = valueOf(
    await reviewer.production.returnSubmission({
      id: submission.id,
      reason: 'Give the layer thicknesses in the description.',
      references: [{ step: 'course-and-description', format: null, field: 'description' }],
      outcomes: [],
      expectedRev: submission.rev,
    }),
    'E2 return to the vendor',
  );
  check(submission.status.state === 'returned', 'E2: Returned');
  const record = valueOf(await vendor.production.getRecord(submission.id), 'E2 VE-07');
  check(record.lastReturn !== null, 'E2: the reason and references show above the editor');
  const revised = {
    ...content,
    description: `${content.description} The layers are 20, 50 and 10 mm thick.`,
  };
  submission = valueOf(
    await vendor.production.saveRevision({
      id: submission.id,
      content: revised,
      expectedRev: submission.rev,
    }),
    'E2 save the revision',
  );
  submission = valueOf(
    await vendor.production.resubmit({
      id: submission.id,
      content: revised,
      expectedRev: submission.rev,
    }),
    'E2 resubmit',
  );
  check(submission.revision === 2, 'E2: revision 2');
  if (submission.status.state === 'resubmitted') {
    context.seams.routeResubmission!(submission.id);
    submission = valueOf(
      await reviewer.production.getSubmissionForReview(submission.id),
      'E2 routed',
    ).submission;
  }
  check(
    submission.status.state === 'with-academic-reviewer',
    'E2: back with the Academic Reviewer (the drawn route)',
  );

  const noOutcome = await reviewer.production.approveSubmission({
    id: submission.id,
    outcomes: [],
    expectedRev: submission.rev,
  });
  deepEqual(
    keysOf(errorOf(noOutcome, 'validation-failed', 'E3 approve with no outcome')),
    ['RV-03.outcomes.at-least-one'],
    'E3: "Add at least one learning outcome before you approve"',
  );
  submission = valueOf(
    await reviewer.production.approveSubmission({
      id: submission.id,
      outcomes: ['Explain how heat flows through layers in series.'],
      expectedRev: submission.rev,
    }),
    'E3 approve',
  );
  check(submission.status.state === 'with-content-manager', 'E3: With Content Manager');
  check(
    (await experimentsNamed(context.publicPorts, SAMPLE.experiments.compositeWallNew)).length === 0,
    'E3: approving publishes nothing',
  );
  return submission;
}

const flowE: ContractCase = {
  id: 'flow:E',
  title: 'Flow E — first publication, Composite Wall records kept separate (E1–E5)',
  group: 'flow',
  evidence:
    'flows.json E1–E5; Appendix D §4.6; B5-03 … B5-08; B6-03; B6-07; B6-12; B7-06 f4; BC7, BC9, BC11',
  requires: {
    fixture: { kind: 'spine-start' },
    methods: [
      ...E_METHODS,
      'ProductionService.listReadyToPublish',
      'ProductionService.publish',
      'CatalogueService.getExperiment',
    ],
    seams: ['routeResubmission'],
  },
  run: async (context) => {
    const before = await experimentsNamed(context.publicPorts, 'Composite Wall');
    deepEqual(
      before.map((entry) => entry.name),
      [SAMPLE.experiments.compositeWall],
      'Before E1 only "Composite Wall Conduction" is published (SUB-0077 does not exist yet)',
    );
    const submission = await toContentManager(context);
    const cm = context.as('Kavya Nair');
    const ready = valueOf(await cm.production.listReadyToPublish(), 'E4 CM-02');
    const row = ready.find((candidate) => candidate.submission.id === submission.id);
    check(row && row.check.every((item) => item.ok), 'E4: ready to publish, every check met');
    const published = await cm.production.publish({
      id: submission.id,
      expectedRev: submission.rev,
    });
    const outcome = valueOf(published, 'E4 publish');
    check(outcome.submission.status.state === 'published', 'E4: Published');
    check(
      changedKinds(published).every((kind) => kind === 'SUB' || kind === 'EXP'),
      'E4: publishing writes the submission and the experiment only — no plan, grant, mapping or person (BC9)',
    );
    const after = await experimentsNamed(context.publicPorts, 'Composite Wall');
    const names = after.map((entry) => entry.name).sort();
    deepEqual(
      names,
      [SAMPLE.experiments.compositeWall, SAMPLE.experiments.compositeWallNew].sort(),
      'E5: both Composite Wall records are listed (BC11)',
    );
    check(
      new Set(after.map((entry) => entry.experimentId)).size === 2,
      'E5: two records, two ids — never merged',
    );
    const page = valueOf(
      await context.publicPorts.catalogue.getExperiment(outcome.experiment.id),
      'E5 PU-06',
    );
    deepEqual(
      [...page.availableIn].sort(),
      ['vr', 'web'],
      'E5: listed with the formats that passed governance',
    );
  },
};

const flowESendBacks: ContractCase = {
  id: 'flow:E-send-backs',
  title:
    'Flow E alternates — the Content Manager sends it back to the reviewer, then to the vendor',
  group: 'flow',
  evidence: 'Appendix D §4.6 E-alt1, E-alt2; B6-07; B6-11 f3, f7; OD-B6-05',
  requires: {
    fixture: { kind: 'spine-start' },
    methods: [...E_METHODS, 'ProductionService.sendBack'],
    seams: ['routeResubmission'],
  },
  run: async (context) => {
    let submission = await toContentManager(context);
    const cm = context.as('Kavya Nair');
    const reviewer = context.as('Prof. A. Menon');
    const noReason = await cm.production.sendBack({
      id: submission.id,
      to: 'academic-reviewer',
      reason: '',
      expectedRev: submission.rev,
    });
    deepEqual(
      keysOf(errorOf(noReason, 'validation-failed', 'send back without a reason')),
      ['CM-03.reason.required'],
      '"Add a reason so they know what to change"',
    );
    submission = valueOf(
      await cm.production.sendBack({
        id: submission.id,
        to: 'academic-reviewer',
        reason: 'Please re-check the second outcome.',
        expectedRev: submission.rev,
      }),
      'E-alt1 send back to the reviewer',
    );
    check(
      submission.status.state === 'with-academic-reviewer' &&
        submission.status.reason === 'recheck',
      'E-alt1: back with the Academic Reviewer for a re-check',
    );
    submission = valueOf(
      await reviewer.production.approveSubmission({
        id: submission.id,
        outcomes: ['Explain how heat flows through layers in series.'],
        expectedRev: submission.rev,
      }),
      'E-alt1 approve again',
    );
    submission = valueOf(
      await cm.production.sendBack({
        id: submission.id,
        to: 'vendor',
        reason: 'The VR install notes are missing a step.',
        references: [{ step: 'formats-and-delivery', format: 'vr', field: 'install-notes' }],
        expectedRev: submission.rev,
      }),
      'E-alt2 send back to the vendor',
    );
    check(
      submission.status.state === 'returned' && submission.status.by === 'content-manager',
      'E-alt2: Returned by the Content Manager',
    );
  },
};

/**
 * E-alt3 (Appendix D §4.6): the Super Admin moves a stuck record — with the Academic Reviewer while
 * no reviewer's scope covers its course — back to the vendor, with a reason kept in the history.
 * The state-coverage world seeds the stuck record (Appendix C §4.1); SA-12's all-content list finds
 * it. That list lands in P6 (Appendix F §4.1), so this case reports "not run" against a Phase-0
 * adapter until WP-0.11 settles how the walk reaches it (DEFERRED_OBLIGATIONS).
 */
const flowEAlt3: ContractCase = {
  id: 'flow:E-alt3-override',
  title: 'Flow E alternate — the Super Admin moves a stuck record back to the vendor',
  group: 'flow',
  evidence: 'Appendix D §4.6 E-alt3; B7-06 f4–f6; B7-10 f6; OD-B7-09; SUB-33, SUB-34',
  requires: {
    fixture: { kind: 'state-coverage' },
    methods: [
      'ProductionService.listAllContent',
      'ProductionService.getContentRecord',
      'ProductionService.overrideStatus',
    ],
  },
  run: async (context) => {
    const admin = context.as('Arjun Mehta');
    const stuck = valueOf(
      await admin.production.listAllContent({ status: 'stuck' }),
      'SA-12 stuck records',
    );
    const row = stuck.find((candidate) => candidate.ref.kind === 'SUB');
    check(row, 'State coverage seeds a record "Stuck — nobody can act" (Appendix C §4.1)');
    check(
      row.stuck && row.status.state === 'with-academic-reviewer',
      'SA-12: a stuck record is with the Academic Reviewer and nobody can act',
    );
    const record = valueOf(
      await admin.production.getContentRecord(row.ref),
      'SA-13 the stuck record',
    );
    check(record.stuck && record.submission, 'SA-13: the record reads stuck');
    const submission = record.submission;
    const noReason = await admin.production.overrideStatus({
      id: submission.id,
      reason: ' ',
      expectedRev: submission.rev,
    });
    deepEqual(
      keysOf(errorOf(noReason, 'validation-failed', 'SA-13 move status without a reason')),
      ['SA-13.reason.required'],
      'SA-13: "Add a reason — it is kept in the history"',
    );
    const moved = await admin.production.overrideStatus({
      id: submission.id,
      reason: 'No Academic Reviewer covers this course yet.',
      expectedRev: submission.rev,
    });
    const after = valueOf(moved, 'E-alt3 move status');
    check(
      after.status.state === 'returned' && after.status.by === 'super-admin-override',
      'E-alt3: returned to the vendor by the override',
    );
    deepEqual(changedKinds(moved), ['SUB'], 'E-alt3: the override writes the submission only');
    const published = valueOf(
      await admin.production.listAllContent({ status: 'published' }),
      'SA-12 published records',
    ).find((candidate) => candidate.ref.kind === 'SUB');
    if (!published) {
      context.note('no published submission listed: B7-10 f6 not exercised');
      return;
    }
    const live = valueOf(
      await admin.production.getContentRecord(published.ref),
      'SA-13 a published record',
    );
    check(live.submission, 'SA-13: a published submission reads as a record');
    const never = await admin.production.overrideStatus({
      id: live.submission.id,
      reason: 'Trying a published record.',
      expectedRev: live.submission.rev,
    });
    errorOf(never, 'invalid-state', 'SA-13: Published is never a target (B7-10 f6; OD-B7-09)');
  },
};

export const FLOW_E_CASES: readonly ContractCase[] = [flowE, flowESendBacks, flowEAlt3];

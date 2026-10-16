/**
 * Phase 5 on the sample adapter (VE-01 … VE-09, VE-13, RV-01 … RV-03, RV-05, RV-06, CM-01 … CM-05,
 * CM-09): the seven Phase-5 reads on the product world (spine-start), and Flow E end to end on the
 * product ports with the owner's M-3 answer (PC-66) — the Vendor creates, submits, is returned with
 * a reason, revises and resubmits; the `system:workflow-routing` stand-in routes the resubmission
 * back to the Academic Reviewer, who approves it with learning outcomes; the Content Manager
 * publishes it; the catalogue lists it — and no plan, grant or person changes (BC9).
 */
import {
  contentManagerOverviewOutput,
  editorOutput,
  libraryOutput,
  listMyExperimentsOutput,
  platformCodesOutput,
  reviewerOverviewOutput,
  vendorOverviewOutput,
} from '@xr/contracts/draft';
import { type CourseId, type Submission, type SubmissionId, unsafeBrand } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { createSamplePlatform } from '../index.js';
import { asPerson, worldOf } from '../testing/index.js';

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

function errorKind(answer: { readonly ok: boolean; readonly error?: { readonly kind: string } }) {
  expect(answer.ok).toBe(false);
  return answer.error!.kind;
}

const VENDOR = 'Anil Shetty';
const REVIEWER = 'Prof. A. Menon';
const CM = 'Kavya Nair';

describe('Phase 5 reads on the product world', () => {
  it('VE-01: counts, returned first then drafts; a draft whose course went is not offered', async () => {
    const vendor = asPerson(createSamplePlatform(), VENDOR);
    const overview = ok(await vendor.production.getVendorOverview());
    expect(vendorOverviewOutput.safeParse(overview).success).toBe(true);
    expect(overview.statusCounts).toEqual({
      draft: 2,
      'with-academic-reviewer': 0,
      'with-content-manager': 1,
      published: 1,
    });
    expect(overview.attention.map((row) => [row.kind, row.submissionId])).toEqual([
      ['returned', 'SUB-0081'],
      ['draft', 'SUB-0079'],
    ]);
    expect(overview.attention[0]).toMatchObject({ by: 'academic-reviewer' });
    expect(overview.hasExperiments).toBe(true);
  });

  it('VE-02: the Vendor’s own experiments, newest change first, filtered and searched', async () => {
    const vendor = asPerson(createSamplePlatform(), VENDOR);
    const all = ok(await vendor.production.listMyExperiments({}));
    expect(listMyExperimentsOutput.safeParse(all).success).toBe(true);
    expect(all.map((row) => row.submission.id)).toEqual([
      'SUB-0079',
      'SUB-0081',
      'SUB-0074',
      'SUB-0083',
      'SUB-0052',
    ]);
    const returned = ok(await vendor.production.listMyExperiments({ status: 'returned' }));
    expect(returned.map((row) => row.submission.id)).toEqual(['SUB-0081']);
    const searched = ok(await vendor.production.listMyExperiments({ search: 'sub-0052' }));
    expect(searched.map((row) => row.submission.id)).toEqual(['SUB-0052']);
    expect(all.find((row) => row.submission.id === 'SUB-0083')!.guards.courseNoLongerAssigned).toBe(
      true,
    );
    // Another workspace never reads them.
    const reviewer = asPerson(createSamplePlatform(), REVIEWER);
    expect(errorKind(await reviewer.production.listMyExperiments({}))).toBe('not-permitted');
  });

  it('the editor: assigned courses only; a published or unassigned record opens read-only', async () => {
    const vendor = asPerson(createSamplePlatform(), VENDOR);
    const fresh = ok(await vendor.production.getEditor({ id: null, step: 'course' }));
    expect(editorOutput.safeParse(fresh).success).toBe(true);
    expect(fresh.assignedCourses.map((course) => course.platformCode)).toEqual(['ME ZG523']);
    expect(fresh.readOnly).toBe(false);
    const draft = ok(
      await vendor.production.getEditor({
        id: unsafeBrand<SubmissionId>('SUB-0079'),
        step: 'formats',
      }),
    );
    expect(draft.readOnly).toBe(false);
    const returned = ok(
      await vendor.production.getEditor({
        id: unsafeBrand<SubmissionId>('SUB-0081'),
        step: 'course',
      }),
    );
    expect(returned.readOnly).toBe(false);
    const published = ok(
      await vendor.production.getEditor({
        id: unsafeBrand<SubmissionId>('SUB-0052'),
        step: 'course',
      }),
    );
    expect(published.readOnly).toBe(true);
    const unassigned = ok(
      await vendor.production.getEditor({
        id: unsafeBrand<SubmissionId>('SUB-0083'),
        step: 'course',
      }),
    );
    expect(unassigned.readOnly).toBe(true);
    expect(
      errorKind(
        await vendor.production.getEditor({
          id: unsafeBrand<SubmissionId>('SUB-9999'),
          step: 'course',
        }),
      ),
    ).toBe('not-found');
  });

  it('RV-01: the scope’s codes and the queue’s own items, each re-check with its reason', async () => {
    const reviewer = asPerson(createSamplePlatform(), REVIEWER);
    const overview = ok(await reviewer.production.getReviewerOverview());
    expect(reviewerOverviewOutput.safeParse(overview).success).toBe(true);
    expect(overview.scopeLine).toEqual(['ME ZG523', 'MEL ZG512', 'CHE ZG513']);
    expect(overview.scopeAll).toBe(false);
    const queue = ok(await reviewer.production.getReviewQueue({}));
    expect(overview.waiting.map((row) => row.ref)).toEqual(queue.map((row) => row.ref));
    expect(overview.waiting.find((row) => row.type === 'recheck')!.reason).toMatch(/Pitot tube/);
    expect(
      errorKind(await asPerson(createSamplePlatform(), CM).production.getReviewerOverview()),
    ).toBe('not-permitted');
  });

  it('CM-01 and CM-04: ready first, then returned corrections; with others; the four tabs', async () => {
    const cm = asPerson(createSamplePlatform(), CM);
    const overview = ok(await cm.production.getContentManagerOverview());
    expect(contentManagerOverviewOutput.safeParse(overview).success).toBe(true);
    expect(overview.attention.map((row) => row.kind)).toEqual([
      'ready-to-publish',
      'ready-to-publish',
      'update-returned',
    ]);
    expect(overview.withOthers.map((row) => row.kind)).toEqual(['recheck', 'update-on-hold']);
    const ready = ok(await cm.production.getLibrary({ tab: 'ready' }));
    expect(libraryOutput.safeParse(ready).success).toBe(true);
    expect(ready.counts).toEqual({ ready: 2, 'in-review': 3, 'with-vendor': 1, published: 12 });
    const published = ok(await cm.production.getLibrary({ tab: 'published' }));
    expect(published.rows).toHaveLength(12);
    expect(published.rows.every((row) => row.kind === 'experiment')).toBe(true);
    // Drafts are the Vendor's only (SUB-16).
    const all = [
      ...ready.rows,
      ...ok(await cm.production.getLibrary({ tab: 'in-review' })).rows,
      ...ok(await cm.production.getLibrary({ tab: 'with-vendor' })).rows,
    ];
    expect(
      all.some((row) => row.kind === 'submission' && row.submission.status.state === 'draft'),
    ).toBe(false);
  });

  it('CM-09: every course with its area and published count; the Content Manager’s only', async () => {
    const platform = createSamplePlatform();
    const codes = ok(await asPerson(platform, CM).platformCourseCodes.list());
    expect(platformCodesOutput.safeParse(codes).success).toBe(true);
    expect(codes.map((row) => [row.course.platformCode, row.publishedExperiments])).toContainEqual([
      'ME ZG523',
      3,
    ]);
    expect(errorKind(await asPerson(platform, VENDOR).platformCourseCodes.list())).toBe(
      'not-permitted',
    );
  });
});

const CONTENT = {
  courseId: unsafeBrand<CourseId>('thermodynamics-heat-transfer'),
  name: 'Conduction Through a Composite Wall',
  summary: 'Heat flow through a wall of several layers.',
  description: 'Learners build a wall of three layers and compare the temperature profile.',
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

async function toResubmitted(routing: 'drawn-default-on-resubmit' | 'seam-only') {
  const platform = createSamplePlatform({ resubmissionRouting: routing });
  const vendor = asPerson(platform, VENDOR);
  const reviewer = asPerson(platform, REVIEWER);
  const draft = ok(
    await vendor.production.saveDraft({
      id: null,
      content: CONTENT,
      step: 'course',
      expectedRev: null,
    }),
  );
  let submission: Submission = ok(
    await vendor.production.submitForReview({
      id: draft.id,
      content: CONTENT,
      expectedRev: draft.rev,
    }),
  );
  submission = ok(
    await reviewer.production.returnSubmission({
      id: submission.id,
      reason: 'Give the layer thicknesses in the description.',
      references: [{ step: 'course-and-description', format: null, field: 'description' }],
      outcomes: [],
      expectedRev: submission.rev,
    }),
  );
  const record = ok(await vendor.production.getRecord(submission.id));
  expect(record.lastReturn && 'reason' in record.lastReturn ? record.lastReturn.reason : null).toBe(
    'Give the layer thicknesses in the description.',
  );
  const revised = { ...CONTENT, description: `${CONTENT.description} 20, 50 and 10 mm.` };
  const resubmitted = await vendor.production.resubmit({
    id: submission.id,
    content: revised,
    expectedRev: submission.rev,
  });
  return { platform, vendor, reviewer, id: submission.id, resubmitted };
}

describe('a revision is the Vendor’s until it is resubmitted (independent review, Phase 5)', () => {
  it('the Content Manager and the reviewer read the content it was last sent with', async () => {
    const platform = createSamplePlatform();
    const vendor = asPerson(platform, VENDOR);
    const reviewer = asPerson(platform, REVIEWER);
    const draft = ok(
      await vendor.production.saveDraft({
        id: null,
        content: CONTENT,
        step: 'course',
        expectedRev: null,
      }),
    );
    const sent = ok(
      await vendor.production.submitForReview({
        id: draft.id,
        content: CONTENT,
        expectedRev: draft.rev,
      }),
    );
    const returned = ok(
      await reviewer.production.returnSubmission({
        id: sent.id,
        reason: 'Give the layer thicknesses.',
        references: [],
        outcomes: [],
        expectedRev: sent.rev,
      }),
    );
    ok(
      await vendor.production.saveRevision({
        id: returned.id,
        content: { ...CONTENT, name: 'A Renamed Wall', description: 'Unsent words.' },
        expectedRev: returned.rev,
      }),
    );
    // The Vendor reads the saved revision.
    expect(ok(await vendor.production.getRecord(sent.id)).submission.content.name).toBe(
      'A Renamed Wall',
    );
    // Everyone else reads what was sent.
    const cm = asPerson(platform, CM);
    const library = ok(await cm.production.getLibrary({ tab: 'with-vendor' }));
    const row = library.rows.find(
      (entry) => entry.kind === 'submission' && entry.submission.id === sent.id,
    );
    expect(row?.kind === 'submission' && row.submission.content.name).toBe(CONTENT.name);
    const decision = ok(await cm.production.getPublicationDecision(sent.id));
    expect([decision.submission.content.name, decision.cataloguePreview.description]).toEqual([
      CONTENT.name,
      CONTENT.description,
    ]);
    const review = ok(await reviewer.production.getSubmissionForReview(sent.id));
    expect(review.submission.content.description).toBe(CONTENT.description);
    const reviewed = ok(await reviewer.production.listReviewedByMe());
    expect(reviewed.find((entry) => entry.recordRef.id === sent.id)?.name).toBe(CONTENT.name);
  });
});

describe('Flow E on the product ports (PC-66, owner answer to M-3)', () => {
  it('seam-only (other builds, the tests): the resubmission waits "resubmitted"', async () => {
    const { reviewer, id, resubmitted } = await toResubmitted('seam-only');
    expect(ok(resubmitted).status.state).toBe('resubmitted');
    const queue = ok(await reviewer.production.getReviewQueue({}));
    expect(queue.some((item) => item.ref.id === id)).toBe(false);
  });

  it('drawn-default-on-resubmit: routed back to the reviewer, approved, published, listed — no access', async () => {
    const { platform, vendor, reviewer, id, resubmitted } = await toResubmitted(
      'drawn-default-on-resubmit',
    );
    // The Vendor's receipt is the record as resubmitted; the routing is a system event after it.
    expect(ok(resubmitted).status.state).toBe('resubmitted');
    expect(resubmitted.ok && resubmitted.changed).toContainEqual({ kind: 'SUB', id });
    const routed = ok(await vendor.production.getRecord(id)).submission;
    expect(routed.status).toMatchObject({
      state: 'with-academic-reviewer',
      reason: 'resubmission',
    });
    expect(routed.revision).toBe(2);
    expect(routed.history.at(-1)).toMatchObject({
      event: 'routed',
      actor: { kind: 'system', system: 'system:workflow-routing' },
    });
    const queue = ok(await reviewer.production.getReviewQueue({}));
    expect(queue.find((item) => item.ref.id === id)?.subLine).toBe('Resubmitted · revision 2');
    const review = ok(await reviewer.production.getSubmissionForReview(id));
    expect(review.whatChanged.map((row) => row.field)).toEqual(['description']);
    const approved = ok(
      await reviewer.production.approveSubmission({
        id,
        outcomes: ['Explain how heat flows through layers in series.'],
        expectedRev: review.submission.rev,
      }),
    );
    expect(approved.status.state).toBe('with-content-manager');
    const before = worldOf(platform);
    const cm = asPerson(platform, CM);
    expect(ok(await cm.production.listReadyToPublish()).map((row) => row.submission.id)).toContain(
      id,
    );
    const published = await cm.production.publish({ id, expectedRev: approved.rev });
    const outcome = ok(published);
    expect(outcome.submission.status.state).toBe('published');
    expect(
      published.ok && published.changed.every((ref) => ref.kind === 'SUB' || ref.kind === 'EXP'),
    ).toBe(true);
    const after = worldOf(platform);
    // BC9: no plan, grant, licence wait, person or mapping changes.
    expect(Object.keys(before.records.plans).length).toBeGreaterThan(0);
    for (const table of ['plans', 'grants', 'waits', 'people', 'mappings', 'institutions'] as const)
      expect(after.records[table], table).toEqual(before.records[table]);
    const listed = ok(await asPerson(platform, CM).catalogue.getExperiment(outcome.experiment.id));
    expect(listed.learningOutcomes).toEqual(['Explain how heat flows through layers in series.']);
    expect([...listed.availableIn].sort()).toEqual(['vr', 'web']);
  });
});

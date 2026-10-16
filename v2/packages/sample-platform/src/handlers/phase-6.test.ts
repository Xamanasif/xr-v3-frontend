/**
 * Phase 6 on the sample adapter (CM-05 … CM-08, RV-04, SA-01, SA-10 … SA-17, SA-20 … SA-22): the
 * nine Phase-6 reads on the product world and after Flow F, who may call them, and the flows the
 * screens drive on the product ports — Flow F released and held (Content Manager → Academic
 * Reviewer → Super Admin; never "Publish"; no plan, grant or person changes, BC9), a scope that
 * unblocks a stuck submission and one withdrawn and restored, a structure change the public pages
 * read, and a support report resolved and reopened.
 */
import {
  accessEndingOutput,
  getStructureAreaOutput,
  getStructureCourseOutput,
  holderView,
  listHoldersOutput,
  listUpdatesForReleaseOutput,
  listUpdatesOutput,
  type ProductPorts,
  superAdminOverviewOutput,
  supportReportsOutput,
} from '@xr/contracts/draft';
import {
  type AreaId,
  type CourseId,
  type ExperimentId,
  type RoleHolderId,
  type SubmissionId,
  unsafeBrand,
  type UpdateId,
} from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { createSamplePlatform, type SamplePlatform } from '../index.js';
import { afterFlow, asPerson, asPersonId, worldOf } from '../testing/index.js';
import { values } from '../world/records.js';

function ok<T>(answer: { readonly ok: true; readonly value: T } | { readonly ok: false }): T {
  if (!answer.ok) throw new Error(`expected a success, got ${JSON.stringify(answer)}`);
  return answer.value;
}

function errorOf(answer: { readonly ok: boolean; readonly error?: unknown }) {
  expect(answer.ok).toBe(false);
  return answer.error as { readonly kind: string; readonly code?: string; readonly why?: string };
}

const CM = 'Kavya Nair';
const REVIEWER = 'Prof. A. Menon';
const SA = 'Arjun Mehta';
const VENDOR = 'Anil Shetty';
const SHELL = unsafeBrand<ExperimentId>('shell-and-tube-heat-exchanger');
const ORIFICE = unsafeBrand<ExperimentId>('orifice-plate-metering');

/** What publication or release must never change (BC9): plans, grants, waits, people, mappings. */
function accessOf(platform: SamplePlatform) {
  const records = worldOf(platform).records;
  return JSON.stringify([
    values(records.plans),
    values(records.grants),
    values(records.waits),
    values(records.people),
    values(records.mappings),
    values(records.institutions),
  ]);
}

/** CM opens (or joins) a correction, edits it, sends it; the reviewer approves it. */
async function approvedCorrection(
  platform: SamplePlatform,
  experimentId: ExperimentId,
  edit: { readonly summary: string; readonly versionLabel: string; readonly why: string },
): Promise<UpdateId> {
  const cm = asPerson(platform, CM);
  const opened = ok(
    await cm.corrections.openCorrection({ experimentId, entry: 'edit-catalogue-details' }),
  );
  expect(opened.joined).toBe(false);
  const saved = ok(
    await cm.corrections.saveCorrection({
      id: opened.update.id,
      proposed: { ...opened.update.proposed, summary: edit.summary },
      whatChangesAndWhy: edit.why,
      versionLabel: edit.versionLabel,
      expectedRev: opened.update.rev,
    }),
  );
  // The draft is private: the live version, the public page and the Super Admin see nothing yet.
  const live = ok(await asPerson(platform, CM).catalogue.getExperiment(experimentId));
  expect(live.summary).not.toBe(edit.summary);
  expect(errorOf(await asPerson(platform, SA).corrections.getUpdateDecision(saved.id)).kind).toBe(
    'invalid-state',
  );
  const sent = ok(
    await cm.corrections.sendForAcademicReview({ id: saved.id, expectedRev: saved.rev }),
  );
  const reviewer = asPerson(platform, REVIEWER);
  const review = ok(await reviewer.corrections.getUpdateForReview(sent.id));
  expect(review.comparison.map((row) => row.field)).toEqual(['summary', 'version']);
  const approved = ok(
    await reviewer.corrections.approveUpdate({ id: sent.id, expectedRev: sent.rev }),
  );
  expect(approved.state).toBe('awaiting-release-decision');
  // Approval alone releases nothing.
  expect(ok(await asPerson(platform, CM).catalogue.getExperiment(experimentId)).summary).not.toBe(
    edit.summary,
  );
  return approved.id;
}

describe('Phase 6 reads on the product world', () => {
  it('SA-01: the figures and eight groups agree with the lists they open', async () => {
    const platform = createSamplePlatform({ world: await afterFlow('F') });
    const sa = asPerson(platform, SA);
    const overview = ok(await sa.operations.getSuperAdminOverview());
    expect(superAdminOverviewOutput.safeParse(overview).success).toBe(true);
    expect(overview.figures).toEqual({
      activeInstitutions: 4,
      paused: 1,
      awaitingPayment: 1,
      publishedExperiments: 13,
    });
    const requests = ok(
      await sa.accessRequests.listRequests({ status: 'under-review', sort: 'received-newest' }),
    );
    expect(overview.requests.count).toBe(requests.length);
    expect(overview.requests.rows.map((row) => row.request.id)).toEqual(
      requests.slice(0, 4).map((row) => row.id),
    );
    const renewal = overview.requests.rows.find((row) => row.request.type === 'renewal');
    expect(renewal?.accessEndsOn).toBe('2026-10-31');
    const waiting = ok(await sa.corrections.listUpdatesForRelease({ tab: 'waiting-for-you' }));
    expect(overview.updates.count).toBe(waiting.length);
    const forwarded = ok(await sa.operations.listDeviceTransfers({ state: 'forwarded' }));
    expect(overview.deviceTransfers.count).toBe(forwarded.length);
    const open = ok(await sa.operations.listSupportReports({})).filter(
      (report) => report.state !== 'resolved',
    );
    expect(overview.support.rows.map((report) => report.id)).toEqual(
      open.slice(0, 4).map((report) => report.id),
    );
    const ending = ok(await sa.operations.listAccessEnding()).filter(
      (view) => view.row.endedDaysAgo === null,
    );
    expect(overview.accessEnding.count).toBe(ending.length);
    const noAdmin = ok(await sa.institutions.listInstitutions({ tab: 'no-institute-admin' }));
    expect(overview.institutionsWithoutAdmin.rows.map((row) => row.institutionId)).toEqual(
      noAdmin.map((row) => row.id),
    );
    const stuck = ok(await sa.production.listAllContent({ status: 'stuck' }));
    expect(overview.stuckContent.rows.map((row) => row.submissionId)).toEqual(
      stuck.map((row) => row.ref.id),
    );
    expect(overview.holdersWithoutScope.rows.map((row) => row.holder.name)).toEqual(['Dr K. Iyer']);
    for (const group of Object.values(overview).filter((value) => 'rows' in value)) {
      expect((group as { readonly rows: readonly unknown[] }).rows.length).toBeLessThanOrEqual(4);
    }
  });

  it('CM-08 and SA-10: the corrections by who has them and by release tab', async () => {
    const platform = createSamplePlatform();
    const updates = ok(await asPerson(platform, CM).corrections.listUpdates({}));
    expect(listUpdatesOutput.safeParse(updates).success).toBe(true);
    expect(updates.map((row) => [row.update.id, row.withWhom])).toEqual([
      ['UPD-0006', 'you'],
      ['UPD-0004', 'super-admin'],
      ['UPD-0003', null],
      ['UPD-0002', null],
      ['UPD-0001', null],
    ]);
    const returned = ok(
      await asPerson(platform, CM).corrections.listUpdates({ state: 'returned' }),
    );
    expect(returned.map((row) => row.update.id)).toEqual(['UPD-0006']);
    const sa = asPerson(platform, SA);
    const held = ok(await sa.corrections.listUpdatesForRelease({ tab: 'on-hold' }));
    expect(listUpdatesForReleaseOutput.safeParse(held).success).toBe(true);
    expect(held.map((row) => [row.update.id, row.experimentName, row.courseCode])).toEqual([
      ['UPD-0004', 'Boiler Drum Level', 'CHE ZG513'],
    ]);
    const released = ok(await sa.corrections.listUpdatesForRelease({ tab: 'released' }));
    expect(released.map((row) => row.update.id)).toEqual(['UPD-0003', 'UPD-0002', 'UPD-0001']);
    // UPD-0006 (returned) is never the Super Admin's to see (UPD-18).
    expect(ok(await sa.corrections.listUpdatesForRelease({ tab: 'waiting-for-you' }))).toEqual([]);
  });

  it('SA-15, SA-16, SA-17, SA-20, SA-22: shapes, order and named usage', async () => {
    const platform = createSamplePlatform({ world: await afterFlow('F') });
    const sa = asPerson(platform, SA);
    const course = ok(
      await sa.academicStructure.getCourse(unsafeBrand<CourseId>('thermodynamics-heat-transfer')),
    );
    expect(getStructureCourseOutput.safeParse(course).success).toBe(true);
    expect(course.areaName).toBe('Mechanical & Manufacturing');
    expect(course.detail.institutions).toEqual([
      {
        institutionId: 'godavari',
        name: 'Godavari Institute of Technology',
        institutionCode: 'MEC-523',
        ended: false,
      },
    ]);
    expect(course.detail.faculty[0]?.names).toEqual(['Dr S. Ranganathan']);
    expect(course.usage.studentsFiled).toBe(12);
    const area = ok(await sa.academicStructure.getArea(unsafeBrand<AreaId>('chemical-process')));
    expect(getStructureAreaOutput.safeParse(area).success).toBe(true);
    expect(area.courses.map((entry) => entry.platformCode)).toEqual(['CHE ZG513']);
    const reviewers = ok(await sa.platformRoles.listHolders({ tab: 'reviewers' }));
    expect(listHoldersOutput.safeParse(reviewers).success).toBe(true);
    expect(reviewers.map((row) => row.holder.name)).toEqual(['Prof. A. Menon', 'Dr K. Iyer']);
    expect(reviewers[0]!.scopes.map((scope) => [scope.status, scope.courseCode])).toEqual([
      ['active', 'ME ZG523'],
      ['active', 'MEL ZG512'],
      ['active', 'CHE ZG513'],
      ['withdrawn', 'EEE ZC341'],
    ]);
    expect(reviewers[1]!.scopes).toEqual([]);
    const searched = ok(await sa.platformRoles.listHolders({ tab: 'vendors', search: 'meridian' }));
    expect(searched.map((row) => row.holder.name)).toEqual(['Ritu Sharma']);
    const kavya = ok(
      await sa.platformRoles.getHolder(unsafeBrand<RoleHolderId>('role-kavya-nair')),
    );
    expect(holderView.safeParse(kavya).success).toBe(true);
    expect(kavya.scopes.map((scope) => scope.scope.target.kind)).toEqual(['all']);
    const reports = ok(await sa.operations.listSupportReports({}));
    expect(supportReportsOutput.safeParse(reports).success).toBe(true);
    expect(
      ok(await sa.operations.listSupportReports({ state: 'reopened' })).map((r) => r.id),
    ).toEqual(['SUP-0207']);
    const ending = ok(await sa.operations.listAccessEnding());
    expect(accessEndingOutput.safeParse(ending).success).toBe(true);
    expect(ending.map((view) => [view.institutionName, view.row.standing.kind])).toEqual([
      ['BITS Pilani — Hyderabad Campus', 'renewal-in-progress'],
      ['Konark Polytechnic', 'reminder-due'],
      ['Malnad College of Engineering', 'ended-no-renewal'],
    ]);
  });

  it('who may call: every Super Admin read refuses other workspaces; CM-08 is the Content Manager’s', async () => {
    const platform = createSamplePlatform({ world: await afterFlow('F') });
    const others: readonly ProductPorts[] = [
      asPerson(platform, CM),
      asPerson(platform, REVIEWER),
      asPerson(platform, VENDOR),
      asPerson(platform, 'Rahul Verma'),
      asPerson(platform, 'Meera Iyer'),
    ];
    for (const ports of others) {
      for (const answer of [
        await ports.operations.getSuperAdminOverview(),
        await ports.operations.listSupportReports({}),
        await ports.operations.listAccessEnding(),
        await ports.corrections.listUpdatesForRelease({ tab: 'on-hold' }),
        await ports.platformRoles.listHolders({ tab: 'reviewers' }),
        await ports.academicStructure.getCourse(
          unsafeBrand<CourseId>('thermodynamics-heat-transfer'),
        ),
        await ports.academicStructure.getArea(unsafeBrand<AreaId>('chemical-process')),
      ]) {
        expect(errorOf(answer).kind).toBe('not-permitted');
      }
    }
    for (const name of [SA, REVIEWER, VENDOR, 'Rahul Verma']) {
      expect(errorOf(await asPerson(platform, name).corrections.listUpdates({})).kind).toBe(
        'not-permitted',
      );
    }
    // SA-17 is the Super Admin's: a holder does not open even their own record there.
    expect(
      errorOf(
        await asPerson(platform, REVIEWER).platformRoles.getHolder(
          unsafeBrand<RoleHolderId>('role-a-menon'),
        ),
      ).kind,
    ).toBe('not-permitted');
  });
});

describe('Flow F on the product ports', () => {
  it('released: the approved correction becomes the live version for the public and an entitled Student; access is unchanged', async () => {
    const platform = createSamplePlatform({ world: await afterFlow('E') });
    const rahul = asPerson(platform, 'Rahul Verma');
    const before = ok(await rahul.studentAccess.getExperimentHub(SHELL));
    const access = accessOf(platform);
    const summary = 'Counter-flow and parallel-flow runs, with the LMTD read from your own data.';
    const id = await approvedCorrection(platform, SHELL, {
      summary,
      versionLabel: '1.1',
      why: 'The summary now says what the Student measures.',
    });
    const sa = asPerson(platform, SA);
    const waiting = ok(await sa.corrections.listUpdatesForRelease({ tab: 'waiting-for-you' }));
    expect(waiting.map((row) => row.update.id)).toContain(id);
    const overview = ok(await sa.operations.getSuperAdminOverview());
    expect(overview.updates.count).toBe(waiting.length);
    expect(overview.updates.rows.find((row) => row.update.id === id)?.liveLabel).toBe('1.0');
    const decision = ok(await sa.corrections.getUpdateDecision(id));
    // A stale decision is refused (optimistic concurrency).
    expect(
      errorOf(await sa.corrections.releaseUpdate({ id, expectedRev: decision.update.rev - 1 }))
        .kind,
    ).toBe('stale-version');
    const released = ok(
      await sa.corrections.releaseUpdate({ id, expectedRev: decision.update.rev }),
    );
    expect(released.update.state).toBe('released');
    expect(released.experiment.live.label).toBe('1.1');
    // Released twice is refused: the decision is made.
    expect(
      errorOf(await sa.corrections.releaseUpdate({ id, expectedRev: released.update.rev })).kind,
    ).toBe('invalid-state');
    expect(ok(await asPerson(platform, CM).catalogue.getExperiment(SHELL)).summary).toBe(summary);
    const after = ok(await rahul.studentAccess.getExperimentHub(SHELL));
    expect(after.experiment.summary).toBe(summary);
    expect(after.grantIds).toEqual(before.grantIds);
    expect(accessOf(platform)).toBe(access);
    // Decided, it still shows what it changed: against the version its release replaced.
    const decided = ok(await sa.corrections.getUpdateDecision(id));
    expect(decided.comparison.map((row) => [row.field, row.liveNow, row.proposed])).toEqual([
      ['summary', before.experiment.summary, summary],
      ['version', '1.0', '1.1'],
    ]);
    const published = ok(await asPerson(platform, CM).corrections.getPublishedExperiment(SHELL));
    expect(published.openUpdate).toBeNull();
    expect(published.experiment.versions.map((version) => version.label)).toEqual(['1.0', '1.1']);
  });

  it('held: the live version stays; release is refused until the hold is lifted; nothing reaches the public', async () => {
    const platform = createSamplePlatform({ world: await afterFlow('E') });
    const access = accessOf(platform);
    const summary = 'A held summary that must never reach the catalogue.';
    const id = await approvedCorrection(platform, ORIFICE, {
      summary,
      versionLabel: '1.2',
      why: 'Held while the build is checked.',
    });
    const sa = asPerson(platform, SA);
    const decision = ok(await sa.corrections.getUpdateDecision(id));
    expect(
      errorOf(
        await sa.corrections.holdUpdate({ id, reason: '  ', expectedRev: decision.update.rev }),
      ).kind,
    ).toBe('validation-failed');
    const held = ok(
      await sa.corrections.holdUpdate({
        id,
        reason: 'Version 1.1 stays live while the 1.2 build is checked.',
        expectedRev: decision.update.rev,
      }),
    );
    expect(held.state).toBe('on-hold');
    const refused = errorOf(await sa.corrections.releaseUpdate({ id, expectedRev: held.rev }));
    expect([refused.kind, refused.code]).toEqual(['refused', 'hold-must-be-lifted']);
    const page = ok(await asPerson(platform, 'Rahul Verma').catalogue.getExperiment(ORIFICE));
    expect(page.summary).not.toBe(summary);
    expect(
      ok(await sa.corrections.listUpdatesForRelease({ tab: 'on-hold' })).map((r) => r.update.id),
    ).toContain(id);
    // The CM sees the hold and its reason; a held update is still the experiment's one open update.
    const cm = asPerson(platform, CM);
    const mine = ok(await cm.corrections.getUpdate(id));
    expect(mine.update.hold?.reason).toBe('Version 1.1 stays live while the 1.2 build is checked.');
    expect(
      errorOf(
        await cm.corrections.openCorrection({
          experimentId: ORIFICE,
          entry: 'start-a-correction',
        }),
      ).kind,
    ).toBe('refused');
    const lifted = ok(await sa.corrections.liftHold({ id, expectedRev: held.rev }));
    expect(lifted.state).toBe('awaiting-release-decision');
    expect(ok(await cm.catalogue.getExperiment(ORIFICE)).summary).not.toBe(summary);
    expect(accessOf(platform)).toBe(access);
  });

  it('the reviewer returns an update with a reason; the Content Manager continues it; nothing is live', async () => {
    const platform = createSamplePlatform({ world: await afterFlow('E') });
    const cm = asPerson(platform, CM);
    const opened = ok(
      await cm.corrections.openCorrection({ experimentId: SHELL, entry: 'edit-delivery-link' }),
    );
    const saved = ok(
      await cm.corrections.saveCorrection({
        id: opened.update.id,
        proposed: { ...opened.update.proposed, webLink: 'https://labs.example/shell-1-1' },
        whatChangesAndWhy: 'New build link.',
        versionLabel: '1.1',
        expectedRev: opened.update.rev,
      }),
    );
    const sent = ok(
      await cm.corrections.sendForAcademicReview({ id: saved.id, expectedRev: saved.rev }),
    );
    const reviewer = asPerson(platform, REVIEWER);
    expect(
      errorOf(
        await reviewer.corrections.returnUpdate({ id: sent.id, reason: '', expectedRev: sent.rev }),
      ).kind,
    ).toBe('validation-failed');
    const returned = ok(
      await reviewer.corrections.returnUpdate({
        id: sent.id,
        reason: 'The link still points at the old build.',
        expectedRev: sent.rev,
      }),
    );
    expect(returned.state).toBe('returned');
    expect(
      ok(await cm.corrections.listUpdates({ state: 'returned' })).map((row) => row.update.id),
    ).toContain(sent.id);
    // The Super Admin never sees a returned update (UPD-18).
    expect(errorOf(await asPerson(platform, SA).corrections.getUpdateDecision(sent.id)).kind).toBe(
      'invalid-state',
    );
    // Joining from the published page continues the same update, never a second one.
    const joined = ok(
      await cm.corrections.openCorrection({ experimentId: SHELL, entry: 'edit-catalogue-details' }),
    );
    expect([joined.joined, joined.update.id]).toEqual([true, sent.id]);
  });
});

describe('each role reads only what its audience may (UPD-16, UPD-17, UPD-18, UPD-21)', () => {
  it('the reviewer never reads a hold, a withdrawal reason or a never-sent update; the Super Admin never reads a return reason', async () => {
    const platform = createSamplePlatform({ world: await afterFlow('E') });
    const reviewer = asPerson(platform, REVIEWER);
    // UPD-0004 is on hold with a reason: the reviewer who approved it reads that it is held, not why.
    const held = ok(
      await reviewer.corrections.getUpdateForReview(unsafeBrand<UpdateId>('UPD-0004')),
    );
    expect([held.update.state, held.update.hold, held.update.holdLifts]).toEqual([
      'on-hold',
      null,
      [],
    ]);
    expect(held.update.history.map((entry) => entry.event)).not.toContain('put-on-hold');
    const sa = asPerson(platform, SA);
    expect(
      ok(await sa.corrections.getUpdateDecision(unsafeBrand<UpdateId>('UPD-0004'))).update.hold
        ?.reason,
    ).toBe('Version 2.0 stays live while the 2.1 build is checked.');

    // A correction returned with a reason, re-sent and approved: the Super Admin reads the approval,
    // never the return's reason — in the list, the decision page, the overview or the record.
    const cm = asPerson(platform, CM);
    const opened = ok(
      await cm.corrections.openCorrection({ experimentId: SHELL, entry: 'start-a-correction' }),
    );
    const saved = ok(
      await cm.corrections.saveCorrection({
        id: opened.update.id,
        proposed: { ...opened.update.proposed, summary: 'A clearer summary.' },
        whatChangesAndWhy: 'Clearer summary.',
        versionLabel: '1.1',
        expectedRev: opened.update.rev,
      }),
    );
    const sent = ok(
      await cm.corrections.sendForAcademicReview({ id: saved.id, expectedRev: saved.rev }),
    );
    const reason = 'Say which readings the summary means.';
    const returned = ok(
      await reviewer.corrections.returnUpdate({ id: sent.id, reason, expectedRev: sent.rev }),
    );
    const resent = ok(
      await cm.corrections.sendForAcademicReview({ id: returned.id, expectedRev: returned.rev }),
    );
    // The Content Manager and the reviewer keep the reason.
    expect(resent.reviewDecisions.map((decision) => decision.reason)).toEqual([reason]);
    const approved = ok(
      await reviewer.corrections.approveUpdate({ id: resent.id, expectedRev: resent.rev }),
    );
    expect(approved.reviewDecisions.map((decision) => decision.reason)).toEqual([reason, null]);
    const seen = [
      ok(await sa.corrections.getUpdateDecision(approved.id)).update,
      ok(await sa.corrections.listUpdatesForRelease({ tab: 'waiting-for-you' })).find(
        (row) => row.update.id === approved.id,
      )!.update,
      ok(await sa.operations.getSuperAdminOverview()).updates.rows.find(
        (row) => row.update.id === approved.id,
      )!.update,
      ok(await sa.production.getContentRecord({ kind: 'EXP', id: SHELL })).openUpdate!,
    ];
    for (const update of seen) {
      expect(JSON.stringify(update)).not.toContain(reason);
      expect(update.history.map((entry) => entry.event)).not.toContain('returned-by-reviewer');
    }
    const decision = ok(await sa.corrections.getUpdateDecision(approved.id));
    const released = ok(
      await sa.corrections.releaseUpdate({ id: approved.id, expectedRev: decision.update.rev }),
    );
    expect(JSON.stringify(released.update)).not.toContain(reason);
  });

  it('a draft withdrawn before it was sent is never the reviewer’s; a withdrawal reason is the Content Manager’s only', async () => {
    const platform = createSamplePlatform({ world: await afterFlow('E') });
    const cm = asPerson(platform, CM);
    const reviewer = asPerson(platform, REVIEWER);
    const draft = ok(
      await cm.corrections.openCorrection({ experimentId: SHELL, entry: 'start-a-correction' }),
    ).update;
    const unsent = ok(
      await cm.corrections.withdrawUpdate({
        id: draft.id,
        reason: 'Opened by mistake.',
        expectedRev: draft.rev,
      }),
    );
    expect(unsent.withdrawal?.reason).toBe('Opened by mistake.');
    expect(errorOf(await reviewer.corrections.getUpdateForReview(draft.id)).kind).toBe(
      'invalid-state',
    );
    // Sent, then withdrawn: the reviewer reads that it was withdrawn, not why.
    const second = ok(
      await cm.corrections.openCorrection({ experimentId: SHELL, entry: 'start-a-correction' }),
    ).update;
    const saved = ok(
      await cm.corrections.saveCorrection({
        id: second.id,
        proposed: { ...second.proposed, summary: 'Another summary.' },
        whatChangesAndWhy: 'Another.',
        versionLabel: '1.1',
        expectedRev: second.rev,
      }),
    );
    const sent = ok(
      await cm.corrections.sendForAcademicReview({ id: saved.id, expectedRev: saved.rev }),
    );
    ok(
      await cm.corrections.withdrawUpdate({
        id: sent.id,
        reason: 'The Vendor sends a new build first.',
        expectedRev: sent.rev,
      }),
    );
    const read = ok(await reviewer.corrections.getUpdateForReview(sent.id));
    expect([read.update.state, read.update.withdrawal]).toEqual(['withdrawn', null]);
    expect(JSON.stringify(read.update)).not.toContain('The Vendor sends a new build first.');
  });
});

describe('Governance and operations on the product ports', () => {
  it('a reviewer scope unblocks a stuck submission; withdrawn, it stops the queue at once; restored, it returns', async () => {
    const platform = createSamplePlatform();
    const sa = asPerson(platform, SA);
    const stuck = unsafeBrand<SubmissionId>('SUB-0085');
    expect(ok(await sa.production.getContentRecord({ kind: 'SUB', id: stuck })).stuck).toBe(true);
    const record = ok(await sa.production.getContentRecord({ kind: 'SUB', id: stuck }));
    expect(record.withdrawnReviewerScopes.map((scope) => scope.holderName)).toEqual([REVIEWER]);
    const menon = ok(await sa.platformRoles.getHolder(unsafeBrand<RoleHolderId>('role-a-menon')));
    const eee = menon.scopes.find((scope) => scope.courseCode === 'EEE ZC341')!;
    const restored = ok(
      await sa.platformRoles.restoreScope({
        holderId: menon.holder.id,
        scopeId: eee.scope.id,
        expectedRev: menon.holder.rev,
      }),
    );
    expect(ok(await sa.production.getContentRecord({ kind: 'SUB', id: stuck })).stuck).toBe(false);
    const queue = ok(await asPerson(platform, REVIEWER).production.getReviewQueue({}));
    expect(queue.map((item) => item.ref.id)).toContain('SUB-0085');
    const active = restored.scopes.find(
      (scope) =>
        scope.withdrawal === null &&
        scope.supersededAt === null &&
        scope.target.kind === 'course' &&
        scope.target.courseId === 'electrical-machines',
    )!;
    ok(
      await sa.platformRoles.withdrawScope({
        holderId: restored.id,
        scopeId: active.id,
        reason: 'Moved to another programme.',
        expectedRev: restored.rev,
      }),
    );
    const after = ok(await asPerson(platform, REVIEWER).production.getReviewQueue({}));
    expect(after.map((item) => item.ref.id)).not.toContain('SUB-0085');
    expect(ok(await sa.operations.getSuperAdminOverview()).stuckContent.count).toBe(1);
  });

  it('a registered reviewer starts with no scope, is flagged, and acts once a course is assigned', async () => {
    const platform = createSamplePlatform();
    const sa = asPerson(platform, SA);
    const holder = ok(
      await sa.platformRoles.registerHolder({
        role: 'academic_reviewer',
        name: 'Dr K. Iyer',
        workEmail: 'k.iyer@wilp.example',
        organisation: 'BITS Pilani · WILP',
      }),
    );
    expect(
      ok(await sa.operations.getSuperAdminOverview()).holdersWithoutScope.rows.map(
        (row) => row.holder.id,
      ),
    ).toEqual([holder.id]);
    const iyer = asPersonId(platform, holder.personId);
    expect(ok(await iyer.production.getReviewQueue({}))).toEqual([]);
    const assigned = ok(
      await sa.platformRoles.assignScope({
        holderId: holder.id,
        target: { kind: 'course', courseId: unsafeBrand<CourseId>('electrical-machines') },
        expectedRev: holder.rev,
      }),
    );
    expect(assigned.scopes).toHaveLength(1);
    expect(ok(await iyer.production.getReviewQueue({})).map((item) => item.ref.id)).toEqual([
      'SUB-0085',
    ]);
    expect(ok(await sa.operations.getSuperAdminOverview()).holdersWithoutScope.count).toBe(0);
    // A duplicate sample identity never takes over a sign-in (PC-49).
    expect(
      errorOf(
        await sa.platformRoles.registerHolder({
          role: 'vendor',
          name: 'Kavya Nair',
          workEmail: 'kavya.nair@wilp.example',
          organisation: 'BITS Pilani · WILP',
        }),
      ).kind,
    ).toBe('validation-failed');
  });

  it('a renamed course and a new one reach the public pages and the Content Manager’s codes', async () => {
    const platform = createSamplePlatform();
    const sa = asPerson(platform, SA);
    const fluids = ok(
      await sa.academicStructure.getCourse(unsafeBrand<CourseId>('fluid-mechanics')),
    );
    ok(
      await sa.academicStructure.rename({
        kind: 'course',
        id: fluids.course.id,
        name: 'Fluid Mechanics & Flow Measurement',
        expectedRev: fluids.course.rev,
      }),
    );
    const added = ok(
      await sa.academicStructure.addCourse({
        name: 'Mass Transfer',
        areaId: unsafeBrand<AreaId>('chemical-process'),
        description: null,
      }),
    );
    expect(added.platformCode).toBeNull();
    const codes = ok(await asPerson(platform, CM).platformCourseCodes.list());
    expect(codes.map((row) => row.course.name)).toEqual(
      expect.arrayContaining(['Fluid Mechanics & Flow Measurement', 'Mass Transfer']),
    );
    const thermo = ok(
      await sa.academicStructure.getCourse(unsafeBrand<CourseId>('thermodynamics-heat-transfer')),
    );
    ok(
      await sa.academicStructure.rename({
        kind: 'course',
        id: thermo.course.id,
        name: 'Heat Transfer & Thermodynamics',
        expectedRev: thermo.course.rev,
      }),
    );
    const publicCourse = ok(await asPerson(platform, CM).catalogue.getCourse(thermo.course.id));
    expect(publicCourse.course.name).toBe('Heat Transfer & Thermodynamics');
  });

  it('a support report is resolved with a note the reporter reads, then reopened', async () => {
    const platform = createSamplePlatform();
    const kavya = asPerson(platform, CM);
    const sent = ok(
      await kavya.operations.reportProblem({
        whatHappened: 'The library search showed nothing.',
        where: 'Content library',
        screenshotFileName: null,
      }),
    );
    const sa = asPerson(platform, SA);
    expect(
      ok(await sa.operations.listSupportReports({ state: 'open' })).map((report) => report.id),
    ).toContain(sent.id);
    expect(ok(await sa.operations.getSuperAdminOverview()).support.rows.map((r) => r.id)).toContain(
      sent.id,
    );
    expect(
      errorOf(await sa.operations.resolveReport({ id: sent.id, note: ' ', expectedRev: sent.rev }))
        .kind,
    ).toBe('validation-failed');
    const resolved = ok(
      await sa.operations.resolveReport({
        id: sent.id,
        note: 'Search now covers course codes. Try again.',
        expectedRev: sent.rev,
      }),
    );
    const mine = ok(await kavya.operations.getMyReport(sent.id));
    expect(mine.state).toBe('resolved');
    expect(mine.resolutions.at(-1)?.note).toBe('Search now covers course codes. Try again.');
    const reopened = ok(
      await sa.operations.reopenReport({ id: sent.id, expectedRev: resolved.rev }),
    );
    expect(reopened.state).toBe('reopened');
    // The reporter has no reopen of their own (SUP-04 open): the Super Admin's own report neither.
    expect(
      errorOf(await kavya.operations.reopenReport({ id: sent.id, expectedRev: reopened.rev })).kind,
    ).toBe('not-permitted');
  });
});

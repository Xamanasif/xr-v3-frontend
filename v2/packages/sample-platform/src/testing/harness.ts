/**
 * The test harness over a sample platform (ADR-0003 §5, ADR-0007): identity set through the
 * harness seam (`as`) — never a UI, an account switcher or a URL — plus the three test-only seams
 * (AD-14 review start, DV-2 objective marks, M-3 resubmission routing), the staged student import,
 * the fault plan and the world snapshot. Exported from `./testing` only; product code cannot reach
 * any of it (the composition root takes the root export, the fences forbid the rest).
 */
import type { ProductPorts } from '@xr/contracts/draft';
import type { ContractSeams } from '@xr/contracts/draft/contract-suite';
import {
  applyObjectiveMarks,
  type IsoInstant,
  type PersonId,
  type QuestionId,
  recordReviewStarted,
  routeResubmission,
  type StudentImportRow,
  systemActor,
} from '@xr/domain';

import { type SamplePlatform, internalsOf } from '../platform/create.js';
import { type PlatformCore, SessionContext, type SessionState } from '../platform/core.js';
import { buildPorts } from '../platform/ports.js';
import { resolvePerson } from '../pipeline/actor.js';
import { systemCommand } from '../pipeline/runner.js';
import { BrowserSession } from '../session/browser-session.js';
import { createStandins, settle } from '../standins/index.js';
import { snapshotOf, values } from '../world/records.js';
import type { World } from '../world/types.js';

export function worldOf(platform: SamplePlatform): World {
  return internalsOf(platform).core.store.world;
}

/** Every record keyed `KIND:id` — the contract suite's snapshot. */
export function snapshot(platform: SamplePlatform): Readonly<Record<string, unknown>> {
  return snapshotOf(worldOf(platform));
}

/** Moves the one sample clock (seed loader and tests only, X-8). */
export function setSampleNow(platform: SamplePlatform, instant: IsoInstant): void {
  internalsOf(platform).clock.set(instant);
}

export function faults(platform: SamplePlatform) {
  return internalsOf(platform).core.faults;
}

export function standinsOf(platform: SamplePlatform) {
  return createStandins(internalsOf(platform).core, 'sample-fixture');
}

/** The person a sample name signs in as, read from the world now (a PER, an IA, a holder or the Super Admin). */
export function personIdOf(world: World, name: string): PersonId {
  const records = world.records;
  const person = values(records.people).find((candidate) => candidate.fullName === name);
  if (person) return person.id;
  const institution = values(records.institutions).find(
    (candidate) => candidate.instituteAdmin?.name === name,
  );
  if (institution?.instituteAdmin) return institution.instituteAdmin.personId;
  const holder = values(records.holders).find((candidate) => candidate.name === name);
  if (holder) return holder.personId;
  const admin = world.identities.superAdmins.find((identity) => identity.displayName === name);
  if (admin) return admin.personId as PersonId;
  throw new Error(`No sample person called ${name} in this world.`);
}

/** A session for a person the world knows now (a PER, an IA, a holder or the Super Admin). */
function sessionOf(core: PlatformCore, personId: string): SessionState {
  const world = core.store.world;
  if (!resolvePerson(world.records, world.identities, personId)) {
    throw new Error(`No sample person with id ${personId} in this world.`);
  }
  return {
    personId: personId as PersonId,
    nonce: core.nonces.next('session'),
    signedInAt: core.clock.now(),
    returnTo: null,
  };
}

/** The ports as a sample person, in a session of their own (the harness seam, ADR-0003 §5). */
export function asPerson(platform: SamplePlatform, name: string): ProductPorts {
  return asPersonId(platform, personIdOf(worldOf(platform), name));
}

/**
 * `asPerson` by person id — what the web test-hook bridge's `actAs` receives from Playwright
 * (Appendix F §7.2: the e2e helpers name a person by id only). A session of its own: the
 * platform's own session (the tab's signed-in person) is untouched.
 */
export function asPersonId(platform: SamplePlatform, personId: string): ProductPorts {
  const { core } = internalsOf(platform);
  const context = new SessionContext(new BrowserSession(core.nonces.next('browser'), null));
  context.session = sessionOf(core, personId);
  return buildPorts(core, context, null);
}

/**
 * Starts the platform's own session as a sample person, without the XS-01 form — the CI-only
 * boot descriptor of the web test-hook bridge (ADR-0003 §3; ADR-0007 §3). Test builds only: the
 * product signs in only through `SessionService.signIn`.
 */
export function beginSession(platform: SamplePlatform, personId: string): void {
  const { core, context } = internalsOf(platform);
  context.session = sessionOf(core, personId);
}

/** A visitor's ports with a browser session of their own (the public surface). */
export function visitorPorts(platform: SamplePlatform): ProductPorts {
  const { core } = internalsOf(platform);
  return buildPorts(
    core,
    new SessionContext(new BrowserSession(core.nonces.next('browser'), null)),
    null,
  );
}

/**
 * DV-2: choice-question marks supplied by the fixture — no answer is compared with a key. The
 * values are the ones B4-13 draws for ATT-0450 (11 of 16: question 1 2/2, question 2 0/2,
 * question 3 2/2); a question without a supplied value fails loudly instead of being scored.
 */
export const SUPPLIED_OBJECTIVE_MARKS: Readonly<Record<string, number>> = {
  'Q-0101': 2,
  'Q-0102': 0,
  'Q-0104': 2,
};

export interface SampleSeams extends Required<ContractSeams> {
  readonly supplyObjectiveMarks: (
    attemptId: string,
    supplied?: Readonly<Record<string, number>>,
  ) => void;
}

function seamFailure(seam: string, current: string): never {
  throw new Error(`The ${seam} seam was refused: ${current}.`);
}

/** The three test-only seams (ADR-0007 §4; WP-0.11 §7): unavailable to ordinary product code. */
export function seamsOf(platform: SamplePlatform): SampleSeams {
  const { core } = internalsOf(platform);
  return {
    recordReviewStarted: (requestId) => {
      const outcome = systemCommand(core, 'seam.recordReviewStarted', 'test-seam', (op) => {
        const request = op.found(op.records.requests[requestId]);
        const actor = systemActor('system:review-start');
        const next = settle(recordReviewStarted({ request, actor, now: op.now, ids: op.ids }));
        op.tx.put('requests', next.id, next);
        return { value: next, decision: 'recordReviewStarted', actor };
      });
      if (!outcome.ok) seamFailure('review-start', outcome.current);
    },
    supplyObjectiveMarks: (attemptId, supplied = SUPPLIED_OBJECTIVE_MARKS) => {
      const outcome = systemCommand(core, 'seam.supplyObjectiveMarks', 'test-seam', (op) => {
        const attempt = op.found(op.records.attempts[attemptId]);
        const assessment = op.found(op.records.assessments[attempt.assessmentId]);
        const version = assessment.versions.find(
          (entry) => entry.version === attempt.assessmentVersion,
        );
        const choice = (version?.questions ?? []).filter((ref) => {
          const question = op.records.questions[ref.questionId];
          const pinned = question?.versions.find((entry) => entry.version === ref.questionVersion);
          return pinned !== undefined && pinned.body.type !== 'written';
        });
        const marks = choice.map((ref) => {
          const awarded = supplied[ref.questionId];
          if (awarded === undefined)
            seamFailure('objective-marks', `no supplied mark for ${ref.questionId}`);
          return { questionId: ref.questionId as QuestionId, awarded };
        });
        const actor = systemActor('system:objective-marks');
        const next = settle(
          applyObjectiveMarks({
            attempt,
            assessment,
            questions: values(op.records.questions),
            supplied: marks,
            actor,
            now: op.now,
          }),
        );
        op.tx.put('attempts', next.id, next);
        return { value: next, decision: 'applyObjectiveMarks', actor };
      });
      if (!outcome.ok) seamFailure('objective-marks', outcome.current);
    },
    routeResubmission: (submissionId) => {
      const outcome = systemCommand(core, 'seam.routeResubmission', 'test-seam', (op) => {
        const submission = op.found(op.records.submissions[submissionId]);
        const actor = systemActor('system:workflow-routing');
        const next = settle(
          routeResubmission({ submission, routing: core.routing, actor, now: op.now, ids: op.ids }),
        );
        op.tx.put('submissions', next.id, next);
        return { value: next, decision: 'routeResubmission', actor };
      });
      if (!outcome.ok) seamFailure('workflow-routing', outcome.current);
    },
  };
}

/**
 * Stages a checked student-import file (IA-11 step 2 → 3). The Phase-2 preview parses CSV files;
 * in WP-0.11 the walk and tests stage validated rows, then commit them through the port.
 */
export function stageStudentImport(
  platform: SamplePlatform,
  batch: {
    readonly institutionId: string;
    readonly fileName: string;
    readonly rows: readonly StudentImportRow[];
  },
): string {
  const { core } = internalsOf(platform);
  const batchId = `imp-${String(core.imports.size + 1).padStart(4, '0')}-${batch.fileName}`;
  core.imports.set(batchId, { batchId, ...batch });
  return batchId;
}

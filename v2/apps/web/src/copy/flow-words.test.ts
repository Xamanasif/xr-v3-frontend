// @vitest-environment node
/**
 * WP-0.14 role-relative copy verification (Appendix F WP-0.14 acceptance 3 and §7.4; owner
 * instruction §6). Three independent sources must agree for every entry:
 *
 *  1. the frozen board frame — the fixture's words are found in `derived/frame-index.json` at the
 *     board, frame and field the entry names (the fixture is never generated from app copy);
 *  2. the sample world — the role's OWN port read, on the scripted walk at that step (or the
 *     drawn alternate run on it), gives the canonical state;
 *  3. the application copy — `flow-state-words.ts` turns that state into words for that role.
 *
 * (2)→(3) must equal (1). A copy error, a wrong role mapping or a mock that reaches the wrong state
 * fails here; entries whose words the boards leave open stay `null` with their decision id.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { ProductPorts } from '@xr/contracts/draft';
import { type ExperimentId, type InstitutionId, type PersonId, unsafeBrand } from '@xr/domain';
import {
  asPerson,
  assemblePlatform,
  buildWorld,
  fixtureWorld,
  runWalk,
  seamsOf,
  stepsTo,
  visitorPorts,
  worldOf,
} from '@xr/sample-platform/testing';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT } from '@/test-support/boards';

import {
  ASSESSMENT_HEADINGS,
  assessmentReadinessWords,
  attemptPageHeading,
  availabilityWords,
  experimentStatusWords,
  feedbackPageHeading,
  FLOW_HEADINGS,
  formatPageWords,
  formatProgressWords,
  grantWords,
  instituteAccessWords,
  institutionWords,
  markingWords,
  myCoursesHeadings,
  planWords,
  publicExperimentHeading,
  publishedExperimentActions,
  REQUEST_NEXT_STEP,
  requestWords,
  resultPageHeading,
  resultWords,
  reviewedByMeWords,
  studentAssessmentWords,
  studentHomeNotice,
  submissionHeadingWords,
  submissionWords,
  supportWords,
  transferActionWords,
  transferWords,
  updateHeadingWords,
  updateWords,
  wordsOf,
  type Words,
} from './flow-state-words';
import { EXPECTED_WORDS, type FlowStep, UNWORDED_STEPS } from './flow-words.fixture';

// ---- (1) the frozen frames ----

interface Frame {
  readonly board: string;
  readonly frame: number;
  readonly headings: readonly string[];
  readonly statuses: readonly string[];
  readonly controls: readonly string[];
}

const FRAMES: readonly Frame[] = (
  JSON.parse(
    readFileSync(join(REPO_ROOT, 'design', 'handoff-v46', 'derived', 'frame-index.json'), 'utf8'),
  ) as { frames: Frame[] }
).frames;

const FLOWS: readonly { flow: string; step: string }[] = (
  JSON.parse(
    readFileSync(
      join(REPO_ROOT, 'design', 'handoff-v46', 'canvas-v46', 'project', 'handoff', 'flows.json'),
      'utf8',
    ),
  ) as { steps: { flow: string; step: string }[] }
).steps;

function frameOf(board: string, index: number): Frame | undefined {
  return FRAMES.find((frame) => frame.board.startsWith(`${board}-`) && frame.frame === index);
}

const FIELD = { status: 'statuses', heading: 'headings', control: 'controls' } as const;

describe('the expected-words fixture is taken from the frozen frames (independent of app copy)', () => {
  it.each(EXPECTED_WORDS.map((entry) => [entry.id, entry] as const))('%s', (_id, entry) => {
    const frame = frameOf(entry.board, entry.frame);
    expect(frame, `${entry.board} frame ${entry.frame} exists in the frame index`).toBeDefined();
    if (entry.expected === null) {
      expect(entry.decision, 'an unworded entry names its open decision').toBeTruthy();
      return;
    }
    expect(frame![FIELD[entry.field]], `${entry.board} f${entry.frame} ${entry.field}`).toContain(
      entry.expected,
    );
  });

  it('covers every flows.json step and every drawn alternate, with each entry’s step, screen, role, board and frame', () => {
    const steps = new Set<FlowStep>(EXPECTED_WORDS.map((entry) => entry.step));
    const flowSteps = FLOWS.map(
      (step) =>
        (step.flow === 'Device' ? `Device ${step.step}` : `${step.flow}${step.step}`) as FlowStep,
    );
    expect(flowSteps).toHaveLength(27);
    expect(flowSteps.filter((step) => !steps.has(step) && !UNWORDED_STEPS[step])).toEqual([]);
    for (const alternate of [
      'A-info',
      'B-withdraw',
      'E-alt1',
      'E-alt2',
      'E-alt3',
      'F-alt return',
      'F-alt withdraw',
      'Hold',
      'Lift hold',
    ] as const)
      expect(steps.has(alternate), alternate).toBe(true);
    for (const entry of EXPECTED_WORDS) {
      expect(entry.screen, entry.id).toMatch(/^(PU|ST|FA|IA|VE|RV|CM|SA|XS)-\d{2}$/);
      expect(new Set(EXPECTED_WORDS.map((item) => item.id)).size).toBe(EXPECTED_WORDS.length);
    }
  });

  it('the fixture imports nothing from the application’s copy', () => {
    const source = readFileSync(join(import.meta.dirname, 'flow-words.fixture.ts'), 'utf8');
    expect(source).not.toMatch(/^import /m);
  });
});

// ---- (2) the sample world at each step ----

type World = Awaited<ReturnType<typeof fixtureWorld>>;
const SHELL = unsafeBrand<ExperimentId>('shell-and-tube-heat-exchanger');
const DISTILLATION = unsafeBrand<ExperimentId>('distillation-column');
const GODAVARI = unsafeBrand<InstitutionId>('godavari');
const cuts = new Map<string, Promise<World>>();

/** The world the scripted walk leaves after walk step `id` (cached; worlds are immutable). */
function walkedThrough(id: string): Promise<World> {
  let world = cuts.get(id);
  if (!world) {
    world = fixtureWorld('spine-start').then((seed) => {
      const { steps, at } = stepsTo({ through: id });
      return buildWorld(seed, steps, { seedId: `wp-0.14-${id}`, at });
    });
    cuts.set(id, world);
  }
  return world;
}

interface At {
  readonly as: (name: string) => ProductPorts;
  readonly visitor: ProductPorts;
  readonly platform: ReturnType<typeof assemblePlatform>;
  readonly personId: (name: string) => PersonId;
}

/** A fresh platform on the walk's world after `id`: probes may act on it without touching others. */
async function at(id: string): Promise<At> {
  const platform = assemblePlatform({ world: await walkedThrough(id) });
  const people = new Map<string, ProductPorts>();
  return {
    platform,
    visitor: visitorPorts(platform),
    as: (name) => {
      if (!people.has(name)) people.set(name, asPerson(platform, name));
      return people.get(name)!;
    },
    personId: (name) => {
      const person = Object.values(worldOf(platform).records.people).find(
        (row) => row.fullName === name,
      );
      if (!person) throw new Error(`No ${name}`);
      return person.id;
    },
  };
}

async function v<T>(
  answer:
    | Promise<{ ok: true; value: T } | { ok: false; error: unknown }>
    | { ok: true; value: T }
    | { ok: false; error: unknown },
): Promise<T> {
  const result = await answer;
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result.value;
}

const w = (words: Words): string | null => wordsOf(words);

/** PU-10 for a request, read by the visitor whose browser session holds its ticket. */
async function requester(world: At, reference = 'REQ-0042') {
  const token = worldOf(world.platform).records.requests[reference]!.statusToken;
  return v(world.visitor.accessRequests.getRequestStatus(token));
}

/**
 * The walk run on a fresh platform with OUR visitor sending REQ-0042, so its browser session holds
 * the ticket: PU-10 answers only the session that sent the request (T-01 open otherwise).
 */
async function asRequester(id: string): Promise<At> {
  const platform = assemblePlatform({ world: await fixtureWorld('spine-start') });
  const visitor = visitorPorts(platform);
  await runWalk(platform, stepsTo({ through: id }).steps, new Map(), visitor);
  return {
    platform,
    visitor,
    as: (name) => asPerson(platform, name),
    personId: () => {
      throw new Error('not needed');
    },
  };
}

async function infoRequested(): Promise<{ world: At; reference: string; token: string }> {
  const world = await at('A2');
  const visitor = world.visitor;
  await v(visitor.selection.add({ experimentId: SHELL, formats: ['web'] }));
  const sent = await v(
    visitor.accessRequests.submitPublicRequest({
      institutionName: 'Krishna Valley College of Engineering',
      contactPerson: 'Lakshmi Rao',
      email: 'lakshmi.rao@kvce.edu.in',
      phone: null,
      licencesRequested: '40',
      message: null,
      term: { kind: 'yearly' },
    }),
  );
  const admin = world.as('Arjun Mehta');
  const page = await v(admin.accessRequests.getRequestForDecision(sent.reference));
  await v(
    admin.accessRequests.requestMoreInformation({
      id: page.request.id,
      reason: 'Please confirm how many students will use VR in the first term.',
      expectedRev: page.request.rev,
    }),
  );
  return { world, reference: sent.reference, token: sent.statusToken };
}

/** After the walk, the Institute Admin withdraws SACC-0310, Rahul's only grant (B2-04 f7). */
async function withdrawn(): Promise<At> {
  const world = await at('D5');
  const ia = world.as('Meera Iyer');
  const row = (await v(ia.studentAccess.listGrants({ showWithdrawn: false }))).find(
    (item) => item.grant.id === 'SACC-0310',
  )!;
  await v(
    ia.studentAccess.withdrawGrant({
      grantId: row.grant.id,
      reason: 'Given individually by mistake.',
      expectedRev: row.grant.rev,
    }),
  );
  return world;
}

async function rahulFormat(world: At, format: 'web' | 'vr') {
  return v(world.as('Rahul Verma').learning.getFormatPage({ experimentId: SHELL, format }));
}

async function hubFormat(world: At, format: 'ar' | 'vr' | 'mr') {
  const hub = await v(world.as('Rahul Verma').studentAccess.getExperimentHub(SHELL));
  return hub.row.formats.find((entry) => entry.format === format)!;
}

async function facultyRow(world: At) {
  return v(
    world.as('Dr S. Ranganathan').teaching.getStudentDetail({
      studentId: world.personId('Rahul Verma'),
      experimentId: SHELL,
    }),
  );
}

async function sentBack(to: 'academic-reviewer' | 'vendor'): Promise<At> {
  const world = await at('D5');
  const cm = world.as('Kavya Nair');
  const decision = await v(cm.production.getPublicationDecision(unsafeBrand('SUB-0074')));
  await v(
    cm.production.sendBack(
      to === 'vendor'
        ? {
            id: decision.submission.id,
            to,
            reason: 'The water-bath cooling curve is missing from the description.',
            references: [{ step: 'course-and-description', format: null, field: 'description' }],
            expectedRev: decision.submission.rev,
          }
        : {
            id: decision.submission.id,
            to,
            reason: 'Please re-check the second outcome against the description.',
            expectedRev: decision.submission.rev,
          },
    ),
  );
  return world;
}

async function reviewedLine(world: At, id: string) {
  const rows = await v(world.as('Prof. A. Menon').production.listReviewedByMe());
  const row = rows.find((candidate) => candidate.recordRef.id === id)!;
  return w(reviewedByMeWords(row as Parameters<typeof reviewedByMeWords>[0]));
}

async function returnedUpdate(): Promise<{ world: At; id: string }> {
  const world = await at('D5');
  const cm = world.as('Kavya Nair');
  const opened = await v(
    cm.corrections.openCorrection({ experimentId: DISTILLATION, entry: 'start-a-correction' }),
  );
  const saved = await v(
    cm.corrections.saveCorrection({
      id: opened.update.id,
      proposed: {
        ...opened.update.proposed,
        description: `${opened.update.proposed.description} The reboiler duty is now given in kW.`,
      },
      whatChangesAndWhy: 'Gives the reboiler duty in kW, as the lab sheet does.',
      versionLabel: '1.4',
      expectedRev: opened.update.rev,
    }),
  );
  const sent = await v(
    cm.corrections.sendForAcademicReview({ id: saved.id, expectedRev: saved.rev }),
  );
  await v(
    world.as('Prof. A. Menon').corrections.returnUpdate({
      id: sent.id,
      reason: 'Give the units in the description as well.',
      expectedRev: sent.rev,
    }),
  );
  return { world, id: sent.id };
}

async function paused(): Promise<At> {
  const world = await at('B3');
  const admin = world.as('Arjun Mehta');
  const detail = await v(admin.institutions.getInstitution(GODAVARI));
  await v(
    admin.institutions.pauseInstitution({
      institutionId: GODAVARI,
      reason: 'The institution asked us to pause access while it checks its student list.',
      expectedRev: detail.institution.rev,
    }),
  );
  return world;
}

async function deactivated(): Promise<At> {
  const world = await at('B3');
  const ia = world.as('Meera Iyer');
  const rahul = world.personId('Rahul Verma');
  const record = await v(ia.people.getStudent(rahul));
  await v(
    ia.people.deactivateStudent({
      id: rahul,
      reason: 'Left the programme.',
      expectedRev: record.student.rev,
    }),
  );
  return world;
}

async function transfer(id: string, viewer: 'student' | 'tenant_admin' | 'super_admin') {
  const world = await at(id);
  if (viewer === 'student') {
    const mine = await v(world.as('Rahul Verma').operations.getMyDevice());
    const state = mine.openTransfer?.transfer.state ?? mine.lastTransfer?.state;
    return { world, state: state! };
  }
  if (viewer === 'tenant_admin') {
    return {
      world,
      state: (await v(world.as('Meera Iyer').operations.getDeviceRequest(unsafeBrand('DTR-0018'))))
        .state,
    };
  }
  const rows = await v(world.as('Arjun Mehta').operations.listDeviceTransfers({}));
  return { world, state: rows.find((row) => row.id === 'DTR-0018')!.state };
}

async function updateState(
  id: string,
  viewer: 'content_manager' | 'academic_reviewer' | 'super_admin',
  update = 'UPD-0005',
) {
  const world = await at(id);
  const ref = unsafeBrand<Parameters<ProductPorts['corrections']['getUpdate']>[0]>(update);
  if (viewer === 'content_manager')
    return (await v(world.as('Kavya Nair').corrections.getUpdate(ref))).update.state;
  if (viewer === 'academic_reviewer')
    return (await v(world.as('Prof. A. Menon').corrections.getUpdateForReview(ref))).update.state;
  return (await v(world.as('Arjun Mehta').corrections.getUpdateDecision(ref))).update.state;
}

const SUB_0077 = unsafeBrand<Parameters<ProductPorts['production']['getRecord']>[0]>('SUB-0077');

async function vendorSub(id: string, sub = SUB_0077) {
  return (await v((await at(id)).as('Anil Shetty').production.getRecord(sub))).submission;
}

/** Each fixture entry's words as the application computes them from the role's own read. */
type Probed = string | null | { readonly open: string };

const PROBES: Readonly<Record<string, () => Promise<Probed>>> = {
  'A1-selection': async () => {
    const world = await at('bg-SUP-0207');
    await v(world.visitor.selection.add({ experimentId: SHELL, formats: ['web', 'vr'] }));
    return world.visitor.selection.get().items.length > 0 ? FLOW_HEADINGS.selection : null;
  },
  'A2-sent': async () =>
    (await requester(await asRequester('A2'))).reference === 'REQ-0042'
      ? FLOW_HEADINGS.requestSent
      : null,
  'A2-requester': async () =>
    w(requestWords(await requester(await asRequester('A2')), 'requester')),
  'A2-sa': async () => {
    const rows = await v(
      (await at('A2')).as('Arjun Mehta').accessRequests.listRequests({ sort: 'received-newest' }),
    );
    const row = rows.find((candidate) => candidate.id === 'REQ-0042')!;
    return w(requestWords({ status: row.status, reviewStarted: false }, 'super_admin'));
  },
  'A2-review-started': async () => {
    const world = await asRequester('A2');
    await v(world.as('Arjun Mehta').accessRequests.getRequestForDecision(unsafeBrand('REQ-0042')));
    seamsOf(world.platform).recordReviewStarted('REQ-0042'); // AD-14 interim (test-only seam)
    return w(requestWords(await requester(world), 'requester'));
  },
  'A3-sa': async () => {
    const page = await v(
      (await at('A3'))
        .as('Arjun Mehta')
        .accessRequests.getRequestForDecision(unsafeBrand('REQ-0042')),
    );
    return w(
      requestWords(
        { status: page.request.status, reviewStarted: page.request.reviewStartedAt !== null },
        'super_admin',
      ),
    );
  },
  'A3-requester': async () =>
    w(requestWords(await requester(await asRequester('A3')), 'requester')),
  'A3-next': async () => REQUEST_NEXT_STEP[(await requester(await asRequester('A3'))).nextStep],
  'A4-requester': async () =>
    w(requestWords(await requester(await asRequester('A4-confirm')), 'requester')),
  'A4-next': async () =>
    REQUEST_NEXT_STEP[(await requester(await asRequester('A4-confirm'))).nextStep],
  'A4-sa': async () =>
    w(
      institutionWords(
        (await v((await at('A4-confirm')).as('Arjun Mehta').institutions.getInstitution(GODAVARI)))
          .status,
      ),
    ),
  'A-info-requester': async () => {
    const { world, reference } = await infoRequested();
    return w(requestWords(await requester(world, reference), 'requester'));
  },
  'A-info-sa': async () => {
    const { world, reference } = await infoRequested();
    const page = await v(
      world.as('Arjun Mehta').accessRequests.getRequestForDecision(unsafeBrand(reference)),
    );
    return w(requestWords({ status: page.request.status, reviewStarted: false }, 'super_admin'));
  },
  'B1-ia': async () =>
    w(
      instituteAccessWords(
        (
          await v(
            (await at('B1')).as('Meera Iyer').institutions.getAccessPlan(unsafeBrand('ACC-0107')),
          )
        ).status,
      ),
    ),
  'B2-content': async () =>
    w(
      planWords(
        (
          await v(
            (await at('S7')).as('Meera Iyer').institutions.getAccessPlan(unsafeBrand('ACC-0107')),
          )
        ).status,
      ),
    ),
  'B2-plan': async () =>
    w(
      planWords(
        (
          await v(
            (await at('S7')).as('Meera Iyer').institutions.getAccessPlan(unsafeBrand('ACC-0107')),
          )
        ).status,
      ),
    ),
  'B3-given': async () => {
    const rows = await v(
      (await at('B3')).as('Meera Iyer').studentAccess.listGrants({ showWithdrawn: false }),
    );
    return rows.some((row) => row.grant.id === 'SACC-0310') ? FLOW_HEADINGS.accessGiven : null;
  },
  'B3-grant': async () => {
    const rows = await v(
      (await at('B3')).as('Meera Iyer').studentAccess.listGrants({ showWithdrawn: false }),
    );
    return w(grantWords(rows.find((row) => row.grant.id === 'SACC-0310')!.display));
  },
  'B4-ar': async () =>
    w(availabilityWords((await hubFormat(await at('C2-launch'), 'ar')).availability as never)),
  'B4-mr': async () =>
    w(availabilityWords((await hubFormat(await at('C2-launch'), 'mr')).availability as never)),
  'B4-vr': async () =>
    w(
      formatProgressWords({
        status: (await hubFormat(await at('C2-launch'), 'vr')).progress,
        completion: null,
      }),
    ),
  'B-withdraw-ia': async () => {
    const world = await at('D5');
    const ia = world.as('Meera Iyer');
    const row = (await v(ia.studentAccess.listGrants({ showWithdrawn: false }))).find(
      (item) => item.grant.id === 'SACC-0310',
    )!;
    await v(
      ia.studentAccess.withdrawGrant({
        grantId: row.grant.id,
        reason: 'Given individually by mistake.',
        expectedRev: row.grant.rev,
      }),
    );
    const shown = await v(ia.studentAccess.listGrants({ showWithdrawn: true }));
    return w(grantWords(shown.find((item) => item.grant.id === 'SACC-0310')!.display));
  },
  'B-withdraw-student': async () => {
    const hub = await (await withdrawn()).as('Rahul Verma').studentAccess.getExperimentHub(SHELL);
    if (!hub.ok && hub.error.kind === 'policy-open') return { open: hub.error.decision };
    return !hub.ok && hub.error.kind === 'refused' && hub.error.code === 'no-longer-given'
      ? FLOW_HEADINGS.noLongerGiven
      : null;
  },
  'B-withdraw-courses': async () =>
    myCoursesHeadings(
      await v((await withdrawn()).as('Rahul Verma').studentAccess.listMyCourses()),
    )[0] ?? null,
  'B-withdraw-earlier': async () =>
    myCoursesHeadings(
      await v((await withdrawn()).as('Rahul Verma').studentAccess.listMyCourses()),
    )[1] ?? null,
  'C2-launch': async () =>
    w(formatPageWords('web', await rahulFormat(await at('B3'), 'web')).action!),
  'C2-not-started': async () =>
    w(formatPageWords('web', await rahulFormat(await at('B3'), 'web')).status),
  'C2-in-progress': async () =>
    w(formatPageWords('web', await rahulFormat(await at('C2-launch'), 'web')).status),
  'C2-continue': async () =>
    w(formatPageWords('web', await rahulFormat(await at('C2-launch'), 'web')).action!),
  'C2-web-completed': async () =>
    w(formatPageWords('web', await rahulFormat(await at('C2-web-done'), 'web')).status),
  'C2-web-heading': async () =>
    w(formatPageWords('web', await rahulFormat(await at('C2-web-done'), 'web')).heading),
  'C3-web-offer': async () =>
    w(formatPageWords('web', await rahulFormat(await at('C2-web-done'), 'web')).action!),
  'C2-vr-in-progress': async () =>
    w(formatPageWords('vr', await rahulFormat(await at('C2-vr-session'), 'vr')).status),
  'C2-vr-completed': async () =>
    w(formatPageWords('vr', await rahulFormat(await at('C2-vr-done'), 'vr')).status),
  'C3-vr-offer': async () =>
    w(formatPageWords('vr', await rahulFormat(await at('C2-vr-done'), 'vr')).action!),
  'C2-faculty-web': async () =>
    w(
      formatProgressWords(
        (await facultyRow(await at('D2-submit'))).row.perFormat.find(
          (entry) => entry.format === 'web',
        )!,
      ),
    ),
  'C2-faculty-vr': async () =>
    w(
      formatProgressWords(
        (await facultyRow(await at('D2-submit'))).row.perFormat.find(
          (entry) => entry.format === 'vr',
        )!,
      ),
    ),
  'C3-web-sent': async () =>
    w(
      feedbackPageHeading(
        'web',
        await v(
          (await at('C3-web'))
            .as('Rahul Verma')
            .feedback.getFeedbackState({ experimentId: SHELL, format: 'web' }),
        ),
      ),
    ),
  'C3-web-see': async () =>
    w(formatPageWords('web', await rahulFormat(await at('C3-web'), 'web')).action!),
  'C3-vr-sent': async () =>
    w(
      feedbackPageHeading(
        'vr',
        await v(
          (await at('C3-vr'))
            .as('Rahul Verma')
            .feedback.getFeedbackState({ experimentId: SHELL, format: 'vr' }),
        ),
      ),
    ),
  'D1-created': async () => {
    const view = await v(
      (await at('D1')).as('Dr S. Ranganathan').assessments.getAssessment(unsafeBrand('ASMT-0009')),
    );
    // FA-07's confirmation follows a successful create: the assessment exists, Ready, with this id.
    return view.assessment.id === 'ASMT-0009' && view.readiness === 'ready'
      ? ASSESSMENT_HEADINGS.created
      : null;
  },
  'D1-ready': async () =>
    w(
      assessmentReadinessWords(
        (
          await v(
            (await at('D1'))
              .as('Dr S. Ranganathan')
              .assessments.getAssessment(unsafeBrand('ASMT-0009')),
          )
        ).readiness as never,
      ),
    ),
  'D1-student': async () =>
    w(
      studentAssessmentWords(
        (await v((await at('D1')).as('Rahul Verma').assessments.listMyAssessments()))[0]!.result
          .kind,
      ),
    ),
  'D2-submitted': async () => {
    // ST-13 after Submit: the Student's own command answer (the attempt, now submitted).
    const world = await at('D2');
    const attempt = worldOf(world.platform).records.attempts['ATT-0450']!;
    const submitted = await v(
      world
        .as('Rahul Verma')
        .assessments.submitAttempt({ attemptId: attempt.id, expectedRev: attempt.rev }),
    );
    return w(attemptPageHeading(submitted));
  },
  'D2-student': async () =>
    w(
      studentAssessmentWords(
        (await v((await at('D2-submit')).as('Rahul Verma').assessments.listMyAssessments()))[0]!
          .result.kind,
      ),
    ),
  'D2-faculty-detail': async () =>
    w(
      markingWords(
        {
          confirmed:
            (await facultyRow(await at('D2-submit'))).attempts[0]!.marking.confirmed !== null,
        },
        'queue',
      ),
    ),
  'D2-faculty-queue': async () => {
    const queue = await v(
      (await at('D2-submit')).as('Dr S. Ranganathan').marking.listQueue({ state: 'waiting' }),
    );
    return w(markingWords({ confirmed: queue[0]!.attempt.marking.confirmed !== null }, 'queue'));
  },
  'D3-confirmed': async () =>
    w(
      markingWords(
        {
          confirmed:
            (
              await v(
                (await at('D3-confirm'))
                  .as('Dr S. Ranganathan')
                  .marking.getAttemptForMarking(unsafeBrand('ATT-0450')),
              )
            ).attempt.marking.confirmed !== null,
        },
        'mark',
      ),
    ),
  'D3-marked': async () => {
    const rows = await v(
      (await at('D3-confirm'))
        .as('Dr S. Ranganathan')
        .assessments.listSubmissions(unsafeBrand('ASMT-0009')),
    );
    return w(markingWords({ confirmed: rows[0]!.attempt.marking.confirmed !== null }, 'queue'));
  },
  'D3-faculty-detail': async () =>
    w(
      markingWords(
        {
          confirmed:
            (await facultyRow(await at('D3-confirm'))).attempts[0]!.marking.confirmed !== null,
        },
        'queue',
      ),
    ),
  'D3-student': async () =>
    w(
      studentAssessmentWords(
        (await v((await at('D3-confirm')).as('Rahul Verma').assessments.listMyAssessments()))[0]!
          .result.kind,
      ),
    ),
  'D3-result-page': async () =>
    w(
      resultPageHeading(
        (
          await v(
            (await at('D3-confirm'))
              .as('Rahul Verma')
              .assessments.getResult(unsafeBrand('ATT-0450')),
          )
        ).result,
      ),
    ),
  'D4-student': async () =>
    w(
      studentAssessmentWords(
        (await v((await at('D5')).as('Rahul Verma').assessments.listMyAssessments()))[0]!.result
          .kind,
      ),
    ),
  'D4-passed': async () => {
    const result = (
      await v((await at('D5')).as('Rahul Verma').assessments.getResult(unsafeBrand('ATT-0450')))
    ).result;
    return result.kind === 'released' ? w(resultWords(result.passed)) : null;
  },
  'D4-heading': async () =>
    w(
      resultPageHeading(
        (await v((await at('D5')).as('Rahul Verma').assessments.getResult(unsafeBrand('ATT-0450'))))
          .result,
      ),
    ),
  'E1-sent': async () =>
    (await vendorSub('E1-submit')).status.state === 'with-academic-reviewer'
      ? FLOW_HEADINGS.submittedForReview
      : null,
  'E1-vendor': async () => w(submissionWords(await vendorSub('E1-submit'), 'vendor')),
  'E1-reviewer': async () =>
    w(
      submissionWords(
        (
          await v(
            (await at('E1-submit'))
              .as('Prof. A. Menon')
              .production.getSubmissionForReview(SUB_0077),
          )
        ).submission,
        'academic_reviewer',
      ),
    ),
  'E1-sa': async () => {
    const record = await v(
      (await at('E1-submit'))
        .as('Arjun Mehta')
        .production.getContentRecord({ kind: 'SUB', id: SUB_0077 }),
    );
    return w(submissionWords(record.submission!, 'super_admin', { stuck: record.stuck }));
  },
  'E1-cm': async () =>
    w(
      submissionWords(
        (
          await v(
            (await at('E1-submit')).as('Kavya Nair').production.getPublicationDecision(SUB_0077),
          )
        ).submission,
        'content_manager',
      ),
    ),
  'E2-vendor': async () => w(submissionWords(await vendorSub('E2-return'), 'vendor')),
  'E2-vendor-heading': async () => w(submissionHeadingWords(await vendorSub('E2-return'))!),
  'E2-reviewed': async () => reviewedLine(await at('E2-return'), 'SUB-0077'),
  'E2-resubmitted': async () => w(submissionWords(await vendorSub('E2-route'), 'vendor')),
  'E2-reviewer': async () =>
    w(
      submissionWords(
        (
          await v(
            (await at('E2-route')).as('Prof. A. Menon').production.getSubmissionForReview(SUB_0077),
          )
        ).submission,
        'academic_reviewer',
      ),
    ),
  'E3-vendor': async () => w(submissionWords(await vendorSub('E3-approve'), 'vendor')),
  'E3-cm': async () =>
    w(
      submissionWords(
        (
          await v(
            (await at('E3-approve')).as('Kavya Nair').production.getPublicationDecision(SUB_0077),
          )
        ).submission,
        'content_manager',
      ),
    ),
  'E3-reviewer': async () =>
    w(
      submissionWords(
        (
          await v(
            (await at('E3-approve'))
              .as('Prof. A. Menon')
              .production.getSubmissionForReview(SUB_0077),
          )
        ).submission,
        'academic_reviewer',
      ),
    ),
  'E4-cm': async () =>
    w(
      submissionWords(
        (
          await v(
            (await at('E4-publish')).as('Kavya Nair').production.getPublicationDecision(SUB_0077),
          )
        ).submission,
        'content_manager',
      ),
    ),
  'E4-vendor': async () => w(submissionWords(await vendorSub('E4-publish'), 'vendor')),
  'E4-sa': async () => {
    const record = await v(
      (await at('E4-publish'))
        .as('Arjun Mehta')
        .production.getContentRecord({ kind: 'SUB', id: SUB_0077 }),
    );
    return w(submissionWords(record.submission!, 'super_admin', { stuck: record.stuck }));
  },
  'E4-reviewed': async () => reviewedLine(await at('E4-publish'), 'SUB-0077'),
  'E5-before': async () =>
    w(
      publicExperimentHeading(
        await (
          await at('E3-approve')
        ).visitor.catalogue.getExperiment(unsafeBrand('conduction-through-a-composite-wall')),
      ),
    ),
  'E-alt1-vendor': async () =>
    w(
      submissionWords(
        (
          await v(
            (await sentBack('academic-reviewer'))
              .as('Anil Shetty')
              .production.getRecord(unsafeBrand('SUB-0074')),
          )
        ).submission,
        'vendor',
      ),
    ),
  'E-alt1-reviewer': async () =>
    w(
      submissionWords(
        (
          await v(
            (await sentBack('academic-reviewer'))
              .as('Prof. A. Menon')
              .production.getSubmissionForReview(unsafeBrand('SUB-0074')),
          )
        ).submission,
        'academic_reviewer',
      ),
    ),
  'E-alt1-reviewed': async () => reviewedLine(await sentBack('academic-reviewer'), 'SUB-0074'),
  'E-alt2-vendor': async () =>
    w(
      submissionWords(
        (
          await v(
            (await sentBack('vendor'))
              .as('Anil Shetty')
              .production.getRecord(unsafeBrand('SUB-0074')),
          )
        ).submission,
        'vendor',
      ),
    ),
  'E-alt2-heading': async () =>
    w(
      submissionHeadingWords(
        (
          await v(
            (await sentBack('vendor'))
              .as('Anil Shetty')
              .production.getRecord(unsafeBrand('SUB-0074')),
          )
        ).submission,
      )!,
    ),
  'E-alt2-sa': async () => {
    const record = await v(
      (await sentBack('vendor'))
        .as('Arjun Mehta')
        .production.getContentRecord({ kind: 'SUB', id: unsafeBrand('SUB-0074') }),
    );
    return w(submissionWords(record.submission!, 'super_admin', { stuck: record.stuck }));
  },
  'E-alt3-stuck': async () => {
    const record = await v(
      (await at('D5'))
        .as('Arjun Mehta')
        .production.getContentRecord({ kind: 'SUB', id: unsafeBrand('SUB-0085') }),
    );
    return w(submissionWords(record.submission!, 'super_admin', { stuck: record.stuck }));
  },
  'E-alt3-moved': async () => {
    const world = await at('D5');
    const admin = world.as('Arjun Mehta');
    const record = await v(
      admin.production.getContentRecord({ kind: 'SUB', id: unsafeBrand('SUB-0085') }),
    );
    await v(
      admin.production.overrideStatus({
        id: record.submission!.id,
        reason: 'No Academic Reviewer covers EEE ZC341 yet.',
        expectedRev: record.submission!.rev,
      }),
    );
    const row = (await v(admin.production.listAllContent({}))).find(
      (item) => item.ref.id === 'SUB-0085',
    )!;
    return w(
      submissionWords({ status: row.status, revision: 1 }, 'super_admin', { stuck: row.stuck }),
    );
  },
  'E-alt3-vendor': async () => {
    const world = await at('D5');
    const admin = world.as('Arjun Mehta');
    const record = await v(
      admin.production.getContentRecord({ kind: 'SUB', id: unsafeBrand('SUB-0085') }),
    );
    const moved = await v(
      admin.production.overrideStatus({
        id: record.submission!.id,
        reason: 'No Academic Reviewer covers EEE ZC341 yet.',
        expectedRev: record.submission!.rev,
      }),
    );
    const vendor = Object.values(worldOf(world.platform).records.holders).find(
      (holder) => holder.id === moved.vendorHolderId,
    )!;
    return w(
      submissionWords(
        (await v(world.as(vendor.name).production.getRecord(moved.id))).submission,
        'vendor',
      ),
    );
  },
  'F1-cm': async () =>
    w(updateWords(await updateState('F1-send', 'content_manager'), 'content_manager')),
  'F1-reviewer': async () =>
    w(updateWords(await updateState('F1-send', 'academic_reviewer'), 'academic_reviewer')),
  'F1-open': async () =>
    publishedExperimentActions(
      await v(
        (await at('F1-send')).as('Kavya Nair').corrections.getPublishedExperiment(DISTILLATION),
      ),
    ).join(' · '),
  'F2-cm': async () =>
    w(updateWords(await updateState('F2-approve', 'content_manager'), 'content_manager')),
  'F2-reviewer': async () =>
    w(updateWords(await updateState('F2-approve', 'academic_reviewer'), 'academic_reviewer')),
  'F2-sa': async () =>
    w(updateWords(await updateState('F2-approve', 'super_admin'), 'super_admin')),
  'Hold-sa': async () => w(updateWords(await updateState('F3-hold', 'super_admin'), 'super_admin')),
  'Hold-cm': async () =>
    w(updateWords(await updateState('F3-hold', 'content_manager'), 'content_manager')),
  'Lift-hold-sa': async () =>
    w(updateWords(await updateState('F3-lift', 'super_admin'), 'super_admin')),
  'F3-sa': async () =>
    w(updateWords(await updateState('F4-release', 'super_admin'), 'super_admin')),
  'F3-cm': async () =>
    w(updateWords(await updateState('F4-release', 'content_manager'), 'content_manager')),
  'F3-reviewed': async () => reviewedLine(await at('F4-release'), 'UPD-0005'),
  'F4-cm': async () =>
    w(
      experimentStatusWords(
        (
          await v(
            (await at('F4-release'))
              .as('Kavya Nair')
              .corrections.getPublishedExperiment(DISTILLATION),
          )
        ).experiment,
      ),
    ),
  'F-alt-return-cm': async () => {
    const { world, id } = await returnedUpdate();
    return w(
      updateWords(
        (await v(world.as('Kavya Nair').corrections.getUpdate(unsafeBrand(id)))).update.state,
        'content_manager',
      ),
    );
  },
  'F-alt-return-heading': async () => {
    const { world, id } = await returnedUpdate();
    return w(
      updateHeadingWords(
        (await v(world.as('Kavya Nair').corrections.getUpdate(unsafeBrand(id)))).update,
      )!,
    );
  },
  'F-alt-return-reviewer': async () => {
    const { world, id } = await returnedUpdate();
    return reviewedLine(world, id);
  },
  'F-alt-withdraw-cm': async () => {
    const world = await at('D5');
    const cm = world.as('Kavya Nair');
    const update = (await v(cm.corrections.getUpdate(unsafeBrand('UPD-0006')))).update;
    await v(
      cm.corrections.withdrawUpdate({
        id: update.id,
        reason: 'The correction moves to the next release.',
        expectedRev: update.rev,
      }),
    );
    return w(
      updateWords((await v(cm.corrections.getUpdate(update.id))).update.state, 'content_manager'),
    );
  },
  'Dv1-student': async () => w(transferWords((await transfer('Dv1', 'student')).state, 'student')),
  'Dv1-ia': async () =>
    w(transferWords((await transfer('Dv1', 'tenant_admin')).state, 'tenant_admin')),
  'Dv1-sa': async () =>
    w(transferWords((await transfer('Dv1', 'super_admin')).state, 'super_admin')),
  'Dv1-forward': async () => {
    const world = await at('Dv1');
    const view = await v(
      world.as('Meera Iyer').operations.getDeviceRequest(unsafeBrand('DTR-0018')),
    );
    const blocked =
      (await v(world.as('Rahul Verma').operations.getMyDevice())).openTransfer?.forwardingBlocked ??
      null;
    return w(
      transferActionWords({ state: view.state, forwardingBlocked: blocked }, 'tenant_admin')!,
    );
  },
  'Dv2-student': async () => w(transferWords((await transfer('Dv2', 'student')).state, 'student')),
  'Dv2-ia': async () =>
    w(transferWords((await transfer('Dv2', 'tenant_admin')).state, 'tenant_admin')),
  'Dv2-sa': async () =>
    w(transferWords((await transfer('Dv2', 'super_admin')).state, 'super_admin')),
  'Dv2-approve': async () =>
    w(transferActionWords({ state: (await transfer('Dv2', 'super_admin')).state }, 'super_admin')!),
  'Dv3-student': async () => w(transferWords((await transfer('Dv3', 'student')).state, 'student')),
  'Dv3-ia': async () =>
    w(transferWords((await transfer('Dv3', 'tenant_admin')).state, 'tenant_admin')),
  'Dv3-sa': async () =>
    w(transferWords((await transfer('Dv3', 'super_admin')).state, 'super_admin')),
  'Pause-sa': async () =>
    w(
      institutionWords(
        (await v((await paused()).as('Arjun Mehta').institutions.getInstitution(GODAVARI))).status,
      ),
    ),
  'Pause-ia': async () =>
    w(
      instituteAccessWords(
        (
          await v(
            (await paused()).as('Meera Iyer').institutions.getAccessPlan(unsafeBrand('ACC-0107')),
          )
        ).status,
      ),
    ),
  'Pause-ia-content': async () =>
    w(
      planWords(
        (
          await v(
            (await paused()).as('Meera Iyer').institutions.getAccessPlan(unsafeBrand('ACC-0107')),
          )
        ).status,
      ),
    ),
  'Pause-student': async () =>
    w(formatPageWords('web', await rahulFormat(await paused(), 'web')).status),
  'Pause-student-heading': async () =>
    w(formatPageWords('web', await rahulFormat(await paused(), 'web')).heading),
  'Deactivate-ia': async () => {
    const rows = await v(
      (await deactivated()).as('Meera Iyer').studentAccess.listGrants({ showWithdrawn: false }),
    );
    return w(grantWords(rows.find((row) => row.grant.id === 'SACC-0310')!.display));
  },
  'Deactivate-student': async () => {
    const session = await v((await deactivated()).as('Rahul Verma').session.getSession());
    return w(studentHomeNotice(session?.banners ?? [])!);
  },
  'Support-open': async () => {
    // The Super Admin's own read of the report (SA-21; SA-20's list is a Phase-6 read).
    return w(
      supportWords(
        (
          await v(
            (await at('SUP-0213'))
              .as('Arjun Mehta')
              .operations.getMyReport(unsafeBrand('SUP-0213')),
          )
        ).state,
      ),
    );
  },
  'Support-resolved': async () => {
    const world = await at('SUP-0213');
    const admin = world.as('Arjun Mehta');
    const report = await v(admin.operations.getMyReport(unsafeBrand('SUP-0213')));
    await v(
      admin.operations.resolveReport({
        id: report.id,
        note: 'Fixed — please try again.',
        expectedRev: report.rev,
      }),
    );
    return w(supportWords((await v(admin.operations.getMyReport(report.id))).state));
  },
};

describe('each role’s words at each step: sample world → application copy = the frozen board words', () => {
  it('every fixture entry has exactly one probe', () => {
    expect(Object.keys(PROBES).sort()).toEqual(EXPECTED_WORDS.map((entry) => entry.id).sort());
  });

  it.each(
    EXPECTED_WORDS.map(
      (entry) =>
        [
          `${entry.step} · ${entry.screen} · ${entry.role} · ${entry.board} f${entry.frame} · “${entry.expected ?? '(not drawn)'}”${entry.open ? ` [OPEN ${entry.open}]` : entry.decision ? ` [${entry.decision}]` : ''}`,
          entry,
        ] as const,
    ),
  )(
    '%s',
    async (_title, entry) => {
      const probe = PROBES[entry.id];
      expect(probe, `${entry.id} has a probe`).toBeDefined();
      const words = await probe!();
      if (entry.open) {
        // The step reaches an open decision: the sample world says so, and no words are chosen.
        expect(words, `${entry.id}: reaches ${entry.open}`).toEqual({ open: entry.open });
        return;
      }
      expect(words, `${entry.id}: ${entry.role} on ${entry.screen}`).toBe(entry.expected);
    },
    30_000,
  );
});

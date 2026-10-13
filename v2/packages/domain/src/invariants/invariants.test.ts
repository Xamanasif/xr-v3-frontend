/**
 * WP-0.9 acceptance (3): the twelve invariants of Appendix D §5.5 hold over seeded randomised
 * command sequences — fixed seeds, reproducible, checked after every step — and each world-based
 * invariant catches a violation (mutation cases). The commands are the real domain decisions; a
 * refused command leaves the world as it was and is checked too.
 *
 * Randomness is a seeded PRNG (mulberry32): `Math.random` is banned in this package, and a failing
 * step names its seed and step number so it can be replayed exactly.
 */
import { describe, expect, it } from 'vitest';

import type { ActorRef } from '../roles.js';
import {
  assessment,
  counterIds,
  course,
  experiment,
  faculty,
  grant,
  group,
  ids,
  institution,
  mapping,
  personRef,
  plan,
  request,
  student,
  submission,
  system,
  T,
  who,
} from '../testing/fixtures.js';
import type { IdSource } from '../kernel/id-source.js';
import { provided } from '../kernel/provided.js';
import { type IsoInstant, isoInstant } from '../kernel/time.js';
import {
  UNDECIDED_OVERLAP_POLICY,
  NO_LICENCE_WAITS,
  type StudentAccessGrant,
} from '../access/model.js';
import { giveAccess, withdrawGrant } from '../access/decide.js';
import { canOpenFormat, experimentGate } from '../access/gate.js';
import type { Assessment } from '../assessment/model.js';
import { changeAssessment } from '../assessment/assessment.js';
import type { Course, Experiment } from '../catalogue/model.js';
import { type FormatCompletion, reportCompletion } from '../completion/record.js';
import {
  approveUpdate,
  type CorrectionUpdate,
  holdUpdate,
  liftHold,
  OPEN_UPDATE_STATES,
  openCorrection,
  releaseUpdate,
  returnUpdate,
  saveCorrection,
  sendForAcademicReview,
  withdrawUpdate,
} from '../correction/correction.js';
import { type FormatFeedback, sendFeedback } from '../feedback/feedback.js';
import { pauseInstitution, restoreInstitution } from '../institution/decide.js';
import type { AccessPlan, Institution } from '../institution/model.js';
import {
  addMembers,
  assignFacultyCourse,
  currentMembers,
  deactivateStudent,
  reactivateStudent,
  removeFacultyCourse,
  removeMember,
} from '../people/decide.js';
import type { FacultyCourseMapping, Group, StudentPerson } from '../people/model.js';
import { approveRequest } from '../request/decide.js';
import type { AccessRequest } from '../request/model.js';
import { openResource } from '../resources/resources.js';
import {
  launchWebFormat,
  recordRuntimeActivity,
  type RuntimeActivity,
} from '../runtime/activity.js';
import { publish } from '../submission/decide.js';
import type { Submission } from '../submission/model.js';
import {
  brokenInvariants,
  type CommandInfo,
  INVARIANTS,
  type InvariantWorld,
} from './invariants.js';

// ── Seeded randomness ───────────────────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  };
}

interface Pick {
  int(below: number): number;
  one<T>(list: readonly T[]): T;
  bool(): boolean;
}

function picker(random: () => number): Pick {
  return {
    int: (below) => Math.floor(random() * below),
    one: (list) => list[Math.floor(random() * list.length)]!,
    bool: () => random() < 0.5,
  };
}

// ── A small world driven by the domain decisions ───────────────────────────────────────────────

const FORMATS = ['web', 'ar', 'vr', 'mr'] as const;
const RUNTIME = system('system:runtime-report');

interface Sim {
  readonly now: IsoInstant;
  readonly mint: IdSource;
  readonly institution: Institution;
  readonly plans: readonly AccessPlan[];
  readonly students: readonly StudentPerson[];
  readonly groups: readonly Group[];
  readonly grants: readonly StudentAccessGrant[];
  readonly mappings: readonly FacultyCourseMapping[];
  readonly experiments: readonly Experiment[];
  readonly courses: readonly Course[];
  readonly activities: readonly RuntimeActivity[];
  readonly completions: readonly FormatCompletion[];
  readonly feedback: readonly FormatFeedback[];
  readonly assessments: readonly Assessment[];
  readonly submissions: readonly Submission[];
  readonly updates: readonly CorrectionUpdate[];
  readonly requests: readonly AccessRequest[];
}

const named = (id: Experiment['id'], name: string): Experiment => {
  const live = experiment().live;
  return experiment({ id, live: { ...live, catalogue: { ...live.catalogue, name } } });
};

function initialSim(): Sim {
  return {
    now: T.oct14,
    mint: counterIds(5000),
    institution: institution(),
    plans: [
      plan({
        items: [
          { experimentId: ids.shell, formats: ['web', 'vr'] },
          { experimentId: ids.wallA, formats: ['web'] },
        ],
      }),
    ],
    students: [
      student(),
      student({ id: ids.arun, fullName: 'Arun Kumar' }),
      student({ id: ids.sneha, fullName: 'Sneha Rao' }),
    ],
    groups: [group([{ id: ids.arun, addedAt: T.oct9 }])],
    grants: [],
    mappings: [mapping()],
    experiments: [experiment(), named(ids.wallA, 'Composite Wall Conduction')],
    courses: [course()],
    activities: [],
    completions: [],
    feedback: [],
    assessments: [assessment()],
    // SUB-0077 is approved and with the Content Manager: publishing it creates the second Composite Wall record.
    submissions: [submission({ state: 'with-content-manager', since: T.aug14 })],
    updates: [],
    requests: [
      request({
        id: 'REQ-0050' as never,
        statusToken: 'token-REQ-0050' as never,
        institutionName: 'Konark Institute of Technology',
      }),
    ],
  };
}

const keyOf = (row: {
  readonly studentId: string;
  readonly experimentId: string;
  readonly format: string;
}) => `${row.studentId}|${row.experimentId}|${row.format}`;
function replaced<T extends { readonly id: string }>(list: readonly T[], next: T): T[] {
  return list.some((entry) => entry.id === next.id)
    ? list.map((entry) => (entry.id === next.id ? next : entry))
    : [...list, next];
}
function replacedAll<T extends { readonly id: string }>(
  list: readonly T[],
  next: readonly T[],
): T[] {
  return next.reduce<T[]>((all, entry) => replaced(all, entry), [...list]);
}
const studentRef = (person: StudentPerson) => personRef(person.id, 'student', person.fullName);

function worldOf(sim: Sim): InvariantWorld {
  const gates = new Map<string, boolean | 'policy-open'>();
  for (const person of sim.students) {
    for (const exp of sim.experiments) {
      for (const format of FORMATS) {
        const gate = canOpenFormat({
          student: person,
          experiment: exp,
          institution: sim.institution,
          plans: sim.plans,
          grants: sim.grants,
          groups: sim.groups,
          waits: [],
          overlap: UNDECIDED_OVERLAP_POLICY,
          now: sim.now,
          format,
        });
        gates.set(
          `${person.id}|${exp.id}|${format}`,
          gate.canOpen ? true : gate.reason === 'policy-open' ? 'policy-open' : false,
        );
      }
    }
  }
  return {
    plans: sim.plans,
    grants: sim.grants,
    mappings: sim.mappings,
    experiments: sim.experiments,
    courses: sim.courses,
    activities: sim.activities,
    completions: sim.completions,
    feedback: sim.feedback,
    assessments: sim.assessments,
    gates,
  };
}

interface Step {
  readonly name: string;
  readonly actor: ActorRef;
  /** The world after the command, or null when it was refused (nothing written). */
  readonly next: Sim | null;
}

type Command = (sim: Sim, pick: Pick) => Step;

const gateFor = (sim: Sim, person: StudentPerson, exp: Experiment) =>
  experimentGate({
    student: person,
    experiment: exp,
    institution: sim.institution,
    plans: sim.plans,
    grants: sim.grants,
    groups: sim.groups,
    waits: [],
    overlap: UNDECIDED_OVERLAP_POLICY,
    now: sim.now,
  });

/** Advances a correction one drawn step (or opens one). */
function correctionStep(sim: Sim, pick: Pick): Step {
  const exp = pick.one(sim.experiments);
  const open =
    sim.updates.find(
      (entry) => entry.experimentId === exp.id && OPEN_UPDATE_STATES.includes(entry.state),
    ) ?? null;
  const base = { now: sim.now, ids: sim.mint };
  const withUpdate = (
    name: string,
    actor: ActorRef,
    decision: { ok: true; value: CorrectionUpdate } | { ok: false },
  ): Step => ({
    name,
    actor,
    next: decision.ok ? { ...sim, updates: replaced(sim.updates, decision.value) } : null,
  });
  const withBoth = (
    name: string,
    actor: ActorRef,
    decision:
      { ok: true; value: { update: CorrectionUpdate; experiment: Experiment } } | { ok: false },
  ): Step => ({
    name,
    actor,
    next: decision.ok
      ? {
          ...sim,
          updates: replaced(sim.updates, decision.value.update),
          experiments: replaced(sim.experiments, decision.value.experiment),
        }
      : null,
  });
  if (!open) {
    const opened = openCorrection({
      ...base,
      experiment: exp,
      openUpdate: null,
      entry: 'start-a-correction',
      actor: who.contentManager,
    });
    return withBoth(
      'openCorrection',
      who.contentManager,
      opened.ok
        ? { ok: true, value: { update: opened.value.update, experiment: opened.value.experiment } }
        : opened,
    );
  }
  const edit = {
    proposed: {
      ...open.proposed,
      description: `${exp.live.catalogue.description} (rev ${sim.updates.length})`,
      name: pick.bool()
        ? `${exp.live.catalogue.name.replace(/ \(revised\)$/, '')} (revised)`
        : open.proposed.name,
    },
    whatChangesAndWhy: 'Corrects the description.',
    versionLabel: `${exp.live.label}.${sim.updates.length + 1}`,
  };
  switch (open.state) {
    case 'draft':
    case 'returned':
      return pick.one([
        () =>
          withUpdate(
            'saveCorrection',
            who.contentManager,
            saveCorrection({ ...base, update: open, edit, actor: who.contentManager }),
          ),
        () =>
          withUpdate(
            'sendForAcademicReview',
            who.contentManager,
            sendForAcademicReview({
              ...base,
              update: open,
              experiment: exp,
              edit,
              actor: who.contentManager,
            }),
          ),
        () =>
          withBoth(
            'withdrawUpdate',
            who.contentManager,
            withdrawUpdate({
              ...base,
              update: open,
              experiment: exp,
              reason: 'Not needed',
              actor: who.contentManager,
            }),
          ),
      ])();
    case 'in-academic-review':
      return pick.one([
        () =>
          withUpdate(
            'approveUpdate',
            who.reviewer,
            approveUpdate({ ...base, update: open, actor: who.reviewer }),
          ),
        () =>
          withUpdate(
            'returnUpdate',
            who.reviewer,
            returnUpdate({
              ...base,
              update: open,
              reason: 'Say which statement',
              actor: who.reviewer,
            }),
          ),
      ])();
    case 'awaiting-release-decision':
      return pick.one([
        () =>
          withBoth(
            'releaseUpdate',
            who.superAdmin,
            releaseUpdate({ ...base, update: open, experiment: exp, actor: who.superAdmin }),
          ),
        () =>
          withUpdate(
            'holdUpdate',
            who.superAdmin,
            holdUpdate({
              ...base,
              update: open,
              reason: 'Wait for the term to end.',
              actor: who.superAdmin,
            }),
          ),
      ])();
    default:
      return pick.one([
        () =>
          withUpdate(
            'liftHold',
            who.superAdmin,
            liftHold({ ...base, update: open, actor: who.superAdmin }),
          ),
        () =>
          withBoth(
            'releaseUpdate',
            who.superAdmin,
            releaseUpdate({ ...base, update: open, experiment: exp, actor: who.superAdmin }),
          ),
      ])();
  }
}

const COMMANDS: readonly Command[] = [
  // Give students access, individually or to the group (SACC-01, SACC-02).
  (sim, pick) => {
    const target = pick.bool()
      ? { kind: 'students' as const, students: [pick.one(sim.students)] }
      : {
          kind: 'group' as const,
          group: sim.groups[0]!,
          members: sim.students.filter((person) =>
            currentMembers(sim.groups[0]!).includes(person.id),
          ),
        };
    const decision = giveAccess({
      institution: sim.institution,
      plan: sim.plans[0]!,
      experimentIds: [pick.one([ids.shell, ids.wallA])],
      target,
      grants: sim.grants,
      licences: NO_LICENCE_WAITS,
      actor: who.instituteAdmin,
      now: sim.now,
      ids: sim.mint,
    });
    return {
      name: 'giveAccess',
      actor: who.instituteAdmin,
      next: decision.ok
        ? {
            ...sim,
            grants: [...sim.grants, ...decision.value.grants],
            plans: replaced(sim.plans, decision.value.plan),
            students: replacedAll(sim.students, decision.value.students),
          }
        : null,
    };
  },
  // Withdraw an individual grant (SACC-07).
  (sim, pick) => {
    const candidates = sim.grants.filter(
      (entry) => entry.state === 'active' && entry.target.kind === 'student',
    );
    if (candidates.length === 0)
      return { name: 'withdrawGrant', actor: who.instituteAdmin, next: null };
    const chosen = pick.one(candidates);
    const owner =
      sim.students.find(
        (person) => chosen.target.kind === 'student' && person.id === chosen.target.studentId,
      ) ?? null;
    const decision = withdrawGrant({
      grant: chosen,
      institution: sim.institution,
      plan: sim.plans.find((entry) => entry.id === chosen.accessPlanId)!,
      student: owner,
      reason: 'Moved course',
      actor: who.instituteAdmin,
      now: sim.now,
      ids: sim.mint,
    });
    return {
      name: 'withdrawGrant',
      actor: who.instituteAdmin,
      next: decision.ok
        ? {
            ...sim,
            grants: replaced(sim.grants, decision.value.grant),
            students: replaced(sim.students, decision.value.student),
            plans: replaced(sim.plans, decision.value.plan),
          }
        : null,
    };
  },
  // Pause / Restore (INST-07, INST-08).
  (sim, pick) => {
    const own = sim.plans.filter((entry) => entry.institutionId === sim.institution.id);
    const input = {
      institution: sim.institution,
      plans: own,
      reason: 'Checking the student list.',
      actor: who.superAdmin,
      now: sim.now,
      ids: sim.mint,
    };
    const name = pick.bool() ? 'pauseInstitution' : 'restoreInstitution';
    const decision =
      name === 'pauseInstitution' ? pauseInstitution(input) : restoreInstitution(input);
    return {
      name,
      actor: who.superAdmin,
      next: decision.ok
        ? {
            ...sim,
            institution: decision.value.institution,
            plans: replacedAll(sim.plans, decision.value.plans),
          }
        : null,
    };
  },
  // Deactivate / reactivate a student (PER-05, PER-06).
  (sim, pick) => {
    const person = pick.one(sim.students);
    const base = {
      institution: sim.institution,
      student: person,
      actor: who.instituteAdmin,
      now: sim.now,
      ids: sim.mint,
    };
    const name = person.accountStatus === 'active' ? 'deactivateStudent' : 'reactivateStudent';
    const decision =
      name === 'deactivateStudent'
        ? deactivateStudent({ ...base, reason: 'Left the programme' })
        : reactivateStudent(base);
    return {
      name,
      actor: who.instituteAdmin,
      next: decision.ok ? { ...sim, students: replaced(sim.students, decision.value) } : null,
    };
  },
  // A runtime activity report (RUN-08, system).
  (sim, pick) => {
    const person = pick.one(sim.students);
    const exp = pick.one(sim.experiments);
    const format = pick.one(FORMATS);
    const existing =
      sim.activities.find((row) => keyOf(row) === `${person.id}|${exp.id}|${format}`) ?? null;
    const decision = recordRuntimeActivity({
      activity: existing,
      report: {
        studentId: person.id,
        experimentId: exp.id,
        format,
        kind: pick.one(['opened', 'saved', 'session'] as const),
        at: sim.now,
      },
      actor: RUNTIME,
    });
    if (!decision.ok) return { name: 'recordRuntimeActivity', actor: RUNTIME, next: null };
    const others = sim.activities.filter((row) => keyOf(row) !== keyOf(decision.value));
    return {
      name: 'recordRuntimeActivity',
      actor: RUNTIME,
      next: { ...sim, activities: [...others, decision.value] },
    };
  },
  // The system completion handler (CMP-01).
  (sim, pick) => {
    const person = pick.one(sim.students);
    const exp = pick.one(sim.experiments);
    const format = pick.one(FORMATS);
    const existing =
      sim.completions.find((row) => keyOf(row) === `${person.id}|${exp.id}|${format}`) ?? null;
    const decision = reportCompletion({
      existing,
      report: {
        studentId: person.id,
        experimentId: exp.id,
        format,
        at: sim.now,
        from: format === 'web' ? 'simulation' : 'headset',
      },
      actor: RUNTIME,
    });
    return {
      name: 'reportCompletion',
      actor: RUNTIME,
      next:
        decision.ok && decision.value.created
          ? { ...sim, completions: [...sim.completions, decision.value.completion] }
          : decision.ok
            ? sim
            : null,
    };
  },
  // Send feedback on a completed format (FB-02).
  (sim, pick) => {
    if (sim.completions.length === 0)
      return { name: 'sendFeedback', actor: who.student, next: null };
    const completion = pick.one(sim.completions);
    const person = sim.students.find((entry) => entry.id === completion.studentId)!;
    const exp = sim.experiments.find((entry) => entry.id === completion.experimentId)!;
    const existing = sim.feedback.find((row) => keyOf(row) === keyOf(completion)) ?? null;
    const decision = sendFeedback({
      existing,
      completion,
      gate: gateFor(sim, person, exp),
      studentId: person.id,
      experimentId: exp.id,
      format: completion.format,
      ratings: [4, 5, 4, 3, 4],
      comments: null,
      now: sim.now,
      ids: sim.mint,
    });
    return {
      name: 'sendFeedback',
      actor: studentRef(person),
      next: decision.ok ? { ...sim, feedback: [...sim.feedback, decision.value] } : null,
    };
  },
  // Open a resource / launch WEB — they write nothing (RUN-01, RUN-03).
  (sim, pick) => {
    const person = pick.one(sim.students);
    const exp = pick.one(sim.experiments);
    const gate = gateFor(sim, person, exp);
    openResource({
      existing: null,
      studentId: person.id,
      resourceId: exp.resources[0]?.id ?? ('res-none' as never),
      experiment: exp,
      gate,
      now: sim.now,
    });
    launchWebFormat({
      experiment: exp,
      webGate: canOpenFormat({
        student: person,
        experiment: exp,
        institution: sim.institution,
        plans: sim.plans,
        grants: sim.grants,
        groups: sim.groups,
        waits: [],
        overlap: UNDECIDED_OVERLAP_POLICY,
        now: sim.now,
        format: 'web',
      }),
    });
    return {
      name: pick.bool() ? 'openResource' : 'launchWebFormat',
      actor: studentRef(person),
      next: sim,
    };
  },
  // First publication (SUB-24).
  (sim) => {
    const ready = sim.submissions.find((entry) => entry.status.state === 'with-content-manager');
    if (!ready) return { name: 'publish', actor: who.contentManager, next: null };
    const decision = publish({
      submission: ready,
      experimentId: ids.wallB,
      actor: who.contentManager,
      now: sim.now,
      ids: sim.mint,
    });
    return {
      name: 'publish',
      actor: who.contentManager,
      next: decision.ok
        ? {
            ...sim,
            submissions: replaced(sim.submissions, decision.value.submission),
            experiments: [...sim.experiments, decision.value.experiment],
          }
        : null,
    };
  },
  // A correction step (UPD-01 … UPD-22).
  correctionStep,
  correctionStep,
  // Change an assessment's settings (ASMT-05; a new version once submissions exist).
  (sim, pick) => {
    const current = sim.assessments[0]!;
    const decision = changeAssessment({
      assessment: current,
      name: current.name,
      introduction: current.introduction,
      rules: { ...current.rules, attemptsAllowed: 1 + pick.int(3) },
      questions: current.questions,
      hasSubmissions: pick.bool(),
      actor: who.faculty,
      now: sim.now,
      ids: sim.mint,
    });
    return {
      name: 'changeAssessment',
      actor: who.faculty,
      next: decision.ok ? { ...sim, assessments: [decision.value] } : null,
    };
  },
  // Group membership (GRP-03, GRP-04).
  (sim, pick) => {
    const theGroup = sim.groups[0]!;
    const person = pick.one(sim.students);
    const base = {
      institution: sim.institution,
      group: theGroup,
      actor: who.instituteAdmin,
      now: sim.now,
      ids: sim.mint,
    };
    const member = currentMembers(theGroup).includes(person.id);
    const decision = member
      ? removeMember({ ...base, studentId: person.id })
      : addMembers({ ...base, students: [person] });
    return {
      name: member ? 'removeMember' : 'addMembers',
      actor: who.instituteAdmin,
      next: decision.ok ? { ...sim, groups: [decision.value] } : null,
    };
  },
  // Faculty courses (FCM-01, FCM-02).
  (sim) => {
    const active = sim.mappings.find((entry) => entry.removedAt === null);
    const base = {
      institution: sim.institution,
      actor: who.instituteAdmin,
      now: sim.now,
      ids: sim.mint,
    };
    const decision = active
      ? removeFacultyCourse({ ...base, mapping: active })
      : assignFacultyCourse({
          ...base,
          mappings: sim.mappings,
          faculty: faculty(),
          courseId: ids.course,
          coursesInAccess: [ids.course],
        });
    return {
      name: active ? 'removeFacultyCourse' : 'assignFacultyCourse',
      actor: who.instituteAdmin,
      next: decision.ok ? { ...sim, mappings: replaced(sim.mappings, decision.value) } : null,
    };
  },
  // Another institution's first request, approved on the internal route (activation; INST-01, ACC-01).
  (sim) => {
    const waiting = sim.requests.find((entry) => entry.status === 'under-review');
    if (!waiting) return { name: 'approveRequest', actor: who.superAdmin, next: null };
    const decision = approveRequest({
      request: waiting,
      institution: null,
      route: 'internal',
      actor: who.superAdmin,
      now: sim.now,
      ids: sim.mint,
    });
    return {
      name: 'approveRequest',
      actor: who.superAdmin,
      next: decision.ok
        ? {
            ...sim,
            requests: replaced(sim.requests, decision.value.request),
            plans: decision.value.plan ? [...sim.plans, decision.value.plan] : sim.plans,
          }
        : null,
    };
  },
  // The term clock: time passes (ACC-06).
  (sim, pick) => ({
    name: 'tick',
    actor: system('system:term-clock'),
    next: {
      ...sim,
      now: isoInstant(
        new Date(Date.parse(sim.now) + (1 + pick.int(12)) * 86_400_000).toISOString(),
      ),
    },
  }),
];

function run(seed: number, steps: number): { readonly sim: Sim; readonly log: readonly string[] } {
  const pick = picker(mulberry32(seed));
  let sim = initialSim();
  const log: string[] = [];
  for (let step = 0; step < steps; step += 1) {
    const outcome = COMMANDS[pick.int(COMMANDS.length)]!(sim, pick);
    const after = outcome.next ?? sim;
    const command: CommandInfo = { name: outcome.name, actor: outcome.actor };
    const broken = brokenInvariants(worldOf(sim), worldOf(after), command);
    if (broken.length > 0)
      throw new Error(`seed ${seed}, step ${step}, ${outcome.name}: ${broken.join('; ')}`);
    log.push(`${outcome.name}:${outcome.next ? 'applied' : 'refused'}`);
    sim = after;
  }
  return { sim, log };
}

const SEEDS = [1, 7, 42, 2026, 31_337] as const;
const STEPS = 300;

describe('the twelve invariants (Appendix D §5.5)', () => {
  it('are numbered 1 … 12, each with its rule', () => {
    expect(INVARIANTS.map((entry) => entry.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(INVARIANTS.every((entry) => entry.rule.length > 20)).toBe(true);
  });
});

describe('acceptance (3): the invariants hold over seeded random command sequences', () => {
  const results = new Map<number, ReturnType<typeof run>>();
  for (const seed of SEEDS) {
    it(`seed ${seed}: ${STEPS} commands, every invariant checked after every step`, () => {
      results.set(seed, run(seed, STEPS));
    });
  }

  it('the sequences exercise every command family (each applied at least once across the seeds)', () => {
    const applied = new Set(
      [...results.values()].flatMap((result) =>
        result.log
          .filter((entry) => entry.endsWith(':applied'))
          .map((entry) => entry.split(':')[0]!),
      ),
    );
    expect([...applied].sort()).toEqual(
      [
        'addMembers',
        'approveRequest',
        'approveUpdate',
        'assignFacultyCourse',
        'changeAssessment',
        'deactivateStudent',
        'giveAccess',
        'holdUpdate',
        'launchWebFormat',
        'liftHold',
        'openCorrection',
        'openResource',
        'pauseInstitution',
        'publish',
        'reactivateStudent',
        'recordRuntimeActivity',
        'releaseUpdate',
        'removeFacultyCourse',
        'removeMember',
        'reportCompletion',
        'restoreInstitution',
        'returnUpdate',
        'saveCorrection',
        'sendFeedback',
        'sendForAcademicReview',
        'tick',
        'withdrawGrant',
        'withdrawUpdate',
      ].sort(),
    );
  });

  it('is reproducible: the same seed gives the same commands and the same world', () => {
    const first = run(42, 120);
    const second = run(42, 120);
    expect(second.log).toEqual(first.log);
    expect(
      JSON.stringify(worldOf(second.sim), (_key, value: unknown) =>
        value instanceof Map ? [...value] : value,
      ),
    ).toBe(
      JSON.stringify(worldOf(first.sim), (_key, value: unknown) =>
        value instanceof Map ? [...value] : value,
      ),
    );
  });

  it('both Composite Wall records survive every sequence once SUB-0077 is published (BC11)', () => {
    for (const [, result] of results) {
      const experimentIds = result.sim.experiments.map((entry) => entry.id);
      expect(experimentIds).toContain(ids.wallA);
      if (result.log.includes('publish:applied')) expect(experimentIds).toContain(ids.wallB);
    }
  });
});

describe('each world-based invariant catches its violation (mutation cases)', () => {
  const before = worldOf(initialSim());
  const completion: FormatCompletion = {
    studentId: ids.rahul,
    experimentId: ids.shell,
    format: 'web',
    completedAt: T.oct14,
    reportedFrom: 'simulation',
    recordedBy: RUNTIME,
  };
  const activity: RuntimeActivity = {
    studentId: ids.rahul,
    experimentId: ids.shell,
    format: 'web',
    firstOpenedAt: provided(T.oct12),
    lastSavedAt: null,
    lastSessionReportedAt: null,
    sessions: provided(1),
  };
  const breaks = (
    id: number,
    after: InvariantWorld,
    command: CommandInfo,
    from: InvariantWorld = before,
  ) =>
    expect(
      brokenInvariants(from, after, command).filter((message) => message.startsWith(`#${id} `)),
    ).toHaveLength(1);

  it('#1 Publish or Release changes access', () => {
    breaks(1, { ...before, grants: [grant()] }, { name: 'publish', actor: who.contentManager });
    breaks(1, { ...before, mappings: [] }, { name: 'releaseUpdate', actor: who.superAdmin });
  });

  it('#2 a user command writes activity or completion', () => {
    breaks(2, { ...before, activities: [activity] }, { name: 'openResource', actor: who.student });
    breaks(
      2,
      { ...before, completions: [completion] },
      { name: 'submitAttempt', actor: who.student },
    );
  });

  it('#3 a completion moves, vanishes, or comes from anything but the handler', () => {
    const withOne = { ...before, completions: [completion] };
    breaks(
      3,
      { ...before, completions: [{ ...completion, completedAt: T.oct20 }] },
      { name: 'reportCompletion', actor: RUNTIME },
      withOne,
    );
    breaks(3, before, { name: 'reportCompletion', actor: RUNTIME }, withOne);
    breaks(3, withOne, { name: 'recordRuntimeActivity', actor: RUNTIME });
  });

  it('#4 a withdrawal or pause changes progress', () => {
    breaks(
      4,
      { ...before, activities: [] },
      { name: 'withdrawGrant', actor: who.instituteAdmin },
      { ...before, activities: [activity] },
    );
  });

  it('#5 a runtime event changes what a Student can open', () => {
    const gates = new Map(before.gates);
    gates.set(`${ids.rahul}|${ids.shell}|web`, true);
    breaks(5, { ...before, gates }, { name: 'recordRuntimeActivity', actor: RUNTIME });
  });

  it('#6 an Institute Admin or Student command changes the public catalogue', () => {
    const renamed = before.experiments.map((entry, index) =>
      index === 0 ? named(entry.id, 'Renamed') : entry,
    );
    breaks(
      6,
      { ...before, experiments: renamed },
      { name: 'giveAccess', actor: who.instituteAdmin },
    );
  });

  it('#7 two feedback records, or feedback without a completion', () => {
    const feedback: FormatFeedback = {
      id: 'fb-1' as never,
      studentId: ids.rahul,
      experimentId: ids.shell,
      format: 'web',
      statementSet: 1,
      ratings: [4, 4, 4, 4, 4],
      comments: null,
      sentAt: T.oct14,
    };
    breaks(7, { ...before, feedback: [feedback] }, { name: 'sendFeedback', actor: who.student });
    breaks(
      7,
      {
        ...before,
        completions: [completion],
        feedback: [feedback, { ...feedback, id: 'fb-2' as never }],
      },
      { name: 'sendFeedback', actor: who.student },
    );
  });

  it('#8 activation creates a grant, or a grant creates activity', () => {
    breaks(8, { ...before, grants: [grant()] }, { name: 'approveRequest', actor: who.superAdmin });
    breaks(
      8,
      { ...before, activities: [activity] },
      { name: 'giveAccess', actor: who.instituteAdmin },
    );
  });

  it('#9 an assessment reads rules that are not its own', () => {
    const current = before.assessments[0]!;
    breaks(
      9,
      {
        ...before,
        assessments: [{ ...current, rules: { ...current.rules, passMarkPercent: 40 } }],
      },
      { name: 'changeAssessment', actor: who.faculty },
    );
  });

  it('#10 a record is merged, removed or renamed into another', () => {
    breaks(
      10,
      { ...before, experiments: [before.experiments[0]!] },
      { name: 'releaseUpdate', actor: who.superAdmin },
    );
    breaks(
      10,
      { ...before, experiments: [before.experiments[0]!, before.experiments[0]!] },
      { name: 'publish', actor: who.contentManager },
    );
    const intoOther = before.experiments.map((entry, index) =>
      index === 1 ? named(entry.id, before.experiments[0]!.live.catalogue.name) : entry,
    );
    breaks(
      10,
      { ...before, experiments: intoOther },
      { name: 'releaseUpdate', actor: who.superAdmin },
    );
  });

  it('#11 and #12 guard the read path and the runtime vocabulary (structural)', () => {
    // #11: `formatProgress` reads Completed only from a completion record — exercised in
    // completion.test.ts; #12: RUNTIME_SOURCES names production sources only. Neither depends on
    // a world, so the property run above always evaluates them as holding.
    expect(
      brokenInvariants(before, before, { name: 'tick', actor: system('system:term-clock') }),
    ).toEqual([]);
  });
});

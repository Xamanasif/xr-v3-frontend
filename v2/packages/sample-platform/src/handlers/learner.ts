/**
 * A Student's own learning, read side (ST-01 … ST-15; Appendix D §5.3). The five states are read
 * side by side and never derived from one another (BC3): the open gate reads publication,
 * institution access and entitlement (`experimentGate` / `canOpenFormat`); progress reads runtime
 * activity and the completion record (`formatProgress`); feedback reads the completion
 * (`feedbackEntry`). Progress is per format, with no aggregate (BC4).
 */
import type { MyCourseRow, MyExperimentRow } from '@xr/contracts/draft';
import {
  type AccessFacts,
  type Assessment,
  assessmentForStudent,
  courseCodeFor,
  type Experiment,
  experimentGate,
  feedbackEntry,
  formatAvailability,
  FORMAT_DISPLAY_ORDER,
  formatProgress,
  type FormatProgressView,
  formatProgressView,
  type OpenGate,
  resultView,
  type StudentPerson,
  type Technology,
} from '@xr/domain';

import type { ResolvedPerson } from '../pipeline/actor.js';
import { type Op, refuse } from '../pipeline/runner.js';
import { accessFacts, experimentsGivenTo } from '../world/queries.js';
import { courseCodeKey, formatKey, values } from '../world/records.js';

export function studentOf(person: ResolvedPerson): StudentPerson {
  const record = person.record;
  if (record?.kind !== 'student') refuse({ kind: 'not-permitted', why: 'wrong-workspace' });
  return record;
}

export function factsFor(op: Op, student: StudentPerson, experimentId: string): AccessFacts | null {
  return accessFacts(op.records, op.seeded, student, op.core.overlap, experimentId);
}

export function gateOf(op: Op, facts: AccessFacts | null, experiment: Experiment | null): OpenGate {
  if (!facts) return { canOpen: false, reason: 'not-given' };
  return experimentGate({ ...facts, experiment, now: op.now });
}

/** The decision the gate answers for a seeded "Not available right now" format (D-26). */
const UNAVAILABLE_RIGHT_NOW = 'not-designed:format-temporarily-unavailable';

/**
 * The facts with the drawn read-only closures lifted — the institution's pause, an inactive
 * account, a supplied licence wait — so the domain's own gates name what was given, and through
 * which grants, for an experiment the Student still sees but cannot open (B2-11, B2-12
 * "Institution paused"; SACC-12). Never stored; the closure stays on the real gate, and the
 * session banner carries it (XS-08, PER-13).
 */
function withClosuresLifted(facts: AccessFacts): AccessFacts {
  return {
    ...facts,
    institution: { ...facts.institution, pause: null },
    student: { ...facts.student, accountStatus: 'active' },
    waits: [],
  };
}

/**
 * How one given experiment stands for the Student. The domain's read verdict decides
 * (`canRead` student-learning computes the gate itself): `visible` — open, or one of the drawn
 * read-only closures (paused, inactive, waiting for a licence); `undecided` — the gate's own open
 * decision (OD-B2-01, OD-B2-02, GRP-05), which a row carries on every format with no can / can't
 * statement (PC-26); otherwise `unlisted` — nothing was given, or the only grant was withdrawn or
 * access ended, where what earlier work shows is open (SACC-14; the course row keeps only its
 * earlier-work flag, B2-10, B2-11).
 */
export type Standing =
  | { readonly kind: 'visible'; readonly facts: AccessFacts; readonly gate: OpenGate }
  | { readonly kind: 'undecided'; readonly facts: AccessFacts; readonly decision: string }
  | { readonly kind: 'unlisted'; readonly facts: AccessFacts | null };

export function standingOf(
  op: Op,
  person: ResolvedPerson,
  student: StudentPerson,
  experiment: Experiment,
): Standing {
  const facts = factsFor(op, student, experiment.id);
  if (!facts) return { kind: 'unlisted', facts };
  const verdict = op.readVerdict(person, { kind: 'student-learning', experiment, access: facts });
  const gate = gateOf(op, facts, experiment);
  if (verdict.visible) return { kind: 'visible', facts, gate };
  if (!gate.canOpen && gate.reason === 'policy-open') {
    return { kind: 'undecided', facts, decision: gate.decision };
  }
  return { kind: 'unlisted', facts };
}

/**
 * The grants the domain routes a visible experiment through (`experimentGate` `viaGrantIds`):
 * active grants that reach the Student on a plan that has not ended. A read-only closure does not
 * change the routing, so it is read with the closure lifted.
 */
export function routedGrantIds(op: Op, facts: AccessFacts, experiment: Experiment) {
  const gate = experimentGate({ ...withClosuresLifted(facts), experiment, now: op.now });
  return gate.canOpen ? gate.viaGrantIds : [];
}

type Availability = MyExperimentRow['formats'][number]['availability'];

/** B2-12 words for the domain's per-format answer (`formatAvailability`, the same as the gate). */
function availabilityOf(gate: OpenGate): Availability {
  if (gate.canOpen) return 'available-to-you';
  switch (gate.reason) {
    case 'format-not-published':
      return 'not-available-for-this-experiment';
    case 'format-not-in-plan':
      return 'not-included-for-your-institution';
    case 'policy-open':
      return gate.decision === UNAVAILABLE_RIGHT_NOW
        ? 'not-available-right-now'
        : { policyOpen: gate.decision };
    default:
      // Format words are read only where the experiment gate is open (or lifted open).
      throw new Error(`No format words for an experiment closed as ${gate.reason}.`);
  }
}

/**
 * B2-12 per-format words, from the domain's `formatAvailability`. A visible closed experiment
 * reads them with its closure lifted, so the formats it gave still show as given beside the
 * closure (B2-12 "Paused" beside the banner); an undecided gate carries its open decision on every
 * format (PC-26). Progress is read side by side and never derived from the gate (BC3).
 */
export function formatRows(
  op: Op,
  standing: Exclude<Standing, { kind: 'unlisted' }>,
  experiment: Experiment,
): MyExperimentRow['formats'] {
  const facts =
    standing.kind === 'visible' && !standing.gate.canOpen
      ? withClosuresLifted(standing.facts)
      : standing.facts;
  return FORMAT_DISPLAY_ORDER.map((format) => ({
    format,
    availability:
      standing.kind === 'undecided'
        ? { policyOpen: standing.decision }
        : availabilityOf(formatAvailability({ ...facts, experiment, now: op.now, format })),
    progress: progressOf(op, standing.facts, experiment.id, format),
  }));
}

export function progressOf(
  op: Op,
  facts: AccessFacts | null,
  experimentId: string,
  format: Technology,
) {
  if (!facts) return 'not-started' as const;
  const key = formatKey(facts.student.id, experimentId, format);
  return formatProgress({
    activity: op.records.activities[key] ?? null,
    completion: op.records.completions[key] ?? null,
  });
}

/** One format's progress view (ST-08 … ST-10, ST-15; FA-20, FA-21): activity and completion side by side. */
export function progressView(
  op: Op,
  student: StudentPerson,
  experiment: Experiment,
  format: Technology,
  gate: OpenGate,
): FormatProgressView {
  const key = formatKey(student.id, experiment.id, format);
  const completion = op.records.completions[key] ?? null;
  const feedback =
    values(op.records.feedback).find(
      (entry) =>
        entry.studentId === student.id &&
        entry.experimentId === experiment.id &&
        entry.format === format,
    ) ?? null;
  const institution = op.records.institutions[student.institutionId];
  return formatProgressView({
    experimentId: experiment.id,
    format,
    activity: op.records.activities[key] ?? null,
    completion,
    feedback: feedbackEntry({ completion, feedback, gate }),
    paused: institution?.pause !== null && institution?.pause !== undefined,
  });
}

/** A given experiment's row (ST-03, ST-05), or `null` where the Student is shown no row. */
export function experimentRow(
  op: Op,
  person: ResolvedPerson,
  student: StudentPerson,
  experiment: Experiment,
): MyExperimentRow | null {
  const standing = standingOf(op, person, student, experiment);
  if (standing.kind === 'unlisted') return null;
  return {
    experimentId: experiment.id,
    name: experiment.live.catalogue.name,
    formats: formatRows(op, standing, experiment),
    closure: closureOf(standing, experiment.id),
  };
}

/**
 * The gate's own read-only closure of a visible experiment (PC-45): what the formats read with
 * lifted is named here, so no screen shows "Available to you" without it. A licence wait names the
 * plan whose supplied wait closes the experiment (never counted, T-06 / D7).
 */
function closureOf(
  standing: Exclude<Standing, { kind: 'unlisted' }>,
  experimentId: string,
): MyExperimentRow['closure'] {
  if (standing.kind !== 'visible' || standing.gate.canOpen) return null;
  switch (standing.gate.reason) {
    case 'institution-paused':
      return { kind: 'institution-paused' };
    case 'student-inactive':
      return { kind: 'student-inactive' };
    case 'waiting-for-a-licence': {
      const { facts } = standing;
      const waited = facts.waits
        .filter((wait) => wait.studentId === facts.student.id)
        .map((wait) => facts.grants.find((grant) => grant.id === wait.grantId))
        .find((grant) => grant?.experimentId === experimentId);
      return waited ? { kind: 'waiting-for-a-licence', planId: waited.accessPlanId } : null;
    }
    default:
      return null;
  }
}

/** The experiments any grant names for the Student (candidates only — `standingOf` decides). */
export function givenExperiments(op: Op, student: StudentPerson): Experiment[] {
  return experimentsGivenTo(op.records, student).flatMap((id) => {
    const experiment = op.records.experiments[id];
    return experiment ? [experiment] : [];
  });
}

/**
 * ST-02 course rows: access only, never a progress verdict (B2-11). "Given" counts the
 * experiments the Student can open now; earlier work is an experiment that no longer reaches the
 * Student — its only grant withdrawn or its access ended — with activity or a completion (B2-10,
 * B2-11 "earlier work kept"). A course with no row and no earlier work is not listed. The code
 * shown follows T-17 (the institution's code when set).
 */
export function courseRows(op: Op, person: ResolvedPerson, student: StudentPerson): MyCourseRow[] {
  const byCourse = new Map<string, Experiment[]>();
  for (const experiment of givenExperiments(op, student)) {
    byCourse.set(experiment.courseId, [...(byCourse.get(experiment.courseId) ?? []), experiment]);
  }
  return [...byCourse].flatMap(([courseId, experiments]) => {
    const course = op.records.courses[courseId];
    if (!course) return [];
    let open = 0;
    let listed = false;
    let earlierWork = false;
    const formats = new Set<Technology>();
    for (const experiment of experiments) {
      const standing = standingOf(op, person, student, experiment);
      if (standing.kind !== 'unlisted') listed = true;
      if (standing.kind === 'visible' && standing.gate.canOpen) {
        open += 1;
        for (const row of formatRows(op, standing, experiment)) {
          if (row.availability === 'available-to-you') formats.add(row.format);
        }
      } else if (
        standing.kind === 'unlisted' &&
        FORMAT_DISPLAY_ORDER.some(
          (format) => progressOf(op, standing.facts, experiment.id, format) !== 'not-started',
        )
      ) {
        earlierWork = true;
      }
    }
    if (!listed && !earlierWork) return [];
    const institutionCode =
      op.records.courseCodes[courseCodeKey(student.institutionId, courseId)]?.code ?? null;
    return [
      {
        courseId: course.id,
        name: course.name,
        codeShown: courseCodeFor('student', course.platformCode, institutionCode),
        experimentsGiven: open,
        formatsAvailable: FORMAT_DISPLAY_ORDER.filter((format) => formats.has(format)),
        earlierWork,
      },
    ];
  });
}

/** The institution's assessment for an experiment (one per experiment per institution, OD-B4-01). */
export function assessmentOf(
  op: Op,
  institutionId: string,
  experimentId: string,
): Assessment | null {
  return (
    values(op.records.assessments).find(
      (assessment) =>
        assessment.institutionId === institutionId && assessment.experimentId === experimentId,
    ) ?? null
  );
}

/** What a Student sees of an assessment (`assessmentForStudent`): hidden unless Ready and given. */
export function studentAssessmentView(op: Op, student: StudentPerson, assessment: Assessment) {
  const experiment = op.records.experiments[assessment.experimentId] ?? null;
  const facts = factsFor(op, student, assessment.experimentId);
  const gate = gateOf(op, facts, experiment);
  const attempts = values(op.records.attempts).filter(
    (attempt) => attempt.assessmentId === assessment.id && attempt.studentId === student.id,
  );
  const given = experimentsGivenTo(op.records, student).includes(assessment.experimentId);
  const view = assessmentForStudent({
    assessment,
    hasExperiment:
      given && (gate.canOpen || (gate.reason !== 'not-given' && gate.reason !== 'no-longer-given')),
    gate,
    attempts,
    questions: values(op.records.questions),
    now: op.now,
  });
  const latest = [...attempts].sort((a, b) => a.attemptNumber - b.attemptNumber).at(-1) ?? null;
  const result = latest
    ? resultView({
        attempt: latest,
        assessment,
        questions: values(op.records.questions),
        now: op.now,
      })
    : ({ kind: 'to-do' } as const);
  return { view, attempts, latest, result, gate };
}

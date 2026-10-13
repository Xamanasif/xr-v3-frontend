/**
 * The twelve invariants of Appendix D §5.5 (the five-state separation, BC3–BC11) as predicates
 * over a world before and after one command. The sample-world pipeline (WP-0.11) checks them after
 * every command; the domain property tests check them over seeded random command sequences.
 * Each returns null when it holds, or a message naming what broke.
 */
import { RUNTIME_SOURCES } from '../runtime/events.js';
import type { ActorRef } from '../roles.js';
import type { StudentAccessGrant } from '../access/model.js';
import type { Assessment } from '../assessment/model.js';
import { NO_RULES } from '../assessment/model.js';
import type { Experiment } from '../catalogue/model.js';
import { publicCatalogue } from '../catalogue/decide.js';
import type { Course } from '../catalogue/model.js';
import type { FormatCompletion } from '../completion/record.js';
import { formatProgress } from '../completion/progress.js';
import type { FormatFeedback } from '../feedback/feedback.js';
import type { AccessPlan } from '../institution/model.js';
import type { FacultyCourseMapping } from '../people/model.js';
import type { RuntimeActivity } from '../runtime/activity.js';

/** The slices of a world the invariants read. */
export interface InvariantWorld {
  readonly plans: readonly AccessPlan[];
  readonly grants: readonly StudentAccessGrant[];
  readonly mappings: readonly FacultyCourseMapping[];
  readonly experiments: readonly Experiment[];
  readonly courses: readonly Course[];
  readonly activities: readonly RuntimeActivity[];
  readonly completions: readonly FormatCompletion[];
  readonly feedback: readonly FormatFeedback[];
  readonly assessments: readonly Assessment[];
  /** Can-open answers for every (student, experiment, format) the world knows, keyed `s|e|f`. */
  readonly gates: ReadonlyMap<string, boolean | 'policy-open'>;
}

export interface CommandInfo {
  /** The decision that ran, e.g. `publish`, `releaseUpdate`, `withdrawGrant`. */
  readonly name: string;
  readonly actor: ActorRef;
}

type Check = (before: InvariantWorld, after: InvariantWorld, command: CommandInfo) => string | null;

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const key = (row: {
  readonly studentId: string;
  readonly experimentId: string;
  readonly format: string;
}) => `${row.studentId}|${row.experimentId}|${row.format}`;

function progressMap(world: InvariantWorld): Map<string, string> {
  const keys = new Set([...world.activities.map(key), ...world.completions.map(key)]);
  return new Map(
    [...keys].map((k) => [
      k,
      formatProgress({
        activity: world.activities.find((row) => key(row) === k) ?? null,
        completion: world.completions.find((row) => key(row) === k) ?? null,
      }),
    ]),
  );
}

const isSystem = (actor: ActorRef, system: string) =>
  actor.kind === 'system' && actor.system === system;

export const INVARIANTS: readonly {
  readonly id: number;
  readonly rule: string;
  readonly check: Check;
}[] = [
  {
    id: 1,
    rule: 'Publish and Release leave every ACC, SACC and FMAP unchanged (BC9).',
    check: (before, after, command) =>
      ['publish', 'releaseUpdate'].includes(command.name) &&
      (!same(before.plans, after.plans) ||
        !same(before.grants, after.grants) ||
        !same(before.mappings, after.mappings))
        ? `${command.name} changed access, a grant or a Faculty mapping`
        : null,
  },
  {
    id: 2,
    rule: 'Only the runtime report changes activity; only the system completion handler writes completion (BC3).',
    check: (before, after, command) => {
      const runtime = isSystem(command.actor, 'system:runtime-report');
      if (!runtime && !same(before.activities, after.activities))
        return `${command.name} changed runtime activity`;
      if (!runtime && !same(before.completions, after.completions))
        return `${command.name} wrote a completion`;
      return null;
    },
  },
  {
    id: 3,
    rule: 'Only the completion handler adds a completion, one at a time — never a launch, a resource, an assessment, time or another command; a completion is never removed and a second one never moves its date.',
    check: (before, after, command) => {
      for (const completion of before.completions) {
        const later = after.completions.find((row) => key(row) === key(completion));
        if (!later || later.completedAt !== completion.completedAt)
          return `completion ${key(completion)} moved or vanished`;
      }
      const added = after.completions.length - before.completions.length;
      if (added > 0 && command.name !== 'reportCompletion')
        return `${command.name} added a completion`;
      return added > 1 ? 'one report added several completions' : null;
    },
  },
  {
    id: 4,
    rule: 'Format progress is identical before and after a grant withdrawal or an institution pause (work is kept).',
    check: (before, after, command) =>
      ['withdrawGrant', 'pauseInstitution', 'restoreInstitution', 'deactivateStudent'].includes(
        command.name,
      ) && !same([...progressMap(before)], [...progressMap(after)])
        ? `${command.name} changed progress`
        : null,
  },
  {
    id: 5,
    rule: 'Can-open is identical before and after any runtime event (activity never grants access).',
    check: (before, after, command) =>
      isSystem(command.actor, 'system:runtime-report') && !same([...before.gates], [...after.gates])
        ? 'a runtime report changed what a Student can open'
        : null,
  },
  {
    id: 6,
    rule: 'The public catalogue is identical before and after any Institute Admin, Super Admin pause or Student command.',
    check: (before, after, command) => {
      const role = command.actor.kind === 'person' ? command.actor.role : null;
      const pause = command.name === 'pauseInstitution' || command.name === 'restoreInstitution';
      if (role !== 'tenant_admin' && role !== 'student' && !pause) return null;
      return same(
        publicCatalogue(before.experiments, before.courses),
        publicCatalogue(after.experiments, after.courses),
      )
        ? null
        : `${command.name} changed the public catalogue`;
    },
  },
  {
    id: 7,
    rule: 'At most one feedback per Student × Experiment × format, and only with that format’s completion (BC5).',
    check: (_before, after) => {
      const keys = after.feedback.map(key);
      if (new Set(keys).size !== keys.length) return 'two feedback records for one format';
      const completed = new Set(after.completions.map(key));
      return keys.every((k) => completed.has(k))
        ? null
        : 'feedback without a completion of that format';
    },
  },
  {
    id: 8,
    rule: 'Activating a plan creates no grant; giving a grant creates no runtime activity.',
    check: (before, after, command) => {
      const activation = ['approveRequest', 'approveSmallerScope', 'reportPaymentOutcome'].includes(
        command.name,
      );
      if (activation && !same(before.grants, after.grants))
        return `${command.name} created a grant`;
      if (command.name === 'giveAccess' && !same(before.activities, after.activities))
        return 'giving access wrote activity';
      return null;
    },
  },
  {
    id: 9,
    rule: 'Assessment rules are read only from that assessment (its current version); no default exists (BC6).',
    check: (_before, after) => {
      if (!Object.values(NO_RULES).every((value) => value === null))
        return 'an assessment default exists';
      const stray = after.assessments.find(
        (assessment) =>
          !same(
            assessment.rules,
            assessment.versions.find((version) => version.version === assessment.version)?.rules,
          ),
      );
      return stray ? `${stray.id} has rules that are not its own version's` : null;
    },
  },
  {
    id: 10,
    rule: 'No command merges, de-duplicates, removes or renames one experiment record into another; the Composite Wall records stay two (BC11).',
    check: (before, after) => {
      const ids = after.experiments.map((experiment) => experiment.id);
      if (new Set(ids).size !== ids.length) return 'two records share an experiment id';
      if (!before.experiments.every((experiment) => ids.includes(experiment.id)))
        return 'an experiment record was removed or merged';
      const names = (world: InvariantWorld) =>
        world.experiments.map((experiment) => experiment.live.catalogue.name.trim().toLowerCase());
      const distinct = (list: readonly string[]) => new Set(list).size === list.length;
      return distinct(names(before)) && !distinct(names(after))
        ? 'one experiment was renamed into another'
        : null;
    },
  },
  {
    id: 11,
    rule: '"Completed" is read only from the completion record, whatever the activity says (BC3).',
    check: (_before, after) => {
      const completed = new Set(after.completions.map(key));
      for (const activity of after.activities) {
        if (
          !completed.has(key(activity)) &&
          formatProgress({ activity, completion: null }) === 'completed'
        ) {
          return `progress reads Completed without a completion (${key(activity)})`;
        }
      }
      return null;
    },
  },
  {
    id: 12,
    rule: 'Runtime events name production sources only; sample provenance lives in the sample-world envelope (TE-3).',
    check: () =>
      RUNTIME_SOURCES.some((source) => /stand-?in|demo|prototype|sample/i.test(source))
        ? 'a stand-in source reached the runtime vocabulary'
        : null,
  },
];

/** All broken invariants for one command, or an empty list. */
export function brokenInvariants(
  before: InvariantWorld,
  after: InvariantWorld,
  command: CommandInfo,
): readonly string[] {
  return INVARIANTS.flatMap((invariant) => {
    const message = invariant.check(before, after, command);
    return message ? [`#${invariant.id} ${message}`] : [];
  });
}

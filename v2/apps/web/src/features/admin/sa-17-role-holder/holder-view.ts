/**
 * SA-16 / SA-17 views of a role holder (the SA-v1 export's `V.roles`, `V.holder`): pure functions
 * from the service's facts (`holderView`: the record and its current scopes with their status,
 * course code and name; PC-70) to what the screens list. They decide nothing — every rule is the
 * service's; they only name, order and pair what it answered.
 */
import type { ActorRef, PlatformRoleHolder, RoleScope, ScopeTarget } from '@xr/domain';

import { dayMonthYear } from '@/copy/dates';
import {
  ALL_EXPERIMENTS,
  courseScopeWords,
  effectLine,
  reasonByNote,
  registeredAs,
  registeredNote,
  scopeAssignedWhat,
  scopeRestoredWhat,
  scopeWithdrawnWhat,
} from '@/copy/platform-roles';
import { stateWords } from '@/copy/state-copy';
import type { HolderView, ScopeView } from '@/queries/platform-roles-forms';

/** How a scope is named: short in lists, the history and flashes; full in names; its row's parts. */
export interface ScopeNaming {
  /** “ME ZG523”, “All experiments”, “Distillation Column”. */
  readonly short: string;
  /** “ME ZG523 · Thermodynamics & Heat Transfer”, “All experiments”, “Distillation Column”. */
  readonly full: string;
  /** A course's platform code, drawn as its chip in the row (`null`: no chip). */
  readonly code: string | null;
  /** The row's words after the chip: “Thermodynamics & Heat Transfer”, “All experiments”. */
  readonly title: string;
}

/** The courses and experiments a history-only scope may name (the structure, the catalogue). */
export interface TargetLookup {
  readonly courses: ReadonlyMap<string, { readonly code: string | null; readonly name: string }>;
  readonly experiments: ReadonlyMap<string, string>;
}

const NO_LOOKUP: TargetLookup = { courses: new Map(), experiments: new Map() };

function courseNaming(code: string | null, name: string | null, id: string): ScopeNaming {
  // A course without a platform code is named by its name (T-17; state-copy `SA-16.can-act-on`).
  return {
    short: code ?? name ?? id,
    full: courseScopeWords(code, name) || id,
    code,
    title: name ?? code ?? id,
  };
}

function experimentNaming(name: string | null, id: string): ScopeNaming {
  const short = name ?? id;
  return { short, full: short, code: null, title: short };
}

const ALL: ScopeNaming = {
  short: ALL_EXPERIMENTS,
  full: ALL_EXPERIMENTS,
  code: null,
  title: ALL_EXPERIMENTS,
};

/** A current scope as the service names it. */
export function namingOf(view: ScopeView): ScopeNaming {
  const target = view.scope.target;
  if (target.kind === 'course') return courseNaming(view.courseCode, view.name, target.courseId);
  if (target.kind === 'experiment') return experimentNaming(view.name, target.experimentId);
  return ALL;
}

function sameTarget(a: ScopeTarget, b: ScopeTarget): boolean {
  if (a.kind === 'course' && b.kind === 'course') return a.courseId === b.courseId;
  if (a.kind === 'experiment' && b.kind === 'experiment') return a.experimentId === b.experimentId;
  return a.kind === b.kind;
}

/**
 * Every scope of the record named — the current ones as the service names them; one that is
 * history only (assigned or restored again since) as a current scope with the same target names
 * it, else from the structure and the catalogue.
 */
export function scopeNamings(
  view: HolderView,
  lookup: TargetLookup = NO_LOOKUP,
): ReadonlyMap<string, ScopeNaming> {
  const named = new Map<string, ScopeNaming>();
  for (const scope of view.scopes) named.set(scope.scope.id, namingOf(scope));
  for (const scope of view.holder.scopes) {
    if (named.has(scope.id)) continue;
    const twin = view.scopes.find((current) => sameTarget(current.scope.target, scope.target));
    if (twin) {
      named.set(scope.id, namingOf(twin));
      continue;
    }
    const target = scope.target;
    if (target.kind === 'course') {
      const course = lookup.courses.get(target.courseId);
      named.set(
        scope.id,
        courseNaming(course?.code ?? null, course?.name ?? null, target.courseId),
      );
    } else if (target.kind === 'experiment') {
      named.set(
        scope.id,
        experimentNaming(lookup.experiments.get(target.experimentId) ?? null, target.experimentId),
      );
    } else named.set(scope.id, ALL);
  }
  return named;
}

/** “Can act on”: the active scopes in the order they were assigned (state-copy `SA-17.lists`). */
export function activeScopes(view: HolderView): readonly ScopeView[] {
  return view.scopes.filter((scope) => scope.status === 'active');
}

/** “Withdrawn”: the scopes withdrawn and not given back, newest withdrawal first. */
export function withdrawnScopes(view: HolderView): readonly ScopeView[] {
  return view.scopes
    .filter((scope) => scope.status === 'withdrawn' && scope.scope.withdrawal !== null)
    .map((scope, index) => ({ scope, index }))
    .sort((a, b) => {
      const at = (entry: typeof a) => entry.scope.scope.withdrawal!.at;
      return at(a) === at(b) ? b.index - a.index : at(a) < at(b) ? 1 : -1;
    })
    .map((entry) => entry.scope);
}

/**
 * The “Can act on” line (the export's `EFF`). A Vendor's scope that is not a course is shown as held,
 * never as a right: what it lets a Vendor do is open (ROLE-11; state-copy `SA-17.vendor-open`).
 */
export function effectWords(view: HolderView): string {
  const active = activeScopes(view);
  const role = view.holder.role;
  if (role !== 'vendor')
    return effectLine(
      role,
      active.map((scope) => namingOf(scope).short),
    );
  const courses = active.filter((scope) => scope.scope.target.kind === 'course');
  const open = active.length > courses.length ? stateWords('SA-17.vendor-open') : null;
  if (courses.length === 0) return open ?? effectLine(role, []);
  const line = effectLine(
    role,
    courses.map((scope) => namingOf(scope).short),
  );
  return open ? `${line} ${open}` : line;
}

/** Who did it, by name (“Arjun Mehta”). */
export function actorName(actor: ActorRef): string {
  if (actor.kind === 'person') return actor.displayName;
  if (actor.kind === 'requester') return actor.name;
  return actor.system;
}

/** One history line (`ol.rk-tl > li`). */
export interface HistoryLine {
  readonly id: string;
  readonly what: string;
  readonly when: string;
  readonly note: string | null;
}

/**
 * The history, newest first (the export's `x.hist`; state-copy `SA-17.history`). The record's scopes are
 * appended one per assignment or restoration and its history one entry per command, both in
 * order, so the scopes added after registration pair with those entries in turn; the scopes
 * before them were given at registration. A withdrawal names the scope it withdrew (its time and
 * reason).
 */
export function historyLines(
  holder: PlatformRoleHolder,
  named: ReadonlyMap<string, ScopeNaming>,
): readonly HistoryLine[] {
  const shortOf = (scope: RoleScope | undefined) =>
    scope ? (named.get(scope.id)?.short ?? scope.id) : '';
  const added = holder.history.filter(
    (entry) => entry.event === 'scope-assigned' || entry.event === 'scope-restored',
  ).length;
  const atRegistration = holder.scopes.slice(0, Math.max(0, holder.scopes.length - added));
  const later = holder.scopes.slice(atRegistration.length);
  const used = new Set<string>();
  let next = 0;
  const lines = holder.history.map((entry): HistoryLine => {
    const by = actorName(entry.actor);
    const base = { id: entry.id, when: dayMonthYear(entry.at) };
    switch (entry.event) {
      case 'registered':
        return {
          ...base,
          what: registeredAs(holder.role),
          note: registeredNote(by, atRegistration.map(shortOf)),
        };
      case 'scope-assigned':
      case 'scope-restored': {
        const scope = later[next];
        next += 1;
        const what = entry.event === 'scope-assigned' ? scopeAssignedWhat : scopeRestoredWhat;
        return { ...base, what: what(shortOf(scope)), note: by };
      }
      case 'scope-withdrawn': {
        const candidates = holder.scopes.filter(
          (scope) => scope.withdrawal?.at === entry.at && !used.has(scope.id),
        );
        const scope =
          candidates.find((candidate) => candidate.withdrawal?.reason === entry.note) ??
          candidates[0];
        if (scope) used.add(scope.id);
        const reason = entry.note ?? scope?.withdrawal?.reason ?? '';
        return {
          ...base,
          what: scopeWithdrawnWhat(shortOf(scope)),
          note: reason ? reasonByNote(reason, by) : by,
        };
      }
    }
  });
  return lines.reverse();
}

/**
 * SA-16 row (the export's `V.roles` row): “Can act on” — each active scope named short, a course
 * with its code chip — and how many scopes are withdrawn.
 */
export function rowFacts(view: HolderView): {
  readonly inScope: readonly ScopeNaming[];
  readonly withdrawn: number;
} {
  return {
    inScope: activeScopes(view).map(namingOf),
    withdrawn: view.scopes.filter((scope) => scope.status === 'withdrawn').length,
  };
}

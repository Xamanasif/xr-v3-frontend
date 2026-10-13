/**
 * Transition tables (Appendix F §3.5 `states.ts`; Appendix C §2 "Transitions"). Each
 * status-bearing record lists its drawn transitions as data: from (null = the record is
 * created), to, the command or system event, and who performs it. Decisions consult the table,
 * so a (from, to) pair that is not listed can never be produced (WP-0.9 acceptance 2).
 */
import type { Role, SystemActor } from '../roles.js';

/** A role, the public surface (a visitor or requester without an account) or a system writer. */
export type TransitionActor = Role | 'public' | SystemActor;

export interface Transition<S extends string, C extends string> {
  readonly from: S | null;
  readonly to: S;
  readonly command: C;
  readonly actors: readonly TransitionActor[];
}

export type TransitionTable<S extends string, C extends string> = readonly Transition<S, C>[];

/** The drawn transition a command takes from a state, if any. */
export function transitionFor<S extends string, C extends string>(
  table: TransitionTable<S, C>,
  from: S | null,
  command: C,
): Transition<S, C> | undefined {
  return table.find((row) => row.from === from && row.command === command);
}

/** Is this exact transition drawn: from → to by this command? */
export function isDrawnTransition<S extends string, C extends string>(
  table: TransitionTable<S, C>,
  from: S | null,
  to: S,
  command: C,
): boolean {
  return table.some((row) => row.from === from && row.to === to && row.command === command);
}

/** Is (from → to) drawn for any command? */
export function isDrawnPair<S extends string, C extends string>(
  table: TransitionTable<S, C>,
  from: S | null,
  to: S,
): boolean {
  return table.some((row) => row.from === from && row.to === to);
}

/** Every command a state can take, in table order. */
export function commandsFrom<S extends string, C extends string>(
  table: TransitionTable<S, C>,
  from: S | null,
): readonly C[] {
  return [...new Set(table.filter((row) => row.from === from).map((row) => row.command))];
}

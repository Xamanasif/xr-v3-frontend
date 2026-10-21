import type { ActionRole, LedgerEntry, LedgerOutcome, LedgerScreen } from '../link-targets';

/** One drawn action of a Phase-3 page: where, words, role, target, outcome, board, note. */
export type PageRow = readonly [
  where: string,
  action: string,
  role: ActionRole,
  target: string | null,
  outcome: LedgerOutcome,
  board: string,
  note?: string,
];

/**
 * A Phase-3 page's drawn actions, one row each (as the Package-2A rows were). A drawn
 * action whose screen is not built is not rendered (DEV-21): its note names that screen.
 */
export function pageRows(
  screen: LedgerScreen,
  on: string,
  rows: readonly PageRow[],
): LedgerEntry[] {
  return rows.map(([where, action, role, target, outcome, board, note]) => ({
    screen,
    where,
    action,
    role,
    on,
    target,
    outcome,
    board,
    ...(note ? { note } : {}),
  }));
}

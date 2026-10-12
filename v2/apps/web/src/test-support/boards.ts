/**
 * Test support (never product code: ADR-0007; outside every fence and the product scans): reads
 * the frozen v46 boards (design/handoff-v46, read only) for the evidence the shell tests compare
 * against. The board's sample people are fixtures for tests; the product takes people from the
 * sample world through the session (ADR-0003).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ROLE_LABEL, type Role } from '@xr/domain';

import type { ShellPerson } from '@/features/shared/xs-05-account-menu/account-menu';

export const REPO_ROOT = join(import.meta.dirname, '..', '..', '..', '..', '..');

export const BOARDS_DIRECTORY = join(REPO_ROOT, 'design', 'handoff-v46', 'canvas-v46', 'project');

/** A frozen board's source, by file name. */
export function board(file: string): string {
  return readFileSync(join(BOARDS_DIRECTORY, file), 'utf8');
}

/** One row of board 06's account-menu table, with board 05's initials for that person. */
export interface BoardAccountRow {
  readonly name: string;
  readonly initials: string;
  readonly role: string;
  /** The institution or organisation line; `null` for "— (platform role)". */
  readonly line: string | null;
  /** "My device* · Help · Sign out" → ['My device', 'Help', 'Sign out']. */
  readonly items: readonly string[];
}

/** Board 06 "Account menu · same pattern in every workspace", by workspace label, in its order. */
export const BOARD_ACCOUNT_ROWS: ReadonlyMap<string, BoardAccountRow> = (() => {
  const initials = new Map(
    [
      ...board('05-Workspace-Shell.dc.html').matchAll(/person: '([^']+)', initials: '([^']+)'/g),
    ].map(([, name, letters]) => [name!, letters!]),
  );
  const text = board('06-Sidebar-Variants.dc.html');
  const start = text.indexOf('<th>Workspace</th><th>Name (sample)</th>');
  const body = text.slice(start, text.indexOf('</table>', start));
  return new Map(
    [
      ...body.matchAll(
        /<tr><td><strong>([^<]+)<\/strong><\/td><td>([^<]+)<\/td><td>([^<]+)<\/td><td>(.*?)<\/td><td>([^<]+)<\/td><\/tr>/g,
      ),
    ].map(([, workspace, name, role, line, items]) => [
      workspace!,
      {
        name: name!,
        initials: initials.get(name!) ?? '',
        role: role!,
        line: line!.includes('(platform role)') ? null : line!,
        items: items!.replace('*', '').split(' · '),
      },
    ]),
  );
})();

/**
 * The board's sample person of a workspace as the shell receives one. A platform role is given an
 * organisation too, so tests prove the shell never shows one for it.
 */
export function boardPerson(role: Role): ShellPerson {
  const row = BOARD_ACCOUNT_ROWS.get(ROLE_LABEL[role])!;
  return {
    id: `board-person-${role}`,
    name: row.name,
    initials: row.initials,
    organisation: row.line ?? 'Godavari Institute of Technology',
  };
}

/**
 * The component ledger (packages/ui/LEDGER.md) against the WP-0.6 source inventory (Appendix F
 * WP-0.6 acceptance 1: "A component ledger lists 42 entries, each with board code + frame cited
 * by its markup-contract test").
 *
 * The inventory is read from Appendix E §3 itself, so the ledger can neither drop nor invent a
 * row: Phase-0 rows (phase cell starting with 0) must be implemented, later-phase rows deferred.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { STYLESHEET_CLASS_NAMES } from './testing/index.js';

const PACKAGE = join(import.meta.dirname, '..');
const SPECIMENS = join(PACKAGE, '..', '..', 'apps', 'specimens');
const APPENDIX_E = join(
  PACKAGE,
  '..',
  '..',
  'docs',
  'v46',
  'audit',
  'Appendix-E-Visual-Strategy.md',
);

interface InventoryRow {
  readonly name: string;
  readonly phase: string;
}

function inventory(): InventoryRow[] {
  const text = readFileSync(APPENDIX_E, 'utf8');
  const section = text.slice(
    text.indexOf('## 3. Component library inventory'),
    text.indexOf('## 4. Role-aware navigation'),
  );
  return section
    .split('\n')
    .filter((line) => line.startsWith('| **'))
    .map((line) => {
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((cell) => cell.trim());
      return { name: /\*\*(.+?)\*\*/.exec(cells[0] ?? '')?.[1] ?? '', phase: cells.at(-1) ?? '' };
    });
}

/** The rows of the markdown table under `## <heading>` in LEDGER.md. */
function ledgerTable(heading: string): string[][] {
  const text = readFileSync(join(PACKAGE, 'LEDGER.md'), 'utf8');
  const start = text.indexOf(`## ${heading}`);
  expect(start, `LEDGER.md has a "## ${heading}" section`).toBeGreaterThanOrEqual(0);
  const body = text.slice(start).split('\n## ')[0] ?? '';
  return body
    .split('\n')
    .filter((line) => line.startsWith('|') && !/^\|\s*-/.test(line))
    .slice(1)
    .map((line) =>
      line
        .slice(1, -1)
        .split(/(?<!\\)\|/)
        .map((cell) => cell.trim()),
    );
}

const rows = inventory();
const phaseZero = rows.filter((row) => row.phase.startsWith('0')).map((row) => row.name);
const later = rows.filter((row) => !row.phase.startsWith('0') && row.phase !== '—');
const notBuilt = rows.filter((row) => row.phase === '—').map((row) => row.name);

describe('component ledger (LEDGER.md) against Appendix E §3', () => {
  it('Appendix E §3 has 42 Phase-0 rows, 14 later-phase rows and 2 not-built rows', () => {
    expect(phaseZero).toHaveLength(42);
    expect(later).toHaveLength(14);
    expect(notBuilt).toHaveLength(2);
  });

  const implemented = ledgerTable('Phase-0 components');
  // | # | Component | Group | Sources | Classes | Variants · states | Accessibility | Unit test | Browser spec | Status |

  it('lists exactly the 42 Phase-0 components, once each, as implemented', () => {
    expect(implemented.map((row) => row[1])).toEqual(phaseZero);
    for (const row of implemented) {
      expect(row[9], row[1]).toMatch(/^implemented/);
    }
  });

  it.each(implemented.map((row) => [row[1] ?? '', row] as const))(
    '%s: its unit test cites every board and frame, its browser spec exists, its classes are real',
    (_name, row) => {
      const sources = [...(row[3] ?? '').matchAll(/([0-9]{2}[ab]?|B[0-9]-[0-9]{2}) · "([^"]+)"/g)];
      expect(sources.length, 'at least one board · "frame" source').toBeGreaterThan(0);
      const testPath = join(PACKAGE, (row[7] ?? '').replace(/`/g, ''));
      expect(existsSync(testPath), testPath).toBe(true);
      const test = readFileSync(testPath, 'utf8');
      for (const [, board, frame] of sources) {
        expect(test, `${testPath} cites board ${board}`).toContain(`board: '${board}'`);
        expect(test.replace(/\s+/g, ' '), `${testPath} cites frame "${frame}"`).toContain(
          frame ?? '',
        );
      }
      const specPath = join(SPECIMENS, (row[8] ?? '').replace(/`/g, ''));
      expect(existsSync(specPath), specPath).toBe(true);
      const classes = [...(row[4] ?? '').matchAll(/`\.?([a-z][\w-]*)`/g)].map((match) => match[1]);
      expect(classes.length, 'classes listed').toBeGreaterThan(0);
      for (const name of classes) {
        if (name?.startsWith('xr-x-')) continue;
        expect(STYLESHEET_CLASS_NAMES.has(name ?? ''), `class ${name}`).toBe(true);
      }
    },
  );

  it('defers exactly the 14 later-phase rows, with their phase', () => {
    const deferred = ledgerTable('Deferred to later phases');
    expect(deferred.map((row) => row[0])).toEqual(later.map((row) => row.name));
    expect(deferred.map((row) => row[1])).toEqual(later.map((row) => row.phase));
  });

  it('records what is not built because no board draws it', () => {
    expect(ledgerTable('Not built').map((row) => row[0])).toEqual(notBuilt);
  });
});

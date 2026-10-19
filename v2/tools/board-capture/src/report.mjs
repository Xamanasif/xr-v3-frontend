// Reads a parity run's Playwright JSON report: every comparison with its measured result and its
// outcome, the board loads, the reference captures. `node tools/board-capture/src/report.mjs
// <run folder> [--json]` prints the list; `pnpm verify` uses `summariseRun`. Run evidence only:
// acceptance is decided by the suites' own assertions.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { CLOSED_STATUSES, DEVIATION_BY_ID } from './deviations.mjs';

function* specs(suite) {
  for (const spec of suite.specs ?? []) yield spec;
  for (const child of suite.suites ?? []) yield* specs(child);
}

export function parityRecords(runDirectory) {
  const report = JSON.parse(readFileSync(join(runDirectory, 'report.json'), 'utf8'));
  const records = [];
  const outcomes = new Map();
  const boards = [];
  const tests = [];
  for (const suite of report.suites ?? []) {
    for (const spec of specs(suite)) {
      for (const test of spec.tests ?? []) {
        const result = test.results?.at(-1);
        tests.push({ title: spec.title, file: spec.file, status: result?.status ?? 'unknown' });
        const annotations = result?.annotations?.length
          ? result.annotations
          : (test.annotations ?? []);
        for (const annotation of annotations) {
          const data = () => JSON.parse(annotation.description);
          if (annotation.type === 'parity') records.push({ test: spec.title, ...data() });
          if (annotation.type === 'parity-outcome') outcomes.set(data().name, data());
          if (annotation.type === 'board') boards.push({ test: spec.title, ...data() });
        }
      }
    }
  }
  for (const record of records) {
    const outcome = outcomes.get(record.name);
    record.outcome = outcome?.outcome ?? 'unrecorded';
    record.deviations = outcome?.deviations ?? [];
  }
  // A comparison that failed before it was measured (a missing element) has an outcome only.
  for (const [name, outcome] of outcomes) {
    if (!records.some((record) => record.name === name)) {
      records.push({ name, kind: '?', measured: { error: outcome.message }, ...outcome });
    }
  }
  return { records, boards, tests, stats: report.stats };
}

/** The board references of a run (`board-references/manifest-*.json`). */
export function referenceManifest(runDirectory) {
  const directory = join(runDirectory, 'board-references');
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((file) => file.startsWith('manifest-'))
    .flatMap((file) => JSON.parse(readFileSync(join(directory, file), 'utf8')));
}

/** Counts for the verify summary: outcomes, deviation statuses, references, external requests. */
export function summariseRun(runDirectories) {
  const all = runDirectories.filter((directory) => existsSync(join(directory, 'report.json')));
  const runs = all.map((directory) => parityRecords(directory));
  const records = runs.flatMap((run) => run.records);
  const count = (predicate) => records.filter(predicate).length;
  const byStatus = {};
  const byDeviation = {};
  for (const record of records.filter((entry) => entry.outcome === 'registered-deviation')) {
    for (const deviation of record.deviations) {
      byStatus[deviation.status] = (byStatus[deviation.status] ?? 0) + 1;
      byDeviation[deviation.id] = (byDeviation[deviation.id] ?? 0) + 1;
    }
  }
  const boards = runs.flatMap((run) => run.boards);
  return {
    comparisons: records.length,
    frames: count((entry) => entry.frame === true),
    within: count((entry) => entry.outcome === 'within-tolerance'),
    registered: count((entry) => entry.outcome === 'registered-deviation'),
    // Superseded by an owner-approved V3 screen and retired by name (V3-COMPARISON-MAP.json):
    // neither passed nor failed.
    retired: count((entry) => entry.outcome === 'retired-by-v3'),
    failed: count(
      (entry) =>
        entry.outcome !== 'within-tolerance' &&
        entry.outcome !== 'registered-deviation' &&
        entry.outcome !== 'retired-by-v3',
    ),
    iconMismatches: count((entry) => entry.icons && !entry.icons.same),
    masked: records
      .filter((entry) => entry.maskCount > 0)
      .map((entry) => ({ name: entry.name, reasons: entry.masks })),
    byStatus,
    byDeviation,
    blockingOpen: Object.keys(byDeviation)
      .filter((id) => {
        const entry = DEVIATION_BY_ID.get(id);
        return entry?.blocksParity && !CLOSED_STATUSES.includes(entry.status);
      })
      .sort(),
    // Observed entries the owner has not closed (provisional or under review).
    open: Object.keys(byDeviation)
      .filter((id) => !CLOSED_STATUSES.includes(DEVIATION_BY_ID.get(id)?.status))
      .sort(),
    references: all.flatMap((directory) => referenceManifest(directory)).length,
    boardLoads: boards.length,
    externalRequests: boards.reduce(
      (total, board) => total + (board.network?.blocked?.length ?? 0),
      0,
    ),
    tests: runs.flatMap((run) => run.tests),
  };
}

const within = (record) =>
  typeof record.measured?.differentPixels === 'number' &&
  record.measured.ratio <= record.tolerance.maxDiffPixelRatio;

// CLI only when run directly (verify.mjs and register.mjs import this module).
if (process.argv[1]?.endsWith('report.mjs') && process.argv[2]) {
  const { records, boards, stats } = parityRecords(process.argv[2]);
  if (process.argv.includes('--json')) {
    writeFileSync(
      join(process.argv[2], 'parity-records.json'),
      `${JSON.stringify({ records, boards, stats }, null, 2)}\n`,
    );
  }
  for (const record of records) {
    const m = record.measured ?? {};
    const result = m.sizeMismatch
      ? `SIZE ${m.sizeMismatch}`
      : typeof m.differentPixels === 'number'
        ? `${m.differentPixels} px (${(m.ratio * 100).toFixed(3)}%)`
        : `ERROR ${m.error}`;
    const ids = (record.deviations ?? []).map((deviation) => deviation.id).join('+');
    const icons = record.icons && !record.icons.same ? ' ICONS' : '';
    process.stdout.write(
      `${within(record) ? 'ok  ' : 'DIFF'} ${String(record.kind).padEnd(8)} ${record.name.padEnd(64)} ${result}${icons}${ids ? ` [${ids}]` : ''} ${record.outcome ?? ''}\n`,
    );
  }
  process.stdout.write(
    `\n${records.length} comparisons, ${records.filter(within).length} within tolerance; ${boards.length} board loads; tests: ${JSON.stringify(stats)}\n`,
  );
}

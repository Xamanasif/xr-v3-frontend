#!/usr/bin/env node
// `pnpm verify` — the local gate of the v46 frontend (Appendix F §7.7). Every step is
// blocking; the first failure stops the run. Until a CI runner exists (P0-01, VD-18) this is
// the gate, and its output is the evidence recorded for each work package.
//
//   1. format       prettier --check (frozen copies are prettier-ignored)
//   2. repository   UNCACHED: frozen handoff 178/178, audit-evidence and @xr/ui v46-copy
//                   checksums, the static scans, the dependency deny-list and the lint-fence wiring
//                   (they read files outside any one package, so Turbo must not cache them)
//   3. workspace    turbo build (+ the web app's dedicated test-hook build), then turbo
//                   typecheck lint test, --force (no cached replays). Two invocations:
//                   @xr/database runs `prisma generate` in both its build and typecheck
//                   scripts, and two uncached generates into one folder collide.
//   4. bundle       the product build (`.next`, made in this run) contains no test seam and no
//                   specimen-harness code; the test-hook build (`.next-test-hooks`) is the
//                   positive control — the same scan must find the bridge there (TE-7, WP-0.12)
//   5. browser      Playwright at the four approved widths: product smoke, browser-helper
//                   self-tests, test-hook bridge, the Phase-0 foundation screens and guards
//                   (e2e/foundation, WP-0.13), the cross-role proofs on one tab and one world
//                   (e2e/foundation/cross-role, WP-0.14), the deferred flow skeletons (e2e/flows,
//                   fixme), specimen harness (ports 3000, 3100 and 3200 must be free)
//   6. parity       WP-0.15 visual parity, kept apart from the four-width suites: the frozen v46
//                   boards rendered offline by tools/board-capture (vendored, SRI-checked inputs;
//                   network blocked except localhost) against the @xr/ui specimens (3100) and the
//                   built Phase-0 screens (3200), same run, same machine, same Chromium (VD-18
//                   local interim). Fails on any comparison outside tolerance that the
//                   expected-deviation register does not name, and on any stale register entry;
//                   prints the register entries still awaiting the owner. Artefacts stay in
//                   tools/board-capture/.runs/<run> (git-ignored).
//
// Suites that do not exist yet are listed as such at the end; nothing is reported as run
// that did not run.
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createConnection } from 'node:net';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DEVIATION_BY_ID } from '../tools/board-capture/src/deviations.mjs';
import { EXPECTED_REFERENCES } from '../tools/board-capture/src/inventory.mjs';
import { summariseRun } from '../tools/board-capture/src/report.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

/** Suites the plan names that later work packages create or that wait for their screen; reported, never claimed. */
const NOT_YET_PRESENT = [
  [
    'SA-02 route-level DataTable sort test (apps/web/e2e/a11y/datatable-sort.spec.ts, written as fixme: reported as skipped)',
    'Phase 1 (SA-02)',
  ],
  [
    'full-UI flow tests (apps/web/e2e/flows, 36 deferred test.fixme: reported as skipped)',
    'Phase 7 (each needs its flow’s screens, B8-06 Phases 1–6)',
  ],
];

/** What the test-hook build must contain, proving the bundle scan finds the bridge when it is there. */
const TEST_HOOK_BUILD_MARKERS = [
  'xr-web-test-hook-bridge',
  'xr-web-test-session-switch',
  '__XR_TEST_HOOKS__',
  '__XR_TEST_BOOT__',
];

/**
 * Names that may exist only in tests, the CI-only bridge or the specimen harness; the contract
 * suite and the stand-in ports of @xr/contracts/draft carry their own markers.
 */
const BUNDLE_SENTINELS = [
  // WP-0.15: the board-capture harness, its canvas-runtime calls and the parity specimens.
  'xr-v46-board-capture',
  '__dcSetProps',
  'XR_BOARD_ORIGIN',
  'XR_PARITY_RUN_DIR',
  'data-parity',
  'xr-web-test-hook-bridge',
  'xr-web-test-session-switch',
  'switchSession',
  '__XR_TEST_BOOT__',
  '__XR_TEST_HOOKS__',
  'NEXT_PUBLIC_XR_TEST_HOOKS',
  'harness-probe',
  'specimen-frame',
  'Specimen harness',
  'xr-contracts-draft-contract-suite',
  'xr-contracts-draft-standins',
  'xr-sample-platform-testing',
];

function run(command, args, env = {}) {
  return new Promise((resolvePromise) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    });
    let output = '';
    const forward = (stream, target) =>
      stream.on('data', (chunk) => {
        output += chunk;
        target.write(chunk);
      });
    forward(child.stdout, process.stdout);
    forward(child.stderr, process.stderr);
    child.on('close', (code) => resolvePromise({ code: code ?? 1, output }));
  });
}

// eslint-disable-next-line no-control-regex
const plain = (text) => text.replace(/\u001b\[[0-9;]*m/g, '');

function vitestTotals(output) {
  const totals = new Map();
  for (const line of plain(output).split('\n')) {
    const match = /^(?:(@xr\/[\w-]+):test:\s+)?\s*Tests\s+(\d+) passed(?: \((\d+)\))?/.exec(line);
    if (match) totals.set(match[1] ?? 'scans', Number(match[3] ?? match[2]));
  }
  return totals;
}

function playwrightTotals(output, outcome = 'passed') {
  const totals = new Map();
  const pattern = new RegExp(`^(@xr\\/[\\w-]+):test:e2e:\\s+(\\d+) ${outcome}`);
  for (const line of plain(output).split('\n')) {
    const match = pattern.exec(line);
    if (match) totals.set(match[1], Number(match[2]));
  }
  return totals;
}

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    if (entry === 'cache') return [];
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function portInUse(port) {
  return new Promise((resolvePromise) => {
    const socket = createConnection({ port, host: '127.0.0.1' });
    socket.once('connect', () => {
      socket.destroy();
      resolvePromise(true);
    });
    socket.once('error', () => resolvePromise(false));
  });
}

const results = [];
const started = Date.now();

// The test-hook flag belongs to the dedicated Playwright build only (TE-7). Set in this shell it
// would turn the product build into a test-hook build and the bundle step would scan a stale one.
if (process.env.NEXT_PUBLIC_XR_TEST_HOOKS !== undefined) {
  process.stderr.write(
    'verify: unset NEXT_PUBLIC_XR_TEST_HOOKS first — only the dedicated test-hook build sets it (ADR-0007 §2).\n',
  );
  process.exit(1);
}

async function step(name, work) {
  const begin = Date.now();
  process.stdout.write(`\n━━ verify · ${name} ━━\n`);
  const outcome = await work();
  const seconds = ((Date.now() - begin) / 1000).toFixed(1);
  results.push({ name, ok: outcome.ok, seconds, detail: outcome.detail ?? '' });
  if (!outcome.ok) {
    report();
    process.exit(1);
  }
}

function report() {
  process.stdout.write('\n━━ verify · summary ━━\n');
  for (const result of results) {
    process.stdout.write(
      `  ${result.ok ? 'PASS' : 'FAIL'}  ${result.name.padEnd(12)} ${`${result.seconds}s`.padStart(7)}  ${result.detail}\n`,
    );
  }
  if (results.every((result) => result.ok) && results.length === 6) {
    process.stdout.write('\n  Not run — these suites are deferred or do not exist yet:\n');
    for (const [suite, owner] of NOT_YET_PRESENT)
      process.stdout.write(`    - ${suite}: ${owner}\n`);
    process.stdout.write(
      '  Browsers: Chromium only (P0-28; WebKit/Firefox wait for G-5 or the runner).\n',
    );
    process.stdout.write(
      '  Visual parity: same-machine local interim (VD-18 runner decision open); run artefacts are not committed baselines.\n',
    );
  }
  process.stdout.write(
    `\n  ${results.every((result) => result.ok) ? 'VERIFY PASSED' : 'VERIFY FAILED'} in ${((Date.now() - started) / 1000).toFixed(0)}s\n`,
  );
}

await step('format', async () => {
  const { code } = await run(pnpm, ['exec', 'prettier', '--check', '.']);
  return {
    ok: code === 0,
    detail: code === 0 ? 'prettier --check: clean' : 'prettier --check found unformatted files',
  };
});

await step('repository', async () => {
  const { code, output } = await run(pnpm, ['--filter', '@xr/config', 'run', 'test:scans']);
  const tests = vitestTotals(output).get('scans');
  const handoff = /frozen handoff: (\d+\/\d+) OK/.exec(output)?.[1];
  const evidence = /audit evidence: (\d+\/\d+) OK/.exec(output)?.[1];
  const copies = /v46 copies: (\d+\/\d+) OK/.exec(output)?.[1];
  return {
    ok: code === 0,
    detail: `${tests ?? '?'} checks · handoff ${handoff ?? '?'} · audit evidence ${evidence ?? '?'} · v46 copies ${copies ?? '?'} · scans, deny-list, fence wiring`,
  };
});

await step('workspace', async () => {
  const tasksOf = (output) => {
    const match = /Tasks:\s+(\d+) successful, (\d+) total/.exec(plain(output));
    return match ? `${match[1]}/${match[2]}` : '?';
  };
  const build = await run(pnpm, ['exec', 'turbo', 'run', 'build', 'build:test-hooks', '--force']);
  if (build.code !== 0) return { ok: false, detail: `turbo build ${tasksOf(build.output)} tasks` };
  const { code, output } = await run(pnpm, [
    'exec',
    'turbo',
    'run',
    'typecheck',
    'lint',
    'test',
    '--force',
  ]);
  const totals = vitestTotals(output);
  totals.delete('scans');
  const sum = [...totals.values()].reduce((total, count) => total + count, 0);
  return {
    ok: code === 0,
    detail: `turbo build ${tasksOf(build.output)} + typecheck/lint/test ${tasksOf(output)} tasks (--force) · ${sum} unit tests in ${totals.size} packages (${[...totals].map(([pkg, count]) => `${pkg.replace('@xr/', '')} ${count}`).join(', ')})`,
  };
});

/** Built files of a Next.js output folder, if it was (re)built during this run. */
function freshBuild(folder) {
  const buildId = join(folder, 'BUILD_ID');
  if (!existsSync(buildId) || statSync(buildId).mtimeMs < started) return null;
  return walk(folder).filter((file) => /\.(?:js|html|json|rsc|txt)$/.test(file));
}

await step('bundle', async () => {
  const files = freshBuild(join(root, 'apps', 'web', '.next'));
  if (!files?.length)
    return { ok: false, detail: 'apps/web/.next was not built in this run: the build did not run' };
  const hits = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const sentinel of BUNDLE_SENTINELS) {
      if (text.includes(sentinel)) hits.push(`${relative(root, file)}: ${sentinel}`);
    }
  }
  for (const hit of hits) process.stdout.write(`  found ${hit}\n`);
  // Positive control: the dedicated test-hook build must carry the bridge in a client chunk.
  const testBuild = freshBuild(join(root, 'apps', 'web', '.next-test-hooks'));
  const clientChunks = (testBuild ?? []).filter((file) =>
    file.startsWith(join(root, 'apps', 'web', '.next-test-hooks', 'static')),
  );
  const missing = TEST_HOOK_BUILD_MARKERS.filter(
    (marker) => !clientChunks.some((file) => readFileSync(file, 'utf8').includes(marker)),
  );
  for (const marker of missing) process.stdout.write(`  test-hook build lacks ${marker}\n`);
  return {
    ok: hits.length === 0 && testBuild !== null && missing.length === 0,
    detail: `${files.length} built product files, ${hits.length} test-seam or harness sentinels · test-hook build: ${testBuild === null ? 'not built in this run' : `bridge in its client chunks (${TEST_HOOK_BUILD_MARKERS.length - missing.length}/${TEST_HOOK_BUILD_MARKERS.length} markers)`}`,
  };
});

await step('browser', async () => {
  for (const port of [3000, 3100, 3200]) {
    if (await portInUse(port)) {
      return {
        ok: false,
        detail: `port ${port} is in use; stop that server (e.g. pkill -f next-server) so the suites test this build`,
      };
    }
  }
  const { code, output } = await run(pnpm, ['exec', 'turbo', 'run', 'test:e2e']);
  const totals = playwrightTotals(output);
  const sum = [...totals.values()].reduce((total, count) => total + count, 0);
  // Skipped tests are listed apart and never counted as passed: suites that set their own width
  // run in one project only, and deferred suites are `fixme`.
  const skipped = playwrightTotals(output, 'skipped');
  const skippedSum = [...skipped.values()].reduce((total, count) => total + count, 0);
  return {
    ok: code === 0,
    detail: `${sum} Playwright tests passed at 4 viewports (${[...totals].map(([pkg, count]) => `${pkg.replace('@xr/', '')} ${count}`).join(', ')}); ${skippedSum} skipped, not passed (${[...skipped].map(([pkg, count]) => `${pkg.replace('@xr/', '')} ${count}`).join(', ') || 'none'})`,
  };
});

await step('parity', async () => {
  for (const port of [3100, 3200]) {
    if (await portInUse(port)) {
      return {
        ok: false,
        detail: `port ${port} is in use; stop that server so parity tests this build`,
      };
    }
  }
  const stamp = new Date(started).toISOString().replace(/[:.]/g, '-');
  const runRoot = join(root, 'tools', 'board-capture', '.runs', `${stamp}-verify`);
  const suites = [
    ['@xr/specimens', join(runRoot, 'specimens')],
    ['@xr/web', join(runRoot, 'web')],
  ];
  const codes = [];
  for (const [filter, directory] of suites) {
    const { code } = await run(
      pnpm,
      ['--filter', filter, 'exec', 'playwright', 'test', '-c', 'playwright.parity.config.ts'],
      { XR_PARITY_RUN_DIR: directory },
    );
    codes.push(code);
  }
  const summary = summariseRun(suites.map(([, directory]) => directory));
  const passedTests = summary.tests.filter((test) => test.status === 'passed').length;
  // Every register entry the run observed, by status: nothing provisional or under owner review is
  // reported as accepted.
  for (const [id, total] of Object.entries(summary.byDeviation).sort()) {
    const entry = DEVIATION_BY_ID.get(id);
    process.stdout.write(
      `  ${id} ${entry.status}${entry.blocksParity ? ' (blocks parity acceptance)' : ''} · ${total} comparison(s) · ${entry.title}\n`,
    );
  }
  for (const { name, reasons } of summary.masked) {
    process.stdout.write(`  mask on ${name}: ${reasons.join('; ')}\n`);
  }
  const statuses = Object.entries(summary.byStatus)
    .map(([status, total]) => `${status} ${total}`)
    .join(', ');
  const ok =
    codes.every((code) => code === 0) &&
    summary.failed === 0 &&
    summary.externalRequests === 0 &&
    summary.references === EXPECTED_REFERENCES &&
    summary.masked.every((masked) => masked.reasons.length > 0);
  // Acceptance needs every observed register entry approved (owner-approved or a frozen canvas
  // rule); provisional and owner-review entries are reported, never counted as accepted.
  const awaiting = Object.keys(summary.byDeviation)
    .filter((id) => !['owner-approved', 'approved-rule'].includes(DEVIATION_BY_ID.get(id).status))
    .sort();
  process.stdout.write(
    `  parity acceptance: ${
      awaiting.length === 0
        ? 'every difference is within tolerance, owner-approved or a canvas-only rule'
        : `OPEN — ${awaiting.length} register entries await the owner (${awaiting.join(', ')}); blocking: ${summary.blockingOpen.join(', ') || 'none'}. Registered differences are reported, not approved`
    }\n`,
  );
  return {
    ok,
    detail: `${passedTests}/${summary.tests.length} tests · ${summary.comparisons} comparisons (${summary.frames} whole frames): ${summary.within} within tolerance, ${summary.registered} on the deviation register (${statuses || 'none'}), ${summary.failed} unregistered · ${summary.iconMismatches} icon differences (all registered or failed) · ${summary.masked.length} masked · ${summary.references}/${EXPECTED_REFERENCES} board references · ${summary.externalRequests} external requests · open owner decisions blocking parity: ${summary.blockingOpen.join(', ') || 'none'} · ${relative(root, runRoot)}`,
  };
});

report();

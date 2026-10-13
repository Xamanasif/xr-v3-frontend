#!/usr/bin/env node
// `pnpm verify` — the local gate of the v46 frontend (Appendix F §7.7). Every step is
// blocking; the first failure stops the run. Until a CI runner exists (P0-01, VD-18) this is
// the gate, and its output is the evidence recorded for each work package.
//
//   1. format       prettier --check (frozen copies are prettier-ignored)
//   2. repository   UNCACHED: frozen handoff 178/178, audit-evidence and @xr/ui v46-copy
//                   checksums, the static scans, the dependency deny-list and the lint-fence wiring
//                   (they read files outside any one package, so Turbo must not cache them)
//   3. workspace    turbo build, then turbo typecheck lint test, --force (no cached replays).
//                   Two invocations: @xr/database runs `prisma generate` in both its build
//                   and typecheck scripts, and two uncached generates into one folder collide.
//   4. bundle       the built product contains no test seam and no specimen-harness code
//   5. browser      Playwright at the four approved widths: product smoke, browser-helper
//                   self-tests, specimen harness (needs ports 3000 and 3100 free)
//
// Suites that do not exist yet are listed as such at the end; nothing is reported as run
// that did not run.
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { createConnection } from 'node:net';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

/** Suites the plan names that later work packages create or that wait for their screen; reported, never claimed. */
const NOT_YET_PRESENT = [
  [
    'SA-02 route-level DataTable sort test (apps/web/e2e/a11y/datatable-sort.spec.ts, written as fixme: reported as skipped)',
    'Phase 1 (SA-02)',
  ],
  ['contract suite', 'WP-0.10 / WP-0.11'],
  ['foundation-screen and connected-flow suites (and flow skeletons)', 'WP-0.13 / WP-0.14'],
  ['visual-parity suite', 'WP-0.15 (inputs not yet approved: G-5c, VD-18)'],
];

/** Names that may exist only in tests, the CI-only bridge or the specimen harness. */
const BUNDLE_SENTINELS = [
  '__XR_TEST_BOOT__',
  '__XR_TEST_HOOKS__',
  'NEXT_PUBLIC_XR_TEST_HOOKS',
  'harness-probe',
  'specimen-frame',
  'Specimen harness',
];

function run(command, args) {
  return new Promise((resolvePromise) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
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
  if (results.every((result) => result.ok) && results.length === 5) {
    process.stdout.write('\n  Not run — these suites are deferred or do not exist yet:\n');
    for (const [suite, owner] of NOT_YET_PRESENT)
      process.stdout.write(`    - ${suite}: ${owner}\n`);
    process.stdout.write(
      '  Browsers: Chromium only (P0-28; WebKit/Firefox wait for G-5 or the runner).\n',
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
  const build = await run(pnpm, ['exec', 'turbo', 'run', 'build', '--force']);
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

await step('bundle', async () => {
  const build = join(root, 'apps', 'web', '.next');
  const files = walk(build).filter((file) => /\.(?:js|html|json|rsc|txt)$/.test(file));
  if (files.length === 0)
    return { ok: false, detail: 'apps/web/.next is missing: the build did not run' };
  const hits = [];
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const sentinel of BUNDLE_SENTINELS) {
      if (text.includes(sentinel)) hits.push(`${relative(root, file)}: ${sentinel}`);
    }
  }
  for (const hit of hits) process.stdout.write(`  found ${hit}\n`);
  return {
    ok: hits.length === 0,
    detail: `${files.length} built product files, ${hits.length} test-seam or harness sentinels`,
  };
});

await step('browser', async () => {
  for (const port of [3000, 3100]) {
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

report();

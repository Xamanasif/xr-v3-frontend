#!/usr/bin/env node
// `pnpm dev` — the whole workspace in development:
//   one `tsc -b --watch` over tsconfig.solution.json (every package + the API),
//   the API process gated on a clean graph, and `next dev` for the web app.
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runGraphDev } from './graph-dev.mjs';
import { pnpmCommand } from './spawn-tool.mjs';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// The database package's generated client is an input of the graph; make sure it exists.
const pnpm = pnpmCommand(['--filter', '@xr/database', 'db:generate']);
const generate = spawnSync(pnpm.command, pnpm.args, {
  ...pnpm.options,
  cwd: workspaceRoot,
  stdio: 'inherit',
});
if (generate.error) console.error(`[dev] could not run pnpm: ${generate.error.message}`);
if (generate.status !== 0) process.exit(generate.status ?? 1);

runGraphDev({
  workspaceRoot,
  solution: join(workspaceRoot, 'tsconfig.solution.json'),
  api: {
    root: join(workspaceRoot, 'apps', 'api'),
    entry: join(workspaceRoot, 'apps', 'api', 'dist', 'main.js'),
  },
  web: { root: join(workspaceRoot, 'apps', 'web'), port: 3000 },
});

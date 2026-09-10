#!/usr/bin/env node
// `pnpm dev` — the whole workspace in development:
//   one `tsc -b --watch` over tsconfig.solution.json (every package + the API),
//   the API process gated on a clean graph, and `next dev` for the web app.
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { localBin, runGraphDev } from './graph-dev.mjs';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// The database package's generated client is an input of the graph; make sure it exists.
const generate = spawnSync(
  localBin(workspaceRoot, 'pnpm'),
  ['--filter', '@xr/database', 'db:generate'],
  {
    cwd: workspaceRoot,
    stdio: 'inherit',
  },
);
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

#!/usr/bin/env node
// API-only development: the API's own build project with its project references
// (config, contracts, database, domain, validation) compiled as one graph.
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { runGraphDev } from '../../../scripts/graph-dev.mjs';

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = resolve(apiRoot, '..', '..');

runGraphDev({
  workspaceRoot,
  solution: join(apiRoot, 'tsconfig.build.json'),
  api: { root: apiRoot, entry: join(apiRoot, 'dist', 'main.js') },
  log: (message) => console.log(`[api:dev] ${message}`),
});

#!/usr/bin/env node
// Write the sample world's catalogue to packages/database/prisma/seed/catalogue.json — the
// development seed of the API's catalogue tables (ADR-0013). Run after a catalogue change in the
// sample world: `pnpm --filter @xr/sample-platform export:catalogue-seed` (builds first).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { seed } from '../dist/index.js';
import { catalogueSeedJson } from '../dist/seed/catalogue-export.js';

const target = fileURLToPath(new URL('../../database/prisma/seed/catalogue.json', import.meta.url));
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, catalogueSeedJson(seed()));
console.log(`wrote ${target}`);

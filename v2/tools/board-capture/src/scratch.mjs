// Scratch copy of the frozen canvas project plus the runtime (runtime/README.md "Preview a board
// offline", steps 1–2). The frozen files are only read; the copy is checked byte for byte.
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';

import { HANDOFF_ROOT, PROJECT_ROOT, SUPPORT_JS } from './paths.mjs';

const PREFIX = 'xr-v46-board-capture-';

function files(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const digest = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

/**
 * Copies `canvas-v46/project` and `runtime/support.js` into a new temporary folder and proves the
 * copy is byte-identical to the frozen sources. Returns the folder and the number of files.
 */
export function prepareScratchCopy(parent = tmpdir()) {
  const scratch = mkdtempSync(join(parent, PREFIX));
  cpSync(PROJECT_ROOT, scratch, { recursive: true });
  cpSync(SUPPORT_JS, join(scratch, 'support.js'));
  const sources = files(PROJECT_ROOT);
  for (const source of sources) {
    const copy = join(scratch, relative(PROJECT_ROOT, source));
    if (digest(copy) !== digest(source)) throw new Error(`scratch copy differs: ${copy}`);
  }
  if (digest(join(scratch, 'support.js')) !== digest(SUPPORT_JS)) {
    throw new Error('scratch support.js differs from runtime/support.js');
  }
  return { scratch, fileCount: sources.length + 1 };
}

/**
 * The frozen handoff, re-checked before every capture run: every line of its `SHA256SUMS.txt`
 * (178) must match (the same check as `shasum -a 256 -c SHA256SUMS.txt`). Returns the count.
 */
export function verifyHandoff() {
  const lines = readFileSync(join(HANDOFF_ROOT, 'SHA256SUMS.txt'), 'utf8')
    .split('\n')
    .filter(Boolean);
  for (const line of lines) {
    const match = /^([0-9a-f]{64}) [ *](.+)$/.exec(line);
    if (!match) throw new Error(`SHA256SUMS.txt: unreadable line ${line}`);
    if (digest(join(HANDOFF_ROOT, match[2])) !== match[1]) {
      throw new Error(`frozen handoff file changed: ${match[2]} — STOP`);
    }
  }
  return lines.length;
}

/**
 * Removes scratch copies an interrupted run left in `parent` (older than an hour, so a suite
 * running at the same time keeps its own). Only folders with this tool's prefix are touched.
 */
export function removeStaleScratchCopies(parent = tmpdir()) {
  const removed = [];
  for (const entry of readdirSync(parent)) {
    if (!entry.startsWith(PREFIX)) continue;
    const path = join(parent, entry);
    if (Date.now() - statSync(path).mtimeMs < 3_600_000) continue;
    rmSync(path, { recursive: true, force: true });
    removed.push(entry);
  }
  return removed;
}

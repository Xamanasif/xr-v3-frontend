/**
 * Checksum verification equivalent to `shasum -a 256 -c SHA256SUMS.txt`, run from Node so
 * `pnpm verify` needs no platform tool. Used for the frozen handoff (`design/handoff-v46/`,
 * 178 files) and the audit evidence (`v2/docs/v46/`, 36 files).
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface ChecksumResult {
  readonly checked: number;
  readonly ok: number;
  readonly failed: readonly string[];
  readonly missing: readonly string[];
}

export function verifyChecksums(directory: string, sumsFile = 'SHA256SUMS.txt'): ChecksumResult {
  const lines = readFileSync(join(directory, sumsFile), 'utf8')
    .split('\n')
    .filter((line) => line.trim().length > 0);
  const failed: string[] = [];
  const missing: string[] = [];
  let ok = 0;
  for (const line of lines) {
    const match = /^([0-9a-f]{64}) [ *](.+)$/.exec(line);
    if (!match) throw new Error(`Not a SHA256SUMS line: ${line}`);
    const [, expected, file] = match as unknown as [string, string, string];
    const path = join(directory, file);
    if (!existsSync(path)) {
      missing.push(file);
      continue;
    }
    const actual = createHash('sha256').update(readFileSync(path)).digest('hex');
    if (actual === expected) ok += 1;
    else failed.push(file);
  }
  return { checked: lines.length, ok, failed, missing };
}

/**
 * Provenance of the v46 copies (ADR-0001 §1; Appendix E §2.2; Appendix F WP-0.5 acceptance 1):
 * the 8 stylesheets and 19 art SVGs under src/styles/v46/ are byte-identical to the frozen
 * handoff, checked against design/handoff-v46/SHA256SUMS.txt — the same list the repository's
 * 178/178 integrity check uses. A mutation check proves that a one-byte edit, a missing file and
 * an extra file each fail the verification.
 */
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';

import { afterAll, describe, expect, it } from 'vitest';

const COPIES = join(import.meta.dirname, 'v46');
const HANDOFF = join(import.meta.dirname, '..', '..', '..', '..', '..', 'design', 'handoff-v46');
const PREFIX = 'canvas-v46/project/';

/** The handoff lines for the stylesheets and the art, keyed by their path under v46/. */
function expectedCopies(sums: string): Map<string, string> {
  const expected = new Map<string, string>();
  for (const line of sums.split('\n')) {
    const match =
      /^([0-9a-f]{64}) [ *](canvas-v46\/project\/(?:xr-[a-z]+\.css|art\/[\w-]+\.svg))$/.exec(line);
    if (match?.[1] && match[2]) expected.set(match[2].slice(PREFIX.length), match[1]);
  }
  return expected;
}

function filesUnder(root: string, directory = root): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? filesUnder(root, path) : [relative(root, path)];
  });
}

interface Verification {
  readonly ok: readonly string[];
  readonly failed: readonly string[];
  readonly missing: readonly string[];
  readonly unexpected: readonly string[];
}

/** Verifies a copy directory against the handoff checksum list. */
function verifyCopies(directory: string, expected: Map<string, string>): Verification {
  const ok: string[] = [];
  const failed: string[] = [];
  const missing: string[] = [];
  for (const [file, sha] of expected) {
    const path = join(directory, file);
    if (!existsSync(path)) {
      missing.push(file);
      continue;
    }
    const actual = createHash('sha256').update(readFileSync(path)).digest('hex');
    (actual === sha ? ok : failed).push(file);
  }
  const present = filesUnder(directory).map((file) => file.split(sep).join('/'));
  const unexpected = present.filter((file) => !expected.has(file)).sort();
  return { ok, failed, missing, unexpected };
}

const expected = expectedCopies(readFileSync(join(HANDOFF, 'SHA256SUMS.txt'), 'utf8'));

describe('v46 stylesheet and art copies (byte-identical to design/handoff-v46)', () => {
  it('the handoff lists exactly 8 stylesheets and 19 SVGs', () => {
    const files = [...expected.keys()];
    expect(files.filter((file) => file.endsWith('.css')).sort()).toEqual([
      'xr-admin.css',
      'xr-assess.css',
      'xr-foundation.css',
      'xr-govern.css',
      'xr-learning.css',
      'xr-public.css',
      'xr-vendor.css',
      'xr-workspace.css',
    ]);
    expect(files.filter((file) => file.startsWith('art/') && file.endsWith('.svg'))).toHaveLength(
      19,
    );
    expect(expected.size).toBe(27);
  });

  it('every copy matches its SHA256SUMS.txt line, none is missing and nothing else is there', () => {
    const result = verifyCopies(COPIES, expected);
    expect(result).toEqual({ ok: [...expected.keys()], failed: [], missing: [], unexpected: [] });
  });

  it('the stylesheet hashes are the ones Appendix E §2.2 records', () => {
    const prefixes = Object.fromEntries(
      [...expected]
        .filter(([file]) => file.endsWith('.css'))
        .map(([f, sha]) => [f, sha.slice(0, 8)]),
    );
    expect(prefixes).toEqual({
      'xr-foundation.css': '32fb4cee',
      'xr-public.css': '28557b21',
      'xr-workspace.css': '6056f424',
      'xr-learning.css': '85fdba7e',
      'xr-assess.css': '41695cac',
      'xr-vendor.css': '2cb3e23a',
      'xr-govern.css': '87115c37',
      'xr-admin.css': '074f808f',
    });
  });

  it('every art file a stylesheet references (url("art/…")) is present and verified', () => {
    const css = [...expected.keys()]
      .filter((file) => file.endsWith('.css'))
      .map((file) => readFileSync(join(COPIES, file), 'utf8'))
      .join('\n');
    const referenced = [...new Set([...css.matchAll(/url\("(art\/[^"]+)"\)/g)].map((m) => m[1]))];
    expect(referenced.sort()).toEqual(
      [...expected.keys()].filter((file) => file.startsWith('art/')).sort(),
    );
  });
});

describe('mutation check: the verification fails on a changed, missing or extra file', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'xr-v46-provenance-'));
  afterAll(() => rmSync(scratch, { recursive: true, force: true }));

  function freshCopy(name: string): string {
    const directory = join(scratch, name);
    cpSync(COPIES, directory, { recursive: true });
    expect(verifyCopies(directory, expected).failed).toEqual([]);
    return directory;
  }

  function flipOneByte(path: string, offset: number): void {
    const bytes = readFileSync(path);
    bytes[offset] = (bytes[offset] ?? 0) ^ 0x01;
    writeFileSync(path, bytes);
  }

  it('one byte changed in a stylesheet', () => {
    const directory = freshCopy('css-byte');
    const path = join(directory, 'xr-govern.css');
    flipOneByte(path, Math.floor(readFileSync(path).length / 2));
    expect(verifyCopies(directory, expected)).toMatchObject({
      failed: ['xr-govern.css'],
      missing: [],
      unexpected: [],
    });
  });

  it('one byte changed in an SVG', () => {
    const directory = freshCopy('svg-byte');
    flipOneByte(join(directory, 'art', 'fmt-vr.svg'), 0);
    expect(verifyCopies(directory, expected).failed).toEqual(['art/fmt-vr.svg']);
  });

  it('a trailing newline added (what a formatter would do)', () => {
    const directory = freshCopy('newline');
    const path = join(directory, 'xr-admin.css');
    writeFileSync(path, `${readFileSync(path, 'utf8')}\n`);
    expect(verifyCopies(directory, expected).failed).toEqual(['xr-admin.css']);
  });

  it('a copy deleted, and an extra file added', () => {
    const directory = freshCopy('missing-extra');
    unlinkSync(join(directory, 'art', 'drum.svg'));
    writeFileSync(join(directory, 'xr-extra.css'), '.xr-x{}');
    expect(verifyCopies(directory, expected)).toMatchObject({
      failed: [],
      missing: ['art/drum.svg'],
      unexpected: ['xr-extra.css'],
    });
  });
});

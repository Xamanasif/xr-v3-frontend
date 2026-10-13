/**
 * WP-0.9 acceptance (6), (7) and the DV-2 half of (8), as static scans of this package:
 *  - (7) `@xr/domain` has no runtime dependencies — no workspace package, no zod, no React,
 *    Next.js or database code — and its source imports none of them (the ESLint boundary rule and
 *    `@xr/config`'s boundary matrix enforce the same from outside);
 *  - (6) no counting: nothing derives remaining or used licences; `Provided` figures pass through;
 *  - DV-2: no scoring function — the attempt and read-model code never reads an answer key.
 * The rejected Slice-1 vocabulary (licence counting, "demo" naming) is not carried (K-14).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import * as domain from './index.js';
import { counterIds, grant, ids, institution, plan, student, T, who } from './testing/fixtures.js';
import { giveAccess, withdrawGrant } from './access/decide.js';
import { NO_LICENCE_WAITS } from './access/model.js';
import { pauseInstitution, restoreInstitution } from './institution/decide.js';
import { provided } from './kernel/provided.js';

const PACKAGE = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(PACKAGE, 'src');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'testing' ? [] : sourceFiles(path);
    return name.endsWith('.ts') && !name.endsWith('.test.ts') ? [path] : [];
  });
}

/** The code of a file without comments, and with string literals blanked (scans read expressions). */
const code = (text: string) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"])\/\/.*$/gm, '$1')
    .replace(/'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`/g, "''");
const FILES = sourceFiles(SRC).map((path) => {
  const raw = readFileSync(path, 'utf8');
  return { path: relative(SRC, path), raw, text: code(raw) };
});
const imports = (text: string) =>
  [...text.matchAll(/^\s*(?:import|export)\b[^'"]*?from\s+'([^']+)'/gm)].map((match) => match[1]!);

describe('acceptance (7): framework-free, with zero runtime dependencies', () => {
  it('package.json declares no runtime, peer or optional dependencies, and no zod anywhere', () => {
    const manifest = JSON.parse(readFileSync(join(PACKAGE, 'package.json'), 'utf8')) as Record<
      string,
      unknown
    >;
    expect(manifest.dependencies ?? {}).toEqual({});
    expect(manifest.peerDependencies ?? {}).toEqual({});
    expect(manifest.optionalDependencies ?? {}).toEqual({});
    expect(JSON.stringify(manifest)).not.toMatch(/"zod"|react|next|prisma/i);
  });

  it('the source imports only its own modules — no package, no Node built-in', () => {
    expect(FILES.length).toBeGreaterThan(40);
    const outside = FILES.flatMap((file) =>
      imports(file.raw)
        .filter((specifier) => !specifier.startsWith('.'))
        .map((specifier) => `${file.path} → ${specifier}`),
    );
    expect(outside).toEqual([]);
  });

  it('no clock or randomness is read in the source (time comes from `now`, ids from an IdSource)', () => {
    const reads = FILES.filter((file) =>
      /Date\.now\(|new Date\(\)|Math\.random\(/.test(file.text),
    ).map((file) => file.path);
    expect(reads).toEqual([]);
  });
});

describe('acceptance (6): no counting — licence figures are provided, never derived', () => {
  it('no export derives remaining, used or available licences', () => {
    expect(
      Object.keys(domain).filter((name) =>
        /remaining|licen[cs]es?(Used|Left|Remaining|Available|InUse)|consum|allocat|seats?(Left|Used|Count)/i.test(
          name,
        ),
      ),
    ).toEqual([]);
  });

  it('no source does arithmetic on a licence figure', () => {
    const arithmetic = FILES.filter((file) =>
      /licen[cs]es\s*[-+*/]|[-+*/]\s*[\w.]*licen[cs]es\b/i.test(file.text),
    ).map((file) => file.path);
    expect(arithmetic).toEqual([]);
  });

  it('Provided figures pass through every write unchanged (give, withdraw, pause, restore)', () => {
    const odd = plan({ licences: provided(37) });
    const given = giveAccess({
      institution: institution(),
      plan: odd,
      experimentIds: [ids.shell],
      target: { kind: 'students', students: [student()] },
      grants: [],
      licences: NO_LICENCE_WAITS,
      actor: who.instituteAdmin,
      now: T.oct14,
      ids: counterIds(),
    });
    expect(given.ok && given.value.plan.licences).toBe(37);
    const withdrawn = withdrawGrant({
      grant: grant(),
      institution: institution(),
      plan: odd,
      student: student(),
      reason: 'Moved course',
      actor: who.instituteAdmin,
      now: T.oct14,
      ids: counterIds(),
    });
    expect(withdrawn.ok && withdrawn.value.plan.licences).toBe(37);
    const paused = pauseInstitution({
      institution: institution(),
      plans: [odd],
      reason: 'x',
      actor: who.superAdmin,
      now: T.oct12,
      ids: counterIds(),
    });
    expect(paused.ok && paused.value.plans[0]!.licences).toBe(37);
    const restored = paused.ok
      ? restoreInstitution({
          institution: paused.value.institution,
          plans: paused.value.plans,
          reason: 'x',
          actor: who.superAdmin,
          now: T.oct14,
          ids: counterIds(),
        })
      : null;
    expect(restored?.ok && restored.value.plans[0]!.licences).toBe(37);
  });
});

describe('DV-2 (Phase-0 interim): objective marks only from supplied values — no scoring function', () => {
  it('only question authoring reads an answer key; attempts, results and read models never do', () => {
    const readers = FILES.filter((file) => /\.correct\b/.test(file.text)).map((file) => file.path);
    expect(readers).toEqual(['assessment/question-bank.ts']);
  });

  it('nothing exported scores, grades or auto-marks', () => {
    expect(
      Object.keys(domain).filter((name) => /score|grade|autoMark|autoReview/i.test(name)),
    ).toEqual([]);
  });
});

describe('K-14: the rejected Slice-1 behaviour is not carried', () => {
  it('no export or source identifier carries "demo" naming or licence counting', () => {
    expect(Object.keys(domain).filter((name) => /demo|stand[-_]?in(?!g)/i.test(name))).toEqual([]);
    const identifiers = FILES.filter((file) =>
      /\b(?:const|function|let|type|interface)\s+\w*(?:Demo|demo|LicenceCount|licenceCount|seatCount)\w*/.test(
        file.text,
      ),
    ).map((file) => file.path);
    expect(identifiers).toEqual([]);
  });

  it('the runtime fold stays off the package root (ADR-0006)', () => {
    expect(Object.keys(domain)).not.toContain('deriveSimulationUtilisation');
    expect(Object.keys(domain)).not.toContain('newInstitution');
    expect(Object.keys(domain)).not.toContain('newAccessPlan');
  });
});

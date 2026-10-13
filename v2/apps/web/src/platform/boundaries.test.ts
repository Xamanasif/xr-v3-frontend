/**
 * The platform's import boundaries, read from the source (Appendix F §3.8; ADR-0002 §5;
 * ADR-0007 §2). The ESLint fences enforce them file by file; this checks the whole app at once:
 *
 * - only `composition.ts` imports `@xr/sample-platform`, and only its root export;
 * - only `test-hook-bridge.ts` imports `@xr/sample-platform/testing`, and no product file
 *   imports the bridge — it is reached only through the build-time alias;
 * - the platform and query layers take record vocabulary from `@xr/domain`, never a decision,
 *   policy or derivation: the adapter decides, the app passes inputs and renders answers;
 * - no product file names the test-hook flag (next.config.ts reads it, outside `src/`).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

import * as stub from './test-hooks';

const appRoot = join(import.meta.dirname, '..', '..');
const srcRoot = join(appRoot, 'src');

function files(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? files(path) : /\.tsx?$/.test(entry) ? [path] : [];
  });
}

const isTest = (path: string) =>
  /\.(test|spec)\.tsx?$/.test(path) || path.includes(`${join('src', 'test-support')}`);

const product = files(srcRoot)
  .filter((path) => !isTest(path))
  .map((path) => ({
    file: relative(appRoot, path).split('\\').join('/'),
    source: readFileSync(path, 'utf8'),
  }));

interface Import {
  readonly specifier: string;
  readonly typeOnly: boolean;
  readonly names: readonly string[];
}

function importsOf(source: string): Import[] {
  const found: Import[] = [];
  const statement =
    /(?:^|\n)\s*(import|export)\s+(type\s+)?(?:([^'";]*?)\s+from\s+)?['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(statement)) {
    const clause = match[3] ?? '';
    const names = [
      ...clause.matchAll(/(?:^|[{,\s])(type\s+)?([A-Za-z_$][\w$]*)(?=\s*(?:,|}|$|\s+as\s))/g),
    ]
      .filter((name) => !name[1])
      .map((name) => name[2]!)
      .filter((name) => name !== 'type');
    found.push({ specifier: match[4]!, typeOnly: Boolean(match[2]), names });
  }
  for (const match of source.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    found.push({ specifier: match[1]!, typeOnly: false, names: [] });
  }
  return found;
}

/** The source without comments (doc comments name storage APIs to say they are not used). */
const code = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

const importers = (test: (specifier: string) => boolean) =>
  product
    .filter(({ source }) => importsOf(source).some(({ specifier }) => test(specifier)))
    .map(({ file }) => file)
    .sort();

describe('apps/web import boundaries', () => {
  it('scans the product source', () => {
    expect(product.map(({ file }) => file)).toEqual(
      expect.arrayContaining([
        'src/platform/composition.ts',
        'src/platform/runtime.ts',
        'src/platform/test-hook-bridge.ts',
        'src/queries/use-command.ts',
        'src/app/providers.tsx',
      ]),
    );
  });

  it('only the composition root imports @xr/sample-platform, and only its root export', () => {
    expect(importers((specifier) => specifier === '@xr/sample-platform')).toEqual([
      'src/platform/composition.ts',
    ]);
  });

  it('only the test-hook bridge imports @xr/sample-platform/testing (or any other subpath)', () => {
    expect(importers((specifier) => specifier.startsWith('@xr/sample-platform/'))).toEqual([
      'src/platform/test-hook-bridge.ts',
    ]);
  });

  it('no product file imports the bridge: it is reached only through the build-time alias', () => {
    expect(importers((specifier) => /test-hook-bridge$/.test(specifier))).toEqual([]);
    expect(importers((specifier) => specifier === '@/platform/test-hooks')).toEqual([
      'src/platform/runtime.ts',
    ]);
  });

  it('the stub product builds compile exports no hook', () => {
    expect(stub.testHooks).toBeNull();
    expect(Object.keys(stub)).toEqual(['testHooks']);
  });

  it('the platform and query layers take only record vocabulary from @xr/domain', () => {
    const values = product
      .filter(({ file }) => /^src\/(platform|queries)\//.test(file))
      .flatMap(({ file, source }) =>
        importsOf(source)
          .filter(({ specifier, typeOnly }) => specifier === '@xr/domain' && !typeOnly)
          .flatMap(({ names }) => names.map((name) => `${file}: ${name}`)),
      );
    expect(values).toEqual(['src/queries/keys.ts: RECORD_KINDS']);
  });

  it('no product file names the test-hook flag or the seam globals outside the bridge', () => {
    const named = product
      .filter(({ source }) => /NEXT_PUBLIC_XR_TEST_HOOKS/.test(source))
      .map(({ file }) => file);
    expect(named).toEqual([]);
    const seams = product
      .filter(({ source }) => /__XR_TEST_(BOOT|HOOKS)__/.test(source))
      .map(({ file }) => file);
    expect(seams).toEqual(['src/platform/test-hook-bridge.ts']);
  });

  it('no product file reads or writes browser storage for the world or the session', () => {
    const storage = product
      .filter(({ source }) =>
        /localStorage|indexedDB|document\.cookie|sessionStorage/.test(code(source)),
      )
      .map(({ file }) => file);
    // runtime.ts hands `sessionStorage` to the adapter for the two board-drawn browser-session
    // items only (ADR-0004 §2: the selection basket and the request tickets).
    expect(storage).toEqual(['src/platform/runtime.ts']);
    const runtime = code(product.find(({ file }) => file === 'src/platform/runtime.ts')!.source);
    expect(runtime.match(/sessionStorage/g)).toEqual(['sessionStorage']);
    expect(runtime).not.toMatch(/localStorage|indexedDB|document\.cookie/);
  });
});

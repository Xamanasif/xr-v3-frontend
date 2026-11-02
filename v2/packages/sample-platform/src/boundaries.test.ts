/**
 * Package boundaries (WP-0.11 acceptance 6, 7; Appendix F §3.8; ADR-0004, ADR-0007): the package
 * depends only on the contracts, the domain and the validation primitives; its source reads no
 * clock, no random source, no browser storage and no Node API; and the root export — the only
 * one product code may import — never reaches the stand-ins, the test seams or the fixtures.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const PACKAGE = resolve(import.meta.dirname, '..');
const SRC = join(PACKAGE, 'src');

function files(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const SOURCE = files(SRC).filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'));
const rel = (file: string) => relative(SRC, file).split('\\').join('/');

/** Source text without comments: the scans read code, not the documentation about it. */
function code(file: string): string {
  return readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:'"\\])\/\/.*$/gm, '$1');
}

interface ImportLine {
  readonly specifier: string;
  readonly typeOnly: boolean;
}

function importsOf(text: string): ImportLine[] {
  const found: ImportLine[] = [];
  const pattern = /^(import|export)\s+(type\s+)?([^;]*?)\s+from\s+'([^']+)';/gms;
  for (const match of text.matchAll(pattern)) {
    found.push({ specifier: match[4]!, typeOnly: Boolean(match[2]) });
  }
  return found;
}

/** Files reachable at run time from an entry (type-only imports carry no code). */
function runtimeGraph(entry: string): { files: Set<string>; external: Set<string> } {
  const seen = new Set<string>();
  const external = new Set<string>();
  const visit = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    for (const line of importsOf(readFileSync(file, 'utf8'))) {
      if (line.typeOnly) continue;
      if (!line.specifier.startsWith('.')) {
        external.add(line.specifier);
        continue;
      }
      visit(resolve(dirname(file), line.specifier.replace(/\.js$/, '.ts')));
    }
  };
  visit(entry);
  return { files: new Set([...seen].map(rel)), external };
}

describe('dependencies', () => {
  it('depends only on @xr/contracts, @xr/domain and @xr/validation', () => {
    const manifest = JSON.parse(readFileSync(join(PACKAGE, 'package.json'), 'utf8')) as {
      dependencies: Record<string, string>;
      exports: Record<string, unknown>;
    };
    expect(Object.keys(manifest.dependencies).sort()).toEqual([
      '@xr/contracts',
      '@xr/domain',
      '@xr/validation',
    ]);
    expect(Object.keys(manifest.exports)).toEqual(['.', './testing']);
    const external = new Set(
      SOURCE.flatMap((file) =>
        importsOf(readFileSync(file, 'utf8'))
          .map((line) => line.specifier)
          .filter((specifier) => !specifier.startsWith('.')),
      ),
    );
    for (const specifier of external)
      expect(specifier, specifier).toMatch(/^@xr\/(contracts|domain|validation)(\/|$)/);
  });
});

describe('determinism and persistence (no clock, no random source, no browser storage)', () => {
  const BANNED: readonly [RegExp, string][] = [
    [/Math\.random/, 'Math.random'],
    [/Date\.now/, 'Date.now'],
    [/new Date\(\s*\)/, 'new Date() without an instant'],
    [/performance\.now/, 'performance.now'],
    [/crypto\.(randomUUID|getRandomValues)/, 'crypto randomness'],
    // TE-6 (owner authorisation of Phase 7): the composition root injects the storage and the lock.
    [/\blocalStorage\b/, 'localStorage itself (TE-6 storage is injected)'],
    [/\bindexedDB\b/, 'IndexedDB'],
    [/\bBroadcastChannel\b/, 'a cross-tab channel itself (the composition root listens)'],
    [/navigator\.locks/, 'Web Locks itself (TE-6 lock is injected)'],
    [/\bprocess\.|\bwindow\.|\bdocument\.|globalThis\./, 'a runtime global'],
    [/from 'node:|require\(/, 'a Node API'],
    [/\bfetch\(|XMLHttpRequest|WebSocket/, 'a network request'],
  ];

  for (const [pattern, what] of BANNED) {
    it(`never uses ${what}`, () => {
      const hits = SOURCE.filter((file) => pattern.test(code(file))).map(rel);
      expect(hits).toEqual([]);
    });
  }

  it('keeps the memory driver (ADR-0004 option A) and the TE-6 browser snapshot, nothing else — the requester’s tickets kept beside it are the snapshot’s (ADR-0009 amendment)', () => {
    const memory = readFileSync(join(SRC, 'persistence', 'memory.ts'), 'utf8');
    expect(memory).toMatch(/kind: 'memory'/);
    const snapshot = readFileSync(join(SRC, 'persistence', 'snapshot.ts'), 'utf8');
    expect(snapshot).toMatch(/kind: 'browser-snapshot'/);
    expect(files(join(SRC, 'persistence')).map(rel).sort()).toEqual([
      'persistence/kept-tickets.ts',
      'persistence/memory.ts',
      'persistence/snapshot.ts',
      'persistence/withheld.ts',
    ]);
    // Only the snapshot driver opens the kept tickets (on the storage it was given); a browser
    // session reaches only the keeper it is handed.
    expect(
      SOURCE.filter((file) => /\bkeptTickets\(|\bdropForeignTickets\(/.test(code(file))).map(rel),
    ).toEqual(['persistence/kept-tickets.ts', 'persistence/snapshot.ts']);
  });
});

describe('the root export stays product-safe (Appendix F §3.8; ADR-0007)', () => {
  const root = runtimeGraph(join(SRC, 'index.ts'));

  it('never reaches the stand-ins, the test seams, the walk or the fixtures', () => {
    expect(
      [...root.files].filter((file) => file.startsWith('testing/') || file.startsWith('standins/')),
    ).toEqual([]);
  });

  it('imports no stand-in or contract-suite code at run time', () => {
    for (const specifier of root.external) {
      expect(specifier).not.toMatch(/standins|contract-suite/);
    }
  });

  it('keeps the testing marker in the testing entry only', () => {
    const marked = SOURCE.filter((file) =>
      readFileSync(file, 'utf8').includes("'xr-sample-platform-testing'"),
    ).map(rel);
    expect(marked).toEqual(['testing/index.ts']);
  });

  it('offers no sample control, role switcher or clock control from the root export', () => {
    const exported = readFileSync(join(SRC, 'index.ts'), 'utf8');
    for (const name of [
      'setSampleNow',
      'asPerson',
      'faults',
      'seamsOf',
      'createStandins',
      'internalsOf',
      'afterFlow',
    ]) {
      expect(exported).not.toContain(name);
    }
  });
});

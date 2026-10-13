import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { expect, test } from '@playwright/test';

import { bootWorld, TEST_HOOKS_GLOBAL } from '../support';

/**
 * WP-0.12 acceptance (3), on the BUILT output (TE-7; ADR-0007 §2; Appendix F §3.2): a build made
 * without the test-hook flag contains no test-hook code — the build-time alias resolved the
 * bridge to the empty stub — and none of the seam names, the flag's name or the test-only
 * exports appears in any emitted file. The dedicated test-hook build is the positive control:
 * the same scan finds the bridge there, so an empty result means "absent", not "not looked at".
 */
test.skip(
  ({ viewport }) => viewport?.width !== 1440,
  'Reads built files: the viewport does not matter, one project proves it.',
);

// apps/web is not an ES module package: Playwright loads its suites as CommonJS.
const appRoot = join(__dirname, '..', '..');

/** Names that exist only in the bridge, the test seams and the flag (with verify's sentinels). */
const SENTINELS = [
  'xr-web-test-hook-bridge',
  '__XR_TEST_BOOT__',
  '__XR_TEST_HOOKS__',
  'NEXT_PUBLIC_XR_TEST_HOOKS',
  'xr-sample-platform-testing',
];
/** Test-only code of `@xr/sample-platform/testing`: fixture names and seam functions. */
const TESTING_FINGERPRINTS = ['after-flow-a', 'state-coverage', 'supplyObjectiveMarks'];

function builtFiles(distDir: string, subPath = ''): string[] {
  const walk = (directory: string): string[] =>
    !existsSync(directory)
      ? []
      : readdirSync(directory).flatMap((entry) => {
          if (entry === 'cache') return [];
          const path = join(directory, entry);
          return statSync(path).isDirectory()
            ? walk(path)
            : /\.(?:js|html|json|rsc|txt)$/.test(entry)
              ? [path]
              : [];
        });
  return walk(join(appRoot, distDir, subPath));
}

function hits(files: readonly string[], needles: readonly string[]): string[] {
  return files.flatMap((file) => {
    const text = readFileSync(file, 'utf8');
    return needles
      .filter((needle) => text.includes(needle))
      .map((needle) => `${relative(appRoot, file)}: ${needle}`);
  });
}

test('the product build (.next): no emitted file carries the bridge, a test seam or the flag', () => {
  const files = builtFiles('.next');
  const clientChunks = builtFiles('.next', 'static');
  expect(clientChunks.filter((file) => file.endsWith('.js')).length).toBeGreaterThan(0);
  expect(hits(files, SENTINELS)).toEqual([]);
  expect(hits(files, TESTING_FINGERPRINTS)).toEqual([]);
  // The scan reads the chunks that ship the platform: the sample adapter itself is there.
  expect(hits(clientChunks, ['spine-start']).length).toBeGreaterThan(0);
});

test('the dedicated test-hook build (.next-test-hooks) carries the bridge in a client chunk (positive control)', () => {
  const clientChunks = builtFiles('.next-test-hooks', 'static');
  expect(clientChunks.length).toBeGreaterThan(0);
  const found = hits(clientChunks, [...SENTINELS.slice(0, 3), ...TESTING_FINGERPRINTS]);
  for (const needle of [...SENTINELS.slice(0, 3), ...TESTING_FINGERPRINTS]) {
    expect(
      found.some((hit) => hit.endsWith(`: ${needle}`)),
      needle,
    ).toBe(true);
  }
  // The chunk that holds the bridge exists only in the test-hook build's own folder.
  const bridgeChunks = found
    .filter((hit) => hit.endsWith(': xr-web-test-hook-bridge'))
    .map((hit) => hit.slice(0, hit.indexOf(':')));
  expect(bridgeChunks.length).toBeGreaterThan(0);
  for (const chunk of bridgeChunks) {
    expect(chunk.startsWith('.next-test-hooks/')).toBe(true);
    expect(existsSync(join(appRoot, chunk.replace(/^\.next-test-hooks\//, '.next/')))).toBe(false);
  }
});

test('a product page exposes no hook at run time, even with a boot descriptor installed', async ({
  page,
}) => {
  await bootWorld(page, { fixture: 'state-coverage', session: { personId: 'sa-arjun-mehta' } });
  const response = await page.goto('/admin');
  expect(response?.status()).toBe(404);
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate((key) => key in window, TEST_HOOKS_GLOBAL)).toBe(false);
  const scripts = await page.evaluate(() =>
    [...document.scripts].map((script) => script.src || script.textContent || ''),
  );
  expect(scripts.join('\n')).not.toContain('xr-web-test-hook-bridge');
});

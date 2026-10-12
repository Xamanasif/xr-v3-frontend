/**
 * Which files the static scans read. Product code is what ships in a hosted build; tests,
 * test support and test seams are not product code (they are covered by their own checks).
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import type { ScanTarget } from './rules.js';

/** `v2/` — the workspace root. */
export const workspaceRoot = join(import.meta.dirname, '..', '..', '..', '..');
/** The repository root (holds `design/handoff-v46/`). */
export const repositoryRoot = join(workspaceRoot, '..');

/**
 * Product source roots (workspace-relative). Roots that do not exist yet are reported as
 * "not present" rather than counted as scanned: `@xr/sample-platform` arrives in WP-0.11 and
 * is product-reachable (the mock data layer ships in hosted builds), so it is scanned from
 * the moment it exists.
 */
export const PRODUCT_ROOTS = [
  'apps/web/src',
  'packages/ui/src',
  'packages/domain/src',
  'packages/contracts/src',
  'packages/validation/src',
  'packages/sample-platform/src',
] as const;

/** Single product files outside the source roots. */
export const PRODUCT_FILES = ['apps/web/next.config.ts'] as const;

/**
 * Byte-identical copies of the frozen v46 stylesheets and art (Appendix F §3.4, WP-0.5). They
 * are checked by checksum against `design/handoff-v46/`, never edited, and carry the canvas
 * selectors of the boards (`.doc-*`, `.b1-*`, `.is-shown`, …) — inert in the product because
 * no component may emit those classes (`xr/no-canvas-classes`, `xr/v46-class-names`).
 */
export const VERBATIM_V46_COPIES = /^packages\/ui\/src\/styles\/v46\//;

/** Test files, test support and test seams: not shipped to hosted builds. */
export const NOT_PRODUCT = [
  /\.test\.tsx?$/,
  /\.spec\.tsx?$/,
  /\/test-support\//,
  /\/testing\//,
  /\/__fixtures__\//,
  /\.d\.ts$/,
];

const SKIPPED_DIRECTORIES = new Set([
  'node_modules',
  '.next',
  'dist',
  '.turbo',
  'coverage',
  'playwright-report',
  'test-results',
  'generated',
]);

const SCANNED_EXTENSIONS = /\.(?:tsx?|css)$/;

export function walk(directory: string): string[] {
  if (!existsSync(directory)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(directory)) {
    if (SKIPPED_DIRECTORIES.has(entry) || entry.startsWith('.')) continue;
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files.sort();
}

export const toWorkspacePath = (absolute: string): string =>
  relative(workspaceRoot, absolute).split(sep).join('/');

/** One scan target per product file, classified for the copy and styling rules. */
export function productTargets(): { targets: ScanTarget[]; missingRoots: string[] } {
  const missingRoots = PRODUCT_ROOTS.filter((root) => !existsSync(join(workspaceRoot, root)));
  const paths = [
    ...PRODUCT_ROOTS.flatMap((root) => walk(join(workspaceRoot, root))),
    ...PRODUCT_FILES.map((file) => join(workspaceRoot, file)).filter((file) => existsSync(file)),
  ]
    .map(toWorkspacePath)
    .filter(isScannedProductFile);
  const targets = paths.map((file) =>
    toTarget(file, readFileSync(join(workspaceRoot, file), 'utf8')),
  );
  return { targets, missingRoots };
}

/** Is a workspace-relative path product code the static scans read? */
export function isScannedProductFile(file: string): boolean {
  return (
    SCANNED_EXTENSIONS.test(file) &&
    !VERBATIM_V46_COPIES.test(file) &&
    !NOT_PRODUCT.some((pattern) => pattern.test(file))
  );
}

export function toTarget(file: string, source: string): ScanTarget {
  const copyModule = file.startsWith('apps/web/src/copy/') && file.endsWith('.ts');
  return {
    file,
    source,
    copy:
      copyModule ||
      (file.endsWith('.tsx') &&
        (file.startsWith('apps/web/src/') || file.startsWith('packages/ui/src/'))),
    copyModule,
    adminOrReviewer: /^apps\/web\/src\/features\/(?:admin|reviewer)\//.test(file),
    webApp: file.startsWith('apps/web/'),
  };
}

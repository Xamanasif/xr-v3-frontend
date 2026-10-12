/**
 * Every static-scan rule proven on synthetic input: it reports the violation it exists for
 * and stays quiet on the drawn wording it must allow (Appendix F §7.6; B8-03).
 */
import { describe, expect, it } from 'vitest';

import { PRODUCT_SCAN_RULE_IDS, scanIdentityAddresses, scanProductFile } from './rules.js';
import { isScannedProductFile, toTarget } from './workspace.js';

const rulesIn = (file: string, source: string) =>
  [...new Set(scanProductFile(toTarget(file, source)).map((finding) => finding.rule))].sort();

const view = 'apps/web/src/features/shared/xs-07-help/view.tsx';
const uiFile = 'packages/ui/src/foundation/notice.tsx';
const domainFile = 'packages/domain/src/access/grant.ts';
const copyModule = 'apps/web/src/copy/status/request.ts';

describe('owner constraints: no developer, demo or identity-choosing surface', () => {
  it.each([
    ['<div className="xr-notice">DEMO — sample data</div>', 'demo-wording'],
    ['export const DemoBar = () => null;', 'demo-wording'],
    ['<label>Viewing as</label>', 'viewing-as'],
    ['<button>Switch account</button>', 'switch-identity'],
    ['export function RoleSwitcher() { return null; }', 'identity-selector'],
    ['const sampleAccounts = [];', 'sample-accounts'],
    ['<h1>Choose a workspace</h1>', 'workspace-chooser'],
    ['<p>Sign in as another person</p>', 'sign-in-as'],
    ['export const impersonate = () => null;', 'impersonation'],
    ['<aside aria-label="Developer tools" />', 'developer-controls'],
    ['const testUsers = [];', 'test-identities'],
  ])('%s → %s', (source, rule) => {
    expect(rulesIn(view, source)).toContain(rule);
  });

  it('allows "demonstrate", "Signed in" and comments that explain the rule', () => {
    expect(
      rulesIn(
        view,
        '// No DEMO banner, no "Viewing as" (owner constraint)\n<p>This experiment demonstrates conduction. Signed in to the Student workspace.</p>',
      ),
    ).toEqual([]);
  });
});

describe('canvas leakage', () => {
  it.each([
    ['<div className="b1-frame" />', 'canvas-class'],
    ['<span className="doc-tag" />', 'canvas-class'],
    ['<p>Board control — not part of the product.</p>', 'board-control'],
    ['<button>Restart</button>', 'restart-control'],
    ['<p>Reload the board to start again</p>', 'reload-the-board'],
    ['<button>Sample: REQ-0039</button>', 'sample-switch'],
    ['<span>(sample file)</span>', 'sample-labels'],
    ["const script = 'runtime/support.js';", 'canvas-runtime'],
    ['const sri = window.__resources;', 'canvas-runtime'],
  ])('%s → %s', (source, rule) => {
    expect(rulesIn(view, source)).toContain(rule);
  });

  it('finds canvas classes in product CSS, but not in url() arguments', () => {
    expect(rulesIn('packages/ui/src/styles/product.css', '.b1-frame { height: auto; }')).toEqual([
      'canvas-class',
    ]);
    expect(
      rulesIn(
        'packages/ui/src/styles/product.css',
        '.xr-x-sort { background: url("art/b1-frame.svg"); }',
      ),
    ).toEqual([]);
  });
});

describe('the rejected Slice-1 work', () => {
  it.each([
    ["return refuse('no-place-remaining');", 'no-place-remaining'],
    ['const placesAfter = placesBefore - 1;', 'licence-counting'],
    ['<p>3 learner places left</p>', 'licence-counting'],
    ['export function PlacesMeter() { return null; }', 'slice1-components'],
    ["import { FormatLegend } from './format-legend';", 'slice1-components'],
    ["const route = '/(connected)/learn';", 'slice1-routes'],
  ])('%s → %s', (source, rule) => {
    expect(rulesIn(view, source)).toContain(rule);
  });

  it('refuses a Campus entity in code but allows the drawn copy "Hyderabad Campus" (B1-11)', () => {
    expect(rulesIn(domainFile, 'export interface Campus { id: string }')).toEqual([
      'campus-entity',
    ]);
    expect(rulesIn(view, '<dd>BITS Pilani — Hyderabad Campus</dd>')).toEqual([]);
  });
});

describe('B8-03 policy words in copy', () => {
  it.each([
    ['<p>Publishing gives every institution access.</p>', 'publish-grants-access'],
    ['<p>Release grants access to the update.</p>', 'publish-grants-access'],
    ['<button>Decline</button>', 'decline-reject'],
    ['<p>Rejected by the reviewer</p>', 'decline-reject'],
    ['<p>Overall progress</p>', 'aggregate-progress'],
    ['<p>80% complete</p>', 'aggregate-progress'],
    ['<p>Experiment completed</p>', 'aggregate-progress'],
    ['<p>The device was shipped</p>', 'shipping-words'],
    ['<p>Tenant Admin</p>', 'role-name-variants'],
    ['<p>Learner</p>', 'role-name-variants'],
    ['<p>Instructor</p>', 'role-name-variants'],
    ['<p>Your license</p>', 'us-license'],
    ['<label>Email</label>', 'email-spelling'],
    ['<p>Ends 31/10/2026</p>', 'numeric-date'],
    ['<p>Ends 2026-10-31</p>', 'numeric-date'],
    ['<p>MEZG523</p>', 'course-code-space'],
    ['<p>Tenant provisioned</p>', 'internal-jargon'],
    ['<p>Academic quality assured</p>', 'academic-quality'],
  ])('%s → %s', (source, rule) => {
    expect(rulesIn(view, source)).toContain(rule);
  });

  it('allows the drawn wording these rules must not touch', () => {
    const drawn = [
      '<p>Publishing gives no one access</p>', // B6-07
      '<p>Nothing here changes any institution’s access</p>', // B7-05
      '<dd>Pass mark 50%</dd>', // B4-11
      '<td>A licensed format</td>', // B2-02
      '<label htmlFor="g-email">E-mail</label>', // B1-09
      '<input type="email" autoComplete="username" />', // B1-09
      '<p>Ends 31 Oct 2026</p>', // B8-03
      '<p>ME ZG523</p>', // B8-03
      '<p>Institute Admin · Academic Reviewer · Super Admin</p>', // BC1
    ];
    for (const source of drawn) expect(rulesIn(view, source), source).toEqual([]);
  });

  it('reads every string of a copy module, but only rendered text elsewhere', () => {
    expect(rulesIn(copyModule, "export const label = 'Rejected';")).toEqual(['decline-reject']);
    expect(rulesIn(copyModule, "export const field = 'email';")).toEqual(['email-spelling']);
    expect(rulesIn(domainFile, "export const STATUS = 'rejected';")).toEqual([]);
  });

  it('refuses a Publish control only on Super Admin and Reviewer screens', () => {
    expect(
      rulesIn('apps/web/src/features/admin/sa-11-release/view.tsx', '<button>Publish</button>'),
    ).toEqual(['publish-on-sa-or-reviewer']);
    expect(
      rulesIn(
        'apps/web/src/features/content-manager/cm-03-publish/view.tsx',
        '<button>Publish</button>',
      ),
    ).toEqual([]);
  });
});

describe('raw styling outside the approved boundaries (ADR-0001)', () => {
  it.each([
    ['<div className="md:flex" />', 'tailwind-viewport-breakpoint'],
    ['<div className="bg-[#12173F]" />', 'tailwind-arbitrary-colour'],
    ['<div className="text-blue-600" />', 'tailwind-default-palette'],
    ['<div className="hover:bg-slate-100" />', 'tailwind-default-palette'],
    ['<div className="text-sm shadow-lg" />', 'tailwind-type-scale-or-shadow'],
    ['<div style={{ marginTop: 8 }} />', 'inline-style'],
    ["import { Public_Sans } from 'next/font/google';", 'next-font'],
    ["import logo from '../../../../branding/bits-pilani-wilp-logo.png';", 'branding-import'],
    ["import * as brand from '../../../../branding';", 'branding-import'],
    ["import { logo } from '@/branding';", 'branding-import'],
    [
      "import board from '../../../design/handoff-v46/runtime/support.js';",
      'frozen-handoff-import',
    ],
  ])('%s → %s', (source, rule) => {
    expect(rulesIn('apps/web/src/app/page.tsx', source)).toContain(rule);
  });

  it('allows the v46 colour tokens that share a Tailwind hue name, and nothing else of that hue', () => {
    const file = 'apps/web/src/app/page.tsx';
    expect(
      rulesIn(
        file,
        '<div className="text-indigo-600 bg-indigo-100 border-cyan-700 bg-cyan-50/50" />',
      ),
    ).toEqual([]);
    expect(rulesIn(file, '<div className="text-indigo-700" />')).toEqual([
      'tailwind-default-palette',
    ]);
    expect(rulesIn(file, '<div className="bg-cyan-500" />')).toEqual(['tailwind-default-palette']);
  });

  it('allows layout-only composition utilities in the web app (ADR-0001 option A)', () => {
    expect(
      rulesIn('apps/web/src/app/page.tsx', '<div className="flex gap-4 min-h-screen" />'),
    ).toEqual([]);
  });

  it('finds Preflight and viewport breakpoints in product CSS, not container queries', () => {
    const css = 'apps/web/src/app/globals.css';
    expect(rulesIn(css, "@import 'tailwindcss';")).toEqual(['tailwind-preflight']);
    expect(rulesIn(css, "@import 'tailwindcss/preflight.css';")).toEqual(['tailwind-preflight']);
    expect(rulesIn(css, "@import 'tailwindcss/utilities.css' layer(utilities);")).toEqual([]);
    expect(rulesIn(css, '@media (min-width: 768px) { .a { gap: 0; } }')).toEqual([
      'viewport-breakpoint-css',
    ]);
    expect(
      rulesIn(css, '@media (prefers-reduced-motion: reduce) { * { animation: none; } }'),
    ).toEqual([]);
    expect(rulesIn(css, '@container xr-content (min-width: 760px) { .a { gap: 0; } }')).toEqual([]);
  });
});

describe('which files are scanned as product code', () => {
  it('skips tests, test support, test seams and the verbatim v46 copies', () => {
    expect(isScannedProductFile('apps/web/src/app/layout.tsx')).toBe(true);
    expect(isScannedProductFile('packages/ui/src/styles/product.css')).toBe(true);
    expect(isScannedProductFile('apps/web/src/lib/forms.test.tsx')).toBe(false);
    expect(isScannedProductFile('apps/web/src/test-support/render-screen.tsx')).toBe(false);
    expect(isScannedProductFile('packages/sample-platform/src/testing/build-world.ts')).toBe(false);
    // Byte-identical copies of the frozen sheets carry board selectors and may never change.
    expect(isScannedProductFile('packages/ui/src/styles/v46/xr-foundation.css')).toBe(false);
  });
});

describe('test seams stay out of product code', () => {
  it.each([
    ["const descriptor = window['__XR_TEST_BOOT__'];", 'test-seam-globals'],
    ["const hooks = '__XR_TEST_HOOKS__';", 'test-seam-globals'],
    ["const name = 'NEXT_PUBLIC_XR_TEST_HOOKS';", 'test-hooks-flag'],
    ["router.push('/student?as=PER-0001');", 'identity-query-parameter'],
  ])('%s → %s', (source, rule) => {
    expect(rulesIn(view, source)).toContain(rule);
  });

  it('allows the seam names only in their designated places (TE-7; Appendix F §3.8)', () => {
    const flag = 'export const hooks = process.env.NEXT_PUBLIC_XR_TEST_HOOKS;';
    const boot = "export const read = () => window['__XR_TEST_BOOT__'];";
    expect(rulesIn('apps/web/next.config.ts', flag)).toEqual([]);
    expect(rulesIn('apps/web/src/lib/env.ts', flag)).toEqual([]);
    expect(rulesIn('apps/web/src/platform/test-hook-bridge.ts', boot)).toEqual([]);
    expect(rulesIn('apps/web/src/platform/platform-provider.ts', flag)).toEqual([
      'test-hooks-flag',
    ]);
    expect(rulesIn('apps/web/src/platform/platform-provider.ts', boot)).toEqual([
      'test-seam-globals',
    ]);
  });

  it('checks test support for identity chosen through an address', () => {
    expect(
      scanIdentityAddresses(
        'apps/web/e2e/support/x.ts',
        "await page.goto('/admin?role=super_admin');",
      ),
    ).toHaveLength(1);
    expect(
      scanIdentityAddresses(
        'apps/web/e2e/support/x.ts',
        "await page.goto('/student/help?tab=reports');",
      ),
    ).toEqual([]);
  });
});

it('reports no rule twice and covers every rule in the summary list', () => {
  expect(new Set(PRODUCT_SCAN_RULE_IDS).size).toBe(PRODUCT_SCAN_RULE_IDS.length);
  expect(PRODUCT_SCAN_RULE_IDS.length).toBeGreaterThanOrEqual(40);
  expect(rulesIn(uiFile, 'export const Notice = () => <div className="xr-notice" />;')).toEqual([]);
});

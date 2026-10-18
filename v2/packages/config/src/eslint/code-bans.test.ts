/**
 * Positive and negative cases for the product-code bans of Appendix F §3.8:
 * `xr/no-process-env`, `xr/deterministic`, `xr/no-canvas-classes`, `xr/v46-class-names`,
 * `xr/v3-class-names` (ADR-0010) and `xr/no-raw-hex`.
 */
import {
  deterministicRule,
  noCanvasClassesRule,
  noProcessEnvRule,
  noRawHexRule,
  productClassAllowListRule,
  v3ClassNamesRule,
  v46ClassNamesRule,
} from '../../eslint/rules/index.mjs';
import { fixturePath, ruleTester } from './rule-tester.js';

const tsFile = fixturePath('src/lib/settings.ts');
const tsxFile = fixturePath('src/features/shared/xs-07-help/view.tsx');
const uiFile = fixturePath('../../packages/ui/src/foundation/button.tsx');
const v3File = fixturePath('../../packages/ui/src/v3/actions.tsx');

const invalid = (filename: string, messageId: string) => (code: string) => ({
  code,
  filename,
  errors: [{ messageId }],
});

ruleTester().run('xr/no-process-env', noProcessEnvRule, {
  valid: [
    'const value = env.FOO;',
    'const nested = config.process.env;',
    "import { publicEnv } from '@/lib/env';",
    "import { argv } from 'node:process';",
  ].map((code) => ({ code, filename: tsFile })),
  invalid: [
    'const flag = process.env.NEXT_PUBLIC_XR_TEST_HOOKS;',
    "const flag = process.env['NEXT_PUBLIC_XR_DATA_SOURCE'];",
    "const all = process['env'];",
    'const flag = globalThis.process.env.CI;',
    'const { env } = process;',
    "import { env } from 'node:process';",
  ].map(invalid(tsFile, 'processEnv')),
});

ruleTester().run('xr/deterministic', deterministicRule, {
  valid: [
    'const now = clock.now();',
    'const at = new Date(isoInstant);',
    'const parsed = Date.parse(isoInstant);',
    'const larger = Math.max(1, 2);',
    'const id = ids.next();',
  ].map((code) => ({ code, filename: tsFile })),
  invalid: [
    'const now = Date.now();',
    'const roll = Math.random();',
    'const now = globalThis.Date.now();',
    "const roll = Math['random']();",
    'const { random } = Math;',
    'const { now } = Date;',
  ].map(invalid(tsFile, 'banned')),
});

ruleTester().run('xr/no-canvas-classes', noCanvasClassesRule, {
  valid: [
    '<div className="xr-app xr-btn xr-btn--primary" />',
    "const state = 'is-selected is-current';",
    "const word = 'documentation';",
    "const prefix = 'doc';",
    "import shell from './b1-frame-free';",
  ].map((code) => ({ code, filename: tsxFile })),
  invalid: [
    '<div className="b1-frame" />',
    '<p className="b1-cap">Caption</p>',
    '<span className="doc-tag doc-tag--new" />',
    '<a className={`xr-side-link ${current} is-focus`} />',
    "const states = ['is-shown'];",
    "const control = 'xa-boardctl';",
    "const button = 'xl-board-btn';",
    "const scrim = 'xr-dialog-scrim';",
    "const outline = 'xw-live';",
    "const placements = ['xw-dlg-top xa-dlg-end'].join(' ');",
    '<span className={`doc-${kind}`} />',
    "const frame = 'b1-' + part;",
  ].map((code) => ({
    code,
    filename: tsxFile,
    errors:
      code.includes('xw-dlg-top') || code.includes('doc-tag doc')
        ? [{ messageId: 'canvasClass' }, { messageId: 'canvasClass' }]
        : [{ messageId: 'canvasClass' }],
  })),
});

ruleTester().run('xr/v46-class-names', v46ClassNamesRule, {
  valid: [
    '<button className="xr-btn xr-btn--primary" />',
    '<div className="xw-errsum xr-x-th-sort" />',
    '<dialog className="xr-dialog xr-x-dialog--start" />',
    '<dialog className={`xr-dialog xr-x-dialog--${align}`} />',
    '<nav className="xr-tabs xw-hubtabs" />',
    "<a className={current ? 'xr-tab is-current' : 'xr-tab'} />",
    '<button className={`xr-btn xr-btn--${variant}`} />',
    '<div className={`${base} xp-hero`} />',
    "<div className={['xl-hub', open && 'is-open'].join(' ')} />",
    "<div className={'xa-' + kind} />",
    '<div id="flex" data-layout="grid p-4" />',
    // modifiers chosen by props (Appendix F §3.4): fragments inside ${…} and after +
    "<span className={`xr-pill xr-pill--${ok ? 'ok' : 'warn'}`} />",
    "<button className={`xr-btn xr-btn--${variant ?? 'primary'}`} />",
    "<div className={'xa-' + (kind ? 'quiz' : 'exam')} />",
    // the public-shell container is the bare `xp` class (xr-public.css; 138 board uses)
    '<div className="xp" />',
  ].map((code) => ({ code, filename: uiFile })),
  invalid: [
    ['<div className="flex p-4" />', 2],
    ['<span className="xr-btn text-sm" />', 1],
    ["<div className={wide ? 'grid' : 'xr-panel'} />", 1],
    ['<div className={`md:flex ${extra}`} />', 1],
    ['<div className="XR-btn" />', 1],
    ['<div className={`btn-${size}`} />', 1],
    ['<div className="bg-[#12173F] xr-row" />', 1],
    ["<div className={`xr-row ${wide ? 'grid' : 'xr-row--wide'}`} />", 1],
    ['<div className="xpx" />', 1],
  ]
    .map(([code, count]) => ({
      code: code as string,
      filename: uiFile,
      errors: Array.from({ length: count as number }, () => ({ messageId: 'notV46' })),
    }))
    .concat(
      [
        '<div className="xr-x-sort" />',
        '<dialog className="xr-dialog xr-x-dialog--center" />',
        '<div className={`xr-x-panel--${side}`} />',
      ].map((code) => ({ code, filename: uiFile, errors: [{ messageId: 'notAllowed' }] })),
    ),
});

ruleTester().run('xr/v3-class-names', v3ClassNamesRule, {
  valid: [
    // the V3 root and the Refined B prefixes (core.css xr-, rb.css rb-, rb-kit.css rk-)
    '<div className="xr rb" />',
    '<a className="rb-btn rb-btn--primary rb-btn--lg" />',
    '<span className="xr-st xr-st--info" />',
    '<li className="rk-fcell rk-fcell--pub" />',
    '<button className={`rb-btn rb-btn--${variant}`} />',
    "<tr className={selected ? 'is-kbd' : undefined} />",
    "<p className={['rb-row-when', due && 'rb-row-when--due'].join(' ')} />",
    // a v46 island keeps the v46 container class (`xr-` is shared with xr-foundation.css)
    '<div className="xr-app" />',
    // the V3 product classes on the allow-list (V3P-02)
    "<div className={`rk-sortbar ${shown ? 'rk-x-sort-shown' : 'rk-x-sort-hidden'}`} />",
  ].map((code) => ({ code, filename: v3File })),
  invalid: [
    ['<div className="flex p-4" />', 2],
    ['<span className="rb-btn text-sm" />', 1],
    ['<div className="xp" />', 1],
    ['<div className="xw-errsum" />', 1],
    ['<div className="RB-btn" />', 1],
    ['<div className="rbx" />', 1],
    ["<div className={wide ? 'grid' : 'rk-surface'} />", 1],
  ]
    .map(([code, count]) => ({
      code: code as string,
      filename: v3File,
      errors: Array.from({ length: count as number }, () => ({ messageId: 'notV3' })),
    }))
    .concat(
      [
        '<div className="rk-x-sort" />',
        '<dialog className="rk-dialog xr-x-dialog--start" />',
        '<div className={`rk-x-panel--${side}`} />',
      ].map((code) => ({ code, filename: v3File, errors: [{ messageId: 'notAllowed' }] })),
    ),
});

ruleTester().run('xr/product-class-allow-list', productClassAllowListRule, {
  valid: [
    "const ALIGN = { start: 'xr-x-dialog--start', marks: 'xr-x-dialog--marks' };",
    'const name = `xr-x-dialog--${align}`;',
    "const sort = 'xr-x-th-sort';",
    "const note = 'no product class here: xr-btn';",
    "const SORT = { shown: 'rk-x-sort-shown', hidden: 'rk-x-sort-hidden' };",
    'const v3 = `rk-x-sort-${state}`;',
  ].map((code) => ({ code, filename: uiFile })),
  invalid: [
    "const ALIGN = { centre: 'xr-x-dialog--centre' };",
    "const panel = 'xr-x-panel';",
    'const any = `xr-x-${kind}`;',
    'const other = `xr-x-table--${kind}`;',
    "const v3 = 'rk-x-panel';",
    'const v3any = `rk-x-${kind}`;',
  ].map((code) => ({ code, filename: uiFile, errors: [{ messageId: 'notAllowed' }] })),
});

ruleTester().run('xr/no-raw-hex', noRawHexRule, {
  valid: [
    '<a href="#main">Skip to main content</a>',
    '<a href="#fade">Jump</a>',
    '<label htmlFor="add">Add</label>',
    "const reference = 'Issue #123';",
    "const count = '#1';",
    '<div className="xr-x-sort" />',
    "import token from '#ffffff';",
  ].map((code) => ({ code, filename: tsxFile })),
  invalid: [
    "<div style={{ color: '#fff' }} />",
    "const navy = '#12173F';",
    "const border = 'border: 1px solid #ccc';",
    "const gradient = 'linear-gradient(#fff, #000)';",
    'const css = `color:${tone};background:#F4F5FB`;',
    '<svg fill="#1F4FD8" />',
    "const rule = '1px solid #000';",
    "const ring = '0 0 0 2px #333';",
  ].map(invalid(tsxFile, 'rawHex')),
});

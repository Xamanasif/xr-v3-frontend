import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import {
  builtCssFiles,
  LAYER_ORDER,
  V3_LAYER_ORDER,
  layerSequence,
  preflightFingerprint,
  preflightHits,
  preflightSource,
  resolveFromApp,
} from './support/built-css';

/**
 * The product CSS pipeline, proven on the BUILT app (WP-0.5; ADR-0001; Appendix E §2.2, §2.4;
 * Appendix F risk K-5). `@xr/ui/styles.css` (8 verbatim v46 sheets in one `xr.v46` layer + the
 * `xr.product` layer) and `globals.css` (Tailwind theme + utilities, no Preflight) go through
 * Next.js / Turbopack / @tailwindcss/postcss. Run `pnpm build` at the workspace root first.
 * The V3 entry (`@xr/ui/styles-v3.css`, ADR-0010) reaches only the chunks of the routes that
 * render a V3 surface (today the Entry & shared screens, XS): its generated, scoped sheets join
 * the source CSS the Preflight fingerprint is taken against, as ADR-0010 sets out.
 */

const stylesDirectory = dirname(resolveFromApp('@xr/ui/styles.css'));
const V46_SHEETS = [
  'xr-foundation.css',
  'xr-public.css',
  'xr-workspace.css',
  'xr-learning.css',
  'xr-assess.css',
  'xr-vendor.css',
  'xr-govern.css',
  'xr-admin.css',
];
const V3_SHEETS = ['rb-scoped.css', 'xs-scoped.css', 'sa-scoped.css', 'patch.css'];
const sourceCss = [
  ...V46_SHEETS.map((sheet) => readFileSync(join(stylesDirectory, 'v46', sheet), 'utf8')),
  readFileSync(join(stylesDirectory, 'product.css'), 'utf8'),
  ...V3_SHEETS.map((sheet) => readFileSync(join(stylesDirectory, 'v3', sheet), 'utf8')),
].join('\n');

/** The product's stylesheet links on a served page (the 404 page is the only page in Phase 0). */
async function productStylesheets(page: Page): Promise<string[]> {
  await page.goto('/');
  return page.$$eval('link[rel="stylesheet"]', (links) =>
    links.map((link) => link.getAttribute('href') ?? '').filter((href) => href.startsWith('/')),
  );
}

test.describe('built CSS: layers', () => {
  test('every emitted CSS file declares exactly properties < theme < xr.v46 < xr.product < [xr.v3 <] utilities and nothing unlayered', () => {
    const files = builtCssFiles();
    expect(files.length).toBeGreaterThan(0);
    let v3Chunks = 0;
    for (const file of files) {
      const { layers, unlayered } = layerSequence(readFileSync(file, 'utf8'));
      // Each file on its own establishes the full order, so whichever chunk the browser meets
      // first, the order is the same (ADR-0001 §3). No other layer (`base`, `components`) exists.
      // A chunk of a V3 route also reserves `xr.v3` and names its nested layers (ADR-0010).
      const v3 = layers.includes('xr.v3');
      if (v3) v3Chunks += 1;
      expect(layers, basename(file)).toEqual([...(v3 ? V3_LAYER_ORDER : LAYER_ORDER)]);
      expect(unlayered, basename(file)).toEqual([]);
    }
    expect(v3Chunks).toBeGreaterThan(0);
  });

  test('the public landing’s stylesheets carry no V3 layer (ADR-0010)', async ({
    page,
    request,
  }) => {
    const hrefs = await productStylesheets(page);
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      const { layers } = layerSequence(await (await request.get(href)).text());
      expect(layers, href).toEqual([...LAYER_ORDER]);
    }
  });

  test('the eight v46 sheets sit in xr.v46 in the B8-07 order, before the product layer', () => {
    const css = builtCssFiles()
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    const v46 = css.indexOf('@layer xr.v46{');
    const product = css.indexOf('@layer xr.product{');
    expect(v46).toBeGreaterThanOrEqual(0);
    expect(product).toBeGreaterThan(v46);
    // A selector that each sheet introduces, in load order.
    const firsts = ['--xr-font-sans:', '.xp{', '.xw-', '.xl-', '.xa-', '.xv-', '.xg-', '.xd-'].map(
      (marker) => css.indexOf(marker, v46),
    );
    expect(firsts.every((position) => position > v46 && position < product)).toBe(true);
    expect([...firsts].sort((a, b) => a - b)).toEqual(firsts);
  });
});

test.describe('built CSS: no Tailwind Preflight', () => {
  // Tailwind's own @property fallback (`@layer properties`, emitted once a utility such as
  // `shadow-e1` registers custom properties) targets `*, ::before, ::after, ::backdrop`. Those
  // selectors are not Preflight; Preflight is still recognised by its other signatures.
  const tailwindPropertiesFallback = '*,::before,::after,::backdrop{}';
  const fingerprint = preflightFingerprint(
    preflightSource(),
    `${sourceCss}\n${tailwindPropertiesFallback}`,
  );

  test('the fingerprint is sensitive and has no false positive on the v46 sheets', () => {
    expect(fingerprint.selectors.length).toBeGreaterThan(30);
    expect(fingerprint.declarations.length).toBeGreaterThan(30);
    expect(preflightHits(preflightSource(), fingerprint).length).toBe(
      fingerprint.selectors.length + fingerprint.declarations.length,
    );
    expect(preflightHits(sourceCss, fingerprint)).toEqual([]);
    expect(preflightHits(`@layer properties{${tailwindPropertiesFallback}}`, fingerprint)).toEqual(
      [],
    );
  });

  test('no emitted CSS file contains a Preflight selector or declaration', () => {
    for (const file of builtCssFiles()) {
      expect(preflightHits(readFileSync(file, 'utf8'), fingerprint), basename(file)).toEqual([]);
    }
  });
});

test.describe('built CSS: v46 assets', () => {
  test('every url() resolves to the byte-identical v46 art served as SVG', async ({
    page,
    request,
  }) => {
    const served = new Set<string>();
    for (const href of await productStylesheets(page)) {
      const css = await (await request.get(href)).text();
      for (const [, url] of css.matchAll(/url\(([^)]+)\)/g)) {
        const path = new URL(url!.replace(/["']/g, ''), new URL(href, 'http://localhost')).pathname;
        const response = await request.get(path);
        expect(response.status(), path).toBe(200);
        expect(response.headers()['content-type'], path).toContain('image/svg+xml');
        const name = basename(path).replace(/\.[^.]+\.svg$/, '.svg');
        expect(
          Buffer.compare(
            await response.body(),
            readFileSync(join(stylesDirectory, 'v46', 'art', name)),
          ),
          name,
        ).toBe(0);
        served.add(name);
      }
    }
    expect(served.size).toBe(19);
  });
});

/**
 * A probe document on a reserved origin (RFC 6761) that links the built chunks in a given order.
 * The origin proxies `/_next/static/**` from the running app, so chunks and their url() assets
 * are same-origin (Chromium's private-network rules block a public origin reading localhost).
 * Each document is fresh: Chromium fixes the layer order when it first meets a layer, so
 * reordering links in a loaded page would prove nothing.
 */
const PROBE_ORIGIN = 'http://cascade.xr.test';
const PROBE_MARKUP = `
  <div class="xr-app">
    <button type="button" class="xr-btn xr-btn--text xg-del" data-probe="delete">Delete</button>
    <button type="button" class="xr-btn xr-btn--text xg-del" aria-disabled="true" data-probe="delete-off">Delete</button>
    <div class="xp" data-probe="public-root"></div>
    <p data-probe="layers"></p>
  </div>`;
/** Same element, one rule per layer, written in REVERSE layer order: the established order decides. */
const LAYER_PROBE = `@layer utilities{[data-probe=layers]{--c:utilities}}
@layer xr.product{[data-probe=layers]{--b:product;--c:product}}
@layer xr.v46{[data-probe=layers]{--a:v46;--b:v46;--c:v46}}
@layer theme{[data-probe=layers]{--a:theme;--b:theme;--c:theme}}`;

async function probeDocument(page: Page, appOrigin: string, head: string[]) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.unrouteAll();
  await page.route(`${PROBE_ORIGIN}/**`, async (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname.startsWith('/_next/static/')) {
      await route.fulfill({ response: await route.fetch({ url: `${appOrigin}${pathname}` }) });
      return;
    }
    await route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: `<!doctype html><html lang="en"><head>${head.join('')}<style>${LAYER_PROBE}</style></head><body>${PROBE_MARKUP}</body></html>`,
    });
  });
  await page.goto(`${PROBE_ORIGIN}/probe.html`);
  // `.xr-btn` transitions its colour (xr-foundation.css): let any transition started while the
  // sheets arrived settle before reading computed values.
  await page.evaluate(() =>
    Promise.all(document.getAnimations().map((animation) => animation.finished)),
  );
  return page.evaluate(() => {
    const style = (name: string) =>
      getComputedStyle(document.querySelector(`[data-probe="${name}"]`)!);
    const layers = style('layers');
    return {
      sheets: document.styleSheets.length,
      body: [
        getComputedStyle(document.body).backgroundColor,
        getComputedStyle(document.body).color,
      ],
      layers: ['--a', '--b', '--c'].map((name) => layers.getPropertyValue(name).trim()),
      deleteColour: style('delete').color,
      disabledDeleteColour: style('delete-off').color,
      publicRootOverflow: style('public-root').overflow,
    };
  });
}

test.describe('the cascade, in a fresh document', () => {
  const CANONICAL = {
    body: ['rgb(244, 245, 251)', 'rgb(18, 23, 63)'], // #F4F5FB, #12173F
    // v46 beats theme, product beats v46, utilities beat product
    layers: ['v46', 'product', 'utilities'],
    deleteColour: 'rgb(180, 35, 24)', // .xg-del #B42318
    disabledDeleteColour: 'rgb(92, 99, 137)', // .xr-btn[aria-disabled="true"] #5C6389 (one layer)
    publicRootOverflow: 'clip', // PF-06 in xr.product beats .xp{overflow:hidden} in xr.v46
  };
  const linksFor = (chunks: string[]) =>
    chunks.map((href) => `<link rel="stylesheet" href="${href}">`);

  test('holds whichever order the built chunks are linked in', async ({ page, baseURL }) => {
    const links = linksFor(await productStylesheets(page));
    expect(links.length).toBeGreaterThan(0);
    // Every rotation of the chunk list, plus a route-style chunk (statement + utilities only)
    // loading FIRST — what a later route's CSS looks like.
    const routeChunk = `<style>@layer ${LAYER_ORDER.join(',')};@layer utilities{.xr-x-none{color:red}}</style>`;
    const orders = [
      ...links.map((_, index) => [...links.slice(index), ...links.slice(0, index)]),
      [routeChunk, ...links],
    ];
    for (const order of orders) {
      const { sheets, ...result } = await probeDocument(page, baseURL!, order);
      expect(sheets).toBe(order.length + 1);
      expect(result).toEqual(CANONICAL);
    }
  });

  test('negative control: a chunk WITHOUT the layer statement loading first breaks the order', async ({
    page,
    baseURL,
  }) => {
    const result = await probeDocument(page, baseURL!, [
      '<style>@layer utilities{.xr-x-none{color:red}}</style>',
      ...linksFor(await productStylesheets(page)),
    ]);
    // utilities is now the FIRST (weakest) layer: the product layer wins --c.
    expect(result.layers).toEqual(['v46', 'product', 'product']);
  });

  test('a V3 chunk (ADR-0010): xr.v3 beats xr.product and loses to utilities, whichever loads first', async ({
    page,
    baseURL,
  }) => {
    const v3Chunks = builtCssFiles()
      .filter((file) => layerSequence(readFileSync(file, 'utf8')).layers.includes('xr.v3'))
      .map((file) => `/_next/static/${file.split(`${join('.next', 'static')}/`)[1]!}`);
    expect(v3Chunks.length).toBeGreaterThan(0);
    const landing = await productStylesheets(page);
    // After the chunks, one rule in the innermost V3 layer for --b and --c.
    const v3Probe = '<style>@layer xr.v3.patch{[data-probe=layers]{--b:v3;--c:v3}}</style>';
    for (const order of [
      [...v3Chunks, ...landing],
      [...landing, ...v3Chunks],
    ]) {
      const { layers, deleteColour, publicRootOverflow } = await probeDocument(page, baseURL!, [
        ...linksFor(order),
        v3Probe,
      ]);
      expect(layers).toEqual(['v46', 'v3', 'utilities']);
      // The v46 cascade is untouched by the V3 sheets (no V3 selector matches outside `.xr`).
      expect([deleteColour, publicRootOverflow]).toEqual([
        CANONICAL.deleteColour,
        CANONICAL.publicRootOverflow,
      ]);
    }
  });
});

test.describe('the served page', () => {
  test('the body font is the v46 stack, and no globals.css body rule remains', async ({ page }) => {
    await page.goto('/');
    // Phase 0 serves only Next's built-in 404 page, which inlines its own unlayered
    // `body{background:#fff;color:#000}`; the canvas/ink check therefore runs in the specimen
    // harness (Appendix F WP-0.5 acceptance 2) and in the fresh documents above.
    expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toBe(
      '"Public Sans", system-ui, -apple-system, "Segoe UI", sans-serif',
    );
    expect(await page.locator('body').getAttribute('class')).toBeNull();
  });

  test('loads Public Sans with the boards’ own Google Fonts link (PF-09 fallback)', async ({
    page,
  }) => {
    const board = readFileSync(
      join(
        __dirname,
        '..',
        '..',
        '..',
        '..',
        'design',
        'handoff-v46',
        'canvas-v46',
        'project',
        'B8-07-Handoff-Specifications.dc.html',
      ),
      'utf8',
    );
    const boardHref =
      /<link href="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]+)" rel="stylesheet">/
        .exec(board)?.[1]
        ?.replaceAll('&amp;', '&');
    const fontCss = page.waitForResponse((response) => response.url() === boardHref, {
      timeout: 15_000,
    });
    await page.goto('/');
    expect(
      await page.locator('link[rel="stylesheet"][href^="https://fonts"]').getAttribute('href'),
    ).toBe(boardHref);
    const response = await fontCss.catch(() => null);
    test.skip(
      !response || !response.ok(),
      `Google Fonts did not answer (${response?.status() ?? 'no response'}): Public Sans loading cannot be verified on this machine — limitation, not a pass.`,
    );
    const fonts = await page.evaluate(async () => {
      const loaded = await document.fonts.load('16px "Public Sans"');
      const bold = await document.fonts.load('700 16px "Public Sans"');
      return {
        loaded: loaded.map((face) => face.status),
        bold: bold.map((face) => face.status),
        check: document.fonts.check('16px "Public Sans"'),
      };
    });
    expect(fonts.loaded.length).toBeGreaterThan(0);
    expect(fonts.loaded.every((status) => status === 'loaded')).toBe(true);
    expect(fonts.bold.length).toBeGreaterThan(0);
    expect(fonts.check).toBe(true);
  });
});

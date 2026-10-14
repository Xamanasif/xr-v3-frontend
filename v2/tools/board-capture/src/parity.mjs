// Playwright fixtures and the comparison step shared by the two parity suites (component
// specimens in apps/specimens, Phase-0 screens in apps/web). `@playwright/test` is injected by the
// calling suite, so this test-only folder needs no dependency of its own.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { openBoard } from './boards.mjs';
import { DEVIATION_BY_ID } from './deviations.mjs';
import { installCaptureNetwork } from './network.mjs';
import { TOOL_ROOT } from './paths.mjs';
import { VENDORED_FONTS, verifiedVendor } from './vendor.mjs';

/**
 * The approved comparator configuration (Appendix E §9.1 "Tolerances"; Appendix F §7.5 step 5).
 * Screens use the strict end of the 0.005–0.01 band, for whole frames only (`frame: true`); every
 * element, including the parts of a screen, is held to the component tolerance.
 */
export const TOLERANCES = {
  specimen: { threshold: 0.1, maxDiffPixelRatio: 0.001 },
  screen: { threshold: 0.2, maxDiffPixelRatio: 0.005 },
};

/** Screenshot options for both captures: `animations:'disabled'`, `caret:'hide'`. */
export const SHOT = { animations: 'disabled', caret: 'hide', scale: 'css' };

/** One locator step (scroll, box, screenshot): a missing element fails its comparison, not the run. */
const STEP_TIMEOUT = 10_000;

/** Context options for both captures (reducedMotion 'reduce'; no service workers; 1× pixels). */
export const CONTEXT_OPTIONS = {
  reducedMotion: 'reduce',
  serviceWorkers: 'block',
  deviceScaleFactor: 1,
  colorScheme: 'light',
  locale: 'en-GB',
  timezoneId: 'Asia/Kolkata',
};

/**
 * The expected measurement of every registered comparison (`pinned.json`, written by
 * `pin.mjs` from a reviewed run): a registered deviation may not change silently — a different
 * size, icon set or pixel count (beyond max(20 px, 10 %)) fails the comparison.
 */
export const PINNED_FILE = join(TOOL_ROOT, 'src', 'pinned.json');
const PINNED = existsSync(PINNED_FILE) ? JSON.parse(readFileSync(PINNED_FILE, 'utf8')) : {};

/** Where this run keeps its artefacts (set by the global setup). */
export function runDirectory() {
  const directory = process.env.XR_PARITY_RUN_DIR;
  if (!directory) throw new Error('XR_PARITY_RUN_DIR is not set: run through the parity config');
  return directory;
}

export function boardOrigin() {
  const origin = process.env.XR_BOARD_ORIGIN;
  if (!origin) throw new Error('XR_BOARD_ORIGIN is not set: the parity global setup did not run');
  return origin;
}

let vendor;
const vendorResponses = () => (vendor ??= verifiedVendor()).responses;

/** The product pages are served the fonts only; the canvas scripts are for the boards alone. */
const FONT_URLS = new Set(VENDORED_FONTS.map((font) => font.url));
const WOFF2_URLS = new Set(
  VENDORED_FONTS.filter((font) => font.url.endsWith('.woff2')).map((font) => font.url),
);
let fontResponses;
const productResponses = () =>
  (fontResponses ??= new Map([...vendorResponses()].filter(([url]) => FONT_URLS.has(url))));

/**
 * Fixtures for `test.extend(captureFixtures)` (typed by each suite's `support.ts`):
 * - `network` (auto): the product context on the capture network (localhost + the vendored font
 *   files only), with its ledger (served / blocked); an external request fails the test;
 * - `openBoardPage(file, { viewport, props, uncrop, frameMinHeight })`: a board page in its own
 *   context on the capture network (localhost + the verified scripts and fonts). The board must
 *   have rendered completely — no template marker, Public Sans ready, no page error — and its
 *   final network ledger (after every click and prop change) must show no external request.
 */
/** A font file from anywhere but the vendored woff2 files (localhost included) fails the test. */
function foreignFonts(ledger) {
  return ledger.fonts.filter((url) => !WOFF2_URLS.has(url));
}

export const captureFixtures = {
  network: [
    async ({ context }, use) => {
      const ledger = await installCaptureNetwork(context, productResponses());
      await use(ledger);
      if (ledger.blocked.length > 0) {
        throw new Error(`product pages requested external URLs: ${ledger.blocked.join(', ')}`);
      }
      if (foreignFonts(ledger).length > 0) {
        throw new Error(
          `product pages loaded other font files: ${foreignFonts(ledger).join(', ')}`,
        );
      }
    },
    { auto: true },
  ],
  openBoardPage: async ({ browser }, use, testInfo) => {
    const opened = [];
    await use(async (file, { viewport = { width: 1440, height: 900 }, ...options } = {}) => {
      const context = await browser.newContext({ ...CONTEXT_OPTIONS, viewport });
      const ledger = await installCaptureNetwork(context, vendorResponses());
      const page = await context.newPage();
      const facts = await openBoard(page, boardOrigin(), file, options);
      opened.push({ file, context, ledger, facts });
      const problems = [
        facts.markersInText + facts.markersInAttributes > 0 &&
          `${facts.markersInText + facts.markersInAttributes} template markers left`,
        !facts.publicSansReady && 'Public Sans not ready',
        facts.publicSansFailedFaces > 0 && `${facts.publicSansFailedFaces} font faces failed`,
        facts.errors.length > 0 && `page errors: ${facts.errors.join(' | ')}`,
      ].filter(Boolean);
      if (problems.length > 0) throw new Error(`${file} did not render completely: ${problems}`);
      return { page, facts, ledger };
    });
    for (const { file, context, ledger, facts } of opened) {
      testInfo.annotations.push({
        type: 'board',
        description: JSON.stringify({ file, ...facts, network: summarise(ledger) }),
      });
      await context.close();
      if (ledger.blocked.length > 0) {
        throw new Error(`${file} requested external URLs: ${ledger.blocked.join(', ')}`);
      }
      // `facts.errors` is the page's live error list: errors after opening count too.
      if (facts.errors.length > 0) {
        throw new Error(`${file} raised page errors: ${facts.errors.join(' | ')}`);
      }
      if (ledger.fonts.length === 0 || foreignFonts(ledger).length > 0) {
        throw new Error(
          `${file} fonts were not the vendored woff2 files: ${ledger.fonts.join(', ')}`,
        );
      }
    }
  },
};

export function summarise(ledger) {
  return {
    local: ledger.local,
    served: ledger.served.length,
    blocked: ledger.blocked,
    fonts: [...new Set(ledger.fonts)].map((url) => url.split('/').at(-1)),
  };
}

/**
 * Screenshots `locator` until two consecutive images are identical (the stability rule of
 * `toHaveScreenshot`), with the approved options. One crop rule for both captures: the element's
 * box, widened by `margin` (room for a focus ring) or narrowed by `insetX` on the left and right
 * only, rounded outwards to whole pixels. Masks paint dynamic regions in both captures.
 */
export async function stableShot(locator, { margin = 0, insetX = 0, mask = [] } = {}) {
  const page = locator.page();
  // Scroll only when needed: a sub-pixel-aligned element can overflow its own scroll container
  // (the drawer) by under a pixel, and scrolling it into view would undo the alignment.
  const visible = await locator.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return (
      box.top >= 0 && box.left >= -1 && box.bottom <= innerHeight && box.right <= innerWidth + 1
    );
  });
  if (!visible) await locator.scrollIntoViewIfNeeded({ timeout: STEP_TIMEOUT });
  // Inside a position:fixed ancestor (the product drawer, PF-03) the clip is taken from the
  // viewport: Chromium's element screenshot of a sub-pixel-shifted element there crops the wrong
  // region.
  const fixed = await locator.evaluate((element) => {
    for (let node = element; node; node = node.parentElement) {
      if (getComputedStyle(node).position === 'fixed') return true;
    }
    return false;
  });
  let previous;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const box = await locator.boundingBox({ timeout: STEP_TIMEOUT });
    if (!box) throw new Error('element has no box');
    const scroll = fixed ? { x: 0, y: 0 } : await page.evaluate(() => ({ x: scrollX, y: scrollY }));
    const left = Math.floor(box.x + scroll.x - margin) + insetX;
    const top = Math.floor(box.y + scroll.y - margin);
    const shot = await page.screenshot({
      ...SHOT,
      mask,
      clip: {
        x: left,
        y: top,
        width: Math.ceil(box.x + scroll.x + box.width + margin) - insetX - left,
        height: Math.ceil(box.y + scroll.y + box.height + margin) - top,
      },
      fullPage: !fixed,
      timeout: STEP_TIMEOUT,
    });
    if (previous && shot.equals(previous)) return shot;
    previous = shot;
    await page.waitForTimeout(100);
  }
  throw new Error('the capture never became stable (two identical screenshots in a row)');
}

/**
 * Public Sans must have loaded for exactly what an element draws: every weight and style of its
 * rendered Public Sans text, checked with that text. (A plain `check('16px "Public Sans"')` asks
 * for weight 400 and every subset; a page of semibold buttons loads only the 600 Latin face.) Run
 * on both captures. Where the faces came from is proved by the network ledger: every font file a
 * board or product context fetches must be one of the vendored woff2 files (the fixtures above).
 */
async function publicSansOf(locator, side) {
  const fonts = await locator.evaluate(async (root) => {
    await document.fonts.ready;
    const used = new Map();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const text = walker.currentNode.nodeValue.trim();
      const parent = walker.currentNode.parentElement;
      if (!text || !parent) continue;
      // Only text that is rendered (a rail hides its labels: their weight is never loaded) and set
      // in Public Sans (record ids use the monospace token, --xr-font-mono).
      const range = document.createRange();
      range.selectNodeContents(walker.currentNode);
      if (range.getClientRects().length === 0) continue;
      const style = getComputedStyle(parent);
      if (!style.fontFamily.replace(/['"]/g, '').startsWith('Public Sans')) continue;
      const key = `${style.fontStyle} ${style.fontWeight}`;
      used.set(key, (used.get(key) ?? '') + text);
    }
    const faces = [...document.fonts].filter((face) => face.family.includes('Public Sans'));
    return {
      checks: [...used].map(([key, text]) => ({
        font: key,
        ready: document.fonts.check(`${key} 16px "Public Sans"`, text),
      })),
      loaded: faces.filter((face) => face.status === 'loaded').length,
      failed: faces.filter((face) => face.status === 'error').length,
    };
  });
  const bad = fonts.checks.filter((check) => !check.ready);
  if (bad.length > 0 || fonts.failed > 0 || (fonts.checks.length > 0 && fonts.loaded === 0)) {
    throw new Error(`Public Sans not loaded (${side}): ${JSON.stringify(fonts)}`);
  }
  return { faces: fonts.loaded, weights: fonts.checks.map((check) => check.font) };
}

/** The icons an element draws, in order: each rendered `svg`'s viewBox and path data. */
async function iconsOf(locator) {
  return locator.evaluate((root) =>
    [...root.querySelectorAll('svg')]
      .filter(
        (svg) => svg.getClientRects().length > 0 && getComputedStyle(svg).visibility !== 'hidden',
      )
      .map(
        (svg) =>
          `${svg.getAttribute('viewBox') ?? ''} ${[...svg.querySelectorAll('path')]
            .map((path) => path.getAttribute('d'))
            .join(' ')}`,
      ),
  );
}

/**
 * The product element's content and layout, exactly: for the element and each rendered descendant
 * its tag and classes, its box relative to the element (1/64 px), the computed styles that draw it,
 * its own words and, for an icon path, its data; for each text node its line boxes (where it
 * wraps). Hashed into the pin of a registered comparison, so a registered difference cannot hide
 * another change — words, colour, spacing, wrapping, size or icon — even where the two captures
 * differ in size and no pixel count exists. Layout and styles are deterministic where the
 * anti-aliasing of a capture is not.
 */
async function fingerprintOf(locator) {
  const parts = await locator.evaluate((root) => {
    const origin = root.getBoundingClientRect();
    const unit = (value) => Math.round(value * 64) / 64;
    const at = (box) => [
      unit(box.x - origin.x),
      unit(box.y - origin.y),
      unit(box.width),
      unit(box.height),
    ];
    const DRAWN = [
      'display',
      'opacity',
      'color',
      'backgroundColor',
      'backgroundImage',
      'borderTopColor',
      'borderRightColor',
      'borderBottomColor',
      'borderLeftColor',
      'borderTopWidth',
      'borderRightWidth',
      'borderBottomWidth',
      'borderLeftWidth',
      'borderTopLeftRadius',
      'borderTopRightRadius',
      'borderBottomRightRadius',
      'borderBottomLeftRadius',
      'boxShadow',
      'outlineStyle',
      'outlineColor',
      'outlineWidth',
      'outlineOffset',
      'fontFamily',
      'fontSize',
      'fontWeight',
      'fontStyle',
      'lineHeight',
      'letterSpacing',
      'textDecorationLine',
      'textDecorationThickness',
      'textUnderlineOffset',
      'textTransform',
      'textAlign',
      'fill',
      'stroke',
      'strokeWidth',
      'transform',
    ];
    const out = [];
    for (const element of [root, ...root.querySelectorAll('*')]) {
      if (element.getClientRects().length === 0) continue;
      const style = getComputedStyle(element);
      if (style.visibility === 'hidden') continue;
      const tag = element.tagName.toLowerCase();
      out.push([
        tag,
        element.getAttribute('class') ?? '',
        ...at(element.getBoundingClientRect()),
        DRAWN.map((property) => style[property]).join('|'),
        tag === 'path' ? element.getAttribute('d') : '',
      ]);
      for (const node of element.childNodes) {
        if (node.nodeType !== Node.TEXT_NODE || !node.nodeValue.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        out.push(['#text', node.nodeValue, [...range.getClientRects()].map(at)]);
      }
    }
    return out;
  });
  return { elements: parts.length, sha256: sha256(JSON.stringify(parts)) };
}

/**
 * The harness box around the product element takes a width from the board (the board's column or
 * card width is canvas layout; the box is harness furniture). `matchWidth`: the drawn element's
 * width (block components fill their container); `widthFrom`: another drawn element's width (a
 * part compared inside a whole); `containerWidth`: the content width of the drawn element's parent
 * (inline words wrap there). The component's own CSS is never touched.
 */
async function sizeHost(product, width, option) {
  await product.evaluate(
    (element, { value, label }) => {
      const host = element.closest('[data-parity]');
      if (!host) throw new Error(`${label} needs a [data-parity] item`);
      host.style.boxSizing = 'content-box';
      host.style.width = `${value}px`;
    },
    { value: width, label: option },
  );
}

async function widthOf(locator) {
  const box = await locator.boundingBox({ timeout: STEP_TIMEOUT });
  if (!box) throw new Error('the width source has no box');
  return box.width;
}

async function contentWidthOfParent(reference) {
  return reference.evaluate((element) => {
    const parent = /** @type {HTMLElement} */ (element.parentElement);
    const style = getComputedStyle(parent);
    return (
      parent.getBoundingClientRect().width -
      parseFloat(style.paddingLeft) -
      parseFloat(style.paddingRight) -
      parseFloat(style.borderLeftWidth) -
      parseFloat(style.borderRightWidth)
    );
  });
}

/**
 * Text and edges are rasterised against the pixel grid, so an element drawn at x = 40.4 differs
 * at every glyph edge from the same element at x = 40. Where the reference sits on the board is
 * canvas layout and where the product item sits in the harness is harness furniture, so the
 * product item (its `[data-parity]` box, or the element itself) is moved by the difference of the
 * two fractional offsets: the shortest shift (±0.5 px at most), snapped to Chromium's 1/64 px
 * layout units, added to any shift already applied. Returns the shift, recorded.
 */
async function alignToReference(reference, product) {
  const [board, ours] = [
    await reference.boundingBox({ timeout: STEP_TIMEOUT }),
    await product.boundingBox({ timeout: STEP_TIMEOUT }),
  ];
  if (!board || !ours) return null;
  const fraction = (value) => value - Math.floor(value);
  const shortest = (value) => (value > 0.5 ? value - 1 : value < -0.5 ? value + 1 : value);
  const unit = (value) => Math.round(value * 64) / 64;
  const dx = unit(shortest(fraction(board.x) - fraction(ours.x)));
  const dy = unit(shortest(fraction(board.y) - fraction(ours.y)));
  if (dx === 0 && dy === 0) return { dx: 0, dy: 0 };
  await product.evaluate(
    (element, [x, y]) => {
      const host = element.closest('[data-parity]') ?? element;
      host.style.position = 'relative';
      host.style.left = `${(parseFloat(host.style.left) || 0) + x}px`;
      host.style.top = `${(parseFloat(host.style.top) || 0) + y}px`;
    },
    [dx, dy],
  );
  return { dx, dy };
}

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Width × height from a PNG header. */
export function pngSize(png) {
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

/**
 * Reads the comparator's own words: "Expected an image W×H, received …" (size) or
 * "N pixels (ratio … of all image pixels) are different".
 */
function measuredFrom(message, size) {
  const plain = message.replace(/\u001b\[[0-9;]*m/g, '');
  const sizes = /Expected an image (\d+)px by (\d+)px, received (\d+)px by (\d+)px/.exec(plain);
  if (sizes) {
    return {
      sizeMismatch: `reference ${sizes[1]}×${sizes[2]}, product ${sizes[3]}×${sizes[4]}`,
      differentPixels: null,
      ratio: null,
    };
  }
  const count = /(\d+) pixels \(ratio/.exec(plain);
  if (!count) return { error: plain.split('\n')[0], differentPixels: null, ratio: null };
  const differentPixels = Number(count[1]);
  return { differentPixels, ratio: differentPixels / (size.width * size.height) };
}

/**
 * Names already compared in this worker. Workers share the run's `references/` folder, so an
 * existing reference file is a duplicate from another worker: every artefact name is unique.
 */
const NAMES = new Set();

/**
 * One reference-versus-product comparison. Writes the board capture as the snapshot the
 * comparator reads (`<run>/references/<name>.png`) and the product capture beside it
 * (`<run>/product/<name>.png`), compares them with Playwright's image comparator at the given
 * tolerance and records the measured result, the icons each side draws and the fonts each side
 * loaded. The reference is never rewritten from the product: the config sets
 * `updateSnapshots: 'none'` and the written reference is re-hashed after the comparison. Icons
 * that differ fail the comparison (marked `ICON-MISMATCH`) even when the pixels are within
 * tolerance — a small icon change hides under a ratio.
 */
export async function compareWithBoard({
  expect,
  testInfo,
  name,
  kind,
  frame = false,
  reference,
  product,
  margin = 0,
  insetX = 0,
  masks = { reference: [], product: [] },
  alignSubpixel = true,
  matchWidth = false,
  widthFrom,
  containerWidth = false,
}) {
  if (!TOLERANCES[kind]) throw new Error(`unknown tolerance kind ${kind}`);
  if (kind === 'screen' && !frame) {
    throw new Error(`${name}: the screen tolerance is for whole frames only (frame: true)`);
  }
  if (NAMES.has(name)) throw new Error(`${name}: duplicate comparison name`);
  NAMES.add(name);
  const maskCount = masks.reference.length + masks.product.length;
  if (maskCount > 0 && !(masks.reasons?.length > 0)) {
    throw new Error(`${name}: a mask needs its reason (dynamic regions only)`);
  }
  const fonts = {
    reference: await publicSansOf(reference, 'reference'),
    product: await publicSansOf(product, 'product'),
  };
  await reference.scrollIntoViewIfNeeded({ timeout: STEP_TIMEOUT });
  if (matchWidth) await sizeHost(product, await widthOf(reference), 'matchWidth');
  if (widthFrom) await sizeHost(product, await widthOf(widthFrom), 'widthFrom');
  if (containerWidth)
    await sizeHost(product, await contentWidthOfParent(reference), 'containerWidth');
  await product.scrollIntoViewIfNeeded({ timeout: STEP_TIMEOUT });
  const alignment = alignSubpixel ? await alignToReference(reference, product) : null;
  const icons = { reference: await iconsOf(reference), product: await iconsOf(product) };
  icons.same = JSON.stringify(icons.reference) === JSON.stringify(icons.product);
  const productFingerprint = await fingerprintOf(product);
  const referenceShot = await stableShot(reference, { margin, insetX, mask: masks.reference });
  const referencePath = testInfo.snapshotPath(`${name}.png`);
  const productPath = join(runDirectory(), 'product', `${name}.png`);
  if (referencePath === productPath) throw new Error(`${name}: reference and product paths meet`);
  if (existsSync(referencePath)) throw new Error(`${name}: duplicate comparison name in this run`);
  mkdirSync(dirname(referencePath), { recursive: true });
  writeFileSync(referencePath, referenceShot);
  const before = sha256(referenceShot);
  const productShot = await stableShot(product, { margin, insetX, mask: masks.product });
  mkdirSync(dirname(productPath), { recursive: true });
  writeFileSync(productPath, productShot);
  // Measurement pass (exact pixel count at the same threshold, nothing allowed): its result is
  // recorded, never used to accept. The acceptance assertion follows with the approved tolerance.
  let measured = { differentPixels: 0, ratio: 0 };
  try {
    expect(productShot).toMatchSnapshot(`${name}.png`, {
      threshold: TOLERANCES[kind].threshold,
      maxDiffPixels: 0,
    });
  } catch (error) {
    measured = measuredFrom(String(error?.message ?? error), pngSize(productShot));
  }
  const record = {
    name,
    kind,
    frame,
    tolerance: TOLERANCES[kind],
    reference: referencePath,
    product: productPath,
    referenceSize: pngSize(referenceShot),
    productSize: pngSize(productShot),
    measured,
    icons,
    productFingerprint,
    alignment,
    fonts,
    margin,
    insetX,
    matchWidth,
    widthFrom: Boolean(widthFrom),
    containerWidth,
    maskCount,
    masks: (masks.reasons ?? []).slice(),
  };
  testInfo.annotations.push({ type: 'parity', description: JSON.stringify(record) });
  try {
    expect(productShot).toMatchSnapshot(`${name}.png`, TOLERANCES[kind]);
  } finally {
    if (sha256(readFileSync(referencePath)) !== before) {
      throw new Error(`reference ${name} was rewritten during the comparison`);
    }
  }
  if (!icons.same) {
    throw new Error(
      `ICON-MISMATCH ${name}: board ${JSON.stringify(icons.reference)} product ${JSON.stringify(icons.product)}`,
    );
  }
  return record;
}

const sizeText = (size) => `${size.width}×${size.height}`;

/**
 * Checks a registered comparison against its pinned measurement; returns a problem or null.
 */
function pinProblem(name, ids, record) {
  const pin = PINNED[name];
  if (!pin) return `no pinned measurement for this registered comparison (pin.mjs)`;
  if (!record) return 'not measured';
  const problems = [];
  if (JSON.stringify(pin.deviations) !== JSON.stringify(ids)) {
    problems.push(`register entries ${ids.join(' + ')} ≠ pinned ${pin.deviations.join(' + ')}`);
  }
  if (pin.reference !== sizeText(record.referenceSize)) {
    problems.push(`reference ${sizeText(record.referenceSize)} ≠ pinned ${pin.reference}`);
  }
  if (pin.product !== sizeText(record.productSize)) {
    problems.push(`product ${sizeText(record.productSize)} ≠ pinned ${pin.product}`);
  }
  if (pin.iconsSame !== record.icons.same)
    problems.push(`icons same ${record.icons.same} ≠ pinned`);
  if (pin.productFingerprint !== record.productFingerprint?.sha256) {
    problems.push('the product element changed (content, layout or styles ≠ pinned fingerprint)');
  }
  const pixels = record.measured.differentPixels;
  if ((pin.pixels === null) !== (pixels === null)) problems.push('measurement kind changed');
  if (typeof pin.pixels === 'number' && typeof pixels === 'number') {
    if (Math.abs(pixels - pin.pixels) > Math.max(20, pin.pixels * 0.1)) {
      problems.push(`${pixels} px differ ≠ pinned ${pin.pixels} (± max(20, 10 %))`);
    }
  }
  return problems.length > 0 ? `registered deviation changed: ${problems.join('; ')}` : null;
}

/**
 * Runs several comparisons from one board page and one product page, each in turn (with its own
 * `before` step on either side: hover, focus, typing), and fails at the end with every failed
 * comparison named — one failure never hides the next. Each item is `{ name, reference, product,
 * kind?, frame?, margin?, insetX?, matchWidth?, widthFrom?, containerWidth?, masks?, deviation?,
 * before?: { reference?, product? }, after?: … }`.
 *
 * `deviation` names one entry (or an array) of the expected-deviation register (`deviations.mjs`).
 * Such a comparison is still made and measured; a difference (pixels outside tolerance, or
 * different icons) is reported as that registered deviation — provided its measurement equals the
 * pinned one (`pinned.json`: sizes, icon equality, the product element's content fingerprint, pixel
 * count within max(20 px, 10 %)), so the entry cannot absorb any other change. Inside tolerance with the same icons it FAILS: a
 * registered deviation that is no longer observed is a stale entry. A difference with no register
 * entry always fails. Nothing is masked by a register entry.
 */
export async function compareAll({ expect, testInfo, kind, items }) {
  const failures = [];
  for (const item of items) {
    const ids = [item.deviation ?? []].flat();
    const unknown = ids.filter((id) => !DEVIATION_BY_ID.has(id));
    if (unknown.length > 0) {
      failures.push(`${item.name}: unknown deviation id ${unknown.join(', ')}`);
      continue;
    }
    const entries = ids.map((id) => DEVIATION_BY_ID.get(id));
    let outcome = 'within-tolerance';
    let message = '';
    let record = null;
    try {
      await item.before?.reference?.();
      await item.before?.product?.();
      record = await compareWithBoard({ expect, testInfo, ...item, kind: item.kind ?? kind });
    } catch (error) {
      message =
        String(error?.message ?? error)
          .split('\n')
          .find(Boolean) ?? 'failed';
      const visual = /toMatchSnapshot|ICON-MISMATCH/.test(message);
      outcome = visual && entries.length > 0 ? 'registered-deviation' : 'failed';
      if (outcome === 'registered-deviation') {
        const recorded = testInfo.annotations
          .filter((annotation) => annotation.type === 'parity')
          .map((annotation) => JSON.parse(annotation.description))
          .findLast((entry) => entry.name === item.name);
        const problem = pinProblem(item.name, ids, recorded);
        if (problem) {
          outcome = 'failed';
          message = problem;
        }
      }
    } finally {
      await item.after?.reference?.();
      await item.after?.product?.();
    }
    if (entries.length > 0 && outcome === 'within-tolerance' && record) {
      outcome = 'failed';
      message = `registered deviation ${ids.join(' + ')} is no longer observed (stale register entry)`;
    }
    testInfo.annotations.push({
      type: 'parity-outcome',
      description: JSON.stringify({
        name: item.name,
        outcome,
        deviations: entries.map((entry) => ({
          id: entry.id,
          status: entry.status,
          blocks: entry.blocksParity,
        })),
        message,
      }),
    });
    if (outcome === 'failed') failures.push(`${item.name}: ${message}`);
  }
  expect(failures, `${failures.length} of ${items.length} comparisons failed`).toEqual([]);
}

/** Moves the pointer off every element (after a hover state). */
export async function pointerAway(page) {
  await page.mouse.move(0, 0);
}

/**
 * Gives `locator` keyboard focus as a keyboard user would see it, and proves `:focus-visible`
 * matches (the product's real focus ring, never the board's static `.is-focus`).
 */
export async function keyboardFocus(locator) {
  await locator.focus();
  const visible = await locator.evaluate((element) => element.matches(':focus-visible'));
  if (!visible) throw new Error('focus is not :focus-visible');
}

export async function blurAll(page) {
  await page.evaluate(() => /** @type {HTMLElement | null} */ (document.activeElement)?.blur());
}

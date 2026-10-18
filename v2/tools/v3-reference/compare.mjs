// V3 reference comparison (ADR-0010; docs/v3/V3-COMPARISON-MAP.json): renders frozen V3 boards
// next to the React V3 specimens of the built harness, in one Chromium, at the four approved
// widths, and measures the pixel difference. Local developer tooling only — never imported by the
// product, never deployed, not part of `pnpm verify`.
//
// The boards need a canvas runtime. The V3 runtime was not supplied, so this uses the HISTORICAL v46
// runtime (design/handoff-v46/runtime/support.js; compatibility with V3 is not established) on a
// temporary copy of the boards, with React / ReactDOM / Babel served from the vendored, checksum-
// verified files of tools/board-capture/vendor. Public Sans loads from the Google Fonts link the
// boards and the specimens name (network). A role export that ships its own runtime passes it with
// `--runtime`.
//
// Usage (from v2/, with the harness built and served, e.g. `pnpm --dir apps/specimens exec next
// start -p 3310`):
//   node tools/v3-reference/compare.mjs --harness http://localhost:3310 [--widths 1440,375]
//     [--only sa01,ia02] [--runtime path/to/support.js]
// Output: tools/v3-reference/.runs/<stamp>/ (git-ignored): board, React and result files.
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, normalize } from 'node:path';
import { parseArgs } from 'node:util';

const here = import.meta.dirname;
const v2 = join(here, '..', '..');
const repository = join(v2, '..');
const BOARDS = join(repository, 'design', 'v3-refined-b', 'pack', 'references', 'v3', 'project');
const HISTORICAL_RUNTIME = join(repository, 'design', 'handoff-v46', 'runtime', 'support.js');
const VENDOR = join(v2, 'tools', 'board-capture', 'vendor');
const require = createRequire(join(v2, 'apps', 'specimens', 'package.json'));
const { chromium } = require('@playwright/test');

/** Board, board props and the specimen that builds the same state. */
const CASES = [
  ['sa01', 'SA01.dc.html', null, '/v3-sa-01'],
  ['sa02', 'SA02.dc.html', null, '/v3-sa-02'],
  ['sa03-gdv', 'SA02.dc.html', { view: 'decision', record: 'gdv', asOf: 'oct08' }, '/v3-sa-03'],
  ['sa03-ren', 'SA02.dc.html', { view: 'decision', record: 'ren' }, '/v3-sa-03-renewal'],
  ['sa03-kon', 'SA02.dc.html', { view: 'decision', record: 'kon' }, '/v3-sa-03-paused'],
  ['sa03-viz', 'SA02.dc.html', { view: 'decision', record: 'viz' }, '/v3-sa-03-decided'],
  ['ia01', 'IA01.dc.html', null, '/v3-ia-01'],
  ['ia02', 'IA02.dc.html', null, '/v3-ia-02'],
  ['ia02-paused', 'IA02.dc.html', { scenario: 'paused' }, '/v3-ia-02-paused'],
  ['ia02-ended', 'IA02.dc.html', { scenario: 'ended' }, '/v3-ia-02-ended'],
  ['ia02-none', 'IA02.dc.html', { scenario: 'none' }, '/v3-ia-02-none'],
];

const { values } = parseArgs({
  options: {
    harness: { type: 'string', default: 'http://localhost:3310' },
    widths: { type: 'string', default: '1440,1024,768,375' },
    only: { type: 'string' },
    runtime: { type: 'string', default: HISTORICAL_RUNTIME },
  },
});
const widths = values.widths.split(',').map(Number);
const only = values.only ? new Set(values.only.split(',')) : null;

/** The vendored scripts, each checked against tools/board-capture/vendor/SHA256SUMS.txt. */
function vendoredScripts() {
  const sums = new Map(
    readFileSync(join(VENDOR, 'SHA256SUMS.txt'), 'utf8')
      .trim()
      .split('\n')
      .map((line) => line.split(/\s+/))
      .map(([hash, file]) => [file, hash]),
  );
  const scripts = new Map();
  for (const [file, hash] of sums) {
    if (!file.startsWith('unpkg.com/')) continue;
    const body = readFileSync(join(VENDOR, file));
    if (createHash('sha256').update(body).digest('hex') !== hash) {
      throw new Error(`vendored ${file} does not match its checksum: STOP`);
    }
    scripts.set(`https://${file}`, body);
  }
  return scripts;
}

/** A temporary copy of the boards, their sheets and the runtime, served on 127.0.0.1. */
async function serveBoards() {
  const site = mkdtempSync(join(tmpdir(), 'xr-v3-reference-'));
  for (const file of ['SA01.dc.html', 'SA02.dc.html', 'IA01.dc.html', 'IA02.dc.html']) {
    copyFileSync(join(BOARDS, file), join(site, file));
  }
  for (const sheet of ['core.css', 'rb.css', 'rb-kit.css']) {
    copyFileSync(join(BOARDS, sheet), join(site, sheet));
  }
  copyFileSync(values.runtime, join(site, 'support.js'));
  const types = { html: 'text/html', css: 'text/css', js: 'text/javascript' };
  const server = createServer((request, response) => {
    const path = normalize(
      join(site, decodeURIComponent(new URL(request.url, 'http://x').pathname)),
    );
    try {
      if (!path.startsWith(site)) throw new Error('outside');
      const body = readFileSync(path);
      response.writeHead(200, { 'content-type': types[path.split('.').pop()] ?? 'text/plain' });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    close: () => {
      server.close();
      rmSync(site, { recursive: true, force: true });
    },
  };
}

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (const font of ['400 16px', '500 16px', '600 16px', '650 15px', '700 16px', '800 16px']) {
      await document.fonts.load(`${font} "Public Sans"`);
    }
  });
  await page.waitForTimeout(400);
}

/** Share of pixels whose channels differ by more than 24, measured in a page. */
async function pixelDiff(page, first, second) {
  return page.evaluate(
    async ([a, b]) => {
      const load = (data) =>
        new Promise((resolve) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.src = `data:image/png;base64,${data}`;
        });
      const [left, right] = await Promise.all([load(a), load(b)]);
      const width = Math.max(left.width, right.width);
      const height = Math.max(left.height, right.height);
      const pixels = (image) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.fillStyle = '#ff00ff';
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0);
        return context.getImageData(0, 0, width, height).data;
      };
      const p = pixels(left);
      const q = pixels(right);
      let different = 0;
      for (let i = 0; i < p.length; i += 4) {
        if (
          Math.abs(p[i] - q[i]) > 24 ||
          Math.abs(p[i + 1] - q[i + 1]) > 24 ||
          Math.abs(p[i + 2] - q[i + 2]) > 24
        ) {
          different += 1;
        }
      }
      return { different, share: different / (width * height) };
    },
    [first.toString('base64'), second.toString('base64')],
  );
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = join(here, '.runs', stamp);
mkdirSync(out, { recursive: true });
const scripts = vendoredScripts();
const boards = await serveBoards();
const browser = await chromium.launch();
const scratch = await browser.newPage();
const results = [];
try {
  for (const [name, board, props, specimen] of CASES) {
    if (only && !only.has(name)) continue;
    for (const width of widths) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
      });
      await context.route('https://unpkg.com/**', (route) => {
        const body = scripts.get(route.request().url());
        return body
          ? route.fulfill({
              status: 200,
              headers: { 'content-type': 'text/javascript', 'access-control-allow-origin': '*' },
              body,
            })
          : route.abort('blockedbyclient');
      });
      const page = await context.newPage();
      const boardErrors = [];
      page.on('pageerror', (error) => boardErrors.push(error.message));
      await page.goto(`${boards.origin}/${board}`);
      await page.waitForFunction(
        () => (document.querySelector('#dc-root .sc-host')?.children.length ?? 0) > 0,
        null,
        { timeout: 60_000 },
      );
      if (props) await page.evaluate((p) => window.__dcSetProps(window.__dcRootName(), p), props);
      await settle(page);
      const boardShot = await page.screenshot({
        fullPage: true,
        animations: 'disabled',
        caret: 'hide',
      });
      const product = await context.newPage();
      await product.goto(`${values.harness}${specimen}`);
      await settle(product);
      const reactShot = await product.screenshot({
        fullPage: true,
        animations: 'disabled',
        caret: 'hide',
      });
      writeFileSync(join(out, `${name}-${width}-board.png`), boardShot);
      writeFileSync(join(out, `${name}-${width}-react.png`), reactShot);
      const size = (target) =>
        target.evaluate(() => [
          document.documentElement.scrollWidth,
          document.documentElement.scrollHeight,
        ]);
      const [boardSize, reactSize] = await Promise.all([size(page), size(product)]);
      const diff = await pixelDiff(scratch, reactShot, boardShot);
      results.push({
        name,
        board,
        props,
        specimen,
        width,
        boardSize,
        reactSize,
        boardErrors,
        ...diff,
      });
      process.stdout.write(
        `${name.padEnd(12)} ${String(width).padStart(4)}  board ${boardSize.join('x').padEnd(10)} react ${reactSize.join('x').padEnd(10)} ${diff.different} pixels (${(diff.share * 100).toFixed(2)}%)${boardErrors.length ? ` — board errors: ${boardErrors.length}` : ''}\n`,
      );
      await context.close();
    }
  }
} finally {
  await browser.close();
  boards.close();
}
writeFileSync(join(out, 'results.json'), `${JSON.stringify(results, null, 2)}\n`);
process.stdout.write(`results: ${relativeTo(out)}\n`);

function relativeTo(path) {
  return path.startsWith(v2) ? path.slice(v2.length + 1) : path;
}

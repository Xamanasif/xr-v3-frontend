// Local render harness for .dc.html artboards (review only; never shipped or published).
// - serves a project folder over http
// - answers ./support.js with the Design host's runtime (artifact-type/dc-runtime.js, read from the canvas)
// - answers Google Fonts with local Public Sans (OFL, @fontsource-variable) because fonts.googleapis.com is blocked here
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/opt/npm-tools/node_modules/');
const { chromium } = require('playwright');

const TOOLS = '/home/claude/tools';
const RUNTIME = fs.readFileSync(path.join(TOOLS, 'dc-runtime.js'));
const FONT_LATIN = fs.readFileSync(path.join(TOOLS, 'ps-latin.woff2'));
const FONT_EXT = fs.readFileSync(path.join(TOOLS, 'ps-latin-ext.woff2'));
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };

export function startServer(root) {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (u.endsWith('/support.js')) { res.writeHead(200, { 'content-type': TYPES['.js'] }); res.end(RUNTIME); return; }
      if (u === '/__fonts/latin.woff2') { res.writeHead(200, { 'content-type': 'font/woff2' }); res.end(FONT_LATIN); return; }
      if (u === '/__fonts/latin-ext.woff2') { res.writeHead(200, { 'content-type': 'font/woff2' }); res.end(FONT_EXT); return; }
      const p = path.join(root, u);
      if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
      res.end(fs.readFileSync(p));
    });
    srv.listen(0, '127.0.0.1', () => resolve({ port: srv.address().port, close: () => srv.close() }));
  });
}

export async function launch() {
  const args = ['--disable-background-networking', '--disable-component-update', '--disable-sync', '--no-first-run', '--disable-default-apps', '--disable-domain-reliability', '--disable-client-side-phishing-detection'];
  return chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args }).catch(() => chromium.launch({ args }));
}

export async function openPage(browser, port, file, width, height = 900, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: opts.dpr || 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('response', r => { if (r.status() >= 400) errors.push('http ' + r.status() + ': ' + r.url()); });
  await page.route(/fonts\.googleapis\.com\/css2/, route => route.fulfill({ status: 200, contentType: 'text/css', body:
    `@font-face{font-family:'Public Sans';font-style:normal;font-weight:100 900;font-display:swap;src:url(http://127.0.0.1:${port}/__fonts/latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Public Sans';font-style:normal;font-weight:100 900;font-display:swap;src:url(http://127.0.0.1:${port}/__fonts/latin-ext.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}` }));
  await page.route(/fonts\.gstatic\.com/, route => route.abort());
  await page.goto(`http://127.0.0.1:${port}/${file}`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelector('.xr, .st-root, main, body > div:not([hidden])') !== null, null, { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(opts.settle || 350);
  return { ctx, page, errors };
}

// Elements that stick out past the viewport, and the document's own horizontal overflow.
export async function overflowReport(page) {
  return page.evaluate(() => {
    const W = document.documentElement.clientWidth;
    const out = { docScroll: document.documentElement.scrollWidth, width: W, offenders: [], clipped: [] };
    const isHidden = el => { const s = getComputedStyle(el); return s.display === 'none' || s.visibility === 'hidden' || el.closest('.xr-sr') || el.closest('[aria-hidden="true"] svg'); };
    for (const el of document.querySelectorAll('body *')) {
      if (isHidden(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (r.right > W + 1 || r.left < -1) {
        // ignore elements inside a horizontally scrolling container (tabs, switches)
        let p = el.parentElement, scroller = false;
        while (p && p !== document.body) { const s = getComputedStyle(p); if ((s.overflowX === 'auto' || s.overflowX === 'scroll' || s.overflowX === 'hidden') && p.getBoundingClientRect().right <= W + 1) { scroller = true; break; } p = p.parentElement; }
        if (!scroller) out.offenders.push({ tag: el.tagName.toLowerCase(), cls: (el.className && el.className.baseVal === undefined ? el.className : ''), text: (el.textContent || '').trim().slice(0, 60), left: Math.round(r.left), right: Math.round(r.right) });
      }
      // text clipped inside its own box (single-line nowrap overflow)
      const cs = getComputedStyle(el);
      if (el.children.length === 0 && el.textContent.trim() && el.scrollWidth > el.clientWidth + 2 && (cs.overflow === 'hidden' || cs.textOverflow === 'ellipsis' || cs.whiteSpace === 'nowrap') && cs.display !== 'inline') {
        out.clipped.push({ tag: el.tagName.toLowerCase(), cls: String(el.className), text: el.textContent.trim().slice(0, 60), sw: el.scrollWidth, cw: el.clientWidth });
      }
    }
    out.offenders = out.offenders.slice(0, 25);
    out.clipped = out.clipped.slice(0, 25);
    return out;
  });
}

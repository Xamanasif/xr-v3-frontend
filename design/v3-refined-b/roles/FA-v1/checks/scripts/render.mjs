// Local renderer for .dc.html artboards using the Design type's runtime (served as support.js).
// Usage: node render.mjs <serveRoot> <specs.json> <outDir>
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/opt/npm-tools/node_modules/');
const { chromium } = require('playwright');

const [,, root, specFile, outDir] = process.argv;
const specs = JSON.parse(fs.readFileSync(specFile, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let p = path.join(root, u);
  if (u.startsWith('/fa/')) { p = u.endsWith('/support.js') ? path.join(root, 'v3ref', 'support.js') : u.startsWith('/fa/T-') ? path.join(root, process.env.TW_DIR || 'tw', u.slice(4)) : path.join(process.env.FA_DIR || '', u.slice(4)); }
  if ((!p.startsWith(root) && !(process.env.FA_DIR && p.startsWith(process.env.FA_DIR))) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;
const fontCss = `@font-face{font-family:'Public Sans';font-style:normal;font-weight:100 900;font-display:swap;src:url(${base}/__fonts/public-sans-latin-ext-wght-normal.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'Public Sans';font-style:normal;font-weight:100 900;font-display:swap;src:url(${base}/__fonts/public-sans-latin-wght-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(async () => chromium.launch());
const results = [];
for (const spec of specs) {
  const ctx = await browser.newContext({ viewport: { width: spec.width, height: spec.vh || 900 }, deviceScaleFactor: spec.scale || 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/Failed to load resource/.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errors.push('http ' + r.status() + ' ' + r.url()); });
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: fontCss }));
  await page.route('https://fonts.gstatic.com/**', r => r.abort());
  const url = `${base}/${spec.file}`;
  await page.goto(url, { waitUntil: 'load' });
  try { await page.waitForFunction(() => { const r = document.getElementById('dc-root'); return r && r.innerText && r.innerText.length > 20; }, null, { timeout: 15000 }); } catch (e) { errors.push('timeout waiting for render'); }
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.waitForTimeout(spec.wait || 400);
  if (spec.actions) {
    for (const a of spec.actions) {
      try {
        if (a.click) await page.click(a.click, { timeout: 5000 });
        if (a.fill) await page.fill(a.fill, a.value, { timeout: 5000 });
        if (a.select) await page.selectOption(a.select, a.value, { timeout: 5000 });
        if (a.press) await page.keyboard.press(a.press);
        if (a.eval) await page.evaluate(a.eval);
        await page.waitForTimeout(a.wait || 250);
      } catch (e) { errors.push('action failed: ' + JSON.stringify(a) + ' ' + e.message.split('\n')[0]); }
    }
  }
  let h = await page.evaluate(() => Math.ceil(Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)));
  if (!spec.keepVh) {
    await page.setViewportSize({ width: spec.width, height: Math.min(h, 12000) });
    await page.waitForTimeout(250);
    h = await page.evaluate(() => Math.ceil(Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)));
  }
  const metrics = await page.evaluate(() => {
    const de = document.documentElement;
    const over = de.scrollWidth - de.clientWidth;
    const wide = [];
    const vw = de.clientWidth;
    document.querySelectorAll('#dc-root *').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > vw + 1) && !el.closest('.xr-sr')) {
        const cs = getComputedStyle(el);
        let clip = false; for (let a = el.parentElement; a; a = a.parentElement) { const st = getComputedStyle(a); if (/(auto|hidden|scroll|clip)/.test(st.overflowX) && a.getBoundingClientRect().right <= vw + 1) { clip = true; break; } }
        if (cs.position !== 'fixed') wide.push((clip ? '[clipped] ' : '') + (el.className && el.className.baseVal === undefined ? el.className : el.tagName) + ' r=' + Math.round(r.right) + ' "' + (el.textContent || '').trim().slice(0, 40) + '"');
      }
    });
    const small = [];
    document.querySelectorAll('#dc-root *').forEach(el => {
      if (!el.childNodes || ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      const fs = parseFloat(cs.fontSize);
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (fs < 13 && !el.closest('.xr-sr')) small.push(fs + 'px ' + el.textContent.trim().slice(0, 30));
    });
    const fontOk = document.fonts ? [...document.fonts].some(f => f.family.includes('Public Sans') && f.status === 'loaded') : false;
    return { overflowX: over, wide: wide.slice(0, 8), small: small.slice(0, 8), fontOk, title: document.title };
  });
  const shot = path.join(outDir, spec.name + '.png');
  if (!spec.noShot) await page.screenshot({ path: shot, fullPage: true });
  results.push({ name: spec.name, file: spec.file, width: spec.width, height: h, ...metrics, errors });
  if (spec.extra) { try { results[results.length-1].extra = await page.evaluate(spec.extra); } catch (e) { results[results.length-1].extra = 'ERR ' + e.message; } }
  await ctx.close();
}
await browser.close();
server.close();
fs.writeFileSync(path.join(outDir, 'results.json'), JSON.stringify(results, null, 1));
for (const r of results) console.log(JSON.stringify({ n: r.name, w: r.width, h: r.height, ox: r.overflowX, font: r.fontOk, err: r.errors.slice(0, 4), wide: r.wide.slice(0, 3), small: r.small.slice(0, 3) }));

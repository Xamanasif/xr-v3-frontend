// Journey runner: drives the live role preview through real clicks/typing and checks each step.
// Usage: FA_DIR=<project/> node journey.mjs <serveRoot> <journeys.json> <outDir>
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/opt/npm-tools/node_modules/');
const { chromium } = require('playwright');

const [,, root, jFile, outDir] = process.argv;
const journeys = JSON.parse(fs.readFileSync(jFile, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json', '.svg': 'image/svg+xml', '.csv': 'text/csv' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let p = path.join(root, u);
  if (u.startsWith('/fa/')) { p = u.endsWith('/support.js') ? path.join(root, 'v3ref', 'support.js') : u.startsWith('/fa/T-') ? path.join(root, process.env.TW_DIR || 'tw', u.slice(4)) : path.join(process.env.FA_DIR || '', u.slice(4)); }
  if ((!p.startsWith(root) && !(process.env.FA_DIR && p.startsWith(process.env.FA_DIR))) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const fontCss = `@font-face{font-family:'Public Sans';font-style:normal;font-weight:100 900;src:url(${base}/__fonts/public-sans-latin-wght-normal.woff2) format('woff2')}`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const report = [];
let totalOk = 0, totalFail = 0;
for (const j of journeys) {
  const ctx = await browser.newContext({ viewport: { width: j.width || 1440, height: j.vh || 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/Failed to load resource|never resolved/.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('favicon.ico')) errors.push('http ' + r.status() + ' ' + r.url()); });
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: fontCss }));
  await page.route('https://fonts.gstatic.com/**', r => r.abort());
  await page.goto(`${base}/${j.file}`, { waitUntil: 'load' });
  try { await page.waitForFunction(() => { const r = document.getElementById('dc-root'); return r && r.innerText && r.innerText.length > 20; }, null, { timeout: 15000 }); } catch (e) { errors.push('timeout waiting for render'); }
  await page.waitForTimeout(400);
  const steps = [];
  let n = 0;
  for (const s of j.steps) {
    n += 1;
    const label = s.label || JSON.stringify(s).slice(0, 110);
    let ok = true, why = '';
    try {
      if (s.click) await page.click(s.click, { timeout: 4000 });
      if (s.fill) await page.fill(s.fill, s.value, { timeout: 4000 });
      if (s.select) await page.selectOption(s.select, s.value, { timeout: 4000 });
      if (s.upload) await page.setInputFiles(s.upload, s.files.map(f => ({ name: f.name, mimeType: f.mime || 'text/csv', buffer: Buffer.from(f.text || '', 'utf8') })));
      if (s.press) await page.keyboard.press(s.press);
      if (s.focus) await page.focus(s.focus);
      if (s.click || s.fill || s.select || s.press || s.upload || s.focus) await page.waitForTimeout(s.wait || 250);
      else if (s.wait) await page.waitForTimeout(s.wait);
      if (s.expect) { const t = await page.evaluate(() => document.body.innerText); for (const x of [].concat(s.expect)) if (t.indexOf(x) < 0) { ok = false; why += 'missing “' + x + '” '; } }
      if (s.expectNot) { const t = await page.evaluate(() => document.body.innerText); for (const x of [].concat(s.expectNot)) if (t.indexOf(x) >= 0) { ok = false; why += 'unexpected “' + x + '” '; } }
      if (s.expectFocus) { await page.waitForTimeout(120); const id = await page.evaluate(() => document.activeElement ? (document.activeElement.id || document.activeElement.tagName + ':' + (document.activeElement.textContent || '').trim().slice(0, 30)) : ''); if (id !== s.expectFocus) { ok = false; why += 'focus on ' + id + ' not ' + s.expectFocus; } }
      if (s.assert) { const v = await page.evaluate(s.assert); if (!v) { ok = false; why += 'assert false: ' + s.assert.slice(0, 80); } }
      if (s.noOverflow) { const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); if (o > 0) { ok = false; why += 'overflowX ' + o; } }
      if (s.dump === 'body' && s.dumpMax === 1) { console.log('FOCUS #' + n + ' ' + await page.evaluate(() => window.__fi)); } else if (s.dump) { const t = await page.evaluate(sel => [...document.querySelectorAll(sel)].map(e => e.innerText).join('\n----\n'), s.dump); console.log('DUMP #' + n + ' ' + s.dump + '\n' + t.slice(0, s.dumpMax || 1500)); }
      if (s.shot) { await page.screenshot({ path: path.join(outDir, j.name + '--' + s.shot + '.png'), fullPage: !s.viewport }); }
    } catch (e) { ok = false; why = e.message.split('\n')[0]; }
    if (ok) totalOk += 1; else totalFail += 1;
    steps.push({ n, ok, label, why });
  }
  report.push({ name: j.name, width: j.width || 1440, steps, errors });
  console.log('== ' + j.name + ' @' + (j.width || 1440) + ': ' + steps.filter(x => x.ok).length + '/' + steps.length + (errors.length ? ' · console: ' + errors.slice(0, 3).join(' | ') : ''));
  for (const st of steps) if (!st.ok) console.log('   FAIL #' + st.n + ' ' + st.label + ' — ' + st.why);
  await ctx.close();
}
await browser.close();
server.close();
fs.writeFileSync(path.join(outDir, 'journeys.json'), JSON.stringify(report, null, 1));
console.log('TOTAL ok=' + totalOk + ' fail=' + totalFail);

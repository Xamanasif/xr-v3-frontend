// Link crawler: from each start state, click every visible in-role anchor (fresh page per click) and record where it lands.
// Usage: FA_DIR=<project/> node links.mjs <serveRoot> <starts.json> <out.json>
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/opt/npm-tools/node_modules/');
const { chromium } = require('playwright');
const [,, root, startFile, outFile] = process.argv;
const starts = JSON.parse(fs.readFileSync(startFile, 'utf8'));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let p = path.join(root, u);
  if (u.startsWith('/fa/')) { p = u.endsWith('/support.js') ? path.join(root, 'v3ref', 'support.js') : u.startsWith('/fa/T-') ? path.join(root, process.env.TW_DIR || 'tw', u.slice(4)) : path.join(process.env.FA_DIR || '', u.slice(4)); }
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
await page.route('https://fonts.gstatic.com/**', r => r.abort());
const load = async (file) => { await page.goto(`${base}/${file}`, { waitUntil: 'load' }); await page.waitForFunction(() => { const r = document.getElementById('fa-root'); return r && r.dataset.screen; }, null, { timeout: 15000 }); await page.waitForTimeout(150); };
const out = [];
for (const s of starts) {
  await load(s.file);
  const from = await page.evaluate(() => document.getElementById('fa-root').dataset.screen);
  const scope = s.rail ? '#fa-root' : '#fa-main';
  const list = await page.evaluate((scope) => {
    const vis = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden'; };
    return [...document.querySelectorAll(scope + ' a[href]')].map((a, i) => ({ i, href: a.getAttribute('href'), text: (a.getAttribute('aria-label') || a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80), vis: vis(a) })).filter(x => x.vis);
  }, scope);
  for (const l of list) {
    const rec = { start: s.name, from, control: l.text, href: l.href };
    if (/^#(FA|XS|NF)/.test(l.href) === false) { rec.kind = l.href.startsWith('data:') ? 'download (data: CSV template)' : l.href.startsWith('#fa-') ? 'in-page anchor' : 'other'; rec.landed = ''; rec.ok = l.href !== '#' && l.href !== ''; out.push(rec); continue; }
    await load(s.file);
    try {
      await page.evaluate(({ scope, i }) => { const a = document.querySelectorAll(scope + ' a[href]')[i]; a.click(); }, { scope, i: l.i });
      await page.waitForTimeout(220);
      const r = await page.evaluate(() => ({ screen: document.getElementById('fa-root') ? document.getElementById('fa-root').dataset.screen : '', h1: (document.querySelector('h1') || {}).textContent || '', hash: location.hash }));
      const want = l.href.slice(1);
      rec.kind = want.startsWith('XS') ? 'shared (XS, borrowed)' : 'in-role';
      rec.landed = r.screen; rec.h1 = r.h1.trim().slice(0, 60);
      rec.ok = r.screen.split(':')[0] === want || (want === 'FA-04' && r.screen === 'FA-04') ;
      if (!rec.ok) rec.note = 'href ' + l.href + ' landed on ' + r.screen;
      rec.hashKept = r.hash === '';
    } catch (e) { rec.ok = false; rec.note = e.message.split('\n')[0]; }
    out.push(rec);
  }
  const bad = out.filter(x => x.start === s.name && !x.ok);
  console.log(s.name + ' (' + from + '): ' + list.length + ' links' + (bad.length ? ' · MISMATCH: ' + bad.map(b => b.control + ' ' + (b.note || '')).join(' | ') : ''));
}
await browser.close(); server.close();
fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
console.log('links checked', out.length, '· not ok', out.filter(x => !x.ok).length);

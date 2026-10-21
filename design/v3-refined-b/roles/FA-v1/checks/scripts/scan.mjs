// Structural accessibility scan over rendered boards: names, labels, ids, references, link targets, banned copy.
// Usage: FA_DIR=<project/> node scan.mjs <serveRoot> <spec.json> <out.json>
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/opt/npm-tools/node_modules/');
const { chromium } = require('playwright');
const [,, root, specFile, outFile] = process.argv;
const specs = JSON.parse(fs.readFileSync(specFile, 'utf8'));
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
const fontCss = `@font-face{font-family:'Public Sans';font-weight:100 900;src:url(${base}/__fonts/public-sans-latin-wght-normal.woff2) format('woff2')}`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const out = [];
for (const s of specs) {
  const ctx = await browser.newContext({ viewport: { width: s.width, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: fontCss }));
  await page.route('https://fonts.gstatic.com/**', r => r.abort());
  await page.goto(`${base}/${s.file}`, { waitUntil: 'load' });
  try { await page.waitForFunction(() => { const r = document.getElementById('dc-root'); return r && r.innerText && r.innerText.length > 20; }, null, { timeout: 15000 }); } catch (e) {}
  await page.waitForTimeout(350);
  const issues = await page.evaluate(() => {
    const R = document.getElementById('dc-root') || document.body, iss = [];
    const vis = el => { const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const name = el => {
      const al = el.getAttribute('aria-label'); if (al && al.trim()) return al.trim();
      const lb = el.getAttribute('aria-labelledby'); if (lb) { const t = lb.split(/\s+/).map(id => { const x = document.getElementById(id); return x ? x.textContent : ''; }).join(' ').trim(); if (t) return t; }
      if (el.id) { const l = R.querySelector('label[for="' + CSS.escape(el.id) + '"]'); if (l && l.textContent.trim()) return l.textContent.trim(); }
      const pl = el.closest('label'); if (pl && pl.textContent.trim()) return pl.textContent.trim();
      return (el.textContent || '').trim();
    };
    R.querySelectorAll('button, a[href]').forEach(el => { if (!vis(el)) return; if (!name(el)) iss.push('unnamed ' + el.tagName.toLowerCase() + ' ' + (el.className || '')); });
    R.querySelectorAll('a').forEach(el => { const h = el.getAttribute('href'); if (h === '#' || h === '' || h === null) iss.push('placeholder link: ' + (el.textContent || '').trim().slice(0, 40)); });
    R.querySelectorAll('input, select, textarea').forEach(el => { if (el.type === 'hidden' || el.type === 'file' && el.getAttribute('aria-hidden') === 'true') return; if (!vis(el)) return; if (!name(el) && !(el.type === 'radio' || el.type === 'checkbox') ) iss.push('unlabelled ' + el.tagName.toLowerCase() + '#' + el.id); if ((el.type === 'radio' || el.type === 'checkbox') && !name(el)) iss.push('unlabelled ' + el.type + '#' + el.id); });
    const ids = {}; R.querySelectorAll('[id]').forEach(el => { ids[el.id] = (ids[el.id] || 0) + 1; }); Object.keys(ids).forEach(k => { if (ids[k] > 1) iss.push('duplicate id ' + k + ' ×' + ids[k]); });
    R.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls]').forEach(el => { ['aria-labelledby', 'aria-describedby', 'aria-controls'].forEach(a => { const v = el.getAttribute(a); if (!v) return; v.split(/\s+/).forEach(id => { if (id && !document.getElementById(id)) iss.push(a + ' → missing #' + id); }); }); });
    R.querySelectorAll('label[for]').forEach(l => { if (!document.getElementById(l.getAttribute('for'))) iss.push('label for missing #' + l.getAttribute('for')); });
    const h1 = [...R.querySelectorAll('h1')].filter(vis); if (h1.length !== 1) iss.push('h1 count ' + h1.length);
    const t = R.innerText;
    [/\blorem\b/i, /\bTODO\b/, /undefined/, /\bNaN\b/, /\[object/, /null\b/, /\d+(\.\d+)?\s?%(?! ·| ·)/].forEach(re => { const m = t.match(re); if (m && !(re.source.includes('%') && /Pass mark|pass mark|\d+%\s·|0–100|% ·/.test(t.slice(Math.max(0, m.index - 40), m.index + 20)))) iss.push('copy check: ' + m[0] + ' … ' + t.slice(Math.max(0, m.index - 30), m.index + 20).replace(/\n/g, ' ')); });
    return iss;
  });
  out.push({ name: s.name, width: s.width, issues });
  if (issues.length) console.log(s.name + ' @' + s.width + ': ' + issues.slice(0, 6).join(' | '));
  await ctx.close();
}
await browser.close(); server.close();
fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
console.log('scanned', out.length, 'boards; with issues:', out.filter(x => x.issues.length).length);

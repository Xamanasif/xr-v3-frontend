// Element screenshot comparison between two builds: node elcmp.mjs <serveRoot> <cases.json> <outDir>
// cases: [{name, fileA, dirA, faA, fileB, dirB, faB, sel, width}] — dir = harness wrapper dir, fa = project dir
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const require = createRequire('/opt/npm-tools/node_modules/'); const { chromium } = require('playwright');
const [,, root, caseFile, outDir] = process.argv;
const cases = JSON.parse(fs.readFileSync(caseFile, 'utf8')); fs.mkdirSync(outDir, { recursive: true });
let cfg = {};
const server = http.createServer((req, res) => { const u = decodeURIComponent(new URL(req.url, 'http://x').pathname); let p = path.join(root, u);
  if (u.startsWith('/fa/')) { p = u.endsWith('/support.js') ? path.join(root, 'v3ref', 'support.js') : u.startsWith('/fa/T-') ? path.join(root, cfg.dir, u.slice(4)) : path.join(cfg.fa, u.slice(4)); }
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': p.endsWith('.html') ? 'text/html' : p.endsWith('.css') ? 'text/css' : p.endsWith('.woff2') ? 'font/woff2' : 'text/javascript', 'cache-control': 'no-store' }); fs.createReadStream(p).pipe(res); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const fontCss = `@font-face{font-family:'Public Sans';font-weight:100 900;src:url(${base}/__fonts/public-sans-latin-wght-normal.woff2) format('woff2')}`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const shot = async (file, dir, fa, sel, width, out) => {
  cfg = { dir, fa };
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' }); const page = await ctx.newPage();
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: fontCss }));
  await page.goto(`${base}/${file}`, { waitUntil: 'load' });
  await page.waitForFunction(() => { const r = document.getElementById('dc-root'); return r && r.innerText && r.innerText.length > 20; }, null, { timeout: 15000 });
  await page.evaluate(() => document.fonts && document.fonts.ready); await page.waitForTimeout(400);
  const el = await page.$(sel); if (!el) { await ctx.close(); return 'missing ' + sel; }
  await el.screenshot({ path: out }); await ctx.close(); return 'ok';
};
const res = [];
for (const c of cases) {
  const a = await shot(c.fileA, c.dirA, c.faA, c.sel, c.width, path.join(outDir, c.name + '-A.png'));
  const b = await shot(c.fileB, c.dirB, c.faB, c.sel, c.width, path.join(outDir, c.name + '-B.png'));
  let same = false;
  if (a === 'ok' && b === 'ok') { const x = fs.readFileSync(path.join(outDir, c.name + '-A.png')), y = fs.readFileSync(path.join(outDir, c.name + '-B.png')); same = Buffer.compare(x, y) === 0; }
  res.push({ name: c.name, sel: c.sel, a, b, sameBytes: same });
}
await browser.close(); server.close();
fs.writeFileSync(path.join(outDir, 'elcmp.json'), JSON.stringify(res, null, 1));
for (const r of res) console.log(JSON.stringify(r));

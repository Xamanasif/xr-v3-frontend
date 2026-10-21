// Print outerHTML of matching elements: node dom.mjs <root> <file> <selector> [width] [maxChars]
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const require = createRequire('/opt/npm-tools/node_modules/'); const { chromium } = require('playwright');
const [,, root, file, sel, w, max] = process.argv;
const server = http.createServer((req, res) => { const u = decodeURIComponent(new URL(req.url, 'http://x').pathname); let p = path.join(root, u);
  if (u.startsWith('/fa/')) { p = u.endsWith('/support.js') ? path.join(root, 'v3ref', 'support.js') : u.startsWith('/fa/T-') ? path.join(root, process.env.TW_DIR || 'tw', u.slice(4)) : path.join(process.env.FA_DIR, u.slice(4)); }
  if (!fs.existsSync(p)) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': p.endsWith('.html') ? 'text/html' : p.endsWith('.css') ? 'text/css' : 'text/javascript' }); fs.createReadStream(p).pipe(res); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: +(w || 1440), height: 900 } });
await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
await page.goto(`http://127.0.0.1:${server.address().port}/${file}`); await page.waitForTimeout(1500);
console.log(await page.evaluate(([s, m]) => [...document.querySelectorAll(s)].map(b => b.outerHTML.slice(0, +m || 3000)).join('\n----\n'), [sel, max]));
await browser.close(); server.close();

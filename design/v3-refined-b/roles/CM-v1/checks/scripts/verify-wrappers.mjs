// Render the real canvas wrapper files at their board frame size (from canvas.json) and report
// heading, horizontal overflow, console errors, failed requests and content height vs frame height.
// usage: node verify-wrappers.mjs [prefix-filter] [outDir]
import { openBrowser, newPage, load } from './harness.mjs';
import fs from 'node:fs';
const R = '/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/render-cm';
const P = '/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/cm-role/project';
const [filter = '', outDir = ''] = process.argv.slice(2);
const canvas = JSON.parse(fs.readFileSync(P + '/canvas.json', 'utf8'));
const files = canvas.order.filter(f => f !== 'Main.dc.html' && f.startsWith(filter) && fs.existsSync(P + '/' + f));
if (outDir) fs.mkdirSync(outDir, { recursive: true });
const b = await openBrowser();
const out = [];
for (const f of files) {
  const bd = canvas.boards[f];
  const { context, page, log } = await newPage(b, R, { width: bd.w, height: bd.h });
  const bad = [];
  page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
  await load(page, f);
  await page.waitForTimeout(250);
  const info = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const clippedBy = el => { for (let p = el.parentElement; p; p = p.parentElement) { const st = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(st.overflowX)) return true; } return false; };
    const over = [];
    document.querySelectorAll('.xr *').forEach(el => { const r = el.getBoundingClientRect(); if (r.width && (r.right > vw + 0.5 || r.left < -0.5) && getComputedStyle(el).position !== 'fixed' && !el.closest('.xr-sr') && !el.closest('caption') && !clippedBy(el)) over.push(el.tagName); });
    return { h1: (document.querySelector('h1') || {}).textContent || '', sw: document.documentElement.scrollWidth, vw, h: document.documentElement.scrollHeight, over: over.length, dialog: !!document.querySelector('[role="dialog"]'), title: document.title };
  });
  if (outDir) await page.screenshot({ path: outDir + '/' + f.replace('.dc.html', '.png'), fullPage: false });
  const errs = log.slice(); // every console error or warning, unfiltered
  const ok = info.sw === bd.w && !info.over && !errs.length && !bad.length && info.h <= bd.h + 1 && info.h1;
  out.push({ f, w: bd.w, frameH: bd.h, contentH: info.h, scrollW: info.sw, overflowEls: info.over, h1: info.h1.trim(), dialog: info.dialog, ok: !!ok, fitsFrame: info.h <= bd.h + 1, errs, bad });
  console.log((ok ? 'OK  ' : 'BAD ') + f + ' · ' + bd.w + '×' + bd.h + ' · content ' + info.h + ' · ' + info.h1.trim().slice(0, 50) + (info.dialog ? ' · dialog open' : '') + (errs.length ? ' · ERR ' + errs[0] : '') + (bad.length ? ' · 404 ' + bad[0] : '') + (info.over ? ' · overflow ' + info.over : ''));
  await context.close();
}
fs.writeFileSync('/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/tools/verify-' + (filter || 'all') + '.json', JSON.stringify(out, null, 1));
console.log(out.filter(x => x.ok).length + ' / ' + out.length + ' boards OK');
await b.close();

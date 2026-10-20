// Render many Main states at one or more widths in one browser session.
// usage: node batch.mjs <outDir> <widths comma> <cases.json>
// cases.json: [{ "n": "name", "screen": "...", "record": "...", "preset": "...", "scenario": "main" }]
import { openBrowser, newPage, load } from './harness.mjs';
import fs from 'node:fs';
const [outDir, widths, casesFile] = process.argv.slice(2);
const R = '/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/render-cm';
const esc = v => String(v || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const cases = JSON.parse(fs.readFileSync(casesFile, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });
const head = fs.readFileSync(R + '/Main.dc.html', 'utf8').split('<body>')[0];
const b = await openBrowser();
const results = [];
for (const w of widths.split(',').map(Number)) {
  for (const c of cases) {
    const name = 'T-' + Math.random().toString(36).slice(2, 8) + '.dc.html';
    fs.writeFileSync(R + '/' + name, head.replace(/<title>.*?<\/title>/, '<title>test</title>') + `<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400..800&amp;display=swap" rel="stylesheet">
<style>body{margin:0;background:#F3F4F9}</style>
</helmet>
<dc-import name="Main" screen="${esc(c.screen)}" record="${esc(c.record)}" preset="${esc(c.preset)}" scenario="${esc(c.scenario || 'main')}" handoffs="${esc(c.handoffs || 'true')}" hint-size="100%,900px"></dc-import>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${w},"height":900}}'>
class Component extends DCLogic { renderVals() { return {}; } }
</script>
</body></html>`);
    const { context, page, log } = await newPage(b, R, { width: w, height: 900 });
    const bad = [];
    page.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
    await load(page, name);
    await page.waitForTimeout(250);
    const h = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
    if (!c.fixed) await page.setViewportSize({ width: w, height: Math.min(h, 9000) });
    await page.waitForTimeout(200);
    const info = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const over = [];
      const clippedBy = el => { for (let p = el.parentElement; p; p = p.parentElement) { const st = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(st.overflowX)) return true; } return false; };
      document.querySelectorAll('.xr *').forEach(el => { const r = el.getBoundingClientRect(); if (r.width && (r.right > vw + 0.5 || r.left < -0.5)) { const st = getComputedStyle(el); if (st.position !== 'fixed' && !el.closest('.xr-sr') && !el.classList.contains('xr-sr') && !el.closest('caption') && !clippedBy(el)) over.push((typeof el.className === 'string' && el.className ? el.className : el.tagName) + ' r=' + Math.round(r.right)); } });
      // text that is cut by its own box (ellipsis or overflow hidden) — reported for review
      const cut = [];
      document.querySelectorAll('.xr button, .xr a, .xr th, .xr td, .xr span, .xr p, .xr h1, .xr h2, .xr h3, .xr label, .xr dt, .xr dd').forEach(el => { const st = getComputedStyle(el); if (el.closest('.xr-sr') || el.classList.contains('xr-sr') || el.closest('caption') || el.closest('[aria-hidden="true"]')) return; if ((st.overflowX === 'hidden' || st.textOverflow === 'ellipsis') && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) cut.push((el.textContent || '').trim().slice(0, 50)); });
      // tap targets under 24px (WCAG 2.2 minimum) among visible interactive elements
      const small = [];
      document.querySelectorAll('.xr button, .xr a[href], .xr input, .xr select, .xr textarea, .xr [tabindex="0"]').forEach(el => { const r = el.getBoundingClientRect(); const st = getComputedStyle(el); if (!r.width || st.visibility === 'hidden' || el.closest('.xr-sr') || el.type === 'hidden') return; if (el.type === 'checkbox' || el.type === 'radio') return; if (r.height < 24 || r.width < 24) small.push((el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 40) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); });
      // smallest rendered font size of visible text
      let minFs = 99, minTxt = '';
      const walker = document.createTreeWalker(document.querySelector('.xr') || document.body, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) { const t = walker.currentNode; if (!t.textContent.trim()) continue; const el = t.parentElement; if (!el || el.closest('.xr-sr') || el.closest('caption') || el.closest('svg')) continue; const r = el.getBoundingClientRect(); if (!r.width) continue; const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < minFs) { minFs = fs; minTxt = t.textContent.trim().slice(0, 30); } }
      return { h1: [...document.querySelectorAll('h1')].map(x => x.textContent.trim()).join(' | '), sw: document.documentElement.scrollWidth, vw, h: document.documentElement.scrollHeight, over: over.slice(0, 10), cut: cut.slice(0, 8), small: small.slice(0, 8), minFs, minTxt };
    });
    const file = `${outDir}/${c.n}-${w}.png`;
    await page.screenshot({ path: file, fullPage: !c.fixed });
    const errs = log.slice(); // every console error or warning, unfiltered
    results.push({ n: c.n, w, ...info, errs, bad: [...new Set(bad)] });
    console.log(JSON.stringify({ n: c.n, w, h1: info.h1, sw: info.sw, h: info.h, over: info.over, cut: info.cut, small: info.small, minFs: info.minFs, minTxt: info.minTxt, errs, bad: [...new Set(bad)] }));
    fs.unlinkSync(R + '/' + name);
    await context.close();
  }
}
fs.writeFileSync(`${outDir}/results.json`, JSON.stringify(results, null, 1));
await b.close();

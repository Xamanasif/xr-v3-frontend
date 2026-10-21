// Student final: every identifier-looking string in the visible text of every case — to prove which identifiers a student can see.
// usage: WIDTHS=1440 node fx_ids.mjs cases.json out.json
import fs from 'node:fs';
import path from 'node:path';
import { startServer, launch, openPage } from '../harness.mjs';
const SRC = '/home/claude/work/project';
const BED = process.env.BED || '/home/claude/work/fxidbed';
const cases = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3];
fs.mkdirSync(BED, { recursive: true });
for (const f of fs.readdirSync(SRC)) fs.copyFileSync(path.join(SRC, f), path.join(BED, f));
const attr = (k, v) => v === undefined || v === '' ? '' : ` ${k}="${v}"`;
for (const c of cases) {
  const html = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>${c.name}</title><script src="./support.js"></script><link rel="stylesheet" href="./core.css"><link rel="stylesheet" href="./rb.css"><link rel="stylesheet" href="./rb-kit.css"><link rel="stylesheet" href="./v3-student-final.css"></head><body>\n<x-dc>\n<helmet><style>body{margin:0}</style></helmet>\n<dc-import name="StudentFinal"${attr('scenario', c.scenario)}${attr('screen', c.screen)}${attr('preset', c.preset)}${attr('data-state', c.dataState)} chrome="${c.chrome || 'none'}" hint-size="100%,100%"></dc-import>\n</x-dc>\n<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":1200}}'>\nclass Component extends DCLogic { renderVals() { return {}; } }\n</script>\n</body></html>\n`;
  fs.writeFileSync(path.join(BED, `case-${c.name}.dc.html`), html);
}
const widths = (process.env.WIDTHS || '1440').split(',').map(Number);
const srv = await startServer(BED);
const browser = await launch();
const hits = {};
for (const c of cases) {
  for (const w of widths) {
    const { ctx, page } = await openPage(browser, srv.port, `case-${c.name}.dc.html`, w, c.height || 900, { settle: 400 });
    if (c.steps) for (const s of c.steps) { try { if (s.click) await page.click(s.click, { timeout: 3000 }); if (s.fill) await page.fill(s.fill[0], s.fill[1], { timeout: 3000 }); if (s.check) await page.check(s.check, { timeout: 3000 }); if (s.select) await page.selectOption(s.select[0], s.select[1], { timeout: 3000 }); if (s.press) await page.keyboard.press(s.press); if (s.wait) await page.waitForTimeout(s.wait); } catch (e) {} await page.waitForTimeout(s.after || 100); }
    const found = await page.evaluate(() => {
      // visible text, plus anything only a screen reader hears
      const txt = document.body.innerText + ' ' + [...document.querySelectorAll('.xr-sr, [aria-label]')].map(e => (e.getAttribute('aria-label') || '') + ' ' + e.textContent).join(' ');
      const pats = [/\b[A-Z]{2,6}-[A-Z0-9]{1,6}(?:-[A-Z0-9]{1,6})?\b/g, /\b[A-Z]{2,6}\s?[A-Z]{1,2}\d{3,}\b/g, /\b[A-Z]{2,6}\d{3,}\b/g];
      const s = new Set();
      for (const p of pats) for (const m of txt.match(p) || []) s.add(m);
      return [...s];
    });
    for (const f of found) (hits[f] = hits[f] || new Set()).add(c.name + '@' + w);
    await ctx.close();
  }
}
await browser.close(); srv.close();
const res = Object.fromEntries(Object.entries(hits).sort().map(([k, v]) => [k, { cases: v.size, examples: [...v].slice(0, 4) }]));
fs.writeFileSync(out, JSON.stringify({ widths, casesScanned: cases.length, identifiersSeenByAStudent: res }, null, 1));
console.log(Object.entries(res).map(([k, v]) => `${k} (${v.cases})`).join('  '));

// Student final: find scroll containers whose content is wider than the box (a tab or label partly hidden until scrolled).
// usage: WIDTHS=375,320 node fx_scroll.mjs cases.json out.json [extra.css]
import fs from 'node:fs';
import path from 'node:path';
import { startServer, launch, openPage } from '../harness.mjs';
const SRC = '/home/claude/work/project';
const BED = process.env.BED || '/home/claude/work/fxscrollbed';
const cases = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3];
const extra = process.argv[4] ? fs.readFileSync(process.argv[4], 'utf8') : '';
fs.mkdirSync(BED, { recursive: true });
for (const f of fs.readdirSync(SRC)) fs.copyFileSync(path.join(SRC, f), path.join(BED, f));
const attr = (k, v) => v === undefined || v === '' ? '' : ` ${k}="${v}"`;
for (const c of cases) {
  const html = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>${c.name}</title><script src="./support.js"></script><link rel="stylesheet" href="./core.css"><link rel="stylesheet" href="./rb.css"><link rel="stylesheet" href="./rb-kit.css"><link rel="stylesheet" href="./v3-student-final.css"></head><body>\n<x-dc>\n<helmet><style>body{margin:0}</style></helmet>\n<dc-import name="StudentFinal"${attr('scenario', c.scenario)}${attr('screen', c.screen)}${attr('preset', c.preset)}${attr('data-state', c.dataState)} chrome="${c.chrome || 'none'}" hint-size="100%,100%"></dc-import>\n</x-dc>\n<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":1200}}'>\nclass Component extends DCLogic { renderVals() { return {}; } }\n</script>\n</body></html>\n`;
  fs.writeFileSync(path.join(BED, `case-${c.name}.dc.html`), html);
}
const widths = (process.env.WIDTHS || '375').split(',').map(Number);
const srv = await startServer(BED);
const browser = await launch();
const res = [];
for (const c of cases) {
  for (const w of widths) {
    if (c.widths && !c.widths.includes(w) && w !== 320) continue;
    const { ctx, page } = await openPage(browser, srv.port, `case-${c.name}.dc.html`, w, c.height || 900, { settle: 400 });
    if (extra) { await page.addStyleTag({ content: extra }); await page.waitForTimeout(150); }
    if (c.steps) {
      for (const s of c.steps) {
        try {
          if (s.click) await page.click(s.click, { timeout: 3000 });
          if (s.fill) await page.fill(s.fill[0], s.fill[1], { timeout: 3000 });
          if (s.check) await page.check(s.check, { timeout: 3000 });
          if (s.select) await page.selectOption(s.select[0], s.select[1], { timeout: 3000 });
          if (s.press) await page.keyboard.press(s.press);
          if (s.wait) await page.waitForTimeout(s.wait);
        } catch (e) { /* the shoot run reports step errors */ }
        await page.waitForTimeout(s.after || 120);
      }
    }
    const hidden = await page.evaluate(() => {
      const found = [];
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || !(cs.overflowX === 'auto' || cs.overflowX === 'scroll' || cs.overflowX === 'hidden')) continue;
        const r = el.getBoundingClientRect(); if (r.width <= 2 || r.height <= 2) continue;   // visually hidden labels
        if (cs.textOverflow === 'ellipsis') continue;   // deliberate truncation
        if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.tagName === 'SELECT') continue;
        const extra = el.scrollWidth - el.clientWidth;
        if (extra > 1) {
          // which children are not fully visible inside the box
          const box = el.getBoundingClientRect();
          const cut = [...el.querySelectorAll('a, button, [role=tab], li, th, td')].filter(k => { const kr = k.getBoundingClientRect(); return kr.width > 0 && (kr.right > box.right + 1 || kr.left < box.left - 1); }).map(k => k.textContent.trim().replace(/\s+/g, ' ').slice(0, 30));
          found.push({ el: String(el.className || el.tagName).slice(0, 50), overflowX: cs.overflowX, extra, cut: [...new Set(cut)].slice(0, 6) });
        }
      }
      return found;
    });
    res.push({ name: c.name, screen: c.screen, w, hidden });
    await ctx.close();
  }
}
await browser.close(); srv.close();
const bad = res.filter(r => r.hidden.length);
fs.writeFileSync(out, JSON.stringify({ pages: res.length, withHidden: bad.length, bad }, null, 1));
console.log('pages', res.length, 'with hidden overflow', bad.length);

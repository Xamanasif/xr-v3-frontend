// Student final: buttons that the stylesheet makes full width (width:100%) but that do not reach the full width of their section,
// because a parent shrinks to fit its content (a content-dependent half-width button).
// usage: WIDTHS=375,320 node fx_btnw.mjs cases.json out.json [extra.css]
import fs from 'node:fs';
import path from 'node:path';
import { startServer, launch, openPage } from '../harness.mjs';
const SRC = '/home/claude/work/project';
const BED = process.env.BED || '/home/claude/work/fxbtnbed';
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
    const found = await page.evaluate(() => {
      const bad = [];
      for (const b of document.querySelectorAll('.rb-btn')) {
        const cs = getComputedStyle(b); if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const r = b.getBoundingClientRect(); if (!r.width) continue;
        let spec; try { spec = b.computedStyleMap().get('width'); } catch (e) { continue; }
        if (!(spec && spec.unit === 'percent' && spec.value === 100)) continue;
        // the section the button belongs to: the nearest ancestor with horizontal padding (card section, cell, panel)
        let a = b.parentElement, sec = null;
        for (; a && a !== document.body; a = a.parentElement) {
          const acs = getComputedStyle(a);
          if (acs.display === 'contents' || acs.display === 'inline') continue;
          if (parseFloat(acs.paddingLeft) >= 8 && parseFloat(acs.paddingRight) >= 8) { sec = a; break; }
        }
        if (!sec) continue;
        const scs = getComputedStyle(sec), sr = sec.getBoundingClientRect();
        const inner = sr.width - parseFloat(scs.paddingLeft) - parseFloat(scs.paddingRight) - parseFloat(scs.borderLeftWidth) - parseFloat(scs.borderRightWidth);
        if (r.width < inner - 2) bad.push({ btn: b.textContent.trim().replace(/\s+/g, ' ').slice(0, 30), act: String(b.parentElement.className).slice(0, 40), section: String(sec.className || sec.tagName).slice(0, 40), btnW: Math.round(r.width), sectionW: Math.round(inner) });
      }
      return bad;
    });
    res.push({ name: c.name, screen: c.screen, w, found });
    await ctx.close();
  }
}
await browser.close(); srv.close();
const bad = res.filter(r => r.found.length);
fs.writeFileSync(out, JSON.stringify({ pages: res.length, withShortButtons: bad.length, bad }, null, 1));
console.log('pages', res.length, 'with short full-width buttons', bad.length);

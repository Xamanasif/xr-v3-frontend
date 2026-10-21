// Hover feedback coverage at 1440: every visible link, button, select, text field and choice on each page is hovered;
// a control whose pixels do not change on hover is listed (current-page items and disabled controls are expected there).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { startServer, launch, openPage } from '../harness.mjs';
const SRC = '/home/claude/work/project', BED = '/home/claude/work/fxhoverbed';
const cases = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
fs.rmSync(BED, { recursive: true, force: true }); fs.mkdirSync(BED, { recursive: true });
for (const f of fs.readdirSync(SRC)) fs.copyFileSync(path.join(SRC, f), path.join(BED, f));
const attr = (k, v) => v === undefined || v === '' ? '' : ` ${k}="${v}"`;
for (const c of cases) fs.writeFileSync(path.join(BED, `case-${c.name}.dc.html`), `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>${c.name}</title><script src="./support.js"></script><link rel="stylesheet" href="./core.css"><link rel="stylesheet" href="./rb.css"><link rel="stylesheet" href="./rb-kit.css"><link rel="stylesheet" href="./v3-student-final.css"></head><body>\n<x-dc>\n<helmet><style>body{margin:0}</style></helmet>\n<dc-import name="StudentFinal"${attr('scenario', c.scenario)}${attr('screen', c.screen)}${attr('preset', c.preset)}${attr('data-state', c.dataState)} chrome="none" hint-size="100%,100%"></dc-import>\n</x-dc>\n<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":1200}}'>\nclass Component extends DCLogic { renderVals() { return {}; } }\n</script>\n</body></html>\n`);
const srv = await startServer(BED); const browser = await launch();
const h = b => crypto.createHash('sha1').update(b).digest('hex');
const out = [];
for (const c of cases) {
  const { ctx, page } = await openPage(browser, srv.port, `case-${c.name}.dc.html`, 1440, 900, { settle: 400 });
  const n = await page.evaluate(() => { const els = [...document.querySelectorAll('a[href], button, select, input:not([type=radio]):not([type=checkbox]), textarea, label.rk-choice, .sv-lk-o')].filter(e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && !e.closest('.xr-sr') && !e.closest('[aria-hidden="true"]'); }); els.forEach((e, i) => e.setAttribute('data-hv', i)); return els.length; });
  const none = [];
  for (let i = 0; i < n; i++) {
    const loc = page.locator(`[data-hv="${i}"]`);
    try {
      await loc.scrollIntoViewIfNeeded({ timeout: 2000 }); await page.mouse.move(1, 1); await page.waitForTimeout(40);
      const bb = await loc.boundingBox(); if (!bb) continue;
      const clip = { x: Math.max(0, bb.x - 4), y: Math.max(0, bb.y - 4), width: Math.min(bb.width + 8, 1440 - Math.max(0, bb.x - 4)), height: bb.height + 8 };
      const a = h(await page.screenshot({ clip }));
      await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.waitForTimeout(170);
      const b = h(await page.screenshot({ clip }));
      if (a === b) none.push(await loc.evaluate(e => (e.tagName.toLowerCase() + '.' + String(e.className).split(' ').slice(0, 2).join('.') + (e.getAttribute('aria-current') ? '[current]' : '') + (e.disabled ? '[disabled]' : '') + ' “' + (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30) + '”')));
    } catch (e) { }
  }
  out.push({ case: c.name, controls: n, noHover: none });
  console.log(`${c.name} · ${n} controls · no hover change: ${none.length ? none.join(' | ') : 'none'}`);
  await ctx.close();
}
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
await browser.close(); srv.close();

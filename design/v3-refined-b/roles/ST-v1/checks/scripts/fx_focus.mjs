// Keyboard focus check on the final Student design: Tab through every page of the given cases and, at each stop,
// prove a visible focus indicator by pixels (the area around the focused control differs from the same area unfocused),
// that the control is on screen, and that Tab leaves the page (no trap) except inside a modal dialog or the menu drawer.
// usage: node fx_focus.mjs cases.json out.json   (WIDTHS env)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { startServer, launch, openPage } from '../harness.mjs';
const SRC = '/home/claude/work/project', BED = process.env.BED || '/home/claude/work/fxfocusbed';
const cases = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
fs.rmSync(BED, { recursive: true, force: true }); fs.mkdirSync(BED, { recursive: true });
for (const f of fs.readdirSync(SRC)) fs.copyFileSync(path.join(SRC, f), path.join(BED, f));
const attr = (k, v) => v === undefined || v === '' ? '' : ` ${k}="${v}"`;
for (const c of cases) fs.writeFileSync(path.join(BED, `case-${c.name}.dc.html`), `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>${c.name}</title><script src="./support.js"></script><link rel="stylesheet" href="./core.css"><link rel="stylesheet" href="./rb.css"><link rel="stylesheet" href="./rb-kit.css"><link rel="stylesheet" href="./v3-student-final.css"></head><body>\n<x-dc>\n<helmet><style>body{margin:0}</style></helmet>\n<dc-import name="StudentFinal"${attr('scenario', c.scenario)}${attr('screen', c.screen)}${attr('preset', c.preset)}${attr('data-state', c.dataState)} chrome="none" hint-size="100%,100%"></dc-import>\n</x-dc>\n<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":1200}}'>\nclass Component extends DCLogic { renderVals() { return {}; } }\n</script>\n</body></html>\n`);
const srv = await startServer(BED); const browser = await launch();
const widths = (process.env.WIDTHS || '1440,375').split(',').map(Number);
const h = b => crypto.createHash('sha1').update(b).digest('hex');
const report = [];
for (const c of cases) for (const w of widths) {
  const { ctx, page, errors } = await openPage(browser, srv.port, `case-${c.name}.dc.html`, w, 900, { settle: 400 });
  const stops = [], problems = [];
  const first = await page.evaluate(() => document.activeElement && document.activeElement.tagName);
  let prevKey = null, loops = 0;
  for (let i = 0; i < 90; i++) {
    await page.keyboard.press('Tab'); await page.waitForTimeout(60);
    const info = await page.evaluate(() => {
      const a = document.activeElement; if (!a || a === document.body) return null;
      a.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      const r = a.getBoundingClientRect(); const lab = a.closest('label');
      const box = (lab && getComputedStyle(a).opacity === '0') ? lab.getBoundingClientRect() : r;
      const nm = (a.getAttribute('aria-label') || a.textContent || (a.id && document.querySelector(`label[for="${a.id}"]`)?.textContent) || a.value || '').trim().replace(/\s+/g, ' ').slice(0, 40);
      return { key: a.tagName + '#' + a.id + '.' + String(a.className).slice(0, 30) + '|' + nm, tag: a.tagName.toLowerCase(), name: nm, inDialog: !!a.closest('[role="dialog"]'),
        x: Math.round(box.left), y: Math.round(box.top), w: Math.round(box.width), h: Math.round(box.height), vw: innerWidth, vh: innerHeight };
    });
    if (!info) { stops.push({ end: true }); break; }
    if (stops.length && stops.some(s => s.key === info.key)) { loops++; if (!info.inDialog) { if (loops > 1) break; } else break; }
    // pixels around the control, focused vs blurred
    const pad = 6, clip = { x: Math.max(0, info.x - pad), y: Math.max(0, info.y - pad), width: Math.min(info.w + 2 * pad, info.vw - Math.max(0, info.x - pad)), height: Math.min(info.h + 2 * pad, info.vh - Math.max(0, info.y - pad)) };
    let visible = null;
    if (clip.width > 2 && clip.height > 2) {
      const f1 = h(await page.screenshot({ clip }));
      await page.evaluate(() => document.activeElement.blur()); await page.waitForTimeout(40);
      const f0 = h(await page.screenshot({ clip }));
      visible = f1 !== f0;
    }
    const onScreen = info.y >= -1 && info.y + info.h <= info.vh + 1 && info.x >= -1 && info.x + info.w <= info.vw + 1;
    stops.push({ key: info.key, name: info.name, tag: info.tag, visible, onScreen, inDialog: info.inDialog });
    if (visible === false) problems.push('no visible focus: ' + info.key);
    if (!onScreen) problems.push('off screen: ' + info.key);
  }
  const ended = stops.some(s => s.end); const dialog = stops.some(s => s.inDialog);
  if (!ended && !dialog) problems.push('Tab did not leave the page within 90 stops (possible trap)');
  report.push({ case: c.name, w, stops: stops.filter(s => !s.end).length, problems, errors: errors.slice(0, 2), order: stops.filter(s => !s.end).map(s => s.name) });
  console.log(`${c.name} @${w} · ${stops.filter(s => !s.end).length} stops · ${problems.length ? problems.slice(0, 4).join(' | ') : 'focus visible at every stop'}`);
  await ctx.close();
}
fs.writeFileSync(process.argv[3], JSON.stringify(report, null, 1));
console.log('pages', report.length, '· with problems', report.filter(r => r.problems.length).length);
await browser.close(); srv.close();

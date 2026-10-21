// Interaction-state evidence for the final Student components, captured on real pages:
// default · hover · keyboard focus · pressed, for each control below. Writes crops + states.json; fx_states_sheet.py builds the sheet.
import fs from 'node:fs';
import path from 'node:path';
import { startServer, launch, openPage } from '../harness.mjs';
const SRC = '/home/claude/work/project', BED = '/home/claude/work/fxstatesbed', OUT = process.argv[2];
fs.rmSync(BED, { recursive: true, force: true }); fs.mkdirSync(BED, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(SRC)) fs.copyFileSync(path.join(SRC, f), path.join(BED, f));
const T = [
  ['primary', 'Primary action (gold) · ST-01', 'learn', 'ST-01', '', 'main .rb-btn--primary'],
  ['secondary', 'Secondary button · ST-08', 'learn', 'ST-08', '', 'main .sv-launch-help .rb-btn, main .sv-launch-foot .rb-btn'],
  ['link', 'Text link · ST-09 AR', 'learn', 'ST-09ar', '', 'main .sv-refuse .sv-link'],
  ['nav', 'Rail item (not current)', 'learn', 'ST-02', '', '.rb-rail nav[aria-label="Student navigation"] a:not([aria-current="page"])'],
  ['tab', 'Section tab · hub (Resources)', 'learn', 'ST-05', '', 'main .rk-tabs .rk-tab:nth-child(2)'],
  ['crumb', 'Breadcrumb link · ST-05', 'learn', 'ST-05', '', 'main .rk-crumbs a'],
  ['open', 'Resource Open · ST-06', 'learn', 'ST-06', '', 'main .sv-res .rb-btn'],
  ['select', 'Filter select · ST-15 Status', 'learn', 'ST-15', '', 'main select#st-p-st'],
  ['input', 'Search field · ST-04', 'learn', 'ST-04', '', 'main input[type="search"], main .rk-input'],
  ['choice', 'Answer choice · ST-13', 'inprog', 'ST-13', '', 'main .sv-qs > li:nth-child(2) .rk-choice:nth-child(2)'],
  ['qnum', 'Navigator number · ST-13', 'inprog', 'ST-13', '', '.st-strip li:nth-child(2) a'],
  ['rating', 'Rating cell · ST-16', 'vrdone', 'ST-16v', '', 'main .sv-lk-q:nth-of-type(2) label, main .sv-fb label'],
  ['textarea', 'Comment field · ST-16', 'vrdone', 'ST-16v', '', 'main textarea'],
  ['byq', 'Marks chip · ST-14', 'released', 'ST-14', '', 'main .sv-byq li:nth-child(2) a'],
  ['disclose', 'Setup disclosure · ST-09', 'learn', 'ST-09', '', 'main .st-disclose, main .sv-disclose'],
  ['acct', 'Account button (XS-05)', 'learn', 'ST-01', '', '#st-acct'],
];
const attr = (k, v) => v === undefined || v === '' ? '' : ` ${k}="${v}"`;
for (const [k, , sc, scr, preset] of T) fs.writeFileSync(path.join(BED, `s-${k}.dc.html`), `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>${k}</title><script src="./support.js"></script><link rel="stylesheet" href="./core.css"><link rel="stylesheet" href="./rb.css"><link rel="stylesheet" href="./rb-kit.css"><link rel="stylesheet" href="./v3-student-final.css"></head><body>\n<x-dc>\n<helmet><style>body{margin:0}</style></helmet>\n<dc-import name="StudentFinal"${attr('scenario', sc)}${attr('screen', scr)}${attr('preset', preset)} chrome="none" hint-size="100%,100%"></dc-import>\n</x-dc>\n<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":1200}}'>\nclass Component extends DCLogic { renderVals() { return {}; } }\n</script>\n</body></html>\n`);
const srv = await startServer(BED); const browser = await launch();
const res = [];
for (const [k, label, sc, scr, preset, sel] of T) {
  const { ctx, page, errors } = await openPage(browser, srv.port, `s-${k}.dc.html`, 1440, 900, { settle: 400 });
  const loc = page.locator(sel).filter({ visible: true }).first();
  if (!(await loc.count())) { res.push({ k, label, missing: sel }); console.log('MISSING', k, sel); await ctx.close(); continue; }
  await loc.evaluate(el => el.scrollIntoView({ block: 'center' })); await page.waitForTimeout(120);
  const bb = await loc.boundingBox(); const pad = 14;
  const clip = { x: Math.max(0, bb.x - pad), y: Math.max(0, bb.y - pad), width: Math.min(bb.width + pad * 2, 1440 - Math.max(0, bb.x - pad)), height: bb.height + pad * 2 };
  const shots = {};
  await page.mouse.move(2, 2); await page.waitForTimeout(60);
  shots.default = await page.screenshot({ clip });
  await loc.hover(); await page.waitForTimeout(160); shots.hover = await page.screenshot({ clip });
  await page.mouse.move(2, 2); await page.keyboard.press('Shift');
  await loc.evaluate(el => { const f = el.matches('a,button,input,select,textarea,[tabindex]') ? el : el.querySelector('a,button,input,select,textarea,[tabindex]'); (f || el).focus(); });
  await page.waitForTimeout(120);
  const fv = await page.evaluate(() => { const a = document.activeElement; return a && a.matches(':focus-visible'); });
  shots.focus = await page.screenshot({ clip });
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  const field = await loc.evaluate(el => /^(SELECT|INPUT|TEXTAREA)$/.test(el.tagName) || !!el.querySelector('select,textarea,input:not([type=radio]):not([type=checkbox])'));
  if (!field) {   // a field has no pressed look (and a select would open its native list)
    await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down(); await page.waitForTimeout(100);
    shots.pressed = await page.screenshot({ clip });
    await page.mouse.move(2, 2); await page.mouse.up();
  }
  for (const [s, buf] of Object.entries(shots)) fs.writeFileSync(path.join(OUT, `${k}-${s}.png`), buf);
  const same = Object.fromEntries(['hover', 'focus', 'pressed'].filter(s => shots[s]).map(s => [s, Buffer.compare(shots[s], shots.default) !== 0]));
  res.push({ k, label, focusVisible: fv, differsFromDefault: same, errors: errors.slice(0, 2) });
  console.log(k, '· focus-visible', fv, '· differs', JSON.stringify(same));
  await ctx.close();
}
fs.writeFileSync(path.join(OUT, 'states.json'), JSON.stringify(res, null, 1));
await browser.close(); srv.close();

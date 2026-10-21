// Shared-component subviews, original design (Main) vs final, at a fixed 900 px viewport (no full-page resize, so fixed and
// full-height parts are compared like for like): element pixels of the dialog, drawer, account menu, rail and focus bar.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { startServer, launch, openPage } from '../harness.mjs';
const SRC = '/home/claude/work/project', BED = '/home/claude/work/fxsubbed', OUT = process.argv[2];
fs.rmSync(BED, { recursive: true, force: true }); fs.mkdirSync(BED, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
for (const f of ['core.css', 'rb.css', 'rb-kit.css', 'v3-student.css', 'v3-student-final.css', 'Main.dc.html', 'StudentFinal.dc.html']) fs.copyFileSync(path.join(SRC, f), path.join(BED, f));
const T = [ // [name, scenario, screen, preset, selector, widths]
  ['dialog', 'inprog', 'ST-13', 'att-dialog', '.rk-dialog', [1440, 1024, 768, 375]],
  ['drawer', 'learn', 'ST-01', 'menu', '.rb-drawer', [768, 375]],
  ['acctmenu', 'learn', 'ST-01', 'acct', '.xsb-menu', [1440, 1024, 768, 375]],
  ['rail-home', 'learn', 'ST-01', '', '.rb-rail', [1440, 1024]], ['rail-hub', 'learn', 'ST-05', '', '.rb-rail', [1440, 1024]], ['rail-prog', 'learn', 'ST-15', '', '.rb-rail', [1440, 1024]],
  ['rail-asmt', 'assess', 'ST-11', '', '.rb-rail', [1440, 1024]], ['rail-dev', 'dtrfwd', 'ST-18', '', '.rb-rail', [1440, 1024]],
  ['topbar', 'learn', 'ST-05', '', '.rb-top', [1440, 1024, 768, 375]], ['focusbar-att', 'inprog', 'ST-13', '', '.st-focusbar', [1440, 768, 375]], ['focusbar-act', 'learn', 'ST-08a', '', '.st-focusbar', [1440, 768, 375]],
  ['banner', 'paused', 'ST-01', '', '.rk-banner', [1440, 375]]];
const css = c => c === 'Main' ? 'v3-student.css' : 'v3-student-final.css';
for (const [n, sc, scr, preset] of T) for (const comp of ['Main', 'StudentFinal']) fs.writeFileSync(path.join(BED, `${comp}-${n}.dc.html`), `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>${n}</title><script src="./support.js"></script><link rel="stylesheet" href="./core.css"><link rel="stylesheet" href="./rb.css"><link rel="stylesheet" href="./rb-kit.css"><link rel="stylesheet" href="./${css(comp)}"></head><body>\n<x-dc>\n<helmet><style>body{margin:0}</style></helmet>\n<dc-import name="${comp}" scenario="${sc}" screen="${scr}"${preset ? ` preset="${preset}"` : ''} chrome="none" hint-size="100%,100%"></dc-import>\n</x-dc>\n<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":900}}'>\nclass Component extends DCLogic { renderVals() { return {}; } }\n</script>\n</body></html>\n`);
const srv = await startServer(BED); const browser = await launch();
const h = b => crypto.createHash('sha1').update(b).digest('hex');
const res = [];
for (const [n, sc, scr, preset, sel, ws] of T) for (const w of ws) {
  const shots = {};
  for (const comp of ['Main', 'StudentFinal']) {
    const { ctx, page } = await openPage(browser, srv.port, `${comp}-${n}.dc.html`, w, 900, { settle: 450 });
    const loc = page.locator(sel).first();
    shots[comp] = (await loc.count()) ? await loc.screenshot() : null;
    if (shots[comp]) fs.writeFileSync(path.join(OUT, `${n}-${w}-${comp === 'Main' ? 'original' : 'final'}.png`), shots[comp]);
    await ctx.close();
  }
  const same = shots.Main && shots.StudentFinal ? h(shots.Main) === h(shots.StudentFinal) : null;
  res.push({ part: n, w, selector: sel, same }); console.log(n, w, same);
}
fs.writeFileSync(path.join(OUT, 'subcmp.json'), JSON.stringify(res, null, 1));
await browser.close(); srv.close();

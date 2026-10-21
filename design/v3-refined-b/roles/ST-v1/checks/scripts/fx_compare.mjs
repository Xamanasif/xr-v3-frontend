// Before / after evidence: the original design (Main) and the final design, same case, same width, side by side.
import fs from 'node:fs';
import path from 'node:path';
import { startServer, launch, openPage } from '../harness.mjs';
const SRC = '/home/claude/work/project', BED = '/home/claude/work/fxcmpbed', OUT = process.argv[2];
fs.rmSync(BED, { recursive: true, force: true }); fs.mkdirSync(BED, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
for (const f of ['core.css', 'rb.css', 'rb-kit.css', 'v3-student.css', 'v3-student-final.css', 'Main.dc.html', 'StudentFinal.dc.html']) fs.copyFileSync(path.join(SRC, f), path.join(BED, f));
const CASES = [['learn', 'ST-01'], ['learn', 'ST-02'], ['learn', 'ST-03'], ['learn', 'ST-04'], ['learn', 'ST-05'], ['assess', 'ST-05as'], ['learn', 'ST-06'], ['learn', 'ST-07'], ['learn', 'ST-08'], ['learn', 'ST-08a'],
  ['learn', 'ST-09'], ['learn', 'ST-09ar'], ['vrdone', 'ST-10'], ['assess', 'ST-11'], ['assess', 'ST-12'], ['inprog', 'ST-13'], ['released', 'ST-14'], ['learn', 'ST-15'], ['vrdone', 'ST-16v'], ['vrdone', 'ST-16w'],
  ['dtrfwd', 'ST-18'], ['learn', 'ST-19']];
const wrap = (sc, scr, comp) => `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>x</title><script src="./support.js"></script><link rel="stylesheet" href="./core.css"><link rel="stylesheet" href="./rb.css"><link rel="stylesheet" href="./rb-kit.css">${comp === 'StudentFinal' ? '<link rel="stylesheet" href="./v3-student-final.css">' : '<link rel="stylesheet" href="./v3-student.css">'}</head><body>\n<x-dc>\n<helmet><style>body{margin:0}</style></helmet>\n<dc-import name="${comp}" scenario="${sc}" screen="${scr}" chrome="none" hint-size="100%,100%"></dc-import>\n</x-dc>\n<script type="text/x-dc" data-dc-script data-props='{}'>\nclass Component extends DCLogic { renderVals() { return {}; } }\n</script>\n</body></html>\n`;
for (const [sc, scr] of CASES) for (const comp of ['Main', 'StudentFinal']) fs.writeFileSync(path.join(BED, `${comp}-${sc}-${scr}.dc.html`), wrap(sc, scr, comp));
const srv = await startServer(BED); const browser = await launch();
for (const w of (process.env.WIDTHS || '1440,375').split(',').map(Number)) for (const [sc, scr] of CASES) for (const comp of ['Main', 'StudentFinal']) {
  const { ctx, page } = await openPage(browser, srv.port, `${comp}-${sc}-${scr}.dc.html`, w, 900, { settle: 450 });
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: w, height: Math.min(h, 5000) }); await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(OUT, `${scr}-${sc}-${w}-${comp === 'Main' ? 'before' : 'after'}.png`), fullPage: true });
  await ctx.close();
}
console.log('done');
await browser.close(); srv.close();

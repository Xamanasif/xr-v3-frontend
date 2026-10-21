// Consolidation proof: StudentFinal (foundation + v3-student-final.css) must render pixel-identically to StudentR2
// (foundation + v3-student.css + v3-student-r2.css) before any final design change. usage: node fx_identity.mjs cases.json outDir
import fs from 'node:fs';
import path from 'node:path';
import { startServer, launch, openPage } from '../harness.mjs';
const SRC = '/home/claude/work/project', BED = '/home/claude/work/fxidbed';
const cases = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); const out = process.argv[3];
fs.rmSync(BED, { recursive: true, force: true }); fs.mkdirSync(BED, { recursive: true }); fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(SRC)) fs.copyFileSync(path.join(SRC, f), path.join(BED, f));
const attr = (k, v) => v === undefined || v === '' ? '' : ` ${k}="${v}"`;
const V = { r2: ['StudentR2', 'core.css,rb.css,rb-kit.css,v3-student.css,v3-student-r2.css'], fin: ['StudentFinal', 'core.css,rb.css,rb-kit.css,v3-student-final.css'] };
for (const c of cases) for (const [k, [root, sheets]] of Object.entries(V)) {
  const links = sheets.split(',').map(s => `<link rel="stylesheet" href="./${s}">`).join('');
  fs.writeFileSync(path.join(BED, `${k}-${c.name}.dc.html`), `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>${c.name}</title><script src="./support.js"></script>${links}</head><body>\n<x-dc>\n<helmet><style>body{margin:0}</style></helmet>\n<dc-import name="${root}"${attr('scenario', c.scenario)}${attr('screen', c.screen)}${attr('preset', c.preset)}${attr('data-state', c.dataState)} chrome="${c.chrome || 'none'}" hint-size="100%,100%"></dc-import>\n</x-dc>\n<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":1200}}'>\nclass Component extends DCLogic { renderVals() { return {}; } }\n</script>\n</body></html>\n`);
}
const srv = await startServer(BED); const browser = await launch();
const widths = (process.env.WIDTHS || '1440,375').split(',').map(Number);
const rep = [];
for (const c of cases) for (const w of widths) {
  const shots = {};
  for (const k of Object.keys(V)) {
    const { ctx, page, errors } = await openPage(browser, srv.port, `${k}-${c.name}.dc.html`, w, 900, { settle: 400 });
    const sh = await page.evaluate(() => document.documentElement.scrollHeight);
    if (sh > 900) { await page.setViewportSize({ width: w, height: Math.min(sh, 6000) }); await page.waitForTimeout(150); }
    shots[k] = { png: await page.screenshot({ fullPage: true }), errors };
    await ctx.close();
  }
  const same = Buffer.compare(shots.r2.png, shots.fin.png) === 0;
  if (!same) { fs.writeFileSync(path.join(out, `${c.name}-${w}-r2.png`), shots.r2.png); fs.writeFileSync(path.join(out, `${c.name}-${w}-fin.png`), shots.fin.png); }
  rep.push({ case: c.name, w, same, errors: [...shots.r2.errors, ...shots.fin.errors].slice(0, 3) });
}
fs.writeFileSync(path.join(out, 'identity.json'), JSON.stringify(rep, null, 1));
console.log('identical', rep.filter(r => r.same).length, '/', rep.length, '· errors', rep.filter(r => r.errors.length).length);
await browser.close(); srv.close();

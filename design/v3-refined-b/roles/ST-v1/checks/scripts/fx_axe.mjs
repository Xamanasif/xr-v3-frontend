// axe-core scan (WCAG 2.0/2.1/2.2 A and AA rules) of every final case wrapper at the given widths, plus the live preview.
import fs from 'node:fs';
import path from 'node:path';
import { startServer, launch, openPage } from '../harness.mjs';
const BED = '/home/claude/work/fxaxebed', SRC = '/home/claude/work/project';
const cases = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const widths = (process.env.WIDTHS || '1440,375').split(',').map(Number);
fs.rmSync(BED, { recursive: true, force: true }); fs.mkdirSync(BED, { recursive: true });
for (const f of ['core.css', 'rb.css', 'rb-kit.css', 'v3-student.css', 'v3-student-final.css', 'StudentFinal.dc.html']) fs.copyFileSync(path.join(SRC, f), path.join(BED, f));
const attr = (k, v) => v === undefined || v === '' ? '' : ` ${k}="${v}"`;
for (const c of cases) fs.writeFileSync(path.join(BED, `case-${c.name}.dc.html`), `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>${c.name}</title><script src="./support.js"></script><link rel="stylesheet" href="./core.css"><link rel="stylesheet" href="./rb.css"><link rel="stylesheet" href="./rb-kit.css"><link rel="stylesheet" href="./v3-student-final.css"></head><body>\n<x-dc>\n<helmet><style>body{margin:0}</style></helmet>\n<dc-import name="StudentFinal"${attr('scenario', c.scenario)}${attr('screen', c.screen)}${attr('preset', c.preset)}${attr('data-state', c.dataState)} chrome="none" hint-size="100%,100%"></dc-import>\n</x-dc>\n<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":1200}}'>\nclass Component extends DCLogic { renderVals() { return {}; } }\n</script>\n</body></html>\n`);
const AXE = fs.readFileSync('/home/claude/tools/node_modules/axe-core/axe.min.js', 'utf8');
const srv = await startServer(BED);
const browser = await launch();
const all = {}; const out = [];
const run = async (page) => { await page.addScriptTag({ content: AXE }); return page.evaluate(async () => {
  const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] });
  return r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map(n => n.target.join(' ')).slice(0, 4), n: v.nodes.length })); }); };
const record = (name, res) => { for (const v of res) { all[v.id] = all[v.id] || { help: v.help, impact: v.impact, cases: [] }; all[v.id].cases.push(name + ' ' + v.nodes.join(' | ')); } out.push({ file: name, violations: res }); console.log(name, res.length ? res.map(v => v.id + '×' + v.n + ' ' + v.nodes.join(' | ')).join(', ') : 'clean'); };
for (const w of widths) for (const c of cases) {
  const { ctx, page } = await openPage(browser, srv.port, `case-${c.name}.dc.html`, w, 900, { settle: 400 });
  record(`${c.name}@${w}`, await run(page)); await ctx.close();
}
for (const w of widths) {
  const { ctx, page } = await openPage(browser, srv.port, 'StudentFinal.dc.html', w, 900, { settle: 500 });
  if (w < 760) { await page.click('.st-review-toggle'); await page.waitForTimeout(200); }
  record('StudentFinal.dc.html@' + w, await run(page)); await ctx.close();
}
fs.writeFileSync(process.argv[3], JSON.stringify({ summary: all, cases: out }, null, 1));
console.log('pages with violations:', out.filter(o => o.violations.length).length, 'of', out.length);
await browser.close(); srv.close();

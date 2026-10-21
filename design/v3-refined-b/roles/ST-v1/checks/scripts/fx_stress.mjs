// Long-text stress for Student final: patched copy of StudentFinal with much longer names (review-only).
import fs from 'node:fs';
import path from 'node:path';
import { startServer, launch, openPage, overflowReport } from '../harness.mjs';
import { spillReport } from './spill.mjs';
const SRC = '/home/claude/work/project', BED = '/home/claude/work/fxsbed', OUT = process.argv[2];
fs.rmSync(BED, { recursive: true, force: true }); fs.mkdirSync(BED, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
for (const f of ['core.css', 'rb.css', 'rb-kit.css', 'v3-student.css', 'v3-student-final.css', 'StudentFinal.dc.html']) fs.copyFileSync(path.join(SRC, f), path.join(BED, f));
let m = fs.readFileSync(path.join(BED, 'StudentFinal.dc.html'), 'utf8');
const R = [["t: 'Shell-and-Tube Heat Exchanger'", "t: 'Shell-and-Tube Heat Exchanger with Segmental Baffles, Fouling Resistance and a Two-Pass Counterflow Arrangement'"],
  ["name: 'Thermodynamics & Heat Transfer'", "name: 'Thermodynamics, Heat Transfer and Thermal Systems Engineering Laboratory Practice'"],
  ["name: 'Rahul Verma', first: 'Rahul'", "name: 'Rahulkrishnan Venkatasubramanian-Iyengar', first: 'Rahulkrishnan'"],
  ["static get INST() { return 'Godavari Institute of Technology'; }", "static get INST() { return 'Godavari Institute of Technology and Advanced Engineering Sciences, Rajahmundry'; }"],
  ["old: 'ME lab VR headset, asset tag GIT-VR-03'", "old: 'Mechanical engineering laboratory VR headset (Meta Quest), asset tag GIT-ME-LAB-VR-0003-2026'"],
  ["name: 'Heat Exchanger — post-lab'", "name: 'Heat Exchanger effectiveness and NTU — post-laboratory assessment, part one'"],
  ["{ id: 'r2', t: 'Pre-lab reading — the effectiveness–NTU method'", "{ id: 'r2', t: 'Pre-laboratory reading — the effectiveness–NTU method for shell-and-tube and cross-flow heat exchangers with fouling'"]];
for (const [a, b] of R) { if (!m.includes(a)) { console.log('MISSING', a); process.exit(1); } m = m.split(a).join(b); }
fs.writeFileSync(path.join(BED, 'StudentFinal.dc.html'), m);
const cases = [['learn', 'ST-01'], ['assess', 'ST-01'], ['vrdone', 'ST-01'], ['paused', 'ST-01'], ['ended', 'ST-01'], ['newst', 'ST-01'],
  ['learn', 'ST-02'], ['ended', 'ST-02'], ['learn', 'ST-03'], ['learn', 'ST-04'], ['learn', 'ST-05'], ['vrdone', 'ST-05'], ['learn', 'ST-06'], ['learn', 'ST-07'], ['vrprog', 'ST-07'],
  ['assess', 'ST-05as'], ['vrdone', 'ST-10'], ['learn', 'ST-08'], ['vrdone', 'ST-08'], ['learn', 'ST-08a'], ['learn', 'ST-09'], ['learn', 'ST-09ar'], ['learn', 'ST-19'], ['withdrawn', 'ST-05'],
  ['assess', 'ST-11'], ['waitmark', 'ST-11sub'], ['assess', 'ST-12'], ['inprog', 'ST-13'], ['released', 'ST-14'], ['waitmark', 'ST-14'], ['learn', 'ST-15'], ['ended', 'ST-15'],
  ['vrdone', 'ST-16v'], ['vrdone', 'ST-16w'], ['device', 'ST-18'], ['dtrfwd', 'ST-18'], ['learn', 'XS-05']];
for (const [sc, scr] of cases) fs.writeFileSync(path.join(BED, `s-${sc}-${scr}.dc.html`), `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>s</title><script src="./support.js"></script><link rel="stylesheet" href="./core.css"><link rel="stylesheet" href="./rb.css"><link rel="stylesheet" href="./rb-kit.css"><link rel="stylesheet" href="./v3-student-final.css"></head><body><x-dc><dc-import name="StudentFinal" scenario="${sc}" screen="${scr}" chrome="none" hint-size="100%,100%"></dc-import></x-dc><script type="text/x-dc" data-dc-script data-props='{}'>class Component extends DCLogic { renderVals() { return {}; } }</script></body></html>`);
const srv = await startServer(BED);
const browser = await launch();
let bad = 0;
for (const w of [1440, 1024, 768, 375]) for (const [sc, scr] of cases) {
  const { ctx, page, errors } = await openPage(browser, srv.port, `s-${sc}-${scr}.dc.html`, w, 900, { settle: 400 });
  const rep = await overflowReport(page);
  const probs = [];
  if (errors.length) probs.push('errors ' + errors.slice(0, 2).join(' | '));
  if (rep.docScroll > rep.width) probs.push('h-scroll ' + rep.docScroll);
  if (rep.offenders.length) probs.push('offenders ' + rep.offenders.slice(0, 3).map(o => o.cls + ' "' + o.text + '"').join(' ; '));
  if (rep.clipped.length) probs.push('clipped ' + rep.clipped.slice(0, 3).map(o => o.cls + ' "' + o.text + '"').join(' ; '));
  const sp = await spillReport(page); if (sp.length) probs.push('spills ' + sp.join(' ; '));
  if (probs.length) bad++;
  console.log(`${sc}/${scr} @${w}: ${probs.length ? probs.join(' || ') : 'clean'}`);
  if (w === 375 || probs.length) { const sh = await page.evaluate(() => document.documentElement.scrollHeight); await page.setViewportSize({ width: w, height: Math.min(sh, 5000) }); await page.waitForTimeout(150); await page.screenshot({ path: path.join(OUT, `${sc}-${scr}-${w}.png`) }); }
  await ctx.close();
}
console.log('cases with problems:', bad);
await browser.close(); srv.close();

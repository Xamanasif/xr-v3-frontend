// Reference identifiers (SACC-/ACC-/DTR-): the final page shows exactly the identifiers the baseline page shows, case by case.
// Uses the wrappers that fx_links.mjs wrote (a-* = Main, the original complete-role design; b-* = StudentFinal).
import fs from 'node:fs';
import { startServer, launch, openPage } from '../harness.mjs';
const BED = '/home/claude/work/fxlinkbed';
const cases = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const srv = await startServer(BED); const browser = await launch();
const ids = async f => { const { ctx, page } = await openPage(browser, srv.port, f, 1440, 900, { settle: 300 }); const t = await page.evaluate(() => (document.querySelector('.st-root') || document.body).innerText); await ctx.close(); return [...new Set(t.match(/\b(?:S?ACC|DTR)-\d+/g) || [])].sort(); };
let same = 0, diff = 0, withIds = 0; const rows = [];
for (const c of cases) {
  const a = await ids(`a-${c.name}.dc.html`), b = await ids(`b-${c.name}.dc.html`);
  if (a.length) withIds++;
  if (a.join() === b.join()) same++; else { diff++; console.log(`DIFF ${c.name}: baseline [${a}] · final [${b}]`); }
  rows.push({ case: c.name, baseline: a, final: b });
}
console.log(`cases with identifiers in the baseline: ${withIds} · same identifiers: ${same} · different: ${diff} of ${cases.length}`);
fs.writeFileSync(process.argv[3], JSON.stringify(rows, null, 1));
await browser.close(); srv.close();

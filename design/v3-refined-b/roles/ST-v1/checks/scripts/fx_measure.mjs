// Render every final board as-is at its board width: measure height, screenshot, run the same checks as the role delivery.
// usage: node fx_measure.mjs outDir [regex]
import fs from 'node:fs';
import path from 'node:path';
import { startServer, launch, openPage, overflowReport } from '../harness.mjs';
const SRC = '/home/claude/work/project', BED = '/home/claude/work/fxmbed';
const OUT = process.argv[2];
const rows = JSON.parse(fs.readFileSync('/home/claude/work/fx_boards.json', 'utf8'));
fs.rmSync(BED, { recursive: true, force: true }); fs.mkdirSync(BED, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(SRC)) fs.copyFileSync(path.join(SRC, f), path.join(BED, f));
const only = process.argv[3] ? new RegExp(process.argv[3]) : null;
const srv = await startServer(BED);
const browser = await launch();
const heights = {}, report = [];
for (const r of rows) for (const bd of r.boards) {
  if (only && !only.test(bd.file)) continue;
  const vh = 900;
  const { ctx, page, errors } = await openPage(browser, srv.port, bd.file, bd.w, vh, { settle: 500 });
  let h = await page.evaluate(() => document.documentElement.scrollHeight);
  if (h > vh) { await page.setViewportSize({ width: bd.w, height: h }); await page.waitForTimeout(250); h = await page.evaluate(() => document.documentElement.scrollHeight); await page.setViewportSize({ width: bd.w, height: h }); await page.waitForTimeout(150); }
  h = Math.max(h, 600); heights[bd.file] = h;
  const rep = await overflowReport(page);
  const facts = await page.evaluate(() => {
    const ids = {}; document.querySelectorAll('[id]').forEach(e => { ids[e.id] = (ids[e.id] || 0) + 1; });
    const unnamed = [...document.querySelectorAll('button, a[href], input, select, textarea')].filter(el => { const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden') return false; const lb = el.getAttribute('aria-labelledby'); const name = (el.getAttribute('aria-label') || '').trim() || (lb ? lb.split(/\s+/).map(i => document.getElementById(i)?.textContent || '').join(' ').trim() : '') || (el.id && document.querySelector(`label[for="${el.id}"]`)?.textContent.trim()) || el.closest('label')?.textContent.trim() || (el.matches('button, a') ? el.textContent.trim() : ''); return !name; }).map(el => el.outerHTML.slice(0, 80));
    const badRefs = [...document.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls]')].flatMap(el => ['aria-labelledby', 'aria-describedby', 'aria-controls'].flatMap(a => (el.getAttribute(a) || '').split(/\s+/).filter(Boolean).filter(id => !document.getElementById(id)).map(id => a + '→' + id)));
    const small = [...document.querySelectorAll('button, a[href], select')].filter(el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); if (!(r.width > 0) || s.visibility === 'hidden' || s.display === 'inline' || el.closest('.rk-crumbs')) return false; return r.height < 24 || r.width < 24; }).map(el => el.outerHTML.slice(0, 70));
    return { h1: [...document.querySelectorAll('h1')].map(x => x.textContent.trim()), dup: Object.keys(ids).filter(k => ids[k] > 1), raw: (document.body.innerHTML.match(/\{\{[^}]*\}\}/g) || []).length,
      undef: (document.body.innerText.match(/\bundefined\b|\bNaN\b|\[object Object\]|\bnull\b/g) || []).length, hash: [...document.querySelectorAll('a[href]')].filter(a => ['#', ''].includes(a.getAttribute('href'))).length, unnamed, badRefs, small };
  });
  const png = bd.file.replace('.dc.html', '.png');
  await page.screenshot({ path: path.join(OUT, png), fullPage: true });
  const problems = [];
  if (errors.length) problems.push('errors: ' + errors.slice(0, 3).join(' | '));
  if (rep.docScroll > rep.width) problems.push('h-scroll ' + rep.docScroll);
  if (rep.offenders.length) problems.push('offenders ' + rep.offenders.slice(0, 3).map(o => o.cls + ' ' + o.text).join(' ; '));
  if (rep.clipped.length) problems.push('clipped ' + rep.clipped.slice(0, 3).map(o => o.cls + ' ' + o.text).join(' ; '));
  if (facts.dup.length) problems.push('dup ' + facts.dup.join(','));
  if (facts.h1.length !== 1) problems.push('h1 ' + facts.h1.length);
  if (facts.raw) problems.push('raw holes ' + facts.raw);
  if (facts.undef) problems.push('undefined text ' + facts.undef);
  if (facts.hash) problems.push('# links ' + facts.hash);
  if (facts.unnamed.length) problems.push('unnamed ' + facts.unnamed.join(' ; '));
  if (facts.badRefs.length) problems.push('bad refs ' + facts.badRefs.join(','));
  if (facts.small.length) problems.push('small ' + facts.small.join(' ; '));
  report.push({ file: bd.file, w: bd.w, h, h1: facts.h1[0] || '', png, problems });
  console.log(`${bd.file} ${bd.w}×${h} · ${facts.h1[0] || '?'}${problems.length ? '\n   ' + problems.join('\n   ') : ''}`);
  await ctx.close();
}
fs.writeFileSync(path.join(OUT, 'heights.json'), JSON.stringify(heights, null, 1));
fs.writeFileSync(path.join(OUT, 'boards-report.json'), JSON.stringify(report, null, 1));
await browser.close(); srv.close();

// Rendered destinations and actions: Main (the approved baseline) vs StudentFinal, for every final case at the given widths.
// For each case: links (href + name) and buttons (name) that the baseline page offered and the final page does not, and the reverse.
import fs from 'node:fs';
import path from 'node:path';
import { startServer, launch, openPage } from '../harness.mjs';
const SRC = '/home/claude/work/project', BED = '/home/claude/work/fxlinkbed';
const cases = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const widths = (process.env.WIDTHS || '1440,375').split(',').map(Number);
fs.rmSync(BED, { recursive: true, force: true }); fs.mkdirSync(BED, { recursive: true });
for (const f of ['core.css', 'rb.css', 'rb-kit.css', 'v3-student.css', 'v3-student-final.css', 'Main.dc.html', 'StudentFinal.dc.html']) fs.copyFileSync(path.join(SRC, f), path.join(BED, f));
const attr = (k, v) => v === undefined || v === '' ? '' : ` ${k}="${v}"`;
const wrap = (c, comp) => `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>${c.name}</title><script src="./support.js"></script><link rel="stylesheet" href="./core.css"><link rel="stylesheet" href="./rb.css"><link rel="stylesheet" href="./rb-kit.css">${comp === 'StudentFinal' ? '<link rel="stylesheet" href="./v3-student-final.css">' : '<link rel="stylesheet" href="./v3-student.css">'}</head><body>\n<x-dc>\n<helmet><style>body{margin:0}</style></helmet>\n<dc-import name="${comp}"${attr('scenario', c.scenario)}${attr('screen', c.screen)}${attr('preset', c.preset)}${attr('data-state', c.dataState)} chrome="none" hint-size="100%,100%"></dc-import>\n</x-dc>\n<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":1200}}'>\nclass Component extends DCLogic { renderVals() { return {}; } }\n</script>\n</body></html>\n`;
for (const c of cases) { fs.writeFileSync(path.join(BED, `a-${c.name}.dc.html`), wrap(c, 'Main')); fs.writeFileSync(path.join(BED, `b-${c.name}.dc.html`), wrap(c, 'StudentFinal')); }
const srv = await startServer(BED);
const browser = await launch();
const grab = async (file, w) => { const { ctx, page, errors } = await openPage(browser, srv.port, file, w, 900, { settle: 350 });
  const r = await page.evaluate(() => {
    const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden'; };
    const nm = e => ((e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60));
    const scope = document.querySelector('.st-root') || document.body;
    const links = [...scope.querySelectorAll('a[href]')].filter(vis).map(a => ({ href: a.getAttribute('href'), name: nm(a), where: a.closest('.rk-crumbs') ? 'crumb' : a.closest('.rb-rail, .rb-drawer, .rb-top') ? 'shell' : a.closest('.rk-tabs') ? 'tab' : 'page' }));
    const buttons = [...scope.querySelectorAll('button')].filter(vis).map(b => nm(b));
    return { links, buttons };
  });
  // change detection against the original design: the whole page and the subviews that are drawn by shared or kept components
  const crypto = await import('node:crypto');
  const h = buf => crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16);
  const sh = await page.evaluate(() => document.documentElement.scrollHeight);
  if (sh > 900) { await page.setViewportSize({ width: w, height: Math.min(sh, 6000) }); await page.waitForTimeout(120); }
  const pageHash = h(await page.screenshot({ fullPage: true }));
  const subs = {};
  for (const sel of ['.rk-dialog', '.st-focusbar', '.rb-drawer', '.rk-banner', '.xsb-menu', '.rb-rail', '.rb-top', '.rk-errsum', '.xsb-msg', '.rk-crumbs']) {
    const el = page.locator(sel).first();
    if (await el.count() && await el.isVisible()) { try { subs[sel] = h(await el.screenshot()); } catch (e) { subs[sel] = 'err'; } }
  }
  const textHash = h(Buffer.from(await page.evaluate(() => ((document.querySelector('main') || document.body).innerText || '').replace(/\s+/g, ' '))));
  await ctx.close(); return { ...r, errors, pageHash, subs, textHash }; };
const out = {}; let lostCases = 0;
for (const w of widths) for (const c of cases) {
  const a = await grab(`a-${c.name}.dc.html`, w), b = await grab(`b-${c.name}.dc.html`, w);
  const bh = new Set(b.links.map(x => x.href)), ah = new Set(a.links.map(x => x.href));
  const lost = [...new Map(a.links.filter(x => !bh.has(x.href)).map(x => [x.href, x])).values()];
  const added = [...new Map(b.links.filter(x => !ah.has(x.href)).map(x => [x.href, x])).values()];
  const bb = new Set(b.buttons), ab = new Set(a.buttons);
  const lostB = [...new Set(a.buttons.filter(x => !bb.has(x)))], addedB = [...new Set(b.buttons.filter(x => !ab.has(x)))];
  const key = `${c.name}@${w}`;
  out[key] = { lost, added, lostB, addedB, errors: [...a.errors, ...b.errors], pageSame: a.pageHash === b.pageHash, textSame: a.textHash === b.textHash, subs: Object.fromEntries([...new Set([...Object.keys(a.subs), ...Object.keys(b.subs)])].map(s => [s, a.subs[s] && b.subs[s] ? (a.subs[s] === b.subs[s] ? 'same' : 'changed') : (a.subs[s] ? 'only in original' : 'only in final')])) };
  if (lost.length || lostB.length) lostCases++;
  console.log(`${key}: ${lost.length || lostB.length || added.length || addedB.length ? '' : 'same destinations and actions'}${lost.length ? '\n   lost   ' + lost.map(x => x.where + ' ' + x.href + ' ‹' + x.name + '›').join(' ; ') : ''}${added.length ? '\n   added  ' + added.map(x => x.where + ' ' + x.href + ' ‹' + x.name + '›').join(' ; ') : ''}${lostB.length ? '\n   lost buttons  ' + lostB.join(' ; ') : ''}${addedB.length ? '\n   added buttons ' + addedB.join(' ; ') : ''}`);
}
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log('cases where a baseline destination or action is not on the final page:', lostCases);
await browser.close(); srv.close();

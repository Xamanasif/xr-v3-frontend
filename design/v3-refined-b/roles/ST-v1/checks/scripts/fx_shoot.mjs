// Student final: render StudentFinal.dc.html through generated dc-import wrappers (one per case) and report problems.
// usage: node shoot.mjs cases.json outDir [--noshot]
import fs from 'node:fs';
import path from 'node:path';
import { startServer, launch, openPage, overflowReport } from '../harness.mjs';
const SRC = '/home/claude/work/project';
const BED = process.env.BED || '/home/claude/work/fxtestbed';
const cases = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const out = process.argv[3]; const noshot = process.argv.includes('--noshot');
fs.mkdirSync(BED, { recursive: true }); fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(SRC)) fs.copyFileSync(path.join(SRC, f), path.join(BED, f));
const attr = (k, v) => v === undefined || v === '' ? '' : ` ${k}="${v}"`;
for (const c of cases) {
  const html = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>${c.name}</title><script src="./support.js"></script><link rel="stylesheet" href="./core.css"><link rel="stylesheet" href="./rb.css"><link rel="stylesheet" href="./rb-kit.css"><link rel="stylesheet" href="./v3-student-final.css"></head><body>\n<x-dc>\n<helmet><style>body{margin:0}</style></helmet>\n<dc-import name="StudentFinal"${attr('scenario', c.scenario)}${attr('screen', c.screen)}${attr('preset', c.preset)}${attr('data-state', c.dataState)} chrome="${c.chrome || 'none'}" hint-size="100%,100%"></dc-import>\n</x-dc>\n<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":1200}}'>\nclass Component extends DCLogic { renderVals() { return {}; } }\n</script>\n</body></html>\n`;
  fs.writeFileSync(path.join(BED, `case-${c.name}.dc.html`), html);
}
const srv = await startServer(BED);
const browser = await launch();
const report = [];
for (const c of cases) {
  for (const w of (c.widths || (process.env.WIDTHS ? process.env.WIDTHS.split(",").map(Number) : [1440]))) {
    const { ctx, page, errors } = await openPage(browser, srv.port, `case-${c.name}.dc.html`, w, c.height || 900, { settle: 450 });
    if (c.steps) {
      for (const s of c.steps) {
        try {
          if (s.click) await page.click(s.click, { timeout: 3000 });
          if (s.fill) await page.fill(s.fill[0], s.fill[1], { timeout: 3000 });
          if (s.check) await page.check(s.check, { timeout: 3000 });
          if (s.select) await page.selectOption(s.select[0], s.select[1], { timeout: 3000 });
          if (s.press) await page.keyboard.press(s.press);
          if (s.wait) await page.waitForTimeout(s.wait);
        } catch (e) { errors.push('step ' + JSON.stringify(s) + ': ' + e.message.split('\n')[0]); }
        await page.waitForTimeout(s.after || 120);
      }
    }
    const rep = await overflowReport(page);
    const facts = await page.evaluate(() => {
      const ids = {}; document.querySelectorAll('[id]').forEach(e => { ids[e.id] = (ids[e.id] || 0) + 1; });
      const dup = Object.entries(ids).filter(([k, n]) => n > 1).map(([k]) => k);
      const h1 = [...document.querySelectorAll('h1')].map(h => h.textContent.trim().replace(/\s+/g, ' '));
      const deadHash = [...document.querySelectorAll('a[href]')].filter(a => a.getAttribute('href') === '#' || a.getAttribute('href') === '').map(a => a.textContent.trim().slice(0, 40));
      const unnamed = [...document.querySelectorAll('button, a[href], input, select, textarea')].filter(el => {
        if (el.closest('[hidden]')) return false;
        const s = getComputedStyle(el); if (s.display === 'none' || s.visibility === 'hidden') return false;
        const name = (el.getAttribute('aria-label') || el.textContent || '').trim() || (el.id && document.querySelector(`label[for="${el.id}"]`)?.textContent.trim()) || el.closest('label')?.textContent.trim();
        return !name;
      }).map(el => el.outerHTML.slice(0, 80));
      const labelledby = [...document.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls]')].flatMap(el => ['aria-labelledby', 'aria-describedby', 'aria-controls'].flatMap(a => (el.getAttribute(a) || '').split(/\s+/).filter(Boolean).filter(id => !document.getElementById(id)).map(id => a + '→' + id)));
      const raw = document.body.innerHTML.match(/\{\{[^}]*\}\}/g) || [];
      const undef = (document.body.innerText.match(/undefined|NaN|\[object Object\]|null/g) || []);
      const small = [...document.querySelectorAll('button, a[href], select, input[type=radio]')].filter(el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && s.visibility !== 'hidden' && s.display !== 'inline' && (r.height < 24 || r.width < 24) && el.type !== 'radio' && !el.closest('.rk-banner, .rk-crumbs'); }).map(el => el.outerHTML.slice(0, 60));
      // content spilling out of the nearest visible box (card, panel, pill, button), even when the page does not scroll sideways
      const isBox = cs => parseFloat(cs.borderLeftWidth) > 0 || parseFloat(cs.borderRightWidth) > 0 || cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.boxShadow !== 'none';
      const spill = [];
      for (const d of document.querySelectorAll('body *')) {
        const dcs = getComputedStyle(d);
        if (dcs.display === 'none' || dcs.display === 'contents' || dcs.position === 'absolute' || dcs.position === 'fixed' || d.closest('.xr-sr')) continue;
        const r = d.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
        for (let a = d.parentElement; a && a !== document.body; a = a.parentElement) {
          const acs = getComputedStyle(a);
          if (acs.display === 'contents' || acs.display === 'inline') continue;   // no box of its own
          if (acs.overflowX === 'auto' || acs.overflowX === 'scroll') break;   // a scroll container: overflow is reachable
          if (acs.overflowX !== 'visible' && a.getBoundingClientRect().width <= 2) break;   // a visually hidden label (1 px box), by design
          if (acs.overflowX !== 'visible' && acs.textOverflow === 'ellipsis') break;   // deliberate one-line truncation with an ellipsis
          if (acs.overflowX !== 'visible') { if (r.right > a.getBoundingClientRect().right + 1 || r.left < a.getBoundingClientRect().left - 1) spill.push('clipped by ' + String(a.className || a.tagName).slice(0, 40) + ' ⊃ ' + String(d.className || d.tagName).slice(0, 30)); break; }
          if (acs.display === 'inline' || acs.display === 'contents' || !isBox(acs)) continue;
          const b = a.getBoundingClientRect();
          if (r.right > b.right + 1 || r.left < b.left - 1) spill.push(String(a.className || a.tagName).slice(0, 40) + ' ⊃ ' + String(d.className || d.tagName).slice(0, 30) + ' ' + Math.round(Math.max(r.right - b.right, b.left - r.left)) + 'px');
          break;
        }
      }
      return { h1, dup, deadHash, unnamed: unnamed.slice(0, 6), badRefs: [...new Set(labelledby)].slice(0, 8), raw: raw.slice(0, 5), undef: undef.slice(0, 5), small: small.slice(0, 5), spill: spill.slice(0, 5), height: document.documentElement.scrollHeight };
    });
    const file = `${c.name}-${w}.png`;
    if (!noshot) {
      const sh = await page.evaluate(() => document.documentElement.scrollHeight);
      if (!c.keepHeight && sh > (c.height || 900)) { await page.setViewportSize({ width: w, height: Math.min(sh, 6000) }); await page.waitForTimeout(200); }
      await page.screenshot({ path: path.join(out, file), fullPage: true });
    }
    const problems = [];
    if (errors.length) problems.push('errors: ' + errors.slice(0, 4).join(' | '));
    if (rep.docScroll > rep.width) problems.push('h-scroll ' + rep.docScroll + '>' + rep.width);
    if (rep.offenders.length) problems.push('offenders: ' + rep.offenders.slice(0, 4).map(o => o.tag + '.' + o.cls + ' "' + o.text + '" ' + o.left + '..' + o.right).join(' ; '));
    if (rep.clipped.length) problems.push('clipped: ' + rep.clipped.slice(0, 4).map(o => o.cls + ' "' + o.text + '"').join(' ; '));
    if (facts.dup.length) problems.push('dup ids: ' + facts.dup.join(','));
    if (facts.h1.length !== 1) problems.push('h1 count ' + facts.h1.length);
    if (facts.deadHash.length) problems.push('dead # links: ' + facts.deadHash.join(','));
    if (facts.unnamed.length) problems.push('unnamed: ' + facts.unnamed.join(' ; '));
    if (facts.badRefs.length) problems.push('bad refs: ' + facts.badRefs.join(','));
    if (facts.raw.length) problems.push('raw holes: ' + facts.raw.join(','));
    if (facts.undef.length) problems.push('undefined text: ' + facts.undef.join(','));
    if (facts.small.length) problems.push('small targets: ' + facts.small.join(' ; '));
    if (facts.spill.length) problems.push('spills out of its box: ' + facts.spill.join(' ; '));
    report.push({ case: c.name, w, h1: facts.h1[0] || '', height: facts.height, file, problems });
    console.log(`${c.name} @${w} · ${facts.h1.join(' / ')} · ${problems.length ? '\n   ' + problems.join('\n   ') : 'clean'}`);
    await ctx.close();
  }
}
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 1));
await browser.close(); srv.close();

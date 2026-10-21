// LINK-MAP for Student final: every visible link and button on every final case page (rendered), with the screen each link
// lands on in that case's world (resolved with the preview's own routing, which is verbatim from Main).
import fs from 'node:fs';
import path from 'node:path';
import { startServer, launch, openPage } from '../harness.mjs';
const SRC = '/home/claude/work/project', BED = '/home/claude/work/fxmapbed';
const cases = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const widths = (process.env.WIDTHS || '1440,375').split(',').map(Number);
fs.rmSync(BED, { recursive: true, force: true }); fs.mkdirSync(BED, { recursive: true });
for (const f of ['core.css', 'rb.css', 'rb-kit.css', 'v3-student.css', 'v3-student-final.css', 'StudentFinal.dc.html']) fs.copyFileSync(path.join(SRC, f), path.join(BED, f));
// routing, loaded from the preview itself
const html = fs.readFileSync(path.join(SRC, 'StudentFinal.dc.html'), 'utf8');
const js = html.split('data-dc-script')[1].split('>').slice(1).join('>').split('</script>')[0];
const DCLogic = class { constructor() { this.props = {}; this.state = {}; } setState() {} };
const K = new Function('DCLogic', 'window', js + '\nreturn Component;')(DCLogic, { setTimeout() {}, clearTimeout() {}, scrollTo() {} });
const c = new K(); c.props = {};
const cands = [...K.SCREENS.map(s => c.routeFor(s[0]))];
for (const t of ['overview', 'resources', 'simulation', 'assessment', 'progress']) cands.push({ s: 'hub', exp: 'ste', tab: t }, { s: 'hub', exp: 'fin', tab: t });
for (const f of ['WEB', 'VR', 'AR', 'MR']) cands.push({ s: 'fmt', exp: 'ste', fmt: f }, { s: 'fb', exp: 'ste', fmt: f });
for (const t of ['todo', 'sub', 'res']) cands.push({ s: 'alist', tab: t });
for (const t of ['courses', 'experiments']) cands.push({ s: 'courses', tab: t });
for (const s of ['home', 'course', 'web', 'act', 'aintro', 'att', 'ares', 'prog', 'dev', 'help', 'helpform', 'helpsent', 'out', 'nyw']) cands.push({ s, exp: 'ste' });
const byPath = {}; for (const r of cands) { try { const p = '#' + c.path(r); if (!byPath[p]) byPath[p] = r; } catch (e) { } }
const landing = (href, sc, preset) => { const r = byPath[href]; if (!r) return href.startsWith('#st-') ? 'in-page anchor' : 'unresolved'; const w = c.seed(sc, preset || ''); const v = c.resolve(r, w); return v.id + (v.view === 'msg' ? ' (message)' : ''); };
const attr = (k, v) => v === undefined || v === '' ? '' : ` ${k}="${v}"`;
for (const k of cases) fs.writeFileSync(path.join(BED, `m-${k.name}.dc.html`), `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>${k.name}</title><script src="./support.js"></script><link rel="stylesheet" href="./core.css"><link rel="stylesheet" href="./rb.css"><link rel="stylesheet" href="./rb-kit.css"><link rel="stylesheet" href="./v3-student-final.css"></head><body>\n<x-dc>\n<helmet><style>body{margin:0}</style></helmet>\n<dc-import name="StudentFinal"${attr('scenario', k.scenario)}${attr('screen', k.screen)}${attr('preset', k.preset)}${attr('data-state', k.dataState)} chrome="none" hint-size="100%,100%"></dc-import>\n</x-dc>\n<script type="text/x-dc" data-dc-script data-props='{}'>\nclass Component extends DCLogic { renderVals() { return {}; } }\n</script>\n</body></html>\n`);
const srv = await startServer(BED); const browser = await launch();
const out = { method: 'Rendered final case pages; each visible link with its accessible name and region, and the screen it lands on in that case’s world (resolve() of the route behind the link). Buttons are actions on the page.', cases: {} };
let nLinks = 0, unresolved = 0; const uniq = new Set();
for (const w of widths) for (const k of cases) {
  const { ctx, page } = await openPage(browser, srv.port, `m-${k.name}.dc.html`, w, 900, { settle: 350 });
  const r = await page.evaluate(() => {
    const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden'; };
    const nm = e => ((e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 70));
    const scope = document.querySelector('.st-root') || document.body;
    return { links: [...scope.querySelectorAll('a[href]')].filter(vis).map(a => ({ href: a.getAttribute('href'), name: nm(a), where: a.closest('.rk-crumbs') ? 'breadcrumb' : a.closest('.rb-rail, .rb-drawer, .rb-top') ? 'shell' : a.closest('.rk-tabs') ? 'tab' : a.closest('.rk-banner') ? 'banner' : 'page' })),
      buttons: [...scope.querySelectorAll('button')].filter(vis).map(b => nm(b)).filter(Boolean) };
  });
  await ctx.close();
  for (const l of r.links) { l.lands = landing(l.href, k.scenario, k.preset); nLinks++; if (l.lands === 'unresolved') unresolved++; uniq.add(k.scenario + '|' + l.href + '|' + l.lands); }
  out.cases[`${k.name}@${w}`] = { scenario: k.scenario, screen: k.screen, preset: k.preset || '', dataState: k.dataState || '', links: r.links, buttons: [...new Set(r.buttons)] };
}
out.summary = { pages: Object.keys(out.cases).length, linksListed: nLinks, uniqueScenarioDestinationPairs: uniq.size, unresolved };
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log(JSON.stringify(out.summary));
await browser.close(); srv.close();

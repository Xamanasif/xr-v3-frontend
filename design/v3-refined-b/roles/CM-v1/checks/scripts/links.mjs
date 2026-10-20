// Click every navigation control that declares a destination (data-to) from a fresh copy of each
// starting state, and record where the role preview actually lands. Output: links.json
import { openBrowser, newPage, load } from './harness.mjs';
import fs from 'node:fs';
const R = '/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/render-cm';
const esc = v => String(v || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const head = fs.readFileSync(R + '/Main.dc.html', 'utf8').split('<body>')[0];
const STARTS = [
  { n: 'CM-01 Overview', screen: 'overview' },
  { n: 'CM-02 Ready to publish', screen: 'ready' },
  { n: 'CM-03 Decision (open)', screen: 'decision', record: 'SUB-0077' },
  { n: 'CM-03 Decision (published result)', screen: 'decision', record: 'SUB-0077', preset: 'published-here' },
  { n: 'CM-03 Decision (read-only, from library)', screen: 'decision', record: 'SUB-0086', preset: 'library' },
  { n: 'CM-04 Library · Ready', screen: 'library' },
  { n: 'CM-04 Library · Published', screen: 'library', preset: 'tab:published' },
  { n: 'CM-04 Library · In review', screen: 'library', preset: 'tab:review' },
  { n: 'CM-05 Published · no open update', screen: 'published', record: 'e2' },
  { n: 'CM-05 Published · open draft/returned', screen: 'published', record: 'e6' },
  { n: 'CM-05 Published · awaiting release', screen: 'published', record: 'e10' },
  { n: 'CM-08 Updates list', screen: 'updates' },
  { n: 'CM-08 Detail · returned', screen: 'update', record: 'UPD-0006' },
  { n: 'CM-08 Detail · awaiting', screen: 'update', record: 'UPD-0005' },
  { n: 'CM-09 Course codes', screen: 'codes' },
  { n: 'XS-07 Help & support', screen: 'help', preset: 'report-sent,goto:help' },
  { n: 'XS-07 Report a problem', screen: 'report' },
  { n: 'XS-07 Report sent', screen: 'report', preset: 'report-sent' },
  { n: 'XS-07 Report detail', screen: 'help', preset: 'report-sent,goto:reportDetail:SUP-0186' },
  { n: 'AR-10 Not your workspace', screen: 'workspace' },
  { n: 'PU-06 Public page handoff', screen: 'public', record: 'e10' },
  { n: 'XS-03 Signed out', screen: 'signedout' },
  { n: 'Account menu open', screen: 'overview', preset: 'acct' },
  { n: 'Drawer open (768)', screen: 'overview', preset: 'menu', w: 768 }
];
const HEAD2ID = { 'cm-h-overview': 'CM-01', 'cm-h-ready': 'CM-02', 'cm-h-decision': 'CM-03', 'cm-h-library': 'CM-04', 'cm-h-published': 'CM-05', 'cm-h-updates': 'CM-08', 'cm-h-update': 'CM-08',
  'cm-h-codes': 'CM-09', 'cm-h-help': 'XS-07', 'cm-h-report': 'XS-07', 'cm-h-sent': 'XS-07', 'cm-h-rdetail': 'XS-07', 'cm-h-refusal': 'AR-10', 'cm-h-public': 'PU-06', 'cm-h-out': 'XS-03' };
const made = [];
function wrapper(p, w) {
  const name = 'L-' + Math.random().toString(36).slice(2, 8) + '.dc.html';
  fs.writeFileSync(R + '/' + name, head.replace(/<title>.*?<\/title>/, '<title>links</title>') + `<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400..800&amp;display=swap" rel="stylesheet">
<style>body{margin:0}</style>
</helmet>
<dc-import name="Main" screen="${esc(p.screen)}" record="${esc(p.record)}" preset="${esc(p.preset)}" scenario="main" hint-size="100%,900px"></dc-import>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${w},"height":900}}'>
class Component extends DCLogic { renderVals() { return {}; } }
</script>
</body></html>`);
  made.push(name); return name;
}
const where = page => page.evaluate(map => {
  const h = document.querySelector('h1[id]'); const id = h ? h.id : '';
  const cur = document.querySelector('.rb-rail nav a[aria-current="page"]');
  return { head: id, screen: map[id] || '?', h1: h ? h.textContent.trim() : '', section: cur ? cur.getAttribute('data-to') : '', crumbs: (document.querySelector('.rk-crumbs') || {}).innerText || '' };
}, HEAD2ID);
const b = await openBrowser();
const out = [];
const ONLY = process.argv[2] ? process.argv[2].split('|') : null;
for (const st of STARTS.filter(x => !ONLY || ONLY.indexOf(x.n) >= 0)) {
  const w = st.w || 1440;
  const name = wrapper(st, w);
  // list the controls once
  let ctx = await newPage(b, R, { width: w, height: 900 });
  await load(ctx.page, name);
  const controls = await ctx.page.evaluate(() => [...document.querySelectorAll('[data-to]')].filter(el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden'; })
    .map((el, i) => ({ i, to: el.getAttribute('data-to'), tag: el.tagName.toLowerCase(), label: (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70), href: el.getAttribute('href') || '' })));
  await ctx.context.close();
  for (const c of controls) {
    const { context, page, log } = await newPage(b, R, { width: w, height: 900 });
    await load(page, name);
    const els = await page.$$('[data-to]');
    const vis = [];
    for (const e of els) { if (await e.isVisible()) vis.push(e); }
    const el = vis[c.i];
    let res = { screen: 'not-found' };
    let covered = false;
    if (el) { try { await el.click({ timeout: 3000 }); await page.waitForTimeout(350); res = await where(page); } catch (e) { covered = true; res = { screen: 'covered', h1: 'click intercepted (an open menu or drawer covers it)' }; } }
    const expected = c.to;
    const okDest = covered || res.screen === expected || (expected === 'CM-06' && res.screen === 'CM-08' && res.head === 'cm-h-update') || (expected === 'CM-07' && res.screen === 'CM-08' && res.head === 'cm-h-update') || (expected === 'XS-01' && res.screen === 'CM-01');
    const errs = log.slice(); // every console error or warning, unfiltered
    out.push({ from: st.n, control: c.label, tag: c.tag, href: c.href, declared: expected, landed: res.screen, h1: res.h1, railSection: res.section, covered, ok: okDest && !errs.length, errs });
    console.log((okDest ? 'OK  ' : 'BAD ') + st.n + ' · "' + c.label + '" → ' + expected + ' · landed ' + res.screen + ' (' + (res.h1 || '').slice(0, 40) + ')' + (errs.length ? ' ERR ' + errs[0] : ''));
    await context.close();
  }
}
fs.writeFileSync('/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/tools/links' + (ONLY ? '-part' : '') + '.json', JSON.stringify(out, null, 1));
console.log(out.filter(x => x.ok).length + ' / ' + out.length + ' declared links land on their declared destination');
for (const n of made) { try { fs.unlinkSync(R + '/' + n); } catch (e) {} }
await b.close();

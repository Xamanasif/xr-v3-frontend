// Keyboard-only focus evidence: Tab through a few pages and capture the visible focus ring.
// usage: node focusshots.mjs <outDir>
import { openBrowser, newPage, load } from './harness.mjs';
import fs from 'node:fs';
const R = '/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/render-cm';
const out = process.argv[2];
fs.mkdirSync(out, { recursive: true });
const head = fs.readFileSync(R + '/Main.dc.html', 'utf8').split('<body>')[0];
const esc = v => String(v || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
function wrapper(p, w, h) {
  const name = 'F-' + Math.random().toString(36).slice(2, 8) + '.dc.html';
  fs.writeFileSync(R + '/' + name, head.replace(/<title>.*?<\/title>/, '<title>focus</title>') + `<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400..800&amp;display=swap" rel="stylesheet">
<style>body{margin:0}</style>
</helmet>
<dc-import name="Main" screen="${esc(p.screen)}" record="${esc(p.record)}" preset="${esc(p.preset)}" scenario="main" handoffs="false" hint-size="100%,${h}px"></dc-import>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${w},"height":${h}}}'>
class Component extends DCLogic { renderVals() { return {}; } }
</script>
</body></html>`);
  return name;
}
const b = await openBrowser();
const cases = [
  { n: 'focus-skip-1440', p: { screen: 'overview' }, w: 1440, h: 900, tabs: 1 },
  { n: 'focus-skip-375', p: { screen: 'overview' }, w: 375, h: 812, tabs: 1 },
  { n: 'focus-rail-1440', p: { screen: 'overview' }, w: 1440, h: 900, tabs: 4 },
  { n: 'focus-decision-1440', p: { screen: 'decision', record: 'SUB-0077' }, w: 1440, h: 900, until: '#cm-d-c0' },
  { n: 'focus-library-switch-375', p: { screen: 'library' }, w: 375, h: 812, until: '#cm-lib-tab-review' },
  { n: 'focus-codes-1440', p: { screen: 'codes' }, w: 1440, h: 900, until: '#cm-k-code-1' }
];
const report = [];
for (const c of cases) {
  const { context, page } = await newPage(b, R, { width: c.w, height: c.h });
  const name = wrapper(c.p, c.w, c.h);
  await load(page, name);
  let steps = 0, ring = null;
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab'); steps++;
    const hit = await page.evaluate(sel => { const a = document.activeElement; return !!(a && sel && a.matches(sel)); }, c.until || '');
    if ((c.tabs && steps >= c.tabs) || hit) break;
  }
  await page.waitForTimeout(150);
  ring = await page.evaluate(() => { const a = document.activeElement; if (!a) return null; const s = getComputedStyle(a); a.scrollIntoView({ block: 'center' }); return { el: (a.id ? '#' + a.id : a.tagName.toLowerCase()) + ' ' + (a.getAttribute('aria-label') || a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50), outline: s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineColor, focusVisible: a.matches(':focus-visible') }; });
  await page.waitForTimeout(150);
  await page.screenshot({ path: out + '/' + c.n + '.png' });
  report.push({ n: c.n, tabs: steps, ...ring });
  console.log(JSON.stringify({ n: c.n, tabs: steps, ...ring }));
  fs.unlinkSync(R + '/' + name);
  await context.close();
}
fs.writeFileSync(out + '/focus.json', JSON.stringify(report, null, 1));
await b.close();

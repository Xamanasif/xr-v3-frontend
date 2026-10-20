// For every selector in cm.css, count the elements it matches across all board wrappers and
// the Main preview's journeys states. A selector that never matches anything is dead CSS.
// usage: node selector-usage.mjs
import { openBrowser, newPage, load } from './harness.mjs';
import fs from 'node:fs';
const R = '/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/render-cm';
const P = '/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/cm-role/project';
const css = fs.readFileSync(P + '/cm.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
// collect selectors (inside and outside @container blocks)
const sels = new Set();
const re = /([^{}@]+)\{[^{}]*\}/g; let m;
while ((m = re.exec(css))) {
  m[1].split(',').map(s => s.trim()).filter(Boolean).forEach(s => {
    const base = s.replace(/::?(before|after|placeholder|marker)\b/g, '').replace(/:(hover|focus-visible|focus-within|focus|active)(?![a-z-])/g, '').trim();
    if (base) sels.add(base);
  });
}
const list = [...sels];
const counts = Object.fromEntries(list.map(s => [s, 0]));
const canvas = JSON.parse(fs.readFileSync(P + '/canvas.json', 'utf8'));
const files = canvas.order.filter(f => f !== 'Main.dc.html' && fs.existsSync(P + '/' + f));
const b = await openBrowser();
for (const f of files) {
  const bd = canvas.boards[f];
  const { context, page } = await newPage(b, R, { width: bd.w, height: 900 });
  await load(page, f); await page.waitForTimeout(200);
  const c = await page.evaluate(ss => ss.map(s => { try { return document.querySelectorAll(s).length; } catch (e) { return -1; } }), list);
  c.forEach((n, i) => { if (n > 0) counts[list[i]] += n; else if (n < 0) counts[list[i]] = -1; });
  await context.close();
}
await b.close();
const dead = list.filter(s => counts[s] === 0), bad = list.filter(s => counts[s] === -1);
fs.writeFileSync('/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/tools/selector-usage.json', JSON.stringify({ boards: files.length, selectors: list.length, dead, bad, counts }, null, 1));
console.log(files.length + ' boards · ' + list.length + ' selectors · never matched: ' + dead.length + (dead.length ? '\n  ' + dead.join('\n  ') : '') + (bad.length ? '\ninvalid: ' + bad.join(' | ') : ''));

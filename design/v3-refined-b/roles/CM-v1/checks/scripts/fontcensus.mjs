// List every visible text size under 13 px on representative pages, with the element class and a sample.
// usage: node fontcensus.mjs <out.json>
import { openBrowser, newPage, load } from './harness.mjs';
import fs from 'node:fs';
const R = '/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/render-cm';
const head = fs.readFileSync(R + '/Main.dc.html', 'utf8').split('<body>')[0];
const esc = v => String(v || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const cases = JSON.parse(fs.readFileSync('/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/tools/cases-final.json', 'utf8'));
const b = await openBrowser();
const found = {};
for (const w of [1440, 375]) {
  for (const c of cases) {
    const name = 'N-' + Math.random().toString(36).slice(2, 8) + '.dc.html';
    fs.writeFileSync(R + '/' + name, head + `<body><x-dc><helmet><link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400..800&amp;display=swap" rel="stylesheet"><style>body{margin:0}</style></helmet><dc-import name="Main" screen="${esc(c.screen)}" record="${esc(c.record)}" preset="${esc(c.preset)}" scenario="${esc(c.scenario || 'main')}" handoffs="true" hint-size="100%,900px"></dc-import></x-dc><script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${w},"height":900}}'>
class Component extends DCLogic { renderVals() { return {}; } }
</script></body></html>`);
    const { context, page } = await newPage(b, R, { width: w, height: 900 });
    await load(page, name);
    const small = await page.evaluate(() => {
      const out = [];
      const wk = document.createTreeWalker(document.querySelector('.xr') || document.body, NodeFilter.SHOW_TEXT);
      while (wk.nextNode()) {
        const t = wk.currentNode; const s = t.textContent.trim(); if (!s) continue;
        const el = t.parentElement; if (!el || el.closest('.xr-sr') || el.closest('caption') || el.closest('svg') || el.closest('[aria-hidden="true"]:not(.xr-fmt)')) continue;
        const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
        const st = getComputedStyle(el); if (st.visibility === 'hidden' || st.opacity === '0') continue;
        const fs = parseFloat(st.fontSize); if (fs < 13) out.push({ fs, cls: (typeof el.className === 'string' ? el.className : el.tagName).split(' ')[0] || el.tagName.toLowerCase(), t: s.slice(0, 24) });
      }
      return out;
    });
    for (const s of small) { const k = s.fs + ' · ' + s.cls; if (!found[k]) found[k] = { fs: s.fs, cls: s.cls, samples: new Set(), where: new Set() }; found[k].samples.add(s.t); found[k].where.add(c.n + '@' + w); }
    fs.unlinkSync(R + '/' + name);
    await context.close();
  }
}
const res = Object.values(found).map(f => ({ fs: f.fs, cls: f.cls, samples: [...f.samples].slice(0, 8), pages: f.where.size }));
fs.writeFileSync(process.argv[2], JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
await b.close();

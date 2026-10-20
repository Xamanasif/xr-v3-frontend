// Collect the runtime's "{{ x }} never resolved — rendered as empty" warnings per state.
// usage: node unresolved.mjs <out.json>
import { openBrowser, newPage, load } from './harness.mjs';
import fs from 'node:fs';
const R = '/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/render-cm';
const head = fs.readFileSync(R + '/Main.dc.html', 'utf8').split('<body>')[0];
const esc = v => String(v || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const cases = JSON.parse(fs.readFileSync('/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/tools/cases-final.json', 'utf8'))
  .concat(JSON.parse(fs.readFileSync('/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/tools/cases-dlg.json', 'utf8')));
const b = await openBrowser();
const out = {};
for (const c of cases) {
  const name = 'U-' + Math.random().toString(36).slice(2, 8) + '.dc.html';
  fs.writeFileSync(R + '/' + name, head + `<body><x-dc><helmet><link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400..800&amp;display=swap" rel="stylesheet"><style>body{margin:0}</style></helmet><dc-import name="Main" screen="${esc(c.screen)}" record="${esc(c.record)}" preset="${esc(c.preset)}" scenario="${esc(c.scenario || 'main')}" handoffs="true" hint-size="100%,900px"></dc-import></x-dc><script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":900}}'>
class Component extends DCLogic { renderVals() { return {}; } }
</script></body></html>`);
  const { context, page, log } = await newPage(b, R, { width: 1440, height: 900 });
  await load(page, name);
  await page.waitForTimeout(200);
  const un = [...new Set(log.filter(l => /never resolved/.test(l)).map(l => (l.match(/\{\{ (.*?) \}\}/) || [, l])[1]))];
  const other = log.filter(l => !/never resolved/.test(l));
  out[c.n] = { unresolved: un, other };
  console.log(c.n, un.length ? un.join(', ') : '-', other.length ? ' OTHER: ' + other[0] : '');
  fs.unlinkSync(R + '/' + name);
  await context.close();
}
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
await b.close();

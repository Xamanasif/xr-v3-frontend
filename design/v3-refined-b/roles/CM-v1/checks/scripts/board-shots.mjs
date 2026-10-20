// Full-page screenshots of board wrappers at their natural height (frame reset to the minimum).
// usage: node board-shots.mjs <outDir> <prefix...>
import { openBrowser, newPage, load } from './harness.mjs';
import fs from 'node:fs';
const R = '/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/render-cm';
const P = '/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/cm-role/project';
const [out, ...prefixes] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const canvas = JSON.parse(fs.readFileSync(P + '/canvas.json', 'utf8'));
const files = canvas.order.filter(f => f !== 'Main.dc.html' && prefixes.some(p => f.startsWith(p)));
const b = await openBrowser();
for (const f of files) {
  const bd = canvas.boards[f], min = bd.w <= 375 ? 812 : 900;
  const src = fs.readFileSync(P + '/' + f, 'utf8');
  const tmp = 'S-' + Math.random().toString(36).slice(2, 8) + '.dc.html';
  fs.writeFileSync(R + '/' + tmp, src.replace(/hint-size="100%,\d+px"/, `hint-size="100%,${min}px"`).replace(/"\$preview":\{"width":(\d+),"height":\d+\}/, `"$preview":{"width":$1,"height":${min}}`));
  const { context, page, log } = await newPage(b, R, { width: bd.w, height: min });
  await load(page, tmp); await page.waitForTimeout(250);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.setViewportSize({ width: bd.w, height: Math.min(h, 9000) }); await page.waitForTimeout(150);
  await page.screenshot({ path: out + '/' + f.replace('.dc.html', '.png'), fullPage: true });
  console.log(f, h, log.length ? 'ERR ' + log[0] : '');
  fs.unlinkSync(R + '/' + tmp); await context.close();
}
await b.close();

// Measure the natural content height of every board wrapper: render a scratch copy of the wrapper
// whose frame is set to the minimum (900, or 812 at 375) and read the document height.
// Dialog and drawer boards are viewport overlays and keep their frame. Writes board-heights.json.
// usage: node measure-boards.mjs
import { openBrowser, newPage, load } from './harness.mjs';
import fs from 'node:fs';
const R = '/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/render-cm';
const P = '/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/cm-role/project';
const OUT = '/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/tools/board-heights.json';
const FIXED = ['P01-Confirm-1440.dc.html', 'C05-SendDialog-1440.dc.html', 'C11-WithdrawDialog-1440.dc.html', 'X01-AccountMenu-1440.dc.html', 'X02-Drawer-375.dc.html'];
const canvas = JSON.parse(fs.readFileSync(P + '/canvas.json', 'utf8'));
const files = canvas.order.filter(f => f !== 'Main.dc.html' && fs.existsSync(P + '/' + f));
const b = await openBrowser();
const res = {};
for (const f of files) {
  const bd = canvas.boards[f];
  if (FIXED.includes(f)) { res[f] = { w: bd.w, old: bd.h, h: bd.h, fixed: true }; continue; }
  const min = bd.w <= 375 ? 812 : 900;
  const src = fs.readFileSync(P + '/' + f, 'utf8');
  const tmp = 'M-' + Math.random().toString(36).slice(2, 8) + '.dc.html';
  const body = src.replace(/hint-size="100%,\d+px"/, `hint-size="100%,${min}px"`).replace(/"\$preview":\{"width":(\d+),"height":\d+\}/, `"$preview":{"width":$1,"height":${min}}`);
  fs.writeFileSync(R + '/' + tmp, body);
  const { context, page, log } = await newPage(b, R, { width: bd.w, height: min });
  await load(page, tmp);
  await page.waitForTimeout(250);
  const h = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
  res[f] = { w: bd.w, old: bd.h, h: Math.max(min, h), errs: log.slice() };
  console.log(f, bd.w, bd.h, '→', Math.max(min, h), log.length ? 'ERR ' + log[0] : '');
  fs.unlinkSync(R + '/' + tmp);
  await context.close();
}
fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
await b.close();

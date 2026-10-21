// Real-interaction focus management: open the submit dialog, the menu drawer and the account menu the way a person does,
// then check where focus goes, that Tab and Shift+Tab stay inside the modal ones, and that Escape returns focus to the opener.
import fs from 'node:fs';
import path from 'node:path';
import { startServer, launch, openPage } from '../harness.mjs';
const SRC = '/home/claude/work/project', BED = '/home/claude/work/fxtrapbed', OUT = process.argv[2];
fs.rmSync(BED, { recursive: true, force: true }); fs.mkdirSync(BED, { recursive: true });
for (const f of fs.readdirSync(SRC)) fs.copyFileSync(path.join(SRC, f), path.join(BED, f));
const wrap = (n, sc, scr) => fs.writeFileSync(path.join(BED, `t-${n}.dc.html`), `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>${n}</title><script src="./support.js"></script><link rel="stylesheet" href="./core.css"><link rel="stylesheet" href="./rb.css"><link rel="stylesheet" href="./rb-kit.css"><link rel="stylesheet" href="./v3-student-final.css"></head><body>\n<x-dc>\n<helmet><style>body{margin:0}</style></helmet>\n<dc-import name="StudentFinal" scenario="${sc}" screen="${scr}" chrome="none" hint-size="100%,100%"></dc-import>\n</x-dc>\n<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":1440,"height":900}}'>\nclass Component extends DCLogic { renderVals() { return {}; } }\n</script>\n</body></html>\n`);
wrap('att', 'inprog', 'ST-13'); wrap('home', 'learn', 'ST-01');
const srv = await startServer(BED); const browser = await launch();
const res = []; const ok = (name, cond, detail) => { res.push({ name, ok: !!cond, detail: cond ? undefined : detail }); console.log((cond ? 'PASS ' : 'FAIL ') + name + (cond ? '' : ' → ' + JSON.stringify(detail).slice(0, 200))); };
const where = page => page.evaluate(() => { const a = document.activeElement; return { id: a?.id || '', tag: a?.tagName || '', inDialog: !!a?.closest('[role="dialog"]'), inDrawer: !!a?.closest('.rb-drawer'), inMenu: !!a?.closest('.xsb-menu'), name: (a?.getAttribute('aria-label') || a?.textContent || '').trim().slice(0, 30) }; });
for (const w of [1440, 768, 375]) {
  // submit dialog
  let { ctx, page } = await openPage(browser, srv.port, 't-att.dc.html', w, 900, { settle: 450 });
  await page.locator('.st-att-submit .rb-btn--primary, .sv-attpanel .rb-btn--primary').filter({ visible: true }).first().click(); await page.waitForTimeout(250);
  let a = await where(page); ok(`dialog @${w}: focus moves into the dialog on open`, a.inDialog, a);
  let inside = true; for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(40); if (!(await where(page)).inDialog) inside = false; }
  ok(`dialog @${w}: Tab ×8 stays inside`, inside);
  inside = true; for (let i = 0; i < 8; i++) { await page.keyboard.press('Shift+Tab'); await page.waitForTimeout(40); if (!(await where(page)).inDialog) inside = false; }
  ok(`dialog @${w}: Shift+Tab ×8 stays inside`, inside);
  await page.keyboard.press('Escape'); await page.waitForTimeout(250);
  a = await where(page); const open = await page.locator('[role="dialog"].rk-dialog').count();
  ok(`dialog @${w}: Escape closes it and focus returns to Submit`, !open && /submit/i.test(a.name), { open, a });
  await ctx.close();
  // menu drawer (below 1024) or account menu (all widths)
  ({ ctx, page } = await openPage(browser, srv.port, 't-home.dc.html', w, 900, { settle: 450 }));
  if (w < 1024) {
    await page.click('#st-menu'); await page.waitForTimeout(250);
    a = await where(page); ok(`drawer @${w}: focus on Close when it opens`, a.inDrawer && a.id === 'st-menu-close', a);
    inside = true; for (let i = 0; i < 10; i++) { await page.keyboard.press('Tab'); await page.waitForTimeout(40); if (!(await where(page)).inDrawer) inside = false; }
    ok(`drawer @${w}: Tab ×10 stays inside`, inside);
    inside = true; for (let i = 0; i < 10; i++) { await page.keyboard.press('Shift+Tab'); await page.waitForTimeout(40); if (!(await where(page)).inDrawer) inside = false; }
    ok(`drawer @${w}: Shift+Tab ×10 stays inside`, inside);
    await page.keyboard.press('Escape'); await page.waitForTimeout(250);
    a = await where(page); ok(`drawer @${w}: Escape closes it, focus back on Menu`, a.id === 'st-menu' && !(await page.locator('.rb-drawer').count()), a);
  }
  await page.click('#st-acct'); await page.waitForTimeout(250);
  const exp = await page.getAttribute('#st-acct', 'aria-expanded');
  ok(`account menu @${w}: opens, aria-expanded true`, exp === 'true' && await page.locator('.xsb-menu').count(), exp);
  await page.keyboard.press('Tab'); await page.waitForTimeout(60); a = await where(page);
  ok(`account menu @${w}: Tab reaches its first item`, a.inMenu, a);
  await page.keyboard.press('Escape'); await page.waitForTimeout(250); a = await where(page);
  ok(`account menu @${w}: Escape closes it, focus back on the account button`, a.id === 'st-acct' && !(await page.locator('.xsb-menu').count()), a);
  await ctx.close();
}
fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
console.log(res.filter(r => r.ok).length, '/', res.length, 'passed');
await browser.close(); srv.close();

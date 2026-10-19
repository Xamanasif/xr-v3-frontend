// Sweep: every sample person signs in, visits every rail destination and Help & support, reads the
// account menu items, and signs out. Reports focus target, aria-current and menu contents.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const BASE = 'http://127.0.0.1:8765/';
const people = [
  ['rahul.verma@godavari.edu.in', 'Student'], ['sneha.reddy@godavari.edu.in', 'Student (inactive)'], ['s.ranganathan@godavari.edu.in', 'Faculty'],
  ['meera.iyer@godavari.edu.in', 'Institute Admin'], ['anil.shetty@northline.example', 'Vendor'], ['a.menon@wilp.example', 'Academic Reviewer'],
  ['kavya.nair@wilp.example', 'Content Manager'], ['arjun.mehta@wilp.example', 'Super Admin']];
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--disable-background-networking'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.goto(BASE + 'Main.dc.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const out = [];
  for (const [email, label] of people) {
    await page.fill('#xs-signin-email', email); await page.fill('#xs-signin-pw', 'x'); await page.click('#xs-signin-go'); await page.waitForTimeout(1400);
    const navs = await page.$$eval('.rb-rail .rb-nav[aria-label$="navigation"] a', as => as.map(a => a.textContent.trim()));
    const res = [];
    for (let i = 0; i < navs.length; i++) {
      await page.locator('.rb-rail .rb-nav[aria-label$="navigation"] a').nth(i).click(); await page.waitForTimeout(350);
      const r = await page.evaluate(() => ({ h1: (document.activeElement && document.activeElement.tagName === 'H1') ? document.activeElement.textContent.trim() : 'FOCUS:' + (document.activeElement ? document.activeElement.tagName : 'none'), cur: [...document.querySelectorAll('.rb-rail a[aria-current="page"]')].map(a => a.textContent.trim()).join('|') }));
      res.push(navs[i] + (r.h1 === navs[i].replace(/\d+$/, '').replace(/, .*$/, '') || navs[i].startsWith(r.h1) ? '' : ' [h1=' + r.h1 + ']') + (r.cur.startsWith(r.h1) ? '' : ' [current=' + r.cur + ']'));
    }
    await page.locator('.rb-rail-foot a').click(); await page.waitForTimeout(450);
    const help = await page.evaluate(() => (document.activeElement && document.activeElement.textContent.trim()) + ' | current=' + [...document.querySelectorAll('.rb-rail a[aria-current="page"]')].map(a => a.textContent.trim()).join('|') + ' | rows=' + document.querySelectorAll('.xs-report').length + (document.querySelector('.rk-state-t') ? ' | ' + document.querySelector('.rk-state-t').textContent : ''));
    await page.click('#xs-acct-btn'); await page.waitForTimeout(300);
    const menu = await page.$$eval('.xs-menu .xs-menu-item', b => b.map(x => x.textContent.trim()).join(' · '));
    const head = await page.$eval('.xs-menu-head', h => h.innerText.replace(/\n/g, ' / '));
    const btn = await page.getAttribute('#xs-acct-btn', 'aria-label');
    await page.click('#xs-acct-out'); await page.waitForTimeout(700);
    const after = await page.evaluate(() => document.activeElement ? document.activeElement.textContent.trim() : 'none');
    out.push('## ' + label + ' <' + email + '>\n  rail: ' + res.join(' · ') + '\n  Help & support: ' + help + '\n  account button: ' + btn + '\n  menu head: ' + head + '\n  menu items: ' + menu + '\n  after Sign out focus: ' + after);
  }
  console.log(out.join('\n') + '\nconsole errors: ' + (errs.length ? errs.join(' | ') : 'none'));
  await browser.close();
})();

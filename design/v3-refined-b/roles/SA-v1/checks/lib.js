const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const B = '/tmp/claude-0/-home-claude/9dd82845-6f03-5145-97c4-57f4a85bf659/scratchpad';
const WOFF = fs.readFileSync(B + '/fontpkg/node_modules/@fontsource-variable/public-sans/files/public-sans-latin-wght-normal.woff2');
const INDEX = 'file://' + B + '/build/project/index.html';
async function open(width, query, hash, opts) {
  const browser = opts && opts.browser || await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: "@font-face{font-family:'Public Sans';font-style:normal;font-weight:100 900;font-display:swap;src:url(https://fonts.gstatic.com/ps.woff2) format('woff2')}" }));
  await page.route('https://fonts.gstatic.com/**', r => r.fulfill({ contentType: 'font/woff2', body: WOFF }));
  await page.goto(INDEX + (query || '?clean=1') + (hash || '#/overview'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(150);
  return { browser, ctx, page, errors };
}
async function overflow(page) {
  return page.evaluate(() => {
    const doc = document.documentElement, vw = doc.clientWidth, out = [];
    if (doc.scrollWidth > vw + 1) out.push('page scrollWidth ' + doc.scrollWidth + ' > ' + vw);
    document.querySelectorAll('#app *').forEach(el => {
      const r = el.getBoundingClientRect(); if (!r.width) return;
      if (r.right > vw + 1 && !el.closest('.rk-switch,.rk-tabs,.rb-switch,.sa-tablewrap,.rb-drawer,.rk-dialog,.sa-pv,.rk-aside')) {
        const st = getComputedStyle(el); if (st.position === 'fixed') return;
        out.push((el.id || el.className || el.tagName).toString().slice(0, 60) + ' right=' + Math.round(r.right));
      }
    });
    return out.slice(0, 8);
  });
}
module.exports = { open, overflow, B, INDEX, chromium };

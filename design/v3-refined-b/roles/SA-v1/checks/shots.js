const { open, chromium, B } = require('./lib');
const fs = require('fs');
(async () => {
  const w = Number(process.argv[2]); const routes = process.argv[3].split(','); const q = process.argv[4] || '?clean=1'; const dir = B + '/shots/' + (process.argv[5] || 'dev');
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  const { page, errors, ctx } = await open(w, q, '#/overview', { browser });
  for (const r of routes) {
    await page.evaluate(h => { location.hash = h; }, r); await page.waitForTimeout(150);
    const name = w + '_' + r.replace(/[#\/]+/g, '_').replace(/^_/, '') + '.png';
    await page.screenshot({ path: dir + '/' + name, fullPage: true });
    console.log(dir + '/' + name);
  }
  if (errors.length) console.log(errors);
  await browser.close();
})();

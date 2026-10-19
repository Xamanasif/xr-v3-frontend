const { open, overflow, chromium } = require('./lib');
const ROUTES = ['#/overview','#/requests','#/requests/hyderabad-renewal','#/requests/godavari-licences','#/requests/vizag-new-access','#/institutions','#/institutions/godavari','#/institutions/sahyadri','#/institutions/deccan','#/institutions/vizag','#/institutions/malnad','#/institutions/bitshyd','#/content/updates','#/content/updates/distillation-1-3','#/content/updates/boiler-2-1','#/content/updates/orifice-1-1','#/content/updates/induction-motor-1-1','#/content/all','#/content/records/dc-motor','#/content/records/distillation-column','#/content/records/transient-cooling','#/structure','#/structure/areas/chemical','#/structure/courses/me-zg523','#/structure/courses/mel-zg512','#/roles/vendors','#/roles/reviewers','#/roles/holder/k-iyer','#/roles/holder/a-menon','#/operations/device-transfers','#/operations/device-transfers/rahul-verma-vr','#/operations/device-transfers/neha-kulkarni-vr','#/operations/device-transfers/imran-shaikh-vr','#/operations/support','#/operations/support/import-part-way','#/operations/support/lab-brief-blank','#/operations/access-ending','#/help','#/signed-out','#/nowhere'];
(async () => {
  const browser = await chromium.launch();
  const widths = process.argv[2] ? process.argv[2].split(',').map(Number) : [1440];
  for (const w of widths) {
    const { page, errors, ctx } = await open(w, '?clean=1', '#/overview', { browser });
    for (const r of ROUTES) {
      await page.evaluate(h => { location.hash = h; }, r); await page.waitForTimeout(80);
      const h1 = await page.evaluate(() => { const e = document.getElementById('page-h1'); return e ? e.textContent : 'NO H1'; });
      const of = await overflow(page);
      const ids = await page.evaluate(() => { const t = document.getElementById('app').innerText; const m = t.match(/\b(REQ|ACC|UPD|DTR|SUP|SUB)-\d{3,4}\b/g); const a = Array.from(document.querySelectorAll('[aria-label]')).map(e => e.getAttribute('aria-label')).join(' ').match(/\b(REQ|ACC|UPD|DTR|SUP|SUB)-\d{3,4}\b/g); return (m || []).concat(a || []); });
      const dead = await page.evaluate(() => Array.from(document.querySelectorAll('#app a')).filter(a => { const h = a.getAttribute('href'); return !h || h === '#'; }).length);
      console.log(w, r.padEnd(46), '|', h1.slice(0, 50), of.length ? ' OVERFLOW ' + of.join('; ') : '', ids.length ? ' IDS ' + ids : '', dead ? ' DEAD ' + dead : '');
    }
    if (errors.length) console.log('ERRORS', errors.slice(0, 10));
    await ctx.close();
  }
  await browser.close();
})();

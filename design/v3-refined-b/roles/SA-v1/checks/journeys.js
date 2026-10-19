const { open, chromium } = require('./lib');
let pass = 0, fail = 0; const log = [];
const ok = (c, m) => { if (c) { pass++; log.push('PASS ' + m); } else { fail++; log.push('FAIL ' + m); } };
const txt = p => p.evaluate(() => document.getElementById('app').innerText);
const go = async (p, h) => { await p.evaluate(x => { location.hash = x; }, h); await p.waitForTimeout(120); };
const act = async (p) => p.evaluate(() => document.activeElement && (document.activeElement.id || document.activeElement.textContent.slice(0, 40)));
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch();
  let s = await open(1440, '?clean=1&scenario=new', '#/requests', { browser }); let p = s.page;
  // J1 new access → External
  ok((await txt(p)).includes('Thursday 8 October 2026'), 'J1 scenario new is as of 8 Oct');
  const navBefore = await p.textContent('.rb-rail .rb-count');
  await p.click('a[href="#/requests/godavari-new-access"].rk-rowlink'); await wait(150);
  ok((await act(p)) === 'page-h1', 'J1 opening a row focuses the record title');
  await p.click('#dc-c0'); await p.click('#dc-go'); await wait(120);
  ok((await act(p)) === 'dc-errs', 'J1 error summary receives focus');
  ok((await txt(p)).includes('Choose internal or external'), 'J1 missing classification is refused');
  await p.click('#dc-r1'); await wait(60); await p.click('#dc-go'); await wait(120);
  ok((await act(p)) === 'dlg-t', 'J1 confirmation dialog focuses its title');
  await p.keyboard.press('Tab'); ok((await act(p)) === 'dlg-cancel', 'J1 Tab moves to Cancel');
  await p.keyboard.press('Tab'); await p.keyboard.press('Tab'); ok((await act(p)) === 'dlg-cancel', 'J1 Tab cycles inside the dialog');
  ok((await txt(p)).includes('Institutional access is not activated now'), 'J1 external dialog says access waits for payment');
  await p.click('#dlg-ok'); await wait(150);
  ok((await act(p)) === 'dc-done', 'J1 outcome receives focus');
  const t1 = await txt(p); ok(t1.includes('Approved — payment required') && t1.includes('Waiting, not confirmed'), 'J1 status payment required, payment waiting');
  ok(!/mark (as )?paid/i.test(t1) && !/decline/i.test(t1), 'J1 no Mark paid and no Decline control');
  await p.click('#dc-done a[href="#/requests"]'); await wait(150);
  ok((await act(p)) === 'page-h1', 'J1 back to list focuses the Requests heading');
  const navAfter = await p.textContent('.rb-rail .rb-count');
  ok(Number(navAfter.trim()[0]) === Number(navBefore.trim()[0]) - 1, 'J1 nav count ' + navBefore.trim()[0] + ' → ' + navAfter.trim()[0]);
  ok((await p.innerText('tr[data-href="#/requests/godavari-new-access"]')).includes('Approved — payment required'), 'J1 list row shows payment required');
  await go(p, '#/institutions'); ok((await txt(p)).includes('Godavari Institute of Technology'), 'J1 institution record created by the approval');
  await go(p, '#/institutions/godavari'); const t1b = await txt(p); ok(t1b.includes('No access plan yet') && !t1b.includes('Pause access'), 'J1 new external institution: no plan, no status action');
  // J2 internal
  await p.evaluate(() => { window.SA.S = window.SA.build('new'); window.SA.S.sim = { list: null, stale: false }; }); await go(p, '#/requests/godavari-new-access');
  await p.click('#dc-c0'); await wait(40); await p.click('#dc-r0'); await wait(40); await p.click('#dc-go'); await wait(100);
  ok((await txt(p)).includes('Institutional access is activated now'), 'J2 internal dialog says access activates now');
  await p.click('#dlg-ok'); await wait(150); const t2 = await txt(p);
  ok(t2.includes('Access active') && t2.includes('Not needed (internal)'), 'J2 internal: access active, no payment');
  await go(p, '#/overview'); ok((await txt(p)).includes('Godavari Institute of Technology has no Institute Admin'), 'J2 new institution appears in set-up gaps');
  await s.ctx.close();

  // busy scenario
  s = await open(1440, '?clean=1', '#/institutions/sahyadri', { browser }); p = s.page;
  await p.click('#in-assign'); await wait(100); ok((await act(p)) === 'dlg-ia-n', 'J3 assign dialog focuses the name field');
  await p.click('#dlg-ok'); await wait(100); const t3 = await txt(p); ok(t3.includes('Enter the person’s name') && t3.includes('Enter a work e-mail address'), 'J3 both assign errors show');
  await p.fill('#dlg-ia-n', 'N. Joshi'); await p.fill('#dlg-ia-e', 'meera.iyer@godavari.edu.in'); await p.click('#dlg-ok'); await wait(100);
  ok((await txt(p)).includes('already belongs to another person’s sign-in'), 'J3 identity collision refused');
  await p.fill('#dlg-ia-e', 'n.joshi@sahyadri.example'); await p.click('#dlg-ok'); await wait(800);
  ok((await act(p)) === 'sa-flash' && (await txt(p)).includes('N. Joshi is now the Institute Admin'), 'J3 assigned, flash focused');
  await go(p, '#/overview'); ok(!(await txt(p)).includes('has no Institute Admin'), 'J3 overview set-up gap cleared');
  // J4 pause/restore
  await go(p, '#/institutions/godavari'); await p.click('#in-pause'); await wait(80); await p.click('#dlg-ok'); await wait(80);
  ok((await txt(p)).includes('Add a reason — it is kept in the history'), 'J4 pause needs a reason');
  await p.fill('#dlg-reason', 'Checking the student list.'); await p.click('#dlg-ok'); await wait(800);
  ok((await txt(p)).includes('Access paused'), 'J4 paused');
  await go(p, '#/requests/godavari-licences'); ok((await txt(p)).includes('This institution is paused') && !(await p.$('#dc-go')), 'J4 request from paused institution cannot be decided');
  await go(p, '#/institutions/godavari'); await p.click('#in-restore'); await wait(60); await p.fill('#dlg-reason', 'Done.'); await p.click('#dlg-ok'); await wait(800);
  ok((await txt(p)).includes('Access restored'), 'J4 restored');
  await p.click('#in-pause'); await wait(60); await p.keyboard.press('Escape'); await wait(100); ok((await act(p)) === 'in-pause', 'J4 Escape closes the dialog and returns focus');
  // J5 update hold/lift/release
  await go(p, '#/content/updates/distillation-1-3'); await p.click('#up-c1'); await wait(60); await p.click('#up-go'); await wait(80);
  ok((await txt(p)).includes('Add a reason — it is kept in the history'), 'J5 hold needs a reason');
  await p.fill('#up-reason', 'Wait until this month’s runs finish.'); await p.click('#up-go'); await wait(80); await p.click('#dlg-ok'); await wait(800);
  const t5 = await txt(p); ok(t5.includes('Release isn’t available while the update is on hold') && !(await p.$('#up-go')), 'J5 release refused while held');
  await go(p, '#/content/records/distillation-column'); ok((await txt(p)).includes('Version 1.2, live since'), 'J5 live version unchanged while held');
  await go(p, '#/content/updates/distillation-1-3'); await p.click('#up-lift'); await wait(60); await p.click('#dlg-ok'); await wait(800);
  ok((await txt(p)).includes('Hold lifted'), 'J5 hold lifted, waiting again');
  await p.click('#up-c0'); await wait(40); await p.click('#up-go'); await wait(80); ok((await txt(p)).includes('No institution’s or student’s access changes'), 'J5 release dialog says access unchanged');
  await p.click('#dlg-ok'); await wait(800);
  await go(p, '#/content/records/distillation-column'); ok((await txt(p)).includes('Version 1.3, live since'), 'J5 released: 1.3 live');
  await go(p, '#/overview'); ok((await p.textContent('#ov-upd b')) === '0', 'J5 corrections count now 0');
  // J6 stuck override
  await go(p, '#/content/records/dc-motor'); await p.click('#rc-go'); await wait(80); ok((await txt(p)).includes('Add a reason — it is kept in the history'), 'J6 override needs a reason');
  ok(!(await txt(p)).match(/To\s*Published/), 'J6 Published is never a target');
  await p.fill('#rc-reason', 'No reviewer this term.'); await p.click('#rc-go'); await wait(80); await p.click('#dlg-ok'); await wait(800);
  ok((await txt(p)).includes('Returned to the vendor'), 'J6 moved back to vendor');
  await go(p, '#/overview'); ok((await p.textContent('#ov-setup b')) === '1', 'J6 set-up gaps 3 → 1 (IA assigned, stuck cleared)');
  // J7 scope assign/withdraw/restore
  await go(p, '#/roles/holder/k-iyer'); await p.click('#ho-go'); await wait(80); ok((await txt(p)).includes('Choose what they can act on'), 'J7 scope kind required');
  await p.click('#ho-k1'); await wait(60); await p.click('#ho-go'); await wait(80); ok((await txt(p)).includes('Choose a course'), 'J7 missing course refused');
  await p.selectOption('#ho-v', 'EEE ZC341'); await wait(60); await p.click('#ho-go'); await wait(100);
  ok((await txt(p)).includes('Scope assigned: EEE ZC341'), 'J7 scope assigned, holder record updated');
  await p.click('#ho-k1'); await wait(60); await p.selectOption('#ho-v', 'EEE ZC341'); await wait(60); await p.click('#ho-go'); await wait(80); ok((await txt(p)).includes('They already have this scope'), 'J7 duplicate scope refused');
  await go(p, '#/roles/holder/a-menon'); await p.click('#wd-btn-0'); await wait(60); await p.click('[data-act="wdSave"]'); await wait(60);
  ok((await txt(p)).includes('Add a reason'), 'J7 withdraw needs a reason');
  await p.fill('#wd-r-0', 'Moving to another reviewer.'); await p.click('[data-act="wdSave"]'); await wait(100); ok((await txt(p)).includes('Scope withdrawn: ME ZG523'), 'J7 withdrawn');
  await p.click('#rs-btn-0'); await wait(60); await p.click('#dlg-ok'); await wait(800); ok((await txt(p)).includes('Scope restored: ME ZG523'), 'J7 restored');
  // J8 support
  await go(p, '#/operations/support/usage-slow'); await p.click('#sp-go'); await wait(60); ok((await txt(p)).includes('Add a note — the reporter sees it'), 'J8 resolve needs a note');
  await p.fill('#sp-note', 'The usage page now loads in seconds.'); await p.click('#sp-go'); await wait(100); ok((await txt(p)).includes('Report resolved'), 'J8 resolved');
  await p.click('#sp-reopen'); await wait(60); await p.click('#dlg-ok'); await wait(800); ok((await txt(p)).includes('Report reopened'), 'J8 reopened');
  // J9 transfer + J10 stale
  await go(p, '#/operations/device-transfers/rahul-verma-vr'); ok(!/decline/i.test((await txt(p)).replace(/There is no Decline/g, '')), 'J9 no Decline control');
  await p.evaluate(() => { window.SA.S.sim.stale = true; }); await p.click('#tr-go'); await wait(60); await p.click('#dlg-ok'); await wait(150);
  ok((await txt(p)).includes('This record changed after you opened it') && (await act(p)) === 'sa-refusal', 'J10 stale decision refused, focus on refusal');
  ok((await txt(p)).includes('Forwarded'), 'J10 nothing changed after refusal');
  await p.click('[data-act="clearRefusal"]'); await wait(80); await p.click('#tr-go'); await wait(60); ok((await txt(p)).includes('Nothing is shipped, collected or registered'), 'J9 approval is not shipment');
  await p.click('#dlg-ok'); await wait(800); ok((await txt(p)).includes('Approved'), 'J9 approved');
  // J16 help
  await go(p, '#/help'); await p.click('#hp-send'); await wait(80); ok((await act(p)) === 'hp-errs', 'J16 help validation focused');
  await p.fill('#hp-what', 'The overview date looks wrong.'); await p.click('#hp-send'); await wait(100); ok((await txt(p)).includes('Report sent'), 'J16 report sent');
  await go(p, '#/operations/support'); ok((await txt(p)).includes('The overview date looks wrong.'), 'J16 report appears in Support');
  // J17 structure
  await go(p, '#/structure'); await p.click('#st-add-course'); await wait(80); await p.click('#dlg-ok'); await wait(80);
  const t17 = await txt(p); ok(t17.includes('Enter the course name') && t17.includes('Choose the engineering area it belongs to'), 'J17 add course validation');
  await p.keyboard.press('Escape'); await wait(80);
  await go(p, '#/structure/courses/me-zg523'); ok((await txt(p)).includes('This course can’t be moved') && !(await p.$('#co-move')), 'J17 move blocked when people are filed');
  await p.click('#co-rename'); await wait(80); await p.click('#dlg-ok'); await wait(80); ok((await txt(p)).includes('Enter a different name'), 'J17 rename to same name refused');
  await p.keyboard.press('Escape');
  // J13 account menu
  await go(p, '#/overview'); await p.click('#sa-acct'); await wait(80); ok((await act(p)) === 'sa-acct-help', 'J13 account menu focuses first item');
  await p.keyboard.press('ArrowDown'); ok((await act(p)) === 'sa-acct-out', 'J13 arrow keys move in the menu');
  await p.keyboard.press('Escape'); await wait(80); ok((await act(p)) === 'sa-acct', 'J13 Escape returns focus to the account button');
  // no internal ids anywhere after mutations
  for (const h of ['#/overview', '#/requests', '#/institutions/godavari', '#/content/all', '#/operations/support']) { await go(p, h); const m = (await p.evaluate(() => document.getElementById('app').innerHTML)).match(/\b(REQ|ACC|UPD|DTR|SUP|SUB)-\d{3,4}\b/g); ok(!m, 'IDs hidden in markup ' + h); }
  ok(s.errors.length === 0, 'no console errors (' + s.errors.join(' | ') + ')');
  await s.ctx.close();

  // J11 drawer at 768
  s = await open(768, '?clean=1', '#/overview', { browser }); p = s.page;
  ok(await p.isVisible('#sa-menu'), 'J11 Menu shows below 1024');
  await p.click('#sa-menu'); await wait(100); ok((await act(p)) === 'sa-menu-close', 'J11 drawer focuses Close');
  await p.keyboard.press('Shift+Tab'); ok((await p.evaluate(() => document.getElementById('sa-drawer').contains(document.activeElement))), 'J11 focus stays in drawer');
  await p.keyboard.press('Escape'); await wait(100); ok((await act(p)) === 'sa-menu', 'J11 Escape returns to Menu');
  await p.click('#sa-menu'); await wait(80); await p.click('#sa-drawer a[href="#/institutions"]'); await wait(150); ok(!(await p.$('#sa-drawer')) && (await txt(p)).includes('Every institution on the platform'), 'J11 drawer link navigates and closes');
  await s.ctx.close();
  // J14 quiet + J15 list states
  s = await open(1440, '?clean=1&scenario=quiet', '#/overview', { browser }); p = s.page;
  ok((await txt(p)).includes('Nothing is waiting'), 'J14 quiet overview');
  await p.click('#ov-dtr'); await wait(80); ok((await txt(p)).includes('No device transfer has been forwarded to BITS') && (await p.$('a[href="#/operations/device-transfers"]')), 'J14 quiet group still reachable');
  await s.ctx.close();
  for (const st of ['loading', 'failed', 'empty']) { s = await open(1440, '?clean=1&list=' + st, '#/requests', { browser }); p = s.page; const t = await txt(p);
    ok(st === 'loading' ? t.includes('Loading requests…') : st === 'failed' ? t.includes('Nothing has changed. Try again.') : t.includes('No requests yet') && !(await p.$('#rq-q')), 'J15 list ' + st); if (st === 'failed') { await p.click('[data-act="retryList"]'); await wait(80); ok((await txt(p)).includes('8 requests'), 'J15 Try again loads'); } await s.ctx.close(); }
  s = await open(1440, '?clean=1', '#/requests', { browser }); p = s.page; await p.fill('#rq-q', 'Narmada'); await wait(80); ok((await txt(p)).includes('No requests match these filters'), 'J15 no match'); await p.click('.rk-state [data-act="reqClear"]'); await wait(80); ok((await act(p)) === 'rq-q', 'J15 Clear filters returns focus to Search');
  await s.ctx.close();
  s = await open(1440, '?clean=1&scenario=konark', '#/requests/konark-licences', { browser }); p = s.page; ok((await txt(p)).includes('This institution is paused'), 'J18 Konark-paused scenario reproduces the V3 SA-03 paused board'); await s.ctx.close();
  await browser.close();
  console.log(log.join('\n')); console.log('\nTOTAL pass=' + pass + ' fail=' + fail);
})();

// Student final journeys against StudentFinal.dc.html (review chrome on): the five required journeys from the brief plus
// keyboard and dialog checks. Every page visited also gets the page checks (one H1, at most one gold action, no "#" links).
// Internal record identifiers (SACC-/ACC-/DTR-) are not labels on Student pages (owner decision at approval): no page shows one, and the request is identified by its dated steps, From / To and the student's note (fx_ids.mjs, fx_idparity.mjs). Prints PASS/FAIL per check; writes a JSON result per width.
import fs from 'node:fs';
import path from 'node:path';
import { startServer, launch, openPage } from '../harness.mjs';
const SRC = '/home/claude/work/project', BED = '/home/claude/work/fxjbed';
fs.rmSync(BED, { recursive: true, force: true }); fs.mkdirSync(BED, { recursive: true });
for (const f of fs.readdirSync(SRC)) fs.copyFileSync(path.join(SRC, f), path.join(BED, f));
const srv = await startServer(BED);
const browser = await launch();
const results = [];
let page, errors, ctx;
const W = Number(process.env.W || 1440);
async function fresh() {
  if (ctx) await ctx.close();
  ({ ctx, page, errors } = await openPage(browser, srv.port, 'StudentFinal.dc.html', W, 900, { settle: 500 }));
  if (W < 760) { await page.click('.st-review-toggle'); await page.waitForTimeout(200); }
}
const sleep = ms => page.waitForTimeout(ms);
const norm = s => (s || '').replace(/\u00a0/g, ' ');
const h1 = () => page.evaluate(() => [...document.querySelectorAll('h1')].map(h => h.textContent.trim().replace(/\s+/g, ' ')).join(' | '));
const txt = async () => norm(await page.evaluate(() => (document.querySelector('main') || document.body).innerText));
const route = () => page.evaluate(() => document.querySelector('.st-review-route')?.innerText || '');
const active = () => page.evaluate(() => { const a = document.activeElement; return a ? (a.id || a.tagName.toLowerCase()) + ':' + (a.getAttribute('aria-label') || a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50) : ''; });
const has = sel => page.evaluate(s => !!document.querySelector(s), sel);
const visible = sel => page.evaluate(s => [...document.querySelectorAll(s)].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; }).length, sel);
const count = sel => page.evaluate(s => document.querySelectorAll(s).length, sel);
const golds = () => page.evaluate(() => [...document.querySelectorAll('main .rb-btn--primary, .st-focus .rb-btn--primary')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).map(e => e.textContent.trim().replace(/\s+/g, ' ')));
function check(name, ok, detail) { results.push({ name, ok: !!ok, detail: ok ? undefined : detail }); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : '  → ' + JSON.stringify(detail === undefined ? '' : detail).slice(0, 300))); }
async function role(r, name, exact = true) { await page.getByRole(r, { name, exact }).first().click({ timeout: 4000 }); await sleep(260); }
async function nav(name) { if (W < 1024) { await page.click('#st-menu'); await sleep(220); await page.locator('.rb-drawer').getByRole('link', { name, exact: true }).click(); } else { await page.locator('.rb-rail').getByRole('link', { name, exact: true }).click(); } await sleep(260); }
async function scenario(k, screen) { await page.selectOption('#st-rv-sc', k); await sleep(300); if (screen) { await page.selectOption('#st-rv-scr', screen); await sleep(320); } }
async function crumb(name) { await page.locator('nav[aria-label="Breadcrumb"]').getByRole('link', { name }).click(); await sleep(260); }
const on = async id => (await route()).includes(id);
// page checks: one H1, at most one gold action, no bare "#" links
const seen = [];
async function pageChecks(label) {
  const f = await page.evaluate(() => {
    const main = document.querySelector('main') || document.body;
    const t = main.innerText;
    const gold = [...document.querySelectorAll('main .rb-btn--primary, .st-focus .rb-btn--primary')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).length;
    const ids = (t.match(/\b(?:S?ACC|DTR)-\d+/g) || []);
    const bare = [...document.querySelectorAll('a[href]')].filter(a => a.getAttribute('href') === '#' || a.getAttribute('href') === '').length;
    return { h1: document.querySelectorAll('h1').length, gold, ids, bare };
  });
  seen.push({ label, ...f });
  if (f.h1 !== 1 || f.gold > 1 || f.bare) check('page checks · ' + label, false, f);
}
try {
  // ══ J1 · Learning continuation: Home → Course → Experiment → Resources → Simulation → Continue WEB → activity → Progress ══
  await fresh();
  check('J1 Home: Hello, Rahul with the stage tracker and one gold action (Continue WEB)', (await h1()) === 'Hello, Rahul' && await has('main .sv-step-stages') && (await golds()).join() === 'Continue WEB', [await h1(), await golds()]);
  await pageChecks('ST-01 learn');
  await role('link', 'Thermodynamics & Heat Transfer, open course');
  check('J1 course link → ST-03 Course, focus on the H1', await on('ST-03') && (await h1()) === 'Thermodynamics & Heat Transfer' && (await active()).startsWith('st-h1'), [await route(), await active()]);
  await pageChecks('ST-03 learn');
  await role('link', 'Open experiment Shell-and-Tube Heat Exchanger');
  check('J1 Open experiment → ST-05 Overview', await on('ST-05') && (await h1()) === 'Shell-and-Tube Heat Exchanger', await route());
  await pageChecks('ST-05 learn');
  await page.locator('nav.rk-tabs').getByRole('link', { name: 'Resources', exact: true }).click(); await sleep(260);
  check('J1 Resources tab → ST-06, three items listed', await on('ST-06') && (await count('main .sv-res .sv-li')) === 3, await route());
  await pageChecks('ST-06 learn');
  await page.getByRole('button', { name: 'Open Pre-lab reading — the effectiveness–NTU method in a new tab' }).click(); await sleep(1100);
  const r1 = await txt();
  check('J1 opening a resource records the time; progress is not touched', /Opened 12 Oct 2026, \d\d:\d\d/.test(r1) && r1.includes('2 of 3 opened'), r1.slice(0, 400));
  await page.locator('nav.rk-tabs').getByRole('link', { name: 'Simulation', exact: true }).click(); await sleep(260);
  check('J1 Simulation tab → ST-07: two format cards, WEB marked Next step, gold Continue WEB', await on('ST-07') && (await count('main .sv-fcard')) === 2 && await page.evaluate(() => { const c = document.querySelector('.sv-fcard.is-next'); return !!c && c.textContent.includes('Browser') && c.textContent.includes('Next step'); }) && (await golds()).join() === 'Continue WEB', await golds());
  await pageChecks('ST-07 learn');
  await role('link', 'Continue WEB, Shell-and-Tube Heat Exchanger');
  check('J1 Continue WEB → ST-08 launch page with the stage tracker', await on('ST-08') && (await h1()) === 'WEB simulation' && await has('main .sv-launch-stages'), await route());
  await pageChecks('ST-08 learn');
  await page.click('#st-launch-go'); await sleep(1200);
  check('J1 Continue WEB opens the sample activity (ST-08a), stage 2 is now', (await h1()) === 'Sample activity' && await page.evaluate(() => { const l = document.querySelectorAll('.st-focus .sv-steps--lg > li'); return l.length === 3 && l[0].classList.contains('is-done') && l[1].classList.contains('is-now'); }), await h1());
  await pageChecks('ST-08a stage 2');
  await role('button', 'Finish stage 2'); await sleep(800);
  check('J1 stage 2 finished → stage 3 now, place saved', await page.evaluate(() => document.querySelectorAll('.st-focus .sv-steps--lg > li.is-done').length === 2) && (await txt()).includes('Sample stage 3 of 3'));
  await role('button', 'Finish the activity'); await sleep(800);
  const a1 = await txt();
  check('J1 activity complete: WEB recorded as completed, focus on the done card', a1.includes('WEB is recorded as completed') && (await active()).startsWith('st-act-done') && (await count('.st-focus .sv-steps--lg > li.is-done')) === 3, [await active(), a1.slice(0, 200)]);
  await pageChecks('ST-08a done');
  await role('link', 'Back to WEB simulation');
  const w1 = await txt();
  check('J1 back on ST-08: Completed, recorded by the platform, gold Give feedback on WEB', w1.includes('Completed 12 Oct 2026') && /Recorded by the platform at \d\d:\d\d/.test(w1) && (await golds()).join() === 'Give feedback on WEB', [w1.slice(0, 300), await golds()]);
  await pageChecks('ST-08 done');
  await nav('Progress');
  const p1 = await txt();
  check('J1 Progress (ST-15) agrees: WEB completed by the platform, gold Give feedback on WEB', await on('ST-15') && /Recorded by the platform/.test(p1) && (await golds()).join() === 'Give feedback on WEB', [p1.slice(0, 300), await golds()]);
  await pageChecks('ST-15 after completion');
  // ══ J2 · Feedback ══
  await role('link', 'Give feedback on WEB, Shell-and-Tube Heat Exchanger');
  check('J2 → ST-16 rating sheet: five statements, scale named once', (await h1()) === 'Feedback on WEB' && (await count('main fieldset.sv-lk-q')) === 5 && (await count('main .sv-lk-scale li')) === 5, await h1());
  await pageChecks('ST-16 form');
  await role('button', 'Submit feedback'); await sleep(300);
  check('J2 submitting with nothing rated: error summary focused, five ratings missing', (await active()).startsWith('st-fb-errs') && (await txt()).includes('5 ratings are missing') && (await count('main fieldset.is-invalid')) === 5, await active());
  await page.locator('#st-fb-errs').getByRole('link').first().click(); await sleep(200);
  check('J2 error link moves focus to the first rating of statement 1', (await active()).startsWith('st-fb-web-q1-1'), await active());
  for (let q = 1; q <= 5; q++) { await page.check('#st-fb-web-q' + q + '-' + (q % 2 ? 4 : 5)); await sleep(80); }
  check('J2 all five rated: the errors clear', (await count('main fieldset.is-invalid')) === 0 && !(await has('#st-fb-errs')) || (await count('main fieldset.is-invalid')) === 0, await count('main fieldset.is-invalid'));
  await page.fill('#st-fb-c', 'The staged sample was clear.'); await page.locator('#st-fb-c').blur(); await sleep(100);
  await role('button', 'Submit feedback'); await sleep(1200);
  const f2 = await txt();
  check('J2 sent (ST-17): thank-you band, answers read-only on the same scale', (await h1()) === 'Feedback on WEB sent' && f2.includes('Feedback can’t be changed after it’s sent.') && (await count('main .sv-lk-dot.is-on')) === 5 && f2.includes('The staged sample was clear.'), [await h1(), f2.slice(0, 300)]);
  await pageChecks('ST-17 sent');
  await nav('Home');
  const h2 = await txt();
  check('J2 Home next step moves on to VR', h2.includes('Set up VR') && (await golds()).join() === 'Open VR', [h2.slice(0, 300), await golds()]);
  // ══ J3 · Assessment: open → instructions → begin → answer → submit → waiting → result ══
  await scenario('assess', 'ST-11');
  check('J3 ST-11: the row is led by its due date, gold Open', (await count('main .sv-ali')) === 1 && (await txt()).includes('14 Nov') && (await golds()).join() === 'Open', await golds());
  await pageChecks('ST-11 assess');
  await role('link', 'Open, Heat Exchanger — post-lab');
  check('J3 Open → ST-12: Before you start, three rules, deadline block and key facts', await on('ST-12') && (await txt()).includes('Before you start') && (await count('main .sv-rules li')) === 3 && await has('main .sv-ai-when .sv-when') && (await count('main .sv-ai-dl > div')) === 6, await route());
  await pageChecks('ST-12 assess');
  await role('link', 'Start assessment');
  check('J3 Start assessment → ST-13 attempt: one sheet, four questions, focus on the H1', (await h1()) === 'Heat Exchanger — post-lab' && (await count('.sv-qs > li')) === 4 && (await active()).startsWith('st-h1') && (await txt()).includes('0 of 4 answered'), [await h1(), await active()]);
  await pageChecks('ST-13 attempt');
  await page.check('#st-q-1-o0'); await sleep(120); await page.check('#st-q-2-o0'); await sleep(120); await page.check('#st-q-3-o0'); await sleep(120);
  check('J3 three answered: count, numbers and strip agree', (await txt()).includes('3 of 4 answered') && (await count('.sv-q-n.is-done')) === 3 && (await count('.st-strip a.is-done')) === 3);
  await role('button', 'Next unanswered');
  check('J3 Next unanswered → question 4', (await active()).startsWith('st-q-4'), await active());
  await page.fill('#st-q-4-t', 'Fouling adds a resistance, so U falls and the outlet temperatures move toward each other.'); await page.locator('#st-q-4-t').blur(); await sleep(200);
  check('J3 all four answered', (await txt()).includes('4 of 4 answered') && !(await has('.sv-attnext')), (await txt()).slice(0, 200));
  await page.click('#st-submit'); await sleep(300);
  check('J3 Submit opens the confirmation dialog, focus inside it', await visible('#st-dlg-t') && /^st-dlg/.test(await active()), await active());
  await page.keyboard.press('Escape'); await sleep(250);
  check('J3 Escape closes the dialog, focus back on Submit', !(await visible('#st-dlg-t')) && (await active()).startsWith('st-submit'), await active());
  await page.click('#st-submit'); await sleep(300);
  await page.click('#st-dlg-ok'); await sleep(1400);
  check('J3 submitted: done card focused, waiting for marking', (await active()).startsWith('st-att-done') && (await txt()).includes('Answers submitted'), await active());
  await role('link', 'See your result page');
  check('J3 result page withheld (compact message): Submitted — waiting for marking', (await h1()) === 'Submitted — waiting for marking' && await has('main .sv-refuse'), await h1());
  await pageChecks('ST-14 waiting');
  await nav('Assessments');
  check('J3 ST-11: To do is empty and says where the assessment is; Submitted holds it', (await txt()).includes('Nothing to do right now.') && (await txt()).includes('Your submitted assessment is under Submitted.'), (await txt()).slice(0, 300));
  await page.locator('nav.rk-tabs').getByRole('link', { name: /^Submitted/ }).click(); await sleep(260);
  check('J3 Submitted tab: the row is led by "Result after"', (await txt()).includes('Result after') && (await count('main .sv-ali')) === 1);
  await scenario('released', 'ST-14');
  check('J3 released result: score panel 11 of 16, Passed, marks by question', (await h1()) === 'You passed' && (await page.evaluate(() => document.querySelector('.sv-score-n b')?.textContent.trim())) === '11' && (await count('main .sv-byq a')) === 4, await h1());
  await pageChecks('ST-14 released');
  await page.locator('main .sv-byq a').nth(1).click(); await sleep(300);
  check('J3 marks-by-question link jumps to question 2', (await active()).startsWith('st-ans-2'), await active());
  check('J3 answer review: correct answer shown only where it differs', (await count('main .sv-ans')) === 4 && (await page.evaluate(() => [...document.querySelectorAll('.sv-ans')].map(a => a.textContent.includes('Correct answer')))).join() === 'false,true,false,false');
  await scenario('notpassed', 'ST-14');
  check('J3 not passed: Try again in the score panel, the one gold action', (await golds()).join() === 'Try again' && (await txt()).includes('You have 1 attempt left.'), await golds());
  // ══ J4 · Device-based learning: VR on the headset, My device, transfer request ══
  await scenario('learn', 'ST-07');
  await role('link', 'Open VR, Shell-and-Tube Heat Exchanger');
  const v4 = await txt();
  check('J4 Open VR → ST-09: Set up VR, setup steps open, authorised headset shown', await on('ST-09') && v4.includes('Set up VR') && await visible('#st-setup') && v4.includes('Your authorised headset'), await route());
  await pageChecks('ST-09 learn');
  await page.locator('.sv-launch-dev').getByRole('link', { name: 'My device' }).click(); await sleep(260);
  check('J4 My device → ST-18 with the authorised headset and one gold action', await on('ST-18') && (await golds()).join() === 'Request a device transfer', await golds());
  await pageChecks('ST-18 device');
  await page.click('#st-dev-req'); await sleep(300);
  check('J4 Request a device transfer opens the form, focus on New device', (await active()).startsWith('st-dev-new'), await active());
  await role('button', 'Send request'); await sleep(300);
  check('J4 empty request: field error and focus on the field', (await txt()).includes('Describe the new device') && (await active()).startsWith('st-dev-new'), await active());
  await page.fill('#st-dev-new', 'ME lab VR headset, asset tag GIT-VR-11'); await page.locator('#st-dev-new').blur(); await sleep(150);
  await role('button', 'Send request'); await sleep(1000);
  const d4 = await txt();
  check('J4 request sent: status with your Institute Admin, three dated steps; no reference, as in the baseline for this scenario', (await active()).startsWith('st-dtr-st') && d4.includes('With your Institute Admin') && (await count('main .sv-devsteps > li')) === 3 && !/DTR-\d/.test(d4), [await active(), d4.slice(0, 300)]);
  await pageChecks('ST-18 sent');
  await scenario('device', 'ST-18');
  await page.click('#st-dev-req'); await sleep(300);
  await page.fill('#st-dev-new', 'ME lab VR headset, asset tag GIT-VR-07'); await page.locator('#st-dev-new').blur(); await sleep(150);
  await role('button', 'Send request'); await sleep(1000);
  check('J4 device scenario: the new request shows its status, its three dated steps and From / To, and no internal record identifier', (await txt()).includes('Your transfer request') && (await txt()).includes('ME lab VR headset, asset tag GIT-VR-07') && (await count('main .sv-devsteps > li')) === 3 && !/\b(?:S?ACC|DTR)-\d/.test(await txt()) && !(await txt()).includes('Reference'), (await txt()).slice(0, 300));
  await scenario('dtrfwd', 'ST-18');
  check('J4 forwarded: two steps done, BITS decides now', (await count('main .sv-devsteps > li.is-done')) === 2 && (await count('main .sv-devsteps > li.is-now')) === 1);
  await scenario('vrprog', 'ST-09');
  check('J4 VR in progress: Continue on your headset, last session in the header', (await txt()).includes('Continue on your headset') && (await txt()).includes('Last session reported'));
  await scenario('vrdone', 'ST-09');
  check('J4 VR completed: gold Give feedback on VR', (await golds()).join() === 'Give feedback on VR', await golds());
  // ══ J5 · Access restrictions ══
  await scenario('paused', 'ST-01');
  check('J5 paused Home: no gold, the pause said in the banner', (await golds()).length === 0 && (await txt()).includes('You can’t open experiments right now'), await golds());
  await pageChecks('ST-01 paused');
  await scenario('paused', 'ST-08');
  const p5 = await txt();
  check('J5 paused WEB page: no launch, the student’s completion kept in the header', !(await has('#st-launch-go')) && p5.includes('You can’t open the simulation right now') && p5.includes('Completed 14 Oct 2026'), p5.slice(0, 300));
  await scenario('licence', 'ST-08');
  check('J5 waiting for a licence: Not available to you yet, no launch', (await txt()).includes('Not available to you yet') && !(await has('#st-launch-go')));
  await scenario('vrnow', 'ST-09');
  check('J5 VR not available right now: said once, WEB still opens', (await txt()).includes('VR isn’t available right now') && (await txt()).includes('WEB still opens'));
  await scenario('learn', 'ST-09ar');
  check('J5 AR refusal: compact card with the formats you can use', (await h1()) === 'AR isn’t included for your institution' && (await count('main .sv-refuse-list li')) === 2, await h1());
  await pageChecks('ST-09 AR');
  await role('link', 'Continue WEB, Shell-and-Tube Heat Exchanger');
  check('J5 AR refusal → Continue WEB → ST-08', await on('ST-08'), await route());
  await scenario('learn', 'ST-09mr');
  check('J5 MR refusal', (await h1()) === 'This experiment isn’t available in MR');
  await scenario('learn', 'ST-19');
  check('J5 ST-19 not given: experiments you can open', (await h1()) === 'This experiment isn’t available to you' && (await count('main .sv-refuse-list li')) === 1, await h1());
  await pageChecks('ST-19');
  await role('link', 'Open experiment Shell-and-Tube Heat Exchanger');
  check('J5 ST-19 → Open experiment → ST-05', await on('ST-05'), await route());
  await scenario('withdrawn', 'ST-05');
  check('J5 withdrawn: no longer given, your work as recorded', (await h1()) === 'This experiment is no longer given to you' && (await txt()).includes('Your work, as recorded'), await h1());
  await role('link', 'See your earlier work');
  check('J5 withdrawn → See your earlier work → ST-15', await on('ST-15'), await route());
  await scenario('ended', 'ST-05');
  check('J5 ended: access ended with the date', (await h1()) === 'Your access to Shell-and-Tube Heat Exchanger has ended' && (await txt()).includes('It ended on 7 Oct 2027'), await h1());
  await scenario('nodevice', 'ST-18');
  check('J5 My device when not eligible: refusal', (await h1()) === 'My device isn’t available to you', await h1());
  await scenario('learn', 'ST-16v');
  check('J5 feedback before completion: refusal with Back to VR', (await h1()) === 'Feedback on VR isn’t open yet' && (await golds()).join() === 'Back to VR', await golds());
  await scenario('learn', 'ST-12');
  check('J5 assessment not set: refusal', (await h1()) === 'There’s no assessment here yet', await h1());
  await scenario('inactive', 'ST-05');
  check('J5 inactive account: the borrowed XS-08 message, unchanged form', (await h1()) === 'Your account is inactive' && await has('main .xsb-msg') && !(await has('main .sv-refuse')), await h1());
  // ══ J6 · keyboard order on the launch page ══
  await scenario('learn', 'ST-08');
  await page.evaluate(() => document.getElementById('st-h1').focus());
  const seq = [];
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Tab'); await sleep(40); seq.push((await active()).split(':').slice(1).join(':')); }
  check('J6 Tab from the H1 on ST-08: Continue WEB, then Report a problem', /^Continue WEB/.test(seq[0]) && /Report a problem/.test(seq.join('|')), seq);
  if (W < 1024) {
    await page.click('#st-menu'); await sleep(250);
    check('J6 drawer opens, focus on Close', (await active()).startsWith('st-menu-close'), await active());
    await page.keyboard.press('Escape'); await sleep(200);
    check('J6 Escape closes, focus back to Menu', (await active()).startsWith('st-menu'), await active());
  }
  check('J6 page checks on every page visited (one H1, ≤ 1 gold, no # links)', seen.every(s => s.h1 === 1 && s.gold <= 1 && !s.bare), seen.filter(s => !(s.h1 === 1 && s.gold <= 1 && !s.bare)));
  check('J6 no console errors', errors.length === 0, errors.slice(0, 3));
} catch (e) { check('journey crashed', false, e.message.split('\n')[0]); }
const passed = results.filter(r => r.ok).length;
console.log(`\n${passed} / ${results.length} passed at ${W} · pages checked: ${seen.length}`);
fs.writeFileSync(`/tmp/claude-0/fx/fxjourney-${W}.json`, JSON.stringify({ results, seen }, null, 1));
await ctx.close(); await browser.close(); srv.close();

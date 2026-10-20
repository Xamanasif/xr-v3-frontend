// Exercise the Content Manager role preview the way a person would: real clicks, typing and keys,
// in the real dc runtime (local render harness). Prints PASS/FAIL per step and writes journeys.json.
// usage: node journeys.mjs [onlyJourneyPrefix]
import { openBrowser, newPage, load } from './harness.mjs';
import fs from 'node:fs';
const R = '/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/render-cm';
const OUT = '/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/tools/jshots';
fs.mkdirSync(OUT, { recursive: true });
const only = process.argv[2] || '';
const esc = v => String(v || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const head = fs.readFileSync(R + '/Main.dc.html', 'utf8').split('<body>')[0];
const made = [];
function wrapper(p, w, h) {
  const name = 'J-' + Math.random().toString(36).slice(2, 8) + '.dc.html';
  fs.writeFileSync(R + '/' + name, head.replace(/<title>.*?<\/title>/, '<title>journey</title>') + `<body>
<x-dc>
<helmet>
<link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400..800&amp;display=swap" rel="stylesheet">
<style>body{margin:0;background:#F3F4F9}</style>
</helmet>
<dc-import name="Main" screen="${esc(p.screen)}" record="${esc(p.record)}" preset="${esc(p.preset)}" scenario="${esc(p.scenario || 'main')}" hint-size="100%,${h}px"></dc-import>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${w},"height":${h}}}'>
class Component extends DCLogic { renderVals() { return {}; } }
</script>
</body></html>`);
  made.push(name);
  return name;
}
const results = [];
let J = '';
function ok(cond, step, detail) {
  results.push({ journey: J, step, pass: !!cond, detail: detail || '' });
  console.log((cond ? 'PASS' : 'FAIL') + ' [' + J + '] ' + step + (detail ? ' — ' + detail : ''));
  return !!cond;
}
const wait = ms => new Promise(r => setTimeout(r, ms));
const b = await openBrowser();
const pages = [];
const opened = []; // every page each journey opens, so the final sweep can check all their consoles
async function open(p, w = 1440, h = 900) {
  const { context, page, log } = await newPage(b, R, { width: w, height: h });
  await load(page, wrapper(p, w, h));
  await wait(150);
  pages.push(context);
  opened.push({ journey: J, label: (p.screen || '') + (p.record ? ' ' + p.record : '') + (p.preset ? ' [' + p.preset + ']' : '') + ' @' + w, log });
  return { page, log, context };
}
const h1 = page => page.evaluate(() => { const e = document.querySelector('h1'); return e ? e.textContent.trim() : ''; });
const active = page => page.evaluate(() => { const a = document.activeElement; if (!a) return ''; return (a.id ? '#' + a.id : a.tagName.toLowerCase()) + ' ' + (a.getAttribute('aria-label') || a.textContent || a.value || '').trim().replace(/\s+/g, ' ').slice(0, 60); });
const inDialog = page => page.evaluate(() => { const a = document.activeElement; return !!(a && a.closest('[role="dialog"],[role="alertdialog"]')); });
const text = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, ' ').trim() : ''; }, sel);
const exists = (page, sel) => page.evaluate(s => !!document.querySelector(s), sel);
const visible = async (page, sel) => { const l = page.locator(sel).first(); return (await l.count()) > 0 && await l.isVisible(); };
const val = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return e ? e.value : null; }, sel);
const navCurrent = page => page.evaluate(() => { const a = document.querySelector('.rb-rail nav a[aria-current="page"]'); return a ? a.getAttribute('data-to') : ''; });
const bodyText = page => page.evaluate(() => document.querySelector('.xr').innerText.replace(/\s+/g, ' '));
async function shot(page, name) { await page.screenshot({ path: OUT + '/' + name + '.png', fullPage: false }); }
async function rail(page, to) { await page.locator('.rb-rail nav a[data-to="' + to + '"]').click(); await wait(250); }
async function noErrors(log, label) { const e = log.slice(); ok(e.length === 0, label + ': no console errors', e.slice(0, 3).join(' | ')); }

// ───────────────────────── J1 · first publication ─────────────────────────
if (!only || 'J1'.startsWith(only) || only === 'J1') {
  J = 'J1 publish';
  const { page, log } = await open({ screen: 'overview' });
  ok(await h1(page) === 'Overview', 'Overview is the live role entry', await h1(page));
  const badge0 = await text(page, '.rb-rail nav a[data-to="CM-02"] .rb-count');
  ok(/3/.test(badge0), 'Rail badge shows 3 ready to publish', badge0);
  await rail(page, 'CM-02');
  ok(await h1(page) === 'Ready to publish' && await navCurrent(page) === 'CM-02', 'Rail → Ready to publish, current marker moves', await navCurrent(page));
  ok(await page.locator('.cm-qcard').count() === 3, 'Three approved submissions listed');
  ok(await page.locator('.cm-qcard').first().locator('.cm-next').count() === 1 && /Waiting longest/.test(await page.locator('.cm-qcard').first().innerText()), 'The longest wait is first and marked');
  await page.getByRole('link', { name: 'Open the publication decision for Conduction Through a Composite Wall' }).click(); await wait(300);
  ok(await h1(page) === 'Conduction Through a Composite Wall', 'Open decision opens the publication decision (CM-03)', await active(page));
  ok(await page.locator('.cm-check--ok').count() === 4 && await page.locator('.cm-check--no').count() === 0, 'All four publication checks pass');
  ok(await navCurrent(page) === 'CM-02', 'Decision keeps Ready to publish as the current section');
  await page.click('#cm-d-go'); await wait(250);
  ok(await visible(page, '#cm-d-errs'), 'Publish without choosing → error summary', await text(page, '#cm-d-errs'));
  ok((await active(page)).startsWith('#cm-d-errs'), 'Focus moves to the error summary', await active(page));
  await page.locator('label.rk-choice', { hasText: 'It appears in the public catalogue' }).click(); await wait(150);
  ok(!(await exists(page, '#cm-d-errs')), 'Choosing Publish clears the error');
  await page.click('#cm-d-go'); await wait(300);
  ok(await visible(page, '[role="dialog"]') || await visible(page, '[role="alertdialog"]'), 'Publish opens the confirmation dialog');
  const dtext = await page.evaluate(() => { const d = document.querySelector('[role="dialog"],[role="alertdialog"]'); return d ? d.innerText.replace(/\s+/g, ' ') : ''; });
  ok(/gives no one access/i.test(dtext), 'Confirmation explains publishing gives nobody access', dtext.slice(0, 260));
  ok(await inDialog(page), 'Focus starts inside the dialog', await active(page));
  let trapped = true;
  for (let i = 0; i < 8; i++) { await page.keyboard.press('Tab'); await wait(30); if (!(await inDialog(page))) trapped = false; }
  for (let i = 0; i < 4; i++) { await page.keyboard.press('Shift+Tab'); await wait(30); if (!(await inDialog(page))) trapped = false; }
  ok(trapped, 'Tab and Shift+Tab stay inside the dialog');
  await shot(page, 'J1-confirm');
  await page.keyboard.press('Escape'); await wait(200);
  ok(!(await visible(page, '[role="dialog"]')) && (await active(page)).startsWith('#cm-d-go'), 'Escape closes and returns focus to Publish', await active(page));
  await page.click('#cm-d-go'); await wait(250);
  await page.click('#cm-dlg-pub-ok'); await wait(1100);
  ok(await visible(page, '#cm-d-done') && /Published/.test(await text(page, '#cm-d-done')), 'Confirming publishes and shows the result', (await text(page, '#cm-d-done')).slice(0, 160));
  ok((await active(page)).startsWith('#cm-d-done'), 'Focus moves to the result', await active(page));
  await shot(page, 'J1-done');
  const badge1 = await text(page, '.rb-rail nav a[data-to="CM-02"] .rb-count');
  ok(/2/.test(badge1), 'Rail badge drops to 2', badge1);
  await rail(page, 'CM-04');
  ok(await h1(page) === 'Content library', 'Rail → Content library');
  const pubBtn = await text(page, '#cm-lib-tab-published');
  ok(/13/.test(pubBtn), 'Published count is now 13', pubBtn);
  await page.click('#cm-lib-tab-published'); await wait(250);
  ok(await page.getAttribute('#cm-lib-tab-published', 'aria-pressed') === 'true', 'Published view is pressed');
  ok(await page.locator('.rk-rowlink', { hasText: 'Conduction Through a Composite Wall' }).count() === 1, 'New experiment is in the Published view');
  await page.click('#cm-lib-q'); await page.keyboard.type('composite'); await wait(250);
  ok(/2 of 13 published/.test(await text(page, '.rk-count')), 'Search filters the view with a count', await text(page, '.rk-count'));
  ok(await page.locator('.rk-chip').count() === 1, 'Search shows a removable chip');
  await page.locator('.rk-rowlink', { hasText: 'Conduction Through a Composite Wall' }).click(); await wait(300);
  ok(await h1(page) === 'Conduction Through a Composite Wall' && /Published experiment/.test(await text(page, '.rk-eyebrow')), 'Opens the published record (CM-05)', await text(page, '.rk-eyebrow'));
  const pt = await bodyText(page);
  ok(/No one was given access/.test(pt), 'History records that no one was given access');
  ok(/^1\.0 live$/.test(await text(page, '.rb-id-status .cm-ver-live')) && /ME ZG523/.test(pt), 'Live version (1.0 live) and course code shown', await text(page, '.rb-id-status .cm-ver-live'));
  await page.getByRole('link', { name: /View the public page/ }).click(); await wait(300);
  ok(await h1(page) === 'Conduction Through a Composite Wall' && await exists(page, '.cm-pub'), 'View the public page → public handoff destination');
  ok(/gives no one access/.test(await bodyText(page)), 'Public destination repeats that listing gives no access');
  ok(!(await exists(page, '.rb-rail')), 'Public destination is outside the workspace (no rail)');
  await shot(page, 'J1-public');
  await page.getByRole('link', { name: 'Back to the published experiment' }).click(); await wait(300);
  ok(await h1(page) === 'Conduction Through a Composite Wall' && await exists(page, '.rb-rail'), 'Back returns to the published record');
  await rail(page, 'CM-01');
  const ov = await bodyText(page);
  ok(/2\s*Ready to publish/.test(ov) || /Ready to publish 2/.test(ov) || await page.evaluate(() => /2/.test(document.querySelector('.rb-fig-n') ? document.querySelector('.rb-fig-n').textContent : '')), 'Overview figures follow the change', (ov.match(/\d+\s*Ready to publish[^.]*/) || [''])[0]);
  await noErrors(log, 'J1');
}

// ───────────────────────── J2 · correction from a published record ─────────────────────────
if (!only || only === 'J2') {
  J = 'J2 correction';
  const { page, log } = await open({ screen: 'published', record: 'e2' });
  ok(await h1(page) === 'Fin-Tube Bundle', 'Published record without an open update', await h1(page));
  const liveSummary = await text(page, '#cm-p-cat ~ dl, .rk-dl');
  ok(await visible(page, '#cm-p-start') && await visible(page, '#cm-p-editcat') && await visible(page, '#cm-p-editdel'), 'Start a correction, Edit catalogue details, Edit delivery link offered');
  await page.click('#cm-p-editcat'); await wait(350);
  ok(await h1(page) === 'Update to Fin-Tube Bundle', 'Edit catalogue details opens the correction draft (CM-06)', await h1(page));
  ok((await active(page)).startsWith('#cm-u-summary'), 'Focus lands on the summary', await active(page));
  ok(/New correction draft, from Edit catalogue details/.test(await text(page, '#cm-u-entry')), 'Entry is confirmed on the page');
  ok(/UPD-0007/.test(await text(page, '.rk-crumbs')), 'A new update UPD-0007 was created', await text(page, '.rk-crumbs'));
  ok(await navCurrent(page) === 'CM-08', 'Updates is the current section');
  const sumLive = await val(page, '#cm-u-summary');
  ok(/progressive fouling/.test(sumLive || ''), 'Summary is pre-filled with the live text', (sumLive || '').slice(0, 80));
  await page.fill('#cm-u-summary', 'Introduce progressive fouling on the tube side and measure how it lowers the overall heat transfer coefficient.');
  await wait(100);
  ok(await page.locator('.cm-tag', { hasText: 'Changed' }).count() >= 1, 'Edited field is tagged Changed');
  await page.click('#cm-u-send'); await wait(300);
  ok(await visible(page, '#cm-u-errs'), 'Send with missing reason and version → error summary', await text(page, '#cm-u-errs'));
  ok((await active(page)).startsWith('#cm-u-errs'), 'Focus moves to the error summary', await active(page));
  await page.fill('#cm-u-why', 'Clarifies that fouling lowers the overall coefficient, as learners see on screen.');
  await page.fill('#cm-u-ver', '1.0'); await page.click('#cm-u-send'); await wait(300);
  ok(/1\.0 is live/.test(await text(page, '#cm-u-errs')), 'Version label equal to live is refused', await text(page, '#cm-u-errs'));
  await page.fill('#cm-u-ver', '1.1'); await wait(80);
  await page.click('#cm-u-save'); await wait(900);
  ok(await visible(page, '#cm-u-saved'), 'Save draft → Draft saved', await text(page, '#cm-u-saved'));
  ok((await active(page)).startsWith('#cm-u-saved'), 'Focus moves to the saved message', await active(page));
  // revisit
  await rail(page, 'CM-01'); await rail(page, 'CM-08');
  ok(await h1(page) === 'Updates', 'Leave and come back via Updates');
  const card = page.locator('.cm-trk', { hasText: 'Fin-Tube Bundle' });
  ok(await card.count() === 1 && /Draft/.test(await card.innerText()) && await page.locator('.cm-trksec:has(#cm-upd-you) .cm-trk', { hasText: 'Fin-Tube Bundle' }).count() === 1, 'Draft is listed in Updates, under Need you');
  await card.getByRole('link', { name: /^Continue UPD-0007/ }).click(); await wait(300);
  ok((await val(page, '#cm-u-summary') || '').includes('how it lowers'), 'Saved edits are still there on revisit');
  ok(await val(page, '#cm-u-ver') === '1.1', 'Version label kept');
  // live record unchanged; edit delivery link joins the same draft
  await page.getByRole('link', { name: 'Back to the published experiment' }).click(); await wait(300);
  const pubTxt = await bodyText(page);
  ok(/Introduce progressive fouling on the tube side and measure its effect/.test(pubTxt) && !/how it lowers/.test(pubTxt), 'Live record still shows the live summary (private edits do not leak)');
  ok(/A correction is open/.test(pubTxt) && await visible(page, '#cm-p-open'), 'Published page shows the open correction');
  await page.click('#cm-p-editdel'); await wait(350);
  ok(/UPD-0007/.test(await text(page, '.rk-crumbs')), 'Edit delivery link joins the same update (no second update)', await text(page, '.rk-crumbs'));
  ok(/Your edit joins UPD-0007/.test(await text(page, '#cm-u-entry')), 'Join is explained');
  ok((await active(page)).startsWith('#cm-u-web'), 'Focus lands on the web link (CM-07)', await active(page));
  await page.fill('#cm-u-web', 'https://labs.northline.example/fin-tube-bundle-1-1'); await wait(80);
  await page.click('#cm-u-send'); await wait(300);
  ok(await visible(page, '[role="dialog"]'), 'Send for academic review asks to confirm');
  ok(await inDialog(page), 'Focus is inside the send dialog', await active(page));
  await page.click('#cm-dlg-send-ok'); await wait(900);
  ok(/In academic review/.test(await text(page, '#cm-u-state')), 'Sent → In academic review', await text(page, '#cm-u-state'));
  { const c = (await page.evaluate(() => { const e = document.querySelector('.cm-idband .cm-flow li[aria-current="step"]'); return e ? e.innerText.replace(/\s+/g, ' ').trim() : 'none'; })); ok(/Academic Reviewer.*Academic review/.test(c) && /In academic review/.test(await text(page, '.rb-id-status')), 'The stage track moves to the Academic Reviewer and the band reads In academic review', c); }
  ok(!(await exists(page, '#cm-u-why')) && !(await exists(page, '#cm-u-web')), 'Fields are read-only while in review');
  ok(await visible(page, '#cm-u-wd'), 'Withdraw is still offered in review (OD-B6-06)');
  const cmp = await text(page, '.cm-cmp');
  ok(/how it lowers/.test(cmp) && /fin-tube-bundle-1-1/.test(cmp), 'Current-and-proposed shows both changes in one update', cmp.slice(0, 120));
  await shot(page, 'J2-review');
  // other roles' decisions arrive through the scenario handoff
  await page.getByRole('button', { name: 'Academic Reviewer approves' }).click(); await wait(300);
  ok(/Awaiting release decision/.test(await text(page, '#cm-u-state')), 'Handoff: approved → Awaiting release decision', await text(page, '#cm-u-state'));
  { const c = (await page.evaluate(() => { const e = document.querySelector('.cm-idband .cm-flow li[aria-current="step"]'); return e ? e.innerText.replace(/\s+/g, ' ').trim() : 'none'; })); ok(/Super Admin.*Release decision/.test(c), 'The stage track moves to the Super Admin’s release decision', c); }
  ok(!(await exists(page, '#cm-u-wd')), 'Withdraw is gone after approval');
  const prodRelease = await page.evaluate(() => [...document.querySelectorAll('button, a')].filter(x => !x.closest('.cm-dock') && /releas/i.test(x.textContent)).map(x => x.textContent.trim()));
  ok(prodRelease.length === 0, 'No Release action anywhere in the Content Manager product UI', JSON.stringify(prodRelease));
  await page.getByRole('link', { name: 'Back to the published experiment' }).click(); await wait(300);
  const p2 = await bodyText(page);
  ok(/^1\.0 live$/.test(await text(page, '.rb-id-status .cm-ver-live')) && !/how it lowers/.test(p2) && /An update is in progress/.test(p2) && !(await exists(page, '#cm-p-editcat')), 'While awaiting release: live 1.0 unchanged, only Open update offered');
  ok(/Correction in progress/.test(await text(page, '.cm-idflow')) && /Awaiting release decision/.test(await text(page, '.cm-idflow')), 'The published record shows where the open correction is', await text(page, '.cm-idflow-h'));
  await page.click('#cm-p-open'); await wait(300);
  await page.getByRole('button', { name: 'Super Admin releases it' }).click(); await wait(300);
  ok(/Released/.test(await text(page, '#cm-u-state')), 'Handoff: released', await text(page, '#cm-u-state'));
  ok(await page.locator('.cm-idband .cm-flow li.is-done').count() === 4 && /1\.1 live/.test(await text(page, '.rb-id-status')), 'Released: all four stages done and the band reads 1.1 live', await text(page, '.rb-id-status'));
  await page.getByRole('link', { name: 'Back to the published experiment' }).click(); await wait(300);
  const p3 = await bodyText(page);
  ok(/how it lowers/.test(p3) && /^1\.1 live$/.test(await text(page, '.rb-id-status .cm-ver-live')) && /fin-tube-bundle-1-1/.test(p3), 'After release the live record shows version 1.1 with both changes');
  ok(/Version 1\.1 released/.test(p3) || /released UPD-0007/.test(p3), 'Release is in the history / notice');
  ok(await visible(page, '#cm-p-start'), 'A new correction can be started again');
  await noErrors(log, 'J2');
}

// ───────────────────────── J3 · returned correction, hold and release ─────────────────────────
if (!only || only === 'J3') {
  J = 'J3 returned';
  const { page, log } = await open({ screen: 'overview' });
  await page.locator('.rb-queue a, .rb-queue button', { hasText: 'Continue' }).first().click(); await wait(300);
  ok(await h1(page) === 'Update to Induction Motor Loading', 'Overview → Continue opens the returned correction', await h1(page));
  ok(/slip falls as the load rises/.test(await text(page, '.cm-retbox')), 'Return reason is shown first', await text(page, '.cm-retbox'));
  const d0 = await val(page, '#cm-u-desc');
  await page.fill('#cm-u-desc', (d0 || '').replace('The slip falls as the load rises', 'The slip rises with the load')); await wait(80);
  await page.click('#cm-u-send'); await wait(300);
  await page.click('#cm-dlg-send-ok'); await wait(900);
  ok(/In academic review/.test(await text(page, '#cm-u-state')), 'Revised and resent → In academic review');
  const hist = await text(page, '#cm-u-hist');
  ok(/Sent for academic review again|Resent|Sent for academic review/.test(hist) && /Returned by Prof\. A\. Menon/.test(hist), 'History keeps the return and the resend', hist.slice(0, 160));
  await page.getByRole('button', { name: 'Academic Reviewer approves' }).click(); await wait(300);
  await page.fill('#cm-dock-hr', 'Hold until the 1.1 web build passes the lab network check.');
  await page.getByRole('button', { name: 'Super Admin puts it on hold' }).click(); await wait(300);
  ok(/On hold/.test(await text(page, '#cm-u-state')), 'Handoff: Super Admin holds it', await text(page, '#cm-u-state'));
  { const c = (await page.evaluate(() => { const e = document.querySelector('.cm-idband .cm-flow li[aria-current="step"]'); return e ? e.innerText.replace(/\s+/g, ' ').trim() : 'none'; })); ok(/Super Admin.*On hold/.test(c), 'The stage track shows the hold at the Super Admin', c); }
  ok(/lab network check/.test(await text(page, '#cm-u-state')) || /lab network check/.test(await bodyText(page)), 'Hold reason is visible to the Content Manager (OD-B7-01)');
  await page.getByRole('link', { name: 'Back to the published experiment' }).click(); await wait(300);
  const ph = await bodyText(page);
  ok(/^1\.0 live$/.test(await text(page, '.rb-id-status .cm-ver-live')) && /on hold/i.test(ph) && !/slip rises with the load/.test(ph), 'On hold: live version 1.0 still shown, the held change is not live', (ph.match(/[^.]*on hold[^.]*\./i) || [''])[0]);
  await page.click('#cm-p-open'); await wait(300);
  await page.getByRole('button', { name: 'Super Admin lifts the hold' }).click(); await wait(300);
  ok(/Awaiting release decision/.test(await text(page, '#cm-u-state')) && /lifted/.test(await text(page, '#cm-u-state')), 'Lifted → awaiting release again, lift noted', await text(page, '#cm-u-state'));
  await page.getByRole('button', { name: 'Super Admin releases it' }).click(); await wait(300);
  await page.getByRole('link', { name: 'Back to the published experiment' }).click(); await wait(300);
  const pr = await bodyText(page);
  ok(/^1\.1 live$/.test(await text(page, '.rb-id-status .cm-ver-live')) && /slip rises with the load/.test(pr), 'Released: live shows 1.1 with the corrected description');
  await noErrors(log, 'J3');
}

// ───────────────────────── J4 · platform course codes ─────────────────────────
if (!only || only === 'J4') {
  J = 'J4 course codes';
  const { page, log } = await open({ screen: 'overview' });
  await rail(page, 'CM-09');
  ok(await h1(page) === 'Course codes', 'Rail → Course codes');
  ok(await page.locator('.cm-codes tbody tr:not(.cm-area)').count() === 6 && await page.locator('.cm-codes tr.cm-area').count() === 3, 'Six courses listed, in three engineering areas');
  await page.fill('#cm-k-code-4', 'ME ZG523'); await wait(80);
  ok(await visible(page, '#cm-k-undo') && /1 change not saved/.test(await text(page, '.cm-codes-state')), 'Edit marks 1 unsaved change and offers Undo', await text(page, '.cm-codes-state'));
  await page.click('#cm-k-save'); await wait(300);
  ok(await visible(page, '#cm-k-errs') && /already the code for Thermodynamics/.test(await text(page, '#cm-k-errs')), 'Duplicate code refused with a clear message', await text(page, '#cm-k-errs'));
  ok((await active(page)).startsWith('#cm-k-errs'), 'Focus moves to the error summary', await active(page));
  await page.locator('#cm-k-errs a').first().click(); await wait(150);
  ok((await active(page)).startsWith('#cm-k-code-4'), 'Error link moves focus to the field', await active(page));
  await page.fill('#cm-k-code-4', 'CHE ZG514'); await wait(80);
  await page.click('#cm-k-save'); await wait(1000);
  ok(await visible(page, '#cm-k-saved'), 'Valid code saves', await text(page, '#cm-k-saved'));
  await rail(page, 'CM-04');
  await page.click('#cm-lib-tab-published'); await wait(200);
  const lib = await bodyText(page);
  const band = (await page.locator('tr.cm-grp-h', { hasText: 'Process Instrumentation' }).innerText()).replace(/\s+/g, ' ');
  ok(/CHE ZG514 Process Instrumentation/.test(band) && !/CHE ZG513/.test(lib), 'Library course band uses the new code', band);
  await page.locator('.rk-rowlink', { hasText: 'Distillation Column' }).click(); await wait(300);
  ok(/CHE ZG514/.test(await bodyText(page)) && !/CHE ZG513/.test(await bodyText(page)), 'Published record uses the new code');
  await page.getByRole('link', { name: /View the public page/ }).click(); await wait(300);
  ok(/CHE ZG514/.test(await bodyText(page)), 'Public destination uses the new code');
  await page.getByRole('link', { name: 'Back to the published experiment' }).click(); await wait(300);
  await rail(page, 'CM-02');
  ok(/CHE ZG514/.test(await bodyText(page)), 'Ready to publish rows use the new code');
  await noErrors(log, 'J4');
  // failed save, then retry
  const f = await open({ screen: 'codes', preset: 'codes-edit:ME ZG541,codes-fail' });
  ok(await visible(f.page, '#cm-k-fail') && /Nothing has changed/.test(await text(f.page, '#cm-k-fail')), 'Failed save is explained and edits are kept');
  ok(await val(f.page, '#cm-k-code-5') === 'ME ZG541', 'The unsaved edit is still in the field');
  await f.page.getByRole('button', { name: 'Try again' }).click(); await wait(1000);
  ok(await visible(f.page, '#cm-k-saved'), 'Try again saves');
}

// ───────────────────────── J5 · shell, keyboard, shared surfaces, states ─────────────────────────
if (!only || only === 'J5') {
  J = 'J5 shell';
  const { page, log } = await open({ screen: 'overview' }, 768, 1000);
  ok(!(await visible(page, '.rb-rail')) || await page.evaluate(() => getComputedStyle(document.querySelector('.rb-rail')).display === 'none'), 'At 768 the rail is replaced by Menu');
  await page.click('#cm-menu'); await wait(250);
  ok(await page.getAttribute('#cm-menu', 'aria-expanded') === 'true', 'Menu opens the drawer');
  ok(await inDialog(page), 'Focus moves into the drawer', await active(page));
  let tr = true; for (let i = 0; i < 9; i++) { await page.keyboard.press('Tab'); await wait(25); if (!(await inDialog(page))) tr = false; }
  ok(tr, 'Tab stays inside the drawer');
  await page.keyboard.press('Escape'); await wait(200);
  ok((await active(page)).startsWith('#cm-menu') && await page.getAttribute('#cm-menu', 'aria-expanded') === 'false', 'Escape closes the drawer and returns focus to Menu', await active(page));
  await page.click('#cm-menu'); await wait(200);
  await page.locator('[role="dialog"] a', { hasText: 'Content library' }).click(); await wait(300);
  ok(await h1(page) === 'Content library' && !(await visible(page, '[role="dialog"]')), 'Drawer link navigates and closes the drawer');
  ok((await active(page)).startsWith('#cm-h-library'), 'Focus moves to the new page heading', await active(page));
  // library keyboard: switch buttons are plain buttons
  await page.focus('#cm-lib-tab-review'); await page.keyboard.press('Enter'); await wait(200);
  ok(await page.getAttribute('#cm-lib-tab-review', 'aria-pressed') === 'true' && /in academic review/.test(await text(page, '.rk-count')), 'Switch works from the keyboard', await text(page, '.rk-count'));
  await page.selectOption('#cm-lib-course', 'c-mach'); await wait(200);
  ok(/0 of 2 in academic review/.test(await text(page, '.rk-count')) && await visible(page, '.rk-state'), 'Course filter with no match → no-match state', await text(page, '.rk-count'));
  await page.getByRole('button', { name: 'Clear filters' }).first().click(); await wait(200);
  ok(/^2 in academic review$/.test(await text(page, '.rk-count')), 'Clear filters restores the list', await text(page, '.rk-count'));
  // account menu
  await page.click('#cm-acct'); await wait(200);
  ok(await visible(page, '#cm-acct-menu'), 'Account menu opens');
  await page.keyboard.press('Escape'); await wait(150);
  ok(!(await visible(page, '#cm-acct-menu')) && (await active(page)).startsWith('#cm-acct'), 'Escape closes the account menu and returns focus', await active(page));
  await page.click('#cm-acct'); await wait(150);
  await page.click('#cm-acct-help'); await wait(300);
  ok(await h1(page) === 'Help & support', 'Account menu → Help & support');
  await page.getByRole('link', { name: 'Report a problem' }).first().click(); await wait(300);
  ok(await h1(page) === 'Report a problem', 'Report a problem form');
  ok(/Content library/.test(await val(page, '#cm-r-where') || ''), 'Where it happened is pre-filled from the last page', await val(page, '#cm-r-where'));
  await page.click('#cm-r-send'); await wait(300);
  ok(await visible(page, '#cm-r-errs'), 'Empty report → error summary');
  await page.fill('#cm-r-what', 'The course filter forgets my choice when I switch views.'); await page.click('#cm-r-send'); await wait(900);
  ok(await h1(page) === 'Report sent' || /SUP-0186/.test(await bodyText(page)), 'Report sent with a reference', (await bodyText(page)).match(/SUP-\d+/) ? (await bodyText(page)).match(/SUP-\d+/)[0] : '');
  await page.click('#cm-acct'); await wait(150); await page.click('#cm-acct-out'); await wait(300);
  ok(await h1(page) === 'You’re signed out' && !(await exists(page, '.rb-rail')), 'Sign out → signed-out page outside the workspace');
  await page.getByRole('button', { name: 'Sign in' }).click(); await wait(300);
  ok(await h1(page) === 'Overview', 'Sign in returns to the Overview');
  await noErrors(log, 'J5');

  // refusal, stale decision, stale withdraw, failed save, blocked publication
  const rf = await open({ screen: 'workspace' });
  ok(/isn’t part of your workspace/.test(await h1(rf.page)), 'Out-of-role address → refusal page', await h1(rf.page));
  await rf.page.getByRole('link', { name: /Overview/ }).first().click().catch(() => {}); await wait(300);
  ok(await h1(rf.page) === 'Overview', 'Refusal offers one way back to the Overview');
  const st = await open({ screen: 'decision', record: 'SUB-0077', preset: 'choose-send' });
  // simulate another tab publishing it, then try to publish here
  await st.page.locator('label.rk-choice', { hasText: 'It appears in the public catalogue' }).click(); await wait(100);
  const s2 = await open({ screen: 'decision', record: 'SUB-0077', preset: 'stale' });
  ok(await visible(s2.page, '#cm-d-stale') && /published from another tab/.test(await text(s2.page, '#cm-d-stale')), 'Stale decision is refused with an explanation', await text(s2.page, '#cm-d-stale'));
  await s2.page.getByRole('button', { name: 'Show where it is now' }).click(); await wait(300);
  ok(/Published/.test(await text(s2.page, '.rb-id-status')) && !(await visible(s2.page, '#cm-d-stale')), 'Show where it is now re-reads: it is Published', await text(s2.page, '.rb-id-status'));
  const sv = await open({ screen: 'update', record: 'UPD-0006', preset: 'savefail' });
  ok(await visible(sv.page, '#cm-u-savefail'), 'Failed save is explained', await text(sv.page, '#cm-u-savefail'));
  await sv.page.locator('#cm-u-savefail').getByRole('button', { name: 'Try again' }).click(); await wait(900);
  ok(await visible(sv.page, '#cm-u-saved'), 'Try again saves the draft');
  const bl = await open({ screen: 'decision', record: 'SUB-0070', scenario: 'blockers' });
  ok(await bl.page.locator('.cm-check--no').count() === 1 && /1 thing to resolve/.test(await bodyText(bl.page)), 'Missing prerequisite is listed with its fix', (await text(bl.page, '.cm-check--no')).slice(0, 120));
  ok(await bl.page.locator('#cm-d-c0').isDisabled() && await bl.page.locator('#cm-d-c1').isChecked() && /^Send back$/.test(await text(bl.page, '#cm-d-go')), 'Publish is not offered: Publish disabled, Send back preselected, the button says Send back', await text(bl.page, '#cm-d-go'));
  ok(await exists(bl.page, '#cm-d-to0') && await exists(bl.page, '#cm-d-reason'), 'Who it goes back to and the reason are asked for at once');
  await bl.page.click('#cm-d-go'); await wait(250);
  ok(/Choose who it goes back to/.test(await text(bl.page, '#cm-d-errs')) && !/Choose a decision/.test(await text(bl.page, '#cm-d-errs')), 'Sending back without recipient and reason is refused (no “choose a decision” error)', await text(bl.page, '#cm-d-errs'));
  await bl.page.locator('label.rk-choice', { hasText: 'For a re-check of the academic content' }).click();
  await bl.page.fill('#cm-d-reason', 'Please add the learning outcomes for both formats.'); await bl.page.click('#cm-d-go'); await wait(1000);
  ok(/Back with the Academic Reviewer/.test(await text(bl.page, '#cm-d-done')), 'Blocked submission sent back to the Academic Reviewer', (await text(bl.page, '#cm-d-done')).slice(0, 100));
  const wd = await open({ screen: 'update', record: 'UPD-0006', preset: 'send,stale-wd' });
  await wd.page.click('#cm-u-wd'); await wait(250);
  ok(await visible(wd.page, '[role="dialog"]'), 'Withdraw asks for a reason in a dialog');
  await wd.page.click('#cm-dlg-wd-ok'); await wait(300);
  ok(await visible(wd.page, '#cm-dlg-wd-err') || /reason/i.test(await text(wd.page, '[role="dialog"]')), 'Withdraw without a reason is refused');
  await wd.page.fill('#cm-dlg-wd-r', 'Raised by mistake.'); await wd.page.click('#cm-dlg-wd-ok'); await wait(900);
  ok(await visible(wd.page, '#cm-u-stale') && /approved it/.test(await text(wd.page, '#cm-u-stale')), 'Withdraw after an unseen approval is refused (stale)', await text(wd.page, '#cm-u-stale'));
  await wd.page.getByRole('button', { name: 'Show where it is now' }).click(); await wait(300);
  ok(/Awaiting release decision/.test(await text(wd.page, '#cm-u-state')), 'Re-read shows it is awaiting release');
}

// ───────────────────────── J6 · send back, sort, chips, undo, return and withdraw ─────────────────────────
if (!only || only === 'J6') {
  J = 'J6 more controls';
  const { page, log } = await open({ screen: 'ready' });
  const first0 = (await page.locator('.cm-qcard .cm-qname').first().innerText()).trim();
  await page.locator('.rk-sortbtn:visible').first().click(); await wait(250);
  const first1 = (await page.locator('.cm-qcard .cm-qname').first().innerText()).trim();
  ok(first0 !== first1 && /newest first/.test(await bodyText(page)), 'Sort switches between oldest and newest first', first0 + ' → ' + first1);
  ok(/Waiting longest/.test(await page.locator('.cm-qcard', { hasText: first0 }).innerText()), 'The longest wait stays marked after sorting');
  await page.getByRole('link', { name: 'Open the publication decision for Transient Cooling' }).click(); await wait(300);
  await page.locator('label.rk-choice', { hasText: 'To the Academic Reviewer or the vendor' }).click(); await wait(150);
  ok(/Send back/.test(await text(page, '#cm-d-go')), 'Choosing Send back changes the action', await text(page, '#cm-d-go'));
  await page.click('#cm-d-go'); await wait(250);
  ok(await visible(page, '#cm-d-errs') && /Choose who it goes back to/.test(await text(page, '#cm-d-errs')), 'Send back without recipient and reason is refused', await text(page, '#cm-d-errs'));
  ok(!(await exists(page, '#cm-d-ref-summary')), 'No field references before the vendor is chosen');
  await page.locator('label.rk-choice', { hasText: 'to revise and resubmit' }).click(); await wait(150);
  ok(await exists(page, '#cm-d-ref-summary'), 'Field references are offered when sending to the vendor');
  await page.fill('#cm-d-reason', 'Say which cylinder sizes the WEB build supports.');
  await page.locator('label.rk-check', { hasText: 'Summary' }).first().click(); await wait(100);
  await page.click('#cm-d-go'); await wait(1000);
  ok(/With the vendor/.test(await text(page, '#cm-d-done')), 'Sent back to the vendor → result', (await text(page, '#cm-d-done')).slice(0, 140));
  ok(/2/.test(await text(page, '.rb-rail nav a[data-to="CM-02"] .rb-count')), 'It leaves Ready to publish (badge 2)');
  await rail(page, 'CM-04'); await page.click('#cm-lib-tab-vendor'); await wait(200);
  ok(await page.locator('.rk-rowlink', { hasText: 'Transient Cooling' }).count() === 1 && /You sent it back/.test(await bodyText(page)), 'Library · With vendor lists it (“You sent it back”)');
  await page.locator('.rk-rowlink', { hasText: 'Transient Cooling' }).click(); await wait(300);
  ok(/With the vendor/.test(await bodyText(page)) && /Say which cylinder sizes/.test(await bodyText(page)) && !(await exists(page, '#cm-d-go')), 'Its decision page is now read-only with the reason in its history');
  await rail(page, 'CM-04'); await page.click('#cm-lib-tab-published'); await page.fill('#cm-lib-q', 'motor'); await wait(250);
  ok(await page.locator('.rk-chip').count() === 1, 'Search adds a removable chip');
  await page.locator('.rk-chip button').click(); await wait(250);
  ok(await page.locator('.rk-chip').count() === 0 && /^12 published$/.test(await text(page, '.rk-count')) && (await active(page)).startsWith('#cm-lib-q'), 'Removing the chip clears it and returns focus to the search', await text(page, '.rk-count'));
  await rail(page, 'CM-09');
  await page.fill('#cm-k-code-5', 'ME ZG541'); await wait(120);
  await page.click('#cm-k-undo'); await wait(250);
  ok(await val(page, '#cm-k-code-5') === '' && /No unsaved changes/.test(await text(page, '.cm-codes-state')), 'Undo changes restores the saved codes');
  await noErrors(log, 'J6');
  const e2 = await open({ screen: 'published', record: 'e2', preset: 'start-del:e2' });
  await e2.page.getByRole('button', { name: 'Go to the web link' }).click(); await wait(200);
  ok((await active(e2.page)).startsWith('#cm-u-web'), '“Go to the web link” moves focus to the field', await active(e2.page));
  const rt = await open({ screen: 'update', record: 'UPD-0006', preset: 'send' });
  await rt.page.fill('#cm-dock-rr', 'Please also correct the efficiency sentence.');
  await rt.page.getByRole('button', { name: 'Academic Reviewer returns it' }).click(); await wait(300);
  ok(/Returned to you/.test(await text(rt.page, '#cm-u-state')) && /efficiency sentence/.test(await text(rt.page, '.cm-retbox')), 'Handoff: returned again — the new reason is shown first');
  await rt.page.click('#cm-u-wd'); await wait(250);
  ok(await inDialog(rt.page), 'Withdraw dialog takes focus', await active(rt.page));
  await rt.page.fill('#cm-dlg-wd-r', 'The vendor is replacing the build.'); await rt.page.click('#cm-dlg-wd-ok'); await wait(900);
  ok(/Withdrawn/.test(await text(rt.page, '#cm-u-state')) && !(await exists(rt.page, '#cm-u-why')), 'Withdrawn from returned → read-only');
  ok(/Kept in this update’s history|The vendor is replacing the build/.test(await bodyText(rt.page)), 'Withdrawal reason is kept in the update history');
  await rt.page.getByRole('link', { name: 'Back to the published experiment' }).click(); await wait(300);
  ok(await visible(rt.page, '#cm-p-start') && /^1\.0 live$/.test(await text(rt.page, '.rb-id-status .cm-ver-live')) && !(await exists(rt.page, '.cm-idflow')), 'After withdrawal a new correction can start; live 1.0 unchanged; no correction shown in progress');
  const hp = await open({ screen: 'help', preset: 'report-sent,goto:help' });
  await hp.page.getByRole('link', { name: /Open report SUP-0186/ }).click(); await wait(300);
  ok(/empty frame/.test(await h1(hp.page)), 'Help → Open report shows the report in full', await h1(hp.page));
}

// ───────────────────────── J7 · an unlabelled draft in the Updates list ─────────────────────────
if (!only || only === 'J7') {
  J = 'J7 list details';
  const { page, log } = await open({ screen: 'published', record: 'e2' });
  await page.click('#cm-p-start'); await wait(350);
  ok(await h1(page) === 'Update to Fin-Tube Bundle', 'Start a correction opens the draft', await h1(page));
  await rail(page, 'CM-08');
  const row = (await page.locator('.cm-trk', { hasText: 'Fin-Tube Bundle' }).first().innerText()).replace(/\s+/g, ' ');
  ok(/1\.0 live/.test(row) && /No version label yet/.test(row) && !/…/.test(row), 'Unlabelled draft reads “1.0 live → No version label yet”', row);
  await noErrors(log, 'J7');
}

// ───────────────────────── J8 · send back to the Academic Reviewer for a re-check ─────────────────────────
if (!only || only === 'J8') {
  J = 'J8 re-check';
  const { page, log } = await open({ screen: 'decision', record: 'SUB-0077' });
  await page.locator('label.rk-choice', { hasText: 'To the Academic Reviewer or the vendor' }).click(); await wait(150);
  await page.locator('label.rk-choice', { hasText: 'For a re-check of the academic content' }).click(); await wait(150);
  ok(!(await exists(page, '#cm-d-ref-summary')), 'No field references for the Academic Reviewer');
  await page.click('#cm-d-go'); await wait(250);
  ok(await visible(page, '#cm-d-errs') && /reason/i.test(await text(page, '#cm-d-errs')) && (await active(page)).startsWith('#cm-d-errs'), 'Send back without a reason is refused; focus on the summary', await text(page, '#cm-d-errs'));
  await page.fill('#cm-d-reason', 'Please check the third learning outcome against the description.');
  await page.click('#cm-d-go'); await wait(1000);
  ok(/Back with the Academic Reviewer/.test(await text(page, '#cm-d-done')) && (await active(page)).startsWith('#cm-d-done'), 'Sent back → result, focus on it', (await text(page, '#cm-d-done')).slice(0, 140));
  ok(/2/.test(await text(page, '.rb-rail nav a[data-to="CM-02"] .rb-count')), 'It leaves Ready to publish (badge 2)');
  await rail(page, 'CM-04'); await page.click('#cm-lib-tab-review'); await wait(200);
  ok(await page.locator('.rk-rowlink', { hasText: 'Conduction Through a Composite Wall' }).count() === 1 && /Re-check you asked for/.test(await bodyText(page)), 'Library · In review lists it as “Re-check you asked for”');
  await rail(page, 'CM-01');
  ok(/Conduction Through a Composite Wall Academic Reviewer · re-check you asked for on 27 Aug Back with the Academic Reviewer/.test(await bodyText(page)), 'Overview · With others shows the re-check');
  await page.getByRole('link', { name: 'Open Conduction Through a Composite Wall' }).click(); await wait(300);
  ok(/Back with the Academic Reviewer/.test(await bodyText(page)) && !(await exists(page, '#cm-d-go')) && /check the third learning outcome/.test(await bodyText(page)), 'Its decision page is read-only and keeps the reason');
  await noErrors(log, 'J8');
}

// ───────────────────────── J9 · keyboard in the send and withdraw dialogs ─────────────────────────
if (!only || only === 'J9') {
  J = 'J9 dialog keys';
  const { page, log } = await open({ screen: 'update', record: 'UPD-0006' });
  await page.click('#cm-u-send'); await wait(300);
  ok(await inDialog(page), 'Send dialog: focus starts inside', await active(page));
  let t1 = true;
  for (let i = 0; i < 7; i++) { await page.keyboard.press('Tab'); await wait(25); if (!(await inDialog(page))) t1 = false; }
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Shift+Tab'); await wait(25); if (!(await inDialog(page))) t1 = false; }
  ok(t1, 'Send dialog: Tab and Shift+Tab stay inside');
  await page.keyboard.press('Escape'); await wait(200);
  ok(!(await visible(page, '.rk-dialog')) && (await active(page)).startsWith('#cm-u-send'), 'Send dialog: Escape closes it and returns focus to Send for academic review', await active(page));
  ok(/Returned/.test(await text(page, '#cm-u-state')), 'Closing the send dialog sends nothing');
  await page.click('#cm-u-wd'); await wait(300);
  ok(await inDialog(page), 'Withdraw dialog: focus starts inside', await active(page));
  let t2 = true;
  for (let i = 0; i < 7; i++) { await page.keyboard.press('Tab'); await wait(25); if (!(await inDialog(page))) t2 = false; }
  for (let i = 0; i < 3; i++) { await page.keyboard.press('Shift+Tab'); await wait(25); if (!(await inDialog(page))) t2 = false; }
  ok(t2, 'Withdraw dialog: Tab and Shift+Tab stay inside');
  await page.keyboard.press('Escape'); await wait(200);
  ok(!(await visible(page, '.rk-dialog')) && (await active(page)).startsWith('#cm-u-wd'), 'Withdraw dialog: Escape closes it and returns focus to Withdraw', await active(page));
  ok(/Returned/.test(await text(page, '#cm-u-state')), 'Closing the withdraw dialog withdraws nothing');
  await noErrors(log, 'J9');
  for (const w of [1440, 375]) {
    const sk = await open({ screen: 'overview' }, w, w === 375 ? 812 : 900);
    const hidden = await sk.page.locator('.xsb-skip').evaluate(e => e.getBoundingClientRect().bottom <= 0);
    await sk.page.keyboard.press('Tab'); await wait(120);
    const shown = await sk.page.locator('.xsb-skip').evaluate(e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= window.innerHeight; });
    ok(hidden && shown && /Skip to main content/.test(await active(sk.page)), 'At ' + w + ': the first Tab shows “Skip to main content” (hidden until then)', await active(sk.page));
    await sk.page.keyboard.press('Enter'); await wait(200);
    ok((await active(sk.page)).startsWith('#cm-main'), 'At ' + w + ': Enter moves focus to the main content', await active(sk.page));
    await noErrors(sk.log, 'J9 skip ' + w);
  }
}

// ───────────────────────── J10 · busy states while a command runs ─────────────────────────
// Each command shows its working label on the button that started it, disabled, until the result arrives.
if (!only || only === 'J10') {
  J = 'J10 busy states';
  const busy = async (page, sel, label, re) => {
    const t = await text(page, sel), dis = await page.locator(sel).isDisabled();
    ok(re.test(t) && dis, label, t + (dis ? ' · disabled' : ' · not disabled'));
  };
  const d = await open({ screen: 'decision', record: 'SUB-0077' });
  await d.page.locator('label.rk-choice', { hasText: 'It appears in the public catalogue' }).click(); await wait(150);
  await d.page.click('#cm-d-go'); await wait(250);
  await d.page.click('#cm-dlg-pub-ok'); await wait(60);
  await busy(d.page, '#cm-dlg-pub-ok', 'Publish: while it runs the confirm button reads “Publishing…” and is disabled', /^Publishing…$/);
  ok(await d.page.locator('#cm-dlg-pub-cancel').isDisabled(), 'Publish: Cancel is disabled while it runs — a sent command is not taken back');
  await wait(40); await d.page.keyboard.press('Escape'); await wait(60);
  ok(await visible(d.page, '.rk-dialog') && await inDialog(d.page), 'Publish: Escape does not close the dialog while it runs, and focus stays inside it', await active(d.page));
  await shot(d.page, 'J10-publishing');
  await wait(1000);
  ok(await visible(d.page, '#cm-d-done') && /Published/.test(await text(d.page, '#cm-d-done')), 'Publish: then the result replaces the decision', (await text(d.page, '#cm-d-done')).slice(0, 80));
  await noErrors(d.log, 'J10 publish');
  const sb = await open({ screen: 'decision', record: 'SUB-0070' });
  await sb.page.locator('label.rk-choice', { hasText: 'To the Academic Reviewer or the vendor' }).click(); await wait(150);
  await sb.page.locator('label.rk-choice', { hasText: 'For a re-check of the academic content' }).click(); await wait(150);
  await sb.page.fill('#cm-d-reason', 'Please add the learning outcomes.');
  await sb.page.click('#cm-d-go'); await wait(60);
  await busy(sb.page, '#cm-d-go', 'Send back: the button reads “Sending…” and is disabled', /^Sending…$/);
  await wait(1000);
  ok(/Back with the Academic Reviewer/.test(await text(sb.page, '#cm-d-done')), 'Send back: then the result', (await text(sb.page, '#cm-d-done')).slice(0, 80));
  await noErrors(sb.log, 'J10 send back');
  const u = await open({ screen: 'update', record: 'UPD-0006' });
  await u.page.click('#cm-u-save'); await wait(60);
  await busy(u.page, '#cm-u-save', 'Save draft: the button reads “Saving…” and is disabled', /^Saving…$/);
  await wait(800);
  ok(await visible(u.page, '#cm-u-saved') && /^Save draft$/.test(await text(u.page, '#cm-u-save')), 'Save draft: then “Draft saved” and the button is back', await text(u.page, '#cm-u-saved'));
  await u.page.click('#cm-u-send'); await wait(300);
  await u.page.click('#cm-dlg-send-ok'); await wait(60);
  await busy(u.page, '#cm-dlg-send-ok', 'Send for academic review: the confirm button reads “Sending…” and is disabled', /^Sending…$/);
  await wait(30); await u.page.keyboard.press('Escape'); await wait(60);
  ok(await u.page.locator('#cm-dlg-send-cancel').isDisabled() && await visible(u.page, '.rk-dialog') && await inDialog(u.page), 'Send: Cancel is disabled and Escape does nothing while it runs; focus stays inside', await active(u.page));
  await wait(900);
  ok(/In academic review/.test(await text(u.page, '#cm-u-state')), 'Send: then the update is in academic review', await text(u.page, '#cm-u-state'));
  await u.page.click('#cm-u-wd'); await wait(300);
  await u.page.fill('#cm-dlg-wd-r', 'Raised by mistake.'); await u.page.click('#cm-dlg-wd-ok'); await wait(60);
  await busy(u.page, '#cm-dlg-wd-ok', 'Withdraw: the confirm button reads “Withdrawing…” and is disabled', /^Withdrawing…$/);
  ok(await u.page.locator('#cm-dlg-wd-cancel').isDisabled(), 'Withdraw: Cancel is disabled while it runs');
  await wait(900);
  ok(/Withdrawn/.test(await text(u.page, '#cm-u-state')), 'Withdraw: then the update is withdrawn', await text(u.page, '#cm-u-state'));
  await noErrors(u.log, 'J10 correction');
  const k = await open({ screen: 'codes' });
  await k.page.fill('#cm-k-code-5', 'ME ZG541'); await wait(120);
  await k.page.click('#cm-k-save'); await wait(60);
  await busy(k.page, '#cm-k-save', 'Save codes: the button reads “Saving…” and is disabled', /^Saving…$/);
  ok(/Saving…/.test(await text(k.page, '.cm-codes-state')) && await k.page.locator('#cm-k-undo').isDisabled(), 'Save codes: the footer says “Saving…” and Undo changes waits', await text(k.page, '.cm-codes-state'));
  await k.page.locator('.cm-codes-foot').scrollIntoViewIfNeeded(); await shot(k.page, 'J10-saving-codes');
  await wait(900);
  ok(await visible(k.page, '#cm-k-saved') && /^Save codes$/.test(await text(k.page, '#cm-k-save')), 'Save codes: then “Codes saved” and the button is back', await text(k.page, '#cm-k-saved'));
  await noErrors(k.log, 'J10 codes');
  const r = await open({ screen: 'report' });
  await r.page.fill('#cm-r-what', 'The course filter forgets my choice when I switch views.'); await r.page.click('#cm-r-send'); await wait(60);
  await busy(r.page, '#cm-r-send', 'Send report: the button reads “Sending…” and is disabled', /^Sending…$/);
  await wait(900);
  ok(await h1(r.page) === 'Report sent', 'Send report: then Report sent', await h1(r.page));
  await noErrors(r.log, 'J10 report');
}

// ───────────────────────── J11 · list reads that are loading or failed ─────────────────────────
// The kit's ListState (seed SA-02, IA-02): loading shows an announced status and a skeleton, without the count or
// figures; failed says nothing has changed and offers Try again, which reloads the list and focuses the page title.
if (!only || only === 'J11') {
  J = 'J11 list states';
  const LISTS = [
    { v: 'library', pre: 'tab:published,', h: 'Content library', hid: '#cm-h-library', rows: '.rk-table .rk-rowlink', n: 12, rail: 'CM-04', retry: '#cm-lib-retry', what: 'the content library' },
    { v: 'ready', pre: '', h: 'Ready to publish', hid: '#cm-h-ready', rows: '.cm-qcard', n: 3, rail: 'CM-02', retry: '#cm-q-retry', what: 'the experiments ready to publish' },
    { v: 'updates', pre: '', h: 'Updates', hid: '#cm-h-updates', rows: '.cm-trk', n: 4, rail: 'CM-08', retry: '#cm-upd-retry', what: 'your corrections' },
    { v: 'codes', pre: '', h: 'Course codes', hid: '#cm-h-codes', rows: '.cm-codes .rk-input', n: 6, rail: 'CM-09', retry: '#cm-k-retry', what: 'the course codes' }
  ];
  for (const L of LISTS) {
    const ld = await open({ screen: L.v, preset: L.pre + 'load:' + L.v });
    const busy = await ld.page.evaluate(() => { const b = document.querySelector('[aria-busy="true"]'); return b ? b.innerText.replace(/\s+/g, ' ').trim() : ''; });
    ok(new RegExp('^Loading ' + L.what + '…$').test(busy) && await ld.page.locator(L.rows).count() === 0 && !(await exists(ld.page, '.rb-figs')) && await ld.page.locator('.rk-skel').count() > 0,
      L.h + ' loading: an announced status and a skeleton; no rows, no figures', busy);
    await noErrors(ld.log, 'J11 ' + L.v + ' loading');
    const f = await open({ screen: L.v, preset: L.pre + 'fail:' + L.v });
    const alertT = await text(f.page, '.rk-state[role="alert"]');
    ok(new RegExp('We couldn’t load ' + L.what + ' Nothing has changed\\. Try again\\.').test(alertT) && await f.page.locator(L.rows).count() === 0 && !(await exists(f.page, '.rb-figs')),
      L.h + ' failed: says nothing has changed and offers Try again; no rows, no figures', alertT);
    await f.page.click(L.retry); await wait(250);
    const n = await f.page.locator(L.rows).count();
    ok(n === L.n && await exists(f.page, '.rb-figs') && (await active(f.page)).startsWith(L.hid), L.h + ' failed → Try again: the list is back (' + L.n + ') and focus is on the page title', n + ' · ' + await active(f.page));
    const f2 = await open({ screen: L.v, preset: L.pre + 'fail:' + L.v });
    await rail(f2.page, 'CM-01'); await rail(f2.page, L.rail);
    ok(await f2.page.locator(L.rows).count() === L.n || (L.v === 'library' && await f2.page.locator('.rk-table .rk-rowlink').count() > 0), L.h + ' failed → leave and come back: it loads again');
    await noErrors(f.log, 'J11 ' + L.v + ' failed');
  }
}

// ───────────────────────── console check on every page every journey opened ─────────────────────────
for (const jn of [...new Set(opened.map(o => o.journey))]) {
  J = jn;
  const mine = opened.filter(o => o.journey === jn);
  // strict: no filter at all here, not even the runtime's "never resolved" warning
  const bad = mine.map(o => ({ label: o.label, errs: o.log.slice() })).filter(o => o.errs.length);
  ok(bad.length === 0, 'No console error or warning of any kind on any of the ' + mine.length + ' page(s) this journey opened', bad.map(o => o.label + ': ' + o.errs[0]).join(' | '));
}

fs.writeFileSync('/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/tools/journeys' + (only ? '-' + only : '') + '.json', JSON.stringify(results, null, 1));
const fails = results.filter(r => !r.pass);
console.log('\n' + results.length + ' steps, ' + fails.length + ' failed');
for (const n of made) { try { fs.unlinkSync(R + '/' + n); } catch (e) {} }
await b.close();

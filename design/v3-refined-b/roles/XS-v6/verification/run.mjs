// Local render + interaction harness for the XS canvas files.
// Serves nothing itself: expects http://127.0.0.1:8765/ to serve the project files plus support.js.
// Google Fonts is blocked in this sandbox, so the Public Sans css2 request is answered with a local
// @font-face (OFL @fontsource-variable/public-sans) — same family name, same weights axis.
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/npm-tools/node_modules/playwright');

const BASE = 'http://127.0.0.1:8765/';
const specFile = process.argv[2];
const outDir = process.argv[3] || path.join(path.dirname(new URL(import.meta.url).pathname), 'shots');
fs.mkdirSync(outDir, { recursive: true });
const jobs = JSON.parse(fs.readFileSync(specFile, 'utf8'));

const FONT_CSS = `@font-face{font-family:'Public Sans';font-style:normal;font-weight:100 900;font-display:swap;src:url(${BASE}__fonts/public-sans-latin-wght-normal.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Public Sans';font-style:normal;font-weight:100 900;font-display:swap;src:url(${BASE}__fonts/public-sans-latin-ext-wght-normal.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}`;

const describe = `(() => { const a = document.activeElement; if (!a || a === document.body) return 'BODY';
  const t = a.tagName.toLowerCase(); const id = a.id ? '#' + a.id : ''; const cls = a.className && typeof a.className === 'string' ? '.' + a.className.trim().split(/\\s+/).slice(0,2).join('.') : '';
  const name = (a.getAttribute('aria-label') || a.textContent || a.value || '').replace(/\\s+/g,' ').trim().slice(0,70);
  const fv = a.matches(':focus-visible') ? ' [focus-visible]' : '';
  return t + id + cls + ' "' + name + '"' + fv; })()`;

const overflow = `(() => { const d = document.documentElement; const out = [];
  if (d.scrollWidth > d.clientWidth + 1) out.push('DOC scrollWidth ' + d.scrollWidth + ' > ' + d.clientWidth);
  const W = d.clientWidth; let n = 0;
  for (const el of document.querySelectorAll('body *')) { const st = getComputedStyle(el); if (st.display === 'none' || st.visibility === 'hidden' || st.position === 'fixed') continue;
    if (el.closest('.xr-sr,.xs-live,svg')) continue;
    const r = el.getBoundingClientRect(); if (r.width === 0 || r.height === 0) continue;
    if (r.right > W + 1 || r.left < -1) { if (n++ < 8) out.push('OUT ' + el.tagName.toLowerCase() + '.' + String(el.className).split(' ').slice(0,2).join('.') + ' L' + Math.round(r.left) + ' R' + Math.round(r.right)); } }
  for (const el of document.querySelectorAll('body *')) { if (el.scrollWidth > el.clientWidth + 1) { const st = getComputedStyle(el); if (['auto','scroll','hidden','clip'].includes(st.overflowX) && !el.matches('.rb-switch,.rk-tabs,.xr-sr,.xs-live')) { if (el.clientWidth > 0 && n++ < 12) out.push('CLIP ' + el.tagName.toLowerCase() + '.' + String(el.className).split(' ').slice(0,2).join('.') + ' sw' + el.scrollWidth + ' cw' + el.clientWidth); } } }
  return out.length ? out.join(' | ') : 'no horizontal overflow'; })()`;

const AXE = fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), 'node_modules/axe-core/axe.min.js'), 'utf8');
async function runAxe(page) {
  await page.addScriptTag({ content: AXE });
  const res = await page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] });
    return r.violations.map(v => v.id + ' [' + v.impact + '] x' + v.nodes.length + ' @ ' + v.nodes.slice(0, 2).map(n => n.target.join(' ')).join(' ; '));
  });
  return res.length ? 'AXE VIOLATIONS: ' + res.join(' || ') : 'axe wcag2a/aa/21aa/22aa: 0 violations';
}

const smallText = `(() => { const bad = new Map();
  for (const el of document.querySelectorAll('body *')) { if (!el.childNodes.length) continue; let txt = ''; for (const c of el.childNodes) if (c.nodeType === 3) txt += c.nodeValue; txt = txt.trim(); if (!txt) continue;
    const st = getComputedStyle(el); if (st.display === 'none' || st.visibility === 'hidden') continue; if (el.closest('.xr-sr,.xs-live,[aria-hidden="true"] .xr-sr')) continue;
    const fs = parseFloat(st.fontSize); if (fs < 14) { const k = Math.round(fs*10)/10 + 'px ' + el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0]; bad.set(k, (bad.get(k)||0) + 1); } }
  return bad.size ? [...bad.entries()].map(([k,v]) => k + ' x' + v).join(' | ') : 'no text under 14px'; })()`;

const fontCheck = `(async () => { await document.fonts.ready; const ok = document.fonts.check('16px "Public Sans"'); const used = [...document.fonts].filter(f => f.family.includes('Public Sans')).map(f => f.status); return 'Public Sans loaded: ' + ok + ' (' + used.join(',') + ')'; })()`;

// full-page capture: grow the viewport to the document height so sticky 100vh chrome (the rail) is drawn
// the way a tall canvas frame draws it, then put the viewport back
async function snap(page, file, full, job) {
  if (!full) { await page.screenshot({ path: file }); return; }
  const h = await page.evaluate('Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)');
  const vh = job.height || 900;
  if (h > vh) { await page.setViewportSize({ width: job.width, height: h }); await page.waitForTimeout(250); }
  await page.screenshot({ path: file, fullPage: true });
  if (h > vh) { await page.setViewportSize({ width: job.width, height: vh }); await page.waitForTimeout(120); }
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--disable-background-networking','--disable-component-update','--no-default-browser-check','--disable-sync'] }).catch(async () => chromium.launch());
  const report = [];
  for (const job of jobs) {
    const ctx = await browser.newContext({ viewport: { width: job.width, height: job.height || 900 }, reducedMotion: job.reducedMotion ? 'reduce' : 'no-preference', deviceScaleFactor: job.dpr || 1 });
    const page = await ctx.newPage();
    const log = [];
    page.on('console', m => { if (['error', 'warning'].includes(m.type())) log.push(m.type() + ': ' + m.text().slice(0, 300)); });
    page.on('pageerror', e => log.push('pageerror: ' + String(e).slice(0, 300)));
    page.on('response', r => { if (r.status() >= 400) log.push('http ' + r.status() + ' ' + r.url().slice(0, 160)); });
    await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: FONT_CSS }));
    await page.route('https://fonts.gstatic.com/**', r => r.abort());
    await page.goto(BASE + job.file, { waitUntil: 'networkidle' });
    await page.waitForTimeout(job.settle || 700);
    const lines = [];
    for (const st of (job.steps || [])) {
      try {
        if (st.click) { await page.click(st.click, { timeout: 4000 }); await page.waitForTimeout(st.wait ?? 250); }
        else if (st.clickText) { await page.getByText(st.clickText, { exact: !!st.exact }).first().click({ timeout: 4000 }); await page.waitForTimeout(st.wait ?? 250); }
        else if (st.role) { await page.getByRole(st.role, { name: st.name, exact: !!st.exact }).first().click({ timeout: 4000 }); await page.waitForTimeout(st.wait ?? 250); }
        else if (st.fill) { await page.fill(st.fill[0], st.fill[1]); await page.waitForTimeout(st.wait ?? 80); }
        else if (st.type) { await page.type(st.type[0], st.type[1]); await page.waitForTimeout(st.wait ?? 80); }
        else if (st.press) { await page.keyboard.press(st.press); await page.waitForTimeout(st.wait ?? 160); }
        else if (st.mouse) { await page.mouse.click(st.mouse[0], st.mouse[1]); await page.waitForTimeout(st.wait ?? 250); }
        else if (st.wait) { await page.waitForTimeout(st.wait); }
        else if (st.upload) { await page.setInputFiles(st.upload[0], { name: st.upload[1], mimeType: 'image/png', buffer: Buffer.from('89504e47', 'hex') }); await page.waitForTimeout(150); }
        if (st.focus) lines.push((st.label || 'focus') + ': ' + await page.evaluate(describe));
        if (st.text) { const t = await page.evaluate(sel => { const el = document.querySelector(sel); return el ? el.innerText.replace(/\s+/g, ' ').trim().slice(0, 400) : 'MISSING ' + sel; }, st.text); lines.push((st.label || 'text') + ': ' + t); }
        if (st.count) { const n = await page.locator(st.count).count(); lines.push((st.label || 'count ' + st.count) + ': ' + n); }
        if (st.attr) { const v = await page.evaluate(([sel, a]) => { const el = document.querySelector(sel); return el ? el.getAttribute(a) : 'MISSING'; }, st.attr); lines.push((st.label || 'attr') + ': ' + v); }
        if (st.eval) { const v = await page.evaluate(st.eval); lines.push((st.label || 'eval') + ': ' + v); }
        if (st.axe) lines.push((st.label ? st.label + ' ' : '') + await runAxe(page));
        if (st.shot) { await snap(page, path.join(outDir, st.shot + '.png'), st.full !== false, job); lines.push('shot ' + st.shot); }
      } catch (e) { lines.push('STEP FAILED ' + JSON.stringify(st).slice(0, 160) + ' :: ' + String(e).split('\n')[0].slice(0, 200)); }
    }
    if (job.axe) lines.push(await runAxe(page));
    if (job.checks !== false) {
      lines.push('overflow: ' + await page.evaluate(overflow));
      lines.push('small text: ' + await page.evaluate(smallText));
      lines.push(await page.evaluate(fontCheck));
      lines.push('doc height: ' + await page.evaluate('document.documentElement.scrollHeight'));
    }
    if (job.shot) { await snap(page, path.join(outDir, job.shot + '.png'), true, job); lines.push('shot ' + job.shot); }
    report.push('### ' + (job.name || job.file) + ' @' + job.width + '\n' + lines.join('\n') + (log.length ? '\nCONSOLE:\n' + log.join('\n') : '\nconsole clean'));
    await ctx.close();
  }
  await browser.close();
  console.log(report.join('\n\n'));
})();

// Local render harness for .dc.html artboards.
// Serves a project folder at http://canvas.local/ and fulfils the runtime's CDN requests
// (React, ReactDOM, Babel — SRI-identical npm copies) and the Google Fonts css2 request
// (Public Sans variable woff2 from @fontsource) from local files. Nothing is fetched from the network.
import { chromium } from '/opt/npm-tools/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const TOOLS = path.dirname(new URL(import.meta.url).pathname);
const VENDOR = path.join(TOOLS, 'vendor', 'node_modules');
const RUNTIME = process.env.DC_RUNTIME || path.join(TOOLS, 'support.js');

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' };

export async function openBrowser() {
  return chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
}

export async function newPage(browser, root, { width = 1440, height = 900, reducedMotion = 'no-preference' } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion });
  const page = await context.newPage();
  const log = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') log.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => log.push('pageerror: ' + e.message));
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.host === 'canvas.local') {
      let p = decodeURIComponent(url.pathname);
      if (p === '/support.js') return route.fulfill({ status: 200, contentType: MIME['.js'], body: fs.readFileSync(RUNTIME) });
      const file = path.join(root, p);
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return route.fulfill({ status: 404, body: 'not found' });
      return route.fulfill({ status: 200, contentType: MIME[path.extname(file)] || 'application/octet-stream', body: fs.readFileSync(file) });
    }
    if (url.host === 'cdn.jsdelivr.net') {
      const map = {
        '/npm/react@18.3.1/umd/react.production.min.js': 'react/umd/react.production.min.js',
        '/npm/react-dom@18.3.1/umd/react-dom.production.min.js': 'react-dom/umd/react-dom.production.min.js',
        '/npm/@babel/standalone@7.29.0/babel.min.js': '@babel/standalone/babel.min.js'
      };
      const rel = map[url.pathname];
      if (rel) return route.fulfill({ status: 200, contentType: MIME['.js'], headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(path.join(VENDOR, rel)) });
      return route.fulfill({ status: 404, body: '' });
    }
    if (url.host === 'fonts.googleapis.com') {
      const css = [
        "@font-face{font-family:'Public Sans';font-style:normal;font-weight:100 900;font-display:swap;src:url(https://fonts.gstatic.com/local/ps-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;}",
        "@font-face{font-family:'Public Sans';font-style:normal;font-weight:100 900;font-display:swap;src:url(https://fonts.gstatic.com/local/ps-latin-ext.woff2) format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF;}"
      ].join('\n');
      return route.fulfill({ status: 200, contentType: 'text/css', headers: { 'access-control-allow-origin': '*' }, body: css });
    }
    if (url.host === 'fonts.gstatic.com') {
      const f = url.pathname.endsWith('ps-latin-ext.woff2') ? 'public-sans-latin-ext-wght-normal.woff2' : 'public-sans-latin-wght-normal.woff2';
      return route.fulfill({ status: 200, contentType: 'font/woff2', headers: { 'access-control-allow-origin': '*' }, body: fs.readFileSync(path.join(VENDOR, '@fontsource-variable/public-sans/files', f)) });
    }
    return route.fulfill({ status: 204, body: '' });
  });
  return { context, page, log };
}

export async function load(page, file) {
  await page.goto('http://canvas.local/' + file, { waitUntil: 'load' });
  await page.waitForFunction(() => document.querySelector('.xr') && document.fonts && document.fonts.status === 'loaded', null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(400);
}

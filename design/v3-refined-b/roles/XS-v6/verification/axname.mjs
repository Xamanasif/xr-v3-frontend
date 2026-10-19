// Reads Chromium's computed accessible names (CDP Accessibility tree) for selected elements.
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const [file, sel, width] = [process.argv[2], process.argv[3], Number(process.argv[4] || 1440)];
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  await page.route('https://fonts.googleapis.com/**', r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await page.goto('http://127.0.0.1:8765/' + file, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1300);
  const cdp = await ctx.newCDPSession(page);
  const { nodes } = await cdp.send('Accessibility.getFullAXTree');
  const els = await page.$$(sel);
  for (const el of els) {
    const { node } = await cdp.send('DOM.describeNode', { objectId: (await el.evaluateHandle(e => e))._impl_obj?._objectId || undefined }).catch(() => ({}));
  }
  // match by backendDOMNodeId
  const ids = await page.evaluate(s => [...document.querySelectorAll(s)].length, sel);
  const doc = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
  const q = await cdp.send('DOM.querySelectorAll', { nodeId: doc.root.nodeId, selector: sel });
  for (const nid of q.nodeIds) {
    const d = await cdp.send('DOM.describeNode', { nodeId: nid });
    const ax = nodes.find(n => n.backendDOMNodeId === d.node.backendNodeId);
    console.log((ax && ax.role ? ax.role.value : '?') + ' | name: "' + (ax && ax.name ? ax.name.value : '') + '"');
  }
  await browser.close();
})();

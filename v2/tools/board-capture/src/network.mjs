// The capture network (Appendix E §9.1 steps 3–4): localhost passes, the approved external inputs
// are fulfilled from the verified vendor bytes, everything else is aborted and recorded. Board
// captures and product captures use this same layer, so both load the same font files.

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]']);

/**
 * `support.js` loads the scripts with `integrity` + `crossOrigin="anonymous"`, and the font CSS
 * and woff2 files are cross-origin too: without this header the browser refuses them (and SRI
 * fails), so the board would never render.
 */
const CORS = { 'access-control-allow-origin': '*' };

/**
 * The V3 surfaces' Public Sans weight range (`wght@400..800`, ADR-0010; apps/web
 * `features/shared/v3-fonts.tsx`), which the sign-in page and the workspaces link for the Entry &
 * shared (XS) surfaces. No v46 comparison draws a weight above 700, and the v46 comparisons of the
 * XS screens are retired (docs/v3/V3-COMPARISON-MAP.json), so the capture network answers this one
 * stylesheet empty — recorded in the ledger as `v3-font-range` — instead of blocking it: the
 * product pages keep exactly the vendored v46 font files.
 */
export const V3_FONT_RANGE_URL =
  'https://fonts.googleapis.com/css2?family=Public+Sans:wght@400..800&display=swap';

/**
 * Routes every request of `context`. `responses` is `verifiedVendor().responses` (URL → bytes).
 * Returns the ledger the run report and the network test read: what was served from the vendor
 * folder, what was blocked, and every font file requested.
 *
 * @param {import('@playwright/test').BrowserContext} context
 * @param {Map<string, {body: Buffer, contentType: string, file: string}>} responses
 */
export async function installCaptureNetwork(context, responses) {
  const ledger = { local: 0, served: [], blocked: [], fonts: [] };
  await context.route('**/*', async (route) => {
    const url = route.request().url();
    // Every font file the pages fetch, wherever from: the fixtures accept only the vendored woff2.
    if (route.request().resourceType() === 'font') ledger.fonts.push(url);
    const { hostname, protocol } = new URL(url);
    if ((protocol === 'http:' || protocol === 'https:') && LOCAL_HOSTS.has(hostname)) {
      ledger.local += 1;
      await route.continue();
      return;
    }
    if (url === V3_FONT_RANGE_URL) {
      ledger.served.push('v3-font-range (empty)');
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/css; charset=utf-8', ...CORS },
        body: '',
      });
      return;
    }
    const vendored = responses.get(url);
    if (vendored) {
      ledger.served.push(vendored.file);
      await route.fulfill({
        status: 200,
        headers: { 'content-type': vendored.contentType, ...CORS },
        body: vendored.body,
      });
      return;
    }
    ledger.blocked.push(url);
    await route.abort('blockedbyclient');
  });
  return ledger;
}

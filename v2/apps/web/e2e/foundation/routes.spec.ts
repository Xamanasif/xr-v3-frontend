import { expect, test } from '@playwright/test';

/**
 * The Phase-0 route set as the product build serves it (Appendix F §3.3; ADR-0005; WP-0.13
 * acceptance 8): the seven workspace bases with their Help pages answer 200 (the shell and page are
 * drawn in the browser once the tab's session is known, ADR-0004); `/<base>/help/reports`
 * redirects to `/<base>/help` (Appendix A §3.7 row 20); every address outside the workspaces —
 * the public pages and sign-in included until Phase 1 (G-8) — is the public not-found with 404.
 */
test.skip(({ viewport }) => viewport?.width !== 1440, 'HTTP answers do not depend on the width.');

const BASES = ['student', 'faculty', 'institute', 'vendor', 'reviewer', 'content-manager', 'admin'];

test('each workspace’s pages answer 200; the server renders the loading state only', async ({
  request,
}) => {
  for (const base of BASES) {
    for (const path of [
      `/${base}`,
      `/${base}/help`,
      `/${base}/help/report`,
      `/${base}/help/reports/SUP-0213`,
    ]) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), path).toBe(200);
      const html = await response.text();
      expect(html, path).toContain('Loading …');
      // No person, role or report is ever in the server's answer (the world lives in the tab).
      expect(html, path).not.toMatch(/Rahul|SUP-0213 ·|Help &amp; support<\/h1>/);
    }
  }
});

test('row 20: /<base>/help/reports → /<base>/help (not permanent)', async ({ request }) => {
  for (const base of BASES) {
    const response = await request.get(`/${base}/help/reports`, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers()['location']).toBe(`/${base}/help`);
  }
});

test('outside the workspaces: 404 and the public not-found — no public page or sign-in yet', async ({
  request,
}) => {
  for (const path of [
    '/',
    '/sign-in',
    '/signed-out',
    '/experiments',
    '/areas',
    '/selection',
    '/request-access',
    '/system',
    '/workspace/help',
    '/help',
  ]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(404);
    expect(await response.text(), path).toContain('We can’t find that page');
  }
});

test('the kept liveness route', async ({ request }) => {
  expect((await request.get('/healthz')).status()).toBe(200);
});

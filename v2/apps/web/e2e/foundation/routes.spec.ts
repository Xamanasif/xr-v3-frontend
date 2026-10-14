import { expect, test } from '@playwright/test';

/**
 * The Phase-0 route set as the product build serves it (Appendix F §3.3; ADR-0005; WP-0.13
 * acceptance 8): the seven workspace bases with their Help pages answer 200 (the shell and page are
 * drawn in the browser once the tab's session is known, ADR-0004); `/<base>/help/reports`
 * redirects to `/<base>/help` (Appendix A §3.7 row 20); `/sign-in` (XS-01) answers 200 and
 * `/signed-out` redirects to its "Signed out" notice (row 21; Phase-1 Package 1A); every other
 * address outside the workspaces — the public pages included until their packages — is the public
 * not-found with 404.
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

test('Package 1A: /sign-in answers 200; row 21 /signed-out → /sign-in?reason=signed-out', async ({
  request,
}) => {
  const signIn = await request.get('/sign-in', { maxRedirects: 0 });
  expect(signIn.status()).toBe(200);
  const html = await signIn.text();
  // The card is server-rendered without a notice (the query is read in the browser).
  expect(html).toContain('Sign in · XR Learning Platform');
  expect(html).toContain('xp-auth-card');
  const signedOut = await request.get('/signed-out', { maxRedirects: 0 });
  expect(signedOut.status()).toBe(307);
  expect(signedOut.headers()['location']).toBe('/sign-in?reason=signed-out');
  for (const path of ['/admin/requests', '/admin/requests/REQ-0038']) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(200);
    expect(await response.text(), path).not.toMatch(/Konark|REQ-0038 ·|Arjun/);
  }
});

test('the public pages answer 200 (Package 1B; unknown ids are found out in the browser, TE-8)', async ({
  request,
}) => {
  for (const path of [
    '/',
    '/areas',
    '/areas/mechanical-manufacturing',
    '/courses/fluid-mechanics',
    '/experiments',
    '/experiments?format=vr',
    '/experiments/distillation-column',
    '/experiments/no-such-experiment',
  ]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(200);
  }
});

test('outside the workspaces and the public pages: 404 and the public not-found', async ({
  request,
}) => {
  for (const path of [
    '/sign-in/x',
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

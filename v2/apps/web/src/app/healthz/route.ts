export const dynamic = 'force-dynamic';

/** Web liveness only — the web application is not the business API. */
export function GET(): Response {
  return Response.json({
    status: 'ok',
    service: 'xr-platform-web',
    timestamp: new Date().toISOString(),
  });
}

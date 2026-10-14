// A static file server for the scratch copy (runtime/README.md step 3), bound to 127.0.0.1 only.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, sep } from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.csv': 'text/csv; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

/**
 * Serves `root` read-only on an ephemeral 127.0.0.1 port. No directory listings; paths outside
 * `root` answer 404. Resolves to `{ origin, close }`.
 */
export function startStaticServer(root) {
  const server = createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://local').pathname);
    const path = normalize(join(root, pathname));
    if (
      (request.method !== 'GET' && request.method !== 'HEAD') ||
      !path.startsWith(root + sep) ||
      !existsSync(path) ||
      !statSync(path).isFile()
    ) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      'content-type': TYPES[extname(path).toLowerCase()] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    if (request.method === 'HEAD') response.end();
    else createReadStream(path).pipe(response);
  });
  return new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolvePromise({
        origin: `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`,
        close: () => new Promise((done) => server.close(() => done(undefined))),
      });
    });
  });
}

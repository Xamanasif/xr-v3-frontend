import { createServer, type AddressInfo, type Server, type Socket } from 'node:net';

import { afterAll, describe, expect, it } from 'vitest';

import { DATABASE_DEFAULTS, buildPoolConfig, createPrismaClient, probeDatabase } from './index.js';

const UNREACHABLE = 'postgresql://nobody:nobody@127.0.0.1:1/nothing';
const clients: ReturnType<typeof createPrismaClient>[] = [];
const servers: Server[] = [];
const sockets = new Set<Socket>();

afterAll(async () => {
  // A disconnect can only take as long as the pool's own bounds; guard the teardown anyway.
  await Promise.all(
    clients.map((client) =>
      Promise.race([
        client.$disconnect().catch(() => undefined),
        new Promise((done) => setTimeout(done, 2_000)),
      ]),
    ),
  );
  for (const socket of sockets) socket.destroy();
  await Promise.all(servers.map((server) => new Promise((done) => server.close(done))));
}, 15_000);

describe('buildPoolConfig', () => {
  it('applies the documented bounds by default', () => {
    const config = buildPoolConfig({ connectionString: UNREACHABLE });
    expect(config.connectionTimeoutMillis).toBe(DATABASE_DEFAULTS.connectTimeoutMs);
    expect(config.query_timeout).toBe(DATABASE_DEFAULTS.queryTimeoutMs);
    expect(config.statement_timeout).toBe(DATABASE_DEFAULTS.queryTimeoutMs);
    expect(config.max).toBe(DATABASE_DEFAULTS.maxConnections);
    expect(config.idleTimeoutMillis).toBe(DATABASE_DEFAULTS.idleTimeoutMs);
  });

  it('lets a caller tighten the bounds', () => {
    const config = buildPoolConfig({
      connectionString: UNREACHABLE,
      connectTimeoutMs: 250,
      queryTimeoutMs: 1_000,
      maxConnections: 2,
    });
    expect(config.connectionTimeoutMillis).toBe(250);
    expect(config.query_timeout).toBe(1_000);
    expect(config.max).toBe(2);
  });
});

describe('createPrismaClient', () => {
  it('constructs a client without connecting', () => {
    const client = createPrismaClient({ connectionString: UNREACHABLE });
    clients.push(client);
    expect(typeof client.$queryRaw).toBe('function');
    expect(typeof client.$disconnect).toBe('function');
  });
});

describe('probeDatabase', () => {
  it('reports unavailable, without throwing, when nothing listens', async () => {
    const client = createPrismaClient({ connectionString: UNREACHABLE, connectTimeoutMs: 1_000 });
    clients.push(client);
    const result = await probeDatabase(client);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.detail.length).toBeGreaterThan(0);
  }, 15_000);

  it('abandons a server that accepts the connection but never answers, within the connect timeout', async () => {
    // A TCP listener that completes the connection and then stays silent: without a
    // bound, the client would wait for the PostgreSQL handshake forever.
    const server = createServer((socket) => {
      sockets.add(socket);
      socket.on('close', () => sockets.delete(socket));
    });
    servers.push(server);
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
    const { port } = server.address() as AddressInfo;

    const client = createPrismaClient({
      connectionString: `postgresql://nobody:nobody@127.0.0.1:${port}/nothing`,
      connectTimeoutMs: 400,
    });
    clients.push(client);

    const started = Date.now();
    const result = await probeDatabase(client);
    const elapsed = Date.now() - started;

    expect(result.ok).toBe(false);
    expect(elapsed).toBeLessThan(4_000);
    if (!result.ok) expect(result.detail.toLowerCase()).toMatch(/timeout|timed out/);
  }, 15_000);
});

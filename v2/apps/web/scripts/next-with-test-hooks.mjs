#!/usr/bin/env node
// The dedicated CI/Playwright build of the web app (TE-7; ADR-0007 §2–3; Appendix F §7.2):
// `next <command>` with the test-hook build flag set, so next.config.ts resolves the test-hook
// bridge instead of the empty stub and writes to its own folder (`.next-test-hooks`), apart from
// the product build in `.next`. Used only by `build:test-hooks` / `start:test-hooks` (turbo, the
// Playwright web server). No hosted build — owner and reviewer builds included — runs it.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const next = createRequire(import.meta.url).resolve('next/dist/bin/next');
const child = spawn(process.execPath, [next, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, NEXT_PUBLIC_XR_TEST_HOOKS: '1' },
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
child.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});

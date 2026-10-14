// Playwright global setup of a parity suite: re-checks the frozen handoff (178 hashes), checks the
// vendored inputs (STOP on any SRI mismatch), makes the byte-checked scratch copy of the frozen canvas, serves it on 127.0.0.1 and
// hands the origin and the run folder to the workers through the environment.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { prepareScratchCopy, removeStaleScratchCopies, verifyHandoff } from './scratch.mjs';
import { startStaticServer } from './server.mjs';
import { verifiedVendor } from './vendor.mjs';

export default async function globalSetup() {
  const run = process.env.XR_PARITY_RUN_DIR;
  if (!run) throw new Error('XR_PARITY_RUN_DIR is not set: run through the parity config');
  mkdirSync(run, { recursive: true });
  const handoff = verifyHandoff();
  const { checks } = verifiedVendor();
  const stale = removeStaleScratchCopies();
  const { scratch, fileCount } = prepareScratchCopy();
  const server = await startStaticServer(scratch);
  process.env.XR_BOARD_ORIGIN = server.origin;
  writeFileSync(
    join(run, 'inputs.json'),
    `${JSON.stringify(
      {
        handoff: { checked: handoff, ok: true },
        vendor: checks,
        scratch: { fileCount, byteIdentical: true, staleRemoved: stale.length },
      },
      null,
      2,
    )}\n`,
  );
  return async () => {
    await server.close();
    rmSync(scratch, { recursive: true, force: true });
  };
}

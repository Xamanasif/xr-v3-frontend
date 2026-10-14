// Writes `src/pinned.json`: the measurement of every registered comparison of a reviewed run —
// the register entries it names, both capture sizes, whether the icons are the same, the product
// element's content fingerprint (parity.mjs `fingerprintOf`) and the different-pixel count.
// `compareAll` accepts a registered difference only when it still measures the same (sizes, icons
// and fingerprint exactly, pixels within max(20 px, 10 %)), so a register entry cannot absorb a
// later change — also where the captures differ in size and no pixel count exists. Run it only after reviewing the run's diff images:
//   node tools/board-capture/src/pin.mjs <run folder> [<run folder> …]
import { writeFileSync } from 'node:fs';
import { basename, dirname } from 'node:path';

import { PINNED_FILE } from './parity.mjs';
import { parityRecords } from './report.mjs';

const runs = process.argv.slice(2);
if (runs.length === 0) {
  process.stderr.write('usage: node src/pin.mjs <run folder> [<run folder> …]\n');
  process.exit(2);
}
const pinned = {};
for (const run of runs) {
  for (const record of parityRecords(run).records) {
    const ids = (record.deviations ?? []).map((deviation) => deviation.id);
    if (ids.length === 0 || !record.referenceSize) continue;
    const within =
      typeof record.measured?.differentPixels === 'number' &&
      record.measured.ratio <= record.tolerance.maxDiffPixelRatio;
    // A registered comparison inside tolerance with the same icons is a stale entry: never pinned.
    if (within && record.icons?.same) continue;
    if (pinned[record.name]) throw new Error(`${record.name} appears twice`);
    pinned[record.name] = {
      deviations: ids,
      reference: `${record.referenceSize.width}×${record.referenceSize.height}`,
      product: `${record.productSize.width}×${record.productSize.height}`,
      iconsSame: Boolean(record.icons?.same),
      productFingerprint: record.productFingerprint.sha256,
      pixels: record.measured?.differentPixels ?? null,
      run: `${basename(dirname(run))}/${basename(run)}`,
    };
  }
}
const sorted = Object.fromEntries(Object.entries(pinned).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(PINNED_FILE, `${JSON.stringify(sorted, null, 2)}\n`);
process.stdout.write(
  `${Object.keys(sorted).length} registered comparisons pinned in ${PINNED_FILE}\n`,
);

/**
 * Provenance: nothing in @xr/ui comes from the rejected Slice-1 UI (START-HERE Known exception 4;
 * Appendix F §2.3 DISCARD, §2.4, WP-0.6 acceptance 6).
 *
 * The 38 DISCARD entries of v2/docs/v46/understand/repo-baseline.json#slice1 are 33 whole files
 * and 5 hunks inside shared files (README sentences, the tokens.css block, the index.ts exports,
 * the globals.css @source hunk). The 33 file hashes below were taken once, read only, from the
 * uncommitted Slice-1 checkout on 12 Oct 2026; this test never reads that checkout. The hunks
 * cannot be hashed; their content is covered by the identifier ban below (and tokens.css is gone).
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const PACKAGE = join(import.meta.dirname, '..');

/** [sha256, path in the Slice-1 checkout] for every DISCARD entry that is a whole file. */
const SLICE1_DISCARD_FILES: readonly (readonly [string, string])[] = [
  [
    '907a6241528a485c8a65de41ef89fe9fbc5914144cbc97c508a1f63c1652c2d9',
    'v2/apps/web/src/demo/seed.ts',
  ],
  [
    '481e4797b095092f110544e733e85bfc8c2e47de054e4bf7e17e45ada88c3729',
    'v2/packages/ui/src/app-shell.tsx',
  ],
  [
    'bbbcb1a2f25f67a609ae09c616f19c6ebb7f2e2508fab8304677f3b66f476caa',
    'v2/packages/ui/src/button.tsx',
  ],
  [
    'f97824773477f099d81d26fc8f113e6be7ef9cb990fb18ab762ff8c358ef8952',
    'v2/packages/ui/src/card.tsx',
  ],
  [
    '85ea71d2387a09f54bb486cfed907067d1dc11988a23341c88c0d58ae33c608e',
    'v2/packages/ui/src/confirm-dialog.tsx',
  ],
  ['aca4a7f05d4f78ca0e103677caa06dcad80a82c03424d6579ec3fad804e16ff1', 'v2/packages/ui/src/cx.ts'],
  [
    '3b73f95d807982a9f365e9267c2c03b22b6dfbd374a21eb99f6ee9f1a8a7a8d5',
    'v2/packages/ui/src/format-legend.tsx',
  ],
  [
    'a7ab3ff1e170fe89ad6e2631d87c33dbe17d07b4f2a66276d26cb9ab8a86415e',
    'v2/packages/ui/src/notice.tsx',
  ],
  [
    '6a5d62d25bb868ea1a7a562d3e777695143aad96ff4c75e191568cd7e2a9b331',
    'v2/packages/ui/src/page-header.tsx',
  ],
  [
    '94de25bd72debe3d49004775150e73c9a41f19defa25224f09bd20b42308689e',
    'v2/packages/ui/src/places-meter.tsx',
  ],
  [
    '2340d415b0bf249df0cf6235f1fd39f917bc8e6bd49f96c9fe72e87e26d29d3f',
    'v2/packages/ui/src/primitives.test.tsx',
  ],
  [
    '4f64c33e45e62715fae1e80c31f2873605790b2d217262f314d74f4a1d371afe',
    'v2/packages/ui/src/status-pill.tsx',
  ],
  [
    'e69573347db85b4bacfb4c0b26b8f55d1eda2e717e8bcdb3b18cb91f694e83c8',
    'v2/apps/web/src/app/(connected)/layout.tsx',
  ],
  [
    'b064ff677d7803bc91493f9fa938b621d9a3b7c4217a8fcb3f93ee4520635c34',
    'v2/apps/web/src/app/(connected)/demo/page.tsx',
  ],
  [
    '3fcf24ae6e3268ab10b276b3a028663d58be6a2db3523a774d914a3a45139dd7',
    'v2/apps/web/src/app/(connected)/institute/page.tsx',
  ],
  [
    'a7aa958f91e9d43fef6dee76d0d381771365f389a4abc2fd84d26944e34566ed',
    'v2/apps/web/src/app/(connected)/institute/access/[id]/page.tsx',
  ],
  [
    '99cf59742948db82301e6ec150a8b6a1ef2ff217cb3146623fe2dca3a1de2dfa',
    'v2/apps/web/src/app/(connected)/learn/page.tsx',
  ],
  [
    'a65966a2a55538d957bed6ec208cd39dc7bfe93ba6ab1e72b6c980d5d941b7f4',
    'v2/apps/web/src/app/(connected)/learn/experiments/[id]/page.tsx',
  ],
  [
    'c5195944e5d055b2915d4a9b150d5b720fefde0163648f9f6e3da8c7e26a01c2',
    'v2/apps/web/src/demo/demo-bar.tsx',
  ],
  [
    '8e13d03e08a824c364c234d3edd2e0a2f3a1d3861f8e2874ce0439d53c314d56',
    'v2/apps/web/src/demo/demo-accounts-screen.tsx',
  ],
  [
    '2d6620c3febea213a51463633e6fc6adf9fd324e9e29c267ff0f1521c02efc77',
    'v2/apps/web/src/demo/demo-accounts-screen.test.tsx',
  ],
  [
    '02230d7656b9431847400b422ae08cf1d8bc3efe06a1e7ef3687f318b6f277b7',
    'v2/apps/web/src/features/copy.ts',
  ],
  [
    '5f8919ab2708314d33d6ddb043a21ec76aa66f5fbe26596c0131ab8059f6e56b',
    'v2/apps/web/src/features/institute/access-detail-screen.tsx',
  ],
  [
    '78350158c5d3e7c8ddcaf19789e16411341f42c04ce452a3bfaffab03dacd9a8',
    'v2/apps/web/src/features/institute/access-detail-screen.test.tsx',
  ],
  [
    '49e39ce6e3f15b411e70c97dc2b44f9c4a7706e03205556d012949ef97fbf4df',
    'v2/apps/web/src/features/institute/assign-student.tsx',
  ],
  [
    '4e58ba03fbb3028b468e458ac7f69ce22ac26b84a9b45c0c55d4c1e1d4cce1d7',
    'v2/apps/web/src/features/institute/campus-access-screen.tsx',
  ],
  [
    'd035b5d2cfb09eb632fea3c317e9938d8c746bf9d199720eace4dce32d75f420',
    'v2/apps/web/src/features/learn/learning-item-screen.tsx',
  ],
  [
    '9db357dc710621c8842a13d593e7fef1aa7015f3d2251b8d8ce819fcd3432cf8',
    'v2/apps/web/src/features/learn/my-learning-screen.tsx',
  ],
  [
    '65eee5fedc39ea41f5fc45fcf9b82f5f6f6f1f643bd67e9309da2a4a9b2dacc0',
    'v2/apps/web/src/features/learn/my-learning-screen.test.tsx',
  ],
  [
    'c1a9501681196f784e1fb62a448b89db3b142981cbdcfae4356c4eb215bd9df5',
    'v2/apps/web/src/features/shell/connected-frame.tsx',
  ],
  [
    'c009c5a86fa1b1cb01b78035c1f984817b8735ed66a98e4f39dd49a70703978a',
    'v2/apps/web/src/features/shell/connected-frame.test.tsx',
  ],
  [
    '5be9521ce1e86f78789c374cdad2ca80341210a3a858480e8b3b5ce98f2c8827',
    'v2/apps/web/src/features/shell/states.tsx',
  ],
  [
    '42a569aedfbddbc8249810c8e47a3623fcac91209ac8529a498b776fabff59f4',
    'v2/apps/web/e2e/connected-slice1.spec.ts',
  ],
];

/** Identifiers that existed only in the rejected Slice-1 UI (Appendix F WP-0.6 acceptance 6). */
const SLICE1_IDENTIFIER =
  /^(?:Card|cx|PlacesMeter|FormatLegend|FormatChip|AppShell)$|^places|^demo/i;

function filesUnder(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    if (entry === 'node_modules' || entry === 'dist' || entry.startsWith('.')) return [];
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

const files = filesUnder(PACKAGE);

describe('no rejected Slice-1 UI in @xr/ui', () => {
  it('records the 33 hashable DISCARD files', () => {
    expect(SLICE1_DISCARD_FILES).toHaveLength(33);
    expect(new Set(SLICE1_DISCARD_FILES.map(([sha]) => sha)).size).toBe(33);
  });

  it('no file in the package has the content hash of a Slice-1 DISCARD file', () => {
    const discarded = new Map(SLICE1_DISCARD_FILES.map(([sha, path]) => [sha, path]));
    const copies = files.flatMap((file) => {
      const sha = createHash('sha256').update(readFileSync(file)).digest('hex');
      const origin = discarded.get(sha);
      return origin ? [`${relative(PACKAGE, file)} = ${origin}`] : [];
    });
    expect(files.length).toBeGreaterThan(10);
    expect(copies).toEqual([]);
  });

  it('no source declares or uses a Slice-1-only identifier (Card, cx, places*, demo*, …)', () => {
    const found: string[] = [];
    // This file names the forbidden paths on purpose; every other source is checked.
    const sources = files.filter(
      (path) => /\.(?:ts|tsx|mts|mjs)$/.test(path) && path !== import.meta.filename,
    );
    for (const file of sources) {
      const source = ts.createSourceFile(
        file,
        readFileSync(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
      );
      const visit = (node: ts.Node): void => {
        if (ts.isIdentifier(node) && SLICE1_IDENTIFIER.test(node.text)) {
          found.push(`${relative(PACKAGE, file)}: ${node.text}`);
        }
        if (
          ts.isStringLiteralLike(node) &&
          /\b(?:demo|places)-|places-meter|format-legend/i.test(node.text)
        ) {
          found.push(`${relative(PACKAGE, file)}: '${node.text}'`);
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
    expect(found).toEqual([]);
  });
});

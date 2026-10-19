import { recordSuperseded, test } from './support';

/**
 * Phase-1 Package 1D: boards B7-01 (SA-01 Overview, its Phase-1 Requests group), B7-02 (SA-06
 * Institutions), B7-03 (SA-07 Institution detail) and B7-04 f0 (SA-07, the Super Admin's frame of
 * the pause effects) against the built screens of the test-hook build, each frame at its drawn
 * width × 900, as the Super Admin. The world is the walk after Flow C (opening 27 Oct 2026): its
 * seven institutions stand as the B7 boards draw them on 23 Oct 2026 (statuses, plans, Institute
 * Admins, Godavari's twelve students); the calm Overview is reached on the spine-start world with
 * the two requests under review answered through the CI-only `actAs`.
 *
 * Where a part holds the board's words it is compared at the component tolerance; where it
 * differs the comparison names its register entry — the Phase-1 scope of SA-01 (DEV-34, DEV-35),
 * the decision ids taken out of the copy (P1-14, DEV-36), the list's order (DEV-37), the Phase-1
 * attention rows (DEV-38), the canvas sample labels (DEV-39), the history as the record keeps it
 * (DEV-40), the sample world's background institutions (DEV-41), the canvas runtime's wrapper
 * round bound words in a button (DEV-42) and the unbuilt sidebar destinations (DEV-21) —
 * measured, pinned and reported for the owner's review, never approved here. Not compared: B7-01 f2 and B7-02 f5 "Loading" (the sample adapter answers at once and the
 * browser build has no delay seam; unit-tested in jsdom), B7-02 f1 (the same Godavari detail as
 * B7-03 f0) and B7-04 f1 … f3 (other roles' pages of Phases 2 and 4, reference frames).

 *
 * SUPERSEDED. SA-01, SA-06 and SA-07 are now the owner-approved V3 Super Admin screens
 * (design/v3-refined-b/roles/SA-v1; docs/v3/V3-COMPARISON-MAP.json `productScreens` SA-01, SA-06,
 * SA-07): every comparison of these four boards is retired by name and recorded as such, nothing
 * of them is captured, and the screens' behaviour is checked by the browser suites at the four
 * widths. The pins and the register (DEV-34 … DEV-42) keep the v46 measurements as history.
 */
test('B7-01 · SA-01 Overview — superseded by the V3 Super Admin screen (SA-v1)', async () => {
  await recordSuperseded(test.info(), 'b7-01-');
});

test('B7-02 · SA-06 Institutions — superseded by the V3 Super Admin screen (SA-v1)', async () => {
  await recordSuperseded(test.info(), 'b7-02-');
});

test('B7-03 · SA-07 Institution detail — superseded by the V3 Super Admin screen (SA-v1)', async () => {
  await recordSuperseded(test.info(), 'b7-03-');
});

test('B7-04 · the Super Admin’s pause (SA-07) — superseded by the V3 Super Admin screen (SA-v1)', async () => {
  await recordSuperseded(test.info(), 'b7-04-');
});

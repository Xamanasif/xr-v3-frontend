/**
 * The build phase of every designed screen id (B8-06 "Build order and the boards for each phase";
 * Appendix F §9). 147 ids are registered; 123 are designed; the 24 not designed by decision are
 * never built, linked or routed (Appendix A §2) and have no phase. A screen built in two phases
 * (SA-01 requests group in Phase 1, the full overview in Phase 6; CM-05 completed in Phase 6) is
 * listed at its first phase. Sign-in (XS-01/03/04) is Phase 1 per G-8.
 */
import type { BuildPhase } from './entry.js';

function ids(prefix: string, from: number, to: number): string[] {
  return Array.from(
    { length: to - from + 1 },
    (_, index) => `${prefix}-${String(from + index).padStart(2, '0')}`,
  );
}

const PHASE_SCREENS: Readonly<Record<BuildPhase, readonly string[]>> = {
  P0: ['XS-05', 'XS-06', 'XS-07', 'XS-08', 'PU-15'],
  P1: [
    ...ids('PU', 1, 10),
    'PU-12',
    'PU-13',
    'PU-14',
    'XS-01',
    'XS-03',
    'XS-04',
    'SA-01',
    'SA-02',
    'SA-03',
    'SA-06',
    'SA-07',
  ],
  P2: [...ids('IA', 1, 11), ...ids('IA', 13, 16), ...ids('ST', 1, 5), 'ST-19'],
  P3: [...ids('ST', 6, 10), ...ids('ST', 15, 18), ...ids('IA', 17, 20), 'SA-18', 'SA-19'],
  P4: [...ids('FA', 1, 12), ...ids('FA', 14, 22), ...ids('ST', 11, 14)],
  P5: [
    ...ids('VE', 1, 9),
    'VE-13',
    ...ids('RV', 1, 3),
    'RV-05',
    'RV-06',
    ...ids('CM', 1, 5),
    'CM-09',
  ],
  P6: ['CM-06', 'CM-07', 'CM-08', 'RV-04', ...ids('SA', 10, 17), ...ids('SA', 20, 22)],
};

/** Screens completed in a later phase too (B8-06 overlaps: SA-01 full overview, CM-05 detail). */
const COMPLETED_LATER: Readonly<Record<string, BuildPhase>> = { 'SA-01': 'P6', 'CM-05': 'P6' };

/** Screen id → the phase that first builds it. */
export const SCREEN_PHASE: ReadonlyMap<string, BuildPhase> = new Map(
  (Object.entries(PHASE_SCREENS) as [BuildPhase, readonly string[]][]).flatMap(([phase, list]) =>
    list.map((screen) => [screen, phase] as const),
  ),
);

/** Every phase that builds part of a screen. */
export function phasesOf(screen: string): readonly BuildPhase[] {
  const first = SCREEN_PHASE.get(screen);
  if (!first) throw new Error(`${screen} is not a designed screen.`);
  const later = COMPLETED_LATER[screen];
  return later ? [first, later] : [first];
}

/** The 24 register ids not designed by decision (Appendix A §2). */
export const NOT_DESIGNED_SCREENS = [
  'PU-11',
  'PU-16',
  'XS-02',
  'ST-20',
  'FA-13',
  'FA-23',
  'FA-24',
  'IA-12',
  'IA-21',
  'IA-22',
  'VE-10',
  'VE-11',
  'VE-12',
  'VE-14',
  'VE-15',
  'RV-07',
  'CM-10',
  'SA-04',
  'SA-05',
  'SA-08',
  'SA-09',
  'SA-23',
  'SA-24',
  'SA-25',
] as const;

const ORDER: readonly BuildPhase[] = ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6'];

/** The earliest build phase among a method's screens. */
export function firstPhaseOf(screens: readonly string[]): BuildPhase {
  const phases = screens.map((screen) => {
    const phase = SCREEN_PHASE.get(screen);
    if (!phase) throw new Error(`${screen} is not a designed screen.`);
    return ORDER.indexOf(phase);
  });
  return ORDER[Math.min(...phases)]!;
}

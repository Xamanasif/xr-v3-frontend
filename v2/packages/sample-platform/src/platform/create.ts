/**
 * `createSamplePlatform` — the typed mock adapter behind the draft ports (ADR-0002; Appendix F
 * §3.7, §4.2). One platform per browser tab: one world in memory (ADR-0004 option A), the in-tab
 * lock, the change bus and one session context. A page reload builds a new platform from the seed,
 * so the sample world resets — browser persistence (TE-6) is not authorised and must be reviewed
 * before the hosted manager walkthrough.
 *
 * The product reaches only what this module returns: the ports, the command-id views, the change
 * subscription and the world version. The clock control, the fault plan, the test seams and the
 * stand-ins live behind `@xr/sample-platform/testing` (ADR-0007), reached through `internalsOf`.
 */
import type { ProductPorts } from '@xr/contracts/draft';
import {
  DRAWN_WORKFLOW_ROUTING,
  type OverlapGrantPolicy,
  UNDECIDED_OVERLAP_POLICY,
} from '@xr/domain';

import {
  anchoredClock,
  controllableClock,
  fixedClock,
  type RealNow,
  type SampleClockControl,
} from '../clock/clock.js';
import { memoryPersistence } from '../persistence/memory.js';
import { seed } from '../seed/spine-start.js';
import { BrowserSession, type SessionStorageLike } from '../session/browser-session.js';
import type { ChangeListener } from '../store/bus.js';
import { WorldStore } from '../store/store.js';
import type { World } from '../world/types.js';
import {
  counterNonces,
  FaultPlan,
  PaymentStandIn,
  type PlatformCore,
  SessionContext,
} from './core.js';
import { buildPorts } from './ports.js';

export interface SamplePlatformOptions {
  /** The world to start from; the spine-start seed when omitted. */
  readonly world?: World;
  /**
   * The real clock, injected by the composition root (the package never reads one itself). With
   * it the sample clock runs from the world's anchor; without it the clock stays at the anchor.
   */
  readonly realNow?: RealNow;
  /** The browser's `sessionStorage`, for the selection and the request tickets; memory if omitted. */
  readonly browserStorage?: SessionStorageLike | null;
  /**
   * The name of this tab's world (ADR-0009): a request ticket held in `browserStorage` is good only
   * for the world that issued it. Required with `browserStorage` — under ADR-0004 option A every
   * page load is a new world, and the package draws no random value, so the composition root names
   * each one. Without storage the tickets live in memory with the world.
   */
  readonly worldInstance?: string;
  /**
   * TE-4 (owner authorisation of Package 1C, 14 Oct 2026): `confirm-on-start` — the web composition
   * root in sample mode — lets the sample payment provider stand-in confirm each started payment.
   * Default `provider-reports`: nothing is reported until the stand-in port is called.
   */
  readonly paymentStandIn?: 'confirm-on-start' | 'provider-reports';
}

export interface SamplePlatform {
  /** The ports of this tab's session (sign-in and sign-out change who acts; the world is shared). */
  readonly ports: ProductPorts;
  /** The same ports, with every command carrying this client-minted id (a repeat answers its first receipt). */
  withCommandId(commandId: string): ProductPorts;
  /** A fresh command id from the deterministic nonce source. */
  newCommandId(): string;
  /** Change events `{ worldVersion, changed }` after each committed command. */
  subscribe(listener: ChangeListener): () => void;
  worldVersion(): number;
  /** Always `memory` (ADR-0004 option A): a reload resets the world. */
  readonly persistence: 'memory';
}

/** What `./testing` reaches behind a platform (never product code). */
export interface PlatformInternals {
  readonly core: PlatformCore;
  readonly context: SessionContext;
  readonly clock: SampleClockControl;
  readonly browserStorage: SessionStorageLike | null;
}

const INTERNALS = new WeakMap<SamplePlatform, PlatformInternals>();

/** Testing only (exported from `./testing`, never from the package root). */
export function internalsOf(platform: SamplePlatform): PlatformInternals {
  const internals = INTERNALS.get(platform);
  if (!internals) throw new Error('Not a sample platform.');
  return internals;
}

/**
 * The highest command number a world already holds — its history and its kept receipts (a no-op
 * command keeps a receipt without a history entry) — so new command ids continue past every one.
 */
function commandsSoFar(world: World): number {
  let highest = world.history.length;
  const held = [
    ...world.history.map((entry) => entry.commandId),
    ...Object.keys(world.processedCommandIds),
  ];
  for (const id of held) {
    const number = /^cmd-(\d+)$/.exec(id)?.[1];
    if (number !== undefined) highest = Math.max(highest, Number(number));
  }
  return highest;
}

/** Builds a platform; `overlap` is injectable for tests only (no default exists, OD-B2-01). */
export function assemblePlatform(
  options: SamplePlatformOptions & { readonly overlap?: OverlapGrantPolicy },
): SamplePlatform {
  const base = options.world ?? seed();
  const realNow = options.realNow;
  const world: World =
    realNow && base.seededAtReal === null ? { ...base, seededAtReal: realNow() } : base;
  const clock = controllableClock(
    realNow && world.seededAtReal !== null
      ? anchoredClock(world.anchor, world.seededAtReal, realNow)
      : fixedClock(world.anchor),
  );
  const nonces = counterNonces(commandsSoFar(world));
  const browserStorage = options.browserStorage ?? null;
  if (browserStorage && !options.worldInstance) {
    throw new Error(
      'A browser storage needs the world instance its request tickets belong to (ADR-0009).',
    );
  }
  const instance = options.worldInstance ?? 'memory';
  const core: PlatformCore = {
    store: new WorldStore(world, memoryPersistence()),
    clock,
    nonces,
    faults: new FaultPlan(),
    imports: new Map(),
    overlap: options.overlap ?? UNDECIDED_OVERLAP_POLICY,
    routing: DRAWN_WORKFLOW_ROUTING,
    payments: new PaymentStandIn(options.paymentStandIn ?? 'provider-reports'),
    instance,
  };
  const context = new SessionContext(
    new BrowserSession(nonces.next('browser'), browserStorage, instance),
  );
  const platform: SamplePlatform = {
    ports: buildPorts(core, context, null),
    withCommandId: (commandId) => buildPorts(core, context, commandId),
    newCommandId: () => nonces.next('command'),
    subscribe: (listener) => core.store.subscribe(listener),
    worldVersion: () => core.store.world.worldVersion,
    persistence: core.store.persistence,
  };
  INTERNALS.set(platform, { core, context, clock, browserStorage });
  return platform;
}

export function createSamplePlatform(options: SamplePlatformOptions = {}): SamplePlatform {
  return assemblePlatform(options);
}

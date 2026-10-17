/**
 * `createSamplePlatform` — the typed mock adapter behind the draft ports (ADR-0002; Appendix F
 * §3.7, §4.2). One platform per browser tab: one world (in memory, ADR-0004 option A), the in-tab
 * lock, the change bus and one session context. A page reload builds a new platform: from the seed,
 * or — in a local prototype build whose composition root asks for it (TE-6, owner authorisation of
 * Phase 7, 17 Oct 2026) — from the versioned browser snapshot the tabs of the browser share.
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
import {
  openSnapshot,
  type SnapshotDriver,
  type SnapshotOptions,
} from '../persistence/snapshot.js';
import { withPreAuthorisedDevices } from '../seed/local-demonstration.js';
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
  type SampleWebRuntimeOptions,
  SessionContext,
} from './core.js';
import { buildPorts } from './ports.js';
import { type SampleWebRuntime, sampleWebRuntime } from './sample-web-runtime.js';

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
  /**
   * PC-60 (owner answer to P4-01, 16 Oct 2026): `answer-key-on-submit` — the web composition root
   * in a local prototype build — lets the `system:objective-marks` stand-in mark each submitted
   * attempt's choice questions by its pinned key. Default `supplied-only`: the DV-2 interim, marks
   * only from the test seam or fixtures.
   */
  readonly objectiveMarks?: 'answer-key-on-submit' | 'supplied-only';
  /**
   * PC-66 (owner answer to P5-01 / M-3, 16 Oct 2026): `drawn-default-on-resubmit` — the web
   * composition root in a local prototype build — lets the `system:workflow-routing` stand-in route
   * each resubmission right after it is resubmitted, by the only drawn route (back to the Academic
   * Reviewer). Default `seam-only`: the M-3 interim, routed only by the test seam.
   */
  readonly resubmissionRouting?: 'drawn-default-on-resubmit' | 'seam-only';
  /**
   * P3-03 (owner authorisation of Phase 7, 17 Oct 2026): `local-demonstration-seed` — the web
   * composition root in a local prototype build — starts the spine-start seed with one
   * pre-authorised sample device (`seed/local-demonstration.ts`), so the drawn device-transfer
   * chain can start through the product. Default `none`. A given `world` is never changed.
   */
  readonly preAuthorisedDevices?: 'local-demonstration-seed' | 'none';
  /**
   * TE-3 / T-12 (owner authorisation of Phase 7, 17 Oct 2026): the web composition root in a local
   * prototype build names its sample WEB activity; "Launch WEB" then opens it, and the activity's
   * reports reach the system runtime-report handler through `sampleWebRuntime`. Omitted: the
   * published link opens and nothing reports (the TE-3 interim).
   */
  readonly webRuntime?: SampleWebRuntimeOptions | null;
  /**
   * TE-6 (owner authorisation of Phase 7, 17 Oct 2026): the web composition root in a local
   * prototype build keeps the world as a versioned browser snapshot (`persistence/snapshot.ts`),
   * shared by the browser's tabs; sessions, receipts and request tickets are never saved. Ignored
   * with a given `world` (test-hook builds and tests start from their fixtures).
   */
  readonly snapshot?: SnapshotOptions | null;
}

/** TE-6: the browser snapshot of a local prototype build, for the composition root. */
export interface SampleSnapshotControls {
  /** How this page load started: from a save, afresh, or afresh after rejecting a save. */
  readonly opened: 'restored' | 'fresh' | 'rejected';
  readonly rejectedBecause: string | null;
  /** Adopts a newer world another tab saved (the browser's storage event); never commits. */
  sync(): 'current' | 'adopted' | 'foreign';
  /** Every answer may have changed: a newer world from another tab was adopted. */
  onAdopted(listener: () => void): () => void;
  /** The world was reset in another tab: this page load must start again. */
  onForeign(listener: () => void): () => void;
  /**
   * Reset: removes the save once no command is running, and this tab's selection and request
   * tickets; nothing is saved again by this page load (the composition root then reloads it).
   */
  clear(): Promise<void>;
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
  /** `memory` (ADR-0004 option A): a reload resets the world; `browser-snapshot` with TE-6. */
  readonly persistence: 'memory' | 'browser-snapshot';
  /** TE-6: the browser snapshot's controls when the composition root asked for one; else `null`. */
  readonly snapshot: SampleSnapshotControls | null;
  /** TE-3: the sample WEB activity's reports, when the composition root named one; else `null`. */
  readonly sampleWebRuntime: SampleWebRuntime | null;
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

function snapshotControls(
  core: PlatformCore,
  context: SessionContext,
  driver: SnapshotDriver,
): SampleSnapshotControls {
  // A world adopted from another tab holds its later commands: new command ids continue past them.
  core.store.onAdopted(() => core.nonces.continueCommandsPast(commandsSoFar(core.store.world)));
  return {
    opened: driver.opened,
    rejectedBecause: driver.rejectedBecause,
    sync: () => core.store.sync(),
    onAdopted: (listener) => core.store.onAdopted(listener),
    onForeign: (listener) => core.store.onForeign(listener),
    clear: () =>
      driver.exclusive(() => {
        driver.clear();
        context.browser.forgetAll();
      }),
  };
}

/** Builds a platform; `overlap` is injectable for tests only (no default exists, OD-B2-01). */
export function assemblePlatform(
  options: SamplePlatformOptions & { readonly overlap?: OverlapGrantPolicy },
): SamplePlatform {
  const start =
    options.world ??
    (options.preAuthorisedDevices === 'local-demonstration-seed'
      ? withPreAuthorisedDevices(seed())
      : seed());
  const opened = options.snapshot && !options.world ? openSnapshot(options.snapshot, start) : null;
  const base = opened ? opened.world : start;
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
    store: new WorldStore(world, opened ? opened.driver : memoryPersistence()),
    clock,
    nonces,
    faults: new FaultPlan(),
    imports: new Map(),
    drafts: new Map(),
    questionImports: new Map(),
    objectiveMarks: options.objectiveMarks ?? 'supplied-only',
    resubmissionRouting: options.resubmissionRouting ?? 'seam-only',
    overlap: options.overlap ?? UNDECIDED_OVERLAP_POLICY,
    routing: DRAWN_WORKFLOW_ROUTING,
    payments: new PaymentStandIn(options.paymentStandIn ?? 'provider-reports'),
    instance,
    webRuntime: options.webRuntime ?? null,
    launches: new Map(),
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
    snapshot: opened ? snapshotControls(core, context, opened.driver) : null,
    sampleWebRuntime: core.webRuntime ? sampleWebRuntime(core) : null,
  };
  INTERNALS.set(platform, { core, context, clock, browserStorage });
  return platform;
}

export function createSamplePlatform(options: SamplePlatformOptions = {}): SamplePlatform {
  return assemblePlatform(options);
}

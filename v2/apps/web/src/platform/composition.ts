/**
 * The composition root (Appendix F §3.2; Appendix D §1.2; ADR-0002 §5). It selects the service
 * adapter from the configured data source and is the ONLY product module that imports
 * `@xr/sample-platform` (its root export only — the `./testing` seams belong to the CI-only
 * test-hook bridge; import fences, Appendix F §3.8).
 *
 * It decides nothing: every policy, scope and state rule runs inside the adapter (`@xr/domain`
 * through `@xr/sample-platform`); the app passes inputs and renders answers.
 */
import type { DefaultOptions } from '@tanstack/react-query';
import { type AppEnvironment, type DataSource, runsSampleStandIns } from '@xr/config/env';
import type { ProductPorts } from '@xr/contracts/draft';
import {
  createSamplePlatform,
  type RealNow,
  type SamplePlatform,
  type SessionStorageLike,
  type SnapshotStorage,
  type World,
} from '@xr/sample-platform';

/** TE-6: the browser storage key of the local prototype build's world snapshot. */
export { SNAPSHOT_KEY as SAMPLE_WORLD_STORAGE_KEY } from '@xr/sample-platform';
/**
 * The key of the visitor's request tickets kept beside the snapshot (owner decision, 24 Oct 2026;
 * ADR-0009 amendment).
 */
export { KEPT_TICKETS_KEY as KEPT_REQUEST_TICKETS_KEY } from '@xr/sample-platform';

/** What the rest of the app reaches of an adapter: the 22 ports and the command identities. */
export interface PlatformAdapter {
  readonly ports: ProductPorts;
  /** The same ports, every command carrying this client-minted id (a repeat answers its first receipt). */
  withCommandId(commandId: string): ProductPorts;
  newCommandId(): string;
}

/** What later screens may ask of the platform as a whole (never a permission: ports answer those). */
export interface PlatformCapabilities {
  readonly dataSource: DataSource;
  /**
   * `memory-per-tab` (ADR-0004 option A): one world in this tab's memory, shared by every person
   * signed in here; a reload starts again from the seed. `browser-snapshot` (TE-6, owner
   * authorisation of Phase 7, 17 Oct 2026, a local prototype build only): the world is kept in this
   * browser and shared by its tabs; a reload keeps it, signed out — with the visitor's own request
   * tickets kept beside it (ADR-0009 amendment, 24 Oct 2026); "Reset demo data" starts again.
   */
  readonly persistence: 'memory-per-tab' | 'browser-snapshot';
}

/** DP-05 / DP-06: the simulated payment provider's page, as the sample platform serves it. */
export type {
  SamplePaymentAnswer,
  SamplePaymentProvider,
  SamplePaymentWaiting,
} from '@xr/sample-platform';

/** The sample world a platform starts from (test-hook builds and tests pass a fixture). */
export type SampleWorld = World;
/** The sample adapter behind the ports; handed only to the test-hook bridge and to tests. */
export type SamplePlatformHandle = SamplePlatform;

export interface ComposeOptions {
  readonly dataSource: DataSource;
  /**
   * The build's environment (`NEXT_PUBLIC_APP_ENV`; `development` when unset — a local build).
   * `development` and the isolated `prototype` profile run the sample stand-ins; staging and
   * production never do. A local build's TE-4 stand-in confirms each payment as it starts; in the
   * prototype profile the payer chooses the outcome on the simulated provider page (DP-05).
   */
  readonly appEnvironment?: AppEnvironment;
  /** The real clock; the sample clock then runs from the world's anchor. Omitted: fixed at the anchor. */
  readonly realNow?: RealNow;
  /** `sessionStorage` for the two board-drawn browser-session items only (ADR-0004 §2). */
  readonly browserStorage?: SessionStorageLike | null;
  /**
   * The name of this page load's world (ADR-0009): the request tickets kept in `browserStorage` are
   * good for the world that issued them only, so a reload's new world never honours an old one.
   * Required with `browserStorage`.
   */
  readonly worldInstance?: string;
  /** The starting world; the spine-start seed when omitted (product builds never pass one). */
  readonly world?: SampleWorld;
  /**
   * TE-6: the browser storage for the local prototype build's world snapshot (never with a given
   * `world`); `null` or omitted keeps the world in this tab's memory (ADR-0004 option A).
   */
  readonly worldStorage?: SnapshotStorage | null;
  /** TE-6: the name of a fresh start (drawn by the runtime); required with `worldStorage`. */
  readonly lineage?: string;
  /** TE-6: the browser's Web Locks, so that the tabs of one browser write one at a time. */
  readonly lock?: <T>(work: () => T) => Promise<T>;
  /** TE-3: the address of the local prototype build's sample WEB activity for one launch. */
  readonly webActivityHref?: (launch: string) => string;
}

export interface ComposedPlatform {
  readonly adapter: PlatformAdapter;
  readonly capabilities: PlatformCapabilities;
  readonly sample: SamplePlatformHandle;
}

/** A configured data source whose adapter does not exist. Never answered by another adapter. */
export class DataSourceUnavailableError extends Error {
  override readonly name = 'DataSourceUnavailableError';

  constructor(readonly dataSource: DataSource) {
    super(
      `NEXT_PUBLIC_XR_DATA_SOURCE=${dataSource}: no adapter is built for this data source yet (the HTTP adapter is Appendix F §3.2 platform/http/). The sample world is not used in its place.`,
    );
  }
}

export function composePlatform(options: ComposeOptions): ComposedPlatform {
  switch (options.dataSource) {
    case 'sample': {
      // DP-16: a local development build and the isolated prototype profile run the stand-ins.
      const local = runsSampleStandIns(options.appEnvironment);
      const environment = options.appEnvironment ?? 'development';
      const sample = createSamplePlatform({
        ...(options.world ? { world: options.world } : {}),
        ...(options.realNow ? { realNow: options.realNow } : {}),
        browserStorage: options.browserStorage ?? null,
        ...(options.worldInstance ? { worldInstance: options.worldInstance } : {}),
        // TE-4 (owner authorisation of Package 1C, 14 Oct 2026): in a local prototype build the
        // sample payment provider stand-in answers "Continue to payment"; any other build leaves a
        // started payment unconfirmed (no provider reports). No provider, amount or method exists;
        // "not confirmed" and "failed" come only from fixtures and CI test hooks.
        // DP-05 (owner, 5 Nov 2026): in the prototype profile nothing answers on its own — the payer
        // chooses the outcome on the simulated provider page (`paymentProviderPage`).
        paymentStandIn: environment === 'development' ? 'confirm-on-start' : 'provider-reports',
        // P4-01 (owner answer, Phase 4B, 16 Oct 2026; PC-60): in a local prototype build the
        // sample `system:objective-marks` stand-in marks each submitted attempt's single-choice
        // and true-or-false questions by the pinned version's key, so Faculty can confirm marks.
        // Any other build keeps the DV-2 interim (marks only from fixtures): Confirm marks then
        // answers "policy-open" ATT-07 for an attempt with choice questions.
        objectiveMarks: local ? 'answer-key-on-submit' : 'supplied-only',
        // P5-01 / M-3 (owner answer, Phase 5, 16 Oct 2026; PC-66): in a local prototype build the
        // sample `system:workflow-routing` stand-in routes each resubmission right after the
        // Vendor resubmits, by the only drawn route — back to the Academic Reviewer as revision n.
        // The Vendor still reads "Submitted"; nothing skips the reviewer. Any other build keeps the
        // M-3 interim: a resubmission waits until the test-only seam routes it.
        resubmissionRouting: local ? 'drawn-default-on-resubmit' : 'seam-only',
        // P3-03 (owner authorisation of Phase 7, 17 Oct 2026): a local prototype build starts with
        // one pre-authorised sample device (GIT-VR-03, Rahul Verma's institution e-mail), so the
        // drawn device-transfer chain can start through the product. No registration, provisioning
        // or device-management policy is decided; any other build supplies no device.
        preAuthorisedDevices: local ? 'local-demonstration-seed' : 'none',
        // TE-3 / T-12 (owner authorisation of Phase 7): in a local prototype build "Launch WEB"
        // opens the sample WEB activity — simulated, labelled as such — whose completion, once its
        // own conditions are met, is recorded by the system completion handler. Any other build
        // opens the published link and records nothing (the TE-3 interim).
        webRuntime:
          local && options.webActivityHref ? { activityHref: options.webActivityHref } : null,
        // DP-05 / DP-06 (owner decisions, 5 Nov 2026; B2B milestone I3): a build that runs the
        // stand-ins serves the simulated payment provider's page, where the payer chooses the
        // outcome of a waiting payment — staging and production never do.
        paymentProviderPage: local,
        // TE-6 (owner authorisation of Phase 7): a local prototype build keeps its world as a
        // versioned snapshot in this browser — never with a given world (test-hook builds).
        snapshot:
          local && options.worldStorage && options.lineage && !options.world
            ? {
                storage: options.worldStorage,
                lineage: options.lineage,
                ...(options.lock ? { lock: options.lock } : {}),
                // DP-18: a prototype build's save never opens a local build's (or the reverse).
                ...(environment === 'development' ? {} : { variant: environment }),
              }
            : null,
      });
      return {
        adapter: {
          ports: sample.ports,
          withCommandId: (commandId) => sample.withCommandId(commandId),
          newCommandId: () => sample.newCommandId(),
        },
        capabilities: {
          dataSource: 'sample',
          persistence:
            sample.persistence === 'browser-snapshot' ? 'browser-snapshot' : 'memory-per-tab',
        },
        sample,
      };
    }
    case 'api':
      throw new DataSourceUnavailableError('api');
    default: {
      const unknown: never = options.dataSource;
      throw new Error(`Unknown data source ${String(unknown)}.`);
    }
  }
}

/**
 * Query-cache defaults of a data source (Appendix F §4.6; Appendix D §1.5). The sample world
 * changes only through commands, and every command receipt invalidates exactly the queries that
 * depend on what it changed — so answers never go stale on a timer, the window regaining focus
 * or the network coming back. Nothing here talks to a network, so queries and commands never
 * wait for one; a failure shows at once as the drawn "failed, try again" state (no retries).
 */
export function queryDefaultsFor(dataSource: DataSource): DefaultOptions {
  if (dataSource !== 'sample') throw new DataSourceUnavailableError(dataSource);
  return {
    queries: {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: false,
      networkMode: 'always',
    },
    mutations: { retry: false, networkMode: 'always' },
  };
}

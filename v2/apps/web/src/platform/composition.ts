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
import type { AppEnvironment, DataSource } from '@xr/config/env';
import type { ProductPorts } from '@xr/contracts/draft';
import {
  createSamplePlatform,
  type RealNow,
  type SamplePlatform,
  type SessionStorageLike,
  type World,
} from '@xr/sample-platform';

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
   * ADR-0004 option A: one world in this tab's memory, shared by every person signed in here; a
   * reload starts again from the seed. Browser persistence (TE-6) is not authorised.
   */
  readonly persistence: 'memory-per-tab';
}

/** The sample world a platform starts from (test-hook builds and tests pass a fixture). */
export type SampleWorld = World;
/** The sample adapter behind the ports; handed only to the test-hook bridge and to tests. */
export type SamplePlatformHandle = SamplePlatform;

export interface ComposeOptions {
  readonly dataSource: DataSource;
  /**
   * The build's environment (`NEXT_PUBLIC_APP_ENV`; `development` when unset — a local build).
   * Only a local prototype build lets the TE-4 sample payment stand-in confirm a payment.
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
      const sample = createSamplePlatform({
        ...(options.world ? { world: options.world } : {}),
        ...(options.realNow ? { realNow: options.realNow } : {}),
        browserStorage: options.browserStorage ?? null,
        ...(options.worldInstance ? { worldInstance: options.worldInstance } : {}),
        // TE-4 (owner authorisation of Package 1C, 14 Oct 2026): in a local prototype build the
        // sample payment provider stand-in answers "Continue to payment"; any other build leaves a
        // started payment unconfirmed (no provider reports). No provider, amount or method exists;
        // "not confirmed" and "failed" come only from fixtures and CI test hooks.
        paymentStandIn:
          (options.appEnvironment ?? 'development') === 'development'
            ? 'confirm-on-start'
            : 'provider-reports',
        // P4-01 (owner answer, Phase 4B, 16 Oct 2026; PC-60): in a local prototype build the
        // sample `system:objective-marks` stand-in marks each submitted attempt's single-choice
        // and true-or-false questions by the pinned version's key, so Faculty can confirm marks.
        // Any other build keeps the DV-2 interim (marks only from fixtures): Confirm marks then
        // answers "policy-open" ATT-07 for an attempt with choice questions.
        objectiveMarks:
          (options.appEnvironment ?? 'development') === 'development'
            ? 'answer-key-on-submit'
            : 'supplied-only',
      });
      return {
        adapter: {
          ports: sample.ports,
          withCommandId: (commandId) => sample.withCommandId(commandId),
          newCommandId: () => sample.newCommandId(),
        },
        // `sample.persistence` is the memory driver (typed `'memory'`): one world per tab.
        capabilities: { dataSource: 'sample', persistence: 'memory-per-tab' },
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

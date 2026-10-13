/**
 * The seam between the platform runtime and the test hooks (ADR-0007 §2–3; Appendix F §3.2).
 * `@/platform/test-hooks` resolves, at build time, to the empty stub (`test-hooks.ts`, every
 * product build) or to the CI-only bridge (`test-hook-bridge.ts`, builds made with the test-hook
 * flag); both export `testHooks` with this type. Types only: nothing here reaches a bundle.
 */
import type { ComposedPlatform, SampleWorld } from './composition';
import type { PlatformRuntime } from './runtime';

/** The world and the session a test page starts with (the boot descriptor, read by the bridge). */
export interface PreparedBoot {
  readonly fixture: string;
  readonly world: SampleWorld;
  readonly personId: string | null;
}

export interface TestHooks {
  /** Before the platform is composed: the fixture world and session to start from, if any. */
  prepare(): Promise<PreparedBoot | null>;
  /** After it is composed, before the session is first read: start the session, expose the hooks. */
  attach(booted: {
    readonly composed: ComposedPlatform;
    readonly runtime: PlatformRuntime;
    readonly prepared: PreparedBoot | null;
  }): void;
  /** When the tab's boot has ended: ready, or failed with this error. */
  settle(outcome: { readonly ok: true } | { readonly ok: false; readonly error: unknown }): void;
}

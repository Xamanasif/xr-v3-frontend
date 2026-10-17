/**
 * TE-3 / T-12 (owner authorisation of Phase 7, 17 Oct 2026; a local prototype build only): how the
 * sample WEB activity, in its own tab, reports to the tab that launched it. "Launch WEB" opens the
 * activity with no handle on this page (no opener), so the two speak over a same-origin
 * `BroadcastChannel`: the activity asks for its launch ("hello"), then sends its reports; only the
 * tab holding that launch answers, and every report goes to the sample platform's runtime
 * (`SampleWebRuntime`), which records it through the system runtime-report handler — the activity
 * never writes a record itself. A message of any other shape is ignored.
 */
import type { RecordRef } from '@xr/domain';

export const SAMPLE_WEB_CHANNEL = 'xr.sample-web-activity';

export type SampleWebReport = 'opened' | 'saved' | 'completed';

/** From the activity tab. */
export type ActivityMessage =
  | { readonly type: 'hello'; readonly id: string; readonly launch: string }
  | {
      readonly type: 'report';
      readonly id: string;
      readonly launch: string;
      readonly kind: SampleWebReport;
    };

/** From the tab that launched it. */
export type LauncherMessage =
  | { readonly type: 'launch'; readonly id: string; readonly experimentName: string }
  | {
      readonly type: 'ack';
      readonly id: string;
      readonly outcome: 'recorded' | 'refused' | 'failed';
    };

/** The part of `BroadcastChannel` the relay needs (a fake in unit tests). */
export interface ChannelLike {
  postMessage(message: unknown): void;
  addEventListener(type: 'message', listener: (event: { readonly data: unknown }) => void): void;
  removeEventListener(type: 'message', listener: (event: { readonly data: unknown }) => void): void;
  close(): void;
}

/** What the relay needs of the sample platform (`SamplePlatform.sampleWebRuntime`). */
export interface SampleWebRuntimeLike {
  describe(launch: string): { readonly experimentName: string } | null;
  report(
    launch: string,
    kind: SampleWebReport,
  ): Promise<
    | { readonly ok: true; readonly changed: readonly RecordRef[] }
    | { readonly ok: false; readonly reason: 'unknown-launch' | 'not-finished' | 'refused' }
  >;
}

const REPORTS: ReadonlySet<string> = new Set(['opened', 'saved', 'completed']);
const bounded = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 200;

export function activityMessage(data: unknown): ActivityMessage | null {
  if (typeof data !== 'object' || data === null) return null;
  const message = data as Record<string, unknown>;
  if (!bounded(message.id) || !bounded(message.launch)) return null;
  if (message.type === 'hello') return { type: 'hello', id: message.id, launch: message.launch };
  if (message.type === 'report' && typeof message.kind === 'string' && REPORTS.has(message.kind)) {
    return {
      type: 'report',
      id: message.id,
      launch: message.launch,
      kind: message.kind as SampleWebReport,
    };
  }
  return null;
}

export function launcherMessage(data: unknown): LauncherMessage | null {
  if (typeof data !== 'object' || data === null) return null;
  const message = data as Record<string, unknown>;
  if (!bounded(message.id)) return null;
  if (message.type === 'launch' && bounded(message.experimentName)) {
    return { type: 'launch', id: message.id, experimentName: message.experimentName };
  }
  if (
    message.type === 'ack' &&
    (message.outcome === 'recorded' ||
      message.outcome === 'refused' ||
      message.outcome === 'failed')
  ) {
    return { type: 'ack', id: message.id, outcome: message.outcome };
  }
  return null;
}

/**
 * The launching tab's side: answers for the launches this tab's platform holds, records each
 * report through the platform, then refreshes exactly what the report changed. Returns a stop.
 */
export function relaySampleWebActivity(options: {
  readonly runtime: SampleWebRuntimeLike;
  readonly channel: ChannelLike;
  readonly invalidate: (changed: readonly RecordRef[]) => Promise<void>;
}): () => void {
  const { runtime, channel } = options;
  const listener = (event: { readonly data: unknown }) => {
    const message = activityMessage(event.data);
    if (!message) return;
    const held = runtime.describe(message.launch);
    // Another tab may hold this launch: only the launching tab answers.
    if (!held) return;
    if (message.type === 'hello') {
      channel.postMessage({
        type: 'launch',
        id: message.id,
        experimentName: held.experimentName,
      } satisfies LauncherMessage);
      return;
    }
    void runtime.report(message.launch, message.kind).then(
      async (answer) => {
        channel.postMessage({
          type: 'ack',
          id: message.id,
          outcome: answer.ok ? 'recorded' : 'refused',
        } satisfies LauncherMessage);
        if (answer.ok) await options.invalidate(answer.changed);
      },
      () =>
        channel.postMessage({
          type: 'ack',
          id: message.id,
          outcome: 'failed',
        } satisfies LauncherMessage),
    );
  };
  channel.addEventListener('message', listener);
  return () => {
    channel.removeEventListener('message', listener);
    channel.close();
  };
}

'use client';

/**
 * The local prototype build's two support pages, as the query layer offers them to features
 * (owner authorisation of Phase 7, 17 Oct 2026). Neither reads or writes a record directly.
 *
 * - `useSampleWorldReset` (TE-6): "Reset demo data" — the platform removes the saved world and this
 *   tab's selection and tickets once no command is running; the page then loads again, which starts
 *   the clean world, signed out, and the other tabs of the browser start again too.
 * - `useSampleWebActivity` (TE-3 / T-12): the sample WEB activity's line to the tab that launched
 *   it (`@/platform/sample-web-relay`). The activity only reports; the launching tab's platform
 *   decides and records, through the system runtime-report handler.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { usePlatform } from '@/platform/platform-provider';
import {
  type ChannelLike,
  type LauncherMessage,
  launcherMessage,
  SAMPLE_WEB_CHANNEL,
  type SampleWebReport,
} from '@/platform/sample-web-relay';

export type ResetAvailability = 'loading' | 'available' | 'not-kept';

export interface SampleWorldReset {
  readonly availability: ResetAvailability;
  /** Resets, then loads `after` as a new page; rejects (nothing changed) if it could not. */
  reset(after: string): Promise<void>;
}

export function useSampleWorldReset(): SampleWorldReset {
  const platform = usePlatform();
  const availability: ResetAvailability = !platform
    ? 'loading'
    : platform.resetSampleWorld
      ? 'available'
      : 'not-kept';
  const reset = useCallback(
    async (after: string) => {
      const run = platform?.resetSampleWorld;
      if (!run) throw new Error('Nothing is kept in this browser.');
      await run();
      // A new page: the platform boots afresh from the seed, signed out.
      window.location.replace(after);
    },
    [platform],
  );
  return { availability, reset };
}

export type ActivityConnection =
  | { readonly status: 'connecting' }
  | { readonly status: 'connected'; readonly experimentName: string }
  | { readonly status: 'not-connected' };

/** What a report came to: recorded by the platform, refused by it, or not confirmed in time. */
export type ActivityReportOutcome = 'recorded' | 'refused' | 'not-confirmed';

export interface SampleWebActivity {
  readonly connection: ActivityConnection;
  /** Asks the launching tab again (after it was reopened). */
  connect(): void;
  report(kind: SampleWebReport): Promise<ActivityReportOutcome>;
}

const ANSWER_WITHIN_MS = 2500;

/** A question waiting for the launching tab's answer, and its time limit. */
interface Waiting {
  readonly answer: (message: LauncherMessage) => void;
  readonly timer: ReturnType<typeof setTimeout>;
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

function openChannel(): ChannelLike | null {
  return typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(SAMPLE_WEB_CHANNEL);
}

export function useSampleWebActivity(
  launch: string | null,
  channelFactory: () => ChannelLike | null = openChannel,
): SampleWebActivity {
  const [connection, setConnection] = useState<ActivityConnection>(() =>
    launch ? { status: 'connecting' } : { status: 'not-connected' },
  );
  const channelRef = useRef<ChannelLike | null>(null);
  const waiting = useRef(new Map<string, Waiting>());
  // The factory is read once per connection, never compared: a minifier may inline a default
  // function into a fresh closure on every call, which would reconnect on every render.
  const factory = useRef(channelFactory);

  const ask = useCallback(
    <M extends LauncherMessage['type']>(
      message: Record<string, unknown> & { readonly id: string },
      expected: M,
    ): Promise<Extract<LauncherMessage, { type: M }> | null> =>
      new Promise((resolve) => {
        const channel = channelRef.current;
        if (!channel) {
          resolve(null);
          return;
        }
        const timer = setTimeout(() => {
          waiting.current.delete(message.id);
          resolve(null);
        }, ANSWER_WITHIN_MS);
        waiting.current.set(message.id, {
          timer,
          answer: (answer) => {
            if (answer.type !== expected) return;
            clearTimeout(timer);
            waiting.current.delete(message.id);
            resolve(answer as Extract<LauncherMessage, { type: M }>);
          },
        });
        channel.postMessage(message);
      }),
    [],
  );

  /** Asks for the launch; the answer (or its absence) sets the connection. */
  const hello = useCallback(() => {
    if (!launch) return;
    void ask({ type: 'hello', id: newId(), launch }, 'launch').then((answer) =>
      setConnection(
        answer
          ? { status: 'connected', experimentName: answer.experimentName }
          : { status: 'not-connected' },
      ),
    );
  }, [ask, launch]);

  const connect = useCallback(() => {
    if (!launch) return;
    setConnection({ status: 'connecting' });
    hello();
  }, [hello, launch]);

  useEffect(() => {
    const channel = factory.current();
    channelRef.current = channel;
    const pending = waiting.current;
    if (!channel) {
      // No channel in this browser: nothing can answer (the hello below resolves "not connected").
      hello();
      return undefined;
    }
    const listener = (event: { readonly data: unknown }) => {
      const message = launcherMessage(event.data);
      if (message) pending.get(message.id)?.answer(message);
    };
    channel.addEventListener('message', listener);
    hello();
    return () => {
      channel.removeEventListener('message', listener);
      channel.close();
      channelRef.current = null;
      // Questions of this connection are dropped unanswered: a time limit running out after the
      // page reconnected (React Strict Mode runs an effect twice) must not say "not connected".
      for (const question of pending.values()) clearTimeout(question.timer);
      pending.clear();
    };
  }, [hello]);

  const report = useCallback(
    async (kind: SampleWebReport): Promise<ActivityReportOutcome> => {
      if (!launch) return 'not-confirmed';
      const answer = await ask({ type: 'report', id: newId(), launch, kind }, 'ack');
      if (!answer || answer.outcome === 'failed') return 'not-confirmed';
      return answer.outcome;
    },
    [ask, launch],
  );

  return { connection, connect, report };
}

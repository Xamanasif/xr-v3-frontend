/**
 * TE-3 (owner authorisation of Phase 7): the launching tab's relay answers only for the launches
 * its platform holds, records each report through the platform and refreshes what it changed; any
 * other message — another tab's launch, a malformed or forged one — is ignored.
 */
import type { RecordRef } from '@xr/domain';
import { describe, expect, it, vi } from 'vitest';

import {
  activityMessage,
  type ChannelLike,
  launcherMessage,
  relaySampleWebActivity,
  type SampleWebRuntimeLike,
} from './sample-web-relay';

function fakeChannel() {
  const listeners = new Set<(event: { readonly data: unknown }) => void>();
  const posted: unknown[] = [];
  const channel: ChannelLike & { deliver(data: unknown): void; posted: unknown[] } = {
    posted,
    postMessage: (message) => void posted.push(message),
    addEventListener: (_type, listener) => void listeners.add(listener),
    removeEventListener: (_type, listener) => void listeners.delete(listener),
    close: vi.fn(),
    deliver: (data) => {
      for (const listener of listeners) listener({ data });
    },
  };
  return channel;
}

const CHANGED: readonly RecordRef[] = [{ kind: 'COMP', id: 'per-1|exp|web' }];

function runtimeHolding(launch: string, outcome: 'ok' | 'refused' | 'throws' = 'ok') {
  const report = vi.fn(async () => {
    if (outcome === 'throws') throw new Error('unavailable');
    return outcome === 'ok'
      ? ({ ok: true, changed: CHANGED } as const)
      : ({ ok: false, reason: 'refused' } as const);
  });
  const runtime: SampleWebRuntimeLike = {
    describe: (asked) =>
      asked === launch ? { experimentName: 'Shell-and-Tube Heat Exchanger' } : null,
    report,
  };
  return { runtime, report };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('the sample WEB activity relay (TE-3)', () => {
  it('answers hello for a held launch with the experiment name', () => {
    const channel = fakeChannel();
    const { runtime } = runtimeHolding('lch-000001.world-a');
    relaySampleWebActivity({ runtime, channel, invalidate: vi.fn() });
    channel.deliver({ type: 'hello', id: 'm1', launch: 'lch-000001.world-a' });
    expect(channel.posted).toEqual([
      { type: 'launch', id: 'm1', experimentName: 'Shell-and-Tube Heat Exchanger' },
    ]);
  });

  it('stays silent for another tab’s launch and for malformed messages', () => {
    const channel = fakeChannel();
    const { runtime, report } = runtimeHolding('lch-000001.world-a');
    relaySampleWebActivity({ runtime, channel, invalidate: vi.fn() });
    channel.deliver({ type: 'hello', id: 'm1', launch: 'lch-000001.world-b' });
    channel.deliver({ type: 'report', id: 'm2', launch: 'lch-000001.world-b', kind: 'completed' });
    channel.deliver({ type: 'report', id: 'm3', launch: 'lch-000001.world-a', kind: 'finished' });
    channel.deliver({ type: 'report', id: '', launch: 'lch-000001.world-a', kind: 'completed' });
    channel.deliver('completed');
    expect(channel.posted).toEqual([]);
    expect(report).not.toHaveBeenCalled();
  });

  it('records a report through the platform, acknowledges it and refreshes what it changed', async () => {
    const channel = fakeChannel();
    const invalidate = vi.fn(async () => undefined);
    const { runtime, report } = runtimeHolding('lch-000001.world-a');
    relaySampleWebActivity({ runtime, channel, invalidate });
    channel.deliver({ type: 'report', id: 'm1', launch: 'lch-000001.world-a', kind: 'completed' });
    await flush();
    expect(report).toHaveBeenCalledWith('lch-000001.world-a', 'completed');
    expect(channel.posted).toEqual([{ type: 'ack', id: 'm1', outcome: 'recorded' }]);
    expect(invalidate).toHaveBeenCalledWith(CHANGED);
  });

  it('acknowledges a refusal and a failure without refreshing anything', async () => {
    for (const [outcome, word] of [
      ['refused', 'refused'],
      ['throws', 'failed'],
    ] as const) {
      const channel = fakeChannel();
      const invalidate = vi.fn(async () => undefined);
      relaySampleWebActivity({
        runtime: runtimeHolding('lch-1.w', outcome).runtime,
        channel,
        invalidate,
      });
      channel.deliver({ type: 'report', id: 'm1', launch: 'lch-1.w', kind: 'saved' });
      await flush();
      expect(channel.posted).toEqual([{ type: 'ack', id: 'm1', outcome: word }]);
      expect(invalidate).not.toHaveBeenCalled();
    }
  });

  it('stops listening and closes the channel when stopped', () => {
    const channel = fakeChannel();
    const stop = relaySampleWebActivity({
      runtime: runtimeHolding('lch-1.w').runtime,
      channel,
      invalidate: vi.fn(),
    });
    stop();
    channel.deliver({ type: 'hello', id: 'm1', launch: 'lch-1.w' });
    expect(channel.posted).toEqual([]);
    expect(channel.close).toHaveBeenCalled();
  });

  it('reads only well-formed messages on both sides', () => {
    expect(activityMessage({ type: 'hello', id: 'a', launch: 'b' })).toEqual({
      type: 'hello',
      id: 'a',
      launch: 'b',
    });
    expect(activityMessage({ type: 'report', id: 'a', launch: 'b', kind: 'opened' })).toMatchObject(
      { kind: 'opened' },
    );
    expect(
      activityMessage({ type: 'report', id: 'a', launch: 'x'.repeat(201), kind: 'opened' }),
    ).toBeNull();
    expect(launcherMessage({ type: 'ack', id: 'a', outcome: 'recorded' })).toEqual({
      type: 'ack',
      id: 'a',
      outcome: 'recorded',
    });
    expect(launcherMessage({ type: 'ack', id: 'a', outcome: 'maybe' })).toBeNull();
    expect(launcherMessage({ type: 'launch', id: 'a', experimentName: '' })).toBeNull();
    expect(launcherMessage(null)).toBeNull();
  });
});

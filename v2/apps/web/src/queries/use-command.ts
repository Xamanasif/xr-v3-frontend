'use client';

/**
 * Commands through the service ports (Appendix F §4.5–§4.6; Appendix D §1.5; ADR-0008).
 *
 * `useCommand(ports => ports.accessRequests.approveRequest)` wraps one typed port method:
 *
 * - **Refusals are values.** `run` resolves with the port's `Result`: success, or a refusal
 *   (`not-permitted`, `invalid-state`, `stale-version`, `validation-failed`, `policy-open` …)
 *   that drives the drawn field errors, error summary and read-only states.
 * - **Only `unavailable` is thrown** (`ServiceUnavailableError`): the drawn "failed, try again".
 * - **No optimistic writes.** Nothing in the cache changes until the receipt arrives; then
 *   exactly the queries depending on the receipt's `changed` kinds are invalidated (one
 *   function, no per-command lists), and `busy` stays true until they have refetched.
 * - **Sent once.** Each run carries a client-minted command id (a repeat of the id answers the
 *   first receipt). While a run is busy, the same call again — the same command id, or the same
 *   input — answers that run instead of sending again; a different call is its own command.
 * - **Per identity.** `busy`, `answer` and `unavailable` describe the last run sent by the person
 *   signed in now; after a sign-in or sign-out they start empty (the `run` promise still settles).
 * - **The input goes to the port untouched**, `expectedRev` included, so stale revisions are
 *   refused by the adapter. The caller never passes a role, a permission or a gate: the port
 *   resolves the actor from the session and decides.
 */
import { useMutation } from '@tanstack/react-query';
import type { ProductPorts, Result, ServiceError } from '@xr/contracts/draft';
import { useCallback, useEffect, useRef } from 'react';

import { usePlatform, useSession } from '@/platform/platform-provider';

import { ServiceUnavailableError, throwIfUnavailable } from './unavailable';

/** A port command method: at most one argument, a `Result` answer (ADR-0008 decision 1). */
export type PortMethod =
  | ((input: never) => Promise<Result<unknown, ServiceError>>)
  | (() => Promise<Result<unknown, ServiceError>>);

export type CommandInput<F extends PortMethod> = F extends () => unknown
  ? void
  : F extends (input: infer I) => unknown
    ? I
    : never;
export type CommandAnswer<F extends PortMethod> = Awaited<ReturnType<F>>;

export interface RunOptions {
  /** Re-send a command under the id it was first sent with (its first receipt is answered). */
  readonly commandId?: string;
}

export interface CommandHandle<F extends PortMethod> {
  /** Sends the command once; resolves with its `Result`; rejects only with `ServiceUnavailableError`. */
  run(input: CommandInput<F>, options?: RunOptions): Promise<CommandAnswer<F>>;
  /** True from sending until the receipt's dependent queries have refetched. */
  readonly busy: boolean;
  /** The last settled answer (success or refusal); `undefined` before the first, or after `reset`. */
  readonly answer: CommandAnswer<F> | undefined;
  /** The last run failed for now (`unavailable`). */
  readonly unavailable: boolean;
  reset(): void;
}

interface Variables {
  readonly input: unknown;
  readonly commandId: string;
  /** The identity the command was sent as; its state is shown to that identity only. */
  readonly sessionKey: string;
}

/** The same call: an explicit command id, or the input's value (object keys in a fixed order). */
function callKey(sessionKey: string, input: unknown, commandId: string | undefined): string {
  if (commandId !== undefined) return `${sessionKey}|id:${commandId}`;
  const value = JSON.stringify(input, (_key, item: unknown) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : item,
  );
  return `${sessionKey}|input:${value ?? 'undefined'}`;
}

export function useCommand<F extends PortMethod>(
  select: (ports: ProductPorts) => F,
): CommandHandle<F> {
  const runtime = usePlatform();
  const session = useSession();
  const sessionKey = session.status === 'unknown' ? null : session.sessionKey;
  const inflight = useRef(new Map<string, Promise<CommandAnswer<F>>>());

  const mutation = useMutation<CommandAnswer<F>, ServiceUnavailableError, Variables>({
    mutationFn: async ({ input, commandId }): Promise<CommandAnswer<F>> => {
      if (!runtime) throw new Error('The platform is not ready.');
      // The typed method of the command-id ports; its own signature typed `input` at `run`.
      const method = select(runtime.withCommandId(commandId)) as unknown as (
        input: unknown,
      ) => Promise<CommandAnswer<F>>;
      const answer: CommandAnswer<F> = await method(input);
      return throwIfUnavailable(answer);
    },
    onSuccess: async (answer) => {
      const receipt: Result<unknown, ServiceError> = answer;
      if (receipt.ok && runtime) await runtime.invalidate(receipt.changed);
    },
  });
  const { mutateAsync, reset } = mutation;

  // A new identity starts with no command state: the previous person's runs are not theirs.
  useEffect(() => {
    inflight.current.clear();
    reset();
  }, [sessionKey, reset]);

  const run = useCallback(
    (input: CommandInput<F>, options?: RunOptions): Promise<CommandAnswer<F>> => {
      if (!runtime || !sessionKey) return Promise.reject(new Error('The platform is not ready.'));
      const key = callKey(sessionKey, input, options?.commandId);
      const pending = inflight.current.get(key);
      if (pending) return pending;
      const commandId = options?.commandId ?? runtime.newCommandId();
      const sent = mutateAsync({ input, commandId, sessionKey }).finally(() => {
        if (inflight.current.get(key) === sent) inflight.current.delete(key);
      });
      inflight.current.set(key, sent);
      return sent;
    },
    [runtime, sessionKey, mutateAsync],
  );

  const mine = sessionKey !== null && mutation.variables?.sessionKey === sessionKey;
  return {
    run,
    busy: mine && mutation.isPending,
    answer: mine ? mutation.data : undefined,
    unavailable: mine && mutation.error instanceof ServiceUnavailableError,
    reset,
  };
}

'use client';

/**
 * The visitor's selection (Appendix C §3.3 `SelectionService`; B1-05 panel, B1-04 "In your
 * selection" marker): request preparation held in the tab's browser session, never a world record
 * and never a checkout — no price, no purchase, no access (SEL-02, SEL-04, SEL-06; ADR-0004 §2).
 *
 * The port is synchronous, so its answers bypass the query cache: `useSelection` reads the
 * session's selection with `useSyncExternalStore` and re-reads it after each command this tab
 * sends — and after a request is sent, which empties it ("Your selection was sent with this
 * request, so it is empty again", B1-07; `selectionSent`). The port decides every rule (only
 * published formats, at least one format, not twice, Undo once); the screens render its answers.
 */
import type {
  AddToSelectionInput,
  ProductPorts,
  SetSelectionFormatsInput,
} from '@xr/contracts/draft';
import type { ExperimentId, Selection } from '@xr/domain';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { usePlatform } from '@/platform/platform-provider';

type SelectionPort = ProductPorts['selection'];

/** Nothing chosen: before the tab's platform is ready, and on the server (no rule, a shape). */
const EMPTY_SELECTION: Selection = Object.freeze({
  items: [],
  lastRemoved: null,
  lastRemovedAt: null,
});

/** Every mounted reader of this tab's selection; told after each command. */
const readers = new Set<() => void>();

function subscribe(reader: () => void): () => void {
  readers.add(reader);
  return () => readers.delete(reader);
}

function tellReaders(): void {
  for (const reader of readers) reader();
}

/**
 * A request was sent: the port has emptied the selection with it (B1-07; `submitPublicRequest`),
 * so every reader — the header's "Selection (n)", PU-07 — reads it again.
 */
export function selectionSent(): void {
  tellReaders();
}

const emptySelection = (): Selection => EMPTY_SELECTION;

export interface SelectionHandle {
  /** The selection on show (empty until the tab's platform is ready, and on the server). */
  readonly selection: Selection;
  /** False until the tab's platform is ready: commands are not offered before. */
  readonly ready: boolean;
  add(input: AddToSelectionInput): ReturnType<SelectionPort['add']>;
  setFormats(input: SetSelectionFormatsInput): ReturnType<SelectionPort['setFormats']>;
  remove(experimentId: ExperimentId): ReturnType<SelectionPort['remove']>;
  /** B1-06 "Undo": the last removal, back where it was. */
  undoRemove(): ReturnType<SelectionPort['undoRemove']>;
}

export function useSelection(): SelectionHandle {
  const runtime = usePlatform();
  const port = runtime?.ports.selection ?? null;
  const read = useCallback(() => (port ? port.get() : EMPTY_SELECTION), [port]);
  const selection = useSyncExternalStore(subscribe, read, emptySelection);
  const send = useCallback(
    <A>(command: (selectionPort: SelectionPort) => A): A => {
      if (!port) throw new Error('The platform is not ready.');
      const answer = command(port);
      tellReaders();
      return answer;
    },
    [port],
  );
  return useMemo(
    () => ({
      selection,
      ready: port !== null,
      add: (input) => send((selectionPort) => selectionPort.add(input)),
      setFormats: (input) => send((selectionPort) => selectionPort.setFormats(input)),
      remove: (experimentId) => send((selectionPort) => selectionPort.remove(experimentId)),
      undoRemove: () => send((selectionPort) => selectionPort.undoRemove()),
    }),
    [selection, port, send],
  );
}

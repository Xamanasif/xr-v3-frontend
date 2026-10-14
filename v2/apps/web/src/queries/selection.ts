'use client';

/**
 * The visitor's selection (Appendix C §3.3 `SelectionService`; B1-05 panel, B1-04 "In your
 * selection" marker): request preparation held in the tab's browser session, never a world record
 * and never a checkout — no price, no purchase, no access (SEL-02, SEL-04, SEL-06; ADR-0004 §2).
 *
 * The port is synchronous, so its answers bypass the query cache: `useSelection` reads the
 * session's selection with `useSyncExternalStore` and re-reads it after each command this tab
 * sends. The port decides every rule (only published formats, at least one format, not twice);
 * the screens render its answers. PU-07 Selection and the request (Package 1C) are not built here.
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
const EMPTY_SELECTION: Selection = Object.freeze({ items: [], lastRemoved: null });

/** Every mounted reader of this tab's selection; told after each command. */
const readers = new Set<() => void>();

function subscribe(reader: () => void): () => void {
  readers.add(reader);
  return () => readers.delete(reader);
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
      for (const reader of readers) reader();
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
    }),
    [selection, port, send],
  );
}

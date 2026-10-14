/**
 * The public Selection (Appendix C M04; matrix SEL-01, SEL-03): experiments with chosen published
 * formats, built in the visitor's own browser session. It is request preparation, never a
 * checkout — no prices, no purchase, no access (SEL-02, SEL-04, SEL-06).
 */
import { inDisplayOrder, type Technology } from '../technology.js';
import {
  conflict,
  type Decision,
  invalidInput,
  invalidState,
  ok,
  refused,
} from '../kernel/decision.js';
import type { ExperimentId } from '../kernel/ids.js';
import type { IsoInstant } from '../kernel/time.js';
import type { Selection } from './model.js';

export interface AddToSelectionInput {
  readonly selection: Selection;
  readonly experimentId: ExperimentId;
  /** The experiment's published formats. */
  readonly published: readonly Technology[];
  readonly formats: readonly Technology[];
  readonly now: IsoInstant;
}

/** "Choose at least one format to add." (PU-06); only published formats (B1-05, B1-06). */
export function addToSelection(input: AddToSelectionInput): Decision<Selection> {
  if (input.formats.length === 0) return invalidInput({ field: 'formats', rule: 'choose-one' });
  if (input.formats.some((format) => !input.published.includes(format))) {
    return refused('format-not-published');
  }
  if (input.selection.items.some((item) => item.experimentId === input.experimentId)) {
    return conflict('already-exists');
  }
  return ok({
    items: [
      ...input.selection.items,
      {
        experimentId: input.experimentId,
        formats: inDisplayOrder(input.formats),
        addedAt: input.now,
      },
    ],
    lastRemoved: input.selection.lastRemoved,
    lastRemovedAt: input.selection.lastRemovedAt,
  });
}

/**
 * Change an item's formats. "At least one format stays chosen. To take this experiment out, use
 * Remove." (B1-06). A format change ends the single-level undo, as B1-06 draws it (`undo: null`).
 */
export function setSelectionFormats(
  selection: Selection,
  experimentId: ExperimentId,
  published: readonly Technology[],
  formats: readonly Technology[],
): Decision<Selection> {
  const item = selection.items.find((candidate) => candidate.experimentId === experimentId);
  if (!item) return invalidState('not-in-selection');
  if (formats.length === 0) return refused('last-format-locked');
  if (formats.some((format) => !published.includes(format))) return refused('format-not-published');
  return ok({
    items: selection.items.map((candidate) =>
      candidate === item ? { ...candidate, formats: inDisplayOrder(formats) } : candidate,
    ),
    lastRemoved: null,
    lastRemovedAt: null,
  });
}

export function removeFromSelection(
  selection: Selection,
  experimentId: ExperimentId,
): Decision<Selection> {
  const index = selection.items.findIndex((candidate) => candidate.experimentId === experimentId);
  if (index < 0) return invalidState('not-in-selection');
  return ok({
    items: selection.items.filter((_candidate, position) => position !== index),
    lastRemoved: selection.items[index]!,
    lastRemovedAt: index,
  });
}

/**
 * Single-level undo, as drawn (B1-06): the item goes back to the position it held. A removal kept
 * without its position (a selection stored before the position was recorded) goes back last.
 */
export function undoRemove(selection: Selection): Decision<Selection> {
  const item = selection.lastRemoved;
  if (!item) return invalidState('nothing-to-undo');
  if (selection.items.some((candidate) => candidate.experimentId === item.experimentId)) {
    // Added again since it was removed: putting it back would hold it twice.
    return invalidState('nothing-to-undo');
  }
  const at = Math.min(selection.lastRemovedAt ?? selection.items.length, selection.items.length);
  return ok({
    items: [...selection.items.slice(0, at), item, ...selection.items.slice(at)],
    lastRemoved: null,
    lastRemovedAt: null,
  });
}

/** "2 experiments · 3 formats"; the format list is the union in display order (B1-06 `fmtList`). */
export function selectionSummary(selection: Selection): {
  readonly experiments: number;
  readonly formats: number;
  readonly formatList: readonly Technology[];
} {
  return {
    experiments: selection.items.length,
    formats: selection.items.reduce((sum, item) => sum + item.formats.length, 0),
    formatList: inDisplayOrder(selection.items.flatMap((item) => item.formats)),
  };
}

/**
 * `SelectionService` for the `api` data source (ADR-0014). The selection is the visitor's browser
 * session, never a platform record (B1-06): it lives in this tab — `sessionStorage` when usable,
 * under the same key the typed mock uses — and the API is never asked about it.
 *
 * Every step is the mock's (`@xr/sample-platform` `selectionPort`), from the same shared pieces:
 * the input schemas and drawn messages (`parseInput`, `fromDomainRefusal`), the policy
 * (`@xr/domain` `may`, as the public visitor) and the decisions (`addToSelection`, …). The one
 * difference is where "is it published, in which formats" comes from: the catalogue answers this
 * tab has read (`PublishedFormats`). Adding or changing formats happens on pages that have just
 * read the experiment, so its formats are known; an experiment no answer has named is not found.
 */
import {
  addToSelectionInput,
  failure,
  fromDomainRefusal,
  ledgerRows,
  type MethodId,
  parseInput,
  type SelectionService,
  selection as selectionSchema,
  type ServiceError,
  setSelectionFormatsInput,
  success,
} from '@xr/contracts/draft';
import {
  addToSelection,
  type Decision,
  EMPTY_SELECTION,
  type ExperimentId,
  type IsoInstant,
  may,
  removeFromSelection,
  type Selection,
  setSelectionFormats,
  undoRemove,
  unsafeBrand,
} from '@xr/domain';

import type { PublishedFormats } from './catalogue';

/** The mock's key (`@xr/sample-platform` browser session), so a visitor's basket reads the same. */
export const SELECTION_STORAGE_KEY = 'xr.selection.v1';

export interface SelectionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const FORMS = new Map(ledgerRows().map((row) => [row.id, row.form]));

function formOf(method: MethodId) {
  return FORMS.get(method) ?? null;
}

function stored(storage: SelectionStorage | null): Selection {
  try {
    const text = storage?.getItem(SELECTION_STORAGE_KEY) ?? null;
    if (text === null) return EMPTY_SELECTION;
    const parsed = selectionSchema.safeParse(JSON.parse(text));
    return parsed.success ? (parsed.data as Selection) : EMPTY_SELECTION;
  } catch {
    return EMPTY_SELECTION;
  }
}

export function browserSelectionPort(options: {
  readonly storage: SelectionStorage | null;
  readonly published: PublishedFormats;
  /** The instant an item is added (the real clock). */
  readonly now: () => IsoInstant;
}): SelectionService {
  let current = stored(options.storage);

  const keep = (next: Selection): Selection => {
    current = next;
    try {
      options.storage?.setItem(SELECTION_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage full or refused: the selection still holds for this page
    }
    return next;
  };

  /** The public visitor may edit their own selection (`@xr/domain` policy, `selection.edit`). */
  const refusalToEdit = (): ServiceError | null => {
    const verdict = may(
      { actor: { kind: 'public', requestTokens: [] }, now: options.now() },
      'selection.edit',
      { kind: 'selection', selection: current },
    );
    return verdict.allowed ? null : (verdict.refusal as ServiceError);
  };

  function settle(method: MethodId, decision: Decision<Selection>, input: unknown) {
    if (decision.ok) return success(keep(decision.value));
    return failure(fromDomainRefusal(method, decision.refusal, input, formOf(method)));
  }

  // The port's unions are narrower than `ServiceError`; each branch returns only what the mock's
  // pipeline returns for the same method (the contract suite checks the declared kinds).
  return {
    get: () => current,

    add(input) {
      const method: MethodId = 'SelectionService.add';
      const refused = refusalToEdit();
      if (refused) return failure(refused) as never;
      const parsed = parseInput(addToSelectionInput, input, formOf(method));
      if (!parsed.ok) return failure(parsed.error) as never;
      const published = options.published.of(parsed.value.experimentId);
      if (!published) return failure({ kind: 'not-found' });
      return settle(
        method,
        addToSelection({
          selection: current,
          experimentId: unsafeBrand<ExperimentId>(parsed.value.experimentId),
          published,
          formats: parsed.value.formats,
          now: options.now(),
        }),
        input,
      ) as never;
    },

    setFormats(input) {
      const method: MethodId = 'SelectionService.setFormats';
      const refused = refusalToEdit();
      if (refused) return failure(refused) as never;
      const parsed = parseInput(setSelectionFormatsInput, input, formOf(method));
      if (!parsed.ok) return failure(parsed.error) as never;
      const published = options.published.of(parsed.value.experimentId);
      if (!published) return failure({ kind: 'not-found' });
      return settle(
        method,
        setSelectionFormats(
          current,
          unsafeBrand<ExperimentId>(parsed.value.experimentId),
          published,
          parsed.value.formats,
        ),
        input,
      ) as never;
    },

    remove(experimentId) {
      const method: MethodId = 'SelectionService.remove';
      const refused = refusalToEdit();
      if (refused) return failure(refused) as never;
      const id = unsafeBrand<ExperimentId>(String(experimentId));
      const held = current.items.some((item) => item.experimentId === id);
      if (!held && !options.published.of(id)) return failure({ kind: 'not-found' });
      return settle(method, removeFromSelection(current, id), experimentId) as never;
    },

    undoRemove() {
      const method: MethodId = 'SelectionService.undoRemove';
      const refused = refusalToEdit();
      if (refused) return failure(refused) as never;
      return settle(method, undoRemove(current), null) as never;
    },
  };
}

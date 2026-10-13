/**
 * §3.2 CatalogueService (PU-01 … PU-06, PU-15) and §3.3 SelectionService (PU-06, PU-07).
 *
 * The catalogue reads publication only (`publicCatalogue`, Appendix D §5.3) — never access,
 * entitlement, activity or completion (BC9). An unpublished or unknown experiment is not found.
 * The selection is the visitor's browser session, never a world record (B1-06): its commands
 * write nothing to the world.
 */
import {
  addToSelectionInput,
  type CatalogueService,
  catalogueQuery,
  type SelectionService,
  setSelectionFormatsInput,
} from '@xr/contracts/draft';
import {
  addToSelection,
  type Experiment,
  type ExperimentId,
  publicCatalogue,
  publishedFormats,
  removeFromSelection,
  setSelectionFormats,
  undoRemove,
} from '@xr/domain';

import type { Call } from '../platform/core.js';
import { read, refuse, sessionScoped } from '../pipeline/runner.js';
import { values } from '../world/records.js';
import { deferred } from './deferred.js';
import { catalogueEntryOf, publicPageOf } from './views.js';

function matches(text: string | undefined, ...fields: readonly (string | null)[]): boolean {
  const wanted = text?.trim().toLowerCase() ?? '';
  return wanted === '' || fields.some((field) => field?.toLowerCase().includes(wanted));
}

export function cataloguePort(call: Call): CatalogueService {
  return {
    listAreas: deferred('CatalogueService.listAreas'),
    getArea: deferred('CatalogueService.getArea'),
    getCourse: deferred('CatalogueService.getCourse'),

    searchCatalogue: (query) =>
      read(call, 'CatalogueService.searchCatalogue', (op) => {
        const accepted = op.parse(catalogueQuery, query);
        const records = op.records;
        const entries = publicCatalogue(values(records.experiments), values(records.courses))
          .filter((entry) => !accepted.areaId || entry.areaId === accepted.areaId)
          .filter((entry) => !accepted.format || entry.formats.includes(accepted.format))
          .filter((entry) =>
            matches(
              accepted.text,
              entry.name,
              entry.summary,
              entry.platformCode,
              records.courses[entry.courseId]?.name ?? null,
            ),
          )
          .map((entry) => catalogueEntryOf(records, records.experiments[entry.experimentId]!));
        if (accepted.sort === 'title-a-z') {
          entries.sort((a, b) => a.name.localeCompare(b.name, 'en'));
        } else if (accepted.sort === 'course-code') {
          entries.sort((a, b) =>
            (a.platformCode ?? '￿').localeCompare(b.platformCode ?? '￿', 'en'),
          );
        }
        return { total: entries.length, entries };
      }),

    getExperiment: (experimentId) =>
      read(call, 'CatalogueService.getExperiment', (op) => {
        const experiment = op.records.experiments[op.idText(experimentId)] ?? null;
        op.see(op.visitor(), { kind: 'published-experiment', experiment });
        return publicPageOf(op.records, op.found(experiment));
      }),
  };
}

/** The experiment a selection item names, if it is still published. */
function published(call: Call, id: string): Experiment | undefined {
  return call.core.store.world.records.experiments[id];
}

export function selectionPort(call: Call): SelectionService {
  const browser = call.context.browser;
  return {
    get: () => browser.selection,

    add: (input) =>
      sessionScoped(call, 'SelectionService.add', (op) => {
        op.allow(op.visitor(), 'selection.edit', {
          kind: 'selection',
          selection: browser.selection,
        });
        const accepted = op.parse(addToSelectionInput, input);
        const experiment = op.found(published(call, accepted.experimentId));
        const next = op.decide(
          addToSelection({
            selection: browser.selection,
            experimentId: experiment.id,
            published: publishedFormats(experiment),
            formats: accepted.formats,
            now: op.now,
          }),
          input,
        );
        return {
          value: next,
          decision: 'addToSelection',
          actor: { kind: 'requester', name: '' },
          after: () => {
            browser.selection = next;
          },
        };
      }),

    setFormats: (input) =>
      sessionScoped(call, 'SelectionService.setFormats', (op) => {
        op.allow(op.visitor(), 'selection.edit', {
          kind: 'selection',
          selection: browser.selection,
        });
        const accepted = op.parse(setSelectionFormatsInput, input);
        const experiment = op.found(published(call, accepted.experimentId));
        const next = op.decide(
          setSelectionFormats(
            browser.selection,
            experiment.id,
            publishedFormats(experiment),
            accepted.formats,
          ),
          input,
        );
        return {
          value: next,
          decision: 'setSelectionFormats',
          actor: { kind: 'requester', name: '' },
          after: () => {
            browser.selection = next;
          },
        };
      }),

    remove: (experimentId) =>
      sessionScoped(call, 'SelectionService.remove', (op) => {
        op.allow(op.visitor(), 'selection.edit', {
          kind: 'selection',
          selection: browser.selection,
        });
        const id = op.idText(experimentId) as ExperimentId;
        const held = browser.selection.items.some((item) => item.experimentId === id);
        if (!held && !published(call, id)) refuse({ kind: 'not-found' });
        const next = op.decide(removeFromSelection(browser.selection, id), experimentId);
        return {
          value: next,
          decision: 'removeFromSelection',
          actor: { kind: 'requester', name: '' },
          after: () => {
            browser.selection = next;
          },
        };
      }),

    undoRemove: () =>
      sessionScoped(call, 'SelectionService.undoRemove', (op) => {
        op.allow(op.visitor(), 'selection.edit', {
          kind: 'selection',
          selection: browser.selection,
        });
        const next = op.decide(undoRemove(browser.selection), null);
        return {
          value: next,
          decision: 'undoRemove',
          actor: { kind: 'requester', name: '' },
          after: () => {
            browser.selection = next;
          },
        };
      }),
  };
}

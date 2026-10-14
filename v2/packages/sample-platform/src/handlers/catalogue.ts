/**
 * §3.2 CatalogueService (PU-01 … PU-06, PU-15) and §3.3 SelectionService (PU-06, PU-07).
 *
 * The catalogue reads publication only (`publicCatalogue`, Appendix D §5.3) — never access,
 * entitlement, activity or completion (BC9). An unpublished or unknown experiment is not found.
 * The selection is the visitor's browser session, never a world record (B1-06): its commands
 * write nothing to the world.
 *
 * Phase-1 Package 1B builds the structure reads (ledger `PACKAGE_DELIVERIES`): `listAreas`,
 * `getArea` and `getCourse`. Their counts, courses and formats derive from the published
 * catalogue only (B1-02 "Counts come from published experiments"; B1-03 "Each area groups the
 * courses that have published experiments"). An area with no published experiment is hidden —
 * from the list and as a page (CRS-09; B1-01 "Hidden from the landing explorer and from All areas
 * until something is published", OD-B7-13 Confirm — OPEN), and its courses are hidden with it
 * (their pages would lead back to an area that is not found). A course of a shown area is a page
 * whenever it exists: B1-03 draws "Course · nothing published yet — shown only if the course is
 * reachable at all".
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
  type EngineeringArea,
  type Experiment,
  type ExperimentId,
  publicAreas,
  publicCatalogue,
  type PublicCatalogueEntry,
  publishedFormats,
  removeFromSelection,
  setSelectionFormats,
  undoRemove,
} from '@xr/domain';

import type { Call } from '../platform/core.js';
import { read, refuse, sessionScoped } from '../pipeline/runner.js';
import { values } from '../world/records.js';
import type { WorldRecords } from '../world/types.js';
import { areaCardOf, catalogueEntryOf, courseCardOf, publicPageOf } from './views.js';

function matches(text: string | undefined, ...fields: readonly (string | null)[]): boolean {
  const wanted = text?.trim().toLowerCase() ?? '';
  return wanted === '' || fields.some((field) => field?.toLowerCase().includes(wanted));
}

/** The published catalogue, in the world's (default) order. */
function catalogueOf(records: WorldRecords): readonly PublicCatalogueEntry[] {
  return publicCatalogue(values(records.experiments), values(records.courses));
}

/** The area when it is on the public surface (it holds a published experiment), else nothing. */
function shownArea(
  area: EngineeringArea | undefined,
  catalogue: readonly PublicCatalogueEntry[],
): EngineeringArea | undefined {
  return area && publicAreas([area], catalogue).length > 0 ? area : undefined;
}

export function cataloguePort(call: Call): CatalogueService {
  return {
    listAreas: () =>
      read(call, 'CatalogueService.listAreas', (op) => {
        const catalogue = catalogueOf(op.records);
        return publicAreas(values(op.records.areas), catalogue).map((area) =>
          areaCardOf(area, catalogue),
        );
      }),

    getArea: (areaId) =>
      read(call, 'CatalogueService.getArea', (op) => {
        const records = op.records;
        const catalogue = catalogueOf(records);
        const area = op.found(shownArea(records.areas[op.idText(areaId)], catalogue));
        const published = new Set(
          catalogue.filter((entry) => entry.areaId === area.id).map((entry) => entry.courseId),
        );
        return {
          area: areaCardOf(area, catalogue),
          courses: values(records.courses)
            .filter((course) => published.has(course.id))
            .map((course) => courseCardOf(records, course)),
        };
      }),

    getCourse: (courseId) =>
      read(call, 'CatalogueService.getCourse', (op) => {
        const records = op.records;
        const course = op.found(records.courses[op.idText(courseId)]);
        const catalogue = catalogueOf(records);
        if (!records.areas[course.areaId])
          throw new Error(`${course.id} names an area that does not exist.`);
        const area = op.found(shownArea(records.areas[course.areaId], catalogue));
        return {
          course: courseCardOf(records, course),
          area: { id: area.id, name: area.name },
          experiments: catalogue
            .filter((entry) => entry.courseId === course.id)
            .map((entry) => catalogueEntryOf(records, records.experiments[entry.experimentId]!)),
        };
      }),

    searchCatalogue: (query) =>
      read(call, 'CatalogueService.searchCatalogue', (op) => {
        const accepted = op.parse(catalogueQuery, query);
        const records = op.records;
        // P1-22 interim (PC-32): the landing's featured experiments are a seeded list.
        const featured = op.seeded.featuredExperiments;
        const entries = catalogueOf(records)
          .filter((entry) => !accepted.featured || featured.includes(entry.experimentId))
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
          // B1-04's live order: the course code, then the title within one course (Package 1B).
          entries.sort(
            (a, b) =>
              (a.platformCode ?? '￿').localeCompare(b.platformCode ?? '￿', 'en') ||
              a.name.localeCompare(b.name, 'en'),
          );
        } else if (accepted.featured) {
          entries.sort(
            (a, b) => featured.indexOf(a.experimentId) - featured.indexOf(b.experimentId),
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

/**
 * The method ledger against its sources (Appendix F WP-0.10 acceptance; ADR-0008 decision 1):
 * the 22 ports and 183 methods of Appendix C §3, the six stand-in ports of §3.18, the Phase-0
 * implementation set of Appendix F §4.1, the build phase of every calling screen (B8-06), and the
 * error rules every entry follows. The entry ↔ signature checks run at compile time (`entry.ts`).
 */
import { POLICY_RULES } from '@xr/domain';
import { describe, expect, it } from 'vitest';
import type { z } from 'zod';

import { appendix, appendixCInterfaces, boardText } from '../../test-support/sources.js';
import { ids as idSchemas } from '../kernel/primitives.js';
import { PORT_KEYS, PORT_NAMES } from '../ports/index.js';
import { STANDIN_LEDGER } from '../standins/index.js';
import {
  type LedgerRow,
  METHOD_LEDGER,
  NOT_DESIGNED_SCREENS,
  SCREEN_PHASE,
  firstPhaseOf,
  ledgerRows,
  phasesOf,
} from './index.js';

const rows = ledgerRows();
/** Every `ids.in.*` schema is the same bounded-string schema. */
const ID: unknown = idSchemas.in.request;
const appendixC = appendixCInterfaces();
const ids = (list: readonly LedgerRow[]) => list.map((row) => row.id);

/** The Appendix F §4.1 table: each port's Phase-0 mock methods. */
function phaseZeroMethods(): ReadonlyMap<string, ReadonlySet<string>> {
  const text = appendix('F');
  const section = text.slice(text.indexOf('### 4.1 Ports'), text.indexOf('### 4.2'));
  const found = new Map<string, ReadonlySet<string>>();
  for (const line of section.split('\n')) {
    const cells = line.split('|').map((cell) => cell.trim());
    const port = cells[2];
    if (!port || !/^[A-Z]\w+Service$/.test(port)) continue;
    const said = cells[4]!;
    const all = Object.keys(METHOD_LEDGER[port as keyof typeof METHOD_LEDGER]);
    const named = (part: string) => [...part.matchAll(/`(\w+)`/g)].map((match) => match[1]!);
    if (said.startsWith('all except')) {
      const except = named(said);
      found.set(port, new Set(all.filter((method) => !except.includes(method))));
    } else if (said.startsWith('all')) {
      found.set(port, new Set(all));
    } else {
      const head = said.split(' · ')[0]!;
      // "every command" includes a command's preview → apply step (Appendix C rule 3).
      const commands = /every command/.test(head)
        ? rows.filter((row) => row.port === port && row.kind !== 'read').map((row) => row.method)
        : [];
      found.set(port, new Set([...named(head), ...commands]));
    }
  }
  return found;
}

/** Whether a schema carries a record revision (`expectedRev`, `expectedPlanRev`) at any depth. */
function carriesRevision(schema: z.ZodType): boolean {
  const def = (schema as unknown as { _zod: { def: Record<string, unknown> } })._zod.def;
  switch (def['type']) {
    case 'object':
      return Object.entries(def['shape'] as Record<string, z.ZodType>).some(
        ([key, value]) => /^expected\w*Rev$/.test(key) || carriesRevision(value),
      );
    case 'array':
      return carriesRevision(def['element'] as z.ZodType);
    case 'union':
      return (def['options'] as z.ZodType[]).some((option) => carriesRevision(option));
    case 'pipe':
      return carriesRevision(def['in'] as z.ZodType);
    case 'optional':
    case 'nullable':
    case 'readonly':
      return carriesRevision(def['innerType'] as z.ZodType);
    default:
      return false;
  }
}

/** Whether a schema carries a caller-given record id (`ids.in.*`) at any depth. */
function carriesId(schema: z.ZodType): boolean {
  if (schema === ID) return true;
  const def = (schema as unknown as { _zod: { def: Record<string, unknown> } })._zod.def;
  switch (def['type']) {
    case 'object':
      return Object.values(def['shape'] as Record<string, z.ZodType>).some(carriesId);
    case 'array':
      return carriesId(def['element'] as z.ZodType);
    case 'union':
      return (def['options'] as z.ZodType[]).some(carriesId);
    case 'pipe':
      return carriesId(def['in'] as z.ZodType);
    case 'optional':
    case 'nullable':
    case 'readonly':
      return carriesId(def['innerType'] as z.ZodType);
    default:
      return false;
  }
}

describe('the 22 product ports and 183 methods of Appendix C §3', () => {
  it('counts 22 ports and 183 methods', () => {
    expect(PORT_NAMES).toHaveLength(22);
    expect(rows).toHaveLength(183);
    expect(new Set(ids(rows)).size).toBe(183);
  });

  it('lists every port’s methods as Appendix C does, in its order', () => {
    const documented = [...appendixC.keys()].filter((name) => name.endsWith('Service'));
    expect(documented).toEqual([...PORT_NAMES]);
    for (const port of PORT_NAMES) {
      expect(Object.keys(METHOD_LEDGER[port]), port).toEqual(appendixC.get(port));
    }
  });

  it('gives each port its own key in ProductPorts', () => {
    expect(Object.keys(PORT_KEYS)).toEqual([...PORT_NAMES]);
    expect(new Set(Object.values(PORT_KEYS)).size).toBe(22);
  });
});

describe('the six stand-in ports (Appendix C §3.18)', () => {
  it('has the eight documented methods, test- and seed-only', () => {
    const documented = [...appendixC].filter(
      ([name]) => !name.endsWith('Service') && /Port$|Policy$|Oracle$/.test(name),
    );
    expect(new Set(STANDIN_LEDGER.map((entry) => entry.port)).size).toBe(6);
    expect(STANDIN_LEDGER).toHaveLength(8);
    expect(STANDIN_LEDGER.map((entry) => `${entry.port}.${entry.method}`)).toEqual(
      documented.flatMap(([port, methods]) => methods.map((method) => `${port}.${method}`)),
    );
    expect(new Set(STANDIN_LEDGER.map((entry) => entry.mock))).toEqual(new Set(['WP-0.11']));
  });

  it('keeps the stand-ins out of the product ports', () => {
    const portNames: readonly string[] = PORT_NAMES;
    for (const entry of STANDIN_LEDGER) expect(portNames).not.toContain(entry.port);
  });
});

describe('implementation phases (Appendix F §4.1; ADR-0008 decision 1)', () => {
  const phaseZero = phaseZeroMethods();

  it('reads a Phase-0 row for every port', () => {
    expect([...phaseZero.keys()].sort()).toEqual([...PORT_NAMES].sort());
  });

  it('marks exactly the Appendix F §4.1 Phase-0 methods WP-0.11', () => {
    for (const port of PORT_NAMES) {
      const marked = rows
        .filter((row) => row.port === port && row.mock === 'WP-0.11')
        .map((row) => row.method);
      expect(new Set(marked), port).toEqual(phaseZero.get(port));
    }
  });

  it('splits 138 Phase-0 methods from 45 that land with their screens', () => {
    expect(rows.filter((row) => row.mock === 'WP-0.11')).toHaveLength(138);
    const later = rows.filter((row) => row.mock !== 'WP-0.11');
    expect(later).toHaveLength(45);
    expect(
      Object.fromEntries(
        ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'].map((phase) => [
          phase,
          later.filter((row) => row.mock === phase).length,
        ]),
      ),
    ).toEqual({ P1: 4, P2: 9, P3: 1, P4: 14, P5: 7, P6: 10 });
  });

  it('implements every command in Phase 0 except CSV import, assisted drafting and CSV export', () => {
    expect(ids(rows.filter((row) => row.kind === 'command' && row.mock !== 'WP-0.11'))).toEqual([
      'QuestionBankService.requestDrafts',
      'QuestionBankService.addDraftToBank',
      'QuestionBankService.discardDraft',
      'QuestionBankService.commitQuestionImport',
    ]);
  });

  it('lands a later-phase method with a screen that calls it', () => {
    for (const row of rows.filter((candidate) => candidate.mock !== 'WP-0.11')) {
      const phases = row.screens.flatMap((screen) => phasesOf(screen));
      expect(phases, row.id).toContain(row.mock);
    }
  });
});

describe('screens (B8-06 build order; Appendix A §2)', () => {
  it('registers 123 designed screens in seven phases and 24 not designed', () => {
    expect(SCREEN_PHASE.size).toBe(123);
    expect(NOT_DESIGNED_SCREENS).toHaveLength(24);
    for (const screen of NOT_DESIGNED_SCREENS) expect(SCREEN_PHASE.has(screen)).toBe(false);
  });

  it('names only designed screens as callers', () => {
    for (const row of rows) {
      expect(row.screens.length, row.id).toBeGreaterThan(0);
      for (const screen of row.screens)
        expect(SCREEN_PHASE.has(screen), `${row.id} → ${screen}`).toBe(true);
    }
  });

  it('builds SA-01 and CM-05 in two phases, every other screen in one', () => {
    expect(phasesOf('SA-01')).toEqual(['P1', 'P6']);
    expect(phasesOf('CM-05')).toEqual(['P5', 'P6']);
    expect(phasesOf('XS-01')).toEqual(['P1']);
    expect(() => phasesOf('VE-10')).toThrow(/not a designed screen/);
    expect(firstPhaseOf(['SA-02', 'SA-01'])).toBe('P1');
  });
});

describe('the error rules of every entry (ADR-0008 decisions 2–3; provisional register PC-16)', () => {
  const PUBLIC = [
    'SessionService.signIn',
    'SessionService.getSession',
    'CatalogueService.listAreas',
    'CatalogueService.getArea',
    'CatalogueService.getCourse',
    'CatalogueService.searchCatalogue',
    'CatalogueService.getExperiment',
    'SelectionService.get',
    'SelectionService.add',
    'SelectionService.setFormats',
    'SelectionService.remove',
    'SelectionService.undoRemove',
    'AccessRequestService.submitPublicRequest',
    'AccessRequestService.getRequestStatus',
  ];

  it('answers not-signed-in from every method that needs a session — all but the public surface', () => {
    expect(ids(rows.filter((row) => !row.errors.includes('not-signed-in')))).toEqual(PUBLIC);
  });

  it('answers unavailable from every asynchronous method — all but the browser-session selection', () => {
    expect(ids(rows.filter((row) => !row.errors.includes('unavailable')))).toEqual(
      PUBLIC.filter((id) => id.startsWith('SelectionService.')),
    );
  });

  it('declares refusal codes exactly when it can refuse, and decisions exactly when it can be policy-open', () => {
    for (const row of rows) {
      expect(row.refusals.length > 0, row.id).toBe(row.errors.includes('refused'));
      expect(row.open.length > 0, row.id).toBe(row.errors.includes('policy-open'));
    }
  });

  it('reports validation only for a method with input, and draws a summary title only where it validates', () => {
    for (const row of rows) {
      if (row.errors.includes('validation-failed')) expect(row.input, row.id).not.toBeNull();
      if (row.form !== null) expect(row.errors, row.id).toContain('validation-failed');
    }
  });

  it('answers not-found where it looks up a record by an id it is given (provisional register PC-16)', () => {
    /** An unknown filter id lists nothing. */
    const FILTERS = [
      'CatalogueService.searchCatalogue',
      'PeopleService.listStudents',
      'StudentAccessService.listGrants',
      'MarkingService.listQueue',
      'ProductionService.getReviewQueue',
      'OperationsService.getUsage',
    ];
    /** A Faculty member's experiment that is not one they teach — unknown included — is out of scope. */
    const TEACHING_SCOPE = [
      'QuestionBankService.listQuestions',
      'QuestionBankService.listDrafts',
      'TeachingService.listStudents',
      'TeachingService.exportStudentsCsv',
    ];
    /** A Student's experiment goes through the open gate: never given (unknown included) is `not-given` (board 08). */
    const OPEN_GATE = [
      'StudentAccessService.getExperimentHub',
      'LearningService.listResources',
      'LearningService.getSimulationChooser',
      'LearningService.launchWebFormat',
      'FeedbackService.sendFeedback',
    ];
    /** The gate as a value: a format the Student cannot give feedback on reads `not-eligible`. */
    const GATE_AS_VALUE = ['FeedbackService.getFeedbackState'];
    const exempt = new Set([...FILTERS, ...TEACHING_SCOPE, ...OPEN_GATE, ...GATE_AS_VALUE]);
    const lookups = rows.filter((row) => row.input !== null && carriesId(row.input));
    expect(
      ids(lookups.filter((row) => !row.errors.includes('not-found') && !exempt.has(row.id))),
    ).toEqual([]);
    for (const id of exempt) expect(ids(lookups), id).toContain(id);
    for (const row of rows.filter((candidate) => OPEN_GATE.includes(candidate.id))) {
      expect(row.refusals, row.id).toContain('not-given');
    }
  });

  it('answers stale-version exactly when the input carries a record revision (Appendix C rule 2)', () => {
    for (const row of rows) {
      const carries = row.input !== null && carriesRevision(row.input);
      expect(row.errors.includes('stale-version'), row.id).toBe(carries);
    }
  });

  it('never lists a kind, code, decision, check or screen twice', () => {
    for (const row of rows) {
      for (const list of [row.errors, row.refusals, row.open, row.policy, row.screens]) {
        expect(new Set(list).size, row.id).toBe(list.length);
      }
    }
  });

  it('runs a domain check on every method, naming a matrix action or a read', () => {
    const actions = new Set<string>(POLICY_RULES.map((rule) => rule.action));
    for (const row of rows) {
      expect(row.policy.length, row.id).toBeGreaterThan(0);
      for (const check of row.policy) {
        if (!check.startsWith('read:'))
          expect(actions.has(check), `${row.id} → ${check}`).toBe(true);
      }
    }
  });

  it('names a drawn failure frame only on a method that can be unavailable, on its board', () => {
    const framed = rows.filter((row) => row.failureFrame !== null);
    expect(framed.length).toBeGreaterThan(0);
    for (const row of framed) {
      expect(row.errors, row.id).toContain('unavailable');
      const [board] = row.failureFrame!.split(' ');
      const page = boardText(board!).toLowerCase();
      const quoted = /"([^"]+)"/.exec(row.failureFrame!)?.[1];
      if (quoted) expect(page, `${row.id}: ${quoted}`).toContain(quoted.toLowerCase());
    }
  });

  it('marks the writes that answer like commands but write nothing as previews (Appendix C rule 3)', () => {
    expect(ids(rows.filter((row) => row.kind === 'preview'))).toEqual([
      'PeopleService.previewStudentImport',
      'StudentAccessService.previewGiveAccess',
      'QuestionBankService.previewQuestionImport',
      'ProductionService.continueStep',
      'AcademicStructureService.previewMoveCourse',
    ]);
  });
});

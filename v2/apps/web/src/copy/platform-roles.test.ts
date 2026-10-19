/**
 * The words of SA-16 Platform roles and SA-17 Role holder are the owner-approved Super Admin
 * export's (design/v3-refined-b/roles/SA-v1, `sa-views-d.js` `V.roles`, `V.holder`,
 * `SA.DLG.register`, `SA.DLG.restoreScope`): each drawn phrase is found verbatim in its source, the
 * composed ones from the view's own pieces. The undrawn forms are provisional entries of the
 * state-copy register, each with its decision and no decision id in its words.
 */
import { describe, expect, it } from 'vitest';

import { saExport } from '@/test-support/boards';

import {
  ALL_EXPERIMENTS,
  ASSIGN_PANEL,
  assignedFlash,
  assignedWords,
  courseScopeWords,
  effectLine,
  experimentOption,
  HOLDER_PAGE,
  holderRowLabel,
  holdersCaption,
  noScopeLine,
  noScopeTitle,
  reasonByNote,
  reasonLabel,
  REGISTER_DIALOG,
  registeredAs,
  registeredFlash,
  registeredNote,
  registeredOn,
  RESTORE_DIALOG,
  restoredFlash,
  restoreLabel,
  restoreQuestion,
  ROLE_TAB_WORDS,
  ROLE_WORDS,
  ROLES_PAGE,
  scopeAssignedWhat,
  scopeRestoredWhat,
  scopeWithdrawnWhat,
  withdrawLabel,
  withdrawnCountWords,
  withdrawnFlash,
  withdrawnWords,
} from './platform-roles';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_PLATFORM_ROLES } from './state-copy-platform-roles';

/** The export's view source, with its HTML escapes read (`&amp;`). */
const VIEWS = saExport('sa-views-d.js').replace(/&amp;/g, '&');
const CORE = saExport('sa-core.js');
const DATA = saExport('sa-data.js');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('SA-16 Platform roles (`V.roles`, `SA.DLG.register`)', () => {
  const drawn = strings([ROLES_PAGE, ROLE_WORDS, ROLE_TAB_WORDS, REGISTER_DIALOG]).filter(
    (phrase) => !['vendor', 'academic_reviewer', 'content_manager'].includes(phrase),
  );

  it.each(drawn)('“%s” is in the export', (phrase) => {
    expect(`${VIEWS}\n${CORE}`).toContain(phrase);
  });

  it('the composed words are the export’s, from its view’s own pieces', () => {
    // [the product's words for a sample, the expected words, the view's piece].
    const composed: readonly (readonly [string, string, string])[] = [
      [
        noScopeTitle(['Dr K. Iyer']),
        'Dr K. Iyer has no scope yet',
        "none[0].name + ' has no scope yet'",
      ],
      [
        noScopeTitle(['Dr K. Iyer', 'Neha Kapoor']),
        '2 role holders have no scope yet',
        "none.length + ' role holders have no scope yet'",
      ],
      [withdrawnCountWords(1), '1 scope withdrawn', "SA.plural(wd.length, 'scope') + ' withdrawn<"],
      [
        holderRowLabel('Dr K. Iyer', 'academic_reviewer', false),
        'Dr K. Iyer, Academic Reviewer, no scope. Open',
        "x.name + ', ' + T[2] + (act.length ? '' : ', no scope') + '. Open'",
      ],
      [
        holderRowLabel('Anil Shetty', 'vendor', true),
        'Anil Shetty, Vendor. Open',
        "x.name + ', ' + T[2] + (act.length ? '' : ', no scope') + '. Open'",
      ],
      [
        holdersCaption('Reviewers'),
        'Reviewers and what they can act on',
        "esc(T[1]) + ' and what they can act on</caption>",
      ],
      [
        `${registeredFlash('Neha Kapoor', 'vendor').title} ${registeredFlash('Neha Kapoor', 'vendor').line}`,
        'Neha Kapoor is registered as Vendor. Assign what they can act on. Nothing was sent to them.',
        "n + ' is registered as ' + T[2] + '.', 'Assign what they can act on. Nothing was sent to them.'",
      ],
    ];
    for (const [product, expected, piece] of composed) {
      expect(product).toBe(expected);
      expect(VIEWS).toContain(piece);
    }
    expect(withdrawnCountWords(2)).toBe('2 scopes withdrawn');
  });

  it('the role’s line with nothing in scope is the export’s `EFF[tab][1]`', () => {
    for (const role of ['vendor', 'academic_reviewer', 'content_manager'] as const) {
      expect(VIEWS).toContain(`'${noScopeLine(role)}'`);
    }
  });
});

describe('SA-17 Role holder (`V.holder`, `SA.DLG.restoreScope`)', () => {
  // The busy words of Assign scope are the product's (the export draws no busy state).
  const drawn = strings([
    HOLDER_PAGE,
    { ...ASSIGN_PANEL, busy: undefined },
    RESTORE_DIALOG,
    ALL_EXPERIMENTS,
  ]);

  it.each(drawn)('“%s” is in the export', (phrase) => {
    expect(`${VIEWS}\n${CORE}`).toContain(phrase);
  });

  it('the “Can act on” line per role is the export’s `EFF`, with and without scope', () => {
    const lines = [
      effectLine('academic_reviewer', []),
      effectLine('academic_reviewer', ['ME ZG523', 'MEL ZG512', 'CHE ZG513']),
      effectLine('vendor', ['ME ZG523']),
      effectLine('vendor', ['CHE ZG513', 'EEE ZC341']),
      effectLine('content_manager', [ALL_EXPERIMENTS]),
    ];
    expect(lines).toEqual([
      'Their review queue is empty. Nothing is in scope, and submissions for courses nobody reviews get stuck.',
      'Sees submissions and updates for these in the review queue: ME ZG523, MEL ZG512, CHE ZG513.',
      'Can create experiments and submit them for: ME ZG523.',
      'Can create experiments and submit them for: CHE ZG513, EEE ZC341.',
      'Decides publication and raises corrections for: All experiments.',
    ]);
    for (const piece of [
      "'Sees submissions and updates for these in the review queue: '",
      "'Can create experiments and submit them for: '",
      "'Decides publication and raises corrections for: '",
    ]) {
      expect(VIEWS).toContain(piece);
    }
    expect(VIEWS).toContain("EFF[x.tab][0] + act.map(scopeShort).join(', ') + '.'");
  });

  it('the composed words are the export’s, from its view’s own pieces', () => {
    const composed: readonly (readonly [string, string, string])[] = [
      [registeredOn('20 Oct 2026'), 'Registered 20 Oct 2026', "<span>Registered ' + esc(x.since)"],
      [
        courseScopeWords('ME ZG523', 'Thermodynamics & Heat Transfer'),
        'ME ZG523 · Thermodynamics & Heat Transfer',
        "s.v + ' · ' + SA.courseName(s.v)",
      ],
      [assignedWords('2 Jun 2026'), 'Assigned 2 Jun 2026', "Assigned ' + esc(s.when)"],
      [
        withdrawnWords(
          '1 Oct 2026',
          'Electrical Machines reviews move to a reviewer from the electrical faculty.',
        ),
        'Withdrawn 1 Oct 2026 · “Electrical Machines reviews move to a reviewer from the electrical faculty.”',
        "Withdrawn ' + esc(s.when) + (s.reason ? ' · “' + esc(s.reason) + '”' : '')",
      ],
      [withdrawnWords('1 Oct 2026', ''), 'Withdrawn 1 Oct 2026', "Withdrawn ' + esc(s.when)"],
      [
        withdrawLabel('ME ZG523 · Thermodynamics & Heat Transfer'),
        'Withdraw scope ME ZG523 · Thermodynamics & Heat Transfer',
        'aria-label="Withdraw scope \' + esc(scopeLabel(s))',
      ],
      [
        reasonLabel('ME ZG523'),
        'Reason for withdrawing ME ZG523',
        "'Reason for withdrawing ' + scopeShort(s)",
      ],
      [
        restoreLabel('EEE ZC341 · Electrical Machines'),
        'Restore scope EEE ZC341 · Electrical Machines',
        'aria-label="Restore scope \' + esc(scopeLabel(s))',
      ],
      [
        restoreQuestion('EEE ZC341', 'Prof. A. Menon'),
        'Restore EEE ZC341 for Prof. A. Menon?',
        "'Restore ' + scopeShort(s) + ' for ' + x.name + '?'",
      ],
      [
        `${assignedFlash('EEE ZC341').title} ${assignedFlash('EEE ZC341').line}`,
        'Scope assigned: EEE ZC341. It now appears in their workspace.',
        "'Scope assigned: ' + v + '.'",
      ],
      [
        `${withdrawnFlash('ME ZG523').title} ${withdrawnFlash('ME ZG523').line}`,
        'Scope withdrawn: ME ZG523. The reason is kept with the scope.',
        "'Scope withdrawn: ' + scopeShort(s) + '.'",
      ],
      [
        restoredFlash('EEE ZC341').title,
        'Scope restored: EEE ZC341.',
        "'Scope restored: ' + scopeShort(s) + '.'",
      ],
      [
        experimentOption('Distillation Column', 'CHE ZG513'),
        'Distillation Column · CHE ZG513',
        "c.name + ' · ' + c.course",
      ],
      [registeredAs('vendor'), 'Registered as Vendor', "'Registered as ' + T[2]"],
      [
        scopeWithdrawnWhat('MEL ZG512'),
        'Scope withdrawn: MEL ZG512',
        "'Scope withdrawn: ' + scopeShort(s)",
      ],
      [
        scopeRestoredWhat('EEE ZC341'),
        'Scope restored: EEE ZC341',
        "'Scope restored: ' + scopeShort(s)",
      ],
      [scopeAssignedWhat('EEE ZC341'), 'Scope assigned: EEE ZC341', "'Scope assigned: '"],
      [
        reasonByNote('Moved.', 'Arjun Mehta'),
        '“Moved.” · Arjun Mehta',
        "'“' + r + '” · Arjun Mehta'",
      ],
    ];
    for (const [product, expected, piece] of composed) {
      expect(product).toBe(expected);
      expect(VIEWS).toContain(piece);
    }
    // The sample holders' history the export's data writes.
    expect(registeredNote('Arjun Mehta', [])).toBe('Arjun Mehta · no scope yet');
    expect(registeredNote('Arjun Mehta', ['ME ZG523', 'MEL ZG512', 'CHE ZG513', 'EEE ZC341'])).toBe(
      'Arjun Mehta · scope ME ZG523, MEL ZG512, CHE ZG513, EEE ZC341',
    );
    for (const sample of [
      'Arjun Mehta · no scope yet',
      'Arjun Mehta · scope ME ZG523, MEL ZG512, CHE ZG513, EEE ZC341',
    ]) {
      expect(DATA).toContain(sample);
    }
  });
});

describe('the decision ids (T-11)', () => {
  it('no visible sentence carries a decision id', () => {
    for (const phrase of strings([ROLES_PAGE, HOLDER_PAGE, REGISTER_DIALOG, ASSIGN_PANEL])) {
      expect(phrase).not.toMatch(/\b(T|OD|ROLE|VD|PC)-\d/);
    }
  });
});

describe('the state-copy entries (SA-16, SA-17)', () => {
  it('are in the one register, each with a decision and no decision id in its words', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_PLATFORM_ROLES)) {
      expect(STATE_COPY[id as keyof typeof STATE_COPY]).toBe(entry);
      expect(['SA-16', 'SA-17']).toContain(entry.screen);
      expect(entry.status).toBe('provisional');
      expect(entry.decisions?.length).toBeGreaterThan(0);
      if (entry.words) expect(entry.words).not.toMatch(/\b(T|OD|ROLE|VD|PC)-\d/);
    }
  });

  it('the states the export draws take its words', () => {
    const drawn = [
      'SA-16.loading',
      'SA-16.failed',
      'SA-16.failed.line',
      'SA-16.empty',
      'SA-16.empty.line',
    ] as const;
    for (const id of drawn) {
      expect(`${VIEWS}\n${CORE}`).toContain(STATE_COPY_PLATFORM_ROLES[id].words);
    }
  });
});

/**
 * The words of SA-16 Platform roles and SA-17 Role holder are the frozen B7-08's: each drawn phrase
 * is found verbatim in its markup or script, the composed ones with the board's own sample values
 * and, where the board composes them in its script, the script's own pieces. B7-10 f10, f11 and
 * the B7-12 “Role holder” frames draw the same words. The two sentences that carry “(T-11)” are
 * shown without it (P1-14); the undrawn forms are provisional entries of the state-copy register,
 * each with its decision and no decision id in its words.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  ALL_EXPERIMENTS,
  ASSIGN_DIALOG,
  assignedFlash,
  assignHelp,
  assignTitle,
  courseScopeWords,
  effectLine,
  experimentOption,
  experimentScopeWords,
  HOLDER_PAGE,
  holderOverline,
  noScopeTitle,
  openHolderLabel,
  reasonByNote,
  reasonLabel,
  REGISTER_DIALOG,
  registeredAs,
  registeredByWords,
  registeredFlash,
  registeredLine,
  registeredNote,
  restoredFlash,
  restoreLabel,
  restoreQuestion,
  ROLE_TAB_WORDS,
  ROLE_WORDS,
  ROLES_PAGE,
  scopeAssignedWhat,
  scopeRestoredWhat,
  scopeWithdrawnWhat,
  sinceWords,
  STRIPPED_ROLES,
  withdrawLabel,
  withdrawnCountWords,
  withdrawnFlash,
  withdrawnWords,
} from './platform-roles';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_PLATFORM_ROLES } from './state-copy-platform-roles';

/** A board's text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B7_08 = words('B7-08-Platform-Roles.dc.html');
const B7_10 = words('B7-10-Critical-States.dc.html');
const B7_12 = words('B7-12-Responsive-Proof.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('SA-16 Platform roles (B7-08 f0, f3, f6)', () => {
  const drawn = strings([
    { ...ROLES_PAGE, footNote: undefined },
    ROLE_WORDS,
    ROLE_TAB_WORDS,
    REGISTER_DIALOG,
  ]).filter((phrase) => !['vendor', 'academic_reviewer', 'content_manager'].includes(phrase));

  it.each(drawn)('“%s” is on B7-08', (phrase) => {
    expect(B7_08).toContain(phrase);
  });

  it('the composed words are B7-08’s, from its script’s own pieces', () => {
    // [the product's words for the frame's sample, the frame's words, the script piece].
    const composed: readonly (readonly [string, string, string])[] = [
      [
        noScopeTitle(1),
        '1 holder with no scope — they can’t act on anything yet',
        "plural(o.noScopeN, 'holder') + ' with no scope — they can’t act on anything yet'",
      ],
      [withdrawnCountWords(1), '1 scope withdrawn', "plural(h.wd.length, 'scope') + ' withdrawn'"],
      [
        registeredLine('BITS Pilani · WILP', '2 Jun 2026'),
        'BITS Pilani · WILP · Registered 2 Jun 2026',
        "since: 'Registered ' + h.since",
      ],
      [openHolderLabel('Dr K. Iyer'), 'Open Dr K. Iyer', "aria: 'Open ' + h.name"],
      [
        registeredFlash('Neha Kapoor', 'vendor'),
        'Neha Kapoor is registered as Vendor. They have no scope yet — assign one so they can act. Nothing is sent from here.',
        "T(c2.name) + ' is registered as ' + word(c2.tab) + '. They have no scope yet — assign one so they can act. Nothing is sent from here.'",
      ],
    ];
    for (const [product, frame, script] of composed) {
      expect(product).toBe(frame);
      expect(B7_08).toContain(script);
    }
    // Plural counts take the script's `plural` (“2 holders”, “2 scopes”).
    expect(noScopeTitle(2)).toBe('2 holders with no scope — they can’t act on anything yet');
    expect(withdrawnCountWords(2)).toBe('2 scopes withdrawn');
  });

  it('the Register dialog is f6’s: “Role: <role>. They start with no scope …”', () => {
    expect(`${REGISTER_DIALOG.rolePrefix}${ROLE_WORDS.vendor}${REGISTER_DIALOG.roleTail}`).toBe(
      'Role: Vendor. They start with no scope — you assign it next. Nothing is sent from here.',
    );
    expect(B7_08).toContain(
      'Role: <strong>{{ R.regRole }}</strong>. They start with no scope — you assign it next. Nothing is sent from here.',
    );
  });
});

describe('SA-17 Role holder (B7-08 f1 … f8; B7-10 f10, f11; B7-12)', () => {
  const drawn = strings([
    { ...HOLDER_PAGE, signInNote: undefined, scopeListLabel: undefined },
    ASSIGN_DIALOG,
    ALL_EXPERIMENTS,
  ]);

  it.each(drawn)('“%s” is on B7-08', (phrase) => {
    expect(B7_08).toContain(phrase);
  });

  it('the list labels are B7-08’s `aria-label`s', () => {
    expect(B7_08).toContain(`aria-label="${HOLDER_PAGE.scopeListLabel}"`);
    expect(B7_08).toContain(`aria-label="${HOLDER_PAGE.withdrawnListLabel}"`);
  });

  it('the “Can act on” line per role is B7-08’s `eff`, with and without scope', () => {
    const lines = [
      effectLine('academic_reviewer', []),
      effectLine('academic_reviewer', ['ME ZG523', 'MEL ZG512', 'CHE ZG513']),
      effectLine('vendor', ['ME ZG523']),
      effectLine('vendor', ['CHE ZG513', 'EEE ZC341']),
      effectLine('content_manager', [ALL_EXPERIMENTS]),
    ];
    expect(lines).toEqual([
      'Their review queue is empty — nothing is in scope. Submissions for courses nobody reviews get stuck.',
      'Sees submissions and updates for these in the review queue: ME ZG523, MEL ZG512, CHE ZG513.',
      'Can create experiments and submit them for: ME ZG523.',
      'Can create experiments and submit them for: CHE ZG513, EEE ZC341.',
      'Decides publication and raises corrections for: All experiments.',
    ]);
    // The script's `eff` pieces: each role's lead and its line with nothing in scope.
    for (const piece of [
      'Sees submissions and updates for these in the review queue: ',
      'Can create experiments and submit them for: ',
      'Decides publication and raises corrections for: ',
      effectLine('academic_reviewer', []),
      effectLine('vendor', []),
      effectLine('content_manager', []),
    ]) {
      expect(B7_08).toContain(piece);
    }
    expect(B7_08).toContain(
      "o.effect = h.scope.length ? D.eff[h.tab][0] + can(h) + '.' : D.eff[h.tab][1]",
    );
  });

  it('the composed words are B7-08’s, from its script’s own pieces', () => {
    const composed: readonly (readonly [string, string, string])[] = [
      [
        holderOverline('academic_reviewer', 'BITS Pilani · WILP'),
        'Academic Reviewer · BITS Pilani · WILP',
        "o.hOver = word(h.tab) + ' · ' + h.org",
      ],
      [
        registeredByWords('20 Oct 2026', 'Arjun Mehta'),
        '20 Oct 2026 · by Arjun Mehta',
        "o.hSince = h.since + ' · by ' + D.sa",
      ],
      [
        courseScopeWords('ME ZG523', 'Thermodynamics & Heat Transfer'),
        'ME ZG523 · Thermodynamics & Heat Transfer',
        "x.v + (D.cname[x.v] ? ' · ' + D.cname[x.v] : '')",
      ],
      [
        experimentScopeWords('Distillation Column'),
        'Distillation Column (experiment)',
        "x.v + ' (experiment)'",
      ],
      [sinceWords('4 Jul 2026'), 'Since 4 Jul 2026', "when: 'Since ' + x.when"],
      [
        withdrawnWords(
          '15 Aug 2026',
          'Manufacturing Processes content is being produced in-house this term.',
        ),
        'Withdrawn 15 Aug 2026 · “Manufacturing Processes content is being produced in-house this term.”',
        "when: 'Withdrawn ' + x.when, reason: '“' + x.reason + '”'",
      ],
      [
        withdrawLabel('ME ZG523 · Thermodynamics & Heat Transfer'),
        'Withdraw ME ZG523 · Thermodynamics & Heat Transfer',
        "lab: 'Withdraw ' + scopeTxt(x)",
      ],
      [
        reasonLabel('ME ZG523 · Thermodynamics & Heat Transfer'),
        'Reason for withdrawing ME ZG523 · Thermodynamics & Heat Transfer',
        'Reason for withdrawing {{ x.t }}',
      ],
      [
        restoreLabel('EEE ZC341 · Electrical Machines'),
        'Restore EEE ZC341 · Electrical Machines',
        "lab: 'Restore ' + scopeTxt(x)",
      ],
      [
        restoreQuestion('EEE ZC341 · Electrical Machines'),
        'Restore EEE ZC341 · Electrical Machines? They can act on it again straight away.',
        'Restore {{ x.t }}? They can act on it again straight away.',
      ],
      [
        withdrawnFlash('ME ZG523', 'Anil Shetty'),
        'ME ZG523 withdrawn. Anil Shetty can no longer act on it.',
        "flash: sc.v + ' withdrawn. ' + h.name + ' can no longer act on it.'",
      ],
      [
        restoredFlash('EEE ZC341', 'Prof. A. Menon'),
        'EEE ZC341 restored. Prof. A. Menon can act on it again.',
        "flash: sc.v + ' restored. ' + h.name + ' can act on it again.'",
      ],
      [
        assignedFlash('Dr K. Iyer', 'EEE ZC341'),
        'Dr K. Iyer can now act on EEE ZC341.',
        "flash: h.name + ' can now act on '",
      ],
      [assignTitle('Dr K. Iyer'), 'Assign scope to Dr K. Iyer', "'Assign scope to ' + h.name"],
      [
        assignHelp('Dr K. Iyer', 'academic_reviewer'),
        'Scope decides what Dr K. Iyer sees and can act on. Sees submissions and updates for these in the review queue the scope you choose.',
        "'Scope decides what ' + h.name + ' sees and can act on. ' + D.eff[h.tab][0].replace(': ', ' the scope you choose.')",
      ],
      [
        experimentOption('Distillation Column', 'CHE ZG513'),
        'Distillation Column · CHE ZG513',
        '>Distillation Column · CHE ZG513<',
      ],
      [registeredAs('vendor'), 'Registered as Vendor', "'Registered as ' + word(c2.tab)"],
      [
        registeredNote('Arjun Mehta', ['ME ZG523', 'MEL ZG512']),
        'Arjun Mehta · scope ME ZG523, MEL ZG512',
        "D.sa + ' · no scope yet'",
      ],
      [registeredNote('Arjun Mehta', []), 'Arjun Mehta · no scope yet', "D.sa + ' · no scope yet'"],
      [
        scopeWithdrawnWhat('MEL ZG512'),
        'Scope withdrawn — MEL ZG512',
        "'Scope withdrawn — ' + sc.v",
      ],
      [
        scopeAssignedWhat('EEE ZC341'),
        'Scope assigned — EEE ZC341',
        "'Scope assigned — ' + item.v",
      ],
      [scopeRestoredWhat('EEE ZC341'), 'Scope restored — EEE ZC341', "'Scope restored — ' + sc.v"],
      [
        reasonByNote(
          'Manufacturing Processes content is being produced in-house this term.',
          'Arjun Mehta',
        ),
        '“Manufacturing Processes content is being produced in-house this term.” · Arjun Mehta',
        "'“' + T(c.wreason) + '” · ' + D.sa",
      ],
    ];
    for (const [product, frame, script] of composed) {
      expect(product).toBe(frame);
      expect(B7_08).toContain(script);
    }
    // The sample holders' history the board's data writes (B7-08 `RX.holders[].hist`).
    for (const sample of [
      'Scope withdrawn — MEL ZG512',
      'Registered as Academic Reviewer',
      'Arjun Mehta · scope ME ZG523, MEL ZG512, CHE ZG513, EEE ZC341',
      'Arjun Mehta · scope All experiments',
      'Scope assigned — EEE ZC341',
    ]) {
      expect(B7_08).toContain(sample);
    }
    // B7-10 and B7-12 draw SA-17 from the same markup.
    for (const file of [B7_10, B7_12]) expect(file).toContain('Reason for withdrawing {{');
  });
});

describe('the decision id the boards write into copy (P1-14)', () => {
  it('each sentence is the board’s, shown without “(T-11)”', () => {
    for (const sentence of Object.values(STRIPPED_ROLES)) {
      expect(B7_08).toContain(sentence.drawn);
      expect(sentence.ids).toEqual(['T-11']);
      expect(sentence.words).toBe(sentence.drawn.replace(' (T-11)', ''));
      expect(sentence.words).not.toMatch(/T-\d/);
    }
    expect(ROLES_PAGE.footNote).toBe(
      'Registering doesn’t send an invitation. How a registered person first signs in is still open.',
    );
    expect(HOLDER_PAGE.signInNote).toBe(
      'How they first sign in is still open — nothing is sent from here.',
    );
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
});

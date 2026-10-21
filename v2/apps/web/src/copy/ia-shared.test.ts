/**
 * The words more than one Institute Admin screen group draws are the owner-approved export's (V3
 * Refined B, design/v3-refined-b/roles/IA-v1 `project/Main.dc.html`): each drawn phrase is in its
 * markup or script verbatim, and each composed line takes the script's form with the records'
 * values (pinned here with sample values). No line carries an internal reference.
 */
import { describe, expect, it } from 'vitest';

import { iaExport } from '@/test-support/boards';

import {
  formatCellWords,
  formatsFromAccessPlanLabel,
  formatsFromPlanLabel,
  formatsOfLabel,
  IA_FAILED,
  IA_FORMAT_KEY_WORDS,
  IA_FORMAT_NAMES,
  IA_FORMAT_STATE_WORDS,
  IA_GRANT_COLUMNS,
  IA_HOW_GIVEN,
  IA_PAUSED_READ_ONLY,
  IA_STEPS,
  IA_TOOLBAR,
  iaListText,
  iaPlural,
  removeFilterLabel,
  searchChipLabel,
  showingLabel,
  studentCountLabel,
  viaGroupLabel,
} from './ia-shared';

const MAIN = iaExport('Main.dc.html');
/** The markup with its tags removed and `&amp;` read, then the raw source (attributes, script). */
const WORDS = `${MAIN.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${MAIN}`;
const SCRIPT = MAIN.slice(MAIN.indexOf('<script type="text/x-dc"'));
const INTERNAL_REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|GRP|FMAP)-\d+/;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

/** A static getter of the export's `Component` (`static get FN() { return {...}; }`), read. */
function staticTable(name: string): unknown {
  const match = new RegExp(`static get ${name}\\(\\) \\{\\s*return (\\{[^;]*\\});`).exec(SCRIPT);
  if (!match) throw new Error(`the export has no static ${name}`);
  // The table's keys are bare and its strings single-quoted; read as JSON once both are quoted.
  return JSON.parse(match[1]!.replace(/(\w+):/g, '"$1":').replace(/'/g, '"'));
}

describe('the shared Institute Admin words are the export’s', () => {
  it.each([
    ...strings(IA_FORMAT_STATE_WORDS),
    ...strings(IA_HOW_GIVEN),
    ...strings(IA_GRANT_COLUMNS),
    ...strings(IA_TOOLBAR),
    ...strings(IA_FAILED),
    IA_STEPS.label,
    IA_PAUSED_READ_ONLY,
  ])('“%s”', (phrase) => {
    expect(WORDS).toContain(phrase);
  });

  it('the format names are the script’s `FN`', () => {
    expect(staticTable('FN')).toEqual(IA_FORMAT_NAMES);
  });

  it('the step state words are the script’s `sr` (`vm05`, `vm11`)', () => {
    expect(SCRIPT).toContain(
      `sr: step > i ? '${IA_STEPS.done}' : step === i ? '${IA_STEPS.current}' : ''`,
    );
    expect(stepIndicators()).toBe(2);
  });

  it('the format key words follow `fmBadges`', () => {
    for (const words of strings(IA_FORMAT_KEY_WORDS)) expect(SCRIPT).toContain(`' ${words}'`);
  });

  it('composes the script’s forms with the records’ values', () => {
    expect(iaPlural(1, 'student')).toBe('1 student');
    expect(iaPlural(7, 'student')).toBe('7 students');
    expect(studentCountLabel(6)).toBe('6 students');
    expect(iaListText([])).toBe('');
    expect(iaListText(['WEB'])).toBe('WEB');
    expect(iaListText(['WEB', 'VR'])).toBe('WEB and VR');
    expect(iaListText(['WEB', 'AR', 'VR'])).toBe('WEB, AR and VR');
    expect(formatCellWords('WEB', IA_FORMAT_STATE_WORDS.on)).toBe('WEB, Browser: In your plan');
    expect(formatCellWords('MR', IA_FORMAT_STATE_WORDS.none)).toBe(
      'MR, Mixed reality: Not published',
    );
    expect(formatsOfLabel('Venturi Meter')).toBe('Formats of Venturi Meter');
    expect(formatsFromPlanLabel(['WEB', 'VR'])).toBe('Formats from your plan: WEB, VR');
    expect(formatsFromAccessPlanLabel(['WEB'])).toBe('Formats from your access plan: WEB');
    expect(formatsFromAccessPlanLabel([])).toBe('Formats from your access plan: none');
    expect(viaGroupLabel('ME ZG523 — Sem II')).toBe('Group: ME ZG523 — Sem II');
    expect(showingLabel(3, 12)).toBe('Showing 3 of 12');
    expect(searchChipLabel('  rahul ')).toBe('Search: “rahul”');
    expect(removeFilterLabel(searchChipLabel('rahul'))).toBe('Remove filter Search: “rahul”');
  });

  it('each composed form is the script’s', () => {
    for (const form of [
      "c.code + ', ' + c.name + ': ' + c.state",
      "fmAria: 'Formats of ' + ",
      "'Formats from your plan: ' + (x.fmtsOf[r.exp] || []).join(', ')",
      "'Formats from your access plan: ' + (fm.join(', ') || 'none')",
      "'Group: ' + (G ? G.name : '')",
      "shownText: 'Showing ' + list.length + ' of ' + cur.n",
      "label: 'Search: “' + U.q.trim() + '”'",
      "c.aria = 'Remove filter ' + c.label",
      "n: this.plural(rows.length, 'student')",
    ]) {
      expect(SCRIPT).toContain(form);
    }
  });

  it('no word names a record by its internal reference', () => {
    const all = [
      ...strings(IA_FORMAT_STATE_WORDS),
      ...strings(IA_FORMAT_NAMES),
      ...strings(IA_FORMAT_KEY_WORDS),
      ...strings(IA_HOW_GIVEN),
      ...strings(IA_GRANT_COLUMNS),
      ...strings(IA_TOOLBAR),
      ...strings(IA_FAILED),
      ...strings(IA_STEPS),
      IA_PAUSED_READ_ONLY,
    ];
    expect(all.filter((words) => INTERNAL_REFERENCE.test(words))).toEqual([]);
  });
});

/** How many step indicators the template draws (IA-05, IA-11), each named by `IA_STEPS.label`. */
function stepIndicators(): number {
  return MAIN.split(`<ol class="ia-steps" aria-label="${IA_STEPS.label}">`).length - 1;
}

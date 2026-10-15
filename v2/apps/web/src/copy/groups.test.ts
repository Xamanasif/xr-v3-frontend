/**
 * The words of IA-13 People › Groups and IA-14 Group are the frozen board B2-08's: each drawn
 * phrase is found verbatim in its markup or script, the composed ones with the board's own template
 * values or script expressions; the words B2-08 does not draw are provisional entries of the
 * state-copy register.
 */
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  addedFlash,
  addLabel,
  candidateLine,
  CREATE_DIALOG,
  createdFlash,
  givenOnWords,
  GROUP_PAGE,
  groupCountWords,
  GROUPS_TAB,
  hasItIndividuallyWords,
  memberCountWords,
  openGroupLabel,
  REMOVE_DIALOG,
  removeBody,
  removedFlash,
  removeLabel,
  removeTitle,
  RENAME_DIALOG,
  standingLinePrefix,
} from './groups';
import { fromPlanWords, OTHER_GRANT_WORDS } from './institute-people';
import { STATE_COPY } from './state-copy';
import { STATE_COPY_GROUPS } from './state-copy-groups';

/** A board's text with tags removed and `&amp;` read, then its raw markup (attributes, script). */
function words(file: string): string {
  const raw = board(file);
  return `${raw.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${raw}`;
}

const B2_04 = words('B2-04-Student-Access.dc.html');
const B2_08 = words('B2-08-Groups.dc.html');

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

/** A composed phrase as the script writes it: `'Group “' + n + '” created. …'`. */
const script = (expression: string) => `' + ${expression} + '`;

describe('IA-13 People › Groups (B2-08 f0 … f2)', () => {
  it.each([...strings(GROUPS_TAB), ...strings(CREATE_DIALOG)])('“%s” is on B2-08', (phrase) => {
    expect(B2_08).toContain(phrase);
  });

  it('the composed words follow the board’s script', () => {
    // B2-08 `grView`.
    expect(B2_08).toContain("count: s.groups.length + ' groups'");
    expect(groupCountWords(2)).toBe('2 groups');
    expect(B2_08).toContain("g.n === 1 ? '1 member' : g.n + ' members'");
    expect(memberCountWords(1)).toBe('1 member');
    expect(memberCountWords(7)).toBe('7 members');
    expect(B2_08).toContain(`aria: '${openGroupLabel('')}' + g.name`);
    expect(openGroupLabel('ME ZG523 — Sem II')).toBe('Open group ME ZG523 — Sem II');
    expect(B2_08).toContain(`'${createdFlash(script('n'))}'`);
    expect(createdFlash('Lab batch B')).toBe(
      'Group “Lab batch B” created. Add students to it next.',
    );
  });

  it('the singular count is a provisional entry of the register', () => {
    expect(groupCountWords(1)).toBe('1 group');
    expect(STATE_COPY['IA-13.count-one'].status).toBe('provisional');
  });
});

describe('IA-14 Group (B2-08 f3 … f10)', () => {
  it.each([...strings(GROUP_PAGE), ...strings(RENAME_DIALOG), ...strings(REMOVE_DIALOG)])(
    '“%s” is on B2-08',
    (phrase) => {
      expect(B2_08).toContain(phrase);
    },
  );

  it('the composed words are B2-08’s, with its template values and script', () => {
    // The overline "Group · GRP-0012" (the ID in `span.xr-id`).
    expect(B2_08).toContain(`${GROUP_PAGE.overline} · <span class="xr-id">GRP-0012</span>`);
    // `stText`, `rmAria`, `addLabel`, the flashes and the candidates' line.
    expect(B2_08).toContain(`'${hasItIndividuallyWords('')}' + m.has`);
    expect(hasItIndividuallyWords('SACC-0310')).toBe('Has it individually · SACC-0310');
    expect(B2_08).toContain(`'${removeLabel(script('m.n'))}'`);
    expect(B2_08).toContain(removeTitle('{{ d.tName }}'));
    const body = removeBody('Priya Natarajan');
    expect(body.before).toBe('Priya will no longer be a member of ');
    expect(B2_08).toContain(
      `{{ d.tFirst }}${body.before.slice('Priya'.length)}<strong style="color:#12173F">{{ d.name }}</strong>${body.after}`,
    );
    expect(B2_08).toContain(
      "nPick ? 'Add ' + nPick + (nPick === 1 ? ' student' : ' students') : 'Add students'",
    );
    expect([addLabel(0), addLabel(1), addLabel(2)]).toEqual([
      'Add students',
      'Add 1 student',
      'Add 2 students',
    ]);
    expect(B2_08).toContain(
      "add.length + (add.length === 1 ? ' student added to the group.' : ' students added to the group.')",
    );
    expect(B2_08).toContain(addedFlash(1));
    expect([addedFlash(1), addedFlash(3)]).toEqual([
      '1 student added to the group.',
      '3 students added to the group.',
    ]);
    expect(B2_08).toContain(`n + '${removedFlash('')}'`);
    expect(removedFlash('Priya Natarajan')).toBe('Priya Natarajan was removed from the group.');
    expect(B2_08).toContain("x.id + (x.st === 'inactive' ? ' · inactive' : '')");
    expect(candidateLine('GIT-2026-0352', true)).toBe('GIT-2026-0352 · inactive');
    expect(candidateLine('GIT-2026-0421', false)).toBe('GIT-2026-0421');
    // f4 "Given" and "Formats".
    expect(B2_08).toContain(`${givenOnWords('12 Oct 2026')}<span class="xr-id">SACC-0311</span>`);
    expect(B2_08).toContain(fromPlanWords('ACC-0107'));
    // The notes name the open decisions these words must not settle.
    expect(B2_08).toContain('OD-B2-01');
    expect(B2_08).toContain('OD-B2-02 — open');
  });

  it('the words B2-08 does not draw are the register’s, and B2-04’s grant words', () => {
    expect(B2_04).toContain(OTHER_GRANT_WORDS.withdrawn);
    expect(B2_04).toContain(OTHER_GRANT_WORDS['access-ended']);
    expect(standingLinePrefix('Shell-and-Tube Heat Exchanger')).toBe(
      'Shell-and-Tube Heat Exchanger: ',
    );
    // The undecided overlap gets no can / can't-open words (OD-B2-01).
    const policyOpen = STATE_COPY['IA-14.policy-open'];
    expect(policyOpen.decisions).toContain('OD-B2-01');
    expect(policyOpen.words).not.toMatch(/can open|can’t open|cannot open/i);
    expect(B2_08).not.toContain(policyOpen.words);
  });

  it('every entry of the Groups register is for IA-13 or IA-14 and waits on a named decision', () => {
    for (const [id, entry] of Object.entries(STATE_COPY_GROUPS)) {
      expect(id.startsWith(`${entry.screen}.`), id).toBe(true);
      expect(['IA-13', 'IA-14']).toContain(entry.screen);
      if (entry.status !== 'drawn') expect(entry.decisions?.length, id).toBeGreaterThan(0);
    }
  });
});

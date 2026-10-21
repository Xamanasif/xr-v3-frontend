/**
 * RV-04 "What changes" marks (RV-v1 `RV.dc.html` `I.cmp`, board RV04): the removed words struck on
 * the live side and the added words highlighted on the proposed side, worked out from the two whole
 * values the service compares.
 */
import { describe, expect, it } from 'vitest';

import { markChanges, type MarkedRun } from './compare-words';

const marks = (runs: readonly MarkedRun[]) =>
  runs.filter((run) => run.marked).map((run) => run.text);
const joined = (runs: readonly MarkedRun[]) => runs.map((run) => run.text).join('');

const LIVE =
  'Learners start a binary column from cold and bring it to steady state. They then change the reflux ratio and watch the overhead purity respond with realistic lag. Lowering the reflux ratio raises the overhead purity, at the cost of more reboiler heat.';
const PROPOSED =
  'Learners start a binary column from cold and bring it to steady state. They then change the reflux ratio and watch the overhead purity respond with realistic lag. Raising the reflux ratio raises the overhead purity, at the cost of more reboiler heat.';

describe('markChanges — the export’s marks for RV04', () => {
  it('the description: the one changed word on each side', () => {
    const pair = markChanges(LIVE, PROPOSED);
    expect(marks(pair.live)).toEqual(['Lowering']);
    expect(marks(pair.proposed)).toEqual(['Raising']);
    expect(joined(pair.live)).toBe(LIVE);
    expect(joined(pair.proposed)).toBe(PROPOSED);
    // As the export's sample record cuts it: the text before, the word, the text after.
    expect(pair.proposed.map((run) => run.marked)).toEqual([false, true, false]);
  });

  it('the web link: the live link plain, the added end highlighted', () => {
    const pair = markChanges(
      'https://labs.meridian.example/distillation-column',
      'https://labs.meridian.example/distillation-column-1-3',
    );
    expect(pair.live).toEqual([
      { text: 'https://labs.meridian.example/distillation-column', marked: false },
    ]);
    expect(pair.proposed).toEqual([
      { text: 'https://labs.meridian.example/distillation-column', marked: false },
      { text: '-1-3', marked: true },
    ]);
  });

  it('the version: marked whole on both sides', () => {
    expect(markChanges('1.2', '1.3', { wholeValue: true })).toEqual({
      live: [{ text: '1.2', marked: true }],
      proposed: [{ text: '1.3', marked: true }],
    });
  });

  it('a changed phrase reads as one mark; a value with no counterpart is marked whole', () => {
    const pair = markChanges('Read the gauge twice.', 'Read the inlet gauge and the outlet gauge.');
    expect(joined(pair.proposed)).toBe('Read the inlet gauge and the outlet gauge.');
    expect(marks(pair.live)).toEqual(['twice']);
    expect(marks(pair.proposed).join('|')).toMatch(/inlet/);
    expect(markChanges(null, 'https://labs.example/new')).toEqual({
      live: [],
      proposed: [{ text: 'https://labs.example/new', marked: true }],
    });
    expect(markChanges('Old summary.', '')).toEqual({
      live: [{ text: 'Old summary.', marked: true }],
      proposed: [],
    });
  });
});

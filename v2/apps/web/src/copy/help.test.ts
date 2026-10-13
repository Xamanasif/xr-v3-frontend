/**
 * Help & support words against board 07 (its frame data: `OPEN`, `REOPENED`, `RESOLVED`, the
 * rows' subs, the detail's history) and the P0-31 title rule.
 */
import type { SupportReport } from '@xr/domain';
import { fixtureWorld } from '@xr/sample-platform/testing';
import { describe, expect, it } from 'vitest';

import { board } from '@/test-support/boards';

import {
  historyOf,
  newestFirst,
  reopenedOf,
  REPORT_STATUS,
  REPORT_TITLE_MAX,
  reportCountText,
  reportedFacts,
  reportSub,
  reportTitle,
  resolutionOf,
} from './help';

const BOARD_07 = board('07-Help-Support.dc.html');

async function sup0207(fixture: 'spine-start' | 'after-flow-d'): Promise<SupportReport> {
  const world = await fixtureWorld(fixture);
  return world.records.reports['SUP-0207' as keyof typeof world.records.reports] as SupportReport;
}

describe('status words (board 07 "Rules": Open · Resolved · Reopened)', () => {
  it('as the board’s frame data draws them', () => {
    expect(BOARD_07).toContain(
      "const OPEN = { cls: 'xr-status--info', icon: 'M7 7h11l-3-3M17 17H6l3 3', status: 'Open' }",
    );
    expect(BOARD_07).toContain(
      "const REOPENED = { cls: 'xr-status--info', icon: 'M20 12a8 8 0 1 1-2.4-5.7M20 4v4.5h-4.5', status: 'Reopened' }",
    );
    expect(BOARD_07).toContain(
      "const RESOLVED = { cls: 'xr-status--ok', icon: 'M5 12.5l4.5 4.5L19 7.5', status: 'Resolved' }",
    );
    expect(REPORT_STATUS).toEqual({
      open: { tone: 'info', label: 'Open' },
      resolved: { tone: 'ok', label: 'Resolved' },
      reopened: { tone: 'info', label: 'Reopened', icon: 'retry' },
    });
  });

  it('counts: "1 report", "3 reports" (board 07 m2, s5)', () => {
    expect(BOARD_07).toContain("countText: '3 reports'");
    expect(BOARD_07).toContain("countText: '1 report'");
    expect(reportCountText(1)).toBe('1 report');
    expect(reportCountText(3)).toBe('3 reports');
    expect(reportCountText(0)).toBe('0 reports');
  });
});

describe('the report title — PROVISIONAL excerpt of "What happened" (P0-31)', () => {
  it('a short text whole, without its closing full stop', () => {
    expect(reportTitle('The VR simulation stopped loading at the second step.')).toBe(
      'The VR simulation stopped loading at the second step',
    );
    expect(reportTitle('  Group   name\ndidn’t save  ')).toBe('Group name didn’t save');
    expect(reportTitle('It stopped...')).toBe('It stopped...');
  });

  it('a long text cut at the last whole word, with an ellipsis', () => {
    const long =
      'The lab brief link on the Resources tab opened a blank page and then the whole tab froze.';
    const title = reportTitle(long);
    expect(title).toBe('The lab brief link on the Resources tab opened a blank page…');
    expect(title.length).toBeLessThanOrEqual(REPORT_TITLE_MAX + 1);
  });
});

describe('rows and detail from the shared world (SUP-0207, board 07 "State 3a")', () => {
  it('reopened: "sent 28 Sep · reopened 6 Oct"; the earlier resolution kept in the history', async () => {
    const report = await sup0207('after-flow-d');
    expect(reportSub(report)).toBe('sent 28 Sep · reopened 6 Oct');
    expect(reopenedOf(report)).toEqual({ date: '6 Oct' });
    expect(resolutionOf(report)).toBeNull();
    // Board 07 s8 history: Reopened 6 Oct · Resolved 30 Sep · “…” · Sent 28 Sep.
    expect(BOARD_07).toContain(
      "{ what: 'Reopened', when: '6 Oct', cls: 'is-latest' }, { what: 'Resolved', when: '30 Sep · “The preview now loads. Please try again.”', cls: '' }, { what: 'Sent', when: '28 Sep', cls: '' }",
    );
    expect(historyOf(report).map(({ what, when }) => ({ what, when }))).toEqual([
      { what: 'Reopened', when: '6 Oct' },
      { what: 'Resolved', when: '30 Sep · “The preview now loads. Please try again.”' },
      { what: 'Sent', when: '28 Sep' },
    ]);
    expect(reportedFacts(report)).toEqual([
      {
        term: 'What happened',
        value: 'The preview of the WEB delivery link showed an empty frame.',
      },
      { term: 'Where', value: 'Content library · Forced Convection' },
      { term: 'Screenshot', value: 'No screenshot added', icon: 'image' },
    ]);
    expect(BOARD_07).toContain("shot: 'No screenshot added'");
  });

  it('resolved: "sent 28 Sep · resolved 30 Sep"; the note first, "resolution note added" in the history', async () => {
    const report = await sup0207('spine-start');
    expect(reportSub(report)).toBe('sent 28 Sep · resolved 30 Sep');
    expect(resolutionOf(report)).toEqual({
      date: '30 Sep',
      note: '“The preview now loads. Please try again.”',
    });
    expect(reopenedOf(report)).toBeNull();
    // Board 07 s7: "Resolved · 23 Sep · resolution note added" (latest) · "Sent · 21 Sep".
    expect(BOARD_07).toContain(
      "{ what: 'Resolved', when: '23 Sep · resolution note added', cls: 'is-latest' }",
    );
    expect(historyOf(report).map(({ what, when }) => ({ what, when }))).toEqual([
      { what: 'Resolved', when: '30 Sep · resolution note added' },
      { what: 'Sent', when: '28 Sep' },
    ]);
  });

  it('open: "sent …" only; newest first', async () => {
    const world = await fixtureWorld('after-flow-d');
    const reports = Object.values(world.records.reports) as SupportReport[];
    const sup0213 = reports.find((report) => report.id === 'SUP-0213')!;
    expect(reportSub(sup0213)).toBe('sent 16 Oct');
    expect(newestFirst(reports).map((report) => report.id)).toEqual(['SUP-0213', 'SUP-0207']);
  });
});

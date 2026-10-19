/**
 * Help & support words against the owner-approved XS export (`XsHelp`: its status map, the rows'
 * meta, the detail's history, the view copy; design/v3-refined-b/roles/XS-v6), which keeps board
 * 07's words, and the P0-31 title rule (the app's own rule, kept: XS "keep the app's existing title
 * rule if it differs").
 */
import type { SupportReport } from '@xr/domain';
import { fixtureWorld } from '@xr/sample-platform/testing';
import { describe, expect, it } from 'vitest';

import { board, xsExport } from '@/test-support/boards';

import {
  HELP,
  historyOf,
  newestFirst,
  reopenedOf,
  REPORT_STATUS,
  REPORT_TITLE_MAX,
  reportCountText,
  reportedFacts,
  reportMeta,
  reportTitle,
  resolutionOf,
  sentOn,
  showsReportReferences,
} from './help';

const BOARD_07 = board('07-Help-Support.dc.html');
const XS_HELP = xsExport('XsHelp.dc.html');

async function sup0207(fixture: 'spine-start' | 'after-flow-d'): Promise<SupportReport> {
  const world = await fixtureWorld(fixture);
  return world.records.reports['SUP-0207' as keyof typeof world.records.reports] as SupportReport;
}

describe('status words (XS `ST`; board 07 "Rules": Open · Resolved · Reopened)', () => {
  it('as the export’s status map draws them', () => {
    expect(XS_HELP).toContain(
      "return { open: { cls: 'xr-st xr-st--info', label: 'Open' }, reopened: { cls: 'xr-st xr-st--info', label: 'Reopened' }, resolved: { cls: 'xr-st xr-st--ok', label: 'Resolved' } };",
    );
    expect(REPORT_STATUS).toEqual({
      open: { tone: 'info', label: 'Open' },
      resolved: { tone: 'ok', label: 'Resolved' },
      reopened: { tone: 'info', label: 'Reopened' },
    });
  });

  it('counts: "1 report · newest first", "3 reports · newest first"', () => {
    expect(XS_HELP).toContain(
      "countText: rows.length + (rows.length === 1 ? ' report' : ' reports') + ' · newest first'",
    );
    expect(reportCountText(1)).toBe('1 report · newest first');
    expect(reportCountText(3)).toBe('3 reports · newest first');
  });

  it('the view words are the export’s', () => {
    for (const words of [
      HELP.title.replace('&', '&amp;'),
      HELP.lead,
      HELP.mine,
      HELP.empty.title,
      HELP.empty.line,
      HELP.loading,
      HELP.failed.title,
      HELP.failed.line,
      HELP.form.lead,
      HELP.form.summary,
      HELP.form.whatSummary,
      HELP.form.whatHint,
      HELP.form.whatError,
      HELP.form.whereHint,
      HELP.form.screenshotHint,
      HELP.form.cancel,
      HELP.sent.view,
      HELP.sent.withoutReference,
      HELP.detail.reopenedTitle,
      HELP.detail.reported,
      HELP.detail.newestFirst,
    ]) {
      expect(XS_HELP, words).toContain(words);
    }
  });

  it('the Super Admin sees no reference; every other role does (owner decision 6)', () => {
    expect(XS_HELP).toContain('showRefs=false is the Super Admin variant');
    expect(showsReportReferences('super_admin')).toBe(false);
    for (const role of ['student', 'faculty', 'tenant_admin', 'vendor'] as const) {
      expect(showsReportReferences(role)).toBe(true);
    }
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

describe('rows and detail from the shared world (SUP-0207, XS `detail`)', () => {
  it('reopened: "SUP-0207 · Sent 28 Sep 2026 · Reopened 6 Oct 2026"; the earlier resolution kept', async () => {
    const report = await sup0207('after-flow-d');
    expect(reportMeta(report, true)).toBe('SUP-0207 · Sent 28 Sep 2026 · Reopened 6 Oct 2026');
    expect(reportMeta(report, false)).toBe('Sent 28 Sep 2026 · Reopened 6 Oct 2026');
    expect(XS_HELP).toContain("[refs ? r.id : null, 'Sent ' + r.sent,");
    expect(sentOn(report)).toBe('Sent 28 Sep 2026');
    expect(reopenedOf(report)).toBe('It was reopened on 6 Oct 2026. You can follow it here.');
    expect(XS_HELP).toContain('It was reopened on {{ d.reopened }}. You can follow it here.');
    expect(resolutionOf(report)).toBeNull();
    // XS sample SUP-0211: Reopened · Resolved with its note on its own line · Sent.
    expect(XS_HELP).toContain(
      "history: [{ what: 'Reopened', when: '6 Oct 2026' }, { what: 'Resolved', when: '3 Oct 2026', note: '“The import now reads the whole file. Please try again.”' }, { what: 'Sent', when: '1 Oct 2026' }]",
    );
    expect(historyOf(report)).toEqual([
      { what: 'Reopened', when: '6 Oct 2026' },
      {
        what: 'Resolved',
        when: '30 Sep 2026',
        note: '“The preview now loads. Please try again.”',
      },
      { what: 'Sent', when: '28 Sep 2026' },
    ]);
    expect(reportedFacts(report)).toEqual([
      {
        term: 'What happened',
        value: 'The preview of the WEB delivery link showed an empty frame.',
      },
      { term: 'Where', value: 'Content library · Forced Convection' },
      { term: 'Screenshot', value: 'No screenshot added' },
    ]);
    expect(XS_HELP).toContain("shot: 'No screenshot added'");
    expect(XS_HELP).toContain("where: rec.where || 'Not given'");
    expect(reportedFacts({ ...report, where: null })[1]).toEqual({
      term: 'Where',
      value: 'Not given',
    });
  });

  it('resolved: the note first ("Resolution note · 30 Sep 2026"), and on its history line', async () => {
    const report = await sup0207('spine-start');
    expect(reportMeta(report, true)).toBe('SUP-0207 · Sent 28 Sep 2026 · Resolved 30 Sep 2026');
    expect(resolutionOf(report)).toEqual({
      title: 'Resolution note · 30 Sep 2026',
      note: '“The preview now loads. Please try again.”',
    });
    expect(XS_HELP).toContain('Resolution note · {{ d.resolved }}');
    expect(reopenedOf(report)).toBeNull();
    expect(historyOf(report)).toEqual([
      {
        what: 'Resolved',
        when: '30 Sep 2026',
        note: '“The preview now loads. Please try again.”',
      },
      { what: 'Sent', when: '28 Sep 2026' },
    ]);
    expect(BOARD_07).toContain("shot: 'No screenshot added'");
  });

  it('open: "Sent …" only; newest first', async () => {
    const world = await fixtureWorld('after-flow-d');
    const reports = Object.values(world.records.reports) as SupportReport[];
    const sup0213 = reports.find((report) => report.id === 'SUP-0213')!;
    expect(reportMeta(sup0213, true)).toBe('SUP-0213 · Sent 16 Oct 2026');
    expect(newestFirst(reports).map((report) => report.id)).toEqual(['SUP-0213', 'SUP-0207']);
  });
});

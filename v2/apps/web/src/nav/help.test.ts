/**
 * The Help & support template's place in every workspace (Appendix F WP-0.8 "HelpSupport
 * template"; board 07 "One template, one location … in all seven workspaces"; Appendix A XS-07):
 * the same addresses under each base (the route register) and the top-bar words; the owner-approved
 * XS export's views draw their own breadcrumb and width.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PLATFORM_ROLES, ROLE_LABEL } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { HELP_TITLE, helpAddresses, helpPlacement } from './help';
import { WORKSPACE_NAV } from './nav-config';

const REPO = join(import.meta.dirname, '..', '..', '..', '..', '..');
const ROUTES = JSON.parse(readFileSync(join(REPO, 'v2', 'docs', 'v46', 'routes.json'), 'utf8')) as {
  readonly pageRoutePatterns: Readonly<Record<string, string>>;
};
const XS_HELP = readFileSync(
  join(REPO, 'design', 'v3-refined-b', 'roles', 'XS-v6', 'project', 'XsHelp.dc.html'),
  'utf8',
);
const BOARD_07 = readFileSync(
  join(REPO, 'design', 'handoff-v46', 'canvas-v46', 'project', '07-Help-Support.dc.html'),
  'utf8',
);

describe('Help & support in all seven workspaces', () => {
  it.each(PLATFORM_ROLES.map((role) => [ROLE_LABEL[role], role] as const))(
    '%s: My reports, Report a problem and a report’s detail at the register’s addresses',
    (_label, role) => {
      const addresses = helpAddresses(role);
      const base = WORKSPACE_NAV[role].base;
      expect(addresses.reports).toBe(`${base}/help`);
      expect(addresses.report).toBe(`${base}/help/report`);
      expect(addresses.detail('sup-0198')).toBe(`${base}/help/reports/sup-0198`);
      for (const pattern of [
        `${base}/help`,
        `${base}/help/report`,
        `${base}/help/reports/[reportId]`,
      ]) {
        expect(ROUTES.pageRoutePatterns[pattern], pattern).toBe('XS-07');
      }
    },
  );

  it('the four views name themselves in the top bar; each draws its own breadcrumb (XS)', () => {
    expect(helpPlacement('vendor', { kind: 'reports' })).toEqual({
      screen: 'XS-07',
      title: 'Help & support',
      trail: [],
    });
    expect(helpPlacement('vendor', { kind: 'report' })).toEqual({
      screen: 'XS-07',
      title: 'Report a problem',
      trail: [],
    });
    expect(helpPlacement('vendor', { kind: 'sent' })).toEqual({
      screen: 'XS-07',
      title: 'Report sent',
      trail: [],
    });
    // A report is named by its title, never its reference (owner decision 6 for the Super Admin;
    // the XS breadcrumb names the title for everyone); while it loads, by Help & support.
    expect(
      helpPlacement('super_admin', {
        kind: 'detail',
        reportId: 'SUP-0213',
        title: 'The renewal list stopped loading',
      }),
    ).toEqual({ screen: 'XS-07', title: 'The renewal list stopped loading', trail: [] });
    expect(
      helpPlacement('vendor', { kind: 'detail', reportId: 'sup-0198', title: null }).title,
    ).toBe('Help & support');
    // The words are the XS export's (board 07's).
    expect(HELP_TITLE).toBe('Help & support');
    for (const evidence of [
      '<span aria-current="page">Report a problem</span>',
      '<span aria-current="page">Report sent</span>',
      '<span aria-current="page">{{ d.title }}</span>',
    ]) {
      expect(XS_HELP, evidence).toContain(evidence);
    }
    expect(BOARD_07).toContain("title: 'Report a problem'");
  });
});

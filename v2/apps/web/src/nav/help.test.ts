/**
 * The Help & support template's place in every workspace (Appendix F WP-0.8 "HelpSupport
 * template"; board 07 "One template, one location … in all seven workspaces"; Appendix A XS-07):
 * the same addresses under each base (the route register), the top-bar words and page widths
 * board 07 draws.
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

  it('the four views: the top-bar words, the crumb above the deep views and the widths board 07 draws', () => {
    const trail = [{ label: 'Help & support', href: '/vendor/help' }];
    expect(helpPlacement('vendor', { kind: 'reports' })).toEqual({
      screen: 'XS-07',
      title: 'Help & support',
      trail: [],
      wrap: 'read',
    });
    expect(helpPlacement('vendor', { kind: 'report' })).toEqual({
      screen: 'XS-07',
      title: 'Report a problem',
      trail,
      wrap: 'form',
    });
    expect(helpPlacement('vendor', { kind: 'sent' })).toEqual({
      screen: 'XS-07',
      title: 'Report sent',
      trail,
      wrap: 'none',
    });
    expect(
      helpPlacement('vendor', { kind: 'detail', reportId: 'sup-0198', reference: 'SUP-0198' }),
    ).toEqual({ screen: 'XS-07', title: 'SUP-0198', trail, wrap: 'read' });
    // Board 07's own words.
    expect(HELP_TITLE).toBe('Help & support');
    for (const evidence of [
      "title: 'Help & support'",
      "title: 'Report a problem'",
      "title: 'Report sent'",
      "title: 'SUP-0198'",
    ]) {
      expect(BOARD_07, evidence).toContain(evidence);
    }
    // Board 07's widths, view by view: the first element inside each view's template
    // (`<sc-if value="{{ f.isForm }}">` …): form 720, list and detail 1040, the sent message bare.
    const drawn = new Map(
      [
        ...BOARD_07.matchAll(/<sc-if value="\{\{ f\.(is\w+) \}\}"[^>]*>\s*<div class="([^"]+)"/g),
      ].map(([, view, className]) => [view!, className!]),
    );
    const WRAP_CLASS = {
      read: 'xr-wrap--read xr-content',
      form: 'xr-wrap--form xr-content',
      // No wrapper: the sent view's first element is the message itself.
      none: 'xr-msg',
    } as const;
    for (const [view, kind] of [
      ['isList', { kind: 'reports' }],
      ['isForm', { kind: 'report' }],
      ['isSent', { kind: 'sent' }],
      ['isDetail', { kind: 'detail', reportId: 'sup-0198', reference: 'SUP-0198' }],
    ] as const) {
      const { wrap } = helpPlacement('vendor', kind);
      expect(wrap === 'wide' ? undefined : WRAP_CLASS[wrap], view).toBe(drawn.get(view));
    }
  });
});

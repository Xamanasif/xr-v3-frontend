/**
 * The seven workspace navigations and the public header against the frozen design (Appendix F
 * WP-0.8 acceptance 1; Appendix E §4.1): board 06 `raw[]` (labels, order, icon keys and paths,
 * count words, institution lines), `handoff/navigation.json` (after HB-19 "Help (foot)" → "Help"
 * and HB-02 "Request access" → PU-07), board 05 `ROLES` and board 06 "Nested destinations"
 * (section tabs), B1-01's header markup, and the route register (`docs/v46/routes.json`).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PLATFORM_ROLES, ROLE_LABEL } from '@xr/domain';
import { ICON_PATHS, MAX_DESTINATIONS } from '@xr/ui';
import { describe, expect, it } from 'vitest';

import {
  BOARD_ICON,
  MY_DEVICE,
  PUBLIC_HEADER_NAV,
  WORKSPACE_BASE,
  WORKSPACE_NAV,
  type BoardIconKey,
} from './nav-config';
import { saExport } from '../test-support/boards';
import { WORKSPACE_SCREEN_IDS } from './screens';

const REPO = join(import.meta.dirname, '..', '..', '..', '..', '..');
const BOARDS = join(REPO, 'design', 'handoff-v46', 'canvas-v46', 'project');
const board = (file: string) => readFileSync(join(BOARDS, file), 'utf8');
const json = <T>(path: string) => JSON.parse(readFileSync(path, 'utf8')) as T;

/** Board 06's `raw[]` entries, parsed from its script: `{ ws, inst, nav: [n('Home', 'home'), …] }`. */
function board06(): {
  readonly icons: Readonly<Record<string, string>>;
  readonly workspaces: readonly {
    readonly ws: string;
    readonly inst: string;
    readonly nav: readonly {
      readonly label: string;
      readonly icon: string;
      readonly count?: string;
      readonly countText?: string;
    }[];
  }[];
} {
  const text = board('06-Sidebar-Variants.dc.html');
  const iconBlock = text.slice(
    text.indexOf('const I = {'),
    text.indexOf('};', text.indexOf('const I = {')),
  );
  const icons = Object.fromEntries(
    [...iconBlock.matchAll(/(\w+): '([^']+)'/g)].map(([, key, path]) => [key!, path!]),
  );
  const rawBlock = text.slice(
    text.indexOf('const raw = ['),
    text.indexOf('];', text.indexOf('const raw = [')),
  );
  const GIT = 'Godavari Institute of Technology';
  const workspaces = [
    ...rawBlock.matchAll(/\{ ws: '([^']+)', inst: ([^,]+), summary: '[^']*', nav: \[(.*?)\] \}/g),
  ].map(([, ws, inst, nav]) => ({
    ws: ws!,
    inst: inst === 'GIT' ? GIT : inst!.replace(/^'|'$/g, ''),
    nav: [...nav!.matchAll(/n\('([^']+)', '(\w+)'(?:, '([^']*)', '([^']*)')?\)/g)].map(
      ([, label, icon, count, countText]) => ({ label: label!, icon: icon!, count, countText }),
    ),
  }));
  return { icons, workspaces };
}

const BOARD_06 = board06();

describe('the seven workspaces: board 06 raw[] (labels, order, icon keys and paths, counts, lines)', () => {
  it('board 06 draws exactly the seven authenticated roles, in PLATFORM_ROLES order', () => {
    expect(BOARD_06.workspaces.map((entry) => entry.ws)).toEqual(
      PLATFORM_ROLES.map((role) => ROLE_LABEL[role]),
    );
    expect(Object.keys(WORKSPACE_NAV)).toEqual([...PLATFORM_ROLES]);
  });

  it.each(PLATFORM_ROLES.map((role, index) => [ROLE_LABEL[role], role, index] as const))(
    '%s: labels, order and board icon keys exactly as drawn; Help is last and never a destination',
    (_label, role, index) => {
      const drawn = BOARD_06.workspaces[index]!;
      const config = WORKSPACE_NAV[role];
      expect(config.workspace).toBe(drawn.ws);
      expect(config.destinations.map((destination) => destination.label)).toEqual(
        drawn.nav.map((item) => item.label),
      );
      expect(config.destinations.map((destination) => destination.boardIcon)).toEqual(
        drawn.nav.map((item) => item.icon),
      );
      expect(config.destinations.length).toBeLessThanOrEqual(MAX_DESTINATIONS);
      expect(config.destinations.map((destination) => destination.label)).not.toContain('Help');
      expect(config.help).toEqual({ label: 'Help', screen: 'XS-07', href: `${config.base}/help` });
    },
  );

  it('every board-06 icon key draws the same path as the @xr/ui registry icon it maps to', () => {
    expect(Object.keys(BOARD_ICON).sort()).toEqual(Object.keys(BOARD_06.icons).sort());
    for (const [key, path] of Object.entries(BOARD_06.icons)) {
      expect(ICON_PATHS[BOARD_ICON[key as BoardIconKey]], key).toBe(path);
    }
  });

  it.each(PLATFORM_ROLES.map((role, index) => [ROLE_LABEL[role], role, index] as const))(
    '%s: count words as board 06 says them; the institution or organisation line as drawn',
    (_label, role, index) => {
      const drawn = BOARD_06.workspaces[index]!;
      const config = WORKSPACE_NAV[role];
      drawn.nav.forEach((item, position) => {
        const destination = config.destinations[position]!;
        if (item.count) {
          expect(destination.countWords?.other.replace('{n}', item.count), item.label).toBe(
            item.countText,
          );
        } else {
          expect(destination.countWords, item.label).toBeUndefined();
        }
      });
      // Board 06: the institution for institution roles, the organisation for the Vendor, none
      // for the platform roles.
      const expected =
        drawn.inst === '' ? 'none' : role === 'vendor' ? 'organisation' : 'institution';
      expect(config.organisationLine).toBe(expected);
    },
  );

  it('the singular count words: Marking’s is a drawn sidebar count; the device requests’ is drawn only in B2-01’s attention row', () => {
    const singulars = Object.fromEntries(
      PLATFORM_ROLES.flatMap((role) =>
        WORKSPACE_NAV[role].destinations.flatMap((destination) =>
          destination.countWords?.one
            ? [[`${role}:${destination.key}`, destination.countWords.one.replace('{n}', '1')]]
            : [],
        ),
      ),
    );
    expect(singulars).toEqual({
      'faculty:marking': '1 written answer to mark',
      'tenant_admin:requests': '1 device request to forward',
      'super_admin:requests': '1 request under review',
    });
    // Requests (Super Admin): the owner-approved Super Admin export writes the singular
    // (design/v3-refined-b/roles/SA-v1/project/sa-core.js: `plural(n, 'request') + ' under review'`).
    expect(saExport('sa-core.js')).toContain("plural(n, 'request') + ' under review");
    // Marking: the B4 boards draw the sidebar count at 1 in these words.
    expect(board('B4-01-Faculty-Overview.dc.html')).toContain(
      '<span class="xr-nav-text">Marking</span><span class="xr-count"><span aria-hidden="true">1</span><span class="xr-sr">, 1 written answer to mark</span></span>',
    );
    // Device requests: the Institute Admin's batches (B2, B3) draw no sidebar count at all — only
    // board 06 does, at 2 — so the singular is B2-01's attention row in the same words. Open for
    // the owner (nav/README.md).
    expect(board('B2-01-IA-Overview.dc.html')).toContain(
      '<span class="xr-row-title">1 device request to forward to BITS</span>',
    );
    for (const file of readdirSync(BOARDS).filter((name) => /^B[23]-.*\.dc\.html$/.test(name))) {
      expect(board(file), file).not.toContain('class="xr-count"');
    }
  });
});

interface NavigationJson {
  readonly roles: readonly {
    readonly surface: string;
    readonly baseRoute: string;
    readonly primary: readonly string[];
  }[];
}

const NAVIGATION = json<NavigationJson>(join(BOARDS, 'handoff', 'navigation.json'));

describe('the seven workspaces: handoff/navigation.json after the documented normalisations', () => {
  it.each(PLATFORM_ROLES.map((role) => [ROLE_LABEL[role], role] as const))(
    '%s: base route, primary destinations, Help (foot) → Help (HB-19), section tabs',
    (label, role) => {
      const entry = NAVIGATION.roles.find((candidate) => candidate.surface === label)!;
      const config = WORKSPACE_NAV[role];
      expect(config.base).toBe(entry.baseRoute);
      expect(WORKSPACE_BASE[role]).toBe(entry.baseRoute);
      // "Content (tabs: Updates · All content)" is the destination "Content" and its tabs.
      const primary = entry.primary.map((item) => item.replace(/ \(tabs: .*\)$/, ''));
      expect(primary.at(-1)).toBe('Help (foot)');
      expect([...primary.slice(0, -1), 'Help']).toEqual([
        ...config.destinations.map((destination) => destination.label),
        config.help.label,
      ]);
      for (const item of entry.primary) {
        const tabs = /^(.*) \(tabs: (.*)\)$/.exec(item);
        if (!tabs) continue;
        const destination = config.destinations.find((candidate) => candidate.label === tabs[1]);
        expect(destination?.sectionTabs, item).toEqual(tabs[2]!.split(' · '));
      }
    },
  );

  it('section tabs are board 05’s ROLES tabs and board 06’s nested destinations', () => {
    const text = board('05-Workspace-Shell.dc.html');
    const drawn = [...text.matchAll(/d\('([^']+)', '\w+',[^\n]*?tabs: \[([^\]]*)\]/g)].map(
      ([, label, tabs]) =>
        [label!, [...tabs!.matchAll(/'([^']+)'/g)].map(([, tab]) => tab!)] as const,
    );
    const configured = PLATFORM_ROLES.flatMap((role) =>
      WORKSPACE_NAV[role].destinations
        .filter((destination) => destination.sectionTabs)
        .map((destination) => [destination.label, destination.sectionTabs] as const),
    );
    expect(configured).toEqual(drawn);
    const subs = board('06-Sidebar-Variants.dc.html');
    for (const [label, tabs] of [
      ['Content', ['Updates', 'All content']],
      ['Operations', ['Device transfers', 'Support', 'Access ending']],
      ['People', ['Students', 'Faculty', 'Groups', 'Faculty courses']],
      ['Requests', ['Requests to BITS', 'Device requests']],
    ] as const) {
      expect(subs).toContain(`dest: '${label}'`);
      expect(subs).toContain(`tabs(${JSON.stringify(tabs).replace(/"/g, "'").replace(/,/g, ', ')}`);
    }
  });
});

interface RoutesJson {
  readonly pageRoutePatterns: Readonly<Record<string, string>>;
  readonly rows: readonly { readonly id: string; readonly designed: boolean }[];
}

const ROUTES = json<RoutesJson>(join(REPO, 'v2', 'docs', 'v46', 'routes.json'));

describe('routes and screens (ADR-0005; the route register, docs/v46/routes.json)', () => {
  it.each(PLATFORM_ROLES.map((role) => [ROLE_LABEL[role], role] as const))(
    '%s: every destination opens its screen at the register’s route; Help at <base>/help',
    (_label, role) => {
      const config = WORKSPACE_NAV[role];
      for (const destination of config.destinations) {
        expect(ROUTES.pageRoutePatterns[destination.href], destination.label).toBe(
          destination.screen,
        );
        expect(destination.href.startsWith(config.base), destination.href).toBe(true);
      }
      expect(ROUTES.pageRoutePatterns[config.help.href]).toBe('XS-07');
    },
  );

  it('My device opens ST-18 at the register’s route', () => {
    expect(ROUTES.pageRoutePatterns[MY_DEVICE.href]).toBe(MY_DEVICE.screen);
  });

  it('every screen the navigation names is a designed screen of the register (no excluded id)', () => {
    const designed = new Set(ROUTES.rows.filter((row) => row.designed).map((row) => row.id));
    for (const id of WORKSPACE_SCREEN_IDS) expect(designed.has(id), id).toBe(true);
    expect(new Set(WORKSPACE_SCREEN_IDS).size).toBe(WORKSPACE_SCREEN_IDS.length);
  });

  it('no Settings, Reports, role switcher, licence meter or other undrawn destination in any workspace', () => {
    const labels = PLATFORM_ROLES.flatMap((role) =>
      WORKSPACE_NAV[role].destinations.map((destination) => destination.label),
    );
    for (const word of [
      /settings/i,
      /reports?$/i,
      /switch/i,
      /viewing as/i,
      /demo/i,
      /allocation/i,
      /licen[cs]e/i,
      /meter/i,
      /choose|workspace/i,
    ]) {
      expect(
        labels.filter((label) => word.test(label)),
        String(word),
      ).toEqual([]);
    }
  });
});

describe('the public header (a surface, not a role: BC1)', () => {
  it('navigation.json "Public header", after HB-02 ("Request access" → PU-07, as the boards link)', () => {
    const entry = NAVIGATION.roles.find((candidate) => candidate.surface === 'Public header')!;
    const drawn = entry.primary.map((item) => {
      const [label, target] = item.split(' → ');
      return [label!.replace(' (n)', ''), target!.replace(' section', '')] as const;
    });
    expect(drawn.at(-1)).toEqual(['Request access', 'PU-08']);
    expect(PUBLIC_HEADER_NAV.map((item) => [item.label, item.screen])).toEqual([
      ...drawn.slice(0, -1),
      ['Request access', 'PU-07'],
    ]);
    expect(PUBLIC_HEADER_NAV.find((item) => item.counted)?.label).toBe('Selection');
  });

  it('B1-01 draws the same six items and targets (the board wins: Request access → B1-06 Selection)', () => {
    const text = board('B1-01-Public-Landing.dc.html');
    const start = text.indexOf('<header class="xp-head">');
    const head = text.slice(start, text.indexOf('</header>', start));
    for (const fragment of [
      '<a href="B1-04-Catalogue.dc.html">Browse experiments</a>',
      '<a href="B1-03-Areas-and-Course.dc.html">Areas</a>',
      '<a href="B1-01-Public-Landing.dc.html#for-institutions">For institutions</a>',
      '<a class="xp-sel" href="B1-06-Selection.dc.html" aria-label="Selection, empty">',
      '<span class="xp-sel-label">Selection</span>',
      '<a class="xp-signin" href="B1-09-Sign-In.dc.html">Sign in</a>',
      '<a class="xr-btn xr-btn--on-dark xp-access" href="B1-06-Selection.dc.html">Request access</a>',
    ]) {
      expect(head).toContain(fragment);
    }
    // The routes the items open are the register's.
    for (const item of PUBLIC_HEADER_NAV) {
      const path = item.href.split('#')[0] || '/';
      expect(ROUTES.pageRoutePatterns[path], item.label).toBe(item.screen);
    }
  });
});

/**
 * The `@xr/ui/v3` surface (ADR-0010): the recorded runtime exports, kept apart from the v46 root
 * entry, the two V3 entry points in the manifest, and the foundation id.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import * as root from '../index.js';
import * as v3 from './index.js';

const RUNTIME_EXPORTS = [
  'AccountMenu',
  'AskList',
  'AskRow',
  'AttentionPanel',
  'Banner',
  'Breadcrumbs',
  'Button',
  'ButtonLink',
  'CalmState',
  'CategorySwitch',
  'CellLines',
  'ChangeSummary',
  'CheckGroup',
  'ChoiceGroup',
  'CodeKey',
  'ConfirmDialog',
  'ContentStack',
  'CourseCode',
  'CourseGroup',
  'DecisionOutcome',
  'DecisionPanel',
  'DefinitionList',
  'DetailLayout',
  'ErrorSummary',
  'EventSteps',
  'ExperimentCard',
  'FORMAT_ORDER',
  'FOUNDATION_ID',
  'FOUNDATION_SOURCES',
  'FactStrip',
  'Field',
  'FieldError',
  'FilterToolbar',
  'FormatBadges',
  'FormatCells',
  'FormatKey',
  'Glyph',
  'HiddenHeading',
  'Hint',
  'Icon',
  'IdentityBand',
  'InstitutionCode',
  'LegendBar',
  'LinkTabs',
  'ListFoot',
  'ListState',
  'ListSurface',
  'LoadingCards',
  'LoadingRows',
  'LockedValue',
  'MetaSeparator',
  'MissingTag',
  'Notice',
  'OverviewHead',
  'PRODUCT_NAME',
  'PageHead',
  'PendingHint',
  'PlanBand',
  'PlanNote',
  'PlanSheet',
  'PriorityBand',
  'QueueGroups',
  'Quote',
  'RecordLine',
  'RecordTable',
  'SearchInput',
  'SectionHead',
  'Select',
  'SortBar',
  'Split',
  'StatusPill',
  'Surface',
  'SurfaceSection',
  'TabPanel',
  'Tabs',
  'TermTrack',
  'TextInput',
  'TextLink',
  'Textarea',
  'Timeline',
  'TopLineSeparator',
  'V3_ICON_PATHS',
  'V3_LOGO_SLOT_TEXT',
  'V46Island',
  'VisuallyHidden',
  'WorkspaceShell',
  'tabPanelId',
  'toV3Tone',
  'useFieldControl',
  'useInlineSize',
];

describe('@xr/ui/v3 surface', () => {
  it('exports exactly the recorded V3 API', () => {
    expect(Object.keys(v3).sort()).toEqual([...RUNTIME_EXPORTS].sort());
  });

  it('is foundation XR-V3-RB-1.0', () => {
    expect(v3.FOUNDATION_ID).toBe('XR-V3-RB-1.0');
  });

  it('adds nothing to the v46 root entry; a shared name is a separate V3 implementation', () => {
    for (const name of ['ListSurface', 'FOUNDATION_ID', 'V46Island', 'TermTrack', 'PlanBand']) {
      expect(Object.keys(root)).not.toContain(name);
    }
    const shared = Object.keys(v3).filter((name) => name in root);
    expect(shared.sort()).toEqual(
      [
        'AccountMenu',
        'Breadcrumbs',
        'Button',
        'ConfirmDialog',
        'DecisionPanel',
        'ErrorSummary',
        'Field',
        'FieldError',
        'Icon',
        'Notice',
        'Select',
        'StatusPill',
        'TextInput',
        'Textarea',
        'Timeline',
        'VisuallyHidden',
        'WorkspaceShell',
        'useFieldControl',
      ].sort(),
    );
    for (const name of shared) {
      expect((v3 as Record<string, unknown>)[name], name).not.toBe(
        (root as Record<string, unknown>)[name],
      );
    }
  });

  it('never exports a Slice-1 name (Card, cx, AppShell, PlacesMeter, FormatLegend, FormatChip)', () => {
    for (const name of ['Card', 'cx', 'AppShell', 'PlacesMeter', 'FormatLegend', 'FormatChip']) {
      expect(Object.keys(v3)).not.toContain(name);
    }
  });

  it('the manifest maps ./v3 to the built entry and ./styles-v3.css to the V3 stylesheet entry', () => {
    const manifest = JSON.parse(
      readFileSync(join(import.meta.dirname, '..', '..', 'package.json'), 'utf8'),
    ) as { exports: Record<string, unknown> };
    expect(manifest.exports['./v3']).toEqual({
      types: './dist/v3/index.d.ts',
      default: './dist/v3/index.js',
    });
    expect(manifest.exports['./styles-v3.css']).toBe('./src/styles/v3/index.css');
  });
});

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
  'AccountMenuInV46Shell',
  'accountMenuName',
  'ActionGroup',
  'ActionValue',
  'AskList',
  'AskRow',
  'AttentionPanel',
  'Banner',
  'Breadcrumbs',
  'Bullets',
  'Button',
  'ButtonLink',
  'ButtonRow',
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
  'Disclosure',
  'EntryCard',
  'EntryForm',
  'EntryHeading',
  'EntryPage',
  'ErrorSummary',
  'EventSteps',
  'ExperimentCard',
  'FactStrip',
  'Field',
  'FieldError',
  'FieldRow',
  'FileInput',
  'FilterToolbar',
  'Footnote',
  'FormActions',
  'FORMAT_ORDER',
  'FormatBadges',
  'FormatCells',
  'FormatKey',
  'FOUNDATION_ID',
  'FOUNDATION_SOURCES',
  'Glyph',
  'GoButton',
  'HelpColumn',
  'HelpFoot',
  'HiddenHeading',
  'Hint',
  'Icon',
  'IdentityBand',
  'InlineForm',
  'InstitutionCode',
  'InstitutionFormatActivity',
  'InstitutionInlineLabel',
  'InstitutionPeople',
  'InstitutionPerson',
  'InstitutionPlanExperiments',
  'LegendBar',
  'LinkTabs',
  'ListFoot',
  'ListState',
  'ListSurface',
  'LiveStatus',
  'LoadingCards',
  'LoadingRows',
  'LockedValue',
  'MessagePage',
  'MetaSeparator',
  'MissingTag',
  'Notice',
  'OperationsRowHead',
  'OperationsSectionHead',
  'OptionalMark',
  'OrRule',
  'OverviewHead',
  'PageHead',
  'PasswordInput',
  'PendingHint',
  'PlanBand',
  'PlanNote',
  'PlanSheet',
  'PriorityBand',
  'PRODUCT_NAME',
  'PrototypeNote',
  'QueueCalm',
  'QueueFrame',
  'QueueGroups',
  'QueueLoading',
  'QuietLine',
  'Quote',
  'ReadOnlyTable',
  'RecordLine',
  'RecordList',
  'RecordTable',
  'RefusalSummary',
  'ReportFormSurface',
  'ReportListSurface',
  'ReportRows',
  'ReportSection',
  'SaMessage',
  'ScopeItem',
  'ScopeList',
  'SearchInput',
  'SectionHead',
  'SectionNote',
  'Select',
  'SortBar',
  'Split',
  'StandList',
  'StatusPill',
  'StructureAreaGroup',
  'StructureLinks',
  'StructureReadOnlyCode',
  'Surface',
  'SurfaceSection',
  'SwitchToolbar',
  'TabPanel',
  'tabPanelId',
  'Tabs',
  'TermTrack',
  'Textarea',
  'TextInput',
  'TextLink',
  'Timeline',
  'TopLineSeparator',
  'toV3Tone',
  'TroubleLinks',
  'useFieldControl',
  'useInlineSize',
  'V3_ICON_PATHS',
  'V3_LOGO_SLOT_TEXT',
  'V3Region',
  'V46Island',
  'VisuallyHidden',
  'WaitingList',
  'WorkspaceShell',
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
        'FileInput',
        'Icon',
        'MessagePage',
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

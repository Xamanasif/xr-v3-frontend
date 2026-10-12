/**
 * The public surface of @xr/ui (WP-0.6; WP-0.7 adds DataTableSortBar): the stylesheet entry, the
 * generated constants and the Phase-0 components (LEDGER.md). An export added or removed is a
 * deliberate API change and must be recorded here; Slice-1 names never appear.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import * as ui from './index.js';

const packageRoot = join(import.meta.dirname, '..');
const manifest = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')) as {
  exports: Record<string, unknown>;
  files: string[];
};

const RUNTIME_EXPORTS = [
  // Foundation
  'Avatar',
  'AttentionItem',
  'AttentionList',
  'BackLink',
  'Breadcrumbs',
  'Button',
  'CountBadge',
  'EmptyState',
  'FailedState',
  'FormatBadge',
  'FormatGlyph',
  'FormatSet',
  'Icon',
  'IconButton',
  'IdChip',
  'JumpLink',
  'Link',
  'LoadingState',
  'LogoPlaceholder',
  'MessagePage',
  'NoMatch',
  'Notice',
  'NOTICE_TONE_ICONS',
  'Num',
  'PageHeader',
  'Row',
  'RowEnd',
  'RowLink',
  'Rows',
  'Section',
  'SectionBody',
  'ShellBanner',
  'Skeleton',
  'SkipLink',
  'Stack',
  'StatusPill',
  'STATUS_TONE_ICONS',
  'TabCount',
  'Text',
  'VisuallyHidden',
  // Forms
  'Checkbox',
  'CheckboxGroup',
  'ChoiceCard',
  'ChoiceList',
  'ErrorSummary',
  'Field',
  'FieldError',
  'FileInput',
  'FormFooter',
  'Radio',
  'RadioGroup',
  'ReadOnlyValue',
  'SegmentedControl',
  'Select',
  'Stepper',
  'stepCountText',
  'Textarea',
  'TextInput',
  'useFieldControl',
  // Data display
  'DataTable',
  'DataTableSortBar',
  'DecisionLayout',
  'DecisionPanel',
  'ListToolbar',
  'RecordHubTabs',
  'SectionTabs',
  'StatusTabs',
  'Timeline',
  // Overlays
  'AccountMenu',
  'ConfirmDialog',
  'DrawerCloseButton',
  'DrawerMenuButton',
  'DrawerScrim',
  'EditDialog',
  'RailTooltip',
  'ReasonDialog',
  'useDrawer',
  // Shells
  'HelpReportDetail',
  'HelpReportForm',
  'HelpReportSent',
  'HelpSupportHome',
  'MAX_DESTINATIONS',
  'NavItem',
  'Sidebar',
  'TopBar',
  'useWorkspaceShell',
  'WorkspaceShell',
  // Infrastructure and generated constants
  'BOARD_TWO_LABELS',
  'FORMAT_GLYPH_PATHS',
  'ICON_PATHS',
  'LinkProvider',
  'useLinkComponent',
  'V46_CONTAINER_THRESHOLDS',
  'V46_FOCUS_COLOURS',
];

describe('@xr/ui package surface', () => {
  it('exports exactly the recorded Phase-0 API', () => {
    expect(Object.keys(ui).sort()).toEqual([...RUNTIME_EXPORTS].sort());
  });

  it('never exports a Slice-1 name (Card, cx, AppShell, PlacesMeter, FormatLegend, FormatChip)', () => {
    for (const name of ['Card', 'cx', 'AppShell', 'PlacesMeter', 'FormatLegend', 'FormatChip']) {
      expect(Object.keys(ui)).not.toContain(name);
    }
  });

  it('exports the v46 stylesheet entry as ./styles.css and ships the styles folder', () => {
    expect(manifest.exports['./styles.css']).toBe('./src/styles/index.css');
    expect(existsSync(join(packageRoot, 'src', 'styles', 'index.css'))).toBe(true);
    expect(manifest.files).toContain('src/styles');
  });

  it('has no placeholder token stylesheet (one token system: xr-foundation.css)', () => {
    expect(Object.keys(manifest.exports).sort()).toEqual(['.', './styles.css']);
    expect(existsSync(join(packageRoot, 'src', 'tokens.css'))).toBe(false);
  });
});

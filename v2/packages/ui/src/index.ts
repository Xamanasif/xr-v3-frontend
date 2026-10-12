/**
 * @xr/ui — the frozen v46 visual system (docs/decisions/ADR-0001).
 *
 * Stylesheets: `@xr/ui/styles.css` (the eight verbatim v46 sheets in one `xr.v46` layer plus the
 * `xr.product` layer). Components emit the v46 board classes and ARIA exactly (Appendix E §3;
 * Appendix F WP-0.6); links are injected through `LinkProvider` (no `next/*` here).
 */
export { V46_CONTAINER_THRESHOLDS, V46_FOCUS_COLOURS } from './tokens/v46-constants.js';
export {
  BOARD_TWO_LABELS,
  FORMAT_GLYPH_PATHS,
  ICON_PATHS,
  type FormatCode,
  type IconName,
} from './icons/registry.js';
export {
  LinkProvider,
  useLinkComponent,
  type LinkComponent,
  type LinkRenderProps,
} from './link.js';

// Foundation
export { Button, type ButtonProps, type ButtonVariant } from './foundation/button.js';
export { IconButton, type IconButtonProps } from './foundation/icon-button.js';
export { FormatGlyph, Icon, type IconProps, type IconSize } from './foundation/icon.js';

// Foundation
export {
  Link,
  BackLink,
  JumpLink,
  type LinkProps,
  type BackLinkProps,
  type JumpLinkProps,
} from './foundation/links.js';
export {
  FormatBadge,
  FormatSet,
  type FormatBadgeProps,
  type FormatSetProps,
  type FormatSetItem,
  type FormatVariant,
} from './foundation/format-badge.js';
export {
  StatusPill,
  STATUS_TONE_ICONS,
  type StatusPillProps,
  type StatusTone,
} from './foundation/status-pill.js';
export { Notice, type NoticeProps } from './foundation/notice.js';
export { NOTICE_TONE_ICONS, type NoticeTone } from './foundation/notice-tones.js';
export {
  ShellBanner,
  type ShellBannerProps,
  type ShellBannerKind,
} from './foundation/shell-banner.js';
export {
  EmptyState,
  NoMatch,
  FailedState,
  LoadingState,
  Skeleton,
  type EmptyStateProps,
  type NoMatchProps,
  type FailedStateProps,
  type LoadingStateProps,
  type LoadingSurface,
} from './foundation/states.js';
export {
  MessagePage,
  type MessagePageProps,
  type MessageAction,
} from './foundation/message-page.js';
export {
  Section,
  SectionBody,
  Stack,
  type SectionProps,
  type TitledSectionProps,
  type LabelledSectionProps,
  type SurfaceSectionProps,
  type SectionBodyProps,
  type StackProps,
} from './foundation/section.js';
export { PageHeader, type PageHeaderProps } from './foundation/page-header.js';
export {
  Breadcrumbs,
  type BreadcrumbsProps,
  type BreadcrumbLevel,
} from './foundation/breadcrumbs.js';
export { LogoPlaceholder, type LogoPlaceholderProps } from './foundation/logo-placeholder.js';
export {
  Avatar,
  CountBadge,
  TabCount,
  type AvatarProps,
  type CountBadgeProps,
  type TabCountProps,
} from './foundation/avatar.js';
export { IdChip, type IdChipProps } from './foundation/id-chip.js';
export {
  Text,
  Num,
  VisuallyHidden,
  type TextProps,
  type TextElement,
  type TypeStyle,
  type NumProps,
  type VisuallyHiddenProps,
} from './foundation/typography.js';
export {
  Rows,
  Row,
  RowEnd,
  RowLink,
  AttentionItem,
  AttentionList,
  type RowsProps,
  type RowProps,
  type RowEndProps,
  type RowLinkProps,
  type RowContentProps,
  type RowTone,
  type AttentionItemProps,
  type AttentionAction,
  type AttentionListProps,
} from './foundation/rows.js';
export { SkipLink, type SkipLinkProps } from './foundation/skip-link.js';

// Forms
export {
  Field,
  FieldError,
  ReadOnlyValue,
  useFieldControl,
  type FieldProps,
  type FieldControl,
  type FieldErrorProps,
  type FieldErrorClass,
  type ReadOnlyValueProps,
} from './forms/field.js';
export { TextInput, type TextInputProps, type TextInputType } from './forms/text-input.js';
export { Select, type SelectProps, type SelectOption } from './forms/select.js';
export { Textarea, type TextareaProps } from './forms/textarea.js';
export {
  CheckboxGroup,
  Checkbox,
  RadioGroup,
  Radio,
  ChoiceCard,
  ChoiceList,
  type ChoiceGroupProps,
  type ChoiceLegendClass,
  type ChoiceErrorPlacement,
  type CheckboxProps,
  type RadioGroupProps,
  type RadioProps,
  type ChoiceCardProps,
} from './forms/choice.js';
export {
  SegmentedControl,
  type SegmentedControlProps,
  type SegmentedOption,
} from './forms/segmented-control.js';
export { FileInput, type FileInputProps } from './forms/file-input.js';
export { Stepper, stepCountText, type StepperProps } from './forms/stepper.js';
export {
  ErrorSummary,
  type ErrorSummaryItem,
  type ErrorSummaryProps,
} from './forms/error-summary.js';
export {
  FormFooter,
  type FormFooterButton,
  type FormFooterProps,
  type FormFooterStart,
} from './forms/form-footer.js';

// Overlays
export {
  ConfirmDialog,
  ReasonDialog,
  EditDialog,
  type ConfirmDialogProps,
  type ReasonDialogProps,
  type EditDialogProps,
  type DialogCommonProps,
  type DialogAlign,
} from './overlays/dialog.js';
export {
  useDrawer,
  DrawerMenuButton,
  DrawerCloseButton,
  DrawerScrim,
  type DrawerController,
  type DrawerCloseOptions,
  type DrawerMenuButtonProps,
  type DrawerCloseButtonProps,
  type DrawerScrimProps,
} from './overlays/drawer.js';
export {
  AccountMenu,
  type AccountMenuProps,
  type AccountMenuItem,
  type AccountMenuLinkItem,
  type AccountMenuButtonItem,
  type AccountMenuSeparator,
} from './overlays/account-menu.js';
export { RailTooltip, type RailTooltipProps } from './overlays/rail-tooltip.js';

// Data display
export {
  DataTable,
  type DataTableProps,
  type DataTableColumn,
  type DataTablePrimaryColumn,
  type DataTableHeaderCellProps,
  type DataTableRowState,
  type DataTableEmpty,
  type DataTableNoMatch,
  type DataTableFailed,
} from './data/data-table.js';
export {
  ListToolbar,
  type ListToolbarProps,
  type ListToolbarSearch,
  type ListToolbarFilter,
  type ListToolbarMoreFilters,
  type FilterChip,
} from './data/list-toolbar.js';
export {
  SectionTabs,
  RecordHubTabs,
  StatusTabs,
  type SectionTabsProps,
  type RecordHubTabsProps,
  type StatusTabsProps,
  type SectionTab,
  type StatusTab,
  type TabsSurface,
} from './data/tabs.js';
export { Timeline, type TimelineProps, type TimelineEvent } from './data/timeline.js';
export {
  DecisionLayout,
  DecisionPanel,
  type DecisionLayoutProps,
  type DecisionPanelProps,
  type DecisionPanelPosition,
} from './data/decision-layout.js';

// Shells
export {
  WorkspaceShell,
  useWorkspaceShell,
  type WorkspaceShellProps,
  type WorkspaceShellContextValue,
  type SidebarPreference,
  type PageWrap,
} from './shells/workspace-shell.js';
export { Sidebar, type SidebarProps, type SidebarHelp } from './shells/sidebar.js';
export { MAX_DESTINATIONS } from './shells/limits.js';
export {
  NavItem,
  type NavItemProps,
  type NavDestination,
  type NavCount,
} from './shells/nav-item.js';
export { TopBar, type TopBarProps, type TopBarCollapse } from './shells/top-bar.js';
export {
  HelpSupportHome,
  HelpReportForm,
  HelpReportSent,
  HelpReportDetail,
  type HelpSupportHomeProps,
  type HelpReportFormProps,
  type HelpReportSentProps,
  type HelpReportDetailProps,
  type HelpReportSummary,
  type HelpReportStatus,
} from './shells/help-support.js';

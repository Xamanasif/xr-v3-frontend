/**
 * @xr/ui/v3 — the V3 Refined Direction B presentation layer (foundation XR-V3-RB-1.0;
 * docs/decisions/ADR-0010; reference design/v3-refined-b/).
 *
 * Stylesheet: `@xr/ui/styles-v3.css` (the frozen Refined B sheets and the XS extension sheet of the
 * owner-approved Entry & shared export, every selector confined to a V3 root, in `xr.v3`; plus the
 * central V3P patches). Components emit the Refined B class names and
 * ARIA; behaviour is shared with the v46 components where it exists (the drawer, the modal dialog,
 * the account disclosure, the error-summary links). Nothing here holds application data, a sample
 * record or a business rule: every word, figure, date and destination comes from the caller.
 * `COMPONENT-EXTENSIONS.md` lists each component, its source and the V3P patches.
 */
export { FOUNDATION_ID, FOUNDATION_SOURCES } from './provenance.js';
export {
  V3_ICON_PATHS,
  Icon,
  Glyph,
  type V3IconName,
  type V3IconSize,
  type V3IconProps,
} from './icons.js';
export {
  Button,
  ButtonLink,
  TextLink,
  type ButtonProps,
  type ButtonLinkProps,
  type ButtonVariant,
  type TextLinkProps,
} from './actions.js';
export { StatusPill, toV3Tone, type StatusPillProps, type StatusTone } from './status.js';
export {
  FORMAT_ORDER,
  FormatBadges,
  FormatCells,
  FormatKey,
  type FormatBadgesProps,
  type FormatCell,
  type FormatCellsProps,
  type FormatKeyItem,
  type FormatKeyProps,
  type FormatState,
} from './formats.js';
export { CourseCode, InstitutionCode, MissingTag, type CourseCodeProps } from './codes.js';
export { V46Island } from './island.js';
export {
  Breadcrumbs,
  PageHead,
  MetaSeparator,
  SectionHead,
  Surface,
  SurfaceSection,
  Split,
  VisuallyHidden,
  HiddenHeading,
  type BreadcrumbLevel,
  type BreadcrumbsProps,
  type PageHeadProps,
  type SectionHeadProps,
  type SurfaceProps,
  type SurfaceSectionProps,
} from './page.js';
export {
  LinkTabs,
  Tabs,
  TabPanel,
  tabPanelId,
  type LinkTab,
  type LinkTabsProps,
  type PanelTab,
  type TabsProps,
  type TabPanelProps,
} from './tabs.js';
export {
  Field,
  FieldError,
  useFieldControl,
  TextInput,
  SearchInput,
  Select,
  Textarea,
  ChoiceGroup,
  CheckGroup,
  ErrorSummary,
  PendingHint,
  ChangeSummary,
  LockedValue,
  Hint,
  type HintProps,
  type FieldControl,
  type FieldProps,
  type TextInputProps,
  type SelectOption,
  type SelectProps,
  type TextareaProps,
  type ChoiceOption,
  type ChoiceGroupProps,
  type CheckOption,
  type CheckGroupProps,
  type ErrorSummaryItem,
  type ErrorSummaryProps,
  type ChangeSummaryProps,
} from './fields.js';
export {
  useInlineSize,
  ListSurface,
  SortBar,
  RecordTable,
  CellLines,
  FilterToolbar,
  ListState,
  LoadingRows,
  LoadingCards,
  ListFoot,
  type ListSurfaceProps,
  type SortDirection,
  type RecordTableSort,
  type RecordTableRow,
  type RecordTableHeaders,
  type RecordTableProps,
  type ToolbarSelect,
  type ToolbarChip,
  type FilterToolbarProps,
  type ListStateKind,
  type ListStateProps,
} from './list.js';
export {
  DetailLayout,
  FactStrip,
  DefinitionList,
  AskRow,
  AskList,
  Quote,
  Timeline,
  EventSteps,
  DecisionPanel,
  DecisionOutcome,
  StandList,
  RecordLine,
  type DetailLayoutProps,
  type StandItem,
  type Fact,
  type AskRowProps,
  type TimelineEvent,
  type EventStep,
  type DecisionPanelProps,
  type DecisionOutcomeProps,
} from './detail.js';
export {
  Notice,
  Banner,
  PlanNote,
  type NoticeTone,
  type NoticeProps,
  type BannerProps,
  type PlanNoteTone,
  type PlanNoteProps,
} from './notices.js';
export { ConfirmDialog, type ConfirmDialogGroup, type ConfirmDialogProps } from './dialog.js';
export {
  WorkspaceShell,
  TopLineSeparator,
  PRODUCT_NAME,
  V3_LOGO_SLOT_TEXT,
  type ShellDestination,
  type ShellHelp,
  type WorkspaceShellProps,
} from './shell.js';
export {
  AccountMenu,
  AccountMenuInV46Shell,
  accountMenuName,
  type AccountMenuLink,
  type AccountMenuProps,
} from './account.js';
export { V3Region } from './region.js';
export {
  EntryPage,
  EntryCard,
  EntryHeading,
  EntryForm,
  OrRule,
  RefusalSummary,
  PasswordInput,
  FieldRow,
  TroubleLinks,
  Disclosure,
  LiveStatus,
  PrototypeNote,
  type EntryPageProps,
  type EntryCardProps,
  type PasswordInputProps,
  type DisclosureProps,
} from './entry.js';
export { MessagePage, type MessageKind, type MessagePageProps } from './message.js';
export {
  HelpColumn,
  ReportListSurface,
  ReportRows,
  ReportFormSurface,
  OptionalMark,
  FileInput,
  FormActions,
  ReportSection,
  HelpFoot,
  type ReportListSurfaceProps,
  type ReportRow,
} from './help.js';
export { TermTrack, type TermTrackProps } from './term-track.js';
export {
  SaMessage,
  ButtonRow,
  ActionGroup,
  ActionValue,
  WaitingList,
  ReadOnlyTable,
  RecordList,
  Footnote,
  Bullets,
  SwitchToolbar,
  GoButton,
  SectionNote,
  QuietLine,
  InlineForm,
  type SaMessageProps,
  type ActionGroupProps,
  type WaitingItem,
  type ReadOnlyCell,
  type ReadOnlyRow,
  type ReadOnlyTableProps,
  type RecordListRow,
  type SwitchOption,
  type SwitchToolbarProps,
  type QuietLineProps,
} from './sa.js';
// What only one Super Admin screen group draws, one module per group (SA-v1); SA-10 … SA-13
// (Content) need nothing of their own.
export * from './sa-requests.js';
export * from './sa-institutions.js';
export * from './sa-structure.js';
export * from './sa-roles.js';
export * from './sa-operations.js';
// The Vendor role's patterns (VE-v1): what more than one Vendor screen group draws, then what one
// screen group alone draws, one module per group.
export {
  VendorReturnedReason,
  VendorFormatChips,
  VendorDeliveryList,
  VendorDeliveryView,
  VendorSection,
  VendorLearningOutcomes,
  type VendorReference,
  type VendorReturnedReasonProps,
  type VendorFormatChipsProps,
  type VendorDeliveryViewProps,
  type VendorSectionProps,
  type VendorLearningOutcomesProps,
} from './ve.js';
export * from './ve-workspace.js';
export * from './ve-editor.js';
export * from './ve-record.js';
export {
  PlanBand,
  CourseGroup,
  CodeKey,
  ExperimentCard,
  ContentStack,
  LegendBar,
  type PlanBandProps,
  type CourseGroupProps,
  type ExperimentCardProps,
} from './plan.js';
export {
  OverviewHead,
  CategorySwitch,
  PriorityBand,
  QueueGroups,
  IdentityBand,
  AttentionPanel,
  CalmState,
  PlanSheet,
  type ActionLink,
  type Figure,
  type OverviewHeadProps,
  type CategoryOption,
  type CategorySwitchProps,
  type PriorityItem,
  type PriorityBandProps,
  type QueueRow,
  type QueueGroup,
  type GoToLink,
  type IdentityBandProps,
  type AttentionItem,
  type AttentionPanelProps,
  type PlanSheetProps,
} from './overview.js';

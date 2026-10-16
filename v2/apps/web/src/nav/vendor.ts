import type { BreadcrumbLevel } from '@xr/ui';

import { WORKSPACE_NAV } from './nav-config';
import type { ScreenKey } from './screens';

/**
 * The Vendor workspace's Phase-5 pages (boards B5-01 … B5-08; Appendix A register routes): their
 * addresses, titles and places in the shell. Sidebar owners are the active-item map's (Overview;
 * My experiments for VE-02 … VE-09 and VE-13).
 *
 * Top bars as the boards draw them: a destination's own page has no crumbs (B5-01 f0 "Overview",
 * B5-02 f0 "My experiments"); the editor in every mode is "My experiments / Experiment" (B5-03 …
 * B5-05, B5-07); the record "My experiments / Experiment record" (B5-06 f0).
 *
 * The editor's addresses (Appendix A rule S1: the B5 stepper's steps as slugs): a new experiment
 * is `/vendor/experiments/new?step=<slug>` until its first save gives it an id (OD-B5-07); a
 * saved draft is `/vendor/experiments/[submissionId]/edit?step=<slug>` (VE-09; VE-04 … VE-06 are
 * its steps); a returned one is `/vendor/experiments/[submissionId]/revise?step=<slug>` (VE-08).
 * The first step carries no parameter.
 */
type VendorDestination = 'VE-01' | 'VE-02';

const destinationOf = (screen: VendorDestination) =>
  WORKSPACE_NAV.vendor.destinations.find((destination) => destination.screen === screen)!;

export const VENDOR_HOME_ADDRESS = destinationOf('VE-01').href;
export const MY_EXPERIMENTS_ADDRESS = destinationOf('VE-02').href;
export const VENDOR_HELP_ADDRESS = WORKSPACE_NAV.vendor.help.href;

export const VENDOR_OVERVIEW_TITLE = destinationOf('VE-01').label;
export const MY_EXPERIMENTS_TITLE = destinationOf('VE-02').label;

/** "My experiments / Experiment" (B5-03 … B5-05, B5-07 top bars). */
export const EDITOR_CRUMB = 'Experiment';
/** "My experiments / Experiment record" (B5-06 f0). */
export const RECORD_CRUMB = 'Experiment record';

/** The editor's four steps (B5-03 stepper: Course and description · Formats and delivery · Preview and documents · Check and submit). */
export const EDITOR_STEPS = ['course', 'formats', 'preview', 'submit'] as const;
export type EditorStepSlug = (typeof EDITOR_STEPS)[number];

/** The step's screen: VE-03 … VE-06 (each a step of the one editor). */
export const EDITOR_STEP_SCREEN = {
  course: 'VE-03',
  formats: 'VE-04',
  preview: 'VE-05',
  submit: 'VE-06',
} as const satisfies Record<EditorStepSlug, ScreenKey>;

/** `?step=` of an editor address (unknown or missing: the first step). */
export function editorStepOf(search: string): EditorStepSlug {
  const step = new URLSearchParams(search).get('step');
  return (EDITOR_STEPS as readonly string[]).includes(step ?? '')
    ? (step as EditorStepSlug)
    : 'course';
}

function withStep(base: string, step: EditorStepSlug | undefined): string {
  return step && step !== 'course' ? `${base}?step=${step}` : base;
}

/** VE-03: a new experiment (Create experiment). */
export function newExperimentAddress(step?: EditorStepSlug): string {
  return withStep(`${MY_EXPERIMENTS_ADDRESS}/new`, step);
}

/** VE-09 (and VE-04 … VE-06 as its steps): a saved draft. */
export function editDraftAddress(submissionId: string, step?: EditorStepSlug): string {
  return withStep(`${MY_EXPERIMENTS_ADDRESS}/${encodeURIComponent(submissionId)}/edit`, step);
}

/** VE-08: a returned experiment, revised and resubmitted. */
export function reviseAddress(submissionId: string, step?: EditorStepSlug): string {
  return withStep(`${MY_EXPERIMENTS_ADDRESS}/${encodeURIComponent(submissionId)}/revise`, step);
}

/** VE-07 Experiment record; `?tab=history` is VE-13 (Appendix A rule T2). */
export function experimentRecordAddress(
  submissionId: string,
  tab: 'details' | 'history' = 'details',
): string {
  const record = `${MY_EXPERIMENTS_ADDRESS}/${encodeURIComponent(submissionId)}`;
  return tab === 'history' ? `${record}?tab=history` : record;
}

/** VE-02 with a status filter (`?status=`, B5-02 f1 "Filtered: Returned"). */
export function myExperimentsAddress(status?: string): string {
  return status
    ? `${MY_EXPERIMENTS_ADDRESS}?status=${encodeURIComponent(status)}`
    : MY_EXPERIMENTS_ADDRESS;
}

/** A page's place in the shell (the shape `useShellPage` takes). */
export interface VendorPlacement {
  readonly screen: ScreenKey;
  readonly title: string;
  readonly trail: readonly BreadcrumbLevel[];
  readonly currentCrumb?: string;
}

const MY_EXPERIMENTS_CRUMB: BreadcrumbLevel = {
  label: MY_EXPERIMENTS_TITLE,
  href: MY_EXPERIMENTS_ADDRESS,
};

export function vendorOverviewPlacement(): VendorPlacement {
  return { screen: 'VE-01', title: VENDOR_OVERVIEW_TITLE, trail: [] };
}

export function myExperimentsPlacement(): VendorPlacement {
  return { screen: 'VE-02', title: MY_EXPERIMENTS_TITLE, trail: [] };
}

/**
 * The editor (B5-03 … B5-05, B5-07 "My experiments / Experiment"): the step's screen while
 * creating or editing a draft (VE-03 … VE-06; VE-09 on a draft's first step), VE-08 while revising.
 */
export function editorPlacement(
  mode: 'create' | 'edit' | 'revise',
  step: EditorStepSlug,
  title: string,
): VendorPlacement {
  const screen: ScreenKey =
    mode === 'revise'
      ? 'VE-08'
      : mode === 'edit' && step === 'course'
        ? 'VE-09'
        : EDITOR_STEP_SCREEN[step];
  return { screen, title, trail: [MY_EXPERIMENTS_CRUMB], currentCrumb: EDITOR_CRUMB };
}

/** B5-06 f0 "My experiments / Experiment record"; the History tab is VE-13. */
export function experimentRecordPlacement(
  tab: 'details' | 'history',
  title: string,
): VendorPlacement {
  return {
    screen: tab === 'history' ? 'VE-13' : 'VE-07',
    title,
    trail: [MY_EXPERIMENTS_CRUMB],
    currentCrumb: RECORD_CRUMB,
  };
}

/**
 * CM-08 the correction draft (Phase 6; boards B6-09 f1, f2, f4, B6-11 f11, B6-13): the form a
 * correction is edited in, its "Current and proposed" comparison and its checks — features import
 * contracts for types only (Appendix F §3.8), so the runtime pieces live here.
 *
 * - **The form** is the update's saved proposal (`CorrectionUpdate.proposed`, pre-filled from the
 *   live version when it was opened), its "What changes and why" and its version label, with one
 *   delivery field per live format: WEB's web link and each app package's reference (the formats
 *   the experiment has — a correction never changes formats, UPD-07).
 * - **The comparison** is a presentation of the form beside the live version's own values, in the
 *   order the service answers its saved comparison (`CorrectionService.getUpdate().comparison`:
 *   name, summary, description, WEB link, AR · VR · MR package references, then "Version" when the
 *   label is new), so the draft shows unsaved edits as the board does (B6-09 `cmp` reads the typed
 *   values). It reads record values only — the platform and query layers take no rule from
 *   `@xr/domain` (import boundary): what may be sent is the service's answer to the send. A
 *   released update compares the version it corrected with what it released (B6-09 f7).
 * - **Send for academic review** is checked on the page before anything is sent, with the
 *   service's message keys (`CorrectionService.sendForAcademicReview`'s issue mapping: "Say what
 *   changes and why", "Enter the version label, for example 1.3", "Use a new version label — 1.2
 *   is live", "Change at least one catalogue detail or delivery link" — the last read from the
 *   comparison the page shows, "Nothing changed yet."), all at once under "Check the update"
 *   (B6-11 f11). The service decides on the send itself; its `validation-failed` answer is read
 *   the same way. **Withdraw**'s reason is checked with `withdrawUpdateInput` itself.
 */
import {
  type correctionComparisonRow,
  fieldError,
  type FieldError,
  type Out,
  parseInput,
  type saveCorrectionInput,
  type In,
  validationFailed,
  type ValidationFailed,
  withdrawUpdateInput,
} from '@xr/contracts/draft';
import type { CorrectionFields, CorrectionUpdate, Experiment, ExperimentVersion } from '@xr/domain';

import { fieldWords } from '@/copy/field-words';

type ComparisonRow = Out<typeof correctionComparisonRow>;
type SaveInput = In<typeof saveCorrectionInput>;

/** The app packages a correction names by reference (B6-09 "VR · package reference"). */
export type PackageFormat = 'ar' | 'vr' | 'mr';

/** What the correction draft holds on the page (typed, saved or not). */
export interface CorrectionForm {
  readonly whatChangesAndWhy: string;
  readonly name: string;
  readonly summary: string;
  readonly description: string;
  /** WEB's link; `null` when the experiment has no WEB format. */
  readonly webLink: string | null;
  /** One entry per live app-package format, in display order (AR, VR, MR). */
  readonly packageReferences: Readonly<Partial<Record<PackageFormat, string>>>;
  readonly versionLabel: string;
}

/** The draft's three drawn errors, in words (B6-09 `validate`; B6-11 f11). */
export interface CorrectionErrors {
  readonly whatChangesAndWhy?: string;
  readonly versionLabel?: string;
  /** "Change at least one catalogue detail or delivery link" — under the version label. */
  readonly change?: string;
}

/** The app packages in the order the boards draw them and the service compares them (AR · VR · MR). */
const PACKAGE_ORDER: readonly PackageFormat[] = ['ar', 'vr', 'mr'];

/** The live formats a correction's delivery fields follow (display order: WEB · AR · VR · MR). */
export function deliveryFormatsOf(experiment: Experiment): {
  readonly web: boolean;
  readonly packages: readonly PackageFormat[];
} {
  const formats = new Set<string>(experiment.live.formats.map((entry) => entry.format));
  return {
    web: formats.has('web'),
    packages: PACKAGE_ORDER.filter((format) => formats.has(format)),
  };
}

/** A version's correctable values as the record holds them: its catalogue and delivery details. */
function valuesOf(version: ExperimentVersion): CorrectionFields {
  const packageReferences: Partial<Record<PackageFormat, string>> = {};
  let webLink: string | null = null;
  for (const entry of version.formats) {
    const delivery = entry.delivery;
    if (delivery.format === 'web') webLink = delivery.webLink;
    else if (delivery.packageReference)
      packageReferences[delivery.format] = delivery.packageReference;
  }
  return { ...version.catalogue, webLink, packageReferences };
}

/** The values that differ, in the service's order (trimmed: spaces alone change nothing). */
function differing(before: CorrectionFields, proposed: CorrectionFields): readonly string[] {
  const same = (a: string | null | undefined, b: string | null | undefined) =>
    (a ?? '').trim() === (b ?? '').trim();
  return [
    ...(['name', 'summary', 'description', 'webLink'] as const).filter(
      (field) => !same(before[field], proposed[field]),
    ),
    ...PACKAGE_ORDER.filter(
      (format) => !same(before.packageReferences[format], proposed.packageReferences[format]),
    ).map((format) => `package:${format}`),
  ];
}

/** The form for an update: its saved proposal, reason and label, one field per live format. */
export function correctionFormOf(update: CorrectionUpdate, experiment: Experiment): CorrectionForm {
  const formats = deliveryFormatsOf(experiment);
  const packageReferences: Partial<Record<PackageFormat, string>> = {};
  for (const format of formats.packages) {
    packageReferences[format] = update.proposed.packageReferences[format] ?? '';
  }
  return {
    whatChangesAndWhy: update.whatChangesAndWhy ?? '',
    name: update.proposed.name,
    summary: update.proposed.summary,
    description: update.proposed.description,
    webLink: formats.web ? (update.proposed.webLink ?? '') : null,
    packageReferences,
    versionLabel: update.versionLabel ?? '',
  };
}

/** The proposal a form describes (an empty package reference is no reference). */
export function proposedOf(form: CorrectionForm): CorrectionFields {
  const packageReferences: Partial<Record<PackageFormat, string>> = {};
  for (const [format, reference] of Object.entries(form.packageReferences) as [
    PackageFormat,
    string,
  ][]) {
    if (reference.trim() !== '') packageReferences[format] = reference;
  }
  return {
    name: form.name,
    summary: form.summary,
    description: form.description,
    webLink: form.webLink,
    packageReferences,
  };
}

function blankAsNull(text: string): string | null {
  return text.trim() === '' ? null : text;
}

/** `saveCorrection`'s input for a form (Save draft; the save before Send for academic review). */
export function saveInputOf(id: CorrectionUpdate['id'], form: CorrectionForm, expectedRev: number) {
  return {
    id,
    proposed: proposedOf(form),
    whatChangesAndWhy: blankAsNull(form.whatChangesAndWhy),
    versionLabel: blankAsNull(form.versionLabel),
    expectedRev,
  } satisfies SaveInput;
}

/** Whether a form differs from what the update has saved (Save draft has something to keep). */
export function formDiffers(form: CorrectionForm, saved: CorrectionForm): boolean {
  return JSON.stringify(form) !== JSON.stringify(saved);
}

/** "Description · Live now … · Proposed …": the changed fields, then "Version" when it is new. */
function rowsOf(
  before: CorrectionFields,
  beforeLabel: string,
  proposed: CorrectionFields,
  versionLabel: string,
): readonly ComparisonRow[] {
  const rows: ComparisonRow[] = differing(before, proposed).map((changed) => {
    if (changed.startsWith('package:')) {
      const format = changed.slice('package:'.length) as PackageFormat;
      return {
        field: 'packageReferences',
        format,
        liveNow: before.packageReferences[format] ?? null,
        proposed: proposed.packageReferences[format] ?? null,
      };
    }
    const key = changed as 'name' | 'summary' | 'description' | 'webLink';
    return { field: key, format: null, liveNow: before[key], proposed: proposed[key] };
  });
  const label = versionLabel.trim();
  return label !== '' && label !== beforeLabel
    ? [...rows, { field: 'version', format: null, liveNow: beforeLabel, proposed: label }]
    : rows;
}

/** The draft's comparison: the form against the live version, unsaved edits included (B6-09 f1, f2). */
export function formComparison(
  form: CorrectionForm,
  experiment: Experiment,
): readonly ComparisonRow[] {
  return rowsOf(
    valuesOf(experiment.live),
    experiment.live.label,
    proposedOf(form),
    form.versionLabel,
  );
}

/**
 * A released update's comparison (B6-09 f7): the version it corrected beside what it released.
 * The service compares with the live version, which is now the update's own; `null` when the
 * corrected version is not in the experiment's history.
 */
export function releasedComparison(
  update: CorrectionUpdate,
  experiment: Experiment,
): readonly ComparisonRow[] | null {
  const base = experiment.versions.find((version) => version.label === update.baseVersionLabel);
  if (!base) return null;
  return rowsOf(valuesOf(base), base.label, update.proposed, update.versionLabel ?? '');
}

/** A `validation-failed` answer as the draft's errors (the catalogue's drawn words). */
export function correctionErrorsOf(error: ValidationFailed): CorrectionErrors {
  const errors: { whatChangesAndWhy?: string; versionLabel?: string; change?: string } = {};
  for (const item of error.fieldErrors) {
    const words = fieldWords(item);
    if (!words) continue;
    if (item.key === 'CM-08.whatChangesAndWhy.required') errors.whatChangesAndWhy ??= words;
    else if (item.key.startsWith('CM-08.versionLabel.')) errors.versionLabel ??= words;
    else if (item.key === 'CM-08.proposed.change-something') errors.change ??= words;
  }
  return errors;
}

/**
 * B6-09 `validate` before Send for academic review, with the service's keys and fields: a reason,
 * a version label that is not the live one, and at least one changed catalogue detail or delivery
 * link — every error at once (B6-11 f11). `null` when the form may be sent.
 */
export function checkCorrection(
  form: CorrectionForm,
  experiment: Experiment,
): ValidationFailed | null {
  const errors: FieldError[] = [];
  if (form.whatChangesAndWhy.trim() === '') {
    errors.push(fieldError('whatChangesAndWhy', 'CM-08.whatChangesAndWhy.required'));
  }
  const label = form.versionLabel.trim();
  if (label === '') errors.push(fieldError('versionLabel', 'CM-08.versionLabel.required'));
  else if (label === experiment.live.label) {
    errors.push(
      fieldError('versionLabel', 'CM-08.versionLabel.same-as-live', {
        live: experiment.live.label,
      }),
    );
  }
  if (differing(valuesOf(experiment.live), proposedOf(form)).length === 0) {
    errors.push(fieldError('proposed.summary', 'CM-08.proposed.change-something'));
  }
  return errors.length > 0 ? validationFailed(errors, 'CM-08') : null;
}

/** DL-2 Withdraw: the reason is required ("Add a reason for withdrawing this update"). */
export function checkWithdrawReason(reason: string): string | null {
  const parsed = parseInput(withdrawUpdateInput, { id: 'UPD-0000', reason, expectedRev: 1 }, null);
  if (parsed.ok) return null;
  return withdrawErrorOf(parsed.error);
}

/** A withdraw's `validation-failed` answer as the reason's error words. */
export function withdrawErrorOf(error: ValidationFailed): string | null {
  const item = error.fieldErrors.find((entry) => entry.key === 'CM-08.reason.required');
  return item ? fieldWords(item) : null;
}

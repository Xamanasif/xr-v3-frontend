'use client';

/*
 * What only the four-step editor draws: VE-03 to VE-06, VE-08 revise and VE-09 edit draft (`ve-`
 * and `vr-` classes; the owner-approved Vendor export, design/v3-refined-b/roles/VE-v1,
 * `project/v3-vendor.css` and its COMPONENT-EXTENSIONS.md). Markup as the export's `Main.dc.html`
 * draws it (the editor, its outcome, read-only and refusal views). The returned-reason panel, the
 * read-only delivery blocks, the format chips, the titled sections and the learning outcomes the
 * editor shares with the record are in `ve.tsx`. Every word, figure, date and destination comes
 * from the caller; nothing here holds a rule.
 *
 * Where the export differs from what ships: its sprite `<use href="#vei-…">` is the kit's path
 * (`Glyph`, the same drawings); `vr-w6`, which no rule of the role sheet styles, is not emitted;
 * the sample-label marker after a file name is not shown (sample labels do not ship, T-36); the
 * export's inline `margin-top: 10px` on the formats' error and `margin: 0` on the refusal's eyebrow
 * are the product classes `rk-x-ferr-above` and `rk-x-eyebrow-flush` (V3P-13).
 */
import {
  createContext,
  useContext,
  type FocusEvent,
  type InputHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type Ref,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

import { joinClasses } from '../internal/classes.js';
import { Button } from './actions.js';
import { DefinitionList } from './detail.js';
import { FieldError } from './fields.js';
import { Glyph, type V3IconName } from './icons.js';
import { StatusPill, type StatusTone } from './status.js';
import { VendorDeliveryList, VendorFormatChips, VendorSection, WithVendorOptional } from './ve.js';

// ---- statuses -----------------------------------------------------------------------------------

/** A live status in the editor: `ok` tick, `err` diamond, `warn` half disc, `neutral` dot. */
export type VendorEditorTone = 'ok' | 'err' | 'warn' | 'neutral';

export interface VendorEditorStatus {
  readonly tone: VendorEditorTone;
  /** "Complete", "2 still needed", "1 to fix", "Provided", "None — optional". */
  readonly words: string;
}

function smallStatusClasses(tone: VendorEditorTone, extra?: string): string {
  return joinClasses('xr-st', tone !== 'neutral' && `xr-st--${tone}`, 'vr-st-sm', extra);
}

/** The small status of a block, a part or a review section (`span.xr-st.vr-st-sm`). */
export function VendorEditorStatusPill({
  status,
  inBlockHead = false,
}: {
  readonly status: VendorEditorStatus;
  /** Pushed to the end of a delivery block's head (`vr-dlv-st`). */
  readonly inBlockHead?: boolean;
}) {
  return (
    <span className={smallStatusClasses(status.tone, inBlockHead ? 'vr-dlv-st' : undefined)}>
      <i />
      {status.words}
    </span>
  );
}

// ---- the frame: stepper, form surface, step outline ---------------------------------------------

/** One part of a step in the outline: a group of step 1, a chosen format of step 2. */
export interface VendorEditorPart {
  readonly key: string;
  /** "Course and name", "WEB · Browser". */
  readonly label: string;
  readonly status: VendorEditorStatus;
  /** Moves focus to the part's section or block. */
  readonly onSelect: () => void;
}

export interface VendorEditorStep {
  readonly key: string;
  readonly number: number;
  /** The top stepper's word: "Course". */
  readonly short: string;
  /** The outline's title: "Course and description". */
  readonly title: string;
  /** The live state: "Not started", "In progress", "Complete", "Ready to submit". */
  readonly state: string;
  /** Complete and not the step on show: a tick instead of the number. */
  readonly done: boolean;
  readonly current: boolean;
  /** The top stepper button's name: "Step 1 of 4, Course and description, not started". */
  readonly label: string;
  readonly onSelect: () => void;
  /** The parts under the current step in the outline, and their list's name ("Parts of …"). */
  readonly parts?: readonly VendorEditorPart[];
  readonly partsLabel?: string;
}

export interface VendorEditorOutline {
  /**
   * The outline's kicker (`p.ve-prog-k`), which names the aside: "Draft", "Revision 1 returned".
   */
  readonly kicker: ReactNode;
  readonly kickerId: string;
  /** The experiment's name (`p.ve-prog-t`). */
  readonly name: ReactNode;
  /** The bold saved line ("Last saved 27 Aug 2026, 10:40"), when known. */
  readonly saved?: ReactNode;
  /** Who can see it ("Only you can see a draft."). */
  readonly visibility: ReactNode;
}

export interface VendorEditorLayoutProps {
  /** Both step lists' name: "Steps". */
  readonly stepsLabel: string;
  readonly steps: readonly VendorEditorStep[];
  readonly outline: VendorEditorOutline;
  /** The form surface's name: the step's H1. */
  readonly formLabelledBy: string;
  /** The form: the error wrap, the sections and the actions. */
  readonly children: ReactNode;
}

/** Space kept between a focused field and the sticky actions row, or the top of the window. */
const FOCUS_CLEARANCE = 16;
/** The top of the window a field's top is never scrolled above (the shell's top line at 375 px). */
const TOP_CLEARANCE = 72;

/**
 * UX-01: focus is never left under the sticky actions row (`div.vr-actions`, two rows below 620 px).
 * The browser scrolls a focused field only until some of it is in view, so a tall field reached by
 * Tab could sit wholly or partly behind the row (measured at 375 × 812 on VE-08 revise: Description
 * at y = 696 with the row at 691). After the browser's own scroll, the page moves just enough to
 * clear the row, never so far that the field's top leaves the window. Focus inside the row itself
 * or in a dialog is left alone.
 */
function keepFocusClearOfActions(event: FocusEvent<HTMLElement>) {
  const field = event.target;
  const bar = event.currentTarget.querySelector<HTMLElement>('.vr-actions');
  if (!bar || bar.contains(field) || field.closest('dialog')) return;
  window.requestAnimationFrame(() => {
    if (document.activeElement !== field) return;
    const box = field.getBoundingClientRect();
    const barTop = bar.getBoundingClientRect().top;
    const overlap = box.bottom + FOCUS_CLEARANCE - barTop;
    if (overlap <= 0) return;
    const room = box.top - TOP_CLEARANCE;
    const by = Math.min(overlap, Math.max(room, 0));
    if (by > 0) window.scrollBy({ top: by });
  });
}

function StepNumber({ step }: { readonly step: VendorEditorStep }) {
  return <span className="ve-step-n">{step.done ? <Glyph name="check" /> : step.number}</span>;
}

/**
 * The one four-step editor's frame (`div.rk-detailwrap`): the top stepper (`nav.ve-steps`, shown
 * under 860 px of detail width), the form surface (`section.rk-surface.ve-form.vr-form`) and, on
 * wide layouts, the aside outline (`aside.ve-edaside` > `div.ve-prog`) that follows the step — its
 * parts with their live status. The two step lists never show together.
 */
export function VendorEditorLayout({
  stepsLabel,
  steps,
  outline,
  formLabelledBy,
  children,
}: VendorEditorLayoutProps) {
  return (
    <div className="rk-detailwrap">
      <nav className="ve-steps ve-steps--top" aria-label={stepsLabel}>
        <ol>
          {steps.map((step) => (
            <li key={step.key}>
              <button
                type="button"
                className={joinClasses('ve-step', step.done && 'is-done')}
                aria-current={step.current ? 'step' : undefined}
                aria-label={step.label}
                onClick={step.onSelect}
              >
                <StepNumber step={step} />
                <span className="ve-step-l">{step.short}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="rk-detail">
        <div className="rk-mainsheet">
          <section
            className="rk-surface ve-form vr-form"
            aria-labelledby={formLabelledBy}
            onFocus={keepFocusClearOfActions}
          >
            {children}
          </section>
        </div>
        <aside className="rk-aside ve-edaside" aria-labelledby={outline.kickerId}>
          <div className="rk-surface ve-prog">
            <p className="ve-prog-k" id={outline.kickerId}>
              {outline.kicker}
            </p>
            <p className="ve-prog-t">{outline.name}</p>
            <nav aria-label={stepsLabel}>
              <ol className="ve-stepnav">
                {steps.map((step) => (
                  <li key={step.key}>
                    <button
                      type="button"
                      className={step.done ? 'is-done' : undefined}
                      aria-current={step.current ? 'step' : undefined}
                      onClick={step.onSelect}
                    >
                      <StepNumber step={step} />
                      <span className="ve-stepnav-l">{step.title}</span>
                      <span className="ve-stepnav-s">{step.state}</span>
                    </button>
                    {step.parts && step.parts.length > 0 ? (
                      <ul className="vr-sub" aria-label={step.partsLabel}>
                        {step.parts.map((part) => (
                          <li key={part.key}>
                            <button type="button" className="vr-sub-b" onClick={part.onSelect}>
                              <span className="vr-sub-l">{part.label}</span>
                              <VendorEditorStatusPill status={part.status} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ol>
            </nav>
            <div className="ve-prog-meta">
              {outline.saved ? (
                <span>
                  <b>{outline.saved}</b>
                </span>
              ) : null}
              <span>{outline.visibility}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/**
 * The top of the form (`div.vr-errwrap`): the step's error summary (the kit's `ErrorSummary`) and
 * any notice about the last command.
 */
export function VendorEditorErrors({ children }: { readonly children: ReactNode }) {
  return <div className="vr-errwrap">{children}</div>;
}

// ---- sections and the field grid ----------------------------------------------------------------

/** The six-column field grid (`div.vr-grid`), one column under 620 px of form width. */
export function VendorEditorGrid({ children }: { readonly children: ReactNode }) {
  return <div className="vr-grid">{children}</div>;
}

interface VendorEditorControl {
  readonly id: string;
  readonly 'aria-describedby'?: string;
  readonly 'aria-invalid'?: true;
}

const VendorEditorFieldContext = createContext<VendorEditorControl | null>(null);

function useEditorControl(name: string): VendorEditorControl {
  const control = useContext(VendorEditorFieldContext);
  if (!control) throw new Error(`${name} goes inside a VendorEditorField.`);
  return control;
}

const FIELD_WIDTH = { 2: 'vr-w2', 3: 'vr-w3', 4: 'vr-w4', 6: undefined } as const;

export interface VendorEditorFieldProps {
  /** The control's id (a summary link and a reference target); hint `<id>-h`, error `<id>-e`. */
  readonly id: string;
  readonly label: ReactNode;
  /** "(optional)" after the label. */
  readonly optional?: ReactNode;
  /** Columns of the six-column grid (6 by default). */
  readonly width?: 2 | 3 | 4 | 6;
  /** `p.rk-hint` under the label, in the control's description. */
  readonly hint?: ReactNode;
  /** A warning line inside the hint (`span.ve-hint-stale`): a course withdrawn while editing. */
  readonly staleHint?: ReactNode;
  /** Other ids the control is described by (the package guidance), before the error. */
  readonly describedBy?: string;
  /** "Referred to in the return" (`span.rk-tag-warn.ve-reftag`), under the label. */
  readonly referred?: ReactNode;
  /** The error under the control (`p.rk-ferr`). */
  readonly error?: ReactNode;
  /** A small action in the label row (`div.vr-labelrow`): "Attach file". */
  readonly labelAction?: ReactNode;
  /** After the error: the attached sample file. */
  readonly after?: ReactNode;
  /** The control: `VendorEditorInput`, `VendorEditorTextarea` or `VendorEditorSelect`. */
  readonly children: ReactNode;
}

/**
 * A field on the grid (`div.rk-field.vr-w*`): the label (with "(optional)"), the label row's action,
 * the return's tag, the hint, the control and its error — the control described by the hint (or
 * the package guidance) and the error, and `aria-invalid` while the error shows.
 */
export function VendorEditorField({
  id,
  label,
  optional,
  width = 6,
  hint,
  staleHint,
  describedBy,
  referred,
  error,
  labelAction,
  after,
  children,
}: VendorEditorFieldProps) {
  const hintId = hint ? `${id}-h` : undefined;
  const errorId = error ? `${id}-e` : undefined;
  const ids = [hintId, describedBy, errorId].filter(Boolean).join(' ');
  const control: VendorEditorControl = {
    id,
    ...(ids ? { 'aria-describedby': ids } : {}),
    ...(errorId ? { 'aria-invalid': true as const } : {}),
  };
  const labelElement = (
    <label className="rk-label" htmlFor={id}>
      <WithVendorOptional optional={optional}>{label}</WithVendorOptional>
    </label>
  );
  return (
    <div className={joinClasses('rk-field', FIELD_WIDTH[width])}>
      {labelAction ? (
        <div className="vr-labelrow">
          {labelElement}
          {labelAction}
        </div>
      ) : (
        labelElement
      )}
      {referred ? (
        <span className="rk-tag-warn ve-reftag">
          <Glyph name="returned" />
          {referred}
        </span>
      ) : null}
      {hint ? (
        <p className="rk-hint" id={hintId}>
          {hint}
          {staleHint ? <span className="ve-hint-stale">{staleHint}</span> : null}
        </p>
      ) : null}
      <VendorEditorFieldContext value={control}>{children}</VendorEditorFieldContext>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
      {after}
    </div>
  );
}

type ControlAttributes = 'id' | 'className' | 'aria-describedby' | 'aria-invalid';

export interface VendorEditorInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  ControlAttributes | 'type' | 'autoComplete'
> {
  readonly type?: 'text' | 'url';
  readonly ref?: Ref<HTMLInputElement>;
}

/** `input.rk-input` (`autocomplete="off"`), wired by its field. */
export function VendorEditorInput({ type = 'text', ref, ...rest }: VendorEditorInputProps) {
  const control = useEditorControl('VendorEditorInput');
  return (
    <input {...rest} {...control} ref={ref} className="rk-input" type={type} autoComplete="off" />
  );
}

const TEXTAREA_ROWS = { 1: 'vr-ta1', 2: 'vr-ta2', 4: 'vr-ta4' } as const;

export interface VendorEditorTextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  ControlAttributes | 'rows'
> {
  /** The resting height: one line (notes), two (needs, summary) or four (description). */
  readonly rows: 1 | 2 | 4;
  readonly ref?: Ref<HTMLTextAreaElement>;
}

/** `textarea.rk-textarea.vr-ta*`, growing with its content, wired by its field. */
export function VendorEditorTextarea({ rows, ref, ...rest }: VendorEditorTextareaProps) {
  const control = useEditorControl('VendorEditorTextarea');
  return (
    <textarea
      {...rest}
      {...control}
      ref={ref}
      className={`rk-textarea ${TEXTAREA_ROWS[rows]}`}
      rows={rows}
    />
  );
}

export interface VendorEditorSelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  ControlAttributes | 'children'
> {
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly ref?: Ref<HTMLSelectElement>;
}

/** `div.rk-selwrap` > `select.rk-select` + chevron; its error border is the role sheet's. */
export function VendorEditorSelect({ options, ref, ...rest }: VendorEditorSelectProps) {
  const control = useEditorControl('VendorEditorSelect');
  return (
    <div className="rk-selwrap">
      <select {...rest} {...control} ref={ref} className="rk-select">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Glyph name="chevronDown" />
    </div>
  );
}

/** The small text button of a label row (`button.vr-linkbtn`, plus glyph): "Attach file". */
export function VendorEditorLinkButton({
  label,
  onClick,
  children,
}: {
  /** The button's name: "Attach the VR package file". */
  readonly label?: string;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  return (
    <button type="button" className="vr-linkbtn" aria-label={label} onClick={onClick}>
      <Glyph name="add" />
      {children}
    </button>
  );
}

// ---- step 2: the format selector, the package guidance, the delivery blocks ---------------------

export interface VendorEditorFormatOption {
  /** The checkbox id. */
  readonly id: string;
  /** "WEB", "AR", "VR", "MR". */
  readonly code: string;
  /** "Browser", "Augmented reality". */
  readonly name: string;
  /** "Web link", "App package". */
  readonly kind: string;
  readonly checked: boolean;
  readonly onToggle: () => void;
}

export interface VendorEditorFormatsProps {
  /** The fieldset's id (a summary link's target; focusable). Its error is `<id>-e`. */
  readonly id: string;
  /** "Formats it supports". */
  readonly legend: ReactNode;
  readonly description: ReactNode;
  readonly options: readonly VendorEditorFormatOption[];
  readonly error?: ReactNode;
}

/**
 * The compact format selector in the chip grammar (`div.vr-sec` > `fieldset.vr-fmtsel`): one tile
 * per format — the checkbox, the chip (solid navy when included, flat grey when not), the name and
 * how it is delivered; the error under the tiles (10 px above it, the export's inline style:
 * `rk-x-ferr-above`, V3P-13) and in the fieldset's description.
 */
export function VendorEditorFormats({
  id,
  legend,
  description,
  options,
  error,
}: VendorEditorFormatsProps) {
  const errorId = error ? `${id}-e` : undefined;
  return (
    <div className="vr-sec">
      <fieldset className="rk-fieldset vr-fmtsel" id={id} tabIndex={-1} aria-describedby={errorId}>
        <legend className="vr-legend">
          <span className="vr-sec-t">{legend}</span>
          <span className="vr-sec-d">{description}</span>
        </legend>
        <div className="vr-fmtsel-grid">
          {options.map((option) => (
            <label key={option.code} className="vr-fmtopt" htmlFor={option.id}>
              <input
                type="checkbox"
                id={option.id}
                checked={option.checked}
                onChange={option.onToggle}
              />
              <span className={option.checked ? 'xr-fmt' : 'xr-fmt xr-fmt--none'}>
                {option.code}
              </span>
              <span className="vr-fmtopt-name">{option.name}</span>
              <span className="vr-fmtopt-kind">{option.kind}</span>
            </label>
          ))}
        </div>
        {error ? (
          <p className="rk-ferr rk-x-ferr-above" id={errorId}>
            <Glyph name="alertCircle" />
            {error}
          </p>
        ) : null}
      </fieldset>
    </div>
  );
}

export interface VendorEditorGuideItem {
  /** The description's id: the matching field of every package block is described by it. */
  readonly id: string;
  readonly term: ReactNode;
  readonly description: ReactNode;
}

/**
 * The app-package guidance written once above the delivery blocks (`div.vr-guide`): what each
 * package field needs, and the provisional note.
 */
export function VendorEditorPackageGuide({
  title,
  items,
  note,
}: {
  readonly title: ReactNode;
  readonly items: readonly VendorEditorGuideItem[];
  readonly note: ReactNode;
}) {
  return (
    <div className="vr-guide">
      <p className="vr-guide-t">{title}</p>
      <dl className="vr-guide-dl">
        {items.map((item) => (
          <div key={item.id}>
            <dt>{item.term}</dt>
            <dd id={item.id}>{item.description}</dd>
          </div>
        ))}
      </dl>
      <p className="vr-guide-note">
        <Glyph name="infoNote" />
        <span>{note}</span>
      </p>
    </div>
  );
}

interface DeliveryHead {
  /** "WEB", "VR". */
  readonly code: string;
  /** "Browser", "Virtual reality". */
  readonly name: string;
  /** "Web link", "App package". */
  readonly kind: string;
}

export interface VendorEditorDeliveryBlockProps extends DeliveryHead {
  /** The block's heading id (the block's name; focusable from the outline). */
  readonly titleId: string;
  /** Complete, "N still needed" or "N to fix". */
  readonly status: VendorEditorStatus;
  /** The block's fields. */
  readonly children: ReactNode;
}

/**
 * One chosen format's delivery block (`section.vr-dlv`): the chip, the name and kind, its live
 * status, then its fields on the grid (`div.vr-grid.vr-dlv-b`).
 */
export function VendorEditorDeliveryBlock({
  code,
  name,
  kind,
  titleId,
  status,
  children,
}: VendorEditorDeliveryBlockProps) {
  return (
    <section className="vr-dlv" aria-labelledby={titleId}>
      <div className="vr-dlv-h">
        <span className="xr-fmt">{code}</span>
        <h3 className="vr-dlv-t" id={titleId} tabIndex={-1}>
          {name}
          <span className="vr-dlv-k"> · {kind}</span>
        </h3>
        <VendorEditorStatusPill status={status} inBlockHead />
      </div>
      <div className="vr-grid vr-dlv-b">{children}</div>
    </section>
  );
}

// ---- files and empty lines ----------------------------------------------------------------------

export interface VendorEditorFileProps {
  /** A sample file name only: nothing is uploaded. */
  readonly name: string;
  /** "Remove". */
  readonly removeLabel: ReactNode;
  /** The Remove button's name: "Remove the VR package file", "Remove Safety notes.pdf". */
  readonly removeName: string;
  readonly onRemove: () => void;
  /** `li` in a document list (`ul.ve-files`), or a `div` under a package reference (`vr-file`). */
  readonly as?: 'li' | 'div';
}

/** A sample file row (`ve-file`): the document glyph, the name and Remove. */
export function VendorEditorFile({
  name,
  removeLabel,
  removeName,
  onRemove,
  as = 'li',
}: VendorEditorFileProps) {
  const content = (
    <>
      <Glyph name="document" />
      <span className="ve-file-n">{name}</span>
      <Button variant="ghost" aria-label={removeName} onClick={onRemove}>
        {removeLabel}
      </Button>
    </>
  );
  return as === 'li' ? (
    <li className="ve-file">{content}</li>
  ) : (
    <div className="ve-file vr-file">{content}</div>
  );
}

/** The sample documents (`ul.ve-files`) of `VendorEditorFile` rows. */
export function VendorEditorFiles({ children }: { readonly children: ReactNode }) {
  return <ul className="ve-files">{children}</ul>;
}

/** The dashed empty line (`p.vr-empty`): "No documents added.", "None chosen yet". */
export function VendorEditorEmpty({
  icon = 'document',
  children,
}: {
  readonly icon?: Extract<V3IconName, 'document' | 'contentAccess'>;
  readonly children: ReactNode;
}) {
  return (
    <p className="vr-empty">
      <Glyph name={icon} />
      {children}
    </p>
  );
}

// ---- step 4: check and submit -------------------------------------------------------------------

/**
 * The lead of Check and submit (`div.vr-sec.vr-sec--lead` > a focus target): the missing items,
 * the quiet "N things to finish" notice or "Everything required is provided".
 */
export function VendorEditorCheckLead({
  id,
  children,
}: {
  /** The focus target when Submit finds something missing. */
  readonly id: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="vr-sec vr-sec--lead">
      <div id={id} tabIndex={-1}>
        {children}
      </div>
    </div>
  );
}

export interface VendorEditorMissingItem {
  readonly key: string;
  /** The field's error in words. */
  readonly text: ReactNode;
  /** "Go to formats and delivery". */
  readonly linkLabel: ReactNode;
  /** `#<field id>`: the link's address, for a reader that opens it elsewhere. */
  readonly href: string;
  /** Opens the step with its errors and focuses the field. */
  readonly onSelect: () => void;
}

/**
 * What is still missing when Submit is pressed (`div.rk-errsum[role=alert]`): the count, then each
 * item with a "Go to …" link to its step and field (`span.ve-errline`; the link inline after the
 * error's words, so it stays an inline target).
 */
export function VendorEditorMissing({
  title,
  items,
}: {
  readonly title: ReactNode;
  readonly items: readonly VendorEditorMissingItem[];
}) {
  const follow = (event: MouseEvent<HTMLAnchorElement>, item: VendorEditorMissingItem) => {
    event.preventDefault();
    item.onSelect();
  };
  return (
    <div className="rk-errsum" role="alert">
      <p className="rk-errsum-t">{title}</p>
      <ul>
        {items.map((item) => (
          <li key={item.key}>
            <span className="ve-errline">
              {/* The link stays inline in the error's words (WCAG 2.5.8): as its own flex item of
                  `ve-errline` it would be a 22 px target next to its neighbours. */}
              <span>
                {item.text}{' '}
                <a href={item.href} onClick={(event) => follow(event, item)}>
                  {item.linkLabel}
                </a>
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export interface VendorEditorReviewProps {
  readonly titleId: string;
  readonly title: ReactNode;
  readonly optional?: ReactNode;
  readonly status: VendorEditorStatus;
  /** "Change". */
  readonly changeLabel: ReactNode;
  /** The Change button's name: "Change formats and delivery". */
  readonly changeName: string;
  readonly onChange: () => void;
  readonly children: ReactNode;
}

/**
 * One review section per step on Check and submit (`section.vr-sec` > `div.vr-rev-h`): the step's
 * name, its status and Change, which opens that step with the values kept.
 */
export function VendorEditorReview({
  titleId,
  title,
  optional,
  status,
  changeLabel,
  changeName,
  onChange,
  children,
}: VendorEditorReviewProps) {
  return (
    <section className="vr-sec" aria-labelledby={titleId}>
      <div className="vr-rev-h">
        <h2 className="vr-sec-t" id={titleId}>
          <WithVendorOptional optional={optional}>{title}</WithVendorOptional>
        </h2>
        <VendorEditorStatusPill status={status} />
        <Button variant="ghost" className="vr-chg" aria-label={changeName} onClick={onChange}>
          {changeLabel}
        </Button>
      </div>
      {children}
    </section>
  );
}

/** The "does not publish" note just above the actions (`div.vr-sec--note` > `p.ve-submitnote`). */
export function VendorEditorSubmitNote({ children }: { readonly children: ReactNode }) {
  return (
    <div className="vr-sec vr-sec--note">
      <p className="ve-submitnote">
        <Glyph name="infoNote" />
        <span>{children}</span>
      </p>
    </div>
  );
}

export interface VendorEditorActionsProps {
  /** Cancel (step 1) or Back. */
  readonly start: ReactNode;
  /** The saved status ("Draft saved · 27 Aug 2026, 10:40"), next to Cancel or Back. */
  readonly saved?: ReactNode;
  /** The saved status's id: it takes focus after a save. */
  readonly savedId: string;
  /** Save, then Continue or Submit, right-aligned. */
  readonly end: ReactNode;
}

/** The sticky actions row of the form (`div.vr-actions`). */
export function VendorEditorActions({ start, saved, savedId, end }: VendorEditorActionsProps) {
  return (
    <div className="vr-actions">
      <div className="vr-actions-l">{start}</div>
      {saved ? (
        <p className="ve-saved vr-saved" id={savedId} tabIndex={-1} role="status">
          <Glyph name="check" />
          {saved}
        </p>
      ) : null}
      <div className="vr-actions-r">{end}</div>
    </div>
  );
}

// ---- after submit or resubmit, read-only, refusals ----------------------------------------------

export interface VendorEditorOutcomeProps {
  /** The card's id. */
  readonly id?: string;
  readonly titleId: string;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** Today's date on phones (`p.rb-eyebrow-date`). */
  readonly date?: ReactNode;
  /** The experiment's name: "Natural Convection from a Vertical Plate". */
  readonly eyebrow: ReactNode;
  /** "Submitted for academic review", "Submitted". */
  readonly title: ReactNode;
  readonly text: ReactNode;
  /** "Status" and the status as the record reads it. */
  readonly statusTerm: ReactNode;
  readonly status: { readonly tone: StatusTone; readonly words: ReactNode };
  /** "Revision", "Submitted" … */
  readonly facts: readonly { readonly term: ReactNode; readonly value: ReactNode }[];
  /** "Formats" and the formats, named by `formatsLabel` ("Formats: WEB, VR"). */
  readonly formatsTerm: ReactNode;
  readonly formats: readonly string[];
  readonly formatsLabel: string;
  /** What happens next (`p.rk-next`). */
  readonly next: ReactNode;
  /** "Open the experiment record" (primary) and "Back to My experiments". */
  readonly actions: ReactNode;
}

/**
 * The outcome card after Submit or Resubmit (`section.rk-surface.vr-outcome`): the result as the
 * page's H1, the status, the time, the formats, the next step and two actions.
 */
export function VendorEditorOutcome({
  id,
  titleId,
  titleRef,
  date,
  eyebrow,
  title,
  text,
  statusTerm,
  status,
  facts,
  formatsTerm,
  formats,
  formatsLabel,
  next,
  actions,
}: VendorEditorOutcomeProps) {
  return (
    <section className="rk-surface vr-outcome" id={id} aria-labelledby={titleId}>
      <span className="vr-outcome-ico" aria-hidden="true">
        <Glyph name="check" />
      </span>
      <div className="vr-outcome-main">
        {date ? <p className="rb-eyebrow-date">{date}</p> : null}
        <p className="rk-eyebrow">{eyebrow}</p>
        <h1 className="rb-h1" id={titleId} tabIndex={-1} ref={titleRef}>
          {title}
        </h1>
        <p className="vr-outcome-d">{text}</p>
        <dl className="vr-facts">
          <div>
            <dt>{statusTerm}</dt>
            <dd>
              <StatusPill tone={status.tone} size="lg">
                {status.words}
              </StatusPill>
            </dd>
          </div>
          {facts.map((fact, index) => (
            <div key={index}>
              <dt>{fact.term}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
          <div>
            <dt>{formatsTerm}</dt>
            <dd>
              <VendorFormatChips formats={formats} label={formatsLabel} />
            </dd>
          </div>
        </dl>
        <p className="rk-next">{next}</p>
        <div className="ve-done-actions vr-outcome-act">{actions}</div>
      </div>
    </section>
  );
}

export interface VendorEditorRefusalProps {
  readonly titleId: string;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** The experiment's name: "Forced Convection". */
  readonly eyebrow: ReactNode;
  /** "This experiment was already submitted". */
  readonly title: ReactNode;
  readonly text: ReactNode;
  /** "Open the experiment record" (primary) and "Back to My experiments". */
  readonly actions: ReactNode;
}

/**
 * A stale editor address for an experiment that is no longer the Vendor's to change — already
 * submitted, being reviewed, approved, published (`section.rk-surface` > `div.rk-state--roomy`,
 * the lock): the eyebrow without its margin (the export's inline `margin: 0`:
 * `rk-x-eyebrow-flush`, V3P-13), the page's H1 and the two ways on.
 */
export function VendorEditorRefusal({
  titleId,
  titleRef,
  eyebrow,
  title,
  text,
  actions,
}: VendorEditorRefusalProps) {
  return (
    <section className="rk-surface" aria-labelledby={titleId}>
      <div className="rk-state rk-state--roomy">
        <span className="rk-state-ico ve-ico-lock" aria-hidden="true">
          <Glyph name="lock" />
        </span>
        <p className="rk-eyebrow rk-x-eyebrow-flush">{eyebrow}</p>
        <h1 className="rk-state-t" id={titleId} tabIndex={-1} ref={titleRef}>
          {title}
        </h1>
        <p className="rk-state-d">{text}</p>
        <div className="ve-done-actions">{actions}</div>
      </div>
    </section>
  );
}

export interface VendorEditorEnteredProps {
  readonly titleId: string;
  /** "What you entered". */
  readonly title: ReactNode;
  /** Course, Summary, Version, Formats. */
  readonly items: readonly { readonly term: ReactNode; readonly value: ReactNode }[];
  /** The chosen formats' delivery as entered (`VendorDeliveryView` blocks). */
  readonly delivery?: ReactNode;
}

/**
 * A read-only draft's sheet (`section.rk-surface.vr-sheet`): "What you entered" — the key facts
 * and, after them, each chosen format's delivery in the record's read-only blocks.
 */
export function VendorEditorEntered({ titleId, title, items, delivery }: VendorEditorEnteredProps) {
  return (
    <section className="rk-surface vr-sheet" aria-labelledby={titleId}>
      <VendorSection as="div" title={title} titleId={titleId}>
        <DefinitionList items={items} />
        {delivery ? <VendorDeliveryList after>{delivery}</VendorDeliveryList> : null}
      </VendorSection>
    </section>
  );
}

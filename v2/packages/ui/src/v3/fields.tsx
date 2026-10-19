'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  type InputHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  type Ref,
  type RefCallback,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

import { describedByIds } from '../forms/field.js';
import { focusField } from '../forms/error-summary.js';
import { joinClasses } from '../internal/classes.js';
import { useLinkComponent } from '../link.js';
import { Glyph, Icon } from './icons.js';

/**
 * What a Field gives the control it wraps: the id its label points at, the ids of its hint and
 * error (`aria-describedby`, hint first) and `aria-invalid` while it shows an error. The boards
 * reference an error id that is not there when there is no error (SA02 `dc-lic-err`); here only
 * the ids that exist are referenced (ADR-0010).
 */
export interface FieldControl {
  readonly id: string;
  readonly 'aria-describedby'?: string;
  readonly 'aria-invalid'?: true;
}

const FieldContext = createContext<FieldControl | null>(null);

/** The wiring of the nearest V3 Field, or `null` outside one. */
export function useFieldControl(): FieldControl | null {
  return useContext(FieldContext);
}

/**
 * The error line under a field or a group (`p.rk-ferr`): the alert icon and the words, from the
 * caller. Not a live region: the error summary is the alert, the line is the field's description.
 */
export function FieldError({
  id,
  children,
}: {
  readonly id?: string;
  readonly children: ReactNode;
}) {
  return (
    <p className="rk-ferr" id={id}>
      <Glyph name="alertCircle" />
      {children}
    </p>
  );
}

export interface FieldProps {
  /** The visible label, above the control (never a placeholder-only label). */
  readonly label: ReactNode;
  /** `p.rk-hint` between the label and the control, in the control's description. */
  readonly hint?: ReactNode;
  /** The error in words under the control. The caller validates and passes the drawn message. */
  readonly error?: ReactNode;
  /** The control's id (an error-summary link target). Hint `<id>-h`, error `<id>-e`. */
  readonly id?: string;
  /** A Refined B context class on `div.rk-field` (`rk-search`, `rk-field--st`, …). */
  readonly className?: string;
  /**
   * Where the error line sits: under the control (`after`, the SA-03 decision form) or between the
   * label (and hint) and the control (`before`, the Entry & shared export's sign-in and report
   * forms). Either way it stays in the control's description.
   */
  readonly errorPlacement?: 'after' | 'before';
  readonly children: ReactNode | ((control: FieldControl) => ReactNode);
}

/** The V3 form field (`div.rk-field` > `label.rk-label` + hint + control + error). */
export function Field({
  label,
  hint,
  error,
  id,
  className,
  errorPlacement = 'after',
  children,
}: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = hint ? `${controlId}-h` : undefined;
  const errorId = error ? `${controlId}-e` : undefined;
  const describedBy = describedByIds(hintId, errorId);
  const control: FieldControl = {
    id: controlId,
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
    ...(errorId ? { 'aria-invalid': true as const } : {}),
  };
  return (
    <div className={joinClasses('rk-field', className)}>
      <label className="rk-label" htmlFor={controlId}>
        {label}
      </label>
      {hint ? (
        <p className="rk-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error && errorPlacement === 'before' ? <FieldError id={errorId}>{error}</FieldError> : null}
      <FieldContext value={control}>
        {typeof children === 'function' ? children(control) : children}
      </FieldContext>
      {error && errorPlacement === 'after' ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  );
}

function useControlWiring(name: string): FieldControl {
  const control = useFieldControl();
  if (!control) throw new Error(`${name} goes inside a V3 Field.`);
  return control;
}

export interface TextInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'id' | 'className' | 'aria-describedby' | 'aria-invalid'
> {
  readonly ref?: Ref<HTMLInputElement>;
}

/** `input.rk-input` (44 px), wired by its Field. */
export function TextInput({ ref, type = 'text', ...rest }: TextInputProps) {
  const control = useControlWiring('TextInput');
  return <input {...rest} {...control} ref={ref} type={type} className="rk-input" />;
}

/** The search field's input with its icon (`div.rk-inputwrap` > icon + `input.rk-input`). */
export function SearchInput({ ref, ...rest }: Omit<TextInputProps, 'type'>) {
  const control = useControlWiring('SearchInput');
  return (
    <div className="rk-inputwrap">
      <Glyph name="search" />
      <input {...rest} {...control} ref={ref} type="search" className="rk-input" />
    </div>
  );
}

export interface SelectOption {
  readonly value: string;
  readonly label: string;
}

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'id' | 'className' | 'aria-describedby' | 'aria-invalid' | 'children'
> {
  readonly options: readonly SelectOption[];
  readonly ref?: Ref<HTMLSelectElement>;
}

/** `div.rk-selwrap` > `select.rk-select` + chevron, wired by its Field. */
export function Select({ options, ref, ...rest }: SelectProps) {
  const control = useControlWiring('Select');
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

export interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'id' | 'className' | 'aria-describedby' | 'aria-invalid'
> {
  readonly ref?: Ref<HTMLTextAreaElement>;
}

/** `textarea.rk-textarea`, wired by its Field. */
export function Textarea({ ref, ...rest }: TextareaProps) {
  const control = useControlWiring('Textarea');
  return <textarea {...rest} {...control} ref={ref} className="rk-textarea" />;
}

export interface ChoiceOption<Value extends string> {
  readonly value: Value;
  readonly title: ReactNode;
  /** The consequence line (`span.rk-choice-d`), in the radio's description. */
  readonly description?: ReactNode;
  /** Shown but not available (`is-off`, a disabled radio); its description says why. */
  readonly unavailable?: boolean;
}

interface GroupProps {
  /** The question (`legend`). */
  readonly legend: ReactNode;
  /** The quiet line in the legend (`legend > span`), e.g. "Required to approve. …". */
  readonly legendHint?: ReactNode;
  /** The error in words under the options; in the fieldset's description. */
  readonly error?: ReactNode;
  /**
   * The fieldset id — an error-summary link target: the link hands focus to the chosen option or
   * else the first one that is available — and the base of the option ids (`<id>-<value>`) and the
   * error id (`<id>-e`).
   */
  readonly id: string;
}

export interface ChoiceGroupProps<Value extends string> extends GroupProps {
  readonly name: string;
  readonly options: readonly ChoiceOption<Value>[];
  readonly value: Value | null;
  readonly onChange: (value: Value) => void;
}

/**
 * Radio cards (`fieldset.rk-fieldset` > `legend` + `div.rk-choices` > `label.rk-choice`): the
 * decision choices of SA-03. Each radio is named by its title and described by its consequence
 * line (the board's label wraps both, so the line was read twice); the group's error is in the
 * fieldset's description.
 */
export function ChoiceGroup<Value extends string>({
  legend,
  legendHint,
  error,
  id,
  name,
  options,
  value,
  onChange,
}: ChoiceGroupProps<Value>) {
  const errorId = error ? `${id}-e` : undefined;
  return (
    <fieldset
      className={joinClasses('rk-fieldset', error ? 'is-invalid' : undefined)}
      id={id}
      aria-describedby={errorId}
    >
      <legend>
        {legend}
        {legendHint ? <span>{legendHint}</span> : null}
      </legend>
      <div className="rk-choices">
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          const titleId = `${optionId}-t`;
          const descriptionId = option.description ? `${optionId}-d` : undefined;
          return (
            <label
              key={option.value}
              className={joinClasses('rk-choice', option.unavailable ? 'is-off' : undefined)}
              htmlFor={optionId}
            >
              <input
                type="radio"
                id={optionId}
                name={name}
                checked={value === option.value}
                disabled={option.unavailable ? true : undefined}
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
                onChange={() => onChange(option.value)}
              />
              <span className="rk-choice-t" id={titleId}>
                {option.title}
              </span>
              {option.description ? (
                <span className="rk-choice-d" id={descriptionId}>
                  {option.description}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </fieldset>
  );
}

export interface CheckOption<Value extends string> {
  readonly value: Value;
  readonly label: ReactNode;
  /** The quiet second line (`small`): "Virtual reality". */
  readonly detail?: ReactNode;
}

export interface CheckGroupProps<Value extends string> extends GroupProps {
  readonly options: readonly CheckOption<Value>[];
  readonly values: readonly Value[];
  readonly onChange: (values: Value[]) => void;
}

/** Checkbox chips (`fieldset.rk-fieldset` > `div.rk-checks` > `label.rk-check`): formats to approve. */
export function CheckGroup<Value extends string>({
  legend,
  legendHint,
  error,
  id,
  options,
  values,
  onChange,
}: CheckGroupProps<Value>) {
  const errorId = error ? `${id}-e` : undefined;
  const toggle = (value: Value) =>
    onChange(
      values.includes(value)
        ? values.filter((item) => item !== value)
        : options
            .map((option) => option.value)
            .filter((item) => item === value || values.includes(item)),
    );
  return (
    <fieldset
      className={joinClasses('rk-fieldset', error ? 'is-invalid' : undefined)}
      id={id}
      aria-describedby={errorId}
    >
      <legend>
        {legend}
        {legendHint ? <span>{legendHint}</span> : null}
      </legend>
      <div className="rk-checks">
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          return (
            <label key={option.value} className="rk-check" htmlFor={optionId}>
              <input
                type="checkbox"
                id={optionId}
                checked={values.includes(option.value)}
                onChange={() => toggle(option.value)}
              />
              {option.label}
              {option.detail ? (
                <>
                  {' '}
                  <small>{option.detail}</small>
                </>
              ) : null}
            </label>
          );
        })}
      </div>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </fieldset>
  );
}

export interface ErrorSummaryItem {
  /** The id of the field to focus: a control, or a group's fieldset. */
  readonly fieldId: string;
  /** The summary link's words ("Choose a decision"). */
  readonly summaryText: string;
}

export interface ErrorSummaryProps {
  /** "Check your decision". */
  readonly title: string;
  /** One linked entry per invalid field, in page order. Nothing renders while it is empty. */
  readonly items: readonly ErrorSummaryItem[];
  readonly id?: string;
  /**
   * Moves focus to the summary when it appears (default `true`). To focus it again on a later
   * failed submit while it is still shown, call `focus()` through `ref`.
   */
  readonly autoFocus?: boolean;
  readonly ref?: Ref<HTMLDivElement>;
}

/**
 * The error summary (`div.rk-errsum[role=alert][tabindex=-1]`): the title and a list of links that
 * move focus to their fields without navigating — the v46 ErrorSummary behaviour (VD-22) in the
 * Refined B look.
 */
export function ErrorSummary({ title, items, id, autoFocus = true, ref }: ErrorSummaryProps) {
  const Link = useLinkComponent();
  const node = useRef<HTMLDivElement | null>(null);
  const attach: RefCallback<HTMLDivElement> = useCallback(
    (element: HTMLDivElement | null) => {
      node.current = element;
      let callerCleanup: (() => void) | undefined;
      if (typeof ref === 'function') {
        const result = ref(element);
        if (typeof result === 'function') callerCleanup = result;
      } else if (ref) {
        ref.current = element;
      }
      return () => {
        node.current = null;
        if (callerCleanup) callerCleanup();
        else if (typeof ref === 'function') ref(null);
        else if (ref) ref.current = null;
      };
    },
    [ref],
  );
  const shown = items.length > 0;
  useEffect(() => {
    if (autoFocus && shown) node.current?.focus();
  }, [autoFocus, shown]);
  if (!shown) return null;
  const follow = (event: MouseEvent<HTMLAnchorElement>, fieldId: string) => {
    event.preventDefault();
    focusField(fieldId);
  };
  return (
    <div ref={attach} className="rk-errsum" role="alert" id={id} tabIndex={-1}>
      <p className="rk-errsum-t">{title}</p>
      <ul>
        {items.map((item) => (
          <li key={item.fieldId}>
            <Link href={`#${item.fieldId}`} onClick={(event) => follow(event, item.fieldId)}>
              {item.summaryText}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** What is still missing before the decision button works (`p.rk-pending`, clock icon). */
export function PendingHint({ children }: { readonly children: ReactNode }) {
  return (
    <p className="rk-pending">
      <Glyph name="clock" />
      {children}
    </p>
  );
}

export interface ChangeSummaryProps {
  /** "Different from the request". */
  readonly title: ReactNode;
  /** One line per difference ("Licences: 120 → 100"). */
  readonly lines: readonly ReactNode[];
}

/**
 * The differences from the request (`div.rk-diff`). The board makes it a live region that would
 * speak on every keystroke in the licences field; it is plain text here (concise announcements,
 * ADR-0010).
 */
export function ChangeSummary({ title, lines }: ChangeSummaryProps) {
  return (
    <div className="rk-diff">
      <b>{title}</b>
      {lines.map((line, index) => (
        <p key={index}>{line}</p>
      ))}
    </div>
  );
}

/** A value fixed elsewhere (`p.rk-locked`, lock icon): "Internal or external: External. Set when …". */
export function LockedValue({ children }: { readonly children: ReactNode }) {
  return (
    <p className="rk-locked">
      <Icon name="lock" size={18} />
      <span>{children}</span>
    </p>
  );
}

/** A hint line on its own (`p.rk-hint`), e.g. "Access term: Yearly. Additional licences follow …". */
export function Hint({ id, children }: { readonly id?: string; readonly children: ReactNode }) {
  return (
    <p className="rk-hint" id={id}>
      {children}
    </p>
  );
}

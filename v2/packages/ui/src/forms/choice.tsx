'use client';

import {
  createContext,
  useContext,
  useId,
  useState,
  type FieldsetHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
} from 'react';

import { joinClasses } from '../internal/classes.js';
import { describedByIds, FieldError } from './field.js';

/**
 * Which drawn class the legend uses: `xr-legend` (board 03, 09b, B1-07, B1-11, B2-05), `xr-label`
 * (the workspace product boards B4-04 … B7-12, e.g. B5-04 "Formats it supports", B6-07 "Send it
 * to") or `xr-sr`, visually hidden where a heading already names the group (the decision panels:
 * "Your decision" > legend "Decision"; board 03, B1-11).
 */
export type ChoiceLegendClass = 'xr-legend' | 'xr-label' | 'xr-sr';

/**
 * Where a group's error line sits: under the options (B1-07, B1-11, B6-07, B7-08) or after the
 * legend and hint, before the options (B4-04, B5-03 … B5-09). Both are drawn; under the options
 * is the default, as for a Field.
 */
export type ChoiceErrorPlacement = 'after-options' | 'before-options';

/** What every checkbox or radio group draws: a fieldset with its legend, hint and error. */
export interface ChoiceGroupProps extends Omit<
  FieldsetHTMLAttributes<HTMLFieldSetElement>,
  'children' | 'className' | 'onChange' | 'defaultValue' | 'aria-describedby' | 'disabled'
> {
  /** The question the options answer ("Experiments to give", "Access term"). */
  readonly legend: ReactNode;
  /** `xr-legend` (default), `xr-label` or `xr-sr` (visually hidden; still names the group). */
  readonly legendClass?: ChoiceLegendClass;
  /** The marker after the legend, verbatim in `span.xr-opt` ("(required to approve)", B1-11). */
  readonly marker?: ReactNode;
  /** `span.xr-hint` after the legend (B1-07 "Access term"), in the fieldset's description. */
  readonly hint?: ReactNode;
  /**
   * Board context classes on the hint: every board spaces a group's hint inline, each its own way
   * (B1-07, B1-11 `margin:-4px 0 8px`; B4-04 `display:block;margin-bottom:8px`; B6-07 `…6px`).
   */
  readonly hintClassName?: string;
  /**
   * The error in words (B1-07, B1-11, B5-04), in the fieldset's description after the hint. The
   * caller validates on the primary action and passes the drawn message.
   */
  readonly error?: ReactNode;
  /** `after-options` (default) or `before-options`, as the screen's board draws it. */
  readonly errorPlacement?: ChoiceErrorPlacement;
  /** Board context classes on the error line (B1-07 `margin-top:8px` under the options). */
  readonly errorClassName?: string;
  /**
   * The fieldset id: an error-summary link target (with `tabIndex={-1}`, as B5-04 draws
   * `fieldset#…-fmts[tabindex=-1]`) and the base of the hint (`<id>-h`) and error (`<id>-e`) ids.
   */
  readonly id?: string;
  /**
   * Composition classes on the fieldset (v46 stylesheet classes only; the boards' one fieldset
   * context class, `xg-refs`, has no rule in the stylesheets and is not emitted).
   */
  readonly className?: string;
  readonly children: ReactNode;
}

function ChoiceFieldset({
  legend,
  legendClass = 'xr-legend',
  marker,
  hint,
  hintClassName,
  error,
  errorPlacement = 'after-options',
  errorClassName,
  id,
  className,
  children,
  ...rest
}: ChoiceGroupProps) {
  const generatedId = useId();
  const base = id ?? generatedId;
  const hintId = hint ? `${base}-h` : undefined;
  const errorId = error ? `${base}-e` : undefined;
  const errorLine = error ? (
    <FieldError id={errorId} className={errorClassName}>
      {error}
    </FieldError>
  ) : null;
  return (
    <fieldset
      className={joinClasses('xr-fieldset', className)}
      id={id}
      {...rest}
      aria-describedby={describedByIds(hintId, errorId)}
    >
      <legend className={legendClass}>
        {legend}
        {marker ? (
          <>
            {' '}
            <span className="xr-opt">{marker}</span>
          </>
        ) : null}
      </legend>
      {hint ? (
        <span className={joinClasses('xr-hint', hintClassName)} id={hintId}>
          {hint}
        </span>
      ) : null}
      {errorPlacement === 'before-options' && errorLine}
      {children}
      {errorPlacement === 'after-options' && errorLine}
    </fieldset>
  );
}

/**
 * A group of check rows (`fieldset.xr-fieldset` > `legend.xr-legend` + `label.xr-check`; board 03
 * "Checkbox · radio · search", 09a AR-5; `legend.xr-label` and the error before the rows as B5-04
 * draws them). Each Checkbox keeps its own `checked` / `onChange`.
 */
export function CheckboxGroup(props: ChoiceGroupProps) {
  return <ChoiceFieldset {...props} />;
}

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'children' | 'className'
> {
  /** The row's words; the whole label is the 44 px target. */
  readonly children: ReactNode;
  /** Board context classes on `label.xr-check`. */
  readonly className?: string;
  readonly ref?: Ref<HTMLInputElement>;
}

/**
 * One check row (`label.xr-check` > `input[type=checkbox]` + words; board 03). Native and
 * controlled the React way: `checked` + `onChange`, or `defaultChecked`. With an `id` the label
 * also points at it with `for`, as the product boards draw it.
 */
export function Checkbox({ children, id, className, ref, ...rest }: CheckboxProps) {
  return (
    <label className={joinClasses('xr-check', className)} htmlFor={id}>
      <input {...rest} ref={ref} id={id} type="checkbox" />
      {children}
    </label>
  );
}

interface RadioGroupState {
  readonly name: string;
  readonly value: string | null;
  readonly select: (value: string) => void;
}

const RadioGroupContext = createContext<RadioGroupState | null>(null);

function useRadioGroup(component: string): RadioGroupState {
  const group = useContext(RadioGroupContext);
  if (!group) throw new Error(`${component} must be inside a RadioGroup.`);
  return group;
}

export interface RadioGroupProps extends ChoiceGroupProps {
  /** The radios' shared `name` (native arrow-key movement needs one group). Generated if omitted. */
  readonly name?: string;
  /** The chosen option (controlled); `null` when nothing is chosen yet. */
  readonly value?: string | null;
  /** The chosen option when uncontrolled. */
  readonly defaultValue?: string;
  /** Called with the newly chosen option's value. */
  readonly onValueChange?: (value: string) => void;
}

/**
 * A radio group: the fieldset of CheckboxGroup holding Radio rows or ChoiceCards. Native radios
 * sharing one `name`, so the arrow keys move the choice (board 12 "Radio groups, scales") and Tab
 * enters the group once. The options carry no `value` attribute, as the boards draw them: the
 * group's value lives in React state (`value` / `onValueChange`).
 */
export function RadioGroup({
  name,
  value,
  defaultValue,
  onValueChange,
  children,
  ...group
}: RadioGroupProps) {
  const generatedName = useId();
  const [ownValue, setOwnValue] = useState<string | null>(defaultValue ?? null);
  const controlled = value !== undefined;
  const state: RadioGroupState = {
    name: name ?? generatedName,
    value: controlled ? value : ownValue,
    select: (next) => {
      if (!controlled) setOwnValue(next);
      onValueChange?.(next);
    },
  };
  return (
    <ChoiceFieldset {...group}>
      <RadioGroupContext value={state}>{children}</RadioGroupContext>
    </ChoiceFieldset>
  );
}

interface RadioOptionProps {
  /** This option's value in the RadioGroup. */
  readonly value: string;
  /** With an id the label also points at the input with `for` (product boards). */
  readonly id?: string;
  /** Board context classes on the label. */
  readonly className?: string;
  readonly ref?: Ref<HTMLInputElement>;
}

export interface RadioProps extends RadioOptionProps {
  /** The row's words; the whole label is the 44 px target. */
  readonly children: ReactNode;
}

/** One radio row (`label.xr-check` > `input[type=radio]` + words; board 03, 09b AR-8). */
export function Radio({ value, id, className, ref, children }: RadioProps) {
  const group = useRadioGroup('Radio');
  return (
    <label className={joinClasses('xr-check', className)} htmlFor={id}>
      <input
        ref={ref}
        id={id}
        type="radio"
        name={group.name}
        checked={group.value === value}
        onChange={() => group.select(value)}
      />
      {children}
    </label>
  );
}

/** A choice card the user can pick. */
interface AvailableChoice {
  readonly unavailable?: false;
  /** The consequence line (`span.xr-choice-sub`: "The vendor sees your reason."). */
  readonly sub?: ReactNode;
}

/** A choice card shown but not available: it always says why. */
interface UnavailableChoice {
  /** `is-off` (dashed, not allowed) and a disabled radio (B6-07, B1-11). */
  readonly unavailable: true;
  /** Why it is not available ("Possible once nothing is missing."). */
  readonly sub: ReactNode;
}

export type ChoiceCardProps = RadioOptionProps & {
  /** The choice (`span.xr-choice-title`: "Approve", "Return to vendor"). */
  readonly title: ReactNode;
} & (AvailableChoice | UnavailableChoice);

/**
 * A choice card (`label.xr-choice` > radio + `span` > title and sub; board 03 "Decision panel and
 * editable table", 09a AR-4, B1-11, B6-07). Checked, it adds `is-checked` as board 03 draws it
 * (the CSS also keys on `:has(input:checked)`). Unavailable, it adds `is-off`, disables the radio
 * and its sub line says why: never a silent grey option. Inside a RadioGroup; wrap the cards in
 * ChoiceList (`div.xr-choice-list`) as the product boards do.
 */
export function ChoiceCard({
  value,
  id,
  className,
  ref,
  title,
  sub,
  unavailable,
}: ChoiceCardProps) {
  const group = useRadioGroup('ChoiceCard');
  const checked = group.value === value;
  return (
    <label
      className={joinClasses(
        'xr-choice',
        className,
        checked && 'is-checked',
        unavailable && 'is-off',
      )}
      htmlFor={id}
    >
      <input
        ref={ref}
        id={id}
        type="radio"
        name={group.name}
        checked={checked}
        disabled={unavailable ? true : undefined}
        onChange={() => group.select(value)}
      />
      <span>
        <span className="xr-choice-title">{title}</span>
        {sub ? <span className="xr-choice-sub">{sub}</span> : null}
      </span>
    </label>
  );
}

/** The stack of choice cards (`div.xr-choice-list`, 8 px apart; B1-07, B1-11, board 03). */
export function ChoiceList({ children }: { readonly children: ReactNode }) {
  return <div className="xr-choice-list">{children}</div>;
}

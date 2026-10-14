'use client';

import { useCallback, useEffect, useRef, type MouseEvent, type Ref, type RefCallback } from 'react';

import { Icon } from '../foundation/icon.js';
import { joinClasses } from '../internal/classes.js';
import { useLinkComponent } from '../link.js';

/**
 * One summary entry. Shaped as the `FieldErrorView` of Appendix F §6.6 (`message`, the words under
 * the field, is not shown here), so a `FieldErrorView` can be passed as it is.
 */
export interface ErrorSummaryItem {
  /**
   * The id of the field to focus: an input, select or textarea; for a group, its fieldset, which
   * takes focus itself when it is focusable (B4-04 draws `fieldset#Cc-rel tabindex="-1"`) and
   * otherwise hands it to its chosen radio or else its first control that is not disabled.
   */
  readonly fieldId: string;
  /** The words of the summary link ("Enter a name for the assessment"; B4-04). */
  readonly summaryText: string;
}

export interface ErrorSummaryProps {
  /** The title, as drawn for the screen: "Check this step" (B2-05, B4-04), "Check your request". */
  readonly title: string;
  /** One linked entry per invalid field, in page order. Nothing renders while it is empty. */
  readonly items: readonly ErrorSummaryItem[];
  /** The summary's id (the boards give each one, e.g. `Cc-err` on B4-04). */
  readonly id?: string;
  /**
   * Moves focus to the summary when it appears (default `true`): page forms focus the summary on
   * every failed submit (Appendix E §5.1; Appendix F §6.6 "focused on submit"; B4-04 `fail` →
   * `focus(pid + '-err')`). To focus it again on a later failed submit while it is still shown,
   * call `focus()` through `ref`. Pass `false` only when the caller moves focus itself.
   */
  readonly autoFocus?: boolean;
  /** Board context classes or apps/web composition utilities. */
  readonly className?: string;
  readonly ref?: Ref<HTMLDivElement>;
}

/** In a group that does not take focus: its chosen radio, where Tab enters a radio group. */
const CHOSEN_OPTION = 'input[type="radio"]:checked:enabled';
/** Otherwise its first control that can take focus (an unavailable ChoiceCard's radio cannot). */
const FIRST_CONTROL =
  'input:enabled:not([type="hidden"]), select:enabled, textarea:enabled, button:enabled, [tabindex]:not(:disabled)';

/** What a summary link focuses: the field itself, or the control inside it that Tab would reach. */
function focusField(fieldId: string): void {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.focus();
  if (document.activeElement === field) return;
  (
    field.querySelector<HTMLElement>(CHOSEN_OPTION) ??
    field.querySelector<HTMLElement>(FIRST_CONTROL)
  )?.focus();
}

/**
 * The page error summary shown after a submit (Appendix E §3.2 ErrorSummary, §5.1; Appendix F
 * §6.6): `div.xw-errsum[role=alert][tabindex=-1]` with the error icon, the title in `strong` and a
 * `ul` of links to the fields (B4-04 "Step 2 · validation", B3-06 "Missing ratings"). Activating a
 * link moves focus to its field without navigating (board 12 "Summary links move focus to the
 * field"). Always linked: the plain-text lists of B2-05, B2-07, B2-14 and B3-08 are normalised to
 * links (VD-21). The emitted class `xw-errsum` is the owner-approved choice (VD-22, decided on
 * 14 Oct 2026 with its field-link behaviour; DEV-12) over the Batch-0 `xr-notice--err` drawing
 * (boards 03, 09b). The B5 "missing items" summary with
 * per-item "Go to …" buttons is Phase 5 and is not built here.
 */
export function ErrorSummary({
  title,
  items,
  id,
  autoFocus = true,
  className,
  ref,
}: ErrorSummaryProps) {
  const LinkComponent = useLinkComponent();
  const node = useRef<HTMLDivElement | null>(null);
  // A React 19 callback ref may return its own cleanup, which React then calls instead of
  // calling the ref with null. This merged ref returns a cleanup, so it passes the caller's on.
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
    <div
      ref={attach}
      className={joinClasses('xw-errsum', className)}
      role="alert"
      id={id}
      tabIndex={-1}
    >
      <Icon name="failed" />
      <div>
        <strong>{title}</strong>
        <ul>
          {items.map((item) => (
            <li key={item.fieldId}>
              <LinkComponent
                href={`#${item.fieldId}`}
                onClick={(event) => follow(event, item.fieldId)}
              >
                {item.summaryText}
              </LinkComponent>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

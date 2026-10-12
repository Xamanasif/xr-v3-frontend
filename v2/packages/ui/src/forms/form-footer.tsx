'use client';

import type { MouseEvent, ReactNode, Ref } from 'react';

import { Button } from '../foundation/button.js';
import type { IconName } from '../icons/registry.js';
import { joinClasses } from '../internal/classes.js';
import { useLinkComponent } from '../link.js';

/** A footer button: its words, its press and, for the primary, its busy state (via Button). */
export interface FormFooterButton {
  /** Verb + object, as drawn ("Continue", "Save draft", "Send for academic review"). */
  readonly label: ReactNode;
  readonly onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly type?: 'button' | 'submit';
  /** Busy as the boards draw it (B2-05 "Giving access…"): `is-busy`, spinner, ignores presses. */
  readonly busy?: boolean;
  readonly busyLabel?: ReactNode;
  /** A leading icon, where the board draws one (B2-07 "Choose the corrected file"). */
  readonly icon?: IconName;
  /** The boards give some footer buttons ids (B6-09 `Wd-u-sbtn`), e.g. to return focus. */
  readonly id?: string;
  readonly ref?: Ref<HTMLButtonElement>;
}

/**
 * The one quiet action at the start of the footer (`xr-btn--text`):
 * - `link` — Cancel, a link out of the flow (B2-05, B4-04, B5-03);
 * - `button` — Back to the previous step, keeping what was entered (B2-05, B4-04, B5-03);
 * - `destructive` — a destructive text action such as "Withdraw update" (`xg-del`; B6-08, B6-09),
 *   which opens a confirm rather than acting at once (Appendix E §3.1 Button).
 */
export type FormFooterStart =
  | {
      readonly kind: 'link';
      readonly label: ReactNode;
      readonly href: string;
      readonly id?: string;
    }
  | ({ readonly kind: 'button' } & FormFooterButton)
  | ({ readonly kind: 'destructive' } & FormFooterButton);

export interface FormFooterProps {
  /** The quiet action on the left; omit when the screen draws none. */
  readonly start?: FormFooterStart;
  /** The Save action (`xr-btn--secondary`), before the primary ("Save draft", "Save as draft"). */
  readonly save?: FormFooterButton;
  /** The primary action (`xr-btn--primary`), always last (board 03 "Button order"). */
  readonly primary: FormFooterButton;
  /** Board context classes or apps/web composition utilities. */
  readonly className?: string;
}

function FooterButton({
  action,
  variant,
  className,
}: {
  readonly action: FormFooterButton;
  readonly variant: 'text' | 'secondary' | 'primary';
  readonly className?: string;
}) {
  return (
    <Button
      variant={variant}
      className={className}
      type={action.type}
      busy={action.busy}
      busyLabel={action.busyLabel}
      icon={action.icon}
      id={action.id}
      ref={action.ref}
      onClick={action.onClick}
    >
      {action.label}
    </Button>
  );
}

/**
 * The guided-flow and form footer (`div.xw-flow-foot` with `div.xw-actions`; B2-05, B4-04,
 * B5-03…B5-07, B6-09): one quiet action on the left, then Save and the primary on the right, in
 * board 03's "Button order" (primary last on wide screens). Below 600 px of content the v46 sheet
 * wraps the actions above the quiet action and stretches them full width (`wrap-reverse`). The
 * public `xp-formfoot` (B1-07, B1-08) is Phase 1 and is not built here.
 */
export function FormFooter({ start, save, primary, className }: FormFooterProps) {
  const LinkComponent = useLinkComponent();
  let quiet: ReactNode = null;
  if (start?.kind === 'link') {
    quiet = (
      <LinkComponent className="xr-btn xr-btn--text" href={start.href} id={start.id}>
        {start.label}
      </LinkComponent>
    );
  } else if (start) {
    quiet = (
      <FooterButton
        action={start}
        variant="text"
        className={start.kind === 'destructive' ? 'xg-del' : undefined}
      />
    );
  }
  return (
    <div className={joinClasses('xw-flow-foot', className)}>
      {quiet}
      <div className="xw-actions">
        {save ? <FooterButton action={save} variant="secondary" /> : null}
        <FooterButton action={primary} variant="primary" />
      </div>
    </div>
  );
}

'use client';

import type { FormEventHandler, ReactNode, Ref } from 'react';

import { useLinkComponent } from '../link.js';
import { useFieldControl, type TextInputProps } from './fields.js';
import { Glyph } from './icons.js';
import { PRODUCT_NAME, V3_LOGO_SLOT_TEXT } from './shell.js';

/**
 * The Entry & shared sign-in page (XS-01 Sign in, XS-03 Signed out / session ended, XS-04 Forgot
 * password / first time; owner-approved export design/v3-refined-b/roles/XS-v6, `XsSignIn`): the
 * pieces of its card, emitting the export's classes. Every word, address and state comes from the
 * caller; the sign-in decision belongs to the application's session service, never to these.
 */

export interface EntryPageProps {
  /** The way out above the card ("Back to experiments") and where it goes. */
  readonly back: { readonly href: string; readonly label: string };
  /** The card, then anything under it (the prototype line). */
  readonly children: ReactNode;
}

/**
 * The whole page outside any workspace shell (`div.xr.rb` > `div.xs-entry`): the top row with its
 * way out, and the centred column that holds the card (`main.xs-entry-main`).
 */
export function EntryPage({ back, children }: EntryPageProps) {
  const Link = useLinkComponent();
  return (
    <div className="xr rb">
      <div className="xs-entry">
        <header className="xs-entry-top">
          <Link className="xs-back" href={back.href}>
            <Glyph name="back" />
            {back.label}
          </Link>
        </header>
        <main className="xs-entry-main">{children}</main>
      </div>
    </div>
  );
}

export interface EntryCardProps {
  /** The card's body: notices, the heading, the ways to sign in, the trouble links. */
  readonly children: ReactNode;
  /** The grey foot under the body ("Need access for your institution? …"). */
  readonly foot?: ReactNode;
}

/**
 * The sign-in card (`div.xs-card`): the navy head with the reserved logo slot (the official WILP
 * image is pending, owner decision 10) and the product name, the body, and the foot.
 */
export function EntryCard({ children, foot }: EntryCardProps) {
  return (
    <div className="xs-card">
      <div className="xs-card-head">
        <div className="xs-logo-box">
          <div className="rb-logo">{V3_LOGO_SLOT_TEXT}</div>
        </div>
        <p className="rb-product">{PRODUCT_NAME}</p>
      </div>
      <div className="xs-card-body">{children}</div>
      {foot ? <div className="xs-card-foot">{foot}</div> : null}
    </div>
  );
}

/** The card's one H1 (`h1.rb-h1.xs-fit`), a focus target after an in-app arrival. */
export function EntryHeading({
  id,
  ref,
  children,
}: {
  readonly id?: string;
  readonly ref?: Ref<HTMLHeadingElement>;
  readonly children: ReactNode;
}) {
  return (
    <h1 ref={ref} className="rb-h1 xs-fit" id={id} tabIndex={-1}>
      {children}
    </h1>
  );
}

/** The rule between the two ways to sign in (`p.xs-or`): "or sign in with e-mail". */
export function OrRule({ children }: { readonly children: ReactNode }) {
  return <p className="xs-or">{children}</p>;
}

/**
 * A refusal at the top of the card (`div.rk-errsum[role=alert]` with `p.xs-errsum-d`): "The e-mail
 * or password isn’t right — Check both and try again." It takes focus after the refused attempt.
 */
export function RefusalSummary({
  id,
  title,
  children,
  ref,
}: {
  readonly id?: string;
  readonly title: ReactNode;
  readonly children?: ReactNode;
  readonly ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div ref={ref} className="rk-errsum" id={id} tabIndex={-1} role="alert">
      <p className="rk-errsum-t">{title}</p>
      {children ? <p className="xs-errsum-d">{children}</p> : null}
    </div>
  );
}

/** The e-mail form (`form.xs-form`), validated by the application, never by the browser. */
export function EntryForm({
  label,
  onSubmit,
  children,
}: {
  /** The form's name for assistive technology ("Sign in with e-mail"). */
  readonly label?: string;
  readonly onSubmit: FormEventHandler<HTMLFormElement>;
  readonly children: ReactNode;
}) {
  return (
    <form className="xs-form" noValidate aria-label={label} onSubmit={onSubmit}>
      {children}
    </form>
  );
}

export interface PasswordInputProps extends Omit<TextInputProps, 'type'> {
  /** The password is shown as text. */
  readonly shown: boolean;
  readonly onToggle: () => void;
  /** "Show" / "Hide": the toggle's visible word. */
  readonly showLabel: string;
  readonly hideLabel: string;
  /** Read after the word by assistive technology only: " password". */
  readonly toggleSuffix: string;
}

/**
 * The password control (`div.xs-pw` > `input.rk-input` + `button.xs-pw-toggle`), wired by its V3
 * Field: the reveal button sits inside the field's right edge and names the field it controls.
 */
export function PasswordInput({
  shown,
  onToggle,
  showLabel,
  hideLabel,
  toggleSuffix,
  ref,
  ...rest
}: PasswordInputProps) {
  const control = useFieldControl();
  if (!control) throw new Error('PasswordInput goes inside a V3 Field.');
  return (
    <div className="xs-pw">
      <input
        {...rest}
        {...control}
        ref={ref}
        type={shown ? 'text' : 'password'}
        className="rk-input"
      />
      <button type="button" className="xs-pw-toggle" aria-controls={control.id} onClick={onToggle}>
        {shown ? hideLabel : showLabel}
        <span className="xr-sr">{toggleSuffix}</span>
      </button>
    </div>
  );
}

/** A field and the disclosure that belongs to it (`div.xs-field-row`): Password + "Forgot…?". */
export function FieldRow({ children }: { readonly children: ReactNode }) {
  return <div className="xs-field-row">{children}</div>;
}

/** The trouble links under the form (`div.xs-trouble`): "First time signing in?". */
export function TroubleLinks({ children }: { readonly children: ReactNode }) {
  return <div className="xs-trouble">{children}</div>;
}

export interface DisclosureProps {
  /** The id of the text it shows (`aria-controls`). */
  readonly id: string;
  /** The question: "Forgot your password?". */
  readonly label: ReactNode;
  readonly open: boolean;
  readonly onToggle: () => void;
  /** The answer, shown while open (`p.xs-disclose`). */
  readonly children: ReactNode;
}

/**
 * A question that shows its answer in place (`button.xs-linkbtn[aria-expanded]` + `p.xs-disclose`):
 * XS-04's contact route — nothing is sent, nothing links anywhere (T-11 / R02 open).
 */
export function Disclosure({ id, label, open, onToggle, children }: DisclosureProps) {
  return (
    <>
      <button
        type="button"
        className="xs-linkbtn"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
      >
        {label}
        <Glyph name="chevronDown" />
      </button>
      {open ? (
        <p className="xs-disclose" id={id}>
          {children}
        </p>
      ) : null}
    </>
  );
}

/** A polite announcement only assistive technology hears (`p.xs-live[role=status]`). */
export function LiveStatus({ children }: { readonly children?: ReactNode }) {
  return (
    <p className="xs-live" role="status">
      {children}
    </p>
  );
}

/**
 * The quiet line under the card in a local prototype build (`p.xs-proto`): it says the sign-in is
 * a stand-in, names no account, and goes when real sign-in exists.
 */
export function PrototypeNote({
  lead,
  children,
}: {
  /** The bold start: "Prototype sign-in." */
  readonly lead: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <p className="xs-proto">
      <Glyph name="info" />
      <span>
        <b>{lead}</b> {children}
      </span>
    </p>
  );
}

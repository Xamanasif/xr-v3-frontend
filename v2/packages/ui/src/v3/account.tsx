'use client';

import { useEffect, useRef, type FocusEvent, type KeyboardEvent, type RefObject } from 'react';

import { Icon as V46Icon } from '../foundation/icon.js';
import { useLinkComponent } from '../link.js';
import { useAccountMenu, type AccountMenuDisclosure } from '../overlays/account-menu.js';
import { Glyph, Icon } from './icons.js';

/**
 * XS-05, the account menu of every workspace (owner-approved Entry & shared export
 * design/v3-refined-b/roles/XS-v6, `XsAccountMenu`; shell patch XS-P3). One panel for every role:
 * the person's avatar, name, role and — for the institution roles and the Vendor — organisation,
 * then the links (My device for a Student with AR, VR or MR access; Help & support) and Sign out in
 * its own foot. Nothing else: no switcher, "view as", settings or profile.
 *
 * A disclosure (button + list), not an ARIA menu, on the shared v46 behaviour (`useAccountMenu`:
 * open state, Escape returns focus to the button) with the export's keys: Enter, Space, a click or
 * ArrowDown on the button opens it and moves focus to the first item; ArrowDown, ArrowUp, Home and
 * End move between the items (wrapping); Tab past the last item, or focus leaving the document,
 * closes it; a press outside lands on the outside-click layer (`button.xs-catch`), which closes it
 * and returns focus to the button without activating what is under it.
 */

/** A destination in the menu: "My device" (Student), "Help & support". */
export interface AccountMenuLink {
  readonly label: string;
  readonly href: string;
  readonly icon: 'headset' | 'help';
}

export interface AccountMenuProps {
  /** "Meera Iyer". */
  readonly name: string;
  /** The workspace role: "Institute Admin". */
  readonly role: string;
  /** The institution or the vendor's organisation, where the role has one. */
  readonly organisation?: string;
  /** "MI" (decorative). */
  readonly initials: string;
  /** In order: My device*, Help & support. */
  readonly links: readonly AccountMenuLink[];
  /** "Sign out", in the panel's foot: the caller ends this tab's sign-in. */
  readonly signOut: { readonly label: string; readonly onSelect: () => void };
  readonly menuId?: string;
}

/** The button's accessible name (XS-05 contract): "Account menu, Meera Iyer, Institute Admin, …". */
export function accountMenuName(name: string, role: string, organisation?: string): string {
  return `Account menu, ${[name, role, organisation].filter(Boolean).join(', ')}`;
}

interface XsDisclosure {
  readonly menu: AccountMenuDisclosure;
  readonly panelRef: RefObject<HTMLDivElement | null>;
  readonly onButtonClick: () => void;
  readonly rootProps: {
    readonly onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
    readonly onBlur: (event: FocusEvent<HTMLDivElement>) => void;
  };
}

function useXsAccountMenu(menuId: string | undefined): XsDisclosure {
  const menu = useAccountMenu(menuId);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const focusFirst = useRef(false);
  const items = () => [...(panelRef.current?.querySelectorAll<HTMLElement>('.xs-menu-item') ?? [])];

  // Opening moves focus to the first item once the panel is there.
  useEffect(() => {
    if (!menu.open || !focusFirst.current) return;
    focusFirst.current = false;
    panelRef.current?.querySelector<HTMLElement>('.xs-menu-item')?.focus();
  }, [menu.open]);

  const open = () => {
    focusFirst.current = true;
    if (!menu.open) menu.toggle();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!menu.open) {
      if (event.key === 'ArrowDown' && event.target === menu.buttonRef.current) {
        event.preventDefault();
        open();
      }
      return;
    }
    if (event.key === 'Escape') {
      menu.rootProps.onKeyDown(event);
      return;
    }
    const list = items();
    if (list.length === 0) return;
    const index = list.indexOf(event.currentTarget.ownerDocument.activeElement as HTMLElement);
    const last = list.length - 1;
    const next =
      event.key === 'ArrowDown'
        ? list[index < 0 || index === last ? 0 : index + 1]
        : event.key === 'ArrowUp'
          ? list[index <= 0 ? last : index - 1]
          : event.key === 'Home'
            ? list[0]
            : event.key === 'End'
              ? list[last]
              : undefined;
    if (!next) return;
    event.preventDefault();
    next.focus();
  };

  // Tab past the last item (to the next control, or out of the document) closes it; a press on
  // the panel keeps focus inside (the panel takes focus), so it does not.
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!menu.open) return;
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) return;
    menu.close(false);
  };

  return {
    menu,
    panelRef,
    onButtonClick: () => (menu.open ? menu.close(false) : open()),
    rootProps: { onKeyDown, onBlur },
  };
}

/** The outside-click layer and the panel (`button.xs-catch` + `div.xs-menu`). */
function AccountPanel({
  disclosure,
  name,
  role,
  organisation,
  initials,
  links,
  signOut,
}: Omit<AccountMenuProps, 'menuId'> & { readonly disclosure: XsDisclosure }) {
  const Link = useLinkComponent();
  const { menu, panelRef } = disclosure;
  return (
    <>
      <button
        type="button"
        className="xs-catch"
        tabIndex={-1}
        aria-label="Close account menu"
        // The press must not take focus first: the blur would close the menu before the click.
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => menu.close(true)}
      />
      <div ref={panelRef} className="xs-menu xs-nofocus" id={menu.panelId} tabIndex={-1}>
        <div className="xs-menu-head">
          <span className="xr-avatar" aria-hidden="true">
            {initials}
          </span>
          <p className="xs-menu-name">{name}</p>
          <p className="xs-menu-role">{role}</p>
          {organisation ? <p className="xs-menu-org">{organisation}</p> : null}
        </div>
        <ul className="xs-menu-list" aria-label="Account">
          {links.map((link) => (
            <li key={link.href}>
              <Link className="xs-menu-item" href={link.href} onClick={() => menu.close(false)}>
                <Glyph name={link.icon} />
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="xs-menu-foot">
          <button
            type="button"
            className="xs-menu-item"
            onClick={() => {
              menu.close(true);
              signOut.onSelect();
            }}
          >
            <Glyph name="signOut" />
            {signOut.label}
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * The V3 account chrome at the end of the Refined B top row (`div.xs-acct-slot` > `div.xs-acct` >
 * `button.rb-acct`: avatar, name, role, chevron) opening the XS panel (XS-P3).
 */
export function AccountMenu({ menuId, ...props }: AccountMenuProps) {
  const disclosure = useXsAccountMenu(menuId);
  const { menu } = disclosure;
  return (
    <div className="xs-acct-slot">
      <div ref={menu.rootRef} className="xs-acct" {...disclosure.rootProps}>
        <button
          ref={menu.buttonRef}
          type="button"
          className="rb-acct"
          aria-expanded={menu.open}
          aria-controls={menu.panelId}
          aria-label={accountMenuName(props.name, props.role, props.organisation)}
          onClick={disclosure.onButtonClick}
        >
          <span className="xr-avatar" aria-hidden="true">
            {props.initials}
          </span>
          <span className="rb-acct-text" aria-hidden="true">
            <span className="rb-acct-name">{props.name}</span>
            <span className="rb-acct-role">{props.role}</span>
          </span>
          <Icon name="chevronDown" size={18} />
        </button>
        {menu.open ? <AccountPanel disclosure={disclosure} {...props} /> : null}
      </div>
    </div>
  );
}

/**
 * The XS account menu in the top bar of a role whose own V3 design is still pending: the v46
 * account button as that shell draws it (`div.xr-acct` > `button.xr-acct-btn`, unchanged look),
 * opening the XS panel inside a V3 root that generates no box (`div.xr.rb.rk-x-popover`, V3P-10).
 * Transitional: retired when the last role moves to the V3 shell.
 */
export function AccountMenuInV46Shell({ menuId, ...props }: AccountMenuProps) {
  const disclosure = useXsAccountMenu(menuId);
  const { menu } = disclosure;
  return (
    <div ref={menu.rootRef} className="xr-acct" {...disclosure.rootProps}>
      <button
        ref={menu.buttonRef}
        type="button"
        className="xr-acct-btn"
        aria-expanded={menu.open}
        aria-controls={menu.panelId}
        aria-label={accountMenuName(props.name, props.role, props.organisation)}
        onClick={disclosure.onButtonClick}
      >
        <span className="xr-avatar" aria-hidden="true">
          {props.initials}
        </span>
        <span className="xr-acct-text" aria-hidden="true">
          <span className="xr-acct-name">{props.name}</span>
          <span className="xr-acct-role">{props.role}</span>
        </span>
        <V46Icon name="chevronDown" className="xr-acct-chev" />
      </button>
      {menu.open ? (
        <div className="xr rb rk-x-popover">
          <AccountPanel disclosure={disclosure} {...props} />
        </div>
      ) : null}
    </div>
  );
}

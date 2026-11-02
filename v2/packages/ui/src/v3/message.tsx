'use client';

import type { ReactNode, Ref } from 'react';

import { ButtonLink, TextLink } from './actions.js';
import { Glyph, type V3IconName } from './icons.js';

/**
 * The message page of the Entry & shared export (design/v3-refined-b/roles/XS-v6, `XsMessage`;
 * the "Report sent" confirmation of `XsHelp`): one card in the person's own shell — an icon disc,
 * the page's only H1 (focused on arrival), one sentence, one primary action named by its
 * destination and a quiet link. XS-06 "This page isn’t part of your workspace" and the XS-08
 * refusals. It never names the protected page, its records, route, role code or an error code.
 */
export type MessageKind = 'not-allowed' | 'paused' | 'inactive' | 'done';

const MESSAGE_ICON: Readonly<
  Record<MessageKind, { readonly icon: V3IconName; readonly disc: string }>
> = {
  'not-allowed': { icon: 'lock', disc: 'xs-msg-ico' },
  paused: { icon: 'pauseCircle', disc: 'xs-msg-ico xs-msg-ico--paused' },
  inactive: { icon: 'ended', disc: 'xs-msg-ico xs-msg-ico--off' },
  done: { icon: 'check', disc: 'xs-msg-ico xs-msg-ico--ok' },
};

export interface MessagePageProps {
  readonly kind: MessageKind;
  /** The page's one H1. */
  readonly title: ReactNode;
  readonly titleId: string;
  readonly titleRef?: Ref<HTMLHeadingElement>;
  /** The one sentence (`p.xs-msg-d`). */
  readonly children: ReactNode;
  /** The primary action, named by where it goes: "Back to Overview", "View my reports". */
  readonly primary: { readonly href: string; readonly label: string };
  /** The quiet link after it: "Help", "Back to Home". */
  readonly secondary?: { readonly href: string; readonly label: string };
}

/** `section.xs-msg` labelled by its H1. */
export function MessagePage({
  kind,
  title,
  titleId,
  titleRef,
  children,
  primary,
  secondary,
}: MessagePageProps) {
  const { icon, disc } = MESSAGE_ICON[kind];
  return (
    <section className="xs-msg" aria-labelledby={titleId}>
      <span className={disc} aria-hidden="true">
        <Glyph name={icon} />
      </span>
      {/* xs-nofocus (K-13): focus moves here on arrival for screen readers; the heading is not
          interactive, so it draws no ring (as `main.rb-page` and the account panel). */}
      <h1 ref={titleRef} className="rb-h1 xs-fit xs-nofocus" id={titleId} tabIndex={-1}>
        {title}
      </h1>
      <p className="xs-msg-d">{children}</p>
      <div className="xs-msg-act">
        <ButtonLink variant="primary" size="lg" href={primary.href}>
          {primary.label}
        </ButtonLink>
        {secondary ? <TextLink href={secondary.href}>{secondary.label}</TextLink> : null}
      </div>
    </section>
  );
}

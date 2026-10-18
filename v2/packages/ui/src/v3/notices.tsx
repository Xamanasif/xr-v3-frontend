import type { ReactNode, Ref } from 'react';

import { Glyph, type V3IconName } from './icons.js';

/**
 * Refined B notice tones (rb-kit.css `rk-notice--*`): `warn` ivory (urgency), `paused` navy outline,
 * `off` grey (ended, not available), `ok` green, `info` indigo tint.
 */
export type NoticeTone = 'warn' | 'paused' | 'off' | 'ok' | 'info';

const NOTICE_ICON: Readonly<Record<NoticeTone, V3IconName>> = {
  warn: 'calendar',
  paused: 'pauseCircle',
  off: 'ended',
  ok: 'check',
  info: 'alertCircle',
};

export interface NoticeProps {
  readonly tone: NoticeTone;
  /** What it is (`p.rk-notice-t`): "This institution is paused". */
  readonly title: ReactNode;
  /** What it means and what can be done (`p.rk-notice-d`). */
  readonly children?: ReactNode;
  /** One or two next steps (`div.rk-notice-act`). */
  readonly actions?: ReactNode;
  readonly icon?: V3IconName;
  /** The live-region role: `status` when it appears after an action; none for a static notice. */
  readonly role?: 'status' | 'alert';
  /** For a notice that takes focus after an action (`tabIndex={-1}`). */
  readonly ref?: Ref<HTMLDivElement>;
}

/** A notice (`div.rk-notice`): icon, title, description and actions. */
export function Notice({ tone, title, children, actions, icon, role, ref }: NoticeProps) {
  return (
    <div
      ref={ref}
      className={`rk-notice rk-notice--${tone}`}
      role={role}
      tabIndex={ref ? -1 : undefined}
    >
      <Glyph name={icon ?? NOTICE_ICON[tone]} />
      <p className="rk-notice-t">{title}</p>
      {children ? <p className="rk-notice-d">{children}</p> : null}
      {actions ? <div className="rk-notice-act">{actions}</div> : null}
    </div>
  );
}

export interface BannerProps {
  /** The banner's words: "Your institution’s access is paused — your work is kept." */
  readonly children: ReactNode;
  /** A link at the end ("Help"). */
  readonly action?: ReactNode;
  readonly icon?: V3IconName;
}

/** The page banner (`div.rk-banner[role=status]`): a paused institution (IA-02). */
export function Banner({ children, action, icon = 'pauseCircle' }: BannerProps) {
  return (
    <div className="rk-banner" role="status">
      <Glyph name={icon} />
      <p>{children}</p>
      {action}
    </div>
  );
}

export type PlanNoteTone = 'warn' | 'off' | 'paused';

const PLAN_NOTE_ICON: Readonly<Record<PlanNoteTone, V3IconName>> = {
  warn: 'calendar',
  off: 'ended',
  paused: 'lock',
};

export interface PlanNoteProps {
  readonly tone: PlanNoteTone;
  /** "Ends on 7 Oct 2027", "This plan has ended". */
  readonly title: ReactNode;
  readonly children?: ReactNode;
  /** One action at the end ("Request renewal"). */
  readonly action?: ReactNode;
  readonly icon?: V3IconName;
}

/** The note strip at the foot of a plan band when the plan needs attention (`div.rk-plan-note`). */
export function PlanNote({ tone, title, children, action, icon }: PlanNoteProps) {
  return (
    <div className={`rk-plan-note rk-plan-note--${tone}`}>
      <Glyph name={icon ?? PLAN_NOTE_ICON[tone]} />
      <div>
        <p className="rk-plan-note-t">{title}</p>
        {children ? <p className="rk-plan-note-d">{children}</p> : null}
      </div>
      {action}
    </div>
  );
}

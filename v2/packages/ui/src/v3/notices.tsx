import type { ReactNode, Ref } from 'react';

import { joinClasses } from '../internal/classes.js';
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
  /** The notice's id: a focus target after an action (`tabIndex={-1}` with it). */
  readonly id?: string;
  /**
   * Its spacing in a Faculty list (V3P-17, the Faculty export's inline spacings): `below` 14 px
   * over what follows (`rk-x-notice-below`, FA-09's message and version notices), `above` 16 px
   * under the line before it (`rk-x-notice-above`, FA-16's message over the drafts).
   */
  readonly space?: 'above' | 'below';
  /**
   * Its actions' labels wrap instead of overflowing a narrow notice (`rk-x-notice-wrap`, V3P-17):
   * FA-09's "Add this question to the assessment", wider than the notice's column at 375 px.
   */
  readonly wrapActions?: boolean;
  /**
   * Opt-in: the role export's own class on the notice, beside `rk-notice` (the Student export's
   * `sv-fb-msg` over the feedback sheet, `sv-launch-err` in the launch card, `sv-devnoia` in the
   * transfer request). None by default.
   */
  readonly className?: string;
}

const NOTICE_SPACE = { above: 'rk-x-notice-above', below: 'rk-x-notice-below' } as const;

/** A notice (`div.rk-notice`): icon, title, description and actions. */
export function Notice({
  tone,
  title,
  children,
  actions,
  icon,
  role,
  ref,
  id,
  space,
  wrapActions = false,
  className,
}: NoticeProps) {
  return (
    <div
      ref={ref}
      id={id}
      className={joinClasses(
        'rk-notice',
        `rk-notice--${tone}`,
        space && NOTICE_SPACE[space],
        wrapActions && 'rk-x-notice-wrap',
        className,
      )}
      role={role}
      tabIndex={ref || id ? -1 : undefined}
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
  /**
   * `paused` (the IA-02 banner) or `inactive` (the XS-08 neutral variant, `xs-banner--inactive`:
   * an inactive account), with its own icon unless `icon` is given.
   */
  readonly tone?: 'paused' | 'inactive';
  readonly icon?: V3IconName;
}

/**
 * The page banner (`div.rk-banner[role=status]`): a paused institution (IA-02; XS-08), or an
 * inactive account in the grey XS variant. Display only: it never grants or hides anything.
 */
export function Banner({ children, action, tone = 'paused', icon }: BannerProps) {
  return (
    <div
      className={tone === 'inactive' ? 'rk-banner xs-banner--inactive' : 'rk-banner'}
      role="status"
    >
      <Glyph name={icon ?? (tone === 'inactive' ? 'ended' : 'pauseCircle')} />
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

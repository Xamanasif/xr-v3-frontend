import { joinClasses } from '../internal/classes.js';

export interface AvatarProps {
  /** The person's initials ("RV", "MI"); the control around the avatar carries the full name. */
  readonly initials: string;
  /** Board context classes or composition. */
  readonly className?: string;
}

/**
 * The 36 px initials circle (`span.xr-avatar`; boards 05, 06 "Drawer · Student · 375 px").
 * Always `aria-hidden`: it sits inside a named control ("Account menu: Rahul Verma, Student").
 */
export function Avatar({ initials, className }: AvatarProps) {
  return (
    <span className={joinClasses('xr-avatar', className)} aria-hidden="true">
      {initials}
    </span>
  );
}

export interface CountBadgeProps {
  /** The figure shown (hidden from screen readers): 12. */
  readonly count: number | string;
  /**
   * The count in words, read instead of the figure ("12 written answers to mark", "3 requests
   * under review"). Drawn as `span.xr-sr` after a comma, so a destination reads
   * "Marking, 12 written answers to mark" (boards 05, 06; B1-10).
   */
  readonly label: string;
}

/**
 * The count beside a sidebar destination (`span.xr-count`, gold in the rail; boards 05, 06,
 * B1-10). Drawn only where there is something to count: the caller omits it at zero (board 05
 * `hasCount`).
 */
export function CountBadge({ count, label }: CountBadgeProps) {
  return (
    <span className="xr-count">
      <span aria-hidden="true">{count}</span>
      <span className="xr-sr">, {label}</span>
    </span>
  );
}

export interface TabCountProps {
  /** The figure after a tab label ("Students 214"); 0 is drawn as 0 (B4-05). */
  readonly count: number | string;
}

/**
 * The count chip inside a tab (`span.xr-tab-count`; board 03 "Section tabs · sub-navigation
 * inside “People”"). The boards draw the bare figure: it is part of the tab's name.
 */
export function TabCount({ count }: TabCountProps) {
  return <span className="xr-tab-count">{count}</span>;
}

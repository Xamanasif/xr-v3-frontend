import type { ReactNode } from 'react';

import { Glyph, type V3IconName } from './icons.js';

export interface CourseCodeProps {
  /** The meaningful academic course code, as given: "ME ZG523". */
  readonly code: string;
  /**
   * `chip` (rk-code, indigo, record pages), `plain` (rk-code--plain, grey) or `group` (rb-code,
   * the course-group head of IA-01 / IA-02).
   */
  readonly variant?: 'chip' | 'plain' | 'group';
}

/** A BITS course code chip. Academic course codes stay visible in every role (owner decision 6). */
export function CourseCode({ code, variant = 'chip' }: CourseCodeProps) {
  if (variant === 'group') return <span className="rb-code">{code}</span>;
  return <span className={variant === 'plain' ? 'rk-code rk-code--plain' : 'rk-code'}>{code}</span>;
}

/** The institution's own course code (`span.rk-owncode`, outlined): "MEC-523". */
export function InstitutionCode({ code }: { readonly code: string }) {
  return <span className="rk-owncode">{code}</span>;
}

/**
 * The ivory tag for a missing value (`span.rk-tag-warn`): "Your course code: not added" (IA-02,
 * the warning triangle), "Needs one" (SA-06 without an Institute Admin, the export's person-minus
 * `userMinus`), "No platform code yet" (SA-14, SA-15: no icon, `icon={null}`).
 */
export function MissingTag({
  icon = 'alertTriangle',
  children,
}: {
  readonly icon?: V3IconName | null;
  readonly children: ReactNode;
}) {
  return (
    <span className="rk-tag-warn">
      {icon ? <Glyph name={icon} /> : null}
      {children}
    </span>
  );
}

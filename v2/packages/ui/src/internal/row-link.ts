import type { MouseEvent } from 'react';

/** What a press on a linked row leaves alone: the row's own controls. */
const INTERACTIVE = 'a, button, input, select, textarea, label, summary, [tabindex]';

/**
 * A press on a whole-row link (`tr.is-link`) follows the row's name link (`a.rk-rowlink`) — not on
 * another control of the row, not when it ends a text selection. The Institute Admin's list table
 * (`IaListTable`) and students' roster (`IaRoster`) share it.
 */
export function followRowLink(event: MouseEvent<HTMLTableRowElement>): void {
  const target = event.target;
  const control = target instanceof Element ? target.closest(INTERACTIVE) : null;
  if (control && event.currentTarget.contains(control)) return;
  if (window.getSelection()?.toString()) return;
  event.currentTarget.querySelector<HTMLAnchorElement>('a.rk-rowlink')?.click();
}

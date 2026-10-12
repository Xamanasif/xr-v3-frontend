export interface RailTooltipProps {
  /** The destination name, the same words as the link's `span.xr-nav-text` ("Overview", "Help"). */
  readonly children: string;
}

/**
 * The rail tooltip (Appendix E §3.4 RailTooltip; boards 05, 06 "Rail · Institute Admin · tooltip
 * on hover and focus"): `<span class="xr-tip">Home</span>` after `span.xr-nav-text` inside a
 * sidebar nav link, as every product sidebar draws it. The v46 CSS shows it only in the rail
 * (1024–1279, or `.is-rail`), on hover and `:focus-visible`; elsewhere it is `display:none`.
 *
 * Not `role="tooltip"` and not `aria-hidden` (the boards draw neither): in the rail the
 * `xr-nav-text` is `display:none` and this text is the link's name; in the full sidebar this span
 * is `display:none`. Either way the accessible name is the destination name, once.
 */
export function RailTooltip({ children }: RailTooltipProps) {
  return <span className="xr-tip">{children}</span>;
}

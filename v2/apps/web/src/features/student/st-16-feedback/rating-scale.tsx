'use client';

import type { Rating } from '@xr/domain';
import { FieldError } from '@xr/ui';

/** The five points in order; each is labelled in words, never by colour alone (B3-06 `FB.scale`). */
const POINTS: readonly Rating[] = [1, 2, 3, 4, 5];

/**
 * The radio as a transparent cover over its whole point. xr-foundation.css hides it as a 1 × 1 px
 * box at `opacity:0` (`.xr-scale input{position:absolute;opacity:0;width:1px;height:1px}`) and
 * rings the label instead (`label:has(input:focus-visible)`): the keyboard walk then reaches a
 * target nobody can see (BC13). Here it keeps the label's ring and look but fills the point —
 * no appearance, no paint, no own outline — so the focused control is the visible point itself.
 * Product-level until `@xr/ui` builds the deferred RatingScale (a PF entry for its sheet).
 */
const COVER =
  '[appearance:none] [inset:0] [width:100%] [height:100%] [margin:0] [opacity:1] [border:0] [border-radius:8px] [background:transparent] [cursor:pointer] focus-visible:[outline:none]';

/**
 * One statement and its 1–5 scale, as B3-06 draws it (f0, f1, f6; the `RatingScale 1–5` row the
 * `@xr/ui` ledger defers to Phase 3, built here in the screen's own folder):
 * `fieldset.xr-fieldset#<id>` (described by its error while it has one) > `legend.xr-legend` "1.
 * This experience …", the error "Choose a rating" (`span.xr-error`), then `div.xr-scale` — five
 * labels, each a visually hidden radio, the number (`span.xr-scale-n`) and its words. The radios
 * share one name, so the arrow keys move the choice and Tab enters on the chosen one (board 12
 * "Radio groups, scales"). Below 520 px of content the v46 sheet stacks the points into
 * full-width touch rows (f6). The fieldset is the error summary's link target.
 */
export function RatingScale({
  id,
  legend,
  labels,
  value,
  error,
  onChange,
}: {
  readonly id: string;
  readonly legend: string;
  /** "Strongly disagree" … "Strongly agree", by point. */
  readonly labels: Readonly<Record<Rating, string>>;
  readonly value: Rating | null;
  /** The service's words for a missing rating ("Choose a rating"), or none. */
  readonly error: string | null;
  readonly onChange: (rating: Rating) => void;
}) {
  const errorId = `${id}-e`;
  return (
    <fieldset className="xr-fieldset" id={id} aria-describedby={error ? errorId : undefined}>
      <legend className="xr-legend">{legend}</legend>
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
      <div className={error ? 'xr-scale is-invalid' : 'xr-scale'}>
        {POINTS.map((point) => {
          const optionId = `${id}-${point}`;
          return (
            <label key={point} htmlFor={optionId}>
              <input
                className={COVER}
                type="radio"
                id={optionId}
                name={id}
                value={point}
                checked={value === point}
                onChange={() => onChange(point)}
              />
              <span className="xr-scale-n">{point}</span>
              {labels[point]}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

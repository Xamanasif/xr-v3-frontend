import { LANDING_ART_DEFS } from './art';

/**
 * The landing's hidden SVG `<defs>` (frozen 52–402): gradients, clip paths and the drawings every
 * `<use href="#pl1-…">` of the landing points at, inserted once and unchanged (`art.ts`).
 */
export function LandingArtDefs() {
  return (
    <svg aria-hidden="true" focusable="false" className="pl1-defs">
      <defs dangerouslySetInnerHTML={{ __html: LANDING_ART_DEFS }} />
    </svg>
  );
}

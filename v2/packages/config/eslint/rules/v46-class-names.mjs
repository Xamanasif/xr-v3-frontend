// ESLint rule `xr/v46-class-names` — @xr/ui emits the board class names exactly, and nothing
// else: no Tailwind or other utility classes (ADR-0001 §4–5; Appendix F §3.4, §3.8).
//
// A class token must carry a v46 stylesheet prefix — xr- (foundation, and the `xr-x-*` product
// classes), xp- (public), xw- (workspace), xl- (learning), xa- (assessment), xv- (vendor),
// xg- (governance), xd- (admin) — or be an `is-*` state class. Canvas-only names that share a
// prefix (`is-focus`, `xa-boardctl`, …) are refused separately by `xr/no-canvas-classes`.
// The one bare prefix in use is `xp`, the public-shell container (`xr-public.css`; 138 board
// uses).
import { classStringPieces, isClassAttribute, tokensOf } from './class-strings.mjs';

const PREFIX = '(?:xr|xp|xw|xl|xa|xg|xv|xd)';
const WHOLE = new RegExp(
  `^(?:xp|${PREFIX}-[a-z0-9]+(?:(?:-|--|__)[a-z0-9]+)*|is-[a-z0-9]+(?:-[a-z0-9]+)*)$`,
);
const PREFIX_FRAGMENT = new RegExp(`^(?:${PREFIX}|is)-[a-z0-9_-]*$`);
const SUFFIX_FRAGMENT = /^[a-z0-9_-]*$/;

export const v46ClassNamesRule = {
  meta: {
    type: 'problem',
    docs: { description: 'Allow only v46 board class names in @xr/ui class attributes.' },
    schema: [],
    messages: {
      notV46:
        '"{{token}}" is not a v46 class name. @xr/ui emits the board classes exactly (xr-, xp-, xw-, xl-, xa-, xg-, xv-, xd-, is-); Tailwind and other utility classes are not allowed here (ADR-0001 §4–5).',
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (!isClassAttribute(node)) return;
        for (const piece of classStringPieces(node)) {
          for (const { token, leftFragment, rightFragment } of tokensOf(piece)) {
            const valid = leftFragment
              ? SUFFIX_FRAGMENT.test(token)
              : rightFragment
                ? PREFIX_FRAGMENT.test(token) || WHOLE.test(token)
                : WHOLE.test(token);
            if (!valid) context.report({ node: piece.node, messageId: 'notV46', data: { token } });
          }
        }
      },
    };
  },
};

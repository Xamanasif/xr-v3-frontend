// ESLint rule `xr/v3-class-names` — the V3 presentation layer of @xr/ui (`src/v3/**`, foundation
// XR-V3-RB-1.0, ADR-0010) emits the Refined Direction B class names exactly, and nothing else: no
// Tailwind or other utility classes.
//
// A class token must be a V3 root class (`xr`, `rb`), carry a Refined B prefix — `xr-` (core.css),
// `rb-` (rb.css), `rk-` (rb-kit.css) — or the prefix of an owner-approved role export's extension
// sheet — `xs-` (Entry & shared, design/v3-refined-b/roles/XS-v6/project/xs-shared.css), `sa-`
// (Super Admin, design/v3-refined-b/roles/SA-v1/project/sa-role.css) — or be an `is-*` state
// class. The XS preview-only scaffolding (`xs-slot*`, `xs-pub*`, `xs-spec`, `xs-kit*`) and the SA
// preview controls (`sa-pv-*`) are canvas-only and refused by `xr/no-canvas-classes`. The `xr-` prefix is shared with
// the v46 foundation sheet, so a v46 container class (`xr-app`, for a v46 island) is accepted here
// too; the rendered-class tests (`expectV3ClassesOnly`) prove each token is defined. Product-added
// V3 classes (`rk-x-*`) must be on V3_PRODUCT_CLASS_ALLOW_LIST, and the v46 product classes
// (`xr-x-*`) never appear in the V3 layer. Canvas-only names are refused by `xr/no-canvas-classes`.
import { V3_PRODUCT_CLASS_ALLOW_LIST } from '../../policy/terms.mjs';
import { classStringPieces, isClassAttribute, tokensOf } from './class-strings.mjs';

const PREFIX = '(?:xr|rb|rk|xs|sa)';
const WHOLE = new RegExp(
  `^(?:xr|rb|${PREFIX}-[a-z0-9]+(?:(?:-|--|__)[a-z0-9]+)*|is-[a-z0-9]+(?:-[a-z0-9]+)*)$`,
);
const PREFIX_FRAGMENT = new RegExp(`^(?:${PREFIX}|is)-[a-z0-9_-]*$`);
const SUFFIX_FRAGMENT = /^[a-z0-9_-]*$/;

/** `rk-x-*` only from the V3 list (a prefix fragment must lead to one); `xr-x-*` never. */
function productClassAllowed(token, fragment) {
  if (token.startsWith('xr-x-')) return false;
  if (!token.startsWith('rk-x-')) return true;
  return fragment
    ? V3_PRODUCT_CLASS_ALLOW_LIST.some((name) => name.startsWith(token))
    : V3_PRODUCT_CLASS_ALLOW_LIST.includes(token);
}

export const v3ClassNamesRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Allow only Refined Direction B class names in the @xr/ui V3 layer.',
    },
    schema: [],
    messages: {
      notV3:
        '"{{token}}" is not a Refined Direction B class name. The V3 layer emits the foundation classes exactly (xr, rb, xr-, rb-, rk-, is-) and the approved XS extension classes (xs-); Tailwind and other utility classes are not allowed here (ADR-0010).',
      notAllowed:
        '"{{token}}" is not on the V3 product-class allow-list (V3_PRODUCT_CLASS_ALLOW_LIST, ADR-0010). Add a product class only with a V3P patch entry; v46 product classes (xr-x-*) never appear in the V3 layer.',
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
            if (!valid) context.report({ node: piece.node, messageId: 'notV3', data: { token } });
            else if (!productClassAllowed(token, !leftFragment && rightFragment)) {
              context.report({ node: piece.node, messageId: 'notAllowed', data: { token } });
            }
          }
        }
      },
    };
  },
};

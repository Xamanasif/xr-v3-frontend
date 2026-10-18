// ESLint rule `xr/product-class-allow-list` — every product class (`xr-x-*`) that @xr/ui source
// mentions in a string must be on PRODUCT_CLASS_ALLOW_LIST (T-4; Appendix F WP-0.6 acceptance 2),
// and every V3 product class (`rk-x-*`, ADR-0010) on V3_PRODUCT_CLASS_ALLOW_LIST.
// `xr/v46-class-names` and `xr/v3-class-names` read className attributes only; product classes
// kept in a lookup table (PF-04 dialog alignment, for example) are checked here, in .ts and .tsx
// alike. A token cut by a template expression (`xr-x-dialog--${align}`) must be the start of an
// allow-listed name.
import { PRODUCT_CLASS_ALLOW_LIST, V3_PRODUCT_CLASS_ALLOW_LIST } from '../../policy/terms.mjs';

const FAMILIES = [
  { token: /(?<![\w-])xr-x-[a-z0-9-]*/g, prefix: 'xr-x-', list: PRODUCT_CLASS_ALLOW_LIST },
  { token: /(?<![\w-])rk-x-[a-z0-9-]*/g, prefix: 'rk-x-', list: V3_PRODUCT_CLASS_ALLOW_LIST },
];

function check(context, node, text, openRight) {
  for (const { token: pattern, prefix, list } of FAMILIES) {
    for (const match of text.matchAll(pattern)) {
      const token = match[0];
      const fragment = openRight && match.index + token.length === text.length;
      const allowed = fragment
        ? token.length > prefix.length && list.some((name) => name.startsWith(token))
        : list.includes(token);
      if (!allowed) context.report({ node, messageId: 'notAllowed', data: { token } });
    }
  }
}

export const productClassAllowListRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Allow only listed product (xr-x-*, rk-x-*) class names in @xr/ui strings.',
    },
    schema: [],
    messages: {
      notAllowed:
        '"{{token}}" is not on its product-class allow-list (PRODUCT_CLASS_ALLOW_LIST, T-4; Appendix F WP-0.6 — or V3_PRODUCT_CLASS_ALLOW_LIST, ADR-0010). Add a product class only with an approved PF or V3P entry.',
    },
  },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value === 'string') check(context, node, node.value, false);
      },
      TemplateElement(node) {
        check(context, node, node.value.cooked ?? node.value.raw, !node.tail);
      },
    };
  },
};

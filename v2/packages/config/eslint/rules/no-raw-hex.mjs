// ESLint rule `xr/no-raw-hex` — no raw hex colours in TSX (Appendix F §3.8; T-4): colours come
// from the verbatim v46 stylesheets, and product-only values from documented `--xr-x-*`
// tokens in the product layer. The icon registry and tests are exempted in the config.

const COLOUR = '#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])';
// A hex colour is the whole string ('#fff'); follows ':' '(' or ',' (a CSS value); follows a
// length or a border style ('1px solid #000', '0 0 0 2px #333'); or follows a space and
// contains a letter ('solid #ccc'). Digits after a plain word ('Issue #123') are text.
const HEX = [
  new RegExp(`^(${COLOUR})$`),
  new RegExp(`[:(,]\\s*(${COLOUR})`),
  new RegExp(
    `(?:\\d(?:px|r?em|%|vh|vw|ch)|\\b(?:solid|dashed|dotted|double|groove|ridge|inset|outset))\\s+(${COLOUR})`,
  ),
  new RegExp(`\\s(#(?=[0-9]*[a-fA-F])${COLOUR.slice(1)})`),
];

/** Attributes whose values are URLs or element references, where `#abc` is a fragment. */
const REFERENCE_ATTRIBUTES = new Set([
  'href',
  'xlinkHref',
  'xlink:href',
  'to',
  'id',
  'htmlFor',
  'form',
  'list',
  'key',
  'aria-controls',
  'aria-describedby',
  'aria-details',
  'aria-errormessage',
  'aria-flowto',
  'aria-labelledby',
  'aria-owns',
  'aria-activedescendant',
]);

function referenceAttribute(node) {
  let current = node.parent;
  while (current && current.type !== 'JSXAttribute') {
    if (current.type === 'JSXElement' || current.type === 'Program') return false;
    current = current.parent;
  }
  return Boolean(
    current &&
    current.name?.type === 'JSXIdentifier' &&
    REFERENCE_ATTRIBUTES.has(current.name.name),
  );
}

function isModuleSource(node) {
  const parent = node.parent;
  return (
    parent &&
    (parent.type === 'ImportDeclaration' ||
      parent.type === 'ExportNamedDeclaration' ||
      parent.type === 'ExportAllDeclaration' ||
      parent.type === 'ImportExpression') &&
    parent.source === node
  );
}

export const noRawHexRule = {
  meta: {
    type: 'problem',
    docs: { description: 'Forbid raw hex colour values in TSX.' },
    schema: [],
    messages: {
      rawHex:
        'Raw hex colour "{{hex}}": use the v46 classes, or a documented `--xr-x-*` product token in the product layer (T-4; ADR-0001; Appendix F §3.8).',
    },
  },
  create(context) {
    function check(node, text) {
      const match = HEX.map((pattern) => pattern.exec(text)).find(Boolean);
      if (match && !referenceAttribute(node)) {
        context.report({ node, messageId: 'rawHex', data: { hex: match[1] } });
      }
    }
    return {
      Literal(node) {
        if (typeof node.value === 'string' && !isModuleSource(node)) check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.cooked ?? node.value.raw);
      },
    };
  },
};

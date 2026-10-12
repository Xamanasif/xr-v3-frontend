// ESLint rule `xr/no-canvas-classes` — canvas-only class names never reach product code
// (Appendix F §3.8; Appendix E §2.6 and §10; START-HERE exceptions 2–4, 6). The class list is
// shared with the static scans and the rendered-DOM check (`policy/terms.mjs`).
import { CANVAS_CLASS_PATTERNS } from '../../policy/terms.mjs';

function canvasTokens(text) {
  return text
    .split(/\s+/)
    .filter((token) => token && CANVAS_CLASS_PATTERNS.some((pattern) => pattern.test(token)));
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

export const noCanvasClassesRule = {
  meta: {
    type: 'problem',
    docs: { description: 'Forbid canvas-only class names in product code.' },
    schema: [],
    messages: {
      canvasClass:
        '"{{token}}" is a canvas-only class (board frame, caption, annotation, static specimen state or board control); it is never part of the product (Appendix E §10; Appendix F §3.8).',
    },
  },
  create(context) {
    function check(node, text) {
      for (const token of canvasTokens(text)) {
        context.report({ node, messageId: 'canvasClass', data: { token } });
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

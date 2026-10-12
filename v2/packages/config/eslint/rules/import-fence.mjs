// ESLint rule `xr/import-fence` — the layer fences of Appendix F §3.8 (WP-0.4).
//
// The boundary matrix (`resolved-boundaries.mjs`) decides which PACKAGES may depend on which.
// This rule fences folders INSIDE a package: which specifiers a file group may import, which
// only as types, and which named values (vocabulary) it may take from a module.
//
// Options (one object):
//   fence       name used in messages
//   allow       globs; when present, every import in scope must match one (an allow-list)
//   scope       'project' (default): the allow-list covers internal (`@/…`) and workspace
//               (`@xr/…`) specifiers; 'all': third-party specifiers too
//   deny        [{ pattern, except?, reason }] — always refused, checked first
//   typeOnly    globs importable only with `import type`
//   vocabulary  { specifier: [names] } — value imports limited to these names (types free)
//   root        absolute folder; relative imports must stay inside it
//
// Globs: `*` = one path segment, `**` = any depth.
import { dirname, isAbsolute, resolve, sep } from 'node:path';

function globToRegExp(glob) {
  let source = '';
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    if (char === '*' && glob[index + 1] === '*') {
      source += '.*';
      index += 1;
    } else if (char === '*') {
      source += '[^/]*';
    } else {
      source += char.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${source}$`);
}

const compiled = new Map();
function matches(specifier, glob) {
  let regExp = compiled.get(glob);
  if (!regExp) {
    regExp = globToRegExp(glob);
    compiled.set(glob, regExp);
  }
  return regExp.test(specifier);
}

function kindOf(specifier) {
  if (specifier.startsWith('.') || isAbsolute(specifier)) return 'relative';
  if (specifier.startsWith('@/')) return 'internal';
  if (specifier.startsWith('@xr/')) return 'workspace';
  return 'third-party';
}

function nameOf(node) {
  return node.type === 'Identifier' ? node.name : String(node.value);
}

export const importFenceRule = {
  meta: {
    type: 'problem',
    docs: { description: 'Enforce the folder-level import fences of Appendix F §3.8.' },
    schema: [
      {
        type: 'object',
        properties: {
          fence: { type: 'string' },
          allow: { type: 'array', items: { type: 'string' } },
          scope: { enum: ['project', 'all'] },
          deny: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                pattern: { type: 'string' },
                except: { type: 'array', items: { type: 'string' } },
                reason: { type: 'string' },
              },
              required: ['pattern', 'reason'],
              additionalProperties: false,
            },
          },
          typeOnly: { type: 'array', items: { type: 'string' } },
          vocabulary: {
            type: 'object',
            additionalProperties: { type: 'array', items: { type: 'string' } },
          },
          root: { type: 'string' },
        },
        required: ['fence'],
        additionalProperties: false,
      },
    ],
    messages: {
      denied: '"{{specifier}}" is fenced out of {{fence}}: {{reason}}',
      notAllowed:
        '"{{specifier}}" is outside the {{fence}} import fence (Appendix F §3.8). Allowed: {{allowed}}.',
      typeOnly:
        '"{{specifier}}" may be imported for types only in {{fence}} (use `import type`; Appendix F §3.8).',
      vocabulary:
        '"{{name}}" from "{{specifier}}" is not vocabulary; {{fence}} may take only these values from it: {{names}} (types are always allowed; decision, policy and derive functions are not — Appendix F §3.8).',
      vocabularyWhole:
        '{{fence}} must name the vocabulary it takes from "{{specifier}}" (no default, namespace, side-effect or dynamic import; Appendix F §3.8).',
      escapes:
        'Relative import "{{specifier}}" leaves the {{fence}} folder; import it through an allowed path (Appendix F §3.8).',
    },
  },
  create(context) {
    const options = context.options[0] ?? {};
    const fence = options.fence;
    const allow = options.allow;
    const scope = options.scope ?? 'project';
    const deny = options.deny ?? [];
    const typeOnly = options.typeOnly ?? [];
    const vocabulary = options.vocabulary ?? {};
    const root = options.root ? resolve(options.root) : null;
    const filename = context.filename;

    function check(node, specifier, typeOnlyImport, valueNames) {
      for (const entry of deny) {
        if (
          matches(specifier, entry.pattern) &&
          !(entry.except ?? []).some((glob) => matches(specifier, glob))
        ) {
          context.report({
            node,
            messageId: 'denied',
            data: { specifier, fence, reason: entry.reason },
          });
          return;
        }
      }
      const kind = kindOf(specifier);
      if (kind === 'relative') {
        if (root && isAbsolute(filename)) {
          const target = resolve(dirname(filename), specifier);
          if (target !== root && !target.startsWith(root + sep)) {
            context.report({ node, messageId: 'escapes', data: { specifier, fence } });
          }
        }
        return;
      }
      if (typeOnly.some((glob) => matches(specifier, glob))) {
        if (!typeOnlyImport)
          context.report({ node, messageId: 'typeOnly', data: { specifier, fence } });
        return;
      }
      const names = vocabulary[specifier];
      if (names) {
        if (typeOnlyImport) return;
        if (valueNames === null) {
          context.report({ node, messageId: 'vocabularyWhole', data: { specifier, fence } });
          return;
        }
        for (const name of valueNames) {
          if (!names.includes(name)) {
            context.report({
              node,
              messageId: 'vocabulary',
              data: { name, specifier, fence, names: names.join(', ') },
            });
          }
        }
        return;
      }
      if (!allow) return;
      if (scope === 'project' && kind === 'third-party') return;
      if (!allow.some((glob) => matches(specifier, glob))) {
        context.report({
          node,
          messageId: 'notAllowed',
          data: { specifier, fence, allowed: allow.join(', ') },
        });
      }
    }

    return {
      ImportDeclaration(node) {
        const specifier = node.source.value;
        if (node.importKind === 'type') return check(node, specifier, true, []);
        if (node.specifiers.length === 0) return check(node, specifier, false, null);
        if (node.specifiers.some((item) => item.type !== 'ImportSpecifier')) {
          return check(node, specifier, false, null);
        }
        const values = node.specifiers
          .filter((item) => item.importKind !== 'type')
          .map((item) => nameOf(item.imported));
        return check(node, specifier, values.length === 0, values);
      },
      ExportNamedDeclaration(node) {
        if (!node.source) return;
        const specifier = node.source.value;
        if (node.exportKind === 'type') return check(node, specifier, true, []);
        const values = node.specifiers
          .filter((item) => item.exportKind !== 'type')
          .map((item) => nameOf(item.local));
        return check(node, specifier, values.length === 0, values);
      },
      ExportAllDeclaration(node) {
        check(node, node.source.value, node.exportKind === 'type', null);
      },
      ImportExpression(node) {
        if (node.source.type === 'Literal' && typeof node.source.value === 'string') {
          check(node, node.source.value, false, null);
        }
      },
      TSImportType(node) {
        const argument = node.source ?? node.argument;
        const literal = argument?.type === 'TSLiteralType' ? argument.literal : argument;
        if (literal?.type === 'Literal' && typeof literal.value === 'string') {
          check(node, literal.value, true, []);
        }
      },
    };
  },
};

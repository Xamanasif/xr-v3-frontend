// ESLint rule `xr/no-process-env` — configuration is read once, in one module
// (Appendix F §3.8: "nothing else reads process.env"; ADR-0007 §2 / TE-7: the build flags are
// read once through @xr/config/env). The file allowed to read it is exempted in the config.

function isProcess(node) {
  if (node.type === 'Identifier') return node.name === 'process';
  return (
    node.type === 'MemberExpression' &&
    node.object.type === 'Identifier' &&
    node.object.name === 'globalThis' &&
    propertyName(node) === 'process'
  );
}

function propertyName(member) {
  if (!member.computed && member.property.type === 'Identifier') return member.property.name;
  if (member.computed && member.property.type === 'Literal') return String(member.property.value);
  return null;
}

export const noProcessEnvRule = {
  meta: {
    type: 'problem',
    docs: { description: 'Forbid reading process.env outside the one configuration module.' },
    schema: [],
    messages: {
      processEnv:
        "Do not read process.env here: configuration is read once through the app's env module (@xr/config/env; Appendix F §3.8, ADR-0007 TE-7).",
    },
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (isProcess(node.object) && propertyName(node) === 'env') {
          context.report({ node, messageId: 'processEnv' });
        }
      },
      VariableDeclarator(node) {
        if (
          node.id.type === 'ObjectPattern' &&
          node.init &&
          isProcess(node.init) &&
          node.id.properties.some(
            (property) =>
              property.type === 'Property' &&
              ((property.key.type === 'Identifier' && property.key.name === 'env') ||
                (property.key.type === 'Literal' && property.key.value === 'env')),
          )
        ) {
          context.report({ node, messageId: 'processEnv' });
        }
      },
      ImportDeclaration(node) {
        if (node.source.value !== 'process' && node.source.value !== 'node:process') return;
        if (
          node.specifiers.some(
            (item) =>
              item.type === 'ImportSpecifier' &&
              (item.imported.name ?? item.imported.value) === 'env',
          )
        ) {
          context.report({ node, messageId: 'processEnv' });
        }
      },
    };
  },
};

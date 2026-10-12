// ESLint rule `xr/deterministic` — rules and the sample world must be reproducible
// (Appendix F §3.8: "Math.random and Date.now are banned in @xr/sample-platform/src and
// @xr/domain/src"). Time comes from the clock port (TE-5, ADR-0007 §1); ids and nonces from an
// injected id source (Appendix F §3.7).

const BANNED = {
  Math: { random: 'randomness comes from an injected, seeded source (Appendix F §3.7 ids/)' },
  Date: { now: 'time comes from the clock port, ClockPort.now() (TE-5, ADR-0007 §1)' },
};

function objectName(node) {
  if (node.type === 'Identifier') return node.name;
  if (
    node.type === 'MemberExpression' &&
    node.object.type === 'Identifier' &&
    node.object.name === 'globalThis' &&
    !node.computed &&
    node.property.type === 'Identifier'
  ) {
    return node.property.name;
  }
  return null;
}

function propertyName(member) {
  if (!member.computed && member.property.type === 'Identifier') return member.property.name;
  if (member.computed && member.property.type === 'Literal') return String(member.property.value);
  return null;
}

export const deterministicRule = {
  meta: {
    type: 'problem',
    docs: { description: 'Forbid Math.random and Date.now in deterministic packages.' },
    schema: [],
    messages: {
      banned: '{{object}}.{{property}} is not deterministic: {{reason}}.',
    },
  },
  create(context) {
    function report(node, object, property) {
      const reason = BANNED[object]?.[property];
      if (reason) context.report({ node, messageId: 'banned', data: { object, property, reason } });
    }
    return {
      MemberExpression(node) {
        const object = objectName(node.object);
        const property = propertyName(node);
        if (object && property && Object.hasOwn(BANNED, object)) report(node, object, property);
      },
      VariableDeclarator(node) {
        if (node.id.type !== 'ObjectPattern' || !node.init) return;
        const object = objectName(node.init);
        if (!object || !Object.hasOwn(BANNED, object)) return;
        for (const property of node.id.properties) {
          if (property.type === 'Property' && property.key.type === 'Identifier') {
            report(property, object, property.key.name);
          }
        }
      },
    };
  },
};

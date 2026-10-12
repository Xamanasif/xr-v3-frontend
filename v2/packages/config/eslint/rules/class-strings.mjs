// Shared helpers for rules that read class names out of JSX `className` values.

/**
 * Every static string piece inside a `className` / `class` attribute value, with whether
 * the piece touches a dynamic part on its left or right (so a token there is a fragment):
 *   className="a b"                       → "a b"
 *   className={cond ? 'a' : 'b'}          → "a", "b"
 *   className={`a ${x}-y`}                → "a " (right open), "-y" (left open)
 *   className={`a--${ok ? 'ok' : 'no'}`}  → "a--" (right open), "ok", "no" (left open)
 *   className={'xa-' + (k ? 'p' : 'q')}   → "xa-" (right open), "p", "q" (left open)
 *   className={['a', x && 'b'].join(' ')} / cx('a', …) → "a", "b"
 */
export function classStringPieces(attribute) {
  const pieces = [];
  const value = attribute.value;
  if (!value) return pieces;
  if (value.type === 'Literal') {
    if (typeof value.value === 'string') {
      pieces.push({ node: value, text: value.value, openLeft: false, openRight: false });
    }
    return pieces;
  }
  if (value.type === 'JSXExpressionContainer') collect(value.expression, pieces, CLOSED);
  return pieces;
}

/** `edges` says whether the text around an expression is glued to its start / end. */
const CLOSED = { left: false, right: false };

function textOf(quasi) {
  return quasi.value.cooked ?? quasi.value.raw;
}

function collect(node, pieces, edges) {
  if (!node) return;
  switch (node.type) {
    case 'Literal':
      if (typeof node.value === 'string') {
        pieces.push({ node, text: node.value, openLeft: edges.left, openRight: edges.right });
      }
      return;
    case 'TemplateLiteral': {
      const last = node.quasis.length - 1;
      node.quasis.forEach((quasi, index) => {
        pieces.push({
          node: quasi,
          text: textOf(quasi),
          openLeft: index > 0 || edges.left,
          openRight: index < last || edges.right,
        });
      });
      node.expressions.forEach((expression, index) => {
        const before = textOf(node.quasis[index]);
        const after = textOf(node.quasis[index + 1]);
        collect(expression, pieces, {
          left: before === '' ? index > 0 || edges.left : !/\s$/.test(before),
          right: after === '' ? index + 1 < last || edges.right : !/^\s/.test(after),
        });
      });
      return;
    }
    case 'ConditionalExpression':
      collect(node.consequent, pieces, edges);
      collect(node.alternate, pieces, edges);
      return;
    case 'LogicalExpression':
      collect(node.left, pieces, edges);
      collect(node.right, pieces, edges);
      return;
    case 'BinaryExpression':
      // Concatenation glues the end of the left side to the start of the right side.
      if (node.operator === '+') {
        collect(node.left, pieces, { left: edges.left, right: true });
        collect(node.right, pieces, { left: true, right: edges.right });
      }
      return;
    case 'ArrayExpression':
      node.elements.forEach((element) => collect(element, pieces, CLOSED));
      return;
    case 'CallExpression':
      // join(' ') on an array, or a class-joining helper such as cx(…)
      if (node.callee.type === 'MemberExpression') collect(node.callee.object, pieces, CLOSED);
      node.arguments.forEach((argument) => collect(argument, pieces, CLOSED));
      return;
    case 'TSAsExpression':
    case 'TSNonNullExpression':
    case 'TSSatisfiesExpression':
      collect(node.expression, pieces, edges);
      return;
    default:
      return;
  }
}

/** Splits a piece into class tokens; edge tokens of an open side are fragments. */
export function tokensOf(piece) {
  const raw = piece.text.split(/\s+/);
  const tokens = [];
  raw.forEach((token, index) => {
    if (!token) return;
    const atStart = index === 0 && !/^\s/.test(piece.text);
    const atEnd = index === raw.length - 1 && !/\s$/.test(piece.text);
    tokens.push({
      token,
      leftFragment: piece.openLeft && atStart,
      rightFragment: piece.openRight && atEnd,
    });
  });
  return tokens;
}

/** Is a JSX attribute a class attribute? */
export function isClassAttribute(node) {
  return (
    node.name?.type === 'JSXIdentifier' &&
    (node.name.name === 'className' || node.name.name === 'class')
  );
}

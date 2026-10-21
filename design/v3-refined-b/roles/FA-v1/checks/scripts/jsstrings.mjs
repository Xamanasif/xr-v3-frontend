// Extract every string literal from the DC logic script(s) of a .dc.html file, with a real JS parser (TypeScript).
// Usage: node jsstrings.mjs <file.dc.html>  → JSON [{s, lhs}] where lhs = the literal is the left operand of a `+`
// (so its last token may be a class-name prefix completed at runtime, e.g. 'fa-prio--' + n).
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const ts = require('/opt/npm-tools/node_modules/typescript');
const src = fs.readFileSync(process.argv[2], 'utf8');
const out = [];
const re = /<script type="text\/x-dc"[^>]*>([\s\S]*?)<\/script>/g;
let m;
while ((m = re.exec(src))) {
  const sf = ts.createSourceFile('x.js', m[1], ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const visit = (n) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      const p = n.parent;
      const lhs = !!(p && ts.isBinaryExpression(p) && p.operatorToken.kind === ts.SyntaxKind.PlusToken && p.left === n);
      const rhs = !!(p && ts.isBinaryExpression(p) && p.operatorToken.kind === ts.SyntaxKind.PlusToken && p.right === n);
      out.push({ s: n.text, lhs, rhs });
    } else if (ts.isTemplateExpression(n)) {
      out.push({ s: n.head.text, lhs: true, rhs: false });
      n.templateSpans.forEach((sp, i) => out.push({ s: sp.literal.text, lhs: i < n.templateSpans.length - 1, rhs: true }));
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
process.stdout.write(JSON.stringify(out));

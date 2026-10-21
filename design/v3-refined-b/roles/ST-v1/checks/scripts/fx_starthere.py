# START-HERE.md from its template: the subview count from the coverage register, the status line from status.json.
import json, pathlib
D = pathlib.Path('/home/claude/work/delivery-final')
reg = json.loads((D / 'COVERAGE-REGISTER.json').read_text()); st = json.loads((D / 'status.json').read_text())
n = sum(len(e['subviews']) for e in reg['owned'])
t = (D / 'START-HERE.tmpl.md').read_text().replace('{{SUBVIEWS}}', str(n)).replace('{{STATUS}}', '**' + st['statusLine'] + '**. ' + st['ownerApprovalNote'])
assert '{{' not in t
(D / 'START-HERE.md').write_text(t); print('START-HERE.md', n, 'subviews ·', st['statusLine'])

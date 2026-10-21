# Build project/StudentFinal.dc.html — the ONE final Student role preview — from project/Main.dc.html (locked, hash-checked)
# and final-src/ (templates + presentation view models). Data, seeding, routing, guards and mutations stay Main's code verbatim.
# The final root loads the three foundation files and ONE role stylesheet, v3-student-final.css.
import pathlib, hashlib, sys, json
sys.path.insert(0, '/home/claude/scripts')
from r2_regions import T, L, VM_FILES, span
P = pathlib.Path('/home/claude/work/project'); S = pathlib.Path('/home/claude/work/final-src')
main = (P / 'Main.dc.html').read_text()
assert hashlib.sha256(main.encode()).hexdigest() == '5eec79404040eb157df8a5a0cdd8515968438fac4c5c3357fc86112d80455a13', 'Main.dc.html changed!'
cuts = []
for name, a, b in T: i, j = span(main, a, b); cuts.append((i, j, (S / (name + '.html')).read_text()))
i, j = span(main, *L[0][1:]); cuts.append((i, j, (S / 'msg.js').read_text()))
i, j = span(main, *L[1][1:]); cuts.append((i, j, ''.join((S / f).read_text() for f in VM_FILES)))
cuts.sort()
for k in range(1, len(cuts)): assert cuts[k][0] >= cuts[k - 1][1], 'overlapping regions'
out, pos = [], 0
for i, j, new in cuts: out.append(main[pos:i]); out.append(new); pos = j
out.append(main[pos:]); out = ''.join(out)
def rep(text, old, new):
    assert text.count(old) == 1, ('not unique', old[:90]); return text.replace(old, new)
out = rep(out, '<title>Student — XR Learning Platform</title>', '<title>Student — complete role · XR Learning Platform</title>')
out = rep(out, '<link rel="stylesheet" href="./v3-student.css">\n', '<link rel="stylesheet" href="./v3-student-final.css">\n')
for old, new in json.loads((S / 'render-edits.json').read_text()):
    out = rep(out, old, new)
(P / 'StudentFinal.dc.html').write_text(out)
print('StudentFinal.dc.html', len(out.encode()), 'bytes', hashlib.sha256(out.encode()).hexdigest()[:12])

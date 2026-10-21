#!/bin/bash
# After the verification lanes: rebuild with the last stylesheet fix, re-render every ST-16 / ST-17 case on the final build at
# 1440, 1024, 768, 375 and 320, compare with the lane renders, re-run axe on them and the long-text stress test.
set -e
R=/tmp/claude-0/fx/run; cd /home/claude/scripts/final
python3 -I fx_build.py > $R/fix-build.txt; python3 -I fx_consolidate.py >> $R/fix-build.txt
python3 -I -c "
import hashlib, json, pathlib
P = pathlib.Path('/home/claude/work/project')
json.dump({'root': hashlib.sha256((P / 'StudentFinal.dc.html').read_bytes()).hexdigest(), 'css': hashlib.sha256((P / 'v3-student-final.css').read_bytes()).hexdigest()}, open('/tmp/claude-0/fx/final-build.json', 'w'))"
python3 -I -c "
import json
c = json.load(open('/home/claude/work/fxcases.json'))
json.dump([x for x in c if x['screen'] in ('ST-16v', 'ST-16w')], open('/tmp/claude-0/fx/fix-cases.json', 'w'))"
BED=/home/claude/work/fxfixbed WIDTHS=1440,1024,768,375,320 timeout 900 node fx_shoot.mjs /tmp/claude-0/fx/fix-cases.json $R/fix > $R/fix.log 2>&1
python3 -I - <<'PY'
import json, pathlib
from PIL import Image, ImageChops
R = pathlib.Path('/tmp/claude-0/fx/run'); fix = R / 'fix'
cmp, ident, clean320 = 0, 0, []
rep = json.loads((fix / 'report.json').read_text())
for r in rep:
    w = r['w']; f = fix / r['file']
    prev = {1440: R / 'wB', 375: R / 'wB', 1024: R / 'wA', 768: R / 'wA', 320: R / 'w320'}[w] / r['file']
    if w == 320: clean320.append(not r['problems']); continue
    if prev.exists():
        cmp += 1; a, b = Image.open(prev).convert('RGB'), Image.open(f).convert('RGB')
        ident += int(a.size == b.size and ImageChops.difference(a, b).getbbox() is None)
json.dump({'compared': cmp, 'identical': ident, 'clean320': f'{sum(clean320)} of {len(clean320)} clean', 'problems': [r for r in rep if r['problems']]}, open(fix / 'fix.json', 'w'), indent=1)
print('fix: identical', ident, 'of', cmp, '· 320', sum(clean320), 'of', len(clean320), 'clean')
PY
WIDTHS=1440,1024,768,375,320 timeout 900 node fx_axe.mjs /tmp/claude-0/fx/fix-cases.json $R/fix/axe-fix.json > $R/fix/axe-fix.log 2>&1
timeout 1800 node fx_stress.mjs $R/stress-final > $R/stress-final.log 2>&1
echo done > $R/fix.done

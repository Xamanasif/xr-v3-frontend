#!/bin/bash
# Second targeted fix after the verification lanes (found by the 320 scroll-container check and the full-width button check):
#  1. ST-12 not passed, phones: the action row shrank to its two short buttons, so "Try again" / "See result" stopped short of the
#     card edge (238 of 305 px). The row now stretches (.sv-ai-act{align-self:stretch} below a 600 px page).
#  2. ST-11 tabs at 320: "Results 0" was cut off inside the scrolling tab strip (42 px too wide). Below a 330 px page the tabs are
#     tighter (6 px sides, no gap, smaller count badge), so all three fit.
# Re-render every affected case at 1440, 1024, 768, 375 and 320 on the final build, compare with the lane renders, re-run axe on them,
# the scroll-container and full-width-button checks on every case, the long-text stress test and the 320 boards.
set -e
R=/tmp/claude-0/fx/run; cd /home/claude/scripts/final
python3 -I fx_build.py > $R/fix2-build.txt; python3 -I fx_consolidate.py >> $R/fix2-build.txt
python3 -I -c "
import hashlib, json, pathlib
P = pathlib.Path('/home/claude/work/project')
json.dump({'root': hashlib.sha256((P / 'StudentFinal.dc.html').read_bytes()).hexdigest(), 'css': hashlib.sha256((P / 'v3-student-final.css').read_bytes()).hexdigest()}, open('/tmp/claude-0/fx/final-build.json', 'w'))"
python3 -I -c "
import json
c = json.load(open('/home/claude/work/fxcases.json'))
json.dump([x for x in c if x['screen'] in ('ST-02', 'ST-04', 'ST-11', 'ST-11sub', 'ST-11res', 'ST-12')], open('/tmp/claude-0/fx/fix2-cases.json', 'w'))
c3 = json.load(open('/home/claude/work/fxcases-320.json'))
json.dump(c3, open('/tmp/claude-0/fx/fix2-320.json', 'w'))"
mkdir -p $R/fix2 $R/fix2-320
BED=/home/claude/work/fxfix2bed WIDTHS=1440,1024,768,375 timeout 1500 node fx_shoot.mjs /tmp/claude-0/fx/fix2-cases.json $R/fix2 > $R/fix2.log 2>&1
BED=/home/claude/work/fxfix2bed320 WIDTHS=320 timeout 900 node fx_shoot.mjs /tmp/claude-0/fx/fix2-320.json $R/fix2-320 > $R/fix2-320.log 2>&1
python3 -I - <<'PY'
import json, pathlib
from PIL import Image, ImageChops
R = pathlib.Path('/tmp/claude-0/fx/run')
def same(a, b):
    a, b = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
    return a.size == b.size and ImageChops.difference(a, b).getbbox() is None
out = {'compared': 0, 'identical': 0, 'changed': [], 'problems': []}
for folder, lanes in (('fix2', {1440: 'wB', 375: 'wB', 1024: 'wA', 768: 'wA'}), ('fix2-320', {320: 'w320'})):
    rep = json.loads((R / folder / 'report.json').read_text())
    out['problems'] += [r for r in rep if r['problems']]
    for r in rep:
        prev = R / lanes[r['w']] / r['file']
        if not prev.exists(): continue
        out['compared'] += 1
        if same(prev, R / folder / r['file']): out['identical'] += 1
        else: out['changed'].append(r['file'])
json.dump(out, open(R / 'fix2' / 'fix2.json', 'w'), indent=1)
print('fix2: compared', out['compared'], 'identical', out['identical'], 'changed', out['changed'], 'problems', len(out['problems']))
PY
WIDTHS=1440,1024,768,375,320 timeout 1200 node fx_axe.mjs /tmp/claude-0/fx/fix2-cases.json $R/fix2/axe-fix2.json > $R/fix2/axe-fix2.log 2>&1
WIDTHS=320 BED=/home/claude/work/fxscrollbed4 timeout 900 node fx_scroll.mjs /home/claude/work/fxcases-320.json $R/scroll/scroll-320-final.json > $R/scroll/s320-final.log 2>&1
WIDTHS=375,320 BED=/home/claude/work/fxbtnbed2 timeout 1500 node fx_btnw.mjs /home/claude/work/fxcases.json $R/btnw/btnw-final.json > $R/btnw/bfinal.log 2>&1
timeout 1800 node fx_stress.mjs $R/stress-final2 > $R/stress-final2.log 2>&1
timeout 900 node fx_measure.mjs $R/boards-320 '\-320\.dc\.html$' > $R/boards-320.log 2>&1
echo done > $R/fix2.done

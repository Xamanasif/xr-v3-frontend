#!/bin/bash
# FINAL approved build · verification lane B (review only).
R=/tmp/claude-0/fx/run; cd /home/claude/scripts/final
python3 -I fx_source.py > $R/source.json 2> $R/source.err
timeout 600 node fx_logic.mjs > $R/logic.log 2>&1; cp /tmp/claude-0/fx/logic.json $R/logic.json
for w in 1440 1024 768 375; do W=$w timeout 900 node fx_journey.mjs > $R/journey-$w.log 2>&1; cp /tmp/claude-0/fx/fxjourney-$w.json $R/ 2>/dev/null; done
WIDTHS=1440,1024,768,375 timeout 4000 node fx_linkmap.mjs /home/claude/work/fxcases.json $R/linkmap.json > $R/linkmap.log 2>&1
WIDTHS=1440,1024,768,375 timeout 5400 node fx_axe.mjs /home/claude/work/fxcases.json $R/axe.json > $R/axe.log 2>&1
BED=/home/claude/work/fxfocusbed WIDTHS=1440,768,375 timeout 3000 node fx_focus.mjs /tmp/claude-0/fx/focus-cases.json $R/focus.json > $R/focus.log 2>&1
timeout 600 node fx_trap.mjs $R/trap.json > $R/trap.log 2>&1
timeout 900 node fx_subcmp.mjs $R/subcmp > $R/subcmp.log 2>&1
python3 -I fx_subcmp_interior.py $R/subcmp >> $R/subcmp.log 2>&1
timeout 900 node fx_states.mjs $R/states > $R/states.log 2>&1
timeout 1500 node fx_hover.mjs /tmp/claude-0/fx/hover-cases.json $R/hover.json > $R/hover.log 2>&1
WIDTHS=320 BED=/home/claude/work/fxscrollbedF timeout 900 node fx_scroll.mjs /home/claude/work/fxcases-320.json $R/scroll/scroll-320.json > $R/scroll/s320.log 2>&1
WIDTHS=375,768,1024,1440 BED=/home/claude/work/fxscrollbedG timeout 2400 node fx_scroll.mjs /home/claude/work/fxcases.json $R/scroll/scroll-4w.json > $R/scroll/s4w.log 2>&1
WIDTHS=375,320 BED=/home/claude/work/fxbtnbedF timeout 1800 node fx_btnw.mjs /home/claude/work/fxcases.json $R/btnw/btnw.json > $R/btnw/b.log 2>&1
timeout 1800 node fx_stress.mjs $R/stress > $R/stress.log 2>&1
echo done > $R/laneB.done

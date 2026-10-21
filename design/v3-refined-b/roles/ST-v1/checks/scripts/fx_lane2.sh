#!/bin/bash
# Final verification · lane 2 (review only). Outputs under /tmp/claude-0/fx/run.
R=/tmp/claude-0/fx/run; cd /home/claude/scripts/final
python3 -I fx_source.py > $R/source.json 2> $R/source.err
timeout 600 node fx_logic.mjs > $R/logic.log 2>&1; cp /tmp/claude-0/fx/logic.json $R/logic.json
BED=/home/claude/work/fxbedB WIDTHS=1440,375 timeout 3000 node fx_shoot.mjs /home/claude/work/fxcases.json $R/wB > $R/wB.log 2>&1
BED=/home/claude/work/fxbed320 WIDTHS=320 timeout 1500 node fx_shoot.mjs /home/claude/work/fxcases-320.json $R/w320 > $R/w320.log 2>&1
WIDTHS=1440,1024,768,375 timeout 4000 node fx_linkmap.mjs /home/claude/work/fxcases.json $R/linkmap.json > $R/linkmap.log 2>&1
WIDTHS=1440,1024,768,375 timeout 5400 node fx_axe.mjs /home/claude/work/fxcases.json $R/axe.json > $R/axe.log 2>&1
timeout 1800 node fx_stress.mjs $R/stress > $R/stress.log 2>&1
timeout 1800 node fx_measure.mjs $R/boards > $R/boards.log 2>&1
echo done > $R/lane2.done

#!/bin/bash
# FINAL approved build · verification lane A (review only). Everything renders the approved files.
R=/tmp/claude-0/fx/run; cd /home/claude/scripts/final
BED=/home/claude/work/fxbedB WIDTHS=1440,375 timeout 3000 node fx_shoot.mjs /home/claude/work/fxcases.json $R/wB > $R/wB.log 2>&1
BED=/home/claude/work/fxbedA WIDTHS=1024,768 timeout 3000 node fx_shoot.mjs /home/claude/work/fxcases.json $R/wA > $R/wA.log 2>&1
BED=/home/claude/work/fxbed320 WIDTHS=320 timeout 1500 node fx_shoot.mjs /home/claude/work/fxcases-320.json $R/w320 > $R/w320.log 2>&1
timeout 1800 node fx_measure.mjs $R/boards > $R/boards.log 2>&1
WIDTHS=1440,1024,768,375 timeout 5400 node fx_links.mjs /home/claude/work/fxcases.json $R/links.json > $R/links.log 2>&1
timeout 1200 node fx_idparity.mjs /home/claude/work/fxcases.json $R/idparity.json > $R/idparity.log 2>&1
BED=/home/claude/work/fxidbed WIDTHS=1440,375 timeout 1200 node fx_ids.mjs /home/claude/work/fxcases.json $R/ids.json > $R/ids.log 2>&1
echo done > $R/laneA.done

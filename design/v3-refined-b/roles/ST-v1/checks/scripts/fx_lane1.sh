#!/bin/bash
# Final verification · lane 1 (review only). Outputs under /tmp/claude-0/fx/run.
R=/tmp/claude-0/fx/run; cd /home/claude/scripts/final
BED=/home/claude/work/fxbedA WIDTHS=1024,768 timeout 3000 node fx_shoot.mjs /home/claude/work/fxcases.json $R/wA > $R/wA.log 2>&1
for w in 1440 1024 768 375; do W=$w timeout 900 node fx_journey.mjs > $R/journey-$w.log 2>&1; cp /tmp/claude-0/fx/fxjourney-$w.json $R/ 2>/dev/null; done
WIDTHS=1440,1024,768,375 timeout 5400 node fx_links.mjs /home/claude/work/fxcases.json $R/links.json > $R/links.log 2>&1
timeout 1200 node fx_idparity.mjs /home/claude/work/fxcases.json $R/idparity.json > $R/idparity.log 2>&1
BED=/home/claude/work/fxfocusbed WIDTHS=1440,768,375 timeout 3000 node fx_focus.mjs /tmp/claude-0/fx/focus-cases.json $R/focus.json > $R/focus.log 2>&1
timeout 900 node fx_states.mjs $R/states > $R/states.log 2>&1
timeout 1500 node fx_hover.mjs /tmp/claude-0/fx/hover-cases.json $R/hover.json > $R/hover.log 2>&1
echo done > $R/lane1.done

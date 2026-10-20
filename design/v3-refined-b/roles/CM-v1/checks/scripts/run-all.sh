#!/bin/bash
# Full re-verification of the final role build, into tools/final3/
T=/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad/tools
cd $T
rm -rf final3; mkdir -p final3/sweep
bash build.sh
node verify-wrappers.mjs '' final3/boards > final3/boards.log 2>&1; cp verify-all.json final3/boards.json
node journeys.mjs > final3/journeys.log 2>&1; cp journeys.json final3/journeys.json
node links.mjs > final3/links.log 2>&1; cp links.json final3/links.json
for w in 1440 1024 768 375; do node batch.mjs final3/sweep/w$w $w cases-final.json > final3/sweep-w$w.log 2>&1; done
node batch.mjs final3/sweep/overlays 1440 cases-dlg.json > final3/sweep-overlays.log 2>&1
node batch.mjs final3/sweep/overlays375 375 cases-dlg.json > final3/sweep-overlays375.log 2>&1
node fontcensus.mjs final3/fonts.json > final3/fonts.log 2>&1
node unresolved.mjs final3/unresolved.json > final3/unresolved.log 2>&1
node focusshots.mjs final3/focus > final3/focus.log 2>&1
node selector-usage.mjs > final3/selectors.log 2>&1; cp selector-usage.json final3/selectors.json
node board-shots.mjs final3/boardshots CM R- P C L K X > final3/boardshots.log 2>&1
touch final3/DONE

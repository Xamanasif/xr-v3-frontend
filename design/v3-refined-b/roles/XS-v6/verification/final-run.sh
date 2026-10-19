#!/bin/bash
# Final regression after the last source edit: every spec re-run against the current project files.
cd "$(dirname "$0")"
bash sync.sh
mkdir -p logs-final shots-final
for s in t-verify t-final t-gal t3 t4 t7 t-keys t-keys2 t-final2 t-long t-links; do
  echo "=== $s $(date +%H:%M:%S)" >> logs-final/progress.log
  timeout 600 node run.mjs $s.json shots-final > logs-final/$s.log 2>&1
  echo "exit $? $(date +%H:%M:%S)" >> logs-final/progress.log
done
timeout 600 node sweep.mjs > logs-final/sweep.log 2>&1
echo "sweep exit $? $(date +%H:%M:%S)" >> logs-final/progress.log
echo DONE >> logs-final/progress.log

#!/bin/bash
# Re-run after removing four unused rules from xs-shared.css (and the no-op step in t3).
cd "$(dirname "$0")"
bash sync.sh
for s in t-verify t-final t-gal t3; do
  echo "=== $s $(date +%H:%M:%S)" >> logs-final/progress2.log
  timeout 600 node run.mjs $s.json shots-final > logs-final/$s.log 2>&1
  echo "exit $? $(date +%H:%M:%S)" >> logs-final/progress2.log
done
echo DONE >> logs-final/progress2.log

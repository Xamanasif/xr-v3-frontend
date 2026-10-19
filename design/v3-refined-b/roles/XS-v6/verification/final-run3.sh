#!/bin/bash
# Keyboard specs with corrected step sequences, and the extended link map checks.
cd "$(dirname "$0")"
bash sync.sh
for s in t-keys t-keys2 t-links; do
  echo "=== $s $(date +%H:%M:%S)" >> logs-final/progress3.log
  timeout 600 node run.mjs $s.json shots-final > logs-final/$s.log 2>&1
  echo "exit $? $(date +%H:%M:%S)" >> logs-final/progress3.log
done
echo DONE >> logs-final/progress3.log

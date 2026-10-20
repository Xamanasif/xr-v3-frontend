#!/bin/bash
# Splice the logic part into a scratch render copy of Main.dc.html (scratch only; the canvas file gets the logic by Edit).
S=/tmp/claude-0/-home-claude/d3633e97-789d-5fa2-8411-8c9e5a8f96d1/scratchpad
R=$S/render-cm
mkdir -p $R
cp $S/cm-role/project/*.css $R/
if grep -q '/\*@@LOGIC@@\*/' $S/cm-role/project/Main.dc.html; then
python3 -I -c "
import sys
tpl=open(sys.argv[1],encoding='utf-8').read(); logic=open(sys.argv[2],encoding='utf-8').read()
open(sys.argv[3],'w',encoding='utf-8').write(tpl.replace('/*@@LOGIC@@*/', logic))
" $S/cm-role/project/Main.dc.html $S/cm-role/logic.part.js $R/Main.dc.html
else
cp $S/cm-role/project/Main.dc.html $R/Main.dc.html
fi
# copy board wrappers if any
ls $S/cm-role/project/*.dc.html 2>/dev/null | grep -v '/Main.dc.html$' | xargs -r -I{} cp {} $R/

# Copy the files that change on the canvas into one publish folder and print the Artifact `files` map.
import json, pathlib, shutil
W = pathlib.Path('/home/claude/work'); P = W / 'project'
ROOT = pathlib.Path('/tmp/claude-0/-home-claude/973eb6aa-b778-511c-91df-c37b3e0c6ae8/scratchpad/publish-final')
shutil.rmtree(ROOT, ignore_errors=True); (ROOT / 'project').mkdir(parents=True)
rows = json.loads((W / 'fx_boards.json').read_text())
files = ['StudentFinal.dc.html', 'v3-student-final.css'] + [b['file'] for r in rows for b in r['boards']] + ['canvas.json']
for f in files: shutil.copy(P / f, ROOT / 'project' / f)
m = {f'project/{f}': f'project/{f}' for f in files if f != 'canvas.json'}
(ROOT.parent / 'publish-final-files.json').write_text(json.dumps(m, indent=0))
print(len(files), 'files copied ·', sum((ROOT / 'project' / f).stat().st_size for f in files), 'bytes · root', ROOT)

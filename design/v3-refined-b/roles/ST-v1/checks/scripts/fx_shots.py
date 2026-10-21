# Screenshot archive for the final Student design, with an index that separates images inspected by eye from script-checked ones.
# usage: python3 -I fx_shots.py <zip path> <status words for the title>
import pathlib, shutil, zipfile, json, sys
R = pathlib.Path('/tmp/claude-0/fx/run'); EX = pathlib.Path('/tmp/claude-0/fx')
OUT = pathlib.Path('/tmp/claude-0/fx/shots'); shutil.rmtree(OUT, ignore_errors=True); OUT.mkdir(parents=True)
zpath, status = pathlib.Path(sys.argv[1]), sys.argv[2]
def cp(src, dst, pat='*.png'):
    dst.mkdir(parents=True, exist_ok=True); n = 0
    for p in sorted(pathlib.Path(src).glob(pat)): shutil.copy(p, dst / p.name); n += 1
    return n
for w in ['1440', '375']: cp(R / 'wB', OUT / f'cases-{w}', f'*-{w}.png')
for w in ['1024', '768']: cp(R / 'wA', OUT / f'cases-{w}', f'*-{w}.png')
cp(R / 'w320', OUT / 'cases-320', '*-320.png')
for fx in ('fix', 'fix2', 'fix2-320'):                             # cases re-rendered on the final build after the last fixes (in order)
    if (R / fx).exists():
        for p in sorted((R / fx).glob('*.png')): shutil.copy(p, OUT / f"cases-{p.stem.rsplit('-', 1)[1]}" / p.name)
cp(R / next(d for d in ('stress', 'stress-final2', 'stress-final') if (R / d).exists()), OUT / 'stress-long-text')
cp(R / 'states', OUT / 'interaction-states')
if (EX / 'pairs').exists(): cp(EX / 'pairs', OUT / 'before-after', 'pair-*.png')
for p in ['Final-overview-desktop-1440.png', 'Final-overview-phone-375.png', 'Final-interaction-states.png', 'Final-responsive-sheet.png']:
    if (EX / 'pairs' / p).exists(): shutil.copy(EX / 'pairs' / p, OUT / p)
    elif (EX / p).exists(): shutil.copy(EX / p, OUT / p)
eye = json.loads((EX / 'eye.json').read_text()) if (EX / 'eye.json').exists() else {}
lines = [f'# Screenshot index · Student · final design · {status}', '',
         'Every image was rendered in headless Chromium with the Design host’s runtime and passed the automated checks in `CHECKS.md` (page overflow, content spilling out of or clipped by its box, clipped text, console errors, duplicate IDs, one H1, unresolved holes, names, references, target size), except where `CHECKS.md` lists a finding.', '',
         'Marks: **[eye]** inspected by eye on the final design (contact sheets or full size) · **[script]** checked by script only.', '',
         '| Folder | What | Images |', '| --- | --- | --- |']
desc = {'cases-1440': 'every case at 1440', 'cases-1024': 'every case at 1024', 'cases-768': 'every case at 768', 'cases-375': 'every case at 375', 'cases-320': 'a subset at 320',
        'stress-long-text': 'long-text stress (much longer names), images at 375; all four widths checked by script', 'interaction-states': 'controls on real pages: default, hover, keyboard focus, pressed', 'before-after': 'the original design (Main) beside the final design, same case and width'}
for d in sorted(p for p in OUT.iterdir() if p.is_dir()): lines.append(f'| `{d.name}/` | {desc.get(d.name, "")} | {len(list(d.glob("*.png")))} |')
lines += ['', 'Sheets: ' + ', '.join(f'`{p.name}`' for p in sorted(OUT.glob('*.png'))) + ' [eye].', '']
for d in sorted(p for p in OUT.iterdir() if p.is_dir()):
    lines += [f'## {d.name}', '']
    for p in sorted(d.glob('*.png')):
        mark = 'eye' if (p.name in eye.get(d.name, []) or d.name in ('interaction-states', 'before-after')) else 'script'
        lines.append(f'- `{p.name}` [{mark}]')
    lines.append('')
(OUT / 'INDEX.md').write_text('\n'.join(lines) + '\n')
with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as zf:
    root = zpath.stem + '/'
    for p in sorted(OUT.rglob('*')):
        if p.is_file(): zf.write(p, root + str(p.relative_to(OUT)))
print(zpath, zpath.stat().st_size, 'bytes,', sum(1 for _ in OUT.rglob('*.png')), 'images')

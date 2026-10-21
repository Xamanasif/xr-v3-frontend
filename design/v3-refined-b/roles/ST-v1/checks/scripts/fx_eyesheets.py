# Contact sheets of the final renders for inspection by eye; records which images were looked at (eye.json).
import json, pathlib, subprocess, sys
R = pathlib.Path('/tmp/claude-0/fx/run'); OUT = pathlib.Path('/tmp/claude-0/fx/eye'); OUT.mkdir(parents=True, exist_ok=True)
SHEET = '/home/claude/scripts/sheet.py'
PRIMARY = ['01-learn', '02-learn', '03-learn', '04-learn', '05-learn', '06-learn', '07-learn', '05as-assess', '08-learn', '08a-learn', '09-learn', '09ar-learn', '10-learn',
           '11-assess', '12-assess', '13-inprog', '14-released', '15-learn', '16v-vrdone', '16w-vrdone', '18-dtrfwd', '19-learn']
STATES = ['01-newst', '01-paused', '01-licence', '01-ended', '02-learn-loading', '02-learn-failed', '04-learn-x-nomatch', '04-learn-loading', '06-learn-res-fail', '06-learn-failed', '07-licence', '07-vrdone',
          '05as-released', '08-learn-launch-fail', '08a-learn-act-done', '09-vrdone', '09mr-learn', '11sub-waitmark', '11res-released', '11-assess-failed', '12-notpassed', '13-inprog-att-dialog',
          '13-inprog-att-subfail', '13-inprog-att-savefail', '14-notpassed', '14-waitmark', '15-ended', '15-learn-p-nomatch', '16v-vrdone-fb-errors', '16v-vrdone-fb-fail', '18-device-dev-error',
          '18-dtrsent', '18-dtrnoia', '18-nodevice', '19-withdrawn', '01-learn-menu', '01-learn-acct', 'xs07-learn', 'xs06-learn', '01-inactive']
def path(case, w):
    fix = R / 'fix' / f'{case}-{w}.png'
    if fix.exists(): return fix
    d = {'1440': 'wB', '375': 'wB', '1024': 'wA', '768': 'wA', '320': 'w320'}[w]
    p = R / d / f'{case}-{w}.png'
    return p if p.exists() else None
eye = {}
def sheet(name, cases, w, cw, mh, cols):
    files = [path(c, w) for c in cases]; files = [str(f) for f in files if f]
    subprocess.run(['python3', '-I', SHEET, str(OUT / name), str(cw), str(mh)] + files, check=True, env={'COLS': str(cols)}, capture_output=True)
    eye.setdefault(f'cases-{w}', []).extend(pathlib.Path(f).name for f in files)
    return name
made = []
for w, cw, mh, cols, per in [('1440', 700, 900, 3, 6), ('1024', 620, 1100, 3, 6), ('768', 520, 1400, 3, 6), ('375', 360, 2200, 5, 10), ('320', 320, 2200, 6, 12)]:
    cs = PRIMARY if w != '320' else [c for c in PRIMARY if path(c, '320')]
    for i in range(0, len(cs), per): made.append(sheet(f'primary-{w}-{i // per + 1}.png', cs[i:i + per], w, cw, mh, cols))
for w, cw, mh, cols, per in [('1440', 700, 900, 3, 6), ('375', 360, 1800, 5, 10)]:
    for i in range(0, len(STATES), per): made.append(sheet(f'states-{w}-{i // per + 1}.png', STATES[i:i + per], w, cw, mh, cols))
(pathlib.Path('/tmp/claude-0/fx') / 'eye.json').write_text(json.dumps({k: sorted(set(v)) for k, v in eye.items()}, indent=1))
print(len(made), 'sheets:', ' '.join(made))

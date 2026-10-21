# FINAL Student boards: one wrapper per screen state, fixed to one scenario, screen and state, without review controls.
# New files only (project/F-*.dc.html) importing StudentFinal; every earlier board stays untouched.
import json, pathlib, sys
OUT = pathlib.Path('/home/claude/work/project')
SPEC = pathlib.Path('/home/claude/work/fx_boards.json')
LAB = json.loads(pathlib.Path('/home/claude/work/r2_sclabels.json').read_text())
FULL = {'Rahul': 'Rahul Verma', 'Arun Kumar': 'Arun Kumar', 'Vikram Joshi': 'Vikram Joshi', 'Imran Shaikh': 'Imran Shaikh'}
rows = []
def row(key, title, boards): rows.append({'key': key, 'title': title, 'boards': boards})
def b(sc, scr, label, w=1440, preset='', ds=''):
    _, who, date = [x.strip() for x in LAB[sc].split('·')]
    name = 'F-' + scr.replace('ST-', '').replace('XS-', 'xs') + '-' + sc + (('-' + preset) if preset else '') + (('-' + ds) if ds else '') + ('' if w == 1440 else '-' + str(w))
    return {'file': name + '.dc.html', 'scenario': sc, 'screen': scr, 'preset': preset, 'ds': ds, 'w': w, 'label': label,
            'title': f'Final · {label} · {w} · {FULL.get(who, who)} · {date}'}
row('home', 'ST-01 Home · the next step first · held access said once', [
    b('learn', 'ST-01', 'ST-01 Home'), b('learn', 'ST-01', 'ST-01 Home', 1024), b('learn', 'ST-01', 'ST-01 Home', 768), b('learn', 'ST-01', 'ST-01 Home', 375),
    b('newst', 'ST-01', 'ST-01 Home · new student'), b('licence', 'ST-01', 'ST-01 Home · waiting for a licence'), b('paused', 'ST-01', 'ST-01 Home · institution paused'),
    b('ended', 'ST-01', 'ST-01 Home · access ended'), b('paused', 'ST-01', 'ST-01 Home · institution paused', 375)])
row('courses', 'ST-02 My courses · ST-04 All my experiments · course sections and experiment rows', [
    b('learn', 'ST-02', 'ST-02 My courses'), b('learn', 'ST-02', 'ST-02 My courses', 375), b('learn', 'ST-02', 'ST-02 My courses · loading', ds='loading'),
    b('learn', 'ST-02', 'ST-02 My courses · could not load', ds='failed'), b('ended', 'ST-02', 'ST-02 My courses · access ended, earlier work'),
    b('learn', 'ST-04', 'ST-04 All my experiments'), b('learn', 'ST-04', 'ST-04 All my experiments · no match', preset='x-nomatch'), b('learn', 'ST-04', 'ST-04 All my experiments', 375)])
row('course', 'ST-03 Course · experiments given to you', [
    b('learn', 'ST-03', 'ST-03 Course'), b('learn', 'ST-03', 'ST-03 Course', 375), b('paused', 'ST-03', 'ST-03 Course · institution paused'), b('ended', 'ST-03', 'ST-03 Course · nothing for you now')])
row('overview', 'ST-05 Experiment · Overview · what it is, what you learn, your formats', [
    b('learn', 'ST-05', 'ST-05 Overview'), b('learn', 'ST-05', 'ST-05 Overview', 1024), b('learn', 'ST-05', 'ST-05 Overview', 768), b('learn', 'ST-05', 'ST-05 Overview', 375),
    b('licence', 'ST-05', 'ST-05 Overview · waiting for a licence'), b('paused', 'ST-05', 'ST-05 Overview · institution paused'), b('vrdone', 'ST-05', 'ST-05 Overview · feedback to give'),
    b('vrnow', 'ST-05', 'ST-05 Overview · VR not available right now')])
row('ressim', 'ST-06 Resources · ST-07 Simulation, choose a format', [
    b('learn', 'ST-06', 'ST-06 Resources'), b('learn', 'ST-06', 'ST-06 Resources', 375), b('learn', 'ST-06', 'ST-06 Resources · a resource did not open', preset='res-fail'),
    b('learn', 'ST-06', 'ST-06 Resources · loading', ds='loading'), b('learn', 'ST-07', 'ST-07 Simulation'), b('learn', 'ST-07', 'ST-07 Simulation', 768), b('learn', 'ST-07', 'ST-07 Simulation', 375),
    b('licence', 'ST-07', 'ST-07 Simulation · waiting for a licence'), b('vrdone', 'ST-07', 'ST-07 Simulation · both formats completed'), b('paused', 'ST-07', 'ST-07 Simulation · institution paused')])
row('tabs', 'ST-05 Assessment tab · ST-10 Progress for this experiment', [
    b('assess', 'ST-05as', 'ST-05 Assessment tab · to do'), b('released', 'ST-05as', 'ST-05 Assessment tab · result ready'), b('learn', 'ST-05as', 'ST-05 Assessment tab · none set'),
    b('assess', 'ST-05as', 'ST-05 Assessment tab · to do', 375), b('learn', 'ST-10', 'ST-10 Progress tab'), b('vrdone', 'ST-10', 'ST-10 Progress tab · both completed'),
    b('vrdone', 'ST-10', 'ST-10 Progress tab · both completed', 768), b('learn', 'ST-10', 'ST-10 Progress tab', 375)])
row('web', 'ST-08 WEB simulation · ST-08a sample activity · completion recorded by the platform', [
    b('learn', 'ST-08', 'ST-08 WEB · in progress'), b('learn', 'ST-08', 'ST-08 WEB · in progress', 1024), b('learn', 'ST-08', 'ST-08 WEB · in progress', 375),
    b('learn', 'ST-08', 'ST-08 WEB · did not open', preset='launch-fail'), b('granted', 'ST-08', 'ST-08 WEB · not started'), b('vrdone', 'ST-08', 'ST-08 WEB · completed'),
    b('paused', 'ST-08', 'ST-08 WEB · institution paused'), b('learn', 'ST-08a', 'ST-08a Sample activity'), b('learn', 'ST-08a', 'ST-08a Sample activity', 375),
    b('learn', 'ST-08a', 'ST-08a Sample activity · completed', preset='act-done')])
row('vr', 'ST-09 VR · set up and progress · AR and MR not available', [
    b('learn', 'ST-09', 'ST-09 VR · set up'), b('vrprog', 'ST-09', 'ST-09 VR · in progress'), b('vrdone', 'ST-09', 'ST-09 VR · completed, feedback to give'),
    b('vrnow', 'ST-09', 'ST-09 VR · not available right now'), b('learn', 'ST-09', 'ST-09 VR · set up', 375), b('learn', 'ST-09ar', 'ST-09 AR · not included'),
    b('learn', 'ST-09mr', 'ST-09 MR · not available'), b('learn', 'ST-09ar', 'ST-09 AR · not included', 375), b('nodevice', 'ST-09', 'ST-09 · no headset formats')])
row('progress', 'ST-15 Progress · one row per format, dated facts, no percentages', [
    b('learn', 'ST-15', 'ST-15 Progress'), b('learn', 'ST-15', 'ST-15 Progress', 1024), b('learn', 'ST-15', 'ST-15 Progress', 768), b('learn', 'ST-15', 'ST-15 Progress', 375),
    b('vrdone', 'ST-15', 'ST-15 Progress · both completed'), b('ended', 'ST-15', 'ST-15 Progress · earlier work'), b('ended', 'ST-15', 'ST-15 Progress · earlier work', 375),
    b('learn', 'ST-15', 'ST-15 Progress · filtered', preset='p-filter'), b('learn', 'ST-15', 'ST-15 Progress · no match', preset='p-nomatch'),
    b('newst', 'ST-15', 'ST-15 Progress · nothing yet'), b('learn', 'ST-15', 'ST-15 Progress · loading', ds='loading')])
row('alist', 'ST-11 Assessments · each row led by its key date', [
    b('assess', 'ST-11', 'ST-11 Assessments · to do'), b('assess', 'ST-11', 'ST-11 Assessments · to do', 375), b('waitmark', 'ST-11sub', 'ST-11 Assessments · submitted'),
    b('released', 'ST-11res', 'ST-11 Assessments · results'), b('learn', 'ST-11', 'ST-11 Assessments · none set yet'), b('newst', 'ST-11', 'ST-11 Assessments · new student'),
    b('assess', 'ST-11', 'ST-11 Assessments · could not load', ds='failed')])
row('aintro', 'ST-12 Assessment, before you start · the state, three rules and the action first', [
    b('assess', 'ST-12', 'ST-12 Before you start'), b('assess', 'ST-12', 'ST-12 Before you start', 768), b('assess', 'ST-12', 'ST-12 Before you start', 375),
    b('inprog', 'ST-12', 'ST-12 · attempt in progress'), b('waitmark', 'ST-12', 'ST-12 · submitted'), b('notpassed', 'ST-12', 'ST-12 · not passed, one attempt left'),
    b('learn', 'ST-12', 'ST-12 · no assessment here yet')])
row('attempt', 'ST-13 Assessment attempt · one numbered sheet, the navigator beside it', [
    b('assess', 'ST-13', 'ST-13 Attempt · not started'), b('inprog', 'ST-13', 'ST-13 Attempt · two answered'), b('inprog', 'ST-13', 'ST-13 Attempt', 1024), b('inprog', 'ST-13', 'ST-13 Attempt', 375),
    b('inprog', 'ST-13', 'ST-13 Attempt · confirm submit', preset='att-dialog'), b('inprog', 'ST-13', 'ST-13 Attempt · confirm submit', 375, preset='att-dialog'),
    b('inprog', 'ST-13', 'ST-13 Attempt · answer did not save', preset='att-savefail'), b('inprog', 'ST-13', 'ST-13 Attempt · could not submit', preset='att-subfail'),
    b('waitmark', 'ST-13', 'ST-13 Attempt · submitted')])
row('result', 'ST-14 Result · the score panel, marks by question, the review', [
    b('released', 'ST-14', 'ST-14 Result · passed'), b('released', 'ST-14', 'ST-14 Result · passed', 768), b('released', 'ST-14', 'ST-14 Result · passed', 375),
    b('notpassed', 'ST-14', 'ST-14 Result · not passed, try again'), b('waitmark', 'ST-14', 'ST-14 Result · waiting for marking'), b('notrel', 'ST-14', 'ST-14 Result · not released yet')])
row('feedback', 'ST-16 Format feedback · ST-17 Feedback sent · one rating sheet, the scale named once', [
    b('vrdone', 'ST-16v', 'ST-16 Feedback on VR'), b('vrdone', 'ST-16v', 'ST-16 Feedback on VR', 375), b('vrdone', 'ST-16v', 'ST-16 Feedback · ratings missing', preset='fb-errors'),
    b('vrdone', 'ST-16v', 'ST-16 Feedback · not sent', preset='fb-fail'), b('learn', 'ST-16v', 'ST-16 Feedback · not open yet'), b('vrdone', 'ST-16w', 'ST-17 Feedback on WEB sent'),
    b('vrdone', 'ST-16w', 'ST-17 Feedback on WEB sent', 375)])
row('device', 'ST-18 My device · the transfer request as three dated steps', [
    b('device', 'ST-18', 'ST-18 My device'), b('device', 'ST-18', 'ST-18 · request form', preset='dev-form'), b('device', 'ST-18', 'ST-18 · request form, missing device', preset='dev-error'),
    b('dtrsent', 'ST-18', 'ST-18 · with your Institute Admin'), b('dtrfwd', 'ST-18', 'ST-18 · forwarded to BITS'), b('dtrfwd', 'ST-18', 'ST-18 · forwarded to BITS', 375),
    b('dtrappr', 'ST-18', 'ST-18 · approved'), b('dtrnoia', 'ST-18', 'ST-18 · no Institute Admin yet'), b('nodevice', 'ST-18', 'ST-18 · not available without headset formats'),
    b('paused', 'ST-18', 'ST-18 · institution paused')])
row('refusal', 'ST-19 Experiment not available · refusals say why once and what you can still do', [
    b('learn', 'ST-19', 'ST-19 Not available'), b('learn', 'ST-19', 'ST-19 Not available', 375), b('withdrawn', 'ST-19', 'ST-19 · no longer given to you'),
    b('ended', 'ST-19', 'ST-19 · access ended'), b('inactive', 'ST-05', 'XS-08 · account inactive (shared notice, borrowed)')])
row('shell', 'Navigation shell and the borrowed shared surfaces (XS, unchanged, assembly pending XS)', [
    b('learn', 'ST-01', 'Menu drawer', 375, preset='menu'), b('learn', 'ST-01', 'Menu drawer', 768, preset='menu'), b('learn', 'ST-01', 'XS-05 Account menu (borrowed)', preset='acct'),
    b('learn', 'XS-07', 'XS-07 Help & support (borrowed)'), b('learn', 'XS-07f', 'XS-07 Report a problem (borrowed)'), b('learn', 'XS-03', 'XS-03 Signed out (borrowed)'),
    b('learn', 'XS-06', 'XS-06 Not your workspace (borrowed)')])
row('narrow', 'Narrow phones · 320', [
    b('learn', 'ST-01', 'ST-01 Home', 320), b('learn', 'ST-05', 'ST-05 Overview', 320), b('assess', 'ST-12', 'ST-12 Before you start', 320), b('inprog', 'ST-13', 'ST-13 Attempt', 320),
    b('released', 'ST-14', 'ST-14 Result', 320), b('learn', 'ST-15', 'ST-15 Progress', 320), b('vrdone', 'ST-16v', 'ST-16 Feedback', 320), b('dtrfwd', 'ST-18', 'ST-18 My device', 320)])
TPL = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<script src="./support.js"></script>
<link rel="stylesheet" href="./core.css">
<link rel="stylesheet" href="./rb.css">
<link rel="stylesheet" href="./rb-kit.css">
<link rel="stylesheet" href="./v3-student-final.css">
</head>
<body>
<!-- Student final board, newly authored derivative: the final role preview, StudentFinal, fixed to one scenario,
     screen and state, without review controls. -->
<x-dc>
<helmet><style>body{{margin:0;background:#F3F4F9}}</style></helmet>
<dc-import name="StudentFinal" scenario="{scenario}" screen="{screen}"{preset}{ds} chrome="none" hint-size="100%,100%"></dc-import>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{ renderVals() {{ return {{}}; }} }}
</script>
</body>
</html>
'''
def write(heights=None):
    n, seen = 0, set()
    for r in rows:
        for x in r['boards']:
            assert x['file'] not in seen, x['file']; seen.add(x['file'])
            h = (heights or {}).get(x['file'], 900)
            (OUT / x['file']).write_text(TPL.format(title=x['title'].replace('&', '&amp;'), scenario=x['scenario'], screen=x['screen'], w=x['w'], h=h,
                preset=f' preset="{x["preset"]}"' if x['preset'] else '', ds=f' data-state="{x["ds"]}"' if x['ds'] else ''))
            n += 1
    SPEC.write_text(json.dumps(rows, indent=1, ensure_ascii=False))
    return n
if __name__ == '__main__':
    heights = json.loads(pathlib.Path(sys.argv[1]).read_text()) if len(sys.argv) > 1 else None
    print(write(heights), 'final boards written in', len(rows), 'rows')

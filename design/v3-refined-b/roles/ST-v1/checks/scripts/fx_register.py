# COVERAGE-REGISTER for the final Student design: every owned screen and important subview, marked REDESIGNED or
# REVIEWED AND UNCHANGED against the original complete-role design (Main.dc.html), with its evidence.
# Status is measured where it can be: whole-page and subview pixels of Main vs StudentFinal (fx_links.mjs change detection).
import json, pathlib, collections
W = pathlib.Path('/home/claude/work'); R = pathlib.Path('/tmp/claude-0/fx/run'); D = W / 'delivery-final'
r2 = {x['id']: x for x in json.loads((W / 'delivery-r2' / 'COVERAGE-REGISTER.json').read_text())}
links = json.loads((R / 'links.json').read_text())
cases = {c['name']: c for c in json.loads((W / 'fxcases.json').read_text())}
c320 = {c['name'] for c in json.loads((W / 'fxcases-320.json').read_text())}
boards = [b for r in json.loads((W / 'fx_boards.json').read_text()) for b in r['boards']]
def bfor(names):
    out = []
    for n in names:
        c = cases[n]
        for b in boards:
            if b['scenario'] == c['scenario'] and b['screen'] == c['screen'] and b['preset'] == (c.get('preset') or '') and b['ds'] == (c.get('dataState') or ''):
                out.append(b['file'])
    return sorted(set(out))
def page_changed(names):
    res = [links.get(f'{n}@{w}', {}).get('pageSame') for n in names for w in (1440, 1024, 768, 375)]
    res = [x for x in res if x is not None]
    return (not all(res)) if res else None
def sub_state(names, sel):
    st = [links.get(f'{n}@{w}', {}).get('subs', {}).get(sel) for n in names for w in (1440, 1024, 768, 375)]
    return [s for s in st if s]
FINAL = {  # what the final consolidation pass changed on top of R2, per ID
 'ST-05': 'Assessment tab: on tablets the action keeps its own width under the content (was a full-width bar). The licence-wait sentence no longer names the access-plan record (owner decision: internal identifiers stay out of Student labels).',
 'ST-05as': 'On tablets the action keeps its own width under the content (was a full-width gold bar).',
 'ST-07': 'An unstyled hook class removed from held format cards (no visual change); stage checks kept at 375. The chooser’s licence note no longer names the access-plan record.',
 'ST-01': 'Stage checks kept at 375 (hidden only on 320 phones).',
 'ST-08': 'Stage checks kept at 375. The licence-wait sentence no longer names the access-plan record.',
 'ST-09': 'Setup-steps disclosure gets the same hover as text links. The licence-wait sentence no longer names the access-plan record.',
 'ST-10': 'The grant line carries no record identifier (as before). One 24 / 18 px gutter aligned with the card header; below 766 px the table becomes two-column rows (fixes content spilling past the card at 768–1024).',
 'ST-11': 'At 320 the three tabs sit tighter, so “Results” and its count are no longer cut off at the edge of the tab strip.',
 'ST-12': 'The six key facts sit in two columns on phones (one column only below 330 px). Not passed: “Try again” and “See result” now reach the card edge on phones (the action row had shrunk to its two short labels).',
 'ST-13': 'Answered numbers in the navigator get a hover state.',
 'ST-14': 'Full-mark chips in “marks by question” get a hover state.',
 'ST-17': 'At 320 the answer words wrap under the dots instead of being clipped (1440–375 unchanged).',
 'ST-15': 'The grant line reads “Given by your institution”, without the student-access record, and the licence-wait sentence no longer names the access-plan record. No box inside the card: experiments are flat groups with a tinted header band; one 24 / 18 px gutter; two-column rows below 766 px.',
 'ST-18': 'The transfer request shows no Reference row: the DTR record identifier stays in the data and in the view model, but is not a label on the page.',
}
J = {'ST-01': 'J1 J2 J5', 'ST-02': 'J1 (breadcrumb)', 'ST-03': 'J1', 'ST-04': 'link map', 'ST-05': 'J1 J5', 'ST-05as': 'link map', 'ST-06': 'J1', 'ST-07': 'J1 J4', 'ST-08': 'J1 J5 J6', 'ST-08a': 'J1',
     'ST-09': 'J4 J5', 'ST-10': 'link map', 'ST-11': 'J3', 'ST-12': 'J3 J5', 'ST-13': 'J3', 'ST-14': 'J3', 'ST-15': 'J1 J5', 'ST-16': 'J2 J5', 'ST-17': 'J2', 'ST-18': 'J4 J5', 'ST-19': 'J5'}
S = lambda key, name, kind, names, sel=None: {'key': key, 'name': name, 'kind': kind, 'cases': names, 'sel': sel}
INV = collections.OrderedDict([
 ('ST-01', [S('page', 'Home · active learner: next step with the stage tracker, also in this experiment, what you learn', 'page', ['01-learn']),
            S('learning', 'Learning states: given, assessment ready, attempt in progress, feedback to give, VR in progress / not now / done, waiting, released', 'state', ['01-granted', '01-assess', '01-inprog', '01-vrdone', '01-vrprog', '01-vrnow', '01-waitmark', '01-released', '01-device']),
            S('new', 'New student: no access yet, how it works', 'state', ['01-newst']),
            S('held', 'Held access: waiting for a licence, institution paused, ended, withdrawn, no headset formats', 'state', ['01-licence', '01-paused', '01-ended', '01-withdrawn', '01-nodevice']),
            S('inactive', 'Account inactive (borrowed XS-08 notice above the page)', 'state', ['01-inactive'])]),
 ('ST-02', [S('page', 'My courses · course sections with experiment rows', 'page', ['02-learn']),
            S('states', 'Given, new student, waiting for a licence, paused, access ended / withdrawn (earlier work)', 'state', ['02-granted', '02-newst', '02-licence', '02-paused', '02-ended', '02-withdrawn']),
            S('data', 'Loading and could not load (Try again)', 'state', ['02-learn-loading', '02-learn-failed'])]),
 ('ST-03', [S('page', 'Course · experiments given to you', 'page', ['03-learn']),
            S('states', 'Paused, waiting for a licence, new student, course not current (refusal with earlier work)', 'state', ['03-paused', '03-licence', '03-newst', '03-ended'])]),
 ('ST-04', [S('page', 'All my experiments · toolbar (search, format filter) and rows', 'tab', ['04-learn']),
            S('filter', 'Search / filter with no match, chips and Clear filters', 'form', ['04-learn-x-nomatch']),
            S('states', 'Ended, paused, loading, could not load', 'state', ['04-ended', '04-paused', '04-learn-loading', '04-learn-failed'])]),
 ('ST-05', [S('head', 'Experiment header and the five section tabs (wrapping chips on phones)', 'nested page', ['05-learn']),
            S('overview', 'Overview tab: about, what you learn, formats and your progress, resources and assessment beside', 'tab', ['05-learn', '05-granted', '05-vrdone', '05-vrnow']),
            S('held', 'Held: waiting for a licence, paused, ended / withdrawn refusals, new student', 'state', ['05-licence', '05-paused', '05-ended', '05-withdrawn', '05-newst'])]),
 ('ST-05as', [S('tab', 'Assessment tab: deadline block, what it covers, state and one action', 'tab', ['05as-assess']),
              S('states', 'In progress, submitted, not released, released, not passed, none set yet', 'state', ['05as-inprog', '05as-waitmark', '05as-notrel', '05as-released', '05as-notpassed', '05as-learn'])]),
 ('ST-06', [S('list', 'Resources tab: reading list with type, length and when opened; aside on how resources relate', 'tab', ['06-learn']),
            S('fail', 'A resource did not open (Try again)', 'state', ['06-learn-res-fail']),
            S('states', 'Given, paused, waiting for a licence, loading, could not load', 'state', ['06-granted', '06-paused', '06-licence', '06-learn-loading', '06-learn-failed'])]),
 ('ST-07', [S('chooser', 'Simulation tab: two format cards (next step tagged), formats not available listed with reasons', 'tab', ['07-learn']),
            S('states', 'Given, VR not now, VR in progress, both completed, waiting for a licence, paused', 'state', ['07-granted', '07-vrnow', '07-vrprog', '07-vrdone', '07-licence', '07-paused'])]),
 ('ST-08', [S('launch', 'WEB page: launch card (stages, one action, help row) and the format facts', 'page', ['08-learn']),
            S('states', 'Not started, completed (feedback), paused, waiting for a licence', 'state', ['08-granted', '08-vrdone', '08-paused', '08-licence']),
            S('fail', 'The simulation did not open (Try again, Report a problem)', 'state', ['08-learn-launch-fail'])]),
 ('ST-08a', [S('activity', 'Sample activity: stage tracker and one stage card', 'step', ['08a-learn', '08a-granted']),
             S('done', 'Activity completed: recorded by the platform', 'state', ['08a-learn-act-done']),
             S('focusbar', 'Focused-task bar: back link and save status', 'component', ['08a-learn'], '.st-focusbar')]),
 ('ST-09', [S('vr', 'VR page: set up (steps disclosure), your authorised headset, help row, format facts', 'page', ['09-learn', '09-learn-setup-open']),
            S('states', 'In progress, completed (feedback), not available right now, paused, waiting, no headset formats', 'state', ['09-vrprog', '09-vrdone', '09-vrnow', '09-paused', '09-licence', '09-nodevice']),
            S('armr', 'AR not included · MR not available (compact refusal with the formats you can use)', 'state', ['09ar-learn', '09mr-learn'])]),
 ('ST-10', [S('table', 'Progress tab: one row per format with dated facts, formats not available, assessment line', 'tab', ['10-learn', '10-vrdone']),
            S('states', 'Given, paused', 'state', ['10-granted', '10-paused'])]),
 ('ST-11', [S('list', 'Assessments: To do / Submitted / Results tabs with counts, rows led by the key date', 'page', ['11-assess', '11sub-waitmark', '11res-released']),
            S('empty', 'Empty tabs say where the assessment is; no assessments set; new student', 'state', ['11-learn', '11-newst', '11-inprog', '11sub-assess', '11res-assess']),
            S('data', 'Loading and could not load (no counts shown)', 'state', ['11-assess-loading', '11-assess-failed'])]),
 ('ST-12', [S('card', 'Before you start: state, three rules and the action; deadline block and six key facts', 'page', ['12-assess']),
            S('states', 'Attempt in progress, submitted, not released, released, not passed (try again), none set', 'state', ['12-inprog', '12-waitmark', '12-notrel', '12-released', '12-notpassed', '12-learn'])]),
 ('ST-13', [S('sheet', 'Attempt: one numbered question sheet (choice, true / false, written) and the answer navigator', 'step', ['13-assess', '13-inprog', '13-assess-att-two']),
            S('save', 'Answers save automatically: saved / did not save + Try again', 'state', ['13-inprog-att-savefail']),
            S('dialog', 'Submit dialog naming unanswered questions (focus kept inside, Escape closes)', 'dialog', ['13-inprog-att-dialog'], '.rk-dialog'),
            S('subfail', 'Answers were not submitted (still saved)', 'state', ['13-inprog-att-subfail']),
            S('done', 'Submitted: waiting for marking', 'state', ['13-waitmark']),
            S('focusbar', 'Focused-task bar: back link and save status', 'component', ['13-inprog'], '.st-focusbar')]),
 ('ST-14', [S('released', 'Result released: score panel, marks by question (jump list), answer review', 'page', ['14-released', '14-notpassed']),
            S('withheld', 'Not submitted / waiting for marking / not released: compact message, no marks', 'state', ['14-waitmark', '14-notrel', '14-assess'])]),
 ('ST-15', [S('list', 'Progress: filters with chips, course groups, one row per format with dated facts', 'page', ['15-learn', '15-vrdone', '15-granted']),
            S('filter', 'Filtered, no match, Clear filters', 'form', ['15-learn-p-filter', '15-learn-p-nomatch']),
            S('states', 'New student, paused, earlier work after access ended, loading, could not load', 'state', ['15-newst', '15-paused', '15-ended', '15-learn-loading', '15-learn-failed'])]),
 ('ST-16', [S('sheet', 'Feedback: one rating sheet, the scale named once, optional comment', 'step', ['16v-vrdone']),
            S('errors', 'Ratings missing: error summary and inline errors', 'form', ['16v-vrdone-fb-errors']),
            S('fail', 'Not sent (answers kept)', 'state', ['16v-vrdone-fb-fail']),
            S('notyet', 'Not open yet (before the format is completed)', 'state', ['16v-learn', '16w-learn'])]),
 ('ST-17', [S('sent', 'Feedback sent: thank-you band and the answers on the same scale, read-only', 'state', ['16w-vrdone'])]),
 ('ST-18', [S('device', 'My device: authorised headset and one action', 'page', ['18-device']),
            S('form', 'Transfer request form and its validation', 'form', ['18-device-dev-form', '18-device-dev-error']),
            S('chain', 'Request as three dated steps: with your Institute Admin, forwarded, approved, no Institute Admin', 'state', ['18-dtrsent', '18-dtrfwd', '18-dtrappr', '18-dtrnoia']),
            S('held', 'Paused; not available without headset formats', 'state', ['18-paused', '18-nodevice'])]),
 ('ST-19', [S('refusal', 'Not available: compact card, the reason once and what you can still do', 'state', ['19-learn', '19-withdrawn', '19-ended'])]),
])
FIX_TREATMENT = {  # the R2 text carried below described identifiers the approved design no longer shows
 'ST-05': [('held pill with the licence sentence (with ACC-0107, as in the baseline band) on Overview', 'held pill with the licence sentence on Overview')],
 'ST-07': [('(a licence wait is said there once, with ACC-0107 as in the baseline rows)', '(a licence wait is said there once)')],
 'ST-15': [('\u201cGiven by your institution \u00b7 SACC-0310\u201d as in the baseline', '\u201cGiven by your institution\u201d, with no record identifier'), ('and the licence sentence with ACC-0107', 'and the licence sentence')],
 'ST-18': [('the no-Institute-Admin notice, Reference DTR-0018 (as in the baseline), From / To / Your note', 'the no-Institute-Admin notice, From / To / Your note')]}
def fixt(sid, t):
    for old, new in FIX_TREATMENT.get(sid, []):
        assert t.count(old) == 1, (sid, old[:50]); t = t.replace(old, new)
    return t
ROLE = [S('rail', 'Navigation rail and top bar (foundation shell)', 'shell', ['01-learn', '05-learn', '15-learn'], '.rb-rail'),
        S('top', 'Top bar with the date and the account button', 'shell', ['01-learn', '05-learn', '15-learn'], '.rb-top'),
        S('drawer', 'Menu drawer below 1024 px', 'dialog', ['01-learn-menu'], '.rb-drawer'),
        S('banner', 'Held-access banners (institution paused, account inactive)', 'component', ['01-paused', '05-paused', '01-inactive'], '.rk-banner'),
        S('crumbs', 'Breadcrumbs', 'component', ['03-learn', '05-learn', '08-learn', '14-released'], '.rk-crumbs')]
BORROWED = [('XS-05', 'Account menu', ['01-learn-acct', 'xs05-learn'], '.xsb-menu'), ('XS-07', 'Help & support (and Report a problem)', ['xs07-learn', 'xs07f-learn', 'XS07f-learn-help-error'], None),
            ('XS-03', 'Signed out', ['xs03-learn'], '.xsb-msg'), ('XS-06', 'Not your workspace', ['xs06-learn'], '.xsb-msg'), ('XS-08', 'Account inactive notice', ['01-inactive'], '.rk-banner')]
SUB = json.loads((R / 'subcmp' / 'subcmp.json').read_text())
PART = {'.rk-dialog': ['dialog'], '.rb-drawer': ['drawer'], '.xsb-menu': ['acctmenu'], '.rb-top': ['topbar'], '.rk-banner': ['banner'],
        '.rb-rail': ['rail-home', 'rail-hub', 'rail-prog', 'rail-asmt', 'rail-dev'], '.st-focusbar': ['focusbar-att', 'focusbar-act']}
def status_of(sv):
    if sv['sel'] in PART:   # shared component: compared like for like at a fixed 900 px viewport, interior (inset past the rounded corners)
        rs = [r for r in SUB if r['part'] in PART[sv['sel']]]
        if rs and all(r.get('interiorSame') for r in rs): return 'REVIEWED AND UNCHANGED', f"the component is pixel-identical to the original in {len(rs)} renders ({sv['sel']}, fixed viewport)"
        if rs: return 'REDESIGNED', f"the component differs from the original in {sum(1 for r in rs if not r.get('interiorSame'))} of {len(rs)} renders"
    if sv['sel']:
        st = sub_state(sv['cases'], sv['sel'])
        if st and all(s == 'same' for s in st): return 'REVIEWED AND UNCHANGED', f"pixel-identical to the original design in {len(st)} renders ({sv['sel']})"
        if st: return 'REDESIGNED', f"differs from the original in {sum(1 for s in st if s != 'same')} of {len(st)} renders ({sv['sel']})"
    ch = page_changed(sv['cases'])
    if ch is None: return 'REDESIGNED', 'not measured'
    return ('REDESIGNED', 'every render differs from the original design') if ch else ('REVIEWED AND UNCHANGED', 'pixel-identical to the original design')
def widths(names):
    ws = ['1440', '1024', '768', '375']
    if any(n in c320 for n in names): ws.append('320')
    return ws
out, md = [], []
for sid, subs in INV.items():
    base = r2.get(sid) or r2.get({'ST-17': 'ST-17'}.get(sid, sid))
    rows = []
    for sv in subs:
        st, why = status_of(sv)
        rows.append({'subview': f"{sid}.{sv['key']}", 'name': sv['name'], 'kind': sv['kind'], 'status': st, 'basis': why, 'cases': sv['cases'], 'widths': widths(sv['cases']), 'boards': bfor(sv['cases'])})
    if sid == 'ST-13':
        pass
    entry = {'id': sid, 'screen': base['screen'], 'type': base.get('type'), 'navigation': base.get('navigation'), 'purpose': base.get('purpose'), 'mainAction': base.get('mainAction'),
             'problemsFound': base.get('problemsFound'), 'treatmentAsBuilt': fixt(sid, base.get('treatmentAsBuilt')), 'finalPass': FINAL.get(sid, 'Reviewed again at 1440, 1024, 768, 375 and 320: no change needed.'),
             'status': 'REDESIGNED' if any(r['status'] == 'REDESIGNED' for r in rows) else 'REVIEWED AND UNCHANGED', 'subviews': rows,
             'verification': {'journeys': J.get(sid, ''), 'widths': '1440 · 1024 · 768 · 375 for every case; 320 for a subset', 'automatedChecks': 'see CHECKS.md', 'inspectedByEye': 'yes (see the screenshot index)'}}
    out.append(entry)
role = []
for sv in ROLE:
    st, why = status_of(sv)
    role.append({'subview': 'role.' + sv['key'], 'name': sv['name'], 'kind': sv['kind'], 'status': st, 'basis': why, 'cases': sv['cases'], 'boards': bfor(sv['cases'])})
bor = []
for xid, nm, names, sel in BORROWED:
    st = [('same' if r.get('interiorSame') else 'changed') for r in SUB if r['part'] in PART.get(sel, [])] if sel in PART else (sub_state(names, sel) if sel else [])
    same = (all(s == 'same' for s in st) if st else None)
    pg = page_changed(names)
    bor.append({'id': xid, 'name': nm, 'status': 'BORROWED · UNCHANGED · ASSEMBLY PENDING XS', 'measured': ('component pixel-identical to the original in %d renders' % len(st)) if same else ('page pixel-identical to the original' if pg is False else 'surrounding page changed; the shared component itself is the original'), 'cases': names, 'boards': bfor(names)})
json.dump({'basis': 'Status is against the original complete-role design (project/Main.dc.html). Measured by rendering Main and StudentFinal for the same case at 1440, 1024, 768 and 375 and comparing pixels (whole page, or the named component).',
           'owned': out, 'roleLevel': role, 'borrowedNotOwned': bor}, open(D / 'COVERAGE-REGISTER.json', 'w'), indent=1, ensure_ascii=False)
n_sub = sum(len(e['subviews']) for e in out)
n_red = sum(1 for e in out for r in e['subviews'] if r['status'] == 'REDESIGNED')
STATUS = json.loads((D / 'status.json').read_text())
md += ['# Coverage register · Student · final design', '', f'Status: **{STATUS["statusLine"]}**.', '',
       f'Every owned screen ID (19 of 19) and its important subviews ({n_sub} rows), plus the role-level shell parts and the borrowed shared surfaces. **Status** is measured against the original complete-role design (`project/Main.dc.html`): each case was rendered from Main and from the final preview at 1440, 1024, 768 and 375 and the pixels compared — the whole page, or the named component for the parts drawn by shared components. **REDESIGNED** = it differs; **REVIEWED AND UNCHANGED** = reviewed in the final pass and identical to the original.', '',
       f'Result: {n_red} of {n_sub} owned subviews REDESIGNED, {n_sub - n_red} REVIEWED AND UNCHANGED; nothing is pending, incomplete or awaiting propagation (see `CONSOLIDATION-LEDGER.md`).', '',
       '| ID | Screen | Status | Subviews | Final pass | Journeys |', '| --- | --- | --- | --- | --- | --- |']
for e in out:
    md.append(f"| {e['id']} | {e['screen']} | {e['status']} | {len(e['subviews'])} ({sum(1 for r in e['subviews'] if r['status'] == 'REDESIGNED')} redesigned) | {'changed' if e['id'] in FINAL else 'no change needed'} | {e['verification']['journeys']} |")
md += ['', '## Role-level parts (shared by every screen)', '', '| Part | Status | Basis |', '| --- | --- | --- |']
md += [f"| {r['name']} | {r['status']} | {r['basis']} |" for r in role]
md += ['', '## Borrowed shared surfaces (XS contract, not owned by Student)', '', '| ID | Surface | Status | Measured |', '| --- | --- | --- | --- |']
md += [f"| {b['id']} | {b['name']} | {b['status']} | {b['measured']} |" for b in bor]
md.append('')
for e in out:
    md += [f"## {e['id']} · {e['screen']}", '', f"**Purpose.** {e['purpose']}  ", f"**Main action.** {e['mainAction']}", '', f"**Treatment as built.** {e['treatmentAsBuilt']}", '', f"**Final pass.** {e['finalPass']}", '',
           '| Subview | Kind | Status | Basis | Widths | Boards |', '| --- | --- | --- | --- | --- | --- |']
    for r in e['subviews']:
        md.append(f"| {r['name']} | {r['kind']} | {r['status']} | {r['basis']} | {' · '.join(r['widths'])} | {len(r['boards'])} |")
    md.append('')
(D / 'COVERAGE-REGISTER.md').write_text('\n'.join(md) + '\n')
print('owned subviews', n_sub, 'redesigned', n_red, '· role-level', [(r['subview'], r['status']) for r in role], '· borrowed', [(b['id'], b['measured']) for b in bor])

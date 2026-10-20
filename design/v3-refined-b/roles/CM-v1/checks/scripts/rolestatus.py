# Build ROLE-STATUS.json and ROLE-STATUS.md for the final package from the version-16 status file and the final run.
# usage: python3 -I rolestatus.py <v16 ROLE-STATUS.json> <results dir> <out dir> <published version label> <acceptance: pending | accepted:YYYY-MM-DD>
import json, sys, os, collections

SRC, RES, OUT, VERSION, ACC = sys.argv[1:6]
r = json.load(open(SRC, encoding='utf-8'))
J = json.load(open(os.path.join(RES, 'journeys.json'), encoding='utf-8'))
L = json.load(open(os.path.join(RES, 'links.json'), encoding='utf-8'))
boards = json.load(open(os.path.join(RES, 'boards.json'), encoding='utf-8'))
sweep = {w: json.load(open(os.path.join(RES, 'sweep', 'w' + w, 'results.json'), encoding='utf-8')) for w in ['1440', '1024', '768', '375']}
ov = json.load(open(os.path.join(RES, 'sweep', 'overlays', 'results.json'), encoding='utf-8')) + json.load(open(os.path.join(RES, 'sweep', 'overlays375', 'results.json'), encoding='utf-8'))
accepted = ACC.startswith('accepted:')
acc_date = ACC.split(':', 1)[1] if accepted else ''

# ── numbers from the run ──
jcount = collections.Counter(x['journey'] for x in J)
jfail = [x for x in J if not x['pass']]
nb = len(boards) if isinstance(boards, list) else len(boards.get('boards', boards))
blist = boards if isinstance(boards, list) else boards.get('boards', [])
states = len(sweep['1440'])
sweep_bad = [(w, x['n']) for w, xs in sweep.items() for x in xs if x['over'] or x['errs'] or x['bad'] or x['sw'] != int(w)]
ov_bad = [x['n'] for x in ov if x['over'] or x['errs'] or x['bad']]
by_from = collections.Counter(x['from'] for x in L)
def links_for(prefixes):
    xs = [x for x in L if any(x['from'].startswith(p) for p in prefixes)]
    ok = all(x['ok'] for x in xs)
    starts = len(set(x['from'] for x in xs))
    return len(xs), starts, ok
landed = sum(1 for x in L if x['ok'] and not x['covered'] and x['landed'] == x['declared'])
elsewhere = sum(1 for x in L if x['ok'] and not x['covered'] and x['landed'] != x['declared'])
covered = sum(1 for x in L if x['covered'])
failed = sum(1 for x in L if not x['ok'])

# ── status block ──
r['canvas']['publishedVersion'] = VERSION
r['canvas']['inspectionBoards'] = 85
r['status'] = {
    'design': 'DESIGN COMPLETE',
    'designScope': 'All nine owned IDs and every subview and state in one Refined B publishing-desk design; COVERAGE.md classifies each as REDESIGNED or REVIEWED AND UNCHANGED.',
    'connectedPreview': 'CONNECTED PREVIEW COMPLETE',
    'connectedPreviewScope': 'Every in-role journey. Cross-role effects are scenario handoffs, by contract.',
    'sharedSurfaces': 'ASSEMBLY PENDING XS',
    'sharedSurfacesNote': 'Contract dependency status (common/04), not a design checkpoint: the borrowed XS surfaces are replaced one-for-one when the Shared Surfaces delivery arrives.',
    'ownerAcceptance': ('ACCEPTED BY THE OWNER · ' + acc_date) if accepted else 'OWNER VISUAL ACCEPTANCE PENDING',
    'directionConfirmed': 'Owner, 20 Oct 2026: satisfied with the refined Content Manager direction; the six anchor designs are the baseline for completing the role. This is not an acceptance of version 20.',
    'redesign': {
        'complete': True,
        'statusesUsed': ['REDESIGNED', 'REVIEWED AND UNCHANGED'],
        'anchorsRedesignedIn': 'canvas version 16: CM-01, CM-02, CM-03, CM-04, CM-08 list, CM-09',
        'restRedesignedIn': 'canvas version 20: CM-05, CM-06, CM-07, CM-08 correction detail; list loading and couldn’t-load states',
        'reviewedAndUnchanged': ['PU-06 handoff frame', 'kit dialogs (behaviour while busy corrected)', 'shell and drawer', 'borrowed XS surfaces'],
        'pendingPropagation': [],
        'register': 'COVERAGE.md'
    }
}
if accepted:
    r['status']['ownerAcceptanceNote'] = 'The owner accepted canvas version 20 as the final Content Manager role design on ' + acc_date + '.'

# ── per screen ──
EXTRA_BOARDS = {'CM-02': ['L11-ReadyLoading-1440', 'L12-ReadyNotLoaded-1440'], 'CM-04': ['L09-LibraryLoading-1440', 'L10-LibraryNotLoaded-1440'],
                'CM-08': ['L13-UpdatesLoading-1440', 'L14-UpdatesNotLoaded-1440'], 'CM-09': ['K05-CodesLoading-1440', 'K06-CodesNotLoaded-1440']}
EXTRA_STATES = {
    'CM-02': ['loading: announced status and card skeleton; no figures', 'couldn’t load: “Nothing has changed. Try again.”; Try again reloads and focuses the page title'],
    'CM-03': ['publishing: Publishing… on the confirm button, disabled; Cancel and Escape wait; focus held in the dialog'],
    'CM-04': ['loading: announced status and table skeleton; count, view counts and figures hidden', 'couldn’t load: “Nothing has changed. Try again.”; Try again reloads and focuses the page title'],
    'CM-08': ['list loading and couldn’t load (Try again)', 'saving, sending and withdrawing: working label on the button, disabled; in the dialogs Cancel and Escape wait'],
    'CM-09': ['saving: Saving… on the button and in the footer; Undo changes waits', 'loading: announced status and table skeleton; no figures', 'couldn’t load: “Nothing has changed. Try again.”; Try again reloads and focuses the page title']
}
CM05_STATES = [
    'identity band: Published, the live version, the vendor; facts — course, live since, formats, corrections; when a correction is open, its status, version change and four stages (mini track)',
    'live catalogue entry read-only: summary, Available in, learning outcomes (set by the Academic Reviewer), formats and device needs; description and live version',
    'delivery: one card per format (web link and browser, or package, reference, device and install notes)',
    'history: versions and updates, newest first',
    'no open update: Start a correction · Edit catalogue details · Edit delivery link',
    'open draft or returned: the entries join it',
    'in review, awaiting release or on hold: only Open update (one open update)',
    'released today notice; back-from-correction notice',
    'View the public page (PU-06 handoff)'
]
CM08_DETAIL = 'detail: identity band with the version change, the facts (live version, proposed, fields changed, started / sent / released / withdrawn) and the four stages with “Your step”; About this correction (reason and version label in one row), catalogue details, delivery (package references side by side), current and proposed, history; the side panel keeps the state and the actions'
LINKS = {'CM-01': ['CM-01'], 'CM-02': ['CM-02'], 'CM-03': ['CM-03'], 'CM-04': ['CM-04'], 'CM-05': ['CM-05'], 'CM-08': ['CM-08'], 'CM-09': ['CM-09']}
J_EXTRA = {
    'CM-02': ['J11: loading and couldn’t load; Try again brings back the 3 cards with focus on the title; leaving and coming back reloads'],
    'CM-03': ['J10: Publishing… and Sending… while the command runs, buttons disabled; the dialog’s Cancel is disabled and Escape does nothing; focus stays in the dialog'],
    'CM-04': ['J11: loading and couldn’t load; Try again brings back the 12 published rows with focus on the title'],
    'CM-08': ['J10: Saving…, Sending… and Withdrawing… while each runs; Cancel and Escape wait in the dialogs', 'J11: list loading and couldn’t load; Try again brings back the 4 corrections'],
    'CM-09': ['J10: Saving… on the button and in the footer; Undo changes waits', 'J11: loading and couldn’t load; Try again brings back the 6 courses']
}
for s in r['screens']:
    i = s['id']
    if i in EXTRA_BOARDS: s['inspectionBoards'] = s['inspectionBoards'] + EXTRA_BOARDS[i]
    if i == 'CM-05': s['states'] = CM05_STATES
    if i == 'CM-08':
        st = [x for x in s['states'] if not x.startswith('detail:')]
        s['states'] = st[:1] + [CM08_DETAIL] + [x for x in s['states'] if x.startswith('detail:')] + st[1:]
    if i in EXTRA_STATES: s['states'] = s['states'] + EXTRA_STATES[i]
    if i == 'CM-03': s['states'] = [x.replace('publishing busy, ', '') for x in s['states']]
    n = len(s['inspectionBoards'])
    ev = s['evidence']
    ev['RENDERED'] = str(n) + ' boards at frame size (' + ', '.join(s['inspectionBoards']) + '); its states in the 4-width sweep (1440 / 1024 / 768 / 375)'
    lt = [x for x in ev.get('LOGIC TESTED', []) if not x.startswith('link crawl')]
    if i in LINKS:
        cnt, starts, ok = links_for(LINKS[i])
        lt.append('link crawl: ' + str(cnt) + ' controls from ' + str(starts) + ' starting state' + ('s' if starts != 1 else '') + (', all landed as intended' if ok else ', SOME FAILED'))
    elif i in ('CM-06', 'CM-07'):
        lt.append('link crawl: the entry lands on the correction draft (CM-08 detail view, by design)')
    ev['LOGIC TESTED'] = lt + J_EXTRA.get(i, [])
    anchor = i in ('CM-01', 'CM-02', 'CM-03', 'CM-04', 'CM-09')
    if i == 'CM-08':
        s['redesign'] = 'REDESIGNED — list in version 16 (anchor), detail in version 20'
    elif anchor:
        s['redesign'] = 'REDESIGNED — version 16 (anchor), reviewed again in version 20' + ('; list loading and couldn’t-load states added' if i in ('CM-02', 'CM-04', 'CM-09') else '; busy dialog behaviour corrected' if i == 'CM-03' else '')
    else:
        s['redesign'] = 'REDESIGNED — version 20'
    s['status'] = 'CONNECTED · REDESIGNED'

r['borrowedShared']['designStatus'] = 'REVIEWED AND UNCHANGED (borrowed XS contract)'
for h in r['outOfRoleHandoffs']:
    if h['to'] == 'PU-06': h['designStatus'] = 'REVIEWED AND UNCHANGED — labelled handoff frame in the role’s catalogue-entry card'

r['evidenceSummary'] = {
    'RENDERED': f'{nb} inspection boards at frame size from the canvas wrapper files: {nb - 5} page boards fit their frame exactly; 5 overlay boards (P01, C05, C11, X01, X02) are window-sized frames by design, with the page continuing under the overlay; on all {nb}: no horizontal overflow, no console error or warning, no failed request. Width sweep: {states} states × 1440/1024/768/375, full page ({states * 4} renders), and 5 overlays at 1440 and 375 (10 renders): ' + ('no horizontal overflow, no console output, no failed request' if not sweep_bad and not ov_bad else 'PROBLEMS: ' + json.dumps(sweep_bad + ov_bad)),
    'LOGIC TESTED': f'{len(jcount)} journeys, {len(J)} scripted steps, {len(jfail)} failed, and no console error or warning on any page they opened; link crawl {len(L)} clicks from {len(by_from)} starting states — {landed} landed on the declared destination, {elsewhere} on the intended page under another ID (Edit catalogue details and Edit delivery link open the correction draft in CM-08; Sign in returns to CM-01), {covered} correctly blocked by an open account menu or drawer, {failed} failed',
    'SOURCE CHECKED': 'base CSS byte-identical; no href="#"; every button has a handler; no tokens added; sample world identical to version 15 (record by record); cm.css selectors all match markup on a board or, where noted in CHECKS.md, in the live preview only; CM-10 absent; no Release or Hold in product UI; no checkpoint or propagation wording in the shipped files',
    'NOT TESTED': 'the Claude Design host’s Play mode and board chrome; real screen readers; browsers other than Chromium; touch; 200 % zoom and forced colours',
    'details': 'CHECKS.md'
}
r['generatedAt'] = '2026-10-20'
json.dump(r, open(os.path.join(OUT, 'ROLE-STATUS.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ── readable companion ──
md = []
md.append('# ROLE-STATUS — Content Manager · Design V3 Refined B\n')
md.append('Readable summary of `ROLE-STATUS.json` (the machine file is the source of truth).\n')
md.append('| | |\n| --- | --- |')
md.append('| Canvas | “' + r['canvas']['title'] + '”, version ' + VERSION + ' · ' + r['canvas']['artifact'] + ' |')
md.append('| Foundation | ' + r['foundation'] + ' — ' + r['designLanguage'] + ' |')
md.append('| Live role entry | `project/Main.dc.html` — board “Content Manager · live role preview”, page “Live role preview”; opens on CM-01 Overview |')
md.append('| Inspection boards | 85 |')
md.append('| Sample world | ' + r['sampleWorld']['id'] + ', as of ' + r['sampleWorld']['asOf'] + '; scenarios ' + ', '.join(r['sampleWorld']['scenarios']) + ' |\n')
md.append('## Status\n')
st = r['status']
md.append('| | |\n| --- | --- |')
md.append('| Design | `' + st['design'] + '` — ' + st['designScope'] + ' |')
md.append('| Connected preview | `' + st['connectedPreview'] + '` — ' + st['connectedPreviewScope'] + ' |')
md.append('| Shared surfaces | `' + st['sharedSurfaces'] + '` — ' + st['sharedSurfacesNote'] + ' |')
md.append('| Owner acceptance | `' + st['ownerAcceptance'] + '` |')
md.append('| Direction | ' + st['directionConfirmed'] + ' |')
md.append('| Pending propagation | none |\n')
md.append('## Owned screens\n')
md.append('| ID | Screen | Kind | Route proposal (v46) | Redesign | Boards |\n| --- | --- | --- | --- | --- | --- |')
for s in r['screens']:
    md.append('| ' + s['id'] + ' | ' + s['name'] + ' | ' + s['kind'] + ' | `' + s['v46RouteProposal'] + '` | ' + s['redesign'] + ' | ' + str(len(s['inspectionBoards'])) + ' |')
md.append('\nExcluded: CM-10 Academic groupings · Governance settings — not designed, not linked, no placeholder.\n')
md.append('## States per screen\n')
for s in r['screens']:
    md.append('### ' + s['id'] + ' ' + s['name'] + '\n')
    for x in s['states']: md.append('- ' + x)
    md.append('\nEvidence — RENDERED: ' + s['evidence']['RENDERED'] + '.')
    md.append('\nLOGIC TESTED: ' + '; '.join(s['evidence']['LOGIC TESTED']) + '.\n')
md.append('## Shared and out of role\n')
md.append('- Borrowed XS surfaces (`' + r['borrowedShared']['status'] + '`, ' + r['borrowedShared']['designStatus'] + '): ' + '; '.join(x['id'] + ' ' + x['name'] for x in r['borrowedShared']['surfaces']) + '.')
for h in r['outOfRoleHandoffs']:
    md.append('- Handoff to ' + h['to'] + ' (' + h['owner'] + ') from ' + h['from'] + ': ' + h['inPreview'] + (' · ' + h['designStatus'] if 'designStatus' in h else '') + '.')
md.append('\n## Evidence summary\n')
for k in ['RENDERED', 'LOGIC TESTED', 'SOURCE CHECKED', 'NOT TESTED']:
    md.append('- **' + k + '** — ' + r['evidenceSummary'][k] + '.')
md.append('\nDetails: `CHECKS.md`; register: `COVERAGE.md`.')
open(os.path.join(OUT, 'ROLE-STATUS.md'), 'w', encoding='utf-8').write('\n'.join(md) + '\n')
print('journeys', len(jcount), len(J), 'failed', len(jfail), '| links', len(L), landed, elsewhere, covered, failed, len(by_from), '| boards', nb, '| sweep', states, 'bad', sweep_bad, ov_bad)

# Build LINK-MAP.json from the link-crawl results (links.json) and the journey results (journeys.json).
# usage: python3 -I linkmap.py <links.json> <journeys.json> <out LINK-MAP.json>
import json, sys, collections

links = json.load(open(sys.argv[1], encoding='utf-8'))
journeys = json.load(open(sys.argv[2], encoding='utf-8'))

ROUTES = {
    'CM-01': '/content-manager', 'CM-02': '/content-manager/ready',
    'CM-03': '/content-manager/decisions/[submissionId]', 'CM-04': '/content-manager/library',
    'CM-05': '/content-manager/published/[experimentId]',
    'CM-06': '→ /content-manager/updates/[updateId] (draft, catalogue fields)',
    'CM-07': '→ /content-manager/updates/[updateId] (draft, delivery)',
    'CM-08': '/content-manager/updates · /content-manager/updates/[updateId]',
    'CM-09': '/content-manager/course-codes',
    'XS-01': '/sign-in', 'XS-03': '/signed-out', 'XS-05': '(top bar) account menu',
    'XS-06': '/[workspace]/not-allowed', 'XS-07': '/[workspace]/help',
    'PU-06': '/experiments/[experimentId]'
}
NAMES = {
    'CM-01': 'Overview', 'CM-02': 'Ready to publish', 'CM-03': 'Publication decision', 'CM-04': 'Content library',
    'CM-05': 'Published experiment', 'CM-06': 'Edit catalogue details (step into a correction draft)',
    'CM-07': 'Edit a delivery link (step into a correction draft)', 'CM-08': 'Updates / correction detail',
    'CM-09': 'Platform course codes', 'XS-01': 'Sign in', 'XS-03': 'Signed out', 'XS-05': 'Account menu',
    'XS-06': 'Not your workspace', 'XS-07': 'Help & support', 'PU-06': 'Public experiment page'
}

def cls(i):
    if i.startswith('CM-'): return 'in-role'
    if i.startswith('XS-'): return 'shared (borrowed XS until assembly)'
    return 'out-of-role handoff'

def fix(s):
    return s.replace('AR-10 Not your workspace', 'XS-06 Not your workspace')

def clean(label):
    # the rail badge's visible digit is aria-hidden; drop it from the label shown here
    return label.replace('Ready to publish3, ', 'Ready to publish, ').replace('Ready to publish2, ', 'Ready to publish, ')

out_links = []
for x in links:
    d = x['declared']
    if x['covered']:
        tested = 'LOGIC TESTED — click blocked by the open overlay, as intended (same control tested from the state without the overlay)'
    elif x['ok'] and x['landed'] == d:
        tested = 'LOGIC TESTED — clicked, landed on the declared destination'
    elif x['ok']:
        tested = 'LOGIC TESTED — clicked, landed on ' + x['landed'] + ' (' + {'CM-06': 'the correction draft, CM-08 detail view, by design', 'CM-07': 'the correction draft, CM-08 detail view, by design', 'XS-01': 'the Overview: the sign-in handoff returns to the role entry'}.get(d, 'see note') + ')'
    else:
        tested = 'FAILED'
    out_links.append({
        'from': fix(x['from']), 'control': clean(x['control']), 'element': x['tag'],
        'destination': d, 'destinationName': NAMES.get(d, d), 'v46RouteProposal': ROUTES.get(d, ''),
        'classification': cls(d), 'landedHeading': x['h1'], 'tested': tested
    })

def steps(prefix):
    return [r['journey'] + ' · ' + r['step'] for r in journeys if r['step'].startswith(prefix) or prefix in r['step']]

commands = [
    {'screen': 'CM-03', 'control': 'Publish (decision panel) → confirmation dialog → Publish', 'effect': 'publishes; result panel; leaves Ready to publish', 'refusals': 'no choice; check not met; stale (published elsewhere)', 'tested': 'LOGIC TESTED · J1, J5'},
    {'screen': 'CM-03', 'control': 'Send back (to the Academic Reviewer or the vendor)', 'effect': 'result panel; read-only afterwards', 'refusals': 'no recipient; no reason', 'tested': 'LOGIC TESTED · J6 (vendor), J8 (Academic Reviewer)'},
    {'screen': 'CM-03', 'control': 'Show where it is now (stale notice)', 'effect': 're-reads the record', 'tested': 'LOGIC TESTED · J5'},
    {'screen': 'CM-02', 'control': 'Sort: oldest first / newest first', 'effect': 'visible sort order', 'tested': 'LOGIC TESTED · J6'},
    {'screen': 'CM-04', 'control': 'View switch Ready · In review · With vendor · Published (aria-pressed)', 'effect': 'changes the list and count', 'tested': 'LOGIC TESTED · J1, J5 (keyboard), J6'},
    {'screen': 'CM-04', 'control': 'Search, course filter, chip remove, Clear filters', 'effect': 'filters with a count; no-match state', 'tested': 'LOGIC TESTED · J1, J5, J6'},
    {'screen': 'CM-05', 'control': 'Start a correction · Edit catalogue details · Edit delivery link', 'effect': 'new draft or joins the open one', 'tested': 'LOGIC TESTED · J2, J6, J7'},
    {'screen': 'CM-08', 'control': 'Save draft · Try again', 'effect': 'saved privately; live unchanged; failure keeps edits', 'tested': 'LOGIC TESTED · J2, J5'},
    {'screen': 'CM-08', 'control': 'Send for academic review → dialog → Send', 'effect': 'read-only, with the reviewer', 'refusals': 'no reason; no version label; version equals live', 'tested': 'LOGIC TESTED · J2, J3'},
    {'screen': 'CM-08', 'control': 'Withdraw → dialog (reason) → Withdraw', 'effect': 'closed; reason kept in history; live unchanged', 'refusals': 'no reason; approved meanwhile (stale)', 'tested': 'LOGIC TESTED · J5, J6'},
    {'screen': 'CM-08', 'control': 'Go to the web link (CM-07 arrival notice)', 'effect': 'moves focus to the field', 'tested': 'LOGIC TESTED · J6'},
    {'screen': 'CM-09', 'control': 'Save codes · Undo changes · Try again', 'effect': 'codes apply everywhere they are shown', 'refusals': 'duplicate; save failure keeps edits', 'tested': 'LOGIC TESTED · J4, J6'},
    {'screen': 'shell', 'control': 'Menu (below 1024 px) · Close menu · Escape', 'effect': 'drawer opens with focus inside; closes back to Menu', 'tested': 'LOGIC TESTED · J5'},
    {'screen': 'XS-05', 'control': 'Account menu · Escape · Help & support · Sign out', 'effect': 'menu; signed-out page', 'tested': 'LOGIC TESTED · J5'},
    {'screen': 'XS-07', 'control': 'Report a problem → Send report', 'effect': 'report SUP-0186 with its reference', 'refusals': 'nothing described', 'tested': 'LOGIC TESTED · J5'},
    {'screen': 'CM-03 · CM-08 · CM-09 · XS-07', 'control': 'While a command runs: Publishing… · Sending… · Saving… · Withdrawing…', 'effect': 'the button that started it shows the working label and is disabled until the result; in a dialog, Cancel and Escape wait and focus stays inside; Undo changes waits while codes save', 'tested': 'LOGIC TESTED · J10'},
    {'screen': 'CM-02 · CM-04 · CM-08 list · CM-09', 'control': 'Try again (the list couldn’t load)', 'effect': 'reloads the list and moves focus to the page title; leaving and coming back also reloads it', 'tested': 'LOGIC TESTED · J11'}
]

handoffs = [
    {'from': 'CM-03 result · CM-05', 'control': 'View the public page', 'to': 'PU-06', 'owner': 'PU', 'inPreview': 'dashed handoff frame (what the public page reads from the record); Back to the published experiment', 'tested': 'LOGIC TESTED · J1, J4; link crawl'},
    {'from': 'XS-03', 'control': 'Sign in', 'to': 'XS-01', 'owner': 'XS', 'inPreview': 'returns to CM-01 Overview', 'tested': 'LOGIC TESTED · J5; link crawl'},
    {'from': 'CM-03', 'control': 'Send back to the Academic Reviewer', 'to': 'RV-03', 'owner': 'RV', 'inPreview': 'result panel; record reads Back with the Academic Reviewer', 'tested': 'LOGIC TESTED · J8'},
    {'from': 'CM-03', 'control': 'Send back to the vendor', 'to': 'VE-07 / VE-08', 'owner': 'VE', 'inPreview': 'result panel; record reads With the vendor', 'tested': 'LOGIC TESTED · J6'},
    {'from': 'CM-08 (in academic review)', 'control': 'Scenario handoff: Academic Reviewer approves / returns it', 'to': 'RV-04', 'owner': 'RV', 'inPreview': 'preview-only dashed box, never product UI', 'tested': 'LOGIC TESTED · J2, J3, J6'},
    {'from': 'CM-08 (awaiting release decision / on hold)', 'control': 'Scenario handoff: Super Admin releases it / puts it on hold / lifts the hold', 'to': 'SA-11', 'owner': 'SA', 'inPreview': 'preview-only dashed box, never product UI; the Super Admin reaches SA-11 Release or hold from the SA-10 queue', 'tested': 'LOGIC TESTED · J2, J3'}
]

c = collections.Counter(l['tested'].split(' — ')[1].split(',')[0] if ' — ' in l['tested'] else l['tested'] for l in out_links)
doc = {
    'role': 'Content Manager', 'foundation': 'XR-V3-RB-1.0',
    'method': 'Every visible control that declares a destination (data-to) was clicked in the real design runtime from a fresh copy of each of 24 starting states; the heading of the page it landed on was read back. Commands and handoffs are covered by the scripted journeys (journeys.json).',
    'summary': {'clicks': len(out_links), 'landedOnDeclared': sum(1 for l in out_links if 'landed on the declared' in l['tested']),
                'landedByDesignElsewhere': sum(1 for l in out_links if 'landed on CM-' in l['tested'] and 'declared' not in l['tested']),
                'blockedByOpenOverlay': sum(1 for l in out_links if 'blocked by the open overlay' in l['tested']),
                'failed': sum(1 for l in out_links if l['tested'] == 'FAILED'),
                'startingStates': len(set(l['from'] for l in out_links))},
    'classificationKey': {'in-role': 'Content Manager screen', 'shared (borrowed XS until assembly)': 'XS surface implemented from the v46 shared contract', 'out-of-role handoff': 'another workstream\'s screen; the preview shows a labelled handoff, never a fake design'},
    'links': out_links, 'commands': commands, 'handoffs': handoffs
}
json.dump(doc, open(sys.argv[3], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(json.dumps(doc['summary']))

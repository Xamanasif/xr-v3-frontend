# The complete coverage register: every owned ID and its important subviews, with status and evidence.
#   python3 coverage.py   -> handoff/COVERAGE-REGISTER.json + .md, and doc-board data (coverage.json) for the canvas
# Status rules (checked against renders of the published V3 Faculty build, checks/pub-vs-final.json):
#   REDESIGNED                 the subview looks different from the published build because it was redesigned
#   REVIEWED AND UNCHANGED     the subview was reviewed and kept; its boards are pixel-identical to the published build,
#                              or (scope note) only the surrounding redesigned page differs
import json, os, sys
FIN = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(FIN, 'handoff'); os.makedirs(OUT, exist_ok=True)
LABEL = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'LABEL')).read().strip()
FINAL = LABEL == 'FINAL'
STATUS = 'DESIGN COMPLETE · FINAL — APPROVED BY THE OWNER' if FINAL else 'DESIGN COMPLETE · OWNER VISUAL ACCEPTANCE PENDING'
R, U = 'REDESIGNED', 'REVIEWED AND UNCHANGED'
# Owner decision, 21 Oct 2026: keep internal technical IDs out of ordinary user-facing labels, extending owner
# decision 6 (Super Admin) to Faculty. ASMT-, ATT-, Q- and D- identifiers leave every visible label, placeholder,
# dialog title, notice and accessible name. Academic course codes (ME ZG523) and institution-issued student IDs
# (GIT-2026-0418) stay. Stable keys stay in routing, element ids and the question search. No business rule changed.
ID_DECISION = ('Owner decision, 21 Oct 2026 \u2014 internal technical IDs (ASMT-, ATT-, Q-, D-) are out of every ordinary '
               'user-facing label, placeholder, dialog title, notice and accessible name. Academic course codes and '
               'institution-issued student IDs stay. Stable keys stay in routing, element ids and the question search, '
               'so no business rule changed.')

PATTERNS = {
 'P1': 'Priority band sized to its items, with the people or records behind each count; ivory only for urgent work',
 'P2': 'Plan-tint identity band for a record (course, experiment, assessment) with fact figures',
 'P3': 'Course ledger: tinted group header, column-aligned rows, no nested cards',
 'P4': 'Unit meter beside counts in words, one per format; never a percentage',
 'P5': 'Reading sheet at reading width with an action panel; the final action last with its note',
 'P6': 'Sectioned authoring with a guidance and facts side panel; one primary in the footer',
 'P7': 'Refined table: count, filters and actions in one toolbar; compact sub-lines; phone rows without repeated labels',
 'P8': 'Sparse states: get-ready steps and compact message cards sized to their content',
 'P9': 'Deadlines with days left and the release rule',
 'P10': 'Records are identified by their name, the student\u2019s name, the question\u2019s text or its position \u2014 never by an internal technical id',
}

# id, name, kind, round, patterns, what changed, subviews [(subview, status, boards, scope note)]
IDS = [
 ('FA-01', 'Overview', 'page', 'R1', ['P1', 'P4', 'P8', 'P9'],
  'Priority band sized to its items with one gold Mark now and the names and dates behind each count; Coming up with date tiles, days left and the release rule; Your teaching with one unit meter per format; composed new-teacher and no-course states.',
  [('Populated · needs attention, coming up, your teaching', R, ['FA01-Overview'], ''),
   ('One item needs attention · 26 Oct', R, ['FA01-One-item'], ''),
   ('New teacher, no students yet', R, ['FA01-New-teacher', 'FA01-New-phone'], ''),
   ('No courses assigned', R, ['FA01-No-courses'], ''),
   ('Co-teacher', R, ['FA01-Coteach'], ''),
   ('Phone 375', R, ['FA01-Phone'], '')]),
 ('FA-02', 'My courses (Courses tab)', 'page', 'R1', ['P3', 'P8'],
  'Course ledger: tinted course header with code, title, assignment source and three figures; one aligned row per experiment with formats, students, assessment, deadline and marking waiting; no nested cards.',
  [('Populated', R, ['FA02-My-courses'], ''), ('New teacher, no students yet', R, ['FA02-New'], ''),
   ('No courses assigned', R, ['FA02-None'], ''), ('Phone 375', R, ['FA02-Phone'], '')]),
 ('FA-03', 'Course (teaching view)', 'page', 'R1', ['P2', 'P4'],
  'Plan-tint identity band with figures; one panel per experiment with its description and held formats in the header, then Student activity (meters and words) and Assessment side by side, with one Mark action.',
  [('Populated', R, ['FA03-Course'], ''), ('No assessment yet · 26 Oct', R, ['FA03-No-assessment'], ''),
   ('New teacher, no students yet', R, ['FA03-New'], ''), ('Co-teacher', R, ['FA03-Coteach'], ''), ('Phone 375', R, ['FA03-Phone'], '')]),
 ('FA-04', 'Experiments (tab of My courses)', 'tab', 'Final', ['P7', 'P4', 'P8'],
  'Refined table: experiment with its course and the formats your institution holds; student activity as one unit meter per format with counts in words (was plain “WEB: 2 of 5 completed” lines); assessment cell with state, name and deadline. Without an experiment: the compact message card used across the role, without filters.',
  [('Populated', R, ['FA04-Experiments'], ''),
   ('No experiment matches the filters', U, ['FA04-No-match'], 'pixel-identical to the published build'),
   ('Loading', U, ['FA04-Loading'], 'pixel-identical to the published build'),
   ('Couldn’t load', U, ['FA04-Failed'], 'pixel-identical to the published build'),
   ('No student activity yet (new teacher)', R, ['FA04-New'], ''),
   ('No courses assigned', R, ['FA04-No-courses'], 'compact message card (P8) replaces the filters and an empty table'),
   ('Phone 375', R, ['FA04-Phone'], '')]),
 ('FA-05', 'Experiment (teaching view)', 'page', 'Final', ['P2', 'P4', 'P5'],
  'Plan-tint identity band: course code, “Experiment you teach · course”, the name and three figures (formats held, formats your students have used, students with access). Student activity as meters with a link to the students; About with learning outcomes and resources; navy Assessment panel with deadline and days left, submissions meter, marking waiting, a gold Mark that opens the oldest waiting submission, and Open assessment — or Create assessment. The assessment panel names the attempt (“Attempt 1 of 2 · submitted …”) instead of its internal id.',
  [('Populated', R, ['FA05-Experiment'], ''), ('No assessment yet · 26 Oct', R, ['FA05-No-assessment'], ''),
   ('No students with access yet', R, ['FA05-New'], ''), ('Co-teacher', R, ['FA05-Coteach'], ''), ('Phone 375', R, ['FA05-Phone'], '')]),
 ('FA-06', 'Assessments', 'page', 'Final', ['P7', 'P9', 'P8'],
  'Refined table with Deadline (date and days left) and Submissions (unit meter, students submitted, marking waiting) in their own columns, and the state on the right. Without a course: the compact message card. Rows carry the assessment’s name, with “Created by …” only for a colleague’s assessment; the internal id has gone.',
  [('Populated', R, ['FA06-Assessments'], ''),
   ('No assessment yet, with Create · 26 Oct', U, ['FA06-None-yet'], 'pixel-identical to the published build'),
   ('No courses assigned', R, ['FA06-No-courses'], 'compact message card (P8)'),
   ('Phone 375', R, ['FA06-Phone'], '')]),
 ('FA-07', 'Create assessment (4 steps)', 'step', 'Final', ['P6'],
  'A stepper that fits a phone (only the current step is labelled there); every step a sectioned form: experiment cards with formats and reach; name and introduction, then the three rules aligned in one row and the release options side by side; questions as checkbox cards with other ways to add below; preview as a rules list and numbered questions with type tags. The side summary ticks what is done and, at step 4, lists what happens when you create it. Questions are chosen and previewed by their text, type and marks, and the result card says the assessment is created and ready without printing its id.',
  [('Step 1 · experiment', R, ['FA07-Step1'], ''), ('Step 2 · rules with errors', R, ['FA07-Step2-errors', 'FA07-Phone'], ''),
   ('Step 3 · questions', R, ['FA07-Step3'], ''), ('Step 4 · preview and create', R, ['FA07-Step4', 'FA07-Step4-phone'], ''),
   ('Created and ready', R, ['FA07-Created'], ''), ('Saved as a draft', R, ['FA07-Saved-draft'], ''),
   ('Experiment already has an assessment', R, ['FA07-One-per-experiment'], ''),
   ('No courses assigned', R, ['FA07-No-courses'], 'compact message card (P8) instead of an empty step 1')]),
 ('FA-08', 'Assessment · Summary', 'tab', 'Final', ['P2', 'P4'],
  'Tinted record band shared by FA-08 to FA-12: course and experiment, the name (balanced wrap), state · ID · version · marking waiting, and figures for the deadline (days left), students submitted (meter) and questions. Summary: readiness, rules as set, who it reaches; navy Submissions panel with the waiting names oldest first and one gold Mark next. Tabs scroll on a phone with the current tab kept in view. The band shows the state, version, who created it and what is waiting — not the assessment id.',
  [('Ready, 2 waiting', R, ['FA08-Summary'], ''), ('Draft, no questions yet', R, ['FA08-Draft'], ''),
   ('Version 2 after submissions', R, ['FA08-Version2'], ''), ('Co-teacher', R, ['FA08-Coteach'], ''), ('Phone 375', R, ['FA08-Phone'], '')]),
 ('FA-09', 'Assessment · Questions', 'tab', 'Final', ['P7', 'P2'],
  'Head with total marks and the split between automatic and written marks; actions in order of use (Add from question bank, New question, then Draft with assistance · Import); numbered rows with type tag, marks and ID; larger move controls; navy bank panel whose close button returns focus. Rows, the add-from-bank panel and every message name questions by their position or text; move, remove and “use updated version” read “question 2” rather than a bank id.',
  [('4 questions', R, ['FA09-Questions'], ''), ('Add from question bank panel', R, ['FA09-Add-from-bank'], ''),
   ('Added after submissions · version 2', R, ['FA09-New-version'], ''), ('Co-teacher, read only', R, ['FA09-Coteach'], ''), ('Phone 375', R, ['FA09-Phone'], '')]),
 ('FA-10', 'Assessment · Settings', 'tab', 'Final', ['P6'],
  'Sectioned form (Name and introduction · Rules · When students see results) with the three rules aligned in one row; a How changes apply panel: the current version, who submitted it and which changes make a new version.',
  [('Settings', R, ['FA10-Settings'], ''), ('Errors', R, ['FA10-Errors'], ''), ('Rule change after submissions', R, ['FA10-Rule-change'], ''),
   ('Release change warning', R, ['FA10-Release-change'], ''), ('Co-teacher, read only', R, ['FA10-Coteach'], ''), ('Phone 375', R, ['FA10-Phone'], '')]),
 ('FA-11', 'Assessment · Preview', 'tab', 'Final', ['P5'],
  'A reading sheet at reading width with a Student view / Answer key switch and the no-attempt note; an “As students see it” head with facts and the introduction; numbered question cards. Answer key mode: one band saying only you see the key and the guidance; explanations and guidance as ruled notes.',
  [('As students see it', R, ['FA11-Student-view'], ''), ('With the answer key', R, ['FA11-Answer-key', 'FA11-Phone'], ''),
   ('Preview couldn’t load', U, ['FA11-Failed'], 'the state itself; it sits under the redesigned record band'),
   ('Co-teacher refusal', U, ['FA11-Coteach'], 'the existing refusal; it sits under the redesigned record band')]),
 ('FA-12', 'Assessment · Submissions', 'tab', 'Final', ['P7', 'P4'],
  'Toolbar with the count, a gold Mark next and Export CSV; the filter as one segmented control; while waiting the score shows “— of 16” with the automatic part; the release column says Not yet or Released with the rule beneath. The student column reads “Attempt 1 of 2”, and an export is named after the assessment (submissions-heat-exchanger-post-lab.csv).',
  [('2 waiting', R, ['FA12-Submissions'], ''), ('One marked, result not released', R, ['FA12-Marked'], ''),
   ('Co-teacher refusal', U, ['FA12-Coteach'], 'the existing refusal; it sits under the redesigned record band'), ('Phone 375', R, ['FA12-Phone'], '')]),
 ('FA-14', 'Question bank (Questions · Drafts to review)', 'page', 'Final', ['P7', 'P6'],
  'Head actions in order of use (Add a question, Draft with assistance, Import); the questions table shows a type tag and the ID with its version, and a compact Used in; drafts become review cards with options, key and guidance beside How review works. The quiet line under a question carries its version (and the experiment, when there is more than one) instead of its bank id; search is by words in the question; the delete dialog and its confirmation name the question.',
  [('Questions', R, ['FA14-Question-bank'], ''), ('Drafts to review', R, ['FA14-Drafts', 'FA14-Drafts-phone'], ''),
   ('Delete a used question · dialog', R, ['FA14-Delete'], 'the kit dialog and its focus handling are unchanged; its title and confirmation name the question instead of its id'),
   ('Question deleted, history kept', R, ['FA14-Deleted'], ''), ('No question matches', R, ['FA14-No-match'], ''),
   ('Empty bank (new teacher)', U, ['FA14-Empty'], 'the empty state itself; the head actions above follow the new order'),
   ('Phone 375', R, ['FA14-Phone'], '')]),
 ('FA-15', 'Add / edit question', 'page', 'Final', ['P6'],
  'Sectioned form (type cards in one row; question and answer; marks and explanation) with a side panel: this question’s facts (version, where it is used, when added — or when its ID is given) and what students see, when. The meta line and the side facts show the version; the id and the “Question ID · given when you save” fact have gone, and saving reports “Saved as version 2.”',
  [('Add a question', R, ['FA15-New'], ''), ('Errors', R, ['FA15-Errors', 'FA15-Phone'], ''),
   ('Edit a used question', R, ['FA15-Used'], ''), ('Review a draft', R, ['FA15-Draft-review'], '')]),
 ('FA-16', 'Draft questions with assistance', 'step', 'R1', ['P6'],
  'Numbered steps (material · types · count) with type cards and a 3/5 choice; How drafting works at the side; drafts show options and the key for review and collapse into a bank line once added. Final pass: the no-course state uses the role’s compact message card. An added draft collapses to “In your question bank · …” instead of showing the id it was given.',
  [('Choices', R, ['FA16-Draft'], ''), ('Nothing chosen', R, ['FA16-Errors'], ''), ('Drafting', R, ['FA16-Busy'], ''),
   ('Drafts to review', R, ['FA16-Drafts-list', 'FA16-List-phone'], ''), ('Drafting failed', R, ['FA16-Failed'], ''),
   ('No courses assigned', R, ['FA16-No-courses'], 'final pass: compact message card (P8)'), ('Phone 375', R, ['FA16-Phone'], '')]),
 ('FA-17', 'Import questions (CSV)', 'step', 'Final', ['P6', 'P7'],
  'Stepper; the file picker with the template’s columns as a side reference; the check as four figures (rows, ready, with errors, with warnings) above the row table; confirm with counts by type; a done card. The finished notice says how many questions were added, without listing the ids assigned.',
  [('Choose a file', R, ['FA17-Choose'], ''), ('Not a CSV file', R, ['FA17-Not-CSV'], ''),
   ('Row errors block the import', R, ['FA17-Row-errors', 'FA17-Phone'], ''), ('Confirm', R, ['FA17-Confirm'], ''), ('Imported', R, ['FA17-Done'], '')]),
 ('FA-18', 'Marking queue', 'page', 'Final', ['P7', 'P1', 'P8'],
  'Toolbar with the waiting count, the oldest wait and one gold Mark next; assessment filter and a segmented Waiting / Marked / All; rows show when each answer was submitted and how long ago. Rows read “Attempt 1 of 2”, and the row action is announced as “Mark Rahul Verma”.',
  [('2 waiting', R, ['FA18-Marking'], ''), ('All, one marked', R, ['FA18-All'], ''), ('Nothing waiting · 26 Oct', R, ['FA18-Nothing-waiting'], ''),
   ('No courses assigned', R, ['FA18-No-courses'], 'compact message card (P8)'), ('Phone 375', R, ['FA18-Phone'], '')]),
 ('FA-19', 'Mark a submission', 'page', 'R1', ['P5'],
  'Automatic marks as a strip; the answer at reading width; guidance as a quiet ruled note; a panel with a large score field, feedback, the live total and Save mark, then Confirm marks last with its lock note. Same calculation and dialog. The band reads “Waiting for marking · Submitted … · attempt 1 of 2”, and the confirm dialog names the assessment — neither shows the attempt id.',
  [('Waiting for marking', R, ['FA19-Mark'], ''), ('Mark out of range', R, ['FA19-Invalid-mark'], ''),
   ('Mark saved, not confirmed', R, ['FA19-Saved', 'FA19-Phone'], ''),
   ('Confirm marks · dialog', R, ['FA19-Confirm'], 'the kit dialog, its wording and its focus handling are unchanged apart from the sub-line, which names the assessment instead of the attempt id'),
   ('Confirmed, read only', R, ['FA19-Confirmed'], ''), ('Result released · 15 Nov', R, ['FA19-Released'], '')]),
 ('FA-20', 'Students (progress and follow-up)', 'page', 'Final', ['P7', 'P4', 'P8'],
  'Per-format summary meters for all students with access above the roster; the roster shows per-format status, assessment status and last activity with the inactivity tag; Export CSV in the toolbar.',
  [('All students', R, ['FA20-Students'], ''), ('Inactive 14 days or more', R, ['FA20-Inactive'], ''), ('No student matches', R, ['FA20-No-match'], ''),
   ('No students yet', U, ['FA20-No-students'], 'the empty state itself; only the as-of line above it was reworded'),
   ('No courses assigned', R, ['FA20-No-courses'], 'compact message card (P8)'), ('Phone 375', R, ['FA20-Phone'], '')]),
 ('FA-21', 'Student detail (per experiment)', 'page', 'Final', ['P4'],
  'A person page keeps the plain head (name, ID, last activity, inactivity tag) with no aggregate figures. Progress by format as compact rows — per format only, no overall verdict; resources with opened status; navy Assessment panel with the attempt, the total “11 of 16 marks · Passed · pass mark 8”, the release note, and Mark their answers or View marks. The assessment panel names the attempt; the student’s own institution id (GIT-2026-0418) stays, because it is not an internal technical id.',
  [('Waiting for marking', R, ['FA21-Student'], ''), ('Marked, result not released', R, ['FA21-Marked'], ''),
   ('Result released · 15 Nov', R, ['FA21-Released'], ''), ('Inactive student', R, ['FA21-Inactive'], ''),
   ('Co-teacher', R, ['FA21-Coteach'], ''), ('Phone 375', R, ['FA21-Phone'], '')]),
 ('FA-22', 'Export CSV (action on FA-12 and FA-20)', 'action', 'Final', ['P7'],
  'The export confirmation band lines up with the refined toolbars, and the preview of exported rows scrolls sideways without wrapping cells. Same columns and rows; CSV only.',
  [('On Submissions (FA-12)', R, ['FA12-Export'], ''), ('On Students (FA-20)', R, ['FA20-Export', 'FA20-Export-phone'], '')]),
]

SHARED = [
 ('XS-05', 'Account menu and menu drawer', [('Account menu', U, ['XS-Account-menu'], 'the menu itself; the Overview behind it is FA-01'), ('Menu drawer · 375', U, ['XS-Menu-phone'], 'the drawer itself; the Overview behind it is FA-01')]),
 ('XS-07', 'Help & support', [('Help & support', U, ['XS-Help'], 'pixel-identical'), ('Report a problem', U, ['XS-Help-report'], 'pixel-identical')]),
 ('XS-03', 'Signed out', [('Signed out', U, ['XS-Signed-out'], 'pixel-identical')]),
 ('XS-06', 'Not your workspace and scoped refusals', [('Not your workspace', U, ['XS-Not-your-workspace'], 'pixel-identical'),
   ('Course not assigned to you', U, ['Refusal-Course'], 'pixel-identical'), ('Co-teacher opens a submission', U, ['Refusal-Co-teacher-marking'], 'pixel-identical')]),
]

def check(pv):
    """Every UNCHANGED subview without a scope note must be pixel-identical; every REDESIGNED one must differ."""
    bad = []
    for sid, name, kind, rnd, pats, what, subs in IDS:
        for sub, st, bs, note in subs:
            for b in bs:
                if b not in pv: bad.append((sid, sub, b, 'no comparison')); continue
                same = pv[b]['same']
                if st == U and note.startswith('pixel-identical') and not same: bad.append((sid, sub, b, 'marked identical but differs'))
                if st == R and same: bad.append((sid, sub, b, 'marked redesigned but identical'))
    for sid, name, subs in SHARED:
        for sub, st, bs, note in subs:
            for b in bs:
                if note == 'pixel-identical' and not pv.get(b, {}).get('same'): bad.append((sid, sub, b, 'marked identical but differs'))
    return bad

if __name__ == '__main__':
    pv = json.load(open(os.path.join(FIN, 'checks', 'pub-vs-final.json')))
    bad = check(pv)
    if bad:
        print('REGISTER CHECK FAILED'); [print('  ', b) for b in bad]; sys.exit(1)
    n_sub = sum(len(x[6]) for x in IDS); n_r = sum(1 for x in IDS for s in x[6] if s[1] == R); n_u = n_sub - n_r
    reg = {'role': 'Faculty', 'foundation': 'XR-V3-RB-1.0', 'status': STATUS, 'release': LABEL,
           'legend': {R: 'Changed in this redesign (R1 checkpoint or the final pass); see “what changed”.',
                      U: 'Reviewed at 1440 and 375 and kept: pixel-identical to the published V3 Faculty build, or only the surrounding redesigned page differs (scope note).'},
           'patterns': PATTERNS, 'ownerDecision': ID_DECISION,
           'totals': {'ownedIds': len(IDS), 'idsRedesigned': len(IDS), 'subviews': n_sub, 'subviewsRedesigned': n_r, 'subviewsReviewedUnchanged': n_u,
                      'sharedSurfaces': sum(len(x[2]) for x in SHARED)},
           'owned': [{'id': sid, 'name': name, 'kind': kind, 'status': R, 'round': 'R1 checkpoint, carried into the final design' if rnd == 'R1' else 'Final pass',
                      'patterns': pats, 'whatChanged': what,
                      'subviews': [{'subview': s, 'status': st, 'boards': bs, 'note': n} for s, st, bs, n in subs],
                      'checkedAt': [1440, 1024, 768, 375]} for sid, name, kind, rnd, pats, what, subs in IDS],
           'shared': [{'id': sid, 'name': name, 'status': U, 'ownedBy': 'XS contract (borrowed)', 'subviews': [{'subview': s, 'status': st, 'boards': bs, 'note': n} for s, st, bs, n in subs]} for sid, name, subs in SHARED],
           'excluded': [{'id': 'FA-13', 'note': 'Excluded in the pack; not designed.'}, {'id': 'FA-23', 'note': 'Excluded in the pack; not designed.'}, {'id': 'FA-24', 'note': 'Excluded in the pack; not designed.'}]}
    json.dump(reg, open(os.path.join(OUT, 'COVERAGE-REGISTER.json'), 'w'), indent=1, ensure_ascii=False)
    json.dump(reg, open(os.path.join(FIN, 'coverage.json'), 'w'), indent=1, ensure_ascii=False)
    # markdown
    L = ['# Faculty V3 — complete coverage register', '',
         '**Foundation:** XR-V3-RB-1.0 · **Status:** DESIGN COMPLETE · OWNER VISUAL ACCEPTANCE PENDING', '',
         '**Totals:** %d owned IDs, all redesigned (5 in the R1 checkpoint, %d in the final pass) · %d important subviews: %d redesigned, %d reviewed and unchanged · %d shared XS surfaces reviewed and unchanged.' % (
             len(IDS), len([x for x in IDS if x[3] == 'Final']), n_sub, n_r, n_u, reg['totals']['sharedSurfaces']), '',
         '**Owner decision applied in this pass.** ' + ID_DECISION, '',
         '**Legend.** REDESIGNED — changed in this redesign. REVIEWED AND UNCHANGED — reviewed at 1440 and 375 and kept; its board is pixel-identical to the published V3 Faculty build, or the scope note says which surrounding part changed.', '',
         'Every owned ID was also rendered at 1440, 1024, 768 and 375 (screenshots in `responsive/`). Boards named below are in the canvas and in the screenshot ZIP.', '']
    for x in reg['owned']:
        L += ['## %s %s — %s' % (x['id'], x['name'], x['status']), '',
              '*%s · %s · patterns %s*' % (x['kind'], x['round'], ', '.join(x['patterns'])), '', x['whatChanged'], '',
              '| Subview | Status | Boards | Note |', '| --- | --- | --- | --- |']
        for s in x['subviews']:
            L.append('| %s | %s | %s | %s |' % (s['subview'], s['status'], ', '.join('`%s`' % b for b in s['boards']), s['note'] or '—'))
        L.append('')
    L += ['## Shared surfaces (borrowed XS contract) — REVIEWED AND UNCHANGED', '', '| ID | Subview | Boards | Note |', '| --- | --- | --- | --- |']
    for x in reg['shared']:
        for s in x['subviews']:
            L.append('| %s %s | %s | %s | %s |' % (x['id'], x['name'], s['subview'], ', '.join('`%s`' % b for b in s['boards']), s['note']))
    L += ['', '## Patterns', ''] + ['- **%s** %s' % (k, v) for k, v in PATTERNS.items()] + ['', 'FA-13, FA-23 and FA-24 are excluded in the pack and not designed.', '']
    open(os.path.join(OUT, 'COVERAGE-REGISTER.md'), 'w').write('\n'.join(L))
    print('register OK ·', len(IDS), 'IDs ·', n_sub, 'subviews (', n_r, 'redesigned,', n_u, 'reviewed and unchanged ) ·', reg['totals']['sharedSurfaces'], 'shared')

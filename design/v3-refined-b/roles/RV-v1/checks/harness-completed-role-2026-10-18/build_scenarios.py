#!/usr/bin/env python3
"""Assemble SCENARIOS.json: the fixture snapshot extracted verbatim from project/RV.dc.html
(extract_fixtures.js) plus hand-written provenance. usage: build_scenarios.py fixtures.json OUT.json"""
import json, sys

fx = json.load(open(sys.argv[1]))

RECORD_SOURCES = {
    'SUB-0086': {'sources': ['B6-01', 'B6-02', 'B6-03', 'B6-11'], 'notes': 'Oldest waiting item. No learning outcomes yet, so Approve is refused until one is added (B6-11 state; OD-B6-02).'},
    'SUB-0071': {'sources': ['B6-01', 'B6-02', 'B6-03', 'B6-11'], 'notes': 'Re-check sent back by the Content Manager on 25 Aug 2026, 10:42, with her reason (the Pitot-tube outcome).'},
    'UPD-0005': {'sources': ['B6-01', 'B6-02', 'B6-04', 'B6-13', 'B7-11'], 'notes': 'Correction 1.2 → 1.3 in academic review. Comparison, reason, history and the sample return text come from B6-04.'},
    'SUB-0077': {'sources': ['B6-01', 'B6-02', 'B6-03', 'B6-12'], 'notes': 'Resubmitted as revision 2 on 26 Aug 2026 after the reviewer returned revision 1 on 19 Aug 2026. Approval at 15:20 is the B6-12 sample time.'},
    'SUB-0074': {'sources': ['B6-02', 'B6-03'], 'notes': 'Decided (approved 14 Aug 2026, 15:10), with the Content Manager. Used for RV-06.'},
    'SUB-0081': {'sources': ['B6-02'], 'notes': 'Decided (returned 24 Aug 2026) with reason and two references. Partial: only list-level facts exist, so the decided page shows no description or delivery.'},
    'SUB-0070': {'sources': ['B6-02', 'B6-11'], 'notes': 'Decided (approved 21 Aug 2026). Outcome count conflicts between sources; the outcome list is omitted.'},
    'SUB-0052': {'sources': ['B6-02', 'B6-12'], 'notes': 'Approved 24 Jul 2026, published by the Content Manager on 30 Jul 2026. Partial.'},
    'UPD-0004': {'sources': ['B6-02', 'B7-11'], 'notes': 'Update approved 14 Aug 2026; B7-11 puts it on hold on 20 Aug 2026. The reviewer sees only "with the Super Admin" (audience filtering; v46 reviewer list wording). Partial.'},
    'UPD-0003': {'sources': ['B6-02'], 'notes': 'Update approved 30 Jul 2026, released 5 Aug 2026; version 1.1 is live. Partial.'},
    'UPD-0006': {'sources': ['B6-02'], 'notes': 'EEE ZC341 is outside the 27 Aug scope (OD-B7-15). Kept in the fixtures but filtered out of every list; opening it gives the out-of-scope refusal.'},
}

out = {
    'about': 'Explicit fixture snapshots for the Academic Reviewer design, with provenance. They are illustrative design scenarios, not canonical application data or service contracts. The React app keeps its current shared world; where it differs, keep the app\'s facts and reproduce the layout (common/03).',
    'fixtureSource': 'project/RV.dc.html, class Component static getters COURSES, SCOPES, TIMES, REC, RB and REFS, extracted verbatim by checks/harness/extract_fixtures.js',
    'scenarios': [
        {'scenarioId': 'rv-2026-08-27', 'asOf': '2026-08-27', 'label': 'Main sample world, Thursday 27 August 2026',
         'persona': {'name': 'Prof. A. Menon', 'role': 'Academic Reviewer', 'initials': 'AM'},
         'scope': fx['SCOPES']['full'],
         'source': 'v46 Batch 6 sample world as embedded in B6-01, B6-02, B6-03, B6-04, B6-11, B6-12, B6-13 and B7-11',
         'usedBy': 'every board not listed under another scenario'},
        {'scenarioId': 'rv-2026-08-27-che-withdrawn', 'asOf': '2026-08-27', 'label': 'CHE ZG513 removed from the reviewer\'s scope',
         'difference': 'scope = ' + ' · '.join(fx['SCOPES']['che-withdrawn']) + '; CHE ZG513 items leave the queue and the Course filter',
         'basis': 'Phase-6 report §5 (reported implementation behaviour): withdrawing a reviewer\'s scope removes the experiment from their queue; restoring it brings it back. Not a v46 board.',
         'illustrative': True, 'usedBy': ['RV-scope-withdrawn.dc.html']},
        {'scenarioId': 'rv-calm', 'asOf': '2026-08-27', 'label': 'Nothing waiting',
         'difference': 'the queue is empty (presentation preset; records unchanged)', 'basis': 'v46 B6-01 and B6-02 calm and empty states',
         'usedBy': ['RV01-calm.dc.html', 'RV02-empty.dc.html']},
        {'scenarioId': 'rv-first-time', 'asOf': '2026-08-27', 'label': 'A reviewer who has not decided anything yet',
         'difference': 'Reviewed by me is empty (presentation preset)', 'basis': 'v46 B6-02 empty state', 'usedBy': ['RV05-empty.dc.html']},
        {'scenarioId': 'rv-2026-08-27-stale', 'asOf': '2026-08-27', 'label': 'UPD-0005 withdrawn by the Content Manager while the reviewer has it open',
         'difference': 'the next decision is refused and nothing is recorded; the page re-reads and shows "Withdrawn by the Content Manager" without a reason; the update leaves the queue; Reviewed by me is unchanged',
         'basis': 'Phase-6 report: a stale decision is refused and the page re-reads; every correction command checks the revision. OD-B6-06: the Content Manager may withdraw an update while it is in academic review. The withdrawal reason is withheld from the reviewer (Phase-6 H-2).',
         'illustrative': True, 'usedBy': ['RV04-stale-armed.dc.html', 'RV04-stale.dc.html']},
        {'scenarioId': 'rv-2026-08-27-elsewhere', 'asOf': '2026-08-27', 'label': 'SUB-0077 already approved in another window at 15:20',
         'difference': 'a second attempt records nothing new; the page shows the existing decision read-only',
         'basis': 'repeated-command protection (common/03); illustrative copy', 'illustrative': True, 'usedBy': ['RV06-elsewhere.dc.html']},
        {'scenarioId': 'rv-draft-withdrawn', 'asOf': '2026-08-27', 'label': 'A draft withdrawn before it was ever sent',
         'difference': 'no record data at all: "This item isn\'t available to you"',
         'basis': 'Phase-6 report M-1 (rule UPD-16): a draft withdrawn before it was ever sent is hidden from the reviewer', 'usedBy': ['RV-unavailable.dc.html']},
        {'scenarioId': 'rv-out-of-scope', 'asOf': '2026-08-27', 'label': 'UPD-0006 (EEE ZC341) opened by its address',
         'difference': 'EEE ZC341 is not in the 27 Aug scope: refusal, nothing of the record shown',
         'basis': 'effective-scope rule (brief: revoked scope is not readable); OD-B7-15', 'usedBy': ['RV-scope.dc.html', 'RV-scope-375.dc.html']},
    ],
    'presentationPresets': {
        'about': 'Inspection-board starting states. They change what the board shows first, never the records.',
        'list': {'filtered': 'queue: search "dist" + course CHE ZG513 · Reviewed by me: Show updates', 'nomatch': 'search "Heat exchanger"', 'loading': 'skeleton rows', 'failed': 'failed to load with Try again', 'empty': 'nothing waiting / nothing decided'},
        'item': ['approve-blocked', 'return-errors', 'return-filled', 'confirm', 'approved', 'returned', 'deleted', 'editing', 'package-open', 'stale-armed', 'stale', 'elsewhere'],
        'other': ['overlay: drawer, account', 'help: errors, sent', 'view: signedout'],
    },
    'fixtures': {
        'courses': fx['COURSES'],
        'scopes': fx['SCOPES'],
        'decisionClock': {'times': fx['TIMES'], 'provenance': 'the first three are v46 sample times (B6-04, B6-12); later ones are illustrative'},
        'records': {k: dict(v, provenance=RECORD_SOURCES.get(k)) for k, v in fx['REC'].items()},
        'reviewedByMe': {'rows': fx['RB'], 'provenance': 'v46 B6-02 (newest first). Rows outside the effective scope are filtered out (UPD-0006), so the list shows 8.'},
        'returnReferences': {'options': fx['REFS'], 'provenance': 'v46 B6-11 state 2 and OD-B5-10; offered only for the submission\'s own formats and only on submission returns'},
    },
    'illustrativeAdditions': [
        {'what': 'SUB-0077 revision-2 return reason: "Please say which standalone headsets the VR build runs on, so institutions can check their devices." with references VR · Device need and VR · Install notes', 'where': 'RV03-return-filled, RV03-returned and the live preview', 'why': 'v46 only returns revision 1; the return path on the corrected scenario needs a sample reason'},
        {'what': 'Decision clock after the first three times: 16:10, 16:45, 17:20 on 27 Aug 2026', 'where': 'live preview', 'why': 'the preview can record more decisions than v46 timed'},
        {'what': 'Help & support report reference SUP-0214', 'where': 'RV-report-sent and the live preview', 'why': 'v46 uses SUP-0213 for two different reports; a new number collides with neither'},
        {'what': 'Refusal copy for "decided in another window" and "withdrawn after you opened it"', 'where': 'RV06-elsewhere, RV04-stale', 'why': 'the brief requires already-decided and stale-version refusals; v46 has no board for them'},
        {'what': 'CHE ZG513 scope-removed variant', 'where': 'RV-scope-withdrawn', 'why': 'demonstrates revoked scope from reported Phase-6 behaviour'},
    ],
    'conflictsAndOmissions': [
        {'id': 'OD-B7-15', 'what': 'UPD-0006 (EEE ZC341) is in v46\'s Reviewed by me, but EEE ZC341 is not on the 27 Aug scope line; Batch 7 records that scope withdrawn on 1 Oct 2026.', 'treatment': 'left out of Reviewed by me (8 decisions, not 9) and used as the out-of-scope refusal; still present in the fixtures, filtered by scope', 'ownerDecision': 'confirm'},
        {'id': 'SUB-0070 outcomes', 'what': 'v46 queue data gives 3 learning outcomes; B6-11 shows none.', 'treatment': 'the decided page omits the outcome list and count', 'ownerDecision': 'confirm'},
        {'id': 'Partial records', 'what': 'SUB-0081, SUB-0070, SUB-0052, UPD-0004, UPD-0003 and UPD-0006 have only list-level facts in v46.', 'treatment': 'decided pages show only known facts; nothing invented'},
        {'id': 'UPD-0004 hold', 'what': 'B7-11 puts UPD-0004 on hold on 20 Aug 2026.', 'treatment': 'the reviewer sees "Update approved — with the Super Admin" as in v46\'s reviewer list; no hold status or reason (audience filtering)'},
        {'id': 'OD-B6-12', 'what': 'v46 B6-12 publishes SUB-0077 on 28 Aug 2026.', 'treatment': 'outside this scenario (asOf 27 Aug); approval only sends it to the Content Manager'},
    ],
    'handoffs': [
        {'direction': 'outbound', 'trigger': 'Return a submission (RV-03)', 'to': 'Vendor', 'effect': 'Submission status Returned; the vendor sees the reason and the field references above their editor (VE-07, VE-08); a resubmission returns to the reviewer as the next revision (PC-66)'},
        {'direction': 'outbound', 'trigger': 'Approve a submission or re-check (RV-03)', 'to': 'Content Manager', 'effect': 'Submission status With Content Manager, carrying the reviewer\'s outcome set; first publication is the Content Manager\'s decision; publishing grants no access'},
        {'direction': 'outbound', 'trigger': 'Approve an update (RV-04)', 'to': 'Super Admin', 'effect': 'Update status Awaiting release decision; the live version is unchanged until the Super Admin releases (SA-10, SA-11); releasing grants no access'},
        {'direction': 'outbound', 'trigger': 'Return an update (RV-04)', 'to': 'Content Manager', 'effect': 'Update status Returned; the correction is editable again with the reason shown first (CM-08); no field references (T-28)'},
        {'direction': 'inbound', 'trigger': 'Content Manager sends a submission back for a re-check', 'effect': 'queue row Re-check with her reason first (SUB-0071)'},
        {'direction': 'inbound', 'trigger': 'Content Manager sends an update for academic review', 'effect': 'queue row Update (UPD-0005)'},
        {'direction': 'inbound', 'trigger': 'Vendor resubmits', 'effect': 'queue row Resubmitted · revision 2, with what changed (SUB-0077)'},
        {'direction': 'inbound', 'trigger': 'Content Manager withdraws an update in academic review', 'effect': 'it leaves the queue; an open page refuses the next decision (stale)'},
        {'direction': 'inbound', 'trigger': 'Super Admin withdraws or restores a reviewer scope', 'effect': 'that course\'s items leave or return to the queue'},
    ],
    'liveAcrossCanvases': False,
}
json.dump(out, open(sys.argv[2], 'w'), indent=1, ensure_ascii=False)
print('records', len(out['fixtures']['records']), 'scenarios', len(out['scenarios']))

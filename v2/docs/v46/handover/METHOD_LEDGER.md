# Method ledger — 22 product ports, 183 methods, 6 stand-in ports (WP-0.16)

Snapshot of `METHOD_LEDGER` (`packages/contracts/src/draft/ledger/`), read from the built package at the
WP-0.16 handover. The code is the authority: every entry is checked against its port signature at
compile time, and `ledger.test.ts` checks the counts, the Appendix F §4.1 schedule (plus the one
recorded exception) and the cross-references. "Implemented" = the sample world (`@xr/sample-platform`)
implements it and the contract suite exercises it; "deferred" = it is typed (signature, zod DTOs,
errors) but its mock arrives with the phase named. `screenPhase` is the phase that builds the first
screen calling it (B8-06).

## Counts

| | Count |
|---|---|
| Product ports | 22 |
| Product methods | 183 (command 84, read 94, preview 5) |
| Implemented in Phase 0 (WP-0.11) | 139 (incl. the owner-authorised early `ProductionService.listAllContent`, E-alt3) |
| Deferred | 44: Phase 1 4, Phase 2 9, Phase 3 1, Phase 4 14, Phase 5 7, Phase 6 9 |
| Stand-in ports (test / seed only) | 6 ports, 8 methods, all WP-0.11 |

| Check | Result |
|---|---|
| 22 product ports | PASS |
| 183 product methods | PASS (183) |
| 139 implemented in the sample world (WP-0.11) | PASS (139) |
| 44 deferred to Phases 1–6 | PASS (44) |
| listAllContent implemented early (E-alt3), the only schedule exception | PASS |
| 6 stand-in ports, 8 methods | PASS |

Schedule exception (owner, 13 Oct 2026): `ProductionService.listAllContent` P6 → WP-0.11. The existing WP-0.10 signature, the current domain policy (canRead SUB-37 for submissions, EXP-03 for published experiments, UPD-18 / UPD-26 for the open correction it names) and the Super Admin read-only permission; no new permission, no Phase-6 screen, no other deferred Phase-6 method.

One deferred method's mock phase is later than its first screen's phase: `OperationsService.getSuperAdminOverview`
(Appendix F §4.1 schedules it for Phase 6, the full SA-01 overview; SA-01's Phase-1 part is its requests group,
Appendix F §9). Phase 1 should confirm that the requests group needs no overview figures; if it does, the
method moves by an owner-recorded schedule exception, as `listAllContent` did.

## By port

| Port | Methods | Implemented | Deferred (phase) |
|---|---|---|---|
| SessionService | 4 | 4 | — |
| CatalogueService | 5 | 2 | listAreas (P1), getArea (P1), getCourse (P1) |
| SelectionService | 5 | 5 | — |
| AccessRequestService | 12 | 12 | — |
| InstitutionService | 9 | 7 | listInstitutions (P1), getMyOverview (P2) |
| PeopleService | 10 | 6 | listStudents (P2), previewStudentImport (P2), listFaculty (P2), getFaculty (P2) |
| GroupService | 6 | 4 | listGroups (P2), getGroup (P2) |
| FacultyCourseService | 4 | 3 | list (P2) |
| InstitutionCourseCodeService | 2 | 1 | list (P2) |
| StudentAccessService | 9 | 9 | — |
| LearningService | 6 | 5 | getSimulationChooser (P3) |
| FeedbackService | 2 | 2 | — |
| AssessmentService | 16 | 12 | listAssessments (P4), getCreateOptions (P4), previewAsStudent (P4), exportSubmissionsCsv (P4) |
| QuestionBankService | 11 | 5 | requestDrafts (P4), listDrafts (P4), addDraftToBank (P4), discardDraft (P4), previewQuestionImport (P4), commitQuestionImport (P4) |
| MarkingService | 4 | 4 | — |
| TeachingService | 6 | 2 | getFacultyOverview (P4), listMyCourses (P4), getTeachingExperiment (P4), exportStudentsCsv (P4) |
| ProductionService | 24 | 18 | getVendorOverview (P5), listMyExperiments (P5), getEditor (P5), getReviewerOverview (P5), getContentManagerOverview (P5), getLibrary (P5) |
| CorrectionService | 15 | 13 | listUpdates (P6), listUpdatesForRelease (P6) |
| AcademicStructureService | 9 | 7 | getArea (P6), getCourse (P6) |
| PlatformCourseCodeService | 2 | 1 | list (P5) |
| PlatformRoleService | 6 | 4 | listHolders (P6), getHolder (P6) |
| OperationsService | 16 | 13 | listSupportReports (P6), listAccessEnding (P6), getSuperAdminOverview (P6) |

## Deferred methods (44) — the phase that implements each

| Method | Kind | Mock phase | First screen phase | Screens | Open decisions it may reach |
|---|---|---|---|---|---|
| `CatalogueService.listAreas` | read | P1 | P1 | PU-01, PU-02 | — |
| `CatalogueService.getArea` | read | P1 | P1 | PU-02, PU-03 | — |
| `CatalogueService.getCourse` | read | P1 | P1 | PU-03, PU-05 | — |
| `InstitutionService.listInstitutions` | read | P1 | P1 | SA-06 | — |
| `InstitutionService.getMyOverview` | read | P2 | P2 | IA-01 | — |
| `PeopleService.listStudents` | read | P2 | P2 | IA-06 | — |
| `PeopleService.previewStudentImport` | preview | P2 | P2 | IA-11 | — |
| `PeopleService.listFaculty` | read | P2 | P2 | IA-08 | — |
| `PeopleService.getFaculty` | read | P2 | P2 | IA-09 | — |
| `GroupService.listGroups` | read | P2 | P2 | IA-13 | — |
| `GroupService.getGroup` | read | P2 | P2 | IA-14 | — |
| `FacultyCourseService.list` | read | P2 | P2 | IA-15 | — |
| `InstitutionCourseCodeService.list` | read | P2 | P2 | IA-16 | — |
| `LearningService.getSimulationChooser` | read | P3 | P3 | ST-07 | OD-B2-01, OD-B2-02, GRP-05, SACC-14, not-designed:format-temporarily-unavailable |
| `AssessmentService.listAssessments` | read | P4 | P4 | FA-06 | — |
| `AssessmentService.getCreateOptions` | read | P4 | P4 | FA-07 | — |
| `AssessmentService.previewAsStudent` | read | P4 | P4 | FA-11 | — |
| `AssessmentService.exportSubmissionsCsv` | read | P4 | P4 | FA-12, FA-22 | — |
| `QuestionBankService.requestDrafts` | command | P4 | P4 | FA-16 | — |
| `QuestionBankService.listDrafts` | read | P4 | P4 | FA-14 | — |
| `QuestionBankService.addDraftToBank` | command | P4 | P4 | FA-16 | — |
| `QuestionBankService.discardDraft` | command | P4 | P4 | FA-16 | — |
| `QuestionBankService.previewQuestionImport` | preview | P4 | P4 | FA-17 | — |
| `QuestionBankService.commitQuestionImport` | command | P4 | P4 | FA-17 | — |
| `TeachingService.getFacultyOverview` | read | P4 | P4 | FA-01 | — |
| `TeachingService.listMyCourses` | read | P4 | P4 | FA-02 | — |
| `TeachingService.getTeachingExperiment` | read | P4 | P4 | FA-05 | — |
| `TeachingService.exportStudentsCsv` | read | P4 | P4 | FA-22 | — |
| `ProductionService.getVendorOverview` | read | P5 | P5 | VE-01 | — |
| `ProductionService.listMyExperiments` | read | P5 | P5 | VE-02 | ROLE-11, SUB-15 |
| `ProductionService.getEditor` | read | P5 | P5 | VE-03, VE-04, VE-05, VE-06 | ROLE-11, SUB-15 |
| `ProductionService.getReviewerOverview` | read | P5 | P5 | RV-01 | — |
| `ProductionService.getContentManagerOverview` | read | P5 | P5 | CM-01 | — |
| `ProductionService.getLibrary` | read | P5 | P5 | CM-04 | — |
| `CorrectionService.listUpdates` | read | P6 | P6 | CM-08 | — |
| `CorrectionService.listUpdatesForRelease` | read | P6 | P6 | SA-10 | — |
| `AcademicStructureService.getArea` | read | P6 | P6 | SA-15 | — |
| `AcademicStructureService.getCourse` | read | P6 | P6 | SA-15 | — |
| `PlatformCourseCodeService.list` | read | P5 | P5 | CM-09 | — |
| `PlatformRoleService.listHolders` | read | P6 | P6 | SA-16 | — |
| `PlatformRoleService.getHolder` | read | P6 | P6 | SA-17 | — |
| `OperationsService.listSupportReports` | read | P6 | P6 | SA-20 | — |
| `OperationsService.listAccessEnding` | read | P6 | P6 | SA-22 | — |
| `OperationsService.getSuperAdminOverview` | read | P6 | P1 | SA-01 | — |

## Implemented methods (139)

| Method | Kind | First screen phase | Screens | Open decisions it may reach (answered `policy-open`) |
|---|---|---|---|---|
| `SessionService.signIn` | command | P1 | XS-01 | T-10, SES-09 |
| `SessionService.getSession` | read | P0 | XS-05, XS-08 | — |
| `SessionService.signOut` | command | P0 | XS-05 | — |
| `SessionService.checkWorkspace` | read | P0 | XS-06 | — |
| `CatalogueService.searchCatalogue` | read | P1 | PU-04 | — |
| `CatalogueService.getExperiment` | read | P0 | PU-06, PU-15 | — |
| `SelectionService.get` | read | P1 | PU-06, PU-07 | — |
| `SelectionService.add` | command | P1 | PU-06 | — |
| `SelectionService.setFormats` | command | P1 | PU-07 | — |
| `SelectionService.remove` | command | P1 | PU-07 | — |
| `SelectionService.undoRemove` | command | P1 | PU-07 | — |
| `AccessRequestService.submitPublicRequest` | command | P1 | PU-08, PU-09 | — |
| `AccessRequestService.getRequestStatus` | read | P1 | PU-10, PU-13 | T-01 |
| `AccessRequestService.startPayment` | command | P1 | PU-12, IA-17 | — |
| `AccessRequestService.listInstitutionRequests` | read | P3 | IA-17 | — |
| `AccessRequestService.getInstitutionRequest` | read | P3 | IA-17 | — |
| `AccessRequestService.submitRenewalRequest` | command | P3 | IA-17 | T-07 |
| `AccessRequestService.submitAdditionalLicencesRequest` | command | P3 | IA-17 | — |
| `AccessRequestService.listRequests` | read | P1 | SA-02, SA-01 | — |
| `AccessRequestService.getRequestForDecision` | read | P1 | SA-03 | — |
| `AccessRequestService.approveRequest` | command | P1 | SA-03 | T-03 |
| `AccessRequestService.approveSmallerScope` | command | P1 | SA-03 | REQ-19, T-03 |
| `AccessRequestService.requestMoreInformation` | command | P1 | SA-03 | T-03 |
| `InstitutionService.getInstitution` | read | P1 | SA-07 | — |
| `InstitutionService.assignInstituteAdmin` | command | P1 | SA-07 | INST-06 |
| `InstitutionService.pauseInstitution` | command | P1 | SA-07 | — |
| `InstitutionService.restoreInstitution` | command | P1 | SA-07 | — |
| `InstitutionService.overrideStudentStatus` | command | P1 | SA-07 | — |
| `InstitutionService.listContentAccess` | read | P2 | IA-02 | — |
| `InstitutionService.getAccessPlan` | read | P2 | IA-03 | — |
| `PeopleService.getStudent` | read | P2 | IA-07 | — |
| `PeopleService.addStudent` | command | P2 | IA-10 | — |
| `PeopleService.addFaculty` | command | P2 | IA-10 | — |
| `PeopleService.commitStudentImport` | command | P2 | IA-11 | — |
| `PeopleService.deactivateStudent` | command | P2 | IA-07 | PER-07 |
| `PeopleService.reactivateStudent` | command | P2 | IA-07 | PER-07 |
| `GroupService.createGroup` | command | P2 | IA-13 | — |
| `GroupService.renameGroup` | command | P2 | IA-13 | — |
| `GroupService.addMembers` | command | P2 | IA-14 | — |
| `GroupService.removeMember` | command | P2 | IA-14 | — |
| `FacultyCourseService.assign` | command | P2 | IA-15 | — |
| `FacultyCourseService.previewRemoval` | read | P2 | IA-15 | — |
| `FacultyCourseService.remove` | command | P2 | IA-15 | — |
| `InstitutionCourseCodeService.set` | command | P2 | IA-16 | — |
| `StudentAccessService.listGrants` | read | P2 | IA-04 | — |
| `StudentAccessService.getGiveAccessOptions` | read | P2 | IA-05 | — |
| `StudentAccessService.previewGiveAccess` | preview | P2 | IA-05 | — |
| `StudentAccessService.giveAccess` | command | P2 | IA-05 | — |
| `StudentAccessService.withdrawGrant` | command | P2 | IA-04 | OD-B2-01, SACC-11 |
| `StudentAccessService.getMyHome` | read | P2 | ST-01 | — |
| `StudentAccessService.listMyCourses` | read | P2 | ST-02, ST-04 | — |
| `StudentAccessService.getMyCourse` | read | P2 | ST-03 | — |
| `StudentAccessService.getExperimentHub` | read | P2 | ST-05, ST-19 | OD-B2-01, OD-B2-02, GRP-05, SACC-14, not-designed:format-temporarily-unavailable |
| `LearningService.listResources` | read | P3 | ST-06 | OD-B2-01, OD-B2-02, GRP-05, SACC-14, not-designed:format-temporarily-unavailable |
| `LearningService.openResource` | command | P3 | ST-06 | OD-B2-01, OD-B2-02, GRP-05, SACC-14, not-designed:format-temporarily-unavailable |
| `LearningService.getFormatPage` | read | P3 | ST-08, ST-09 | OD-B2-01, OD-B2-02, GRP-05, SACC-14, not-designed:format-temporarily-unavailable |
| `LearningService.launchWebFormat` | command | P3 | ST-08 | OD-B2-01, OD-B2-02, GRP-05, SACC-14, not-designed:format-temporarily-unavailable |
| `LearningService.getMyProgress` | read | P3 | ST-10, ST-15 | — |
| `FeedbackService.getFeedbackState` | read | P2 | ST-08, ST-09, ST-10, ST-15, ST-01 | — |
| `FeedbackService.sendFeedback` | command | P3 | ST-16, ST-17 | OD-B2-01, OD-B2-02, GRP-05, SACC-14, not-designed:format-temporarily-unavailable |
| `AssessmentService.createAssessment` | command | P4 | FA-07 | — |
| `AssessmentService.getAssessment` | read | P4 | FA-08, FA-09 | — |
| `AssessmentService.updateQuestions` | command | P4 | FA-09 | OD-B4-17 |
| `AssessmentService.useUpdatedVersion` | command | P4 | FA-09 | OD-B4-17 |
| `AssessmentService.updateSettings` | command | P4 | FA-10 | OD-B4-17 |
| `AssessmentService.listSubmissions` | read | P4 | FA-12 | — |
| `AssessmentService.listMyAssessments` | read | P4 | ST-11 | — |
| `AssessmentService.getAssessmentIntro` | read | P4 | ST-12 | OD-B2-01, OD-B2-02, GRP-05, SACC-14, not-designed:format-temporarily-unavailable |
| `AssessmentService.startAttempt` | command | P4 | ST-12, ST-13 | OD-B2-01, OD-B2-02, GRP-05, SACC-14, not-designed:format-temporarily-unavailable |
| `AssessmentService.saveAnswer` | command | P4 | ST-13 | — |
| `AssessmentService.submitAttempt` | command | P4 | ST-13 | — |
| `AssessmentService.getResult` | read | P4 | ST-14 | — |
| `QuestionBankService.listQuestions` | read | P4 | FA-14 | — |
| `QuestionBankService.getQuestion` | read | P4 | FA-15 | OD-B4-17 |
| `QuestionBankService.addQuestion` | command | P4 | FA-15 | — |
| `QuestionBankService.editQuestion` | command | P4 | FA-15 | OD-B4-17 |
| `QuestionBankService.deleteQuestion` | command | P4 | FA-14 | OD-B4-17 |
| `MarkingService.listQueue` | read | P4 | FA-18 | — |
| `MarkingService.getAttemptForMarking` | read | P4 | FA-19 | — |
| `MarkingService.saveMark` | command | P4 | FA-19 | OD-B4-17 |
| `MarkingService.confirmMarks` | command | P4 | FA-19 | ATT-07, ATT-17, M22-no-written-questions, OD-B4-17 |
| `TeachingService.listStudents` | read | P4 | FA-20 | — |
| `TeachingService.getStudentDetail` | read | P4 | FA-21 | — |
| `ProductionService.saveDraft` | command | P5 | VE-03, VE-04, VE-05, VE-06, VE-09 | ROLE-11, SUB-15 |
| `ProductionService.continueStep` | preview | P5 | VE-03, VE-04, VE-05 | ROLE-11, SUB-15 |
| `ProductionService.submitForReview` | command | P5 | VE-06 | ROLE-11, SUB-15 |
| `ProductionService.getRecord` | read | P5 | VE-07, VE-13 | ROLE-11, SUB-15 |
| `ProductionService.saveRevision` | command | P5 | VE-08 | ROLE-11, SUB-15 |
| `ProductionService.resubmit` | command | P5 | VE-08 | ROLE-11, SUB-15 |
| `ProductionService.getReviewQueue` | read | P5 | RV-02 | — |
| `ProductionService.getSubmissionForReview` | read | P5 | RV-03, RV-06 | — |
| `ProductionService.approveSubmission` | command | P5 | RV-03 | — |
| `ProductionService.returnSubmission` | command | P5 | RV-03 | — |
| `ProductionService.listReviewedByMe` | read | P5 | RV-05 | — |
| `ProductionService.listReadyToPublish` | read | P5 | CM-02 | — |
| `ProductionService.getPublicationDecision` | read | P5 | CM-03 | — |
| `ProductionService.publish` | command | P5 | CM-03 | — |
| `ProductionService.sendBack` | command | P5 | CM-03 | — |
| `ProductionService.listAllContent` | read | P6 | SA-12 | — |
| `ProductionService.getContentRecord` | read | P6 | SA-13 | — |
| `ProductionService.overrideStatus` | command | P6 | SA-13 | — |
| `CorrectionService.getPublishedExperiment` | read | P5 | CM-05 | — |
| `CorrectionService.openCorrection` | command | P5 | CM-05, CM-06, CM-07, CM-08 | — |
| `CorrectionService.saveCorrection` | command | P6 | CM-08 | — |
| `CorrectionService.sendForAcademicReview` | command | P6 | CM-08 | — |
| `CorrectionService.withdrawUpdate` | command | P6 | CM-08 | — |
| `CorrectionService.getUpdate` | read | P6 | CM-08 | — |
| `CorrectionService.getUpdateForReview` | read | P6 | RV-04 | — |
| `CorrectionService.approveUpdate` | command | P6 | RV-04 | — |
| `CorrectionService.returnUpdate` | command | P6 | RV-04 | — |
| `CorrectionService.getUpdateDecision` | read | P6 | SA-11 | — |
| `CorrectionService.releaseUpdate` | command | P6 | SA-11 | — |
| `CorrectionService.holdUpdate` | command | P6 | SA-11 | — |
| `CorrectionService.liftHold` | command | P6 | SA-11 | — |
| `AcademicStructureService.getStructure` | read | P6 | SA-14 | — |
| `AcademicStructureService.addArea` | command | P6 | SA-14 | — |
| `AcademicStructureService.addCourse` | command | P6 | SA-14 | — |
| `AcademicStructureService.rename` | command | P6 | SA-15 | — |
| `AcademicStructureService.editDescription` | command | P6 | SA-15 | — |
| `AcademicStructureService.previewMoveCourse` | preview | P6 | SA-15 | — |
| `AcademicStructureService.moveCourse` | command | P6 | SA-15 | — |
| `PlatformCourseCodeService.save` | command | P5 | CM-09 | CC-06 |
| `PlatformRoleService.registerHolder` | command | P6 | SA-16 | — |
| `PlatformRoleService.assignScope` | command | P6 | SA-17 | — |
| `PlatformRoleService.withdrawScope` | command | P6 | SA-17 | — |
| `PlatformRoleService.restoreScope` | command | P6 | SA-17 | — |
| `OperationsService.getMyDevice` | read | P3 | ST-18 | — |
| `OperationsService.requestDeviceTransfer` | command | P3 | ST-18 | OD-B3-01 |
| `OperationsService.listDeviceRequests` | read | P3 | IA-18 | — |
| `OperationsService.getDeviceRequest` | read | P3 | IA-19 | — |
| `OperationsService.forwardDeviceTransfer` | command | P3 | IA-19 | — |
| `OperationsService.listDeviceTransfers` | read | P3 | SA-18 | — |
| `OperationsService.approveDeviceTransfer` | command | P3 | SA-19 | — |
| `OperationsService.reportProblem` | command | P0 | XS-07 | — |
| `OperationsService.listMyReports` | read | P0 | XS-07 | — |
| `OperationsService.getMyReport` | read | P0 | XS-07 | SUP-07 |
| `OperationsService.resolveReport` | command | P6 | SA-21 | — |
| `OperationsService.reopenReport` | command | P6 | SA-21 | SUP-04 |
| `OperationsService.getUsage` | read | P3 | IA-20 | — |

## Stand-in ports (Appendix C §3.18; ADR-0008) — never product UI

| Port.method | System writer | Mock |
|---|---|---|
| `ClockPort.now` | — | WP-0.11 |
| `ClockPort.setSampleNow` | — | WP-0.11 |
| `PaymentOutcomePort.report` | system:payment-provider | WP-0.11 |
| `RuntimeReportPort.reportActivity` | system:runtime-report | WP-0.11 |
| `RuntimeReportPort.reportCompletion` | system:runtime-report | WP-0.11 |
| `WorkflowRoutingPolicy.route` | system:workflow-routing | WP-0.11 |
| `LicenceAvailabilityOracle.waitFor` | — | WP-0.11 |
| `OverlapGrantPolicy.resolve` | — | WP-0.11 |

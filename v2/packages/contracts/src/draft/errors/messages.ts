/**
 * The copy catalogue of drawn validation messages, one key per field rule (ADR-0008 decision 6;
 * Appendix C §5.4; Appendix F §6.7). Schemas and the domain-issue map refer to KEYS only, so a
 * change of words never touches a rule. Each entry carries the board that draws it; the words are
 * checked verbatim against that frozen board (`messages.test.ts`).
 *
 * `{name}` marks a value filled in from the input or the record (B2-07 "GIT-2026-0418 is already
 * used by Rahul Verma" → `{id} is already used by {name}`).
 *
 * `UNDRAWN_RULES` are rules the domain or a schema enforces for which no board draws words. Their
 * field errors carry `message: null`: no copy is invented (Appendix F §6.5 — undrawn states go to
 * the screen's state-copy register for sign-off, VD-12).
 */

export interface DrawnMessage {
  readonly text: string;
  readonly screen: string;
  readonly board: string;
  /** The error-summary link text where the board draws it differently from the field message. */
  readonly summaryText?: string;
  /** Validated by the form before any port call; no port input carries the value. */
  readonly formLevel?: true;
}

export const DRAWN_MESSAGES = {
  // PU-06 / PU-07 Selection (B1-05, B1-06)
  'PU-06.formats.choose-one': {
    text: 'Choose at least one format to add.',
    screen: 'PU-06',
    board: 'B1-05',
  },
  // PU-08 Request access (B1-07 `reqValidate`)
  'PU-08.institutionName.required': {
    text: 'Enter your institution’s name',
    screen: 'PU-08',
    board: 'B1-07',
  },
  'PU-08.contactPerson.required': {
    text: 'Enter the contact person’s name',
    screen: 'PU-08',
    board: 'B1-07',
  },
  'PU-08.email.required': { text: 'Enter an e-mail address', screen: 'PU-08', board: 'B1-07' },
  'PU-08.email.format': {
    text: 'Enter an e-mail address like name@institution.edu',
    screen: 'PU-08',
    board: 'B1-07',
  },
  'PU-08.licencesRequested.required': {
    text: 'Enter the number of licences you are requesting',
    screen: 'PU-08',
    board: 'B1-07',
  },
  'PU-08.licencesRequested.whole-number': {
    text: 'Enter a whole number, like 120',
    screen: 'PU-08',
    board: 'B1-07',
  },
  'PU-08.term.required': {
    text: 'Choose how long you need access',
    screen: 'PU-08',
    board: 'B1-07',
  },
  'PU-08.term.endsOn.required': {
    text: 'Enter the date access should end',
    screen: 'PU-08',
    board: 'B1-07',
  },
  // SA-03 Decision (B1-11 `validate`)
  'SA-03.decision.required': {
    text: 'Choose a decision',
    screen: 'SA-03',
    board: 'B1-11',
    formLevel: true,
  },
  'SA-03.route.required': { text: 'Choose internal or external', screen: 'SA-03', board: 'B1-11' },
  'SA-03.items.keep-one-format': {
    text: 'Keep at least one format',
    screen: 'SA-03',
    board: 'B1-11',
  },
  'SA-03.licences.whole-number': {
    text: 'Enter a whole number of licences',
    screen: 'SA-03',
    board: 'B1-11',
  },
  'SA-03.decision.change-something': {
    text: 'Change at least one thing, or choose Approve request',
    screen: 'SA-03',
    board: 'B1-11',
  },
  'SA-03.reason.required': {
    text: 'Enter the reason for the change',
    screen: 'SA-03',
    board: 'B1-11',
  },
  'SA-03.informationReason.required': {
    text: 'Enter what you need from the requester',
    screen: 'SA-03',
    board: 'B1-11',
  },
  // XS-01 Sign in (B1-09)
  'XS-01.email.required': { text: 'Enter your e-mail address', screen: 'XS-01', board: 'B1-09' },
  'XS-01.email.format': {
    text: 'Enter an e-mail address like name@institution.edu',
    screen: 'XS-01',
    board: 'B1-09',
  },
  'XS-01.password.required': { text: 'Enter your password', screen: 'XS-01', board: 'B1-09' },
  // XS-07 Help & support — Report a problem (board 07)
  'XS-07.whatHappened.required': {
    text: 'Say what happened, so it can be looked into',
    summaryText: 'Say what happened',
    screen: 'XS-07',
    board: '07',
  },
  // IA-10 Add a student / faculty member (B2-07)
  'IA-10.fullName.required': { text: 'Enter the full name', screen: 'IA-10', board: 'B2-07' },
  'IA-10.institutionEmail.required': {
    text: 'Enter the institution e-mail',
    screen: 'IA-10',
    board: 'B2-07',
  },
  'IA-10.institutionEmail.format': {
    text: 'Enter a full e-mail address, like name@godavari.edu.in',
    screen: 'IA-10',
    board: 'B2-07',
  },
  'IA-10.institutionEmail.taken': {
    text: 'This e-mail already belongs to someone in People',
    screen: 'IA-10',
    board: 'B2-07',
  },
  'IA-10.institutionStudentId.required': {
    text: 'Enter the student ID',
    screen: 'IA-10',
    board: 'B2-07',
  },
  'IA-10.institutionStudentId.taken': {
    text: '{id} is already used by {name}',
    screen: 'IA-10',
    board: 'B2-07',
  },
  // IA-11 Import students (B2-07)
  'IA-11.file.required': { text: 'Choose a CSV file first', screen: 'IA-11', board: 'B2-07' },
  // IA-11 import report rows (B2-07): the drawn row messages
  'IA-11.row.programme.required': {
    text: 'Programme is empty. Every row needs the student’s programme.',
    screen: 'IA-11',
    board: 'B2-07',
  },
  'IA-11.row.courseCode.required': {
    text: 'Course code is empty. Every row needs the course code (ME ZG523 or MEC-523).',
    screen: 'IA-11',
    board: 'B2-07',
  },
  'IA-11.row.email.email-format': {
    text: 'E-mail “{value}” isn’t a full address.',
    screen: 'IA-11',
    board: 'B2-07',
  },
  'IA-11.row.studentId.duplicate-in-file': {
    text: 'Student ID {id} is also in row {row}. Each student needs a different ID.',
    screen: 'IA-11',
    board: 'B2-07',
  },
  // IA-07 Student record (B2-06)
  'IA-07.reason.required': {
    text: 'Enter the reason for deactivating this account',
    screen: 'IA-07',
    board: 'B2-06',
  },
  // IA-04 Student access (B2-04)
  'IA-04.reason.required': {
    text: 'Enter the reason for withdrawing access',
    screen: 'IA-04',
    board: 'B2-04',
  },
  // IA-05 Give students access (B2-05)
  'IA-05.experimentIds.required': {
    text: 'Choose at least one experiment',
    screen: 'IA-05',
    board: 'B2-05',
  },
  'IA-05.students.required': {
    text: 'Choose at least one student, or switch to a group',
    screen: 'IA-05',
    board: 'B2-05',
  },
  'IA-05.group.required': { text: 'Choose a group', screen: 'IA-05', board: 'B2-05' },
  // IA-13 / IA-14 Groups (B2-08)
  'IA-13.name.required': { text: 'Enter a name for the group', screen: 'IA-13', board: 'B2-08' },
  'IA-13.name.taken': {
    text: 'A group called “{name}” already exists',
    screen: 'IA-13',
    board: 'B2-08',
  },
  // IA-15 Faculty courses (B2-09)
  'IA-15.facultyId.required': { text: 'Choose a faculty member', screen: 'IA-15', board: 'B2-09' },
  'IA-15.courseId.required': { text: 'Choose a course', screen: 'IA-15', board: 'B2-09' },
  'IA-15.courseId.already-teaches': {
    text: '{name} already teaches {course}',
    screen: 'IA-15',
    board: 'B2-09',
  },
  // IA-16 Course codes (B2-03)
  'IA-16.code.semester-needs-code': {
    text: 'Add your course code, or clear the semester',
    screen: 'IA-16',
    board: 'B2-03',
  },
  // IA-17 Requests to BITS (B3-08)
  'IA-17.need.required': {
    text: 'Choose what you need',
    screen: 'IA-17',
    board: 'B3-08',
    formLevel: true,
  },
  'IA-17.experimentIds.required': {
    text: 'Choose at least one experiment',
    screen: 'IA-17',
    board: 'B3-08',
  },
  'IA-17.licences.required': {
    text: 'Enter the number of licences you need',
    screen: 'IA-17',
    board: 'B3-08',
  },
  'IA-17.licences.whole-number': {
    text: 'Enter a whole number, like 60',
    screen: 'IA-17',
    board: 'B3-08',
  },
  // ST-16 Format feedback (B3-06)
  'ST-16.rating.required': {
    text: 'Choose a rating',
    summaryText: 'Choose a rating for statement {statement}',
    screen: 'ST-16',
    board: 'B3-06',
  },
  // ST-18 My device (B3-07)
  'ST-18.newDevice.required': { text: 'Describe the new device', screen: 'ST-18', board: 'B3-07' },
  // FA-07 Create assessment / FA-10 Settings (B4-04, B4-06)
  'FA-07.experimentId.required': { text: 'Choose an experiment', screen: 'FA-07', board: 'B4-04' },
  'FA-07.name.required': {
    text: 'Enter a name for the assessment',
    screen: 'FA-07',
    board: 'B4-04',
  },
  'FA-07.name.required-for-draft': {
    text: 'Enter a name to save a draft',
    screen: 'FA-07',
    board: 'B4-04',
  },
  'FA-07.passMarkPercent.range': {
    text: 'Enter a pass mark from 0 to 100, as a whole number',
    screen: 'FA-07',
    board: 'B4-04',
  },
  'FA-07.attemptsAllowed.whole-number': {
    text: 'Enter how many attempts are allowed, as a whole number',
    screen: 'FA-07',
    board: 'B4-04',
  },
  'FA-07.deadline.required': { text: 'Enter the deadline', screen: 'FA-07', board: 'B4-04' },
  'FA-07.releaseOption.required': {
    text: 'Choose when students see their result',
    screen: 'FA-07',
    board: 'B4-04',
  },
  'FA-07.releaseDate.required': { text: 'Enter the release date', screen: 'FA-07', board: 'B4-04' },
  'FA-07.questions.at-least-one-or-draft': {
    text: 'Add at least one question, or save as a draft',
    screen: 'FA-07',
    board: 'B4-04',
  },
  // FA-15 Question editor (B4-07)
  'FA-15.type.required': { text: 'Choose the question type', screen: 'FA-15', board: 'B4-07' },
  'FA-15.text.required': { text: 'Enter the question', screen: 'FA-15', board: 'B4-07' },
  'FA-15.options.at-least-two': {
    text: 'Add at least two answer options',
    screen: 'FA-15',
    board: 'B4-07',
  },
  'FA-15.correct.choose-correct': {
    text: 'Choose the correct answer',
    screen: 'FA-15',
    board: 'B4-07',
  },
  'FA-15.correct.true-false': {
    text: 'Choose whether the statement is true or false',
    screen: 'FA-15',
    board: 'B4-07',
  },
  'FA-15.marks.whole-number': {
    text: 'Enter the marks, as a whole number of 1 or more',
    screen: 'FA-15',
    board: 'B4-07',
  },
  // FA-16 Draft with assistance / FA-17 Import questions (B4-08)
  'FA-16.source.required': {
    text: 'Choose the material to draft from',
    screen: 'FA-16',
    board: 'B4-08',
  },
  'FA-16.pastedText.required': {
    text: 'Paste the text to draft from',
    screen: 'FA-16',
    board: 'B4-08',
  },
  'FA-16.types.at-least-one': {
    text: 'Choose at least one question type',
    screen: 'FA-16',
    board: 'B4-08',
  },
  'FA-16.howMany.required': {
    text: 'Choose how many drafts you want',
    screen: 'FA-16',
    board: 'B4-08',
  },
  'FA-17.file.required': { text: 'Choose a CSV file first', screen: 'FA-17', board: 'B4-08' },
  // FA-17 import report rows (B4-08)
  'FA-17.row.correct': {
    text: 'correct is “{value}”, but the question has options {options} only.',
    screen: 'FA-17',
    board: 'B4-08',
  },
  'FA-17.row.type': {
    text: 'type “{value}” isn’t available. Use multiple choice (one correct), true or false, or written answer.',
    screen: 'FA-17',
    board: 'B4-08',
  },
  'FA-17.row.explanation-empty': {
    text: 'explanation is empty. The question imports without one.',
    screen: 'FA-17',
    board: 'B4-08',
  },
  // FA-19 Marking (B4-09)
  'FA-19.mark.required': {
    text: 'Enter a mark for question {question}',
    screen: 'FA-19',
    board: 'B4-09',
  },
  'FA-19.mark.range': {
    text: 'Enter a whole number from 0 to {max}',
    screen: 'FA-19',
    board: 'B4-09',
  },
  // VE-03 Course and description (B5-03 `e1`)
  'VE-03.courseId.required': { text: 'Choose a course', screen: 'VE-03', board: 'B5-03' },
  'VE-03.courseId.course-not-assigned': {
    text: '{code} is no longer one of your assigned courses. Choose one of your courses.',
    screen: 'VE-03',
    board: 'B5-03',
  },
  'VE-03.name.required': { text: 'Enter the experiment name', screen: 'VE-03', board: 'B5-03' },
  'VE-03.name.taken': {
    text: 'An experiment called “{name}” already exists. Choose a different name.',
    screen: 'VE-03',
    board: 'B5-03',
  },
  'VE-03.name.required-for-draft': {
    text: 'Enter a name to save a draft',
    screen: 'VE-03',
    board: 'B5-03',
  },
  'VE-03.summary.required': {
    text: 'Enter a one-sentence summary',
    screen: 'VE-03',
    board: 'B5-03',
  },
  'VE-03.description.required': { text: 'Enter a description', screen: 'VE-03', board: 'B5-03' },
  'VE-03.version.required': {
    text: 'Enter a version, for example 1.0',
    screen: 'VE-03',
    board: 'B5-03',
  },
  // VE-04 Formats and delivery (B5-03 `e2`, drawn on B5-04)
  'VE-04.formats.required': { text: 'Choose at least one format', screen: 'VE-04', board: 'B5-04' },
  'VE-04.webLink.required': { text: 'Enter the web link for WEB', screen: 'VE-04', board: 'B5-04' },
  'VE-04.webLink.format': {
    text: 'Enter a web link that starts with https://',
    screen: 'VE-04',
    board: 'B5-04',
  },
  'VE-04.browserAndComputer.required': {
    text: 'Say which browser and computer WEB needs',
    screen: 'VE-04',
    board: 'B5-04',
  },
  'VE-04.packageLabel.required': {
    text: 'Enter a package label for {format}',
    screen: 'VE-04',
    board: 'B5-04',
  },
  'VE-04.packageReference.required': {
    text: 'Enter a package reference for {format}, or attach the package file',
    screen: 'VE-04',
    board: 'B5-04',
  },
  'VE-04.deviceNeeded.required': {
    text: 'Say which device {format} needs',
    screen: 'VE-04',
    board: 'B5-04',
  },
  'VE-04.installNotes.required': {
    text: 'Add install notes for {format}',
    screen: 'VE-04',
    board: 'B5-04',
  },
  // VE-05 Preview and documents (B5-03 `e3`, drawn on B5-05)
  'VE-05.previewLink.required-with-label': {
    text: 'Add a preview link for “{label}”, or remove the label',
    screen: 'VE-05',
    board: 'B5-05',
  },
  'VE-05.previewLink.format': {
    text: 'Enter a preview link that starts with https://',
    screen: 'VE-05',
    board: 'B5-05',
  },
  // RV-03 Review a submission (B6-03)
  'RV-03.reason.required': {
    text: 'Add a reason so the vendor knows what to change',
    screen: 'RV-03',
    board: 'B6-03',
  },
  'RV-03.outcome.required': { text: 'Enter the outcome text', screen: 'RV-03', board: 'B6-03' },
  'RV-03.outcome.required-or-cancel': {
    text: 'Enter the outcome text, or cancel',
    screen: 'RV-03',
    board: 'B6-03',
    formLevel: true,
  },
  'RV-03.outcomes.at-least-one': {
    text: 'Add at least one learning outcome before you approve',
    screen: 'RV-03',
    board: 'B6-03',
  },
  // RV-04 Review an update (B6-04)
  'RV-04.reason.required': {
    text: 'Add a reason so the Content Manager knows what to change',
    screen: 'RV-04',
    board: 'B6-04',
  },
  // CM-03 Publication decision (B6-07)
  'CM-03.to.required': {
    text: 'Choose who it goes back to',
    screen: 'CM-03',
    board: 'B6-07',
  },
  'CM-03.reason.required': {
    text: 'Add a reason so they know what to change',
    screen: 'CM-03',
    board: 'B6-07',
  },
  // CM-08 Update draft (B6-09 `validate`)
  'CM-08.whatChangesAndWhy.required': {
    text: 'Say what changes and why',
    screen: 'CM-08',
    board: 'B6-09',
  },
  'CM-08.versionLabel.required': {
    text: 'Enter the version label, for example 1.3',
    screen: 'CM-08',
    board: 'B6-09',
  },
  'CM-08.versionLabel.same-as-live': {
    text: 'Use a new version label — {live} is live',
    screen: 'CM-08',
    board: 'B6-09',
  },
  'CM-08.proposed.change-something': {
    text: 'Change at least one catalogue detail or delivery link',
    screen: 'CM-08',
    board: 'B6-09',
  },
  'CM-08.reason.required': {
    text: 'Add a reason for withdrawing this update',
    screen: 'CM-08',
    board: 'B6-09',
  },
  // CM-09 Platform course codes (B6-10 `save`)
  'CM-09.code.taken': {
    text: '{code} is already the code for {course}. Each course needs its own code.',
    screen: 'CM-09',
    board: 'B6-10',
  },
  // SA-07 Institution detail (B7-03)
  'SA-07.name.required': { text: 'Enter the person’s name', screen: 'SA-07', board: 'B7-03' },
  'SA-07.workEmail.required': {
    text: 'Enter a work e-mail address',
    screen: 'SA-07',
    board: 'B7-03',
  },
  'SA-07.workEmail.format': {
    text: 'Enter an e-mail address like name@institution.edu.in',
    screen: 'SA-07',
    board: 'B7-03',
  },
  'SA-07.reason.required': {
    text: 'Add a reason — it is kept in the history',
    screen: 'SA-07',
    board: 'B7-03',
  },
  // SA-11 Release / Hold (B7-05)
  'SA-11.reason.required': {
    text: 'Add a reason — the Content Manager sees it',
    screen: 'SA-11',
    board: 'B7-05',
  },
  // SA-13 Move status (override) (B7-06)
  'SA-13.reason.required': {
    text: 'Add a reason — it is kept in the history',
    screen: 'SA-13',
    board: 'B7-06',
  },
  // SA-14 / SA-15 Academic structure (B7-07)
  'SA-14.areaName.required': { text: 'Enter the area name', screen: 'SA-14', board: 'B7-07' },
  'SA-14.areaName.taken': {
    text: 'There is already an area called {name}',
    screen: 'SA-14',
    board: 'B7-07',
  },
  'SA-14.courseName.required': { text: 'Enter the course name', screen: 'SA-14', board: 'B7-07' },
  'SA-14.courseName.taken': {
    text: 'There is already a course called {name}',
    screen: 'SA-14',
    board: 'B7-07',
  },
  'SA-14.areaId.required': {
    text: 'Choose the engineering area it belongs to',
    screen: 'SA-14',
    board: 'B7-07',
  },
  'SA-15.name.required': { text: 'Enter a name', screen: 'SA-15', board: 'B7-07' },
  'SA-15.name.unchanged': {
    text: 'Enter a different name — this is the current one',
    screen: 'SA-15',
    board: 'B7-07',
  },
  'SA-15.name.taken-area': {
    text: 'There is already an area called {name}',
    screen: 'SA-15',
    board: 'B7-07',
  },
  'SA-15.name.taken-course': {
    text: 'There is already a course called {name}',
    screen: 'SA-15',
    board: 'B7-07',
  },
  'SA-15.toAreaId.required': {
    text: 'Choose the area to move it to',
    screen: 'SA-15',
    board: 'B7-07',
  },
  // SA-16 / SA-17 Platform roles (B7-08)
  'SA-16.name.required': { text: 'Enter the person’s name', screen: 'SA-16', board: 'B7-08' },
  'SA-16.workEmail.required': {
    text: 'Enter a work e-mail address',
    screen: 'SA-16',
    board: 'B7-08',
  },
  'SA-16.workEmail.format': {
    text: 'Enter an e-mail address like name@organisation.com',
    screen: 'SA-16',
    board: 'B7-08',
  },
  'SA-16.workEmail.taken': {
    text: 'Someone is already registered with this e-mail address',
    screen: 'SA-16',
    board: 'B7-08',
  },
  'SA-16.organisation.required': {
    text: 'Enter the organisation',
    screen: 'SA-16',
    board: 'B7-08',
  },
  'SA-17.target.required': {
    text: 'Choose what they can act on',
    screen: 'SA-17',
    board: 'B7-08',
  },
  'SA-17.courseId.required': { text: 'Choose a course', screen: 'SA-17', board: 'B7-08' },
  'SA-17.experimentId.required': { text: 'Choose an experiment', screen: 'SA-17', board: 'B7-08' },
  'SA-17.target.already-in-scope': {
    text: '{target} is already in scope',
    screen: 'SA-17',
    board: 'B7-08',
  },
  'SA-17.reason.required': {
    text: 'Add a reason — it is kept in the history',
    screen: 'SA-17',
    board: 'B7-08',
  },
  // SA-21 Support report (B7-09)
  'SA-21.note.required': {
    text: 'Add a note — the reporter sees it',
    screen: 'SA-21',
    board: 'B7-09',
  },
} as const satisfies Readonly<Record<string, DrawnMessage>>;

export interface UndrawnRule {
  readonly screen: string;
  /** What the rule guards and why no words exist for it. */
  readonly reason: string;
  /** The rule's source: a WP-0.9 domain decision or this contract's schema. */
  readonly source: string;
}

/**
 * Rules with no drawn words. Most guard values the drawn form cannot produce (an option that is
 * not offered, a format that stopped being published); one is a provisional WP-0.9 reading.
 */
export const UNDRAWN_RULES = {
  'contract.invalid-input': {
    screen: '—',
    reason:
      'A value of the wrong type or shape reached a port: a programming error, not a drawn form state.',
    source: 'contract schemas',
  },
  'PU-08.selection.format-not-published': {
    screen: 'PU-08',
    reason:
      'A chosen format stopped being published before the request was sent; B1-07 draws no words.',
    source: 'domain submitPublicRequest (WP-0.9)',
  },
  'SA-03.items.not-requested': {
    screen: 'SA-03',
    reason: 'A smaller scope may keep only requested formats; B1-11 offers only those checkboxes.',
    source: 'domain approveSmallerScope (WP-0.9)',
  },
  'SA-03.items.same-experiments': {
    screen: 'SA-03',
    reason: 'A smaller scope keeps the requested experiments; B1-11 offers no experiment choice.',
    source: 'domain approveSmallerScope (WP-0.9)',
  },
  'SA-03.licences.not-smaller': {
    screen: 'SA-03',
    reason:
      'A smaller scope may not raise the licences — a PROVISIONAL WP-0.9 reading; B1-11 draws no words for it.',
    source: 'domain approveSmallerScope (WP-0.9 [P])',
  },
  'SA-03.term.required': {
    screen: 'SA-03',
    reason: 'The approved term of a smaller scope; B1-11 draws no message for a missing term.',
    source: 'domain approveSmallerScope (WP-0.9)',
  },
  'IA-14.studentIds.required': {
    screen: 'IA-14',
    reason: 'Adding no members to a group; B2-08 draws no message.',
    source: 'domain addMembers (WP-0.9)',
  },
  'IA-15.facultyId.active-only': {
    screen: 'IA-15',
    reason: 'An inactive faculty member is not offered by B2-09.',
    source: 'domain assignFacultyCourse (WP-0.9)',
  },
  'IA-15.courseId.in-content-access': {
    screen: 'IA-15',
    reason: 'A course outside the institution’s content access is not offered by B2-09.',
    source: 'domain assignFacultyCourse (WP-0.9)',
  },
  'IA-17.experimentIds.not-in-plan': {
    screen: 'IA-17',
    reason: 'Only experiments in the plan are offered by B3-08.',
    source: 'domain submitAdditionalLicencesRequest (WP-0.9)',
  },
  'FA-09.questions.at-least-one': {
    screen: 'FA-09',
    reason: 'Removing every question from an assessment; no board draws words for it.',
    source: 'domain changeAssessment (WP-0.9)',
  },
  'ST-13.questionId.not-in-attempt': {
    screen: 'ST-13',
    reason: 'An answer to a question that is not in the attempt; not reachable from B4-12.',
    source: 'domain saveAnswer (WP-0.9)',
  },
  'ST-13.answer.not-an-option': {
    screen: 'ST-13',
    reason: 'A choice that is not one of the question’s options; not reachable from B4-12.',
    source: 'domain saveAnswer (WP-0.9)',
  },
  'ST-13.answer.type': {
    screen: 'ST-13',
    reason: 'An answer of another question type; not reachable from B4-12.',
    source: 'domain saveAnswer (WP-0.9)',
  },
  'FA-19.questionId.not-a-written-question': {
    screen: 'FA-19',
    reason: 'Only written answers are marked by hand (B4-09).',
    source: 'domain saveMark (WP-0.9)',
  },
  'SA-15.toAreaId.unchanged': {
    screen: 'SA-15',
    reason: 'B7-07 lists every area except the current one.',
    source: 'domain moveCourse (WP-0.9)',
  },
  'SA-16.role.platform-role-only': {
    screen: 'SA-16',
    reason:
      'Only Vendors, Academic Reviewers and Content Managers are registered in Platform roles (B7-08 tabs).',
    source: 'domain registerHolder (WP-0.9)',
  },
  'CM-09.courseId.unknown-course': {
    screen: 'CM-09',
    reason: 'A code for a course that does not exist; not reachable from B6-10.',
    source: 'domain savePlatformCourseCodes (WP-0.9)',
  },
  // IA-11 import report rows B2-07 states as rules but draws no words for (its "Duplicates" and
  // "Every column is required" definitions); the state-copy register supplies them (VD-12).
  'IA-11.row.studentId.required': {
    screen: 'IA-11',
    reason:
      'An empty student_id column; B2-07 states every column is required but draws no row words.',
    source: 'domain checkStudentImport (WP-0.9)',
  },
  'IA-11.row.fullName.required': {
    screen: 'IA-11',
    reason:
      'An empty full_name column; B2-07 states every column is required but draws no row words.',
    source: 'domain checkStudentImport (WP-0.9)',
  },
  'IA-11.row.email.required': {
    screen: 'IA-11',
    reason: 'An empty email column; B2-07 states every column is required but draws no row words.',
    source: 'domain checkStudentImport (WP-0.9)',
  },
  'IA-11.row.course.required': {
    screen: 'IA-11',
    reason: 'An empty course column; B2-07 states every column is required but draws no row words.',
    source: 'domain checkStudentImport (WP-0.9)',
  },
  'IA-11.row.email.in-people': {
    screen: 'IA-11',
    reason:
      'An e-mail already in People; B2-07 "Duplicates" states the rule but draws no row words.',
    source: 'domain checkStudentImport (WP-0.9)',
  },
  'IA-11.row.studentId.in-people': {
    screen: 'IA-11',
    reason:
      'A student ID already in People; B2-07 "Duplicates" states the rule but draws no row words.',
    source: 'domain checkStudentImport (WP-0.9)',
  },
  'IA-11.row.courseCode.unknown-course': {
    screen: 'IA-11',
    reason:
      'A course code that names no course — a PROVISIONAL WP-0.9 reading (filing needs a course); B2-07 draws no words for it.',
    source: 'domain checkStudentImport (WP-0.9 [PROPOSED])',
  },
  // Phase-2 Package 2B: the IA-11 file checks B2-07 implies but draws no words for (the template's
  // six columns; at least one student row) — the file is parsed by the service (Appendix A "product
  // needs a real CSV file input").
  'IA-11.file.columns': {
    screen: 'IA-11',
    reason:
      'A file whose first line is not the template header (student_id, full_name, email, programme, course, course_code); B2-07 draws only the template and its columns.',
    source: 'sample-platform previewStudentImport (Phase-2 Package 2B)',
  },
  'IA-11.file.no-rows': {
    screen: 'IA-11',
    reason: 'A file with the header and no student rows; B2-07 draws no words for it.',
    source: 'sample-platform previewStudentImport (Phase-2 Package 2B)',
  },
  'IA-11.row.email.duplicate-in-file': {
    screen: 'IA-11',
    reason:
      'The same e-mail on two rows — two people would share one sign-in. B2-07 draws the duplicate-ID words only; a sample-mode identity safeguard, not the T-11 policy.',
    source: 'sample-platform identity safeguard (Phase-2 Package 2B)',
  },
  // Phase-2 Package 2B sample-mode identity safeguard (owner authorisation §5; T-11 / P1-01 stay
  // open): an e-mail that already signs someone in to the sample platform — a person of another
  // institution, an Institute Admin, a platform-role holder or a Super Admin — is refused rather
  // than silently shadowing that sign-in. No board draws words for it.
  'IA-10.institutionEmail.identity-taken': {
    screen: 'IA-10',
    reason:
      'An e-mail another sample identity signs in with; adding it would take over or hide that sign-in. Not the final T-11 invitation or identity policy.',
    source: 'sample-platform identity safeguard (Phase-2 Package 2B)',
  },
  'IA-11.row.email.identity-taken': {
    screen: 'IA-11',
    reason:
      'An e-mail another sample identity signs in with; importing it would take over or hide that sign-in. Not the final T-11 invitation or identity policy.',
    source: 'sample-platform identity safeguard (Phase-2 Package 2B)',
  },
  'SA-07.workEmail.identity-taken': {
    screen: 'SA-07',
    reason:
      'An e-mail another sample identity signs in with; assigning it would take over or hide that sign-in. Not the final T-11 invitation or identity policy.',
    source: 'sample-platform identity safeguard (Phase-2 Package 2B)',
  },
  // FA-17 import report rows B4-08 states as rules ("question and marks are always required; choice
  // questions need their options") but draws no words for.
  'FA-17.row.question': {
    screen: 'FA-17',
    reason: 'An empty question column; B4-08 states the rule but draws no row words.',
    source: 'domain parseImportRow (WP-0.9)',
  },
  'FA-17.row.marks': {
    screen: 'FA-17',
    reason:
      'Marks that are not a whole number of 1 or more; B4-08 states the rule but draws no row words.',
    source: 'domain parseImportRow (WP-0.9)',
  },
  'FA-17.row.options': {
    screen: 'FA-17',
    reason:
      'A choice question with fewer than two options; B4-08 states the rule but draws no row words.',
    source: 'domain parseImportRow (WP-0.9)',
  },
} as const satisfies Readonly<Record<string, UndrawnRule>>;

export type DrawnMessageKey = keyof typeof DRAWN_MESSAGES;
export type UndrawnRuleKey = keyof typeof UNDRAWN_RULES;
export type MessageKey = DrawnMessageKey | UndrawnRuleKey;

export const MESSAGE_KEYS = [
  ...Object.keys(DRAWN_MESSAGES),
  ...Object.keys(UNDRAWN_RULES),
] as readonly MessageKey[];

export function isMessageKey(value: string): value is MessageKey {
  return Object.hasOwn(DRAWN_MESSAGES, value) || Object.hasOwn(UNDRAWN_RULES, value);
}

export function isDrawn(key: MessageKey): key is DrawnMessageKey {
  return Object.hasOwn(DRAWN_MESSAGES, key);
}

const PLACEHOLDER = /\{([a-zA-Z]+)\}/g;

/** The placeholders a drawn message needs, in order. */
export function placeholdersOf(text: string): readonly string[] {
  return [...text.matchAll(PLACEHOLDER)].map((match) => match[1]!);
}

/** Fills `{name}` placeholders; a missing value is a programming error and throws. */
export function fillPlaceholders(text: string, params: Readonly<Record<string, string>>): string {
  return text.replace(PLACEHOLDER, (_, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`Message "${text}" needs the value {${name}}.`);
    return value;
  });
}

/** The drawn words of a key with its values filled in, or `null` when no words are drawn. */
export function messageFor(
  key: MessageKey,
  params: Readonly<Record<string, string>> = {},
): string | null {
  if (!isDrawn(key)) return null;
  return fillPlaceholders(DRAWN_MESSAGES[key].text, params);
}

/** The error-summary link words of a key (the field message where the board draws no other). */
export function summaryTextFor(
  key: MessageKey,
  params: Readonly<Record<string, string>> = {},
): string | null {
  if (!isDrawn(key)) return null;
  const entry: DrawnMessage = DRAWN_MESSAGES[key];
  return fillPlaceholders(entry.summaryText ?? entry.text, params);
}

/**
 * Error-summary titles drawn per form (`xw-errsum` <strong>; B1-07, B2-07, B3-06 compute them from
 * the count). A form not listed draws no summary title (`summaryTitle: null`); the Batch-7 dialogs
 * show field errors only (Appendix C §5.2).
 */
export const SUMMARY_TITLES = {
  'PU-08': {
    one: 'There is 1 problem with this request',
    many: 'There are {n} problems with this request',
    board: 'B1-07',
  },
  'SA-03': { one: 'Check your decision', many: 'Check your decision', board: 'B1-11' },
  // Board 07 has one required field, so only the one-error title can occur.
  'XS-07': { one: 'One thing needs fixing', many: null, board: '07' },
  'IA-05': { one: 'Check this step', many: 'Check this step', board: 'B2-05' },
  'IA-10': { one: 'One thing needs fixing', many: '{n} things need fixing', board: 'B2-07' },
  'IA-17': { one: 'Check your request', many: 'Check your request', board: 'B3-08' },
  'ST-16': { one: 'One rating is missing', many: '{n} ratings are missing', board: 'B3-06' },
  'FA-07': { one: 'Check this step', many: 'Check this step', board: 'B4-04' },
  'FA-15': { one: 'Check this question', many: 'Check this question', board: 'B4-07' },
  'FA-16': { one: 'Check these choices', many: 'Check these choices', board: 'B4-08' },
  'VE-03': { one: 'Check this step', many: 'Check this step', board: 'B5-03' },
  'VE-04': { one: 'Check this step', many: 'Check this step', board: 'B5-04' },
  'VE-05': { one: 'Check this step', many: 'Check this step', board: 'B5-05' },
  'CM-08': { one: 'Check the update', many: 'Check the update', board: 'B6-09' },
  'CM-09': { one: 'Check the codes', many: 'Check the codes', board: 'B6-10' },
} as const satisfies Readonly<
  Record<string, { readonly one: string; readonly many: string | null; readonly board: string }>
>;

export type SummaryForm = keyof typeof SUMMARY_TITLES;

/** The drawn summary title for `count` field errors on a form, or `null` when none is drawn. */
export function summaryTitleFor(form: SummaryForm | null, count: number): string | null {
  if (form === null || count === 0) return null;
  const title: { readonly one: string; readonly many: string | null } = SUMMARY_TITLES[form];
  if (count === 1) return title.one;
  return title.many === null ? null : fillPlaceholders(title.many, { n: String(count) });
}

/**
 * The catalogue key of each import-report row rule, by the domain's `field:rule`
 * (`StudentImportReport.problems`) or problem (`QuestionImportReport.rows`). Four student rules and
 * three question rules have drawn words; the others are undrawn rules (`message: null`). The
 * sample-mode identity safeguard's two e-mail rows (Package 2B) come from the adapter, not the
 * domain: `STUDENT_IMPORT_SAFEGUARD_ROW_KEYS` (`ports/people.ts`).
 */
export const STUDENT_IMPORT_ROW_KEYS = {
  'programme:required': 'IA-11.row.programme.required',
  'courseCode:required': 'IA-11.row.courseCode.required',
  'email:email-format': 'IA-11.row.email.email-format',
  'studentId:duplicate-in-file': 'IA-11.row.studentId.duplicate-in-file',
  'studentId:required': 'IA-11.row.studentId.required',
  'fullName:required': 'IA-11.row.fullName.required',
  'email:required': 'IA-11.row.email.required',
  'course:required': 'IA-11.row.course.required',
  'email:in-people': 'IA-11.row.email.in-people',
  'studentId:in-people': 'IA-11.row.studentId.in-people',
  'courseCode:unknown-course': 'IA-11.row.courseCode.unknown-course',
} as const satisfies Readonly<Record<string, MessageKey>>;

export const QUESTION_IMPORT_ROW_KEYS = {
  correct: 'FA-17.row.correct',
  type: 'FA-17.row.type',
  'explanation-empty': 'FA-17.row.explanation-empty',
  question: 'FA-17.row.question',
  marks: 'FA-17.row.marks',
  options: 'FA-17.row.options',
} as const satisfies Readonly<Record<string, MessageKey>>;

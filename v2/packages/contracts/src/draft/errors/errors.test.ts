/**
 * The error model (ADR-0008 decisions 2, 3, 6, 7): the ten kinds, the ProblemDetails mapping as a
 * definition (no adapter) that is lossless and fits the committed envelope, drawn field errors
 * from schema issues, and the WP-0.9 domain issues mapped to their fields and keys — with
 * `policy-open` carried through, never turned into an allow or a deny.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import type { InputIssue, Refusal } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { problemDetailsSchema } from '../../problem.js';
import { V2, sourceFiles } from '../../test-support/sources.js';
import { publicRequestInput, startPaymentInput } from '../ports/access-request.js';
import { sendFeedbackInput } from '../ports/learning.js';
import {
  DOMAIN_ISSUE_MAP,
  fieldErrorsFromDomain,
  fromDomainRefusal,
  issueTarget,
} from './domain-issues.js';
import {
  fieldError,
  fieldErrorsFromIssues,
  parseInput,
  toErrorSummary,
  validationFailed,
} from './field-errors.js';
import {
  PROBLEM_MAPPING,
  PROBLEM_TYPE_BASE,
  fromProblemDetails,
  toProblemDetails,
} from './problem.js';
import { REFUSAL_CODES } from './refusals.js';
import {
  SERVICE_ERROR_KINDS,
  type ServiceError,
  failure,
  fieldErrorSchema,
  resultSchema,
  serviceErrorSchemaFor,
  success,
} from './service-error.js';

const EXAMPLES: readonly ServiceError[] = [
  { kind: 'not-signed-in' },
  { kind: 'not-permitted', why: 'out-of-scope' },
  { kind: 'not-found' },
  { kind: 'invalid-state', current: 'published' },
  { kind: 'refused', code: 'institution-paused' },
  validationFailed(
    [
      fieldError('institutionName', 'PU-08.institutionName.required'),
      fieldError('selection', 'PU-08.selection.format-not-published'),
    ],
    'PU-08',
  ),
  { kind: 'stale-version', currentRev: 4 },
  { kind: 'conflict', code: 'already-sent' },
  { kind: 'policy-open', decision: 'OD-B2-01' },
  { kind: 'unavailable' },
];

const errorSchema = serviceErrorSchemaFor(REFUSAL_CODES);

describe('ServiceError and Result', () => {
  it('has exactly the ten kinds', () => {
    expect([...SERVICE_ERROR_KINDS]).toEqual([
      'not-signed-in',
      'not-permitted',
      'not-found',
      'invalid-state',
      'refused',
      'validation-failed',
      'stale-version',
      'conflict',
      'policy-open',
      'unavailable',
    ]);
    expect(EXAMPLES.map((error) => error.kind)).toEqual([...SERVICE_ERROR_KINDS]);
  });

  it('validates errors: known codes, catalogue keys and at least one field error', () => {
    for (const error of EXAMPLES)
      expect(errorSchema.safeParse(error).success, error.kind).toBe(true);
    expect(errorSchema.safeParse({ kind: 'refused', code: 'overlap-policy-open' }).success).toBe(
      false,
    );
    expect(
      errorSchema.safeParse({ kind: 'validation-failed', fieldErrors: [], summaryTitle: null })
        .success,
    ).toBe(false);
    expect(
      fieldErrorSchema.safeParse({ field: 'x', key: 'PU-08.made-up', message: null, params: {} })
        .success,
    ).toBe(false);
    expect(errorSchema.safeParse({ kind: 'policy-open', decision: '' }).success).toBe(false);
  });

  it('answers a value with the records it changed, or an error that changed nothing', () => {
    const schema = resultSchema(publicRequestInput, errorSchema);
    expect(success(1, [{ kind: 'REQ', id: 'REQ-0042' }])).toEqual({
      ok: true,
      value: 1,
      changed: [{ kind: 'REQ', id: 'REQ-0042' }],
    });
    expect(success('x').changed).toEqual([]);
    expect(failure({ kind: 'not-found' })).toEqual({ ok: false, error: { kind: 'not-found' } });
    expect(schema.safeParse({ ok: false, error: { kind: 'unavailable' } }).success).toBe(true);
    expect(
      schema.safeParse({ ok: true, value: {}, changed: [{ kind: 'NOPE', id: 'x' }] }).success,
    ).toBe(false);
  });
});

describe('the future ProblemDetails mapping (a definition only)', () => {
  it('maps each kind to its status and its own type under /api/v1/problems', () => {
    expect(PROBLEM_TYPE_BASE).toBe('/api/v1/problems');
    expect(
      Object.fromEntries(SERVICE_ERROR_KINDS.map((kind) => [kind, PROBLEM_MAPPING[kind].status])),
    ).toEqual({
      'not-signed-in': 401,
      'not-permitted': 403,
      'not-found': 404,
      'invalid-state': 409,
      refused: 409,
      'validation-failed': 422,
      'stale-version': 409,
      conflict: 409,
      'policy-open': 409,
      unavailable: 503,
    });
    for (const kind of SERVICE_ERROR_KINDS)
      expect(PROBLEM_MAPPING[kind].type).toBe(`/api/v1/problems/${kind}`);
  });

  it.each(EXAMPLES)(
    '$kind fits the committed problem envelope and maps back unchanged',
    (error) => {
      const problem = toProblemDetails(error);
      expect(problemDetailsSchema.safeParse(problem).success).toBe(true);
      expect(fromProblemDetails(problem)).toEqual(error);
    },
  );

  it('carries field errors as the committed {path, message} plus the rule key', () => {
    const problem = toProblemDetails(EXAMPLES[5]!);
    expect(problem.errors).toEqual([
      {
        path: 'institutionName',
        message: 'Enter your institution’s name',
        key: 'PU-08.institutionName.required',
        params: {},
      },
      {
        path: 'selection',
        message: 'PU-08.selection.format-not-published',
        key: 'PU-08.selection.format-not-published',
        params: {},
      },
    ]);
    expect(problem.summaryTitle).toBe('There are 2 problems with this request');
  });

  it('refuses a document it does not map or that lacks the kind’s facts', () => {
    expect(() =>
      fromProblemDetails({ type: '/api/v1/problems/teapot', title: 'x', status: 418 }),
    ).toThrow(/Not a mapped/);
    expect(() =>
      fromProblemDetails({ type: '/api/v1/problems/refused', title: 'Refused', status: 409 }),
    ).toThrow(/lacks "code"/);
  });

  it('has no HTTP adapter: no draft module reaches the network or serves a route', () => {
    for (const file of sourceFiles('draft')) {
      const text = readFileSync(file, 'utf8');
      expect(text, file).not.toMatch(
        /\bfetch\(|XMLHttpRequest|node:http|createServer|new Request\(|new Response\(/,
      );
    }
  });
});

describe('drawn field errors from input schemas', () => {
  it('reports every field of an empty PU-08 request with its drawn words and the summary title', () => {
    const parsed = parseInput(
      publicRequestInput,
      {
        institutionName: ' ',
        contactPerson: '',
        email: 'meera@',
        phone: null,
        licencesRequested: '60.5',
        message: null,
        term: null,
      },
      'PU-08',
    );
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error.fieldErrors.map((item) => [item.field, item.key, item.message])).toEqual([
      ['institutionName', 'PU-08.institutionName.required', 'Enter your institution’s name'],
      ['contactPerson', 'PU-08.contactPerson.required', 'Enter the contact person’s name'],
      ['email', 'PU-08.email.format', 'Enter an e-mail address like name@institution.edu'],
      [
        'licencesRequested',
        'PU-08.licencesRequested.whole-number',
        'Enter a whole number, like 120',
      ],
      ['term', 'PU-08.term.required', 'Choose how long you need access'],
    ]);
    expect(parsed.error.summaryTitle).toBe('There are 5 problems with this request');
  });

  it('accepts the trimmed, parsed form and makes no choice for the person', () => {
    const parsed = parseInput(
      publicRequestInput,
      {
        institutionName: '  Godavari Institute of Technology ',
        contactPerson: 'Meera Iyer',
        email: ' meera.iyer@godavari.edu.in ',
        phone: '  ',
        licencesRequested: '60',
        message: null,
        term: { kind: 'yearly' },
      },
      'PU-08',
    );
    expect(parsed).toEqual({
      ok: true,
      value: {
        institutionName: 'Godavari Institute of Technology',
        contactPerson: 'Meera Iyer',
        email: 'meera.iyer@godavari.edu.in',
        phone: null,
        licencesRequested: 60,
        message: null,
        term: { kind: 'yearly' },
      },
    });
  });

  it('keeps the first issue per field, names a missing rating’s statement, and links the summary', () => {
    const parsed = parseInput(
      sendFeedbackInput,
      {
        experimentId: 'heat-exchanger',
        format: 'web',
        ratings: [5, null, 4, null, 3],
        comments: null,
      },
      'ST-16',
    );
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error.fieldErrors.map((item) => [item.field, item.message, item.params])).toEqual(
      [
        ['ratings.1', 'Choose a rating', { statement: '2' }],
        ['ratings.3', 'Choose a rating', { statement: '4' }],
      ],
    );
    expect(parsed.error.summaryTitle).toBe('2 ratings are missing');
    expect(toErrorSummary(parsed.error).items.map((item) => item.summaryText)).toEqual([
      'Choose a rating for statement 2',
      'Choose a rating for statement 4',
    ]);
  });

  it('reports a value of the wrong shape as contract.invalid-input, which has no words', () => {
    const parsed = parseInput(
      startPaymentInput,
      { by: 'someone-else', requestId: 'REQ-0042', expectedRev: 1 },
      null,
    );
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error.fieldErrors[0]).toMatchObject({
      key: 'contract.invalid-input',
      message: null,
    });
    expect(parsed.error.summaryTitle).toBeNull();
    const issues = publicRequestInput.safeParse({ institutionName: 42 }).error!.issues;
    expect(
      fieldErrorsFromIssues(issues).every(
        (item) => item.message === null || typeof item.message === 'string',
      ),
    ).toBe(true);
  });

  it('refuses a field error whose drawn words need a value it was not given', () => {
    expect(() => fieldError('name', 'IA-13.name.taken')).toThrow(/needs \{name\}/);
    expect(fieldError('name', 'IA-13.name.taken', { name: 'Lab A' }).message).toBe(
      'A group called “Lab A” already exists',
    );
  });
});

describe('WP-0.9 domain issues → fields and keys', () => {
  const DOMAIN = join(V2, 'packages', 'domain', 'src');

  /** Every literal `{ field: 'f', rule: 'r' }` issue the domain decisions raise. */
  function raisedIssues(): ReadonlySet<string> {
    const found = new Set<string>();
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        if (statSync(path).isDirectory())
          return ['invariants', 'testing'].includes(name) ? [] : walk(path);
        return name.endsWith('.ts') && !name.endsWith('.test.ts') ? [path] : [];
      });
    for (const file of walk(DOMAIN)) {
      const text = readFileSync(file, 'utf8');
      for (const match of text.matchAll(/field: '([^']+)',\s*rule: ([^}\n]+?)\s*\}/g)) {
        const expression = match[2]!;
        const choices = expression.includes('?')
          ? expression.slice(expression.indexOf('?'))
          : expression;
        for (const rule of choices.matchAll(/'([\w-]+)'/g)) found.add(`${match[1]}/${rule[1]}`);
      }
    }
    return found;
  }

  const mapped = Object.values(DOMAIN_ISSUE_MAP).flatMap((list) => list ?? []);

  it('maps every issue the domain raises', () => {
    const unmapped = [...raisedIssues()].filter((issue) => {
      const [field, rule] = issue.split('/') as [string, string];
      return !mapped.some(
        (mapping) =>
          mapping.rule === rule &&
          (typeof mapping.field === 'string' ? mapping.field === field : mapping.field.test(field)),
      );
    });
    expect(unmapped).toEqual([]);
  });

  it('maps only issues the domain raises (nothing invented)', () => {
    const raised = raisedIssues();
    const invented = mapped
      .filter((mapping) => typeof mapping.field === 'string')
      .map((mapping) => `${String(mapping.field)}/${mapping.rule}`)
      .filter((issue) => !raised.has(issue));
    expect(invented).toEqual([]);
  });

  it('names its field and key for an issue, and throws for an issue the method cannot raise', () => {
    expect(
      issueTarget(
        'AccessRequestService.submitPublicRequest',
        { field: 'contactEmail', rule: 'email-format' },
        {},
      ),
    ).toEqual({
      field: 'email',
      key: 'PU-08.email.format',
    });
    expect(() =>
      issueTarget('SelectionService.add', { field: 'reason', rule: 'required' }, {}),
    ).toThrow(/no contract mapping/);
  });

  it('places value-carrying issues: a rating statement, an import row, a CM-09 change row', () => {
    const ratings: InputIssue[] = [
      { field: 'rating-2', rule: 'choose-rating' },
      { field: 'rating-5', rule: 'choose-rating' },
    ];
    expect(
      fieldErrorsFromDomain('FeedbackService.sendFeedback', ratings, {}).map((item) => [
        item.field,
        item.params,
      ]),
    ).toEqual([
      ['ratings.1', { statement: '2' }],
      ['ratings.4', { statement: '5' }],
    ]);
    const rows: InputIssue[] = [
      { field: 'row 6 studentId', rule: 'duplicate-in-file' },
      { field: 'row 9 programme', rule: 'required' },
      { field: 'row 12 email', rule: 'in-people' },
    ];
    const rowErrors = fieldErrorsFromDomain(
      'PeopleService.commitStudentImport',
      rows,
      {},
      (issue): Readonly<Record<string, string>> =>
        issue.rule === 'duplicate-in-file' ? { id: 'GIT-2026-0409', row: '3' } : {},
    );
    expect(rowErrors.map((item) => [item.field, item.key, item.message])).toEqual([
      [
        'rows.6.studentId',
        'IA-11.row.studentId.duplicate-in-file',
        'Student ID GIT-2026-0409 is also in row 3. Each student needs a different ID.',
      ],
      [
        'rows.9.programme',
        'IA-11.row.programme.required',
        'Programme is empty. Every row needs the student’s programme.',
      ],
      ['rows.12.email', 'IA-11.row.email.in-people', null],
    ]);
    expect(
      fieldErrorsFromDomain(
        'QuestionBankService.commitQuestionImport',
        [{ field: 'row 4', rule: 'marks' }],
        {},
      ).map((item) => [item.field, item.key]),
    ).toEqual([['rows.4', 'FA-17.row.marks']]);
    const changes = { changes: [{ courseId: 'crs-me-zg523', code: 'ME ZG523', expectedRev: 2 }] };
    expect(
      fieldErrorsFromDomain(
        'PlatformCourseCodeService.save',
        [{ field: 'crs-me-zg523', rule: 'code-taken' }],
        changes,
        () => ({
          code: 'ME ZG523',
          course: 'Heat Transfer',
        }),
      ).map((item) => item.field),
    ).toEqual(['changes.0.code']);
  });

  it('carries policy-open and every other refusal through unchanged — never an allow or a deny', () => {
    const refusals: Refusal[] = [
      { kind: 'policy-open', decision: 'OD-B2-01' },
      { kind: 'refused', code: 'institution-paused' },
      { kind: 'not-permitted', why: 'out-of-scope' },
      { kind: 'invalid-state', current: 'withdrawn' },
      { kind: 'conflict', code: 'already-sent' },
    ];
    for (const refusal of refusals) {
      expect(fromDomainRefusal('StudentAccessService.giveAccess', refusal, {}, 'IA-05')).toEqual(
        refusal,
      );
    }
    expect(
      fromDomainRefusal(
        'StudentAccessService.giveAccess',
        { kind: 'validation-failed', issues: [{ field: 'experimentIds', rule: 'required' }] },
        {},
        'IA-05',
      ),
    ).toEqual({
      kind: 'validation-failed',
      fieldErrors: [
        {
          field: 'experimentIds',
          key: 'IA-05.experimentIds.required',
          message: 'Choose at least one experiment',
          params: {},
        },
      ],
      summaryTitle: 'Check this step',
    });
  });
});

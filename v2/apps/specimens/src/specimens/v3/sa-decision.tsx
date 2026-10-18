'use client';

/*
 * V3 specimens of SA-03 (Request decision), composed from @xr/ui/v3 with the SA02 board's
 * illustrative records. HARNESS ONLY: the choices, the "missing" hints, the summary of what is
 * missing and the outcome shown after Confirm are this specimen's UI state, there to exercise the
 * shared components (choice cards, error summary, field errors, the native confirmation dialog,
 * the outcome) in a browser. It is NOT a decision model: no record changes, no status rule, no
 * validation contract. The product keeps SA-03's existing decision view, commands, revision checks
 * and refusals (apps/web features/admin/sa-03-request-decision) — never copy this code into it.
 */
import {
  AskList,
  AskRow,
  Breadcrumbs,
  ButtonLink,
  Button,
  ChangeSummary,
  CheckGroup,
  ChoiceGroup,
  ConfirmDialog,
  CourseCode,
  DecisionOutcome,
  DecisionPanel,
  DefinitionList,
  DetailLayout,
  ErrorSummary,
  EventSteps,
  FactStrip,
  Field,
  FormatBadges,
  FormatCells,
  FormatKey,
  LockedValue,
  MetaSeparator,
  Notice,
  PageHead,
  PendingHint,
  Quote,
  RecordLine,
  Select,
  StatusPill,
  SurfaceSection,
  TextInput,
  Textarea,
  Timeline,
  type ConfirmDialogGroup,
  type StatusTone,
  type TimelineEvent,
} from '@xr/ui/v3';
import type { FormatCode } from '@xr/ui';
import { useEffect, useRef, useState } from 'react';

import { SuperAdminShell } from './shells';

interface AskedExperiment {
  readonly title: string;
  readonly code?: string;
  readonly course?: string;
  readonly requested: readonly FormatCode[];
  /** Published formats, where the board compares them (the cells); otherwise badges only. */
  readonly published?: readonly FormatCode[];
}

interface DecisionRecord {
  readonly key: 'gdv' | 'ren' | 'kon' | 'viz';
  readonly asOf: string;
  readonly when: string;
  readonly institution: string;
  readonly contact: string;
  readonly email?: string;
  readonly phone?: string;
  readonly type: 'New access' | 'Additional licences' | 'Renewal';
  readonly received: string;
  /** Set when the institution was first approved; absent for a new institution. */
  readonly route?: 'Internal' | 'External';
  readonly experiments: readonly AskedExperiment[];
  readonly licences?: string;
  readonly term?: string;
  readonly existing: string;
  readonly message?: string;
  readonly renewal: boolean;
  readonly paused: boolean;
  /** A record the board shows already decided (viz: approved, payment required). */
  readonly decided?: 'pay';
}

/** SA02 `RQ` records used by the specimens (scenario dates as the board's `SNAP`). */
const RECORDS: Readonly<Record<DecisionRecord['key'], DecisionRecord>> = {
  gdv: {
    key: 'gdv',
    asOf: 'Thursday 8 October 2026',
    when: '8 Oct 2026, 11:20',
    institution: 'Godavari Institute of Technology',
    contact: 'Meera Iyer',
    email: 'meera.iyer@godavari.edu.in',
    phone: 'Not given',
    type: 'New access',
    received: '2 Oct 2026, 10:14',
    experiments: [
      {
        title: 'Shell-and-Tube Heat Exchanger',
        code: 'ME ZG523',
        course: 'Thermodynamics & Heat Transfer',
        requested: ['WEB', 'VR'],
        published: ['WEB', 'AR', 'VR'],
      },
    ],
    licences: '120',
    term: 'Yearly',
    existing:
      'None. There is no institution record for Godavari Institute of Technology yet. Approving this request creates the record; it does not activate access.',
    message:
      'We would like to start with the heat exchanger lab for our ME ZG523 cohort this term, in the browser and in VR.',
    renewal: false,
    paused: false,
  },
  ren: {
    key: 'ren',
    asOf: 'Friday 23 October 2026',
    when: '23 Oct 2026',
    institution: 'BITS Pilani — Hyderabad Campus',
    contact: 'A. Menon',
    email: 'a.menon@hyderabad.bits-pilani.ac.in',
    phone: 'Not given',
    type: 'Renewal',
    received: '24 Sep 2026, 16:02',
    route: 'Internal',
    experiments: [
      {
        title: 'Composite Wall Conduction',
        code: 'ME ZG523',
        course: 'Thermodynamics & Heat Transfer',
        requested: ['WEB', 'AR'],
        published: ['WEB', 'AR'],
      },
      {
        title: 'Fin-Tube Bundle',
        code: 'ME ZG523',
        course: 'Thermodynamics & Heat Transfer',
        requested: ['WEB', 'VR'],
        published: ['WEB', 'VR'],
      },
      {
        title: 'Investment Casting',
        code: 'MEL ZG512',
        course: 'Manufacturing Processes',
        requested: ['WEB'],
        published: ['WEB'],
      },
    ],
    licences: '860',
    term: 'Yearly',
    existing:
      'The current access plan holds these 3 experiments and 860 licences. Its current term ends on 31 Oct 2026.',
    message: 'Renewal for the next academic year, same experiments.',
    renewal: true,
    paused: false,
  },
  kon: {
    key: 'kon',
    asOf: 'Friday 23 October 2026',
    when: '23 Oct 2026',
    institution: 'Konark Polytechnic',
    contact: 'R. Bhatt',
    email: 'r.bhatt@konarkpoly.edu.in',
    phone: '+91 674 000 0000',
    type: 'Additional licences',
    received: '29 Sep 2026, 12:37',
    route: 'External',
    experiments: [
      {
        title: 'Buck Converter Ripple',
        code: 'EEE ZG512',
        course: 'Power Electronics',
        requested: ['WEB', 'AR'],
        published: ['WEB', 'AR'],
      },
    ],
    licences: '60 more',
    term: 'Current term',
    existing:
      'An access plan with Buck Converter Ripple (WEB, AR) and 180 licences. The institution is paused.',
    message: 'A second section has joined the course.',
    renewal: false,
    paused: true,
  },
  viz: {
    key: 'viz',
    asOf: 'Friday 23 October 2026',
    when: '23 Oct 2026',
    institution: 'Vizag Polytechnic',
    contact: 'K. Rao',
    type: 'New access',
    received: '22 Sep 2026',
    route: 'External',
    experiments: [{ title: 'Distillation Column', requested: ['WEB', 'VR'] }],
    existing:
      'Institution record created at approval. No institutional access yet; it is activated only after the payment is confirmed.',
    renewal: false,
    paused: false,
    decided: 'pay',
  },
};

const FORMAT_NAMES: Readonly<Record<FormatCode, string>> = {
  WEB: 'Browser',
  AR: 'Augmented reality',
  VR: 'Virtual reality',
  MR: 'Mixed reality',
};

type Choice = 'approve' | 'smaller' | 'info';
type Outcome = 'pay' | 'active' | 'info';

const OUTCOME_STATUS: Readonly<Record<Outcome | 'review', { tone: StatusTone; words: string }>> = {
  review: { tone: 'info', words: 'Under review' },
  pay: { tone: 'warn', words: 'Approved — payment required' },
  active: { tone: 'ok', words: 'Access active' },
  info: { tone: 'err', words: 'Information requested' },
};

function AskedFormats({ experiment }: { readonly experiment: AskedExperiment }) {
  const label = `Formats requested: ${experiment.requested.join(', ')}${
    experiment.published ? `. Published: ${experiment.published.join(', ')}.` : '.'
  }`;
  if (!experiment.published) {
    return <FormatBadges formats={experiment.requested} label={label} />;
  }
  const published = experiment.published;
  return (
    <FormatCells
      variant="strip"
      label={label}
      cells={(['WEB', 'AR', 'VR', 'MR'] as const).map((format) => {
        const requested = experiment.requested.includes(format);
        const state = requested ? 'on' : published.includes(format) ? 'pub' : 'none';
        return {
          format,
          state,
          words: state === 'on' ? 'Requested' : state === 'pub' ? 'Not requested' : 'Not published',
        };
      })}
    />
  );
}

/** The record sheet (`DetailLayout` main): facts, contact, what is asked, history, events. */
function RecordSheet({
  record,
  route,
  existing,
  history,
  showEvents,
}: {
  readonly record: DecisionRecord;
  readonly route: string | null;
  readonly existing: string;
  readonly history: readonly TimelineEvent[];
  readonly showEvents: boolean;
}) {
  const compared = record.experiments.some((experiment) => experiment.published);
  return (
    <>
      <FactStrip
        facts={[
          { term: 'Experiments', value: String(record.experiments.length) },
          ...(record.licences ? [{ term: 'Licences requested', value: record.licences }] : []),
          ...(record.term ? [{ term: 'Access term', value: record.term }] : []),
          { term: 'Internal or external', value: route ?? 'Not set yet', quiet: !route },
        ]}
      />
      <SurfaceSection title="Organisation and contact person" titleId="dc-org">
        <DefinitionList
          items={[
            { term: 'Institution', value: record.institution },
            { term: 'Contact person', value: record.contact },
            ...(record.email ? [{ term: 'E-mail', value: record.email }] : []),
            ...(record.phone ? [{ term: 'Phone', value: record.phone }] : []),
          ]}
        />
      </SurfaceSection>
      <SurfaceSection
        title="What they’re asking for"
        titleId="dc-ask"
        aside={
          compared ? (
            <FormatKey
              items={[
                { state: 'on', words: 'Requested' },
                { state: 'pub', words: 'Published, not requested' },
                { state: 'none', words: 'Not published' },
              ]}
            />
          ) : undefined
        }
      >
        <AskList>
          {record.experiments.map((experiment) => (
            <AskRow
              key={experiment.title}
              title={experiment.title}
              course={
                experiment.code ? (
                  <>
                    <CourseCode code={experiment.code} />
                    <span>{experiment.course}</span>
                  </>
                ) : undefined
              }
              formats={<AskedFormats experiment={experiment} />}
            />
          ))}
        </AskList>
      </SurfaceSection>
      <SurfaceSection title="Existing access" titleId="dc-exist">
        <RecordLine>{existing}</RecordLine>
      </SurfaceSection>
      {record.message ? (
        <SurfaceSection title="Message from the requester" titleId="dc-msg">
          <Quote by={`${record.contact}, contact person`}>{record.message}</Quote>
        </SurfaceSection>
      ) : null}
      <SurfaceSection title="History" titleId="dc-hist">
        <Timeline events={history} />
      </SurfaceSection>
      {showEvents ? (
        <SurfaceSection
          title="What happens after you decide"
          titleId="dc-events"
          aside={<p>Four separate events</p>}
        >
          <EventSteps
            steps={[
              {
                title: 'Institution record',
                description:
                  'Created when you approve the first request from a new institution. A record is not access.',
              },
              {
                title: 'Request approval',
                description:
                  'Your decision on this page. External: the request becomes Approved — payment required. Internal: approved with no payment step.',
              },
              {
                title: 'Payment confirmation',
                description:
                  'External only. It happens after the requester pays and is not recorded on this page.',
              },
              {
                title: 'Institutional access activation',
                description:
                  'Internal: when you approve. External: only after the payment is confirmed. Students get access only when the institution administrator gives it.',
              },
            ]}
            note="Request more information keeps the request open; none of the four events happen until it is approved."
          />
        </SurfaceSection>
      ) : null}
    </>
  );
}

/** The decision specimen for one SA02 record. */
export function SaDecisionSpecimen({ recordKey }: { readonly recordKey: DecisionRecord['key'] }) {
  const record = RECORDS[recordKey];
  const isNew = !record.route && !record.decided;
  const firstExperiment = record.experiments[0];
  const [choice, setChoice] = useState<Choice | null>(null);
  const [route, setRoute] = useState<'Internal' | 'External' | null>(null);
  const [formats, setFormats] = useState<FormatCode[]>([...(firstExperiment?.requested ?? [])]);
  const [licences, setLicences] = useState(record.licences ?? '');
  const [term, setTerm] = useState(record.term ?? 'Yearly');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<
    Partial<Record<'choice' | 'route' | 'diff' | 'reason', string>>
  >({});
  const [confirming, setConfirming] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(record.decided ?? null);
  const outcomeRef = useRef<HTMLDivElement>(null);
  /** Decided on this page (not a record the board shows already decided). */
  const [decidedHere, setDecidedHere] = useState(false);

  useEffect(() => {
    if (outcome && decidedHere) outcomeRef.current?.focus();
  }, [outcome, decidedHere]);

  const effectiveRoute = record.route ?? route;
  const approving = choice === 'approve' || choice === 'smaller';
  const differences =
    choice === 'smaller'
      ? [
          ...(formats.length !== (firstExperiment?.requested.length ?? 0)
            ? [
                `Formats: ${firstExperiment?.requested.join(', ')} → ${formats.join(', ') || 'none'}`,
              ]
            : []),
          ...(licences !== record.licences ? [`Licences: ${record.licences} → ${licences}`] : []),
          ...(term !== record.term ? [`Term: ${record.term} → ${term}`] : []),
        ]
      : [];
  const pending = !choice
    ? null
    : approving && !effectiveRoute
      ? 'Choose internal or external before approving.'
      : choice === 'smaller' && (differences.length === 0 || !reason.trim())
        ? 'Change at least one thing and give a reason before approving.'
        : choice === 'info' && !reason.trim()
          ? 'Add your question before sending.'
          : null;
  const goLabel =
    choice === 'info'
      ? 'Send request for information'
      : choice === 'smaller'
        ? 'Approve smaller scope'
        : 'Approve request';

  const press = () => {
    const found: typeof errors = {};
    if (!choice) found.choice = 'Choose a decision';
    if (approving && !effectiveRoute) found.route = 'Choose internal or external';
    if (choice === 'smaller' && differences.length === 0) {
      found.diff = 'Change at least one thing, or choose Approve request';
    }
    if ((choice === 'smaller' || choice === 'info') && !reason.trim()) {
      found.reason =
        choice === 'info'
          ? 'Enter what you need from the requester'
          : 'Enter the reason for the change';
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    if (choice === 'info') {
      setDecidedHere(true);
      setOutcome('info');
    } else {
      setConfirming(true);
    }
  };

  const confirmGroups: ConfirmDialogGroup[] = [
    {
      kind: 'now',
      title: 'What happens now',
      items: [
        ...(isNew
          ? [
              `Creates the institution record for ${record.institution}, classified ${
                effectiveRoute === 'Internal' ? 'internal' : 'external'
              }.`,
            ]
          : []),
        ...(effectiveRoute === 'External'
          ? ['Approves the request. Its status becomes Approved — payment required.']
          : [
              'Approves the request. There is no payment step.',
              'Institutional access is activated now and the access plan is created.',
            ]),
        ...(choice === 'smaller' ? ['The requester sees what changed and your reason.'] : []),
      ],
    },
    {
      kind: 'later',
      title: 'Only after later events',
      items: [
        ...(effectiveRoute === 'External'
          ? [
              isNew
                ? 'Institutional access is not activated now. It is activated only after the payment is confirmed.'
                : 'The additional licences are added only after the payment is confirmed. Current access continues unchanged.',
            ]
          : []),
        'Students get access only when the institution administrator gives it.',
      ],
    },
  ];

  const status = OUTCOME_STATUS[outcome ?? 'review'];
  const routeWords = effectiveRoute === 'Internal' ? 'internal' : 'external';
  const decisionHistory: TimelineEvent[] =
    outcome && decidedHere
      ? outcome === 'info'
        ? [
            {
              what: 'Information requested',
              when: `${record.when} by Arjun Mehta`,
              note: reason ? `“${reason}”` : undefined,
            },
          ]
        : [
            ...(outcome === 'active'
              ? [
                  {
                    what: 'Institutional access activated',
                    when: record.when,
                    note: 'No payment step (internal). Access plan created.',
                  },
                ]
              : []),
            {
              what: `${choice === 'smaller' ? 'Request approved with a smaller scope' : 'Request approved'} (${routeWords})`,
              when: `${record.when} by Arjun Mehta`,
              note: `${isNew ? 'Institution record created. ' : ''}${
                outcome === 'pay'
                  ? 'Status: Approved — payment required. Access not active until the payment is confirmed.'
                  : 'No payment step.'
              }`,
            },
          ]
      : [];
  const history: TimelineEvent[] = [
    ...decisionHistory,
    { what: 'Request submitted', when: `${record.received} by ${record.contact}, contact person` },
  ];
  const existing =
    outcome === 'pay' && decidedHere && isNew
      ? `Institution record created by this approval on ${record.when}. No institutional access yet; it is activated only after the payment is confirmed.`
      : outcome === 'active' && decidedHere && isNew
        ? `Institution record created on ${record.when}. Institutional access active since then (internal, no payment step).`
        : outcome === 'info' && isNew
          ? `None. There is no institution record for ${record.institution} yet.`
          : record.existing;

  const summaryItems = [
    ...(errors.choice ? [{ fieldId: 'dc-choice', summaryText: errors.choice }] : []),
    ...(errors.route ? [{ fieldId: 'dc-route', summaryText: errors.route }] : []),
    ...(errors.diff ? [{ fieldId: 'dc-lic', summaryText: errors.diff }] : []),
    ...(errors.reason ? [{ fieldId: 'dc-reason', summaryText: errors.reason }] : []),
  ];

  const stand =
    outcome === 'info'
      ? [
          { term: 'Institution record', value: isNew ? 'Not created' : 'Exists' },
          { term: 'Request', value: 'Information requested' },
          { term: 'Payment', value: 'Not started' },
          { term: 'Institutional access', value: isNew ? 'Not active' : 'Active, unchanged' },
        ]
      : outcome === 'pay'
        ? [
            {
              term: 'Institution record',
              value: decidedHere && isNew ? `Created ${record.when}` : 'Created',
            },
            { term: 'Request', value: `Approved (${routeWords})` },
            { term: 'Payment', value: 'Waiting, not confirmed' },
            { term: 'Institutional access', value: 'Not active' },
          ]
        : [
            {
              term: 'Institution record',
              value: decidedHere && isNew ? `Created ${record.when}` : 'Exists',
            },
            { term: 'Request', value: `Approved (${routeWords})` },
            { term: 'Payment', value: 'Not needed (internal)' },
            { term: 'Institutional access', value: `Active since ${record.when}` },
          ];
  const next =
    outcome === 'pay'
      ? 'The requester now sees Continue to payment on their request status. Institutional access is not active until the payment is confirmed.'
      : outcome === 'active'
        ? 'Institutional access is active. The institution administrator can now give students access.'
        : 'The request stays open. Your question is on the requester’s request status.';

  let panel;
  if (outcome) {
    panel = (
      <DecisionOutcome
        outcomeRef={outcomeRef}
        id="dc-done"
        status={
          <StatusPill tone={status.tone} size="lg">
            {status.words}
          </StatusPill>
        }
        meta={
          decidedHere
            ? outcome === 'info'
              ? `Sent by you on ${record.when}`
              : `Decided by you on ${record.when}, ${routeWords}`
            : undefined
        }
        stand={stand}
        next={next}
        action={<ButtonLink href="/v3-sa-02">Back to requests</ButtonLink>}
      />
    );
  } else if (record.paused) {
    panel = (
      <Notice
        tone="paused"
        role="status"
        title="This institution is paused"
        actions={<ButtonLink href="#">View institution</ButtonLink>}
      >
        Requests from a paused institution can’t be decided. You can decide this one once the pause
        ends.
      </Notice>
    );
  } else {
    panel = (
      <>
        <ErrorSummary title="Check your decision" id="dc-errs" items={summaryItems} />
        <ChoiceGroup
          legend="Decision"
          id="dc-choice"
          name="dc-choice"
          value={choice}
          error={errors.choice}
          onChange={(value) => {
            setChoice(value);
            setErrors({});
          }}
          options={[
            {
              value: 'approve',
              title: 'Approve request',
              description: 'Approve what they asked for.',
            },
            {
              value: 'smaller',
              title: 'Approve a smaller scope',
              description: record.renewal
                ? 'Not available for a renewal. The term continues the current plan.'
                : 'Fewer formats, fewer licences or a shorter term, with a reason.',
              unavailable: record.renewal,
            },
            {
              value: 'info',
              title: 'Request more information',
              description: 'The request stays open. Your question is shown to the requester.',
            },
          ]}
        />
        {approving && !record.route ? (
          <ChoiceGroup
            legend="Internal or external"
            legendHint="Required to approve. You set this; the requester never chooses it."
            id="dc-route"
            name="dc-route"
            value={route}
            error={errors.route}
            onChange={(value) => {
              setRoute(value);
              setErrors((current) => ({ ...current, route: undefined }));
            }}
            options={[
              {
                value: 'Internal',
                title: 'Internal: BITS campus or programme',
                description: 'No payment step. Institutional access is activated when you approve.',
              },
              {
                value: 'External',
                title: 'External institution',
                description:
                  'Approval, then payment. Institutional access is activated only after the payment is confirmed.',
              },
            ]}
          />
        ) : null}
        {approving && record.route ? (
          <LockedValue>
            Internal or external: <b>{record.route}</b>. Set when this institution was first
            approved.
          </LockedValue>
        ) : null}
        {choice === 'smaller' ? (
          <>
            <CheckGroup
              legend="Formats to approve"
              id="dc-fm"
              values={formats}
              onChange={setFormats}
              options={(firstExperiment?.requested ?? []).map((format) => ({
                value: format,
                label: format,
                detail: FORMAT_NAMES[format],
              }))}
            />
            <Field label="Licences to approve" id="dc-lic" error={errors.diff}>
              <TextInput
                inputMode="numeric"
                value={licences}
                onChange={(event) => setLicences(event.target.value)}
              />
            </Field>
            <Field label="Access term" id="dc-term">
              <Select
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                options={[
                  { value: 'Monthly', label: 'Monthly' },
                  { value: 'Quarterly', label: 'Quarterly' },
                  { value: 'Yearly', label: 'Yearly' },
                ]}
              />
            </Field>
            {differences.length > 0 ? (
              <ChangeSummary title="Different from the request" lines={differences} />
            ) : null}
          </>
        ) : null}
        {choice === 'smaller' || choice === 'info' ? (
          <Field
            label={
              choice === 'info'
                ? 'What do you need from the requester? (required)'
                : 'Reason for the change (required)'
            }
            id="dc-reason"
            hint="Shown to the requester on their request status."
            error={errors.reason}
          >
            <Textarea value={reason} onChange={(event) => setReason(event.target.value)} />
          </Field>
        ) : null}
        {pending ? <PendingHint>{pending}</PendingHint> : null}
        <Button variant="primary" className="rk-go" onClick={press}>
          {goLabel}
        </Button>
      </>
    );
  }

  return (
    <SuperAdminShell current="requests" date={record.asOf}>
      <PageHead
        variant="record"
        title={record.institution}
        titleId="dc-title"
        titleFocusTarget
        date={record.asOf}
        eyebrow="Institutional access request"
        breadcrumbs={
          <Breadcrumbs
            levels={[{ label: 'Requests', href: '/v3-sa-02' }]}
            current={record.institution}
          />
        }
        meta={
          <>
            <StatusPill tone={status.tone} size="lg">
              {status.words}
            </StatusPill>
            <span>{record.type}</span>
            <MetaSeparator />
            <span>Received {record.received}</span>
          </>
        }
        goTo={{ label: 'Go to decision', targetId: 'dc-panel' }}
      />
      <DetailLayout
        asideId="dc-panel"
        asideLabelledBy="dc-panel-h"
        main={
          <RecordSheet
            record={record}
            route={outcome && outcome !== 'info' ? effectiveRoute : (record.route ?? null)}
            existing={existing}
            history={history}
            showEvents={!outcome}
          />
        }
        aside={
          <DecisionPanel title="Your decision" titleId="dc-panel-h">
            {panel}
          </DecisionPanel>
        }
      />
      <ConfirmDialog
        open={confirming}
        idPrefix="dlg"
        title={`${choice === 'smaller' ? 'Approve a smaller scope for' : 'Approve the request from'} ${record.institution}?`}
        description="Check what approving does now, and what happens only after later events."
        groups={confirmGroups}
        confirmLabel={goLabel}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setDecidedHere(true);
          setConfirming(false);
          setOutcome(effectiveRoute === 'Internal' ? 'active' : 'pay');
        }}
      />
    </SuperAdminShell>
  );
}

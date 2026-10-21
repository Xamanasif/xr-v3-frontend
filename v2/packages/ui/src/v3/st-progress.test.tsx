/**
 * What the Student progress group alone draws (owner-approved export design/v3-refined-b/roles/
 * ST-v1, `project/StudentFinal.dc.html` regions `progress`, `feedback` and `device`): each piece is
 * rendered with sample values and checked against the export — every class it emits is one the
 * export's template draws in its region, the structure and ARIA the template gives it — then the
 * class contract, the behaviour (chip focus, error links, radios), the identifier rule and axe.
 */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  assertNoAxeViolations,
  expectNoInternalReferences,
  expectV3ClassesOnly,
  stExportText,
} from '../testing/index.js';
import { Button, ButtonLink } from './actions.js';
import { Field, TextInput } from './fields.js';
import { Notice } from './notices.js';
import { StAside, StHowTo, StOverview, StSideSection, StSideText, StSideTitle } from './st.js';
import {
  StDeviceCard,
  StDeviceFacts,
  StDeviceForm,
  StDeviceNow,
  StDevicePrevious,
  StDeviceRequest,
  StDeviceSteps,
  StFeedbackComments,
  StFeedbackErrors,
  StFeedbackFoot,
  StFeedbackScale,
  StFeedbackSent,
  StFeedbackSheet,
  StFeedbackStatement,
  StProgressGroup,
  StProgressHead,
  StProgressPanel,
  StProgressTools,
  type StProgressChip,
} from './st-progress.js';

const MAIN = stExportText('StudentFinal.dc.html');
const TEMPLATE = MAIN.slice(0, MAIN.indexOf('<script type="text/x-dc"'));
const SCRIPT = MAIN.slice(MAIN.indexOf('<script type="text/x-dc"'));
const STUDENT_REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|ATT|ASMT)-\d+/;

/** The template region between two section markers. */
function region(start: string, end: string): string {
  const from = TEMPLATE.indexOf(start);
  const to = TEMPLATE.indexOf(end, from);
  expect(from, start).toBeGreaterThan(-1);
  expect(to, end).toBeGreaterThan(from);
  return TEMPLATE.slice(from, to);
}

/**
 * Classes the template writes through a binding (`class="{{ q.cls }}"`), as the script builds them
 * (`fbVM`: `'st-fbq sv-lk-q' + (err ? ' is-invalid' : '')`, `'sv-lk-sel' + (… ' is-set' …)`,
 * `'sv-lk-dot' + (… ' is-on' …)`; `devVM`: `x.done ? 'is-done' : x.now ? 'is-now'`). Each is
 * checked in the script below.
 */
const BOUND = {
  feedback: [
    "'st-fbq sv-lk-q'",
    "' is-invalid'",
    "'sv-lk-sel'",
    "' is-set'",
    "'sv-lk-dot'",
    "' is-on'",
  ],
  device: ["'is-done'", "'is-now'"],
} as const;
const boundNames = (quoted: readonly string[]) =>
  quoted.flatMap((entry) => entry.replace(/'/g, '').trim().split(/\s+/));

const PROGRESS = region('ST-15 Progress (all experiments)', 'ST-16 Format feedback');
const FEEDBACK = `${region('ST-16 Format feedback', 'ST-11 Assessments')} class="${boundNames(BOUND.feedback).join(' ')}"`;
const DEVICE = `${region('ST-18 My device', 'Help & support')} class="${boundNames(BOUND.device).join(' ')}"`;

it('the bound classes are the script’s own', () => {
  for (const quoted of [...BOUND.feedback, ...BOUND.device]) expect(SCRIPT).toContain(quoted);
});

/** The static class names a region's template writes (`class="…"`, bindings left out). */
function classesOf(html: string): Set<string> {
  const names = new Set<string>();
  for (const match of html.matchAll(/class="([^"]*)"/g)) {
    for (const name of (match[1] ?? '').split(/\s+/)) {
      if (name && !name.includes('{{')) names.add(name);
    }
  }
  return names;
}

/** Every class the rendered piece emits is drawn in its export region (the kit's own excepted). */
function expectDrawnIn(root: Element, html: string, kit: readonly string[] = []) {
  const drawn = classesOf(html);
  const emitted = new Set<string>();
  for (const element of [root, ...root.querySelectorAll('[class]')]) {
    for (const name of element.classList) emitted.add(name);
  }
  expect([...emitted].filter((name) => !drawn.has(name) && !kit.includes(name))).toEqual([]);
}

function expectNoStudentReference(root: Element) {
  expectNoInternalReferences(root);
  expect(root.textContent ?? '').not.toMatch(STUDENT_REFERENCE);
}

// The format chip's state classes (`xr-fmt sv-fmt sv-fmt--on`) come through `{{ f.fmtCls }}`
// bindings; the status pill's through `{{ D.pillCls }}`; the kit draws both.
const CHIP = ['xr-fmt', 'sv-fmt', 'sv-fmt--on', 'sv-fmt--held'];
const PILL = ['xr-st', 'xr-st--warn', 'xr-st--info', 'xr-st--ok', 'rk-st-lg'];

describe('ST-15 progress panel, filters and groups', () => {
  function Tools({ onClear = () => undefined }: { readonly onClear?: () => void }) {
    const [shown, setShown] = useState<readonly string[]>(['status', 'course']);
    const remove = (key: string): void => {
      setShown((current) => current.filter((entry) => entry !== key));
    };
    const all: readonly StProgressChip[] = [
      {
        key: 'status',
        label: 'Status: Completed',
        removeLabel: 'Remove filter Status: Completed',
        onRemove: () => remove('status'),
      },
      {
        key: 'course',
        label: 'Course: MEC-523',
        removeLabel: 'Remove filter Course: MEC-523',
        onRemove: () => remove('course'),
      },
    ];
    const chips = all.filter((chip) => shown.includes(chip.key));
    return (
      <StProgressPanel title="Your progress by course" titleId="p-h">
        <StProgressTools
          label="Filter your progress"
          filters={[
            {
              id: 'p-st',
              label: 'Status',
              value: 'done',
              options: [
                { value: 'all', label: 'All statuses' },
                { value: 'done', label: 'Completed' },
              ],
              onChange: () => undefined,
            },
            {
              id: 'p-c',
              label: 'Course',
              value: 'all',
              options: [{ value: 'all', label: 'All courses' }],
              onChange: () => undefined,
            },
          ]}
          count="0 of 1 experiment"
          chips={chips}
          clearLabel="Clear filters"
          onClear={() => {
            setShown([]);
            onClear();
          }}
        />
        <StProgressGroup
          code="MEC-523"
          title="Thermodynamics & Heat Transfer"
          titleId="p-g1"
          count="1 experiment"
          note="Your progress is kept and stays here."
        >
          <article aria-labelledby="p-e1">
            <StProgressHead
              title="Shell-and-Tube Heat Exchanger"
              titleId="p-e1"
              given="Given by your institution"
              open={{
                href: '/student/experiments/shell',
                label: 'Open experiment',
                ariaLabel: 'Open experiment Shell-and-Tube Heat Exchanger',
              }}
            />
          </article>
        </StProgressGroup>
      </StProgressPanel>
    );
  }

  it('draws the export’s structure and names', async () => {
    const { container } = render(<Tools />);
    const panel = screen.getByRole('region', { name: 'Your progress by course' });
    expect(panel).toHaveClass('sv-card', 'sv-prog');
    expect(panel.querySelector('h2.xr-sr')).toHaveTextContent('Your progress by course');
    const search = screen.getByRole('search', { name: 'Filter your progress' });
    expect(search).toHaveClass('sv-ptools-f');
    expect(within(search).getByRole('combobox', { name: 'Status' })).toHaveValue('done');
    expect(search.querySelector('.sv-pfield > .rk-selwrap > select.rk-select')).not.toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('0 of 1 experiment');
    expect(screen.getByRole('status')).toHaveClass('rk-count');
    expect([...container.querySelectorAll('.rk-chip')].map((chip) => chip.textContent)).toEqual([
      'Status: Completed',
      'Course: MEC-523',
    ]);
    const group = screen.getByRole('group', { name: 'Thermodynamics & Heat Transfer' });
    expect(group.querySelector('.sv-pgroup-h > .rk-owncode')).toHaveTextContent('MEC-523');
    expect(group.querySelector('.sv-pgroup-d')).toHaveTextContent('1 experiment');
    expect(group.querySelector('.sv-pgroup-note')).not.toBeNull();
    expect(
      screen.getByRole('heading', { level: 4, name: 'Shell-and-Tube Heat Exchanger' }),
    ).toHaveClass('sv-pexp-t');
    expect(
      screen.getByRole('link', { name: 'Open experiment Shell-and-Tube Heat Exchanger' }),
    ).toHaveClass('sv-link');
    expectDrawnIn(container.firstElementChild!, PROGRESS);
    expectV3ClassesOnly(container);
    expectNoStudentReference(container);
    await assertNoAxeViolations(container);
  });

  it('a removed chip hands focus to the next chip, then the previous one, then the first select', () => {
    const onClear = vi.fn();
    render(<Tools onClear={onClear} />);
    const first = screen.getByRole('button', { name: 'Remove filter Status: Completed' });
    first.focus();
    fireEvent.click(first);
    expect(screen.getByRole('button', { name: 'Remove filter Course: MEC-523' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Remove filter Course: MEC-523' }));
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull();
  });

  it('“Clear filters” clears and hands focus to the first select', () => {
    const onClear = vi.fn();
    render(<Tools onClear={onClear} />);
    const clear = screen.getByRole('button', { name: 'Clear filters' });
    expect(clear).toHaveClass('rk-clear');
    clear.focus();
    fireEvent.click(clear);
    expect(onClear).toHaveBeenCalledOnce();
    expect(screen.getByRole('combobox', { name: 'Status' })).toHaveFocus();
  });
});

describe('ST-16 rating sheet and ST-17 sent answers', () => {
  const POINTS = [
    { value: 1, label: 'Strongly disagree' },
    { value: 2, label: 'Disagree' },
    { value: 3, label: 'Neither agree nor disagree' },
    { value: 4, label: 'Agree' },
    { value: 5, label: 'Strongly agree' },
  ];

  function Sheet({ failed = false }: { readonly failed?: boolean }) {
    const [value, setValue] = useState<number | null>(null);
    return (
      <StFeedbackSheet label="Feedback on WEB" onSubmit={(event) => event.preventDefault()}>
        <StFeedbackErrors
          id="fb-errs"
          title="One rating is missing"
          items={[
            { fieldId: 'fb-q2', focusId: 'fb-q2-1', text: 'Choose a rating for statement 2' },
          ]}
        />
        {failed ? (
          <Notice
            tone="warn"
            icon="alertCircle"
            role="alert"
            className="sv-fb-msg"
            id="fb-fail"
            title="Your feedback wasn’t sent"
          >
            Nothing was lost — your answers are still here. Try again.
          </Notice>
        ) : null}
        <StFeedbackScale title="Rate each statement" points={POINTS} />
        <StFeedbackStatement
          id="fb-q1"
          legend="1. This experience helped me understand the concept."
          points={POINTS}
          value={value}
          onChange={setValue}
          ends={['Strongly disagree', 'Strongly agree']}
          chosen={value === null ? 'Not rated yet' : `${value} — Agree`}
        />
        <StFeedbackStatement
          id="fb-q2"
          legend="2. The instructions were clear and easy to follow."
          points={POINTS}
          value={null}
          onChange={() => undefined}
          ends={['Strongly disagree', 'Strongly agree']}
          chosen="Not rated yet"
          error="Choose a rating for statement 2"
        />
        <StFeedbackComments
          id="fb-c"
          label="Additional comments (optional)"
          value=""
          onChange={() => undefined}
        />
        <StFeedbackFoot>
          <ButtonLink href="/web" size="lg">
            Cancel
          </ButtonLink>
          <Button variant="primary" size="lg" type="submit">
            Submit feedback
          </Button>
        </StFeedbackFoot>
      </StFeedbackSheet>
    );
  }

  it('draws the sheet as the export does: summary, scale head, statements, comments, foot', async () => {
    const { container } = render(<Sheet failed />);
    const sheet = screen.getByRole('region', { name: 'Feedback on WEB' });
    expect(sheet).toHaveClass('sv-card', 'sv-fb');
    const summary = screen.getAllByRole('alert')[0]!;
    expect(summary).toHaveClass('rk-errsum', 'sv-fb-msg');
    expect(summary).toHaveFocus();
    expect(summary.querySelector('.rk-errsum-t')).toHaveTextContent('One rating is missing');
    expect(container.querySelector('#fb-fail')).toHaveClass('rk-notice--warn', 'sv-fb-msg');
    expect(container.querySelector('.sv-lk-head')).toHaveAttribute('aria-hidden', 'true');
    const [first, second] = screen.getAllByRole('group');
    expect(first).toHaveClass('st-fbq', 'sv-lk-q');
    expect(first).not.toHaveClass('is-invalid');
    expect(second).toHaveClass('is-invalid');
    expect(second).toHaveAttribute('aria-describedby', 'fb-q2-e');
    expect(second!.querySelector('#fb-q2-e')).toHaveTextContent('Choose a rating for statement 2');
    expect(
      within(first!)
        .getAllByRole('radio')
        .map((radio) => radio.id),
    ).toEqual(['fb-q1-1', 'fb-q1-2', 'fb-q1-3', 'fb-q1-4', 'fb-q1-5']);
    expect(within(first!).getByRole('radio', { name: 'Agree' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Additional comments (optional)' })).toHaveClass(
      'rk-textarea',
    );
    expect(container.querySelector('.rk-field.sv-fb-c')).not.toBeNull();
    expectDrawnIn(container.firstElementChild!, FEEDBACK, ['rk-x-errsum-target', 'rb-btn--lg']);
    expectV3ClassesOnly(container);
    expectNoStudentReference(container);
    await assertNoAxeViolations(container);
  });

  it('a choice sets its words for the narrow sheet; a summary link focuses its statement’s radio', () => {
    render(<Sheet />);
    const first = screen.getAllByRole('group')[0]!;
    expect(first.querySelector('.sv-lk-sel')).not.toHaveClass('is-set');
    fireEvent.click(within(first).getByRole('radio', { name: 'Agree' }));
    expect(first.querySelector('.sv-lk-sel')).toHaveClass('is-set');
    expect(first.querySelector('.sv-lk-sel')).toHaveTextContent('4 — Agree');
    fireEvent.click(screen.getByRole('link', { name: 'Choose a rating for statement 2' }));
    expect(document.getElementById('fb-q2-1')).toHaveFocus();
  });

  it('draws the sent answers on the same scale, read-only', async () => {
    const { container } = render(
      <StFeedbackSent
        thanks="Thank you"
        line="Sent 14 Oct 2026, 15:42. Feedback can’t be changed after it’s sent."
        actions={
          <>
            <ButtonLink href="/hub" variant="primary">
              Back to experiment
            </ButtonLink>
            <ButtonLink href="/progress">See your progress</ButtonLink>
          </>
        }
        answersTitle="Your answers · WEB"
        answersTitleId="fb-ans"
        note="Read-only"
        points={[1, 2, 3, 4, 5]}
        answers={[
          { key: '1', statement: '1. This experience …', value: 4, words: '4 — Agree' },
          { key: '2', statement: '2. The instructions …', value: 5, words: '5 — Strongly agree' },
        ]}
        comments={{ label: 'Additional comments', text: '—' }}
      />,
    );
    const cardNode = screen.getByRole('region', { name: 'Your answers · WEB' });
    expect(cardNode).toHaveClass('sv-card', 'sv-fbsent');
    expect(screen.getByRole('status')).toHaveTextContent('Thank you');
    const dots = [...container.querySelectorAll('.sv-fbsent-dl > div:first-child .sv-lk-dot')];
    expect(dots.map((dot) => dot.classList.contains('is-on'))).toEqual([
      false,
      false,
      false,
      true,
      false,
    ]);
    expect(container.querySelector('.sv-lk-dots')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.sv-fbsent-c dd')).toHaveTextContent('—');
    expect(within(cardNode).queryByRole('radio')).toBeNull();
    expectDrawnIn(container.firstElementChild!, FEEDBACK, ['rb-btn', 'rb-btn--primary']);
    expectV3ClassesOnly(container);
    expectNoStudentReference(container);
    await assertNoAxeViolations(container);
  });
});

describe('ST-18 device card', () => {
  it('draws the device, the form, the request as three steps, the facts and the aside', async () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
    const { container } = render(
      <StOverview>
        <StDeviceCard>
          <StDeviceNow
            titleId="dev-h"
            device={{
              eyebrow: 'Authorised device',
              name: 'ME lab VR headset, asset tag GIT-VR-03',
              chip: { code: 'VR', kind: 'on' },
              usedForLabel: 'Used for VR: ',
              usedFor: 'Shell-and-Tube Heat Exchanger',
            }}
            action={
              <Button variant="primary" size="lg" icon="swap">
                Request a device transfer
              </Button>
            }
          />
          <StDeviceForm
            titleId="dtf-h"
            title="Request a device transfer"
            from={{ label: 'Moving from', device: 'ME lab VR headset, asset tag GIT-VR-03' }}
            rule="Your Institute Admin forwards the request to BITS, and BITS decides."
            onSubmit={onSubmit}
            actions={
              <Button variant="primary" size="lg" type="submit">
                Send request
              </Button>
            }
          >
            <Field id="dev-new" label="New device" error="Describe the new device">
              <TextInput />
            </Field>
          </StDeviceForm>
          <StDeviceRequest
            titleId="dtr-h"
            title="Your transfer request"
            status={{ tone: 'info', words: 'Forwarded to BITS' }}
          >
            <StDeviceSteps
              id="dtr-st"
              explain="BITS decides. Nothing changes on your device yet."
              label="Steps of your transfer request"
              steps={[
                {
                  key: 'r',
                  title: 'Requested',
                  detail: '22 Oct 2026, 09:10',
                  state: 'done',
                  ariaLabel: 'Requested, done, 22 Oct 2026, 09:10',
                },
                {
                  key: 'f',
                  title: 'Forwarded to BITS',
                  detail: 'Meera Iyer · 23 Oct 2026, 10:00',
                  state: 'done',
                  ariaLabel: 'Forwarded to BITS, done, Meera Iyer · 23 Oct 2026, 10:00',
                },
                {
                  key: 'd',
                  title: 'BITS decides',
                  detail: 'With BITS now',
                  state: 'now',
                  ariaLabel: 'BITS decides, current, With BITS now',
                },
              ]}
            />
            <Notice
              tone="warn"
              icon="alertCircle"
              role="status"
              className="sv-devnoia"
              title="This request can’t be forwarded yet"
            >
              Your institution has no Institute Admin right now.
            </Notice>
            <StDeviceFacts
              facts={[
                { key: 'f', term: 'From', detail: 'GIT-VR-03' },
                { key: 't', term: 'To', detail: 'GIT-VR-07' },
                { key: 'n', term: 'Your note', detail: 'Gone for repair.' },
              ]}
            />
            <StDevicePrevious>Earlier request · approved 24 Oct 2026</StDevicePrevious>
          </StDeviceRequest>
        </StDeviceCard>
        <StAside labelledBy="dev-how">
          <StSideSection>
            <StSideTitle id="dev-how">How a transfer works</StSideTitle>
            <StHowTo
              device
              steps={[{ key: 'a', title: 'You ask for the transfer', detail: 'Name it.' }]}
            />
            <StSideText className="sv-devnote">
              A transfer only changes which device is authorised.
            </StSideText>
          </StSideSection>
        </StAside>
      </StOverview>,
    );
    const now = screen.getByRole('region', { name: 'ME lab VR headset, asset tag GIT-VR-03' });
    expect(now).toHaveClass('sv-devsec', 'sv-devnow');
    expect(now.querySelector('.sv-devuse .xr-sr')).toHaveTextContent('Used for VR:');
    expect(now.querySelector('.sv-devnow-act .rb-btn--primary')).not.toBeNull();
    const form = screen.getByRole('form', { name: 'Request a device transfer' });
    expect(form).toHaveClass('sv-devsec', 'sv-devform');
    expect(form.querySelector('dl.sv-devfrom')).toHaveTextContent('Moving from');
    fireEvent.submit(form);
    expect(onSubmit).toHaveBeenCalledOnce();
    const request = screen.getByRole('region', { name: 'Your transfer request' });
    expect(request.querySelector('.sv-devreq-h .xr-st.xr-st--info.rk-st-lg')).toHaveTextContent(
      'Forwarded to BITS',
    );
    const steps = screen.getByRole('list', { name: 'Steps of your transfer request' });
    expect(steps).toHaveClass('sv-steps', 'sv-devsteps');
    expect([...steps.querySelectorAll('li')].map((item) => item.className)).toEqual([
      'is-done',
      'is-done',
      'is-now',
    ]);
    expect(
      within(steps)
        .getAllByRole('listitem')
        .map((item) => item.getAttribute('aria-label')),
    ).toEqual([
      'Requested, done, 22 Oct 2026, 09:10',
      'Forwarded to BITS, done, Meera Iyer · 23 Oct 2026, 10:00',
      'BITS decides, current, With BITS now',
    ]);
    expect(container.querySelector('#dtr-st')).toHaveAttribute('tabindex', '-1');
    expect(request.querySelector('.sv-devnoia')).toHaveAttribute('role', 'status');
    expect(request.querySelector('dl.sv-devdl')).toHaveTextContent('Your note');
    expect(container.querySelector('.sv-side-d.sv-devnote')).not.toBeNull();
    expectDrawnIn(container.firstElementChild!, DEVICE, [
      ...CHIP,
      ...PILL,
      'xr-ico--18',
      'rk-field',
      'rk-label',
      'rk-input',
      'rk-ferr',
      'xr-ico',
      'sv-howto',
      'sv-how-n',
      'sv-howto-t',
      'sv-howto-d',
    ]);
    expectV3ClassesOnly(container);
    expectNoStudentReference(container);
    await assertNoAxeViolations(container);
  });

  it('draws “No authorised device is recorded for you” and the paused lock', async () => {
    const { container } = render(
      <StDeviceCard>
        <StDeviceNow
          titleId="dev-h"
          none={{
            title: 'No authorised device is recorded for you',
            text: 'Your institution can tell you more.',
          }}
          lock="You can’t request a transfer while your institution’s access is paused."
        />
        <StDeviceRequest
          titleId="dtr-h"
          title="Transfer requests"
          none="No transfer requests yet."
        />
      </StDeviceCard>,
    );
    expect(container.querySelector('.sv-devico.sv-devico--off')).not.toBeNull();
    expect(
      screen.getByRole('heading', { level: 2, name: 'No authorised device is recorded for you' }),
    ).toHaveClass('sv-devname');
    expect(container.querySelector('.sv-devlock')).toHaveTextContent('paused');
    expect(container.querySelector('.sv-devnone')).toHaveTextContent('No transfer requests yet.');
    expect(container.querySelector('.xr-st')).toBeNull();
    expectDrawnIn(container.firstElementChild!, DEVICE);
    expectV3ClassesOnly(container);
    await assertNoAxeViolations(container);
  });
});

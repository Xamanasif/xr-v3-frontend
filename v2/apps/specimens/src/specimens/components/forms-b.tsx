'use client';

import {
  Button,
  ErrorSummary,
  Field,
  FileInput,
  FormFooter,
  Icon,
  SegmentedControl,
  Stepper,
} from '@xr/ui';
import { useRef, useState } from 'react';

/**
 * Forms specimens, group B (Appendix E §3.2: SegmentedControl, FileInput, Stepper, ErrorSummary,
 * FormFooter / FlowFooter). Test infrastructure only: board sample words, and `data-probe`
 * harness read-outs that let the browser specs prove behaviour (they are not product copy).
 */

const REPORT_VIEWS = [
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'all', label: 'All' },
] as const;

type ReportView = (typeof REPORT_VIEWS)[number]['value'];

/** Board 03 "Segmented control" and B2-05 "Step 2 · students" ("Give access to"). */
export function SegmentedControlSpecimen() {
  const [view, setView] = useState<ReportView>('open');
  return (
    <div className="xr-app">
      <main className="xr-page">
        {/* xw-stack: the product container that keeps xr-seg at its own width (xr-workspace.css). */}
        <div className="xr-content xw-stack">
          <h1 className="xr-h1">My reports</h1>
          <SegmentedControl
            label="Show reports"
            options={REPORT_VIEWS}
            value={view}
            onValueChange={setView}
          />
          <p className="xr-meta" role="status" data-probe="view">
            {`Showing: ${view}`}
          </p>
          <SegmentedControl
            label="Give access to"
            options={[
              { value: 'students', label: 'Students' },
              { value: 'group', label: 'A group' },
            ]}
          />
        </div>
      </main>
    </div>
  );
}

/**
 * Board 07 "State 1 · Report a problem · Student" (with the hint) and board 03 "Textarea · select ·
 * file": FileInput inside the Field that gives it its label, marker and hint.
 */
export function FileInputSpecimen() {
  const [chosen, setChosen] = useState(0);
  return (
    <div className="xr-app">
      <main className="xr-page">
        <div className="xr-content xr-stack">
          <h1 className="xr-h1">Report a problem</h1>
          <Field
            id="s1-shot"
            label="Screenshot"
            marker="(optional)"
            hint="A picture of the screen can help."
          >
            <FileInput
              accept="image/*"
              onChange={(event) => setChosen(event.currentTarget.files?.length ?? 0)}
            />
          </Field>
          <Field id="c-file" label="Screenshot" marker="(optional)">
            <FileInput accept="image/*" />
          </Field>
          <p className="xr-meta" role="status" data-probe="chosen">
            {`Files chosen: ${chosen}`}
          </p>
        </div>
      </main>
    </div>
  );
}

const GIVE_ACCESS_STEPS = ['Experiments', 'Students', 'Review and give access'];

/**
 * Board 03 "Stepper · guided flows (AR-5)" (step 2 of 3, with its count) and 09a AR-5 (step 1),
 * inside `xr-content` so the phone rule (below 600 px of content) applies as in the product.
 */
export function StepperSpecimen() {
  return (
    <div className="xr-app">
      <main className="xr-page">
        <div className="xr-content xr-stack" data-probe="content">
          <h1 className="xr-h1">Give students access</h1>
          <div data-probe="step-2">
            <Stepper label="Give students access" steps={GIVE_ACCESS_STEPS} current={2} showCount />
          </div>
          <div data-probe="step-1">
            <Stepper label="Give students access" steps={GIVE_ACCESS_STEPS} current={1} />
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Board 03 "Form controls" (the two fields and the summary copy) with the B4-04 behaviour: the
 * summary appears on Continue and takes focus (the component's default); Continue again focuses
 * it again through its ref; each link moves focus to its field. The fields are drawn as board 03
 * draws them, so this specimen does not depend on the forms-a field components.
 */
export function ErrorSummarySpecimen() {
  const [attempts, setAttempts] = useState(0);
  const summary = useRef<HTMLDivElement>(null);
  const invalid = attempts > 0;
  const submit = () => {
    if (invalid) summary.current?.focus();
    setAttempts((count) => count + 1);
  };
  return (
    <div className="xr-app">
      <main className="xr-page">
        <div className="xr-content xr-stack">
          <h1 className="xr-h1">Report a problem</h1>
          <ErrorSummary
            ref={summary}
            id="c-err"
            title="Two things need fixing before you can continue"
            items={
              invalid
                ? [
                    { fieldId: 'c-in3', summaryText: 'Enter a full e-mail address' },
                    { fieldId: 'c-ta', summaryText: 'Say what happened' },
                  ]
                : []
            }
          />
          <div className="xr-field">
            <label className="xr-label" htmlFor="c-in3">
              Institution e-mail
            </label>
            <input
              id="c-in3"
              className="xr-input"
              type="email"
              aria-invalid={invalid ? true : undefined}
              aria-describedby={invalid ? 'c-in3-e' : undefined}
            />
            {invalid ? (
              <span id="c-in3-e" className="xr-error">
                <Icon name="failed" />
                Enter a full e-mail address, like name@institution.edu
              </span>
            ) : null}
          </div>
          <div className="xr-field">
            <label className="xr-label" htmlFor="c-ta">
              What happened?
            </label>
            <span className="xr-hint" id="c-ta-h">
              Say what you were doing and what you saw.
            </span>
            <textarea
              id="c-ta"
              className="xr-textarea"
              aria-invalid={invalid ? true : undefined}
              aria-describedby={invalid ? 'c-ta-h c-ta-e' : 'c-ta-h'}
            />
            {invalid ? (
              <span id="c-ta-e" className="xr-error">
                <Icon name="failed" />
                Say what happened, so it can be looked into
              </span>
            ) : null}
          </div>
          <div>
            <Button variant="primary" onClick={submit} data-probe="continue">
              Continue
            </Button>
          </div>
          <p className="xr-meta" data-probe="attempts">{`Attempts: ${attempts}`}</p>
        </div>
      </main>
    </div>
  );
}

/**
 * B2-05, B4-04 and B6-09 footers inside `xr-content`, so the phone rule (below 600 px of content:
 * actions full width, above the quiet action) applies as in the product. Pressing "Give access"
 * makes it busy, so the browser can prove repeat presses are ignored.
 */
export function FormFooterSpecimen() {
  const [presses, setPresses] = useState(0);
  return (
    <div className="xr-app">
      <main className="xr-page">
        <div className="xr-content xr-stack" data-probe="content">
          <h1 className="xr-h1" id="c-ff-title" tabIndex={-1}>
            Give students access
          </h1>
          <div data-probe="cancel-footer">
            <FormFooter
              start={{ kind: 'link', label: 'Cancel', href: '#c-ff-title' }}
              save={{ label: 'Save as draft' }}
              primary={{ label: 'Continue' }}
            />
          </div>
          <div data-probe="back-footer">
            <FormFooter
              start={{ kind: 'button', label: 'Back' }}
              primary={{
                label: 'Give access',
                busy: presses > 0,
                busyLabel: 'Giving access…',
                onClick: () => setPresses((count) => count + 1),
              }}
            />
          </div>
          <div data-probe="destructive-footer">
            <FormFooter
              start={{ kind: 'destructive', label: 'Withdraw update' }}
              save={{ label: 'Save draft' }}
              primary={{ label: 'Send for academic review' }}
            />
          </div>
          <p className="xr-meta" role="status" data-probe="presses">
            {`Presses: ${presses}`}
          </p>
        </div>
      </main>
    </div>
  );
}

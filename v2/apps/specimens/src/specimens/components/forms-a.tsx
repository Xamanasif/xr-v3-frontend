'use client';

import {
  Button,
  Checkbox,
  CheckboxGroup,
  ChoiceCard,
  ChoiceList,
  Field,
  Radio,
  RadioGroup,
  ReadOnlyValue,
  Select,
  Textarea,
  TextInput,
} from '@xr/ui';
import { useState, type FormEvent, type ReactNode } from 'react';

/**
 * Form specimens (Appendix E §3.2 Field, TextInput, Select, Textarea, Checkbox / Radio groups and
 * ChoiceCard; boards 03, 09a, 09b, B1-07, B1-11, B2-05, B2-07, B5-04, B7-08). Copy is board copy. The
 * `role="status"` lines are harness probes that show the controlled React state in a real browser.
 * Validation is the caller's, as the cited boards draw it: on the primary action only, and a
 * change to a field or group clears that one's error (B2-07, B1-07, B5-04).
 */
function FormPage({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <div className="xr-app">
      <main className="xr-page">
        <div className="xr-wrap xr-wrap--form xr-content">
          <div className="xr-stack">
            <h1 className="xr-h1">{title}</h1>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function FormSection({
  id,
  title,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="xr-section" aria-labelledby={id}>
      <div className="xr-section-head">
        <h2 className="xr-h2" id={id}>
          {title}
        </h2>
      </div>
      <div className="xr-section-body xr-stack">{children}</div>
    </section>
  );
}

type StudentKey = 'name' | 'email' | 'sid';

/** B2-07 "IA-10 Add student · 1440 · interactive": its required fields and drawn messages. */
const REQUIRED: readonly (readonly [StudentKey, string])[] = [
  ['name', 'Enter the full name'],
  ['email', 'Enter the institution e-mail'],
  ['sid', 'Enter the student ID'],
];

export function FieldSpecimen() {
  const [values, setValues] = useState<Record<StudentKey | 'programme', string>>({
    name: '',
    email: '',
    sid: '',
    programme: '',
  });
  const [errors, setErrors] = useState<Partial<Record<StudentKey, string>>>({});
  const [checks, setChecks] = useState(0);
  // As B2-07 draws it: editing a field clears that field's own error; nothing is validated while
  // typing, and every error comes from the primary action.
  const update = (key: StudentKey | 'programme') => (event: { target: { value: string } }) => {
    setValues((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) =>
      Object.fromEntries(Object.entries(current).filter(([name]) => name !== key)),
    );
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors(
      Object.fromEntries(REQUIRED.filter(([key]) => !values[key].trim())) as Partial<
        Record<StudentKey, string>
      >,
    );
    setChecks((count) => count + 1);
  };
  return (
    <FormPage title="Add student">
      <FormSection id="f-who" title="Student details">
        <form className="xr-stack" noValidate onSubmit={submit}>
          <Field id="Aa-name" label="Full name" error={errors.name} errorClass="xw-ferr">
            <TextInput value={values.name} onChange={update('name')} />
          </Field>
          <Field id="Aa-email" label="Institution e-mail" error={errors.email} errorClass="xw-ferr">
            <TextInput
              type="email"
              placeholder="name@godavari.edu.in"
              value={values.email}
              onChange={update('email')}
            />
          </Field>
          <Field
            id="Aa-sid"
            label="Student ID"
            hint="Your institution’s ID for this student, for example GIT-2026-0418."
            error={errors.sid}
            errorClass="xw-ferr"
          >
            <TextInput value={values.sid} onChange={update('sid')} />
          </Field>
          <Field id="Aa-prog" label="Programme" marker="(optional)">
            <TextInput value={values.programme} onChange={update('programme')} />
          </Field>
          <Field id="Aa-grp" label="Group" marker="(optional)">
            <Select
              defaultValue=""
              options={[
                { value: '', label: 'No group' },
                { value: 'g1', label: 'ME ZG523 — Sem II' },
                { value: 'g2', label: 'Lab batch B' },
              ]}
            />
          </Field>
          <div>
            <Button variant="primary" type="submit">
              Add student
            </Button>
          </div>
          <p role="status" data-probe="checks">
            {checks === 0 ? 'Not checked yet' : `Checked ${checks}`}
          </p>
        </form>
      </FormSection>
      <FormSection id="f-ro" title="Read-only values">
        <ReadOnlyValue label="Licences">
          Access plan ACC-0107 · 120 licences · Yearly, ends 7 Oct 2027
        </ReadOnlyValue>
        <ReadOnlyValue label="Student ID" note="Read-only · set at import">
          GIT-2026-0418
        </ReadOnlyValue>
      </FormSection>
    </FormPage>
  );
}

export function TextInputSpecimen() {
  const [query, setQuery] = useState('');
  return (
    <FormPage title="Text inputs">
      <FormSection id="t-types" title="Types">
        <Field id="c-in1" label="Full name">
          <TextInput placeholder="For example, Rahul Verma" />
        </Field>
        <Field
          id="c-in3"
          label="Institution e-mail"
          error="Enter a full e-mail address, like name@institution.edu"
        >
          <TextInput type="email" defaultValue="rahul.verma@godavari" />
        </Field>
        <Field id="Rr-phone" label="Phone" marker="(optional)">
          <TextInput type="tel" autoComplete="tel" />
        </Field>
        <Field id="Rr-until" label="End date">
          <TextInput type="date" />
        </Field>
      </FormSection>
      <FormSection id="t-search" title="Search">
        <div className="xr-toolbar">
          <Field id="ar2-s" label="Search" className="xr-toolbar-search">
            <TextInput
              type="search"
              placeholder="Reference or institution"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </Field>
        </div>
        <p role="status" data-probe="query">
          {query === '' ? 'No search yet' : `Searching for ${query}`}
        </p>
      </FormSection>
    </FormPage>
  );
}

export function SelectSpecimen() {
  const [course, setCourse] = useState(
    'ME ZG531 — Computational Fluid Dynamics and Heat Transfer Applications (sample)',
  );
  return (
    <FormPage title="Selects">
      <FormSection id="s-course" title="Course">
        <Field id="c-sel" label="Course">
          <Select
            value={course}
            onChange={(event) => setCourse(event.target.value)}
            options={[
              { label: 'ME ZG523 — Thermodynamics & Heat Transfer' },
              {
                label:
                  'ME ZG531 — Computational Fluid Dynamics and Heat Transfer Applications (sample)',
              },
            ]}
          />
        </Field>
        <p role="status" data-probe="course">
          {course}
        </p>
        <div className="xr-toolbar">
          <Field id="ar2-f" label="Status">
            <Select
              options={[
                { label: 'All statuses' },
                { label: 'Under review' },
                { label: 'Information requested' },
                { label: 'Approved — payment required' },
                { label: 'Access active' },
              ]}
            />
          </Field>
        </div>
      </FormSection>
      <FormSection id="s-invalid" title="Scope">
        <Field id="Rh-scs" label="Course" error="Choose a course">
          <Select
            defaultValue=""
            options={[
              { value: '', label: 'Choose a course' },
              { value: 'ME ZG523', label: 'ME ZG523 · Thermodynamics & Heat Transfer' },
              { value: 'MEL ZG512', label: 'MEL ZG512 · Manufacturing Processes' },
            ]}
          />
        </Field>
      </FormSection>
    </FormPage>
  );
}

export function TextareaSpecimen() {
  return (
    <FormPage title="Textareas">
      <FormSection id="a-report" title="Report a problem">
        <Field id="c-ta" label="What happened?" hint="Say what you were doing and what you saw.">
          <Textarea defaultValue="The VR simulation stopped loading at the second step." />
        </Field>
        <Field id="ar6-c" label="Anything else?" marker="(optional)">
          <Textarea />
        </Field>
      </FormSection>
      <FormSection id="a-reason" title="Your decision">
        <Field
          id="c-dr"
          label="Reason for returning"
          error="Add a reason so the vendor knows what to change"
        >
          <Textarea />
        </Field>
      </FormSection>
    </FormPage>
  );
}

const EXPERIMENTS = ['Shell-and-Tube Heat Exchanger', 'Conduction Through a Composite Wall'];
const TERMS = ['Monthly', 'Quarterly', 'Yearly'];
/** B5-04 "VE-04 Formats and delivery": the format rows' words (the board puts a badge first). */
const FORMATS = [
  ['WEB', 'Browser (WEB)'],
  ['AR', 'Augmented reality (AR)'],
  ['VR', 'Virtual reality (VR)'],
  ['MR', 'Mixed reality (MR)'],
] as const;

export function ChoiceSpecimen() {
  const [experiments, setExperiments] = useState<readonly string[]>([
    'Shell-and-Tube Heat Exchanger',
  ]);
  const [group, setGroup] = useState<string | null>('Section A');
  const [term, setTerm] = useState<string | null>(null);
  const [termError, setTermError] = useState<string | undefined>(undefined);
  const [formats, setFormats] = useState<readonly string[]>([]);
  const [formatsError, setFormatsError] = useState<string | undefined>(undefined);
  const [decision, setDecision] = useState<string | null>(null);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // The caller's validation on the primary action, with B1-07's drawn message.
    setTermError(term === null ? 'Choose how long you need access' : undefined);
  };
  const submitFormats = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // The caller's validation on the primary action, with B5-04's drawn message.
    setFormatsError(formats.length === 0 ? 'Choose at least one format' : undefined);
  };
  return (
    <FormPage title="Choices">
      <FormSection id="h-checks" title="Experiments">
        <CheckboxGroup legend="Experiments to give">
          {EXPERIMENTS.map((name) => (
            <Checkbox
              key={name}
              checked={experiments.includes(name)}
              onChange={(event) =>
                setExperiments((current) =>
                  event.target.checked
                    ? [...current, name]
                    : current.filter((chosen) => chosen !== name),
                )
              }
            >
              {name}
            </Checkbox>
          ))}
        </CheckboxGroup>
        <p role="status" data-probe="experiments">
          {experiments.length === 0 ? 'None chosen' : experiments.join(' · ')}
        </p>
        <RadioGroup legend="Group" name="c-grp" value={group} onValueChange={setGroup}>
          <Radio value="Section A">ME ZG523 · Sem II · Section A</Radio>
          <Radio value="Section B">ME ZG523 · Sem II · Section B</Radio>
        </RadioGroup>
        <p role="status" data-probe="group">
          {group ?? 'No group'}
        </p>
      </FormSection>
      <FormSection id="h-term" title="For how long">
        <form className="xr-stack" noValidate onSubmit={submit}>
          <RadioGroup
            id="Rr-term"
            legend="Access term"
            name="Rr-term"
            hint="BITS confirms the term when it decides the request."
            error={termError}
            value={term}
            onValueChange={(next) => {
              setTerm(next);
              setTermError(undefined); // B1-07: choosing a term clears its error.
            }}
          >
            <ChoiceList>
              {TERMS.map((label) => (
                <ChoiceCard key={label} value={label} title={label} sub="Recurring term" />
              ))}
              <ChoiceCard
                value="Until a fixed date"
                title="Until a fixed date"
                sub="Access ends on a date you choose"
              />
            </ChoiceList>
          </RadioGroup>
          <div>
            <Button variant="primary" type="submit">
              Review request
            </Button>
          </div>
        </form>
      </FormSection>
      <FormSection id="h-formats" title="Formats and delivery">
        <form className="xr-stack" noValidate onSubmit={submitFormats}>
          {/* B5-04 draws this group's legend as xr-label and its error before the options. */}
          <CheckboxGroup
            id="Dm-fmts"
            tabIndex={-1}
            legend="Formats it supports"
            legendClass="xr-label"
            hint="Choose every format you are delivering. Each one appears in the catalogue only after it passes review and publication."
            error={formatsError}
            errorPlacement="before-options"
          >
            {FORMATS.map(([code, words]) => (
              <Checkbox
                key={code}
                id={`Dm-f${code}`}
                checked={formats.includes(code)}
                onChange={(event) => {
                  setFormats((current) =>
                    event.target.checked
                      ? [...current, code]
                      : current.filter((chosen) => chosen !== code),
                  );
                  setFormatsError(undefined); // B5-04: a format change clears the group's error.
                }}
              >
                {words}
              </Checkbox>
            ))}
          </CheckboxGroup>
          <div>
            <Button variant="primary" type="submit">
              Continue
            </Button>
          </div>
        </form>
      </FormSection>
      {/* The decision panel as board 03 draws it (sticky only from 860 px of content). */}
      <aside className="xr-dpanel" aria-labelledby="h-dec">
        <h2 className="xr-dpanel-title" id="h-dec">
          Your decision
        </h2>
        <RadioGroup
          legend="Decision"
          legendClass="xr-sr"
          name="c-dec"
          value={decision}
          onValueChange={setDecision}
        >
          <ChoiceList>
            <ChoiceCard
              value="approve"
              title="Approve request"
              sub="Approve what they asked for."
            />
            <ChoiceCard
              value="smaller"
              title="Approve a smaller scope"
              sub="Not available for a renewal — the term continues the current plan."
              unavailable
            />
            <ChoiceCard
              value="info"
              title="Request more information"
              sub="The request stays open. Your question is shown to the requester."
            />
          </ChoiceList>
        </RadioGroup>
        <p role="status" data-probe="decision">
          {decision ?? 'No decision yet'}
        </p>
      </aside>
    </FormPage>
  );
}

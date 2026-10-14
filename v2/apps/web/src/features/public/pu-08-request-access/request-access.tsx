'use client';

import type { CatalogueEntry } from '@xr/contracts/draft';
import { FORMAT_META, type SelectionItem } from '@xr/domain';
import {
  BackLink,
  Button,
  ChoiceCard,
  ChoiceList,
  ErrorSummary,
  Field,
  FormatBadge,
  Link,
  Notice,
  RadioGroup,
  TextInput,
  Textarea,
} from '@xr/ui';
import { type FormEvent, useEffect, useRef, useState } from 'react';

import { courseLine } from '@/copy/public';
import {
  REQUEST_FORM,
  REQUEST_REVIEW,
  TERM_CHOICES,
  editLabel,
  itemsLine,
  termWords,
} from '@/copy/request-access';
import { stateWords } from '@/copy/state-copy';
import { DocumentTitle } from '@/features/shared/document-title';
import { noteRouteFocus } from '@/features/shared/workspace-frame/route-focus';
import { useAppNavigation } from '@/nav/navigation';
import {
  checkPublicRequest,
  type RequestCheck,
  type RequestField,
  requestErrors,
  withoutField,
} from '@/queries/public-request';
import {
  type RequestDraft,
  rememberSent,
  requestInput,
  useRequestDraft,
} from '@/queries/request-flow';
import { selectionSent, useSelection } from '@/queries/selection';
import { useCommand } from '@/queries/use-command';

import { PublicMain } from '../shell/public-frame';
import { nameOf, RequestStepper, useCatalogueNames } from '../shared/request-flow';

/**
 * The controls a field error and its summary link point to; the term's link goes to its first
 * option, as B1-07 draws it (`href: '#…-term-0'`).
 */
const FIELD_IDS: Readonly<Record<RequestField, string>> = {
  institutionName: 'request-institution',
  contactPerson: 'request-contact',
  email: 'request-email',
  licencesRequested: 'request-licences',
  term: 'request-term-0',
  'term.endsOn': 'request-ends-on',
};

const SENT_ADDRESS = '/request-access/sent';
const SENT_TITLE_ID = 'request-sent-title';
/** The error summary's id: focus lands there when the service refuses the details on Submit. */
const SUMMARY_ID = 'request-errors';

/**
 * PU-08 Request institutional access (B1-07; Appendix A PU-08 `/request-access?step=details|review`):
 * steps 2 and 3 of the request — organisation and contact person, what you need (the selection,
 * licences, an optional message), for how long — then "Check your request" with an Edit for every
 * answer, and Submit. Never asked: internal or external (BITS decides at approval, T-04), payment
 * details or prices. "Review request" checks the form against the request's own schema (the drawn
 * errors, summary first, each linked to its field); the service checks it again on Submit and
 * answers the reference and the status page's address — the ticket stays with this browser
 * session (O-05). Submit is busy and sent once; a failure keeps every answer. An empty selection
 * goes back to Your selection (P1-03); the review step's address with details missing falls back
 * to the details step (S4).
 */
export function RequestAccessPage() {
  const navigation = useAppNavigation();
  const step =
    new URLSearchParams(navigation.search).get('step') === 'review' ? 'review' : 'details';
  const { selection, ready } = useSelection();
  const names = useCatalogueNames();
  const [draft, update] = useRequestDraft();
  const [check, setCheck] = useState<RequestCheck | null>(null);
  // Each "Review request" with errors shows the summary anew, and it takes focus (B1-07 `reqFocus`).
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  // Leaving for the sent page or a guard's address: the guards stay quiet until the page has gone.
  const leaving = useRef(false);
  const submit = useCommand((ports) => ports.accessRequests.submitPublicRequest);

  const empty = ready && selection.items.length === 0;
  const incomplete = step === 'review' && checkPublicRequest(requestInput(draft)) !== null;

  useEffect(() => {
    if (leaving.current) return;
    if (empty) {
      leaving.current = true;
      navigation.navigate('/selection', { replace: true });
    } else if (ready && incomplete) {
      navigation.navigate('/request-access?step=details', { replace: true });
    }
  }, [empty, incomplete, ready, navigation]);

  // The step's heading takes focus when the step changes in the page (B1-07 `reqFocus` h1r / h1d);
  // an Edit focuses its field instead.
  const shownStep = useRef(step);
  const focusAfter = useRef<string | null>(null);
  useEffect(() => {
    if (shownStep.current === step) return;
    shownStep.current = step;
    const target =
      focusAfter.current ?? (step === 'review' ? 'request-review-title' : 'request-details-title');
    focusAfter.current = null;
    const element = document.getElementById(target);
    element?.focus({ preventScroll: false });
  }, [step]);

  if (!ready || empty || (step === 'review' && incomplete)) {
    return (
      <>
        <DocumentTitle title={REQUEST_FORM.title} />
        <PublicMain>
          <span className="xr-sr" role="status">
            {stateWords('PU-07.loading')}
          </span>
        </PublicMain>
      </>
    );
  }

  const set =
    (field: keyof RequestDraft, contractField: RequestField | null) => (value: string) => {
      update({ [field]: value } as Partial<RequestDraft>);
      // Typing in a field clears its error and its summary line (B1-07 `delete ne[name]`).
      if (contractField && check) setCheck(withoutField(check, contractField));
    };
  const errorOf = (field: RequestField): string | undefined =>
    check?.errors.find((error) => error.field === field)?.message;

  const onReview = (event: FormEvent) => {
    event.preventDefault();
    const found = checkPublicRequest(requestInput(draft));
    if (found) {
      setCheck(found);
      setAttempt((count) => count + 1);
      return;
    }
    setCheck(null);
    navigation.navigate('/request-access?step=review');
  };
  const toDetails = (fieldId: string | null) => {
    setFailed(false);
    focusAfter.current = fieldId;
    navigation.navigate('/request-access?step=details');
  };
  const onSubmit = async () => {
    setFailed(false);
    let answer;
    try {
      answer = await submit.run(requestInput(draft));
    } catch {
      // Unavailable: nothing was sent, every answer is kept (B1-07 f7).
      setFailed(true);
      window.setTimeout(() => document.getElementById('request-failed')?.focus(), 0);
      return;
    }
    if (answer.ok) {
      leaving.current = true;
      rememberSent({ reference: answer.value.reference, routeId: answer.value.routeId });
      noteRouteFocus(SENT_ADDRESS, SENT_TITLE_ID);
      navigation.navigate(SENT_ADDRESS, { replace: true });
      // The port emptied the selection with the request (B1-07): every reader reads it again.
      selectionSent();
      return;
    }
    if (answer.error.kind === 'validation-failed') {
      const found = requestErrors(answer.error);
      if (found.errors.length > 0) {
        setCheck(found);
        setAttempt((count) => count + 1);
        // Back to the details with the summary focused, not the heading (B1-07 `reqFocus(…errsum)`).
        toDetails(SUMMARY_ID);
        return;
      }
    }
    // The selection itself was refused (nothing left to send, a format no longer published):
    // back to Your selection, which shows it as it is now (state-copy `PU-08.selection-refused`).
    leaving.current = true;
    selectionSent();
    navigation.navigate('/selection', { replace: true });
  };

  return (
    <>
      <DocumentTitle title={step === 'review' ? REQUEST_REVIEW.title : REQUEST_FORM.title} />
      <PublicMain className="xp-page">
        <div className="xp-in xp-in--form">
          {step === 'details' ? (
            <Details
              draft={draft}
              items={selection.items}
              names={names.byId}
              check={check}
              attempt={attempt}
              set={set}
              errorOf={errorOf}
              onTerm={(term) => {
                update({ term });
                if (check) setCheck(withoutField(check, 'term'));
              }}
              onReview={onReview}
            />
          ) : (
            <Review
              draft={draft}
              items={selection.items}
              names={names.byId}
              failed={failed}
              busy={submit.busy}
              onEdit={toDetails}
              onSubmit={() => void onSubmit()}
            />
          )}
        </div>
      </PublicMain>
    </>
  );
}

function PartHead({
  id,
  part,
  title,
}: {
  readonly id: string;
  readonly part: string;
  readonly title: string;
}) {
  return (
    <div className="xp-fsec-head">
      <span className="xp-fsec-n">{part}</span>
      <h2 className="xp-fsec-title" id={id}>
        {title}
      </h2>
    </div>
  );
}

/** B1-07 "What you need": each selected experiment with its formats, and "Change" (to PU-07). */
function RequestItem({
  item,
  entry,
}: {
  readonly item: SelectionItem;
  readonly entry: CatalogueEntry | null;
}) {
  return (
    <div className="xp-reqitem">
      <div>
        <p className="xp-reqitem-t">{entry?.name ?? item.experimentId}</p>
        {entry ? (
          <p className="xp-reqitem-s">{courseLine(entry.platformCode, entry.courseName)}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="xp-fmts">
          {item.formats.map((format) => (
            <FormatBadge key={format} format={FORMAT_META[format].code} />
          ))}
        </span>
        <Link href="/selection">{REQUEST_FORM.change}</Link>
      </div>
    </div>
  );
}

function Details({
  draft,
  items,
  names,
  check,
  attempt,
  set,
  errorOf,
  onTerm,
  onReview,
}: {
  readonly draft: RequestDraft;
  readonly items: readonly SelectionItem[];
  readonly names: ReadonlyMap<string, CatalogueEntry> | null;
  readonly check: RequestCheck | null;
  readonly attempt: number;
  readonly set: (
    field: keyof RequestDraft,
    contractField: RequestField | null,
  ) => (value: string) => void;
  readonly errorOf: (field: RequestField) => string | undefined;
  readonly onTerm: (term: RequestDraft['term']) => void;
  readonly onReview: (event: FormEvent) => void;
}) {
  return (
    <>
      <BackLink href="/selection" className="mb-3">
        {REQUEST_FORM.backToSelection}
      </BackLink>
      <RequestStepper current={2} />
      <div className="xp-phead-main mb-7">
        <h1 className="xp-h1" id="request-details-title" tabIndex={-1}>
          {REQUEST_FORM.title}
        </h1>
        <p className="xp-lead">{REQUEST_FORM.lead}</p>
      </div>
      {check && check.errors.length > 0 ? (
        <ErrorSummary
          key={attempt}
          id={SUMMARY_ID}
          className="mb-6"
          title={check.title}
          items={check.errors.map((error) => ({
            fieldId: FIELD_IDS[error.field],
            summaryText: error.summaryText,
          }))}
        />
      ) : null}
      <form className="xp-form" noValidate onSubmit={onReview} aria-label={REQUEST_FORM.formName}>
        <section className="xp-fsec" aria-labelledby="request-part-1">
          <PartHead
            id="request-part-1"
            part={REQUEST_FORM.part1}
            title={REQUEST_FORM.organisation}
          />
          <Field
            label={REQUEST_FORM.institution}
            id={FIELD_IDS.institutionName}
            error={errorOf('institutionName')}
          >
            <TextInput
              autoComplete="organization"
              value={draft.institutionName}
              onChange={(event) => set('institutionName', 'institutionName')(event.target.value)}
            />
          </Field>
          <div className="flex max-w-[480px] flex-col gap-5">
            <Field
              label={REQUEST_FORM.contact}
              hint={REQUEST_FORM.contactHint}
              id={FIELD_IDS.contactPerson}
              error={errorOf('contactPerson')}
            >
              <TextInput
                autoComplete="name"
                value={draft.contactPerson}
                onChange={(event) => set('contactPerson', 'contactPerson')(event.target.value)}
              />
            </Field>
            <Field label={REQUEST_FORM.email} id={FIELD_IDS.email} error={errorOf('email')}>
              <TextInput
                type="email"
                autoComplete="email"
                value={draft.email}
                onChange={(event) => set('email', 'email')(event.target.value)}
              />
            </Field>
          </div>
          <div className="max-w-[340px]">
            <Field label={REQUEST_FORM.phone} marker={REQUEST_FORM.optional} id="request-phone">
              <TextInput
                type="tel"
                autoComplete="tel"
                value={draft.phone}
                onChange={(event) => set('phone', null)(event.target.value)}
              />
            </Field>
          </div>
        </section>
        <section className="xp-fsec" aria-labelledby="request-part-2">
          <PartHead id="request-part-2" part={REQUEST_FORM.part2} title={REQUEST_FORM.needs} />
          {items.map((item) => (
            <RequestItem
              key={item.experimentId}
              item={item}
              entry={names?.get(item.experimentId) ?? null}
            />
          ))}
          <div className="xp-num">
            <Field
              label={REQUEST_FORM.licences}
              hint={REQUEST_FORM.licencesHint}
              id={FIELD_IDS.licencesRequested}
              error={errorOf('licencesRequested')}
            >
              <TextInput
                inputMode="numeric"
                value={draft.licences}
                onChange={(event) => set('licences', 'licencesRequested')(event.target.value)}
              />
            </Field>
          </div>
          <Field label={REQUEST_FORM.message} marker={REQUEST_FORM.optional} id="request-message">
            <Textarea
              className="min-h-[104px]"
              value={draft.message}
              onChange={(event) => set('message', null)(event.target.value)}
            />
          </Field>
        </section>
        <section className="xp-fsec" aria-labelledby="request-part-3">
          <PartHead id="request-part-3" part={REQUEST_FORM.part3} title={REQUEST_FORM.howLong} />
          <RadioGroup
            legend={REQUEST_FORM.term}
            hint={REQUEST_FORM.termHint}
            // B1-07 spaces the hint `margin:-4px 0 8px` and the error `margin-top:8px` inline.
            hintClassName="-mt-1 mb-2"
            id="request-term"
            error={errorOf('term')}
            errorClassName="mt-2"
            value={draft.term}
            onValueChange={(value) => onTerm(value as RequestDraft['term'])}
          >
            <ChoiceList>
              {TERM_CHOICES.map((choice, index) => (
                <ChoiceCard
                  key={choice.value}
                  id={`request-term-${index}`}
                  value={choice.value}
                  title={choice.title}
                  sub={choice.sub}
                />
              ))}
            </ChoiceList>
          </RadioGroup>
          {draft.term === 'until-date' ? (
            <div className="max-w-[260px]">
              <Field
                label={REQUEST_FORM.endsOn}
                id={FIELD_IDS['term.endsOn']}
                error={errorOf('term.endsOn')}
              >
                <TextInput
                  type="date"
                  value={draft.endsOn}
                  onChange={(event) => set('endsOn', 'term.endsOn')(event.target.value)}
                />
              </Field>
            </div>
          ) : null}
        </section>
        <div className="xp-formfoot">
          <Link href="/selection">{REQUEST_FORM.backToSelection}</Link>
          <Button type="submit" variant="primary" className="xp-cta" icon="next" iconPosition="end">
            {REQUEST_FORM.review}
          </Button>
        </div>
      </form>
    </>
  );
}

function Review({
  draft,
  items,
  names,
  failed,
  busy,
  onEdit,
  onSubmit,
}: {
  readonly draft: RequestDraft;
  readonly items: readonly SelectionItem[];
  readonly names: ReadonlyMap<string, CatalogueEntry> | null;
  readonly failed: boolean;
  readonly busy: boolean;
  readonly onEdit: (fieldId: string | null) => void;
  readonly onSubmit: () => void;
}) {
  const term =
    draft.term === null
      ? '—'
      : termWords(
          draft.term === 'until-date'
            ? { kind: 'until-date', endsOn: draft.endsOn as never }
            : { kind: draft.term },
        );
  const rows: readonly {
    readonly label: string;
    readonly value: string;
    /** The field Edit goes back to; `null` for the selection's "Change". */
    readonly field: string | null;
  }[] = [
    {
      label: REQUEST_REVIEW.institution,
      value: draft.institutionName.trim() || '—',
      field: FIELD_IDS.institutionName,
    },
    {
      label: REQUEST_REVIEW.contact,
      value: draft.contactPerson.trim() || '—',
      field: FIELD_IDS.contactPerson,
    },
    { label: REQUEST_REVIEW.email, value: draft.email.trim() || '—', field: FIELD_IDS.email },
    {
      label: REQUEST_REVIEW.phone,
      value: draft.phone.trim() || REQUEST_REVIEW.phoneNone,
      field: 'request-phone',
    },
    {
      label: REQUEST_REVIEW.experiments,
      value: itemsLine(items, (id) => nameOf(names, id)),
      field: null,
    },
    {
      label: REQUEST_REVIEW.licences,
      value: draft.licences.trim() || '—',
      field: FIELD_IDS.licencesRequested,
    },
    { label: REQUEST_REVIEW.term, value: term, field: FIELD_IDS.term },
    {
      label: REQUEST_REVIEW.message,
      value: draft.message.trim() || REQUEST_REVIEW.messageNone,
      field: 'request-message',
    },
  ];
  return (
    <>
      <RequestStepper current={3} />
      <div className="xp-phead-main mb-6">
        <h1 className="xp-h1" id="request-review-title" tabIndex={-1}>
          {REQUEST_REVIEW.title}
        </h1>
        <p className="xp-lead">{REQUEST_REVIEW.lead}</p>
      </div>
      {failed ? (
        <Notice
          tone="err"
          role="alert"
          id="request-failed"
          tabIndex={-1}
          className="mb-5"
          title={REQUEST_REVIEW.failedTitle}
        >
          {REQUEST_REVIEW.failedLine}
        </Notice>
      ) : null}
      <section className="xp-fsec" aria-label={REQUEST_REVIEW.section}>
        <dl className="xp-review">
          {rows.map((row) => (
            <ReviewRow key={row.label} row={row} onEdit={onEdit} />
          ))}
        </dl>
      </section>
      <div className="mt-5">
        <Notice tone="quiet" role="note">
          {REQUEST_REVIEW.note}
        </Notice>
      </div>
      <div className="xp-formfoot mt-6">
        <Button variant="text" className="p-0" onClick={() => onEdit(null)}>
          {REQUEST_REVIEW.back}
        </Button>
        <Button
          variant="primary"
          className="xp-cta"
          icon="send"
          busy={busy}
          busyLabel={REQUEST_REVIEW.sending}
          onClick={onSubmit}
        >
          {REQUEST_REVIEW.submit}
        </Button>
        {busy ? (
          <span className="xr-sr" role="status">
            {REQUEST_REVIEW.sendingStatus}
          </span>
        ) : null}
      </div>
    </>
  );
}

function ReviewRow({
  row,
  onEdit,
}: {
  readonly row: { readonly label: string; readonly value: string; readonly field: string | null };
  readonly onEdit: (fieldId: string | null) => void;
}) {
  return (
    <>
      <dt>{row.label}</dt>
      <dd>{row.value}</dd>
      <dd>
        {row.field === null ? (
          <Link href="/selection" className="xp-edit">
            {REQUEST_REVIEW.change}
          </Link>
        ) : (
          <Button
            variant="text"
            className="xp-edit min-h-8 p-0"
            aria-label={editLabel(row.label)}
            onClick={() => onEdit(row.field)}
          >
            {REQUEST_REVIEW.edit}
          </Button>
        )}
      </dd>
    </>
  );
}

'use client';

import { FORMAT_META, inDisplayOrder } from '@xr/domain';
import {
  BackLink,
  Field,
  FormatBadge,
  Icon,
  Link,
  Notice,
  PageContent,
  PageHeader,
  ReasonDialog,
  Section,
  SectionBody,
  StatusPill,
  Textarea,
  Timeline,
} from '@xr/ui';
import { useEffect, useRef, useState } from 'react';

import {
  CONTENT_RECORD,
  inWorkflowLine,
  liveVersionWords,
  OVERRIDE_FROM,
  overriddenFlash,
  overrideTitle,
  overrideTo,
  staysLive,
  staysLiveUntilReleased,
  stuckAdvice,
  stuckWhy,
  updateTag,
} from '@/copy/content-oversight';
import { fieldWords } from '@/copy/field-words';
import { stateWords } from '@/copy/state-copy';
import {
  ALL_CONTENT_ADDRESS,
  contentRecordPlacement,
  contentUpdatesAddress,
  recordRefOf,
  updateDecisionAddress,
} from '@/nav/admin-content';
import { rolesAddress } from '@/nav/platform-roles';
import { useContentRecord } from '@/queries/admin-content';
import { useCommand } from '@/queries/use-command';

import { RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { type ContentRecordView, type RecordFacts, recordFacts } from './record-view';

/** The reason field's id (B7-06 `oreason`): focus goes to it on open and after its error. */
const REASON_ID = 'content-record-reason';
const MOVE_ID = 'content-record-override';

/**
 * SA-13 Content record — board B7-06 f1 (stuck, 1440), f2 (published · update waiting for you),
 * f3 (published · read-only), f4 (in the workflow), f5 (override · reason required), f6
 * (published · update on hold), f8 (375); B7-10 f5, f6; B7-12 f4 … f7 — at
 * `/admin/content/records/[recordId]` (a SUB reference, or the id of an experiment published
 * without one: `recordRefOf`).
 *
 * - **Read**: `ProductionService.getContentRecord` — the submission and/or the experiment, whether
 *   the service finds it stuck, who can act (its words), its course, its open correction where she
 *   may see it (UPD-18) and, for a stuck record, the reviewer scopes over its course that were
 *   withdrawn (PC-71). An address that names no record shows the in-shell not-found page.
 * - **As B7-06 draws it**: the back link "All content", the overline "SUB-0085 · EEE ZC341 ·
 *   Electrical Machines", the name, the status chip and its line; then one notice — stuck (why
 *   nobody can act, "Open Platform roles", "Move status (override)"), published · read-only (with
 *   its open correction: waiting for her → "Open the release decision" (SA-11); on hold →
 *   "Open Updates"), or in the workflow (who can act; nothing to do here) — the catalogue details
 *   (read-only) and the governance history, newest first (`record-view`). Published records are
 *   always read-only: no edit, no catalogue form, no override.
 * - **Move status (override)**, DL-2 (f5): only on a stuck, non-published record; the one move is
 *   back to the vendor (OD-B7-09); the reason is required and kept in the history with her name.
 *   `ProductionService.overrideStatus` with the revision the page showed when the dialog opened
 *   decides (`override-not-stuck`, stale revisions): a refusal closes the dialog, reads the record
 *   again and says why (state-copy `SA-13.stale.*`, `SA-13.moved-on`); a failure for now keeps it
 *   open (`SA-13.unavailable`). The result is said in the flash, which takes focus.
 * - Undrawn: loading and failed + "Try again" (state-copy `SA-13.loading`, `SA-13.failed`).
 */
export function ContentRecord({ recordId }: { readonly recordId: string }) {
  const read = useContentRecord(recordRefOf(recordId));
  const view = read.data?.ok ? read.data.value : null;
  useShellPage(contentRecordPlacement(view ? recordFacts(view).name : null));

  return (
    <PageContent wrap="read">
      <RecordGuard
        read={read}
        loadingLabel={stateWords('SA-13.loading')}
        failed={{ title: stateWords('SA-13.failed'), line: stateWords('SA-13.failed.line') }}
      >
        {(record) => <Record view={record} refetch={() => read.refetch()} />}
      </RecordGuard>
    </PageContent>
  );
}

/** A refused override, as the page says it (state-copy `SA-13.stale.*`, `SA-13.moved-on`). */
type Refusal = 'stale' | 'moved-on';

interface Override {
  readonly reason: string;
  readonly error: string | null;
  /** The record's revision when the dialog opened: a record changed meanwhile is refused. */
  readonly expectedRev: number;
  readonly unavailable: boolean;
}

function Record({
  view,
  refetch,
}: {
  readonly view: ContentRecordView;
  readonly refetch: () => Promise<unknown>;
}) {
  const facts = recordFacts(view);
  const [dialog, setDialog] = useState<Override | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ readonly id: string; readonly n: number }>({
    id: '',
    n: 0,
  });
  const flashRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const move = useCommand((ports) => ports.production.overrideStatus);

  // Focus moves after the commit that shows its target: the flash after the move, the reason
  // field after its error, the page title after a refusal that re-reads the record.
  useEffect(() => {
    if (focusRequest.n === 0) return;
    const target =
      focusRequest.id === 'flash'
        ? flashRef.current
        : focusRequest.id === 'title'
          ? titleRef.current
          : document.getElementById(focusRequest.id);
    target?.focus();
  }, [focusRequest]);
  const focus = (id: string) => setFocusRequest((current) => ({ id, n: current.n + 1 }));

  const open = () => {
    if (!facts.override) return;
    setDialog({ reason: '', error: null, expectedRev: facts.override.rev, unavailable: false });
    setFlash(null);
    setRefusal(null);
  };

  const confirm = () => {
    if (!dialog || !facts.override || move.busy) return;
    const reference = facts.reference ?? facts.name;
    move
      .run({
        id: facts.override.id as never,
        reason: dialog.reason,
        expectedRev: dialog.expectedRev,
      })
      .then(
        (answer) => {
          if (answer.ok) {
            setDialog(null);
            setFlash(overriddenFlash(reference, facts.vendorWho));
            focus('flash');
            return;
          }
          const error = answer.error;
          if (error.kind === 'validation-failed') {
            const words = error.fieldErrors.map((item) => fieldWords(item)).find(Boolean);
            setDialog((current) =>
              current
                ? { ...current, error: words ?? stateWords('SA-13.reason.missing') }
                : current,
            );
            focus(REASON_ID);
            return;
          }
          // The record moved on (stale, no longer stuck, …): nothing was moved; read it again.
          setDialog(null);
          setRefusal(error.kind === 'stale-version' ? 'stale' : 'moved-on');
          void refetch();
          focus('title');
        },
        () => {
          setDialog((current) => (current ? { ...current, unavailable: true } : current));
        },
      );
  };

  return (
    <>
      <PageHeader
        className="[margin:8px_0_16px]"
        back={<BackLink href={ALL_CONTENT_ADDRESS}>{CONTENT_RECORD.back}</BackLink>}
        overline={facts.overline}
        title={facts.name}
        titleFocusTarget
        titleRef={titleRef}
        meta={
          <>
            <StatusPill tone={facts.status.tone}>{facts.status.words}</StatusPill>
            <span>{facts.status.where}</span>
          </>
        }
      />
      <p ref={flashRef} className="xa-save is-ok mb-3" role="status" tabIndex={-1}>
        {flash ? (
          <>
            <Icon name="done" />
            <span>{flash}</span>
          </>
        ) : null}
      </p>
      <div className="flex flex-col gap-5">
        {refusal ? (
          <Notice
            tone="warn"
            role="alert"
            title={refusal === 'stale' ? stateWords('SA-13.stale.title') : undefined}
          >
            {refusal === 'stale' ? stateWords('SA-13.stale.line') : stateWords('SA-13.moved-on')}
          </Notice>
        ) : null}
        <RecordNotice facts={facts} onMove={open} />
        <CatalogueDetails facts={facts} />
        <Section title={CONTENT_RECORD.historyTitle} meta={CONTENT_RECORD.historyMeta}>
          <SectionBody>
            <Timeline events={facts.history} markLatest={false} />
          </SectionBody>
        </Section>
      </div>
      <ReasonDialog
        open={dialog !== null}
        align="start"
        idPrefix="content-record-override"
        returnFocusFallback={flashRef}
        title={overrideTitle(facts.reference ?? facts.name)}
        effect={CONTENT_RECORD.overrideEffect}
        confirmLabel={CONTENT_RECORD.confirm}
        busy={move.busy}
        busyLabel={CONTENT_RECORD.busy}
        onConfirm={confirm}
        onCancel={() => setDialog(null)}
      >
        {dialog?.unavailable ? (
          <Notice tone="err" role="alert" className="mb-[14px]">
            {stateWords('SA-13.unavailable')}
          </Notice>
        ) : null}
        <dl className="xl-kv xv-kv mb-4">
          <dt>{CONTENT_RECORD.from}</dt>
          <dd>{OVERRIDE_FROM}</dd>
          <dt>{CONTENT_RECORD.to}</dt>
          <dd>
            <strong>{overrideTo(facts.vendorWho)}</strong>
          </dd>
        </dl>
        <Field id={REASON_ID} label={CONTENT_RECORD.reasonLabel} error={dialog?.error ?? undefined}>
          <Textarea
            className="min-h-[96px]"
            value={dialog?.reason ?? ''}
            onChange={(event) => {
              const reason = event.target.value;
              setDialog((current) => (current ? { ...current, reason, error: null } : current));
            }}
          />
        </Field>
      </ReasonDialog>
    </>
  );
}

/** The one notice B7-06 draws for the record's state (f1 / f2 / f3 / f4 / f6). */
function RecordNotice({
  facts,
  onMove,
}: {
  readonly facts: RecordFacts;
  readonly onMove: () => void;
}) {
  const { notice } = facts;
  if (notice.kind === 'stuck') {
    return (
      <>
        <Notice
          tone="err"
          role="status"
          title={CONTENT_RECORD.stuckTitle}
          actions={
            <>
              <Link
                className="xr-btn xr-btn--secondary xr-btn--sm"
                href={rolesAddress('reviewers')}
              >
                {CONTENT_RECORD.openPlatformRoles}
              </Link>
              <button
                type="button"
                id={MOVE_ID}
                className="xr-btn xr-btn--secondary xr-btn--sm"
                onClick={onMove}
              >
                {CONTENT_RECORD.moveStatus}
              </button>
            </>
          }
        >
          {stuckWhy(facts.whoCanAct ?? CONTENT_RECORD.none, notice.since)}
        </Notice>
        <p className="xl-meta m-0">{stuckAdvice(facts.course)}</p>
      </>
    );
  }
  if (notice.kind === 'in-workflow') {
    return (
      <Notice tone="info" role="status" title={CONTENT_RECORD.inWorkflowTitle}>
        {inWorkflowLine(facts.whoCanAct)}
      </Notice>
    );
  }
  const update = notice.update;
  const live = facts.live?.label ?? '';
  return (
    <>
      <p className="xl-open m-0">
        <Icon name="readOnly" size={16} />
        <span>{CONTENT_RECORD.publishedReadOnly}</span>
      </p>
      {update?.state === 'awaiting-release-decision' ? (
        <Notice
          tone="info"
          role="status"
          title={updateTag(update.id, update.state)}
          actions={
            <Link
              className="xr-btn xr-btn--primary xr-btn--sm"
              href={updateDecisionAddress(update.id)}
            >
              {CONTENT_RECORD.openReleaseDecision}
            </Link>
          }
        >
          {staysLiveUntilReleased(live)}
        </Notice>
      ) : update?.state === 'on-hold' ? (
        <Notice
          tone="warn"
          role="status"
          title={updateTag(update.id, update.state)}
          actions={
            <Link
              className="xr-btn xr-btn--secondary xr-btn--sm"
              href={contentUpdatesAddress('on-hold')}
            >
              {CONTENT_RECORD.openUpdates}
            </Link>
          }
        >
          {staysLive(live)}
        </Notice>
      ) : update ? (
        <Notice tone="quiet" role="status" title={updateTag(update.id, update.state)}>
          {CONTENT_RECORD.updateNotReached}
        </Notice>
      ) : null}
    </>
  );
}

/** B7-06 "Catalogue details · Read-only" (`dl.xl-kv.xv-kv`, then the learning outcomes). */
function CatalogueDetails({ facts }: { readonly facts: RecordFacts }) {
  const { keys } = CONTENT_RECORD;
  return (
    <Section
      title={CONTENT_RECORD.catalogueTitle}
      meta={
        <>
          <Icon name="readOnly" size={16} /> {CONTENT_RECORD.readOnly}
        </>
      }
    >
      <SectionBody>
        <dl className="xl-kv xv-kv">
          <dt>{keys.summary}</dt>
          <dd>{facts.summary}</dd>
          <dt>{keys.formats}</dt>
          <dd>
            <span className="xv-chips">
              {inDisplayOrder(facts.formats).map((format) => (
                <FormatBadge key={format} format={FORMAT_META[format].code} compact />
              ))}
            </span>
          </dd>
          {facts.live ? (
            <>
              <dt>{keys.liveVersion}</dt>
              <dd>{liveVersionWords(facts.live.label, facts.live.since)}</dd>
            </>
          ) : null}
          <dt>{keys.vendor}</dt>
          <dd>{facts.vendor}</dd>
          <dt>{keys.whoCanAct}</dt>
          <dd>{facts.whoCanAct ?? CONTENT_RECORD.none}</dd>
        </dl>
        {facts.outcomes.length > 0 ? (
          <>
            <h3 className="xr-h3 mt-4 mb-2">{CONTENT_RECORD.outcomesTitle}</h3>
            <ul className="xv-los">
              {facts.outcomes.map((outcome) => (
                <li key={outcome}>{outcome}</li>
              ))}
            </ul>
          </>
        ) : null}
      </SectionBody>
    </Section>
  );
}

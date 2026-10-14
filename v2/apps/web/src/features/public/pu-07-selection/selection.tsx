'use client';

import type { CatalogueEntry } from '@xr/contracts/draft';
import { inDisplayOrder, type SelectionItem, type Technology } from '@xr/domain';
import { Button, Icon, Link } from '@xr/ui';
import { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { courseLine } from '@/copy/public';
import { CATALOGUE } from '@/copy/public';
import {
  SELECTION,
  formatOption,
  formatsLegend,
  removeLabel,
  removedWords,
  selectionBarWords,
} from '@/copy/request-access';
import { formatList } from '@/copy/requests';
import { stateWords } from '@/copy/state-copy';
import { DocumentTitle } from '@/features/shared/document-title';
import { useSelection } from '@/queries/selection';

import { PublicMain, usePublicRoot } from '../shell/public-frame';
import { ArtMedia } from '../shared/art';
import { FailedBlock } from '../shared/blocks';
import { RequestStepper, useCatalogueNames } from '../shared/request-flow';

/**
 * PU-07 Your selection (B1-06; Appendix A PU-07 `/selection`): step 1 of the institutional request
 * — the experiments chosen in this browser session and their formats, a summary, and the way on to
 * the request. Formats are only the experiment's published ones; the last chosen format is locked
 * ("use Remove instead"); Remove keeps a single-level Undo that puts the experiment back where it
 * was. Never a cart, a checkout or a price (B1-06 "Words"); nothing is requested until the request
 * is sent. Below 1024 px the summary becomes the bottom bar (`div.xp-bottombar`, after the footer).
 * The selection port decides every change; the page renders its answers.
 */
export function SelectionPage() {
  const { selection, ready, setFormats, remove, undoRemove } = useSelection();
  const names = useCatalogueNames();
  const root = usePublicRoot();
  // The removal this visit can undo (B1-06 `undo`: the notice belongs to the page, the item to the port).
  const [removed, setRemoved] = useState<{ readonly id: string; readonly title: string } | null>(
    null,
  );
  const notice = useRef<HTMLDivElement | null>(null);
  const ids = useId();
  const undoable =
    removed !== null && selection.lastRemoved?.experimentId === removed.id ? removed : null;

  const title = SELECTION.title;
  if (!ready || (names.byId === null && !names.failed && selection.items.length > 0)) {
    return (
      <>
        <DocumentTitle title={title} />
        <PublicMain>
          <span className="xr-sr" role="status">
            {stateWords('PU-07.loading')}
          </span>
        </PublicMain>
      </>
    );
  }

  if (names.failed && selection.items.length > 0) {
    return (
      <>
        <DocumentTitle title={stateWords('PU-07.failed')} />
        <PublicMain className="xp-page">
          <div className="xp-in">
            <RequestStepper current={1} />
            <FailedBlock
              title={stateWords('PU-07.failed')}
              line={CATALOGUE.failedLine}
              retryLabel={CATALOGUE.retry}
              onRetry={names.retry}
            />
          </div>
        </PublicMain>
      </>
    );
  }

  const items = selection.items;
  const formatsChosen = items.reduce((sum, item) => sum + item.formats.length, 0);
  const formatsList = formatList(inDisplayOrder(items.flatMap((item) => item.formats)));

  const onRemove = (item: SelectionItem, name: string) => {
    if (!remove(item.experimentId).ok) return;
    setRemoved({ id: item.experimentId, title: name });
    // The pressed Remove is gone with its row: focus goes to the notice that offers Undo.
    window.setTimeout(() => notice.current?.focus({ preventScroll: true }), 0);
  };
  const onUndo = () => {
    const back = undoable;
    if (!back || !undoRemove().ok) return;
    setRemoved(null);
    window.setTimeout(
      () => document.getElementById(`${ids}title-${back.id}`)?.focus({ preventScroll: true }),
      0,
    );
  };
  const onFormats = (item: SelectionItem, formats: readonly Technology[]) => {
    // A format change ends the undo (B1-06 `undo: null`); the port keeps at least one format.
    if (setFormats({ experimentId: item.experimentId, formats: [...formats] }).ok) {
      setRemoved(null);
    }
  };

  return (
    <>
      <DocumentTitle title={title} />
      <PublicMain className="xp-page">
        <div className="xp-in">
          <RequestStepper current={1} />
          <div className="xp-phead-main mb-7">
            <h1 className="xp-h1">{SELECTION.title}</h1>
            <p className="xp-lead">{SELECTION.lead}</p>
          </div>
          {undoable ? (
            <div className="mb-5">
              <div className="xr-notice xr-notice--quiet" role="status" tabIndex={-1} ref={notice}>
                <Icon name="done" />
                <div className="xr-notice-body flex-row flex-wrap items-center gap-x-4 gap-y-1">
                  <span>{removedWords(undoable.title)}</span>
                  <Button variant="text" className="min-h-8 p-0" onClick={onUndo}>
                    {SELECTION.undo}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
          {items.length > 0 ? (
            <div className="xp-split">
              <ul className="m-0 list-none p-0">
                {items.map((item, index) => (
                  <SelectionRow
                    key={item.experimentId}
                    item={item}
                    entry={names.byId?.get(item.experimentId) ?? null}
                    base={`${ids}${index}`}
                    titleId={`${ids}title-${item.experimentId}`}
                    onRemove={onRemove}
                    onFormats={onFormats}
                  />
                ))}
              </ul>
              <aside className="xp-sumcard xp-sumcard--bar" aria-labelledby={`${ids}sum`}>
                <h2 id={`${ids}sum`} className="xp-h3 text-[20px]">
                  {SELECTION.summary}
                </h2>
                <dl className="xp-sumlist">
                  <div>
                    <dt>{SELECTION.summaryExperiments}</dt>
                    <dd>{items.length}</dd>
                  </div>
                  <div>
                    <dt>{SELECTION.summaryFormats}</dt>
                    <dd>{formatsList}</dd>
                  </div>
                </dl>
                <p className="xr-hint">{SELECTION.summaryHint}</p>
                <Link className="xr-btn xr-btn--primary xr-btn--block" href="/request-access">
                  {SELECTION.continueToRequest} <Icon name="next" />
                </Link>
                <Link className="xr-btn xr-btn--secondary xr-btn--block" href="/experiments">
                  {SELECTION.continueBrowsing}
                </Link>
              </aside>
            </div>
          ) : (
            <div className="xr-section">
              <div className="xr-empty">
                <span className="xr-empty-icon">
                  <Icon name="checklist" />
                </span>
                <h2 className="xp-h3">{SELECTION.emptyTitle}</h2>
                <p className="xr-body text-ink-2">{SELECTION.emptyLine}</p>
                <Link className="xr-btn xr-btn--primary" href="/experiments">
                  {SELECTION.browse}
                </Link>
              </div>
            </div>
          )}
        </div>
      </PublicMain>
      {items.length > 0 && root
        ? createPortal(
            <div className="xp-bottombar">
              <span className="xp-bottombar-t">
                {selectionBarWords(items.length, formatsChosen)}
              </span>
              <Link className="xr-btn xr-btn--primary xr-btn--sm" href="/request-access">
                {SELECTION.continueToRequest}
              </Link>
            </div>,
            root,
          )
        : null}
    </>
  );
}

/** One experiment of the selection (B1-06 `li.xp-srow`). */
function SelectionRow({
  item,
  entry,
  base,
  titleId,
  onRemove,
  onFormats,
}: {
  readonly item: SelectionItem;
  readonly entry: CatalogueEntry | null;
  readonly base: string;
  readonly titleId: string;
  readonly onRemove: (item: SelectionItem, name: string) => void;
  readonly onFormats: (item: SelectionItem, formats: readonly Technology[]) => void;
}) {
  // An experiment the catalogue no longer names: its reference, no formats to change, Remove
  // (state-copy `PU-07.unnamed-experiment`).
  const name = entry?.name ?? item.experimentId;
  const published = entry ? entry.availableIn : [];
  const locked = item.formats.length === 1;
  const lockId = `${base}-lock`;
  const toggle = (format: Technology) => {
    const on = item.formats.includes(format);
    if (on && locked) return;
    const next = on
      ? item.formats.filter((chosen) => chosen !== format)
      : published.filter((candidate) => candidate === format || item.formats.includes(candidate));
    onFormats(item, next);
  };
  return (
    <li className="xp-srow">
      <ArtMedia className="xp-srow-media" artKey={entry?.artworkKey ?? null} name={name} />
      <div className="xp-srow-main">
        <div className="xp-srow-top">
          <div>
            <h2 className="xp-srow-title">
              {entry ? (
                <Link id={titleId} href={`/experiments/${encodeURIComponent(item.experimentId)}`}>
                  {name}
                </Link>
              ) : (
                <span id={titleId} tabIndex={-1}>
                  {name}
                </span>
              )}
            </h2>
            {entry ? (
              <p className="xp-srow-course">{courseLine(entry.platformCode, entry.courseName)}</p>
            ) : null}
          </div>
          <Button
            variant="text"
            className="p-0 px-1 text-err"
            icon="remove"
            aria-label={removeLabel(name)}
            onClick={() => onRemove(item, name)}
          >
            {SELECTION.remove}
          </Button>
        </div>
        {entry ? (
          <>
            <fieldset className="xp-pills">
              <legend>{formatsLegend(name)}</legend>
              {published.map((format) => {
                const on = item.formats.includes(format);
                const inputId = `${base}-${format}`;
                return (
                  <label className="xp-pill" htmlFor={inputId} key={format}>
                    <input
                      type="checkbox"
                      id={inputId}
                      checked={on}
                      disabled={on && locked}
                      aria-describedby={on && locked ? lockId : undefined}
                      onChange={() => toggle(format)}
                    />
                    {formatOption(format)}
                  </label>
                );
              })}
            </fieldset>
            {locked ? (
              <p className="xr-hint flex items-start gap-1.5" id={lockId}>
                <Icon name="readOnly" size={16} />
                <span>{SELECTION.locked}</span>
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </li>
  );
}

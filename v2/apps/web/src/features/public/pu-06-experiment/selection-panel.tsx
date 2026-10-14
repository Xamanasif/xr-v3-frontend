'use client';

import type { PublicExperimentPage } from '@xr/contracts/draft';
import { FORMAT_META, inDisplayOrder, type Technology } from '@xr/domain';
import { Button, FormatBadge, Icon, Link } from '@xr/ui';
import { useId, useRef, useState } from 'react';

import { EXPERIMENT, chooseOneFormatWords, inSelectionFormats } from '@/copy/public';
import { useSelection } from '@/queries/selection';

type ExperimentId = Parameters<ReturnType<typeof useSelection>['remove']>[0];

/**
 * "Get this for your institution" (B1-05 panel; Appendix C §3.3): choose published formats → Add
 * to selection; then "In your selection" with Change formats and Remove from selection. Never
 * prices, never "Buy"; students get experiments from their institution once its access is active.
 * The selection port decides (at least one format, published formats only, not twice); a refusal
 * the panel does not draw re-reads the selection (state-copy `PU-06.selection-unexpected`).
 * "Go to selection" opens Your selection (PU-07, built in Package 1C).
 * After each change focus moves to the panel's heading (B1-05 `focusPanel`).
 */
export function SelectionPanel({
  page,
  filter,
}: {
  readonly page: PublicExperimentPage;
  /** B1-05 "Arrived with a format filter": that format is pre-chosen. */
  readonly filter: Technology | null;
}) {
  const { selection, ready, add, setFormats, remove } = useSelection();
  const held = selection.items.find((item) => item.experimentId === page.experimentId) ?? null;
  const [editing, setEditing] = useState(false);
  const [picked, setPicked] = useState<readonly Technology[]>(() => (filter ? [filter] : []));
  const [invalid, setInvalid] = useState(false);
  const title = useRef<HTMLHeadingElement | null>(null);
  const ids = useId();
  const mode = held ? (editing ? 'edit' : 'in') : 'pick';

  const focusTitle = () =>
    window.setTimeout(() => title.current?.focus({ preventScroll: true }), 30);
  const toggle = (format: Technology) => {
    setPicked((current) =>
      current.includes(format) ? current.filter((item) => item !== format) : [...current, format],
    );
    setInvalid(false);
  };
  const id = page.experimentId as ExperimentId;
  const chosen = inDisplayOrder(picked);

  const onAdd = () => {
    const answer = add({ experimentId: id, formats: chosen });
    if (!answer.ok) {
      setInvalid(answer.error.kind === 'validation-failed');
      return;
    }
    setInvalid(false);
    focusTitle();
  };
  const onUpdate = () => {
    const answer = setFormats({ experimentId: id, formats: chosen });
    if (!answer.ok) {
      // B1-05 "Change formats" with none chosen draws the same message as Add.
      setInvalid(
        answer.error.kind === 'validation-failed' ||
          (answer.error.kind === 'refused' && answer.error.code === 'last-format-locked'),
      );
      return;
    }
    setInvalid(false);
    setEditing(false);
    focusTitle();
  };
  // Change formats and Cancel replace the pressed button with the other mode's controls, so focus
  // goes to the panel's heading too, rather than falling to the page (WCAG 2.4.3).
  const onEdit = () => {
    setPicked(held ? [...held.formats] : []);
    setEditing(true);
    focusTitle();
  };
  const onCancel = () => {
    setEditing(false);
    setInvalid(false);
    focusTitle();
  };
  const onRemove = () => {
    remove(id);
    setEditing(false);
    setPicked([]);
    setInvalid(false);
    focusTitle();
  };

  const errorId = `${ids}error`;
  return (
    <aside className="xp-panel" aria-labelledby={`${ids}title`}>
      <h2 ref={title} id={`${ids}title`} className="xp-panel-title" tabIndex={-1}>
        {EXPERIMENT.panelTitle}
      </h2>
      {mode !== 'in' ? (
        <>
          <p className="xp-panel-text">
            {mode === 'edit' ? EXPERIMENT.editText : EXPERIMENT.pickText}
          </p>
          <fieldset className="xr-fieldset" aria-describedby={invalid ? errorId : undefined}>
            <legend className="xr-legend">{EXPERIMENT.legend}</legend>
            <div className={invalid ? 'xp-fpick is-invalid' : 'xp-fpick'}>
              {page.availableIn.map((format) => {
                const inputId = `${ids}f-${format}`;
                return (
                  <label className="xp-fpick-opt" htmlFor={inputId} key={format}>
                    <input
                      type="checkbox"
                      id={inputId}
                      checked={picked.includes(format)}
                      onChange={() => toggle(format)}
                    />
                    <FormatBadge format={FORMAT_META[format].code} />
                    <span className="xp-fpick-name">{FORMAT_META[format].name}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          {invalid ? (
            <p className="xr-error" role="alert" id={errorId}>
              <Icon name="failed" />
              {chooseOneFormatWords()}
            </p>
          ) : null}
          {mode === 'pick' ? (
            <Button variant="primary" block disabled={!ready} onClick={onAdd}>
              {EXPERIMENT.add}
            </Button>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" className="flex-auto" onClick={onUpdate}>
                {EXPERIMENT.update}
              </Button>
              <Button variant="secondary" onClick={onCancel}>
                {EXPERIMENT.cancel}
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="xp-insel" role="status">
            <span className="xp-insel-t">
              <Icon name="done" />
              {EXPERIMENT.inSelection}
            </span>
            <span>{inSelectionFormats(held?.formats ?? [])}</span>
          </div>
          <Link className="xr-btn xr-btn--primary xr-btn--block" href="/selection">
            {EXPERIMENT.goToSelection} <Icon name="next" />
          </Link>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Button variant="text" className="p-0" onClick={onEdit}>
              {EXPERIMENT.change}
            </Button>
            <Button variant="text" className="p-0 text-err" onClick={onRemove}>
              {EXPERIMENT.remove}
            </Button>
          </div>
        </>
      )}
      <p className="xp-panel-note">{EXPERIMENT.panelNote}</p>
      <p>
        {EXPERIMENT.signInBefore}
        <Link href="/sign-in">{EXPERIMENT.signIn}</Link>
      </p>
    </aside>
  );
}

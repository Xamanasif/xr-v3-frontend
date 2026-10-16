'use client';

import { Button, Field, FieldError, Icon, Notice, Textarea } from '@xr/ui';

import { OUTCOME_WORDS, REVIEW_PAGE } from '@/copy/reviewer-review';

import type { ReviewDraft } from './review-draft';

/** The editor’s element ids (B6-03 script `pid + '-lo-…'`), the targets focus moves to. */
export const OUTCOME_IDS = {
  up: (index: number) => `rv-lo-${index}-up`,
  down: (index: number) => `rv-lo-${index}-dn`,
  editButton: (index: number) => `rv-lo-${index}-ed`,
  editField: (index: number) => `rv-lo-ed-${index}`,
  message: 'rv-lo-msg',
  add: 'rv-lo-new',
} as const;

export interface OutcomesEditorProps {
  readonly draft: ReviewDraft;
  /** The last thing the editor did, said politely (“Outcome 2 deleted.”), and whether it can be undone. */
  readonly message: string | null;
  readonly canUndo: boolean;
  readonly addError: string | null;
  readonly editError: string | null;
  readonly onMove: (index: number, by: -1 | 1) => void;
  readonly onEdit: (index: number) => void;
  readonly onEditText: (text: string) => void;
  readonly onSaveEdit: () => void;
  readonly onCancelEdit: () => void;
  readonly onDelete: (index: number) => void;
  readonly onUndo: () => void;
  readonly onNewText: (text: string) => void;
  readonly onAdd: () => void;
}

/**
 * “Learning outcomes” while the submission is with the reviewer (B6-03 f0 … f3, f5; LD-3): one set
 * for the Experiment, the reviewer’s — numbered, each with Move up / Move down / Edit / Delete, one
 * edited at a time; “No learning outcomes yet” while there are none (f2); the polite line saying
 * what was done, with Undo after a delete; and “Add a learning outcome”. The set is sent with the
 * decision (OD-B6-04): nothing is saved on its own.
 */
export function OutcomesEditor({
  draft,
  message,
  canUndo,
  addError,
  editError,
  onMove,
  onEdit,
  onEditText,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onUndo,
  onNewText,
  onAdd,
}: OutcomesEditorProps) {
  const { outcomes, editing } = draft;
  return (
    <>
      <p className="xl-meta m-0">{REVIEW_PAGE.outcomesLead}</p>
      {outcomes.length > 0 ? (
        <ol className="xg-los" aria-label={OUTCOME_WORDS.listLabel}>
          {outcomes.map((text, index) => {
            const n = index + 1;
            if (editing?.index === index) {
              const fieldId = OUTCOME_IDS.editField(index);
              const errorId = `${fieldId}-e`;
              return (
                <li key={`${index}-editing`} className="xg-lo">
                  <div className="xr-field [flex:1_1_100%]">
                    <label className="xr-label" htmlFor={fieldId}>
                      {OUTCOME_WORDS.label(n)}
                    </label>
                    <Textarea
                      id={fieldId}
                      className="min-h-[80px]"
                      value={editing.text}
                      invalid={editError !== null}
                      aria-describedby={editError !== null ? errorId : undefined}
                      onChange={(event) => onEditText(event.target.value)}
                    />
                    {editError !== null ? <FieldError id={errorId}>{editError}</FieldError> : null}
                    <div className="xw-actions">
                      <Button variant="primary" size="sm" onClick={onSaveEdit}>
                        {REVIEW_PAGE.saveOutcome}
                      </Button>
                      <Button variant="text" onClick={onCancelEdit}>
                        {REVIEW_PAGE.cancel}
                      </Button>
                    </div>
                  </div>
                </li>
              );
            }
            const first = index === 0;
            const last = index === outcomes.length - 1;
            return (
              <li key={`${index}-${text}`} className="xg-lo">
                <div className="xg-lo-main">
                  <span className="xg-lo-n" aria-hidden="true">
                    {n}
                  </span>
                  <span className="xg-lo-t">{text}</span>
                </div>
                <div className="xg-lo-acts">
                  <IconMove
                    id={OUTCOME_IDS.up(index)}
                    label={OUTCOME_WORDS.upLabel(n)}
                    icon="arrowUp"
                    disabled={first}
                    onPress={() => onMove(index, -1)}
                  />
                  <IconMove
                    id={OUTCOME_IDS.down(index)}
                    label={OUTCOME_WORDS.downLabel(n)}
                    icon="arrowDown"
                    disabled={last}
                    onPress={() => onMove(index, 1)}
                  />
                  <Button
                    variant="text"
                    icon="marking"
                    id={OUTCOME_IDS.editButton(index)}
                    aria-label={OUTCOME_WORDS.editLabel(n)}
                    onClick={() => onEdit(index)}
                  >
                    {REVIEW_PAGE.edit}
                  </Button>
                  <Button
                    variant="text"
                    icon="delete"
                    className="xg-del"
                    aria-label={OUTCOME_WORDS.deleteLabel(n)}
                    onClick={() => onDelete(index)}
                  >
                    {REVIEW_PAGE.delete}
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <Notice tone="warn" title={REVIEW_PAGE.noOutcomesTitle}>
          {REVIEW_PAGE.noOutcomesLine}
        </Notice>
      )}
      <p className="xa-save is-ok m-0 min-h-5" role="status" id={OUTCOME_IDS.message} tabIndex={-1}>
        {message !== null ? (
          <>
            <Icon name="done" />
            <span>{message}</span>
          </>
        ) : null}
        {canUndo ? (
          <Button variant="text" className="min-h-8 [padding:0_6px]" onClick={onUndo}>
            {REVIEW_PAGE.undo}
          </Button>
        ) : null}
      </p>
      <div className="xg-addlo">
        <Field
          id={OUTCOME_IDS.add}
          className="[flex:1_1_320px]"
          label={REVIEW_PAGE.addLabel}
          hint={REVIEW_PAGE.addHint}
          error={addError ?? undefined}
        >
          <Textarea
            className="min-h-[72px]"
            value={draft.newOutcome}
            onChange={(event) => onNewText(event.target.value)}
          />
        </Field>
        <div>
          <Button variant="secondary" icon="add" onClick={onAdd}>
            {REVIEW_PAGE.add}
          </Button>
        </div>
      </div>
    </>
  );
}

/**
 * Move up / Move down (`button.xr-btn--text.xg-icobtn`, named, `aria-disabled` at the ends — still
 * focusable, presses ignored). While an outcome is edited the editor ignores a move (B6-03 `move`).
 */
function IconMove({
  id,
  label,
  icon,
  disabled,
  onPress,
}: {
  readonly id: string;
  readonly label: string;
  readonly icon: 'arrowUp' | 'arrowDown';
  readonly disabled: boolean;
  readonly onPress: () => void;
}) {
  return (
    <button
      type="button"
      className="xr-btn xr-btn--text xg-icobtn"
      id={id}
      aria-label={label}
      aria-disabled={disabled ? 'true' : 'false'}
      onClick={() => {
        if (!disabled) onPress();
      }}
    >
      <Icon name={icon} />
    </button>
  );
}

/** The decided record’s outcomes, read-only (B6-03 f4 `ul.xv-los`; none: “None.”). */
export function OutcomesReadOnly({ outcomes }: { readonly outcomes: readonly string[] }) {
  if (outcomes.length === 0) return <p className="xl-meta m-0">{REVIEW_PAGE.noneReadOnly}</p>;
  return (
    <ul className="xv-los">
      {outcomes.map((text, index) => (
        <li key={`${index}-${text}`}>{text}</li>
      ))}
    </ul>
  );
}

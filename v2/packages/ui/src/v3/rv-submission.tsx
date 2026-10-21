'use client';

import type { ReactNode } from 'react';

import { joinClasses } from '../internal/classes.js';
import type { FormatCode } from '../icons/registry.js';
import { Glyph, Icon, V3_ICON_PATHS, type V3IconName } from './icons.js';
import { Notice } from './notices.js';
import { RvBlock, RvFormatBadges } from './rv.js';

/**
 * What only the Academic Reviewer's submission review draws (owner-approved export
 * design/v3-refined-b/roles/RV-v1, `project/RV.dc.html` item view, RV-03 Review a submission and
 * RV-06 its decided state): the learning-outcome block and its editor (`rv-lo-*`, LD-3), the return
 * references grouped by the vendor editor's sections (`rv-refgrps`), the description and the file
 * cards (`rv-prose`, `rv-files`), the formats line (`rv-fmtline`) and the delivery cards
 * (`rv-deliv`). Every word, id, value and destination comes from the caller; nothing here holds a
 * record or a rule.
 */

// ---- the learning-outcome block ----------------------------------------------------------------

export interface RvOutcomesBlockProps {
  /** "Learning outcomes" (`h2.rb-h2`, a page-map focus target). */
  readonly title: ReactNode;
  readonly titleId: string;
  /** The line under the title (`p.rv-lo-sub`). */
  readonly sub: ReactNode;
  /** The requirement chip beside the title ("Requirement met", "Set by you · read-only"). */
  readonly requirement?: ReactNode;
  /** The decision's outcome error is shown (`is-invalid`). */
  readonly invalid?: boolean;
  /** The editor (`RvOutcomesEditor`) or the read-only list. */
  readonly children: ReactNode;
}

/**
 * The "Learning outcomes" block (`section.rk-surface.rv-block.rv-block--work` > `div.rv-lo-head`):
 * the reviewer's work on the page, in the heavier block weight.
 */
export function RvOutcomesBlock({
  title,
  titleId,
  sub,
  requirement,
  invalid = false,
  children,
}: RvOutcomesBlockProps) {
  return (
    <RvBlock weight="work" invalid={invalid} labelledBy={titleId}>
      <div className="rv-lo-head">
        <div className="rv-lo-headtext">
          <h2 className="rb-h2" id={titleId} tabIndex={-1}>
            {title}
          </h2>
          <p className="rv-lo-sub">{sub}</p>
        </div>
        {requirement}
      </div>
      {children}
    </RvBlock>
  );
}

/** The requirement chip's states: met, still needed, or read-only once decided. */
export type RvRequirementState = 'ok' | 'need' | 'ro';

const REQUIREMENT_ICON: Readonly<Record<RvRequirementState, V3IconName>> = {
  ok: 'check',
  need: 'alertCircle',
  ro: 'lock',
};

/**
 * The outcome rule beside the block's title (`span.rv-req.rv-req--ok|need|ro`): "Requirement met",
 * "At least one needed to approve", "Set by you · read-only". The export draws the three icons and
 * lets the state class show one; this draws the one it shows.
 */
export function RvRequirement({
  state,
  children,
}: {
  readonly state: RvRequirementState;
  readonly children: ReactNode;
}) {
  return (
    <span className={`rv-req rv-req--${state}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d={V3_ICON_PATHS[REQUIREMENT_ICON[state]]} />
      </svg>
      {children}
    </span>
  );
}

/** The editor's element ids (the export's `rv-lo-…`): the targets focus moves to. */
export const RV_OUTCOME_IDS = {
  up: (index: number) => `rv-lo-${index}-up`,
  down: (index: number) => `rv-lo-${index}-dn`,
  editButton: (index: number) => `rv-lo-${index}-ed`,
  editField: (index: number) => `rv-lo-ta-${index}`,
  editError: 'rv-lo-ed-err',
  message: 'rv-lo-msg',
  add: 'rv-lo-new',
  addHint: 'rv-lo-new-hint',
  addError: 'rv-lo-new-err',
  /** The decision's outcome error, shown at the add field too ("Add at least one …"). */
  setError: 'rv-lo-err',
} as const;

/** The editor's words (the export's template and `itemVals`). */
export interface RvOutcomeWords {
  /** The list's name: "Learning outcomes". */
  readonly listLabel: string;
  /** "Outcome 2" — the edit field's label and the item's screen-reader prefix. */
  readonly outcome: (n: number) => string;
  readonly up: (n: number) => string;
  readonly down: (n: number) => string;
  readonly editLabel: (n: number) => string;
  readonly deleteLabel: (n: number) => string;
  readonly edit: string;
  readonly delete: string;
  readonly save: string;
  readonly cancel: string;
  readonly undo: string;
  /** "No learning outcomes yet" and its line (the warn notice while the list is empty). */
  readonly noneTitle: string;
  readonly noneLine: string;
  readonly addLabel: string;
  readonly addHint: string;
  readonly add: string;
}

export interface RvOutcomesEditorProps {
  readonly words: RvOutcomeWords;
  readonly outcomes: readonly string[];
  /** The outcome being edited (one at a time) and its text as typed. */
  readonly editing: { readonly index: number; readonly text: string } | null;
  /** The last change, said politely ("Outcome 2 deleted."); the line is drawn only with one. */
  readonly message: ReactNode | null;
  readonly canUndo: boolean;
  readonly editError: ReactNode | null;
  readonly newText: string;
  readonly addError: ReactNode | null;
  /** The decision's outcome error ("Add at least one learning outcome before you approve"). */
  readonly setError: ReactNode | null;
  readonly onMove: (index: number, by: -1 | 1) => void;
  readonly onEdit: (index: number) => void;
  readonly onEditText: (text: string) => void;
  readonly onSave: () => void;
  readonly onCancel: () => void;
  readonly onDelete: (index: number) => void;
  readonly onUndo: () => void;
  readonly onNewText: (text: string) => void;
  readonly onAdd: () => void;
}

const ids = (...list: readonly (string | false | null | undefined)[]) =>
  list.filter(Boolean).join(' ') || undefined;

/**
 * The ordered outcome list while the submission is with the reviewer (`div.rv-lowrap`; LD-3): the
 * polite line with Undo after a delete (`div.rv-lo-msg[role=status]`), the numbered items with Move
 * up / Move down / Edit / Delete (disabled at the ends, and all while one is edited), the item
 * edited in place (`div.rv-lo-edit`), "No learning outcomes yet" while the list is empty, and "Add
 * a learning outcome" (`div.rv-lo-add`). Only the ids that exist are referenced.
 */
export function RvOutcomesEditor({
  words,
  outcomes,
  editing,
  message,
  canUndo,
  editError,
  newText,
  addError,
  setError,
  onMove,
  onEdit,
  onEditText,
  onSave,
  onCancel,
  onDelete,
  onUndo,
  onNewText,
  onAdd,
}: RvOutcomesEditorProps) {
  const locked = editing !== null;
  return (
    <div className="rv-lowrap">
      {message !== null ? (
        <div className="rv-lo-msg" id={RV_OUTCOME_IDS.message} tabIndex={-1} role="status">
          <span>{message}</span>
          {canUndo ? (
            <button type="button" className="rk-clear" onClick={onUndo}>
              {words.undo}
            </button>
          ) : null}
        </div>
      ) : null}
      {outcomes.length > 0 ? (
        <ol className="rv-lo" aria-label={words.listLabel}>
          {outcomes.map((text, index) => {
            const n = index + 1;
            const isEditing = editing?.index === index;
            return (
              <li
                key={`${index}-${text}`}
                className={joinClasses('rv-lo-item', isEditing && 'is-editing')}
              >
                <span className="rv-lo-n" aria-hidden="true">
                  {n}
                </span>
                {isEditing ? (
                  <div className="rv-lo-edit">
                    <label className="rk-label" htmlFor={RV_OUTCOME_IDS.editField(index)}>
                      {words.outcome(n)}
                    </label>
                    <textarea
                      id={RV_OUTCOME_IDS.editField(index)}
                      className="rk-textarea"
                      value={editing.text}
                      aria-invalid={editError !== null ? true : undefined}
                      aria-describedby={editError !== null ? RV_OUTCOME_IDS.editError : undefined}
                      onChange={(event) => onEditText(event.target.value)}
                    />
                    {editError !== null ? (
                      <p className="rk-ferr" id={RV_OUTCOME_IDS.editError}>
                        <Glyph name="alertCircle" />
                        {editError}
                      </p>
                    ) : null}
                    <div className="rv-lo-editact">
                      <button type="button" className="rb-btn rb-btn--navy" onClick={onSave}>
                        {words.save}
                      </button>
                      <button type="button" className="rb-btn" onClick={onCancel}>
                        {words.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="rv-lo-t">
                      <span className="xr-sr">{`${words.outcome(n)}: `}</span>
                      {text}
                    </p>
                    <div className="rv-lo-act">
                      <button
                        type="button"
                        className="rb-btn rb-btn--ghost rv-ibtn"
                        id={RV_OUTCOME_IDS.up(index)}
                        aria-label={words.up(n)}
                        disabled={index === 0 || locked}
                        onClick={() => onMove(index, -1)}
                      >
                        <Icon name="arrowUp" size={18} />
                      </button>
                      <button
                        type="button"
                        className="rb-btn rb-btn--ghost rv-ibtn"
                        id={RV_OUTCOME_IDS.down(index)}
                        aria-label={words.down(n)}
                        disabled={index === outcomes.length - 1 || locked}
                        onClick={() => onMove(index, 1)}
                      >
                        <Icon name="arrowDown" size={18} />
                      </button>
                      <button
                        type="button"
                        className="rb-btn rb-btn--ghost rv-ibtn-t"
                        id={RV_OUTCOME_IDS.editButton(index)}
                        aria-label={words.editLabel(n)}
                        disabled={locked}
                        onClick={() => onEdit(index)}
                      >
                        <Icon name="edit" size={18} />
                        {words.edit}
                      </button>
                      <button
                        type="button"
                        className="rb-btn rb-btn--ghost rv-ibtn-t"
                        aria-label={words.deleteLabel(n)}
                        disabled={locked}
                        onClick={() => onDelete(index)}
                      >
                        <Icon name="trash" size={18} />
                        {words.delete}
                      </button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        <Notice tone="warn" icon="flag" title={words.noneTitle}>
          {words.noneLine}
        </Notice>
      )}
      <div className="rv-lo-add">
        <div className="rk-field">
          <label className="rk-label" htmlFor={RV_OUTCOME_IDS.add}>
            {words.addLabel}
          </label>
          <p className="rk-hint" id={RV_OUTCOME_IDS.addHint}>
            {words.addHint}
          </p>
          <div className="rv-lo-addrow">
            <input
              id={RV_OUTCOME_IDS.add}
              className="rk-input"
              type="text"
              autoComplete="off"
              value={newText}
              aria-invalid={addError !== null || setError !== null ? true : undefined}
              aria-describedby={ids(
                RV_OUTCOME_IDS.addHint,
                addError !== null && RV_OUTCOME_IDS.addError,
                setError !== null && RV_OUTCOME_IDS.setError,
              )}
              onChange={(event) => onNewText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                onAdd();
              }}
            />
            <button type="button" className="rb-btn" onClick={onAdd}>
              {words.add}
            </button>
          </div>
          {addError !== null ? (
            <p className="rk-ferr" id={RV_OUTCOME_IDS.addError}>
              <Glyph name="alertCircle" />
              {addError}
            </p>
          ) : null}
          {setError !== null ? (
            <p className="rk-ferr" id={RV_OUTCOME_IDS.setError}>
              <Glyph name="alertCircle" />
              {setError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ---- return references -------------------------------------------------------------------------

export interface RvReferenceOption {
  /** The checkbox id (`rv-ref-…`). */
  readonly id: string;
  /** The field's name in its section ("Device need"). */
  readonly label: ReactNode;
  readonly checked: boolean;
}

export interface RvReferenceGroup {
  /** The vendor editor's section: "Formats & delivery · VR". */
  readonly title: ReactNode;
  readonly options: readonly RvReferenceOption[];
}

export interface RvReferenceGroupsProps {
  /** "What it refers to (optional)". */
  readonly legend: ReactNode;
  /** "The vendor sees these as links to the fields, above their editor." */
  readonly hint: ReactNode;
  readonly groups: readonly RvReferenceGroup[];
  readonly onToggle: (id: string) => void;
}

/**
 * The fields a return refers to, grouped by the vendor editor's sections (`fieldset.rk-fieldset`
 * > `div.rv-refgrps` > `fieldset.rv-refgrp` > `div.rv-refs` > `label.rv-ref`; OD-B5-10): each
 * checkbox is named by its field, its group by the section.
 */
export function RvReferenceGroups({ legend, hint, groups, onToggle }: RvReferenceGroupsProps) {
  return (
    <fieldset className="rk-fieldset">
      <legend>
        {legend}
        <span>{hint}</span>
      </legend>
      <div className="rv-refgrps">
        {groups.map((group, index) => (
          <fieldset key={index} className="rv-refgrp">
            <legend className="rv-refgrp-h">{group.title}</legend>
            <div className="rv-refs">
              {group.options.map((option) => (
                <label key={option.id} className="rv-ref" htmlFor={option.id}>
                  <input
                    type="checkbox"
                    id={option.id}
                    checked={option.checked}
                    onChange={() => onToggle(option.id)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
    </fieldset>
  );
}

// ---- description, preview and documents ----------------------------------------------------------

/** A small heading inside a block (`h3.rv-mini-h`): "Description", "Preview and documents". */
export function RvMiniHeading({ children }: { readonly children: ReactNode }) {
  return <h3 className="rv-mini-h">{children}</h3>;
}

/** The description at reading width (`div.rv-prose` > `h3.rv-mini-h` + `p`). */
export function RvProse({
  title,
  children,
}: {
  readonly title: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className="rv-prose">
      <RvMiniHeading>{title}</RvMiniHeading>
      <p>{children}</p>
    </div>
  );
}

/** One card of "Preview and documents". */
export type RvFileCard =
  | {
      /** The preview link (`a.rv-filecard--link`, a new tab). */
      readonly kind: 'link';
      readonly title: ReactNode;
      /** "Preview link · opens in a new tab". */
      readonly note: ReactNode;
      readonly href: string;
    }
  | { readonly kind: 'document'; readonly title: ReactNode }
  | {
      /** What was not sent ("No preview link", "No documents", "No preview link or documents"). */
      readonly kind: 'none';
      readonly title: ReactNode;
      readonly icon: 'preview' | 'document';
      /** The one wide card when neither was sent (`rv-filecard--wide`). */
      readonly wide?: boolean;
    };

const FILE_ICON: Readonly<Record<'preview' | 'document', V3IconName>> = {
  preview: 'playDisc',
  document: 'documentText',
};

function FileIcon({ name }: { readonly name: V3IconName }) {
  return (
    <span className="rv-file-ico" aria-hidden="true">
      <Glyph name={name} />
    </span>
  );
}

/**
 * "Preview and documents" (`div.rv-attach` > `h3.rv-mini-h` + `ul.rv-files`): the preview link and
 * each document as a card; a dashed card for what was not sent.
 */
export function RvFileCards({
  title,
  cards,
}: {
  readonly title: ReactNode;
  readonly cards: readonly RvFileCard[];
}) {
  return (
    <div className="rv-attach">
      <RvMiniHeading>{title}</RvMiniHeading>
      <ul className="rv-files">
        {cards.map((fileCard, index) => {
          if (fileCard.kind === 'link') {
            return (
              <li key={index}>
                <a
                  className="rv-filecard rv-filecard--link"
                  href={fileCard.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FileIcon name={FILE_ICON.preview} />
                  <span className="rv-file-text">
                    <span className="rv-file-t">{fileCard.title}</span>
                    <span className="rv-file-d">{fileCard.note}</span>
                  </span>
                  <svg className="rv-file-go" viewBox="0 0 24 24" aria-hidden="true">
                    <path d={V3_ICON_PATHS.externalLink} />
                  </svg>
                </a>
              </li>
            );
          }
          if (fileCard.kind === 'document') {
            return (
              <li key={index} className="rv-filecard">
                <FileIcon name={FILE_ICON.document} />
                <span className="rv-file-text">
                  <span className="rv-file-t">{fileCard.title}</span>
                </span>
              </li>
            );
          }
          return (
            <li
              key={index}
              className={joinClasses(
                'rv-filecard rv-filecard--none',
                fileCard.wide && 'rv-filecard--wide',
              )}
            >
              <FileIcon name={FILE_ICON[fileCard.icon]} />
              <span className="rv-file-text">
                <span className="rv-file-t">{fileCard.title}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ---- formats and delivery ----------------------------------------------------------------------

export interface RvFormatLineProps {
  /** "In this submission". */
  readonly label: ReactNode;
  readonly formats: readonly FormatCode[];
  /** What the badges say, read instead of the codes: "In this submission: WEB and VR". */
  readonly formatsLabel: string;
  /** "Not included: AR, MR" — none when every format is in it. */
  readonly notIncluded?: ReactNode;
}

/**
 * The formats as one compact line (`p.rv-fmtline`): the formats in this submission as badges, the
 * rest named after a separator the row clips at a wrap.
 */
export function RvFormatLine({ label, formats, formatsLabel, notIncluded }: RvFormatLineProps) {
  return (
    <p className="rv-fmtline">
      <span className="rv-fmtline-row">
        <span className="rv-fmtline-in">
          <span className="rv-fmtline-k">{label}</span>
          <RvFormatBadges formats={formats} label={formatsLabel} />
        </span>
        {notIncluded ? <span className="rv-fmtline-out">{notIncluded}</span> : null}
      </span>
    </p>
  );
}

/** "Changed in revision 2" beside a delivery value (`span.rv-tag`). */
export function RvChangedTag({ children }: { readonly children: ReactNode }) {
  return <span className="rv-tag">{children}</span>;
}

/** "Open web link", in a new tab (`a.rb-btn.rv-ext`; the words say so to screen readers). */
export function RvExternalLink({
  href,
  children,
  newTab,
}: {
  readonly href: string;
  readonly children: ReactNode;
  /** " (opens in a new tab)", visually hidden. */
  readonly newTab: string;
}) {
  return (
    <a className="rb-btn rv-ext" href={href} target="_blank" rel="noopener noreferrer">
      <Icon name="externalLink" />
      {children}
      <span className="xr-sr">{newTab}</span>
    </a>
  );
}

export interface RvDeliveryRow {
  readonly term: ReactNode;
  readonly value: ReactNode;
}

export interface RvDeliveryCardProps {
  readonly code: FormatCode;
  /** "Browser", "Virtual reality". */
  readonly title: ReactNode;
  /** "Web link", "App package". */
  readonly kind: ReactNode;
  readonly rows: readonly RvDeliveryRow[];
  /** The card's action (`div.rv-dcard-act`): "Open web link". */
  readonly action?: ReactNode;
  /** A package's details on demand: the toggle and, while open, `div.rv-pkg`. */
  readonly more?: {
    readonly id: string;
    readonly open: boolean;
    readonly showLabel: ReactNode;
    readonly hideLabel: ReactNode;
    readonly rows: readonly RvDeliveryRow[];
    readonly onToggle: () => void;
  };
}

function DeliveryRows({ rows }: { readonly rows: readonly RvDeliveryRow[] }) {
  return (
    <dl className="rk-dl">
      {rows.map((row, index) => (
        <DeliveryRowPair key={index} row={row} />
      ))}
    </dl>
  );
}

function DeliveryRowPair({ row }: { readonly row: RvDeliveryRow }) {
  return (
    <>
      <dt>{row.term}</dt>
      <dd>{row.value}</dd>
    </>
  );
}

/**
 * One read-only card per format (`div.rv-dcard`): the badge, the format's name (with the code for
 * screen readers) and its kind, the delivery fields, and WEB's link or a package's details on
 * demand (`aria-expanded`, `aria-controls`).
 */
export function RvDeliveryCard({ code, title, kind, rows, action, more }: RvDeliveryCardProps) {
  return (
    <div className="rv-dcard">
      <div className="rv-dcard-h">
        <span className="xr-fmt" aria-hidden="true">
          {code}
        </span>
        <h3 className="rv-dcard-t">
          <span className="xr-sr">{`${code}, `}</span>
          {title}
        </h3>
        <span className="rv-dcard-k">{kind}</span>
      </div>
      <DeliveryRows rows={rows} />
      {action ? <div className="rv-dcard-act">{action}</div> : null}
      {more ? (
        <>
          <div className="rv-dcard-act">
            <button
              type="button"
              className="rb-btn"
              aria-expanded={more.open}
              aria-controls={more.id}
              onClick={more.onToggle}
            >
              <Icon name="chevronDown" size={18} />
              {more.open ? more.hideLabel : more.showLabel}
            </button>
          </div>
          {more.open ? (
            <div className="rv-pkg" id={more.id}>
              <DeliveryRows rows={more.rows} />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

/** The delivery cards (`div.rv-deliv`). */
export function RvDeliveryCards({ children }: { readonly children: ReactNode }) {
  return <div className="rv-deliv">{children}</div>;
}

// ---- what changed since the return ---------------------------------------------------------------

/**
 * "What changed in revision N"'s content (`div.rv-chg`): the reason the reviewer gave when returning
 * the earlier revision (`RvQuote`), then the field-by-field comparison (`RvComparison`).
 */
export function RvChangeSet({ children }: { readonly children: ReactNode }) {
  return <div className="rv-chg">{children}</div>;
}

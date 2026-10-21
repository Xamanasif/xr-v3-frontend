/**
 * An experiment's four formats with their states, for the kit's `IaFormatList` (the export's
 * `fmCells` / `fmBadges`): solid with a tick where the plan includes the format (or a student's
 * grant gives it), dashed where it is published but not in the plan, grey where it is not
 * published — always WEB, AR, VR, MR, each with its words for screen readers ("WEB, Browser: In
 * your plan") and the key line under the plan card ("WEB and VR in your plan · AR published, not in
 * your plan · MR not published"). Pure, over what `listContentAccess` and `getAccessPlan` hold
 * (`formats`, `publishedNotInPlan`): a format in neither is not published.
 */
import type { Technology } from '@xr/domain';
import type { FormatCode } from '@xr/ui';

import {
  formatCellWords,
  formatsOfLabel,
  IA_FORMAT_KEY_WORDS,
  IA_FORMAT_STATE_WORDS,
  iaListText,
} from '@/copy/ia-shared';

import { formatCodes } from './format-codes';

const ORDER: readonly FormatCode[] = ['WEB', 'AR', 'VR', 'MR'];

export type IaFormatCellState = 'on' | 'pub' | 'none';

export interface IaFormatCellView {
  readonly format: FormatCode;
  readonly state: IaFormatCellState;
  /** "WEB, Browser: In your plan". */
  readonly words: string;
}

export interface IaFormatCellsView {
  /** The list's name: "Formats of Shell-and-Tube Heat Exchanger". */
  readonly label: string;
  readonly cells: readonly IaFormatCellView[];
  /** The key line in words (`fmBadges` `key`). */
  readonly key: string;
}

/**
 * The cells of one experiment: `inPlan` its plan's formats, `published` the published formats the
 * plan leaves out; `given` words a student's grant ("Given with this grant") instead of the plan.
 */
export function formatCellsView(
  experiment: string,
  inPlan: readonly Technology[],
  published: readonly Technology[],
  { given = false }: { readonly given?: boolean } = {},
): IaFormatCellsView {
  const on = new Set(formatCodes(inPlan));
  const pub = new Set(formatCodes(published));
  const cells = ORDER.map((format): IaFormatCellView => {
    const state: IaFormatCellState = on.has(format) ? 'on' : pub.has(format) ? 'pub' : 'none';
    const stateWords =
      state === 'on'
        ? given
          ? IA_FORMAT_STATE_WORDS.given
          : IA_FORMAT_STATE_WORDS.on
        : IA_FORMAT_STATE_WORDS[state];
    return { format, state, words: formatCellWords(format, stateWords) };
  });
  const key = (['on', 'pub', 'none'] as const)
    .map((state) => ({
      codes: cells.filter((cell) => cell.state === state).map((cell) => cell.format),
      words: IA_FORMAT_KEY_WORDS[state],
    }))
    .filter((part) => part.codes.length > 0)
    .map((part) => `${iaListText(part.codes)} ${part.words}`)
    .join(' · ');
  return { label: formatsOfLabel(experiment), cells, key };
}

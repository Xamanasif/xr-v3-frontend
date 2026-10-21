/**
 * RV-04 "What changes" marks, as the export draws them (RV-v1 `RV.dc.html` `I.cmp`: the live value
 * with what is removed struck through, `<del>`, and the proposed value with what is added
 * highlighted, `<ins>`). The service compares whole values (`correctionComparisonRow`); which words
 * differ is worked out here, from those two values only — presentation, no rule.
 *
 * The values are cut into words, runs of spaces and single marks of punctuation, and the longest
 * common sequence of those pieces is kept plain; what is left on each side is marked. A space
 * between two marked pieces is marked with them, so a changed phrase reads as one mark. A value
 * the other side does not have at all is marked whole; the version is marked whole on both sides,
 * as the export draws it ("1.2" struck, "1.3" highlighted).
 */

/** One run of a value: plain, or marked (struck on the live side, highlighted on the proposed). */
export interface MarkedRun {
  readonly text: string;
  readonly marked: boolean;
}

export interface MarkedPair {
  readonly live: readonly MarkedRun[];
  readonly proposed: readonly MarkedRun[];
}

/** Words (letters and digits), runs of white space, and single other characters. */
function piecesOf(value: string): string[] {
  return value.match(/[\p{L}\p{N}]+|\s+|[^\p{L}\p{N}\s]/gu) ?? [];
}

/** Which pieces of each side belong to their longest common sequence. */
function commonPieces(
  a: readonly string[],
  b: readonly string[],
): { readonly inA: boolean[]; readonly inB: boolean[] } {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const table = new Uint32Array(rows * cols);
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i * cols + j] =
        a[i] === b[j]
          ? table[(i + 1) * cols + j + 1]! + 1
          : Math.max(table[(i + 1) * cols + j]!, table[i * cols + j + 1]!);
    }
  }
  const inA = new Array<boolean>(a.length).fill(false);
  const inB = new Array<boolean>(b.length).fill(false);
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      inA[i] = true;
      inB[j] = true;
      i += 1;
      j += 1;
    } else if (table[(i + 1) * cols + j]! >= table[i * cols + j + 1]!) {
      i += 1;
    } else {
      j += 1;
    }
  }
  return { inA, inB };
}

/** The pieces as runs: neighbours with the same mark joined; a space between two marks marked. */
function runsOf(pieces: readonly string[], kept: readonly boolean[]): MarkedRun[] {
  const marked = kept.map((value) => !value);
  for (let index = 1; index < pieces.length - 1; index += 1) {
    if (!marked[index] && /^\s+$/.test(pieces[index]!) && marked[index - 1] && marked[index + 1]) {
      marked[index] = true;
    }
  }
  const runs: { text: string; marked: boolean }[] = [];
  pieces.forEach((piece, index) => {
    const last = runs.at(-1);
    if (last && last.marked === marked[index]) last.text += piece;
    else runs.push({ text: piece, marked: marked[index]! });
  });
  return runs;
}

/** A whole value, marked or plain; nothing for an empty one. */
function whole(value: string, marked: boolean): MarkedRun[] {
  return value === '' ? [] : [{ text: value, marked }];
}

/** The live and proposed values of one changed field, with what differs marked. */
export function markChanges(
  liveNow: string | null,
  proposed: string | null,
  options: { readonly wholeValue?: boolean } = {},
): MarkedPair {
  const before = liveNow ?? '';
  const after = proposed ?? '';
  if (options.wholeValue || before === '' || after === '') {
    return { live: whole(before, true), proposed: whole(after, true) };
  }
  const a = piecesOf(before);
  const b = piecesOf(after);
  const { inA, inB } = commonPieces(a, b);
  return { live: runsOf(a, inA), proposed: runsOf(b, inB) };
}

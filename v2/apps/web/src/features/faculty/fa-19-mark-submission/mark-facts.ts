import type { AssessmentView } from '@xr/contracts/draft';

/**
 * The pass mark of the version an attempt pins, in marks (state-copy `FA-19.pass-mark`): that
 * version's pass mark (%) of the marks its questions carry, as the domain counts it (`resultView`
 * `passMarkMarks`, unrounded — M22 open). `null` when the version sets no pass mark or is not
 * among the assessment's versions.
 */
export function passMarkOf(
  assessment: AssessmentView['assessment'],
  version: number,
  outOf: number,
): number | null {
  const pinned = assessment.versions.find((entry) => entry.version === version);
  const percent =
    pinned?.rules.passMarkPercent ??
    (assessment.version === version ? assessment.rules.passMarkPercent : null);
  return percent === null || percent === undefined ? null : (percent * outOf) / 100;
}

/**
 * A typed mark as the live total counts it (the export's `whole(v, 0, max)`): a whole number from
 * 0 to the question's marks, else `null` — presentation only; the service checks what is saved.
 */
export function wholeMarkOf(typed: string, max: number): number | null {
  const text = typed.trim();
  if (!/^\d+$/.test(text)) return null;
  const mark = Number(text);
  return mark <= max ? mark : null;
}

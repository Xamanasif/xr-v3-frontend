/**
 * The assessment record frame's words (B4-05 f0, B4-06 f0): the tab names, the header's overline
 * ("ME ZG523 · Shell-and-Tube Heat Exchanger") and its facts ("Due **14 Nov 2026, 23:59**",
 * "**1** waiting for marking").
 */
export const ASSESSMENT_TAB_TITLES = {
  summary: 'Summary',
  questions: 'Questions',
  settings: 'Settings',
  preview: 'Preview',
} as const;

/** "ME ZG523 · Shell-and-Tube Heat Exchanger" (the overline is drawn in capitals by CSS). */
export function assessmentOverline(code: string | null, experimentName: string): string {
  return code ? `${code} · ${experimentName}` : experimentName;
}

export interface HeadFact {
  readonly key: string;
  readonly before: string;
  readonly strong: string;
  readonly after: string;
}

/** The header's facts: the deadline when set, the submissions waiting for marking when any. */
export function assessmentHeadFacts(input: {
  readonly deadline: string | null;
  readonly waiting: number;
}): readonly HeadFact[] {
  return [
    ...(input.deadline ? [{ key: 'due', before: 'Due ', strong: input.deadline, after: '' }] : []),
    ...(input.waiting > 0
      ? [
          {
            key: 'waiting',
            before: '',
            strong: String(input.waiting),
            after: ' waiting for marking',
          },
        ]
      : []),
  ];
}

'use client';

/**
 * ST-16 Format feedback (B3-06): the drawn words of the service's validation answer. A missing
 * rating comes back from `FeedbackService.sendFeedback` as `validation-failed` with one field error
 * per statement (`ratings.<index>`, key `ST-16.rating.required`, `statement` = its number): "Choose
 * a rating" under the statement, "Choose a rating for statement <n>" in the summary, titled "One
 * rating is missing" / "<n> ratings are missing" — the catalogue's own words (B3-06 `submit`).
 * Nothing here decides validity: the form shows what the service answered.
 */
import { summaryTitleFor, toErrorSummary, type ValidationFailed } from '@xr/contracts/draft';

import { fieldWords } from '@/copy/field-words';

/** One statement's missing rating, as the service words it. */
export interface RatingError {
  /** The statement's index (0 … 4); its number in the words is one more. */
  readonly statement: number;
  /** Under the statement: "Choose a rating". */
  readonly message: string;
  /** In the summary: "Choose a rating for statement 2". */
  readonly summaryText: string;
}

const RATING_FIELD = /^ratings\.(\d)$/;

/** The service's rating errors, in statement order. */
export function ratingErrors(error: ValidationFailed): RatingError[] {
  const summary = toErrorSummary(error).items;
  const errors: RatingError[] = [];
  error.fieldErrors.forEach((fieldError, index) => {
    const match = RATING_FIELD.exec(fieldError.field);
    const message = fieldWords(fieldError);
    if (!match || !message) return;
    const statement = Number(match[1]);
    if (errors.some((entry) => entry.statement === statement)) return;
    errors.push({ statement, message, summaryText: summary[index]?.summaryText ?? message });
  });
  return errors.sort((a, b) => a.statement - b.statement);
}

/** "One rating is missing" / "3 ratings are missing", recounted as ratings are chosen. */
export function ratingSummaryTitle(count: number): string {
  return summaryTitleFor('ST-16', count) ?? '';
}

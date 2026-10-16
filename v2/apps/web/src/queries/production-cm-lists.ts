/**
 * The runtime pieces CM-09 Course codes (board B6-10; B6-11 f12) needs from the contracts — features
 * import contracts for types only (Appendix F §3.8): a `validation-failed` answer of
 * `PlatformCourseCodeService.save` turned into each course row’s drawn words (“ME ZG523 is already
 * the code for Thermodynamics & Heat Transfer. Each course needs its own code.”) and the drawn
 * summary title (“Check the codes”).
 */
import { summaryTitleFor, type ValidationFailed } from '@xr/contracts/draft';

import { formFieldErrors, type FormFieldError } from './faculty-forms';

/**
 * Each course’s error, in the order the service reports them. The service names a change by its
 * place in `changes` (`changes.2.code`), or a course it was not sent by the course itself
 * (`courses.<id>`); both are read back to the course id.
 */
export function courseCodeErrors(
  error: ValidationFailed,
  changes: readonly { readonly courseId: string }[],
): FormFieldError<string>[] {
  return formFieldErrors(error, (path) => {
    const change = /^changes\.(\d+)\.(?:code|courseId)$/.exec(path);
    if (change) return changes[Number(change[1])]?.courseId ?? null;
    const course = /^courses\.(.+)$/.exec(path);
    return course ? course[1]! : null;
  });
}

/** “Check the codes” (B6-11 f12 `div.xw-errsum > strong`), the answer’s own title first. */
export function courseCodesSummaryTitle(error: ValidationFailed, count: number): string {
  return error.summaryTitle ?? summaryTitleFor('CM-09', count) ?? '';
}
